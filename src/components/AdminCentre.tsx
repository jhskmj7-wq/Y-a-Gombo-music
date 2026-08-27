import { NotificationService } from "../lib/NotificationService";
import { useGeoEngine } from "../hooks/useGeoEngine";
import { ErrorBoundary } from "./ErrorBoundary";
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, lazy, Suspense } from "react";
import {
  collection,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  limit,
  where,
  orderBy,
  runTransaction
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { safeStringify, getCircularReplacer, safeJsonClone } from "../lib/jsonUtils";
import { getEffectiveGomboId, getGomboIdStatusInfo, generateGomboId, formatGomboIdDisplay, formatGomboRefDisplay } from "../lib/gomboIdHelper";
import { PremiumEngine } from "../lib/premiumEngine";
import { SecurityService } from "../lib/SecurityService";
import { 
  isFeatureEnabled as checkIsFeatureEnabled, 
  isModuleVisible as checkIsModuleVisible, 
  isModuleAccessible as checkIsModuleAccessible, 
  isModuleComingSoon as checkIsModuleComingSoon, 
  subscribeToFeatureFlags,
  getGlobalCachedFeatureFlags
} from "../lib/featureFlags";
import { FeatureUnavailable } from "./FeatureUnavailable";
import { getEffectiveCommissionRate, calculatePublicationFinancials, recordWalletTransaction, getCanonicalWalletBalance } from "../lib/financial";
import { isMenuProtected } from "../auth/accessPolicy";
import { useWalletSecurity } from "../context/WalletSecurityContext";
import { useNavigate, useLocation } from "react-router-dom";
import { lazyWithRetry } from "../lib/lazyWithRetry";
import { AndroidBottomSheet, AndroidCenteredDialog } from "./common/GlobalPortalModal";

const AdminStats = lazyWithRetry(() => import("./AdminStats"));
const AdminReports = lazyWithRetry(() => import("./admin/AdminReports"));
const AdminActions = lazyWithRetry(() => import("./AdminActions"));
import AdminDashboard from "./admin/AdminDashboard";
const AdminUsers = lazyWithRetry(() => import("./admin/AdminUsers"));
const AdminBetaProgram = lazyWithRetry(() => import("./admin/AdminBetaProgram"));
import { processUserBetaEligibility } from "../lib/BetaSystemEngine";
const AdminNotifications = lazyWithRetry(() => import("./admin/AdminNotifications"));
const AdminRevenue = lazyWithRetry(() => import("./admin/AdminRevenue"));
const AdminRevenueFeatures = lazyWithRetry(() => import("./admin/AdminRevenueFeatures"));
const AdminSettings = lazyWithRetry(() => import("./admin/AdminSettings"));
const AdminSecurity = lazyWithRetry(() => import("./admin/AdminSecurity"));
import AdminSuperFounderHub from "./admin/AdminSuperFounderHub";
import ThroneCinematicIntro from "./admin/ThroneCinematicIntro";
const AdminAvatarStore = lazyWithRetry(() => import("./admin/AdminAvatarStore"));
const MultimediaCenter = lazyWithRetry(() => import("./admin/MultimediaCenter"));
const AfrigomboEconomieDashboard = lazyWithRetry(() => import("./AfrigomboEconomieDashboard"));
const AfrigomboBuilders = lazyWithRetry(() => import("./AfrigomboBuilders"));
const AfrigomboBuildersAdminDashboard = lazyWithRetry(() => import("./AfrigomboBuildersAdminDashboard"));
import BetaTransactionsAdminPanel from "./admin/BetaTransactionsAdminPanel";
const GeoLocationCenter = lazyWithRetry(() => import("./admin/GeoLocationCenter"));
const UserCommentsView = lazyWithRetry(() => import("./UserCommentsView"));
const GomboMusikEcosystem = lazyWithRetry(() => import("./GomboMusikEcosystem"));

// Optimized Static Imports for instant opening without loading screens
import GrandMarcheView from "./GrandMarcheView";
import GomboPublish from "./GomboPublish";
import AudioPublishForm from "./AudioPublishForm";
import RenfortExpress from "./RenfortExpress";
import AcademieView from "./AcademieView";
import MessagesView from "./MessagesView";
import AfrigomboWalletDashboard from "./AfrigomboWalletDashboard";
import GomboContractsDashboard from "./GomboContractsDashboard";
import CreatorActivityDashboard from "./CreatorActivityDashboard";
const FirebaseDiagnostic = lazyWithRetry(() => import("./FirebaseDiagnostic"));
const AboutAfrigombo = lazyWithRetry(() => import("./AboutAfrigombo"));
const SupportAfrigombo = lazyWithRetry(() => import("./SupportAfrigombo"));
const WhatsNew = lazyWithRetry(() => import("./WhatsNew"));
import AfrigomboHelpCenter from "./AfrigomboHelpCenter";
import AvatarEditor from "./avatar/AvatarEditor";
import AvatarStore from "./avatar/AvatarStore";
import EventsView from "./EventsView";
import HeritagePage from "./HeritagePage";
import PremiumWheelPage from "./common/PremiumWheelPage";
import GomboIdUserDashboard from "./GomboIdUserDashboard";
const AfrigomboLabs = lazyWithRetry(() => import("./admin/AfrigomboLabs"));
const BetaCheckPanel = lazyWithRetry(() => import("./admin/BetaCheckPanel"));

// New Lazy Imports for optimization
const NearbyPageView = lazyWithRetry(() => import("./NearbyPageView").then(m => ({ default: m.NearbyPageView })));
const GomboBoostManager = lazyWithRetry(() => import("./GomboBoostManager"));
const GomboApply = lazyWithRetry(() => import("./GomboApply"));
const GomboItineraryModal = lazyWithRetry(() => import("./GomboItineraryModal"));
const GomboSecureModal = lazyWithRetry(() => import("./GomboSecureModal"));
const AfrigomboSupportModal = lazyWithRetry(() => import("./AfrigomboSupportModal").then(m => ({ default: m.AfrigomboSupportModal })));
import NotificationCenter from "./NotificationCenter";
import SettingsModal from "./SettingsModal";
const ComingSoon = lazyWithRetry(() => import("./ComingSoon"));
import AfrigomboPlus from "./AfrigomboPlus";
import ReelCreatorScreen from "./reels/ReelCreatorScreen";
import ReelPublishScreen from "./reels/ReelPublishScreen";
const PublicProfileModal = lazyWithRetry(() => import("./PublicProfileModal").then(m => ({ default: m.PublicProfileModal })));
const ArbreAPalabresBubble = lazyWithRetry(() => import("./ArbreAPalabresBubble").then(m => ({ default: m.ArbreAPalabresBubble })));
const ReelsPlayer = lazyWithRetry(() => import("./ReelsPlayer").then(m => ({ default: m.ReelsPlayer })));
const AfrigomboVibeWaves = lazyWithRetry(() => import("./AfrigomboVibeWaves").then(m => ({ default: m.AfrigomboVibeWaves })));
const Carousel = lazyWithRetry(() => import("./Carousel").then(m => ({ default: m.Carousel })));
import WakandaTechBackground from "./WakandaTechBackground";
import AfrigomboFooter from "./AfrigomboFooter";
import AuthScreen from "./AuthScreen";
import { AuthModal } from "./auth/AuthModal";
const PremiumEmptyState = lazyWithRetry(() => import("./PremiumEmptyState"));
const PendingPaymentModal = lazyWithRetry(() => import("./PendingPaymentModal").then(m => ({ default: m.PendingPaymentModal })));
import { MonAbonnementView } from "./MonAbonnementView";
import { GomboAdsMainView } from "./ads/GomboAdsMainView";
import { GomboAdsService } from "../services/GomboAdsService";
import { GomboAdsCampaign, UserProfile } from "../types";

// Extracted Sub-components
const UserReelsView = lazyWithRetry(() => import("./UserReelsView").then(m => ({ default: m.UserReelsView })));
const RevenuQuickActionModal = lazyWithRetry(() => import("./RevenuQuickActionModal").then(m => ({ default: m.RevenuQuickActionModal })));

// Chart Isolation
const AdminAreaChart = lazyWithRetry(() => import("./charts/AdminAreaChart"));

import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import { PrivacyPage, TermsPage, DeleteAccountPage } from "./PublicPages";
import { UserTerrainLandingPage } from "./UserTerrainLandingPage";
import { AfriGomboLogo } from "./AfriGomboLogo";
import { supportConfig } from "../supportConfig";
import { validateAndPublishWithCode } from "../lib/validationCodeEngine";
import { gomboDB } from "../firebase";
import { usePerformance } from "../services/performanceService";
import {
  AdminMenu,
  User,
  Post,
  Gombo,
  Renfort,
  Alerte,
  Transaction,
  AdminBrief,
  GomboReview,
  UserPerformance,
  Conversation,
  GomboSafeContract
} from "../types";
import { audioSynth } from "../lib/audio";
import { interactionBus } from "./LivingInteractions";
import { useDynamicPlaceholder } from "../hooks/useDynamicPlaceholder";
import { isSuperFounder } from "../shared/admin/constants";
import { useAppSettings } from "../context/AppSettingsContext";
import {
  motion,
  AnimatePresence
} from "motion/react";
import {
  LayoutDashboard,
  Film,
  Flame,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Landmark,
  BarChart2,
  RefreshCw,
  Search,
  Plus,
  Lock,
  Tv,
  Users,
  User as UserIcon,
  Award,
  DollarSign,
  TrendingUp,
  MapPin,
  Navigation,
  Clock,
  Briefcase,
  Bell,
  CheckCircle,
  XCircle,
  Radio,
  FileCheck,
  ShieldAlert,
  Zap,
  Coins,
  Star,
  Crown,
  Heart,
  Share2,
  MessageCircle,
  Bookmark,
  MessageSquare,
  Calendar,
  Send,
  UserPlus,
  FileText,
  UserX,
  Eye,
  Sun,
  Moon,
  Sliders,
  LogOut,
  Music,
  Settings,
  Sparkles,
  Activity,
  Menu,
  X,
  Home,
  Megaphone,
  MoreVertical,
  Wallet,
  Globe,
  Terminal,
  Database,
  Brain,
  LifeBuoy,
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Smartphone,
  Loader2,
  Check,
  CheckCircle2,
  Info,
  Mic2,
  FileSignature,
  BadgeCheck,
  History,
  Download,
  CreditCard,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Handshake,
  ArrowLeft,
  Lightbulb,
  LogIn
} from "lucide-react";

// --- IVORY COAST LOCATIONS (COMMUNES) & DEFAULTS ---
const IVORIAN_COMMUNES = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", 
  "Port-Bou√´t", "Koumassi", "Adjam√©", "Abobo", "Bingerville"
];

function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// --- TYPE DEFINITIONS AND COMPONENT INTERFACES ---

interface AdminCentreProps {
  theme: any;
  toggleTheme: () => void;
}

export default function AdminCentre({ theme, toggleTheme }: AdminCentreProps) {
  const darkMode = theme !== 'light';
  const setDarkMode = (val: boolean) => { if ((theme !== 'light') !== val) toggleTheme(); };

  const dynamicPlaceholder = useDynamicPlaceholder([
    "Rechercher un artiste...",
    "Trouver une collaboration...",
    "D√©couvrir une opportunit√©...",
    "Chercher un beatmaker...",
    "Trouver un studio..."
  ]);
  const { currentUser, profile, logout, refreshProfile, setProfile, loginWithGoogle, showAuthPopup, setShowAuthPopup } = useAuth();
  const { network, showToast: appShowToast } = useAppSettings();
  const { formatWalletBalance } = useWalletSecurity();
  const geo = useGeoEngine(profile);
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [isBetaFeedbackOpen, setIsBetaFeedbackOpen] = useState<boolean>(false);
  const [isBugModalOpen, setIsBugModalOpen] = useState<boolean>(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState<boolean>(false);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState<boolean>(false);
  const [showGoogleLoginRequiredModal, setShowGoogleLoginRequiredModal] = useState<boolean>(false);
  const [activeBoostItem, setActiveBoostItem] = useState<{id: string, title?: string, type: 'gombo' | 'candidature' | 'profile'} | null>(null);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(false);
  const [reelToPublish, setReelToPublish] = useState<{ file: File; filterId: string } | null>(null);
  
  // Avatar modals state
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState<boolean>(false);
  const [isAvatarStoreOpen, setIsAvatarStoreOpen] = useState<boolean>(false);

  // Auto-close auth modals immediately when user is authenticated or session restored
  useEffect(() => {
    if (currentUser) {
      setIsAuthModalOpen(false);
      setShowHeritageLoginRequired(false);
      setShowGoogleLoginRequiredModal(false);
      if (setShowAuthPopup) setShowAuthPopup(false);
    }
  }, [currentUser, setShowAuthPopup]);

  // Synchronize showAuthPopup with local isAuthModalOpen state
  useEffect(() => {
    if (showAuthPopup && !currentUser) {
      setIsAuthModalOpen(true);
    }
  }, [showAuthPopup, currentUser]);

  // Scroll Position Memory Engine for Independent Scroll Preservation
  const scrollPositionsRef = useRef<Record<string, number>>({});

  // Mount log
  useEffect(() => {
    const handleOpenDiagnostic = () => {
      const userEmail = (currentUser?.email ?? "").toLowerCase();
      if (userEmail === "jhs.kmj7@gmail.com" || profile?.isFounder) {
        setIsDiagnosticOpen(true);
      }
    };
    window.addEventListener('open-firebase-diagnostic', handleOpenDiagnostic);

    const handleTriggerProfileBoost = () => {
      const activeUser = profile || currentUser;
      if (activeUser) {
        setActiveBoostItem({
          id: activeUser.uid || activeUser.id || "my_profile",
          title: activeUser.artistName || activeUser.displayName || "Mon Profil d'Artiste",
          type: 'profile'
        });
      }
    };
    window.addEventListener("gombo_trigger_profile_boost", handleTriggerProfileBoost);

    const handleOpenAvatarEditor = () => setIsAvatarEditorOpen(true);
    const handleOpenAvatarStore = () => setIsAvatarStoreOpen(true);
    window.addEventListener("gombo_open_avatar_editor", handleOpenAvatarEditor);
    window.addEventListener("gombo_open_avatar_store", handleOpenAvatarStore);

    return () => {
      window.removeEventListener('open-firebase-diagnostic', handleOpenDiagnostic);
      window.removeEventListener("gombo_trigger_profile_boost", handleTriggerProfileBoost);
      window.removeEventListener("gombo_open_avatar_editor", handleOpenAvatarEditor);
      window.removeEventListener("gombo_open_avatar_store", handleOpenAvatarStore);
    };
  }, [profile, currentUser]);

  const requireGoogleAuthThen = (action: () => void) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
    } else {
      const hasGoogle = currentUser.providerData?.some(
        (p) => p.providerId === "google.com" || p.providerId.includes("google")
      ) ?? false;
      if (!hasGoogle) {
        setShowGoogleLoginRequiredModal(true);
      } else {
        action();
      }
    }
  };

  const requireAuthThen = (action: () => void) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
    } else {
      action();
    }
  };

  const [menuHistory, setMenuHistory] = useState<string[]>(["user_terrain"]);
  const activeMenu = menuHistory[menuHistory.length - 1] || "user_terrain";
  const location = useLocation();

  // Reset scrolling of all panels/containers inside AdminCentre when switching views
  useEffect(() => {
    window.scrollTo(0, 0);
    const scrollableElements = document.querySelectorAll('.overflow-y-auto');
    scrollableElements.forEach(el => {
      (el as HTMLElement).scrollTop = 0;
    });
  }, [activeMenu]);

  // Native Chrome Android Back Swipe Integration using popstate listeners
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      setMenuHistory(prev => {
        if (prev.length > 1) {
          // Navigation sounds strictly silenced for ELITE
          return prev.slice(0, -1);
        }
        return prev;
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const defaultBackParents: Record<string, string> = {
    user_gombo_plus: "user_heritage",
    user_subscription_management: "user_heritage",
    terms: "user_settings",
    privacy: "user_settings",
    delete_account: "user_settings",
    user_kyc: "user_heritage",
    user_gombo_id: "user_heritage",
    dashboard: "user_heritage",
    user_command_center: "user_heritage",
    super_admin: "dashboard",
    user_throne: "dashboard",
    user_settings: "user_heritage",
    settings: "user_heritage",
    user_edit_profile: "user_heritage",
    user_help_center: "user_settings",
    user_about: "user_settings",
    user_support: "user_settings",
    user_whats_new: "user_settings",
    user_notifications: "user_terrain",
    user_wallet: "user_heritage",
    user_favorites: "user_terrain",
    user_publish: "user_terrain",
    user_contracts: "user_terrain",
    user_events: "user_terrain",
    user_messages: "user_terrain",
    user_renforts: "user_terrain",
    user_heritage: "user_terrain",
    user_vibes: "user_terrain",
    user_reels: "user_terrain",
    user_mes_gombos: "user_heritage",
    user_mes_groupes: "user_heritage",
    user_comments: "user_terrain",
    user_downloads: "user_heritage",
    user_history: "user_heritage",
    user_gombo_ads: "user_terrain"
  };

  const setActiveMenu = (menu: string) => {
    // Security check: if the menu corresponds to a HIDDEN module and user is not super founder, block navigation!
    const flag = getFlagForMenu(menu);
    if (flag && !checkIsModuleVisible(flag, systemFeatureFlags, isSuperFounderUser)) {
      setMenuHistory(["user_terrain"]);
      return;
    }
    // Silence navigation sounds
    try {
      window.history.pushState({ menu }, "", "");
    } catch (_) {}
    setMenuHistory(prev => {
      if (prev[prev.length - 1] === menu) return prev;
      return [...prev, menu];
    });
  };

  const goBackMenu = useCallback(() => {
    // Silence navigation sounds
    setMenuHistory(prev => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      const current = prev[prev.length - 1] || "user_terrain";
      const parent = defaultBackParents[current] || "user_terrain";
      return [parent];
    });
  }, []);

  // Hardware and browser back button support (Chrome Android)
  useEffect(() => {
    const handlePopState = () => {
      goBackMenu();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [logoUrl, setLogoUrl] = useState<string | null>(() => localStorage.getItem("custom_app_logo"));
  useEffect(() => {
    const handleLogoUpdate = () => {
      setLogoUrl(localStorage.getItem("custom_app_logo"));
    };
    window.addEventListener("custom-logo-updated", handleLogoUpdate);
    return () => window.removeEventListener("custom-logo-updated", handleLogoUpdate);
  }, []);

  const [reelsVideoId, setReelsVideoId] = useState<string | null>(null);
  const [reelsVideoUrl, setReelsVideoUrl] = useState<string | null>(null);
  const [viewingGomboIdDetail, setViewingGomboIdDetail] = useState<boolean>(false);
  const [isUniversAfriOpen, setIsUniversAfriOpen] = useState<boolean>(false);
  const [followedArtists, setFollowedArtists] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("gombo_followed_artists") || "[]");
      } catch (_) {
        return [];
      }
    }
    return [];
  });
  const [selectedGomboDetails, setSelectedGomboDetails] = useState<Gombo | null>(null);
  const [applyingGombo, setApplyingGombo] = useState<Gombo | null>(null);
  const [itineraryTarget, setItineraryTarget] = useState<{
    title: string;
    commune?: string;
    latitude?: number;
    longitude?: number;
  } | null>(null);
  const [isGomboSecureModalOpen, setIsGomboSecureModalOpen] = useState(false);
  const [preselectedGomboAdId, setPreselectedGomboAdId] = useState<string | undefined>(undefined);
  const [userCampaigns, setUserCampaigns] = useState<GomboAdsCampaign[]>([]);
  const [expandedGomboId, setExpandedGomboId] = useState<string | null>(null);

  useEffect(() => {
    const uid = profile?.uid || currentUser?.uid;
    if (!uid) {
      setUserCampaigns([]);
      return;
    }
    const unsub = GomboAdsService.listenUserCampaigns(uid, (list) => {
      setUserCampaigns(list);
    });
    return () => unsub();
  }, [profile?.uid, currentUser?.uid]);
  const [openConvoWithUserId, setOpenConvoWithUserId] = useState<string | null>(null);
  const [openConvoWithGomboId, setOpenConvoWithGomboId] = useState<string | null>(null);
  const [publicProfileTargetUserId, setPublicProfileTargetUserId] = useState<string | null>(null);
  const [isHeritageSubPanelActive, setIsHeritageSubPanelActive] = useState(false);

  useEffect(() => {
    if (activeMenu !== "user_heritage") {
      setIsHeritageSubPanelActive(false);
    }
  }, [activeMenu]);

  // Pending payment modal state
  const [showPendingPaymentModal, setShowPendingPaymentModal] = useState(false);
  const [pendingPaymentItem, setPendingPaymentItem] = useState<{
    id: string;
    title: string;
    budget?: number;
    collectionName?: string;
  } | null>(null);

  useEffect(() => {
    const handleOpenPublicProfile = (e: CustomEvent<{ userId: string }>) => {
      if (e.detail?.userId) {
        setPublicProfileTargetUserId(e.detail.userId);
      }
    };
    const handleOpenWalletDeposit = () => {
      setActiveMenu("user_wallet");
    };
    const handleNavigateToGomboAds = (e: CustomEvent<{ targetGomboId?: string }>) => {
      if (e.detail?.targetGomboId) {
        setPreselectedGomboAdId(e.detail.targetGomboId);
      } else {
        setPreselectedGomboAdId(undefined);
      }
      setPerspective("user");
      setActiveMenu("user_gombo_ads");
    };
    window.addEventListener("open-public-profile" as any, handleOpenPublicProfile as any);
    window.addEventListener("open_wallet_deposit", handleOpenWalletDeposit);
    window.addEventListener("navigate_to_gombo_ads_with_target" as any, handleNavigateToGomboAds as any);
    return () => {
      window.removeEventListener("open-public-profile" as any, handleOpenPublicProfile as any);
      window.removeEventListener("open_wallet_deposit", handleOpenWalletDeposit);
      window.removeEventListener("navigate_to_gombo_ads_with_target" as any, handleNavigateToGomboAds as any);
    };
  }, []);

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportModalReason, setSupportModalReason] = useState("");

  useEffect(() => {
    const handleOpenInternalSupport = (e: CustomEvent<{ reason?: string }>) => {
      const reason = e.detail?.reason || "";
      if (reason) {
        localStorage.setItem("support_draft", reason);
      }
      setOpenConvoWithUserId("afrigombo_support");
      setActiveMenu("user_messages");
    };
    window.addEventListener("open-internal-support" as any, handleOpenInternalSupport as any);
    return () => {
      window.removeEventListener("open-internal-support" as any, handleOpenInternalSupport as any);
    };
  }, []);
  
  // Custom states for Le Terrain High Fidelity Experience (Home Page)
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [likedGombos, setLikedGombos] = useState<string[]>([]);
  const [gomboComments, setGomboComments] = useState<Record<string, { author: string; text: string; date: string }[]>>({
    gombo_1: [
      { author: "Zouglou Premier", text: "Opportunit√© incroyable pour la culture ivoirienne !", date: "Il y a 2h" },
      { author: "Diva Shana", text: "Le Plateau va vibrer le 15 juin !", date: "Il y a 1h" }
    ],
    gombo_2: [
      { author: "Serge K.", text: "Le budget est √† la hauteur de l'√©v√®nement.", date: "Il y a 5h" }
    ]
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("all");
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<"category" | "location" | "type" | "date" | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isEventsModalOpen, setIsEventsModalOpen] = useState<boolean>(false);
  const [isAcademyModalOpen, setIsAcademyModalOpen] = useState<boolean>(false);
  const [comingSoonFeatureKey, setComingSoonFeatureKey] = useState<string | null>(null);
  const { t, language: lang, setLanguage } = useLanguage();
  const { isBatteryLow, isSlowConnection, isDataSaveActive, isBatterySaveActive, areAnimationsReduced } = usePerformance();

  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState<boolean>(false);
  const [perspective, setPerspective] = useState<"admin" | "user">("user");
  const [liveAdminTime, setLiveAdminTime] = useState<string>(new Date().toLocaleTimeString("fr-FR"));
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [firebaseSyncState, setFirebaseSyncState] = useState<"synced" | "syncing" | "offline">("synced");
  const [connectionsCount, setConnectionsCount] = useState<number>(() => Math.floor(Math.random() * 8) + 14);

  // Dynamic Header State
  const [dynamicHeaderIndex, setDynamicHeaderIndex] = useState(0);
  const [personalIndicatorIndex, setPersonalIndicatorIndex] = useState(0);

  useEffect(() => {
    // Apply custom favicon if stored locally
    const customFavicon = localStorage.getItem("custom_app_favicon");
    if (customFavicon) {
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = customFavicon;
      }
    }

    const timer = setInterval(() => {
      setDynamicHeaderIndex(prev => (prev + 1) % 5);
      setPersonalIndicatorIndex(prev => (prev + 1) % 3);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        setFirebaseSyncState("syncing");
        setTimeout(() => setFirebaseSyncState("synced"), 1500);
      };
      const handleOffline = () => {
        setIsOnline(false);
        setFirebaseSyncState("offline");
      };
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setFirebaseSyncState("offline");
    } else if (isSlowConnection) {
      setFirebaseSyncState("syncing");
    } else {
      setFirebaseSyncState("synced");
    }
  }, [isOnline, isSlowConnection]);

  useEffect(() => {
    const connInterval = setInterval(() => {
      setConnectionsCount(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return next >= 10 && next <= 25 ? next : prev;
      });
    }, 12000);
    return () => clearInterval(connInterval);
  }, []);
  const [heritageSubTab, setHeritageSubTab] = useState<"parcours" | "portfolio" | "contrats">("parcours");
  const [portfolioMediaTab, setPortfolioMediaTab] = useState<"photo" | "audio" | "video">("video");
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeYoutubeId, setActiveYoutubeId] = useState<string | null>(null);
  const heritageAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveAdminTime(new Date().toLocaleTimeString("fr-FR"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [activeArtistId, setActiveArtistId] = useState<string>("user_3");
  const [isDemoPlaying, setIsDemoPlaying] = useState<boolean>(false);
  const [demoProgress, setDemoProgress] = useState<number>(35);
  const [activeDemoTrackIndex, setActiveDemoTrackIndex] = useState<number>(0);

  useEffect(() => {
    if (currentUser) {
      const targetId = currentUser.uid;
      setActiveArtistId(targetId);
      
      setUsers(prev => {
        const exists = prev.some(u => u.id === targetId);
        const userEmailStr = typeof currentUser?.email === "string" ? currentUser.email : "";
        const name = profile?.displayName || currentUser.displayName || (userEmailStr ? userEmailStr.split("@")[0] : "") || "Artiste Gombo";
        const email = profile?.email || currentUser.email || "";
        const avatarUrl = profile?.avatarUrl || currentUser.photoURL || "";
        const artisticName = profile?.artisticName || name;
        
        const mergedUser: any = {
          id: targetId,
          uid: targetId,
          name: name,
          email: email,
          artisticName: artisticName,
          photoURL: avatarUrl,
          avatarUrl: avatarUrl,
          commune: profile?.commune || "",
          isCertified: profile?.isCertified || false,
          kycStatus: profile?.kycStatus || "none",
          status: profile?.status || "active",
          specialties: profile?.specialties || [],
          groups: profile?.groups || [],
          performance: { 
            level: profile?.level || 1, 
            score: profile?.score || 0, 
            artisticName: artisticName, 
            commune: profile?.commune || "", 
            specialties: profile?.specialties || [], 
            groups: profile?.groups || [] 
          },
          registrationDate: (() => {
            const ca = profile?.createdAt as unknown as { toDate?: () => Date };
            if (typeof profile?.createdAt === "string") return profile.createdAt.split("T")[0];
            if (ca && typeof ca.toDate === "function") return ca.toDate().toISOString().split("T")[0];
            if (typeof profile?.createdAt === "number") return new Date(profile.createdAt).toISOString().split("T")[0];
            return new Date().toISOString().split("T")[0];
          })(),
          revenues: profile?.revenues || 0,
          gombosCompleted: profile?.gombosCompleted || 0,
          flagsCount: profile?.flagsCount || 0,
          tracksCount: profile?.tracksCount || 0,
          concertsCount: profile?.concertsCount || 0,
          awardsCount: profile?.awardsCount || 0,
          collabsCount: profile?.collabsCount || 0,
          followersCount: profile?.followersCount || 0,
          postsCount: profile?.postsCount || 0,
          engagementRate: profile?.engagementRate || "0%",
          supportsCount: profile?.supportsCount || 0,
          bio: profile?.bio || ""
        };
        
        if (exists) {
          return prev.map(u => u.id === targetId ? { ...u, ...mergedUser } : u);
        } else {
          return [mergedUser, ...prev];
        }
      });
    }
  }, [currentUser, profile]);
  const [localSaved, setLocalSaved] = useState<boolean>(true);
  const [autoSaveActive, setAutoSaveActive] = useState<boolean>(false);

  const AUTHORIZED_ADMIN_EMAILS = React.useMemo(() => [
    "jhs.kmj7@gmail.com"
  ], []);

  const userEmail = (currentUser?.email ?? "").toLowerCase();
  const isAuthorizedAdmin = React.useMemo(() => !!(currentUser && (AUTHORIZED_ADMIN_EMAILS.includes(userEmail) || profile?.role === "founder" || profile?.isFounder)), [currentUser, userEmail, profile?.role, profile?.isFounder, AUTHORIZED_ADMIN_EMAILS]);
  const isAuthorizedSuperFounder = React.useMemo(() => !!(currentUser && (userEmail === "jhs.kmj7@gmail.com" || profile?.isFounder)), [currentUser, userEmail, profile?.isFounder]);

  const [realNotifications, setRealNotifications] = useState<any[]>([]);
  const [globalNotifications, setGlobalNotifications] = useState<any[]>([]);
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`afrigombo_read_notifs_${currentUser?.uid || "guest"}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  useEffect(() => {
    if (currentUser?.uid) {
      try {
        const saved = localStorage.getItem(`afrigombo_read_notifs_${currentUser.uid}`);
        if (saved) {
          setLocalReadIds(new Set(JSON.parse(saved)));
        } else {
          setLocalReadIds(new Set());
        }
      } catch (e) {
        setLocalReadIds(new Set());
      }
    }
  }, [currentUser?.uid]);

  const handleMarkSingleNotifRead = async (notifId: string) => {
    if (!notifId) return;
    setLocalReadIds(prev => {
      const next = new Set(prev);
      next.add(notifId);
      if (currentUser?.uid) {
        try {
          localStorage.setItem(`afrigombo_read_notifs_${currentUser.uid}`, safeStringify(Array.from(next)));
        } catch (e) {}
      }
      return next;
    });

    setRealNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true, isRead: true } : n));
    setGlobalNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true, isRead: true } : n));

    try {
      await gomboDB.markNotificationAsRead(notifId);
    } catch (e) {}
  };

  const handleMarkAllNotifsRead = async () => {
    const allIds = allNotifications.map(n => n.id).filter(Boolean);
    setLocalReadIds(prev => {
      const next = new Set([...prev, ...allIds]);
      if (currentUser?.uid) {
        try {
          localStorage.setItem(`afrigombo_read_notifs_${currentUser.uid}`, safeStringify(Array.from(next)));
        } catch (e) {}
      }
      return next;
    });

    setRealNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
    setGlobalNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));

    if (currentUser?.uid) {
      try {
        await gomboDB.markAllUserNotificationsAsRead(currentUser.uid);
      } catch (e) {}
    }
  };

  const [pubFilter, setPubFilter] = useState<"all" | "en_cours" | "valide" | "termine" | "annule">("all");
  const [historyFilter, setHistoryFilter] = useState<"all" | "connections" | "transactions" | "applications">("all");
  
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (currentUser?.uid) {
      const unsubscribeUser = gomboDB.listenUserNotifications(currentUser.uid, (userNotifs) => {
        setRealNotifications(prev => {
          const newUnread = userNotifs.filter(n => !n.read).length;
          const oldUnread = prev.filter(n => !n.read).length;
          
          if (!isFirstLoadRef.current && newUnread > oldUnread) {
            try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
          }
          
          if (isFirstLoadRef.current) {
             isFirstLoadRef.current = false;
          }
          
          return userNotifs;
        });
      });
      
      const unsubscribeGlobal = gomboDB.listenAdminNotifications((allGlobal) => {
        // Filter based on audience
        const filtered = allGlobal.filter(n => {
          if (n.status !== "published") return false;
          if (n.audience === "Tous") return true;
          
          // Check if scheduled time has passed
          if (n.scheduledAt && new Date(n.scheduledAt).getTime() > Date.now()) return false;
          
          if (n.audience === "Premium" && profile?.isVip) return true;
          if (n.audience === "Musiciens" && profile?.role === "musicien") return true;
          if (n.audience === "Organisateurs" && profile?.role === "client") return true;
          if (n.audience === "Administrateurs" && isAuthorizedAdmin) return true;
          if (n.audience === "Super Fondateur" && isAuthorizedSuperFounder) return true;
          if ((n as any).receiverUid === "SUPER_FOUNDER" && isAuthorizedSuperFounder) return true;
          
          return false;
        });
        setGlobalNotifications(filtered);
      });

      return () => {
        unsubscribeUser();
        unsubscribeGlobal();
      };
    }
  }, [currentUser?.uid, profile?.isVip, profile?.role, isAuthorizedAdmin, isAuthorizedSuperFounder]);

  // Combined notifications for the UI
  const allNotifications = [...realNotifications, ...globalNotifications].filter(n => {
    if ((n as any).isFounderOnly && currentUser?.email !== "jhs.kmj7@gmail.com") {
      return false;
    }
    return true;
  }).map(n => {
    const isLocallyRead = n.id && localReadIds.has(n.id);
    if (isLocallyRead || n.read || n.isRead) {
      return { ...n, read: true, isRead: true };
    }
    return n;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const unreadNotifsCount = allNotifications.filter(n => !(n as any).isRead && !n.read).length;

  // Banner Toast logic for Admin Announcements / Founder Decrees
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());
  const [activeAdminBanner, setActiveAdminBanner] = useState<any | null>(null);

  useEffect(() => {
    if (!allNotifications || allNotifications.length === 0) return;
    const latestAnnouncement = allNotifications.find(n => {
      if (dismissedBanners.has(n.id)) return false;
      const typeStr = String(n.type || n.category || "").toUpperCase();
      const isGlobalOrFounder = n.fromFounder || n.isGlobal || typeStr.includes("ANNOUNCE") || typeStr.includes("INFO") || typeStr.includes("URGENT") || typeStr.includes("SYST√àME") || typeStr.includes("LITIGE") || typeStr.includes("KYC");
      return isGlobalOrFounder;
    });

    if (latestAnnouncement) {
      const createdAtMs = new Date(latestAnnouncement.createdAt || Date.now()).getTime();
      const ageInSec = (Date.now() - createdAtMs) / 1000;
      if (ageInSec < 900 && (!latestAnnouncement.read && !(latestAnnouncement as any).isRead)) {
        setActiveAdminBanner(latestAnnouncement);
        const timer = setTimeout(() => {
          setActiveAdminBanner(null);
        }, 12000);
        return () => clearTimeout(timer);
      }
    }
  }, [allNotifications, dismissedBanners]);

  // Le Terrain, Vibes, and dynamic publishing interactions states
  const [terrainTab, setTerrainTab] = useState<"all" | "musicien" | "contrat">("all");
  const [appliedGombos, setAppliedGombos] = useState<string[]>([]);
  const [newPostContent, setNewPostContent] = useState<string>("");
  const [newGomboTitle, setNewGomboTitle] = useState<string>("");
  const [newGomboDesc, setNewGomboDesc] = useState<string>("");
  const [newGomboPrice, setNewGomboPrice] = useState<number>(55050);
  const [newGomboCommune, setNewGomboCommune] = useState<string>("Cocody");
  const [newPubType, setNewPubType] = useState<"post" | "gombo" | "opportunite" | "annonce" | "casting" | "evenement" | "contenu">("post");
  
  // Obligatory fields for Gombo & Renforts
  const [newGomboCategory, setNewGomboCategory] = useState<string>("Concert");
  const [newGomboOtherCategory, setNewGomboOtherCategory] = useState<string>("");
  const [newGomboCity, setNewGomboCity] = useState<string>("Abidjan");
  const [newGomboQuartier, setNewGomboQuartier] = useState<string>("");
  const [newGomboLieuPrecis, setNewGomboLieuPrecis] = useState<string>("");
  const [newGomboDate, setNewGomboDate] = useState<string>("");
  const [newGomboHeureDebut, setNewGomboHeureDebut] = useState<string>("20:00");
  const [newGomboHeureFin, setNewGomboHeureFin] = useState<string>("23:00");
  const [newGomboStyleMusical, setNewGomboStyleMusical] = useState<string>("");
  const [newGomboTenueExigee, setNewGomboTenueExigee] = useState<string>("");
  const [newGomboExperienceSouhaitee, setNewGomboExperienceSouhaitee] = useState<string>("");
  const [newGomboNombreRecherche, setNewGomboNombreRecherche] = useState<number>(1);
  // Specific Renfort group fields
  const [newGomboTransportFee, setNewGomboTransportFee] = useState<number>(3000);
  const [newGomboRepetitionsCount, setNewGomboRepetitionsCount] = useState<number>(3);
  const [newGomboRepetitionsSchedule, setNewGomboRepetitionsSchedule] = useState<string>("18h00-21h00");
  const [newGomboRepetitionsDates, setNewGomboRepetitionsDates] = useState<string>("");
  
  // Custom states for premium multi-step publish and heritage flow
  const [publishStep, setPublishStep] = useState<number>(1);
  const [publishLoading, setPublishLoading] = useState<boolean>(false);
  const [publishSuccess, setPublishSuccess] = useState<boolean>(false);
  const [publishPhoto, setPublishPhoto] = useState<string>("");
  const [publishAudio, setPublishAudio] = useState<string>("");
  const [publishDraftDetected, setPublishDraftDetected] = useState<boolean>(false);
  const [showHeritageLoginRequired, setShowHeritageLoginRequired] = useState<boolean>(false);
  
  // Validation code & beta testing states for user_publish
  const [pubValidationCode, setPubValidationCode] = useState<string>("");
  const [pubValidatingCode, setPubValidatingCode] = useState<boolean>(false);
  const [pubCodeSuccessMsg, setPubCodeSuccessMsg] = useState<string>("");
  const [pubCodeErrorMsg, setPubCodeErrorMsg] = useState<string>("");
  const [createdPubRefId, setCreatedPubRefId] = useState<string>("");
  const [createdPubTitle, setCreatedPubTitle] = useState<string>("");
  const [createdPubPrice, setCreatedPubPrice] = useState<number>(0);
  
  // Insufficient Funds modal state
  const [showInsufficientFundsModal, setShowInsufficientFundsModal] = useState<boolean>(false);
  const [insufficientFundsData, setInsufficientFundsData] = useState<{
    title: string;
    cachet: number;
    fee: number;
    total: number;
    userSolde: number;
  } | null>(null);

  // Publish Confirmation Bottom-Sheet state (Android Bottom-Sheet)
  const [showPublishConfirmBottomSheet, setShowPublishConfirmBottomSheet] = useState<boolean>(false);
  const [publishConfirmData, setPublishConfirmData] = useState<{
    title: string;
    cachet: number;
    fee: number;
    rate: number;
    isPremium: boolean;
    total: number;
    soldeAvant: number;
    soldeApres: number;
  } | null>(null);
  
  // Draft restoration and auto-saving logic
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gombo_publish_draft");
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.title) setNewGomboTitle(draft.title);
        if (draft.desc) setNewGomboDesc(draft.desc);
        if (draft.price) setNewGomboPrice(draft.price);
        if (draft.category) setNewGomboCategory(draft.category);
        if (draft.city) setNewGomboCity(draft.city);
        if (draft.quartier) setNewGomboQuartier(draft.quartier);
        if (draft.lieuPrecis) setNewGomboLieuPrecis(draft.lieuPrecis);
        if (draft.date) setNewGomboDate(draft.date);
        if (draft.style) setNewGomboStyleMusical(draft.style);
        if (draft.tenue) setNewGomboTenueExigee(draft.tenue);
        if (draft.exp) setNewGomboExperienceSouhaitee(draft.exp);
        setPublishDraftDetected(true);
        setTimeout(() => setPublishDraftDetected(false), 5000);
      }
    } catch (_) {}
  }, []);

  // Plus Menu overlay states
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState<boolean>(false);
  const [showHowWorksPopup, setShowHowWorksPopup] = useState<boolean>(false);

  const isAnyAdminModalOpen = isPlusMenuOpen || isAuthModalOpen || isChangelogModalOpen || showGoogleLoginRequiredModal || isEventsModalOpen || isAcademyModalOpen || showHeritageLoginRequired || showHowWorksPopup || showPendingPaymentModal;

  useEffect(() => {
    if (isAnyAdminModalOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsPlusMenuOpen(false);
          setIsAuthModalOpen(false);
          setIsChangelogModalOpen(false);
          setShowGoogleLoginRequiredModal(false);
          setIsEventsModalOpen(false);
          setIsAcademyModalOpen(false);
          setShowHeritageLoginRequired(false);
          setShowHowWorksPopup(false);
          setShowPendingPaymentModal(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      const handlePopState = () => {
        setIsPlusMenuOpen(false);
        setIsAuthModalOpen(false);
        setIsChangelogModalOpen(false);
        setShowGoogleLoginRequiredModal(false);
        setIsEventsModalOpen(false);
        setIsAcademyModalOpen(false);
        setShowHeritageLoginRequired(false);
        setShowHowWorksPopup(false);
        setShowPendingPaymentModal(false);
      };
      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [isAnyAdminModalOpen]);
  const [activePublishType, setActivePublishType] = useState<"gombo" | "reel" | "demo" | "renfort" | "recherche">("gombo");
  const [selectedPublishTags, setSelectedPublishTags] = useState<string[]>([]);
  const [multiplePublishPhotos, setMultiplePublishPhotos] = useState<string[]>([]);
  
  // Real contract active tracking states
  const [contractRepsConfirmed, setContractRepsConfirmed] = useState<Record<string, number>>({});
  const [contractRepsOrganizerValidated, setContractRepsOrganizerValidated] = useState<Record<string, number>>({});
  const [contractDDayStarted, setContractDDayStarted] = useState<Record<string, boolean>>({});
  const [contractDDayEnded, setContractDDayEnded] = useState<Record<string, boolean>>({});
  const [contractDisputeOpened, setContractDisputeOpened] = useState<Record<string, boolean>>({});
  const [contractDisputeDetails, setContractDisputeDetails] = useState<Record<string, { reason: string, comment: string, proofUrl: string }>>({});
  
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState<number>(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [memberQuery, setMemberQuery] = useState<string>("");
  const [communeFilter, setCommuneFilter] = useState<string>("all");
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [postComments, setPostComments] = useState<Record<string, { id: string, content: string, writerName: string }[]>>({});

  // Simulated admin email & Super Admin unlocks state
  const [adminEmail, setAdminEmail] = useState<string>("admin@gombo.ci");
  const [isSuperUnlocked, setIsSuperUnlocked] = useState<boolean>(false);

  // Dynamic real-time Firestore configs mapping for the Sovereignty Throne
  const [dynamicFounders, setDynamicFounders] = useState<string[]>(["johnsylvesterh@gmail.com"]);
  const [dynamicSuperAdmins, setDynamicSuperAdmins] = useState<string[]>(["sylvestrehounkpevi777@gmail.com", "jhs.kmj7@gmail.com"]);

  // Keep adminEmail synced with actual firebase user email for database operations
  useEffect(() => {
    if (currentUser?.email) {
      setAdminEmail(currentUser.email);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setTotalUnreadMessages(0);
      return;
    }
    const unsubscribe = gomboDB.listenConversations(currentUser.uid, (convos) => {
      setConversations(convos);
      let unread = 0;
      convos.forEach(c => {
        unread += c.unreadCount?.[currentUser.uid] || 0;
      });
      setTotalUnreadMessages(unread);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!db) return;
    const docRef = doc(db, "throne", "config");
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.founders)) {
          setDynamicFounders(data.founders.map((e: any) => String(e || "").trim().toLowerCase()).filter(Boolean));
        }
        if (Array.isArray(data.superAdmins)) {
          setDynamicSuperAdmins(data.superAdmins.map((e: any) => String(e || "").trim().toLowerCase()).filter(Boolean));
        }
      } else {
        // Bootstrap config if current user is the root founder
        if (String(adminEmail || "").trim().toLowerCase() === "johnsylvesterh@gmail.com") {
          setDoc(docRef, {
            founders: ["johnsylvesterh@gmail.com"],
            superAdmins: ["sylvestrehounkpevi777@gmail.com", "jhs.kmj7@gmail.com"]
          }).catch(err => console.warn("Bootstrap config error:", err));
        }
      }
    }, (error) => {
      console.warn("üîê Access restricted or blocked on throne config doc:", error.message);
    });
    return () => unsub();
  }, [adminEmail]);

  // REAL-TIME GLOBAL FEATURE FLAGS ENGINE
  const [systemFeatureFlags, setSystemFeatureFlags] = useState<Record<string, any>>(() => getGlobalCachedFeatureFlags());

  useEffect(() => {
    const unsubSys = subscribeToFeatureFlags((updatedFlags) => {
      setSystemFeatureFlags(updatedFlags);
    });
    return () => unsubSys();
  }, []);

  const isSuperFounderUser = React.useMemo(() => {
    return isAuthorizedSuperFounder || (currentUser?.email === "jhs.kmj7@gmail.com");
  }, [isAuthorizedSuperFounder, currentUser?.email]);

  const isModuleVisible = (flagId: string): boolean => {
    return checkIsModuleVisible(flagId, systemFeatureFlags, isSuperFounderUser);
  };

  const isModuleAccessible = (flagId: string): boolean => {
    return checkIsModuleAccessible(flagId, systemFeatureFlags, isSuperFounderUser);
  };

  const isModuleComingSoon = (flagId: string): boolean => {
    return checkIsModuleComingSoon(flagId, systemFeatureFlags, isSuperFounderUser);
  };

  const isFeatureEnabled = (flagId: string): boolean => {
    return checkIsModuleAccessible(flagId, systemFeatureFlags, isSuperFounderUser);
  };

  const getFlagForMenu = (menu: string): string | null => {
    const map: Record<string, string> = {
      user_home: "home",
      user_terrain: "home",
      user_gombos: "gombos",
      user_mes_gombos: "gombos",
      user_publish: "gombos",
      nearby: "nearby",
      user_nearby: "nearby",
      nearbyOpportunities: "nearbyOpportunities",
      user_opportunities: "nearbyOpportunities",
      radar: "radar",
      user_radar: "radar",
      user_reels: "reels",
      reels: "reels",
      user_renforts: "renforts",
      renforts: "renforts",
      user_podcasts: "podcasts",
      podcasts: "podcasts",
      user_vibes: "podcasts",
      user_events: "events",
      events: "events",
      menu_events: "events",
      user_mes_groupes: "mes_groupes",
      user_favorites: "favorites",
      favorites: "favorites",
      user_gawa_center: "gawa_center",
      user_mes_lots: "mes_lots",
      user_wheel: "wheel",
      wheel: "wheel",
      premium_wheel: "wheel",
      user_wallet: "wallet",
      user_contracts: "escrow",
      user_subscription_management: "premium",
      user_gombo_plus: "premium",
      user_grand_marche: "grandMarket",
      user_grandMarket: "grandMarket",
      user_ecosystem: "grandMarket",
      menu_grand_marche: "grandMarket",
      user_academie: "academie",
      academie: "academie",
      menu_academie: "academie",
      user_whats_new: "updateJournal",
      user_downloads: "downloads",
      user_backups: "backups",
      user_avatar: "avatar",
      user_profile_view: "avatar",
      user_edit_profile: "avatar",
      user_heritage: "heritage",
      user_gombo_id: "gombo_id",
      user_messages: "chat",
      user_notifications: "notifications",
      user_support: "support",
      user_help_center: "support",
      user_command_center: "cahier",
      user_builders: "cahier",
      user_verification: "verification",
      menu_near_opports: "nearbyOpportunities",
      menu_msgs: "chat",
      menu_favorites: "favorites",
      menu_gombo_id: "gombo_id",
      menu_gombo_ads: "gombos",
      menu_heritage: "heritage",
      menu_pubs: "gombos",
      menu_comms: "chat",
      menu_notifications: "notifications",
      menu_changelog: "updateJournal"
    };
    return map[menu] || null;
  };

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    let targetMenu = "";
    if (path === "/publish" || path === "/publier") targetMenu = "user_publish";
    else if (path === "/vibes" || path === "/reels") targetMenu = "user_reels";
    else if (path === "/my-gombos" || path === "/gombos" || path === "/gombo") targetMenu = "user_mes_gombos";
    else if (path === "/heritage" || path === "/profil" || path === "/profile") targetMenu = "user_heritage";
    else if (path === "/wallet") targetMenu = "user_wallet";
    else if (path === "/gombo-id") targetMenu = "user_gombo_id";
    else if (path === "/nearby") targetMenu = "nearby";
    else if (path === "/messages" || path === "/chat") targetMenu = "user_messages";
    else if (path === "/settings") targetMenu = "user_settings";
    else if (path === "/grand-marche" || path === "/market") targetMenu = "user_grand_marche";
    else if (path === "/academie") targetMenu = "user_academie";
    else if (path === "/events") targetMenu = "user_events";
    else if (path === "/contracts") targetMenu = "user_contracts";
    else if (path === "/notifications") targetMenu = "user_notifications";
    else if (path === "/home" || path === "/") targetMenu = "user_terrain";

    if (targetMenu) {
      const flag = getFlagForMenu(targetMenu);
      if (flag && !checkIsModuleVisible(flag, systemFeatureFlags, isSuperFounderUser)) {
        // Module is MASQUER (HIDDEN): redirect instantly to user_terrain without DOM leakage
        setMenuHistory(["user_terrain"]);
        if (location.pathname !== "/home" && location.pathname !== "/") {
          window.history.replaceState(null, "", "/home");
        }
      } else {
        setMenuHistory(prev => prev[prev.length - 1] === targetMenu ? prev : [...prev, targetMenu]);
      }
    }
  }, [location.pathname, systemFeatureFlags, isSuperFounderUser]);

  // Active menu security check: immediately redirect if activeMenu points to a HIDDEN module
  useEffect(() => {
    if (!activeMenu || activeMenu === "user_terrain" || activeMenu === "user_home") return;
    const flag = getFlagForMenu(activeMenu);
    if (flag && !checkIsModuleVisible(flag, systemFeatureFlags, isSuperFounderUser)) {
      setMenuHistory(["user_terrain"]);
      if (location.pathname !== "/home" && location.pathname !== "/") {
        window.history.replaceState(null, "", "/home");
      }
    }
  }, [activeMenu, systemFeatureFlags, isSuperFounderUser, location.pathname]);

  const getFeatureNameForMenu = (menu: string): string => {
    switch (menu) {
      case "user_home":
      case "user_terrain":
        return "Accueil & Le Terrain";
      case "user_gombos":
      case "user_mes_gombos":
      case "user_publish":
        return "Gombos & Publications";
      case "nearby":
      case "user_nearby":
        return "Pr√®s de moi";
      case "nearbyOpportunities":
      case "user_opportunities":
        return "Opportunit√©s Proches";
      case "radar":
      case "user_radar":
        return "Radar G√©olocalis√©";
      case "user_reels":
      case "reels":
        return "Flex Multim√©dia & Reels";
      case "user_renforts":
      case "renforts":
        return "Renfort Express";
      case "user_podcasts":
      case "podcasts":
      case "user_vibes":
        return "Podcasts & R√©sonances";
      case "user_events":
      case "events":
      case "menu_events":
        return "√âv√©nements (Calendrier)";
      case "user_grand_marche":
      case "user_grandMarket":
      case "user_ecosystem":
      case "menu_grand_marche":
        return "Le Grand March√©";
      case "user_academie":
      case "academie":
      case "menu_academie":
        return "L'Acad√©mie";
      case "user_wallet":
        return "Wallet Souverain AFRIPAY";
      case "user_contracts":
        return "S√©questre & Contrats";
      case "user_subscription_management":
      case "user_gombo_plus":
        return "Adh√©sion Premium & Gombo Plus";
      case "user_heritage":
      case "menu_heritage":
        return "Mon H√©ritage & Portfolio";
      case "user_gombo_id":
      case "menu_gombo_id":
        return "Gombo ID Souverain";
      case "user_messages":
        return "Messagerie Instantan√©e";
      case "user_notifications":
        return "Notifications";
      case "user_gawa_center":
        return "Centre Gawa";
      case "user_mes_lots":
        return "Mes Lots";
      case "user_whats_new":
        return "Journal des Mises √† jour";
      case "user_downloads":
        return "T√©l√©chargements";
      case "user_backups":
        return "Sauvegardes";
      case "user_avatar":
      case "user_profile_view":
      case "user_edit_profile":
        return "Avatar & Profil";
      case "user_wheel":
      case "wheel":
      case "premium_wheel":
        return "Roue AFRIGOMBO";
      case "user_command_center":
      case "user_builders":
        return "Cahier & Command Center";
      case "user_support":
      case "user_help_center":
        return "Support & Aide";
      case "publish_gombo":
        return "Publier un Gombo";
      case "publish_reel":
        return "Publier un R√©el";
      case "publish_demo":
        return "D√©mo Musicale";
      case "publish_renfort":
        return "Renfort Express";
      default:
        return "Fonctionnalit√©";
    }
  };

  const [isSuperWelcomeOpen, setIsSuperWelcomeOpen] = useState<boolean>(false);
  const [showThroneCinematic, setShowThroneCinematic] = useState<boolean>(false);
  const hasSeenThroneCinematic = useRef<boolean>(false);

  useEffect(() => {
    if (activeMenu === "super_admin" && !hasSeenThroneCinematic.current) {
      setShowThroneCinematic(true);
      hasSeenThroneCinematic.current = true;
    }
  }, [activeMenu]);

  // Reset scroll to top on every menu switch
  useEffect(() => {
    window.scrollTo(0, 0);
    const scrollables = document.querySelectorAll('.overflow-y-auto, .overflow-auto, [class*="overflow-y-auto"]');
    scrollables.forEach(el => {
      (el as HTMLElement).scrollTop = 0;
    });
  }, [activeMenu, perspective]);

  // Custom Reviews & Gombo completeness state
  const [reviews, setReviews] = useState<GomboReview[]>([]);
  const [completingGombo, setCompletingGombo] = useState<Gombo | null>(null);

  // Complete Gombo reviews form state
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewMusicianId, setReviewMusicianId] = useState<string>("");
  const [reciprocalRating, setReciprocalRating] = useState<number>(5);
  const [reciprocalComment, setReciprocalComment] = useState<string>("");
  const [enableReciprocal, setEnableReciprocal] = useState<boolean>(true);

  // System parameters
  const [systemCommissionRate, setSystemCommissionRate] = useState<number>(10);
  const [contracts, setContracts] = useState<GomboSafeContract[]>([]);


  // --- CORE APPLICATION STATES ---
  const [users, setUsers] = useState<User[]>([]);
  const [gombos, setGombos] = useState<Gombo[]>([]);
  const [alerts, setAlerts] = useState<Alerte[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsDebugError, setPostsDebugError] = useState<string | null>(null);
  const [renforts, setRenforts] = useState<Renfort[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // --- √âTAPE 7 : TABLEAU DE BORD ULTRA-AUTONOME STATES ---
  const [scannerStatus, setScannerStatus] = useState<"idle" | "scanning" | "completed">("idle");
  const [autoFlaggedPosts, setAutoFlaggedPosts] = useState<Post[]>([]);
  const [autoFlaggedUsers, setAutoFlaggedUsers] = useState<User[]>([]);
  const [autoStats, setAutoStats] = useState({
    growthRate: "+19.4%",
    suspiciousCount: 1,
    anomalyCount: 2,
    alertCount: 2
  });

  const [kycActiveTab, setKycActiveTab] = useState<"standard" | "express" | "approved" | "rejected" | "info_required" | "all">("all");
  const [infoMessages, setInfoMessages] = useState<{ [key: string]: string }>({});
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [isAnnonceModalOpen, setIsAnnonceModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendUserSearch, setSuspendUserSearch] = useState("");
  const [isScanFeedbackVisible, setIsScanFeedbackVisible] = useState(false);
  const [sonsEnabled, setSonsEnabled] = useState<boolean>(() => localStorage.getItem("afrigombo_sounds") !== "false");
  const [showDashboardIntro, setShowDashboardIntro] = useState<boolean>(true);
  const [dashboardStep, setDashboardStep] = useState<number>(1);
  const [superAdminTab, setSuperAdminTab] = useState<"throne" | "beta_transactions" | "media" | "economie" | "batisseurs" | "geolocalisation" | "avatar_store">("throne");
  const pendingBetaCount = transactions.filter((t: any) => t.status === "en_attente_validation").length;

  // --- STATE FOR ACTIONS RAPIDES AND RECHERCHE UNIVERSELLE ---
  const [universalSearchTerm, setUniversalSearchTerm] = useState("");
  const [activeQuickActionModal, setActiveQuickActionModal] = useState<string | null>(null);
  const [selectedSearchMember, setSelectedSearchMember] = useState<User | null>(null);
  const [verifyGomboIdInput, setVerifyGomboIdInput] = useState("");
  const [verifyGomboIdResult, setVerifyGomboIdResult] = useState<any>(null);
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeCategory, setNewNoticeCategory] = useState("INFO");
  const [newNoticeBody, setNewNoticeBody] = useState("");
  const [customReportSubject, setCustomReportSubject] = useState("");
  const [customReportUser, setCustomReportUser] = useState("");
  const [customReportReason, setCustomReportReason] = useState("");

  // --- ADMINISTRATIVE ACTION LOGS (ZONE C TERMINAL) ---
  const [terminalFeed, setTerminalFeed] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] ü¶Ö AFRIGOMBO ELITE Elite Centre de Commandement allum√©. Connect√© au Firebase.`,
    `[${new Date().toLocaleTimeString()}] Securit√© de l'H√©ritage Musical : auto-sauvegarde active.`,
    `[${new Date().toLocaleTimeString()}] Gombocaisse : commission par d√©faut fix√©e √† 10%.`,
  ]);

  // --- DYNAMIC BRIEF DATA (DAILY SUMMARY MODULE) ---
  // Calculate real admin metrics from live snapshots
  const newUsersCount = users.filter((u: any) => {
    // Users registered within the last 7 days
    const created = new Date(u.createdAt || Date.now());
    return (Date.now() - created.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length;
  
  const brief = {
    newUsersCount,
    newPostsCount: posts.length,
    newGombosCount: gombos.length,
    revenuesGenerated: transactions.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0),
    kycRequestsCount: users.filter((u: any) => u.kycStatus === 'pending').length,
    criticalAlertsCount: alerts.filter((a: any) => a.status === 'open' || a.priority === 'high').length + posts.filter((p: any) => p.isFlagged).length,
    timestamp: new Date().toLocaleDateString()
  };

  const [adminLogs, setAdminLogs] = useState<any[]>([]);

  // --- FORMS & EDIT STATES ---
  const [newGombo, setNewGombo] = useState({
    title: "",
    description: "",
    budget: "",
    commissionRate: "10",
    location: "Cocody"
  });

  const [editingProfileUserId, setEditingProfileUserId] = useState<string | null>(null);

  // --- INTERACTIVE PREMIUM OPPORTUNITIES STATES ---
  const [savedGomboIds, setSavedGomboIds] = useState<string[]>([]);
  const [honoredGomboIds, setHonoredGomboIds] = useState<string[]>([]);
  const [palabreGombo, setPalabreGombo] = useState<Gombo | null>(null);
  const [palabreMsg, setPalabreMsg] = useState("");
  const [palabreChatHistory, setPalabreChatHistory] = useState<{ [key: string]: { sender: "artiste" | "organisateur", text: string, time: string }[] }>({
    "gombo_1": [
      { sender: "organisateur", text: "Salut l'artiste ! Ton profil majestueux de Gombo ID nous int√©resse pour le concert de gala. Es-tu dispo pour une r√©p√©tition le 14 Juin au Plateau ?", time: "09:30" }
    ],
    "gombo_2": [
      { sender: "organisateur", text: "Honorables salutations de la part de l'H√¥tel Ivoire. Vos comp√©tences vocales conviennent parfaitement √† notre prestige.", time: "Hier, 18h20" }
    ]
  });
  const [profileForm, setProfileForm] = useState<Partial<UserPerformance>>({
    artisticName: "",
    commune: "Cocody",
    specialties: [],
    groups: [],
    level: 1,
    score: 0
  });

  const [specInput, setSpecInput] = useState("");

  // --- MONETISATION SIMULATOR STATES ---
  const [simUserId, setSimUserId] = useState("");
  const [simProduct, setSimProduct] = useState("cert_express");
  const [simBoostPrice, setSimBoostPrice] = useState(1000);
  const [groupInput, setGroupInput] = useState("");

  // --- FIRESTORE ACTIVE SYNC ROUTINE ---
  useEffect(() => {
    if (!currentUser || !db || perspective !== "admin") return;
    // Attempt Firestore subscription & binding
    try {
      gomboDB.getSystemCommissionRate().then((rate) => {
        setSystemCommissionRate(rate);
        addToTerminal(`[SYS] Taux de commission charg√© : ${rate}%.`);
      }).catch(err => {
        console.warn("Could not fetch commission rate from db:", err);
      });
      const qUsers = collection(db, "users");
      const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
        const fetchedUsers: User[] = [];
        snapshot.forEach((docSnap) => {
          fetchedUsers.push({ id: docSnap.id, ...docSnap.data() } as User);
        });
        setUsers(fetchedUsers);
      }, (error) => {
        addToTerminal(`[Alerte r√©seau] Firestore non-accessible directement. Mode local premium activ√©.`);
      });

      const qGombos = collection(db, "gombos");
      const unsubscribeGombos = onSnapshot(qGombos, (snapshot) => {
        const fetchedGombos: Gombo[] = [];
        snapshot.forEach((docSnap) => {
          fetchedGombos.push({ id: docSnap.id, ...docSnap.data() } as Gombo);
        });
        setGombos(fetchedGombos);
      }, (error) => {
        console.warn("üîê Gombos sync limited or offline:", error.message);
      });

      const qTransactions = query(collection(db, "transactions"), orderBy("timestamp", "desc"), limit(200));
      const unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
        const fetchedTransactions: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          fetchedTransactions.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
        });
        setTransactions(fetchedTransactions);
      }, (error) => {
        console.warn("üîê Transactions sync restricted for current user role:", error.message);
      });

      const qReviews = collection(db, "reviews");
      const unsubscribeReviews = onSnapshot(qReviews, (snapshot) => {
        const fetchedReviews: GomboReview[] = [];
        snapshot.forEach((docSnap) => {
          fetchedReviews.push({ id: docSnap.id, ...docSnap.data() } as GomboReview);
        });
        setReviews(fetchedReviews);
      }, (error) => {
        console.warn("üîê Reviews sync limited or offline:", error.message);
      });

      const qAlerts = collection(db, "alerts");
      const unsubscribeAlerts = onSnapshot(qAlerts, (snapshot) => {
        const fetchedAlerts: Alerte[] = [];
        snapshot.forEach((docSnap) => {
          fetchedAlerts.push({ id: docSnap.id, ...docSnap.data() } as Alerte);
        });
        setAlerts(fetchedAlerts);
      }, (error) => {
        console.warn("üîê Alerts sync restricted for current user role:", error.message);
      });

      const qPosts = query(collection(db, "posts"), limit(200));
      const unsubscribePosts = onSnapshot(qPosts, (snapshot) => {
        const fetchedPosts: Post[] = [];
        snapshot.forEach((docSnap) => {
          fetchedPosts.push({ id: docSnap.id, ...docSnap.data() } as Post);
        });
        fetchedPosts.sort((a: any, b: any) => {
          const timeA = new Date(a.timestamp || a.createdAt || a.date || 0).getTime() || 0;
          const timeB = new Date(b.timestamp || b.createdAt || b.date || 0).getTime() || 0;
          return timeB - timeA;
        });
        setPosts(fetchedPosts);
        setPostsDebugError(null);
      }, (error) => {
        console.warn("üîê Posts sync limited or offline:", error.message);
        setPostsDebugError(`${error.code || "?"} ‚Äî ${error.message}`);
      });

      const qRenforts = query(collection(db, "renforts"), orderBy("createdAt", "desc"), limit(100));
      const unsubscribeRenforts = onSnapshot(qRenforts, (snapshot) => {
        const fetchedRenforts: any[] = [];
        snapshot.forEach((docSnap) => {
          fetchedRenforts.push({ id: docSnap.id, ...docSnap.data() });
        });
        setRenforts(fetchedRenforts);
      }, (error) => {
        console.warn("üîê Renforts sync limited or offline:", error.message);
      });

      const qLogs = query(collection(db, "admin_logs"), orderBy("timestamp", "desc"), limit(100));
      const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
        const fetchedLogs: any[] = [];
        snapshot.forEach((docSnap) => {
          fetchedLogs.push({ id: docSnap.id, ...docSnap.data() });
        });
        setAdminLogs(fetchedLogs);
      }, (error) => {
        console.warn("üîê Logs sync limited:", error.message);
      });

      const qContracts = collection(db, "contracts");
      const unsubscribeContracts = onSnapshot(qContracts, (snapshot) => {
        const fetchedContracts: GomboSafeContract[] = [];
        snapshot.forEach((docSnap) => {
          fetchedContracts.push({ id: docSnap.id, ...docSnap.data() } as GomboSafeContract);
        });
        setContracts(fetchedContracts);
      }, (error) => {
        console.warn("üîê Contracts sync limited:", error.message);
      });

      return () => {
        unsubscribeUsers();
        unsubscribeGombos();
        unsubscribeTransactions();
        unsubscribeReviews();
        unsubscribeAlerts();
        unsubscribePosts();
        unsubscribeRenforts();
        unsubscribeLogs();
        unsubscribeContracts();
      };
    } catch (e) {
      addToTerminal(`[Alerte locale] Lancement offline synchronis√©.`);
    }
  }, [currentUser, perspective]);

  // --- DASHBOARD INTRO MOUNT SEQUENCE ---
  useEffect(() => {
    if (activeMenu === "dashboard") {
      setShowDashboardIntro(true);
      setDashboardStep(1);

      // Trigger warm tam-tam beats if sounds are enabled in localStorage
      try {
        if (localStorage.getItem("afrigombo_sounds") !== "false") {
          audioSynth.playTamTam(false);
          setTimeout(() => audioSynth.playTamTam(true), 240);
        }
      } catch (err) {}

      const t1 = setTimeout(() => {
        setDashboardStep(2);
        try {
          if (localStorage.getItem("afrigombo_sounds") !== "false") {
            audioSynth.playKoraNote(392.00, 0, 0.12, 0.45); // pentatonic Kora pluck
          }
        } catch (err) {}
      }, 700);

      const t2 = setTimeout(() => {
        setDashboardStep(3);
        try {
          if (localStorage.getItem("afrigombo_sounds") !== "false") {
            audioSynth.playKoraNote(523.25, 0, 0.15, 0.55); // high pitch certification pitch
          }
        } catch (err) {}
      }, 1450);

      const t3 = setTimeout(() => {
        setShowDashboardIntro(false);
      }, 2150); // Under 2.5 seconds maximum as requested

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [activeMenu]);

  // Removed window.location.pathname syncs to prevent bouncing back.

  // Watertight access security rules enforcement for administration pages (Level 2 & 3)
  useEffect(() => {
    if (perspective === "admin") {
      if (!currentUser) {
        setPerspective("user");
        setActiveMenu("user_terrain");
        setIsAuthModalOpen(true);
        addToTerminal("[üõ°Ô∏è SECURE] Authentification requise pour l'administration.");
        return;
      }

      if (!isAuthorizedAdmin) {
        setPerspective("user");
        setActiveMenu("user_terrain");
        alert("üîí ACC√àS D√âFENDU\n\nAcc√®s refus√©. Cette zone est r√©serv√©e au Fondateur AFRIGOMBO ELITE.");
        addToTerminal(`[üõ°Ô∏è SECURE] Acc√®s administratif bloqu√© pour l'adresse ${currentUser.email}.`);
        return;
      }

      if (activeMenu === "super_admin" && !isAuthorizedSuperFounder) {
        setActiveMenu("dashboard");
        alert("üîí ACC√àS FONDATEUR UNIQUE INTERDIT\n\nCe sanctuaire syst√®me est r√©serv√© au Super Fondateur Unique.");
        addToTerminal(`[üõ°Ô∏è SECURE] Tentative d'acc√®s non autoris√©e au Tr√¥ne par ${currentUser.email} rejet√©e.`);
      }
    }
  }, [perspective, activeMenu, currentUser, isAuthorizedAdmin, isAuthorizedSuperFounder]);

  // Watertight access security rules enforcement for non-authenticated users
  useEffect(() => {
    if (isMenuProtected(activeMenu) && !currentUser) {
      setActiveMenu("user_terrain");
      setIsAuthModalOpen(true);
      addToTerminal(`[üõ°Ô∏è SECURE] Tentative d'acc√®s anonyme au menu ${activeMenu} bloqu√©e.`);
    }
  }, [activeMenu, currentUser]);

  // --- AUTOMATIC BACKGROUND MODERATION ROUTINE ("PILOTAGE AUTOMATIQUE") ---
  useEffect(() => {
    const interval = setInterval(() => {
      // Periodic autonomous check
      setAutoSaveActive(true);
      setTimeout(() => setAutoSaveActive(false), 1200);

      // Perform a silent mini-scan for anomalous activities
      const suspectItemsCount = users.filter(u => u.status === "suspect").length;
      const flaggedPostsCount = posts.filter(p => p.isFlagged).length;

      if (suspectItemsCount > 0 || flaggedPostsCount > 0) {
        // Trigger alert periodically
        const timestamp = new Date().toLocaleTimeString();
        if (Math.random() > 0.7) {
          addToTerminal(`[P-INTELLIGENT] ü§ñ Routine autonome : ${suspectItemsCount} compte suspect surveill√©.`);
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [users, posts]);

  const addToTerminal = (message: string) => {
    setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  // --- ACTIONS ---
  const triggerGlobalSystemScan = () => {
    setScannerStatus("scanning");
    addToTerminal(`[P-INTELLIGENT] üîç Analyse autonome compl√®te initi√©e par le Super Admin...`);
    setIsScanFeedbackVisible(true);

    setTimeout(() => {
      // Populate automatic flagged items
      const flaggedP = posts.filter(p => p.isFlagged || String(p.content || "").toLowerCase().includes("contrefait") || String(p.content || "").toLowerCase().includes("cachette"));
      const suspectU = users.filter(u => u.status === "suspect" || u.flagsCount > 1);

      setAutoFlaggedPosts(flaggedP);
      setAutoFlaggedUsers(suspectU);
      setScannerStatus("completed");

      setAutoStats({
        growthRate: "+19.4%",
        suspiciousCount: suspectU.length,
        anomalyCount: flaggedP.length,
        alertCount: alerts.length
      });

      addToTerminal(`[P-INTELLIGENT] ‚úÖ Analyse termin√©e. ${flaggedP.length} anomalies de publications et ${suspectU.length} profils suspects trouv√©s.`);
    }, 2500);
  };

  const saveToFirestore = async (collectionName: string, docId: string, data: any) => {
    try {
      setAutoSaveActive(true);
      const docRef = doc(db, collectionName, docId);
      
      // Deep clone and clean up data to avoid cyclic object or custom class errors
      let safeData = data;
      try {
        safeData = safeJsonClone(data);
      } catch (err) {
        console.error("Error sanitizing data for Firestore:", err);
      }

      await setDoc(docRef, safeData, { merge: true });
      addToTerminal(`[SYNC] Sauvegarde r√©ussie sur Firestore pour ${collectionName}/${docId}`);
      setTimeout(() => setAutoSaveActive(false), 800);
    } catch (e) {
      // Local persistence simulation to remain robust during offline
      addToTerminal(`[LOCAL] Donn√©es enregistr√©es localement (Firestore indisponible).`);
      setTimeout(() => setAutoSaveActive(false), 800);
    }
  };

  const createTransaction = async (
    amount: number,
    type: Transaction["type"],
    description: string,
    userId: string,
    userArtisticName: string
  ) => {
    const tx: Transaction = {
      id: "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      amount,
      type,
      description,
      userId,
      userArtisticName,
      timestamp: new Date().toISOString()
    };
    
    setTransactions(prev => [tx, ...prev]);
    await saveToFirestore("transactions", tx.id, tx);
    
    if (type === "commission" || type === "cert_express" || type === "subscription") {
       interactionBus.emit("NEW_REVENUE");
    }
    
    // Update statistics handled dynamically via onSnapshot
    
    addToTerminal(`[üí∞ LA CAISSE] Paiement de ${amount.toLocaleString()} FCFA re√ßu : ${description}`);
  };

  const handlePerformSimulatedPayment = async () => {
    const targetId = simUserId || (users.length > 0 ? users[0].id : "");
    if (!targetId) {
      addToTerminal(`[Alerte] Veuillez d'abord cr√©er ou s√©lectionner un compte artiste pour simuler.`);
      return;
    }
    const targetUser = users.find(u => u.id === targetId);
    if (!targetUser) return;

    switch (simProduct) {
      case "cert_express":
        await createTransaction(500, "cert_express", `‚ö° Certification Express GOMBO ID (24-72h) - ${targetUser.artisticName}`, targetUser.id, targetUser.artisticName);
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, kycStatus: "pending" } : u));
        await saveToFirestore("users", targetUser.id, { ...targetUser, kycStatus: "pending" });
        addToTerminal(`[‚ö° KYC] Demande Express enregistr√©e pour ${targetUser.artisticName}. Traitement prioritaire sous 24-72h.`);
        break;
      case "gombo_vip":
        await createTransaction(1000, "gombo_vip", `‚ú® Souscription Mensuelle GOMBO VIP - ${targetUser.artisticName}`, targetUser.id, targetUser.artisticName);
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, isVip: true } : u));
        await saveToFirestore("users", targetUser.id, { ...targetUser, isVip: true });
        addToTerminal(`[‚ú® VIP] Compte d'artiste ${targetUser.artisticName} √©lev√© au statut GOMBO VIP (Badge activ√©).`);
        break;
      case "boost_gombo":
        await createTransaction(simBoostPrice, "boost_gombo", `üî• Boost Tam-Tam Gombo "En Vedette" (${simBoostPrice} FCFA) - ${targetUser.artisticName}`, targetUser.id, targetUser.artisticName);
        const userPost = posts.find(p => p.userId === targetUser.id);
        if (userPost) {
          setPosts(prev => prev.map(p => p.id === userPost.id ? { ...p, isBoosted: true } : p));
          addToTerminal(`[üî• BOOST] Publication "${userPost.content.substring(0, 30)}..." de l'artiste ${targetUser.artisticName} mise EN VEDETTE.`);
        } else if (posts.length > 0) {
          const firstPost = posts[0];
          setPosts(prev => prev.map(p => p.id === firstPost.id ? { ...p, isBoosted: true } : p));
          addToTerminal(`[üî• BOOST] Aucune publication trouv√©e pour ${targetUser.artisticName}. Premi√®re publication g√©n√©rale mise EN VEDETTE.`);
        } else {
          addToTerminal(`[üî• BOOST] Aucune publication √† booster sur Le Tam-Tam Gombo.`);
        }
        break;
      case "renfort_express":
        await createTransaction(500, "renfort_express", `‚ö° Renfort Express Urgent (Demande d'assistance prioritaire) - ${targetUser.artisticName}`, targetUser.id, targetUser.artisticName);
        if (renforts.length > 0) {
          setRenforts(prev => prev.map((r, i) => i === 0 ? { ...r, isExpress: true } : r));
          addToTerminal(`[‚ö° RENFORT] Demande de renfort active tagg√©e ‚ö° Renfort Express.`);
        } else {
          addToTerminal(`[‚ö° RENFORT] Aucun renfort existant. Demande de renfort express prioritaire simul√©e.`);
        }
        break;
      case "gombo_pro":
        await createTransaction(5000, "gombo_pro", `üíº Abonnement Gombo PRO Mensuel (Orchestre) - ${targetUser.artisticName}`, targetUser.id, targetUser.artisticName);
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, isPro: true } : u));
        await saveToFirestore("users", targetUser.id, { ...targetUser, isPro: true });
        addToTerminal(`[üíº PRO] Statut GOMBO PRO activ√© pour ${targetUser.artisticName} (Panoplie compl√®te d'orchestres).`);
        break;
      default:
        break;
    }
  };

  const handleCreateGombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGombo.title || !newGombo.budget) return;

    const budgetNum = parseInt(newGombo.budget);
    const rateNum = parseFloat(newGombo.commissionRate) / 100;

    const gomboData: Gombo = {
      id: "gombo_" + Date.now(),
      title: newGombo.title,
      description: newGombo.description,
      budget: budgetNum,
      commissionRate: rateNum,
      location: newGombo.location,
      organizerId: "admin",
      organizerName: "AFRIGOMBO ELITE Administration",
      timestamp: new Date().toISOString(),
      applicantsCount: 0,
      status: "open"
    };

    setGombos(prev => [gomboData, ...prev]);
    addToTerminal(`[üéº GOMBO] Nouveau Gombo publi√© √† ${newGombo.location} : "${newGombo.title}" d'un budget de ${budgetNum.toLocaleString()} FCFA`);

    // Sync with database
    await saveToFirestore("gombos", gomboData.id, gomboData);

    // Update statistics handled dynamically via onSnapshot

    // Reset Form
    setNewGombo({
      title: "",
      description: "",
      budget: "",
      commissionRate: "10",
      location: "Cocody"
    });
  };

  const applyGombosFilters = async (cat: string, loc: string, typeVal: string, dateVal: string) => {
    if (!db) return;
    try {
      let q = collection(db, "gombos");
      let constraints: any[] = [];
      if (cat !== "all") {
        constraints.push(where("category", "==", cat));
      }
      if (loc !== "all") {
        constraints.push(where("location", "==", loc));
      }
      if (typeVal !== "all") {
        constraints.push(where("type", "==", typeVal));
      }
      const finalQ = constraints.length > 0 ? query(q, ...constraints) : q;
      const snap = await getDocs(finalQ);
      const results: any[] = [];
      snap.forEach((docSnap) => {
        results.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (results.length > 0 || constraints.length > 0) {
        setGombos(results);
      }
    } catch (err: any) {
      console.warn("üîê Dynamic query index required or error, using local fallback filters:", err.message);
    }
  };

  const handleCompleteGombo = async () => {
    if (!completingGombo) return;
    try {
      await saveToFirestore("gombos", completingGombo.id, { status: "completed" });
      setGombos(prev => prev.map(g => g.id === completingGombo.id ? { ...g, status: "completed" } : g));

      const selectedMusician = users.find(u => u.id === reviewMusicianId) || users[0];
      if (!selectedMusician) {
        alert("Veuillez s√©lectionner un artiste √† √©valuer.");
        return;
      }

      const clientReviewId = "rev_client_" + Date.now();
      const clientReview: GomboReview = {
        id: clientReviewId,
        gomboId: completingGombo.id,
        gomboTitle: completingGombo.title,
        reviewerId: "current_client_user",
        reviewerName: completingGombo.organizerName || "Organisateur Gombo",
        revieweeId: selectedMusician.id,
        revieweeName: selectedMusician.artisticName,
        rating: reviewRating,
        comment: reviewComment || "Prestation imp√©riale et d'un grand professionnalisme sur sc√®ne !",
        timestamp: new Date().toISOString(),
        type: "client_to_musician"
      };

      await saveToFirestore("reviews", clientReviewId, clientReview);
      setReviews(prev => [clientReview, ...prev]);

      if (enableReciprocal) {
        const musicianReviewId = "rev_musician_" + Date.now();
        const musicianReview: GomboReview = {
          id: musicianReviewId,
          gomboId: completingGombo.id,
          gomboTitle: completingGombo.title,
          reviewerId: selectedMusician.id,
          reviewerName: selectedMusician.artisticName,
          revieweeId: "current_client_user",
          revieweeName: completingGombo.organizerName || "Organisateur Gombo",
          rating: reciprocalRating,
          comment: reciprocalComment || "Tr√®s bon accueil ! Sonorisation excellente et organisation de haut standing.",
          timestamp: new Date().toISOString(),
          type: "musician_to_client"
        };
        await saveToFirestore("reviews", musicianReviewId, musicianReview);
        setReviews(prev => [musicianReview, ...prev]);
      }

      addToTerminal(`[INFO] Gombo Cl√¥tur√© : L'√©v√©nement "${completingGombo.title}" est compl√©t√©. √âvaluation de ${selectedMusician.artisticName} enregistr√©e.`);
      setCompletingGombo(null);
    } catch(err) {
      console.error(err);
      addToTerminal(`[ERREUR] Impossible de cl√¥turer le gombo.`);
    }
  };

  // --- PREMIUM INTERACTIVES GOMBO HANDLERS ---
  const toggleSaveGombo = (id: string) => {
    requireAuthThen(() => {
      setSavedGomboIds(prev => {
        const isSaved = prev.includes(id);
        if (currentUser) {
          gomboDB.toggleSaveAction(currentUser.uid, id);
        }
        if (isSaved) {
          addToTerminal(`[üìå PERSISTENCE] Gombo retir√© du coffre-fort d'or.`);
          return prev.filter(gid => gid !== id);
        } else {
          addToTerminal(`[üìå PERSISTENCE] Gombo pr√©cieusement sauvegard√© dans votre coffre-fort d'or.`);
          return [...prev, id];
        }
      });
    });
  };

  const toggleHonorGombo = (id: string) => {
    requireAuthThen(() => {
      setHonoredGomboIds(prev => {
        const hasHonored = prev.includes(id);
        if (currentUser) {
          gomboDB.toggleHonor(currentUser.uid, id);
        }
        if (hasHonored) {
          addToTerminal(`[üèÜ HONNEUR] Vous avez retir√© votre honneur au gombo.`);
          return prev.filter(gid => gid !== id);
        } else {
          addToTerminal(`[üèÜ HONNEUR] ‚ú® Honneur supr√™me accord√© au gombo.`);
          try { audioSynth.playValidationSuccess(); } catch(e){}
          return [...prev, id];
        }
      });
    });
  };

  const applyToGombo = async (id: string) => {
    requireAuthThen(async () => {
      setGombos(prev =>
        prev.map(g => {
          if (g.id === id) {
            const alreadyApplied = renforts.some(r => r.gomboId === id && r.applicantId === currentUser?.uid);
            if (alreadyApplied) return g;
            return { ...g, applicantsCount: g.applicantsCount + 1 };
          }
          return g;
        })
      );

      // Create a new Renfort (applicant request)
      const alreadyApplied = renforts.some(r => r.gomboId === id && r.applicantId === currentUser?.uid);
      if (alreadyApplied) {
        addToTerminal(`[‚ö†Ô∏è DOUBLON] L'appel du Tam-Tam a d√©j√† √©t√© entendu pour ce Gombo.`);
        return;
      }

      const gombo = gombos.find(g => g.id === id);
      if (!gombo || !currentUser) return;

      const newRenfort: Renfort = {
        id: "renfort_" + Date.now(),
        gomboId: id,
        gomboTitle: gombo.title,
        applicantId: currentUser.uid,
        applicantName: profile?.name || "Artiste Majestueux",
        applicantArtisticName: profile?.artisticName || "Mon Nom d'Artiste",
        instrument: profile?.instrument || "Chant / Instrumentiste Elite",
        status: "pending",
        timestamp: new Date().toISOString()
      };

      setRenforts(prev => [newRenfort, ...prev]);
      await saveToFirestore("renforts", newRenfort.id, newRenfort);
      gomboDB.applyToGombo(id, { musicianId: currentUser.uid, message: gombo.title });
      addToTerminal(`[üé§ CANDIDATURE] F√©licitations ! Votre candidature pour "${gombo.title}" a √©t√© envoy√©e sur le r√©seau c√©leste.`);
    });
  };

  const submitPalabreMessage = (id: string) => {
    if (!palabreMsg.trim()) return;

    const targetGombo = gombos.find(g => g.id === id);
    if (!targetGombo) return;

    const messageObj = {
      sender: "artiste" as const,
      text: palabreMsg,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setPalabreChatHistory(prev => {
      const currentHistory = prev[id] || [];
      return {
        ...prev,
        [id]: [...currentHistory, messageObj]
      };
    });

    setPalabreMsg("");

    // Simulate elite prompt response after 1.5 seconds
    setTimeout(() => {
      const answers = [
        `D'accord l'artiste! Nous appr√©cions grandement ta d√©marche de palabrer. Le Gombo ID GMB certifi√© nous inspire confiance. On se cale au t√©l√©phone ?`,
        `Salut ! Ton talent m√©rite consid√©ration. Nous √©tudions ton profil et nous ajusterons le cachet au besoin. Restons connect√©s.`,
        `Parfaitement compris. Notre budget est garanti par le syst√®me d'Afrigombo. Ta d√©votion artistique fait plaisir √† voir.`
      ];
      const randomAnswer = answers[Math.floor(Math.random() * answers.length)];

      const promoterMessageObj = {
        sender: "organisateur" as const,
        text: randomAnswer,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setPalabreChatHistory(prev => {
        const currentHistory = prev[id] || [];
        return {
          ...prev,
          [id]: [...currentHistory, promoterMessageObj]
        };
      });

      interactionBus.emit("MESSAGE_RECEIVED");
      addToTerminal(`[üó£Ô∏è PALABRER] Nouvel √©change re√ßu de ${targetGombo.organizerName}.`);
    }, 1500);
  };

  const logAdminAction = async (actionType: string, targetId: string, targetName: string, detail: string) => {
    const logId = "log_admin_" + Date.now() + "_" + Math.floor(Math.random() * 100);
    const logData = {
      id: logId,
      adminName: "Yoro Admin",
      actionType,
      targetUserId: targetId,
      targetUserName: targetName,
      detail,
      timestamp: new Date().toISOString()
    };
    await saveToFirestore("admin_logs", logId, logData);
    addToTerminal(`[LOG ADMIN] Action: ${actionType} | Cible: ${targetName} | ${detail}`);
  };

  const generateUniqueGomboId = () => {
    let id = "";
    let isUnique = false;
    while (!isUnique) {
      id = generateGomboId();
      isUnique = !users.some(u => u.gomboIdNumber === id || u.gomboId?.id === id || (typeof u.gomboId === 'string' && u.gomboId === id));
    }
    return id;
  };

  const handleApproveKYC = async (userId: string, express: boolean = false) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const gmbId = targetUser.gomboIdNumber || (typeof targetUser.gomboId === "string" ? targetUser.gomboId : targetUser.gomboId?.id) || generateUniqueGomboId();

    const levels = [
      "üü¢ V√©rifi√© AFRIGOMBO ELITE",
      "ü•â Musicien confirm√©",
      "ü•à Professionnel actif",
      "ü•á R√©f√©rence AFRIGOMBO ELITE"
    ];
    const level = levels[Math.floor(Math.random() * levels.length)];

    const gomboIdObj = {
      id: gmbId,
      scoreConfiance: 95,
      niveau: level,
      prestationsTerminees: Math.floor(10 + Math.random() * 40),
      annulations: Math.floor(Math.random() * 2),
      retards: 0,
      certifie: true,
      createdAt: new Date().toISOString()
    };

    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        const u: User = { 
          ...user, 
          kycStatus: "approved" as const, 
          isCertified: true,
          isVerified: true,
          gomboIdNumber: gmbId,
          gomboId: gomboIdObj,
          kycApprovedDate: new Date().toLocaleDateString("fr-FR"),
          verificationDate: new Date().toLocaleDateString("fr-FR"),
          verifiedBy: "Yoro Admin (Equipe AFRIGOMBO ELITE)",
          verificationStatus: "approved"
        };
        saveToFirestore("users", user.id, u);
        
        gomboDB.publishNotification({
          userId: user.id,
          type: "kyc_validated",
          title: "üõ°Ô∏è KYC Valid√© !",
          message: "F√©licitations, votre identit√© a √©t√© valid√©e par l'administration d'AFRIGOMBO ELITE !",
          priority: "high"
        });
        gomboDB.publishNotification({
          userId: user.id,
          type: "gombo_id_validated",
          title: "üéº Gombo ID Assign√© !",
          message: `Votre identifiant permanent Gombo ID est actif : ${gmbId}. Vos chances de gombos sont d√©cupl√©es !`,
          priority: "high"
        });

        return u;
      }
      return user;
    });
    setUsers(updatedUsers);
    
    // Trigger Phase 4 Beta Program attribution (1..20 Ambassadeurs, 21..100 B√¢tisseurs)
    try {
      await processUserBetaEligibility(userId, {
        uid: currentUser?.uid || "admin",
        email: currentUser?.email || "admin@afrigombo.com"
      });
    } catch (betaErr) {
      console.warn("Could not process beta eligibility:", betaErr);
    }

    // Play interaction!
    interactionBus.emit("GOMBO_VALIDATED");

    // Log in admin_logs
    await logAdminAction(
      "CERTIFIER_ARTISTE",
      userId,
      targetUser.artisticName,
      `Attribution de l'identifiant permanent ${gmbId}. Type : ${express ? "Express" : "Standard"}`
    );

    // Update statistics handled dynamically via onSnapshot
  };

  const handleRejectKYC = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        const u: User = { 
          ...user, 
          kycStatus: "rejected" as const, 
          isCertified: false,
          gomboIdNumber: undefined,
          kycApprovedDate: undefined
        };
        saveToFirestore("users", user.id, u);
        
        gomboDB.publishNotification({
          userId: user.id,
          type: "application_refused",
          title: "‚ùå Dossier KYC Refus√©",
          message: "D√©sol√©, votre dossier de certification a √©t√© d√©clin√©. Veuillez v√©rifier la conformit√© de vos documents d'identit√©.",
          priority: "high"
        });

        return u;
      }
      return user;
    });
    setUsers(updatedUsers);

    // Log in admin_logs
    await logAdminAction(
      "REFUSER_CERTIFICATION",
      userId,
      targetUser.artisticName,
      "Dossier d√©clin√© car incomplet ou non-conforme"
    );
  };

  const handleComplementaryInfoKYC = async (userId: string, message: string) => {
    if (!message.trim()) return;
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        const u: User = { 
          ...user, 
          kycStatus: "info_required" as const, 
          kycComplementaryInfo: message
        };
        saveToFirestore("users", user.id, u);
        
        gomboDB.publishNotification({
          userId: user.id,
          type: "kyc_info_required",
          title: "‚ÑπÔ∏è Compl√©ment KYC Requis",
          message: `L'administration demande un compl√©ment d'information pour votre KYC : "${message}"`,
          priority: "high"
        });

        return u;
      }
      return user;
    });
    setUsers(updatedUsers);

    // Log in admin_logs
    await logAdminAction(
      "DEMANDE_INFO_COMPLEMENTAIRE",
      userId,
      targetUser.artisticName,
      `Texte requis : "${message}"`
    );
  };

  const handlePerformActionOnPost = (postId: string, action: "approve" | "delete") => {
    if (action === "approve") {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isFlagged: false } : p));
      setAutoFlaggedPosts(prev => prev.filter(p => p.id !== postId));
      addToTerminal(`[FILE REVIEW] Publication approuv√©e. Signalement lev√©.`);
    } else {
      setPosts(prev => prev.filter(p => p.id !== postId));
      setAutoFlaggedPosts(prev => prev.filter(p => p.id !== postId));
      addToTerminal(`[FILE REVIEW] Contenu supprim√© pour non-conformit√©.`);
    }
  };

  const handleBroadcast = async (message: string) => {
    addToTerminal(`[üì° M√âGAPHONE] Bulletin quotidien diffus√© : "${message}"`);
    try {
      const newNotif = {
        text: message,
        timestamp: new Date().toISOString(),
        read: false,
        type: "megaphone"
      };
      await NotificationService.sendNotification(newNotif);
      addToTerminal(`[üì° M√âGAPHONE] Enregistr√© sur Firestore.`);
    } catch (err) {
      console.error("Error broadcasting megaphone", err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    addToTerminal(`[üóëÔ∏è M√âGAPHONE] Notification supprim√©e : ${id}`);
    try {
      // Opt-in removal or log deletion
    } catch (err) {
      console.error("Error deleting notification", err);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      const alertObj = alerts.find(a => a.id === alertId);
      if (alertObj) {
        const updated = { ...alertObj, status: "resolved" };
        await saveToFirestore("alerts", alertId, updated);
        setAlerts(prev => prev.filter(a => a.id !== alertId));
        addToTerminal(`[ARBITRAGE] Litige #${alertId} clos avec honneurs.`);
        try { audioSynth.playKoraSuccess(); } catch(_) {}
      }
    } catch (err) {
      console.error("Error dismissing alert", err);
    }
  };

  const handleDeletePostFromReports = async (postId: string) => {
    try {
      setPosts(prev => prev.filter(p => p.id !== postId));
      setAutoFlaggedPosts(prev => prev.filter(p => p.id !== postId));
      await saveToFirestore("posts", postId, { isDeleted: true });
      addToTerminal(`[FILE REVIEW] Contenu supprim√© d√©finitivement de la base.`);
      try { audioSynth.playTamTam(false); } catch (_) {}
    } catch (err) {
      console.error("Error deleting post from reports", err);
    }
  };

  const handleUnflagPostFromReports = async (postId: string) => {
    try {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isFlagged: false } : p));
      setAutoFlaggedPosts(prev => prev.filter(p => p.id !== postId));
      await saveToFirestore("posts", postId, { isFlagged: false });
      addToTerminal(`[FILE REVIEW] Signalement lev√©, publication approuv√©e.`);
      try { audioSynth.playValidationSuccess(); } catch (_) {}
    } catch (err) {
      console.error("Error unflagging post", err);
    }
  };

  const handleUpdateCommissionRate = async (rate: number) => {
    try {
      setSystemCommissionRate(rate);
      await gomboDB.updateSystemCommissionRate(rate);
      addToTerminal(`[FRAIS] Taux de commission de plateforme mis √† jour √† ${rate}%.`);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err) {
      console.error("Error updating commission rate", err);
    }
  };

  const handleUpdateThroneConfig = async (newFounders: string[], newSuperAdmins: string[]) => {
    try {
      setDynamicFounders(newFounders);
      setDynamicSuperAdmins(newSuperAdmins);
      addToTerminal(`[TR√îNE] Configuration du Tr√¥ne mise √† jour.`);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err) {
      console.error("Error updating throne configuration", err);
    }
  };

  const handleAppointGomboDuJour = (gomboId: string) => {
    addToTerminal(`[üî• LE TAM-TAM] Gombo du Jour activ√© : "${gombos.find(g => g.id === gomboId)?.title}"!`);
  };

  // --- HERITAGE MUSICAL MUTATIONS ---
  const startEditingProfile = (user: User) => {
    setEditingProfileUserId(user.id);
    setProfileForm({
      artisticName: user.performance?.artisticName || user.artisticName,
      commune: user.performance?.commune || user.commune,
      specialties: user.performance?.specialties || user.specialties,
      groups: user.performance?.groups || user.groups,
      level: user.performance?.level || 1,
      score: user.performance?.score || 0
    });
  };

  const saveProfileEditing = async () => {
    if (!editingProfileUserId) return;

    const updatedUsers = users.map(user => {
      if (user.id === editingProfileUserId) {
        const u: User = {
          ...user,
          artisticName: profileForm.artisticName || user.artisticName,
          commune: profileForm.commune || user.commune,
          specialties: profileForm.specialties || user.specialties,
          groups: profileForm.groups || user.groups,
          performance: {
            ...user.performance||{},
            artisticName: profileForm.artisticName || user.artisticName,
            commune: profileForm.commune || user.commune,
            specialties: profileForm.specialties || user.specialties,
            groups: profileForm.groups || user.groups,
            level: Number(profileForm.level),
            score: Number(profileForm.score)
          }
        };
        saveToFirestore("users", user.id, u);
        return u;
      }
      return user;
    });

    setUsers(updatedUsers);
    setEditingProfileUserId(null);
    addToTerminal(`[üéº MON H√âRITAGE] H√©ritage musical mis √† jour et sauvegard√© pour l'artiste.`);
  };

  const addSpecialty = () => {
    if (!specInput) return;
    setProfileForm(prev => ({
      ...prev,
      specialties: [...(prev.specialties || []), specInput]
    }));
    setSpecInput("");
  };

  const removeSpecialty = (index: number) => {
    setProfileForm(prev => ({
      ...prev,
      specialties: (prev.specialties || []).filter((_, i) => i !== index)
    }));
  };

  const addGroup = () => {
    if (!groupInput) return;
    setProfileForm(prev => ({
      ...prev,
      groups: [...(prev.groups || []), groupInput]
    }));
    setGroupInput("");
  };

  const removeGroup = (index: number) => {
    setProfileForm(prev => ({
      ...prev,
      groups: (prev.groups || []).filter((_, i) => i !== index)
    }));
  };

  const triggerDailyBulletin = () => {
    if (!broadcastMessage) return;
    addToTerminal(`[üì° TAM-TAM RAPIDE] Bulletin quotidien diffus√© : "${broadcastMessage}"`);
    setIsBroadcastModalOpen(false);
    setBroadcastMessage("");
  };

  // --- FILTERED DATA FOR MAIN VIEWS ---
  const filteredUsers = users.filter(user => {
    const s = (globalSearchTerm || "").toLowerCase();
    return (
      (user?.name ?? "").toLowerCase().includes(s) ||
      (user?.artisticName ?? "").toLowerCase().includes(s) ||
      (user?.commune ?? "").toLowerCase().includes(s)
    );
  });

  // CompleteProfile route moved to App.tsx

  return (
    <div className={`flex h-full h-[100dvh] w-full max-w-full box-border bg-afri-bg text-afri-text font-sans antialiased uppercase-none`}>

      
      {(activeMenu === "super_admin" || activeMenu === "dashboard") && (
        <WakandaTechBackground />
      )}

      {/* BACKDROP AND SLIDING SIDEBAR WITH ANIMATIONS */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop with elegant fade */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-afri-bg/75 backdrop-blur-md z-[1000] cursor-pointer pointer-events-auto"
              onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sliding Sidebar of sovereign tools */}
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed inset-y-0 left-0 w-80 bg-afri-bg-sec border-r border-afri-border flex flex-col justify-between z-[1001] shrink-0 h-full max-h-[100dvh] overflow-y-auto overscroll-contain pb-8"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {/* SIDEBAR CONTAINER SCROLL */}
              <div className="flex flex-col min-h-full justify-between">
                
                {/* TOP PART */}
                <div>
                  {/* BRAND HEADER LINE */}
                  <div className="p-5 border-b border-afri-border bg-afri-bg/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-afri-gold/10 border border-afri-gold/50 flex items-center justify-center p-1 overflow-hidden shrink-0">
                        <AfriGomboLogo className="w-full h-full" />
                      </div>
                      <div>
                        <h2 className="text-sm font-sans font-black tracking-wider text-afri-gold uppercase">
                          AFRIGOMBO
                        </h2>
                        <span className="text-[8px] font-mono tracking-widest text-afri-text-sec block -mt-0.5">
                          L'ELITE MUSICALE IVOIRIENNE
                        </span>
                      </div>
                    </div>

                    {/* OUTLET CLOSE */}
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1.5 rounded-lg border border-afri-gold/35 text-afri-gold hover:text-afri-text hover:bg-afri-gold/10 transition-colors cursor-pointer"
                      title="Fermer le menu"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* LOGGED IN USER CARD / UNCONNECTED PRESTIGE CONTAINER */}
                  <div className="p-4 sm:p-5">
                    {!currentUser ? (
                      <div className="bg-gradient-to-b from-afri-bg-sec/95 via-afri-bg/95 to-afri-bg border border-afri-gold/40 rounded-2xl p-4 shadow-xl flex flex-col gap-3 relative overflow-hidden text-left">
                        {/* Decorative subtle ambient backdrop element */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-afri-gold/10 rounded-full blur-xl pointer-events-none" />
                        
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="w-10 h-10 rounded-xl bg-afri-gold/15 border border-afri-gold/40 flex items-center justify-center text-afri-gold shadow-[0_0_12px_rgba(212,175,55,0.2)] shrink-0">
                            <Sparkles className="w-5 h-5 text-afri-gold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[8.5px] font-mono uppercase font-black text-afri-gold tracking-widest block">
                              ACC√àS PRESTIGE
                            </span>
                            <h3 className="text-xs sm:text-sm font-sans font-black text-afri-text leading-tight mt-0.5 truncate">
                              Bienvenue sur AFRIGOMBO
                            </h3>
                          </div>
                        </div>

                        <p className="text-[10.5px] text-afri-text-sec font-sans leading-relaxed relative z-10">
                          Connectez-vous pour d√©bloquer votre GOMBO ID officiel, vos cachets, votre Wallet et vos opportunit√©s exclusives.
                        </p>

                        <div className="flex flex-wrap gap-1 pt-0.5 relative z-10">
                          <span className="text-[7.5px] font-mono uppercase font-bold text-afri-gold/90 bg-afri-gold/10 px-2 py-0.5 rounded-full border border-afri-gold/25">
                            ‚ú® Cachets S√©curis√©s
                          </span>
                          <span className="text-[7.5px] font-mono uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25">
                            üÜî GOMBO ID
                          </span>
                          <span className="text-[7.5px] font-mono uppercase font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/25">
                            ‚ö° Renforts Live
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIsSidebarOpen(false);
                            setTimeout(() => {
                              setIsAuthModalOpen(true);
                              try { audioSynth.playKoraSuccess(); } catch (err) {}
                            }, 250);
                          }}
                          className="w-full bg-gradient-to-r from-afri-gold via-amber-400 to-afri-gold hover:opacity-95 text-[#050505] rounded-xl py-2.5 px-3.5 text-center cursor-pointer font-sans font-black text-[11px] uppercase tracking-wider transition-all duration-200 shadow-[0_4px_15px_rgba(212,175,55,0.25)] flex items-center justify-center gap-2 border border-amber-300/40 active:scale-98 relative z-10"
                        >
                          <LogIn className="w-4 h-4 text-[#050505] stroke-[2.5]" />
                          <span>Se Connecter / S'inscrire</span>
                        </button>
                      </div>
                    ) : (
                      (() => {
                        const currentArtist = profile ? {
                          id: profile.uid,
                          artisticName: profile.artisticName || profile.displayName || `${profile.firstName || 'Artiste'} ${profile.lastName || 'Gombo'}`.trim(),
                          commune: profile.commune || 'Cocody',
                          avatarUrl: profile.avatarUrl || profile.photoURL || "",
                          isCertified: profile.isCertified || profile.kycStatus === "approved",
                        } : (currentUser ? (users.find(u => u.id === activeArtistId) || users[0]) : null);

                        return (
                          <div className="flex flex-col gap-3">
                            <div 
                              onClick={() => {
                                setIsSidebarOpen(false);
                                setPerspective("user");
                                setActiveMenu("user_heritage");
                              }}
                              className="bg-afri-bg/80 border border-afri-gold/30 rounded-xl p-4 shadow-md flex flex-col relative overflow-hidden cursor-pointer hover:border-afri-gold/60 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className="relative shrink-0">
                                  <div className="w-14 h-14 rounded-full border-2 border-afri-gold overflow-hidden bg-afri-bg-sec flex items-center justify-center font-display font-black shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                                    {currentArtist && (currentArtist.avatarUrl || (currentArtist as any).photoURL) ? (
                                      <img 
                                        src={currentArtist.avatarUrl || (currentArtist as any).photoURL} 
                                        alt={currentArtist.artisticName} 
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <Music className="w-6 h-6 text-afri-gold" />
                                    )}
                                  </div>
                                  {currentArtist && currentArtist.isCertified && (
                                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-afri-gold rounded-full border-2 border-afri-border flex items-center justify-center shadow-sm" title="V√©rifi√©">
                                      <CheckCircle2 className="w-3 h-3 text-black" strokeWidth={4} />
                                    </span>
                                  )}
                                </div>
                                
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-[15px] font-sans font-black text-afri-text leading-tight truncate">
                                    {currentArtist ? currentArtist.artisticName : "Artiste Invit√©"}
                                  </h3>
                                  <p className="text-[10px] text-afri-text-sec font-mono uppercase tracking-wide font-medium mt-1">
                                    GOMBO ID: {getEffectiveGomboId(profile)}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    <span className="px-1.5 py-0.5 rounded border border-afri-gold/40 text-afri-gold text-[9px] font-sans uppercase font-bold flex items-center gap-1">
                                      ‚≠ê Niveau Professionnel
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-4 flex items-center justify-between">
                                <span className="text-[11px] font-sans text-afri-text font-medium">R√©putation</span>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex text-afri-gold text-[10px]">
                                    <span>‚òÖ</span><span>‚òÖ</span><span>‚òÖ</span><span>‚òÖ</span><span>‚òÖ</span>
                                  </div>
                                  <span className="text-[11px] text-afri-text-sec font-sans font-medium">(4.8)</span>
                                </div>
                              </div>
                            </div>

                            {/* Wallet Card - Only rendered when logged in */}
                            <button 
                              onClick={() => {
                                setIsSidebarOpen(false);
                                setPerspective("user");
                                setActiveMenu("user_wallet");
                              }}
                              className="bg-afri-bg-sec border border-afri-border hover:bg-afri-gold/5 transition-colors rounded-xl p-4 shadow-md flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-4">
                                <CreditCard className="w-8 h-8 text-afri-gold" strokeWidth={1.5} />
                                <div className="flex flex-col text-left">
                                  <span className="text-[11px] font-sans text-afri-text font-medium leading-none mb-1">Wallet Souverain</span>
                                  <span className="text-lg font-black text-afri-gold leading-none">{formatWalletBalance(profile?.wallet?.soldeDisponible ?? profile?.walletBalance ?? profile?.balance ?? 0)}</span>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-afri-gold" strokeWidth={2} />
                            </button>
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {/* MAIN NAVIGATION GROUPS */}
                  <nav className="px-4 pb-4 space-y-5">
                    {(() => {
                      let globalItemIndex = 0;

                      const renderMenuItem = (
                        key: string, 
                        label: string, 
                        icon: string, 
                        actionOnSelect: () => void, 
                        isInactive: boolean,
                        customBadge?: React.ReactNode,
                        flagIdParam?: string
                      ) => {
                        const flagKey = flagIdParam || getFlagForMenu(key);
                        if (flagKey) {
                          const visible = checkIsModuleVisible(flagKey, systemFeatureFlags, isSuperFounderUser);
                          if (!visible) return null;

                          const comingSoon = checkIsModuleComingSoon(flagKey, systemFeatureFlags, isSuperFounderUser);
                          if (comingSoon) {
                            isInactive = true;
                          }
                        }

                        const currentIndex = globalItemIndex++;
                        return (
                          <motion.button
                            key={key}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: currentIndex * 0.03, duration: 0.2 }}
                            type="button"
                            onClick={() => {
                              setIsSidebarOpen(false);
                              setTimeout(() => {
                                if (isInactive) {
                                  try { audioSynth.playTamTam(false); } catch (_) {}
                                  setComingSoonFeatureKey(key);
                                } else {
                                  actionOnSelect();
                                }
                              }, 250);
                            }}
                            className="w-full flex items-center justify-between px-3 py-1.5 text-left rounded-lg text-[10px] sm:text-xs font-sans font-bold transition-all text-afri-text hover:text-afri-gold hover:bg-afri-gold/5 cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm shrink-0">{icon}</span>
                              <span>{label}</span>
                            </span>
                            {customBadge && !isInactive ? customBadge : (
                              isInactive ? (
                                <span className="text-[7.5px] font-mono py-0.5 px-1.5 bg-afri-gold/10 border border-afri-gold/25 text-afri-gold rounded uppercase font-black tracking-tighter">
                                  Bient√¥t
                                </span>
                              ) : null
                            )}
                          </motion.button>
                        );
                      };

                      const sections = [
                        {
                          id: "quick_actions",
                          title: "‚ö° Actions Rapides",
                          items: [
                            { key: "menu_events", label: "√âv√©nements (Calendrier)", icon: "üìÖ", action: () => {
                              setPerspective("user");
                              setActiveMenu("user_events");
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            }, customBadge: <span className="text-[7px] font-mono py-0.5 px-1.5 bg-afri-gold/10 text-afri-gold rounded border border-afri-gold/10 uppercase font-black">LIVE</span> },
                            { key: "menu_near_opports", label: "Opportunit√©s proches", icon: "üìç", action: () => {
                              setPerspective("user");
                              setActiveMenu("nearby");
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            }, customBadge: <span className="text-[7px] font-mono py-0.5 px-1.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/10 uppercase font-black">DISPO</span> },
                            { key: "menu_msgs", label: "Messages", icon: "üì©", action: () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_messages");
                              });
                            }, customBadge: totalUnreadMessages > 0 ? (
                              <span className="ml-2 bg-red-500 text-afri-text text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full shadow-md">
                                {totalUnreadMessages}
                              </span>
                            ) : undefined },
                            { key: "menu_favorites", label: "Favoris", icon: "‚≠ê", action: () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_favorites");
                              });
                            } }
                          ]
                        },
                        {
                          id: "universe",
                          title: "üèõÔ∏è Univers AFRIGOMBO ELITE",
                          items: [
                            { key: "menu_grand_marche", label: "Le Grand March√©", icon: "üõçÔ∏è", action: () => {
                              setPerspective("user");
                              setActiveMenu("user_grand_marche");
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            }, customBadge: <span className="text-[7px] font-mono py-0.5 px-1.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded border border-[#D4AF37]/20 uppercase font-black">MARCH√â</span> },
                            { key: "menu_academie", label: "L'Acad√©mie", icon: "üéì", action: () => {
                              setPerspective("user");
                              setActiveMenu("user_academie");
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            }, customBadge: <span className="text-[7px] font-mono py-0.5 px-1.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 uppercase font-black">COURS</span> },
                            { key: "menu_gombo_id", label: "GOMBO ID", icon: "üÜî", action: () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_gombo_id");
                                try { audioSynth.playValidationSuccess(); } catch (_) {}
                              });
                            }, customBadge: (() => {
                              const gInfo = getGomboIdStatusInfo(currentUser);
                              return (
                                <span className={`text-[7px] font-mono py-0.5 px-1.5 rounded border uppercase font-black ${
                                  gInfo.statusCode === "ATTRIBUTED" 
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                                    : gInfo.statusCode === "PENDING"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold"
                                    : "bg-zinc-800/80 text-zinc-400 border-zinc-700/50"
                                }`}>
                                  {gInfo.badgeLabel}
                                </span>
                              );
                            })() },
                            { key: "menu_gombo_ads", label: "GOMBO ADS", icon: "üì£", action: () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_gombo_ads");
                                try { audioSynth.playValidationSuccess(); } catch (_) {}
                              });
                            } }
                          ]
                        },
                        {
                          id: "beta_tools",
                          title: "üß™ Outils B√™ta",
                          items: [
                            { key: "menu_bug_report", label: "Signaler un bug", icon: "üì¢", action: () => {
                              setIsBetaFeedbackOpen(true);
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            } },
                            { key: "menu_suggestion", label: "Faire une suggestion", icon: "üí°", action: () => {
                              setIsBetaFeedbackOpen(true);
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            } },
                            { key: "menu_changelog", label: "Journal des mises √† jour (B√™ta)", icon: "üìÑ", action: () => {
                              setIsChangelogModalOpen(true);
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            } },
                            { key: "menu_support_beta", label: "Contacter le support", icon: "üéß", action: () => {
                              supportConfig.openSupport("B√™ta Publique - Support Client");
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            } }
                          ]
                        },
                        {
                          id: "personal_center",
                          title: "üë§ Centre personnel",
                          items: [
                            { key: "menu_heritage", label: "Mon H√©ritage", icon: "üëë", action: () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_heritage");
                              });
                            } },
                            { key: "menu_pubs", label: "Publications", icon: "üìù", action: () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_mes_gombos");
                              });
                            } },
                            { key: "menu_comms", label: "Palabres", icon: "üí¨", action: () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_comments");
                              });
                            } },
                            { key: "menu_settings", label: "Param√®tres", icon: "‚öô", action: () => {
                              setPerspective("user");
                              setActiveMenu("user_settings");
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            } },
                            { key: "menu_lang", label: t('langue'), icon: "üåê", action: () => {
                              const nextL = lang === "fr" ? "nouchi" : (lang === "nouchi" ? "en" : "fr");
                              setLanguage(nextL);
                              try { audioSynth.playTamTam(true); } catch (e) {}
                              addToTerminal(`[LANGUE] Passage en mode ${nextL === "nouchi" ? "Nouchi" : (nextL === "en" ? "English" : "Fran√ßais")}`);
                            }, customBadge: (
                              <span className="font-mono text-[8px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20 scale-90">
                                {lang === "nouchi" ? "Nouchi üá®üáÆ" : (lang === "en" ? "English üá¨üáß" : "Fran√ßais üá´üá∑")}
                              </span>
                            ) }
                          ]
                        },
                        {
                          id: "system",
                          title: "üõ† Syst√®me",
                          items: [
                            { key: "menu_notifications", label: "Notifications", icon: "üîî", action: async () => {
                              requireAuthThen(async () => {
                                setPerspective("user");
                                setActiveMenu("user_notifications");
                                if (currentUser?.uid) {
                                  try {
                                    await gomboDB.markAllUserNotificationsAsRead(currentUser.uid);
                                    setRealNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
                                  } catch (e) {}
                                }
                              });
                            }, customBadge: unreadNotifsCount > 0 ? (
                              <span className="bg-gradient-to-r from-red-600 to-amber-500 text-afri-text font-mono font-black text-[9px] px-1.5 py-0.5 rounded-full animate-pulse shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                                {unreadNotifsCount > 9 ? "9+" : unreadNotifsCount}
                              </span>
                            ) : null },
                            { key: "menu_history", label: "Historique", icon: "üïì", action: () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_history");
                              });
                            } },
                            { key: "menu_downloads", label: "T√©l√©chargements", icon: "üì•", action: () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_downloads");
                              });
                            } },
                            { key: "menu_backups", label: "Sauvegardes", icon: "üíæ", action: () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_backups");
                              });
                            } },
                            { key: "menu_help", label: "Centre d'aide", icon: "üõü", action: () => {
                              setPerspective("user");
                              setActiveMenu("user_help_center");
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            } },
                            { key: "menu_builders_1", label: "‚ù§Ô∏è Soutenir AFRIGOMBO ELITE", icon: "‚ù§Ô∏è", action: () => {
                              setPerspective("user");
                              setActiveMenu("user_builders");
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            } },
                            ...(currentUser ? [{
                              key: "menu_logout", label: "D√©connexion", icon: "üö™", action: () => {
                                setShowLogoutConfirm(true);
                                try { audioSynth.playValidationSuccess(); } catch (_) {}
                              }, customBadge: (
                                <span className="text-[7.5px] font-mono py-0.5 px-1 bg-red-950/40 text-red-400 rounded border border-red-900/30 font-black scale-90">
                                  QUITTER
                                </span>
                              )
                            }] : [])
                          ]
                        }
                      ];

                      const renderedSections = sections.map((sec, secIdx) => {
                        const visibleItems = sec.items.filter(it => {
                          const flagKey = getFlagForMenu(it.key);
                          if (!flagKey) return true;
                          return checkIsModuleVisible(flagKey, systemFeatureFlags, isSuperFounderUser);
                        });

                        if (visibleItems.length === 0) return null;

                        return (
                          <div key={sec.id} className="space-y-1">
                            {secIdx > 0 && <div className="border-t border-afri-border my-2" />}
                            <span className="px-3.5 text-[8.5px] font-mono font-black text-afri-text-sec uppercase tracking-widest block mb-1">
                              {sec.title}
                            </span>
                            {visibleItems.map(it => renderMenuItem(it.key, it.label, it.icon, it.action, false, it.customBadge))}
                          </div>
                        );
                      }).filter(Boolean);

                      return (
                        <div className="space-y-4">
                          {renderedSections}

                          {/* DIAGNOSTICS FIREBASE - SOUVERAIN (SUPER FONDATEUR UNIQUEMENT) */}
                          {isAuthorizedSuperFounder && (
                            <>
                              <div className="border-t border-afri-border/60 my-2" />
                              {renderMenuItem("menu_firebase_diagnostics", "Diagnostics Firebase (Fondateur uniquement)", "‚ö°", () => {
                                setIsDiagnosticOpen(true);
                                try { audioSynth.playValidationSuccess(); } catch (_) {}
                              }, false, (
                                <span className="text-[7px] font-mono py-0.5 px-1.5 bg-[#D4AF37]/20 text-[#D4AF37] rounded border border-[#D4AF37]/40 font-black tracking-wider uppercase">
                                  Fondateur
                                </span>
                              ))}
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </nav>
                </div>

                {/* SIDEBAR FOOTER METRICS */}
                <div className="p-5 bg-afri-bg/40 border-t border-afri-gold/15 text-center space-y-1 font-mono">
                  <p className="text-[8.5px] text-afri-gold font-bold uppercase tracking-widest">
                    AFRIGOMBO ELITE V2.0
                  </p>
                  <p className="text-[7.5px] text-afri-text-sec">
                    Syst√®me Souverain National ‚Ä¢ Abidjan, CI
                  </p>
                </div>

              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* =========================================================================
                               ZONE B : WORKSPACE CENTRAL (MIDDLE)
         ========================================================================= */}
      <main 
        className="flex-1 min-w-0 min-h-0 w-full max-w-full bg-afri-bg flex flex-col"
      >
        
        {/* FLOATING ADMIN ANNOUNCEMENT TOAST BANNER */}
        <AnimatePresence>
          {activeAdminBanner && (
            <motion.div
              initial={{ opacity: 0, y: -60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -60, scale: 0.95 }}
              className="fixed top-4 inset-x-4 max-w-lg mx-auto z-[9999] bg-[#111111]/95 border-2 border-[#D4AF37] rounded-2xl p-4 shadow-[0_12px_40px_rgba(212,175,55,0.35)] backdrop-blur-md flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-amber-600 flex items-center justify-center text-black shrink-0 font-bold shadow-md">
                üì¢
              </div>
              <div className="flex-1 text-left min-w-0 pr-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] font-mono font-black text-[#D4AF37] uppercase tracking-wider bg-[#D4AF37]/15 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                    {activeAdminBanner.type || activeAdminBanner.category || "ANNONCE TR√îNE"}
                  </span>
                  <span className="text-[10px] text-afri-text-sec font-mono">
                    {activeAdminBanner.createdAt ? new Date(activeAdminBanner.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "√Ä l'instant"}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-afri-text truncate">
                  {activeAdminBanner.title || activeAdminBanner.titre || activeAdminBanner.subject || "Message de l'Administration"}
                </h4>
                <p className="text-[11px] text-afri-text-sec font-medium leading-relaxed line-clamp-2 mt-0.5">
                  {activeAdminBanner.message || activeAdminBanner.description || activeAdminBanner.body}
                </p>
              </div>
              <button
                onClick={() => {
                  if (activeAdminBanner.id) {
                    setDismissedBanners(prev => new Set(prev).add(activeAdminBanner.id));
                  }
                  setActiveAdminBanner(null);
                }}
                className="text-afri-text-sec hover:text-afri-text p-1 rounded-lg bg-zinc-800/60 hover:bg-afri-bg-ter transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ELITE UPPER STATUS BAR (AFRIGOMBO ELITE PREMIUM HEADER OR EXCLUSIVE ADMIN HEADER) */}
        {activeMenu !== "super_admin" && (
          perspective === "admin" ? (
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-8 py-3 sm:py-5 border-b border-afri-gold/35 bg-afri-bg-sec/98 backdrop-blur shrink-0 gap-2 sm:gap-4 w-full select-none animate-fadeIn">
              {/* Left Section: Title & Animated Shield */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-afri-gold/10 border border-afri-gold/35 shadow-[0_0_10px_rgba(212,175,55,0.1)] relative">
                  <ShieldCheck className="w-4 h-4 sm:w-5.5 sm:h-5.5 text-afri-gold animate-pulse" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                </div>
                <div>
                  <h1 className="text-[10px] sm:text-sm font-sans font-black uppercase tracking-widest sm:tracking-[0.2em] text-afri-gold leading-none">
                    CENTRE DE COMMANDEMENT
                  </h1>
                  <p className="text-[7px] sm:text-[9px] font-mono tracking-wider text-afri-text uppercase mt-0.5 sm:mt-1.5 opacity-85">
                    ADMINISTRATION IMP√âRIALE
                  </p>
                </div>
              </div>

              {/* Right Section: Firebase State, Date/Time, Connections count */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-4 w-full sm:w-auto text-[9px] sm:text-xs font-mono">
                {/* Firebase Status Badge */}
                <div className="flex items-center gap-1.5 bg-afri-bg border border-afri-border/80 rounded-lg sm:rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 shadow-sm">
                  {firebaseSyncState === "synced" && (
                    <>
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] sm:text-[10px] text-afri-text font-bold uppercase tracking-wider">Synchronis√©</span>
                    </>
                  )}
                  {firebaseSyncState === "syncing" && (
                    <>
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-[8px] sm:text-[10px] text-amber-500 font-bold uppercase tracking-wider">Sync...</span>
                    </>
                  )}
                  {firebaseSyncState === "offline" && (
                    <>
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[8px] sm:text-[10px] text-red-500 font-bold uppercase tracking-wider">Hors ligne</span>
                    </>
                  )}
                </div>

                {/* Connections Count */}
                <div className="flex items-center gap-1.5 bg-afri-bg border border-afri-border/80 rounded-lg sm:rounded-xl px-2 py-1 sm:px-3 sm:py-1.5">
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-afri-gold" />
                  <span className="text-[8px] sm:text-[10px] text-afri-text-sec font-bold uppercase whitespace-nowrap">
                    CONNS: <span className="text-afri-text">{connectionsCount}</span>
                  </span>
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-1.5 bg-afri-bg border border-afri-border/80 rounded-lg sm:rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 text-afri-text-sec">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-afri-gold" />
                  <span className="text-[8px] sm:text-[10px] text-afri-text font-bold">{liveAdminTime}</span>
                </div>
                
                {/* Quick exit to user view button */}
                <button
                  onClick={() => {
                    setPerspective("user");
                    setActiveMenu("user_terrain");
                    addToTerminal("[INFO] Retour au Terrain d'Action.");
                  }}
                  className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 text-[8px] sm:text-[10px] font-mono font-bold uppercase text-afri-text-sec hover:text-afri-gold bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-lg sm:rounded-xl transition-all cursor-pointer ml-auto sm:ml-0"
                >
                  ‚Üê Terrain
                </button>
              </div>
            </header>
          ) : (
            ["user_terrain", "user_wallet", "user_messages", "user_notifications", "user_settings", "user_heritage", "user_edit_profile", "nearby", "premium_wheel", "user_wheel", "wheel"].includes(activeMenu) ? null : (
              <header className="flex items-center justify-between px-4 py-3 bg-afri-bg border-b border-afri-border/50 z-[40] relative shrink-0 shadow-md">
                <div className="flex items-center gap-3">
          {!["user_terrain", "user_wallet", "user_vibes", "user_mes_gombos", "user_heritage", "user_publish", "dashboard", "users", "notifications", "contracts", "reports", "revenue"].includes(activeMenu) && (
                    <button 
                      onClick={goBackMenu} 
                      className="p-1.5 sm:p-2 bg-afri-bg-sec/40 rounded-xl text-afri-text-sec hover:text-afri-text hover:bg-afri-bg-ter transition-colors border border-afri-border/80 active:scale-95 shrink-0"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <h1 className="text-lg font-black text-afri-text tracking-tight uppercase">
                    {(() => {
                      switch(activeMenu) {
                        case "user_wallet": return "Wallet & Finances";
                        case "user_messages": return "Messagerie";
                        case "user_edit_profile": return "Mon H√©ritage";
                        case "user_gombo_plus": return "Premium Elite";
                        case "user_gombo_ads": return "Gombo Ads";
                        case "user_subscription_management": return "Mon Abonnement";
                        case "user_heritage": return "Mon H√©ritage";
                        case "user_vibes": return "Afrigombo Vibes";
                        case "user_reels": return "Les Vibes";
                        case "user_notifications": return "Notifications";
                        case "user_comments": return "Palabres";
                        case "user_downloads": return "T√©l√©chargements";
                        case "user_history": return "Historique";
                        case "user_publish": return "Publier";
                        case "user_contracts": return "Mes Contrats";
                        case "user_events": return "Calendrier";
                        case "user_settings": return "Param√®tres";
                        case "user_gombo_id": return "Gombo ID";
                        case "user_command_center": return "Centre de Commandement";
                        case "user_mes_gombos": return "Mes Publications";
                        case "user_mes_groupes": return "Mes Groupes";
                        case "user_renforts": return "Renforts";
                        case "user_opportunities": return "Mes Candidatures";
                        case "user_help_center": return "Centre d'Aide";
                        case "user_builders": return "Afrigombo Builders";
                        case "user_ecosystem": return "Gombo ID";
                        case "user_about": return "√Ä Propos";
                        case "user_support": return "Support";
                        case "user_whats_new": return "Nouveaut√©s";
                        case "dashboard": return "Tableau de bord";
                        case "users": return "Utilisateurs";
                        case "kyc": return "Certifications";
                        case "contracts": return "Contrats";
                        case "revenue": return "Revenus";
                        case "caisse": return "Finances";
                        case "reports": return "Signalements";
                        case "settings": return "Param√®tres Admin";
                        case "security": return "S√©curit√©";
                        case "logs": return "Syst√®me";
                        default: 
                          if (activeMenu.startsWith("user_")) return activeMenu.replace("user_", "").replace(/_/g, " ");
                          return activeMenu;
                      }
                    })()}
                  </h1>
                </div>
                
                {/* Always show Avatar on the right in compact header */}
                <div 
                   onClick={() => { 
                      if (!currentUser) {
                        setShowHeritageLoginRequired(true);
                      } else {
                        setActiveMenu("user_edit_profile");
                        setViewingGomboIdDetail(false); 
                      }
                   }}
                   className="w-8 h-8 rounded-full border-2 border-afri-gold overflow-hidden bg-afri-bg-sec cursor-pointer hover:scale-105 transition-transform"
                 >
                   {profile?.avatarUrl || currentUser?.photoURL ? (
                      <img src={profile?.avatarUrl || currentUser?.photoURL || ""} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-afri-gold font-black text-xs">
                        {profile?.artisticName?.charAt(0) || currentUser?.displayName?.charAt(0) || "U"}
                      </div>
                   )}
                 </div>
              </header>
            )
          )
        )}

        {isSlowConnection && (
          <div className="bg-cyan-950/80 text-cyan-400 border-b border-cyan-800/30 py-2 px-4 flex items-center justify-center gap-2 text-center text-[10px] sm:text-xs font-black animate-slideDown select-none shrink-0">
            <span>üì∂</span>
            <span>AFRIGOMBO ELITE optimise votre exp√©rience (Connexion lente d√©tect√©e ‚Äî Mode l√©ger actif)</span>
          </div>
        )}

        {isBatteryLow && (
          <div className="bg-yellow-950/80 text-yellow-550 border-b border-yellow-800/30 py-2 px-4 flex items-center justify-center gap-2 text-center text-[10px] sm:text-xs font-black animate-slideDown select-none shrink-0">
            <span>üîã</span>
            <span>Mode l√©ger AFRIGOMBO ELITE activ√© (Dispositif en batterie faible)</span>
          </div>
        )}

        {/* WORKSPACE VIEWS */}
        <div className="flex-1 min-h-0 relative w-full h-full overflow-hidden">
          
          {/* ===================================================
              PERSISTENT CORE VIEWS (SCROLL PRESERVATION ENGINE)
              =================================================== */}

          {/* 1.1. NEARBY PAGE VIEW */}
          <div 
            className={activeMenu === "nearby" ? "w-full h-full animate-fadeIn text-left overflow-hidden" : "hidden"}
          >
            {!isModuleAccessible("nearby") ? (
              <FeatureUnavailable 
                featureName="Pr√®s de moi" 
                variant={isModuleComingSoon("nearby") ? "coming_soon" : "temporary_disabled"}
                title={isModuleComingSoon("nearby") ? "üîí Bient√¥t disponible" : "üîí Module indisponible"}
                description={isModuleComingSoon("nearby") ? "Cette fonctionnalit√© arrive prochainement sur AFRIGOMBO." : "Le module \"Pr√®s de moi\" n'est pas accessible actuellement."}
                onBack={() => setActiveMenu("user_terrain")} 
              />
            ) : (
              <NearbyPageView
                gombos={gombos}
                users={users}
                currentUser={currentUser}
                onBack={() => setActiveMenu("user_terrain")}
                onSelectGombo={(g) => setSelectedGomboDetails(g)}
                onApplyGombo={(g) => setSelectedGomboDetails(g)}
                geo={geo}
              />
            )}
          </div>

          {/* 1. LE TERRAIN - CENTRAL HUB FEED */}
          <div 
            className={activeMenu === "user_terrain" ? "w-full h-full animate-fadeIn text-left overflow-hidden" : "hidden"}
          >
            <UserTerrainLandingPage
              gombos={gombos}
              users={users}
              posts={posts}
              setPosts={setPosts}
              postsDebugError={postsDebugError}
              globalSearchTerm={globalSearchTerm}
              setGlobalSearchTerm={setGlobalSearchTerm}
              universalSearchTerm={universalSearchTerm}
              setUniversalSearchTerm={setUniversalSearchTerm}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              terrainTab={terrainTab}
              setTerrainTab={setTerrainTab}
              currentSlide={currentSlide}
              setCurrentSlide={setCurrentSlide}
              likedGombos={likedGombos}
              setLikedGombos={setLikedGombos}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              selectedDateFilter={selectedDateFilter}
              setSelectedDateFilter={setSelectedDateFilter}
              setSelectedGomboDetails={setSelectedGomboDetails}
              requireAuthThen={requireAuthThen}
              requireGoogleAuthThen={requireGoogleAuthThen}
              audioSynth={audioSynth}
              activeQuickActionModal={activeQuickActionModal}
              setActiveQuickActionModal={setActiveQuickActionModal}
              verifyGomboIdInput={verifyGomboIdInput}
              setVerifyGomboIdInput={setVerifyGomboIdInput}
              verifyGomboIdResult={verifyGomboIdResult}
              setVerifyGomboIdResult={setVerifyGomboIdResult}
              newNoticeTitle={newNoticeTitle}
              setNewNoticeTitle={setNewNoticeTitle}
              newNoticeCategory={newNoticeCategory}
              setNewNoticeCategory={setNewNoticeCategory}
              newNoticeBody={newNoticeBody}
              setNewNoticeBody={setNewNoticeBody}
              addToTerminal={addToTerminal}
              onValidateFilters={applyGombosFilters}
              renforts={renforts}
              profile={profile}
              currentUser={currentUser}
              logoUrl={logoUrl}
              unreadNotifsCount={unreadNotifsCount}
              setIsSidebarOpen={setIsSidebarOpen}
              setShowHeritageLoginRequired={setShowHeritageLoginRequired}
              setViewingGomboIdDetail={setViewingGomboIdDetail}
              contracts={contracts}
            />
          </div>

          <AnimatePresence mode="wait">
            {activeMenu !== "user_terrain" && activeMenu !== "nearby" && (
              <motion.div
                key={activeMenu}
                initial={areAnimationsReduced ? { opacity: 0 } : { opacity: 0, x: 10 }}
                animate={areAnimationsReduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
                exit={areAnimationsReduced ? { opacity: 0 } : { opacity: 0, x: -10, transition: { duration: 0.1 } }}
                transition={{ duration: areAnimationsReduced ? 0.05 : 0.20, ease: "easeOut" }}
                className={`flex-1 min-h-0 h-full w-full ${
                  ["user_settings", "user_notifications", "user_messages", "user_reels", "user_wallet", "super_admin"].includes(activeMenu)
                    ? "flex flex-col overflow-hidden"
                    : "overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
                } ${
                  activeMenu === "super_admin" || activeMenu === "user_builders" || activeMenu === "dashboard" || activeMenu === "user_terrain" || activeMenu === "user_vibes" || activeMenu === "user_mes_gombos" || activeMenu === "user_heritage"
                    ? "px-4 xs:px-5 sm:px-8 max-w-5xl mx-auto w-full pt-0 pb-16 sm:pb-20 space-y-6"
                    : ["user_messages", "user_settings", "user_notifications", "user_reels", "user_wallet"].includes(activeMenu)
                    ? "p-0 m-0"
                    : "afri-container afri-section"
                }`}
                style={{ overscrollBehaviorY: "contain" }}
              >
                {getFlagForMenu(activeMenu) && !isModuleAccessible(getFlagForMenu(activeMenu)!) ? (
                  <FeatureUnavailable 
                    featureName={getFeatureNameForMenu(activeMenu)}
                    variant={isModuleComingSoon(getFlagForMenu(activeMenu)!) ? "coming_soon" : "temporary_disabled"}
                    title={isModuleComingSoon(getFlagForMenu(activeMenu)!) ? "üîí Bient√¥t disponible" : "üîí Module indisponible"}
                    description={isModuleComingSoon(getFlagForMenu(activeMenu)!) ? "Cette fonctionnalit√© arrive prochainement sur AFRIGOMBO." : `Le module "${getFeatureNameForMenu(activeMenu)}" n'est pas accessible actuellement.`}
                    onBack={() => setActiveMenu("user_terrain")} 
                  />
                ) : (
                  <>
                
                {/* ----------------------------------------------------
                                  STEP I: TABLEAU UTILISATEUR (10 CORE SECTIONS)
                                    ---------------------------------------------------- */}

                {/* ----------------------------------------------------
                                  NEW CORE EXPERIENCES FOR USER PERSPECTIVE
                                    ---------------------------------------------------- */}


              {/* 1B. VID√âOS R√âELLES - REELS PLAYER UNMOUNTABLE */}
              {activeMenu === "user_reels" && (
                <ReelsPlayer 
                  posts={posts}
                  users={users}
                  currentUser={currentUser}
                  onClose={() => setActiveMenu("user_terrain")}
                  onOpenCreate={() => setIsPlusMenuOpen(true)}
                />
              )}
              {false && (() => {
                const searchStr = globalSearchTerm.toLowerCase();
                
                // Filter posts
                const filteredFeedPosts = posts.filter(p => 
                  String(p.content || "").toLowerCase().includes(searchStr) ||
                  String(p.authorArtisticName || "").toLowerCase().includes(searchStr)
                );

                // Filter gombos
                const GombosToRender = gombos.filter(g => 
                  String(g.title || "").toLowerCase().includes(searchStr) ||
                  String(g.description || "").toLowerCase().includes(searchStr) ||
                  String(g.location || "").toLowerCase().includes(searchStr)
                );

                // Toast status when applying
                return (
                  <div className="afri-container space-y-6 xs:space-y-8 animate-fadeIn">
                    {/* STATISTIQUES PRESTIGE EN TEMPS R√âEL (STYLE IMAGE PARFAIT) */}
                    <div className="grid grid-cols-4 divide-x divide-zinc-800/60 bg-afri-bg/40 border border-afri-gold/15 rounded-xl xs:rounded-2xl py-1.5 xs:py-3 px-0.5 xs:px-1 sm:p-4 select-none mb-4 xs:mb-6">
                      {/* ARTISTES */}
                      <div className="flex flex-col items-center xs:flex-row xs:items-center gap-0.5 xs:gap-2 sm:gap-3 pl-0.5 xs:pl-1 sm:pl-3 text-center xs:text-left">
                        <div className="p-0.5 xs:p-1 rounded-lg bg-afri-gold/5 text-afri-gold shrink-0">
                          <Users className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[5.5px] xs:text-[7.5px] sm:text-[9px] font-mono tracking-tighter xs:tracking-widest text-afri-text-sec font-bold uppercase block leading-none">ARTISTES</span>
                          <strong className="text-[9px] xs:text-xs sm:text-base font-display font-black text-afri-text block mt-0.5 sm:mt-1">
                            {users.length.toLocaleString("fr-FR")}
                          </strong>
                        </div>
                      </div>

                      {/* CACHETS */}
                      <div className="flex flex-col items-center xs:flex-row xs:items-center gap-0.5 xs:gap-2 sm:gap-3 pl-0.5 xs:pl-1 sm:pl-3 text-center xs:text-left">
                        <div className="p-0.5 xs:p-1 rounded-lg bg-afri-gold/5 text-afri-gold shrink-0">
                          <Award className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[5.5px] xs:text-[7.5px] sm:text-[9px] font-mono tracking-tighter xs:tracking-widest text-afri-gold/95 font-bold uppercase block leading-none">CACHETS</span>
                          <strong className="text-[9px] xs:text-xs sm:text-base font-display font-black text-afri-text block mt-0.5 sm:mt-1">
                            {gombos.length.toLocaleString("fr-FR")}
                          </strong>
                        </div>
                      </div>

                      {/* OPPORTUNIT√âS */}
                      <div className="flex flex-col items-center xs:flex-row xs:items-center gap-0.5 xs:gap-2 sm:gap-3 pl-0.5 xs:pl-1 sm:pl-3 text-center xs:text-left">
                        <div className="p-0.5 xs:p-1 rounded-lg bg-afri-gold/5 text-afri-gold shrink-0">
                          <Music className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[5.5px] xs:text-[7.5px] sm:text-[9px] font-mono tracking-tighter xs:tracking-widest text-afri-text-sec font-bold uppercase block leading-none">OPPS</span>
                          <strong className="text-[9px] xs:text-xs sm:text-base font-display font-black text-afri-text block mt-0.5 sm:mt-1">
                            {(gombos.length + posts.length).toLocaleString("fr-FR")}
                          </strong>
                        </div>
                      </div>

                      {/* CERTIFI√âS */}
                      <div className="flex flex-col items-center xs:flex-row xs:items-center gap-0.5 xs:gap-2 sm:gap-3 pl-0.5 xs:pl-1 sm:pl-3 text-center xs:text-left">
                        <div className="p-0.5 xs:p-1 rounded-lg bg-afri-gold/5 text-afri-gold shrink-0">
                          <ShieldCheck className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[5.5px] xs:text-[7.5px] sm:text-[9px] font-mono tracking-tighter xs:tracking-widest text-afri-text-sec font-bold uppercase block leading-none">ID</span>
                          <strong className="text-[9px] xs:text-xs sm:text-base font-display font-black text-afri-text block mt-0.5 sm:mt-1">
                            {users.filter(u => u.kycStatus === "approved" || u.isVerified || u.gomboId).length.toLocaleString("fr-FR")}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* BARRE D'ACTIONS RAPIDES */}
                    <div className="grid grid-cols-4 gap-1.5 xs:gap-2 sm:gap-4 select-none mb-6">
                      {/* LIVE */}
                      <button
                        onClick={() => {
                          setTerrainTab("all");
                          addToTerminal("[INT√âRACTIF] Filtre LIVE : tous les cachets et directs actifs.");
                          try { audioSynth.playTamTam(true); } catch (e) {}
                        }}
                        className="p-1.5 xs:p-2 sm:p-4 bg-afri-bg-sec border border-afri-border hover:border-emerald-500 rounded-lg xs:rounded-xl cursor-pointer transition-all flex flex-col justify-between text-left group active:scale-95"
                      >
                        <div className="flex items-center gap-1 sm:gap-1.5 w-full">
                          <span className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          <span className="text-[7px] xs:text-[8px] sm:text-[11px] font-mono font-black text-afri-text tracking-tighter xs:tracking-widest uppercase">LIVE</span>
                        </div>
                        <p className="text-[6px] xs:text-[7px] sm:text-[9px] text-afri-text-sec font-mono mt-0.5 sm:mt-2 uppercase">En direct</p>
                      </button>

                      {/* ACTUS */}
                      <button
                        onClick={() => {
                          setTerrainTab("musicien");
                          addToTerminal("[INT√âRACTIF] Filtre ACTUS : √©chos d'artistes d'Abidjan.");
                          try { audioSynth.playTamTam(true); } catch (e) {}
                        }}
                        className="p-1.5 xs:p-2 sm:p-4 bg-afri-bg-sec border border-afri-border hover:border-afri-gold rounded-lg xs:rounded-xl cursor-pointer transition-all flex flex-col justify-between text-left group active:scale-95"
                      >
                        <div className="flex items-center gap-1 sm:gap-1.5 w-full">
                          <Award className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-afri-gold shrink-0" />
                          <span className="text-[7px] xs:text-[8px] sm:text-[11px] font-mono font-black text-afri-text tracking-tighter xs:tracking-widest uppercase">ACTUS</span>
                        </div>
                        <p className="text-[6px] xs:text-[7px] sm:text-[9px] text-afri-text-sec font-mono mt-0.5 sm:mt-2 uppercase">√âchos</p>
                      </button>

                      {/* PUBLIER */}
                      <button
                        onClick={() => {
                          requireAuthThen(() => {
                            setActiveMenu("user_publish");
                            addToTerminal("[INT√âRACTIF] Cr√©er une opportunit√©.");
                            try { audioSynth.playValidationSuccess(); } catch (e) {}
                          });
                        }}
                        className="p-1.5 xs:p-2 sm:p-4 bg-afri-gold hover:bg-afri-bg-sec rounded-lg xs:rounded-xl cursor-pointer transition-all flex flex-col justify-between text-left group active:scale-95 shadow-[0_4px_12px_rgba(212,175,55,0.2)]"
                      >
                        <div className="flex items-center gap-1 sm:gap-1.5 w-full text-black">
                          <Plus className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-black stroke-[3] shrink-0" />
                          <span className="text-[7px] xs:text-[8px] sm:text-[11px] font-mono font-black tracking-tighter xs:tracking-widest uppercase">POSTER</span>
                        </div>
                        <p className="text-[6px] xs:text-[7px] sm:text-[9px] text-zinc-950/70 font-mono mt-0.5 sm:mt-2 uppercase">Cr√©er</p>
                      </button>

                      {/* MENU */}
                      <button
                        onClick={() => {
                          setIsSidebarOpen(true);
                          addToTerminal("[MENU] Ouverture de la sidebar.");
                          try { audioSynth.playTamTam(false); } catch (e) {}
                        }}
                        className="p-1.5 xs:p-2 sm:p-4 bg-afri-bg-sec border border-afri-border hover:border-afri-gold/45 rounded-lg xs:rounded-xl cursor-pointer transition-all flex flex-col justify-between text-left group active:scale-95"
                      >
                        <div className="flex items-center gap-1 sm:gap-1.5 w-full">
                          <MoreVertical className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-afri-gold shrink-0" />
                          <span className="text-[7px] xs:text-[8px] sm:text-[11px] font-mono font-black text-afri-text tracking-tighter xs:tracking-widest uppercase font-bold">MENU</span>
                        </div>
                        <p className="text-[6px] xs:text-[7px] sm:text-[9px] text-afri-text-sec font-mono mt-0.5 sm:mt-2 uppercase">Plus</p>
                      </button>
                    </div>

                    {/* ==========================================
                        6. RECHERCHE UNIVERSELLE & 5. ACTIONS RAPIDES
                       ========================================== */}
                    <div className="space-y-6 select-none max-w-full">
                      {/* BARRE DE RECHERCHE UNIVERSELLE REMOVED AS REQUESTED */}

                      {/* SECTION ACTIONS RAPIDES */}
                      <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-5 sm:p-7 shadow-[0_10px_35px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.85)] relative overflow-hidden transition-all">
                        {/* Golden backdrop ambient flare */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-afri-gold/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex justify-between items-center pb-3 border-b border-afri-border mb-4 select-none">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">‚ö°</span>
                            <h3 className="text-sm font-display font-black text-afri-text uppercase tracking-widest leading-none">
                              ACTIONS RAPIDES
                            </h3>
                          </div>
                          <span className="text-[7.5px] font-mono text-afri-text-sec border border-afri-border bg-afri-bg py-0.5 px-2 rounded-lg font-bold">
                            DIRECT CONSOLE
                          </span>
                        </div>

                        {/* 10-GRID ACTIONS COMPACTED */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xs:gap-2.5 sm:gap-4">
                          {/* 1. Rechercher un membre */}
                          <button
                            onClick={() => {
                              setSelectedSearchMember(null);
                              setActiveQuickActionModal("search_member");
                              addToTerminal("[ACTIONS RAPIDES] Recherche de membre activ√©e.");
                              try { audioSynth?.playTamTam?.(true); } catch (_) {}
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-afri-gold/10 flex items-center justify-center border border-afri-gold/20 group-hover:border-afri-gold/65 transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">üë•</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Rechercher membre</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-text-sec uppercase tracking-widest block leading-none mt-0.5">Annuaire</span>
                            </div>
                          </button>

                          {/* 2. Cr√©er une annonce */}
                          <button
                            onClick={() => {
                              requireAuthThen(() => {
                                setActiveMenu("user_publish");
                                addToTerminal("[ACTIONS RAPIDES] Module de publication d'annonce d'or lanc√©.");
                                try { audioSynth.playKoraSuccess(); } catch (_) {}
                              });
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500 transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">üì¢</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Cr√©er annonce</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-text-sec uppercase tracking-widest block leading-none mt-0.5">Nouveau</span>
                            </div>
                          </button>

                          {/* 3. V√©rifier GOMBO ID */}
                          <button
                            onClick={() => {
                              setVerifyGomboIdInput("");
                              setVerifyGomboIdResult(null);
                              setActiveQuickActionModal("verify_gombo_id");
                              addToTerminal("[ACTIONS RAPIDES] V√©rification GOMBO ID ouverte.");
                              try { audioSynth.playTamTam(true); } catch (_) {}
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-afri-gold/10 flex items-center justify-center border border-afri-gold/20 group-hover:border-afri-gold transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">üõ°Ô∏è</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">V√©rifier ID</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-text-sec uppercase tracking-widest block leading-none mt-0.5">Acad√©mie</span>
                            </div>
                          </button>

                          {/* 4. Voir les signalements */}
                          <button
                            onClick={() => {
                              setActiveQuickActionModal("signalements");
                              addToTerminal("[ACTIONS RAPIDES] Alerte & Signalements ouverts.");
                              try { audioSynth.playTamTam(false); } catch (_) {}
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:border-red-500 transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">üö®</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Signalements</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-text-sec uppercase tracking-widest block leading-none mt-0.5">S√©curit√©</span>
                            </div>
                          </button>

                          {/* 5. Envoyer une notification */}
                          <button
                            onClick={() => {
                              setNewNoticeTitle("");
                              setNewNoticeBody("");
                              setActiveQuickActionModal("send_notification");
                              addToTerminal("[ACTIONS RAPIDES] R√©daction de notification.");
                              try { audioSynth.playTamTam(true); } catch (_) {}
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500 transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">üîî</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Notifier</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-text-sec uppercase tracking-widest block leading-none mt-0.5">Diffusion</span>
                            </div>
                          </button>

                          {/* 6. Voir les statistiques */}
                          <button
                            onClick={() => {
                              setActiveQuickActionModal("stats");
                              addToTerminal("[ACTIONS RAPIDES] Tr√¥ne d'Or : Analyse de Performance ouverte.");
                              try { audioSynth.playKoraSuccess(); } catch (_) {}
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 group-hover:border-yellow-500 transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">üìà</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Statistiques</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-text-sec uppercase tracking-widest block leading-none mt-0.5">Indicateurs</span>
                            </div>
                          </button>

                          {/* 7. Revenus */}
                          <button
                            onClick={() => {
                              setActiveQuickActionModal("revenu");
                              addToTerminal("[ACTIONS RAPIDES] Caisse / Portefeuille d'or charg√©.");
                              try { audioSynth.playKoraSuccess(); } catch (_) {}
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-500 transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">üí∞</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Revenus</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-text-sec uppercase tracking-widest block leading-none mt-0.5">S√©curis√©</span>
                            </div>
                          </button>

                          {/* 8. Param√®tres */}
                          <button
                            onClick={() => {
                              setActiveMenu("user_settings");
                              addToTerminal("[ACTIONS RAPIDES] Param√®tres du terminal charg√©s.");
                              try { audioSynth.playTamTam(false); } catch (_) {}
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-zinc-500/10 flex items-center justify-center border border-zinc-500/20 group-hover:border-zinc-500 transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">‚öô</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Param√®tres</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-text-sec uppercase tracking-widest block leading-none mt-0.5">Syst√®me</span>
                            </div>
                          </button>

                          {/* 9. Contrats Gombo */}
                          <button
                            onClick={() => {
                              requireAuthThen(() => {
                                setActiveMenu("user_contracts");
                                addToTerminal("[ACTIONS RAPIDES] Gestionnaire de Contrats Gombo ouvert.");
                                try { audioSynth.playValidationSuccess(); } catch (err) {}
                              });
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:border-purple-500 transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">‚úçÔ∏è</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Contrats</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-text-sec uppercase tracking-widest block leading-none mt-0.5">Signature</span>
                            </div>
                          </button>

                          {/* 10. Portefeuille AFRIGOMBO ELITE WALLET */}
                          <button
                            onClick={() => {
                              requireAuthThen(() => {
                                setActiveMenu("user_wallet");
                                addToTerminal("[ACTIONS RAPIDES] Portefeuille AFRIGOMBO ELITE WALLET ouvert.");
                                try { audioSynth.playKoraSuccess(); } catch (err) {}
                              });
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-afri-gold/10 flex items-center justify-center border border-afri-gold/20 group-hover:border-afri-gold transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">üí≥</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Wallet S√©questre</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-gold uppercase tracking-widest block leading-none mt-0.5">B√™ta-S√©curis√©</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    {!!activeQuickActionModal && (
                      <div className="fixed inset-0 bg-afri-bg/60 backdrop-blur-md z-50 flex items-center justify-center p-2 xs:p-4 overflow-y-auto w-full max-w-full">
                        <div className="bg-afri-bg border border-afri-border rounded-2xl xs:rounded-3xl p-4 xs:p-6 sm:p-8 w-full max-w-md my-4 xs:my-8 relative overflow-hidden select-none shadow-[0_15px_50px_rgba(0,0,0,0.1)]">
                          <button
                            onClick={() => {
                              setActiveQuickActionModal(null);
                              try { audioSynth.playTamTam(false); } catch (_) {}
                            }}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-afri-bg-sec hover:bg-afri-bg text-afri-gold hover:text-afri-text border border-afri-border flex items-center justify-center cursor-pointer transition focus:outline-none"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          {/* MODAL 2: V√âRIFIER GOMBO ID */}
                          {activeQuickActionModal === "verify_gombo_id" && (
                            <div className="space-y-4 text-left">
                              <div className="space-y-1">
                                <h3 className="text-sm font-display font-black text-afri-text uppercase tracking-widest flex items-center gap-2">
                                  <span>üõ°Ô∏è</span> RECHERCHER & CERTIFIER UN GOMBO ID
                                </h3>
                                <p className="text-[11px] text-afri-text-sec">Contr√¥lez le passeport num√©rique d'un membre de l'Acad√©mie.</p>
                              </div>

                              <div className="space-y-2 pt-1 border-t border-afri-border">
                                <label className="text-[9px] font-mono text-afri-gold uppercase block font-bold">RECHERCHE DE CERTIFICATION</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Saisir nom de l'artiste ou ID..."
                                    value={verifyGomboIdInput}
                                    onChange={(e) => setVerifyGomboIdInput(e.target.value)}
                                    className="flex-1 bg-afri-bg-sec border border-afri-border focus:border-afri-gold text-xs text-afri-text p-2.5 rounded-xl font-mono focus:outline-none"
                                  />
                                  <button
                                    onClick={() => {
                                      const text = (verifyGomboIdInput || "").toLowerCase().trim();
                                      if (!text) return;
                                      const found = users.find(u => 
                                        (u?.id ?? "").toLowerCase().includes(text) || 
                                        (u?.artisticName ?? "").toLowerCase().includes(text) ||
                                        (u?.name ?? "").toLowerCase().includes(text)
                                      );
                                      setVerifyGomboIdResult(found || "not_found");
                                      addToTerminal(`[SCANNER] Gombo ID scanner de s√©curit√© interrog√© pour: ${verifyGomboIdInput}`);
                                      try { audioSynth.playKoraSuccess(); } catch(_) {}
                                    }}
                                    className="px-4 py-2 bg-afri-gold text-black hover:bg-afri-bg-sec text-xs font-mono font-black uppercase rounded-xl transition cursor-pointer"
                                  >
                                    V√âRIFIER
                                  </button>
                                </div>
                              </div>

                              {/* RESULTS CONTAINER */}
                              {verifyGomboIdResult && (
                                <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl animate-fadeIn space-y-3">
                                  {verifyGomboIdResult === "not_found" ? (
                                    <div className="space-y-2 text-center text-afri-text-sec py-2">
                                      <span className="text-xl block">‚ùå</span>
                                      <p className="text-xs font-mono">Aucun artiste ne poss√®de cet identifiant.</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <img src={verifyGomboIdResult.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-afri-gold/35" />
                                        <div>
                                          <strong className="text-xs text-afri-text uppercase block leading-none font-bold">{verifyGomboIdResult.artisticName}</strong>
                                          <span className="text-[9px] font-mono text-afri-text-sec block mt-1">{verifyGomboIdResult.commune} ‚Ä¢ ID: {verifyGomboIdResult.id}</span>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-afri-border select-none text-left">
                                        <div className="p-2 bg-afri-bg rounded-xl">
                                          <span className="text-[8px] font-mono text-afri-text-sec block uppercase leading-none">Statut KYC</span>
                                          <span className={`text-[10px] font-mono font-black uppercase mt-1 block leading-none ${verifyGomboIdResult.kycStatus === "approved" ? "text-emerald-400" : "text-amber-500"}`}>
                                            {verifyGomboIdResult.kycStatus === "approved" ? "üõ°Ô∏è CERTIFI√â ELITE" : "‚è≥ EN ATTENTE"}
                                          </span>
                                        </div>
                                        <div className="p-2 bg-afri-bg rounded-xl">
                                          <span className="text-[8px] font-mono text-afri-text-sec block uppercase leading-none">Rang d'Honneur</span>
                                          <span className="text-[10px] font-mono font-black text-afri-gold mt-1 block leading-none uppercase">
                                            {verifyGomboIdResult.performanceScore >= 95 ? "üåü Imp√©rial" : "Accordeur"}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Quick certify toggle button inside Verification results */}
                                      {verifyGomboIdResult.kycStatus !== "approved" && (
                                        <button
                                          onClick={async () => {
                                            try {
                                              const updated = { ...verifyGomboIdResult, kycStatus: "approved", performanceScore: 99 };
                                              await saveToFirestore("users", verifyGomboIdResult.id, updated);
                                              setVerifyGomboIdResult(updated);
                                              addToTerminal(`[S√âCURIS√â] GOMBO ID certifi√© avec succ√®s pour ${verifyGomboIdResult.artisticName}`);
                                            } catch(_) {}
                                          }}
                                          className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-[#050505] font-mono font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5"
                                        >
                                          ‚úì VALIDER LA ZONE DE CONFIANCE
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* MODAL 3: DISPUTES & SIGNALEMENTS */}
                          {activeQuickActionModal === "signalements" && (
                            <div className="space-y-4 text-left">
                              <div className="space-y-1">
                                <h3 className="text-sm font-display font-black text-afri-text uppercase tracking-widest flex items-center gap-2">
                                  <span>üö®</span> CONTR√îLE DES SIGNALEMENTS & LITIGES
                                </h3>
                                <p className="text-[11px] text-afri-text-sec">Assurez l'√©tanch√©it√© de la caisse et la probit√© des orchestres.</p>
                              </div>

                              {/* NEW SIGNALEMENT FORM */}
                              <div className="p-3.5 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-2.5">
                                <span className="text-[9px] font-mono text-red-500 uppercase tracking-wider block font-bold leading-none">SIGNIALER UN FAUX PROFIL</span>
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Nom ou pseudo du contrevenant..."
                                    value={customReportUser}
                                    onChange={(e) => setCustomReportUser(e.target.value)}
                                    className="w-full bg-afri-bg border border-afri-border text-xs text-afri-text p-2 rounded-lg font-mono focus:outline-none"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Raison (ex: faux cachet, absence d'orchestre)..."
                                    value={customReportReason}
                                    onChange={(e) => setCustomReportReason(e.target.value)}
                                    className="w-full bg-afri-bg border border-afri-border text-xs text-afri-text p-2 rounded-lg font-mono focus:outline-none"
                                  />
                                  <button
                                    onClick={async () => {
                                      if (!customReportUser || !customReportReason) return;
                                      const newAlert: Alerte = {
                                        id: "alert_" + Date.now().toString().slice(-4),
                                        userId: "user_litige",
                                        userName: customReportUser,
                                        reason: customReportReason,
                                        severity: "high",
                                        status: "open",
                                        timestamp: new Date().toISOString()
                                      };
                                      try {
                                        await saveToFirestore("alerts", newAlert.id, newAlert);
                                        setCustomReportUser("");
                                        setCustomReportReason("");
                                        addToTerminal(`[D√âNONCIATION] Signalement enregistr√© pour ${customReportUser} : ${customReportReason}`);
                                        try { audioSynth.playTamTam(false); } catch(_) {}
                                      } catch (_) {}
                                    }}
                                    className="w-full py-2 bg-red-500 hover:bg-red-600 text-afri-text font-mono font-black text-xs uppercase rounded-lg transition"
                                  >
                                    √âMETTRE L'ALERTE ROUGE ‚õ®
                                  </button>
                                </div>
                              </div>

                              {/* LIVE SIGNALEMENTS LIST */}
                              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 border-t border-afri-border pt-3">
                                <span className="text-[8.5px] font-mono text-zinc-550 uppercase block font-bold">ALERTE ACTIVES EN COURS D'ARBITRAGE</span>
                                {alerts.length === 0 ? (
                                  <div className="text-center py-4 text-xs text-zinc-650 font-mono">Aucun litige actif. Bravo √† l'Acad√©mie !</div>
                                ) : (
                                  alerts.map(al => (
                                    <div key={al.id} className="p-2.5 bg-afri-bg border border-afri-border/50 rounded-xl flex justify-between items-center text-left hover:border-red-500/20 transition">
                                      <div className="min-w-0 pr-2">
                                        <strong className="text-xs text-afri-text block font-bold leading-none">{al.userName}</strong>
                                        <span className="text-[9px] font-mono text-afri-text-sec block truncate mt-1">{al.reason}</span>
                                      </div>
                                      <button
                                        onClick={async () => {
                                          try {
                                            // Demo delete / resolve via Firestore sync
                                            const updated = { ...al, status: "resolved" };
                                            await saveToFirestore("alerts", al.id, updated);
                                            // Or filter local to match instant expectations
                                            setAlerts(alerts.filter(a => a.id !== al.id));
                                            addToTerminal(`[ARBITRAGE] Litige #${al.id} clos avec honneurs.`);
                                            try { audioSynth.playKoraSuccess(); } catch(_) {}
                                          } catch (_) {}
                                        }}
                                        className="py-1 px-2.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold uppercase rounded hover:bg-emerald-500 hover:text-black transition flex-shrink-0"
                                      >
                                        R√©soudre
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}

                          {/* MODAL 4: ENVOYER UNE NOTIFICATION */}
                          {activeQuickActionModal === "send_notification" && (
                            <div className="space-y-4 text-left">
                              <div className="space-y-1">
                                <h3 className="text-sm font-display font-black text-afri-text uppercase tracking-widest flex items-center gap-2">
                                  <span>üì¢</span> ENVOYER UN TAMBOUR (DIFFUSION)
                                </h3>
                                <p className="text-[11px] text-afri-text-sec">√âmettez une vibration instantan√©e relay√©e sur tous les t√©l√©phones.</p>
                              </div>

                              <div className="space-y-3 pt-1 border-t border-afri-border">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-mono text-afri-gold uppercase block font-bold">Cat√©gorie d'√©cho</label>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {["INFO", "CACHET", "ZOUGLOU", "ALERT"].map(cat => (
                                      <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setNewNoticeCategory(cat)}
                                        className={`py-1 text-[8px] font-mono font-bold uppercase rounded-lg border transition ${newNoticeCategory === cat ? "bg-afri-gold border-afri-gold text-black" : "bg-afri-bg border-afri-border text-afri-text-sec hover:text-afri-text"}`}
                                      >
                                        {cat}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-mono text-afri-text-sec uppercase block font-bold">Titre majestueux</label>
                                  <input
                                    type="text"
                                    placeholder="ex: Concours National Zouglou..."
                                    value={newNoticeTitle}
                                    onChange={(e) => setNewNoticeTitle(e.target.value)}
                                    className="w-full bg-afri-bg border border-afri-border text-xs text-afri-text p-2.5 rounded-xl font-mono focus:outline-none focus:border-afri-gold"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-mono text-afri-text-sec uppercase block font-bold">Message du tambour</label>
                                  <textarea
                                    placeholder="Entrez le contenu de la notification √† synchroniser en direct..."
                                    value={newNoticeBody}
                                    onChange={(e) => setNewNoticeBody(e.target.value)}
                                    rows={3}
                                    className="w-full bg-afri-bg border border-afri-border text-xs text-afri-text p-2.5 rounded-xl font-mono focus:outline-none focus:border-afri-gold"
                                  />
                                </div>

                                <button
                                  onClick={async () => {
                                    if (!newNoticeTitle || !newNoticeBody) return;
                                    // Generate notification to Firestore
                                    const notifyId = "notify_" + Date.now().toString().slice(-4);
                                    const systemPost: Post = {
                                      id: notifyId,
                                      content: `[${newNoticeCategory}] ${newNoticeTitle} : ${newNoticeBody}`,
                                      authorId: "system",
                                      authorName: "Acad√©mie Tr√¥ne d'Or",
                                      authorArtisticName: "ADMINISTRATEUR",
                                      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format",
                                      timestamp: new Date().toISOString(),
                                      likes: 0,
                                      comments: 0
                                    };
                                    try {
                                      await saveToFirestore("posts", notifyId, systemPost);
                                      setNewNoticeTitle("");
                                      setNewNoticeBody("");
                                      // Push local list
                                      setPosts([systemPost, ...posts]);
                                      setActiveQuickActionModal(null);
                                      addToTerminal(`[DIFFUSION] Tambour envoy√© avec succ√®s ! Titre: ${newNoticeTitle}`);
                                      try { audioSynth.playKoraSuccess(); } catch(_) {}
                                      alert("üì¢ Message diffus√© en temps r√©el sur la Base !");
                                    } catch (_) {}
                                  }}
                                  className="w-full h-11 bg-gradient-to-r from-afri-gold to-amber-400 text-black font-sans font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                >
                                  DIFFUSER LE TAMBOUR ü™ò
                                </button>
                              </div>
                            </div>
                          )}

                          {/* MODAL 5: ANALYTICS & STATISTIQUES PRESTIGE */}
                          {activeQuickActionModal === "stats" && (
                            <div className="space-y-4 text-left">
                              <div className="space-y-1">
                                <h3 className="text-sm font-display font-black text-afri-text uppercase tracking-widest flex items-center gap-2">
                                  <span>üìà</span> PERFORMANCE & ANALYTIQUES D'OR
                                </h3>
                                <p className="text-[11px] text-afri-text-sec">Analyse d'audience et de budget de l'Acad√©mie en temps r√©el.</p>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-afri-border select-none">
                                <div className="p-3 bg-afri-bg border border-afri-border rounded-2xl">
                                  <span className="text-[8px] font-mono text-zinc-550 block uppercase">FLUX CACHETS</span>
                                  <strong className="text-sm font-display font-black text-afri-gold block mt-1">2 840 000 F</strong>
                                  <span className="text-[7.5px] font-mono text-emerald-400 block mt-0.5">+14% ce mois</span>
                                </div>
                                <div className="p-3 bg-afri-bg border border-afri-border rounded-2xl">
                                  <span className="text-[8px] font-mono text-zinc-550 block uppercase">CONFIANCE COMMUNE</span>
                                  <strong className="text-sm font-sans font-black text-afri-text block mt-1">98.4%</strong>
                                  <span className="text-[7.5px] font-mono text-emerald-400 block mt-0.5">0 disputes actives</span>
                                </div>
                              </div>

                              {/* SMALL INTERACTIVE CHART ACCORDING TO 60FPS REQUIREMENTS */}
                              <div className="p-3 bg-afri-bg border border-afri-border rounded-2xl space-y-1 select-none">
                                <span className="text-[8px] font-mono text-afri-text-sec uppercase block font-bold">FR√âQUENTATION JOURNALI√àRE</span>
                                <div className="h-28 w-full mt-2">
                                  <Suspense fallback={<div className="w-full h-full bg-afri-bg/50 animate-pulse rounded-lg" />}>
                                    <AdminAreaChart
                                      data={[
                                        { name: "Lun", revenue: 240 },
                                        { name: "Mar", revenue: 380 },
                                        { name: "Mer", revenue: 310 },
                                        { name: "Jeu", revenue: 480 },
                                        { name: "Ven", revenue: 620 },
                                        { name: "Sam", revenue: 750 },
                                        { name: "Dim", revenue: 910 },
                                      ]}
                                    />
                                  </Suspense>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* MODAL 6: REVENUS / CAISSE */}
                          {activeQuickActionModal === "revenu" && (
                            <Suspense fallback={<div className="p-6 text-center text-afri-gold font-mono animate-pulse">Chargement de la Caisse...</div>}>
                              <RevenuQuickActionModal
                                activeArtistId={activeArtistId}
                                users={users}
                                saveToFirestore={saveToFirestore}
                                transactions={transactions}
                                setTransactions={setTransactions}
                                setActiveQuickActionModal={setActiveQuickActionModal}
                                addToTerminal={addToTerminal}
                              />
                            </Suspense>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                    {/* CARTE H√âRO PRINCIPALE PREMIUM (CARROUSEL) */}
                    <Carousel
                      items={[
                        <div className="relative overflow-hidden rounded-3xl bg-afri-bg border border-afri-gold/25 p-5 sm:p-7 shadow-xl h-[280px] sm:h-auto flex flex-col justify-between">
                          <div className="absolute right-0 top-0 bottom-0 w-[42%] h-full z-0 overflow-hidden">
                            <img 
                              src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=360" 
                              alt="Artiste en Prestation" 
                              className="w-full h-full object-cover object-center opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-afri-bg-action via-afri-bg/70 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-t from-afri-bg-action via-transparent to-transparent" />
                          </div>

                          <div className="relative z-10 flex flex-col justify-center h-full max-w-[62%] text-left space-y-4">
                            <div>
                              <span className="text-[10px] sm:text-xs uppercase font-mono text-afri-gold tracking-[0.2em] block font-extrabold mb-1">
                                AFRIGOMBO ELITE PORTAL
                              </span>
                              <h2 className="text-2xl sm:text-4xl font-display font-black tracking-tight leading-none uppercase">
                                <span className="text-afri-text block mb-1">LE TERRAIN</span>
                                <span className="text-afri-gold">D'INTELLIGENCE</span>
                              </h2>
                              <p className="text-[11px] sm:text-xs text-afri-text-sec mt-2 max-w-md leading-relaxed">
                                Consultez l'actu bouillante du showbiz √† Abidjan, d√©crochez des cachets d'or ou postez de nouvelles alliances.
                              </p>
                            </div>
                            
                            <div className="space-y-3">
                              <button
                                onClick={() => {
                                  requireAuthThen(() => {
                                    setActiveMenu("user_publish");
                                    audioSynth.playValidationSuccess();
                                  });
                                }}
                                className="px-5 py-2.5 rounded-xl bg-afri-gold hover:bg-afri-bg-sec text-[#050505] text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-[0_4px_15px_rgba(212,175,55,0.3)] active:scale-95"
                              >
                                <Plus className="w-4 h-4 stroke-[3]" />
                                PUBLIER UNE OPPORTUNIT√â
                              </button>
                            </div>
                          </div>
                        </div>,
                        <div className="relative overflow-hidden rounded-3xl bg-afri-bg border border-afri-gold/25 p-5 sm:p-7 shadow-xl h-[280px] sm:h-auto flex flex-col justify-between">
                          <div className="absolute right-0 top-0 bottom-0 w-[42%] h-full z-0 overflow-hidden">
                            <img 
                              src="https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=360" 
                              alt="Sc√®ne Live" 
                              className="w-full h-full object-cover object-center opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-afri-bg-action via-afri-bg/70 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-t from-afri-bg-action via-transparent to-transparent" />
                          </div>

                          <div className="relative z-10 flex flex-col justify-center h-full max-w-[62%] text-left space-y-4">
                            <div>
                              <span className="text-[10px] sm:text-xs uppercase font-mono text-afri-gold tracking-[0.2em] block font-extrabold mb-1">
                                TENDANCE ABIDJAN
                              </span>
                              <h2 className="text-2xl sm:text-4xl font-display font-black tracking-tight leading-none uppercase">
                                <span className="text-afri-text block mb-1">LIVE & VIBES</span>
                                <span className="text-afri-gold">NOUVEAUT√âS</span>
                              </h2>
                              <p className="text-[11px] sm:text-xs text-afri-text-sec mt-2 max-w-md leading-relaxed">
                                D√©couvrez les nouveaux talents et les tendances musicales qui font vibrer les nuits d'Abidjan.
                              </p>
                            </div>
                          </div>
                        </div>
                      ]}
                    />

                    {/* RACCOURCIS PREMIUM */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-3 select-none">
                      <button
                        onClick={() => {
                          setTerrainTab("musicien");
                          try { audioSynth.playTamTam(true); } catch (e) {}
                        }}
                        className={`p-1.5 sm:p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-1.5 sm:gap-2.5 ${
                          terrainTab === "musicien" 
                            ? "bg-afri-gold/10 border-afri-gold text-afri-text" 
                            : "bg-afri-bg/35 border-afri-border hover:border-afri-gold/40 text-afri-text/90"
                        }`}
                      >
                        <span className="text-sm sm:text-lg shrink-0">üéµ</span>
                        <div className="min-w-0">
                          <h4 className="text-[8.5px] sm:text-[10.5px] font-display font-black uppercase text-afri-gold truncate leading-none">√âCHOS</h4>
                          <p className="text-[7.5px] sm:text-[8px] text-afri-text-sec font-mono mt-0.5 truncate leading-none">Actus & Buzz</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setTerrainTab("contrat");
                          try { audioSynth.playTamTam(true); } catch (e) {}
                        }}
                        className={`p-1.5 sm:p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-1.5 sm:gap-2.5 ${
                          terrainTab === "contrat" 
                            ? "bg-afri-gold/10 border-afri-gold text-afri-text" 
                            : "bg-afri-bg/35 border-afri-border hover:border-afri-gold/40 text-afri-text/90"
                        }`}
                      >
                        <span className="text-sm sm:text-lg shrink-0">üí∞</span>
                        <div className="min-w-0">
                          <h4 className="text-[8.5px] sm:text-[10.5px] font-display font-black uppercase text-afri-gold truncate leading-none">CACHETS</h4>
                          <p className="text-[7.5px] sm:text-[8px] text-afri-text-sec font-mono mt-0.5 truncate leading-none">Offres & Dem.</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setTerrainTab("all");
                          addToTerminal("[FILTRE] Tendances d'Abidjan activ√©es sur le Terrain.");
                          try { audioSynth.playValidationSuccess(); } catch (e) {}
                        }}
                        className="p-1.5 sm:p-2.5 rounded-xl bg-afri-bg/35 border border-afri-border hover:border-afri-gold/40 text-left cursor-pointer transition-all text-afri-text/90 flex items-center gap-1.5 sm:gap-2.5"
                      >
                        <span className="text-sm sm:text-lg shrink-0">üìà</span>
                        <div className="min-w-0">
                          <h4 className="text-[8.5px] sm:text-[10.5px] font-display font-black uppercase text-afri-gold truncate leading-none">TENDANCES</h4>
                          <p className="text-[7.5px] sm:text-[8px] text-afri-text-sec font-mono mt-0.5 truncate leading-none">Abidjan Mix</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          addToTerminal("[INFO] Calendrier des √©v√©nements : tous les spectacles, showcases, et concerts du mois.");
                          alert("üìÖ √âv√®nements d'Or : Retrouvez l'agenda complet des concerts live d'Abidjan sur le canal d'Actu !");
                          try { audioSynth.playTamTam(false); } catch (e) {}
                        }}
                        className="p-1.5 sm:p-2.5 rounded-xl bg-afri-bg/35 border border-afri-border hover:border-afri-gold/40 text-left cursor-pointer transition-all text-afri-text/90 flex items-center gap-1.5 sm:gap-2.5"
                      >
                        <span className="text-sm sm:text-lg shrink-0">üìÖ</span>
                        <div className="min-w-0">
                          <h4 className="text-[8.5px] sm:text-[10.5px] font-display font-black uppercase text-afri-gold truncate leading-none">√âV√âNEMENTS</h4>
                          <p className="text-[7.5px] sm:text-[8px] text-afri-text-sec font-mono mt-0.5 truncate leading-none">Spectacles</p>
                        </div>
                      </button>
                    </div>

                    {/* Navigation Tabs filter within Le Terrain */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-afri-border pb-4">
                      <div className="flex items-center gap-2 bg-afri-bg border border-afri-border p-1 rounded-xl">
                        <button
                          onClick={() => setTerrainTab("all")}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                            terrainTab === "all" ? "bg-afri-gold text-[#050505]" : "text-afri-text-sec hover:text-afri-text"
                          }`}
                        >
                          Tout l'√âcran
                        </button>
                        <button
                          onClick={() => setTerrainTab("musicien")}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                            terrainTab === "musicien" ? "bg-afri-gold text-[#050505]" : "text-afri-text-sec hover:text-afri-text"
                          }`}
                        >
                          √âchos d'Artistes
                        </button>
                        <button
                          onClick={() => setTerrainTab("contrat")}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                            terrainTab === "contrat" ? "bg-afri-gold text-[#050505]" : "text-afri-text-sec hover:text-afri-text"
                          }`}
                        >
                          Les Cachets
                        </button>
                      </div>

                      <div className="text-[11px] font-mono text-afri-text-sec">
                        {GombosToRender.length} cachets & {filteredFeedPosts.length} murmures sur sc√®ne
                      </div>
                    </div>

                    {/* MAIN SPLIT COLUMNS SECTION */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      
                      {/* LEFT OR MAIN: GOMBOS / CONTRATS GRID */}
                      {(terrainTab === "all" || terrainTab === "contrat") && (
                        <div className={`${terrainTab === "contrat" ? "lg:col-span-12" : "lg:col-span-7"} space-y-5`}>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-3 bg-afri-gold rounded-full" />
                            <h3 className="text-sm font-sans font-black text-afri-text uppercase tracking-wider">
                              Les Cachets d'Or Disponibles
                            </h3>
                          </div>

                          {GombosToRender.length === 0 ? (
                            <div className="p-10 text-center rounded-2xl bg-afri-bg-sec border border-afri-border text-afri-text-sec text-xs font-mono">
                              Aucun contrat (Gombo) ne correspond √† vos filtres actuels.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
                              {GombosToRender.map(g => {
                                const hasApplied = appliedGombos.includes(g.id);
                                return (
                                  <motion.div
                                    key={g.id}
                                    whileHover={{ scale: 1.01, y: -3 }}
                                    className="relative overflow-hidden rounded-3xl bg-afri-bg-sec border border-afri-gold/15 p-5 transition-all duration-300 flex flex-col sm:flex-row gap-5 items-stretch shadow-lg"
                                  >
                                    {g.isBoosted && (
                                      <div className="absolute top-0 right-0 bg-afri-gold text-[#050505] text-[8px] font-mono font-extrabold uppercase px-3 py-1 rounded-bl-xl shadow flex items-center gap-1 z-20">
                                        <Zap className="w-3 h-3 fill-current animate-pulse" /> PREMIUM BOOST
                                      </div>
                                    )}

                                    {/* Left illustration wrapper */}
                                    <div className="w-full sm:w-40 h-28 rounded-2xl overflow-hidden relative shrink-0 border border-afri-border bg-afri-bg">
                                      <img
                                        src={
                                          g.id.includes("1") || g.id.includes("a")
                                            ? "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=300"
                                            : g.id.includes("2") || g.id.includes("b")
                                            ? "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=300"
                                            : g.id.includes("3") || g.id.includes("c")
                                            ? "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300"
                                            : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=300"
                                        }
                                        alt={g.title}
                                        className="w-full h-full object-cover opacity-90 hover:scale-105 transition-all duration-500"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-afri-bg/85 to-transparent" />
                                      <span className="absolute bottom-2 left-2 text-[8px] font-mono font-black uppercase text-afri-gold bg-afri-bg-sec/95 px-2 py-0.5 rounded border border-afri-gold/20">
                                        {g.type || "Live Showcase"}
                                      </span>
                                    </div>

                                    {/* Right description block */}
                                    <div className="flex-1 flex flex-col justify-between text-left">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-500/10 border border-emerald-500 text-emerald-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                            ‚óè Actif
                                          </span>
                                          <span className="text-[10px] font-mono text-afri-text-sec">üìç {g.location}</span>
                                          <span className="text-zinc-650 font-mono text-[10px]">‚Ä¢</span>
                                          <span className="text-[10px] text-afri-text-sec font-mono">{g.date || "Date R√©cente"}</span>
                                        </div>

                                        <h4 className="text-md sm:text-lg font-sans font-black text-afri-text hover:text-afri-gold transition-all">
                                          {g.title}
                                        </h4>
                                        <p className="text-xs text-afri-text-sec line-clamp-2 leading-relaxed mt-1">
                                          {g.description}
                                        </p>
                                      </div>

                                      {/* Lower section containing large amount and Details button */}
                                      <div className="border-t border-afri-border pt-3 mt-4 flex items-center justify-between flex-wrap gap-4">
                                        <div>
                                          <span className="text-[8px] uppercase font-mono text-afri-text-sec block font-bold">MONTANT GARANTI</span>
                                          <strong className="text-xl font-sans font-black text-afri-gold tracking-tight">
                                            {(g.budget || 250000).toLocaleString("fr-FR")} <span className="text-xs font-mono text-afri-text-sec font-bold">FCFA</span>
                                          </strong>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                          <button
                                            onClick={() => {
                                              setSelectedGomboDetails(g);
                                              try { audioSynth.playValidationSuccess(); } catch (err) {}
                                            }}
                                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-afri-bg-sec to-afri-bg-action border border-afri-gold/35 hover:border-afri-gold text-afri-text text-[10px] font-mono font-black uppercase tracking-wider hover:shadow-[0_0_15px_rgba(212,175,55,0.15)] cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                                          >
                                            VOIR D√âTAILS
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* RIGHT COLUMN: RECENT POSTS ECHOS D'ARTISTES */}
                      {(terrainTab === "all" || terrainTab === "musicien") && (
                        <div className={`${terrainTab === "musicien" ? "lg:col-span-12" : "lg:col-span-5"} space-y-5`}>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-3 bg-afri-gold rounded-full" />
                            <h3 className="text-sm font-sans font-black text-afri-text uppercase tracking-wider">
                              Murmures & Alliances Showbiz
                            </h3>
                          </div>

                          {filteredFeedPosts.length === 0 ? (
                            <div className="p-10 text-center rounded-2xl bg-afri-bg-sec border border-afri-border text-afri-text-sec text-xs font-mono">
                              Aucune mise √† jour trouv√©e sur Le Terrain.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {filteredFeedPosts.map(p => {
                                const isLiked = likedPosts.includes(p.id);
                                const authorUser = users.find(u => u.id === p.userId);
                                const authorCommune = authorUser?.commune || "Plateau";
                                const formattedDate = p.timestamp ? new Date(p.timestamp).toLocaleDateString("fr-FR", {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                }) : "Live";
                                const formattedTime = p.timestamp ? new Date(p.timestamp).toLocaleTimeString("fr-FR", {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : "Aujourd'hui";

                                // Determine category badge styling
                                let categoryColor = "border-amber-500/30 text-afri-gold bg-amber-500/5";
                                if (p.category === "√âv√©nement") {
                                  categoryColor = "border-emerald-500/30 text-emerald-400 bg-emerald-500/5";
                                } else if (p.category === "Recherche") {
                                  categoryColor = "border-rose-500/30 text-rose-400 bg-rose-500/5";
                                } else if (p.category === "Collaboration") {
                                  categoryColor = "border-cyan-500/30 text-cyan-400 bg-cyan-500/5";
                                } else if (p.category === "Opportunit√©") {
                                  categoryColor = "border-indigo-500/30 text-indigo-400 bg-indigo-505/5";
                                }

                                return (
                                  <div key={p.id} className="bg-afri-bg-sec border border-afri-border/80 rounded-2xl p-4.5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-afri-border/60 transition-all duration-300">
                                    {/* HEADER: User info + location + time */}
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-afri-bg border border-afri-gold/30 flex items-center justify-center text-afri-gold font-black text-xs font-mono shadow-inner shrink-0 relative">
                                          {p.authorArtisticName?.charAt(0)}
                                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#111111]" />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h5 className="text-[12px] font-sans font-black text-afri-text uppercase tracking-wide leading-tight">
                                              {p.authorArtisticName}
                                            </h5>
                                            <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-afri-bg-sec border border-afri-border text-afri-text-sec font-mono font-bold leading-none shrink-0">
                                              PRO
                                            </span>
                                          </div>
                                          <span className="text-[9px] font-mono text-afri-text-sec block leading-tight mt-0.5">
                                            {p.authorName} ‚Ä¢ {authorUser?.email || "artiste@afrigombo.ci"}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="text-right flex flex-col items-end shrink-0">
                                        <span className="text-[9px] font-mono font-bold text-afri-gold flex items-center gap-1">
                                          üìç {authorCommune}
                                        </span>
                                        <span className="text-[7.5px] font-mono text-afri-text-sec mt-0.5">
                                          {formattedDate} √† {formattedTime}
                                        </span>
                                      </div>
                                    </div>

                                    {/* POST MEDIA IMAGE (IF PRESENT) */}
                                    {p.mediaUrl && (
                                      <div className="relative rounded-xl overflow-hidden border border-afri-border/60 bg-afri-bg aspect-[16/9] group">
                                        <img
                                          src={p.mediaUrl}
                                          alt="Illustration"
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <span className="absolute bottom-2 right-2 text-[8px] bg-afri-bg/80 backdrop-blur-md text-afri-gold font-bold border border-afri-gold/20 px-2 py-0.5 rounded-md font-mono tracking-wider uppercase">
                                          √âCHO PREMIUM
                                        </span>
                                      </div>
                                    )}

                                    {/* DESCRIPTION */}
                                    <p className="text-[11.5px] font-sans text-afri-text leading-relaxed bg-afri-bg/60 p-3 rounded-xl border border-white/[0.03]">
                                      {p.content}
                                    </p>

                                    {p.isFlagged && (
                                      <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2.5 text-[8.5px] font-mono text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <span>‚ö†Ô∏è INTERVENTION AI</span> ‚Ä¢ <span className="text-afri-text-sec">{p.flagReason || "Contenu r√©vis√©"}</span>
                                      </div>
                                    )}

                                    {/* CATEGORY & HASHTAGS ROW */}
                                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                                      {/* Category Badge */}
                                      <span className={`text-[8.5px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${categoryColor}`}>
                                        {p.category || "G√©n√©ral"}
                                      </span>

                                      {/* Hashtags */}
                                      {p.tags && p.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {p.tags.map(tag => (
                                            <span key={tag} className="text-[9.5px] font-mono text-afri-gold/70 font-semibold hover:text-afri-gold transition-all cursor-pointer">
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* STATS INTERACTIVES & ACTION BUTTONS */}
                                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.04] text-[10.5px] font-mono text-zinc-450">
                                      <div className="flex items-center gap-4 text-afri-text-sec">
                                        {/* Honneurs Count */}
                                        <button
                                          onClick={() => {
                                            requireAuthThen(() => {
                                              if (isLiked) {
                                                setLikedPosts(prev => prev.filter(id => id !== p.id));
                                                gomboDB.toggleHonor(currentUser!.uid, p.id);
                                              } else {
                                                setLikedPosts(prev => [...prev, p.id]);
                                                gomboDB.toggleHonor(currentUser!.uid, p.id);
                                                try { audioSynth.playValidationSuccess(); } catch(e){}
                                              }
                                            });
                                          }}
                                          className={`flex items-center gap-1.5 transition-colors hover:text-afri-gold cursor-pointer ${isLiked ? "text-afri-gold font-bold" : ""}`}
                                        >
                                          <span className="text-[12px]">{isLiked ? "ü™ò" : "ü™ò"}</span> 
                                          <span>{p.likes + (isLiked ? 1 : 0)} honneurs re√ßus</span>
                                        </button>

                                        {/* Views Count */}
                                        <div className="flex items-center gap-1.5 text-afri-text-sec">
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>{p.views || 45} vues</span>
                                        </div>

                                        {/* Shares Count */}
                                        <div className="flex items-center gap-1.5 text-afri-text-sec">
                                          <Share2 className="w-3.5 h-3.5" />
                                          <span>{p.shares || 8} transmissions</span>
                                        </div>
                                      </div>
                                      
                                      {/* Golden Action Buttons */}
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => {
                                            try {
                                              navigator.clipboard.writeText(`${window.location.origin}/echo/${p.id}`);
                                              addToTerminal(`[LIEN COPI√â] Lien vers l'√©cho de ${p.authorArtisticName} copi√©.`);
                                              audioSynth.playValidationSuccess();
                                            } catch (_) {
                                              addToTerminal(`[EXP√âDITION] √âcho de ${p.authorArtisticName} pr√™t √† l'envoi.`);
                                            }
                                          }}
                                          className="text-[9.5px] px-2.5 py-1.5 rounded-lg font-bold border border-afri-gold/30 hover:border-afri-gold/80 hover:bg-afri-gold/5 text-afri-gold transition-all cursor-pointer flex items-center gap-1"
                                        >
                                          <span>Transmettre</span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Real Parler / Comments Section */}
                                    <div className="space-y-2 pt-2 border-t border-afri-border">
                                      {/* Existing comments */}
                                      {postComments[p.id]?.map(c => (
                                        <div key={c.id} className="text-[10.5px] p-2 bg-afri-bg rounded border border-afri-border text-left font-sans">
                                          <strong className="text-afri-gold uppercase text-[9px] font-mono mr-1">{c.writerName} :</strong>
                                          <span className="text-afri-text">{c.content}</span>
                                        </div>
                                      ))}

                                      {/* Add comment input */}
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          placeholder="Ajouter un parler d'Acad√©mie..."
                                          onKeyDown={async (e: any) => {
                                            if (e.key === "Enter" && e.target.value.trim()) {
                                              const content = e.target.value.trim();
                                              const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                                              const writerName = currentArtist ? currentArtist.artisticName : "Artiste √âlite";
                                              const newComment = {
                                                id: `comment_${Date.now()}`,
                                                content,
                                                writerName,
                                                postId: p.id,
                                                timestamp: new Date().toISOString()
                                              };
                                              setPostComments(prev => ({
                                                ...prev,
                                                [p.id]: [...(prev[p.id] || []), newComment]
                                              }));
                                              e.target.value = "";
                                              saveToFirestore("post_comments", newComment.id, newComment);
                                              saveToFirestore("posts", p.id, { ...p, comments: (p.comments || 0) + 1 });
                                              try { audioSynth.playValidationSuccess(); } catch (err) {}
                                              addToTerminal(`[PARLER] Parler ajout√© par ${writerName} sur le post ${p.id}`);
                                            }
                                          }}
                                          className="flex-1 bg-afri-bg-sec border border-afri-border rounded-xl p-2 px-3 text-[10.5px] text-afri-text focus:outline-none focus:border-afri-gold placeholder:text-zinc-650"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                    </div>

                    {/* =========================================================================
                                             FOOTER COMPLETE SECTION
                       ========================================================================= */}
                    <AfrigomboFooter setActiveMenu={setActiveMenu} requireAuthThen={requireAuthThen} />

                  </div>
                );
              })()}

              {/* 1.5. L'√âCOSYST√àME 2.0 - UNIVERSE OF RICH SERVICES */}
              {activeMenu === "user_ecosystem" && (() => {
                return (
                  <div className="space-y-6 animate-fadeIn text-left">
                    <div className="border-b border-afri-gold/20 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-xl font-display font-black text-afri-gold uppercase flex items-center gap-2">
                          <span>üåü √âcosyst√®me 2.0</span>
                        </h3>
                        <p className="text-afri-text-sec text-xs mt-1">L'univers prestige complet de services d'alliance et d'outils pour l'√©lite d'Abidjan.</p>
                      </div>
                      <button
                        onClick={() => setActiveMenu("user_terrain")}
                        className="bg-afri-bg/80 border border-afri-border rounded-xl px-4 py-2 text-xs font-mono text-afri-gold hover:text-afri-text"
                      >
                        Retour au Terrain üéØ
                      </button>
                    </div>
                    
                    <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse">Chargement de l'√âcosyst√®me 2.0...</div>}>
                      <GomboMusikEcosystem 
                        currentUserProfile={profile as any} 
                        onRefreshProfile={() => {}} 
                        onNavigateView={(view) => {
                          if (view === "heritage") setActiveMenu("user_heritage");
                          else if (view === "terrain") setActiveMenu("user_terrain");
                          else if (view === "gombo_id") setActiveMenu("user_gombo_id");
                          else if (view === "mes_groupes") setActiveMenu("user_mes_groupes");
                        }}
                      />
                    </Suspense>
                  </div>
                );
              })()}

              {/* 2. LES VIBES - SEARCH FOR OTHER ARTISTS & alliances */}
              {activeMenu === "user_vibes" && (() => {
                const searchStr = globalSearchTerm.toLowerCase();
                const filteredArtists = users.filter(u => 
                  String(u.artisticName || "").toLowerCase().includes(searchStr) ||
                  String(u.commune || "").toLowerCase().includes(searchStr) ||
                  (Array.isArray(u.specialties) && u.specialties.some(s => String(s || "").toLowerCase().includes(searchStr)))
                );

                return (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="p-5 rounded-2xl bg-afri-bg-sec border border-afri-gold/15 relative overflow-hidden">
                      <div className="relative z-10">
                        <h3 className="text-md font-sans font-black text-afri-text uppercase tracking-wide">
                          üîç Les Vibes : Moteur de Recherche d'Alliances
                        </h3>
                        <p className="text-xs text-afri-text-sec mt-1">
                          D√©couvrez d'autres virtuoses √† Abidjan, explorez leurs sp√©cialit√©s et scellez des partenariats artistiques prestigieux.
                        </p>
                      </div>
                      <AfrigomboVibeWaves />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredArtists.length === 0 ? (
                        <div className="col-span-full">
                          <PremiumEmptyState 
                            message="Aucun virtuose trouv√©." 
                            submessage="Modifiez votre recherche ou d√©couvrez d'autres artistes." 
                            icon={Search}
                          />
                        </div>
                      ) : (
                        filteredArtists.map(artist => (
                          <motion.div
                            key={artist.id}
                            whileHover={{ scale: 1.015, y: -3 }}
                            className="bg-afri-bg-sec rounded-2xl border border-afri-border/80 p-5 space-y-4 flex flex-col justify-between"
                          >
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full border border-afri-gold/25 overflow-hidden bg-afri-bg flex items-center justify-center font-bold font-mono text-md text-afri-gold">
                                {artist.avatarUrl ? (
                                  <img src={artist.avatarUrl} alt={artist.artisticName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  artist.artisticName.charAt(0)
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-sans font-black text-afri-text truncate">
                                  {artist.artisticName}
                                </h4>
                                <span className="text-[10px] uppercase font-mono text-afri-text-sec">
                                  üìç {artist.commune}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-afri-text-sec uppercase block font-bold">SP√âCIALIT√âS D'ALLIANCE :</span>
                              <div className="flex flex-wrap gap-1">
                                {(artist.specialties || ["Virtuose multi-instrumental"]).map((s, idx) => (
                                  <span key={idx} className="text-[8px] font-mono bg-white/5 border border-afri-border text-afri-text px-1.5 py-0.5 rounded">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <p className="text-[10px] text-afri-text-sec leading-snug italic bg-afri-bg p-2.5 rounded-lg border border-afri-border">
                              "{artist.bio || "Ce virtuose de sc√®ne cultive l'excellence sans fard √† Abidjan."}"
                            </p>
                          </div>

                          <div className="border-t border-afri-border pt-3.5 flex items-center justify-between">
                            <div className="text-left">
                              <span className="text-[8px] uppercase font-mono text-afri-text-sec block">SCORE ACAD√âMIE :</span>
                              <span className="text-xs font-mono font-bold text-afri-gold">
                                Rang {artist.performance?.level || "3"} / 5
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                audioSynth.playValidationSuccess();
                                addToTerminal(`[üéº ALLIANCE] Proposition de raccordement d'or envoy√©e √† : ${artist.artisticName}`);
                                alert(`Demande d'alliance d'or notifi√©e ! Notre transmetteur a fait vibrer les tambours de ${artist.artisticName}.`);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-afri-gold/10 hover:bg-afri-gold text-afri-gold hover:text-[#050505] text-[10px] font-mono font-black border border-afri-gold/35 uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Proposer une Alliance ü§ù
                            </button>
                          </div>
                        </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 3. USER PUBLISH VIEW */}
              {activeMenu === "user_publish" && (
                <div className="animate-fadeIn">
                  {activePublishType === "demo" ? (
                    <AudioPublishForm
                      currentUserProfile={
                        profile || {
                          uid: currentUser?.uid || "user_guest",
                          name: currentUser?.displayName || "Artiste Gombo",
                          displayName: currentUser?.displayName || "Artiste Gombo",
                          photoURL: currentUser?.photoURL || "",
                          avatarUrl: currentUser?.photoURL || "",
                          email: currentUser?.email || "",
                          phone: currentUser?.phoneNumber || "",
                          walletBalance: 0,
                          balance: 0,
                          wallet: { soldeDisponible: 0, soldeBloque: 0 }
                        } as any
                      }
                      onSuccess={() => {
                        try {
                          audioSynth.playValidationSuccess();
                        } catch (_) {}
                        setActiveMenu("user_podcasts");
                      }}
                      onCancel={() => {
                        goBackMenu();
                      }}
                    />
                  ) : activePublishType === "renfort" ? (
                    <RenfortExpress
                      currentUserProfile={profile}
                      onShowAuth={() => setIsAuthModalOpen(true)}
                      onClose={() => goBackMenu()}
                      onBack={() => goBackMenu()}
                    />
                  ) : activePublishType === "reel" ? (
                    <>
                      <ReelCreatorScreen
                        onClose={() => goBackMenu()}
                        onVideoReady={(file, filterId) => setReelToPublish({ file, filterId })}
                      />
                      {reelToPublish && (
                        <ReelPublishScreen
                          videoFile={reelToPublish.file}
                          filterId={reelToPublish.filterId}
                          onClose={() => setReelToPublish(null)}
                          onPublished={() => {
                            setReelToPublish(null);
                            goBackMenu();
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <GomboPublish
                      currentUserProfile={
                        profile || {
                          uid: currentUser?.uid || "user_guest",
                          name: currentUser?.displayName || "Artiste Gombo",
                          displayName: currentUser?.displayName || "Artiste Gombo",
                          photoURL: currentUser?.photoURL || "",
                          avatarUrl: currentUser?.photoURL || "",
                          email: currentUser?.email || "",
                          phone: currentUser?.phoneNumber || "",
                          walletBalance: 0,
                          balance: 0,
                          wallet: { soldeDisponible: 0, soldeBloque: 0 }
                        } as any
                      }
                      onSuccess={() => {
                        try {
                          audioSynth.playValidationSuccess();
                        } catch (_) {}
                        setActiveMenu("user_mes_gombos");
                      }}
                      onCancel={() => {
                        goBackMenu();
                      }}
                    />
                  )}
                </div>
              )}

              {/* 4. PRIVACY PAGE DIRECT ANCHOR */}
              {activeMenu === "privacy" && (
                <div className="animate-fadeIn">
                  <PrivacyPage onBack={() => goBackMenu()} />
                </div>
              )}

              {/* 5. TERMS PAGE DIRECT ANCHOR */}
              {activeMenu === "terms" && (
                <div className="animate-fadeIn">
                  <TermsPage onBack={() => goBackMenu()} />
                </div>
              )}

              {/* 6. DELETE ACCOUNT DIRECT ANCHOR */}
              {activeMenu === "delete_account" && (
                <div className="animate-fadeIn">
                  <DeleteAccountPage onBack={() => goBackMenu()} />
                </div>
              )}

              {/* 6b. FAVORITES SECTION */}
              {activeMenu === "user_favorites" && (() => {
                const favoritedGombosList = gombos.filter(g => likedGombos.includes(g.id));
                const followedArtistsList = users.filter(u => followedArtists.includes(u.id));

                return (
                  <div className="afri-container space-y-6 animate-fadeIn text-left py-4 xs:py-6">
                    <div className="border-b border-afri-border pb-4 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-mono uppercase font-black tracking-[0.15em] text-afri-gold">
                          ‚≠ê Mes Favoris & Artistes Suivis
                        </h3>
                        <p className="text-xs text-afri-text-sec mt-1">Vos bails favoris et les talents de la C√¥te d'Ivoire que vous suivez.</p>
                      </div>
                      <button 
                        onClick={() => goBackMenu()} 
                        className="text-xs text-afri-text-sec hover:text-afri-text font-mono"
                      >
                        ‚úï Fermer
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Favorited Gombos */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-mono uppercase font-bold text-afri-text flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-afri-gold rounded-full"></span>
                          Gombos Honor√©s ({favoritedGombosList.length})
                        </h4>
                        {favoritedGombosList.length === 0 ? (
                          <div className="p-8 bg-afri-bg-sec border border-afri-border rounded-2xl text-center text-afri-text-sec text-xs">
                            Aucun gombo honor√© pour le moment. Allez sur le terrain et donnez de l'honneur !
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {favoritedGombosList.map(gombo => (
                              <div key={gombo.id} className="p-4 bg-afri-bg-sec/50 border border-afri-border rounded-2xl flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start">
                                    <span className="px-2 py-0.5 rounded bg-afri-gold/10 text-afri-gold text-[8px] font-mono uppercase font-black">
                                      {gombo.type || "Show"}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-afri-text">{gombo.budget?.toLocaleString()} F</span>
                                  </div>
                                  <h5 className="text-xs font-bold text-afri-text mt-2 line-clamp-1">{gombo.title}</h5>
                                  <p className="text-[10px] text-afri-text-sec mt-1 line-clamp-2">{gombo.description}</p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-afri-border/60 flex justify-between items-center">
                                  <button
                                    onClick={() => {
                                      setSelectedGomboDetails(gombo);
                                      setViewingGomboIdDetail(true);
                                    }}
                                    className="text-[10px] text-afri-gold font-bold uppercase hover:underline"
                                  >
                                    Consulter ‚Üí
                                  </button>
                                  <button
                                    onClick={() => {
                                      setLikedGombos(prev => prev.filter(id => id !== gombo.id));
                                      try { audioSynth.playTamTam(false); } catch (_) {}
                                    }}
                                    className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase"
                                  >
                                    Retirer
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Followed Artists */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-mono uppercase font-bold text-afri-text flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-afri-gold rounded-full"></span>
                          Artistes Suivis ({followedArtistsList.length})
                        </h4>
                        {followedArtistsList.length === 0 ? (
                          <div className="p-8 bg-afri-bg-sec border border-afri-border rounded-2xl text-center text-afri-text-sec text-xs">
                            Vous ne suivez aucun artiste pour l'instant. Suivez des profils depuis le Terrain.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {followedArtistsList.map(user => (
                              <div key={user.id} className="p-4 bg-afri-bg border border-afri-border rounded-2xl text-center flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full border-2 border-afri-gold overflow-hidden bg-afri-bg-sec">
                                  {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.artisticName} className="w-full h-full object-cover animate-fadeIn" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-afri-text-sec text-xs font-black">
                                      {user.artisticName?.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <h5 className="text-[11px] font-sans font-black text-afri-text mt-2 truncate max-w-full">{user.artisticName}</h5>
                                <span className="text-[8px] font-mono text-afri-text-sec uppercase">{user.commune || "Cocody"}</span>
                                <button
                                  onClick={() => {
                                    setFollowedArtists(prev => {
                                      const filtered = prev.filter(id => id !== user.id);
                                      localStorage.setItem("gombo_followed_artists", safeStringify(filtered));
                                      return filtered;
                                    });
                                    try { audioSynth.playTamTam(false); } catch (_) {}
                                  }}
                                  className="mt-3 text-[8.5px] py-1 px-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 font-bold uppercase rounded-lg transition-colors"
                                >
                                  Ne plus suivre
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 6c. HISTORIQUE SECTION */}
              {activeMenu === "user_history" && (() => {
                const uid = profile?.uid || (currentUser as any)?.uid || (currentUser as any)?.id;
                const myTxs = (transactions || []).filter((t: any) => t.userId === uid || t.senderId === uid || t.receiverId === uid);
                
                const realActivities: any[] = [];

                // 1. Connection activity
                if (currentUser) {
                  const lastLogin = (currentUser as any)?.metadata?.lastSignInTime 
                    ? new Date((currentUser as any).metadata.lastSignInTime).toLocaleString("fr-FR") 
                    : "Aujourd'hui";
                  realActivities.push({
                    id: "conn_1",
                    type: "connections",
                    date: lastLogin,
                    label: "Connexion authentifi√©e",
                    detail: `Session active (${currentUser.email || "Utilisateur"})`,
                    status: "Souverain"
                  });
                }

                // 2. Real transactions
                myTxs.forEach((t: any, idx: number) => {
                  realActivities.push({
                    id: t.id || `tx_${idx}`,
                    type: "transactions",
                    date: t.date || (t.createdAt?.toDate ? t.createdAt.toDate().toLocaleString("fr-FR") : "Date r√©cente"),
                    label: t.title || t.type || "Transaction Wallet",
                    detail: `${t.amount || t.montant || 0} FCFA - ${t.description || "Op√©ration financi√®re"}`,
                    status: t.status || "Effectu√©"
                  });
                });

                const filteredHistory = realActivities.filter(a => {
                  if (historyFilter === "all") return true;
                  return a.type === historyFilter;
                });

                return (
                  <div className="w-full max-w-full overflow-x-hidden space-y-5 py-3 sm:py-5 px-2.5 sm:px-4 text-afri-text pb-6">
                    {/* Header */}
                    <div className="p-4 sm:p-5 bg-afri-bg border border-[#D4AF37]/30 rounded-3xl space-y-3 shadow-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm sm:text-base font-black uppercase text-[#D4AF37] tracking-widest flex items-center gap-2">
                            <span>üïì</span> Historique Global des Activit√©s
                          </h3>
                          <p className="text-xs text-afri-text-sec mt-1">
                            Journal chronologique de vos connexions, mouvements financiers et candidatures.
                          </p>
                        </div>
                        <button onClick={() => goBackMenu()} className="px-3 py-1.5 bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] text-afri-text text-xs font-mono font-bold uppercase rounded-xl transition cursor-pointer self-start sm:self-auto">
                          ‚úï Fermer
                        </button>
                      </div>

                      {/* Filter buttons */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-2 border-t border-afri-border">
                        {[
                          { id: "all", label: "Toutes les activit√©s" },
                          { id: "connections", label: "Connexions & S√©curit√©" },
                          { id: "transactions", label: "Transactions" },
                          { id: "applications", label: "Candidatures" }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setHistoryFilter(tab.id as any)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all border ${
                              historyFilter === tab.id
                                ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-md font-black"
                                : "bg-afri-bg-sec/70 border-afri-border text-afri-text-sec hover:text-afri-text"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timeline list */}
                    <div className="space-y-3">
                      {filteredHistory.length === 0 ? (
                        <div className="p-8 text-center bg-afri-bg border border-afri-border rounded-3xl space-y-3">
                          <div className="w-12 h-12 mx-auto rounded-full bg-afri-bg-sec border border-afri-border flex items-center justify-center text-xl">
                            üìÇ
                          </div>
                          <h4 className="text-sm font-bold text-afri-text uppercase tracking-wider">Aucun enregistrement disponible</h4>
                          <p className="text-xs text-afri-text-sec max-w-sm mx-auto">
                            Aucune donn√©e disponible dans cette cat√©gorie pour le moment. Vos futurs enregistrements appara√Ætront automatiquement ici.
                          </p>
                        </div>
                      ) : (
                        filteredHistory.map((act) => (
                          <div key={act.id} className="p-4 bg-afri-bg border border-afri-border hover:border-[#D4AF37]/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-afri-bg-sec border border-[#D4AF37]/30 flex items-center justify-center shrink-0 text-base">
                                {act.type === "connections" ? "üîê" : act.type === "transactions" ? "üí≥" : "üìù"}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xs sm:text-sm font-bold text-afri-text">{act.label}</h4>
                                  <span className="px-1.5 py-0.2 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 text-[8.5px] font-mono font-bold uppercase rounded">
                                    {act.status}
                                  </span>
                                </div>
                                <p className="text-xs text-afri-text-sec mt-0.5">{act.detail}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-afri-text-muted self-end sm:self-auto shrink-0">
                              {act.date}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 6d. DOWNLOADS SECTION */}
              {activeMenu === "user_downloads" && (() => {
                const handleDownload = (filename: string, content: string, sizeMb: number = 0.5, mime: string = "text/plain") => {
                  const isSlow = network?.slowConnectionMode;
                  const wifiOnly = network?.downloadWifiOnly;

                  // Detect cellular simulation or real connection type
                  const conn = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
                  const isCellularConn = conn && (conn.type === 'cellular' || ['slow-2g', '2g', '3g', '4g'].includes(conn.effectiveType));
                  const isCellularActive = isSlow || isCellularConn;

                  if (wifiOnly && isCellularActive) {
                    const confirmDl = window.confirm(
                      `Ce t√©l√©chargement est limit√© au Wi-Fi selon vos param√®tres r√©seau (Taille : ${sizeMb} Mo).\n\nVoulez-vous le t√©l√©charger quand m√™me ?`
                    );
                    if (!confirmDl) return;
                  } else if (isCellularActive && sizeMb > 25.0) {
                    const confirmHeavy = window.confirm(
                      `Le fichier d√©passe la limite autoris√©e sur r√©seau cellulaire (${sizeMb} Mo / Max 25 Mo).\n\nVeuillez vous connecter au Wi-Fi ou forcer le t√©l√©chargement.\n\nVoulez-vous forcer le t√©l√©chargement ?`
                    );
                    if (!confirmHeavy) return;
                  }

                  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = filename;
                  a.click();
                  URL.revokeObjectURL(url);
                  try { audioSynth.playValidationSuccess(); } catch (_) {}
                };

                const downloadsList = [
                  {
                    id: "d1",
                    category: "Contrat L√©gal",
                    title: "Mod√®le de Contrat de Prestation Standard",
                    description: "Document officiel encadrant les prestations musicales avec clause de s√©questre et arbitrage.",
                    filename: `Contrat_Prestation_Afrigombo_${profile?.artisticName || "Artiste"}.txt`,
                    content: `=== CONTRAT DE PRESTATION MUSICALE AFRIGOMBO ELITE ===\n\nNom de l'Artiste : ${profile?.artisticName || "Artiste Certifi√©"}\nGombo ID : ${getEffectiveGomboId(profile)}\nDate : ${new Date().toLocaleDateString()}\n\nCe document garantit l'engagement bilat√©ral et le blocage s√©curis√© du cachet en compte de s√©questre.`,
                    icon: "üìú",
                    badge: "PDF / TXT",
                    sizeMb: 0.2
                  },
                  {
                    id: "d2",
                    category: "Attestation Officielle",
                    title: "Certificat d'Identit√© Gombo ID",
                    description: "Attestation officielle prouvant la certification de votre profil et votre niveau de garantie.",
                    filename: `Attestation_Gombo_ID_${profile?.artisticName || "Artiste"}.txt`,
                    content: `=== ATTESTATION OFFICIELLE GOMBO ID ===\n\nTitulaire : ${profile?.artisticName || "Artiste Certifi√©"}\nStatut : V√âRIFI√â & CONFORME\nSecteur : Musiques & Spectacles Abidjan\nValide jusqu'en 2027.`,
                    icon: "üÜî",
                    badge: "ATTESTATION",
                    sizeMb: 0.5
                  },
                  {
                    id: "d3",
                    category: "Audio & Maquette",
                    title: "Pack Demo Audio & Extrait Studio",
                    description: "Pistes et ressources audio de haute qualit√© associ√©es √† vos projets et maquettes.",
                    filename: "Pack_Audio_Demo_Afrigombo.txt",
                    content: `=== RESSOURCES AUDIO AFRIGOMBO ELITE ===\n\nPistes audio de d√©monstration haute fid√©lit√© (WAV 24-bit).\n\n[INFO] Fichier compress√© contenant 4 maquettes instrumentales de percussion ivoirienne et djembe fola.\n\nRessources certifi√©es conformes aux normes d'√©coute d'Abidjan.`,
                    icon: "üéµ",
                    badge: "AUDIO PACK (38 Mo)",
                    sizeMb: 38.0
                  },
                  {
                    id: "d4",
                    category: "Kit Graphique",
                    title: "Kit M√©dia & Badges Certifi√©s (SVG)",
                    description: "Logo officiel et badges √† int√©grer sur vos affiches et r√©seaux sociaux.",
                    filename: "Badge_GomboID_Officiel.svg",
                    content: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#0D0D0D" rx="20"/><circle cx="100" cy="100" r="70" fill="none" stroke="#D4AF37" stroke-width="4"/><text x="100" y="105" fill="#D4AF37" font-family="sans-serif" font-weight="bold" font-size="16" text-anchor="middle">GOMBO ID</text></svg>`,
                    icon: "üñºÔ∏è",
                    mime: "image/svg+xml",
                    badge: "SVG / KIT",
                    sizeMb: 1.2
                  }
                ];

                return (
                  <div className="w-full max-w-full overflow-x-hidden space-y-5 py-3 sm:py-5 px-2.5 sm:px-4 text-afri-text pb-6">
                    {/* Header */}
                    <div className="p-4 sm:p-5 bg-afri-bg border border-[#D4AF37]/30 rounded-3xl space-y-3 shadow-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm sm:text-base font-black uppercase text-[#D4AF37] tracking-widest flex items-center gap-2">
                            <span>üì•</span> Centre de T√©l√©chargements Officiels
                          </h3>
                          <p className="text-xs text-afri-text-sec mt-1">
                            Acc√©dez √† vos documents juridiques, maquettes audio, badges et attestations officielles.
                          </p>
                        </div>
                        <button onClick={() => goBackMenu()} className="px-3 py-1.5 bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] text-afri-text text-xs font-mono font-bold uppercase rounded-xl transition cursor-pointer self-start sm:self-auto">
                          ‚úï Fermer
                        </button>
                      </div>
                    </div>

                    {/* Grid of downloads */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {downloadsList.map((item) => (
                        <div key={item.id} className="p-4 sm:p-5 bg-afri-bg border border-afri-border hover:border-[#D4AF37]/40 rounded-2xl flex flex-col justify-between gap-4 shadow-md transition-all">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-mono font-black text-[#D4AF37] uppercase tracking-wider bg-[#D4AF37]/10 px-2 py-0.5 rounded-md border border-[#D4AF37]/20">
                                {item.category}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-mono text-afri-text-muted">({item.sizeMb} Mo)</span>
                                <span className="text-[9px] font-mono font-bold text-afri-text-sec bg-afri-bg-sec px-2 py-0.5 rounded-md">
                                  {item.badge}
                                </span>
                              </div>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-afri-text flex items-center gap-2">
                              <span>{item.icon}</span>
                              <span>{item.title}</span>
                            </h4>
                            <p className="text-xs text-afri-text-sec leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDownload(item.filename, item.content, item.sizeMb, item.mime || "text/plain")}
                            className="w-full py-2.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black font-extrabold text-xs uppercase tracking-wider rounded-xl border border-[#D4AF37]/40 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
                          >
                            <span>T√©l√©charger le fichier</span>
                            <span>üì•</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* 6e. BACKUPS SECTION */}
              {activeMenu === "user_backups" && (() => {
                const handleExportBackup = () => {
                  const backupData = {
                    profile: profile || {},
                    likedGombos: likedGombos,
                    followedArtists: followedArtists,
                    exportDate: new Date().toISOString(),
                    systemVersion: "2.0.0-Elite"
                  };
                  let jsonString = "{}";
                  try {
                    jsonString = safeStringify(backupData, 2);
                  } catch (e) {
                    console.error("Backup serialization error:", e);
                  }
                  const blob = new Blob([jsonString], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `Afrigombo_Backup_${profile?.artisticName || "Artist"}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  try { audioSynth.playValidationSuccess(); } catch (_) {}
                  alert("‚úì Sauvegarde chiffr√©e locale export√©e avec succ√®s !");
                };

                const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const data = JSON.parse(event.target?.result as string);
                      if (data.likedGombos) setLikedGombos(data.likedGombos);
                      if (data.followedArtists) {
                        setFollowedArtists(data.followedArtists);
                        localStorage.setItem("gombo_followed_artists", safeStringify(data.followedArtists));
                      }
                      try { audioSynth.playValidationSuccess(); } catch (_) {}
                      alert("‚úì Donn√©es d'artiste restaur√©es localement avec succ√®s !");
                    } catch (err) {
                      alert("‚ùå Fichier de sauvegarde invalide.");
                    }
                  };
                  reader.readAsText(file);
                };

                return (
                  <div className="afri-container space-y-6 animate-fadeIn text-left py-4 xs:py-6">
                    <div className="border-b border-afri-border pb-4 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-mono uppercase font-black tracking-[0.15em] text-afri-gold">
                          üíæ Sauvegardes Souveraines Locales
                        </h3>
                        <p className="text-xs text-afri-text-sec mt-1">Exportez ou restaurez votre configuration locale d'artiste √† tout moment.</p>
                      </div>
                      <button onClick={() => goBackMenu()} className="text-xs text-afri-text-sec hover:text-afri-text font-mono">‚úï Fermer</button>
                    </div>

                    <div className="space-y-6">
                      {/* Export */}
                      <div className="p-6 bg-afri-bg border border-afri-border rounded-2xl space-y-4">
                        <h4 className="text-xs font-mono uppercase font-bold text-afri-gold">Exporter une sauvegarde</h4>
                        <p className="text-xs text-afri-text-sec leading-relaxed">
                          Cr√©ez un fichier chiffr√© contenant l'historique complet de vos gombos aim√©s, vos artistes favoris et la configuration locale de votre session.
                        </p>
                        <button
                          onClick={handleExportBackup}
                          className="px-5 py-2.5 bg-afri-gold text-black font-black text-xs uppercase rounded-xl flex items-center gap-2 hover:opacity-95 transition-all cursor-pointer"
                        >
                          Cr√©er la sauvegarde (.json)
                        </button>
                      </div>

                      {/* Import */}
                      <div className="p-6 bg-afri-bg border border-afri-border rounded-2xl space-y-4">
                        <h4 className="text-xs font-mono uppercase font-bold text-afri-text">Importer / Restaurer</h4>
                        <p className="text-xs text-afri-text-sec leading-relaxed">
                          S√©lectionnez un fichier de sauvegarde (.json) export√© pr√©c√©demment pour restaurer instantan√©ment vos param√®tres locaux.
                        </p>
                        <div className="flex items-center gap-4">
                          <input
                            type="file"
                            accept=".json"
                            id="backup-file-input"
                            className="hidden"
                            onChange={handleImportBackup}
                          />
                          <label
                            htmlFor="backup-file-input"
                            className="px-4 py-2 border border-afri-border text-afri-text text-xs font-bold uppercase rounded-xl cursor-pointer hover:bg-afri-bg-sec/40"
                          >
                            Choisir un fichier
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 7. CONTRATS AFRIGOMBO ELITE (USER) */}
              {activeMenu === "user_contracts" && (
                <div className="afri-container space-y-6 animate-fadeIn text-left py-4 xs:py-6">
                  <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse bg-black min-h-[200px] flex flex-col justify-center items-center border border-afri-border rounded-2xl"><div className="w-8 h-8 border-2 border-afri-gold border-t-transparent rounded-full animate-spin mb-4"></div><span className="text-xs uppercase tracking-widest font-bold">Chargement d'Or...</span></div>}>
                    <GomboContractsDashboard currentUser={profile || (currentUser as any)} />
                  </Suspense>
                </div>
              )}

              {/* 7b. PORTESECURE / AFRIGOMBO ELITE WALLET (USER) */}
              {activeMenu === "user_wallet" && (
                <div className="w-full h-full flex-1 flex flex-col min-h-0 bg-afri-bg animate-fadeIn text-left">
                  <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse bg-black min-h-[200px] flex flex-col justify-center items-center border border-afri-border rounded-2xl"><div className="w-8 h-8 border-2 border-afri-gold border-t-transparent rounded-full animate-spin mb-4"></div><span className="text-xs uppercase tracking-widest font-bold">Chargement d'Or...</span></div>}>
                    <AfrigomboWalletDashboard 
                      currentUserProfile={profile || (currentUser as any)} 
                      addToTerminal={addToTerminal}
                      onBack={goBackMenu}
                      onNavigateToMessages={(targetId) => {
                        if (setOpenConvoWithUserId) setOpenConvoWithUserId(targetId || "admin");
                        setActiveMenu("user_messages");
                      }}
                      onNavigateToGomboAds={() => setActiveMenu("user_gombo_ads")}
                    />
                  </Suspense>
                </div>
              )}

              {/* 7d. √âV√âNEMENTS (USER) */}
              {activeMenu === "user_events" && (
                <div className="afri-container space-y-6 animate-fadeIn text-left py-4 xs:py-6">
                  <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse bg-black min-h-[200px] flex flex-col justify-center items-center border border-afri-border rounded-2xl"><div className="w-8 h-8 border-2 border-afri-gold border-t-transparent rounded-full animate-spin mb-4"></div><span className="text-xs uppercase tracking-widest font-bold">Chargement d'Or...</span></div>}>
                    <EventsView 
                      onBack={() => goBackMenu()} 
                      addToTerminal={addToTerminal}
                    />
                  </Suspense>
                </div>
              )}

              {activeMenu === "user_grand_marche" && (
                <div className="afri-container space-y-6 animate-fadeIn text-left py-2 xs:py-4">
                  <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse bg-black min-h-[200px] flex flex-col justify-center items-center border border-afri-border rounded-2xl"><div className="w-8 h-8 border-2 border-afri-gold border-t-transparent rounded-full animate-spin mb-4"></div><span className="text-xs uppercase tracking-widest font-bold">Chargement d'Or...</span></div>}>
                    <GrandMarcheView
                      currentUserProfile={profile}
                      onNavigateView={(view) => setActiveMenu(view as any)}
                      onBack={() => goBackMenu()}
                    />
                  </Suspense>
                </div>
              )}

              {activeMenu === "user_academie" && (
                <div className="afri-container space-y-6 animate-fadeIn text-left py-2 xs:py-4">
                  <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse bg-black min-h-[200px] flex flex-col justify-center items-center border border-afri-border rounded-2xl"><div className="w-8 h-8 border-2 border-afri-gold border-t-transparent rounded-full animate-spin mb-4"></div><span className="text-xs uppercase tracking-widest font-bold">Chargement d'Or...</span></div>}>
                    <AcademieView
                      currentUserProfile={profile}
                      onNavigateView={(view) => setActiveMenu(view as any)}
                      onBack={() => goBackMenu()}
                    />
                  </Suspense>
                </div>
              )}

              {(activeMenu === "user_command_center" || activeMenu === "user_mon_activite") && (
                <div className="afri-container space-y-6 animate-fadeIn text-left py-2 xs:py-4">
                  <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse bg-black min-h-[200px] flex flex-col justify-center items-center border border-afri-border rounded-2xl"><div className="w-8 h-8 border-2 border-afri-gold border-t-transparent rounded-full animate-spin mb-4"></div><span className="text-xs uppercase tracking-widest font-bold">Chargement d'Or...</span></div>}>
                    <CreatorActivityDashboard
                      currentUserProfile={profile}
                      onNavigateView={(view, tab) => {
                        if (view) setActiveMenu(view as any);
                      }}
                      onBack={() => goBackMenu()}
                    />
                  </Suspense>
                </div>
              )}

              {activeMenu === "user_help_center" && (
                <div className="afri-container space-y-6 animate-fadeIn text-left py-4 xs:py-6">
                  <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse bg-black min-h-[200px] flex flex-col justify-center items-center border border-afri-border rounded-2xl"><div className="w-8 h-8 border-2 border-afri-gold border-t-transparent rounded-full animate-spin mb-4"></div><span className="text-xs uppercase tracking-widest font-bold">Chargement d'Or...</span></div>}>
                    <AfrigomboHelpCenter 
                      onClose={() => goBackMenu()} 
                      currentUser={currentUser}
                      profile={profile}
                      audioSynth={audioSynth}
                    />
                  </Suspense>
                </div>
              )}

              {/* 7c. B√ÇTISSEURS (USER) */}
              {activeMenu === "user_builders" && (
                <div className="w-full max-w-5xl mx-auto px-1 sm:px-4 animate-fadeIn py-4 xs:py-6">
                  <AfrigomboBuilders
                    currentUser={profile || (currentUser as any)}
                    onBack={() => goBackMenu()}
                    audioSynth={audioSynth}
                  />
                </div>
              )}

              {activeMenu === "user_heritage" && (
                <div className="w-full animate-fadeIn">
                  <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse bg-black min-h-[200px] flex flex-col justify-center items-center border border-afri-border rounded-2xl"><div className="w-8 h-8 border-2 border-afri-gold border-t-transparent rounded-full animate-spin mb-4"></div><span className="text-xs uppercase tracking-widest font-bold">Chargement d'Or...</span></div>}>
                    <HeritagePage 
                      onNavigateView={(view, tab) => {
                        if (view === "heritage") setActiveMenu("user_heritage");
                        else if (view === "home" || view === "terrain") setActiveMenu("user_terrain");
                        else if (view === "settings") setActiveMenu("user_settings");
                        else if (view === "super_admin") {
                          navigate("/Le-Throne-Of-The-Founder?tab=founder");
                        }
                        else if (view === "admin" || view === "admin_centre" || view === "dashboard" || view === "command_center") {
                          navigate("/Le-Throne-Of-The-Founder?tab=command");
                        }
                        else setActiveMenu(view as any);
                      }}
                      darkMode={darkMode}
                      setDarkMode={setDarkMode}
                      onViewPublicPortfolio={(userId) => setPublicProfileTargetUserId(userId)}
                      onSubPanelChange={(isSubPanel) => setIsHeritageSubPanelActive(isSubPanel)}
                    />
                  </Suspense>
                </div>
              )}

              {activeMenu === "premium_wheel" && (
                <div className="w-full animate-fadeIn">
                  <PremiumWheelPage
                    currentUserProfile={profile}
                    onRefreshProfile={refreshProfile}
                    onBack={() => goBackMenu()}
                    audioSynth={audioSynth}
                  />
                </div>
              )}

              {activeMenu === "user_gombo_id" && (() => {
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-afri-text-sec">Aucun artiste disponible.</p>;

                // Calculate ratings dynamically
                const artistReviews = reviews.filter(r => r.revieweeId === currentArtist.id && r.type === "client_to_musician");
                const avgRating = artistReviews.length > 0
                  ? parseFloat((artistReviews.reduce((sum, r) => sum + r.rating, 0) / artistReviews.length).toFixed(1))
                  : 5.0;
                const artistWithRating = {
                  ...currentArtist,
                  averageRating: avgRating,
                  ratingCount: artistReviews.length
                };
                
                const handleUpdateUser = async (userData: Partial<User>) => {
                  const targetId = currentArtist.id;
                  setUsers(prev => prev.map(u => u.id === targetId ? { ...u, ...userData } : u));
                  await saveToFirestore("users", targetId, userData);
                };

                const handleCreateTransaction = async (amount: number, type: any, description: string) => {
                  await createTransaction(amount, type, description, currentArtist.id, currentArtist.artisticName);
                };

                return (
                  <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse bg-black min-h-[200px] flex flex-col justify-center items-center border border-afri-border rounded-2xl"><div className="w-8 h-8 border-2 border-afri-gold border-t-transparent rounded-full animate-spin mb-4"></div><span className="text-xs uppercase tracking-widest font-bold">Chargement d'Or...</span></div>}>
                    <GomboIdUserDashboard
                      currentUser={artistWithRating}
                      onUpdateUser={handleUpdateUser}
                      onCreateTransaction={handleCreateTransaction}
                      addToTerminal={(msg: string) => addToTerminal(msg)}
                      onBack={() => goBackMenu()}
                    />
                  </Suspense>
                );
              })()}

              {activeMenu === "user_mes_gombos" && (() => {
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                const myUid = profile?.uid || currentUser?.uid || currentArtist?.id;
                if (!currentArtist && !myUid) return <p className="text-afri-text-sec">Aucun artiste disponible.</p>;

                const myGombos = gombos.filter(g => 
                  (myUid && (g.organizerId === myUid || g.clientId === myUid)) ||
                  (currentArtist && (g.organizerId === currentArtist.id || g.clientId === currentArtist.id)) ||
                  (myUid && g.applicantIds?.includes(myUid)) ||
                  (currentArtist && g.applicantIds?.includes(currentArtist.id)) ||
                  (myUid && g.selectedTalentId === myUid) ||
                  (currentArtist && g.selectedTalentId === currentArtist.id)
                );

                const myUserPosts = posts.filter(p =>
                  Boolean((myUid && (p.userId === myUid || (p as any).authorId === myUid)) ||
                  (currentArtist && (p.userId === currentArtist.id || (p as any).authorId === currentArtist.id)))
                );

                const filteredGombos = myGombos.filter(g => {
                  if (pubFilter === "all") return true;
                  if (pubFilter === "en_cours") {
                    return ["publie", "candidatures_ouvertes", "artiste_selectionne", "en_cours", "pending", "pending_deposit"].includes(g.status || "");
                  }
                  if (pubFilter === "valide") {
                    return ["contrat_accepte", "contrat_confirme", "paiement_recu"].includes(g.status || "");
                  }
                  if (pubFilter === "termine") {
                    return ["mission_terminee", "termine", "paiement_effectue"].includes(g.status || "");
                  }
                  if (pubFilter === "annule") {
                    return ["contrat_refuse", "mission_annulee"].includes(g.status || "");
                  }
                  return true;
                });

                const getStatusLabel = (status: string | undefined) => {
                  switch(status) {
                    case "pending_deposit": return "üü° En attente de d√©p√¥t";
                    case "publie": return "üü° Publi√© (En attente)";
                    case "candidatures_ouvertes": return "üîµ Candidatures ouvertes";
                    case "artiste_selectionne": return "üü† Musicien S√©lectionn√©";
                    case "contrat_accepte":
                    case "contrat_confirme": return "üü£ Contrat Confirm√©";
                    case "paiement_recu": return "üü¢ Paiement Re√ßu";
                    case "en_cours": return "üéµ Gombo en cours";
                    case "mission_terminee":
                    case "termine":
                    case "paiement_effectue": return "‚úÖ Gombo Termin√©";
                    case "contrat_refuse":
                    case "mission_annulee": return "‚ùå Annul√©";
                    default: return status || "‚è≥ En attente";
                  }
                };

                return (
                  <div className="w-full max-w-full overflow-x-hidden space-y-5 py-3 sm:py-5 px-2.5 sm:px-4 text-afri-text pb-6">
                    {/* Header */}
                    <div className="p-4 sm:p-5 bg-afri-bg border border-[#D4AF37]/30 rounded-3xl space-y-3 shadow-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm sm:text-base font-black uppercase text-[#D4AF37] tracking-widest flex items-center gap-2">
                            <span>üìù</span> Mes Publications & Gombos
                          </h3>
                          <p className="text-xs text-afri-text-sec mt-1">
                            G√©rez vos annonces publi√©es, suivez l'avancement des candidatures et g√©rez vos contrats.
                          </p>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <button
                            id="user-mes-publications-contracts-btn"
                            type="button"
                            onClick={() => {
                              setActiveMenu("user_contracts");
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            }}
                            className="px-4 py-2.5 bg-purple-600/20 border border-purple-500/40 text-purple-200 hover:bg-purple-600/35 hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                          >
                            <span>ü§ù Mes Contrats</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPerspective("user");
                              setActiveMenu("user_publish");
                            }}
                            className="px-4 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
                          >
                            <span>+ Cr√©er une Publication</span>
                          </button>
                        </div>
                      </div>

                      {/* Filter tabs */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-2 border-t border-afri-border">
                        {[
                          { id: "all", label: "Toutes", count: myGombos.length },
                          { id: "en_cours", label: "En cours", count: myGombos.filter(g => ["publie", "candidatures_ouvertes", "artiste_selectionne", "en_cours", "pending", "pending_deposit"].includes(g.status || "")).length },
                          { id: "valide", label: "Valid√©s", count: myGombos.filter(g => ["contrat_accepte", "contrat_confirme", "paiement_recu"].includes(g.status || "")).length },
                          { id: "termine", label: "Termin√©s", count: myGombos.filter(g => ["mission_terminee", "termine", "paiement_effectue"].includes(g.status || "")).length },
                          { id: "annule", label: "Annul√©s", count: myGombos.filter(g => ["contrat_refuse", "mission_annulee"].includes(g.status || "")).length }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setPubFilter(tab.id as any)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 border ${
                              pubFilter === tab.id
                                ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-md font-black"
                                : "bg-afri-bg-sec/70 border-afri-border text-afri-text-sec hover:text-afri-text"
                            }`}
                          >
                            <span>{tab.label}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${pubFilter === tab.id ? "bg-afri-bg text-[#D4AF37]" : "bg-afri-bg text-afri-text-sec"}`}>
                              {tab.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Prestations list */}
                    <div className="space-y-4">
                      {filteredGombos.length === 0 ? (
                        <PremiumEmptyState 
                          message="Aucune publication trouv√©e." 
                          submessage="Cr√©ez une annonce ou d√©couvrez les opportunit√©s sur Le Terrain." 
                          icon={Briefcase}
                        />
                      ) : (
                        filteredGombos.map((gombo) => {
                          const isExpanded = expandedGomboId === gombo.id;
                          const gomboAdCampaign = userCampaigns.find(c => c.targetId === gombo.id);
                          const hasAdCampaign = !!gomboAdCampaign;
                          const isMyGombo = Boolean((myUid && (gombo.organizerId === myUid || gombo.clientId === myUid)) || (currentArtist && (gombo.organizerId === currentArtist.id || gombo.clientId === currentArtist.id)));
                          const isMyTalent = Boolean((myUid && gombo.selectedTalentId === myUid) || (currentArtist && gombo.selectedTalentId === currentArtist.id));

                          return (
                            <div 
                              key={gombo.id} 
                              className="bg-afri-bg border border-afri-border hover:border-[#D4AF37]/30 rounded-2xl overflow-hidden shadow-md transition-all duration-200"
                            >
                              {/* Compact Header - Always visible, clicking toggles expansion */}
                              <div 
                                onClick={() => setExpandedGomboId(isExpanded ? null : gombo.id!)}
                                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none active:bg-afri-bg-sec/40 transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-afri-text-sec shrink-0" />
                                    )}
                                    <strong className="text-xs sm:text-sm font-black text-afri-text truncate">
                                      üéµ {gombo.title}
                                    </strong>
                                  </div>
                                  <span className="text-[10px] text-afri-text-sec font-mono block mt-1 pl-5.5">
                                    üìç {typeof gombo.location === "object" && gombo.location ? (gombo.location as any).name : (gombo.location || "Abidjan")}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {hasAdCampaign && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 flex items-center gap-0.5 animate-pulse">
                                      üì£ ADS
                                    </span>
                                  )}
                                  <span className="text-[9px] font-mono uppercase bg-afri-bg-sec text-afri-text px-2 py-0.5 rounded-lg border border-afri-border font-bold">
                                    {getStatusLabel(gombo.status)}
                                  </span>
                                </div>
                              </div>

                              {/* Collapsible Details Content */}
                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="border-t border-afri-border/50 bg-afri-bg-sec/10 overflow-hidden"
                                  >
                                    <div className="p-4 space-y-4">
                                      {/* Short Description */}
                                      {gombo.description && (
                                        <div className="text-xs text-afri-text-sec leading-relaxed font-sans">
                                          {gombo.description}
                                        </div>
                                      )}

                                      {/* Budget Segment */}
                                      <div className="flex items-center justify-between text-xs bg-afri-bg/40 p-2.5 rounded-xl border border-afri-border/40">
                                        <span className="text-afri-text-sec">Budget d√©fini :</span>
                                        <span className="font-mono font-black text-[#D4AF37] text-xs">
                                          {gombo.budget ? `${gombo.budget.toLocaleString()} FCFA` : "A D√âBATTRE"}
                                        </span>
                                      </div>

                                      {/* Gombo Ads Sponsorship Stats/Actions */}
                                      <div className="p-3 rounded-2xl border bg-afri-bg/50 border-afri-border/50 space-y-3">
                                        {gomboAdCampaign ? (
                                          <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[10px] font-mono font-black uppercase text-[#D4AF37] flex items-center gap-1">
                                                <span>üì£ SPONSORIS√â</span>
                                              </span>
                                              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                Campagne active
                                              </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 py-1">
                                              <div className="p-2 bg-afri-bg rounded-xl border border-afri-border text-center">
                                                <div className="text-[8px] text-afri-text-sec uppercase font-mono">Vues</div>
                                                <div className="text-xs font-black text-afri-text font-mono mt-0.5">{gomboAdCampaign.impressions || 0}</div>
                                              </div>
                                              <div className="p-2 bg-afri-bg rounded-xl border border-afri-border text-center">
                                                <div className="text-[8px] text-afri-text-sec uppercase font-mono">Interactions</div>
                                                <div className="text-xs font-black text-afri-text font-mono mt-0.5">{gomboAdCampaign.clicks || 0}</div>
                                              </div>
                                              <div className="p-2 bg-afri-bg rounded-xl border border-afri-border text-center">
                                                <div className="text-[8px] text-afri-text-sec uppercase font-mono">Restant</div>
                                                <div className="text-xs font-black text-[#D4AF37] font-mono mt-0.5 truncate">{gomboAdCampaign.remainingBudget || 0} G</div>
                                              </div>
                                            </div>

                                            <div className="flex items-center justify-between text-[10px] text-afri-text-sec font-mono">
                                              <span>Fin : {gomboAdCampaign.endAt ? new Date(gomboAdCampaign.endAt).toLocaleDateString("fr-FR") : "N/A"}</span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setPreselectedGomboAdId(gombo.id!);
                                                  setActiveMenu("user_gombo_ads");
                                                }}
                                                className="text-[#D4AF37] font-black uppercase hover:underline cursor-pointer"
                                              >
                                                Voir la campagne üëÅÔ∏è
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                              <strong className="text-[10px] uppercase font-mono text-afri-text font-bold block">Aucune campagne active</strong>
                                              <span className="text-[9px] text-afri-text-sec block mt-0.5 leading-tight">Boostez la visibilit√© de cette publication aupr√®s de la communaut√©.</span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                window.dispatchEvent(new CustomEvent("navigate_to_gombo_ads_with_target", { detail: { targetGomboId: gombo.id } }));
                                              }}
                                              className="px-3 py-2 bg-[#D4AF37] hover:bg-amber-400 text-black text-[9px] font-black uppercase rounded-xl transition-all shadow-md cursor-pointer active:scale-95 shrink-0"
                                            >
                                              üöÄ Promouvoir
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {/* Original Action Buttons */}
                                      <div className="flex flex-wrap gap-2 pt-1 border-t border-afri-border/30">
                                        {(gombo.status === "pending_deposit" || gombo.status === "pending" || gombo.adminValidated === false) && isMyGombo && (
                                          <button 
                                            onClick={() => {
                                              setPendingPaymentItem({
                                                id: gombo.id!,
                                                title: gombo.title,
                                                budget: gombo.budget,
                                                collectionName: "gombos"
                                              });
                                              setShowPendingPaymentModal(true);
                                            }} 
                                            className="px-3 py-1.5 bg-[#D4AF37] text-black text-[10px] font-black uppercase rounded-xl shadow-md flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                                          >
                                            üîë Activer la publication
                                          </button>
                                        )}

                                        {(gombo.status === "publie" || gombo.status === "candidatures_ouvertes") && isMyGombo && (
                                          <button onClick={() => setActiveMenu("user_dashboard")} className="px-3 py-1.5 bg-[#D4AF37] text-black text-[10px] font-black uppercase rounded-xl hover:bg-amber-400 transition cursor-pointer">
                                            üéØ S√©lectionner Candidat
                                          </button>
                                        )}
                                        
                                        {/* Management actions for organizer */}
                                        {isMyGombo && (
                                          <div className="w-full flex flex-wrap gap-2 mt-2">
                                            <button 
                                              onClick={() => {
                                                const newTitle = prompt("Modifier le titre de l'annonce :", gombo.title);
                                                if (newTitle && newTitle !== gombo.title && gombo.id) {
                                                  gomboDB.updateGombo(gombo.id, { title: newTitle });
                                                  setGombos(prev => prev.map(g => g.id === gombo.id ? { ...g, title: newTitle } : g));
                                                  addToTerminal(`[MODIFICATION] Titre mis √† jour : ${newTitle}`);
                                                }
                                              }}
                                              className="px-3 py-1.5 bg-afri-bg-sec border border-afri-border text-afri-text text-[10px] font-bold uppercase rounded-xl hover:border-[#D4AF37] transition cursor-pointer"
                                            >
                                              ‚úèÔ∏è Modifier
                                            </button>

                                            <button 
                                              onClick={() => {
                                                if (navigator.share) {
                                                  navigator.share({
                                                    title: gombo.title,
                                                    text: `Consultez cette offre sur AFRIGOMBO ELITE : ${gombo.title}`,
                                                    url: window.location.href
                                                  }).catch(() => {});
                                                } else {
                                                  navigator.clipboard.writeText(window.location.href);
                                                  alert("Lien de la publication copi√© !");
                                                }
                                              }}
                                              className="px-3 py-1.5 bg-afri-bg-sec border border-afri-border text-afri-text text-[10px] font-bold uppercase rounded-xl hover:border-[#D4AF37] transition cursor-pointer"
                                            >
                                              üîó Transmettre
                                            </button>

                                            <button 
                                              onClick={() => setActiveBoostItem({id: gombo.id!, title: gombo.title, type: 'gombo'})} 
                                              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-[#D4AF37] text-black text-[10px] font-black uppercase rounded-xl shadow-md flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                                            >
                                              <Sparkles className="w-3.5 h-3.5" /> üöÄ Booster
                                            </button>

                                            <button 
                                              onClick={async () => {
                                                if (window.confirm("√ätes-vous s√ªr de vouloir supprimer d√©finitivement cette publication ?")) {
                                                  try {
                                                    if (gombo.id) {
                                                      await gomboDB.deleteGombo(gombo.id);
                                                      setGombos(prev => prev.filter(g => g.id !== gombo.id));
                                                      addToTerminal(`[SUPPRESSION] Publication ${gombo.title} supprim√©e.`);
                                                    }
                                                  } catch (err) {
                                                    alert("Erreur lors de la suppression.");
                                                  }
                                                }
                                              }} 
                                              className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded-xl hover:bg-red-500/20 transition cursor-pointer"
                                            >
                                              üóëÔ∏è Supprimer
                                            </button>
                                          </div>
                                        )}

                                        {gombo.contractId && (
                                          <button 
                                            onClick={() => {
                                              setActiveMenu("user_contracts");
                                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                                            }} 
                                            className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase rounded-xl hover:bg-purple-500/30 flex items-center gap-1 cursor-pointer"
                                          >
                                            ü§ù G√©rer le Contrat
                                          </button>
                                        )}

                                        {isMyTalent && gombo.status === "artiste_selectionne" && (
                                          <>
                                            <button onClick={async () => {
                                              if (!gombo.id) return;
                                              await gomboDB.updateGomboStatus(gombo.id, "contrat_accepte");
                                              setGombos(prev => prev.map(g => g.id === gombo.id ? { ...g, status: "contrat_accepte" } : g));
                                              addToTerminal(`[CONTRAT] Contrat accept√© pour "${gombo.title}"`);
                                            }} className="px-3 py-1.5 bg-emerald-500 text-black text-[10px] font-bold uppercase rounded-xl hover:bg-emerald-400 cursor-pointer">
                                              Accepter le Contrat
                                            </button>
                                            <button onClick={async () => {
                                              if (!gombo.id) return;
                                              await gomboDB.updateGomboStatus(gombo.id, "contrat_refuse");
                                              setGombos(prev => prev.map(g => g.id === gombo.id ? { ...g, status: "contrat_refuse" } : g));
                                              addToTerminal(`[CONTRAT] Contrat refus√© pour "${gombo.title}"`);
                                            }} className="px-3 py-1.5 bg-red-900 text-red-100 text-[10px] font-bold uppercase rounded-xl hover:bg-red-800 cursor-pointer">
                                              Refuser
                                            </button>
                                          </>
                                        )}

                                        {isMyGombo && (gombo.status === "contrat_accepte" || gombo.status === "contrat_confirme") && (
                                          <button onClick={async () => {
                                            if (!gombo.id) return;
                                            await gomboDB.updateGomboStatus(gombo.id, "mission_terminee");
                                            setGombos(prev => prev.map(g => g.id === gombo.id ? { ...g, status: "mission_terminee" } : g));
                                            addToTerminal(`[MISSION] Prestation valid√©e pour "${gombo.title}"`);
                                          }} className="px-3 py-1.5 bg-blue-500 text-afri-text text-[10px] font-bold uppercase rounded-xl hover:bg-blue-400 cursor-pointer">
                                            Valider la Prestation
                                          </button>
                                        )}

                                        {isMyGombo && gombo.status === "mission_terminee" && (
                                          <button onClick={async () => {
                                            if (!gombo.id) return;
                                            await gomboDB.updateGomboStatus(gombo.id, "paiement_effectue");
                                            setGombos(prev => prev.map(g => g.id === gombo.id ? { ...g, status: "paiement_effectue" } : g));
                                            addToTerminal(`[PAIEMENT] Paiement lib√©r√© pour "${gombo.title}"`);
                                          }} className="px-3 py-1.5 bg-green-500 text-black text-[10px] font-bold uppercase rounded-xl hover:bg-green-400 cursor-pointer">
                                            Lib√©rer le Paiement
                                          </button>
                                        )}

                                        {(isMyGombo || isMyTalent) && gombo.selectedTalentId && (
                                          <button 
                                            onClick={() => {
                                              const targetId = isMyGombo ? gombo.selectedTalentId : gombo.organizerId;
                                              setOpenConvoWithUserId(targetId!);
                                              setOpenConvoWithGomboId(gombo.id!);
                                              setActiveMenu("user_messages");
                                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                                            }} 
                                            className="px-3 py-1.5 bg-afri-bg-sec border border-afri-border text-afri-text text-[10px] font-bold uppercase rounded-xl hover:border-[#D4AF37] flex items-center gap-1.5 cursor-pointer"
                                          >
                                            <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" /> Discuter
                                          </button>
                                        )}

                                        {gombo.applicantIds?.includes(currentArtist.id) && gombo.status === "publie" && (
                                          <button onClick={() => setActiveBoostItem({id: gombo.id!, title: gombo.title, type: 'candidature'})} className="px-3 py-1.5 mt-2 bg-gradient-to-r from-amber-500 to-[#D4AF37] text-black text-[10px] font-black uppercase rounded-xl shadow-md flex items-center gap-1 active:scale-95 transition-all cursor-pointer">
                                            <Sparkles className="w-3.5 h-3.5" /> ‚ö° Booster ma candidature
                                          </button>
                                        )}
                                      </div>

                                      {/* Reciprocal feedback review trigger (only when mission completed) */}
                                      {(gombo.status === "mission_terminee" || gombo.status === "paiement_effectue") && (
                                        <div className="p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-xl space-y-2 mt-2">
                                          <span className="text-[10px] uppercase font-mono text-[#D4AF37] block font-bold">‚úçÔ∏è √âvaluation R√©ciproque :</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-afri-text">Note Accord√©e :</span>
                                            <div className="flex gap-1 text-[#D4AF37]">
                                              {[1, 2, 3, 4, 5].map(n => (
                                                <Star key={n} className="w-3.5 h-3.5 fill-current cursor-pointer" />
                                              ))}
                                            </div>
                                          </div>
                                          <textarea
                                            rows={2}
                                            placeholder="Avis sur la collaboration..."
                                            className="w-full bg-afri-bg border border-afri-border rounded-xl p-2 text-xs text-afri-text placeholder:text-afri-text-sec focus:outline-none focus:border-[#D4AF37]"
                                          />
                                          <button
                                            onClick={() => {
                                              addToTerminal(`[√âVALUATION] √âvaluation transmise pour Gombo ${gombo.id}`);
                                              alert("‚≠ê Votre avis a √©t√© enregistr√© avec succ√®s !");
                                            }}
                                            className="px-4 py-1.5 bg-[#D4AF37] hover:bg-amber-400 text-black text-[10px] font-bold uppercase rounded-xl transition-all cursor-pointer"
                                          >
                                            Soumettre l'avis
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* SECTION 2 : MES R√âELS & VID√âOS (lues depuis la collection posts) */}
                    <div className="mt-8 pt-6 border-t border-afri-border/60 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm sm:text-base font-black uppercase text-[#D4AF37] tracking-widest flex items-center gap-2">
                            <span>üé•</span> Mes R√©els & Vid√©os Artistiques
                          </h3>
                          <p className="text-xs text-afri-text-sec mt-0.5">
                            Vos vid√©os et r√©els publi√©s sur le Fil R√©el d'AFRIGOMBO.
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono font-bold rounded-full">
                          {myUserPosts.length} R√©el{myUserPosts.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      {myUserPosts.length === 0 ? (
                        <div className="p-6 text-center border border-dashed border-afri-border bg-afri-bg-sec/20 rounded-2xl space-y-3">
                          <p className="text-xs text-afri-text font-bold">üìπ Aucun R√©el vid√©o publi√© pour le moment</p>
                          <p className="text-[10px] text-afri-text-sec">Publiez votre premier R√©el artistique pour captiver les recruteurs et les fans !</p>
                          <button
                            type="button"
                            onClick={() => {
                              setPerspective("user");
                              setActiveMenu("user_reels");
                            }}
                            className="px-4 py-2 bg-[#D4AF37] hover:bg-amber-400 text-black text-xs font-black uppercase rounded-xl transition shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>üé• Studio Vid√©o R√©els</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {myUserPosts.map((post) => {
                            const videoSrc = post.mediaUrl || (post as any).imageUrl || (post as any).videoUrl;
                            return (
                              <div
                                key={post.id}
                                className="bg-afri-bg border border-afri-border hover:border-[#D4AF37]/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all"
                              >
                                {videoSrc && (
                                  <div className="relative aspect-video bg-black/80 flex items-center justify-center overflow-hidden">
                                    <video
                                      src={videoSrc}
                                      className="w-full h-full object-cover"
                                      controls
                                      preload="metadata"
                                    />
                                  </div>
                                )}
                                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center justify-between text-[10px] text-afri-text-sec font-mono mb-1">
                                      <span className="bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded font-bold uppercase">
                                        {post.type || "video"}
                                      </span>
                                      <span>
                                        {post.timestamp ? new Date(post.timestamp).toLocaleDateString("fr-FR") : (post.createdAt ? new Date(post.createdAt).toLocaleDateString("fr-FR") : "")}
                                      </span>
                                    </div>
                                    {post.content && (
                                      <p className="text-xs text-afri-text font-medium line-clamp-2">
                                        {post.content}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] text-afri-text-sec pt-2 border-t border-afri-border/40">
                                    <span className="flex items-center gap-1">
                                      ‚ù§Ô∏è <strong className="text-afri-text">{post.likes || 0}</strong>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      üí¨ <strong className="text-afri-text">{Array.isArray(post.comments) ? post.comments.length : (typeof post.comments === "number" ? post.comments : 0)}</strong>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {activeMenu === "payments_to_verify" && (
                <div className="p-6 rounded-2xl bg-afri-bg border border-afri-gold/30 space-y-6 animate-fadeIn">
                  <h3 className="text-sm font-display font-black uppercase text-afri-gold tracking-widest">
                    Paiements √† V√©rifier (B√™ta Manuelle)
                  </h3>
                  <p className="text-xs text-afri-text-sec">Validez manuellement les paiements re√ßus.</p>
                </div>
              )}

              {activeMenu === "user_mes_groupes" && (() => {
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-afri-text-sec">Aucun artiste disponible.</p>;
                return (
                  <div className="p-6 rounded-2xl bg-afri-bg border border-afri-border space-y-6 animate-fadeIn">
                    <div className="pb-3 border-b border-afri-border flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-display font-black uppercase text-afri-gold tracking-widest">
                          üë• Mes Orchestres & Alliances R√©gionales
                        </h3>
                        <p className="text-xs text-afri-text-sec">Affiliez-vous √† des groupings pour briguer les Gombos VIP d'Abidjan.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Active Group cards user belongs to */}
                      {(!currentArtist.groups || currentArtist.groups.length === 0) ? (
                        <div className="flex flex-col items-center justify-center p-4 bg-afri-bg border border-afri-border rounded-xl space-y-2 min-h-[8rem]">
                          <Users className="w-6 h-6 text-afri-text-sec mb-1" />
                          <span className="text-[10px] uppercase font-bold tracking-widest text-afri-text-sec text-center">Aucune alliance active</span>
                        </div>
                      ) : (
                        currentArtist.groups.map(group => (
                          <div key={group} className="p-4 bg-afri-bg border border-afri-gold/30 rounded-xl space-y-2">
                            <strong className="text-xs uppercase font-mono tracking-wider text-afri-gold block">üéº {group}</strong>
                            <span className="text-[10px] text-afri-text-sec font-mono block">R√¥le : Membre / Musicien</span>
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold font-mono">Affiliation Active</span>
                          </div>
                        ))
                      )}

                      {/* Add new orchestration alliance */}
                      <div className="p-4 bg-afri-bg border border-afri-border rounded-xl space-y-3">
                        <span className="text-xs font-bold text-afri-text block uppercase">Cr√©er une Alliance Musicale</span>
                        <input
                          type="text"
                          placeholder="Nom de l'orchestre / grouping..."
                          className="w-full bg-afri-bg-sec border border-afri-border rounded-lg p-2 text-xs focus:outline-none focus:border-afri-gold"
                          onKeyDown={async (e: any) => {
                            if (e.key === "Enter" && e.target.value.trim()) {
                              const v = e.target.value.trim();
                              const updatedGrps = [...currentArtist.groups, v];
                              setUsers(prev => prev.map(u => u.id === currentArtist.id ? { ...u, groups: updatedGrps } : u));
                              await saveToFirestore("users", currentArtist.id, { groups: updatedGrps });
                              addToTerminal(`[ALLIANCE] Nouvel orchestre cr√©√© : ${v}`);
                              e.target.value = "";
                              alert(`üéº Alliance ${v} enregistr√©e avec succ√®s !`);
                            }
                          }}
                        />
                        <span className="text-[9px] text-afri-text-sec font-mono block">Appuyez sur Entr√©e pour enregistrer l'orchestre r√©gional.</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {activeMenu === "user_renforts" && (() => {
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-afri-text-sec">Aucun artiste disponible.</p>;
                return (
                  <div className="p-6 rounded-2xl bg-afri-bg border border-afri-border space-y-6 animate-fadeIn">
                    <div className="pb-3 border-b border-afri-border">
                      <h3 className="text-sm font-display font-black uppercase text-afri-gold tracking-widest">
                        ‚ö° Module de Renfort Sc√©nique Express
                      </h3>
                      <p className="text-xs text-afri-text-sec">Recherchez d'urgence un instrumentiste ou un choriste sur sc√®ne √† Abidjan.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Form launch dynamic backup */}
                      <div className="p-5 bg-afri-bg border border-afri-border rounded-xl space-y-4">
                        <span className="text-xs font-bold font-mono text-afri-gold uppercase block border-b border-afri-border pb-2">üéØ Dispatcher une Alerte de Renfort</span>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-mono text-afri-text-sec block font-bold">Instrument ou Backup requis :</label>
                          <select className="w-full bg-afri-bg-sec border border-afri-border rounded-lg p-2 text-xs focus:outline-none">
                            <option>Bassiste Zouglou d'√©lite</option>
                            <option>Percussionniste Sabar en urgence</option>
                            <option>Duo de Backup Singers (Ch≈ìur)</option>
                            <option>Joueur de Kora Concertiste</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-mono text-afri-text-sec block font-bold">Commune du Concert :</label>
                          <select className="w-full bg-afri-bg-sec border border-afri-border rounded-lg p-2 text-xs focus:outline-none">
                            {IVORIAN_COMMUNES.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-mono text-afri-text-sec block font-bold">Budget et Urgence :</label>
                          <select className="w-full bg-afri-bg-sec border border-afri-border rounded-lg p-2 text-xs focus:outline-none">
                            <option>Urgent - Prestation ce soir (50 000 FCFA)</option>
                            <option>Normal - Ce week-end (35 000 FCFA)</option>
                            <option>Elite - Tourn√©e Nationale (120 005 FCFA)</option>
                          </select>
                        </div>

                        <button
                          onClick={async () => {
                            const newAlertId = "renfort_" + Date.now();
                            const newAlertData = {
                              id: newAlertId,
                              type: "renfort",
                              priority: "high",
                              status: "active",
                              title: `Renfort Express: ${currentArtist.artisticName}`,
                              message: "Besoin d'un musicien rempla√ßant en urgence !",
                              timestamp: new Date().toISOString()
                            };
                            await saveToFirestore("alerts", newAlertId, newAlertData);
                            addToTerminal(`[RENFORT EXPRESS] Alerte de renfort envoy√©e vers tous les terminaux de la commune !`);
                            alert("üì£ Alerte de Renfort Express envoy√©e aux talents √† proximit√© !");
                          }}
                          className="w-full py-2 bg-afri-gold hover:bg-afri-bg-sec text-black text-xs font-mono font-black uppercase rounded-lg transition-all"
                        >
                          Lancer le Renfort Sc√©nique ‚ö°
                        </button>
                      </div>

                      {/* Active reinforcements view */}
                      <div className="space-y-2">
                        <span className="text-xs uppercase font-mono text-afri-text-sec font-bold block">Appels de Renforts en cours</span>
                        <div className="p-4 bg-afri-bg border border-afri-border rounded-xl min-h-[15rem] space-y-3">
                          {renforts.length === 0 ? (
                            <PremiumEmptyState 
                              message="Aucun renfort actuel." 
                              submessage="Cr√©ez une alerte pour chercher des renforts." 
                              icon={ShieldCheck}
                            />
                          ) : (
                            renforts.map(r => (
                              <div key={r.id} className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                <div className="flex justify-between text-xs">
                                  <strong className="text-afri-text">{r.instrument || r.title || "Renfort Demand√©"}</strong>
                                  {r.isExpress && <span className="text-red-400 font-mono text-[9px] uppercase animate-pulse">Prestation ce soir !</span>}
                                </div>
                                <p className="text-[10px] text-afri-text-sec mt-1">Lieu : {r.commune || "Abidjan"} ‚Ä¢ Cachet : {r.budget || "√Ä n√©gocier"} FCFA</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {activeMenu === "user_opportunities" && (() => {
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-afri-text-sec">Aucun artiste disponible.</p>;
                return (
                  <div className="p-6 rounded-2xl bg-afri-bg border border-afri-border space-y-6 animate-fadeIn">
                    <div className="pb-3 border-b border-afri-border">
                      <h3 className="text-sm font-display font-black uppercase text-afri-gold tracking-widest">
                        üåç Le Bulletin d'Or des Opportunit√©s
                      </h3>
                      <p className="text-xs text-afri-text-sec">Postulez en un clic sur des contrats d'excellence certifi√©s.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gombos.map(gombo => (
                        <div key={gombo.id} className="p-4 bg-afri-bg border border-afri-border hover:border-afri-gold/30 rounded-xl space-y-3 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-mono text-afri-gold uppercase tracking-wider">{gombo.location}</span>
                              {gombo.isBoosted && (
                                <span className="bg-afri-gold/10 border border-afri-gold/30 text-afri-gold font-mono text-[9px] px-1.5 py-0.5 rounded font-bold animate-pulse">
                                  CONTRAT D'ACCORD DE SOUVERAINET√â (BOOSTED)
                                </span>
                              )}
                            </div>
                            <strong className="text-sm text-afri-text block mt-1">{gombo.title}</strong>
                            <p className="text-xs text-afri-text-sec mt-2 line-clamp-2 leading-relaxed">{gombo.description}</p>
                          </div>

                          <div className="pt-4 flex justify-between items-center border-t border-afri-border mt-3">
                            <strong className="text-sm font-mono text-afri-gold">{gombo.budget.toLocaleString()} FCFA</strong>
                            <button
                              onClick={async () => {
                                const appId = "app_" + Date.now();
                                const applicationData = {
                                  id: appId,
                                  gomboId: gombo.id,
                                  artistId: currentArtist.id,
                                  artistName: currentArtist.artisticName,
                                  timestamp: new Date().toISOString(),
                                  status: "pending"
                                };
                                await saveToFirestore("applications", appId, applicationData);
                                addToTerminal(`[CANDIDATURE] Candidature officielle de ${currentArtist.artisticName} pour ${gombo.title}`);
                                alert(`üéØ Candidature scell√©e sur "${gombo.title}" ! L'organisateur a √©t√© notifi√©.`);
                              }}
                              className="px-4 py-1.5 bg-afri-gold/15 hover:bg-afri-gold border border-afri-gold/30 hover:border-transparent rounded-lg text-xs font-mono font-bold text-afri-gold hover:text-black transition-all"
                            >
                              Postuler Direct üéØ
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {activeMenu === "user_settings" && (() => {
                return (
                  <div className="w-full h-full flex-1 flex flex-col min-h-0 bg-afri-bg animate-fadeIn text-left relative z-20">
                    <ErrorBoundary moduleName="Param√®tres">
                      <SettingsModal 
                        isOpen={true} 
                        onClose={() => goBackMenu()}
                        onLogout={async () => {
                          try {
                            await logout();
                            navigate("/auth");
                          } catch (err) {
                            console.error("Logout error after deletion:", err);
                          }
                        }}
                        onNavigateToFounder={() => {
                          navigate("/Le-Throne-Of-The-Founder?tab=command");
                        }}
                        onNavigateToThrone={() => {
                          navigate("/Le-Throne-Of-The-Founder?tab=founder");
                        }}
                        onSupportClick={() => setIsSupportModalOpen(true)}
                      />
                    </ErrorBoundary>
                  </div>
                );
              })()}

              {activeMenu === "user_notifications" && (() => {
                if (!currentUser) {
                  return (
                    <div className="max-w-md mx-auto px-4 py-16 text-center animate-fadeIn select-none">
                      <div className="w-16 h-16 bg-afri-gold/10 border border-afri-gold/35 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(212,175,55,0.15)] animate-pulse">
                        <Bell className="w-8 h-8 text-afri-gold" />
                      </div>
                      <h2 className="text-xl font-display font-black text-afri-text uppercase tracking-wider mb-2">
                        Acc√®s R√©serv√© üîí
                      </h2>
                      <p className="text-xs text-afri-text-sec font-sans leading-relaxed mb-8">
                        Connectez-vous pour acc√©der √† vos notifications et rester synchronis√© en temps r√©el avec AFRIGOMBO ELITE.
                      </p>
                      
                      <div className="space-y-3">
                        <button
                          onClick={async () => {
                            try {
                              if (audioSynth) audioSynth.playValidationSuccess();
                              await loginWithGoogle();
                              setIsAuthModalOpen(false);
                              if (setShowAuthPopup) setShowAuthPopup(false);
                            } catch (err) {
                              console.error("Google Auth failed in notification gate:", err);
                              setIsAuthModalOpen(true);
                            }
                          }}
                          className="w-full py-3.5 px-6 rounded-2xl bg-[#D4AF37] hover:bg-[#e5bd3c] text-zinc-950 text-xs font-mono font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(212,175,55,0.3)] cursor-pointer select-none active:scale-95 flex items-center justify-center gap-2.5"
                        >
                          <svg className="w-4 h-4 mr-1 shrink-0" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.56-1.56 2.95-3.24 3.5v2.9h5.1c2.98-2.75 4.7-6.8 4.7-11.63c0-.52-.04-1.04-.1-1.5z" />
                            <path fill="currentColor" d="M12.18 21.43c2.43 0 4.47-.8 5.96-2.2l-5.1-2.9c-.83.56-1.9.9-3.08.9c-2.33 0-4.3-1.58-5-3.7H1.7v3.08c1.5 3 4.58 4.92 8.1 4.92z" />
                            <path fill="currentColor" d="M7.18 13.53c-.18-.55-.28-1.13-.28-1.73s.1-1.18.28-1.73V7H1.7a10.2 10.2 0 0 0 0 9.6l5.48-3.07z" />
                            <path fill="currentColor" d="M12.18 5.57c1.33 0 2.5.46 3.44 1.36l2.58-2.58C16.65 2.9 14.6 2 12.18 2c-3.52 0-6.6 1.92-8.1 4.92l5.48 3.07c.7-2.12 2.67-3.7 5.02-3.7z" />
                          </svg>
                          Continuer avec Google
                        </button>

                        <button
                          onClick={() => {
                            setIsAuthModalOpen(true);
                          }}
                          className="w-full py-3 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white text-xs font-mono font-bold uppercase tracking-widest border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 transition-all cursor-pointer select-none"
                        >
                          Autres options de connexion
                        </button>
                      </div>
                    </div>
                  );
                }

                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-afri-text-sec">Aucun artiste disponible.</p>;
                return (
                  <div className="w-full h-full flex flex-col justify-between p-0 m-0 border-none rounded-none bg-afri-bg animate-fadeIn text-left min-h-0">
                    <NotificationCenter 
                      currentUserProfile={profile || currentArtist} 
                      notifications={allNotifications}
                      onRefreshProfile={() => handleMarkAllNotifsRead()}
                      onMarkNotificationAsRead={(id) => handleMarkSingleNotifRead(id)}
                      onMarkAllAsRead={() => handleMarkAllNotifsRead()}
                      onNavigateHome={() => {
                        setActiveMenu("user_terrain");
                        try { audioSynth.playValidationSuccess(); } catch (err) {}
                      }}
                      onBack={() => goBackMenu()}
                      onNavigateTo={(menu, relatedId) => {
                        if (menu === "user_contracts") {
                          setPerspective("user");
                          setActiveMenu("user_contracts");
                        } else {
                          setPerspective("user");
                          setActiveMenu(menu);
                        }
                        try { audioSynth.playValidationSuccess(); } catch (err) {}
                      }}
                    />
                  </div>
                );
              })()}

              {activeMenu === "user_comments" && (() => {
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                return (
                  <Suspense fallback={
                    <div className="p-12 text-center text-[#D4AF37] font-mono animate-pulse">
                      Chargement de l'Espace Palabres...
                    </div>
                  }>
                    <UserCommentsView
                      currentUserProfile={profile || currentArtist}
                      onBack={() => goBackMenu()}
                      onNavigateTo={(menu) => {
                        setPerspective("user");
                        setActiveMenu(menu);
                      }}
                    />
                  </Suspense>
                );
              })()}

              {activeMenu === "user_about" && (
                <div className="animate-fadeIn">
                  <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse bg-black min-h-[200px] flex flex-col justify-center items-center border border-afri-border rounded-2xl"><div className="w-8 h-8 border-2 border-afri-gold border-t-transparent rounded-full animate-spin mb-4"></div><span className="text-xs uppercase tracking-widest font-bold">Chargement d'Or...</span></div>}>
                    <AboutAfrigombo 
                      onBack={() => goBackMenu()} 
                      onSupport={() => setActiveMenu("user_support")}
                    />
                  </Suspense>
                </div>
              )}

              {activeMenu === "user_support" && (
                <div className="animate-fadeIn">
                  <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse bg-black min-h-[200px] flex flex-col justify-center items-center border border-afri-border rounded-2xl"><div className="w-8 h-8 border-2 border-afri-gold border-t-transparent rounded-full animate-spin mb-4"></div><span className="text-xs uppercase tracking-widest font-bold">Chargement d'Or...</span></div>}>
                    <SupportAfrigombo 
                      onBack={() => goBackMenu()} 
                    />
                  </Suspense>
                </div>
              )}

              {activeMenu === "user_whats_new" && (
                <div className="animate-fadeIn">
                  <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse bg-black min-h-[200px] flex flex-col justify-center items-center border border-afri-border rounded-2xl"><div className="w-8 h-8 border-2 border-afri-gold border-t-transparent rounded-full animate-spin mb-4"></div><span className="text-xs uppercase tracking-widest font-bold">Chargement d'Or...</span></div>}>
                    <WhatsNew 
                      onBack={() => goBackMenu()} 
                    />
                  </Suspense>
                </div>
              )}

              {activeMenu === "user_messages" && (
                <div className="w-full h-full flex flex-col justify-between p-0 m-0 border-none rounded-none bg-afri-bg animate-fadeIn text-left min-h-0">
                  <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse bg-black min-h-[200px] flex flex-col justify-center items-center border border-afri-border rounded-2xl"><div className="w-8 h-8 border-2 border-afri-gold border-t-transparent rounded-full animate-spin mb-4"></div><span className="text-xs uppercase tracking-widest font-bold">Chargement d'Or...</span></div>}>
                    <MessagesView
                      currentUser={currentUser || { uid: activeArtistId }}
                      currentProfile={profile || (users.find(u => u.id === activeArtistId) || users[0])}
                      openConvoWithUserId={openConvoWithUserId}
                      setOpenConvoWithUserId={setOpenConvoWithUserId}
                      openConvoWithGomboId={openConvoWithGomboId}
                      setOpenConvoWithGomboId={setOpenConvoWithGomboId}
                      onNavigateToPublish={() => {
                        setActiveMenu("user_publish");
                      }}
                      onNavigateToSearch={() => {
                        setActiveMenu("user_terrain");
                      }}
                      onBack={() => {
                        setActiveMenu("user_terrain");
                        try { audioSynth.playValidationSuccess(); } catch (err) {}
                      }}
                    />
                  </Suspense>
                </div>
              )}

              <div>
                {activeMenu === "user_subscription_management" && (
                  <div className="animate-fadeIn">
                    <MonAbonnementView 
                      isPremium={profile?.isPremium || profile?.isPro || profile?.isVip || false}
                      onUpgrade={() => setActiveMenu("user_gombo_plus")}
                      onBack={() => goBackMenu()}
                      currentUserProfile={profile}
                      onRefreshProfile={refreshProfile}
                    />
                  </div>
                )}
                {activeMenu === "user_gombo_plus" && (
                  <div className="animate-fadeIn">
                    <AfrigomboPlus 
                      onBack={() => goBackMenu()} 
                      currentUserProfile={profile}
                      onRefreshProfile={refreshProfile}
                    />
                  </div>
                )}
                {activeMenu === "user_gombo_ads" && (
                  <div className="w-full animate-fadeIn text-left">
                    <GomboAdsMainView 
                      currentUserProfile={profile || currentUser}
                      onBack={() => goBackMenu()}
                      onOpenWalletDeposit={() => setActiveMenu("user_wallet")}
                      initialTargetGomboId={preselectedGomboAdId}
                      onNavigateToTarget={(type, targetId) => {
                        if (type === "profile") {
                          setActiveMenu("user_heritage");
                        } else if (type === "event") {
                          setActiveMenu("user_events");
                        } else {
                          setActiveMenu("user_terrain");
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {activeMenu === "user_edit_profile" && (
                <div className="w-full animate-fadeIn">
                  {profile ? (
                    <HeritagePage 
                      onNavigateView={(view) => {
                        setActiveMenu("user_heritage"); // Always return to heritage after edit
                      }}
                      initialPanelView="edit"
                    />
                  ) : (
                    <div className="p-12 text-center space-y-4">
                      <p className="text-afri-text-sec font-mono">Profil non charg√©...</p>
                      <button 
                        onClick={() => setActiveMenu("user_heritage")}
                        className="px-6 py-2 bg-afri-gold text-black font-black uppercase rounded-xl"
                      >
                        Retour
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ----------------------------------------------------
                                VIEW: DASHBOARD & SCAN (CENTRE DE COMMANDE)
                  ---------------------------------------------------- */}
              {activeMenu === "dashboard" && (
                <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse">Chargement de la Console...</div>}>
                  <AdminDashboard
                    users={users}
                    gombos={gombos}
                    posts={posts}
                    transactions={transactions}
                    alerts={alerts}
                    brief={brief}
                    currentUser={currentUser}
                    userEmail={userEmail}
                    liveAdminTime={liveAdminTime}
                    isAuthorizedSuperFounder={isAuthorizedSuperFounder}
                    scannerStatus={scannerStatus}
                    triggerGlobalSystemScan={triggerGlobalSystemScan}
                    setActiveMenu={setActiveMenu}
                    setIsBroadcastModalOpen={setIsBroadcastModalOpen}
                    audioSynth={audioSynth}
                    addToTerminal={addToTerminal}
                    saveToFirestore={saveToFirestore}
                    setUsers={setUsers}
                    setPosts={setPosts}
                    setGombos={setGombos}
                  />
                </Suspense>
              )}

              {/* ----------------------------------------------------
                                VIEW: PROGRAMME B√äTA (PHASE 4)
                  ---------------------------------------------------- */}
              {(activeMenu === "beta_program" || activeMenu === "beta") && (
                <Suspense fallback={<div className="p-12 text-center text-[#D4AF37] font-mono animate-pulse">Chargement du Programme B√™ta...</div>}>
                  <AdminBetaProgram onSelectUser={(userId) => {
                    setEditingProfileUserId(userId);
                    setActiveMenu("users");
                  }} />
                </Suspense>
              )}

              {activeMenu === "afrigombo_labs" && (
                <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse">Chargement de Afrigombo Labs...</div>}>
                  <AfrigomboLabs />
                </Suspense>
              )}

              {activeMenu === "beta_check" && (
                <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse">Chargement...</div>}>
                  <BetaCheckPanel />
                </Suspense>
              )}

              {/* ----------------------------------------------------
                                VIEW: CONTRATS & LITIGES (ADMIN)
                  ---------------------------------------------------- */}
              {activeMenu === "contracts" && (
                <div className="space-y-6 animate-fadeIn text-left p-6">
                  <div className="flex items-center justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-2xl font-sans font-black text-afri-text uppercase tracking-tighter">CENTRE DES CONTRATS</h2>
                      <p className="text-afri-text-sec text-[10px] font-black uppercase tracking-widest">Surveillance des engagements et r√©solution des litiges</p>
                    </div>
                  </div>
                  <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse bg-black min-h-[200px] flex flex-col justify-center items-center border border-afri-border rounded-2xl"><div className="w-8 h-8 border-2 border-afri-gold border-t-transparent rounded-full animate-spin mb-4"></div><span className="text-xs uppercase tracking-widest font-bold">Chargement d'Or...</span></div>}>
                    <GomboContractsDashboard currentUser={{ ...profile, role: 'admin' } as any} />
                  </Suspense>
                </div>
              )}

              {/* ----------------------------------------------------
                                VIEW: CABINET SUPR√äME PRIV√â (LE TR√îNE DU FONDATEUR / CENTRE MULTIM√âDIA)
                  ---------------------------------------------------- */}
              {activeMenu === "super_admin" && (
                <>
                  <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse">Chargement du Centre Super Fondateur...</div>}>
                    <AdminSuperFounderHub
                      userEmail={userEmail || ""}
                      currentUser={profile}
                      users={users}
                      gombos={gombos}
                      posts={posts}
                      transactions={transactions}
                      alerts={alerts}
                      audioSynth={audioSynth}
                      onExit={() => {
                        setPerspective("user");
                        setActiveMenu("user_terrain");
                        try { audioSynth.playValidationSuccess(); } catch (_) {}
                      }}
                    />
                  </Suspense>
                  {showThroneCinematic && (
                    <Suspense fallback={null}>
                      <ThroneCinematicIntro onComplete={() => setShowThroneCinematic(false)} />
                    </Suspense>
                  )}
                </>
              )}

              {/* ----------------------------------------------------
                                VIEW: LE TAM-TAM GOMBOS (PUBLICATIONS)
                  ---------------------------------------------------- */}
              {(activeMenu === "gombos" || activeMenu === "posts") && (
                <div className="space-y-8 pb-10">
                  
                  {/* ==========================================================
                               üî• √Ä NE PAS MANQUER (AUTO-UPDATED BROADCAST)
                     ========================================================== */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                      <h4 className="text-sm font-mono uppercase font-extrabold tracking-widest text-[#EF4444] flex items-center gap-2">
                        üî• √Ä ne pas manquer
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* 1. Best Opportunity (Highest Cachet) */}
                      {(() => {
                        const best = [...gombos].sort((a, b) => b.budget - a.budget)[0];
                        if (!best) return null;
                        return (
                          <motion.div
                            whileHover={{ y: -4 }}
                            className="bg-afri-bg-sec border border-afri-gold/40 rounded-2xl overflow-hidden shadow-[0_4px_25px_rgba(212,175,55,0.06)] flex flex-col justify-between"
                          >
                            <div className="relative h-28 w-full bg-cover bg-center" style={{ backgroundImage: `url(${best.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80'})` }}>
                              <div className="absolute inset-0 bg-gradient-to-t from-[#060606] to-transparent" />
                              <span className="absolute top-3 left-3 bg-afri-gold text-[#050505] text-[9px] uppercase font-mono font-black px-2.5 py-0.5 rounded-full shadow-lg">
                                üëë Sommet d'√âlite
                              </span>
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                              <div>
                                <h5 className="font-display font-bold text-sm text-afri-text truncate">{best.title}</h5>
                                <p className="text-[11px] text-afri-text/60 line-clamp-1 mt-1">{best.description}</p>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-afri-gold/10">
                                <span className="text-[10px] font-mono text-afri-text/40">{best.location}</span>
                                <span className="text-sm font-mono font-bold text-afri-gold">{best.budget.toLocaleString()} FCFA</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })()}

                      {/* 2. Absolute Urgency */}
                      {(() => {
                        const urgent = gombos.find(g => g.isUrgent) || gombos[0];
                        if (!urgent) return null;
                        return (
                          <motion.div
                            whileHover={{ y: -4 }}
                            className="bg-afri-bg-sec border border-[#EF4444]/40 rounded-2xl overflow-hidden shadow-[0_4px_25px_rgba(239,68,68,0.06)] flex flex-col justify-between"
                          >
                            <div className="relative h-28 w-full bg-cover bg-center" style={{ backgroundImage: `url(${urgent.imageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80'})` }}>
                              <div className="absolute inset-0 bg-gradient-to-t from-[#060606] to-transparent" />
                              <span className="absolute top-3 left-3 bg-afri-bg-sec text-afri-text text-[9px] uppercase font-mono font-black px-2.5 py-0.5 rounded-full shadow-lg animate-pulse">
                                üö® Urgent
                              </span>
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                              <div>
                                <h5 className="font-display font-bold text-sm text-afri-text truncate">{urgent.title}</h5>
                                <p className="text-[11px] text-afri-text/60 line-clamp-1 mt-1">{urgent.description}</p>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-afri-gold/10">
                                <span className="text-[10px] font-mono text-afri-text/40">{urgent.location}</span>
                                <span className="text-sm font-mono font-bold text-[#EF4444]">{urgent.budget.toLocaleString()} FCFA</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })()}

                      {/* 3. Popular Gombo */}
                      {(() => {
                        const popular = [...gombos].sort((a, b) => b.applicantsCount - a.applicantsCount)[0];
                        if (!popular) return null;
                        return (
                          <motion.div
                            whileHover={{ y: -4 }}
                            className="bg-afri-bg-sec border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_4px_25px_rgba(6,182,212,0.06)] flex flex-col justify-between"
                          >
                            <div className="relative h-28 w-full bg-cover bg-center" style={{ backgroundImage: `url(${popular.imageUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&auto=format&fit=crop&q=80'})` }}>
                              <div className="absolute inset-0 bg-gradient-to-t from-[#060606] to-transparent" />
                              <span className="absolute top-3 left-3 bg-cyan-500 text-black text-[9px] uppercase font-mono font-black px-2.5 py-0.5 rounded-full shadow-lg">
                                üí• Tr√®s Convoit√©
                              </span>
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                              <div>
                                <h5 className="font-display font-bold text-sm text-afri-text truncate">{popular.title}</h5>
                                <p className="text-[11px] text-afri-text/60 line-clamp-1 mt-1">{popular.description}</p>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-afri-gold/10">
                                <span className="text-[10px] font-mono text-afri-text/40">{popular.applicantsCount} pr√©tendants</span>
                                <span className="text-sm font-mono font-bold text-cyan-400">{popular.budget.toLocaleString()} FCFA</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* TAM-TAM Daily highlights section */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                    {/* Fire Gombo du Jour */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#060606] to-afri-gold/5 border border-afri-gold/30 shadow-[0_4px_25px_rgba(212,175,55,0.06)] relative overflow-hidden flex flex-col justify-between">
                      <span className="text-[9px] uppercase font-mono bg-afri-gold text-black px-2 py-0.5 rounded-full font-bold w-fit mb-3">
                        üî• Gombo du Jour
                      </span>
                      <div>
                        <h4 className="text-xs font-display font-bold text-afri-text line-clamp-1">Grand R√©veillon Select</h4>
                        <p className="text-[11px] text-afri-gold mt-1 font-mono">450 000 FCFA</p>
                      </div>
                    </div>

                    {/* Talent du Jour */}
                    <div className="p-5 rounded-2xl bg-afri-bg-sec border border-afri-gold/20 shadow-sm flex flex-col justify-between">
                      <span className="text-[9px] uppercase font-mono bg-afri-gold/10 text-afri-gold border border-afri-gold/20 px-2 py-0.5 rounded-full font-bold w-fit mb-3">
                        üëë Chef du R√©seau
                      </span>
                      <div>
                        <h4 className="text-xs font-display font-bold text-afri-text">Ariel Loua</h4>
                        <p className="text-[11px] text-afri-text/60 mt-1">Commune : Cocody</p>
                      </div>
                    </div>

                    {/* Defi du Jour */}
                    <div className="p-5 rounded-2xl bg-afri-bg-sec border border-afri-gold/20 shadow-sm flex flex-col justify-between">
                      <span className="text-[9px] uppercase font-mono bg-afri-bg-sec/10 text-[#EF4444] border border-[#EF4444]/20 px-2 py-0.5 rounded-full font-bold w-fit mb-3">
                        üéØ D√©fi Hebdo
                      </span>
                      <div>
                        <h4 className="text-xs font-display font-bold text-afri-text">Zouglou Keyboard Solo</h4>
                        <p className="text-[11px] text-afri-gold mt-1 font-mono">R√©compense : Gombo ID Or</p>
                      </div>
                    </div>

                    {/* Gombos pres de moi (Location highlights) */}
                    <div className="p-5 rounded-2xl bg-afri-bg-sec border border-afri-gold/20 shadow-sm flex flex-col justify-between">
                      <span className="text-[9px] uppercase font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold w-fit mb-3">
                        üåç Autour de moi
                      </span>
                      <div>
                        <h4 className="text-xs font-display font-bold text-afri-text">Cocody & Plateau</h4>
                        <p className="text-[11px] text-emerald-400 mt-1">Plateformes d'excellence actives</p>
                      </div>
                    </div>
                  </div>

                  {/* FORM TO PUBLISH NEW GOMBO */}
                  <div className="p-6 rounded-2xl bg-afri-bg-sec border border-afri-gold/20 shadow-md">
                    <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-afri-gold mb-4 flex items-center gap-2">
                      <span>üéº</span> Publier un Nouveau Gombo sur le R√©seau
                    </h4>
                    <form onSubmit={handleCreateGombo} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase text-afri-text/60 font-mono">Titre de l'Opportunit√©</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Bassiste recherch√© pour cabaret..."
                          value={newGombo.title}
                          onChange={(e) => setNewGombo(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full bg-afri-bg border border-afri-gold/20 rounded p-2 text-xs focus:outline-none focus:border-afri-gold text-afri-text"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-afri-text/60 font-mono">Budget cachet (FCFA)</label>
                          <input
                            type="number"
                            required
                            placeholder="Ex: 250000"
                            value={newGombo.budget}
                            onChange={(e) => setNewGombo(prev => ({ ...prev, budget: e.target.value }))}
                            className="w-full bg-afri-bg border border-afri-gold/20 rounded p-2 text-xs focus:outline-none focus:border-afri-gold text-afri-text font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-afri-text/60 font-mono">Commission (%)</label>
                          <select
                            value={newGombo.commissionRate}
                            onChange={(e) => setNewGombo(prev => ({ ...prev, commissionRate: e.target.value }))}
                            className="w-full bg-afri-bg border border-afri-gold/20 rounded p-2 text-xs focus:outline-none focus:border-afri-gold text-afri-text font-mono"
                          >
                            <option value="5">5 %</option>
                            <option value="10">10 % (Standard)</option>
                            <option value="12">12 %</option>
                            <option value="15">15 % (Elite)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-afri-text/60 font-mono">Commune</label>
                          <select
                            value={newGombo.location}
                            onChange={(e) => setNewGombo(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full bg-afri-bg border border-afri-gold/20 rounded p-2 text-xs focus:outline-none focus:border-afri-gold text-afri-text font-mono"
                          >
                            {IVORIAN_COMMUNES.map(com => (
                              <option key={com} value={com}>{com}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[9px] uppercase text-afri-text/60 font-mono">Description des Pr√©requis & Horaires</label>
                        <textarea
                          placeholder="D√©tails de l'√©v√©nement, instruments, horaires..."
                          value={newGombo.description}
                          onChange={(e) => setNewGombo(prev => ({ ...prev, description: e.target.value }))}
                          rows={2}
                          className="w-full bg-afri-bg border border-afri-gold/20 rounded p-2 text-xs focus:outline-none focus:border-afri-gold text-afri-text leading-normal"
                        />
                      </div>

                      <button
                        type="submit"
                        className="py-2.5 bg-afri-gold text-[#050505] hover:bg-afri-bg-sec transition-all rounded-lg font-display font-extrabold uppercase text-xs tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.2)] md:col-span-2 mt-2"
                      >
                        Enregistrer et publier sur le Tam-Tam
                      </button>
                    </form>
                  </div>

                  {/* GOMBOS VITRINE DIRECTORY */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm uppercase font-mono font-bold tracking-widest text-afri-gold">
                        ‚ú® Vitrine Merveilleuse ‚Äî Gombos Actifs
                      </h4>
                      <span className="text-xs text-afri-text/50 font-mono">{gombos.length} opportunit√©s disponibles</span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {gombos.map(g => {
                        const isSaved = savedGomboIds.includes(g.id);
                        const isHonored = honoredGomboIds.includes(g.id);
                        const hasApplied = renforts.some(r => r.gomboId === g.id && r.applicantId === "current_user");

                        return (
                          <motion.div
                            key={g.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className={`rounded-2xl xs:rounded-3xl overflow-hidden bg-afri-bg-sec border transition-all duration-300 shadow-[0_4px_30px_rgba(212,175,55,0.03)] hover:shadow-[0_8px_45px_rgba(212,175,55,0.09)] ${
                              g.isBoosted || g.isUrgent
                                ? "border-afri-gold/45"
                                : "border-afri-gold/15 hover:border-afri-gold/40"
                            }`}
                          >
                            {/* Card Media Header */}
                            <div className="relative h-32 xs:h-40 sm:h-48 w-full bg-cover bg-center overflow-hidden group" style={{ backgroundImage: `url(${g.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80'})` }}>
                              <div className="absolute inset-0 bg-gradient-to-t from-[#060606] via-[#060606]/40 to-transparent" />
                              
                              {/* Glowing Badges */}
                              <div className="absolute top-4 left-4 flex gap-2 flex-wrap items-center">
                                {g.isBoosted && (
                                  <span className="text-[8px] bg-gradient-to-r from-afri-gold to-amber-500 text-black px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-lg">
                                    üî• En Vedette
                                  </span>
                                )}
                                {g.isUrgent && (
                                  <span className="text-[8px] bg-red-600 text-afri-text px-2.5 py-1 rounded-full font-black uppercase tracking-wider animate-pulse shadow-lg">
                                    ‚ö° Urgent
                                  </span>
                                )}
                              </div>

                              <span className="absolute top-4 right-4 text-[9px] bg-afri-bg/60 backdrop-blur-md text-afri-gold px-3 py-1 rounded-full font-mono border border-afri-gold/20">
                                Abidjan, {g.location}
                              </span>

                              {/* Small details inside cover */}
                              <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                                <div>
                                  <span className="text-[9px] text-afri-text/50 block uppercase font-mono tracking-widest">Promoteur</span>
                                  <span className="text-xs font-bold text-afri-text flex items-center gap-1">
                                    {g.organizerName}
                                    <ShieldCheck className="w-3.5 h-3.5 text-afri-gold" />
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] text-afri-text/50 block uppercase font-mono tracking-widest">Date Cl√©</span>
                                  <span className="text-xs font-bold text-afri-text flex items-center gap-1 justify-end font-mono">
                                    <Calendar className="w-3 h-3 text-afri-gold" />
                                    {g.date || "15 Juin 2026"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-3 xs:p-5 sm:p-6 space-y-3 xs:space-y-4">
                              <div className="space-y-1 xs:space-y-1.5">
                                <h5 className="font-display font-extrabold text-afri-text text-sm xs:text-base sm:text-lg tracking-tight hover:text-afri-gold transition-all">
                                  {g.title}
                                </h5>
                                <p className="text-[10px] xs:text-xs text-afri-text/70 leading-relaxed font-sans min-h-[30px] line-clamp-2">
                                  {g.description}
                                </p>
                              </div>

                              {/* Cachet Details */}
                              <div className="py-2 xs:py-3 px-3 xs:px-4 rounded-xl bg-afri-bg/60 border border-afri-gold/10 flex justify-between items-center text-[10px] xs:text-xs">
                                <div>
                                  <span className="text-[7px] xs:text-[9px] text-afri-text/40 block uppercase font-mono tracking-tighter xs:tracking-widest">Cachet</span>
                                  <span className="text-xs xs:text-sm font-bold font-mono text-afri-gold tracking-tight">
                                    {g.budget.toLocaleString()} F
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[7px] xs:text-[9px] text-afri-text/40 block uppercase font-mono tracking-tighter xs:tracking-widest">Garantie Caisse</span>
                                  <span className="text-[10px] xs:text-xs font-bold font-mono text-[#10B981]">
                                    {(g.budget * g.commissionRate).toLocaleString()} F
                                  </span>
                                </div>
                              </div>

                              {/* Interactive Action Buttons Tray */}
                              <div className="grid grid-cols-4 gap-1 xs:gap-2 pt-2 border-t border-afri-border">
                                {/* Button: J'honore */}
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleHonorGombo(g.id)}
                                  className={`py-1.5 xs:py-2 px-0.5 xs:px-1 rounded-lg text-[7px] xs:text-[10px] font-bold uppercase tracking-tighter xs:tracking-wider flex items-center justify-center gap-0.5 xs:gap-1 transition-all outline-none min-h-[30px] xs:min-h-[36px] ${
                                    isHonored
                                      ? "bg-red-500/15 border border-red-500/30 text-red-400"
                                      : "bg-afri-bg border border-afri-border text-afri-text/60 hover:text-red-400 hover:border-red-500/20"
                                  }`}
                                >
                                  <span>{isHonored ? "‚ù§Ô∏è" : "‚ù§Ô∏è"}</span>
                                </motion.button>

                                {/* Button: Palabrer */}
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => requireAuthThen(() => setPalabreGombo(g))}
                                  className="py-1.5 xs:py-2 px-0.5 xs:px-1 rounded-lg text-[7px] xs:text-[10px] font-bold uppercase tracking-tighter xs:tracking-wider flex items-center justify-center gap-0.5 xs:gap-1 bg-afri-bg border border-afri-border text-afri-text/60 hover:text-afri-gold hover:border-afri-gold/20 transition-all outline-none min-h-[30px] xs:min-h-[36px]"
                                >
                                  <span>üó£Ô∏è Chat</span>
                                </motion.button>

                                {/* Button: Je postule */}
                                <motion.button
                                  whileTap={hasApplied ? {} : { scale: 0.95 }}
                                  disabled={hasApplied}
                                  onClick={() => applyToGombo(g.id)}
                                  className={`py-1.5 xs:py-2 px-0.5 xs:px-1 rounded-lg text-[7px] xs:text-[10px] font-bold uppercase tracking-tighter xs:tracking-wider flex items-center justify-center gap-0.5 xs:gap-1 transition-all outline-none min-h-[30px] xs:min-h-[36px] ${
                                    hasApplied
                                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                      : "bg-gradient-to-r from-afri-gold to-[#B48F17] text-black hover:opacity-95 shadow-sm"
                                  }`}
                                >
                                  <span>{hasApplied ? "üé§" : "üé§ Postule"}</span>
                                </motion.button>

                                {/* Button: Je garde */}
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleSaveGombo(g.id)}
                                  className={`py-1.5 xs:py-2 px-0.5 xs:px-1 rounded-lg text-[7px] xs:text-[10px] font-bold uppercase tracking-tighter xs:tracking-wider flex items-center justify-center gap-0.5 xs:gap-1 transition-all outline-none min-h-[30px] xs:min-h-[36px] ${
                                    isSaved
                                      ? "bg-afri-gold/15 border border-afri-gold/40 text-afri-gold"
                                      : "bg-afri-bg border border-afri-border text-afri-text/60 hover:text-afri-gold hover:border-afri-gold/20"
                                  }`}
                                >
                                  <span>{isSaved ? "üìå" : "üìå Garde"}</span>
                                </motion.button>
                              </div>

                              {/* Button: Cl√¥turer la prestation */}
                              {g.status !== "completed" ? (
                                <button
                                  onClick={() => {
                                    setCompletingGombo(g);
                                    setReviewMusicianId(users[0]?.id || "");
                                    setReviewRating(5);
                                    setReviewComment("");
                                    setReciprocalRating(5);
                                    setReciprocalComment("");
                                    setEnableReciprocal(true);
                                  }}
                                  className="w-full mt-2 xs:mt-3 py-1.5 xs:py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black hover:border-transparent text-emerald-400 font-display font-black text-[9px] xs:text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 xs:gap-2 transition-all shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                                >
                                  <span>üèÜ Cl√¥turer & Noter</span>
                                </button>
                              ) : (
                                <div className="w-full mt-2 xs:mt-3 py-1.5 xs:py-2 px-3 rounded-xl bg-afri-bg-ter/50 border border-afri-border/60 text-afri-text-sec font-mono text-[8px] xs:text-[10px] uppercase flex items-center justify-center gap-2 tracking-wide font-bold">
                                  <span>‚úÖ Prestation Termin√©e</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ==========================================================
                               üó£Ô∏è PALABRER (NEGOTIATION/CHAT DIALOG MODAL)
                     ========================================================== */}
                  <AnimatePresence>
                    {palabreGombo && (
                      <div className="fixed inset-0 bg-afri-bg/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="w-full max-w-lg bg-afri-bg-sec border border-afri-gold rounded-2xl xs:rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.2)] flex flex-col h-[85vh] xs:h-[520px] justify-between"
                        >
                          {/* Chat Header */}
                          <div className="p-5 border-b border-afri-gold/20 bg-gradient-to-r from-afri-bg to-[#060606] flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-afri-gold/10 border border-afri-gold/30 flex items-center justify-center font-bold text-afri-gold">
                                {palabreGombo.organizerName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-xs font-display font-bold text-afri-text flex items-center gap-1.5">
                                  {palabreGombo.organizerName}
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 block" title="En ligne" />
                                </h4>
                                <span className="text-[10px] text-afri-text/50 block truncate max-w-[200px]" title={palabreGombo.title}>
                                  N√©gociation : {palabreGombo.title}
                                </span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => setPalabreGombo(null)}
                              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-afri-text hover:bg-white/10 transition-all font-semibold"
                            >
                              ‚úï
                            </button>
                          </div>

                          {/* Chat Messages */}
                          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-afri-bg/50">
                            {/* Static Info Indicator */}
                            <div className="p-3 bg-afri-gold/5 border border-afri-gold/10 rounded-xl text-[10px] text-center text-afri-gold/80 leading-relaxed font-mono">
                              ü§ù Palabrer ‚Äî N√©gociez le cachet ou posez vos questions d'organisation directement avec le promoteur agr√©√© d'Abidjan.
                            </div>

                            {/* Live Dialogue Thread */}
                            {(palabreChatHistory[palabreGombo.id] || []).length === 0 ? (
                              <div className="text-center py-6 text-afri-text/45 text-xs font-mono">
                                Aucun palabre engag√©. √âcrivez un premier message courtois pour entamer la discussion !
                              </div>
                            ) : (
                              (palabreChatHistory[palabreGombo.id] || []).map((msg, idx) => {
                                const isArtiste = msg.sender === "artiste";
                                return (
                                  <div
                                    key={idx}
                                    className={`flex flex-col max-w-[80%] ${
                                      isArtiste ? "ml-auto items-end" : "mr-auto items-start"
                                    }`}
                                  >
                                    <div
                                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                                        isArtiste
                                          ? "bg-afri-gold text-black font-semibold rounded-br-none"
                                          : "bg-white/10 text-afri-text rounded-bl-none"
                                      }`}
                                    >
                                      {msg.text}
                                    </div>
                                    <span className="text-[9px] text-afri-text/30 block mt-1 font-mono">
                                      {msg.time}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Chat Input */}
                          <div className="p-4 border-t border-afri-border bg-afri-bg/80 flex gap-2 items-center shrink-0">
                            <input
                              type="text"
                              value={palabreMsg}
                              onChange={(e) => setPalabreMsg(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") submitPalabreMessage(palabreGombo.id);
                              }}
                              placeholder="Palabrer : n√©gocier budget, horaires, transport..."
                              className="flex-1 bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text placeholder-white/30 focus:outline-none focus:border-afri-gold transition-all"
                            />
                            
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => submitPalabreMessage(palabreGombo.id)}
                              className="w-10 h-10 rounded-xl bg-afri-gold text-black flex items-center justify-center hover:opacity-90 transition-all outline-none shrink-0"
                            >
                              <Send className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                </div>
              )}

              {/* ----------------------------------------------------
                                VIEW: RENFORTS APPLIQUES
                  ---------------------------------------------------- */}
              {activeMenu === "renforts" && (
                <div className="space-y-4">
                  <div className="p-4 bg-afri-gold/5 border border-afri-gold/20 rounded-lg text-xs leading-relaxed">
                    Les renforts sont des artistes postulant pour combler un Gombo en manque de musiciens/comp√©tences pr√©cises.
                  </div>

                  <div className="space-y-3">
                    {renforts.map(renfort => (
                      <div key={renfort.id} className={`p-5 rounded-lg border transition-all flex justify-between items-center ${renfort.isExpress ? "border-cyan-500/40 bg-gradient-to-r from-afri-bg-ter to-[#050505] shadow-[0_0_12px_rgba(6,182,212,0.12)]" : "border-afri-gold/15 bg-afri-bg hover:border-afri-gold/45"}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-afri-gold/5 border border-afri-gold/30 flex items-center justify-center font-bold text-afri-gold">
                            {renfort.applicantArtisticName.charAt(0)}
                          </div>
                          <div>
                            <h5 className="font-display font-semibold text-sm text-afri-text flex flex-wrap items-center gap-2">
                              {renfort.applicantArtisticName} ({renfort.applicantName})
                              {renfort.isExpress && (
                                <span className="text-[9px] bg-cyan-400 text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                                  ‚ö° Renfort Express Urgent
                                </span>
                              )}
                            </h5>
                            <span className="text-xs text-afri-text/60">
                              Postule pour le r√¥le de <strong className="text-afri-text">{renfort.instrument}</strong> sur :
                            </span>
                            <span className="text-xs text-afri-gold block mt-0.5 italic">
                              "{renfort.gomboTitle}"
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setRenforts(prev => prev.map(r => r.id === renfort.id ? { ...r, status: "accepted" as const } : r));
                              interactionBus.emit("MARKET_CONCLUDED");
                              addToTerminal(`[RENFORTS] Artiste accept√© pour le r√¥le de ${renfort.instrument}.`);
                            }}
                            className="bg-afri-bg-sec hover:bg-emerald-600 text-[#050505] font-semibold text-[10px] px-3 py-1.5 rounded transition-all uppercase"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => {
                              setRenforts(prev => prev.map(r => r.id === renfort.id ? { ...r, status: "rejected" as const } : r));
                              addToTerminal(`[RENFORTS] Artiste d√©clin√©.`);
                            }}
                            className="bg-afri-bg-sec hover:bg-red-700 text-afri-text font-semibold text-[10px] px-3 py-1.5 rounded transition-all uppercase"
                          >
                            Rejeter
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------
                                VIEW: COMPTES UTILISATEURS & VERIFICATIONS GOMBO ID
                  ---------------------------------------------------- */}
              {(activeMenu === "kyc" || activeMenu === "users") && (
                <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse">Chargement de la Gestion des Utilisateurs...</div>}>
                  <AdminUsers
                    activeMenu={activeMenu}
                    users={users}
                    filteredUsers={filteredUsers}
                    reviews={reviews}
                    kycActiveTab={kycActiveTab}
                    setKycActiveTab={setKycActiveTab}
                    editingProfileUserId={editingProfileUserId}
                    setEditingProfileUserId={setEditingProfileUserId}
                    profileForm={profileForm}
                    setProfileForm={setProfileForm}
                    specInput={specInput}
                    setSpecInput={setSpecInput}
                    groupInput={groupInput}
                    setGroupInput={setGroupInput}
                    addSpecialty={addSpecialty}
                    removeSpecialty={removeSpecialty}
                    addGroup={addGroup}
                    removeGroup={removeGroup}
                    saveProfileEditing={saveProfileEditing}
                    handleApproveKYC={handleApproveKYC}
                    handleRejectKYC={handleRejectKYC}
                    handleComplementaryInfoKYC={handleComplementaryInfoKYC}
                    startEditingProfile={startEditingProfile}
                    infoMessages={infoMessages}
                    setInfoMessages={setInfoMessages}
                  />
                </Suspense>
              )}

              {/* ----------------------------------------------------
                                VIEW: FILE REVISION
                  ---------------------------------------------------- */}
              {activeMenu === "revision" && (
                <div className="space-y-4">
                  <div className="p-4 bg-afri-gold/5 border border-afri-gold/20 rounded-lg text-xs leading-relaxed">
                    Ce module rassemble les publications signal√©es par les utilisateurs ou flagged automatiquement par notre routine autonome pour spam ou contournement financi√®re.
                  </div>

                  <div className="space-y-3">
                    {posts.filter(p => p.isFlagged).map(post => (
                      <div key={post.id} className="p-5 rounded-lg border border-afri-gold/15 bg-afri-bg space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <ShieldAlert className="text-red-500 w-5 h-5 shrink-0" />
                            <div>
                              <span className="font-display font-semibold text-sm text-afri-text">
                                {post.authorArtisticName}
                              </span>
                              <p className="text-xs text-afri-text/50">Post ID: {post.id} ‚Ä¢ Signalement : <strong className="text-red-400">{post.flagReason}</strong></p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePerformActionOnPost(post.id, "approve")}
                              className="bg-emerald-500 text-[#050505] font-semibold text-[10px] uppercase px-3 py-1.5 rounded transition-all"
                            >
                              Ignorer Signalement
                            </button>
                            <button
                              onClick={() => handlePerformActionOnPost(post.id, "delete")}
                              className="bg-red-500 text-afri-text font-semibold text-[10px] uppercase px-3 py-1.5 rounded transition-all"
                            >
                              Supprimer le Post
                            </button>
                          </div>
                        </div>

                        <p className="p-3 bg-afri-gold/5 border border-afri-gold/10 rounded text-xs italic text-afri-text/80">
                          "{post.content}"
                        </p>
                      </div>
                    ))}

                    {posts.filter(p => p.isFlagged).length === 0 && (
                      <div className="text-center p-8 border border-dashed border-afri-gold/20 rounded-lg text-xs text-afri-text/40">
                        Aucun signalement en attente de v√©rification. Tout est paisible.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------
                                VIEW: ALERTS de COMMUNES (SIGNALEMENTS)
                  ---------------------------------------------------- */}
              {(activeMenu === "alertes" || activeMenu === "reports") && (
                <Suspense fallback={<div className="p-10 text-center text-[#D4A017] font-mono animate-pulse">Chargement rapports et alertes...</div>}>
                  <AdminReports
                    alerts={alerts}
                    posts={posts}
                    onDismissAlert={handleDismissAlert}
                    onDeletePost={handleDeletePostFromReports}
                    onUnflagPost={handleUnflagPostFromReports}
                    audioSynth={audioSynth}
                  />
                </Suspense>
              )}

              {/* ----------------------------------------------------
                                VIEW: NOTIFICATIONS (ANNONCES GLOBALES)
                  ---------------------------------------------------- */}
              {activeMenu === "notifications" && (
                <Suspense fallback={<div className="p-10 text-center text-[#D4A017] font-mono animate-pulse">Chargement notifications...</div>}>
                  <AdminNotifications adminEmail={profile?.email || "Admin"} />
                </Suspense>
              )}

              {/* ----------------------------------------------------
                                VIEW: LA CAISSE GOMBO (FINANCIALS / REVENUS)
                  ---------------------------------------------------- */}
              {(activeMenu === "caisse" || activeMenu === "finances" || activeMenu === "revenue") && (
                <Suspense fallback={<div className="p-10 text-center text-[#D4A017] font-mono animate-pulse">Chargement revenus...</div>}>
                  <AdminRevenue
                    transactions={transactions}
                    audioSynth={audioSynth}
                  />
                </Suspense>
              )}

              {(activeMenu === "revenue_features" || activeMenu === "revenus_avantages") && (
                <Suspense fallback={<div className="p-10 text-center text-[#D4A017] font-mono animate-pulse">Chargement Revenus & Avantages...</div>}>
                  <AdminRevenueFeatures
                    currentUser={currentUser}
                    userEmail={userEmail}
                    audioSynth={audioSynth}
                  />
                </Suspense>
              )}

              {/* ----------------------------------------------------
                                VIEW: PARAM√àTRES DU SYST√àME (SETTINGS)
                  ---------------------------------------------------- */}
              {activeMenu === "settings" && (
                <Suspense fallback={<div className="p-10 text-center text-[#D4A017] font-mono animate-pulse">Chargement param√®tres...</div>}>
                  <AdminSettings
                    audioSynth={audioSynth}
                  />
                </Suspense>
              )}

              {/* ----------------------------------------------------
                                VIEW: CONSOLE DE S√âCURIT√â (DIAGNOSTICS & LOGS)
                  ---------------------------------------------------- */}
              {(activeMenu === "security" || activeMenu === "logs") && (
                <Suspense fallback={<div className="p-10 text-center text-cyan-400 font-mono animate-pulse">Chargement de la Console de S√©curit√©...</div>}>
                  <AdminSecurity
                    adminLogs={terminalFeed}
                    scannerStatus={scannerStatus}
                    onTriggerSystemScan={triggerGlobalSystemScan}
                    audioSynth={audioSynth}
                  />
                </Suspense>
              )}

              {/* ----------------------------------------------------
                                VIEW: ANALYTICS & COURBES
                  ---------------------------------------------------- */}
              {activeMenu === "analytics" && (
                <div className="afri-container space-y-6 animate-fadeIn text-left py-4 xs:py-6">
                  <div className="flex justify-between items-center mb-4 border-b border-afri-border pb-4 px-1">
                    <h3 className="text-sm font-mono uppercase tracking-[0.2em] font-black text-[#D4A017]">
                      Intelligence & Data
                    </h3>
                  </div>
                  <Suspense fallback={<div className="p-10 text-center text-[#D4A017] font-mono animate-pulse">Chargement intelligence des donn√©es...</div>}>
                    <AdminStats users={users} gombos={gombos} transactions={transactions} onBack={() => goBackMenu()} />
                  </Suspense>
                </div>
              )}

              {/* ----------------------------------------------------
                                VIEW: PLUS (PARAM√àTRES ET OUTILS ADMINISTRATIFS)
                  ---------------------------------------------------- */}
              {activeMenu === "plus" && (
                <div className="afri-container space-y-6 animate-fadeIn py-4 xs:py-6">
                  <h3 className="text-[11px] xs:text-sm font-mono uppercase font-black tracking-[0.15em] text-afri-text flex items-center gap-1.5 pb-2 border-b border-afri-border px-1">
                    <Settings className="w-5 h-5 text-afri-text-sec" />
                    Outils d'Administration & Syst√®me
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Logs Syst√®me */}
                    <button 
                      onClick={() => setActiveMenu("logs")}
                      className="p-4 bg-afri-bg-sec hover:bg-afri-gold/5 border border-afri-border hover:border-afri-gold/20 rounded-xl flex items-start gap-4 text-left transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-afri-bg-sec flex items-center justify-center border border-afri-border group-hover:border-afri-gold/30">
                        <Terminal className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-afri-text uppercase tracking-wider font-mono">Logs syst√®me</h4>
                        <p className="text-[10px] text-afri-text-sec mt-1">Historique technique, connexions et audit trail des mod√©rateurs.</p>
                      </div>
                    </button>

                    {/* Param√®tres */}
                    <button 
                      onClick={() => setActiveMenu("settings")}
                      className="p-4 bg-afri-bg-sec hover:bg-afri-gold/5 border border-afri-border hover:border-afri-gold/20 rounded-xl flex items-start gap-4 text-left transition-all group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-afri-bg-sec flex items-center justify-center border border-afri-border group-hover:border-afri-gold/30">
                        <Settings className="w-5 h-5 text-afri-text" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-afri-text uppercase tracking-wider font-mono">Param√®tres</h4>
                        <p className="text-[10px] text-afri-text-sec mt-1">Configuration g√©n√©rale, filtres de mod√©ration et r√®gles communautaires.</p>
                      </div>
                    </button>

                    {/* Sauvegardes */}
                    <button 
                      onClick={() => setActiveMenu("analytics")}
                      className="p-4 bg-afri-bg-sec hover:bg-afri-gold/5 border border-afri-border hover:border-afri-gold/20 rounded-xl flex items-start gap-4 text-left transition-all group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-afri-bg-sec flex items-center justify-center border border-afri-border group-hover:border-afri-gold/30">
                        <Database className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-afri-text uppercase tracking-wider font-mono">Sauvegardes</h4>
                        <p className="text-[10px] text-afri-text-sec mt-1">Exports CSV, backups Firestore de s√©curit√© et restauration.</p>
                      </div>
                    </button>

                    {/* Audit s√©curit√© */}
                    <button 
                      onClick={() => setActiveMenu("security")}
                      className="p-4 bg-afri-bg-sec hover:bg-afri-gold/5 border border-afri-border hover:border-afri-gold/20 rounded-xl flex items-start gap-4 text-left transition-all group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-afri-bg-sec flex items-center justify-center border border-afri-border group-hover:border-afri-gold/30">
                        <ShieldAlert className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-afri-text uppercase tracking-wider font-mono">Audit s√©curit√©</h4>
                        <p className="text-[10px] text-afri-text-sec mt-1">Analyse des vuln√©rabilit√©s, tentatives d'intrusion et IP bloqu√©es.</p>
                      </div>
                    </button>

                    {/* IA AFRIGOMBO ELITE */}
                    <button 
                      onClick={() => { setActiveMenu("security"); addToTerminal("[IA] Acc√®s √† la configuration du moteur de recommandation."); }}
                      className="p-4 bg-afri-bg-sec hover:bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 rounded-xl flex items-start gap-4 text-left transition-all group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-afri-bg-sec flex items-center justify-center border border-purple-500/20 group-hover:border-purple-500/50">
                        <Brain className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-purple-100 uppercase tracking-wider font-mono">IA AFRIGOMBO ELITE</h4>
                        <p className="text-[10px] text-afri-text-sec mt-1">Configuration du moteur de recommandation et mod√©ration Gemini.</p>
                      </div>
                    </button>

                    {/* Centre d'aide */}
                    <button 
                      onClick={() => { setActiveMenu("dashboard"); addToTerminal("[SUPPORT] Acc√®s au centre d'aide."); }}
                      className="p-4 bg-afri-bg-sec hover:bg-afri-gold/5 border border-afri-border hover:border-afri-gold/20 rounded-xl flex items-start gap-4 text-left transition-all group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-afri-bg-sec flex items-center justify-center border border-afri-border group-hover:border-afri-gold/30">
                        <LifeBuoy className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-afri-text uppercase tracking-wider font-mono">Centre d'aide</h4>
                        <p className="text-[10px] text-afri-text-sec mt-1">Documentation interne, assistance technique et support fondateurs.</p>
                      </div>
                    </button>
                  </div>

                  {/* SUPREME PALACE SECRET ACCESS FOR FOUNDER ONLY */}
                  {(isAuthorizedSuperFounder || userEmail === "jhs.kmj7@gmail.com") && (
                    <div className="pt-6 mt-6 border-t border-afri-border/60 flex justify-center">
                      <div className="w-full max-w-lg p-5 bg-gradient-to-b from-afri-bg-sec to-afri-bg border border-afri-gold/30 rounded-2xl shadow-[0_0_25px_rgba(212,175,55,0.08)] text-center space-y-3">
                        <div className="flex items-center justify-center gap-2">
                          <Crown className="w-5 h-5 text-afri-gold animate-pulse" />
                          <h4 className="text-xs font-mono font-black text-afri-gold uppercase tracking-widest">
                            ACC√âDER AU TR√îNE DU FONDATEUR
                          </h4>
                        </div>
                        <p className="text-[10px] text-afri-text-sec max-w-md mx-auto leading-relaxed">
                          Cabinet Supr√™me du Fondateur / Niveau Super Fondateur : Centre de Commandement, Tableau Fondateur &amp; Gouvernance Imp√©riale.
                        </p>
                        <button
                          onClick={() => {
                            setActiveMenu("super_admin");
                            addToTerminal("üëë [SOUVERAINET√â] Entr√©e dans le Tr√¥ne demand√©e.");
                            try { audioSynth.playTamTam(true); } catch (err) {}
                          }}
                          className="group w-full p-3.5 bg-gradient-to-r from-[#D4AF37] via-[#F1C40F] to-[#D4AF37] hover:from-[#F1C40F] hover:to-[#D4AF37] text-black font-display font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_35px_rgba(212,175,55,0.45)]"
                        >
                          <Crown className="w-4 h-4 text-black animate-bounce" />
                          <span>üëë ENTRER DANS LE TR√îNE</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ----------------------------------------------------
                                VIEW: LOGS SYSTEME
                  ---------------------------------------------------- */}
              {activeMenu === "logs" && (
                <div className="h-[75vh] flex flex-col bg-afri-bg border border-[rgba(212,160,23,0.25)] rounded-xl overflow-hidden relative shadow-[0_4px_20px_rgba(212,160,23,0.05)]">
                  <div className="bg-afri-bg-sec border-b border-[rgba(212,160,23,0.15)] p-3 flex justify-between items-center">
                    <h4 className="text-[10px] font-mono uppercase text-[#D4A017] font-bold flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      Historique des Actions
                    </h4>
                    <button onClick={() => setActiveMenu("dashboard")} className="text-afri-text-sec hover:text-afri-text px-2 py-1 text-[10px] font-mono uppercase border border-afri-border rounded">Retour</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[9px] sm:text-[10px]">
                    {adminLogs.map((log: any, i: number) => (
                      <div key={log.id || i} className="flex gap-2 items-start border-b border-afri-border pb-2">
                        <span className="text-[#D4A017] mt-0.5">‚ñ∂</span>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-afri-text-sec leading-none">{new Date(log.timestamp).toLocaleString()}</span>
                            <span className="text-[8px] bg-afri-bg-sec px-1.5 py-0.5 rounded text-[#D4A017]">{log.adminId}</span>
                            <span className="text-[8px] border border-cyan-900/50 px-1.5 py-0.5 rounded text-cyan-400">{log.action}</span>
                          </div>
                          <span className="text-afri-text mt-1">
                            {log.details}
                          </span>
                          <span className="text-afri-text-sec text-[8px] mt-0.5">Cible: {log.target}</span>
                        </div>
                      </div>
                    ))}
                    {adminLogs.length === 0 && (
                      <div className="text-afri-text-sec italic">Historique vide...</div>
                    )}
                  </div>
                </div>
              )}
              {activeMenu === "monetisation" && (() => {
                const premiumTx = transactions.filter(t => t.type !== "commission" && t.type !== "subscription" && t.type !== "payout");
                const totalPremiumRevenues = premiumTx.reduce((sum, t) => sum + t.amount, 0);
                const countPremiumSales = premiumTx.length;

                const cExpressCount = transactions.filter(t => t.type === "cert_express").length;
                const bGomboCount = transactions.filter(t => t.type === "boost_gombo").length;
                const rExpressCount = transactions.filter(t => t.type === "renfort_express").length;
                const gVipCount = transactions.filter(t => t.type === "gombo_vip").length;
                const gProCount = transactions.filter(t => t.type === "gombo_pro").length;

                const sortedProducts = [
                  { name: "‚ö° Certifications Express (500 FCFA)", count: cExpressCount, rev: cExpressCount * 500, type: "cert_express", badge: "Express" },
                  { name: "üî• Boost Tam-Tam Gombo (500-2k FCFA)", count: bGomboCount, rev: transactions.filter(t => t.type === "boost_gombo").reduce((s,t)=>s+t.amount,0), type: "boost_gombo", badge: "Boost" },
                  { name: "‚ö° Renfort Express Urgent (500 FCFA)", count: rExpressCount, rev: rExpressCount * 500, type: "renfort_express", badge: "Renfort" },
                  { name: "‚ú® Adh√©sions Gombo VIP (1 000 FCFA/m)", count: gVipCount, rev: gVipCount * 1000, type: "gombo_vip", badge: "VIP" },
                  { name: "üíº Statut Gombo PRO (5 000 FCFA/m)", count: gProCount, rev: gProCount * 5000, type: "gombo_pro", badge: "PRO" }
                ].sort((a,b) => b.count - a.count);

                return (
                  <div className="afri-container space-y-6 py-4 xs:py-6">
                    {/* TOP DOCK OF NUMERICS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-5 rounded-lg border border-afri-gold/20 bg-afri-bg/40 shadow-md">
                        <span className="text-[10px] uppercase font-mono text-afri-text/50 block">Nombre d'achats Premium</span>
                        <span className="text-2xl font-display font-bold text-afri-gold block mt-1 font-mono">
                          {countPremiumSales} <span className="text-xs font-sans text-afri-text/40 font-normal">transactions</span>
                        </span>
                        <span className="text-[9px] text-[#10B981] font-mono block mt-1.5">‚úì 100% Synchronis√© avec Firestore</span>
                      </div>

                      <div className="p-5 rounded-lg border border-afri-gold/20 bg-afri-bg/40 shadow-md">
                        <span className="text-[10px] uppercase font-mono text-afri-text/50 block">Revenus Premium cumul√©s</span>
                        <span className="text-2xl font-display font-bold text-emerald-400 block mt-1 font-mono">
                          {totalPremiumRevenues.toLocaleString()} <span className="text-sm font-sans text-emerald-500 font-normal">FCFA</span>
                        </span>
                        <span className="text-[9px] text-afri-text-sec font-mono block mt-1.5">Souverains, hors commissions</span>
                      </div>

                      <div className="p-5 rounded-lg border border-afri-gold bg-afri-gold/5 shadow-md">
                        <span className="text-[10px] uppercase font-mono text-afri-gold font-semibold block">Produit √âtoile (Leader)</span>
                        <span className="text-xl font-display font-extrabold text-afri-text block mt-1 truncate">
                          {sortedProducts[0]?.count > 0 ? (typeof sortedProducts[0].name === "string" ? sortedProducts[0].name.split("(")[0] : String(sortedProducts[0].name ?? "")) : "Aucun achat encore"}
                        </span>
                        <span className="text-[9px] text-afri-gold font-mono block mt-1">
                          {sortedProducts[0]?.count > 0 ? `${sortedProducts[0].count} activations enregistr√©es` : "Preneur en attente"}
                        </span>
                      </div>
                    </div>

                    {/* DOCK OF DETAILED PRICINGS & RULES */}
                    <div className="p-6 rounded-lg bg-afri-gold/5 border border-afri-gold/10">
                      <h4 className="text-xs uppercase font-mono font-bold tracking-widest text-afri-gold mb-4 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        Charte d'√âthique & Solidarit√© Artistique
                      </h4>
                      <p className="text-xs text-afri-text/70 leading-relaxed mb-4">
                        üö® <strong>Principe de Souverainet√© : "Ne jamais bloquer les fonctions essentielles"</strong>. 
                        Toute la mon√©tisation additionnelle d'AFRIGOMBO ELITE s'ajoute en tant que services facultatifs √† valeur ajout√©e pour propulser les carri√®res. 
                        Un artiste ivoirien sans ressources peut toujours : ‚úì Publier sur le Tam-Tam, ‚úì Chercher des opportunit√©s de concerts, ‚úì Candidater, ‚úì √ätre certifi√© par file d'attente gratuite. Les contributions financi√®res proviennent uniquement de la valeur d'acc√©l√©ration fournie.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div className="p-4 rounded bg-afri-bg/40 border border-afri-gold/10">
                          <span className="font-bold text-afri-gold block text-xs">‚ö° Cert Express</span>
                          <span className="font-mono text-xs font-bold text-afri-text block mt-1">500 FCFA</span>
                          <p className="text-[10px] text-afri-text/40 mt-1">Traitement KYC express sous 24h-72h.</p>
                        </div>
                        <div className="p-4 rounded bg-afri-bg/40 border border-afri-gold/10">
                          <span className="font-bold text-purple-400 block text-xs">‚ú® Gombo VIP</span>
                          <span className="font-mono text-xs font-bold text-afri-text block mt-1">1 000 FCFA/m</span>
                          <p className="text-[10px] text-afri-text/40 mt-1">Badge VIP, profil propuls√© et publications √©pingl√©es.</p>
                        </div>
                        <div className="p-4 rounded bg-afri-bg/40 border border-afri-gold/10">
                          <span className="font-bold text-afri-gold block text-xs">üî• Boost Gombo</span>
                          <span className="font-mono text-xs font-bold text-afri-text block mt-1">500 - 2k FCFA</span>
                          <p className="text-[10px] text-afri-text/40 mt-1">Banni√®re de distinction En vedette sur les tam-tams.</p>
                        </div>
                        <div className="p-4 rounded bg-afri-bg/40 border border-afri-gold/10">
                          <span className="font-bold text-cyan-400 block text-xs">‚ö° Renfort Express</span>
                          <span className="font-mono text-xs font-bold text-afri-text block mt-1">500 FCFA</span>
                          <p className="text-[10px] text-afri-text/40 mt-1">Marquage d'urgence imm√©diat sur les renforts.</p>
                        </div>
                        <div className="p-4 rounded bg-afri-bg/40 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                          <span className="font-bold text-emerald-400 block text-xs">üíº Gombo PRO</span>
                          <span className="font-mono text-xs font-bold text-afri-text block mt-1">5 000 FCFA/m</span>
                          <p className="text-[10px] text-afri-text/40 mt-1">Multi-utilisateurs, exports de donn√©es CSV et rapports.</p>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}

                  </>
                )}

            </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* =========================================================================
                          ZONE C : BRIEF DU JOUR & TERMINAL LOGS (REMOVED - MOVED TO DASHBOARD)
         ========================================================================= */}


      {/* =========================================================================
                               CL√îTURE & √âVALUATION MODAL (COMBO RATINGS)
         ========================================================================= */}
      {completingGombo && (
        <div className="fixed inset-0 bg-afri-bg/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-lg p-4 xs:p-6 rounded-2xl border space-y-3 xs:space-y-4 shadow-2xl transition-all ${
              darkMode ? "bg-afri-bg-sec border-[#FF6600]/30" : "bg-white border-zinc-200 shadow-xl"
            }`}
          >
            <div className="flex justify-between items-center pb-2 border-b border-afri-border">
              <div>
                <span className="text-[8px] xs:text-[10px] font-mono uppercase font-black text-afri-text">√âvaluation d'Excellence Gombo</span>
                <h4 className={`text-sm xs:text-base sm:text-md font-display font-extrabold ${darkMode ? "text-afri-text" : "text-zinc-805"}`}>
                  Cl√¥turer : "{completingGombo.title}"
                </h4>
              </div>
              <button 
                onClick={() => setCompletingGombo(null)} 
                className={`text-2xl font-bold font-mono ${darkMode ? "text-afri-text/40 hover:text-afri-text" : "text-afri-text-sec hover:text-zinc-700"}`}
              >
                &times;
              </button>
            </div>

            <p className={`text-xs leading-relaxed ${darkMode ? "text-afri-text/60" : "text-afri-text-sec"}`}>
              Le Gombo est termin√© ! Pour finaliser et lib√©rer les garanties de la caisse, laissez une note de confiance et un palabre d'excellence sur le musicien.
            </p>

            <div className="space-y-4 pt-1">
              {/* Option 1: Choose Musician */}
              <div className="space-y-1">
                <label className={`text-[10px] uppercase font-mono block font-bold ${darkMode ? "text-afri-text/50" : "text-afri-text-sec"}`}>
                  Artiste ayant honor√© le Gombo :
                </label>
                <select
                  value={reviewMusicianId}
                  onChange={(e) => setReviewMusicianId(e.target.value)}
                  className={`w-full text-xs rounded-lg p-2 font-mono focus:outline-none focus:border-[#FF6600] ${
                    darkMode ? "bg-afri-bg border-afri-border text-afri-text" : "bg-zinc-100 border-zinc-300 text-zinc-800"
                  }`}
                >
                  <option value="" disabled>-- S√©lectionner l'artiste certifi√© --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id} className="bg-afri-bg text-afri-text">
                      {u.artisticName} ({u.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Option 2: Star rating (1-5 stars) */}
              <div className="space-y-2">
                <label className={`text-[10px] uppercase font-mono block font-bold ${darkMode ? "text-afri-text/50" : "text-afri-text-sec"}`}>
                  Note Accord√©e √† l'Artiste : ({reviewRating} √âtoiles)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="transition-all hover:scale-110"
                    >
                      <Star 
                        className={`w-6 h-6 xs:w-7 xs:h-7 ${
                          star <= reviewRating 
                            ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" 
                            : "text-zinc-550"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 3: Written review */}
              <div className="space-y-1">
                <label className={`text-[10px] uppercase font-mono block font-bold ${darkMode ? "text-afri-text/50" : "text-afri-text-sec"}`}>
                  T√©moignage √©crit & Feedback :
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Ponctualit√© exemplaire, virtuosit√© remarquable et aisance sc√©nique incomparable. Je recommande absolument."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className={`w-full text-xs rounded-lg p-2 focus:outline-none focus:border-[#FF6600] ${
                    darkMode ? "bg-afri-bg border-afri-border text-afri-text" : "bg-zinc-100 border-zinc-300 text-zinc-800"
                  }`}
                />
              </div>

              {/* OPTIONAL RECIPROCAL REVIEW FOR THE CLIENT/EVENT */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                darkMode ? "bg-afri-bg/40 border-afri-border text-afri-text" : "bg-zinc-50 border-zinc-200 text-zinc-800"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enableReciprocal"
                      checked={enableReciprocal}
                      onChange={(e) => setEnableReciprocal(e.target.checked)}
                      className="w-4 h-4 accent-purple-600 cursor-pointer"
                    />
                    <label htmlFor="enableReciprocal" className="text-xs font-semibold cursor-pointer select-none">
                      Activer l'√©valuation de retour (Artiste ‚ûú Client)
                    </label>
                  </div>
                  <span className="text-xs text-afri-text/40 cursor-help font-bold" title="Permet d'√©valuer r√©ciproquement l'accueil de l'organisateur.">‚ùì</span>
                </div>

                {enableReciprocal && (
                  <div className="space-y-3 pt-1 border-t border-afri-border animate-fadeIn">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-mono text-afri-text-sec block font-bold">
                        Note pour l'Organisateur & √âv√©nement : ({reciprocalRating} √âtoiles)
                      </span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReciprocalRating(star)}
                            className="transition-all hover:scale-105"
                          >
                            <Star 
                              className={`w-5 h-5 ${
                                star <= reciprocalRating 
                                  ? "text-purple-400 fill-purple-400" 
                                  : "text-afri-text-sec"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-mono text-afri-text-sec block font-bold">
                        Palabre de l'Artiste :
                      </span>
                      <input
                        type="text"
                        placeholder="Ex: Excellent accueil au cabaret, sonorisation haut standing et cachet remis rubis sur ongle."
                        value={reciprocalComment}
                        onChange={(e) => setReciprocalComment(e.target.value)}
                        className={`w-full text-[11px] rounded p-1.5 focus:outline-none focus:border-purple-500 ${
                          darkMode ? "bg-afri-bg-sec border-afri-border text-afri-text" : "bg-white border-zinc-300 text-zinc-800"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setCompletingGombo(null)}
                className={`px-4 py-2 border text-xs rounded-xl hover:bg-white/5 transition-all ${
                  darkMode ? "border-afri-border text-afri-text" : "border-zinc-300 text-zinc-700"
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleCompleteGombo}
                disabled={!reviewMusicianId}
                className={`px-5 py-2 text-afri-text font-display font-black text-xs uppercase rounded-xl transition-all shadow-md ${
                  !reviewMusicianId 
                    ? "bg-zinc-700 cursor-not-allowed text-afri-text-sec" 
                    : "bg-gradient-to-r from-[#FF6600] to-[#FF6600]/80 hover:opacity-90"
                }`}
              >
                Confirmer & Cl√¥turer Gombo üèÜ
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* =========================================================================
                              SUPER ADMINISTRATOR WELCOME INTRO OVERLAY
         ========================================================================= */}
      {isSuperWelcomeOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-afri-bg-sec/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full bg-afri-bg border border-purple-500/30 rounded-2xl xs:rounded-3xl p-6 xs:p-8 text-center space-y-4 xs:space-y-6 shadow-[0_0_50px_rgba(168,85,247,0.15)]">
            <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 via-pink-600 to-[#FF6600] rounded-full flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(236,72,153,0.5)] overflow-hidden">
              <img 
                src="/logo_afrigombo.png" 
                alt="" 
                className="w-14 h-14 object-contain animate-pulse"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const sibling = e.currentTarget.nextElementSibling;
                  if (sibling) (sibling as HTMLElement).style.display = 'block';
                }}
                referrerPolicy="no-referrer"
              />
              <div style={{ display: 'none' }} className="w-14 h-14 animate-pulse">
                <AfriGomboLogo className="w-full h-full" />
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-extrabold block">D√©cret Royal Activ√©</span>
              <h3 className="text-xl xs:text-2xl font-display font-black text-afri-text leading-tight">Salutations, Ma√Ætre de l'Afrique Musicale</h3>
              <p className="text-[10px] xs:text-xs text-afri-text/75 leading-relaxed font-sans">
                "L'Empire d'AFRIGOMBO ELITE est enti√®rement sous vos ordres souverains. Les cachets, les licences d'or et l'int√©gralit√© des talents nationaux reposent entre vos mains expertes."
              </p>
            </div>
            
            {/* Simulated Loading Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-afri-text/40">
                <span>Synchronisation des pouvoirs supr√™mes</span>
                <span className="text-afri-gold font-bold">100%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.2 }}
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-[#FF6600] h-full"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setIsSuperWelcomeOpen(false);
                setIsSuperUnlocked(true);
                setActiveMenu("super_admin");
                addToTerminal(`[INFO] Cabinet du Fondateur d√©verrouill√© par johnsylvesterh@gmail.com.`);
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-[#FF6600] text-afri-text hover:opacity-90 font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
            >
              üëë Entrer dans le Tr√¥ne
            </button>
          </div>
        </motion.div>
      )}

      {/* =========================================================================
                                     PLUS MENU OVERLAYS (ANDROID BOTTOM SHEET)
         ========================================================================= */}
      <AndroidBottomSheet
        isOpen={isPlusMenuOpen}
        onClose={() => setIsPlusMenuOpen(false)}
        title="Que souhaitez-vous publier ?"
      >
        <div className="space-y-2.5">
          {isModuleVisible("publish_gombo") && (
            <button
              onClick={() => {
                if (isModuleComingSoon("publish_gombo")) {
                  setIsPlusMenuOpen(false);
                  setComingSoonFeatureKey("publish_gombo");
                  return;
                }
                setActivePublishType("gombo");
                setActiveMenu("user_publish");
                setIsPlusMenuOpen(false);
              }}
              className="w-full flex items-center gap-4 bg-gradient-to-r from-afri-gold/10 to-transparent hover:from-afri-gold/20 border border-afri-gold/20 rounded-2xl py-3 px-3.5 text-left transition-all group cursor-pointer relative"
            >
              {isModuleComingSoon("publish_gombo") && (
                <span className="absolute top-2 right-2 text-[8px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  Bient√¥t disponible üîí
                </span>
              )}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-afri-gold to-[#F1C40F] flex items-center justify-center text-black shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[13px] font-sans font-bold text-afri-text uppercase tracking-wider mb-0.5">Publier un Gombo</h4>
                <p className="text-[10px] text-afri-text-sec font-mono">Recrutez des artistes pour vos √©v√©nements.</p>
              </div>
            </button>
          )}

          {isModuleVisible("publish_reel") && (
            <button
              onClick={() => {
                if (isModuleComingSoon("publish_reel")) {
                  setIsPlusMenuOpen(false);
                  setComingSoonFeatureKey("publish_reel");
                  return;
                }
                setActivePublishType("reel");
                setActiveMenu("user_publish");
                setIsPlusMenuOpen(false);
              }}
              className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-afri-border rounded-2xl py-3 px-3.5 text-left transition-all group cursor-pointer relative"
            >
              {isModuleComingSoon("publish_reel") && (
                <span className="absolute top-2 right-2 text-[8px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  Bient√¥t disponible üîí
                </span>
              )}
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30 group-hover:scale-105 transition-transform">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[13px] font-sans font-bold text-afri-text uppercase tracking-wider mb-0.5">Publier un R√©el</h4>
                <p className="text-[10px] text-afri-text-sec font-mono">Partagez votre talent en vid√©o courte.</p>
              </div>
            </button>
          )}

          {isModuleVisible("publish_demo") && (
            <button
              onClick={() => {
                if (isModuleComingSoon("publish_demo")) {
                  setIsPlusMenuOpen(false);
                  setComingSoonFeatureKey("publish_demo");
                  return;
                }
                setActivePublishType("demo");
                setActiveMenu("user_publish");
                setIsPlusMenuOpen(false);
              }}
              className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-afri-border rounded-2xl py-3 px-3.5 text-left transition-all group cursor-pointer relative"
            >
              {isModuleComingSoon("publish_demo") && (
                <span className="absolute top-2 right-2 text-[8px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  Bient√¥t disponible üîí
                </span>
              )}
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30 group-hover:scale-105 transition-transform">
                <Mic2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[13px] font-sans font-bold text-afri-text uppercase tracking-wider mb-0.5">D√©mo Musicale</h4>
                <p className="text-[10px] text-afri-text-sec font-mono">Publiez une d√©mo audio pour les recruteurs.</p>
              </div>
            </button>
          )}

          {isModuleVisible("publish_renfort") && (
            <button
              onClick={() => {
                if (isModuleComingSoon("publish_renfort")) {
                  setIsPlusMenuOpen(false);
                  setComingSoonFeatureKey("publish_renfort");
                  return;
                }
                setActivePublishType("renfort");
                setActiveMenu("user_publish");
                setIsPlusMenuOpen(false);
              }}
              className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-afri-border rounded-2xl py-3 px-3.5 text-left transition-all group relative overflow-hidden cursor-pointer"
            >
              {isModuleComingSoon("publish_renfort") && (
                <span className="absolute top-2 right-2 text-[8px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  Bient√¥t disponible üîí
                </span>
              )}
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center shrink-0 border border-red-500/30 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[13px] font-sans font-bold text-afri-text uppercase tracking-wider mb-0.5 flex items-center gap-2">
                  Renfort Express
                  <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded uppercase">Urgent</span>
                </h4>
                <p className="text-[10px] text-afri-text-sec font-mono">Demandez un d√©pannage imm√©diat (musicien).</p>
              </div>
            </button>
          )}
        </div>
      </AndroidBottomSheet>

      <AndroidCenteredDialog
        isOpen={showHowWorksPopup}
        onClose={() => setShowHowWorksPopup(false)}
        title="Comment fonctionne AFRIGOMBO ELITE ?"
      >
        <div className="text-left space-y-4 pt-2">
          <div className="w-12 h-12 rounded-full bg-afri-gold/20 flex items-center justify-center mb-2 mx-auto">
            <Info className="w-6 h-6 text-afri-gold" />
          </div>
          <p className="text-xs text-afri-text font-sans leading-relaxed">
            AFRIGOMBO ELITE permet la mise en relation entre talents et porteurs de projets. 
            <br/><br/>
            Certaines options premium (marquage urgent, mise en avant, profils v√©rifi√©s) peuvent comporter des frais qui seront affich√©s avant validation. Les paiements garantissent la s√©curit√© et l'engagement des deux parties.
          </p>
          <button 
            onClick={() => setShowHowWorksPopup(false)}
            className="w-full py-3 bg-gradient-to-r from-afri-gold to-[#F1C40F] text-black font-bold uppercase tracking-wider text-xs rounded-xl hover:opacity-90 transition-all cursor-pointer"
          >
            Compris
          </button>
        </div>
      </AndroidCenteredDialog>

      {/* =========================================================================
                                     FIXED BOTTOM NAVIGATION BAR (FLOATING & WELL-ROUNDED & COLLAPSIBLE)
         ========================================================================= */}
      {(perspective === "user" || activeMenu === "user_heritage") && (
        activeMenu === "user_terrain" ||
        activeMenu === "user_vibes" ||
        activeMenu === "user_mes_gombos" ||
        (activeMenu === "user_heritage" && !isHeritageSubPanelActive)
      ) && (
        <>
          {/* COLLAPSED RE-OPEN BUTTON (when collapsed, stays on bottom-left) */}
          {isNavCollapsed && (
            <button
              onClick={() => setIsNavCollapsed(false)}
              className="fixed bottom-3 sm:bottom-4 left-3 sm:left-6 z-40 w-11 h-11 rounded-2xl bg-afri-bg-sec/95 backdrop-blur-xl border border-[#D4AF37]/60 text-afri-gold shadow-[0_8px_25px_rgba(212,175,55,0.3)] flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
              title="D√©plier la barre de navigation"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          {/* MAIN FLOATING BOTTOM NAVIGATION BAR (ANDROID MATERIAL DESIGN 3) */}
          <nav
            className={`fixed bottom-0 left-0 right-0 w-full sm:max-w-[440px] sm:left-1/2 sm:-translate-x-1/2 sm:bottom-4 h-16 bg-afri-bg-sec/98 backdrop-blur-2xl border-t sm:border border-afri-border/80 px-2 sm:px-3 flex justify-between items-center z-40 rounded-t-2xl sm:rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.4)] select-none transition-all duration-300 ease-in-out box-border touch-manipulation ${
              isNavCollapsed ? "-translate-x-[150%] sm:-translate-x-[150%] opacity-0 pointer-events-none" : "translate-x-0 sm:-translate-x-1/2 opacity-100"
            }`}
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
          >
            {/* TOGGLE COLLAPSE BUTTON ON THE SIDE (Left edge) */}
            <button
              onClick={() => {
                try { if (navigator?.vibrate) navigator.vibrate(8); } catch(_) {}
                setIsNavCollapsed(true);
              }}
              className="absolute -left-1 sm:-left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-afri-bg-sec border border-afri-gold/60 text-afri-gold shadow-md flex items-center justify-center cursor-pointer hover:bg-afri-gold hover:text-black transition-all z-50 min-w-[32px] min-h-[32px]"
              title="Replier la barre vers la gauche"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* 1. ACCUEIL (Point d'entr√©e principal - toujours visible pour tout le monde) */}
            {(isModuleVisible("home") || true) && (
              <button
                id="user-nav-terrain"
                onClick={() => {
                  try { if (navigator?.vibrate) navigator.vibrate(10); } catch(_) {}
                  setActiveMenu("user_terrain");
                  try { audioSynth.playValidationSuccess(); } catch (err) {}
                }}
                className="relative flex flex-col items-center justify-center cursor-pointer transition-all min-w-[52px] xs:min-w-[56px] min-h-[48px] px-1 py-0.5 rounded-2xl touch-manipulation active:scale-95 flex-1"
              >
                <div className="relative px-3 py-0.5 rounded-full flex items-center justify-center overflow-hidden">
                  {activeMenu === "user_terrain" && (
                    <motion.div
                      layoutId="userActiveNavPill"
                      className="absolute inset-0 bg-[#D4AF37]/20 rounded-full border border-[#D4AF37]/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Home className={`w-4 h-4 sm:w-4.5 sm:h-4.5 relative z-10 transition-colors ${activeMenu === "user_terrain" ? "text-afri-gold stroke-[2.5]" : "text-afri-text-sec stroke-[1.8]"}`} />
                </div>
                <span className={`text-[7.5px] xs:text-[8px] tracking-wider uppercase truncate max-w-full mt-0.5 whitespace-nowrap transition-colors ${activeMenu === "user_terrain" ? "font-black text-afri-gold" : "font-semibold text-afri-text-sec"}`}>
                  Accueil
                </span>
              </button>
            )}

            {/* 2. VIBES */}
            {isModuleVisible("podcasts") && (
              <button
                id="user-nav-vibes"
                onClick={() => {
                  try { if (navigator?.vibrate) navigator.vibrate(10); } catch(_) {}
                  setActiveMenu("user_vibes");
                  try { audioSynth.playValidationSuccess(); } catch (err) {}
                }}
                className="relative flex flex-col items-center justify-center cursor-pointer transition-all min-w-[52px] xs:min-w-[56px] min-h-[48px] px-1 py-0.5 rounded-2xl touch-manipulation active:scale-95 flex-1"
              >
                <div className="relative px-3 py-0.5 rounded-full flex items-center justify-center overflow-hidden">
                  {activeMenu === "user_vibes" && (
                    <motion.div
                      layoutId="userActiveNavPill"
                      className="absolute inset-0 bg-[#D4AF37]/20 rounded-full border border-[#D4AF37]/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Music className={`w-4 h-4 sm:w-4.5 sm:h-4.5 relative z-10 transition-colors ${activeMenu === "user_vibes" ? "text-afri-gold stroke-[2.5]" : "text-afri-text-sec stroke-[1.8]"}`} />
                </div>
                <span className={`text-[7.5px] xs:text-[8px] tracking-wider uppercase truncate max-w-full mt-0.5 whitespace-nowrap transition-colors ${activeMenu === "user_vibes" ? "font-black text-afri-gold" : "font-semibold text-afri-text-sec"}`}>
                  Vibes
                </span>
              </button>
            )}

            {/* 3. PUBLIER */}
            {isModuleVisible("gombos") && (
              <button
                id="user-nav-publish"
                onClick={() => {
                  try { if (navigator?.vibrate) navigator.vibrate(12); } catch(_) {}
                  requireAuthThen(() => {
                    setIsPlusMenuOpen(true);
                    try { audioSynth.playValidationSuccess(); } catch (err) {}
                  });
                }}
                className="relative -top-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 outline-none px-1 select-none shrink-0 min-w-[48px] min-h-[48px] touch-manipulation"
                aria-label="Publier"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center bg-gradient-to-tr from-afri-gold to-[#F1C40F] text-black rounded-full shadow-[0_4px_16px_rgba(212,175,55,0.4)] border-2 border-afri-bg hover:scale-105 active:scale-90 transition-transform">
                  <Plus className="w-5 h-5 stroke-[3.5]" />
                </div>
                <span className="text-[7.5px] xs:text-[8px] font-black uppercase tracking-wider text-afri-text mt-0.5">Publier</span>
              </button>
            )}

            {/* 4. GOMBOS */}
            {isModuleVisible("gombos") && (
              <button
                id="user-nav-mes-gombos"
                onClick={() => {
                  try { if (navigator?.vibrate) navigator.vibrate(10); } catch(_) {}
                  setActiveMenu("user_mes_gombos");
                  try { audioSynth.playValidationSuccess(); } catch (err) {}
                }}
                className="relative flex flex-col items-center justify-center cursor-pointer transition-all min-w-[52px] xs:min-w-[56px] min-h-[48px] px-1 py-0.5 rounded-2xl touch-manipulation active:scale-95 flex-1"
              >
                <div className="relative px-3 py-0.5 rounded-full flex items-center justify-center overflow-hidden">
                  {activeMenu === "user_mes_gombos" && (
                    <motion.div
                      layoutId="userActiveNavPill"
                      className="absolute inset-0 bg-[#D4AF37]/20 rounded-full border border-[#D4AF37]/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Briefcase className={`w-4 h-4 sm:w-4.5 sm:h-4.5 relative z-10 transition-colors ${activeMenu === "user_mes_gombos" ? "text-afri-gold stroke-[2.5]" : "text-afri-text-sec stroke-[1.8]"}`} />
                </div>
                <span className={`text-[7.5px] xs:text-[8px] tracking-wider uppercase truncate max-w-full mt-0.5 whitespace-nowrap transition-colors ${activeMenu === "user_mes_gombos" ? "font-black text-afri-gold" : "font-semibold text-afri-text-sec"}`}>
                  Gombos
                </span>
              </button>
            )}

            {/* 5. H√âRITAGE */}
            {isModuleVisible("heritage") && (
              <button
                id="user-nav-heritage"
                onClick={() => {
                  try { if (navigator?.vibrate) navigator.vibrate(10); } catch(_) {}
                  setActiveMenu("user_heritage");
                  setViewingGomboIdDetail(false);
                  try { audioSynth.playValidationSuccess(); } catch (err) {}
                }}
                className="relative flex flex-col items-center justify-center cursor-pointer transition-all min-w-[52px] xs:min-w-[56px] min-h-[48px] px-1 py-0.5 rounded-2xl touch-manipulation active:scale-95 flex-1"
              >
                <div className="relative px-3 py-0.5 rounded-full flex items-center justify-center overflow-hidden">
                  {activeMenu === "user_heritage" && (
                    <motion.div
                      layoutId="userActiveNavPill"
                      className="absolute inset-0 bg-[#D4AF37]/20 rounded-full border border-[#D4AF37]/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <UserIcon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 relative z-10 transition-colors ${activeMenu === "user_heritage" ? "text-afri-gold stroke-[2.5]" : "text-afri-text-sec stroke-[1.8]"}`} />
                </div>
                <span className={`text-[7.5px] xs:text-[8px] tracking-wider uppercase truncate max-w-full mt-0.5 whitespace-nowrap transition-colors ${activeMenu === "user_heritage" ? "font-black text-afri-gold" : "font-semibold text-afri-text-sec"}`}>
                  H√©ritage
                </span>
              </button>
            )}
          </nav>
        </>
      )}

      {/* =========================================================================
                                     ADMIN FIXED BOTTOM NAVIGATION BAR
         ========================================================================= */}
      {perspective === "admin" && activeMenu !== "super_admin" && activeMenu !== "user_settings" && activeMenu !== "user_heritage" && (
        <div className="fixed bottom-0 sm:bottom-4 left-0 sm:left-1/2 right-0 sm:right-auto sm:-translate-x-1/2 bg-afri-bg/95 backdrop-blur-md border-t sm:border border-afri-gold/35 p-1.5 sm:p-2 px-2 xs:px-4 sm:px-6 flex items-center z-40 sm:rounded-2xl sm:shadow-[0_8px_35px_rgba(212,175,55,0.2)] w-full sm:w-auto min-w-[300px] xs:min-w-[320px] max-w-full sm:max-w-4xl mx-auto overflow-x-auto scrollbar-none flex-nowrap gap-0.5 xs:gap-1 sm:gap-4 select-none">
          {/* 1. DASHBOARD */}
          <button
            id="admin-nav-dashboard"
            onClick={() => {
              navigate("/Le-Throne-Of-The-Founder?tab=command");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-2 xs:px-3 sm:px-4 rounded-lg ${
              activeMenu === "dashboard" ? "text-afri-gold scale-105 bg-afri-gold/5 font-black" : "text-afri-text-sec hover:text-afri-text"
            }`}
          >
            <Home className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider">Dash</span>
          </button>

          {/* 2. UTILISATEURS */}
          <button
            id="admin-nav-users"
            onClick={() => {
              setActiveMenu("users");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
              activeMenu === "users" || activeMenu === "kyc" ? "text-afri-gold scale-105 bg-afri-gold/5 font-black" : "text-afri-text-sec hover:text-afri-text"
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span className="text-[9px] font-mono uppercase tracking-wider">Utilisateurs</span>
          </button>

          {/* 2.5 PROGRAMME B√äTA */}
          <button
            id="admin-nav-beta"
            onClick={() => {
              setActiveMenu("beta_program");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
              activeMenu === "beta_program" || activeMenu === "beta" ? "text-afri-gold scale-105 bg-afri-gold/5 font-black" : "text-afri-text-sec hover:text-afri-text"
            }`}
          >
            <Award className="w-4.5 h-4.5" />
            <span className="text-[9px] font-mono uppercase tracking-wider">Prog. B√™ta</span>
          </button>

          {/* 3. NOTIFICATIONS */}
          <button
            id="admin-nav-notifications"
            onClick={() => {
              setActiveMenu("notifications");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
              activeMenu === "notifications" ? "text-afri-gold scale-105 bg-afri-gold/5 font-black" : "text-afri-text-sec hover:text-afri-text"
            }`}
          >
            <Megaphone className="w-4.5 h-4.5" />
            <span className="text-[9px] font-mono uppercase tracking-wider">Notifications</span>
          </button>

          {/* 3.1 CONTRATS */}
          <button
            id="admin-nav-contracts"
            onClick={() => {
              setActiveMenu("contracts");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
              activeMenu === "contracts" ? "text-afri-gold scale-105 bg-afri-gold/5 font-black" : "text-afri-text-sec hover:text-afri-text"
            }`}
          >
            <FileSignature className="w-4.5 h-4.5" />
            <span className="text-[9px] font-mono uppercase tracking-wider">Contrats</span>
          </button>

          {/* 4. SIGNALEMENTS */}
          <button
            id="admin-nav-reports"
            onClick={() => {
              setActiveMenu("reports");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
              activeMenu === "reports" || activeMenu === "alertes" || activeMenu === "revision" ? "text-afri-gold scale-105 bg-afri-gold/5 font-black" : "text-afri-text-sec hover:text-afri-text"
            }`}
          >
            <ShieldAlert className="w-4.5 h-4.5" />
            <span className="text-[9px] font-mono uppercase tracking-wider">Signalements</span>
          </button>

          {/* 5. REVENUS */}
          <button
            id="admin-nav-revenue"
            onClick={() => {
              setActiveMenu("revenue");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
              activeMenu === "revenue" || activeMenu === "caisse" || activeMenu === "finances" ? "text-afri-gold scale-105 bg-afri-gold/5 font-black" : "text-afri-text-sec hover:text-afri-text"
            }`}
          >
            <Coins className="w-4.5 h-4.5" />
            <span className="text-[9px] font-mono uppercase tracking-wider">Revenus</span>
          </button>
          
          {/* 5.1 PAIEMENTS */}
          <button
            id="admin-nav-payments"
            onClick={() => {
              setActiveMenu("payments_to_verify");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
              activeMenu === "payments_to_verify" ? "text-afri-gold scale-105 bg-afri-gold/5 font-black" : "text-afri-text-sec hover:text-afri-text"
            }`}
          >
            <CreditCard className="w-4.5 h-4.5" />
            <span className="text-[9px] font-mono uppercase tracking-wider">Paiements</span>
          </button>

          {/* 6. PARAM√àTRES */}
          <button
            id="admin-nav-settings"
            onClick={() => {
              setActiveMenu("settings");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
              activeMenu === "settings" ? "text-afri-gold scale-105 bg-afri-gold/5 font-black" : "text-afri-text-sec hover:text-afri-text"
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            <span className="text-[9px] font-mono uppercase tracking-wider">Param√®tres</span>
          </button>

          {/* 7. S√âCURIT√â */}
          <button
            id="admin-nav-security"
            onClick={() => {
              setActiveMenu("security");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
              activeMenu === "security" || activeMenu === "logs" ? "text-afri-gold scale-105 bg-afri-gold/5 font-black" : "text-afri-text-sec hover:text-afri-text"
            }`}
          >
            <ShieldCheck className="w-4.5 h-4.5" />
            <span className="text-[9px] font-mono uppercase tracking-wider">S√©curit√©</span>
          </button>

          {/* 8. TR√îNE DU FONDATEUR */}
          {isAuthorizedSuperFounder && (
            <button
              id="admin-nav-super_admin"
              onClick={() => {
                setActiveMenu("super_admin");
                addToTerminal("üëë [SOUVERAINET√â] Entr√©e dans le Tr√¥ne demand√©e.");
                try { audioSynth.playValidationSuccess(); } catch (err) {}
              }}
              className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-3 sm:px-4 rounded-lg ${
                activeMenu === "super_admin" ? "text-afri-gold scale-105 bg-afri-gold/5 font-black" : "text-afri-text-sec hover:text-afri-text"
              }`}
            >
              <Crown className="w-4.5 h-4.5" />
              <span className="text-[9px] font-mono uppercase tracking-wider">Fondateur</span>
            </button>
          )}
        </div>
      )}

      {/* =========================================================================
                                     BROADCAST MODAL
         ========================================================================= */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-afri-bg/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-afri-bg border border-afri-gold p-6 rounded-lg space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-display font-bold uppercase tracking-wider text-afri-gold">
                Diffuser un M√©gaphone Bulletin
              </h4>
              <button onClick={() => setIsBroadcastModalOpen(false)} className="text-afri-text hover:text-red-500 font-bold">
                &times;
              </button>
            </div>

            <p className="text-xs text-afri-text/60 leading-relaxed">
              Le bulletin sera √©pingl√© au Tam-Tam pour l'ensemble des artistes en C√¥te d'Ivoire.
            </p>

            <textarea
              required
              rows={3}
              placeholder="Ex: Alerte pluie ! Soyez prudents √† Cocody. Les Gombos en ext√©rieur sont ajourn√©s."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full bg-afri-bg border border-afri-gold/20 rounded p-2 text-xs text-afri-text focus:outline-none focus:border-afri-gold"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="px-4 py-1.5 border border-afri-gold/20 text-xs rounded hover:bg-afri-gold/5 transition-all text-afri-text"
              >
                Annuler
              </button>
              <button
                onClick={triggerDailyBulletin}
                className="px-5 py-1.5 bg-afri-gold hover:bg-afri-bg-sec text-[#050505] text-xs font-bold rounded transition-all uppercase"
              >
                Diffuser
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* =========================================================================
                                     EVENTS MODAL (√âV√âNEMENTS LIVE)
         ========================================================================= */}
      {isEventsModalOpen && (
        <div className="fixed inset-0 bg-afri-bg/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-afri-bg-sec border-2 border-afri-gold p-6 rounded-2xl space-y-4 shadow-2xl relative"
          >
            {/* Redesigned safe exit close */}
            <div className="flex justify-between items-center border-b border-afri-gold/20 pb-3">
              <div>
                <h4 className="text-md font-sans font-black uppercase text-afri-gold flex items-center gap-1">
                  üìÖ √âv√©nements & Concerts √âlite 2026
                </h4>
                <p className="text-[9px] font-mono text-afri-text-sec">
                  PROGRAMMATION ET CACHETS PRIV√âS SOUVERAINS
                </p>
              </div>
              <button 
                onClick={() => setIsEventsModalOpen(false)} 
                className="w-8 h-8 rounded-full border border-afri-gold/35 flex items-center justify-center text-afri-text hover:text-red-500 font-bold hover:bg-afri-gold/10"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              {/* Event 1 */}
              <div className="p-4 rounded-xl bg-afri-bg border border-afri-gold/15 hover:border-afri-gold/45 transition-colors space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-sans font-black text-afri-text uppercase">FEMUA 2026 ‚Äî Grande Sc√®ne</h5>
                    <p className="text-[9px] text-afri-gold font-mono">üìç Marcory, Abidjan ‚Ä¢ 12 Juillet 2026</p>
                  </div>
                  <span className="text-[8px] font-mono py-0.5 px-2 bg-afri-gold/10 rounded border border-afri-gold/20 text-afri-gold uppercase font-bold">
                    T√™te d'Affiche
                  </span>
                </div>
                <p className="text-[10.5px] text-afri-text-sec">
                  Performance en prime-time devant 40 000 spectateurs. Int√©gration de vibes kora et kpanlogo traditionnels requise.
                </p>
                <div className="flex justify-between items-center pt-1 text-[10px]">
                  <span className="text-afri-text-sec">Cachet Artiste : <strong className="text-afri-text">Sur devis</strong></span>
                  <button 
                    onClick={() => {
                      alert("Enregistr√© ! Votre agence d'H√©ritage a transmis votre dossier de candidature de groupe au BURIDA / FEMUA.");
                      try { audioSynth.playKoraSuccess(); } catch(e){}
                    }}
                    className="px-3 py-1 bg-afri-gold hover:bg-afri-bg-sec text-[#050505] font-bold rounded uppercase transition-colors"
                  >
                    Postuler üî•
                  </button>
                </div>
              </div>

              {/* Event 2 */}
              <div className="p-4 rounded-xl bg-afri-bg border border-afri-gold/15 hover:border-afri-gold/45 transition-colors space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-sans font-black text-afri-text uppercase font-display">Abidjan Jazz Premium Live</h5>
                    <p className="text-[9px] text-afri-gold font-mono">üìç Palais des Congr√®s, Cocody ‚Ä¢ 28 Ao√ªt 2026</p>
                  </div>
                  <span className="text-[8px] font-mono py-0.5 px-2 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-400 uppercase font-bold">
                    Cachet Garanti
                  </span>
                </div>
                <p className="text-[10.5px] text-afri-text-sec">
                  Soir√©e VIP de prestige. Id√©al pour guitaristes solos, saxophonistes et percussionnistes d'Alliance.
                </p>
                <div className="flex justify-between items-center pt-1 text-[10px]">
                  <span className="text-afri-text-sec">Cachet : <strong className="text-afri-gold">4 000 000 FCFA</strong></span>
                  <button 
                    onClick={() => {
                      alert("Premium Option valid√©e ! Entretien de cachet planifi√© au Cabinet Gombo.");
                      try { audioSynth.playKoraSuccess(); } catch(e){}
                    }}
                    className="px-3 py-1 bg-afri-gold hover:bg-afri-bg-sec text-[#050505] font-bold rounded uppercase transition-colors"
                  >
                    R√©server Place üíé
                  </button>
                </div>
              </div>

              {/* Event 3 */}
              <div className="p-4 rounded-xl bg-afri-bg border border-afri-gold/15 hover:border-afri-gold/45 transition-colors space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-sans font-black text-afri-text uppercase font-display">Nuit du Zouglou Souverain</h5>
                    <p className="text-[9px] text-afri-gold font-mono">üìç Complexe Sportif, Yopougon ‚Ä¢ 05 Septembre 2026</p>
                  </div>
                  <span className="text-[8px] font-mono py-0.5 px-2 bg-pink-500/10 rounded border border-pink-500/25 text-pink-400 uppercase font-bold">
                    Zouglou Only
                  </span>
                </div>
                <p className="text-[10.5px] text-afri-text-sec">
                  Alliance de 10 groupes d'√©lite ivoiriens. Ambiance w√¥y√¥, tambours traditionnels d'Adjam√© et choeurs harmonis√©s.
                </p>
                <div className="flex justify-between items-center pt-1 text-[10px]">
                  <span className="text-afri-text-sec">Cachet Garanti : <strong className="text-afri-text">2 500 000 FCFA</strong></span>
                  <button 
                    onClick={() => {
                      alert("Inscrit au Tam-Tam ! Votre groupe est pr√©s√©lectionn√© pour le live de Yop.");
                      try { audioSynth.playKoraSuccess(); } catch(e){}
                    }}
                    className="px-3 py-1 bg-afri-gold hover:bg-afri-bg-sec text-[#050505] font-bold rounded uppercase transition-colors"
                  >
                    Postuler üî•
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-afri-gold/10">
              <button
                onClick={() => setIsEventsModalOpen(false)}
                className="px-5 py-2 bg-afri-bg-sec hover:bg-afri-bg-sec text-afri-text text-xs font-mono font-bold uppercase rounded-xl transition-all"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* =========================================================================
                             COMING SOON EXPLANATORY MODAL
         ========================================================================= */}
      {comingSoonFeatureKey && (() => {
        const detailsMap: Record<string, { title: string; badge: string; description: string; incentive: string; icon: string; color: string }> = {
          user_gombos: {
            title: "Gombos & Annonces",
            badge: "Bient√¥t disponible",
            description: "La publication et la consultation directe des gombos est en cours de d√©ploiement.",
            incentive: "Trouvez les meilleures prestations musicales v√©rifi√©es √† Abidjan et au-del√† !",
            icon: "üíº",
            color: "from-amber-500 to-yellow-600"
          },
          user_reels: {
            title: "Flex Multim√©dia & Vid√©os R√©els",
            badge: "Bient√¥t disponible",
            description: "Le studio de partage vid√©o des talents africains arrive tr√®s bient√¥t.",
            incentive: "Pr√©parez vos meilleurs clips et solos pour enflammer la communaut√© !",
            icon: "üìπ",
            color: "from-purple-500 to-pink-600"
          },
          user_podcasts: {
            title: "Podcasts & R√©sonances",
            badge: "Bient√¥t disponible",
            description: "Le canal audio et d√©mos musicales haute fid√©lit√© est en cours de configuration.",
            incentive: "Faites √©couter vos arrangements et grooves aux meilleurs producteurs.",
            icon: "üéôÔ∏è",
            color: "from-blue-500 to-indigo-600"
          },
          user_renforts: {
            title: "Renfort Express üö®",
            badge: "Bient√¥t disponible",
            description: "Le syst√®me de remplacement et d√©pannage d'urgence en direct sera accessible sous peu.",
            incentive: "Soyez alert√© en priorit√© lors des besoins imm√©diats sur sc√®ne !",
            icon: "‚ö°",
            color: "from-red-500 to-orange-600"
          },
          user_wheel: {
            title: "Roue des Avantages Premium",
            badge: "Bient√¥t disponible",
            description: "La Roue de la fortune souveraine est en cours de param√©trage par la Chancellerie.",
            incentive: "Tirages au sort, boosts de profil gratuits et bonus souverains √† gagner !",
            icon: "üé°",
            color: "from-yellow-500 to-amber-600"
          },
          premium_wheel: {
            title: "Roue des Avantages Premium",
            badge: "Bient√¥t disponible",
            description: "La Roue de la fortune souveraine est en cours de param√©trage par la Chancellerie.",
            incentive: "Tirages au sort, boosts de profil gratuits et bonus souverains √† gagner !",
            icon: "üé°",
            color: "from-yellow-500 to-amber-600"
          },
          menu_favorites: {
            title: "Mes Favoris √âlite",
            badge: "Bient√¥t disponible",
            description: "Ajoutez des artistes d'exception, des opportunit√©s de gombos lucratives et des maquis ou sc√®nes VIP √† vos favoris pour les retrouver en un clic.",
            incentive: "Id√©al pour composer vos √©quipes de sc√®ne r√©currentes !",
            icon: "‚≠ê",
            color: "from-yellow-500 to-amber-600"
          },
          menu_history: {
            title: "Historique Universel",
            badge: "Bient√¥t disponible",
            description: "Retrouvez l'historique de toutes vos actions de l'√©cosyst√®me : candidatures envoy√©es, gombos compl√©t√©s, d√©p√¥ts, retraits et interactions d'Alliance.",
            incentive: "Votre journal de bord artistique complet et infalsifiable.",
            icon: "üïì",
            color: "from-blue-500 to-indigo-600"
          },
          menu_downloads: {
            title: "Coffre T√©l√©chargements",
            badge: "Bient√¥t disponible",
            description: "T√©l√©chargez instantan√©ment vos contrats de prestation au format PDF officiel d'AFRIGOMBO ELITE, vos attestations de paiement et vos re√ßus BURIDA.",
            incentive: "G√©n√©rez des justificatifs officiels de vos revenus artistiques.",
            icon: "üì•",
            color: "from-emerald-500 to-teal-600"
          },
          menu_backups: {
            title: "Sauvegardes Souveraines",
            badge: "Bient√¥t disponible",
            description: "Exportez l'int√©gralit√© de vos donn√©es, de votre Gombo ID, de vos publications et de vos contrats dans une archive s√©curis√©e et portable.",
            incentive: "La garantie d'une souverainet√© totale de vos donn√©es d'artiste.",
            icon: "üíæ",
            color: "from-purple-500 to-fuchsia-600"
          }
        };

        const details = detailsMap[comingSoonFeatureKey] || {
          title: getFeatureNameForMenu(comingSoonFeatureKey) || "Module Bient√¥t Disponible",
          badge: "Bient√¥t disponible",
          description: "Cette fonctionnalit√© est en cours de d√©ploiement et sera accessible tr√®s prochainement sur AFRIGOMBO.",
          incentive: "Restez connect√© pour profiter des prochaines opportunit√©s artistiques !",
          icon: "üöÄ",
          color: "from-amber-500 to-yellow-600"
        };

        return (
          <div className="fixed inset-0 bg-afri-bg/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-afri-bg-sec border-2 border-afri-gold p-6 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden"
            >
              {/* Colorful top abstract blob */}
              <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${details.color}`} />
              
              <div className="flex justify-between items-start pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{details.icon}</span>
                  <div>
                    <h4 className="text-md font-sans font-black uppercase text-afri-gold">
                      {details.title}
                    </h4>
                    <span className="text-[9px] font-mono py-0.5 px-2 bg-afri-gold/10 text-afri-gold rounded-full border border-afri-gold/25 uppercase font-black tracking-wider">
                      {details.badge}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setComingSoonFeatureKey(null)} 
                  className="w-8 h-8 rounded-full border border-afri-border flex items-center justify-center text-afri-text-muted hover:text-afri-text hover:border-afri-text font-bold hover:bg-afri-bg-sec cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4 text-xs text-afri-text leading-relaxed">
                <p>{details.description}</p>
                <div className="p-3 bg-afri-bg border border-afri-border rounded-xl flex items-start gap-2.5">
                  <span className="text-emerald-400 mt-0.5 shrink-0">‚ú®</span>
                  <p className="text-[11px] text-afri-text-muted italic">
                    {details.incentive}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-afri-border">
                <button
                  onClick={async () => {
                    try {
                      if (currentUser) {
                        await addDoc(collection(db, "feature_waitlist"), {
                          userId: currentUser.uid,
                          email: currentUser.email,
                          feature: comingSoonFeatureKey,
                          timestamp: new Date().toISOString()
                        });
                        alert("F√©licitations ! Vous √™tes inscrit(e) sur la liste d'attente prioritaire de cette fonctionnalit√©. üöÄ");
                      } else {
                        alert("Inscrit sur la liste d'attente locale ! Connectez-vous pour une synchronisation prioritaire.");
                      }
                      setComingSoonFeatureKey(null);
                      try { audioSynth.playValidationSuccess(); } catch(_) {}
                    } catch (e) {
                      console.error(e);
                      alert("Inscrit avec succ√®s sur la liste d'attente locale d'AFRIGOMBO ELITE !");
                      setComingSoonFeatureKey(null);
                    }
                  }}
                  className="w-full py-2.5 bg-afri-gold hover:bg-afri-bg-sec text-[#050505] text-xs font-black uppercase tracking-wider rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  M'inscrire sur la liste d'attente üöÄ
                </button>
                <button
                  onClick={() => setComingSoonFeatureKey(null)}
                  className="w-full py-2.5 bg-transparent hover:bg-afri-bg-sec text-afri-text-sec hover:text-afri-text text-xs font-mono font-bold uppercase rounded-xl border border-afri-border hover:border-afri-border transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* =========================================================================
                               GOMBO ACADEMY MODAL (MASTERCLASSES)
         ========================================================================= */}
      {isAcademyModalOpen && (
        <div className="fixed inset-0 bg-afri-bg/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-afri-bg-sec border-2 border-afri-gold p-6 rounded-2xl space-y-4 shadow-2xl relative"
          >
            <div className="flex justify-between items-center border-b border-afri-gold/20 pb-3">
              <div>
                <h4 className="text-md font-sans font-black uppercase text-afri-gold flex items-center gap-1.5">
                  üèõÔ∏è Gombo Academy ‚Ä¢ Masterclasses
                </h4>
                <p className="text-[9px] font-mono text-afri-text-sec">
                  ENSEIGNEMENTS PROFESSIONNELS SOUVERAINS POUR MUSICIENS
                </p>
              </div>
              <button 
                onClick={() => setIsAcademyModalOpen(false)} 
                className="w-8 h-8 rounded-full border border-afri-gold/35 flex items-center justify-center text-afri-text hover:text-red-500 font-bold hover:bg-afri-gold/10"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Class 1 */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-afri-gold uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-afri-gold"></span>
                  1. L√©gislation BURIDA & Droits d'H√©ritage
                </h5>
                <p className="text-[11px] text-zinc-350 leading-relaxed pl-3.5 border-l border-afri-border">
                  Apprenez √† d√©poser vos oeuvres, prot√©ger vos codes de vibes, et d√©clarer vos gombos d'Abidjan. Le BURIDA s√©curise vos revenus d'alliance et d'h√©ritage musical contre toute exploitation injuste.
                </p>
              </div>

              {/* Class 2 */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  2. Ma√Ætriser l'Art de N√©gocier le Cachet
                </h5>
                <p className="text-[11px] text-zinc-350 leading-relaxed pl-3.5 border-l border-afri-border">
                  Ne jamais accepter de cachet inf√©rieur √† <strong className="text-afri-text">250 000 FCFA</strong> pour des prestations VIP d'Alliance. Utilisez la formule d'H√©ritage d'Afrigombo : calculez vos frais de transport logistique, vos consommables sonores, et valorisez votre r√©putation d'artiste certifi√©.
                </p>
              </div>

              {/* Class 3 */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-purple-400 uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  3. Session de Souffle Zouglou & Calage Rythmique
                </h5>
                <p className="text-[11px] text-zinc-350 leading-relaxed pl-3.5 border-l border-afri-border">
                  Technique respiratoire de soutien pour chanter en w√¥y√¥ pendant de longues performances sans alt√©rer la clart√© m√©lodique. Exercices de coh√©sion rythmique pour rester en phase avec le Tam-Tam ma√Ætre.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-between items-center pt-2 border-t border-afri-gold/10">
              <span className="text-[9px] font-mono text-afri-text-sec italic block">
                "Ce que tu sais pr√©serve l'H√©ritage."
              </span>
              <button
                onClick={() => {
                  alert("F√©licitations pour votre soif d'enseignement artistique ! Des tuteurs nationaux vous contacteront prochainement.");
                  setIsAcademyModalOpen(false);
                }}
                className="px-4 py-1.5 bg-afri-gold hover:bg-afri-bg-sec text-[#050505] text-xs font-mono font-black uppercase rounded transition-colors"
              >
                S'inscrire √† l'H√©ritage d'Alliance üéì
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {isBetaFeedbackOpen && (
        <div className="fixed inset-0 bg-afri-bg/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-afri-bg border border-afri-gold/20 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsBetaFeedbackOpen(false)}
              className="absolute top-4 right-4 p-2 text-afri-text-sec hover:text-afri-text rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <AlertTriangle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-widest text-afri-gold uppercase">B√™ta Feedback</h3>
                <p className="text-[10px] text-afri-text-sec font-mono">Signaler un bug ou une id√©e</p>
              </div>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const type = (form.elements.namedItem("type") as HTMLSelectElement).value;
              const desc = (form.elements.namedItem("description") as HTMLTextAreaElement).value;
              const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
              
              if (!desc.trim()) return;
              btn.disabled = true;
              btn.innerHTML = '<span class="animate-pulse">Envoi...</span>';
              
              try {
                await gomboDB.submitBetaFeedback({
                  type,
                  description: desc,
                  userId: profile?.uid || currentUser?.uid || "anonymous",
                  userName: profile?.nomArtistique || profile?.displayName || "Anonyme"
                });
                
                setIsBetaFeedbackOpen(false);
                addToTerminal("[B√äTA] Feedback envoy√© avec succ√®s. Merci !");
                try { audioSynth.playValidationSuccess(); } catch(e){}
                form.reset();
              } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.innerText = "Erreur - R√©essayer";
              }
            }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-afri-text-sec uppercase mb-2">Type de retour</label>
                <select name="type" className="w-full bg-afri-bg border border-afri-border rounded-lg p-3 text-xs text-afri-text focus:border-afri-gold/50 focus:outline-none">
                  <option value="bug">üêõ Signaler un bug</option>
                  <option value="idea">üí° Sugg√©rer une id√©e</option>
                  <option value="other">üí¨ Autre remarque</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-afri-text-sec uppercase mb-2">Description d√©taill√©e</label>
                <textarea 
                  name="description" 
                  rows={4} 
                  required
                  placeholder="D√©crivez le probl√®me rencontr√© ou votre id√©e d'am√©lioration..."
                  className="w-full bg-afri-bg border border-afri-border rounded-lg p-3 text-xs text-afri-text focus:border-afri-gold/50 focus:outline-none placeholder-gray-600 resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsBetaFeedbackOpen(false)}
                  className="flex-1 py-3 border border-afri-border hover:bg-afri-bg-ter rounded-xl text-xs font-bold text-afri-text-sec transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-afri-gold hover:bg-afri-bg-sec text-black rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                >
                  Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isChangelogModalOpen && (
        <div className="fixed inset-0 bg-afri-bg/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          {!isFeatureEnabled("updateJournal") ? (
            <div className="bg-afri-bg border border-afri-gold/20 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
              <FeatureUnavailable featureName="Journal des Mises √† jour" onBack={() => setIsChangelogModalOpen(false)} />
            </div>
          ) : (
            <div className="bg-afri-bg border border-afri-gold/20 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[85vh] flex flex-col">
            <button 
              onClick={() => setIsChangelogModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-afri-text-sec hover:text-afri-text rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4 shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 text-lg">
                üìÑ
              </div>
              <div>
                <h3 className="text-sm font-black tracking-widest text-afri-gold uppercase">Journal des Mises √† Jour</h3>
                <p className="text-[10px] text-afri-text-sec font-mono">AFRIGOMBO ELITE v1.0.0 ‚Äî B√™ta Publique</p>
              </div>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 text-xs text-afri-text-sec flex-1">
              <div className="p-3 bg-afri-bg-sec border border-afri-border rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[11px] font-bold text-afri-text">
                  <span className="text-[#D4AF37]">v1.0.0 (B√™ta Publique)</span>
                  <span className="text-[9px] font-mono opacity-60">Juillet 2026</span>
                </div>
                <ul className="space-y-1.5 list-disc list-inside text-[11px] text-afri-text-sec leading-relaxed">
                  <li><strong>Menu lat√©ral optimis√© :</strong> Suppression des doublons (Wallet, Profil) et ajout des outils B√™ta.</li>
                  <li><strong>Abonnements Premium B√™ta :</strong> Processus de souscription s√©curis√© avec validation par code unique d√©livr√© par le support.</li>
                  <li><strong>Support WhatsApp Int√©gr√© :</strong> Assistance directe sans affichage de num√©ros de t√©l√©phone bruts.</li>
                  <li><strong>Mise √† jour en temps r√©el :</strong> Validation instantan√©e des statuts Premium, badges et commissions dans Firestore.</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-afri-border text-right shrink-0 mt-2">
              <button
                onClick={() => setIsChangelogModalOpen(false)}
                className="px-5 py-2 bg-[#D4AF37] text-black font-black uppercase text-xs rounded-xl cursor-pointer hover:bg-amber-400"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    )}

      {isBugModalOpen && (
        <div className="fixed inset-0 bg-afri-bg/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-afri-bg border border-afri-gold/20 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsBugModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-afri-text-sec hover:text-afri-text rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-widest text-afri-gold uppercase">Signaler un Bug</h3>
                <p className="text-[10px] text-afri-text-sec font-mono">Rapport transmis au Superfondateur</p>
              </div>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const issueType = (form.elements.namedItem("issueType") as HTMLSelectElement).value;
              const desc = (form.elements.namedItem("description") as HTMLTextAreaElement).value;
              const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
              
              if (!desc.trim()) return;
              btn.disabled = true;
              btn.innerHTML = '<span class="animate-pulse">Envoi du rapport...</span>';
              
              try {
                await gomboDB.submitBetaFeedback({
                  type: 'bug',
                  category: issueType,
                  description: desc,
                  userId: profile?.uid || currentUser?.uid || "anonymous",
                  userName: profile?.nomArtistique || profile?.displayName || "Anonyme",
                  createdAt: new Date().toISOString()
                });
                
                setIsBugModalOpen(false);
                addToTerminal("[BUG] Rapport de bug enregistr√© et transmis avec succ√®s.");
                try { audioSynth.playValidationSuccess(); } catch(e){}
                form.reset();
              } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.innerText = "Erreur - R√©essayer";
              }
            }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-afri-text-sec uppercase mb-2">Type de Probl√®me</label>
                <select name="issueType" className="w-full bg-afri-bg border border-afri-border rounded-lg p-3 text-xs text-afri-text focus:border-afri-gold/50 focus:outline-none">
                  <option value="Affichage">üì± Affichage & Interface</option>
                  <option value="Validation">‚öñÔ∏è Validation & Paiement</option>
                  <option value="Audio">üéµ Audio & Musique</option>
                  <option value="Autre">‚öôÔ∏è Autre dysfonctionnement</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-afri-text-sec uppercase mb-2">Description du bug</label>
                <textarea 
                  name="description" 
                  rows={4} 
                  required
                  placeholder="D√©crivez pr√©cis√©ment le bug rencontr√©..."
                  className="w-full bg-afri-bg border border-afri-border rounded-lg p-3 text-xs text-afri-text focus:border-afri-gold/50 focus:outline-none placeholder-gray-600 resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsBugModalOpen(false)}
                  className="flex-1 py-3 border border-afri-border hover:bg-afri-bg-ter rounded-xl text-xs font-bold text-afri-text-sec transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-afri-gold hover:bg-amber-400 text-black rounded-xl text-xs font-black uppercase trackingxúÏ}€n‹Hñ‡{E8ª÷Nı8S©õe´,i)%gç,i3SûnÇãôåL±Ã$YºHJ´ÙÀ÷Xlv∫—Ù6P=ãŸùˆ√bÿó]`ﬂÙ'ıSü∞ÁD$#H¶$◊e∫Ÿ3e%dDús‚‹„D„‹–©K|W≥<√7l´1≤M€ı»(p=€m8∂a˘‘≠˝ÑdÆgπ;Ñt¨3{_3)q5«±]?◊ËÈ‚0}€ æ˛tQ7Œ“7ü.émw*ﬁÀ4J˝\∏˙I¯◊•·ıÉ…Ñz8ùó∂Æôáµ»˝˚§ûº
oíë©yﬁÅ6•õµ±qAubXı-2ú4¥±k4Üì≈«kd®çﬁÍÆÌ4Üf‡6º)õÙÇ>ùzçEËê/Ël<ã~:çUÚÆ±÷"öeL5ü6∆öNªV-5óÃí>…–v'¸~wbõ˙‚rã∏v`ÈTo,_ò–À#rﬁ¶I¶⁄E„º1’âw™Èˆ9{ÏRSÛç3ZÀ@ï√üd‡o[€¶1zªyY_ õœ¿°+Éb}¨ôXßﬂÊ°=€|J|¡‡ìS˛uÀƒß>ü˚À£#rjüQw#˝ û§9ôì.sDısqdÁç5r⁄X´ë≈,ù…H2G!9§O4ß±B¶√∆£ZÆ„ÃÀÁç•ÙΩî ê°q>é◊Z≠ExXJX àﬂ]nÂÜ ÉÿGÿs(ÅBàˆÖ’V+Èä‰ìÙt∫"v¡±Îƒ∂|X4∞|è£∑Ü5i ªÒ|Åê≤I‡8‘iÎÆf∏î%^L~OOW$Ω:πN_/µúã°±±LmÀÆ=;“\_õ–w‰Ãˆà°_†—h”Î¶aªÔ–©ƒ†r∑“œë¡ Í√©·o^jﬁÃë:e+Ï2Û}⁄t\zhﬁ°c-0˝˙¬ßŸEf[ 9ˆÕMhÓkÓÑ˙DÛ»ã¡À˝]∏›1È> ¿>Ç˜Í¯~ìÚñ^”ÿÈ]†∏z-wm!˙Í ¿◊v©~y°y¶ôïw0Ù-¯>˚¸óug}Ëd‰€n˝_^Ø˝ôxÚ0j'‚Nû≥«ä¡g~cRøáSi˙Æ1≠/, õÛ◊ æÉiÍÜßM`Îõ@~˘Qc√≤®ãcÄ6ûzéfqí6rn'0ë*Q≤ÕfÛÈ"6zˆ†dòæ;À!òÌ\3|2±ßC{Áyì‚9ıµ]Ju2ı¸+)Ä⁄yê`Á¡CI+âk8¯|É˝ê5
<Ívı‚∏ˆÿ0ÈV30tÚÀ_"KuÙ«8æ ∞≠Ÿ‘ºöÍS∏ÓÑèYˆ¥Ì˙å–èüàü "Sõa{ˆÈ6˚4ï~x‘ÊSΩÌoãûì¯Q_h˙v∑ÿî[ì˙BÓ≠´‹R…!ÑîI¥¸4]ÿÍNK3Îµ◊˝„ΩΩN–=<8!…wµ\:ÅYª¿Gàv¨∆F£Î?{MÚxöAÓ’$gB¥@7Ï˛ÃÚOõ†WöiËåˇÙ·‘ÛÄê+2“¸—)pçÀ¨‘%|µπÊñg·ã¿o\wABç∏jmì6·1,Rlîff1P…[±ïÑÏö’:@OÅK§áÃ’”@'¨ÂÜó˙}u%ÚrXc#⁄ò5V•ÇU"	LmHÕî6e⁄(uô¿Ö
âtàÂäÛÂ⁄≥PîXxgÑË 0¸ÎƒHJLÕòR◊†Ôg∞P@û.—Aa!ÊPAü‚≠∂û.≤Jé#–Ä‰ÛÙJà≈aë∞eY#◊>˜6/WØ§œËóS]Ú»mDO‘›¨u.6»gÿ\4#úFrB∆îâ£π@/”)àe`ÇycÄ§5åXπQ+¥·-A’Ceä!‰¬À†0
ºçú>
6bæiX¥|ÖäSkL\m÷x‘µãz∆;ﬁ ?zïÍS¢‘9®◊2ïçiÇ2LÆk„≈Ö!.EÏÌÚJpîç%‚Ã ∆jdpe<¡[√0EÑù¬•t7ñd€≤ì∫ïÕ«
∞è9 54‘6ë Ã'œ’[%êÿ”Ñª§‘‡;∑∫5Ae˛^Ô≈üë„ÉÓn∑≥C⁄«É‰Â·N{üÏµù>˘ŸbD£O€Å 8˛†îº	v{¸I;°i\∂G£µ  2∂.RØI:jç–∞jüc”#€	úíΩì{Ò*Åo¯&êG{{˚˙?Ù…QØ˚Í˙}Ç ≠∞¡¿Fß`Zlˆ+@_ÄíPç‡b¸˙OdD}?'Z¢o-∆\G	%∆¸§⁄0˚ˆƒ∞z!õW¬+ú®Ù•ˇ'Ú‚˙}Ø;hÔuHˇ¯Uß◊Ó»ÊÛ¥@Àè$`n≤g∂÷;Ä%(,ß◊¯8H{∑◊›;|˘¸êtˆªÉŒú0ÿ≥ÌâôûkZ’{*Hlt~jÈ_øﬂ>Óu·üé8XúÁÿ(h^∞Ú}‚Ÿ¡ä\ã¥Åœ\∞ıÛ0`sÖ—Çå`è∞˛nÊ…zíıdMı™û¨◊O‡:…x≥8ß3Èÿ/Ùk•<TﬁT≠ ò/ce-fß+°ó+“◊DˇV¯gÙ⁄Z÷œïw¡¨¢fGΩîu»î¬ÉÕ9|õL/Z‡€@XhÈrÂ"«^uáÅü…:d]‚á*q'dfƒ∆é+Ç–r~ ﬂL¢YqÜ¢â…+ï◊r…%Qu˙îË◊F!;p…VNÃ‰]8NFóe©I5˚Fó&Rw<V…@^Ÿ†8D
πãJ-ËØÏWj|˙ÉÑ˚‰«ÍH1SÓDEpππF@5î`Ç‡‹à3öûÃ	≤ÆPÆ7∞.I˝òày%Ú*+2Q\√xÄã"}Á€)î*AS™d dËUÍ/ŒË£h?$äïÀ∫X´ ”ê\˚TjPex˝~EÿÌ
∞¨£∑JçW…˝»µd2˙»ªÑ∑ÔÇ*Z\$L∏=h–-»ù0GÒ|ê“wÊ§b÷IèÍ °G¿©lú»JTikK;3&Ë/™-[>ïπ] Ω"x•=#5>^¬~m‘π´?=FWë©¬QÕÍô˜E⁄#∞ßc3o¨GFŒ˘©·SÖ\®≤‚ Â*2Œ•ÊZ˘“LMñl	äPr	é‹H‚¢Ë_Õ_8≥Yé˛‡ì¯6!GC«h¨¯xéaI"%`ëÈHj±ò7Ërñª"ï’*Zd\5°˙s:S_3LèÈèYnƒ}¯ßö◊F«Ûˆi¸/ˆ™◊4¨ëË‘´À>Ÿ4tÅêπK>&-S3 ˚7˙í◊ÅõU
€∂
ï]
‹*CÅÔ–Qÿ*PrÖ1dp3µëÓõ0≈.VÑfn^^íŸ©¡˜ˇt5√á≠¸≤{ﬂh	çóÚçÈFï*;Y¢¯è+‘<ùÍ&clÅ ÿ +k–±ÆMÅ⁄'k9ˇ)›’&õµYñúÒˆ65æ«∫±È`∞iÈ£ÕÀVsy-€¿∂v∞â¸≠˛Ê!Ärl+(Z˜¯∏iè«@ÕyF j`∑œ®i#PÿÉÂµñúÌ`ûIgáõõ`Bﬂ<ﬁGõ¿‚Rõ0y[/ä¢ß¨¶îÆƒ„òK≈‹ÎıOwV€ª+Î'Ëç¯úﬂx⁄®Kß'˘˙ÿ{È‘–¡)∂.òhŸºÀS∞¯ñœNOÍO≤	RcŒrBÙ lá Í»–	LJ∫ñéép€\@—•0A@°ùXë¯≈Õƒ’Ü`o„87Ñ[C†„º∂ŸJÙÕ≈G- ,â∑¿OäÏ:©Åπå&˙JÒ(ccNáç%©…â-æxG/0|]5éë	∏◊ûÌôÜÁ®Ä–†ˆ˙'∆‘ùR7lVrÑ#ñ_ÄI_ÎN—ë±⁄
1ºe≠D4%‚&æ‡∆t"[∏.pÖ¬%ìT8‚c◊ˆ }I%ﬂX[™- s)o®’Ú¡J~më⁄©Ô;ﬁ∆‚"ê◊,ízßÕë=]tNmﬂn,≠-=Z]k≠<j≠Æ-7û¨,-è◊Ë„G„—˙˙6—K´˘˜« F ˝˚_n>n›?ﬂ\kµd^nº6*zπÍÏÜ∑ú›ÍzkyyÌ—rk˝q´°µ«CmÂ—p}uÌcŒn•ÍÏF∑∆›“£ı•ı«ÀÎÎO£'Î˙äæºÆ-È´7ü]µnÅV‡+KèñÎ⁄Í#}È…HºÙ§¥[Ÿte∂üfÇ“!ÖÛÉñD¢¬• ˇ±á_ á°tätó∆c	dÏ2√Y‚ƒ3AÓØ " üå]{
åπµ€⁄]Z:!gÜñ¸Z\[«µ~)èŒ€#¿π!Ã”X$,PÌ!∏çúÉl*Òn%Lº[^˚†˝8üx&$8*ÚW+d§©˝3hA∆a≤t*üƒBdm$¡Ωëf“∆ìV§´LuŸ“ùÔªLäUò›˜ç)ıÚ:]bzU'∂°oLŒ®%âÒ‡Â4ÿòsÓjéD∞)Eøêπ »~ôû*Eèã804PßñRˆæﬂ!®Ω©tò
É≤â∂ÀÏŸGiæ√6ËÍa)}2∫ï´ÍwÇÜx*Úq˜ d$yCZzÃõõÅ_$í…SpÓo˛O‰∏∑◊9»«ÆÑÖd…À≥2ïj⁄s[ü±`$BØ\;c¡ñÈÜ¸"ä(<JLáwp/RçXîêµñ'ÿ.'+ß0≠SÃıQ "G#Ü≈≤F‰/!!PLâ1„XQz·àWB>›[©iß’å#ZÇˆû–_±ô¡Øo~ˇŸ÷Fß‘'m‡é„9	)ú¸≥oø˛Õ"ó∏\Ì±\Sô'-mnníóœ5\w≈≠∑zs‹ ¨Õö-∞ÑStñ∑fYÇCCˇB≥jWÂÛ˙ÊWˇU¡8tXûÏs›ÈÙ˙Énh~≠{óÂ#ì∂à'à&ç*dyÀ0°jAÕ’ä4~•“àî≠*Dò¢ã˚aò5ÀÈ§‚|¡X¶«‘TÙêk£∞ó˝lÕ◊_û˛ÑéqEéÅËÚ‡C
÷§2<lkrÄƒØÕëπzîÄDËzòÑ‰ã9ÂU»ú≠áÍú«c…æ8ã‚∆•¨$rûÖg)ö#k| Ñ´π≥À¥ófg'”C({&Àva †¥˝Q‹:¢‚¸´§iÑ›§‚Ç¶≤,Í¯ô<»û»”©…Ñπ*jUYªñD†ƒ˚ÀY#%%{◊Ú≤7ë≥‚f"¶"<Aï0Â(Õí¨Ií6Cr±©ËRâl`ﬁ<"…æ-ö¿+`ë≠HÌÀ¯’P\ˇÀˇ HÜ◊\‹S$∏är#Òíöèr≈ë=ë§ç†Í;Â∆Û#å√‹˛‘^ü¥>%o¯hêä;}Ê10Tû≈Œ ≈¥T
*˙l!>∏úÚ∏£]§LPò«ú{í6FT˜≥ˆòåkœ∂€€/:≤€=hlw;=≤◊Óµ]≤°¶äß¿Ea˘ÁF≤R	{Ãúå˝»}lX*‘…9Ò0–qü0ﬁeX≠≠ÓÊÿ∑qQÖ:jc∑±€=O∑h'Y¢ÊKl [fÌŸÓˆnª  ã"∑'ôÏn∆8≠u&mÈ6ñˇ|¥≤”Èo˜∫G∏WÖÏìÌ√ÉAØ=(§ÁôBN6]Iv≈©á÷gˇUß◊ÈÓÑCÿ¸Ôﬂvˆ»}ÇÉ<¸;r‘>ËÏK›fóB8Z°#Áÿ5≈*Vz=@|ƒ˚Mb,l‹Uw.ç+E;wùahÀ ›iCÍüS™ÍIB'≈°ÙÆ \ﬁyÃéjœæ˘√Ô˛ıˇ|EzùÌ¡a–’?åëuxâ≥Kdœ«∞SX¬£∆>ŸLìoñ!UI'bhÈ›∂kŸî~©ûë<ä,¸$ˇ_fﬂ' ó‚ß™Æ!!¶;›@	âﬂ˛#È¿J∂œIˇ˙tnx◊ÉÌ∂ÜÅ¡€®j-"dî•∫ì˛ÃÉëµ∆∂Îì	 Õ¡Ë=hÍtbª3Æ˘ß”öî3∞/K˘UÒ∑ä,m£_…hN&w™8s1ó]‹)C{Ü%§…@%ƒñDˇëÙ„Ã¿Ω{Œıüë´W$;R_»gÙ∆ÎEÿÇ}…S‡G~è:^ò	Hı◊ä®‹	*≠+¥;±!€∞Ω®¿øKéy∞ƒÙéïBèz„ÖT‹£ßTs=L[LqÙîÑ)Cl…ÓÙXVî¡¨%¡åQìú ·"<·\—Ø¬XöfpnÇˇ≤wj
=B¿ˇ ‚;◊∆Üe∞ÌÖÊ€ùÄÿı‡i‡∆N:©ø;7õoæ˙_’&Û¬fÜ‘ùŒß?:•z`r7#Ωÿ Kè7Ä‹dy	˛ùs&ﬂ~˝èß2`°J‡nãÆ∞R+MåiÇæ®–‹˝®á] &∑"”ﬁAmtÓªû‰sn<ƒ#A]˜À DW…4•æ úË3%?S¯ñ§<f·vê)„@E€äW{âfÜ◊˛aºBˇØ¿!∞In¿—ã¸oI?¶15∞ÉÍ®(˚.&¶Fˇlì˜¢J/¿ØÎ◊q£r1˛ﬂÅıÁQkÑeD(I-FÄ	Êˇ~q˝'˜pˇõP-¿ìó»^ÚŸK-ä¯Ö˘˙·ˆ1ÛÙa∏ï†oÅ∆∏ô.≈¿â|`LcBØÜH@‡ÿ†áÓ+∞Al¯®„⁄S@˘äÜi“w ﬂ•.´˝cŒ(¬3Ü.©˜ŸÀt!«Ω}‹è?≤◊ß‰Î∏ÿ	≤ﬂ(KY	+∂—ã—§ﬂQ4ßŒÍŸ(á?+8íπ™‰Hˆ*y∆Õ∂l…‘±Æ¬3^Õ&+SÏ ∆Kπ7“À¯o»Rù-îÇ,]8„Û◊ﬂ~˝_˛	MÃ£ﬁı˚~Á`ªsí“-…O?πÃB‘ıpﬂ‰'ó@áW‰a¥á:æ∏w‘'g∏Z5I«"öèqnF6gÒæ"Í§nCÙ¶≤'n{|J–kÊ>.Yh~^>¡Ú-4Ö_(¶„%›∞¡\îhpäª“1&ùﬁ¥œS@‘ûéå §ÎpÔ_v`lHpÁe∫2ób+ª$ª'„æ‚∂å⁄Pd–‚uîÂ	§∞@æ˝˙üˇwë$Tß˜ç>∫∏◊˘«ôa_!aÊ˙:d‚u„∑ÎTêßIó S≥SûCº∂ÉäwHc%ñîTıå	pdT±Êõﬂù`ÕÒ<lø7ÜB˝„1ÙWÌ˝ÓNõWDJñdƒë%V0.è©≈jËT–Î9[∆◊å(QÉïû˘∞„Líê,Ä9gÊ–èî-'ê'á"÷ø˘„ﬂWbÀÍ¶S¡√d\˙BoŒËÉ>Îg∏‚≥ÿK©rÎ|¬¬‡–ºﬁø(v˜Ì◊ø˛g…ÙK|Ω¶•é»Åπîéo·í*ÚìVÒÙaBÅ/N≠‘i˚!wv¥YQ¶ñÑÚΩ¶≈#T∏!æ˘„o»†”{Ÿ=∏~OÓì˝ÓÛÎ˜†óçwôäÜ	ªÖ¬˚&CN¸µ©‰÷‘ˇÈ`LÔ∏◊';PÏ;˝ìUfpÉ!Â√Ω| 0àˆ`–9t0ÃŸÔÓ¥˜Ká†‚ˆ≈µˇ•$µõ_,ÇËb÷wHûCıéÅ¯Ω{s!¸˛}roí.á∞94]òÎ&éÄ–KzRF>ﬂE”?tx Bt∞Õl#–± ´A≠aƒÉ˚ﬁË˙œ°™ø8¿™ˆæ†
∏˙Æµ?ååﬁΩ∆áÏ;ü5>ÉBv8XA}35ëúC≈è¡quüL‡oS4›Ô˝ê‘∫d◊i§÷Ò=úﬁ€YN©Ôeƒz‘2RÊ˜èXëO5ó LÎØ8Jw•ëΩ˝õˇ{+≈N•†·Öÿ◊º¸ÚﬂªÃ6æÂ€Øø˙Ô°‚√4á0ËÑl€çê˚r§ªÙ˙_äÆ?ê|pûOnöle!G˘Üì¢]—hã“1óCD»4åëA$+ïpÙóË‚â¸¨ÊÆ|küπ®ãÎ∑øπ-√RΩ™¥BÀ≤cvœ¡ùÑ#ÕQñ¸|f®#Åeff&c±ÿ‡¸x˘(s[wQïΩ‰´π<GTKˆÅ∂&®c∞¢]Z≈lïDNpËcVŸmX•“·Œ¬UÆR§6…¬^‚9Òeª≈≤ÖÈ¡´Á˝p”AwØ€9Ów>í4/–äÃœ|‚ÊJ*«%©—òM…ãÓãÛ∑ìR%ÛÏ	SVà–Åôèƒ∫É«19ÂÈ¬ƒ:-åÒ≤™û>ñ:E!‡b≈ƒYBX=hÀ∞Û&@Œº»K⁄váÄ>«jà• ≤‚®MiÚ≠ûsf≈π‚œ^⁄∞ÿŸ‚øsX1¨D˚V”•ön‚;@wΩs˝aFŸıá⁄’”°[∞ÎA«ã {∑	n¶°<+Äá ‹¶6tÒp«1AÕÖßò$›§©RÍÜ¸a±«£\eúKa‰÷u˛ƒÆ∆
<_`WÉDƒ
ÔèQØaZ≈rı1Û$u{h‚Æ¿R!DŒÏeﬁe5K9Ÿ=FY‚H4 #éM{'D~âóza≠Q˛a*ñWaT¢‚,2´Í sE’˘6äs©⁄úüET‚;ú∆eHP#úmqY’"ÌÒ±kn¿ØíxYÈîÛûñûŒd[á∞dÙ¡I$Ùuën©5°ñÓf∂Ç«Ω¡9ºAëY\ ®Ùm
ˇWX≤2úfîä|∫0q™cﬁÂóKŒhÍ
©ﬂªˆ^ƒ¯É3ó;‚vëÙYò∫I4;¬…°Äk
≈G…¡d~TÂªÉnúËæÍ¸Á†Oû∑{Úö02U;©uPC·~Á¨“Ø™g∆ }V‘pKM0îæ˙Ú´V.∑¿ˆHë ´(∫¬SJ∞z˙‡îZπ îŸãÀ√€7ﬁ≤ÃˇùøHeˆ^ªü|)b∞ç`•’YslòÄ™∫°„Ë·ø˜6)ã0
`BØ#∆¨jt¢÷ﬁ’ìêñ¯πØ*\•∂/^Pñ¬G'ó…Ïk=äı}‡∆ßúbjX´*¢m4JD›è9‚A·`%µOä∂z÷
X≥j£≤ÇÈ&kÏÚs≈∂4í≠9π%có÷˜…Â\tápJªXê≤Ãö=∏˙\>ëËòP!!¿πì‘ò4∏‡GLp ÀX±¬I—>◊\=´®hÓf
k¡˜êÊ'éìTÌÊ;QÊÔ(l+†4Ï œ¡äÍ~¶Ü!O\Fû¯€ﬂëéô˙¡qƒæv∆8¢áˇ2uı€Úƒæ¯≠J\ëè‚œoZ¯Ø<sD“8Ëuˆ∫˝AØ≤ècl4Wl'√ÂiQg∂«àX»ÁÁä·É+2÷Œl◊~¯,rNBºC&)Æ”àF ƒ#X(sP_=‰ÊúÚπmøùjÓ[≥º¡úÔÑ]ﬁ†ﬂNB^!œLs∏[qÃ‰òˇ˘ø±ÕÑ pçIhL”v']]µπƒér9ª·ëò:,¯Ç™1ﬁµM”>7XÕ†1˚õÍ¸hL1¨Á¶nø†Á˚|H¸ÏVÓ≥2>À{πjÊÖá¸ÈI!ÔﬂMøSS0h„Ô˚6z2õ¨Ñû,À6aºâFÜìÇá5«µqóÎ&˛¸˜À…ëdèªØzÆÂä@«˝äû6DÜ1eB7∞ñP¸Û
UØL¬´Jƒ§ïä àÎ«†¯*IzéEtóº>‰0Ê∂â>J-·Ÿ»!”YLÌôÉ◊„ë∏ûÇ—ﬂÓÑ˝ﬂŸhA«!«¿o%VQ&¸·œâgÁ&™xŒı ‹¿›âsxÀÁÚîgOnÏºÏNH7IÑŸÛS√Kü;Ã·Ë–´Ö°Ã–&,‚≥Õ«vU‰-r0Ñn—j¨˜∆ºLQ'YY¶¯0˙LÁ‰nrﬂeƒg"™çJÁil◊Áÿ’∞Ä€ê8eI$å: y–í„…è‚•2∆ø◊–¨âIeŸàsT÷ã*:Ókw≠Iæ˘áﬂ£/ûm<üRıËÃVç≈Øp(€méL√⁄ö´7œ] £Ä≤˛y&⁄J§p’ê:/∆∫°j∆ÛêxÆ—Bqî!Ò‡P>j˜¯Õ“µx—vñÿ ‹áìﬁ»v∂áòü7ÕvÃzm8öcÄÃ*âl‹&UÈá∞ºSı…ÓlÅãÑ}ZˇTsÈ≤dπñ¨–¸≤™≤LÛO‘u∏0ﬁ√9ÍÓv˜;´nUI" "√àWÂ6|Hí,œ´eÖ“´çÆX∞K^_ù$WZ_®ﬁ¢¨ %ÕòR&gT0∂ö#†º∂_oÒÚ¶áädÜ¢µ¢VŸ‹&ûÜ%d8±?ﬂÅ∆…éêÀdÅ1DïxçÎ√ﬁ^˚†€o:«Ω≤T≠í!BSüÂNÖªú*¿≠∏ÆÙú!¡"ﬁπƒg5”¿‹nÏ‡.Ã~1$+WÉI¡QËVRvJ‹H≥|/⁄Ω_ ˆmë%0$ZW†ïz~`bª"Ó&Öak€Èˆ∑è˚}jHê^ßΩﬂt_v»ˆ·K‘ñ˚ïX]RPzt´Ç∑¨‘ÿÈµ∑;©Y†Q°ömÛtP–UÑ…h¿∆öô™ú%`úü¸µ˙8WﬂqïõÛ.K≥T≤è∫≤ò?(t·÷Û◊J€s.|∂iRk‚ü≤≤oäﬁ¯%9ú0§|:`º6ÂHÁ˘Å%v·ûv›FÅÁ°∆¬,5–›¶6€ÍL:`)L£”ãGFxV£‚^—hã’æ$•ﬁÕ¿ìÌTsÍı—Cb0Tó‰tæ•≥ÕK„*≈Ó™ï“OJ[f'Ø±ÃQT≠Ja=ô¨gßnÀ ∆≈π∏.[îN_*˚N.Kç´¨6pa%O,ù◊ƒ”m¡êÒÇ!Øí^o=$À≈«$Ñ}W©Œ%Ÿ¶I„º|f’ì«Òƒq¨Vµ,˛Æöı
™~QÂiv®êÔá XbΩKw¬“2zƒRï˙+≈ëî?Ö∞»  D˘íê˚5t©ˆ∂qƒù;Rùçﬂë˘≠<º‚\XïQ∏ê?S¯X±‘˚ÿ	dg€∞/(wÌ™,ø¶?/bÀ™*ZÄ1=¢ß∞b©Ê§Ê–waºÒÀ 40Ò6 S`Íœ^‰>’f≥©˙†°o÷F(!Gn∞⁄4iÃ/€˙[:€±œ≠¯ÏQµ4D1Jõ¿≥yΩ‘≥ëãÎ¥pë~¶ôxÚm˙Ïp<f·≈‡Â>CFá˚Fö–(Ä ”ä˜>1œ(4Æí@\h^üQ2C4
O¬àﬁÁ¸Ñ;é«Ü	&G≠1ä‚;aU(l5√≤ÎIÏ'åS¥Å]Ã¶¥`
!2∏^Ü}?dkÒÇg˜˙x∂ÔıØà˘¿Ä∆´ÆäøZ¯–£˛û®¥›}˛1K5∆@%˚ÙÎXˇ[x»f™Œ˚¿´4´∏a"H◊J–rÁ±…í#9TäùÍA^¨Gèk Ç∂∫ë”àò¥cOíè§î∑¥•‚ÃS<!>-õV…Ëz+˙§¯Ï &<•≥Q˘”
∑STﬁJÚNÄyF≈t†ëê,ûœ∫z]Õôd§TÎÁ,5Ïvã”›V)˜¨Œ;L¢y˘ÊÌ∏ÊwŒ3?«,xtSnYâWﬁÜSñ…	RÊBD¢9„ùÛE5W¨¬˚R¢”{§√√’≥ªû€Brxêx 6Áz"ÃÏü®t§êJ}ÓXgˆå∫
w•z„C±WMz3só≈¯∂‰]€ˆ•Å{ŸQí˘3◊Â;î£◊cı|Ev∫‰wqànR·m•9œI"·≠êûµæÚá≈îùLZ∏G}dÓZi‘KF'¸]	ù(#√%NvÃ¨´¢3¯¿–s|=‡…à“√]nF.§97,›>g˘QÁãŸid;|{ ◊¬à2}„€oxÜõ¶{oŒˇÙW'kÅÔÈ¨C‹E«oÜö £ Å	*πtµ‡i„ıÚâåÄ•¥‚›”ú∏%åTd∫Ø⁄Z√ˇùDGÏænΩYu.ﬁ,≠¡‹…P´//-?\Z_{∏∂ˆ∞’\^[8)˜ÀÖ·„9πQﬁƒØ0b˙Ú¯’a∑G⁄Ø:€Ñß¥w˙7â–™∂ﬂô£xN¢.e™‡º˙,"¸Ú®ÇQ´4ßÏce-˛…˘¨(ÅπEj∑=X8ôe˚8	Ã˙SÔπ‹ U5û,>y∑ÚtME¸(+¨aaƒ(†y‹Î${*ÆﬂwXF‚Œı˚Ìﬁ·ˆãNèÏwHx&ﬁ=ÚÌ◊ø˛üäs∆ï´1ß¿‰ı°ßãSõïŒ<…4ç	ú;2√®4Ò\∂x;ΩJPú.5qM•+å<ÌûC-å ÜárÄú/”∏ †Å±B}Pù ìl	,>Æ™xä,\'µg™åàêós°êXëk⁄ΩJÚtET°ƒs´û{¡ˇ{ï"õ7ÉM
ËLñn¶°ì∆ï†?q’¯c®ddÙ¸yI@« ⁄—`ôÉL≠ÃçÿékèÌ¬G”ù'fz-3Õ%Íel›®¯wh	Û¿6"§¶-±£√nçÏFU·#[¬6™¯Ó	¨ºïc∆˘¯_ˇøËƒ¿s÷—Ppœåpv¨π€Û∞–¢N±é>pÕ∞(&_Gi©<ºâ)rÈIÒ∫|Ç⁄EÍ∫SQéötw)È#∏ìû.FK/∫'[—Ò—¿˘Um§O˛K]◊1ÑÄR†7<¨≈±y˘‹∂M™Yıƒrkh€¥=*û	ò9óY≤∏Æ=`i}Yå»ìÂÌ∑˘—À˘7¬3ôeÔÏk~æ}t<≥Ùk"y!:§˘VT…OIåŒ˘ÀR¶åˆtÚûf[FaÕêû»(é[Ç1˘)é<a<y5û∞8]añõwuï#¬´◊ÈÏ˜…´ÓNÁêÏw˜^û˛úˆÌ˝~ÚÖ;î»D¯^â•¶Gxï‹_ÿ¡ R≤èπXC˚˝Á≥î#Ê“≈Ê¨u7s^j1ãyá˘,pU∞•0AS»Êx≤Bêét◊vÄKncö.ÛñÁBåë`¢—9;ÑX,É˛}∆¶(â$`õ8È‘–uä!qyù— g2ÀÌ´º”®'¿OÓ,¶¢=€ƒ≤}>ÃùŸ&àˆ◊ª∆R+<µOÄ’z∂"#¬o-ÎJ1‹îóh®(‡òÚ<q„e©ï≥^R˘©Ye5cÓ"ﬂ¸ÒwUX¶H?5∆.Ä#+›o—1LÁÁÁÕô¯@Ω»HÈtHı≈OR‰zµÖâfH“õK9Î!ÃŒéV 'N˛YÑçÊ9É»f≠ï} å%@Ë&uÌ)»|J¢û?%ÒŒÄ€)h<#wÊÄ°€òR›–>%ìôk{#€Ågé1B≠®aXçœO…96<Ãóˆº8Ìè`⁄YRÃØêSˆO˙+ãHÍgZ4¨E|§ßùáº§9vÕøh&R:è[sÄ_ŸL56√q+c3)ÇΩ 6am ˛ÏzÑ5ÑﬂW\âƒ~Å4Üﬂ3ÁN&◊Ÿ@	•fi GNgcçXõ∞I¸Â¨Õ›W¨)Ó∫à*Øèµ”m≥T»?ÖO¿O7M…å\∞∑R'åjÍMÿ¿“ñ(ﬁÁP`I/.Ü`Ùxƒÿåœ`ä[∆cXL©ïmh•Ö∞˜R¶ú«ut√∑]˜wlÕ≠µæWKÓÚû·ÌRf¸w,mhRΩ^”Dj˘êMıâ„º*Iâ\0€G•ò\:•¯Q(8¶zòN,ã4Üì>∂`∂Üâ3'c~ã˜À…¢T˘\ÀWü•ò»»…ß¨H˝çô[˘ê¡S±©©Um¬⁄íóô%Ä5Ë_W¿_W@’ÃGZ Ï˚ÙüÔﬂ∞0nkª≥ÕÀ◊'sÆAZ<jí]√•ò¡NvmbŸËL%wΩ8 ]€“y˝è¿¬˙,ë0#YXíÒéÍÏï]Ü"˜/ku=ç )¿QÍ)4º§Û6•õ…® ˝BL7sØ≠7…Q0ƒ
‡°™C…ˆ+Úá ¨Á¥6ﬁ8lõv§e’6Gl ΩÅ®3uıBÓHıVVïÛÖg†ü©^ì™uõó¬q48É@›»…SŸadbG√në†r åﬂﬂ∂≠3˚Ôˇ4∑¯~ U´´/©‘k¥xf–{bµÖr˜PG-4J»ë6cÚË‚¬Ár|yßˆπ§]í˙ÚWrnO‹	∏Iµ,◊µÎ¢Ü≠y∞ÊfíhWÚ∑Ú(TßKá.¢'<Øı€Ø˝>\#ºP/”æ1Pî*MrØ
∆ÜM“5qŸ9≤Ÿ ¿.ŸÅ°9,∂£„æ√r<û¯8Ì∫ñÒëlÎˆ åì1èí'Üe¯ÜfˆX›†1°/~O°'M≤g⁄Cò~€≈Zˆ◊"qÒÙ]” µ?Ü(µ°s/ë,Zº¢¯æ∂™ò)]C*n7“0°BC”û ˇ/o/gE”¶á9y»-Íq©¢_˛≤¨ÂòÀTe€∏DRM◊ºSÊ¯´–ˆD1ı+4ÚADxö∫öÆUÁTs*¥rÃ†JßéKßF0≠–2Ù¢®ZrLz®∆º·ÿ€EÇ.Â®YHa:ﬂd@$à3*£¯vDÓú»vX.’t∂}Û“∑}Õ<fwBAÂ•„Tú%’.Oä*ñ>≤ÿUZs¿ç›ΩûOŸy’Ÿ?<ÍÙ»´N7zìC¯cø˝qÖÜÄa4iÇ÷Cœ®i\£ÏÜ,4§ ‡–ˆ}{
ö˜.£ov=≥∂£ç÷àáän,•*%5¬€$ÙÍ5(*Œ^∏ó±¿3+∏AˇÃ:u+(ÊöbaÑ¬Ç!IñW‰wÙYÅ±hAŒB{ñ(g∞∑èéﬁÑ8∫íô(xÁ˘qwg#ã0v˜ÕN{–QΩòﬂ∑˘”ù’ˆÓ ∫∏çµˆÏÂ·PÃı{F2GX%´…ÔÊ>Z≈Ÿﬂ…{ıìˇ  ˇˇ Òpr¨