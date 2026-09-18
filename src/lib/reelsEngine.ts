import { ReelItem } from "../components/ReelsPlayer";

export interface ReelRankingContext {
  currentUserId?: string;
  followedUsers?: string[];
  seenReelIds?: Set<string>;
  sessionTimestamp?: number;
  userCommune?: string;
  userInterests?: string[];
}

/**
 * Advanced Ranking Algorithm for AFRIGOMBO Reels (TikTok & Facebook Reels Model)
 * 
 * Scores reels based on:
 * 1. High-weight viral engagement (Likes, Comments, Shares/Renforts, Loops)
 * 2. TikTok Cold-Start discovery boost for fresh creator content (< 24h-48h)
 * 3. Facebook Reels local geographic affinity (Commune proximity)
 * 4. Thematic & musical interest matching (Zouglou, Coupé-Décalé, Afro-Jazz, Rap, etc.)
 * 5. Creator affinity (followed artists & interactions)
 * 6. Author diversity re-ordering (prevents author fatigue)
 */
export function scoreReel(reel: any, context: ReelRankingContext, now: number): number {
  let score = 0;

  // 1. REAL ENGAGEMENT MULTIPLIERS (TikTok / Facebook weighted virality)
  const likes = Math.max(0, reel.likesCount || (Array.isArray(reel.likes) ? reel.likes.length : 0) || (Array.isArray(reel.likedBy) ? reel.likedBy.length : 0) || 0);
  const comments = Math.max(0, reel.commentsCount || (Array.isArray(reel.comments) ? reel.comments.length : 0) || 0);
  const views = Math.max(0, (reel as any).viewsCount || (reel as any).views || (reel as any).viewCount || 0);
  const shares = Math.max(0, (reel as any).sharesCount || (reel as any).shares || (reel as any).renfortsCount || 0);

  // Social algorithm weighting: comments & viral shares are highest signal
  const engagementScore = (likes * 4) + (comments * 8) + (shares * 12) + (views * 1);
  score += engagementScore;

  // 2. RECENCY & TIKTOK COLD-START DISCOVERY
  const createdAt = (reel as any).createdAt || (reel as any).timestamp || (reel as any).date;
  if (createdAt) {
    const timeMs = typeof createdAt === "number" ? createdAt : (new Date(createdAt).getTime() || now);
    const ageHours = Math.max(0.05, (now - timeMs) / (1000 * 60 * 60));
    
    // Smooth decay over time
    const recencyBoost = Math.max(0, 60 / (1 + ageHours / 18));
    score += recencyBoost;

    // TikTok Cold-Start Exploratory Pool:
    // Boost fresh videos (<24h) by +35 pts, and (<48h) by +20 pts so new artists get organic discovery
    if (ageHours <= 24) {
      score += 35;
    } else if (ageHours <= 48) {
      score += 20;
    }
  } else {
    // Default baseline for evergreen portfolio showcases
    score += 15;
  }

  // 3. LOCAL AFFINITY (Facebook Reels geographic relevance)
  const reelCommune = reel.commune || (reel as any).location;
  if (context.userCommune && reelCommune) {
    const normUserCommune = String(context.userCommune).toLowerCase().trim();
    const normReelCommune = String(reelCommune).toLowerCase().trim();
    if (normUserCommune && (normReelCommune.includes(normUserCommune) || normUserCommune.includes(normReelCommune))) {
      score += 30; // Strong local boost
    }
  }

  // 4. THEMATIC & INTEREST AFFINITY
  if (context.userInterests && context.userInterests.length > 0) {
    const contentText = `${reel.title || ""} ${reel.content || ""} ${(reel.hashtags || []).join(" ")} ${reel.category || ""}`.toLowerCase();
    const matchesInterest = context.userInterests.some(interest => 
      interest && contentText.includes(String(interest).toLowerCase().trim())
    );
    if (matchesInterest) {
      score += 25;
    }
  }

  // 5. CREATOR & USER AFFINITY
  const creatorId = reel.userId || (reel as any).authorId;
  if (creatorId && context.followedUsers?.includes(creatorId)) {
    score += 40; // Followed artist strong boost
  }

  if (reel.isLiked) {
    score += 25; // Re-surfacing favorite content
  }

  // 6. SEEN CONTENT PENALTY
  if (context.seenReelIds && context.seenReelIds.has(reel.id)) {
    score -= reel.isLiked ? 30 : 120;
  }

  // 7. CONTROLLED DISCOVERY JITTER (Deterministic pseudo-random variation)
  const hashStr = `${reel.id}_${now.toString().slice(-4)}`;
  let hashNum = 0;
  for (let i = 0; i < hashStr.length; i++) {
    hashNum = (hashNum << 5) - hashNum + hashStr.charCodeAt(i);
    hashNum |= 0;
  }
  const discoveryJitter = (Math.abs(hashNum) % 100) / 15;
  score += discoveryJitter;

  return score;
}

export function rankReels<T extends { id?: string; userId?: string; authorName?: string }>(reels: T[], context: ReelRankingContext): T[] {
  if (!reels || reels.length === 0) return [];

  const now = context.sessionTimestamp || Date.now();

  // Score all reels
  const scored = reels.map(reel => ({
    reel,
    score: scoreReel(reel, context, now)
  }));

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Apply Author Diversity Re-ordering (limit consecutive reels by the same creator)
  const result: T[] = [];
  const pool = [...scored];
  const lastAuthors: string[] = [];

  while (pool.length > 0) {
    let chosenIdx = 0;

    // If last two items are from the same author, pick next highest scored reel from a different author
    if (lastAuthors.length >= 2) {
      const prev1 = lastAuthors[lastAuthors.length - 1];
      const prev2 = lastAuthors[lastAuthors.length - 2];

      if (prev1 === prev2) {
        for (let i = 0; i < pool.length; i++) {
          const candidateAuthor = (pool[i].reel as any).userId || (pool[i].reel as any).authorName;
          if (candidateAuthor !== prev1) {
            chosenIdx = i;
            break;
          }
        }
      }
    }

    const [picked] = pool.splice(chosenIdx, 1);
    result.push(picked.reel);
    const authorKey = (picked.reel as any).userId || (picked.reel as any).authorName || "";
    lastAuthors.push(authorKey);
  }

  return result;
}

