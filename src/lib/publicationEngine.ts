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

export interface PublicationRankingContext {
  userCommune?: string;
  userInterests?: string[];
  userFollowedAuthors?: string[];
}

/**
 * Multi-criteria ranking score for publications
 * Combines freshness (recency decay), authentic engagement (likes, comments, shares),
 * geographical affinity (commune match), and content diversity.
 */
export function scorePublication(
  item: PublicationBase,
  context: PublicationRankingContext = {}
): number {
  if (!item || !isPublicationActive(item)) return -1;

  let score = 50; // baseline score for active items

  // 1. Freshness / Recency Decay (48-hour half-life curve)
  const now = Date.now();
  const timestamp = item.createdAt || item.timestamp || item.publishedAt || item.date;
  const itemTime = typeof timestamp === "number" 
    ? timestamp 
    : (timestamp ? new Date(timestamp).getTime() : now);
  
  const ageHours = Math.max(0, (now - itemTime) / (1000 * 60 * 60));
  if (ageHours < 2) {
    score += 40; // ultra fresh (<2h)
  } else if (ageHours < 12) {
    score += 30; // very fresh (<12h)
  } else if (ageHours < 24) {
    score += 20; // past 24h
  } else if (ageHours < 72) {
    score += 10; // past 3 days
  } else {
    // Gradual decay
    score += Math.max(0, 10 - Math.floor((ageHours - 72) / 24));
  }

  // 2. Authentic Engagement (Likes, Comments, Shares, Views)
  const likes = Number(item.likes || item.likesCount || 0);
  const comments = Array.isArray(item.comments) 
    ? item.comments.length 
    : Number(item.commentsCount || item.comments || 0);
  const shares = Number(item.sharesCount || item.shares || 0);
  const views = Number(item.viewsCount || item.views || 0);

  score += Math.min(25, likes * 2);
  score += Math.min(25, comments * 3);
  score += Math.min(20, shares * 4);
  score += Math.min(10, Math.floor(views / 10));

  // 3. Certified / Verified Creator Boost
  if (item.authorVerified || item.isGomboIdVerified || item.isPro) {
    score += 8;
  }

  // 4. Geographical Affinity (User Commune match)
  if (context.userCommune && item.commune) {
    if (String(item.commune).toLowerCase() === String(context.userCommune).toLowerCase()) {
      score += 15;
    }
  }

  // 5. Media Richness (Video > Audio > Image > Text)
  if (item.videoUrl || item.type === "video") {
    score += 6;
  } else if (item.audioUrl || item.type === "audio") {
    score += 4;
  }

  return Math.round(score * 10) / 10;
}

/**
 * Dynamically rank publications using the multi-factor scoring engine
 */
export function rankPublications<T extends PublicationBase>(
  items: T[],
  context: PublicationRankingContext = {}
): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  // Filter only active & valid items
  const activeItems = items.filter(i => isPublicationActive(i));

  // Score each publication
  const scored = activeItems.map(item => ({
    item,
    score: scorePublication(item, context)
  }));

  // Sort by score descending, with deterministic secondary sort on timestamp
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const tA = new Date(a.item.createdAt || a.item.timestamp || a.item.date || 0).getTime();
    const tB = new Date(b.item.createdAt || b.item.timestamp || b.item.date || 0).getTime();
    return tB - tA;
  });

  return scored.map(s => s.item);
}

