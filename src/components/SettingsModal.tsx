import React, { useState } from "react";
import { 
  X, Sun, Moon, Wallet, Bell, MapPin, 
  Check, Volume2, Shield, Info, HelpCircle,
  User, Lock, Trash2, Laptop, Smartphone, Eye,
  Globe, FileText, Star, LogOut
} from "lucide-react";
import { useLanguage, Language } from "../LanguageContext";
import { useAuth } from "../AuthContext";
import { gomboDB } from "../firebase";
import { audioSynth } from "../lib/audio";
import { playSound } from "../services/audioService";
import { triggerSettingsSaved, usePerformance } from "../services/performanceService";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  themeMode: "dark-gold" | "light-gold" | "night-navy";
  setThemeMode: (theme: "dark-gold" | "light-gold" | "night-navy") => void;
  onLogout?: () => void;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  darkMode, 
  setDarkMode, 
  themeMode, 
  setThemeMode, 
  onLogout 
}: SettingsModalProps) {
  if (!isOpen) return null;

  // Navigation / Tabs State
  const [activeTab, setActiveTab] = useState<"compte" | "application" | "confidentialite" | "univers" | "support" | "legal" | "langue">("compte");
  const { t, language: currentLang, setLanguage } = useLanguage();
  const { profile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Localized preferences stored in LocalStorage
  const [region, setRegion] = useState(() => localStorage.getItem("gombo_pref_region") || "Abidjan (Cocody)");
  const [paymentMethod, setPaymentMethod] = useState(() => localStorage.getItem("gombo_pref_payment") || "Wave");
  const [currency, setCurrency] = useState(() => localStorage.getItem("gombo_pref_currency") || "FCFA");
  const [audioVolume, setAudioVolume] = useState(() => parseInt(localStorage.getItem("gombo_pref_volume") || "70"));
  const [enableSoundAlerts, setEnableSoundAlerts] = useState(() => localStorage.getItem("gombo_pref_alerts") !== "false");
  const [enableUiSounds, setEnableUiSounds] = useState(() => localStorage.getItem("gombo_pref_ui_sounds") !== "false");
  const [enableAmbientMusic, setEnableAmbientMusic] = useState(() => localStorage.getItem("gombo_pref_ambient_music") !== "false");
  const [enableVibration, setEnableVibration] = useState(() => localStorage.getItem("gombo_pref_vibration") !== "false");
  const [soundMode, setSoundMode] = useState(() => localStorage.getItem("gombo_pref_sound_mode") || "Standard");
  const [ambianceAudio, setAmbianceAudio] = useState(() => localStorage.getItem("gombo_pref_ambiance") || "Silencieux");

  // Performance hooks & states
  const [enableAnimations, setEnableAnimations] = useState(() => localStorage.getItem("gombo_pref_animations") !== "false");
  const [enableDataSave, setEnableDataSave] = useState(() => localStorage.getItem("gombo_pref_data_save") === "true");
  const [enableBatterySave, setEnableBatterySave] = useState(() => localStorage.getItem("gombo_pref_battery_save") === "true");
  const { batteryLevel, isBatteryLow, isSlowConnection, connectionType } = usePerformance();

  // Privacy states
  const [publicProfile, setPublicProfile] = useState(() => localStorage.getItem("gombo_pref_public_profile") !== "false");
  const [showContactDetails, setShowContactDetails] = useState(() => localStorage.getItem("gombo_pref_show_contact") !== "false");

  // Account states
  const [receiveNewsletter, setReceiveNewsletter] = useState(() => localStorage.getItem("gombo_pref_newsletter") === "true");

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeLegalPage, setActiveLegalPage] = useState<"none" | "privacy" | "terms">("none");

  // Security and Password change states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwChangeSuccess, setPwChangeSuccess] = useState(false);
  const [pwChangeError, setPwChangeError] = useState("");

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPwChangeError("");
    setPwChangeSuccess(false);

    if (!newPassword || !confirmPassword) {
      setPwChangeError("Veuillez remplir tous les champs de mot de passe.");
      return;
    }

    if (newPassword.length < 6) {
      setPwChangeError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwChangeError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setPwChangeSuccess(true);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => {
      setPwChangeSuccess(false);
    }, 4000);
  };

  if (!isOpen) return null;

  const handleSave = async () => {
    // Persist settings to LocalStorage
    localStorage.setItem("gombo_pref_region", region);
    localStorage.setItem("gombo_pref_payment", paymentMethod);
    localStorage.setItem("gombo_pref_currency", currency);
    localStorage.setItem("gombo_pref_volume", audioVolume.toString());
    localStorage.setItem("gombo_pref_alerts", enableSoundAlerts.toString());
    localStorage.setItem("gombo_pref_ui_sounds", enableUiSounds.toString());
    localStorage.setItem("gombo_pref_ambient_music", enableAmbientMusic.toString());
    localStorage.setItem("gombo_pref_vibration", enableVibration.toString());
    localStorage.setItem("gombo_pref_sound_mode", soundMode);
    localStorage.setItem("gombo_pref_ambiance", ambianceAudio);

    // Performance settings
    localStorage.setItem("gombo_pref_animations", enableAnimations.toString());
    localStorage.setItem("gombo_pref_data_save", enableDataSave.toString());
    localStorage.setItem("gombo_pref_battery_save", enableBatterySave.toString());
    triggerSettingsSaved();
    
    // Privacy
    localStorage.setItem("gombo_pref_public_profile", publicProfile.toString());
    localStorage.setItem("gombo_pref_show_contact", showContactDetails.toString());
    
    // Account
    localStorage.setItem("gombo_pref_newsletter", receiveNewsletter.toString());

    // Update ambient loop immediately
    if (enableAmbientMusic && ambianceAudio !== "Silencieux") {
      // Background music component will listen for this
      window.dispatchEvent(new CustomEvent('gombo_music_toggle', { detail: { play: true, style: ambianceAudio } }));
      audioSynth.startAmbientLoop(); 
    } else {
      window.dispatchEvent(new CustomEvent('gombo_music_toggle', { detail: { play: false } }));
      audioSynth.stopAmbientLoop();
    }

    setIsSaving(true);
    // Real persistence if profile exists
    if (profile?.uid) {
      try {
        await gomboDB.updateUserProfile(profile.uid, {
          commune: region,
          ville: region.split(" ")[0], // Simple extraction
          preferences: {
            themeMode: themeMode,
            audioVolume: audioVolume,
            publicProfile: publicProfile,
            showContactDetails: showContactDetails,
            vibration: enableVibration,
            soundMode: soundMode,
            ambianceAudio: ambianceAudio
          }
        });
      } catch (err) {
        console.warn("Could not persist settings to cloud, strictly local for now:", err);
      }
    }

    // Trigger success feedback
    setSaveSuccess(true);
    setIsSaving(false);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);

    // Play confirmation sound if enabled
    if (enableUiSounds) {
      try {
        playSound("success");
      } catch (e) {
        // Audio browser safety
      }
    }
  };

  const playDemoBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      gain.gain.setValueAtTime((audioVolume / 100) * 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  };

  const deleteAccountSimulate = () => {
    alert("Simulation de suppression de compte initiée. En mode bac à sable, les données locales associées seront effacées à la prochaine déconnexion.");
    setShowDeleteConfirm(false);
    if (onLogout) onLogout();
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div 
        id="settings-modal-card"
        className="bg-white dark:bg-[#111113] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all duration-300 scale-100 flex flex-col h-[85vh] max-h-[680px] relative"
      >
        {/* Absolute Overlay for Legal Documents */}
        {activeLegalPage !== "none" && (
          <div className="absolute inset-0 bg-white dark:bg-[#111113] z-50 p-6 flex flex-col h-full animate-fadeIn font-sans">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150 dark:border-gray-800 shrink-0">
              <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white flex items-center gap-2">
                <span>{activeLegalPage === "privacy" ? `📋 ${t('confidentialite')} — AFRIGOMBO` : `⚖️ ${t('cgu')} — Escrow`}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setActiveLegalPage("none")}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 rounded-xl text-xs font-black cursor-pointer transition-colors"
              >
                {t('annuler')}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-gray-600 dark:text-gray-300 leading-relaxed text-left pr-1 scrollbar-thin">
              {activeLegalPage === "privacy" ? (
                <>
                  <h4 className="font-extrabold text-gray-900 dark:text-white uppercase text-[11px] tracking-wider">1. Collecte des informations</h4>
                  <p>Nous collectons votre adresse e-mail unique de l'écosystème Afri, votre afriId unique généré automatiquement à la première connexion, vos numéros Mobile Money facultatifs pour les paiements de cachets, et les données de profil d'artiste que vous décidez de rendre publiques.</p>
                  
                  <h4 className="font-extrabold text-gray-900 dark:text-white uppercase text-[11px] tracking-wider">2. Utilisation des données</h4>
                  <p>Vos spécialités de scène, genres musicaux, ville et commune d'Abidjan sont partagés publiquement sur notre annuaire "Base des Talents" pour vous connecter aux opportunités réelles. Vos numéros de téléphone ne sont visibles que par les promoteurs avec qui vous concluez ou postulez à un Gombo officiel.</p>
                  
                  <h4 className="font-extrabold text-gray-900 dark:text-white uppercase text-[11px] tracking-wider">3. Firebase & Sécurité</h4>
                  <p>Toutes nos communications transitent par des canaux HTTPS cryptés vers la plateforme Google Firebase (Firestore Database et Auth) afin d'assurer l'intégrité de vos transactions et l'exclusion stricte de toute usurpation de profil ou d'identité.</p>
                  
                  <h4 className="font-extrabold text-gray-900 dark:text-white uppercase text-[11px] tracking-wider">4. Suppression immédiate</h4>
                  <p>Vous possédez un contrôle souverain sur vos informations. Vous pouvez désactiver votre profil ou initier une suppression immédiate à tout moment depuis l'onglet de gestion "Mon Compte".</p>
                </>
              ) : (
                <>
                  <h4 className="font-extrabold text-[#D4AF37] uppercase text-[11px] tracking-wider">1. Nature de l'écosystème AFRIGOMBO</h4>
                  <p>AFRIGOMBO est un espace d'ingénierie et de mise en relation artistique premium. Nous garantissons la validité de l'identité des membres via notre identifiant Afri ID unifié pour éliminer toute fraude ou profils simulés.</p>
                  
                  <h4 className="font-extrabold text-[#D4AF37] uppercase text-[11px] tracking-wider">2. Sécurisation Escrow par Mobile Money</h4>
                  <p>Pour chaque engagement (Gombo), l'acompte de cachet convenu (par ex. 5,000 FCFA pour un booster ou cachet de scène négocié) est placé en séquestre bloqué virtuel sur la plateforme. La somme est transférée au musicien dès la signature de la présence numérique.</p>
                  
                  <h4 className="font-extrabold text-[#D4AF37] uppercase text-[11px] tracking-wider">3. Engagements & Remplacements de Scène</h4>
                  <p>En cas de non-présentation ou de retard injustifié, le promoteur ou chef d'orchestre peut déclarer un litige qui libère la somme vers le séquestre ou l'alloue au "Renfort Express" recruté de manière urgente de rechange.</p>
                  
                  <h4 className="font-extrabold text-[#D4AF37] uppercase text-[11px] tracking-wider">4. Retraits de Solde</h4>
                  <p>Les transferts vers les comptes Wave, Orange Money et MTN Money sont exécutés de manière sécurisée sous 24h après validation des justificatifs par l'équipe d'administration centrale.</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-orange-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('settings_title')}</h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">{t('settings_subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Master Shell (Sidebar + Tab Content Display) */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Navigation Sidebar (Vertical on Desktop, Horizontal on Mobile) */}
          <div className="w-full md:w-56 bg-gray-50/50 dark:bg-gray-950/20 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 flex flex-row md:flex-col p-2.5 gap-1.5 overflow-x-auto md:overflow-x-visible shrink-0 scrollbar-none">
            {[
              { id: "compte", label: t('mon_profil'), icon: User },
              { id: "afri_id", label: t('mon_afri_id'), icon: Star },
              { id: "notifications", label: t('notifications'), icon: Bell },
              { id: "securite", label: t('securite'), icon: Shield },
              { id: "langue", label: t('langue'), icon: Globe },
              { id: "application", label: t('theme'), icon: Moon },
              { id: "confidentialite", label: t('confidentialite'), icon: Lock },
              { id: "legal", label: t('cgu'), icon: FileText },
              { id: "support", label: t('centre_aide'), icon: HelpCircle },
              { id: "logout", label: t('deconnexion'), icon: LogOut, isDanger: true }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              if (tab.id === "logout") {
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                        setShowDeleteConfirm(false);
                        if (onLogout) onLogout();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer md:w-full select-none text-red-500 hover:bg-red-500/10 md:mt-auto"
                  >
                    <TabIcon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              }
              if (tab.id === "legal" || tab.id === "confidentialite") {
                 return (
                   <button
                     key={tab.id}
                     type="button"
                     onClick={() => {
                        setActiveLegalPage(tab.id === "confidentialite" ? "privacy" : "terms");
                     }}
                     className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer md:w-full select-none text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-gray-900/40"
                   >
                     <TabIcon className="w-4 h-4 shrink-0" />
                     <span>{tab.label}</span>
                   </button>
                 );
              }
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setShowDeleteConfirm(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer md:w-full select-none ${
                    isSelected 
                      ? "bg-orange-500 text-white shadow-sm shadow-orange-500/10 font-black md:translate-x-1" 
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-gray-900/40"
                  }`}
                >
                  <TabIcon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-Contents Panels Area (Scrollable) */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            
            {/* 1. APPLICATION TAB */}
            {activeTab === "application" && (
              <div className="space-y-8 animate-fadeIn">
                {/* Apparence */}
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5 mb-1">
                      🎨 Thème visuel
                    </h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Choisissez l'interface qui correspond à votre vibe artistique.</p>
                </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: "dark-gold", label: "Noir & Or", icon: Moon, desc: "Ambiance Cabaret" },
                  { id: "light-gold", label: "Blanc & Or", icon: Sun, desc: "Énergie pure" },
                  { id: "night-navy", label: "Bleu Nuit", icon: Shield, desc: "Deep Ocean VIP" }
                ].map((theme) => {
                  const isSelected = themeMode === theme.id;
                  const ThemeIcon = theme.icon;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        setThemeMode(theme.id as any);
                        if (theme.id === "light-gold") setDarkMode(false);
                        else setDarkMode(true);
                        try {
                          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                          const osc = ctx.createOscillator();
                          const gain = ctx.createGain();
                          osc.connect(gain);
                          gain.connect(ctx.destination);
                          osc.frequency.setValueAtTime(880, ctx.currentTime);
                          gain.gain.setValueAtTime(0.02, ctx.currentTime);
                          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
                          osc.start();
                          osc.stop(ctx.currentTime + 0.1);
                        } catch (e) {}
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-orange-500/5 border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold ring-1 ring-orange-500/20 shadow-sm"
                          : "bg-gray-50/50 dark:bg-gray-950/20 border-gray-150 dark:border-gray-800 text-gray-400 hover:text-gray-800 dark:hover:text-white"
                      }`}
                    >
                      <ThemeIcon className="w-5 h-5 text-orange-500" />
                      <span className="text-[11px] font-bold">{theme.label}</span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-normal">{theme.desc}</span>
                    </button>
                  );
                })}
              </div>
              </div>

              <div className="border border-gray-100 dark:border-gray-800 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-900/10 space-y-3.5">
                  <h4 className="text-xs font-black text-gray-800 dark:text-gray-300 uppercase">Ajustement Régional</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Commune Gombo</label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-2 text-xs font-medium dark:text-white focus:outline-none"
                      >
                        <option value="Abidjan (Cocody)">Cocody, Abidjan</option>
                        <option value="Abidjan (Marcory)">Marcory, Abidjan</option>
                        <option value="Abidjan (Plateau)">Plateau, Abidjan</option>
                        <option value="Abidjan (Yopougon)">Yopougon, Abidjan</option>
                        <option value="Abidjan (Treichville)">Treichville, Abidjan</option>
                        <option value="Bouaké">Bouaké</option>
                        <option value="Yamoussoukro">Yamoussoukro</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Monnaie</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-2 text-xs font-medium dark:text-white focus:outline-none"
                      >
                        <option value="FCFA">CFA (FCFA Franc)</option>
                        <option value="EUR">Euros (€)</option>
                        <option value="USD">Dollars ($)</option>
                      </select>
                    </div>
                  </div>
                </div>

                 <div className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl bg-[#0b0b0c] space-y-4 mt-8 border-l-4 border-[#D4AF37]">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span>🪘 Sons AFRIGOMBO</span>
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-zinc-800/60 cursor-pointer hover:border-zinc-700/60 transition-all">
                        <span className="text-xs font-bold text-gray-300">☑ Sons d'effets activés</span>
                        <input
                          type="checkbox"
                          checked={enableUiSounds}
                          onChange={(e) => setEnableUiSounds(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-850 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37] relative"></div>
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-zinc-800/60 cursor-pointer hover:border-zinc-700/60 transition-all">
                        <span className="text-xs font-bold text-gray-300">☑ Vibrations haptiques</span>
                        <input
                          type="checkbox"
                          checked={enableVibration}
                          onChange={(e) => setEnableVibration(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-850 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37] relative"></div>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 text-[#D4AF37]" />
                          Volume principal
                        </span>
                        <span className="font-mono text-xs text-[#D4AF37] font-black">{audioVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={audioVolume}
                        onChange={(e) => setAudioVolume(parseInt(e.target.value))}
                        onMouseUp={playDemoBeep}
                        onTouchEnd={playDemoBeep}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Mode d'écoute</span>
                      <div className="grid grid-cols-3 gap-2">
                        {["Silencieux", "Standard", "Immersion"].map((m) => {
                          const isSelected = soundMode === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setSoundMode(m);
                                if (m !== "Silencieux") {
                                  try { audioSynth.playTamTam(m === "Immersion"); } catch (_) {}
                                }
                              }}
                              className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]"
                                  : "bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                              }`}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl bg-[#0b0b0c] space-y-4 border-l-4 border-cyan-500">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center justify-between">
                    <span>⚙ Performance & Optimisation</span>
                    <span className="text-[9px] bg-cyan-500/10 text-cyan-400 font-mono py-0.5 px-2 rounded-full uppercase">Stabilité continue</span>
                  </h4>
                  <div className="space-y-4">
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Optimisez l'application pour rester parfaitement réactive sur de faibles connexions de données (2G, slow-2g), batterie faible ou téléphones de modeste configuration.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-zinc-800/60 cursor-pointer hover:border-zinc-700/60 transition-all">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-gray-300">🎵 Sons AFRIGOMBO</span>
                          <span className="text-[9px] text-zinc-500 block">Sons et effets sonores</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={enableUiSounds}
                          onChange={(e) => setEnableUiSounds(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 relative"></div>
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-zinc-800/60 cursor-pointer hover:border-zinc-700/60 transition-all">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-gray-300">✨ Animations</span>
                          <span className="text-[9px] text-zinc-500 block">Transitions et animations de glissement</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={enableAnimations}
                          onChange={(e) => setEnableAnimations(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 relative"></div>
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-zinc-800/60 cursor-pointer hover:border-zinc-700/60 transition-all">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-gray-300">📶 Économie de données</span>
                          <span className="text-[9px] text-zinc-500 block">Qualité d'image minimale, pas de préchargement</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={enableDataSave}
                          onChange={(e) => setEnableDataSave(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 relative"></div>
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-zinc-800/60 cursor-pointer hover:border-zinc-700/60 transition-all">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-gray-300">🔋 Économie batterie</span>
                          <span className="text-[9px] text-zinc-500 block">Désactiver vibrations, fréquence réduite</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={enableBatterySave}
                          onChange={(e) => setEnableBatterySave(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 relative"></div>
                      </label>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-850 space-y-2 font-mono text-[10px] text-zinc-400">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 uppercase tracking-widest">Batterie du dispositif:</span>
                        <span className={`font-bold ${isBatteryLow ? "text-yellow-500 animate-pulse" : "text-emerald-500"}`}>
                          {batteryLevel}% {isBatteryLow && "(Faible)"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 uppercase tracking-widest">Connexion active:</span>
                        <span className={`font-bold ${isSlowConnection ? "text-cyan-400 animate-pulse" : "text-emerald-500"}`}>
                          {connectionType.toUpperCase()} {isSlowConnection && "(Lente)"}
                        </span>
                      </div>
                      {(isBatteryLow || isSlowConnection) && (
                        <div className="pt-2 border-t border-zinc-900/60 space-y-1">
                          {isBatteryLow && (
                            <div className="flex items-center gap-1.5 text-yellow-500 font-bold uppercase text-[9px]">
                              <span>🔋 Batterie faible détectée. Mode léger AFRIGOMBO activé automatiquement.</span>
                            </div>
                          )}
                          {isSlowConnection && (
                            <div className="flex items-center gap-1.5 text-cyan-450 font-bold uppercase text-[9px]">
                              <span>📶 Connexion lente. AFRIGOMBO optimise votre expérience en continu.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border border-gray-100 dark:border-gray-800 p-5 rounded-2xl bg-[#0b0b0c] space-y-4 border-l-4 border-emerald-500">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center justify-between">
                    <span>🎵 Ambiance AFRIGOMBO</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-mono py-0.5 px-2 rounded-full uppercase">Canal Musical Continu</span>
                  </h4>
                  <div className="space-y-4">
                    <p className="text-[11px] text-zinc-400 leading-relaxed">Activez une ambiance sonore de fond pour vous plonger au sein d'une véritable maison de production d'Abidjan.</p>
                    
                    <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-zinc-800/60 cursor-pointer hover:border-zinc-700/60 transition-all">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-300">Activer la musique de fond</span>
                        <p className="text-[9px] text-zinc-500">Boucles d'instruments de prestige (Kora, Djembé, Saxophone)</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableAmbientMusic}
                        onChange={(e) => setEnableAmbientMusic(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-850 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                    </label>

                    {enableAmbientMusic && (
                      <div className="space-y-2 pt-1 animate-fadeIn">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Sélectionner l'Univers</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {["Silencieux", "Afro Chill", "Piano Lounge", "Percussion Africaine", "Studio Beat"].map((style) => {
                            const isSelected = ambianceAudio === style;
                            return (
                              <button
                                key={style}
                                type="button"
                                onClick={() => {
                                  setAmbianceAudio(style);
                                  // Live trigger sounds on selection to provide beautiful responsive instant feeling
                                  try {
                                    if (style === "Percussion Africaine") audioSynth.playTamTam(false);
                                    else audioSynth.playKoraNote(392.00, 0, 0.2, 0.4);
                                  } catch (_) {}
                                }}
                                className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all text-center cursor-pointer ${
                                  isSelected
                                    ? "bg-emerald-500/10 border-emerald-500 text-[#10B981] font-black"
                                    : "bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                                }`}
                              >
                                {style}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2.5 LANGUE TAB */}
            {activeTab === "langue" && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5 mb-1">
                    <Globe className="w-4 h-4 text-[#D4AF37]" />
                    {t('choisir_langue')}
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{t('langue_desc')}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "fr", label: t('langue_fr'), desc: "Français Standard" },
                    { id: "en", label: t('langue_en'), desc: "English Language" },
                    { id: "nouchi", label: t('langue_nouchi'), desc: "Côte d'Ivoire (Appolo/Bété)" }
                  ].map((lang) => {
                    const isSelected = currentLang === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setLanguage(lang.id as Language)}
                        className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400" 
                            : "bg-gray-50/50 dark:bg-gray-900/20 border-gray-150 dark:border-gray-800 text-gray-400 hover:text-gray-800 dark:hover:text-white"
                        }`}
                      >
                        <span className="text-sm font-black uppercase mb-0.5">{lang.label}</span>
                        <span className="text-[9px] font-medium opacity-60 italic">{lang.desc}</span>
                        {isSelected && (
                          <div className="mt-2 w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. CONFIDENTIALITÉ TAB */}
            {activeTab === "confidentialite" && (
              <div className="space-y-5 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5 mb-1">
                    🔒 Confidentialité de Recherche
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Contrôlez vos données d’identité sur le showbiz.</p>
                </div>

                <div className="space-y-3.5">
                  <label className="flex items-start justify-between cursor-pointer group gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-300 group-hover:text-orange-500 transition-colors">
                        🌐 Profil visible publiquement
                      </span>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        Permet aux promoteurs et leaders de groupes de trouver votre avatar dans l'annuaire "Top Talents".
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={publicProfile}
                      onChange={(e) => setPublicProfile(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5.5 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 relative shrink-0"></div>
                  </label>

                  <label className="flex items-start justify-between cursor-pointer group gap-4 pt-1">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-300 group-hover:text-orange-500 transition-colors">
                        📞 Afficher mes coordonnées WhatsApp
                      </span>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        Votre numéro de téléphone ne sera affiché qu'aux personnes dont vous avez accepté le cachet ou la réservation de gombo.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showContactDetails}
                      onChange={(e) => setShowContactDetails(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5.5 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 relative shrink-0"></div>
                  </label>
                </div>
              </div>
            )}

            {/* 4. COMPTE TAB (Merged from Sécurité & Compte) */}
            {activeTab === "compte" && (
              <div className="space-y-8 animate-fadeIn">
                {/* Sécurité */}
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5 mb-1">
                      🛡️ Sécurité du Compte
                    </h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Gérez vos options de sécurité de session et mot de passe.</p>
                </div>

                <div className="border border-gray-100 dark:border-gray-800 p-4 rounded-2xl bg-gray-55/60 dark:bg-gray-900/10 space-y-3.5">
                  <h4 className="text-xs font-black text-gray-800 dark:text-gray-300 uppercase">Paramètres de Connexion</h4>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Double Facteur (Simulé)</span>
                    <span className="px-2 py-0.5 bg-[#D4AF37]/15 text-[#D4AF37] font-bold rounded text-[10px] uppercase">
                      Actif en simulation
                    </span>
                  </div>
                </div>

                <form onSubmit={handlePasswordChange} className="border border-gray-100 dark:border-gray-800 p-4 rounded-2xl bg-gray-55/60 dark:bg-gray-900/10 space-y-3.5">
                  <h4 className="text-xs font-black text-gray-800 dark:text-gray-300 uppercase font-sans">Changer mon mot de passe</h4>
                  
                  {pwChangeSuccess && (
                     <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-bold">
                       ✓ Votre mot de passe a été modifié avec succès de manière sécurisée !
                     </div>
                  )}

                  {pwChangeError && (
                     <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl font-bold font-sans">
                       ⚠️ {pwChangeError}
                     </div>
                  )}

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Ancien mot de passe</label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase font-sans">Nouveau mot de passe</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase font-sans">Confirmer le nouveau mot de passe</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#E06C00] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm mt-2"
                  >
                    Mettre à jour mon mot de passe
                  </button>
                </form>
                </div>

                {/* Données de Compte */}
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5 mb-1">
                      👤 Données de Compte
                    </h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Détails d'authentification et de sécurité.</p>
                </div>

                <div className="border border-gray-100 dark:border-gray-800 p-4 rounded-2xl bg-gray-55/60 dark:bg-gray-900/10 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100/50 dark:border-gray-800/50">
                    <span className="text-gray-400">Identifiant de session</span>
                    <span className="font-mono text-gray-900 dark:text-white font-semibold">GOMBO-PRO-CI</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-gray-400">Statut de sécurité</span>
                    <span className="px-2 py-0.5 bg-emerald-150 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-extrabold rounded-md text-[10px] uppercase">
                      Actif & Sécurisé
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-3">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-300">Newsletter d'Abidjan</span>
                      <p className="text-[10px] text-gray-400">Recevoir le récapitulatif hebdo des plus gros cachets par email.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={receiveNewsletter}
                      onChange={(e) => setReceiveNewsletter(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5.5 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 relative"></div>
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  {showDeleteConfirm ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-3 font-semibold text-xs text-red-600 dark:text-red-400">
                      <p>⚠️ Êtes-vous sûr ? Cette action est irréversible et effacera vos données.</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={deleteAccountSimulate}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-[10px] uppercase cursor-pointer"
                        >
                          Oui, supprimer définitivement
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-extrabold rounded-xl text-[10px] uppercase cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-500 hover:text-red-600 hover:underline text-xs flex items-center gap-1.5 cursor-pointer font-bold select-none"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                      Désactiver ou Supprimer définitivement mon compte Gombo
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

            {/* 5. À PROPOS TAB */}
            {activeTab === "support" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-center py-6 bg-gradient-to-tr from-amber-500/5 to-orange-500/5 border border-dashed border-gray-150 dark:border-gray-800/80 rounded-2xl">
                  <span className="text-3xl">🇨🇮</span>
                  <p className="text-sm font-black text-gray-900 dark:text-white uppercase mt-2 tracking-wide">Y’A GOMBO MUSIC</p>
                  <p className="text-[10px] text-orange-500 font-bold">Plateforme de Prestige pour Artistes Ivoiriens</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-mono">Version 2.5 - Abidjan Edition</p>
                </div>

                <div className="space-y-2.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  <p>
                    <strong className="text-gray-700 dark:text-gray-300">Y’A GOMBO MUSIC</strong> est la première application d'ingénierie musicale de Côte d'Ivoire qui unifie les musiciens, chanteurs et orchestres avec les promoteurs d'événements.
                  </p>
                  <p>
                    Tous les cachets et acomptes payés sur le réseau sont garantis par dépôt bloqué (escrow) 100% sécurisé via Mobile Money (Wave, Orange, MTN, Moov).
                  </p>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">
                    <span>© {new Date().getFullYear()} GOMBO SERVICES INC</span>
                    <span>Support : contact@gombo.ci</span>
                  </div>

                  <div className="pt-3 flex flex-wrap gap-2.5 justify-center text-[10px] font-black border-t border-gray-100 dark:border-gray-800">
                    <button 
                      type="button" 
                      onClick={() => setActiveLegalPage("privacy")} 
                      className="text-[#D4AF37] hover:underline cursor-pointer uppercase tracking-wider"
                    >
                      Politique de Confidentialité 📋
                    </button>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <button 
                      type="button" 
                      onClick={() => setActiveLegalPage("terms")} 
                      className="text-[#D4AF37] hover:underline cursor-pointer uppercase tracking-wider"
                    >
                      Conditions d'Utilisation ⚖️
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/10 gap-2.5 shrink-0">
          <div>
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="px-3 py-1.5 text-[10px] tracking-wide font-extrabold uppercase text-red-500 hover:text-white rounded-xl hover:bg-red-500/90 transition-all border border-red-500/20 cursor-pointer"
              >
                Déconnexion
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-550 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-850/50 transition-all cursor-pointer"
            >
              {t('annuler')}
            </button>
            
            <button
              onClick={handleSave}
              disabled={saveSuccess || isSaving}
              className={`px-5 py-2 text-xs font-black uppercase tracking-wider text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                saveSuccess 
                  ? "bg-emerald-500 hover:bg-emerald-500" 
                  : isSaving ? "bg-zinc-700" : "bg-[#D4AF37] hover:bg-[#E06C00]"
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {t('enregistrer')} !
                </>
              ) : isSaving ? (
                <>
                   <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <span>{t('enregistrer')}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
