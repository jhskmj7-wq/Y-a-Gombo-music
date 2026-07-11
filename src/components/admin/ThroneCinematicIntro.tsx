import React, { useEffect } from "react";
import { motion } from "motion/react";
import { Crown } from "lucide-react";

interface ThroneCinematicIntroProps {
  onComplete: () => void;
}

export default function ThroneCinematicIntro({ onComplete }: ThroneCinematicIntroProps) {
  useEffect(() => {
    // Total duration of the animation sequence is 950ms.
    // Call onComplete after 950ms to immediately open the dashboard.
    const timer = setTimeout(() => {
      onComplete();
    }, 950);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[999] bg-black select-none overflow-hidden flex flex-col items-center justify-center font-sans">
      {/* 1. Black Fade (starts immediately, 150ms) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="absolute inset-0 bg-black flex flex-col items-center justify-center"
      >
        {/* Container for animations to ensure hardware acceleration */}
        <div className="relative w-full max-w-md h-96 flex flex-col items-center justify-center transform-gpu">
          
          {/* 2. Gold Particles burst (appear at 150ms, animate for 300ms) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {[...Array(16)].map((_, i) => {
              const angle = (i * 360) / 16;
              const delay = 0.15 + (i % 3) * 0.03; // staggered start
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1.2, 0.5, 0],
                    opacity: [0, 1, 0.8, 0],
                    x: Math.cos((angle * Math.PI) / 180) * 120,
                    y: Math.sin((angle * Math.PI) / 180) * 120,
                  }}
                  transition={{
                    duration: 0.45,
                    delay: delay,
                    ease: "easeOut",
                  }}
                  className="absolute w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]"
                  style={{ transform: "translate3d(0,0,0)" }}
                />
              );
            })}
          </div>

          {/* 3. Crown Appearance (appears at 450ms, animate for 250ms) */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -20 }}
            animate={{ scale: [0, 1.15, 1], opacity: 1, rotate: 0 }}
            transition={{
              duration: 0.25,
              delay: 0.45,
              ease: "easeOut",
            }}
            className="w-24 h-24 rounded-full bg-gradient-to-b from-zinc-950 to-black border border-[#D4AF37]/40 flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.4)] relative z-10"
          >
            <Crown className="w-12 h-12 text-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.6)]" />
          </motion.div>

          {/* 4. Title "Trône du Fondateur" (appears at 700ms, animate for 250ms) */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.25,
              delay: 0.70,
              ease: "easeOut",
            }}
            className="text-center mt-8 space-y-2 relative z-10"
          >
            <h1 className="text-2xl font-sans font-black text-[#D4AF37] uppercase tracking-[0.25em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              TRÔNE DU FONDATEUR
            </h1>
            <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent mx-auto" />
            <p className="text-[9px] font-mono tracking-[0.3em] uppercase text-zinc-400">
              SOUVERAINETÉ & CONTRÔLE
            </p>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
