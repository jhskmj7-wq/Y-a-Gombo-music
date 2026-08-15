import { db } from "../lib/firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  increment,
  runTransaction
} from "firebase/firestore";
import { GomboAdsCampaign, GomboAdsType, GomboAdsStatus, GomboAdsPlacement } from "../types";

export interface GomboAdsOffer {
  id: string;
  name: string;
  priceGawa: number;
  durationDays: number;
  budgetGawa: number;
  placements: GomboAdsPlacement[];
  enabled: boolean;
}

export interface GomboAdsConfig {
  enabled: boolean;
  allowNewCampaigns: boolean;
  allowActiveDelivery: boolean;
  placementsConfig: Record<GomboAdsPlacement, boolean>;
}

export const DEFAULT_OFFERS: GomboAdsOffer[] = [
  {
    id: "starter",
    name: "Starter",
    priceGawa: 100,
    durationDays: 1,
    budgetGawa: 100,
    placements: ["accueil", "gombo"],
    enabled: true
  },
  {
    id: "boost",
    name: "Boost",
    priceGawa: 250,
    durationDays: 3,
    budgetGawa: 250,
    placements: ["accueil", "gombo", "decouverte"],
    enabled: true
  },
  {
    id: "premium",
    name: "Premium",
    priceGawa: 500,
    durationDays: 7,
    budgetGawa: 500,
    placements: ["accueil", "gombo", "decouverte", "profil", "reels"],
    enabled: true
  }
];

export const DEFAULT_CONFIG: GomboAdsConfig = {
  enabled: true,
  allowNewCampaigns: true,
  allowActiveDelivery: true,
  placementsConfig: {
    accueil: true,
    gombo: true,
    decouverte: true,
    profil: true,
    reels: true,
    evenements: true
  }
};

const processingPayments = new Set<string>();

export class GomboAdsService {
  /**
   * Fetch active offers config from Firestore, initialize defaults if not existing
   */
  static async getOffers(): Promise<GomboAdsOffer[]> {
    try {
      const docRef = doc(db, "system_settings", "gomboAdsPricing");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.offers && Array.isArray(data.offers)) {
          return data.offers;
        }
      }
      // Initialize with defaults
      await setDoc(docRef, { offers: DEFAULT_OFFERS, updatedAt: new Date().toISOString() });
      return DEFAULT_OFFERS;
    } catch (err) {
      console.error("GomboAdsService.getOffers error:", err);
      return DEFAULT_OFFERS;
    }
  }

  /**
   * Save pricing offers (Super Founder exclusive)
   */
  static async updateOffers(offers: GomboAdsOffer[], adminId: string): Promise<boolean> {
    try {
      const docRef = doc(db, "system_settings", "gomboAdsPricing");
      const snap = await getDoc(docRef);
      const oldVal = snap.exists() ? snap.data()?.offers : DEFAULT_OFFERS;

      await setDoc(docRef, { offers, updatedAt: new Date().toISOString() });
      
      await this.logAdminAction({
        adminId,
        action: "tarif_modifie",
        campaignId: "",
        oldValue: JSON.stringify(oldVal),
        newValue: JSON.stringify(offers)
      });
      return true;
    } catch (err) {
      console.error("GomboAdsService.updateOffers error:", err);
      return false;
    }
  }

  /**
   * Fetch global config settings, initialize defaults if not existing
   */
  static async getConfig(): Promise<GomboAdsConfig> {
    try {
      const docRef = doc(db, "system_settings", "gomboAdsConfig");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as GomboAdsConfig;
      }
      await setDoc(docRef, { ...DEFAULT_CONFIG, updatedAt: new Date().toISOString() });
      return DEFAULT_CONFIG;
    } catch (err) {
      console.error("GomboAdsService.getConfig error:", err);
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Update global configs (Super Founder exclusive)
   */
  static async updateConfig(config: Partial<GomboAdsConfig>, adminId: string): Promise<boolean> {
    try {
      const docRef = doc(db, "system_settings", "gomboAdsConfig");
      const snap = await getDoc(docRef);
      const oldVal = snap.exists() ? snap.data() : DEFAULT_CONFIG;

      const updated = { ...oldVal, ...config, updatedAt: new Date().toISOString() };
      await setDoc(docRef, updated, { merge: true });

      // Identify individual toggles for audit logging
      if (config.enabled !== undefined && config.enabled !== oldVal.enabled) {
        await this.logAdminAction({
          adminId,
          action: config.enabled ? "Gombo Ads activé" : "Gombo Ads désactivé",
          oldValue: String(oldVal.enabled),
          newValue: String(config.enabled)
        });
      }
      if (config.allowNewCampaigns !== undefined && config.allowNewCampaigns !== oldVal.allowNewCampaigns) {
        await this.logAdminAction({
          adminId,
          action: "allowNewCampaigns_modified",
          oldValue: String(oldVal.allowNewCampaigns),
          newValue: String(config.allowNewCampaigns)
        });
      }
      if (config.allowActiveDelivery !== undefined && config.allowActiveDelivery !== oldVal.allowActiveDelivery) {
        await this.logAdminAction({
          adminId,
          action: "allowActiveDelivery_modified",
          oldValue: String(oldVal.allowActiveDelivery),
          newValue: String(config.allowActiveDelivery)
        });
      }
      if (config.placementsConfig !== undefined) {
        await this.logAdminAction({
          adminId,
          action: "placements_modified",
          oldValue: JSON.stringify(oldVal.placementsConfig || {}),
          newValue: JSON.stringify(config.placementsConfig)
        });
      }

      return true;
    } catch (err) {
      console.error("GomboAdsService.updateConfig error:", err);
      return false;
    }
  }

  /**
   * Create an ad campaign with atomic Gawa verification, idempotence locking, and actual Gawa debit.
   */
  static async createCampaign(
    userProfile: any,
    payload: {
      offerId: string;
      targetId: string;
      title: string;
      description: string;
      mediaUrl?: string;
      locationName?: string;
      commune?: string;
      category?: string;
      placements?: GomboAdsPlacement[];
    }
  ): Promise<{ success: boolean; campaignId?: string; error?: string }> {
    const userId = userProfile?.uid || userProfile?.id;
    if (!userId) {
      return { success: false, error: "Utilisateur non authentifié." };
    }

    // Load configs first to verify if purchasing is enabled
    const globalConfig = await this.getConfig();
    if (!globalConfig.enabled || !globalConfig.allowNewCampaigns) {
      return { success: false, error: "Gombo Ads temporairement indisponible pour de nouveaux achats." };
    }

    // 1. Load offers and find selected
    const offers = await this.getOffers();
    const offer = offers.find(o => o.id === payload.offerId);
    if (!offer || !offer.enabled) {
      return { success: false, error: "Offre promotionnelle sélectionnée non valide ou inactive." };
    }

    const priceGawa = offer.priceGawa;
    const durationDays = offer.durationDays;

    // Protection against duplicate processing clicks (Idempotence Lock)
    const idempotencyKey = `${userId}_${payload.targetId}_${offer.id}`;
    if (processingPayments.has(idempotencyKey)) {
      return { success: false, error: "Paiement en cours... Veuillez patienter." };
    }
    processingPayments.add(idempotencyKey);

    try {
      const userDocRef = doc(db, "users", userId);
      const campaignId = `ads_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Atomic debit check & runTransaction to ensure financial safety
      const result = await runTransaction(db, async (tx) => {
        const freshUserSnap = await tx.get(userDocRef);
        if (!freshUserSnap.exists()) {
          throw new Error("Compte utilisateur introuvable.");
        }
        const freshData = freshUserSnap.data();
        
        // Single canonical source of truth for Gawa balance
        const currentGawa = typeof freshData.gawaBalance === "number"
          ? freshData.gawaBalance
          : (typeof freshData.wallet?.soldeGawa === "number" ? freshData.wallet.soldeGawa : 0);

        if (currentGawa < priceGawa) {
          throw new Error("Solde insuffisant pour finaliser le paiement.");
        }

        const newGawaBalance = currentGawa - priceGawa;

        // Perform atomic debit on Gawa balance fields
        tx.update(userDocRef, {
          gawaBalance: newGawaBalance,
          "wallet.soldeGawa": newGawaBalance,
          updatedAt: new Date().toISOString()
        });

        // Record in Gawa history
        const txGawaRef = doc(db, "gawaHistory", campaignId);
        const gawaRecord = {
          id: campaignId,
          userId,
          uid: userId,
          amount: -priceGawa, // debit is negative
          gawaAmount: -priceGawa,
          priceFCFA: 0,
          type: "gombo_ads_payment",
          description: `Promotion Gombo Ads : "${payload.title}" (${offer.name} - ${durationDays} jours)`,
          createdAt: new Date().toISOString(),
          date: new Date().toLocaleDateString("fr-FR"),
          heure: new Date().toLocaleTimeString("fr-FR"),
          source: "GOMBO_ADS",
          transactionId: campaignId
        };
        tx.set(txGawaRef, gawaRecord);

        // Record in walletTransactions to appear in central financial logs
        const txFCFARef = doc(db, "walletTransactions", campaignId);
        const walletRecord = {
          id: campaignId,
          reference: campaignId,
          userId,
          uid: userId,
          userName: userProfile.artisticName || userProfile.displayName || userProfile.name || "Membre Gombo",
          amount: -priceGawa,
          montant: -priceGawa,
          type: "gombo_ads_payment",
          module: "gombo_ads",
          reason: `Paiement Gombo Ads - ${offer.name} (${durationDays}j)`,
          description: `Paiement Campagne Gombo Ads (${payload.title}) - ${durationDays} jour(s)`,
          balanceBefore: currentGawa,
          balanceAfter: newGawaBalance,
          status: "success",
          statut: "success",
          createdAt: new Date().toISOString(),
          date: new Date().toLocaleDateString("fr-FR"),
          heure: new Date().toLocaleTimeString("fr-FR"),
          timestamp: Date.now()
        };
        tx.set(txFCFARef, walletRecord);

        // Build campaign doc
        const now = new Date();
        const isAdminOrFounder = Boolean(userProfile.isFounder || userProfile.isSuperFounder || userProfile.role === "admin");
        
        // Campaigns require approval unless created by an Admin/Founder
        const status: GomboAdsStatus = isAdminOrFounder ? "ACTIVE" : "PENDING_REVIEW";
        const startAt = isAdminOrFounder ? now.toISOString() : undefined;
        const endAt = isAdminOrFounder
          ? new Date(now.getTime() + durationDays * 86400000).toISOString()
          : undefined;

        const campaignDocRef = doc(db, "gomboAdsCampaigns", campaignId);
        const newCampaign: GomboAdsCampaign = {
          id: campaignId,
          ownerId: userId,
          ownerName: userProfile.artisticName || userProfile.displayName || userProfile.name || "Membre Gombo",
          ownerAvatar: userProfile.photoURL || userProfile.avatarUrl || "",
          ownerPhone: userProfile.phone || userProfile.waveNumber || "",
          type: "gombo",
          targetId: payload.targetId,
          title: payload.title.substring(0, 100),
          description: payload.description.substring(0, 300),
          mediaUrl: payload.mediaUrl || "",
          locationName: payload.locationName || "Abidjan, Côte d'Ivoire",
          commune: payload.commune || userProfile.commune || "Cocody",
          category: payload.category || "Gombo",
          status,
          budget: Math.round(priceGawa / durationDays), // daily Gawa budget
          totalCost: priceGawa,
          currency: "GAWA",
          durationDays,
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
          uniqueViews: 0,
          engagements: 0,
          gomboViews: 0,
          profileViews: 0,
          initialBudget: priceGawa,
          spentBudget: 0,
          remainingBudget: priceGawa,
          offerId: offer.id,
          placements: payload.placements || offer.placements,
          frequencyCap: 3
        };

        tx.set(campaignDocRef, newCampaign);

        // Generate non-blocking notifications
        // Notification will be sent after transaction
        const notifId = `notif_${campaignId}`;
        tx.set(doc(db, "notifications", notifId), {
          id: notifId,
          userId,
          title: "📢 Campagne Gombo Ads créée !",
          message: isAdminOrFounder
            ? `Votre campagne "${payload.title}" est maintenant active pour ${durationDays} jour(s).`
            : `Votre campagne "${payload.title}" a été payée et est maintenant en attente de révision.`,
          type: "gombo_ads",
          priority: "HIGH",
          targetRoute: "/ads",
          eventId: `ads_created_${campaignId}`,
          isRead: false,
          read: false,
          createdAt: now.toISOString()
        });

        return campaignId;
      });

      return { success: true, campaignId: result };
    } catch (err: any) {
      console.error("GomboAdsService.createCampaign failed:", err);
      return { success: false, error: err.message || "Erreur lors du traitement du paiement." };
    } finally {
      processingPayments.delete(idempotencyKey);
    }
  }

  /**
   * Admin: Approve a campaign and transition it to ACTIVE
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

      await this.logAdminAction({
        adminId,
        action: "campagne_approuvee",
        campaignId,
        oldValue: campaign.status,
        newValue: "ACTIVE"
      });

      // Send approval notification
      const appNotifId = `notif_app_${campaignId}_${Date.now()}`;
      await setDoc(doc(db, "notifications", appNotifId), {
        id: appNotifId,
        userId: campaign.ownerId,
        title: "✅ Campagne Gombo Ads Approuvée !",
        message: `Votre campagne "${campaign.title}" est maintenant active sur AFRIGOMBO jusqu'au ${new Date(endAt).toLocaleDateString("fr-FR")}.`,
        type: "gombo_ads_approved",
        priority: "HIGH",
        targetRoute: "/ads",
        eventId: `ads_approved_${campaignId}`,
        isRead: false,
        read: false,
        createdAt: now.toISOString()
      });

      return true;
    } catch (e) {
      console.error("GomboAdsService.approveCampaign error:", e);
      return false;
    }
  }

  /**
   * Admin: Reject a campaign, write audit log, and return exact Gawa refund
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

      await runTransaction(db, async (tx) => {
        // Double check campaign status to avoid multiple refunds
        const freshCampSnap = await tx.get(campRef);
        const freshCamp = freshCampSnap.data() as GomboAdsCampaign;
        if (freshCamp.status === "REJECTED") {
          throw new Error("Campagne déjà rejetée.");
        }

        // Refund user
        const userDocRef = doc(db, "users", campaign.ownerId);
        const userSnap = await tx.get(userDocRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentGawa = typeof userData.gawaBalance === "number"
            ? userData.gawaBalance
            : (typeof userData.wallet?.soldeGawa === "number" ? userData.wallet.soldeGawa : 0);

          const refundGawa = campaign.totalCost;
          const newGawaBalance = currentGawa + refundGawa;

          tx.update(userDocRef, {
            gawaBalance: newGawaBalance,
            "wallet.soldeGawa": newGawaBalance,
            updatedAt: now.toISOString()
          });

          // Record refund in gawaHistory
          const refundTxId = `refund_${campaignId}_${Date.now()}`;
          const gawaHistoryRef = doc(db, "gawaHistory", refundTxId);
          tx.set(gawaHistoryRef, {
            id: refundTxId,
            userId: campaign.ownerId,
            uid: campaign.ownerId,
            amount: refundGawa, // credit is positive
            gawaAmount: refundGawa,
            priceFCFA: 0,
            type: "gombo_ads_refund",
            description: `Remboursement Campagne Refusée (${campaign.title})`,
            createdAt: now.toISOString(),
            date: now.toLocaleDateString("fr-FR"),
            heure: now.toLocaleTimeString("fr-FR"),
            source: "GOMBO_ADS_REFUND",
            transactionId: refundTxId
          });

          // Record refund in walletTransactions
          const walletTxRef = doc(db, "walletTransactions", refundTxId);
          tx.set(walletTxRef, {
            id: refundTxId,
            reference: refundTxId,
            userId: campaign.ownerId,
            uid: campaign.ownerId,
            userName: campaign.ownerName || "Membre Gombo",
            amount: refundGawa,
            montant: refundGawa,
            type: "gombo_ads_refund",
            module: "gombo_ads",
            reason: `Remboursement Gombo Ads`,
            description: `Remboursement Campagne Refusée (${campaign.title})`,
            balanceBefore: currentGawa,
            balanceAfter: newGawaBalance,
            status: "success",
            statut: "success",
            createdAt: now.toISOString(),
            date: now.toLocaleDateString("fr-FR"),
            heure: now.toLocaleTimeString("fr-FR"),
            timestamp: Date.now()
          });
        }

        tx.update(campRef, {
          status: "REJECTED",
          rejectedAt: now.toISOString(),
          rejectedBy: adminId,
          rejectionReason: reason || "Campagne non conforme aux règles de la plateforme.",
          updatedAt: now.toISOString()
        });
      });

      // Log admin action
      await this.logAdminAction({
        adminId,
        action: "campagne_refusee",
        campaignId,
        oldValue: campaign.status,
        newValue: "REJECTED"
      });

      // Send rejection notification
      const rejNotifId = `notif_rej_${campaignId}_${Date.now()}`;
      await setDoc(doc(db, "notifications", rejNotifId), {
        id: rejNotifId,
        userId: campaign.ownerId,
        title: "❌ Campagne Gombo Ads Refusée",
        message: `Votre campagne "${campaign.title}" a été refusée pour la raison suivante : "${reason}". Un remboursement de ${campaign.totalCost.toLocaleString("fr-FR")} Gawa a été crédité sur votre compte.`,
        type: "gombo_ads_rejected",
        priority: "HIGH",
        targetRoute: "/ads",
        eventId: `ads_rejected_${campaignId}`,
        isRead: false,
        read: false,
        createdAt: now.toISOString()
      });

      return true;
    } catch (e) {
      console.error("GomboAdsService.rejectCampaign error:", e);
      return false;
    }
  }

  /**
   * Super Founder: Manually triggers refund of active or completed campaigns (refund/annulation)
   */
  static async refundCampaign(campaignId: string, adminId: string, reason: string): Promise<boolean> {
    try {
      const campRef = doc(db, "gomboAdsCampaigns", campaignId);
      const campSnap = await getDoc(campRef);
      if (!campSnap.exists()) return false;

      const campaign = campSnap.data() as GomboAdsCampaign;
      if (campaign.status === "REJECTED" || campaign.status === "ARCHIVED") {
        return false;
      }

      await runTransaction(db, async (tx) => {
        const userDocRef = doc(db, "users", campaign.ownerId);
        const userSnap = await tx.get(userDocRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentGawa = typeof userData.gawaBalance === "number"
            ? userData.gawaBalance
            : (typeof userData.wallet?.soldeGawa === "number" ? userData.wallet.soldeGawa : 0);

          const refundAmount = campaign.remainingBudget; // refund remaining budget
          const newGawaBalance = currentGawa + refundAmount;

          tx.update(userDocRef, {
            gawaBalance: newGawaBalance,
            "wallet.soldeGawa": newGawaBalance,
            updatedAt: new Date().toISOString()
          });

          const refundTxId = `refund_man_${campaignId}_${Date.now()}`;
          const gawaHistoryRef = doc(db, "gawaHistory", refundTxId);
          tx.set(gawaHistoryRef, {
            id: refundTxId,
            userId: campaign.ownerId,
            uid: campaign.ownerId,
            amount: refundAmount,
            gawaAmount: refundAmount,
            priceFCFA: 0,
            type: "gombo_ads_refund_manual",
            description: `Remboursement Administratif : "${campaign.title}"`,
            createdAt: new Date().toISOString(),
            date: new Date().toLocaleDateString("fr-FR"),
            heure: new Date().toLocaleTimeString("fr-FR"),
            source: "GOMBO_ADS_REFUND_MANUAL",
            transactionId: refundTxId
          });

          const walletTxRef = doc(db, "walletTransactions", refundTxId);
          tx.set(walletTxRef, {
            id: refundTxId,
            reference: refundTxId,
            userId: campaign.ownerId,
            uid: campaign.ownerId,
            userName: campaign.ownerName || "Membre Gombo",
            amount: refundAmount,
            montant: refundAmount,
            type: "gombo_ads_refund_manual",
            module: "gombo_ads",
            reason: `Remboursement Manuel Gombo Ads`,
            description: `Remboursement Manuel (${campaign.title}) - Raison: ${reason}`,
            balanceBefore: currentGawa,
            balanceAfter: newGawaBalance,
            status: "success",
            statut: "success",
            createdAt: new Date().toISOString(),
            date: new Date().toLocaleDateString("fr-FR"),
            heure: new Date().toLocaleTimeString("fr-FR"),
            timestamp: Date.now()
          });
        }

        tx.update(campRef, {
          status: "ARCHIVED",
          remainingBudget: 0,
          updatedAt: new Date().toISOString()
        });
      });

      await this.logAdminAction({
        adminId,
        action: "remboursement_effectue",
        campaignId,
        oldValue: campaign.status,
        newValue: "ARCHIVED_REFUNDED"
      });

      return true;
    } catch (err) {
      console.error("GomboAdsService.refundCampaign error:", err);
      return false;
    }
  }

  /**
   * Pause campaign
   */
  static async pauseCampaign(campaignId: string, adminId?: string): Promise<boolean> {
    try {
      const campRef = doc(db, "gomboAdsCampaigns", campaignId);
      const campSnap = await getDoc(campRef);
      if (!campSnap.exists()) return false;
      const campaign = campSnap.data() as GomboAdsCampaign;

      await updateDoc(campRef, {
        status: "PAUSED",
        updatedAt: new Date().toISOString()
      });

      if (adminId) {
        await this.logAdminAction({
          adminId,
          action: "campagne_suspendue",
          campaignId,
          oldValue: campaign.status,
          newValue: "PAUSED"
        });
      }

      return true;
    } catch (e) {
      console.error("GomboAdsService.pauseCampaign error:", e);
      return false;
    }
  }

  /**
   * Resume paused campaign
   */
  static async resumeCampaign(campaignId: string, adminId?: string): Promise<boolean> {
    try {
      const campRef = doc(db, "gomboAdsCampaigns", campaignId);
      const campSnap = await getDoc(campRef);
      if (!campSnap.exists()) return false;
      const campaign = campSnap.data() as GomboAdsCampaign;

      await updateDoc(campRef, {
        status: "ACTIVE",
        updatedAt: new Date().toISOString()
      });

      if (adminId) {
        await this.logAdminAction({
          adminId,
          action: "campagne_reprise",
          campaignId,
          oldValue: campaign.status,
          newValue: "ACTIVE"
        });
      }

      return true;
    } catch (e) {
      console.error("GomboAdsService.resumeCampaign error:", e);
      return false;
    }
  }

  /**
   * Archive campaign
   */
  static async archiveCampaign(campaignId: string, adminId?: string): Promise<boolean> {
    try {
      const campRef = doc(db, "gomboAdsCampaigns", campaignId);
      const campSnap = await getDoc(campRef);
      if (!campSnap.exists()) return false;
      const campaign = campSnap.data() as GomboAdsCampaign;

      await updateDoc(campRef, {
        status: "ARCHIVED",
        updatedAt: new Date().toISOString()
      });

      if (adminId) {
        await this.logAdminAction({
          adminId,
          action: "campagne_archivee",
          campaignId,
          oldValue: campaign.status,
          newValue: "ARCHIVED"
        });
      }

      return true;
    } catch (e) {
      console.error("GomboAdsService.archiveCampaign error:", e);
      return false;
    }
  }

  /**
   * Secure recording of impressions/clicks/views/engagements with budget depletion logic
   */
  static async recordAdEvent(
    campaignId: string,
    eventType: "impression" | "click" | "view" | "engagement" | "gomboView" | "profileView"
  ): Promise<void> {
    if (!campaignId) return;

    try {
      const campRef = doc(db, "gomboAdsCampaigns", campaignId);

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(campRef);
        if (!snap.exists()) return;

        const campaign = snap.data() as GomboAdsCampaign;
        if (campaign.status !== "ACTIVE") return;

        // Auto-expire check before counting event
        if (campaign.endAt && new Date(campaign.endAt) < new Date()) {
          tx.update(campRef, {
            status: "EXPIRED",
            updatedAt: new Date().toISOString()
          });
          return;
        }

        // Define event Gawa prices
        let eventCost = 0.05; // default Gawa cost per impression
        if (eventType === "click") eventCost = 0.25;
        if (eventType === "view") eventCost = 0.10;
        if (eventType === "engagement") eventCost = 0.15;
        if (eventType === "gomboView") eventCost = 0.20;
        if (eventType === "profileView") eventCost = 0.20;

        const currentSpent = campaign.spentBudget || 0;
        const remaining = campaign.remainingBudget ?? campaign.totalCost;

        if (remaining <= 0) {
          tx.update(campRef, {
            status: "COMPLETED",
            updatedAt: new Date().toISOString()
          });
          return;
        }

        // Secure budget consumption
        const actualCost = Math.min(eventCost, remaining);
        const newSpent = currentSpent + actualCost;
        const newRemaining = Math.max(0, remaining - actualCost);

        const updates: any = {
          spentBudget: parseFloat(newSpent.toFixed(4)),
          remainingBudget: parseFloat(newRemaining.toFixed(4)),
          updatedAt: new Date().toISOString()
        };

        // Increment event counter
        if (eventType === "impression") {
          updates.impressions = increment(1);
        } else if (eventType === "click") {
          updates.clicks = increment(1);
        } else if (eventType === "view") {
          updates.views = increment(1);
          updates.uniqueViews = increment(1);
        } else if (eventType === "engagement") {
          updates.engagements = increment(1);
        } else if (eventType === "gomboView") {
          updates.gomboViews = increment(1);
        } else if (eventType === "profileView") {
          updates.profileViews = increment(1);
        }

        // Transition status if budget is empty
        if (newRemaining <= 0) {
          updates.status = "COMPLETED";
        }

        tx.update(campRef, updates);
      });
    } catch (e) {
      console.error("GomboAdsService.recordAdEvent error:", e);
    }
  }

  /**
   * Save sensitivity audit log for Super Founders
   */
  static async logAdminAction(log: {
    adminId: string;
    action: string;
    campaignId?: string;
    oldValue: string;
    newValue: string;
  }): Promise<void> {
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await setDoc(doc(db, "adminGomboAdsLogs", logId), {
        id: logId,
        adminId: log.adminId,
        action: log.action,
        campaignId: log.campaignId || "",
        oldValue: log.oldValue,
        newValue: log.newValue,
        date: new Date().toISOString()
      });
    } catch (err) {
      console.error("GomboAdsService.logAdminAction error:", err);
    }
  }

  /**
   * Listen to user campaigns
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
        console.warn("User campaigns listener error:", err);
        callback([]);
      }
    );
  }

  /**
   * Listen to all campaigns (Admin view)
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
   * Fetch active ads for placements under strict checks (budget remaining > 0, configs on)
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
      async (snap) => {
        const list: GomboAdsCampaign[] = [];
        const now = new Date();

        // Retrieve global configurations
        const config = await this.getConfig();
        if (!config.enabled || !config.allowActiveDelivery) {
          callback([]);
          return;
        }

        // Placement must be active in global settings
        const isPlacementEnabled = config.placementsConfig?.[placement] ?? true;
        if (!isPlacementEnabled) {
          callback([]);
          return;
        }

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

          // Check budget
          if (item.remainingBudget !== undefined && item.remainingBudget <= 0) {
            updateDoc(doc(db, "gomboAdsCampaigns", item.id), {
              status: "COMPLETED",
              updatedAt: now.toISOString()
            }).catch(() => {});
            return;
          }

          // Filter placement
          if (item.placements && item.placements.includes(placement)) {
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

