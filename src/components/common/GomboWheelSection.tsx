import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Disc, Sparkles, AlertCircle, Award, Zap, Crown, RefreshCw, 
  ChevronRight, Info, History, X, Check, ShieldAlert, Ticket, Gift,
  Target, Coins, ShoppingBag, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff
} from "lucide-react";
import { AfriGomboWheel, WheelSegment, WheelSpinRecord, UserExtraSpinRecord, GawaPack, GawaMission, UserGawaMission, GawaTransaction, UserLotRecord } from "../../types";
import { WheelEngineService } from "../../lib/WheelEngineService";
import { SecurityService } from "../../lib/SecurityService";
import { subscribeToFeatureFlags, isModuleAccessible, getModuleVisibility } from "../../lib/featureFlags";
import { GawaEngineService } from "../../lib/GawaEngineService";
import { getCanonicalWalletBalance } from "../../lib/financial";
import { db } from "../../lib/firebase";
import { onSnapshot, doc } from "firebase/firestore";
import { useWalletSecurity } from "../../context/WalletSecurityContext";

interface GomboWheelSectionProps {
  currentUserProfile?: any;
  onRefreshProfile?: () => void;
  audioSynth?: any;
}

// 16 Standard Prestige Segments definitions for all 3 wheel tiers
// Dispersed layout (high value lots at opposite positions 1, 5, 9, 13) and reduced durations (max 15j on Premium wheel)
export const WHEEL_16_SEGMENTS_MAP: Record<string, WheelSegment[]> = {
  wheel_classique: [
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
  ],
  wheel_elite: [
    { id: "p_1", label: "👑 Premium 7j", type: "PREMIUM_DAYS", rewardValue: 7, rewardDuration: 7, probability: 12, enabled: true, color: "#D4AF37", promoValueFCFA: 500, minAccountLevel: "all" },
    { id: "p_2", label: "🔄 Réessayez", type: "NO_REWARD", rewardValue: 0, probability: 8, enabled: true, color: "#18181B", promoValueFCFA: 0, minAccountLevel: "all" },
    { id: "p_3", label: "⚡ Super Boost 48h", type: "GOMBO_BOOST", rewardValue: "Super Boost 48h", rewardDuration: 2, probability: 10, enabled: true, color: "#F59E0B", promoValueFCFA: 350, minAccountLevel: "all" },
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
  ],
  wheel_premium: [
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
};

// Helper to parse emoji and label text cleanly for SVG wheel
const parseSegmentLabel = (label: string) => {
  if (!label) return { emoji: "✨", text: "" };
  const parts = label.trim().split(" ");
  if (parts.length > 1 && /\p{Extended_Pictographic}/u.test(parts[0])) {
    return { emoji: parts[0], text: parts.slice(1).join(" ") };
  }
  return { emoji: "🎁", text: label };
};

export default function GomboWheelSection({
  currentUserProfile,
  onRefreshProfile,
  audioSynth
}: GomboWheelSectionProps) {
  const { formatWalletBalance, isBalanceHidden, toggleBalanceWithPin } = useWalletSecurity();
  // Wheels state from Firestore
  const [wheels, setWheels] = useState<AfriGomboWheel[]>([]);
  const [selectedWheelId, setSelectedWheelId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Gawa State
  const [gawaActiveTab, setGawaActiveTab] = useState<"missions" | "buy" | "history">("buy");
  const [gawaWallet, setGawaWallet] = useState<any>(null);
  const [gawaPacks, setGawaPacks] = useState<GawaPack[]>([]);
  const [gawaHistory, setGawaHistory] = useState<GawaTransaction[]>([]);
  const [missions, setMissions] = useState<GawaMission[]>([]);
  const [userMissions, setUserMissions] = useState<UserGawaMission[]>([]);
  const [evaluatingMissions, setEvaluatingMissions] = useState<Record<string, boolean>>({});
  const [missionToast, setMissionToast] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedPack, setSelectedPack] = useState<GawaPack | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [successDetails, setSuccessDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Global Feature Flag state
  const [flagsLoading, setFlagsLoading] = useState<boolean>(true);
  const [isWheelGlobalEnabled, setIsWheelGlobalEnabled] = useState<boolean>(true);

  // User Spin History & Extra Spins
  const [userSpins, setUserSpins] = useState<WheelSpinRecord[]>([]);
  const [userExtraSpins, setUserExtraSpins] = useState<UserExtraSpinRecord[]>([]);

  // Interactive Spin States
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinDegree, setSpinDegree] = useState<number>(0);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showGawaBottomSheet, setShowGawaBottomSheet] = useState<boolean>(false);
  const [showLotsBottomSheet, setShowLotsBottomSheet] = useState<boolean>(false);
  const [userLots, setUserLots] = useState<UserLotRecord[]>([]);
  const [activatingLotId, setActivatingLotId] = useState<string | null>(null);
  const [activationSuccessMsg, setActivationSuccessMsg] = useState<string | null>(null);
  const [activationErrorMsg, setActivationErrorMsg] = useState<string | null>(null);
  const [insufficientGawaState, setInsufficientGawaState] = useState<{ missingGawa: number; requiredGawa: number } | null>(null);
  const [spinResult, setSpinResult] = useState<{
    winningSegment?: WheelSegment;
    spinRecord?: WheelSpinRecord;
    balanceAfter?: number;
  } | null>(null);
  const [spinError, setSpinError] = useState<string | null>(null);
  const [showMysteryBox, setShowMysteryBox] = useState<boolean>(false);
  const [mysteryBoxOpened, setMysteryBoxOpened] = useState<boolean>(false);

  const userId = currentUserProfile?.uid || currentUserProfile?.id || "";
  const userEmail = currentUserProfile?.email || "";
  const userAccountType = currentUserProfile?.isPremium ? "premium" : "standard";
  const isFounder = SecurityService.isFounder(currentUserProfile) || userEmail.toLowerCase() === "jhs.kmj7@gmail.com";

  const [flagsMap, setFlagsMap] = useState<any>({});
  // 0. Subscribe to Global Feature Flags
  useEffect(() => {
    setFlagsLoading(true);
    const unsubFlags = subscribeToFeatureFlags((flags) => {
      setFlagsMap(flags);
      const enabled = isModuleAccessible("wheel", currentUserProfile, currentUserProfile, flags);
      setIsWheelGlobalEnabled(enabled);
      setFlagsLoading(false);
    });

    return () => unsubFlags();
  }, []);

  const wheelVis = getModuleVisibility("wheel", currentUserProfile, currentUserProfile, flagsMap);

  if (wheelVis === "HIDDEN" && !isFounder) {
    return null;
  }

  if (wheelVis === "COMING_SOON" && !isFounder) {
    return (
      <div className="p-8 text-center bg-black/40 border border-afri-gold/30 rounded-2xl my-6 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-afri-gold/15 flex items-center justify-center text-afri-gold mx-auto font-bold text-xl">
          🎡
        </div>
        <h3 className="text-lg font-black text-white">Roue AFRIGOMBO — Bientôt disponible</h3>
        <p className="text-xs text-afri-text-sec max-w-md mx-auto">
          Ce module exceptionnel est en cours de finalisation par la Grande Chancellerie et sera accessible très prochainement.
        </p>
      </div>
    );
  }

  // 1. Subscribe to Wheels Collection
  useEffect(() => {
    setLoading(true);
    const unsub = WheelEngineService.subscribeWheels((data) => {
      setWheels(data);
      if (data.length > 0) {
        setSelectedWheelId((prev) => {
          if (prev && data.some((w) => w.id === prev)) return prev;
          const firstActive = data.find((w) => w.enabled);
          return firstActive ? firstActive.id : data[0].id;
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Subscribe to User Spin History, Extra Spins & Won Lots
  useEffect(() => {
    if (!userId) return;

    const unsubHistory = WheelEngineService.subscribeUserSpinHistory(userId, (spins) => {
      setUserSpins(spins);
    });

    const unsubExtra = WheelEngineService.subscribeUserExtraSpins(userId, (tokens) => {
      setUserExtraSpins(tokens);
    });

    const unsubLots = WheelEngineService.subscribeUserLots(userId, (lots) => {
      setUserLots(lots);
    });

    return () => {
      unsubHistory();
      unsubExtra();
      unsubLots();
    };
  }, [userId]);

  // Handler for Real Lot Activation
  const handleActivateLot = async (lot: UserLotRecord) => {
    if (!userId) {
      setActivationErrorMsg("Vous devez être connecté pour activer un lot.");
      return;
    }
    setActivatingLotId(lot.id);
    setActivationErrorMsg(null);
    setActivationSuccessMsg(null);

    const res = await WheelEngineService.activateUserLot({
      lotId: lot.id,
      userId: userId
    });

    setActivatingLotId(null);
    if (res.success) {
      setActivationSuccessMsg(`✨ Lot "${lot.rewardLabel}" activé avec succès !`);
      if (onRefreshProfile) {
        onRefreshProfile();
      }
      setTimeout(() => setActivationSuccessMsg(null), 4000);
    } else {
      setActivationErrorMsg(res.message || "Impossible d'activer ce lot.");
    }
  };

  // 3. Gawa Data Subscription
  useEffect(() => {
    if (!userId) return;

    // Subscribe to User Wallet
    const unsubWallet = onSnapshot(doc(db, "users", userId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const fcfaSolde = getCanonicalWalletBalance(data);
        const gawaSolde = typeof data.gawaBalance === "number" 
          ? data.gawaBalance 
          : (typeof data.wallet?.soldeGawa === "number" ? data.wallet.soldeGawa : 0);
          
        setGawaWallet({ 
          soldeDisponible: fcfaSolde, 
          soldeGawa: gawaSolde 
        });
      }
    });

    // Fetch Gawa Packs
    const fetchPacks = async () => {
      try {
        const packs = await GawaEngineService.getGawaPacks();
        setGawaPacks(packs);
      } catch (err) {
        console.error("Error fetching gawa packs:", err);
      }
    };
    fetchPacks();

    // Subscribe to Gawa History
    const unsubHistory = GawaEngineService.subscribeUserGawaHistory(userId, (records) => {
      setGawaHistory(records.slice(0, 20) as GawaTransaction[]);
    });

    // Fetch missions from engine
    const fetchMissions = async () => {
      try {
        const allMissions = await GawaEngineService.getMissions();
        setMissions(allMissions);
        
        const completed = await GawaEngineService.getUserMissions(userId);
        setUserMissions(completed);
      } catch (err) {
        console.error("Error fetching missions:", err);
      }
    };
    fetchMissions();

    return () => {
      unsubWallet();
      unsubHistory();
    };
  }, [userId]);

  const currentWheel = wheels.find((w) => w.id === selectedWheelId) || wheels[0];
  const wheel16Config = WHEEL_16_SEGMENTS_MAP[currentWheel?.id || "wheel_classique"] || WHEEL_16_SEGMENTS_MAP.wheel_classique;
  const activeSegments = (currentWheel?.segments && currentWheel.segments.length === 16) 
    ? currentWheel.segments 
    : wheel16Config;
  const numSegments = activeSegments.length || 16;

  // Calculate user's today spins count for current wheel
  const todayISO = new Date().toISOString().substring(0, 10);
  const spinsTodayCount = userSpins.filter(
    (s) => s.wheelId === currentWheel?.id && s.createdAt && s.createdAt.substring(0, 10) === todayISO && s.status === "SUCCESS"
  ).length;

  const remainingDailySpins = currentWheel?.maxDailyParticipations 
    ? Math.max(0, currentWheel.maxDailyParticipations - spinsTodayCount)
    : 999;

  const hasExtraSpinToken = userExtraSpins.length > 0;

  // Direct Wheel Spin Execution (NO POPUPS / NO CONFIRMATION MODALS)
  const handleExecuteSpin = async () => {
    if (!currentWheel || !userId) {
      setSpinError("Veuillez vous connecter pour participer au tirage.");
      return;
    }

    setIsSpinning(true);
    setSpinError(null);
    setSpinResult(null);
    setInsufficientGawaState(null);

    try { audioSynth?.playNotification?.(); } catch (e) {}

    try {
      const res = await WheelEngineService.spinWheel({
        userId,
        userName: currentUserProfile?.displayName || currentUserProfile?.email || "Membre Gombo",
        userAccountType,
        wheelId: currentWheel.id,
        isFounder
      });

      if (!res.success) {
        setIsSpinning(false);
        if (res.insufficientGawa || res.missingGawa) {
          setInsufficientGawaState({
            missingGawa: res.missingGawa || (currentWheel.cost - (gawaWallet?.soldeGawa || 0)),
            requiredGawa: currentWheel.cost
          });
        } else {
          setSpinError(res.error || "Échec du tirage. Veuillez réessayer.");
        }
        try { audioSynth?.playError?.(); } catch (e) {}
        return;
      }

      // Find index of winning segment among 16 active segments
      const winningSegIndex = activeSegments.findIndex((s) => 
        s.id === res.winningSegment?.id || 
        (s.type === res.winningSegment?.type && s.rewardValue === res.winningSegment?.rewardValue)
      );
      const segIndex = winningSegIndex >= 0 ? winningSegIndex : 0;
      
      const segAngle = 360 / numSegments;
      const targetSegmentCenter = segIndex * segAngle;
      const extraRotations = 360 * 6; // 6 full turns for smooth visual slowdown
      const totalRotation = spinDegree + extraRotations + (360 - targetSegmentCenter);
      
      setSpinDegree(totalRotation);

      // Smooth animation transition (3.5 seconds)
      setTimeout(() => {
        setIsSpinning(false);
        const seg = res.winningSegment || activeSegments[segIndex];
        if (seg?.type === "SURPRISE_BOX") {
          setShowMysteryBox(true);
          setMysteryBoxOpened(false);
        }
        setSpinResult({
          winningSegment: seg,
          spinRecord: res.spinRecord,
          balanceAfter: res.balanceAfter
        });
        try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
        if (onRefreshProfile) {
          onRefreshProfile();
        }
      }, 3500);

    } catch (err: any) {
      setIsSpinning(false);
      setSpinError(err?.message || "Une erreur est survenue lors du tirage.");
      try { audioSynth?.playError?.(); } catch (e) {}
    }
  };

  const handleBuyPack = async (pack: GawaPack) => {
    if (!userId || !gawaWallet) return;
    
    if (gawaWallet.soldeDisponible < pack.priceFCFA) {
      setError(`Solde insuffisant. Requis: ${pack.priceFCFA} FCFA.`);
      return;
    }

    setPurchasing(true);
    setError(null);
    try {
      const res = await GawaEngineService.purchaseGawaPack(userId, pack.id);
      setSuccessDetails({
        amount: pack.gawaAmount,
        packName: pack.name,
        price: pack.priceFCFA,
        newFCFA: res.balanceAfterFCFA,
        newGawa: res.balanceAfterGawa
      });
      try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'achat.");
      try { audioSynth?.playError?.(); } catch (e) {}
    } finally {
      setPurchasing(false);
    }
  };

  const handleClaimMission = async (mission: GawaMission) => {
    if (!userId) return;
    
    setEvaluatingMissions(prev => ({ ...prev, [mission.id]: true }));
    try {
      const res = await GawaEngineService.evaluateAndClaimMission(userId, mission.id);
      if (res.success) {
        setMissionToast({ 
          success: true, 
          message: `Félicitations ! +${mission.rewardGawa} Gawa ajoutés.` 
        });
        setUserMissions(prev => [...prev, { userId: userId, missionId: mission.id, completedAt: new Date().toISOString() } as any]);
        try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
      } else {
        setMissionToast({ success: false, message: "Mission non complétée ou déjà réclamée." });
      }
    } catch (err: any) {
      setMissionToast({ success: false, message: err.message });
    } finally {
      setEvaluatingMissions(prev => ({ ...prev, [mission.id]: false }));
    }
  };

  return (
    <div className="w-full max-w-full bg-[#050505] text-white p-1 sm:p-2 font-sans box-border flex flex-col items-center flex-1 h-full">
      <div className="w-full max-w-lg mx-auto box-border flex flex-col items-center justify-center flex-1 h-full">

        {/* LOADING STATE */}
        {(loading || flagsLoading) && (
          <div className="p-8 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl text-center space-y-3 shadow-2xl flex flex-col items-center">
            <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
            <p className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">Initialisation...</p>
          </div>
        )}

        {/* MAIN CONTAINER */}
        {!loading && !flagsLoading && (isWheelGlobalEnabled || isFounder) && currentWheel && (
          <div className="w-full max-w-full box-border animate-fadeIn flex-1 flex flex-col h-full">
            
            {/* ========================================================= */}
            {/* 1. CONTAINER ROUE */}
            {/* ========================================================= */}
            <div className="bg-zinc-950 border border-[#D4AF37]/30 rounded-[20px] sm:rounded-[28px] p-2 sm:p-3 space-y-2 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between flex-1 w-full max-w-full box-border">
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#D4AF37]/5 rounded-full blur-[60px] pointer-events-none" />

              {/* Header Bar: Wheel Title & GAWA Balance */}
              <div className="w-full flex items-center justify-between gap-2 pb-2 border-b border-zinc-900 font-mono">
                <div className="space-y-0.5 text-left min-w-0">
                  <span className="text-[8px] sm:text-[9px] font-black text-amber-500 uppercase tracking-widest block truncate">
                    🎡 TIRAGE GAWA SOUVERAIN
                  </span>
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight truncate">
                    {currentWheel?.name || "Roue AfriGombo"}
                  </h3>
                </div>

                {/* Current GAWA Balance Badge */}
                <div className="bg-amber-950/40 border border-amber-400/50 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-md shrink-0">
                  <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0 animate-pulse" />
                  <span className="text-xs font-black text-amber-400 uppercase tracking-tight">
                    {(gawaWallet?.soldeGawa || 0).toLocaleString()} GAWA
                  </span>
                </div>
              </div>

              {/* Compact Clickable Access Bars for Centre Gawa & Mes Lots */}
              <div className="w-full flex items-center gap-1.5 box-border">
                {/* Need Gawa Button */}
                <button
                  onClick={() => {
                    setGawaActiveTab("buy");
                    setShowGawaBottomSheet(true);
                  }}
                  className="flex-1 py-1.5 px-2.5 bg-zinc-900/80 hover:bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between transition cursor-pointer font-mono text-[10px] sm:text-[11px] shadow-sm min-w-0"
                >
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold min-w-0 truncate">
                    <Sparkles className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />
                    <span className="truncate">✨ Besoin de Gawa ?</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
                </button>

                {/* Mes Lots Button */}
                <button
                  onClick={() => setShowLotsBottomSheet(true)}
                  className="py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/40 text-amber-400 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer font-mono text-[10px] sm:text-[11px] font-bold shrink-0 shadow-sm active:scale-95"
                >
                  <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>🎁 Mes lots</span>
                  {userLots.filter(l => l.status === "AVAILABLE").length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-black text-[8px] font-black animate-pulse">
                      {userLots.filter(l => l.status === "AVAILABLE").length}
                    </span>
                  )}
                </button>
              </div>

              {/* Wheels Selection Tabs */}
              <div className="flex gap-2 w-full overflow-x-auto pb-1 scrollbar-none snap-x">
                {wheels.map((w) => {
                  const isSelected = w.id === selectedWheelId;
                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        if (isSpinning) return;
                        setSelectedWheelId(w.id);
                        setSpinResult(null);
                        setSpinError(null);
                        setInsufficientGawaState(null);
                      }}
                      disabled={isSpinning}
                      className={`shrink-0 snap-start px-3.5 py-2 rounded-xl border flex flex-col items-center justify-center transition-all min-w-[92px] ${
                        isSelected
                          ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                          : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <span className="text-[11px] font-black uppercase tracking-tight whitespace-nowrap">{w.name}</span>
                      <span className="text-[10px] font-mono text-[#D4AF37] font-bold mt-0.5 whitespace-nowrap">{w.costGawa || w.cost} GAWA</span>
                    </button>
                  );
                })}
              </div>

              {/* Cost Badge */}
              <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[#D4AF37] text-[10px] font-mono font-black uppercase tracking-wider">
                ⚡ COÛT DU LANCEMENT : {hasExtraSpinToken ? "0 GAWA (Spin Offert)" : `${currentWheel?.costGawa || currentWheel?.cost || 20} GAWA`}
              </div>

              {/* Visual Wheel Stage */}
              <div className="relative flex flex-col items-center justify-center py-2 sm:py-3 w-full max-w-full">
                {/* Top Pointer Arrow */}
                <div className="absolute top-1 sm:top-2 z-30 flex flex-col items-center pointer-events-none drop-shadow-[0_4px_12px_rgba(212,175,55,0.9)]">
                  <div className="w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-t-[20px] border-t-[#FBBF24] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37] -mt-1 shadow-sm" />
                </div>

                {/* Rotating SVG Wheel Stage */}
                <div className="w-full flex items-center justify-center p-1 sm:p-2">
                  <svg
                    viewBox="0 0 360 360"
                    className="w-[min(80vw,48vh,340px)] h-[min(80vw,48vh,340px)] aspect-square drop-shadow-[0_0_35px_rgba(212,175,55,0.25)] select-none mx-auto"
                    style={{ 
                      transform: `rotate(${spinDegree}deg)`,
                      transition: "transform 3500ms cubic-bezier(0.15, 0.9, 0.25, 1)"
                    }}
                  >
                    <defs>
                      <radialGradient id="goldHubGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FDE68A" />
                        <stop offset="60%" stopColor="#D4AF37" />
                        <stop offset="100%" stopColor="#92400E" />
                      </radialGradient>
                      <linearGradient id="rimGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FBBF24" />
                        <stop offset="50%" stopColor="#92400E" />
                        <stop offset="100%" stopColor="#FBBF24" />
                      </linearGradient>
                    </defs>

                    {/* Outer Bezel Rim */}
                    <circle cx="180" cy="180" r="176" fill="#09090B" stroke="url(#rimGradient)" strokeWidth="5" />
                    <circle cx="180" cy="180" r="162" fill="none" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.4" />

                    {/* 16 Golden Rivets / Studs along the rim */}
                    {Array.from({ length: 16 }).map((_, i) => {
                      const dotAngle = (i * 22.5) * (Math.PI / 180);
                      const cx = 180 + 169 * Math.sin(dotAngle);
                      const cy = 180 - 169 * Math.cos(dotAngle);
                      return (
                        <circle
                          key={`rivet-${i}`}
                          cx={cx}
                          cy={cy}
                          r="3"
                          fill="#FBBF24"
                          stroke="#78350F"
                          strokeWidth="0.8"
                        />
                      );
                    })}

                    {/* 16 Mathematical Pie Slices */}
                    {activeSegments.map((seg, i) => {
                      const { emoji, text } = parseSegmentLabel(seg.label);
                      const isDarkBg = !seg.color || ["#18181B", "#09090B", "#27272A", "#3F3F46", "#4B5563", "#52525B"].includes(seg.color);
                      const textColor = isDarkBg ? "#D1D5DB" : ["#D4AF37", "#F59E0B", "#FBBF24", "#06B6D4"].includes(seg.color) ? "#000000" : "#FFFFFF";

                      return (
                        <g key={seg.id || `seg-${i}`} transform={`rotate(${i * 22.5} 180 180)`}>
                          {/* Sector Slice Path (22.5° arc centered at 12 o'clock, radius 158) */}
                          <path
                            d="M 180 180 L 149.18 25.04 A 158 158 0 0 1 210.82 25.04 Z"
                            fill={seg.color || (isDarkBg ? "#18181B" : "#D4AF37")}
                            stroke="#D4AF37"
                            strokeWidth="0.85"
                            strokeOpacity="0.6"
                          />

                          {/* Sector Icon / Emoji near outer edge */}
                          <text
                            x="180"
                            y="44"
                            textAnchor="middle"
                            fontSize="13"
                            dominantBaseline="central"
                          >
                            {emoji}
                          </text>

                          {/* Sector Label Text (rotated radially along slice) */}
                          <text
                            x="180"
                            y="78"
                            transform="rotate(90 180 78)"
                            textAnchor="middle"
                            fill={textColor}
                            fontSize="8"
                            fontWeight="900"
                            letterSpacing="0.04em"
                            fontFamily="ui-monospace, monospace"
                            dominantBaseline="central"
                          >
                            {text.toUpperCase()}
                          </text>
                        </g>
                      );
                    })}

                    {/* Center Hub */}
                    <circle cx="180" cy="180" r="34" fill="#09090B" stroke="#D4AF37" strokeWidth="3" />
                    <circle cx="180" cy="180" r="28" fill="url(#goldHubGradient)" />
                    <circle cx="180" cy="180" r="22" fill="#0B0B0C" stroke="#FBBF24" strokeWidth="1.5" />
                    <text x="180" y="175" textAnchor="middle" fontSize="12" dominantBaseline="central">👑</text>
                    <text x="180" y="188" textAnchor="middle" fill="#D4AF37" fontSize="7" fontWeight="900" letterSpacing="0.12em" fontFamily="ui-monospace, monospace" dominantBaseline="central">GAWA</text>
                  </svg>
                </div>

                {/* Action Button: Directly spins, NO modal popup */}
                <div className="mt-2 w-full max-w-xs space-y-1.5">
                  <button
                    onClick={handleExecuteSpin}
                    disabled={isSpinning || remainingDailySpins <= 0}
                    className={`w-full py-2.5 sm:py-3 px-4 rounded-xl font-black uppercase text-xs font-mono tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-xl ${
                      isSpinning || remainingDailySpins <= 0
                        ? "bg-zinc-900 text-zinc-600 border border-zinc-800"
                        : "bg-[#D4AF37] hover:bg-amber-400 text-black shadow-[#D4AF37]/30 border border-[#D4AF37] active:scale-95"
                    }`}
                  >
                    <Disc className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`} />
                    <span>{isSpinning ? "Tirage en cours..." : "LANCER LA ROUE"}</span>
                  </button>
                  
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => setShowRulesModal(true)} className="text-[9px] font-black text-zinc-400 uppercase hover:text-[#D4AF37] transition font-mono tracking-tighter cursor-pointer">Règles</button>
                    <button onClick={() => setShowHistoryModal(true)} className="text-[9px] font-black text-zinc-400 uppercase hover:text-[#D4AF37] transition font-mono tracking-tighter cursor-pointer">Historique</button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {spinError && (
                <div className="w-full p-2.5 bg-red-950/60 border border-red-500/40 rounded-xl text-red-400 text-[10px] font-mono font-bold text-center flex items-center justify-center gap-1.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{spinError}</span>
                </div>
              )}

              {/* Insufficient GAWA Area */}
              {insufficientGawaState && (
                <div className="w-full p-3 bg-amber-950/40 border border-amber-500/50 rounded-xl text-center space-y-2 font-mono animate-slideUp">
                  <div className="flex items-center justify-center gap-1.5 text-amber-400 font-black text-xs uppercase">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Gawa insuffisants</span>
                  </div>
                  <p className="text-[10px] text-zinc-300">
                    Il vous manque <span className="font-black text-amber-400">{insufficientGawaState.missingGawa} GAWA</span> pour lancer la roue.
                  </p>
                  <button
                    onClick={() => {
                      setGawaActiveTab("buy");
                      setShowGawaBottomSheet(true);
                    }}
                    className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-[10px] uppercase rounded-lg tracking-wider shadow-md transition cursor-pointer"
                  >
                    Acheter des Gawa
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* 7. PORTAL MODALE DU RÉSULTAT DU TIRAGE (Superposée) */}
      {/* ========================================================= */}
      {typeof document !== "undefined" && spinResult?.winningSegment && createPortal(
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop Click */}
          <div 
            className="fixed inset-0 cursor-pointer"
            onClick={() => setSpinResult(null)}
          />

          {/* Modal Box */}
          <div className="bg-[#0B0B0C] border border-[#D4AF37]/50 rounded-[28px] p-5 w-full max-w-xs text-center space-y-3 shadow-2xl relative overflow-hidden box-border animate-scaleUp z-10">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-[#D4AF37]/10 rounded-full blur-[40px] pointer-events-none" />

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{spinResult.winningSegment.type === "NO_REWARD" ? "RÉSULTAT DU TIRAGE" : "🎉 FÉLICITATIONS !"}</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-[#D4AF37] uppercase tracking-tight">
                « {spinResult.winningSegment.label} »
              </h3>
              <p className="text-[11px] text-zinc-300">
                {spinResult.winningSegment.type === "PREMIUM_DAYS"
                  ? `+${spinResult.winningSegment.rewardValue} jour(s) Premium crédités sur votre compte !`
                  : spinResult.winningSegment.type === "EXTRA_SPIN"
                  ? "Un ticket de tirage bonus vous a été offert !"
                  : spinResult.winningSegment.type === "GAWA_POINTS"
                  ? `+${spinResult.winningSegment.rewardValue} GAWA Bonus crédités !`
                  : spinResult.winningSegment.type === "NO_REWARD"
                  ? "Pas de chance cette fois-ci, retentez votre chance !"
                  : "Votre récompense a été enregistrée dans « Mes Lots » !"}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSpinResult(null)}
                className="w-full py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl font-mono tracking-wider transition cursor-pointer shadow-lg active:scale-95"
              >
                SUPER !
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODALS SECTION */}
      {/* ========================================================= */}
      
      {/* Gawa Purchase Confirmation Modal */}
      {selectedPack && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0B0B0C] border border-[#D4AF37]/30 rounded-[28px] p-5 w-full max-w-xs space-y-4 text-center shadow-2xl relative overflow-hidden box-border">
             <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 w-12 h-12 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
             </div>

             <div className="space-y-0.5">
                <h3 className="text-xs font-black text-amber-400 uppercase font-mono tracking-widest">Confirmer l'achat</h3>
                <p className="text-[11px] text-white font-mono font-bold uppercase tracking-tight">
                  {selectedPack.name} • +{selectedPack.gawaAmount} GAWA
                </p>
             </div>

             {/* Financial details breakdown */}
             <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 space-y-1.5 text-left font-mono">
                <div className="flex justify-between items-center">
                   <span className="text-[9px] font-bold text-zinc-400 uppercase">Prix du Pack</span>
                   <span className="text-xs font-black text-[#D4AF37]">{selectedPack.priceFCFA.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-zinc-900">
                   <div className="flex items-center gap-1">
                     <span className="text-[9px] text-zinc-400 uppercase">Solde FCFA Actuel</span>
                     <button
                       type="button"
                       onClick={toggleBalanceWithPin}
                       title={isBalanceHidden ? "Révéler le solde (Code PIN requis)" : "Masquer le solde"}
                       className="p-0.5 rounded text-zinc-400 hover:text-[#D4AF37] transition cursor-pointer"
                     >
                       {isBalanceHidden ? <EyeOff className="w-3 h-3 text-[#D4AF37]" /> : <Eye className="w-3 h-3" />}
                     </button>
                   </div>
                   <span className="text-[10px] font-bold text-white">{formatWalletBalance(gawaWallet?.soldeDisponible || 0, "FCFA")}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[9px] text-zinc-400 uppercase">Solde FCFA Après</span>
                   <span className="text-[10px] font-bold text-amber-400">
                     {isBalanceHidden ? "•••••• FCFA" : `${Math.max(0, (gawaWallet?.soldeDisponible || 0) - selectedPack.priceFCFA).toLocaleString()} FCFA`}
                   </span>
                </div>
             </div>

             {/* Error Message */}
             {error && (
               <div className="p-2 bg-red-950/60 border border-red-500/40 rounded-lg text-red-400 text-[9px] font-mono font-bold text-center flex items-center justify-center gap-1">
                 <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                 <span>{error}</span>
               </div>
             )}

             <div className="flex gap-2 pt-1">
                <button
                  disabled={purchasing}
                  onClick={() => { setSelectedPack(null); setError(null); }}
                  className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl text-[9px] font-black uppercase font-mono tracking-wider border border-zinc-800 cursor-pointer transition disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  disabled={purchasing}
                  onClick={() => handleBuyPack(selectedPack)}
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-black rounded-xl text-[9px] font-black uppercase font-mono tracking-wider shadow-md cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>...</span>
                    </>
                  ) : (
                    <span>CONFIRMER</span>
                  )}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successDetails && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0B0B0C] border border-emerald-500/30 rounded-[32px] p-6 w-full max-w-xs space-y-4 text-center shadow-2xl">
             <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <Check className="w-7 h-7 stroke-[3]" />
             </div>
             <div className="space-y-1">
                <h3 className="text-base font-black text-emerald-400 uppercase font-mono tracking-widest">Achat Réussi !</h3>
                <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                  +{successDetails.amount} Gawa ont été ajoutés à votre compte.
                </p>
             </div>
             <button
               onClick={() => setSuccessDetails(null)}
               className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase font-mono tracking-widest shadow-lg cursor-pointer"
             >
               EXCELLENT
             </button>
          </div>
        </div>
      )}

      {/* Mystery Box Modal */}
      {spinResult?.winningSegment?.type === "SURPRISE_BOX" && showMysteryBox && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0B0B0C] border-2 border-[#D4AF37]/50 rounded-[36px] p-6 w-full max-w-xs space-y-5 shadow-2xl text-white font-mono text-center relative overflow-hidden animate-slideUp">
            <div className="inline-flex p-4 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 shadow-xl animate-bounce">
              <Gift className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-[#D4AF37] uppercase tracking-wider">🎁 BOÎTE MYSTÈRE</h3>
            {!mysteryBoxOpened ? (
              <div className="space-y-4">
                <p className="text-[10px] text-zinc-400 font-medium">Un gain exclusif est caché à l'intérieur.</p>
                <div 
                  onClick={() => { setMysteryBoxOpened(true); try { audioSynth?.playValidationSuccess?.(); } catch (e) {} }}
                  className="p-6 bg-zinc-950 border-2 border-dashed border-[#D4AF37]/30 rounded-2xl cursor-pointer hover:border-[#D4AF37] transition group shadow-xl"
                >
                  <div className="text-4xl mb-2 group-hover:scale-110 transition transform">📦</div>
                  <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest block">DÉCELLER LE MYSTÈRE</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 bg-zinc-950 border border-emerald-500/40 rounded-2xl space-y-1 shadow-inner">
                  <span className="text-[8px] text-emerald-400 font-black uppercase tracking-[0.2em] block">RÉVÉLATION :</span>
                  <div className="text-base font-black text-white tracking-tight">
                    {currentWheel?.type === "ELITE" ? "🏆 14 Jours Premium Elite" : "👑 7 Jours Premium"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMysteryBox(false)}
                  className="w-full py-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-[10px] rounded-xl shadow-xl transition cursor-pointer"
                >
                  TERMINER
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && currentWheel && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0B0B0C] border border-zinc-800 rounded-[28px] p-5 w-full max-w-xs space-y-4 shadow-2xl text-white font-mono flex flex-col animate-slideUp">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-xs font-black uppercase text-[#D4AF37] tracking-tight">Règles du Tirage</h3>
              <button onClick={() => setShowRulesModal(false)} className="text-zinc-600 hover:text-white transition cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-[10px] text-zinc-400 leading-relaxed">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 space-y-1">
                <span className="font-black text-white uppercase block text-[10px]">{currentWheel.name}</span>
                <p className="text-[9px]">{currentWheel.rulesText || "Chaque tirage est certifié par l'algorithme Souverain d'AFRIGOMBO."}</p>
              </div>
              <div className="space-y-2 bg-zinc-950/50 p-3 rounded-xl border border-zinc-900">
                <span className="font-black text-zinc-300 block uppercase tracking-widest text-[8px]">Conditions de Participation</span>
                <ul className="space-y-1.5 text-[9px]">
                   <li className="flex gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Coût : {currentWheel.cost} GAWA par spin.</span>
                   </li>
                   <li className="flex gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Limite : {currentWheel.maxDailyParticipations || "Aucune"} par jour.</span>
                   </li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 bg-zinc-900 text-zinc-400 font-black uppercase text-[9px] rounded-xl border border-zinc-800 hover:text-white transition cursor-pointer"
            >
              FERMER
            </button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0B0B0C] border border-zinc-800 rounded-[28px] p-5 w-full max-w-xs space-y-4 shadow-2xl text-white font-mono flex flex-col animate-slideUp">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-xs font-black uppercase text-[#D4AF37] tracking-tight">Historique des Tirages</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-zinc-600 hover:text-white transition cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
               {userSpins.length === 0 ? (
                 <div className="py-8 text-center text-zinc-600 uppercase font-black text-[9px] tracking-widest">Aucun tirage récent</div>
               ) : (
                 userSpins.slice(0, 5).map(sp => (
                   <div key={sp.spinId} className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-between text-[9px]">
                      <div className="space-y-0.5 min-w-0">
                         <div className="font-black text-white uppercase tracking-tight truncate">{sp.rewardLabel}</div>
                         <div className="text-[7px] text-zinc-500 font-mono uppercase">{new Date(sp.createdAt).toLocaleDateString("fr-FR")}</div>
                      </div>
                      <div className="text-right shrink-0">
                         <div className="font-black text-[#D4AF37]">{sp.cost} GAWA</div>
                      </div>
                   </div>
                 ))
               )}
            </div>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full py-2 bg-zinc-900 text-zinc-400 font-black uppercase text-[9px] rounded-xl border border-zinc-800 transition cursor-pointer"
            >
              FERMER
            </button>
          </div>
        </div>
      )}

      {/* CENTRE GAWA BOTTOM SHEET */}
      <AnimatePresence>
        {showGawaBottomSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end justify-center"
          >
            {/* Backdrop click to close */}
            <div 
              className="fixed inset-0" 
              onClick={() => setShowGawaBottomSheet(false)} 
            />

            {/* Bottom Sheet Panel anchored at bottom */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative z-10 w-full max-w-md bg-gradient-to-b from-[#0F0F10] to-[#0B0B0C] border-t-2 border-[#D4AF37]/50 rounded-t-[28px] sm:rounded-t-[32px] shadow-[0_-10px_40px_rgba(212,175,55,0.15)] text-white font-mono flex flex-col overflow-hidden box-border max-h-[85vh]"
            >
              
              {/* Top Pull Handle */}
              <div className="pt-3 pb-1 shrink-0">
                <div 
                  className="w-12 h-1.5 bg-zinc-700 hover:bg-[#D4AF37]/60 rounded-full mx-auto cursor-pointer transition-colors"
                  onClick={() => setShowGawaBottomSheet(false)}
                />
              </div>

              {/* Scrollable Container with Content */}
              <div className="overflow-y-auto px-4 sm:px-5 pb-5 pt-2 space-y-3">
                {/* Header Bar */}
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">CENTRE GAWA</h3>
                      <p className="text-[8px] text-zinc-400 font-normal">Rechargez vos jetons Gawa</p>
                    </div>
                  </div>

                  {/* Dual Wallet Display Bar */}
                  <div className="flex items-center gap-1.5">
                    {/* FCFA Wallet */}
                    <div className="bg-zinc-900 border border-amber-500/30 px-2 py-0.5 rounded-lg text-right flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={toggleBalanceWithPin}
                        title={isBalanceHidden ? "Révéler le solde (Code PIN requis)" : "Masquer le solde"}
                        className="p-0.5 rounded text-zinc-400 hover:text-[#D4AF37] transition cursor-pointer"
                      >
                        {isBalanceHidden ? <EyeOff className="w-3 h-3 text-[#D4AF37]" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <div>
                        <span className="text-[7px] font-black text-amber-500 uppercase block">Wallet FCFA</span>
                        <span className="text-[9px] font-black text-white">{formatWalletBalance(gawaWallet?.soldeDisponible || 0, "F")}</span>
                      </div>
                    </div>
                    {/* Solde GAWA */}
                    <div className="bg-amber-950/40 border border-amber-400/50 px-2 py-0.5 rounded-lg text-right">
                      <span className="text-[7px] font-black text-amber-400 uppercase block">Solde GAWA</span>
                      <span className="text-[9px] font-black text-amber-400 flex items-center justify-end gap-0.5">
                        <Zap className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                        {(gawaWallet?.soldeGawa || 0).toLocaleString()} GAWA
                      </span>
                    </div>
                    <button 
                      onClick={() => setShowGawaBottomSheet(false)}
                      className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0 ml-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Navigation Tabs (Acheter / Missions / Historique) */}
                <div className="flex items-center justify-center gap-1 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800 w-full shrink-0">
                  {[
                    { id: "buy", label: "🛒 ACHETER GAWA" },
                    { id: "missions", label: "🎯 MISSIONS" },
                    { id: "history", label: "📜 HISTORIQUE" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setGawaActiveTab(tab.id as any)}
                      className={`flex-1 py-1.5 px-1 rounded-md text-[9px] font-black uppercase font-mono tracking-wider transition whitespace-nowrap cursor-pointer ${
                        gawaActiveTab === tab.id ? "bg-amber-400 text-black shadow-sm" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="w-full space-y-2 py-1">
                  {/* BUY TAB (Packs) */}
                  {gawaActiveTab === "buy" && (
                    <div className="grid grid-cols-3 gap-1.5 w-full box-border">
                      {gawaPacks.map(pack => (
                        <div key={pack.id} className="p-2 bg-zinc-900/80 border border-zinc-800 hover:border-amber-400/40 rounded-xl space-y-1.5 text-center transition shadow-md flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tight block truncate">{pack.name}</span>
                            <p className="text-sm font-black text-amber-400 tracking-tighter">+{pack.gawaAmount} GAWA</p>
                          </div>
                          <button
                            onClick={() => { setSelectedPack(pack); setError(null); }}
                            className="w-full py-1.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black rounded-lg text-[9px] uppercase tracking-wider transition cursor-pointer shadow-sm active:scale-95"
                          >
                            {pack.priceFCFA.toLocaleString()} FCFA
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MISSIONS TAB */}
                  {gawaActiveTab === "missions" && (
                    <div className="space-y-1.5 w-full box-border">
                      {missions.map(m => {
                        const done = userMissions.some(um => um.missionId === m.id);
                        return (
                          <div key={m.id} className={`p-2 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-between gap-2 ${done ? "opacity-60" : ""}`}>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-black text-white uppercase truncate">{m.title}</span>
                                  <span className="text-[9px] font-black text-amber-400 shrink-0">+{m.rewardGawa} GAWA</span>
                              </div>
                              <p className="text-[8px] text-zinc-400 truncate">{m.description}</p>
                            </div>
                            <button
                              disabled={done || evaluatingMissions[m.id]}
                              onClick={() => handleClaimMission(m)}
                              className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase shrink-0 transition cursor-pointer ${
                                done 
                                  ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed" 
                                  : "bg-[#D4AF37] hover:bg-amber-400 text-black shadow-sm"
                              }`}
                            >
                              {evaluatingMissions[m.id] ? "..." : done ? "Terminé" : "Réclamer"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* HISTORY TAB */}
                  {gawaActiveTab === "history" && (
                    <div className="space-y-1 w-full box-border">
                      {gawaHistory.length === 0 ? (
                        <div className="py-6 text-center space-y-1">
                          <History className="w-6 h-6 text-zinc-700 mx-auto" />
                          <p className="text-[9px] text-zinc-500 uppercase font-black">Aucun historique GAWA</p>
                        </div>
                      ) : (
                        gawaHistory.slice(0, 4).map(tx => (
                          <div key={tx.id} className="p-2 bg-zinc-900/50 border border-zinc-900 rounded-lg flex justify-between items-center gap-2">
                            <div className="min-w-0 truncate">
                              <p className="text-[9px] font-black text-white uppercase truncate">{tx.description}</p>
                              <p className="text-[7px] text-zinc-500 font-mono">{new Date(tx.createdAt).toLocaleDateString("fr-FR")}</p>
                            </div>
                            <span className={`font-black text-[10px] shrink-0 ${tx.amount > 0 ? "text-amber-400" : "text-zinc-400"}`}>
                              {tx.amount > 0 ? "+" : ""}{tx.amount} GAWA
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Close Button */}
                <div className="pt-1.5 border-t border-zinc-900 shrink-0">
                  <button
                    onClick={() => setShowGawaBottomSheet(false)}
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-black uppercase text-[9px] rounded-xl border border-zinc-800 transition cursor-pointer"
                  >
                    FERMER
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 3. BOTTOM SHEET "MES LOTS" */}
      {/* ========================================================= */}
      {showLotsBottomSheet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center animate-fadeIn p-0">
          {/* Backdrop Overlay Click to Close */}
          <div 
            className="fixed inset-0 cursor-pointer" 
            onClick={() => setShowLotsBottomSheet(false)} 
          />

          {/* Bottom Sheet Container */}
          <div className="relative z-10 w-full max-w-md bg-[#0B0B0C] border-t-2 border-[#D4AF37]/40 rounded-t-[24px] sm:rounded-t-[32px] p-3 sm:p-4 space-y-2.5 shadow-2xl text-white font-mono flex flex-col animate-slideUp overflow-hidden box-border">
            
            {/* Top Handle Bar */}
            <div 
              className="w-10 h-1 bg-zinc-700 hover:bg-zinc-500 rounded-full mx-auto shrink-0 cursor-pointer transition"
              onClick={() => setShowLotsBottomSheet(false)}
            />

            {/* Header Bar */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Gift className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">🎁 MES LOTS</h3>
                  <p className="text-[8px] text-zinc-400 font-normal">Vos récompenses remportées</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLotsBottomSheet(false)}
                className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Notifications / Feedback */}
            {activationSuccessMsg && (
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold text-center animate-fadeIn shrink-0">
                {activationSuccessMsg}
              </div>
            )}
            {activationErrorMsg && (
              <div className="p-2 rounded-lg bg-red-950/80 border border-red-500/50 text-red-300 text-[10px] font-bold text-center animate-fadeIn shrink-0">
                {activationErrorMsg}
              </div>
            )}

            {/* Lot List - No internal scroll overflow, compact items */}
            <div className="w-full space-y-1.5 overflow-hidden py-1">
              {userLots.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <Gift className="w-8 h-8 text-zinc-700 mx-auto" />
                  <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Vous n'avez pas encore de lot gagné</p>
                  <p className="text-[8px] text-zinc-500 max-w-xs mx-auto">Faites tourner la roue pour remporter du Premium et des privilèges !</p>
                </div>
              ) : (
                userLots.map((lot) => {
                  const isAvailable = lot.status === "AVAILABLE";
                  const isActivated = lot.status === "ACTIVATED";
                  const isExpired = lot.status === "EXPIRED";
                  const isUsed = lot.status === "USED";

                  return (
                    <div 
                      key={lot.id} 
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition shadow-md ${
                        isAvailable 
                          ? "bg-amber-950/20 border-amber-500/40" 
                          : isActivated
                          ? "bg-emerald-950/10 border-emerald-500/30"
                          : "bg-zinc-900/40 border-zinc-800 opacity-60"
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black text-white uppercase tracking-tight truncate">
                            {lot.rewardLabel}
                          </span>
                          {/* Status Badge */}
                          <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase ${
                            isAvailable 
                              ? "bg-amber-400/20 text-amber-300 border border-amber-400/30" 
                              : isActivated
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : isExpired
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {isAvailable ? "Disponible" : isActivated ? "Activé" : isExpired ? "Expiré" : "Utilisé"}
                          </span>
                        </div>

                        <p className="text-[8px] text-zinc-400 font-mono">
                          Gagné sur {lot.wheelName || "Roue AfriGombo"}
                        </p>
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0">
                        {isAvailable && (
                          <button
                            disabled={activatingLotId === lot.id}
                            onClick={() => handleActivateLot(lot)}
                            className="px-3 py-1 bg-[#D4AF37] hover:bg-amber-400 text-black font-black text-[9px] uppercase font-mono rounded-lg transition cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            {activatingLotId === lot.id ? "..." : "ACTIVER"}
                          </button>
                        )}
                        {isActivated && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[9px] font-bold font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Activé
                          </span>
                        )}
                        {(isExpired || isUsed) && (
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 text-[9px] font-mono">
                            {isExpired ? "Expiré" : "Utilisé"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Close Button */}
            <div className="pt-1.5 border-t border-zinc-900 shrink-0">
              <button
                onClick={() => setShowLotsBottomSheet(false)}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-black uppercase text-[9px] rounded-xl border border-zinc-800 transition cursor-pointer"
              >
                FERMER
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
