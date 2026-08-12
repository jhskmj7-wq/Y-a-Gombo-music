import React, { useState, useEffect } from "react";
import { 
  Disc, Sparkles, AlertCircle, Award, Zap, Crown, RefreshCw, 
  ChevronRight, Info, History, X, Check, ShieldAlert, Ticket, Gift 
} from "lucide-react";
import { AfriGomboWheel, WheelSegment, WheelSpinRecord, UserExtraSpinRecord } from "../../types";
import { WheelEngineService } from "../../lib/WheelEngineService";
import { SecurityService } from "../../lib/SecurityService";
import { subscribeToFeatureFlags } from "../../lib/featureFlags";

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

  // RENDER STATES
  return (
    <div className="w-full bg-[#050505] text-white border-t border-[#D4AF37]/30 py-10 px-4 sm:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* SECTION HEADER & SUBTITLE */}
        <div className="text-center space-y-3 mb-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-mono font-bold uppercase tracking-widest shadow-md shadow-[#D4AF37]/5">
            <Disc className="w-4 h-4 animate-spin-slow" />
            <span>TIRAGE SOUVERAIN</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-mono flex items-center justify-center gap-2.5">
            <span>🎡 TENTE TA CHANCE</span>
          </h2>

          <p className="text-xs sm:text-sm text-zinc-400 font-mono max-w-xl mx-auto leading-relaxed">
            « Tente ta chance et gagne des avantages exclusifs AFRIGOMBO. »
          </p>

          <div className="pt-1">
            <span className="inline-block text-[10px] sm:text-xs text-[#D4AF37] font-mono font-bold uppercase bg-zinc-950 px-4 py-1.5 rounded-xl border border-zinc-800 shadow-sm">
              ⚡ Disponible pour tous les membres AFRIGOMBO éligibles (Standard & Premium)
            </span>
          </div>
        </div>

        {/* STATE 1: LOADING */}
        {(loading || flagsLoading) && (
          <div className="p-10 bg-zinc-950 border border-zinc-800 rounded-3xl text-center space-y-4 shadow-xl">
            <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto" />
            <p className="text-xs font-mono font-bold text-zinc-400">Chargement de la roue...</p>
          </div>
        )}

        {/* STATE 1.5: GLOBAL WHEEL FEATURE FLAG DISABLED (NOT FOUNDER) */}
        {!loading && !flagsLoading && !isWheelGlobalEnabled && !isFounder && (
          <div className="p-10 bg-zinc-950 border border-rose-500/30 rounded-3xl text-center space-y-4 shadow-2xl font-mono">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Disc className="w-7 h-7 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-rose-400 uppercase tracking-wider">
                🎡 ROUE TEMPORAIREMENT INDISPONIBLE
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
                La Roue AFRIGOMBO est actuellement désactivée dans le Centre de Déploiement. Aucun tirage n'est disponible pour le moment.
              </p>
            </div>
          </div>
        )}

        {/* STATE 2: NO WHEELS CONFIGURED (BIENTÔT DISPONIBLE) */}
        {!loading && !flagsLoading && (isWheelGlobalEnabled || isFounder) && wheels.length === 0 && (
          <div className="p-10 bg-zinc-950 border border-zinc-800 rounded-3xl text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center mx-auto text-2xl">
              🎡
            </div>
            <h3 className="text-base font-black uppercase text-[#D4AF37] font-mono">🎡 Roue bientôt disponible</h3>
            <p className="text-xs sm:text-sm text-zinc-400 font-mono max-w-md mx-auto">
              Cette fonctionnalité arrive bientôt. Nous vous invitons à repasser ultérieurement pour tenter votre chance.
            </p>
          </div>
        )}

        {/* STATE 3: WHEEL DISABLED LOCALLY (INDISPONIBLE) */}
        {!loading && !flagsLoading && (isWheelGlobalEnabled || isFounder) && currentWheel && !currentWheel.enabled && !isFounder && (
          <div className="p-10 bg-zinc-950 border border-zinc-800 rounded-3xl text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-2xl">
              🛑
            </div>
            <h3 className="text-base font-black uppercase text-rose-400 font-mono">🎡 Roue temporairement indisponible</h3>
            <p className="text-xs sm:text-sm text-zinc-400 font-mono max-w-md mx-auto">
              La roue est actuellement suspendue par l'administration. Veuillez consulter les règles ou revenir plus tard.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setShowRulesModal(true)}
                className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-mono font-bold hover:text-white transition cursor-pointer"
              >
                Voir les règles
              </button>
            </div>
          </div>
        )}

        {/* STATE 4: WHEEL ACTIVE & AVAILABLE (OR FOUNDER BYPASS) */}
        {!loading && !flagsLoading && (isWheelGlobalEnabled || isFounder) && currentWheel && (currentWheel.enabled || isFounder) && (
          <div className="bg-zinc-950 border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

            {/* FOUNDER BYPASS BANNER WHEN GLOBAL OR LOCAL WHEEL IS DISABLED */}
            {(!isWheelGlobalEnabled || !currentWheel.enabled) && isFounder && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 text-xs font-mono flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold">
                  <ShieldAlert className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                  🔴 ROUE DÉSACTIVÉE EN PRODUCTION (MODE FONDATEUR / TEST SEULEMENT)
                </span>
                <span className="text-[10px] bg-amber-500/20 px-2.5 py-1 rounded font-mono font-bold uppercase">Bypass Fondateur</span>
              </div>
            )}

            {/* Wheels Selection Tabs if multiple active wheels exist */}
            {wheels.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 border-b border-zinc-800/80">
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
                    className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition shrink-0 cursor-pointer ${
                      currentWheel.id === w.id
                        ? "bg-[#D4AF37] text-black font-black shadow-md shadow-[#D4AF37]/20"
                        : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                    }`}
                  >
                    {w.type} • {w.cost > 0 ? `${w.cost} FCFA` : "GRATUIT"}
                  </button>
                ))}
              </div>
            )}

            {/* Wheel Main Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800/80 p-5 sm:p-6 rounded-2xl shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                    {currentWheel.type}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    Éligibilité : Standard & Premium
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white font-mono pt-1">{currentWheel.name}</h3>
              </div>

              <div className="text-left sm:text-right font-mono border-t sm:border-t-0 border-zinc-800 pt-3 sm:pt-0">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5">Prix du Tirage</span>
                <span className="text-lg font-black text-[#D4AF37]">
                  {hasExtraSpinToken ? (
                    <span className="text-emerald-400 flex items-center gap-1.5 sm:justify-end">
                      <Ticket className="w-4.5 h-4.5" /> GRATUIT (Ticket)
                    </span>
                  ) : currentWheel.cost > 0 ? (
                    `${currentWheel.cost} FCFA`
                  ) : (
                    "GRATUIT"
                  )}
                </span>
              </div>
            </div>

            {/* Extra Spin Token Alert Banner */}
            {hasExtraSpinToken && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 rounded-2xl text-xs font-mono font-bold flex items-center justify-between animate-fadeIn shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Ticket className="w-5 h-5 shrink-0" />
                  <span>🎟️ Tu possèdes {userExtraSpins.length} participation(s) gratuite(s) !</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 px-2.5 py-1 rounded-lg uppercase font-bold">Débit Wallet : 0 FCFA</span>
              </div>
            )}

            {/* Visual Interactive Wheel Stage */}
            <div className="relative flex flex-col items-center justify-center my-2 py-3">
              
              {/* Top Pointer Arrow */}
              <div className="absolute top-0 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-[#D4AF37] drop-shadow-[0_2px_8px_rgba(212,175,55,0.8)]" />

              {/* Rotating Wheel Circle (Compact Android-first size) */}
              <div 
                className="w-56 h-56 sm:w-68 sm:h-68 rounded-full border-[3px] border-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,0.2)] relative overflow-hidden flex items-center justify-center transition-transform duration-[3500ms] cubic-bezier(0.15, 0.9, 0.25, 1)"
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
                        className="absolute top-2.5 sm:top-3 text-[8px] sm:text-[9px] font-black uppercase tracking-tighter text-black px-1.5 py-0.5 rounded shadow-sm text-center max-w-[75px] truncate"
                        style={{ backgroundColor: seg.color || "#D4AF37" }}
                      >
                        {formatWheelLabel(seg.label)}
                      </div>
                    </div>
                  );
                })}

                {/* Center Hub */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-950 border-2 border-[#D4AF37] z-10 flex flex-col items-center justify-center shadow-2xl">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] animate-pulse" />
                  <span className="text-[7px] font-black text-[#D4AF37] tracking-widest mt-0.5 font-mono">GOMBO</span>
                </div>
              </div>

              {/* Spinning Status Indicator */}
              {isSpinning && (
                <div className="mt-3 flex items-center gap-2 text-[11px] font-black text-[#D4AF37] animate-pulse font-mono bg-zinc-900 px-4 py-2 rounded-xl border border-[#D4AF37]/30 shadow-md">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Tirage en cours...</span>
                </div>
              )}
            </div>

            {/* Possible Rewards List Section */}
            <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">
                  🎁 Récompenses possibles
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Les probabilités et conditions du tirage sont consultables avant de jouer.
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {(currentWheel.segments || []).filter((s) => s.enabled).map((seg) => (
                  <span
                    key={seg.id}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold text-zinc-200 bg-zinc-950 border border-zinc-800/90 flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: seg.color || "#D4AF37" }} />
                    <span>{seg.label}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Remaining Daily Participations Footer Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>
                  Participations restantes aujourd'hui :{" "}
                  <strong className="text-white font-bold">{remainingDailySpins}</strong> / {currentWheel.maxDailyParticipations || "Illimité"}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">
                Compte : <strong className="text-zinc-300 uppercase">{userAccountType}</strong>
              </span>
            </div>

            {/* Error Message Notice */}
            {spinError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/40 text-rose-400 rounded-2xl text-xs font-mono space-y-1 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  <span>RÉSULTAT DU TIRAGE</span>
                </div>
                <p className="text-xs leading-relaxed text-zinc-300 pl-6.5">{spinError}</p>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={isSpinning || remainingDailySpins <= 0}
                className={`w-full sm:flex-1 py-4 px-6 rounded-2xl font-black uppercase text-xs font-mono transition cursor-pointer flex items-center justify-center gap-2.5 shadow-xl ${
                  isSpinning || remainingDailySpins <= 0
                    ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                    : "bg-[#D4AF37] hover:bg-amber-400 text-black shadow-[#D4AF37]/20 border border-[#D4AF37] active:scale-98"
                }`}
              >
                <Disc className={`w-4.5 h-4.5 ${isSpinning ? "animate-spin" : ""}`} />
                <span>
                  {isSpinning
                    ? "Tirage en cours..."
                    : remainingDailySpins <= 0
                    ? "Limite quotidienne atteinte"
                    : "Lancer la roue !"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowRulesModal(true)}
                className="w-full sm:w-auto px-5 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-2xl text-xs font-mono font-bold uppercase transition cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <Info className="w-4 h-4 text-[#D4AF37]" />
                <span>Voir les règles</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="w-full sm:w-auto px-5 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-2xl text-xs font-mono font-bold uppercase transition cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <History className="w-4 h-4 text-[#D4AF37]" />
                <span>Mon historique</span>
              </button>
            </div>

          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CONFIRMATION AVANT DÉBIT (BOTTOM SHEET) */}
      {/* ========================================================= */}
      {showConfirmModal && currentWheel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#0B0B0C] border-t sm:border border-[#D4AF37]/40 rounded-t-[32px] sm:rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl text-white font-mono relative animate-slideUp">
            
            {/* Drag Handle Indicator */}
            <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mb-2 shrink-0" />

            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Disc className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-sm font-black uppercase text-[#D4AF37]">🎡 Confirmer le Tirage ?</h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800/90 rounded-2xl space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Roue sélectionnée :</span>
                <span className="font-bold text-white">{currentWheel.name}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-zinc-900">
                <span className="text-zinc-400">Coût de participation :</span>
                <span className="font-black text-sm text-[#D4AF37]">
                  {hasExtraSpinToken ? "0 FCFA (Ticket Gratuit)" : `${currentWheel.cost} FCFA`}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed text-center px-2">
              {hasExtraSpinToken
                ? "Un ticket de participation gratuite sera utilisé."
                : "Le montant sera immédiatement débité de ton solde disponible."}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold uppercase text-xs rounded-xl border border-zinc-800 transition cursor-pointer"
              >
                ANNULER
              </button>
              <button
                type="button"
                onClick={handleExecuteSpin}
                className="flex-1 py-3.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl transition cursor-pointer shadow-lg shadow-[#D4AF37]/20"
              >
                CONFIRMER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL SURPRISE BOX (BOTTOM SHEET) */}
      {/* ========================================================= */}
      {spinResult?.winningSegment?.type === "SURPRISE_BOX" && showMysteryBox && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#0B0B0C] border-t-2 sm:border-2 border-[#D4AF37]/60 rounded-t-[32px] sm:rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-5 shadow-2xl text-white font-mono text-center relative overflow-hidden animate-slideUp">
            
            {/* Drag Handle Indicator */}
            <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mb-2 shrink-0" />

            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex p-4 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 shadow-lg animate-bounce">
              <Gift className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-black text-[#D4AF37] uppercase tracking-wider">
              🎁 BOÎTE SURPRISE SOUVERAINE
            </h3>

            {!mysteryBoxOpened ? (
              <div className="space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed max-w-xs mx-auto">
                  Le système a généré une boîte surprise mystère. Touchez pour l'ouvrir et découvrir votre récompense exclusive !
                </p>

                <div 
                  onClick={() => {
                    setMysteryBoxOpened(true);
                    try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
                  }}
                  className="p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-dashed border-[#D4AF37]/50 rounded-2xl cursor-pointer hover:border-[#D4AF37] transition group shadow-xl"
                >
                  <div className="text-4xl mb-2 group-hover:scale-110 transition transform">📦</div>
                  <span className="text-xs font-black text-[#D4AF37] uppercase tracking-widest block">
                    TOUCHEZ POUR OUVRIR
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 bg-zinc-950 border border-emerald-500/40 rounded-2xl space-y-2">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">🎉 RÉSULTAT RÉVÉLÉ :</span>
                  <div className="text-base font-black text-white">
                    {currentWheel.type === "ELITE" ? "🏆 14 jours Premium Souverain" : currentWheel.type === "PREMIUM" ? "👑 7 jours Premium Prestige" : "👑 3 jours Premium Offerts"}
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Votre récompense mystère a été automatiquement créditée sur votre profil !
                </p>

                <button
                  type="button"
                  onClick={() => setShowMysteryBox(false)}
                  className="w-full py-4 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl shadow-lg transition cursor-pointer"
                >
                  CONTINUER
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ÉCRAN DE RÉSULTAT (BOTTOM SHEET) */}
      {/* ========================================================= */}
      {spinResult?.winningSegment && spinResult.winningSegment.type !== "SURPRISE_BOX" && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#0B0B0C] border-t-2 sm:border-2 border-emerald-500/50 rounded-t-[32px] sm:rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-5 shadow-2xl text-white font-mono text-center relative overflow-hidden animate-slideUp">
            
            {/* Drag Handle Indicator */}
            <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mb-2 shrink-0" />

            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex p-3.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-8 h-8 animate-bounce" />
            </div>

            <h3 className="text-xl font-black text-emerald-400 uppercase tracking-wider">
              {spinResult.winningSegment.type === "NO_REWARD" ? "😅 PAS DE GAIN CETTE FOIS" : "🎉 FÉLICITATIONS !"}
            </h3>

            <div className="p-4 bg-zinc-950 border border-emerald-500/30 rounded-2xl text-white font-bold text-sm shadow-sm">
              {spinResult.winningSegment.label}
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed max-w-xs mx-auto">
              {spinResult.winningSegment.type === "PREMIUM_DAYS"
                ? `Tu as gagné ${spinResult.winningSegment.rewardValue} jours Premium ! Ils ont été ajoutés à ton abonnement.`
                : spinResult.winningSegment.type === "EXTRA_SPIN"
                ? "⚡ PARTICIPATION GRATUITE ! Tu as obtenu 1 ticket de spin supplémentaire."
                : spinResult.winningSegment.type === "NO_REWARD"
                ? "Merci d'avoir participé. Tente à nouveau ta chance !"
                : `⚡ BOOST GAGNÉ ! ${spinResult.winningSegment.label}`}
            </p>

            {spinResult.balanceAfter !== undefined && (
              <div className="text-[11px] text-zinc-400 border-t border-zinc-900 pt-3">
                Solde Wallet restant : <strong className="text-[#D4AF37]">{spinResult.balanceAfter} FCFA</strong>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSpinResult(null)}
              className="w-full py-4 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              SUPER, MERCI !
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: HISTORIQUE UTILISATEUR (BOTTOM SHEET) */}
      {/* ========================================================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#0B0B0C] border-t sm:border border-zinc-800 rounded-t-[32px] sm:rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl text-white font-mono max-h-[85vh] flex flex-col animate-slideUp">
            
            {/* Drag Handle Indicator */}
            <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mb-2 shrink-0" />

            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-sm font-black uppercase text-[#D4AF37]">Mon Historique de Tirages</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2.5 pr-1 text-xs">
              {userSpins.length === 0 ? (
                <div className="p-10 text-center text-zinc-500">
                  Aucun tirage enregistré pour votre compte pour le moment.
                </div>
              ) : (
                userSpins.map((sp) => (
                  <div key={sp.spinId} className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-2xl flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-bold text-white text-xs">{sp.rewardLabel}</div>
                      <div className="text-[10px] text-zinc-400">
                        {new Date(sp.createdAt).toLocaleString("fr-FR")} • {sp.wheelType}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#D4AF37] block text-xs">
                        {sp.isExtraSpinUsed ? "Gratuit" : `${sp.cost} ${sp.currency}`}
                      </span>
                      <span className="text-[9px] text-emerald-400 uppercase font-bold">{sp.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-zinc-800 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full sm:w-auto px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl font-bold uppercase text-xs border border-zinc-800"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: RÈGLES DE LA ROUE (BOTTOM SHEET) */}
      {/* ========================================================= */}
      {showRulesModal && currentWheel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#0B0B0C] border-t sm:border border-zinc-800 rounded-t-[32px] sm:rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl text-white font-mono max-h-[85vh] flex flex-col animate-slideUp">
            
            {/* Drag Handle Indicator */}
            <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mb-2 shrink-0" />

            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Info className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-sm font-black uppercase text-[#D4AF37]">Règles de la Roue</h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 text-xs text-zinc-300 leading-relaxed pr-1">
              <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl space-y-1.5">
                <span className="font-bold text-[#D4AF37] block uppercase">{currentWheel.name}</span>
                <p>{currentWheel.rulesText || "Les tirages sont régis de manière transparente par probabilités pondérées configurées dans le système commercial AFRIGOMBO."}</p>
              </div>

              <div className="space-y-2 bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800/80">
                <span className="font-bold text-white block uppercase">Conditions Générales :</span>
                <ul className="list-disc pl-4 space-y-1.5 text-zinc-400 text-[11px]">
                  <li>Prix du tirage : {currentWheel.cost > 0 ? `${currentWheel.cost} FCFA` : "Gratuit"}</li>
                  <li>Participations quotidiennes max : {currentWheel.maxDailyParticipations || "Illimitées"}</li>
                  <li>Incrémentation des jours Premium : cumul automatique sans perte de jours existants.</li>
                  <li>Débit du Wallet : réel et atomique avant tirage.</li>
                  <li>Ouvert à tous les profils (Standard & Premium).</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 text-right">
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full py-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl shadow-md"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
