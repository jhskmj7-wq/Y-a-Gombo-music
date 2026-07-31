import React, { useEffect, useState } from "react";
import { bootManager, BootTaskResult } from "../lib/BootManager";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { clearAppCaches } from "../lib/cachePurge";

interface BootSplashScreenProps {
  onComplete: () => void;
}

export default function BootSplashScreen({ onComplete }: BootSplashScreenProps) {
  const [tasks, setTasks] = useState<BootTaskResult[]>([]);
  const [currentStep, setCurrentStep] = useState<string>("Inauguration du Temple...");
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function runBootSequence() {
      const results = await bootManager.runDiagnostics((taskName) => {
        if (!mounted) return;
        setCurrentStep(taskName);
        setTasks(bootManager.getResults());
      });

      if (mounted) {
        setTasks(results);
        setIsFinished(true);
        setTimeout(() => {
          if (mounted) onComplete();
        }, 1000);
      }
    }

    runBootSequence();

    return () => {
      mounted = false;
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0A0A10] text-white flex flex-col items-center justify-center p-6 select-none font-mono">
      <div className="max-w-md w-full bg-zinc-950/90 border border-[#D4AF37]/30 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col items-center text-center space-y-5">
        
        {/* Logo Header */}
        <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.25)]">
          <span className="text-3xl">🪘</span>
        </div>

        <div>
          <h1 className="text-lg font-black text-[#D4AF37] tracking-widest uppercase">AFRIGOMBO</h1>
          <p className="text-[11px] text-zinc-400 mt-0.5 uppercase tracking-wider">Vérification du Temple...</p>
        </div>

        {/* Diagnostic Checklist */}
        <div className="w-full bg-zinc-900/90 rounded-2xl p-3 border border-zinc-800 space-y-1.5 text-left max-h-48 overflow-y-auto">
          {tasks.map((task) => (
            <div key={task.name} className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/40 last:border-0">
              <span className="text-zinc-300 font-sans font-medium">{task.name}</span>
              <div className="flex items-center gap-1">
                {task.status === "OK" && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> OK
                  </span>
                )}
                {task.status === "WARNING" && (
                  <span className="text-amber-400 font-bold flex items-center gap-1 text-[10px]">
                    <AlertCircle className="w-3.5 h-3.5" /> WARN
                  </span>
                )}
                {task.status === "ERROR" && (
                  <span className="text-rose-500 font-bold flex items-center gap-1 text-[10px]">
                    <AlertCircle className="w-3.5 h-3.5" /> ERR
                  </span>
                )}
                {task.status === "PENDING" && (
                  <RefreshCw className="w-3 h-3 text-[#D4AF37] animate-spin" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Current status message */}
        <div className="text-xs text-[#D4AF37] font-semibold h-5 flex items-center justify-center">
          {isFinished ? (
            <span className="text-emerald-400 text-xs font-bold tracking-wider animate-bounce">✨ Bienvenue</span>
          ) : (
            <span className="animate-pulse">{currentStep}...</span>
          )}
        </div>

        {/* Manual Cache Clean Button */}
        <div className="pt-1">
          <button
            onClick={clearAppCaches}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 underline uppercase tracking-wider cursor-pointer"
          >
            Nettoyer les caches
          </button>
        </div>
      </div>
    </div>
  );
}
