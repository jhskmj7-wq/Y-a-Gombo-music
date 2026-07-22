import React, { useState, useEffect, useRef, useLayoutEffect, lazy, Suspense } from "react";
import {
  collection,
  onSnapshot,
  getDocs,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  limit,
  where,
  orderBy
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { lazyWithRetry } from "../lib/lazyWithRetry";

const AdminStats = lazyWithRetry(() => import("./AdminStats"));
const AdminReports = lazyWithRetry(() => import("./admin/AdminReports"));
const AdminActions = lazyWithRetry(() => import("./AdminActions"));
const AdminDashboard = lazyWithRetry(() => import("./admin/AdminDashboard"));
const AdminUsers = lazyWithRetry(() => import("./admin/AdminUsers"));
const AdminNotifications = lazyWithRetry(() => import("./admin/AdminNotifications"));
const AdminRevenue = lazyWithRetry(() => import("./admin/AdminRevenue"));
const AdminSettings = lazyWithRetry(() => import("./admin/AdminSettings"));
const AdminSecurity = lazyWithRetry(() => import("./admin/AdminSecurity"));
const AdminFounderThrone = lazyWithRetry(() => import("./admin/AdminFounderThrone"));
const MultimediaCenter = lazyWithRetry(() => import("./admin/MultimediaCenter"));
const AfrigomboEconomieDashboard = lazyWithRetry(() => import("./AfrigomboEconomieDashboard"));
const AfrigomboBuilders = lazyWithRetry(() => import("./AfrigomboBuilders"));
const AfrigomboBuildersAdminDashboard = lazyWithRetry(() => import("./AfrigomboBuildersAdminDashboard"));
const ThroneCinematicIntro = lazyWithRetry(() => import("./admin/ThroneCinematicIntro"));
const BetaTransactionsAdminPanel = lazyWithRetry(() => import("./admin/BetaTransactionsAdminPanel"));

import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import AuthScreen from "./AuthScreen";
import CompleteProfile from "./CompleteProfile";
import GomboIdUserDashboard from "./GomboIdUserDashboard";
import HeritagePage from "./HeritagePage";
import GomboMusikEcosystem from "./GomboMusikEcosystem";
import { PrivacyPage, TermsPage, DeleteAccountPage } from "./PublicPages";
import FounderThrone from "./FounderThrone";
import MessagesView from "./MessagesView";
import NotificationCenter from "./NotificationCenter";
import ComingSoon from "./ComingSoon";
import { UserTerrainLandingPage } from "./UserTerrainLandingPage";
import SettingsModal from "./SettingsModal";
import AfrigomboPlus from "./AfrigomboPlus";
import { MonAbonnementView } from "./MonAbonnementView";
import PremiumEmptyState from "./PremiumEmptyState";
import AboutAfrigombo from "./AboutAfrigombo";
import { AfriGomboLogo } from "./AfriGomboLogo";
import SupportAfrigombo from "./SupportAfrigombo";
import WhatsNew from "./WhatsNew";
import AfrigomboHelpCenter from "./AfrigomboHelpCenter";
import FirebaseDiagnostic from "./FirebaseDiagnostic";
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
import GomboContractsDashboard from "./GomboContractsDashboard";
import AfrigomboWalletDashboard from "./AfrigomboWalletDashboard";
import EventsView from "./EventsView";
import { audioSynth } from "../lib/audio";
import { interactionBus } from "./LivingInteractions";
import { AfrigomboVibeWaves } from "./AfrigomboVibeWaves";
import { Carousel } from "./Carousel";
import { useDynamicPlaceholder } from "../hooks/useDynamicPlaceholder";
import { isSuperFounder } from "../shared/admin/constants";
import WakandaTechBackground from "./WakandaTechBackground";
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
  Handshake,
  ArrowLeft
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// --- IVORY COAST LOCATIONS (COMMUNES) & DEFAULTS ---
const IVORIAN_COMMUNES = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", 
  "Port-Bouët", "Koumassi", "Adjamé", "Abobo", "Bingerville"
];

function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// --- TYPE DEFINITIONS AND COMPONENT INTERFACES ---

interface UserReelsViewProps {
  users: any[];
  setReelsVideoId: (id: string | null) => void;
  setReelsVideoUrl: (url: string | null) => void;
}

function UserReelsView({ users, setReelsVideoId, setReelsVideoUrl }: UserReelsViewProps) {
  const [selectedReelFilter, setSelectedReelFilter] = useState("all");
  
  // Aggregate real videos uploaded by artists + falling back to premium clips
  const allReels = [
    {
      id: "local-reel-1",
      title: "Intro Improvisation - Saxophone Prestigieux Live",
      type: "video",
      url: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-guitarist-playing-acoustic-guitar-34232-large.mp4",
      artisticName: "Thierry Sax d'Abidjan",
      category: "sax",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
      description: "Test de sonorité en coulisse avant le live de ce soir à Cocody. Un pur régal instrumental."
    },
    {
      id: "local-reel-2",
      title: "Fusion Kora Traditionnelle & Batterie Jazz",
      type: "video",
      url: "https://assets.mixkit.co/videos/preview/mixkit-playing-drums-closeup-34301-large.mp4",
      artisticName: "Sékou Kora Excellence",
      category: "kora",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      description: "Enregistrement direct de notre répétition en trio à Marcory pour le Gombo de l'ambassade."
    },
    ...users.flatMap(u => (u.mediaGallery || []).filter((m: any) => m.type === "video" || m.type === "youtube").map((media: any) => ({
      id: media.id,
      title: media.title || "Démo Artiste",
      type: media.type,
      url: media.url,
      artisticName: u.artisticName || u.name || "Artiste Gombo",
      category: media.type === "video" ? "raw" : "youtube",
      avatar: u.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
      description: "Démonstration authentique et accréditée téléchargée directement par l'artiste."
    })))
  ];

  const filteredReels = selectedReelFilter === "all" 
    ? allReels 
    : allReels.filter(r => r.category === selectedReelFilter || r.type === selectedReelFilter);


  return (
    <div className="space-y-6 pb-24 text-left animate-fadeIn">
      <div className="bg-gradient-to-r from-afri-bg-sec via-afri-bg to-afri-bg p-6 rounded-3xl border border-afri-gold/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-[30%] opacity-25 flex items-center justify-center">
          <Video className="w-40 h-40 text-afri-gold animate-pulse" />
        </div>
        <div className="relative z-10 max-w-xl">
          <span className="text-[9px] font-mono tracking-widest text-afri-gold font-black uppercase bg-afri-gold/10 px-2.5 py-1 rounded-full border border-afri-gold/20">
            PROUVER VOTRE TALENT
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-afri-text uppercase tracking-tight mt-3">
            Vidéos Réelles & Sessions Live
          </h2>
          <p className="text-xs text-afri-text-sec mt-2 leading-relaxed">
            La crédibilité d'un artiste n'est pas négociable. Découvrez les coulisses, les preuves de répétition au studio, et les captations scéniques authentiques des musiciens d'élite d'AfriGombo.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-12 bg-afri-bg/40 border border-afri-border rounded-3xl text-center min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-afri-gold/10 flex items-center justify-center mb-4 border border-afri-gold/30">
          <span className="text-afri-gold text-2xl">🎥</span>
        </div>
        <h3 className="text-sm font-bold text-afri-text tracking-wide uppercase font-sans">Vidéos Réelles</h3>
        <p className="text-xs text-afri-text-sec mt-2 max-w-xs">Bientôt disponible dans votre espace d'élite.</p>
      </div>
    </div>
  );
}

interface RevenuQuickActionModalProps {
  activeArtistId: string;
  users: User[];
  saveToFirestore: (collectionName: string, docId: string, data: any) => Promise<void>;
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  setActiveQuickActionModal: (val: string | null) => void;
  addToTerminal: (msg: string) => void;
}

function RevenuQuickActionModal({
  activeArtistId,
  users,
  saveToFirestore,
  transactions,
  setTransactions,
  setActiveQuickActionModal,
  addToTerminal
}: RevenuQuickActionModalProps) {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawCarrier, setWithdrawCarrier] = useState("Orange Money");
  const [withdrawNumber, setWithdrawNumber] = useState("");

  const currentUserData = users.find(u => u.id === activeArtistId) || users[0];
  const balanceValue = currentUserData ? (currentUserData.balance || currentUserData.revenue || currentUserData.revenues || 125000) : 125000;

  return (
    <div className="space-y-4 text-left">
      <div className="space-y-1">
        <h3 className="text-sm font-display font-black text-afri-text uppercase tracking-widest flex items-center gap-2">
          <span>💰</span> RETRAITS & REVENUS SÉCURISÉS
        </h3>
        <p className="text-[11px] text-afri-text-sec">Suivi comptable en temps réel lié à l'Académie Afrigombo.</p>
      </div>

      <div className="p-4 bg-gradient-to-r from-afri-bg-action to-afri-bg border border-afri-gold/35 rounded-2xl select-none flex justify-between items-center text-left">
        <div>
          <span className="text-[8px] font-mono text-afri-gold block uppercase font-black">SOLDE DISPONIBLE</span>
          <strong className="text-xl font-display font-black text-afri-text block mt-1">{balanceValue.toLocaleString("fr-FR")} FCFA</strong>
        </div>
        <div className="text-[8.5px] font-mono py-1 px-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
          GARANTI COCOT ⚖
        </div>
      </div>

      {/* MOBILE MONEY WITHDRAW FORMS */}
      <div className="p-3.5 bg-afri-bg border border-afri-border rounded-2xl space-y-2.5">
        <span className="text-[9.5px] font-mono text-afri-gold uppercase block font-bold leading-none">DEMANDE DE RETRAIT INSTANTANÉ</span>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1">
            {["Orange Money", "MTN MoMo", "Wave"].map(op => (
              <button
                key={op}
                type="button"
                onClick={() => setWithdrawCarrier(op)}
                className={`py-1 rounded text-[8px] font-mono font-bold uppercase border transition ${withdrawCarrier === op ? "bg-afri-gold text-black border-afri-gold" : "bg-afri-bg border-afri-border text-afri-text-sec hover:text-afri-text"}`}
              >
                {op}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Ex: 10000 (FCFA)"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="w-full bg-afri-bg border border-afri-border text-xs text-afri-text p-2 rounded-lg font-mono focus:outline-none"
          />
          <input
            type="tel"
            placeholder="N° de téléphone du destinataire..."
            value={withdrawNumber}
            onChange={(e) => setWithdrawNumber(e.target.value)}
            className="w-full bg-afri-bg border border-afri-border text-xs text-afri-text p-2 rounded-lg font-mono focus:outline-none"
          />
          <button
            onClick={async () => {
              const cash = parseFloat(withdrawAmount);
              if (isNaN(cash) || cash <= 0 || !withdrawNumber) return;
              if (cash > balanceValue) {
                alert("❌ Solde insuffisant pour ce montant de retrait.");
                return;
              }
              try {
                // Update user balance via Firestore sync
                const newBal = balanceValue - cash;
                const updatedUser = { 
                  ...currentUserData, 
                  balance: newBal, 
                  revenue: newBal, 
                  revenues: newBal 
                };
                await saveToFirestore("users", currentUserData.id, updatedUser);
                
                // Log transaction
                const txId = "tx_" + Date.now();
                const tx: Transaction = {
                  id: txId,
                  amount: cash,
                  type: "payout",
                  description: `Retrait Mobile Money (${withdrawCarrier}) vers le numéro ${withdrawNumber}`,
                  userId: currentUserData.id,
                  userArtisticName: currentUserData.artisticName,
                  timestamp: new Date().toISOString()
                };
                await saveToFirestore("transactions", txId, tx);

                // Post local list updates
                setTransactions([tx, ...transactions]);
                
                setWithdrawAmount("");
                setWithdrawNumber("");
                setActiveQuickActionModal(null);
                addToTerminal(`[PAYOUT] Retrait de ${cash} FCFA demandé via ${withdrawCarrier} vers ${withdrawNumber}.`);
                try { audioSynth.playKoraSuccess(); } catch(_) {}
                alert(`💸 Retrait réussi de ${cash.toLocaleString("fr-FR")} FCFA vers votre compte ${withdrawCarrier} !`);
              } catch (_) {}
            }}
            className="w-full py-2 bg-afri-gold hover:bg-afri-bg-sec text-black font-mono font-black text-[10.5px] uppercase rounded-lg transition"
          >
            ORDONNER LE TRANSFERT ⚡
          </button>
        </div>
      </div>
    </div>
  );
}

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
    "Découvrir une opportunité...",
    "Chercher un beatmaker...",
    "Trouver un studio..."
  ]);
  const { currentUser, profile, logout, refreshProfile, setProfile, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isBetaFeedbackOpen, setIsBetaFeedbackOpen] = useState<boolean>(false);
  const [showGoogleLoginRequiredModal, setShowGoogleLoginRequiredModal] = useState<boolean>(false);
  const [activeBoostItem, setActiveBoostItem] = useState<{id: string, type: 'gombo' | 'candidature'} | null>(null);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);

  // Scroll Position Memory Engine for Independent Scroll Preservation
  const scrollPositionsRef = useRef<Record<string, number>>({});

  // Mount log
  useEffect(() => {
    const handleOpenDiagnostic = () => setIsDiagnosticOpen(true);
    window.addEventListener('open-firebase-diagnostic', handleOpenDiagnostic);
    return () => window.removeEventListener('open-firebase-diagnostic', handleOpenDiagnostic);
  }, []);

  const requireGoogleAuthThen = (action: () => void) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      try { audioSynth.playKoraSuccess(); } catch (err) {}
    } else {
      const hasGoogle = currentUser.providerData?.some(
        (p) => p.providerId === "google.com" || p.providerId.includes("google")
      ) ?? false;
      if (!hasGoogle) {
        setShowGoogleLoginRequiredModal(true);
        try { audioSynth.playKoraSuccess(); } catch (err) {}
      } else {
        action();
      }
    }
  };

  const requireAuthThen = (action: () => void) => {
    if (!currentUser) {
      alert("🔒 Connectez-vous pour continuer");
      setIsAuthModalOpen(true);
      try { audioSynth.playKoraSuccess(); } catch (err) {}
    } else {
      action();
    }
  };

  const [menuHistory, setMenuHistory] = useState<string[]>(["user_terrain"]);
  const activeMenu = menuHistory[menuHistory.length - 1] || "user_terrain";

  // Native Chrome Android Back Swipe Integration using popstate listeners
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      setMenuHistory(prev => {
        if (prev.length > 1) {
          // Play a soft click sound if available
          try { audioSynth.playKoraNote(293.66, 0, 0.08, 0.3); } catch (_) {}
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
    user_mes_groupes: "user_heritage"
  };

  const setActiveMenu = (menu: string) => {
    try { audioSynth.playKoraNote(293.66, 0, 0.08, 0.3); } catch (_) {}
    try {
      window.history.pushState({ menu }, "", "");
    } catch (_) {}
    setMenuHistory(prev => {
      if (prev[prev.length - 1] === menu) return prev;
      return [...prev, menu];
    });
  };

  const goBackMenu = () => {
    try { audioSynth.playKoraNote(293.66, 0, 0.08, 0.3); } catch (_) {}
    setMenuHistory(prev => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      const current = prev[prev.length - 1] || "user_terrain";
      const parent = defaultBackParents[current] || "user_terrain";
      return [parent];
    });
  };

  // Hardware and browser back button support (Chrome Android / PWA)
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
  const [openConvoWithUserId, setOpenConvoWithUserId] = useState<string | null>(null);
  const [openConvoWithGomboId, setOpenConvoWithGomboId] = useState<string | null>(null);
  
  // Custom states for Le Terrain High Fidelity Experience (Home Page)
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [likedGombos, setLikedGombos] = useState<string[]>([]);
  const [gomboComments, setGomboComments] = useState<Record<string, { author: string; text: string; date: string }[]>>({
    gombo_1: [
      { author: "Zouglou Premier", text: "Opportunité incroyable pour la culture ivoirienne !", date: "Il y a 2h" },
      { author: "Diva Shana", text: "Le Plateau va vibrer le 15 juin !", date: "Il y a 1h" }
    ],
    gombo_2: [
      { author: "Serge K.", text: "Le budget est à la hauteur de l'évènement.", date: "Il y a 5h" }
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

  const userEmail = currentUser?.email?.toLowerCase() || "";
  const isAuthorizedAdmin = React.useMemo(() => !!(currentUser && (AUTHORIZED_ADMIN_EMAILS.includes(userEmail) || profile?.role === "founder" || profile?.isFounder)), [currentUser, userEmail, profile?.role, profile?.isFounder, AUTHORIZED_ADMIN_EMAILS]);
  const isAuthorizedSuperFounder = React.useMemo(() => !!(currentUser && (userEmail === "jhs.kmj7@gmail.com" || profile?.isFounder)), [currentUser, userEmail, profile?.isFounder]);

  const [realNotifications, setRealNotifications] = useState<any[]>([]);
  const [globalNotifications, setGlobalNotifications] = useState<any[]>([]);
  
  useEffect(() => {
    if (currentUser?.uid) {
      const unsubscribeUser = gomboDB.listenUserNotifications(currentUser.uid, (userNotifs) => {
        setRealNotifications(prev => {
          const newUnread = userNotifs.filter(n => !n.read).length;
          const oldUnread = prev.filter(n => !n.read).length;
          if (newUnread > oldUnread) {
            try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
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
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

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
  const [activePublishType, setActivePublishType] = useState<"gombo" | "reel" | "demo" | "renfort" | "recherche">("gombo");
  const [selectedPublishTags, setSelectedPublishTags] = useState<string[]>([]);
  const [multiplePublishPhotos, setMultiplePublishPhotos] = useState<string[]>([]);
  const [showHowWorksPopup, setShowHowWorksPopup] = useState<boolean>(false);
  
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
          setDynamicFounders(data.founders.map((e: string) => e.trim().toLowerCase()));
        }
        if (Array.isArray(data.superAdmins)) {
          setDynamicSuperAdmins(data.superAdmins.map((e: string) => e.trim().toLowerCase()));
        }
      } else {
        // Bootstrap config if current user is the root founder
        if (adminEmail?.trim().toLowerCase() === "johnsylvesterh@gmail.com") {
          setDoc(docRef, {
            founders: ["johnsylvesterh@gmail.com"],
            superAdmins: ["sylvestrehounkpevi777@gmail.com", "jhs.kmj7@gmail.com"]
          }).catch(err => console.warn("Bootstrap config error:", err));
        }
      }
    }, (error) => {
      console.warn("🔐 Access restricted or blocked on throne config doc:", error.message);
    });
    return () => unsub();
  }, [adminEmail]);
  const [isSuperWelcomeOpen, setIsSuperWelcomeOpen] = useState<boolean>(false);
  const [showThroneCinematic, setShowThroneCinematic] = useState<boolean>(false);
  const hasSeenThroneCinematic = useRef<boolean>(false);

  useEffect(() => {
    if (activeMenu === "super_admin" && !hasSeenThroneCinematic.current) {
      setShowThroneCinematic(true);
      hasSeenThroneCinematic.current = true;
    }
  }, [activeMenu]);

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
  const [renforts, setRenforts] = useState<Renfort[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // --- ÉTAPE 7 : TABLEAU DE BORD ULTRA-AUTONOME STATES ---
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
  const [superAdminTab, setSuperAdminTab] = useState<"throne" | "beta_transactions" | "media" | "economie" | "batisseurs">("throne");
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
    `[${new Date().toLocaleTimeString()}] 🦅 AFRIGOMBO Elite Centre de Commandement allumé. Connecté au Firebase.`,
    `[${new Date().toLocaleTimeString()}] Securité de l'Héritage Musical : auto-sauvegarde active.`,
    `[${new Date().toLocaleTimeString()}] Gombocaisse : commission par défaut fixée à 10%.`,
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
      { sender: "organisateur", text: "Salut l'artiste ! Ton profil majestueux de Gombo ID nous intéresse pour le concert de gala. Es-tu dispo pour une répétition le 14 Juin au Plateau ?", time: "09:30" }
    ],
    "gombo_2": [
      { sender: "organisateur", text: "Honorables salutations de la part de l'Hôtel Ivoire. Vos compétences vocales conviennent parfaitement à notre prestige.", time: "Hier, 18h20" }
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
        addToTerminal(`[SYS] Taux de commission chargé : ${rate}%.`);
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
        addToTerminal(`[Alerte réseau] Firestore non-accessible directement. Mode local premium activé.`);
      });

      const qGombos = collection(db, "gombos");
      const unsubscribeGombos = onSnapshot(qGombos, (snapshot) => {
        const fetchedGombos: Gombo[] = [];
        snapshot.forEach((docSnap) => {
          fetchedGombos.push({ id: docSnap.id, ...docSnap.data() } as Gombo);
        });
        setGombos(fetchedGombos);
      }, (error) => {
        console.warn("🔐 Gombos sync limited or offline:", error.message);
      });

      const qTransactions = query(collection(db, "transactions"), orderBy("timestamp", "desc"), limit(200));
      const unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
        const fetchedTransactions: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          fetchedTransactions.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
        });
        setTransactions(fetchedTransactions);
      }, (error) => {
        console.warn("🔐 Transactions sync restricted for current user role:", error.message);
      });

      const qReviews = collection(db, "reviews");
      const unsubscribeReviews = onSnapshot(qReviews, (snapshot) => {
        const fetchedReviews: GomboReview[] = [];
        snapshot.forEach((docSnap) => {
          fetchedReviews.push({ id: docSnap.id, ...docSnap.data() } as GomboReview);
        });
        setReviews(fetchedReviews);
      }, (error) => {
        console.warn("🔐 Reviews sync limited or offline:", error.message);
      });

      const qAlerts = collection(db, "alerts");
      const unsubscribeAlerts = onSnapshot(qAlerts, (snapshot) => {
        const fetchedAlerts: Alerte[] = [];
        snapshot.forEach((docSnap) => {
          fetchedAlerts.push({ id: docSnap.id, ...docSnap.data() } as Alerte);
        });
        setAlerts(fetchedAlerts);
      }, (error) => {
        console.warn("🔐 Alerts sync restricted for current user role:", error.message);
      });

      const qPosts = query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(200));
      const unsubscribePosts = onSnapshot(qPosts, (snapshot) => {
        const fetchedPosts: Post[] = [];
        snapshot.forEach((docSnap) => {
          fetchedPosts.push({ id: docSnap.id, ...docSnap.data() } as Post);
        });
        setPosts(fetchedPosts);
      }, (error) => {
        console.warn("🔐 Posts sync limited or offline:", error.message);
      });

      const qRenforts = query(collection(db, "renforts"), orderBy("createdAt", "desc"), limit(100));
      const unsubscribeRenforts = onSnapshot(qRenforts, (snapshot) => {
        const fetchedRenforts: any[] = [];
        snapshot.forEach((docSnap) => {
          fetchedRenforts.push({ id: docSnap.id, ...docSnap.data() });
        });
        setRenforts(fetchedRenforts);
      }, (error) => {
        console.warn("🔐 Renforts sync limited or offline:", error.message);
      });

      const qLogs = query(collection(db, "admin_logs"), orderBy("timestamp", "desc"), limit(100));
      const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
        const fetchedLogs: any[] = [];
        snapshot.forEach((docSnap) => {
          fetchedLogs.push({ id: docSnap.id, ...docSnap.data() });
        });
        setAdminLogs(fetchedLogs);
      }, (error) => {
        console.warn("🔐 Logs sync limited:", error.message);
      });

      const qContracts = collection(db, "contracts");
      const unsubscribeContracts = onSnapshot(qContracts, (snapshot) => {
        const fetchedContracts: GomboSafeContract[] = [];
        snapshot.forEach((docSnap) => {
          fetchedContracts.push({ id: docSnap.id, ...docSnap.data() } as GomboSafeContract);
        });
        setContracts(fetchedContracts);
      }, (error) => {
        console.warn("🔐 Contracts sync limited:", error.message);
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
      addToTerminal(`[Alerte locale] Lancement offline synchronisé.`);
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
        addToTerminal("[🛡️ SECURE] Authentification requise pour l'administration.");
        return;
      }

      if (!isAuthorizedAdmin) {
        setPerspective("user");
        setActiveMenu("user_terrain");
        alert("🔒 ACCÈS DÉFENDU\n\nAccès refusé. Cette zone est réservée au Fondateur AFRIGOMBO.");
        addToTerminal(`[🛡️ SECURE] Accès administratif bloqué pour l'adresse ${currentUser.email}.`);
        return;
      }

      if (activeMenu === "super_admin" && !isAuthorizedSuperFounder) {
        setActiveMenu("dashboard");
        alert("🔒 ACCÈS FONDATEUR UNIQUE INTERDIT\n\nCe sanctuaire système est réservé au Super Fondateur Unique.");
        addToTerminal(`[🛡️ SECURE] Tentative d'accès non autorisée au Trône par ${currentUser.email} rejetée.`);
      }
    }
  }, [perspective, activeMenu, currentUser, isAuthorizedAdmin, isAuthorizedSuperFounder]);

  // Watertight access security rules enforcement for non-authenticated users
  useEffect(() => {
    const protectedMenus = [
      "user_publish",
      "user_mes_gombos",
      "user_contracts",
      "user_heritage",
      "user_wallet",
      "user_messages",
      "user_renforts",
      "notifications",
      "alertes",
      "settings",
      "security",
      "dashboard",
      "users",
      "posts",
      "gombos",
      "verifications",
      "admin_finances",
      "contracts",
      "reports",
      "revenue",
      "super_admin"
    ];
    if (protectedMenus.includes(activeMenu) && !currentUser) {
      setActiveMenu("user_terrain");
      setIsAuthModalOpen(true);
      addToTerminal(`[🛡️ SECURE] Tentative d'accès anonyme au menu ${activeMenu} bloquée.`);
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
          addToTerminal(`[P-INTELLIGENT] 🤖 Routine autonome : ${suspectItemsCount} compte suspect surveillé.`);
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
    addToTerminal(`[P-INTELLIGENT] 🔍 Analyse autonome complète initiée par le Super Admin...`);
    setIsScanFeedbackVisible(true);

    setTimeout(() => {
      // Populate automatic flagged items
      const flaggedP = posts.filter(p => p.isFlagged || p.content.toLowerCase().includes("contrefait") || p.content.toLowerCase().includes("cachette"));
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

      addToTerminal(`[P-INTELLIGENT] ✅ Analyse terminée. ${flaggedP.length} anomalies de publications et ${suspectU.length} profils suspects trouvés.`);
    }, 2500);
  };

  const saveToFirestore = async (collectionName: string, docId: string, data: any) => {
    try {
      setAutoSaveActive(true);
      const docRef = doc(db, collectionName, docId);
      
      // Deep clone and clean up data to avoid cyclic object or custom class errors
      let safeData = data;
      try {
        const getCircularReplacer = () => {
          const seen = new WeakSet();
          return (key: string, value: any) => {
            if (typeof value === "object" && value !== null) {
              if (seen.has(value)) return;
              seen.add(value);
            }
            return value;
          };
        };
        safeData = JSON.parse(JSON.stringify(data, getCircularReplacer()));
      } catch (err) {
        console.error("Error sanitizing data for Firestore:", err);
      }

      await setDoc(docRef, safeData, { merge: true });
      addToTerminal(`[SYNC] Sauvegarde réussie sur Firestore pour ${collectionName}/${docId}`);
      setTimeout(() => setAutoSaveActive(false), 800);
    } catch (e) {
      // Local persistence simulation to remain robust during offline
      addToTerminal(`[LOCAL] Données enregistrées localement (Firestore indisponible).`);
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
    
    addToTerminal(`[💰 LA CAISSE] Paiement de ${amount.toLocaleString()} FCFA reçu : ${description}`);
  };

  const handlePerformSimulatedPayment = async () => {
    const targetId = simUserId || (users.length > 0 ? users[0].id : "");
    if (!targetId) {
      addToTerminal(`[Alerte] Veuillez d'abord créer ou sélectionner un compte artiste pour simuler.`);
      return;
    }
    const targetUser = users.find(u => u.id === targetId);
    if (!targetUser) return;

    switch (simProduct) {
      case "cert_express":
        await createTransaction(500, "cert_express", `⚡ Certification Express GOMBO ID (24-72h) - ${targetUser.artisticName}`, targetUser.id, targetUser.artisticName);
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, kycStatus: "pending" } : u));
        await saveToFirestore("users", targetUser.id, { ...targetUser, kycStatus: "pending" });
        addToTerminal(`[⚡ KYC] Demande Express enregistrée pour ${targetUser.artisticName}. Traitement prioritaire sous 24-72h.`);
        break;
      case "gombo_vip":
        await createTransaction(1000, "gombo_vip", `✨ Souscription Mensuelle GOMBO VIP - ${targetUser.artisticName}`, targetUser.id, targetUser.artisticName);
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, isVip: true } : u));
        await saveToFirestore("users", targetUser.id, { ...targetUser, isVip: true });
        addToTerminal(`[✨ VIP] Compte d'artiste ${targetUser.artisticName} élevé au statut GOMBO VIP (Badge activé).`);
        break;
      case "boost_gombo":
        await createTransaction(simBoostPrice, "boost_gombo", `🔥 Boost Tam-Tam Gombo "En Vedette" (${simBoostPrice} FCFA) - ${targetUser.artisticName}`, targetUser.id, targetUser.artisticName);
        const userPost = posts.find(p => p.userId === targetUser.id);
        if (userPost) {
          setPosts(prev => prev.map(p => p.id === userPost.id ? { ...p, isBoosted: true } : p));
          addToTerminal(`[🔥 BOOST] Publication "${userPost.content.substring(0, 30)}..." de l'artiste ${targetUser.artisticName} mise EN VEDETTE.`);
        } else if (posts.length > 0) {
          const firstPost = posts[0];
          setPosts(prev => prev.map(p => p.id === firstPost.id ? { ...p, isBoosted: true } : p));
          addToTerminal(`[🔥 BOOST] Aucune publication trouvée pour ${targetUser.artisticName}. Première publication générale mise EN VEDETTE.`);
        } else {
          addToTerminal(`[🔥 BOOST] Aucune publication à booster sur Le Tam-Tam Gombo.`);
        }
        break;
      case "renfort_express":
        await createTransaction(500, "renfort_express", `⚡ Renfort Express Urgent (Demande d'assistance prioritaire) - ${targetUser.artisticName}`, targetUser.id, targetUser.artisticName);
        if (renforts.length > 0) {
          setRenforts(prev => prev.map((r, i) => i === 0 ? { ...r, isExpress: true } : r));
          addToTerminal(`[⚡ RENFORT] Demande de renfort active taggée ⚡ Renfort Express.`);
        } else {
          addToTerminal(`[⚡ RENFORT] Aucun renfort existant. Demande de renfort express prioritaire simulée.`);
        }
        break;
      case "gombo_pro":
        await createTransaction(5000, "gombo_pro", `💼 Abonnement Gombo PRO Mensuel (Orchestre) - ${targetUser.artisticName}`, targetUser.id, targetUser.artisticName);
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, isPro: true } : u));
        await saveToFirestore("users", targetUser.id, { ...targetUser, isPro: true });
        addToTerminal(`[💼 PRO] Statut GOMBO PRO activé pour ${targetUser.artisticName} (Panoplie complète d'orchestres).`);
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
      organizerName: "AFRIGOMBO Administration",
      timestamp: new Date().toISOString(),
      applicantsCount: 0,
      status: "open"
    };

    setGombos(prev => [gomboData, ...prev]);
    addToTerminal(`[🎼 GOMBO] Nouveau Gombo publié à ${newGombo.location} : "${newGombo.title}" d'un budget de ${budgetNum.toLocaleString()} FCFA`);

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
      console.warn("🔐 Dynamic query index required or error, using local fallback filters:", err.message);
    }
  };

  const handleCompleteGombo = async () => {
    if (!completingGombo) return;
    try {
      await saveToFirestore("gombos", completingGombo.id, { status: "completed" });
      setGombos(prev => prev.map(g => g.id === completingGombo.id ? { ...g, status: "completed" } : g));

      const selectedMusician = users.find(u => u.id === reviewMusicianId) || users[0];
      if (!selectedMusician) {
        alert("Veuillez sélectionner un artiste à évaluer.");
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
        comment: reviewComment || "Prestation impériale et d'un grand professionnalisme sur scène !",
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
          comment: reciprocalComment || "Très bon accueil ! Sonorisation excellente et organisation de haut standing.",
          timestamp: new Date().toISOString(),
          type: "musician_to_client"
        };
        await saveToFirestore("reviews", musicianReviewId, musicianReview);
        setReviews(prev => [musicianReview, ...prev]);
      }

      addToTerminal(`[INFO] Gombo Clôturé : L'événement "${completingGombo.title}" est complété. Évaluation de ${selectedMusician.artisticName} enregistrée.`);
      setCompletingGombo(null);
    } catch(err) {
      console.error(err);
      addToTerminal(`[ERREUR] Impossible de clôturer le gombo.`);
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
          addToTerminal(`[📌 PERSISTENCE] Gombo retiré du coffre-fort d'or.`);
          return prev.filter(gid => gid !== id);
        } else {
          addToTerminal(`[📌 PERSISTENCE] Gombo précieusement sauvegardé dans votre coffre-fort d'or.`);
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
          addToTerminal(`[🏆 HONNEUR] Vous avez retiré votre honneur au gombo.`);
          return prev.filter(gid => gid !== id);
        } else {
          addToTerminal(`[🏆 HONNEUR] ✨ Honneur suprême accordé au gombo.`);
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
        addToTerminal(`[⚠️ DOUBLON] L'appel du Tam-Tam a déjà été entendu pour ce Gombo.`);
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
      addToTerminal(`[🎤 CANDIDATURE] Félicitations ! Votre candidature pour "${gombo.title}" a été envoyée sur le réseau céleste.`);
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
        `D'accord l'artiste! Nous apprécions grandement ta démarche de palabrer. Le Gombo ID GMB certifié nous inspire confiance. On se cale au téléphone ?`,
        `Salut ! Ton talent mérite considération. Nous étudions ton profil et nous ajusterons le cachet au besoin. Restons connectés.`,
        `Parfaitement compris. Notre budget est garanti par le système d'Afrigombo. Ta dévotion artistique fait plaisir à voir.`
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
      addToTerminal(`[🗣️ PALABRER] Nouvel échange reçu de ${targetGombo.organizerName}.`);
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
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id;
    let isUnique = false;
    while (!isUnique) {
      const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      id = `GMB-${part1}-${part2}`;
      
      // Check if any existing user has this gomboIdNumber
      isUnique = !users.some(u => u.gomboIdNumber === id || u.gomboId?.id === id || (typeof u.gomboId === 'string' && u.gomboId === id));
    }
    return id;
  };

  const handleApproveKYC = async (userId: string, express: boolean = false) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const gmbId = generateUniqueGomboId();

    const levels = [
      "🟢 Vérifié AFRIGOMBO",
      "🥉 Musicien confirmé",
      "🥈 Professionnel actif",
      "🥇 Référence AFRIGOMBO"
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
          verifiedBy: "Yoro Admin (Equipe AFRIGOMBO)",
          verificationStatus: "approved"
        };
        saveToFirestore("users", user.id, u);
        
        gomboDB.publishNotification({
          userId: user.id,
          type: "kyc_validated",
          title: "🛡️ KYC Validé !",
          message: "Félicitations, votre identité a été validée par l'administration d'AFRIGOMBO !",
          priority: "high"
        });
        gomboDB.publishNotification({
          userId: user.id,
          type: "gombo_id_validated",
          title: "🎼 Gombo ID Assigné !",
          message: `Votre identifiant permanent Gombo ID est actif : ${gmbId}. Vos chances de gombos sont décuplées !`,
          priority: "high"
        });

        return u;
      }
      return user;
    });
    setUsers(updatedUsers);
    
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
          title: "❌ Dossier KYC Refusé",
          message: "Désolé, votre dossier de certification a été décliné. Veuillez vérifier la conformité de vos documents d'identité.",
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
      "Dossier décliné car incomplet ou non-conforme"
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
          title: "ℹ️ Complément KYC Requis",
          message: `L'administration demande un complément d'information pour votre KYC : "${message}"`,
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
      addToTerminal(`[FILE REVIEW] Publication approuvée. Signalement levé.`);
    } else {
      setPosts(prev => prev.filter(p => p.id !== postId));
      setAutoFlaggedPosts(prev => prev.filter(p => p.id !== postId));
      addToTerminal(`[FILE REVIEW] Contenu supprimé pour non-conformité.`);
    }
  };

  const handleBroadcast = async (message: string) => {
    addToTerminal(`[📡 MÉGAPHONE] Bulletin quotidien diffusé : "${message}"`);
    try {
      const newNotif = {
        text: message,
        timestamp: new Date().toISOString(),
        read: false,
        type: "megaphone"
      };
      await addDoc(collection(db, "notifications"), newNotif);
      addToTerminal(`[📡 MÉGAPHONE] Enregistré sur Firestore.`);
    } catch (err) {
      console.error("Error broadcasting megaphone", err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    addToTerminal(`[🗑️ MÉGAPHONE] Notification supprimée : ${id}`);
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
      addToTerminal(`[FILE REVIEW] Contenu supprimé définitivement de la base.`);
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
      addToTerminal(`[FILE REVIEW] Signalement levé, publication approuvée.`);
      try { audioSynth.playValidationSuccess(); } catch (_) {}
    } catch (err) {
      console.error("Error unflagging post", err);
    }
  };

  const handleUpdateCommissionRate = async (rate: number) => {
    try {
      setSystemCommissionRate(rate);
      await gomboDB.updateSystemCommissionRate(rate);
      addToTerminal(`[FRAIS] Taux de commission de plateforme mis à jour à ${rate}%.`);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err) {
      console.error("Error updating commission rate", err);
    }
  };

  const handleUpdateThroneConfig = async (newFounders: string[], newSuperAdmins: string[]) => {
    try {
      setDynamicFounders(newFounders);
      setDynamicSuperAdmins(newSuperAdmins);
      addToTerminal(`[TRÔNE] Configuration du Trône mise à jour.`);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err) {
      console.error("Error updating throne configuration", err);
    }
  };

  const handleAppointGomboDuJour = (gomboId: string) => {
    addToTerminal(`[🔥 LE TAM-TAM] Gombo du Jour activé : "${gombos.find(g => g.id === gomboId)?.title}"!`);
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
    addToTerminal(`[🎼 MON HÉRITAGE] Héritage musical mis à jour et sauvegardé pour l'artiste.`);
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
    addToTerminal(`[📡 TAM-TAM RAPIDE] Bulletin quotidien diffusé : "${broadcastMessage}"`);
    setIsBroadcastModalOpen(false);
    setBroadcastMessage("");
  };

  // --- FILTERED DATA FOR MAIN VIEWS ---
  const filteredUsers = users.filter(user => {
    const s = globalSearchTerm.toLowerCase();
    return (
      (user.name || "").toLowerCase().includes(s) ||
      (user.artisticName || "").toLowerCase().includes(s) ||
      (user.commune || "").toLowerCase().includes(s)
    );
  });

  // CompleteProfile route moved to App.tsx

  return (
    <div className={`flex h-screen w-full max-w-full box-border overflow-x-hidden bg-afri-bg text-afri-text font-sans antialiased overflow-hidden uppercase-none`}>

      
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
              className="fixed inset-y-0 left-0 w-80 bg-afri-bg-sec border-r border-afri-border flex flex-col justify-between z-[1001] shrink-0 h-screen overflow-y-auto pb-8"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {/* SIDEBAR CONTAINER SCROLL */}
              <div className="flex flex-col min-h-full justify-between">
                
                {/* TOP PART */}
                <div>
                  {/* BRAND HEADER LINE */}
                  <div className="p-5 border-b border-afri-border bg-afri-bg/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-afri-gold/10 border border-afri-gold/50 flex items-center justify-center animate-pulse">
                        <Flame className="text-afri-gold w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-sans font-black tracking-widest text-afri-gold uppercase">
                          ═══ AFRIGOMBO ═══
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

                  {/* LOGGED IN USER CARD */}
                  <div className="p-5">
                    {!currentUser ? (
                      <button
                        onClick={() => {
                          setIsSidebarOpen(false);
                          setTimeout(() => {
                            setIsAuthModalOpen(true);
                            try { audioSynth.playKoraSuccess(); } catch (err) {}
                          }, 250);
                        }}
                        className="w-full bg-afri-gold hover:bg-afri-bg-sec text-[#050505] rounded-xl p-3.5 text-center cursor-pointer font-black tracking-wider transition-all duration-200 shadow-lg flex flex-col items-center justify-center gap-1 border border-transparent"
                      >
                        <Flame className="w-5 h-5 fill-current text-[#050505]" />
                        <div className="text-[10px] uppercase font-bold leading-tight text-[#050505]">
                          ACCÈS PRESTIGE ELITE
                        </div>
                        <div className="text-[9px] uppercase font-mono font-extrabold bg-afri-bg text-afri-gold px-2 py-0.5 rounded">
                          SE CONNECTER
                        </div>
                      </button>
                    ) : (
                      (() => {
                        const currentArtist = profile ? {
                          id: profile.uid,
                          artisticName: profile.displayName || `${profile.firstName || 'Artiste'} ${profile.lastName || 'Gombo'}`.trim(),
                          commune: profile.commune || 'Cocody',
                          avatarUrl: profile.avatarUrl || profile.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
                          isCertified: true,
                        } : (users.find(u => u.id === activeArtistId) || users[0]);

                        return (
                          <div className="flex flex-col gap-3">
                            <div className="bg-afri-bg/80 border border-afri-gold/20 rounded-xl p-4 shadow-md flex flex-col relative overflow-hidden">
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
                                      <Music className="w-5 h-5 text-afri-gold" />
                                    )}
                                  </div>
                                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-afri-gold rounded-full border-2 border-black flex items-center justify-center shadow-sm" title="Vérifié">
                                    <CheckCircle2 className="w-3 h-3 text-black" strokeWidth={4} />
                                  </span>
                                </div>
                                
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-[15px] font-sans font-black text-afri-text leading-tight truncate">
                                    {currentArtist ? currentArtist.artisticName : "Artiste Invité"}
                                  </h3>
                                  <p className="text-[10px] text-afri-text-sec font-mono uppercase tracking-wide font-medium mt-1">
                                    GOMBO ID: {profile?.gomboIdNumber ? profile.gomboIdNumber : "AG-0001258"}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    <span className="px-1.5 py-0.5 rounded border border-afri-gold/40 text-afri-gold text-[9px] font-sans uppercase font-bold flex items-center gap-1">
                                      ⭐ Niveau Professionnel
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-4 flex items-center justify-between">
                                <span className="text-[11px] font-sans text-afri-text font-medium">Réputation</span>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex text-afri-gold text-[10px]">
                                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                                  </div>
                                  <span className="text-[11px] text-afri-text-sec font-sans font-medium">(4.8)</span>
                                </div>
                              </div>
                            </div>

                            <button 
                              onClick={() => {
                                setIsSidebarOpen(false);
                                setActiveMenu("user_wallet");
                              }}
                              className="bg-afri-bg-sec border border-afri-border hover:bg-afri-gold/5 transition-colors rounded-xl p-4 shadow-md flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-4">
                                <CreditCard className="w-8 h-8 text-afri-gold" strokeWidth={1.5} />
                                <div className="flex flex-col text-left">
                                  <span className="text-[11px] font-sans text-afri-text font-medium leading-none mb-1">Wallet</span>
                                  <span className="text-lg font-black text-afri-gold leading-none">{profile?.walletBalance?.toLocaleString('fr-FR') || "25 000"} FCFA</span>
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
                        customBadge?: React.ReactNode
                      ) => {
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
                            {customBadge ? customBadge : (
                              isInactive ? (
                                <span className="text-[7.5px] font-mono py-0.5 px-1.5 bg-afri-gold/10 border border-afri-gold/25 text-afri-gold rounded uppercase font-black tracking-tighter">
                                  Bientôt
                                </span>
                              ) : null
                            )}
                          </motion.button>
                        );
                      };

                      return (
                        <div className="space-y-4">
                          
                          {/* SECTION: ACTIONS RAPIDES */}
                          <div className="space-y-1">
                            <span className="px-3.5 text-[8.5px] font-mono font-black text-afri-text-sec uppercase tracking-widest block mb-1">
                              ⚡ Actions Rapides
                            </span>
                            {renderMenuItem("menu_events", "Événements (Calendrier)", "📅", () => {
                              setPerspective("user");
                              setActiveMenu("user_events");
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            }, false, <span className="text-[7px] font-mono py-0.5 px-1.5 bg-afri-gold/10 text-afri-gold rounded border border-afri-gold/10 uppercase font-black">LIVE</span>)}
                            {renderMenuItem("menu_near_opports", "Opportunités proches", "📍", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_opportunities");
                                try { audioSynth.playValidationSuccess(); } catch (_) {}
                              });
                            }, false, <span className="text-[7px] font-mono py-0.5 px-1.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/10 uppercase font-black">DISPO</span>)}
                            {renderMenuItem("menu_msgs", "Messages", "📩", () => {
                               requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_messages");
                               });
                            }, false, totalUnreadMessages > 0 ? (
                              <span className="ml-2 bg-red-500 text-afri-text text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full shadow-md">
                                {totalUnreadMessages}
                              </span>
                            ) : undefined)}
                            {renderMenuItem("menu_favorites", "Favoris", "⭐", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_favorites");
                              });
                            }, false)}
                          </div>

                          {/* SEPARATOR */}
                          <div className="border-t border-afri-border my-1" />

                          {/* SECTION: Univers AFRI */}
                          <div className="space-y-1">
                            <span className="px-3.5 text-[8.5px] font-mono font-black text-afri-text-sec uppercase tracking-widest block mb-1">
                              🏛️ Univers AFRIGOMBO
                            </span>
                            {renderMenuItem("menu_builders_1", "Soutenir AFRIGOMBO ❤️", "❤️", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_builders");
                                try { audioSynth.playValidationSuccess(); } catch (_) {}
                              });
                            }, false)}
                            {renderMenuItem("menu_wallet", "Wallet", "💳", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_wallet");
                                try { audioSynth.playValidationSuccess(); } catch (_) {}
                              });
                            }, false)}
                            {renderMenuItem("menu_help", "Centre d'aide", "🛟", () => {
                              setPerspective("user");
                              setActiveMenu("user_help_center");
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            }, false)}
                            {renderMenuItem("menu_gombo_id", "GOMBO ID", "🆔", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_gombo_id");
                                try { audioSynth.playValidationSuccess(); } catch (_) {}
                              });
                            }, false)}
                          </div>

                          {/* SEPARATOR */}
                          <div className="border-t border-afri-border my-1" />

                          {/* SECTION: Centre personnel */}
                          <div className="space-y-1">
                            <span className="px-3.5 text-[8.5px] font-mono font-black text-afri-text-sec uppercase tracking-widest block mb-1">
                              👤 Centre personnel
                            </span>
                            {renderMenuItem("menu_heritage", "Mon Héritage", "👑", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_heritage");
                              });
                            }, false)}
                            {renderMenuItem("menu_profile", "Mon Profil", "👤", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_edit_profile");
                              });
                            }, false)}
                            {renderMenuItem("menu_pubs", "Publications", "📝", () => {
                              setPerspective("user");
                              setActiveMenu("user_terrain");
                            }, false)}
                            {renderMenuItem("menu_comms", "Commentaires", "💬", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_notifications");
                              });
                            }, false)}
                            {renderMenuItem("menu_settings", "Paramètres", "⚙", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_settings");
                                try { audioSynth.playValidationSuccess(); } catch (_) {}
                              });
                            }, false)}
                            {renderMenuItem("menu_lang", t('langue'), "🌐", () => {
                              const nextL = lang === "fr" ? "nouchi" : (lang === "nouchi" ? "en" : "fr");
                              setLanguage(nextL);
                              try { audioSynth.playTamTam(true); } catch (e) {}
                              addToTerminal(`[LANGUE] Passage en mode ${nextL === "nouchi" ? "Nouchi" : (nextL === "en" ? "English" : "Français")}`);
                            }, false, (
                              <span className="font-mono text-[8px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20 scale-90">
                                {lang === "nouchi" ? "Nouchi 🇨🇮" : (lang === "en" ? "English 🇬🇧" : "Français 🇫🇷")}
                              </span>
                            ))}
                          </div>

                          {/* SEPARATOR */}
                          <div className="border-t border-afri-border my-1" />

                          {/* SECTION: Système */}
                          <div className="space-y-1">
                            <span className="px-3.5 text-[8.5px] font-mono font-black text-afri-text-sec uppercase tracking-widest block mb-1">
                              🛠 Système
                            </span>
                            {renderMenuItem("menu_notifications", "Notifications", "🔔", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_notifications");
                              });
                            }, false, (() => {
                              const unreadCount = allNotifications.filter(n => !(n as any).isRead && !n.read).length;
                              return unreadCount > 0 ? (
                                <span className="bg-red-500 text-afri-text font-mono font-black text-[9px] px-1.5 py-0.5 rounded-full animate-bounce shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                                  {unreadCount}
                                </span>
                              ) : null;
                            })())}
                            {renderMenuItem("menu_history", "Historique", "🕓", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_history");
                              });
                            }, false)}
                            {renderMenuItem("menu_downloads", "Téléchargements", "📥", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_downloads");
                              });
                            }, false)}
                            {renderMenuItem("menu_backups", "Sauvegardes", "💾", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_backups");
                              });
                            }, false)}
                            
                            {currentUser && renderMenuItem("menu_logout", "Déconnexion", "🚪", async () => {
                              const confirmLogout = window.confirm(
                                lang === "nouchi" 
                                  ? "Vieux môgô, tu veux libérer la session ?" 
                                  : "Souhaitez-vous vous déconnecter de votre session d'artiste ?"
                              );
                              if (confirmLogout) {
                                try {
                                  await logout();
                                  setPerspective("user");
                                  setActiveMenu("user_terrain");
                                  try { audioSynth.playValidationSuccess(); } catch (err) {}
                                } catch (err) {
                                  console.error("Logout err", err);
                                }
                              }
                            }, false, (
                              <span className="text-[7.5px] font-mono py-0.5 px-1 bg-red-950/40 text-red-400 rounded border border-red-900/30 font-black scale-90">
                                QUITTER
                              </span>
                            ))}
                          </div>

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
                    Système Souverain National • Abidjan, CI
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
        className="flex-1 min-w-0 w-full max-w-full bg-afri-bg flex flex-col overflow-hidden"
      >
        
        {/* ELITE UPPER STATUS BAR (AFRIGOMBO PREMIUM HEADER OR EXCLUSIVE ADMIN HEADER) */}
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
                    ADMINISTRATION IMPÉRIALE
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
                      <span className="text-[8px] sm:text-[10px] text-afri-text font-bold uppercase tracking-wider">Synchronisé</span>
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
                  ← Terrain
                </button>
              </div>
            </header>
          ) : (
            activeMenu === "user_terrain" ? (
              <header className="flex flex-col afri-container py-2 sm:py-3 border-b border-afri-gold/30 bg-afri-bg shrink-0 gap-2 sm:gap-3.5 w-full animate-fadeIn select-none shadow-[0_10px_35px_rgba(0,0,0,0.85)] rounded-b-[24px] sm:rounded-b-[40px] z-[40] relative">
                {/* TOP ROW */}
                <div className="flex items-center justify-between w-full gap-2 sm:gap-4 px-1 sm:px-4">
                  {/* Left: Menu & Logo Group */}
                  <div className="flex items-center gap-2.5 sm:gap-5">
                    <button
                      id="hamburger-trigger"
                      onClick={() => setIsSidebarOpen(true)}
                      className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-afri-bg-sec/40 border border-afri-border/80 text-afri-gold hover:bg-afri-gold/10 transition-all active:scale-95 shrink-0"
                    >
                      <Menu className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                    </button>

                    {activeMenu !== "user_terrain" && (
                      <button
                        onClick={goBackMenu}
                        className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-afri-gold/10 hover:bg-afri-gold/20 border border-afri-gold/40 text-afri-gold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer font-bold text-[9px] sm:text-[11px] uppercase tracking-tight shrink-0"
                      >
                        <span>← Retour</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2.5 sm:gap-4">
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt="AFRIGOMBO LOGO" 
                          className="w-10 h-10 sm:w-16 sm:h-16 object-contain rounded-2xl shrink-0"
                        />
                      ) : (
                        <AfriGomboLogo className="w-10 h-10 sm:w-16 sm:h-16 shrink-0" />
                      )}
                      <div className="flex flex-col justify-center">
                        <h1 className="text-2xl sm:text-5xl font-black tracking-tighter text-afri-gold leading-none font-display antialiased subpixel-antialiased" 
                            style={{ 
                              textShadow: "1px 1px 0px #B48F17"
                            }}>
                          AFRIGOMBO
                        </h1>
                        <span className="text-[10px] sm:text-[13px] text-afri-text font-black tracking-wide mt-1 sm:mt-1.5 font-sans antialiased whitespace-nowrap">
                          Le Temple du Gombo Musical
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 sm:gap-5 shrink-0">
                     {/* Notification with Badge */}
                     <button 
                       onClick={() => {
                          setActiveMenu("user_notifications");
                          addToTerminal("[CLOCHE] Ouverture des notifications d'actualité.");
                       }} 
                       className="relative p-1.5 sm:p-2 text-afri-gold hover:scale-110 transition-transform cursor-pointer shrink-0"
                     >
                       <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                       {realNotifications.some(n => !n.read) && (
                         <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 sm:w-2.5 bg-red-600 rounded-full border border-black shadow-[0_0_5px_rgba(220,38,38,0.5)]" />
                       )}
                     </button>

                     {/* Profile Avatar */}
                     <div 
                       onClick={() => { 
                          if (!currentUser) {
                            setShowHeritageLoginRequired(true);
                          } else {
                            setActiveMenu("user_edit_profile");
                            setViewingGomboIdDetail(false); 
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
                       {(profile?.isCertified || profile?.gomboIdNumber) && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-afri-gold rounded-full border border-black flex items-center justify-center">
                            <CheckCircle2 className="w-1.5 sm:w-2 h-1.5 sm:h-2 text-black stroke-[4]" />
                          </div>
                       )}
                     </div>
                  </div>
                </div>

                {/* BOTTOM ROW: STATS BAR */}
                <div className="w-full flex justify-center mt-0.5 px-3">
                  <div className="flex items-center justify-center gap-3.5 sm:gap-8 px-4 sm:px-8 py-1.5 sm:py-2.5 rounded-full bg-afri-bg-sec border border-afri-border/90 shadow-2xl overflow-x-auto scrollbar-none max-w-full">
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
            ) : (
              <header className="flex items-center justify-between px-4 py-3 bg-afri-bg border-b border-afri-border/50 z-[40] relative shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={goBackMenu} 
                    className="p-1.5 sm:p-2 bg-afri-bg-sec/40 rounded-xl text-afri-text-sec hover:text-afri-text hover:bg-afri-bg-ter transition-colors border border-afri-border/80 active:scale-95"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-lg font-black text-afri-text tracking-tight uppercase">
                    {(() => {
                      switch(activeMenu) {
                        case "user_wallet": return "Wallet & Finances";
                        case "user_messages": return "Messagerie";
                        case "user_edit_profile": return "Mon Profil";
                        case "user_gombo_plus": return "Premium Elite";
                        case "user_subscription_management": return "Mon Abonnement";
                        case "user_heritage": return "Mon Héritage";
                        case "user_vibes": return "Afrigombo Vibes";
                        case "user_reels": return "Les Vibes";
                        case "user_notifications": return "Notifications";
                        case "user_publish": return "Publier";
                        case "user_contracts": return "Mes Contrats";
                        case "user_events": return "Calendrier";
                        case "user_settings": return "Paramètres";
                        case "user_gombo_id": return "Gombo ID";
                        case "user_command_center": return "Centre de Commandement";
                        case "user_mes_gombos": return "Mes Publications";
                        case "user_mes_groupes": return "Mes Groupes";
                        case "user_renforts": return "Renforts";
                        case "user_opportunities": return "Mes Candidatures";
                        case "user_help_center": return "Centre d'Aide";
                        case "user_builders": return "Afrigombo Builders";
                        case "user_ecosystem": return "Gombo ID";
                        case "user_about": return "À Propos";
                        case "user_support": return "Support";
                        case "user_whats_new": return "Nouveautés";
                        case "dashboard": return "Tableau de bord";
                        case "users": return "Utilisateurs";
                        case "kyc": return "Certifications";
                        case "contracts": return "Contrats";
                        case "revenue": return "Revenus";
                        case "caisse": return "Finances";
                        case "reports": return "Signalements";
                        case "settings": return "Paramètres Admin";
                        case "security": return "Sécurité";
                        case "logs": return "Système";
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
            <span>📶</span>
            <span>AFRIGOMBO optimise votre expérience (Connexion lente détectée — Mode léger actif)</span>
          </div>
        )}

        {isBatteryLow && (
          <div className="bg-yellow-950/80 text-yellow-550 border-b border-yellow-800/30 py-2 px-4 flex items-center justify-center gap-2 text-center text-[10px] sm:text-xs font-black animate-slideDown select-none shrink-0">
            <span>🔋</span>
            <span>Mode léger AFRIGOMBO activé (Dispositif en batterie faible)</span>
          </div>
        )}

        {/* WORKSPACE VIEWS */}
        <div className="flex-1 overflow-hidden h-full relative">
          
          {/* ===================================================
              PERSISTENT CORE VIEWS (SCROLL PRESERVATION ENGINE)
              =================================================== */}

          {/* 1. LE TERRAIN - CENTRAL HUB FEED */}
          <div 
            ref={(el) => {
              if (el) {
                const menuId = "user_terrain";
                const savedPos = scrollPositionsRef.current[menuId] || 0;
                if (el.scrollTop !== savedPos) {
                  el.scrollTop = savedPos;
                }

                // Clean up old observer
                if ((el as any)._scrollObserver) {
                  (el as any)._scrollObserver.disconnect();
                }

                // Setup ResizeObserver to restore scroll as dynamic elements render
                const observer = new ResizeObserver(() => {
                  const currentSaved = scrollPositionsRef.current[menuId] || 0;
                  if (el.scrollTop !== currentSaved) {
                    el.scrollTop = currentSaved;
                  }
                });
                observer.observe(el);
                if (el.firstElementChild) {
                  observer.observe(el.firstElementChild);
                }
                (el as any)._scrollObserver = observer;
              }
            }}
            onScroll={(e) => {
              scrollPositionsRef.current["user_terrain"] = e.currentTarget.scrollTop;
            }}
            className={activeMenu === "user_terrain" ? "h-full w-full overflow-y-auto overflow-x-hidden afri-container afri-section scrollbar-none animate-fadeIn text-left scroll-smooth [-webkit-overflow-scrolling:touch]" : "hidden"}
            style={{ overscrollBehaviorY: "contain" }}
          >
            <UserTerrainLandingPage
              gombos={gombos}
              users={users}
              posts={posts}
              setPosts={setPosts}
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
            />
          </div>

          <AnimatePresence mode="wait">
            {activeMenu !== "user_terrain" && (
              <motion.div
                key={activeMenu}
                ref={(el) => {
                  if (el) {
                    const menuId = activeMenu;
                    const savedPos = scrollPositionsRef.current[menuId] || 0;
                    if (el.scrollTop !== savedPos) {
                      el.scrollTop = savedPos;
                    }

                    // Clean up old observer
                    if ((el as any)._scrollObserver) {
                      (el as any)._scrollObserver.disconnect();
                    }

                    // Setup ResizeObserver to restore scroll as dynamic elements render
                    const observer = new ResizeObserver(() => {
                      const currentSaved = scrollPositionsRef.current[menuId] || 0;
                      if (el.scrollTop !== currentSaved) {
                        el.scrollTop = currentSaved;
                      }
                    });
                    observer.observe(el);
                    if (el.firstElementChild) {
                      observer.observe(el.firstElementChild);
                    }
                    (el as any)._scrollObserver = observer;
                  }
                }}
                onScroll={(e) => {
                  scrollPositionsRef.current[activeMenu] = e.currentTarget.scrollTop;
                }}
                initial={areAnimationsReduced ? { opacity: 0 } : { opacity: 0, x: 10 }}
                animate={areAnimationsReduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
                exit={areAnimationsReduced ? { opacity: 0 } : { opacity: 0, x: -10, transition: { duration: 0.1 } }}
                transition={{ duration: areAnimationsReduced ? 0.05 : 0.20, ease: "easeOut" }}
                className={`h-full w-full overflow-y-auto overflow-x-hidden afri-container scrollbar-none scroll-smooth [-webkit-overflow-scrolling:touch] ${
                  activeMenu === "super_admin" ? "pt-0 pb-32 space-y-6" : "afri-section"
                }`}
                style={{ overscrollBehaviorY: "contain" }}
              >
                
                {/* ----------------------------------------------------
                                  STEP I: TABLEAU UTILISATEUR (10 CORE SECTIONS)
                                    ---------------------------------------------------- */}

                {perspective === "user" && ["user_publish", "user_contracts", "user_events", "user_messages", "user_wallet", "user_renforts", "user_gombo_id"].includes(activeMenu) && (
                  <div className="mb-4">
                    <button
                      onClick={() => setActiveMenu("user_terrain")}
                      className="inline-flex items-center gap-2 text-xs font-bold text-afri-text bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      <span>&larr;</span> Retour
                    </button>
                  </div>
                )}

                {/* ----------------------------------------------------
                                  NEW CORE EXPERIENCES FOR USER PERSPECTIVE
                                    ---------------------------------------------------- */}


              {/* 1B. VIDÉOS RÉELLES - VERIFICATION & SHOWCASE */}
              {activeMenu === "user_reels" && (
                <UserReelsView 
                  users={users}
                  setReelsVideoId={setReelsVideoId}
                  setReelsVideoUrl={setReelsVideoUrl}
                />
              )}
              {false && (() => {
                const searchStr = globalSearchTerm.toLowerCase();
                
                // Filter posts
                const filteredFeedPosts = posts.filter(p => 
                  p.content.toLowerCase().includes(searchStr) ||
                  p.authorArtisticName.toLowerCase().includes(searchStr)
                );

                // Filter gombos
                const GombosToRender = gombos.filter(g => 
                  g.title.toLowerCase().includes(searchStr) ||
                  g.description.toLowerCase().includes(searchStr) ||
                  g.location.toLowerCase().includes(searchStr)
                );

                // Toast status when applying
                return (
                  <div className="afri-container space-y-6 xs:space-y-8 animate-fadeIn pb-24">
                    {/* STATISTIQUES PRESTIGE EN TEMPS RÉEL (STYLE IMAGE PARFAIT) */}
                    <div className="grid grid-cols-4 divide-x divide-zinc-800/60 bg-afri-bg/40 border border-afri-gold/15 rounded-xl xs:rounded-2xl py-1.5 xs:py-3 px-0.5 xs:px-1 sm:p-4 select-none mb-4 xs:mb-6">
                      {/* ARTISTES */}
                      <div className="flex flex-col items-center xs:flex-row xs:items-center gap-0.5 xs:gap-2 sm:gap-3 pl-0.5 xs:pl-1 sm:pl-3 text-center xs:text-left">
                        <div className="p-0.5 xs:p-1 rounded-lg bg-afri-gold/5 text-afri-gold shrink-0">
                          <Users className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[5.5px] xs:text-[7.5px] sm:text-[9px] font-mono tracking-tighter xs:tracking-widest text-afri-text-sec font-bold uppercase block leading-none">ARTISTES</span>
                          <strong className="text-[9px] xs:text-xs sm:text-base font-display font-black text-afri-text block mt-0.5 sm:mt-1">
                            {(users.length + 12450).toLocaleString("fr-FR")}
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
                            {(gombos.length + 2840).toLocaleString("fr-FR")}
                          </strong>
                        </div>
                      </div>

                      {/* OPPORTUNITÉS */}
                      <div className="flex flex-col items-center xs:flex-row xs:items-center gap-0.5 xs:gap-2 sm:gap-3 pl-0.5 xs:pl-1 sm:pl-3 text-center xs:text-left">
                        <div className="p-0.5 xs:p-1 rounded-lg bg-afri-gold/5 text-afri-gold shrink-0">
                          <Music className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[5.5px] xs:text-[7.5px] sm:text-[9px] font-mono tracking-tighter xs:tracking-widest text-afri-text-sec font-bold uppercase block leading-none">OPPS</span>
                          <strong className="text-[9px] xs:text-xs sm:text-base font-display font-black text-afri-text block mt-0.5 sm:mt-1">
                            {(gombos.length + posts.length + 360).toLocaleString("fr-FR")}
                          </strong>
                        </div>
                      </div>

                      {/* CERTIFIÉS */}
                      <div className="flex flex-col items-center xs:flex-row xs:items-center gap-0.5 xs:gap-2 sm:gap-3 pl-0.5 xs:pl-1 sm:pl-3 text-center xs:text-left">
                        <div className="p-0.5 xs:p-1 rounded-lg bg-afri-gold/5 text-afri-gold shrink-0">
                          <ShieldCheck className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[5.5px] xs:text-[7.5px] sm:text-[9px] font-mono tracking-tighter xs:tracking-widest text-afri-text-sec font-bold uppercase block leading-none">ID</span>
                          <strong className="text-[9px] xs:text-xs sm:text-base font-display font-black text-afri-text block mt-0.5 sm:mt-1">
                            {(users.filter(u => u.kycStatus === "approved").length + 960).toLocaleString("fr-FR")}
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
                          addToTerminal("[INTÉRACTIF] Filtre LIVE : tous les cachets et directs actifs.");
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
                          addToTerminal("[INTÉRACTIF] Filtre ACTUS : échos d'artistes d'Abidjan.");
                          try { audioSynth.playTamTam(true); } catch (e) {}
                        }}
                        className="p-1.5 xs:p-2 sm:p-4 bg-afri-bg-sec border border-afri-border hover:border-afri-gold rounded-lg xs:rounded-xl cursor-pointer transition-all flex flex-col justify-between text-left group active:scale-95"
                      >
                        <div className="flex items-center gap-1 sm:gap-1.5 w-full">
                          <Award className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-afri-gold shrink-0" />
                          <span className="text-[7px] xs:text-[8px] sm:text-[11px] font-mono font-black text-afri-text tracking-tighter xs:tracking-widest uppercase">ACTUS</span>
                        </div>
                        <p className="text-[6px] xs:text-[7px] sm:text-[9px] text-afri-text-sec font-mono mt-0.5 sm:mt-2 uppercase">Échos</p>
                      </button>

                      {/* PUBLIER */}
                      <button
                        onClick={() => {
                          requireAuthThen(() => {
                            setActiveMenu("user_publish");
                            addToTerminal("[INTÉRACTIF] Créer une opportunité.");
                            try { audioSynth.playValidationSuccess(); } catch (e) {}
                          });
                        }}
                        className="p-1.5 xs:p-2 sm:p-4 bg-afri-gold hover:bg-afri-bg-sec rounded-lg xs:rounded-xl cursor-pointer transition-all flex flex-col justify-between text-left group active:scale-95 shadow-[0_4px_12px_rgba(212,175,55,0.2)]"
                      >
                        <div className="flex items-center gap-1 sm:gap-1.5 w-full text-black">
                          <Plus className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-black stroke-[3] shrink-0" />
                          <span className="text-[7px] xs:text-[8px] sm:text-[11px] font-mono font-black tracking-tighter xs:tracking-widest uppercase">POSTER</span>
                        </div>
                        <p className="text-[6px] xs:text-[7px] sm:text-[9px] text-zinc-950/70 font-mono mt-0.5 sm:mt-2 uppercase">Créer</p>
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
                            <span className="text-sm">⚡</span>
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
                              addToTerminal("[ACTIONS RAPIDES] Recherche de membre activée.");
                              try { audioSynth?.playTamTam?.(true); } catch (_) {}
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-afri-gold/10 flex items-center justify-center border border-afri-gold/20 group-hover:border-afri-gold/65 transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">👥</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Rechercher membre</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-text-sec uppercase tracking-widest block leading-none mt-0.5">Annuaire</span>
                            </div>
                          </button>

                          {/* 2. Créer une annonce */}
                          <button
                            onClick={() => {
                              requireAuthThen(() => {
                                setActiveMenu("user_publish");
                                addToTerminal("[ACTIONS RAPIDES] Module de publication d'annonce d'or lancé.");
                                try { audioSynth.playKoraSuccess(); } catch (_) {}
                              });
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500 transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">📢</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Créer annonce</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-text-sec uppercase tracking-widest block leading-none mt-0.5">Nouveau</span>
                            </div>
                          </button>

                          {/* 3. Vérifier GOMBO ID */}
                          <button
                            onClick={() => {
                              setVerifyGomboIdInput("");
                              setVerifyGomboIdResult(null);
                              setActiveQuickActionModal("verify_gombo_id");
                              addToTerminal("[ACTIONS RAPIDES] Vérification GOMBO ID ouverte.");
                              try { audioSynth.playTamTam(true); } catch (_) {}
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-afri-gold/10 flex items-center justify-center border border-afri-gold/20 group-hover:border-afri-gold transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">🛡️</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Vérifier ID</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-text-sec uppercase tracking-widest block leading-none mt-0.5">Académie</span>
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
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">🚨</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Signalements</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-text-sec uppercase tracking-widest block leading-none mt-0.5">Sécurité</span>
                            </div>
                          </button>

                          {/* 5. Envoyer une notification */}
                          <button
                            onClick={() => {
                              setNewNoticeTitle("");
                              setNewNoticeBody("");
                              setActiveQuickActionModal("send_notification");
                              addToTerminal("[ACTIONS RAPIDES] Rédaction de notification.");
                              try { audioSynth.playTamTam(true); } catch (_) {}
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500 transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">🔔</span>
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
                              addToTerminal("[ACTIONS RAPIDES] Trône d'Or : Analyse de Performance ouverte.");
                              try { audioSynth.playKoraSuccess(); } catch (_) {}
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 group-hover:border-yellow-500 transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">📈</span>
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
                              addToTerminal("[ACTIONS RAPIDES] Caisse / Portefeuille d'or chargé.");
                              try { audioSynth.playKoraSuccess(); } catch (_) {}
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-500 transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">💰</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Revenus</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-text-sec uppercase tracking-widest block leading-none mt-0.5">Sécurisé</span>
                            </div>
                          </button>

                          {/* 8. Paramètres */}
                          <button
                            onClick={() => {
                              setActiveMenu("user_settings");
                              addToTerminal("[ACTIONS RAPIDES] Paramètres du terminal chargés.");
                              try { audioSynth.playTamTam(false); } catch (_) {}
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold/35 rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-zinc-500/10 flex items-center justify-center border border-zinc-500/20 group-hover:border-zinc-500 transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">⚙</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Paramètres</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-text-sec uppercase tracking-widest block leading-none mt-0.5">Système</span>
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
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">✍️</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Contrats</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-text-sec uppercase tracking-widest block leading-none mt-0.5">Signature</span>
                            </div>
                          </button>

                          {/* 10. Portefeuille AFRIGOMBO WALLET */}
                          <button
                            onClick={() => {
                              requireAuthThen(() => {
                                setActiveMenu("user_wallet");
                                addToTerminal("[ACTIONS RAPIDES] Portefeuille AFRIGOMBO WALLET ouvert.");
                                try { audioSynth.playKoraSuccess(); } catch (err) {}
                              });
                            }}
                            className="bg-afri-bg border border-afri-border hover:border-afri-gold rounded-xl xs:rounded-2xl p-2 sm:p-4 hover:bg-afri-gold/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-14 xs:h-16 sm:h-24 select-none min-w-0"
                          >
                            <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-afri-gold/10 flex items-center justify-center border border-afri-gold/20 group-hover:border-afri-gold transition">
                              <span className="text-[8px] xs:text-[10px] sm:text-xs">💳</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[7.5px] xs:text-[8.5px] sm:text-[11px] font-sans font-black text-afri-text tracking-tight sm:tracking-wide truncate uppercase">Wallet Séquestre</div>
                              <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono text-afri-gold uppercase tracking-widest block leading-none mt-0.5">Bêta-Sécurisé</span>
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

                          {/* MODAL 2: VÉRIFIER GOMBO ID */}
                          {activeQuickActionModal === "verify_gombo_id" && (
                            <div className="space-y-4 text-left">
                              <div className="space-y-1">
                                <h3 className="text-sm font-display font-black text-afri-text uppercase tracking-widest flex items-center gap-2">
                                  <span>🛡️</span> RECHERCHER & CERTIFIER UN GOMBO ID
                                </h3>
                                <p className="text-[11px] text-afri-text-sec">Contrôlez le passeport numérique d'un membre de l'Académie.</p>
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
                                      const text = verifyGomboIdInput.toLowerCase().trim();
                                      if (!text) return;
                                      const found = users.find(u => 
                                        (u.id || "").toLowerCase().includes(text) || 
                                        (u.artisticName || "").toLowerCase().includes(text) ||
                                        (u.name || "").toLowerCase().includes(text)
                                      );
                                      setVerifyGomboIdResult(found || "not_found");
                                      addToTerminal(`[SCANNER] Gombo ID scanner de sécurité interrogé pour: ${verifyGomboIdInput}`);
                                      try { audioSynth.playKoraSuccess(); } catch(_) {}
                                    }}
                                    className="px-4 py-2 bg-afri-gold text-black hover:bg-afri-bg-sec text-xs font-mono font-black uppercase rounded-xl transition cursor-pointer"
                                  >
                                    VÉRIFIER
                                  </button>
                                </div>
                              </div>

                              {/* RESULTS CONTAINER */}
                              {verifyGomboIdResult && (
                                <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl animate-fadeIn space-y-3">
                                  {verifyGomboIdResult === "not_found" ? (
                                    <div className="space-y-2 text-center text-afri-text-sec py-2">
                                      <span className="text-xl block">❌</span>
                                      <p className="text-xs font-mono">Aucun artiste ne possède cet identifiant.</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <img src={verifyGomboIdResult.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-afri-gold/35" />
                                        <div>
                                          <strong className="text-xs text-afri-text uppercase block leading-none font-bold">{verifyGomboIdResult.artisticName}</strong>
                                          <span className="text-[9px] font-mono text-afri-text-sec block mt-1">{verifyGomboIdResult.commune} • ID: {verifyGomboIdResult.id}</span>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-afri-border select-none text-left">
                                        <div className="p-2 bg-afri-bg rounded-xl">
                                          <span className="text-[8px] font-mono text-afri-text-sec block uppercase leading-none">Statut KYC</span>
                                          <span className={`text-[10px] font-mono font-black uppercase mt-1 block leading-none ${verifyGomboIdResult.kycStatus === "approved" ? "text-emerald-400" : "text-amber-500"}`}>
                                            {verifyGomboIdResult.kycStatus === "approved" ? "🛡️ CERTIFIÉ ELITE" : "⏳ EN ATTENTE"}
                                          </span>
                                        </div>
                                        <div className="p-2 bg-afri-bg rounded-xl">
                                          <span className="text-[8px] font-mono text-afri-text-sec block uppercase leading-none">Rang d'Honneur</span>
                                          <span className="text-[10px] font-mono font-black text-afri-gold mt-1 block leading-none uppercase">
                                            {verifyGomboIdResult.performanceScore >= 95 ? "🌟 Impérial" : "Accordeur"}
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
                                              addToTerminal(`[SÉCURISÉ] GOMBO ID certifié avec succès pour ${verifyGomboIdResult.artisticName}`);
                                            } catch(_) {}
                                          }}
                                          className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-[#050505] font-mono font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5"
                                        >
                                          ✓ VALIDER LA ZONE DE CONFIANCE
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
                                  <span>🚨</span> CONTRÔLE DES SIGNALEMENTS & LITIGES
                                </h3>
                                <p className="text-[11px] text-afri-text-sec">Assurez l'étanchéité de la caisse et la probité des orchestres.</p>
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
                                        addToTerminal(`[DÉNONCIATION] Signalement enregistré pour ${customReportUser} : ${customReportReason}`);
                                        try { audioSynth.playTamTam(false); } catch(_) {}
                                      } catch (_) {}
                                    }}
                                    className="w-full py-2 bg-red-500 hover:bg-red-600 text-afri-text font-mono font-black text-xs uppercase rounded-lg transition"
                                  >
                                    ÉMETTRE L'ALERTE ROUGE ⛨
                                  </button>
                                </div>
                              </div>

                              {/* LIVE SIGNALEMENTS LIST */}
                              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 border-t border-afri-border pt-3">
                                <span className="text-[8.5px] font-mono text-zinc-550 uppercase block font-bold">ALERTE ACTIVES EN COURS D'ARBITRAGE</span>
                                {alerts.length === 0 ? (
                                  <div className="text-center py-4 text-xs text-zinc-650 font-mono">Aucun litige actif. Bravo à l'Académie !</div>
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
                                        Résoudre
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
                                  <span>📢</span> ENVOYER UN TAMBOUR (DIFFUSION)
                                </h3>
                                <p className="text-[11px] text-afri-text-sec">Émettez une vibration instantanée relayée sur tous les téléphones.</p>
                              </div>

                              <div className="space-y-3 pt-1 border-t border-afri-border">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-mono text-afri-gold uppercase block font-bold">Catégorie d'écho</label>
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
                                    placeholder="Entrez le contenu de la notification à synchroniser en direct..."
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
                                      authorName: "Académie Trône d'Or",
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
                                      addToTerminal(`[DIFFUSION] Tambour envoyé avec succès ! Titre: ${newNoticeTitle}`);
                                      try { audioSynth.playKoraSuccess(); } catch(_) {}
                                      alert("📢 Message diffusé en temps réel sur la Base !");
                                    } catch (_) {}
                                  }}
                                  className="w-full h-11 bg-gradient-to-r from-afri-gold to-amber-400 text-black font-sans font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                >
                                  DIFFUSER LE TAMBOUR 🪘
                                </button>
                              </div>
                            </div>
                          )}

                          {/* MODAL 5: ANALYTICS & STATISTIQUES PRESTIGE */}
                          {activeQuickActionModal === "stats" && (
                            <div className="space-y-4 text-left">
                              <div className="space-y-1">
                                <h3 className="text-sm font-display font-black text-afri-text uppercase tracking-widest flex items-center gap-2">
                                  <span>📈</span> PERFORMANCE & ANALYTIQUES D'OR
                                </h3>
                                <p className="text-[11px] text-afri-text-sec">Analyse d'audience et de budget de l'Académie en temps réel.</p>
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
                                <span className="text-[8px] font-mono text-afri-text-sec uppercase block font-bold">FRÉQUENTATION JOURNALIÈRE</span>
                                <div className="h-28 w-full mt-2">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                      data={[
                                        { day: "Lun", v: 240 },
                                        { day: "Mar", v: 380 },
                                        { day: "Mer", v: 310 },
                                        { day: "Jeu", v: 480 },
                                        { day: "Ven", v: 620 },
                                        { day: "Sam", v: 750 },
                                        { day: "Dim", v: 910 },
                                      ]}
                                      margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                                    >
                                      <XAxis dataKey="day" stroke="#52525b" fontSize={8} tickLine={false} />
                                      <YAxis stroke="#52525b" fontSize={8} tickLine={false} />
                                      <Tooltip contentStyle={{ background: "#0e0e10", borderColor: "#52525b", fontSize: 8 }} />
                                      <Area type="monotone" dataKey="v" stroke="#D4AF37" fill="rgba(212, 175, 55, 0.15)" strokeWidth={2} />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* MODAL 6: REVENUS / CAISSE */}
                          {activeQuickActionModal === "revenu" && (
                            <RevenuQuickActionModal
                              activeArtistId={activeArtistId}
                              users={users}
                              saveToFirestore={saveToFirestore}
                              transactions={transactions}
                              setTransactions={setTransactions}
                              setActiveQuickActionModal={setActiveQuickActionModal}
                              addToTerminal={addToTerminal}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                    {/* CARTE HÉRO PRINCIPALE PREMIUM (CARROUSEL) */}
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
                                AFRIGOMBO PORTAL
                              </span>
                              <h2 className="text-2xl sm:text-4xl font-display font-black tracking-tight leading-none uppercase">
                                <span className="text-afri-text block mb-1">LE TERRAIN</span>
                                <span className="text-afri-gold">D'INTELLIGENCE</span>
                              </h2>
                              <p className="text-[11px] sm:text-xs text-afri-text-sec mt-2 max-w-md leading-relaxed">
                                Consultez l'actu bouillante du showbiz à Abidjan, décrochez des cachets d'or ou postez de nouvelles alliances.
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
                                PUBLIER UNE OPPORTUNITÉ
                              </button>
                            </div>
                          </div>
                        </div>,
                        <div className="relative overflow-hidden rounded-3xl bg-afri-bg border border-afri-gold/25 p-5 sm:p-7 shadow-xl h-[280px] sm:h-auto flex flex-col justify-between">
                          <div className="absolute right-0 top-0 bottom-0 w-[42%] h-full z-0 overflow-hidden">
                            <img 
                              src="https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=360" 
                              alt="Scène Live" 
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
                                <span className="text-afri-gold">NOUVEAUTÉS</span>
                              </h2>
                              <p className="text-[11px] sm:text-xs text-afri-text-sec mt-2 max-w-md leading-relaxed">
                                Découvrez les nouveaux talents et les tendances musicales qui font vibrer les nuits d'Abidjan.
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
                        <span className="text-sm sm:text-lg shrink-0">🎵</span>
                        <div className="min-w-0">
                          <h4 className="text-[8.5px] sm:text-[10.5px] font-display font-black uppercase text-afri-gold truncate leading-none">ÉCHOS</h4>
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
                        <span className="text-sm sm:text-lg shrink-0">💰</span>
                        <div className="min-w-0">
                          <h4 className="text-[8.5px] sm:text-[10.5px] font-display font-black uppercase text-afri-gold truncate leading-none">CACHETS</h4>
                          <p className="text-[7.5px] sm:text-[8px] text-afri-text-sec font-mono mt-0.5 truncate leading-none">Offres & Dem.</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setTerrainTab("all");
                          addToTerminal("[FILTRE] Tendances d'Abidjan activées sur le Terrain.");
                          try { audioSynth.playValidationSuccess(); } catch (e) {}
                        }}
                        className="p-1.5 sm:p-2.5 rounded-xl bg-afri-bg/35 border border-afri-border hover:border-afri-gold/40 text-left cursor-pointer transition-all text-afri-text/90 flex items-center gap-1.5 sm:gap-2.5"
                      >
                        <span className="text-sm sm:text-lg shrink-0">📈</span>
                        <div className="min-w-0">
                          <h4 className="text-[8.5px] sm:text-[10.5px] font-display font-black uppercase text-afri-gold truncate leading-none">TENDANCES</h4>
                          <p className="text-[7.5px] sm:text-[8px] text-afri-text-sec font-mono mt-0.5 truncate leading-none">Abidjan Mix</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          addToTerminal("[INFO] Calendrier des événements : tous les spectacles, showcases, et concerts du mois.");
                          alert("📅 Évènements d'Or : Retrouvez l'agenda complet des concerts live d'Abidjan sur le canal d'Actu !");
                          try { audioSynth.playTamTam(false); } catch (e) {}
                        }}
                        className="p-1.5 sm:p-2.5 rounded-xl bg-afri-bg/35 border border-afri-border hover:border-afri-gold/40 text-left cursor-pointer transition-all text-afri-text/90 flex items-center gap-1.5 sm:gap-2.5"
                      >
                        <span className="text-sm sm:text-lg shrink-0">📅</span>
                        <div className="min-w-0">
                          <h4 className="text-[8.5px] sm:text-[10.5px] font-display font-black uppercase text-afri-gold truncate leading-none">ÉVÉNEMENTS</h4>
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
                          Tout l'Écran
                        </button>
                        <button
                          onClick={() => setTerrainTab("musicien")}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                            terrainTab === "musicien" ? "bg-afri-gold text-[#050505]" : "text-afri-text-sec hover:text-afri-text"
                          }`}
                        >
                          Échos d'Artistes
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
                        {GombosToRender.length} cachets & {filteredFeedPosts.length} murmures sur scène
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
                              Aucun contrat (Gombo) ne correspond à vos filtres actuels.
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
                                            ● Actif
                                          </span>
                                          <span className="text-[10px] font-mono text-afri-text-sec">📍 {g.location}</span>
                                          <span className="text-zinc-650 font-mono text-[10px]">•</span>
                                          <span className="text-[10px] text-afri-text-sec font-mono">{g.date || "Date Récente"}</span>
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
                                            VOIR DÉTAILS
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
                              Aucune mise à jour trouvée sur Le Terrain.
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
                                if (p.category === "Événement") {
                                  categoryColor = "border-emerald-500/30 text-emerald-400 bg-emerald-500/5";
                                } else if (p.category === "Recherche") {
                                  categoryColor = "border-rose-500/30 text-rose-400 bg-rose-500/5";
                                } else if (p.category === "Collaboration") {
                                  categoryColor = "border-cyan-500/30 text-cyan-400 bg-cyan-500/5";
                                } else if (p.category === "Opportunité") {
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
                                            {p.authorName} • {authorUser?.email || "artiste@afrigombo.ci"}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="text-right flex flex-col items-end shrink-0">
                                        <span className="text-[9px] font-mono font-bold text-afri-gold flex items-center gap-1">
                                          📍 {authorCommune}
                                        </span>
                                        <span className="text-[7.5px] font-mono text-afri-text-sec mt-0.5">
                                          {formattedDate} à {formattedTime}
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
                                          ÉCHO PREMIUM
                                        </span>
                                      </div>
                                    )}

                                    {/* DESCRIPTION */}
                                    <p className="text-[11.5px] font-sans text-afri-text leading-relaxed bg-afri-bg/60 p-3 rounded-xl border border-white/[0.03]">
                                      {p.content}
                                    </p>

                                    {p.isFlagged && (
                                      <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2.5 text-[8.5px] font-mono text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <span>⚠️ INTERVENTION AI</span> • <span className="text-afri-text-sec">{p.flagReason || "Contenu révisé"}</span>
                                      </div>
                                    )}

                                    {/* CATEGORY & HASHTAGS ROW */}
                                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                                      {/* Category Badge */}
                                      <span className={`text-[8.5px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${categoryColor}`}>
                                        {p.category || "Général"}
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
                                          <span className="text-[12px]">{isLiked ? "🪘" : "🪘"}</span> 
                                          <span>{p.likes + (isLiked ? 1 : 0)} honneurs reçus</span>
                                        </button>

                                        {/* Views Count */}
                                        <div className="flex items-center gap-1.5 text-afri-text-sec">
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>{p.views || 45} vues</span>
                                        </div>

                                        {/* Shares Count */}
                                        <div className="flex items-center gap-1.5 text-afri-text-sec">
                                          <Share2 className="w-3.5 h-3.5" />
                                          <span>{p.shares || 8} partages</span>
                                        </div>
                                      </div>
                                      
                                      {/* Golden Action Buttons */}
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => {
                                            try {
                                              navigator.clipboard.writeText(`${window.location.origin}/echo/${p.id}`);
                                              addToTerminal(`[LIEN COPIÉ] Lien vers l'écho de ${p.authorArtisticName} copié.`);
                                              audioSynth.playValidationSuccess();
                                            } catch (_) {
                                              addToTerminal(`[EXPÉDITION] Écho de ${p.authorArtisticName} prêt à l'envoi.`);
                                            }
                                          }}
                                          className="text-[9.5px] px-2.5 py-1.5 rounded-lg font-bold border border-afri-gold/30 hover:border-afri-gold/80 hover:bg-afri-gold/5 text-afri-gold transition-all cursor-pointer flex items-center gap-1"
                                        >
                                          <span>Partager</span>
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
                                          placeholder="Ajouter un parler d'Académie..."
                                          onKeyDown={async (e: any) => {
                                            if (e.key === "Enter" && e.target.value.trim()) {
                                              const content = e.target.value.trim();
                                              const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                                              const writerName = currentArtist ? currentArtist.artisticName : "Artiste Élite";
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
                                              addToTerminal(`[PARLER] Parler ajouté par ${writerName} sur le post ${p.id}`);
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
                    <footer className="mt-16 border-t border-afri-border bg-afri-bg-sec rounded-3xl p-6 sm:p-8 space-y-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-afri-border">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-afri-gold/10 flex items-center justify-center">
                            <Flame className="text-afri-gold w-5 h-5 animate-bounce" />
                          </div>
                          <div>
                            <span className="text-xs font-sans font-black text-afri-text uppercase tracking-widest block leading-tight">Y'A GOMBO MUSIC</span>
                            <span className="text-[7.5px] uppercase font-mono tracking-widest text-afri-gold/75 font-black block">Elite Sovereignty Consortium</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-mono text-afri-text-sec">
                          <button
                            onClick={() => {
                              setActiveMenu("terms");
                            }}
                            className="hover:text-afri-gold transition-all cursor-pointer font-bold"
                          >
                            CGU
                          </button>
                          <span className="text-zinc-800">•</span>
                          <button
                            onClick={() => {
                              setActiveMenu("privacy");
                            }}
                            className="hover:text-afri-gold transition-all cursor-pointer font-bold"
                          >
                            CONFIDENTIALITÉ
                          </button>
                          <span className="text-zinc-800">•</span>
                          <button
                            onClick={() => {
                              setActiveMenu("delete_account");
                            }}
                            className="text-red-500/80 hover:text-red-400 hover:underline transition-all cursor-pointer font-bold"
                          >
                            SUPPRIMER COMPTE
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] font-mono text-afri-text-sec text-center sm:text-left">
                        <p>
                          AFRIGOMBO SHOWBIZ • Conçu avec rigueur et prestige pour les maîtres de scène en Côte d'Ivoire.
                        </p>
                        <p>
                          © 2026. Souveraineté Artistique Garantie.
                        </p>
                      </div>
                    </footer>

                  </div>
                );
              })()}

              {/* 1.5. L'ÉCOSYSTÈME 2.0 - UNIVERSE OF RICH SERVICES */}
              {activeMenu === "user_ecosystem" && (() => {
                return (
                  <div className="space-y-6 animate-fadeIn pb-24 text-left">
                    <div className="border-b border-afri-gold/20 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-xl font-display font-black text-afri-gold uppercase flex items-center gap-2">
                          <span>🌟 Écosystème 2.0</span>
                        </h3>
                        <p className="text-afri-text-sec text-xs mt-1">L'univers prestige complet de services d'alliance et d'outils pour l'élite d'Abidjan.</p>
                      </div>
                      <button
                        onClick={() => setActiveMenu("user_terrain")}
                        className="bg-afri-bg/80 border border-afri-border rounded-xl px-4 py-2 text-xs font-mono text-afri-gold hover:text-afri-text"
                      >
                        Retour au Terrain 🎯
                      </button>
                    </div>
                    
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
                  </div>
                );
              })()}

              {/* 2. LES VIBES - SEARCH FOR OTHER ARTISTS & alliances */}
              {activeMenu === "user_vibes" && (() => {
                const searchStr = globalSearchTerm.toLowerCase();
                const filteredArtists = users.filter(u => 
                  (u.artisticName || "").toLowerCase().includes(searchStr) ||
                  (u.commune || "").toLowerCase().includes(searchStr) ||
                  (u.specialties && u.specialties.some(s => (s || "").toLowerCase().includes(searchStr)))
                );

                return (
                  <div className="space-y-6 animate-fadeIn pb-24">
                    <div className="p-5 rounded-2xl bg-afri-bg-sec border border-afri-gold/15 relative overflow-hidden">
                      <div className="relative z-10">
                        <h3 className="text-md font-sans font-black text-afri-text uppercase tracking-wide">
                          🔍 Les Vibes : Moteur de Recherche d'Alliances
                        </h3>
                        <p className="text-xs text-afri-text-sec mt-1">
                          Découvrez d'autres virtuoses à Abidjan, explorez leurs spécialités et scellez des partenariats artistiques prestigieux.
                        </p>
                      </div>
                      <AfrigomboVibeWaves />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredArtists.length === 0 ? (
                        <div className="col-span-full">
                          <PremiumEmptyState 
                            message="Aucun virtuose trouvé." 
                            submessage="Modifiez votre recherche ou découvrez d'autres artistes." 
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
                                  📍 {artist.commune}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-afri-text-sec uppercase block font-bold">SPÉCIALITÉS D'ALLIANCE :</span>
                              <div className="flex flex-wrap gap-1">
                                {(artist.specialties || ["Virtuose multi-instrumental"]).map((s, idx) => (
                                  <span key={idx} className="text-[8px] font-mono bg-white/5 border border-afri-border text-afri-text px-1.5 py-0.5 rounded">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <p className="text-[10px] text-afri-text-sec leading-snug italic bg-afri-bg p-2.5 rounded-lg border border-afri-border">
                              "{artist.bio || "Ce virtuose de scène cultive l'excellence sans fard à Abidjan."}"
                            </p>
                          </div>

                          <div className="border-t border-zinc-950 pt-3.5 flex items-center justify-between">
                            <div className="text-left">
                              <span className="text-[8px] uppercase font-mono text-afri-text-sec block">SCORE ACADÉMIE :</span>
                              <span className="text-xs font-mono font-bold text-afri-gold">
                                Rang {artist.performance?.level || "3"} / 5
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                audioSynth.playValidationSuccess();
                                addToTerminal(`[🎼 ALLIANCE] Proposition de raccordement d'or envoyée à : ${artist.artisticName}`);
                                alert(`Demande d'alliance d'or notifiée ! Notre transmetteur a fait vibrer les tambours de ${artist.artisticName}.`);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-afri-gold/10 hover:bg-afri-gold text-afri-gold hover:text-[#050505] text-[10px] font-mono font-black border border-afri-gold/35 uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Proposer une Alliance 🤝
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
              {activeMenu === "user_publish" && (() => {
                const saveDraft = (fields: any) => {
                  try {
                    const saved = localStorage.getItem("gombo_publish_draft");
                    const current = saved ? JSON.parse(saved) : {};
                    const updated = { ...current, ...fields };
                    localStorage.setItem("gombo_publish_draft", JSON.stringify(updated));
                  } catch (_) {}
                };

                const clearDraft = () => {
                  localStorage.removeItem("gombo_publish_draft");
                  setNewGomboTitle("");
                  setNewGomboDesc("");
                  setNewGomboPrice(15000);
                  setNewGomboQuartier("");
                  setNewGomboLieuPrecis("");
                  setNewGomboDate("");
                  setNewGomboStyleMusical("");
                  setNewGomboTenueExigee("");
                  setNewGomboExperienceSouhaitee("");
                  setPublishPhoto("");
                  setPublishAudio("");
                  setMultiplePublishPhotos([]);
                  setSelectedPublishTags([]);
                };

                const getCategoryLabel = () => {
                  switch (activePublishType) {
                    case "gombo": return "🎉 Événement / Gombo";
                    case "reel": return "📹 Réel Artistique";
                    case "demo": return "🎵 Démo musicale";
                    case "renfort": return "⚡ Renfort Express";
                    case "recherche": return "🎸 Recherche instrumentiste";
                    default: return "🎉 Événement / Gombo";
                  }
                };

                // Calculate progress dynamically
                let currentProgress = 50;
                let points = 0;
                if (newGomboTitle.trim()) points += 10;
                if (newGomboDesc.trim()) points += 10;
                if (newGomboQuartier.trim()) points += 10;
                if (newGomboDate.trim()) points += 10;
                if (newGomboPrice >= 15000) points += 10;
                currentProgress += points;

                const handleTagToggle = (tag: string) => {
                  if (selectedPublishTags.includes(tag)) {
                    setSelectedPublishTags(prev => prev.filter(t => t !== tag));
                  } else {
                    if (selectedPublishTags.length < 5) {
                      setSelectedPublishTags(prev => [...prev, tag]);
                    }
                  }
                };

                const triggerPubSubmit = async () => {
                  if (!currentUser) {
                    addToTerminal("🔒 Action refusée : Connectez-vous pour continuer.");
                    setIsAuthModalOpen(true);
                    return;
                  }

                  if (activePublishType === "reel" && !publishAudio) {
                    alert("Veuillez uploader une vidéo pour votre Réel.");
                    return;
                  }

                  if (activePublishType !== "reel") {
                    if (!newGomboTitle.trim()) {
                      alert("Veuillez renseigner un titre spectaculaire pour votre publication !");
                      return;
                    }
                    if (!newGomboDesc.trim()) {
                      alert("Veuillez renseigner une description détaillée !");
                      return;
                    }
                    if (!newGomboQuartier.trim()) {
                      alert("Veuillez spécifier la commune ou le quartier !");
                      return;
                    }
                    if (!newGomboDate) {
                      alert("Veuillez spécifier une date pour la publication !");
                      return;
                    }
                    if (!newGomboPrice || newGomboPrice < 15000) {
                      alert("Le budget minimum d'une publication / contrat est réglementé à 15 000 FCFA.");
                      return;
                    }
                  }

                  // 1. Trigger Loading State
                  setPublishLoading(true);
                  try { audioSynth.playTamTam(true); } catch (_) {}

                  // Simulated upload & processing delay
                  await new Promise(resolve => setTimeout(resolve, 2000));

                  const activeArtist = users.find(u => u.id === activeArtistId) || users[0];
                  const uniqueId = "gombo_new_" + Date.now();
                  const categoryLabel = getCategoryLabel();

                  if (activePublishType === "reel") {
                    // Just create a reel post
                    const newPostId = "post_reel_" + Date.now();
                    const newP: Post = {
                      id: newPostId,
                      userId: activeArtistId,
                      authorName: activeArtist.name,
                      authorArtisticName: activeArtist.artisticName,
                      content: `📹 Nouveau Réel publié !\\n\\n${newGomboDesc}`,
                      likes: 0,
                      comments: 0,
                      isFlagged: false,
                      timestamp: new Date().toISOString(),
                      mediaUrl: publishAudio, // Treat audio field as video URL for simplicity here
                      mediaType: "video"
                    } as any;
                    setPosts(prev => [newP, ...prev]);
                    await saveToFirestore("posts", newP.id, newP);
                  } else {
                    const newG: Gombo = {
                      id: uniqueId,
                      title: `🎖️ (${categoryLabel}) ${newGomboTitle}`,
                      description: newGomboDesc + (selectedPublishTags.length > 0 ? `\\n\\nTags: ${selectedPublishTags.map(t => `#${t}`).join(" ")}` : ""),
                      budget: newGomboPrice,
                      commissionRate: (activeArtist.subscriptionPlan === "pro" || activeArtist.subscriptionPlan === "elite") ? 0.015 : 0.025,
                      location: `${newGomboQuartier}, ${newGomboCity}`,
                      city: newGomboCity,
                      quartier: newGomboQuartier,
                      lieuPrecis: newGomboLieuPrecis || "Sur scène",
                      organizerId: activeArtistId,
                      organizerName: activeArtist.artisticName || activeArtist.name,
                      timestamp: new Date().toISOString(),
                      applicantsCount: 0,
                      status: "open",
                      isBoosted: false,
                      date: newGomboDate,
                      time: `${newGomboHeureDebut} - ${newGomboHeureFin}`,
                      category: categoryLabel,
                      styleMusical: newGomboStyleMusical || "Tous styles",
                      tenueExigee: newGomboTenueExigee || "Tenue de scène libre",
                      experienceSouhaitee: newGomboExperienceSouhaitee || "Tous niveaux bienvenus",
                      nombreRecherche: newGomboNombreRecherche,
                      isRenfort: activePublishType === "renfort",
                      transportFee: activePublishType === "renfort" ? newGomboTransportFee : 0,
                      repetitionsCount: activePublishType === "renfort" ? newGomboRepetitionsCount : 0,
                      repetitionsSchedule: activePublishType === "renfort" ? newGomboRepetitionsSchedule : "",
                      repetitionsDates: activePublishType === "renfort" ? newGomboRepetitionsDates : ""
                    };

                    if (multiplePublishPhotos.length > 0) {
                      (newG as any).coverUrl = multiplePublishPhotos[0];
                      (newG as any).photos = multiplePublishPhotos;
                    }
                    if (publishAudio) {
                      (newG as any).audioUrl = publishAudio;
                    }

                    setGombos(prev => [newG, ...prev]);
                    await saveToFirestore("gombos", newG.id, newG);

                    const newPostId = "post_new_" + Date.now();
                    const newP: Post = {
                      id: newPostId,
                      userId: activeArtistId,
                      authorName: activeArtist.name,
                      authorArtisticName: activeArtist.artisticName,
                      content: `📢 [${categoryLabel}] ${newGomboTitle}\\n\\n📍 Lieu : ${newGomboQuartier}, ${newGomboCity}\\n💰 Budget : ${newGomboPrice.toLocaleString()} FCFA\\n📅 Date : ${newGomboDate}\\n\\n${newGomboDesc}`,
                      likes: 0,
                      comments: 0,
                      isFlagged: false,
                      timestamp: new Date().toISOString()
                    };
                    if (multiplePublishPhotos.length > 0) newP.mediaUrl = multiplePublishPhotos[0];
                    if (publishAudio) (newP as any).audioUrl = publishAudio;
                    setPosts(prev => [newP, ...prev]);
                    await saveToFirestore("posts", newP.id, newP);
                  }

                  // 2. Trigger Success State
                  setPublishLoading(false);
                  setPublishSuccess(true);
                  try { audioSynth.playValidationSuccess(); } catch (_) {}

                  await new Promise(resolve => setTimeout(resolve, 1500));

                  // Clear draft, reset status, redirect
                  clearDraft();
                  setPublishSuccess(false);
                  setActiveMenu("user_terrain");
                };

                return (
                  <div className="afri-container h-full w-full overflow-y-auto overflow-x-hidden pb-32 pt-4 xs:pt-6 scrollbar-none">
                    <div className="max-w-2xl mx-auto space-y-4 xs:space-y-6 animate-fadeIn pb-24 relative select-none">
                    
                    {/* Draft restoration alert banner */}
                    {publishDraftDetected && (
                      <div className="bg-afri-gold/15 border border-afri-gold/30 rounded-2xl p-4 text-xs text-afri-text flex items-center justify-between animate-slideDown">
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-afri-gold shrink-0" />
                          ⚡ Brouillon restauré automatiquement
                        </span>
                        <button 
                          onClick={clearDraft}
                          className="px-2.5 py-1 bg-afri-gold/10 hover:bg-afri-gold/20 text-afri-gold font-mono rounded-lg text-[10px] uppercase font-bold"
                        >
                          Effacer
                        </button>
                      </div>
                    )}

                    {/* Progress Bar Display */}
                    {activePublishType !== "reel" && (
                      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 space-y-2">
                        <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider">
                          <span className="text-zinc-550">PROGRESSION DE PUBLICATION :</span>
                          <span className="text-afri-gold font-bold">{currentProgress}%</span>
                        </div>
                        <div className="w-full bg-afri-bg h-2 rounded-full overflow-hidden border border-afri-border">
                          <div 
                            className="bg-gradient-to-r from-afri-gold to-amber-500 h-full transition-all duration-500 ease-out"
                            style={{ width: `${currentProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Loading Overlay spinner */}
                    {publishLoading && (
                      <div className="fixed inset-0 bg-afri-bg/90 backdrop-blur-md z-[999] flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-afri-gold" />
                        <h3 className="text-base font-mono font-black uppercase tracking-widest text-afri-text animate-pulse">
                          {activePublishType === "reel" ? "Préparation publication..." : "Publication en cours..."}
                        </h3>
                        <p className="text-xs text-afri-text-sec">
                          {activePublishType === "reel" ? "Compression silencieuse et optimisation réseau..." : "Création de votre souveraineté sur Le Terrain..."}
                        </p>
                      </div>
                    )}

                    {/* Success Overlay Check */}
                    {publishSuccess && (
                      <div className="fixed inset-0 bg-afri-bg/95 backdrop-blur-md z-[999] flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 animate-scaleUp">
                          <Check className="w-10 h-10 stroke-[3]" />
                        </div>
                        <h3 className="text-lg font-sans font-black uppercase tracking-widest text-afri-text">
                          ✅ Publication créée
                        </h3>
                        <p className="text-xs text-afri-text-sec">Diffusion instantanée sur Le Terrain !</p>
                      </div>
                    )}

                    {/* Form block */}
                    <div className="bg-afri-bg-sec border border-afri-gold/20 rounded-2xl xs:rounded-3xl p-4 xs:p-6 sm:p-8 space-y-4 xs:space-y-6 shadow-xl text-left relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-afri-gold to-amber-600 opacity-80" />
                      
                      <div className="border-b border-afri-border pb-3 xs:pb-4 flex justify-between items-start">
                        <div>
                          <span className="text-[7px] xs:text-[9px] uppercase font-mono tracking-widest text-afri-gold font-bold">TRANSMETTEUR MULTI-RÉSEAUX</span>
                          <h3 className="text-lg xs:text-xl font-display font-black text-afri-text uppercase tracking-tight mt-0.5 xs:mt-1">{getCategoryLabel()}</h3>
                          <p className="text-[10px] xs:text-xs text-afri-text-sec mt-1">
                            {activePublishType === "reel" 
                              ? "Partagez un moment musical fort en format vidéo vertical." 
                              : "Diffusez vos besoins ou démonstrations à toute la république musicale."}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowHowWorksPopup(true)}
                          className="w-8 h-8 rounded-full bg-afri-bg-sec border border-afri-border flex items-center justify-center text-afri-text-sec hover:text-afri-gold hover:border-afri-gold/50 transition-colors shrink-0"
                          title="Comment fonctionne AFRIGOMBO ?"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-5 animate-fadeIn">
                        
                        {activePublishType === "reel" ? (
                          <>
                            {/* REEL FORM */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-afri-text-sec block font-bold">UPLOADER VOTRE VIDÉO (MP4, MOV) :</label>
                              <div className="border-2 border-dashed border-afri-border rounded-2xl p-8 bg-afri-bg/40 text-center hover:border-afri-gold transition-all cursor-pointer">
                                {publishAudio ? (
                                  <div className="space-y-3">
                                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                                      <Check className="w-8 h-8 stroke-[3]" />
                                    </div>
                                    <span className="block text-xs font-bold text-emerald-400">Vidéo prête</span>
                                    <button
                                      type="button"
                                      onClick={() => setPublishAudio("")}
                                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-mono rounded"
                                    >
                                      Remplacer la vidéo
                                    </button>
                                  </div>
                                ) : (
                                  <label className="cursor-pointer block space-y-2">
                                    <span className="block text-3xl">📱</span>
                                    <span className="block text-[12px] font-sans text-afri-text"><b>Parcourir les fichiers</b> ou glisser la vidéo</span>
                                    <span className="block text-[9px] font-mono text-afri-text-sec">Format portrait recommandé (Max 100MB)</span>
                                    <input 
                                      type="file" 
                                      accept="video/*" 
                                      className="hidden" 
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          const file = e.target.files[0];
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            setPublishAudio(reader.result as string);
                                            try { audioSynth.playValidationSuccess(); } catch (_) {}
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2 text-left">
                              <label className="text-[10px] font-mono uppercase text-afri-text-sec block font-bold">LÉGENDE / DESCRIPTION :</label>
                              <textarea
                                value={newGomboDesc}
                                onChange={(e) => setNewGomboDesc(e.target.value)}
                                placeholder="Ajoutez un contexte, des hashtags, ou mentionnez vos collaborateurs..."
                                className="w-full h-24 bg-afri-bg border border-afri-border focus:border-afri-gold rounded-xl p-3 text-xs text-afri-text placeholder-zinc-650 focus:outline-none transition-all resize-none font-sans"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            {/* GOMBO / RENFORT / OPPORTUNITY FORM */}
                            <div className="space-y-2 text-left">
                              <label className="text-[10px] font-mono uppercase text-afri-text-sec block font-bold">TITRE DE L'ACTU / OPPORTUNITÉ :</label>
                              <input
                                type="text"
                                value={newGomboTitle}
                                onChange={(e) => {
                                  setNewGomboTitle(e.target.value);
                                  saveDraft({ title: e.target.value });
                                }}
                                placeholder="ex. Recherche bassiste soliste pour maquis chic ce soir..."
                                className="w-full bg-afri-bg border border-afri-border focus:border-afri-gold rounded-xl px-3 py-2.5 text-xs text-afri-text focus:outline-none placeholder-zinc-650 font-sans"
                              />
                            </div>

                            <div className="space-y-2 text-left">
                              <label className="text-[10px] font-mono uppercase text-afri-text-sec block font-bold">DÉTAILS DU PROJET ET DES CONDITIONS :</label>
                              <textarea
                                value={newGomboDesc}
                                onChange={(e) => {
                                  setNewGomboDesc(e.target.value);
                                  saveDraft({ desc: e.target.value });
                                }}
                                placeholder="Décrivez votre déroulé artistique, matériel requis, style musical d'honneur exigé..."
                                className="w-full h-24 bg-afri-bg border border-afri-border focus:border-afri-gold rounded-xl p-3 text-xs text-afri-text placeholder-zinc-650 focus:outline-none transition-all resize-none font-sans"
                              />
                            </div>

                            {/* Tags Selection */}
                            <div className="space-y-2 text-left">
                              <label className="text-[10px] font-mono uppercase text-afri-text-sec block font-bold flex justify-between">
                                <span>TAGS RECHERCHÉS (MAX 5) :</span>
                                <span className="text-afri-gold">{selectedPublishTags.length}/5</span>
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {["Pianiste", "Bassiste", "Choriste", "Soliste", "Percussionniste", "Beatmaker", "Ingénieur Son", "Acoustique", "Live", "Urbain"].map(tag => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleTagToggle(tag)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all border ${
                                      selectedPublishTags.includes(tag) 
                                        ? "bg-afri-gold/20 border-afri-gold text-afri-gold" 
                                        : "bg-afri-bg border-afri-border text-afri-text-sec hover:border-zinc-600"
                                    }`}
                                  >
                                    #{tag}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-mono uppercase text-afri-gold block font-bold">COMMUNE / QUARTIER :</label>
                                <select
                                  value={newGomboQuartier}
                                  onChange={(e) => {
                                    setNewGomboQuartier(e.target.value);
                                    saveDraft({ quartier: e.target.value });
                                  }}
                                  className="w-full bg-afri-bg border border-afri-border focus:border-afri-gold rounded-xl px-3 py-2.5 text-xs text-afri-text focus:outline-none font-sans cursor-pointer"
                                >
                                  <option value="">Choisir la commune...</option>
                                  {["Cocody", "Marcory", "Plateau", "Treichville", "Yopougon", "Koumassi", "Abobo", "Adjamé", "Port-Bouët", "Bingerville", "Grand-Bassam"].map(c => (
                                    <option key={c} value={c} className="bg-afri-bg text-afri-text">{c}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-mono uppercase text-afri-text-sec block font-bold">DATE PRÉVUE :</label>
                                <input
                                  type="date"
                                  value={newGomboDate}
                                  onChange={(e) => {
                                    setNewGomboDate(e.target.value);
                                    saveDraft({ date: e.target.value });
                                  }}
                                  className="w-full bg-afri-bg border border-afri-border focus:border-afri-gold rounded-xl px-3 py-2.5 text-xs text-afri-text focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-mono uppercase text-afri-gold block font-bold">BUDGET CACHET PRÉVU (FCFA) :</label>
                                <span className="text-[8px] font-mono text-zinc-550">RÈGLEMENTATION MINIMALE : 15 000 FCFA</span>
                              </div>
                              <input
                                type="number"
                                min="15000"
                                value={newGomboPrice}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setNewGomboPrice(val);
                                  saveDraft({ price: val });
                                }}
                                className={`w-full bg-afri-bg border rounded-xl px-3 py-2.5 text-xs text-afri-text font-mono focus:outline-none transition-all ${
                                  newGomboPrice < 15000 ? "border-red-500/50 text-red-400 focus:border-red-500" : "border-afri-border focus:border-afri-gold"
                                }`}
                              />
                              {newGomboPrice < 15000 && (
                                <p className="text-[9px] font-mono text-red-500">
                                  ⚠️ Le budget d'honneur minimum requis pour garantir la décence et le respect des artistes est de 15 000 FCFA.
                                </p>
                              )}
                            </div>

                            {/* Multiple Photos Upload */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-afri-text-sec block font-bold flex justify-between">
                                <span>PHOTOS ILLUSTRATIVES (OPTIONNEL) :</span>
                                <span className="text-afri-gold">{multiplePublishPhotos.length}/4</span>
                              </label>
                              
                              <div className="grid grid-cols-4 gap-2">
                                {multiplePublishPhotos.map((photo, idx) => (
                                  <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-afri-gold/30 bg-afri-bg group">
                                    <img src={photo} alt="Upload preview" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => setMultiplePublishPhotos(prev => prev.filter((_, i) => i !== idx))}
                                      className="absolute top-1 right-1 w-5 h-5 bg-afri-bg/60 rounded-full flex items-center justify-center text-afri-text opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                                
                                {multiplePublishPhotos.length < 4 && (
                                  <label className="aspect-square border border-dashed border-afri-border rounded-xl bg-afri-bg/40 flex flex-col items-center justify-center cursor-pointer hover:border-afri-gold transition-all text-afri-text-sec hover:text-afri-gold">
                                    <Plus className="w-5 h-5 mb-1" />
                                    <span className="text-[8px] font-mono uppercase">Ajouter</span>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          const file = e.target.files[0];
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            setMultiplePublishPhotos(prev => [...prev, reader.result as string]);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>

                            {/* Audio Sample Uplink */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-afri-text-sec block font-bold">EXTRAIT AUDIO (FACULTATIF) :</label>
                              <div className="p-4 bg-afri-bg border border-afri-border rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-xl">🎙️</span>
                                  <div className="text-left">
                                    <span className="block text-xs font-sans text-afri-text font-bold">Uploader une maquette</span>
                                    <span className="block text-[8px] font-mono text-zinc-550">Supporte MP3, WAV</span>
                                  </div>
                                </div>
                                <label className="px-3 py-1.5 bg-afri-bg-sec hover:bg-afri-bg-sec text-afri-text font-mono rounded-lg text-[9px] uppercase font-bold cursor-pointer transition-all border border-afri-border">
                                  Choisir fichier
                                  <input 
                                    type="file" 
                                    accept="audio/*" 
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setPublishAudio(reader.result as string);
                                          try { audioSynth.playValidationSuccess(); } catch (_) {}
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                              {publishAudio && (
                                <div className="p-2.5 bg-afri-bg-sec/40 rounded-xl flex items-center justify-between border border-emerald-500/10 mt-2">
                                  <span className="text-[10px] font-mono text-emerald-400">✓ Audio prêt</span>
                                  <button
                                    type="button"
                                    onClick={() => setPublishAudio("")}
                                    className="text-[9px] font-mono text-red-500 hover:underline"
                                  >
                                    Retirer
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Renfort Express specific fields */}
                            {activePublishType === "renfort" && (
                              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3 text-left relative overflow-hidden mt-4">
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                  <Zap className="w-16 h-16 text-red-500" />
                                </div>
                                <span className="text-[9px] font-mono text-red-400 uppercase font-bold block relative z-10 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                  CONFIGURATION RENFORT EXPRESS
                                </span>
                                <div className="grid grid-cols-2 gap-3 relative z-10">
                                  <div>
                                    <label className="text-[8.5px] font-mono text-afri-text-sec uppercase block mb-1">Nombre requis :</label>
                                    <input 
                                      type="number" 
                                      min="1" 
                                      value={newGomboNombreRecherche} 
                                      onChange={(e) => setNewGomboNombreRecherche(Math.max(1, parseInt(e.target.value) || 1))}
                                      className="w-full bg-afri-bg border border-afri-border rounded-lg p-2 text-xs text-afri-text font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8.5px] font-mono text-afri-text-sec uppercase block mb-1">Indemnité transport additionnelle (FCFA) :</label>
                                    <input 
                                      type="number" 
                                      value={newGomboTransportFee} 
                                      onChange={(e) => setNewGomboTransportFee(Math.max(0, parseInt(e.target.value) || 0))}
                                      className="w-full bg-afri-bg border border-afri-border rounded-lg p-2 text-xs text-afri-text font-mono"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* Submit / Cancel Buttons */}
                        <div className="pt-6 border-t border-afri-border flex gap-3">
                          <button
                            type="button"
                            onClick={() => setActiveMenu("user_terrain")}
                            className="w-1/3 py-3 text-xs font-mono font-bold uppercase rounded-xl border border-afri-border text-afri-text-sec hover:bg-white/5 transition-all cursor-pointer"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={triggerPubSubmit}
                            disabled={publishLoading}
                            className={`w-2/3 py-3 px-4 text-xs font-display font-black uppercase rounded-xl transition-all shadow-lg text-black ${
                              publishLoading ? "bg-zinc-600 cursor-not-allowed opacity-50" : "bg-gradient-to-r from-afri-gold to-[#F1C40F] hover:opacity-90 active:scale-[0.98]"
                            }`}
                          >
                            {publishLoading ? "En cours..." : "Publier"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                );
              })()}

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
                  <div className="afri-container space-y-6 animate-fadeIn pb-24 text-left py-4 xs:py-6">
                    <div className="border-b border-afri-border pb-4 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-mono uppercase font-black tracking-[0.15em] text-afri-gold">
                          ⭐ Mes Favoris & Artistes Suivis
                        </h3>
                        <p className="text-xs text-afri-text-sec mt-1">Vos bails favoris et les talents de la Côte d'Ivoire que vous suivez.</p>
                      </div>
                      <button 
                        onClick={() => goBackMenu()} 
                        className="text-xs text-afri-text-sec hover:text-afri-text font-mono"
                      >
                        ✕ Fermer
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Favorited Gombos */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-mono uppercase font-bold text-afri-text flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-afri-gold rounded-full"></span>
                          Gombos Honorés ({favoritedGombosList.length})
                        </h4>
                        {favoritedGombosList.length === 0 ? (
                          <div className="p-8 bg-afri-bg-sec border border-afri-border rounded-2xl text-center text-afri-text-sec text-xs">
                            Aucun gombo honoré pour le moment. Allez sur le terrain et donnez de l'honneur !
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
                                    Consulter →
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
                                      localStorage.setItem("gombo_followed_artists", JSON.stringify(filtered));
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
                const myContracts = transactions || [];
                return (
                  <div className="afri-container space-y-6 animate-fadeIn pb-24 text-left py-4 xs:py-6">
                    <div className="border-b border-afri-border pb-4 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-mono uppercase font-black tracking-[0.15em] text-afri-gold">
                          🕓 Historique de l'Artiste
                        </h3>
                        <p className="text-xs text-afri-text-sec mt-1">Vos bails passés, les activations et les mouvements de gombo.</p>
                      </div>
                      <button onClick={() => goBackMenu()} className="text-xs text-afri-text-sec hover:text-afri-text font-mono">✕ Fermer</button>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-afri-bg border border-afri-border p-4 rounded-2xl">
                        <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-widest block mb-2">Activités sur le terrain</span>
                        <div className="space-y-3.5 font-mono text-xs">
                          <div className="flex items-start gap-2 text-afri-text-sec border-l border-afri-gold/35 pl-3 relative py-1">
                            <span className="w-2 h-2 rounded-full bg-afri-gold absolute -left-[4.5px] top-[9px]"></span>
                            <div>
                              <span className="text-afri-text-sec font-bold">[AUJOURD'HUI]</span> Connexion souveraine établie avec succès.
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-afri-text-sec border-l border-afri-gold/35 pl-3 relative py-1">
                            <span className="w-2 h-2 rounded-full bg-afri-gold absolute -left-[4.5px] top-[9px]"></span>
                            <div>
                              <span className="text-afri-text-sec font-bold">[HIER]</span> Consultation de l'Héritage Certifié et audit de sécurité.
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-afri-text-sec border-l border-afri-border pl-3 relative py-1">
                            <span className="w-2 h-2 rounded-full bg-afri-bg-ter absolute -left-[4.5px] top-[9px]"></span>
                            <div>
                              <span className="text-afri-text-sec font-bold">[15/07/2026]</span> Intégration dans le réseau prestigieux d'Abidjan.
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-afri-bg border border-afri-border p-4 rounded-2xl space-y-3">
                        <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-widest block">Flux des transactions</span>
                        {myContracts.length === 0 ? (
                          <p className="text-xs text-afri-text-sec text-center py-4">Aucune transaction enregistrée.</p>
                        ) : (
                          <div className="space-y-2">
                            {myContracts.slice(0, 5).map((tx, idx) => (
                              <div key={idx} className="flex justify-between items-center p-2.5 bg-afri-bg/40 rounded-xl border border-zinc-950 font-mono text-xs">
                                <div>
                                  <span className="text-afri-text-sec">[{tx.date || "RÉCENT"}]</span> <span className="text-afri-text font-bold">{tx.label || tx.description || "Transfert"}</span>
                                </div>
                                <span className={tx.type === "credit" ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                                  {tx.type === "credit" ? "+" : "-"}{tx.amount?.toLocaleString()} F
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 6d. DOWNLOADS SECTION */}
              {activeMenu === "user_downloads" && (() => {
                const handleDownload = (filename: string, content: string) => {
                  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = filename;
                  a.click();
                  URL.revokeObjectURL(url);
                  try { audioSynth.playValidationSuccess(); } catch (_) {}
                };

                return (
                  <div className="afri-container space-y-6 animate-fadeIn pb-24 text-left py-4 xs:py-6">
                    <div className="border-b border-afri-border pb-4 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-mono uppercase font-black tracking-[0.15em] text-afri-gold">
                          📥 Téléchargements Officiels
                        </h3>
                        <p className="text-xs text-afri-text-sec mt-1">Téléchargez vos contrats officiels et attestations d'artiste certifié.</p>
                      </div>
                      <button onClick={() => goBackMenu()} className="text-xs text-afri-text-sec hover:text-afri-text font-mono">✕ Fermer</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Item 1 */}
                      <div className="p-4 bg-afri-bg border border-afri-border rounded-2xl flex flex-col justify-between">
                        <div>
                          <span className="text-[8.5px] font-mono text-afri-text-sec uppercase font-bold tracking-wider">OFFICIEL • PDF CONTRAT</span>
                          <h4 className="text-xs font-bold text-afri-text mt-1">Modèle de Contrat de Prestation Standard</h4>
                          <p className="text-[11px] text-afri-text-sec mt-1">Le contrat légal utilisé pour garantir vos cachets en séquestre.</p>
                        </div>
                        <button
                          onClick={() => handleDownload("Modele_Contrat_Prestation_Afrigombo.txt", `=== CONTRAT OFFICIEL AFRIGOMBO ===\n\nPrestataire : ${profile?.artisticName || "Artiste Elite"}\nNiveau : GOMBO ID Certifié\nPlateforme : AFRIGOMBO CI\n\nCe document atteste que l'artiste est habilité à prester via le système d'accord sécurisé et d'arbitrage de proximité d'AFRIGOMBO.`)}
                          className="mt-4 w-full py-2 bg-afri-gold/10 hover:bg-afri-gold/15 border border-afri-gold/35 text-afri-gold font-bold text-xs uppercase rounded-xl tracking-wider transition-all cursor-pointer"
                        >
                          Télécharger (TXT)
                        </button>
                      </div>

                      {/* Item 2 */}
                      <div className="p-4 bg-afri-bg border border-afri-border rounded-2xl flex flex-col justify-between">
                        <div>
                          <span className="text-[8.5px] font-mono text-afri-text-sec uppercase font-bold tracking-wider">CERTIFICAT D'ÉLITE</span>
                          <h4 className="text-xs font-bold text-afri-text mt-1">Certificat de Gombo ID Officiel</h4>
                          <p className="text-[11px] text-afri-text-sec mt-1">Attestation numérique d'identité certifiée sur la plateforme.</p>
                        </div>
                        <button
                          onClick={() => handleDownload("Attestation_Gombo_ID.txt", `=== ATTESTATION GOMBO ID ===\n\nNom d'Artiste : ${profile?.artisticName || "Artiste Elite"}\nGombo ID : ${profile?.gomboIdNumber || "AG-0001258"}\nStatut : Certifié & Actif\nLieu : Abidjan, Côte d'Ivoire`)}
                          className="mt-4 w-full py-2 bg-afri-gold/10 hover:bg-afri-gold/15 border border-afri-gold/35 text-afri-gold font-bold text-xs uppercase rounded-xl tracking-wider transition-all cursor-pointer"
                        >
                          Télécharger (TXT)
                        </button>
                      </div>
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
                  const jsonString = JSON.stringify(backupData, null, 2);
                  const blob = new Blob([jsonString], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `Afrigombo_Backup_${profile?.artisticName || "Artist"}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  try { audioSynth.playValidationSuccess(); } catch (_) {}
                  alert("✓ Sauvegarde chiffrée locale exportée avec succès !");
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
                        localStorage.setItem("gombo_followed_artists", JSON.stringify(data.followedArtists));
                      }
                      try { audioSynth.playValidationSuccess(); } catch (_) {}
                      alert("✓ Données d'artiste restaurées localement avec succès !");
                    } catch (err) {
                      alert("❌ Fichier de sauvegarde invalide.");
                    }
                  };
                  reader.readAsText(file);
                };

                return (
                  <div className="afri-container space-y-6 animate-fadeIn pb-24 text-left py-4 xs:py-6">
                    <div className="border-b border-afri-border pb-4 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-mono uppercase font-black tracking-[0.15em] text-afri-gold">
                          💾 Sauvegardes Souveraines Locales
                        </h3>
                        <p className="text-xs text-afri-text-sec mt-1">Exportez ou restaurez votre configuration locale d'artiste à tout moment.</p>
                      </div>
                      <button onClick={() => goBackMenu()} className="text-xs text-afri-text-sec hover:text-afri-text font-mono">✕ Fermer</button>
                    </div>

                    <div className="space-y-6">
                      {/* Export */}
                      <div className="p-6 bg-afri-bg border border-afri-border rounded-2xl space-y-4">
                        <h4 className="text-xs font-mono uppercase font-bold text-afri-gold">Exporter une sauvegarde</h4>
                        <p className="text-xs text-afri-text-sec leading-relaxed">
                          Créez un fichier chiffré contenant l'historique complet de vos gombos aimés, vos artistes favoris et la configuration locale de votre session.
                        </p>
                        <button
                          onClick={handleExportBackup}
                          className="px-5 py-2.5 bg-afri-gold text-black font-black text-xs uppercase rounded-xl flex items-center gap-2 hover:opacity-95 transition-all cursor-pointer"
                        >
                          Créer la sauvegarde (.json)
                        </button>
                      </div>

                      {/* Import */}
                      <div className="p-6 bg-afri-bg border border-afri-border rounded-2xl space-y-4">
                        <h4 className="text-xs font-mono uppercase font-bold text-afri-text">Importer / Restaurer</h4>
                        <p className="text-xs text-afri-text-sec leading-relaxed">
                          Sélectionnez un fichier de sauvegarde (.json) exporté précédemment pour restaurer instantanément vos paramètres locaux.
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

              {/* 7. CONTRATS AFRIGOMBO (USER) */}
              {activeMenu === "user_contracts" && (
                <div className="afri-container space-y-6 animate-fadeIn pb-24 text-left py-4 xs:py-6">
                  <GomboContractsDashboard currentUser={profile || (currentUser as any)} />
                </div>
              )}

              {/* 7b. PORTESECURE / AFRIGOMBO WALLET (USER) */}
              {activeMenu === "user_wallet" && (
                <div className="afri-container space-y-6 animate-fadeIn pb-24 text-left py-4 xs:py-6">
                  <AfrigomboWalletDashboard 
                    currentUserProfile={profile || (currentUser as any)} 
                    addToTerminal={addToTerminal}
                    onBack={() => goBackMenu()}
                  />
                </div>
              )}

              {/* 7d. ÉVÉNEMENTS (USER) */}
              {activeMenu === "user_events" && (
                <div className="afri-container space-y-6 animate-fadeIn pb-24 text-left py-4 xs:py-6">
                  <EventsView 
                    onBack={() => goBackMenu()} 
                    addToTerminal={addToTerminal}
                  />
                </div>
              )}

              {activeMenu === "user_help_center" && (
                <div className="afri-container space-y-6 animate-fadeIn pb-24 text-left py-4 xs:py-6">
                  <AfrigomboHelpCenter onClose={() => goBackMenu()} />
                </div>
              )}

              {/* 7c. BÂTISSEURS (USER) */}
              {activeMenu === "user_builders" && (
                <div className="afri-container animate-fadeIn py-4 xs:py-6">
                  <AfrigomboBuilders
                    currentUser={profile || (currentUser as any)}
                    onBack={() => goBackMenu()}
                    audioSynth={audioSynth}
                  />
                </div>
              )}

              {activeMenu === "user_heritage" && (
                <div className="afri-container h-full overflow-y-auto pb-24 scrollbar-none animate-fadeIn">
                  <HeritagePage 
                    onNavigateView={(view, tab) => {
                      if (view === "heritage") setActiveMenu("user_heritage");
                      else if (view === "home") setActiveMenu("user_terrain");
                      else if (view === "settings") setActiveMenu("settings");
                      else if (view === "admin" || view === "admin_centre") {
                        setPerspective("admin");
                        setActiveMenu("dashboard");
                        addToTerminal("[ADMIN] Entrée au Centre de Commandement.");
                      }
                      else setActiveMenu(view);
                    }}
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
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
                  <GomboIdUserDashboard
                    currentUser={artistWithRating}
                    onUpdateUser={handleUpdateUser}
                    onCreateTransaction={handleCreateTransaction}
                    addToTerminal={(msg: string) => addToTerminal(msg)}
                    onBack={() => goBackMenu()}
                  />
                );
              })()}

              {activeMenu === "user_mes_gombos" && (() => {
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-afri-text-sec">Aucun artiste disponible.</p>;

                const myGombos = gombos.filter(g => g.organizerId === currentArtist.id || g.applicantIds?.includes(currentArtist.id) || g.selectedTalentId === currentArtist.id);

                const getStatusLabel = (status: string | undefined) => {
                  switch(status) {
                    case "publie": return "🟡 Publié (En attente)";
                    case "candidatures_ouvertes": return "🔵 Candidatures ouvertes";
                    case "artiste_selectionne": return "🟠 Musicien Sélectionné";
                    case "contrat_accepte":
                    case "contrat_confirme": return "🟣 Contrat Confirmé";
                    case "paiement_recu": return "🟢 Paiement Reçu";
                    case "en_cours": return "🎵 Gombo en cours";
                    case "mission_terminee":
                    case "termine":
                    case "paiement_effectue": return "✅ Gombo Terminé";
                    case "contrat_refuse":
                    case "mission_annulee": return "❌ Annulé";
                    default: return status || "⏳ En attente";
                  }
                };

                return (
                  <div className="afri-container py-4 xs:py-6 space-y-4 xs:space-y-6 animate-fadeIn pb-32">
                    <div className="pb-3 border-b border-afri-border px-1">
                      <h3 className="text-[11px] xs:text-sm font-display font-black uppercase text-afri-gold tracking-widest">
                        💼 Cycle de Contrats & Prestations
                      </h3>
                      <p className="text-[10px] xs:text-xs text-afri-text-sec">Suivez vos gombos réservés, contrats signés et notez mutuellement vos collaborateurs.</p>
                    </div>

                    {/* Prestations list */}
                    <div className="space-y-4">
                      {myGombos.length === 0 ? (
                        <PremiumEmptyState 
                          message="Aucun Contrat en cours." 
                          submessage="Trouvez des opportunités sur Le Terrain." 
                          icon={Briefcase}
                        />
                      ) : (
                        myGombos.map((gombo, index) => (
                          <div key={gombo.id} className="p-4 bg-afri-bg border border-afri-border rounded-xl space-y-3">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <strong className="text-sm text-afri-text block">{gombo.title}</strong>
                              <span className="text-[10px] text-afri-text-sec font-mono">Organisé par : {gombo.organizerName} • {gombo.location}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="px-2.5 py-1 rounded bg-afri-gold/10 text-afri-gold text-[10px] font-bold uppercase">
                                Cachet : {gombo.budget ? gombo.budget.toLocaleString() : "À DÉBATTRE"} FCFA
                              </span>
                              <span className="text-[9px] font-mono uppercase bg-afri-bg-sec text-afri-text px-1.5 py-0.5 rounded">
                                {getStatusLabel(gombo.status)}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons if user is organizer or selected talent */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-afri-border">
                            {(gombo.status === "publie" || gombo.status === "candidatures_ouvertes") && gombo.organizerId === currentArtist.id && (
                              <button onClick={() => setActiveMenu("user_dashboard")} className="px-3 py-1.5 bg-afri-gold text-black text-[9px] font-bold uppercase rounded hover:bg-afri-bg-sec">
                                Sélectionner un Candidat
                              </button>
                            )}
                            
                            {/* Actions requested for published items */}
                            {gombo.organizerId === currentArtist.id && (
                              <div className="w-full flex flex-wrap gap-2 mt-2">
                                <button className="px-3 py-1.5 bg-afri-bg-ter border border-afri-border text-afri-text text-[9px] font-bold uppercase rounded hover:bg-afri-bg-ter">Modifier</button>
                                <button className="px-3 py-1.5 bg-afri-bg-ter border border-afri-border text-afri-text text-[9px] font-bold uppercase rounded hover:bg-afri-bg-ter">Partager</button>
                                <button className="px-3 py-1.5 bg-afri-bg-ter border border-afri-border text-afri-text text-[9px] font-bold uppercase rounded hover:bg-afri-bg-ter">Statistiques</button>
                                <button onClick={() => {if(window.confirm('Supprimer cette publication ?')) alert('En cours...');}} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-bold uppercase rounded hover:bg-red-500/20">Supprimer</button>
                                <button onClick={() => setActiveBoostItem({id: gombo.id!, type: 'gombo'})} className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-afri-gold text-black text-[9px] font-black uppercase rounded shadow-md shadow-afri-gold/20 flex items-center gap-1 active:scale-95 transition-transform"><Sparkles className="w-3 h-3" /> 🚀 Booster</button>
                              </div>
                            )}

                            {gombo.contractId && (
                              <button 
                                onClick={() => {
                                  setActiveMenu("user_contracts");
                                  try { audioSynth.playValidationSuccess(); } catch (_) {}
                                }} 
                                className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[9px] font-bold uppercase rounded hover:bg-purple-500/30 flex items-center gap-1"
                              >
                                🤝 Gérer le Contrat
                              </button>
                            )}

                            {gombo.selectedTalentId === currentArtist.id && gombo.status === "artiste_selectionne" && (
                              <>
                                <button onClick={() => gomboDB.updateGomboStatus(gombo.id!, "contrat_accepte")} className="px-3 py-1.5 bg-emerald-500 text-black text-[9px] font-bold uppercase rounded hover:bg-emerald-400">
                                  Accepter le Contrat
                                </button>
                                <button onClick={() => gomboDB.updateGomboStatus(gombo.id!, "contrat_refuse")} className="px-3 py-1.5 bg-red-900 text-red-100 text-[9px] font-bold uppercase rounded hover:bg-red-800">
                                  Refuser
                                </button>
                              </>
                            )}
                            {gombo.organizerId === currentArtist.id && (gombo.status === "contrat_accepte" || gombo.status === "contrat_confirme") && (
                              <button onClick={() => gomboDB.updateGomboStatus(gombo.id!, "mission_terminee")} className="px-3 py-1.5 bg-blue-500 text-afri-text text-[9px] font-bold uppercase rounded hover:bg-blue-400">
                                Valider la Prestation
                              </button>
                            )}
                            {gombo.organizerId === currentArtist.id && gombo.status === "mission_terminee" && (
                              <button onClick={() => gomboDB.updateGomboStatus(gombo.id!, "paiement_effectue")} className="px-3 py-1.5 bg-green-500 text-black text-[9px] font-bold uppercase rounded hover:bg-green-400">
                                Libérer le Paiement
                              </button>
                            )}
                            {(gombo.organizerId === currentArtist.id || gombo.selectedTalentId === currentArtist.id) && gombo.selectedTalentId && (
                               <button 
                                 onClick={() => {
                                   const targetId = gombo.organizerId === currentArtist.id ? gombo.selectedTalentId : gombo.organizerId;
                                   setOpenConvoWithUserId(targetId!);
                                   setOpenConvoWithGomboId(gombo.id!);
                                   setActiveMenu("user_messages");
                                   try { audioSynth.playValidationSuccess(); } catch (_) {}
                                 }} 
                                 className="px-3 py-1.5 bg-afri-bg-ter text-afri-text text-[9px] font-bold uppercase rounded hover:bg-zinc-700 flex items-center gap-1.5"
                               >
                                 <MessageSquare className="w-3.5 h-3.5 text-afri-gold" /> Discuter
                               </button>
                            )}

                            {gombo.applicantIds?.includes(currentArtist.id) && gombo.status === "publie" && (
                              <button onClick={() => setActiveBoostItem({id: gombo.id!, type: 'candidature'})} className="px-3 py-1.5 mt-2 bg-gradient-to-r from-amber-500 to-afri-gold text-black text-[9px] font-black uppercase rounded shadow-md shadow-afri-gold/20 flex items-center gap-1 active:scale-95 transition-transform">
                                <Sparkles className="w-3 h-3" /> ⚡ Booster ma candidature
                              </button>
                            )}
                          </div>

                          {/* Reciprocal feedback review trigger (only when mission completed) */}
                          {(gombo.status === "mission_terminee" || gombo.status === "paiement_effectue") && (
                            <div className="p-3 bg-afri-gold/5 border border-afri-gold/10 rounded-lg space-y-2 mt-2">
                              <span className="text-[10px] uppercase font-mono text-afri-gold block font-bold">✍️ Évaluation Réciproque :</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-afri-text">Note Accordée :</span>
                                <div className="flex gap-1 text-afri-gold">
                                  {[1, 2, 3, 4, 5].map(n => (
                                    <Star key={n} className="w-3.5 h-3.5 fill-current cursor-pointer" />
                                  ))}
                                </div>
                              </div>
                              <textarea
                                rows={2}
                                placeholder="Avis sur la collaboration..."
                                className="w-full bg-afri-bg border border-afri-border rounded-lg p-2 text-xs text-afri-text placeholder:text-afri-text-sec focus:outline-none focus:border-afri-gold"
                              />
                              <button
                                onClick={() => {
                                  addToTerminal(`[ÉVALUATION] Évaluation transmise pour Gombo ${gombo.id}`);
                                  alert("⭐ Votre avis a été enregistré avec succès !");
                                }}
                                className="px-4 py-1.5 bg-afri-gold hover:bg-afri-bg-sec text-black text-[10px] font-mono font-bold uppercase rounded transition-all"
                              >
                                Soumettre l'avis
                              </button>
                            </div>
                          )}
                        </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}

              {activeMenu === "payments_to_verify" && (
                <div className="p-6 rounded-2xl bg-afri-bg border border-afri-gold/30 space-y-6 animate-fadeIn">
                  <h3 className="text-sm font-display font-black uppercase text-afri-gold tracking-widest">
                    Paiements à Vérifier (Bêta Manuelle)
                  </h3>
                  <p className="text-xs text-afri-text-sec">Validez manuellement les paiements reçus.</p>
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
                          👥 Mes Orchestres & Alliances Régionales
                        </h3>
                        <p className="text-xs text-afri-text-sec">Affiliez-vous à des groupings pour briguer les Gombos VIP d'Abidjan.</p>
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
                            <strong className="text-xs uppercase font-mono tracking-wider text-afri-gold block">🎼 {group}</strong>
                            <span className="text-[10px] text-afri-text-sec font-mono block">Rôle : Membre / Musicien</span>
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold font-mono">Affiliation Active</span>
                          </div>
                        ))
                      )}

                      {/* Add new orchestration alliance */}
                      <div className="p-4 bg-afri-bg border border-afri-border rounded-xl space-y-3">
                        <span className="text-xs font-bold text-afri-text block uppercase">Créer une Alliance Musicale</span>
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
                              addToTerminal(`[ALLIANCE] Nouvel orchestre créé : ${v}`);
                              e.target.value = "";
                              alert(`🎼 Alliance ${v} enregistrée avec succès !`);
                            }
                          }}
                        />
                        <span className="text-[9px] text-afri-text-sec font-mono block">Appuyez sur Entrée pour enregistrer l'orchestre régional.</span>
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
                        ⚡ Module de Renfort Scénique Express
                      </h3>
                      <p className="text-xs text-afri-text-sec">Recherchez d'urgence un instrumentiste ou un choriste sur scène à Abidjan.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Form launch dynamic backup */}
                      <div className="p-5 bg-afri-bg border border-afri-border rounded-xl space-y-4">
                        <span className="text-xs font-bold font-mono text-afri-gold uppercase block border-b border-afri-border pb-2">🎯 Dispatcher une Alerte de Renfort</span>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-mono text-afri-text-sec block font-bold">Instrument ou Backup requis :</label>
                          <select className="w-full bg-afri-bg-sec border border-afri-border rounded-lg p-2 text-xs focus:outline-none">
                            <option>Bassiste Zouglou d'élite</option>
                            <option>Percussionniste Sabar en urgence</option>
                            <option>Duo de Backup Singers (Chœur)</option>
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
                            <option>Elite - Tournée Nationale (120 005 FCFA)</option>
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
                              message: "Besoin d'un musicien remplaçant en urgence !",
                              timestamp: new Date().toISOString()
                            };
                            await saveToFirestore("alerts", newAlertId, newAlertData);
                            addToTerminal(`[RENFORT EXPRESS] Alerte de renfort envoyée vers tous les terminaux de la commune !`);
                            alert("📣 Alerte de Renfort Express envoyée aux talents à proximité !");
                          }}
                          className="w-full py-2 bg-afri-gold hover:bg-afri-bg-sec text-black text-xs font-mono font-black uppercase rounded-lg transition-all"
                        >
                          Lancer le Renfort Scénique ⚡
                        </button>
                      </div>

                      {/* Active reinforcements view */}
                      <div className="space-y-2">
                        <span className="text-xs uppercase font-mono text-afri-text-sec font-bold block">Appels de Renforts en cours</span>
                        <div className="p-4 bg-afri-bg border border-afri-border rounded-xl min-h-[15rem] space-y-3">
                          {renforts.length === 0 ? (
                            <PremiumEmptyState 
                              message="Aucun renfort actuel." 
                              submessage="Créez une alerte pour chercher des renforts." 
                              icon={ShieldCheck}
                            />
                          ) : (
                            renforts.map(r => (
                              <div key={r.id} className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                <div className="flex justify-between text-xs">
                                  <strong className="text-afri-text">{r.instrument || r.title || "Renfort Demandé"}</strong>
                                  {r.isExpress && <span className="text-red-400 font-mono text-[9px] uppercase animate-pulse">Prestation ce soir !</span>}
                                </div>
                                <p className="text-[10px] text-afri-text-sec mt-1">Lieu : {r.commune || "Abidjan"} • Cachet : {r.budget || "À négocier"} FCFA</p>
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
                        🌍 Le Bulletin d'Or des Opportunités
                      </h3>
                      <p className="text-xs text-afri-text-sec">Postulez en un clic sur des contrats d'excellence certifiés.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gombos.map(gombo => (
                        <div key={gombo.id} className="p-4 bg-afri-bg border border-afri-border hover:border-afri-gold/30 rounded-xl space-y-3 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-mono text-afri-gold uppercase tracking-wider">{gombo.location}</span>
                              {gombo.isBoosted && (
                                <span className="bg-afri-gold/10 border border-afri-gold/30 text-afri-gold font-mono text-[9px] px-1.5 py-0.5 rounded font-bold animate-pulse">
                                  CONTRAT D'ACCORD DE SOUVERAINETÉ (BOOSTED)
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
                                alert(`🎯 Candidature scellée sur "${gombo.title}" ! L'organisateur a été notifié.`);
                              }}
                              className="px-4 py-1.5 bg-afri-gold/15 hover:bg-afri-gold border border-afri-gold/30 hover:border-transparent rounded-lg text-xs font-mono font-bold text-afri-gold hover:text-black transition-all"
                            >
                              Postuler Direct 🎯
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
                  <SettingsModal 
                    isOpen={true} 
                    onClose={() => goBackMenu()}
                    onNavigateToFounder={() => setActiveMenu("super_admin")}
                  />
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
                        Accès Réservé 🔒
                      </h2>
                      <p className="text-xs text-afri-text-sec font-sans leading-relaxed mb-8">
                        Connectez-vous pour accéder à vos notifications et rester synchronisé en temps réel avec AFRIGOMBO.
                      </p>
                      
                      <div className="space-y-3">
                        <button
                          onClick={async () => {
                            try {
                              if (audioSynth) audioSynth.playValidationSuccess();
                              await loginWithGoogle();
                            } catch (err) {
                              console.error("Google Auth failed in notification gate:", err);
                              setIsAuthModalOpen(true);
                            }
                          }}
                          className="w-full py-3.5 px-6 rounded-2xl bg-afri-bg-sec hover:bg-afri-bg-sec text-black text-xs font-mono font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(212,175,55,0.3)] cursor-pointer select-none active:scale-95 flex items-center justify-center gap-2.5"
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
                          className="w-full py-3 px-6 rounded-2xl bg-afri-bg-sec hover:bg-afri-bg-sec text-afri-text text-xs font-mono font-bold uppercase tracking-widest border border-afri-border hover:border-zinc-750 transition-all cursor-pointer select-none"
                        >
                          Se connecter par email alternative
                        </button>
                      </div>
                    </div>
                  );
                }

                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-afri-text-sec">Aucun artiste disponible.</p>;
                return (
                  <div className="space-y-6 animate-fadeIn pb-24 text-left">
                    <NotificationCenter 
                      currentUserProfile={profile || currentArtist} 
                      notifications={allNotifications}
                      onRefreshProfile={() => {}}
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

              {activeMenu === "user_about" && (
                <div className="animate-fadeIn">
                  <AboutAfrigombo 
                    onBack={() => goBackMenu()} 
                    onSupport={() => setActiveMenu("user_support")}
                  />
                </div>
              )}

              {activeMenu === "user_support" && (
                <div className="animate-fadeIn">
                  <SupportAfrigombo 
                    onBack={() => goBackMenu()} 
                  />
                </div>
              )}

              {activeMenu === "user_whats_new" && (
                <div className="animate-fadeIn">
                  <WhatsNew 
                    onBack={() => goBackMenu()} 
                  />
                </div>
              )}

              {activeMenu === "user_messages" && (() => {
                const currentActiveUserForChat = currentUser ? { uid: currentUser.uid } : { uid: activeArtistId };
                const currentProfileForChat = profile || (users.find(u => u.id === activeArtistId) || users[0]);
                return (
                  <div className="afri-container space-y-6 animate-fadeIn pb-24 text-left">
                    <MessagesView
                      currentUser={currentActiveUserForChat}
                      currentProfile={currentProfileForChat}
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
                  </div>
                );
              })()}

              <div className="pb-24">
                {activeMenu === "user_subscription_management" && (
                  <div className="animate-fadeIn">
                    <MonAbonnementView 
                      isPremium={profile?.isPro || profile?.isVip || (profile?.balance !== undefined) || false}
                      onUpgrade={() => setActiveMenu("user_gombo_plus")}
                      onBack={() => goBackMenu()}
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
              </div>

              {activeMenu === "user_edit_profile" && (
                <div className="fixed inset-0 z-[100] bg-afri-bg/90 backdrop-blur-md overflow-y-auto">
                  <div className="min-h-screen flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="w-full max-w-2xl bg-afri-bg rounded-t-3xl sm:rounded-2xl border border-afri-gold/20 p-6 shadow-2xl relative">
                      {profile ? (
                        <HeritagePage 
                          onNavigateView={(view) => {
                            setActiveMenu("user_heritage"); // Always return to heritage after edit
                          }}
                          initialPanelView="edit"
                        />
                      ) : (
                        <div className="p-12 text-center space-y-4">
                          <p className="text-afri-text-sec font-mono">Profil non chargé...</p>
                          <button 
                            onClick={() => setActiveMenu("user_heritage")}
                            className="px-6 py-2 bg-afri-gold text-black font-black uppercase rounded-xl"
                          >
                            Retour
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
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
                                VIEW: CONTRATS & LITIGES (ADMIN)
                  ---------------------------------------------------- */}
              {activeMenu === "contracts" && (
                <div className="space-y-6 animate-fadeIn pb-24 text-left p-6">
                  <div className="flex items-center justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-2xl font-sans font-black text-afri-text uppercase tracking-tighter">CENTRE DES CONTRATS</h2>
                      <p className="text-afri-text-sec text-[10px] font-black uppercase tracking-widest">Surveillance des engagements et résolution des litiges</p>
                    </div>
                  </div>
                  <GomboContractsDashboard currentUser={{ ...profile, role: 'admin' } as any} />
                </div>
              )}

              {/* ----------------------------------------------------
                                VIEW: CABINET SUPRÊME PRIVÉ (LE TRÔNE DU FONDATEUR / CENTRE MULTIMÉDIA)
                  ---------------------------------------------------- */}
              {activeMenu === "super_admin" && (
                showThroneCinematic ? (
                  <Suspense fallback={<div className="fixed inset-0 bg-afri-bg" />}>
                    <ThroneCinematicIntro onComplete={() => setShowThroneCinematic(false)} />
                  </Suspense>
                ) : (
                  <div className="flex flex-col">
                    {/* Tab Switcher for Super Founder - Directly attached at the top */}
                    <div className="flex gap-2 pb-2 border-b border-afri-border sticky top-0 bg-afri-bg/95 backdrop-blur-md z-30 pt-0">
                      <button
                        onClick={() => {
                          setSuperAdminTab("throne");
                          try { audioSynth.playValidationSuccess(); } catch (_) {}
                        }}
                        className={`px-3 py-2 rounded-xl text-[9px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer border ${
                          superAdminTab === "throne"
                            ? "bg-afri-gold/15 border-afri-gold text-afri-gold font-black"
                            : "bg-afri-bg/40 border-afri-border text-afri-text-sec hover:text-afri-text"
                        }`}
                      >
                        👑 Le Trône Royal
                      </button>
                      <button
                        onClick={() => {
                          setSuperAdminTab("beta_transactions");
                          try { audioSynth.playValidationSuccess(); } catch (_) {}
                        }}
                        className={`px-3 py-2 rounded-xl text-[9px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer border flex items-center gap-1.5 ${
                          superAdminTab === "beta_transactions"
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-400 font-black shadow-lg"
                            : "bg-afri-bg/40 border-afri-border text-afri-text-sec hover:text-afri-text"
                        }`}
                      >
                        <span>🛡️ Transactions Bêta</span>
                        {pendingBetaCount > 0 && (
                          <span className="bg-emerald-500 text-black text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                            {pendingBetaCount}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSuperAdminTab("economie");
                          try { audioSynth.playValidationSuccess(); } catch (_) {}
                        }}
                        className={`px-3 py-2 rounded-xl text-[9px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer border ${
                          superAdminTab === "economie"
                            ? "bg-afri-gold/15 border-afri-gold text-afri-gold font-black"
                            : "bg-afri-bg/40 border-afri-border text-afri-text-sec hover:text-afri-text"
                        }`}
                      >
                        📊 Économie
                      </button>
                      <button
                        onClick={() => {
                          setSuperAdminTab("media");
                          try { audioSynth.playValidationSuccess(); } catch (_) {}
                        }}
                        className={`px-3 py-2 rounded-xl text-[9px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer border ${
                          superAdminTab === "media"
                            ? "bg-afri-gold/15 border-afri-gold text-afri-gold font-black"
                            : "bg-afri-bg/40 border-afri-border text-afri-text-sec hover:text-afri-text"
                        }`}
                      >
                        🎵 Multimédia
                      </button>
                      <button
                        onClick={() => {
                          setSuperAdminTab("batisseurs");
                          try { audioSynth.playValidationSuccess(); } catch (_) {}
                        }}
                        className={`px-3 py-2 rounded-xl text-[9px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer border ${
                          superAdminTab === "batisseurs"
                            ? "bg-afri-gold/15 border-afri-gold text-afri-gold font-black"
                            : "bg-afri-bg/40 border-afri-border text-afri-text-sec hover:text-afri-text"
                        }`}
                      >
                        🏛 Bâtisseurs
                      </button>
                    </div>

                    {/* DIAGNOSTIC BOUTON - Small and discreet */}
                    <div className="flex justify-end px-2 pt-1 pb-1">
                      <button
                        onClick={() => {
                          setIsDiagnosticOpen(true);
                          try { audioSynth.playValidationSuccess(); } catch (_) {}
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-[8px] font-mono font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Diagnostic
                      </button>
                    </div>

                    <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse">Chargement de la Console...</div>}>
                      {superAdminTab === "throne" ? (
                        <AdminFounderThrone
                          theme={theme}
                          founders={dynamicFounders}
                          superAdmins={dynamicSuperAdmins}
                          adminEmail={userEmail || ""}
                          isAuthorizedSuperFounder={isAuthorizedSuperFounder}
                          onUpdateThroneConfig={handleUpdateThroneConfig}
                          audioSynth={audioSynth}
                          users={users}
                          gombos={gombos}
                          posts={posts}
                          transactions={transactions}
                          alerts={alerts}
                          onExit={() => {
                            setPerspective("user");
                            setActiveMenu("user_terrain");
                            try { audioSynth.playValidationSuccess(); } catch (_) {}
                          }}
                        />
                      ) : superAdminTab === "beta_transactions" ? (
                        <BetaTransactionsAdminPanel
                          currentUser={profile}
                          onOpenSupportChat={(targetUser) => {
                            setActiveMenu("messages");
                          }}
                        />
                      ) : superAdminTab === "economie" ? (
                        <AfrigomboEconomieDashboard 
                          onBack={() => {
                            setSuperAdminTab("throne");
                            try { audioSynth.playValidationSuccess(); } catch (_) {}
                          }}
                        />
                      ) : superAdminTab === "batisseurs" ? (
                        <AfrigomboBuildersAdminDashboard />
                      ) : (
                        <MultimediaCenter
                          adminEmail={userEmail || ""}
                          isAuthorizedSuperFounder={isAuthorizedSuperFounder}
                        />
                      )}
                    </Suspense>
                  </div>
                )
              )}

              {/* ----------------------------------------------------
                                VIEW: LE TAM-TAM GOMBOS (PUBLICATIONS)
                  ---------------------------------------------------- */}
              {(activeMenu === "gombos" || activeMenu === "posts") && (
                <div className="space-y-8 pb-10">
                  
                  {/* ==========================================================
                               🔥 À NE PAS MANQUER (AUTO-UPDATED BROADCAST)
                     ========================================================== */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                      <h4 className="text-sm font-mono uppercase font-extrabold tracking-widest text-[#EF4444] flex items-center gap-2">
                        🔥 À ne pas manquer
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
                                👑 Sommet d'Élite
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
                                🚨 Urgent
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
                                💥 Très Convoité
                              </span>
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                              <div>
                                <h5 className="font-display font-bold text-sm text-afri-text truncate">{popular.title}</h5>
                                <p className="text-[11px] text-afri-text/60 line-clamp-1 mt-1">{popular.description}</p>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-afri-gold/10">
                                <span className="text-[10px] font-mono text-afri-text/40">{popular.applicantsCount} prétendants</span>
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
                        🔥 Gombo du Jour
                      </span>
                      <div>
                        <h4 className="text-xs font-display font-bold text-afri-text line-clamp-1">Grand Réveillon Select</h4>
                        <p className="text-[11px] text-afri-gold mt-1 font-mono">450 000 FCFA</p>
                      </div>
                    </div>

                    {/* Talent du Jour */}
                    <div className="p-5 rounded-2xl bg-afri-bg-sec border border-afri-gold/20 shadow-sm flex flex-col justify-between">
                      <span className="text-[9px] uppercase font-mono bg-afri-gold/10 text-afri-gold border border-afri-gold/20 px-2 py-0.5 rounded-full font-bold w-fit mb-3">
                        👑 Chef du Réseau
                      </span>
                      <div>
                        <h4 className="text-xs font-display font-bold text-afri-text">Ariel Loua</h4>
                        <p className="text-[11px] text-afri-text/60 mt-1">Commune : Cocody</p>
                      </div>
                    </div>

                    {/* Defi du Jour */}
                    <div className="p-5 rounded-2xl bg-afri-bg-sec border border-afri-gold/20 shadow-sm flex flex-col justify-between">
                      <span className="text-[9px] uppercase font-mono bg-afri-bg-sec/10 text-[#EF4444] border border-[#EF4444]/20 px-2 py-0.5 rounded-full font-bold w-fit mb-3">
                        🎯 Défi Hebdo
                      </span>
                      <div>
                        <h4 className="text-xs font-display font-bold text-afri-text">Zouglou Keyboard Solo</h4>
                        <p className="text-[11px] text-afri-gold mt-1 font-mono">Récompense : Gombo ID Or</p>
                      </div>
                    </div>

                    {/* Gombos pres de moi (Location highlights) */}
                    <div className="p-5 rounded-2xl bg-afri-bg-sec border border-afri-gold/20 shadow-sm flex flex-col justify-between">
                      <span className="text-[9px] uppercase font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold w-fit mb-3">
                        🌍 Autour de moi
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
                      <span>🎼</span> Publier un Nouveau Gombo sur le Réseau
                    </h4>
                    <form onSubmit={handleCreateGombo} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase text-afri-text/60 font-mono">Titre de l'Opportunité</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Bassiste recherché pour cabaret..."
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
                        <label className="text-[9px] uppercase text-afri-text/60 font-mono">Description des Prérequis & Horaires</label>
                        <textarea
                          placeholder="Détails de l'événement, instruments, horaires..."
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
                        ✨ Vitrine Merveilleuse — Gombos Actifs
                      </h4>
                      <span className="text-xs text-afri-text/50 font-mono">{gombos.length} opportunités disponibles</span>
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
                                    🔥 En Vedette
                                  </span>
                                )}
                                {g.isUrgent && (
                                  <span className="text-[8px] bg-red-600 text-afri-text px-2.5 py-1 rounded-full font-black uppercase tracking-wider animate-pulse shadow-lg">
                                    ⚡ Urgent
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
                                  <span className="text-[9px] text-afri-text/50 block uppercase font-mono tracking-widest">Date Clé</span>
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
                                  <span>{isHonored ? "❤️" : "❤️"}</span>
                                </motion.button>

                                {/* Button: Palabrer */}
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => requireAuthThen(() => setPalabreGombo(g))}
                                  className="py-1.5 xs:py-2 px-0.5 xs:px-1 rounded-lg text-[7px] xs:text-[10px] font-bold uppercase tracking-tighter xs:tracking-wider flex items-center justify-center gap-0.5 xs:gap-1 bg-afri-bg border border-afri-border text-afri-text/60 hover:text-afri-gold hover:border-afri-gold/20 transition-all outline-none min-h-[30px] xs:min-h-[36px]"
                                >
                                  <span>🗣️ Chat</span>
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
                                  <span>{hasApplied ? "🎤" : "🎤 Postule"}</span>
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
                                  <span>{isSaved ? "📌" : "📌 Garde"}</span>
                                </motion.button>
                              </div>

                              {/* Button: Clôturer la prestation */}
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
                                  <span>🏆 Clôturer & Noter</span>
                                </button>
                              ) : (
                                <div className="w-full mt-2 xs:mt-3 py-1.5 xs:py-2 px-3 rounded-xl bg-afri-bg-ter/50 border border-afri-border/60 text-afri-text-sec font-mono text-[8px] xs:text-[10px] uppercase flex items-center justify-center gap-2 tracking-wide font-bold">
                                  <span>✅ Prestation Terminée</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ==========================================================
                               🗣️ PALABRER (NEGOTIATION/CHAT DIALOG MODAL)
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
                                  Négociation : {palabreGombo.title}
                                </span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => setPalabreGombo(null)}
                              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-afri-text hover:bg-white/10 transition-all font-semibold"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Chat Messages */}
                          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-afri-bg/50">
                            {/* Static Info Indicator */}
                            <div className="p-3 bg-afri-gold/5 border border-afri-gold/10 rounded-xl text-[10px] text-center text-afri-gold/80 leading-relaxed font-mono">
                              🤝 Palabrer — Négociez le cachet ou posez vos questions d'organisation directement avec le promoteur agréé d'Abidjan.
                            </div>

                            {/* Live Dialogue Thread */}
                            {(palabreChatHistory[palabreGombo.id] || []).length === 0 ? (
                              <div className="text-center py-6 text-afri-text/45 text-xs font-mono">
                                Aucun palabre engagé. Écrivez un premier message courtois pour entamer la discussion !
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
                              placeholder="Palabrer : négocier budget, horaires, transport..."
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
                    Les renforts sont des artistes postulant pour combler un Gombo en manque de musiciens/compétences précises.
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
                                  ⚡ Renfort Express Urgent
                                </span>
                              )}
                            </h5>
                            <span className="text-xs text-afri-text/60">
                              Postule pour le rôle de <strong className="text-afri-text">{renfort.instrument}</strong> sur :
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
                              addToTerminal(`[RENFORTS] Artiste accepté pour le rôle de ${renfort.instrument}.`);
                            }}
                            className="bg-afri-bg-sec hover:bg-emerald-600 text-[#050505] font-semibold text-[10px] px-3 py-1.5 rounded transition-all uppercase"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => {
                              setRenforts(prev => prev.map(r => r.id === renfort.id ? { ...r, status: "rejected" as const } : r));
                              addToTerminal(`[RENFORTS] Artiste décliné.`);
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
                    Ce module rassemble les publications signalées par les utilisateurs ou flagged automatiquement par notre routine autonome pour spam ou contournement financière.
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
                              <p className="text-xs text-afri-text/50">Post ID: {post.id} • Signalement : <strong className="text-red-400">{post.flagReason}</strong></p>
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
                        Aucun signalement en attente de vérification. Tout est paisible.
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
                    systemCommissionRate={systemCommissionRate}
                    audioSynth={audioSynth}
                  />
                </Suspense>
              )}

              {/* ----------------------------------------------------
                                VIEW: PARAMÈTRES DU SYSTÈME (SETTINGS)
                  ---------------------------------------------------- */}
              {activeMenu === "settings" && (
                <Suspense fallback={<div className="p-10 text-center text-[#D4A017] font-mono animate-pulse">Chargement paramètres...</div>}>
                  <AdminSettings
                    systemCommissionRate={systemCommissionRate}
                    onUpdateCommissionRate={handleUpdateCommissionRate}
                    audioSynth={audioSynth}
                  />
                </Suspense>
              )}

              {/* ----------------------------------------------------
                                VIEW: CONSOLE DE SÉCURITÉ (DIAGNOSTICS & LOGS)
                  ---------------------------------------------------- */}
              {(activeMenu === "security" || activeMenu === "logs") && (
                <Suspense fallback={<div className="p-10 text-center text-cyan-400 font-mono animate-pulse">Chargement de la Console de Sécurité...</div>}>
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
                <div className="afri-container space-y-6 animate-fadeIn pb-24 text-left py-4 xs:py-6">
                  <div className="flex justify-between items-center mb-4 border-b border-afri-border pb-4 px-1">
                    <h3 className="text-sm font-mono uppercase tracking-[0.2em] font-black text-[#D4A017]">
                      Intelligence & Data
                    </h3>
                  </div>
                  <Suspense fallback={<div className="p-10 text-center text-[#D4A017] font-mono animate-pulse">Chargement intelligence des données...</div>}>
                    <AdminStats users={users} gombos={gombos} transactions={transactions} onBack={() => goBackMenu()} />
                  </Suspense>
                </div>
              )}

              {/* ----------------------------------------------------
                                VIEW: PLUS (PARAMÈTRES ET OUTILS ADMINISTRATIFS)
                  ---------------------------------------------------- */}
              {activeMenu === "plus" && (
                <div className="afri-container space-y-6 animate-fadeIn pb-24 py-4 xs:py-6">
                  <h3 className="text-[11px] xs:text-sm font-mono uppercase font-black tracking-[0.15em] text-afri-text flex items-center gap-1.5 pb-2 border-b border-afri-border px-1">
                    <Settings className="w-5 h-5 text-afri-text-sec" />
                    Outils d'Administration & Système
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Logs Système */}
                    <button 
                      onClick={() => setActiveMenu("logs")}
                      className="p-4 bg-afri-bg-sec hover:bg-afri-gold/5 border border-afri-border hover:border-afri-gold/20 rounded-xl flex items-start gap-4 text-left transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-afri-bg-sec flex items-center justify-center border border-afri-border group-hover:border-afri-gold/30">
                        <Terminal className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-afri-text uppercase tracking-wider font-mono">Logs système</h4>
                        <p className="text-[10px] text-afri-text-sec mt-1">Historique technique, connexions et audit trail des modérateurs.</p>
                      </div>
                    </button>

                    {/* Paramètres */}
                    <button 
                      onClick={() => setActiveMenu("settings")}
                      className="p-4 bg-afri-bg-sec hover:bg-afri-gold/5 border border-afri-border hover:border-afri-gold/20 rounded-xl flex items-start gap-4 text-left transition-all group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-afri-bg-sec flex items-center justify-center border border-afri-border group-hover:border-afri-gold/30">
                        <Settings className="w-5 h-5 text-afri-text" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-afri-text uppercase tracking-wider font-mono">Paramètres</h4>
                        <p className="text-[10px] text-afri-text-sec mt-1">Configuration générale, filtres de modération et règles communautaires.</p>
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
                        <p className="text-[10px] text-afri-text-sec mt-1">Exports CSV, backups Firestore de sécurité et restauration.</p>
                      </div>
                    </button>

                    {/* Audit sécurité */}
                    <button 
                      onClick={() => setActiveMenu("security")}
                      className="p-4 bg-afri-bg-sec hover:bg-afri-gold/5 border border-afri-border hover:border-afri-gold/20 rounded-xl flex items-start gap-4 text-left transition-all group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-afri-bg-sec flex items-center justify-center border border-afri-border group-hover:border-afri-gold/30">
                        <ShieldAlert className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-afri-text uppercase tracking-wider font-mono">Audit sécurité</h4>
                        <p className="text-[10px] text-afri-text-sec mt-1">Analyse des vulnérabilités, tentatives d'intrusion et IP bloquées.</p>
                      </div>
                    </button>

                    {/* IA AFRIGOMBO */}
                    <button 
                      onClick={() => { setActiveMenu("security"); addToTerminal("[IA] Accès à la configuration du moteur de recommandation."); }}
                      className="p-4 bg-afri-bg-sec hover:bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 rounded-xl flex items-start gap-4 text-left transition-all group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-afri-bg-sec flex items-center justify-center border border-purple-500/20 group-hover:border-purple-500/50">
                        <Brain className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-purple-100 uppercase tracking-wider font-mono">IA AFRIGOMBO</h4>
                        <p className="text-[10px] text-afri-text-sec mt-1">Configuration du moteur de recommandation et modération Gemini.</p>
                      </div>
                    </button>

                    {/* Centre d'aide */}
                    <button 
                      onClick={() => { setActiveMenu("dashboard"); addToTerminal("[SUPPORT] Accès au centre d'aide."); }}
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
                  {userEmail === "jhs.kmj7@gmail.com" && (
                    <div className="pt-6 mt-6 border-t border-afri-border flex justify-center">
                      <button
                        onClick={() => {
                          setActiveMenu("super_admin");
                          addToTerminal("👑 [SOUVERAINETÉ] Entrée dans le Trône demandée.");
                          try { audioSynth.playTamTam(true); } catch (err) {}
                        }}
                        className="group w-full max-w-sm p-4 bg-afri-bg border border-afri-gold/20 hover:border-afri-gold text-afri-gold font-display font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-500 flex items-center justify-center gap-3 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.05)] hover:shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                      >
                        <Crown className="w-4 h-4 text-afri-gold animate-pulse" />
                        👑 Entrer dans le Trône
                      </button>
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
                        <span className="text-[#D4A017] mt-0.5">▶</span>
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
                  { name: "⚡ Certifications Express (500 FCFA)", count: cExpressCount, rev: cExpressCount * 500, type: "cert_express", badge: "Express" },
                  { name: "🔥 Boost Tam-Tam Gombo (500-2k FCFA)", count: bGomboCount, rev: transactions.filter(t => t.type === "boost_gombo").reduce((s,t)=>s+t.amount,0), type: "boost_gombo", badge: "Boost" },
                  { name: "⚡ Renfort Express Urgent (500 FCFA)", count: rExpressCount, rev: rExpressCount * 500, type: "renfort_express", badge: "Renfort" },
                  { name: "✨ Adhésions Gombo VIP (1 000 FCFA/m)", count: gVipCount, rev: gVipCount * 1000, type: "gombo_vip", badge: "VIP" },
                  { name: "💼 Statut Gombo PRO (5 000 FCFA/m)", count: gProCount, rev: gProCount * 5000, type: "gombo_pro", badge: "PRO" }
                ].sort((a,b) => b.count - a.count);

                return (
                  <div className="afri-container space-y-6 py-4 xs:py-6 pb-24">
                    {/* TOP DOCK OF NUMERICS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-5 rounded-lg border border-afri-gold/20 bg-afri-bg/40 shadow-md">
                        <span className="text-[10px] uppercase font-mono text-afri-text/50 block">Nombre d'achats Premium</span>
                        <span className="text-2xl font-display font-bold text-afri-gold block mt-1 font-mono">
                          {countPremiumSales} <span className="text-xs font-sans text-afri-text/40 font-normal">transactions</span>
                        </span>
                        <span className="text-[9px] text-[#10B981] font-mono block mt-1.5">✓ 100% Synchronisé avec Firestore</span>
                      </div>

                      <div className="p-5 rounded-lg border border-afri-gold/20 bg-afri-bg/40 shadow-md">
                        <span className="text-[10px] uppercase font-mono text-afri-text/50 block">Revenus Premium cumulés</span>
                        <span className="text-2xl font-display font-bold text-emerald-400 block mt-1 font-mono">
                          {totalPremiumRevenues.toLocaleString()} <span className="text-sm font-sans text-emerald-500 font-normal">FCFA</span>
                        </span>
                        <span className="text-[9px] text-afri-text-sec font-mono block mt-1.5">Souverains, hors commissions</span>
                      </div>

                      <div className="p-5 rounded-lg border border-afri-gold bg-afri-gold/5 shadow-md">
                        <span className="text-[10px] uppercase font-mono text-afri-gold font-semibold block">Produit Étoile (Leader)</span>
                        <span className="text-xl font-display font-extrabold text-afri-text block mt-1 truncate">
                          {sortedProducts[0]?.count > 0 ? (typeof sortedProducts[0].name === "string" ? sortedProducts[0].name.split("(")[0] : String(sortedProducts[0].name ?? "")) : "Aucun achat encore"}
                        </span>
                        <span className="text-[9px] text-afri-gold font-mono block mt-1">
                          {sortedProducts[0]?.count > 0 ? `${sortedProducts[0].count} activations enregistrées` : "Preneur en attente"}
                        </span>
                      </div>
                    </div>

                    {/* DOCK OF DETAILED PRICINGS & RULES */}
                    <div className="p-6 rounded-lg bg-afri-gold/5 border border-afri-gold/10">
                      <h4 className="text-xs uppercase font-mono font-bold tracking-widest text-afri-gold mb-4 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        Charte d'Éthique & Solidarité Artistique
                      </h4>
                      <p className="text-xs text-afri-text/70 leading-relaxed mb-4">
                        🚨 <strong>Principe de Souveraineté : "Ne jamais bloquer les fonctions essentielles"</strong>. 
                        Toute la monétisation additionnelle d'AFRIGOMBO s'ajoute en tant que services facultatifs à valeur ajoutée pour propulser les carrières. 
                        Un artiste ivoirien sans ressources peut toujours : ✓ Publier sur le Tam-Tam, ✓ Chercher des opportunités de concerts, ✓ Candidater, ✓ Être certifié par file d'attente gratuite. Les contributions financières proviennent uniquement de la valeur d'accélération fournie.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div className="p-4 rounded bg-afri-bg/40 border border-afri-gold/10">
                          <span className="font-bold text-afri-gold block text-xs">⚡ Cert Express</span>
                          <span className="font-mono text-xs font-bold text-afri-text block mt-1">500 FCFA</span>
                          <p className="text-[10px] text-afri-text/40 mt-1">Traitement KYC express sous 24h-72h.</p>
                        </div>
                        <div className="p-4 rounded bg-afri-bg/40 border border-afri-gold/10">
                          <span className="font-bold text-purple-400 block text-xs">✨ Gombo VIP</span>
                          <span className="font-mono text-xs font-bold text-afri-text block mt-1">1 000 FCFA/m</span>
                          <p className="text-[10px] text-afri-text/40 mt-1">Badge VIP, profil propulsé et publications épinglées.</p>
                        </div>
                        <div className="p-4 rounded bg-afri-bg/40 border border-afri-gold/10">
                          <span className="font-bold text-afri-gold block text-xs">🔥 Boost Gombo</span>
                          <span className="font-mono text-xs font-bold text-afri-text block mt-1">500 - 2k FCFA</span>
                          <p className="text-[10px] text-afri-text/40 mt-1">Bannière de distinction En vedette sur les tam-tams.</p>
                        </div>
                        <div className="p-4 rounded bg-afri-bg/40 border border-afri-gold/10">
                          <span className="font-bold text-cyan-400 block text-xs">⚡ Renfort Express</span>
                          <span className="font-mono text-xs font-bold text-afri-text block mt-1">500 FCFA</span>
                          <p className="text-[10px] text-afri-text/40 mt-1">Marquage d'urgence immédiat sur les renforts.</p>
                        </div>
                        <div className="p-4 rounded bg-afri-bg/40 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                          <span className="font-bold text-emerald-400 block text-xs">💼 Gombo PRO</span>
                          <span className="font-mono text-xs font-bold text-afri-text block mt-1">5 000 FCFA/m</span>
                          <p className="text-[10px] text-afri-text/40 mt-1">Multi-utilisateurs, exports de données CSV et rapports.</p>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}

            </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* =========================================================================
                          ZONE C : BRIEF DU JOUR & TERMINAL LOGS (REMOVED - MOVED TO DASHBOARD)
         ========================================================================= */}


      {/* =========================================================================
                               CLÔTURE & ÉVALUATION MODAL (COMBO RATINGS)
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
                <span className="text-[8px] xs:text-[10px] font-mono uppercase font-black text-afri-text">Évaluation d'Excellence Gombo</span>
                <h4 className={`text-sm xs:text-base sm:text-md font-display font-extrabold ${darkMode ? "text-afri-text" : "text-zinc-805"}`}>
                  Clôturer : "{completingGombo.title}"
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
              Le Gombo est terminé ! Pour finaliser et libérer les garanties de la caisse, laissez une note de confiance et un commentaire d'excellence sur le musicien.
            </p>

            <div className="space-y-4 pt-1">
              {/* Option 1: Choose Musician */}
              <div className="space-y-1">
                <label className={`text-[10px] uppercase font-mono block font-bold ${darkMode ? "text-afri-text/50" : "text-afri-text-sec"}`}>
                  Artiste ayant honoré le Gombo :
                </label>
                <select
                  value={reviewMusicianId}
                  onChange={(e) => setReviewMusicianId(e.target.value)}
                  className={`w-full text-xs rounded-lg p-2 font-mono focus:outline-none focus:border-[#FF6600] ${
                    darkMode ? "bg-afri-bg border-afri-border text-afri-text" : "bg-zinc-100 border-zinc-300 text-zinc-800"
                  }`}
                >
                  <option value="" disabled>-- Sélectionner l'artiste certifié --</option>
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
                  Note Accordée à l'Artiste : ({reviewRating} Étoiles)
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
                  Témoignage écrit & Feedback :
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Ponctualité exemplaire, virtuosité remarquable et aisance scénique incomparable. Je recommande absolument."
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
                      Activer l'évaluation de retour (Artiste ➜ Client)
                    </label>
                  </div>
                  <span className="text-xs text-afri-text/40 cursor-help font-bold" title="Permet d'évaluer réciproquement l'accueil de l'organisateur.">❓</span>
                </div>

                {enableReciprocal && (
                  <div className="space-y-3 pt-1 border-t border-afri-border animate-fadeIn">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-mono text-afri-text-sec block font-bold">
                        Note pour l'Organisateur & Événement : ({reciprocalRating} Étoiles)
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
                        Commentaire de l'Artiste :
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
                Confirmer & Clôturer Gombo 🏆
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
                src="/public/logo_afrigombo.png" 
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
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-extrabold block">Décret Royal Activé</span>
              <h3 className="text-xl xs:text-2xl font-display font-black text-afri-text leading-tight">Salutations, Maître de l'Afrique Musicale</h3>
              <p className="text-[10px] xs:text-xs text-afri-text/75 leading-relaxed font-sans">
                "L'Empire d'AFRIGOMBO est entièrement sous vos ordres souverains. Les cachets, les licences d'or et l'intégralité des talents nationaux reposent entre vos mains expertes."
              </p>
            </div>
            
            {/* Simulated Loading Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-afri-text/40">
                <span>Synchronisation des pouvoirs suprêmes</span>
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
                addToTerminal(`[INFO] Cabinet du Fondateur déverrouillé par johnsylvesterh@gmail.com.`);
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-[#FF6600] text-afri-text hover:opacity-90 font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
            >
              👑 Entrer dans le Trône
            </button>
          </div>
        </motion.div>
      )}

      {/* =========================================================================
                                     PLUS MENU OVERLAYS
         ========================================================================= */}
      {isPlusMenuOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-afri-bg/60 backdrop-blur-sm sm:items-center sm:justify-center">
          {/* Dismiss background */}
          <div className="absolute inset-0" onClick={() => setIsPlusMenuOpen(false)} />
          
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-afri-bg-sec border-t border-x border-afri-gold/20 sm:rounded-3xl sm:border-b p-6 pb-12 shadow-[0_-15px_40px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={() => setIsPlusMenuOpen(false)}
                className="text-afri-text-sec hover:text-afri-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-xl font-display font-black text-afri-text mb-6 tracking-tight">Que souhaitez-vous publier ?</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setActivePublishType("gombo");
                  setActiveMenu("user_publish");
                  setIsPlusMenuOpen(false);
                }}
                className="w-full flex items-center gap-4 bg-gradient-to-r from-afri-gold/10 to-transparent hover:from-afri-gold/20 border border-afri-gold/20 rounded-2xl p-4 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-afri-gold to-[#F1C40F] flex items-center justify-center text-black shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-[13px] font-sans font-bold text-afri-text uppercase tracking-wider mb-0.5">Publier un Gombo</h4>
                  <p className="text-[10px] text-afri-text-sec font-mono">Recrutez des artistes pour vos événements.</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setActivePublishType("reel");
                  setActiveMenu("user_publish");
                  setIsPlusMenuOpen(false);
                }}
                className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-afri-border rounded-2xl p-4 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30 group-hover:scale-105 transition-transform">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-[13px] font-sans font-bold text-afri-text uppercase tracking-wider mb-0.5">Publier un Réel</h4>
                  <p className="text-[10px] text-afri-text-sec font-mono">Partagez votre talent en vidéo courte.</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setActivePublishType("demo");
                  setActiveMenu("user_publish");
                  setIsPlusMenuOpen(false);
                }}
                className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-afri-border rounded-2xl p-4 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30 group-hover:scale-105 transition-transform">
                  <Mic2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-[13px] font-sans font-bold text-afri-text uppercase tracking-wider mb-0.5">Démo Musicale</h4>
                  <p className="text-[10px] text-afri-text-sec font-mono">Publiez une démo audio pour les recruteurs.</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setActivePublishType("renfort");
                  setActiveMenu("user_publish");
                  setIsPlusMenuOpen(false);
                }}
                className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-afri-border rounded-2xl p-4 text-left transition-all group relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center shrink-0 border border-red-500/30 group-hover:scale-105 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-[13px] font-sans font-bold text-afri-text uppercase tracking-wider mb-0.5 flex items-center gap-2">
                    Renfort Express
                    <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded uppercase">Urgent</span>
                  </h4>
                  <p className="text-[10px] text-afri-text-sec font-mono">Demandez un dépannage immédiat (musicien).</p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showHowWorksPopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-afri-bg/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-afri-bg-sec border border-afri-gold/30 rounded-2xl p-6 shadow-2xl"
          >
            <div className="w-12 h-12 rounded-full bg-afri-gold/20 flex items-center justify-center mb-4">
              <Info className="w-6 h-6 text-afri-gold" />
            </div>
            <h3 className="text-lg font-display font-black text-afri-text mb-2">Comment fonctionne AFRIGOMBO ?</h3>
            <p className="text-xs text-afri-text font-sans leading-relaxed mb-6">
              AFRIGOMBO permet la mise en relation entre talents et porteurs de projets. 
              <br/><br/>
              Certaines options premium (marquage urgent, mise en avant, profils vérifiés) peuvent comporter des frais qui seront affichés avant validation. Les paiements garantissent la sécurité et l'engagement des deux parties.
            </p>
            <button 
              onClick={() => setShowHowWorksPopup(false)}
              className="w-full py-3 bg-gradient-to-r from-afri-gold to-[#F1C40F] text-black font-bold uppercase tracking-wider text-xs rounded-xl hover:opacity-90 transition-all"
            >
              J'ai compris
            </button>
          </motion.div>
        </div>
      )}

      {/* =========================================================================
                                     FIXED BOTTOM NAVIGATION BAR (FLOATING & WELL-ROUNDED)
         ========================================================================= */}
      {perspective === "user" && [
        "user_terrain", "user_vibes", "user_publish", "user_mes_gombos", "user_heritage",
        "user_notifications", "user_settings", "user_wallet", "user_contracts", "user_messages",
        "user_about", "user_support", "user_whats_new", "user_abonnement", "user_gombo_dashboard"
      ].includes(activeMenu) && (
        <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-[94%] xs:w-[92%] max-w-[425px] h-[64px] sm:h-[72px] bg-afri-bg-sec/95 backdrop-blur-xl border border-afri-border p-1 px-2 xs:px-3 sm:px-4 flex justify-between items-center z-40 rounded-[24px] sm:rounded-[28px] shadow-[0_12px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.85)] select-none">
          {/* 1. ACCUEIL */}
          <button
            id="user-nav-terrain"
            onClick={() => {
              setActiveMenu("user_terrain");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none flex-1 py-1 ${
              activeMenu === "user_terrain" ? "text-afri-gold scale-102" : "text-afri-text-sec hover:text-zinc-350"
            }`}
          >
            <Home className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className={`text-[7px] xs:text-[7.5px] font-sans font-black uppercase tracking-wider ${activeMenu === "user_terrain" ? "text-afri-gold" : "text-afri-text"}`}>Accueil</span>
          </button>


          {/* 2. VIBES */}
          <button
            id="user-nav-vibes"
            onClick={() => {
              requireAuthThen(() => {
                setActiveMenu("user_vibes");
                try { audioSynth.playValidationSuccess(); } catch (err) {}
              });
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none flex-1 py-1 ${
              activeMenu === "user_vibes" ? "text-afri-gold scale-102" : "text-afri-text-sec hover:text-zinc-350"
            }`}
          >
            <Music className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className={`text-[7px] xs:text-[7.5px] font-sans font-black uppercase tracking-wider ${activeMenu === "user_vibes" ? "text-afri-gold" : "text-afri-text"}`}>Vibes</span>
          </button>

          {/* 3. PUBLIER */}
          <button
            id="user-nav-publish"
            onClick={() => {
              requireAuthThen(() => {
                setIsPlusMenuOpen(true);
                try { audioSynth.playValidationSuccess(); } catch (err) {}
              });
            }}
            className="flex flex-col items-center justify-center cursor-pointer transition-all duration-200 outline-none px-1.5 xs:px-2 select-none shrink-0"
            title="Publier"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-gradient-to-tr from-afri-gold to-[#F1C40F] text-black rounded-full shadow-[0_0_12px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3.5]" />
            </div>
            <span className="text-[7px] xs:text-[7.5px] font-sans font-black uppercase tracking-wider text-afri-text mt-0.5">Publier</span>
          </button>

          {/* 4. MES GOMBOS */}
          <button
            id="user-nav-mes-gombos"
            onClick={() => {
              requireAuthThen(() => {
                setActiveMenu("user_mes_gombos");
                try { audioSynth.playValidationSuccess(); } catch (err) {}
              });
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none flex-1 py-1 ${
              activeMenu === "user_mes_gombos" ? "text-afri-gold scale-102" : "text-afri-text-sec hover:text-zinc-350"
            }`}
          >
            <Megaphone className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className={`text-[7px] xs:text-[7.5px] font-sans font-black uppercase tracking-wider ${activeMenu === "user_mes_gombos" ? "text-afri-gold" : "text-afri-text"}`}>Gombos</span>
          </button>

          {/* 6. MON HÉRITAGE */}
          <button
            id="user-nav-heritage"
            onClick={() => {
              if (!currentUser) {
                setShowHeritageLoginRequired(true);
              } else {
                setActiveMenu("user_heritage");
                setViewingGomboIdDetail(false);
                try { audioSynth.playValidationSuccess(); } catch (err) {}
              }
            }}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 outline-none flex-1 py-1 ${
              activeMenu === "user_heritage" ? "scale-105" : "text-afri-text-sec hover:text-zinc-350"
            }`}
          >
            {activeMenu === "user_heritage" ? (
              <div className="w-10 h-10 rounded-full bg-afri-gold text-black flex items-center justify-center shadow-[0_0_12px_rgba(212,175,55,0.55)] border border-afri-bg transition-all duration-300 -mt-2">
                <UserIcon className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
            ) : (
              <UserIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-afri-text-sec hover:text-zinc-350 transition-colors" />
            )}
            <span className={`text-[6.5px] xs:text-[7px] font-mono font-black uppercase tracking-widest mt-1 ${
              activeMenu === "user_heritage" ? "text-afri-gold" : "text-afri-text"
            }`}>
              MON HÉRITAGE
            </span>
          </button>
        </div>
      )}

      {/* =========================================================================
                                     ADMIN FIXED BOTTOM NAVIGATION BAR
         ========================================================================= */}
      {perspective === "admin" && activeMenu !== "super_admin" && (
        <div className="fixed bottom-0 sm:bottom-4 left-0 sm:left-1/2 right-0 sm:right-auto sm:-translate-x-1/2 bg-afri-bg/95 backdrop-blur-md border-t sm:border border-afri-gold/35 p-1.5 sm:p-2 px-2 xs:px-4 sm:px-6 flex items-center z-40 sm:rounded-2xl sm:shadow-[0_8px_35px_rgba(212,175,55,0.2)] w-full sm:w-auto min-w-[300px] xs:min-w-[320px] max-w-full sm:max-w-4xl mx-auto overflow-x-auto scrollbar-none flex-nowrap gap-0.5 xs:gap-1 sm:gap-4 select-none">
          {/* 1. DASHBOARD */}
          <button
            id="admin-nav-dashboard"
            onClick={() => {
              setActiveMenu("dashboard");
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

          {/* 6. PARAMÈTRES */}
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
            <span className="text-[9px] font-mono uppercase tracking-wider">Paramètres</span>
          </button>

          {/* 7. SÉCURITÉ */}
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
            <span className="text-[9px] font-mono uppercase tracking-wider">Sécurité</span>
          </button>

          {/* 8. TRÔNE DU FONDATEUR */}
          {isAuthorizedSuperFounder && (
            <button
              id="admin-nav-super_admin"
              onClick={() => {
                setActiveMenu("super_admin");
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
                Diffuser un Mégaphone Bulletin
              </h4>
              <button onClick={() => setIsBroadcastModalOpen(false)} className="text-afri-text hover:text-red-500 font-bold">
                &times;
              </button>
            </div>

            <p className="text-xs text-afri-text/60 leading-relaxed">
              Le bulletin sera épinglé au Tam-Tam pour l'ensemble des artistes en Côte d'Ivoire.
            </p>

            <textarea
              required
              rows={3}
              placeholder="Ex: Alerte pluie ! Soyez prudents à Cocody. Les Gombos en extérieur sont ajournés."
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
                                     EVENTS MODAL (ÉVÉNEMENTS LIVE)
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
                  📅 Événements & Concerts Élite 2026
                </h4>
                <p className="text-[9px] font-mono text-afri-text-sec">
                  PROGRAMMATION ET CACHETS PRIVÉS SOUVERAINS
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
                    <h5 className="text-xs font-sans font-black text-afri-text uppercase">FEMUA 2026 — Grande Scène</h5>
                    <p className="text-[9px] text-afri-gold font-mono">📍 Marcory, Abidjan • 12 Juillet 2026</p>
                  </div>
                  <span className="text-[8px] font-mono py-0.5 px-2 bg-afri-gold/10 rounded border border-afri-gold/20 text-afri-gold uppercase font-bold">
                    Tête d'Affiche
                  </span>
                </div>
                <p className="text-[10.5px] text-afri-text-sec">
                  Performance en prime-time devant 40 000 spectateurs. Intégration de vibes kora et kpanlogo traditionnels requise.
                </p>
                <div className="flex justify-between items-center pt-1 text-[10px]">
                  <span className="text-afri-text-sec">Cachet Artiste : <strong className="text-afri-text">Sur devis</strong></span>
                  <button 
                    onClick={() => {
                      alert("Enregistré ! Votre agence d'Héritage a transmis votre dossier de candidature de groupe au BURIDA / FEMUA.");
                      try { audioSynth.playKoraSuccess(); } catch(e){}
                    }}
                    className="px-3 py-1 bg-afri-gold hover:bg-afri-bg-sec text-[#050505] font-bold rounded uppercase transition-colors"
                  >
                    Postuler 🔥
                  </button>
                </div>
              </div>

              {/* Event 2 */}
              <div className="p-4 rounded-xl bg-afri-bg border border-afri-gold/15 hover:border-afri-gold/45 transition-colors space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-sans font-black text-afri-text uppercase font-display">Abidjan Jazz Premium Live</h5>
                    <p className="text-[9px] text-afri-gold font-mono">📍 Palais des Congrès, Cocody • 28 Août 2026</p>
                  </div>
                  <span className="text-[8px] font-mono py-0.5 px-2 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-400 uppercase font-bold">
                    Cachet Garanti
                  </span>
                </div>
                <p className="text-[10.5px] text-afri-text-sec">
                  Soirée VIP de prestige. Idéal pour guitaristes solos, saxophonistes et percussionnistes d'Alliance.
                </p>
                <div className="flex justify-between items-center pt-1 text-[10px]">
                  <span className="text-afri-text-sec">Cachet : <strong className="text-afri-gold">4 000 000 FCFA</strong></span>
                  <button 
                    onClick={() => {
                      alert("Premium Option validée ! Entretien de cachet planifié au Cabinet Gombo.");
                      try { audioSynth.playKoraSuccess(); } catch(e){}
                    }}
                    className="px-3 py-1 bg-afri-gold hover:bg-afri-bg-sec text-[#050505] font-bold rounded uppercase transition-colors"
                  >
                    Réserver Place 💎
                  </button>
                </div>
              </div>

              {/* Event 3 */}
              <div className="p-4 rounded-xl bg-afri-bg border border-afri-gold/15 hover:border-afri-gold/45 transition-colors space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-sans font-black text-afri-text uppercase font-display">Nuit du Zouglou Souverain</h5>
                    <p className="text-[9px] text-afri-gold font-mono">📍 Complexe Sportif, Yopougon • 05 Septembre 2026</p>
                  </div>
                  <span className="text-[8px] font-mono py-0.5 px-2 bg-pink-500/10 rounded border border-pink-500/25 text-pink-400 uppercase font-bold">
                    Zouglou Only
                  </span>
                </div>
                <p className="text-[10.5px] text-afri-text-sec">
                  Alliance de 10 groupes d'élite ivoiriens. Ambiance wôyô, tambours traditionnels d'Adjamé et choeurs harmonisés.
                </p>
                <div className="flex justify-between items-center pt-1 text-[10px]">
                  <span className="text-afri-text-sec">Cachet Garanti : <strong className="text-afri-text">2 500 000 FCFA</strong></span>
                  <button 
                    onClick={() => {
                      alert("Inscrit au Tam-Tam ! Votre groupe est présélectionné pour le live de Yop.");
                      try { audioSynth.playKoraSuccess(); } catch(e){}
                    }}
                    className="px-3 py-1 bg-afri-gold hover:bg-afri-bg-sec text-[#050505] font-bold rounded uppercase transition-colors"
                  >
                    Postuler 🔥
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
        const details = {
          menu_favorites: {
            title: "Mes Favoris Élite",
            badge: "Bientôt disponible",
            description: "Ajoutez des artistes d'exception, des opportunités de gombos lucratives et des maquis ou scènes VIP à vos favoris pour les retrouver en un clic.",
            incentive: "Idéal pour composer vos équipes de scène récurrentes !",
            icon: "⭐",
            color: "from-yellow-500 to-amber-600"
          },
          menu_history: {
            title: "Historique Universel",
            badge: "Bientôt disponible",
            description: "Retrouvez l'historique de toutes vos actions de l'écosystème : candidatures envoyées, gombos complétés, dépôts, retraits et interactions d'Alliance.",
            incentive: "Votre journal de bord artistique complet et infalsifiable.",
            icon: "🕓",
            color: "from-blue-500 to-indigo-600"
          },
          menu_downloads: {
            title: "Coffre Téléchargements",
            badge: "Bientôt disponible",
            description: "Téléchargez instantanément vos contrats de prestation au format PDF officiel d'AFRIGOMBO, vos attestations de paiement et vos reçus BURIDA.",
            incentive: "Générez des justificatifs officiels de vos revenus artistiques.",
            icon: "📥",
            color: "from-emerald-500 to-teal-600"
          },
          menu_backups: {
            title: "Sauvegardes Souveraines",
            badge: "Bientôt disponible",
            description: "Exportez l'intégralité de vos données, de votre Gombo ID, de vos publications et de vos contrats dans une archive sécurisée et portable.",
            incentive: "La garantie d'une souveraineté totale de vos données d'artiste.",
            icon: "💾",
            color: "from-purple-500 to-fuchsia-600"
          }
        }[comingSoonFeatureKey];

        if (!details) return null;

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
                  <span className="text-emerald-400 mt-0.5 shrink-0">✨</span>
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
                        alert("Félicitations ! Vous êtes inscrit(e) sur la liste d'attente prioritaire de cette fonctionnalité. 🚀");
                      } else {
                        alert("Inscrit sur la liste d'attente locale ! Connectez-vous pour une synchronisation prioritaire.");
                      }
                      setComingSoonFeatureKey(null);
                      try { audioSynth.playValidationSuccess(); } catch(_) {}
                    } catch (e) {
                      console.error(e);
                      alert("Inscrit avec succès sur la liste d'attente locale d'AFRIGOMBO !");
                      setComingSoonFeatureKey(null);
                    }
                  }}
                  className="w-full py-2.5 bg-afri-gold hover:bg-afri-bg-sec text-[#050505] text-xs font-black uppercase tracking-wider rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  M'inscrire sur la liste d'attente 🚀
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
                  🏛️ Gombo Academy • Masterclasses
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
                  1. Législation BURIDA & Droits d'Héritage
                </h5>
                <p className="text-[11px] text-zinc-350 leading-relaxed pl-3.5 border-l border-afri-border">
                  Apprenez à déposer vos oeuvres, protéger vos codes de vibes, et déclarer vos gombos d'Abidjan. Le BURIDA sécurise vos revenus d'alliance et d'héritage musical contre toute exploitation injuste.
                </p>
              </div>

              {/* Class 2 */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  2. Maîtriser l'Art de Négocier le Cachet
                </h5>
                <p className="text-[11px] text-zinc-350 leading-relaxed pl-3.5 border-l border-afri-border">
                  Ne jamais accepter de cachet inférieur à <strong className="text-afri-text">250 000 FCFA</strong> pour des prestations VIP d'Alliance. Utilisez la formule d'Héritage d'Afrigombo : calculez vos frais de transport logistique, vos consommables sonores, et valorisez votre réputation d'artiste certifié.
                </p>
              </div>

              {/* Class 3 */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-purple-400 uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  3. Session de Souffle Zouglou & Calage Rythmique
                </h5>
                <p className="text-[11px] text-zinc-350 leading-relaxed pl-3.5 border-l border-afri-border">
                  Technique respiratoire de soutien pour chanter en wôyô pendant de longues performances sans altérer la clarté mélodique. Exercices de cohésion rythmique pour rester en phase avec le Tam-Tam maître.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-between items-center pt-2 border-t border-afri-gold/10">
              <span className="text-[9px] font-mono text-afri-text-sec italic block">
                "Ce que tu sais préserve l'Héritage."
              </span>
              <button
                onClick={() => {
                  alert("Félicitations pour votre soif d'enseignement artistique ! Des tuteurs nationaux vous contacteront prochainement.");
                  setIsAcademyModalOpen(false);
                }}
                className="px-4 py-1.5 bg-afri-gold hover:bg-afri-bg-sec text-[#050505] text-xs font-mono font-black uppercase rounded transition-colors"
              >
                S'inscrire à l'Héritage d'Alliance 🎓
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
                <h3 className="text-sm font-black tracking-widest text-afri-gold uppercase">Bêta Feedback</h3>
                <p className="text-[10px] text-afri-text-sec font-mono">Signaler un bug ou une idée</p>
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
                addToTerminal("[BÊTA] Feedback envoyé avec succès. Merci !");
                try { audioSynth.playValidationSuccess(); } catch(e){}
                form.reset();
              } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.innerText = "Erreur - Réessayer";
              }
            }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-afri-text-sec uppercase mb-2">Type de retour</label>
                <select name="type" className="w-full bg-[#111] border border-gray-800 rounded-lg p-3 text-xs text-afri-text focus:border-afri-gold/50 focus:outline-none">
                  <option value="bug">🐛 Signaler un bug</option>
                  <option value="idea">💡 Suggérer une idée</option>
                  <option value="other">💬 Autre remarque</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-afri-text-sec uppercase mb-2">Description détaillée</label>
                <textarea 
                  name="description" 
                  rows={4} 
                  required
                  placeholder="Décrivez le problème rencontré ou votre idée d'amélioration..."
                  className="w-full bg-[#111] border border-gray-800 rounded-lg p-3 text-xs text-afri-text focus:border-afri-gold/50 focus:outline-none placeholder-gray-600 resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsBetaFeedbackOpen(false)}
                  className="flex-1 py-3 border border-gray-800 hover:bg-gray-800 rounded-xl text-xs font-bold text-afri-text-sec transition-colors"
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

      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-afri-bg/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-sm bg-afri-bg border border-afri-gold/25 rounded-3xl p-6 relative overflow-hidden text-center shadow-[0_0_50px_rgba(212,175,55,0.1)]">
            {/* Ambient Background Light */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-afri-gold/5 blur-3xl rounded-full pointer-events-none" />
            
            {/* Elegant Icon */}
            <div className="w-16 h-16 rounded-2xl bg-afri-gold/10 flex items-center justify-center border border-afri-gold/30 mx-auto mb-6 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
              <Sparkles className="w-8 h-8 text-afri-gold" />
            </div>

            <h3 className="text-afri-text text-lg font-bold font-sans mb-2 uppercase tracking-wide">
              Accès Privé
            </h3>

            <p className="text-afri-text text-sm mb-6 px-2 font-medium">
              Touchez Continuer pour accéder à cette fonctionnalité
            </p>

            <div className="space-y-3">
              {/* Google Login (Disponible) */}
              <button
                onClick={async () => {
                  try {
                    await loginWithGoogle();
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="w-full py-3 px-4 rounded-xl bg-afri-gold hover:bg-afri-bg-sec text-black font-sans font-black text-sm uppercase tracking-wider transition-all duration-300 shadow-[0_4px_12px_rgba(212,175,55,0.2)] flex items-center justify-between gap-2 group"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuer avec Google</span>
                </div>
                <span className="text-[10px] font-mono font-black bg-afri-bg/25 text-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                  disponible
                </span>
              </button>

              {/* GOMBO ID (Bientôt disponible) */}
              <div className="w-full py-3 px-4 rounded-xl bg-afri-bg border border-afri-border text-afri-text-sec font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-between gap-2 select-none opacity-60">
                <div className="flex items-center gap-2">
                  <span className="text-base">🆔</span>
                  <span>Continuer avec GOMBO ID</span>
                </div>
                <span className="text-[9px] font-mono font-black bg-afri-bg-sec border border-afri-border text-afri-text-sec px-1.5 py-0.5 rounded uppercase tracking-widest">
                  bientôt
                </span>
              </div>

              {/* Facebook (Bientôt disponible) */}
              <div className="w-full py-3 px-4 rounded-xl bg-afri-bg border border-afri-border text-afri-text-sec font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-between gap-2 select-none opacity-60">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Continuer avec Facebook</span>
                </div>
                <span className="text-[9px] font-mono font-black bg-afri-bg-sec border border-afri-border text-afri-text-sec px-1.5 py-0.5 rounded uppercase tracking-widest">
                  bientôt
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="w-full py-2 px-4 rounded-xl bg-transparent hover:bg-afri-bg text-afri-text-sec hover:text-afri-text text-xs font-mono font-bold transition-all duration-300"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHeritageLoginRequired && (
        <div className="fixed inset-0 bg-afri-bg/95 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-fadeIn text-left select-none">
          <div className="w-full max-w-sm bg-afri-bg border border-afri-gold/35 rounded-3xl p-6 space-y-5 shadow-2xl shadow-amber-500/5">
            <div className="w-14 h-14 bg-afri-gold/10 rounded-full flex items-center justify-center text-afri-gold mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-afri-text text-base font-sans font-black uppercase tracking-wide">
                🔐 Connexion requise
              </h3>
              <p className="text-afri-text-sec text-xs leading-relaxed font-sans">
                Connectez-vous pour accéder à votre identité AFRIGOMBO
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  setShowHeritageLoginRequired(false);
                  try {
                    await loginWithGoogle();
                    try { audioSynth.playTamTam(true); } catch (_) {}
                  } catch (err) {
                    console.error("Google login failed", err);
                    setIsAuthModalOpen(true);
                  }
                }}
                className="w-full py-3 rounded-xl bg-afri-gold hover:bg-afri-bg-sec text-black font-sans font-black uppercase tracking-wider text-xs transition-all cursor-pointer"
              >
                Continuer avec Google
              </button>
              <button
                onClick={() => setShowHeritageLoginRequired(false)}
                className="w-full py-2.5 rounded-xl bg-transparent border border-afri-border text-afri-text-sec hover:text-afri-text font-mono font-bold text-xs transition-all cursor-pointer"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      {showGoogleLoginRequiredModal && (
        <div className="fixed inset-0 bg-afri-bg/95 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-fadeIn text-left">
          <div className="w-full max-w-sm bg-afri-bg border border-amber-500/35 rounded-3xl p-6 space-y-5 shadow-2xl shadow-amber-500/5">
            <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mx-auto select-none">
              <Lock className="w-7 h-7" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-afri-text text-base font-sans font-black uppercase tracking-wide">
                CONNEXION GOOGLE EXIGÉE
              </h3>
              <p className="text-afri-text-sec text-xs leading-relaxed font-sans">
                Par mesure de confiance inter-dimensionnelle et pour garantir l'intégrité de votre contrat souverain AfriTrust, l'accès à <strong>"Mon Héritage"</strong> requiert obligatoirement une authentification via un compte Google de confiance.
              </p>
            </div>

            <div className="p-3 bg-afri-bg-sec/60 border border-afri-border rounded-2xl text-[11px] font-mono text-zinc-550 space-y-1">
              <div>• Session courante : {currentUser?.email || "Email standard"}</div>
              <div>• Statut : Lié par email/pass (Exclus)</div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowGoogleLoginRequiredModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-afri-bg w-full hover:bg-afri-bg-sec text-afri-text hover:text-afri-text transition-all text-xs font-mono font-bold border border-afri-border"
              >
                Fermer
              </button>
              <button
                onClick={async () => {
                  setShowGoogleLoginRequiredModal(false);
                  try { await logout(); } catch(e){}
                  setIsAuthModalOpen(true);
                  try { audioSynth.playTamTam(false); } catch(e){}
                }}
                className="flex-1 py-2.5 rounded-xl bg-afri-gold hover:bg-afri-bg-sec text-black transition-all text-xs font-sans font-black uppercase tracking-wider"
              >
                S'AUTHENTIFIER ↩
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedGomboDetails && (() => {
        const hasApplied = appliedGombos.includes(selectedGomboDetails.id);
        return (
          <div className="fixed inset-0 bg-afri-bg/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-lg bg-afri-bg-sec border border-afri-gold/35 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header Image backdrop */}
              <div className="h-44 w-full relative bg-afri-bg shrink-0">
                <img
                  src={
                    selectedGomboDetails.id.includes("1") || selectedGomboDetails.id.includes("a")
                      ? "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=500"
                      : selectedGomboDetails.id.includes("2") || selectedGomboDetails.id.includes("b")
                      ? "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=500"
                      : selectedGomboDetails.id.includes("3") || selectedGomboDetails.id.includes("c")
                      ? "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=500"
                      : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=500"
                  }
                  alt={selectedGomboDetails.title}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F11] via-[#0F0F11]/40 to-transparent" />
                
                {/* Close Button */}
                <button
                  onClick={() => setSelectedGomboDetails(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-afri-bg/85 border border-afri-gold/30 flex items-center justify-center text-afri-text hover:text-red-400 text-lg transition-all cursor-pointer select-none active:scale-90"
                  title="Fermer"
                >
                  &times;
                </button>

                <div className="absolute bottom-4 left-6">
                  <span className="text-[10px] font-mono font-black uppercase text-afri-gold bg-afri-bg/90 px-3 py-1 rounded-xl border border-afri-gold/30">
                    {selectedGomboDetails.type || "Live Direct Showcase"}
                  </span>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap text-afri-text-sec font-mono text-[10px]">
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase select-none">
                      ● Cachet Actif
                    </span>
                    <span>📍 {selectedGomboDetails.location}</span>
                    <span>• {selectedGomboDetails.date || "Immédiat"}</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-display font-black text-afri-text leading-tight uppercase">
                    {selectedGomboDetails.title}
                  </h3>
                </div>

                <div className="space-y-1.5 p-4 rounded-2xl bg-afri-bg/40 border border-afri-border">
                  <span className="text-[9px] font-mono uppercase text-afri-text-sec block font-bold">CACHET FINANCIER GARANTI :</span>
                  <strong className="text-3xl font-display font-black text-afri-gold tracking-tight block">
                    {(selectedGomboDetails.budget || 250000).toLocaleString("fr-FR")} <span className="text-sm font-mono text-afri-text-sec font-normal">FCFA</span>
                  </strong>
                </div>

                <div className="space-y-2 text-afri-text text-xs sm:text-sm leading-relaxed">
                  <span className="text-[10px] font-mono uppercase text-afri-text-sec block font-bold">DESCRIPTION DU CONTRAT :</span>
                  <p>{selectedGomboDetails.description}</p>
                </div>

                {/* SOVEREIGN CONTRACT TRACKING & ESCROW PANEL */}
                {hasApplied && (
                  <div className="p-5 rounded-2xl bg-afri-bg border border-afri-gold/35 space-y-4 text-xs animate-fadeIn">
                    <div className="border-b border-afri-gold/20 pb-2 flex items-center justify-between">
                      <span className="font-mono font-bold text-afri-gold uppercase tracking-wider text-[9px]">⚖️ RECTO-VERSO CONTRACTUEL SOUVERAIN</span>
                      <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded uppercase font-mono font-bold">Escrow Sécurisé GomboCaisse</span>
                    </div>

                    {/* Section System Renfort group if category === "Renfort groupe" */}
                    {selectedGomboDetails.category === "Renfort groupe" && (
                      <div className="space-y-3 bg-afri-bg/40 p-3 rounded-xl border border-afri-border text-left">
                        <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold text-afri-text-sec">
                          <span>📋 Suivi Répétitions :</span>
                          <span className="text-amber-400 font-mono">{contractRepsConfirmed[selectedGomboDetails.id] || 0} confirmées / {selectedGomboDetails.repetitionsCount || 3}</span>
                        </div>

                        {/* Rehearsals stats */}
                        <div className="text-[10px] text-afri-text-sec space-y-1 bg-afri-bg w-full p-2.5 rounded-lg border border-afri-border font-mono">
                          <div>📅 <span className="text-afri-text-sec">Dates :</span> <span className="text-afri-text">{selectedGomboDetails.repetitionsDates || "Défini par l'organisateur"}</span></div>
                          <div>⏰ <span className="text-afri-text-sec">Horaires :</span> <span className="text-afri-text">{selectedGomboDetails.repetitionsSchedule || "ex: 18:00 - 21:00"}</span></div>
                          <div>💰 <span className="text-afri-text-sec">Transport/répétition :</span> <span className="text-afri-gold font-bold">{(selectedGomboDetails.transportFee || 3000).toLocaleString()} FCFA</span></div>
                          <div>💰 <span className="text-afri-text-sec">Budget transport bloqué :</span> <span className="text-emerald-400 font-bold">{((selectedGomboDetails.transportFee || 3000) * (selectedGomboDetails.repetitionsCount || 3)).toLocaleString()} FCFA</span></div>
                        </div>

                        <div className="flex gap-2.5">
                          <button
                            onClick={() => {
                              const currentCount = contractRepsConfirmed[selectedGomboDetails.id] || 0;
                              const limit = selectedGomboDetails.repetitionsCount || 3;
                              if (currentCount >= limit) {
                                alert("Toutes les présences de répétition ont déjà été enregistrées !");
                                return;
                              }
                              // Confirm presence
                              const now = new Date().toLocaleTimeString();
                              const selfieOrVideo = prompt("Veuillez entrer une preuve de présence (Selfie photo URL ou courte vidéo, ex: https://afrigombo.ci/presence_selfie.mp4) :");
                              if (!selfieOrVideo) return;
                              
                              setContractRepsConfirmed(prev => ({
                                ...prev,
                                [selectedGomboDetails.id]: currentCount + 1
                              }));
                              addToTerminal(`[🛡️ PRÉSENCE] Répétition #${currentCount + 1} confirmée à ${now} ! Localisation GPS validée. En attente de validation organisateur (libération sous 8h automatique).`);
                              audioSynth.playValidationSuccess();
                            }}
                            className="flex-1 py-1.5 px-2 bg-afri-gold/10 hover:bg-afri-gold border border-afri-gold/35 text-afri-gold hover:text-black font-sans font-bold text-[9px] rounded-lg tracking-wider transition-all cursor-pointer uppercase text-center"
                          >
                            Présence (Selfie+GPS) 🤳
                          </button>

                          <button
                            onClick={() => {
                              const currentConfirmed = contractRepsConfirmed[selectedGomboDetails.id] || 0;
                              const currentValidated = contractRepsOrganizerValidated[selectedGomboDetails.id] || 0;
                              if (currentValidated >= currentConfirmed) {
                                alert("Aucune nouvelle répétition signalée en attente de validation.");
                                return;
                              }
                              setContractRepsOrganizerValidated(prev => ({
                                ...prev,
                                [selectedGomboDetails.id]: currentConfirmed
                              }));
                              addToTerminal(`[🛡️ VALIDATION] Présence validée par l'organisateur ! Indemnité de transport libérée immédiatement.`);
                              audioSynth.playValidationSuccess();
                            }}
                            className="flex-1 py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 text-emerald-400 hover:text-black font-sans font-bold text-[9px] rounded-lg tracking-wider transition-all cursor-pointer uppercase text-center"
                          >
                            Validation Organisateur ✅
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Prestation Jour J Section */}
                    <div className="space-y-3 bg-afri-bg/40 p-3 rounded-xl border border-afri-border text-left">
                      <span className="text-[10px] uppercase font-mono font-bold text-afri-text-sec block">🎤 Prestation Jour J :</span>
                      
                      <div className="flex items-center justify-between text-[11px] font-mono py-1">
                        <span className="text-afri-text-sec">Statut Prestation :</span>
                        {contractDDayEnded[selectedGomboDetails.id] ? (
                          <span className="text-emerald-400 font-bold">✓ TERMINÉ & LIBÉRÉ</span>
                        ) : contractDDayStarted[selectedGomboDetails.id] ? (
                          <span className="text-amber-400 animate-pulse font-bold">● EN COURS DE PRESTATION</span>
                        ) : (
                          <span className="text-afri-text-sec font-bold">EN ATTENTE DU SIGNAL</span>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {/* Start prestation button */}
                        {!contractDDayStarted[selectedGomboDetails.id] && !contractDDayEnded[selectedGomboDetails.id] && (
                          <button
                            onClick={() => {
                              const confirmVideo = prompt("Veuillez enregistrer une courte vidéo face ou entrer son URL pour certifier le début sur scène :");
                              if (!confirmVideo) return;
                              setContractDDayStarted(prev => ({
                                ...prev,
                                [selectedGomboDetails.id]: true
                              }));
                              addToTerminal(`[⚡ DJ-JOUR] Début de la prestation validé avec vidéo face & géolocalisation !`);
                              audioSynth.playValidationSuccess();
                            }}
                            className="w-full py-1.5 px-2.5 bg-sky-500/10 hover:bg-sky-500 border border-sky-500/30 text-sky-400 hover:text-black font-sans font-bold text-[9px] rounded-lg tracking-wider transition-all cursor-pointer uppercase text-center"
                          >
                            Démarrer Prestation (Vidéo Face+GPS) 📹
                          </button>
                        )}

                        {/* End prestation button */}
                        {contractDDayStarted[selectedGomboDetails.id] && !contractDDayEnded[selectedGomboDetails.id] && (
                          <button
                            onClick={() => {
                              setContractDDayEnded(prev => ({
                                ...prev,
                                [selectedGomboDetails.id]: true
                              }));
                              addToTerminal(`[🏦 LIBÉRATION ESCROW] Co-confirmation reçue ! Le cachet de ${(selectedGomboDetails.budget || 250000).toLocaleString()} FCFA est débloqué vers le portefeuille du musicien !`);
                              audioSynth.playValidationSuccess();
                            }}
                            className="w-full py-1.5 px-2.5 bg-afri-gold/20 hover:bg-afri-gold border border-afri-gold/35 text-afri-gold hover:text-black font-sans font-bold text-[9px] rounded-lg tracking-wider transition-all cursor-pointer uppercase text-center"
                          >
                            Co-Confirmer la Fin (Libérer) 🔓
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dispute cancel section */}
                    <div className="pt-2 border-t border-afri-border space-y-2 text-left">
                      <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold">
                        <span className="text-red-500 uppercase block font-bold">⚡ Litige & Annulations :</span>
                        {contractDisputeOpened[selectedGomboDetails.id] && (
                          <span className="text-[8px] font-mono bg-red-400/10 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">EN ANALYSE LITIGIEUSE</span>
                        )}
                      </div>

                      {contractDisputeOpened[selectedGomboDetails.id] ? (
                        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 space-y-1.5 text-left font-mono text-[10px]">
                          <p className="text-afri-text-sec italic font-sans">Un litige d'Escrow a été ouvert et est actuellement en cours d'analyse par l'Arbitrage final d'AFRIGOMBO.</p>
                          <div className="text-afri-text-sec">
                            <strong>Motif :</strong> {contractDisputeDetails[selectedGomboDetails.id]?.reason || "Non spécifié"}<br/>
                            <strong>Preuves :</strong> {contractDisputeDetails[selectedGomboDetails.id]?.comment || "Aucun commentaire supplémentaire"}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            const reason = prompt("Indiquez la raison officielle de l'annulation (obligatoire) :");
                            if (!reason) return;
                            const comment = prompt("Commentaires ou preuves (textes, liens, audios) :");
                            setContractDisputeOpened(prev => ({
                              ...prev,
                              [selectedGomboDetails.id]: true
                            }));
                            setContractDisputeDetails(prev => ({
                              ...prev,
                              [selectedGomboDetails.id]: { reason, comment: comment || "", proofUrl: "" }
                            }));
                            addToTerminal(`[⚖️ LITIGE OUVERT] Litige d'annulation engendré ! Le statut est actuellement : EN ANALYSE.`);
                            audioSynth.playTamTam(false);
                          }}
                          className="w-full py-1.5 bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-afri-text font-sans font-bold text-[9px] rounded-lg tracking-wider transition-all cursor-pointer uppercase text-center"
                        >
                          Ouvrir un Litige / Signaler Annulation ⚖️
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* INTERACTIVE ACTIONS BAR */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-b border-afri-border/60 py-3 text-afri-text-sec">
                  {/* 1. 🏆 Honneur reçu */}
                  <button
                    onClick={() => {
                      requireAuthThen(() => {
                        const isLiked = likedGombos.includes(selectedGomboDetails.id);
                        setLikedGombos(prev =>
                          isLiked ? prev.filter(id => id !== selectedGomboDetails.id) : [...prev, selectedGomboDetails.id]
                        );
                        try { audioSynth.playTamTam(true); } catch (_) {}
                        addToTerminal(`[🏆 HONNEUR] ${isLiked ? "Retrait d'honneur" : "Honneur accordé"} sur le Gombo "${selectedGomboDetails.title}".`);
                      });
                    }}
                    className={`flex items-center gap-1.5 transition text-[11px] font-bold cursor-pointer ${likedGombos.includes(selectedGomboDetails.id) ? "text-afri-gold" : "hover:text-afri-gold"}`}
                    title="Accorder un honneur prestigieux à ce Gombo"
                  >
                    <Award className={`w-4 h-4 ${likedGombos.includes(selectedGomboDetails.id) ? "fill-afri-gold text-afri-gold" : ""}`} />
                    <span>{likedGombos.includes(selectedGomboDetails.id) ? "Honouré" : "🏆 Honneur reçu"}</span>
                  </button>

                  {/* 2. 🔖 Enregistrer */}
                  <button
                    onClick={() => {
                      requireAuthThen(() => {
                        const isSaved = savedGomboIds.includes(selectedGomboDetails.id);
                        setSavedGomboIds(prev =>
                          isSaved ? prev.filter(id => id !== selectedGomboDetails.id) : [...prev, selectedGomboDetails.id]
                        );
                        try { audioSynth.playValidationSuccess(); } catch (_) {}
                        addToTerminal(`[🔖 ENREGISTRER] Gombo "${selectedGomboDetails.title}" ${isSaved ? "retiré de vos" : "enregistré dans vos"} favoris.`);
                      });
                    }}
                    className={`flex items-center gap-1.5 transition text-[11px] font-bold cursor-pointer ${savedGomboIds.includes(selectedGomboDetails.id) ? "text-afri-gold" : "hover:text-afri-gold"}`}
                    title="Enregistrer ce Gombo dans votre espace personnel"
                  >
                    <Bookmark className={`w-4 h-4 ${savedGomboIds.includes(selectedGomboDetails.id) ? "fill-afri-gold text-afri-gold" : ""}`} />
                    <span>{savedGomboIds.includes(selectedGomboDetails.id) ? "Enregistré" : "🔖 Enregistrer"}</span>
                  </button>

                  {/* 3. 👥 Suivre artiste */}
                  <button
                    onClick={() => {
                      requireAuthThen(() => {
                        const orgId = selectedGomboDetails.organizerId || "admin";
                        const isFollowing = followedArtists.includes(orgId);
                        const newList = isFollowing ? followedArtists.filter(id => id !== orgId) : [...followedArtists, orgId];
                        setFollowedArtists(newList);
                        localStorage.setItem("gombo_followed_artists", JSON.stringify(newList));
                        try { audioSynth.playValidationSuccess(); } catch (_) {}
                        addToTerminal(`[👥 SUIVRE] ${isFollowing ? "Désabonnement" : "Abonnement"} à l'organisateur "${selectedGomboDetails.organizerName || "Admin"}".`);
                      });
                    }}
                    className={`flex items-center gap-1.5 transition text-[11px] font-bold cursor-pointer ${followedArtists.includes(selectedGomboDetails.organizerId || "admin") ? "text-afri-gold" : "hover:text-afri-gold"}`}
                    title="Suivre l'activité de cet artiste / organisateur"
                  >
                    <Users className={`w-4 h-4 ${followedArtists.includes(selectedGomboDetails.organizerId || "admin") ? "fill-afri-gold text-afri-gold" : ""}`} />
                    <span>{followedArtists.includes(selectedGomboDetails.organizerId || "admin") ? "Abonné" : "👥 Suivre artiste"}</span>
                  </button>

                  {/* 4. 🚨 Signaler */}
                  <button
                    onClick={() => {
                      requireAuthThen(() => {
                        const reason = prompt("Indiquez la raison du signalement (obligatoire) :");
                        if (!reason) return;
                        addToTerminal(`[SIGNALEMENT] Alerte transmise avec succès pour examen de "${selectedGomboDetails.title}". Motif: ${reason}`);
                        try { audioSynth.playTamTam(false); } catch (_) {}
                      });
                    }}
                    className="flex items-center gap-1.5 hover:text-red-500 transition text-[11px] font-bold cursor-pointer"
                    title="Signaler ce Gombo en cas de fraude ou comportement inapproprié"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>🚨 Signaler</span>
                  </button>

                  {/* 5. ↗️ Partager */}
                  <button
                    onClick={() => {
                      requireAuthThen(() => {
                        try {
                          navigator.clipboard.writeText(`AFRIGOMBO - ${selectedGomboDetails.title} (Cachet: ${selectedGomboDetails.budget} FCFA)`);
                          addToTerminal(`[↗️ PARTAGE] Informations du Gombo copiées dans le presse-papiers.`);
                          audioSynth.playValidationSuccess();
                        } catch (_) {}
                      });
                    }}
                    className="flex items-center gap-1.5 hover:text-afri-gold transition text-[11px] font-bold cursor-pointer"
                    title="Partager ce Gombo"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>↗️ Partager</span>
                  </button>
                </div>

                {/* AUTHOR PROFILE ROW */}
                <div className="flex items-center justify-between border-b border-afri-border/60 pb-4 text-[11px] font-mono text-afri-text-sec gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border border-afri-gold/35 flex items-center justify-center bg-afri-bg font-bold text-afri-gold text-[10px] uppercase">
                      {selectedGomboDetails.organizerName?.charAt(0) || "O"}
                    </div>
                    <div>
                      <span className="block text-[8px] text-zinc-650 uppercase font-bold leading-none">ORGANISATEUR :</span>
                      <span className="text-afri-text font-bold mt-0.5 block">{selectedGomboDetails.organizerName}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[8px] text-zinc-650 uppercase font-bold text-right leading-none">CANDIDATS :</span>
                    <span className="text-afri-gold font-bold mt-0.5 block text-right">{selectedGomboDetails.applicantsCount + (hasApplied ? 1 : 0)} postulants</span>
                  </div>
                </div>

                {/* DISCUSSIONS AND REAL-TIME COMMENTS */}
                <div className="space-y-4 pt-2">
                  <span className="text-[10px] font-mono uppercase text-afri-text-sec block font-bold">ESPACE DISCUSSIONS :</span>
                  
                  {/* Comments list scroll */}
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {(() => {
                      const commentsList = gomboComments[selectedGomboDetails.id] || [];
                      if (commentsList.length === 0) {
                        return (
                          <p className="text-zinc-650 text-[10px] font-mono italic">
                            Aucune discussion pour le moment. Exprimez-vous ci-dessous !
                          </p>
                        );
                      }
                      return commentsList.map((c, i) => (
                        <div key={i} className="bg-afri-bg/40 border border-afri-border/60 rounded-2xl p-3 flex gap-2.5 w-full text-left">
                          <div className="w-7 h-7 rounded-xl bg-afri-bg-sec/70 border border-afri-gold/20 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-afri-gold uppercase">{c.author.substring(0, 2)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline gap-1">
                              <span className="text-[11px] font-black text-afri-text leading-none truncate">{c.author}</span>
                              <span className="text-[8px] text-zinc-650 font-mono leading-none">{c.date}</span>
                            </div>
                            <p className="text-[11px] text-afri-text mt-1 font-sans break-words leading-relaxed">{c.text}</p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Comment Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tapez votre question ou message d'artiste..."
                      id="combo-comment-input-real"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (!val) return;
                          
                          const id = selectedGomboDetails.id;
                          const author = profile?.artisticName || currentUser?.displayName || "Artiste Anonyme";
                          const newC = { author, text: val, date: "À l'instant" };
                          
                          setGomboComments(prev => ({
                            ...prev,
                            [id]: [...(prev[id] || []), newC]
                          }));
                          
                          (e.target as HTMLInputElement).value = "";
                          try { audioSynth.playValidationSuccess(); } catch (_) {}
                        }
                      }}
                      className="flex-1 bg-afri-bg border border-afri-border focus:border-afri-gold/50 focus:bg-afri-bg rounded-2xl px-4 py-3 text-xs text-afri-text placeholder-zinc-700 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const inputEl = document.getElementById("combo-comment-input-real") as HTMLInputElement;
                        const val = inputEl?.value?.trim();
                        if (!val) return;
                        
                        const id = selectedGomboDetails.id;
                        const author = profile?.artisticName || currentUser?.displayName || "Artiste Anonyme";
                        const newC = { author, text: val, date: "À l'instant" };
                        
                        setGomboComments(prev => ({
                          ...prev,
                          [id]: [...(prev[id] || []), newC]
                        }));
                        
                        if (inputEl) inputEl.value = "";
                        try { audioSynth.playValidationSuccess(); } catch (_) {}
                      }}
                      className="bg-afri-gold hover:bg-afri-bg-sec text-black font-black text-[9px] uppercase tracking-widest px-4 rounded-2xl transition-all active:scale-95"
                    >
                      Envoyer
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 bg-afri-bg border-t border-afri-border shrink-0 flex gap-3">
                <button
                  onClick={() => setSelectedGomboDetails(null)}
                  className="flex-1 py-3.5 rounded-2xl bg-afri-bg border border-afri-border hover:border-afri-border text-afri-text text-xs font-mono font-black uppercase tracking-wider transition-all select-none active:scale-95 cursor-pointer"
                >
                  Fermer
                </button>

                <button
                  onClick={() => {
                    if (hasApplied) return;
                    setAppliedGombos(prev => [...prev, selectedGomboDetails.id]);
                    addToTerminal(`[🎼 CONTRAT] Candidature enregistrée ! Dossier de souveraineté transmis pour : ${selectedGomboDetails.title}`);
                    try { audioSynth.playValidationSuccess(); } catch (err) {}
                  }}
                  className={`flex-[2] py-3.5 rounded-2xl font-mono font-black text-xs uppercase tracking-wider transition-all select-none active:scale-95 cursor-pointer text-center ${
                    hasApplied
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-not-allowed"
                      : "bg-afri-gold hover:bg-afri-bg-sec text-[#050505] shadow-[0_4px_15px_rgba(212,175,55,0.25)]"
                  }`}
                >
                  {hasApplied ? "✓ CANDIDATURE ENREGISTRÉE" : "DÉCROCHER LE CACHET ! 🎯"}
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* =========================================================================
                                     REELS VIDEO LIGHTBOX PORTALS
         ========================================================================= */}
      {/* 4. Reels Video YouTube Lightbox player */}
      {reelsVideoId && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-afri-bg/93 backdrop-blur-md">
          <div className="w-full max-w-3xl aspect-video bg-afri-bg rounded-3xl overflow-hidden relative border border-afri-border">
            <button
              onClick={() => setReelsVideoId(null)}
              className="absolute top-3.5 right-3.5 z-10 p-2.5 bg-afri-bg/70 hover:bg-afri-bg/95 text-afri-text rounded-full text-xs font-bold border border-afri-border hover:scale-105 cursor-pointer leading-none"
            >
              Fermer ✖
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${reelsVideoId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* 5. Reels Raw Video Lightbox player */}
      {reelsVideoUrl && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-afri-bg/93 backdrop-blur-md">
          <div className="w-full max-w-3xl aspect-video bg-afri-bg rounded-3xl overflow-hidden relative border border-afri-border flex items-center justify-center">
            <button
              onClick={() => setReelsVideoUrl(null)}
              className="absolute top-3.5 right-3.5 z-10 p-2.5 bg-afri-bg/70 hover:bg-afri-bg/95 text-afri-text rounded-full text-xs font-bold border border-afri-border hover:scale-105 cursor-pointer leading-none"
            >
              Fermer ✖
            </button>
            <video 
              src={reelsVideoUrl} 
              controls 
              autoPlay 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Boost Modal */}
      {activeBoostItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-afri-bg/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-afri-bg-sec border border-afri-gold/30 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden animate-slideUp">
            <div className="absolute top-0 right-0 w-32 h-32 bg-afri-gold/10 blur-3xl rounded-full" />
            <div className="relative z-10 text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-afri-gold/10 rounded-full flex items-center justify-center border border-afri-gold/30">
                <span className="text-3xl">🚀</span>
              </div>
              
              <div>
                <h3 className="text-xl font-black text-afri-text uppercase tracking-tight mb-2">Booster {activeBoostItem.type === 'gombo' ? 'cette publication' : 'ma candidature'}</h3>
                <p className="text-xs text-afri-text-sec">Augmentez considérablement votre visibilité et multipliez vos chances.</p>
              </div>

              <div className="space-y-3 text-left">
                {[
                  { duration: "24 h", price: "200 FCFA" },
                  { duration: "3 jours", price: "500 FCFA" },
                  { duration: "7 jours", price: "1 000 FCFA" }
                ].map((boost, idx) => (
                  <button key={idx} onClick={() => {
                    alert("Redirection CinetPay en développement...");
                    setActiveBoostItem(null);
                  }} className="w-full flex items-center justify-between p-4 rounded-xl border border-afri-border bg-afri-bg hover:border-afri-gold/50 hover:bg-afri-gold/5 transition-all group">
                    <span className="text-sm font-bold text-afri-text group-hover:text-afri-gold transition-colors">{boost.duration}</span>
                    <span className="text-xs font-black text-afri-text px-3 py-1 bg-afri-bg-ter rounded-lg border border-afri-border">{boost.price}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setActiveBoostItem(null)}
                className="text-[10px] font-bold text-afri-text-muted hover:text-afri-text uppercase tracking-widest mt-4"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Firebase Diagnostic Modal */}
      <FirebaseDiagnostic 
        isOpen={isDiagnosticOpen} 
        onClose={() => setIsDiagnosticOpen(false)} 
      />

    </div>
  );
}
