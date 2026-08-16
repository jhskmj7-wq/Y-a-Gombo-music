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

export type GomboIdStatusCode = "NOT_ATTRIBUTED" | "PENDING" | "REJECTED" | "ATTRIBUTED";

export interface UnifiedGomboIdInfo {
  statusCode: GomboIdStatusCode;
  statusLabel: string;
  statusColor: string;
  badgeLabel: string;
  buttonLabel: string;
  gomboId: string;
  rawId: string | null;
  isKycApproved: boolean;
  kycStatus: "none" | "pending" | "approved" | "rejected" | "info_required";
  assignedAt: string | null;
  submittedAt: string | null;
  verificationLevel: string;
  trustScore: number;
  rejectionReason?: string;
  betaRankType?: string;
  betaRankTitle?: string;
  betaRankNumber?: number;
  canApply: boolean;
}

/**
 * SINGLE SOURCE OF TRUTH STATUS RESOLVER FOR GOMBO ID
 */
export function getGomboIdStatusInfo(
  user: {
    kycStatus?: string;
    gomboIdNumber?: string;
    gomboId?: any;
    kycApprovedDate?: string;
    kycSubmittedDate?: string;
    kycComplementaryInfo?: string;
    trustScore?: number;
    isCertified?: boolean;
    betaRankType?: any;
    betaRankTitle?: string;
    betaRankNumber?: number;
  } | null | undefined
): UnifiedGomboIdInfo {
  if (!user) {
    return {
      statusCode: "NOT_ATTRIBUTED",
      statusLabel: "Non attribué",
      statusColor: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
      badgeLabel: "À obtenir",
      buttonLabel: "Obtenir mon Gombo ID",
      gomboId: NOT_ASSIGNED_GOMBO_ID,
      rawId: null,
      isKycApproved: false,
      kycStatus: "none",
      assignedAt: null,
      submittedAt: null,
      verificationLevel: "Niveau 0 (Non vérifié)",
      trustScore: 0,
      canApply: true
    };
  }

  const rawKycStatus = (user.kycStatus || "none").toLowerCase();
  const kycStatus = rawKycStatus as UnifiedGomboIdInfo["kycStatus"];
  const rawId = user.gomboIdNumber || (typeof user.gomboId === "string" ? user.gomboId : user.gomboId?.id) || null;
  const isApproved = rawKycStatus === "approved" || rawKycStatus === "validated" || (user.isCertified === true && !!rawId);

  const trustScore = user.gomboId?.scoreConfiance ?? user.trustScore ?? (isApproved ? 95 : 50);
  const niveau = user.gomboId?.niveau || (isApproved ? 1 : 0);
  const assignedAt = user.kycApprovedDate || user.gomboId?.createdAt || null;
  const submittedAt = user.kycSubmittedDate || null;

  if (isApproved) {
    const effectiveRaw = rawId || "GMB-000-000";
    const formatted = formatGomboIdDisplay(effectiveRaw);
    return {
      statusCode: "ATTRIBUTED",
      statusLabel: "🟢 Actif",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      badgeLabel: "✓ Vérifié",
      buttonLabel: "Mon Gombo ID",
      gomboId: formatted,
      rawId: effectiveRaw,
      isKycApproved: true,
      kycStatus: "approved",
      assignedAt,
      submittedAt,
      verificationLevel: `Niveau ${niveau} • Artiste Certifié`,
      trustScore,
      betaRankType: user.betaRankType,
      betaRankTitle: user.betaRankTitle,
      betaRankNumber: user.betaRankNumber,
      canApply: false
    };
  }

  if (kycStatus === "pending") {
    return {
      statusCode: "PENDING",
      statusLabel: "🟡 En vérification",
      statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      badgeLabel: "En cours",
      buttonLabel: "Demande de Gombo ID",
      gomboId: PENDING_KYC_GOMBO_ID,
      rawId: null,
      isKycApproved: false,
      kycStatus: "pending",
      assignedAt: null,
      submittedAt,
      verificationLevel: "En cours d'analyse",
      trustScore,
      canApply: false
    };
  }

  if (kycStatus === "rejected") {
    return {
      statusCode: "REJECTED",
      statusLabel: "🔴 Demande non validée",
      statusColor: "text-red-400 bg-red-500/10 border-red-500/30",
      badgeLabel: "Refusé",
      buttonLabel: "Régulariser ma demande",
      gomboId: NOT_ASSIGNED_GOMBO_ID,
      rawId: null,
      isKycApproved: false,
      kycStatus: "rejected",
      assignedAt: null,
      submittedAt,
      rejectionReason: user.kycComplementaryInfo || "Dossier non conforme ou pièces illisibles.",
      verificationLevel: "Non validé",
      trustScore,
      canApply: true
    };
  }

  return {
    statusCode: "NOT_ATTRIBUTED",
    statusLabel: "Non attribué",
    statusColor: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
    badgeLabel: "À obtenir",
    buttonLabel: "Obtenir mon Gombo ID",
    gomboId: NOT_ASSIGNED_GOMBO_ID,
    rawId: null,
    isKycApproved: false,
    kycStatus: kycStatus === "info_required" ? "info_required" : "none",
    assignedAt: null,
    submittedAt: null,
    verificationLevel: kycStatus === "info_required" ? "Informations complémentaires requises" : "Non attribué",
    trustScore,
    canApply: true
  };
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
 * Returns the official GOMBO ID using the single source of truth status info.
 */
export function getEffectiveGomboId(
  user: { kycStatus?: string; gomboIdNumber?: string; gomboId?: any; isCertified?: boolean } | null | undefined
): string {
  return getGomboIdStatusInfo(user).gomboId;
}

/**
 * Helper to check strictly if KYC is approved or validated.
 */
export function isKycApproved(user: { kycStatus?: string; isCertified?: boolean } | null | undefined): boolean {
  return getGomboIdStatusInfo(user).isKycApproved;
}
