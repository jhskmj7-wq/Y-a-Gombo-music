import React, { useState, useEffect } from "react";
import { ShieldAlert, RefreshCw, AlertTriangle, CheckCircle, Database, Users } from "lucide-react";
import { auth } from "../../firebase";

export default function AdminMaintenancePanel() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationPhrase, setConfirmationPhrase] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/reset-environment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, dryRun: true })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setReport(data.report);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteReset = async () => {
    if (confirmationPhrase !== "RESET AFRIGOMBO TEST") {
      alert("Phrase de confirmation incorrecte.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/reset-environment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, confirmationPhrase, dryRun: false })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setReport(data.report);
      setShowConfirmModal(false);
      setConfirmationPhrase("");
      alert("Reset terminé avec succès !");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  return (
    <div className="p-6 space-y-6 text-left">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          MAINTENANCE CRITIQUE
        </h2>
        <button 
          onClick={fetchAudit}
          disabled={loading}
          className="p-2 hover:bg-zinc-800 rounded-full transition disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-[#D4AF37] ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
        <div className="text-xs text-red-200">
          <p className="font-bold uppercase mb-1">Attention : Zone de Haute Dangerosité</p>
          <p>Cette console permet de réinitialiser l'environnement de test. Les données supprimées ne pourront pas être récupérées. Les Fondateurs sont protégés automatiquement.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-zinc-900 border border-red-500/50 rounded-xl text-red-400 text-xs font-mono">
          ERREUR : {error}
        </div>
      )}

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-zinc-400 uppercase">Utilisateurs & Roles</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Comptes à réinitialiser</span>
                <span className="font-black text-white">{report.usersToReset}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Fondateurs protégés</span>
                <span className="font-black text-emerald-400">{report.foundersProtected}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-zinc-400 uppercase">Données Firestore</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Collections ciblées</span>
                <span className="font-black text-white">{Object.keys(report.collectionsToClear).length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Documents estimés</span>
                <span className="font-black text-amber-400">~{report.totalDocumentsEstimated}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 flex flex-col items-center gap-4">
        <p className="text-xs text-zinc-500 text-center">
          Pour effectuer un reset complet, vous devez confirmer l'action. 
          Le solde de tous les utilisateurs non-fondateurs sera remis à 0.
        </p>
        <button 
          onClick={() => setShowConfirmModal(true)}
          disabled={loading || !report}
          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
        >
          RESET COMPLET DES DONNÉES DE TEST
        </button>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-6 animate-scaleIn">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-black text-white uppercase">Confirmation Requise</h3>
              <p className="text-xs text-zinc-500">
                Veuillez saisir la phrase de confirmation pour valider l'opération :
                <br />
                <span className="font-mono text-[#D4AF37] font-bold mt-2 block select-all">RESET AFRIGOMBO TEST</span>
              </p>
            </div>

            <input 
              type="text" 
              value={confirmationPhrase}
              onChange={(e) => setConfirmationPhrase(e.target.value)}
              placeholder="Saisissez la phrase ici..."
              className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl p-4 text-white text-center font-mono text-xs focus:outline-none"
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-zinc-800 text-zinc-400 font-bold text-xs rounded-xl hover:bg-zinc-700 transition"
              >
                ANNULER
              </button>
              <button 
                onClick={handleExecuteReset}
                disabled={confirmationPhrase !== "RESET AFRIGOMBO TEST" || loading}
                className="flex-1 py-3 bg-red-600 text-white font-black text-xs rounded-xl hover:bg-red-700 transition disabled:opacity-30"
              >
                CONFIRMER LE RESET
              </button>
            </div>
          </div>
        </div>
      )}

      {report && report.errors && report.errors.length > 0 && (
        <div className="p-4 bg-zinc-900 border border-amber-500/30 rounded-xl space-y-2">
          <p className="text-[10px] font-black text-amber-500 uppercase">Avertissements ({report.errors.length})</p>
          <ul className="list-disc pl-4 space-y-1">
            {report.errors.map((err: string, i: number) => (
              <li key={i} className="text-[10px] text-zinc-500 font-mono">{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
