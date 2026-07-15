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
      <div className="afri-section">
        
        {/* 1. HEADER D'ÉLITE (COMPACT) */}
        <div className="flex items-center gap-4 bg-gradient-to-r from-[#D4AF37]/5 to-transparent p-4 rounded-3xl border border-[#D4AF37]/10">
          <div className="relative shrink-0">
            <div className="w-20 h-20 xs:w-24 xs:h-24 rounded-2xl overflow-hidden border-2 border-[#D4AF37]/30 bg-zinc-900 shadow-xl">
              <img 
                src={currentUserProfile.avatarUrl || currentUserProfile.photoURL || "/public/logo.png"} 
                alt={currentUserProfile.firstName} 
                className="w-full h-full object-cover" 
              />
            </div>
            {currentUserProfile.isPremium && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 rounded-lg shadow-lg">
                <Crown className="w-3 h-3 text-black" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-lg xs:text-xl font-sans font-black text-white truncate max-w-[150px] xs:max-w-none">
                {currentUserProfile.firstName} {currentUserProfile.lastName}
              </h1>
              {currentUserProfile.isCertified && (
                <ShieldCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/10" />
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="afri-text-tiny text-[#D4AF37]">GOMBO ID:</span>
              <span className="text-[10px] font-mono text-zinc-300 font-black tracking-widest truncate max-w-[100px]">
                {currentUserProfile.uid.slice(0, 10).toUpperCase()}
              </span>
              
              {/* HIDDEN ADMIN ACCESS */}
              {currentUserProfile?.email && [
                "johnsylvesterh@gmail.com",
                "sylvestrehounkpevi777@gmail.com",
                "jhs.kmj7@gmail.com"
              ].includes(currentUserProfile.email.toLowerCase()) && (
                <button 
                  onClick={() => onNavigateView("admin")}
                  className="p-1 bg-amber-500/10 rounded-md border border-amber-500/20 ml-auto"
                  title="Centre de Commande"
                >
                  <Crown className="w-3 h-3 text-[#D4AF37]" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-black text-white">{currentUserProfile.reputation || 4.8}</span>
              </div>
              <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                <Award className="w-3 h-3 text-[#D4AF37]" />
                <span className="text-[9px] font-black text-zinc-300 uppercase">NV. {currentUserProfile.level || 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. STATISTIQUES (2x2) */}
        <div className="afri-grid-2">
          {[
            { label: "Contrats", val: currentUserProfile.gigsCompleted || 0, icon: Briefcase, color: "text-blue-400" },
            { label: "Revenus", val: `${(currentUserProfile.totalRevenue || 0).toLocaleString()} F`, icon: DollarSign, color: "text-emerald-400" },
            { label: "Réputation", val: `${currentUserProfile.reputation || 4.8}/5`, icon: Star, color: "text-yellow-400" },
            { label: "Collabs", val: currentUserProfile.collaborations?.length || 0, icon: Users, color: "text-purple-400" },
          ].map((stat, idx) => (
            <div key={idx} className="afri-card p-4 flex flex-col items-center justify-center text-center space-y-1">
              <stat.icon className={`w-5 h-5 ${stat.color} opacity-80`} />
              <p className="text-lg xs:text-xl font-sans font-black text-white">{stat.val}</p>
              <p className="afri-text-tiny">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* 3. ACTIONS RAPIDES (GRILLE ÉLÉGANTE) */}
        <div className="space-y-3">
          <p className="afri-text-tiny px-1">Actions Rapides</p>
          <div className="afri-grid-2">
            {[
              { label: "Modifier Profil", icon: Edit3, action: () => setPanelView("edit") },
              { label: "Wallet", icon: Wallet, action: () => onNavigateView("wallet") },
              { label: "Contrats", icon: Briefcase, action: () => onNavigateView("contracts") },
              { label: "Calendrier", icon: Calendar, action: () => onNavigateView("calendar") },
              { label: "Messagerie", icon: MessageSquare, action: () => onNavigateView("messages") },
              { label: "Support", icon: Phone, action: () => onNavigateView("help") },
            ].map((action, idx) => (
              <button 
                key={idx}
                onClick={action.action}
                className="afri-card p-4 flex items-center gap-3 hover:bg-[#D4AF37]/5 active:scale-[0.98] transition-all group"
              >
                <div className="afri-icon-wrapper group-hover:scale-110 transition-transform">
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] xs:text-xs font-bold text-zinc-300 uppercase tracking-tight text-left">
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
