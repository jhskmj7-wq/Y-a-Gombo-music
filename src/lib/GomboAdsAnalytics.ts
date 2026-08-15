import { GomboAdsCampaign } from "../types";

export interface CampaignAnalyticsSummary {
  impressions: number;
  clicks: number;
  views: number;
  uniqueViews: number;
  engagements: number;
  gomboViews: number;
  profileViews: number;
  ctr: string;              // Click-Through Rate (%)
  vtr: string;              // View-Through Rate (%)
  er: string;               // Engagement Rate (%)
  initialBudget: number;
  spentBudget: number;
  remainingBudget: number;
  spentPercentage: string;  // % of budget consumed
  avgCostPerImpression: string;
  avgCostPerClick: string;
}

export class GomboAdsAnalytics {
  static getSummary(campaign: GomboAdsCampaign): CampaignAnalyticsSummary {
    const impressions = campaign.impressions || 0;
    const clicks = campaign.clicks || 0;
    const views = campaign.views || 0;
    const uniqueViews = campaign.uniqueViews || 0;
    const engagements = campaign.engagements || 0;
    const gomboViews = campaign.gomboViews || 0;
    const profileViews = campaign.profileViews || 0;

    const initialBudget = campaign.initialBudget || campaign.totalCost || 0;
    const spentBudget = campaign.spentBudget || 0;
    const remainingBudget = campaign.remainingBudget !== undefined ? campaign.remainingBudget : (initialBudget - spentBudget);

    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0.00";
    const vtr = impressions > 0 ? ((views / impressions) * 100).toFixed(2) : "0.00";
    const er = impressions > 0 ? ((engagements / impressions) * 100).toFixed(2) : "0.00";

    const spentPercentage = initialBudget > 0 ? ((spentBudget / initialBudget) * 100).toFixed(1) : "0.0";
    const avgCostPerImpression = impressions > 0 ? (spentBudget / impressions).toFixed(4) : "0.0000";
    const avgCostPerClick = clicks > 0 ? (spentBudget / clicks).toFixed(2) : "0.00";

    return {
      impressions,
      clicks,
      views,
      uniqueViews,
      engagements,
      gomboViews,
      profileViews,
      ctr,
      vtr,
      er,
      initialBudget,
      spentBudget,
      remainingBudget,
      spentPercentage,
      avgCostPerImpression,
      avgCostPerClick
    };
  }
}

