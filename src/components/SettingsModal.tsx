import React, { useState, useEffect } from "react";
import { 
  X, Sun, Moon, Wallet, Bell, MapPin, 
  Check, Volume2, Shield, Info, HelpCircle
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onLogout?: () => void;
}

export default function SettingsModal({ isOpen, onClose, darkMode, setDarkMode, onLogout }: SettingsModalProps) {
  // Localized preferences
  const [region, setRegion] = useState(() => localStorage.getItem("gombo_pref_region") || "Abidjan (Cocody)");
  const [paymentMethod, setPaymentMethod] = useState(() => localStorage.getItem("gombo_pref_payment") || "Wave");
  const [currency, setCurrency] = useState(() => localStorage.getItem("gombo_pref_currency") || "FCFA");
  const [audioVolume, setAudioVolume] = useState(() => parseInt(localStorage.getItem("gombo_pref_volume") || "80"));
  const [enableSoundAlerts, setEnableSoundAlerts] = useState(() => localStorage.getItem("gombo_pref_alerts") !== "false");
  const [enableUiSounds, setEnableUiSounds] = useState(() => localStorage.getItem("gombo_pref_ui_sounds") !== "false");
  
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    // Persist settings to local storage
    localStorage.setItem("gombo_pref_region", region);
    localStorage.setItem("gombo_pref_payment", paymentMethod);
    localStorage.setItem("gombo_pref_currency", currency);
    localStorage.setItem("gombo_pref_volume", audioVolume.toString());
    localStorage.setItem("gombo_pref_alerts", enableSoundAlerts.toString());
    localStorage.setItem("gombo_pref_ui_sounds", enableUiSounds.toString());

    // Direct user success feedback
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);

    // Play a tiny confirmation chime if enabled
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
        // AudioContext browser restrictions or lack of support
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div 
        id="settings-modal-card"
        className="bg-white dark:bg-[#151518] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300 scale-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-orange-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-500">
              <Shield className="w-5.5 h-5.5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Paramètres Généraux</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">Configuration et préférences d'utilisation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Section: Apparence */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-550 flex items-center gap-1.5">
              <span>Apparence & Vibe</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDarkMode(false)}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all ${
                  !darkMode 
                    ? "bg-orange-50 border-orange-200 text-orange-600 font-bold" 
                    : "bg-gray-50/50 dark:bg-gray-900/30 border-gray-200/60 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Sun className="w-4.5 h-4.5" />
                Mode Clair
              </button>
              <button
                onClick={() => setDarkMode(true)}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all ${
                  darkMode 
                    ? "bg-orange-950/20 border-orange-900 text-orange-400 font-bold" 
                    : "bg-gray-50/50 dark:bg-gray-900/30 border-gray-200/60 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Moon className="w-4.5 h-4.5" />
                Mode Sombre
              </button>
            </div>
          </div>

          {/* Section: Préférences Localisation & Devises */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-550 flex items-center gap-1.5">
              <span>Préférences Régionales</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Commune / Region */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Région / Commune
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-gray-905/30 border border-gray-200/60 dark:border-gray-800 rounded-xl p-2.5 text-xs font-medium text-gray-800 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="Abidjan (Cocody)">Cocody, Abidjan</option>
                  <option value="Abidjan (Marcory)">Marcory, Abidjan</option>
                  <option value="Abidjan (Plateau)">Plateau, Abidjan</option>
                  <option value="Abidjan (Yopougon)">Yopougon, Abidjan</option>
                  <option value="Abidjan (Treichville)">Treichville, Abidjan</option>
                  <option value="Abidjan (Koumassi)">Koumassi, Abidjan</option>
                  <option value="Abidjan (Deux Plateaux)">Deux Plateaux</option>
                  <option value="Bouaké">Bouaké</option>
                  <option value="Yamoussoukro">Yamoussoukro</option>
                  <option value="San-Pédro">San-Pédro</option>
                  <option value="Assinie">Assinie</option>
                </select>
              </div>

              {/* Devise */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span>Devise active</span>
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-gray-905/30 border border-gray-200/60 dark:border-gray-800 rounded-xl p-2.5 text-xs font-medium text-gray-800 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="FCFA">FCFA (Franc CFA)</option>
                  <option value="EUR">Euros (€)</option>
                  <option value="USD">Dollars ($)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Paiements par défaut */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-550 flex items-center gap-1.5">
              <span>Transfert Mobile Money</span>
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" />
                Réseau préféré de réception des cachets
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["Wave", "Orange", "Moov", "MTN"].map((pm) => {
                  const isSelected = paymentMethod === pm;
                  return (
                    <button
                      key={pm}
                      onClick={() => setPaymentMethod(pm)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                        isSelected 
                          ? "bg-orange-500/10 border-orange-500 text-orange-500" 
                          : "bg-gray-50/55 dark:bg-gray-900/30 border-gray-150 dark:border-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                      }`}
                    >
                      {pm === "Wave" && "🌊 Wave"}
                      {pm === "Orange" && "🟠 Orange"}
                      {pm === "Moov" && "🔵 Moov"}
                      {pm === "MTN" && "🟡 MTN"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section: Notifications & Sons */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-550 flex items-center gap-1.5">
              <span>Alertes & Canaux Audio</span>
            </h3>

            <div className="space-y-3.5">
              {/* Audio Volume Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5" />
                    Volume des démos (musiques & extraits)
                  </span>
                  <span className="font-mono text-[10px] text-orange-500">{audioVolume}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audioVolume}
                    onChange={(e) => setAudioVolume(parseInt(e.target.value))}
                    onChangeCommit={playDemoBeep}
                    className="flex-1 accent-orange-550 cursor-pointer"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 pt-1">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-300 group-hover:text-orange-500 transition-colors flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 group-hover:text-orange-500" />
                      Alertes Gombos Urgents
                    </span>
                    <span className="block text-[10px] text-gray-400 dark:text-gray-500">
                      Sons instantanés lors de la parution d'un nouveau show.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableSoundAlerts}
                    onChange={(e) => setEnableSoundAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 relative"></div>
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-300 group-hover:text-orange-500 transition-colors flex items-center gap-1.5">
                      <span>🔔 Effets sonores d'action</span>
                    </span>
                    <span className="block text-[10px] text-gray-400 dark:text-gray-500">
                      Notifications sonores interactives pour les clicks et validations.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableUiSounds}
                    onChange={(e) => setEnableUiSounds(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 relative"></div>
                </label>
              </div>

            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/10 gap-2.5">
          <div>
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="px-4 py-2 text-xs font-bold text-red-500 hover:text-white rounded-xl hover:bg-red-500 transition-all border border-red-500/20"
              >
                Déconnexion
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-850/50 transition-all"
            >
              Annuler
            </button>
          
          <button
            onClick={handleSave}
            disabled={saveSuccess}
            className={`px-5 py-2.5 text-xs font-extrabold text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 ${
              saveSuccess 
                ? "bg-emerald-500 hover:bg-emerald-500" 
                : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-97"
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
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
