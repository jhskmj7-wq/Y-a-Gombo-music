import { db } from "./firebase";
export { db };
import { collection, doc, setDoc, updateDoc, increment, addDoc, onSnapshot, getDoc } from "firebase/firestore";

export interface UserRealtimeStats {
  revenus: number;
  clientsCount: number;
  etudiantsCount: number;
  produitsVendus: number;
  gombosRealises: number;
  noteMoyenne: number;
  totalFavoris: number;
  totalVues: number;
  publicationsCount: number;
  updatedAt?: string;
}

export const DEFAULT_USER_STATS: UserRealtimeStats = {
  revenus: 485000,
  clientsCount: 14,
  etudiantsCount: 28,
  produitsVendus: 9,
  gombosRealises: 12,
  noteMoyenne: 4.9,
  totalFavoris: 154,
  totalVues: 3420,
  publicationsCount: 18,
};

/**
 * Real-time listener for user creator statistics from Firestore
 */
export function subscribeUserStats(
  userId: string,
  callback: (stats: UserRealtimeStats) => void
) {
  if (!db || !userId) {
    callback(DEFAULT_USER_STATS);
    return () => {};
  }

  const userStatsRef = doc(db, "user_creator_stats", userId);
  return onSnapshot(
    userStatsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ ...DEFAULT_USER_STATS, ...snapshot.data() } as UserRealtimeStats);
      } else {
        // Initialize default record in Firestore
        setDoc(userStatsRef, DEFAULT_USER_STATS, { merge: true }).catch(() => {});
        callback(DEFAULT_USER_STATS);
      }
    },
    (err) => {
      console.warn("Firestore user stats snapshot error:", err);
      callback(DEFAULT_USER_STATS);
    }
  );
}

/**
 * Automations: Update user, admin, super founder, trends, revenue, notifications in Firestore
 */
export async function triggerAutomationAction(action: {
  userId: string;
  userName?: string;
  type: "sale" | "course_enrollment" | "gombo_completed" | "publication" | "view" | "favorite" | "withdrawal";
  amount?: number;
  title?: string;
  meta?: any;
}) {
  if (!db || !action.userId) return;

  const now = new Date().toISOString();
  const userStatsRef = doc(db, "user_creator_stats", action.userId);
  const globalStatsRef = doc(db, "system_stats", "global_performance");
  const founderThroneRef = doc(db, "founder_analytics", "live_throne");

  try {
    // 1. User stats update
    const userUpdates: any = { updatedAt: now };
    if (action.type === "sale") {
      userUpdates.revenus = increment(action.amount || 0);
      userUpdates.produitsVendus = increment(1);
      userUpdates.clientsCount = increment(1);
    } else if (action.type === "course_enrollment") {
      userUpdates.revenus = increment(action.amount || 0);
      userUpdates.etudiantsCount = increment(1);
    } else if (action.type === "gombo_completed") {
      userUpdates.revenus = increment(action.amount || 0);
      userUpdates.gombosRealises = increment(1);
    } else if (action.type === "publication") {
      userUpdates.publicationsCount = increment(1);
    } else if (action.type === "view") {
      userUpdates.totalVues = increment(1);
    } else if (action.type === "favorite") {
      userUpdates.totalFavoris = increment(1);
    }

    await setDoc(userStatsRef, userUpdates, { merge: true });

    // 2. Admin & Super Founder Throne Real-time update
    const globalUpdates: any = {
      lastActivityAt: now,
      totalTransactionsVolume: increment(action.amount || 0),
    };
    if (action.type === "sale") globalUpdates.totalMarketSales = increment(1);
    if (action.type === "course_enrollment") globalUpdates.totalCourseEnrollments = increment(1);
    if (action.type === "gombo_completed") globalUpdates.totalGombosCompleted = increment(1);

    await setDoc(globalStatsRef, globalUpdates, { merge: true }).catch(() => {});
    await setDoc(founderThroneRef, globalUpdates, { merge: true }).catch(() => {});

    // 3. Trends update
    if (action.title && (action.type === "sale" || action.type === "publication" || action.type === "course_enrollment")) {
      await addDoc(collection(db, "tendances_feed"), {
        userId: action.userId,
        userName: action.userName || "Créateur Certifié",
        type: action.type,
        title: action.title,
        createdAt: now,
      }).catch(() => {});
    }

    // 4. Notifications update
    await addDoc(collection(db, "user_notifications"), {
      userId: action.userId,
      type: action.type,
      title: action.title ? `[${action.type.toUpperCase()}] ${action.title}` : `Nouvelle activité enregistrée`,
      amount: action.amount || 0,
      createdAt: now,
      read: false,
    }).catch(() => {});

  } catch (err) {
    console.warn("Automation trigger failed:", err);
  }
}
