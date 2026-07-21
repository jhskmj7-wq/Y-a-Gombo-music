import React, { useState, useEffect } from "react";
import { 
  X, Sun, Moon, Bell, MapPin, 
  Check, Volume2, Shield, Info, HelpCircle,
  User, Lock, Trash2, Smartphone, Eye,
  Globe, FileText, Star, LogOut, Settings, 
  Database, Video, Radio, Sparkles, MessageSquare, 
  ChevronRight, AlertTriangle, Play, HelpCircle as HelpIcon,
  Smartphone as PhoneIcon, Mail, Laptop
} from "lucide-react";
import AfrigomboHelpCenter from "./AfrigomboHelpCenter";
import { CGUContent, PrivacyContent } from "./LegalContent";
import { useLanguage, Language } from "../LanguageContext";
import { useAuth } from "../AuthContext";
import { gomboDB } from "../firebase";
import { audioSynth } from "../lib/audio";
import { playSound } from "../services/audioService";
import { triggerSettingsSaved } from "../services/performanceService";
import { globalAudioManager } from "../lib/audioManager";
import { supportConfig } from "../supportConfig";
import { useTheme } from "../context/ThemeContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
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
    clear_cache: "Vider cache",
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
  onLogout 
}: SettingsModalProps) {
  if (!isOpen) return null;

  const { t, language: currentLang, setLanguage } = useLanguage();
  const { currentUser, profile } = useAuth();
  
  const {
    theme,
    setTheme,
    textSize,
    setTextSize,
    notificationsEnabled,
    setNotificationsEnabled,
    musicEnabled,
    setMusicEnabled,
    soundsEnabled,
    setSoundsEnabled,
    vibrationsEnabled,
    setVibrationsEnabled
  } = useTheme();

  const langCode = (currentLang === "en" || currentLang === "fr") ? currentLang : "fr";
  const mt = (key: string) => modalTranslations[langCode]?.[key] || modalTranslations["fr"][key] || key;

  // Account Level
  const accountLevel = profile?.isCertified || profile?.isVerified ? "⭐ ARTISTE CERTIFIÉ GOMBO" : "🎵 COMPTE CLASSIQUE";
  const isPremium = profile?.isPro || profile?.isVip || (profile?.balance !== undefined && profile.balance > 0);
  
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

  // Language State Selection
  const [langSelection, setLangSelection] = useState<Language>(currentLang);

  const handleLanguageChange = (lang: Language) => {
    setLangSelection(lang);
    setLanguage(lang);
    try { audioSynth.playValidationSuccess(); } catch (_) {}
  };

  // Notification States
  const [notifMessages, setNotifMessages] = useState(() => {
    if (profile?.notificationPrefs?.messages !== undefined) return profile.notificationPrefs.messages;
    return localStorage.getItem("gombo_pref_notif_messages") !== "false";
  });
  const [notifOpps, setNotifOpps] = useState(() => {
    if (profile?.notificationPrefs?.opportunities !== undefined) return profile.notificationPrefs.opportunities;
    return localStorage.getItem("gombo_pref_notif_opps") !== "false";
  });
  const [notifPayments, setNotifPayments] = useState(() => {
    if (profile?.notificationPrefs?.payments !== undefined) return profile.notificationPrefs.payments;
    return localStorage.getItem("gombo_pref_notif_payments") !== "false";
  });
  const [notifContracts, setNotifContracts] = useState(() => {
    if (profile?.notificationPrefs?.contracts !== undefined) return profile.notificationPrefs.contracts;
    return localStorage.getItem("gombo_pref_notif_contracts") !== "false";
  });
  const [notifGomboId, setNotifGomboId] = useState(() => {
    if (profile?.notificationPrefs?.gomboId !== undefined) return profile.notificationPrefs.gomboId;
    return localStorage.getItem("gombo_pref_notif_gombo_id") !== "false";
  });
  const [notifPremium, setNotifPremium] = useState(() => {
    if (profile?.notificationPrefs?.premium !== undefined) return profile.notificationPrefs.premium;
    return localStorage.getItem("gombo_pref_notif_premium") !== "false";
  });
  const [notifNews, setNotifNews] = useState(() => {
    if (profile?.notificationPrefs?.news !== undefined) return profile.notificationPrefs.news;
    return localStorage.getItem("gombo_pref_notif_news") !== "false";
  });

  // Keep state in-sync with profile data when it loads
  useEffect(() => {
    if (profile?.notificationPrefs) {
      const prefs = profile.notificationPrefs;
      if (prefs.messages !== undefined) setNotifMessages(prefs.messages);
      if (prefs.opportunities !== undefined) setNotifOpps(prefs.opportunities);
      if (prefs.payments !== undefined) setNotifPayments(prefs.payments);
      if (prefs.contracts !== undefined) setNotifContracts(prefs.contracts);
      if (prefs.gomboId !== undefined) setNotifGomboId(prefs.gomboId);
      if (prefs.premium !== undefined) setNotifPremium(prefs.premium);
      if (prefs.news !== undefined) setNotifNews(prefs.news);
    }
  }, [profile?.notificationPrefs]);

  // Privacy States
  const [privacyProfile, setPrivacyProfile] = useState(() => localStorage.getItem("gombo_pref_privacy_profile") || "public");
  const [privacyMsg, setPrivacyMsg] = useState(() => localStorage.getItem("gombo_pref_privacy_msg") || "all");
  const [privacyOnline, setPrivacyOnline] = useState(() => localStorage.getItem("gombo_pref_privacy_online") !== "false");
  const [privacyCommune, setPrivacyCommune] = useState(() => localStorage.getItem("gombo_pref_privacy_commune") !== "false");
  const [privacyPhone, setPrivacyPhone] = useState(() => localStorage.getItem("gombo_pref_privacy_phone") !== "false");

  // Storage States
  const [cacheSize, setCacheSize] = useState(24.5);
  const [photosSize, setPhotosSize] = useState(12.2);
  const [isClearing, setIsClearing] = useState(false);

  // Multimedia States
  const [autoPlayVideo, setAutoPlayVideo] = useState(() => localStorage.getItem("gombo_pref_autoplay_video") === "true");
  const [autoPlayAudio, setAutoPlayAudio] = useState(() => localStorage.getItem("gombo_pref_autoplay_audio") !== "false");
  const [audioQuality, setAudioQuality] = useState(() => localStorage.getItem("gombo_pref_audio_quality") || "standard");

  // Audio volume / Muted
  const [musicVolume, setMusicVolume] = useState(() => globalAudioManager.getVolume());
  const [activeMusicPlay, setActiveMusicPlay] = useState<"none" | "intro" | "hymne">("none");

  // Delete Account Confirmation overlay
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Support Screens Overlay
  const [activeSupportPage, setActiveSupportPage] = useState<"none" | "help" | "issue" | "terms" | "privacy_policy" | "about">("none");
  const [issueText, setIssueText] = useState("");
  const [issueSent, setIssueSent] = useState(false);

  // Quick State Save & Firestore Sync
  useEffect(() => {
    localStorage.setItem("gombo_pref_notif_messages", notifMessages.toString());
    localStorage.setItem("gombo_pref_notif_opps", notifOpps.toString());
    localStorage.setItem("gombo_pref_notif_payments", notifPayments.toString());
    localStorage.setItem("gombo_pref_notif_contracts", notifContracts.toString());
    localStorage.setItem("gombo_pref_notif_gombo_id", notifGomboId.toString());
    localStorage.setItem("gombo_pref_notif_premium", notifPremium.toString());
    localStorage.setItem("gombo_pref_notif_news", notifNews.toString());
    
    localStorage.setItem("gombo_pref_privacy_profile", privacyProfile);
    localStorage.setItem("gombo_pref_privacy_msg", privacyMsg);
    localStorage.setItem("gombo_pref_privacy_online", privacyOnline.toString());
    localStorage.setItem("gombo_pref_privacy_commune", privacyCommune.toString());
    localStorage.setItem("gombo_pref_privacy_phone", privacyPhone.toString());

    localStorage.setItem("gombo_pref_autoplay_video", autoPlayVideo.toString());
    localStorage.setItem("gombo_pref_autoplay_audio", autoPlayAudio.toString());
    localStorage.setItem("gombo_pref_audio_quality", audioQuality);

    if (profile?.uid) {
      gomboDB.updateUserProfile(profile.uid, {
        notificationPrefs: {
          messages: notifMessages,
          opportunities: notifOpps,
          payments: notifPayments,
          contracts: notifContracts,
          gomboId: notifGomboId,
          premium: notifPremium,
          news: notifNews,
          masterEnabled: notificationsEnabled
        }
      }).catch(err => console.error("Error saving notification preferences to Firestore:", err));
    }
  }, [
    notifMessages, notifOpps, notifPayments, notifContracts, notifGomboId, notifPremium, notifNews,
    notificationsEnabled,
    privacyProfile, privacyMsg, privacyOnline, privacyCommune,
    privacyPhone, autoPlayVideo, autoPlayAudio, audioQuality,
    profile?.uid
  ]);

  const handleClearCache = () => {
    setIsClearing(true);
    try { audioSynth.playTamTam(true); } catch (_) {}
    setTimeout(() => {
      setCacheSize(0);
      setPhotosSize(0);
      setIsClearing(false);
      alert(langCode === "en" ? "✨ App cache successfully cleared!" : "✨ Cache de l'application vidé avec succès !");
    }, 1500);
  };

  const handleSendIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueText.trim()) return;
    setIsClearing(true);
    const textToReport = issueText;
    setTimeout(() => {
      setIssueSent(true);
      setIssueText("");
      setIsClearing(false);
      supportConfig.openSupport("Signalement : " + textToReport);
    }, 1000);
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setIsDeleting(true);
    try {
      await gomboDB.deleteUserProfile(currentUser.uid);
      alert(mt("delete_success"));
      if (onLogout) {
        onLogout();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
      alert("Error deleting account. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-afri-bg text-afri-text font-sans pb-28 pt-4 px-4 sm:px-6 relative select-none">
      
      {/* 2. HEADER BAR */}
      <div className="max-w-xl mx-auto flex items-center justify-between pb-5 border-b border-afri-border sticky top-0 bg-afri-bg/95 backdrop-blur-md z-30 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-afri-gold/10 border border-afri-gold/20 flex items-center justify-center text-afri-gold">
            <Settings className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-afri-text uppercase tracking-tight">{mt("title")}</h1>
            <p className="text-[10px] font-mono text-afri-text-muted uppercase tracking-wider">{mt("subtitle")}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="px-3.5 py-1.5 bg-afri-bg-sec hover:bg-afri-gold/10 border border-afri-border hover:border-afri-gold/35 rounded-2xl text-[11px] font-bold text-afri-text hover:text-afri-gold transition-all cursor-pointer"
        >
          {mt("back")}
        </button>
      </div>

      {/* OVERLAY FOR SECONDARY ASSISTANCE VIEWS */}
      {activeSupportPage !== "none" && (
        <div className="fixed inset-0 z-[60] bg-afri-bg p-5 flex flex-col h-full overflow-y-auto text-left">
          <div className="max-w-xl mx-auto w-full flex-1 flex flex-col space-y-6 pt-4">
            <div className="flex justify-between items-center border-b border-afri-border pb-4">
              <h2 className="text-sm font-black text-afri-text uppercase flex items-center gap-2">
                <span className="text-afri-gold">●</span>
                {activeSupportPage === "help" && "Centre d'aide"}
                {activeSupportPage === "issue" && "Signaler un problème"}
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
                        disabled={isClearing}
                        className="w-full py-3 rounded-2xl bg-afri-gold text-black font-sans font-black uppercase text-xs hover:scale-[1.01] transition-all disabled:opacity-50"
                      >
                        {isClearing ? "Transmission..." : "Envoyer le rapport d'anomalie"}
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

        {/* 3. SECTION COMPTE */}
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
              onClick={() => onClose()}
              className="py-2.5 px-3 rounded-xl bg-afri-bg border border-afri-border hover:border-afri-gold/30 text-afri-text font-bold text-[10.5px] text-center transition-all cursor-pointer"
            >
              {mt("changer_photo")}
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

        {/* 4. LANGUE SECTION */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-3.5 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            {mt("langue_title")}
          </h2>
          
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "fr", label: "Français", desc: "Standard" },
              { id: "en", label: "English", desc: "US / UK" },
              { id: "es", label: "Español", desc: "Spanish" }
            ].map((lang) => {
              const isSelected = langSelection === lang.id;
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

        {/* 5. NOTIFICATIONS SECTION */}
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
                checked={notificationsEnabled}
                onChange={(e) => {
                  setNotificationsEnabled(e.target.checked);
                  try { audioSynth.playValidationSuccess(); } catch (_) {}
                }}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
            </label>

            {[
              { label: "Messages & Chats", desc: "Discussions en direct pour les bails de gombos", value: notifMessages && notificationsEnabled, set: setNotifMessages },
              { label: "Opportunités Showbiz", desc: "Annonces de scènes, concerts et castings", value: notifOpps && notificationsEnabled, set: setNotifOpps },
              { label: "Paiements & Dépôts", desc: "Alertes d'encaissement, séquestre et transferts", value: notifPayments && notificationsEnabled, set: setNotifPayments },
              { label: "Contrats de Gombos", desc: "Statuts de contrats, validations et signatures", value: notifContracts && notificationsEnabled, set: setNotifContracts },
              { label: "Gombo ID & Badges", desc: "Suivi de validation KYC et certifications", value: notifGomboId && notificationsEnabled, set: setNotifGomboId },
              { label: "Prestige Premium & VIP", desc: "Souscriptions, promotions et cadeaux", value: notifPremium && notificationsEnabled, set: setNotifPremium },
              { label: "Actualités AFRIGOMBO", desc: "Nouvelles fonctionnalités de l'écosystème", value: notifNews && notificationsEnabled, set: setNotifNews }
            ].map((n, i) => (
              <label key={i} className={`flex items-center justify-between cursor-pointer group ${!notificationsEnabled ? "opacity-35 pointer-events-none" : ""}`}>
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">{n.label}</span>
                  <p className="text-[9px] text-afri-text-muted leading-none">{n.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={n.value}
                  onChange={(e) => {
                    n.set(e.target.checked);
                    try { audioSynth.playValidationSuccess(); } catch (_) {}
                  }}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
              </label>
            ))}
          </div>
        </div>

        {/* 6. APPARENCE SECTION */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            APPARENCE
          </h2>

          <div className="space-y-4">
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
                  const isSelected = theme === th.id;
                  const locked = th.premium && !isPremium;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => {
                        if (locked) {
                          alert("Disponible avec AFRIGOMBO Premium.");
                          return;
                        }
                        setTheme(th.id as any);
                        try { audioSynth.playValidationSuccess(); } catch (_) {}
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
                    </button>
                  );
                })}
              </div>
            </div>

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
                      onClick={() => {
                        setTextSize(ts.id as any);
                        try { audioSynth.playValidationSuccess(); } catch (_) {}
                      }}
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

        {/* 7. CONFIDENTIALITÉ SECTION */}
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
                  value={privacyProfile}
                  onChange={(e) => setPrivacyProfile(e.target.value)}
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
                  value={privacyMsg}
                  onChange={(e) => setPrivacyMsg(e.target.value)}
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-2 text-xs text-afri-text focus:outline-none"
                >
                  <option value="all">Tout le monde</option>
                  <option value="collaborators">Collaborateurs</option>
                  <option value="recruteurs">Seulement Recruteurs</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-afri-border">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">{mt("online_status")}</span>
                  <p className="text-[9px] text-afri-text-muted leading-none">{mt("online_status_desc")}</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacyOnline}
                  onChange={(e) => setPrivacyOnline(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">{mt("commune_status")}</span>
                  <p className="text-[9px] text-afri-text-muted leading-none">{mt("commune_status_desc")}</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacyCommune}
                  onChange={(e) => setPrivacyCommune(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">{mt("phone_status")}</span>
                  <p className="text-[9px] text-afri-text-muted leading-none">{mt("phone_status_desc")}</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacyPhone}
                  onChange={(e) => setPrivacyPhone(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 8. STOCKAGE SECTION */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            {mt("storage_title")}
          </h2>

          <div className="grid grid-cols-2 gap-3 bg-afri-bg border border-afri-border p-3.5 rounded-xl font-mono text-[10.5px]">
            <div className="space-y-0.5">
              <span className="text-afri-text-muted block uppercase text-[8.5px]">{mt("cache_label")}</span>
              <span className="text-afri-text font-bold block">{cacheSize.toFixed(1)} Mo</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-afri-text-muted block uppercase text-[8.5px]">{mt("photos_label")}</span>
              <span className="text-afri-text font-bold block">{photosSize.toFixed(1)} Mo</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-afri-border flex justify-between items-center">
              <span className="text-afri-text-muted text-[9px] uppercase">Espace global mobilisé:</span>
              <span className="text-afri-gold font-black">{(cacheSize + photosSize).toFixed(1)} Mo</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleClearCache}
              disabled={isClearing}
              className="py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 font-bold text-[10.5px] transition-all cursor-pointer disabled:opacity-40"
            >
              {isClearing ? "Vidage..." : mt("clear_cache")}
            </button>
            <button
              onClick={() => {
                try { audioSynth.playValidationSuccess(); } catch (_) {}
                alert("✓ Données synchronisées avec le serveur central Firebase.");
              }}
              className="py-2.5 px-3 rounded-xl bg-afri-bg border border-afri-border hover:border-afri-gold/30 text-afri-text font-bold text-[10.5px] transition-all cursor-pointer"
            >
              {mt("refresh_data")}
            </button>
          </div>
        </div>

        {/* 9. MUSIQUE ET AUDIO SECTION */}
        <div className="rounded-2xl bg-afri-bg-sec border border-afri-border p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-afri-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
            {mt("multimedia_title")}
          </h2>

          <div className="space-y-4">
            {/* MASTER AUDIO SWITCH */}
            <label className="flex items-center justify-between cursor-pointer group pb-2 border-b border-afri-border">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">{mt("toggle_music")}</span>
                <p className="text-[9px] text-afri-text-muted leading-none">{mt("toggle_music_desc")}</p>
              </div>
              <input
                type="checkbox"
                checked={musicEnabled}
                onChange={(e) => {
                  setMusicEnabled(e.target.checked);
                  try { audioSynth.playValidationSuccess(); } catch (_) {}
                }}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
            </label>

            {/* SOUNDS CONTROLS */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Effets Sonores & Claps</span>
                <p className="text-[9px] text-afri-text-muted leading-none">Activer les djembe, saxo, et sons d'actions</p>
              </div>
              <input
                type="checkbox"
                checked={soundsEnabled}
                onChange={(e) => {
                  setSoundsEnabled(e.target.checked);
                  try { audioSynth.playValidationSuccess(); } catch (_) {}
                }}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
            </label>

            {/* VIBRATIONS CONTROLS */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-afri-text group-hover:text-afri-gold transition-colors">Vibrations Tactiles</span>
                <p className="text-[9px] text-afri-text-muted leading-none">Ressentir des pulsations à chaque interaction</p>
              </div>
              <input
                type="checkbox"
                checked={vibrationsEnabled}
                onChange={(e) => {
                  setVibrationsEnabled(e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-afri-bg peer-checked:bg-afri-gold rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-afri-bg after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 border border-afri-border"></div>
            </label>

            <div className={`space-y-2.5 pt-2 border-t border-afri-border ${!musicEnabled ? "opacity-35 pointer-events-none" : ""}`}>
              <span className="text-[9px] font-mono text-afri-gold uppercase tracking-widest block font-bold">{mt("music_label")}</span>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    globalAudioManager.playIntro(true);
                    setActiveMusicPlay("intro");
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-[10.5px] font-bold text-center transition-all cursor-pointer ${
                    activeMusicPlay === "intro"
                      ? "bg-afri-gold/20 border-afri-gold text-afri-text"
                      : "bg-afri-bg border-afri-border text-afri-text hover:text-afri-gold"
                  }`}
                >
                  {mt("play_intro")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    globalAudioManager.playHymne();
                    setActiveMusicPlay("hymne");
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-[10.5px] font-bold text-center transition-all cursor-pointer ${
                    activeMusicPlay === "hymne"
                      ? "bg-afri-gold/20 border-afri-gold text-afri-text"
                      : "bg-afri-bg border-afri-border text-afri-text hover:text-afri-gold"
                  }`}
                >
                  {mt("play_hymne")}
                </button>
              </div>

              {activeMusicPlay !== "none" && (
                <button
                  type="button"
                  onClick={() => {
                    globalAudioManager.stopAll();
                    setActiveMusicPlay("none");
                  }}
                  className="w-full py-1.5 bg-red-950/20 hover:bg-red-950/35 border border-red-900/30 text-red-400 rounded-lg text-[9.5px] font-bold uppercase transition-all cursor-pointer"
                >
                  {mt("stop_music")}
                </button>
              )}

              {/* VOLUME SLIDER */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[9px] font-mono text-afri-text-muted">
                  <span>{mt("volume_label")}</span>
                  <span className="text-afri-gold font-bold">{Math.round(musicVolume * 100)}%</span>
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
                  className="w-full h-1.5 bg-afri-bg rounded-lg appearance-none cursor-pointer accent-afri-gold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 10. SUPPORT & ASSISTANCE SECTION */}
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

        {/* 11. VERSION DE L'APPLICATION */}
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
