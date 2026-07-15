import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, Volume2, VolumeX } from "lucide-react";
import { globalAudioManager } from "../lib/audioManager";

interface AfrigomboCinematicIntroProps {
  onComplete: () => void;
}

export default function AfrigomboCinematicIntro({ onComplete }: AfrigomboCinematicIntroProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(() => globalAudioManager.getIsMuted());

  // Timing markers:
  // 0s: Black screen
  // 0.5s: Glow appears
  // 1.0s: Gold particles appear
  // 2.0s: Logo fades in
  // 3.0s: Play intro music
  // 4.0s: Text 1 ("Bienvenue.")
  // 6.5s: Text 2 ("Le Temple du Gombo ouvre ses portes.")
  // 9.0s: Text 3 ("Ici, les talents deviennent des opportunités.")
  // 11.5s: Text 4 ("Bienvenue dans AFRIGOMBO.")
  // 14.5s: Narrative complete, "Entrer dans AFRIGOMBO" button fades in

  useEffect(() => {
    const startTime = Date.now();
    let musicPlayed = false;

    const interval = setInterval(() => {
      const currentElapsed = (Date.now() - startTime) / 1000;
      setElapsed(currentElapsed);

      // Play introductory track automatically at 3.0 seconds
      if (currentElapsed >= 3.0 && !musicPlayed) {
        musicPlayed = true;
        try {
          globalAudioManager.playIntro(true);
        } catch (err) {
          console.warn("Audio play failed during cinematic intro:", err);
        }
      }

      if (currentElapsed >= 18.0) {
        clearInterval(interval);
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    globalAudioManager.setIsMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const handleSkip = () => {
    // Skip to end or complete immediately
    try {
      globalAudioManager.stopAll();
    } catch (_) {}
    onComplete();
  };

  const handleEnter = () => {
    try {
      globalAudioManager.stopAll();
    } catch (_) {}
    onComplete();
  };

  // Determine current active text based on timeline
  let activeText = "";
  if (elapsed >= 4.0 && elapsed < 6.5) {
    activeText = "Bienvenue.";
  } else if (elapsed >= 6.5 && elapsed < 9.0) {
    activeText = "Le Temple du Gombo ouvre ses portes.";
  } else if (elapsed >= 9.0 && elapsed < 11.5) {
    activeText = "Ici, les talents deviennent des opportunités.";
  } else if (elapsed >= 11.5) {
    activeText = "Bienvenue dans AFRIGOMBO.";
  }

  const showGlow = elapsed >= 0.5;
  const showParticles = elapsed >= 1.0;
  const showLogo = elapsed >= 2.0;
  const showButton = elapsed >= 14.0;

  return (
    <div className="fixed inset-0 bg-[#020202] z-[10000] flex flex-col items-center justify-center text-center select-none overflow-hidden font-sans">
      
      {/* 1. DISCRETE CONTROLS (Passer & Mute) */}
      <div className="absolute top-6 inset-x-6 flex justify-between items-center z-50">
        <button
          onClick={handleToggleMute}
          className="p-3 bg-zinc-950/60 border border-zinc-900/40 rounded-full hover:border-[#D4AF37]/50 text-zinc-400 hover:text-[#D4AF37] transition-all cursor-pointer"
          title={isMuted ? "Activer le son" : "Mettre en sourdine"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={handleSkip}
          className="px-4 py-2 bg-zinc-950/60 border border-zinc-900/40 rounded-full text-zinc-400 hover:text-[#D4AF37] text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer hover:border-[#D4AF37]/50 active:scale-95"
        >
          ▶ Passer
        </button>
      </div>

      {/* 2. AMBIENT GLOW */}
      <AnimatePresence>
        {showGlow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.15, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.0, ease: "easeOut" }}
            className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#D4AF37] to-amber-500 blur-[120px] pointer-events-none z-0"
          />
        )}
      </AnimatePresence>

      {/* 3. FLOATING GOLD DUST PARTICLES */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {Array.from({ length: 30 }).map((_, idx) => (
            <div
              key={idx}
              className="absolute rounded-full bg-gradient-to-tr from-[#D4AF37] to-amber-200/50 opacity-40 animate-pulse"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                transform: `translateY(${Math.sin(elapsed + idx) * 10}px)`,
                animationDuration: `${Math.random() * 4 + 3}s`,
                animationDelay: `${Math.random() * 2}s`,
                transition: "transform 1.5s ease-out-in"
              }}
            />
          ))}
        </div>
      )}

      {/* 4. CENTRAL LOGO / SYMBOL */}
      <div className="relative mb-12 z-20">
        <AnimatePresence>
          {showLogo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="relative w-48 h-48 flex items-center justify-center border border-[#D4AF37]/20 rounded-full bg-black/60 shadow-[0_0_60px_rgba(212,175,55,0.1)] overflow-hidden"
            >
              {/* Spinning sound-glow pattern */}
              <div className="absolute inset-2 border border-dashed border-[#D4AF37]/15 rounded-full animate-spin" style={{ animationDuration: "25s" }} />

              <img 
                src="/public/logo_afrigombo.png" 
                alt="AFRIGOMBO Logo" 
                className="w-32 h-32 object-contain relative z-10"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. NARRATIVE TEXT SEQUENCE */}
      <div className="h-28 flex items-center justify-center px-6 max-w-xl z-20">
        <AnimatePresence mode="wait">
          {activeText && (
            <motion.div
              key={activeText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 1.0, ease: "easeInOut" }}
              className="space-y-2"
            >
              <p className="text-lg md:text-xl font-medium text-neutral-100 tracking-wide leading-relaxed font-sans">
                {activeText}
              </p>
              {activeText === "Bienvenue dans AFRIGOMBO." && (
                <p className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-[0.2em] animate-pulse">
                  LE TEMPLE DE L'ART ET DES OPPORTUNITÉS
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 6. ENTRY BUTTON */}
      <div className="h-20 flex items-center justify-center z-30">
        <AnimatePresence>
          {showButton && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              onClick={handleEnter}
              className="group relative px-8 py-4 bg-gradient-to-r from-amber-600 via-[#D4AF37] to-amber-500 rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-black shadow-[0_0_35px_rgba(212,175,55,0.2)] hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all duration-500 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-3"
            >
              <span>Entrer dans AFRIGOMBO</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              
              {/* Animated pulse halo */}
              <span className="absolute inset-0 rounded-2xl border-2 border-[#D4AF37] animate-ping opacity-20 scale-105 pointer-events-none" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 7. DISCRETE FOOTER */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-mono uppercase tracking-[0.34em] text-zinc-600 z-25">
        AFRIGOMBO © 2026 ● ABIDJAN
      </div>

    </div>
  );
}
