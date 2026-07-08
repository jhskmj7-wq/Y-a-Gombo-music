import React, { useState } from "react";
import { Settings, Save, Sliders, RefreshCw, CheckCircle } from "lucide-react";

interface AdminSettingsProps {
  systemCommissionRate: number;
  onUpdateCommissionRate?: (rate: number) => void;
  audioSynth?: any;
}

export default function AdminSettings({
  systemCommissionRate,
  onUpdateCommissionRate,
  audioSynth
}: AdminSettingsProps) {
  const [commissionRate, setCommissionRate] = useState(systemCommissionRate);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      if (onUpdateCommissionRate) {
        onUpdateCommissionRate(commissionRate);
      }
      setIsSaving(false);
      setSuccess(true);
      try { audioSynth?.playValidationSuccess(); } catch (err) {}
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6 text-left pb-24 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37] flex items-center gap-1.5">
          <Settings className="w-4 h-4" />
          Paramètres Généraux du Système
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Gérez les frais d'infrastructure, taux d'imposition administratifs et options globales d'AFRIGOMBO.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Commission setting Card */}
        <div className="col-span-1 md:col-span-2 p-6 bg-[#070707] border border-zinc-900 rounded-2xl space-y-6 relative overflow-hidden">
          <h4 className="text-xs font-mono uppercase font-black tracking-wider text-[#D4AF37] flex items-center gap-1.5">
            <Sliders className="w-4 h-4" />
            Règles Financières & Commissions
          </h4>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold mb-2">
                Taux de commission de plateforme (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="bg-black border border-[#D4AF37]/20 rounded-xl p-3 text-sm font-mono text-white focus:outline-none focus:border-[#D4AF37] w-28 text-center transition-all"
                />
                <span className="text-sm text-zinc-400">% prélevé sur les cachets de Gombos</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-900">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-black font-black text-xs uppercase flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Sauvegarde..." : "Enregistrer"}
              </button>
            </div>
          </form>

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle className="w-4 h-4" />
              <span>Paramètres financiers mis à jour sur la base de données centrale.</span>
            </div>
          )}
        </div>

        {/* Quick parameters info box */}
        <div className="p-6 bg-[#070707] border border-zinc-900 rounded-2xl flex flex-col justify-between">
          <div className="space-y-3">
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Rappel des Directives</h5>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Le taux de commission d'AFRIGOMBO garantit la stabilité des serveurs, la production de jetons Gombo ID certifiés par l'Administration, et le fonctionnement offline sécurisé.
            </p>
          </div>

          <div className="border-t border-zinc-900 pt-4 mt-6">
            <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-2.5 py-1 inline-block">
              Statut: ACTIF
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
