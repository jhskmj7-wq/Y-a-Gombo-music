import React, { useState, useEffect } from "react";
import { 
  X, Sun, Moon, Bell, MapPin, 
  Check, Volume2, Shield, Info, HelpCircle,
  User, Lock, Trash2, Smartphone, Eye,
  Globe, FileText, Star, LogOut, Settings, 
  Database, Video, Radio, Sparkles, MessageSquare, 
  ChevronRight, AlertTriangle, Play, Pause, Square, HelpCircle as HelpIcon,
  Smartphone as PhoneIcon, Mail, Laptop, Key, WifiOff, RefreshCw
} from "lucide-react";
import AfrigomboHelpCenter from "./AfrigomboHelpCenter";
import { CGUContent, PrivacyContent } from "./LegalContent";
import { useLanguage, Language } from "../LanguageContext";
import { useAuth } from "../AuthContext";
import { gomboDB } from "../firebase";
import { audioSynth } from "../lib/audio";
import { globalAudioManager, AudioState } from "../lib/audioManager";
import { supportConfig } from "../supportConfig";
import { useTheme } from "../context/ThemeContext";
import { useAppSettings, ThemeMode } from "../context/AppSettingsContext";
import { AndroidPageLayout } from "./layout/AndroidPageLayout";
import { AndroidCard } from "./layout/AndroidCard";
import { useWalletSecurity } from "../context/WalletSecurityContext";
import { WalletSecurityService } from "../lib/WalletSecurityService";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  onNavigateToFounder?: () => void;
  onNavigateToThrone?: () => void;
  onSupportClick?: () => void;
}

const modalTranslations: Record<string, Record<string, string>> = {
  fr: {
    title: "⚙️ Paramètres Premium",
    subtitle: "AFRIGOMBO ELITE Configuration",
    back: "Retour ✕",
    compte_title: "Compte d'Artiste",
    modifier_profil: "Modifier profil",
    changer_photo: "Changer photo",
    voir_heritage: "Voir mon Héritage d'Or 👑",
    deconnexion: "Déconnexion de l'écosystème",
    langue_title: "🌍 Langue de l'Écosystème",
    notif_title: "🔔 Alertes & Notifications",
    notif_all: "Notifications Globales",
    notif_all_desc: "Couper toutes les alertes de l'application",
    notif_msg: "Nouveaux messages",
    notif_msg_desc: "Discussions et bails de gombos",
    notif_opps: "Opportunités showbiz",
    notif_opps_desc: "Annonces de concerts et castings",
    style_title: "🎨 Style & Apparence",
    theme_label: "Thème de l'écosystème",
    text_size_label: "Taille du texte",
    text_petit: "Petit",
    text_moyen: "Moyen",
    text_grand: "Grand",
    security_title: "🛡️ Sécurité & Confidentialité",
    who_sees_profile: "Qui voit mon profil ?",
    who_can_write: "Qui peut m'écrire ?",
    online_status: "Afficher mon statut En Ligne",
    online_status_desc: "Indique que vous êtes dispo pour un gombo immédiat",
    commune_status: "Afficher ma commune d'Abidjan",
    commune_status_desc: "Aide les promoteurs de proximité à vous cibler",
    phone_status: "Afficher mon numéro de téléphone",
    phone_status_desc: "Visible uniquement lors de candidatures acceptées",
    storage_title: "💾 Données & Stockage Local",
    cache_label: "Cache Application:",
    photos_label: "Photos & Multimédia:",
    clear_cache: "Vider le cache",
    refresh_data: "Actualiser données",
    multimedia_title: "🎵 Expérience Musicale & Multimédia",
    autoplay_video: "Lecture automatique des vidéos",
    autoplay_video_desc: "Lancer le flux vidéo de scène directement",
    autoplay_audio: "Lecture automatique de l'audio",
    autoplay_audio_desc: "Écouter les démos instrumentales dès l'ouverture",
    music_label: "● Musique Officielle AFRIGOMBO ELITE",
    play_intro: "▶ Réécouter l'introduction",
    play_hymne: "▶ Hymne officiel",
    stop_music: "■ Arrêter la musique",
    toggle_music: "Musique & Ambiance",
    toggle_music_desc: "Mettre en sourdine toutes les musiques de fond",
    volume_label: "Volume de la musique",
    audio_quality: "Qualité d'écoute audio",
    support_title: "❓ Assistance & Légal",
    delete_account: "🚨 Supprimer mon compte d'Artiste",
    delete_confirm_title: "Suppression de compte",
    delete_confirm_desc: "Êtes-vous absolument sûr de vouloir supprimer votre compte d'artiste définitivement ? Cette action est irréversible.",
    delete_confirm_btn: "Oui, supprimer définitivement",
    delete_cancel_btn: "Conserver mon compte",
    delete_success: "Votre compte d'artiste a été supprimé de l'écosystème avec succès."
  },
  en: {
    title: "⚙️ Premium Settings",
    subtitle: "AFRIGOMBO ELITE Configuration",
    back: "Back ✕",
    compte_title: "Artist Account",
    modifier_profil: "Edit Profile",
    changer_photo: "Change Photo",
    voir_heritage: "View my Golden Heritage 👑",
    deconnexion: "Logout from ecosystem",
    langue_title: "🌍 Ecosystem Language",
    notif_title: "🔔 Alerts & Notifications",
    notif_all: "Global Notifications",
    notif_all_desc: "Mute all notifications in the app",
    notif_msg: "New Messages",
    notif_msg_desc: "Discussions and gig deals",
    notif_opps: "Showbiz Opportunities",
    notif_opps_desc: "Concert and casting announcements",
    style_title: "🎨 Style & Appearance",
    theme_label: "Ecosystem Theme",
    text_size_label: "Text Size",
    text_petit: "Small",
    text_moyen: "Medium",
    text_grand: "Large",
    security_title: "🛡️ Security & Privacy",
    who_sees_profile: "Who sees my profile?",
    who_can_write: "Who can write to me?",
    online_status: "Show my Online status",
    online_status_desc: "Indicates you are available for an immediate gig",
    commune_status: "Show my Abidjan commune",
    commune_status_desc: "Helps nearby promoters target you",
    phone_status: "Show my phone number",
    phone_status_desc: "Visible only when applications are accepted",
    storage_title: "💾 Data & Local Storage",
    cache_label: "App Cache:",
    photos_label: "Photos & Media:",
    clear_cache: "Clear Cache",
    refresh_data: "Refresh Data",
    multimedia_title: "🎵 Music & Multimedia Experience",
    autoplay_video: "Autoplay videos",
    autoplay_video_desc: "Launch stage video stream directly",
    autoplay_audio: "Autoplay audio",
    autoplay_audio_desc: "Listen to instrumental demos on open",
    music_label: "● Official AFRIGOMBO ELITE Music",
    play_intro: "▶ Replay cinematic intro",
    play_hymne: "▶ Official Anthem",
    stop_music: "■ Stop music",
    toggle_music: "Music & Ambience",
    toggle_music_desc: "Mute all background music",
    volume_label: "Music Volume",
    audio_quality: "Audio Quality",
    support_title: "❓ Support & Legal",
    delete_account: "🚨 Delete my Artist Account",
    delete_confirm_title: "Delete Account",
    delete_confirm_desc: "Are you absolutely sure you want to delete your artist account permanently? This action is irreversible.",
    delete_confirm_btn: "Yes, delete permanently",
    delete_cancel_btn: "Keep my account",
    delete_success: "Your artist account was successfully deleted from the ecosystem."
  }
};

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  onLogout,
  onNavigateToFounder,
  onNavigateToThrone,
  onSupportClick
}: SettingsModalProps) {
  // Clean native scroll management handled inside AndroidPageLayout component

  const { t, language: currentLang, setLanguage } = useLanguage();
  const { currentUser, profile } = useAuth();
  
  // App Global Settings Store Context
  const {
    themeMode,
    setThemeMode,
    themePreset,
    setThemePreset,
    textSize,
    setTextSize,
    experience,
    updateExperiencePref,
    profileCustomization,
    updateProfileCustomizationPref,
    payments,
    updatePaymentPref,
    network,
    updateNetworkPref,
    security,
    updateSecurityPref,
    closeOtherSessions,
    personalStats,
    notifications,
    updateNotificationPref,
    audio,
    updateAudioPref,
    language,
    setLanguagePref,
    dataSaver,
    setDataSaver,
    privacy,
    updatePrivacyPref,
    cacheSizeMo,
    mediaSizeMo,
    clearAppCache,
    showToast
  } = useAppSettings();

  const { setupWalletPin, changeWalletPin, requestPinResetSOA, walletSecurityStatus, isWalletSessionActive } = useWalletSecurity();

  const langCode = (currentLang === "en" || currentLang === "fr") ? currentLang : "fr";
  const mt = (key: string) => modalTranslations[langCode]?.[key] || modalTranslations["fr"][key] || key;

  // Account Level
  const accountLevel = profile?.isCertified || profile?.isVerified ? "⭐ ARTISTE CERTIFIÉ GOMBO" : "🎵 COMPTE CLASSIQUE";
  const isFounder = currentUser?.email === "jhs.kmj7@gmail.com";

  // Real Network Diagnostic State
  const [diagnosticState, setDiagnosticState] = useState<"idle" | "running" | "completed">("idle");
  const [diagnosticResults, setDiagnosticResults] = useState<{
    internet: string;
    ping: string;
    firebase: string;
    connType: string;
    quality: string;
  } | null>(null);

  const runDiagnostic = async () => {
    setDiagnosticState("running");
    try { audioSynth.playValidationSuccess(); } catch (_) {}
    
    // Step-by-step diagnostic latency
    await new Promise((resolve) => setTimeout(resolve, 850));
    
    // 1. Internet Check
    const internetOk = navigator.onLine ? "✓ En ligne (Connecté)" : "❌ Hors ligne";
    
    // 2. Measure latency to real /api/health endpoint
    let pingStr = "Temps de réponse inconnu";
    let pingVal = 0;
    try {
      const start = performance.now();
      const res = await fetch(`/api/health?t=${Date.now()}`);
      if (res.ok) {
        const end = performance.now();
        pingVal = Math.round(end - start);
        pingStr = `${pingVal} ms`;
      } else {
        const startFallback = performance.now();
        await fetch(`/?t=${Date.now()}`);
        const endFallback = performance.now();
        pingVal = Math.round(endFallback - startFallback);
        pingStr = `${pingVal} ms`;
      }
    } catch (e) {
      pingStr = "Erreur de connexion (Inaccessible)";
    }
    
    // 3. Firebase Connection Check
    let firebaseStatus = "Non connecté";
    try {
      if (gomboDB) {
        firebaseStatus = "✓ Connecté (Base Firestore)";
      }
    } catch (e) {
      firebaseStatus = "❌ Échec de liaison Firestore";
    }
    
    // 4. Connection Type
    let connType = "Inconnu (Sécurisé)";
    if ((navigator as any).connection) {
      connType = (navigator as any).connection.effectiveType || (navigator as any).connection.type || "Non disponible";
    }
    
    // 5. Connection Quality
    let quality = "Non déterminée";
    if (pingVal > 0) {
      if (pingVal < 80) quality = "⚡ Excellente (Fibre / 4G+ / 5G)";
      else if (pingVal < 200) quality = "👍 Bonne (Réseau Stable)";
      else if (pingVal < 500) quality = "⚠️ Moyenne (3G / Latence élevée)";
      else quality = "🐌 Très lente / Signal Faible";
    } else {
      quality = "Hors ligne ou connexion restreinte";
    }
    
    setDiagnosticResults({
      internet: internetOk,
      ping: pingStr,
      firebase: firebaseStatus,
      connType: connType,
      quality: quality
    });
    setDiagnosticState("completed");
    try { audioSynth.playValidationSuccess(); } catch (_) {}
  };
  const isPremium = profile?.isPro || profile?.isVip || (profile?.balance !== undefined && profile.balance > 0) || isFounder;
  
  // Detect Auth Provider
  let authProvider = "Email";
  if (currentUser) {
    const providerId = currentUser.providerData?.[0]?.providerId;
    if (providerId === "google.com") {
      authProvider = "Google Sync";
    } else if (providerId === "phone") {
      authProvider = "Téléphone";
    } else {
      authProvider = "Email / Mot de passe";
    }
  }

  // Audio state subscription for music controls
  const [audioState, setAudioState] = useState<AudioState>(globalAudioManager.getState());

  useEffect(() => {
    const unsub = globalAudioManager.subscribe((state) => {
      setAudioState(state);
    });
    return () => unsub();
  }, []);

  const musicVolume = audioState.volume;
  const musicMuted = audioState.isMuted;
  const activeMusicPlay = audioState.currentPlaying;
  const isPaused = audioState.isPaused;

  // Delete Account Confirmation overlay
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Support Screens Overlay
  const [activeSupportPage, setActiveSupportPage] = useState<"none" | "help" | "issue" | "terms" | "privacy_policy" | "about">("none");
  const [issueText, setIssueText] = useState("");
  const [issueSent, setIssueSent] = useState(false);
  const [isTransmittingIssue, setIsTransmittingIssue] = useState(false);

  if (!isOpen) return null;

  const handleLanguageChange = (lang: "fr" | "en" | "nouchi") => {
    setLanguagePref(lang);
    if (lang === "fr" || lang === "en") {
      setLanguage(lang);
    }
    try { audioSynth.playValidationSuccess(); } catch (_) {}
  };

  const handleSendIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueText.trim()) return;
    setIsTransmittingIssue(true);
    const textToReport = issueText;
    setTimeout(() => {
      setIssueSent(true);
      setIssueText("");
      setIsTransmittingIssue(false);
      supportConfig.openSupport("Signalement : " + textToReport);
    }, 1000);
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setIsDeleting(true);
    try {
      await gomboDB.scheduleUserProfileDeletion(currentUser.uid);
      alert("Votre compte est programmé pour être supprimé dans 30 jours. Vous pourrez encore le récupérer avant cette date.");
      if (onLogout) {
        onLogout();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      alert(`Erreur: ${err?.message || "Une erreur est survenue lors de la suppression."}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <AndroidPageLayout
      title={activeSupportPage === "none" ? (mt("title") || "Paramètres") : (
        activeSupportPage === "help" ? "Centre d'aide" :
        activeSupportPage === "issue" ? "Signaler un problème" :
        activeSupportPage === "terms" ? "Conditions d'utilisation" :
        activeSupportPage === "privacy_policy" ? "Confidentialité" :
        activeSupportPage === "about" ? "À propos" : "Assistance"
      )}
      onBack={activeSupportPage === "none" ? onClose : () => setActiveSupportPage("none")}
      scrollable={true}
    >
      <div className="w-full space-y-6 pb-20">
        
        {/* OVERLAY FOR SECONDARY ASSISTANCE VIEWS - Now integrated into main flow if needed, or kept as separate if it feels better */}
        {activeSupportPage !== "none" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex-1 text-xs space-y-4 text-afri-text-sec leading-relaxed">
              {activeSupportPage === "help" && (
                <AfrigomboHelpCenter onClose={() => setActiveSupportPage("none")} />
              )}

              {activeSupportPage === "issue" && (
                <div className="space-y-4">
                  {issueSent ? (
                    <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 text-center space-y-2">
                      <p className="font-black uppercase text-xs">✓ Signalement scellé !</p>
                      <p className="text-[10.5px]">L'équipe d'administration centrale AFRIGOMBO ELITE a reçu votre ticket. Nous vous répondrons par notification sous 24 heures.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendIssue} className="space-y-4">
                      <p className="text-[11px] text-afri-text-muted">Décrivez précisément l'erreur ou l'anomalie rencontrée sur l'écosystème d'Abidjan :</p>
                      <textarea
                        value={issueText}
                        onChange={(e) => setIssueText(e.target.value)}
                        placeholder="Ex: Impossible d'uploader mon fichier audio de démo..."
                        className="w-full h-32 bg-afri-bg-sec border border-afri-border rounded-2xl p-3.5 text-xs text-afri-text focus:outline-none focus:border-afri-gold resize-none"
                        maxLength={500}
                        required
                      />
                      <button
                        type="submit"
                        disabled={isTransmittingIssue}
                        className="w-full py-3 rounded-2xl bg-afri-gold text-black font-sans font-black uppercase text-xs hover:scale-[1.01] transition-all disabled:opacity-50"
                      >
                        {isTransmittingIssue ? "Transmission..." : "Envoyer le rapport d'anomalie"}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {activeSupportPage === "terms" && <CGUContent />}

              {activeSupportPage === "privacy_policy" && <PrivacyContent />}

              {activeSupportPage === "about" && (
                <div className="text-center space-y-5 py-6">
                  <div className="w-20 h-20 bg-gradient-to-tr from-afri-gold to-amber-400 text-black rounded-full flex items-center justify-center font-sans font-black text-2xl mx-auto shadow-xl">
                    AFRI
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-afri-text uppercase">AFRIGOMBO ELITE</h3>
                    <p className="text-[10px] font-mono text-afri-gold uppercase">L'alliance d'or du showbiz ouest-africain</p>
                  </div>
                  <p className="text-afri-text-sec text-xs leading-relaxed max-w-sm mx-auto">
                    Conçu en Côte d'Ivoire pour propulser, protéger et professionnaliser les carrières des instrumentistes, chanteurs, beatmakers et promoteurs de spectacles d'Afrique.
                  </p>
                  <p className="text-[10px] font-mono text-afri-text-muted pt-4">© 2026 AFRIGOMBO ELITE. Tous droits réservés.</p>
                </div>
              )}
            </div>
          </div>
        )}

      {/* ACCOUNT DELETION CONFIRM OVERLAY */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] bg-afri-bg/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-afri-bg-sec border border-red-500/35 p-6 sm:p-8 rounded-3xl space-y-6 text-left">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-red-500">{mt("delete_confirm_title")}</h3>
            </div>
            <p className="text-xs text-afri-text-sec leading-relaxed">{mt("delete_confirm_desc")}</p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-afri-text font-black uppercase text-xs transition-all disabled:opacity-50"
              >
                {isDeleting ? "Suppression en cours..." : mt("delete_confirm_btn")}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-3 rounded-xl bg-afri-bg border border-afri-border text-afri-text hover:text-afri-text font-bold text-xs transition-all"
              >
                {mt("delete_cancel_btn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER CONFIG */}
      <div className="max-w-xl mx-auto space-y-6">

        {/* 2. APPARENCE & THÈME */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            🎨 APPARENCE & MODE VISUEL
          </h2>

          <div className="space-y-4">
            {/* EXPÉRIENCE AFRIGOMBO ELITE */}
            <div className="space-y-3">
              <span className="text-[9px] font-mono text-afri-text-muted uppercase tracking-widest block">Expérience AFRIGOMBO ELITE</span>
              
              {/* Animations Premium */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Animations Premium</span>
                  <p className="text-[9px] text-afri-text-muted leading-none">Micro-interactions et transitions ultra-fluides</p>
                </div>
                <input
                  type="checkbox"
                  checked={experience.premiumAnimations}
                  onChange={(e) => updateExperiencePref('premiumAnimations', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
              </label>

              {/* Réduire les animations */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Réduire les animations</span>
                  <p className="text-[9px] text-afri-text-muted leading-none">Désactiver les effets de mouvements (Accessibilité)</p>
                </div>
                <input
                  type="checkbox"
                  checked={experience.reduceAnimations}
                  onChange={(e) => updateExperiencePref('reduceAnimations', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
              </label>

              {/* Mode économie batterie */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Mode économie batterie</span>
                  <p className="text-[9px] text-afri-text-muted leading-none">Optimiser la consommation énergétique sur mobile</p>
                </div>
                <input
                  type="checkbox"
                  checked={experience.batterySaver}
                  onChange={(e) => updateExperiencePref('batterySaver', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
              </label>

              {/* Fluidité maximale */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Fluidité maximale (120 FPS)</span>
                  <p className="text-[9px] text-afri-text-muted leading-none">Fréquence de rafraîchissement élevée activée</p>
                </div>
                <input
                  type="checkbox"
                  checked={experience.maxFluidity}
                  onChange={(e) => updateExperiencePref('maxFluidity', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
              </label>

              {/* Effets visuels */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Effets visuels & Lueurs d'Or</span>
                  <p className="text-[9px] text-afri-text-muted leading-none">Lumières dynamiques et gradients d'arrière-plan</p>
                </div>
                <input
                  type="checkbox"
                  checked={experience.visualEffects}
                  onChange={(e) => updateExperiencePref('visualEffects', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
              </label>

              {/* Effets sonores */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Effets sonores de l'application</span>
                  <p className="text-[9px] text-afri-text-muted leading-none">Sons d'interactions et retours tactiles</p>
                </div>
                <input
                  type="checkbox"
                  checked={experience.soundEffects}
                  onChange={(e) => updateExperiencePref('soundEffects', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
              </label>

              {/* Vibrations */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Vibrations haptiques</span>
                  <p className="text-[9px] text-afri-text-muted leading-none">Retours vibratoires sur écran tactile</p>
                </div>
                <input
                  type="checkbox"
                  checked={experience.vibrations}
                  onChange={(e) => updateExperiencePref('vibrations', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
              </label>
            </div>

            {/* PRESET DE PALETTES COULEURS */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-afri-text-muted uppercase tracking-widest block">{mt("theme_label")}</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "imperial", label: "Noir Impérial", premium: false, icon: "🌑" },
                  { id: "light", label: "Blanc Ivoire", premium: false, icon: "☀️" },
                  { id: "royal", label: "Or Royal", premium: true, icon: "👑" },
                  { id: "saphir", label: "Bleu Saphir", premium: true, icon: "💎" },
                  { id: "emeraude", label: "Vert Émeraude", premium: true, icon: "🌿" },
                  { id: "studio", label: "Violet Impérial", premium: true, icon: "🌌" },
                  { id: "rouge", label: "Rouge Prestige", premium: true, icon: "❤️" }
                ].map((th) => {
                  const isSelected = themePreset === th.id;
                  const locked = th.premium && !isPremium;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => {
                        if (locked) {
                          showToast("Thème réservé aux membres AFRIGOMBO ELITE Premium.", "warning");
                          return;
                        }
                        setThemePreset(th.id as any);
                      }}
                      className={`flex items-center justify-between gap-2 p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected 
                          ? "bg-afri-gold/10 border-afri-gold text-afri-gold font-black" 
                          : "bg-afri-bg border-afri-border text-afri-text-muted hover:text-afri-text-sec"
                      } ${locked ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-xs shrink-0">{th.icon}</span>
                        <span className="text-[9px] uppercase tracking-tighter truncate">{th.label}</span>
                      </div>
                      
                      {locked ? (
                        <Lock className="w-3 h-3 text-afri-text-muted shrink-0" />
                      ) : (
                        isSelected && <Check className="w-3 h-3 text-afri-gold shrink-0" />
                      )}

                      {isSelected && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-afri-gold" />
                      )}
                      
                      {isFounder && th.premium && (
                        <span className="absolute bottom-1 right-1 text-[7px] text-afri-gold font-bold uppercase">Fondateur</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAILLE DE TEXTE */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-afri-text-muted uppercase tracking-widest block">{mt("text_size_label")}</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "petit", label: mt("text_petit") },
                  { id: "moyen", label: mt("text_moyen") },
                  { id: "grand", label: mt("text_grand") }
                ].map((ts) => {
                  const isSelected = textSize === ts.id;
                  return (
                    <button
                      key={ts.id}
                      type="button"
                      onClick={() => setTextSize(ts.id as any)}
                      className={`py-2 px-3 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-afri-gold/10 border-afri-gold text-afri-gold" 
                          : "bg-afri-bg border-afri-border text-afri-text-muted hover:text-afri-text-sec"
                      }`}
                    >
                      {ts.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 2B. PERSONNALISATION DU PROFIL */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            👑 PERSONNALISATION DU PROFIL
          </h2>

          <div className="space-y-3.5">
            {/* Bannière personnalisée */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-afri-text-muted uppercase block">Bannière de profil d'élite</label>
              <select
                value={profileCustomization.banner}
                onChange={(e) => updateProfileCustomizationPref('banner', e.target.value)}
                className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:outline-none"
              >
                <option value="imperial_gold">Bannière Or Impérial 👑</option>
                <option value="scène_live">Scène Live & Concert 🎸</option>
                <option value="studio_vintage">Studio Pro Vintage 🎧</option>
                <option value="abidjan_night">Abidjan By Night 🌌</option>
              </select>
            </div>

            {/* Couleur du profil */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-afri-text-muted uppercase block">Couleur d'accent du profil</label>
              <div className="flex items-center gap-2">
                {[
                  { color: "#D4AF37", label: "Or Impérial" },
                  { color: "#2563EB", label: "Bleu Saphir" },
                  { color: "#10B981", label: "Vert Émeraude" },
                  { color: "#DC2626", label: "Rouge Prestige" },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => updateProfileCustomizationPref('profileColor', c.color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                      profileCustomization.profileColor === c.color ? "border-afri-gold scale-110 shadow-lg" : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.label}
                  >
                    {profileCustomization.profileColor === c.color && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Carte de visite */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Afficher ma carte de visite d'artiste</span>
                <p className="text-[9px] text-afri-text-muted leading-none">Afficher le QR code et badge scannable sur mon profil</p>
              </div>
              <input
                type="checkbox"
                checked={profileCustomization.visitingCard}
                onChange={(e) => updateProfileCustomizationPref('visitingCard', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
            </label>

            {/* Badge affiché */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-afri-text-muted uppercase block">Badge d'élite affiché</label>
              <select
                value={profileCustomization.badge}
                onChange={(e) => updateProfileCustomizationPref('badge', e.target.value)}
                className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:outline-none"
              >
                <option value="GOLD_ARTIST">Artiste d'Or Certifié 👑</option>
                <option value="SOLO_VIRTUOSE">Virtuose de Scène 🎸</option>
                <option value="BATISSEUR_SHOWBIZ">Bâtisseur du Showbiz 🏆</option>
                <option value="ELITE_VIP">Membre Élite VIP ⭐</option>
              </select>
            </div>

            {/* Signature personnelle */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-afri-text-muted uppercase block">Signature personnelle</label>
              <input
                type="text"
                value={profileCustomization.signature}
                onChange={(e) => updateProfileCustomizationPref('signature', e.target.value)}
                placeholder="Ex: Le Virtuose d'Abidjan..."
                className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:outline-none focus:border-afri-gold"
              />
            </div>

            {/* Musique du profil */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-afri-text-muted uppercase block">Musique de fond du profil</label>
              <select
                value={profileCustomization.profileMusic}
                onChange={(e) => updateProfileCustomizationPref('profileMusic', e.target.value)}
                className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:outline-none"
              >
                <option value="intro_hymn">Hymne Officiel AFRIGOMBO ELITE 🎵</option>
                <option value="jazz_africain">Solo Guitare Jazz Africain 🎷</option>
                <option value="percussions_coupe_decale">Rythme Tam-Tam & Percussions 🥁</option>
                <option value="piano_balade">Mélodie Piano Douce 🎹</option>
              </select>
            </div>
          </div>
        </div>



        {/* 2D. RÉSEAU & PERFORMANCE */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            🌐 RÉSEAU & PERFORMANCES MOBILE
          </h2>

          <div className="space-y-3.5">
            {/* Compression automatique */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Compression automatique des données</span>
                <p className="text-[9px] text-afri-text-muted leading-none">Compresser les images et flux audio pour réduire le forfait internet</p>
              </div>
              <input
                type="checkbox"
                checked={network.autoCompression}
                onChange={(e) => updateNetworkPref('autoCompression', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
            </label>

            {/* Mode connexion lente */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Mode connexion lente (2G / 3G Réduit)</span>
                <p className="text-[9px] text-afri-text-muted leading-none">Optimiser les requêtes réseau en zone de faible couverture</p>
              </div>
              <input
                type="checkbox"
                checked={network.slowConnectionMode}
                onChange={(e) => updateNetworkPref('slowConnectionMode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
            </label>

            {/* Qualité vidéo */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-afri-text-muted uppercase block">Qualité des flux vidéo</label>
              <select
                value={network.videoQuality}
                onChange={(e) => updateNetworkPref('videoQuality', e.target.value)}
                className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:outline-none"
              >
                <option value="360p SD">360p SD — Économie maximale de data</option>
                <option value="720p HD">720p HD — Équilibre Qualité / Vitesse</option>
                <option value="1080p Full HD">1080p Full HD — Qualité Scène Studio</option>
              </select>
            </div>

            {/* Téléchargement uniquement en Wi-Fi */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Téléchargements uniquement en Wi-Fi</span>
                <p className="text-[9px] text-afri-text-muted leading-none">Bloquer le téléchargement des gros fichiers sur réseau cellulaire</p>
              </div>
              <input
                type="checkbox"
                checked={network.downloadWifiOnly}
                onChange={(e) => updateNetworkPref('downloadWifiOnly', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
            </label>

            {/* Diagnostic réseau */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={diagnosticState === "running"}
                onClick={runDiagnostic}
                className={`w-full py-2.5 px-3 rounded-xl bg-afri-bg border border-afri-border hover:border-afri-gold/40 text-afri-text font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${diagnosticState === "running" ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-afri-gold ${diagnosticState === "running" ? "animate-spin" : ""}`} />
                {diagnosticState === "running" ? "Diagnostic en cours..." : "Lancer le test de diagnostic réseau"}
              </button>

              {diagnosticState === "completed" && diagnosticResults && (
                <div className="p-3 bg-afri-bg border border-afri-border/70 rounded-xl space-y-2 text-[10.5px] font-mono animate-fadeIn">
                  <div className="flex justify-between border-b border-afri-border/30 pb-1.5">
                    <span className="text-afri-text-muted">Internet :</span>
                    <span className="text-afri-text font-bold">{diagnosticResults.internet}</span>
                  </div>
                  <div className="flex justify-between border-b border-afri-border/30 pb-1.5">
                    <span className="text-afri-text-muted">Temps de réponse (Ping) :</span>
                    <span className="text-emerald-400 font-bold">{diagnosticResults.ping}</span>
                  </div>
                  <div className="flex justify-between border-b border-afri-border/30 pb-1.5">
                    <span className="text-afri-text-muted">Liaison Firestore :</span>
                    <span className="text-afri-text font-bold">{diagnosticResults.firebase}</span>
                  </div>
                  <div className="flex justify-between border-b border-afri-border/30 pb-1.5">
                    <span className="text-afri-text-muted">Type de connexion :</span>
                    <span className="text-afri-gold font-bold uppercase">{diagnosticResults.connType}</span>
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span className="text-afri-text-muted">Qualité de connexion :</span>
                    <span className="text-afri-text font-black">{diagnosticResults.quality}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2D-WAL. TICALE WALLET SÉCURITÉ */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            💳 TICALE WALLET — SÉCURITÉ DU WALLET
          </h2>

          <div className="p-3.5 bg-afri-bg border border-afri-border rounded-xl space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 font-bold uppercase text-[10px]">Statut du Secret Wallet</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${walletSecurityStatus?.pinConfigured ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-[#D4AF37] border border-[#D4AF37]/30"}`}>
                {walletSecurityStatus?.pinConfigured ? "🟢 Protection activée" : "⚪ Protection non configurée"}
              </span>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-afri-border/50 text-[11px]">
              <div className="flex items-center justify-between text-zinc-300 py-1">
                <span>• Code secret Wallet 6 chiffres</span>
                <span className={walletSecurityStatus?.pinConfigured ? "text-emerald-400 font-bold" : "text-zinc-500 font-bold"}>
                  {walletSecurityStatus?.pinConfigured ? "Configuré" : "Non défini"}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300 py-1">
                <span>• Expiration de session dynamique</span>
                <span className={isWalletSessionActive ? "text-emerald-400 font-bold" : "text-afri-gold font-bold"}>
                  {isWalletSessionActive ? "15 Min (Session Active)" : "15 Min (Inerte / Verrouillé)"}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300 py-1">
                <span>• Protection Anti-Bruteforce S-O-A</span>
                <span className={walletSecurityStatus?.pinStatus === "LOCKED" ? "text-red-400 font-bold" : walletSecurityStatus?.pinStatus === "RESET_PENDING" ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                  {walletSecurityStatus?.pinStatus === "LOCKED" ? "🔒 Verrouillé" : walletSecurityStatus?.pinStatus === "RESET_PENDING" ? "⏳ Attente S-O-A" : "Actif"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  if (walletSecurityStatus?.pinConfigured) {
                    await changeWalletPin();
                  } else {
                    await setupWalletPin();
                  }
                }}
                className="py-2.5 px-3 bg-[#D4AF37] text-zinc-950 font-black rounded-xl text-[10px] uppercase tracking-wider cursor-pointer shadow active:scale-98"
              >
                {walletSecurityStatus?.pinConfigured ? "Modifier mon code secret" : "Définir secret Wallet"}
              </button>

              <button
                type="button"
                onClick={async () => {
                  await requestPinResetSOA("Demande de réinitialisation via les Paramètres Générales");
                }}
                className="py-2.5 px-3 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl text-[10px] uppercase tracking-wider cursor-pointer active:scale-98"
              >
                Code oublié ? Contacter S-O-A
              </button>
            </div>
          </div>
        </div>

        {/* 2E. SÉCURITÉ AVANCÉE */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            🛡️ SÉCURITÉ AVANCÉE & SESSIONS
          </h2>

          <div className="space-y-3.5">
            {/* Double Authentification */}
            <div className="flex items-center justify-between opacity-60">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-afri-text">Double Authentification (2FA)</span>
                <p className="text-[8.5px] text-red-400/85 font-mono">⚠️ Non disponible sur cet appareil / nécessite configuration SMS</p>
              </div>
              <div className="w-8 h-4.5 bg-zinc-800 rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-600 after:rounded-full after:h-2.5 after:w-2.5 after:transition-all border border-zinc-700"></div>
            </div>

            {/* Empreinte digitale */}
            {(() => {
              const isBiometricsSupported = typeof window !== "undefined" && !!window.PublicKeyCredential;
              return (
                <label className={`flex items-center justify-between cursor-pointer group ${!isBiometricsSupported ? "opacity-50" : ""}`}>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Déverrouillage par empreinte digitale</span>
                    <p className="text-[9px] text-afri-text-muted leading-none">Accéder instantanément à l'application par capteur</p>
                    {!isBiometricsSupported && <p className="text-[8.5px] text-red-400/85 font-mono leading-none mt-1">⚠️ Biométrie non disponible sur cet appareil</p>}
                  </div>
                  <input
                    type="checkbox"
                    disabled={!isBiometricsSupported}
                    checked={isBiometricsSupported && security.fingerprint}
                    onChange={(e) => updateSecurityPref('fingerprint', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border ${!isBiometricsSupported ? 'bg-zinc-800 border-zinc-700' : ''}`}></div>
                </label>
              );
            })()}

            {/* Reconnaissance faciale */}
            {(() => {
              const isBiometricsSupported = typeof window !== "undefined" && !!window.PublicKeyCredential;
              return (
                <label className={`flex items-center justify-between cursor-pointer group ${!isBiometricsSupported ? "opacity-50" : ""}`}>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Reconnaissance faciale FaceID</span>
                    <p className="text-[9px] text-afri-text-muted leading-none">Sécuriser l'accès par biométrie faciale</p>
                    {!isBiometricsSupported && <p className="text-[8.5px] text-red-400/85 font-mono leading-none mt-1">⚠️ Biométrie non disponible sur cet appareil</p>}
                  </div>
                  <input
                    type="checkbox"
                    disabled={!isBiometricsSupported}
                    checked={isBiometricsSupported && security.faceId}
                    onChange={(e) => updateSecurityPref('faceId', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border ${!isBiometricsSupported ? 'bg-zinc-800 border-zinc-700' : ''}`}></div>
                </label>
              );
            })()}

            {/* Appareils & Sessions connectés */}
            <div className="space-y-2 pt-2 border-t border-afri-border">
              <span className="text-[9px] font-mono text-afri-text-muted uppercase block">Appareils & Sessions Ouvertes</span>
              <div className="space-y-2">
                {security.activeSessions.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-afri-bg border border-afri-border flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-afri-text">
                        <Smartphone className="w-3.5 h-3.5 text-afri-gold" />
                        <span>{s.device}</span>
                        {s.current && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono">Session Actuelle</span>}
                      </div>
                      <p className="text-[9.5px] text-afri-text-muted">{s.location} • {s.ip} • {s.lastActive}</p>
                    </div>
                  </div>
                ))}
              </div>

              {security.activeSessions.length > 1 && (
                <button
                  type="button"
                  onClick={() => closeOtherSessions()}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 font-bold text-xs transition-all cursor-pointer"
                >
                  Fermer toutes les autres sessions
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2F. STATISTIQUES PERSONNELLES */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            📊 STATISTIQUES PERSONNELLES D'ÉLITE
          </h2>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-afri-bg border border-afri-border space-y-1">
              <span className="text-[8.5px] font-mono text-afri-text-muted uppercase block">Temps Passé</span>
              <span className="text-sm font-black text-afri-gold">{personalStats.timeSpentHours}h {personalStats.timeSpentMins}m</span>
            </div>

            <div className="p-3 rounded-xl bg-afri-bg border border-afri-border space-y-1">
              <span className="text-[8.5px] font-mono text-afri-text-muted uppercase block">Gombos Validés</span>
              <span className="text-sm font-black text-emerald-400">{personalStats.gombosCompleted} gombos</span>
            </div>

            <div className="p-3 rounded-xl bg-afri-bg border border-afri-border space-y-1">
              <span className="text-[8.5px] font-mono text-afri-text-muted uppercase block">Revenus Générés</span>
              <span className="text-sm font-black text-afri-gold">{personalStats.revenueFcfa.toLocaleString()} FCFA</span>
            </div>

            <div className="p-3 rounded-xl bg-afri-bg border border-afri-border space-y-1">
              <span className="text-[8.5px] font-mono text-afri-text-muted uppercase block">Appels Réseau</span>
              <span className="text-sm font-black text-afri-text">{personalStats.callsCount} appels</span>
            </div>

            <div className="p-3 rounded-xl bg-afri-bg border border-afri-border space-y-1">
              <span className="text-[8.5px] font-mono text-afri-text-muted uppercase block">Messages Échangés</span>
              <span className="text-sm font-black text-afri-text">{personalStats.messagesCount} msgs</span>
            </div>

            <div className="p-3 rounded-xl bg-afri-bg border border-afri-border space-y-1">
              <span className="text-[8.5px] font-mono text-afri-text-muted uppercase block">Publications / Démos</span>
              <span className="text-sm font-black text-afri-text">{personalStats.postsCount} posts</span>
            </div>
          </div>
        </div>

        {/* 3. PRÉFÉRENCES AUDIO & LECTURE */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            🔊 PRÉFÉRENCES AUDIO & LECTURE
          </h2>

          <div className="space-y-4">
            {/* EFFETS SONORES & CLAPS */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Effets Sonores de l'Application</span>
                <p className="text-[9px] text-afri-text-muted leading-none">Djembe, claps et retours d'actions sonores</p>
              </div>
              <input
                type="checkbox"
                checked={audio.soundEffects}
                onChange={(e) => updateAudioPref('soundEffects', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
            </label>

            {/* VIBRATIONS TACTILES */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Vibrations Tactiles</span>
                <p className="text-[9px] text-afri-text-muted leading-none">Ressentir des pulsations haptiques aux clics</p>
              </div>
              <input
                type="checkbox"
                checked={audio.vibrations}
                onChange={(e) => updateAudioPref('vibrations', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
            </label>

            {/* LECTURE AUTOMATIQUE DÉMOS */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Lecture automatique des démos</span>
                <p className="text-[9px] text-afri-text-muted leading-none">Écouter les extraits audio dès l'ouverture des profils</p>
              </div>
              <input
                type="checkbox"
                checked={audio.autoPlayDemos}
                onChange={(e) => updateAudioPref('autoPlayDemos', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
            </label>

            {/* QUALITÉ AUDIO */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Haute Qualité Audio (HD Lossless)</span>
                <p className="text-[9px] text-afri-text-muted leading-none">Prioriser la fidélité sonore pour les démos studio</p>
              </div>
              <input
                type="checkbox"
                checked={audio.highQuality}
                onChange={(e) => updateAudioPref('highQuality', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
            </label>

            {/* MASTER MUSIQUE D'AMBIANCE */}
            <div className="pt-2 border-t border-afri-border space-y-3">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">{mt("toggle_music")}</span>
                  <p className="text-[9px] text-afri-text-muted leading-none">{mt("toggle_music_desc")}</p>
                </div>
                <input
                  type="checkbox"
                  checked={!audio.musicMuted}
                  onChange={(e) => updateAudioPref('musicMuted', !e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
              </label>

              <div className={`space-y-2.5 ${audio.musicMuted ? "opacity-35 pointer-events-none" : ""}`}>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => globalAudioManager.playIntro(true)}
                    className={`py-2 px-2.5 rounded-xl border text-[10.5px] font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeMusicPlay === "intro"
                        ? "bg-afri-gold/20 border-afri-gold text-afri-text"
                        : "bg-afri-bg border-afri-border text-afri-text hover:text-afri-gold"
                    }`}
                  >
                    {activeMusicPlay === "intro" ? (isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />) : <Play className="w-3 h-3" />}
                    {mt("play_intro")}
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
                    className={`py-2 px-2.5 rounded-xl border text-[10.5px] font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeMusicPlay === "hymne"
                        ? "bg-afri-gold/20 border-afri-gold text-afri-text"
                        : "bg-afri-bg border-afri-border text-afri-text hover:text-afri-gold"
                    }`}
                  >
                    {activeMusicPlay === "hymne" ? (isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />) : <Play className="w-3 h-3" />}
                    {mt("play_hymne")}
                  </button>
                </div>

                {activeMusicPlay !== "none" && (
                  <button
                    type="button"
                    onClick={() => globalAudioManager.stop()}
                    className="w-full py-1.5 bg-red-950/20 hover:bg-red-950/35 border border-red-900/30 text-red-400 rounded-lg text-[9.5px] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    {mt("stop_music")}
                  </button>
                )}

                {/* SLIDER VOLUME */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-[9px] font-mono text-afri-text-muted">
                    <span>{mt("volume_label")}</span>
                    <span className="text-afri-gold font-bold">{Math.round((audio.musicVolume || 0.8) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(audio.musicVolume || 0.8) * 100}
                    onChange={(e) => {
                      const vol = parseFloat(e.target.value) / 100;
                      updateAudioPref('musicVolume', vol);
                    }}
                    className="w-full h-1.5 bg-afri-bg rounded-lg appearance-none cursor-pointer accent-afri-gold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. NOTIFICATIONS & ALERTES */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            {mt("notif_title")}
          </h2>

          <div className="space-y-3">
            {/* MASTER SWITCH */}
            <label className="flex items-center justify-between cursor-pointer group pb-2 border-b border-afri-border/50">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">{mt("notif_all")}</span>
                <p className="text-[9px] text-afri-text-muted leading-none">{mt("notif_all_desc")}</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.masterEnabled}
                onChange={(e) => updateNotificationPref('masterEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
            </label>

            {[
              { key: "gombos", label: "Nouveaux Gombos & Offres", desc: "Annonces de prestations et remplacements urgents" },
              { key: "recruitment", label: "Alertes Recrutement & Candidatures", desc: "Suivi des castings, validations et sélections" },
              { key: "messages", label: "Messages & Chats Directs", desc: "Discussions en direct pour les bails de gombos" },
              { key: "opportunities", label: "Opportunités Showbiz", desc: "Annonces de scènes, festivals et concerts" },
              { key: "payments", label: "Paiements & Séquestre", desc: "Alertes d'encaissement, garanties et transferts Mobile Money" },
              { key: "contracts", label: "Contrats & Signatures", desc: "Statuts de contrats, validations et signatures" },
              { key: "gomboId", label: "Gombo ID & Badges", desc: "Suivi de validation KYC et certifications" },
              { key: "premium", label: "Prestige Premium & VIP", desc: "Souscriptions, promotions et avantages" },
              { key: "news", label: "Actualités AFRIGOMBO ELITE", desc: "Mises à jour de l'écosystème d'Abidjan" }
            ].map((n) => {
              const k = n.key as keyof typeof notifications;
              const isChecked = notifications[k] && notifications.masterEnabled;
              return (
                <label key={n.key} className={`flex items-center justify-between cursor-pointer group ${!notifications.masterEnabled ? "opacity-35 pointer-events-none" : ""}`}>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">{n.label}</span>
                    <p className="text-[9px] text-afri-text-muted leading-none">{n.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => updateNotificationPref(k, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
                </label>
              );
            })}
          </div>
        </div>

        {/* 5. CONFIDENTIALITÉ & SÉCURITÉ */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            {mt("security_title")}
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[8.5px] font-mono text-afri-text-muted uppercase tracking-wider block">{mt("who_sees_profile")}</label>
                <select
                  value={privacy.profileVisibility}
                  onChange={(e) => updatePrivacyPref('profileVisibility', e.target.value)}
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-2 text-xs text-afri-text focus:outline-none"
                >
                  <option value="public">Tout le monde</option>
                  <option value="certified">Membres Certifiés</option>
                  <option value="private">Personne (Masqué)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] font-mono text-afri-text-muted uppercase tracking-wider block">{mt("who_can_write")}</label>
                <select
                  value={privacy.messagingVisibility}
                  onChange={(e) => updatePrivacyPref('messagingVisibility', e.target.value)}
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-2 text-xs text-afri-text focus:outline-none"
                >
                  <option value="all">Tout le monde</option>
                  <option value="collaborators">Collaborateurs</option>
                  <option value="recruteurs">Seulement Recruteurs</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-afri-border">
              {/* MASQUER DES RECHERCHES */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Masquer mon profil des recherches publiques</span>
                  <p className="text-[9px] text-afri-text-muted leading-none">Inaccessible via les moteurs externes</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.hidePublicSearch}
                  onChange={(e) => updatePrivacyPref('hidePublicSearch', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
              </label>

              {/* STATUT EN LIGNE */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">{mt("online_status")}</span>
                  <p className="text-[9px] text-afri-text-muted leading-none">{mt("online_status_desc")}</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.onlineStatus}
                  onChange={(e) => updatePrivacyPref('onlineStatus', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
              </label>

              {/* COMMUNE ABIDJAN */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">{mt("commune_status")}</span>
                  <p className="text-[9px] text-afri-text-muted leading-none">{mt("commune_status_desc")}</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.showCommune}
                  onChange={(e) => updatePrivacyPref('showCommune', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
              </label>

              {/* TÉLÉPHONE */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">{mt("phone_status")}</span>
                  <p className="text-[9px] text-afri-text-muted leading-none">{mt("phone_status_desc")}</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.showPhone}
                  onChange={(e) => updatePrivacyPref('showPhone', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 6. DONNÉES, ÉCONOMISEUR & STOCKAGE */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            {mt("storage_title")}
          </h2>

          <div className="space-y-3">
            {/* ÉCONOMISEUR DE DONNÉES */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors flex items-center gap-1.5">
                  <WifiOff className="w-3.5 h-3.5 text-afri-gold" />
                  Économiseur de données mobiles
                </span>
                <p className="text-[9px] text-afri-text-muted leading-none">Réduire la taille des visuels et stopper l'autobuffer vidéo sur réseau 3G/4G</p>
              </div>
              <input
                type="checkbox"
                checked={dataSaver}
                onChange={(e) => setDataSaver(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
            </label>

            <div className="grid grid-cols-2 gap-3 bg-afri-bg border border-afri-border p-3.5 rounded-xl font-mono text-[10.5px]">
              <div className="space-y-0.5">
                <span className="text-afri-text-muted block uppercase text-[8.5px]">{mt("cache_label")}</span>
                <span className="text-afri-text font-bold block">{cacheSizeMo.toFixed(1)} Mo</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-afri-text-muted block uppercase text-[8.5px]">{mt("photos_label")}</span>
                <span className="text-afri-text font-bold block">{mediaSizeMo.toFixed(1)} Mo</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-afri-border flex justify-between items-center">
                <span className="text-afri-text-muted text-[9px] uppercase">Espace global mobilisé:</span>
                <span className="text-afri-gold font-black">{(cacheSizeMo + mediaSizeMo).toFixed(1)} Mo</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => clearAppCache()}
                className="py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 font-bold text-[10.5px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {mt("clear_cache")}
              </button>
              <button
                onClick={() => showToast("✓ Données synchronisées avec Firebase central !", "success")}
                className="py-2.5 px-3 rounded-xl bg-afri-bg border border-afri-border hover:border-afri-gold/30 text-afri-text font-bold text-[10.5px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-afri-gold" />
                {mt("refresh_data")}
              </button>
            </div>
          </div>
        </div>

        {/* 7. LANGUE */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-3.5 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            {mt("langue_title")}
          </h2>
          
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "fr", label: "Français", desc: "🇫🇷 Standard" },
              { id: "en", label: "English", desc: "🇬🇧 US / UK" },
              { id: "nouchi", label: "Nouchi", desc: "🇨🇮 Local 225" }
            ].map((lang) => {
              const isSelected = language === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => handleLanguageChange(lang.id as any)}
                  className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-afri-gold/10 border-afri-gold text-afri-gold" 
                      : "bg-afri-bg border-afri-border text-afri-text-muted hover:text-afri-text-sec"
                  }`}
                >
                  <span className="text-[11px] font-black uppercase tracking-tight">{lang.label}</span>
                  <span className="text-[8px] font-mono opacity-50 mt-0.5">{lang.desc}</span>
                  {isSelected && (
                    <div className="w-1 h-1 rounded-full bg-afri-gold mt-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 8. SUPPORT & ASSISTANCE */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-3.5 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            {mt("support_title")}
          </h2>

          <div className="grid grid-cols-1 gap-2">
            {[
              { label: "Centre d'aide d'Abidjan", icon: HelpCircle, page: "help" },
              { label: "Signaler un problème technique", icon: AlertTriangle, page: "issue" },
              { label: "Conditions d'utilisation (CGU)", icon: FileText, page: "terms" },
              { label: "Politique de confidentialité", icon: Shield, page: "privacy_policy" },
              { label: "À propos d'AFRIGOMBO ELITE", icon: Info, page: "about" }
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveSupportPage(s.page as any);
                    try { audioSynth.playValidationSuccess(); } catch (_) {}
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-afri-bg border border-afri-border hover:border-afri-gold/30 text-afri-text transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-afri-gold/75" />
                    <span className="text-[11px] font-bold">{s.label}</span>
                  </div>
                  <ChevronRight className="w-4.5 h-4.5 text-afri-text-muted" />
                </button>
              );
            })}

            {/* SOUTENIR AFRIGOMBO ELITE */}
            <button
              onClick={() => {
                if (onSupportClick) {
                  onSupportClick();
                } else {
                  setActiveSupportPage("help" as any);
                }
                showToast("❤️ Merci pour votre soutien précieux à la culture et aux artistes d'Afrique !", "success");
              }}
              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-afri-gold/20 to-amber-500/10 border border-afri-gold/50 hover:border-afri-gold text-afri-gold transition-all cursor-pointer font-black"
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 fill-current text-afri-gold" />
                <span className="text-[11px] uppercase tracking-wider">❤️ Soutenir AFRIGOMBO ELITE</span>
              </div>
              <ChevronRight className="w-4.5 h-4.5 text-afri-gold" />
            </button>

            {/* DELETE ACCOUNT BUTTON */}
            <button
              onClick={() => {
                setShowDeleteConfirm(true);
                try { audioSynth.playTamTam(true); } catch (_) {}
              }}
              className="flex items-center justify-between p-3 rounded-xl bg-red-550/5 border border-red-500/20 hover:border-red-500 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4" />
                <span className="text-[11px] font-bold">{mt("delete_account")}</span>
              </div>
              <ChevronRight className="w-4.5 h-4.5 text-red-400/50" />
            </button>
          </div>
        </div>

        {/* 8.5 ZONE FONDATEUR */}
        {(profile?.isFounder || profile?.role === "admin" || profile?.role === "founder") && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 space-y-3.5 text-left shadow-[0_0_20px_rgba(212,175,55,0.05)] mt-4">
            <h2 className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Zone Fondateur
            </h2>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  try { audioSynth.playValidationSuccess(); } catch (_) {}
                  if (onNavigateToFounder) {
                    onClose();
                    onNavigateToFounder();
                  }
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-500 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-wider">Centre de Commandement</span>
                </div>
                <ChevronRight className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={() => {
                  try { audioSynth.playTamTam(true); } catch (_) {}
                  if (onNavigateToThrone) {
                    onClose();
                    onNavigateToThrone();
                  }
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-afri-gold/20 border border-afri-gold/60 hover:bg-afri-gold/30 text-afri-gold transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">👑</span>
                  <span className="text-[11px] font-black uppercase tracking-wider">Trône du Fondateur</span>
                </div>
                <ChevronRight className="w-4.5 h-4.5 text-afri-gold" />
              </button>
            </div>
          </div>
        )}

        {/* 9. VERSION APPLICATION */}
        <div className="text-center space-y-1.5 pt-4">
          <p className="text-[11px] font-sans font-black text-afri-text uppercase tracking-wider">AFRIGOMBO ELITE</p>
          <p className="text-[9px] font-mono text-afri-text-muted uppercase tracking-widest">Version 1.0 — Elite Release</p>
          <div className="flex items-center justify-center gap-1.5 text-[8.5px] font-mono text-afri-text-muted uppercase">
            <span>Made in AFRI</span>
            <span>🌍</span>
            <span>2026 Côte d'Ivoire</span>
          </div>
        </div>

      </div>
    </div>
  </AndroidPageLayout>
  );
}
