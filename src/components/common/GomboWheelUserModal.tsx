import React, { useState, useEffect } from "react";
import { 
  Disc, Sparkles, X, Check, AlertCircle, Award, Zap, 
  Crown, RefreshCw, ShieldAlert, ChevronRight, Info, DollarSign 
} from "lucide-react";
import { AfriGomboWheel, WheelSegment, WheelSpinRecord } from "../../types";
import { WheelEngineService } from "../../lib/WheelEngineService";
import { subscribeToFeatureFlags } from "../../lib/featureFlags";

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
      const enabled = flags["wheel"] !== undefined ? flags["wheel"] : true;
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

    // Simulate wheel rotation animation (e.g., 5 full rotations + random offset)
    const extraRotations = 360 * 5;
    const randomOffset = Math.floor(Math.random() * 360);
    const totalRotation = spinDegree + extraRotations + randomOffset;
    setSpinDegree(totalRotation);

    // Call WheelEngineService or handle Test Simulation
    setTimeout(async () => {
      if (isTestMode) {
        const winningSeg = WheelEngineService.pickWinningSegment(currentWheel.segments);
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

      setIsSpinning(false);

      if (!res.success) {
        setSpinError(res.error || "Une erreur est survenue lors du tirage.");
        try { audioSynth?.playError?.(); } catch (e) {}
      } else {
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
    }, 3500); // 3.5 seconds spin animation time
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-[#0A0A0A] border border-[#D4AF37]/50 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] font-sans text-white relative">
        
        {/* Glow Header Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Mode Banners */}
        {isTestMode && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 p-2 text-center text-emerald-300 font-mono text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>🧪 MODE TEST — SIMULATION SANS DÉBIT NI RÉCOMPENSE RÉELLE</span>
          </div>
        )}
        {isUserViewOnly && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 p-2 text-center text-amber-300 font-mono text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>👁️ MODE APERÇU UTILISATEUR — INTERFACE LECTURE SEULE</span>
          </div>
        )}

        {/* Modal Top Bar */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between z-10 bg-zinc-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#D4AF37]/20 border border-[#D4AF37]/50 rounded-xl text-[#D4AF37] shadow-lg shadow-[#D4AF37]/10">
              <Disc className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                <span>🎡 Roue AFRIGOMBO</span>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                  {currentWheel?.type || "OFFICIEL"}
                </span>
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono">
                Tirage au sort souverain • Récompenses instantanées
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSpinning}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 font-mono text-xs flex-1 scrollbar-none">
          
          {/* Wheel Selector Tabs if multiple wheels exist */}
          {wheels.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
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
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition shrink-0 cursor-pointer ${
                    currentWheel?.id === w.id
                      ? "bg-[#D4AF37] text-black font-black shadow-md shadow-[#D4AF37]/20"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  {w.type} • {w.cost} FCFA
                </button>
              ))}
            </div>
          )}

          {/* Wheel Information Banner */}
          {currentWheel && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-bold uppercase">Coût du tirage :</span>
                <span className="text-sm font-black text-[#D4AF37]">
                  {currentWheel.cost > 0 ? `${currentWheel.cost} FCFA` : "GRATUIT"}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-900">
                <span className="text-zinc-400">Éligibilité :</span>
                <span className="text-zinc-200 font-bold">Standard & Premium</span>
              </div>
            </div>
          )}

          {/* Visual Interactive Wheel */}
          <div className="relative flex flex-col items-center justify-center my-2 py-4">
            
            {/* Wheel Indicator Pointer */}
            <div className="absolute top-1 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-[#D4AF37] drop-shadow-md" />

            {/* Rotating Wheel Circle */}
            <div 
              className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 border-[#D4AF37] shadow-2xl relative overflow-hidden flex items-center justify-center transition-transform duration-[3500ms] cubic-bezier(0.15, 0.9, 0.25, 1)"
              style={{ transform: `rotate(${spinDegree}deg)` }}
            >
              {currentWheel?.segments?.map((seg, idx) => {
                const totalSegs = currentWheel.segments.length;
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
                      className="absolute top-2 text-[9px] font-black uppercase tracking-tighter text-black px-1 py-0.5 rounded shadow-sm text-center max-w-[70px] truncate"
                      style={{ backgroundColor: seg.color || "#D4AF37" }}
                    >
                      {seg.label}
                    </div>
                  </div>
                );
              })}

              {/* Wheel Center Button / Hub */}
              <div className="w-16 h-16 rounded-full bg-zinc-950 border-2 border-[#D4AF37] z-10 flex flex-col items-center justify-center shadow-2xl">
                <Crown className="w-5 h-5 text-[#D4AF37] animate-pulse" />
                <span className="text-[8px] font-black text-[#D4AF37] uppercase tracking-widest mt-0.5">AFRI</span>
              </div>
            </div>

            {/* Spinning Indicator Text */}
            {isSpinning && (
              <div className="mt-3 flex items-center gap-2 text-xs font-black text-[#D4AF37] animate-pulse font-mono">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Tirage souverain en cours...</span>
              </div>
            )}
          </div>

          {/* Error Notice */}
          {spinError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/40 text-rose-400 rounded-2xl text-xs font-mono space-y-1 animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>RÉSULTAT DU TIRAGE</span>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-300">{spinError}</p>
            </div>
          )}

          {/* WINNING RESULT BANNER */}
          {spinResult?.winningSegment && (
            <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-2xl space-y-2 animate-scaleUp text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="inline-flex p-2 rounded-full bg-emerald-500/20 text-emerald-400 mb-1">
                <Sparkles className="w-6 h-6 animate-bounce" />
              </div>

              <h3 className="text-base font-black text-emerald-400 uppercase tracking-wider font-mono">
                🎉 FÉLICITATIONS !
              </h3>

              <div className="p-2.5 bg-zinc-950 border border-emerald-500/30 rounded-xl text-white font-bold text-xs">
                {spinResult.winningSegment.label}
              </div>

              <p className="text-[10px] text-zinc-300 font-mono leading-relaxed">
                {spinResult.winningSegment.type === "PREMIUM_DAYS"
                  ? `Votre abonnement Premium a été prolongé de ${spinResult.winningSegment.rewardValue} jours !`
                  : spinResult.winningSegment.type === "EXTRA_SPIN"
                  ? "Vous avez obtenu 1 participation gratuite supplémentaire !"
                  : spinResult.winningSegment.type === "NO_REWARD"
                  ? "Merci d'avoir participé ! Tentez à nouveau votre chance."
                  : "Votre avantage a été automatiquement activé sur votre compte."}
              </p>

              {spinResult.balanceAfter !== undefined && (
                <div className="text-[9px] text-zinc-400 font-mono">
                  Nouveau solde Wallet : <span className="text-[#D4AF37] font-bold">{spinResult.balanceAfter} FCFA</span>
                </div>
              )}
            </div>
          )}

          {/* Commercial Rules Toggle Section */}
          <div className="pt-2">
            <button
              onClick={() => setShowRules(!showRules)}
              className="text-[10px] text-zinc-400 hover:text-[#D4AF37] font-mono flex items-center gap-1 transition cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{showRules ? "Masquer les règles de la roue" : "Consulter les règles de la roue"}</span>
            </button>

            {showRules && currentWheel && (
              <div className="mt-2 p-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-[10px] text-zinc-400 space-y-1.5 animate-fadeIn">
                <span className="text-xs font-bold text-[#D4AF37] uppercase block">Règles & Conditions Commerciales :</span>
                <p>{currentWheel.rulesText || "Les tirages sont régis de manière transparente par probabilités pondérées configurées dans le système commercial AFRIGOMBO."}</p>
                <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                  <li>Participations quotidiennes maximales : {currentWheel.maxDailyParticipations}</li>
                  <li>Incrémentation intelligente du Premium sans perte d'historique</li>
                  <li>Débit du Wallet unique et vérifié avant tout tirage</li>
                </ul>
              </div>
            )}
          </div>

        </div>

        {/* Action Button Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 space-y-2">
          {isUserViewOnly ? (
            <div className="p-3 bg-zinc-900 border border-amber-500/30 rounded-2xl text-center space-y-1">
              <span className="text-xs font-black text-amber-400 uppercase font-mono block">
                Mode Aperçu Utilisateur (Lecture Seule)
              </span>
              <p className="text-[10px] text-zinc-400 font-mono">
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
              className={`w-full py-3.5 rounded-2xl font-black uppercase text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xl ${
                isSpinning
                  ? "bg-zinc-800 text-zinc-500 border border-zinc-700"
                  : isTestMode
                  ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20 border border-emerald-400"
                  : "bg-[#D4AF37] hover:bg-amber-400 text-black shadow-[#D4AF37]/20 border border-[#D4AF37]"
              }`}
            >
              <Disc className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`} />
              <span>{isSpinning ? "Tirage en cours..." : isTestMode ? "🧪 Lancer le Tirage de Test (Gratuit)" : "Tenter ma chance !"}</span>
            </button>
          ) : (
            <div className="p-3 bg-zinc-900 border border-[#D4AF37]/50 rounded-2xl space-y-3 animate-fadeIn">
              <div className="text-center space-y-1">
                <span className="text-xs font-black text-[#D4AF37] uppercase block font-mono">
                  Confirmation de Participation
                </span>
                <p className="text-[11px] text-zinc-300 font-mono">
                  Cette participation coûte <span className="font-bold text-[#D4AF37]">{currentWheel?.cost} FCFA</span>. Confirmer le débit de votre Wallet ?
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold uppercase text-[11px] transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleStartSpin}
                  className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black rounded-xl font-black uppercase text-[11px] transition cursor-pointer shadow-lg shadow-[#D4AF37]/20"
                >
                  Oui, Lancer la Roue !
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
