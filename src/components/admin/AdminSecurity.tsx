import React, { useState, useEffect } from "react";
import { ShieldCheck, Terminal, Database, RefreshCw, Cpu, Activity, Play, AlertTriangle, ShieldAlert, Lock, Search } from "lucide-react";
import { gomboDB } from "../../firebase";

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
  const [alerts, setAlerts] = useState<any[]>([]);
  const [suspensions, setSuspensions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"alerts" | "suspensions" | "logs" | "audit">("alerts");

  useEffect(() => {
    const unsubAlerts = gomboDB.listenSecurityAlerts(setAlerts);
    const unsubSuspensions = gomboDB.listenSuspensions(setSuspensions);
    const unsubActivities = gomboDB.listenAllUserActivities(setActivities);
    
    return () => {
      unsubAlerts();
      unsubSuspensions();
      unsubActivities();
    };
  }, []);

  // Compute Audit stats
  const auditStats = {
    connections: activities.filter(a => a.type === "connexion").length,
    publications: activities.filter(a => a.type === "gombo_created").length,
    payments: activities.filter(a => a.type === "payment").length,
    disputes: activities.filter(a => a.type === "litige_created").length,
    frauds: alerts.filter(a => a.type === "fraud_attempt").length,
    blocks: suspensions.filter(s => s.type === "perm_block" || s.type === "temp_block").length,
  };

  return (
    <div className="space-y-6 text-left pb-24 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37] flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
          Centre de Sécurité & Audit
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Surveillez le moteur autonome d'AFRIGOMBO, les tentatives de fraude, et les journaux système en temps réel.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all border ${activeTab === "audit" ? "bg-purple-500/10 text-purple-400 border-purple-500/30" : "bg-black text-zinc-500 border-zinc-900 hover:text-white"}`}
        >
          <Database className="inline-block w-4 h-4 mr-2" />
          Audit Global
        </button>
        <button 
          onClick={() => setActiveTab("alerts")}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all border ${activeTab === "alerts" ? "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30" : "bg-black text-zinc-500 border-zinc-900 hover:text-white"}`}
        >
          <AlertTriangle className="inline-block w-4 h-4 mr-2" />
          Alertes ({alerts.length})
        </button>
        <button 
          onClick={() => setActiveTab("suspensions")}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all border ${activeTab === "suspensions" ? "bg-red-500/10 text-red-500 border-red-500/30" : "bg-black text-zinc-500 border-zinc-900 hover:text-white"}`}
        >
          <Lock className="inline-block w-4 h-4 mr-2" />
          Comptes Bloqués ({suspensions.length})
        </button>
        <button 
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all border ${activeTab === "logs" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-black text-zinc-500 border-zinc-900 hover:text-white"}`}
        >
          <Activity className="inline-block w-4 h-4 mr-2" />
          Journaux d'Action ({activities.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-6 bg-[#070707] border border-zinc-900 rounded-2xl">
        {activeTab === "audit" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-mono uppercase font-black text-white">Statistiques Globales</h4>
              <button 
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                    activities, alerts, suspensions, exportDate: new Date().toISOString()
                  }));
                  const dlAnchorElem = document.createElement('a');
                  dlAnchorElem.setAttribute("href", dataStr);
                  dlAnchorElem.setAttribute("download", `afrigombo_backup_${new Date().getTime()}.json`);
                  dlAnchorElem.click();
                }}
                className="px-3 py-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded text-[10px] font-mono hover:bg-[#D4AF37]/20 transition-all"
              >
                Exporter Sauvegarde JSON
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-black border border-zinc-900 rounded-xl">
              <div className="text-zinc-500 text-[10px] font-mono uppercase mb-1">Connexions</div>
              <div className="text-2xl font-black text-white">{auditStats.connections}</div>
            </div>
            <div className="p-4 bg-black border border-zinc-900 rounded-xl">
              <div className="text-zinc-500 text-[10px] font-mono uppercase mb-1">Publications</div>
              <div className="text-2xl font-black text-white">{auditStats.publications}</div>
            </div>
            <div className="p-4 bg-black border border-zinc-900 rounded-xl">
              <div className="text-zinc-500 text-[10px] font-mono uppercase mb-1">Paiements</div>
              <div className="text-2xl font-black text-emerald-400">{auditStats.payments}</div>
            </div>
            <div className="p-4 bg-black border border-zinc-900 rounded-xl">
              <div className="text-zinc-500 text-[10px] font-mono uppercase mb-1">Litiges</div>
              <div className="text-2xl font-black text-yellow-500">{auditStats.disputes}</div>
            </div>
            <div className="p-4 bg-black border border-zinc-900 rounded-xl">
              <div className="text-zinc-500 text-[10px] font-mono uppercase mb-1">Fraudes</div>
              <div className="text-2xl font-black text-red-500">{auditStats.frauds}</div>
            </div>
            <div className="p-4 bg-black border border-zinc-900 rounded-xl">
              <div className="text-zinc-500 text-[10px] font-mono uppercase mb-1">Blocages</div>
              <div className="text-2xl font-black text-white">{auditStats.blocks}</div>
            </div>
            </div>
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-none">
            {alerts.length === 0 ? (
              <div className="text-center p-8 text-zinc-500 text-xs font-mono">Aucune alerte de sécurité.</div>
            ) : (
              alerts.map(a => (
                <div key={a.id} className="p-4 bg-black border border-zinc-900 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-start">
                  <div>
                    <span className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase mr-2 ${a.severity === 'high' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                      {a.severity}
                    </span>
                    <span className="text-xs font-bold text-white uppercase tracking-wide">{a.type}</span>
                    <div className="text-[11px] text-zinc-400 mt-2">{a.details}</div>
                    <div className="text-[10px] text-zinc-600 mt-2 font-mono">ID Utilisateur: {a.userId || "Système"} • {new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "suspensions" && (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-none">
            {suspensions.length === 0 ? (
              <div className="text-center p-8 text-zinc-500 text-xs font-mono">Aucun compte bloqué.</div>
            ) : (
              suspensions.map(s => (
                <div key={s.id} className="p-4 bg-black border border-red-900/50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-red-500 uppercase">{s.type.replace('_', ' ')}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{new Date(s.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-white">Utilisateur: {s.userId}</div>
                  <div className="text-[11px] text-zinc-400 mt-1">Raison: {s.reason}</div>
                  <div className="text-[10px] text-zinc-600 mt-2 font-mono">Créé par: {s.createdBy}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-none">
            {activities.length === 0 ? (
              <div className="text-center p-8 text-zinc-500 text-xs font-mono">Aucun journal.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                    <th className="pb-3 pr-4 font-normal">Date</th>
                    <th className="pb-3 pr-4 font-normal">Action</th>
                    <th className="pb-3 pr-4 font-normal">Utilisateur</th>
                    <th className="pb-3 pr-4 font-normal">Appareil/IP</th>
                    <th className="pb-3 font-normal">Résultat</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-mono text-zinc-300">
                  {activities.slice(0, 100).map(act => (
                    <tr key={act.id} className="border-b border-zinc-900/50 hover:bg-zinc-900/20 transition-colors">
                      <td className="py-3 pr-4 whitespace-nowrap text-zinc-500">{new Date(act.timestamp).toLocaleString()}</td>
                      <td className="py-3 pr-4">
                        <div className="text-white font-bold">{act.type}</div>
                        <div className="text-zinc-500 text-[9px] truncate max-w-[200px]">{act.details}</div>
                      </td>
                      <td className="py-3 pr-4 text-zinc-400">{act.userId?.substring(0, 8)}...</td>
                      <td className="py-3 pr-4 text-zinc-500">
                        {act.device} / {act.browser} <br/> <span className="text-[9px]">{act.ip || "IP inconnue"}</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase ${act.result === 'success' || !act.result ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                          {act.result || "succès"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
