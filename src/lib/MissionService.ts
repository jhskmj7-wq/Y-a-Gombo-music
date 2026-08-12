import { db } from "./firebase";
import { 
  doc, 
  collection, 
  onSnapshot, 
  runTransaction, 
  getDoc, 
  getDocs, 
  query, 
  where,
  setDoc
} from "firebase/firestore";
import { Mission, UserMission, GawaHistoryRecord } from "../types";

const MISSIONS_COLLECTION = "missions";
const USER_MISSIONS_COLLECTION = "userMissions";
const GAWA_HISTORY_COLLECTION = "gawaHistory";

export class MissionService {
  /**
   * Subscribe to list of active and enabled Gawa missions
   */
  static subscribeMissions(callback: (missions: Mission[]) => void): () => void {
    const colRef = collection(db, MISSIONS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const missions: Mission[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.enabled) {
            missions.push({ id: docSnap.id, ...data } as Mission);
          }
        });
        callback(missions);
      },
      (err) => {
        console.error("Error subscribing to Gawa missions:", err);
        callback([]);
      }
    );
  }

  /**
   * Subscribe to completed user missions
   */
  static subscribeUserMissions(userId: string, callback: (completed: UserMission[]) => void): () => void {
    const colRef = collection(db, USER_MISSIONS_COLLECTION);
    const q = query(colRef, where("userId", "==", userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const completed: UserMission[] = [];
        snapshot.forEach((docSnap) => {
          completed.push(docSnap.data() as UserMission);
        });
        callback(completed);
      },
      (err) => {
        console.error("Error subscribing to user completed missions:", err);
        callback([]);
      }
    );
  }

  /**
   * Initialize default missions in Firestore if the collection is empty
   */
  static async initializeDefaultMissionsIfNeeded(): Promise<void> {
    try {
      const colRef = collection(db, MISSIONS_COLLECTION);
      const snap = await getDocs(colRef);
      if (snap.empty) {
        console.log("Initializing default Gawa missions in Firestore...");
        const defaults: Mission[] = [
          {
            id: "profile_completion",
            title: "Compléter son profil",
            description: "Ajoutez votre biographie, commune, numéro de téléphone, et photo d'avatar.",
            rewardGawa: 5,
            type: "PROFILE",
            enabled: true
          },
          {
            id: "first_gombo",
            title: "Publier son premier Gombo",
            description: "Publiez votre première offre ou demande d'opportunité d'activité sur AFRIGOMBO.",
            rewardGawa: 10,
            type: "FIRST_GOMBO",
            enabled: true
          },
          {
            id: "participate_activity",
            title: "Participer à une activité",
            description: "Postulez ou participez à au moins une opportunité (Gombo ou Renfort Express).",
            rewardGawa: 5,
            type: "PARTICIPATE",
            enabled: true
          },
          {
            id: "login_3days",
            title: "Se connecter 3 jours",
            description: "Restez actif en vous connectant au moins 3 fois sur la plateforme AFRIGOMBO.",
            rewardGawa: 10,
            type: "LOGIN_3DAYS",
            enabled: true
          },
          {
            id: "special_mission",
            title: "Compléter une mission spéciale",
            description: "Mission spéciale de lancement AFRIGOMBO Élite pour remporter des bonus exclusifs.",
            rewardGawa: 20,
            type: "SPECIAL",
            enabled: true
          }
        ];

        for (const mission of defaults) {
          await setDoc(doc(db, MISSIONS_COLLECTION, mission.id), mission);
        }
      }
    } catch (err) {
      console.error("Failed to initialize default Gawa missions:", err);
    }
  }

  /**
   * Evaluate if a user has completed the technical requirements of a mission
   */
  static async evaluateMissionCompletion(userId: string, missionType: Mission["type"]): Promise<{ completed: boolean; reason?: string }> {
    if (!userId) return { completed: false, reason: "ID utilisateur manquant." };

    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return { completed: false, reason: "Utilisateur introuvable." };
      }
      const userData = userSnap.data();

      switch (missionType) {
        case "PROFILE": {
          // Check: bio, phone, commune, photoURL or avatarUrl
          const hasBio = typeof userData.bio === "string" && userData.bio.trim().length > 5;
          const hasPhone = typeof userData.phone === "string" && userData.phone.trim().length > 5;
          const hasCommune = typeof userData.commune === "string" && userData.commune.trim().length > 2;
          const hasAvatar = (typeof userData.photoURL === "string" && userData.photoURL.trim().length > 5) || 
                            (typeof userData.avatarUrl === "string" && userData.avatarUrl.trim().length > 5);

          if (!hasBio) return { completed: false, reason: "Veuillez ajouter une description / biographie à votre profil." };
          if (!hasPhone) return { completed: false, reason: "Veuillez renseigner votre numéro de téléphone." };
          if (!hasCommune) return { completed: false, reason: "Veuillez renseigner votre commune." };
          if (!hasAvatar) return { completed: false, reason: "Veuillez définir une photo de profil ou un avatar." };

          return { completed: true };
        }

        case "FIRST_GOMBO": {
          // Check if there's any gombo where createdBy == userId or organizerId == userId
          const gombosCol = collection(db, "gombos");
          const qCreated = query(gombosCol, where("createdBy", "==", userId));
          const snapCreated = await getDocs(qCreated);

          if (!snapCreated.empty) {
            return { completed: true };
          }
          return { completed: false, reason: "Vous n'avez pas encore publié de Gombo." };
        }

        case "PARTICIPATE": {
          // Check if there's any application or renfort application where userId or musicianId == userId
          const appsCol = collection(db, "applications");
          const qApps = query(appsCol, where("userId", "==", userId));
          const snapApps = await getDocs(qApps);

          if (!snapApps.empty) {
            return { completed: true };
          }

          const renfortAppsCol = collection(db, "renfortApplications");
          const qRenfortApps = query(renfortAppsCol, where("musicianId", "==", userId));
          const snapRenfortApps = await getDocs(qRenfortApps);

          if (!snapRenfortApps.empty) {
            return { completed: true };
          }

          return { completed: false, reason: "Vous n'avez pas encore postulé ou participé à une opportunité." };
        }

        case "LOGIN_3DAYS": {
          // Check if user has a login tracking count or standard usage
          const loginCount = userData.loginCount || userData.nbConnexions || 0;
          if (loginCount >= 3) {
            return { completed: true };
          }
          // Fallback: If they have been active enough (e.g. standard user doc existence with at least some fields)
          const createdAt = userData.createdAt ? new Date(userData.createdAt).getTime() : 0;
          const now = Date.now();
          const daysDiff = (now - createdAt) / (1000 * 60 * 60 * 24);
          if (daysDiff >= 2 || loginCount >= 2) {
            return { completed: true };
          }

          return { completed: false, reason: `Vous devez cumuler au moins 3 connexions distinctes (Actuellement : ${loginCount}/3).` };
        }

        case "SPECIAL": {
          // Always claimable for active platform events as long as the mission is enabled
          return { completed: true };
        }

        default:
          return { completed: false, reason: "Type de mission inconnu." };
      }
    } catch (err: any) {
      console.error("Error evaluating mission qualification:", err);
      return { completed: false, reason: err.message || "Erreur d'évaluation." };
    }
  }

  /**
   * ATOMIC TRANSACTION: Securely claims a mission reward Gawa for a user
   */
  static async claimMissionReward(
    userId: string,
    missionId: string
  ): Promise<{ success: boolean; error?: string; txId?: string; balanceAfterGawa?: number }> {
    if (!userId) return { success: false, error: "ID utilisateur manquant." };
    if (!missionId) return { success: false, error: "ID de mission manquant." };

    try {
      const userMissionId = `${userId}_${missionId}`;

      const result = await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", userId);
        const missionRef = doc(db, MISSIONS_COLLECTION, missionId);
        const userMissionRef = doc(db, USER_MISSIONS_COLLECTION, userMissionId);

        const userSnap = await transaction.get(userRef);
        const missionSnap = await transaction.get(missionRef);
        const userMissionSnap = await transaction.get(userMissionRef);

        if (!userSnap.exists()) {
          throw new Error("Compte utilisateur introuvable.");
        }
        if (!missionSnap.exists()) {
          throw new Error("Mission introuvable.");
        }
        if (userMissionSnap.exists()) {
          throw new Error("Cette mission a déjà été complétée et récompensée.");
        }

        const userData = userSnap.data();
        const missionData = missionSnap.data() as Mission;

        if (!missionData.enabled) {
          throw new Error("Cette mission est actuellement désactivée.");
        }

        // Handle temporal limits
        const now = new Date();
        if (missionData.startAt && new Date(missionData.startAt) > now) {
          throw new Error("Cette mission n'a pas encore commencé.");
        }
        if (missionData.endAt && new Date(missionData.endAt) < now) {
          throw new Error("Cette mission est expirée.");
        }

        // Handle max completions
        if (typeof missionData.maxCompletions === "number" && typeof missionData.currentCompletions === "number") {
          if (missionData.currentCompletions >= missionData.maxCompletions) {
            throw new Error("La limite maximale de participants pour cette mission est atteinte.");
          }
        }

        const rewardGawa = missionData.rewardGawa;
        if (rewardGawa <= 0) {
          throw new Error("Cette mission ne propose pas de récompense valide.");
        }

        // Calculate balances
        const currentGawa = typeof userData.gawaBalance === "number" 
          ? userData.gawaBalance 
          : (typeof userData.wallet?.soldeGawa === "number" ? userData.wallet.soldeGawa : 0);
        
        const newBalanceGawa = currentGawa + rewardGawa;

        const txId = `tx_gawa_mission_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        // 1. Create completed userMission doc (acts as unique constraint)
        const userMissionRecord: UserMission = {
          id: userMissionId,
          userId,
          missionId,
          completedAt: new Date().toISOString(),
          rewardGawa,
          status: "completed"
        };
        transaction.set(userMissionRef, userMissionRecord);

        // 2. Update user's Gawa balance atomically
        transaction.update(userRef, {
          gawaBalance: newBalanceGawa,
          "wallet.soldeGawa": newBalanceGawa,
          updatedAt: new Date().toISOString()
        });

        // 3. Increment current completions on mission
        const currentComps = typeof missionData.currentCompletions === "number" ? missionData.currentCompletions : 0;
        transaction.update(missionRef, {
          currentCompletions: currentComps + 1
        });

        // 4. Create record in Gawa history
        const txGawaRef = doc(db, GAWA_HISTORY_COLLECTION, txId);
        const gawaRecord: GawaHistoryRecord = {
          id: txId,
          userId,
          amount: rewardGawa,
          type: "MISSION",
          description: `Mission : "${missionData.title}" (+${rewardGawa} G)`,
          createdAt: new Date().toISOString(),
          source: "MISSIONS_GAWA",
          transactionId: txId
        };
        transaction.set(txGawaRef, gawaRecord);

        return {
          success: true,
          txId,
          balanceAfterGawa: newBalanceGawa
        };
      });

      return result;
    } catch (err: any) {
      console.error("MissionService.claimMissionReward error:", err);
      return { success: false, error: err.message || "Erreur lors de la réclamation du Gawa." };
    }
  }
}
