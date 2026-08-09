/**
 * Single source of truth for GOMBO ID logic & generation across AFRIGOMBO ELITE.
 * Rule: Le GOMBO ID ne doit jamais exister tant que le KYC n'est pas validé.
 * Le KYC est la seule source de vérité.
 */

export const NOT_ASSIGNED_GOMBO_ID = "ID NON ATTRIBUÉ";
export const PENDING_KYC_GOMBO_ID = "EN ATTENTE DE VALIDATION KYC";

const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function getRandomChars(count: number): string {
  let result = "";
  for (let i = 0; i < count; i++) {
    result += ALPHANUM.charAt(Math.floor(Math.random() * ALPHANUM.length));
  }
  return result;
}

/**
 * Formats any raw Gombo reference or ID into official business format GB-2026-XXXXX.
 */
export function formatGomboRefDisplay(rawRef: string | null | undefined): string {
  if (!rawRef) return "GB-2026-00000";
  if (/^GB-\d{4}-[A-Z0-9]{4,8}$/i.test(rawRef)) {
    return rawRef.toUpperCase();
  }
  const clean = rawRef.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (clean.length >= 5) {
    return `GB-2026-${clean.slice(-5)}`;
  }
  return `GB-2026-${clean.padStart(5, "0")}`;
}

export function getGomboRef(item: any): string {
  if (!item) return "GB-2026-00000";
  if (typeof item === "string") return formatGomboRefDisplay(item);
  const rawRef = item.reference || item.gomboRef || item.ref || item.id || item.gomboId || item.gomboIdNumber;
  return formatGomboRefDisplay(rawRef);
}

/**
 * Formats any raw Gombo ID or string into the official display format GMB-XXX-XXX (alphanumeric).
 */
export function formatGomboIdDisplay(rawId: string | null | undefined): string {
  if (!rawId) return NOT_ASSIGNED_GOMBO_ID;
  if (rawId === NOT_ASSIGNED_GOMBO_ID || rawId === PENDING_KYC_GOMBO_ID) {
    return rawId;
  }

  // If already formatted like GMB-XXX-XXX
  if (/^GMB-[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(rawId)) {
    return rawId;
  }

  // Clean alphanumeric characters only (uppercase)
  const clean = rawId.replace(/[^A-Z0-9]/gi, "").toUpperCase();

  if (clean.length >= 6) {
    const slice = clean.slice(-6);
    return `GMB-${slice.slice(0, 3)}-${slice.slice(3, 6)}`;
  }

  // Deterministic or padded fallback
  let hash = 0;
  for (let i = 0; i < rawId.length; i++) {
    hash = (hash << 5) - hash + rawId.charCodeAt(i);
    hash |= 0;
  }
  const pos = Math.abs(hash);
  const part1 = ALPHANUM.charAt((pos >> 0) % ALPHANUM.length) +
                ALPHANUM.charAt((pos >> 3) % ALPHANUM.length) +
                ALPHANUM.charAt((pos >> 6) % ALPHANUM.length);
  const part2 = ALPHANUM.charAt((pos >> 9) % ALPHANUM.length) +
                ALPHANUM.charAt((pos >> 12) % ALPHANUM.length) +
                ALPHANUM.charAt((pos >> 15) % ALPHANUM.length);
  return `GMB-${part1}-${part2}`;
}

/**
 * Single function to generate a unique Gombo ID format (GMB-XXX-XXX) with random alphanumeric characters upon KYC approval.
 */
export function generateGomboId(): string {
  return `GMB-${getRandomChars(3)}-${getRandomChars(3)}`;
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
