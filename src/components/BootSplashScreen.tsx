import React, { useEffect, useState, useRef } from "react";
import { bootManager } from "../lib/BootManager";
import { AfriGomboLogo } from "./AfriGomboLogo";

interface BootSplashScreenProps {
  onComplete: () => void;
}

export default function BootSplashScreen({ onComplete }: BootSplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Connexion au Temple...");
  const [isFinished, setIsFinished] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const finish = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      if (isMounted) {
        setProgress(100);
        setStatusText("Bienvenue dans le Temple");
        setIsFinished(true);
        setTimeout(() => {
          onComplete();
        }, 300);
      } else {
        onComplete();
      }
    };

    // 1. Run background diagnostics in non-blocking background task
    bootManager.runDiagnostics().catch((e) => {
      console.warn("[BOOT] Non-blocking background diagnostics notice:", e);
    });

    // 2. Automatic visual progress steps (0% -> 25% -> 55% -> 80% -> 100%)
    const t1 = setTimeout(() => {
      if (isMounted && !completedRef.current) {
        setProgress(25);
        setStatusText("Connexion au Temple...");
      }
    }, 300);

    const t2 = setTimeout(() => {
      if (isMounted && !completedRef.current) {
        setProgress(55);
        setStatusText("Synchronisation des opportunités...");
      }
    }, 700);

    const t3 = setTimeout(() => {
      if (isMounted && !completedRef.current) {
        setProgress(80);
        setStatusText("Préparation du Temple...");
      }
    }, 1200);

    const t4 = setTimeout(() => {
      finish();
    }, 1600);

    // 3. Absolute safety fallback timeout (max 2 seconds)
    const maxSafetyTimeout = setTimeout(() => {
      finish();
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(maxSafetyTimeout);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[99999] bg-[#050505] text-afri-text flex flex-col items-center justify-center p-6 select-none font-mono">
      <div className="max-w-sm w-full bg-afri-bg-sec border border-[#D4AF37]/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center space-y-6 relative overflow-hidden">
        
        {/* Ambient Gold Glow */}
        <div className="absolute w-48 h-48 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />

        {/* Official "A" AFRIGOMBO Logo with Crown and Musical Notes */}
        <div className="w-24 h-24 relative flex items-center justify-center my-2">
          <AfriGomboLogo className="w-24 h-24 relative z-10 drop-shadow-[0_0_25px_rgba(212,175,55,0.4)] animate-pulse" />
        </div>

        {/* Brand Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-[#D4AF37] tracking-[0.2em] uppercase font-sans">AFRIGOMBO</h1>
          <p className="text-[11px] text-afri-text-sec uppercase tracking-widest font-sans font-medium">
            Le Temple du Gombo Musical
          </p>
        </div>

        {/* Smooth Gold Progress Bar */}
        <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden border border-[#D4AF37]/20 relative my-2">
          <div 
            className="h-full bg-gradient-to-r from-amber-600 via-[#D4AF37] to-amber-300 transition-all duration-300 ease-out rounded-full shadow-[0_0_12px_rgba(212,175,55,0.6)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current Status Message */}
        <div className="text-xs text-[#D4AF37] font-semibold h-5 flex items-center justify-center">
          {isFinished ? (
            <span className="text-emerald-400 font-bold tracking-wider animate-bounce">✨ Bienvenue</span>
          ) : (
            <span className="animate-pulse">{statusText}</span>
          )}
        </div>
      </div>
    </div>
  );
}
