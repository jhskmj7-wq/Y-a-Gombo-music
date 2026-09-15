import { Gombo, Post } from "../types";
import { safeStringify } from "./jsonUtils";
import { db } from "./firebase";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { isGomboExpired } from "./gomboDateUtils";

export interface TrendingDoc {
  id: string; // publicationId
  publicationId: string;
  type: "gombo" | "post";
  title: string;
  description: string;
  score: number;
  mode: "auto" | "manuel" | "sponsor";
  pinned: boolean;
  sponsored: boolean;
  viewsCount: number;
  favoritesCount: number;
  sharesCount: number;
  discussionsCount: number;
  candidaturesCount: number;
  likesCount: number; // jhonore
  reportsCount?: number;
  createdAt: string | number;
  updatedAt: string | number;
  authorName?: string;
  authorAvatar?: string;
  category?: string;
  commune?: string;
  budget?: number;
  imageUrl?: string;
  audioUrl?: string;
  gomboRef?: string;
  isGomboIdVerified?: boolean;
  isPremium?: boolean;
}

export interface TendancesItem {
  id: string;
  type: "gombo" | "post";
  title: string;
  description: string;
  category: "musique" | "castings" | "renfort" | "evenements" | "general" | "marche" | "academie" | "artiste";
  commune: string;
  authorUid?: string;
  authorName?: string;
  authorAvatar?: string;
  isGomboIdVerified?: boolean;
  isPremium?: boolean;
  subscriptionPlan?: "free" | "pro" | "elite" | string;
  budget?: number;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  gomboRef?: string; // Référence métier officielle du Gombo (ex: GB-2026-XXXXX)
  date?: string;
  createdAt: number; // timestamp in ms
  
  // Engagement metrics
  likesCount: number;        // 👍 J'honore (x12)
  candidaturesCount: number; // 🤝 Candidatures (x20)
  viewsCount: number;        // 👀 Consultations (x1)
  discussionsCount: number;  // 💬 Discussions/Commentaires (x8)
  sharesCount: number;       // 📤 Partages (x10)
  favoritesCount: number;    // ⭐ Favoris (x5)
  reportsCount: number;      // 🚨 Signalements
  
  // Trending mode & badges flags
  mode?: "auto" | "manuel" | "sponsor";
  pinned?: boolean;
  sponsored?: boolean;

  // Calculated properties
  baseScore?: number;
  afrigomboScore?: number;
  decayMultiplier?: number;
  velocity?: number; // Hourly engagement rate proxy (pts / hour)
  rawItem?: Gombo | Post | any;
}

export type TendancesCategoryTab = 
  | "tendances"    // 🔥 Top global
  | "gombos"       // 💼 Gombos (Opportunités)
  | "publications" // 🎬 Publications (Posts & Réels)
  | "musique"      // 🎵 Musique
  | "castings"     // 🎤 Castings
  | "renfort"      // 🤝 Renfort Express
  | "evenements"   // 📅 Événements
  | "marche"       // 🛒 Grand Marché
  | "academie"     // 🎓 Académie
  | "artistes"     // 🎤 Artistes (filtre publications musicales)
  | "pres_de_moi"; // 📍 Près de moi

/**
 * EXACT SCORE FORMULA REQUIRED BY SPEC:
 * rawScore = (views * 1) + (favorites * 5) + (shares * 10) + (comments * 8) + (applications * 20) + (jhonore * 12)
 */
export function calculateTrendingScore(metrics: {
  viewsCount?: number;
  favoritesCount?: number;
  sharesCount?: number;
  discussionsCount?: number;
  candidaturesCount?: number;
  likesCount?: number;
}): number {
  const views = Math.max(0, metrics.viewsCount || 0);
  const favorites = Math.max(0, metrics.favoritesCount || 0);
  const shares = Math.max(0, metrics.sharesCount || 0);
  const comments = Math.max(0, metrics.discussionsCount || 0);
  const candidatures = Math.max(0, metrics.candidaturesCount || 0);
  const jhonore = Math.max(0, metrics.likesCount || 0);

  return (views * 1) + (favorites * 5) + (shares * 10) + (comments * 8) + (candidatures * 20) + (jhonore * 12);
}

/**
 * Calculate Time Decay Multiplier (Fraîcheur continue)
 * Uses smooth decay curve: 1 / (1 + (hoursOld / 24))^1.5
 * Content older than 14 days (336h) drops to 0 (unless pinned by Super Founder).
 */
export function calculateTimeDecayMultiplier(createdAtMs: number): number {
  const now = Date.now();
  const ageMs = Math.max(0, now - createdAtMs);
  const hoursOld = ageMs / (1000 * 60 * 60);

  // Contents over 14 days drop to 0 freshness
  if (hoursOld > 336) {
    return 0;
  }

  // Smooth power curve:
  // 1h: ~0.94
  // 6h: ~0.72
  // 12h: ~0.54
  // 24h: ~0.35
  // 48h: ~0.19
  // 7d (168h): ~0.044
  return 1 / Math.pow(1 + (hoursOld / 24), 1.5);
}

/**
 * Calculate the final official AFRIGOMBO Score with Velocity and Freshness.
 * 
 * Signals used from existing project data:
 * - views, likes (j'honore), comments (discussions), shares, favorites, applications (candidatures)
 * - content creation timestamp (createdAt / timestamp)
 * - hours since publication (age)
 * - velocity proxy: hourly rate of engagement = rawEngagement / max(1, hoursOld)
 * - continuous freshness decay
 * - geographic commune proximity bonus (+10)
 * - verified KYC / Gombo ID bonus (+10)
 * - premium status (+10 and subscription multipliers: x1.2 Pro, x1.5 Elite)
 */
export function calculateAfrigomboScore(
  item: Partial<TendancesItem>,
  userCommune?: string
): { 
  finalScore: number; 
  baseScore: number; 
  decayMultiplier: number;
  velocity: number;
  rawEngagement: number;
} {
  const rawEngagement = calculateTrendingScore({
    viewsCount: item.viewsCount,
    favoritesCount: item.favoritesCount,
    sharesCount: item.sharesCount,
    discussionsCount: item.discussionsCount,
    candidaturesCount: item.candidaturesCount,
    likesCount: item.likesCount
  });

  const createdAtMs = item.createdAt || Date.now();
  const now = Date.now();
  const ageHours = Math.max(0.1, (now - createdAtMs) / (1000 * 3600));

  // Velocity Proxy (hourly engagement rate):
  // Since Firestore stores aggregate counters rather than per-minute event logs,
  // velocity is calculated as rawEngagement / Math.max(1, ageHours).
  const velocity = Math.round((rawEngagement / Math.max(1, ageHours)) * 10) / 10;

  // Freshness decay (pinned items bypass decay)
  const decayMultiplier = item.pinned ? 1.0 : calculateTimeDecayMultiplier(createdAtMs);

  // Dynamic engagement: (rawEngagement * decay) + (velocity * 3)
  const dynamicEngagement = (rawEngagement * decayMultiplier) + (velocity * 3);

  // Geographic Proximity Bonus (+10 pts)
  let bonus = 0;
  if (
    userCommune &&
    item.commune &&
    userCommune.trim().toLowerCase() === item.commune.trim().toLowerCase()
  ) {
    bonus += 10;
  }
  if (item.isGomboIdVerified) bonus += 10;
  if (item.isPremium) bonus += 10;

  const penalty = (item.reportsCount || 0) * 50;

  const withBonuses = Math.max(0, dynamicEngagement + bonus - penalty);

  // Subscription plan boost multiplier
  let boostMultiplier = 1.0;
  const plan = String(item.subscriptionPlan || (item.rawItem as any)?.subscriptionPlan || "").toLowerCase();
  if (plan.includes("elite")) {
    boostMultiplier = 1.5;
  } else if (plan.includes("pro") || item.isPremium || (item.rawItem as any)?.isPremium) {
    boostMultiplier = 1.2;
  }

  const calculatedFinal = Math.round(withBonuses * boostMultiplier);
  const finalScore = item.pinned ? Math.max(calculatedFinal, 1000) : calculatedFinal;

  return { 
    finalScore, 
    baseScore: rawEngagement, 
    decayMultiplier: Math.round(decayMultiplier * 100) / 100,
    velocity,
    rawEngagement
  };
}

/**
 * Legacy base score helper (maintained for backward compatibility)
 */
export function calculateBaseScore(
  item: Partial<TendancesItem>,
  userCommune?: string
): number {
  return calculateAfrigomboScore(item, userCommune).finalScore;
}

/**
 * Checks if a publication or Gombo is eligible to enter the Tendances showcase.
 * Rejects:
 * - Deleted, archived, suspended or invisible items
 * - Expired items (expiresAt, deadline)
 * - Future scheduled items (scheduledAt in future)
 * - Items without valid media (empty/broken media)
 * - Fake items or profiles without real engagement
 * - Stale items older than 14 days without active momentum (unless pinned by admin)
 * - Items with 0 engagement/views that don't meet natural threshold
 */
export function isTendancesEligible(item: Partial<TendancesItem>): boolean {
  if (!item) return false;

  // 1. Base sanity: Title and ID
  if (!item.id || !item.title || item.title.trim().length === 0) {
    return false;
  }

  // 2. Media validation: Must have a usable visual or audio thumbnail
  const hasValidMedia = !!(
    (item.imageUrl && item.imageUrl.trim().length > 5 && !item.imageUrl.includes("undefined")) ||
    (item.audioUrl && item.audioUrl.trim().length > 5) ||
    (item.videoUrl && item.videoUrl.trim().length > 5) ||
    ((item.rawItem as any)?.mediaUrl && String((item.rawItem as any)?.mediaUrl).trim().length > 5) ||
    ((item.rawItem as any)?.videoUrl && String((item.rawItem as any)?.videoUrl).trim().length > 5) ||
    ((item.rawItem as any)?.imageUrl && String((item.rawItem as any)?.imageUrl).trim().length > 5)
  );
  if (!hasValidMedia) return false;

  const now = Date.now();

  // 3. Raw item lifecycle checks (if available)
  if (item.rawItem) {
    const raw = item.rawItem as any;
    // Deleted / Hidden / Flagged
    if (raw.visible === false || raw.isDeleted === true || raw.isArchived === true) return false;
    if (raw.isFlagged === true) return false;

    const rawStatus = String(raw.status || raw.statut || "").toLowerCase().trim();
    if (
      rawStatus === "deleted" || 
      rawStatus === "supprime" || 
      rawStatus === "supprimé" || 
      rawStatus === "archived" || 
      rawStatus === "archive" || 
      rawStatus === "archivé" || 
      rawStatus === "archivée" || 
      rawStatus === "suspended" || 
      rawStatus === "suspendu" || 
      rawStatus === "suspendue" || 
      rawStatus === "draft" || 
      rawStatus === "brouillon"
    ) {
      return false;
    }

    // Gombo specific lifecycle checks
    if (item.type === "gombo") {
      if (
        rawStatus === "completed" || 
        rawStatus === "termine" || 
        rawStatus === "terminé" || 
        rawStatus === "cancelled" || 
        rawStatus === "annule" || 
        rawStatus === "annulé" || 
        rawStatus === "expired" || 
        rawStatus === "expire" || 
        rawStatus === "expiré"
      ) {
        return false;
      }
      if (isGomboExpired(raw)) {
        return false;
      }
    }

    // Expiration checks
    if (raw.expiresAt && new Date(raw.expiresAt).getTime() < now) return false;
    if (raw.expiresAtTimestamp && Number(raw.expiresAtTimestamp) < now) return false;
    if (raw.deadline && new Date(raw.deadline).getTime() < now) return false;

    // Scheduled publication check: Not published in the future
    if (raw.scheduledAt && new Date(raw.scheduledAt).getTime() > now) return false;
  }

  // 4. Direct item expiration and scheduled check
  if ((item as any).expiresAt && new Date((item as any).expiresAt).getTime() < now) return false;
  if ((item as any).scheduledAt && new Date((item as any).scheduledAt).getTime() > now) return false;

  // 5. Admin pinned or sponsored items are sovereign:
  // They bypass the 14-day age decay and bypass the 10-view engagement threshold,
  // but strictly respect all lifecycle, non-expiration, and non-deletion rules above.
  if (item.pinned || item.sponsored) {
    return true;
  }

  // 6. Age check: Trend naturally expires after 14 days (336 hours) without active pin
  const createdAtMs = item.createdAt || now;
  const ageHours = Math.max(0, (now - createdAtMs) / (1000 * 3600));
  if (ageHours > 336) {
    return false;
  }

  // 7. Natural Engagement Threshold: Must have real interaction
  const totalInteractions = 
    (item.likesCount || 0) + 
    (item.discussionsCount || 0) + 
    (item.sharesCount || 0) + 
    (item.favoritesCount || 0) + 
    (item.candidaturesCount || 0);

  const views = item.viewsCount || 0;

  // Must have at least 1 real active interaction OR at least 10 views
  if (totalInteractions === 0 && views < 10) {
    return false;
  }

  // Must have an engagement score >= 10
  const rawScore = calculateTrendingScore({
    viewsCount: item.viewsCount,
    favoritesCount: item.favoritesCount,
    sharesCount: item.sharesCount,
    discussionsCount: item.discussionsCount,
    candidaturesCount: item.candidaturesCount,
    likesCount: item.likesCount
  });

  if (rawScore < 10) {
    return false;
  }

  return true;
}

/**
 * Save or update a trending document in Firestore collection `trending/`
 */
export async function saveOrUpdateTrendingDoc(data: Partial<TrendingDoc>): Promise<void> {
  if (!data.publicationId) return;
  const docId = data.publicationId;
  const now = new Date().toISOString();

  const score = calculateTrendingScore({
    viewsCount: data.viewsCount || 0,
    favoritesCount: data.favoritesCount || 0,
    sharesCount: data.sharesCount || 0,
    discussionsCount: data.discussionsCount || 0,
    candidaturesCount: data.candidaturesCount || 0,
    likesCount: data.likesCount || 0
  });

  const payload: TrendingDoc = {
    id: docId,
    publicationId: docId,
    type: data.type || "gombo",
    title: data.title || "Publication Tendance",
    description: data.description || "",
    score,
    mode: data.mode || "auto",
    pinned: !!data.pinned,
    sponsored: !!data.sponsored,
    viewsCount: data.viewsCount || 0,
    favoritesCount: data.favoritesCount || 0,
    sharesCount: data.sharesCount || 0,
    discussionsCount: data.discussionsCount || 0,
    candidaturesCount: data.candidaturesCount || 0,
    likesCount: data.likesCount || 0,
    reportsCount: data.reportsCount || 0,
    createdAt: data.createdAt || now,
    updatedAt: now,
    authorName: data.authorName || "Artiste AFRIGOMBO",
    authorAvatar: data.authorAvatar || "",
    category: data.category || "general",
    commune: data.commune || "Abidjan",
    budget: data.budget || 0,
    imageUrl: data.imageUrl || "",
    audioUrl: data.audioUrl || "",
    isGomboIdVerified: !!data.isGomboIdVerified,
    isPremium: !!data.isPremium
  };

  try {
    await setDoc(doc(db, "trending", docId), payload, { merge: true });
  } catch (err) {
    console.error("Failed to save trending document to Firestore:", err);
  }
}

/**
 * Toggle pinned status for a publication in `trending/`
 */
export async function togglePinTrendingDoc(publicationId: string, pinned: boolean): Promise<void> {
  try {
    await setDoc(doc(db, "trending", publicationId), {
      pinned,
      mode: "manuel",
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("Failed to toggle pin in trending:", err);
  }
}

/**
 * Toggle sponsored status for a publication in `trending/`
 * Enforces max 3 sponsored publications.
 */
export async function toggleSponsorTrendingDoc(publicationId: string, sponsored: boolean): Promise<{ success: boolean; message?: string }> {
  try {
    if (sponsored) {
      const snap = await getDocs(collection(db, "trending"));
      const currentSponsored = snap.docs.filter(d => d.data().sponsored === true && d.id !== publicationId);
      if (currentSponsored.length >= 3) {
        return { success: false, message: "Limite atteinte : Maximum 3 publications sponsorisées autorisées simultanément !" };
      }
    }

    await setDoc(doc(db, "trending", publicationId), {
      sponsored,
      mode: sponsored ? "sponsor" : "manuel",
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return { success: true };
  } catch (err) {
    console.error("Failed to toggle sponsor in trending:", err);
    return { success: false, message: "Erreur lors de la mise à jour sponsorisée." };
  }
}

/**
 * Remove publication from `trending/`
 */
export async function removeTrendingDoc(publicationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "trending", publicationId));
  } catch (err) {
    console.error("Failed to remove doc from trending collection:", err);
  }
}

/**
 * Record interaction and recalculate score in Firestore
 */
export async function recordTrendingInteraction(
  publicationId: string,
  type: "view" | "favorite" | "share" | "comment" | "application" | "jhonore"
): Promise<void> {
  try {
    const ref = doc(db, "trending", publicationId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data() as TrendingDoc;
    let viewsCount = data.viewsCount || 0;
    let favoritesCount = data.favoritesCount || 0;
    let sharesCount = data.sharesCount || 0;
    let discussionsCount = data.discussionsCount || 0;
    let candidaturesCount = data.candidaturesCount || 0;
    let likesCount = data.likesCount || 0;

    switch (type) {
      case "view": viewsCount += 1; break;
      case "favorite": favoritesCount += 1; break;
      case "share": sharesCount += 1; break;
      case "comment": discussionsCount += 1; break;
      case "application": candidaturesCount += 1; break;
      case "jhonore": likesCount += 1; break;
    }

    const newScore = calculateTrendingScore({
      viewsCount,
      favoritesCount,
      sharesCount,
      discussionsCount,
      candidaturesCount,
      likesCount
    });

    await setDoc(ref, {
      viewsCount,
      favoritesCount,
      sharesCount,
      discussionsCount,
      candidaturesCount,
      likesCount,
      score: newScore,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Failed to record trending interaction in Firestore:", err);
  }
}

/**
 * Anti-Abuse Rate Limiter & Self-Interaction Shield
 */
const INTERACTION_COOLDOWN_MS = 1200;
const lastInteractionMap: Record<string, number> = {};

export function isInteractionAllowed(
  userId: string | undefined,
  authorId: string | undefined,
  actionKey: string
): { allowed: boolean; reason?: string } {
  // 1. Self-interaction check: Authors interacting with own post get no score bonus
  if (userId && authorId && userId === authorId && actionKey !== "view") {
    return { allowed: false, reason: "Self-interaction non comptabilisée dans le score" };
  }

  // 2. Cooldown check
  const now = Date.now();
  const userActionKey = `${userId || 'guest'}_${actionKey}`;
  const lastTime = lastInteractionMap[userActionKey] || 0;

  if (now - lastTime < INTERACTION_COOLDOWN_MS) {
    return { allowed: false, reason: "Veuillez patienter un instant (anti-abus)" };
  }

  lastInteractionMap[userActionKey] = now;
  return { allowed: true };
}

/**
 * Session view tracker to prevent view counts inflating on page refreshes
 */
export function recordUniqueViewInSession(postId: string): boolean {
  try {
    const sessionViews = JSON.parse(sessionStorage.getItem("afrigombo_session_views") || "{}");
    if (sessionViews[postId]) {
      return false; // Already viewed in this session
    }
    sessionViews[postId] = Date.now();
    sessionStorage.setItem("afrigombo_session_views", safeStringify(sessionViews));
    return true; // First time view in this session
  } catch (_) {
    return true;
  }
}

/**
 * Categorizes, filters by eligibility, and ranks items for the Tendances feed.
 * Enforces a natural ceiling of maximum 5 items.
 * If 0 qualify -> returns [] (0 items)
 * If 2 qualify -> returns 2 items
 * Never fabricates mock content to fill space.
 */
export function filterAndRankTendances(
  items: TendancesItem[],
  activeTab: TendancesCategoryTab,
  userCommune?: string,
  searchTerm: string = ""
): TendancesItem[] {
  // 1. Filter by eligibility: ONLY genuinely active, non-expired, non-deleted items with engagement
  const eligibleItems = items.filter(isTendancesEligible);

  // 2. Compute official AFRIGOMBO scores with velocity and continuous decay
  const scoredItems = eligibleItems.map(item => {
    const { finalScore, baseScore, decayMultiplier, velocity } = calculateAfrigomboScore(item, userCommune);
    return {
      ...item,
      baseScore,
      decayMultiplier,
      velocity,
      afrigomboScore: finalScore
    };
  });

  // 3. Search term filter
  let filtered = scoredItems;
  if (searchTerm.trim()) {
    const s = searchTerm.toLowerCase();
    filtered = filtered.filter(i => 
      String(i.title || "").toLowerCase().includes(s) || 
      String(i.description || "").toLowerCase().includes(s) || 
      String(i.commune || "").toLowerCase().includes(s) ||
      String(i.authorName || "").toLowerCase().includes(s) ||
      String(i.gomboRef || "").toLowerCase().includes(s)
    );
  }

  // 4. Category tab filter
  switch (activeTab) {
    case "gombos":
      filtered = filtered.filter(i => i.type === "gombo");
      break;

    case "publications":
    case "artistes":
      filtered = filtered.filter(i => i.type === "post");
      break;

    case "musique":
      filtered = filtered.filter(i => 
        i.category === "musique" || 
        String(i.title || "").toLowerCase().includes("musique") || 
        String(i.title || "").toLowerCase().includes("concert") ||
        String(i.title || "").toLowerCase().includes("orchestre") ||
        String(i.title || "").toLowerCase().includes("studio") ||
        String(i.title || "").toLowerCase().includes("beatmaker")
      );
      break;

    case "castings":
      filtered = filtered.filter(i => 
        i.category === "castings" || 
        String(i.title || "").toLowerCase().includes("casting") || 
        String(i.title || "").toLowerCase().includes("audition") ||
        String(i.title || "").toLowerCase().includes("recrutement") ||
        String(i.description || "").toLowerCase().includes("casting")
      );
      break;

    case "renfort":
      filtered = filtered.filter(i => 
        i.category === "renfort" || 
        String(i.title || "").toLowerCase().includes("urgent") || 
        String(i.title || "").toLowerCase().includes("renfort") ||
        String(i.description || "").toLowerCase().includes("ce soir") ||
        String(i.description || "").toLowerCase().includes("remplacement")
      );
      break;

    case "evenements":
      filtered = filtered.filter(i => 
        i.category === "evenements" || 
        String(i.title || "").toLowerCase().includes("événement") || 
        String(i.title || "").toLowerCase().includes("festival") ||
        String(i.title || "").toLowerCase().includes("spectacle") ||
        String(i.title || "").toLowerCase().includes("soirée")
      );
      break;

    case "marche":
      filtered = filtered.filter(i => 
        (i.category as string) === "marche" || 
        String(i.title || "").toLowerCase().includes("marché") || 
        String(i.title || "").toLowerCase().includes("matériel") ||
        String(i.title || "").toLowerCase().includes("instrument") ||
        String(i.title || "").toLowerCase().includes("sono") ||
        String(i.title || "").toLowerCase().includes("vente") ||
        String(i.title || "").toLowerCase().includes("location")
      );
      break;

    case "academie":
      filtered = filtered.filter(i => 
        (i.category as string) === "academie" || 
        String(i.title || "").toLowerCase().includes("académie") || 
        String(i.title || "").toLowerCase().includes("formation") ||
        String(i.title || "").toLowerCase().includes("masterclass") ||
        String(i.title || "").toLowerCase().includes("cours") ||
        String(i.title || "").toLowerCase().includes("atelier")
      );
      break;

    case "pres_de_moi":
      if (userCommune) {
        filtered = filtered.filter(i => 
          String(i.commune || "").toLowerCase().trim() === String(userCommune || "").toLowerCase().trim()
        );
      }
      break;

    case "tendances":
    default:
      // Global top ranked across all types
      break;
  }

  // 5. Strict sort:
  // Pinned first, then by official afrigomboScore (descending)
  const sorted = filtered.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.afrigomboScore || 0) - (a.afrigomboScore || 0);
  });

  // 6. Natural ceiling: Maximum 5 items.
  // If 0, 1, 2, 3, or 4 qualify, return exactly that number without padding.
  return sorted.slice(0, 5);
}
