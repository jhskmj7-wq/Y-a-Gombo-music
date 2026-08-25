import { db } from "./firebase";
import { 
  collection, doc, onSnapshot, setDoc, updateDoc, getDoc, getDocs, query, where, orderBy, deleteDoc, runTransaction 
} from "firebase/firestore";
import { 
  AfriGomboWheel, WheelSegment, WheelSpinRecord, UserBoostRecord, UserExtraSpinRecord, WheelType, UserLotRecord, LotStatus 
} from "../types";
import { PaymentEngine } from "./paymentEngine";
import { SecurityService } from "./SecurityService";

const WHEELS_COLLECTION = "revenueFeatures_wheels";
const SPINS_COLLECTION = "wheelSpins";
const BOOSTS_COLLECTION = "userBoosts";
const EXTRA_SPINS_COLLECTION = "userExtraSpins";
const LOTS_COLLECTION = "userLots";

export const DEFAULT_WHEELS: AfriGomboWheel[] = [
  {
    id: "wheel_classique",
    name: "🎡 Roue Classique AFRIGOMBO",
    description: "Roue de fidélité accessible à tous les membres. Permet de gagner du Premium, des Boosts et des Boîtes Surprise.",
    type: "CLASSIQUE",
    enabled: true,
    cost: 20,
    currency: "GAWA",
    maxDailyParticipations: 3,
    maxParticipationsPerUser: 50,
    allowedAccountTypes: ["standard", "premium", "vip", "all"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com",
    rulesText: "Chaque tirage coûte 20 GAWA. Tentez votre chance pour remporter du Premium, des Boosts et des Boîtes Surprise.",
    segments: [
      { id: "c_1", label: "👑 Premium 3j", type: "PREMIUM_DAYS", rewardValue: 3, rewardDuration: 3, probability: 8, enabled: true, color: "#D4AF37", promoValueFCFA: 300, minAccountLevel: "all" },
      { id: "c_2", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 8, enabled: true, color: "#18181B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "c_3", label: "⚡ Boost 24h", type: "VISIBILITY_BOOST", rewardValue: "Boost 24h", rewardDuration: 1, probability: 8, enabled: true, color: "#F59E0B", promoValueFCFA: 150, minAccountLevel: "all" },
      { id: "c_4", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 7, enabled: true, color: "#09090B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "c_5", label: "🎁 Boîte Bronze", type: "SURPRISE_BOX", rewardValue: "Mystery Box Bronze", rewardDuration: 1, probability: 8, enabled: true, color: "#8B5CF6", promoValueFCFA: 300, minAccountLevel: "all" },
      { id: "c_6", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 7, enabled: true, color: "#18181B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "c_7", label: "⭐ Profil Vedette", type: "PROFILE_BOOST", rewardValue: "Profil 24h", rewardDuration: 1, probability: 8, enabled: true, color: "#EC4899", promoValueFCFA: 150, minAccountLevel: "all" },
      { id: "c_8", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 7, enabled: true, color: "#09090B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "c_9", label: "👑 Premium 1j", type: "PREMIUM_DAYS", rewardValue: 1, rewardDuration: 1, probability: 8, enabled: true, color: "#FBBF24", promoValueFCFA: 100, minAccountLevel: "all" },
      { id: "c_10", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 7, enabled: true, color: "#18181B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "c_11", label: "📈 Post 24h", type: "PUBLICATION_BOOST", rewardValue: "Post 24h", rewardDuration: 1, probability: 8, enabled: true, color: "#3B82F6", promoValueFCFA: 100, minAccountLevel: "all" },
      { id: "c_12", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 7, enabled: true, color: "#09090B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "c_13", label: "🎟️ Spin Offert", type: "EXTRA_SPIN", rewardValue: 1, probability: 10, enabled: true, color: "#10B981", promoValueFCFA: 200, minAccountLevel: "all" },
      { id: "c_14", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 9, enabled: true, color: "#18181B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "c_15", label: "⚡ Boost Visibilité 2j", type: "VISIBILITY_BOOST", rewardValue: "Boost Visibilité 2j", rewardDuration: 2, probability: 8, enabled: true, color: "#06B6D4", promoValueFCFA: 250, minAccountLevel: "all" },
      { id: "c_16", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 8, enabled: true, color: "#09090B", promoValueFCFA: 0, minAccountLevel: "all" }
    ]
  },
  {
    id: "wheel_elite",
    name: "👑 Roue Élite Prestige",
    description: "Roue haut de gamme offrant des périodes Premium prolongées, des boosts supérieurs et des boîtes surprise de prestige.",
    type: "ELITE",
    enabled: true,
    cost: 50,
    currency: "GAWA",
    maxDailyParticipations: 5,
    maxParticipationsPerUser: 100,
    allowedAccountTypes: ["standard", "premium", "vip", "all"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com",
    rulesText: "Chaque tirage coûte 50 GAWA. Récompenses plus élevées et boîtes surprise prestige.",
    segments: [
      { id: "p_1", label: "👑 Premium 7j", type: "PREMIUM_DAYS", rewardValue: 7, rewardDuration: 7, probability: 12, enabled: true, color: "#D4AF37", promoValueFCFA: 700, minAccountLevel: "all" },
      { id: "p_2", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 8, enabled: true, color: "#18181B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "p_3", label: "🚀 Super Boost 48h", type: "GOMBO_BOOST", rewardValue: "Super Boost", rewardDuration: 2, probability: 10, enabled: true, color: "#F59E0B", promoValueFCFA: 300, minAccountLevel: "all" },
      { id: "p_4", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 7, enabled: true, color: "#09090B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "p_5", label: "🎁 Boîte Élite", type: "SURPRISE_BOX", rewardValue: "Box Prestige", rewardDuration: 3, probability: 12, enabled: true, color: "#8B5CF6", promoValueFCFA: 500, minAccountLevel: "all" },
      { id: "p_6", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 7, enabled: true, color: "#18181B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "p_7", label: "⭐ Profil 48h", type: "PROFILE_BOOST", rewardValue: "Vedette 48h", rewardDuration: 2, probability: 10, enabled: true, color: "#EC4899", promoValueFCFA: 300, minAccountLevel: "all" },
      { id: "p_8", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 7, enabled: true, color: "#09090B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "p_9", label: "👑 Premium 3j", type: "PREMIUM_DAYS", rewardValue: 3, rewardDuration: 3, probability: 10, enabled: true, color: "#FBBF24", promoValueFCFA: 300, minAccountLevel: "all" },
      { id: "p_10", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 7, enabled: true, color: "#18181B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "p_11", label: "📢 Sponsoring 48h", type: "PUBLICATION_BOOST", rewardValue: "Sponsoring 48h", rewardDuration: 2, probability: 10, enabled: true, color: "#3B82F6", promoValueFCFA: 250, minAccountLevel: "all" },
      { id: "p_12", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 7, enabled: true, color: "#09090B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "p_13", label: "🎟️ 2 Spins Élite", type: "EXTRA_SPIN", rewardValue: 2, probability: 10, enabled: true, color: "#10B981", promoValueFCFA: 500, minAccountLevel: "all" },
      { id: "p_14", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 8, enabled: true, color: "#18181B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "p_15", label: "💰 +50 Gawa Bonus", type: "GAWA_POINTS", rewardValue: 50, probability: 8, enabled: true, color: "#06B6D4", promoValueFCFA: 500, minAccountLevel: "all" },
      { id: "p_16", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 8, enabled: true, color: "#09090B", promoValueFCFA: 0, minAccountLevel: "all" }
    ]
  },
  {
    id: "wheel_premium",
    name: "💎 Roue Premium Souveraine",
    description: "Le sommet du privilège commercial AFRIGOMBO. Récompenses d'élite garanties et boîtes surprise souveraines.",
    type: "PREMIUM",
    enabled: true,
    cost: 100,
    currency: "GAWA",
    maxDailyParticipations: 10,
    maxParticipationsPerUser: 200,
    allowedAccountTypes: ["standard", "premium", "vip", "all"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com",
    rulesText: "Tirage souverain à 100 GAWA. Récompenses majeures de haut niveau et boîtes surprise d'élite.",
    segments: [
      { id: "e_1", label: "🏆 Premium 15j", type: "PREMIUM_DAYS", rewardValue: 15, rewardDuration: 15, probability: 15, enabled: true, color: "#D4AF37", promoValueFCFA: 1200, minAccountLevel: "all" },
      { id: "e_2", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 10, enabled: true, color: "#18181B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "e_3", label: "🚀 Super Gombo 72h", type: "GOMBO_BOOST", rewardValue: "Gombo Élite", rewardDuration: 3, probability: 15, enabled: true, color: "#F59E0B", promoValueFCFA: 600, minAccountLevel: "all" },
      { id: "e_4", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 5, enabled: true, color: "#09090B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "e_5", label: "🎁 Boîte Souveraine", type: "SURPRISE_BOX", rewardValue: "Box Souveraine", rewardDuration: 5, probability: 15, enabled: true, color: "#8B5CF6", promoValueFCFA: 900, minAccountLevel: "all" },
      { id: "e_6", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 5, enabled: true, color: "#18181B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "e_7", label: "⭐ Vedette 72h", type: "PROFILE_BOOST", rewardValue: "Vedette 72h", rewardDuration: 3, probability: 15, enabled: true, color: "#EC4899", promoValueFCFA: 700, minAccountLevel: "all" },
      { id: "e_8", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 5, enabled: true, color: "#09090B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "e_9", label: "👑 Premium 7j", type: "PREMIUM_DAYS", rewardValue: 7, rewardDuration: 7, probability: 15, enabled: true, color: "#FBBF24", promoValueFCFA: 700, minAccountLevel: "all" },
      { id: "e_10", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 5, enabled: true, color: "#18181B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "e_11", label: "🌍 National 5j", type: "VISIBILITY_BOOST", rewardValue: "National 5j", rewardDuration: 5, probability: 15, enabled: true, color: "#3B82F6", promoValueFCFA: 800, minAccountLevel: "all" },
      { id: "e_12", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 5, enabled: true, color: "#09090B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "e_13", label: "🎟️ 3 Spins Souverains", type: "EXTRA_SPIN", rewardValue: 3, probability: 10, enabled: true, color: "#10B981", promoValueFCFA: 1000, minAccountLevel: "all" },
      { id: "e_14", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 5, enabled: true, color: "#18181B", promoValueFCFA: 0, minAccountLevel: "all" },
      { id: "e_15", label: "🎟️ 1 Spin Souverain", type: "EXTRA_SPIN", rewardValue: 1, probability: 10, enabled: true, color: "#06B6D4", promoValueFCFA: 500, minAccountLevel: "all" },
      { id: "e_16", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 5, enabled: true, color: "#09090B", promoValueFCFA: 0, minAccountLevel: "all" }
    ]
  }
];

export class WheelEngineService {
  /**
   * Subscribe to wheels collection in real time
   */
  static subscribeWheels(callback: (wheels: AfriGomboWheel[]) => void): () => void {
    const colRef = collection(db, WHEELS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          // Initialize default wheels automatically
          this.initializeDefaultWheels().then(() => {
            callback(DEFAULT_WHEELS);
          });
          return;
        }
        const wheels: AfriGomboWheel[] = [];
        snapshot.forEach((docSnap) => {
          const w = docSnap.data() as AfriGomboWheel;
          let normalizedCost = w.cost;
          let needsUpdate = false;

          if (w.currency !== "GAWA" || w.cost >= 200) {
            needsUpdate = true;
            if (w.id === "wheel_classique" || w.cost === 200) normalizedCost = 20;
            else if (w.id === "wheel_elite" || w.cost === 300) normalizedCost = 50;
            else if (w.id === "wheel_premium" || w.cost === 500) normalizedCost = 100;
            else normalizedCost = Math.max(1, Math.round(w.cost / 10));
          }

          const cleanWheel: AfriGomboWheel = {
            ...w,
            cost: normalizedCost,
            currency: "GAWA"
          };
          wheels.push(cleanWheel);

          if (needsUpdate) {
            updateDoc(doc(db, WHEELS_COLLECTION, w.id), { 
              cost: normalizedCost, 
              currency: "GAWA",
              updatedAt: new Date().toISOString()
            }).catch(e => console.warn("Failed to normalize wheel currency in Firestore:", e));
          }
        });

        // Ensure Classique, Elite, Premium sort order
        wheels.sort((a, b) => a.cost - b.cost);

        callback(wheels);
      },
      (err) => {
        console.error("Error subscribing wheels:", err);
        callback(DEFAULT_WHEELS);
      }
    );
  }

  /**
   * Seed default wheels into Firestore if missing
   */
  static async initializeDefaultWheels(): Promise<void> {
    try {
      const colRef = collection(db, WHEELS_COLLECTION);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) return;

      for (const wheel of DEFAULT_WHEELS) {
        const docRef = doc(db, WHEELS_COLLECTION, wheel.id);
        await setDoc(docRef, wheel, { merge: true });
      }
      console.log("Initialized default wheels successfully.");
    } catch (err) {
      console.error("Error initializing default wheels:", err);
    }
  }

  /**
   * Fetch single wheel by ID
   */
  static async getWheelById(wheelId: string): Promise<AfriGomboWheel | null> {
    try {
      const docRef = doc(db, WHEELS_COLLECTION, wheelId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as AfriGomboWheel;
      }
      // Fallback search in defaults
      return DEFAULT_WHEELS.find((w) => w.id === wheelId) || null;
    } catch (err) {
      console.error("Error fetching wheel:", err);
      return DEFAULT_WHEELS.find((w) => w.id === wheelId) || null;
    }
  }

  /**
   * Save or update wheel configuration in Firestore with versioning
   */
  static async saveWheel(wheel: AfriGomboWheel, updatedBy = "jhs.kmj7@gmail.com"): Promise<void> {
    const docRef = doc(db, WHEELS_COLLECTION, wheel.id);
    const newVersion = (wheel.version || 0) + 1;
    const payload: AfriGomboWheel = {
      ...wheel,
      version: newVersion,
      updatedAt: new Date().toISOString(),
      updatedBy,
      createdBy: wheel.createdBy || updatedBy
    };
    await setDoc(docRef, payload, { merge: true });
  }

  /**
   * Toggle wheel enabled status
   */
  static async toggleWheelEnabled(wheelId: string, enabled: boolean, updatedBy = "jhs.kmj7@gmail.com"): Promise<void> {
    const docRef = doc(db, WHEELS_COLLECTION, wheelId);
    await updateDoc(docRef, {
      enabled,
      updatedAt: new Date().toISOString(),
      updatedBy
    });
  }

  /**
   * Delete a wheel configuration
   */
  static async deleteWheel(wheelId: string): Promise<void> {
    const docRef = doc(db, WHEELS_COLLECTION, wheelId);
    await deleteDoc(docRef);
  }

  /**
   * Update wheel price with atomic version increment and audit logging
   */
  static async updateWheelPrice(
    wheelId: string, 
    oldPrice: number, 
    newPrice: number, 
    adminId: string = "Fondateur"
  ): Promise<void> {
    const docRef = doc(db, WHEELS_COLLECTION, wheelId);
    const snap = await getDoc(docRef);
    const currentVersion = snap.exists() ? (snap.data().version || 0) : 0;

    // 1. Update the official price dynamically in Firestore
    await updateDoc(docRef, {
      cost: newPrice,
      version: currentVersion + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: adminId
    });

    // 2. Append history log document securely
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const logRef = doc(db, "wheelPriceHistory", logId);
    await setDoc(logRef, {
      logId,
      wheelId,
      oldPrice,
      newPrice,
      adminId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Subscribe to real-time price change history logs
   */
  static subscribeWheelPriceHistory(callback: (logs: any[]) => void): () => void {
    const colRef = collection(db, "wheelPriceHistory");
    return onSnapshot(
      colRef,
      (snapshot) => {
        const logs: any[] = [];
        snapshot.forEach((docSnap) => {
          logs.push(docSnap.data());
        });
        // Sort descending by timestamp
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(logs);
      },
      (err) => {
        console.error("Error subscribing price history:", err);
        callback([]);
      }
    );
  }

  /**
   * Validate wheel segment probabilities strictly (must sum to 100%, no negative, valid rewards)
   */
  static validateWheelProbabilities(segments: WheelSegment[]): { 
    isValid: boolean; 
    totalProbability: number; 
    enabledCount: number; 
    error?: string 
  } {
    if (!segments || segments.length === 0) {
      return {
        isValid: false,
        totalProbability: 0,
        enabledCount: 0,
        error: "Roue sans segments configurés."
      };
    }

    // Check for negative probabilities
    for (const s of segments) {
      const prob = Number(s.probability);
      if (isNaN(prob) || prob < 0) {
        return {
          isValid: false,
          totalProbability: 0,
          enabledCount: 0,
          error: `Le segment "${s.label || 'Sans nom'}" possède une probabilité négative ou invalide (${s.probability}).`
        };
      }
    }

    const activeSegments = segments.filter((s) => s.enabled);
    if (activeSegments.length === 0) {
      return {
        isValid: false,
        totalProbability: 0,
        enabledCount: 0,
        error: "Aucun segment actif configuré pour cette roue."
      };
    }

    // Check if any active segment lacks a label or valid reward type
    for (const s of activeSegments) {
      if (!s.label || !s.label.trim()) {
        return {
          isValid: false,
          totalProbability: 0,
          enabledCount: activeSegments.length,
          error: "Un segment actif n'a pas de libellé/nom valide."
        };
      }
      if (!s.type) {
        return {
          isValid: false,
          totalProbability: 0,
          enabledCount: activeSegments.length,
          error: `Le segment "${s.label}" n'a aucun type de récompense sélectionné.`
        };
      }
    }

    const totalProbability = activeSegments.reduce((sum, s) => sum + (Number(s.probability) || 0), 0);
    const roundedTotal = Math.round(totalProbability * 100) / 100;

    if (Math.abs(roundedTotal - 100) > 0.01) {
      return {
        isValid: false,
        totalProbability: roundedTotal,
        enabledCount: activeSegments.length,
        error: `La somme des probabilités est de ${roundedTotal} %. Elle doit être exactement égale à 100 %.`
      };
    }

    return {
      isValid: true,
      totalProbability: 100,
      enabledCount: activeSegments.length
    };
  }

  /**
   * Determine wheel configuration status badge (🟢 Valide, 🟠 Incomplète, 🔴 Invalide)
   */
  static getWheelConfigStatus(wheel: AfriGomboWheel): {
    code: "VALID" | "INCOMPLETE" | "INVALID";
    label: string;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    message: string;
  } {
    if (!wheel) {
      return {
        code: "INVALID",
        label: "Configuration invalide",
        colorClass: "text-rose-400",
        bgClass: "bg-rose-500/10",
        borderClass: "border-rose-500/30",
        message: "Roue inexistante"
      };
    }

    if (wheel.cost < 0) {
      return {
        code: "INVALID",
        label: "Configuration invalide",
        colorClass: "text-rose-400",
        bgClass: "bg-rose-500/10",
        borderClass: "border-rose-500/30",
        message: "Prix du tirage invalide (négatif)"
      };
    }

    const probVal = this.validateWheelProbabilities(wheel.segments);
    if (!probVal.isValid) {
      if (probVal.enabledCount > 0 && probVal.totalProbability > 0 && probVal.totalProbability !== 100) {
        return {
          code: "INCOMPLETE",
          label: "Configuration incomplète",
          colorClass: "text-amber-400",
          bgClass: "bg-amber-500/10",
          borderClass: "border-amber-500/30",
          message: probVal.error || `Somme = ${probVal.totalProbability}%`
        };
      }
      return {
        code: "INVALID",
        label: "Configuration invalide",
        colorClass: "text-rose-400",
        bgClass: "bg-rose-500/10",
        borderClass: "border-rose-500/30",
        message: probVal.error || "Problème de segments"
      };
    }

    return {
      code: "VALID",
      label: "Configuration valide",
      colorClass: "text-emerald-400",
      bgClass: "bg-emerald-500/10",
      borderClass: "border-emerald-500/30",
      message: "Roue conforme à 100%"
    };
  }

  /**
   * Pick winning segment deterministically using weighted random sampling
   * Returns both the segment object AND its exact index in the original segments array
   */
  static pickWinningSegment(segments: WheelSegment[]): { segment: WheelSegment; index: number } {
    const originalSegments = segments || [];
    // Pair each segment with its original index
    const indexedSegments = originalSegments.map((s, idx) => ({ segment: s, index: idx }));
    const activeIndexedSegments = indexedSegments.filter((item) => item.segment.enabled);

    if (activeIndexedSegments.length === 0) {
      return { 
        segment: originalSegments[0] || { id: "default", label: "Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 100, enabled: true, color: "#18181B" }, 
        index: 0 
      };
    }

    const totalWeight = activeIndexedSegments.reduce((sum, item) => sum + (Number(item.segment.probability) || 0), 0);
    
    let rand = Math.random() * totalWeight;
    for (const item of activeIndexedSegments) {
      const weight = Number(item.segment.probability) || 0;
      if (rand <= weight) {
        return item;
      }
      rand -= weight;
    }
    return activeIndexedSegments[0];
  }

  /**
   * Execute Wheel Spin for user safely with financial debit and reward attribution
   */
  static async spinWheel(params: {
    userId: string;
    userName?: string;
    userAccountType?: string;
    wheelId: string;
    isFounder?: boolean;
  }): Promise<{
    success: boolean;
    winningSegment?: WheelSegment;
    winningSegmentIndex?: number;
    spinRecord?: WheelSpinRecord;
    balanceAfter?: number;
    insufficientGawa?: boolean;
    missingGawa?: number;
    currentGawa?: number;
    requiredGawa?: number;
    error?: string;
  }> {
    const { userId, userName = "Membre Gombo", userAccountType = "standard", wheelId, isFounder = false } = params;

    if (!userId) {
      return { success: false, error: "Identifiant utilisateur requis pour jouer." };
    }

    // 0. CHECK GLOBAL DEPLOYMENT CENTER FEATURE FLAG (wheel)
    const isRealFounder = isFounder || SecurityService.isFounder(userId);
    try {
      const sysConfigRef = doc(db, "systemConfig", "features");
      const sysConfigSnap = await getDoc(sysConfigRef);
      if (sysConfigSnap.exists()) {
        const sysFlags = sysConfigSnap.data();
        const wheelFlag = sysFlags["wheel"];
        if (wheelFlag && wheelFlag.enabled === false && !isRealFounder) {
          return {
            success: false,
            error: "🎡 Roue temporairement indisponible"
          };
        }
      }
    } catch (err) {
      console.warn("Could not verify global feature flag in spinWheel:", err);
    }

    // 1. Fetch Wheel
    const wheel = await this.getWheelById(wheelId);
    if (!wheel) {
      return { success: false, error: "Roue introuvable." };
    }

    // 2. Check Local Activation
    if (!wheel.enabled && !isRealFounder) {
      return { success: false, error: "Cette roue est actuellement désactivée." };
    }

    // 3. Check Segment Probabilities
    const probVal = this.validateWheelProbabilities(wheel.segments);
    if (!probVal.isValid) {
      return { success: false, error: `Configuration invalide : ${probVal.error}` };
    }

    // 4. Check User Participation Limits
    const todayISO = new Date().toISOString().substring(0, 10);
    let todaySpinsCount = 0;
    let totalUserSpinsCount = 0;

    try {
      const spinsQuery = query(
        collection(db, SPINS_COLLECTION),
        where("userId", "==", userId),
        where("wheelId", "==", wheelId)
      );
      const spinsSnap = await getDocs(spinsQuery);
      
      spinsSnap.forEach((docSnap) => {
        const data = docSnap.data() as WheelSpinRecord;
        if (data.status === "SUCCESS") {
          totalUserSpinsCount++;
          if (data.createdAt && data.createdAt.substring(0, 10) === todayISO) {
            todaySpinsCount++;
          }
        }
      });
    } catch (err) {
      console.warn("Could not query previous spins, proceeding with caution:", err);
    }

    if (wheel.maxDailyParticipations > 0 && todaySpinsCount >= wheel.maxDailyParticipations && !isFounder) {
      return { 
        success: false, 
        error: `Limite quotidienne de ${wheel.maxDailyParticipations} tirage(s) atteinte pour aujourd'hui. Revenez demain !` 
      };
    }

    if (wheel.maxParticipationsPerUser > 0 && totalUserSpinsCount >= wheel.maxParticipationsPerUser && !isFounder) {
      return { 
        success: false, 
        error: `Limite maximale de ${wheel.maxParticipationsPerUser} participations atteinte pour cette roue.` 
      };
    }

    // 5. Check for available Extra Spin Token (Free Spin)
    let extraSpinTokenId: string | null = null;
    try {
      const extraSpinsQuery = query(
        collection(db, EXTRA_SPINS_COLLECTION),
        where("userId", "==", userId),
        where("used", "==", false)
      );
      const extraSpinsSnap = await getDocs(extraSpinsQuery);
      if (!extraSpinsSnap.empty) {
        extraSpinTokenId = extraSpinsSnap.docs[0].id;
      }
    } catch (e) {
      console.warn("Error checking extra spins:", e);
    }

    const useExtraSpin = !!extraSpinTokenId;
    const finalCost = useExtraSpin ? 0 : wheel.cost;

    // 6. Financial Debit in GAWA (Atomic Transaction)
    let balanceAfter: number | undefined;
    if (finalCost > 0) {
      try {
        const debitResult = await runTransaction(db, async (transaction) => {
          const userRef = doc(db, "users", userId);
          const userSnap = await transaction.get(userRef);

          if (!userSnap.exists()) {
            throw new Error("Compte utilisateur introuvable.");
          }

          const uData = userSnap.data();
          const currentGawa = typeof uData.gawaBalance === "number"
            ? uData.gawaBalance
            : (typeof uData.wallet?.soldeGawa === "number" ? uData.wallet.soldeGawa : 0);

          if (currentGawa < finalCost) {
            const missingGawa = finalCost - currentGawa;
            return {
              success: false,
              insufficientGawa: true,
              missingGawa,
              currentGawa,
              requiredGawa: finalCost,
              error: `Gawa insuffisants. Il vous manque ${missingGawa} GAWA pour effectuer ce tirage.`
            };
          }

          const newGawa = currentGawa - finalCost;

          // 1. Update user document atomically
          transaction.update(userRef, {
            gawaBalance: newGawa,
            "wallet.soldeGawa": newGawa,
            updatedAt: new Date().toISOString()
          });

          // 2. Add transaction log to gawaHistory
          const gawaTxId = `tx_gawa_spin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const gawaTxRef = doc(db, "gawaHistory", gawaTxId);
          transaction.set(gawaTxRef, {
            id: gawaTxId,
            userId,
            uid: userId,
            amount: -finalCost,
            gawaAmount: -finalCost,
            type: "wheel_spin",
            description: `Tirage de la ${wheel.name} (-${finalCost} GAWA)`,
            createdAt: new Date().toISOString(),
            date: new Date().toLocaleDateString("fr-FR"),
            heure: new Date().toLocaleTimeString("fr-FR"),
            source: "AFRIGOMBO_WHEEL"
          });

          return { success: true, newGawa };
        });

        if (!debitResult.success) {
          return {
            success: false,
            insufficientGawa: debitResult.insufficientGawa,
            missingGawa: debitResult.missingGawa,
            currentGawa: debitResult.currentGawa,
            requiredGawa: debitResult.requiredGawa,
            error: debitResult.error || "Solde Gawa insuffisant."
          };
        }

        balanceAfter = debitResult.newGawa;
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || "Erreur lors du débit des GAWA."
        };
      }
    }

    // 7. Consume Extra Spin Token if used
    if (extraSpinTokenId) {
      try {
        const tokenRef = doc(db, EXTRA_SPINS_COLLECTION, extraSpinTokenId);
        await updateDoc(tokenRef, {
          used: true,
          usedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error("Error consuming extra spin token:", e);
      }
    }

    // 8. Deterministic Winning Segment Pick (with exact index)
    const { segment: winningSegment, index: winningSegmentIndex } = this.pickWinningSegment(wheel.segments);
    const spinId = `spin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowISO = new Date().toISOString();

    // 9. Grant Reward
    await this.grantReward({
      userId,
      segment: winningSegment,
      wheel,
      spinId
    });

    // 10. Record Spin History
    const spinRecord: WheelSpinRecord = {
      spinId,
      userId,
      userName,
      userAccountType,
      wheelId: wheel.id,
      wheelType: wheel.type,
      cost: finalCost,
      currency: "GAWA",
      rewardType: winningSegment.type,
      rewardLabel: winningSegment.label,
      rewardValue: winningSegment.rewardValue,
      rewardDuration: winningSegment.rewardDuration || 0,
      createdAt: nowISO,
      status: "SUCCESS",
      isExtraSpinUsed: useExtraSpin
    };

    try {
      const spinDocRef = doc(db, SPINS_COLLECTION, spinId);
      await setDoc(spinDocRef, spinRecord);
    } catch (err) {
      console.error("Error saving spin record to Firestore:", err);
    }

    return {
      success: true,
      winningSegment,
      winningSegmentIndex,
      spinRecord,
      balanceAfter
    };
  }

  /**
   * Intelligently grant reward by creating a User Lot record in Firestore
   */
  private static async grantReward(params: {
    userId: string;
    segment: WheelSegment;
    wheel: AfriGomboWheel;
    spinId: string;
  }): Promise<void> {
    const { userId, segment, spinId, wheel } = params;
    const nowISO = new Date().toISOString();

    if (!segment.type || segment.type === "NO_REWARD") return;

    try {
      const lotId = `lot_${spinId}`;
      const lotRef = doc(db, LOTS_COLLECTION, lotId);
      const lotRecord: UserLotRecord = {
        id: lotId,
        spinId,
        userId,
        rewardType: segment.type,
        rewardLabel: segment.label,
        rewardValue: segment.rewardValue,
        rewardDuration: segment.rewardDuration || 1,
        status: "AVAILABLE",
        createdAt: nowISO,
        wheelName: wheel?.name || "Roue AfriGombo"
      };
      await setDoc(lotRef, lotRecord);
      console.log(`Saved won lot ${lotId} to userLots with status AVAILABLE for user ${userId}.`);
    } catch (err) {
      console.error("Error saving won lot to userLots collection:", err);
    }
  }

  /**
   * Subscribe to real-time user lots from Firestore (with automatic legacy spins sync)
   */
  static subscribeUserLots(userId: string, callback: (lots: UserLotRecord[]) => void): () => void {
    if (!userId) {
      callback([]);
      return () => {};
    }

    const colRef = collection(db, LOTS_COLLECTION);
    const q = query(colRef, where("userId", "==", userId));

    return onSnapshot(
      q,
      async (snapshot) => {
        const lots: UserLotRecord[] = [];
        const existingSpinIds = new Set<string>();

        snapshot.forEach((docSnap) => {
          const lot = docSnap.data() as UserLotRecord;
          // Dynamically verify expiration for activated lots
          if (lot.status === "ACTIVATED" && lot.expiresAt) {
            if (new Date(lot.expiresAt).getTime() < Date.now()) {
              lot.status = "EXPIRED";
              updateDoc(doc(db, LOTS_COLLECTION, lot.id), { status: "EXPIRED" }).catch(() => {});
            }
          }
          lots.push(lot);
          if (lot.spinId) existingSpinIds.add(lot.spinId);
        });

        // Also check if user has previous winning wheelSpins not yet in userLots
        try {
          const spinsQuery = query(
            collection(db, SPINS_COLLECTION),
            where("userId", "==", userId)
          );
          const spinSnaps = await getDocs(spinsQuery);

          spinSnaps.forEach((spinDoc) => {
            const spin = spinDoc.data() as WheelSpinRecord;
            if (spin.rewardType && spin.rewardType !== "NO_REWARD" && !existingSpinIds.has(spin.spinId)) {
              const lotId = `lot_${spin.spinId}`;
              const newLot: UserLotRecord = {
                id: lotId,
                spinId: spin.spinId,
                userId: spin.userId,
                rewardType: spin.rewardType,
                rewardLabel: spin.rewardLabel || "Récompense Roue",
                rewardValue: spin.rewardValue,
                rewardDuration: spin.rewardDuration || 1,
                status: "AVAILABLE",
                createdAt: spin.createdAt || new Date().toISOString(),
                wheelName: spin.wheelType ? `Roue ${spin.wheelType}` : "Roue AfriGombo"
              };
              setDoc(doc(db, LOTS_COLLECTION, lotId), newLot).catch(() => {});
              lots.push(newLot);
            }
          });
        } catch (e) {
          // Ignore legacy sync check error
        }

        // Sort descending by creation date
        lots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(lots);
      },
      (err) => {
        console.error("Error subscribing user lots:", err);
        callback([]);
      }
    );
  }

  /**
   * Real Activation of a Lot in Firestore
   */
  static async activateUserLot(params: {
    lotId: string;
    userId: string;
  }): Promise<{ success: boolean; message?: string }> {
    const { lotId, userId } = params;
    if (!lotId || !userId) {
      return { success: false, message: "Données de requête invalides." };
    }

    try {
      const lotRef = doc(db, LOTS_COLLECTION, lotId);
      const lotSnap = await getDoc(lotRef);

      if (!lotSnap.exists()) {
        return { success: false, message: "Ce lot n'existe pas dans votre compte." };
      }

      const lot = lotSnap.data() as UserLotRecord;

      if (lot.userId !== userId) {
        return { success: false, message: "Non autorisé: ce lot appartient à un autre compte." };
      }

      if (lot.status !== "AVAILABLE") {
        if (lot.status === "ACTIVATED") {
          return { success: false, message: "Ce lot a déjà été activé." };
        }
        if (lot.status === "EXPIRED") {
          return { success: false, message: "Ce lot est expiré." };
        }
        return { success: false, message: "Ce lot n'est pas disponible pour activation." };
      }

      // Check if lot expiration has passed before activation
      if (lot.expiresAt && new Date(lot.expiresAt).getTime() < Date.now()) {
        await updateDoc(lotRef, { status: "EXPIRED" });
        return { success: false, message: "Ce lot a expiré et ne peut plus être activé." };
      }

      const nowISO = new Date().toISOString();
      const rewardType = lot.rewardType;

      if (
        rewardType === "PREMIUM_DAYS" || 
        rewardType === "PREMIUM_CODE" || 
        rewardType === "SURPRISE_BOX"
      ) {
        // Real Premium Activation on User Profile in Firestore
        let daysToAdd = Number(lot.rewardValue) || lot.rewardDuration || 7;
        if (rewardType === "SURPRISE_BOX") {
          daysToAdd = 7;
        }

        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        let currentExpTime = Date.now();
        if (userSnap.exists()) {
          const uData = userSnap.data();
          if (uData.premiumExpiresAt) {
            const parsed = new Date(uData.premiumExpiresAt).getTime();
            if (parsed > currentExpTime) {
              currentExpTime = parsed; // Stack duration seamlessly
            }
          }
        }

        const newExpTime = currentExpTime + daysToAdd * 24 * 60 * 60 * 1000;
        const newExpISO = new Date(newExpTime).toISOString();

        await updateDoc(userRef, {
          isPremium: true,
          accountType: "premium",
          premiumExpiresAt: newExpISO,
          updatedAt: nowISO
        });

        await updateDoc(lotRef, {
          status: "ACTIVATED",
          activatedAt: nowISO,
          expiresAt: newExpISO
        });

      } else if (
        rewardType === "VISIBILITY_BOOST" ||
        rewardType === "GOMBO_BOOST" ||
        rewardType === "PROFILE_BOOST" ||
        rewardType === "PUBLICATION_BOOST" ||
        rewardType === "PREMIUM_BOOST"
      ) {
        // Real Boost Activation
        const durationDays = Number(lot.rewardDuration) || 1;
        const startAt = nowISO;
        const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

        const boostId = `boost_${lotId}`;
        const boostRef = doc(db, BOOSTS_COLLECTION, boostId);
        const boostRecord: UserBoostRecord = {
          id: boostId,
          userId,
          type: rewardType,
          startAt,
          expiresAt,
          source: "wheel_reward",
          status: "ACTIVE",
          durationDays,
          createdAt: nowISO
        };

        await setDoc(boostRef, boostRecord);

        // Update user profile to mark active boost flag
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          isBoosted: true,
          boostExpiresAt: expiresAt,
          updatedAt: nowISO
        }).catch(() => {});

        await updateDoc(lotRef, {
          status: "ACTIVATED",
          activatedAt: nowISO,
          expiresAt
        });

      } else if (rewardType === "EXTRA_SPIN") {
        // Extra Spin Activation
        const count = Number(lot.rewardValue) || 1;
        for (let i = 0; i < count; i++) {
          const tokenId = `extra_${lotId}_${i}`;
          const tokenRef = doc(db, EXTRA_SPINS_COLLECTION, tokenId);
          const extraRecord: UserExtraSpinRecord = {
            id: tokenId,
            userId,
            source: "wheel_reward",
            used: false,
            createdAt: nowISO
          };
          await setDoc(tokenRef, extraRecord);
        }

        await updateDoc(lotRef, {
          status: "ACTIVATED",
          activatedAt: nowISO
        });

      } else if (rewardType === "GAWA_POINTS") {
        // Direct GAWA Bonus Credit on User Wallet and History
        const gawaToAdd = Number(lot.rewardValue) || 50;
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        let currentGawa = 0;
        if (userSnap.exists()) {
          const uData = userSnap.data();
          currentGawa = typeof uData.gawaBalance === "number"
            ? uData.gawaBalance
            : (typeof uData.wallet?.soldeGawa === "number" ? uData.wallet.soldeGawa : 0);
        }

        const newGawa = currentGawa + gawaToAdd;
        await updateDoc(userRef, {
          gawaBalance: newGawa,
          "wallet.soldeGawa": newGawa,
          updatedAt: nowISO
        });

        // Add transaction log in gawaHistory
        const gawaTxId = `tx_gawa_reward_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const gawaTxRef = doc(db, "gawaHistory", gawaTxId);
        await setDoc(gawaTxRef, {
          id: gawaTxId,
          userId,
          uid: userId,
          amount: gawaToAdd,
          gawaAmount: gawaToAdd,
          type: "wheel_reward",
          description: `Gain Roue Élite (+${gawaToAdd} GAWA Bonus)`,
          createdAt: nowISO,
          date: new Date().toLocaleDateString("fr-FR"),
          heure: new Date().toLocaleTimeString("fr-FR"),
          source: "AFRIGOMBO_WHEEL"
        });

        await updateDoc(lotRef, {
          status: "ACTIVATED",
          activatedAt: nowISO
        });

      } else {
        // Generic Lot Activation
        await updateDoc(lotRef, {
          status: "ACTIVATED",
          activatedAt: nowISO
        });
      }

      return { success: true };
    } catch (err: any) {
      console.error("Error activating user lot:", err);
      return { success: false, message: err?.message || "Erreur lors de l'activation du lot." };
    }
  }

  /**
   * Subscribe to real-time spin history for Admin Dashboard
   */
  static subscribeSpinHistory(callback: (spins: WheelSpinRecord[]) => void): () => void {
    const colRef = collection(db, SPINS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const spins: WheelSpinRecord[] = [];
        snapshot.forEach((docSnap) => {
          spins.push(docSnap.data() as WheelSpinRecord);
        });
        // Sort descending by date
        spins.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(spins);
      },
      (err) => {
        console.error("Error subscribing spin history:", err);
        callback([]);
      }
    );
  }

  /**
   * Subscribe to real-time spin history for a SPECIFIC USER ONLY
   */
  static subscribeUserSpinHistory(userId: string, callback: (spins: WheelSpinRecord[]) => void): () => void {
    if (!userId) {
      callback([]);
      return () => {};
    }
    const colRef = collection(db, SPINS_COLLECTION);
    const q = query(colRef, where("userId", "==", userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const spins: WheelSpinRecord[] = [];
        snapshot.forEach((docSnap) => {
          spins.push(docSnap.data() as WheelSpinRecord);
        });
        spins.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(spins);
      },
      (err) => {
        console.error("Error subscribing user spin history:", err);
        callback([]);
      }
    );
  }

  /**
   * Subscribe to unused extra spin tokens for a SPECIFIC USER ONLY
   */
  static subscribeUserExtraSpins(userId: string, callback: (tokens: UserExtraSpinRecord[]) => void): () => void {
    if (!userId) {
      callback([]);
      return () => {};
    }
    const colRef = collection(db, EXTRA_SPINS_COLLECTION);
    const q = query(colRef, where("userId", "==", userId), where("used", "==", false));
    return onSnapshot(
      q,
      (snapshot) => {
        const tokens: UserExtraSpinRecord[] = [];
        snapshot.forEach((docSnap) => {
          tokens.push(docSnap.data() as UserExtraSpinRecord);
        });
        callback(tokens);
      },
      (err) => {
        console.error("Error subscribing user extra spins:", err);
        callback([]);
      }
    );
  }

  /**
   * Calculate real statistics from real Firestore spin records
   */
  static calculateRealStats(spins: WheelSpinRecord[]) {
    const todayISO = new Date().toISOString().substring(0, 10);
    const totalParticipations = spins.length;
    
    let todayParticipations = 0;
    let totalRevenueFCFA = 0;
    let rewardsDistributedCount = 0;
    
    const rewardTypeCounts: Record<string, number> = {};
    const uniqueUserIds = new Set<string>();
    let standardUsersCount = 0;
    let premiumUsersCount = 0;

    spins.forEach((s) => {
      if (s.createdAt && s.createdAt.substring(0, 10) === todayISO) {
        todayParticipations++;
      }
      totalRevenueFCFA += Number(s.cost) || 0;
      
      if (s.rewardType && s.rewardType !== "NO_REWARD") {
        rewardsDistributedCount++;
        rewardTypeCounts[s.rewardLabel || s.rewardType] = (rewardTypeCounts[s.rewardLabel || s.rewardType] || 0) + 1;
      }

      if (s.userId) {
        if (!uniqueUserIds.has(s.userId)) {
          uniqueUserIds.add(s.userId);
          if (s.userAccountType === "premium") {
            premiumUsersCount++;
          } else {
            standardUsersCount++;
          }
        }
      }
    });

    let topRewardLabel = "Aucune";
    let topRewardCount = 0;
    Object.entries(rewardTypeCounts).forEach(([label, count]) => {
      if (count > topRewardCount) {
        topRewardCount = count;
        topRewardLabel = label;
      }
    });

    return {
      totalParticipations,
      todayParticipations,
      totalRevenueFCFA,
      rewardsDistributedCount,
      topRewardLabel,
      topRewardCount,
      totalUniqueUsers: uniqueUserIds.size,
      standardUsersCount,
      premiumUsersCount
    };
  }
}
