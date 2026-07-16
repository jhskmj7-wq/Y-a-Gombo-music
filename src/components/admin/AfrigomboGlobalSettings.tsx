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

        {/* SECTION GRAPHISME SOUVERAIN (FAVICON, LOGO, PWA, SPLASH SCREEN) */}
        <div className="border-t border-zinc-900 pt-6 mt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🎨</span>
            <h5 className="text-[11px] font-mono uppercase font-black text-[#D4AF37] tracking-wider">
              Identité Visuelle & Assets Graphiques Souverains
            </h5>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
            Personnalisez les logos officiels et l'identité visuelle de l'application sans dépendance externe à Firebase Storage. Les images sont enregistrées localement et appliquées en temps réel.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. LOGO PRINCIPAL */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9.5px] font-mono uppercase font-black text-white">1. Logo Principal (Branding)</span>
                <span className="text-[8px] font-mono text-zinc-500">FORMAT : PNG/SVG</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-black border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                  <img 
                    src={localStorage.getItem("custom_app_logo") || "/public/logo_afrigombo.png"} 
                    alt="Logo" 
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    id="logo-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          localStorage.setItem("custom_app_logo", reader.result as string);
                          if (audioSynth) audioSynth.playValidationSuccess();
                          window.dispatchEvent(new Event("custom-logo-updated"));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <label 
                      htmlFor="logo-upload"
                      className="px-2.5 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[9px] font-mono font-bold rounded uppercase cursor-pointer hover:bg-[#D4AF37]/20"
                    >
                      Téléverser
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem("custom_app_logo");
                        window.dispatchEvent(new Event("custom-logo-updated"));
                        if (audioSynth) audioSynth.playTamTam(true);
                      }}
                      className="px-2.5 py-1.5 bg-red-950/10 border border-red-900/30 text-red-400 text-[9px] font-mono font-bold rounded uppercase hover:bg-red-950/20"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. FAVICON */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9.5px] font-mono uppercase font-black text-white">2. Favicon Navigateur</span>
                <span className="text-[8px] font-mono text-zinc-500">FORMAT : ICO/PNG</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-black border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                  <img 
                    src={localStorage.getItem("custom_app_favicon") || "/favicon.ico"} 
                    alt="Favicon" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    id="favicon-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const base64 = reader.result as string;
                          localStorage.setItem("custom_app_favicon", base64);
                          
                          // Dynamically update favicon in the DOM
                          const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
                          if (link) {
                            link.href = base64;
                          }
                          if (audioSynth) audioSynth.playValidationSuccess();
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <label 
                      htmlFor="favicon-upload"
                      className="px-2.5 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[9px] font-mono font-bold rounded uppercase cursor-pointer hover:bg-[#D4AF37]/20"
                    >
                      Téléverser
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem("custom_app_favicon");
                        const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
                        if (link) {
                          link.href = "/favicon.ico";
                        }
                        if (audioSynth) audioSynth.playTamTam(true);
                      }}
                      className="px-2.5 py-1.5 bg-red-950/10 border border-red-900/30 text-red-400 text-[9px] font-mono font-bold rounded uppercase hover:bg-red-950/20"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ICÔNE PWA */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9.5px] font-mono uppercase font-black text-white">3. Icône PWA (Mobile)</span>
                <span className="text-[8px] font-mono text-zinc-500">FORMAT : PNG 512x512</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-black border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                  <img 
                    src={localStorage.getItem("custom_app_pwa_icon") || "/public/logo_afrigombo.png"} 
                    alt="PWA Icon" 
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    id="pwa-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          localStorage.setItem("custom_app_pwa_icon", reader.result as string);
                          if (audioSynth) audioSynth.playValidationSuccess();
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <label 
                      htmlFor="pwa-upload"
                      className="px-2.5 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[9px] font-mono font-bold rounded uppercase cursor-pointer hover:bg-[#D4AF37]/20"
                    >
                      Téléverser
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem("custom_app_pwa_icon");
                        if (audioSynth) audioSynth.playTamTam(true);
                      }}
                      className="px-2.5 py-1.5 bg-red-950/10 border border-red-900/30 text-red-400 text-[9px] font-mono font-bold rounded uppercase hover:bg-red-950/20"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. ÉCRAN DE DÉMARRAGE (SPLASH SCREEN) */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9.5px] font-mono uppercase font-black text-white">4. Écran de Démarrage (Splash)</span>
                <span className="text-[8px] font-mono text-zinc-500">FORMAT : JPG/PNG</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-black border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                  <img 
                    src={localStorage.getItem("custom_app_splash_screen") || "/public/media/splash_background.jpg" || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=200"} 
                    alt="Splash Screen" 
                    className="w-14 h-14 object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=200";
                    }}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    id="splash-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          localStorage.setItem("custom_app_splash_screen", reader.result as string);
                          if (audioSynth) audioSynth.playValidationSuccess();
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <label 
                      htmlFor="splash-upload"
                      className="px-2.5 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[9px] font-mono font-bold rounded uppercase cursor-pointer hover:bg-[#D4AF37]/20"
                    >
                      Téléverser
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem("custom_app_splash_screen");
                        if (audioSynth) audioSynth.playTamTam(true);
                      }}
                      className="px-2.5 py-1.5 bg-red-950/10 border border-red-900/30 text-red-400 text-[9px] font-mono font-bold rounded uppercase hover:bg-red-950/20"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
