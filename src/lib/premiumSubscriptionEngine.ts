import { NotificationService } from "../lib/NotificationService";
import { db } from "./firebase";
import { 
  collection, query, where, getDocs, updateDoc, doc, addDoc, getDoc, setDoc, orderBy, limit 
} from "firebase/firestore";
import { SubscriptionRequest, SubscriptionPaymentMethod, PremiumCodeItem } from "../types";

export interface PremiumSubscriptionRequest {
  userId: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  userAvatar?: string;
  userRole?: string;
  plan: "pro" | "elite" | string;
  planName?: string;
  billingCycle: "monthly" | "yearly";
  amount: number;
  paymentMethod?: SubscriptionPaymentMethod;
  paymentProofUrl?: string;
  paymentReference?: string;
  userNote?: string;
}

export interface PremiumActivationResult {
  success: boolean;
  message: string;
  plan?: string;
}

/**
 * Soumet une demande manuelle d'abonnement pour la Bêta.
 * Enregistre la demande dans la collection 'subscription_requests' (et 'premium_subscriptions').
 * Notifie réellement le Fondateur et l'utilisateur via NotificationService.
 */
export async function submitSubscriptionRequest(
  req: PremiumSubscriptionRequest
): Promise<{ success: boolean; requestId?: string; message?: string }> {
  if (!db) {
    return { success: false, message: "Base de données non disponible." };
  }

  if (!req.userId) {
    return { success: false, message: "Identifiant utilisateur requis." };
  }

  try {
    const now = new Date().toISOString();
    const isElite = req.plan.toLowerCase().includes("elite");
    const normalizedPlan = isElite ? "elite" : "pro";
    const planName = isElite ? "GOMBO ELITE" : "GOMBO PRO";
    const cycle = req.billingCycle || "monthly";
    const amount = req.amount || (isElite ? (cycle === "monthly" ? 1000 : 10000) : (cycle === "monthly" ? 500 : 5000));
    const method = req.paymentMethod || "MANUAL_BETA";

    const requestPayload: Omit<SubscriptionRequest, "id"> = {
      userId: req.userId,
      userName: req.userName || "Artiste AFRIGOMBO",
      userPhone: req.userPhone || "",
      userEmail: req.userEmail || "",
      userAvatar: req.userAvatar || "",
      userRole: req.userRole || "musicien",
      plan: normalizedPlan,
      planName: planName,
      billingCycle: cycle,
      amount: amount,
      paymentMethod: method,
      paymentProofUrl: req.paymentProofUrl || "",
      paymentReference: req.paymentReference || "",
      userNote: req.userNote || "",
      status: "pending",
      requestedAt: now
    };

    // 1. Enregistrement dans 'subscription_requests'
    const docRef = await addDoc(collection(db, "subscription_requests"), requestPayload);

    // 2. Enregistrement miroir dans 'premium_subscriptions' pour compatibilité
    await addDoc(collection(db, "premium_subscriptions"), {
      ...requestPayload,
      requestId: docRef.id,
      isActivated: false,
      createdAt: now
    }).catch(() => {});

    // 3. Notification en temps réel au Super Fondateur
    await NotificationService.sendNotification({
      userId: "SUPER_FOUNDER",
      title: `💎 Demande d'abonnement ${planName}`,
      message: `${req.userName || "Un utilisateur"} a envoyé une demande d'adhésion ${planName} (${amount.toLocaleString("fr-FR")} FCFA via ${method}). Vérification requise.`,
      type: "subscription_request_new",
      priority: "HIGH",
      targetRoute: "/Le-Throne-Of-The-Founder",
      relatedId: docRef.id,
      metadata: {
        requestId: docRef.id,
        targetUserId: req.userId,
        plan: normalizedPlan,
        amount
      }
    }).catch(() => {});

    // 4. Notification de confirmation à l'utilisateur
    await NotificationService.sendNotification({
      userId: req.userId,
      title: "📝 Demande d'abonnement enregistrée",
      message: `Votre demande pour ${planName} (${amount.toLocaleString("fr-FR")} FCFA) a bien été reçue. Elle sera vérifiée et activée manuellement par l'équipe AFRIGOMBO.`,
      type: "subscription_pending",
      priority: "NORMAL",
      targetRoute: "/abonnement",
      relatedId: docRef.id
    }).catch(() => {});

    return { success: true, requestId: docRef.id, message: "Demande enregistrée avec succès." };
  } catch (err: any) {
    console.error("Error submitting subscription request:", err);
    return { success: false, message: err?.message || "Erreur lors de l'enregistrement de la demande." };
  }
}

/**
 * Rétrocompatibilité : crée une demande en attente
 */
export async function createPendingSubscriptionRequest(
  req: PremiumSubscriptionRequest
): Promise<{ success: boolean; subscriptionId?: string; message?: string }> {
  return submitSubscriptionRequest(req).then(res => ({
    success: res.success,
    subscriptionId: res.requestId,
    message: res.message
  }));
}

/**
 * Validation et activation manuelle d'une demande par le Fondateur.
 * Met à jour le document 'users/{userId}' avec les dates exactes,
 * passe la demande en 'approved', et notifie le client.
 */
export async function approveSubscriptionRequest(
  requestId: string,
  adminUser: any
): Promise<{ success: boolean; message: string }> {
  if (!db || !requestId) {
    return { success: false, message: "Identifiant de demande manquant." };
  }

  try {
    const reqRef = doc(db, "subscription_requests", requestId);
    const reqSnap = await getDoc(reqRef);

    if (!reqSnap.exists()) {
      return { success: false, message: "Demande introuvable." };
    }

    const reqData = reqSnap.data() as SubscriptionRequest;
    if (reqData.status === "approved") {
      return { success: false, message: "Cette demande a déjà été validée." };
    }

    const userId = reqData.userId;
    const plan = reqData.plan || "pro";
    const isElite = plan.toLowerCase().includes("elite");
    const normalizedPlan = isElite ? "GOMBO ELITE" : "GOMBO PRO";
    const planBadge = isElite ? "💎 Adhérent Elite" : "👑 Adhérent Pro";
    const billingCycle = reqData.billingCycle || "monthly";

    const now = new Date();
    const nowIso = now.toISOString();

    // Calcul de la date d'expiration exacte : 30 jours pour mensuel, 365 jours pour annuel
    const expiresAt = new Date(now);
    if (billingCycle === "yearly") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30);
    }
    const expiresAtIso = expiresAt.toISOString();

    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    const expiresAtFormatted = expiresAt.toLocaleDateString("fr-FR", options);
    const startedAtFormatted = now.toLocaleDateString("fr-FR", options);

    // 1. Mise à jour du profil utilisateur dans Firestore
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    let currentBadges: string[] = [];
    let currentHistory: any[] = [];
    if (userSnap.exists()) {
      const u = userSnap.data();
      currentBadges = u.badges || [];
      currentHistory = u.subscriptionHistory || [];
    }

    const updatedBadges = Array.from(
      new Set([...currentBadges, "💎 Adhérent Premium", planBadge])
    );

    const newHistoryEntry = {
      requestId,
      plan: normalizedPlan,
      billingCycle,
      amount: reqData.amount,
      paymentMethod: reqData.paymentMethod || "MANUAL_BETA",
      activatedAt: nowIso,
      expiresAt: expiresAtIso,
      approvedBy: adminUser?.email || adminUser?.uid || "Fondateur AFRIGOMBO"
    };

    await updateDoc(userRef, {
      premium: true,
      isPremium: true,
      status: "premium",
      premiumStatus: "active",
      premiumPlan: isElite ? "elite" : "pro",
      subscriptionPlan: normalizedPlan,
      billingCycle: billingCycle,
      subscriptionBillingCycle: billingCycle,
      subscriptionStartDate: startedAtFormatted,
      subscriptionExpiryDate: expiresAtFormatted,
      subscriptionExpiresAt: expiresAtIso,
      premiumStartedAt: nowIso,
      premiumActivatedAt: nowIso,
      premiumUntil: expiresAtIso,
      premiumExpiresAt: expiresAtIso,
      isPremiumAutoRenew: false, // Manuel en Bêta
      badges: updatedBadges,
      subscriptionHistory: [newHistoryEntry, ...currentHistory],
      updatedAt: nowIso
    });

    // 2. Mise à jour du statut de la demande
    await updateDoc(reqRef, {
      status: "approved",
      processedAt: nowIso,
      processedBy: adminUser?.email || adminUser?.uid || "Fondateur"
    });

    // 3. Mise à jour de la demande miroir si présente
    try {
      const qMirror = query(
        collection(db, "premium_subscriptions"),
        where("requestId", "==", requestId)
      );
      const sMirror = await getDocs(qMirror);
      sMirror.forEach(d => {
        updateDoc(d.ref, {
          status: "approved",
          isActivated: true,
          activatedAt: nowIso,
          processedBy: adminUser?.email || adminUser?.uid || "Fondateur"
        }).catch(() => {});
      });
    } catch (_) {}

    // 4. Notification push et in-app au client
    await NotificationService.sendNotification({
      userId: userId,
      title: `👑 Abonnement ${normalizedPlan} Validé !`,
      message: `Félicitations ! Votre paiement a été vérifié et votre adhésion ${normalizedPlan} est désormais active jusqu'au ${expiresAtFormatted}. Profitez de vos avantages exclusifs !`,
      type: "premium_activated",
      priority: "HIGH",
      targetRoute: "/abonnement"
    }).catch(() => {});

    return {
      success: true,
      message: `Abonnement ${normalizedPlan} activé avec succès pour ${reqData.userName || userId} !`
    };
  } catch (err: any) {
    console.error("Error approving subscription request:", err);
    return { success: false, message: err?.message || "Erreur lors de la validation." };
  }
}

/**
 * Refus d'une demande d'abonnement par le Fondateur avec motif explicite.
 */
export async function rejectSubscriptionRequest(
  requestId: string,
  rejectionReason: string,
  adminUser: any
): Promise<{ success: boolean; message: string }> {
  if (!db || !requestId) {
    return { success: false, message: "Identifiant de demande manquant." };
  }

  try {
    const reqRef = doc(db, "subscription_requests", requestId);
    const reqSnap = await getDoc(reqRef);

    if (!reqSnap.exists()) {
      return { success: false, message: "Demande introuvable." };
    }

    const reqData = reqSnap.data() as SubscriptionRequest;
    const nowIso = new Date().toISOString();
    const cleanReason = (rejectionReason || "Preuve de paiement non valide ou incomplète.").trim();

    await updateDoc(reqRef, {
      status: "rejected",
      rejectionReason: cleanReason,
      processedAt: nowIso,
      processedBy: adminUser?.email || adminUser?.uid || "Fondateur"
    });

    // Notification au client
    await NotificationService.sendNotification({
      userId: reqData.userId,
      title: "❌ Demande d'abonnement non validée",
      message: `Votre demande d'abonnement ${reqData.planName || "Premium"} n'a pas pu être validée. Motif : "${cleanReason}". Vous pouvez soumettre une nouvelle preuve ou contacter le support.`,
      type: "subscription_rejected",
      priority: "HIGH",
      targetRoute: "/abonnement"
    }).catch(() => {});

    return { success: true, message: "La demande a été rejetée." };
  } catch (err: any) {
    console.error("Error rejecting subscription request:", err);
    return { success: false, message: err?.message || "Erreur lors du rejet." };
  }
}

/**
 * Génération d'un code d'activation Pass Premium unique par le Fondateur.
 * Format standard : AG-PRO-XXXXXX ou AG-ELITE-XXXXXX
 * Usage STRICTEMENT UNIQUE.
 */
export async function generateAdminPremiumCode(params: {
  plan: "pro" | "elite";
  billingCycle: "monthly" | "yearly";
  createdBy?: string;
  notes?: string;
}): Promise<{ success: boolean; code?: string; message?: string }> {
  if (!db) {
    return { success: false, message: "Base de données non disponible." };
  }

  try {
    const isElite = params.plan === "elite";
    const prefix = isElite ? "AG-ELITE" : "AG-PRO";
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const generatedCode = `${prefix}-${randomPart}`;
    const nowIso = new Date().toISOString();
    const durationDays = params.billingCycle === "yearly" ? 365 : 30;

    const codePayload: Omit<PremiumCodeItem, "id"> = {
      code: generatedCode,
      plan: params.plan,
      planName: isElite ? "GOMBO ELITE" : "GOMBO PRO",
      billingCycle: params.billingCycle,
      durationDays: durationDays,
      isUsed: false,
      createdAt: nowIso,
      createdBy: params.createdBy || "Fondateur",
      notes: params.notes || ""
    };

    const docRef = await addDoc(collection(db, "premium_codes"), codePayload);

    return {
      success: true,
      code: generatedCode,
      message: `Code ${generatedCode} créé avec succès.`
    };
  } catch (err: any) {
    console.error("Error generating admin premium code:", err);
    return { success: false, message: err?.message || "Erreur lors de la génération du code." };
  }
}

/**
 * Active directement le statut Premium pour un utilisateur (durée 30 jours ou 365 jours).
 */
export async function activatePremiumForUser(
  userId: string,
  plan: string = "pro",
  codeUsed?: string,
  durationDays: number = 365
): Promise<{ success: boolean; message: string }> {
  if (!db || !userId) {
    return { success: false, message: "Impossible d'accéder au compte." };
  }

  const now = new Date();
  const activatedAtIso = now.toISOString();
  
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + (durationDays || 365));
  const expiresAtIso = expiresAt.toISOString();

  const isElite = plan.toLowerCase().includes("elite");
  const normalizedPlan = isElite ? "GOMBO ELITE" : "GOMBO PRO";
  const planBadge = isElite ? "💎 Adhérent Elite" : "👑 Adhérent Pro";

  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  const expiresAtFormatted = expiresAt.toLocaleDateString("fr-FR", options);
  const startedAtFormatted = now.toLocaleDateString("fr-FR", options);

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    let currentBadges: string[] = [];
    let currentHistory: any[] = [];
    if (userSnap.exists()) {
      const u = userSnap.data();
      currentBadges = u.badges || [];
      currentHistory = u.subscriptionHistory || [];
    }

    const updatedBadges = Array.from(
      new Set([...currentBadges, "💎 Adhérent Premium", planBadge])
    );

    const historyEntry = {
      plan: normalizedPlan,
      billingCycle: durationDays >= 300 ? "yearly" : "monthly",
      activatedAt: activatedAtIso,
      expiresAt: expiresAtIso,
      activationCodeUsed: codeUsed || "ADMIN_DIRECT"
    };

    await updateDoc(userRef, {
      premium: true,
      isPremium: true,
      status: "premium",
      premiumStatus: "active",
      premiumPlan: isElite ? "elite" : "pro",
      subscriptionPlan: normalizedPlan,
      billingCycle: durationDays >= 300 ? "yearly" : "monthly",
      subscriptionBillingCycle: durationDays >= 300 ? "yearly" : "monthly",
      subscriptionStartDate: startedAtFormatted,
      subscriptionExpiryDate: expiresAtFormatted,
      subscriptionExpiresAt: expiresAtIso,
      premiumStartedAt: activatedAtIso,
      premiumActivatedAt: activatedAtIso,
      premiumUntil: expiresAtIso,
      premiumExpiresAt: expiresAtIso,
      isPremiumAutoRenew: false,
      badges: updatedBadges,
      subscriptionHistory: [historyEntry, ...currentHistory],
      lastSubscriptionCode: codeUsed || "",
      updatedAt: activatedAtIso
    });

    await NotificationService.sendNotification({
      userId: userId,
      title: `👑 Abonnement ${normalizedPlan} Activé !`,
      message: `Félicitations ! Votre abonnement ${normalizedPlan} est désormais actif jusqu'au ${expiresAtFormatted}.`,
      type: "premium_activated",
      priority: "HIGH",
      targetRoute: "/abonnement"
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
 * Valide et consomme un code d'activation Pass Premium.
 * RÈGLE STRICTE :
 * - Le code doit exister
 * - Il ne doit PAS être déjà utilisé (isUsed !== true)
 * - Il est consommé IMMÉDIATEMENT (isUsed = true)
 * - Il est IMPOSSIBLE de le réutiliser.
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
    let durationDays = 30; // default 1 mois
    let codeDocRef: any = null;

    // 1. Recherche dans 'premium_codes'
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
        if (data.durationDays) {
          durationDays = data.durationDays;
        } else if (data.billingCycle === "yearly") {
          durationDays = 365;
        }
      }
    });

    // 2. Recherche dans 'validation_codes'
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
          if (data.durationDays) {
            durationDays = data.durationDays;
          }
        }
      });
    }

    if (!isCodeFoundAndValid) {
      return { success: false, message: "Code invalide ou déjà utilisé." };
    }

    // Consommation définitive du code dans Firestore
    if (codeDocRef) {
      await updateDoc(codeDocRef, {
        isUsed: true,
        usedAt: now,
        usedBy: userId
      });
    }

    // Activation du statut Premium pour l'utilisateur
    const actResult = await activatePremiumForUser(userId, detectedPlan, cleanCode, durationDays);

    if (actResult.success) {
      return {
        success: true,
        message: `🎉 Félicitations ! Votre abonnement ${detectedPlan.toUpperCase()} (${durationDays} jours) est activé.`,
        plan: detectedPlan
      };
    }

    return { success: false, message: "Erreur lors de l'activation du compte." };
  } catch (err: any) {
    console.error("Error validating premium code:", err);
    return { success: false, message: "Code invalide." };
  }
}

/**
 * Vérification d'expiration de l'abonnement en mode Bêta manuelle.
 * STRICT :
 * - Aucun prélèvement Wallet
 * - Aucune commission
 * - Si expiré : basculement gracieux vers GOMBO FREE et notification à l'utilisateur.
 */
export async function checkAndProcessPremiumAutoRenewal(
  profile: any
): Promise<{ processed: boolean; status: "renewed" | "expired" | "not_expired" | "no_profile" }> {
  if (!db || !profile || !profile.uid) {
    return { processed: false, status: "no_profile" };
  }

  if (!profile.isPremium) {
    return { processed: false, status: "not_expired" };
  }

  if (!profile.premiumExpiresAt && !profile.subscriptionExpiresAt) {
    return { processed: false, status: "not_expired" };
  }

  const now = new Date();
  const expiryTimestamp = profile.subscriptionExpiresAt || profile.premiumExpiresAt;
  const expiry = new Date(expiryTimestamp);

  if (now <= expiry) {
    return { processed: false, status: "not_expired" };
  }

  // L'abonnement est expiré ! Basculement propre vers GOMBO FREE
  const userRef = doc(db, "users", profile.uid);
  const plan = profile.premiumPlan || "pro";
  const planName = plan.toLowerCase().includes("elite") ? "GOMBO ELITE" : "GOMBO PRO";

  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return { processed: false, status: "no_profile" };
    }

    const freshData = userSnap.data();
    const currentBadges: string[] = freshData.badges || [];
    const updatedBadges = currentBadges.filter(
      b => b !== "💎 Adhérent Premium" && b !== "💎 Adhérent Elite" && b !== "👑 Adhérent Pro"
    );

    await updateDoc(userRef, {
      isPremium: false,
      premium: false,
      premiumStatus: "expired",
      subscriptionPlan: "GOMBO FREE",
      premiumPlan: "free",
      badges: updatedBadges,
      updatedAt: now.toISOString()
    });

    await NotificationService.sendNotification({
      userId: profile.uid,
      title: "⚠️ Abonnement Premium Expiré",
      message: `Votre abonnement ${planName} est arrivé à échéance. Pour réactiver vos avantages et votre visibilité prioritaire, renouvelez votre formule dans l'espace Abonnement.`,
      type: "warning",
      priority: "NORMAL",
      targetRoute: "/abonnement"
    }).catch(() => {});

    return { processed: true, status: "expired" };
  } catch (err) {
    console.error("Error processing expiration:", err);
    return { processed: false, status: "no_profile" };
  }
}

/**
 * Prolongation manuelle d'un abonnement par le Fondateur.
 */
export async function prolongSubscription(
  userId: string,
  additionalDays: number,
  adminUser: any,
  reason: string = "Geste commercial du Fondateur"
): Promise<{ success: boolean; message: string }> {
  if (!db || !userId) return { success: false, message: "Utilisateur introuvable." };

  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return { success: false, message: "Profil introuvable." };

    const u = snap.data();
    const currentExpiry = u.subscriptionExpiresAt || u.premiumExpiresAt || new Date().toISOString();
    const baseDate = new Date(currentExpiry) > new Date() ? new Date(currentExpiry) : new Date();
    
    baseDate.setDate(baseDate.getDate() + additionalDays);
    const newExpiryIso = baseDate.toISOString();
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    const newExpiryFormatted = baseDate.toLocaleDateString("fr-FR", options);

    const historyEntry = {
      action: "prolongation",
      additionalDays,
      previousExpiry: currentExpiry,
      newExpiry: newExpiryIso,
      reason,
      performedBy: adminUser?.email || "Fondateur",
      timestamp: new Date().toISOString()
    };

    const currentHistory = u.subscriptionHistory || [];

    await updateDoc(userRef, {
      isPremium: true,
      premium: true,
      premiumStatus: "active",
      subscriptionExpiresAt: newExpiryIso,
      premiumExpiresAt: newExpiryIso,
      premiumUntil: newExpiryIso,
      subscriptionExpiryDate: newExpiryFormatted,
      subscriptionHistory: [historyEntry, ...currentHistory],
      updatedAt: new Date().toISOString()
    });

    await NotificationService.sendNotification({
      userId,
      title: "🎁 Prolongation de votre Abonnement !",
      message: `Votre abonnement a été prolongé de ${additionalDays} jours par l'administration AFRIGOMBO. Nouvelle date d'échéance : ${newExpiryFormatted}.`,
      type: "premium_activated",
      priority: "HIGH",
      targetRoute: "/abonnement"
    }).catch(() => {});

    return { success: true, message: `Abonnement prolongé de ${additionalDays} jours jusqu'au ${newExpiryFormatted}.` };
  } catch (err: any) {
    return { success: false, message: err?.message || "Erreur de prolongation." };
  }
}

/**
 * Révocation / résiliation manuelle immédiate d'un abonnement.
 */
export async function revokeSubscription(
  userId: string,
  adminUser: any,
  reason: string = "Révocation administrative"
): Promise<{ success: boolean; message: string }> {
  if (!db || !userId) return { success: false, message: "Utilisateur introuvable." };

  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return { success: false, message: "Profil introuvable." };

    const u = snap.data();
    const currentBadges: string[] = u.badges || [];
    const updatedBadges = currentBadges.filter(
      b => b !== "💎 Adhérent Premium" && b !== "💎 Adhérent Elite" && b !== "👑 Adhérent Pro"
    );

    const historyEntry = {
      action: "revocation",
      reason,
      revokedAt: new Date().toISOString(),
      performedBy: adminUser?.email || "Fondateur"
    };

    await updateDoc(userRef, {
      isPremium: false,
      premium: false,
      premiumStatus: "revoked",
      subscriptionPlan: "GOMBO FREE",
      premiumPlan: "free",
      badges: updatedBadges,
      subscriptionHistory: [historyEntry, ...(u.subscriptionHistory || [])],
      updatedAt: new Date().toISOString()
    });

    await NotificationService.sendNotification({
      userId,
      title: "⚠️ Abonnement Résilié",
      message: `Votre abonnement premium a été résilié par l'administration. Motif : ${reason}.`,
      type: "warning",
      priority: "HIGH",
      targetRoute: "/abonnement"
    }).catch(() => {});

    return { success: true, message: "Abonnement révoqué avec succès." };
  } catch (err: any) {
    return { success: false, message: err?.message || "Erreur de révocation." };
  }
}

/**
 * Changement manuel de formule (PRO <-> ELITE).
 */
export async function changeSubscriptionPlan(
  userId: string,
  newPlan: "pro" | "elite",
  adminUser: any,
  reason: string = "Mise à niveau administrative"
): Promise<{ success: boolean; message: string }> {
  if (!db || !userId) return { success: false, message: "Utilisateur introuvable." };

  try {
    const isElite = newPlan === "elite";
    const normalizedPlan = isElite ? "GOMBO ELITE" : "GOMBO PRO";
    const planBadge = isElite ? "💎 Adhérent Elite" : "👑 Adhérent Pro";
    const oldBadgeToRemove = isElite ? "👑 Adhérent Pro" : "💎 Adhérent Elite";

    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return { success: false, message: "Profil introuvable." };

    const u = snap.data();
    const currentBadges: string[] = (u.badges || []).filter((b: string) => b !== oldBadgeToRemove);
    const updatedBadges = Array.from(new Set([...currentBadges, "💎 Adhérent Premium", planBadge]));

    const historyEntry = {
      action: "plan_change",
      oldPlan: u.subscriptionPlan || u.premiumPlan,
      newPlan: normalizedPlan,
      reason,
      performedBy: adminUser?.email || "Fondateur",
      timestamp: new Date().toISOString()
    };

    await updateDoc(userRef, {
      isPremium: true,
      premium: true,
      premiumStatus: "active",
      subscriptionPlan: normalizedPlan,
      premiumPlan: newPlan,
      badges: updatedBadges,
      subscriptionHistory: [historyEntry, ...(u.subscriptionHistory || [])],
      updatedAt: new Date().toISOString()
    });

    await NotificationService.sendNotification({
      userId,
      title: `👑 Formule Modifiée : ${normalizedPlan}`,
      message: `Votre abonnement a été basculé vers la formule ${normalizedPlan}. Profitez de vos nouveaux avantages !`,
      type: "premium_activated",
      priority: "HIGH",
      targetRoute: "/abonnement"
    }).catch(() => {});

    return { success: true, message: `Formule changée vers ${normalizedPlan} avec succès.` };
  } catch (err: any) {
    return { success: false, message: err?.message || "Erreur lors du changement de plan." };
  }
}

/**
 * Enregistrement manuel d'un remboursement (sans incidence bancaire ni débit Wallet).
 */
export async function recordManualRefund(
  userId: string,
  amount: number,
  method: string,
  reason: string,
  adminUser: any
): Promise<{ success: boolean; message: string }> {
  if (!db || !userId) return { success: false, message: "Paramètres manquants." };

  try {
    const nowIso = new Date().toISOString();
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);

    const historyEntry = {
      action: "manual_refund_recorded",
      amount,
      paymentMethod: method,
      reason,
      refundedAt: nowIso,
      performedBy: adminUser?.email || "Fondateur"
    };

    if (snap.exists()) {
      const u = snap.data();
      await updateDoc(userRef, {
        subscriptionHistory: [historyEntry, ...(u.subscriptionHistory || [])],
        updatedAt: nowIso
      });
    }

    // Journaliser dans une collection dédiée 'subscription_refunds'
    await addDoc(collection(db, "subscription_refunds"), {
      userId,
      amount,
      paymentMethod: method,
      reason,
      recordedBy: adminUser?.email || "Fondateur",
      recordedAt: nowIso
    });

    await NotificationService.sendNotification({
      userId,
      title: "💵 Remboursement Enregistré",
      message: `Un remboursement manuel de ${amount.toLocaleString("fr-FR")} FCFA (via ${method}) a été consigné dans votre dossier d'abonnement. Motif : ${reason}.`,
      type: "subscription_pending",
      priority: "NORMAL",
      targetRoute: "/abonnement"
    }).catch(() => {});

    return { success: true, message: `Remboursement de ${amount.toLocaleString("fr-FR")} FCFA consigné avec succès.` };
  } catch (err: any) {
    return { success: false, message: err?.message || "Erreur d'enregistrement du remboursement." };
  }
}

