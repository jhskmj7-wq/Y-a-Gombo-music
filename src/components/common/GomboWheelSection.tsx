import React, { useState, useEffect } from "react";
import { 
  Disc, Sparkles, AlertCircle, Award, Zap, Crown, RefreshCw, 
  ChevronRight, Info, History, X, Check, ShieldAlert, Ticket, Gift,
  Target, Coins, ShoppingBag, ArrowRight, Loader2
} from "lucide-react";
import { AfriGomboWheel, WheelSegment, WheelSpinRecord, UserExtraSpinRecord, GawaPack, GawaMission, UserGawaMission, GawaTransaction } from "../../types";
import { WheelEngineService } from "../../lib/WheelEngineService";
import { SecurityService } from "../../lib/SecurityService";
import { subscribeToFeatureFlags } from "../../lib/featureFlags";
import { GawaEngineService } from "../../lib/GawaEngineService";
import { db } from "../../firebase";
import { onSnapshot, doc, collection, query, where, orderBy, limit } from "firebase/firestore";

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
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Gawa State
  const [gawaActiveTab, setGawaActiveTab] = useState<"missions" | "buy" | "history">("missions");
  const [gawaWallet, setGawaWallet] = useState<any>(null);
  const [gawaPacks, setGawaPacks] = useState<GawaPack[]>([]);
  const [gawaHistory, setGawaHistory] = useState<GawaTransaction[]>([]);
  const [missions, setMissions] = useState<GawaMission[]>([]);
  const [userMissions, setUserMissions] = useState<UserGawaMission[]>([]);
  const [gawaLoading, setGawaLoading] = useState(true);
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
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
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
        // Default to first active wheel if none selected
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

  // 2. Subscribe to User Spin History & Extra Spins
  useEffect(() => {
    if (!userId) return;

    const unsubHistory = WheelEngineService.subscribeUserSpinHistory(userId, (spins) => {
      setUserSpins(spins);
    });

    const unsubExtra = WheelEngineService.subscribeUserExtraSpins(userId, (tokens) => {
      setUserExtraSpins(tokens);
    });

    return () => {
      unsubHistory();
      unsubExtra();
    };
  }, [userId]);

  // 3. Gawa Data Subscription
  useEffect(() => {
    if (!userId) return;

    // Subscribe to User Wallet
    const unsubWallet = onSnapshot(doc(db, "users", userId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGawaWallet(data.wallet || { soldeDisponible: data.walletBalance || 0, soldeGawa: 0 });
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
    const qHistory = query(
      collection(db, "gawaHistory"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const unsubHistory = onSnapshot(qHistory, (snap) => {
      const records = snap.docs.map(d => ({ id: d.id, ...d.data() })) as GawaTransaction[];
      setGawaHistory(records);
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
      } finally {
        setGawaLoading(false);
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

  // Handle Wheel Spin execution
  const handleExecuteSpin = async () => {
    if (!currentWheel || !userId) {
      setSpinError("Veuillez vous connecter pour participer au tirage.");
      return;
    }

    setShowConfirmModal(false);
    setIsSpinning(true);
    setSpinError(null);
    setSpinResult(null);

    try { audioSynth?.playNotification?.(); } catch (e) {}

    // Calculate degree to land on winning segment
    const activeSegments = (currentWheel.segments || []).filter((s) => s.enabled);
    const numSegments = activeSegments.length || 1;

    // Trigger WheelEngineService.spinWheel
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
        setSpinError(res.error || "Échec du tirage. Veuillez réessayer.");
        try { audioSynth?.playError?.(); } catch (e) {}
        return;
      }

      // Find index of winning segment among active segments
      const winningSegIndex = activeSegments.findIndex((s) => s.id === res.winningSegment?.id);
      const segIndex = winningSegIndex >= 0 ? winningSegIndex : 0;
      
      // Calculate angle: segment angle = 360 / numSegments
      const segAngle = 360 / numSegments;
      // Target angle so pointer (top) points to target segment
      const targetSegmentCenter = (segIndex * segAngle) + (segAngle / 2);
      const randomExtraTurns = 360 * 5; // 5 full turns
      const totalRotation = spinDegree + randomExtraTurns + (360 - targetSegmentCenter);
      
      setSpinDegree(totalRotation);

      // Wait for spin animation duration (3.5 seconds)
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

  // RENDER STATES
  return (
    <div className="w-full bg-[#050505] text-white border-t border-[#D4AF37]/20 py-12 px-4 sm:px-8 font-sans min-h-screen">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* SECTION HEADER & SUBTITLE */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-mono font-black uppercase tracking-widest shadow-lg shadow-[#D4AF37]/5">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>ÉCOSYSTÈME SOUVERAIN</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white font-mono flex flex-col items-center gap-1">
            <span className="text-[#D4AF37]">ROUE & GAWA</span>
            <span className="text-sm font-bold text-zinc-500">Tirez la roue, gagnez des Gawa, progressez.</span>
          </h2>
        </div>

        {/* STATE 1: LOADING */}
        {(loading || flagsLoading) && (
          <div className="p-16 bg-zinc-950/50 border border-zinc-800/50 rounded-[40px] text-center space-y-5 shadow-2xl flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
            <p className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">Initialisation de l'espace...</p>
          </div>
        )}

        {/* MAIN INTERACTIVE CONTAINER - ANDROID STYLE (AIRY & LONG) */}
        {!loading && !flagsLoading && (isWheelGlobalEnabled || isFounder) && currentWheel && (
          <div className="space-y-10 animate-fadeIn">
            
            {/* WHEEL CARD */}
            <div className="bg-zinc-950 border border-[#D4AF37]/20 rounded-[40px] p-8 sm:p-12 space-y-10 shadow-2xl relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[80px] pointer-events-none" />

              {/* Wheels Selection Tabs if multiple active wheels exist */}
              {wheels.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-2 w-full justify-center">
                  {wheels.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => {
                        if (!isSpinning) {
                          setSelectedWheelId(w.id);
                          setSpinResult(null);
                          setSpinError(null);
                        }
                      }}
                      className={`px-5 py-3 rounded-2xl text-[10px] font-mono font-black uppercase tracking-wider transition shrink-0 cursor-pointer border ${
                        currentWheel.id === w.id
                          ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-xl shadow-[#D4AF37]/20"
                          : "bg-zinc-900/50 text-zinc-500 hover:text-white border-zinc-800"
                      }`}
                    >
                      {w.type}
                    </button>
                  ))}
                </div>
              )}

              {/* Visual Interactive Wheel Stage */}
              <div className="relative flex flex-col items-center justify-center py-6">
                {/* Top Pointer Arrow */}
                <div className="absolute top-0 z-20 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-[#D4AF37] drop-shadow-[0_4px_12px_rgba(212,175,55,0.8)]" />

                {/* Rotating Wheel Circle */}
                <div 
                  className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border-[6px] border-[#D4AF37] shadow-[0_0_60px_rgba(212,175,55,0.15)] relative overflow-hidden flex items-center justify-center transition-transform duration-[3500ms] cubic-bezier(0.15, 0.9, 0.25, 1)"
                  style={{ transform: `rotate(${spinDegree}deg)` }}
                >
                  {(currentWheel.segments || []).filter((s) => s.enabled).map((seg, idx, arr) => {
                    const totalSegs = arr.length || 1;
                    const angle = (360 / totalSegs) * idx;
                    return (
                      <div
                        key={seg.id || idx}
                        className="absolute w-full h-full top-0 left-0 flex items-center justify-center pointer-events-none"
                        style={{
                          transform: `rotate(${angle}deg)`,
                        }}
                      >
                        <div 
                          className="absolute top-4 sm:top-5 text-[9px] sm:text-[10px] font-black uppercase tracking-tight text-black px-2 py-1 rounded shadow-md text-center max-w-[90px] truncate"
                          style={{ backgroundColor: seg.color || "#D4AF37" }}
                        >
                          {formatWheelLabel(seg.label)}
                        </div>
                      </div>
                    );
                  })}

                  {/* Center Hub */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-zinc-950 border-4 border-[#D4AF37] z-10 flex flex-col items-center justify-center shadow-2xl">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37] animate-pulse" />
                    <span className="text-[8px] font-black text-[#D4AF37] tracking-widest mt-1 font-mono">ELITE</span>
                  </div>
                </div>

                {/* Action Button Integrated below wheel */}
                <div className="mt-12 w-full max-w-xs space-y-4">
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={isSpinning || remainingDailySpins <= 0}
                    className={`w-full py-5 px-8 rounded-[24px] font-black uppercase text-xs font-mono tracking-widest transition cursor-pointer flex items-center justify-center gap-3 shadow-2xl ${
                      isSpinning || remainingDailySpins <= 0
                        ? "bg-zinc-900 text-zinc-600 border border-zinc-800"
                        : "bg-[#D4AF37] hover:bg-amber-400 text-black shadow-[#D4AF37]/30 border border-[#D4AF37] active:scale-95"
                    }`}
                  >
                    <Disc className={`w-5 h-5 ${isSpinning ? "animate-spin" : ""}`} />
                    <span>{isSpinning ? "Tirage..." : "LANCER LE DESTIN"}</span>
                  </button>
                  
                  <div className="flex items-center justify-center gap-6">
                    <button onClick={() => setShowRulesModal(true)} className="text-[10px] font-black text-zinc-500 uppercase hover:text-[#D4AF37] transition font-mono tracking-tighter">Règles</button>
                    <button onClick={() => setShowHistoryModal(true)} className="text-[10px] font-black text-zinc-500 uppercase hover:text-[#D4AF37] transition font-mono tracking-tighter">Historique</button>
                  </div>
                </div>
              </div>
            </div>

            {/* GAWA CENTER INTEGRATION - IMMEDIATELY ACCESSIBLE */}
            <div className="bg-zinc-950 border border-zinc-800/50 rounded-[40px] p-8 sm:p-12 space-y-10 shadow-2xl">
              
              {/* Gawa Header & Balance */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-zinc-900">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-xl font-black text-white uppercase font-mono tracking-tight flex items-center gap-3 justify-center sm:justify-start">
                    <Coins className="w-6 h-6 text-amber-400" />
                    CENTRE GAWA
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">Votre monnaie virtuelle AFRIGOMBO souveraine.</p>
                </div>

                <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800">
                   <div className="text-right space-y-0.5">
                      <span className="text-[9px] font-mono font-black text-zinc-600 uppercase block tracking-widest">Solde Gawa</span>
                      <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">{(gawaWallet?.soldeGawa || 0).toLocaleString()} G</div>
                   </div>
                   <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
                      <Zap className="w-5 h-5 fill-amber-400/20" />
                   </div>
                </div>
              </div>

              {/* Gawa Tabs Navigation */}
              <div className="flex items-center justify-center gap-2 bg-zinc-900/30 p-1.5 rounded-[24px] border border-zinc-900 max-w-sm mx-auto">
                {["missions", "buy", "history"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setGawaActiveTab(tab as any)}
                    className={`flex-1 py-3 rounded-[20px] text-[10px] font-black uppercase font-mono tracking-widest transition ${
                      gawaActiveTab === tab ? "bg-amber-500 text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab === "missions" ? "🎯" : tab === "buy" ? "🛒" : "📜"} {tab}
                  </button>
                ))}
              </div>

              {/* Gawa Tab Content Content */}
              <div className="pt-4 min-h-[300px]">
                
                {/* MISSIONS TAB */}
                {gawaActiveTab === "missions" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {missions.map(m => {
                      const done = userMissions.some(um => um.missionId === m.id);
                      return (
                        <div key={m.id} className={`p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-[32px] flex flex-col justify-between gap-6 transition hover:border-[#D4AF37]/30 group ${done ? "opacity-60" : ""}`}>
                          <div className="space-y-2">
                             <div className="flex items-start justify-between">
                                <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-[#D4AF37] group-hover:scale-110 transition">
                                   <Target className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-black text-amber-400 font-mono">+{m.rewardGawa} G</span>
                             </div>
                             <h4 className="text-[12px] font-black text-white uppercase tracking-tight">{m.title}</h4>
                             <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{m.description}</p>
                          </div>
                          <button
                            disabled={done || evaluatingMissions[m.id]}
                            onClick={() => handleClaimMission(m)}
                            className={`w-full py-3.5 rounded-2xl text-[9px] font-black uppercase font-mono tracking-widest transition ${
                              done 
                                ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed" 
                                : "bg-[#D4AF37] hover:bg-amber-400 text-black shadow-lg"
                            }`}
                          >
                            {evaluatingMissions[m.id] ? "Vérification..." : done ? "Terminé" : "Réclamer"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* BUY TAB */}
                {gawaActiveTab === "buy" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gawaPacks.map(pack => (
                      <div key={pack.id} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-[32px] space-y-6 text-center hover:border-amber-500/30 transition">
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{pack.name}</h4>
                          <p className="text-3xl font-black text-amber-400 font-mono tracking-tighter">+{pack.gawaAmount} G</p>
                        </div>
                        <button
                          onClick={() => setSelectedPack(pack)}
                          className="w-full py-4 bg-zinc-950 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-amber-500 rounded-2xl text-[10px] font-black uppercase font-mono transition-all"
                        >
                          {pack.priceFCFA.toLocaleString()} FCFA
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* HISTORY TAB */}
                {gawaActiveTab === "history" && (
                  <div className="space-y-3">
                    {gawaHistory.length === 0 ? (
                      <div className="py-20 text-center space-y-4">
                         <History className="w-10 h-10 text-zinc-800 mx-auto" />
                         <p className="text-[10px] font-mono text-zinc-600 uppercase font-black tracking-widest">Aucun historique disponible</p>
                      </div>
                    ) : (
                      gawaHistory.map(tx => (
                        <div key={tx.id} className="p-5 bg-zinc-900/40 border border-zinc-900 rounded-[24px] flex justify-between items-center group hover:bg-zinc-900 transition">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-amber-500 transition">
                                <History className="w-4 h-4" />
                             </div>
                             <div>
                                <p className="text-[11px] font-black text-white uppercase tracking-tight">{tx.description}</p>
                                <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">{new Date(tx.createdAt).toLocaleDateString("fr-FR")} • {new Date(tx.createdAt).toLocaleTimeString("fr-FR")}</p>
                             </div>
                          </div>
                          <span className={`font-mono font-black text-sm tracking-tighter ${tx.amount > 0 ? "text-emerald-400" : "text-amber-400"}`}>
                            {tx.amount > 0 ? "+" : ""}{tx.amount} G
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODALS SECTION (Confirmation, Result, etc.) */}
      {/* ========================================================= */}
      
      {/* Gawa Purchase Confirmation Modal */}
      {selectedPack && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-[#0B0B0C] border border-[#D4AF37]/30 rounded-[40px] p-8 w-full max-w-sm space-y-6 text-center shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
             <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 w-16 h-16 flex items-center justify-center mx-auto mb-2">
                <ShoppingBag className="w-8 h-8" />
             </div>
             <div className="space-y-1">
                <h3 className="text-sm font-black text-amber-400 uppercase font-mono tracking-widest">Confirmer l'achat</h3>
                <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-tight">
                  Pack : {selectedPack.name} • {selectedPack.gawaAmount} Gawa
                </p>
             </div>
             <div className="p-4 bg-zinc-950 rounded-3xl border border-zinc-900 font-black font-mono text-white text-lg">
                {selectedPack.priceFCFA.toLocaleString()} FCFA
             </div>
             <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setSelectedPack(null)}
                  className="flex-1 py-4 bg-zinc-900 text-zinc-500 rounded-[20px] text-[10px] font-black uppercase font-mono tracking-widest border border-zinc-800"
                >
                  Annuler
                </button>
                <button
                  disabled={purchasing}
                  onClick={() => handleBuyPack(selectedPack)}
                  className="flex-1 py-4 bg-amber-500 text-black rounded-[20px] text-[10px] font-black uppercase font-mono tracking-widest shadow-xl shadow-amber-500/20"
                >
                  {purchasing ? "..." : "Confirmer"}
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
                  Votre souveraineté s'étend. +{successDetails.amount} Gawa ont été ajoutés à votre compte.
                </p>
             </div>
             <button
               onClick={() => setSuccessDetails(null)}
               className="w-full py-4 bg-emerald-600 text-white rounded-[24px] text-[10px] font-black uppercase font-mono tracking-widest shadow-xl shadow-emerald-600/20"
             >
               MAGNIFIQUE
             </button>
          </div>
        </div>
      )}

      {/* Wheel Confirmation Modal */}
      {showConfirmModal && currentWheel && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#0B0B0C] border-t-2 sm:border border-[#D4AF37]/40 rounded-t-[40px] sm:rounded-[40px] p-8 w-full max-w-md space-y-6 shadow-2xl text-white font-mono relative animate-slideUp">
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-2 shrink-0 sm:hidden" />
            <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
              <div className="flex items-center gap-3">
                <Disc className="w-6 h-6 text-[#D4AF37] animate-spin-slow" />
                <h3 className="text-base font-black uppercase text-[#D4AF37] tracking-tight">🎡 VALIDER LE TIRAGE ?</h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white border border-zinc-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-zinc-950 rounded-[32px] border border-zinc-900 space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Édition</span>
                  <span className="text-xs font-black text-white uppercase">{currentWheel.name}</span>
               </div>
               <div className="flex justify-between items-center pt-4 border-t border-zinc-900">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Coût</span>
                  <span className="text-xl font-black text-[#D4AF37] tracking-tighter">
                     {hasExtraSpinToken ? "GRATUIT" : `${currentWheel.cost} FCFA`}
                  </span>
               </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 font-black uppercase text-[10px] rounded-[24px] border border-zinc-800 transition cursor-pointer"
              >
                ANNULER
              </button>
              <button
                type="button"
                onClick={handleExecuteSpin}
                className="flex-1 py-4 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-[10px] rounded-[24px] transition cursor-pointer shadow-2xl shadow-[#D4AF37]/30"
              >
                CONFIRMER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {spinResult?.winningSegment && spinResult.winningSegment.type !== "SURPRISE_BOX" && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#0B0B0C] border-t-2 sm:border-2 border-emerald-500/50 rounded-t-[48px] sm:rounded-[48px] p-10 w-full max-w-md space-y-8 shadow-2xl text-white font-mono text-center relative overflow-hidden animate-slideUp">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="inline-flex p-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xl">
              <Sparkles className="w-10 h-10 animate-pulse" />
            </div>
            <div className="space-y-2">
               <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-tighter">
                 {spinResult.winningSegment.type === "NO_REWARD" ? "C'EST PAS FINI !" : "TIRAGE RÉUSSI !"}
               </h3>
               <div className="py-5 px-8 bg-zinc-950 border border-emerald-500/30 rounded-[32px] text-white font-black text-lg tracking-tight">
                 {spinResult.winningSegment.label}
               </div>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed max-w-[280px] mx-auto font-medium">
              {spinResult.winningSegment.type === "PREMIUM_DAYS"
                ? `Félicitations ! Vos ${spinResult.winningSegment.rewardValue} jours Premium ont été ajoutés à votre compte.`
                : spinResult.winningSegment.type === "EXTRA_SPIN"
                ? "Incroyable ! Vous gagnez un nouveau ticket de tirage offert."
                : "Merci de votre participation à l'écosystème Gombo."}
            </p>
            <button
              type="button"
              onClick={() => setSpinResult(null)}
              className="w-full py-5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-[10px] rounded-[24px] shadow-2xl shadow-[#D4AF37]/20 transition"
            >
              RÉCUPÉRER LE GAIN
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
                    {currentWheel.type === "ELITE" ? "🏆 14 Jours Premium Elite" : "👑 7 Jours Premium"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMysteryBox(false)}
                  className="w-full py-5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-[10px] rounded-[24px] shadow-2xl shadow-[#D4AF37]/20 transition"
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
              <button onClick={() => setShowRulesModal(false)} className="text-zinc-600 hover:text-white transition"><X className="w-5 h-5" /></button>
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
                      <span>Coût : {currentWheel.cost} FCFA par spin (Gratuit si ticket possédé).</span>
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
              className="w-full py-4 bg-zinc-900 text-zinc-400 font-black uppercase text-[10px] rounded-[24px] border border-zinc-800 hover:text-white transition"
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
              <h3 className="text-base font-black uppercase text-[#D4AF37] tracking-tight">Historique Elite</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-zinc-600 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-3 pr-2 scrollbar-none">
               {userSpins.length === 0 ? (
                 <div className="py-20 text-center text-zinc-700 uppercase font-black text-[10px] tracking-widest">Aucun record</div>
               ) : (
                 userSpins.map(sp => (
                   <div key={sp.spinId} className="p-5 bg-zinc-950 border border-zinc-900 rounded-[24px] flex items-center justify-between">
                      <div className="space-y-1">
                         <div className="font-black text-white uppercase text-[11px] tracking-tight">{sp.rewardLabel}</div>
                         <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">{new Date(sp.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] font-black text-[#D4AF37] uppercase">{sp.cost} FCFA</div>
                         <div className="text-[8px] font-black text-emerald-600 uppercase">{sp.status}</div>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
