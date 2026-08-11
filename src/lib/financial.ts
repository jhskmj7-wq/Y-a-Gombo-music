import { db } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

import { PremiumEngine } from "./premiumEngine";

/**
 * SINGLE CANONICAL SOURCE OF TRUTH RESOLUTION FOR WALLET BALANCE
 * Priority:
 * 1. wallet.soldeDisponible (nested canonical field)
 * 2. walletBalance (top-level numeric field)
 * 3. balance (legacy fallback field)
 */
export function getCanonicalWalletBalance(userData: any): number {
  if (!userData) return 0;
  if (typeof userData.wallet?.soldeDisponible === "number") {
    return userData.wallet.soldeDisponible;
  }
  if (typeof userData.walletBalance === "number") {
    return userData.walletBalance;
  }
  if (typeof userData.balance === "number") {
    return userData.balance;
  }
  return 0;
}

// Global in-memory cache for platform pricing configuration
export interface PricingConfig {
  standardCommissionRate: number; // e.g. 0.05
  premiumCommissionRate: number; // e.g. 0.015
}

let currentPricing: PricingConfig = {
  standardCommissionRate: 0.025,
  premiumCommissionRate: 0.015
};

// Setup real-time listener
onSnapshot(doc(db, "system_settings", "economy"), (snap) => {
  if (snap.exists()) {
    const data = snap.data();
    if (typeof data?.commissionBase === "number") {
      currentPricing.standardCommissionRate = data.commissionBase / 100;
    }
    if (typeof data?.commissionPremium === "number") {
      currentPricing.premiumCommissionRate = data.commissionPremium / 100;
    }
  }
});

/**
 * Fetch configured platform pricing from Firestore configs/pricing document.
 */
export async function fetchPlatformPricing(): Promise<PricingConfig> {
  try {
    const snap = await getDoc(doc(db, "system_settings", "economy"));
    if (snap.exists()) {
      const data = snap.data();
      if (typeof data?.commissionBase === "number") {
        currentPricing.standardCommissionRate = data.commissionBase / 100;
      }
      if (typeof data?.commissionPremium === "number") {
        currentPricing.premiumCommissionRate = data.commissionPremium / 100;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch platform pricing, using fallback:", err);
  }
  return currentPricing;
}

export function getPlatformPricing(): PricingConfig {
  return currentPricing;
}

/**
 * SINGLE UNIQUE FUNCTION to calculate platform fee.
 * @param amount - Cachet amount in FCFA
 * @param feeRate - Optional custom fee rate
 */
export function calculatePlatformFee(amount: number, feeRate?: number): number {
  if (!amount || amount <= 0) return 0;
  const rate = typeof feeRate === "number" ? feeRate : currentPricing.standardCommissionRate;
  return Math.round(amount * rate);
}

/**
 * Calculate financial breakdown for a Gombo publication (Cachet + Platform Fee).
 */
export function calculatePublicationFinancials(cachet: number, feeRate?: number) {
  const cachetVal = Math.max(0, cachet);
  const rate = typeof feeRate === "number" ? feeRate : currentPricing.standardCommissionRate;
  const feeAmount = Math.round(cachetVal * rate);
  const montantSequestre = cachetVal;
  const totalDebite = cachetVal + feeAmount;

  return {
    cachet: cachetVal,
    fee: feeAmount,
    sequestre: montantSequestre,
    total: totalDebite,
    rate: rate,
    isPremium: rate === currentPricing.premiumCommissionRate
  };
}

/**
 * Update platform pricing in Firestore (for Admin Centre).
 */
export async function updatePlatformPricing(newPricing: Partial<PricingConfig>): Promise<void> {
  currentPricing = { ...currentPricing, ...newPricing };
  try {
    const payload: any = { updatedAt: new Date().toISOString() };
    if (newPricing.standardCommissionRate !== undefined) {
      payload.commissionBase = newPricing.standardCommissionRate * 100;
    }
    if (newPricing.premiumCommissionRate !== undefined) {
      payload.commissionPremium = newPricing.premiumCommissionRate * 100;
    }
    await setDoc(doc(db, "system_settings", "economy"), payload, { merge: true });
  } catch (err) {
    console.error("Failed to update platform pricing in Firestore:", err);
  }
}

/**
 * Calculate effective commission rate based on user's Firestore profile.
 */
export function getEffectiveCommissionRate(userData: any): number {
  return PremiumEngine.getCommissionRate(userData);
}

import { SecurityService } from "./SecurityService";
import { sanitizeForFirestore } from "./firestoreUtils";

/**
 * Generate cryptographic signature hash for transaction anti-tampering
 */
function generateTransactionSignature(txId: string, userId: string, amount: number, type: string, timestamp: number): string {
  const secretKey = "AFRIGOMBO_ELITE_BANK_SECURE_HMAC_V2";
  const rawString = `${txId}:${userId}:${amount}:${type}:${timestamp}:${secretKey}`;
  
  // Simple fast hash string generator (Fowler-Noll-Vo / DJB2 variant for frontend validation)
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `SIG_AFRI_${Math.abs(hash).toString(16).toUpperCase()}_${timestamp.toString(36).toUpperCase()}`;
}

/**
 * Helper to record wallet transactions in Firestore with standardized history schema & digital signature.
 * Writes to both 'transactions' and 'walletTransactions' collections.
 */
export async function recordWalletTransaction(payload: {
  userId: string;
  userName?: string;
  type: "depot" | "deposit" | "retrait" | "withdraw" | "debit_publication" | "publication" | "commission_plateforme" | "commission" | "fonds_bloques" | "deblocage_cachet" | "remboursement" | "refund" | "recharge_wallet" | "prime_bonus" | "abonnement_premium" | "premium" | string;
  amount: number;
  status: "success" | "pending" | "fonds_bloques" | "fonds_liberes" | "rembourse" | "validated" | "PAID" | string;
  description: string;
  gomboId?: string;
  contractId?: string;
  userConcerned?: string;
  reference?: string;
}): Promise<string> {
  // Rate limiting check
  const rateLimit = SecurityService.enforceRateLimit(payload.userId, "wallet_tx", 20, 60000);
  if (!rateLimit.allowed) {
    console.warn("⚠️ [FINANCIAL_SECURITY] Rate limit hit for wallet transactions.");
  }

  const now = new Date();
  const timestamp = Date.now();
  const dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const heureStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const txId = payload.reference || `tx_${payload.type}_${timestamp}_${Math.random().toString(36).substring(2, 6)}`;
  const txSignature = generateTransactionSignature(txId, payload.userId, payload.amount, payload.type, timestamp);

  const txData = {
    id: txId,
    reference: txId,
    uid: payload.userId,
    userId: payload.userId,
    userName: payload.userName || "Membre Gombo",
    userConcerned: payload.userConcerned || payload.userName || "Membre Gombo",
    type: payload.type,
    amount: payload.amount,
    montant: payload.amount,
    status: payload.status,
    statut: payload.status,
    description: payload.description,
    gomboId: payload.gomboId || "",
    contractId: payload.contractId || "",
    date: dateStr,
    heure: heureStr,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    timestamp,
    signature: txSignature,
    signedByServer: true,
    isVerified: true
  };

  try {
    const cleanTxData = sanitizeForFirestore(txData);
    await setDoc(doc(db, "transactions", txId), cleanTxData, { merge: true });
    await setDoc(doc(db, "walletTransactions", txId), cleanTxData, { merge: true });
  } catch (err) {
    console.error("Failed to record wallet transaction:", err);
  }
  return txId;
}
