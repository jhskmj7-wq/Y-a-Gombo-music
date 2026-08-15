import { NotificationService } from "../lib/NotificationService";
import { recordWalletTransaction } from "./financial";
import { db } from "./firebase";
import { doc, updateDoc, getDoc, collection, addDoc } from "firebase/firestore";

export interface UserPremiumProfile {
  premium?: boolean;
  premiumUntil?: string;
  subscriptionType?: "monthly" | "yearly" | "elite" | "pro" | string;
  status?: string;
  isPremium?: boolean;
  premiumExpiresAt?: string;
  premiumPlan?: string;
  isPremiumAutoRenew?: boolean;
  wallet?: {
    soldeDisponible?: number;
    soldeBloque?: number;
  };
  walletBalance?: number;
  badges?: string[];
  displayName?: string;
  firstName?: string;
  lastName?: string;
  artistName?: string;
}

export const PremiumEngine = {
  /**
   * Evaluates if a user is currently a Premium subscriber.
   * Reads fields: premium, premiumUntil, subscriptionType, status.
   * Also supports fallback fields for backwards compatibility.
   */
  isPremium(userData: any): boolean {
    if (!userData) return false;

    // Check modern fields, fallback fields, badges, subscriptionPlan, isVip, isPro, isFounder, role, niveauWallet
    const hasPremiumField = userData.premium === true || userData.isPremium === true;
    const hasStatusActive = userData.premiumStatus === "active" || userData.status === "premium" || userData.wallet?.niveauWallet === "PREMIUM" || userData.wallet?.niveauWallet === "ELITE" || userData.wallet?.niveauWallet === "PRO" || userData.wallet?.niveauWallet === "VIP";
    const hasVipOrPro = userData.isVip === true || userData.isPro === true || userData.isFounder === true || userData.role === "admin";
    const hasSubscription = !!(userData.subscriptionPlan || userData.subscriptionType || userData.premiumPlan);
    const hasBadge = Array.isArray(userData.badges) && userData.badges.some((b: string) => {
      const lb = (b || "").toLowerCase();
      return lb.includes("premium") || lb.includes("elite") || lb.includes("pro") || lb.includes("vip");
    });

    const isExplicitlyPremium = hasPremiumField || hasStatusActive || hasVipOrPro || hasSubscription || hasBadge;

    if (!isExplicitlyPremium) {
      return false;
    }

    // Check expiration date if present
    const until = userData.premiumUntil || userData.premiumExpiresAt;
    if (until) {
      const expiryDate = new Date(until);
      if (!isNaN(expiryDate.getTime()) && expiryDate <= new Date()) {
        if (!userData.isFounder && userData.role !== "admin") {
          return false; // Expired
        }
      }
    }

    return true;
  },

  /**
   * Calculates the commission rate dynamically from global pricing configuration.
   */
  getCommissionRate(userData: any): number {
    const { getPlatformPricing } = require("./financial");
    const pricing = getPlatformPricing();
    return this.isPremium(userData) ? pricing.premiumCommissionRate : pricing.standardCommissionRate;
  },

  /**
   * Synchronizes and updates the user's premium status.
   * Checks:
   * - If the user is marked premium but their subscription has expired.
   * - Processes auto-renewal using wallet funds if enabled, or expires the account otherwise.
   * - Ensures fields (premium, premiumUntil, status, etc.) are in sync.
   */
  async syncPremiumStatus(userId: string, currentProfile?: any): Promise<any> {
    if (!db || !userId) return currentProfile;

    try {
      const userRef = doc(db, "users", userId);
      let userData = currentProfile;
      if (!userData) {
        const snap = await getDoc(userRef);
        if (!snap.exists()) return null;
        userData = snap.data();
      }

      const now = new Date();
      const isPrem = userData.premium === true || userData.isPremium === true || userData.status === "premium";
      const until = userData.premiumUntil || userData.premiumExpiresAt;

      if (isPrem && until) {
        const expiryDate = new Date(until);
        if (!isNaN(expiryDate.getTime()) && expiryDate <= now) {
          // EXPIRED! Process automatic renewal or deactivate.
          const isAutoRenewEnabled = userData.isPremiumAutoRenew !== false;
          const billingCycle = userData.billingCycle || userData.subscriptionType || "monthly";
          const planId = userData.premiumPlan || (userData.subscriptionPlan?.toLowerCase().includes("elite") ? "elite" : "pro");
          
          // Cost calculation: Elite vs Pro
          const isElite = planId === "elite" || userData.subscriptionPlan?.toLowerCase().includes("elite");
          const planName = isElite ? "GOMBO ELITE" : "GOMBO PRO";
          
          // Simple prices: Yearly = 5000 FCFA, Monthly = 500 FCFA (or Elite Monthly = 1000 FCFA)
          let renewalAmount = 500;
          if (billingCycle === "yearly") {
            renewalAmount = 5000;
          } else if (isElite) {
            renewalAmount = 1000;
          }

          const liveSolde = userData.wallet?.soldeDisponible ?? userData.walletBalance ?? 0;

          if (isAutoRenewEnabled && liveSolde >= renewalAmount) {
            // RENEW SUBSCRIPTION
            const nextExpiry = new Date();
            if (billingCycle === "yearly") {
              nextExpiry.setFullYear(nextExpiry.getFullYear() + 1);
            } else {
              nextExpiry.setDate(nextExpiry.getDate() + 30);
            }
            const nextExpiryIso = nextExpiry.toISOString();
            const newSolde = liveSolde - renewalAmount;

            const updatedFields = {
              premium: true,
              isPremium: true,
              status: "premium",
              premiumStatus: "active",
              premiumUntil: nextExpiryIso,
              premiumExpiresAt: nextExpiryIso,
              walletBalance: newSolde,
              wallet: {
                ...(userData.wallet || {}),
                soldeDisponible: newSolde
              },
              updatedAt: now.toISOString()
            };

            await updateDoc(userRef, updatedFields);

            // Record transaction
            
            await recordWalletTransaction({
              userId,
              userName: userData.displayName || userData.artistName || "Membre Gombo",
              type: "abonnement_premium",
              amount: renewalAmount,
              status: "success",
              description: `Renouvellement automatique Premium (${planName})`
            });

            // Send notification
            await NotificationService.sendNotification({
              userId,
              title: "🔄 Renouvellement Premium Réussi !",
              message: `Votre abonnement ${planName} a été renouvelé automatiquement pour une nouvelle période. ${renewalAmount.toLocaleString()} FCFA ont été débités de votre Wallet.`,
              type: "payment_received",
              createdAt: now.toISOString(),
              isRead: false
            });

            return { ...userData, ...updatedFields };
          } else {
            // EXPIRE PREMIUM!
            const currentBadges: string[] = userData.badges || [];
            const updatedBadges = currentBadges.filter(
              b => b !== "💎 Adhérent Premium" && b !== "💎 Adhérent Elite" && b !== "👑 Adhérent Pro"
            );

            const updatedFields = {
              premium: false,
              isPremium: false,
              status: "standard",
              premiumStatus: "expired",
              subscriptionPlan: "GOMBO FREE",
              premiumPlan: "free",
              badges: updatedBadges,
              updatedAt: now.toISOString()
            };

            await updateDoc(userRef, updatedFields);

            // Send notification
            const notificationMessage = isAutoRenewEnabled
              ? `Votre abonnement ${planName} a expiré car votre solde de Wallet (${liveSolde.toLocaleString()} FCFA) était insuffisant pour le renouvellement de ${renewalAmount.toLocaleString()} FCFA.`
              : `Votre abonnement ${planName} a expiré. Pour continuer à profiter des avantages Premium, réabonnez-vous dès maintenant.`;

            await NotificationService.sendNotification({
              userId,
              title: "⚠️ Abonnement Premium Expiré",
              message: notificationMessage,
              type: "warning",
              createdAt: now.toISOString(),
              isRead: false
            });

            return { ...userData, ...updatedFields };
          }
        }
      }

      // If active and fields are out of sync, reconcile them
      if (isPrem && (!until || new Date(until) > now)) {
        if (userData.status !== "premium" || userData.premium !== true) {
          const updatedFields = {
            premium: true,
            isPremium: true,
            status: "premium",
            updatedAt: now.toISOString()
          };
          await updateDoc(userRef, updatedFields);
          return { ...userData, ...updatedFields };
        }
      }

      return userData;
    } catch (e) {
      console.error("Error syncing premium status in PremiumEngine:", e);
      return currentProfile;
    }
  }
};
