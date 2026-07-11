import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Crown, Flame, ShieldAlert, Cpu, Heart, AlertOctagon, HelpCircle } from "lucide-react";

interface ThroneCinematicIntroProps {
  onComplete: () => void;
}

export default function ThroneCinematicIntro({ onComplete }: ThroneCinematicIntroProps) {
  const [cinematicStep, setCinematicStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [textLog, setTextLog] = useState<string>("Recherche du canal de souveraineté...");
  const [showPulse, setShowPulse] = useState(false);

  // Safe Web Audio API sound generator for "battement grave" (deep bass sub-pulse heartbeat)
  const playGraveHeartbeat = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playFreqPulse = (time: number, freq: number, dur: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(8, time + dur);
        
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        
        osc.start(time);
        osc.stop(time + dur);
      };

      const now = ctx.currentTime;
      playFreqPulse(now, 60, 0.5, 0.9); // 1st beat (Deep sub-bass)
      
      setTimeout(() => {
        try {
          playFreqPulse(ctx.currentTime, 45, 0.6, 0.95); // 2nd beat (Even deeper)
        } catch (_) {}
      }, 250);
    } catch (err) {
      console.warn("Heartbeat audio blocked or unsupported:", err);
    }
  };

  // Timed sequence according to RÈGLE N°2
  useEffect(() => {
    // Stop ordinary background audio
    try {
      const audios = document.querySelectorAll("audio");
      audios.forEach(a => a.pause());
    } catch (e) {
      console.warn("Could not pause standard audios", e);
    }

    // Étape 1: Black screen + slowly appearing golden light
    const t1 = setTimeout(() => {
      setShowPulse(true);
      playGraveHeartbeat();
      setCinematicStep(2); // Move to floating particles & fog
    }, 150);

    // Étape 3: Logo, crown, and drum traditional icons fade in
    const t2 = setTimeout(() => {
      setCinematicStep(3);
    }, 550);

    // Étape 4: Text status progression list
    const t3 = setTimeout(() => {
      setCinematicStep(4);
      setTextLog("Le Temple du Gombo reconnaît son Gardien.");
    }, 1100);

    const t4 = setTimeout(() => {
      setTextLog("Chargement du Trône...");
    }, 1900);

    // Gate opening
    const t5 = setTimeout(() => {
      setCinematicStep(5);
    }, 2550);

    // Complete intro
    const t6 = setTimeout(() => {
      onComplete();
    }, 3350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [onComplete]);

  // Gold dust particles canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      fadeSpeed: number;
    }

    const particles: Particle[] = [];
    const maxParticles = 45;

    const createParticle = (centerX: number, centerY: number, isBurst = false): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = isBurst ? Math.random() * 3 + 1 : Math.random() * 0.7 + 0.15;
      return {
        x: centerX + (Math.random() - 0.5) * (isBurst ? 10 : 150),
        y: centerY + (Math.random() - 0.5) * (isBurst ? 10 : 150),
        size: Math.random() * (isBurst ? 3 : 2) + 0.5,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed - (isBurst ? 0.1 : 0.3), // slow natural upward drift
        opacity: Math.random() * 0.7 + 0.3,
        fadeSpeed: Math.random() * 0.008 + 0.002,
      };
    };

    // Initialize initial ambient gold dust
    for (let i = 0; i < 20; i++) {
      particles.push(createParticle(width / 2, height / 2));
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Radial dark background glow
      const bgGlow = ctx.createRadialGradient(
        width / 2,
        height / 2,
        20,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.7
      );
      
      // Let the radial golden glow gradually increase with step
      if (cinematicStep === 1) {
        bgGlow.addColorStop(0, "rgba(0, 0, 0, 1)");
        bgGlow.addColorStop(1, "rgba(0, 0, 0, 1)");
      } else {
        const glowOpacity = Math.min(0.2, (cinematicStep - 1) * 0.05);
        bgGlow.addColorStop(0, `rgba(180, 140, 30, ${glowOpacity})`);
        bgGlow.addColorStop(0.4, "rgba(5, 4, 1, 1)");
        bgGlow.addColorStop(1, "rgba(0, 0, 0, 1)");
      }
      
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // Add new particles periodically
      if (particles.length < maxParticles && Math.random() < 0.2) {
        particles.push(createParticle(width / 2, height * 0.6));
      }

      // Draw & update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity -= p.fadeSpeed;

        if (p.opacity <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        const isBrilliant = Math.random() > 0.45;
        const colorPrefix = isBrilliant ? "rgba(255, 215, 0, " : "rgba(212, 175, 55, ";
        ctx.fillStyle = `${colorPrefix}${p.opacity})`;
        
        // Removed heavy canvas shadowBlur to keep frame rates buttery smooth at 60 FPS on all devices
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [cinematicStep]);

  return (
    <div className="fixed inset-0 z-[999] bg-black select-none overflow-hidden flex flex-col items-center justify-center font-sans">
      {/* Golden dusty canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* RÈGLE N°2: Brouillard (CSS misty overlay) */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_bottom,rgba(212,175,55,0.08),transparent_70%)] animate-pulse duration-[8s]" />

      {/* Geometric patterns overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Elegant discrete Skip button */}
      <button
        type="button"
        onClick={onComplete}
        className="absolute top-6 right-6 z-50 px-3 py-1.5 bg-black/60 hover:bg-black/90 border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#D4AF37] rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all duration-300 cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.1)] hover:scale-105 active:scale-95"
      >
        <span>Passer</span>
        <span className="opacity-60 text-[9px]">✕</span>
      </button>

      <AnimatePresence mode="wait">
        {/* ----------------------------------------------------
             STEP 1 & 2: Noir Profond, Light Glow, Mist & Heartbeat
             ---------------------------------------------------- */}
        {(cinematicStep === 1 || cinematicStep === 2) && (
          <motion.div
            key="step-heart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="relative flex items-center justify-center w-full h-full"
          >
            {showPulse && (
              <motion.div
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ 
                  opacity: [0, 0.85, 0.4, 0], 
                  scale: [0.3, 1.4, 2.8, 4.5],
                }}
                transition={{ duration: 1.4, ease: "easeOut" }}
                className="absolute w-80 h-80 rounded-full border border-[#D4AF37]/40 flex items-center justify-center"
              >
                <div className="w-52 h-52 rounded-full border border-[#D4AF37]/25 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-[#D4AF37]/8" />
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-center space-y-4"
            >
              <Crown className="w-16 h-16 text-[#D4AF37] mx-auto animate-pulse drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
              <p className="text-[9px] font-mono tracking-[0.3em] uppercase text-[#D4AF37]/60">SOUVERAINETÉ</p>
            </motion.div>
          </motion.div>
        )}

        {/* ----------------------------------------------------
             STEP 3: Logo, African Crown, traditional drum (Tam-Tam)
             ---------------------------------------------------- */}
        {cinematicStep === 3 && (
          <motion.div
            key="step-icons"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 flex flex-col items-center justify-center text-center px-6 space-y-8"
          >
            {/* Logo, Crown, and Drum visual container */}
            <div className="flex gap-6 items-center justify-center">
              {/* Crown */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 80 }}
                className="w-16 h-16 rounded-full bg-black border border-[#D4AF37]/30 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.1)]"
              >
                <Crown className="w-6 h-6 text-[#D4AF37]" />
              </motion.div>

              {/* Logo Box */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="w-24 h-24 rounded-2xl bg-[#030303] border-2 border-[#D4AF37] flex flex-col items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.25)]"
              >
                <Flame className="w-10 h-10 text-[#D4AF37] fill-[#D4AF37]/15 animate-pulse" />
                <span className="text-[7px] font-mono tracking-[0.2em] uppercase font-bold text-zinc-400 mt-1">AFRI</span>
              </motion.div>

              {/* Traditional Drum (Tam-Tam represented by African djembe/drum visuals) */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 80 }}
                className="w-16 h-16 rounded-full bg-black border border-[#D4AF37]/30 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.1)] relative overflow-hidden"
              >
                {/* Traditional geometric patterns inside */}
                <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,#D4AF37,#D4AF37_2px,transparent_2px,transparent_10px)]" />
                <span className="text-xl relative z-10">🥁</span>
              </motion.div>
            </div>

            <div className="space-y-2">
              <span className="text-[8px] font-mono tracking-[0.35em] text-[#D4AF37] uppercase font-extrabold block">Reconnaissance de Souche</span>
              <h2 className="text-sm font-mono tracking-widest text-zinc-300">Éveil des gardiens ancestraux...</h2>
            </div>
          </motion.div>
        )}

        {/* ----------------------------------------------------
             STEP 4: AFRIGOMBO ELITE Texts Sequence
             ---------------------------------------------------- */}
        {cinematicStep === 4 && (
          <motion.div
            key="step-texts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-xl space-y-10"
          >
            {/* Floating Crown Emblem */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-full bg-gradient-to-b from-black to-[#050505] border border-[#D4AF37]/50 flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.15)]"
            >
              <Crown className="w-10 h-10 text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]" />
            </motion.div>

            <div className="space-y-5">
              <motion.h1
                initial={{ letterSpacing: "0.1em", opacity: 0 }}
                animate={{ letterSpacing: "0.28em", opacity: 1 }}
                transition={{ duration: 1 }}
                className="text-3xl font-display font-black text-[#D4AF37] uppercase drop-shadow-[0_4px_15px_rgba(0,0,0,0.9)]"
              >
                AFRIGOMBO ELITE
              </motion.h1>

              <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto" />

              {/* Dynamic text changing over the timer steps */}
              <div className="h-10 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={textLog}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`font-mono text-xs sm:text-sm tracking-wider uppercase font-semibold ${
                      textLog.includes("Accordé") 
                        ? "text-emerald-400 font-extrabold drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" 
                        : "text-zinc-200"
                    }`}
                  >
                    {textLog}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Subtle progress bar */}
            <div className="w-56 h-[2px] bg-zinc-950 rounded-full overflow-hidden relative border border-white/5">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3.5, ease: "easeInOut" }}
                className="absolute inset-y-0 left-0 bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]"
              />
            </div>
          </motion.div>
        )}

        {/* ----------------------------------------------------
             STEP 5: Portal/Gates Sliding Open (African Door)
             ---------------------------------------------------- */}
        {cinematicStep === 5 && (
          <motion.div
            key="step-gates"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black"
          >
            {/* Intense golden explosion flare */}
            <motion.div
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 0.5, 1], scale: [0.4, 1.2, 1.8] }}
              transition={{ duration: 1.6, ease: "easeOut" }}
              className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-[#D4AF37]/25 via-amber-500/10 to-transparent blur-3xl pointer-events-none"
            />

            {/* Portal gates */}
            <div className="relative w-[340px] h-[390px] border border-[#D4AF37]/30 rounded-3xl overflow-hidden flex shadow-[0_0_60px_rgba(212,175,55,0.2)] bg-[#020202]">
              {/* Left Door Gate */}
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: "-103%" }}
                transition={{ delay: 0.2, duration: 1.3, ease: [0.77, 0, 0.175, 1] }}
                className="w-1/2 h-full bg-[#050505] border-r border-[#D4AF37]/50 flex flex-col justify-between p-5 relative"
              >
                {/* Traditional geometric overlay */}
                <div className="absolute inset-0 opacity-[0.14] bg-[linear-gradient(45deg,#D4AF37_25%,transparent_25%),linear-gradient(-45deg,#D4AF37_25%,transparent_25%)] [background-size:18px_18px] pointer-events-none" />
                
                <div className="border-l-2 border-[#D4AF37]/40 h-full w-full p-2 flex flex-col justify-between border-t border-b rounded-l">
                  <span className="text-[10px] text-[#D4AF37]/40 font-mono font-bold">👑</span>
                  <div className="flex flex-col items-end gap-3 text-[#D4AF37]/50">
                    <div className="w-7 h-7 rounded-full border border-[#D4AF37]/30 flex items-center justify-center text-[10px]">⭐</div>
                    <div className="w-10 h-[2px] bg-[#D4AF37]/30" />
                    <div className="w-6 h-[2px] bg-[#D4AF37]/20" />
                  </div>
                  <span className="text-[10px] text-[#D4AF37]/40 font-mono uppercase font-bold">ELITE</span>
                </div>
              </motion.div>

              {/* Right Door Gate */}
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: "103%" }}
                transition={{ delay: 0.2, duration: 1.3, ease: [0.77, 0, 0.175, 1] }}
                className="w-1/2 h-full bg-[#050505] border-l border-[#D4AF37]/50 flex flex-col justify-between p-5 relative"
              >
                <div className="absolute inset-0 opacity-[0.14] bg-[linear-gradient(45deg,#D4AF37_25%,transparent_25%),linear-gradient(-45deg,#D4AF37_25%,transparent_25%)] [background-size:18px_18px] pointer-events-none" />

                <div className="border-r-2 border-[#D4AF37]/40 h-full w-full p-2 flex flex-col justify-between border-t border-b rounded-r items-end">
                  <span className="text-[10px] text-[#D4AF37]/40 font-mono font-bold">👑</span>
                  <div className="flex flex-col items-start gap-3 text-[#D4AF37]/50">
                    <div className="w-7 h-7 rounded-full border border-[#D4AF37]/30 flex items-center justify-center text-[10px]">⭐</div>
                    <div className="w-10 h-[2px] bg-[#D4AF37]/30" />
                    <div className="w-6 h-[2px] bg-[#D4AF37]/20" />
                  </div>
                  <span className="text-[10px] text-[#D4AF37]/40 font-mono uppercase font-bold">SOUV</span>
                </div>
              </motion.div>

              {/* Glowing center seal with a rotating pulse */}
              <motion.div
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-20 h-20 rounded-full bg-black border-2 border-[#D4AF37] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.7)]"
              >
                <Crown className="w-8 h-8 text-[#D4AF37] animate-pulse" />
              </motion.div>
            </div>

            {/* Glowing reveal feedback */}
            <div className="relative z-30 mt-8 text-center">
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-xs font-mono uppercase tracking-[0.25em] text-[#D4AF37] font-black"
              >
                ENTRÉE EN COURS...
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
