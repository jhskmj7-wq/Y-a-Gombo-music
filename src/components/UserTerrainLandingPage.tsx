import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Sliders, Plus, Megaphone, MessageSquare, ShieldCheck, Bell, 
  RefreshCw, Heart, X, Award, Users, Music, QrCode, LifeBuoy,
  PenTool, UserCheck, MessageCircle, History, Headphones, HelpCircle, Video,
  Sparkles, BarChart3, FileSignature, Zap, Play, Pause, Square, MapPin,
  ShoppingBag, GraduationCap, ChevronRight, Menu, Handshake, CheckCircle2
} from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { useAudio } from "../context/AudioContext";
import { Gombo, User, Post, Renfort } from "../types";
import AnnuaireTalents from "./AnnuaireTalents";
import { usePerformance } from "../services/performanceService";
import { globalAudioManager, AudioState } from "../lib/audioManager";
import PremiumEmptyState from "./PremiumEmptyState";
import TendancesSection from "./TendancesSection";
import FilDecouvertesSection from "./FilDecouvertesSection";
import { useAuth } from "../AuthContext";
import { db } from "../lib/firebase";
import { formatGomboIdDisplay, getEffectiveGomboId } from "../lib/gomboIdHelper";
import { gomboDB } from "../firebase";
import { collection, onSnapshot, addDoc, doc, updateDoc, increment } from "firebase/firestore";
import { AndroidBottomSheet, AndroidCenteredDialog } from "./common/GlobalPortalModal";
import { AndroidPageLayout } from "./layout/AndroidPageLayout";
import { ReelsPlayer } from "./ReelsPlayer";
import { SmartAudioMenu } from "./SmartAudioMenu";
import UserPollsWidget from "./UserPollsWidget";
import { SmartBlock, BlockType } from "./SmartBlock";
import { SmartUniverseCarousel } from "./SmartUniverseCarousel";
import { useGeoEngine } from "../hooks/useGeoEngine";
import { GeoRadarSection } from "./GeoRadarSection";
import { NearbyGombosSection, NearbyArtistsSection } from "./NearbyGeoSections";
import { AfrigoRadarMap } from "./AfrigoRadarMap";
import { getDistanceLabel, calculateDistance } from "../lib/geoUtils";
import { ArbreAPalabresBubble } from "./ArbreAPalabresBubble";
import { AfrigomboFooter } from "./AfrigomboFooter";
import { AfriGomboLogo } from "./AfriGomboLogo";

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
  profile?: any;
  currentUser?: any;
  logoUrl?: string;
  unreadNotifsCount?: number;
  setIsSidebarOpen?: (val: boolean) => void;
  setShowHeritageLoginRequired?: (val: boolean) => void;
  setViewingGomboIdDetail?: (val: boolean) => void;
  contracts?: any[];
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
  renforts = [],
  profile: profileProp,
  currentUser: currentUserProp,
  logoUrl,
  unreadNotifsCount = 0,
  setIsSidebarOpen,
  setShowHeritageLoginRequired,
  setViewingGomboIdDetail,
  contracts = []
}) => {
  const { t } = useLanguage();
  const { currentTrack, isPlaying, playTrack, pause } = useAudio();
  const { isDataSaveActive, areAnimationsReduced } = usePerformance();

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mount log
  useEffect(() => {
  }, []);

  // Internal local states for filters (only applied when clicking Valider)
  const { profile: authProfile, currentUser: authUser } = useAuth();
  const profile = profileProp || authProfile;
  const currentUser = currentUserProp || authUser;
  const geo = useGeoEngine(profile);
  const [showGeoDialog, setShowGeoDialog] = useState(false);

  useEffect(() => {
    if (geo.permissionStatus === "prompt") {
      setShowGeoDialog(true);
    }
  }, [geo.permissionStatus]);

  const [localCategory, setLocalCategory] = useState(selectedCategory);
  const [localLocation, setLocalLocation] = useState(selectedLocation);
  const [localType, setLocalType] = useState(selectedType);
  const [localDate, setLocalDate] = useState(selectedDateFilter);

  // Collapsible regions states
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // 🎵 AUDIO SYSTEM INTEGRATION
  const [audioState, setAudioState] = useState<AudioState>(globalAudioManager.getState());

  useEffect(() => {
    const unsub = globalAudioManager.subscribe((state) => {
      setAudioState(state);
    });
    return () => unsub();
  }, []);

  const isAnthemPlaying = audioState.currentPlaying === "hymne";
  const isAnthemPaused = isAnthemPlaying && audioState.isPaused;

  const handleAnthemClick = () => {
    if (isAnthemPlaying) {
      if (isAnthemPaused) {
        globalAudioManager.resume();
      } else {
        globalAudioManager.pause();
      }
    } else {
      globalAudioManager.playHymn();
    }
  };

  const handleStopAnthem = (e: React.MouseEvent) => {
    e.stopPropagation();
    globalAudioManager.stop();
  };

  // --- REAL-TIME PORT COCKPIT STATE & LISTENERS ---
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [activeContractsCount, setActiveContractsCount] = useState<number>(0);
  const [todayEventsCount, setTodayEventsCount] = useState<number>(0);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState<boolean>(false);

  // --- CLEAN INFINITE FEED STATE (STRICT ORDER - ZERO DUPLICATES) ---
  const [infiniteFeedPage, setInfiniteFeedPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setInfiniteFeedPage(prev => {
              const nextPage = prev + 1;
              if (nextPage >= 6) setHasMore(false);
              return nextPage;
            });
            setIsLoadingMore(false);
          }, 800);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [isLoadingMore, hasMore]);

  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState<boolean>(false);
  const [isPresDeMoiModalOpen, setIsPresDeMoiModalOpen] = useState<boolean>(false);
  const [presDeMoiRadius, setPresDeMoiRadius] = useState<number>(10);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState<boolean>(false);
  const [isUrgencesModalOpen, setIsUrgencesModalOpen] = useState<boolean>(false);
  const [isCandidaturesModalOpen, setIsCandidaturesModalOpen] = useState<boolean>(false);
  const [userApplications, setUserApplications] = useState<any[]>([]);
  const [leaderboardSearch, setLeaderboardSearch] = useState<string>("");
  const [localComingSoonKey, setLocalComingSoonKey] = useState<string | null>(null);

  const isAnyTerrainModalOpen = isPlusMenuOpen || isPresDeMoiModalOpen || isFavoritesModalOpen || isHistoryModalOpen || isLeaderboardModalOpen || isUrgencesModalOpen || isCandidaturesModalOpen || !!localComingSoonKey;

  useEffect(() => {
    if (isAnyTerrainModalOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsPlusMenuOpen(false);
          setIsPresDeMoiModalOpen(false);
          setIsFavoritesModalOpen(false);
          setIsHistoryModalOpen(false);
          setIsLeaderboardModalOpen(false);
          setIsUrgencesModalOpen(false);
          setIsCandidaturesModalOpen(false);
          setLocalComingSoonKey(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      const handlePopState = () => {
        setIsPlusMenuOpen(false);
        setIsPresDeMoiModalOpen(false);
        setIsFavoritesModalOpen(false);
        setIsHistoryModalOpen(false);
        setIsLeaderboardModalOpen(false);
        setIsUrgencesModalOpen(false);
        setIsCandidaturesModalOpen(false);
        setLocalComingSoonKey(null);
      };
      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [isAnyTerrainModalOpen]);
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

    // 5. User applications candidatures sync
    let unsubscribeApplications = () => {};
    try {
      unsubscribeApplications = gomboDB.listenUserApplications(currentUser.uid, (apps) => {
        setUserApplications(apps);
      });
    } catch (e) {
      console.warn("Applications listener error:", e);
    }

    return () => {
      unsubscribeMessages();
      unsubscribeNotifications();
      unsubscribeContracts();
      unsubscribeEvents();
      unsubscribeApplications();
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
  const [filterMaxDistance, setFilterMaxDistance] = useState<number>(100);
  const [filterAvailableOnly, setFilterAvailableOnly] = useState<boolean>(false);
  const [selectedExploreArtist, setSelectedExploreArtist] = useState<any | null>(null);
  const [reelsFilter, setReelsFilter] = useState("all");
  const handleTogglePreview = (track: any) => {
    if (currentTrack?.id === track.id && isPlaying) {
      pause();
    } else {
      playTrack({
        id: track.id,
        url: track.url,
        title: track.title || "Aperçu de la piste",
        artist: track.artist || "Artiste Afrigombo",
        artwork: track.artwork || undefined
      });
    }
  };

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
  const searchStr = globalSearchTerm.toLowerCase();
  
  const GombosWithDistance = gombos.map(g => ({
    ...g,
    distance: geo.latitude && geo.longitude && g.latitude && g.longitude
      ? calculateDistance(geo.latitude, geo.longitude, g.latitude, g.longitude)
      : undefined
  }));

  const GombosToRender = GombosWithDistance.filter(g => {
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
      const rawDate = g.date || g.timestamp || "";
      const rdObj = rawDate as unknown as { toDate?: () => Date };
      const gDateStr = typeof rawDate === "string" ? rawDate : (rdObj && typeof rdObj.toDate === "function" ? rdObj.toDate().toISOString() : String(rawDate ?? ""));
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

    // 11. Distance filter
    let matchesDistance = true;
    if (filterMaxDistance < 100 && g.distance !== undefined) {
      matchesDistance = g.distance <= filterMaxDistance;
    }

    // 12. Availability filter
    let matchesAvailability = true;
    if (filterAvailableOnly) {
      const author = users.find(u => u.uid === g.userId);
      matchesAvailability = author?.availability?.status === "available";
    }

    return matchesSearch && matchesCommune && matchesType && matchesBudget && matchesDate && matchesCategory && matchesPremium && matchesExpress && matchesVerified && matchesPhoto && matchesAudio && matchesDistance && matchesAvailability;
  }).sort((a: any, b: any) => {
    // Requirement 7: Smart search prioritization
    if (globalSearchTerm && a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    return 0;
  });

  const UsersToRender = users.filter(u => {
    if (!globalSearchTerm) return false;
    const search = globalSearchTerm.toLowerCase();
    const matchesSearch = 
      (u.artisticName || "").toLowerCase().includes(search) ||
      (u.displayName || "").toLowerCase().includes(search) ||
      (u.bio || "").toLowerCase().includes(search) ||
      (u.role || "").toLowerCase().includes(search) ||
      (u.instrument || "").toLowerCase().includes(search);
    return matchesSearch && u.role === "musicien";
  }).map(u => ({
    ...u,
    distance: geo.latitude && geo.longitude && u.latitude && u.longitude
      ? calculateDistance(geo.latitude, geo.longitude, u.latitude, u.longitude)
      : undefined
  })).sort((a: any, b: any) => {
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    return 0;
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

  // Section 4: Renfort Express
  const renfortGombos = React.useMemo(() => {
    const filtered = GombosToRender.filter((g: any) => 
      g.type === "renfort" || g.isExpress || g.isRenfort || g.category === "Renfort groupe" || g.category === "urgent"
    );
    if (filtered.length >= 3) return filtered;
    return GombosToRender.slice(0, 6);
  }, [GombosToRender]);

  // Section 5: Gombos récents
  const recentGombos = React.useMemo(() => {
    return [...GombosToRender].sort((a: any, b: any) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0)).slice(0, 8);
  }, [GombosToRender]);

  // Section 6: Opportunités urgentes
  const urgentGombos = React.useMemo(() => {
    const filtered = GombosToRender.filter((g: any) => g.urgent || g.isExpress || g.category === "casting" || g.isCasting);
    if (filtered.length >= 3) return filtered;
    return GombosToRender.filter(g => g.budget && g.budget >= 200000).slice(0, 6);
  }, [GombosToRender]);

  // Section 7: Sélection du Souverain
  const sovereignGombos = React.useMemo(() => {
    const filtered = GombosToRender.filter((g: any) => g.isBoosted || g.isPremium || g.isSpotlight);
    if (filtered.length >= 3) return filtered;
    return GombosToRender.slice(0, 8);
  }, [GombosToRender]);

  // Section 8: Réels d'artistes
  const reelsData = React.useMemo(() => [
    { id: "reel_1", title: "Solo Saxophone Live", artist: "Thierry Sax", views: "2.4K", category: "Saxophone", thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80", url: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-guitarist-playing-acoustic-guitar-34232-large.mp4" },
    { id: "reel_2", title: "Batterie Zaouli & Solo", artist: "Sékou Drummer", views: "1.8K", category: "Batterie", thumbnail: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80", url: "https://assets.mixkit.co/videos/preview/mixkit-playing-drums-closeup-34301-large.mp4" },
    { id: "reel_3", title: "Bassline Groovy Abidjan", artist: "Paco Bass", views: "3.1K", category: "Basse", thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80", url: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-guitarist-playing-acoustic-guitar-34232-large.mp4" },
    { id: "reel_4", title: "Vocal Improvisation Afro", artist: "Awa Voix d'Or", views: "4.2K", category: "Chant", thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80", url: "https://assets.mixkit.co/videos/preview/mixkit-playing-drums-closeup-34301-large.mp4" }
  ], []);

  // Section 9: Nouveaux talents
  const talentsData = React.useMemo(() => {
    return users.filter(u => u.role === "musicien" || u.role === "artiste").slice(0, 8);
  }, [users]);

  // Section 10: Univers AFRIGOMBO ELITE
  const universeItems = React.useMemo(() => [
    { id: "u1", type: "product" as const, title: "Micro Studio Pro Neumann", image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&auto=format&fit=crop&q=80", description: "Qualité exceptionnelle pour vos sessions studio à Abidjan.", tag: "Grand Marché" },
    { id: "u2", type: "course" as const, title: "Maîtrise du Piano Afro-Jazz", image: "https://images.unsplash.com/photo-1520529612722-68ec39750058?w=400&auto=format&fit=crop&q=80", description: "Apprenez avec les virtuoses du Trône.", tag: "Académie" },
    { id: "u3", type: "event" as const, title: "Grand Concert du Trône 2026", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80", description: "Le plus grand rassemblement des orchestres d'Afrique.", tag: "Événements" }
  ], []);

  // NIVEAU 1 — INTELLIGENCE DES GOMBOS (Tri dynamique des 3 sections fixes)
  const level1Order = React.useMemo(() => {
    const nearbyCount = geo.getNearbyItems(GombosToRender, 25).length;
    const renfortCount = renfortGombos.length;
    const urgentCount = urgentGombos.length;

    const nearbyScore = (geo.latitude && geo.longitude ? 30 : 10) + nearbyCount * 2;
    const renfortScore = 20 + renfortCount * 4;
    const urgentScore = 15 + urgentCount * 3;

    const sections = [
      { id: "nearby", score: nearbyScore },
      { id: "renfort", score: renfortScore },
      { id: "urgent_recent", score: urgentScore }
    ];

    return sections.sort((a, b) => b.score - a.score).map(s => s.id);
  }, [geo.latitude, geo.longitude, GombosToRender, renfortGombos, urgentGombos]);

  const isLiked = (id: string) => likedGombos.includes(id);
  const toggleLike = (id: string) => {
    setLikedGombos(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <AndroidPageLayout
      header={
        <header className="flex flex-col pt-3 pb-2 sm:py-3 border-b border-afri-gold/30 bg-afri-bg shrink-0 gap-2 sm:gap-3.5 w-full animate-fadeIn select-none shadow-[0_10px_35px_rgba(0,0,0,0.85)] rounded-b-[24px] sm:rounded-b-[40px] z-[40] relative">
          {/* TOP ROW */}
          <div className="flex items-center justify-between w-full gap-1.5 xs:gap-2 sm:gap-4 px-1 sm:px-4">
            {/* Left: Menu & Logo Group */}
            <div className="flex items-center gap-1.5 xs:gap-2.5 sm:gap-5">
              <button
                id="hamburger-trigger"
                onClick={() => setIsSidebarOpen && setIsSidebarOpen(true)}
                className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-afri-bg-sec/40 border border-afri-border/80 text-afri-gold hover:bg-afri-gold/10 transition-all active:scale-95 shrink-0"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </button>

              <div className="flex items-center gap-1.5 xs:gap-2.5 sm:gap-4">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="AFRIGOMBO LOGO" 
                    className="w-8 h-8 xs:w-10 xs:h-10 sm:w-16 sm:h-16 object-contain rounded-2xl shrink-0"
                  />
                ) : (
                  <AfriGomboLogo className="w-8 h-8 xs:w-10 xs:h-10 sm:w-16 sm:h-16 shrink-0" />
                )}
                <div className="flex flex-col justify-center">
                  <h1 className="text-xl xs:text-2xl sm:text-5xl font-black tracking-tighter text-afri-gold leading-none font-display antialiased subpixel-antialiased" 
                      style={{ 
                        textShadow: "1px 1px 0px #B48F17"
                      }}>
                    AFRIGOMBO
                  </h1>
                  <span className="hidden xs:block text-[9.5px] sm:text-[13px] text-afri-text font-black tracking-wide mt-1 sm:mt-1.5 font-sans antialiased whitespace-nowrap">
                    Le Temple du Gombo Musical
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-5 shrink-0">
               {/* Notification with Badge */}
               <button 
                 onClick={() => {
                    setActiveMenu("user_notifications");
                 }} 
                 className="relative p-1.5 sm:p-2 text-afri-gold hover:scale-110 transition-transform cursor-pointer shrink-0"
                 title="Notifications"
               >
                 <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                 {unreadNotifsCount > 0 && (
                   <span className="absolute -top-1 -right-1 sm:-top-0.5 sm:-right-0.5 bg-red-600 text-afri-text font-mono font-black text-[9px] sm:text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-afri-border shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-pulse">
                     {unreadNotifsCount > 99 ? "99+" : unreadNotifsCount}
                   </span>
                 )}
               </button>

               {/* Profile Avatar */}
               <div 
                 onClick={() => { 
                    if (!currentUser) {
                      setShowHeritageLoginRequired && setShowHeritageLoginRequired(true);
                    } else {
                      setActiveMenu("user_edit_profile");
                      setViewingGomboIdDetail && setViewingGomboIdDetail(false); 
                    }
                 }}
                 className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-afri-gold overflow-hidden bg-afri-bg-sec cursor-pointer hover:scale-105 transition-transform shadow-[0_0_12px_rgba(212,175,55,0.2)] relative shrink-0"
               >
                 {profile?.avatarUrl || currentUser?.photoURL ? (
                    <img src={profile?.avatarUrl || currentUser?.photoURL || ""} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-afri-gold font-black text-xs sm:text-base">
                      {profile?.artisticName?.charAt(0) || currentUser?.displayName?.charAt(0) || "U"}
                    </div>
                 )}
                 {profile?.kycStatus === "approved" && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-afri-gold rounded-full border border-afri-border flex items-center justify-center">
                      <CheckCircle2 className="w-1.5 sm:w-2 h-1.5 sm:h-2 text-black stroke-[4]" />
                    </div>
                 )}
               </div>
            </div>
          </div>

          {/* BOTTOM ROW: STATS BAR */}
          <div className="w-full flex justify-center mt-0.5 px-3">
            <div className="flex items-center justify-center gap-2 xs:gap-3.5 sm:gap-8 px-2.5 xs:px-4 sm:px-8 py-1.5 sm:py-2.5 rounded-full bg-afri-bg-sec border border-afri-border/90 shadow-2xl overflow-x-auto afri-no-scrollbar max-w-full">
               <div className="flex items-center gap-1.5 shrink-0">
                 <Users className="w-3 h-3 sm:w-4 sm:h-4 text-afri-gold stroke-[2.5]" />
                 <span className="text-[7.5px] xs:text-[8px] sm:text-xs font-bold text-afri-text-sec uppercase tracking-wider">
                   <strong className="text-afri-text font-mono font-black">{users.filter(u => u.status === 'active').length}</strong> dispos
                 </span>
               </div>
               <div className="w-[0.5px] h-2.5 sm:h-4 bg-afri-bg-ter/40 shrink-0" />
               <div className="flex items-center gap-1.5 shrink-0">
                 <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-afri-gold stroke-[2.5]" />
                 <span className="text-[7.5px] xs:text-[8px] sm:text-xs font-bold text-afri-text-sec uppercase tracking-wider">
                   <strong className="text-afri-text font-mono font-black">{renforts.filter(r => r.status === 'active').length}</strong> renforts
                 </span>
               </div>
               <div className="w-[0.5px] h-2.5 sm:h-4 bg-afri-bg-ter/40 shrink-0" />
               <div className="flex items-center gap-1.5 shrink-0">
                 <Handshake className="w-3 h-3 sm:w-4 sm:h-4 text-afri-gold stroke-[2.5]" />
                 <span className="text-[7.5px] xs:text-[8px] sm:text-xs font-bold text-afri-text-sec uppercase tracking-wider">
                   <strong className="text-afri-text font-mono font-black">{contracts.filter(c => c.status.includes('accept') || c.status === 'payment_held' || c.status === 'in_progress').length}</strong> contrats
                 </span>
               </div>
            </div>
          </div>
        </header>
      }
      scrollable={true}
      className="pb-safe"
    >
      <div 
        ref={containerRef}
        className="w-full max-w-4xl mx-auto px-3 sm:px-6 space-y-6 text-left animate-fadeIn font-sans"
      >
      {/* ==========================================
          1. BARRE DE RECHERCHE UNIVERSELLE & MENU AUDIO
         ========================================== */}
      <div className="flex items-center gap-3 pt-3 sm:pt-4">
        <div className="relative flex-1">
          <div className="flex items-center gap-3 bg-afri-bg-sec border border-[#D4AF37]/30 rounded-3xl p-3 px-4 shadow-[0_2px_15px_rgba(212,175,55,0.05)] focus-within:border-[#D4AF37]/80 transition-all">
            <Search className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <input
              type="text"
              value={globalSearchTerm}
              onChange={(e) => {
                setGlobalSearchTerm(e.target.value);
                setUniversalSearchTerm(e.target.value);
                if (e.target.value.length > 0) {
                  /* silenced */
                }
              }}
              placeholder="Rechercher une opportunité, artiste..."
              className="w-full bg-transparent text-afri-text font-bold text-sm placeholder-zinc-500 focus:outline-none font-sans"
            />
            <button
              onClick={() => {
                setIsFiltersOpen(!isFiltersOpen);
              }}
              className={`transition p-1 cursor-pointer ${isFiltersOpen ? "text-afri-text" : "text-[#D4AF37] hover:text-afri-text"}`}
              title="Filtres avancés"
            >
              <Sliders className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Smart Audio Menu (Requirement 8) */}
        <SmartAudioMenu />
      </div>

      {/* Real Advanced Interactive Filter Panel */}
      {isFiltersOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 bg-afri-bg-sec border border-afri-border rounded-2xl p-4 space-y-4 shadow-2xl z-30 relative text-left"
        >
          <div className="flex justify-between items-center pb-2 border-b border-afri-border">
            <span className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              🎛️ Filtres de Recherche Réels
            </span>
            <span className="text-[10px] font-mono text-afri-text-sec">
              {GombosToRender.length} Gombos trouvés
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Commune select */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-black uppercase text-afri-text-sec">Commune / Ville</label>
              <select
                value={filterCommune}
                onChange={(e) => setFilterCommune(e.target.value)}
                className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="all">Toutes les communes</option>
                {IVORIAN_COMMUNES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Category select */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-black uppercase text-afri-text-sec">Catégorie / Style</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
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
              <label className="text-[10px] font-mono font-black uppercase text-afri-text-sec">Type de Gombo</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
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
              <label className="text-[10px] font-mono font-black uppercase text-afri-text-sec">Budget (FCFA)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filterMinBudget || ""}
                  onChange={(e) => setFilterMinBudget(Number(e.target.value))}
                  className="w-1/2 bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filterMaxBudget || ""}
                  onChange={(e) => setFilterMaxBudget(Number(e.target.value))}
                  className="w-1/2 bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Distance Filter (Requirement 8) */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-black uppercase text-afri-text-sec">Distance Max ({filterMaxDistance} km)</label>
              <input
                type="range"
                min="1"
                max="100"
                step="5"
                value={filterMaxDistance}
                onChange={(e) => setFilterMaxDistance(Number(e.target.value))}
                className="w-full accent-[#D4AF37] cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-mono text-afri-text-sec uppercase">
                <span>1km</span>
                <span>100km</span>
              </div>
            </div>

            {/* Availability Filter (Requirement 8) */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-black uppercase text-afri-text-sec">Status</label>
              <button
                type="button"
                onClick={() => setFilterAvailableOnly(!filterAvailableOnly)}
                className={`w-full flex items-center justify-between px-3 py-2 border rounded-xl transition-all cursor-pointer ${
                  filterAvailableOnly 
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500" 
                    : "bg-afri-bg-sec border-afri-border text-afri-text-sec"
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-wider">Disponible maintenant</span>
                <div className={`w-3 h-3 rounded-full ${filterAvailableOnly ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" : "bg-zinc-700"}`} />
              </button>
            </div>

            {/* Date */}
            <div className="space-y-1 col-span-1 sm:col-span-2">
              <label className="text-[10px] font-mono font-black uppercase text-afri-text-sec">Date de l'événement</label>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterDateMode("all")}
                  className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                    filterDateMode === "all"
                      ? "bg-afri-bg-sec border-[#D4AF37] text-black"
                      : "bg-afri-bg-sec border-afri-border text-afri-text-sec hover:text-afri-text"
                  }`}
                >
                  Tout
                </button>
                <button
                  type="button"
                  onClick={() => setFilterDateMode("today")}
                  className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                    filterDateMode === "today"
                      ? "bg-afri-bg-sec border-[#D4AF37] text-black"
                      : "bg-afri-bg-sec border-afri-border text-afri-text-sec hover:text-afri-text"
                  }`}
                >
                  Aujourd'hui
                </button>
                <button
                  type="button"
                  onClick={() => setFilterDateMode("week")}
                  className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                    filterDateMode === "week"
                      ? "bg-afri-bg-sec border-[#D4AF37] text-black"
                      : "bg-afri-bg-sec border-afri-border text-afri-text-sec hover:text-afri-text"
                  }`}
                >
                  Cette semaine
                </button>
                <button
                  type="button"
                  onClick={() => setFilterDateMode("month")}
                  className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                    filterDateMode === "month"
                      ? "bg-afri-bg-sec border-[#D4AF37] text-black"
                      : "bg-afri-bg-sec border-afri-border text-afri-text-sec hover:text-afri-text"
                  }`}
                >
                  Ce mois
                </button>
              </div>
            </div>
          </div>

          {/* Close / Apply / Reset Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-afri-border">
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
                /* silenced */
              }}
              className="px-4 py-2 bg-afri-bg-sec hover:bg-afri-bg-sec text-afri-text-sec hover:text-afri-text rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              Réinitialiser
            </button>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFiltersOpen(false);
                }}
                className="px-4 py-2 bg-afri-bg border border-afri-border hover:bg-afri-bg-sec text-afri-text rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFiltersOpen(false);
                }}
                className="px-5 py-2 bg-afri-bg-sec hover:bg-afri-bg-sec text-black rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md"
              >
                Appliquer ({GombosToRender.length})
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Dynamic Inline Search Results Dropdown Overlay */}
      {globalSearchTerm.trim().length > 0 && (
        <div className="absolute top-14 left-0 right-0 bg-afri-bg-sec border border-afri-border rounded-2xl p-4 z-50 max-h-80 overflow-y-auto space-y-2.5 shadow-2xl">
          <div className="flex justify-between items-center text-[9px] font-mono text-afri-text-sec font-bold">
            <span>RECHERCHE MULTI-CRITÈRES (TEMPS RÉEL)</span>
            <button onClick={() => setGlobalSearchTerm("")} className="text-[#D4AF37] font-black uppercase">Fermer</button>
          </div>

          {/* Automatic GOMBO ID Detection */}
          {(/^(GOMBO|GB|AG|GID|ID)-/i.test(globalSearchTerm.trim()) || globalSearchTerm.trim().toUpperCase().startsWith("GOMBO-")) && (
            <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37] rounded-xl flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
              <div className="text-left">
                <span className="text-[9.5px] font-mono font-black text-[#D4AF37] uppercase tracking-wider block">🆔 GOMBO ID DÉTECTÉ</span>
                <span className="text-xs text-afri-text font-bold truncate">{globalSearchTerm.toUpperCase()}</span>
              </div>
              <button
                onClick={() => {
                  const matchedUser = users.find(u => 
                    u.gomboIdNumber === globalSearchTerm || 
                    formatGomboIdDisplay(u.gomboIdNumber) === globalSearchTerm.toUpperCase() ||
                    getEffectiveGomboId(u) === globalSearchTerm.toUpperCase() ||
                    u.gomboId?.id === globalSearchTerm || 
                    (u.artisticName && u.artisticName.toLowerCase().includes(globalSearchTerm.toLowerCase()))
                  );
                  const matchedGombo = gombos.find(g => g.id === globalSearchTerm || g.gomboId === globalSearchTerm);
                  
                  if (matchedGombo) {
                    handleOpenGomboDetails(matchedGombo);
                  } else {
                    requireAuthThen(() => setActiveMenu("user_gombo_id"));
                  }
                  setGlobalSearchTerm("");
                }}
                className="px-3 py-1.5 bg-[#D4AF37] text-black font-black text-[10px] rounded-lg uppercase tracking-wider hover:bg-amber-400 transition cursor-pointer shrink-0 shadow-md"
              >
                Ouvrir Profil ID →
              </button>
            </div>
          )}

          {GombosToRender.slice(0, 5).map((g, i) => (
            <div
              key={g.id || i}
              onClick={() => {
                handleOpenGomboDetails(g);
                setGlobalSearchTerm("");
              }}
              className="p-2 hover:bg-afri-bg-sec rounded-xl cursor-pointer flex justify-between items-center transition"
            >
              <div className="text-left">
                <span className="text-xs text-afri-text font-bold block truncate max-w-[200px]">{g.title}</span>
                <span className="text-[9.5px] text-[#D4AF37] font-mono leading-none">📍 {g.location} • {(g.budget || 0).toLocaleString("fr-FR")} FCFA</span>
              </div>
              <span className="text-[9px] font-mono text-afri-text-sec uppercase font-bold shrink-0">Ouvrir →</span>
            </div>
          ))}
        </div>
      )}

      {/* ==========================================
          2. ACTIONS RAPIDES (NOUVELLE VERSION BÊTA FINALE - 4 ACTIONS CLÉS)
         ========================================== */}
      <div className={`afri-card transition-all duration-300 shadow-[0_4px_25px_rgba(212,175,55,0.08)] ${isQuickActionsOpen ? "p-3 sm:p-5 space-y-3 sm:space-y-4" : "py-2 px-3 sm:px-4"}`}>
        <button
          onClick={() => {
            setIsQuickActionsOpen(!isQuickActionsOpen);
            try { audioSynth?.playTamTam?.(false); } catch(_) {}
          }}
          className="w-full flex justify-between items-center text-left focus:outline-none cursor-pointer hover:opacity-90 select-none"
        >
          <h3 className="afri-title-sm sm:afri-title-md text-afri-text flex items-center gap-1.5">
            <span>⚡ ACTIONS RAPIDES</span>
          </h3>
          <span className="text-[8px] xs:text-[10px] font-mono font-black text-[#D4AF37] bg-afri-bg border border-[#D4AF37]/20 w-4.5 h-4.5 xs:w-5 xs:h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center transition-all">
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
                 id: "pres_de_moi", 
                 label: "Près de moi", 
                 emoji: "📍", 
                 action: () => { 
                   if (geo.permissionStatus !== "granted") {
                     geo.requestLocation();
                   }
                   setActiveMenu("nearby");
                   try { audioSynth?.playValidationSuccess?.(); } catch (_) {} 
                 } 
               },
               { 
                 id: "urgences", 
                 label: "Urgences", 
                 emoji: "🚨", 
                 badge: gombos.filter(g => g.urgent || g.isExpress || (g as any).type === "renfort" || g.category === "casting" || g.isRenfort).length || undefined,
                 badgeColor: "bg-red-600 text-afri-text animate-pulse",
                 action: () => { 
                   setIsUrgencesModalOpen(true); 
                   try { audioSynth?.playValidationSuccess?.(); } catch (_) {} 
                 } 
               },
               { 
                 id: "mes_favoris", 
                 label: "Mes Favoris", 
                 emoji: "⭐", 
                 badge: likedGombos.length > 0 ? likedGombos.length : undefined,
                 badgeColor: "bg-[#D4AF37] text-black",
                 action: () => { 
                   setIsFavoritesModalOpen(true); 
                   try { audioSynth?.playValidationSuccess?.(); } catch (_) {} 
                 } 
               },
               { 
                 id: "mes_candidatures", 
                 label: "Candidatures", 
                 emoji: "🎫", 
                 badge: userApplications.length > 0 ? userApplications.length : undefined,
                 badgeColor: "bg-emerald-500 text-afri-text",
                 action: () => requireAuthThen(() => { 
                   setIsCandidaturesModalOpen(true); 
                   try { audioSynth?.playValidationSuccess?.(); } catch (_) {} 
                 }) 
               }
             ].map(action => (
               <motion.button
                 key={action.id}
                 variants={{
                   hidden: { opacity: 0, y: 15, scale: 0.95 },
                   show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } }
                 }}
                 whileHover={{ scale: 1.04 }}
                 whileTap={{ scale: 0.92 }}
                 onClick={action.action}
                 className="bg-afri-bg-sec border border-[#D4AF37]/25 rounded-2xl p-2 flex flex-col items-center justify-center gap-1 shadow-md hover:bg-afri-bg-sec/5 transition-all cursor-pointer relative group"
               >
                 {(action as any).badge !== undefined && (
                   <span className={`absolute -top-1.5 -right-1.5 ${(action as any).badgeColor} text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-afri-border shadow-md z-10`}>
                     {(action as any).badge}
                   </span>
                 )}
                 <div className="w-10 h-10 rounded-full bg-afri-bg-sec/8 flex items-center justify-center border border-[#D4AF37]/20 group-hover:border-[#D4AF37] transition shrink-0">
                   <span className="text-xl leading-none select-none">{action.emoji}</span>
                 </div>
                 <span className="text-[9px] text-afri-text/90 font-black tracking-wider uppercase text-center truncate w-full px-1">
                   {action.label}
                 </span>
               </motion.button>
             ))}
          </motion.div>
        </div>
      </div>

      <UserPollsWidget 
        currentUser={currentUser} 
        profile={profile} 
        audioSynth={audioSynth} 
      />

       {/* ==========================================
          SECTION 3 — 🔥 TENDANCES AFRIGOMBO ELITE (PREMIUM)
          Vitrine officielle de la plateforme. Apparaît AVANT les Gombos.
         ========================================== */}
      <div id="tendances-afrigombo-section" className="space-y-4">
        <TendancesSection 
          gombos={gombos}
          posts={posts}
          users={users}
          currentUserProfile={profile}
          onSelectGomboDetails={handleOpenGomboDetails}
          audioSynth={audioSynth}
          requireAuthThen={requireAuthThen}
        />
      </div>

      {/* ==========================================
          SECTIONS 4, 5, 6 — ZONE OPPORTUNITÉS (NIVEAU 1 FIXE)
          Gombos à proximité, Renfort Express, Nouveaux Gombos
         ========================================== */}
      <div className="space-y-6 bg-afri-bg-sec/40 border border-[#D4AF37]/35 p-4 sm:p-5 rounded-3xl backdrop-blur-sm relative shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-ping" />
            <h2 className="text-[11px] font-mono font-black uppercase tracking-widest text-[#D4AF37]">
              🎯 ZONE OPPORTUNITÉS (FIXE & DÉDIÉE)
            </h2>
          </div>
          <span className="text-[8px] font-mono font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30 uppercase">
            GOMBOS PRIORITAIRES
          </span>
        </div>

        {/* Dynamic Smart Sorting of Level 1 Sections */}
        {level1Order.map((sectionId) => {
          if (sectionId === "nearby") {
            return (
              <div key="nearby" id="nearby-gombos-section" className="space-y-3">
                <NearbyGombosSection 
                  gombos={geo.getNearbyItems(gombos, 25)}
                  userProfile={profile}
                  onSelect={handleOpenGomboDetails}
                />
              </div>
            );
          }
          if (sectionId === "renfort") {
            return (
              <SmartBlock 
                key="renfort"
                type="RENFORT_EXPRESS"
                title="⚡ Renfort Express & Remplacements"
                data={renfortGombos}
                onAction={handleOpenGomboDetails}
              />
            );
          }
          if (sectionId === "urgent_recent") {
            return (
              <div key="urgent_recent" className="space-y-6">
                <SmartBlock 
                  type="URGENT_OPPORTUNITIES"
                  title="🔥 Opportunités urgentes"
                  data={urgentGombos}
                  onAction={handleOpenGomboDetails}
                />
                <SmartBlock 
                  type="NEW_GOMBOS"
                  title="🆕 Gombos récents"
                  data={recentGombos}
                  onAction={handleOpenGomboDetails}
                />
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* ==========================================
          NIVEAU 2 — UNIVERS AFRIGOMBO ELITE
          Découverte intelligente et libre de tout l'écosystème.
         ========================================== */}
      <div className="space-y-8 pb-10 pt-2">
        {/* AFRIGOMBO ELITE GEO ENGINE: RADAR & ARTISTES */}
        <GeoRadarSection 
          nearbyGombos={geo.getNearbyItems(gombos, 10)}
          nearbyArtists={geo.getNearbyItems(users.filter(u => u.role === "musicien"), 15)}
          onAction={(item) => {
            if (item.radarType === "gombo") handleOpenGomboDetails(item);
            else setActiveMenu("user_profile_view");
          }}
        />

        <NearbyArtistsSection 
          artists={geo.getNearbyItems(users.filter(u => u.role === "musicien" && u.availability?.status === "available"), 50)}
          userProfile={profile}
          onContact={(artist) => {
            requireAuthThen(() => {
              addToTerminal(`[MESSAGERIE] Connexion établie avec ${artist.artisticName}...`);
              setActiveMenu("user_messages");
            });
          }}
        />

        {/* Artist Search Results */}
        {globalSearchTerm && UsersToRender.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[11px] font-black tracking-[0.2em] text-afri-text uppercase flex items-center gap-2 px-1">
              🔍 Artistes correspondants ({UsersToRender.length})
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 px-1 afri-no-scrollbar">
              {UsersToRender.map((artist: any) => (
                <div 
                  key={artist.uid}
                  className="min-w-[150px] max-w-[150px] afri-card p-3 space-y-2 shrink-0"
                >
                  <img 
                    src={artist.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                    alt={artist.artisticName}
                    className="w-full h-24 rounded-xl object-cover border border-afri-border"
                  />
                  <h4 className="text-[10px] font-black text-afri-text uppercase truncate">{artist.artisticName || artist.displayName}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-afri-text-sec uppercase">{artist.commune || "Abidjan"}</span>
                    <span className="text-[8px] font-black text-[#D4AF37] uppercase">{artist.distance ? getDistanceLabel(artist.distance) : "Dist. inconnue"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. SÉLECTION DU SOUVERAIN */}
        <SmartBlock 
          type="TRENDS"
          title="👑 Sélection du Souverain"
          data={sovereignGombos}
          onAction={handleOpenGomboDetails}
        />

        {/* 8. RÉELS D'ARTISTES (Redirige vers l'écran dédié Fil Réel) */}
        <SmartBlock 
          type="POPULAR_REELS"
          title="📹 Réels d'artistes — Fil Réel"
          data={reelsData}
          onAction={(item) => {
            requireAuthThen(() => setActiveMenu("user_reels"));
          }}
        />

        {/* 9. NOUVEAUX TALENTS */}
        <SmartBlock 
          type="NEW_TALENTS"
          title="🚀 Nouveaux talents"
          data={talentsData}
          onAction={(artist) => {
            requireAuthThen(() => setActiveMenu("user_profile_view"));
          }}
        />

        {/* 10. UNIVERS AFRIGOMBO ELITE */}
        <SmartUniverseCarousel 
          items={universeItems}
          onAction={(item) => {
            if (item.type === "product") requireAuthThen(() => setActiveMenu("user_grand_marche"));
            else if (item.type === "course") requireAuthThen(() => setActiveMenu("user_academie"));
          }}
        />

        {/* 11. GRAND MARCHÉ */}
        <div className="space-y-3 py-2 text-left bg-afri-bg-sec/30 p-4 rounded-3xl border border-afri-border">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <h3 className="text-[11px] font-sans font-black tracking-widest text-afri-text uppercase">
                🛒 Grand Marché Matériel & Studio
              </h3>
            </div>
            <button 
              onClick={() => requireAuthThen(() => setActiveMenu("user_grand_marche"))}
              className="text-[10px] text-[#D4AF37] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Voir tout <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                id: "gm1",
                title: "Pack Micro Studio Pro & Pied",
                price: "185 000 FCFA",
                commune: "Cocody",
                image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&auto=format&fit=crop&q=80",
                tag: "Matériel Pro"
              },
              {
                id: "gm2",
                title: "Guitare Électrique Yamaha RGX",
                price: "240 000 FCFA",
                commune: "Marcory",
                image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
                tag: "Instrument"
              },
              {
                id: "gm3",
                title: "Console de Mixage 16 Voies",
                price: "450 000 FCFA",
                commune: "Yopougon",
                image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80",
                tag: "Sonorisation"
              }
            ].map((prod) => (
              <div 
                key={prod.id}
                onClick={() => requireAuthThen(() => setActiveMenu("user_grand_marche"))}
                className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden p-2.5 flex flex-col justify-between hover:border-[#D4AF37]/50 transition cursor-pointer group shadow-sm"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden mb-2 bg-afri-bg">
                  <img src={prod.image} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-1.5 left-1.5 bg-afri-bg/80 text-[#D4AF37] font-mono text-[8px] font-black px-2 py-0.5 rounded-full border border-[#D4AF37]/30 uppercase">
                    {prod.tag}
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-afri-text uppercase truncate leading-tight">{prod.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-black text-[#D4AF37]">{prod.price}</span>
                    <span className="text-[8px] font-mono text-afri-text-sec uppercase">📍 {prod.commune}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => requireAuthThen(() => setActiveMenu("user_grand_marche"))}
            className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-mono font-black text-[10px] uppercase tracking-wider rounded-2xl transition cursor-pointer text-center block active:scale-98"
          >
            Accéder au Grand Marché Musique →
          </button>
        </div>

        {/* 12. AFRIGOMBO ELITE ACADEMY */}
        <div className="space-y-3 py-2 text-left bg-afri-bg-sec/30 p-4 rounded-3xl border border-afri-border">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-sky-400" />
              <h3 className="text-[11px] font-sans font-black tracking-widest text-afri-text uppercase">
                🎓 AFRIGOMBO ELITE Academy & Masterclasses
              </h3>
            </div>
            <button 
              onClick={() => requireAuthThen(() => setActiveMenu("user_academie"))}
              className="text-[10px] text-[#D4AF37] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Voir tout <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: "ac1",
                title: "Masterclass Piano Afro-Jazz & Harmonies",
                mentor: "Maître Kassi",
                level: "Intermédiaire / Avancé",
                image: "https://images.unsplash.com/photo-1520529612722-68ec39750058?w=400&auto=format&fit=crop&q=80",
                badge: "Certifiant"
              },
              {
                id: "ac2",
                title: "Production & Mixage Afrobeat sur FL Studio",
                mentor: "Beatmaker Yoboué",
                level: "Tous Niveaux",
                image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80",
                badge: "Populaire"
              }
            ].map((course) => (
              <div 
                key={course.id}
                onClick={() => requireAuthThen(() => setActiveMenu("user_academie"))}
                className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden p-3 flex gap-3 items-center hover:border-sky-400/50 transition cursor-pointer group shadow-sm"
              >
                <img src={course.image} alt={course.title} className="w-20 h-20 rounded-xl object-cover shrink-0 border border-afri-border group-hover:scale-105 transition-transform" />
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[8px] font-mono font-black uppercase text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 inline-block">
                    {course.badge}
                  </span>
                  <h4 className="text-[11px] font-black text-afri-text uppercase leading-tight line-clamp-2">{course.title}</h4>
                  <p className="text-[9px] text-afri-text-sec font-mono">👨‍🏫 {course.mentor} • {course.level}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => requireAuthThen(() => setActiveMenu("user_academie"))}
            className="w-full py-2.5 bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 text-sky-400 font-mono font-black text-[10px] uppercase tracking-wider rounded-2xl transition cursor-pointer text-center block active:scale-98"
          >
            Découvrir l'Académie & Se Former →
          </button>
        </div>

        {/* INFINITE EXTENSION STREAM (NO DUPLICATE HEADERS) */}
        {infiniteFeedPage > 1 && (
          <div className="space-y-4 pt-4 border-t border-afri-border/60 text-left">
            <h3 className="text-[11px] font-black tracking-widest text-[#D4AF37] uppercase flex items-center gap-2 px-1">
              📜 Plus d'opportunités du Trône ({GombosToRender.slice(10, 10 + infiniteFeedPage * 4).length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GombosToRender.slice(10, 10 + infiniteFeedPage * 4).map((g) => (
                <div 
                  key={`inf_${g.id}`}
                  onClick={() => handleOpenGomboDetails(g)}
                  className="bg-afri-bg-sec border border-afri-border rounded-2xl p-3 space-y-2 hover:border-[#D4AF37]/40 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-black text-afri-text uppercase truncate">{g.title}</h4>
                    <span className="text-[10px] font-mono font-black text-[#D4AF37]">{(g.budget || 0).toLocaleString()} F</span>
                  </div>
                  <p className="text-[10px] text-afri-text-sec line-clamp-2">{g.description}</p>
                  <div className="flex items-center justify-between text-[9px] font-mono text-afri-text-sec pt-1">
                    <span>📍 {g.location || "Abidjan"}</span>
                    <span className="text-[#D4AF37] font-bold">Ouvrir le Gombo →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Loading Anchor */}
        <div ref={observerTarget} className="h-16 flex items-center justify-center">
          {isLoadingMore && (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#D4AF37] animate-spin" />
              <span className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest">Chargement impérial...</span>
            </div>
          )}
          {!hasMore && (
            <span className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest">Toutes les opportunités sont affichées</span>
          )}
        </div>

        {/* 13. FOOTER */}
        <AfrigomboFooter setActiveMenu={setActiveMenu} requireAuthThen={requireAuthThen} />
      </div>

      {/* ==========================================
          GEO PERMISSION DIALOG
         ========================================== */}
      {showGeoDialog && (
        <AndroidCenteredDialog
          isOpen={showGeoDialog}
          title="AUTORISATION GÉOLOCALISATION"
          onClose={() => setShowGeoDialog(false)}
        >
          <div className="space-y-4 text-center p-2">
            <div className="w-16 h-16 bg-afri-bg-ter rounded-full flex items-center justify-center mx-auto border border-afri-border">
              <MapPin className="w-8 h-8 text-[#D4AF37] animate-bounce" />
            </div>
            <p className="text-xs text-afri-text-sec font-bold uppercase leading-relaxed">
              Autoriser AFRIGOMBO ELITE à accéder à votre position afin de trouver les opportunités et artistes proches de vous.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowGeoDialog(false)}
                className="flex-1 py-2.5 bg-afri-bg-ter border border-afri-border rounded-xl text-[10px] font-black uppercase text-afri-text-sec"
              >
                Plus tard
              </button>
              <button 
                onClick={() => {
                  geo.requestLocation();
                  setShowGeoDialog(false);
                }}
                className="flex-1 py-2.5 bg-afri-bg-sec text-black rounded-xl text-[10px] font-black uppercase shadow-lg shadow-afri-bg-sec/20"
              >
                Autoriser
              </button>
            </div>
          </div>
        </AndroidCenteredDialog>
      )}



      {/* =========================================================================
          INTERACTIVE ACTIONS MODAL OVERLAYS (SOUVERAIN COMMANDE CENTRE)
         ========================================================================= */}
      {activeQuickActionModal && (
        <div className="fixed inset-0 bg-afri-bg/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className={`bg-afri-bg-sec border border-afri-border rounded-3xl p-4 sm:p-6 w-full ${activeQuickActionModal === "search_member" ? "max-w-6xl h-[90vh] overflow-y-auto" : "max-w-md"} my-8 relative overflow-hidden select-none shadow-xl`}>
            
            <button
              onClick={() => {
                setActiveQuickActionModal(null);
                /* silenced */
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-afri-bg-sec hover:bg-afri-bg-ter text-[#D4AF37] hover:text-afri-text border border-afri-border flex items-center justify-center cursor-pointer transition focus:outline-none z-50"
            >
              <X className="w-4 h-4" />
            </button>

            {/* MODAL I: COMPREHENSIVE TALENTS DIRECTORY OVER INTERNAL MEMBERS */}
            {activeQuickActionModal === "search_member" && (
              <div className="space-y-4 text-left font-sans">
                <div className="pb-2 border-b border-afri-border">
                  <h3 className="text-sm font-sans font-black tracking-widest text-afri-text uppercase flex items-center gap-2">
                    👥 RECHERCHER ET DÉCOUVRIR UN MAÎTRE DE SCÈNE
                  </h3>
                  <p className="text-[11px] text-afri-text-sec mt-1">Sélecteur de performance certifié d'Afrique de l'Ouest. Explorez librement leur parcours en toute confidentialité.</p>
                </div>
                <div className="bg-afri-bg-sec p-2 rounded-2xl border border-afri-border/60 transition-all">
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
                  <h3 className="text-sm font-sans font-black tracking-widest text-afri-text uppercase flex items-center gap-2">
                    🛡️ VÉRIFICATION ACADÉMIQUE DU COMPTE
                  </h3>
                  <p className="text-[11px] text-afri-text-sec mt-1">Vérification de l'intégrité nationale des musiciens.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: GMB-125-487"
                      value={verifyGomboIdInput}
                      onChange={(e) => setVerifyGomboIdInput(e.target.value)}
                      className="flex-1 bg-afri-bg border border-afri-border text-xs text-[#D4AF37] p-2.5 rounded-xl font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const searchVal = verifyGomboIdInput.trim().toUpperCase();
                        const verifiedUser = users.find(u => u.kycStatus === "approved" && (
                          u.gomboIdNumber === searchVal || 
                          formatGomboIdDisplay(u.gomboIdNumber) === searchVal ||
                          getEffectiveGomboId(u) === searchVal ||
                          u.gomboId?.id === searchVal ||
                          (typeof u.gomboId === "string" && u.gomboId === searchVal)
                        ));
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
                        /* silenced */
                      }}
                      className="bg-afri-bg-sec text-black px-4 text-xs font-bold rounded-xl"
                    >
                      Valider
                    </button>
                  </div>

                  {verifyGomboIdResult && (
                    <div className="p-4 bg-afri-bg border border-afri-border rounded-xl space-y-1">
                      {verifyGomboIdResult.success ? (
                        <>
                          <span className="text-[9.5px] font-mono text-emerald-400 uppercase font-black">✓ COMPTE RECONNU INTÈGRE</span>
                          <p className="text-xs text-afri-text font-bold">{verifyGomboIdResult.artisticName} ({verifyGomboIdResult.name})</p>
                          <p className="text-[10px] text-afri-text-sec">Score d'Afrique de l'Ouest : <span className="text-[#D4AF37] font-bold">{verifyGomboIdResult.score}% garantis</span></p>
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
                  <h3 className="text-sm font-sans font-black tracking-widest text-afri-text uppercase">
                    📢 DIFFUSER URGENCE NATIONALE
                  </h3>
                  <p className="text-[11px] text-afri-text-sec mt-1">Transmettre par vibration sonore de Tam-tam sur le Terrain.</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-afri-text-sec uppercase font-black">Sujet principal</label>
                    <input
                      type="text"
                      placeholder="Ex: Session acoustique studio urgente"
                      value={newNoticeTitle}
                      onChange={(e) => setNewNoticeTitle(e.target.value)}
                      className="w-full bg-afri-bg border border-afri-border text-xs text-afri-text p-2.5 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-[#D4AF37] uppercase font-black">Intensité</label>
                    <select
                      value={newNoticeCategory}
                      onChange={(e) => setNewNoticeCategory(e.target.value)}
                      className="w-full bg-afri-bg border border-afri-border text-xs text-[#D4AF37] p-2.5 rounded-xl focus:outline-none font-bold"
                    >
                      <option value="INFO">INFORMATION générale</option>
                      <option value="URGENT">URGENT (Alerte vibration rouge)</option>
                      <option value="BUZZ">ACTUS SCÈNES (Grande clameur)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-afri-text-sec uppercase font-black">Annonce</label>
                    <textarea
                      rows={3}
                      placeholder="Quel est le message pour la communauté ?"
                      value={newNoticeBody}
                      onChange={(e) => setNewNoticeBody(e.target.value)}
                      className="w-full bg-afri-bg border border-afri-border text-xs text-afri-text p-2.5 rounded-xl focus:outline-none font-sans"
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
                        /* silenced */
                      } else {
                        addToTerminal("[ERREUR] Veuillez remplir l'annonce souveraine.");
                      }
                    }}
                    className="w-full py-2.5 bg-afri-bg-sec text-black font-black text-xs rounded-xl hover:opacity-90 transition uppercase font-sans tracking-widest mt-1"
                  >
                    Lancer la propagation ⚡
                  </button>
                </div>
              </div>
            )}

            {/* MODAL IV: DISPONIBILITÉ MAINTENANT (Requirement 4) */}
            {activeQuickActionModal === "set_availability" && (
              <div className="space-y-4 text-left">
                <div>
                  <h3 className="text-sm font-sans font-black tracking-widest text-afri-text uppercase flex items-center gap-2">
                    🟢 MODE DISPONIBLE MAINTENANT
                  </h3>
                  <p className="text-[11px] text-afri-text-sec mt-1">Les promoteurs voient immédiatement que vous êtes prêt pour un Gombo.</p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "2 Heures", val: 2 },
                      { label: "4 Heures", val: 4 },
                      { label: "8 Heures", val: 8 },
                      { label: "Aujourd'hui", val: "today" }
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={async () => {
                          await geo.setAvailability(opt.val as any);
                          setActiveQuickActionModal(null);
                          addToTerminal(`[DISPONIBILITÉ] Mode "Disponible" activé pour ${opt.label}`);
                        }}
                        className="p-3 bg-afri-bg border border-afri-border rounded-xl hover:border-emerald-500/50 transition text-[10px] font-black uppercase text-afri-text"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={async () => {
                      await geo.disableAvailability();
                      setActiveQuickActionModal(null);
                      addToTerminal(`[DISPONIBILITÉ] Mode "Disponible" désactivé`);
                    }}
                    className="w-full py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 font-black text-[10px] rounded-xl uppercase"
                  >
                    Désactiver le mode
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          PLUS COCKPIT POPUP (ANDROID BOTTOM SHEET)
         ========================================== */}
      <AndroidBottomSheet
        isOpen={isPlusMenuOpen}
        onClose={() => setIsPlusMenuOpen(false)}
        title={
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🌟</span>
            <div>
              <h3 className="text-xs sm:text-sm font-sans font-black text-afri-text uppercase tracking-widest leading-none">
                AFRIGOMBO ELITE PLUS COCKPIT
              </h3>
              <p className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider mt-1 font-bold">Tableau des Commandes Avancées</p>
            </div>
          </div>
        }
      >
        <div className="space-y-4 overflow-y-auto max-h-[62vh] pb-3 pr-1">

          {/* 🚀 CROISSANCE */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1 text-[10px] font-sans font-black text-[#D4AF37] uppercase tracking-widest">
              <span>🚀</span>
              <span>CROISSANCE</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* Booster une annonce */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  requireAuthThen(() => {
                    setActiveMenu("user_gombo_plus");
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  });
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-500/55 transition">
                  <span className="text-sm">⭐</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Booster une annonce</div>
                  <span className="text-[7.5px] font-mono text-amber-500 uppercase tracking-widest block leading-none mt-1 font-bold">GOMBO PLUS</span>
                </div>
              </button>

              {/* Passer Premium */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  requireAuthThen(() => {
                    setActiveMenu("user_gombo_plus");
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  });
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 group-hover:border-[#D4AF37]/55 transition">
                  <span className="text-sm">👑</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Passer Premium</div>
                  <span className="text-[7.5px] font-mono text-[#D4AF37] uppercase tracking-widest block leading-none mt-1 font-bold">PRESTIGE</span>
                </div>
              </button>

              {/* Mes campagnes de visibilité */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  setLocalComingSoonKey("Mes campagnes de visibilité");
                  try { audioSynth?.playValidationSuccess(); } catch (_) {}
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/55 transition">
                  <span className="text-sm">⚡</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Mes campagnes de visibilité</div>
                  <span className="text-[7.5px] font-mono text-emerald-400 uppercase tracking-widest block leading-none mt-1 font-bold">BOOST</span>
                </div>
              </button>

              {/* Vérification Gombo ID */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  requireAuthThen(() => {
                    setActiveMenu("user_gombo_id");
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  });
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 group-hover:border-sky-500/55 transition">
                  <span className="text-sm">🛡️</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Vérification Gombo ID</div>
                  <span className="text-[7.5px] font-mono text-sky-400 uppercase tracking-widest block leading-none mt-1 font-bold">SÉCURITÉ</span>
                </div>
              </button>
            </div>
          </div>

          {/* 💰 FINANCES */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 px-1 text-[10px] font-sans font-black text-emerald-400 uppercase tracking-widest">
              <span>💰</span>
              <span>FINANCES</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* Mon Wallet */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  requireAuthThen(() => {
                    setActiveMenu("user_wallet");
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  });
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/55 transition">
                  <span className="text-sm">💼</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Mon Wallet</div>
                  <span className="text-[7.5px] font-mono text-emerald-400 uppercase tracking-widest block leading-none mt-1 font-bold">PORTEFEUILLE</span>
                </div>
              </button>

              {/* Revenus */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  requireAuthThen(() => {
                    setActiveMenu("user_wallet");
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  });
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/55 transition">
                  <span className="text-sm">💵</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Revenus</div>
                  <span className="text-[7.5px] font-mono text-emerald-400 uppercase tracking-widest block leading-none mt-1 font-bold">GAINS</span>
                </div>
              </button>

              {/* Historique financier */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  setIsHistoryModalOpen(true);
                  try { audioSynth?.playValidationSuccess(); } catch (_) {}
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/55 transition">
                  <span className="text-sm">🕓</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Historique financier</div>
                  <span className="text-[7.5px] font-mono text-blue-400 uppercase tracking-widest block leading-none mt-1 font-bold">TRANSACTIONS</span>
                </div>
              </button>

              {/* Contrats sécurisés */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  requireAuthThen(() => {
                    setActiveMenu("user_contracts");
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  });
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 group-hover:border-[#D4AF37]/55 transition">
                  <span className="text-sm">📜</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Contrats sécurisés</div>
                  <span className="text-[7.5px] font-mono text-[#D4AF37] uppercase tracking-widest block leading-none mt-1 font-bold">CERTIFIÉS</span>
                </div>
              </button>
            </div>
          </div>

          {/* 🎨 CRÉATEUR */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 px-1 text-[10px] font-sans font-black text-purple-400 uppercase tracking-widest">
              <span>🎨</span>
              <span>CRÉATEUR</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* Studio Audio */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  setLocalComingSoonKey("Studio Audio");
                  try { audioSynth?.playValidationSuccess(); } catch (_) {}
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:border-purple-500/55 transition">
                  <span className="text-sm">🎙️</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Studio Audio</div>
                  <span className="text-[7.5px] font-mono text-purple-400 uppercase tracking-widest block leading-none mt-1 font-bold">STUDIO</span>
                </div>
              </button>

              {/* Studio Vidéo */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  requireAuthThen(() => {
                    setActiveMenu("user_reels");
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  });
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 group-hover:border-pink-500/55 transition">
                  <span className="text-sm">🎥</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Studio Vidéo</div>
                  <span className="text-[7.5px] font-mono text-pink-400 uppercase tracking-widest block leading-none mt-1 font-bold">RÉELS</span>
                </div>
              </button>

              {/* Podcast Studio */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  setLocalComingSoonKey("Podcast Studio");
                  try { audioSynth?.playValidationSuccess(); } catch (_) {}
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 group-hover:border-[#D4AF37]/55 transition">
                  <span className="text-sm">🎧</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Podcast Studio</div>
                  <span className="text-[7.5px] font-mono text-[#D4AF37] uppercase tracking-widest block leading-none mt-1 font-bold">PODCAST</span>
                </div>
              </button>

              {/* Galerie Médias */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  requireAuthThen(() => {
                    setActiveMenu("user_heritage");
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  });
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:border-indigo-500/55 transition">
                  <span className="text-sm">🖼️</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Galerie Médias</div>
                  <span className="text-[7.5px] font-mono text-indigo-400 uppercase tracking-widest block leading-none mt-1 font-bold">HÉRITAGE</span>
                </div>
              </button>
            </div>
          </div>

          {/* 🌍 COMMUNAUTÉ */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 px-1 text-[10px] font-sans font-black text-sky-400 uppercase tracking-widest">
              <span>🌍</span>
              <span>COMMUNAUTÉ</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* Univers AFRIGOMBO ELITE */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  requireAuthThen(() => {
                    setActiveMenu("user_builders");
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  });
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:border-red-500/55 transition">
                  <span className="text-sm">🌍</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Univers AFRIGOMBO ELITE</div>
                  <span className="text-[7.5px] font-mono text-red-400 uppercase tracking-widest block leading-none mt-1 font-bold">BÂTISSEURS</span>
                </div>
              </button>

              {/* Hall of Fame */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  setIsLeaderboardModalOpen(true);
                  try { audioSynth?.playValidationSuccess(); } catch (_) {}
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 group-hover:border-[#D4AF37]/55 transition">
                  <span className="text-sm">🏆</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Hall of Fame</div>
                  <span className="text-[7.5px] font-mono text-[#D4AF37] uppercase tracking-widest block leading-none mt-1 font-bold">LÉGENDES</span>
                </div>
              </button>

              {/* Défis musicaux */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  requireAuthThen(() => {
                    setActiveMenu("user_vibes");
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  });
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-500/55 transition">
                  <span className="text-sm">🔥</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Défis musicaux</div>
                  <span className="text-[7.5px] font-mono text-amber-500 uppercase tracking-widest block leading-none mt-1 font-bold">VIBES</span>
                </div>
              </button>

              {/* Événements */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  requireAuthThen(() => {
                    setActiveMenu("user_events");
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  });
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 group-hover:border-sky-500/55 transition">
                  <span className="text-sm">📅</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Événements</div>
                  <span className="text-[7.5px] font-mono text-sky-400 uppercase tracking-widest block leading-none mt-1 font-bold">CALENDRIER</span>
                </div>
              </button>
            </div>
          </div>

          {/* 📊 PERFORMANCE */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 px-1 text-[10px] font-sans font-black text-amber-400 uppercase tracking-widest">
              <span>📊</span>
              <span>PERFORMANCE</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* Statistiques avancées */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  requireAuthThen(() => {
                    setActiveMenu("user_command_center");
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  });
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500/55 transition">
                  <span className="text-sm">📈</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Statistiques avancées</div>
                  <span className="text-[7.5px] font-mono text-emerald-400 uppercase tracking-widest block leading-none mt-1 font-bold">ANALYTICS</span>
                </div>
              </button>

              {/* Classements */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  setIsLeaderboardModalOpen(true);
                  try { audioSynth?.playValidationSuccess(); } catch (_) {}
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 group-hover:border-[#D4AF37]/55 transition">
                  <span className="text-sm">🎖️</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Classements</div>
                  <span className="text-[7.5px] font-mono text-[#D4AF37] uppercase tracking-widest block leading-none mt-1 font-bold">LEADERBOARD</span>
                </div>
              </button>

              {/* Réputation */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  requireAuthThen(() => {
                    setActiveMenu("user_gombo_id");
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  });
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-500/55 transition">
                  <span className="text-sm">⭐</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Réputation</div>
                  <span className="text-[7.5px] font-mono text-amber-400 uppercase tracking-widest block leading-none mt-1 font-bold">SCORE</span>
                </div>
              </button>

              {/* Progression */}
              <button
                onClick={() => {
                  setIsPlusMenuOpen(false);
                  requireAuthThen(() => {
                    setActiveMenu("user_command_center");
                    try { audioSynth?.playValidationSuccess(); } catch (_) {}
                  });
                }}
                className="bg-afri-bg border border-afri-border/90 hover:border-[#D4AF37]/45 rounded-2xl p-4 flex flex-col justify-between items-start text-left h-24 hover:bg-afri-bg-sec/5 transition-all group relative cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 group-hover:border-[#D4AF37]/55 transition">
                  <span className="text-sm">📊</span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-black text-afri-text tracking-wide">Progression</div>
                  <span className="text-[7.5px] font-mono text-[#D4AF37] uppercase tracking-widest block leading-none mt-1 font-bold">NIVEAU</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </AndroidBottomSheet>

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
              className="absolute inset-0 bg-afri-bg/90 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-afri-bg-sec border-2 border-[#D4AF37] p-6 sm:p-8 rounded-[2rem] shadow-xl max-w-sm w-full relative z-10 text-center space-y-5"
            >
              {/* Header Badge */}
              <div className="w-14 h-14 bg-afri-bg-sec/10 rounded-full flex items-center justify-center border border-[#D4AF37]/30 mx-auto">
                <span className="text-2xl animate-bounce">
                  {localComingSoonKey === "menu_favorites" ? "⭐" : localComingSoonKey === "menu_history" ? "🕓" : "⚡"}
                </span>
              </div>

              {/* Title & Desc */}
              <div className="space-y-2">
                <h3 className="text-base font-sans font-black uppercase text-afri-text tracking-widest">
                  {localComingSoonKey === "menu_favorites" ? "Favoris Élite 🌟" :
                   localComingSoonKey === "menu_history" ? "Historique Complet 🕓" :
                   localComingSoonKey === "menu_classement" ? "Classement d'Or 🏆" :
                   localComingSoonKey}
                </h3>
                <span className="inline-block px-3 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] font-mono text-[10px] font-black uppercase tracking-wider rounded-full">
                  Bientôt disponible ⚡
                </span>
                <p className="text-xs text-afri-text-sec leading-relaxed font-medium pt-1">
                  {localComingSoonKey === "menu_favorites" ? "Enregistrez vos artistes et opportunités préférées pour ne plus jamais manquer un Gombo en Or !" :
                   localComingSoonKey === "menu_history" ? "Consultez l'historique de vos gombos, contrats, transactions et performances en un clin d'œil." :
                   localComingSoonKey === "menu_classement" ? "Découvrez le Top 10 des meilleurs artistes et recruteurs du pays. Grimpez dans la hiérarchie !" :
                   "Cette fonctionnalité est en cours de finalisation pour la communauté AFRIGOMBO ELITE."}
                </p>
              </div>

              {/* Inscription Form */}
              {waitlistStatus === "success" ? (
                <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-2xl text-center space-y-1 animate-fadeIn">
                  <span className="text-emerald-400 text-xs font-black block">✓ VIBRATION BIEN REÇUE</span>
                  <p className="text-[10px] text-afri-text font-medium">Vous serez notifié en exclusivité dès l'ouverture de l'accès ! 🎉</p>
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
                    className="w-full bg-afri-bg border border-afri-border rounded-xl px-3.5 py-2.5 text-xs text-afri-text text-center font-bold focus:outline-none focus:border-[#D4AF37] placeholder-zinc-700"
                  />
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setLocalComingSoonKey(null)}
                      className="flex-1 py-2.5 bg-afri-bg border border-afri-border hover:bg-afri-bg-sec rounded-xl text-afri-text-muted font-bold text-xs uppercase transition tracking-wider"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={waitlistStatus === "loading"}
                      className="flex-1 py-2.5 bg-afri-bg-sec hover:bg-afri-bg-sec/90 text-black font-black text-xs rounded-xl uppercase transition tracking-wider flex items-center justify-center"
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

      {/* ANDROID BOTTOM SHEET: PRÈS DE MOI */}
      <AndroidBottomSheet
        isOpen={isPresDeMoiModalOpen}
        onClose={() => setIsPresDeMoiModalOpen(false)}
        title={
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📍</span>
            <div>
              <h3 className="text-xs sm:text-sm font-sans font-black text-afri-text uppercase tracking-widest leading-none">
                Radar & Gombos Près de Moi
              </h3>
              <p className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-wider mt-1 font-bold">
                {geo.latitude && geo.longitude ? "Géolocalisation active 🟢" : "Position par défaut (Abidjan) 📍"}
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-4 overflow-y-auto max-h-[80vh] pb-6 pr-1">
          <AfrigoRadarMap
            gombos={gombos}
            userLocation={{ latitude: geo.latitude || 5.3600, longitude: geo.longitude || -4.0083 }}
            onSelectGombo={(g) => {
              handleOpenGomboDetails(g);
              setIsPresDeMoiModalOpen(false);
            }}
            onApplyGombo={(g) => {
              handleOpenGomboDetails(g);
              setIsPresDeMoiModalOpen(false);
            }}
            geoPermissionStatus={geo.permissionStatus}
            onRequestLocation={geo.requestLocation}
          />
        </div>
      </AndroidBottomSheet>

      {/* ANDROID BOTTOM SHEET: FAVORIS */}
      <AndroidBottomSheet
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
        title={
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⭐</span>
            <div>
              <h3 className="text-xs sm:text-sm font-sans font-black text-afri-text uppercase tracking-widest leading-none">
                Mes Favoris & Artistes Enregistrés
              </h3>
              <p className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-wider mt-1 font-bold">
                Vos coups de cœur de la communauté
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-3 overflow-y-auto max-h-[70vh] pb-6 pr-1 text-left">
          {likedGombos.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto animate-pulse">
                <Heart className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-afri-text uppercase tracking-wider">Aucun favori enregistré</p>
                <p className="text-[10px] text-afri-text-sec max-w-xs mx-auto leading-relaxed">
                  Enregistrez des opportunités en cliquant sur l'icône de cœur de vos Gombos préférés.
                </p>
              </div>
            </div>
          ) : (
            gombos
              .filter(g => g.id && likedGombos.includes(g.id))
              .map(g => (
                <div
                  key={g.id}
                  onClick={() => {
                    handleOpenGomboDetails(g);
                    setIsFavoritesModalOpen(false);
                  }}
                  className="p-3.5 bg-afri-bg border border-afri-border hover:border-[#D4AF37]/50 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition shadow-sm group"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[9px] font-mono text-[#D4AF37] uppercase font-bold block">
                      📍 {g.location || "Abidjan"} • {g.category || "Général"}
                    </span>
                    <h4 className="text-xs text-afri-text font-bold truncate group-hover:text-[#D4AF37] transition">
                      {g.title}
                    </h4>
                    <p className="text-[10px] font-mono text-emerald-400 font-bold">
                      {(g.budget || 0).toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-afri-text-sec group-hover:text-[#D4AF37] shrink-0 font-bold uppercase">
                    Ouvrir →
                  </span>
                </div>
              ))
          )}
        </div>
      </AndroidBottomSheet>

      {/* ANDROID BOTTOM SHEET: URGENCES */}
      <AndroidBottomSheet
        isOpen={isUrgencesModalOpen}
        onClose={() => setIsUrgencesModalOpen(false)}
        title={
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🚨</span>
            <div>
              <h3 className="text-xs sm:text-sm font-sans font-black text-afri-text uppercase tracking-widest leading-none">
                Opportunités Urgentes & Renforts Express
              </h3>
              <p className="text-[9px] font-mono text-red-500 uppercase tracking-wider mt-1 font-bold">
                Missions prioritaires & Castings immédiats
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-3 overflow-y-auto max-h-[70vh] pb-6 pr-1 text-left">
          {(() => {
            const urgentGombos = gombos
              .filter(g => g.urgent || g.isExpress || (g as any).type === "renfort" || g.category === "casting" || g.isCasting || g.isRenfort)
              .sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));

            if (urgentGombos.length === 0) {
              return (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500 text-xl animate-pulse">
                    🚨
                  </div>
                  <p className="text-xs font-bold text-afri-text uppercase tracking-wider">Aucune urgence critique actuellement</p>
                  <p className="text-[10px] text-afri-text-sec max-w-xs mx-auto">
                    Toutes les opportunités régulières restent accessibles dans le fil d'actualités.
                  </p>
                </div>
              );
            }

            return urgentGombos.map(g => (
              <div
                key={g.id}
                onClick={() => {
                  handleOpenGomboDetails(g);
                  setIsUrgencesModalOpen(false);
                }}
                className="p-3.5 bg-afri-bg border border-red-500/35 hover:border-red-500 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition shadow-md group"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-afri-text text-[8px] font-black uppercase tracking-wider animate-pulse">
                      🚨 URGENT
                    </span>
                    {((g as any).type === "renfort" || g.isRenfort) && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[8px] font-black uppercase tracking-wider">
                        ⚡ RENFORT EXPRESS
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-afri-text-sec truncate">
                      📍 {g.location || "Abidjan"}
                    </span>
                  </div>
                  <h4 className="text-xs text-afri-text font-bold truncate leading-snug group-hover:text-red-400 transition">
                    {g.title}
                  </h4>
                  <p className="text-[10.5px] font-mono font-black text-emerald-400">
                    {(g.budget || 0).toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[9px] font-mono text-red-500 font-bold uppercase">
                    Postuler →
                  </span>
                </div>
              </div>
            ));
          })()}
        </div>
      </AndroidBottomSheet>

      {/* ANDROID BOTTOM SHEET: CANDIDATURES */}
      <AndroidBottomSheet
        isOpen={isCandidaturesModalOpen}
        onClose={() => setIsCandidaturesModalOpen(false)}
        title={
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎫</span>
            <div>
              <h3 className="text-xs sm:text-sm font-sans font-black text-afri-text uppercase tracking-widest leading-none">
                Mes Candidatures & Postulations
              </h3>
              <p className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider mt-1 font-bold">
                Suivi en temps réel de vos statuts
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-3 overflow-y-auto max-h-[70vh] pb-6 pr-1 text-left">
          {userApplications.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-xl text-emerald-400">
                🎫
              </div>
              <p className="text-xs font-bold text-afri-text uppercase tracking-wider">Aucune candidature transmise</p>
              <p className="text-[10px] text-afri-text-sec max-w-xs mx-auto">
                Postulez aux opportunités et Gombos disponibles sur le terrain pour suivre vos statuts ici.
              </p>
            </div>
          ) : (
            userApplications.map(app => {
              const matchingGombo = gombos.find(g => g.id === app.gomboId);
              let statusBadge = { label: "🟡 En attente", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
              if (app.status === "acceptee" || app.status === "accepted") {
                statusBadge = { label: "🟢 Acceptée", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
              } else if (app.status === "refusee" || app.status === "rejected") {
                statusBadge = { label: "🔴 Refusée", color: "bg-red-500/20 text-red-400 border-red-500/30" };
              } else if (app.status === "terminee" || app.status === "completed") {
                statusBadge = { label: "📅 Terminée", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
              }

              return (
                <div
                  key={app.id || app.gomboId}
                  onClick={() => {
                    if (matchingGombo) {
                      handleOpenGomboDetails(matchingGombo);
                      setIsCandidaturesModalOpen(false);
                    }
                  }}
                  className="p-3.5 bg-afri-bg border border-afri-border hover:border-emerald-500/50 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition group"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full border text-[8.5px] font-mono font-black uppercase tracking-wider ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                      {app.createdAt && (
                        <span className="text-[9px] font-mono text-afri-text-sec">
                          {new Date(app.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs text-afri-text font-bold truncate group-hover:text-emerald-400 transition">
                      {app.gomboTitle || matchingGombo?.title || "Candidature Gombo"}
                    </h4>
                    {app.message && (
                      <p className="text-[10px] text-afri-text-sec line-clamp-1 italic">
                        "{app.message}"
                      </p>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-afri-text-sec group-hover:text-emerald-400 shrink-0 font-bold uppercase">
                    Détails →
                  </span>
                </div>
              );
            })
          )}
        </div>
      </AndroidBottomSheet>

      {/* 2. REAL HISTORY MODAL */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <div className="fixed inset-0 bg-afri-bg/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-afri-bg-sec border border-afri-border rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-xl relative max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-afri-border pb-3 mb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🕓</span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-sans font-black text-afri-text uppercase tracking-widest leading-none">
                      Historique
                    </h3>
                    <p className="text-[8.5px] font-mono text-afri-text-sec uppercase tracking-wider mt-1 font-bold">Vos récentes consultations</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-afri-bg border border-afri-border flex items-center justify-center text-afri-text-muted hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition cursor-pointer"
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
                          <p className="text-xs font-bold text-afri-text uppercase tracking-wider">Aucun historique disponible</p>
                          <p className="text-[10px] text-afri-text-sec max-w-xs mx-auto leading-relaxed">
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
                          className="px-4 py-2 bg-afri-bg-sec hover:bg-afri-bg-sec text-black text-[10px] font-black rounded-lg uppercase tracking-wider transition active:scale-95 mx-auto"
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
                      className="p-3 bg-afri-bg border border-afri-border hover:border-blue-500/35 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition text-left animate-fadeIn"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[9.5px] font-mono text-afri-text-sec uppercase tracking-wider block font-bold leading-none mb-1">
                          📍 {g.location || "Abidjan"} • consulté récemment
                        </span>
                        <h4 className="text-xs text-afri-text font-bold truncate leading-snug">{g.title}</h4>
                        <p className="text-[10px] text-[#D4AF37] font-mono font-medium mt-1">
                          {(g.budget || 0).toLocaleString("fr-FR")} FCFA
                        </p>
                      </div>
                      <span className="text-[9px] font-mono text-afri-text-sec shrink-0 uppercase font-bold hover:text-[#D4AF37]">
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
          <div className="fixed inset-0 bg-afri-bg/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-afri-bg-sec border border-afri-border rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-xl relative max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-afri-border pb-3 mb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🏆</span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-sans font-black text-afri-text uppercase tracking-widest leading-none">
                      Top Talents
                    </h3>
                    <p className="text-[8.5px] font-mono text-afri-text-sec uppercase tracking-wider mt-1 font-bold">Classements d'Or AFRIGOMBO ELITE</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLeaderboardModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-afri-bg border border-afri-border flex items-center justify-center text-afri-text-muted hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition cursor-pointer"
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
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-afri-text-sec pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Rechercher un talent, une commune..."
                        value={leaderboardSearch}
                        onChange={(e) => setLeaderboardSearch(e.target.value)}
                        className="w-full bg-afri-bg border border-afri-border rounded-xl pl-9 pr-4 py-2 text-xs text-afri-text placeholder-afri-text-muted/50 font-bold focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    {/* Users list */}
                    <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
                      {filteredUsers.length === 0 ? (
                        <div className="py-12 text-center text-afri-text-sec text-xs font-mono">
                          Aucun talent ne correspond à votre recherche.
                        </div>
                      ) : (
                        filteredUsers.map((u, idx) => {
                          const rankNum = idx + 1;
                          
                          let medalIcon = "";
                          let rankBorder = "border-afri-border";
                          let bgClass = "bg-afri-bg-sec/40";
                          
                          if (rankNum === 1) {
                            medalIcon = "🥇";
                            rankBorder = "border-[#D4AF37]/50";
                            bgClass = "bg-gradient-to-r from-[#D4AF37]/5 to-transparent";
                          } else if (rankNum === 2) {
                            medalIcon = "🥈";
                            rankBorder = "border-afri-border";
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
                                <div className="w-6 shrink-0 text-center font-mono text-xs font-black text-afri-text-sec">
                                  {medalIcon || `#${rankNum}`}
                                </div>

                                {/* Avatar */}
                                <img
                                  src={userAvatar}
                                  referrerPolicy="no-referrer"
                                  className="w-9 h-9 rounded-xl object-cover border border-afri-border shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${idx}`;
                                  }}
                                  alt=""
                                />

                                {/* Info */}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-sans font-black text-afri-text truncate">
                                      {u.artisticName || u.name}
                                    </span>
                                    {u.isCertified && (
                                      <span className="text-[8px] bg-afri-bg-sec/15 text-[#D4AF37] px-1 py-0.5 rounded-md font-mono font-black border border-[#D4AF37]/25 shrink-0 uppercase tracking-widest leading-none">
                                        PRO
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[9.5px] text-afri-text-sec font-mono font-bold leading-none mt-1">
                                    📍 {u.commune || "Abidjan"} • Niv. {u.level}
                                  </p>
                                </div>
                              </div>

                              {/* Performance score / rating */}
                              <div className="text-right shrink-0">
                                <span className="text-xs font-mono font-black text-[#D4AF37] block leading-none">
                                  {u.score} pts
                                </span>
                                <span className="text-[9px] font-mono text-afri-text-sec block mt-1 font-bold">
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
    </AndroidPageLayout>
  );
});
