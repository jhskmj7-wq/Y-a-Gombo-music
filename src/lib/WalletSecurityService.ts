import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { logAdminAction, logUserActivity } from "./auditLogger";

export type PinStatus = "NOT_CONFIGURED" | "CONFIGURED" | "LOCKED" | "RESET_PENDING";

export interface WalletSecurityData {
  pinConfigured: boolean;
  pinHash?: string;
  pinSalt?: string;
  pinLength?: number;
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
  // 6 digits
  "123456", "000000", "111111", "222222", "333333", "444444", "555555", "666666", "777777", "888888", "999999",
  "123123", "654321", "012345", "987654", "112233", "1234567", "0123456", "6543210", "121212", "696969",
  "123321", "111222", "000111", "543210", "135791", "246802",
  // 4 digits
  "1234", "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999",
  "4321", "2580", "1379", "1212", "6969", "1122", "2211", "0123", "3210", "2000", "2024", "2025", "2026", "1004", "1470"
]);

export class WalletSecurityService {
  /**
   * Validate strength of a proposed PIN (supports 4 or 6 digits, no weak sequences)
   */
  static validatePinStrength(pin: string, requiredLength?: number): { valid: boolean; reason?: string } {
    if (!pin || typeof pin !== "string") {
      return { valid: false, reason: "Le code PIN est obligatoire." };
    }

    if (requiredLength) {
      if (pin.length !== requiredLength || !/^\d+$/.test(pin)) {
        return { valid: false, reason: `Le code PIN doit comporter exactement ${requiredLength} chiffres.` };
      }
    } else {
      // Must be numeric and either 4 or 6-8 digits
      if (!/^\d{4,8}$/.test(pin)) {
        return { valid: false, reason: "Le code PIN doit comporter 4 ou 6 chiffres." };
      }
    }

    if (WEAK_PINS_BLACKLIST.has(pin)) {
      return { valid: false, reason: "Ce code PIN est trop évident ou facile à deviner. Choisissez un code plus robuste." };
    }

    // Check all identical digits (e.g. 4444 or 444444)
    const allSame = /^(\d)\1+$/.test(pin);
    if (allSame) {
      return { valid: false, reason: "Le code PIN ne peut pas être composé d'un même chiffre répété." };
    }

    // Check strictly sequential ascending (e.g. 1234 or 123456)
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
  
  /**
   * Request a PIN reset manually (contacts SAO)
   */
  static async requestPinReset(uid: string): Promise<void> {
    await updateDoc(doc(db, "users", uid), {
      "walletSecurity.pinResetRequested": true,
      "walletSecurity.saoAssistancePending": true,
      "walletSecurity.pinStatus": "RESET_PENDING"
    });
    
    // Create an assistance ticket
    await addDoc(collection(db, "support_tickets"), {
      userId: uid,
      subject: "Demande de réinitialisation de PIN Wallet",
      status: "open",
      createdAt: new Date().toISOString(),
      type: "SECURITY_ASSISTANCE"
    });
  }

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

      const pinLength = sec.pinLength || (sec.pinHash ? 6 : 6);

      return {
        pinConfigured,
        pinHash: sec.pinHash,
        pinSalt: sec.pinSalt,
        pinLength,
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
   * Safe parser helper that handles JSON and HTML/text error responses gracefully
   */
  private static async safeFetchJson(url: string, options: RequestInit): Promise<{ ok: boolean; status: number; data: any }> {
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          const data = await response.json();
          return { ok: response.ok, status: response.status, data };
        } catch (e: any) {
          return {
            ok: false,
            status: response.status,
            data: { success: false, error: "Réponse serveur invalide (JSON corrompu)." }
          };
        }
      } else {
        const rawText = await response.text();
        return {
          ok: false,
          status: response.status,
          data: {
            success: false,
            error: `Le serveur a retourné une réponse non-JSON (${response.status}) : ${rawText.substring(0, 100)}`
          }
        };
      }
    } catch (netErr: any) {
      return {
        ok: false,
        status: 0,
        data: { success: false, error: netErr.message || "Erreur de connexion réseau au serveur." }
      };
    }
  }

  /**
   * Create initial PIN for wallet using secure backend hashing.
   */
  static async createPin(uid: string, pin: string): Promise<{ success: boolean; error?: string }> {
    const strength = this.validatePinStrength(pin);
    if (!strength.valid) {
      return { success: false, error: strength.reason };
    }

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentification requise.");

      const { ok, data } = await this.safeFetchJson("/api/wallet/set-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, pin, pinLength: pin.length })
      });

      if (!ok || data.error) {
        throw new Error(data.error || "Erreur lors de la création du code PIN.");
      }

      return { success: true };
    } catch (err: any) {
      console.error("Error creating PIN:", err);
      return { success: false, error: err.message || "Impossible de sauvegarder le code PIN. Réessayez." };
    }
  }

  /**
   * Verify entered PIN against stored salt/hash with anti-brute-force rate limiting
   */
  
  /**
   * Verify PIN inside a Firestore Transaction to guarantee atomic security.
   */
  static async verifyPinTransaction(transaction: any, uid: string, enteredPin?: string): Promise<void> {
    const userRef = doc(db, "users", uid);
    const snap = await transaction.get(userRef);
    if (!snap.exists()) throw new Error("Utilisateur introuvable");
    
    const data = snap.data();
    const sec = data.walletSecurity || data.paymentSettings || {};
    
    const pinConfigured = !!(sec.pinHash || sec.pinConfigured);
    const lockedUntil = sec.lockedUntil || null;
    
    if (lockedUntil && new Date(lockedUntil).getTime() > Date.now()) {
      throw new Error("Wallet temporairement verrouillé suite à de multiples échecs.");
    }
    
    if (sec.pinResetRequested) {
      throw new Error("Une réinitialisation du PIN est en attente. Opération bloquée.");
    }

    if (!pinConfigured) {
      return; // No PIN configured, allowed to proceed.
    }

    if (!enteredPin) {
      throw new Error("Authentification Wallet (PIN) requise pour cette opération.");
    }

    const hashedInput = await this.hashPin(enteredPin, sec.pinSalt, uid);
    if (hashedInput !== sec.pinHash) {
      throw new Error("Code PIN Wallet incorrect.");
    }
  }

  /**
   * Verify entered PIN against stored salt/hash with anti-brute-force rate limiting.
   * Now performs server-side verification for enhanced security.
   */
  static async verifyPin(uid: string, enteredPin: string, action = "SENSITIVE_OP"): Promise<{
    result: "PIN_VALID" | "PIN_INVALID" | "PIN_LOCKED" | "PIN_NOT_CONFIGURED" | "PIN_RESET_PENDING";
    message: string;
    attemptsRemaining?: number;
    lockedMinutesRemaining?: number;
    sessionToken?: string;
  }> {
    if (!uid) {
      return { result: "PIN_NOT_CONFIGURED", message: "Utilisateur non identifié." };
    }

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Session expirée. Veuillez vous reconnecter.");

      const { ok, data } = await this.safeFetchJson("/api/wallet/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, pin: enteredPin, action })
      });
      
      if (!ok) {
        if (data.result === "PIN_LOCKED") {
           return {
             result: "PIN_LOCKED",
             message: data.error || "Wallet verrouillé.",
             lockedMinutesRemaining: data.lockedMinutesRemaining
           };
        }
        return {
          result: data.result || "PIN_INVALID",
          message: data.error || "Code PIN incorrect.",
          attemptsRemaining: data.attemptsRemaining
        };
      }

      return {
        result: "PIN_VALID",
        message: "Code PIN vérifié avec succès.",
        sessionToken: data.sessionToken
      };
    } catch (err: any) {
      console.error("verifyPin error:", err);
      return { 
        result: "PIN_INVALID", 
        message: err.message || "Erreur de communication avec le serveur de sécurité." 
      };
    }
  }

  /**
   * Change PIN with verification of old PIN via backend API
   */
  static async changePin(uid: string, currentPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
    const strength = this.validatePinStrength(newPin);
    if (!strength.valid) {
      return { success: false, error: strength.reason };
    }

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentification requise.");

      const { ok, data } = await this.safeFetchJson("/api/wallet/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, currentPin, newPin })
      });

      if (!ok || data.error) {
        throw new Error(data.error || "Erreur lors du changement de PIN.");
      }

      return { success: true };
    } catch (err: any) {
      console.error("Error changing PIN:", err);
      return { success: false, error: err.message || "Erreur lors de la mise à jour du PIN." };
    }
  }

  /**
   * Disable PIN with verification of current PIN via backend API
   */
  static async disablePin(uid: string, currentPin: string): Promise<{ success: boolean; error?: string }> {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentification requise.");

      const { ok, data } = await this.safeFetchJson("/api/wallet/disable-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, currentPin })
      });

      if (!ok || data.error) {
        throw new Error(data.error || "Erreur lors de la désactivation du PIN.");
      }

      return { success: true };
    } catch (err: any) {
      console.error("Error disabling PIN:", err);
      return { success: false, error: err.message || "Erreur lors de la désactivation du PIN." };
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
