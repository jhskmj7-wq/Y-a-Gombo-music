import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, Star, Briefcase, DollarSign, Users, Target,
  Calendar, MessageSquare, Phone, Wallet, Settings, ChevronDown,
  ChevronRight, Award, Edit3, Heart, Share2, Crown
} from "lucide-react";
import { UserProfile } from "../types";

interface GomboProfileMainViewProps {
  currentUserProfile: UserProfile;
  onRefreshProfile: () => void;
  onNavigateView: (view: string, tab?: any) => void;
  setPanelView: (panel: string) => void;
  availabilityStatus: string;
  handleUpdateAvailabilityStatus: (status: "disponible" | "occupe" | "indisponible") => void;
  updatingAvailability: boolean;
  dynamicGroupsCount: number;
  dynamicFavsCount: number;
  dynamicAppsCount: number;
  myPosts: any[];
  mediaGallery: any[];
  setMediaGallery: (gallery: any[]) => void;
}

export const GomboProfileMainView: React.FC<GomboProfileMainViewProps> = ({
  currentUserProfile,
  onNavigateView,
  setPanelView,
  dynamicAppsCount,
  myPosts,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!currentUserProfile) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="afri-scroll-safe afri-container"
    >
      <div className="afri-section space-y-6">
        
        {/* 1. BLOC PREMIUM (PHOTO, INFOS, GOMBO ID) */}
        <div className="relative overflow-hidden rounded-[30px] border border-[#D4AF37]/20 bg-[#0A0A0A] shadow-2xl p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.3)] bg-zinc-900">
                <img 
                  src={currentUserProfile.avatarUrl || currentUserProfile.photoURL || "/public/logo.png"} 
                  alt={currentUserProfile.firstName} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
              {currentUserProfile.isCertified && (
                <div className="absolute bottom-1 right-1 bg-[#D4AF37] p-1.5 rounded-full border-4 border-black shadow-lg">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-black stroke-[3]" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-3">
              <div>
                <h1 className="text-2xl sm:text-4xl font-sans font-black text-white tracking-tight">
                  {currentUserProfile.artisticName || `${currentUserProfile.firstName} ${currentUserProfile.lastName}`}
                </h1>
                <p className="text-[#D4AF37] text-xs sm:text-sm font-mono font-bold tracking-[0.2em] uppercase mt-1">
                  Artiste {currentUserProfile.speciality || "Elite"}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pt-2">
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">GOMBO ID</span>
                  <span className="text-sm font-mono text-zinc-200 font-black tracking-[0.2em]">
                    {currentUserProfile.uid.slice(0, 12).toUpperCase()}
                  </span>
                </div>
                
                <div className="h-8 w-px bg-zinc-800 hidden sm:block" />

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Niveau</span>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span className="text-base font-black text-white">{currentUserProfile.level || 1}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Réputation</span>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-base font-black text-white">{currentUserProfile.reputation || 4.8}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. STATISTIQUES D'OR (GRILLE 2x2 PREMIUM) */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Contrats", val: currentUserProfile.gigsCompleted || 0, icon: Briefcase, color: "text-blue-400", bg: "bg-blue-400/5", border: "border-blue-400/20" },
            { label: "Portefeuille", val: `${(currentUserProfile.totalRevenue || 0).toLocaleString()} F`, icon: Wallet, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/5", border: "border-[#D4AF37]/20" },
            { label: "Réputation", val: `${currentUserProfile.reputation || 4.8}/5`, icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/5", border: "border-yellow-400/20" },
            { label: "Collaborations", val: currentUserProfile.collaborations?.length || 0, icon: Users, color: "text-purple-400", bg: "bg-purple-400/5", border: "border-purple-400/20" },
          ].map((stat, idx) => (
            <div 
              key={idx} 
              className={`relative overflow-hidden rounded-2xl border ${stat.border} ${stat.bg} p-5 flex flex-col items-center justify-center text-center space-y-2 shadow-lg group active:scale-95 transition-all`}
            >
              <div className={`p-2.5 rounded-xl ${stat.bg} border ${stat.border} group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-sans font-black text-white leading-tight">{stat.val}</p>
                <p className="text-[9px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 3. ACTIONS RAPIDES (GRILLE UNIFORME) */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-px flex-1 bg-zinc-800" />
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Actions Rapides</h2>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Wallet Gombo", icon: Wallet, action: () => onNavigateView("wallet"), color: "text-amber-400" },
              { label: "Mes Contrats", icon: Briefcase, action: () => onNavigateView("contracts"), color: "text-blue-400" },
              { label: "Calendrier", icon: Calendar, action: () => onNavigateView("calendar"), color: "text-emerald-400" },
              { label: "Messagerie", icon: MessageSquare, action: () => onNavigateView("messages"), color: "text-purple-400" },
              { label: "Modifier Profil", icon: Edit3, action: () => setPanelView("edit"), color: "text-[#D4AF37]" },
              { label: "Support Client", icon: Phone, action: () => onNavigateView("help"), color: "text-zinc-400" },
            ].map((action, idx) => (
              <button 
                key={idx}
                onClick={action.action}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 active:scale-95 transition-all group shadow-sm"
              >
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 group-hover:border-[#D4AF37]/40 transition-colors">
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-[10px] sm:text-xs font-black text-zinc-300 uppercase tracking-wider text-center">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>


        {/* 4. RÉPUTATION SUMMARY */}
        <div className="afri-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="afri-text-tiny">Réputation & Excellence</p>
            <button className="afri-btn-ghost py-1 px-2">Détails</button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    className={`w-4 h-4 ${s <= Math.floor(currentUserProfile.reputation || 4.8) ? "text-amber-400 fill-amber-400" : "text-zinc-700"}`} 
                  />
                ))}
              </div>
              <p className="text-2xl font-sans font-black text-white">{currentUserProfile.reputation || 4.8} <span className="text-xs text-zinc-500">/ 5</span></p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-sans font-black text-emerald-400">{currentUserProfile.successRate || 85}%</p>
              <p className="afri-text-tiny">Taux de Réussite</p>
            </div>
          </div>
        </div>

        {/* 5. HISTORIQUE (TOP 3) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="afri-text-tiny">Activités Récentes</p>
            <button className="afri-btn-ghost py-1 px-2" onClick={() => onNavigateView("activities")}>Voir Tout</button>
          </div>
          <div className="space-y-2">
            {myPosts.length === 0 ? (
              <div className="afri-card-inset text-center py-6">
                <p className="afri-text-body italic">Aucune activité récente.</p>
              </div>
            ) : (
              myPosts.slice(0, 3).map((post, idx) => (
                <div key={idx} className="afri-card-inset flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                    <Heart className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-[11px] xs:text-xs text-zinc-200 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                    <p className="afri-text-tiny text-zinc-600">
                      {post.timestamp ? new Date(post.timestamp).toLocaleDateString("fr-FR") : "Récemment"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 6. PARAMÈTRES DU COMPTE (ACCORDÉON) */}
        <div className="afri-card overflow-hidden">
          <button 
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-zinc-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">Paramètres du Compte</span>
            </div>
            {settingsOpen ? <ChevronDown className="w-5 h-5 text-zinc-500" /> : <ChevronRight className="w-5 h-5 text-zinc-500" />}
          </button>
          
          <AnimatePresence>
            {settingsOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/5 bg-black/40"
              >
                <div className="p-4 space-y-2">
                  {[
                    "Sécurité & Gombo ID",
                    "Notifications",
                    "Confidentialité",
                    "Langue & Région",
                    "Aide & Support"
                  ].map((item, idx) => (
                    <button 
                      key={idx}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-left transition-colors"
                    >
                      <span className="text-[11px] font-bold text-zinc-400 uppercase">{item}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-700" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 7. SHARE PROFILE */}
        <button className="afri-btn-secondary">
          <Share2 className="w-4 h-4" />
          Partager mon Héritage
        </button>

        {/* 👑 ADMIN BACKDOOR (ONLY FOR AUTHORIZED) */}
        {currentUserProfile?.email && [
          "johnsylvesterh@gmail.com",
          "sylvestrehounkpevi777@gmail.com",
          "jhs.kmj7@gmail.com"
        ].includes(currentUserProfile.email.toLowerCase()) && (
          <div className="mt-8 pt-8 border-t border-[#D4AF37]/10 flex flex-col items-center">
            <button
              onClick={() => onNavigateView("admin")}
              className="w-full afri-card p-4 border-amber-500/30 flex items-center justify-center gap-3 bg-amber-500/5 hover:bg-amber-500/10"
            >
              <Crown className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.2em]">Centre de Commande</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
