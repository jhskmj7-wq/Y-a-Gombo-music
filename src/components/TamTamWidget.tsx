import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, Award, Trophy, Compass, MapPin, RefreshCw, 
  ChevronRight, Sparkles, Send, Music, Clock
} from "lucide-react";
import { Gombo, UserProfile } from "../types";

interface TamTamWidgetProps {
  currentUserProfile: UserProfile | null;
  gombos: Gombo[];
  topTalentsList: any[];
  onNavigateView: (view: string, initialTab?: any) => void;
  onOpenPostComposer: () => void;
}

const STATIC_DEFI_LIST = [
  { id: "1", title: "Solo de Clavier Rumba", desc: "Poste une démo 30s de solo de synthétiseur rumba.", points: "+100 PTS", tag: "#DefiRumba" },
  { id: "2", title: "Lead Vocal Zouglou Direct", desc: "Chante un lead vocal d'improvisation Zouglou à cappella.", points: "+120 PTS", tag: "#LeadZouglou" },
  { id: "3", title: "Cover Guitare Afrobeat", desc: "Fais résonner ta guitare solo sur un rythme Afrobeat de 115 BPM.", points: "+100 PTS", tag: "#AfrobeatSolo" },
  { id: "4", title: "Improvisation Beatmaker", desc: "Crée un banger Coupé-Décalé de 30s avec des transitions explosives.", points: "+150 PTS", tag: "#BangerDecale" }
];

export const TamTamWidget: React.FC<TamTamWidgetProps> = ({
  currentUserProfile,
  gombos,
  topTalentsList,
  onNavigateView,
  onOpenPostComposer
}) => {
  const [activeTab, setActiveTab ] = useState<"gombo" | "talent" | "defi" | "nearby">("gombo");
  const [countdown, setCountdown] = useState(45);
  const [defiIndex, setDefiIndex] = useState(0);
  const [talentIndex, setTalentIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-refresh timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerAutoRefresh();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gombos, topTalentsList]);

  const triggerAutoRefresh = () => {
    setIsRefreshing(true);
    // Shuffle selectors to simulate automatic updates
    if (STATIC_DEFI_LIST.length > 0) {
      setDefiIndex((prev) => (prev + 1) % STATIC_DEFI_LIST.length);
    }
    if (topTalentsList.length > 0) {
      setTalentIndex((prev) => (prev + 1) % topTalentsList.length);
    }
    
    setToastMessage("🎼 Le Tam-Tam a résonné : Actualisé en temps réel !");
    setTimeout(() => {
      setIsRefreshing(false);
      setTimeout(() => setToastMessage(null), 3000);
    }, 800);
  };

  // 1. 🔥 GOMBO DU JOUR
  let gomboDuJour: Partial<Gombo> = {
    id: "g-static-1",
    title: "🎖️ Grand Showcase VIP",
    eventType: "Concert",
    budget: 150000,
    commune: "Cocody",
    description: "Urgent: Nous recherchons un pianiste concertiste pro pour accompagner un artiste international sur 3 morceaux Zouglou lounge.",
    date: "Aujourd'hui",
    urgent: true
  };

  const activeGombos = gombos.filter(g => g.status === "publie");
  if (activeGombos.length > 0) {
    // Pick the most urgent or highest budget active gombo
    const sorted = [...activeGombos].sort((a, b) => b.budget - a.budget);
    gomboDuJour = sorted[0];
  }

  // 2. 👑 TALENT DU JOUR
  let talentDuJour = {
    uid: "mus-preset-1",
    artistName: "Manu Beats",
    firstName: "Manuel",
    lastName: "Koffi",
    specialty: "Arrangeur / Beatmaker",
    commune: "Yopougon",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    experience: "Professionnel",
    bio: "Producteur de tubes Coupé-Décalé de haut niveau. Mon studio vous attend."
  };

  if (topTalentsList && topTalentsList.length > 0) {
    const selected = topTalentsList[talentIndex % topTalentsList.length];
    talentDuJour = {
      uid: selected.uid,
      artistName: selected.artistName || `${selected.firstName || ""} ${selected.lastName || ""}`.trim() || "Artiste Gombo",
      firstName: selected.firstName || "",
      lastName: selected.lastName || "",
      specialty: selected.specialty || selected.speciality || "Artiste Musicien",
      commune: selected.commune || "Plateau",
      avatarUrl: selected.avatarUrl || selected.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      experience: selected.experience || "Confirmé",
      bio: selected.bio || "Inscrit sur le réseau Afri pour décrocher les meilleures scènes."
    };
  }

  // 3. 🎯 DÉFI DU GOMBO
  const currentDefi = STATIC_DEFI_LIST[defiIndex];

  // 4. 🌍 GOMBOS PRÈS DE MOI
  const userCommune = currentUserProfile?.commune || "Cocody";
  // Filter published gombos in user's commune
  const nearbyGombos = activeGombos.filter(g => 
    g.commune && g.commune.toLowerCase().includes(userCommune.toLowerCase())
  );

  return (
    <div className="bg-afri-bg-sec border border-[#2B2B2B] rounded-3xl p-5 space-y-4 shadow-xl text-afri-text relative overflow-hidden transition-all duration-300">
      {/* Background glow for premiumness */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-afri-bg-sec/5 blur-2xl rounded-full" />
      
      {/* Header with live and countdown indicator */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] font-mono">🔔 Le Tam-Tam</h4>
            <span className="text-[9px] text-afri-text-sec block font-sans">L'instantané du Showbiz Ivoirien</span>
          </div>
        </div>

        {/* Refresh with Countdown */}
        <button
          onClick={triggerAutoRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] rounded-xl text-[9px] font-black uppercase text-gray-300 tracking-wider transition-all cursor-pointer font-mono border border-white/[0.03]"
          title="Actualiser les ondes"
        >
          <RefreshCw className={`w-3 h-3 text-[#D4AF37] ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{countdown}s</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 p-0.5 bg-afri-bg-sec rounded-2xl border border-afri-border">
        {[
          { id: "gombo", label: "🔥 Gombo", icon: Flame },
          { id: "talent", label: "👑 Talent", icon: Award },
          { id: "defi", label: "🎯 Défi", icon: Trophy },
          { id: "nearby", label: "🌍 Proche", icon: Compass }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`py-2 rounded-xl text-[9px] font-black uppercase flex flex-col items-center gap-1 transition-all cursor-pointer ${
                isActive 
                  ? "bg-afri-bg-sec/10 text-[#D4AF37] border border-[#D4AF37]/20 shadow-xs font-black" 
                  : "text-afri-text-sec hover:text-afri-text hover:bg-white/[0.02]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-1 right-2 left-2 z-10 p-2.5 bg-afri-bg-sec text-black font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 border border-[#b59223]"
          >
            <span>✨</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div className="min-h-[145px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {activeTab === "gombo" && (
            <motion.div
              key="gombo"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="space-y-3.5 py-1"
            >
              <div className="space-y-1 bg-afri-bg-sec p-3 rounded-2xl border border-white/[0.02]">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] font-black uppercase rounded-lg tracking-wider">
                    ⚡ GOMBO DU JOUR
                  </span>
                  <span className="text-[10px] font-black text-[#D4AF37] font-mono">
                    💰 {(gomboDuJour.budget || 0).toLocaleString()} FCFA
                  </span>
                </div>
                <h5 className="font-extrabold text-xs text-afri-text uppercase tracking-tight py-1">
                  {gomboDuJour.title}
                </h5>
                <p className="text-[10px] text-afri-text-sec leading-relaxed line-clamp-2">
                  {gomboDuJour.description}
                </p>
                <div className="flex items-center gap-1 text-[9px] text-[#D4AF37] font-bold pt-1">
                  <MapPin className="w-3 h-3" />
                  <span>📍 {gomboDuJour.commune}</span>
                </div>
              </div>

              <button
                onClick={() => onNavigateView("gombo_list")}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-[#D4AF37] hover:from-amber-600 hover:to-[#b09028] text-black font-black text-[10px] uppercase tracking-wider rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1 transition-all"
              >
                <span>🚀 Décrocher le Cachet !</span>
              </button>
            </motion.div>
          )}

          {activeTab === "talent" && (
            <motion.div
              key="talent"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 py-1"
            >
              <div className="flex items-center gap-3 bg-afri-bg-sec p-3 rounded-2xl border border-white/[0.02]">
                <div className="relative shrink-0">
                  <img
                    src={talentDuJour.avatarUrl}
                    alt={talentDuJour.artistName}
                    className="w-11 h-11 rounded-full object-cover border border-[#D4AF37]/30"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-afri-bg-sec w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px]">
                    ⭐
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 justify-between flex-wrap">
                    <span className="text-[8px] bg-afri-bg-sec/10 text-[#D4AF37] border border-[#D4AF37]/20 px-1.5 py-0.5 rounded font-black uppercase font-mono">
                      Talent Spotlight
                    </span>
                    <span className="text-[9px] font-bold text-[#D4AF37]">
                      {talentDuJour.experience}
                    </span>
                  </div>
                  <h5 className="font-extrabold text-xs text-afri-text truncate uppercase tracking-tight py-0.5">
                    {talentDuJour.artistName}
                  </h5>
                  <span className="text-[9px] text-[#D4AF37] font-semibold flex items-center gap-1 font-sans">
                    🎵 {talentDuJour.specialty}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-afri-text-sec italic line-clamp-1 text-center font-sans">
                &ldquo;{talentDuJour.bio}&rdquo;
              </p>

              <button
                onClick={() => onNavigateView("annuaire")}
                className="w-full py-2 bg-afri-bg-sec hover:bg-afri-bg-sec border border-white/[0.08] text-afri-text hover:text-[#D4AF37] font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-all"
              >
                <span>🔍 Contacter le Talent</span>
              </button>
            </motion.div>
          )}

          {activeTab === "defi" && (
            <motion.div
              key="defi"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="space-y-3.5 py-1"
            >
              <div className="space-y-1.5 bg-afri-bg-sec p-3 rounded-2xl border border-white/[0.02]">
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-black uppercase rounded-lg tracking-wider">
                    🎯 DÉFI GLOBAL DU JOUR
                  </span>
                  <span className="text-[10px] font-black text-purple-400 font-mono">
                    {currentDefi.points}
                  </span>
                </div>
                <h5 className="font-extrabold text-xs text-afri-text uppercase tracking-tight leading-snug">
                  {currentDefi.title}
                </h5>
                <p className="text-[10px] text-afri-text-sec leading-relaxed">
                  {currentDefi.desc} Utilise le tag <strong className="text-[#D4AF37] font-mono">{currentDefi.tag}</strong> !
                </p>
              </div>

              <button
                onClick={() => {
                  onNavigateView("home");
                  onOpenPostComposer();
                }}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-afri-text font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1 transition-all border border-purple-500/20"
              >
                <span>🎤 Relever le Défi (+Points)</span>
              </button>
            </motion.div>
          )}

          {activeTab === "nearby" && (
            <motion.div
              key="nearby"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 py-1 text-center"
            >
              {nearbyGombos.length > 0 ? (
                <div className="space-y-2 max-h-24 overflow-y-auto pr-1">
                  {nearbyGombos.slice(0, 2).map((g) => (
                    <div 
                      key={g.id} 
                      onClick={() => onNavigateView("gombo_list")}
                      className="p-2 bg-afri-bg-sec border border-white/[0.04] rounded-xl flex justify-between items-center cursor-pointer hover:bg-afri-bg-sec hover:border-[#D4AF37]/30 transition-all text-left"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="text-[8px] font-bold text-[#D4AF37] block uppercase">{g.eventType} • {g.date}</span>
                        <h6 className="font-extrabold text-[10.5px] text-afri-text truncate uppercase">{g.title}</h6>
                      </div>
                      <span className="text-[10px] font-black text-[#D4AF37] font-mono whitespace-nowrap">
                        💰 {(g.budget).toLocaleString()} FCFA
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-afri-bg-sec p-4 rounded-2xl border border-afri-border space-y-1">
                  <Compass className="w-5 h-5 mx-auto text-[#D4AF37] animate-pulse" />
                  <p className="text-[10px] font-extrabold uppercase text-afri-text">
                    Secteur {userCommune} Calme
                  </p>
                  <p className="text-[9px] text-afri-text-sec leading-relaxed font-sans">
                    Pas d'offre directe à {userCommune} en ce moment, élargis ton horizon !
                  </p>
                </div>
              )}

              <button
                onClick={() => onNavigateView("gombo_list")}
                className="w-full py-2 bg-afri-bg hover:bg-afri-bg-sec border border-afri-border text-[#D4AF37] hover:text-afri-text font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1"
              >
                <span>🌍 Voir les {activeGombos.length} Gombos d'Abidjan</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Habits prompt footer */}
      <div className="text-[8px] font-mono tracking-wider uppercase text-afri-text-sec flex justify-between items-center mt-1 border-t border-white/[0.04] pt-2">
        <span>📶 Connexion Temps Réel</span>
        <span className="text-[#D4AF37] font-bold animate-pulse font-sans">Une habitude quotidienne, un cachet décroché !</span>
      </div>
    </div>
  );
};
