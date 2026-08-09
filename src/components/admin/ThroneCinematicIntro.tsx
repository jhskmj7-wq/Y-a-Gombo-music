import React, { useEffect } from "react";
import { motion } from "motion/react";
import { Crown, X } from "lucide-react";

interface ThroneCinematicIntroProps {
  onComplete: () => void;
}

export default function ThroneCinematicIntro({ onComplete }: ThroneCinematicIntroProps) {
  useEffect(() => {
    // Total duration of the animation overlay sequence is 700ms
    const timer = setTimeout(() => {
      onComplete();
    }, 700);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      onClick={onComplete}
      className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md select-none overflow-hidden flex flex-col items-center justify-center font-sans cursor-pointer animate-fadeIn"
      title="Cliquer pour passer"
    >
      {/* Skip Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onComplete(); }}
        className="absolute top-6 right-6 z-20 flex items-center gap-1.5 px-4 py-2 bg-black/60 border border-[#D4AF37]/50 rounded-full text-xs font-mono uppercase text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all cursor-pointer shadow-lg"
      >
        <span>Passer</span>
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Animation Container */}
      <div className="relative w-full max-w-md h-96 flex flex-col items-center justify-center transform-gpu">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {[...Array(16)].map((_, i) => {
            const angle = (i * 360) / 16;
            const delay = (i % 3) * 0.02;
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1.2, 0.5, 0],
                  opacity: [0, 1, 0.8, 0],
                  x: Math.cos((angle * Math.PI) / 180) * 110,
                  y: Math.sin((angle * Math.PI) / 180) * 110,
                }}
                transition={{
                  duration: 0.4,
                  delay: delay,
                  ease: "easeOut",
                }}
                className="absolute w-2.5 h-2.5 rounded-full bg-afri-bg-sec shadow-[0_0_10px_#D4AF37]"
                style={{ transform: "translate3d(0,0,0)" }}
              />
            );
          })}
        </div>

        {/* Crown Icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -20 }}
          animate={{ scale: [0, 1.15, 1], opacity: 1, rotate: 0 }}
          transition={{
            duration: 0.25,
            delay: 0.1,
            ease: "easeOut",
          }}
          className="w-24 h-24 rounded-full bg-gradient-to-b from-afri-bg-action to-afri-bg border border-[#D4AF37]/40 flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.4)] relative z-10"
        >
          <Crown className="w-12 h-12 text-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.6)]" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.25,
            delay: 0.25,
            ease: "easeOut",
          }}
          className="text-center mt-6 space-y-2 relative z-10"
        >
          <h1 className="text-2xl font-sans font-black text-[#D4AF37] uppercase tracking-[0.25em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            TRÔNE DU FONDATEUR
          </h1>
          <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent mx-auto" />
          <p className="text-[9px] font-mono tracking-[0.3em] uppercase text-afri-text-sec">
            SOUVERAINETÉ & CONTRÔLE
          </p>
        </motion.div>
      </div>
    </div>
  );
}
