import { GomboAdsCampaign } from "../types";

export interface TargetingFilter {
  commune?: string;
  category?: string;
  radiusKm?: number;
}

export class GomboAdsTargeting {
  /**
   * Matches whether a user matches campaign target audience
   */
  static matchAudience(campaign: GomboAdsCampaign, userProfile: any): boolean {
    if (!campaign.targetAudience && !campaign.commune) return true;

    const userCommune = (userProfile?.commune || "").toLowerCase().trim();
    const campaignCommune = (campaign.commune || "").toLowerCase().trim();

    if (campaignCommune && campaignCommune !== "abidjan" && campaignCommune !== "côte d'ivoire") {
      if (userCommune && userCommune !== campaignCommune) {
        return false;
      }
    }

    return true;
  }
}
