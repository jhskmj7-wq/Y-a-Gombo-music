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
    <div className={`w-full min-h-[90vh] pb-12 font-sans ${isLight ? "bg-[#FDFBF7] text-gray-900" : "bg-[#050505] text-white"}`}>
      {/* Top Header Navigation */}
      <div className={`sticky top-0 z-30 px-4 sm:px-6 py-3.5 border-b flex items-center justify-between ${
        isLight ? "bg-[#FDFBF7]/95 border-gray-200" : "bg-[#050505]/95 border-zinc-800"
      } backdrop-blur-md`}>
        <button
          onClick={onBack}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer ${
            isLight ? "bg-gray-100 hover:bg-gray-200 text-gray-800" : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-black font-mono tracking-wider uppercase flex items-center gap-1.5 text-[#D4AF37]">
            <Gift className="w-4 h-4" />
            <span>ROUE DES AVANTAGES</span>
          </span>
        </div>
      </div>

      {/* Main Page Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-2 text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-mono font-black uppercase tracking-widest">
          🎁 TIRAGE SOUVERAIN ÉLITE
        </div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-mono">
          TENTE TA CHANCE
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono max-w-md mx-auto">
          Des avantages Premium peuvent être remportés. Participez et débloquez des bonus exclusifs.
        </p>
      </div>

      {/* Wheel Section (Reusing GomboWheelSection with 100% existing logic) */}
      <div className="max-w-4xl mx-auto px-2 sm:px-4 mt-2">
        <GomboWheelSection
          currentUserProfile={currentUserProfile}
          onRefreshProfile={onRefreshProfile}
          audioSynth={audioSynth}
        />
      </div>
    </div>
  );
}
