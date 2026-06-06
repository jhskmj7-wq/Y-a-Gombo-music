import React, { useState } from "react";
import { 
  X, Sun, Moon, Wallet, Bell, MapPin, 
  Check, Volume2, Shield, Info, HelpCircle,
  User, Lock, Trash2, Laptop, Smartphone, Eye
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  themeMode: "light" | "dark" | "system";
  setThemeMode: (theme: "light" | "dark" | "system") => void;
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
  const [activeTab, setActiveTab] = useState<"apparence" | "notifications" | "securite" | "confidentialite" | "compte" | "apropos">("apparence");

  // Localized preferences stored in LocalStorage
  const [region, setRegion] = useState(() => localStorage.getItem("gombo_pref_region") || "Abidjan (Cocody)");
  const [paymentMethod, setPaymentMethod] = useState(() => localStorage.getItem("gombo_pref_payment") || "Wave");
  const [currency, setCurrency] = useState(() => localStorage.getItem("gombo_pref_currency") || "FCFA");
  const [audioVolume, setAudioVolume] = useState(() => parseInt(localStorage.getItem("gombo_pref_volume") || "80"));
  const [enableSoundAlerts, setEnableSoundAlerts] = useState(() => localStorage.getItem("gombo_pref_alerts") !== "false");
  const [enableUiSounds, setEnableUiSounds] = useState(() => localStorage.getItem("gombo_pref_ui_sounds") !== "false");

  // Privacy states
  const [publicProfile, setPublicProfile] = useState(() => localStorage.getItem("gombo_pref_public_profile") !== "false");
  const [showContactDetails, setShowContactDetails] = useState(() => localStorage.getItem("gombo_pref_show_contact") !== "false");

  // Account states
  const [receiveNewsletter, setReceiveNewsletter] = useState(() => localStorage.getItem("gombo_pref_newsletter") === "true");

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleSave = () => {
    // Persist settings to LocalStorage
    localStorage.setItem("gombo_pref_region", region);
    localStorage.setItem("gombo_pref_payment", paymentMethod);
    localStorage.setItem("gombo_pref_currency", currency);
    localStorage.setItem("gombo_pref_volume", audioVolume.toString());
    localStorage.setItem("gombo_pref_alerts", enableSoundAlerts.toString());
    localStorage.setItem("gombo_pref_ui_sounds", enableUiSounds.toString());
    
    // Privacy
    localStorage.setItem("gombo_pref_public_profile", publicProfile.toString());
    localStorage.setItem("gombo_pref_show_contact", showContactDetails.toString());
    
    // Account
    localStorage.setItem("gombo_pref_newsletter", receiveNewsletter.toString());

    // Trigger success feedback
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);

    // Play confirmation sound if enabled
    if (enableUiSounds) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime((audioVolume / 100) * 0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
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
        className="bg-white dark:bg-[#111113] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all duration-300 scale-100 flex flex-col h-[85vh] max-h-[680px]"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-orange-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Réglages Système</h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">Personnalisez votre expérience Y’A GOMBO MUSIC</p>
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
              { id: "apparence", label: "Apparence", icon: Sun },
              { id: "notifications", label: "Notifications", icon: Bell },
              { id: "securite", label: "Sécurité", icon: Shield },
              { id: "confidentialite", label: "Confidentialité", icon: Lock },
              { id: "compte", label: "Mon Compte", icon: User },
              { id: "apropos", label: "À propos", icon: Info }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
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
            
            {/* 1. APPARENCE TAB */}
            {activeTab === "apparence" && (
              <div className="space-y-5 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5 mb-1">
                    🎨 Thème visuel
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Choisissez l'interface qui correspond à votre vibe artistique.</p>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "light", label: "Clair", icon: Sun, desc: "Énergie pure" },
                    { id: "dark", label: "Sombre", icon: Moon, desc: "Ambiance Cabaret" },
                    { id: "system", label: "Système", icon: Laptop, desc: "Selon l'OS" }
                  ].map((theme) => {
                    const isSelected = themeMode === theme.id;
                    const ThemeIcon = theme.icon;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setThemeMode(theme.id as any)}
                        className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-orange-500/5 border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold"
                            : "bg-gray-50/50 dark:bg-gray-900/20 border-gray-150 dark:border-gray-800 text-gray-400 hover:text-gray-800 dark:hover:text-white"
                        }`}
                      >
                        <ThemeIcon className="w-5 h-5 text-orange-500" />
                        <span className="text-xs">{theme.label}</span>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-normal">{theme.desc}</span>
                      </button>
                    );
                  })}
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
              </div>
            )}

            {/* 2. NOTIFICATIONS TAB */}
            {activeTab === "notifications" && (
              <div className="space-y-5 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5 mb-1">
                    🔊 Volume & Alertes Audio
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Contrôlez les retours interactifs de l'application.</p>
                </div>

                <div className="space-y-4">
                  <div className="border border-gray-100 dark:border-gray-800 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-900/10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-orange-500" />
                        Volume des effets sonores
                      </span>
                      <span className="font-mono text-xs text-orange-500 font-extrabold">{audioVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={audioVolume}
                      onChange={(e) => setAudioVolume(parseInt(e.target.value))}
                      onMouseUp={playDemoBeep}
                      onTouchEnd={playDemoBeep}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-3 pt-1">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-300 group-hover:text-orange-500 transition-colors">
                          🚨 Flash Gombos Urgents
                        </span>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          Sons prioritaires dès qu'une offre urgente est émise à Abidjan.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableSoundAlerts}
                        onChange={(e) => setEnableSoundAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5.5 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 relative"></div>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-300 group-hover:text-orange-500 transition-colors">
                          🛎️ Clics interactifs
                        </span>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          Effets audio brefs lors de la validation des candidatures.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableUiSounds}
                        onChange={(e) => setEnableUiSounds(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5.5 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 relative"></div>
                    </label>
                  </div>
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

            {/* 3.5 SÉCURITÉ TAB */}
            {activeTab === "securite" && (
              <div className="space-y-5 animate-fadeIn">
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
                    <span className="px-2 py-0.5 bg-[#FF7A00]/15 text-[#FF7A00] font-bold rounded text-[10px] uppercase">
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
                    className="w-full py-2.5 bg-[#FF7A00] hover:bg-[#E06C00] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm mt-2"
                  >
                    Mettre à jour mon mot de passe
                  </button>
                </form>
              </div>
            )}

            {/* 4. COMPTE TAB */}
            {activeTab === "compte" && (
              <div className="space-y-5 animate-fadeIn">
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
            )}

            {/* 5. À PROPOS TAB */}
            {activeTab === "apropos" && (
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
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[10px] text-gray-400 uppercase font-bold">
                    <span>© {new Date().getFullYear()} GOMBO SERVICES INC</span>
                    <span>Support : contact@gombo.ci</span>
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
              Annuler
            </button>
            
            <button
              onClick={handleSave}
              disabled={saveSuccess}
              className={`px-5 py-2 text-xs font-black uppercase tracking-wider text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                saveSuccess 
                  ? "bg-emerald-500 hover:bg-emerald-500" 
                  : "bg-[#FF7A00] hover:bg-[#E06C00]"
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Enregistré !
                </>
              ) : (
                <>
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
