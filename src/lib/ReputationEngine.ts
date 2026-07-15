import { User, Alerte } from "../types";

export interface ReputationDetails {
  completedGombos: number;
  cancelledGombos: number;
  averageRating: number;
  ratingCount: number;
  averagePunctuality: number;
  averageProfessionalism: number;
  averageCommunication: number;
  averageQuality: number;
  averageRespect: number;
  kycVerified: boolean;
  activeAlertsCount: number;
  seniorityDays: number;
  trustScore: number;
  badge: "Fiable" | "Très fiable" | "Excellence" | "Artiste Premium" | "Référence AFRIGOMBO" | "Standard";
}

export class ReputationEngine {
  /**
   * Calculates the overall trust score (0 - 100) and decides on the badge.
   */
  static calculateReputation(user: User, reviews: any[] = [], alerts: Alerte[] = []): ReputationDetails {
    const completedGombos = user.gombosCompleted || user.gombosTermines || user.gomboId?.prestationsTerminees || 0;
    const cancelledGombos = user.cancelledContracts || user.gomboId?.annulations || 0;
    const kycVerified = user.kycStatus === "approved";
    
    // Calculate average metrics from reviews
    let totalRating = 0;
    let totalPunctuality = 0;
    let totalProfessionalism = 0;
    let totalCommunication = 0;
    let totalQuality = 0;
    let totalRespect = 0;
    const ratingCount = reviews.length;

    if (ratingCount > 0) {
      reviews.forEach(r => {
        totalRating += r.rating || r.stars || 5;
        totalPunctuality += r.punctuality !== undefined ? r.punctuality : 5;
        totalProfessionalism += r.professionalism !== undefined ? r.professionalism : 5;
        totalCommunication += r.communication !== undefined ? r.communication : 5;
        totalQuality += r.quality !== undefined ? r.quality : 5;
        totalRespect += r.respect !== undefined ? r.respect : 5;
      });
    }

    const averageRating = ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(1)) : 4.0; // Default base rating
    const averagePunctuality = ratingCount > 0 ? Number((totalPunctuality / ratingCount).toFixed(1)) : 4.0;
    const averageProfessionalism = ratingCount > 0 ? Number((totalProfessionalism / ratingCount).toFixed(1)) : 4.0;
    const averageCommunication = ratingCount > 0 ? Number((totalCommunication / ratingCount).toFixed(1)) : 4.0;
    const averageQuality = ratingCount > 0 ? Number((totalQuality / ratingCount).toFixed(1)) : 4.0;
    const averageRespect = ratingCount > 0 ? Number((totalRespect / ratingCount).toFixed(1)) : 4.0;

    // 1. BASE SCORE: Starts at 60
    let score = 60;

    // 2. COMPLETED CONTRACTS: +4 points per completed contract, max 20 points
    score += Math.min(completedGombos * 4, 20);

    // 3. CANCELLED CONTRACTS PENALTY: -10 points per cancellation
    score -= cancelledGombos * 10;

    // 4. AVERAGE RATING WEIGHT: Up to 15 points
    if (ratingCount > 0) {
      if (averageRating >= 4.5) score += 15;
      else if (averageRating >= 4.0) score += 10;
      else if (averageRating >= 3.0) score += 5;
      else score -= 15; // Penalty for very poor ratings
    } else {
      score += 5; // Slight bonus for standard clean accounts
    }

    // 5. PUNCTUALITY BONUS/PENALTY: Up to 10 points
    if (ratingCount > 0) {
      if (averagePunctuality >= 4.5) score += 10;
      else if (averagePunctuality < 3.5) score -= 10;
    }

    // 6. GOMBO ID VERIFICATION: +15 points
    if (kycVerified) {
      score += 15;
    }

    // 7. SECURITY INCIDENTS / ALERTS PENALTY: -15 points per active alert
    const activeAlerts = alerts.filter(a => a.status === "open" && a.userId === user.uid);
    score -= activeAlerts.length * 15;

    // 8. SENIORITY BONUS: +5 points if registered > 15 days ago
    let seniorityDays = 0;
    const regDateStr = user.createdAt || user.registrationDate;
    if (regDateStr) {
      try {
        const regDate = new Date(regDateStr);
        const diffTime = Math.abs(Date.now() - regDate.getTime());
        seniorityDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (seniorityDays > 15) {
          score += 5;
        }
      } catch (e) {
        // ignore
      }
    }

    // Respect of payments is positive by default unless alerts flag unpaid.
    score += 5; // Standard compliance payment credit

    // Clamp score strictly between 0 and 100
    const trustScore = Math.max(0, Math.min(100, Math.round(score)));

    // 9. AUTOMATIC BADGES (Section 4)
    let badge: "Fiable" | "Très fiable" | "Excellence" | "Artiste Premium" | "Référence AFRIGOMBO" | "Standard" = "Standard";
    
    if (trustScore >= 98 && completedGombos >= 10 && averageRating >= 4.8) {
      badge = "Référence AFRIGOMBO";
    } else if (trustScore >= 95 && completedGombos >= 5) {
      badge = "Artiste Premium";
    } else if (trustScore >= 90) {
      badge = "Excellence";
    } else if (trustScore >= 80) {
      badge = "Très fiable";
    } else if (trustScore >= 70) {
      badge = "Fiable";
    }

    return {
      completedGombos,
      cancelledGombos,
      averageRating,
      ratingCount,
      averagePunctuality,
      averageProfessionalism,
      averageCommunication,
      averageQuality,
      averageRespect,
      kycVerified,
      activeAlertsCount: activeAlerts.length,
      seniorityDays,
      trustScore,
      badge
    };
  }

  /**
   * Detects automatic fraud markers on review submission.
   * Returns list of alerts if fraud is detected.
   */
  static runAntiFraudChecks(
    review: {
      contractId: string;
      reviewerId: string;
      revieweeId: string;
      rating: number;
      comment: string;
      punctuality?: number;
      professionalism?: number;
      communication?: number;
      quality?: number;
      respect?: number;
    },
    userReviews: any[],
    userContracts: any[]
  ): Alerte[] {
    const alerts: Alerte[] = [];
    const timestamp = new Date().toISOString();

    // 1. Comptes qui s'auto-notent (Self-rating detection)
    if (review.reviewerId === review.revieweeId) {
      alerts.push({
        userId: review.revieweeId,
        reason: "🚨 tentative d'auto-évaluation détectée sur le contrat " + review.contractId,
        severity: "high",
        timestamp,
        status: "open",
        type: "anti_fraude_self_rate",
        details: "L'utilisateur a tenté de s'attribuer une note sur son propre compte."
      });
    }

    // 2. Évaluations suspectes (Suspicious metrics mismatch or ultra-fast rating patterns)
    const isFiveStarWithAllLowSubMetrics = review.rating === 5 && (
      (review.punctuality !== undefined && review.punctuality <= 2) &&
      (review.professionalism !== undefined && review.professionalism <= 2)
    );

    if (isFiveStarWithAllLowSubMetrics) {
      alerts.push({
        userId: review.revieweeId,
        reason: "🚨 Évaluation suspecte détectée (Note de 5/5 avec critères de ponctualité/professionnalisme critiques)",
        severity: "medium",
        timestamp,
        status: "open",
        type: "anti_fraude_suspicious_rating",
        details: `L'utilisateur a reçu une note maximale de 5 mais avec des critères secondaires ultra-bas.`
      });
    }

    // Detect duplicate reviews from the same client to the same artist in a very short span
    const reviewsBySameReviewer = userReviews.filter(r => r.reviewerId === review.reviewerId);
    if (reviewsBySameReviewer.length >= 3) {
      alerts.push({
        userId: review.revieweeId,
        reason: "🚨 Activité de notation répétitive suspecte par le même promoteur",
        severity: "medium",
        timestamp,
        status: "open",
        type: "anti_fraude_repetitive_reviewer",
        details: `Le promoteur ${review.reviewerId} a évalué cet artiste ${reviewsBySameReviewer.length + 1} fois.`
      });
    }

    // 3. Annulations répétées (Excessive cancellation markers)
    const recentCancellations = userContracts.filter(c => c.status === "cancelled" && (c.clientId === review.revieweeId || c.artistId === review.revieweeId));
    if (recentCancellations.length >= 3) {
      alerts.push({
        userId: review.revieweeId,
        reason: "🚨 Annulations répétées de gombos artistiques détectées",
        severity: "high",
        timestamp,
        status: "open",
        type: "anti_fraude_repeated_cancellations",
        details: `L'utilisateur totalise ${recentCancellations.length} annulations de contrats sur la plateforme.`
      });
    }

    // 4. Signalements anormaux (Abnormal flagging)
    if (userReviews.some(r => r.comment && r.comment.toLowerCase().includes("arnaque") || r.comment.toLowerCase().includes("voleur"))) {
      alerts.push({
        userId: review.revieweeId,
        reason: "🚨 Signalement anormal : suspicion de fraude mentionnée dans les avis",
        severity: "high",
        timestamp,
        status: "open",
        type: "anti_fraude_abuse_mention",
        details: `Des mots-clés de fraude graves ont été détectés dans les commentaires de l'avis.`
      });
    }

    return alerts;
  }
}
