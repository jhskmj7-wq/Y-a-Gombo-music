import React, { useState, useEffect } from "react";
import { 
  Disc, Sparkles, AlertCircle, Award, Zap, Crown, RefreshCw, 
  ChevronRight, Info, History, X, Check, ShieldAlert, Ticket, Gift,
  Target, Coins, ShoppingBag, ArrowRight, Loader2, CheckCircle2
} from "lucide-react";
import { AfriGomboWheel, WheelSegment, WheelSpinRecord, UserExtraSpinRecord, GawaPack, GawaMission, UserGawaMission, GawaTransaction, UserLotRecord } from "../../types";
import { WheelEngineService } from "../../lib/WheelEngineService";
import { SecurityService } from "../../lib/SecurityService";
import { subscribeToFeatureFlags } from "../../lib/featureFlags";
import { GawaEngineService } from "../../lib/GawaEngineService";
import { getCanonicalWalletBalance } from "../../lib/financial";
import { db } from "../../firebase";
import { onSnapshot, doc } from "firebase/firestore";

interface GomboWheelSectionProps {
  currentUserProfile?: any;
  onRefreshProfile?: () => void;
  audioSynth?: any;
}

// Helper to format wheel segment labels cleanly without truncation
const formatWheelLabel = (label: string) => {
  if (!label) return "";
  let cleaned = label.trim();
  cleaned = cleaned.replace(/JOURS PREMIUM/i, "J PREMIUM");
  cleaned = cleaned.replace(/JOUR PREMIUM/i, "J PREMIUM");
  cleaned = cleaned.replace(/PARTICIPATION GRATUITE/i, "SPIN OFFERT");
  cleaned = cleaned.replace(/PARTICIPATION GRATUIT/i, "SPIN OFFERT");
  cleaned = cleaned.replace(/BOOST DE VISIBILITÉ/i, "BOOST VISIBILITÉ");
  return cleaned;
};

export default function GomboWheelSection({
  currentUserProfile,
  onRefreshProfile,
  audioSynth
}: GomboWheelSectionProps) {
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

  // 0. Subscribe to Global Feature Flags
  useEffect(() => {
    setFlagsLoading(true);
    const unsubFlags = subscribeToFeatureFlags((flags) => {
      const enabled = flags["wheel"] !== undefined ? flags["wheel"] : true;
      setIsWheelGlobalEnabled(enabled);
      setFlagsLoading(false);
    });

    return () => unsubFlags();
  }, []);

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

    const activeSegments = (currentWheel.segments || []).filter((s) => s.enabled);
    const numSegments = activeSegments.length || 1;

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

      // Find index of winning segment among active segments
      const winningSegIndex = activeSegments.findIndex((s) => s.id === res.winningSegment?.id);
      const segIndex = winningSegIndex >= 0 ? winningSegIndex : 0;
      
      const segAngle = 360 / numSegments;
      const targetSegmentCenter = (segIndex * segAngle) + (segAngle / 2);
      const extraRotations = 360 * 6; // 6 full turns for smooth visual slowdown
      const totalRotation = spinDegree + extraRotations + (360 - targetSegmentCenter);
      
      setSpinDegree(totalRotation);

      // Smooth animation transition (3.5 seconds)
      setTimeout(() => {
        setIsSpinning(false);
        const seg = res.winningSegment;
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
    <div className="w-full max-w-full overflow-x-hidden bg-[#050505] text-white py-6 sm:py-10 px-2 sm:px-6 font-sans box-border">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10 w-full max-w-full box-border">

        {/* HEADER */}
        <div className="text-center space-y-3 w-full max-w-full box-border">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-mono font-black uppercase tracking-widest shadow-lg shadow-[#D4AF37]/5">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>ÉCOSYSTÈME SOUVERAIN</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white font-mono flex flex-col items-center gap-1">
            <span className="text-[#D4AF37]">ROUE AFRIGOMBO & CENTRE GAWA</span>
            <span className="text-xs font-bold text-zinc-400">Lancez la roue avec vos jetons Gawa et gagnez des privilèges.</span>
          </h2>
        </div>

        {/* LOADING STATE */}
        {(loading || flagsLoading) && (
          <div className="p-12 bg-zinc-950/50 border border-zinc-800/50 rounded-[32px] text-center space-y-4 shadow-2xl flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
            <p className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">Initialisation de l'espace...</p>
          </div>
        )}

        {/* MAIN CONTAINER */}
        {!loading && !flagsLoading && (isWheelGlobalEnabled || isFounder) && currentWheel && (
          <div className="space-y-6 sm:space-y-10 animate-fadeIn w-full max-w-full box-border">
            
            {/* ========================================================= */}
            {/* 1. CONTAINER ROUE (FIRST AT THE VERY TOP) */}
            {/* ========================================================= */}
            <div className="bg-zinc-950 border border-[#D4AF37]/30 rounded-[24px] sm:rounded-[36px] p-4 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden flex flex-col items-center w-full max-w-full box-border">
              <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-[#D4AF37]/5 rounded-full blur-[80px] pointer-events-none" />

              {/* Header Bar: Wheel Title & GAWA Balance */}
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-zinc-900 font-mono">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                    🎡 TIRAGE GAWA SOUVERAIN
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                    {currentWheel?.name || "Roue AfriGombo"}
                  </h3>
                </div>

                {/* Current GAWA Balance Badge */}
                <div className="bg-amber-950/40 border border-amber-400/50 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/10">
                  <Zap className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0 animate-pulse" />
                  <span className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-tight">
                    {(gawaWallet?.soldeGawa || 0).toLocaleString()} GAWA
                  </span>
                </div>
              </div>

              {/* Compact Clickable Access Bars for Centre Gawa & Mes Lots */}
              <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 box-border">
                {/* Need Gawa Button */}
                <button
                  onClick={() => {
                    setGawaActiveTab("buy");
                    setShowGawaBottomSheet(true);
                  }}
                  className="flex-1 min-w-[180px] py-2.5 px-3.5 bg-zinc-900/80 hover:bg-amber-950/30 border border-amber-500/30 hover:border-amber-400/60 rounded-2xl flex items-center justify-between transition cursor-pointer group font-mono text-xs shadow-md"
                >
                  <div className="flex items-center gap-2 text-amber-300 group-hover:text-amber-200 font-bold text-[11px] sm:text-xs min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                    <span className="truncate">✨ Besoin de Gawa ? Venez en chercher.</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400/70 group-hover:text-amber-400 group-hover:translate-x-0.5 transition shrink-0 ml-1" />
                </button>

                {/* Mes Lots Button */}
                <button
                  onClick={() => setShowLotsBottomSheet(true)}
                  className="py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/40 hover:border-amber-400/80 text-amber-400 hover:text-amber-300 rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer font-mono text-xs font-bold shrink-0 shadow-md active:scale-95"
                >
                  <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>🎁 Mes lots</span>
                  {userLots.filter(l => l.status === "AVAILABLE").length > 0 && (
                    <span className="ml-0.5 px-2 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black animate-pulse">
                      {userLots.filter(l => l.status === "AVAILABLE").length}
                    </span>
                  )}
                </button>
              </div>

              {/* Wheels Selection Tabs */}
              {wheels.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 w-full max-w-full justify-start sm:justify-center px-1 box-border">
                  {wheels.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => {
                        if (!isSpinning) {
                          setSelectedWheelId(w.id);
                          setSpinResult(null);
                          setSpinError(null);
                          setInsufficientGawaState(null);
                        }
                      }}
                      className={`px-4 sm:px-5 py-2.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition shrink-0 cursor-pointer border ${
                        currentWheel?.id === w.id
                          ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20"
                          : "bg-zinc-900/60 text-zinc-400 hover:text-white border-zinc-800"
                      }`}
                    >
                      {w.type || w.name} ({w.cost} GAWA)
                    </button>
                  ))}
                </div>
              )}

              {/* Cost Badge */}
              <div className="px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[#D4AF37] text-[11px] font-mono font-black uppercase tracking-wider shadow-inner">
                ⚡ COÛT DU LANCEMENT : {hasExtraSpinToken ? "0 GAWA (Spin Offert)" : `${currentWheel?.cost || 20} GAWA`}
              </div>

              {/* Visual Wheel Stage */}
              <div className="relative flex flex-col items-center justify-center py-2 w-full max-w-full">
                {/* Top Pointer Arrow */}
                <div className="absolute top-0 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-[#D4AF37] drop-shadow-[0_4px_10px_rgba(212,175,55,0.8)]" />

                {/* Rotating Wheel Circle */}
                <div 
                  className="w-[min(72vw,280px)] h-[min(72vw,280px)] aspect-square rounded-full border-[5px] sm:border-[6px] border-[#D4AF37] shadow-[0_0_50px_rgba(212,175,55,0.2)] relative overflow-hidden flex items-center justify-center transition-transform duration-[3500ms] cubic-bezier(0.15, 0.9, 0.25, 1) mx-auto"
                  style={{ transform: `rotate(${spinDegree}deg)` }}
                >
                  {(currentWheel?.segments || []).filter((s) => s.enabled).map((seg, idx, arr) => {
                    const totalSegs = arr.length || 1;
                    const angle = (360 / totalSegs) * idx;
                    return (
                      <div
                        key={seg.id || idx}
                        className="absolute w-full h-full top-0 left-0 flex items-center justify-center pointer-events-none"
                        style={{ transform: `rotate(${angle}deg)` }}
                      >
                        <div 
                          className="absolute top-3 sm:top-5 text-[8px] sm:text-[10px] font-black uppercase tracking-tight text-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-md text-center max-w-[75px] sm:max-w-[90px] truncate"
                          style={{ backgroundColor: seg.color || "#D4AF37" }}
                        >
                          {formatWheelLabel(seg.label)}
                        </div>
                      </div>
                    );
                  })}

                  {/* Center Hub */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-950 border-2 sm:border-4 border-[#D4AF37] z-10 flex flex-col items-center justify-center shadow-2xl">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] animate-pulse" />
                    <span className="text-[7px] sm:text-[8px] font-black text-[#D4AF37] tracking-widest mt-0.5 font-mono">GAWA</span>
                  </div>
                </div>

                {/* Action Button: Directly spins, NO modal popup */}
                <div className="mt-8 w-full max-w-xs space-y-3">
                  <button
                    onClick={handleExecuteSpin}
                    disabled={isSpinning || remainingDailySpins <= 0}
                    className={`w-full py-4 px-6 rounded-[22px] font-black uppercase text-xs font-mono tracking-wider transition cursor-pointer flex items-center justify-center gap-2.5 shadow-2xl ${
                      isSpinning || remainingDailySpins <= 0
                        ? "bg-zinc-900 text-zinc-600 border border-zinc-800"
                        : "bg-[#D4AF37] hover:bg-amber-400 text-black shadow-[#D4AF37]/30 border border-[#D4AF37] active:scale-95"
                    }`}
                  >
                    <Disc className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`} />
                    <span>{isSpinning ? "Tirage en cours..." : "LANCER LA ROUE"}</span>
                  </button>
                  
                  <div className="flex items-center justify-center gap-6">
                    <button onClick={() => setShowRulesModal(true)} className="text-[10px] font-black text-zinc-400 uppercase hover:text-[#D4AF37] transition font-mono tracking-tighter cursor-pointer">Règles</button>
                    <button onClick={() => setShowHistoryModal(true)} className="text-[10px] font-black text-zinc-400 uppercase hover:text-[#D4AF37] transition font-mono tracking-tighter cursor-pointer">Historique</button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {spinError && (
                <div className="w-full p-4 bg-red-950/60 border border-red-500/40 rounded-2xl text-red-400 text-xs font-mono font-bold text-center flex items-center justify-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{spinError}</span>
                </div>
              )}

              {/* Insufficient GAWA Area */}
              {insufficientGawaState && (
                <div className="w-full p-5 bg-amber-950/40 border border-amber-500/50 rounded-2xl text-center space-y-3 font-mono animate-slideUp">
                  <div className="flex items-center justify-center gap-2 text-amber-400 font-black text-sm uppercase">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                    <span>Gawa insuffisants</span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Il vous manque <span className="font-black text-amber-400">{insufficientGawaState.missingGawa} GAWA</span> pour lancer la {currentWheel?.name || "roue"}.
                  </p>
                  <button
                    onClick={() => {
                      setGawaActiveTab("buy");
                      setShowGawaBottomSheet(true);
                    }}
                    className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase rounded-xl tracking-wider shadow-lg shadow-amber-400/20 transition cursor-pointer"
                  >
                    Acheter des Gawa
                  </button>
                </div>
              )}

              {/* Direct Result Banner Display after Stop */}
              {spinResult?.winningSegment && (
                <div className="w-full p-6 bg-zinc-900/90 border border-[#D4AF37]/50 rounded-3xl text-center space-y-3 font-mono animate-fadeIn shadow-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>🎉 RÉSULTAT DU TIRAGE</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#D4AF37] uppercase tracking-tight">
                    « {spinResult.winningSegment.label} »
                  </h3>
                  <p className="text-xs text-zinc-300 max-w-sm mx-auto">
                    {spinResult.winningSegment.type === "PREMIUM_DAYS"
                      ? `+${spinResult.winningSegment.rewardValue} jour(s) Premium crédités à votre compte !`
                      : spinResult.winningSegment.type === "EXTRA_SPIN"
                      ? "Un ticket de tirage bonus vous a été offert !"
                      : "Félicitations pour votre participation à l'écosystème Gombo."}
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODALS SECTION */}
      {/* ========================================================= */}
      
      {/* Gawa Purchase Confirmation Modal */}
      {selectedPack && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-[#0B0B0C] border border-[#D4AF37]/30 rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 w-full max-w-sm space-y-5 text-center shadow-2xl relative overflow-hidden box-border">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
             
             <div className="p-3.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 w-14 h-14 flex items-center justify-center mx-auto mb-1">
                <ShoppingBag className="w-7 h-7" />
             </div>

             <div className="space-y-1">
                <h3 className="text-sm font-black text-amber-400 uppercase font-mono tracking-widest">Confirmer l'achat</h3>
                <p className="text-xs text-white font-mono font-bold uppercase tracking-tight">
                  {selectedPack.name} • +{selectedPack.gawaAmount} GAWA
                </p>
             </div>

             {/* Financial details breakdown */}
             <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-900 space-y-2 text-left font-mono">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-bold text-zinc-400 uppercase">Prix du Pack</span>
                   <span className="text-sm font-black text-[#D4AF37]">{selectedPack.priceFCFA.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-900">
                   <span className="text-[10px] text-zinc-400 uppercase">Solde FCFA Actuel</span>
                   <span className="text-xs font-bold text-white">{(gawaWallet?.soldeDisponible || 0).toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] text-zinc-400 uppercase">Solde FCFA Après</span>
                   <span className="text-xs font-bold text-amber-400">
                     {Math.max(0, (gawaWallet?.soldeDisponible || 0) - selectedPack.priceFCFA).toLocaleString()} FCFA
                   </span>
                </div>
             </div>

             {/* Error Message */}
             {error && (
               <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-400 text-[10px] font-mono font-bold text-center flex items-center justify-center gap-2">
                 <AlertCircle className="w-4 h-4 shrink-0" />
                 <span>{error}</span>
               </div>
             )}

             <div className="flex gap-3 pt-1">
                <button
                  disabled={purchasing}
                  onClick={() => { setSelectedPack(null); setError(null); }}
                  className="flex-1 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl text-[10px] font-black uppercase font-mono tracking-wider border border-zinc-800 cursor-pointer transition disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  disabled={purchasing}
                  onClick={() => handleBuyPack(selectedPack)}
                  className="flex-1 py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-black rounded-xl text-[10px] font-black uppercase font-mono tracking-wider shadow-lg shadow-amber-400/20 cursor-pointer transition flex items-center justify-center gap-2"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Traitement...</span>
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
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-[#0B0B0C] border border-emerald-500/30 rounded-[40px] p-10 w-full max-w-sm space-y-6 text-center shadow-2xl">
             <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 mb-2">
                <Check className="w-10 h-10 stroke-[3]" />
             </div>
             <div className="space-y-1">
                <h3 className="text-lg font-black text-emerald-400 uppercase font-mono tracking-widest">Achat Réussi !</h3>
                <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                  +{successDetails.amount} Gawa ont été ajoutés à votre compte.
                </p>
             </div>
             <button
               onClick={() => setSuccessDetails(null)}
               className="w-full py-4 bg-emerald-600 text-white rounded-[24px] text-[10px] font-black uppercase font-mono tracking-widest shadow-xl shadow-emerald-600/20 cursor-pointer"
             >
               EXCELLENT
             </button>
          </div>
        </div>
      )}

      {/* Mystery Box Modal */}
      {spinResult?.winningSegment?.type === "SURPRISE_BOX" && showMysteryBox && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#0B0B0C] border-t-2 sm:border-2 border-[#D4AF37]/50 rounded-t-[48px] sm:rounded-[48px] p-10 w-full max-w-md space-y-8 shadow-2xl text-white font-mono text-center relative overflow-hidden animate-slideUp">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="inline-flex p-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 shadow-xl animate-bounce">
              <Gift className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-black text-[#D4AF37] uppercase tracking-wider">🎁 BOÎTE MYSTÈRE</h3>
            {!mysteryBoxOpened ? (
              <div className="space-y-6">
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto font-medium">Un gain exclusif est caché à l'intérieur de cette boîte souveraine.</p>
                <div 
                  onClick={() => { setMysteryBoxOpened(true); try { audioSynth?.playValidationSuccess?.(); } catch (e) {} }}
                  className="p-10 bg-zinc-950 border-4 border-dashed border-[#D4AF37]/30 rounded-[32px] cursor-pointer hover:border-[#D4AF37] transition group shadow-2xl"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition transform">📦</div>
                  <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block">DÉCELLER LE MYSTÈRE</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-6 bg-zinc-950 border border-emerald-500/40 rounded-[32px] space-y-2 shadow-inner">
                  <span className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.2em] block">RÉVÉLATION :</span>
                  <div className="text-xl font-black text-white tracking-tight">
                    {currentWheel?.type === "ELITE" ? "🏆 14 Jours Premium Elite" : "👑 7 Jours Premium"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMysteryBox(false)}
                  className="w-full py-5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-[10px] rounded-[24px] shadow-2xl shadow-[#D4AF37]/20 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#0B0B0C] border-t sm:border border-zinc-800 rounded-t-[40px] sm:rounded-[40px] p-10 w-full max-w-md space-y-6 shadow-2xl text-white font-mono max-h-[85vh] flex flex-col animate-slideUp">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
              <h3 className="text-base font-black uppercase text-[#D4AF37] tracking-tight">Règles du Tirage</h3>
              <button onClick={() => setShowRulesModal(false)} className="text-zinc-600 hover:text-white transition cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-6 text-xs text-zinc-400 leading-relaxed pr-2 scrollbar-none">
              <div className="p-6 bg-zinc-950 rounded-[32px] border border-zinc-900 space-y-3">
                <span className="font-black text-white uppercase block">{currentWheel.name}</span>
                <p>{currentWheel.rulesText || "Chaque tirage est certifié par l'algorithme Souverain d'AFRIGOMBO garantissant équité et transparence."}</p>
              </div>
              <div className="space-y-4 bg-zinc-950/50 p-6 rounded-[32px] border border-zinc-900">
                <span className="font-black text-zinc-300 block uppercase tracking-widest text-[9px]">Conditions de Participation</span>
                <ul className="space-y-3">
                   <li className="flex gap-3">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Coût : {currentWheel.cost} GAWA par spin.</span>
                   </li>
                   <li className="flex gap-3">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Limite : {currentWheel.maxDailyParticipations || "Aucune"} participation(s) par jour.</span>
                   </li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-4 bg-zinc-900 text-zinc-400 font-black uppercase text-[10px] rounded-[24px] border border-zinc-800 hover:text-white transition cursor-pointer"
            >
              FERMER
            </button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#0B0B0C] border-t sm:border border-zinc-800 rounded-t-[40px] sm:rounded-[40px] p-10 w-full max-w-lg space-y-6 shadow-2xl text-white font-mono max-h-[85vh] flex flex-col animate-slideUp">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
              <h3 className="text-base font-black uppercase text-[#D4AF37] tracking-tight">Historique des Tirages</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-zinc-600 hover:text-white transition cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-3 pr-2 scrollbar-none">
               {userSpins.length === 0 ? (
                 <div className="py-20 text-center text-zinc-700 uppercase font-black text-[10px] tracking-widest">Aucun tirage récent</div>
               ) : (
                 userSpins.map(sp => (
                   <div key={sp.spinId} className="p-5 bg-zinc-950 border border-zinc-900 rounded-[24px] flex items-center justify-between">
                      <div className="space-y-1">
                         <div className="font-black text-white uppercase text-[11px] tracking-tight">{sp.rewardLabel}</div>
                         <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">{new Date(sp.createdAt).toLocaleDateString("fr-FR")}</div>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] font-black text-[#D4AF37] uppercase">{sp.cost} GAWA</div>
                         <div className="text-[8px] font-black text-emerald-600 uppercase">{sp.status}</div>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}

      {/* CENTRE GAWA BOTTOM SHEET */}
      {showGawaBottomSheet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-fadeIn">
          {/* Backdrop click to close */}
          <div 
            className="flex-1 w-full" 
            onClick={() => setShowGawaBottomSheet(false)} 
          />

          {/* Bottom Sheet Panel */}
          <div className="bg-[#0B0B0C] border-t-2 border-[#D4AF37]/40 rounded-t-[32px] sm:rounded-t-[40px] p-4 sm:p-6 w-full max-w-xl mx-auto space-y-4 shadow-2xl text-white font-mono max-h-[88vh] flex flex-col animate-slideUp relative box-border overflow-hidden">
            
            {/* Top Pull Handle */}
            <div 
              className="w-12 h-1.5 bg-zinc-700 hover:bg-zinc-500 rounded-full mx-auto shrink-0 cursor-pointer transition"
              onClick={() => setShowGawaBottomSheet(false)}
            />

            {/* Header Bar */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider">CENTRE GAWA</h3>
                  <p className="text-[10px] text-zinc-400 font-normal">Rechargez vos jetons pour lancer les roues</p>
                </div>
              </div>

              {/* Dual Wallet Display Bar */}
              <div className="flex items-center gap-2">
                {/* FCFA Wallet */}
                <div className="bg-zinc-900 border border-amber-500/30 px-2.5 py-1 rounded-xl text-right">
                  <span className="text-[8px] font-black text-amber-500 uppercase block">Wallet FCFA</span>
                  <span className="text-[10px] font-black text-white">{(gawaWallet?.soldeDisponible || 0).toLocaleString()} FCFA</span>
                </div>
                {/* Solde GAWA */}
                <div className="bg-amber-950/40 border border-amber-400/50 px-2.5 py-1 rounded-xl text-right">
                  <span className="text-[8px] font-black text-amber-400 uppercase block">Solde GAWA</span>
                  <span className="text-[10px] font-black text-amber-400 flex items-center justify-end gap-0.5">
                    <Zap className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                    {(gawaWallet?.soldeGawa || 0).toLocaleString()} GAWA
                  </span>
                </div>
                <button 
                  onClick={() => setShowGawaBottomSheet(false)}
                  className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0 ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs (Acheter / Missions / Historique) */}
            <div className="flex items-center justify-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 w-full shrink-0">
              {[
                { id: "buy", label: "🛒 ACHETER GAWA" },
                { id: "missions", label: "🎯 MISSIONS" },
                { id: "history", label: "📜 HISTORIQUE" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setGawaActiveTab(tab.id as any)}
                  className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider transition whitespace-nowrap cursor-pointer ${
                    gawaActiveTab === tab.id ? "bg-amber-400 text-black shadow-md shadow-amber-400/20" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Tab Content */}
            <div className="overflow-y-auto flex-1 space-y-3 pr-1 scrollbar-none min-h-[220px]">
              {/* BUY TAB (Packs) */}
              {gawaActiveTab === "buy" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full box-border pt-1">
                  {gawaPacks.map(pack => (
                    <div key={pack.id} className="p-4 bg-zinc-900/60 border border-zinc-800 hover:border-amber-400/40 rounded-[20px] space-y-3 text-center transition shadow-lg flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">{pack.name}</span>
                        <p className="text-2xl font-black text-amber-400 tracking-tighter">+{pack.gawaAmount} GAWA</p>
                      </div>
                      <button
                        onClick={() => { setSelectedPack(pack); setError(null); }}
                        className="w-full py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black rounded-xl text-[10px] uppercase tracking-wider transition cursor-pointer shadow-md shadow-[#D4AF37]/10 active:scale-95"
                      >
                        Acheter ({pack.priceFCFA.toLocaleString()} FCFA)
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* MISSIONS TAB */}
              {gawaActiveTab === "missions" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full box-border pt-1">
                  {missions.map(m => {
                    const done = userMissions.some(um => um.missionId === m.id);
                    return (
                      <div key={m.id} className={`p-4 bg-zinc-900/40 border border-zinc-800 rounded-[20px] flex flex-col justify-between gap-3 transition hover:border-[#D4AF37]/30 ${done ? "opacity-60" : ""}`}>
                        <div className="space-y-1">
                           <div className="flex items-center justify-between">
                              <span className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[#D4AF37]">
                                 <Target className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-xs font-black text-amber-400">+{m.rewardGawa} GAWA</span>
                           </div>
                           <h4 className="text-xs font-black text-white uppercase tracking-tight">{m.title}</h4>
                           <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2">{m.description}</p>
                        </div>
                        <button
                          disabled={done || evaluatingMissions[m.id]}
                          onClick={() => handleClaimMission(m)}
                          className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition cursor-pointer ${
                            done 
                              ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed" 
                              : "bg-[#D4AF37] hover:bg-amber-400 text-black shadow-md"
                          }`}
                        >
                          {evaluatingMissions[m.id] ? "Vérification..." : done ? "Terminé" : "Réclamer"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* HISTORY TAB */}
              {gawaActiveTab === "history" && (
                <div className="space-y-2 w-full box-border pt-1">
                  {gawaHistory.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                       <History className="w-8 h-8 text-zinc-700 mx-auto" />
                       <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Aucun historique GAWA</p>
                    </div>
                  ) : (
                    gawaHistory.map(tx => (
                      <div key={tx.id} className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-[16px] flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                           <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
                              <Coins className="w-3.5 h-3.5" />
                           </div>
                           <div className="min-w-0 truncate">
                              <p className="text-[10px] font-black text-white uppercase tracking-tight truncate">{tx.description}</p>
                              <p className="text-[8px] text-zinc-500 uppercase tracking-widest">{new Date(tx.createdAt).toLocaleDateString("fr-FR")} • {new Date(tx.createdAt).toLocaleTimeString("fr-FR")}</p>
                           </div>
                        </div>
                        <span className={`font-black text-xs shrink-0 ${tx.amount > 0 ? "text-amber-400" : "text-zinc-400"}`}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount} GAWA
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer Close Button */}
            <div className="pt-2 border-t border-zinc-900 shrink-0">
              <button
                onClick={() => setShowGawaBottomSheet(false)}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-black uppercase text-[10px] rounded-2xl border border-zinc-800 transition cursor-pointer"
              >
                FERMER
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. BOTTOM SHEET "MES LOTS" */}
      {/* ========================================================= */}
      {showLotsBottomSheet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-fadeIn">
          {/* Backdrop Overlay Click to Close */}
          <div 
            className="flex-1 w-full cursor-pointer" 
            onClick={() => setShowLotsBottomSheet(false)} 
          />

          {/* Bottom Sheet Container */}
          <div className="bg-[#0B0B0C] border-t-2 border-[#D4AF37]/40 rounded-t-[32px] sm:rounded-t-[40px] p-4 sm:p-6 w-full max-w-xl mx-auto space-y-4 shadow-2xl text-white font-mono max-h-[88vh] flex flex-col animate-slideUp relative box-border overflow-hidden">
            
            {/* Top Handle Bar */}
            <div 
              className="w-12 h-1.5 bg-zinc-700 hover:bg-zinc-500 rounded-full mx-auto shrink-0 cursor-pointer transition"
              onClick={() => setShowLotsBottomSheet(false)}
            />

            {/* Header Bar */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-amber-400 uppercase tracking-wider">🎁 MES LOTS</h3>
                  <p className="text-[10px] text-zinc-400 font-normal">Vos privilèges et récompenses remportés à la roue</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLotsBottomSheet(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notifications / Feedback */}
            {activationSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold text-center animate-fadeIn shrink-0">
                {activationSuccessMsg}
              </div>
            )}
            {activationErrorMsg && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-bold text-center animate-fadeIn shrink-0">
                {activationErrorMsg}
              </div>
            )}

            {/* Scrollable Lot List */}
            <div className="overflow-y-auto flex-1 space-y-3 pr-1 scrollbar-none min-h-[220px]">
              {userLots.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Gift className="w-10 h-10 text-zinc-700 mx-auto" />
                  <p className="text-xs text-zinc-400 uppercase font-black tracking-widest">Vous n'avez pas encore de lot gagné</p>
                  <p className="text-[10px] text-zinc-500 max-w-xs mx-auto">Faites tourner la roue pour remporter du Premium, des Boosts et des récompenses exclusives !</p>
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
                      className={`p-4 rounded-[20px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition shadow-lg ${
                        isAvailable 
                          ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-400" 
                          : isActivated
                          ? "bg-emerald-950/10 border-emerald-500/30"
                          : "bg-zinc-900/40 border-zinc-800 opacity-60"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-white uppercase tracking-tight">
                            {lot.rewardLabel}
                          </span>
                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isAvailable 
                              ? "bg-amber-400/20 text-amber-300 border border-amber-400/30 animate-pulse" 
                              : isActivated
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : isExpired
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {isAvailable ? "Disponible" : isActivated ? "Activé" : isExpired ? "Expiré" : "Utilisé"}
                          </span>
                        </div>

                        <p className="text-[10px] text-zinc-400 font-mono">
                          Gagné sur {lot.wheelName || "Roue AfriGombo"} • {new Date(lot.createdAt).toLocaleDateString("fr-FR")}
                        </p>

                        {isActivated && lot.expiresAt && (
                          <p className="text-[9px] text-emerald-400 font-bold font-mono">
                            Expire le : {new Date(lot.expiresAt).toLocaleDateString("fr-FR")} à {new Date(lot.expiresAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0 pt-1 sm:pt-0">
                        {isAvailable && (
                          <button
                            disabled={activatingLotId === lot.id}
                            onClick={() => handleActivateLot(lot)}
                            className="w-full sm:w-auto px-5 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black text-xs uppercase font-mono rounded-xl tracking-wider shadow-md shadow-[#D4AF37]/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            {activatingLotId === lot.id ? "Activation..." : "ACTIVER"}
                          </button>
                        )}
                        {isActivated && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Activé
                          </span>
                        )}
                        {isExpired && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-bold font-mono">
                            Expiré
                          </span>
                        )}
                        {isUsed && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-bold font-mono">
                            Utilisé
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Close Button */}
            <div className="pt-2 border-t border-zinc-900 shrink-0">
              <button
                onClick={() => setShowLotsBottomSheet(false)}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-black uppercase text-[10px] rounded-2xl border border-zinc-800 transition cursor-pointer"
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
