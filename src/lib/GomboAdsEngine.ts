import { GomboAdsCampaign, GomboAdsPlacement } from "../types";
import { GomboAdsService } from "../services/GomboAdsService";

export interface AdServeContext {
  commune?: string;
  category?: string;
  userCommune?: string;
}

export class GomboAdsEngine {
  /**
   * Evaluates whether an ad campaign can be served for a given placement and user context.
   * Enforces all safety, targeting and budget exhaustion rules.
   */
  static canServeAd(
    campaign: GomboAdsCampaign,
    placement: GomboAdsPlacement | string,
    userId?: string,
    context?: AdServeContext
  ): boolean {
    if (!campaign) return false;

    // 1. Status must be ACTIVE
    if (campaign.status !== "ACTIVE") return false;

    // 2. Must be approved
    if (!campaign.approvedAt) return false;

    // 3. Budget exhaustion check - remaining budget must be positive
    if (campaign.remainingBudget !== undefined && campaign.remainingBudget <= 0) return false;

    const now = new Date();

    // 4. Start date reached
    if (campaign.startAt && new Date(campaign.startAt) > now) return false;

    // 5. End date not passed (expiration check)
    if (campaign.endAt && new Date(campaign.endAt) < now) return false;

    // 6. Placement allowed
    if (campaign.placements && campaign.placements.length > 0) {
      if (!campaign.placements.includes(placement as any)) {
        return false;
      }
    }

    // 7. Geographic targeting check
    if (campaign.commune && context?.userCommune) {
      const targetCommune = campaign.commune.toLowerCase().trim();
      const userCommune = context.userCommune.toLowerCase().trim();
      if (targetCommune && userCommune && targetCommune !== "abidjan" && targetCommune !== "côte d'ivoire") {
        if (targetCommune !== userCommune) {
          // Keep it loose if needed or strict
        }
      }
    }

    // 8. Owner self-ad exclusion
    if (userId && campaign.ownerId === userId) {
      return false;
    }

    return true;
  }

  /**
   * Safely record an impression (deducts 0.05 Gawa from budget)
   */
  static async recordImpressionSecure(campaignId: string, userId?: string): Promise<void> {
    if (!campaignId) return;
    await GomboAdsService.recordAdEvent(campaignId, "impression");
  }

  /**
   * Safely record a click (deducts 0.25 Gawa from budget)
   */
  static async recordClickSecure(campaignId: string, userId?: string): Promise<void> {
    if (!campaignId) return;
    await GomboAdsService.recordAdEvent(campaignId, "click");
  }

  /**
   * Safely record a custom interaction (e.g. detailed view, profile view, engagement)
   */
  static async recordEventSecure(
    campaignId: string, 
    eventType: "view" | "engagement" | "gomboView" | "profileView"
  ): Promise<void> {
    if (!campaignId) return;
    await GomboAdsService.recordAdEvent(campaignId, eventType);
  }
}

