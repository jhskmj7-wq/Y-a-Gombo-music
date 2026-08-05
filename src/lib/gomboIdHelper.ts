/**
 * Single source of truth for GOMBO ID logic & generation across AFRIGOMBO ELITE.
 * Rule: Le GOMBO ID ne doit jamais exister tant que le KYC n'est pas validé.
 * Le KYC est la seule source de vérité.
 */

export const NOT_ASSIGNED_GOMBO_ID = "ID NON ATTRIBUÉ";

/**
 * Single function to generate a unique Gombo ID format (AG-XXXXXXX) upon KYC approval.
 */
export function generateGomboId(): string {
  const digits = Math.floor(1000000 + Math.random() * 9000000);
  return `AG-${digits}`;
}

/**
 * Returns the official GOMBO ID if KYC status is "approved", otherwise returns "ID NON ATTRIBUÉ".
 */
export function getEffectiveGomboId(user: { kycStatus?: string; gomboIdNumber?: string; gomboId?: any } | null | undefined): string {
  if (!user || user.kycStatus !== "approved") {
    return NOT_ASSIGNED_GOMBO_ID;
  }
  const id = user.gomboIdNumber || (typeof user.gomboId === "string" ? user.gomboId : user.gomboId?.id);
  if (!id) return NOT_ASSIGNED_GOMBO_ID;
  return id;
}

/**
 * Helper to check strictly if KYC is approved.
 */
export function isKycApproved(user: { kycStatus?: string } | null | undefined): boolean {
  return user?.kycStatus === "approved";
}
