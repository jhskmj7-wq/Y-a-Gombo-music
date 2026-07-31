import React, { useState, useEffect } from "react";
import { runFullBetaAudit, HealthCheckResult } from "../../lib/HealthCheckEngine";
import { CheckCircle2, AlertTriangle, XCircle, Bug, RefreshCw, ShieldCheck, Terminal } from "lucide-react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function BetaCheckPanel() {
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"audit" | "bug_reports">("audit");
  const [bugReports, setBugReports] = useState<any[]>([]);
  const [loadingBugs, setLoadingBugs] = useState(false);

  const performCheck = async () => {
    setLoading(true);
    const checkResults = await runFullBetaAudit();
    setResults(checkResults);
    setLoading(false);
  };

  const loadBugReports = async () => {
    setLoadingBugs(true);
    try {
      const q = query(collection(db, "bugReports"), orderBy("date", "desc"), limit(20));
      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBugReports(list);
    } catch (e) {
      console.warn("Could not load bug reports:", e);
    } finally {
      setLoadingBugs(false);
    }
  };

  useEffect(() => {
    performCheck();
    loadBugReports();
  }, []);

  const okCount = results.filter((r) => r.status === "OK").length;
  const warnCount = results.filter((r) => r.status === "WARNING").length;
  const errCount = results.filter((r) => r.status === "ERROR").length;

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fadeIn font-sans max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-wider">
              AFRIGOMBO BÊTA — AUDIT DIAGNOSTIC
            </h2>
            <p className="text-xs text-zinc-400">
              Surveillance proactive des 12 modules fondateurs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              performCheck();
              loadBugReports();
            }}
            disabled={loading}
            className="flex items-center gap-2 bg-[#D4AF37] text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Audit en cours..." : "Lancer l'Audit"}
          </button>
        </div>
      </div>

      {/* Audit Stats Banner */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900/80 border border-emerald-500/30 p-4 rounded-xl text-center space-y-1">
          <p className="text-xs text-zinc-400 font-bold uppercase">🟢 Fonctionnels</p>
          <p className="text-2xl font-black text-emerald-400">{okCount}</p>
        </div>
        <div className="bg-zinc-900/80 border border-amber-500/30 p-4 rounded-xl text-center space-y-1">
          <p className="text-xs text-zinc-400 font-bold uppercase">🟡 À Vérifier</p>
          <p className="text-2xl font-black text-amber-400">{warnCount}</p>
        </div>
        <div className="bg-zinc-900/80 border border-rose-500/30 p-4 rounded-xl text-center space-y-1">
          <p className="text-xs text-zinc-400 font-bold uppercase">🔴 Anomalies</p>
          <p className="text-2xl font-black text-rose-400">{errCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 gap-4">
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === "audit"
              ? "border-[#D4AF37] text-[#D4AF37]"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          Modules Audités ({results.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("bug_reports");
            loadBugReports();
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "bug_reports"
              ? "border-[#D4AF37] text-[#D4AF37]"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Bug className="w-3.5 h-3.5" />
          Journal des Erreurs (bugReports) ({bugReports.length})
        </button>
      </div>

      {/* Tab: Audit List */}
      {activeTab === "audit" && (
        <div className="grid gap-3">
          {results.map((res, index) => (
            <div
              key={`${res.module}-${res.service}-${index}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-900/90 rounded-2xl border border-zinc-800 gap-3 hover:border-zinc-700 transition"
            >
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-bold">
                  {res.module}
                </span>
                <h3 className="font-bold text-white text-sm">{res.service}</h3>
                <p className="text-xs text-zinc-400">{res.message}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {res.status === "OK" && (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-4 h-4" /> 🟢 Fonctionnel
                  </span>
                )}
                {res.status === "WARNING" && (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                    <AlertTriangle className="w-4 h-4" /> 🟡 À Vérifier
                  </span>
                )}
                {res.status === "ERROR" && (
                  <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
                    <XCircle className="w-4 h-4" /> 🔴 Erreur
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Bug Reports Journal */}
      {activeTab === "bug_reports" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs text-zinc-400">
            <span>
              Journalisation automatique des exceptions et rejets non gérés (`bugReports/`)
            </span>
            <button
              onClick={loadBugReports}
              className="text-[#D4AF37] hover:underline font-bold"
            >
              Actualiser les logs
            </button>
          </div>

          {loadingBugs ? (
            <div className="p-8 text-center text-zinc-400 font-mono text-xs">
              Chargement du journal d'erreurs Firestore...
            </div>
          ) : bugReports.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/60 rounded-2xl border border-zinc-800 text-zinc-400 text-xs">
              ✨ Aucune erreur enregistrée dans `bugReports`. Le système est stable.
            </div>
          ) : (
            <div className="space-y-3">
              {bugReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-2 text-xs font-mono"
                >
                  <div className="flex items-center justify-between text-[#D4AF37] border-b border-zinc-800/80 pb-2">
                    <span className="font-bold flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      {report.module || "Anomalie"} — {report.ecran || "/"}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {report.date ? new Date(report.date).toLocaleString() : "Récent"}
                    </span>
                  </div>

                  <p className="text-white font-sans text-xs font-semibold">{report.message}</p>

                  {report.stack && (
                    <pre className="p-2 bg-black/60 rounded-lg text-[10px] text-zinc-400 overflow-x-auto max-h-24">
                      {report.stack}
                    </pre>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-500 font-sans pt-1">
                    <span>Version: {report.version || "1.0.0"}</span>
                    <span>
                      Appareil: {report.appareil?.screenWidth}x{report.appareil?.screenHeight} (
                      {report.appareil?.platform || "Web"})
                    </span>
                    <span>
                      Utilisateur:{" "}
                      {typeof report.utilisateur === "object"
                        ? report.utilisateur.displayName || report.utilisateur.email
                        : report.utilisateur}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
