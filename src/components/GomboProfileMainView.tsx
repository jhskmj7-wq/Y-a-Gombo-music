import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { 
  User, Phone, MapPin, Music, Award, ShieldCheck, Heart, Calendar, 
  Copy, ExternalLink, RefreshCw, Star, TrendingUp, Users, Target,
  Briefcase, CheckCircle2, DollarSign, Zap, BarChart3, PieChart as PieChartIcon,
  MessageSquare
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import { UserProfile } from "../types";
import { ProfileCompletionScore } from "./ProfileCompletionScore";
import { MediaGalleryManager } from "./MediaGalleryManager";

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

const AVATARS = [
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120&h=120",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120&h=120"
];

export const GomboProfileMainView: React.FC<GomboProfileMainViewProps> = ({
  currentUserProfile,
  onRefreshProfile,
  onNavigateView,
  setPanelView,
  availabilityStatus,
  handleUpdateAvailabilityStatus,
  updatingAvailability,
  dynamicGroupsCount,
  dynamicFavsCount,
  dynamicAppsCount,
  myPosts,
  mediaGallery,
  setMediaGallery
}) => {
  const [uidCopied, setUidCopied] = useState(false);

  if (!currentUserProfile) return null;

  const handleCopyUid = () => {
    navigator.clipboard.writeText(currentUserProfile.uid);
    setUidCopied(true);
    setTimeout(() => setUidCopied(false), 2000);
  };

  // Mock data for charts if real ones don't exist yet
  const revenueData = useMemo(() => [
    { name: "Jan", value: (currentUserProfile.monthlyRevenue || 0) * 0.7 },
    { name: "Fév", value: (currentUserProfile.monthlyRevenue || 0) * 0.8 },
    { name: "Mar", value: (currentUserProfile.monthlyRevenue || 0) * 0.6 },
    { name: "Avr", value: (currentUserProfile.monthlyRevenue || 0) * 0.9 },
    { name: "Mai", value: (currentUserProfile.monthlyRevenue || 0) * 1.1 },
    { name: "Juin", value: (currentUserProfile.monthlyRevenue || 0) || 0 },
  ], [currentUserProfile.monthlyRevenue]);

  const performanceData = useMemo(() => [
    { name: "Succès", value: currentUserProfile.successRate || 85 },
    { name: "Échecs", value: 100 - (currentUserProfile.successRate || 85) },
  ], [currentUserProfile.successRate]);

  const COLORS = ["#D4AF37", "#1A1A1A"];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12 text-[#1A1A1A] dark:text-gray-100 font-sans max-w-5xl mx-auto"
    >
      {/* 👑 HERITAGE HEADER - CV MUSICAL IDENTITY */}
      <div className="relative bg-[#050505] rounded-[2rem] overflow-hidden border border-zinc-800 shadow-2xl">
        {/* Cover with Overlay */}
        <div className="h-48 md:h-64 relative">
          {(currentUserProfile.coverUrl || currentUserProfile.couverture) ? (
            <img 
              src={currentUserProfile.coverUrl || currentUserProfile.couverture} 
              alt="" 
              className="w-full h-full object-cover opacity-60" 
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
          
          {/* Badge Flottant GOMBO ID */}
          <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
            <div className="bg-black/60 backdrop-blur-md border border-[#D4AF37]/30 px-4 py-2 rounded-2xl flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">GOMBO ID</p>
                <p className="text-xs font-mono font-black text-[#D4AF37]">{currentUserProfile.uid.slice(0, 10).toUpperCase()}</p>
              </div>
              <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center border border-[#D4AF37]/20">
                <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
              </div>
            </div>
            {currentUserProfile.isPremium && (
              <span className="bg-gradient-to-r from-amber-400 to-yellow-600 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg">
                👑 MEMBRE PREMIUM
              </span>
            )}
          </div>
        </div>

        {/* Identity Details */}
        <div className="px-8 pb-8 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            {/* Avatar Jumbo */}
            <div className="relative shrink-0">
              <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-[#050505] bg-zinc-900 shadow-2xl">
                <img 
                  src={currentUserProfile.avatarUrl || currentUserProfile.photoURL || AVATARS[0]} 
                  alt={currentUserProfile.firstName} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-2xl border-4 border-[#050505] shadow-lg flex items-center justify-center ${
                availabilityStatus === "disponible" ? "bg-emerald-500" : "bg-zinc-600"
              }`}>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>

            {/* Name & Titles */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                  {currentUserProfile.firstName} {currentUserProfile.lastName}
                </h1>
                {currentUserProfile.artistName && (
                  <span className="text-xl font-black text-[#D4AF37] italic">
                    "{currentUserProfile.artistName}"
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-zinc-400">
                <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1 rounded-xl border border-zinc-800">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-bold uppercase">{currentUserProfile.commune || "Cocody"}, {currentUserProfile.ville || "Abidjan"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1 rounded-xl border border-zinc-800">
                  <Briefcase className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-bold uppercase">{currentUserProfile.role || "Musicien"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1 rounded-xl border border-zinc-800">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-bold uppercase">Inscrit en {new Date(currentUserProfile.createdAt).getFullYear()}</span>
                </div>
              </div>
            </div>

            {/* Main Action */}
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => setPanelView("edit")}
                className="flex-1 md:flex-none px-6 py-4 bg-[#D4AF37] hover:bg-amber-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-xl shadow-[#D4AF37]/10"
              >
                Mise à jour Héritage
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 PERFORMANCE & STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Success Rate Widget */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{currentUserProfile.successRate || 85}%</span>
              <span className="text-[8px] font-black text-zinc-500 uppercase">Succès</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Taux de Réussite</h4>
            <p className="text-[10px] text-zinc-500 font-medium uppercase mt-1">Sur {currentUserProfile.gigsCompleted || 0} gombos terminés</p>
          </div>
        </div>

        {/* Financial Growth Chart */}
        <div className="md:col-span-2 bg-zinc-950 border border-zinc-800 rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              Évolution des Revenus
            </h4>
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-lg border border-emerald-400/20">
              +{currentUserProfile.revenueGrowth || 12}% Ce mois
            </span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#D4AF37" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 🎖️ BADGES & ACHIEVEMENTS */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-8 space-y-6">
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <Award className="w-4 h-4 text-[#D4AF37]" />
          Décorations & Médailles d'Héritage
        </h3>
        <div className="flex flex-wrap gap-4">
          {(() => {
            const badges = [
              { label: "Pionnier 2024", icon: "💎", active: true },
              { label: "Talent Certifié", icon: "🛡️", active: currentUserProfile.isCertified },
              { label: "Gombo Master", icon: "🎷", active: (currentUserProfile.gigsCompleted || 0) > 10 },
              { label: "Top Fiabilité", icon: "⚡", active: (currentUserProfile.successRate || 0) > 90 },
              { label: "Elite Gombo", icon: "👑", active: currentUserProfile.isPremium },
            ];
            return badges.map((badge, idx) => (
              <div 
                key={idx}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                  badge.active 
                    ? "bg-[#D4AF37]/5 border-[#D4AF37]/30 text-white" 
                    : "bg-zinc-900/30 border-zinc-800 text-zinc-600 opacity-40 grayscale"
                }`}
              >
                <span className="text-xl">{badge.icon}</span>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-wider">{badge.label}</p>
                  <p className="text-[8px] font-bold text-zinc-500 uppercase">{badge.active ? "Débloqué" : "Verrouillé"}</p>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* 💼 CORE METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Collaborations", val: currentUserProfile.collaborations?.length || 0, icon: Users, color: "text-blue-400" },
          { label: "Opportunités", val: dynamicAppsCount, icon: Target, color: "text-amber-400" },
          { label: "Reputation", val: currentUserProfile.reputation || 4.8, icon: Star, color: "text-yellow-400" },
          { label: "Revenu Total", val: `${(currentUserProfile.totalRevenue || 0).toLocaleString()} F`, icon: DollarSign, color: "text-emerald-400" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-zinc-950 border border-zinc-800 p-6 rounded-[2rem] space-y-2 group hover:border-[#D4AF37]/50 transition-colors">
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
            <div className="space-y-0.5">
              <p className="text-2xl font-black text-white font-mono">{stat.val}</p>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 📜 SKILLS & STYLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-8 space-y-6">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Arsenal Artistique
          </h3>
          <div className="flex flex-wrap gap-2">
            {[...(currentUserProfile.specialties || []), currentUserProfile.mainRole].filter(Boolean).map((spec, i) => (
              <span key={i} className="px-4 py-2 bg-amber-500/5 border border-amber-500/20 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-wider">
                {spec}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-8 space-y-6">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-500" />
            Identité Sonore
          </h3>
          <div className="flex flex-wrap gap-2">
            {(currentUserProfile.genres || []).map((genre, i) => (
              <span key={i} className="px-4 py-2 bg-purple-500/5 border border-purple-500/20 text-purple-400 rounded-xl text-[10px] font-black uppercase tracking-wider">
                {genre}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION MÉDIAS */}
      <MediaGalleryManager
        currentUserProfile={currentUserProfile}
        mediaGallery={mediaGallery}
        onRefresh={onRefreshProfile}
        onSetGallery={setMediaGallery}
      />

      {/* PUBLICATIONS */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">
            Flux d'Actualité ({myPosts.length})
          </h3>
        </div>
        
        {myPosts.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto border border-zinc-800">
              <RefreshCw className="w-6 h-6 text-zinc-700" />
            </div>
            <p className="text-xs text-zinc-500 font-bold italic uppercase">Aucune publication d'héritage.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myPosts.map((post) => (
              <div 
                key={post.id} 
                className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={currentUserProfile.avatarUrl || AVATARS[0]} 
                      className="w-8 h-8 rounded-full border border-zinc-700"
                      alt=""
                    />
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-wider">
                        {currentUserProfile.artistName || currentUserProfile.firstName}
                      </p>
                      <p className="text-[8px] font-mono text-zinc-500">
                        {post.timestamp ? new Date(post.timestamp).toLocaleDateString("fr-FR") : "Récemment"}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans mb-4">
                  {post.content}
                </p>
                <div className="flex gap-4 text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes || 0}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.comments || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
