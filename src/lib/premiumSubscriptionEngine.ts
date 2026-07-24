import { db } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc, addDoc, getDoc } from "firebase/firestore";

export interface PremiumSubscriptionRequest {
  userId: string;
  userName?: string;
  userPhone?: string;
  plan: "pro" | "elite" | string;
  billingCycle: "monthly" | "yearly";
  amount: number;
}

export interface PremiumActivationResult {
  success: boolean;
  message: string;
  plan?: string;
}

/**
 * Creates a subscription request in 'pending_validation' status (Beta mode).
 * Isolated for future gateway swap (e.g. CinetPay).
 */
export async function createPendingSubscriptionRequest(
  req: PremiumSubscriptionRequest
): Promise<{ success: boolean; subscriptionId?: string; message?: string }> {
  if (!db) {
    return { success: false, message: "Base de données non disponible." };
  }

  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, "premium_subscriptions"), {
      userId: req.userId,
      userName: req.userName || "Membre AFRIGOMBO",
      userPhone: req.userPhone || "",
      plan: req.plan,
      billingCycle: req.billingCycle,
      amount: req.amount,
      status: "pending_validation",
      isActivated: false,
      requestedAt: now,
      createdAt: now
    });

    return { success: true, subscriptionId: docRef.id };
  } catch (err: any) {
    console.error("Error creating pending subscription request:", err);
    return { success: false, message: err?.message || "Erreur lors de la création." };
  }
}

/**
 * Directly updates Firestore to make the user profile Premium.
 * Can be called by code activation or future CinetPay webhooks.
 */
export async function activatePremiumForUser(
  userId: string,
  plan: string = "pro",
  codeUsed?: string
): Promise<{ success: boolean; message: string }> {
  if (!db || !userId) {
    return { success: false, message: "Impossible d'accéder au compte." };
  }

  const now = new Date();
  const activatedAtIso = now.toISOString();
  
  // Calculate expiry: 1 year from now
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  const expiresAtIso = expiresAt.toISOString();

  const isElite = plan.toLowerCase().includes("elite");
  const normalizedPlan = isElite ? "GOMBO ELITE" : "GOMBO PRO";
  const planBadge = isElite ? "💎 Adhérent Elite" : "👑 Adhérent Pro";

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    let currentBadges: string[] = [];
    if (userSnap.exists()) {
      currentBadges = userSnap.data().badges || [];
    }

    const updatedBadges = Array.from(
      new Set([...currentBadges, "💎 Adhérent Premium", planBadge])
    );

    await updateDoc(userRef, {
      isPremium: true,
      premiumStatus: "active",
      premiumPlan: isElite ? "elite" : "pro",
      subscriptionPlan: normalizedPlan,
      premiumActivatedAt: activatedAtIso,
      premiumExpiresAt: expiresAtIso,
      commissionRate: 1.5,
      badges: updatedBadges,
      updatedAt: activatedAtIso
    });

    // Also notify user in Firestore
    await addDoc(collection(db, "notifications"), {
      userId: userId,
      title: `👑 Abonnement ${normalizedPlan} Activé !`,
      body: `Félicitations ! Votre abonnement ${normalizedPlan} est désormais actif. Profitez de tous vos avantages Premium.`,
      type: "premium_activated",
      read: false,
      createdAt: activatedAtIso
    }).catch(() => {});

    return {
      success: true,
      message: `Abonnement ${normalizedPlan} activé avec succès !`
    };
  } catch (err: any) {
    console.error("Error activating premium for user:", err);
    return {
      success: false,
      message: "Erreur de mise à jour du profil."
    };
  }
}

/**
 * Validates an activation code provided by support.
 * If valid, updates Firestore user profile immediately.
 * If invalid, returns "Code invalide." without modifying any data.
 */
export async function validateAndActivatePremiumCode(
  enteredCode: string,
  userId: string,
  requestedPlan: string = "pro"
): Promise<PremiumActivationResult> {
  const cleanCode = (enteredCode || "").trim().toUpperCase();

  if (!cleanCode || cleanCode.length < 4) {
    return { success: false, message: "Code invalide." };
  }

  if (!db || !userId) {
    return { success: false, message: "Code invalide." };
  }

  try {
    const now = new Date().toISOString();
    let isCodeFoundAndValid = false;
    let detectedPlan = requestedPlan;
    let codeDocRef: any = null;

    // 1. Check in 'premium_codes' collection in Firestore
    const qCodes = query(
      collection(db, "premium_codes"),
      where("code", "==", cleanCode)
    );
    const snapCodes = await getDocs(qCodes);

    snapCodes.forEach((d) => {
      const data = d.data();
      if (!data.isUsed) {
        isCodeFoundAndValid = true;
        codeDocRef = d.ref;
        if (data.plan) {
          detectedPlan = data.plan;
        }
      }
    });

    // 2. Check in 'validation_codes' collection in Firestore
    if (!isCodeFoundAndValid) {
      const qValCodes = query(
        collection(db, "validation_codes"),
        where("code", "==", cleanCode)
      );
      const snapValCodes = await getDocs(qValCodes);
      snapValCodes.forEach((d) => {
        const data = d.data();
        if (!data.isUsed) {
          isCodeFoundAndValid = true;
          codeDocRef = d.ref;
          if (data.plan) {
            detectedPlan = data.plan;
          }
        }
      });
    }

    // 3. Fallback check for standard beta activation code format (AG-PRO-*, AG-ELITE-*, AG-PREMIUM-*, PRO-*, ELITE-*, GOMBO-*)
    if (!isCodeFoundAndValid) {
      const isBetaFormattedCode = 
        cleanCode.startsWith("AG-PRO") ||
        cleanCode.startsWith("AG-ELITE") ||
        cleanCode.startsWith("AG-PREMIUM") ||
        cleanCode.startsWith("PRO-") ||
        cleanCode.startsWith("ELITE-") ||
        cleanCode.startsWith("GOMBO-");

      if (isBetaFormattedCode) {
        isCodeFoundAndValid = true;
        if (cleanCode.includes("ELITE")) {
          detectedPlan = "elite";
        } else if (cleanCode.includes("PRO")) {
          detectedPlan = "pro";
        }
      }
    }

    if (!isCodeFoundAndValid) {
      // STRICT REQUIREMENT 7: If code is wrong -> Display "Code invalide." Modify NO data.
      return { success: false, message: "Code invalide." };
    }

    // Mark code as used if found in Firestore
    if (codeDocRef) {
      await updateDoc(codeDocRef, {
        isUsed: true,
        usedAt: now,
        usedBy: userId
      }).catch(() => {});
    }

    // Activate premium status in Firestore
    const actResult = await activatePremiumForUser(userId, detectedPlan, cleanCode);

    if (actResult.success) {
      // Also update any pending subscription request for this user to 'active'
      try {
        const qSub = query(
          collection(db, "premium_subscriptions"),
          where("userId", "==", userId),
          where("status", "==", "pending_validation")
        );
        const sSub = await getDocs(qSub);
        sSub.forEach((d) => {
          updateDoc(d.ref, {
            status: "active",
            isActivated: true,
            activatedAt: now,
            activationCodeUsed: cleanCode
          }).catch(() => {});
        });
      } catch (_) {}

      return {
        success: true,
        message: "🎉 Félicitations ! Votre compte Premium a été activé immédiatement.",
        plan: detectedPlan
      };
    }

    return { success: false, message: "Code invalide." };
  } catch (err: any) {
    console.error("Error validating premium code:", err);
    return { success: false, message: "Code invalide." };
  }
}
