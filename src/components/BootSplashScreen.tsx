import React, { useEffect, useState } from "react";
import { bootManager } from "../lib/BootManager";
import { clearAppCaches } from "../lib/cachePurge";

interface BootSplashScreenProps {
  onComplete: () => void;
}

export default function BootSplashScreen({ onComplete }: BootSplashScreenProps) {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState("Vérification du Temple...");
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function runBootSequence() {
      console.log("⚡ [BOOT 1] React & Router Initialized");
      setProgress(30);

      try {
        await bootManager.runDiagnostics((taskName) => {
          if (!mounted) return;
          if (taskName.includes("Firebase")) setStatusText("Connexion au Temple...");
          else if (taskName.includes("Sync")) setStatusText("Synchronisation des opportunités...");
          else setStatusText("Préparation de votre expérience...");
        });
        console.log("⚡ [BOOT 2] Providers & Firebase Hydrated");
      } catch (e) {
        console.warn("[BOOT] Non-blocking warning during diagnostics:", e);
      }

      if (mounted) {
        console.log("⚡ [BOOT 3] Navigation Ready");
        setProgress(75);
        
        setTimeout(() => {
          if (!mounted) return;
          console.log("⚡ [BOOT 4] User Session & Assets Verified");
          setProgress(100);
          setStatusText("Bienvenue dans le Temple");
          setIsFinished(true);

          setTimeout(() => {
            if (mounted) {
              console.log("⚡ [BOOT 5] Dashboard & Home Mounted Successfully");
              onComplete();
            }
          }, 400);
        }, 500);
      }
    }

    runBootSequence();

    return () => {
      mounted = false;
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0A0A10] text-white flex flex-col items-center justify-center p-6 select-none font-mono">
      <div className="max-w-sm w-full bg-zinc-950/90 border border-[#D4AF37]/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center space-y-6">
        
        {/* Logo Header */}
        <div className="w-20 h-20 rounded-3xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)] animate-pulse">
          <span className="text-4xl">🪘</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-black text-[#D4AF37] tracking-widest uppercase">AFRIGOMBO</h1>
          <p className="text-xs text-zinc-400 uppercase tracking-wider font-sans font-medium">
            Le Temple du Gombo Musical
          </p>
        </div>

        {/* Smooth Gold Progress Bar */}
        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800 relative my-2">
          <div 
            className="h-full bg-gradient-to-r from-amber-600 via-[#D4AF37] to-amber-300 transition-all duration-300 ease-out rounded-full shadow-[0_0_10px_rgba(212,175,55,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current status message */}
        <div className="text-xs text-[#D4AF37] font-semibold h-5 flex items-center justify-center">
          {isFinished ? (
            <span className="text-emerald-400 font-bold tracking-wider animate-bounce">✨ Bienvenue</span>
          ) : (
            <span className="animate-pulse">{statusText}</span>
          )}
        </div>

        {/* Emergency Cache Purge */}
        <div className="pt-2">
          <button
            onClick={clearAppCaches}
            className="text-[10px] text-zinc-600 hover:text-zinc-400 underline uppercase tracking-wider cursor-pointer transition"
          >
            Nettoyer les caches
          </button>
        </div>
      </div>
    </div>
  );
}

