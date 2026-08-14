import React, { useState, useEffect } from "react";
import { 
  Award, Sparkles, Save, RefreshCw, ShieldCheck, 
  Gift, Sliders, Check, Layers, AlertCircle
} from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface AdminRewardsManagementProps {
  currentUser?: any;
  userEmail?: string;
  audioSynth?: any;
}

export interface GlobalRewardConfig {
  rewardMultiplier: number;
  maxDailyRewardsPerUser: number;
  premiumBonusPercent: number;
  autoExpireUnusedDays: number;
  surpriseBoxPools: {
    name: string;
    probability: number;
    value: string;
  }[];
  updatedAt?: string;
}

export default function AdminRewardsManagement({
  currentUser,
  userEmail = "admin@afrigombo.ci",
  audioSynth
}: AdminRewardsManagementProps) {
  const [config, setConfig] = useState<GlobalRewardConfig>({
    rewardMultiplier: 1.0,
    maxDailyRewardsPerUser: 5,
    premiumBonusPercent: 20,
    autoExpireUnusedDays: 30,
    surpriseBoxPools: [
      { name: "👑 Premium 1 Jours", probability: 40, value: "1_DAY_PREMIUM" },
      { name: "⚡ Boost Visibilité 24h", probability: 35, value: "VISIBILITY_BOOST_24H" },
      { name: "🎁 Pass Spécial Élite", probability: 25, value: "ELITE_SPECIAL_PASS" }
    ]
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    const configRef = doc(db, "settings", "rewardConfigs");
    const unsub = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as GlobalRewardConfig);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const configRef = doc(db, "settings", "rewardConfigs");
      await setDoc(configRef, {
        ...config,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.uid || userEmail
      }, { merge: true });

      setSaveSuccess(true);
      try { audioSynth?.playValidationSuccess?.(); } catch (err) {}
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Erreur lors de la sauvegarde: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 text-left animate-fadeIn">
      {/* HEADER */}
      <div className="p-5 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-2xl text-amber-400">
            <Award className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-white font-mono tracking-tight flex items-center gap-2">
              💎 GESTION GLOBALE DES RÉCOMPENSES — TRÔNE
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Règles d'attribution globale, coefficients multiplicateurs et probabilités des Boîtes Surprise
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="px-5 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-mono font-black text-xs uppercase rounded-2xl transition shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Enregistrement..." : "Enregistrer la Configuration"}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold text-center animate-fadeIn">
          ✨ Configuration globale des récompenses mise à jour dans Firestore !
        </div>
      )}

      {/* PARAMETERS FORM */}
      <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL: COEFFICIENTS & RATIOS */}
        <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-5">
          <h3 className="text-xs font-mono font-black uppercase text-amber-400 tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Sliders className="w-4 h-4" />
            Paramètres & Coefficients Système
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                Multiplicateur Général des Récompenses
              </label>
              <input
                type="number"
                step="0.1"
                value={config.rewardMultiplier}
                onChange={(e) => setConfig({ ...config, rewardMultiplier: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-400"
              />
              <p className="text-[9px] text-zinc-500 font-mono mt-1">S'applique à la valeur des privilèges accordés (Ex: 1.0 = normal, 1.5 = +50%)</p>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                Plafond Max Récompenses Quotidiennes par Membre
              </label>
              <input
                type="number"
                value={config.maxDailyRewardsPerUser}
                onChange={(e) => setConfig({ ...config, maxDailyRewardsPerUser: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-white font-bold focus:outline-none focus:border-amber-400"
              />
              <p className="text-[9px] text-zinc-500 font-mono mt-1">Limite anti-abus pour les tirages et gains de cadeaux</p>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                Bonus Avantage Membres Premium (%)
              </label>
              <input
                type="number"
                value={config.premiumBonusPercent}
                onChange={(e) => setConfig({ ...config, premiumBonusPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-amber-400"
              />
              <p className="text-[9px] text-zinc-500 font-mono mt-1">Majorations des probabilités de gain pour les comptes VIP / Premium</p>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                Délai d'Expiration des Lots Non Activés (Jours)
              </label>
              <input
                type="number"
                value={config.autoExpireUnusedDays}
                onChange={(e) => setConfig({ ...config, autoExpireUnusedDays: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 font-bold focus:outline-none focus:border-amber-400"
              />
              <p className="text-[9px] text-zinc-500 font-mono mt-1">Durée au bout de laquelle un lot non activé passe en statut "EXPIRED"</p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: SURPRISE BOX POOLS */}
        <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-5">
          <h3 className="text-xs font-mono font-black uppercase text-amber-400 tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Gift className="w-4 h-4" />
            Pools de Contenu des Boîtes Surprise
          </h3>

          <div className="space-y-3">
            {config.surpriseBoxPools.map((item, idx) => (
              <div key={idx} className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between gap-3 text-xs font-mono">
                <div className="space-y-1">
                  <p className="font-bold text-white">{item.name}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">{item.value}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-black">{item.probability}% Chance</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs font-mono text-amber-300 space-y-1">
            <p className="font-bold uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Souveraineté des Récompenses
            </p>
            <p className="text-[10px] text-amber-200/80 leading-relaxed">
              Toutes les modifications prennent effet instantanément pour l'ensemble des utilisateurs connectés à la plateforme.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
