import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Sliders, Plus, Megaphone, MessageSquare, ShieldCheck, Bell, 
  RefreshCw, Heart, X, Award, Users, Music, QrCode, LifeBuoy,
  PenTool, UserCheck, MessageCircle, History, Headphones, HelpCircle, Video,
  Sparkles, BarChart3, FileSignature, Zap, Play
} from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { Gombo, User, Post, Renfort } from "../types";
import AnnuaireTalents from "./AnnuaireTalents";
import { usePerformance } from "../services/performanceService";
import { globalAudioManager } from "../lib/audioManager";
import PremiumEmptyState from "./PremiumEmptyState";
import { useAuth } from "../AuthContext";
import { db } from "../lib/firebase";
import { gomboDB } from "../firebase";
import { collection, onSnapshot, addDoc } from "firebase/firestore";

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
  renforts?: Renfort[];
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
  setReelsVideoUrl = () => {},
  renforts = []
}) => {
  const { t } = useLanguage();
  const { isDataSaveActive, areAnimationsReduced } = usePerformance();
  const searchStr = globalSearchTerm.toLowerCase();

  // Mount log
  useEffect(() => {
  }, []);

  // Internal local states for filters (only applied when clicking Valider)
  const [localCategory, setLocalCategory] = useState(selectedCategory);
  const [localLocation, setLocalLocation] = useState(selectedLocation);
  const [localType, setLocalType] = useState(selectedType);
  const [localDate, setLocalDate] = useState(selectedDateFilter);

  // Collapsible regions states
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // --- REAL-TIME PORT COCKPIT STATE & LISTENERS ---
  const { currentUser, profile } = useAuth();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [activeContractsCount, setActiveContractsCount] = useState<number>(0);
  const [todayEventsCount, setTodayEventsCount] = useState<number>(0);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState<boolean>(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState<boolean>(false);
  const [leaderboardSearch, setLeaderboardSearch] = useState<string>("");
  const [localComingSoonKey, setLocalComingSoonKey] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState<string>("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success">("idle");

  // Helper to open details and save to local storage history
  const handleOpenGomboDetails = (g: any) => {
    if (!g) return;
    setSelectedGomboDetails(g);
    if (!g.id) return;
    try {
      const stored = localStorage.getItem("afrigombo_view_history");
      let historyIds: string[] = stored ? JSON.parse(stored) : [];
      historyIds = historyIds.filter(id => id !== g.id);
      historyIds.unshift(g.id);
      localStorage.setItem("afrigombo_view_history", JSON.stringify(historyIds.slice(0, 20)));
    } catch (e) {
      console.warn("History save error:", e);
    }
  };

  useEffect(() => {
    if (!currentUser?.uid) return;

    // 1. Messages unread count sync
    let unsubscribeMessages = () => {};
    try {
      unsubscribeMessages = gomboDB.listenConversations(currentUser.uid, (convos) => {
        let unread = 0;
        convos.forEach((c) => {
          unread += c.unreadCount?.[currentUser.uid] || 0;
        });
        setUnreadMessagesCount(unread);
      });
    } catch (e) {
      console.warn("Messages listener error:", e);
    }

    // 2. User unread notifications count sync
    let unsubscribeNotifications = () => {};
    try {
      unsubscribeNotifications = gomboDB.listenUserNotifications(currentUser.uid, (userNotifs) => {
        const count = userNotifs.filter(n => !n.read).length;
        setUnreadNotificationsCount(count);
      });
    } catch (e) {
      console.warn("Notifications listener error:", e);
    }

    // 3. User active contracts count sync
    let unsubscribeContracts = () => {};
    try {
      unsubscribeContracts = gomboDB.listenContractsForUser(currentUser.uid, (data) => {
        const activeCount = data.filter(c => c.status !== "completed" && c.status !== "cancelled" && c.status !== "archived").length;
        setActiveContractsCount(activeCount);
      });
    } catch (e) {
      console.warn("Contracts listener error:", e);
    }

    // 4. Today's events count sync
    let unsubscribeEvents = () => {};
    try {
      const eventsRef = collection(db, "events");
      const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      unsubscribeEvents = onSnapshot(eventsRef, (snapshot) => {
        let count = 0;
        snapshot.forEach((docSnap) => {
          const evt = docSnap.data();
          if (evt.date === todayStr) {
            count++;
          }
        });
        setTodayEventsCount(count);
      }, (err) => {
        console.warn("Events listener error:", err);
      });
    } catch (e) {
      console.warn("Events query error:", e);
    }

    return () => {
      unsubscribeMessages();
      unsubscribeNotifications();
      unsubscribeContracts();
      unsubscribeEvents();
    };
  }, [currentUser?.uid]);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setWaitlistStatus("loading");
    try {
      const waitlistRef = collection(db, "waitlist");
      await addDoc(waitlistRef, {
        email: emailInput,
        feature: localComingSoonKey,
        submittedAt: new Date().toISOString(),
        userId: currentUser?.uid || "anonymous"
      });
      setWaitlistStatus("success");
      setEmailInput("");
      if (addToTerminal) {
        addToTerminal(`[WAITLIST] Inscription réussie pour ${emailInput} sur la fonctionnalité ${localComingSoonKey}`);
      }
    } catch (err) {
      console.error("Error joining waitlist:", err);
      setWaitlistStatus("idle");
    }
  };

  // Advanced real filter states matching requested criteria
  const [filterCommune, setFilterCommune] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMinBudget, setFilterMinBudget] = useState<number>(0);
  const [filterMaxBudget, setFilterMaxBudget] = useState<number>(5000000);
  const [filterDateMode, setFilterDateMode] = useState<"all" | "today" | "week" | "month">("all");
  const [filterPremium, setFilterPremium] = useState<boolean>(false);
  const [filterExpress, setFilterExpress] = useState<boolean>(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState<boolean>(false);
  const [filterHasPhoto, setFilterHasPhoto] = useState<boolean>(false);
  const [filterHasAudio, setFilterHasAudio] = useState<boolean>(false);

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

  // Spotlight Auto-sliding timer (every 3 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, [setCurrentSlide]);

  const [sliderTouchStart, setSliderTouchStart] = useState<number | null>(null);
  const [sliderTouchEnd, setSliderTouchEnd] = useState<number | null>(null);

  const handleSliderTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setSliderTouchEnd(null);
    setSliderTouchStart(e.targetTouches[0].clientX);
  };

  const handleSliderTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    setSliderTouchEnd(e.targetTouches[0].clientX);
  };

  const handleSliderTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!sliderTouchStart || !sliderTouchEnd) return;
    const distance = sliderTouchStart - sliderTouchEnd;
    if (distance > 50) {
      setCurrentSlide((prev) => (prev + 1) % 4);
      try { audioSynth?.playTamTam?.(false); } catch (_) {}
    } else if (distance < -50) {
      setCurrentSlide((prev) => (prev - 1 + 4) % 4);
      try { audioSynth?.playTamTam?.(false); } catch (_) {}
    }
  };

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
    // 1. Global Search Term
    const matchesSearch = !globalSearchTerm || 
      (g.title || "").toLowerCase().includes(searchStr) ||
      (g.description || "").toLowerCase().includes(searchStr) ||
      (g.location || "").toLowerCase().includes(searchStr);

    // 2. Commune/Location filter
    let matchesCommune = true;
    if (filterCommune !== "all") {
      const gLoc = (g.location || g.commune || "").toLowerCase();
      matchesCommune = gLoc.includes(filterCommune.toLowerCase());
    } else if (selectedLocation !== "all") {
      const gLoc = (g.location || g.commune || "").toLowerCase();
      matchesCommune = gLoc.includes(selectedLocation.toLowerCase());
    }

    // 3. Type of Gombo filter
    let matchesType = true;
    if (filterType !== "all") {
      const typeLower = filterType.toLowerCase();
      const txt = ((g.title || "") + " " + (g.description || "")).toLowerCase();
      if (typeLower === "concert") {
        matchesType = txt.includes("concert") || txt.includes("gala") || txt.includes("festival") || txt.includes("show") || txt.includes("live");
      } else if (typeLower === "studio") {
        matchesType = txt.includes("studio") || txt.includes("enregistrement") || txt.includes("cabaret");
      } else if (typeLower === "clip") {
        matchesType = txt.includes("clip") || txt.includes("danse") || txt.includes("vidéo") || txt.includes("video");
      } else if (typeLower === "renfort") {
        matchesType = txt.includes("renfort") || g.isExpress || g.urgent;
      }
    } else if (selectedType !== "all") {
      const typeLower = selectedType.toLowerCase();
      const txt = ((g.title || "") + " " + (g.description || "")).toLowerCase();
      if (typeLower === "concert") matchesType = txt.includes("concert") || txt.includes("gala") || txt.includes("festival") || txt.includes("show") || txt.includes("live");
      else if (typeLower === "studio") matchesType = txt.includes("studio") || txt.includes("enregistrement") || txt.includes("cabaret");
      else if (typeLower === "clip") matchesType = txt.includes("clip") || txt.includes("danse") || txt.includes("vidéo") || txt.includes("video");
    }

    // 4. Budget filter
    const gBudget = g.budget || 0;
    const matchesBudget = gBudget >= filterMinBudget && gBudget <= filterMaxBudget;

    // 5. Date filter
    let matchesDate = true;
    if (filterDateMode !== "all") {
      const gDateStr = g.date || g.timestamp || "";
      if (gDateStr) {
        const gDate = new Date(gDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Difference in ms
        const diffTime = Math.abs(today.getTime() - gDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (filterDateMode === "today") {
          matchesDate = diffDays <= 1 || gDateStr.includes(new Date().toISOString().split("T")[0]);
        } else if (filterDateMode === "week") {
          matchesDate = diffDays <= 7;
        } else if (filterDateMode === "month") {
          matchesDate = diffDays <= 30;
        }
      } else {
        matchesDate = false;
      }
    } else if (selectedDateFilter !== "all") {
      const df = selectedDateFilter.toLowerCase();
      const gDate = (g.date || "").toLowerCase();
      if (df === "mai 2025") matchesDate = gDate.includes("mai 2025") || gDate.includes("2025-05") || (g.timestamp && g.timestamp.includes("2025-05"));
      else if (df === "juin 2026") matchesDate = gDate.includes("juin 2026") || gDate.includes("2026-06") || (g.timestamp && g.timestamp.includes("2026-06"));
    }

    // 5.5. Category filter
    let matchesCategory = true;
    if (filterCategory !== "all") {
      const catLower = filterCategory.toLowerCase();
      const gStyle = (g.style || g.category || g.musicalStyle || "").toLowerCase();
      const txt = ((g.title || "") + " " + (g.description || "")).toLowerCase();
      matchesCategory = gStyle.includes(catLower) || txt.includes(catLower);
    } else if (selectedCategory !== "all") {
      const catLower = selectedCategory.toLowerCase();
      const gStyle = (g.style || g.category || g.musicalStyle || "").toLowerCase();
      const txt = ((g.title || "") + " " + (g.description || "")).toLowerCase();
      matchesCategory = gStyle.includes(catLower) || txt.includes(catLower);
    }

    // 6. Premium filter
    let matchesPremium = true;
    if (filterPremium) {
      matchesPremium = g.isBoosted || g.isPremium || false;
    }

    // 7. Renfort Express filter
    let matchesExpress = true;
    if (filterExpress) {
      matchesExpress = g.isExpress || g.urgent || false;
    }

    // 8. Verified Users filter
    let matchesVerified = true;
    if (filterVerifiedOnly) {
      const author = users.find(u => u.id === g.userId || u.uid === g.userId);
      matchesVerified = author?.isCertified || author?.isVerified || false;
    }

    // 9. Has Photo filter
    let matchesPhoto = true;
    if (filterHasPhoto) {
      matchesPhoto = !!g.imageUrl && g.imageUrl.trim() !== "" && !g.imageUrl.includes("placeholder");
    }

    // 10. Has Audio filter
    let matchesAudio = true;
    if (filterHasAudio) {
      matchesAudio = !!g.audioUrl && g.audioUrl.trim() !== "";
    }

    return matchesSearch && matchesCommune && matchesType && matchesBudget && matchesDate && matchesCategory && matchesPremium && matchesExpress && matchesVerified && matchesPhoto && matchesAudio;
  });

  // Spotlight carousel slides matching requested categories
  const spotlightSlides = [
    {
      id: "gombo_spotlight_1",
      title: "🔥 Gombos tendances",
      description: "GRAND CONCERT LIVE DES DIX - Recherche orchestre complet et choristes d'élite.",
      location: "Marcory, Côte d'Ivoire",
      date: "Immédiat",
      budget: "1 500 000 FCFA",
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
      isPremium: true,
      isNew: true
    },
    {
      id: "gombo_spotlight_2",
      title: "🎵 Opportunités récentes",
      description: "SESSION STUDIO ET ARRANGEMENT - Beatmaker recherché pour composer l'album afro-fusion de l'année.",
      location: "Cocody, Côte d'Ivoire",
      date: "Prochainement",
      budget: "450 000 FCFA",
      imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
      isPremium: true,
      isNew: true
    },
    {
      id: "gombo_spotlight_3",
      title: "⚡ Urgences",
      description: "CHORISTE SOPRANO CE SOIR ! Prestation live d'élite à 20h.",
      location: "Yopougon, Côte d'Ivoire",
      date: "Ce soir 20h",
      budget: "30 000 FCFA",
      imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80",
      isPremium: true,
      isNew: true
    },
    {
      id: "gombo_spotlight_4",
      title: "📹 Réels populaires",
      description: "SOLO DE GUITARE DE FEU - Démo de Yoro l'Américain honorée par le Trône !",
      location: "Koumassi, Côte d'Ivoire",
      date: "Populaire",
      budget: "350 000 FCFA",
      imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80",
      isPremium: true,
      isNew: false
    }
  ];

  const currentSlideData = spotlightSlides[currentSlide] || spotlightSlides[0];

  // Combine items exclusively from real Firestore data
  const allRecentItems = GombosToRender.filter(g => !g.id?.includes("spotlight")).map(g => ({
    id: g.id || `gombo_${Math.random()}`,
    title: g.title || "Prestation Musicale",
    description: g.description || "Contrat d'artiste de grande envergure.",
    location: `${g.location || "Abidjan"}, Côte d'Ivoire`,
    budget: `${(g.budget || 250000).toLocaleString("fr-FR")} FCFA`,
    date: g.date || "Immédiat",
    imageUrl: g.imageUrl || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80",
    isNew: g.urgent || false,
    isPremium: g.isBoosted || false
  }));

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
              setIsFiltersOpen(!isFiltersOpen);
              try { audioSynth.playTamTam(false); } catch (_) {}
            }}
            className={`transition p-1 cursor-pointer ${isFiltersOpen ? "text-[#F1C40F]" : "text-[#D4AF37] hover:text-[#F1C40F]"}`}
            title="Filtres avancés"
          >
            <Sliders className="w-5 h-5" />
          </button>
        </div>

        {/* Real Advanced Interactive Filter Panel */}
        {isFiltersOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-[#0a0a0c] border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-2xl z-30 relative text-left"
          >
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
              <span className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                🎛️ Filtres de Recherche Réels
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {GombosToRender.length} Gombos trouvés
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Commune select */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-black uppercase text-zinc-400">Commune / Ville</label>
                <select
                  value={filterCommune}
                  onChange={(e) => setFilterCommune(e.target.value)}
                  className="w-full bg-[#050505] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="all">Toutes les communes</option>
                  {IVORIAN_COMMUNES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Category select */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-black uppercase text-zinc-400">Catégorie / Style</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-[#050505] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="all">Toutes les catégories</option>
                  <option value="Zouglou">Zouglou 🇨🇮</option>
                  <option value="Coupé-Décalé">Coupé-Décalé 🔥</option>
                  <option value="Rap">Rap / Hip-Hop 🎤</option>
                  <option value="Traditionnel">Musique Traditionnelle 🪘</option>
                  <option value="Jazz">Jazz & Cabaret 🎷</option>
                </select>
              </div>

              {/* Type select */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-black uppercase text-zinc-400">Type de Gombo</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-[#050505] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="all">Tous les types</option>
                  <option value="concert">🎵 Concert & Live Show</option>
                  <option value="studio">🎙️ Studio & Cabaret</option>
                  <option value="clip">🎥 Clip & Danse</option>
                  <option value="renfort">🚨 Renfort Express urgent</option>
                </select>
              </div>

              {/* Budget Min & Max */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-black uppercase text-zinc-400">Budget (FCFA)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filterMinBudget || ""}
                    onChange={(e) => setFilterMinBudget(Number(e.target.value))}
                    className="w-1/2 bg-[#050505] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filterMaxBudget || ""}
                    onChange={(e) => setFilterMaxBudget(Number(e.target.value))}
                    className="w-1/2 bg-[#050505] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1 col-span-1 sm:col-span-2">
                <label className="text-[10px] font-mono font-black uppercase text-zinc-400">Date de l'événement</label>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFilterDateMode("all")}
                    className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                      filterDateMode === "all"
                        ? "bg-[#D4AF37] border-[#D4AF37] text-black"
                        : "bg-[#050505] border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Tout
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterDateMode("today")}
                    className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                      filterDateMode === "today"
                        ? "bg-[#D4AF37] border-[#D4AF37] text-black"
                        : "bg-[#050505] border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Aujourd'hui
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterDateMode("week")}
                    className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                      filterDateMode === "week"
                        ? "bg-[#D4AF37] border-[#D4AF37] text-black"
                        : "bg-[#050505] border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Cette semaine
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterDateMode("month")}
                    className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                      filterDateMode === "month"
                        ? "bg-[#D4AF37] border-[#D4AF37] text-black"
                        : "bg-[#050505] border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Ce mois
                  </button>
                </div>
              </div>
            </div>

            {/* Checkboxes / Toggles row */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
              {/* Premium toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filterPremium}
                  onChange={(e) => setFilterPremium(e.target.checked)}
                  className="rounded bg-[#050505] border-zinc-800 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="text-[11px] font-bold text-zinc-300">★ Uniquement Premium</span>
              </label>

              {/* Express toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filterExpress}
                  onChange={(e) => setFilterExpress(e.target.checked)}
                  className="rounded bg-[#050505] border-zinc-800 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="text-[11px] font-bold text-zinc-300">🚨 Renfort Express</span>
              </label>

              {/* Verified users only toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filterVerifiedOnly}
                  onChange={(e) => setFilterVerifiedOnly(e.target.checked)}
                  className="rounded bg-[#050505] border-zinc-800 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="text-[11px] font-bold text-zinc-300">✔ Profils d'Artistes vérifiés</span>
              </label>

              {/* With Photo toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filterHasPhoto}
                  onChange={(e) => setFilterHasPhoto(e.target.checked)}
                  className="rounded bg-[#050505] border-zinc-800 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="text-[11px] font-bold text-zinc-300">🖼️ Avec photo</span>
              </label>

              {/* With Audio toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filterHasAudio}
                  onChange={(e) => setFilterHasAudio(e.target.checked)}
                  className="rounded bg-[#050505] border-zinc-800 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="text-[11px] font-bold text-zinc-300">🔊 Avec audio</span>
              </label>
            </div>

            {/* Close / Apply / Reset Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => {
                  setFilterCommune("all");
                  setFilterType("all");
                  setFilterCategory("all");
                  setFilterMinBudget(0);
                  setFilterMaxBudget(5000000);
                  setFilterDateMode("all");
                  setFilterPremium(false);
                  setFilterExpress(false);
                  setFilterVerifiedOnly(false);
                  setFilterHasPhoto(false);
                  setFilterHasAudio(false);
                  try { audioSynth.playTamTam(false); } catch (_) {}
                }}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Réinitialiser
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFiltersOpen(false);
                    try { audioSynth.playTamTam(false); } catch (_) {}
                  }}
                  className="px-4 py-2 bg-[#050505] border border-zinc-850 hover:bg-zinc-950 text-zinc-300 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFiltersOpen(false);
                    try { audioSynth.playTamTam(true); } catch (_) {}
                  }}
                  className="px-5 py-2 bg-[#D4AF37] hover:bg-[#F3C43F] text-black rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md"
                >
                  Appliquer ({GombosToRender.length})
                </button>
              </div>
            </div>
          </motion.div>
        )}

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
                  handleOpenGomboDetails(g);
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
      <div className={`afri-card transition-all duration-300 shadow-[0_4px_25px_rgba(212,175,55,0.08)] ${isQuickActionsOpen ? "p-3 sm:p-5 space-y-3 sm:space-y-4" : "py-2 px-3 sm:px-4"}`}>
        <button
          onClick={() => {
            setIsQuickActionsOpen(!isQuickActionsOpen);
            try { audioSynth?.playTamTam?.(false); } catch(_) {}
          }}
          className="w-full flex justify-between items-center text-left focus:outline-none cursor-pointer hover:opacity-90 select-none"
        >
          <h3 className="afri-title-sm sm:afri-title-md text-white flex items-center gap-1.5">
            <span>⚡ ACTIONS RAPIDES</span>
          </h3>
          <span className="text-[8px] xs:text-[10px] font-mono font-black text-[#D4AF37] bg-black border border-[#D4AF37]/20 w-4.5 h-4.5 xs:w-5 xs:h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center transition-all">
            {isQuickActionsOpen ? "▲" : "▼"}
          </span>
        </button>

        <div
          className={`transition-all duration-300 ease-in-out origin-top overflow-hidden ${
            isQuickActionsOpen ? "max-h-[800px] opacity-100 mt-1 sm:mt-2" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.04
                }
              }
            }}
            initial="hidden"
            animate={isQuickActionsOpen ? "show" : "hidden"}
            className="grid grid-cols-4 gap-1.5 xs:gap-2 sm:gap-4 w-full select-none"
          >
             {[
               {
                 id: "publier",
                 label: "Publier",
                 emoji: "🎤",
                 action: () => requireAuthThen(() => { setActiveMenu("user_publish"); try { audioSynth?.playValidationSuccess(); } catch (_) {} })
               },
               {
                 id: "contrats",
                 label: "Contrats",
                 emoji: "🤝",
                 badge: activeContractsCount > 0 ? activeContractsCount : undefined,
                 badgeColor: "bg-emerald-500 text-white",
                 action: () => requireAuthThen(() => { setActiveMenu("user_contracts"); try { audioSynth?.playValidationSuccess(); } catch (_) {} })
               },
               {
                 id: "calendrier",
                 label: "Calendrier",
                 emoji: "📅",
                 badge: todayEventsCount > 0 ? todayEventsCount : undefined,
                 badgeColor: "bg-[#D4AF37] text-black",
                 action: () => requireAuthThen(() => { setActiveMenu("user_events"); try { audioSynth?.playValidationSuccess(); } catch (_) {} })
               },
               {
                 id: "messages",
                 label: t('messages_tab') || "Messages",
                 emoji: "💬",
                 badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
                 badgeColor: "bg-red-600 text-white animate-pulse",
                 action: () => requireAuthThen(() => { setActiveMenu("user_messages"); try { audioSynth?.playValidationSuccess(); } catch (_) {} })
               },
               {
                 id: "wallet",
                 label: "Wallet",
                 emoji: "💼",
                 badgeBottom: profile ? (profile.balance !== undefined ? profile.balance : 0) : 125000,
                 action: () => requireAuthThen(() => { setActiveMenu("user_wallet"); try { audioSynth?.playValidationSuccess(); } catch (_) {} })
               },
               {
                 id: "renfort",
                 label: "Renfort Express",
                 emoji: "⚡",
                 action: () => requireAuthThen(() => { setActiveMenu("user_renforts"); try { audioSynth?.playValidationSuccess(); } catch (_) {} })
               },
               {
                 id: "gombo_id",
                 label: "Mon GOMBO ID",
                 emoji: "🎼",
                 action: () => requireAuthThen(() => { setActiveMenu("user_gombo_id"); try { audioSynth?.playValidationSuccess(); } catch (_) {} })
               },
               {
                 id: "plus",
                 label: "Plus",
                 emoji: "➕",
                 badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
                 badgeColor: "bg-amber-500 text-black",
                 action: () => setIsPlusMenuOpen(true)
               }
             ].map(action => {
               const isVerified = profile?.isCertified || profile?.kycStatus === "approved";
               const isWallet = action.id === "wallet";
               return (
                 <motion.button
                   key={action.id}
                   variants={{
                     hidden: { opacity: 0, y: 15, scale: 0.95 },
                     show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } }
                   }}
                   whileHover={{
                     scale: 1.04,
                     borderColor: isWallet ? "rgba(212,175,55,0.95)" : "rgba(212,175,55,0.75)",
                     boxShadow: isWallet ? "0 8px 24px rgba(212,175,55,0.18)" : "0 6px 20px rgba(212,175,55,0.12)"
                   }}
                   whileTap={{ scale: 0.92, y: 1 }}
                   onClick={action.action}
                   className={`aspect-square ${
                     isWallet 
                       ? "bg-gradient-to-br from-[#121214] via-[#08080a] to-[#040405] border-[#D4AF37]/50 shadow-[0_8px_32px_rgba(212,175,55,0.12)]" 
                       : "bg-[#050505] border-[#D4AF37]/25 shadow-[0_8px_30px_rgba(0,0,0,0.85)]"
                   } border rounded-xl xs:rounded-2xl p-1 xs:p-1.5 sm:p-3 flex flex-col items-center justify-center gap-0.5 xs:gap-1 sm:gap-2.5 hover:bg-[#D4AF37]/5 transition-all cursor-pointer relative focus:outline-none select-none group w-full h-full min-w-0`}
                 >
                   {/* Top Badge */}
                   {action.badge !== undefined && (
                     <span className={`absolute -top-1.5 -right-1.5 ${action.badgeColor} text-[7.5px] xs:text-[8.5px] font-black w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border border-zinc-950 shadow-md z-10`}>
                       {action.badge}
                     </span>
                   )}

                   {/* Verified GOMBO ID Badge */}
                   {action.id === "gombo_id" && isVerified && (
                     <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black w-4.5 h-4.5 xs:w-5 xs:h-5 rounded-full flex items-center justify-center border border-zinc-950 shadow-[0_0_8px_rgba(212,175,55,0.6)] z-10 animate-fadeIn">
                       <ShieldCheck className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-black stroke-[3.5]" />
                     </span>
                   )}

                   {/* Icon Wrapper */}
                   <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-14 sm:h-14 rounded-full bg-[#D4AF37]/8 flex items-center justify-center border border-[#D4AF37]/20 group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37]/15 transition shrink-0 shadow-[0_4px_12px_rgba(212,175,55,0.05)]">
                     <span className="text-[17px] xs:text-lg sm:text-2xl font-bold leading-none select-none">{action.emoji}</span>
                   </div>

                   {/* Label */}
                   <span className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] text-[#F5F5F5]/90 group-hover:text-white font-sans font-black tracking-wider uppercase text-center leading-[1.1] w-full px-0 mt-0.5 sm:mt-1 break-words line-clamp-2">
                     {action.label === "Renfort Express" ? "Renfort" : (action.label === "Mon GOMBO ID" ? "GOMBO ID" : action.label)}
                   </span>

                   {/* Bottom Badge for Wallet */}
                   {action.badgeBottom !== undefined && (
                     <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#050505] border-2 border-[#D4AF37]/40 text-[#D4AF37] text-[6.5px] xs:text-[7.5px] sm:text-[9px] font-mono font-black py-0.5 px-2 rounded-full whitespace-nowrap shadow-[0_4px_10px_rgba(0,0,0,0.8)] z-10 group-hover:border-[#D4AF37]">
                       {action.badgeBottom.toLocaleString("fr-FR")} F
                     </span>
                   )}
                 </motion.button>
               );
             })}
          </motion.div>
        </div>
      </div>

      {/* BOUTON HYMNE OFFICIEL AFRIGOMBO */}
      <div className="mt-2 text-left select-none">
        <button
          onClick={() => {
            globalAudioManager.playHymne();
          }}
          className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-zinc-950 to-zinc-900 border border-[#D4AF37]/20 hover:border-[#D4AF37]/45 rounded-xl text-xs font-bold text-white shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30 group-hover:bg-[#D4AF37]/20 transition-colors shrink-0">
              <Play className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37] ml-0.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-[13px] sm:text-[14.5px] text-[#F2F2F2] tracking-tight group-hover:text-[#D4AF37] transition-colors leading-none">Hymne officiel AFRIGOMBO</span>
              <span className="text-[9.5px] font-normal text-zinc-400 mt-1.5">Écouter l’hymne officiel d’AFRIGOMBO</span>
            </div>
          </div>
          <span className="text-[7.5px] font-mono text-zinc-500 border border-zinc-800/80 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest bg-zinc-900/40">
            SOUVERAINETÉ
          </span>
        </button>
      </div>

      {/* ==========================================
          2B. ⚡ RENFORT EXPRESS (URGENT RECRUITMENTS)
         ========================================== */}
      <div className="space-y-2.5 pt-2 select-none">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500 animate-pulse text-sm">⚡</span>
            <h3 className="text-[11px] font-sans font-black tracking-widest text-[#FFFFFF] uppercase">
              RENFORT EXPRESS
            </h3>
          </div>
          <button
            onClick={() => {
              setActiveMenu("user_renforts");
              try { audioSynth?.playValidationSuccess?.(); } catch (_) {}
            }}
            className="text-[10px] font-bold text-[#D4AF37] hover:underline flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
          >
            Voir tout <span className="text-[9px]">→</span>
          </button>
        </div>

        {/* Dynamic / fallback small cards list */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {(() => {
            const expressItems = (renforts || []).filter(r => r.isExpress || r.status === "pending" || r.urgent);
            
            if (expressItems.length === 0) {
              return (
                <div className="col-span-full py-4 text-center border border-zinc-900/60 rounded-xl bg-zinc-950/20">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">🚨 Encore aucune donnée.</p>
                </div>
              );
            }
            
            return expressItems.slice(0, 3).map(item => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.01, borderColor: "rgba(212,175,55,0.4)" }}
                onClick={() => {
                  setActiveMenu("user_renforts");
                  try { audioSynth?.playValidationSuccess?.(); } catch (_) {}
                }}
                className="bg-[#111113]/65 border border-zinc-900 rounded-xl p-3 flex flex-col justify-between text-left cursor-pointer transition-all hover:bg-zinc-900/50"
              >
                <div className="space-y-1">
                  <h4 className="text-[10.5px] font-sans font-black text-white leading-snug line-clamp-1 flex items-center gap-1">
                    <span className="text-red-500 shrink-0">🚨</span>
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between text-[9px] text-zinc-400 font-mono pt-1">
                    <span className="flex items-center gap-0.5">
                      <span>📍</span> {item.commune || "Abidjan"}
                    </span>
                    <span className="text-[#D4AF37] font-bold">
                      💰 {(item.budget || 20000).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </motion.div>
            ));
          })()}
        </div>
      </div>

      {/* ==========================================
          3. FILTRES RAPIDES ET RECHERCHE AVANCÉE (HIDDEN AS REQUESTED)
         ========================================== */}
      {/* Search block completely removed to save space */}

      {/* ==========================================
          4. OPPORTUNITÉS À LA UNE (SPOTLIGHT / TENDANCES)
         ========================================== */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <h3 className="text-[11px] font-sans font-black tracking-widest text-[#FFFFFF] uppercase">
            🔥 TENDANCES & COUPS DE PROJECTEUR
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

        {/* Feature Spotlight Card banner with swiping */}
        <div 
          onTouchStart={handleSliderTouchStart}
          onTouchMove={handleSliderTouchMove}
          onTouchEnd={handleSliderTouchEnd}
          className="relative h-[220px] rounded-[24px] overflow-hidden group shadow-2xl border border-zinc-900 cursor-grab active:cursor-grabbing"
        >
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
                className="text-white transition-colors p-1"
                title="Honneur"
              >
                <span className="text-[18px]">{isLiked(currentSlideData.id) ? "🪘" : "🪘"}</span>
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
                      handleOpenGomboDetails(matchingReal);
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
          5. 🎼 GOMBOS RÉCENTS (HORIZONTAL ROWS)
         ========================================== */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[#D4AF37]">🎼</span>
            <h3 className="text-[11px] font-sans font-black tracking-widest text-[#FFFFFF] uppercase">
              GOMBOS RÉCENTS
            </h3>
          </div>
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSelectedLocation("all");
              try { audioSynth.playTamTam(false); } catch (_) {}
            }}
            className="text-xs text-[#D4AF37] font-bold bg-transparent border-none cursor-pointer hover:underline"
          >
            Voir tout
          </button>
        </div>

        {/* List representation */}
        <div className="space-y-3.5">
          {allRecentItems.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#050505] border border-[#D4AF37]/20 text-[#D4AF37]/60 text-xs font-mono shadow-[0_2px_15px_rgba(212,175,55,0.03)]">
              Encore aucune donnée.
            </div>
          ) : (
            allRecentItems.slice(0, 4).map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10px" }}
                transition={{ duration: 0.3 }}
                onClick={() => {
                  try { audioSynth.playTamTam(false); } catch(_) {}
                  const foundReal = gombos.find(g => g.id === item.id) || gombos[0];
                  handleOpenGomboDetails(foundReal);
                }}
                className="flex bg-[#050505] border border-zinc-900 hover:border-[#D4AF37]/40 rounded-2xl p-3 items-center gap-3 transition-colors cursor-pointer relative group"
              >
                {/* Left Thumbnail with Gold G logo overlay */}
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#050505] border border-[#D4AF37]/10 flex items-center justify-center">
                  <img
                    src={optimizeImageUrl(item.imageUrl, isDataSaveActive)}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0.5 left-0.5 w-4 h-4 bg-[#D4AF37] border border-black rounded-full flex items-center justify-center shadow">
                    <span className="text-[7px] font-black text-black">G</span>
                  </div>
                </div>

                {/* Right detail text & Heart icon aligns */}
                <div className="flex-1 min-w-0 h-full flex flex-col justify-between py-0.5">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.isNew && (
                          <span className="text-[6.5px] font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-1 py-0.5 rounded uppercase font-mono tracking-wider">
                            NOUVEAU
                          </span>
                        )}
                        {item.isPremium && (
                          <span className="text-[6.5px] font-bold bg-[#D4AF37]/10 border border-[#D4AF37]/35 text-[#D4AF37] px-1 py-0.5 rounded uppercase font-mono tracking-wider">
                            PREMIUM
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-xs font-black text-white hover:text-zinc-300 transition-all cursor-pointer tracking-wide mt-0.5 truncate max-w-[190px] sm:max-w-xs uppercase">
                        {item.title}
                      </h4>
                      
                      <p className="text-[9px] text-zinc-400 truncate max-w-[190px] sm:max-w-xs mt-0.5 font-sans leading-none">
                        {item.description}
                      </p>
                    </div>

                    {/* Heart button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(item.id);
                      }}
                      className="transition p-1 shrink-0 bg-transparent border-none cursor-pointer"
                    >
                      <span className="text-[12px]">{isLiked(item.id) ? "🪘" : "🪘"}</span>
                    </button>
                  </div>

                  {/* Location under description */}
                  <div className="flex justify-between items-end mt-1.5 pt-1 border-t border-zinc-900/40">
                    <span className="text-[8.5px] text-zinc-500 font-medium font-sans">
                      📍 {item.location}
                    </span>

                    {/* Budget & Date beneath it */}
                    <div className="text-right flex items-center gap-2">
                      <span className="text-[8px] text-zinc-500 font-mono tracking-tight leading-none">
                        {item.date}
                      </span>
                      <span className="text-[11px] font-bold text-[#D4AF37] leading-none">
                        {item.budget}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* ==========================================
          6. ⚡ OPPORTUNITÉS URGENTES (DURABLE CLOUD SYNC)
         ========================================== */}
      <div className="space-y-3 pt-2 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-red-500 animate-pulse text-sm">🔥</span>
            <h3 className="text-[11px] font-sans font-black tracking-widest text-white uppercase">
              OPPORTUNITÉS URGENTES
            </h3>
          </div>
          <span className="text-[8px] font-mono text-zinc-500 tracking-wider">
            SYNCHRONISÉ LIVE 📡
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(() => {
            const urgentItems = allRecentItems.filter(item => item.isNew || item.isPremium || item.title.toLowerCase().includes("urgent") || item.title.toLowerCase().includes("🚨"));
            
            if (urgentItems.length === 0) {
              return (
                <div className="col-span-full py-6 text-center border border-zinc-900/60 rounded-2xl bg-zinc-950/20">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">🔥 Encore aucune donnée.</p>
                </div>
              );
            }

            return urgentItems.slice(0, 2).map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => {
                  try { audioSynth.playTamTam(false); } catch(_) {}
                  const foundReal = gombos.find(g => g.id === item.id) || gombos[0];
                  if (foundReal) {
                    handleOpenGomboDetails(foundReal);
                  }
                }}
                className="bg-gradient-to-r from-red-950/15 to-amber-950/10 border border-red-900/40 rounded-2xl p-3.5 flex flex-col justify-between text-left cursor-pointer hover:border-red-500/50 transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl group-hover:bg-red-500/10 transition-colors pointer-events-none" />
                
                <div className="space-y-1.5 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-[7.5px] font-black bg-red-500 text-white px-2 py-0.5 rounded-lg uppercase tracking-widest font-mono">
                      URGENT
                    </span>
                    <span className="text-[10px] font-black text-[#D4AF37] font-sans">
                      {item.budget}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white group-hover:text-[#D4AF37] transition-colors leading-snug uppercase">
                    {item.title}
                  </h4>
                  <p className="text-[9.5px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[8.5px] text-zinc-500 font-mono pt-3 mt-2 border-t border-zinc-900/60 relative">
                  <span>📍 {item.location}</span>
                  <span className="text-red-400 font-black flex items-center gap-1">
                    <span>⏱</span> {item.date}
                  </span>
                </div>
              </motion.div>
            ));
          })()}
        </div>
      </div>

      {/* ==========================================
          7. 📹 RÉELS D'ARTISTES (LIVELY VIDEO PREVIEW GALLERY)
         ========================================== */}
      <div className="space-y-3 pt-2 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[#D4AF37]">📹</span>
            <h3 className="text-[11px] font-sans font-black tracking-widest text-white uppercase">
              RÉELS D'ARTISTES
            </h3>
          </div>
          <button
            onClick={() => {
              setCurrentSection("reels");
              try { audioSynth.playTamTam(false); } catch (_) {}
            }}
            className="text-xs text-[#D4AF37] font-bold bg-transparent border-none cursor-pointer hover:underline"
          >
            Voir tout
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            {
              id: "local-reel-1",
              title: "Intro Solo Saxophone",
              artist: "Thierry Sax d'Abidjan",
              views: "1.2K vues",
              url: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-guitarist-playing-acoustic-guitar-34232-large.mp4",
              thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200"
            },
            {
              id: "local-reel-2",
              title: "Improvisation Batterie",
              artist: "Sékou Batterie d'or",
              views: "890 vues",
              url: "https://assets.mixkit.co/videos/preview/mixkit-playing-drums-closeup-34301-large.mp4",
              thumbnail: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200"
            },
            {
              id: "local-reel-3",
              title: "Vocalises Rumba",
              artist: "Fanta D'Abobo",
              views: "2.4K vues",
              url: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-guitarist-playing-acoustic-guitar-34232-large.mp4",
              thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200"
            }
          ].map((reel, index) => (
            <motion.div
              key={reel.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                setReelsVideoUrl(reel.url);
                try { audioSynth.playValidationSuccess(); } catch(_) {}
              }}
              className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-900 group cursor-pointer"
            >
              <img
                src={reel.thumbnail}
                alt={reel.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
              
              {/* Play icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-black/60 border border-[#D4AF37] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-[#D4AF37] text-[10px] pl-0.5">▶</span>
                </div>
              </div>

              {/* Bottom text overlays */}
              <div className="absolute bottom-2 left-2 right-2 text-left">
                <p className="text-[7.5px] font-sans font-black text-white uppercase leading-none truncate mb-0.5">
                  {reel.title}
                </p>
                <p className="text-[6.5px] text-zinc-400 font-mono truncate leading-none">
                  {reel.artist}
                </p>
              </div>
            </motion.div>
          ))}
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
            
            {/* Vues Vidéos */}
            {(reelsFilter === "all" || reelsFilter === "videos") && (
              <PremiumEmptyState 
                message="Aucune vidéo disponible." 
                submessage="Publiez vos reels pour être vu par le réseau." 
                icon={Video}
              />
            )}

            {/* 2. MUSIC EXTRAITS AUDIOS (Requirement 2 & Background Play integration) */}
            {(reelsFilter === "all" || reelsFilter === "audios") && (
              <PremiumEmptyState 
                message="Aucun extrait audio." 
                submessage="Partagez vos maquettes et créations audio." 
                icon={Music}
              />
            )}

            {/* 3. MURMURES / STATUS DE COMPAGGNIE */}
            {(reelsFilter === "all" || reelsFilter === "murmures") && (
              <PremiumEmptyState 
                message="Aucun murmure pour le moment." 
                submessage="Partagez vos actualités et statuts." 
                icon={MessageSquare}
              />
            )}

            {/* 4. ALLIANCES ET CERTIFICATIONS D'ACCORDEMENT */}
            {(reelsFilter === "all" || reelsFilter === "alliances") && (
              <PremiumEmptyState 
                message="Aucune alliance récente." 
                submessage="Découvrez et collaborez avec d'autres artistes." 
                icon={ShieldCheck}
              />
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

      {/* ==========================================
          BOTTOM SHEET PLUS (PREMIUM AFRIGOMBO)
         ========================================== */}
      <AnimatePresence>
        {isPlusMenuOpen && (
          <>
            {/* Dark premium glass backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPlusMenuOpen(false)}
              className="fixed inset-0 bg-black/85 z-50 cursor-pointer backdrop-blur-md"
            />

            {/* Bottom Sheet wrapper */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 180 }}
              className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-[#030303] border-t-4 border-[#D4AF37] rounded-t-[2.5rem] z-50 p-6 sm:p-8 shadow-[0_-15px_45px_rgba(212,175,55,0.2)] flex flex-col space-y-6 select-none"
            >
              {/* Decorative premium grab handle */}
              <div 
                className="w-16 h-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full mx-auto shrink-0 cursor-pointer transition-all mb-1" 
                onClick={() => setIsPlusMenuOpen(false)} 
              />

              {/* Title Header */}
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌟</span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-sans font-black text-white uppercase tracking-widest leading-none">
                      AFRIGOMBO PLUS COCKPIT
                    </h3>
                    <p className="text-[9px] font-mono text-zinc-550 uppercase tracking-wider mt-1.5 font-bold">Tableau des Commandes Avancées</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPlusMenuOpen(false)}
                  className="w-9 h-9 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center text-zinc-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modern Grid containing 11 Items */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 overflow-y-auto max-h-[50vh] pb-8 pr-1">
                {/* ⭐ Booster une annonce */}
                <button
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    requireAuthThen(() => {
                      setActiveMenu("user_gombo_plus");
                      try { audioSynth?.playValidationSuccess(); } catch (_) {}
                    });
                  }}
                  className="bg-black border border-zinc-900/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-[#D4AF37]/5 transition-all group relative cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 group-hover:border-[#D4AF37]/55 transition">
                    <span className="text-sm">⭐</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans font-black text-white tracking-wide">Booster une annonce</div>
                    <span className="text-[7.5px] font-mono text-amber-500 uppercase tracking-widest block leading-none mt-1 font-bold">GOMBO PLUS</span>
                  </div>
                </button>

                {/* 🎼 Mon Portfolio */}
                <button
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    requireAuthThen(() => {
                      setActiveMenu("user_heritage");
                      try { audioSynth?.playValidationSuccess(); } catch (_) {}
                    });
                  }}
                  className="bg-black border border-zinc-900/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-[#D4AF37]/5 transition-all group relative cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:border-purple-500/55 transition">
                    <span className="text-sm">🎼</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans font-black text-white tracking-wide">Mon Portfolio</div>
                    <span className="text-[7.5px] font-mono text-[#D4AF37] uppercase tracking-widest block leading-none mt-1 font-bold">HÉRITAGE</span>
                  </div>
                </button>

                {/* ❤️ Mes Favoris */}
                <button
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    setIsFavoritesModalOpen(true);
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  }}
                  className="bg-black border border-zinc-900/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-[#D4AF37]/5 transition-all group relative cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:border-red-500/55 transition">
                    <span className="text-sm">❤️</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans font-black text-white tracking-wide">Mes Favoris</div>
                    <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest block leading-none mt-1 font-bold">ENREGISTRÉS</span>
                  </div>
                </button>

                {/* 🕓 Historique */}
                <button
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    setIsHistoryModalOpen(true);
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  }}
                  className="bg-black border border-zinc-900/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-[#D4AF37]/5 transition-all group relative cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/55 transition">
                    <span className="text-sm">🕓</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans font-black text-white tracking-wide">Historique</div>
                    <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest block leading-none mt-1 font-bold">MÉMOIRE</span>
                  </div>
                </button>

                {/* 📢 Mes Publications */}
                <button
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    requireAuthThen(() => {
                      setActiveMenu("user_mes_gombos");
                      try { audioSynth?.playValidationSuccess(); } catch (_) {}
                    });
                  }}
                  className="bg-black border border-zinc-900/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-[#D4AF37]/5 transition-all group relative cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:border-indigo-500/55 transition">
                    <span className="text-sm">📢</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans font-black text-white tracking-wide">Mes Publications</div>
                    <span className="text-[7.5px] font-mono text-emerald-400 uppercase tracking-widest block leading-none mt-1 font-bold">GOMBO ENGINE</span>
                  </div>
                </button>

                {/* 🎥 Mes Réels */}
                <button
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    requireAuthThen(() => {
                      setActiveMenu("user_reels");
                      try { audioSynth?.playValidationSuccess(); } catch (_) {}
                    });
                  }}
                  className="bg-black border border-zinc-900/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-[#D4AF37]/5 transition-all group relative cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 group-hover:border-pink-500/55 transition">
                    <span className="text-sm">🎥</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans font-black text-white tracking-wide">Mes Réels</div>
                    <span className="text-[7.5px] font-mono text-emerald-400 uppercase tracking-widest block leading-none mt-1 font-bold">DISPO</span>
                  </div>
                </button>

                {/* 📍 Opportunités proches */}
                <button
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    requireAuthThen(() => {
                      setActiveMenu("user_opportunities");
                      try { audioSynth?.playValidationSuccess(); } catch (_) {}
                    });
                  }}
                  className="bg-black border border-zinc-900/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-[#D4AF37]/5 transition-all group relative cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/55 transition">
                    <span className="text-sm">📍</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans font-black text-white tracking-wide">Opportunités proches</div>
                    <span className="text-[7.5px] font-mono text-emerald-400 uppercase tracking-widest block leading-none mt-1 font-bold">GEOLOC</span>
                  </div>
                </button>

                {/* 🏆 Classements */}
                <button
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    setIsLeaderboardModalOpen(true);
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  }}
                  className="bg-black border border-zinc-900/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-[#D4AF37]/5 transition-all group relative cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-500/55 transition">
                    <span className="text-sm">🏆</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans font-black text-white tracking-wide">Classements</div>
                    <span className="text-[7.5px] font-mono text-[#D4AF37] uppercase tracking-widest block leading-none mt-1 font-bold">LEADERBOARD</span>
                  </div>
                </button>

                {/* ❤️ Soutenir AFRIGOMBO */}
                <button
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    requireAuthThen(() => {
                      setActiveMenu("user_builders");
                      try { audioSynth?.playValidationSuccess(); } catch (_) {}
                    });
                  }}
                  className="bg-black border border-zinc-900/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-[#D4AF37]/5 transition-all group relative cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:border-red-500/55 transition">
                    <span className="text-sm">❤️</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans font-black text-white tracking-wide">Soutenir AFRIGOMBO</div>
                    <span className="text-[7.5px] font-mono text-red-500 uppercase tracking-widest block leading-none mt-1 font-bold">BÂTISSEURS</span>
                  </div>
                </button>

                {/* ⚙ Paramètres */}
                <button
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    requireAuthThen(() => {
                      setActiveMenu("user_settings");
                      try { audioSynth?.playValidationSuccess(); } catch (_) {}
                    });
                  }}
                  className="bg-black border border-zinc-900/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-[#D4AF37]/5 transition-all group relative cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-zinc-600/10 flex items-center justify-center border border-zinc-600/20 group-hover:border-zinc-600/55 transition">
                    <span className="text-sm">⚙</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans font-black text-white tracking-wide">Paramètres</div>
                    <span className="text-[7.5px] font-mono text-emerald-400 uppercase tracking-widest block leading-none mt-1 font-bold">PREFERENCES</span>
                  </div>
                </button>

                {/* ❓ Centre d'aide */}
                <button
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    requireAuthThen(() => {
                      setActiveMenu("user_help_center");
                      try { audioSynth?.playValidationSuccess(); } catch (_) {}
                    });
                  }}
                  className="bg-black border border-zinc-900/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-[#D4AF37]/5 transition-all group relative cursor-pointer col-span-2"
                >
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 group-hover:border-sky-500/55 transition">
                    <span className="text-sm">❓</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans font-black text-white tracking-wide">Centre d'aide</div>
                    <span className="text-[7.5px] font-mono text-sky-400 uppercase tracking-widest block leading-none mt-1 font-bold">SUPPORT CLIENT</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==========================================
          COMING SOON & WAITLIST MODAL (DURABLE FIRESTORE)
         ========================================== */}
      <AnimatePresence>
        {localComingSoonKey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setLocalComingSoonKey(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#050505] border-2 border-[#D4AF37] p-6 sm:p-8 rounded-[2rem] shadow-[0_15px_40px_rgba(212,175,55,0.25)] max-w-sm w-full relative z-10 text-center space-y-5"
            >
              {/* Header Badge */}
              <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-full flex items-center justify-center border border-[#D4AF37]/30 mx-auto">
                <span className="text-2xl animate-bounce">
                  {localComingSoonKey === "menu_favorites" ? "⭐" : localComingSoonKey === "menu_history" ? "🕓" : "🏆"}
                </span>
              </div>

              {/* Title & Desc */}
              <div className="space-y-2">
                <h3 className="text-base font-sans font-black uppercase text-white tracking-widest">
                  {localComingSoonKey === "menu_favorites" && "Favoris Élite 🌟"}
                  {localComingSoonKey === "menu_history" && "Historique Complet 🕓"}
                  {localComingSoonKey === "menu_classement" && "Classement d'Or 🏆"}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  {localComingSoonKey === "menu_favorites" && "Enregistrez vos artistes et opportunités préférées pour ne plus jamais manquer un Gombo en Or !"}
                  {localComingSoonKey === "menu_history" && "Consultez l'historique de vos gombos, contrats, transactions et performances en un clin d'œil."}
                  {localComingSoonKey === "menu_classement" && "Découvrez le Top 10 des meilleurs artistes et recruteurs du pays. Grimpez dans la hiérarchie !"}
                </p>
              </div>

              {/* Inscription Form */}
              {waitlistStatus === "success" ? (
                <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-2xl text-center space-y-1 animate-fadeIn">
                  <span className="text-emerald-400 text-xs font-black block">✓ VIBRATION BIEN REÇUE</span>
                  <p className="text-[10px] text-zinc-300 font-medium">Vous serez notifié en exclusivité dès l'ouverture de l'accès ! 🎉</p>
                  <button
                    onClick={() => setLocalComingSoonKey(null)}
                    className="mt-3 text-[10px] font-bold text-[#D4AF37] hover:underline uppercase bg-transparent"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <form onSubmit={handleJoinWaitlist} className="space-y-3">
                  <p className="text-[9.5px] font-mono text-[#D4AF37] uppercase tracking-widest font-black">REJOINDRE LA COHORTE BÊTA</p>
                  <input
                    type="email"
                    required
                    placeholder="Entrez votre email d'or..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-black border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs text-white text-center font-bold focus:outline-none focus:border-[#D4AF37] placeholder-zinc-700"
                  />
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setLocalComingSoonKey(null)}
                      className="flex-1 py-2.5 bg-zinc-950 border border-zinc-900 hover:bg-zinc-900 rounded-xl text-zinc-400 font-bold text-xs uppercase transition tracking-wider"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={waitlistStatus === "loading"}
                      className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-black text-xs rounded-xl uppercase transition tracking-wider flex items-center justify-center"
                    >
                      {waitlistStatus === "loading" ? "Envoi..." : "M'inscrire ⚡"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. REAL FAVORITES MODAL */}
      <AnimatePresence>
        {isFavoritesModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#050505] border border-[#D4AF37]/35 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-[0_20px_50px_rgba(212,175,55,0.12)] relative max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">❤️</span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-sans font-black text-white uppercase tracking-widest leading-none">
                      Mes Favoris
                    </h3>
                    <p className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider mt-1 font-bold">Vos opportunités enregistrées</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFavoritesModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center text-zinc-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Favorites Content */}
              <div className="overflow-y-auto flex-1 space-y-3.5 pr-1">
                {likedGombos.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto animate-pulse">
                      <Heart className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Aucun favori enregistré</p>
                      <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                        Enregistrez des opportunités en clicking sur l'icône de trophée/coeur de vos Gombos préférés pour les retrouver ici en un instant.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsFavoritesModalOpen(false);
                        setSelectedCategory("all");
                        setSelectedLocation("all");
                        const feedEl = document.getElementById("gombos-feed-anchor");
                        if (feedEl) {
                          feedEl.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="px-4 py-2 bg-[#D4AF37] hover:bg-[#F3C43F] text-black text-[10px] font-black rounded-lg uppercase tracking-wider transition active:scale-95 mx-auto"
                    >
                      Parcourir les Gombos ⚡
                    </button>
                  </div>
                ) : (
                  gombos.filter(g => g.id && likedGombos.includes(g.id)).length === 0 ? (
                    <div className="py-12 text-center text-zinc-500 text-xs font-mono">
                      Aucune des opportunités aimées n'est disponible actuellement.
                    </div>
                  ) : (
                    gombos
                      .filter(g => g.id && likedGombos.includes(g.id))
                      .map((g) => (
                        <div
                          key={g.id}
                          onClick={() => {
                            handleOpenGomboDetails(g);
                            setIsFavoritesModalOpen(false);
                          }}
                          className="p-3 bg-zinc-950 border border-zinc-900 hover:border-[#D4AF37]/45 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition animate-fadeIn"
                        >
                          <div className="min-w-0 flex-1 text-left">
                            <span className="text-[9.5px] font-mono text-[#D4AF37] uppercase tracking-wider block font-bold leading-none mb-1">
                              📍 {g.location || "Abidjan"} • {g.category || "Général"}
                            </span>
                            <h4 className="text-xs text-white font-bold truncate leading-snug">{g.title}</h4>
                            <p className="text-[10px] text-zinc-400 font-mono font-medium mt-1">
                              {(g.budget || 0).toLocaleString("fr-FR")} FCFA
                            </p>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-550 shrink-0 uppercase font-bold hover:text-[#D4AF37]">
                            Ouvrir →
                          </span>
                        </div>
                      ))
                  )
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. REAL HISTORY MODAL */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#050505] border border-[#D4AF37]/35 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-[0_20px_50px_rgba(212,175,55,0.12)] relative max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🕓</span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-sans font-black text-white uppercase tracking-widest leading-none">
                      Historique
                    </h3>
                    <p className="text-[8.5px] font-mono text-zinc-550 uppercase tracking-wider mt-1 font-bold">Vos récentes consultations</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center text-zinc-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* History Content */}
              <div className="overflow-y-auto flex-1 space-y-3.5 pr-1">
                {(() => {
                  let historyIds: string[] = [];
                  try {
                    const stored = localStorage.getItem("afrigombo_view_history");
                    if (stored) historyIds = JSON.parse(stored);
                  } catch(_) {}

                  const viewedGombos = historyIds
                    .map(id => gombos.find(g => g.id === id))
                    .filter((g): g is Gombo => !!g);

                  if (viewedGombos.length === 0) {
                    return (
                      <div className="py-12 px-4 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto">
                          <History className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-white uppercase tracking-wider">Aucun historique disponible</p>
                          <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                            Les opportunités et Gombos que vous ouvrirez s'afficheront ici automatiquement pour vous permettre de les retrouver facilement.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setIsHistoryModalOpen(false);
                            setSelectedCategory("all");
                            setSelectedLocation("all");
                            const feedEl = document.getElementById("gombos-feed-anchor");
                            if (feedEl) {
                              feedEl.scrollIntoView({ behavior: "smooth" });
                            }
                          }}
                          className="px-4 py-2 bg-[#D4AF37] hover:bg-[#F3C43F] text-black text-[10px] font-black rounded-lg uppercase tracking-wider transition active:scale-95 mx-auto"
                        >
                          Explorer les Gombos ⚡
                        </button>
                      </div>
                    );
                  }

                  return viewedGombos.map((g, idx) => (
                    <div
                      key={`${g.id}-${idx}`}
                      onClick={() => {
                        handleOpenGomboDetails(g);
                        setIsHistoryModalOpen(false);
                      }}
                      className="p-3 bg-zinc-950 border border-zinc-900 hover:border-blue-500/35 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition text-left animate-fadeIn"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-wider block font-bold leading-none mb-1">
                          📍 {g.location || "Abidjan"} • consulté récemment
                        </span>
                        <h4 className="text-xs text-white font-bold truncate leading-snug">{g.title}</h4>
                        <p className="text-[10px] text-[#D4AF37] font-mono font-medium mt-1">
                          {(g.budget || 0).toLocaleString("fr-FR")} FCFA
                        </p>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-550 shrink-0 uppercase font-bold hover:text-[#D4AF37]">
                        Ouvrir →
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. REAL LEADERBOARD MODAL */}
      <AnimatePresence>
        {isLeaderboardModalOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#050505] border border-[#D4AF37]/35 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-[0_20px_50px_rgba(212,175,55,0.12)] relative max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🏆</span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-sans font-black text-white uppercase tracking-widest leading-none">
                      Top Talents
                    </h3>
                    <p className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider mt-1 font-bold">Classements d'Or AFRIGOMBO</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLeaderboardModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center text-zinc-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Leaderboard Inner Content */}
              {(() => {
                const processedUsers = [...(users || [])]
                  .filter(u => u.artisticName || u.name)
                  .map((u, i) => {
                    const level = u.performance?.level || (u.isCertified ? 12 : 5);
                    const score = u.performance?.score || (u.isCertified ? (95 - i) : (75 - i));
                    const rating = u.performance?.rating || (u.isCertified ? 4.9 : 4.4);
                    return { ...u, level, score, rating };
                  })
                  .sort((a, b) => b.score - a.score);

                const filteredUsers = processedUsers.filter(u => {
                  const query = leaderboardSearch.toLowerCase();
                  const matchName = (u.name || "").toLowerCase().includes(query);
                  const matchArtistic = (u.artisticName || "").toLowerCase().includes(query);
                  const matchCommune = (u.commune || "").toLowerCase().includes(query);
                  return matchName || matchArtistic || matchCommune;
                });

                return (
                  <>
                    {/* Search inside leaderboard */}
                    <div className="relative mb-3.5 shrink-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Rechercher un talent, une commune..."
                        value={leaderboardSearch}
                        onChange={(e) => setLeaderboardSearch(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-700 font-bold focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    {/* Users list */}
                    <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
                      {filteredUsers.length === 0 ? (
                        <div className="py-12 text-center text-zinc-600 text-xs font-mono">
                          Aucun talent ne correspond à votre recherche.
                        </div>
                      ) : (
                        filteredUsers.map((u, idx) => {
                          const rankNum = idx + 1;
                          
                          let medalIcon = "";
                          let rankBorder = "border-zinc-900";
                          let bgClass = "bg-zinc-950/40";
                          
                          if (rankNum === 1) {
                            medalIcon = "🥇";
                            rankBorder = "border-[#D4AF37]/50";
                            bgClass = "bg-gradient-to-r from-[#D4AF37]/5 to-transparent";
                          } else if (rankNum === 2) {
                            medalIcon = "🥈";
                            rankBorder = "border-zinc-400/30";
                          } else if (rankNum === 3) {
                            medalIcon = "🥉";
                            rankBorder = "border-amber-700/30";
                          }

                          const userAvatar = u.avatarUrl || u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id || idx}`;

                          return (
                            <div
                              key={u.id || idx}
                              className={`p-3 border rounded-2xl flex items-center justify-between gap-3 transition text-left ${rankBorder} ${bgClass}`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Rank */}
                                <div className="w-6 shrink-0 text-center font-mono text-xs font-black text-zinc-400">
                                  {medalIcon || `#${rankNum}`}
                                </div>

                                {/* Avatar */}
                                <img
                                  src={userAvatar}
                                  referrerPolicy="no-referrer"
                                  className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${idx}`;
                                  }}
                                  alt=""
                                />

                                {/* Info */}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-sans font-black text-white truncate">
                                      {u.artisticName || u.name}
                                    </span>
                                    {u.isCertified && (
                                      <span className="text-[8px] bg-[#D4AF37]/15 text-[#D4AF37] px-1 py-0.5 rounded-md font-mono font-black border border-[#D4AF37]/25 shrink-0 uppercase tracking-widest leading-none">
                                        PRO
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[9.5px] text-zinc-500 font-mono font-bold leading-none mt-1">
                                    📍 {u.commune || "Abidjan"} • Niv. {u.level}
                                  </p>
                                </div>
                              </div>

                              {/* Performance score / rating */}
                              <div className="text-right shrink-0">
                                <span className="text-xs font-mono font-black text-[#D4AF37] block leading-none">
                                  {u.score} pts
                                </span>
                                <span className="text-[9px] font-mono text-zinc-500 block mt-1 font-bold">
                                  ⭐ {u.rating.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
});
