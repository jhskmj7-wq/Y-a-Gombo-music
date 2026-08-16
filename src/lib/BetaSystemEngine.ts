import { db, gomboDB } from "../firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  setDoc,
  serverTimestamp 
} from "firebase/firestore";
import { User, BetaRankType, BetaBenefit } from "../types";
import { logAdminAction } from "./auditLogger";

export interface BetaStats {
  ambassadorCount: number;
  builderCount: number;
  totalCount: number;
  maxAmbassadors: number;
  maxBuilders: number;
  firstAssignedDate: string | null;
  lastAssignedDate: string | null;
  ambassadorsEnabled: boolean;
  buildersEnabled: boolean;
}

/**
 * Reads Deployment Center configuration for Beta System.
 */
export async function getBetaDeploymentConfig(): Promise<{ ambassadorsEnabled: boolean; buildersEnabled: boolean }> {
  try {
    if (!db) return { ambassadorsEnabled: true, buildersEnabled: true };
    const snap = await getDoc(doc(db, "systemConfig", "betaProgram"));
    if (snap.exists()) {
      const data = snap.data();
      return {
        ambassadorsEnabled: data.ambassadorsEnabled !== false,
        buildersEnabled: data.buildersEnabled !== false
      };
    }
  } catch (err) {
    console.warn("Could not read beta deployment config, defaulting to active:", err);
  }
  return { ambassadorsEnabled: true, buildersEnabled: true };
}

/**
 * Updates Deployment Center configuration for Beta System.
 */
export async function updateBetaDeploymentConfig(
  config: { ambassadorsEnabled?: boolean; buildersEnabled?: boolean },
  performedByAdmin: { uid: string; email: string }
): Promise<boolean> {
  try {
    if (!db) return false;
    const ref = doc(db, "systemConfig", "betaProgram");
    const existingSnap = await getDoc(ref);
    const existing = existingSnap.exists() ? existingSnap.data() : {};
    const updated = {
      ...existing,
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: performedByAdmin.email || performedByAdmin.uid
    };
    await setDoc(ref, updated, { merge: true });

    await logAdminAction({
      adminUid: performedByAdmin.uid,
      adminEmail: performedByAdmin.email || "founder@afrigombo.com",
      action: "UPDATE_BETA_DEPLOYMENT_CONFIG",
      reason: `Mise à jour des paramètres du programme Bêta: Ambassadeurs=${updated.ambassadorsEnabled}, Bâtisseurs=${updated.buildersEnabled}`,
      oldValue: existing,
      newValue: updated
    });
    return true;
  } catch (err) {
    console.error("Error updating beta deployment config:", err);
    return false;
  }
}

/**
 * Processes KYC-validated user for Beta Rank eligibility.
 * Absolute Rule: Beta rank is assigned ONLY after KYC is approved.
 * Order is strictly by KYC validation timestamp.
 */
export async function processUserBetaEligibility(
  userId: string,
  performedByAdmin?: { uid: string; email: string }
): Promise<{ 
  success: boolean; 
  reason?: string; 
  rankType?: BetaRankType; 
  rankNumber?: number; 
  expiresAt?: string;
  benefit?: BetaBenefit;
}> {
  if (!db || !userId) {
    return { success: false, reason: "DATABASE_OR_USER_MISSING" };
  }

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { success: false, reason: "USER_NOT_FOUND" };
    }

    const userData = userSnap.data() as User;

    // RULE 1: User MUST be KYC Verified
    const isKycApproved = userData.kycStatus === "approved" || userData.isVerified === true || userData.isCertified === true;
    if (!isKycApproved) {
      return { success: false, reason: "KYC_NOT_VERIFIED" };
    }

    // RULE 2: Anti-Double Attribution (User cannot receive two ranks or re-attribute)
    if (userData.betaRankType && userData.betaRankType !== "NONE" && userData.betaRankNumber) {
      return { 
        success: false, 
        reason: "ALREADY_ASSIGNED", 
        rankType: userData.betaRankType, 
        rankNumber: userData.betaRankNumber 
      };
    }

    // Check Deployment Center controls
    const config = await getBetaDeploymentConfig();

    // Query all existing users with assigned Beta Ranks to compute accurate positions
    const usersSnap = await getDocs(collection(db, "users"));
    const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as User[];

    const assignedBetaUsers = allUsers
      .filter(u => u.betaRankType && u.betaRankType !== "NONE" && typeof u.betaRankNumber === "number")
      .sort((a, b) => (a.betaRankNumber || 999) - (b.betaRankNumber || 999));

    const ambassadors = assignedBetaUsers.filter(u => u.betaRankType === "AMBASSADOR" || (u.betaRankNumber && u.betaRankNumber <= 20));
    const builders = assignedBetaUsers.filter(u => u.betaRankType === "BUILDER" || (u.betaRankNumber && u.betaRankNumber > 20 && u.betaRankNumber <= 100));

    const ambassadorCount = ambassadors.length;
    const totalCount = assignedBetaUsers.length;

    let targetRankType: BetaRankType = "NONE";
    let targetRankNumber = 0;
    let durationMonths = 0;
    let referencePrice = 0;
    let title = "";

    // Position 1 to 20 -> AMBASSADEUR
    if (ambassadorCount < 20 && config.ambassadorsEnabled) {
      targetRankType = "AMBASSADOR";
      targetRankNumber = ambassadorCount + 1;
      durationMonths = 12;
      referencePrice = 10000;
      title = "AMBASSADEUR DE L'ÉCOSYSTÈME";
    } 
    // Position 21 to 100 -> BÂTISSEUR
    else if (totalCount < 100 && config.buildersEnabled) {
      targetRankType = "BUILDER";
      targetRankNumber = totalCount + 1;
      durationMonths = 6;
      referencePrice = 5000;
      title = "BÂTISSEUR DE L'ÉCOSYSTÈME";
    } 
    else {
      // After 100 or disabled -> No automatic rank
      return { success: false, reason: "BETA_SLOTS_FULL_OR_DISABLED" };
    }

    const now = new Date();
    const startedAt = now.toISOString();
    const expiresAtDate = new Date(now);
    expiresAtDate.setMonth(expiresAtDate.getMonth() + durationMonths);
    const expiresAt = expiresAtDate.toISOString();

    const betaBenefit: BetaBenefit = {
      type: targetRankType as "AMBASSADOR" | "BUILDER",
      rankNumber: targetRankNumber,
      title,
      durationMonths,
      price: 0,
      referencePrice,
      startedAt,
      expiresAt,
      status: "active",
      assignedBy: performedByAdmin?.email || "SYSTEM_KYC_AUTO"
    };

    // Update user document in Firestore
    await updateDoc(userRef, {
      betaRankType: targetRankType,
      betaRankNumber: targetRankNumber,
      betaRankTitle: title,
      betaRankAssignedAt: startedAt,
      betaBenefit: betaBenefit,
      // Privileges activation
      isSubscribed: true,
      premium: true,
      isPremium: true,
      premiumStatus: "active",
      premiumPlan: targetRankType === "AMBASSADOR" ? "elite" : "pro",
      subscriptionPlan: targetRankType === "AMBASSADOR" ? "GOMBO ELITE AMBASSADOR" : "GOMBO PRO BUILDER",
      premiumUntil: expiresAt
    });

    // Write Audit Log
    await logAdminAction({
      adminUid: performedByAdmin?.uid || "SYSTEM_KYC",
      adminEmail: performedByAdmin?.email || "system@afrigombo.com",
      action: "BETA_RANK_ASSIGNED",
      targetUserId: userId,
      reason: `Attribution officielle du rang Bêta ${title} #${targetRankNumber} (Avantage ${durationMonths} mois offerts).`,
      newValue: {
        betaRankType: targetRankType,
        betaRankNumber: targetRankNumber,
        betaBenefit
      }
    });

    // Send Real-Time Notification
    try {
      const notifTitle = targetRankType === "AMBASSADOR" 
        ? "🏆 Distinction Ambassadeur !" 
        : "🏗️ Distinction Bâtisseur !";
      const notifBody = targetRankType === "AMBASSADOR" 
        ? "🎉 Félicitations ! Vous êtes officiellement Ambassadeur de l'écosystème AFRIGOMBO." 
        : "🎉 Félicitations ! Vous êtes officiellement Bâtisseur de l'écosystème AFRIGOMBO.";

      await gomboDB.publishNotification({
        userId,
        type: "beta_rank_assigned",
        title: notifTitle,
        message: notifBody,
        priority: "high"
      });
    } catch (e) {
      console.warn("Could not publish notification for beta rank:", e);
    }

    return {
      success: true,
      rankType: targetRankType,
      rankNumber: targetRankNumber,
      expiresAt,
      benefit: betaBenefit
    };

  } catch (err: any) {
    console.error("Error processing user beta eligibility:", err);
    return { success: false, reason: err?.message || "INTERNAL_ERROR" };
  }
}

/**
 * Checks benefit expiration.
 * Historical title remains preserved forever even if the commercial privilege expires.
 */
export function checkAndUpdateBenefitExpirations(user: User): User {
  if (!user || !user.betaBenefit) return user;

  const benefit = user.betaBenefit;
  if (benefit.status === "active" && benefit.expiresAt) {
    const expiresDate = new Date(benefit.expiresAt);
    if (new Date() > expiresDate) {
      // Privilege expired, but title & rank remain!
      const updatedUser = {
        ...user,
        betaBenefit: {
          ...benefit,
          status: "expired" as const
        },
        premiumStatus: "expired" as const,
        isPremium: false,
        premium: false,
        isSubscribed: false
      };

      // Background sync to Firestore
      if (db && user.id) {
        updateDoc(doc(db, "users", user.id), {
          "betaBenefit.status": "expired",
          premiumStatus: "expired",
          isPremium: false,
          premium: false,
          isSubscribed: false
        }).catch(err => console.warn("Failed syncing benefit expiration to Firestore:", err));
      }

      return updatedUser;
    }
  }
  return user;
}

/**
 * Admin action: Suspend a Beta benefit.
 */
export async function suspendBetaBenefit(
  userId: string,
  reason: string,
  performedByAdmin: { uid: string; email: string }
): Promise<boolean> {
  if (!db || !userId) return false;
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return false;

    const userData = snap.data() as User;
    if (!userData.betaBenefit) return false;

    const nowIso = new Date().toISOString();
    const updatedBenefit: BetaBenefit = {
      ...userData.betaBenefit,
      status: "suspended",
      suspendedAt: nowIso,
      suspendedReason: reason
    };

    await updateDoc(userRef, {
      betaBenefit: updatedBenefit,
      premiumStatus: "suspended",
      isPremium: false,
      premium: false,
      isSubscribed: false
    });

    await logAdminAction({
      adminUid: performedByAdmin.uid,
      adminEmail: performedByAdmin.email,
      action: "SUSPEND_BETA_BENEFIT",
      targetUserId: userId,
      reason: `Suspension de l'avantage Bêta : ${reason}`,
      oldValue: userData.betaBenefit,
      newValue: updatedBenefit
    });

    return true;
  } catch (err) {
    console.error("Error suspending beta benefit:", err);
    return false;
  }
}

/**
 * Admin action: Reactivate a Beta benefit.
 */
export async function reactivateBetaBenefit(
  userId: string,
  performedByAdmin: { uid: string; email: string }
): Promise<boolean> {
  if (!db || !userId) return false;
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return false;

    const userData = snap.data() as User;
    if (!userData.betaBenefit) return false;

    const benefit = userData.betaBenefit;
    const isExpired = new Date() > new Date(benefit.expiresAt);
    const newStatus = isExpired ? "expired" : "active";

    const updatedBenefit: BetaBenefit = {
      ...benefit,
      status: newStatus,
      reactivatedAt: new Date().toISOString()
    };

    await updateDoc(userRef, {
      betaBenefit: updatedBenefit,
      premiumStatus: newStatus,
      isPremium: !isExpired,
      premium: !isExpired,
      isSubscribed: !isExpired
    });

    await logAdminAction({
      adminUid: performedByAdmin.uid,
      adminEmail: performedByAdmin.email,
      action: "REACTIVATE_BETA_BENEFIT",
      targetUserId: userId,
      reason: "Réactivation manuelle de l'avantage Bêta par l'administrateur.",
      oldValue: benefit,
      newValue: updatedBenefit
    });

    return true;
  } catch (err) {
    console.error("Error reactivating beta benefit:", err);
    return false;
  }
}

/**
 * Admin action: Correct an erroneous attribution with audit log.
 */
export async function correctBetaRank(
  userId: string,
  newRankType: BetaRankType,
  newRankNumber?: number,
  reason: string = "Correction administrative du rang Bêta",
  performedByAdmin?: { uid: string; email: string }
): Promise<boolean> {
  if (!db || !userId) return false;
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return false;

    const userData = snap.data() as User;
    const oldState = {
      betaRankType: userData.betaRankType,
      betaRankNumber: userData.betaRankNumber,
      betaBenefit: userData.betaBenefit
    };

    if (newRankType === "NONE") {
      await updateDoc(userRef, {
        betaRankType: "NONE",
        betaRankNumber: null,
        betaRankTitle: null,
        betaBenefit: null,
        premiumStatus: "none",
        isPremium: false,
        premium: false,
        isSubscribed: false
      });
    } else {
      const durationMonths = newRankType === "AMBASSADOR" ? 12 : 6;
      const referencePrice = newRankType === "AMBASSADOR" ? 10000 : 5000;
      const title = newRankType === "AMBASSADOR" ? "AMBASSADEUR DE L'ÉCOSYSTÈME" : "BÂTISSEUR DE L'ÉCOSYSTÈME";

      const now = new Date();
      const startedAt = userData.betaRankAssignedAt || now.toISOString();
      const expiresAtDate = new Date(startedAt);
      expiresAtDate.setMonth(expiresAtDate.getMonth() + durationMonths);
      const expiresAt = expiresAtDate.toISOString();

      const rankNum = newRankNumber || userData.betaRankNumber || 1;

      const newBenefit: BetaBenefit = {
        type: newRankType as "AMBASSADOR" | "BUILDER",
        rankNumber: rankNum,
        title,
        durationMonths,
        price: 0,
        referencePrice,
        startedAt,
        expiresAt,
        status: "active",
        assignedBy: performedByAdmin?.email || "SUPER_FOUNDER"
      };

      await updateDoc(userRef, {
        betaRankType: newRankType,
        betaRankNumber: rankNum,
        betaRankTitle: title,
        betaBenefit: newBenefit,
        isSubscribed: true,
        premium: true,
        isPremium: true,
        premiumStatus: "active",
        premiumPlan: newRankType === "AMBASSADOR" ? "elite" : "pro",
        subscriptionPlan: newRankType === "AMBASSADOR" ? "GOMBO ELITE AMBASSADOR" : "GOMBO PRO BUILDER",
        premiumUntil: expiresAt
      });
    }

    await logAdminAction({
      adminUid: performedByAdmin?.uid || "SUPER_FOUNDER",
      adminEmail: performedByAdmin?.email || "founder@afrigombo.com",
      action: "CORRECT_BETA_RANK",
      targetUserId: userId,
      reason: `Correction du rang Bêta vers ${newRankType} (#${newRankNumber || 'N/A'}) : ${reason}`,
      oldValue: oldState,
      newValue: { newRankType, newRankNumber }
    });

    return true;
  } catch (err) {
    console.error("Error correcting beta rank:", err);
    return false;
  }
}

/**
 * Calculates current Beta Program statistics for Super Founder dashboard.
 */
export async function getBetaProgramStats(): Promise<BetaStats & { members: User[] }> {
  const defaultConfig: BetaStats & { members: User[] } = {
    ambassadorCount: 0,
    builderCount: 0,
    totalCount: 0,
    maxAmbassadors: 20,
    maxBuilders: 80,
    firstAssignedDate: null,
    lastAssignedDate: null,
    ambassadorsEnabled: true,
    buildersEnabled: true,
    members: []
  };

  if (!db) return defaultConfig;

  try {
    const deploymentConfig = await getBetaDeploymentConfig();
    const snap = await getDocs(collection(db, "users"));
    const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() })) as User[];

    const betaMembers = allUsers
      .filter(u => u.betaRankType && u.betaRankType !== "NONE" && typeof u.betaRankNumber === "number")
      .sort((a, b) => (a.betaRankNumber || 999) - (b.betaRankNumber || 999));

    const ambassadors = betaMembers.filter(u => u.betaRankType === "AMBASSADOR" || (u.betaRankNumber && u.betaRankNumber <= 20));
    const builders = betaMembers.filter(u => u.betaRankType === "BUILDER" || (u.betaRankNumber && u.betaRankNumber > 20 && u.betaRankNumber <= 100));

    const dates = betaMembers
      .map(u => u.betaRankAssignedAt || u.betaBenefit?.startedAt || u.kycApprovedDate)
      .filter(Boolean) as string[];

    dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return {
      ambassadorCount: ambassadors.length,
      builderCount: builders.length,
      totalCount: betaMembers.length,
      maxAmbassadors: 20,
      maxBuilders: 80,
      firstAssignedDate: dates[0] || null,
      lastAssignedDate: dates[dates.length - 1] || null,
      ambassadorsEnabled: deploymentConfig.ambassadorsEnabled,
      buildersEnabled: deploymentConfig.buildersEnabled,
      members: betaMembers
    };
  } catch (err) {
    console.error("Error calculating beta program stats:", err);
    return defaultConfig;
  }
}
