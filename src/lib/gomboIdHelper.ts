/**
 * Single source of truth for GOMBO ID logic & generation across AFRIGOMBO ELITE.
 * Rule: Le GOMBO ID ne doit jamais exister tant que le KYC n'est pas validé.
 * Le KYC est la seule source de vérité.
 */

export const NOT_ASSIGNED_GOMBO_ID = "ID NON ATTRIBUÉ";
export const PENDING_KYC_GOMBO_ID = "EN ATTENTE DE VALIDATION KYC";

/**
 * Formats any raw Gombo ID or numeric string into the official display format GMB-XXX-XXX.
 * Example outputs: GMB-001-001, GMB-125-487, GMB-999-999
 */
export function formatGomboIdDisplay(rawId: string | null | undefined): string {
  if (!rawId) return NOT_ASSIGNED_GOMBO_ID;
  if (rawId === NOT_ASSIGNED_GOMBO_ID || rawId === PENDING_KYC_GOMBO_ID) {
    return rawId;
  }

  // If already formatted like GMB-XXX-XXX
  if (/^GMB-\d{3}-\d{3}$/.test(rawId)) {
    return rawId;
  }

  // Extract all numeric digits
  const digits = rawId.replace(/\D/g, "");

  if (digits.length >= 6) {
    const cleanDigits = digits.slice(-6);
    return `GMB-${cleanDigits.slice(0, 3)}-${cleanDigits.slice(3, 6)}`;
  }

  // Deterministic mapping for short or non-numeric raw IDs
  let hash = 0;
  for (let i = 0; i < rawId.length; i++) {
    hash = (hash << 5) - hash + rawId.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const numStr = String(positiveHash % 1000000).padStart(6, "0");
  return `GMB-${numStr.slice(0, 3)}-${numStr.slice(3, 6)}`;
}

/**
 * Single function to generate a unique Gombo ID format (GMB-XXX-XXX) upon KYC approval.
 */
export function generateGomboId(): string {
  const d1 = String(Math.floor(100 + Math.random() * 900)).padStart(3, "0");
  const d2 = String(Math.floor(100 + Math.random() * 900)).padStart(3, "0");
  return `GMB-${d1}-${d2}`;
}

/**
 * Returns the official GOMBO ID if KYC status is "approved" or "validated",
 * otherwise returns "EN ATTENTE DE VALIDATION KYC" if pending, or "ID NON ATTRIBUÉ".
 */
export function getEffectiveGomboId(
  user: { kycStatus?: string; gomboIdNumber?: string; gomboId?: any } | null | undefined
): string {
  if (!user) return NOT_ASSIGNED_GOMBO_ID;

  const status = (user.kycStatus || "").toLowerCase();

  if (status === "pending") {
    return PENDING_KYC_GOMBO_ID;
  }

  if (status !== "approved" && status !== "validated") {
    return NOT_ASSIGNED_GOMBO_ID;
  }

  const rawId =
    user.gomboIdNumber ||
    (typeof user.gomboId === "string" ? user.gomboId : user.gomboId?.id);

  if (!rawId || rawId === NOT_ASSIGNED_GOMBO_ID || rawId === PENDING_KYC_GOMBO_ID) {
    return NOT_ASSIGNED_GOMBO_ID;
  }

  return formatGomboIdDisplay(rawId);
}

/**
 * Helper to check strictly if KYC is approved or validated.
 */
export function isKycApproved(user: { kycStatus?: string } | null | undefined): boolean {
  const status = (user?.kycStatus || "").toLowerCase();
  return status === "approved" || status === "validated";
}
