import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, Star, Briefcase, Wallet, Users, Target, Heart,
  MessageSquare, Edit3, Share2, Crown, Award, Copy, QrCode, Check, X, ShieldAlert,
  Fingerprint, Flame, ChevronRight, Clock, Shield, Download
} from "lucide-react";
import { UserProfile } from "../types";
import { audioSynth } from "../lib/audio";

interface GomboProfileMainViewProps {
  currentUserProfile: UserProfile;
  onRefreshProfile: () => void;
  onNavigateView: (view: string, tab?: any) => void;
  setPanelView: (panel: "main" | "edit" | "settings" | "support" | "certification") => void;
  availabilityStatus: string;
  handleUpdateAvailabilityStatus: (status: "disponible" | "occupe" | "indisponible") => void;
  updatingAvailability: boolean;
  dynamicGroupsCount: number;
  dynamicFavsCount: number;
  dynamicAppsCount: number;
  myPosts: any[];
  mediaGallery: any[];
  setMediaGallery: (gallery: any[]) => void;
  verifyingIdentity?: boolean;
  kycProgress?: number;
  handleIdentityVerifyUpload?: (file: File) => Promise<void>;
}

export const GomboProfileMainView: React.FC<GomboProfileMainViewProps> = ({
  currentUserProfile,
  onRefreshProfile,
  onNavigateView,
  setPanelView,
  dynamicAppsCount,
  myPosts,
  verifyingIdentity = false,
  kycProgress = 0,
  handleIdentityVerifyUpload,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  if (!currentUserProfile) return null;

  const isKycApproved = currentUserProfile.kycStatus === "approved" || currentUserProfile.isCertified === true || currentUserProfile.isVerified === true;
  
  // Clean, trust-centric Gombo ID resolution
  const gomboId = isKycApproved 
    ? (currentUserProfile.gomboIdNumber || (typeof currentUserProfile.gomboId === "string" ? currentUserProfile.gomboId : currentUserProfile.gomboId?.id) || "GMB-ELITE-ID")
    : "GOMBO ID non attribué";

  const handleCopyId = () => {
    if (!isKycApproved) {
      try { audioSynth.playKoraNote(220.00, 0, 0.1, 0.3); } catch (_) {}
      return;
    }
    try {
      navigator.clipboard.writeText(gomboId);
      setCopiedId(true);
      try { audioSynth.playKoraNote(523.25, 0, 0.1, 0.5); } catch (_) {}
      setTimeout(() => setCopiedId(false), 2000);
    } catch (err) {
      console.warn("Failed to copy:", err);
    }
  };

  const handleShareProfile = () => {
    const text = `Découvrez mon profil artistique certifié sur AFRIGOMBO, Le Temple du Gombo Musical.\n🎼 Mon GOMBO ID : ${gomboId}\nRejoignez l'élite musicale !`;
    try {
      if (navigator.share) {
        navigator.share({
          title: `Profil de ${currentUserProfile.artisticName || "Artiste AFRIGOMBO"}`,
          text: text,
          url: window.location.origin
        }).catch(console.warn);
      } else {
        navigator.clipboard.writeText(text);
        setShareSuccess(true);
        try { audioSynth.playKoraNote(523.25, 0, 0.1, 0.5); } catch (_) {}
        setTimeout(() => setShareSuccess(false), 2500);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleKycFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && handleIdentityVerifyUpload) {
      handleIdentityVerifyUpload(e.target.files[0]);
    }
  };

  const isPremium = currentUserProfile.isPro || currentUserProfile.isVip || currentUserProfile.balance !== undefined;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-xl mx-auto space-y-6 pb-32 pt-2 text-left"
    >
      
      {/* FOUNDER COMMAND CENTER CARD */}
      {currentUserProfile.role === "founder" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-[28px] border-2 border-emerald-500/50 bg-afri-bg p-6 shadow-[0_15px_40px_rgba(16,185,129,0.15)] space-y-4"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Crown className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-[0.2em]">👑 Rang Suprême</span>
              <h3 className="text-lg font-sans font-black text-white uppercase tracking-tight">Centre de Commandement</h3>
            </div>
          </div>
          
          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans text-left">
            Piloter l'ensemble de l'écosystème AFRIGOMBO. Accès exclusif aux serveurs, statistiques globales et modération de haut niveau.
          </p>
          
          <button 
            onClick={() => onNavigateView("dashboard")}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-black text-xs uppercase tracking-[0.1em] rounded-2xl shadow-lg hover:scale-[1.02] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldAlert className="w-4 h-4" />
            Entrer dans le Centre de Commandement
          </button>
        </motion.div>
      )}

      {/* 1. GRANDE CARTE PROFIL PREMIUM (SCREENSHOT STYLE) */}
      <div className="relative overflow-hidden rounded-[28px] border-2 border-afri-gold/35 bg-afri-bg shadow-[0_12px_35px_rgba(0,0,0,0.9)] p-5 xs:p-6 sm:p-7">
        {/* Subtle interior gold light */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-afri-gold/5 blur-[50px] rounded-full pointer-events-none" />

        <div className="flex flex-row items-start gap-4 xs:gap-5 sm:gap-6">
          {/* LEFT: Premium double-ring avatar frame */}
          <div className="relative shrink-0 select-none">
            <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-full border-2 border-afri-gold p-1 bg-afri-bg">
              <div className="w-full h-full rounded-full border border-afri-gold/45 overflow-hidden bg-afri-bg">
                <img 
                  src={currentUserProfile.avatarUrl || currentUserProfile.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                  alt="Artist Avatar" 
                  className="w-full h-full object-cover rounded-full" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150";
                  }}
                />
              </div>
            </div>
            {/* Crown Badge */}
            <div className="absolute -top-1 -right-1 bg-gradient-to-br from-[#7e22ce] to-[#a855f7] border border-afri-gold rounded-full w-6.5 h-6.5 flex items-center justify-center shadow-md">
              <span className="text-[10px] leading-none">👑</span>
            </div>
          </div>

          {/* RIGHT: Stacked Profile Fields */}
          <div className="flex flex-col text-left space-y-2.5 w-full min-w-0">
            {/* Artist Name & badges row */}
            <div className="flex flex-wrap items-center gap-1.5 xs:gap-2">
              <h2 className="text-[16px] xs:text-[18px] sm:text-[22px] font-serif font-black italic tracking-wide uppercase leading-none text-white truncate max-w-[140px] xs:max-w-[180px] sm:max-w-[220px]">
                {currentUserProfile.artisticName || `${currentUserProfile.firstName || "Artiste"} ${currentUserProfile.lastName || ""}`.trim()}
              </h2>
              {currentUserProfile.role === "founder" && (
                <div className="w-full mt-1">
                  <span className="afri-badge afri-badge-gold px-3 py-1 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.15)] inline-flex items-center gap-1.5">
                    👑 Fondateur AFRIGOMBO
                  </span>
                </div>
              )}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-800 bg-afri-bg-sec text-[8px] font-bold text-zinc-400 font-mono shrink-0">
                <Shield className="w-2.5 h-2.5 text-zinc-400" />
                <span>STANDARD</span>
              </span>
              <span className="text-[8px] xs:text-[9px] font-bold font-mono text-afri-gold tracking-tight shrink-0">
                TRUST : {Math.round((currentUserProfile.reputation || 4.8) * 20)}/100 (ARGENT)
              </span>
              <Flame className="w-3 h-3 text-afri-gold/80 shrink-0 ml-auto animate-pulse" />
            </div>

            {/* Elite Subtext */}
            <div className="flex items-center gap-1 text-[9px] xs:text-[10px] font-black text-afri-gold tracking-[0.15em] uppercase">
              <span>★ ELITE</span>
            </div>

            {/* Gombo ID Display (Gold pill with black text) */}
            {isKycApproved ? (
              <div 
                onClick={handleCopyId}
                className="bg-gradient-to-r from-amber-500 via-afri-gold to-amber-300 hover:brightness-110 active:scale-98 transition-all text-black text-[9px] xs:text-[10px] font-mono font-black tracking-widest px-3 py-1 rounded shadow-md uppercase inline-flex items-center gap-1.5 border border-amber-400/40 w-fit cursor-pointer"
              >
                <span>🎼 {gomboId}</span>
              </div>
            ) : (
              <div 
                onClick={handleCopyId}
                className="bg-gradient-to-r from-amber-500 via-afri-gold to-amber-300 hover:brightness-110 active:scale-98 transition-all text-black text-[9px] xs:text-[10px] font-mono font-black tracking-widest px-3 py-1 rounded shadow-md uppercase inline-flex items-center gap-1.5 border border-amber-400/40 w-fit cursor-pointer"
              >
                <span>ID NON ATTRIBUÉ</span>
              </div>
            )}

            {/* Subscription status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-800/80 bg-afri-bg-ter text-[8.5px] xs:text-[9.5px] text-zinc-400 font-bold tracking-wide uppercase w-fit">
              <span className="text-amber-500">👑</span>
              <span>ABONNEMENT : {isPremium ? "PREMIUM ELITE" : "STANDARD (GRATUIT)"}</span>
            </div>

            {/* KYC status badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-800/80 bg-afri-bg-ter text-[8.5px] xs:text-[9.5px] text-zinc-400 font-bold tracking-wide uppercase w-fit">
              <span className={isKycApproved ? "text-emerald-400" : "text-amber-500"}>🛡️</span>
              <span>KYC : {isKycApproved ? "VÉRIFIÉ" : "NON VÉRIFIÉ"}</span>
            </div>

            {/* Timer status */}
            <div className="flex items-center gap-1.5 text-[8.5px] font-mono font-bold text-zinc-500 tracking-wide uppercase">
              <Clock className="w-2.5 h-2.5" />
              <span>0M / 30M (EC)</span>
            </div>

            {/* Actions: BIO OK & DEVENIR ELITE */}
            <div className="flex items-center gap-2 pt-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-[8.5px] xs:text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                ✓ BIO OK
              </span>
              <button 
                onClick={() => onNavigateView("user_gombo_plus")}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-afri-gold hover:brightness-115 text-black text-[9px] xs:text-[10px] font-black uppercase tracking-wider shadow-md hover:scale-102 active:scale-98 transition-all cursor-pointer"
              >
                DEVENIR ELITE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THREE STATS COLUMNS SIDE-BY-SIDE (SCREENSHOT STYLE) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        <div className="bg-afri-bg border border-zinc-900/95 rounded-[20px] p-3.5 flex flex-col items-center justify-center text-center gap-1 shadow-md">
          <span className="text-[17px] xs:text-[20px] sm:text-[24px] font-serif font-black text-afri-gold tracking-tight leading-none">
            {currentUserProfile.followersCount || currentUserProfile.followers?.length || 142}
          </span>
          <span className="text-[7.5px] xs:text-[8.5px] font-mono font-black text-zinc-500 uppercase tracking-widest mt-1">
            ABONNÉS
          </span>
        </div>
        <div className="bg-afri-bg border border-zinc-900/95 rounded-[20px] p-3.5 flex flex-col items-center justify-center text-center gap-1 shadow-md">
          <span className="text-[17px] xs:text-[20px] sm:text-[24px] font-serif font-black text-afri-gold tracking-tight leading-none">
            {myPosts.length || 12}
          </span>
          <span className="text-[7.5px] xs:text-[8.5px] font-mono font-black text-zinc-500 uppercase tracking-widest mt-1">
            POSTS
          </span>
        </div>
        <div className="bg-afri-bg border border-zinc-900/95 rounded-[20px] p-3.5 flex flex-col items-center justify-center text-center gap-1 shadow-md">
          <span className="text-[17px] xs:text-[20px] sm:text-[24px] font-serif font-black text-afri-gold tracking-tight leading-none">
            {currentUserProfile.engagementRate || "12.4%"}
          </span>
          <span className="text-[7.5px] xs:text-[8.5px] font-mono font-black text-zinc-500 uppercase tracking-widest mt-1">
            ENGAGEMENT
          </span>
        </div>
      </div>

      {/* 3. CENTERED SUBTITLE TEXT */}
      <div className="text-center py-1">
        <p className="text-zinc-500 font-sans text-xs italic">
          Membre Elite de la famille AFRIGOMBO
        </p>
      </div>

      {/* 4. GÉRER MON ABONNEMENT BUTTON (SCREENSHOT STYLE) */}
      <button 
        onClick={() => onNavigateView("user_subscription_management")}
        className="w-full max-w-sm mx-auto flex items-center justify-between py-2.5 px-5 bg-afri-bg border border-zinc-900 hover:border-afri-gold/30 text-zinc-400 font-mono font-black text-[9.5px] uppercase tracking-widest rounded-full shadow-md hover:text-white transition-all active:scale-98 cursor-pointer"
      >
        <span />
        <span className="text-center flex-1">GÉRER MON ABONNEMENT</span>
        <ChevronRight className="w-3.5 h-3.5 text-afri-gold stroke-[3.5]" />
      </button>

      {/* 5. GRANDE CARTE PREMIUM GOMBO ID */}
      {!isKycApproved ? (
        currentUserProfile.kycStatus === "pending" ? (
          /* Demande en cours d'analyse */
          <div className="relative overflow-hidden rounded-[32px] p-6 xs:p-7 bg-afri-bg border-2 border-amber-500/30 shadow-[0_10px_25px_rgba(0,0,0,0.8)] text-center space-y-4">
            <div className="absolute inset-0 bg-afri-gold/2 opacity-[0.03] pointer-events-none" />
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center animate-pulse">
              <Clock className="w-7 h-7 text-amber-400 stroke-[1.8]" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-black text-amber-400 uppercase tracking-[0.2em] block">Dossier Transmis</span>
              <h3 className="text-[17px] xs:text-[19px] font-sans font-black text-white tracking-wide uppercase">
                DEMANDE EN COURS D'ANALYSE
              </h3>
            </div>
            <p className="text-[10px] xs:text-[11px] text-zinc-400 max-w-[320px] mx-auto leading-relaxed font-sans">
              Votre demande est en cours d'évaluation par le comité artistique AFRIGOMBO. Notre équipe procède à la vérification de vos pièces.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => setPanelView("certification")}
                className="w-full xs:w-auto px-6 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 text-zinc-300 font-mono text-[10px] uppercase font-black tracking-widest rounded-xl transition-all active:scale-98 cursor-pointer"
              >
                Suivre ma certification ({[0, 1, 2, 3, 4, 5, 6].filter(idx => {
                  switch (idx) {
                    case 0: return (currentUserProfile.firstName && currentUserProfile.lastName && currentUserProfile.phone && currentUserProfile.birthDate && currentUserProfile.commune);
                    case 1: return (currentUserProfile.artisticName || currentUserProfile.artistName);
                    case 2: return !!currentUserProfile.avatarUrl;
                    case 3: return (currentUserProfile.kycDocs?.identityCardUrl || currentUserProfile.kycDocUrl);
                    case 4: return !!currentUserProfile.kycDocs?.selfieUrl;
                    case 5: return (currentUserProfile.role && currentUserProfile.experience && currentUserProfile.specialties?.length > 0 && currentUserProfile.bio);
                    case 6: return (currentUserProfile.instagram || currentUserProfile.youtube || currentUserProfile.facebook || currentUserProfile.skippedSocials);
                    default: return false;
                  }
                }).length}/7)
              </button>
            </div>
            <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
              ⏱️ Temps de réponse moyen : &lt; 24 heures
            </p>
          </div>
        ) : (
          /* OBTENIR MON GOMBO ID */
          <div className="relative overflow-hidden rounded-[32px] p-6 xs:p-7 bg-afri-bg border-2 border-afri-gold shadow-[0_15px_30px_rgba(212,175,55,0.08)] text-center space-y-4">
            {/* Elegant glowing lights in margins */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-afri-gold/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* 🛡️ Icon */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-afri-gold/25 flex items-center justify-center shadow-inner">
              <Shield className="w-7 h-7 text-afri-gold stroke-[1.8]" />
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h3 className="text-[18px] xs:text-[20px] font-sans font-black text-white tracking-[0.1em] uppercase">
                OBTENIR MON GOMBO ID
              </h3>
              <p className="text-[9.5px] xs:text-[10.5px] font-mono font-black text-afri-gold uppercase tracking-widest">
                "Votre identité musicale certifiée"
              </p>
            </div>

            {/* Text details */}
            <p className="text-[10px] xs:text-[11px] text-zinc-400 max-w-[340px] mx-auto leading-relaxed font-sans">
              Le GOMBO ID est attribué uniquement après vérification complète de votre identité et de votre activité musicale.
            </p>

            {/* Main Action button */}
            <div className="pt-2">
              <button 
                onClick={() => {
                  setPanelView("certification");
                  try { audioSynth.playTamTam(true); } catch (_) {}
                }}
                className="w-full xs:w-auto px-8 py-3 bg-afri-gold hover:brightness-110 text-black font-sans font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:scale-101 active:scale-98 transition-all cursor-pointer"
              >
                COMMENCER MA CERTIFICATION
              </button>
            </div>
          </div>
        )
      ) : (
        /* VERIFIED / CERTIFIED GOMBO ID CARD */
        <div className="relative overflow-hidden rounded-[32px] p-6 xs:p-7 bg-afri-bg border-2 border-emerald-500/35 shadow-[0_15px_30px_rgba(16,185,129,0.08)] text-center space-y-4">
          <div className="absolute inset-0 bg-emerald-500/[0.01] pointer-events-none" />
          
          {/* Golden Shield & Verified Badge */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded-full text-[8.5px] font-mono font-black uppercase tracking-widest">
              ✓ ARTISTE CERTIFIÉ
            </span>
          </div>

          {/* Title and ID */}
          <div className="space-y-1">
            <h3 className="text-xs font-mono font-black text-zinc-500 uppercase tracking-[0.2em]">🎼 GOMBO ID OFFICIAL</h3>
            <p className="text-xl xs:text-2xl font-serif font-black text-afri-gold tracking-widest uppercase italic">
              {gomboId}
            </p>
          </div>

          {/* Buttons: Copier, Partager, Afficher QR Code, Voir mon certificat */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button 
              onClick={handleCopyId}
              className="py-2 px-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-zinc-300 font-mono text-[9px] uppercase font-bold rounded-xl transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1"
            >
              <Copy className="w-3 h-3 text-afri-gold" />
              <span>{copiedId ? "Copié !" : "Copier"}</span>
            </button>
            <button 
              onClick={handleShareProfile}
              className="py-2 px-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-zinc-300 font-mono text-[9px] uppercase font-bold rounded-xl transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1"
            >
              <Share2 className="w-3 h-3 text-afri-gold" />
              <span>Partager</span>
            </button>
            <button 
              onClick={() => {
                setShowQrModal(true);
                try { audioSynth.playKoraNote(392.00, 0, 0.05, 0.3); } catch (_) {}
              }}
              className="py-2 px-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-zinc-300 font-mono text-[9px] uppercase font-bold rounded-xl transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1"
            >
              <QrCode className="w-3 h-3 text-afri-gold" />
              <span>Afficher le QR Code</span>
            </button>
            <button 
              onClick={() => {
                setShowCertModal(true);
                try { audioSynth.playKoraNote(523.25, 0, 0.1, 0.5); } catch (_) {}
              }}
              className="py-2 px-3 bg-gradient-to-r from-amber-500/10 to-afri-gold/10 hover:from-amber-500/20 hover:to-afri-gold/20 border border-afri-gold/25 text-afri-gold font-mono text-[9px] uppercase font-bold rounded-xl transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1"
            >
              <Award className="w-3 h-3" />
              <span>Voir mon certificat</span>
            </button>
            <button 
              onClick={() => {
                const link = document.createElement('a');
                link.href = 'data:text/plain;charset=utf-8,Certificat%20GOMBO%20ID%20Afrigombo%0AIdentifiant:%20' + gomboId;
                link.download = `Certificat_Afrigombo_${gomboId}.txt`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                try { audioSynth.playKoraNote(659.25, 0, 0.1, 0.5); } catch (_) {}
              }}
              className="py-2 px-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-afri-gold font-mono text-[9px] uppercase font-bold rounded-xl transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1"
            >
              <Download className="w-3 h-3 text-afri-gold" />
              <span>Télécharger mon certificat</span>
            </button>
          </div>
        </div>
      )}

      {/* 5b. AVANTAGES SECTION */}
      <div className="bg-afri-bg border border-zinc-900 rounded-[28px] p-5 xs:p-6 shadow-md space-y-3 text-left">
        <h4 className="text-[10px] font-mono font-black text-afri-gold uppercase tracking-[0.2em]">Grâce à votre GOMBO ID :</h4>
        <div className="space-y-2">
          {[
            "Profil certifié",
            "Plus de visibilité",
            "Priorité dans les recherches",
            "Accès aux contrats sécurisés",
            "Plus de crédibilité",
            "Protection contre les faux profils"
          ].map((item, idx) => (
            <div key={idx} className="flex gap-2.5 items-center">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span className="text-[11px] font-bold text-white uppercase tracking-wide block">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. EXPANDABLE / SCROLLABLE TOOLS (PRESERVING APP RICH FEATURES) */}
      <div className="pt-6 border-t border-zinc-900/60 space-y-4">
        <h3 className="text-xs font-mono uppercase font-black text-zinc-500 tracking-[0.25em] px-1">
          🛠️ Espace de Gestion & Créativité
        </h3>

        {/* Rapid Actions Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {[
            { 
              label: "Modifier mon héritage", 
              desc: "Éditer votre profil", 
              icon: Edit3, 
              action: () => setPanelView("edit"), 
              color: "text-amber-400/90",
              border: "hover:border-amber-400/25"
            },
            { 
              label: "Messagerie", 
              desc: "Vos correspondances", 
              icon: MessageSquare, 
              action: () => onNavigateView("user_messages"), 
              color: "text-purple-400",
              border: "hover:border-purple-400/25"
            },
            { 
              label: "Coffre-fort", 
              desc: "Gérer vos revenus", 
              icon: Wallet, 
              action: () => onNavigateView("user_wallet"), 
              color: "text-amber-400",
              border: "hover:border-afri-gold/25"
            },
            { 
              label: "Partager mon profil", 
              desc: "Diffuser votre ID", 
              icon: Share2, 
              action: handleShareProfile, 
              color: "text-emerald-400",
              border: "hover:border-emerald-400/25"
            },
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={item.action}
              className={`flex flex-col items-start p-4 rounded-2xl bg-zinc-900/25 border border-zinc-850/60 hover:bg-zinc-900/50 ${item.border} active:scale-[0.98] transition-all duration-200 text-left h-32 justify-between shadow-sm`}
            >
              <div className="p-2.5 rounded-xl bg-black border border-white/5">
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-[10.5px] font-black text-zinc-100 uppercase tracking-wide leading-tight">{item.label}</p>
                <p className="text-[9.5px] text-zinc-500 mt-1">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {shareSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-center text-xs text-emerald-300 font-mono"
          >
            ✓ Lien du profil copié ! Vous pouvez maintenant le coller.
          </motion.div>
        )}

        {/* MON ACTIVITÉ */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-afri-bg-sec p-5 shadow-xl space-y-4 mt-8">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 blur-[35px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Briefcase className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-[11px] font-mono uppercase font-black text-white tracking-widest">💼 Mon Activité</h4>
              <p className="text-[9.5px] text-zinc-500 font-mono">Gérez l'ensemble de votre présence</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onNavigateView("user_mes_gombos")} className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-800/80 transition-colors text-left">
              <Edit3 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="block text-[10px] font-bold text-white uppercase tracking-wider truncate">Publications</span>
                <span className="block text-[8px] text-zinc-500 font-mono">{myPosts.length} posts</span>
              </div>
            </button>
            
            <button onClick={() => onNavigateView("user_contracts")} className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-800/80 transition-colors text-left">
              <ShieldCheck className="w-4 h-4 text-afri-gold shrink-0" />
              <div className="truncate">
                <span className="block text-[10px] font-bold text-white uppercase tracking-wider truncate">Contrats</span>
                <span className="block text-[8px] text-zinc-500 font-mono">Sécurisés</span>
              </div>
            </button>
            
            <button onClick={() => onNavigateView("user_opportunities")} className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-800/80 transition-colors text-left">
              <Target className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="truncate">
                <span className="block text-[10px] font-bold text-white uppercase tracking-wider truncate">Candidatures</span>
                <span className="block text-[8px] text-zinc-500 font-mono">{currentUserProfile.applicationsSent || 0} envois</span>
              </div>
            </button>

            <button onClick={() => onNavigateView("user_wallet")} className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-800/80 transition-colors text-left">
              <Wallet className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="truncate">
                <span className="block text-[10px] font-bold text-white uppercase tracking-wider truncate">Revenus</span>
                <span className="block text-[8px] text-zinc-500 font-mono">{(currentUserProfile.totalRevenue || 0).toLocaleString()} F</span>
              </div>
            </button>
            
            <button onClick={() => onNavigateView("user_vibes")} className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-800/80 transition-colors text-left">
              <Heart className="w-4 h-4 text-rose-500 shrink-0" />
              <div className="truncate">
                <span className="block text-[10px] font-bold text-white uppercase tracking-wider truncate">Favoris</span>
                <span className="block text-[8px] text-zinc-500 font-mono">Sauvegardés</span>
              </div>
            </button>

            <button onClick={() => onNavigateView("user_events")} className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-800/80 transition-colors text-left">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="truncate">
                <span className="block text-[10px] font-bold text-white uppercase tracking-wider truncate">Calendrier</span>
                <span className="block text-[8px] text-zinc-500 font-mono">Mes dates</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive QR Code Modal */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99999] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-[32px] border border-afri-gold/30 bg-afri-bg p-6 text-center space-y-6 relative shadow-2xl"
            >
              <button 
                onClick={() => {
                  setShowQrModal(false);
                  try { audioSynth.playKoraNote(392.00, 0, 0.1, 0.4); } catch (_) {}
                }}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white bg-zinc-900/60 p-1.5 rounded-full border border-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1 pt-2">
                <span className="text-afri-gold text-[10px] font-mono uppercase tracking-[0.2em] block">Scanner & Recruter</span>
                <h4 className="text-lg font-sans font-black text-white uppercase">QR CODE GOMBO ID</h4>
              </div>

              {/* Vector Golden Simulated High-Tech QR Code */}
              <div className="w-52 h-52 mx-auto bg-black border border-afri-gold/20 rounded-2xl p-4 flex items-center justify-center relative shadow-inner">
                <div className="absolute inset-4 rounded-full bg-afri-gold/5 blur-xl pointer-events-none" />
                <svg viewBox="0 0 100 100" className="w-full h-full text-afri-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                  {/* Outer Frame Corners */}
                  <rect x="5" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="3" rx="2" />
                  <rect x="10" y="10" width="15" height="15" fill="currentColor" rx="1" />
                  
                  <rect x="70" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="3" rx="2" />
                  <rect x="75" y="10" width="15" height="15" fill="currentColor" rx="1" />
                  
                  <rect x="5" y="70" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="3" rx="2" />
                  <rect x="10" y="75" width="15" height="15" fill="currentColor" rx="1" />

                  {/* Aesthetic Golden Abstract Pixels (High Tech Matrix look) */}
                  <g fill="currentColor" opacity="0.95">
                    <rect x="38" y="10" width="4" height="4" />
                    <rect x="44" y="6" width="8" height="4" />
                    <rect x="56" y="12" width="4" height="8" />
                    <rect x="42" y="24" width="12" height="4" />

                    <rect x="10" y="38" width="8" height="4" />
                    <rect x="6" y="46" width="4" height="12" />
                    <rect x="18" y="50" width="12" height="4" />
                    <rect x="22" y="58" width="4" height="8" />

                    {/* Central anchor and complex cells */}
                    <rect x="38" y="38" width="24" height="24" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    <circle cx="50" cy="50" r="4" />

                    <rect x="72" y="38" width="12" height="4" />
                    <rect x="80" y="46" width="14" height="6" />
                    <rect x="70" y="58" width="6" height="12" />

                    <rect x="38" y="72" width="16" height="4" />
                    <rect x="42" y="80" width="8" height="8" />
                    <rect x="56" y="84" width="12" height="4" />

                    <rect x="72" y="72" width="22" height="4" />
                    <rect x="76" y="80" width="8" height="12" />
                  </g>
                </svg>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-sans font-black text-white">{currentUserProfile.artisticName}</p>
                <span className="text-xs font-mono font-bold text-afri-gold uppercase tracking-wider">{gomboId}</span>
              </div>

              <button 
                onClick={() => {
                  handleCopyId();
                  setShowQrModal(false);
                }}
                className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs uppercase rounded-xl border border-zinc-800/80 active:scale-98 transition-all"
              >
                Copier GOMBO ID & Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Certificate Modal */}
      <AnimatePresence>
        {showCertModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-lg rounded-[36px] border-2 border-afri-gold bg-gradient-to-b from-afri-bg-sec to-afri-bg p-6 sm:p-8 text-center relative shadow-2xl overflow-hidden my-8"
            >
              {/* Background watermark style elements */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.04)_0%,transparent_70%)] pointer-events-none" />
              
              <button 
                onClick={() => {
                  setShowCertModal(false);
                  try { audioSynth.playKoraNote(392.00, 0, 0.1, 0.4); } catch (_) {}
                }}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white bg-zinc-900/60 p-1.5 rounded-full border border-white/5 transition-colors cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Holographic Security Border and Header */}
              <div className="border border-afri-gold/30 rounded-2xl p-6 sm:p-8 space-y-6 relative bg-afri-bg/40 text-left">
                {/* Vintage gold stamp */}
                <div className="absolute top-3 right-4 w-12 h-12 rounded-full border border-afri-gold/25 flex items-center justify-center rotate-12 opacity-85 pointer-events-none select-none">
                  <span className="text-[7.5px] font-mono font-black text-afri-gold/80 text-center leading-none">AFRIGOMBO<br/>OFFICIAL<br/>SEAL</span>
                </div>

                <div className="space-y-1 text-center">
                  <div className="flex justify-center gap-1 text-afri-gold mb-2">
                    <Star className="w-4 h-4 fill-afri-gold" />
                    <Star className="w-4 h-4 fill-afri-gold" />
                    <Star className="w-4 h-4 fill-afri-gold" />
                  </div>
                  <span className="text-afri-gold text-[10px] font-mono uppercase tracking-[0.25em] block leading-none">TEMPLE DE LA SOUVERAINETÉ</span>
                  <h3 className="text-xl sm:text-2xl font-serif font-black italic tracking-wider text-white uppercase leading-tight">CERTIFICAT D'EXCELLENCE</h3>
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-[0.15em] block pt-1">NUMÉRO D'ENREGISTREMENT UNIQUE</span>
                </div>

                <div className="py-2 border-y border-zinc-900/80 my-4 space-y-1 text-center">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">IDENTIFIANT ATTRIBUÉ</span>
                  <span className="text-2xl font-serif font-black text-afri-gold tracking-widest block uppercase italic select-all">{gomboId}</span>
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed max-w-[340px] mx-auto italic text-center">
                    « Par ce présent certificat, l'équipe artistique et le comité de souveraineté d'AFRIGOMBO certifient l'artiste ci-dessous comme membre agréé de l'élite musicale ivoirienne. »
                  </p>

                  <div className="space-y-1.5 text-center">
                    <p className="text-zinc-400 text-[10px] font-mono uppercase tracking-widest">ARTISTE TITULAIRE</p>
                    <p className="text-lg font-sans font-black text-white uppercase tracking-wider">{currentUserProfile.artisticName || `${currentUserProfile.firstName || "Artiste"} ${currentUserProfile.lastName || ""}`.trim()}</p>
                    <p className="text-xs font-mono font-bold text-zinc-500 uppercase">{currentUserProfile.commune || "Cocody"}, Abidjan</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-900/60 text-left text-[9px] font-mono text-zinc-500">
                  <div>
                    <span className="block text-[8px] text-zinc-600 uppercase tracking-wider">Date d'approbation</span>
                    <span className="text-afri-gold font-black uppercase">{currentUserProfile.kycApprovedDate || currentUserProfile.verificationDate || new Date().toLocaleDateString("fr-FR")}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] text-zinc-600 uppercase tracking-wider">Signé par</span>
                    <span className="text-white font-black uppercase">Le Grand Conseil Artistique</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col xs:flex-row gap-2 justify-center">
                <button 
                  onClick={handleCopyId}
                  className="py-2 px-4 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-mono text-xs uppercase rounded-xl border border-zinc-800 cursor-pointer transition-all active:scale-98"
                >
                  Copier GOMBO ID
                </button>
                <button 
                  onClick={() => setShowCertModal(false)}
                  className="py-2 px-4 bg-afri-gold text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl cursor-pointer hover:brightness-110 transition-all active:scale-98"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
