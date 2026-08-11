import React, { useState, useEffect } from "react";
import { Settings, Save, Sliders, RefreshCw, CheckCircle, Play, Pause, Square, AlertTriangle, X } from "lucide-react";
import { globalAudioManager, AudioState } from "../../lib/audioManager";
import AfrigomboGlobalSettings from "./AfrigomboGlobalSettings";
import { fetchPlatformPricing, updatePlatformPricing, PricingConfig } from "../../lib/financial";
import { useAuth } from "../../AuthContext";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";

interface AdminSettingsProps {
  audioSynth?: any;
}

export default function AdminSettings({
  audioSynth
}: AdminSettingsProps) {
  const { currentUser } = useAuth();
  
  const [pricing, setPricing] = useState<PricingConfig>({
    standardCommissionRate: 0.025,
    premiumCommissionRate: 0.015
  });
  
  const [loadingPricing, setLoadingPricing] = useState(true);
  
  const [draftStandard, setDraftStandard] = useState("2.5");
  const [draftPremium, setDraftPremium] = useState("1.5");
  
  // Sheet states
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetNewStandard, setSheetNewStandard] = useState<number>(0);
  const [sheetNewPremium, setSheetNewPremium] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Global Audio states
  const [audioState, setAudioState] = useState<AudioState>(globalAudioManager.getState());

  useEffect(() => {
    const unsub = globalAudioManager.subscribe((state) => {
      setAudioState(state);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const loadPricing = async () => {
      const p = await fetchPlatformPricing();
      setPricing(p);
      setDraftStandard((p.standardCommissionRate * 100).toString());
      setDraftPremium((p.premiumCommissionRate * 100).toString());
      setLoadingPricing(false);
    };
    loadPricing();
  }, []);

  const musicVolume = audioState.volume;
  const musicMuted = audioState.isMuted;
  const activeMusicPlay = audioState.currentPlaying;
  const isPaused = audioState.isPaused;

  const handleOpenSheet = () => {
    const sRate = parseFloat(draftStandard);
    const pRate = parseFloat(draftPremium);
    
    if (isNaN(sRate) || sRate < 0 || sRate > 100 || isNaN(pRate) || pRate < 0 || pRate > 100) {
      alert("Valeurs invalides pour les taux de commission.");
      return;
    }
    
    setSheetNewStandard(sRate / 100);
    setSheetNewPremium(pRate / 100);
    setSheetOpen(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    
    try {
      const updates: Partial<PricingConfig> = {
        standardCommissionRate: sheetNewStandard,
        premiumCommissionRate: sheetNewPremium
      };
      
      await updatePlatformPricing(updates);
      setPricing(prev => ({ ...prev, ...updates }));
      
      // Audit entry
      await addDoc(collection(db, "admin_audit_logs"), {
        adminId: currentUser?.uid || "unknown",
        adminEmail: currentUser?.email || "unknown",
        actionType: "UPDATE_COMMISSION_RATES_BATCH",
        oldRates: {
            standard: pricing.standardCommissionRate,
            premium: pricing.premiumCommissionRate
        },
        newRates: {
            standard: sheetNewStandard,
            premium: sheetNewPremium
        },
        timestamp: new Date().toISOString()
      });
      
      try { audioSynth?.playValidationSuccess(); } catch (err) {}
      setSheetOpen(false);
    } catch (e) {
      console.error(e);
      alert("Impossible d'enregistrer la configuration");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Header */}
      <div className="border-b border-afri-border pb-4">
        <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37] flex items-center gap-1.5">
          <Settings className="w-4 h-4" />
          Paramètres Généraux du Système
        </h3>
        <p className="text-xs text-afri-text-sec mt-1">
          Gérez les frais d'infrastructure, taux d'imposition administratifs et options globales d'AFRIGOMBO ELITE.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Global Settings Component */}
        <div className="col-span-1 md:col-span-3">
          <AfrigomboGlobalSettings audioSynth={audioSynth} />
        </div>

        {/* Commission setting Card */}
        <div className="col-span-1 md:col-span-2 p-6 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-6 relative overflow-hidden">
          <h4 className="text-xs font-mono uppercase font-black tracking-wider text-[#D4AF37] flex items-center gap-1.5">
            <Sliders className="w-4 h-4" />
            Tarification et Commissions
          </h4>
          
          {loadingPricing ? (
            <div className="text-xs font-mono text-afri-text-sec animate-pulse">Chargement des données...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* STANDARD */}
              <div className="bg-afri-bg p-4 rounded-xl border border-afri-border space-y-3">
                <h5 className="text-[10px] font-mono uppercase font-black text-afri-text">Compte Standard</h5>
                <p className="text-[9px] text-afri-text-sec font-mono">Commission prélevée sur chaque Gombo</p>
                
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={draftStandard}
                    onChange={(e) => setDraftStandard(e.target.value)}
                    className="bg-zinc-900 border border-[#D4AF37]/30 rounded-lg p-2 text-sm font-mono text-afri-text focus:outline-none focus:border-[#D4AF37] w-full text-center"
                  />
                  <span className="text-sm font-mono font-bold text-afri-text-sec">%</span>
                </div>
                
                {/* UPDATE BUTTON - ONLY ONE FOR BOTH */}
                <button
                    type="button"
                    onClick={handleOpenSheet}
                    className="w-full py-2 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg text-[10px] font-mono font-bold uppercase transition hover:bg-[#D4AF37]/30"
                >
                    Enregistrer les taux
                </button>
            </div>
          </div>
          )}
        </div>

        {/* Quick parameters info box */}
        <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-2xl flex flex-col justify-between">
          <div className="space-y-3">
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-afri-text-sec font-bold">Rappel des Directives</h5>
            <p className="text-xs text-afri-text-sec leading-relaxed font-sans">
              La tarification configurée ici est appliquée immédiatement à toutes les NOUVELLES transactions.
              Les transactions existantes conservent le taux appliqué lors de leur création.
            </p>
          </div>
          <div className="border-t border-afri-border pt-4 mt-6">
            <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-2.5 py-1 inline-block">
              Statut: ACTIF
            </span>
          </div>
        </div>

        {/* Section Musique Officielle */}
        <div className="col-span-1 md:col-span-2 p-6 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-6 relative overflow-hidden">
          <h4 className="text-xs font-mono uppercase font-black tracking-wider text-[#D4AF37] flex items-center gap-1.5">
            🎵 Gestion de la Musique Officielle
          </h4>
          <p className="text-xs text-afri-text-sec">
            Contrôlez les pistes officielles et hymnes d'AFRIGOMBO ELITE intégrés à l'application.
          </p>
          <div className="space-y-4">
            {/* BUTTONS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  globalAudioManager.playIntro(true);
                }}
                className={`py-3 px-4 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeMusicPlay === "intro"
                    ? "bg-afri-bg-sec/20 border-[#D4AF37] text-afri-text"
                    : "bg-afri-bg border-afri-border text-afri-text hover:text-afri-text"
                }`}
              >
                {activeMusicPlay === "intro" ? (isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />) : <Play className="w-3 h-3" />}
                Réécouter l'introduction
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeMusicPlay === "hymne") {
                    if (isPaused) globalAudioManager.resume();
                    else globalAudioManager.pause();
                  } else {
                    globalAudioManager.playHymn();
                  }
                }}
                className={`py-3 px-4 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeMusicPlay === "hymne"
                    ? "bg-afri-bg-sec/20 border-[#D4AF37] text-afri-text"
                    : "bg-afri-bg border-afri-border text-afri-text hover:text-afri-text"
                }`}
              >
                {activeMusicPlay === "hymne" ? (isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />) : <Play className="w-3 h-3" />}
                Hymne officiel
              </button>
            </div>
            {/* STOP BUTTON */}
            {activeMusicPlay !== "none" && (
              <button
                type="button"
                onClick={() => {
                  globalAudioManager.stop();
                }}
                className="w-full py-2 bg-red-950/20 hover:bg-red-950/35 border border-red-900/30 text-red-400 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Square className="w-3 h-3 fill-current" />
                Arrêter la musique
              </button>
            )}

            {/* MUTED / ENABLE TOGGLE */}
            <label className="flex items-center justify-between cursor-pointer group pt-2 border-t border-afri-border">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-afri-text group-hover:text-afri-text transition-colors">Activer / Désactiver la Musique</span>
                <p className="text-[10px] text-afri-text-sec leading-none">Mettre en sourdine l'émetteur audio global</p>
              </div>
              <input
                type="checkbox"
                checked={!musicMuted}
                onChange={(e) => {
                  const isEnabled = e.target.checked;
                  globalAudioManager.setIsMuted(!isEnabled);
                }}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-afri-bg-sec peer-checked:bg-afri-bg-sec rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5"></div>
            </label>

            {/* VOLUME SLIDER */}
            <div className="space-y-2 pt-2 border-t border-afri-border">
              <div className="flex justify-between items-center text-[10px] font-mono text-afri-text-sec font-bold">
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
                }}
                className="w-full h-1.5 bg-afri-bg rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
              />
            </div>
          </div>
        </div>

        {/* Quick parameters info box 2 */}
        <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-2xl flex flex-col justify-between">
          <div className="space-y-3">
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-afri-text-sec font-bold">Thèmes Officiels</h5>
            <p className="text-xs text-afri-text-sec leading-relaxed font-sans">
              L'introduction se lance automatiquement lors de la toute première visite d'un nouvel utilisateur sur l'écosystème. L'hymne peut être déclenché manuellement depuis le Terrain ou depuis l'Espace Administration.
            </p>
          </div>
          <div className="border-t border-afri-border pt-4 mt-6">
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#D4AF37] bg-afri-bg-sec/10 border border-[#D4AF37]/20 rounded px-2.5 py-1 inline-block">
              Audio: STABLE
            </span>
          </div>
        </div>
      </div>

      {/* CONFIRMATION BOTTOM SHEET */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-afri-bg-sec border border-afri-border w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative animate-slideUp">
            <button 
              onClick={() => setSheetOpen(false)}
              className="absolute top-4 right-4 p-2 bg-afri-bg rounded-full text-afri-text-sec hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <h2 className="text-sm font-mono font-black uppercase text-afri-text">Modifier les Commissions</h2>
              <p className="text-xs text-afri-text-sec font-mono mt-1">
                Résumé des changements
              </p>
            </div>

            <div className="space-y-4 bg-afri-bg border border-afri-border p-4 rounded-xl">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-afri-text-sec">Standard :</span>
                <span className="text-red-400 line-through">
                  {(pricing.standardCommissionRate * 100).toFixed(1)} %
                </span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  {(sheetNewStandard * 100).toFixed(1)} %
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-afri-text-sec">Premium :</span>
                <span className="text-red-400 line-through">
                  {(pricing.premiumCommissionRate * 100).toFixed(1)} %
                </span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  {(sheetNewPremium * 100).toFixed(1)} %
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSheetOpen(false)}
                className="flex-1 py-3 bg-afri-bg border border-afri-border rounded-xl text-xs font-mono font-bold text-afri-text-sec hover:text-white"
              >
                ANNULER
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="flex-1 py-3 bg-[#D4AF37] text-black rounded-xl text-xs font-mono font-black uppercase hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? "ENREGISTREMENT..." : "ENREGISTRER"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
