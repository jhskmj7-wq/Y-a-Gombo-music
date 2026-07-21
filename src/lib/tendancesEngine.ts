import { Gombo, Post } from "../types";

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
  likesCount: number;        // 👍 J'honore (+5)
  candidaturesCount: number; // 🤝 Candidatures (+10)
  viewsCount: number;        // 👀 Consultations (+1 per 5 views)
  discussionsCount: number;  // 💬 Discussions (+8)
  sharesCount: number;       // 📤 Partages (+7)
  favoritesCount: number;    // ⭐ Favoris (+6)
  reportsCount: number;      // 🚨 Signalements (-30)
  
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
 * Calculate the raw base engagement score before time decay
 */
export function calculateBaseScore(
  item: Partial<TendancesItem>,
  userCommune?: string
): number {
  let score = 0;

  // 1. Engagement Metrics
  score += (item.likesCount || 0) * 5;           // 👍 +5
  score += (item.candidaturesCount || 0) * 10;   // 🤝 +10
  score += Math.floor((item.viewsCount || 0) / 5); // 👀 +1 per 5 views
  score += (item.discussionsCount || 0) * 8;     // 💬 +8
  score += (item.sharesCount || 0) * 7;          // 📤 +7
  score += (item.favoritesCount || 0) * 6;       // ⭐ +6

  // 2. Geographic Proximity Bonus (📍 +15 pts)
  if (
    userCommune &&
    item.commune &&
    userCommune.trim().toLowerCase() === item.commune.trim().toLowerCase()
  ) {
    score += 15;
  }

  // 3. Verified Gombo ID Bonus (🛡️ +10 pts)
  if (item.isGomboIdVerified) {
    score += 10;
  }

  // 4. Premium Account Bonus (👑 +10 pts ONLY - Fair boost)
  if (item.isPremium) {
    score += 10;
  }

  // 5. Reports Penalty (🚨 -30 pts per signalement)
  score -= (item.reportsCount || 0) * 30;

  return Math.max(0, score);
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
