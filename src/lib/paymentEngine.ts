import { db } from "./firebase";
import { doc, getDoc, updateDoc, setDoc, collection } from "firebase/firestore";
import { getCanonicalWalletBalance } from "./financial";

export interface BoostTariffSpec {
  priceStandard: number;
  pricePremium: number;
  durationHours: number;
  title: string;
}

export const OFFICIAL_BOOST_TARIFFS: Record<string, BoostTariffSpec> = {
  // Publication Boosts
  "pub_booster": { priceStandard: 500, pricePremium: 300, durationHours: 48, title: "🚀 Booster la publication" },
  "pub_tendance": { priceStandard: 500, pricePremium: 350, durationHours: 24, title: "🔥 Mettre en tendance" },
  "pub_locale": { priceStandard: 400, pricePremium: 250, durationHours: 72, title: "⭐ Mise en avant locale" },
  "pub_pres_de_moi": { priceStandard: 300, pricePremium: 200, durationHours: 48, title: "📍 Priorité \"Près de moi\"" },
  // Profile Boosts (keyed by duration in hours)
  "profile_24": { priceStandard: 500, pricePremium: 300, durationHours: 24, title: "⚡ Boost Profil 24H" },
  "profile_72": { priceStandard: 1200, pricePremium: 750, durationHours: 72, title: "🔥 Boost Profil 3 Jours" },
  "profile_168": { priceStandard: 2500, pricePremium: 1500, durationHours: 168, title: "👑 Boost Profil 7 Jours" }
};

/**
 * Calculates the canonical official boost price for a given boost type and duration,
 * verifying the user's actual Premium/Pro/Elite status in Firestore.
 */
export async function calculateOfficialBoostPrice(
  userId: string,
  itemType: "profile" | "gombo" | "candidature" | string,
  boostOptionId: string,
  profileDurationHours?: number
): Promise<{ price: number; standardPrice: number; isPremium: boolean; durationHours: number; tariffKey: string }> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() : null;

  const role = (userData?.role || "").toLowerCase();
  const subTier = (userData?.subscriptionTier || userData?.subscription?.plan || "").toLowerCase();
  const isPremium = role === "premium" || role === "pro" || role === "elite" || role === "admin" || role === "founder" || subTier === "pro" || subTier === "elite";

  let tariffKey = "";
  if (itemType === "profile") {
    const dur = profileDurationHours || 24;
    tariffKey = `profile_${dur}`;
  } else {
    tariffKey = `pub_${boostOptionId}`;
  }

  const spec = OFFICIAL_BOOST_TARIFFS[tariffKey];
  if (!spec) {
    throw new Error(`Tarif de boost non reconnu: ${tariffKey}`);
  }

  const price = isPremium ? spec.pricePremium : spec.priceStandard;
  return {
    price,
    standardPrice: spec.priceStandard,
    isPremium,
    durationHours: spec.durationHours,
    tariffKey
  };
}

/**
 * Helper to check whether an item's boost is active based on timestamp expiration.
 */
export function isBoostActive(item: any): boolean {
  if (!item) return false;
  const now = new Date().getTime();
  const until = item.boostedUntil || item.urgentUntil || item.featuredUntil || item.profileBoostedUntil || item.expiresAt;
  if (!until) return false;
  const untilTime = new Date(until).getTime();
  return !isNaN(untilTime) && untilTime > now;
}

const activeBoostLocks = new Set<string>();

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
   * Process a verified boost payment and activate the boost in Firestore atomically.
   * Anti-double-debit lock protects against rapid double-clicks.
   * Official price is calculated internally from OFFICIAL_BOOST_TARIFFS and user subscription status.
   */
  async processBoostPayment(options: {
    userId: string;
    userName?: string;
    itemType: "profile" | "gombo" | "candidature" | string;
    itemId: string;
    boostOptionId: string; // "booster" | "tendance" | "locale" | "pres_de_moi" or duration for profile
    profileDurationHours?: number;
    currentUserProfile?: any;
  }): Promise<PaymentResult & { officialPrice?: number; expiresAtIso?: string; boostId?: string }> {
    const { userId, userName, itemType, itemId, boostOptionId, profileDurationHours } = options;

    const lockKey = `boost_${userId}_${itemId}_${boostOptionId}`;
    if (activeBoostLocks.has(lockKey)) {
      return { success: false, error: "Traitement de boost déjà en cours pour cet élément. Veuillez patienter." };
    }

    activeBoostLocks.add(lockKey);

    try {
      // 1. Determine official price
      const calc = await calculateOfficialBoostPrice(userId, itemType, boostOptionId, profileDurationHours);
      const amount = calc.price;
      const spec = OFFICIAL_BOOST_TARIFFS[calc.tariffKey];

      const boostDescription = itemType === "profile"
        ? `Boost Profil (${calc.durationHours}h)`
        : `Boost ${spec?.title || boostOptionId} (${calc.durationHours}h)`;

      // 2. Process debit
      const payRes = await this.processPayment({
        userId,
        userName: userName || options.currentUserProfile?.artistName || options.currentUserProfile?.name || "Membre Gombo",
        amount,
        module: itemType === "profile" ? "Boost Profil" : "Boost Publication",
        reason: boostDescription,
        metadata: {
          itemId,
          itemType,
          boostOptionId,
          tariffKey: calc.tariffKey,
          durationHours: calc.durationHours,
          isPremium: calc.isPremium
        }
      });

      if (!payRes.success) {
        return payRes;
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + calc.durationHours * 3600 * 1000);
      const expiresAtIso = expiresAt.toISOString();

      // 3. Record in `boosts/` collection
      const boostRef = doc(collection(db, "boosts"));
      const boostId = boostRef.id;
      await setDoc(boostRef, {
        id: boostId,
        userId,
        itemId,
        itemType,
        boostType: itemType === "profile" ? "profile" : boostOptionId,
        durationHours: calc.durationHours,
        amount,
        createdAt: now.toISOString(),
        expiresAt: expiresAtIso,
        status: "active"
      });

      // 4. Activate boost on item / profile
      if (itemType === "profile") {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          profileBoosted: true,
          profileBoostedUntil: expiresAtIso,
          profileBoostPriority: 10,
          profileBoostType: "premium_spotlight",
          lastBoostId: boostId,
          updatedAt: now.toISOString()
        });

        // Store inside `featuredProfiles/`
        await setDoc(doc(db, "featuredProfiles", userId), {
          boostId,
          userId,
          artistName: options.currentUserProfile?.artistName || options.currentUserProfile?.name || userName || "",
          commune: options.currentUserProfile?.commune || "",
          role: options.currentUserProfile?.role || "musicien",
          avatarUrl: options.currentUserProfile?.avatarUrl || options.currentUserProfile?.photoURL || "",
          featuredUntil: expiresAtIso,
          priority: 10,
          createdAt: now.toISOString()
        });
      } else {
        const collectionName = itemType === "candidature" ? "applications" : "gombos";
        const docRef = doc(db, collectionName, itemId);

        let updateFields: any = {
          boosted: true,
          boostedUntil: expiresAtIso,
          boostType: boostOptionId,
          lastBoostId: boostId,
          updatedAt: now.toISOString()
        };

        if (boostOptionId === "booster") {
          updateFields.isUrgent = true;
          updateFields.urgentUntil = expiresAtIso;
          updateFields.priority = 10;
        } else if (boostOptionId === "tendance") {
          updateFields.featured = true;
          updateFields.featuredUntil = expiresAtIso;
          updateFields.priority = 10;

          await setDoc(doc(db, "featuredPosts", itemId), {
            boostId,
            postId: itemId,
            title: options.currentUserProfile?.title || "",
            featuredUntil: expiresAtIso,
            priority: 10,
            type: itemType,
            createdAt: now.toISOString()
          });
        } else if (boostOptionId === "locale") {
          updateFields.localFeatured = true;
          updateFields.localFeaturedUntil = expiresAtIso;
          updateFields.priority = 8;
        } else if (boostOptionId === "pres_de_moi") {
          updateFields.nearMePriority = true;
          updateFields.nearMePriorityUntil = expiresAtIso;
          updateFields.priority = 9;
        }

        await updateDoc(docRef, updateFields);
      }

      return {
        success: true,
        txId: payRes.txId,
        balanceAfter: payRes.balanceAfter,
        officialPrice: amount,
        expiresAtIso,
        boostId
      };
    } catch (err: any) {
      console.error("PaymentEngine.processBoostPayment error:", err);
      return {
        success: false,
        error: err?.message || "Erreur lors du traitement du boost."
      };
    } finally {
      setTimeout(() => {
        activeBoostLocks.delete(lockKey);
      }, 3000);
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
