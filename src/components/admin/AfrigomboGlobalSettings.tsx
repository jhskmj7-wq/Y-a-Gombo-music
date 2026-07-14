import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { Settings, Save, AlertTriangle, MessageSquare, Globe, Navigation } from "lucide-react";

export default function AfrigomboGlobalSettings({ audioSynth }: { audioSynth?: any }) {
  const [config, setConfig] = useState({
    appName: "AFRIGOMBO ELITE",
    version: "1.0.0",
    maintenanceMode: false,
    welcomeMessage: "Bienvenue sur l'Empire d'Afrigombo, le réseau exclusif des artistes.",
    defis: "Défi 1: 100 Gombos, Défi 2: 50 Contrats",
    badges: "💎 Premium, 🛡️ Vérifié, 🥇 Top 10",
    langues: "Français, Anglais",
    villes: "Abidjan, Bouaké, Yamoussoukro, San-Pédro",
    categories: "Musique, Art, Mode, Cinéma"
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system_settings", "global"), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as any);
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "system_settings", "global"), config, { merge: true });
      setSaved(true);
      if (audioSynth) {
        audioSynth.playValidationSuccess();
      }
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-[#050505] border border-zinc-900 rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-4 mb-4">
        <Settings className="w-5 h-5 text-[#D4AF37]" />
        <h4 className="text-sm font-black text-white font-mono uppercase tracking-wider">
          Configuration Impériale Globale
        </h4>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Nom de l'Application</label>
            <input 
              type="text" 
              value={config.appName} 
              onChange={e => handleChange("appName", e.target.value)} 
              className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] text-white p-2.5 rounded-xl text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Version</label>
            <input 
              type="text" 
              value={config.version} 
              onChange={e => handleChange("version", e.target.value)} 
              className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] text-white p-2.5 rounded-xl text-xs font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Message d'accueil</label>
          <textarea 
            value={config.welcomeMessage} 
            onChange={e => handleChange("welcomeMessage", e.target.value)} 
            className="w-full h-20 bg-black border border-zinc-800 focus:border-[#D4AF37] text-white p-2.5 rounded-xl text-xs font-mono resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Villes Disponibles</label>
            <input 
              type="text" 
              value={config.villes} 
              onChange={e => handleChange("villes", e.target.value)} 
              className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] text-white p-2.5 rounded-xl text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Catégories</label>
            <input 
              type="text" 
              value={config.categories} 
              onChange={e => handleChange("categories", e.target.value)} 
              className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] text-white p-2.5 rounded-xl text-xs font-mono"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Badges / Titres</label>
            <input 
              type="text" 
              value={config.badges} 
              onChange={e => handleChange("badges", e.target.value)} 
              className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] text-white p-2.5 rounded-xl text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Défis en cours</label>
            <input 
              type="text" 
              value={config.defis} 
              onChange={e => handleChange("defis", e.target.value)} 
              className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] text-white p-2.5 rounded-xl text-xs font-mono"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Langues Prises en Charge</label>
            <input 
              type="text" 
              value={config.langues} 
              onChange={e => handleChange("langues", e.target.value)} 
              className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] text-white p-2.5 rounded-xl text-xs font-mono"
            />
          </div>
          <div className="flex items-center gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-900 mt-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={config.maintenanceMode} onChange={(e) => handleChange("maintenanceMode", e.target.checked)} />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
            <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${config.maintenanceMode ? "text-red-500 animate-pulse" : "text-zinc-600"}`} />
              MODE MAINTENANCE
            </span>
          </div>
        </div>

        <div className="flex justify-end items-center gap-4 pt-4 border-t border-zinc-900">
          {saved && <span className="text-emerald-500 text-[10px] uppercase font-mono">Enregistré !</span>}
          <button 
            type="submit" 
            disabled={saving}
            className="px-6 py-3 bg-[#D4AF37] text-black text-xs font-mono font-black uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] cursor-pointer"
          >
            {saving ? "SAUVEGARDE..." : "SAUVEGARDER LA CONFIGURATION"}
          </button>
        </div>
      </form>
    </div>
  );
}
