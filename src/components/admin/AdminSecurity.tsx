import React, { useState } from "react";
import { ShieldCheck, Terminal, Database, RefreshCw, Cpu, Activity, Play } from "lucide-react";

interface AdminSecurityProps {
  adminLogs: string[];
  scannerStatus: "idle" | "scanning" | "completed";
  onTriggerSystemScan?: () => void;
  audioSynth?: any;
}

export default function AdminSecurity({
  adminLogs = [],
  scannerStatus = "idle",
  onTriggerSystemScan,
  audioSynth
}: AdminSecurityProps) {
  const [terminalInput, setTerminalInput] = useState("");
  const [customLogs, setCustomLogs] = useState<string[]>([]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const command = terminalInput.trim();
    const newLog = `[SYSTEM@AFRIGOMBO] $ ${command}`;
    let responseLog = "";

    if (command.toLowerCase() === "help") {
      responseLog = "Commandes autorisées: help, scan, clear, status, diagnostics";
    } else if (command.toLowerCase() === "scan") {
      if (onTriggerSystemScan) onTriggerSystemScan();
      responseLog = "Démarrage du scan global d'analyse autonome...";
    } else if (command.toLowerCase() === "clear") {
      setCustomLogs([]);
      setTerminalInput("");
      return;
    } else if (command.toLowerCase() === "status") {
      responseLog = "Moteur IA: Opérationnel • Base de données Firestore: Synchronisée • Certifications Gombo ID: Stable";
    } else if (command.toLowerCase() === "diagnostics") {
      responseLog = "CPU: 1.4% • RAM: 182MB • Latence API: 14ms • Sécurité: Active (Niveau 3)";
    } else {
      responseLog = `Erreur: commande inconnue: "${command}". Tapez "help" pour voir les commandes.`;
    }

    setCustomLogs((prev) => [newLog, `> ${responseLog}`, ...prev]);
    setTerminalInput("");
    try { audioSynth?.playValidationSuccess(); } catch (_) {}
  };

  const combinedLogs = [...customLogs, ...adminLogs];

  return (
    <div className="space-y-6 text-left pb-24 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37] flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-[#D4AF37]" />
          Diagnostics, Journal de Sécurité & Terminal
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Surveillez le moteur autonome d'AFRIGOMBO et exécutez des commandes système via le Terminal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Diagnostics Card */}
        <div className="lg:col-span-1 p-6 bg-[#070707] border border-zinc-900 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase font-black tracking-wider text-white flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#D4AF37]" />
              Moteur d'Analyse Autonome
            </h4>

            <div className="p-4 bg-black border border-zinc-900 rounded-xl space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-mono">Scan de Sécurité</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                  scannerStatus === "scanning"
                    ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                    : scannerStatus === "completed"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "bg-zinc-800 text-zinc-400"
                }`}>
                  {scannerStatus === "scanning" ? "Scan en cours..." : scannerStatus === "completed" ? "Terminé" : "Inactif"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-mono">Pare-feu d'Abidjan</span>
                <span className="text-emerald-400 font-mono">ACTIVE (LVL 3)</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-900 mt-6">
            <button
              onClick={onTriggerSystemScan}
              disabled={scannerStatus === "scanning"}
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-black font-black text-xs uppercase flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-55"
            >
              <RefreshCw className={`w-4 h-4 ${scannerStatus === "scanning" ? "animate-spin" : ""}`} />
              {scannerStatus === "scanning" ? "Analyse en cours..." : "Lancer un scan global"}
            </button>
          </div>
        </div>

        {/* Console / Terminal Terminal Card */}
        <div className="lg:col-span-2 p-6 bg-[#030304] border border-[#D4AF37]/20 rounded-2xl flex flex-col h-96 relative overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.03)]">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-4 shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] font-black flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              Terminal de Contrôle Central
            </span>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
          </div>

          {/* Logs feed scrolling box */}
          <div className="flex-1 overflow-y-auto font-mono text-[10px] text-zinc-400 space-y-2 mb-4 scrollbar-none pr-2">
            {combinedLogs.length === 0 ? (
              <div className="text-zinc-600 italic">Prêt à recevoir les instructions. Tapez "help" pour commencer...</div>
            ) : (
              combinedLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log}
                </div>
              ))
            )}
          </div>

          {/* Terminal Input Form */}
          <form onSubmit={handleCommandSubmit} className="flex gap-2 border-t border-zinc-900 pt-3 shrink-0">
            <span className="text-[#D4AF37] font-mono text-xs mt-2">$</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="Saisissez une commande... (help, status, scan, clear)"
              className="flex-1 bg-transparent border-none text-[#D4AF37] font-mono text-xs focus:outline-none placeholder-zinc-700"
            />
            <button type="submit" className="text-zinc-500 hover:text-[#D4AF37] transition-all">
              <Play className="w-4 h-4 fill-current" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
