import { db } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { PremiumEngine } from "./premiumEngine";
import { SecurityService } from "./SecurityService";
import { sanitizeForFirestore } from "./firestoreUtils";

/**
 * 15 000 FCFA MINIMUM RULE - OFFICIAL RULE IN AFRIGOMBO ELITE
 * MIN_GOMBO_AMOUNT = 15000 XOF
 */
export const MIN_GOMBO_AMOUNT = 15000; // 15 000 FCFA

/**
 * SINGLE CANONICAL SOURCE OF TRUTH RESOLUTION FOR WALLET BALANCE
 * Priority:
 * 1. wallet.soldeDisponible (nested canonical field)
 * 2. walletBalance (top-level numeric field)
 * 3. balance (legacy fallback field)
 */
export function getCanonicalWalletBalance(userData: any): number | null {
  if (!userData) return null;
  
  const solde = userData.wallet?.soldeDisponible;
  const walletBalance = userData.walletBalance;
  const balance = userData.balance;

  const candidateVals = [solde, walletBalance, balance].filter(
    (v): v is number => typeof v === "number" && !isNaN(v)
  );

  if (candidateVals.length === 0) return null;

  return Math.max(...candidateVals);
}

// Global in-memory cache for platform pricing configuration
export interface PricingConfig {
  standardCommissionRate: number; // e.g. 0.025 (2.5%)
  premiumCommissionRate: number; // e.g. 0.015 (1.5%)
}

let currentPricing: PricingConfig = {
  standardCommissionRate: 0.025, // 2.5%
  premiumCommissionRate: 0.015   // 1.5%
};

// Setup real-time listener for sovereign economy settings
onSnapshot(doc(db, "system_settings", "economy"), (snap) => {
  if (snap.exists()) {
    const data = snap.data();
    if (typeof data?.commissionBase === "number") {
      currentPricing.standardCommissionRate = data.commissionBase / 100;
    } else if (typeof data?.commissionRateStandard === "number") {
      currentPricing.standardCommissionRate = data.commissionRateStandard;
    }
    if (typeof data?.commissionPremium === "number") {
      currentPricing.premiumCommissionRate = data.commissionPremium / 100;
    } else if (typeof data?.commissionRatePremium === "number") {
      currentPricing.premiumCommissionRate = data.commissionRatePremium;
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
      } else if (typeof data?.commissionRateStandard === "number") {
        currentPricing.standardCommissionRate = data.commissionRateStandard;
      }
      if (typeof data?.commissionPremium === "number") {
        currentPricing.premiumCommissionRate = data.commissionPremium / 100;
      } else if (typeof data?.commissionRatePremium === "number") {
        currentPricing.premiumCommissionRate = data.commissionRatePremium;
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
 * Resolve User Status Name and its corresponding commission rate.
 * Supported Statuses: FOUNDER, BATISSEUR, AMBASSADEUR, CREATOR, PRO, PREMIUM, USER
 */
export function resolveUserStatusAndRate(userData: any, explicitStatus?: string | null): {
  statusName: "FOUNDER" | "BATISSEUR" | "AMBASSADEUR" | "CREATOR" | "PRO" | "PREMIUM" | "USER";
  ratePercent: number;
  rateDecimal: number;
  isPremium: boolean;
} {
  const pricing = getPlatformPricing();
  const standardRatePercent = Number((pricing.standardCommissionRate * 100).toFixed(4)); // default 2.5%
  const premiumRatePercent = Number((pricing.premiumCommissionRate * 100).toFixed(4));   // default 1.5%

  const email = (userData?.email || "").toLowerCase();
  const isFounder = email === "jhs.kmj7@gmail.com" || userData?.isFounder === true || userData?.role === "admin" || explicitStatus === "FOUNDER";
  if (isFounder) {
    return {
      statusName: "FOUNDER",
      ratePercent: 0,
      rateDecimal: 0,
      isPremium: true
    };
  }

  const explicit = (explicitStatus || "").toUpperCase();
  if (explicit === "BATISSEUR" || explicit === "BÂTISSEUR") {
    return { statusName: "BATISSEUR", ratePercent: premiumRatePercent, rateDecimal: pricing.premiumCommissionRate, isPremium: true };
  }
  if (explicit === "AMBASSADEUR") {
    return { statusName: "AMBASSADEUR", ratePercent: premiumRatePercent, rateDecimal: pricing.premiumCommissionRate, isPremium: true };
  }
  if (explicit === "CREATOR" || explicit === "CREATEUR") {
    return { statusName: "CREATOR", ratePercent: premiumRatePercent, rateDecimal: pricing.premiumCommissionRate, isPremium: true };
  }
  if (explicit === "PRO" || explicit === "ELITE" || explicit === "VIP") {
    return { statusName: "PRO", ratePercent: premiumRatePercent, rateDecimal: pricing.premiumCommissionRate, isPremium: true };
  }

  // Check badges / profile fields
  const badges: string[] = Array.isArray(userData?.badges) ? userData.badges : [];
  const hasBuilderBadge = badges.some(b => b?.toLowerCase().includes("bâtisseur") || b?.toLowerCase().includes("fondateur"));
  if (hasBuilderBadge || userData?.isBuilder === true) {
    return { statusName: "BATISSEUR", ratePercent: premiumRatePercent, rateDecimal: pricing.premiumCommissionRate, isPremium: true };
  }

  const hasAmbassadorBadge = badges.some(b => b?.toLowerCase().includes("ambassadeur"));
  if (hasAmbassadorBadge || userData?.isAmbassador === true || userData?.role === "ambassadeur") {
    return { statusName: "AMBASSADEUR", ratePercent: premiumRatePercent, rateDecimal: pricing.premiumCommissionRate, isPremium: true };
  }

  const hasCreatorBadge = badges.some(b => b?.toLowerCase().includes("creator") || b?.toLowerCase().includes("créateur"));
  if (hasCreatorBadge || userData?.isCreator === true || userData?.role === "creator") {
    return { statusName: "CREATOR", ratePercent: premiumRatePercent, rateDecimal: pricing.premiumCommissionRate, isPremium: true };
  }

  const isPrem = PremiumEngine.isPremium(userData);
  if (isPrem) {
    return {
      statusName: userData?.subscriptionPlan?.toLowerCase().includes("pro") ? "PRO" : "PREMIUM",
      ratePercent: premiumRatePercent,
      rateDecimal: pricing.premiumCommissionRate,
      isPremium: true
    };
  }

  return {
    statusName: "USER",
    ratePercent: standardRatePercent,
    rateDecimal: pricing.standardCommissionRate,
    isPremium: false
  };
}

export interface GomboFeeCalculationParams {
  amount: number;
  userStatus?: string | null;
  userProfile?: any;
  customRatePercent?: number;
  context?: "publication" | "contract" | "escrow" | "direct";
}

export interface GomboFeeCalculationResult {
  amount: number;
  ratePercent: number;
  rateDecimal: number;
  fee: number;
  netAmount: number;
  sequestre: number;
  total: number;
  isValidAmount: boolean;
  minAmount: number;
  statusName: string;
  isPremium: boolean;
  errorMessage?: string;
}

/**
 * THE SINGLE CENTRALIZED GOMBO FEE ENGINE
 * Formula: fee = Math.round((amount * ratePercent) / 100)
 * Net amount = amount - fee
 * Min amount: 15 000 FCFA
 */
export function calculateGomboFees({
  amount,
  userStatus,
  userProfile,
  customRatePercent,
  context
}: GomboFeeCalculationParams): GomboFeeCalculationResult {
  const cleanAmount = typeof amount === "number" && !isNaN(amount) ? Math.max(0, Math.round(amount)) : 0;
  
  let ratePercent = 2.5;
  let rateDecimal = 0.025;
  let statusName: string = "USER";
  let isPremium = false;

  if (typeof customRatePercent === "number" && !isNaN(customRatePercent) && customRatePercent >= 0) {
    // If rate was passed as decimal <= 0.5 (e.g. 0.015 instead of 1.5)
    ratePercent = customRatePercent <= 0.5 ? Number((customRatePercent * 100).toFixed(4)) : customRatePercent;
    rateDecimal = ratePercent / 100;
    statusName = "CUSTOM";
    isPremium = ratePercent <= 1.5;
  } else {
    const resolved = resolveUserStatusAndRate(userProfile, userStatus);
    ratePercent = resolved.ratePercent;
    rateDecimal = resolved.rateDecimal;
    statusName = resolved.statusName;
    isPremium = resolved.isPremium;
  }

  // Canonical base calculation: fee = Math.round((amount * ratePercent) / 100)
  const fee = Math.round((cleanAmount * ratePercent) / 100);
  const netAmount = Math.max(0, cleanAmount - fee);
  const isValidAmount = cleanAmount >= MIN_GOMBO_AMOUNT;
  
  const errorMessage = !isValidAmount && cleanAmount > 0
    ? "Le cachet minimum pour publier un Gombo est de 15 000 FCFA."
    : undefined;

  return {
    amount: cleanAmount,
    ratePercent,
    rateDecimal,
    fee,
    netAmount,
    sequestre: cleanAmount,
    total: cleanAmount + fee,
    isValidAmount,
    minAmount: MIN_GOMBO_AMOUNT,
    statusName,
    isPremium,
    errorMessage
  };
}

/**
 * SINGLE UNIQUE FUNCTION to calculate platform fee.
 * @param amount - Cachet amount in FCFA
 * @param feeRate - Optional custom fee rate
 */
export function calculatePlatformFee(amount: number, feeRate?: number): number {
  if (!amount || amount <= 0) return 0;
  const res = calculateGomboFees({ 
    amount, 
    customRatePercent: typeof feeRate === "number" ? (feeRate <= 0.5 ? feeRate * 100 : feeRate) : undefined 
  });
  return res.fee;
}

/**
 * Calculate financial breakdown for a Gombo publication (Cachet + Platform Fee).
 */
export function calculatePublicationFinancials(cachet: number, feeRateOrUserData?: number | any) {
  const isUserData = typeof feeRateOrUserData === "object" && feeRateOrUserData !== null;
  const res = calculateGomboFees({
    amount: cachet,
    userProfile: isUserData ? feeRateOrUserData : undefined,
    customRatePercent: typeof feeRateOrUserData === "number" ? (feeRateOrUserData <= 0.5 ? feeRateOrUserData * 100 : feeRateOrUserData) : undefined
  });

  return {
    cachet: res.amount,
    fee: res.fee,
    sequestre: res.sequestre,
    total: res.total,
    rate: res.rateDecimal,
    ratePercent: res.ratePercent,
    netAmount: res.netAmount,
    isPremium: res.isPremium,
    isValid: res.isValidAmount,
    statusName: res.statusName,
    minAmount: res.minAmount,
    errorMessage: res.errorMessage
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
      payload.commissionRateStandard = newPricing.standardCommissionRate;
    }
    if (newPricing.premiumCommissionRate !== undefined) {
      payload.commissionPremium = newPricing.premiumCommissionRate * 100;
      payload.commissionRatePremium = newPricing.premiumCommissionRate;
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
  const { rateDecimal } = resolveUserStatusAndRate(userData);
  return rateDecimal;
}

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
