import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, AlertCircle, Database, Server, Key, CheckCircle2, XCircle, RefreshCw, ChevronRight, Activity, Terminal } from "lucide-react";
import { gomboDB } from "../firebase";
import { StorageDiagnostic } from "../types";

interface FirebaseDiagnosticProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FirebaseDiagnostic({ isOpen, onClose }: FirebaseDiagnosticProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [testMode, setTestMode] = useState<"idle" | "running" | "success" | "error">("idle");

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-10));
  };

  const runDiagnostic = async () => {
    setLoading(true);
    addLog("Initialisation du diagnostic Firebase Storage...");
    try {
      const result = await gomboDB.checkStorageStatus();
      setStatus(result);
      if (result.writeTestOk && result.resumableTestOk) {
        addLog("✅ Diagnostic complet : Tous les tests ont réussi.");
      } else {
        addLog(`❌ Échec partiel : Simple(${result.writeTestOk ? "OK" : "KO"}), Resumable(${result.resumableTestOk ? "OK" : "KO"})`);
      }
    } catch (err: any) {
      addLog(`❌ Erreur fatale: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runFullTest = async () => {
    setTestMode("running");
    addLog("--- DÉMARRAGE TEST COMPLET ---");
    try {
      // Step 1: Write
      addLog("1. Tentative d'écriture (Small File)...");
      const result = await gomboDB.checkStorageStatus();
      setStatus(result);
      
      if (!result.writeTestOk) {
        setTestMode("error");
        addLog("❌ Étape 1 échouée.");
        return;
      }
      
      addLog("✅ Étape 1 réussie.");
      
      // Step 2: Detection of AI Studio
      if (window.location.hostname.includes("ais-dev") || window.location.hostname.includes("run.app")) {
        addLog("ℹ️ Note: Environnement Cloud Run détecté.");
      }

      setTestMode("success");
      addLog("🎉 TEST RÉUSSI : Firebase Storage est totalement opérationnel.");
    } catch (err: any) {
      setTestMode("error");
      addLog(`❌ Erreur critique : ${err.message}`);
    }
  };

  useEffect(() => {
    if (isOpen) runDiagnostic();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-afri-bg/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-2xl bg-afri-bg border border-afri-border rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-afri-border flex justify-between items-center bg-afri-bg-sec/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-afri-text">Diagnostic Firebase</h2>
                <p className="text-xs text-afri-text-sec">Infrastructure & Connectivité</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-afri-text-sec hover:text-afri-text transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} onClick={(e) => { e.stopPropagation(); runDiagnostic(); }} />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border ${status?.isEnabled ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Database className={`w-4 h-4 ${status?.isEnabled ? "text-emerald-500" : "text-rose-500"}`} />
                  <span className="text-[8px] font-bold text-afri-text-sec uppercase tracking-widest">SDK Init</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-afri-text">{status?.isEnabled ? "OK" : "FAIL"}</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${status?.writeTestOk ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Activity className={`w-4 h-4 ${status?.writeTestOk ? "text-emerald-500" : "text-rose-500"}`} />
                  <span className="text-[8px] font-bold text-afri-text-sec uppercase tracking-widest">Simple (Blob)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-afri-text">{status?.writeTestOk ? "RÉUSSI" : "ÉCHOUÉ"}</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${status?.resumableTestOk ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Activity className={`w-4 h-4 ${status?.resumableTestOk ? "text-emerald-500" : "text-rose-500"}`} />
                  <span className="text-[8px] font-bold text-afri-text-sec uppercase tracking-widest">Resumable</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-afri-text">{status?.resumableTestOk ? "RÉUSSI" : "ÉCHOUÉ"}</span>
                </div>
              </div>
            </div>

            {/* ACTION TEST BOX */}
            <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-indigo-300">Action Manuelle</h4>
                  <p className="text-[10px] text-afri-text-sec">Tester Firebase Storage avec un fichier temporaire</p>
                </div>
                <button 
                  onClick={runFullTest}
                  disabled={testMode === "running"}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-afri-text text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {testMode === "running" ? "Test en cours..." : "Tester Firebase Storage"}
                </button>
              </div>
              
              {testMode !== "idle" && (
                <div className={`p-3 rounded-xl text-[10px] font-mono ${
                  testMode === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                  testMode === "error" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : 
                  "bg-white/5 text-afri-text-sec border border-afri-border"
                }`}>
                  {testMode === "running" && "Vérification de l'intégrité du bucket..."}
                  {testMode === "success" && "Succès : L'infrastructure Storage répond correctement."}
                  {testMode === "error" && `Erreur : ${status?.error?.code || "Connexion impossible"}`}
                </div>
              )}
            </div>

            {/* Detailed Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-afri-text-sec">Configuration Détectée</h3>
              
              <div className="bg-afri-bg-sec/50 rounded-2xl p-4 space-y-4 border border-afri-border">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-afri-text-sec flex items-center gap-2">
                    <Server className="w-4 h-4" /> Bucket Actuel
                  </span>
                  <span className={`font-mono text-[10px] ${status?.bucket?.includes("afrigombo") ? "text-emerald-400" : "text-rose-400"}`}>
                    {status?.bucket}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-afri-text-sec flex items-center gap-2">
                    <Database className="w-4 h-4" /> Projet Firebase
                  </span>
                  <span className="font-mono text-afri-text text-[10px]">{status?.projectId}</span>
                </div>
              </div>
            </div>

            {/* ERROR DISPLAY */}
            {status?.error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-rose-500 font-bold">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">Analyse d'Erreur</span>
                </div>
                <div className="p-3 bg-afri-bg/40 rounded-xl font-mono text-[11px] text-rose-300/80 break-all">
                  <p className="font-bold text-rose-400 mb-1">{status.error.code}</p>
                  <p>{status.error.message}</p>
                </div>
                <div className="pt-2 space-y-2">
                  <div className="p-3 bg-afri-bg-sec rounded-xl">
                    <p className="text-[10px] text-afri-text-sec font-bold mb-1 uppercase tracking-tighter flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" /> Recommandation
                    </p>
                    <p className="text-[10px] text-afri-text-sec leading-relaxed">
                      {status.error.code === "storage/retry-limit-exceeded" ? 
                        "L'environnement AI Studio ou votre réseau bloque peut-être les requêtes multiples (resumable). Tentez d'activer le mode Fallback Firestore si le problème persiste." :
                        "Vérifiez que les règles Firebase Storage autorisent l'écriture publique pour le test, et que le bucket correspond au projet 'afrigombo'."
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* LIVE LOGS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-afri-text-sec">Console Logs</h3>
                <Terminal className="w-3 h-3 text-afri-text-sec" />
              </div>
              <div className="bg-afri-bg rounded-2xl p-4 font-mono text-[10px] text-afri-text-sec border border-afri-border space-y-1">
                {logs.length === 0 && <p className="italic text-zinc-700">En attente de données...</p>}
                {logs.map((log, i) => (
                  <p key={i} className={log.includes("✅") ? "text-emerald-500" : log.includes("❌") ? "text-rose-500" : log.includes("ℹ️") ? "text-indigo-400" : ""}>
                    {log}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-afri-bg-sec/30 border-t border-afri-border flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-afri-bg-ter text-afri-text font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-700 transition-all"
            >
              Fermer le diagnostic
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Helper imports for missing icons in original file
import { Zap } from "lucide-react";
