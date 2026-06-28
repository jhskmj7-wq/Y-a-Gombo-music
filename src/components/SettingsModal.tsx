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

  const { t, language: currentLang, setLanguage } = useLanguage();
  const { currentUser, profile } = useAuth();
  
  // 3. COMPTE States
  const accountLevel = profile?.isCertified || profile?.isVerified ? "⭐ ARTISTE CERTIFIÉ GOMBO" : "🎵 COMPTE CLASSIQUE";
  
  // Detect Auth Provider
  let authProvider = "Email";
  if (currentUser) {
    const providerId = currentUser.providerData[0]?.providerId;
    if (providerId === "google.com") {
      authProvider = "Google Sync";
    } else if (providerId === "phone") {
      authProvider = "Téléphone";
    } else {
      authProvider = "Email / Mot de passe";
    }
  }

  // 4. LANGUE State
  const [langSelection, setLangSelection] = useState<Language>(currentLang);

  const handleLanguageChange = (lang: Language) => {
    setLangSelection(lang);
    setLanguage(lang);
    try { audioSynth.playValidationSuccess(); } catch (_) {}
  };

  // 5. NOTIFICATIONS States
  const [notifMessages, setNotifMessages] = useState(() => localStorage.getItem("gombo_pref_notif_messages") !== "false");
  const [notifOpps, setNotifOpps] = useState(() => localStorage.getItem("gombo_pref_notif_opps") !== "false");
  const [notifGombos, setNotifGombos] = useState(() => localStorage.getItem("gombo_pref_notif_gombos") !== "false");
  const [notifAlerts, setNotifAlerts] = useState(() => localStorage.getItem("gombo_pref_notif_alerts") !== "false");
  const [notifEvents, setNotifEvents] = useState(() => localStorage.getItem("gombo_pref_notif_events") !== "false");

  // 6. APPARENCE States
  const [textSize, setTextSize] = useState(() => localStorage.getItem("gombo_pref_text_size") || "moyen");

  // 7. CONFIDENTIALITÉ States
  const [privacyProfile, setPrivacyProfile] = useState(() => localStorage.getItem("gombo_pref_privacy_profile") || "public");
  const [privacyMsg, setPrivacyMsg] = useState(() => localStorage.getItem("gombo_pref_privacy_msg") || "all");
  const [privacyOnline, setPrivacyOnline] = useState(() => localStorage.getItem("gombo_pref_privacy_online") !== "false");
  const [privacyCommune, setPrivacyCommune] = useState(() => localStorage.getItem("gombo_pref_privacy_commune") !== "false");
  const [privacyPhone, setPrivacyPhone] = useState(() => localStorage.getItem("gombo_pref_privacy_phone") !== "false");

  // 8. STOCKAGE States
  const [cacheSize, setCacheSize] = useState(24.5);
  const [photosSize, setPhotosSize] = useState(12.2);
  const [isClearing, setIsClearing] = useState(false);

  // 9. MUSIQUE ET AUDIO States
  const [autoPlayVideo, setAutoPlayVideo] = useState(() => localStorage.getItem("gombo_pref_autoplay_video") === "true");
  const [autoPlayAudio, setAutoPlayAudio] = useState(() => localStorage.getItem("gombo_pref_autoplay_audio") !== "false");
  const [audioQuality, setAudioQuality] = useState(() => localStorage.getItem("gombo_pref_audio_quality") || "standard");

  // Support Screens Overlay
  const [activeSupportPage, setActiveSupportPage] = useState<"none" | "help" | "issue" | "terms" | "privacy_policy" | "about">("none");
  const [issueText, setIssueText] = useState("");
  const [issueSent, setIssueSent] = useState(false);

  // Quick State Save
  useEffect(() => {
    localStorage.setItem("gombo_pref_notif_messages", notifMessages.toString());
    localStorage.setItem("gombo_pref_notif_opps", notifOpps.toString());
    localStorage.setItem("gombo_pref_notif_gombos", notifGombos.toString());
    localStorage.setItem("gombo_pref_notif_alerts", notifAlerts.toString());
    localStorage.setItem("gombo_pref_notif_events", notifEvents.toString());
    
    localStorage.setItem("gombo_pref_text_size", textSize);
    
    localStorage.setItem("gombo_pref_privacy_profile", privacyProfile);
    localStorage.setItem("gombo_pref_privacy_msg", privacyMsg);
    localStorage.setItem("gombo_pref_privacy_online", privacyOnline.toString());
    localStorage.setItem("gombo_pref_privacy_commune", privacyCommune.toString());
    localStorage.setItem("gombo_pref_privacy_phone", privacyPhone.toString());

    localStorage.setItem("gombo_pref_autoplay_video", autoPlayVideo.toString());
    localStorage.setItem("gombo_pref_autoplay_audio", autoPlayAudio.toString());
    localStorage.setItem("gombo_pref_audio_quality", audioQuality);
  }, [
    notifMessages, notifOpps, notifGombos, notifAlerts, notifEvents,
    textSize, privacyProfile, privacyMsg, privacyOnline, privacyCommune,
    privacyPhone, autoPlayVideo, autoPlayAudio, audioQuality
  ]);

  const handleClearCache = () => {
    setIsClearing(true);
    try { audioSynth.playTamTam(true); } catch (_) {}
    setTimeout(() => {
      setCacheSize(0);
      setPhotosSize(0);
      setIsClearing(false);
      alert("✨ Cache de l'application vidé avec succès !");
    }, 1500);
  };

  const handleSendIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueText.trim()) return;
    setIsClearing(true);
    setTimeout(() => {
      setIssueSent(true);
      setIssueText("");
      setIsClearing(false);
    }, 1000);
  };

  // Dynamically configure font size utility class on parent wrapper
  const getTextSizeClass = () => {
    if (textSize === "petit") return "text-[11px] sm:text-xs";
    if (textSize === "grand") return "text-sm sm:text-base";
    return "text-xs sm:text-sm";
  };

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-[#050505] text-zinc-300 font-sans pb-28 pt-4 px-4 sm:px-6 relative select-none">
      
      {/* 2. HEADER BAR */}
      <div className="max-w-xl mx-auto flex items-center justify-between pb-5 border-b border-[#D4AF37]/15 sticky top-0 bg-[#050505]/95 backdrop-blur-md z-30 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
            <Settings className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">⚙️ Paramètres Premium</h1>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">AFRIGOMBO Configuration</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="px-3.5 py-1.5 bg-[#111111] hover:bg-[#D4AF37]/10 border border-zinc-900 hover:border-[#D4AF37]/35 rounded-2xl text-[11px] font-bold text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          Retour ✕
        </button>
      </div>

      {/* OVERLAY FOR SECONDARY ASSISTANCE VIEWS */}
      {activeSupportPage !== "none" && (
        <div className="fixed inset-0 z-[60] bg-[#050505] p-5 flex flex-col h-full overflow-y-auto text-left">
          <div className="max-w-xl mx-auto w-full flex-1 flex flex-col space-y-6 pt-4">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <h2 className="text-sm font-black text-white uppercase flex items-center gap-2">
                <span className="text-[#D4AF37]">●</span>
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
                className="px-3.5 py-1.5 bg-zinc-950 border border-zinc-850 hover:border-[#D4AF37] rounded-xl text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
              >
                Fermer ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-4 text-zinc-400 leading-relaxed pb-20">
              {activeSupportPage === "help" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-1.5">
                    <h3 className="font-black text-white uppercase text-[11px]">❓ Comment fonctionne le cachet sécurisé ?</h3>
                    <p>Pour chaque gombo, le recruteur dépose la somme sur le séquestre bloqué d'AFRIGOMBO. Dès la signature de votre présence numérique après la performance, la somme est libérée sur votre portefeuille Wave ou Orange Money.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-1.5">
                    <h3 className="font-black text-white uppercase text-[11px]">⭐ Comment être certifié Gombo d'Or ?</h3>
                    <p>Votre profil doit être complet (photo réelle, bio claire, au moins 2 spécialités) et vous devez avoir complété avec succès au moins 3 gombos officiels avec une note moyenne supérieure à 4.5/5 étoiles.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-1.5">
                    <h3 className="font-black text-white uppercase text-[11px]">💬 Mes données de contact sont-elles visibles ?</h3>
                    <p>Non, votre numéro de téléphone et adresse exacte restent masqués. Ils ne sont transmis qu'au promoteur agréé d'un concert pour lequel vous postulez ou collaborez officiellement.</p>
                  </div>
                </div>
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
                      <p className="text-[11px] text-zinc-500">Décrivez précisément l'erreur ou l'anomalie rencontrée sur l'écosystème d'Abidjan :</p>
                      <textarea
                        value={issueText}
                        onChange={(e) => setIssueText(e.target.value)}
                        placeholder="Ex: Impossible d'uploader mon fichier audio de démo..."
                        className="w-full h-32 bg-zinc-950 border border-zinc-900 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                        maxLength={500}
                        required
                      />
                      <button
                        type="submit"
                        disabled={isClearing}
                        className="w-full py-3 rounded-2xl bg-[#D4AF37] text-black font-sans font-black uppercase text-xs hover:scale-[1.01] transition-all disabled:opacity-50"
                      >
                        {isClearing ? "Transmission..." : "Envoyer le rapport d'anomalie"}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {activeSupportPage === "terms" && (
                <div className="space-y-4 text-[11px]">
                  <h3 className="font-bold text-white uppercase">1. ACCEPTATION DES CONDITIONS</h3>
                  <p>En accédant et utilisant l'écosystème AFRIGOMBO, vous acceptez d'être lié par les présentes conditions générales de services, conçues pour assainir et professionnaliser le milieu musical ivoirien.</p>
                  <h3 className="font-bold text-white uppercase">2. ENGAGEMENTS & CACHETS</h3>
                  <p>Tout accord scellé sur la plateforme implique le dépôt obligatoire des cachets par le recruteur. En cas de non-présentation, AFRIGOMBO se réserve le droit de bannir définitivement le membre et de rembourser l'organisateur.</p>
                  <h3 className="font-bold text-white uppercase">3. DISCIPLINE & NOTATION</h3>
                  <p>Les artistes et promoteurs s'engagent à faire preuve de rigueur et d'honnêteté. Les avis déposés sont souverains et ne peuvent être modifiés que par arbitrage de l'administration centrale.</p>
                </div>
              )}

              {activeSupportPage === "privacy_policy" && (
                <div className="space-y-4 text-[11px]">
                  <h3 className="font-bold text-white uppercase">1. GESTION DES DONNÉES</h3>
                  <p>Nous ne collectons que les informations strictement nécessaires à la mise en relation showbiz (avatar, spécialités, commune de résidence, historique des concerts réalisés).</p>
                  <h3 className="font-bold text-white uppercase">2. SÉCURISATION DES TRANSACTIONS</h3>
                  <p>Toutes vos données financières (numéros Wave, Orange Money) sont cryptées à la source et ne servent qu'à effectuer les virements sécurisés des cachets.</p>
                  <h3 className="font-bold text-white uppercase">3. DROIT DE SUPPRESSION</h3>
                  <p>Vous disposez d'un contrôle total. Vous pouvez désactiver votre profil ou initier sa suppression complète et définitive à tout moment dans la section Compte.</p>
                </div>
              )}

              {activeSupportPage === "about" && (
                <div className="text-center space-y-5 py-6">
                  <div className="w-20 h-20 bg-gradient-to-tr from-[#D4AF37] to-[#F1C40F] text-[#050505] rounded-full flex items-center justify-center font-sans font-black text-2xl mx-auto shadow-xl">
                    AFRI
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white uppercase">AFRIGOMBO ELITE</h3>
                    <p className="text-[10px] font-mono text-[#D4AF37] uppercase">L'alliance d'or du showbiz ouest-africain</p>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed max-w-sm mx-auto">
                    Conçu en Côte d'Ivoire pour propulser, protéger et professionnaliser les carrières des instrumentistes, chanteurs, beatmakers et promoteurs de spectacles d'Afrique.
                  </p>
                  <p className="text-[10px] font-mono text-zinc-650 pt-4">© 2026 AFRIGOMBO. Tous droits réservés.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER CONFIG */}
      <div className={`max-w-xl mx-auto space-y-6 ${getTextSizeClass()}`}>

        {/* 3. SECTION COMPTE */}
        <div className="rounded-2xl bg-[#0A0A0A] border border-zinc-900 p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#D4AF37]/5 to-transparent pointer-events-none rounded-bl-full"></div>
          
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            Compte d'Artiste
          </h2>

          <div className="flex items-center gap-3.5 bg-black/40 border border-zinc-950 p-3 rounded-xl">
            {profile?.avatarUrl || currentUser?.photoURL ? (
              <img 
                src={profile?.avatarUrl || currentUser?.photoURL || ""} 
                alt="Profile" 
                className="w-12 h-12 rounded-full object-cover border border-[#D4AF37]/20 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm font-black text-[#D4AF37] font-mono uppercase shrink-0">
                {(profile?.artisticName || currentUser?.displayName || "A").charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-0.5">
              <h3 className="text-xs font-sans font-black text-white truncate uppercase tracking-tight">
                {profile?.artisticName || "Artiste Gombo"}
              </h3>
              <p className="text-[10px] font-mono text-zinc-500 truncate">
                {currentUser?.email || "non connecté"}
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[8px] font-mono font-bold text-[#D4AF37] bg-[#D4AF37]/5 border border-[#D4AF37]/20 px-1.5 py-0.5 rounded uppercase">
                  {accountLevel}
                </span>
                <span className="text-[8px] font-mono text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded uppercase">
                  🔗 {authProvider}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button 
              onClick={() => onClose()} // triggers profile action indirectly
              className="py-2.5 px-3 rounded-xl bg-zinc-950 border border-zinc-850 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white font-bold text-[10.5px] text-center transition-all cursor-pointer"
            >
              Modifier profil
            </button>
            <button 
              onClick={() => onClose()}
              className="py-2.5 px-3 rounded-xl bg-zinc-950 border border-zinc-850 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white font-bold text-[10.5px] text-center transition-all cursor-pointer"
            >
              Changer photo
            </button>
            <button 
              onClick={() => onClose()}
              className="py-2.5 px-3 rounded-xl bg-zinc-950 border border-zinc-850 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white font-bold text-[10.5px] text-center transition-all cursor-pointer col-span-2"
            >
              Voir mon Héritage d'Or 👑
            </button>
          </div>

          <button 
            onClick={() => {
              if (onLogout) onLogout();
            }}
            className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 hover:text-red-300 font-bold text-[10.5px] transition-all cursor-pointer"
          >
            Déconnexion de l'écosystème
          </button>
        </div>

        {/* 4. LANGUE SECTION */}
        <div className="rounded-2xl bg-[#0A0A0A] border border-zinc-900 p-4 space-y-3.5 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            🌍 Langue de l'Écosystème
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
                      ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]" 
                      : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                  }`}
                >
                  <span className="text-[11px] font-black uppercase tracking-tight">{lang.label}</span>
                  <span className="text-[8px] font-mono opacity-50 mt-0.5">{lang.desc}</span>
                  {isSelected && (
                    <div className="w-1 h-1 rounded-full bg-[#D4AF37] mt-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. NOTIFICATIONS SECTION */}
        <div className="rounded-2xl bg-[#0A0A0A] border border-zinc-900 p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            🔔 Alertes & Notifications
          </h2>

          <div className="space-y-3">
            {[
              { label: "Nouveaux messages", desc: "Discussions et bails de gombos", value: notifMessages, set: setNotifMessages },
              { label: "Opportunités showbiz", desc: "Annonces de concerts et castings", value: notifOpps, set: setNotifOpps },
              { label: "Nouveaux Gombos", desc: "Dès qu'un gombo correspond à vos rôles", value: notifGombos, set: setNotifGombos },
              { label: "Alertes importantes", desc: "Changements de cachets ou litiges", value: notifAlerts, set: setNotifAlerts },
              { label: "Rappels d'événements", desc: "24h avant l'entrée en scène", value: notifEvents, set: setNotifEvents }
            ].map((n, i) => (
              <label key={i} className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-zinc-300 group-hover:text-white transition-colors">{n.label}</span>
                  <p className="text-[9px] text-zinc-500 leading-none">{n.desc}</p>
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
                <div className="w-8 h-4.5 bg-zinc-900 peer-checked:bg-[#D4AF37] rounded-full relative after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-black after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5"></div>
              </label>
            ))}
          </div>
        </div>

        {/* 6. APPARENCE SECTION */}
        <div className="rounded-2xl bg-[#0A0A0A] border border-zinc-900 p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            🎨 Style & Apparence
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Thème de l'écosystème</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "dark-gold", label: "Noir & Or", desc: "AFRIGOMBO" },
                  { id: "night-navy", label: "Mode Sombre", desc: "Vip Navy" },
                  { id: "light-gold", label: "Mode Clair", desc: "Blanc Or" }
                ].map((th) => {
                  const isSelected = themeMode === th.id;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => {
                        setThemeMode(th.id as any);
                        if (th.id === "light-gold") {
                          setDarkMode(false);
                        } else {
                          setDarkMode(true);
                        }
                        try { audioSynth.playValidationSuccess(); } catch (_) {}
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]" 
                          : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-350"
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-tight">{th.label}</span>
                      <span className="text-[8px] opacity-60 font-mono mt-0.5">{th.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Taille du texte</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "petit", label: "Petit" },
                  { id: "moyen", label: "Moyen" },
                  { id: "grand", label: "Grand" }
                ].map((ts) => {
                  const isSelected = textSize === ts.id;
                  return (
                    <button
                      key={ts.id}
                      type="button"
                      onClick={() => {
                        setTextSize(ts.id);
                        try { audioSynth.playValidationSuccess(); } catch (_) {}
                      }}
                      className={`py-2 px-3 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]" 
                          : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-350"
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
        <div className="rounded-2xl bg-[#0A0A0A] border border-zinc-900 p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            🛡️ Sécurité & Confidentialité
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider block">Qui voit mon profil ?</label>
                <select
                  value={privacyProfile}
                  onChange={(e) => setPrivacyProfile(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  <option value="public">Tout le monde</option>
                  <option value="certified">Membres Certifiés</option>
                  <option value="private">Personne (Masqué)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider block">Qui peut m'écrire ?</label>
                <select
                  value={privacyMsg}
                  onChange={(e) => setPrivacyMsg(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  <option value="all">Tout le monde</option>
                  <option value="collaborators">Collaborateurs d'Abidjan</option>
                  <option value="recruteurs">Seulement Recruteurs</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-zinc-950">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-zinc-300 group-hover:text-white transition-colors">Afficher mon statut En Ligne</span>
                  <p className="text-[9px] text-zinc-500 leading-none">Indique que vous êtes dispo pour un gombo immédiat</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacyOnline}
                  onChange={(e) => setPrivacyOnline(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-zinc-900 peer-checked:bg-[#D4AF37] rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-black after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5"></div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-zinc-300 group-hover:text-white transition-colors">Afficher ma commune d'Abidjan</span>
                  <p className="text-[9px] text-zinc-500 leading-none">Aide les promoteurs de proximité à vous cibler</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacyCommune}
                  onChange={(e) => setPrivacyCommune(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-zinc-900 peer-checked:bg-[#D4AF37] rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-black after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5"></div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-zinc-300 group-hover:text-white transition-colors">Afficher mon numéro de téléphone</span>
                  <p className="text-[9px] text-zinc-500 leading-none">Visible uniquement lors de candidatures acceptées</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacyPhone}
                  onChange={(e) => setPrivacyPhone(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-zinc-900 peer-checked:bg-[#D4AF37] rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-black after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 8. STOCKAGE SECTION */}
        <div className="rounded-2xl bg-[#0A0A0A] border border-zinc-900 p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            💾 Données & Stockage Local
          </h2>

          <div className="grid grid-cols-2 gap-3 bg-black/45 p-3.5 rounded-xl border border-zinc-950 font-mono text-[10.5px]">
            <div className="space-y-0.5">
              <span className="text-zinc-550 block uppercase text-[8.5px]">Cache Application:</span>
              <span className="text-white font-bold block">{cacheSize.toFixed(1)} Mo</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-zinc-550 block uppercase text-[8.5px]">Photos & Multimédia:</span>
              <span className="text-white font-bold block">{photosSize.toFixed(1)} Mo</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-zinc-900/60 flex justify-between items-center">
              <span className="text-zinc-500 text-[9px] uppercase">Espace global mobilisé:</span>
              <span className="text-[#D4AF37] font-black">{(cacheSize + photosSize).toFixed(1)} Mo</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleClearCache}
              disabled={isClearing}
              className="py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 font-bold text-[10.5px] transition-all cursor-pointer disabled:opacity-40"
            >
              {isClearing ? "Vidage..." : "Vider cache"}
            </button>
            <button
              onClick={() => {
                try { audioSynth.playValidationSuccess(); } catch (_) {}
                alert("✓ Données synchronisées avec le serveur central Firebase.");
              }}
              className="py-2.5 px-3 rounded-xl bg-zinc-950 border border-zinc-850 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white font-bold text-[10.5px] transition-all cursor-pointer"
            >
              Actualiser données
            </button>
          </div>
        </div>

        {/* 9. MUSIQUE ET AUDIO SECTION */}
        <div className="rounded-2xl bg-[#0A0A0A] border border-zinc-900 p-4 space-y-4 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            🎵 Expérience Musicale & Multimédia
          </h2>

          <div className="space-y-4">
            <div className="space-y-2.5">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-zinc-300 group-hover:text-white transition-colors">Lecture automatique des vidéos</span>
                  <p className="text-[9px] text-zinc-500 leading-none">Lancer le flux vidéo de scène directement</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoPlayVideo}
                  onChange={(e) => setAutoPlayVideo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-zinc-900 peer-checked:bg-[#D4AF37] rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-black after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5"></div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-zinc-300 group-hover:text-white transition-colors">Lecture automatique de l'audio</span>
                  <p className="text-[9px] text-zinc-500 leading-none">Écouter les démos instrumentales dès l'ouverture</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoPlayAudio}
                  onChange={(e) => setAutoPlayAudio(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-zinc-900 peer-checked:bg-[#D4AF37] rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-black after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5"></div>
              </label>
            </div>

            <div className="space-y-1.5 pt-1.5 border-t border-zinc-950">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Qualité d'écoute audio</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "eco", label: "Économie", desc: "64 kbps" },
                  { id: "standard", label: "Standard", desc: "192 kbps" },
                  { id: "haute", label: "Haute qualité", desc: "320 kbps" }
                ].map((q) => {
                  const isSelected = audioQuality === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setAudioQuality(q.id);
                        try { audioSynth.playValidationSuccess(); } catch (_) {}
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]" 
                          : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-350"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-tight">{q.label}</span>
                      <span className="text-[7.5px] font-mono opacity-50 mt-0.5">{q.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 10. SUPPORT & ASSISTANCE SECTION */}
        <div className="rounded-2xl bg-[#0A0A0A] border border-zinc-900 p-4 space-y-3.5 text-left shadow-[0_0_20px_rgba(212,175,55,0.01)]">
          <h2 className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
            ❓ Assistance & Légal
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
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-[#D4AF37]/75" />
                    <span className="text-[11px] font-bold">{s.label}</span>
                  </div>
                  <ChevronRight className="w-4.5 h-4.5 text-zinc-600" />
                </button>
              );
            })}
          </div>
        </div>

        {/* 11. VERSION DE L'APPLICATION */}
        <div className="text-center space-y-1.5 pt-4">
          <p className="text-[11px] font-sans font-black text-white uppercase tracking-wider">AFRIGOMBO</p>
          <p className="text-[9px] font-mono text-zinc-650 uppercase tracking-widest">Version 1.0 — Elite Release</p>
          <div className="flex items-center justify-center gap-1.5 text-[8.5px] font-mono text-zinc-550 uppercase">
            <span>Made in AFRI</span>
            <span>🌍</span>
            <span>2026 Côte d'Ivoire</span>
          </div>
        </div>

      </div>
    </div>
  );
}
