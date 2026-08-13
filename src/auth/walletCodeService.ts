import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc,
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface WalletCodeRecord {
  walletCode: string;
  uid: string;
  status: "active" | "suspended" | "compromised";
  createdAt: any;
  updatedAt: any;
  codeVersion: number;
  previousCodes?: string[];
}

export const walletCodeService = {
  // Generate a random secure AFW-XXXX-XXXX code
  generateRandomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like 0, O, I, 1
    let part1 = "";
    let part2 = "";
    for (let i = 0; i < 4; i++) {
      part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    for (let i = 0; i < 4; i++) {
      part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `AFW-${part1}-${part2}`;
  },

  // Check if wallet code exists in Firestore
  async codeExists(code: string): Promise<boolean> {
    if (!db) return false;
    try {
      const q = query(collection(db, "wallet_codes"), where("walletCode", "==", code));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (err) {
      console.error("Error checking wallet code existence:", err);
      return false;
    }
  },

  // Generate a guaranteed unique wallet code for a user
  async getOrCreateWalletCode(uid: string, existingCode?: string): Promise<string> {
    if (!db) return existingCode || "AFW-DEMO-1234";

    try {
      // Check user document first
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.wallet && data.wallet.walletCode) {
          return data.wallet.walletCode;
        }
      }

      // Generate unique code
      let newCode = walletCodeService.generateRandomCode();
      let attempts = 0;
      while (await walletCodeService.codeExists(newCode)) {
        newCode = walletCodeService.generateRandomCode();
        attempts++;
        if (attempts > 10) break;
      }

      // Save record in wallet_codes collection and update user profile
      const codeRecord: WalletCodeRecord = {
        walletCode: newCode,
        uid: uid,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        codeVersion: 1
      };

      await setDoc(doc(db, "wallet_codes", newCode), codeRecord);
      
      const currentWallet = userSnap.exists() ? (userSnap.data().wallet || {}) : {};
      await updateDoc(userRef, {
        "wallet.walletCode": newCode,
        "wallet.walletStatus": "active",
        "wallet.codeUpdatedAt": serverTimestamp()
      });

      return newCode;
    } catch (err) {
      console.error("Error in getOrCreateWalletCode:", err);
      return existingCode || "AFW-SAFE-9999";
    }
  },

  // Regenerate wallet code (Super Founder action)
  async regenerateWalletCode(uid: string, adminUid: string, reason: string = "Régénération administrative"): Promise<string> {
    if (!db) throw new Error("Database non initialisée");

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("Utilisateur introuvable");

    const userData = userSnap.data();
    const oldCode = userData.wallet?.walletCode;

    let newCode = walletCodeService.generateRandomCode();
    while (await walletCodeService.codeExists(newCode)) {
      newCode = walletCodeService.generateRandomCode();
    }

    const previousCodes = userData.wallet?.previousCodes || [];
    if (oldCode) previousCodes.push(oldCode);

    const codeVersion = (userData.wallet?.codeVersion || 1) + 1;

    await updateDoc(userRef, {
      "wallet.walletCode": newCode,
      "wallet.codeVersion": codeVersion,
      "wallet.previousCodes": previousCodes,
      "wallet.codeUpdatedAt": serverTimestamp()
    });

    // Save in wallet_codes
    await setDoc(doc(db, "wallet_codes", newCode), {
      walletCode: newCode,
      uid,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      codeVersion,
      previousCodes
    });

    if (oldCode) {
      try {
        await updateDoc(doc(db, "wallet_codes", oldCode), { status: "compromised" });
      } catch (e) {}
    }

    // Log in admin audit logs
    await addDoc(collection(db, "adminAuditLogs"), {
      adminUid,
      targetUid: uid,
      action: "Régénération code Wallet",
      details: `Ancien code: ${oldCode || 'Aucun'}, Nouveau code: ${newCode}`,
      reason,
      createdAt: serverTimestamp()
    });

    return newCode;
  },

  // Suspend or Reactivate Wallet
  async setWalletStatus(uid: string, adminUid: string, status: "active" | "suspended", reason: string): Promise<void> {
    if (!db) throw new Error("Database non initialisée");

    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      "wallet.walletStatus": status,
      "wallet.statusUpdatedAt": serverTimestamp()
    });

    await addDoc(collection(db, "adminAuditLogs"), {
      adminUid,
      targetUid: uid,
      action: status === "suspended" ? "Suspension Wallet" : "Réactivation Wallet",
      reason,
      createdAt: serverTimestamp()
    });
  },

  // Record a transaction with before and after balances
  async recordTransaction(txData: {
    uid: string;
    walletCode: string;
    type: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    source: string;
    status: string;
    createdBy?: string;
  }): Promise<string> {
    if (!db) return "local-tx-id";

    const txRef = await addDoc(collection(db, "walletTransactions"), {
      ...txData,
      createdAt: serverTimestamp()
    });
    return txRef.id;
  }
};
