import { ReelItem } from "../components/ReelsPlayer";

export interface ReelRankingContext {
  currentUserId?: string;
  followedUsers?: string[];
  seenReelIds?: Set<string>;
  sessionTimestamp?: number;
}

/**
 * Dynamic Ranking Algorithm for AFRIGOMBO Reels
 * 
 * Scores reels based on real engagement, recency, user affinity,
 * content discovery, and author diversity.
 * 
 * Score Formula:
 *   score = Engagement (Likes*3 + Comments*5 + Views*0.5)
 *         + Recency Boost (exponential decay based on post age)
 *         + Author Affinity (+25 if user follows creator)
 *         + User Interaction (+15 if user already liked)
 *         - Seen Penalty (-100 if recently viewed in session)
 *         + Controlled Discovery Jitter (0-5 pseudo-random offset based on session)
 */
export function scoreReel(reel: ReelItem, context: ReelRankingContext, now: number): number {
  let score = 0;

  // 1. REAL ENGAGEMENT METRICS
  const likes = Math.max(0, reel.likesCount || 0);
  const comments = Math.max(0, reel.commentsCount || 0);
  const views = Math.max(0, (reel as any).viewsCount || (reel as any).views || 0);

  const engagementScore = (likes * 3) + (comments * 5) + (views * 0.5);
  score += engagementScore;

  // 2. RECENCY BOOST
  const createdAt = (reel as any).createdAt || (reel as any).timestamp || (reel as any).date;
  if (createdAt) {
    const timeMs = typeof createdAt === "number" ? createdAt : (new Date(createdAt).getTime() || now);
    const ageHours = Math.max(0.1, (now - timeMs) / (1000 * 60 * 60));
    // Fresher content gets up to 50 bonus points decaying over 12h periods
    const recencyBoost = Math.max(0, 50 / (1 + ageHours / 12));
    score += recencyBoost;
  } else {
    score += 10;
  }

  // 3. AUTHOR AFFINITY
  if (reel.userId && context.followedUsers?.includes(reel.userId)) {
    score += 25;
  }

  // 4. USER INTERACTION
  if (reel.isLiked) {
    score += 15;
  }

  // 5. SEEN CONTENT PENALTY
  if (context.seenReelIds && context.seenReelIds.has(reel.id)) {
    score -= 100;
  }

  // 6. CONTROLLED DISCOVERY JITTER
  // Deterministic pseudo-random jitter derived from reel ID + session time
  // Guarantees each opening/session produces a dynamic feed without breaking engagement hierarchy
  const hashStr = `${reel.id}_${now.toString().slice(-4)}`;
  let hashNum = 0;
  for (let i = 0; i < hashStr.length; i++) {
    hashNum = (hashNum << 5) - hashNum + hashStr.charCodeAt(i);
    hashNum |= 0;
  }
  const discoveryJitter = (Math.abs(hashNum) % 100) / 20; // 0 to 5 points
  score += discoveryJitter;

  return score;
}

export function rankReels(reels: ReelItem[], context: ReelRankingContext): ReelItem[] {
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
  const result: ReelItem[] = [];
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
          const candidateAuthor = pool[i].reel.userId || pool[i].reel.authorName;
          if (candidateAuthor !== prev1) {
            chosenIdx = i;
            break;
          }
        }
      }
    }

    const [picked] = pool.splice(chosenIdx, 1);
    result.push(picked.reel);
    const authorKey = picked.reel.userId || picked.reel.authorName;
    lastAuthors.push(authorKey);
  }

  return result;
}
