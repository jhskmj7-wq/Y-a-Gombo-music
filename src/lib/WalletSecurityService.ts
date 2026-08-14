import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { logAdminAction, logUserActivity } from "./auditLogger";

export type PinStatus = "NOT_CONFIGURED" | "CONFIGURED" | "LOCKED" | "RESET_PENDING";

export interface WalletSecurityData {
  pinConfigured: boolean;
  pinHash?: string;
  pinSalt?: string;
  pinCreatedAt?: string | null;
  pinUpdatedAt?: string | null;
  failedPinAttempts: number;
  lastFailedAttemptAt?: string | null;
  lockedUntil?: string | null;
  pinStatus: PinStatus;
  pinResetRequested?: boolean;
}

// Common weak PINs blacklisted for financial security
const WEAK_PINS_BLACKLIST = new Set([
  "123456", "000000", "111111", "222222", "333333", "444444", "555555", "666666", "777777", "888888", "999999",
  "123123", "654321", "012345", "987654", "112233", "1234567", "0123456", "6543210", "121212", "696969",
  "123321", "111222", "000111", "543210", "135791", "246802"
]);

export class WalletSecurityService {
  /**
   * Validate strength of a proposed PIN (minimum 6 digits, no weak sequences)
   */
  static validatePinStrength(pin: string): { valid: boolean; reason?: string } {
    if (!pin || typeof pin !== "string") {
      return { valid: false, reason: "Le code PIN est obligatoire." };
    }

    // Must be numeric and at least 6 digits
    if (!/^\d{6,8}$/.test(pin)) {
      return { valid: false, reason: "Le code PIN doit comporter au moins 6 chiffres." };
    }

    if (WEAK_PINS_BLACKLIST.has(pin)) {
      return { valid: false, reason: "Ce code PIN est trop évidents ou facile à deviner. Choisissez un code plus robuste." };
    }

    // Check all identical digits (e.g. 444444)
    const allSame = /^(\d)\1+$/.test(pin);
    if (allSame) {
      return { valid: false, reason: "Le code PIN ne peut pas être composé d'un même chiffre répété." };
    }

    // Check strictly sequential ascending (e.g. 123456)
    let isSequentialAsc = true;
    let isSequentialDesc = true;
    for (let i = 0; i < pin.length - 1; i++) {
      const curr = parseInt(pin[i], 10);
      const next = parseInt(pin[i + 1], 10);
      if (next !== curr + 1) isSequentialAsc = false;
      if (next !== curr - 1) isSequentialDesc = false;
    }

    if (isSequentialAsc || isSequentialDesc) {
      return { valid: false, reason: "Les séquences numériques consécutives sont trop faibles." };
    }

    return { valid: true };
  }

  /**
   * Generate cryptographic salt
   */
  private static generateSalt(): string {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Hash PIN securely using SHA-256 + Salt + UID
   */
  static async hashPin(pin: string, salt: string, uid: string): Promise<string> {
    const encoder = new TextEncoder();
    const secretPayload = `AFRIGOMBO_PIN_SALT_v2:${uid}:${salt}:${pin}`;
    const data = encoder.encode(secretPayload);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Fetch current wallet security status from user document
   */
  static async getWalletSecurityStatus(uid: string): Promise<WalletSecurityData> {
    if (!uid) {
      return {
        pinConfigured: false,
        failedPinAttempts: 0,
        pinStatus: "NOT_CONFIGURED"
      };
    }

    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        return {
          pinConfigured: false,
          failedPinAttempts: 0,
          pinStatus: "NOT_CONFIGURED"
        };
      }

      const data = snap.data();
      const sec = data.walletSecurity || data.paymentSettings || {};

      const pinConfigured = !!(sec.pinHash || sec.pinConfigured);
      const failedPinAttempts = sec.failedPinAttempts || 0;
      const lockedUntil = sec.lockedUntil || null;
      const pinResetRequested = !!sec.pinResetRequested;

      let pinStatus: PinStatus = "NOT_CONFIGURED";
      if (pinResetRequested) {
        pinStatus = "RESET_PENDING";
      } else if (lockedUntil && new Date(lockedUntil).getTime() > Date.now()) {
        pinStatus = "LOCKED";
      } else if (pinConfigured) {
        pinStatus = "CONFIGURED";
      }

      return {
        pinConfigured,
        pinHash: sec.pinHash,
        pinSalt: sec.pinSalt,
        pinCreatedAt: sec.pinCreatedAt || null,
        pinUpdatedAt: sec.pinUpdatedAt || null,
        failedPinAttempts,
        lastFailedAttemptAt: sec.lastFailedAttemptAt || null,
        lockedUntil,
        pinStatus,
        pinResetRequested
      };
    } catch (err) {
      console.error("Error loading wallet security status:", err);
      return {
        pinConfigured: false,
        failedPinAttempts: 0,
        pinStatus: "NOT_CONFIGURED"
      };
    }
  }

  /**
   * Create initial PIN for wallet
   */
  static async createPin(uid: string, pin: string): Promise<{ success: boolean; error?: string }> {
    const strength = this.validatePinStrength(pin);
    if (!strength.valid) {
      return { success: false, error: strength.reason };
    }

    try {
      const salt = this.generateSalt();
      const pinHash = await this.hashPin(pin, salt, uid);
      const now = new Date().toISOString();

      await setDoc(doc(db, "users", uid), {
        walletSecurity: {
          pinConfigured: true,
          pinHash,
          pinSalt: salt,
          pinCreatedAt: now,
          pinUpdatedAt: now,
          failedPinAttempts: 0,
          lockedUntil: null,
          lastFailedAttemptAt: null,
          pinResetRequested: false,
          pinStatus: "CONFIGURED"
        },
        paymentSettings: {
          pinEnabled: true,
          pinConfigured: true
        }
      }, { merge: true });

      await logUserActivity({
        uid,
        type: "MODIFICATION_PIN",
        result: "SUCCESS",
        details: "Création initiale du PIN Wallet sécurisé"
      });

      return { success: true };
    } catch (err: any) {
      console.error("Error creating PIN:", err);
      return { success: false, error: "Impossible de sauvegarder le code PIN. Réessayez." };
    }
  }

  /**
   * Verify entered PIN against stored salt/hash with anti-brute-force rate limiting
   */
  static async verifyPin(uid: string, enteredPin: string): Promise<{
    result: "PIN_VALID" | "PIN_INVALID" | "PIN_LOCKED" | "PIN_NOT_CONFIGURED" | "PIN_RESET_PENDING";
    message: string;
    attemptsRemaining?: number;
    lockedMinutesRemaining?: number;
  }> {
    if (!uid) {
      return { result: "PIN_NOT_CONFIGURED", message: "Utilisateur non identifié." };
    }

    const secStatus = await this.getWalletSecurityStatus(uid);

    if (secStatus.pinResetRequested) {
      return {
        result: "PIN_RESET_PENDING",
        message: "Une réinitialisation du PIN est en attente. Veuillez réinitialiser votre PIN via votre compte."
      };
    }

    if (!secStatus.pinConfigured || !secStatus.pinHash) {
      return { result: "PIN_NOT_CONFIGURED", message: "Aucun code PIN configuré." };
    }

    // Check lock
    if (secStatus.lockedUntil) {
      const lockTime = new Date(secStatus.lockedUntil).getTime();
      const now = Date.now();
      if (lockTime > now) {
        const minsLeft = Math.ceil((lockTime - now) / 60000);
        return {
          result: "PIN_LOCKED",
          message: `Wallet temporairement verrouillé pour des raisons de sécurité. Réessayez dans ${minsLeft} minute(s).`,
          lockedMinutesRemaining: minsLeft
        };
      }
    }

    // Compute hash with salt (or fallback to UID if old legacy format)
    const salt = secStatus.pinSalt || uid;
    const computedHash = await this.hashPin(enteredPin, salt, uid);

    if (computedHash === secStatus.pinHash) {
      // SUCCESS: Reset failed attempts
      await setDoc(doc(db, "users", uid), {
        walletSecurity: {
          failedPinAttempts: 0,
          lockedUntil: null,
          lastFailedAttemptAt: null,
          pinStatus: "CONFIGURED"
        }
      }, { merge: true });

      return { result: "PIN_VALID", message: "PIN valide." };
    }

    // FAILED ATTEMPT: Increment brute-force counter
    const currentAttempts = (secStatus.failedPinAttempts || 0) + 1;
    const nowIso = new Date().toISOString();

    let lockedUntil: string | null = null;
    let lockMins = 0;

    if (currentAttempts >= 5) {
      lockMins = 60; // 1 hour lock
      lockedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    } else if (currentAttempts >= 3) {
      lockMins = 15; // 15 min lock
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }

    await setDoc(doc(db, "users", uid), {
      walletSecurity: {
        failedPinAttempts: currentAttempts,
        lastFailedAttemptAt: nowIso,
        lockedUntil,
        pinStatus: lockedUntil ? "LOCKED" : "CONFIGURED"
      }
    }, { merge: true });

    await logUserActivity({
      uid,
      type: "TENTATIVE_PIN_ECHOUEE",
      result: "FAILED",
      details: `Tentative de PIN incorrecte (${currentAttempts} tentative(s))`
    });

    if (lockedUntil) {
      await logUserActivity({
        uid,
        type: "WALLET_VERROUILLE",
        result: "LOCKED",
        details: `Wallet verrouillé pendant ${lockMins} minutes suite à plusieurs erreurs de PIN`
      });

      return {
        result: "PIN_LOCKED",
        message: `Trop de tentatives incorrectes. Le Wallet est verrouillé pour ${lockMins} minutes.`,
        lockedMinutesRemaining: lockMins
      };
    }

    const remaining = 3 - currentAttempts;
    return {
      result: "PIN_INVALID",
      message: `Code PIN incorrect. (${remaining > 0 ? remaining + ' tentative(s) restante(s)' : 'Dernière tentative !'})`,
      attemptsRemaining: remaining > 0 ? remaining : 0
    };
  }

  /**
   * Change PIN with verification of old PIN
   */
  static async changePin(uid: string, currentPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
    const verifyRes = await this.verifyPin(uid, currentPin);
    if (verifyRes.result !== "PIN_VALID") {
      return { success: false, error: verifyRes.message };
    }

    const strength = this.validatePinStrength(newPin);
    if (!strength.valid) {
      return { success: false, error: strength.reason };
    }

    try {
      const salt = this.generateSalt();
      const pinHash = await this.hashPin(newPin, salt, uid);
      const now = new Date().toISOString();

      await setDoc(doc(db, "users", uid), {
        walletSecurity: {
          pinConfigured: true,
          pinHash,
          pinSalt: salt,
          pinUpdatedAt: now,
          failedPinAttempts: 0,
          lockedUntil: null,
          pinResetRequested: false,
          pinStatus: "CONFIGURED"
        }
      }, { merge: true });

      await logUserActivity({
        uid,
        type: "MODIFICATION_PIN",
        result: "SUCCESS",
        details: "Modification réussie du PIN Wallet"
      });

      return { success: true };
    } catch (err: any) {
      console.error("Error changing PIN:", err);
      return { success: false, error: "Erreur lors de la mise à jour du PIN." };
    }
  }

  /**
   * Secure Forgot PIN recovery following re-authentication
   */
  static async resetPinAfterReauth(uid: string, newPin: string): Promise<{ success: boolean; error?: string }> {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== uid) {
      return { success: false, error: "Non autorisé. Veuillez vous réauthentifier." };
    }

    const strength = this.validatePinStrength(newPin);
    if (!strength.valid) {
      return { success: false, error: strength.reason };
    }

    try {
      const salt = this.generateSalt();
      const pinHash = await this.hashPin(newPin, salt, uid);
      const now = new Date().toISOString();

      await setDoc(doc(db, "users", uid), {
        walletSecurity: {
          pinConfigured: true,
          pinHash,
          pinSalt: salt,
          pinUpdatedAt: now,
          failedPinAttempts: 0,
          lockedUntil: null,
          lastFailedAttemptAt: null,
          pinResetRequested: false,
          pinStatus: "CONFIGURED"
        }
      }, { merge: true });

      await logUserActivity({
        uid,
        type: "REINITIALISATION_PIN",
        result: "SUCCESS",
        details: "Réinitialisation sécurisée du PIN Wallet après réauthentification"
      });

      return { success: true };
    } catch (err: any) {
      console.error("Error resetting PIN:", err);
      return { success: false, error: "Erreur lors de la réinitialisation du PIN." };
    }
  }

  /**
   * Super Founder Action: Lock Wallet
   */
  static async adminLockWallet(adminUid: string, targetUid: string, reason: string): Promise<void> {
    const nowIso = new Date().toISOString();
    // Lock for 100 years
    const farFuture = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();

    await setDoc(doc(db, "users", targetUid), {
      walletSecurity: {
        lockedUntil: farFuture,
        pinStatus: "LOCKED"
      },
      wallet: {
        walletStatus: "suspended"
      }
    }, { merge: true });

    await logAdminAction({
      adminUid,
      adminEmail: auth.currentUser?.email || "superfounder@afrigombo.com",
      action: "WALLET_VERROUILLE",
      targetUserId: targetUid,
      reason: reason || "Verrouillage administratif du Wallet"
    });

    await logUserActivity({
      uid: targetUid,
      type: "WALLET_VERROUILLE",
      result: "ADMIN_ACTION",
      details: `Wallet verrouillé par le Super Fondateur (${reason})`
    });
  }

  /**
   * Super Founder Action: Unlock Wallet
   */
  static async adminUnlockWallet(adminUid: string, targetUid: string, reason: string): Promise<void> {
    await setDoc(doc(db, "users", targetUid), {
      walletSecurity: {
        lockedUntil: null,
        failedPinAttempts: 0,
        pinStatus: "CONFIGURED"
      },
      wallet: {
        walletStatus: "active"
      }
    }, { merge: true });

    await logAdminAction({
      adminUid,
      adminEmail: auth.currentUser?.email || "superfounder@afrigombo.com",
      action: "WALLET_DEVERROUILLE",
      targetUserId: targetUid,
      reason: reason || "Déverrouillage administratif du Wallet"
    });

    await logUserActivity({
      uid: targetUid,
      type: "WALLET_DEVERROUILLE",
      result: "ADMIN_ACTION",
      details: `Wallet déverrouillé par le Super Fondateur (${reason})`
    });
  }

  /**
   * Super Founder Action: Trigger PIN Reset Request
   * Note: Super Founder NEVER sets or sees the user's PIN!
   */
  static async adminRequestPinReset(adminUid: string, targetUid: string, reason: string): Promise<void> {
    await setDoc(doc(db, "users", targetUid), {
      walletSecurity: {
        pinResetRequested: true,
        pinStatus: "RESET_PENDING"
      }
    }, { merge: true });

    await logAdminAction({
      adminUid,
      adminEmail: auth.currentUser?.email || "superfounder@afrigombo.com",
      action: "REINITIALISATION_PIN_DEMANDEE",
      targetUserId: targetUid,
      reason: reason || "Demande de réinitialisation PIN déclenchée par l'administration"
    });

    await logUserActivity({
      uid: targetUid,
      type: "REINITIALISATION_PIN",
      result: "RESET_REQUESTED",
      details: "Réinitialisation du PIN demandée par le Super Fondateur"
    });
  }
}
