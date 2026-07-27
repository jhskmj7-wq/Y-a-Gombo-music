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
 * Helper to record wallet transactions in Firestore with standardized history schema.
 */
export async function recordWalletTransaction(payload: {
  userId: string;
  userName?: string;
  type: "depot" | "debit_publication" | "commission_plateforme" | "fonds_bloques" | "deblocage_cachet" | "remboursement";
  amount: number;
  status: "success" | "pending" | "fonds_bloques" | "fonds_liberes" | "rembourse";
  description: string;
  gomboId?: string;
  contractId?: string;
}): Promise<string> {
  const now = new Date().toISOString();
  const txId = `tx_${payload.type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const txData = {
    id: txId,
    userId: payload.userId,
    userName: payload.userName || "Membre Gombo",
    type: payload.type,
    amount: payload.amount,
    status: payload.status,
    description: payload.description,
    gomboId: payload.gomboId || "",
    contractId: payload.contractId || "",
    createdAt: now,
    updatedAt: now,
    timestamp: Date.now()
  };

  try {
    await setDoc(doc(db, "transactions", txId), txData);
  } catch (err) {
    console.error("Failed to record wallet transaction:", err);
  }
  return txId;
}
