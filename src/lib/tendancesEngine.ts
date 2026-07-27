import { Gombo, Post } from "../types";
import { db } from "../firebase";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

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
  isGomboIdVerified?: boolean;
  isPremium?: boolean;
}

export interface TendancesItem {
  id: string;
  type: "gombo" | "post";
  title: string;
  description: string;
  category: "musique" | "castings" | "renfort" | "evenements" | "general";
  commune: string;
  authorUid?: string;
  authorName?: string;
  authorAvatar?: string;
  isGomboIdVerified?: boolean;
  isPremium?: boolean;
  budget?: number;
  imageUrl?: string;
  audioUrl?: string;
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
  rawItem?: Gombo | Post;
}

export type TendancesCategoryTab = 
  | "tendances"   // 🔥 Top global
  | "musique"     // 🎵 Musique
  | "castings"    // 🎤 Castings
  | "renfort"     // 🤝 Renfort Express
  | "evenements"  // 📅 Événements
  | "pres_de_moi"; // 📍 Près de moi

/**
 * EXACT SCORE FORMULA REQUIRED BY SPEC:
 * score = (views * 1) + (favorites * 5) + (shares * 10) + (comments * 8) + (applications * 20) + (jhonore * 12)
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
 * Calculate the raw base engagement score before time decay
 */
export function calculateBaseScore(
  item: Partial<TendancesItem>,
  userCommune?: string
): number {
  const score = calculateTrendingScore({
    viewsCount: item.viewsCount,
    favoritesCount: item.favoritesCount,
    sharesCount: item.sharesCount,
    discussionsCount: item.discussionsCount,
    candidaturesCount: item.candidaturesCount,
    likesCount: item.likesCount
  });

  let bonus = 0;
  // Geographic Proximity Bonus
  if (
    userCommune &&
    item.commune &&
    userCommune.trim().toLowerCase() === item.commune.trim().toLowerCase()
  ) {
    bonus += 15;
  }
  if (item.isGomboIdVerified) bonus += 10;
  if (item.isPremium) bonus += 10;
  const penalty = (item.reportsCount || 0) * 30;

  return Math.max(0, score + bonus - penalty);
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
 * Calculate Time Decay Multiplier (Fraîcheur)
 * Uses continuous exponential decay: score * e^(-0.012 * hours)
 */
export function calculateTimeDecayMultiplier(createdAtMs: number): number {
  const now = Date.now();
  const ageMs = Math.max(0, now - createdAtMs);
  const hoursOld = ageMs / (1000 * 60 * 60);

  // Decay factor: ~0.86 at 12h, ~0.75 at 24h, ~0.56 at 48h, ~0.13 at 7 days
  const decay = Math.exp(-0.012 * hoursOld);
  
  // Floor at 0.05 so older gems remain visible if highly scored
  return Math.max(0.05, decay);
}

/**
 * Calculate the final official AFRIGOMBO Score
 */
export function calculateAfrigomboScore(
  item: Partial<TendancesItem>,
  userCommune?: string
): { finalScore: number; baseScore: number; decayMultiplier: number } {
  const baseScore = calculateBaseScore(item, userCommune);
  const createdAtMs = item.createdAt || Date.now();
  const decayMultiplier = calculateTimeDecayMultiplier(createdAtMs);
  const finalScore = Math.round(baseScore * decayMultiplier);

  return { finalScore, baseScore, decayMultiplier };
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
    sessionStorage.setItem("afrigombo_session_views", JSON.stringify(sessionViews));
    return true; // First time view in this session
  } catch (_) {
    return true;
  }
}

/**
 * Categorizes and ranks items for the Tendances feed
 */
export function filterAndRankTendances(
  items: TendancesItem[],
  activeTab: TendancesCategoryTab,
  userCommune?: string,
  searchTerm: string = ""
): TendancesItem[] {
  // Compute scores for all items
  const scoredItems = items.map(item => {
    const { finalScore, baseScore, decayMultiplier } = calculateAfrigomboScore(item, userCommune);
    return {
      ...item,
      baseScore,
      decayMultiplier,
      afrigomboScore: finalScore
    };
  });

  // Filter by category & search term
  let filtered = scoredItems;

  if (searchTerm.trim()) {
    const s = searchTerm.toLowerCase();
    filtered = filtered.filter(i => 
      i.title.toLowerCase().includes(s) || 
      i.description.toLowerCase().includes(s) || 
      i.commune.toLowerCase().includes(s) ||
      (i.authorName || "").toLowerCase().includes(s)
    );
  }

  switch (activeTab) {
    case "musique":
      filtered = filtered.filter(i => 
        i.category === "musique" || 
        i.title.toLowerCase().includes("musique") || 
        i.title.toLowerCase().includes("concert") ||
        i.title.toLowerCase().includes("orchestre") ||
        i.title.toLowerCase().includes("studio") ||
        i.title.toLowerCase().includes("beatmaker")
      );
      break;

    case "castings":
      filtered = filtered.filter(i => 
        i.category === "castings" || 
        i.title.toLowerCase().includes("casting") || 
        i.title.toLowerCase().includes("audition") ||
        i.title.toLowerCase().includes("recrutement") ||
        i.description.toLowerCase().includes("casting")
      );
      break;

    case "renfort":
      filtered = filtered.filter(i => 
        i.category === "renfort" || 
        i.title.toLowerCase().includes("urgent") || 
        i.title.toLowerCase().includes("renfort") ||
        i.description.toLowerCase().includes("ce soir") ||
        i.description.toLowerCase().includes("remplacement")
      );
      break;

    case "evenements":
      filtered = filtered.filter(i => 
        i.category === "evenements" || 
        i.title.toLowerCase().includes("événement") || 
        i.title.toLowerCase().includes("festival") ||
        i.title.toLowerCase().includes("spectacle") ||
        i.title.toLowerCase().includes("soirée")
      );
      break;

    case "pres_de_moi":
      if (userCommune) {
        filtered = filtered.filter(i => 
          i.commune.toLowerCase().trim() === userCommune.toLowerCase().trim()
        );
      }
      break;

    case "tendances":
    default:
      // Global top ranked
      break;
  }

  // Sort strictly by AFRIGOMBO Score (descending)
  return filtered.sort((a, b) => (b.afrigomboScore || 0) - (a.afrigomboScore || 0));
}
