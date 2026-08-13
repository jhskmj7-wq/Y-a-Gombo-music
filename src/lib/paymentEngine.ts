import { db } from "./firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { getCanonicalWalletBalance } from "./financial";

export interface PaymentOptions {
  userId: string;
  userName?: string;
  amount: number;
  module: 
    | "avatar" 
    | "boost" 
    | "premium" 
    | "trend" 
    | "marketplace" 
    | "academie" 
    | "cagnottes" 
    | "events" 
    | "services" 
    | string;
  reason: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  txId?: string;
  balanceAfter?: number;
  insufficientBalance?: boolean;
  currentBalance?: number;
  missingAmount?: number;
  error?: string;
}

export class PaymentEngineClass {
  /**
   * Helper to fetch canonical wallet balance, perform safety sync on legacy fields,
   * or complete smooth, idempotent migration from old fields if needed.
   */
  async getCanonicalBalanceAndSync(userId: string, userData: any, userRef: any): Promise<number> {
    const currentBest = getCanonicalWalletBalance(userData);

    // Sync all 3 balance fields if any of them differs from currentBest
    if (
      userData?.wallet?.soldeDisponible !== currentBest ||
      userData?.walletBalance !== currentBest ||
      userData?.balance !== currentBest
    ) {
      console.log(`[PaymentEngine] Syncing all balance fields to canonical value: ${currentBest}`);
      try {
        await updateDoc(userRef, {
          "wallet.soldeDisponible": currentBest,
          walletBalance: currentBest,
          balance: currentBest,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error("[PaymentEngine] Sync warning:", e);
      }
    }

    return currentBest;
  }

  /**
   * Check if user has enough balance in Wallet.
   */
  async checkBalance(userId: string, amount: number): Promise<{ canPay: boolean; currentBalance: number; missingAmount: number }> {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return { canPay: false, currentBalance: 0, missingAmount: amount };
      }
      const data = userSnap.data();
      const currentBalance = await this.getCanonicalBalanceAndSync(userId, data, userRef);
      const canPay = currentBalance >= amount;
      const missingAmount = canPay ? 0 : amount - currentBalance;
      return { canPay, currentBalance, missingAmount };
    } catch (err) {
      console.error("Error checking wallet balance:", err);
      return { canPay: false, currentBalance: 0, missingAmount: amount };
    }
  }

  /**
   * Process a purchase/debit through the single unique Payment Engine.
   * Checks balance first. If sufficient, debits and logs transaction.
   * If insufficient, returns insufficientBalance = true without debiting.
   */
  async processPayment(options: PaymentOptions): Promise<PaymentResult> {
    const { userId, userName = "Membre Gombo", amount, module, reason, metadata = {} } = options;

    if (!userId) {
      return { success: false, error: "ID utilisateur non fourni." };
    }

    if (amount < 0) {
      return { success: false, error: "Montant invalide." };
    }

    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return { success: false, error: "Utilisateur introuvable." };
      }

      const userData = userSnap.data();
      if (userData?.walletBlocked) {
        return { success: false, error: "Votre Wallet est actuellement bloqué. Veuillez contacter le support." };
      }

      const currentBalance = await this.getCanonicalBalanceAndSync(userId, userData, userRef);

      if (currentBalance < amount) {
        return {
          success: false,
          insufficientBalance: true,
          currentBalance,
          missingAmount: amount - currentBalance,
          error: "Solde insuffisant."
        };
      }

      const balanceAfter = currentBalance - amount;
      const now = new Date();
      const txId = `tx_${module}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      // Update User Wallet in Firestore synchronously across all three fields
      await updateDoc(userRef, {
        walletBalance: balanceAfter,
        balance: balanceAfter,
        "wallet.soldeDisponible": balanceAfter,
        updatedAt: now.toISOString()
      });

      // Record in walletTransactions and transactions
      const txRecord = {
        id: txId,
        reference: txId,
        userId,
        uid: userId,
        userName: userName || userData?.name || userData?.firstName || "Membre Gombo",
        amount,
        type: "purchase",
        module,
        reason,
        description: reason,
        balanceBefore: currentBalance,
        balanceAfter,
        status: "success",
        createdAt: now.toISOString(),
        date: now.toLocaleDateString("fr-FR"),
        heure: now.toLocaleTimeString("fr-FR"),
        timestamp: Date.now(),
        metadata
      };

      await setDoc(doc(db, "walletTransactions", txId), txRecord);
      await setDoc(doc(db, "transactions", txId), txRecord);

      return {
        success: true,
        txId,
        balanceAfter
      };
    } catch (err: any) {
      console.error("PaymentEngine.processPayment error:", err);
      return {
        success: false,
        error: err?.message || "Erreur lors du traitement du paiement."
      };
    }
  }

  /**
   * Refund a payment (Total or Partial).
   */
  async refundPayment(options: {
    userId: string;
    amount: number;
    reason: string;
    txId?: string;
    adminEmail?: string;
  }): Promise<{ success: boolean; balanceAfter?: number; error?: string }> {
    const { userId, amount, reason, txId, adminEmail = "SuperFondateur" } = options;

    if (!userId || amount <= 0) {
      return { success: false, error: "Paramètres de remboursement invalides." };
    }

    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return { success: false, error: "Utilisateur introuvable pour le remboursement." };
      }

      const userData = userSnap.data();
      const currentBalance = await this.getCanonicalBalanceAndSync(userId, userData, userRef);
      const balanceAfter = currentBalance + amount;
      const now = new Date();
      const refundId = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      await updateDoc(userRef, {
        walletBalance: balanceAfter,
        balance: balanceAfter,
        "wallet.soldeDisponible": balanceAfter,
        updatedAt: now.toISOString()
      });

      const refundRecord = {
        id: refundId,
        originalTxId: txId || "",
        userId,
        uid: userId,
        userName: userData?.name || userData?.firstName || "Membre Gombo",
        amount,
        type: "refund",
        reason,
        description: `Remboursement: ${reason}`,
        balanceBefore: currentBalance,
        balanceAfter,
        status: "success",
        processedBy: adminEmail,
        createdAt: now.toISOString(),
        date: now.toLocaleDateString("fr-FR"),
        heure: now.toLocaleTimeString("fr-FR"),
        timestamp: Date.now()
      };

      await setDoc(doc(db, "walletRefunds", refundId), refundRecord);
      await setDoc(doc(db, "walletTransactions", refundId), refundRecord);
      await setDoc(doc(db, "transactions", refundId), refundRecord);

      if (txId) {
        try {
          await updateDoc(doc(db, "transactions", txId), {
            refunded: true,
            refundId: refundId,
            updatedAt: now.toISOString()
          });
        } catch (e) {
          console.warn("Could not mark original tx as refunded in transactions:", e);
        }
        try {
          await updateDoc(doc(db, "walletTransactions", txId), {
            refunded: true,
            refundId: refundId,
            updatedAt: now.toISOString()
          });
        } catch (e) {
          console.warn("Could not mark original tx as refunded in walletTransactions:", e);
        }
      }

      return { success: true, balanceAfter };
    } catch (err: any) {
      console.error("PaymentEngine.refundPayment error:", err);
      return { success: false, error: err?.message || "Erreur lors du remboursement." };
    }
  }

  /**
   * Credit, Debit, or Set balance directly by Super Founder.
   */
  async adminAdjustWallet(options: {
    userId: string;
    amount: number;
    action: "credit" | "debit" | "set";
    reason: string;
    adminEmail?: string;
  }): Promise<{ success: boolean; balanceAfter?: number; error?: string }> {
    const { userId, amount, action, reason, adminEmail = "SuperFondateur" } = options;

    if (!userId) return { success: false, error: "ID utilisateur requis." };

    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return { success: false, error: "Utilisateur non trouvé." };

      const userData = userSnap.data();
      const currentBalance = await this.getCanonicalBalanceAndSync(userId, userData, userRef);

      let balanceAfter = currentBalance;
      if (action === "credit") balanceAfter = currentBalance + amount;
      else if (action === "debit") balanceAfter = Math.max(0, currentBalance - amount);
      else if (action === "set") balanceAfter = Math.max(0, amount);

      const now = new Date();
      const adjId = `adj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      await updateDoc(userRef, {
        walletBalance: balanceAfter,
        balance: balanceAfter,
        "wallet.soldeDisponible": balanceAfter,
        updatedAt: now.toISOString()
      });

      const adjRecord = {
        id: adjId,
        userId,
        uid: userId,
        userName: userData?.name || userData?.firstName || "Membre Gombo",
        action,
        amount,
        type: action === "credit" ? "deposit" : action === "debit" ? "purchase" : "adjustment",
        reason,
        description: `Ajustement Admin (${action}): ${reason}`,
        balanceBefore: currentBalance,
        balanceAfter,
        adminEmail,
        status: "success",
        createdAt: now.toISOString(),
        date: now.toLocaleDateString("fr-FR"),
        heure: now.toLocaleTimeString("fr-FR"),
        timestamp: Date.now()
      };

      await setDoc(doc(db, "walletAdjustments", adjId), adjRecord);
      await setDoc(doc(db, "walletTransactions", adjId), adjRecord);
      await setDoc(doc(db, "transactions", adjId), adjRecord);

      return { success: true, balanceAfter };
    } catch (err: any) {
      console.error("PaymentEngine.adminAdjustWallet error:", err);
      return { success: false, error: err?.message || "Erreur lors de l'ajustement." };
    }
  }

  /**
   * Block / Unblock user wallet.
   */
  async setWalletBlockStatus(userId: string, blocked: boolean, reason: string, adminEmail?: string): Promise<boolean> {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        walletBlocked: blocked,
        walletBlockReason: blocked ? reason : "",
        walletBlockedAt: blocked ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error("PaymentEngine.setWalletBlockStatus error:", err);
      return false;
    }
  }

  /**
   * Freeze / Unfreeze user account.
   */
  async setAccountFrozenStatus(userId: string, frozen: boolean, reason: string, adminEmail?: string): Promise<boolean> {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        accountFrozen: frozen,
        accountFrozenReason: frozen ? reason : "",
        accountFrozenAt: frozen ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error("PaymentEngine.setAccountFrozenStatus error:", err);
      return false;
    }
  }
}

export const PaymentEngine = new PaymentEngineClass();
