import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Search, Sliders, Plus, Megaphone, MessageSquare, ShieldCheck, Bell, 
  RefreshCw, Heart, X, Award, Users, Music, QrCode, LifeBuoy,
  PenTool, UserCheck, MessageCircle, History, Headphones, HelpCircle, Video,
  Sparkles, BarChart3
} from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { Gombo, User, Post } from "../types";
import AnnuaireTalents from "./AnnuaireTalents";
import { usePerformance } from "../services/performanceService";

const IVORIAN_COMMUNES = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", 
  "Port-Bouët", "Koumassi", "Adjamé", "Abobo", "Bingerville"
];

const optimizeImageUrl = (url: string, isDataSaveActive: boolean) => {
  if (!url) return url;
  if (isDataSaveActive && url.includes("images.unsplash.com")) {
    return url.replace(/w=\d+/, "w=150").replace(/q=\d+/, "q=30");
  }
  return url;
};

interface UserTerrainLandingPageProps {
  gombos: Gombo[];
  users: User[];
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  globalSearchTerm: string;
  setGlobalSearchTerm: (val: string) => void;
  universalSearchTerm: string;
  setUniversalSearchTerm: (val: string) => void;
  activeMenu: string;
  setActiveMenu: (val: string) => void;
  terrainTab: string;
  setTerrainTab: (val: any) => void;
  currentSlide: number;
  setCurrentSlide: React.Dispatch<React.SetStateAction<number>>;
  likedGombos: string[];
  setLikedGombos: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedLocation: string;
  setSelectedLocation: (val: string) => void;
  selectedType: string;
  setSelectedType: (val: string) => void;
  selectedDateFilter: string;
  setSelectedDateFilter: (val: string) => void;
  setSelectedGomboDetails: (gombo: Gombo | null) => void;
  requireAuthThen: (fn: () => void) => void;
  requireGoogleAuthThen?: (fn: () => void) => void;
  audioSynth: any;
  activeQuickActionModal: string | null;
  setActiveQuickActionModal: (val: string | null) => void;
  verifyGomboIdInput: string;
  setVerifyGomboIdInput: (val: string) => void;
  verifyGomboIdResult: any;
  setVerifyGomboIdResult: (val: any) => void;
  newNoticeTitle: string;
  setNewNoticeTitle: (val: string) => void;
  newNoticeCategory: string;
  setNewNoticeCategory: (val: string) => void;
  newNoticeBody: string;
  setNewNoticeBody: (val: string) => void;
  addToTerminal: (msg: string) => void;
  onValidateFilters?: (cat: string, loc: string, typeVal: string, dateVal: string) => void;
  reelsVideoId?: string | null;
  setReelsVideoId?: (val: string | null) => void;
  reelsVideoUrl?: string | null;
  setReelsVideoUrl?: (val: string | null) => void;
}

export const UserTerrainLandingPage: React.FC<UserTerrainLandingPageProps> = React.memo(({
  gombos,
  users,
  posts,
  setPosts,
  globalSearchTerm,
  setGlobalSearchTerm,
  universalSearchTerm,
  setUniversalSearchTerm,
  setActiveMenu,
  terrainTab,
  setTerrainTab,
  currentSlide,
  setCurrentSlide,
  likedGombos,
  setLikedGombos,
  selectedCategory,
  setSelectedCategory,
  selectedLocation,
  setSelectedLocation,
  selectedType,
  setSelectedType,
  selectedDateFilter,
  setSelectedDateFilter,
  setSelectedGomboDetails,
  requireAuthThen,
  requireGoogleAuthThen,
  audioSynth,
  activeQuickActionModal,
  setActiveQuickActionModal,
  verifyGomboIdInput,
  setVerifyGomboIdInput,
  verifyGomboIdResult,
  setVerifyGomboIdResult,
  newNoticeTitle,
  setNewNoticeTitle,
  newNoticeCategory,
  setNewNoticeCategory,
  newNoticeBody,
  setNewNoticeBody,
  addToTerminal,
  onValidateFilters,
  reelsVideoId = null,
  setReelsVideoId = () => {},
  reelsVideoUrl = null,
  setReelsVideoUrl = () => {}
}) => {
  console.log("UserTerrainLandingPage Hooks initialized");
  const { t } = useLanguage();
  const { isDataSaveActive, areAnimationsReduced } = usePerformance();
  const searchStr = globalSearchTerm.toLowerCase();

  // Mount log
  useEffect(() => {
    console.log("UserTerrainLandingPage Component mounted");
  }, []);

  // Internal local states for filters (only applied when clicking Valider)
  const [localCategory, setLocalCategory] = useState(selectedCategory);
  const [localLocation, setLocalLocation] = useState(selectedLocation);
  const [localType, setLocalType] = useState(selectedType);
  const [localDate, setLocalDate] = useState(selectedDateFilter);

  // Collapsible regions states
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // SWIPEABLE HORIZONTAL MODULES & TABS STATE (Requirement 2)
  const [currentSection, setCurrentSection] = useState<"home" | "reels">("home");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [selectedExploreArtist, setSelectedExploreArtist] = useState<any | null>(null);
  const [reelsFilter, setReelsFilter] = useState("all");
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleTogglePreview = (track: any) => {
    if (playingTrackId === track.id) {
      if (audioElement) {
        audioElement.pause();
      }
      setPlayingTrackId(null);
      // Resume background music if wanted, but simpler to just leave it paused or user toggles it
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      
      // PAUSE BACKGROUND AMBIENT MUSIC TO AVOID DISORGANIZATION
      window.dispatchEvent(new CustomEvent('gombo_music_toggle', { detail: { play: false } }));

      const audio = new Audio(track.url);
      audio.loop = true;
      audio.play().catch(() => {});
      setAudioElement(audio);
      setPlayingTrackId(track.id);
    }
  };

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  const minSwipeDistance = 75;

  const onTouchStartHandler = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMoveHandler = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentSection === "home") {
      setCurrentSection("reels");
      try { audioSynth?.playValidationSuccess(); } catch(_) {}
    }
    if (isRightSwipe && currentSection === "reels") {
      setCurrentSection("home");
      try { audioSynth?.playValidationSuccess(); } catch(_) {}
    }
  };

  // Sync with outside state (e.g. when resetting from parent)
  useEffect(() => {
    setLocalCategory(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    setLocalLocation(selectedLocation);
  }, [selectedLocation]);

  useEffect(() => {
    setLocalType(selectedType);
  }, [selectedType]);

  useEffect(() => {
    setLocalDate(selectedDateFilter);
  }, [selectedDateFilter]);

  // Filter Gombos based on selections
  const GombosToRender = gombos.filter(g => {
    const matchesSearch = !globalSearchTerm || 
      (g.title || "").toLowerCase().includes(searchStr) ||
      (g.description || "").toLowerCase().includes(searchStr) ||
      (g.location || "").toLowerCase().includes(searchStr);

    let matchesCategory = true;
    if (selectedCategory !== "all") {
      const cat = selectedCategory.toLowerCase();
      const txt = ((g.title || "") + " " + (g.description || "")).toLowerCase();
      if (cat === "zouglou") matchesCategory = txt.includes("zouglou");
      else if (cat === "coupé-décalé") matchesCategory = txt.includes("coupé") || txt.includes("décalé") || txt.includes("sheney");
      else if (cat === "rap") matchesCategory = txt.includes("rap") || txt.includes("hip") || txt.includes("beat");
      else if (cat === "traditionnel") matchesCategory = txt.includes("kora") || txt.includes("balafon") || txt.includes("folklore") || txt.includes("sabar");
      else if (cat === "jazz") matchesCategory = txt.includes("jazz") || txt.includes("cabaret") || txt.includes("soul");
    }

    let matchesLocation = true;
    if (selectedLocation !== "all") {
      matchesLocation = (g.location || "").toLowerCase() === selectedLocation.toLowerCase();
    }

    let matchesType = true;
    if (selectedType !== "all") {
      const typeLower = selectedType.toLowerCase();
      const txt = ((g.title || "") + " " + (g.description || "")).toLowerCase();
      if (typeLower === "concert") matchesType = txt.includes("concert") || txt.includes("gala") || txt.includes("festival") || txt.includes("show") || txt.includes("live");
      else if (typeLower === "studio") matchesType = txt.includes("studio") || txt.includes("enregistrement") || txt.includes("cabaret");
      else if (typeLower === "clip") matchesType = txt.includes("clip") || txt.includes("danse") || txt.includes("vidéo") || txt.includes("video");
    }

    let matchesDate = true;
    if (selectedDateFilter !== "all") {
      const df = selectedDateFilter.toLowerCase();
      const gDate = (g.date || "").toLowerCase();
      if (df === "mai 2025") matchesDate = gDate.includes("mai 2025") || gDate.includes("2025-05") || (g.timestamp && g.timestamp.includes("2025-05"));
      else if (df === "juin 2026") matchesDate = gDate.includes("juin 2026") || gDate.includes("2026-06") || (g.timestamp && g.timestamp.includes("2026-06"));
    }

    return matchesSearch && matchesCategory && matchesLocation && matchesType && matchesDate;
  });

  // Spotlight carousel slides matching image
  const spotlightSlides = [
    {
      id: "gombo_spotlight_1",
      title: "CONCERT LIVE",
      description: "Recherche artiste pour concert live à Abidjan.",
      location: "Abidjan, Côte d'Ivoire",
      date: "25 mai 2025",
      budget: "500 000 FCFA",
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
      isPremium: true,
      isNew: true
    },
    {
      id: "gombo_spotlight_2",
      title: "FESTIVAL POP",
      description: "Recherche choristes d'élite et percussionnistes pour Grand Festival.",
      location: "Koumassi, Côte d'Ivoire",
      date: "18 juin 2026",
      budget: "950 000 FCFA",
      imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80",
      isPremium: true,
      isNew: true
    },
    {
      id: "gombo_spotlight_3",
      title: "MARIAGE VIP",
      description: "Prestation de rumba par un orchestre complet.",
      location: "Marcory, Côte d'Ivoire",
      date: "20 juin 2026",
      budget: "1 200 000 FCFA",
      imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
      isPremium: true,
      isNew: false
    }
  ];

  const currentSlideData = spotlightSlides[currentSlide] || spotlightSlides[0];

  // Raw items matching screenshot rows exactly
  const recentOpportunitiesRaw = [
    {
      id: "gombo_recent_1",
      title: "Enregistrement studio",
      description: "Besoin d'un chanteur pour un projet en studio.",
      location: "Yamoussoukro, Côte d'Ivoire",
      budget: "200 000 FCFA",
      date: "20 mai 2025",
      imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
      isNew: true,
      isPremium: false
    },
    {
      id: "gombo_recent_2",
      title: "Danseurs pour clip vidéo",
      description: "Recherche danseurs professionnels pour clip.",
      location: "Abidjan, Côte d'Ivoire",
      budget: "300 000 FCFA",
      date: "19 mai 2025",
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80",
      isNew: false,
      isPremium: true
    }
  ];

  // Combine items
  const allRecentItems = [
    ...recentOpportunitiesRaw,
    ...GombosToRender.filter(g => g.id !== "gombo_1" && g.id !== "gombo_2" && !g.id?.includes("spotlight")).map(g => ({
      id: g.id || `gombo_${Math.random()}`,
      title: g.title || "Prestation Musicale",
      description: g.description || "Contrat d'artiste de grande envergure.",
      location: `${g.location || "Abidjan"}, Côte d'Ivoire`,
      budget: `${(g.budget || 250000).toLocaleString("fr-FR")} FCFA`,
      date: g.date || "Immédiat",
      imageUrl: g.imageUrl || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80",
      isNew: g.urgent || false,
      isPremium: g.isBoosted || false
    }))
  ];

  const isLiked = (id: string) => likedGombos.includes(id);
  const toggleLike = (id: string) => {
    setLikedGombos(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    try { audioSynth.playTamTam(false); } catch(_) {}
  };

  return (
    <div 
      onTouchStart={onTouchStartHandler}
      onTouchMove={onTouchMoveHandler}
      onTouchEnd={onTouchEndHandler}
      className="space-y-6 pb-24 text-left animate-fadeIn font-sans"
    >
      
      {/* ==========================================
          1. BARRE DE RECHERCHE UNIVERSELLE
         ========================================== */}
      <div className="relative">
        <div className="flex items-center gap-3 bg-[#050505] border border-[#D4AF37]/30 rounded-3xl p-3 px-4 shadow-[0_2px_15px_rgba(212,175,55,0.05)] focus-within:border-[#D4AF37]/80 transition-all">
          <Search className="w-5 h-5 text-[#D4AF37] shrink-0" />
          <input
            type="text"
            value={globalSearchTerm}
            onChange={(e) => {
              setGlobalSearchTerm(e.target.value);
              setUniversalSearchTerm(e.target.value);
              if (e.target.value.length > 0) {
                try { audioSynth.playTamTam(true); } catch (_) {}
              }
            }}
            placeholder="Rechercher une opportunité, artiste, événement..."
            className="w-full bg-transparent text-[#F5F5F5] font-bold text-sm placeholder-zinc-500 focus:outline-none font-sans"
          />
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSelectedLocation("all");
              setSelectedType("all");
              setSelectedDateFilter("all");
              setGlobalSearchTerm("");
              try { audioSynth.playTamTam(false); } catch (_) {}
            }}
            className="text-[#D4AF37] hover:text-[#F1C40F] transition p-1"
            title="Réinitialiser"
          >
            <Sliders className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Inline Search Results Dropdown Overlay */}
        {globalSearchTerm.trim().length > 0 && (
          <div className="absolute top-14 left-0 right-0 bg-[#050505] border border-[#D4AF37]/30 rounded-2xl p-4 z-50 max-h-72 overflow-y-auto space-y-2.5 shadow-2xl">
            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 font-bold">
              <span>SANS FILTRE (TEMPS RÉEL)</span>
              <button onClick={() => setGlobalSearchTerm("")} className="text-[#D4AF37] font-black uppercase">Fermer</button>
            </div>
            {GombosToRender.slice(0, 5).map((g, i) => (
              <div
                key={g.id || i}
                onClick={() => {
                  setSelectedGomboDetails(g);
                  setGlobalSearchTerm("");
                }}
                className="p-2 hover:bg-zinc-900 rounded-xl cursor-pointer flex justify-between items-center transition"
              >
                <div className="text-left">
                  <span className="text-xs text-zinc-100 font-bold block truncate max-w-[200px]">{g.title}</span>
                  <span className="text-[9.5px] text-[#D4AF37] font-mono leading-none">📍 {g.location} • {(g.budget || 0).toLocaleString("fr-FR")} FCFA</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold shrink-0">Ouvrir →</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==========================================
          SEGMENTED NAVIGATION & DRAG GUIDE (Requirement 2)
         ========================================== */}
      <div className="flex justify-center items-center gap-1.5 p-1 bg-[#111113]/85 border border-zinc-900 rounded-2xl w-fit mx-auto shadow-[0_4px_20px_rgba(0,0,0,0.5)] select-none">
        <button
          onClick={() => {
            setCurrentSection("home");
            try { audioSynth?.playTamTam?.(false); } catch(_) {}
          }}
          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
            currentSection === "home"
              ? "bg-[#D4AF37] text-black shadow-md scale-[1.02]"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
          }`}
        >
          <span>🌟 Tendances & Gombos</span>
        </button>
        <button
          onClick={() => {
            setCurrentSection("reels");
            try { audioSynth?.playTamTam?.(false); } catch(_) {}
          }}
          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 cursor-pointer relative ${
            currentSection === "reels"
              ? "bg-[#D4A017] text-black shadow-md scale-[1.02]"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
          }`}
        >
          <span>🔥 Fil Réels</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        </button>
      </div>

      <div className="text-center text-[8.5px] font-mono tracking-wider font-extrabold text-zinc-600 uppercase flex items-center justify-center gap-1 sm:hidden select-none -translate-y-2 mt-1">
        {currentSection === "home" ? (
          <>
            <span>Faites glisser vers la droite</span>
            <span className="text-[#D4AF37] animate-pulse">➔</span>
            <span>pour les réels</span>
          </>
        ) : (
          <>
            <span className="text-[#D4AF37] animate-pulse">◀</span>
            <span>Faites glisser vers la gauche pour revenir</span>
          </>
        )}
      </div>

      {currentSection === "home" ? (
        <>
          {/* ==========================================
              2. ACTIONS RAPIDES (STYLE PREMIUM AFRIGOMBO)
             ========================================== */}
      <div className={`bg-[#111113]/30 border border-zinc-900 rounded-2xl transition-all duration-300 ${isQuickActionsOpen ? "p-3.5 space-y-3" : "py-2 px-3"}`}>
        <button
          onClick={() => {
            setIsQuickActionsOpen(!isQuickActionsOpen);
            try { audioSynth?.playTamTam?.(false); } catch(_) {}
          }}
          className="w-full flex justify-between items-center text-left focus:outline-none cursor-pointer hover:opacity-90 select-none"
        >
          <h3 className="text-[11px] font-sans font-black tracking-widest text-[#FFFFFF] uppercase flex items-center gap-1.5">
            <span>⚡ ACTIONS RAPIDES</span>
          </h3>
          <span className="text-[11px] font-mono font-black text-[#D4AF37] bg-zinc-950/80 border border-[#D4AF37]/20 w-6 h-6 rounded-lg flex items-center justify-center transition-all">
            {isQuickActionsOpen ? "▲" : "▼"}
          </span>
        </button>

        <div
          className={`transition-all duration-300 ease-in-out origin-top overflow-hidden ${
            isQuickActionsOpen ? "max-h-[500px] opacity-100 mt-2.5" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
            initial="hidden"
            animate={isQuickActionsOpen ? "show" : "hidden"}
            className="grid grid-cols-4 gap-1.5 w-full select-none"
          >
             {[
              { id: "renfort", label: "Renfort", icon: ShieldCheck, isSoon: false, action: () => requireAuthThen(() => { setActiveMenu("user_renforts"); try { audioSynth?.playValidationSuccess(); } catch (_) {} }) },
              { id: "publier", label: t('publier'), icon: PenTool, isSoon: false, action: () => requireAuthThen(() => { setActiveMenu("user_publish"); try { audioSynth?.playValidationSuccess(); } catch (_) {} }) },
              { id: "messages", label: t('messages_tab'), icon: MessageCircle, isSoon: false, action: () => requireAuthThen(() => { setActiveMenu("user_messages"); try { audioSynth?.playValidationSuccess(); } catch (_) {} }) },
              { id: "annuaire", label: t('annuaire'), icon: Users, isSoon: false, action: () => requireAuthThen(() => { setActiveMenu("user_ecosystem"); try { audioSynth?.playValidationSuccess(); } catch (_) {} }) },
              { id: "booster", label: t('booster_tab'), icon: Award, isSoon: false, action: () => requireAuthThen(() => { setActiveMenu("user_renforts"); try { audioSynth?.playValidationSuccess(); } catch (_) {} }) },
              { id: "gombo_plus", label: "⭐ Plus", icon: Sparkles, isSoon: false, action: () => requireAuthThen(() => { setActiveMenu("user_gombo_plus"); try { if (window.dispatchEvent) window.dispatchEvent(new CustomEvent('gombo_play_sound', { detail: { name: 'premium' } })); } catch (_) {} }) },
              { id: "gombo_stats", label: "📊 Portfolio", icon: BarChart3, isSoon: false, action: () => requireAuthThen(() => { setActiveMenu("user_gombo_stats"); try { if (window.dispatchEvent) window.dispatchEvent(new CustomEvent('gombo_play_sound', { detail: { name: 'saxophone' } })); } catch (_) {} }) }
            ].map(action => {
              const Icon = action.icon;
              if (action.isSoon) {
                return (
                  <motion.div
                    key={action.id}
                    variants={{
                      hidden: { opacity: 0, y: 15, scale: 0.95 },
                      show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } }
                    }}
                    className="bg-[#050505] border border-[#D4AF37]/10 opacity-50 rounded-lg p-1.5 flex flex-col items-center justify-center gap-1 cursor-not-allowed relative group"
                    title="Bientôt disponible"
                  >
                    {/* SOON Badge */}
                    <span className="absolute top-0.5 right-0.5 text-[5.5px] font-bold bg-[#D4AF37] text-black px-1 rounded uppercase tracking-wider scale-95 origin-top-right">
                      SOON
                    </span>
                    
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-[#D4AF37]/10 flex items-center justify-center bg-transparent shrink-0">
                      <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4AF37]/40" strokeWidth={1.5} />
                    </div>
                    <span className="text-[6.5px] sm:text-[7.5px] text-[#F5F5F5]/60 font-bold tracking-wider text-center leading-none truncate w-full px-0.5">{action.label}</span>
                  </motion.div>
                );
              }
              
              return (
                <motion.div
                  key={action.id}
                  variants={{
                    hidden: { opacity: 0, y: 15, scale: 0.95 },
                    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } }
                  }}
                  whileHover={{
                    scale: 1.03,
                    borderColor: "rgba(212,175,55,0.7)",
                    boxShadow: "0 0 10px rgba(212,175,55,0.2)"
                  }}
                  whileTap={{ scale: 0.96 }}
                  onClick={action.action}
                  className="bg-[#050505] border border-[#D4AF37]/30 shadow-[0_2px_10px_rgba(212,175,55,0.05)] rounded-lg p-1.5 flex flex-col items-center justify-center gap-1 hover:bg-[#D4AF37]/5 transition-all cursor-pointer"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-[#D4AF37]/30 flex items-center justify-center bg-transparent shrink-0">
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4AF37]" strokeWidth={1.5} />
                  </div>
                  <span className="text-[6.5px] sm:text-[7.5px] text-[#F5F5F5] font-bold tracking-wider text-center leading-none truncate w-full px-0.5">{action.label}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ==========================================
          3. FILTRES RAPIDES ET RECHERCHE AVANCÉE (HIDDEN AS REQUESTED)
         ========================================== */}
      {/* Search block completely removed to save space */}

      {/* ==========================================
          4. OPPORTUNITÉS À LA UNE (SPOTLIGHT)
         ========================================== */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <h3 className="text-[11px] font-sans font-black tracking-widest text-[#FFFFFF] uppercase">
            {t('opportunites_une')}
          </h3>
          <button
            onClick={() => {
              setGlobalSearchTerm("");
              setSelectedCategory("all");
              try { audioSynth.playTamTam(false); } catch (_) {}
            }}
            className="text-xs text-[#D4AF37] font-bold"
          >
            {t('voir_tout')}
          </button>
        </div>

        {/* Feature Spotlight Card banner */}
        <div className="relative h-[220px] rounded-[24px] overflow-hidden group shadow-2xl border border-zinc-900">
          <img
            src={optimizeImageUrl(currentSlideData.imageUrl, isDataSaveActive)}
            alt={currentSlideData.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/25" />

          {/* Content overlay */}
          <div className="absolute inset-0 p-5 flex flex-col justify-between text-left">
            <div className="flex justify-between items-start">
              {currentSlideData.isPremium && (
                <span className="text-[9.5px] font-bold bg-[#D4AF37] text-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center shadow-md font-sans">
                  ★ PREMIUM
                </span>
              )}
              <button
                onClick={() => toggleLike(currentSlideData.id)}
                className="text-white hover:text-red-500 transition-colors p-1"
                title="S'allier"
              >
                <Heart className={`w-5 h-5 ${isLiked(currentSlideData.id) ? "fill-[#D4AF37] text-[#D4AF37]" : "text-white"}`} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white tracking-wider font-sans">
                  {currentSlideData.title}
                </h2>
                <p className="text-xs text-white/95 line-clamp-1">
                  {currentSlideData.description}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-white/70 font-mono">
                  <span>📍 {currentSlideData.location}</span>
                  <span>📅 {currentSlideData.date}</span>
                </div>
              </div>

              {/* Price and Action button */}
              <div className="flex justify-between items-end border-t border-white/10 pt-2.5">
                <div>
                  <span className="text-[8px] uppercase text-white/50 tracking-wider block font-mono">Paiement</span>
                  <span className="text-[15px] font-bold text-[#D4AF37]">{currentSlideData.budget}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      try { audioSynth.playValidationSuccess(); } catch(_) {}
                      const matchingReal = gombos.find(g => g.id === "gombo_1") || gombos[0];
                      setSelectedGomboDetails(matchingReal);
                    }}
                    className="px-3.5 py-1.5 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black text-[9.5px] font-bold rounded-lg transition uppercase duration-150"
                  >
                    DÉTAILS
                  </button>
                  {currentSlideData.isNew && (
                    <span className="text-[8px] font-bold bg-[#050505] border border-emerald-500/25 text-emerald-400 px-2 py-1 rounded uppercase tracking-wider font-mono">
                      NOUVEAU
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel slide indicators */}
        <div className="flex justify-center gap-1.5 mt-2">
          {spotlightSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentSlide(idx);
                try { audioSynth.playTamTam(false); } catch (_) {}
              }}
              className={`h-1.5 transition-all rounded-full ${
                currentSlide === idx ? "w-5 bg-[#D4AF37]" : "w-1.5 bg-zinc-700/80 hover:bg-zinc-650"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ==========================================
          5. OPPORTUNITÉS RÉCENTES (HORIZONTAL ROWS)
         ========================================== */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <h3 className="text-[11px] font-sans font-black tracking-widest text-[#FFFFFF] uppercase">
            {t('recents')}
          </h3>
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSelectedLocation("all");
              try { audioSynth.playTamTam(false); } catch (_) {}
            }}
            className="text-xs text-[#D4AF37] font-bold"
          >
            Voir tout
          </button>
        </div>

        {/* List representation matches physical drawing on photo */}
        <div className="space-y-3.5">
          {allRecentItems.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#050505] border border-[#D4AF37]/20 text-[#D4AF37]/60 text-xs font-mono shadow-[0_2px_15px_rgba(212,175,55,0.03)]">
              Aucune opportunité récente pour vos filtres sélectionnés.
            </div>
          ) : (
            allRecentItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex bg-[#050505] border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 rounded-2xl p-3 items-center gap-3 transition-colors shadow-[0_2px_15px_rgba(212,175,55,0.05)] cursor-pointer relative group"
              >
                {/* Left Thumbnail with Gold G logo overlay */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#050505] border border-[#D4AF37]/30 flex items-center justify-center">
                  <img
                    src={optimizeImageUrl(item.imageUrl, isDataSaveActive)}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 left-1 w-4.5 h-4.5 bg-[#D4AF37]/95 border border-black rounded-full flex items-center justify-center shadow">
                    <span className="text-[7.5px] font-black text-black">G</span>
                  </div>
                </div>

                {/* Right detail text & Heart icon aligns */}
                <div className="flex-1 min-w-0 h-full flex flex-col justify-between py-0.5">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.isNew && (
                          <span className="text-[7px] font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                            NOUVEAU
                          </span>
                        )}
                        {item.isPremium && (
                          <span className="text-[7px] font-bold bg-[#D4AF37]/10 border border-[#D4AF37]/35 text-[#D4AF37] px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                            PREMIUM
                          </span>
                        )}
                      </div>
                      
                      <h4
                        onClick={() => {
                          try { audioSynth.playTamTam(false); } catch(_) {}
                          const foundReal = gombos.find(g => g.id === item.id) || gombos[0];
                          setSelectedGomboDetails(foundReal);
                        }}
                        className="text-xs font-black text-white hover:text-zinc-300 transition-all cursor-pointer tracking-wide mt-1 truncate max-w-[190px] sm:max-w-xs uppercase"
                      >
                        {item.title}
                      </h4>
                      
                      <p className="text-[9.5px] text-zinc-400 truncate max-w-[190px] sm:max-w-xs mt-0.5 font-sans leading-none">
                        {item.description}
                      </p>
                    </div>

                    {/* Heart button */}
                    <button
                      onClick={() => toggleLike(item.id)}
                      className="text-zinc-500 hover:text-white transition p-1 shrink-0"
                    >
                      <Heart className={`w-4 h-4 ${isLiked(item.id) ? "fill-[#D4AF37] text-[#D4AF37]" : "text-zinc-500"}`} />
                    </button>
                  </div>

                  {/* Location under description */}
                  <div className="flex justify-between items-end mt-2 pt-1.5 border-t border-zinc-900/40">
                    <span className="text-[9px] text-zinc-500 font-medium font-sans">
                      📍 {item.location}
                    </span>

                    {/* Budget & Date beneath it */}
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#D4AF37] block leading-none">
                        {item.budget}
                      </span>
                      <span className="text-[8px] text-zinc-500 font-mono tracking-tight block mt-0.5 leading-none">
                        {item.date}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      </>
      ) : (
        <div className="space-y-6 animate-fadeIn pb-12 select-none text-left">
          {/* Header Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent border border-[#D4AF37]/25 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />
            <h2 className="text-sm font-sans font-black uppercase tracking-wider text-white">
              📱 L'ÉCHO DU SHOWBIZ & RÉELS
            </h2>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Découvrez en continu les performances, démos d'orchestres, extraits audios et actualités chaudes de nos maîtres de la scène d'Afrique de l'Ouest.
            </p>
          </div>

          {/* Reels Filter categories */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
            {[
              { id: "all", label: "✨ Tout", icon: "💎" },
              { id: "videos", label: "🎥 Vidéos", icon: "🎬" },
              { id: "audios", label: "🎵 Extraits Audios", icon: "🎧" },
              { id: "murmures", label: "💬 Murmures", icon: "🎤" },
              { id: "alliances", label: "🏆 Certifications & Actus", icon: "🤝" }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => {
                  setReelsFilter(pill.id);
                  try { audioSynth?.playTamTam?.(false); } catch(_) {}
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition shrink-0 flex items-center gap-1 cursor-pointer border ${
                  reelsFilter === pill.id
                    ? "bg-[#D4AF37] text-white border-[#D4AF37] shadow-sm scale-105"
                    : "bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white"
                }`}
              >
                <span>{pill.icon}</span>
                <span>{pill.label}</span>
              </button>
            ))}
          </div>

          {/* Feed Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. MOCK INTEGRATED REELS (VIDEOS) */}
            {(reelsFilter === "all" || reelsFilter === "videos") && (
              [
                {
                  id: "vid_1",
                  title: "Improvisation Solo d'Orchestre guitare - Live Cocody",
                  artistName: "Yoro l'Américain",
                  specialty: "Guitariste lead",
                  avatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200",
                  videoUrl: "https://www.youtube.com/watch?v=kY9v4CGr7O8",
                  uid: "mus1",
                  likes: 245,
                  views: "1.2K"
                },
                {
                  id: "vid_2",
                  title: "Vocalises mystiques A Capella - Répétition Matinale",
                  artistName: "Fanta D'Abobo",
                  specialty: "Chanteuse Lead",
                  avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200",
                  videoUrl: "https://www.youtube.com/watch?v=F384u51vB8w",
                  uid: "mus2",
                  likes: 189,
                  views: "930"
                },
                {
                  id: "vid_3",
                  title: "Démonstration Saxophone Jazz - INSAAC prestige session",
                  artistName: "Marius Bébé Sax",
                  specialty: "Saxophoniste pro",
                  avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200",
                  videoUrl: "https://www.youtube.com/watch?v=33K-gLREi1o",
                  uid: "mus3",
                  likes: 312,
                  views: "1.8K"
                }
              ].map(reel => {
                const isYt = reel.videoUrl && (reel.videoUrl.includes("youtube.com") || reel.videoUrl.includes("youtu.be"));
                const getRegYId = () => {
                  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                  const match = reel.videoUrl.match(regExp);
                  return (match && match[2].length === 11) ? match[2] : null;
                };
                const yId = isYt ? getRegYId() : null;

                return (
                  <motion.div
                    key={reel.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: "linear-gradient(180deg, rgba(20,20,20,0.95), rgba(10,10,10,1))",
                      borderRadius: "24px",
                      border: "1px solid rgba(212,160,23,0.2)",
                      boxShadow: "0 0 30px rgba(212,160,23,0.08)",
                    }}
                    className="p-4 space-y-3 relative overflow-hidden group transition-all"
                  >
                    {/* Top Creator Info */}
                    <div className="flex items-center justify-between">
                      <div 
                        onClick={() => {
                          const matchedUser = users.find(u => u.uid === reel.uid || u.artistName === reel.artistName);
                          if (matchedUser) {
                            setSelectedExploreArtist(matchedUser);
                          } else {
                            // Seeded fallbacks
                            setSelectedExploreArtist({
                              uid: reel.uid,
                              firstName: reel.artistName.split(" ")[0],
                              lastName: reel.artistName.split(" ").slice(1).join(" ") || "Artiste",
                              artistName: reel.artistName,
                              commune: "Cocody",
                              experience: "Professionnel",
                              specialty: reel.specialty,
                              bio: "Répéteur professionnel d'orchestre, disponible pour vos prestations et mariages à Abidjan.",
                              role: "musicien",
                              isAvailableNow: true
                            } as any);
                          }
                          try { audioSynth?.playValidationSuccess?.(); } catch(_) {}
                        }}
                        className="flex items-center gap-2 cursor-pointer hover:opacity-85"
                      >
                        <img src={reel.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-[rgba(212,160,23,0.25)] object-cover" />
                        <div>
                          <h4 className="text-[11px] font-bold text-[#FFFFFF] uppercase leading-none">{reel.artistName}</h4>
                          <span className="text-[8.5px] text-[#B8B8B8] font-medium font-mono block mt-0.5">{reel.specialty}</span>
                        </div>
                      </div>
                      <span className="text-[8px] font-mono p-1 px-2 rounded-md bg-[#D4A017]/10 border border-[#D4A017]/20 text-[#D4A017] font-black uppercase">RÉEL DÉMO</span>
                    </div>

                    {/* Thumbnail video player click zone */}
                    <div className="relative aspect-video rounded-xl bg-black border border-[rgba(212,160,23,0.25)] overflow-hidden group flex items-center justify-center cursor-pointer shadow-inner">
                      <img 
                        src={`https://img.youtube.com/vi/${yId}/${isDataSaveActive ? "mqdefault" : "hqdefault"}.jpg`} 
                        alt="Thumbnail" 
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition duration-500" 
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all duration-500 pointer-events-none" />
                      
                      <button
                        onClick={() => {
                          if (isYt && yId) {
                            setReelsVideoId(yId);
                          }
                          try { audioSynth?.playValidationSuccess(); } catch(_) {}
                        }}
                        className="w-14 h-14 rounded-full bg-black border-2 border-[#D4A017] text-[#D4A017] flex items-center justify-center cursor-pointer hover:bg-[#D4A017] hover:text-black hover:scale-110 transition-all shadow-[0_0_20px_rgba(212,160,23,0.4)] relative z-10"
                      >
                        <span className="translate-x-0.5 text-xl">▶</span>
                      </button>
                      <span className="absolute bottom-2 right-2 text-[9px] font-mono bg-[#0A0A0A]/90 border border-[#D4A017]/30 px-2 py-1 rounded text-[#D4A017] uppercase tracking-wider font-bold">Vidéo HQ</span>
                    </div>

                    {/* Interactions summary */}
                    <div className="pt-2">
                      <p className="text-[10.5px] font-sans font-bold text-[#FFFFFF] mb-3">{reel.title}</p>
                      
                      {/* Premium Interaction Buttons */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                         <button className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-[#0A0A0A] border border-[rgba(212,160,23,0.25)] hover:bg-[#D4A017]/10 transition-colors text-[9px] font-bold text-[#B8B8B8] hover:text-[#FFFFFF] uppercase tracking-wider">
                           <span className="text-[#D4A017] text-xs">❤️</span> <span className="truncate">J'honore</span>
                         </button>
                         <button className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-[#0A0A0A] border border-[rgba(212,160,23,0.25)] hover:bg-[#D4A017]/10 transition-colors text-[9px] font-bold text-[#B8B8B8] hover:text-[#FFFFFF] uppercase tracking-wider">
                           <span className="text-[#D4A017] text-xs">💬</span> <span className="truncate">Palabres</span>
                         </button>
                         <button className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-[#0A0A0A] border border-[rgba(212,160,23,0.25)] hover:bg-[#D4A017]/10 transition-colors text-[9px] font-bold text-[#B8B8B8] hover:text-[#FFFFFF] uppercase tracking-wider">
                           <span className="text-[#D4A017] text-xs">🔁</span> <span className="truncate">Transmettre</span>
                         </button>
                         <button className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-[#0A0A0A] border border-[rgba(212,160,23,0.25)] hover:bg-[#D4A017]/10 transition-colors text-[9px] font-bold text-[#B8B8B8] hover:text-[#FFFFFF] uppercase tracking-wider">
                           <span className="text-[#D4A017] text-xs">🤝</span> <span className="truncate">Collaborer</span>
                         </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}

            {/* 2. MUSIC EXTRAITS AUDIOS (Requirement 2 & Background Play integration) */}
            {(reelsFilter === "all" || reelsFilter === "audios") && (
              [
                {
                  id: "track_101",
                  title: "Extrait Orchestre Rumba - Solo Rythmique Live",
                  artistName: "Yoro l'Américain",
                  specialty: "Guitare Soliste",
                  avatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200",
                  uid: "mus1",
                  url: "https://assets.mixkit.co/music/preview/mixkit-african-spirit-140.mp3",
                  duration: "1:42",
                  claps: 145
                },
                {
                  id: "track_102",
                  title: "Chant d'Adoration Gospel - Chœur d'Abidjan",
                  artistName: "Fanta D'Abobo",
                  specialty: "Voix d'Or",
                  avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200",
                  uid: "mus2",
                  url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Ketsa/The_Lost_Files/Ketsa_-_04_-_Soul_Searching.mp3",
                  duration: "2:15",
                  claps: 232
                },
                {
                  id: "track_103",
                  title: "Lounge d'Ivoire - Saxophone Acoustique Impromptu",
                  artistName: "Marius Bébé Sax",
                  specialty: "Saxophoniste INSAAC",
                  avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200",
                  uid: "mus3",
                  url: "https://assets.mixkit.co/music/preview/mixkit-tribal-rhythm-263.mp3",
                  duration: "1:55",
                  claps: 198
                }
              ].map(track => {
                const isActive = playingTrackId === track.id;

                return (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3 hover:border-[#D4AF37]/45 transition shadow-md relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        onClick={() => {
                          const matchedUser = users.find(u => u.uid === track.uid);
                          if (matchedUser) setSelectedExploreArtist(matchedUser);
                        }}
                        className="flex items-center gap-2 cursor-pointer hover:opacity-85"
                      >
                        <img src={track.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-zinc-800" />
                        <div>
                          <strong className="text-[11px] text-white uppercase font-black leading-none block">{track.artistName}</strong>
                          <span className="text-[8px] text-zinc-500 font-mono tracking-wider font-extrabold uppercase block mt-0.5">{track.specialty}</span>
                        </div>
                      </div>
                      <span className="text-[8px] font-mono p-1 px-2 rounded bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] font-black uppercase">AUDIO PRESTIGE</span>
                    </div>

                    {/* Audio Player Row */}
                    <div className="p-3.5 rounded-xl bg-black/60 border border-zinc-900 flex items-center justify-between gap-3 relative">
                      {/* Left Play/Pause disk spinner */}
                      <button
                        onClick={() => handleTogglePreview(track)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition ${
                          isActive ? "bg-amber-500 text-black animate-spin-slow" : "bg-zinc-900 text-[#D4AF37] hover:bg-zinc-800"
                        }`}
                      >
                        {isActive ? (
                          <span className="text-xs font-bold font-mono">⏸</span>
                        ) : (
                          <span className="translate-x-0.5 text-sm">▶</span>
                        )}
                      </button>

                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-[10px] text-zinc-100 font-bold truncate leading-snug">{track.title}</p>
                        {/* Golden Reactive Soundwave animation when playing */}
                        {isActive ? (
                          <div className="flex items-end gap-0.5 h-3 mt-1.5 select-none">
                            <span className="w-0.5 bg-[#D4AF37] rounded-sm animate-[bounce-wave_0.7s_infinite_0.1s]" />
                            <span className="w-0.5 bg-[#D4AF37] rounded-sm animate-[bounce-wave_0.7s_infinite_0.3s]" />
                            <span className="w-0.5 bg-[#D4AF37] rounded-sm animate-[bounce-wave_0.7s_infinite_0.5s]" />
                            <span className="w-0.5 bg-[#D4AF37] rounded-sm animate-[bounce-wave_0.7s_infinite_0.2s]" />
                            <span className="w-0.5 bg-[#D4AF37] rounded-sm animate-[bounce-wave_0.7s_infinite_0.4s]" />
                            <span className="w-0.5 bg-amber-600 rounded-sm animate-[bounce-wave_0.7s_infinite_0.1s]" />
                          </div>
                        ) : (
                          <span className="text-[8.5px] text-zinc-600 font-mono tracking-tight block mt-1">Cliquez sur Play pour écouter • Durée : {track.duration}</span>
                        )}
                      </div>

                      {/* Continuous ambiance ambient override button */}
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('gombo_music_toggle', { detail: { play: true } }));
                          addToTerminal("[PRESTIGE] Ambiance musicale générale relancée sur toute l'application.");
                        }}
                        className="p-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded-lg text-[8px] font-mono text-[#D4AF37] font-black uppercase shrink-0"
                        title="Relancer l'ambiance continue en arrière-plan"
                      >
                        📻 Ambiance permanente
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 pt-1">
                      <span>⚡ {track.claps} CLAPS DE FORCE</span>
                      <span className="text-amber-500">🏆 GARANTI SOUVERAIN (NFC/NFC)</span>
                    </div>
                  </motion.div>
                );
              })
            )}

            {/* 3. MURMURES / STATUS DE COMPAGGNIE */}
            {(reelsFilter === "all" || reelsFilter === "murmures") && (
              [
                {
                  id: "mur_1",
                  author: "Yoro l'Américain",
                  text: "Répétition intensive lead guitare de coupés-décalés avec le grand orchestre VIP d'Adjamé. On prépare du lourd pour les mariages de ce week-end à Cocody ! Ambiance zouglou garantie.",
                  avatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200",
                  uid: "mus1",
                  date: "Il y a 2h"
                },
                {
                  id: "mur_2",
                  author: "Fanta D'Abobo",
                  text: "Gloire céleste ! Le gombo ID m'a apporté un immense raccordement pro hier. Merci AFRIGOMBO d'exister et de valoriser notre art vocal sans fuites.",
                  avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200",
                  uid: "mus2",
                  date: "Il y a 5h"
                },
                {
                  id: "mur_3",
                  author: "Marius Bébé Sax",
                  text: "Une alliance signée en toute intimité avec le grand promoteur de Marcory. On va inonder les dîners d'affaires d'Abidjan de mélodies jazzées célestes.",
                  avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200",
                  uid: "mus3",
                  date: "Hier"
                }
              ].map(mur => (
                <motion.div
                  key={mur.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-3 shadow-md border-l-4 border-l-[#D4AF37]"
                >
                  <div className="flex items-center gap-2">
                    <img src={mur.avatar} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-zinc-800" />
                    <div className="flex-1 min-w-0">
                      <strong className="text-[10px] text-white uppercase font-black tracking-tight block truncate">{mur.author}</strong>
                      <span className="text-[7.5px] text-zinc-500 font-mono block leading-none">{mur.date} • Côte d'Ivoire</span>
                    </div>
                    <span className="text-[9px]">💬</span>
                  </div>
                  <p className="text-[10.5px] text-zinc-300 font-sans leading-relaxed font-semibold italic bg-black/40 p-3 rounded-xl border border-zinc-900/60">
                    "{mur.text.normalize("NFC")}"
                  </p>
                  <div className="flex justify-between items-center pt-1 text-[8.5px] font-mono text-zinc-500">
                    <button 
                      onClick={() => {
                        const matchedUser = users.find(u => u.uid === mur.uid);
                        if (matchedUser) setSelectedExploreArtist(matchedUser);
                      }}
                      className="text-[#D4AF37] hover:underline cursor-pointer font-bold uppercase"
                    >
                      Explorer l'univers ➔
                    </button>
                    <span>✓ ACTU SÉCURISÉE</span>
                  </div>
                </motion.div>
              ))
            )}

            {/* 4. ALLIANCES ET CERTIFICATIONS D'ACCORDEMENT */}
            {(reelsFilter === "all" || reelsFilter === "alliances") && (
              [
                {
                  id: "act_1",
                  title: "Vérification officielle réussie",
                  description: "Yom Yoro Sangaré a complété son authentification souveraine et décroché le sésame de Gombo ID d'Abidjan.",
                  badge: "⭐ Maître Souverain Tempéré",
                  type: "cert",
                  icon: "🏆"
                },
                {
                  id: "act_2",
                  title: "Alliance d'Or signée",
                  description: "Une union d'orchestre a été conclue hier soir à Adjamé pour 12 représentations acoustiques.",
                  badge: "🤝 Alliance Scène Pro",
                  type: "alliance",
                  icon: "✨"
                }
              ].map(act => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl relative overflow-hidden flex gap-3.5 shadow-md hover:border-[#D4AF37]/30 transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-lg">
                    {act.icon}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1 text-left">
                    <span className="text-[8.5px] font-mono font-black text-[#D4AF37] uppercase tracking-wider block bg-[#D4AF37]/5 border border-[#D4AF37]/10 px-1.5 py-0.5 rounded w-fit">
                      {act.badge}
                    </span>
                    <h4 className="text-[11px] text-white font-bold uppercase leading-none mt-1">{act.title}</h4>
                    <p className="text-[10px] text-zinc-400 font-medium leading-relaxed font-sans">{act.description}</p>
                  </div>
                </motion.div>
              ))
            )}

          </div>
        </div>
      )}

      {/* ==========================================
          6. SÉCURITÉ ET COPYRIGHT FOOTER
         ========================================== */}
      <footer className="mt-12 border-t border-zinc-900 pt-6 pb-4 space-y-4 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
          <div className="flex gap-4">
            <button onClick={() => setActiveMenu("terms")} className="hover:text-white">CGU</button>
            <span>•</span>
            <button onClick={() => setActiveMenu("privacy")} className="hover:text-white">Confidentialité</button>
          </div>
          <p className="text-zinc-600">© 2026. AFRIGOMBO SHOWBIZ • SOUVERAINETÉ ARTISTIQUE</p>
        </div>
      </footer>

      {/* =========================================================================
          INTERACTIVE ACTIONS MODAL OVERLAYS (SOUVERAIN COMMANDE CENTRE)
         ========================================================================= */}
      {activeQuickActionModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className={`bg-[#050505] border border-[#D4AF37]/35 rounded-3xl p-4 sm:p-6 w-full ${activeQuickActionModal === "search_member" ? "max-w-6xl h-[90vh] overflow-y-auto" : "max-w-md"} my-8 relative overflow-hidden select-none shadow-[0_15px_50px_rgba(0,0,0,0.95)]`}>
            
            <button
              onClick={() => {
                setActiveQuickActionModal(null);
                try { audioSynth.playTamTam(false); } catch (_) {}
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-[#D4AF37] hover:text-white border border-white/5 flex items-center justify-center cursor-pointer transition focus:outline-none z-50"
            >
              <X className="w-4 h-4" />
            </button>

            {/* MODAL I: COMPREHENSIVE TALENTS DIRECTORY OVER INTERNAL MEMBERS */}
            {activeQuickActionModal === "search_member" && (
              <div className="space-y-4 text-left font-sans">
                <div className="pb-2 border-b border-zinc-900">
                  <h3 className="text-sm font-sans font-black tracking-widest text-[#FFFFFF] uppercase flex items-center gap-2">
                    👥 RECHERCHER ET DÉCOUVRIR UN MAÎTRE DE SCÈNE
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Sélecteur de performance certifié d'Afrique de l'Ouest. Explorez librement leur parcours en toute confidentialité.</p>
                </div>
                <div className="bg-[#0b0b0c] p-2 rounded-2xl border border-zinc-900/60 transition-all">
                  <AnnuaireTalents
                    currentUserProfile={users.find(u => u.uid === "logged_in_uid") as any || null}
                    onNavigateView={(view) => {
                      if (view === "home") {
                        setActiveQuickActionModal(null);
                      }
                    }}
                    onSelectTalent={(uid) => {
                      // Handled within directory view
                    }}
                  />
                </div>
              </div>
            )}

            {/* MODAL II: VERIFIER GOMBO ID SÉCURISÉ */}
            {activeQuickActionModal === "verify_gombo_id" && (
              <div className="space-y-4 text-left">
                <div>
                  <h3 className="text-sm font-sans font-black tracking-widest text-[#FFFFFF] uppercase flex items-center gap-2">
                    🛡️ VÉRIFICATION ACADÉMIQUE DU COMPTE
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Vérification de l'intégrité nationale des musiciens.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: GMB-4859-CI"
                      value={verifyGomboIdInput}
                      onChange={(e) => setVerifyGomboIdInput(e.target.value)}
                      className="flex-1 bg-black border border-zinc-800 text-xs text-[#D4AF37] p-2.5 rounded-xl font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const verifiedUser = users.find(u => u.kycStatus === "approved" || u.isCertified);
                        if (verifyGomboIdInput.trim().length > 3 && verifiedUser) {
                          setVerifyGomboIdResult({
                            success: true,
                            artisticName: verifiedUser.artisticName,
                            name: verifiedUser.name,
                            commune: verifiedUser.commune,
                            score: 96,
                            status: "PRESTIGE NATIONAL SÉCURISÉ"
                          });
                          addToTerminal(`[SÉCURITÉ] Vérification d'intégrité réussie pour ${verifyGomboIdInput}`);
                        } else {
                          setVerifyGomboIdResult({
                            success: false,
                            message: "ID non attribué. Aucun enregistrement d'or correspondant."
                          });
                        }
                        try { audioSynth.playTamTam(true); } catch (_) {}
                      }}
                      className="bg-[#D4AF37] text-black px-4 text-xs font-bold rounded-xl"
                    >
                      Valider
                    </button>
                  </div>

                  {verifyGomboIdResult && (
                    <div className="p-4 bg-black border border-zinc-800 rounded-xl space-y-1">
                      {verifyGomboIdResult.success ? (
                        <>
                          <span className="text-[9.5px] font-mono text-emerald-400 uppercase font-black">✓ COMPTE RECONNU INTÈGRE</span>
                          <p className="text-xs text-white font-bold">{verifyGomboIdResult.artisticName} ({verifyGomboIdResult.name})</p>
                          <p className="text-[10px] text-zinc-400">Score d'Afrique de l'Ouest : <span className="text-[#D4AF37] font-bold">{verifyGomboIdResult.score}% garantis</span></p>
                        </>
                      ) : (
                        <p className="text-xs text-red-400 font-semibold">✗ {verifyGomboIdResult.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODAL III: PROPAGE LE TAM-TAM (NOTIFICATION BANNER CANAL) */}
            {activeQuickActionModal === "send_notification" && (
              <div className="space-y-4 text-left">
                <div>
                  <h3 className="text-sm font-sans font-black tracking-widest text-[#FFFFFF] uppercase">
                    📢 DIFFUSER URGENCE NATIONALE
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">Transmettre par vibration sonore de Tam-tam sur le Terrain.</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-550 uppercase font-black">Sujet principal</label>
                    <input
                      type="text"
                      placeholder="Ex: Session acoustique studio urgente"
                      value={newNoticeTitle}
                      onChange={(e) => setNewNoticeTitle(e.target.value)}
                      className="w-full bg-black border border-zinc-800 text-xs text-white p-2.5 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-[#D4AF37] uppercase font-black">Intensité</label>
                    <select
                      value={newNoticeCategory}
                      onChange={(e) => setNewNoticeCategory(e.target.value)}
                      className="w-full bg-black border border-zinc-800 text-xs text-[#D4AF37] p-2.5 rounded-xl focus:outline-none font-bold"
                    >
                      <option value="INFO">INFORMATION générale</option>
                      <option value="URGENT">URGENT (Alerte vibration rouge)</option>
                      <option value="BUZZ">ACTUS SCÈNES (Grande clameur)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-550 uppercase font-black">Annonce</label>
                    <textarea
                      rows={3}
                      placeholder="Quel est le message pour la communauté ?"
                      value={newNoticeBody}
                      onChange={(e) => setNewNoticeBody(e.target.value)}
                      className="w-full bg-black border border-zinc-800 text-xs text-white p-2.5 rounded-xl focus:outline-none font-sans"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (newNoticeTitle && newNoticeBody) {
                        const newNoticePost: Post = {
                          id: `post_${Date.now()}`,
                          userId: "user_pro",
                          authorName: "Annonce Souveraine",
                          authorArtisticName: `TRÔNE [${newNoticeCategory}]`,
                          content: `📣 [${newNoticeTitle.toUpperCase()}] : ${newNoticeBody}`,
                          likes: 12,
                          comments: 0
                        };
                        setPosts(prev => [newNoticePost, ...prev]);
                        addToTerminal(`[DIFFUSION] Publication réussie sur le Terrain : ${newNoticeTitle}`);
                        setActiveQuickActionModal(null);
                        try { audioSynth.playTamTam(true); } catch (_) {}
                      } else {
                        addToTerminal("[ERREUR] Veuillez remplir l'annonce souveraine.");
                      }
                    }}
                    className="w-full py-2.5 bg-[#D4AF37] text-black font-black text-xs rounded-xl hover:opacity-90 transition uppercase font-sans tracking-widest mt-1"
                  >
                    Lancer la propagation ⚡
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
});
