import { db } from "../firebase";
import { 
  collection, doc, onSnapshot, setDoc, updateDoc, getDoc, getDocs, query, where, orderBy, deleteDoc 
} from "firebase/firestore";
import { 
  AfriGomboWheel, WheelSegment, WheelSpinRecord, UserBoostRecord, UserExtraSpinRecord, WheelType 
} from "../types";
import { PaymentEngine } from "./paymentEngine";
import { SecurityService } from "./SecurityService";

const WHEELS_COLLECTION = "revenueFeatures_wheels";
const SPINS_COLLECTION = "wheelSpins";
const BOOSTS_COLLECTION = "userBoosts";
const EXTRA_SPINS_COLLECTION = "userExtraSpins";

export const DEFAULT_WHEELS: AfriGomboWheel[] = [
  {
    id: "wheel_classique",
    name: "🎡 Roue Classique AFRIGOMBO",
    description: "Roue de fidélité accessible à tous les membres. Permet de gagner du Premium, des Boosts et des extras.",
    type: "CLASSIQUE",
    enabled: true,
    cost: 300,
    currency: "FCFA",
    maxDailyParticipations: 3,
    maxParticipationsPerUser: 50,
    allowedAccountTypes: ["standard", "premium", "vip", "all"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com",
    rulesText: "Chaque tirage coûte 300 FCFA. Vous pouvez jouer jusqu'à 3 fois par jour. Les récompenses Premium s'ajoutent automatiquement à votre abonnement existant sans perte de jours.",
    segments: [
      {
        id: "seg_p7",
        label: "👑 7 Jours Premium",
        type: "PREMIUM_DAYS",
        rewardValue: 7,
        rewardDuration: 7,
        probability: 15,
        enabled: true,
        color: "#D4AF37"
      },
      {
        id: "seg_vis24",
        label: "⚡ Boost Visibilité 24h",
        type: "VISIBILITY_BOOST",
        rewardValue: "Radar 24h",
        rewardDuration: 1,
        probability: 20,
        enabled: true,
        color: "#10B981"
      },
      {
        id: "seg_gombo48",
        label: "🚀 Boost Gombo 48h",
        type: "GOMBO_BOOST",
        rewardValue: "Gombo Express",
        rewardDuration: 2,
        probability: 15,
        enabled: true,
        color: "#3B82F6"
      },
      {
        id: "seg_extra",
        label: "🎁 Spin Gratuit",
        type: "EXTRA_SPIN",
        rewardValue: 1,
        probability: 15,
        enabled: true,
        color: "#8B5CF6"
      },
      {
        id: "seg_code",
        label: "🎟️ Code Pass Premium",
        type: "PREMIUM_CODE",
        rewardValue: "AFRI-PROMO-2026",
        rewardDuration: 3,
        probability: 10,
        enabled: true,
        color: "#F59E0B"
      },
      {
        id: "seg_zero",
        label: "🎯 Essayez encore",
        type: "NO_REWARD",
        rewardValue: 0,
        probability: 25,
        enabled: true,
        color: "#4B5563"
      }
    ]
  },
  {
    id: "wheel_premium",
    name: "👑 Roue Premium Prestige",
    description: "Roue haut de gamme offrant des périodes Premium prolongées et des amplificateurs de profil V.I.P.",
    type: "PREMIUM",
    enabled: true,
    cost: 500,
    currency: "FCFA",
    maxDailyParticipations: 5,
    maxParticipationsPerUser: 100,
    allowedAccountTypes: ["standard", "premium", "vip", "all"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com",
    rulesText: "Chaque tirage coûte 500 FCFA. Tentez de remporter jusqu'à 14 jours de Premium offerts et des Boosts Profil 72h.",
    segments: [
      {
        id: "seg_p14",
        label: "👑 14 Jours Premium",
        type: "PREMIUM_DAYS",
        rewardValue: 14,
        rewardDuration: 14,
        probability: 20,
        enabled: true,
        color: "#D4AF37"
      },
      {
        id: "seg_prof72",
        label: "⭐ Boost Profil 72h",
        type: "PROFILE_BOOST",
        rewardValue: "Artiste Vedette",
        rewardDuration: 3,
        probability: 20,
        enabled: true,
        color: "#EC4899"
      },
      {
        id: "seg_pub3",
        label: "📢 Boost Sponsoring Post",
        type: "PUBLICATION_BOOST",
        rewardValue: "Sponsoring Post 3j",
        rewardDuration: 3,
        probability: 20,
        enabled: true,
        color: "#3B82F6"
      },
      {
        id: "seg_extra2",
        label: "🎁 2 Spins Gratuits",
        type: "EXTRA_SPIN",
        rewardValue: 2,
        probability: 15,
        enabled: true,
        color: "#8B5CF6"
      },
      {
        id: "seg_pre_boost",
        label: "🌟 Badge VIP & Multiplicateur",
        type: "PREMIUM_BOOST",
        rewardValue: "VIP Gold",
        rewardDuration: 7,
        probability: 10,
        enabled: true,
        color: "#F59E0B"
      },
      {
        id: "seg_p_zero",
        label: "🎯 Recommencer",
        type: "NO_REWARD",
        rewardValue: 0,
        probability: 15,
        enabled: true,
        color: "#4B5563"
      }
    ]
  },
  {
    id: "wheel_elite",
    name: "💎 Roue Élite Souveraine",
    description: "Le sommet du privilège commercial AFRIGOMBO. Réservée aux chercheurs d'opportunités majeures.",
    type: "ELITE",
    enabled: true,
    cost: 1000,
    currency: "FCFA",
    maxDailyParticipations: 10,
    maxParticipationsPerUser: 200,
    allowedAccountTypes: ["standard", "premium", "vip", "all"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com",
    rulesText: "Tirage souverain à 1 000 FCFA. Récompenses garanties de haut niveau : 30 jours Premium, Super Boost Gombo 7 jours et Visibilité nationale.",
    segments: [
      {
        id: "seg_p30",
        label: "🏆 30 Jours Premium",
        type: "PREMIUM_DAYS",
        rewardValue: 30,
        rewardDuration: 30,
        probability: 20,
        enabled: true,
        color: "#D4AF37"
      },
      {
        id: "seg_super_gombo",
        label: "🚀 Super Boost Gombo 7j",
        type: "GOMBO_BOOST",
        rewardValue: "Gombo Élite 7j",
        rewardDuration: 7,
        probability: 25,
        enabled: true,
        color: "#10B981"
      },
      {
        id: "seg_elite_pass",
        label: "🎟️ Passport Élite Pass",
        type: "PREMIUM_CODE",
        rewardValue: "ELITE-PASSPORT-2026",
        rewardDuration: 14,
        probability: 15,
        enabled: true,
        color: "#F59E0B"
      },
      {
        id: "seg_extra3",
        label: "🎁 3 Spins Gratuits",
        type: "EXTRA_SPIN",
        rewardValue: 3,
        probability: 20,
        enabled: true,
        color: "#8B5CF6"
      },
      {
        id: "seg_vis_nat",
        label: "🌍 Radar National 7j",
        type: "VISIBILITY_BOOST",
        rewardValue: "Radar National 7j",
        rewardDuration: 7,
        probability: 20,
        enabled: true,
        color: "#3B82F6"
      }
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
          wheels.push(docSnap.data() as AfriGomboWheel);
        });
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
   */
  static pickWinningSegment(segments: WheelSegment[]): WheelSegment {
    const activeSegments = (segments || []).filter((s) => s.enabled);
    const totalWeight = activeSegments.reduce((sum, s) => sum + (Number(s.probability) || 0), 0);
    
    let rand = Math.random() * totalWeight;
    for (const seg of activeSegments) {
      const weight = Number(seg.probability) || 0;
      if (rand <= weight) {
        return seg;
      }
      rand -= weight;
    }
    return activeSegments[0];
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
    spinRecord?: WheelSpinRecord;
    balanceAfter?: number;
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

    // 6. Financial Debit if cost > 0
    let balanceAfter: number | undefined;
    if (finalCost > 0) {
      const payRes = await PaymentEngine.processPayment({
        userId,
        userName,
        amount: finalCost,
        module: "wheel",
        reason: `Participation à la ${wheel.name}`,
        metadata: { wheelId: wheel.id, wheelType: wheel.type }
      });

      if (!payRes.success) {
        return { 
          success: false, 
          error: payRes.insufficientBalance 
            ? `Solde insuffisant dans votre Wallet (${payRes.currentBalance || 0} FCFA). La participation coûte ${finalCost} FCFA.`
            : (payRes.error || "Échec du règlement par Wallet.")
        };
      }
      balanceAfter = payRes.balanceAfter;
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

    // 8. Deterministic Winning Segment Pick
    const winningSegment = this.pickWinningSegment(wheel.segments);
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
      currency: wheel.currency || "FCFA",
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
      spinRecord,
      balanceAfter
    };
  }

  /**
   * Intelligently grant reward without overwriting existing periods or corrupting state
   */
  private static async grantReward(params: {
    userId: string;
    segment: WheelSegment;
    wheel: AfriGomboWheel;
    spinId: string;
  }): Promise<void> {
    const { userId, segment, spinId } = params;
    const nowISO = new Date().toISOString();

    if (segment.type === "PREMIUM_DAYS") {
      // Intelligently stack Premium duration
      const daysToAdd = Number(segment.rewardValue) || segment.rewardDuration || 7;
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        let currentExpTime = Date.now();
        if (userSnap.exists()) {
          const uData = userSnap.data();
          if (uData.premiumExpiresAt) {
            const expParsed = new Date(uData.premiumExpiresAt).getTime();
            if (expParsed > currentExpTime) {
              currentExpTime = expParsed; // Stack from existing future expiration
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
        console.log(`Intelligently stacked ${daysToAdd} Premium days for user ${userId}. New expiration: ${newExpISO}`);
      } catch (err) {
        console.error("Error granting Premium days reward:", err);
      }
    } else if (segment.type === "EXTRA_SPIN") {
      // Grant free spin tokens
      const count = Number(segment.rewardValue) || 1;
      try {
        for (let i = 0; i < count; i++) {
          const tokenId = `extra_${spinId}_${i}`;
          const tokenRef = doc(db, EXTRA_SPINS_COLLECTION, tokenId);
          const extraRecord: UserExtraSpinRecord = {
            id: tokenId,
            userId,
            wheelId: params.wheel.id,
            source: "wheel_reward",
            used: false,
            createdAt: nowISO
          };
          await setDoc(tokenRef, extraRecord);
        }
      } catch (err) {
        console.error("Error granting extra spin tokens:", err);
      }
    } else if (
      segment.type === "VISIBILITY_BOOST" || 
      segment.type === "GOMBO_BOOST" || 
      segment.type === "PROFILE_BOOST" || 
      segment.type === "PUBLICATION_BOOST" ||
      segment.type === "PREMIUM_BOOST"
    ) {
      // Create temporary boost entry
      const durationDays = segment.rewardDuration || 1;
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      try {
        const boostId = `boost_${spinId}`;
        const boostRef = doc(db, BOOSTS_COLLECTION, boostId);
        const boostRecord: UserBoostRecord = {
          id: boostId,
          userId,
          type: segment.type,
          startAt: nowISO,
          expiresAt,
          source: "wheel_reward",
          status: "ACTIVE",
          durationDays,
          createdAt: nowISO
        };
        await setDoc(boostRef, boostRecord);
      } catch (err) {
        console.error("Error granting boost reward:", err);
      }
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
