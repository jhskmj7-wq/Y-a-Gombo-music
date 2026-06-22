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
  where
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";

const AdminStats = lazy(() => import("./AdminStats"));
const AdminReports = lazy(() => import("./AdminReports"));
const AdminActions = lazy(() => import("./AdminActions"));
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import AuthScreen from "./AuthScreen";
import CompleteProfile from "./CompleteProfile";
import GomboIdUserDashboard from "./GomboIdUserDashboard";
import GomboProfile from "./GomboProfile";
import GomboMusikEcosystem from "./GomboMusikEcosystem";
import { PrivacyPage, TermsPage, DeleteAccountPage } from "./PublicPages";
import FounderThrone from "./FounderThrone";
import MessagesView from "./MessagesView";
import NotificationCenter from "./NotificationCenter";
import ComingSoon from "./ComingSoon";
import { UserTerrainLandingPage } from "./UserTerrainLandingPage";
import SettingsModal from "./SettingsModal";
import AfrigomboPlus from "./AfrigomboPlus";
import MusicianStats from "./MusicianStats";
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
  UserPerformance
} from "../types";
import { audioSynth } from "../lib/audio";
import { interactionBus } from "./LivingInteractions";
import { AfrigomboVibeWaves } from "./AfrigomboVibeWaves";
import { useDynamicPlaceholder } from "../hooks/useDynamicPlaceholder";
import { isSuperFounder } from "../shared/admin/constants";
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
  Play
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

// --- INITIAL RESILIENT DATASETS (OFFLINE-FIRST ACCURATE SIMULATIONS) ---
const INITIAL_USERS: User[] = [
  {
    id: "user_1",
    name: "Ariel Loua",
    email: "ariel.l@gombo.ci",
    artisticName: "Ariel Sheney G",
    commune: "Cocody",
    isCertified: true,
    kycStatus: "approved",
    status: "active",
    specialties: ["Coupé-Décalé", "Arrangement", "Clavier"],
    groups: ["Yorogang Orchestra", "Ariel Crew"],
    performance: { level: 4, score: 82, artisticName: "Ariel Sheney G", commune: "Cocody", specialties: ["Coupé-Décalé", "Arrangement"], groups: ["Yorogang"] },
    registrationDate: "2026-01-14",
    revenues: 1250000,
    gombosCompleted: 24,
    flagsCount: 0
  },
  {
    id: "user_2",
    name: "Mireille Gbado",
    email: "mireille@gombo.ci",
    artisticName: "Kady de Yopougon",
    commune: "Yopougon",
    isCertified: false,
    kycStatus: "pending",
    status: "active",
    specialties: ["Zouglou Vocals", "Percussion"],
    groups: ["Femmes Zouglou de Yop"],
    performance: { level: 3, score: 55, artisticName: "Kady de Yopougon", commune: "Yopougon", specialties: ["Zouglou"], groups: ["Femmes Zouglou"] },
    registrationDate: "2026-03-02",
    revenues: 450000,
    gombosCompleted: 9,
    flagsCount: 0
  },
  {
    id: "user_3",
    name: "Bakary Diarrassouba",
    email: "bamba.b@gombo.ci",
    artisticName: "DJ Vieux Bamba",
    commune: "Adjamé",
    isCertified: false,
    kycStatus: "none",
    status: "suspect",
    specialties: ["Mixage", "Afrobeats DJ"],
    groups: ["Stars d'Adjamé"],
    performance: { level: 2, score: 32, artisticName: "DJ Vieux Bamba", commune: "Adjamé", specialties: ["DJ"], groups: ["Stars"] },
    registrationDate: "2026-05-18",
    revenues: 180000,
    gombosCompleted: 3,
    flagsCount: 3
  }
];

const INITIAL_GOMBOS: Gombo[] = [
  {
    id: "gombo_1",
    title: "🎖️ Grand Concert Réveillon Select",
    description: "Recherche bassiste et guitariste soliste de Zouglou hautement qualifiés. Prestation en direct pour un parterre diplomatique distingué au cœur du Plateau.",
    budget: 450000,
    commissionRate: 0.10,
    location: "Plateau",
    organizerId: "org_1",
    organizerName: "Le Caveau Elite Venue",
    timestamp: "2026-06-10T09:00:00Z",
    applicantsCount: 6,
    status: "open",
    isBoosted: true,
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
    date: "15 Juin 2026",
    isUrgent: true,
    isPopular: false
  },
  {
    id: "gombo_2",
    title: "💍 Célébration Nuptiale Royale",
    description: "Prestation de prestige de 4 heures par un orchestre de haut standing. Répertoire fusion classique, rumba et coupé-décalé raffiné.",
    budget: 1200000,
    commissionRate: 0.12,
    location: "Marcory",
    organizerId: "org_2",
    organizerName: "Hôtel Ivoire Prestige",
    timestamp: "2026-06-10T08:30:00Z",
    applicantsCount: 14,
    status: "open",
    imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop&q=80",
    date: "20 Juin 2026",
    isUrgent: false,
    isPopular: true
  },
  {
    id: "gombo_3",
    title: "🎙️ Cabaret Acoustic Heritage & Soul",
    description: "Recherche diva ou ténor de jazz moderne d'Abidjan pour session de lounge intime. Performance entourée d'un trio acoustique d'élite.",
    budget: 350000,
    commissionRate: 0.15,
    location: "Cocody",
    organizerId: "org_3",
    organizerName: "Le Toit d'Abidjan Lounge",
    timestamp: "2026-06-10T07:20:00Z",
    applicantsCount: 4,
    status: "open",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
    date: "12 Juin 2026",
    isUrgent: false,
    isPopular: true
  },
  {
    id: "gombo_4",
    title: "🎻 Cocktail d'Ambassade Aristocratique",
    description: "Cocktail d'expatriés recherchant des joueurs virtuoses d'instruments folkloriques d'Afrique de l'Ouest (Kora ou Balafon concertiste).",
    budget: 950000,
    commissionRate: 0.10,
    location: "Plateau",
    organizerId: "org_4",
    organizerName: "Résidence de l'Ambassadeur",
    timestamp: "2026-06-10T05:10:00Z",
    applicantsCount: 9,
    status: "open",
    imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&auto=format&fit=crop&q=80",
    date: "18 Juin 2026",
    isUrgent: true,
    isPopular: false
  },
  {
    id: "gombo_5",
    title: "🎧 Nuit Électro-Sabar d'Abidjan",
    description: "Performance haut de gamme mêlant percussions traditionnelles de Côte d'Ivoire et synthétiseurs modernes sous la houlette d'un DJ d'exception.",
    budget: 500000,
    commissionRate: 0.12,
    location: "Treichville",
    organizerId: "org_5",
    organizerName: "Studio Monument National",
    timestamp: "2026-06-09T21:40:00Z",
    applicantsCount: 7,
    status: "open",
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80",
    date: "25 Juin 2026",
    isUrgent: false,
    isPopular: false
  }
];

const INITIAL_ALERTS: Alerte[] = [
  {
    id: "alert_1",
    userId: "user_3",
    userArtisticName: "DJ Vieux Bamba",
    reason: "Multiples signalements pour non-présentation sur un Gombo négocié.",
    severity: "high",
    timestamp: "2026-06-10T07:15:00Z",
    status: "open"
  },
  {
    id: "alert_2",
    userId: "user_2",
    userArtisticName: "Kady de Yopougon",
    reason: "Tentative de contournement de la commission de caisse.",
    severity: "medium",
    timestamp: "2026-06-10T06:40:00Z",
    status: "open"
  }
];

const ANALYTICS_DATA = [
  { name: "Lun", inscrits: 22, gombos: 15, commission: 85000 },
  { name: "Mar", inscrits: 35, gombos: 28, commission: 142000 },
  { name: "Mer", inscrits: 41, gombos: 32, commission: 185000 },
  { name: "Jeu", inscrits: 32, gombos: 24, commission: 120000 },
  { name: "Ven", inscrits: 58, gombos: 41, commission: 260000 },
  { name: "Sam", inscrits: 84, gombos: 62, commission: 415000 },
  { name: "Dim", inscrits: 61, gombos: 39, commission: 290000 }
];

const INITIAL_REVIEWS: GomboReview[] = [
  {
    id: "rev_1",
    gomboId: "gombo_1",
    gomboTitle: "🎖️ Grand Concert Réveillon Select",
    reviewerId: "org_1",
    reviewerName: "Le Caveau Elite Venue",
    revieweeId: "user_1",
    revieweeName: "Ariel Loua",
    rating: 5,
    comment: "Prestation magistrale ! Ariel a enflammé la scène diplomatique hier soir. Grand professionnalisme.",
    timestamp: "2026-06-11T23:00:00Z",
    type: "client_to_musician"
  },
  {
    id: "rev_2",
    gomboId: "gombo_1",
    gomboTitle: "🎖️ Grand Concert Réveillon Select",
    reviewerId: "user_1",
    reviewerName: "Ariel Loua",
    revieweeId: "org_1",
    revieweeName: "Le Caveau Elite Venue",
    rating: 5,
    comment: "Superbe accueil au Caveau, sonorisation digne des standards internationaux et cachet versé sans délai.",
    timestamp: "2026-06-12T00:15:00Z",
    type: "musician_to_client"
  }
];

interface AdminCentreProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

import WakandaTechBackground from "./WakandaTechBackground";

export default function AdminCentre({ darkMode, setDarkMode }: AdminCentreProps) {
  const dynamicPlaceholder = useDynamicPlaceholder([
    "Rechercher un artiste...",
    "Trouver une collaboration...",
    "Découvrir une opportunité...",
    "Chercher un beatmaker...",
    "Trouver un studio..."
  ]);
  const { currentUser, profile, logout, refreshProfile, setProfile, loginWithGoogle } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [showGoogleLoginRequiredModal, setShowGoogleLoginRequiredModal] = useState<boolean>(false);

  const requireGoogleAuthThen = (action: () => void) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      try { audioSynth.playKoraSuccess(); } catch (err) {}
    } else {
      const hasGoogle = currentUser.providerData.some(
        (p) => p.providerId === "google.com" || p.providerId.includes("google")
      );
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
      setIsAuthModalOpen(true);
      try { audioSynth.playKoraSuccess(); } catch (err) {}
    } else {
      action();
    }
  };

  const [activeMenu, setActiveMenu] = useState<any>("user_terrain");
  const [reelsVideoId, setReelsVideoId] = useState<string | null>(null);
  const [reelsVideoUrl, setReelsVideoUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeMenu]);
  const [viewingGomboIdDetail, setViewingGomboIdDetail] = useState<boolean>(false);
  const [selectedGomboDetails, setSelectedGomboDetails] = useState<Gombo | null>(null);
  const [openConvoWithUserId, setOpenConvoWithUserId] = useState<string | null>(null);
  
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
  const { t, language: lang, setLanguage } = useLanguage();

  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState<boolean>(false);
  const [perspective, setPerspective] = useState<"admin" | "user">("user");
  const [liveAdminTime, setLiveAdminTime] = useState<string>(new Date().toLocaleTimeString("fr-FR"));

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveAdminTime(new Date().toLocaleTimeString("fr-FR"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [activeArtistId, setActiveArtistId] = useState<string>("user_3");
  const [localSaved, setLocalSaved] = useState<boolean>(true);
  const [autoSaveActive, setAutoSaveActive] = useState<boolean>(false);

  const [realNotifications, setRealNotifications] = useState<any[]>([]);
  useEffect(() => {
    if (currentUser?.uid) {
      const unsubscribe = gomboDB.listenToNotifications(currentUser.uid, setRealNotifications);
      return () => unsubscribe();
    }
  }, [currentUser?.uid]);

  // Le Terrain, Vibes, and dynamic publishing interactions states
  const { isBatteryLow, isSlowConnection, isDataSaveActive, isBatterySaveActive, areAnimationsReduced } = usePerformance();
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
  
  // Real contract active tracking states
  const [contractRepsConfirmed, setContractRepsConfirmed] = useState<Record<string, number>>({});
  const [contractRepsOrganizerValidated, setContractRepsOrganizerValidated] = useState<Record<string, number>>({});
  const [contractDDayStarted, setContractDDayStarted] = useState<Record<string, boolean>>({});
  const [contractDDayEnded, setContractDDayEnded] = useState<Record<string, boolean>>({});
  const [contractDisputeOpened, setContractDisputeOpened] = useState<Record<string, boolean>>({});
  const [contractDisputeDetails, setContractDisputeDetails] = useState<Record<string, { reason: string, comment: string, proofUrl: string }>>({});
  
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
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

  const AUTHORIZED_ADMIN_EMAILS = [
    "johnsylvesterh@gmail.com",
    "sylvestrehounkpevi777@gmail.com",
    "jhs.kmj7@gmail.com"
  ];

  const userEmail = currentUser?.email?.toLowerCase() || "";
  const isAuthorizedAdmin = !!(currentUser && AUTHORIZED_ADMIN_EMAILS.includes(userEmail));
  const isAuthorizedSuperFounder = !!(currentUser && userEmail === "jhs.kmj7@gmail.com");

  // Keep adminEmail synced with actual firebase user email for database operations
  useEffect(() => {
    if (currentUser?.email) {
      setAdminEmail(currentUser.email);
    }
  }, [currentUser]);

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
  const [themeMode, setThemeMode] = useState<"dark-gold" | "light-gold" | "night-navy">(() => {
    return (localStorage.getItem("gombo_theme_mode") as any) || "dark-gold";
  });

  // Custom Reviews & Gombo completeness state
  const [reviews, setReviews] = useState<GomboReview[]>(INITIAL_REVIEWS);
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


  // --- CORE APPLICATION STATES ---
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [gombos, setGombos] = useState<Gombo[]>(INITIAL_GOMBOS);
  const [alerts, setAlerts] = useState<Alerte[]>(INITIAL_ALERTS);
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "post_1",
      userId: "user_3",
      authorName: "Bakary Diarrassouba",
      authorArtisticName: "DJ Vieux Bamba",
      content: "Vente de micros contrefaits Shure SM58 - Stock disponible en cachette à Adjamé.",
      likes: 0,
      comments: 1,
      isFlagged: true,
      flagReason: "Vente de matériel contrefait",
      timestamp: "2026-06-10T04:20:00Z",
      aiModerated: true,
      category: "Recherche",
      tags: ["#studio", "#micro"],
      shares: 0,
      views: 12
    },
    {
      id: "post_2",
      userId: "user_1",
      authorName: "Ariel Loua",
      authorArtisticName: "Ariel Sheney G",
      content: "Showcase déjanté ce soir à la Villa d'Or de Cocody! Tous les Gombos du tam-tam sont les bienvenus 🔥",
      likes: 124,
      comments: 18,
      isFlagged: false,
      timestamp: "2026-06-19T22:15:00Z",
      mediaUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
      category: "Événement",
      tags: ["#afrobeats", "#concert", "#abidjan"],
      shares: 14,
      views: 685
    },
    {
      id: "post_3",
      userId: "user_2",
      authorName: "Mireille Gbado",
      authorArtisticName: "Kady de Yopougon",
      content: "Recherche d'urgence un arrangeur de talent (Beatmaker) spécialisé Zouglou pour finaliser mon prochain EP au studio de Yopougon. Projetez vos forces !",
      likes: 37,
      comments: 4,
      isFlagged: false,
      timestamp: "2026-06-19T14:24:00Z",
      mediaUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80",
      category: "Collaboration",
      tags: ["#zouglou", "#studio", "#beatmaker"],
      shares: 5,
      views: 247
    },
    {
      id: "post_4",
      userId: "user_1",
      authorName: "Ariel Loua",
      authorArtisticName: "Ariel Sheney G",
      content: "Nouveau pack de beats Afro-fusion gratuit disponible pour les artistes de l'Académie ! Écrivez-moi directement pour recevoir le lien d'écoute haute qualité.",
      likes: 92,
      comments: 11,
      isFlagged: false,
      timestamp: "2026-06-19T08:10:00Z",
      mediaUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
      category: "Opportunité",
      tags: ["#afrobeats", "#instrumental", "#souverainete"],
      shares: 19,
      views: 412
    }
  ]);
  const [renforts, setRenforts] = useState<Renfort[]>([
    {
      id: "renfort_1",
      gomboId: "gombo_1",
      gomboTitle: "Concert de Gala - Réveillon Privé Abidjan",
      applicantId: "user_2",
      applicantName: "Mireille Gbado",
      applicantArtisticName: "Kady de Yopougon",
      instrument: "Vocaliste & Chœur",
      status: "pending",
      timestamp: "2026-06-10T09:12:00Z"
    }
  ]);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "tx_1",
      amount: 35000,
      type: "commission",
      description: "Commission 10% sur Gombo #gombo_1 d'Ariel Loua",
      userId: "user_1",
      userArtisticName: "Ariel Sheney G",
      timestamp: "2026-06-10T08:14:00Z"
    },
    {
      id: "tx_2",
      amount: 50000,
      type: "subscription",
      description: "Abonnement Annuel Elite Premium - Kady de Yop",
      userId: "user_2",
      userArtisticName: "Kady de Yopougon",
      timestamp: "2026-06-09T14:32:00Z"
    }
  ]);

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
    if (!currentUser) return;
    // Attempt Firestore subscription & binding
    try {
      const qUsers = collection(db, "users");
      const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
        if (!snapshot.empty) {
          const fetchedUsers: User[] = [];
          snapshot.forEach((docSnap) => {
            fetchedUsers.push({ id: docSnap.id, ...docSnap.data() } as User);
          });
          setUsers(fetchedUsers);
          addToTerminal(`[INFO] Synchronisation : ${fetchedUsers.length} comptes synchronisés depuis Firestore.`);
        }
      }, (error) => {
        addToTerminal(`[Alerte réseau] Firestore non-accessible directement. Mode local premium activé.`);
      });

      const qGombos = collection(db, "gombos");
      const unsubscribeGombos = onSnapshot(qGombos, (snapshot) => {
        if (!snapshot.empty) {
          const fetchedGombos: Gombo[] = [];
          snapshot.forEach((docSnap) => {
            fetchedGombos.push({ id: docSnap.id, ...docSnap.data() } as Gombo);
          });
          setGombos(fetchedGombos);
        }
      }, (error) => {
        console.warn("🔐 Gombos sync limited or offline:", error.message);
      });

      const qTransactions = collection(db, "transactions");
      const unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
        if (!snapshot.empty) {
          const fetchedTransactions: Transaction[] = [];
          snapshot.forEach((docSnap) => {
            fetchedTransactions.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
          });
          // Sort transactions by timestamp desc
          fetchedTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setTransactions(fetchedTransactions);
        }
      }, (error) => {
        console.warn("🔐 Transactions sync restricted for current user role:", error.message);
      });

      const qReviews = collection(db, "reviews");
      const unsubscribeReviews = onSnapshot(qReviews, (snapshot) => {
        if (!snapshot.empty) {
          const fetchedReviews: GomboReview[] = [];
          snapshot.forEach((docSnap) => {
            fetchedReviews.push({ id: docSnap.id, ...docSnap.data() } as GomboReview);
          });
          setReviews(fetchedReviews);
        }
      }, (error) => {
        console.warn("🔐 Reviews sync limited or offline:", error.message);
      });

      const qAlerts = collection(db, "alerts");
      const unsubscribeAlerts = onSnapshot(qAlerts, (snapshot) => {
        if (!snapshot.empty) {
          const fetchedAlerts: Alerte[] = [];
          snapshot.forEach((docSnap) => {
            fetchedAlerts.push({ id: docSnap.id, ...docSnap.data() } as Alerte);
          });
          setAlerts(fetchedAlerts);
        }
      }, (error) => {
        console.warn("🔐 Alerts sync restricted for current user role:", error.message);
      });

      const qPosts = collection(db, "posts");
      const unsubscribePosts = onSnapshot(qPosts, (snapshot) => {
        if (!snapshot.empty) {
          const fetchedPosts: Post[] = [];
          snapshot.forEach((docSnap) => {
            fetchedPosts.push({ id: docSnap.id, ...docSnap.data() } as Post);
          });
          fetchedPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setPosts(fetchedPosts);
        }
      }, (error) => {
        console.warn("🔐 Posts sync limited or offline:", error.message);
      });

      const qLogs = collection(db, "admin_logs");
      const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
        if (!snapshot.empty) {
          const fetchedLogs: any[] = [];
          snapshot.forEach((docSnap) => {
            fetchedLogs.push({ id: docSnap.id, ...docSnap.data() });
          });
          fetchedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setAdminLogs(fetchedLogs);
        }
      }, (error) => {
        console.warn("🔐 Logs sync limited:", error.message);
      });

      return () => {
        unsubscribeUsers();
        unsubscribeGombos();
        unsubscribeTransactions();
        unsubscribeReviews();
        unsubscribeAlerts();
        unsubscribePosts();
        unsubscribeLogs();
      };
    } catch (e) {
      addToTerminal(`[Alerte locale] Lancement offline synchronisé.`);
    }
  }, [currentUser]);

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

  // --- SYNC /FOUNDER-THRONE PATH & ACCESS PRIVILEGES ---
  useEffect(() => {
    const currentPath = window.location.pathname;

    if (currentPath === "/founder-throne") {
      if (isAuthorizedSuperFounder) {
        if (activeMenu !== "super_admin") {
          setActiveMenu("super_admin");
          setPerspective("admin");
          addToTerminal(`[Trône] Accès direct autorisé au Fondateur.`);
        }
      } else {
        addToTerminal(`[SÉCURITÉ] Tentative de contournement URI Super Admin bloquée.`);
        window.history.replaceState({}, "", "/");
        setPerspective("user");
        setActiveMenu("user_terrain");
      }
    } else {
      if (activeMenu === "super_admin") {
        if (isAuthorizedSuperFounder) {
          window.history.pushState({}, "", "/founder-throne");
        } else {
          setActiveMenu("dashboard");
        }
      }
    }
  }, [currentUser, activeMenu, isAuthorizedSuperFounder]);

  // Handle browser back button (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === "/founder-throne") {
        if (isAuthorizedSuperFounder) {
          setActiveMenu("super_admin");
          setPerspective("admin");
        } else {
          window.history.replaceState({}, "", "/");
          setPerspective("user");
          setActiveMenu("user_terrain");
        }
      } else {
        if (activeMenu === "super_admin") {
          setActiveMenu("dashboard");
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentUser, activeMenu, isAuthorizedSuperFounder]);

  // Synchroniser les routes d'adresse pathname (/home, /complete-profile)
  useEffect(() => {
    const handlePathnameSync = () => {
      const path = window.location.pathname;
      if (path === "/home" || path === "/home/") {
        if (activeMenu !== "user_terrain") {
          setActiveMenu("user_terrain");
        }
      }
    };
    
    handlePathnameSync();
    
    window.addEventListener("popstate", handlePathnameSync);
    return () => window.removeEventListener("popstate", handlePathnameSync);
  }, [activeMenu]);

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
        alert("🔒 ACCÈS DÉFENDU\n\nVotre compte Gmail d'artiste ne possède pas les accréditations requises pour administrer AFRIGOMBO.");
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
    setSavedGomboIds(prev => {
      const isSaved = prev.includes(id);
      if (isSaved) {
        addToTerminal(`[📌 PERSISTENCE] Gombo retiré du coffre-fort d'or.`);
        return prev.filter(gid => gid !== id);
      } else {
        addToTerminal(`[📌 PERSISTENCE] Gombo précieusement sauvegardé dans votre coffre-fort d'or.`);
        return [...prev, id];
      }
    });
  };

  const toggleHonorGombo = (id: string) => {
    setHonoredGomboIds(prev => {
      const isHonored = prev.includes(id);
      if (isHonored) {
        return prev.filter(gid => gid !== id);
      } else {
        addToTerminal(`[❤️ COEUR] Vous honorez solennellement ce Gombo d'un témoignage de respect.`);
        return [...prev, id];
      }
    });
  };

  const applyToGombo = async (id: string) => {
    setGombos(prev =>
      prev.map(g => {
        if (g.id === id) {
          const alreadyApplied = renforts.some(r => r.gomboId === id && r.applicantId === "current_user");
          if (alreadyApplied) return g;
          return { ...g, applicantsCount: g.applicantsCount + 1 };
        }
        return g;
      })
    );

    // Create a new Renfort (applicant request)
    const alreadyApplied = renforts.some(r => r.gomboId === id && r.applicantId === "current_user");
    if (alreadyApplied) {
      addToTerminal(`[⚠️ DOUBLON] L'appel du Tam-Tam a déjà été entendu pour ce Gombo.`);
      return;
    }

    const gombo = gombos.find(g => g.id === id);
    if (!gombo) return;

    const newRenfort: Renfort = {
      id: "renfort_" + Date.now(),
      gomboId: id,
      gomboTitle: gombo.title,
      applicantId: "current_user",
      applicantName: "Artiste Majestueux",
      applicantArtisticName: "Mon Nom d'Artiste",
      instrument: "Chant / Instrumentiste Elite",
      status: "pending",
      timestamp: new Date().toISOString()
    };

    setRenforts(prev => [newRenfort, ...prev]);
    await saveToFirestore("renforts", newRenfort.id, newRenfort);
    addToTerminal(`[🎤 CANDIDATURE] Félicitations ! Votre candidature pour "${gombo.title}" a été envoyée sur le réseau céleste.`);
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

  const handleApproveKYC = async (userId: string, express: boolean = false) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const code = (targetUser.artisticName || "ELT").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "ELT";
    const digits = Math.floor(10000 + Math.random() * 90000); // 5 digits
    const gmbId = `GMB-${code}-${digits}`;

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
          gomboIdNumber: gmbId,
          gomboId: gomboIdObj,
          kycApprovedDate: new Date().toLocaleDateString("fr-FR")
        };
        saveToFirestore("users", user.id, u);
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

  const isCompleteProfilePath = typeof window !== 'undefined' && (window.location.pathname === "/complete-profile" || window.location.pathname === "/complete-profile/");
  const profileSkippedLocally = typeof window !== 'undefined' && localStorage.getItem("gombo_profile_skipped") === "true";
  
  const hasIncompleteProfile = currentUser && profile && profile.isProfileComplete === false && !profile.profileSkipped && !profile.skippedProfile && !profileSkippedLocally;
  const shouldShowOnboarding = hasIncompleteProfile || (currentUser && isCompleteProfilePath);

  if (shouldShowOnboarding) {
    return (
      <div className="w-full min-h-screen bg-[#0B0B0B] flex items-center justify-center py-6 overflow-y-auto px-4 font-sans select-none">
        <CompleteProfile 
          currentUserProfile={profile} 
          onComplete={async () => {
            addToTerminal("[🛡️ ONBOARDING] Accès autorisé à l'écosystème Y'A GOMBO MUSIC.");
            // Set browser URL back to /home
            if (typeof window !== 'undefined') {
              window.history.pushState({}, "", "/home");
            }
            await refreshProfile();
            // Force state reload
            window.location.reload(); 
          }} 
        />
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${darkMode ? "bg-[#0B0B0B] text-[#F5F5F5]" : "bg-[#F9FBFA] text-[#111]"} font-sans antialiased overflow-hidden uppercase-none`}>
      
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
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 cursor-pointer pointer-events-auto"
              onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sliding Sidebar of sovereign tools */}
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed inset-y-0 left-0 w-80 bg-[#09090A] border-r border-[#D4AF37]/30 flex flex-col justify-between z-50 shrink-0 h-screen overflow-y-auto pb-8"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {/* SIDEBAR CONTAINER SCROLL */}
              <div className="flex flex-col min-h-full justify-between">
                
                {/* TOP PART */}
                <div>
                  {/* BRAND HEADER LINE */}
                  <div className="p-5 border-b border-[#D4AF37]/15 bg-black/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/50 flex items-center justify-center animate-pulse">
                        <Flame className="text-[#D4AF37] w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-sans font-black tracking-widest text-[#D4AF37] uppercase">
                          ═══ AFRIGOMBO ═══
                        </h2>
                        <span className="text-[8px] font-mono tracking-widest text-zinc-400 block -mt-0.5">
                          L'ELITE MUSICALE IVOIRIENNE
                        </span>
                      </div>
                    </div>

                    {/* OUTLET CLOSE */}
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1.5 rounded-lg border border-[#D4AF37]/35 text-[#D4AF37] hover:text-white hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
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
                          setIsAuthModalOpen(true);
                          try { audioSynth.playKoraSuccess(); } catch (err) {}
                        }}
                        className="w-full bg-[#D4AF37] hover:bg-[#B48F17] text-[#0B0B0B] rounded-xl p-3.5 text-center cursor-pointer font-black tracking-wider transition-all duration-200 shadow-lg flex flex-col items-center justify-center gap-1 border border-transparent"
                      >
                        <Flame className="w-5 h-5 fill-current text-[#0B0B0B]" />
                        <div className="text-[10px] uppercase font-bold leading-tight text-[#0B0B0B]">
                          ACCÈS PRESTIGE ELITE
                        </div>
                        <div className="text-[9px] uppercase font-mono font-extrabold bg-[#0B0B0B] text-[#D4AF37] px-2 py-0.5 rounded">
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
                          <div className="bg-zinc-950/80 border border-[#D4AF37]/20 rounded-xl p-4 space-y-3 shadow-md">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                <div className="w-11 h-11 rounded-full border border-[#D4AF37]/60 overflow-hidden bg-[#D4AF37]/10 flex items-center justify-center font-display font-black">
                                  {currentArtist && (currentArtist.avatarUrl || (currentArtist as any).photoURL) ? (
                                    <img 
                                      src={currentArtist.avatarUrl || (currentArtist as any).photoURL} 
                                      alt={currentArtist.artisticName} 
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <Music className="w-5 h-5 text-[#D4AF37]" />
                                  )}
                                </div>
                                {currentArtist?.isCertified && (
                                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border border-black flex items-center justify-center" title="Certifié">
                                    <span className="text-[9px] text-white font-bold">✓</span>
                                  </span>
                                )}
                              </div>
                              
                              <div className="min-w-0">
                                <h3 className="text-xs font-sans font-black text-white leading-tight truncate">
                                  {currentArtist ? currentArtist.artisticName : "Artiste Invité"}
                                </h3>
                                <p className="text-[9px] text-[#D4AF37] font-mono uppercase tracking-wide font-bold">
                                  {currentArtist ? currentArtist.commune : "Abidjan"}, CI
                                </p>
                                <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] text-[8px] font-mono uppercase border border-[#D4AF37]/25 font-extrabold">
                                  👑 {lang === "nouchi" ? "Vieux Môgô" : (lang === "en" ? "Elite Artist" : "Artiste Élite")}
                                </span>
                              </div>
                            </div>
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
                              if (isInactive) {
                                try { audioSynth.playTamTam(false); } catch (_) {}
                                alert(`👑 Ce service "${label}" sera disponible lors du lancement de la version bêta publique AFRIGOMBO Elite !`);
                              } else {
                                actionOnSelect();
                              }
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2 text-left rounded-xl text-xs font-sans font-bold transition-all ${
                              isInactive 
                                ? "text-zinc-600 hover:text-zinc-400 bg-transparent cursor-pointer"
                                : "text-zinc-300 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 cursor-pointer"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <span className="text-sm shrink-0">{icon}</span>
                              <span className={isInactive ? "opacity-75" : ""}>{label}</span>
                            </span>
                            {customBadge ? customBadge : (
                              isInactive ? (
                                <span className="text-[7.5px] font-mono py-0.5 px-1.5 bg-zinc-900 border border-zinc-800 text-[#D4AF37]/75 rounded uppercase font-black tracking-tighter">
                                  Bientôt dispo
                                </span>
                              ) : null
                            )}
                          </motion.button>
                        );
                      };

                      return (
                        <div className="space-y-4">
                          
                          {/* SECTION: Outils rapides */}
                          <div className="space-y-1">
                            <span className="px-3.5 text-[8.5px] font-mono font-black text-zinc-500 uppercase tracking-widest block mb-1">
                              ⚡ {t('recherche')}
                            </span>
                            {renderMenuItem("menu_events", "Événements", "📅", () => {
                              setIsEventsModalOpen(true);
                              setIsSidebarOpen(false);
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            }, false, <span className="text-[7px] font-mono py-0.5 px-1.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded border border-[#D4AF37]/10 uppercase font-black">LIVE</span>)}
                            {renderMenuItem("menu_reels", "Vidéos Réelles", "🎥", () => {
                              setPerspective("user");
                              setActiveMenu("user_reels");
                              setIsSidebarOpen(false);
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            }, false, <span className="text-[7px] font-mono py-0.5 px-1.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded border border-[#D4AF37]/10 uppercase font-black" style={{ contentVisibility: 'auto' }}>NEW</span>)}
                            {renderMenuItem("menu_favorites", "Favoris", "⭐", () => {}, true)}
                            {renderMenuItem("menu_history", "Historique", "🕓", () => {}, true)}
                            {renderMenuItem("menu_near_opports", "Opportunités proches", "📍", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_opportunities");
                                setIsSidebarOpen(false);
                                try { audioSynth.playValidationSuccess(); } catch (_) {}
                              });
                            }, false, <span className="text-[7px] font-mono py-0.5 px-1.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/10 uppercase font-black">DISPO</span>)}
                            {renderMenuItem("menu_trends", "Tendances", "🏆", () => {}, true)}
                            {renderMenuItem("menu_invites", "Invitations", "🎟", () => {}, true)}
                          </div>

                          {/* SEPARATOR */}
                          <div className="border-t border-zinc-900 my-1" />

                          {/* SECTION: Univers AFRI */}
                          <div className="space-y-1">
                            <span className="px-3.5 text-[8.5px] font-mono font-black text-zinc-500 uppercase tracking-widest block mb-1">
                              🌍 Univers AFRI
                            </span>
                            {renderMenuItem("menu_afri_id", "AfriID", "🆔", () => {
                              addToTerminal("🌍 AFRIID : Identité centrale en préparation...");
                            }, false, <span className="text-[7px] font-mono py-0.5 px-1.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/10 uppercase font-black">EN PRÉPARATION</span>)}
                            {renderMenuItem("menu_wallet", "Wallet", "💳", () => {}, true)}
                            {renderMenuItem("menu_afritrust", "AfriTrust", "🛡️", () => {
                              addToTerminal("🛡️ AFRITRUST : Certification & Confiance en développement...");
                            }, false, <span className="text-[7px] font-mono py-0.5 px-1.5 bg-green-500/10 text-green-400 rounded border border-green-500/10 uppercase font-black">DÉVELOPPEMENT</span>)}
                            {renderMenuItem("menu_afrilivraison", "AfriLivraison", "🚚", () => {
                              addToTerminal("🚚 AFRILIVRAISON : Logistique intelligente en développement...");
                            }, false, <span className="text-[7px] font-mono py-0.5 px-1.5 bg-orange-500/10 text-orange-400 rounded border border-orange-500/10 uppercase font-black">DÉVELOPPEMENT</span>)}
                          </div>

                          {/* SEPARATOR */}
                          <div className="border-t border-zinc-900 my-1" />

                          {/* SECTION: Centre personnel */}
                          <div className="space-y-1">
                            <span className="px-3.5 text-[8.5px] font-mono font-black text-zinc-400 uppercase tracking-widest block mb-1">
                              👑 Centre personnel
                            </span>
                            {renderMenuItem("menu_inventory", t('terrain'), "🗺️", () => {
                              setPerspective("user");
                              setActiveMenu("user_terrain");
                              setIsSidebarOpen(false);
                            }, false)}
                            {renderMenuItem("menu_heritage", t('heritage'), "👑", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_edit_profile");
                                setIsSidebarOpen(false);
                              });
                            }, false)}
                            {renderMenuItem("menu_comms", t('commentaires'), "💬", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_notifications"); // or a specific comments view if exists
                                setIsSidebarOpen(false);
                              });
                            }, false)}
                            {renderMenuItem("menu_pubs", t('publications'), "📝", () => {
                              setPerspective("user");
                              setActiveMenu("user_terrain"); // showing personal posts
                              setIsSidebarOpen(false);
                            }, false)}
                            {renderMenuItem("menu_msgs", t('messages'), "📩", () => {
                               requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_messages");
                                setIsSidebarOpen(false);
                               });
                            }, false)}
                            {renderMenuItem("menu_confidentiality", "Confidentialité", "🔒", () => {
                              setPerspective("user");
                              setActiveMenu("privacy");
                              setIsSidebarOpen(false);
                              try { audioSynth.playValidationSuccess(); } catch (_) {}
                            }, false)}
                            {renderMenuItem("menu_settings", "Paramètres", "⚙", () => {
                              requireAuthThen(() => {
                                setPerspective("user");
                                setActiveMenu("user_settings");
                                setIsSidebarOpen(false);
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
                                {lang === "nouchi" ? "Nouchi 🇨🇮" : (lang === "en" ? "English 🇺🇸" : "Français 🇫🇷")}
                              </span>
                            ))}
                          </div>

                          {/* SEPARATOR */}
                          <div className="border-t border-zinc-900 my-1" />

                          {/* SECTION: Système */}
                          <div className="space-y-1">
                            <span className="px-3.5 text-[8.5px] font-mono font-black text-zinc-500 uppercase tracking-widest block mb-1">
                              🛠 Système
                            </span>
                            {renderMenuItem("menu_downloads", "Téléchargements", "📥", () => {}, true)}
                            {renderMenuItem("menu_backups", "Sauvegardes", "💾", () => {}, true)}
                            {renderMenuItem("menu_statistics", "Statistiques", "📊", () => {}, true)}
                            
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
                                  setIsSidebarOpen(false);
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
                <div className="p-5 bg-black/40 border-t border-[#D4AF37]/15 text-center space-y-1 font-mono">
                  <p className="text-[8.5px] text-[#D4AF37] font-bold uppercase tracking-widest">
                    AFRIGOMBO ELITE V2.0
                  </p>
                  <p className="text-[7.5px] text-zinc-500">
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
        className="flex-1 min-w-0 w-full max-w-full bg-[#0B0B0B] flex flex-col overflow-hidden"
      >
        
        {/* ELITE UPPER STATUS BAR (AFRIGOMBO PREMIUM HEADER) */}
        <header className="flex justify-between items-center px-4 sm:px-8 pt-6 pb-5 border-b border-[#D4AF37]/15 shrink-0 gap-2 w-full animate-fadeIn select-none">
          {isHeaderSearchOpen ? (
            <div className="flex-1 flex items-center gap-3">
                {/* UPDATED SEARCH BAR */}
                <div className="flex-1 flex items-center gap-2 bg-black border border-[#D4AF37]/45 rounded-xl px-3 py-2 w-full">
                  <Search className="w-4 h-4 text-[#D4AF37]" />
                  <input
                    type="text"
                    placeholder={dynamicPlaceholder}
                    value={globalSearchTerm}
                    onChange={(e) => setGlobalSearchTerm(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none w-full font-mono placeholder:text-zinc-650"
                    autoFocus
                  />
                </div>
              <button
                onClick={() => setIsHeaderSearchOpen(false)}
                className="px-3.5 py-2 text-xs font-mono font-bold uppercase text-zinc-400 hover:text-white bg-zinc-900 border border-white/5 rounded-xl cursor-pointer"
              >
                Fermer
              </button>
            </div>
          ) : (
            <>
              {/* Left Side: Hamburger Trigger Button */}
              <button
                id="hamburger-trigger"
                onClick={() => setIsSidebarOpen(true)}
                className="w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 text-[#D4AF37] hover:text-white hover:bg-[#D4AF37]/10 border border-zinc-850 hover:border-[#D4AF37]/40 rounded-xl transition-all focus:outline-none flex items-center justify-center cursor-pointer bg-black/60 shrink-0 select-none"
                title="Ouvrir le menu"
              >
                <Menu className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>

              {/* Middle Brand Section */}
              <div className="flex-1 flex items-center gap-1 text-left min-w-0 select-none shrink-0">
                {/* Logo AFRIGOMBO */}
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 12px rgba(212,175,55,0.25)",
                      "0 0 22px rgba(212,175,55,0.6)",
                      "0 0 12px rgba(212,175,55,0.25)"
                    ]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-full bg-black border border-[#D4AF37] overflow-hidden flex items-center justify-center select-none shrink-0 mr-1 cursor-pointer"
                >
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <svg viewBox="0 0 40 40" className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 text-[#D4AF37]">
                      <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M15 28 C 15 20, 25 20, 25 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                      <circle cx="15" cy="28" r="2" fill="currentColor" />
                      <circle cx="25" cy="12" r="2" fill="currentColor" />
                    </svg>
                  </div>
                </motion.div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[10px] xs:text-xs sm:text-sm font-sans font-black tracking-[0.08em] text-white leading-none uppercase font-display truncate">
                    AFRIGOMBO
                  </span>
                  <span className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] font-sans font-black tracking-wider text-[#D4AF37] leading-none uppercase mt-0.5 sm:mt-1 truncate">
                    Y'A GOMBO MUSIC
                  </span>
                </div>

                {/* OPTIMIZATION & PERFORMANCE BADGES (INTELLIGENT MODE) */}
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  {isDataSaveActive && (
                    <div 
                      className="flex items-center gap-1 py-0.5 px-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[8px] xs:text-[9px] font-black uppercase tracking-tight"
                      title="Économie de données activée"
                    >
                      <span>📶 Économie activée</span>
                    </div>
                  )}
                  {isBatterySaveActive && (
                    <div 
                      className="flex items-center gap-1 py-0.5 px-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-mono text-[8px] xs:text-[9px] font-black uppercase tracking-tight"
                      title={isBatteryLow ? "Batterie faible (<20%) - mode léger actif" : "Mode léger automatique actif"}
                    >
                      <span>🔋 Batterie</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Controls Row */}
              <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 shrink-0">
                {perspective === "admin" && (
                  <button
                    onClick={() => {
                      setPerspective("user");
                      setActiveMenu("user_terrain");
                      addToTerminal("[INFO] Retour au Terrain d'Action.");
                    }}
                    className="hidden lg:flex items-center gap-1 px-3 py-1.5 text-[11px] font-mono font-bold uppercase text-[#D4AF37] hover:text-black hover:bg-[#D4AF37] border border-[#D4AF37]/30 rounded-lg transition-all cursor-pointer"
                  >
                    ← Retour
                  </button>
                )}

                {/* --- 1. RECHERCHE --- */}
                <button
                  id="search-btn"
                  onClick={() => {
                    setIsHeaderSearchOpen(true);
                    try { audioSynth.playValidationSuccess(); } catch (err) {}
                  }}
                  className="w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 text-[#D4AF37] hover:text-white bg-[#D4AF37]/10 hover:bg-[#D4AF37] border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-xl transition-all flex items-center justify-center cursor-pointer relative shrink-0 select-none shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                  title="Recherche"
                >
                  <Search className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                </button>

                {/* --- 2. NOTIFICATIONS --- */}
                {activeMenu !== "user_edit_profile" && (
                  <button
                    id="bell-btn"
                    onClick={() => {
                      setActiveMenu("user_notifications");
                      addToTerminal("[CLOCHE] Ouverture des notifications d'actualité.");
                    }}
                    className="w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 text-[#D4AF37] hover:text-white bg-[#D4AF37]/10 hover:bg-[#D4AF37] border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-xl transition-all flex items-center justify-center cursor-pointer relative shrink-0 select-none shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                    title="Notifications"
                  >
                    <Bell className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    {realNotifications.filter(n => !n.read).length > 0 && (
                      <motion.span
                        key={realNotifications.filter(n => !n.read).length}
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.3 }}
                        className="absolute -top-0.5 -right-0.5 bg-[#D4AF37] text-black font-mono text-[6.5px] xs:text-[7.5px] sm:text-[8px] font-black w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center border border-black select-none"
                      >
                        {realNotifications.filter(n => !n.read).length}
                      </motion.span>
                    )}
                  </button>
                )}

                {/* --- 3. PROFIL --- */}
                <div 
                  id="profile-avatar"
                  className="w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 rounded-full border border-[#D4AF37]/50 overflow-hidden bg-black flex items-center justify-center cursor-pointer transition-all select-none shrink-0 relative shadow-[0_0_10px_rgba(212,175,55,0.15)] hover:border-[#D4AF37]" 
                  title="Profil Utilisateur" 
                  onClick={() => { 
                    requireGoogleAuthThen(() => {
                      setActiveMenu("user_heritage"); 
                      setViewingGomboIdDetail(false); 
                    });
                  }}
                >
                  {profile?.avatarUrl || currentUser?.photoURL ? (
                    <img src={profile?.avatarUrl || currentUser?.photoURL || ""} alt="User Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[#D4AF37] font-sans text-[10px] xs:text-xs font-black uppercase">
                      {profile?.artisticName?.charAt(0) || currentUser?.displayName?.charAt(0) || "U"}
                    </span>
                  )}
                  <span className="absolute bottom-0 right-0 w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full border border-black" />
                </div>
              </div>
            </>
          )}
        </header>

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
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={areAnimationsReduced ? { opacity: 0 } : { opacity: 0, x: 20 }}
              animate={areAnimationsReduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={areAnimationsReduced ? { opacity: 0 } : { opacity: 0, x: -20, transition: { duration: 0.1 } }}
              transition={{ duration: areAnimationsReduced ? 0.05 : 0.25, ease: "easeOut" }}
              className="h-full w-full overflow-y-auto overflow-x-hidden px-4 sm:px-8 pb-12 pt-6"
            >
              
              {/* ----------------------------------------------------
                                STEP I: TABLEAU UTILISATEUR (10 CORE SECTIONS)
                  ---------------------------------------------------- */}
              {/* ----------------------------------------------------
                                NEW CORE EXPERIENCES FOR USER PERSPECTIVE
                  ---------------------------------------------------- */}

              {/* 1. LE TERRAIN - CENTRAL HUB FEED & opportunities GOMBOS */}
              {activeMenu === "user_terrain" && (
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
                />
              )}

              {/* 1B. VIDÉOS RÉELLES - VERIFICATION & SHOWCASE */}
              {activeMenu === "user_reels" && (() => {
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
                  ...users.flatMap(u => (u.mediaGallery || []).filter(m => m.type === "video" || m.type === "youtube").map(media => ({
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
                    <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-black p-6 rounded-3xl border border-[#D4AF37]/30 shadow-2xl relative overflow-hidden">
                      <div className="absolute right-0 top-0 bottom-0 w-[30%] opacity-25 flex items-center justify-center">
                        <Video className="w-40 h-40 text-[#D4AF37] animate-pulse" />
                      </div>
                      <div className="relative z-10 max-w-xl">
                        <span className="text-[9px] font-mono tracking-widest text-[#D4AF37] font-black uppercase bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/20">
                          PROUVER VOTRE TALENT
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-3">
                          Vidéos Réelles & Sessions Live
                        </h2>
                        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                          La crédibilité d'un artiste n'est pas négociable. Découvrez les coulisses, les preuves de répétition au studio, et les captations scéniques authentiques des musiciens d'élite d'AfriGombo.
                        </p>
                      </div>
                    </div>

                    {/* Filter buttons */}
                    <div className="flex flex-wrap gap-2 py-1 select-none">
                      {[
                        { id: "all", label: "✨ Tout voir" },
                        { id: "video", label: "🎥 Démo Live Directes" },
                        { id: "youtube", label: "📺 Clips YouTube" },
                        { id: "sax", label: "🎷 Saxophone" },
                        { id: "kora", label: "🪕 Kora & Cordes" }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setSelectedReelFilter(tab.id)}
                          className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border cursor-pointer transition-all duration-200 ${
                            selectedReelFilter === tab.id
                              ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-md shadow-[#D4AF37]/10 scale-102"
                              : "bg-zinc-950/45 text-zinc-400 border-zinc-800/80 hover:text-white hover:border-zinc-700"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Grid of video feed cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                      {filteredReels.map((reel, rIdx) => {
                        const isYt = reel.type === "youtube";
                        const yId = isYt ? getYoutubeId(reel.url) : null;
                        
                        return (
                          <div 
                            key={reel.id + "-" + rIdx} 
                            className="bg-zinc-950/80 rounded-2xl border border-zinc-900/90 overflow-hidden hover:border-[#D4AF37]/35 transition-all duration-300 flex flex-col group"
                          >
                            <div className="aspect-video w-full bg-black relative flex items-center justify-center overflow-hidden">
                              {isYt && yId ? (
                                <img 
                                  src={`https://img.youtube.com/vi/${yId}/mqdefault.jpg`} 
                                  alt={reel.title} 
                                  className="w-full h-full object-cover opacity-80 group-hover:scale-102 transition-transform duration-500" 
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 to-zinc-900 flex flex-col items-center justify-center p-3 text-center">
                                  <Video className="w-10 h-10 text-[#D4AF37]/80 mb-2 group-hover:animate-bounce" />
                                  <span className="text-[9px] font-mono font-black tracking-widest text-[#D4AF37] uppercase">SESSION NATIVE</span>
                                </div>
                              )}
                              
                              <button
                                onClick={() => {
                                  if (isYt && yId) {
                                    setReelsVideoId(yId);
                                  } else {
                                    setReelsVideoUrl(reel.url);
                                  }
                                }}
                                className="absolute p-3 rounded-full bg-[#D4AF37] hover:bg-[#B48F17] text-black shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
                              >
                                <Play size={18} className="fill-current text-white" />
                              </button>
                            </div>

                            {/* Details */}
                            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                              <div className="space-y-1">
                                <h4 className="text-xs sm:text-xs font-black text-white hover:text-[#D4AF37] transition-colors uppercase leading-tight line-clamp-1">
                                  {reel.title}
                                </h4>
                                <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed font-sans">
                                  {reel.description}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 pt-2 border-t border-zinc-900/60">
                                <img src={reel.avatar} alt={reel.artisticName} className="w-5 h-5 rounded-full object-cover border border-[#D4AF37]/30" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-[10px] font-black text-zinc-350 truncate block">{reel.artisticName}</span>
                                </div>
                                <span className="text-[8px] font-mono bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-800">
                                  {reel.type.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
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
                  <div className="space-y-8 animate-fadeIn pb-24">
                    {/* STATISTIQUES PRESTIGE EN TEMPS RÉEL (STYLE IMAGE PARFAIT) */}
                    <div className="grid grid-cols-4 divide-x divide-zinc-800/60 bg-black/40 border border-[#D4AF37]/15 rounded-2xl py-3 px-1 sm:p-4 select-none">
                      {/* ARTISTES */}
                      <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-3">
                        <div className="p-1 rounded-lg bg-[#D4AF37]/5 text-[#D4AF37] shrink-0">
                          <Users className="w-4 h-4 sm:w-5 h-5" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[7.5px] sm:text-[9px] font-mono tracking-widest text-zinc-500 font-bold uppercase block leading-none">ARTISTES</span>
                          <strong className="text-xs sm:text-base font-display font-black text-white block mt-0.5 sm:mt-1">
                            {(users.length + 12450).toLocaleString("fr-FR")}
                          </strong>
                          <span className="text-[7.5px] sm:text-[9px] font-sans text-emerald-400 block leading-none mt-0.5 sm:mt-1">+142 ce mois</span>
                        </div>
                      </div>

                      {/* CACHETS */}
                      <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-3">
                        <div className="p-1 rounded-lg bg-[#D4AF37]/5 text-[#D4AF37] shrink-0">
                          <Award className="w-4 h-4 sm:w-5 h-5" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[7.5px] sm:text-[9px] font-mono tracking-widest text-[#D4AF37]/95 font-bold uppercase block leading-none">CACHETS</span>
                          <strong className="text-xs sm:text-base font-display font-black text-white block mt-0.5 sm:mt-1">
                            {(gombos.length + 2840).toLocaleString("fr-FR")}
                          </strong>
                          <span className="text-[7.5px] sm:text-[9px] font-sans text-emerald-400 block leading-none mt-0.5 sm:mt-1">+18% ce mois</span>
                        </div>
                      </div>

                      {/* OPPORTUNITÉS */}
                      <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-3">
                        <div className="p-1 rounded-lg bg-[#D4AF37]/5 text-[#D4AF37] shrink-0">
                          <Music className="w-4 h-4 sm:w-5 h-5" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[7.5px] sm:text-[9px] font-mono tracking-widest text-zinc-500 font-bold uppercase block leading-none">OPPORTUNITÉS</span>
                          <strong className="text-xs sm:text-base font-display font-black text-white block mt-0.5 sm:mt-1">
                            {(gombos.length + posts.length + 360).toLocaleString("fr-FR")}
                          </strong>
                          <span className="text-[7.5px] sm:text-[9px] font-sans text-emerald-400 block leading-none mt-0.5 sm:mt-1">En ligne</span>
                        </div>
                      </div>

                      {/* CERTIFIÉS */}
                      <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-3">
                        <div className="p-1 rounded-lg bg-[#D4AF37]/5 text-[#D4AF37] shrink-0">
                          <ShieldCheck className="w-4 h-4 sm:w-5 h-5" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[7.5px] sm:text-[9px] font-mono tracking-widest text-zinc-500 font-bold uppercase block leading-none">CERTIFIÉS</span>
                          <strong className="text-xs sm:text-base font-display font-black text-white block mt-0.5 sm:mt-1">
                            {(users.filter(u => u.kycStatus === "approved").length + 960).toLocaleString("fr-FR")}
                          </strong>
                          <span className="text-[7.5px] sm:text-[9px] font-sans text-[#D4AF37] block leading-none mt-0.5 sm:mt-1 font-bold">GOMBO ID</span>
                        </div>
                      </div>
                    </div>

                    {/* BARRE D'ACTIONS RAPIDES */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-4 select-none">
                      {/* LIVE */}
                      <button
                        onClick={() => {
                          setTerrainTab("all");
                          addToTerminal("[INTÉRACTIF] Filtre LIVE : tous les cachets et directs actifs.");
                          try { audioSynth.playTamTam(true); } catch (e) {}
                        }}
                        className="p-2 sm:p-4 bg-black/60 border border-[#D4AF37]/15 hover:border-emerald-500 rounded-xl cursor-pointer transition-all flex flex-col justify-between text-left group active:scale-95"
                      >
                        <div className="flex items-center gap-1 sm:gap-1.5 w-full">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          <span className="text-[8px] sm:text-[11px] font-mono font-black text-white tracking-widest uppercase">LIVE</span>
                        </div>
                        <p className="text-[7px] sm:text-[9px] text-zinc-500 font-mono mt-1 sm:mt-2 uppercase">En direct</p>
                      </button>

                      {/* ACTUS */}
                      <button
                        onClick={() => {
                          setTerrainTab("musicien");
                          addToTerminal("[INTÉRACTIF] Filtre ACTUS : échos d'artistes d'Abidjan.");
                          try { audioSynth.playTamTam(true); } catch (e) {}
                        }}
                        className="p-2 sm:p-4 bg-black/60 border border-[#D4AF37]/15 hover:border-[#D4AF37] rounded-xl cursor-pointer transition-all flex flex-col justify-between text-left group active:scale-95"
                      >
                        <div className="flex items-center gap-1 sm:gap-1.5 w-full">
                          <Award className="w-3 h-3 sm:w-4 sm:h-4 text-[#D4AF37] shrink-0" />
                          <span className="text-[8px] sm:text-[11px] font-mono font-black text-white tracking-widest uppercase">ACTUS</span>
                        </div>
                        <p className="text-[7px] sm:text-[9px] text-zinc-500 font-mono mt-1 sm:mt-2 uppercase">Voir les actus</p>
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
                        className="p-2 sm:p-4 bg-[#D4AF37] hover:bg-[#B48F17] rounded-xl cursor-pointer transition-all flex flex-col justify-between text-left group active:scale-95 shadow-[0_4px_12px_rgba(212,175,55,0.2)]"
                      >
                        <div className="flex items-center gap-1 sm:gap-1.5 w-full text-black">
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-black stroke-[3] shrink-0" />
                          <span className="text-[8px] sm:text-[11px] font-mono font-black tracking-widest uppercase">PUBLIER</span>
                        </div>
                        <p className="text-[7px] sm:text-[9px] text-zinc-950/70 font-mono mt-1 sm:mt-2 uppercase">Créer une opp.</p>
                      </button>

                      {/* MENU */}
                      <button
                        onClick={() => {
                          setIsSidebarOpen(true);
                          addToTerminal("[MENU] Ouverture de la sidebar.");
                          try { audioSynth.playTamTam(false); } catch (e) {}
                        }}
                        className="p-2 sm:p-4 bg-black/60 border border-[#D4AF37]/15 hover:border-[#D4AF37]/45 rounded-xl cursor-pointer transition-all flex flex-col justify-between text-left group active:scale-95"
                      >
                        <div className="flex items-center gap-1 sm:gap-1.5 w-full">
                          <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4 text-[#D4AF37] shrink-0" />
                          <span className="text-[8px] sm:text-[11px] font-mono font-black text-white tracking-widest uppercase font-bold">MENU</span>
                        </div>
                        <p className="text-[7px] sm:text-[9px] text-zinc-500 font-mono mt-1 sm:mt-2 uppercase">Plus d'options</p>
                      </button>
                    </div>

                    {/* ==========================================
                        6. RECHERCHE UNIVERSELLE & 5. ACTIONS RAPIDES
                       ========================================== */}
                    <div className="space-y-6 select-none max-w-full">
                      {/* BARRE DE RECHERCHE UNIVERSELLE REMOVED AS REQUESTED */}

                      {/* SECTION ACTIONS RAPIDES */}
                      <div className="bg-gradient-to-b from-zinc-950 to-black border border-[#D4AF37]/20 hover:border-[#D4AF37]/35 rounded-3xl p-5 sm:p-7 shadow-[0_10px_35px_rgba(0,0,0,0.85)] relative overflow-hidden transition-all">
                        {/* Golden backdrop ambient flare */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex justify-between items-center pb-3 border-b border-zinc-900 mb-4 select-none">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">⚡</span>
                            <h3 className="text-sm font-display font-black text-white uppercase tracking-widest leading-none">
                              ACTIONS RAPIDES
                            </h3>
                          </div>
                          <span className="text-[7.5px] font-mono text-zinc-550 border border-zinc-900 bg-black py-0.5 px-2 rounded-lg font-bold">
                            DIRECT CONSOLE
                          </span>
                        </div>

                        {/* 8-GRID ACTIONS */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                          {/* 1. Rechercher un membre */}
                          <button
                            onClick={() => {
                              setSelectedSearchMember(null);
                              setActiveQuickActionModal("search_member");
                              addToTerminal("[ACTIONS RAPIDES] Recherche de membre activée.");
                              try { audioSynth.playTamTam(true); } catch (_) {}
                            }}
                            className="bg-black/45 border border-zinc-900/80 hover:border-[#D4AF37]/35 rounded-2xl p-3 sm:p-4 hover:bg-[#D4AF37]/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-24 select-none min-w-0"
                          >
                            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 group-hover:border-[#D4AF37]/65 transition">
                              <span className="text-xs">👥</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] sm:text-[11px] font-sans font-black text-white tracking-wide truncate">Rechercher un membre</div>
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block leading-none mt-0.5">Annuaire</span>
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
                            className="bg-black/45 border border-zinc-900/80 hover:border-[#D4AF37]/35 rounded-2xl p-3 sm:p-4 hover:bg-[#D4AF37]/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-24 select-none min-w-0"
                          >
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-500 transition">
                              <span className="text-xs">📢</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] sm:text-[11px] font-sans font-black text-white tracking-wide truncate">Créer une annonce</div>
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block leading-none mt-0.5">Nouveau</span>
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
                            className="bg-black/45 border border-zinc-900/80 hover:border-[#D4AF37]/35 rounded-2xl p-3 sm:p-4 hover:bg-[#D4AF37]/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-24 select-none min-w-0"
                          >
                            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 group-hover:border-[#D4AF37] transition">
                              <span className="text-xs">🛡️</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] sm:text-[11px] font-sans font-black text-white tracking-wide truncate">Vérifier GOMBO ID</div>
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block leading-none mt-0.5">Académie</span>
                            </div>
                          </button>

                          {/* 4. Voir les signalements */}
                          <button
                            onClick={() => {
                              setActiveQuickActionModal("signalements");
                              addToTerminal("[ACTIONS RAPIDES] Alerte & Signalements ouverts.");
                              try { audioSynth.playTamTam(false); } catch (_) {}
                            }}
                            className="bg-black/45 border border-zinc-900/80 hover:border-[#D4AF37]/35 rounded-2xl p-3 sm:p-4 hover:bg-[#D4AF37]/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-24 select-none min-w-0"
                          >
                            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:border-red-500 transition">
                              <span className="text-xs">🚨</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] sm:text-[11px] font-sans font-black text-white tracking-wide truncate">Voir signalements</div>
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block leading-none mt-0.5">Sécurité</span>
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
                            className="bg-black/45 border border-zinc-900/80 hover:border-[#D4AF37]/35 rounded-2xl p-3 sm:p-4 hover:bg-[#D4AF37]/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-24 select-none min-w-0"
                          >
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500 transition">
                              <span className="text-xs">🔔</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] sm:text-[11px] font-sans font-black text-white tracking-wide truncate">Envoyer une notification</div>
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block leading-none mt-0.5">Diffusion</span>
                            </div>
                          </button>

                          {/* 6. Voir les statistiques */}
                          <button
                            onClick={() => {
                              setActiveQuickActionModal("stats");
                              addToTerminal("[ACTIONS RAPIDES] Trône d'Or : Analyse de Performance ouverte.");
                              try { audioSynth.playKoraSuccess(); } catch (_) {}
                            }}
                            className="bg-black/45 border border-zinc-900/80 hover:border-[#D4AF37]/35 rounded-2xl p-3 sm:p-4 hover:bg-[#D4AF37]/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-24 select-none min-w-0"
                          >
                            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 group-hover:border-yellow-500 transition">
                              <span className="text-xs">📈</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] sm:text-[11px] font-sans font-black text-white tracking-wide truncate">Voir les statistiques</div>
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block leading-none mt-0.5">Indicateurs</span>
                            </div>
                          </button>

                          {/* 7. Revenus */}
                          <button
                            onClick={() => {
                              setActiveQuickActionModal("revenu");
                              addToTerminal("[ACTIONS RAPIDES] Caisse / Portefeuille d'or chargé.");
                              try { audioSynth.playKoraSuccess(); } catch (_) {}
                            }}
                            className="bg-black/45 border border-zinc-900/80 hover:border-[#D4AF37]/35 rounded-2xl p-3 sm:p-4 hover:bg-[#D4AF37]/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-24 select-none min-w-0"
                          >
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-500 transition">
                              <span className="text-xs">💰</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] sm:text-[11px] font-sans font-black text-white tracking-wide truncate">Revenus d'Or</div>
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block leading-none mt-0.5">Sécurisé</span>
                            </div>
                          </button>

                          {/* 8. Paramètres */}
                          <button
                            onClick={() => {
                              setActiveMenu("user_settings");
                              addToTerminal("[ACTIONS RAPIDES] Paramètres du terminal chargés.");
                              try { audioSynth.playTamTam(false); } catch (_) {}
                            }}
                            className="bg-black/45 border border-zinc-900/80 hover:border-[#D4AF37]/35 rounded-2xl p-3 sm:p-4 hover:bg-[#D4AF37]/5 cursor-pointer text-left transition duration-200 flex flex-col justify-between group h-24 select-none min-w-0"
                          >
                            <div className="w-8 h-8 rounded-xl bg-zinc-500/10 flex items-center justify-center border border-zinc-500/20 group-hover:border-zinc-500 transition">
                              <span className="text-xs">⚙</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] sm:text-[11px] font-sans font-black text-white tracking-wide truncate">Configuration</div>
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block leading-none mt-0.5">Système</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    {!!activeQuickActionModal && (
                      <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto w-full max-w-full">
                        <div className="bg-[#0E0E10] border border-[#D4AF37]/35 rounded-3xl p-6 sm:p-8 w-full max-w-md my-8 relative overflow-hidden select-none shadow-[0_15px_50px_rgba(0,0,0,0.95)]">
                          <button
                            onClick={() => {
                              setActiveQuickActionModal(null);
                              try { audioSynth.playTamTam(false); } catch (_) {}
                            }}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-[#D4AF37] hover:text-white border border-white/5 flex items-center justify-center cursor-pointer transition focus:outline-none"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          {/* MODAL 2: VÉRIFIER GOMBO ID */}
                          {activeQuickActionModal === "verify_gombo_id" && (
                            <div className="space-y-4 text-left">
                              <div className="space-y-1">
                                <h3 className="text-sm font-display font-black text-white uppercase tracking-widest flex items-center gap-2">
                                  <span>🛡️</span> RECHERCHER & CERTIFIER UN GOMBO ID
                                </h3>
                                <p className="text-[11px] text-zinc-400">Contrôlez le passeport numérique d'un membre de l'Académie.</p>
                              </div>

                              <div className="space-y-2 pt-1 border-t border-zinc-900">
                                <label className="text-[9px] font-mono text-[#D4AF37] uppercase block font-bold">RECHERCHE DE CERTIFICATION</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Saisir nom de l'artiste ou ID..."
                                    value={verifyGomboIdInput}
                                    onChange={(e) => setVerifyGomboIdInput(e.target.value)}
                                    className="flex-1 bg-black border border-zinc-800 focus:border-[#D4AF37] text-xs text-white p-2.5 rounded-xl font-mono focus:outline-none"
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
                                    className="px-4 py-2 bg-[#D4AF37] text-black hover:bg-[#B48F17] text-xs font-mono font-black uppercase rounded-xl transition cursor-pointer"
                                  >
                                    VÉRIFIER
                                  </button>
                                </div>
                              </div>

                              {/* RESULTS CONTAINER */}
                              {verifyGomboIdResult && (
                                <div className="p-4 bg-black border border-zinc-900 rounded-2xl animate-fadeIn space-y-3">
                                  {verifyGomboIdResult === "not_found" ? (
                                    <div className="space-y-2 text-center text-zinc-400 py-2">
                                      <span className="text-xl block">❌</span>
                                      <p className="text-xs font-mono">Aucun artiste ne possède cet identifiant.</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <img src={verifyGomboIdResult.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/35" />
                                        <div>
                                          <strong className="text-xs text-white uppercase block leading-none font-bold">{verifyGomboIdResult.artisticName}</strong>
                                          <span className="text-[9px] font-mono text-zinc-500 block mt-1">{verifyGomboIdResult.commune} • ID: {verifyGomboIdResult.id}</span>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900 select-none text-left">
                                        <div className="p-2 bg-zinc-950 rounded-xl">
                                          <span className="text-[8px] font-mono text-zinc-550 block uppercase leading-none">Statut KYC</span>
                                          <span className={`text-[10px] font-mono font-black uppercase mt-1 block leading-none ${verifyGomboIdResult.kycStatus === "approved" ? "text-emerald-400" : "text-amber-500"}`}>
                                            {verifyGomboIdResult.kycStatus === "approved" ? "🛡️ CERTIFIÉ ELITE" : "⏳ EN ATTENTE"}
                                          </span>
                                        </div>
                                        <div className="p-2 bg-zinc-950 rounded-xl">
                                          <span className="text-[8px] font-mono text-zinc-550 block uppercase leading-none">Rang d'Honneur</span>
                                          <span className="text-[10px] font-mono font-black text-[#D4AF37] mt-1 block leading-none uppercase">
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
                                          className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-[#0E0E10] font-mono font-black text-xs uppercase rounded-xl transition flex items-center justify-center gap-1.5"
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
                                <h3 className="text-sm font-display font-black text-white uppercase tracking-widest flex items-center gap-2">
                                  <span>🚨</span> CONTRÔLE DES SIGNALEMENTS & LITIGES
                                </h3>
                                <p className="text-[11px] text-zinc-400">Assurez l'étanchéité de la caisse et la probité des orchestres.</p>
                              </div>

                              {/* NEW SIGNALEMENT FORM */}
                              <div className="p-3.5 bg-black border border-zinc-900 rounded-2xl space-y-2.5">
                                <span className="text-[9px] font-mono text-red-400 uppercase tracking-wider block font-bold leading-none">SIGNIALER UN FAUX PROFIL</span>
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Nom ou pseudo du contrevenant..."
                                    value={customReportUser}
                                    onChange={(e) => setCustomReportUser(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2 rounded-lg font-mono focus:outline-none"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Raison (ex: faux cachet, absence d'orchestre)..."
                                    value={customReportReason}
                                    onChange={(e) => setCustomReportReason(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2 rounded-lg font-mono focus:outline-none"
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
                                    className="w-full py-2 bg-red-500 hover:bg-red-600 text-white font-mono font-black text-xs uppercase rounded-lg transition"
                                  >
                                    ÉMETTRE L'ALERTE ROUGE ⛨
                                  </button>
                                </div>
                              </div>

                              {/* LIVE SIGNALEMENTS LIST */}
                              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 border-t border-zinc-900 pt-3">
                                <span className="text-[8.5px] font-mono text-zinc-550 uppercase block font-bold">ALERTE ACTIVES EN COURS D'ARBITRAGE</span>
                                {alerts.length === 0 ? (
                                  <div className="text-center py-4 text-xs text-zinc-650 font-mono">Aucun litige actif. Bravo à l'Académie !</div>
                                ) : (
                                  alerts.map(al => (
                                    <div key={al.id} className="p-2.5 bg-black border border-zinc-900/50 rounded-xl flex justify-between items-center text-left hover:border-red-500/20 transition">
                                      <div className="min-w-0 pr-2">
                                        <strong className="text-xs text-zinc-300 block font-bold leading-none">{al.userName}</strong>
                                        <span className="text-[9px] font-mono text-zinc-500 block truncate mt-1">{al.reason}</span>
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
                                <h3 className="text-sm font-display font-black text-white uppercase tracking-widest flex items-center gap-2">
                                  <span>📢</span> ENVOYER UN TAMBOUR (DIFFUSION)
                                </h3>
                                <p className="text-[11px] text-zinc-400">Émettez une vibration instantanée relayée sur tous les téléphones.</p>
                              </div>

                              <div className="space-y-3 pt-1 border-t border-zinc-900">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-mono text-[#D4AF37] uppercase block font-bold">Catégorie d'écho</label>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {["INFO", "CACHET", "ZOUGLOU", "ALERT"].map(cat => (
                                      <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setNewNoticeCategory(cat)}
                                        className={`py-1 text-[8px] font-mono font-bold uppercase rounded-lg border transition ${newNoticeCategory === cat ? "bg-[#D4AF37] border-[#D4AF37] text-black" : "bg-black border-zinc-800 text-zinc-400 hover:text-white"}`}
                                      >
                                        {cat}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-mono text-zinc-400 uppercase block font-bold">Titre majestueux</label>
                                  <input
                                    type="text"
                                    placeholder="ex: Concours National Zouglou..."
                                    value={newNoticeTitle}
                                    onChange={(e) => setNewNoticeTitle(e.target.value)}
                                    className="w-full bg-black border border-zinc-900 text-xs text-white p-2.5 rounded-xl font-mono focus:outline-none focus:border-[#D4AF37]"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-mono text-zinc-400 uppercase block font-bold">Message du tambour</label>
                                  <textarea
                                    placeholder="Entrez le contenu de la notification à synchroniser en direct..."
                                    value={newNoticeBody}
                                    onChange={(e) => setNewNoticeBody(e.target.value)}
                                    rows={3}
                                    className="w-full bg-black border border-zinc-900 text-xs text-white p-2.5 rounded-xl font-mono focus:outline-none focus:border-[#D4AF37]"
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
                                  className="w-full h-11 bg-gradient-to-r from-[#D4AF37] to-amber-400 text-black font-sans font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2"
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
                                <h3 className="text-sm font-display font-black text-white uppercase tracking-widest flex items-center gap-2">
                                  <span>📈</span> PERFORMANCE & ANALYTIQUES D'OR
                                </h3>
                                <p className="text-[11px] text-zinc-400">Analyse d'audience et de budget de l'Académie en temps réel.</p>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-zinc-900 select-none">
                                <div className="p-3 bg-black border border-zinc-900 rounded-2xl">
                                  <span className="text-[8px] font-mono text-zinc-550 block uppercase">FLUX CACHETS</span>
                                  <strong className="text-sm font-display font-black text-[#D4AF37] block mt-1">2 840 000 F</strong>
                                  <span className="text-[7.5px] font-mono text-emerald-400 block mt-0.5">+14% ce mois</span>
                                </div>
                                <div className="p-3 bg-black border border-zinc-900 rounded-2xl">
                                  <span className="text-[8px] font-mono text-zinc-550 block uppercase">CONFIANCE COMMUNE</span>
                                  <strong className="text-sm font-sans font-black text-white block mt-1">98.4%</strong>
                                  <span className="text-[7.5px] font-mono text-emerald-400 block mt-0.5">0 disputes actives</span>
                                </div>
                              </div>

                              {/* SMALL INTERACTIVE CHART ACCORDING TO 60FPS REQUIREMENTS */}
                              <div className="p-3 bg-black border border-zinc-900 rounded-2xl space-y-1 select-none">
                                <span className="text-[8px] font-mono text-zinc-500 uppercase block font-bold">FRÉQUENTATION JOURNALIÈRE</span>
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
                          {activeQuickActionModal === "revenu" && (() => {
                            const [withdrawAmount, setWithdrawAmount] = useState("");
                            const [withdrawCarrier, setWithdrawCarrier] = useState("Orange Money");
                            const [withdrawNumber, setWithdrawNumber] = useState("");
                            const currentUserData = users.find(u => u.id === activeArtistId) || users[0];
                            const balanceValue = currentUserData ? (currentUserData.revenue || 125000) : 125000;

                            return (
                              <div className="space-y-4 text-left">
                                <div className="space-y-1">
                                  <h3 className="text-sm font-display font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <span>💰</span> RETRAITS & REVENUS SÉCURISÉS
                                  </h3>
                                  <p className="text-[11px] text-zinc-400">Suivi comptable en temps réel lié à l'Académie Afrigombo.</p>
                                </div>

                                <div className="p-4 bg-gradient-to-r from-zinc-950 to-black border border-[#D4AF37]/35 rounded-2xl select-none flex justify-between items-center text-left">
                                  <div>
                                    <span className="text-[8px] font-mono text-[#D4AF37] block uppercase font-black">SOLDE DISPONIBLE</span>
                                    <strong className="text-xl font-display font-black text-white block mt-1">{balanceValue.toLocaleString("fr-FR")} FCFA</strong>
                                  </div>
                                  <div className="text-[8.5px] font-mono py-1 px-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                                    GARANTI COCOT ⚖
                                  </div>
                                </div>

                                {/* MOBILE MONEY WITHDRAW FORMS */}
                                <div className="p-3.5 bg-black border border-zinc-900 rounded-2xl space-y-2.5">
                                  <span className="text-[9.5px] font-mono text-[#D4AF37] uppercase block font-bold leading-none">DEMANDE DE RETRAIT INSTANTANÉ</span>
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-3 gap-1">
                                      {["Orange Money", "MTN MoMo", "Wave"].map(op => (
                                        <button
                                          key={op}
                                          type="button"
                                          onClick={() => setWithdrawCarrier(op)}
                                          className={`py-1 rounded text-[8px] font-mono font-bold uppercase border transition ${withdrawCarrier === op ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white"}`}
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
                                      className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2 rounded-lg font-mono focus:outline-none"
                                    />
                                    <input
                                      type="tel"
                                      placeholder="N° de téléphone du destinataire..."
                                      value={withdrawNumber}
                                      onChange={(e) => setWithdrawNumber(e.target.value)}
                                      className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2 rounded-lg font-mono focus:outline-none"
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
                                          const updatedUser = { ...currentUserData, revenue: newBal };
                                          await saveToFirestore("users", currentUserData.id, updatedUser);
                                          
                                          // Log transaction
                                          const txId = "tx_" + Date.now();
                                          const demoTx: Transaction = {
                                            id: txId,
                                            amount: cash,
                                            type: "payout",
                                            description: `Retrait Mobile Money (${withdrawCarrier}) vers le numéro ${withdrawNumber}`,
                                            userId: currentUserData.id,
                                            userArtisticName: currentUserData.artisticName,
                                            timestamp: new Date().toISOString()
                                          };
                                          await saveToFirestore("transactions", txId, demoTx);

                                          // Post local list updates
                                          setTransactions([demoTx, ...transactions]);
                                          
                                          setWithdrawAmount("");
                                          setWithdrawNumber("");
                                          setActiveQuickActionModal(null);
                                          addToTerminal(`[PAYOUT] Retrait de ${cash} FCFA demandé via ${withdrawCarrier} vers ${withdrawNumber}.`);
                                          try { audioSynth.playKoraSuccess(); } catch(_) {}
                                          alert(`💸 Retrait réussi de ${cash.toLocaleString("fr-FR")} FCFA vers votre compte ${withdrawCarrier} !`);
                                        } catch (_) {}
                                      }}
                                      className="w-full py-2 bg-[#D4AF37] hover:bg-[#B48F17] text-black font-mono font-black text-[10.5px] uppercase rounded-lg transition"
                                    >
                                      ORDONNER LE TRANSFERT ⚡
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                    {/* CARTE HÉRO PRINCIPALE PREMIUM */}
                    <div className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-[#D4AF37]/25 p-5 sm:p-7 shadow-xl h-[280px] sm:h-auto flex flex-col justify-between">
                      {/* Backdrop / image absolute right with elegant fade mask */}
                      <div className="absolute right-0 top-0 bottom-0 w-[42%] h-full z-0 overflow-hidden">
                        <img 
                          src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=360" 
                          alt="Artiste en Prestation" 
                          className="w-full h-full object-cover object-center opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                      </div>

                      <div className="relative z-10 flex flex-col justify-center h-full max-w-[62%] text-left space-y-4">
                        <div>
                          <span className="text-[10px] sm:text-xs uppercase font-mono text-[#D4AF37] tracking-[0.2em] block font-extrabold mb-1">
                            AFRIGOMBO PORTAL
                          </span>
                          <h2 className="text-2xl sm:text-4xl font-display font-black tracking-tight leading-none uppercase">
                            <span className="text-white block mb-1">LE TERRAIN</span>
                            <span className="text-[#D4AF37]">D'INTELLIGENCE</span>
                          </h2>
                          <p className="text-[11px] sm:text-xs text-zinc-400 mt-2 max-w-md leading-relaxed">
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
                            className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#B48F17] text-[#0B0B0B] text-xs font-mono font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-[0_4px_15px_rgba(212,175,55,0.3)] active:scale-95"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            PUBLIER UNE OPPORTUNITÉ
                          </button>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] sm:text-[10px] font-mono text-[#D4AF37] select-none uppercase font-bold">
                            <span className="flex items-center gap-1 font-black">🌐 TOUS DOMAINES</span>
                            <span className="text-zinc-650">•</span>
                            <span className="flex items-center gap-1 font-black">🎯 GRATUIT</span>
                            <span className="text-zinc-650">•</span>
                            <span className="flex items-center gap-1 font-black">⚡ RAPIDE</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RACCOURCIS PREMIUM */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-3 select-none">
                      <button
                        onClick={() => {
                          setTerrainTab("musicien");
                          try { audioSynth.playTamTam(true); } catch (e) {}
                        }}
                        className={`p-1.5 sm:p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-1.5 sm:gap-2.5 ${
                          terrainTab === "musicien" 
                            ? "bg-[#D4AF37]/10 border-[#D4AF37] text-white" 
                            : "bg-black/35 border-white/5 hover:border-[#D4AF37]/40 text-white/90"
                        }`}
                      >
                        <span className="text-sm sm:text-lg shrink-0">🎵</span>
                        <div className="min-w-0">
                          <h4 className="text-[8.5px] sm:text-[10.5px] font-display font-black uppercase text-[#D4AF37] truncate leading-none">ÉCHOS</h4>
                          <p className="text-[7.5px] sm:text-[8px] text-zinc-500 font-mono mt-0.5 truncate leading-none">Actus & Buzz</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setTerrainTab("contrat");
                          try { audioSynth.playTamTam(true); } catch (e) {}
                        }}
                        className={`p-1.5 sm:p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-1.5 sm:gap-2.5 ${
                          terrainTab === "contrat" 
                            ? "bg-[#D4AF37]/10 border-[#D4AF37] text-white" 
                            : "bg-black/35 border-white/5 hover:border-[#D4AF37]/40 text-white/90"
                        }`}
                      >
                        <span className="text-sm sm:text-lg shrink-0">💰</span>
                        <div className="min-w-0">
                          <h4 className="text-[8.5px] sm:text-[10.5px] font-display font-black uppercase text-[#D4AF37] truncate leading-none">CACHETS</h4>
                          <p className="text-[7.5px] sm:text-[8px] text-zinc-500 font-mono mt-0.5 truncate leading-none">Offres & Dem.</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setTerrainTab("all");
                          addToTerminal("[FILTRE] Tendances d'Abidjan activées sur le Terrain.");
                          try { audioSynth.playValidationSuccess(); } catch (e) {}
                        }}
                        className="p-1.5 sm:p-2.5 rounded-xl bg-black/35 border border-white/5 hover:border-[#D4AF37]/40 text-left cursor-pointer transition-all text-white/90 flex items-center gap-1.5 sm:gap-2.5"
                      >
                        <span className="text-sm sm:text-lg shrink-0">📈</span>
                        <div className="min-w-0">
                          <h4 className="text-[8.5px] sm:text-[10.5px] font-display font-black uppercase text-[#D4AF37] truncate leading-none">TENDANCES</h4>
                          <p className="text-[7.5px] sm:text-[8px] text-zinc-500 font-mono mt-0.5 truncate leading-none">Abidjan Mix</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          addToTerminal("[INFO] Calendrier des événements : tous les spectacles, showcases, et concerts du mois.");
                          alert("📅 Évènements d'Or : Retrouvez l'agenda complet des concerts live d'Abidjan sur le canal d'Actu !");
                          try { audioSynth.playTamTam(false); } catch (e) {}
                        }}
                        className="p-1.5 sm:p-2.5 rounded-xl bg-black/35 border border-white/5 hover:border-[#D4AF37]/40 text-left cursor-pointer transition-all text-white/90 flex items-center gap-1.5 sm:gap-2.5"
                      >
                        <span className="text-sm sm:text-lg shrink-0">📅</span>
                        <div className="min-w-0">
                          <h4 className="text-[8.5px] sm:text-[10.5px] font-display font-black uppercase text-[#D4AF37] truncate leading-none">ÉVÉNEMENTS</h4>
                          <p className="text-[7.5px] sm:text-[8px] text-zinc-500 font-mono mt-0.5 truncate leading-none">Spectacles</p>
                        </div>
                      </button>
                    </div>

                    {/* Navigation Tabs filter within Le Terrain */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 p-1 rounded-xl">
                        <button
                          onClick={() => setTerrainTab("all")}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                            terrainTab === "all" ? "bg-[#D4AF37] text-[#0B0B0B]" : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          Tout l'Écran
                        </button>
                        <button
                          onClick={() => setTerrainTab("musicien")}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                            terrainTab === "musicien" ? "bg-[#D4AF37] text-[#0B0B0B]" : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          Échos d'Artistes
                        </button>
                        <button
                          onClick={() => setTerrainTab("contrat")}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                            terrainTab === "contrat" ? "bg-[#D4AF37] text-[#0B0B0B]" : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          Les Cachets
                        </button>
                      </div>

                      <div className="text-[11px] font-mono text-zinc-500">
                        {GombosToRender.length} cachets & {filteredFeedPosts.length} murmures sur scène
                      </div>
                    </div>

                    {/* MAIN SPLIT COLUMNS SECTION */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      
                      {/* LEFT OR MAIN: GOMBOS / CONTRATS GRID */}
                      {(terrainTab === "all" || terrainTab === "contrat") && (
                        <div className={`${terrainTab === "contrat" ? "lg:col-span-12" : "lg:col-span-7"} space-y-5`}>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-3 bg-[#D4AF37] rounded-full" />
                            <h3 className="text-sm font-sans font-black text-white uppercase tracking-wider">
                              Les Cachets d'Or Disponibles
                            </h3>
                          </div>

                          {GombosToRender.length === 0 ? (
                            <div className="p-10 text-center rounded-2xl bg-zinc-900/40 border border-white/5 text-zinc-500 text-xs font-mono">
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
                                    className="relative overflow-hidden rounded-3xl bg-[#121214] border border-[#D4AF37]/15 p-5 transition-all duration-300 flex flex-col sm:flex-row gap-5 items-stretch shadow-lg"
                                  >
                                    {g.isBoosted && (
                                      <div className="absolute top-0 right-0 bg-[#D4AF37] text-[#0B0B0B] text-[8px] font-mono font-extrabold uppercase px-3 py-1 rounded-bl-xl shadow flex items-center gap-1 z-20">
                                        <Zap className="w-3 h-3 fill-current animate-pulse" /> PREMIUM BOOST
                                      </div>
                                    )}

                                    {/* Left illustration wrapper */}
                                    <div className="w-full sm:w-40 h-28 rounded-2xl overflow-hidden relative shrink-0 border border-white/5 bg-zinc-950">
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
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                                      <span className="absolute bottom-2 left-2 text-[8px] font-mono font-black uppercase text-[#D4AF37] bg-[#090909]/95 px-2 py-0.5 rounded border border-[#D4AF37]/20">
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
                                          <span className="text-[10px] font-mono text-zinc-400">📍 {g.location}</span>
                                          <span className="text-zinc-650 font-mono text-[10px]">•</span>
                                          <span className="text-[10px] text-zinc-400 font-mono">{g.date || "Date Récente"}</span>
                                        </div>

                                        <h4 className="text-md sm:text-lg font-sans font-black text-white hover:text-[#D4AF37] transition-all">
                                          {g.title}
                                        </h4>
                                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mt-1">
                                          {g.description}
                                        </p>
                                      </div>

                                      {/* Lower section containing large amount and Details button */}
                                      <div className="border-t border-white/5 pt-3 mt-4 flex items-center justify-between flex-wrap gap-4">
                                        <div>
                                          <span className="text-[8px] uppercase font-mono text-zinc-500 block font-bold">MONTANT GARANTI</span>
                                          <strong className="text-xl font-sans font-black text-[#D4AF37] tracking-tight">
                                            {(g.budget || 250000).toLocaleString("fr-FR")} <span className="text-xs font-mono text-zinc-400 font-bold">FCFA</span>
                                          </strong>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                          <button
                                            onClick={() => {
                                              setSelectedGomboDetails(g);
                                              try { audioSynth.playValidationSuccess(); } catch (err) {}
                                            }}
                                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-950 border border-[#D4AF37]/35 hover:border-[#D4AF37] text-white text-[10px] font-mono font-black uppercase tracking-wider hover:shadow-[0_0_15px_rgba(212,175,55,0.15)] cursor-pointer transition-all active:scale-95 whitespace-nowrap"
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
                            <span className="w-1.5 h-3 bg-[#D4AF37] rounded-full" />
                            <h3 className="text-sm font-sans font-black text-white uppercase tracking-wider">
                              Murmures & Alliances Showbiz
                            </h3>
                          </div>

                          {filteredFeedPosts.length === 0 ? (
                            <div className="p-10 text-center rounded-2xl bg-zinc-900/40 border border-white/5 text-zinc-500 text-xs font-mono">
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
                                let categoryColor = "border-amber-500/30 text-[#D4AF37] bg-amber-500/5";
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
                                  <div key={p.id} className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-4.5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-zinc-700/60 transition-all duration-300">
                                    {/* HEADER: User info + location + time */}
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-950 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-black text-xs font-mono shadow-inner shrink-0 relative">
                                          {p.authorArtisticName?.charAt(0)}
                                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#121214]" />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h5 className="text-[12px] font-sans font-black text-white uppercase tracking-wide leading-tight">
                                              {p.authorArtisticName}
                                            </h5>
                                            <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono font-bold leading-none shrink-0">
                                              PRO
                                            </span>
                                          </div>
                                          <span className="text-[9px] font-mono text-zinc-500 block leading-tight mt-0.5">
                                            {p.authorName} • {authorUser?.email || "artiste@afrigombo.ci"}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="text-right flex flex-col items-end shrink-0">
                                        <span className="text-[9px] font-mono font-bold text-[#D4AF37] flex items-center gap-1">
                                          📍 {authorCommune}
                                        </span>
                                        <span className="text-[7.5px] font-mono text-zinc-500 mt-0.5">
                                          {formattedDate} à {formattedTime}
                                        </span>
                                      </div>
                                    </div>

                                    {/* POST MEDIA IMAGE (IF PRESENT) */}
                                    {p.mediaUrl && (
                                      <div className="relative rounded-xl overflow-hidden border border-zinc-800/60 bg-zinc-950 aspect-[16/9] group">
                                        <img
                                          src={p.mediaUrl}
                                          alt="Illustration"
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <span className="absolute bottom-2 right-2 text-[8px] bg-black/80 backdrop-blur-md text-[#D4AF37] font-bold border border-[#D4AF37]/20 px-2 py-0.5 rounded-md font-mono tracking-wider uppercase">
                                          ÉCHO PREMIUM
                                        </span>
                                      </div>
                                    )}

                                    {/* DESCRIPTION */}
                                    <p className="text-[11.5px] font-sans text-zinc-200 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-white/[0.03]">
                                      {p.content}
                                    </p>

                                    {p.isFlagged && (
                                      <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2.5 text-[8.5px] font-mono text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <span>⚠️ INTERVENTION AI</span> • <span className="text-zinc-500">{p.flagReason || "Contenu révisé"}</span>
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
                                            <span key={tag} className="text-[9.5px] font-mono text-[#D4AF37]/70 font-semibold hover:text-[#D4AF37] transition-all cursor-pointer">
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* STATS INTERACTIVES & ACTION BUTTONS */}
                                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.04] text-[10.5px] font-mono text-zinc-450">
                                      <div className="flex items-center gap-4 text-zinc-400">
                                        {/* Likes / Vibrations Count */}
                                        <button
                                          onClick={() => {
                                            if (isLiked) {
                                              setLikedPosts(prev => prev.filter(id => id !== p.id));
                                            } else {
                                              setLikedPosts(prev => [...prev, p.id]);
                                              audioSynth.playValidationSuccess();
                                            }
                                          }}
                                          className={`flex items-center gap-1.5 transition-colors hover:text-red-400 cursor-pointer ${isLiked ? "text-red-500 font-bold" : ""}`}
                                        >
                                          <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current text-red-500" : ""}`} /> 
                                          <span>{p.likes + (isLiked ? 1 : 0)} vibrations</span>
                                        </button>

                                        {/* Views Count */}
                                        <div className="flex items-center gap-1.5 text-zinc-500">
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>{p.views || 45} vues</span>
                                        </div>

                                        {/* Shares Count */}
                                        <div className="flex items-center gap-1.5 text-zinc-500">
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
                                          className="text-[9.5px] px-2.5 py-1.5 rounded-lg font-bold border border-[#D4AF37]/30 hover:border-[#D4AF37]/80 hover:bg-[#D4AF37]/5 text-[#D4AF37] transition-all cursor-pointer flex items-center gap-1"
                                        >
                                          <span>Partager</span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Real Parler / Comments Section */}
                                    <div className="space-y-2 pt-2 border-t border-white/5">
                                      {/* Existing comments */}
                                      {postComments[p.id]?.map(c => (
                                        <div key={c.id} className="text-[10.5px] p-2 bg-black rounded border border-white/5 text-left font-sans">
                                          <strong className="text-[#D4AF37] uppercase text-[9px] font-mono mr-1">{c.writerName} :</strong>
                                          <span className="text-zinc-300">{c.content}</span>
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
                                          className="flex-1 bg-[#1A1A1D] border border-zinc-800 rounded-xl p-2 px-3 text-[10.5px] text-white focus:outline-none focus:border-[#D4AF37] placeholder:text-zinc-650"
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
                    <footer className="mt-16 border-t border-zinc-800 bg-[#070708] rounded-3xl p-6 sm:p-8 space-y-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-zinc-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                            <Flame className="text-[#D4AF37] w-5 h-5 animate-bounce" />
                          </div>
                          <div>
                            <span className="text-xs font-sans font-black text-white uppercase tracking-widest block leading-tight">Y'A GOMBO MUSIC</span>
                            <span className="text-[7.5px] uppercase font-mono tracking-widest text-[#D4AF37]/75 font-black block">Elite Sovereignty Consortium</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-mono text-zinc-400">
                          <button
                            onClick={() => {
                              setActiveMenu("terms");
                            }}
                            className="hover:text-[#D4AF37] transition-all cursor-pointer font-bold"
                          >
                            CGU
                          </button>
                          <span className="text-zinc-800">•</span>
                          <button
                            onClick={() => {
                              setActiveMenu("privacy");
                            }}
                            className="hover:text-[#D4AF37] transition-all cursor-pointer font-bold"
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

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] font-mono text-zinc-500 text-center sm:text-left">
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
                    <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-xl font-display font-black text-[#D4AF37] uppercase flex items-center gap-2">
                          <span>🌟 Écosystème 2.0</span>
                        </h3>
                        <p className="text-zinc-500 text-xs mt-1">L'univers prestige complet de services d'alliance et d'outils pour l'élite d'Abidjan.</p>
                      </div>
                      <button
                        onClick={() => setActiveMenu("user_terrain")}
                        className="bg-zinc-950/80 border border-zinc-900 rounded-xl px-4 py-2 text-xs font-mono text-[#D4AF37] hover:text-white"
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
                    <div className="p-5 rounded-2xl bg-[#121214] border border-[#D4AF37]/15 relative overflow-hidden">
                      <div className="relative z-10">
                        <h3 className="text-md font-sans font-black text-white uppercase tracking-wide">
                          🔍 Les Vibes : Moteur de Recherche d'Alliances
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1">
                          Découvrez d'autres virtuoses à Abidjan, explorez leurs spécialités et scellez des partenariats artistiques prestigieux.
                        </p>
                      </div>
                      <AfrigomboVibeWaves />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredArtists.map(artist => (
                        <motion.div
                          key={artist.id}
                          whileHover={{ scale: 1.015, y: -3 }}
                          className="bg-[#121214] rounded-2xl border border-zinc-800/80 p-5 space-y-4 flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full border border-[#D4AF37]/25 overflow-hidden bg-black flex items-center justify-center font-bold font-mono text-md text-[#D4AF37]">
                                {artist.avatarUrl ? (
                                  <img src={artist.avatarUrl} alt={artist.artisticName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  artist.artisticName.charAt(0)
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-sans font-black text-white truncate">
                                  {artist.artisticName}
                                </h4>
                                <span className="text-[10px] uppercase font-mono text-zinc-500">
                                  📍 {artist.commune}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase block font-bold">SPÉCIALITÉS D'ALLIANCE :</span>
                              <div className="flex flex-wrap gap-1">
                                {(artist.specialties || ["Virtuose multi-instrumental"]).map((s, idx) => (
                                  <span key={idx} className="text-[8px] font-mono bg-white/5 border border-white/10 text-zinc-300 px-1.5 py-0.5 rounded">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <p className="text-[10px] text-zinc-400 leading-snug italic bg-zinc-950 p-2.5 rounded-lg border border-white/5">
                              "{artist.bio || "Ce virtuose de scène cultive l'excellence sans fard à Abidjan."}"
                            </p>
                          </div>

                          <div className="border-t border-zinc-950 pt-3.5 flex items-center justify-between">
                            <div className="text-left">
                              <span className="text-[8px] uppercase font-mono text-zinc-500 block">SCORE ACADÉMIE :</span>
                              <span className="text-xs font-mono font-bold text-[#D4AF37]">
                                Rang {artist.performance?.level || "3"} / 5
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                audioSynth.playValidationSuccess();
                                addToTerminal(`[🎼 ALLIANCE] Proposition de raccordement d'or envoyée à : ${artist.artisticName}`);
                                alert(`Demande d'alliance d'or notifiée ! Notre transmetteur a fait vibrer les tambours de ${artist.artisticName}.`);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#0B0B0B] text-[10px] font-mono font-black border border-[#D4AF37]/35 uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Proposer une Alliance 🤝
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* 3. USER PUBLISH VIEW */}
              {activeMenu === "user_publish" && (() => {
                const triggerPubSubmit = async () => {
                  const activeArtist = users.find(u => u.id === activeArtistId) || users[0];
                  
                  if (newPubType === "post") {
                    if (!newPostContent.trim()) {
                      alert("Veuillez renseigner le contenu de votre message murmure !");
                      return;
                    }
                    const newP: Post = {
                      id: "post_new_" + Date.now(),
                      userId: activeArtistId,
                      authorName: activeArtist.name,
                      authorArtisticName: activeArtist.artisticName,
                      content: newPostContent,
                      likes: 0,
                      comments: 0,
                      isFlagged: false,
                      timestamp: new Date().toISOString()
                    };
                    setPosts(prev => [newP, ...prev]);
                    addToTerminal(`[🎼 PUBLICATION] Nouveau murmure d'or diffusé sur Le Terrain !`);
                  } else {
                    if (!newGomboTitle.trim()) {
                      alert("Veuillez renseigner un titre spectaculaire pour le Gombo !");
                      return;
                    }
                    if (!newGomboDesc.trim()) {
                      alert("Veuillez renseigner une description détaillée de la prestation !");
                      return;
                    }
                    if (newGomboCategory === "Autre" && !newGomboOtherCategory.trim()) {
                      alert("Si vous choisissez 'Autre', vous devez spécifier le type de Gombo manuellement !");
                      return;
                    }
                    if (!newGomboCity.trim()) {
                      alert("Veuillez renseigner la ville d'impact !");
                      return;
                    }
                    if (!newGomboQuartier.trim()) {
                      alert("Veuillez renseigner le quartier de la prestation !");
                      return;
                    }
                    if (!newGomboLieuPrecis.trim()) {
                      alert("Veuillez renseigner l'adresse ou lieu de ralliement précis !");
                      return;
                    }
                    if (!newGomboDate) {
                      alert("Veuillez spécifier la date de la prestation !");
                      return;
                    }
                    if (!newGomboHeureDebut) {
                      alert("Veuillez spécifier l'heure de début !");
                      return;
                    }
                    if (!newGomboHeureFin) {
                      alert("Veuillez spécifier l'heure de fin attendue !");
                      return;
                    }
                    if (!newGomboStyleMusical.trim()) {
                      alert("Veuillez spécifier le genre ou style musical attendu !");
                      return;
                    }
                    if (!newGomboTenueExigee.trim()) {
                      alert("Veuillez spécifier le code vestimentaire ou la tenue exigée !");
                      return;
                    }
                    if (!newGomboExperienceSouhaitee.trim()) {
                      alert("Veuillez spécifier le niveau d'expérience souhaité !");
                      return;
                    }
                    if (newGomboNombreRecherche <= 0) {
                      alert("Le nombre d'artistes recherchés doit être d'au moins 1 !");
                      return;
                    }
                    if (!newGomboPrice || newGomboPrice < 15000) {
                      alert("Le budget minimum d'un Gombo est réglementé à 15 000 FCFA. Les mentions 'montant à discuter' ou budgets inférieurs sont strictement interdits.");
                      return;
                    }

                    // Validation specifics for Renfort group
                    if (newGomboCategory === "Renfort groupe") {
                      if (!newGomboRepetitionsDates.trim()) {
                        alert("Pour un Renfort groupe, veuillez spécifier les dates de répétition !");
                        return;
                      }
                      if (!newGomboRepetitionsSchedule.trim()) {
                        alert("Pour un Renfort groupe, veuillez spécifier les horaires des répétitions !");
                        return;
                      }
                    }

                    const categoryVal = newGomboCategory === "Autre" ? newGomboOtherCategory : newGomboCategory;

                    const newG: Gombo = {
                      id: "gombo_new_" + Date.now(),
                      title: "🎖️ (" + categoryVal + ") " + newGomboTitle,
                      description: newGomboDesc,
                      budget: newGomboPrice,
                      commissionRate: 0.10,
                      location: newGomboQuartier + ", " + newGomboCity,
                      city: newGomboCity,
                      quartier: newGomboQuartier,
                      lieuPrecis: newGomboLieuPrecis,
                      organizerId: activeArtistId,
                      organizerName: activeArtist.artisticName || activeArtist.name,
                      timestamp: new Date().toISOString(),
                      applicantsCount: 0,
                      status: "open",
                      isBoosted: false,
                      date: newGomboDate,
                      time: newGomboHeureDebut + " - " + newGomboHeureFin,
                      category: categoryVal,
                      styleMusical: newGomboStyleMusical,
                      tenueExigee: newGomboTenueExigee,
                      experienceSouhaitee: newGomboExperienceSouhaitee,
                      nombreRecherche: newGomboNombreRecherche,
                      isRenfort: newGomboCategory === "Renfort groupe",
                      transportFee: newGomboCategory === "Renfort groupe" ? newGomboTransportFee : 0,
                      repetitionsCount: newGomboCategory === "Renfort groupe" ? newGomboRepetitionsCount : 0,
                      repetitionsSchedule: newGomboCategory === "Renfort groupe" ? newGomboRepetitionsSchedule : "",
                      repetitionsDates: newGomboCategory === "Renfort groupe" ? newGomboRepetitionsDates : ""
                    };

                    setGombos(prev => [newG, ...prev]);
                    await saveToFirestore("gombos", newG.id, newG);
                    addToTerminal(`[🎼 CONTRAT] Nouveau cachet (${categoryVal}) d'honneur ouvert sur Le Terrain !`);
                  }

                  // Reset inputs
                  setNewPostContent("");
                  setNewGomboTitle("");
                  setNewGomboDesc("");
                  interactionBus.emit("POST_CREATED");
                  audioSynth.playValidationSuccess();
                  setActiveMenu("user_terrain");
                };

                return (
                  <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-24">
                    <div className="bg-[#121214] border border-[#D4AF37]/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                      <div className="border-b border-white/5 pb-4">
                        <span className="text-[9px] uppercase font-mono tracking-widest text-[#D4AF37] font-bold">TRANSMETTEUR INTEGRÉ</span>
                        <h3 className="text-xl font-display font-black text-white">PUBLIER SUR LE TERRAIN</h3>
                        <p className="text-xs text-zinc-400 mt-1">
                          Votre message sera retransmis à travers toute la république du Showbiz dans la seconde.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">NATURE DE LA PORTANCE :</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setNewPubType("post")}
                            className={`p-3.5 rounded-xl border text-xs font-bold uppercase transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                              newPubType === "post"
                                ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]"
                                : "bg-black/30 border-zinc-800 text-zinc-400 hover:text-white"
                            }`}
                          >
                            <MessageSquare className="w-5 h-5" />
                            <span>Mise à jour d'Actu (Murmure)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNewPubType("gombo")}
                            className={`p-3.5 rounded-xl border text-xs font-bold uppercase transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                              newPubType === "gombo"
                                ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]"
                                : "bg-black/30 border-zinc-800 text-zinc-400 hover:text-white"
                            }`}
                          >
                            <Briefcase className="w-5 h-5" />
                            <span>Ouvrir un Cachet (Contrat)</span>
                          </button>
                        </div>
                      </div>

                      {newPubType === "post" ? (
                        <div className="space-y-4 text-left">
                          <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">MURMURE À TRANSMETTRE :</label>
                          <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="Que se passe-t-il sur la scène ce soir ? Laissez votre empreinte..."
                            className="w-full h-32 bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl p-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all resize-none font-sans"
                          />
                        </div>
                      ) : (
                        <div className="space-y-4 text-left">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Type de Gombo */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-[#D4AF37] block font-bold">TYPE DE GOMBO (OBLIGATOIRE) :</label>
                              <select
                                value={newGomboCategory}
                                onChange={(e) => {
                                  setNewGomboCategory(e.target.value);
                                  if (e.target.value === "Renfort groupe") {
                                    setNewGomboPrice(15000);
                                  }
                                }}
                                className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-sans cursor-pointer"
                              >
                                {[
                                  "Concert", "Mariage", "Anniversaire", "Maquis", "Restaurant", "Lounge", 
                                  "Église", "Chorale", "Studio", "Festival", "Cabaret", "Spectacle scolaire", 
                                  "Événement entreprise", "Renfort groupe", "Instrumentiste recherché", 
                                  "Choriste recherché", "Beatmaker recherché", "Producteur recherché", 
                                  "Sonorisateur recherché", "DJ", "Danseur", "Vidéaste", "Photographe", "Autre"
                                ].map(cat => (
                                  <option key={cat} value={cat} className="bg-black text-white">{cat}</option>
                                ))}
                              </select>
                            </div>

                            {/* Titre du contrat */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">TITRE DU CONTRAT :</label>
                              <input
                                type="text"
                                value={newGomboTitle}
                                onChange={(e) => setNewGomboTitle(e.target.value)}
                                placeholder="ex. Bassiste pour show live VIP..."
                                className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none placeholder-zinc-600 font-sans"
                              />
                            </div>
                          </div>

                          {/* Specific manual Category entry if 'Autre' is selected */}
                          {newGomboCategory === "Autre" && (
                            <div className="space-y-2 animate-fadeIn bg-yellow-500/5 p-3 rounded-xl border border-yellow-500/20">
                              <label className="text-[10px] font-mono uppercase text-yellow-500 block font-bold">VOTRE CATÉGORIE DU CONTRAT :</label>
                              <input
                                type="text"
                                value={newGomboOtherCategory}
                                onChange={(e) => setNewGomboOtherCategory(e.target.value)}
                                placeholder="Précisez votre type d'activité..."
                                className="w-full bg-black border border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none placeholder-zinc-600 font-sans"
                              />
                            </div>
                          )}

                          {/* Location Detail Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-850/60">
                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">VILLE :</label>
                              <input
                                type="text"
                                value={newGomboCity}
                                onChange={(e) => setNewGomboCity(e.target.value)}
                                className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">QUARTIER / DEPARTEMENT :</label>
                              <input
                                type="text"
                                value={newGomboQuartier}
                                onChange={(e) => setNewGomboQuartier(e.target.value)}
                                placeholder="ex. Angré, Biétry..."
                                className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">LIEU PRÉCIS :</label>
                              <input
                                type="text"
                                value={newGomboLieuPrecis}
                                onChange={(e) => setNewGomboLieuPrecis(e.target.value)}
                                placeholder="ex. Club Sovereignty, Terrain d'Or"
                                className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Schedule / Time Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">DATE DE PRESTATION :</label>
                              <input
                                type="date"
                                value={newGomboDate}
                                onChange={(e) => setNewGomboDate(e.target.value)}
                                className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">HEURE DÉBUT :</label>
                              <input
                                type="time"
                                value={newGomboHeureDebut}
                                onChange={(e) => setNewGomboHeureDebut(e.target.value)}
                                className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">HEURE FIN ATTENDUE :</label>
                              <input
                                type="time"
                                value={newGomboHeureFin}
                                onChange={(e) => setNewGomboHeureFin(e.target.value)}
                                className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Style musical & Dresscode */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">STYLE MUSICAL :</label>
                              <input
                                type="text"
                                value={newGomboStyleMusical}
                                onChange={(e) => setNewGomboStyleMusical(e.target.value)}
                                placeholder="ex. Coupé-décalé, Afrobeats, Jazz..."
                                className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">TENUE EXIGÉE / DRESSCODE :</label>
                              <input
                                type="text"
                                value={newGomboTenueExigee}
                                onChange={(e) => setNewGomboTenueExigee(e.target.value)}
                                placeholder="ex. Noir & Or, Traditionnelle, Décontractée..."
                                className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Experiénce & Nombre */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">EXPÉRIENCE REQUISE :</label>
                              <input
                                type="text"
                                value={newGomboExperienceSouhaitee}
                                onChange={(e) => setNewGomboExperienceSouhaitee(e.target.value)}
                                placeholder="ex. Professionnel actif, 2 ans sur scène..."
                                className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">NOMBRE DE PRESTATAIRES CHERCHÉS :</label>
                              <input
                                type="number"
                                min="1"
                                value={newGomboNombreRecherche}
                                onChange={(e) => setNewGomboNombreRecherche(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-mono"
                              />
                            </div>
                          </div>

                          {/* Budget Validation (Min limit 15000 FCFA, with block alerts) */}
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <label className="text-[10px] font-mono uppercase text-[#D4AF37] block font-bold">BUDGET TOTAL CACHET DE CONTRAT (FCFA) :</label>
                                <span className="text-[8px] font-mono text-zinc-500">RÉGLEMENTATION MIN : 15 000 FCFA</span>
                              </div>
                              <input
                                type="number"
                                min="15000"
                                value={newGomboPrice}
                                onChange={(e) => setNewGomboPrice(parseInt(e.target.value) || 0)}
                                className={`w-full bg-black border rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none transition-all ${
                                  newGomboPrice < 15000 ? "border-red-500/50 text-red-400 focus:border-red-500" : "border-zinc-800 focus:border-[#D4AF37]"
                                }`}
                              />
                              {newGomboPrice < 15000 && (
                                <p className="text-[10px] font-mono text-red-500 mt-1">
                                  ⚠️ Le budget d'honneur minimum est de 15 000 FCFA. Les déclarations de type "à discuter" sont proscrites.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* SYSTEM RENFORT CONTROLS IF RENFORT GROUP SELECTED */}
                          {newGomboCategory === "Renfort groupe" && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 p-5 bg-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-2xl space-y-4 text-left"
                            >
                              <div className="border-b border-[#D4AF37]/20 pb-2.5">
                                <span className="text-[8.5px] uppercase font-mono tracking-widest text-[#D4AF37] font-bold block">🛡️ SYSTEM RENFORT GROUPE ACTIVÉ</span>
                                <span className="text-[10px] text-zinc-400">Tous les frais de transport et de répétition sont bloqués immédiatement sur notre compte Escrow.</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block">INDEMNITÉ TRANSPORT / RÉPÉTITION (FCFA) :</label>
                                  <input 
                                    type="number"
                                    value={newGomboTransportFee}
                                    onChange={(e) => setNewGomboTransportFee(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full bg-black border border-[#D4AF37]/20 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#D4AF37]"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block">NOMBRE TOTAL DE RÉPÉTITIONS :</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={newGomboRepetitionsCount}
                                    onChange={(e) => setNewGomboRepetitionsCount(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full bg-black border border-[#D4AF37]/20 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#D4AF37]"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block">DATES DES RÉPÉTITIONS :</label>
                                  <input 
                                    type="text"
                                    value={newGomboRepetitionsDates}
                                    onChange={(e) => setNewGomboRepetitionsDates(e.target.value)}
                                    placeholder="ex. 12, 14 et 16 Juin (Salle Burida)"
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4AF37]"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block">HORAIRES DES RÉPÉTITIONS :</label>
                                  <input 
                                    type="text"
                                    value={newGomboRepetitionsSchedule}
                                    onChange={(e) => setNewGomboRepetitionsSchedule(e.target.value)}
                                    placeholder="ex. 18:00 - 21:00"
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4AF37]"
                                  />
                                </div>
                              </div>

                              {/* Escrow Guarantee visual details */}
                              <div className="bg-[#121214] p-3 rounded-xl border border-[#D4AF37]/15 flex items-center justify-between text-xs font-mono">
                                <span className="text-[#D4AF37]">BUDGET TRANSPORT ESTIMÉ :</span>
                                <span className="text-white font-bold">{(newGomboTransportFee * newGomboRepetitionsCount).toLocaleString()} FCFA</span>
                              </div>
                            </motion.div>
                          )}

                          <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">DESCRIPTION DU CONTRAT ET DU DÉROULÉ :</label>
                            <textarea
                              value={newGomboDesc}
                              onChange={(e) => setNewGomboDesc(e.target.value)}
                              placeholder="Détails du gombo, obligations, styles musicaux phares à respecter..."
                              className="w-full h-24 bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all resize-none font-sans"
                            />
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-white/5 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveMenu("user_terrain")}
                          className="flex-1 py-3 text-xs font-mono font-bold uppercase rounded-xl border border-zinc-800 text-zinc-400 hover:bg-white/5 transition-all cursor-pointer"
                        >
                          Annuler
                        </button>
                        
                        <button
                          type="button"
                          onClick={triggerPubSubmit}
                          className="flex-1 py-3 text-xs font-mono font-black uppercase rounded-xl bg-[#D4AF37] hover:bg-[#B48F17] text-[#0B0B0B] transition-all cursor-pointer shadow-md"
                        >
                          Publier sur Le Terrain 📡
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 4. PRIVACY PAGE DIRECT ANCHOR */}
              {activeMenu === "privacy" && (
                <div className="animate-fadeIn">
                  <PrivacyPage onBack={() => setActiveMenu("user_terrain")} />
                </div>
              )}

              {/* 5. TERMS PAGE DIRECT ANCHOR */}
              {activeMenu === "terms" && (
                <div className="animate-fadeIn">
                  <TermsPage onBack={() => setActiveMenu("user_terrain")} />
                </div>
              )}

              {/* 6. DELETE ACCOUNT DIRECT ANCHOR */}
              {activeMenu === "delete_account" && (
                <div className="animate-fadeIn">
                  <DeleteAccountPage onBack={() => setActiveMenu("user_terrain")} />
                </div>
              )}

              {activeMenu === "user_heritage" && (() => {
                const isGoogleConnected = currentUser && (
                  currentUser.providerData?.some((p: any) => p.providerId === "google.com" || p.providerId === "google") ||
                  profile?.provider === "google.com" ||
                  currentUser.email?.endsWith("@gmail.com")
                );

                if (!isGoogleConnected) {
                  return (
                    <div className="max-w-md mx-auto my-12 p-6.5 bg-[#09090b]/90 border border-red-500/30 rounded-3xl text-center space-y-6 shadow-2xl animate-fadeIn">
                      <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-red-950/20 border border-red-500/35 flex items-center justify-center text-3xl">
                          🔐
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-sm font-sans font-black tracking-widest text-red-500 uppercase">
                          ACCÈS STRICTEMENT RESTREINT
                        </h2>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          La section <strong className="text-[#D4AF37]">Mon Héritage</strong> (droits BURIDA, certification Gombo ID et historique de prestige d'Abidjan) requiert obligatoirement une authentification via un compte Google officiel.
                        </p>
                      </div>

                      <div className="bg-black/60 p-4 rounded-2xl border border-zinc-900 text-center">
                        <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider block mb-1">PROTÉGER VOTRE PATRIMOINE</span>
                        <p className="text-[11px] text-zinc-500 leading-normal">
                          Pour éradiquer les usurpateurs et certifier la fiabilité d'AFRIGOMBO, la signature Google est la clé unique d'accès.
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <button
                          onClick={async () => {
                            try { audioSynth.playKoraNote(392, 0, 0.08, 0.3); } catch(_) {}
                            setIsAuthModalOpen(true);
                          }}
                          className="w-full py-3 bg-[#D4AF37] hover:bg-[#B48F17] text-black font-sans text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
                        >
                          Se Connecter de manière sécurisée via Google 🚀
                        </button>

                        <button
                          onClick={() => {
                            try { audioSynth.playValidationSuccess(); } catch(_) {}
                            setActiveMenu("user_terrain");
                          }}
                          className="w-full py-2.5 bg-transparent border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-[10px] uppercase tracking-wider font-mono cursor-pointer transition-all active:scale-95"
                        >
                          Retourner au Terrain d'Action 🗺️
                        </button>
                      </div>
                    </div>
                  );
                }

                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-zinc-500">Aucun artiste sélectionné.</p>;

                // nested Gombo ID screen inside Héritage
                if (viewingGomboIdDetail) {
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
                    <div className="space-y-6 animate-fadeIn pb-24 text-left">
                      {/* Back button */}
                      <button
                        onClick={() => {
                          setViewingGomboIdDetail(false);
                          try { audioSynth.playValidationSuccess(); } catch (err) {}
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-950 border border-zinc-800 hover:border-[#D4AF37]/50 text-white rounded-xl text-xs font-mono transition-all cursor-pointer select-none active:scale-95"
                      >
                        ← Retour à Mon Héritage
                      </button>

                      <GomboIdUserDashboard
                        currentUser={artistWithRating}
                        onUpdateUser={handleUpdateUser}
                        onCreateTransaction={handleCreateTransaction}
                        addToTerminal={(msg: string) => addToTerminal(msg)}
                      />
                    </div>
                  );
                }

                // Main Mon Héritage view
                return (
                  <div className="space-y-6 animate-fadeIn pb-32 text-left">
                    {/* CUSTOM HEADER MATCHING THE IMAGE */}
                    <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
                      <div>
                        <h1 className="text-xl font-sans font-black tracking-wider text-white uppercase">
                          MON HÉRITAGE
                        </h1>
                        <p className="text-[10px] xs:text-xs text-zinc-400 mt-0.5 font-sans">
                          Votre identité, votre carrière, votre impact.
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {/* Notification Bell with Badge */}
                        <button
                          onClick={() => {
                            setActiveMenu("user_notifications");
                            try { audioSynth.playValidationSuccess(); } catch (e) {}
                          }}
                          className="relative flex items-center justify-center w-10 h-10 rounded-full border border-zinc-800/80 bg-zinc-900/90 text-white hover:text-[#D4AF37] transition-all cursor-pointer active:scale-95"
                        >
                          <Bell className="w-4 h-4 text-[#D4AF37]" />
                          {realNotifications.filter(n => !n.read).length > 0 && (
                            <motion.span
                              key={realNotifications.filter(n => !n.read).length}
                              initial={{ scale: 1 }}
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 0.3 }}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4AF37] text-black text-[9px] font-black font-mono rounded-full flex items-center justify-center border border-black shadow"
                            >
                              {realNotifications.filter(n => !n.read).length}
                            </motion.span>
                          )}
                        </button>
                        {/* Settings Cog */}
                        <button
                          onClick={() => {
                            setActiveMenu("user_settings");
                            try { audioSynth.playValidationSuccess(); } catch (e) {}
                          }}
                          className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-800/80 bg-zinc-900/90 text-white hover:text-[#D4AF37] transition-all cursor-pointer active:scale-95"
                        >
                          <Settings className="w-4 h-4 text-[#D4AF37]" />
                        </button>
                      </div>
                    </div>

                    {/* MAIN PROFILE CARD */}
                    <div className="p-5 rounded-2xl bg-zinc-950/30 border border-zinc-900/60 flex flex-col sm:flex-row items-center sm:items-start gap-4 shadow-xl">
                      {/* Avatar with Ring & Crown Overlay */}
                      <div className="relative shrink-0 select-none">
                        <div className="w-[100px] h-[100px] rounded-full p-0.5 border border-[#D4AF37]/80 bg-zinc-950 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                          <div className="w-full h-full rounded-full border border-[#D4AF37]/30 overflow-hidden flex items-center justify-center font-bold text-2xl text-[#D4AF37] bg-zinc-900">
                            {currentArtist.avatarUrl ? (
                              <img src={currentArtist.avatarUrl} alt={currentArtist.artisticName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              (currentArtist.artisticName || "Tom Sylvestre").charAt(0)
                            )}
                          </div>
                        </div>
                        {/* Crown Badge */}
                        <div className="absolute top-0 left-0 -translate-x-1 -translate-y-1 w-6 h-6 bg-[#D4AF37] border-2 border-zinc-950 rounded-full flex items-center justify-center shadow">
                          <Crown className="w-3.5 h-3.5 text-black" fill="currentColor" />
                        </div>
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 justify-center sm:justify-start">
                          <h2 className="text-xl font-sans font-black text-white tracking-wide flex items-center justify-center sm:justify-start gap-1.5">
                            {currentArtist.artisticName || "Tom Sylvestre"}
                            <span className="inline-flex w-4 h-4 rounded-full bg-[#D4AF37] items-center justify-center text-[10px] text-black font-black select-none shadow-sm font-sans" title="Vérifié">
                              ✓
                            </span>
                          </h2>
                        </div>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">
                          @{currentArtist.name || "TomSylvestre"}
                        </p>
                        
                        <div className="space-y-1 pt-1 text-xs">
                          <div className="flex items-center justify-center sm:justify-start gap-1 text-zinc-300">
                            <span className="text-[#D4AF37]">🎙️</span>
                            <span className="font-semibold">{currentArtist.specialties?.join(" • ") || "Artiste • Chanteur • Compositeur"}</span>
                          </div>
                          
                          <div className="flex items-center justify-center sm:justify-start gap-1 text-zinc-400">
                            <span>📍</span>
                            <span>{currentArtist.commune || "Abidjan, Côte d'Ivoire"} 🇨🇮</span>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-center sm:justify-start">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-950/80 border border-[#D4AF37]/50 rounded-full text-[10px] font-mono text-[#D4AF37] font-bold">
                            <span className="text-[#D4AF37] text-[10px]">✓</span> Artiste Vérifié
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AFRI ID ROW */}
                    <div className="rounded-2xl p-5 bg-gradient-to-br from-purple-900/10 via-zinc-900/40 to-zinc-900/10 border border-purple-500/20 mb-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="p-3 bg-zinc-950 border border-purple-500/30 rounded-2xl flex items-center justify-center shrink-0">
                            <div className="relative w-8 h-8 flex items-center justify-center bg-black rounded-lg">
                               <span className="font-serif font-bold text-xl text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-[#D4AF37]">A</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-base font-sans font-black text-white tracking-wide uppercase flex items-center gap-2">
                              AFRI ID
                              {currentArtist.afriId && <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold tracking-widest">{currentArtist.afriId}</span>}
                            </h4>
                            <p className="text-[10px] font-mono font-bold tracking-widest text-purple-400 uppercase">
                              IDENTITÉ UNIVERSELLE
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">
                              Sésame unique pour Afrigombo, AfriWallet et AfriLivraison.
                            </p>
                          </div>
                        </div>

                        {!currentArtist.afriId && (
                          <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-900 text-white text-xs font-sans font-black uppercase tracking-wider rounded-xl shadow-lg opacity-80 cursor-not-allowed text-center shrink-0">
                            GÉNÉRATION EN COURS...
                          </div>
                        )}
                        {currentArtist.afriId && (
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Applications connectées :</span>
                            <div className="flex gap-2">
                              {currentArtist.ecosystemApps?.afrigombo && <span className="text-[10px] px-2 py-1 bg-zinc-950 border border-[#D4AF37]/30 text-[#D4AF37] rounded-md font-black italic tracking-widest">AFRIGOMBO</span>}
                              {currentArtist.ecosystemApps?.afriwallet && <span className="text-[10px] px-2 py-1 bg-zinc-950 border border-blue-500/30 text-blue-400 rounded-md font-black italic tracking-widest">AFRIWALLET</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* GOMBO ID ROW (African Gold & Premium Black Accent) */}
                    <div className="rounded-2xl p-5 bg-gradient-to-br from-zinc-950 via-zinc-900/40 to-zinc-910 border border-[#D4AF37]/15">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="p-3 bg-zinc-950 border border-[#D4AF37]/20 rounded-2xl flex items-center justify-center text-[#D4AF37] shrink-0">
                            {/* Shield-Music icon style matching screenshot */}
                            <div className="relative w-8 h-8 flex items-center justify-center">
                              <ShieldCheck className="w-8 h-8 text-[#D4AF37]" strokeWidth={1.5} />
                              <Music className="w-4 h-4 text-[#D4AF37] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-base font-sans font-black text-white tracking-wide uppercase">
                              GOMBO ID
                            </h4>
                            <p className="text-[10px] font-mono font-bold tracking-widest text-[#D4AF37] uppercase">
                              VOTRE CRÉDIBILITÉ ARTISTIQUE
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">
                              Obtenez votre certification et boostez votre carrière.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setViewingGomboIdDetail(true);
                            try { audioSynth.playValidationSuccess(); } catch (err) {}
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B48F17] hover:from-[#E4BF47] hover:to-[#C49F27] text-black text-xs font-sans font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 shrink-0 text-center"
                        >
                          OBTENIR MON GOMBO ID →
                        </button>
                      </div>

                      {/* KYC : NON VÉRIFIÉ bar */}
                      <div
                        onClick={() => {
                          setViewingGomboIdDetail(true);
                          try { audioSynth.playValidationSuccess(); } catch (err) {}
                        }}
                        className="mt-4 pt-3.5 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2 text-zinc-400 font-mono font-bold text-[10px] tracking-wider uppercase">
                          <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
                          <span>
                            KYC : <span className="text-[#D4AF37]">{currentArtist.kycStatus === "approved" ? "APPROUVÉ & VÉRIFIÉ" : "NON VÉRIFIÉ"}</span>
                          </span>
                        </div>
                        <span className="text-[#D4AF37] font-black">{`>`}</span>
                      </div>
                    </div>

                    {/* THREE COLUMNS STATISTICS ROW */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Abonnés */}
                      <div className="p-4 rounded-2xl bg-zinc-950/30 border border-zinc-900/60 shadow-lg text-center space-y-1">
                        <Users className="w-5 h-5 text-[#D4AF37] mx-auto opacity-90" />
                        <strong className="text-xl font-sans font-black text-white block">
                          {currentArtist.followersCount || 142}
                        </strong>
                        <span className="text-[8px] xs:text-[9px] text-zinc-500 font-mono block uppercase tracking-wider font-bold">
                          ABONNÉS
                        </span>
                      </div>

                      {/* Publications */}
                      <div className="p-4 rounded-2xl bg-zinc-950/30 border border-zinc-900/60 shadow-lg text-center space-y-1">
                        <div className="text-xl leading-none italic text-[#D4AF37] font-bold">🎚️</div>
                        <strong className="text-xl font-sans font-black text-white block">
                          {currentArtist.postsCount || 12}
                        </strong>
                        <span className="text-[8px] xs:text-[9px] text-zinc-500 font-mono block uppercase tracking-wider font-bold">
                          PUBLICATIONS
                        </span>
                      </div>

                      {/* Engagement */}
                      <div className="p-4 rounded-2xl bg-zinc-950/30 border border-zinc-900/60 shadow-lg text-center space-y-1">
                        <TrendingUp className="w-5 h-5 text-[#D4AF37] mx-auto opacity-90" />
                        <strong className="text-xl font-sans font-black text-white block">
                          {currentArtist.engagementRate || "12.4%"}
                        </strong>
                        <span className="text-[8px] xs:text-[9px] text-zinc-500 font-mono block uppercase tracking-wider font-bold">
                          ENGAGEMENT
                        </span>
                      </div>
                    </div>

                    {/* BIOGRAPHY SECTION CARD */}
                    <div className="p-4 bg-zinc-950/30 border border-zinc-900/60 rounded-2xl flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1 text-left">
                        <span className="text-[10px] font-mono font-bold tracking-widest text-[#D4AF37] uppercase block">
                          BIOGRAPHIE
                        </span>
                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                          {currentArtist.bio || "Artiste afrobeat passionné. Je transforme les rythmes en héritage. Bienvenue dans mon univers."}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveMenu("user_edit_profile");
                          try { audioSynth.playValidationSuccess(); } catch (err) {}
                        }}
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-[#D4AF37]/50 text-[10px] font-mono font-bold text-zinc-300 uppercase rounded-full flex items-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0"
                      >
                        ✏️ MODIFIER
                      </button>
                    </div>

                    {/* SECTION: MA CARRIÈRE GOMBO */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-sans font-black tracking-widest text-[#D4AF37] uppercase flex items-center gap-1.5 pl-1">
                        <span>☁️</span> MA CARRIÈRE GOMBO
                      </h3>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* item 1: morceaux publiés */}
                        <div className="p-4 bg-zinc-950/30 border border-zinc-900/60 rounded-2xl text-center space-y-1 shadow-lg">
                          <Music className="w-5 h-5 text-[#D4AF37] mx-auto" strokeWidth={1.5} />
                          <strong className="text-2xl font-sans font-black text-white block mt-1">
                            {currentArtist.tracksCount || 8}
                          </strong>
                          <span className="text-[9px] text-zinc-500 font-mono block uppercase tracking-wider leading-tight">
                            MORCEAUX <br /> publiés
                          </span>
                        </div>

                        {/* item 2: concerts réalisés */}
                        <div className="p-4 bg-zinc-950/30 border border-zinc-900/60 rounded-2xl text-center space-y-1 shadow-lg">
                          <Radio className="w-5 h-5 text-[#D4AF37] mx-auto animate-pulse" strokeWidth={1.5} />
                          <strong className="text-2xl font-sans font-black text-white block mt-1">
                            {currentArtist.concertsCount || 5}
                          </strong>
                          <span className="text-[9px] text-zinc-500 font-mono block uppercase tracking-wider leading-tight">
                            CONCERTS <br /> réalisés
                          </span>
                        </div>

                        {/* item 3: distinctions reçues */}
                        <div className="p-4 bg-zinc-950/30 border border-zinc-900/60 rounded-2xl text-center space-y-1 shadow-lg">
                          <Award className="w-5 h-5 text-[#D4AF37] mx-auto" strokeWidth={1.5} />
                          <strong className="text-2xl font-sans font-black text-white block mt-1">
                            {currentArtist.awardsCount || 3}
                          </strong>
                          <span className="text-[9px] text-zinc-500 font-mono block uppercase tracking-wider leading-tight">
                            DISTINCTIONS <br /> reçues
                          </span>
                        </div>

                        {/* item 4: collabos */}
                        <div className="p-4 bg-zinc-950/30 border border-zinc-900/60 rounded-2xl text-center space-y-1 shadow-lg">
                          <div className="text-xl leading-none text-[#D4AF37] font-bold">🤝</div>
                          <strong className="text-2xl font-sans font-black text-white block mt-1">
                            {currentArtist.collabsCount || 7}
                          </strong>
                          <span className="text-[9px] text-zinc-500 font-mono block uppercase tracking-wider leading-tight">
                            COLLABORATIONS <br /> réalisées
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION: MONÉTISATION */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-sans font-black tracking-widest text-[#D4AF37] uppercase flex items-center gap-1.5 pl-1">
                        <span>🪙</span> MONÉTISATION
                      </h3>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* item 1: Gawa revenue */}
                        <div className="p-4 bg-zinc-950/30 border border-zinc-900/60 rounded-2xl text-center space-y-1 shadow-lg">
                          <div className="text-xl leading-none text-[#D4AF37]">💳</div>
                          <strong className="text-[15px] font-mono font-black text-white block mt-1">
                            {(currentArtist.revenues || 123510).toLocaleString("fr-FR")}
                          </strong>
                          <span className="text-[9px] text-zinc-500 font-mono block uppercase tracking-wider leading-tight">
                            GAWA GAGNÉS
                          </span>
                        </div>

                        {/* item 2: Boosts achetés */}
                        <div className="p-4 bg-zinc-950/30 border border-zinc-900/60 rounded-2xl text-center space-y-1 shadow-lg">
                          <Zap className="w-5 h-5 text-[#D4AF37] mx-auto animate-bounce duration-1000" strokeWidth={1.5} />
                          <strong className="text-2xl font-sans font-black text-white block mt-1">
                            {currentArtist.boostsCount || 4}
                          </strong>
                          <span className="text-[9px] text-zinc-500 font-mono block uppercase tracking-wider leading-tight">
                            BOOSTS ACHETÉS
                          </span>
                        </div>

                        {/* item 3: Candidatures premium */}
                        <div className="p-4 bg-zinc-950/30 border border-zinc-900/60 rounded-2xl text-center space-y-1 shadow-lg">
                          <Star className="w-5 h-5 text-[#D4AF37] mx-auto" strokeWidth={1.5} />
                          <strong className="text-2xl font-sans font-black text-white block mt-1">
                            {currentArtist.premiumApplicationsCount || 3}
                          </strong>
                          <span className="text-[9px] text-zinc-500 font-mono block uppercase tracking-wider leading-tight">
                            CANDIDATURES <br /> PREMIUM
                          </span>
                        </div>

                        {/* item 4: supports received */}
                        <div className="p-4 bg-zinc-950/30 border border-zinc-900/60 rounded-2xl text-center space-y-1 shadow-lg">
                          <Heart className="w-5 h-5 text-[#D4AF37] mx-auto" strokeWidth={1.5} />
                          <strong className="text-2xl font-sans font-black text-white block mt-1">
                            {currentArtist.supportsCount || 56}
                          </strong>
                          <span className="text-[9px] text-zinc-500 font-mono block uppercase tracking-wider leading-tight">
                            SOUTIENS <br /> REÇUS
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION: MES DOCUMENTS GOMBO */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-sans font-black tracking-widest text-[#D4AF37] uppercase flex items-center gap-1.5 pl-1">
                        <span>📄</span> MES DOCUMENTS GOMBO
                      </h3>

                      <div
                        onClick={() => {
                          setViewingGomboIdDetail(true);
                          try { audioSynth.playValidationSuccess(); } catch (err) {}
                        }}
                        className="p-4 bg-zinc-950/30 border border-zinc-900/60 rounded-2xl flex items-center justify-between gap-2 shadow-lg cursor-pointer hover:border-[#D4AF37]/35 transition-all select-none"
                      >
                        <div className="flex-1 grid grid-cols-3 divide-x divide-zinc-900/60 gap-1 text-center">
                          {/* doc 1 */}
                          <div className="px-1 space-y-1">
                            <div className="text-xl leading-none">🪪</div>
                            <h5 className="text-[10px] font-sans font-bold text-white block truncate">Pièce d'identité</h5>
                            <span className="inline-block text-[8px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              Vérifiée
                            </span>
                          </div>

                          {/* doc 2 */}
                          <div className="px-1 space-y-1">
                            <div className="text-xl leading-none">🛂</div>
                            <h5 className="text-[10px] font-sans font-bold text-white block truncate">Passeport</h5>
                            <span className="inline-block text-[8px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              En attente
                            </span>
                          </div>

                          {/* doc 3 */}
                          <div className="px-1 space-y-1">
                            <div className="text-xl leading-none">🎓</div>
                            <h5 className="text-[10px] font-sans font-bold text-white block truncate">Certificat artistique</h5>
                            <span className="inline-block text-[8px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              Vérifiée
                            </span>
                          </div>
                        </div>
                        <span className="text-[#D4AF37] font-black text-sm px-1 shrink-0">{`>`}</span>
                      </div>
                    </div>

                    {/* SECTION: ACTIONS RAPIDES */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-sans font-black tracking-widest text-[#D4AF37] uppercase flex items-center gap-1.5 pl-1">
                        <span>⚡</span> ACTIONS RAPIDES
                      </h3>

                      <div className="grid grid-cols-3 gap-3">
                        {/* Modifier profil */}
                        <button
                          onClick={() => {
                            setActiveMenu("user_edit_profile");
                            try { audioSynth.playValidationSuccess(); } catch (err) {}
                          }}
                          className="p-4 bg-zinc-950/30 border border-zinc-900/60 hover:border-[#D4AF37]/35 rounded-2xl text-center space-y-2 transition-all cursor-pointer select-none active:scale-95 shadow-lg group"
                        >
                          <UserIcon className="w-5 h-5 text-[#D4AF37]/80 group-hover:text-[#D4AF37] mx-auto transition-colors" />
                          <span className="text-[10px] text-zinc-300 font-mono block leading-tight font-bold">
                            Modifier profil
                          </span>
                        </button>

                        {/* Mes candidatures */}
                        <button
                          onClick={() => {
                            setActiveMenu("user_opportunities");
                            try { audioSynth.playValidationSuccess(); } catch (err) {}
                          }}
                          className="p-4 bg-zinc-950/30 border border-zinc-900/60 hover:border-[#D4AF37]/35 rounded-2xl text-center space-y-2 transition-all cursor-pointer select-none active:scale-95 shadow-lg group"
                        >
                          <div className="text-xl leading-none">📄</div>
                          <span className="text-[10px] text-zinc-300 font-mono block leading-tight font-bold">
                            Mes candidatures
                          </span>
                        </button>

                        {/* Mes favoris */}
                        <button
                          onClick={() => {
                            setActiveMenu("user_mes_gombos");
                            addToTerminal("[FAVORIS] Chargement de vos favoris artistiques...");
                            try { audioSynth.playValidationSuccess(); } catch (err) {}
                          }}
                          className="p-4 bg-zinc-950/30 border border-zinc-900/60 hover:border-[#D4AF37]/35 rounded-2xl text-center space-y-2 transition-all cursor-pointer select-none active:scale-95 shadow-lg group"
                        >
                          <Heart className="w-5 h-5 text-red-500/80 group-hover:text-red-500 mx-auto transition-colors" />
                          <span className="text-[10px] text-zinc-300 font-mono block leading-tight font-bold">
                            Mes favoris
                          </span>
                        </button>

                        {/* Mes opportunités */}
                        <button
                          onClick={() => {
                            setActiveMenu("user_opportunities");
                            try { audioSynth.playValidationSuccess(); } catch (err) {}
                          }}
                          className="p-4 bg-zinc-950/30 border border-zinc-900/60 hover:border-[#D4AF37]/35 rounded-2xl text-center space-y-2 transition-all cursor-pointer select-none active:scale-95 shadow-lg group"
                        >
                          <Briefcase className="w-5 h-5 text-[#D4AF37]/80 group-hover:text-[#D4AF37] mx-auto transition-colors" />
                          <span className="text-[10px] text-zinc-300 font-mono block leading-tight font-bold">
                            Mes opportunités
                          </span>
                        </button>

                        {/* Paramètres */}
                        <button
                          onClick={() => {
                            setActiveMenu("user_settings");
                            try { audioSynth.playValidationSuccess(); } catch (err) {}
                          }}
                          className="p-4 bg-zinc-950/30 border border-zinc-900/60 hover:border-[#D4AF37]/35 rounded-2xl text-center space-y-2 transition-all cursor-pointer select-none active:scale-95 shadow-lg group"
                        >
                          <Settings className="w-5 h-5 text-[#D4AF37]/80 group-hover:text-[#D4AF37] mx-auto transition-colors" />
                          <span className="text-[10px] text-zinc-300 font-mono block leading-tight font-bold">
                            Paramètres
                          </span>
                        </button>

                        {/* Déconnexion */}
                        <button
                          onClick={async () => {
                            try {
                              await logout();
                              try { audioSynth.playTamTam(false); } catch (e) {}
                              addToTerminal("[DECONNEXION] Session artiste déconnectée.");
                            } catch (e) {
                              console.error("Logout error", e);
                            }
                          }}
                          className="p-4 bg-[#ff3b30]/10 border border-[#ff3b30]/30 hover:bg-[#ff3b30]/20 rounded-2xl text-center space-y-2 transition-all cursor-pointer select-none active:scale-95 shadow-lg group"
                        >
                          <LogOut className="w-5 h-5 text-red-500 mx-auto" />
                          <span className="text-[10px] text-red-400 font-mono block leading-tight font-bold">
                            Déconnexion
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* IMPERIAL SÉNAT FAST SWITCHBOARD CARD - Preserved for Admins */}
                    {(isAuthorizedAdmin || isAuthorizedSuperFounder) && (
                      <div className="p-6 bg-gradient-to-br from-[#0a0a0A] via-[#111111] to-black border border-[#D4AF37]/30 rounded-2xl space-y-4 shadow-xl">
                        <div className="flex items-center gap-2">
                          <Crown className="w-5 h-5 text-[#D4AF37] animate-pulse" />
                          <h4 className="text-sm font-display font-black text-white uppercase tracking-wider">
                            Portail de Commandement Impérial GOMBO ELITE
                          </h4>
                        </div>
                        <p className="text-xs text-zinc-300">
                          En tant que Fondateur ou Administrateur Souverain, vous disposez d'un accès au Saint des Saints pour gouverner, certifier les artistes, et auditer les transactions.
                        </p>
                        <div className="flex flex-wrap gap-2.5 pt-1">
                          <button
                            onClick={() => {
                              setPerspective("admin");
                              setActiveMenu("dashboard");
                              try { audioSynth.playValidationSuccess(); } catch (err) {}
                              addToTerminal("[SOUVERAIN] Accès au Cockpit Administrateur.");
                            }}
                            className="px-4 py-2 bg-black border border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-mono font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
                          >
                            🛡️ Ouvrir le Cockpit Admin
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Historical Earnings Progression Graph */}
                    <div className="p-6 bg-zinc-950/30 border border-zinc-900/60 rounded-2xl space-y-4">
                      <h3 className="text-xs font-mono uppercase text-[#D4AF37] tracking-wider font-bold">Progression Cumulée des Cachets</h3>
                      <div className="h-48 w-full font-mono text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={ANALYTICS_DATA}>
                            <defs>
                              <linearGradient id="glowGombo" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25}/>
                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                            <XAxis dataKey="name" stroke="#555" />
                            <YAxis stroke="#555" />
                            <Tooltip contentStyle={{ backgroundColor: "#000", border: '1px solid #D4AF37', color: '#fff' }} />
                            <Area type="monotone" dataKey="commission" stroke="#D4AF37" fillOpacity={1} fill="url(#glowGombo)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {activeMenu === "user_gombo_id" && (() => {
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-zinc-500">Aucun artiste disponible.</p>;

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
                  />
                );
              })()}

              {activeMenu === "user_mes_gombos" && (() => {
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-zinc-500">Aucun artiste disponible.</p>;
                return (
                  <div className="p-6 rounded-2xl bg-zinc-950 border border-white/5 space-y-6 animate-fadeIn">
                    <div className="pb-3 border-b border-white/5">
                      <h3 className="text-sm font-display font-black uppercase text-[#D4AF37] tracking-widest">
                        💼 Mes Prestations & Évaluations Réciproques
                      </h3>
                      <p className="text-xs text-zinc-400">Suivez vos gombos réservés et notez mutuellement vos organisateurs.</p>
                    </div>

                    {/* Prestations list */}
                    <div className="space-y-4">
                      {gombos.slice(0, 2).map((gombo, index) => (
                        <div key={gombo.id} className="p-4 bg-black border border-white/5 rounded-xl space-y-3">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <strong className="text-sm text-white block">{gombo.title}</strong>
                              <span className="text-[10px] text-zinc-500 font-mono">Organisé par : {gombo.organizerName} • {gombo.location}</span>
                            </div>
                            <span className="px-2.5 py-1 rounded bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold uppercase">
                              Cachet : {gombo.budget.toLocaleString()} FCFA
                            </span>
                          </div>

                          {/* Reciprocal feedback review trigger */}
                          <div className="p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-lg space-y-2">
                            <span className="text-[10px] uppercase font-mono text-[#D4AF37] block font-bold">✍️ Évaluation Réciproque d'Académie :</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-300">Note Accordée :</span>
                              <div className="flex gap-1 text-[#D4AF37]">
                                {[1, 2, 3, 4, 5].map(n => (
                                  <Star key={n} className="w-3.5 h-3.5 fill-current cursor-pointer" />
                                ))}
                              </div>
                            </div>
                            <textarea
                              rows={2}
                              placeholder="Ex: Excellent accueil, la régie technique était très professionnelle, et le paiement a été honoré dès la fin de la performance !"
                              className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D4AF37]"
                            />
                            <button
                              onClick={() => {
                                addToTerminal(`[ÉVALUATION] Évaluation impériale transmise pour Gombo ${gombo.id}`);
                                alert("⭐ Votre avis réciproque d'honneur a été scellé dans le marbre d'AFRIGOMBO !");
                              }}
                              className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#B48F17] text-black text-[10px] font-mono font-bold uppercase rounded transition-all"
                            >
                              Soumettre l'avis
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {activeMenu === "user_mes_groupes" && (() => {
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-zinc-500">Aucun artiste disponible.</p>;
                return (
                  <div className="p-6 rounded-2xl bg-zinc-950 border border-white/5 space-y-6 animate-fadeIn">
                    <div className="pb-3 border-b border-white/5 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-display font-black uppercase text-[#D4AF37] tracking-widest">
                          👥 Mes Orchestres & Alliances Régionales
                        </h3>
                        <p className="text-xs text-zinc-400">Affiliez-vous à des groupings pour briguer les Gombos VIP d'Abidjan.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Active Group cards user belongs to */}
                      {currentArtist.groups.map(group => (
                        <div key={group} className="p-4 bg-black border border-[#D4AF37]/30 rounded-xl space-y-2">
                          <strong className="text-xs uppercase font-mono tracking-wider text-[#D4AF37] block">🎼 {group}</strong>
                          <span className="text-[10px] text-zinc-500 font-mono block">Rôle : Guitariste Solo / Soliste Majeur</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold font-mono">Affiliation Active</span>
                        </div>
                      ))}

                      {/* Add new orchestration alliance */}
                      <div className="p-4 bg-black border border-white/5 rounded-xl space-y-3">
                        <span className="text-xs font-bold text-white block uppercase">Créer une Alliance Musicale</span>
                        <input
                          type="text"
                          placeholder="Nom de l'orchestre / grouping..."
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-[#D4AF37]"
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
                        <span className="text-[9px] text-zinc-500 font-mono block">Appuyez sur Entrée pour enregistrer l'orchestre régional.</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {activeMenu === "user_renforts" && (() => {
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-zinc-500">Aucun artiste disponible.</p>;
                return (
                  <div className="p-6 rounded-2xl bg-zinc-950 border border-white/5 space-y-6 animate-fadeIn">
                    <div className="pb-3 border-b border-white/5">
                      <h3 className="text-sm font-display font-black uppercase text-[#D4AF37] tracking-widest">
                        ⚡ Module de Renfort Scénique Express
                      </h3>
                      <p className="text-xs text-zinc-400">Recherchez d'urgence un instrumentiste ou un choriste sur scène à Abidjan.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Form launch dynamic backup */}
                      <div className="p-5 bg-black border border-white/5 rounded-xl space-y-4">
                        <span className="text-xs font-bold font-mono text-[#D4AF37] uppercase block border-b border-white/5 pb-2">🎯 Dispatcher une Alerte de Renfort</span>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-mono text-zinc-400 block font-bold">Instrument ou Backup requis :</label>
                          <select className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs focus:outline-none">
                            <option>Bassiste Zouglou d'élite</option>
                            <option>Percussionniste Sabar en urgence</option>
                            <option>Duo de Backup Singers (Chœur)</option>
                            <option>Joueur de Kora Concertiste</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-mono text-zinc-400 block font-bold">Commune du Concert :</label>
                          <select className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs focus:outline-none">
                            {IVORIAN_COMMUNES.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-mono text-zinc-400 block font-bold">Budget et Urgence :</label>
                          <select className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs focus:outline-none">
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
                          className="w-full py-2 bg-[#D4AF37] hover:bg-[#B48F17] text-black text-xs font-mono font-black uppercase rounded-lg transition-all"
                        >
                          Lancer le Renfort Scénique ⚡
                        </button>
                      </div>

                      {/* Active reinforcements view */}
                      <div className="space-y-2">
                        <span className="text-xs uppercase font-mono text-zinc-500 font-bold block">Appels de Renforts en cours</span>
                        <div className="p-4 bg-black border border-white/5 rounded-xl min-h-60 space-y-3">
                          <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                            <div className="flex justify-between text-xs">
                              <strong className="text-white">Guitariste Solo Zouglou</strong>
                              <span className="text-red-400 font-mono text-[9px] uppercase animate-pulse">Prestation ce soir !</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-1">Lieu : Toit d'Abidjan • Cocody • Cachet : 65 000 FCFA</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {activeMenu === "user_opportunities" && (() => {
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-zinc-500">Aucun artiste disponible.</p>;
                return (
                  <div className="p-6 rounded-2xl bg-zinc-950 border border-white/5 space-y-6 animate-fadeIn">
                    <div className="pb-3 border-b border-white/5">
                      <h3 className="text-sm font-display font-black uppercase text-[#D4AF37] tracking-widest">
                        🌍 Le Bulletin d'Or des Opportunités
                      </h3>
                      <p className="text-xs text-zinc-400">Postulez en un clic sur des contrats d'excellence certifiés.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gombos.map(gombo => (
                        <div key={gombo.id} className="p-4 bg-black border border-white/5 hover:border-[#D4AF37]/30 rounded-xl space-y-3 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider">{gombo.location}</span>
                              {gombo.isBoosted && (
                                <span className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] font-mono text-[9px] px-1.5 py-0.5 rounded font-bold animate-pulse">
                                  CONTRAT D'ACCORD DE SOUVERAINETÉ (BOOSTED)
                                </span>
                              )}
                            </div>
                            <strong className="text-sm text-white block mt-1">{gombo.title}</strong>
                            <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">{gombo.description}</p>
                          </div>

                          <div className="pt-4 flex justify-between items-center border-t border-white/5 mt-3">
                            <strong className="text-sm font-mono text-[#D4AF37]">{gombo.budget.toLocaleString()} FCFA</strong>
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
                              className="px-4 py-1.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37] border border-[#D4AF37]/30 hover:border-transparent rounded-lg text-xs font-mono font-bold text-[#D4AF37] hover:text-black transition-all"
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
                    onClose={() => setActiveMenu("user_terrain")}
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    themeMode={themeMode}
                    setThemeMode={(t) => {
                      setThemeMode(t);
                      localStorage.setItem("gombo_theme_mode", t);
                      if (t === "light-gold") {
                        setDarkMode(false);
                      } else {
                        setDarkMode(true);
                      }
                    }}
                  />
                );
              })()}

              {activeMenu === "user_notifications" && (() => {
                if (!currentUser) {
                  return (
                    <div className="max-w-md mx-auto px-4 py-16 text-center animate-fadeIn select-none">
                      <div className="w-16 h-16 bg-[#D4AF37]/10 border border-[#D4AF37]/35 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(212,175,55,0.15)] animate-pulse">
                        <Bell className="w-8 h-8 text-[#D4AF37]" />
                      </div>
                      <h2 className="text-xl font-display font-black text-white uppercase tracking-wider mb-2">
                        Accès Réservé 🔒
                      </h2>
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-8">
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
                          className="w-full py-3.5 px-6 rounded-2xl bg-[#D5A01C] hover:bg-[#E5B02C] text-black text-xs font-mono font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(212,175,55,0.3)] cursor-pointer select-none active:scale-95 flex items-center justify-center gap-2.5"
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
                          className="w-full py-3 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-mono font-bold uppercase tracking-widest border border-zinc-800 hover:border-zinc-750 transition-all cursor-pointer select-none"
                        >
                          Se connecter par email alternative
                        </button>
                      </div>
                    </div>
                  );
                }

                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-zinc-500">Aucun artiste disponible.</p>;
                return (
                  <div className="space-y-6 animate-fadeIn pb-24 text-left">
                    <NotificationCenter 
                      currentUserProfile={profile || currentArtist} 
                      notifications={realNotifications}
                      onRefreshProfile={() => {}}
                      onNavigateHome={() => {
                        setActiveMenu("user_terrain");
                        try { audioSynth.playValidationSuccess(); } catch (err) {}
                      }}
                    />
                  </div>
                );
              })()}

              {activeMenu === "user_messages" && (() => {
                const currentActiveUserForChat = currentUser ? { uid: currentUser.uid } : { uid: activeArtistId };
                const currentProfileForChat = profile || (users.find(u => u.id === activeArtistId) || users[0]);
                return (
                  <div className="space-y-6 animate-fadeIn pb-24 text-left">
                    <MessagesView
                      currentUser={currentActiveUserForChat}
                      currentProfile={currentProfileForChat}
                      openConvoWithUserId={openConvoWithUserId}
                      setOpenConvoWithUserId={setOpenConvoWithUserId}
                      onBack={() => {
                        setActiveMenu("user_terrain");
                        try { audioSynth.playValidationSuccess(); } catch (err) {}
                      }}
                    />
                  </div>
                );
              })()}

              <div className="pb-24">
                {activeMenu === "user_gombo_plus" && (
                  <div className="animate-fadeIn">
                    <AfrigomboPlus onBack={() => setActiveMenu("user_terrain")} />
                  </div>
                )}
                {activeMenu === "user_gombo_stats" && (
                  <div className="animate-fadeIn">
                    <MusicianStats onBack={() => setActiveMenu("user_terrain")} audioSynth={audioSynth} />
                  </div>
                )}
              </div>

              {activeMenu === "user_edit_profile" && (
                <div className="animate-fadeIn pb-24 text-left">
                  {profile ? (
                    <GomboProfile 
                      currentUserProfile={profile} 
                      onRefreshProfile={refreshProfile}
                      onNavigateView={(view) => {
                        if (view === "dashboard" || view === "home" || view === "/home") {
                          setActiveMenu("user_terrain");
                        } else if (view === "heritage" || view === "main") {
                          setActiveMenu("user_heritage");
                        }
                      }}
                      initialPanelView="edit"
                    />
                  ) : (
                    <div className="p-12 text-center space-y-4">
                      <p className="text-zinc-500 font-mono">Profil non chargé. Veuillez patienter...</p>
                      <button 
                        onClick={() => setActiveMenu("user_heritage")}
                        className="px-6 py-2 bg-[#D4AF37] text-black font-black uppercase rounded-xl"
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
              {activeMenu === "dashboard" && (() => {
                const handleQuickApproveKyc = async (userId: string) => {
                  const targetUser = users.find(u => u.id === userId);
                  const code = (targetUser?.artisticName || "ELT").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "ELT";
                  const digits = Math.floor(10000 + Math.random() * 90000); // 5 digits
                  const gomboIdNumber = `GMB-${code}-${digits}`;

                  const levels = [
                    "🟢 Vérifié AFRIGOMBO",
                    "🥉 Musicien confirmé",
                    "🥈 Professionnel actif",
                    "🥇 Référence AFRIGOMBO"
                  ];
                  const level = levels[Math.floor(Math.random() * levels.length)];

                  const gomboIdObj = {
                    id: gomboIdNumber,
                    scoreConfiance: 95,
                    niveau: level,
                    prestationsTerminees: Math.floor(10 + Math.random() * 40),
                    annulations: Math.floor(Math.random() * 2),
                    retards: 0,
                    certifie: true,
                    createdAt: new Date().toISOString()
                  };

                  const updatedUser = { 
                    kycStatus: "approved" as const, 
                    gomboIdNumber,
                    gomboId: gomboIdObj,
                    isCertified: true,
                    kycApprovedDate: new Date().toLocaleDateString("fr-FR")
                  };
                  setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedUser } : u));
                  await saveToFirestore("users", userId, updatedUser);
                  addToTerminal(`[GOMBO ID] Dossier de ${userId} approuvé par l'administrateur (${gomboIdNumber}).`);
                  try { audioSynth.playValidationSuccess(); } catch (e) {}
                };

                const handleQuickRejectKyc = async (userId: string) => {
                  const updatedUser = { kycStatus: "rejected" as const };
                  setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedUser } : u));
                  await saveToFirestore("users", userId, updatedUser);
                  addToTerminal(`[GOMBO ID] Dossier de ${userId} rejeté.`);
                  try { audioSynth.playTamTam(true); } catch (e) {}
                };

                const handleQuickUnflagPost = async (postId: string) => {
                  setPosts(prev => prev.map(p => p.id === postId ? { ...p, isFlagged: false } : p));
                  await saveToFirestore("posts", postId, { isFlagged: false });
                  addToTerminal(`[SÉCURITÉ] Signalement levé pour le post ${postId}`);
                  try { audioSynth.playValidationSuccess(); } catch (e) {}
                };

                const handleQuickDeletePost = async (postId: string) => {
                  setPosts(prev => prev.filter(p => p.id !== postId));
                  await saveToFirestore("posts", postId, { isDeleted: true });
                  addToTerminal(`[SÉCURITÉ] Post ${postId} définitivement supprimé.`);
                  try { audioSynth.playTamTam(false); } catch (e) {}
                };

                const handleQuickBoostGombo = async (gomboId: string, isBoostedState: boolean) => {
                  setGombos(prev => prev.map(g => g.id === gomboId ? { ...g, isBoosted: isBoostedState } : g));
                  await saveToFirestore("gombos", gomboId, { isBoosted: isBoostedState });
                  addToTerminal(`[GOMBOS] Statut Boosté modifié pour ${gomboId} à ${isBoostedState}`);
                  try { audioSynth.playValidationSuccess(); } catch (e) {}
                };

                const kpiUsersCount = users.length;
                const kpiOnlineCount = users.filter((u: any) => u.status === "active").length;
                const kpiGombosCount = gombos.length;
                const kpiPostsCount = posts.length;
                const kpiPendingKycCount = users.filter((u: any) => u.kycStatus === "pending").length;
                const kpiAlertsCount = posts.filter((p: any) => p.isFlagged).length + alerts.length;
                const kpiApprovedKycCount = users.filter((u: any) => u.kycStatus === "approved").length;
                const kpiRevenuesSum = transactions.reduce((acc: number, curr: any) => acc + (curr.type === "commission" || curr.type === "cert_express" ? curr.amount : 0), 0);

                const pendingIdUsers = users.filter(u => u.kycStatus === "pending");
                const flaggedPosts = posts.filter(p => p.isFlagged);
                const boostedGombos = gombos.filter(g => g.isBoosted);
                const recentSignups = [...users].slice(-5).reverse();

                return (
                  <div className="space-y-8 pb-24 animate-fadeIn text-left">
                    {/* 1. ENTÊTE OPÉRATIONNELLE */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] font-bold uppercase">
                            CENTRE D'ADMINISTRATION
                          </span>
                        </div>
                        <h2 className="text-2xl font-display font-black tracking-tight text-[#FFFFFF] mt-1 uppercase">
                          Gestion • Sécurité • Contrôle
                        </h2>
                        <div className="flex items-center gap-3 mt-3">
                          <img src={currentUser?.photoURL || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61"} alt="admin" className="w-10 h-10 rounded-full border-2 border-[#D4A017] object-cover" />
                          <div>
                            <p className="text-[11px] text-[#B8B8B8] font-mono uppercase tracking-widest font-bold">Administrateur Principal</p>
                            <p className="text-xs text-[#FFFFFF] font-sans font-medium">{userEmail}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right flex flex-col items-end gap-3">
                        <div>
                          <span className="text-[9px] uppercase font-mono text-zinc-500 block font-bold">Activité temps réel (GMT)</span>
                          <strong className="text-xl font-mono font-black text-[#F5F5F5] tracking-wider block mt-0.5">
                            {liveAdminTime}
                          </strong>
                        </div>
                        {userEmail === "jhs.kmj7@gmail.com" && (
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4A017] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D4A017]"></span>
                            </span>
                            <span className="text-[10px] font-mono text-[#D4A017] uppercase font-bold tracking-widest">Connecté</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 1. CARTE RÉSUMÉ DU JOUR (STATISTIQUES FIREBASE RÉELLES) */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4A017] flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-[#D4A017]" />
                        Statistiques Réelles du Système
                      </h3>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#D4AF37]/30 shadow-[0_4px_20px_rgba(212,175,55,0.1)] flex flex-col justify-between text-left">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">Utilisateurs totaux</span>
                          <strong className="text-2xl font-display font-black text-[#FFFFFF] block mt-2">{kpiUsersCount}</strong>
                        </div>

                        <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#D4AF37]/30 shadow-[0_4px_20px_rgba(212,175,55,0.1)] flex flex-col justify-between text-left relative">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full absolute top-4 right-4 animate-pulse"></span>
                          <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">Utilisateurs actifs</span>
                          <strong className="text-2xl font-display font-black text-[#FFFFFF] block mt-2">{kpiOnlineCount}</strong>
                        </div>

                        <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#D4AF37]/30 shadow-[0_4px_20px_rgba(212,175,55,0.1)] flex flex-col justify-between text-left">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">Publications</span>
                          <strong className="text-2xl font-display font-black text-[#FFFFFF] block mt-2">{kpiPostsCount}</strong>
                        </div>

                        <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#D4AF37]/30 shadow-[0_4px_20px_rgba(212,175,55,0.1)] flex flex-col justify-between text-left relative">
                          {(kpiAlertsCount > 0) && (
                            <span className="w-2 h-2 bg-red-500 rounded-full absolute top-4 right-4 animate-pulse"></span>
                          )}
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#B8B8B8] block">Signalements</span>
                          <strong className="text-2xl font-display font-black text-[#FFFFFF] block mt-2">{kpiAlertsCount}</strong>
                        </div>

                        <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[rgba(212,160,23,0.25)] shadow-[0_4px_20px_rgba(212,160,23,0.05)] flex flex-col justify-between text-left">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#B8B8B8] block">Opportunités</span>
                          <strong className="text-2xl font-display font-black text-[#FFFFFF] block mt-2">{kpiGombosCount}</strong>
                        </div>

                        <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[rgba(212,160,23,0.25)] shadow-[0_4px_20px_rgba(212,160,23,0.05)] flex flex-col justify-between text-left">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#B8B8B8] block">Vidéos partagées</span>
                          <strong className="text-2xl font-display font-black text-[#FFFFFF] block mt-2">{posts.filter((p: any) => p.mediaType === 'video').length}</strong>
                        </div>

                        <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[rgba(212,160,23,0.25)] shadow-[0_4px_20px_rgba(212,160,23,0.05)] flex flex-col justify-between text-left">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4A017] block font-bold">Gombo ID validés</span>
                          <strong className="text-2xl font-display font-black text-[#FFFFFF] block mt-2">{kpiApprovedKycCount}</strong>
                        </div>

                        <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[rgba(212,160,23,0.25)] shadow-[0_4px_20px_rgba(212,160,23,0.05)] flex flex-col justify-between text-left">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#B8B8B8] block">Conversations / Msgs</span>
                          <strong className="text-2xl font-display font-black text-[#FFFFFF] block mt-2">En temps réel</strong>
                        </div>
                      </div>
                    </div>

                    {/* 2. ACTIONS ADMINISTRATEUR */}
                    <Suspense fallback={<div className="p-10 text-center text-[#D4A017] font-mono animate-pulse">Chargement modules AdminActions...</div>}>
                      <AdminActions 
                        activeMenu={activeMenu} 
                        setActiveMenu={setActiveMenu} 
                        setIsBroadcastModalOpen={setIsBroadcastModalOpen} 
                        audioSynth={audioSynth} 
                      />
                    </Suspense>

                    {/* 3. & 4. PANNEAUX DE CONTRÔLE (RÉCENTE / SÉCURITÉ) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                      {/* 3. Activité Récente */}
                      <div className="p-6 rounded-2xl bg-[#050505] border border-[#D4AF37]/20 space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                           <Activity className="w-4 h-4 text-[#D4AF37]" />
                           <h4 className="text-xs font-mono font-black text-[#F5F5F5] uppercase tracking-wider">
                             Activité Récente
                           </h4>
                        </div>
                        <ul className="space-y-4 max-h-60 overflow-y-auto px-1 scrollbar-thin">
                          {recentSignups.slice(0, 4).map((u, i) => (
                            <li key={`u-${i}`} className="flex justify-between items-center bg-[#010101] border border-white/5 p-3 rounded-lg hover:border-[#D4AF37]/20 transition-colors">
                              <span className="text-[10px] font-bold text-[#F5F5F5] flex items-center gap-2">
                                <UserPlus className="w-3 h-3 text-emerald-400" />
                                {u.nom || "Nouvel Utilisateur"}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-500 uppercase">inscription</span>
                            </li>
                          ))}
                          {transactions.slice(0, 3).map((tx, i) => (
                            <li key={`tx-${i}`} className="flex justify-between items-center bg-[#010101] border border-white/5 p-3 rounded-lg hover:border-[#D4AF37]/20 transition-colors">
                              <span className="text-[10px] font-bold text-[#F5F5F5] flex items-center gap-2">
                                <Wallet className="w-3 h-3 text-[#D4AF37]" />
                                {tx.description}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-500 uppercase">paiement</span>
                            </li>
                          ))}
                          {posts.slice(0, 3).map((p, i) => (
                            <li key={`p-${i}`} className="flex justify-between items-center bg-[#010101] border border-white/5 p-3 rounded-lg hover:border-[#D4AF37]/20 transition-colors">
                               <span className="text-[10px] font-bold text-[#F5F5F5] flex items-center gap-2 truncate pr-2 max-w-[200px]">
                                <FileText className="w-3 h-3 text-cyan-400" />
                                {p.title || "Nouvelle opportunité"}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-500 uppercase shrink-0">publication</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 4. Sécurité & Alertes Temps Réel */}
                      <div className="p-6 rounded-2xl bg-[#0A0A0A] border border-[rgba(212,160,23,0.25)] space-y-4 shadow-[0_4px_20px_rgba(212,160,23,0.05)]">
                         <div className="flex items-center gap-2 pb-3 border-b border-[rgba(212,160,23,0.1)]">
                           <ShieldAlert className="w-4 h-4 text-red-500" />
                           <h4 className="text-xs font-mono font-black text-[#FFFFFF] uppercase tracking-wider">
                             Alertes Temps Réel
                           </h4>
                           <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-auto" />
                        </div>
                        <ul className="space-y-3">
                          <li className="flex justify-between items-center bg-[#050505] p-3 rounded-lg border border-[rgba(212,160,23,0.15)] group hover:border-[#D4A017] transition-all">
                            <span className="text-[10px] font-bold text-[#F5F5F5] flex items-center gap-2">
                              <Users className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                              Nouveaux utilisateurs
                            </span>
                            <span className="text-xs font-mono font-black text-emerald-400">{brief.newUsersCount} (7j)</span>
                          </li>
                          <li className="flex justify-between items-center bg-[#050505] p-3 rounded-lg border border-[rgba(212,160,23,0.15)] group hover:border-red-500 transition-all">
                            <span className="text-[10px] font-bold text-[#F5F5F5] flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3 text-red-500 group-hover:scale-110 transition-transform" />
                              Signalements critiques
                            </span>
                            <span className="text-xs font-mono font-black text-red-500">{alerts.filter((a: any) => a.priority === 'high' || a.priority === 'critique').length}</span>
                          </li>
                          <li className="flex justify-between items-center bg-[#050505] p-3 rounded-lg border border-[rgba(212,160,23,0.15)] group hover:border-amber-500 transition-all">
                            <span className="text-[10px] font-bold text-[#F5F5F5] flex items-center gap-2">
                              <MessageSquare className="w-3 h-3 text-amber-500 group-hover:scale-110 transition-transform" />
                              Publications suspectes
                            </span>
                            <span className="text-xs font-mono font-black text-amber-500">
                              {flaggedPosts.length}
                            </span>
                          </li>
                          <li className="flex justify-between items-center bg-[#050505] p-3 rounded-lg border border-[rgba(212,160,23,0.15)] group hover:border-[#D4AF37] transition-all">
                            <span className="text-[10px] font-bold text-[#F5F5F5] flex items-center gap-2">
                              <Zap className="w-3 h-3 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                              Erreurs système
                            </span>
                            <span className="text-xs font-mono font-black text-[#D4AF37]">
                              {alerts.filter((a: any) => a.type === 'system_error').length}
                            </span>
                          </li>
                        </ul>
                        
                        <button
                          onClick={triggerGlobalSystemScan}
                          disabled={scannerStatus === "scanning"}
                          className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#D4A017] hover:bg-[#B8860B] active:scale-95 transition-all text-[10px] font-mono font-black uppercase tracking-wider text-black shadow-md shadow-[#D4A017]/20"
                        >
                          <RefreshCw className={`w-3 h-3 ${scannerStatus === "scanning" ? "animate-spin" : ""}`} />
                          Forcer Scan de Sécurité
                        </button>
                      </div>
                    </div>

                    {/* 5. ACCÈS SUPER FONDATEUR */}
                    {isAuthorizedSuperFounder && (
                      <div className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-[#030303] via-[#0D0D15] to-[#030303] border border-[#D4AF37]/40 shadow-[0_10px_40px_rgba(212,175,55,0.1)] text-center space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 transform rotate-12 opacity-5 pointer-events-none">
                           <Crown className="w-64 h-64 text-[#D4AF37]" />
                        </div>
                        
                        <div className="relative z-10 space-y-2">
                          <h4 className="text-sm font-display font-black text-[#D4AF37] uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                            <Crown className="w-5 h-5" />
                            Gouvernance Suprême
                          </h4>
                          <p className="text-[11px] text-zinc-400 font-mono">
                            Zone réservée exclusivement au Fondateur de l'Empire AfriGombo.
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setActiveMenu("super_admin");
                            addToTerminal("👑 [SOUVERAINETÉ] Accès accordé au Palais Numérique.");
                            try { audioSynth.playTamTam(true); } catch (err) {}
                          }}
                          className="relative z-10 group px-8 py-4 bg-black border border-[#D4AF37] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black font-display font-black text-sm uppercase tracking-widest rounded-2xl transition-all duration-500 flex items-center justify-center gap-4 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] mx-auto w-full md:w-auto"
                        >
                          <Crown className="w-5 h-5" />
                          <span>Accéder au Palais Fondateur</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ----------------------------------------------------
                                VIEW: CABINET SUPRÊME PRIVÉ (LE TRÔNE DU FONDATEUR)
                  ---------------------------------------------------- */}
              {activeMenu === "super_admin" && (
                <FounderThrone
                  adminEmail={adminEmail}
                  users={users}
                  setUsers={setUsers}
                  gombos={gombos}
                  setGombos={setGombos}
                  transactions={transactions}
                  setTransactions={setTransactions}
                  alerts={alerts}
                  setAlerts={setAlerts}
                  reviews={reviews}
                  setReviews={setReviews}
                  systemCommissionRate={systemCommissionRate}
                  setSystemCommissionRate={setSystemCommissionRate}
                  addToTerminal={addToTerminal}
                  saveToFirestore={saveToFirestore}
                  createTransaction={createTransaction}
                  onClose={() => {
                    window.history.pushState({}, "", "/");
                    setPerspective("user");
                    setActiveMenu("user_terrain");
                    addToTerminal(`[INFO] Cabinet du Trône fermé. Retour au Terrain.`);
                  }}
                />
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
                            className="bg-[#060606] border border-[#D4AF37]/40 rounded-2xl overflow-hidden shadow-[0_4px_25px_rgba(212,175,55,0.06)] flex flex-col justify-between"
                          >
                            <div className="relative h-28 w-full bg-cover bg-center" style={{ backgroundImage: `url(${best.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80'})` }}>
                              <div className="absolute inset-0 bg-gradient-to-t from-[#060606] to-transparent" />
                              <span className="absolute top-3 left-3 bg-[#D4AF37] text-[#0B0B0B] text-[9px] uppercase font-mono font-black px-2.5 py-0.5 rounded-full shadow-lg">
                                👑 Sommet d'Élite
                              </span>
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                              <div>
                                <h5 className="font-display font-bold text-sm text-[#F5F5F5] truncate">{best.title}</h5>
                                <p className="text-[11px] text-[#F5F5F5]/60 line-clamp-1 mt-1">{best.description}</p>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-[#D4AF37]/10">
                                <span className="text-[10px] font-mono text-[#F5F5F5]/40">{best.location}</span>
                                <span className="text-sm font-mono font-bold text-[#D4AF37]">{best.budget.toLocaleString()} FCFA</span>
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
                            className="bg-[#060606] border border-[#EF4444]/40 rounded-2xl overflow-hidden shadow-[0_4px_25px_rgba(239,68,68,0.06)] flex flex-col justify-between"
                          >
                            <div className="relative h-28 w-full bg-cover bg-center" style={{ backgroundImage: `url(${urgent.imageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80'})` }}>
                              <div className="absolute inset-0 bg-gradient-to-t from-[#060606] to-transparent" />
                              <span className="absolute top-3 left-3 bg-[#EF4444] text-[#F5F5F5] text-[9px] uppercase font-mono font-black px-2.5 py-0.5 rounded-full shadow-lg animate-pulse">
                                🚨 Urgent
                              </span>
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                              <div>
                                <h5 className="font-display font-bold text-sm text-[#F5F5F5] truncate">{urgent.title}</h5>
                                <p className="text-[11px] text-[#F5F5F5]/60 line-clamp-1 mt-1">{urgent.description}</p>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-[#D4AF37]/10">
                                <span className="text-[10px] font-mono text-[#F5F5F5]/40">{urgent.location}</span>
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
                            className="bg-[#060606] border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_4px_25px_rgba(6,182,212,0.06)] flex flex-col justify-between"
                          >
                            <div className="relative h-28 w-full bg-cover bg-center" style={{ backgroundImage: `url(${popular.imageUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&auto=format&fit=crop&q=80'})` }}>
                              <div className="absolute inset-0 bg-gradient-to-t from-[#060606] to-transparent" />
                              <span className="absolute top-3 left-3 bg-cyan-500 text-black text-[9px] uppercase font-mono font-black px-2.5 py-0.5 rounded-full shadow-lg">
                                💥 Très Convoité
                              </span>
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                              <div>
                                <h5 className="font-display font-bold text-sm text-[#F5F5F5] truncate">{popular.title}</h5>
                                <p className="text-[11px] text-[#F5F5F5]/60 line-clamp-1 mt-1">{popular.description}</p>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-[#D4AF37]/10">
                                <span className="text-[10px] font-mono text-[#F5F5F5]/40">{popular.applicantsCount} prétendants</span>
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
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#060606] to-[#D4AF37]/5 border border-[#D4AF37]/30 shadow-[0_4px_25px_rgba(212,175,55,0.06)] relative overflow-hidden flex flex-col justify-between">
                      <span className="text-[9px] uppercase font-mono bg-[#D4AF37] text-black px-2 py-0.5 rounded-full font-bold w-fit mb-3">
                        🔥 Gombo du Jour
                      </span>
                      <div>
                        <h4 className="text-xs font-display font-bold text-[#F5F5F5] line-clamp-1">Grand Réveillon Select</h4>
                        <p className="text-[11px] text-[#D4AF37] mt-1 font-mono">450 000 FCFA</p>
                      </div>
                    </div>

                    {/* Talent du Jour */}
                    <div className="p-5 rounded-2xl bg-[#060606] border border-[#D4AF37]/20 shadow-sm flex flex-col justify-between">
                      <span className="text-[9px] uppercase font-mono bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-2 py-0.5 rounded-full font-bold w-fit mb-3">
                        👑 Chef du Réseau
                      </span>
                      <div>
                        <h4 className="text-xs font-display font-bold text-[#F5F5F5]">Ariel Loua</h4>
                        <p className="text-[11px] text-[#F5F5F5]/60 mt-1">Commune : Cocody</p>
                      </div>
                    </div>

                    {/* Defi du Jour */}
                    <div className="p-5 rounded-2xl bg-[#060606] border border-[#D4AF37]/20 shadow-sm flex flex-col justify-between">
                      <span className="text-[9px] uppercase font-mono bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 px-2 py-0.5 rounded-full font-bold w-fit mb-3">
                        🎯 Défi Hebdo
                      </span>
                      <div>
                        <h4 className="text-xs font-display font-bold text-[#F5F5F5]">Zouglou Keyboard Solo</h4>
                        <p className="text-[11px] text-[#D4AF37] mt-1 font-mono">Récompense : Gombo ID Or</p>
                      </div>
                    </div>

                    {/* Gombos pres de moi (Location highlights) */}
                    <div className="p-5 rounded-2xl bg-[#060606] border border-[#D4AF37]/20 shadow-sm flex flex-col justify-between">
                      <span className="text-[9px] uppercase font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold w-fit mb-3">
                        🌍 Autour de moi
                      </span>
                      <div>
                        <h4 className="text-xs font-display font-bold text-[#F5F5F5]">Cocody & Plateau</h4>
                        <p className="text-[11px] text-emerald-400 mt-1">Plateformes d'excellence actives</p>
                      </div>
                    </div>
                  </div>

                  {/* FORM TO PUBLISH NEW GOMBO */}
                  <div className="p-6 rounded-2xl bg-[#060606] border border-[#D4AF37]/20 shadow-md">
                    <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-[#D4AF37] mb-4 flex items-center gap-2">
                      <span>🎼</span> Publier un Nouveau Gombo sur le Réseau
                    </h4>
                    <form onSubmit={handleCreateGombo} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase text-[#F5F5F5]/60 font-mono">Titre de l'Opportunité</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Bassiste recherché pour cabaret..."
                          value={newGombo.title}
                          onChange={(e) => setNewGombo(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full bg-[#0B0B0B] border border-[#D4AF37]/20 rounded p-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-[#F5F5F5]/60 font-mono">Budget cachet (FCFA)</label>
                          <input
                            type="number"
                            required
                            placeholder="Ex: 250000"
                            value={newGombo.budget}
                            onChange={(e) => setNewGombo(prev => ({ ...prev, budget: e.target.value }))}
                            className="w-full bg-[#0B0B0B] border border-[#D4AF37]/20 rounded p-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-[#F5F5F5]/60 font-mono">Commission (%)</label>
                          <select
                            value={newGombo.commissionRate}
                            onChange={(e) => setNewGombo(prev => ({ ...prev, commissionRate: e.target.value }))}
                            className="w-full bg-[#0B0B0B] border border-[#D4AF37]/20 rounded p-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white font-mono"
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
                          <label className="text-[9px] uppercase text-[#F5F5F5]/60 font-mono">Commune</label>
                          <select
                            value={newGombo.location}
                            onChange={(e) => setNewGombo(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full bg-[#0B0B0B] border border-[#D4AF37]/20 rounded p-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white font-mono"
                          >
                            {IVORIAN_COMMUNES.map(com => (
                              <option key={com} value={com}>{com}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[9px] uppercase text-[#F5F5F5]/60 font-mono">Description des Prérequis & Horaires</label>
                        <textarea
                          placeholder="Détails de l'événement, instruments, horaires..."
                          value={newGombo.description}
                          onChange={(e) => setNewGombo(prev => ({ ...prev, description: e.target.value }))}
                          rows={2}
                          className="w-full bg-[#0B0B0B] border border-[#D4AF37]/20 rounded p-2 text-xs focus:outline-none focus:border-[#D4AF37] text-white leading-normal"
                        />
                      </div>

                      <button
                        type="submit"
                        className="py-2.5 bg-[#D4AF37] text-[#0B0B0B] hover:bg-[#B48F17] transition-all rounded-lg font-display font-extrabold uppercase text-xs tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.2)] md:col-span-2 mt-2"
                      >
                        Enregistrer et publier sur le Tam-Tam
                      </button>
                    </form>
                  </div>

                  {/* GOMBOS VITRINE DIRECTORY */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm uppercase font-mono font-bold tracking-widest text-[#D4AF37]">
                        ✨ Vitrine Merveilleuse — Gombos Actifs
                      </h4>
                      <span className="text-xs text-[#F5F5F5]/50 font-mono">{gombos.length} opportunités disponibles</span>
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
                            className={`rounded-3xl overflow-hidden bg-[#060606] border transition-all duration-300 shadow-[0_4px_30px_rgba(212,175,55,0.03)] hover:shadow-[0_8px_45px_rgba(212,175,55,0.09)] ${
                              g.isBoosted || g.isUrgent
                                ? "border-[#D4AF37]/45"
                                : "border-[#D4AF37]/15 hover:border-[#D4AF37]/40"
                            }`}
                          >
                            {/* Card Media Header */}
                            <div className="relative h-48 w-full bg-cover bg-center overflow-hidden group" style={{ backgroundImage: `url(${g.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80'})` }}>
                              <div className="absolute inset-0 bg-gradient-to-t from-[#060606] via-[#060606]/40 to-transparent" />
                              
                              {/* Glowing Badges */}
                              <div className="absolute top-4 left-4 flex gap-2 flex-wrap items-center">
                                {g.isBoosted && (
                                  <span className="text-[8px] bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-lg">
                                    🔥 En Vedette
                                  </span>
                                )}
                                {g.isUrgent && (
                                  <span className="text-[8px] bg-red-600 text-[#F5F5F5] px-2.5 py-1 rounded-full font-black uppercase tracking-wider animate-pulse shadow-lg">
                                    ⚡ Urgent
                                  </span>
                                )}
                              </div>

                              <span className="absolute top-4 right-4 text-[9px] bg-black/60 backdrop-blur-md text-[#D4AF37] px-3 py-1 rounded-full font-mono border border-[#D4AF37]/20">
                                Abidjan, {g.location}
                              </span>

                              {/* Small details inside cover */}
                              <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                                <div>
                                  <span className="text-[9px] text-[#F5F5F5]/50 block uppercase font-mono tracking-widest">Promoteur</span>
                                  <span className="text-xs font-bold text-white flex items-center gap-1">
                                    {g.organizerName}
                                    <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] text-[#F5F5F5]/50 block uppercase font-mono tracking-widest">Date Clé</span>
                                  <span className="text-xs font-bold text-white flex items-center gap-1 justify-end font-mono">
                                    <Calendar className="w-3 h-3 text-[#D4AF37]" />
                                    {g.date || "15 Juin 2026"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 space-y-4">
                              <div className="space-y-1.5">
                                <h5 className="font-display font-extrabold text-[#F5F5F5] text-lg tracking-tight hover:text-[#D4AF37] transition-all">
                                  {g.title}
                                </h5>
                                <p className="text-xs text-[#F5F5F5]/70 leading-relaxed font-sans min-h-[40px]">
                                  {g.description}
                                </p>
                              </div>

                              {/* Cachet Details */}
                              <div className="py-3 px-4 rounded-xl bg-black/60 border border-[#D4AF37]/10 flex justify-between items-center text-xs">
                                <div>
                                  <span className="text-[9px] text-[#F5F5F5]/40 block uppercase font-mono tracking-widest">Cachet de Prestation</span>
                                  <span className="text-md font-bold font-mono text-[#D4AF37] tracking-tight">
                                    {g.budget.toLocaleString()} FCFA
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] text-[#F5F5F5]/40 block uppercase font-mono tracking-widest">Garantie Caisse (10%)</span>
                                  <span className="text-xs font-bold font-mono text-[#10B981]">
                                    {(g.budget * g.commissionRate).toLocaleString()} FCFA
                                  </span>
                                </div>
                              </div>

                              {/* Interactive Action Buttons Tray */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5">
                                {/* Button: J'honore */}
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleHonorGombo(g.id)}
                                  className={`py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all outline-none min-h-[36px] ${
                                    isHonored
                                      ? "bg-red-500/15 border border-red-500/30 text-red-400"
                                      : "bg-[#0B0B0B] border border-white/5 text-[#F5F5F5]/60 hover:text-red-400 hover:border-red-500/20"
                                  }`}
                                >
                                  <span>{isHonored ? "❤️ Honoré" : "❤️ J'honore"}</span>
                                </motion.button>

                                {/* Button: Palabrer */}
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setPalabreGombo(g)}
                                  className="py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 bg-[#0B0B0B] border border-white/5 text-[#F5F5F5]/60 hover:text-[#D4AF37] hover:border-[#D4AF37]/20 transition-all outline-none min-h-[36px]"
                                >
                                  <span>🗣️ Palabrer</span>
                                </motion.button>

                                {/* Button: Je postule */}
                                <motion.button
                                  whileTap={hasApplied ? {} : { scale: 0.95 }}
                                  disabled={hasApplied}
                                  onClick={() => applyToGombo(g.id)}
                                  className={`py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all outline-none min-h-[36px] ${
                                    hasApplied
                                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                      : "bg-gradient-to-r from-[#D4AF37] to-[#B48F17] text-black hover:opacity-95 shadow-sm"
                                  }`}
                                >
                                  <span>{hasApplied ? "🎤 Postulé" : "🎤 Je postule"}</span>
                                </motion.button>

                                {/* Button: Je garde */}
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleSaveGombo(g.id)}
                                  className={`py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all outline-none min-h-[36px] ${
                                    isSaved
                                      ? "bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]"
                                      : "bg-[#0B0B0B] border border-white/5 text-[#F5F5F5]/60 hover:text-[#D4AF37] hover:border-[#D4AF37]/20"
                                  }`}
                                >
                                  <span>{isSaved ? "📌 Gardé" : "📌 Je garde"}</span>
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
                                  className="w-full mt-3 py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black hover:border-transparent text-emerald-400 font-display font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                                >
                                  <span>🏆 Clôturer la prestation & Noter</span>
                                </button>
                              ) : (
                                <div className="w-full mt-3 py-2 px-3 rounded-xl bg-zinc-800/50 border border-zinc-700/60 text-zinc-500 font-mono text-[10px] uppercase flex items-center justify-center gap-2 tracking-wide font-bold">
                                  <span>✅ Prestation Terminée & Évaluée</span>
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
                      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="w-full max-w-lg bg-[#060606] border border-[#D4AF37] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.2)] flex flex-col h-[520px] justify-between"
                        >
                          {/* Chat Header */}
                          <div className="p-5 border-b border-[#D4AF37]/20 bg-gradient-to-r from-black to-[#060606] flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center font-bold text-[#D4AF37]">
                                {palabreGombo.organizerName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-xs font-display font-bold text-white flex items-center gap-1.5">
                                  {palabreGombo.organizerName}
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 block" title="En ligne" />
                                </h4>
                                <span className="text-[10px] text-white/50 block truncate max-w-[200px]" title={palabreGombo.title}>
                                  Négociation : {palabreGombo.title}
                                </span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => setPalabreGombo(null)}
                              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all font-semibold"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Chat Messages */}
                          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-black/50">
                            {/* Static Info Indicator */}
                            <div className="p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-xl text-[10px] text-center text-[#D4AF37]/80 leading-relaxed font-mono">
                              🤝 Palabrer — Négociez le cachet ou posez vos questions d'organisation directement avec le promoteur agréé d'Abidjan.
                            </div>

                            {/* Live Dialogue Thread */}
                            {(palabreChatHistory[palabreGombo.id] || []).length === 0 ? (
                              <div className="text-center py-6 text-white/45 text-xs font-mono">
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
                                          ? "bg-[#D4AF37] text-black font-semibold rounded-br-none"
                                          : "bg-white/10 text-white rounded-bl-none"
                                      }`}
                                    >
                                      {msg.text}
                                    </div>
                                    <span className="text-[9px] text-[#F5F5F5]/30 block mt-1 font-mono">
                                      {msg.time}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Chat Input */}
                          <div className="p-4 border-t border-white/5 bg-black/80 flex gap-2 items-center shrink-0">
                            <input
                              type="text"
                              value={palabreMsg}
                              onChange={(e) => setPalabreMsg(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") submitPalabreMessage(palabreGombo.id);
                              }}
                              placeholder="Palabrer : négocier budget, horaires, transport..."
                              className="flex-1 bg-[#0B0B0B] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37] transition-all"
                            />
                            
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => submitPalabreMessage(palabreGombo.id)}
                              className="w-10 h-10 rounded-xl bg-[#D4AF37] text-black flex items-center justify-center hover:opacity-90 transition-all outline-none shrink-0"
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
                  <div className="p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg text-xs leading-relaxed">
                    Les renforts sont des artistes postulant pour combler un Gombo en manque de musiciens/compétences précises.
                  </div>

                  <div className="space-y-3">
                    {renforts.map(renfort => (
                      <div key={renfort.id} className={`p-5 rounded-lg border transition-all flex justify-between items-center ${renfort.isExpress ? "border-cyan-500/40 bg-gradient-to-r from-[#00171d] to-[#0B0B0B] shadow-[0_0_12px_rgba(6,182,212,0.12)]" : "border-[#D4AF37]/15 bg-[#0B0B0B] hover:border-[#D4AF37]/45"}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/5 border border-[#D4AF37]/30 flex items-center justify-center font-bold text-[#D4AF37]">
                            {renfort.applicantArtisticName.charAt(0)}
                          </div>
                          <div>
                            <h5 className="font-display font-semibold text-sm text-[#F5F5F5] flex flex-wrap items-center gap-2">
                              {renfort.applicantArtisticName} ({renfort.applicantName})
                              {renfort.isExpress && (
                                <span className="text-[9px] bg-cyan-400 text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                                  ⚡ Renfort Express Urgent
                                </span>
                              )}
                            </h5>
                            <span className="text-xs text-[#F5F5F5]/60">
                              Postule pour le rôle de <strong className="text-white">{renfort.instrument}</strong> sur :
                            </span>
                            <span className="text-xs text-[#D4AF37] block mt-0.5 italic">
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
                            className="bg-[#10B981] hover:bg-emerald-600 text-[#0B0B0B] font-semibold text-[10px] px-3 py-1.5 rounded transition-all uppercase"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => {
                              setRenforts(prev => prev.map(r => r.id === renfort.id ? { ...r, status: "rejected" as const } : r));
                              addToTerminal(`[RENFORTS] Artiste décliné.`);
                            }}
                            className="bg-[#EF4444] hover:bg-red-700 text-[#F5F5F5] font-semibold text-[10px] px-3 py-1.5 rounded transition-all uppercase"
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
                <div className="space-y-6">
                  {/* SLOGAN & PROFILE SEARCH */}
                  <div className="flex justify-between items-center bg-[#D4AF37]/5 p-5 border border-[#D4AF37]/10 rounded-lg">
                    <div>
                      <h4 className="text-md font-display font-bold text-[#D4AF37]">
                        ⚜️ Gestion d'Héritage Musical & Gombo ID
                      </h4>
                      <p className="text-xs text-[#F5F5F5]/60 italic font-mono mt-0.5">
                        "🎼 Ton héritage attire les gombos."
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        id="kyc-tab-all"
                        onClick={() => setKycActiveTab("all")}
                        className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "all" ? "bg-[#D4AF37] text-black font-bold" : "border border-[#D4AF37]/20 text-[#D4AF37]/80 hover:bg-[#D4AF37]/5"}`}
                      >
                        👥 Tous ({users.length})
                      </button>
                      <button
                        id="kyc-tab-standard"
                        onClick={() => setKycActiveTab("standard")}
                        className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "standard" ? "bg-[#D4AF37] text-black font-bold" : "border border-[#D4AF37]/20 text-[#D4AF37]/80 hover:bg-[#D4AF37]/5"}`}
                      >
                        Standard ({users.filter(u => u.kycStatus === "pending" && u.kycType !== "express").length})
                      </button>
                      <button
                        id="kyc-tab-express"
                        onClick={() => setKycActiveTab("express")}
                        className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "express" ? "bg-cyan-500 text-black font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]" : "border border-cyan-500/20 text-cyan-400/80 hover:bg-cyan-500/5"}`}
                      >
                        ⚡ Express ({users.filter(u => u.kycStatus === "pending" && u.kycType === "express").length})
                      </button>
                      <button
                        id="kyc-tab-approved"
                        onClick={() => setKycActiveTab("approved")}
                        className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "approved" ? "bg-emerald-500 text-black font-bold" : "border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5"}`}
                      >
                        Validées ({users.filter(u => u.kycStatus === "approved").length})
                      </button>
                      <button
                        id="kyc-tab-rejected"
                        onClick={() => setKycActiveTab("rejected")}
                        className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "rejected" ? "bg-red-500 text-white font-bold" : "border border-red-500/20 text-red-400 hover:bg-red-500/5"}`}
                      >
                        Refusées ({users.filter(u => u.kycStatus === "rejected").length})
                      </button>
                      <button
                        id="kyc-tab-info"
                        onClick={() => setKycActiveTab("info_required")}
                        className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "info_required" ? "bg-amber-500 text-black font-bold" : "border border-amber-500/20 text-amber-400 hover:bg-amber-500/5"}`}
                      >
                        Infos Requises ({users.filter(u => u.kycStatus === "info_required").length})
                      </button>
                    </div>
                  </div>

                  {/* ACTIVE CONFIGURATION PROFILE MODIFIER (PHASE 5) */}
                  {editingProfileUserId && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 rounded-lg bg-[#0B0B0B] border border-[#D4AF37] space-y-4"
                    >
                      <div className="flex justify-between items-center border-b border-[#D4AF37]/20 pb-3">
                        <h4 className="text-sm font-display font-bold text-[#D4AF37] uppercase tracking-wider">
                          Editer Héritage Musical & Performance
                        </h4>
                        <span className="text-[10px] uppercase font-mono text-[#D4AF37] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                          Sauvegarde Automatique active
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Nom Artistique</label>
                          <input
                            type="text"
                            value={profileForm.artisticName}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, artisticName: e.target.value }))}
                            className="w-full bg-[#0B0B0B] border border-[#D4AF37]/20 rounded p-2 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Commune</label>
                          <select
                            value={profileForm.commune}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, commune: e.target.value }))}
                            className="w-full bg-[#0B0B0B] border border-[#D4AF37]/20 rounded p-2 text-xs text-white"
                          >
                            {IVORIAN_COMMUNES.map(com => (
                              <option key={com} value={com}>{com}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Niveau de Profil (1 - 5)</label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={profileForm.level}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, level: Number(e.target.value) }))}
                            className="w-full bg-[#0B0B0B] border border-[#D4AF37]/20 rounded p-2 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Score de Progression (0 - 100)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={profileForm.score}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, score: Number(e.target.value) }))}
                            className="w-full bg-[#0B0B0B] border border-[#D4AF37]/20 rounded p-2 text-xs text-white"
                          />
                        </div>

                        {/* SPECIALTIES TAGS */}
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Spécialités</label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={specInput}
                              onChange={(e) => setSpecInput(e.target.value)}
                              placeholder="Créer une spécialité..."
                              className="flex-1 bg-[#0B0B0B] border border-[#D4AF37]/20 rounded p-2 text-xs text-white"
                            />
                            <button
                              onClick={addSpecialty}
                              className="px-3 bg-[#D4AF37] text-black rounded text-xs"
                            >
                              Ajouter
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {profileForm.specialties?.map((spec, i) => (
                              <span key={i} className="px-2.5 py-1 text-[10px] rounded bg-[#D4AF37]/10 text-[#D4AF37] font-mono flex items-center gap-1.5">
                                {spec}
                                <button onClick={() => removeSpecialty(i)} className="text-[#EF4444] font-bold">&times;</button>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* GROUPS */}
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Groupes</label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={groupInput}
                              onChange={(e) => setGroupInput(e.target.value)}
                              placeholder="Nom du groupe..."
                              className="flex-1 bg-[#0B0B0B] border border-[#D4AF37]/20 rounded p-2 text-xs text-white"
                            />
                            <button
                              onClick={addGroup}
                              className="px-3 bg-[#D4AF37] text-black rounded text-xs"
                            >
                              Ajouter
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {profileForm.groups?.map((grp, i) => (
                              <span key={i} className="px-2.5 py-1 text-[10px] rounded bg-[#D4AF37]/10 text-[#D4AF37] font-mono flex items-center gap-1.5">
                                {grp}
                                <button onClick={() => removeGroup(i)} className="text-[#EF4444] font-bold">&times;</button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-3">
                        <button
                          onClick={() => setEditingProfileUserId(null)}
                          className="px-4 py-2 border border-[#D4AF37]/20 text-xs rounded hover:bg-[#D4AF37]/5 transition-all uppercase"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={saveProfileEditing}
                          className="px-5 py-2 bg-[#D4AF37] text-black text-xs font-semibold rounded hover:bg-[#B48F17] transition-all uppercase"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* PROFILES & CERTIFICATION REQUESTS LIST */}
                  <div className="space-y-3">
                    {filteredUsers
                      .filter(u => {
                        if (kycActiveTab === "standard") return u.kycStatus === "pending" && u.kycType !== "express";
                        if (kycActiveTab === "express") return u.kycStatus === "pending" && u.kycType === "express";
                        if (kycActiveTab === "approved") return u.kycStatus === "approved";
                        if (kycActiveTab === "rejected") return u.kycStatus === "rejected";
                        if (kycActiveTab === "info_required") return u.kycStatus === "info_required";
                        return true;
                      })
                      .map(user => (
                        <div key={user.id} className="p-5 rounded-lg border border-[#D4AF37]/25 bg-[#0B0B0B] space-y-4">
                          <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full border border-[#D4AF37] bg-black flex items-center justify-center font-bold text-[#D4AF37] text-lg">
                                {user.avatarUrl ? (
                                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  user.artisticName.charAt(0)
                                )}
                              </div>
                              <div>
                                <h5 className="font-display font-semibold text-md text-[#F5F5F5] flex flex-wrap items-center gap-2">
                                  {user.artisticName}
                                  {user.isCertified && (
                                    <span className="text-[9px] bg-[#D4AF37] text-black px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                                      Elite Certifié
                                    </span>
                                  )}
                                  {user.kycStatus === "pending" && (
                                    <span className="text-[9px] bg-cyan-500 text-black px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                                      {user.kycType === "express" ? "⚡ Express Prioritaire" : "⏳ File Standard"}
                                    </span>
                                  )}
                                  {user.kycStatus === "info_required" && (
                                    <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                                      ↺ Infos Requises
                                    </span>
                                  )}
                                  {user.kycStatus === "rejected" && (
                                    <span className="text-[9px] bg-red-500/20 border border-red-500/30 text-red-500 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                                      🚫 Refusé
                                    </span>
                                  )}
                                </h5>
                                <p className="text-xs text-[#F5F5F5]/60 mt-0.5">
                                  {user.name} • Commune : <strong className="text-white">{user.commune}</strong> • Inscrit le : {user.registrationDate || "N/A"}
                                </p>
                                
                                {/* Render dynamic client star ratings for the musician */}
                                {(() => {
                                  const artistReviews = reviews.filter(r => r.revieweeId === user.id && r.type === "client_to_musician");
                                  const avgRating = artistReviews.length > 0 
                                    ? parseFloat((artistReviews.reduce((sum, r) => sum + r.rating, 0) / artistReviews.length).toFixed(1))
                                    : 5.0;
                                  const hasReviews = artistReviews.length > 0;
                                  return (
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      <div className="flex text-amber-400">
                                        {[1,2,3,4,5].map(star => (
                                          <Star 
                                            key={star} 
                                            className={`w-3.5 h-3.5 ${star <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-white/10"}`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-[10px] font-mono font-bold text-amber-300">
                                        {avgRating.toFixed(1)} / 5.0
                                      </span>
                                      <span className="text-[9px] text-[#F5F5F5]/40 font-mono">
                                        ({hasReviews ? `${artistReviews.length} avis` : "Pas encore d'évaluations"})
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Main permanent ID display if approved */}
                            {user.gomboIdNumber && (
                              <div className="flex flex-col items-end">
                                <span className="text-[8px] font-mono uppercase text-[#D4AF37] font-semibold tracking-widest">Identifiant GOMBO ID</span>
                                <span className="font-mono text-xs font-bold text-white bg-[#D4AF37]/15 border border-[#D4AF37]/35 px-2.5 py-0.5 rounded">
                                  {user.gomboIdNumber}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Documents Preview Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/40 border border-white/5 p-4 rounded-xl">
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-mono text-[#D4AF37]/60 block font-semibold">1. Pièce d'Identité</span>
                              {user.kycDocs?.identityCardUrl ? (
                                <a
                                  href={user.kycDocs.identityCardUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#D4AF37] hover:underline font-mono block truncate"
                                >
                                  Voir la Pièce Libre ↗
                                </a>
                              ) : (
                                <span className="text-xs text-white/30 italic">Aucune pièce (Simulation active)</span>
                              )}
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-mono text-[#D4AF37]/60 block font-semibold">2. Selfie de Contrôle</span>
                              {user.kycDocs?.selfieUrl ? (
                                <a
                                  href={user.kycDocs.selfieUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#D4AF37] hover:underline font-mono block truncate"
                                >
                                  Voir le Selfie Libre ↗
                                </a>
                              ) : (
                                <span className="text-xs text-white/30 italic">Aucun selfie (Simulation active)</span>
                              )}
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-mono text-[#D4AF37]/60 block font-semibold">3. Preuve Musicale</span>
                              {user.kycDocs?.activityUrl || user.kycDocUrl ? (
                                <a
                                  href={user.kycDocs?.activityUrl || user.kycDocUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#D4AF37] hover:underline font-mono block truncate"
                                >
                                  Voir la Preuve en Ligne ↗
                                </a>
                              ) : (
                                <span className="text-xs text-white/30 italic">Aucune preuve (Simulation active)</span>
                              )}
                            </div>
                          </div>

                          {/* Complementary requested text note if applicable */}
                          {user.kycStatus === "info_required" && user.kycComplementaryInfo && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs">
                              <span className="font-bold text-amber-400 block font-mono text-[10px] uppercase">↺ Message d'information demandée :</span>
                              <p className="text-white/80 mt-1 italic">"{user.kycComplementaryInfo}"</p>
                            </div>
                          )}

                          {/* Administrative Actions */}
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-t border-white/5 pt-4">
                            <div className="flex flex-wrap gap-2">
                              {user.kycStatus !== "approved" && (
                                <button
                                  onClick={() => handleApproveKYC(user.id, user.kycType === "express")}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-[10px] uppercase px-3 py-1.5 rounded transition-all"
                                >
                                  {user.kycType === "express" ? "Certifier (⚡ Express)" : "Certifier le Talent"}
                                </button>
                              )}
                              
                              {user.kycStatus !== "rejected" && (
                                <button
                                  onClick={() => handleRejectKYC(user.id)}
                                  className="bg-[#EF4444]/20 border border-[#EF4444]/30 hover:bg-[#EF4444]/40 text-[#EF4444] font-semibold text-[10px] uppercase px-3 py-1.5 rounded transition-all"
                                >
                                  Refuser Dossier
                                </button>
                              )}

                              <button
                                onClick={() => startEditingProfile(user)}
                                className="bg-transparent border border-white/10 hover:border-[#D4AF37] text-white hover:text-[#D4AF37] text-[10px] uppercase font-mono px-3 py-1.5 rounded transition-all"
                              >
                                Éditer Profil
                              </button>
                            </div>

                            {/* Direct Complementary Info Request Input */}
                            {user.kycStatus !== "approved" && (
                              <div className="w-full md:max-w-md flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Motif d'information manquante..."
                                  value={infoMessages[user.id] || ""}
                                  onChange={(e) => setInfoMessages(prev => ({ ...prev, [user.id]: e.target.value }))}
                                  className="flex-1 bg-black border border-white/15 focus:border-[#D4AF37] focus:outline-none rounded p-1.5 text-xs text-white"
                                />
                                <button
                                  onClick={() => {
                                    handleComplementaryInfoKYC(user.id, infoMessages[user.id] || "");
                                    setInfoMessages(prev => ({ ...prev, [user.id]: "" }));
                                  }}
                                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-[10px] uppercase px-3 py-1.5 rounded"
                                >
                                  Demander Infos
                                </button>
                              </div>
                            )}
                          </div>

                          {/* PROFILE PROGRESS BAR SLITS */}
                          <div className="p-3.5 bg-white/5 border border-white/5 rounded grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] font-mono uppercase text-[#F5F5F5]/50 block">Spécialités de l'artiste</span>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {(user.specialties || []).map((spec, idx) => (
                                  <span key={idx} className="bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded text-[10px] font-mono">
                                    {spec}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                                <span className="uppercase text-[#F5F5F5]/50 flex items-center gap-1">
                                  <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                                  Niveau de Profil
                                </span>
                                <span className="font-bold text-[#D4AF37]">Niv. {user.performance?.level || 1} (Score: {user.performance?.score || 0}/100)</span>
                              </div>
                              {/* Glowing horizontal premium gold progress bar */}
                              <div className="w-full bg-[#D4AF37]/10 rounded-full h-2 overflow-hidden border border-[#D4AF37]/10">
                                <div
                                  className="bg-gradient-to-r from-[#D4AF37] to-[#B48F17] h-full shadow-[0_0_8px_rgba(212,175,55,0.8)]"
                                  style={{ width: `${user.performance?.score || 0}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* WRITTEN FEEDBACK AND REVIEWS DISPLAY PANEL */}
                          {(() => {
                            const artistReviews = reviews.filter(r => r.revieweeId === user.id);
                            if (artistReviews.length === 0) return null;
                            return (
                              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                                <span className="text-[10px] font-mono uppercase font-black text-[#D4AF37] block tracking-widest">
                                  💬 Témoignages & Évaluations du Réseau ({artistReviews.length})
                                </span>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                                  {artistReviews.map(rev => (
                                    <div key={rev.id} className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1.5 animate-fadeIn">
                                      <div className="flex justify-between items-center flex-wrap gap-2 text-[10px]">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-semibold text-white">{rev.reviewerName}</span>
                                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] font-mono">
                                            {rev.type === "client_to_musician" ? "Client ➜ Musicien" : "Musicien ➜ Client"}
                                          </span>
                                        </div>
                                        <span className="text-zinc-500 font-mono text-[9px]">{rev.timestamp.split("T")[0]}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        {[1,2,3,4,5].map(star => (
                                          <Star key={star} className={`w-3 h-3 ${star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-white/20"}`} />
                                        ))}
                                      </div>

                                      <p className="text-xs text-[#F5F5F5]/85 italic leading-relaxed">
                                        "{rev.comment}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------
                                VIEW: FILE REVISION
                  ---------------------------------------------------- */}
              {activeMenu === "revision" && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg text-xs leading-relaxed">
                    Ce module rassemble les publications signalées par les utilisateurs ou flagged automatiquement par notre routine autonome pour spam ou contournement financière.
                  </div>

                  <div className="space-y-3">
                    {posts.filter(p => p.isFlagged).map(post => (
                      <div key={post.id} className="p-5 rounded-lg border border-[#D4AF37]/15 bg-[#0B0B0B] space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <ShieldAlert className="text-red-500 w-5 h-5 shrink-0" />
                            <div>
                              <span className="font-display font-semibold text-sm text-[#F5F5F5]">
                                {post.authorArtisticName}
                              </span>
                              <p className="text-xs text-[#F5F5F5]/50">Post ID: {post.id} • Signalement : <strong className="text-red-400">{post.flagReason}</strong></p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePerformActionOnPost(post.id, "approve")}
                              className="bg-emerald-500 text-[#0B0B0B] font-semibold text-[10px] uppercase px-3 py-1.5 rounded transition-all"
                            >
                              Ignorer Signalement
                            </button>
                            <button
                              onClick={() => handlePerformActionOnPost(post.id, "delete")}
                              className="bg-red-500 text-white font-semibold text-[10px] uppercase px-3 py-1.5 rounded transition-all"
                            >
                              Supprimer le Post
                            </button>
                          </div>
                        </div>

                        <p className="p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded text-xs italic text-[#F5F5F5]/80">
                          "{post.content}"
                        </p>
                      </div>
                    ))}

                    {posts.filter(p => p.isFlagged).length === 0 && (
                      <div className="text-center p-8 border border-dashed border-[#D4AF37]/20 rounded-lg text-xs text-[#F5F5F5]/40">
                        Aucun signalement en attente de vérification. Tout est paisible.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------
                                VIEW: ALERTS de COMMUNES
                  ---------------------------------------------------- */}
              {activeMenu === "alertes" && (
                <Suspense fallback={<div className="p-10 text-center text-[#D4A017] font-mono animate-pulse">Chargement rapports et alertes...</div>}>
                  <AdminReports alerts={alerts} />
                </Suspense>
              )}

              {/* ----------------------------------------------------
                                VIEW: LA CAISSE GOMBO (FINANCIALS / REVENUS)
                  ---------------------------------------------------- */}
              {(activeMenu === "caisse" || activeMenu === "finances") && (() => {
                const now = new Date();
                const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                const startOfWeek = now.getTime() - 7 * 24 * 60 * 60 * 1000;
                const startOfMonth = now.getTime() - 30 * 24 * 60 * 60 * 1000;

                const totals = transactions.reduce((sum, t) => sum + (t.type !== "payout" ? t.amount : 0), 0);
                const daily = transactions
                  .filter(t => new Date(t.timestamp).getTime() >= startOfToday && t.type !== "payout")
                  .reduce((sum, t) => sum + t.amount, 0);
                const weekly = transactions
                  .filter(t => new Date(t.timestamp).getTime() >= startOfWeek && t.type !== "payout")
                  .reduce((sum, t) => sum + t.amount, 0);
                const monthly = transactions
                  .filter(t => new Date(t.timestamp).getTime() >= startOfMonth && t.type !== "payout")
                  .reduce((sum, t) => sum + t.amount, 0);

                const cExpress = transactions.filter(t => t.type === "cert_express").reduce((s, t) => s + t.amount, 0);
                const bGombo = transactions.filter(t => t.type === "boost_gombo").reduce((s, t) => s + t.amount, 0);
                const rExpress = transactions.filter(t => t.type === "renfort_express").reduce((s, t) => s + t.amount, 0);
                const gVip = transactions.filter(t => t.type === "gombo_vip").reduce((s, t) => s + t.amount, 0);
                const gPro = transactions.filter(t => t.type === "gombo_pro").reduce((s, t) => s + t.amount, 0);
                const otherRev = transactions.filter(t => t.type === "commission" || t.type === "subscription").reduce((s, t) => s + t.amount, 0);

                const premiumSum = cExpress + bGombo + rExpress + gVip + gPro;

                return (
                  <div className="space-y-6">
                    {/* TOP STATS: CAISSE REVENUES METRICS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-5 rounded-lg border border-[#D4AF37]/20 bg-black/40 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                        <span className="text-[10px] uppercase font-mono text-[#F5F5F5]/50 block">Revenus du Jour</span>
                        <span className="text-2xl font-display font-bold text-[#D4AF37] block mt-1 font-mono">
                          {daily.toLocaleString()} <span className="text-sm font-sans font-medium text-[#F5F5F5]/60">FCFA</span>
                        </span>
                        <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono text-[#10B981]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                          Mise à jour temps réel
                        </div>
                      </div>

                      <div className="p-5 rounded-lg border border-[#D4AF37]/20 bg-black/40 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                        <span className="text-[10px] uppercase font-mono text-[#F5F5F5]/50 block">Revenus de la Semaine</span>
                        <span className="text-2xl font-display font-bold text-[#D4AF37] block mt-1 font-mono">
                          {weekly.toLocaleString()} <span className="text-sm font-sans font-medium text-[#F5F5F5]/60">FCFA</span>
                        </span>
                        <div className="text-[9px] text-[#F5F5F5]/40 mt-2 font-mono">Derniers 7 jours glissants</div>
                      </div>

                      <div className="p-5 rounded-lg border border-[#D4AF37]/20 bg-black/40 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                        <span className="text-[10px] uppercase font-mono text-[#F5F5F5]/50 block">Revenus du Mois</span>
                        <span className="text-2xl font-display font-bold text-[#D4AF37] block mt-1 font-mono">
                          {monthly.toLocaleString()} <span className="text-sm font-sans font-medium text-[#F5F5F5]/60">FCFA</span>
                        </span>
                        <div className="text-[9px] text-[#F5F5F5]/40 mt-2 font-mono">Derniers 30 jours glissants</div>
                      </div>

                      <div className="p-5 rounded-lg border border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/5 to-[#D4AF37]/0 shadow-[0_4px_20px_rgba(212,175,55,0.1)]">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] uppercase font-mono text-[#D4AF37] font-semibold block">Revenus Totaux</span>
                          <Award className="w-4 h-4 text-[#D4AF37]" />
                        </div>
                        <span className="text-2xl font-display font-extrabold text-[#D4AF37] block mt-1 font-mono">
                          {totals.toLocaleString()} <span className="text-sm font-sans font-medium text-[#F5F5F5]">FCFA</span>
                        </span>
                        <div className="text-[9px] text-[#D4AF37]/80 mt-2 font-mono">Rentabilité Globale Réelle</div>
                      </div>
                    </div>

                    {/* REPARTITION DES REVENUS SOUVERAINS */}
                    <div className="p-6 rounded-lg bg-black/30 border border-[#D4AF37]/15">
                      <h4 className="text-xs uppercase font-mono font-bold tracking-widest text-[#D4AF37] mb-6 flex items-center gap-2">
                        <Coins className="w-4 h-4" />
                        Répartition par Flux de Revenus Africains
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* LEFT GRID: DISTRIBUTION list */}
                        <div className="space-y-4">
                          {[
                            { name: "⚡ Certifications Express", amount: cExpress, desc: "Frais de traitement prioritaire de Gombo ID", color: "from-[#10B981] to-[#059669]" },
                            { name: "🔥 Boost Gombo", amount: bGombo, desc: "Publications d'artistes mises en vedette", color: "from-amber-500 to-red-500" },
                            { name: "⚡ Renfort Express Urgent", amount: rExpress, desc: "Offres de renforts marquées en urgence", color: "from-cyan-400 to-blue-500" },
                            { name: "✨ Adhésions Gombo VIP", amount: gVip, desc: "Abonnements d'artistes (1 000 FCFA/mois)", color: "from-purple-500 to-pink-500" },
                            { name: "💼 Statut Gombo PRO", amount: gPro, desc: "Formules pour Orchestres, Managers e.a.", color: "from-[#D4AF37] to-[#B48F17]" },
                            { name: "🎼 Commissions standard & Subs", amount: otherRev, desc: "Commissions de 10% sur gombos finalisés", color: "from-gray-500 to-slate-400" },
                          ].map((item, idx) => {
                            const percent = totals > 0 ? (item.amount / totals) * 100 : 0;
                            return (
                              <div key={idx} className="space-y-1.5 p-3 rounded bg-white/5 border border-white/5">
                                <div className="flex justify-between items-center text-xs">
                                  <div>
                                    <span className="font-semibold text-[#F5F5F5] block">{item.name}</span>
                                    <span className="text-[10px] text-[#F5F5F5]/40">{item.desc}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-mono font-bold text-[#D4AF37] block">
                                      {item.amount.toLocaleString()} FCFA
                                    </span>
                                    <span className="text-[10px] font-mono text-[#F5F5F5]/50 block">
                                      {percent.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                                <div className="w-full bg-[#D4AF37]/5 h-2 rounded-full overflow-hidden border border-white/5">
                                  <div
                                    className={`bg-gradient-to-r ${item.color} h-full`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* RIGHT GRID: ARCHITECTURE SUMMARY */}
                        <div className="flex flex-col justify-between p-5 rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/10">
                          <div>
                            <span className="text-xs uppercase font-mono font-semibold text-[#D4AF37] tracking-wider block mb-2">
                              Souveraineté Économique Africaine
                            </span>
                            <p className="text-xs text-[#F5F5F5]/70 leading-relaxed space-y-2">
                              La répartition d'AFRIGOMBO est optimisée pour une rentabilité équilibrée. 
                              Toutes les transactions s'effectuent via un flux transactionnel en temps réel connecté à Firestore. 
                              Cette architecture intègre une couche d'abstraction ouverte pour connecter nativement les SDKs africains:
                            </p>
                            
                            {/* FUTURE PAYMENTS PLATFORM BADGES */}
                            <div className="grid grid-cols-2 gap-2 mt-4 font-mono text-[10px]">
                              <div className="p-2 border border-[#D4AF37]/20 rounded bg-black/40 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                Wave Sénégal/CI
                              </div>
                              <div className="p-2 border border-[#D4AF37]/20 rounded bg-black/40 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                Orange Money
                              </div>
                              <div className="p-2 border border-[#D4AF37]/20 rounded bg-black/40 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                                MTN Mobile Money
                              </div>
                              <div className="p-2 border border-[#D4AF37]/20 rounded bg-black/40 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Moov Money
                              </div>
                              <div className="p-2 border border-[#D4AF37]/30 rounded bg-[#D4AF37]/10 flex items-center gap-2 col-span-2 justify-center text-[#D4AF37]">
                                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                                Passerelle CinetPay (Afrique de l'Ouest)
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-[#D4AF37]/10 pt-4 mt-6 text-[11px] text-[#F5F5F5]/50 italic">
                            💡 Chaque transaction listée ci-contre est répercutée en temps réel et persistée de manière offline-first.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DYNAMIC REAL-TIME TRANSACTION DIARY */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm uppercase font-mono font-bold tracking-widest text-[#D4AF37]">
                          Journal des paiements de Caisse (Firebase Live)
                        </h4>
                        <span className="text-[10px] uppercase font-mono text-[#F5F5F5]/40">
                          {transactions.length} transactions indexées
                        </span>
                      </div>
                      
                      <div className="space-y-2 bg-black/20 p-4 rounded-lg border border-white/5 max-h-96 overflow-y-auto scrollbar-thin">
                        {transactions.map(tx => {
                          let typeBadge = "";
                          let typeColor = "";
                          switch (tx.type) {
                            case "cert_express":
                              typeBadge = "⚡ Express";
                              typeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                              break;
                            case "boost_gombo":
                              typeBadge = "🔥 Boost";
                              typeColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                              break;
                            case "renfort_express":
                              typeBadge = "⚡ Renfort";
                              typeColor = "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
                              break;
                            case "gombo_vip":
                              typeBadge = "✨ VIP Sub";
                              typeColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
                              break;
                            case "gombo_pro":
                              typeBadge = "💼 PRO Sub";
                              typeColor = "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20";
                              break;
                            default:
                              typeBadge = "🎼 Commission";
                              typeColor = "text-gray-400 bg-gray-500/10 border-gray-500/20";
                          }

                          return (
                            <div key={tx.id} className="p-3.5 rounded bg-[#010101]/60 border border-white/5 flex justify-between items-center text-xs hover:border-[#D4AF37]/25 transition-all">
                              <div className="flex items-center gap-3">
                                <div className={`px-2 py-0.5 rounded text-[9px] font-mono border font-bold ${typeColor}`}>
                                  {typeBadge}
                                </div>
                                <div>
                                  <span className="font-semibold text-white block">{tx.description}</span>
                                  <span className="text-[#F5F5F5]/40 text-[9px] font-mono">
                                    {new Date(tx.timestamp).toLocaleString()} • Artiste : <strong className="text-[#D4AF37]">{tx.userArtisticName}</strong>
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono font-bold text-sm text-emerald-400">
                                +{tx.amount.toLocaleString()} FCFA
                              </span>
                            </div>
                          );
                        })}

                        {transactions.length === 0 && (
                          <div className="text-center py-8 text-xs text-[#F5F5F5]/40">
                            Aucune transaction de caisse enregistrée pour le moment.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ADDITIONAL PLUS SYSTEMS PANEL */}
                    <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-[#D4AF37]/25 space-y-6">
                      <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                        <Settings className="w-5 h-5 text-[#D4AF37]" />
                        <div>
                          <h4 className="text-sm font-display font-black text-white uppercase tracking-wider">
                            Services & Outillage Plus Gombo
                          </h4>
                          <p className="text-[10px] text-zinc-400">Actions d'optimisation système de l'empire.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Action 1: Scan global */}
                        <div className="p-4 bg-black border border-white/5 rounded-xl space-y-2">
                          <h5 className="text-xs font-bold text-white font-mono uppercase">Diagnostic Système</h5>
                          <p className="text-[10px] text-zinc-400">Lance une routine de nettoyage des documents orphelins et vérifie l'intégrité de Firestore.</p>
                          <button
                            onClick={triggerGlobalSystemScan}
                            disabled={scannerStatus === "scanning"}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded bg-transparent border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all text-[10px] font-mono font-semibold"
                          >
                            <RefreshCw className={`w-3 h-3 ${scannerStatus === "scanning" ? "animate-spin" : ""}`} />
                            Scan Global
                          </button>
                        </div>

                        {/* Action 2: Diffusions bulletins */}
                        <div className="p-4 bg-black border border-white/5 rounded-xl space-y-2">
                          <h5 className="text-xs font-bold text-white font-mono uppercase">Mégaphone Citoyen</h5>
                          <p className="text-[10px] text-zinc-400">Diffusez un flash d'urgence épinglé directement au sommet du Tam-Tam des Artistes.</p>
                          <button
                            onClick={() => setIsBroadcastModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded bg-transparent border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all text-[10px] font-mono font-semibold"
                          >
                            <Megaphone className="w-3 h-3" />
                            📣 Diffuser Bulletin
                          </button>
                        </div>

                        {/* Action 3: Switch perspective */}
                        <div className="p-4 bg-black border border-white/5 rounded-xl space-y-2">
                          <h5 className="text-xs font-bold text-white font-mono uppercase">Perspective Terrain</h5>
                          <p className="text-[10px] text-zinc-400">Quittez temporairement le cockpit pour tester l'application en mode artiste.</p>
                          <button
                            onClick={() => {
                              setPerspective("user");
                              setActiveMenu("user_terrain");
                              addToTerminal("[INFO] Retour au Terrain d'Action.");
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded bg-transparent border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all text-[10px] font-mono font-semibold"
                          >
                            <Users className="w-3 h-3" />
                            Mode Artiste
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ----------------------------------------------------
                                VIEW: ANALYTICS & COURBES
                  ---------------------------------------------------- */}
              {activeMenu === "analytics" && (
                <div className="space-y-6 animate-fadeIn pb-24 text-left">
                  <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                    <h3 className="text-sm font-mono uppercase tracking-[0.2em] font-black text-[#D4A017]">
                      Intelligence & Data
                    </h3>
                  </div>
                  <Suspense fallback={<div className="p-10 text-center text-[#D4A017] font-mono animate-pulse">Chargement intelligence des données...</div>}>
                    <AdminStats users={users} gombos={gombos} transactions={transactions} onBack={() => setActiveMenu("dashboard")} />
                  </Suspense>
                </div>
              )}

              {/* ----------------------------------------------------
                                VIEW: PLUS (PARAMÈTRES ET OUTILS ADMINISTRATIFS)
                  ---------------------------------------------------- */}
              {activeMenu === "plus" && (
                <div className="space-y-6 animate-fadeIn pb-24">
                  <h3 className="text-sm font-mono uppercase font-black tracking-[0.15em] text-white flex items-center gap-1.5 pb-2 border-b border-white/10">
                    <Settings className="w-5 h-5 text-zinc-400" />
                    Outils d'Administration & Système
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Logs Système */}
                    <button 
                      onClick={() => setActiveMenu("logs")}
                      className="p-4 bg-[#09090C] hover:bg-[#D4AF37]/5 border border-white/5 hover:border-[#D4AF37]/20 rounded-xl flex items-start gap-4 text-left transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#121214] flex items-center justify-center border border-white/5 group-hover:border-[#D4AF37]/30">
                        <Terminal className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Logs système</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">Historique technique, connexions et audit trail des modérateurs.</p>
                      </div>
                    </button>

                    {/* Paramètres */}
                    <button className="p-4 bg-[#09090C] hover:bg-[#D4AF37]/5 border border-white/5 hover:border-[#D4AF37]/20 rounded-xl flex items-start gap-4 text-left transition-all group">
                      <div className="w-10 h-10 rounded-full bg-[#121214] flex items-center justify-center border border-white/5 group-hover:border-[#D4AF37]/30">
                        <Settings className="w-5 h-5 text-zinc-300" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Paramètres</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">Configuration générale, filtres de modération et règles communautaires.</p>
                      </div>
                    </button>

                    {/* Sauvegardes */}
                    <button className="p-4 bg-[#09090C] hover:bg-[#D4AF37]/5 border border-white/5 hover:border-[#D4AF37]/20 rounded-xl flex items-start gap-4 text-left transition-all group">
                      <div className="w-10 h-10 rounded-full bg-[#121214] flex items-center justify-center border border-white/5 group-hover:border-[#D4AF37]/30">
                        <Database className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Sauvegardes</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">Exports CSV, backups Firestore de sécurité et restauration.</p>
                      </div>
                    </button>

                    {/* Audit sécurité */}
                    <button className="p-4 bg-[#09090C] hover:bg-[#D4AF37]/5 border border-white/5 hover:border-[#D4AF37]/20 rounded-xl flex items-start gap-4 text-left transition-all group">
                      <div className="w-10 h-10 rounded-full bg-[#121214] flex items-center justify-center border border-white/5 group-hover:border-[#D4AF37]/30">
                        <ShieldAlert className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Audit sécurité</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">Analyse des vulnérabilités, tentatives d'intrusion et IP bloquées.</p>
                      </div>
                    </button>

                    {/* IA AFRIGOMBO */}
                    <button className="p-4 bg-[#0A0A0C] hover:bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 rounded-xl flex items-start gap-4 text-left transition-all group">
                      <div className="w-10 h-10 rounded-full bg-[#121214] flex items-center justify-center border border-purple-500/20 group-hover:border-purple-500/50">
                        <Brain className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-purple-100 uppercase tracking-wider font-mono">IA AFRIGOMBO</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">Configuration du moteur de recommandation et modération Gemini.</p>
                      </div>
                    </button>

                    {/* Centre d'aide */}
                    <button className="p-4 bg-[#09090C] hover:bg-[#D4AF37]/5 border border-white/5 hover:border-[#D4AF37]/20 rounded-xl flex items-start gap-4 text-left transition-all group">
                      <div className="w-10 h-10 rounded-full bg-[#121214] flex items-center justify-center border border-white/5 group-hover:border-[#D4AF37]/30">
                        <LifeBuoy className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Centre d'aide</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">Documentation interne, assistance technique et support fondateurs.</p>
                      </div>
                    </button>
                  </div>

                  {/* SUPREME PALACE SECRET ACCESS FOR FOUNDER ONLY */}
                  {userEmail === "jhs.kmj7@gmail.com" && (
                    <div className="pt-6 mt-6 border-t border-white/5 flex justify-center">
                      <button
                        onClick={() => {
                          setActiveMenu("super_admin");
                          addToTerminal("👑 [SOUVERAINETÉ] Accès demandé au Tableau de Bord Super Fondateur.");
                          try { audioSynth.playTamTam(true); } catch (err) {}
                        }}
                        className="group w-full max-w-sm p-4 bg-black border border-[#D4AF37]/20 hover:border-[#D4AF37] text-[#D4AF37] font-display font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-500 flex items-center justify-center gap-3 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.05)] hover:shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                      >
                        <Crown className="w-4 h-4 text-[#D4AF37] animate-pulse" />
                        Accéder au Palais Numérique Suprême
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ----------------------------------------------------
                                VIEW: LOGS SYSTEME
                  ---------------------------------------------------- */}
              {activeMenu === "logs" && (
                <div className="h-[75vh] flex flex-col bg-black border border-[rgba(212,160,23,0.25)] rounded-xl overflow-hidden relative shadow-[0_4px_20px_rgba(212,160,23,0.05)]">
                  <div className="bg-[#0A0A0A] border-b border-[rgba(212,160,23,0.15)] p-3 flex justify-between items-center">
                    <h4 className="text-[10px] font-mono uppercase text-[#D4A017] font-bold flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      Historique des Actions
                    </h4>
                    <button onClick={() => setActiveMenu("dashboard")} className="text-zinc-500 hover:text-white px-2 py-1 text-[10px] font-mono uppercase border border-white/5 rounded">Retour</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[9px] sm:text-[10px]">
                    {adminLogs.map((log: any, i: number) => (
                      <div key={log.id || i} className="flex gap-2 items-start border-b border-white/5 pb-2">
                        <span className="text-[#D4A017] mt-0.5">▶</span>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 leading-none">{new Date(log.timestamp).toLocaleString()}</span>
                            <span className="text-[8px] bg-[#111111] px-1.5 py-0.5 rounded text-[#D4A017]">{log.adminId}</span>
                            <span className="text-[8px] border border-cyan-900/50 px-1.5 py-0.5 rounded text-cyan-400">{log.action}</span>
                          </div>
                          <span className="text-[#F5F5F5] mt-1">
                            {log.details}
                          </span>
                          <span className="text-zinc-600 text-[8px] mt-0.5">Cible: {log.target}</span>
                        </div>
                      </div>
                    ))}
                    {adminLogs.length === 0 && (
                      <div className="text-zinc-600 italic">Historique vide...</div>
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
                  <div className="space-y-6">
                    {/* TOP DOCK OF NUMERICS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-5 rounded-lg border border-[#D4AF37]/20 bg-black/40 shadow-md">
                        <span className="text-[10px] uppercase font-mono text-[#F5F5F5]/50 block">Nombre d'achats Premium</span>
                        <span className="text-2xl font-display font-bold text-[#D4AF37] block mt-1 font-mono">
                          {countPremiumSales} <span className="text-xs font-sans text-[#F5F5F5]/40 font-normal">transactions</span>
                        </span>
                        <span className="text-[9px] text-[#10B981] font-mono block mt-1.5">✓ 100% Synchronisé avec Firestore</span>
                      </div>

                      <div className="p-5 rounded-lg border border-[#D4AF37]/20 bg-black/40 shadow-md">
                        <span className="text-[10px] uppercase font-mono text-[#F5F5F5]/50 block">Revenus Premium cumulés</span>
                        <span className="text-2xl font-display font-bold text-emerald-400 block mt-1 font-mono">
                          {totalPremiumRevenues.toLocaleString()} <span className="text-sm font-sans text-emerald-500 font-normal">FCFA</span>
                        </span>
                        <span className="text-[9px] text-zinc-400 font-mono block mt-1.5">Souverains, hors commissions</span>
                      </div>

                      <div className="p-5 rounded-lg border border-[#D4AF37] bg-[#D4AF37]/5 shadow-md">
                        <span className="text-[10px] uppercase font-mono text-[#D4AF37] font-semibold block">Produit Étoile (Leader)</span>
                        <span className="text-xl font-display font-extrabold text-[#F5F5F5] block mt-1 truncate">
                          {sortedProducts[0]?.count > 0 ? sortedProducts[0].name.split("(")[0] : "Aucun achat encore"}
                        </span>
                        <span className="text-[9px] text-[#D4AF37] font-mono block mt-1">
                          {sortedProducts[0]?.count > 0 ? `${sortedProducts[0].count} activations enregistrées` : "Preneur en attente"}
                        </span>
                      </div>
                    </div>

                    {/* DOCK OF DETAILED PRICINGS & RULES */}
                    <div className="p-6 rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/10">
                      <h4 className="text-xs uppercase font-mono font-bold tracking-widest text-[#D4AF37] mb-4 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        Charte d'Éthique & Solidarité Artistique
                      </h4>
                      <p className="text-xs text-[#F5F5F5]/70 leading-relaxed mb-4">
                        🚨 <strong>Principe de Souveraineté : "Ne jamais bloquer les fonctions essentielles"</strong>. 
                        Toute la monétisation additionnelle d'AFRIGOMBO s'ajoute en tant que services facultatifs à valeur ajoutée pour propulser les carrières. 
                        Un artiste ivoirien sans ressources peut toujours : ✓ Publier sur le Tam-Tam, ✓ Chercher des opportunités de concerts, ✓ Candidater, ✓ Être certifié par file d'attente gratuite. Les contributions financières proviennent uniquement de la valeur d'accélération fournie.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div className="p-4 rounded bg-black/40 border border-[#D4AF37]/10">
                          <span className="font-bold text-[#D4AF37] block text-xs">⚡ Cert Express</span>
                          <span className="font-mono text-xs font-bold text-white block mt-1">500 FCFA</span>
                          <p className="text-[10px] text-[#F5F5F5]/40 mt-1">Traitement KYC express sous 24h-72h.</p>
                        </div>
                        <div className="p-4 rounded bg-black/40 border border-[#D4AF37]/10">
                          <span className="font-bold text-purple-400 block text-xs">✨ Gombo VIP</span>
                          <span className="font-mono text-xs font-bold text-white block mt-1">1 000 FCFA/m</span>
                          <p className="text-[10px] text-[#F5F5F5]/40 mt-1">Badge VIP, profil propulsé et publications épinglées.</p>
                        </div>
                        <div className="p-4 rounded bg-black/40 border border-[#D4AF37]/10">
                          <span className="font-bold text-[#D4AF37] block text-xs">🔥 Boost Gombo</span>
                          <span className="font-mono text-xs font-bold text-white block mt-1">500 - 2k FCFA</span>
                          <p className="text-[10px] text-[#F5F5F5]/40 mt-1">Bannière de distinction En vedette sur les tam-tams.</p>
                        </div>
                        <div className="p-4 rounded bg-black/40 border border-[#D4AF37]/10">
                          <span className="font-bold text-cyan-400 block text-xs">⚡ Renfort Express</span>
                          <span className="font-mono text-xs font-bold text-white block mt-1">500 FCFA</span>
                          <p className="text-[10px] text-[#F5F5F5]/40 mt-1">Marquage d'urgence immédiat sur les renforts.</p>
                        </div>
                        <div className="p-4 rounded bg-black/40 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                          <span className="font-bold text-emerald-400 block text-xs">💼 Gombo PRO</span>
                          <span className="font-mono text-xs font-bold text-white block mt-1">5 000 FCFA/m</span>
                          <p className="text-[10px] text-[#F5F5F5]/40 mt-1">Multi-utilisateurs, exports de données CSV et rapports.</p>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}

            </motion.div>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-lg p-6 rounded-2xl border space-y-4 shadow-2xl transition-all ${
              darkMode ? "bg-[#0B0B0C] border-[#FF6600]/30" : "bg-white border-zinc-200 shadow-xl"
            }`}
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <div>
                <span className="text-[10px] font-mono uppercase font-black text-[#FF6600]">Évaluation d'Excellence Gombo</span>
                <h4 className={`text-md font-display font-extrabold ${darkMode ? "text-white" : "text-zinc-805"}`}>
                  Clôturer Prestation : "{completingGombo.title}"
                </h4>
              </div>
              <button 
                onClick={() => setCompletingGombo(null)} 
                className={`text-2xl font-bold font-mono ${darkMode ? "text-white/40 hover:text-white" : "text-zinc-400 hover:text-zinc-700"}`}
              >
                &times;
              </button>
            </div>

            <p className={`text-xs leading-relaxed ${darkMode ? "text-white/60" : "text-zinc-500"}`}>
              Le Gombo est terminé ! Pour finaliser et libérer les garanties de la caisse, laissez une note de confiance et un commentaire d'excellence sur le musicien.
            </p>

            <div className="space-y-4 pt-1">
              {/* Option 1: Choose Musician */}
              <div className="space-y-1">
                <label className={`text-[10px] uppercase font-mono block font-bold ${darkMode ? "text-white/50" : "text-zinc-500"}`}>
                  Artiste ayant honoré le Gombo :
                </label>
                <select
                  value={reviewMusicianId}
                  onChange={(e) => setReviewMusicianId(e.target.value)}
                  className={`w-full text-xs rounded-lg p-2 font-mono focus:outline-none focus:border-[#FF6600] ${
                    darkMode ? "bg-black border-white/10 text-white" : "bg-zinc-100 border-zinc-300 text-zinc-800"
                  }`}
                >
                  <option value="" disabled>-- Sélectionner l'artiste certifié --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id} className="bg-black text-white">
                      {u.artisticName} ({u.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Option 2: Star rating (1-5 stars) */}
              <div className="space-y-2">
                <label className={`text-[10px] uppercase font-mono block font-bold ${darkMode ? "text-white/50" : "text-zinc-500"}`}>
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
                        className={`w-7 h-7 ${
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
                <label className={`text-[10px] uppercase font-mono block font-bold ${darkMode ? "text-white/50" : "text-zinc-500"}`}>
                  Témoignage écrit & Feedback :
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Ponctualité exemplaire, virtuosité remarquable et aisance scénique incomparable. Je recommande absolument."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className={`w-full text-xs rounded-lg p-2 focus:outline-none focus:border-[#FF6600] ${
                    darkMode ? "bg-black border-white/10 text-white" : "bg-zinc-100 border-zinc-300 text-zinc-800"
                  }`}
                />
              </div>

              {/* OPTIONAL RECIPROCAL REVIEW FOR THE CLIENT/EVENT */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                darkMode ? "bg-black/40 border-white/5 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-800"
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
                  <span className="text-xs text-white/40 cursor-help font-bold" title="Permet d'évaluer réciproquement l'accueil de l'organisateur.">❓</span>
                </div>

                {enableReciprocal && (
                  <div className="space-y-3 pt-1 border-t border-white/5 animate-fadeIn">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-mono text-zinc-400 block font-bold">
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
                                  : "text-zinc-600"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-mono text-zinc-400 block font-bold">
                        Commentaire de l'Artiste :
                      </span>
                      <input
                        type="text"
                        placeholder="Ex: Excellent accueil au cabaret, sonorisation haut standing et cachet remis rubis sur ongle."
                        value={reciprocalComment}
                        onChange={(e) => setReciprocalComment(e.target.value)}
                        className={`w-full text-[11px] rounded p-1.5 focus:outline-none focus:border-purple-500 ${
                          darkMode ? "bg-[#060606] border-white/10 text-white" : "bg-white border-zinc-300 text-zinc-800"
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
                  darkMode ? "border-white/10 text-[#F5F5F5]" : "border-zinc-300 text-zinc-700"
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleCompleteGombo}
                disabled={!reviewMusicianId}
                className={`px-5 py-2 text-white font-display font-black text-xs uppercase rounded-xl transition-all shadow-md ${
                  !reviewMusicianId 
                    ? "bg-zinc-700 cursor-not-allowed text-zinc-400" 
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
          className="fixed inset-0 bg-[#060606]/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full bg-black border border-purple-500/30 rounded-3xl p-8 text-center space-y-6 shadow-[0_0_50px_rgba(168,85,247,0.15)]">
            <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 via-pink-600 to-[#FF6600] rounded-full flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(236,72,153,0.5)]">
              <Crown className="w-8 h-8 text-white animate-bounce" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-extrabold block">Décret Royal Activé</span>
              <h3 className="text-2xl font-display font-black text-white">Salutations, Maître de l'Afrique Musicale</h3>
              <p className="text-xs text-white/75 leading-relaxed font-sans">
                "L'Empire d'AFRIGOMBO est entièrement sous vos ordres souverains. Les cachets, les licences d'or et l'intégralité des talents nationaux reposent entre vos mains expertes."
              </p>
            </div>
            
            {/* Simulated Loading Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-white/40">
                <span>Synchronisation des pouvoirs suprêmes</span>
                <span className="text-[#D4AF37] font-bold">100%</span>
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
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-[#FF6600] text-white hover:opacity-90 font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
            >
              Gouverner l'Application 👑
            </button>
          </div>
        </motion.div>
      )}

      {/* =========================================================================
                                     FIXED BOTTOM NAVIGATION BAR (FLOATING & WELL-ROUNDED)
         ========================================================================= */}
      {perspective === "user" && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[425px] h-[72px] bg-[#050505]/95 backdrop-blur-xl border border-[#D4AF37]/22 p-1 px-3 sm:px-4 flex justify-between items-center z-40 rounded-[28px] shadow-[0_12px_32px_rgba(0,0,0,0.85)] select-none">
          {/* 1. ACCUEIL */}
          <button
            id="user-nav-terrain"
            onClick={() => {
              setActiveMenu("user_terrain");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none flex-1 py-1 ${
              activeMenu === "user_terrain" ? "text-[#D4AF37] scale-102" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Home className="w-4.5 h-4.5" />
            <span className="text-[7.5px] font-sans font-black uppercase tracking-wider text-[#F5F5F5]">Accueil</span>
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
              activeMenu === "user_vibes" ? "text-[#D4AF37] scale-102" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Music className="w-4.5 h-4.5" />
            <span className="text-[7.5px] font-sans font-black uppercase tracking-wider text-[#F5F5F5]">Vibes</span>
          </button>

          {/* 3. PUBLIER (CENTRAL BUTTON, LARGER, NOT INDEPENDENTLY FLOATING/OVERLAPPING OVER BOUNDARY) */}
          <button
            id="user-nav-publish"
            onClick={() => {
              requireAuthThen(() => {
                setActiveMenu("user_publish");
                try { audioSynth.playValidationSuccess(); } catch (err) {}
              });
            }}
            className="flex flex-col items-center justify-center cursor-pointer transition-all duration-200 outline-none px-2 select-none shrink-0"
            title="Publier"
          >
            <div className="w-11 h-11 flex items-center justify-center bg-gradient-to-tr from-[#D4AF37] to-[#F1C40F] text-[#050505] rounded-full shadow-[0_0_12px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all">
              <Plus className="w-5 h-5 stroke-[3.5]" />
            </div>
            <span className="text-[7.5px] font-sans font-black uppercase tracking-wider text-[#F5F5F5] mt-0.5">Publier</span>
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
              activeMenu === "user_mes_gombos" ? "text-[#D4AF37] scale-102" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Megaphone className="w-4.5 h-4.5" />
            <span className="text-[7.5px] font-sans font-black uppercase tracking-wider text-[#F5F5F5]">Mes Gombos</span>
          </button>

          {/* 5. MON HÉRITAGE */}
          <button
            id="user-nav-heritage"
            onClick={() => {
              requireGoogleAuthThen(() => {
                setActiveMenu("user_heritage");
                setViewingGomboIdDetail(false);
                try { audioSynth.playValidationSuccess(); } catch (err) {}
              });
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none flex-1 py-1 ${
              activeMenu === "user_heritage" ? "text-[#D4AF37] scale-102" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <UserIcon className="w-4.5 h-4.5" />
            <span className="text-[7.5px] font-sans font-black uppercase tracking-wider text-[#F5F5F5]">Mon Héritage</span>
          </button>
        </div>
      )}

      {/* =========================================================================
                                     ADMIN FIXED BOTTOM NAVIGATION BAR
         ========================================================================= */}
      {perspective === "admin" && (
        <div className="fixed bottom-0 sm:bottom-4 left-0 sm:left-1/2 right-0 sm:right-auto sm:-translate-x-1/2 bg-[#090909]/95 sm:bg-[#121214]/95 backdrop-blur-md border-t sm:border border-[#D4AF37]/35 p-2.5 px-4 sm:px-8 flex justify-around sm:justify-between sm:gap-6 items-center z-40 sm:rounded-2xl sm:shadow-[0_8px_35px_rgba(212,175,55,0.2)] w-full sm:w-auto min-w-[320px] max-w-lg mx-auto">
          {/* 1. COCKPIT */}
          <button
            id="admin-nav-cockpit"
            onClick={() => {
              setActiveMenu("dashboard");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none flex-1 py-1 ${
              activeMenu === "dashboard" ? "text-[#D4AF37] scale-105" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-mono font-black uppercase tracking-wider">Cockpit</span>
          </button>

          {/* 2. UTILISATEURS */}
          <button
            id="admin-nav-utilisateurs"
            onClick={() => {
              setActiveMenu("users");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none flex-1 py-1 ${
              activeMenu === "users" ? "text-[#D4AF37] scale-105" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[9px] font-mono font-black uppercase tracking-wider">Utilisateurs</span>
          </button>

          {/* 3. PUBLICATIONS */}
          <button
            id="admin-nav-publications"
            onClick={() => {
              setActiveMenu("posts");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none flex-1 py-1 ${
              activeMenu === "posts" || activeMenu === "gombos" ? "text-[#D4AF37] scale-105" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[9px] font-mono font-black uppercase tracking-wider">Publications</span>
          </button>

          {/* 4. VÉRIFICATIONS */}
          <button
            id="admin-nav-verifications"
            onClick={() => {
              setActiveMenu("kyc");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none flex-1 py-1 ${
              activeMenu === "kyc" || activeMenu === "revision" ? "text-[#D4AF37] scale-105" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[9px] font-mono font-black uppercase tracking-wider">Vérifications</span>
          </button>

          {/* 5. PLUS */}
          <button
            id="admin-nav-plus"
            onClick={() => {
              setActiveMenu("plus");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none flex-1 py-1 ${
              activeMenu === "plus" || activeMenu === "super_admin" ? "text-[#D4AF37] scale-105" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[9px] font-mono font-black uppercase tracking-wider">Plus</span>
          </button>
        </div>
      )}

      {/* =========================================================================
                                     BROADCAST MODAL
         ========================================================================= */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#0B0B0B] border border-[#D4AF37] p-6 rounded-lg space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-display font-bold uppercase tracking-wider text-[#D4AF37]">
                Diffuser un Mégaphone Bulletin
              </h4>
              <button onClick={() => setIsBroadcastModalOpen(false)} className="text-white hover:text-red-500 font-bold">
                &times;
              </button>
            </div>

            <p className="text-xs text-[#F5F5F5]/60 leading-relaxed">
              Le bulletin sera épinglé au Tam-Tam pour l'ensemble des artistes en Côte d'Ivoire.
            </p>

            <textarea
              required
              rows={3}
              placeholder="Ex: Alerte pluie ! Soyez prudents à Cocody. Les Gombos en extérieur sont ajournés."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full bg-black border border-[#D4AF37]/20 rounded p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="px-4 py-1.5 border border-[#D4AF37]/20 text-xs rounded hover:bg-[#D4AF37]/5 transition-all text-[#F5F5F5]"
              >
                Annuler
              </button>
              <button
                onClick={triggerDailyBulletin}
                className="px-5 py-1.5 bg-[#D4AF37] hover:bg-[#B48F17] text-[#0B0B0B] text-xs font-bold rounded transition-all uppercase"
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
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#09090A] border-2 border-[#D4AF37] p-6 rounded-2xl space-y-4 shadow-2xl relative"
          >
            {/* Redesigned safe exit close */}
            <div className="flex justify-between items-center border-b border-[#D4AF37]/20 pb-3">
              <div>
                <h4 className="text-md font-sans font-black uppercase text-[#D4AF37] flex items-center gap-1">
                  📅 Événements & Concerts Élite 2026
                </h4>
                <p className="text-[9px] font-mono text-zinc-400">
                  PROGRAMMATION ET CACHETS PRIVÉS SOUVERAINS
                </p>
              </div>
              <button 
                onClick={() => setIsEventsModalOpen(false)} 
                className="w-8 h-8 rounded-full border border-[#D4AF37]/35 flex items-center justify-center text-white hover:text-red-500 font-bold hover:bg-[#D4AF37]/10"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              {/* Event 1 */}
              <div className="p-4 rounded-xl bg-black border border-[#D4AF37]/15 hover:border-[#D4AF37]/45 transition-colors space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-sans font-black text-white uppercase">FEMUA 2026 — Grande Scène</h5>
                    <p className="text-[9px] text-[#D4AF37] font-mono">📍 Marcory, Abidjan • 12 Juillet 2026</p>
                  </div>
                  <span className="text-[8px] font-mono py-0.5 px-2 bg-[#D4AF37]/10 rounded border border-[#D4AF37]/20 text-[#D4AF37] uppercase font-bold">
                    Tête d'Affiche
                  </span>
                </div>
                <p className="text-[10.5px] text-zinc-400">
                  Performance en prime-time devant 40 000 spectateurs. Intégration de vibes kora et kpanlogo traditionnels requise.
                </p>
                <div className="flex justify-between items-center pt-1 text-[10px]">
                  <span className="text-zinc-500">Cachet Artiste : <strong className="text-white">Sur devis</strong></span>
                  <button 
                    onClick={() => {
                      alert("Enregistré ! Votre agence d'Héritage a transmis votre dossier de candidature de groupe au BURIDA / FEMUA.");
                      try { audioSynth.playKoraSuccess(); } catch(e){}
                    }}
                    className="px-3 py-1 bg-[#D4AF37] hover:bg-[#B48F17] text-[#0B0B0B] font-bold rounded uppercase transition-colors"
                  >
                    Postuler 🔥
                  </button>
                </div>
              </div>

              {/* Event 2 */}
              <div className="p-4 rounded-xl bg-black border border-[#D4AF37]/15 hover:border-[#D4AF37]/45 transition-colors space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-sans font-black text-white uppercase font-display">Abidjan Jazz Premium Live</h5>
                    <p className="text-[9px] text-[#D4AF37] font-mono">📍 Palais des Congrès, Cocody • 28 Août 2026</p>
                  </div>
                  <span className="text-[8px] font-mono py-0.5 px-2 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-400 uppercase font-bold">
                    Cachet Garanti
                  </span>
                </div>
                <p className="text-[10.5px] text-zinc-400">
                  Soirée VIP de prestige. Idéal pour guitaristes solos, saxophonistes et percussionnistes d'Alliance.
                </p>
                <div className="flex justify-between items-center pt-1 text-[10px]">
                  <span className="text-zinc-500">Cachet : <strong className="text-[#D4AF37]">4 000 000 FCFA</strong></span>
                  <button 
                    onClick={() => {
                      alert("Premium Option validée ! Entretien de cachet planifié au Cabinet Gombo.");
                      try { audioSynth.playKoraSuccess(); } catch(e){}
                    }}
                    className="px-3 py-1 bg-[#D4AF37] hover:bg-[#B48F17] text-[#0B0B0B] font-bold rounded uppercase transition-colors"
                  >
                    Réserver Place 💎
                  </button>
                </div>
              </div>

              {/* Event 3 */}
              <div className="p-4 rounded-xl bg-black border border-[#D4AF37]/15 hover:border-[#D4AF37]/45 transition-colors space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-sans font-black text-white uppercase font-display">Nuit du Zouglou Souverain</h5>
                    <p className="text-[9px] text-[#D4AF37] font-mono">📍 Complexe Sportif, Yopougon • 05 Septembre 2026</p>
                  </div>
                  <span className="text-[8px] font-mono py-0.5 px-2 bg-pink-500/10 rounded border border-pink-500/25 text-pink-400 uppercase font-bold">
                    Zouglou Only
                  </span>
                </div>
                <p className="text-[10.5px] text-zinc-400">
                  Alliance de 10 groupes d'élite ivoiriens. Ambiance wôyô, tambours traditionnels d'Adjamé et choeurs harmonisés.
                </p>
                <div className="flex justify-between items-center pt-1 text-[10px]">
                  <span className="text-zinc-500">Cachet Garanti : <strong className="text-white">2 500 000 FCFA</strong></span>
                  <button 
                    onClick={() => {
                      alert("Inscrit au Tam-Tam ! Votre groupe est présélectionné pour le live de Yop.");
                      try { audioSynth.playKoraSuccess(); } catch(e){}
                    }}
                    className="px-3 py-1 bg-[#D4AF37] hover:bg-[#B48F17] text-[#0B0B0B] font-bold rounded uppercase transition-colors"
                  >
                    Postuler 🔥
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#D4AF37]/10">
              <button
                onClick={() => setIsEventsModalOpen(false)}
                className="px-5 py-2 bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-mono font-bold uppercase rounded-xl transition-all"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* =========================================================================
                               GOMBO ACADEMY MODAL (MASTERCLASSES)
         ========================================================================= */}
      {isAcademyModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#09090A] border-2 border-[#D4AF37] p-6 rounded-2xl space-y-4 shadow-2xl relative"
          >
            <div className="flex justify-between items-center border-b border-[#D4AF37]/20 pb-3">
              <div>
                <h4 className="text-md font-sans font-black uppercase text-[#D4AF37] flex items-center gap-1.5">
                  🏛️ Gombo Academy • Masterclasses
                </h4>
                <p className="text-[9px] font-mono text-zinc-400">
                  ENSEIGNEMENTS PROFESSIONNELS SOUVERAINS POUR MUSICIENS
                </p>
              </div>
              <button 
                onClick={() => setIsAcademyModalOpen(false)} 
                className="w-8 h-8 rounded-full border border-[#D4AF37]/35 flex items-center justify-center text-white hover:text-red-500 font-bold hover:bg-[#D4AF37]/10"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Class 1 */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-[#D4AF37] uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                  1. Législation BURIDA & Droits d'Héritage
                </h5>
                <p className="text-[11px] text-zinc-350 leading-relaxed pl-3.5 border-l border-zinc-800">
                  Apprenez à déposer vos oeuvres, protéger vos codes de vibes, et déclarer vos gombos d'Abidjan. Le BURIDA sécurise vos revenus d'alliance et d'héritage musical contre toute exploitation injuste.
                </p>
              </div>

              {/* Class 2 */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  2. Maîtriser l'Art de Négocier le Cachet
                </h5>
                <p className="text-[11px] text-zinc-350 leading-relaxed pl-3.5 border-l border-zinc-800">
                  Ne jamais accepter de cachet inférieur à <strong className="text-white">250 000 FCFA</strong> pour des prestations VIP d'Alliance. Utilisez la formule d'Héritage d'Afrigombo : calculez vos frais de transport logistique, vos consommables sonores, et valorisez votre réputation d'artiste certifié.
                </p>
              </div>

              {/* Class 3 */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-purple-400 uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  3. Session de Souffle Zouglou & Calage Rythmique
                </h5>
                <p className="text-[11px] text-zinc-350 leading-relaxed pl-3.5 border-l border-zinc-800">
                  Technique respiratoire de soutien pour chanter en wôyô pendant de longues performances sans altérer la clarté mélodique. Exercices de cohésion rythmique pour rester en phase avec le Tam-Tam maître.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-between items-center pt-2 border-t border-[#D4AF37]/10">
              <span className="text-[9px] font-mono text-zinc-500 italic block">
                "Ce que tu sais préserve l'Héritage."
              </span>
              <button
                onClick={() => {
                  alert("Félicitations pour votre soif d'enseignement artistique ! Des tuteurs nationaux vous contacteront prochainement.");
                  setIsAcademyModalOpen(false);
                }}
                className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#B48F17] text-[#0B0B0B] text-xs font-mono font-black uppercase rounded transition-colors"
              >
                S'inscrire à l'Héritage d'Alliance 🎓
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-sm relative">
            <AuthScreen 
              onSuccess={() => {
                setIsAuthModalOpen(false);
                addToTerminal("[🛡️ AUTH] Authentification réussie via Firebase Auth !");
              }} 
              onClose={() => setIsAuthModalOpen(false)}
            />
          </div>
        </div>
      )}

      {showGoogleLoginRequiredModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-[999] animate-fadeIn text-left">
          <div className="w-full max-w-sm bg-zinc-950 border border-amber-500/35 rounded-3xl p-6 space-y-5 shadow-2xl shadow-amber-500/5">
            <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mx-auto select-none">
              <Lock className="w-7 h-7" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-white text-base font-sans font-black uppercase tracking-wide">
                CONNEXION GOOGLE EXIGÉE
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                Par mesure de confiance inter-dimensionnelle et pour garantir l'intégrité de votre contrat souverain AfriTrust, l'accès à <strong>"Mon Héritage"</strong> requiert obligatoirement une authentification via un compte Google de confiance.
              </p>
            </div>

            <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-2xl text-[11px] font-mono text-zinc-550 space-y-1">
              <div>• Session courante : {currentUser?.email || "Email standard"}</div>
              <div>• Statut : Lié par email/pass (Exclus)</div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowGoogleLoginRequiredModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-90 w-full hover:bg-zinc-850 text-zinc-300 hover:text-white transition-all text-xs font-mono font-bold border border-zinc-800"
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
                className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#B48F17] text-black transition-all text-xs font-sans font-black uppercase tracking-wider"
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
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-lg bg-[#0F0F11] border border-[#D4AF37]/35 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header Image backdrop */}
              <div className="h-44 w-full relative bg-zinc-950 shrink-0">
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
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/85 border border-[#D4AF37]/30 flex items-center justify-center text-white hover:text-red-400 text-lg transition-all cursor-pointer select-none active:scale-90"
                  title="Fermer"
                >
                  &times;
                </button>

                <div className="absolute bottom-4 left-6">
                  <span className="text-[10px] font-mono font-black uppercase text-[#D4AF37] bg-black/90 px-3 py-1 rounded-xl border border-[#D4AF37]/30">
                    {selectedGomboDetails.type || "Live Direct Showcase"}
                  </span>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap text-zinc-500 font-mono text-[10px]">
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase select-none">
                      ● Cachet Actif
                    </span>
                    <span>📍 {selectedGomboDetails.location}</span>
                    <span>• {selectedGomboDetails.date || "Immédiat"}</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-display font-black text-white leading-tight uppercase">
                    {selectedGomboDetails.title}
                  </h3>
                </div>

                <div className="space-y-1.5 p-4 rounded-2xl bg-black/40 border border-white/5">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 block font-bold">CACHET FINANCIER GARANTI :</span>
                  <strong className="text-3xl font-display font-black text-[#D4AF37] tracking-tight block">
                    {(selectedGomboDetails.budget || 250000).toLocaleString("fr-FR")} <span className="text-sm font-mono text-zinc-400 font-normal">FCFA</span>
                  </strong>
                </div>

                <div className="space-y-2 text-zinc-300 text-xs sm:text-sm leading-relaxed">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block font-bold">DESCRIPTION DU CONTRAT :</span>
                  <p>{selectedGomboDetails.description}</p>
                </div>

                {/* SOVEREIGN CONTRACT TRACKING & ESCROW PANEL */}
                {hasApplied && (
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-[#D4AF37]/35 space-y-4 text-xs animate-fadeIn">
                    <div className="border-b border-[#D4AF37]/20 pb-2 flex items-center justify-between">
                      <span className="font-mono font-bold text-[#D4AF37] uppercase tracking-wider text-[9px]">⚖️ RECTO-VERSO CONTRACTUEL SOUVERAIN</span>
                      <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded uppercase font-mono font-bold">Escrow Sécurisé GomboCaisse</span>
                    </div>

                    {/* Section System Renfort group if category === "Renfort groupe" */}
                    {selectedGomboDetails.category === "Renfort groupe" && (
                      <div className="space-y-3 bg-black/40 p-3 rounded-xl border border-white/5 text-left">
                        <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold text-zinc-400">
                          <span>📋 Suivi Répétitions :</span>
                          <span className="text-amber-400 font-mono">{contractRepsConfirmed[selectedGomboDetails.id] || 0} confirmées / {selectedGomboDetails.repetitionsCount || 3}</span>
                        </div>

                        {/* Rehearsals stats */}
                        <div className="text-[10px] text-zinc-400 space-y-1 bg-zinc-90 w-full p-2.5 rounded-lg border border-white/5 font-mono">
                          <div>📅 <span className="text-zinc-500">Dates :</span> <span className="text-white">{selectedGomboDetails.repetitionsDates || "Défini par l'organisateur"}</span></div>
                          <div>⏰ <span className="text-zinc-500">Horaires :</span> <span className="text-white">{selectedGomboDetails.repetitionsSchedule || "ex: 18:00 - 21:00"}</span></div>
                          <div>💰 <span className="text-zinc-500">Transport/répétition :</span> <span className="text-[#D4AF37] font-bold">{(selectedGomboDetails.transportFee || 3000).toLocaleString()} FCFA</span></div>
                          <div>💰 <span className="text-zinc-500">Budget transport bloqué :</span> <span className="text-emerald-400 font-bold">{((selectedGomboDetails.transportFee || 3000) * (selectedGomboDetails.repetitionsCount || 3)).toLocaleString()} FCFA</span></div>
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
                            className="flex-1 py-1.5 px-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37] border border-[#D4AF37]/35 text-[#D4AF37] hover:text-black font-sans font-bold text-[9px] rounded-lg tracking-wider transition-all cursor-pointer uppercase text-center"
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
                    <div className="space-y-3 bg-black/40 p-3 rounded-xl border border-white/5 text-left">
                      <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 block">🎤 Prestation Jour J :</span>
                      
                      <div className="flex items-center justify-between text-[11px] font-mono py-1">
                        <span className="text-zinc-500">Statut Prestation :</span>
                        {contractDDayEnded[selectedGomboDetails.id] ? (
                          <span className="text-emerald-400 font-bold">✓ TERMINÉ & LIBÉRÉ</span>
                        ) : contractDDayStarted[selectedGomboDetails.id] ? (
                          <span className="text-amber-400 animate-pulse font-bold">● EN COURS DE PRESTATION</span>
                        ) : (
                          <span className="text-zinc-500 font-bold">EN ATTENTE DU SIGNAL</span>
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
                            className="w-full py-1.5 px-2.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37] border border-[#D4AF37]/35 text-[#D4AF37] hover:text-black font-sans font-bold text-[9px] rounded-lg tracking-wider transition-all cursor-pointer uppercase text-center"
                          >
                            Co-Confirmer la Fin (Libérer) 🔓
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dispute cancel section */}
                    <div className="pt-2 border-t border-white/5 space-y-2 text-left">
                      <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold">
                        <span className="text-red-500 uppercase block font-bold">⚡ Litige & Annulations :</span>
                        {contractDisputeOpened[selectedGomboDetails.id] && (
                          <span className="text-[8px] font-mono bg-red-400/10 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">EN ANALYSE LITIGIEUSE</span>
                        )}
                      </div>

                      {contractDisputeOpened[selectedGomboDetails.id] ? (
                        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 space-y-1.5 text-left font-mono text-[10px]">
                          <p className="text-zinc-400 italic font-sans">Un litige d'Escrow a été ouvert et est actuellement en cours d'analyse par l'Arbitrage final d'AFRIGOMBO.</p>
                          <div className="text-zinc-500">
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
                          className="w-full py-1.5 bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white font-sans font-bold text-[9px] rounded-lg tracking-wider transition-all cursor-pointer uppercase text-center"
                        >
                          Ouvrir un Litige / Signaler Annulation ⚖️
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* INTERACTIVE ACTIONS BAR */}
                <div className="flex items-center justify-between border-t border-b border-zinc-900/60 py-3 text-zinc-400">
                  <button
                    onClick={() => {
                      const isLiked = likedGombos.includes(selectedGomboDetails.id);
                      setLikedGombos(prev =>
                        isLiked ? prev.filter(id => id !== selectedGomboDetails.id) : [...prev, selectedGomboDetails.id]
                      );
                      try { audioSynth.playTamTam(true); } catch (_) {}
                    }}
                    className="flex items-center gap-1.5 hover:text-[#D4AF37] transition text-xs font-bold"
                  >
                    <Heart className={`w-4 h-4 ${likedGombos.includes(selectedGomboDetails.id) ? "fill-[#D4AF37] text-[#D4AF37]" : ""}`} />
                    <span>{likedGombos.includes(selectedGomboDetails.id) ? "Aimé" : "Aimer"}</span>
                  </button>

                  <button
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(`AFRIGOMBO - ${selectedGomboDetails.title} (Cachet: ${selectedGomboDetails.budget} FCFA)`);
                        addToTerminal(`[INFO] Informations copiées dans le presse-papiers.`);
                        audioSynth.playValidationSuccess();
                      } catch (_) {}
                    }}
                    className="flex items-center gap-1.5 hover:text-[#D4AF37] transition text-xs font-bold"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Partager</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!currentUser) {
                        addToTerminal("[ALERTE] Veuillez vous connecter pour envoyer un message.");
                        return;
                      }
                      setSelectedGomboDetails(null);
                      setOpenConvoWithUserId(selectedGomboDetails.organizerId || "admin");
                      setActiveMenu("user_messages");
                      try { audioSynth.playValidationSuccess(); } catch (_) {}
                    }}
                    className="flex items-center gap-1.5 hover:text-[#D4AF37] transition text-xs font-bold"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contacter</span>
                  </button>

                  <button
                    onClick={() => {
                      addToTerminal(`[SIGNALEMENT] Alerte transmise avec succès pour examen de "${selectedGomboDetails.title}".`);
                      try { audioSynth.playTamTam(false); } catch (_) {}
                    }}
                    className="flex items-center gap-1.5 hover:text-red-500 transition text-xs font-bold"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Signaler</span>
                  </button>
                </div>

                {/* AUTHOR PROFILE ROW */}
                <div className="flex items-center justify-between border-b border-zinc-900/60 pb-4 text-[11px] font-mono text-zinc-500 gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border border-[#D4AF37]/35 flex items-center justify-center bg-zinc-950 font-bold text-[#D4AF37] text-[10px] uppercase">
                      {selectedGomboDetails.organizerName?.charAt(0) || "O"}
                    </div>
                    <div>
                      <span className="block text-[8px] text-zinc-650 uppercase font-bold leading-none">ORGANISATEUR :</span>
                      <span className="text-zinc-300 font-bold mt-0.5 block">{selectedGomboDetails.organizerName}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[8px] text-zinc-650 uppercase font-bold text-right leading-none">CANDIDATS :</span>
                    <span className="text-[#D4AF37] font-bold mt-0.5 block text-right">{selectedGomboDetails.applicantsCount + (hasApplied ? 1 : 0)} postulants</span>
                  </div>
                </div>

                {/* DISCUSSIONS AND REAL-TIME COMMENTS */}
                <div className="space-y-4 pt-2">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block font-bold">ESPACE DISCUSSIONS :</span>
                  
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
                        <div key={i} className="bg-black/40 border border-zinc-900/60 rounded-2xl p-3 flex gap-2.5 w-full text-left">
                          <div className="w-7 h-7 rounded-xl bg-zinc-900/70 border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-[#D4AF37] uppercase">{c.author.substring(0, 2)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline gap-1">
                              <span className="text-[11px] font-black text-white leading-none truncate">{c.author}</span>
                              <span className="text-[8px] text-zinc-650 font-mono leading-none">{c.date}</span>
                            </div>
                            <p className="text-[11px] text-zinc-300 mt-1 font-sans break-words leading-relaxed">{c.text}</p>
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
                      className="flex-1 bg-zinc-950 border border-zinc-900 focus:border-[#D4AF37]/50 focus:bg-black rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none"
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
                      className="bg-[#D4AF37] hover:bg-[#F3C43F] text-black font-black text-[9px] uppercase tracking-widest px-4 rounded-2xl transition-all active:scale-95"
                    >
                      Envoyer
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 bg-[#0E0E10] border-t border-zinc-900 shrink-0 flex gap-3">
                <button
                  onClick={() => setSelectedGomboDetails(null)}
                  className="flex-1 py-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-white text-xs font-mono font-black uppercase tracking-wider transition-all select-none active:scale-95 cursor-pointer"
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
                      : "bg-[#D4AF37] hover:bg-[#B48F17] text-[#0B0B0B] shadow-[0_4px_15px_rgba(212,175,55,0.25)]"
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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/93 backdrop-blur-md">
          <div className="w-full max-w-3xl aspect-video bg-black rounded-3xl overflow-hidden relative border border-zinc-900">
            <button
              onClick={() => setReelsVideoId(null)}
              className="absolute top-3.5 right-3.5 z-10 p-2.5 bg-black/70 hover:bg-black/95 text-white rounded-full text-xs font-bold border border-white/10 hover:scale-105 cursor-pointer leading-none"
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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/93 backdrop-blur-md">
          <div className="w-full max-w-3xl aspect-video bg-black rounded-3xl overflow-hidden relative border border-zinc-900 flex items-center justify-center">
            <button
              onClick={() => setReelsVideoUrl(null)}
              className="absolute top-3.5 right-3.5 z-10 p-2.5 bg-black/70 hover:bg-black/95 text-white rounded-full text-xs font-bold border border-white/10 hover:scale-105 cursor-pointer leading-none"
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

    </div>
  );
}
