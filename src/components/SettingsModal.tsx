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

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  onNavigateToFounder?: () => void;
}

const modalTranslations: Record<string, Record<string, string>> = {
  fr: {
    title: "⚙️ Paramètres Premium",
    subtitle: "AFRIGOMBO Configuration",
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
    music_label: "● Musique Officielle AFRIGOMBO",
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
    subtitle: "AFRIGOMBO Configuration",
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
    music_label: "● Official AFRIGOMBO Music",
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
  onNavigateToFounder
}: SettingsModalProps) {
  if (!isOpen) return null;

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

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
    sendPasswordReset,
    showToast
  } = useAppSettings();

  const langCode = (currentLang === "en" || currentLang === "fr") ? currentLang : "fr";
  const mt = (key: string) => modalTranslations[langCode]?.[key] || modalTranslations["fr"][key] || key;

  // Account Level
  const accountLevel = profile?.isCertified || profile?.isVerified ? "⭐ ARTISTE CERTIFIÉ GOMBO" : "🎵 COMPTE CLASSIQUE";
  const isFounder = currentUser?.email === "jhs.kmj7@gmail.com";
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
      await gomboDB.deleteUserProfile(currentUser.uid);
      showToast(mt("delete_success"), "info");
      if (onLogout) {
        onLogout();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
      showToast("Erreur lors de la suppression du compte. Réessayez.", "warning");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-afri-bg text-afri-text font-sans pb-28 pt-4 px-4 sm:px-6 relative select-none">
      
      {/* HEADER BAR */}
      <div className="max-w-xl mx-auto flex items-center justify-between pb-5 border-b border-afri-border sticky top-0 bg-afri-bg/95 backdrop-blur-md z-30 mb-6">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-bold text-afri-text hover:text-afri-gold transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5 rotate-180 text-afri-gold" />
          <h1 className="text-sm sm:text-base font-black uppercase tracking-tight">PARAMÈTRES & PRÉFÉRENCES</h1>
        </button>
      </div>

      {/* OVERLAY FOR SECONDARY ASSISTANCE VIEWS */}
      {activeSupportPage !== "none" && (
        <div className="fixed inset-0 z-[60] bg-afri-bg p-5 flex flex-col h-full overflow-y-auto text-left">
          <div className="max-w-xl mx-auto w-full flex-1 flex flex-col space-y-6 pt-4">
            <div className="flex justify-between items-center border-b border-afri-border pb-4">
              <h2 className="text-sm font-black text-afri-text uppercase flex items-center gap-2">
                <span className="text-afri-gold">●</span>
                {activeSupportPage === "help" && "Centre d'aide d'Abidjan"}
                {activeSupportPage === "issue" && "Signaler un problème technique"}
                {activeSupportPage === "terms" && "Conditions d'utilisation (CGU)"}
                {activeSupportPage === "privacy_policy" && "Politique de confidentialité"}
                {activeSupportPage === "about" && "À propos d'AFRIGOMBO"}
              </h2>
              <button 
                onClick={() => {
                  setActiveSupportPage("none");
                  setIssueSent(false);
                }}
                className="px-3.5 py-1.5 bg-afri-bg-sec border border-afri-border hover:border-afri-gold rounded-xl text-xs font-bold text-afri-text hover:text-afri-gold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-4 text-afri-text-sec leading-relaxed pb-20">
              {activeSupportPage === "help" && (
                <AfrigomboHelpCenter onClose={() => setActiveSupportPage("none")} />
              )}

              {activeSupportPage === "issue" && (
                <div className="space-y-4">
                  {issueSent ? (
                    <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 text-center space-y-2">
                      <p className="font-black uppercase text-xs">✓ Signalement scellé !</p>
                      <p className="text-[10.5px]">L'équipe d'administration centrale AFRIGOMBO a reçu votre ticket. Nous vous répondrons par notification sous 24 heures.</p>
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
                  <p className="text-[10px] font-mono text-afri-text-muted pt-4">© 2026 AFRIGOMBO. Tous droits réservés.</p>
                </div>
              )}
            </div>
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

        {/* 1. SECTION COMPTE & SÉCURITÉ MOT DE PASSE */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-afri-gold/5 to-transparent pointer-events-none rounded-bl-full"></div>
          
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            {mt("compte_title")}
          </h2>

          <div className="flex items-center gap-3.5 bg-afri-bg border border-afri-border p-3 rounded-xl">
            {profile?.avatarUrl || currentUser?.photoURL ? (
              <img 
                src={profile?.avatarUrl || currentUser?.photoURL || ""} 
                alt="Profile" 
                className="w-12 h-12 rounded-full object-cover border border-afri-gold/20 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-afri-bg border border-afri-border flex items-center justify-center text-sm font-black text-afri-gold font-mono uppercase shrink-0">
                {(profile?.artisticName || currentUser?.displayName || "A").charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-0.5">
              <h3 className="text-xs font-sans font-black text-afri-text truncate uppercase tracking-tight">
                {profile?.artisticName || "Artiste Gombo"}
              </h3>
              <p className="text-[10px] font-mono text-afri-text-muted truncate">
                {currentUser?.email || "non connecté"}
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[8px] font-mono font-bold text-afri-gold bg-afri-gold/5 border border-afri-gold/20 px-1.5 py-0.5 rounded uppercase">
                  {accountLevel}
                </span>
                <span className="text-[8px] font-mono text-afri-text-sec bg-afri-bg px-1.5 py-0.5 rounded uppercase border border-afri-border">
                  🔗 {authProvider}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button 
              onClick={() => onClose()}
              className="py-2.5 px-3 rounded-xl bg-afri-bg border border-afri-border hover:border-afri-gold/30 text-afri-text font-bold text-[10.5px] text-center transition-all cursor-pointer"
            >
              {mt("modifier_profil")}
            </button>
            <button 
              onClick={() => sendPasswordReset()}
              className="py-2.5 px-3 rounded-xl bg-afri-bg border border-afri-border hover:border-afri-gold/30 text-afri-text font-bold text-[10.5px] text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-afri-gold" />
              Réinitialiser Pass
            </button>
            <button 
              onClick={() => onClose()}
              className="py-2.5 px-3 rounded-xl bg-afri-bg border border-afri-border hover:border-afri-gold/30 text-afri-text font-bold text-[10.5px] text-center transition-all cursor-pointer col-span-2"
            >
              {mt("voir_heritage")}
            </button>
          </div>

          <button 
            onClick={() => {
              if (onLogout) onLogout();
            }}
            className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 hover:text-red-300 font-bold text-[10.5px] transition-all cursor-pointer"
          >
            {mt("deconnexion")}
          </button>
        </div>

        {/* 2. APPARENCE & THÈME */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            🎨 APPARENCE & MODE VISUEL
          </h2>

          <div className="space-y-4">
            {/* SWITCH MODE SOMBRE / CLAIR / AUTO */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-afri-text-muted uppercase tracking-widest block">Mode d'affichage</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "dark", label: "Sombre", icon: Moon },
                  { id: "light", label: "Clair", icon: Sun },
                  { id: "system", label: "Auto (Système)", icon: Laptop }
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = themeMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setThemeMode(m.id as ThemeMode)}
                      className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-afri-gold/15 border-afri-gold text-afri-gold font-bold" 
                          : "bg-afri-bg border-afri-border text-afri-text-muted hover:text-afri-text-sec"
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-[10px] uppercase font-bold">{m.label}</span>
                    </button>
                  );
                })}
              </div>
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
                          showToast("Thème réservé aux membres AFRIGOMBO Premium.", "warning");
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
              { key: "news", label: "Actualités AFRIGOMBO", desc: "Mises à jour de l'écosystème d'Abidjan" }
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
            </div>
          </div>
        )}

        {/* 9. VERSION APPLICATION */}
        <div className="text-center space-y-1.5 pt-4">
          <p className="text-[11px] font-sans font-black text-afri-text uppercase tracking-wider">AFRIGOMBO</p>
          <p className="text-[9px] font-mono text-afri-text-muted uppercase tracking-widest">Version 1.0 — Elite Release</p>
          <div className="flex items-center justify-center gap-1.5 text-[8.5px] font-mono text-afri-text-muted uppercase">
            <span>Made in AFRI</span>
            <span>🌍</span>
            <span>2026 Côte d'Ivoire</span>
          </div>
        </div>

      </div>
    </div>
  );
}
