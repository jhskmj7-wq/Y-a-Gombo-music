import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Global in-memory cache for platform fee rate (default 2.5% during Beta)
let currentFeeRate = 0.025;

/**
 * Fetch configured platform fee rate from Firestore configs/commission document.
 */
export async function fetchPlatformFeeRate(): Promise<number> {
  try {
    const snap = await getDoc(doc(db, "configs", "commission"));
    if (snap.exists()) {
      const data = snap.data();
      if (typeof data?.rate === "number") {
        currentFeeRate = data.rate;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch platform fee rate, using fallback 2.5%:", err);
  }
  return currentFeeRate;
}

/**
 * Get currently cached fee rate.
 */
export function getPlatformFeeRate(): number {
  return currentFeeRate;
}

/**
 * SINGLE UNIQUE FUNCTION to calculate platform fee.
 * @param amount - Cachet amount in FCFA
 * @param feeRate - Optional custom fee rate (defaults to configured rate e.g. 0.025 for 2.5%)
 */
export function calculatePlatformFee(amount: number, feeRate?: number): number {
  if (!amount || amount <= 0) return 0;
  const rate = typeof feeRate === "number" ? feeRate : currentFeeRate;
  return Math.round(amount * rate);
}

/**
 * Calculate financial breakdown for a Gombo publication (Cachet + Platform Fee).
 */
export function calculatePublicationFinancials(cachet: number, feeRate?: number) {
  const cachetVal = Math.max(0, cachet);
  const feeAmount = calculatePlatformFee(cachetVal, feeRate);
  const totalToBlock = cachetVal + feeAmount;
  return {
    cachet: cachetVal,
    fee: feeAmount,
    total: totalToBlock
  };
}

/**
 * Update platform fee rate in Firestore (for Admin Centre).
 */
export async function updatePlatformFeeRate(newRate: number): Promise<void> {
  currentFeeRate = newRate;
  try {
    await setDoc(doc(db, "configs", "commission"), {
      rate: newRate,
      ratePercentage: newRate * 100,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("Failed to update platform fee rate in Firestore:", err);
  }
}

/**
 * Calculate effective commission rate based on user's Firestore profile.
 * IF premium == true AND premiumExpiresAt > now => 0.015 (1.5%)
 * ELSE => 0.025 (2.5%)
 */
export function getEffectiveCommissionRate(userData: any): number {
  if (!userData) return 0.025;
  
  const isPrem = !!(
    userData.premium === true ||
    userData.isPremium === true ||
    userData.status === "premium" ||
    userData.premiumStatus === "active" ||
    (Array.isArray(userData.badges) && userData.badges.some((b: string) => typeof b === "string" && b.includes("Premium")))
  );

  if (!isPrem) return 0.025;

  if (userData.premiumExpiresAt) {
    const expTime = new Date(userData.premiumExpiresAt).getTime();
    if (!isNaN(expTime) && expTime <= Date.now()) {
      return 0.025;
    }
  }

  return 0.015;
}

/**
 * Helper to record wallet transactions in Firestore with standardized history schema.
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
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const heureStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const txId = payload.reference || `tx_${payload.type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

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
    timestamp: Date.now()
  };

  try {
    await setDoc(doc(db, "transactions", txId), txData, { merge: true });
    await setDoc(doc(db, "walletTransactions", txId), txData, { merge: true });
  } catch (err) {
    console.error("Failed to record wallet transaction:", err);
  }
  return txId;
}
