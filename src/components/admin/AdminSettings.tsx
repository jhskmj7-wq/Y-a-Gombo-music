import React, { useState } from "react";
import { Settings, Save, Sliders, RefreshCw, CheckCircle } from "lucide-react";
import { globalAudioManager } from "../../lib/audioManager";

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

  // Global Audio states
  const [musicVolume, setMusicVolume] = useState(() => globalAudioManager.getVolume());
  const [musicMuted, setMusicMuted] = useState(() => globalAudioManager.getIsMuted());
  const [activeMusicPlay, setActiveMusicPlay] = useState<"none" | "intro" | "hymne">("none");

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

        {/* Section Musique Officielle */}
        <div className="col-span-1 md:col-span-2 p-6 bg-[#070707] border border-zinc-900 rounded-2xl space-y-6 relative overflow-hidden">
          <h4 className="text-xs font-mono uppercase font-black tracking-wider text-[#D4AF37] flex items-center gap-1.5">
            🎵 Gestion de la Musique Officielle
          </h4>

          <p className="text-xs text-zinc-400">
            Contrôlez les pistes officielles et hymnes d'AFRIGOMBO intégrés à l'application.
          </p>

          <div className="space-y-4">
            {/* BUTTONS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  globalAudioManager.playIntro(true);
                  setActiveMusicPlay("intro");
                }}
                className={`py-3 px-4 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  activeMusicPlay === "intro"
                    ? "bg-[#D4AF37]/20 border-[#D4AF37] text-white"
                    : "bg-black border-zinc-900 text-zinc-300 hover:text-white"
                }`}
              >
                ▶ Réécouter l'introduction
              </button>
              <button
                type="button"
                onClick={() => {
                  globalAudioManager.playHymne();
                  setActiveMusicPlay("hymne");
                }}
                className={`py-3 px-4 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  activeMusicPlay === "hymne"
                    ? "bg-[#D4AF37]/20 border-[#D4AF37] text-white"
                    : "bg-black border-zinc-900 text-zinc-300 hover:text-white"
                }`}
              >
                ▶ Hymne officiel
              </button>
            </div>

            {/* STOP BUTTON */}
            {activeMusicPlay !== "none" && (
              <button
                type="button"
                onClick={() => {
                  globalAudioManager.stopAll();
                  setActiveMusicPlay("none");
                }}
                className="w-full py-2 bg-red-950/20 hover:bg-red-950/35 border border-red-900/30 text-red-400 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
              >
                ■ Arrêter la musique
              </button>
            )}

            {/* MUTED / ENABLE TOGGLE */}
            <label className="flex items-center justify-between cursor-pointer group pt-2 border-t border-zinc-900">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">Activer / Désactiver la Musique</span>
                <p className="text-[10px] text-zinc-500 leading-none">Mettre en sourdine l'émetteur audio global</p>
              </div>
              <input
                type="checkbox"
                checked={!musicMuted}
                onChange={(e) => {
                  const isEnabled = e.target.checked;
                  globalAudioManager.setIsMuted(!isEnabled);
                  setMusicMuted(!isEnabled);
                  if (!isEnabled) {
                    setActiveMusicPlay("none");
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-zinc-900 peer-checked:bg-[#D4AF37] rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-black after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5"></div>
            </label>

            {/* VOLUME SLIDER */}
            <div className="space-y-2 pt-2 border-t border-zinc-900">
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 font-bold">
                <span>Volume global</span>
                <span className="text-[#D4AF37] font-bold">{Math.round(musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={musicVolume * 100}
                onChange={(e) => {
                  const vol = parseFloat(e.target.value) / 100;
                  globalAudioManager.setVolume(vol);
                  setMusicVolume(vol);
                }}
                className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
              />
            </div>
          </div>
        </div>

        {/* Quick parameters info box 2 */}
        <div className="p-6 bg-[#070707] border border-zinc-900 rounded-2xl flex flex-col justify-between">
          <div className="space-y-3">
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Thèmes Officiels</h5>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              L'introduction se lance automatiquement lors de la toute première visite d'un nouvel utilisateur sur l'écosystème. L'hymne peut être déclenché manuellement depuis le Terrain ou depuis l'Espace Administration.
            </p>
          </div>

          <div className="border-t border-zinc-900 pt-4 mt-6">
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded px-2.5 py-1 inline-block">
              Audio: STABLE
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
