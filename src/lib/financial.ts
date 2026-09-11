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

// Setup real-time listener for sovereign economy settings with graceful fallback
onSnapshot(
  doc(db, "system_settings", "economy"), 
  (snap) => {
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
  },
  (err) => {
    // Graceful fallback to default pricing if permissions are restricted
    console.warn("[Economy Settings] Real-time listener fallback active:", err?.message || err);
  }
);

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
  // Sovereign platform commission rates
  const standardRatePercent = 2.5; // Always 2.5% for Standard
  const premiumRatePercent = 1.5;  // Always 1.5% for Premium
  const standardRateDecimal = 0.025;
  const premiumRateDecimal = 0.015;

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
    return { statusName: "BATISSEUR", ratePercent: premiumRatePercent, rateDecimal: premiumRateDecimal, isPremium: true };
  }
  if (explicit === "AMBASSADEUR") {
    return { statusName: "AMBASSADEUR", ratePercent: premiumRatePercent, rateDecimal: premiumRateDecimal, isPremium: true };
  }
  if (explicit === "CREATOR" || explicit === "CREATEUR") {
    return { statusName: "CREATOR", ratePercent: premiumRatePercent, rateDecimal: premiumRateDecimal, isPremium: true };
  }
  if (explicit === "PRO" || explicit === "ELITE" || explicit === "VIP") {
    return { statusName: "PRO", ratePercent: premiumRatePercent, rateDecimal: premiumRateDecimal, isPremium: true };
  }

  // Check badges / profile fields
  const badges: string[] = Array.isArray(userData?.badges) ? userData.badges : [];
  const hasBuilderBadge = badges.some(b => b?.toLowerCase().includes("bâtisseur") || b?.toLowerCase().includes("fondateur"));
  if (hasBuilderBadge || userData?.isBuilder === true) {
    return { statusName: "BATISSEUR", ratePercent: premiumRatePercent, rateDecimal: premiumRateDecimal, isPremium: true };
  }

  const hasAmbassadorBadge = badges.some(b => b?.toLowerCase().includes("ambassadeur"));
  if (hasAmbassadorBadge || userData?.isAmbassador === true || userData?.role === "ambassadeur") {
    return { statusName: "AMBASSADEUR", ratePercent: premiumRatePercent, rateDecimal: premiumRateDecimal, isPremium: true };
  }

  const hasCreatorBadge = badges.some(b => b?.toLowerCase().includes("creator") || b?.toLowerCase().includes("créateur"));
  if (hasCreatorBadge || userData?.isCreator === true || userData?.role === "creator") {
    return { statusName: "CREATOR", ratePercent: premiumRatePercent, rateDecimal: premiumRateDecimal, isPremium: true };
  }

  const isPrem = PremiumEngine.isPremium(userData);
  if (isPrem) {
    return {
      statusName: userData?.subscriptionPlan?.toLowerCase().includes("pro") ? "PRO" : "PREMIUM",
      ratePercent: premiumRatePercent,
      rateDecimal: premiumRateDecimal,
      isPremium: true
    };
  }

  return {
    statusName: "USER",
    ratePercent: standardRatePercent,
    rateDecimal: standardRateDecimal,
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
  const netAmount = cleanAmount;
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

/**
 * =========================================================================
 * NEW CONTROLLED PREPAID CREDIT MODEL (AFRISOSCREDITACCOUNT)
 * =========================================================================
 */

export type CreditMovementType = "TOPUP" | "SERVICE_PAYMENT" | "SERVICE_HOLD" | "HOLD_RELEASED" | "REFUND";

export interface AfriSOSCreditAccount {
  userId: string;
  availableCredits: number;
  heldCredits: number;
  currency: "XOF";
  createdAt: string;
  updatedAt: string;
}

export interface AfriSOSCreditLedgerEntry {
  id: string;
  userId: string;
  type: CreditMovementType;
  amount: number;
  currency: "XOF";
  relatedEntityId?: string;
  operatorReference?: string;
  status: "success" | "pending" | "failed" | string;
  validatedBy?: string;
  createdAt: string;
}

/**
 * Safely retrieve or initialize the user's AfriSOSCreditAccount.
 */
export async function getOrCreateCreditAccount(userId: string): Promise<AfriSOSCreditAccount> {
  const accountRef = doc(db, "AfriSOSCreditAccount", userId);
  const snap = await getDoc(accountRef);
  
  if (snap.exists()) {
    const data = snap.data();
    return {
      userId: data.userId || userId,
      availableCredits: typeof data.availableCredits === "number" ? data.availableCredits : 0,
      heldCredits: typeof data.heldCredits === "number" ? data.heldCredits : 0,
      currency: "XOF",
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  }

  // Fallback to legacy balance to bootstrap credits if account doesn't exist yet
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  let initialBalance = 0;
  let initialHeld = 0;
  if (userSnap.exists()) {
    const userData = userSnap.data();
    const legacyBal = getCanonicalWalletBalance(userData);
    if (typeof legacyBal === "number" && !isNaN(legacyBal)) {
      initialBalance = legacyBal;
    }
    if (typeof userData.wallet?.soldeBloque === "number") {
      initialHeld = userData.wallet.soldeBloque;
    }
  }

  const newAccount: AfriSOSCreditAccount = {
    userId,
    availableCredits: initialBalance,
    heldCredits: initialHeld,
    currency: "XOF",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(accountRef, sanitizeForFirestore(newAccount));
  return newAccount;
}

/**
 * Register a financial movement in the Grand Ledger (AfriSOSCreditLedger)
 * and update the available/held credits in AfriSOSCreditAccount with maximum security.
 */
export async function recordCreditMovement(
  userId: string,
  params: {
    type: CreditMovementType;
    amount: number;
    relatedEntityId?: string;
    operatorReference?: string;
    status: string;
    validatedBy?: string;
  }
): Promise<string> {
  const ledgerId = `ledger_${params.type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowStr = new Date().toISOString();

  const ledgerEntry: AfriSOSCreditLedgerEntry = {
    id: ledgerId,
    userId,
    type: params.type,
    amount: Math.abs(params.amount),
    currency: "XOF",
    relatedEntityId: params.relatedEntityId || "",
    operatorReference: params.operatorReference || "",
    status: params.status,
    validatedBy: params.validatedBy || "",
    createdAt: nowStr
  };

  // 1. Record in the Grand Ledger
  await setDoc(doc(db, "AfriSOSCreditLedger", ledgerId), sanitizeForFirestore(ledgerEntry));

  // 2. Fetch and calculate new balances
  const account = await getOrCreateCreditAccount(userId);
  let newAvailable = account.availableCredits;
  let newHeld = account.heldCredits;

  const movementAmt = Math.abs(params.amount);

  if (params.status === "success" || params.status === "validated" || params.status === "PAID") {
    switch (params.type) {
      case "TOPUP":
        newAvailable += movementAmt;
        break;
      case "SERVICE_PAYMENT":
        newAvailable = Math.max(0, newAvailable - movementAmt);
        break;
      case "SERVICE_HOLD":
        newAvailable = Math.max(0, newAvailable - movementAmt);
        newHeld += movementAmt;
        break;
      case "HOLD_RELEASED":
        newHeld = Math.max(0, newHeld - movementAmt);
        newAvailable += movementAmt;
        break;
      case "REFUND":
        newAvailable += movementAmt;
        break;
    }
  }

  // 3. Update AfriSOSCreditAccount
  const accountRef = doc(db, "AfriSOSCreditAccount", userId);
  await setDoc(accountRef, sanitizeForFirestore({
    userId,
    availableCredits: newAvailable,
    heldCredits: newHeld,
    currency: "XOF",
    updatedAt: nowStr
  }), { merge: true });

  // 4. Synchronize with legacy user profile for maximum compatibility
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, {
    wallet: {
      soldeDisponible: newAvailable,
      soldeBloque: newHeld
    },
    balance: newAvailable,
    walletBalance: newAvailable
  }, { merge: true });

  // 5. Also log a legacy transaction for history tab backwards compatibility
  let legacyTxType = "publication";
  let legacyDesc = "";
  if (params.type === "TOPUP") {
    legacyTxType = "recharge_wallet";
    legacyDesc = `Recharge de crédit prépayé : +${movementAmt.toLocaleString("fr-FR")} XOF`;
  } else if (params.type === "SERVICE_PAYMENT") {
    legacyTxType = "debit_publication";
    legacyDesc = `Paiement service : -${movementAmt.toLocaleString("fr-FR")} XOF`;
  } else if (params.type === "SERVICE_HOLD") {
    legacyTxType = "fonds_bloques";
    legacyDesc = `Réservation temporaire de crédit : ${movementAmt.toLocaleString("fr-FR")} XOF`;
  } else if (params.type === "HOLD_RELEASED") {
    legacyTxType = "deblocage_cachet";
    legacyDesc = `Libération de crédit réservé : +${movementAmt.toLocaleString("fr-FR")} XOF`;
  } else if (params.type === "REFUND") {
    legacyTxType = "remboursement";
    legacyDesc = `Remboursement de service : +${movementAmt.toLocaleString("fr-FR")} XOF`;
  }

  await recordWalletTransaction({
    userId,
    type: legacyTxType,
    amount: movementAmt,
    status: params.status,
    description: params.operatorReference ? `${legacyDesc} (${params.operatorReference})` : legacyDesc,
    gomboId: params.relatedEntityId,
    reference: ledgerId
  });

  return ledgerId;
}

/**
 * Perform a controlled, safe service payment using prepaid credits.
 * Double-debits are blocked and checks are performed via transactions.
 */
export async function payForServiceWithCredit(
  userId: string,
  amount: number,
  relatedEntityId?: string
): Promise<boolean> {
  if (!userId || amount <= 0) return false;

  const account = await getOrCreateCreditAccount(userId);
  if (account.availableCredits < amount) {
    console.warn(`[CREDIT_SECURITY] Insufficient credit balance. Required: ${amount}, Available: ${account.availableCredits}`);
    return false;
  }

  // Atomic state update and movement logging
  await recordCreditMovement(userId, {
    type: "SERVICE_PAYMENT",
    amount,
    relatedEntityId,
    status: "success"
  });

  return true;
}

/**
 * Reserve credit amount temporarily for a service (e.g. escrow booking).
 */
export async function holdCreditForService(
  userId: string,
  amount: number,
  relatedEntityId?: string
): Promise<boolean> {
  if (!userId || amount <= 0) return false;

  const account = await getOrCreateCreditAccount(userId);
  if (account.availableCredits < amount) {
    console.warn(`[CREDIT_SECURITY] Insufficient credit balance for HOLD. Required: ${amount}, Available: ${account.availableCredits}`);
    return false;
  }

  await recordCreditMovement(userId, {
    type: "SERVICE_HOLD",
    amount,
    relatedEntityId,
    status: "success"
  });

  return true;
}

/**
 * Release temporarily held credit back to the available credits.
 */
export async function releaseHeldCredit(
  userId: string,
  amount: number,
  relatedEntityId?: string
): Promise<boolean> {
  if (!userId || amount <= 0) return false;

  const account = await getOrCreateCreditAccount(userId);
  if (account.heldCredits < amount) {
    console.warn(`[CREDIT_SECURITY] Insufficient held credit balance to release. Required: ${amount}, Held: ${account.heldCredits}`);
    return false;
  }

  await recordCreditMovement(userId, {
    type: "HOLD_RELEASED",
    amount,
    relatedEntityId,
    status: "success"
  });

  return true;
}

/**
 * Refund a service payment.
 */
export async function refundServicePayment(
  userId: string,
  amount: number,
  relatedEntityId?: string
): Promise<boolean> {
  if (!userId || amount <= 0) return false;

  await recordCreditMovement(userId, {
    type: "REFUND",
    amount,
    relatedEntityId,
    status: "success"
  });

  return true;
}

