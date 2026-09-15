/**
 * AFRIGOMBO Publication Engine
 * Manages canonical publication status, lifecycle (scheduled, active, expired, archived, deleted, suspended),
 * media asset validity, and public feed eligibility.
 */

export type NormalizedStatus = 
  | "draft" 
  | "scheduled" 
  | "active" 
  | "expired" 
  | "archived" 
  | "deleted" 
  | "suspended";

export interface PublicationBase {
  id?: string;
  status?: string;
  statut?: string;
  visible?: boolean;
  adminValidated?: boolean;
  isArchived?: boolean;
  isDeleted?: boolean;
  isFlagged?: boolean;
  scheduledAt?: string | number | null;
  expiresAt?: string | number | null;
  expiresAtTimestamp?: number | null;
  deadline?: string | number | null;
  date?: string;
  createdAt?: string | number;
  timestamp?: string | number;
  mediaUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  audioUrl?: string;
  content?: string;
  caption?: string;
  description?: string;
  [key: string]: any;
}

/**
 * Validate that a publication has a genuine media asset or substantial text content.
 * Accepts any valid Cloudflare R2 URL, Supabase Storage URL, Firebase Storage URL,
 * external video/audio/image CDN, data URI, blob URL, or local path.
 * Does NOT reject URLs lacking specific extensions (.mp4, .webm, .mov)
 * to ensure R2 signed/hashed URLs and custom CDN keys are accepted.
 */
export function hasValidPublicationMedia(data: PublicationBase): boolean {
  if (!data) return false;

  const mediaCandidates = [
    data.mediaUrl,
    data.videoUrl,
    data.imageUrl,
    data.audioUrl,
    (data as any).mediaURL,
    (data as any).url,
    (data as any).storagePath
  ];

  for (const item of mediaCandidates) {
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (
        trimmed.length > 5 &&
        trimmed !== "undefined" &&
        trimmed !== "null" &&
        (trimmed.startsWith("http://") ||
         trimmed.startsWith("https://") ||
         trimmed.startsWith("blob:") ||
         trimmed.startsWith("data:") ||
         trimmed.startsWith("/") ||
         trimmed.startsWith("r2:"))
      ) {
        return true;
      }
    }
  }

  // Also accept text-centric publications if text content is substantial (>= 3 chars)
  const text = data.content || data.caption || data.description;
  if (typeof text === "string" && text.trim().length >= 3) {
    return true;
  }

  return false;
}

/**
 * Checks if a publication is scheduled for future release
 */
export function isPublicationScheduled(data: PublicationBase): boolean {
  if (!data || !data.scheduledAt) return false;
  const schedTime = typeof data.scheduledAt === "number"
    ? data.scheduledAt
    : new Date(data.scheduledAt).getTime();
  return !isNaN(schedTime) && schedTime > Date.now();
}

/**
 * Checks if a publication has expired
 */
export function isPublicationExpired(data: PublicationBase): boolean {
  if (!data) return false;
  return getPublicationStatus(data) === "expired";
}

/**
 * Compute the canonical status of a publication
 */
export function getPublicationStatus(data: PublicationBase): NormalizedStatus {
  if (!data) return "deleted";

  const rawSt = String(data.status || data.statut || "").toLowerCase().trim();
  
  if (
    rawSt === "deleted" || 
    rawSt === "supprime" || 
    rawSt === "supprimé" || 
    data.isDeleted === true
  ) {
    return "deleted";
  }

  if (
    rawSt === "archived" || 
    rawSt === "archivee" || 
    rawSt === "archivée" || 
    rawSt === "archive" || 
    data.isArchived === true
  ) {
    return "archived";
  }

  if (
    rawSt === "suspended" || 
    rawSt === "suspendue" || 
    rawSt === "suspendu" || 
    data.visible === false || 
    data.isFlagged === true
  ) {
    return "suspended";
  }

  if (data.adminValidated === false) {
    return "suspended";
  }

  if (rawSt === "draft" || rawSt === "brouillon") {
    return "draft";
  }

  const now = Date.now();

  // Check scheduled publication (future)
  if (data.scheduledAt) {
    const schedTime = typeof data.scheduledAt === "number"
      ? data.scheduledAt
      : new Date(data.scheduledAt).getTime();
    if (!isNaN(schedTime) && schedTime > now) {
      return "scheduled";
    }
  }

  if (
    rawSt === "scheduled" || 
    rawSt === "programme" || 
    rawSt === "programmee" || 
    rawSt === "programmée"
  ) {
    if (data.scheduledAt) {
      const schedTime = typeof data.scheduledAt === "number"
        ? data.scheduledAt
        : new Date(data.scheduledAt).getTime();
      if (!isNaN(schedTime) && schedTime > now) {
        return "scheduled";
      }
    } else {
      return "scheduled";
    }
  }

  // Check expiration time
  let expTime: number | null = null;
  if (data.expiresAt) {
    expTime = typeof data.expiresAt === "number" ? data.expiresAt : new Date(data.expiresAt).getTime();
  } else if (data.expiresAtTimestamp) {
    expTime = Number(data.expiresAtTimestamp);
  } else if (data.deadline) {
    const d = new Date(data.deadline);
    if (!isNaN(d.getTime())) {
      expTime = d.getTime();
    }
  } else if (data.date) {
    const d = new Date(`${data.date}T23:59:59.999Z`);
    if (!isNaN(d.getTime())) {
      expTime = d.getTime();
    }
  }

  if (expTime && !isNaN(expTime) && expTime <= now) {
    return "expired";
  }

  if (
    rawSt === "expired" || 
    rawSt === "expiree" || 
    rawSt === "expirée" || 
    rawSt === "expire"
  ) {
    return "expired";
  }

  return "active";
}

/**
 * Determine if a publication is active and eligible for active public feeds.
 * Rejects deleted, archived, suspended, unvalidated, draft, future-scheduled,
 * expired, or invalid media items.
 */
export function isPublicationActive(
  data: PublicationBase, 
  options: { requireValidMedia?: boolean } = {}
): boolean {
  if (!data) return false;

  if (
    data.visible === false || 
    data.adminValidated === false || 
    data.isDeleted === true || 
    data.isArchived === true || 
    data.isFlagged === true
  ) {
    return false;
  }

  // Future scheduled publications must never appear in public feeds
  if (data.scheduledAt) {
    const schedTime = typeof data.scheduledAt === "number"
      ? data.scheduledAt
      : new Date(data.scheduledAt).getTime();
    if (!isNaN(schedTime) && schedTime > Date.now()) {
      return false;
    }
  }

  if (options.requireValidMedia && !hasValidPublicationMedia(data)) {
    return false;
  }

  const computedStatus = getPublicationStatus(data);
  return computedStatus === "active";
}

/**
 * Filter an array of publications for active public feeds
 */
export function filterActivePublications<T extends PublicationBase>(
  items: T[], 
  options: { requireValidMedia?: boolean } = {}
): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter(item => isPublicationActive(item, options));
}

