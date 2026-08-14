import { db } from "../lib/firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  increment,
  runTransaction
} from "firebase/firestore";
import { GomboAdsCampaign, GomboAdsType, GomboAdsStatus, GomboAdsPlacement } from "../types";
import { recordWalletTransaction, getCanonicalWalletBalance } from "../lib/financial";

export interface GomboAdsPricingRate {
  dailyRate: number; // in FCFA
  minDays: number;
}

export const GOMBO_ADS_DAILY_RATES: Record<GomboAdsType, number> = {
  gombo: 1000,
  profile: 1500,
  event: 2000,
  offer: 2500
};

export const GOMBO_ADS_DURATION_DISCOUNTS: Record<number, number> = {
  1: 0,
  3: 0.05,  // 5% reduction
  7: 0.10,  // 10% reduction
  14: 0.15, // 15% reduction
  30: 0.25  // 25% reduction
};

export interface CampaignCostBreakdown {
  type: GomboAdsType;
  durationDays: number;
  dailyRate: number;
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  totalCost: number;
  currency: string;
}

const processingCampaigns = new Set<string>();

export class GomboAdsService {
  /**
   * Calculate campaign cost centrally.
   * Client-side values cannot override this logic.
   */
  static calculateCampaignCost(type: GomboAdsType, durationDays: number): CampaignCostBreakdown {
    const dailyRate = GOMBO_ADS_DAILY_RATES[type] || 1000;
    const safeDuration = Math.max(1, Math.floor(durationDays));
    const subtotal = dailyRate * safeDuration;
    
    // Nearest matching discount
    let discountRate = 0;
    if (safeDuration >= 30) discountRate = 0.25;
    else if (safeDuration >= 14) discountRate = 0.15;
    else if (safeDuration >= 7) discountRate = 0.10;
    else if (safeDuration >= 3) discountRate = 0.05;

    const discountAmount = Math.round(subtotal * discountRate);
    const totalCost = Math.max(0, subtotal - discountAmount);

    return {
      type,
      durationDays: safeDuration,
      dailyRate,
      subtotal,
      discountRate,
      discountAmount,
      totalCost,
      currency: "FCFA"
    };
  }

  /**
   * Create a new campaign with atomic wallet balance check and deduction.
   */
  static async createCampaign(
    userProfile: any,
    payload: {
      type: GomboAdsType;
      targetId: string;
      title: string;
      description: string;
      mediaUrl?: string;
      locationName?: string;
      commune?: string;
      category?: string;
      durationDays: number;
      placements?: GomboAdsPlacement[];
    }
  ): Promise<{ success: boolean; campaignId?: string; error?: string }> {
    const userId = userProfile?.uid || userProfile?.id;
    if (!userId) {
      return { success: false, error: "Utilisateur non authentifié." };
    }

    const lockKey = `${userId}_${payload.targetId}_${payload.type}`;
    if (processingCampaigns.has(lockKey)) {
      return { success: false, error: "Une opération est déjà en cours pour ce contenu." };
    }

    processingCampaigns.add(lockKey);

    try {
      // 1. Calculate authoritative cost
      const cost = this.calculateCampaignCost(payload.type, payload.durationDays);

      // 2. Fetch fresh user doc from Firestore for balance check
      const userDocRef = doc(db, "users", userId);
      const userSnap = await getDoc(userDocRef);
      const userData = userSnap.exists() ? userSnap.data() : userProfile;

      const currentBalance = getCanonicalWalletBalance(userData) ?? 0;

      if (currentBalance < cost.totalCost) {
        return {
          success: false,
          error: `Solde insuffisant dans votre Wallet. Requis: ${cost.totalCost.toLocaleString("fr-FR")} FCFA, Solde disponible: ${currentBalance.toLocaleString("fr-FR")} FCFA.`
        };
      }

      // 3. Deduct wallet balance atomically via Firestore transaction
      const newBalance = currentBalance - cost.totalCost;
      await runTransaction(db, async (tx) => {
        const freshUserSnap = await tx.get(userDocRef);
        if (!freshUserSnap.exists()) {
          throw new Error("Compte utilisateur introuvable.");
        }
        const freshData = freshUserSnap.data();
        const freshBal = getCanonicalWalletBalance(freshData) ?? 0;
        if (freshBal < cost.totalCost) {
          throw new Error("Solde insuffisant pour finaliser le paiement.");
        }

        const updatedWallet = {
          ...(freshData.wallet || {}),
          soldeDisponible: freshBal - cost.totalCost
        };

        tx.update(userDocRef, {
          wallet: updatedWallet,
          walletBalance: freshBal - cost.totalCost,
          balance: freshBal - cost.totalCost,
          updatedAt: new Date().toISOString()
        });
      });

      // 4. Record wallet transaction
      const campaignId = `ads_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await recordWalletTransaction({
        userId,
        userName: userProfile.artisticName || userProfile.displayName || userProfile.name || "Membre Gombo",
        type: "gombo_ads_payment",
        amount: cost.totalCost,
        status: "success",
        description: `Paiement Campagne Gombo Ads (${payload.title}) - ${payload.durationDays} jour(s)`,
        reference: `tx_ads_${campaignId}`
      });

      // 5. Build campaign document
      const now = new Date();
      const isAdminOrFounder = Boolean(userProfile.isFounder || userProfile.isSuperFounder || userProfile.role === "admin");
      
      // Initial status: PENDING_REVIEW unless admin created it
      const status: GomboAdsStatus = isAdminOrFounder ? "ACTIVE" : "PENDING_REVIEW";
      
      const startAt = isAdminOrFounder ? now.toISOString() : undefined;
      const endAt = isAdminOrFounder
        ? new Date(now.getTime() + payload.durationDays * 86400000).toISOString()
        : undefined;

      const defaultPlacements: GomboAdsPlacement[] = payload.placements || [
        "accueil",
        "gombo",
        "decouverte"
      ];

      const newCampaign: GomboAdsCampaign = {
        id: campaignId,
        ownerId: userId,
        ownerName: userProfile.artisticName || userProfile.displayName || userProfile.name || "Membre Gombo",
        ownerAvatar: userProfile.photoURL || userProfile.avatarUrl || "",
        ownerPhone: userProfile.phone || userProfile.waveNumber || "",
        type: payload.type,
        targetId: payload.targetId,
        title: payload.title.substring(0, 100),
        description: payload.description.substring(0, 300),
        mediaUrl: payload.mediaUrl || "",
        locationName: payload.locationName || "Abidjan, Côte d'Ivoire",
        commune: payload.commune || userProfile.commune || "Cocody",
        category: payload.category || "Gombo",
        status,
        budget: cost.dailyRate,
        totalCost: cost.totalCost,
        currency: "FCFA",
        durationDays: payload.durationDays,
        startAt,
        endAt,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        approvedAt: isAdminOrFounder ? now.toISOString() : undefined,
        approvedBy: isAdminOrFounder ? userId : undefined,
        impressions: 0,
        clicks: 0,
        views: 0,
        conversions: 0,
        placements: defaultPlacements,
        frequencyCap: 3
      };

      await setDoc(doc(db, "gomboAdsCampaigns", campaignId), newCampaign);

      // 6. Send notification to user
      try {
        await setDoc(doc(db, "notifications", `notif_${campaignId}`), {
          id: `notif_${campaignId}`,
          userId,
          title: "📢 Campagne Gombo Ads créée !",
          message: isAdminOrFounder
            ? `Votre campagne "${payload.title}" est maintenant active pour ${payload.durationDays} jour(s).`
            : `Votre campagne "${payload.title}" a été soumise avec succès et est en cours de validation.`,
          type: "gombo_ads",
          read: false,
          createdAt: now.toISOString()
        });
      } catch (e) {
        console.warn("Non-critical notification save error:", e);
      }

      return { success: true, campaignId };
    } catch (err: any) {
      console.error("GomboAdsService.createCampaign failed:", err);
      return { success: false, error: err.message || "Erreur lors de la création de la campagne." };
    } finally {
      processingCampaigns.delete(lockKey);
    }
  }

  /**
   * Admin: Approve a campaign
   */
  static async approveCampaign(campaignId: string, adminId: string): Promise<boolean> {
    try {
      const campRef = doc(db, "gomboAdsCampaigns", campaignId);
      const campSnap = await getDoc(campRef);
      if (!campSnap.exists()) return false;

      const campaign = campSnap.data() as GomboAdsCampaign;
      const now = new Date();
      const startAt = now.toISOString();
      const endAt = new Date(now.getTime() + campaign.durationDays * 86400000).toISOString();

      await updateDoc(campRef, {
        status: "ACTIVE",
        startAt,
        endAt,
        approvedAt: startAt,
        approvedBy: adminId,
        updatedAt: startAt
      });

      // Send approval notification
      await setDoc(doc(db, "notifications", `notif_app_${campaignId}_${Date.now()}`), {
        id: `notif_app_${campaignId}_${Date.now()}`,
        userId: campaign.ownerId,
        title: "✅ Campagne Gombo Ads Approuvée !",
        message: `Votre campagne "${campaign.title}" est maintenant active sur AFRIGOMBO jusqu'au ${new Date(endAt).toLocaleDateString("fr-FR")}.`,
        type: "gombo_ads_approved",
        read: false,
        createdAt: now.toISOString()
      });

      return true;
    } catch (e) {
      console.error("Approve campaign error:", e);
      return false;
    }
  }

  /**
   * Admin: Reject a campaign with reason and issue full refund
   */
  static async rejectCampaign(
    campaignId: string,
    adminId: string,
    reason: string
  ): Promise<boolean> {
    try {
      const campRef = doc(db, "gomboAdsCampaigns", campaignId);
      const campSnap = await getDoc(campRef);
      if (!campSnap.exists()) return false;

      const campaign = campSnap.data() as GomboAdsCampaign;
      const now = new Date();

      // Update status
      await updateDoc(campRef, {
        status: "REJECTED",
        rejectedAt: now.toISOString(),
        rejectedBy: adminId,
        rejectionReason: reason || "Campagne non conforme aux règles de la plateforme.",
        updatedAt: now.toISOString()
      });

      // Refund user wallet
      const userDocRef = doc(db, "users", campaign.ownerId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentBal = getCanonicalWalletBalance(userData) ?? 0;
        const newBal = currentBal + campaign.totalCost;

        await updateDoc(userDocRef, {
          wallet: {
            ...(userData.wallet || {}),
            soldeDisponible: newBal
          },
          walletBalance: newBal,
          balance: newBal,
          updatedAt: now.toISOString()
        });

        // Record refund transaction
        await recordWalletTransaction({
          userId: campaign.ownerId,
          userName: campaign.ownerName,
          type: "gombo_ads_refund",
          amount: campaign.totalCost,
          status: "success",
          description: `Remboursement Campagne Refusée (${campaign.title})`,
          reference: `refund_${campaignId}`
        });
      }

      // Notify owner
      await setDoc(doc(db, "notifications", `notif_rej_${campaignId}_${Date.now()}`), {
        id: `notif_rej_${campaignId}_${Date.now()}`,
        userId: campaign.ownerId,
        title: "❌ Campagne Gombo Ads Refusée",
        message: `Votre campagne "${campaign.title}" a été refusée pour la raison suivante : "${reason}". Un remboursement de ${campaign.totalCost.toLocaleString("fr-FR")} FCFA a été crédité sur votre Wallet.`,
        type: "gombo_ads_rejected",
        read: false,
        createdAt: now.toISOString()
      });

      return true;
    } catch (e) {
      console.error("Reject campaign error:", e);
      return false;
    }
  }

  /**
   * Pause campaign by owner or admin
   */
  static async pauseCampaign(campaignId: string): Promise<boolean> {
    try {
      const campRef = doc(db, "gomboAdsCampaigns", campaignId);
      await updateDoc(campRef, {
        status: "PAUSED",
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error("Pause campaign error:", e);
      return false;
    }
  }

  /**
   * Resume paused campaign
   */
  static async resumeCampaign(campaignId: string): Promise<boolean> {
    try {
      const campRef = doc(db, "gomboAdsCampaigns", campaignId);
      await updateDoc(campRef, {
        status: "ACTIVE",
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error("Resume campaign error:", e);
      return false;
    }
  }

  /**
   * Archive campaign
   */
  static async archiveCampaign(campaignId: string): Promise<boolean> {
    try {
      const campRef = doc(db, "gomboAdsCampaigns", campaignId);
      await updateDoc(campRef, {
        status: "ARCHIVED",
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error("Archive campaign error:", e);
      return false;
    }
  }

  /**
   * Track ad impression
   */
  static async recordImpression(campaignId: string): Promise<void> {
    try {
      const campRef = doc(db, "gomboAdsCampaigns", campaignId);
      await updateDoc(campRef, {
        impressions: increment(1)
      });
    } catch (e) {
      // ignore impression logging errors silently
    }
  }

  /**
   * Track ad click
   */
  static async recordClick(campaignId: string): Promise<void> {
    try {
      const campRef = doc(db, "gomboAdsCampaigns", campaignId);
      await updateDoc(campRef, {
        clicks: increment(1)
      });
    } catch (e) {
      // ignore click logging errors
    }
  }

  /**
   * Listen to user campaigns in real-time
   */
  static listenUserCampaigns(userId: string, callback: (campaigns: GomboAdsCampaign[]) => void) {
    const q = query(
      collection(db, "gomboAdsCampaigns"),
      where("ownerId", "==", userId)
    );

    return onSnapshot(
      q,
      (snap) => {
        const list: GomboAdsCampaign[] = [];
        const now = new Date();

        snap.forEach((docSnap) => {
          const item = { id: docSnap.id, ...docSnap.data() } as GomboAdsCampaign;

          // Check automatic expiration
          if (
            item.status === "ACTIVE" &&
            item.endAt &&
            new Date(item.endAt) < now
          ) {
            item.status = "EXPIRED";
            // Update asynchronously
            updateDoc(doc(db, "gomboAdsCampaigns", item.id), {
              status: "EXPIRED",
              updatedAt: now.toISOString()
            }).catch(() => {});
          }

          list.push(item);
        });

        // Sort by createdAt desc
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      (err) => {
        console.warn("User campaigns listener error:", err);
        callback([]);
      }
    );
  }

  /**
   * Admin: Listen to all campaigns
   */
  static listenAllCampaigns(callback: (campaigns: GomboAdsCampaign[]) => void) {
    const q = query(collection(db, "gomboAdsCampaigns"));

    return onSnapshot(
      q,
      (snap) => {
        const list: GomboAdsCampaign[] = [];
        const now = new Date();

        snap.forEach((docSnap) => {
          const item = { id: docSnap.id, ...docSnap.data() } as GomboAdsCampaign;

          // Check automatic expiration
          if (
            item.status === "ACTIVE" &&
            item.endAt &&
            new Date(item.endAt) < now
          ) {
            item.status = "EXPIRED";
            updateDoc(doc(db, "gomboAdsCampaigns", item.id), {
              status: "EXPIRED",
              updatedAt: now.toISOString()
            }).catch(() => {});
          }

          list.push(item);
        });

        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      (err) => {
        console.warn("All campaigns listener error:", err);
        callback([]);
      }
    );
  }

  /**
   * Fetch active ads for a specific placement
   */
  static listenActivePlacementAds(
    placement: GomboAdsPlacement,
    callback: (ads: GomboAdsCampaign[]) => void
  ) {
    const q = query(
      collection(db, "gomboAdsCampaigns"),
      where("status", "==", "ACTIVE")
    );

    return onSnapshot(
      q,
      (snap) => {
        const list: GomboAdsCampaign[] = [];
        const now = new Date();

        snap.forEach((docSnap) => {
          const item = { id: docSnap.id, ...docSnap.data() } as GomboAdsCampaign;

          // Check expiration
          if (item.endAt && new Date(item.endAt) < now) {
            updateDoc(doc(db, "gomboAdsCampaigns", item.id), {
              status: "EXPIRED",
              updatedAt: now.toISOString()
            }).catch(() => {});
            return;
          }

          // Filter placement
          if (!item.placements || item.placements.includes(placement)) {
            list.push(item);
          }
        });

        callback(list);
      },
      (err) => {
        console.warn(`Placement ads listener error (${placement}):`, err);
        callback([]);
      }
    );
  }
}
