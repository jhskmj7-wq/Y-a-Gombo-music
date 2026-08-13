import React from "react";
import GomboWheelSection from "./GomboWheelSection";
import { ArrowLeft, Gift } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface PremiumWheelPageProps {
  currentUserProfile?: any;
  onRefreshProfile?: () => void;
  onBack: () => void;
  audioSynth?: any;
}

export default function PremiumWheelPage({
  currentUserProfile,
  onRefreshProfile,
  onBack,
  audioSynth
}: PremiumWheelPageProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className={`w-full max-w-full overflow-x-hidden min-h-[90vh] pb-12 font-sans box-border ${
      isLight ? "bg-[#FDFBF7] text-gray-900" : "bg-[#050505] text-white"
    }`}>
      {/* Top Header Navigation */}
      <div className={`sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3.5 border-b flex items-center justify-between gap-2 max-w-full box-border ${
        isLight ? "bg-[#FDFBF7]/95 border-gray-200" : "bg-[#050505]/95 border-zinc-800"
      } backdrop-blur-md`}>
        <button
          onClick={onBack}
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-mono font-bold uppercase transition cursor-pointer shrink-0 ${
            isLight ? "bg-gray-100 hover:bg-gray-200 text-gray-800" : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800"
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-1.5 min-w-0 shrink">
          <span className="text-xs sm:text-sm font-black font-mono tracking-wider uppercase flex items-center gap-1.5 text-[#D4AF37] truncate">
            <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">ROUE DES AVANTAGES</span>
          </span>
        </div>
      </div>

      {/* Main Page Header */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-5 pb-2 text-center space-y-2 box-border w-full">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-widest max-w-full truncate">
          🎁 TIRAGE SOUVERAIN ÉLITE
        </div>
        <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight font-mono break-words">
          TENTE TA CHANCE
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono max-w-md mx-auto leading-relaxed">
          Des avantages Premium peuvent être remportés. Participez et débloquez des bonus exclusifs.
        </p>
      </div>

      {/* Wheel Section */}
      <div className="max-w-4xl mx-auto px-1.5 sm:px-4 mt-2 box-border w-full">
        <GomboWheelSection
          currentUserProfile={currentUserProfile}
          onRefreshProfile={onRefreshProfile}
          audioSynth={audioSynth}
        />
      </div>
    </div>
  );
}
