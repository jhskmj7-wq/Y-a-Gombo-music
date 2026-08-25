import React, { useState, useEffect } from "react";
import { 
  Disc, Sparkles, X, Check, AlertCircle, Award, Zap, 
  Crown, RefreshCw, ShieldAlert, ChevronRight, Info, DollarSign 
} from "lucide-react";
import { AfriGomboWheel, WheelSegment, WheelSpinRecord } from "../../types";
import { WheelEngineService } from "../../lib/WheelEngineService";
import { subscribeToFeatureFlags, isModuleAccessible } from "../../lib/featureFlags";

interface GomboWheelUserModalProps {
  currentUser?: any;
  userEmail?: string;
  userAccountType?: "standard" | "premium" | string;
  isFounder?: boolean;
  isTestMode?: boolean;
  isUserViewOnly?: boolean;
  audioSynth?: any;
  isOpen: boolean;
  onClose: () => void;
  onSpinSuccess?: (record: WheelSpinRecord) => void;
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

export default function GomboWheelUserModal({
  currentUser,
  userEmail = "",
  userAccountType = "standard",
  isFounder = false,
  isTestMode = false,
  isUserViewOnly = false,
  audioSynth,
  isOpen,
  onClose,
  onSpinSuccess
}: GomboWheelUserModalProps) {
  const [wheels, setWheels] = useState<AfriGomboWheel[]>([]);
  const [selectedWheel, setSelectedWheel] = useState<AfriGomboWheel | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Spin State
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDegree, setSpinDegree] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [spinResult, setSpinResult] = useState<{
    winningSegment?: WheelSegment;
    spinRecord?: WheelSpinRecord;
    balanceAfter?: number;
    isSimulation?: boolean;
  } | null>(null);
  const [spinError, setSpinError] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [isWheelGlobalEnabled, setIsWheelGlobalEnabled] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setFlagsLoading(true);
    const unsubFlags = subscribeToFeatureFlags((flags) => {
      const enabled = isModuleAccessible("wheel", currentUser, currentUser, flags);
      setIsWheelGlobalEnabled(enabled);
      setFlagsLoading(false);
    });

    const unsub = WheelEngineService.subscribeWheels((data) => {
      setWheels(data);
      if (data.length > 0 && !selectedWheel) {
        // Pick first active wheel
        const active = data.find((w) => w.enabled) || data[0];
        setSelectedWheel(active);
      }
      setLoading(false);
    });

    return () => {
      unsubFlags();
      unsub();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentWheel = selectedWheel || wheels[0];

  const handleStartSpin = async () => {
    if (!currentWheel) return;

    if (!isWheelGlobalEnabled && !isFounder && !isTestMode) {
      setSpinError("🎡 La Roue est actuellement désactivée dans le Centre de Déploiement.");
      return;
    }

    if (!currentUser?.uid && !isTestMode && !isFounder) {
      setSpinError("Veuillez vous connecter pour tenter votre chance.");
      return;
    }

    setShowConfirmModal(false);
    setIsSpinning(true);
    setSpinError(null);
    setSpinResult(null);

    try { audioSynth?.playNotification?.(); } catch (e) {}

    // Calculate rotation angle
    const activeSegments = (currentWheel.segments || []).filter((s) => s.enabled);
    const numSegments = activeSegments.length || 1;

    setTimeout(async () => {
      if (isTestMode) {
        const winningResult = WheelEngineService.pickWinningSegment(currentWheel.segments);
        const winningSeg = winningResult.segment;
        const segIndex = winningResult.index;
        const currentNormalized = ((spinDegree % 360) + 360) % 360;
        const segAngle = 360 / numSegments;
        const targetSegmentAngle = segIndex * segAngle;
        const angleNeeded = ((360 - targetSegmentAngle) - currentNormalized + 360) % 360;
        const totalRotation = spinDegree + 1800 + (angleNeeded === 0 ? 360 : angleNeeded);
        setSpinDegree(totalRotation);

        setIsSpinning(false);
        setSpinResult({
          winningSegment: winningSeg,
          isSimulation: true
        });
        try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
        return;
      }

      const res = await WheelEngineService.spinWheel({
        userId: currentUser?.uid || "founder_test",
        userName: currentUser?.displayName || currentUser?.email || userEmail || "Membre",
        userAccountType,
        wheelId: currentWheel.id,
        isFounder
      });

      if (!res.success) {
        setIsSpinning(false);
        setSpinError(res.error || "Une erreur est survenue lors du tirage.");
        try { audioSynth?.playError?.(); } catch (e) {}
      } else {
        const segIndex = (typeof res.winningSegmentIndex === "number" && res.winningSegmentIndex >= 0)
          ? res.winningSegmentIndex
          : 0;
        const currentNormalized = ((spinDegree % 360) + 360) % 360;
        const segAngle = 360 / numSegments;
        const targetSegmentAngle = segIndex * segAngle;
        const angleNeeded = ((360 - targetSegmentAngle) - currentNormalized + 360) % 360;
        const totalRotation = spinDegree + 1800 + (angleNeeded === 0 ? 360 : angleNeeded);
        setSpinDegree(totalRotation);

        setIsSpinning(false);
        setSpinResult({
          winningSegment: res.winningSegment,
          spinRecord: res.spinRecord,
          balanceAfter: res.balanceAfter
        });
        try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
        if (res.spinRecord && onSpinSuccess) {
          onSpinSuccess(res.spinRecord);
        }
      }
    }, 500); // Trigger spin animation
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fadeIn font-sans">
      {/* Backdrop overlay click to close */}
      <div className="absolute inset-0" onClick={!isSpinning ? onClose : undefined} />

      {/* Android Material 3 Bottom Sheet / Dialog Container */}
      <div className="bg-[#121214] border-t sm:border border-[#D4AF37]/30 rounded-t-[36px] sm:rounded-3xl w-full max-w-xl overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.8)] flex flex-col max-h-[92vh] text-white relative z-10 animate-slideUp">
        
        {/* Material 3 Drag Handle Bar */}
        <div className="w-14 h-1.5 bg-zinc-600 rounded-full mx-auto mt-4 mb-2 shrink-0" />

        {/* Glow Header Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-36 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Mode Banners */}
        {isTestMode && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-4 py-2 text-center text-emerald-300 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>🧪 MODE TEST — SIMULATION SANS DÉBIT NI RÉCOMPENSE RÉELLE</span>
          </div>
        )}
        {isUserViewOnly && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 text-center text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2">
            <Info className="w-4 h-4 text-amber-400" />
            <span>👁️ MODE APERÇU UTILISATEUR — INTERFACE LECTURE SEULE</span>
          </div>
        )}

        {/* Header Top Bar - Material 3 Style */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between z-10 bg-[#161619]">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-[#D4AF37]/15 border border-[#D4AF37]/40 rounded-2xl text-[#D4AF37] shadow-lg shadow-[#D4AF37]/10">
              <Disc className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wide text-white font-mono flex items-center gap-2.5">
                <span>🎡 ROUE AFRIGOMBO</span>
                <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                  {currentWheel?.type || "OFFICIEL"}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Tirage au sort souverain Android M3
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSpinning}
            className="w-10 h-10 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 flex items-center justify-center transition cursor-pointer disabled:opacity-50 shrink-0 shadow"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 font-mono text-xs flex-1 scrollbar-none">
          
          {/* Wheel Selector Tabs if multiple wheels exist */}
          {wheels.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-2">
              {wheels.map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    if (!isSpinning) {
                      setSelectedWheel(w);
                      setSpinResult(null);
                      setSpinError(null);
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition shrink-0 cursor-pointer ${
                    currentWheel?.id === w.id
                      ? "bg-[#D4AF37] text-black font-black shadow-lg shadow-[#D4AF37]/20"
                      : "bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800"
                  }`}
                >
                  {w.type} • {w.cost > 0 ? `${w.cost} GAWA` : "GRATUIT"}
                </button>
              ))}
            </div>
          )}

          {/* Android Card: Wheel Information */}
          {currentWheel && (
            <div className="bg-[#18181C] border border-zinc-800/90 rounded-2xl p-5 space-y-3 shadow-md">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-bold uppercase tracking-wide">Coût du tirage :</span>
                <span className="text-base font-black text-[#D4AF37]">
                  {currentWheel.cost > 0 ? `${currentWheel.cost} GAWA` : "GRATUIT"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2.5 border-t border-zinc-800/80">
                <span className="text-zinc-400">Éligibilité membres :</span>
                <span className="text-zinc-200 font-bold">Standard & Premium</span>
              </div>
            </div>
          )}

          {/* Visual Interactive Wheel Stage */}
          <div className="relative flex flex-col items-center justify-center my-4 py-4 w-full overflow-hidden">
            
            {/* Wheel Indicator Pointer */}
            <div className="absolute top-0 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-[#D4AF37] drop-shadow-[0_4px_10px_rgba(212,175,55,0.7)]" />

            {/* Rotating Wheel Circle */}
            <div 
              className="w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] rounded-full border-[3px] border-[#D4AF37] shadow-[0_0_50px_rgba(212,175,55,0.2)] relative overflow-hidden flex items-center justify-center transition-transform duration-[3500ms]"
              style={{ transform: `rotate(${spinDegree}deg)`, transitionTimingFunction: "cubic-bezier(0.15, 0.9, 0.25, 1)" }}
            >
              {(currentWheel?.segments || []).filter((s) => s.enabled).map((seg, idx, arr) => {
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
                      className="absolute top-3 sm:top-4 text-[9px] font-black uppercase tracking-tight text-black px-1.5 py-0.5 rounded shadow-md text-center max-w-[80px] sm:max-w-[90px] truncate"
                      style={{ backgroundColor: seg.color || "#D4AF37" }}
                    >
                      {formatWheelLabel(seg.label)}
                    </div>
                  </div>
                );
              })}

              {/* Wheel Center Hub */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#121214] border-2 border-[#D4AF37] z-10 flex flex-col items-center justify-center shadow-2xl">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] animate-pulse" />
                <span className="text-[7px] sm:text-[8px] font-black text-[#D4AF37] uppercase tracking-widest mt-0.5">AFRI</span>
              </div>
            </div>

            {/* Spinning Indicator Text */}
            {isSpinning && (
              <div className="mt-5 flex items-center gap-2.5 text-[10px] sm:text-xs font-black text-[#D4AF37] animate-pulse font-mono bg-zinc-900 px-5 py-2.5 rounded-2xl border border-[#D4AF37]/30 shadow-xl">
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                <span>Tirage souverain en cours...</span>
              </div>
            )}
          </div>

          {/* Android Card: Récompenses Possibles */}
          {currentWheel?.segments && (
            <div className="bg-[#18181C] border border-zinc-800/90 rounded-2xl p-5 space-y-3.5 shadow-md">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block font-mono">
                Récompenses possibles :
              </span>
              <div className="flex flex-wrap gap-2.5">
                {currentWheel.segments.filter((s) => s.enabled).map((seg) => (
                  <span
                    key={seg.id}
                    className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-zinc-200 bg-zinc-900 border border-zinc-800 flex items-center gap-2.5 shadow-sm"
                  >
                    <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: seg.color || "#D4AF37" }} />
                    <span>{seg.label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Error Notice */}
          {spinError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/40 text-rose-400 rounded-2xl text-xs font-mono space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                <span>RÉSULTAT DU TIRAGE</span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-300 pl-6">{spinError}</p>
            </div>
          )}

          {/* Winning Result Banner */}
          {spinResult?.winningSegment && (
            <div className="p-6 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-2xl space-y-3.5 animate-scaleUp text-center relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 mb-1">
                <Sparkles className="w-7 h-7 animate-bounce" />
              </div>

              <h3 className="text-lg font-black text-emerald-400 uppercase tracking-wider font-mono">
                🎉 FÉLICITATIONS !
              </h3>

              <div className="p-3.5 bg-[#121214] border border-emerald-500/30 rounded-xl text-white font-bold text-sm shadow">
                {spinResult.winningSegment.label}
              </div>

              <p className="text-xs text-zinc-300 font-mono leading-relaxed max-w-sm mx-auto">
                {spinResult.winningSegment.type === "PREMIUM_DAYS"
                  ? `Votre abonnement Premium a été prolongé de ${spinResult.winningSegment.rewardValue} jours !`
                  : spinResult.winningSegment.type === "EXTRA_SPIN"
                  ? "Vous avez obtenu 1 participation gratuite supplémentaire !"
                  : spinResult.winningSegment.type === "NO_REWARD"
                  ? "Merci d'avoir participé ! Tentez à nouveau votre chance."
                  : "Votre avantage a été automatiquement activé sur votre compte."}
              </p>

              {spinResult.balanceAfter !== undefined && (
                <div className="text-xs text-zinc-400 font-mono pt-1">
                  Nouveau solde Wallet : <span className="text-[#D4AF37] font-bold">{spinResult.balanceAfter} FCFA</span>
                </div>
              )}
            </div>
          )}

          {/* Commercial Rules Toggle Section */}
          <div className="pt-2">
            <button
              onClick={() => setShowRules(!showRules)}
              className="text-xs text-zinc-400 hover:text-[#D4AF37] font-mono flex items-center gap-2 transition cursor-pointer"
            >
              <Info className="w-4.5 h-4.5 text-[#D4AF37]" />
              <span>{showRules ? "Masquer les règles de la roue" : "Consulter les règles de la roue"}</span>
            </button>

            {showRules && currentWheel && (
              <div className="mt-3 p-4 bg-[#18181C] border border-zinc-800 rounded-2xl text-xs text-zinc-300 space-y-2.5 animate-fadeIn">
                <span className="text-xs font-bold text-[#D4AF37] uppercase block">Règles & Conditions Commerciales :</span>
                <p className="leading-relaxed">{currentWheel.rulesText || "Les tirages sont régis de manière transparente par probabilités pondérées configurées dans le système commercial AFRIGOMBO."}</p>
                <ul className="list-disc pl-4 space-y-1.5 text-zinc-400">
                  <li>Participations quotidiennes maximales : {currentWheel.maxDailyParticipations || "Illimitées"}</li>
                  <li>Incrémentation intelligente du Premium sans perte d'historique</li>
                  <li>Débit du Wallet unique et vérifié avant tout tirage</li>
                </ul>
              </div>
            )}
          </div>

        </div>

        {/* Action Button Footer - Android Material 3 Bottom Bar */}
        <div className="p-5 sm:p-6 border-t border-zinc-800 bg-[#161619] space-y-3">
          {isUserViewOnly ? (
            <div className="p-4 bg-zinc-900 border border-amber-500/30 rounded-2xl text-center space-y-1.5">
              <span className="text-xs font-black text-amber-400 uppercase font-mono block">
                Mode Aperçu Utilisateur (Lecture Seule)
              </span>
              <p className="text-xs text-zinc-400 font-mono">
                L'action de lancement est désactivée dans ce mode d'inspection commerciale.
              </p>
            </div>
          ) : !showConfirmModal ? (
            <button
              type="button"
              onClick={() => {
                if (isTestMode) {
                  handleStartSpin();
                } else {
                  setShowConfirmModal(true);
                }
              }}
              disabled={isSpinning || !currentWheel?.enabled}
              className={`w-full py-4.5 px-6 rounded-2xl font-black uppercase text-xs font-mono transition cursor-pointer flex items-center justify-center gap-2.5 shadow-2xl min-h-[52px] ${
                isSpinning
                  ? "bg-zinc-800 text-zinc-500 border border-zinc-700"
                  : isTestMode
                  ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20 border border-emerald-400"
                  : "bg-[#D4AF37] hover:bg-amber-400 text-black shadow-lg shadow-[#D4AF37]/25 border border-[#D4AF37] active:scale-98"
              }`}
            >
              <Disc className={`w-5 h-5 ${isSpinning ? "animate-spin" : ""}`} />
              <span>{isSpinning ? "Tirage en cours..." : isTestMode ? "🧪 Lancer le Tirage de Test (Gratuit)" : "Lancer la roue !"}</span>
            </button>
          ) : (
            <div className="p-5 bg-zinc-900 border border-[#D4AF37]/50 rounded-2xl space-y-3.5 animate-fadeIn shadow-xl">
              <div className="text-center space-y-1.5">
                <span className="text-xs font-black text-[#D4AF37] uppercase block font-mono">
                  Confirmation de Participation
                </span>
                <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                  Cette participation coûte <span className="font-bold text-[#D4AF37]">{currentWheel?.cost} FCFA</span>. Confirmer le débit de votre Wallet ?
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold uppercase text-xs font-mono transition cursor-pointer min-h-[48px]"
                >
                  Annuler
                </button>
                <button
                  onClick={handleStartSpin}
                  className="flex-1 py-3.5 bg-[#D4AF37] hover:bg-amber-400 text-black rounded-xl font-black uppercase text-xs font-mono transition cursor-pointer shadow-lg shadow-[#D4AF37]/20 min-h-[48px]"
                >
                  Oui, Lancer !
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

