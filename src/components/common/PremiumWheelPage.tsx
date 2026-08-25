import React, { useEffect, useRef } from "react";
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
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkHeight = () => {
      if (elementRef.current) {
        console.log(
          "[WHEEL PAGE HEIGHT] scrollHeight:",
          elementRef.current.scrollHeight,
          "clientHeight:",
          elementRef.current.clientHeight,
          "différence (px à retirer):",
          elementRef.current.scrollHeight - elementRef.current.clientHeight
        );
      }
    };
    // Instant check + short delay check to capture SVG/DOM settlement
    checkHeight();
    const timer = setTimeout(checkHeight, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      ref={elementRef}
      className={`w-full max-w-full flex flex-col font-sans box-border ${
        isLight ? "bg-[#FDFBF7] text-gray-900" : "bg-[#050505] text-white"
      }`}
      style={{ height: "100dvh", minHeight: "100dvh", maxHeight: "100dvh", overflowY: "auto", overscrollBehavior: "none" }}
    >
      {/* Top Header Navigation - Only single return arrow */}
      <div className={`px-2.5 sm:px-4 py-2 border-b flex items-center justify-between gap-2 max-w-full shrink-0 box-border ${
        isLight ? "bg-[#FDFBF7] border-gray-200" : "bg-[#050505] border-zinc-800"
      }`}>
        <button
          onClick={onBack}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold uppercase transition cursor-pointer shrink-0 ${
            isLight ? "bg-gray-100 hover:bg-gray-200 text-gray-800" : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800"
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-1.5 min-w-0 shrink">
          <span className="text-xs sm:text-sm font-black font-mono tracking-wider uppercase flex items-center gap-1.5 text-[#D4AF37] truncate">
            <Gift className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Roue Premium</span>
          </span>
        </div>
      </div>

      {/* Main Wheel Viewport Container */}
      <div className="flex-1 w-full max-w-2xl mx-auto px-1 sm:px-2 py-1 flex flex-col items-center box-border">
        <GomboWheelSection
          currentUserProfile={currentUserProfile}
          onRefreshProfile={onRefreshProfile}
          audioSynth={audioSynth}
        />
      </div>
    </div>
  );
}
