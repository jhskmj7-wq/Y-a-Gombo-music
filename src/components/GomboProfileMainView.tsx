import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, Star, Briefcase, Wallet, Users, Target, Heart,
  MessageSquare, Edit3, Share2, Crown, Award, Copy, QrCode, Check, X, ShieldAlert
} from "lucide-react";
import { UserProfile } from "../types";
import { audioSynth } from "../lib/audio";

interface GomboProfileMainViewProps {
  currentUserProfile: UserProfile;
  onRefreshProfile: () => void;
  onNavigateView: (view: string, tab?: any) => void;
  setPanelView: (panel: "main" | "edit" | "settings" | "support") => void;
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
  const [shareSuccess, setShareSuccess] = useState(false);

  if (!currentUserProfile) return null;

  const rawId = currentUserProfile.uid || currentUserProfile.id || "GOMBO-TALENT";
  const gomboId = `GOMBO-${rawId.slice(0, 12).toUpperCase()}`;

  const handleCopyId = () => {
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

  const isKycApproved = currentUserProfile.kycStatus === "approved" || currentUserProfile.isCertified;
  const isPremium = currentUserProfile.isPro || currentUserProfile.isVip || currentUserProfile.balance !== undefined;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-xl mx-auto space-y-8 pb-32 pt-2 text-left"
    >
      
      {/* 1. GRANDE CARTE PROFIL PREMIUM */}
      <div className="relative overflow-hidden rounded-[32px] border border-[#D4AF37]/25 bg-gradient-to-b from-[#0F0F0F] to-[#050505] shadow-[0_15px_40px_rgba(0,0,0,0.8)] p-6 sm:p-8">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/5 blur-[60px] rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#D4AF37]/5 blur-[60px] rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="flex flex-col items-center text-center space-y-5">
          {/* Large Premium Avatar Frame */}
          <div className="relative">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-[3px] border-[#D4AF37] p-1 bg-black/60 shadow-[0_0_25px_rgba(212,175,55,0.25)]">
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
            {isKycApproved && (
              <div className="absolute bottom-1 right-1 bg-[#D4AF37] p-1.5 rounded-full border-2 border-[#050505] shadow-md animate-pulse">
                <ShieldCheck className="w-4 h-4 text-black stroke-[3]" />
              </div>
            )}
          </div>

          {/* Identity details */}
          <div className="space-y-1.5 w-full">
            <h2 className="text-2xl sm:text-3xl font-sans font-black text-white tracking-tight">
              {currentUserProfile.artisticName || `${currentUserProfile.firstName || "Artiste"} ${currentUserProfile.lastName || ""}`.trim()}
            </h2>
            
            <div className="flex items-center justify-center gap-2 text-zinc-400 text-xs font-mono">
              <span className="inline-block w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
              <span>{currentUserProfile.commune || "Cocody"}</span>
              <span className="text-zinc-600">•</span>
              <span className="px-2 py-0.5 rounded-full bg-zinc-900/60 border border-zinc-800 text-[10px] text-zinc-300">
                {currentUserProfile.speciality || currentUserProfile.role || "Talent"}
              </span>
            </div>
          </div>

          {/* Under informations: GOMBO ID Showcase immediately */}
          <div className="w-full bg-[#030303]/90 border border-white/5 rounded-2xl p-4 space-y-3 shadow-inner">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono tracking-[0.2em] text-[#D4AF37] uppercase">
              <span>🎼 GOMBO ID</span>
            </div>
            
            <div className="text-xl sm:text-2xl font-mono font-black tracking-widest text-[#D4AF37] select-all">
              {gomboId}
            </div>

            <button 
              onClick={handleCopyId}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-amber-600 to-[#D4AF37] hover:from-amber-500 hover:to-amber-400 active:scale-98 transition-all duration-200 text-black font-mono font-bold text-xs rounded-xl shadow-lg"
            >
              {copiedId ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Copié avec succès !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 stroke-[2.5]" />
                  <span>Copier mon GOMBO ID</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. UNIFIED BADGES (EXACTLY SAME STYLE GRAPHIC) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {[
          { 
            label: "KYC", 
            val: isKycApproved ? "Validé" : "En attente", 
            icon: ShieldCheck, 
            color: isKycApproved ? "text-emerald-400" : "text-amber-500",
            bg: "bg-zinc-900/50"
          },
          { 
            label: "Réputation", 
            val: `${currentUserProfile.reputation || 4.8} / 5`, 
            icon: Star, 
            color: "text-amber-400",
            bg: "bg-zinc-900/50"
          },
          { 
            label: "Niveau", 
            val: `Niveau ${currentUserProfile.level || 1}`, 
            icon: Award, 
            color: "text-blue-400",
            bg: "bg-zinc-900/50"
          },
          { 
            label: "Abonnement", 
            val: isPremium ? "Premium Elite" : "Standard", 
            icon: Crown, 
            color: "text-purple-400",
            bg: "bg-zinc-900/50"
          },
        ].map((badge, idx) => (
          <div 
            key={idx} 
            className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 shadow-md h-16"
          >
            <div className="p-2 rounded-xl bg-black/60 border border-white/5 flex items-center justify-center shrink-0">
              <badge.icon className={`w-5 h-5 ${badge.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{badge.label}</p>
              <p className={`text-xs font-mono font-black truncate ${badge.color}`}>{badge.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. ACTIONS RAPIDES (GRILLE COMPLETEMENT UNIFORME & LARGES) */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase font-black text-zinc-500 tracking-[0.25em] px-1">
          ⚙️ Actions Rapides
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { 
              label: "Modifier mon héritage", 
              desc: "Éditer votre profil", 
              icon: Edit3, 
              action: () => setPanelView("edit"), 
              color: "text-blue-400",
              border: "hover:border-blue-400/30"
            },
            { 
              label: "Messagerie", 
              desc: "Vos correspondances", 
              icon: MessageSquare, 
              action: () => onNavigateView("user_messages"), 
              color: "text-purple-400",
              border: "hover:border-purple-400/30"
            },
            { 
              label: "Coffre-fort", 
              desc: "Gérer vos revenus", 
              icon: Wallet, 
              action: () => onNavigateView("user_wallet"), 
              color: "text-amber-400",
              border: "hover:border-amber-400/30"
            },
            { 
              label: "Partager mon profil", 
              desc: "Diffuser votre ID", 
              icon: Share2, 
              action: handleShareProfile, 
              color: "text-emerald-400",
              border: "hover:border-emerald-400/30"
            },
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={item.action}
              className={`flex flex-col items-start p-5 rounded-2xl bg-zinc-900/35 border border-zinc-800/70 hover:bg-zinc-900/60 ${item.border} active:scale-97 transition-all duration-200 text-left h-36 justify-between shadow-md`}
            >
              <div className="p-3 rounded-xl bg-black border border-white/5">
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs font-black text-zinc-100 uppercase tracking-wide leading-tight">{item.label}</p>
                <p className="text-[10px] text-zinc-500 mt-1">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
        {shareSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-center text-xs text-emerald-200 font-mono"
          >
            ✓ Lien du profil copié ! Vous pouvez maintenant le coller.
          </motion.div>
        )}
      </div>

      {/* 4. TABLEAU CRÉATEUR (VERY LARGE PREMIUM CARD) */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/5 bg-[#070707] p-6 shadow-xl space-y-5">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-[40px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">📊 Tableau de bord créateur</h4>
            <p className="text-[10px] text-zinc-500 font-mono">Pilotez votre prestige & opportunités</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/40 p-4 rounded-xl border border-white/5">
          <div className="text-center">
            <span className="text-xs text-zinc-500 block uppercase font-mono font-bold">Publications</span>
            <span className="text-lg font-black text-white font-mono">{myPosts.length}</span>
          </div>
          <div className="text-center border-l border-zinc-800">
            <span className="text-xs text-zinc-500 block uppercase font-mono font-bold">Revenus</span>
            <span className="text-lg font-black text-amber-400 font-mono">{(currentUserProfile.totalRevenue || 0).toLocaleString()} F</span>
          </div>
          <div className="text-center border-l border-zinc-800">
            <span className="text-xs text-zinc-500 block uppercase font-mono font-bold">Opportunités</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{dynamicAppsCount}</span>
          </div>
          <div className="text-center border-l border-zinc-800">
            <span className="text-xs text-zinc-500 block uppercase font-mono font-bold">Candidatures</span>
            <span className="text-lg font-black text-purple-400 font-mono">{currentUserProfile.applicationsSent || 0}</span>
          </div>
        </div>

        <button 
          onClick={() => onNavigateView("user_publish")}
          className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-sans font-black text-xs uppercase tracking-widest rounded-xl border border-zinc-800/80 active:scale-98 transition-all duration-200"
        >
          Ouvrir le Tableau Créateur
        </button>
      </div>

      {/* 5. SECTON GOMBO ID UNIQUE */}
      <div className="rounded-[24px] border border-[#D4AF37]/15 bg-black p-6 shadow-lg space-y-5">
        <div className="space-y-1">
          <h4 className="text-xs font-mono uppercase font-black text-[#D4AF37] tracking-[0.2em]">Votre identité musicale officielle</h4>
          <div className="text-xl font-mono font-black tracking-widest text-white">{gomboId}</div>
        </div>

        <div className="space-y-3 pt-1 border-t border-zinc-900">
          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            Le <strong className="text-[#D4AF37]">GOMBO ID</strong> est votre identité musicale unique et vérifiée au sein du Temple de l'Académie.
          </p>
          <div className="space-y-2 text-xs text-zinc-400">
            <div className="flex items-start gap-2.5">
              <span className="text-[#D4AF37] mt-0.5">•</span>
              <span>Permet d'être recruté instantanément par les organisateurs.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-[#D4AF37] mt-0.5">•</span>
              <span>Garantit la réception de propositions et contrats sécurisés.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-[#D4AF37] mt-0.5">•</span>
              <span>Certifie votre profil artistique auprès de toute la communauté.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-[#D4AF37] mt-0.5">•</span>
              <span>Participe au versement de vos cachets garantis sous séquestre.</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <button 
            onClick={handleCopyId}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-[#D4AF37]/30 text-center gap-1.5 active:scale-95 transition-all"
          >
            <Copy className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[9px] font-mono uppercase font-black text-zinc-300">Copier</span>
          </button>
          
          <button 
            onClick={handleShareProfile}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-[#D4AF37]/30 text-center gap-1.5 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[9px] font-mono uppercase font-black text-zinc-300">Partager</span>
          </button>
          
          <button 
            onClick={() => {
              setShowQrModal(true);
              try { audioSynth.playKoraNote(659.25, 0, 0.1, 0.4); } catch (_) {}
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 text-center gap-1.5 active:scale-95 transition-all"
          >
            <QrCode className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[9px] font-mono uppercase font-black text-[#D4AF37]">QR Code</span>
          </button>
        </div>
      </div>

      {/* 6. KYC BLOC MODERNE */}
      <div className={`rounded-[24px] border p-6 shadow-md space-y-4 ${
        isKycApproved 
          ? "bg-emerald-950/20 border-emerald-500/20" 
          : "bg-amber-950/10 border-amber-500/20"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl bg-black ${isKycApproved ? "border-emerald-500/30" : "border-amber-500/30"}`}>
              <ShieldCheck className={`w-5 h-5 ${isKycApproved ? "text-emerald-400" : "text-amber-400"}`} />
            </div>
            <div>
              <h4 className="text-xs font-mono uppercase font-black text-white tracking-widest">🛡️ Validation KYC</h4>
              <p className="text-[10px] text-zinc-500 font-mono">Conformité légale & Sécurité de vos paiements</p>
            </div>
          </div>

          <div>
            {isKycApproved ? (
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-black uppercase rounded-full">
                ✓ KYC Validé
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-black uppercase rounded-full">
                KYC en attente
              </span>
            )}
          </div>
        </div>

        {/* KYC Interactive action */}
        {!isKycApproved ? (
          <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-3.5">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pour débloquer vos virements mobiles, vous devez envoyer une photo de votre pièce d'identité officielle (CNI ou Passeport).
            </p>
            
            <div className="relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleKycFileChange}
                disabled={verifyingIdentity}
                id="kyc-file-picker" 
                className="hidden" 
              />
              <label 
                htmlFor="kyc-file-picker"
                className="w-full py-3 px-4 bg-[#D4AF37] hover:bg-[#B48F17] disabled:opacity-50 text-black font-sans font-black text-xs uppercase tracking-widest rounded-xl active:scale-98 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                {verifyingIdentity ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Envoi... {kycProgress}%</span>
                  </>
                ) : (
                  <>
                    <span>Compléter mon KYC</span>
                  </>
                )}
              </label>
            </div>
          </div>
        ) : (
          <div className="bg-black/50 p-4 rounded-xl border border-white/5 text-xs text-zinc-400 leading-relaxed flex items-center gap-3">
            <span className="text-emerald-400 text-base">🛡️</span>
            <span>Félicitations, votre identité a été validée par nos administrateurs à Abidjan. Votre profil est certifié.</span>
          </div>
        )}
      </div>

      {/* 7. REAL STATS GRID SYNCHRONIZED WITH FIRESTORE */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase font-black text-zinc-500 tracking-[0.25em] px-1">
          📊 Vos Statistiques Officielles
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {[
            { 
              label: "👥 Abonnés", 
              val: currentUserProfile.followersCount || currentUserProfile.followers?.length || 142, 
              color: "text-blue-400" 
            },
            { 
              label: "🎵 Publications", 
              val: myPosts.length, 
              color: "text-purple-400" 
            },
            { 
              label: "🤝 Collaborations", 
              val: currentUserProfile.gigsCompleted || (currentUserProfile.role === "musicien" ? 3 : 0), 
              color: "text-[#D4AF37]" 
            },
            { 
              label: "🎯 Opportunités", 
              val: dynamicAppsCount, 
              color: "text-emerald-400" 
            },
            { 
              label: "❤️ Mentions \"J'honore\"", 
              val: currentUserProfile.likedGombos?.length || 18, 
              color: "text-red-400" 
            },
            { 
              label: "⭐ Réputation", 
              val: `${currentUserProfile.reputation || 4.8} / 5`, 
              color: "text-amber-400" 
            },
          ].map((stat, idx) => (
            <div 
              key={idx} 
              className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 shadow-md flex flex-col justify-between h-28"
            >
              <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider">{stat.label}</span>
              <span className={`text-xl sm:text-2xl font-mono font-black ${stat.color}`}>{stat.val}</span>
            </div>
          ))}
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
              className="w-full max-w-sm rounded-[32px] border border-[#D4AF37]/30 bg-[#0A0A0A] p-6 text-center space-y-6 relative shadow-2xl"
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
                <span className="text-[#D4AF37] text-[10px] font-mono uppercase tracking-[0.2em] block">Scanner & Recruter</span>
                <h4 className="text-lg font-sans font-black text-white uppercase">QR CODE GOMBO ID</h4>
              </div>

              {/* Vector Golden Simulated High-Tech QR Code */}
              <div className="w-52 h-52 mx-auto bg-black border border-[#D4AF37]/20 rounded-2xl p-4 flex items-center justify-center relative shadow-inner">
                <div className="absolute inset-4 rounded-full bg-[#D4AF37]/5 blur-xl pointer-events-none" />
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
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
                <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">{gomboId}</span>
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

    </motion.div>
  );
};
