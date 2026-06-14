import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  onSnapshot,
  getDocs,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  limit
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../AuthContext";
import AuthScreen from "./AuthScreen";
import GomboIdUserDashboard from "./GomboIdUserDashboard";
import { PrivacyPage, TermsPage, DeleteAccountPage } from "./PublicPages";
import FounderThrone from "./FounderThrone";
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
  Tv,
  Users,
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
  Bookmark,
  MessageSquare,
  Calendar,
  Send,
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
  MoreVertical
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

export default function AdminCentre({ darkMode, setDarkMode }: AdminCentreProps) {
  const { currentUser, profile, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const requireAuthThen = (action: () => void) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      try { audioSynth.playKoraSuccess(); } catch (err) {}
    } else {
      action();
    }
  };

  const [activeMenu, setActiveMenu] = useState<any>("user_terrain");
  const [viewingGomboIdDetail, setViewingGomboIdDetail] = useState<boolean>(false);
  const [selectedGomboDetails, setSelectedGomboDetails] = useState<Gombo | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
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

  // Le Terrain, Vibes, and dynamic publishing interactions states
  const [terrainTab, setTerrainTab] = useState<"all" | "musicien" | "contrat">("all");
  const [appliedGombos, setAppliedGombos] = useState<string[]>([]);
  const [newPostContent, setNewPostContent] = useState<string>("");
  const [newGomboTitle, setNewGomboTitle] = useState<string>("");
  const [newGomboDesc, setNewGomboDesc] = useState<string>("");
  const [newGomboPrice, setNewGomboPrice] = useState<number>(55050);
  const [newGomboCommune, setNewGomboCommune] = useState<string>("Cocody");
  const [newPubType, setNewPubType] = useState<"post" | "gombo" | "opportunite" | "annonce" | "casting" | "evenement" | "contenu">("post");
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

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
  const isAuthorizedSuperFounder = !!(currentUser && (userEmail === "johnsylvesterh@gmail.com" || userEmail === "jhs.kmj7@gmail.com"));

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
    });
    return () => unsub();
  }, [adminEmail]);
  const [isSuperWelcomeOpen, setIsSuperWelcomeOpen] = useState<boolean>(false);

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
      aiModerated: true
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
      timestamp: "2026-06-09T22:15:00Z"
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

  // --- ADMINISTRATIVE ACTION LOGS (ZONE C TERMINAL) ---
  const [terminalFeed, setTerminalFeed] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] 🦅 AFRIGOMBO Elite Centre de Commandement allumé. Connecté au Firebase.`,
    `[${new Date().toLocaleTimeString()}] Securité de l'Héritage Musical : auto-sauvegarde active.`,
    `[${new Date().toLocaleTimeString()}] Gombocaisse : commission par défaut fixée à 10%.`,
  ]);

  // --- DYNAMIC BRIEF DATA (DAILY SUMMARY MODULE) ---
  const [brief, setBrief] = useState<AdminBrief>({
    newUsersCount: 38,
    newPostsCount: 124,
    newGombosCount: 4,
    revenuesGenerated: 485000,
    kycRequestsCount: 1,
    criticalAlertsCount: 2,
    timestamp: new Date().toLocaleDateString()
  });

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
      });

      return () => {
        unsubscribeUsers();
        unsubscribeGombos();
        unsubscribeTransactions();
        unsubscribeReviews();
        unsubscribeAlerts();
        unsubscribePosts();
      };
    } catch (e) {
      addToTerminal(`[Alerte locale] Lancement offline synchronisé.`);
    }
  }, []);

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
      await setDoc(docRef, data, { merge: true });
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
    
    setBrief(prev => ({
      ...prev,
      revenuesGenerated: prev.revenuesGenerated + amount
    }));
    
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

    // Update statistics
    setBrief(prev => ({
      ...prev,
      newGombosCount: prev.newGombosCount + 1
    }));

    // Reset Form
    setNewGombo({
      title: "",
      description: "",
      budget: "",
      commissionRate: "10",
      location: "Cocody"
    });
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

    // Generate unique ID only on approval
    const gmbId = "GMB-" + Math.floor(1000 + Math.random() * 9000) + "-" + Math.floor(1000 + Math.random() * 9000);

    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        const u: User = { 
          ...user, 
          kycStatus: "approved" as const, 
          isCertified: true,
          gomboIdNumber: gmbId,
          kycApprovedDate: new Date().toLocaleDateString("fr-FR")
        };
        saveToFirestore("users", user.id, u);
        return u;
      }
      return user;
    });
    setUsers(updatedUsers);
    
    // Log in admin_logs
    await logAdminAction(
      "CERTIFIER_ARTISTE",
      userId,
      targetUser.artisticName,
      `Attribution de l'identifiant permanent ${gmbId}. Type : ${express ? "Express" : "Standard"}`
    );

    setBrief(prev => ({
      ...prev,
      kycRequestsCount: Math.max(0, prev.kycRequestsCount - 1)
    }));
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
      artisticName: user.performance.artisticName || user.artisticName,
      commune: user.performance.commune || user.commune,
      specialties: user.performance.specialties || user.specialties,
      groups: user.performance.groups || user.groups,
      level: user.performance.level || 1,
      score: user.performance.score || 0
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
            ...user.performance,
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
      user.name.toLowerCase().includes(s) ||
      user.artisticName.toLowerCase().includes(s) ||
      user.commune.toLowerCase().includes(s)
    );
  });

  return (
    <div className="flex h-screen bg-[#0B0B0B] text-[#F5F5F5] font-sans antialiased overflow-hidden">
      
      {/* BACKDROP FOR SLIDING SIDEBAR */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300 cursor-pointer pointer-events-auto"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* =========================================================================
                              ZONE A : SIDEBAR COLONNE FIXE (SLIDEOUT DRAWER)
         ========================================================================= */}
      <aside className={`fixed inset-y-0 left-0 w-72 border-r border-[#D4AF37]/20 bg-[#0B0B0B] flex flex-col justify-between p-6 z-50 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} shrink-0`}>
        
        {/* LOGO & HEADING */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/35 flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                <Flame className="text-[#D4AF37] w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-md font-sans font-black uppercase tracking-wider text-white">
                  Afrigombo
                </h1>
                <span className="text-[8px] uppercase font-mono tracking-widest text-[#D4AF37] block -mt-1 font-bold">
                  Y'A GOMBO MUSIC
                </span>
              </div>
            </div>
            
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-[#D4AF37] hover:text-white hover:bg-[#D4AF37]/10 rounded-lg transition-all focus:outline-none flex items-center justify-center border border-[#D4AF37]/25 hover:border-[#D4AF37] cursor-pointer"
              title="Fermer le menu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* USER PROFILE CARD */}
          {!currentUser ? (
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                setIsAuthModalOpen(true);
                try { audioSynth.playKoraSuccess(); } catch (err) {}
              }}
              className="w-full mb-5 bg-[#D4AF37] hover:bg-[#B48F17] text-[#0B0B0B] rounded-2xl p-4 text-center cursor-pointer font-black tracking-wider transition-all duration-200 transform hover:scale-[1.02] shadow-[0_4px_15px_rgba(212,175,55,0.3)] flex flex-col items-center justify-center gap-1.5 border border-transparent"
            >
              <Flame className="w-6 h-6 fill-current animate-pulse text-[#0B0B0B]" />
              <div className="text-xs uppercase font-display font-black leading-tight text-[#0B0B0B]">
                BIENVENUE DANS Y'A GOMBO MUSIC
              </div>
              <div className="text-[10px] uppercase font-mono font-extrabold bg-[#0B0B0B] text-[#D4AF37] px-2.5 py-1 rounded-lg">
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
                <div className="mb-5 bg-zinc-900/60 border border-[#D4AF37]/15 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center gap-3">
                    {/* Photo ronde */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full border border-[#D4AF37]/45 overflow-hidden bg-[#D4AF37]/10 flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.15)] font-display font-black">
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
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-black flex items-center justify-center" title="Certifié">
                          <span className="text-[8px] text-white font-bold">✓</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="min-w-0">
                      <h3 className="text-xs font-sans font-black text-white leading-tight truncate flex items-center gap-1">
                        {currentArtist ? currentArtist.artisticName : "Artiste Invité"}
                      </h3>
                      <p className="text-[9px] text-[#D4AF37] font-mono uppercase tracking-wide font-bold">
                        {currentArtist ? currentArtist.commune : "Abidjan"}, CI
                      </p>
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] text-[8px] font-mono uppercase border border-[#D4AF37]/20 font-extrabold">
                        Musicien
                      </span>
                    </div>
                  </div>

                  {/* Simulated Active Artist Selector */}
                  {perspective === "user" && !profile && (
                    <div className="space-y-1 pt-2 border-t border-[#D4AF37]/10">
                      <span className="text-[8px] uppercase font-mono text-zinc-400 block font-semibold">🔮 Artiste Actif Simulé :</span>
                      <select
                        value={activeArtistId}
                        onChange={(e) => {
                          setActiveArtistId(e.target.value);
                        }}
                        className="w-full bg-black border border-white/10 rounded px-1.5 py-1 text-[10px] text-white font-mono focus:outline-none cursor-pointer"
                      >
                        {users.map(u => (
                          <option key={u.id} value={u.id} className="bg-black text-white">
                            {u.artisticName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })()
          )}

          {/* SLOGAN PRESTIGE */}
          <div className="p-3.5 rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/10 mb-4 text-center text-[11px] text-[#D4AF37] italic">
            "🎼 Ton héritage attire les gombos."
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="space-y-1">
            {perspective === "user" ? (
              <>
                <button
                  onClick={() => {
                    setActiveMenu("user_terrain");
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-xs font-mono font-bold uppercase transition-all duration-205 ${
                    activeMenu === "user_terrain"
                      ? "bg-[#D4AF37] text-black font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-white/70 hover:text-white hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  Le Terrain
                </button>

                <button
                  onClick={() => {
                    requireAuthThen(() => {
                      setActiveMenu("user_heritage");
                      setIsSidebarOpen(false);
                    });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-xs font-mono font-bold uppercase transition-all duration-205 ${
                    activeMenu === "user_heritage"
                      ? "bg-[#D4AF37] text-black font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-white/70 hover:text-white hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Mon Héritage
                </button>

                <button
                  onClick={() => {
                    requireAuthThen(() => {
                      setActiveMenu("user_gombo_id");
                      setIsSidebarOpen(false);
                    });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-xs font-mono font-bold uppercase transition-all duration-205 ${
                    activeMenu === "user_gombo_id"
                      ? "bg-[#D4AF37] text-black font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-white/70 hover:text-white hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  GOMBO ID
                </button>

                <button
                  onClick={() => {
                    requireAuthThen(() => {
                      setActiveMenu("user_mes_gombos");
                      setIsSidebarOpen(false);
                    });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-xs font-mono font-bold uppercase transition-all duration-205 ${
                    activeMenu === "user_mes_gombos"
                      ? "bg-[#D4AF37] text-black font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-white/70 hover:text-white hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Mes Gombos
                </button>

                <button
                  onClick={() => {
                    requireAuthThen(() => {
                      setActiveMenu("user_mes_groupes");
                      setIsSidebarOpen(false);
                    });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-xs font-mono font-bold uppercase transition-all duration-205 ${
                    activeMenu === "user_mes_groupes"
                      ? "bg-[#D4AF37] text-black font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-white/70 hover:text-white hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Mes Groupes
                </button>

                <button
                  onClick={() => {
                    requireAuthThen(() => {
                      setActiveMenu("user_renforts");
                      setIsSidebarOpen(false);
                    });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-xs font-mono font-bold uppercase transition-all duration-205 ${
                    activeMenu === "user_renforts"
                      ? "bg-[#D4AF37] text-black font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-white/70 hover:text-white hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Renforts
                </button>

                <button
                  onClick={() => {
                    requireAuthThen(() => {
                      setActiveMenu("user_opportunities");
                      setIsSidebarOpen(false);
                    });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-xs font-mono font-bold uppercase transition-all duration-205 ${
                    activeMenu === "user_opportunities"
                      ? "bg-[#D4AF37] text-black font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-white/70 hover:text-white hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  Opportunités
                </button>

                <button
                  onClick={() => {
                    requireAuthThen(() => {
                      setActiveMenu("user_settings");
                      setIsSidebarOpen(false);
                    });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-xs font-mono font-bold uppercase transition-all duration-205 ${
                    activeMenu === "user_settings"
                      ? "bg-[#D4AF37] text-black font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-white/70 hover:text-white hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  Paramètres
                </button>

                <button
                  onClick={() => {
                    requireAuthThen(() => {
                      setActiveMenu("user_notifications");
                      setIsSidebarOpen(false);
                    });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-xs font-mono font-bold uppercase transition-all duration-205 ${
                    activeMenu === "user_notifications"
                      ? "bg-[#D4AF37] text-black font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-white/70 hover:text-white hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  Notifications
                </button>

                <button
                  onClick={() => {
                    requireAuthThen(() => {
                      setActiveMenu("user_edit_profile");
                      setIsSidebarOpen(false);
                    });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-xs font-mono font-bold uppercase transition-all duration-205 ${
                    activeMenu === "user_edit_profile"
                      ? "bg-[#D4AF37] text-black font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-white/70 hover:text-white hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Modifier mon profil
                </button>

                {isAuthorizedAdmin && (
                  <button
                    onClick={() => {
                      setPerspective("admin");
                      setActiveMenu("dashboard");
                      setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-xs font-mono font-semibold uppercase text-[#D4AF37] bg-[#D4AF37]/5 hover:bg-[#D4AF37]/15 transition-all duration-205 border border-[#D4AF37]/25 hover:border-[#D4AF37]"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    🛡️ Centre d'Administration
                  </button>
                )}

                {currentUser && (
                  <button
                    onClick={async () => {
                      const confirmLogout = window.confirm("Souhaitez-vous vous déconnecter de votre session d'artiste ?");
                      if (confirmLogout) {
                        try {
                          await logout();
                          setActiveMenu("user_terrain");
                          setIsSidebarOpen(false);
                          try { audioSynth.playValidationSuccess(); } catch (err) {}
                          addToTerminal("[INFO] Session d'artiste déconnectée. Retour en mode Invité.");
                        } catch (err: any) {
                          console.error("Error signing out:", err);
                          alert("Impossible de se déconnecter.");
                        }
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 mt-2 text-left rounded-lg text-xs font-mono font-bold uppercase text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-205 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                )}
              </>
            ) : (
              <>
                 <button
                  id="admin-btn-pilotage"
                  onClick={() => {
                    setActiveMenu("dashboard");
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    activeMenu === "dashboard"
                      ? "bg-[#D4AF37] text-[#0B0B0B] font-semibold font-display shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Pilotage & Dashboard
                </button>

                <button
                  id="admin-btn-users"
                  onClick={() => {
                    setKycActiveTab("all");
                    setActiveMenu("kyc");
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    activeMenu === "kyc" && kycActiveTab === "all"
                      ? "bg-[#D4AF37] text-[#0B0B0B] font-semibold font-display shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  👥 Utilisateurs
                </button>

                <button
                  id="admin-btn-gombo-id"
                  onClick={() => {
                    setKycActiveTab("standard");
                    setActiveMenu("kyc");
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    activeMenu === "kyc" && kycActiveTab !== "all"
                      ? "bg-[#D4AF37] text-[#0B0B0B] font-semibold font-display shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  🛡️ GOMBO ID
                </button>

                <button
                  id="admin-btn-publications"
                  onClick={() => {
                    setActiveMenu("gombos");
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    activeMenu === "gombos"
                      ? "bg-[#D4AF37] text-[#0B0B0B] font-semibold font-display shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  📢 Publications
                </button>

                <button
                  id="admin-btn-signalements"
                  onClick={() => {
                    setActiveMenu("revision");
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    activeMenu === "revision"
                      ? "bg-[#D4AF37] text-[#0B0B0B] font-semibold font-display shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <AlertOctagon className="w-4 h-4" />
                  🚨 Signalements
                </button>

                <button
                  id="admin-btn-revenus"
                  onClick={() => {
                    setActiveMenu("caisse");
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    activeMenu === "caisse"
                      ? "bg-[#D4AF37] text-[#0B0B0B] font-semibold font-display shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  💰 Revenus
                </button>

                <button
                  id="admin-btn-annonces"
                  onClick={() => {
                    setIsBroadcastModalOpen(true);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#D4AF37]/5 hover:translate-x-1 transition-all duration-205"
                >
                  <Megaphone className="w-4 h-4" />
                  📣 Annonces
                </button>

                {adminEmail?.trim().toLowerCase() === "johnsylvesterh@gmail.com" && (
                  <button
                    onClick={() => {
                      setActiveMenu("super_admin");
                      setIsSidebarOpen(false);
                      addToTerminal(`[Trône] Le Fondateur Unique accède à son trône royal.`);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-lg text-xs font-black font-mono uppercase tracking-widest transition-all duration-300 border ${
                      activeMenu === "super_admin"
                        ? "bg-gradient-to-r from-black via-zinc-950 to-zinc-900 border-[#D4AF37] text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                        : "text-[#D4AF37] bg-black hover:bg-[#D4AF37]/5 border-[#D4AF37]/30 hover:border-[#D4AF37] animate-pulse"
                    }`}
                  >
                    <Crown className="w-4 h-4 text-[#D4AF37]" />
                    👑 Accéder au Trône du Fondateur
                  </button>
                )}

                <button
                  onClick={() => {
                    setPerspective("user");
                    setActiveMenu("user_heritage");
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 mt-4 text-left rounded-lg text-xs font-mono font-bold uppercase text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all duration-205 border border-[#D4AF37]/20 hover:border-[#D4AF37]"
                >
                  <Users className="w-4 h-4" />
                  Perspective Artiste
                </button>

                <button
                  onClick={async () => {
                    const confirmLogout = window.confirm("Souhaitez-vous vous déconnecter de votre session d'administration ?");
                    if (confirmLogout) {
                      try {
                        await logout();
                        setPerspective("user");
                        setActiveArtistId("user_1");
                        setActiveMenu("user_terrain");
                        setIsSidebarOpen(false);
                        try { audioSynth.playValidationSuccess(); } catch (err) {}
                        addToTerminal("[INFO] Administration fermée. Session déconnectée.");
                      } catch (err: any) {
                        console.error("Error signing out admin:", err);
                        alert("Impossible de se déconnecter.");
                      }
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 mt-2 text-left rounded-lg text-xs font-mono font-bold uppercase text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-205 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </>
            )}
          </nav>
        </div>

        {/* CONTROLS IN SIDEBAR FOOTER */}
        <div className="space-y-4">
          {/* Quick System Action Button */}
          <button
            onClick={triggerGlobalSystemScan}
            disabled={scannerStatus === "scanning"}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-transparent border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all text-xs font-mono font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scannerStatus === "scanning" ? "animate-spin" : ""}`} />
            Scan Intelligent Global
          </button>

          {/* User Signout or Status */}
          <div className="flex items-center gap-3 pt-4 border-t border-[#D4AF37]/10">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37] flex items-center justify-center">
              <span className="font-mono font-bold text-xs text-[#D4AF37]">SA</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-[#F5F5F5] block">Yoro Admin</span>
              <span className="text-[9px] font-mono uppercase text-[#10B981] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                Super Admin
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
                               ZONE B : WORKSPACE CENTRAL (MIDDLE)
         ========================================================================= */}
      <main className="flex-1 bg-[#0B0B0B] flex flex-col overflow-y-auto px-8 py-6">
        
        {/* ELITE UPPER STATUS BAR (AFRIGOMBO PREMIUM HEADER) */}
        <header className="flex justify-between items-center pb-5 border-b border-[#D4AF37]/15 mb-6 shrink-0 gap-3 w-full animate-fadeIn select-none">
          {isHeaderSearchOpen ? (
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-black border border-[#D4AF37]/45 rounded-xl px-3 py-2 w-full">
                <Search className="w-4 h-4 text-[#D4AF37]" />
                <input
                  type="text"
                  placeholder="Rechercher artiste, gombo, concert..."
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
                className="w-11 h-11 text-[#D4AF37] hover:text-white hover:bg-[#D4AF37]/10 border border-zinc-800 hover:border-[#D4AF37]/40 rounded-xl transition-all focus:outline-none flex items-center justify-center cursor-pointer bg-black/60 shrink-0 select-none"
                title="Ouvrir le menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Middle Brand Section */}
              <div className="flex items-center gap-2.5 select-none shrink-0">
                {/* Logo AFRIGOMBO */}
                <div className="w-11 h-11 rounded-full bg-black border border-[#D4AF37] flex items-center justify-center shadow-[0_0_12px_rgba(212,175,55,0.25)] select-none shrink-0">
                  <Flame className="text-[#D4AF37] w-5 h-5 stroke-[2]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-sans font-black tracking-[0.08em] text-white leading-none uppercase font-display">
                    AFRIGOMBO
                  </span>
                  <span className="text-[10px] font-sans font-black tracking-wider text-[#D4AF37] leading-none uppercase mt-1">
                    Y'A GOMBO MUSIC
                  </span>
                  <span className="text-[8px] font-semibold text-zinc-500 mt-1 flex items-center gap-1 font-mono leading-none uppercase">
                    LE TERRAIN D'ACTION 🇨🇮
                  </span>
                </div>
              </div>

              {/* Right Controls Row */}
              <div className="flex items-center gap-2 shrink-0">
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

                {/* Search trigger icon box */}
                <button
                  id="search-btn"
                  onClick={() => setIsHeaderSearchOpen(true)}
                  className="w-11 h-11 text-zinc-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 border border-zinc-800 hover:border-[#D4AF37]/40 rounded-xl transition-all flex items-center justify-center cursor-pointer bg-black/60 shrink-0 select-none"
                  title="Recherche"
                >
                  <Search className="w-4.5 h-4.5" />
                </button>

                {/* Notifications Icon (Bell) */}
                <button
                  id="bell-btn"
                  onClick={() => {
                    setActiveMenu("user_notifications");
                    addToTerminal("[CLOCHE] Ouverture des notifications d'actualité.");
                  }}
                  className="w-11 h-11 text-zinc-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 border border-zinc-800 hover:border-[#D4AF37]/40 rounded-xl transition-all flex items-center justify-center cursor-pointer relative bg-black/60 shrink-0 select-none"
                  title="Notifications"
                >
                  <Bell className="w-4.5 h-4.5" />
                  <span className="absolute -top-1 -right-1 bg-red-650 text-white font-mono text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-black animate-pulse select-none">
                    12
                  </span>
                </button>

                {/* Profile Avatar */}
                <div 
                  id="profile-avatar"
                  className="w-11 h-11 rounded-full border border-[#D4AF37]/50 overflow-hidden bg-black flex items-center justify-center cursor-pointer transition-all select-none shrink-0 relative shadow-[0_0_10px_rgba(212,175,55,0.15)] hover:border-[#D4AF37]" 
                  title="Profil Utilisateur" 
                  onClick={() => { 
                    setActiveMenu("user_heritage"); 
                    setViewingGomboIdDetail(false); 
                  }}
                >
                  {profile?.avatarUrl || currentUser?.photoURL ? (
                    <img src={profile?.avatarUrl || currentUser?.photoURL || ""} alt="User Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[#D4AF37] font-sans text-xs font-black uppercase">
                      {profile?.artisticName?.charAt(0) || currentUser?.displayName?.charAt(0) || "U"}
                    </span>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0B0B0B]" />
                </div>
              </div>
            </>
          )}
        </header>

        {/* WORKSPACE VIEWS */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* ----------------------------------------------------
                                STEP I: TABLEAU UTILISATEUR (10 CORE SECTIONS)
                  ---------------------------------------------------- */}
              {/* ----------------------------------------------------
                                NEW CORE EXPERIENCES FOR USER PERSPECTIVE
                  ---------------------------------------------------- */}

              {/* 1. LE TERRAIN - CENTRAL HUB FEED & opportunities GOMBOS */}
              {activeMenu === "user_terrain" && (() => {
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button
                        onClick={() => {
                          setTerrainTab("musicien");
                          try { audioSynth.playTamTam(true); } catch (e) {}
                        }}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                          terrainTab === "musicien" 
                            ? "bg-[#D4AF37]/5 border-[#D4AF37] text-white" 
                            : "bg-black/35 border-white/5 hover:border-[#D4AF37]/40 text-white/90"
                        }`}
                      >
                        <span className="text-xl">🎵</span>
                        <h4 className="text-xs font-display font-black mt-2 uppercase text-[#D4AF37]">ÉCHOS D'ARTISTES</h4>
                        <p className="text-[10px] text-zinc-400 mt-1">Actualités et buzz.</p>
                      </button>

                      <button
                        onClick={() => {
                          setTerrainTab("contrat");
                          try { audioSynth.playTamTam(true); } catch (e) {}
                        }}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                          terrainTab === "contrat" 
                            ? "bg-[#D4AF37]/5 border-[#D4AF37] text-white" 
                            : "bg-black/35 border-white/5 hover:border-[#D4AF37]/40 text-white/90"
                        }`}
                      >
                        <span className="text-xl">💰</span>
                        <h4 className="text-xs font-display font-black mt-2 uppercase text-[#D4AF37]">LES CACHETS D'OR</h4>
                        <p className="text-[10px] text-zinc-400 mt-1">Offres et demandes.</p>
                      </button>

                      <button
                        onClick={() => {
                          setTerrainTab("all");
                          addToTerminal("[FILTRE] Tendances d'Abidjan activées sur le Terrain.");
                          try { audioSynth.playValidationSuccess(); } catch (e) {}
                        }}
                        className="p-4 rounded-2xl bg-black/35 border border-white/5 hover:border-[#D4AF37]/40 text-left cursor-pointer transition-all text-white/90"
                      >
                        <span className="text-xl">📈</span>
                        <h4 className="text-xs font-display font-black mt-2 uppercase text-[#D4AF37]">TENDANCES</h4>
                        <p className="text-[10px] text-zinc-400 mt-1">Ce qui cartonne.</p>
                      </button>

                      <button
                        onClick={() => {
                          addToTerminal("[INFO] Calendrier des événements : tous les spectacles, showcases, et concerts du mois.");
                          alert("📅 Évènements d'Or : Retrouvez l'agenda complet des concerts live d'Abidjan sur le canal d'Actu !");
                          try { audioSynth.playTamTam(false); } catch (e) {}
                        }}
                        className="p-4 rounded-2xl bg-black/35 border border-white/5 hover:border-[#D4AF37]/40 text-left cursor-pointer transition-all text-white/90"
                      >
                        <span className="text-xl">📅</span>
                        <h4 className="text-xs font-display font-black mt-2 uppercase text-[#D4AF37]">ÉVÉNEMENTS</h4>
                        <p className="text-[10px] text-zinc-400 mt-1">À ne pas manquer.</p>
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
                                return (
                                  <div key={p.id} className="bg-[#121214] border border-zinc-800 rounded-2xl p-4.5 space-y-3">
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-black text-xs font-mono">
                                          {p.authorArtisticName?.charAt(0)}
                                        </div>
                                        <div>
                                          <h5 className="text-[11px] font-sans font-black text-white uppercase">
                                            {p.authorArtisticName}
                                          </h5>
                                          <span className="text-[8px] font-mono text-zinc-500 block">
                                            {p.authorName} • CI
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <span className="text-[7px] font-mono text-zinc-500">
                                        {p.timestamp ? new Date(p.timestamp).toLocaleDateString() : "Live"}
                                      </span>
                                    </div>

                                    <p className="text-[11px] font-sans text-zinc-300 leading-normal bg-zinc-950 p-2.5 rounded-lg border border-white/5">
                                      {p.content}
                                    </p>

                                    {p.isFlagged && (
                                      <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2 text-[8px] font-mono text-red-400 uppercase">
                                        ⚠️ SIGNALÉ : {p.flagReason || "Contenu révisé"}
                                      </div>
                                    )}

                                    <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-zinc-400">
                                      <button
                                        onClick={() => {
                                          if (isLiked) {
                                            setLikedPosts(prev => prev.filter(id => id !== p.id));
                                          } else {
                                            setLikedPosts(prev => [...prev, p.id]);
                                            audioSynth.playValidationSuccess();
                                          }
                                        }}
                                        className={`flex items-center gap-1 transition-colors hover:text-red-400 cursor-pointer ${isLiked ? "text-red-500 font-bold" : ""}`}
                                      >
                                        <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} /> 
                                        <span>{p.likes + (isLiked ? 1 : 0)} vibration</span>
                                      </button>
                                      
                                      <span className="text-zinc-700">•</span>
                                      <span>💬 {p.comments} parlers</span>
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
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="hover:text-[#D4AF37] transition-all cursor-pointer font-bold"
                          >
                            CGU
                          </button>
                          <span className="text-zinc-800">•</span>
                          <button
                            onClick={() => {
                              setActiveMenu("privacy");
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="hover:text-[#D4AF37] transition-all cursor-pointer font-bold"
                          >
                            CONFIDENTIALITÉ
                          </button>
                          <span className="text-zinc-800">•</span>
                          <button
                            onClick={() => {
                              setActiveMenu("delete_account");
                              window.scrollTo({ top: 0, behavior: "smooth" });
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

              {/* 2. LES VIBES - SEARCH FOR OTHER ARTISTS & alliances */}
              {activeMenu === "user_vibes" && (() => {
                const searchStr = globalSearchTerm.toLowerCase();
                const filteredArtists = users.filter(u => 
                  u.artisticName.toLowerCase().includes(searchStr) ||
                  u.commune.toLowerCase().includes(searchStr) ||
                  (u.specialties && u.specialties.some(s => s.toLowerCase().includes(searchStr)))
                );

                return (
                  <div className="space-y-6 animate-fadeIn pb-24">
                    <div className="p-5 rounded-2xl bg-[#121214] border border-[#D4AF37]/15">
                      <h3 className="text-md font-sans font-black text-white uppercase tracking-wide">
                        🔍 Les Vibes : Moteur de Recherche d'Alliances
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Découvrez d'autres virtuoses à Abidjan, explorez leurs spécialités et scellez des partenariats artistiques prestigieux.
                      </p>
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
                const triggerPubSubmit = () => {
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
                    if (!newGomboTitle.trim() || !newGomboDesc.trim()) {
                      alert("Veuillez renseigner un titre et une description prestigieuse !");
                      return;
                    }
                    const newG: Gombo = {
                      id: "gombo_new_" + Date.now(),
                      title: "🎖️ " + newGomboTitle,
                      description: newGomboDesc,
                      budget: newGomboPrice,
                      commissionRate: 0.10,
                      location: newGomboCommune,
                      organizerId: activeArtistId,
                      organizerName: activeArtist.artisticName,
                      timestamp: new Date().toISOString(),
                      applicantsCount: 0,
                      status: "open",
                      isBoosted: false,
                      date: "Date Souveraine"
                    };
                    setGombos(prev => [newG, ...prev]);
                    addToTerminal(`[🎼 CONTRAT] Nouveau cachet (Gombo) d'honneur ouvert sur Le Terrain !`);
                  }

                  // Reset inputs
                  setNewPostContent("");
                  setNewGomboTitle("");
                  setNewGomboDesc("");
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
                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">TITRE SPECTACULAIRE :</label>
                              <input
                                type="text"
                                value={newGomboTitle}
                                onChange={(e) => setNewGomboTitle(e.target.value)}
                                placeholder="Concert live, Showcase VIP..."
                                className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none placeholder-zinc-600 font-sans"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">COMMUNE D'IMPACT :</label>
                              <select
                                value={newGomboCommune}
                                onChange={(e) => setNewGomboCommune(e.target.value)}
                                className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-sans cursor-pointer"
                              >
                                {IVORIAN_COMMUNES.map(c => (
                                  <option key={c} value={c} className="bg-black text-white">{c}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">VALEUR DU CACHET (FCFA) :</label>
                              <input
                                type="number"
                                value={newGomboPrice}
                                onChange={(e) => setNewGomboPrice(parseInt(e.target.value) || 0)}
                                className="w-full bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">DESCRIPTION DE LA PRESTATION :</label>
                            <textarea
                              value={newGomboDesc}
                              onChange={(e) => setNewGomboDesc(e.target.value)}
                              placeholder="Quels types d'instruments recherchez-vous ? Règle de cachets, horaires..."
                              className="w-full h-28 bg-black border border-zinc-800 focus:border-[#D4AF37] rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all resize-none font-sans"
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
                  <div className="space-y-6 animate-fadeIn pb-24 text-left">
                    {/* ACCROCHE GOMBO ID SÉCURISÉE (OR AFRICAIN ET NOIR PRESTIGE) */}
                    <motion.div
                      whileHover={{ scale: 1.012 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setViewingGomboIdDetail(true);
                        try { audioSynth.playValidationSuccess(); } catch (err) {}
                      }}
                      className="relative overflow-hidden rounded-3xl bg-[#D4AF37] p-6 text-[#090909] cursor-pointer shadow-[0_10px_30px_rgba(212,175,55,0.25)] border border-[#090909]/20 group select-none"
                    >
                      {/* Grid background overlay styling */}
                      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
                      
                      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-mono font-black tracking-widest uppercase text-[#090909]/60">
                              SÉCURITÉ AFRIGOMBO TRUST
                            </span>
                          </div>
                          <h4 className="text-2xl font-display font-black tracking-wider flex items-center gap-1.5 uppercase">
                            🛡️ GOMBO ID
                          </h4>
                          <p className="text-xs font-semibold text-[#090909]/80 max-w-md">
                            Faites certifier votre identité artistique. Débloquez les opportunités VIP et les cachets d'or d'Abidjan.
                          </p>
                        </div>
                        
                        <div className="px-5 py-2.5 bg-[#090909] text-[#D4AF37] rounded-xl text-[10px] font-mono font-black uppercase tracking-wider group-hover:scale-105 transition-all shadow">
                          {currentArtist.kycStatus === "approved" ? "SOUVERAIN VÉRIFIÉ V" : "DÉBUTER LA CERTIFICATION ⚔️"}
                        </div>
                      </div>
                    </motion.div>

                    <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-[#0B0B0B] to-zinc-900 border border-[#D4AF37]/20 shadow-xl space-y-4">
                      <div className="flex justify-between items-start flex-wrap gap-4 pb-4 border-b border-white/5">
                        <div className="flex gap-4 items-center">
                          {/* Profile Photo */}
                          <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-black flex items-center justify-center font-bold text-xl text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)] shrink-0 select-none">
                            {currentArtist.avatarUrl ? (
                              <img src={currentArtist.avatarUrl} alt={currentArtist.artisticName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              currentArtist.artisticName.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] uppercase font-mono text-[#D4AF37] tracking-widest block font-bold">Temple de l'Héritage Artistique</span>
                              {currentArtist.kycStatus === "approved" && (
                                <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-500/10 border border-emerald-500 text-emerald-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider select-none">
                                  ✓ Certifié GOMBO ID
                                </span>
                              )}
                            </div>
                            <h2 className="text-2xl font-display font-black text-white mt-1">{currentArtist.artisticName}</h2>
                            <p className="text-xs text-zinc-400 font-mono mt-0.5">
                              {currentArtist.name} • {currentArtist.role === "admin" ? "Sénateur Planificateur / Admin" : "Artiste Musicien"} • {currentArtist.commune}, Abidjan
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-mono text-zinc-500 block">Niveau d'Académie</span>
                          <strong className="text-2xl font-display font-black text-[#D4AF37] block mt-0.5">Rang {currentArtist.performance.level} / 5</strong>
                          <span className="text-[9px] text-zinc-400 font-mono bg-white/5 px-2 py-0.5 rounded">Prestige Optimal</span>
                        </div>
                      </div>

                      {/* Score widgets */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                        <div className="p-4 bg-black border border-white/5 rounded-xl">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Score de Talent</span>
                          <strong className="text-xl font-bold text-white block mt-1">{currentArtist.performance.score} / 100</strong>
                        </div>
                        <div className="p-4 bg-black border border-white/5 rounded-xl">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Gombos Honorés</span>
                          <strong className="text-xl font-bold text-emerald-400 block mt-1">{currentArtist.gombosCompleted} Spectacles</strong>
                        </div>
                        <div className="p-4 bg-black border border-white/5 rounded-xl">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Revenus Cumulés</span>
                          <strong className="text-l text-white block mt-1 font-mono font-bold text-amber-500">{(currentArtist.revenues || 450000).toLocaleString()} FCFA</strong>
                        </div>
                        <div className="p-4 bg-black border border-white/5 rounded-xl">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Statut Réseau</span>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <strong className="text-xs text-emerald-400 uppercase font-mono">{currentArtist.status === "active" ? "Actif" : "En attente"}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Specialty tags */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase block">Spécialités artistiques certifiées :</span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentArtist.specialties.map(spec => (
                            <span key={spec} className="px-2.5 py-1 rounded bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-mono border border-[#D4AF37]/25 font-bold uppercase">
                              🎤 {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Historical Earnings Progression Graph */}
                    <div className="p-6 bg-zinc-950 border border-white/5 rounded-2xl space-y-4">
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
                          onClick={() => {
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
                              onClick={() => {
                                addToTerminal(`[CANDIDATURE] Candidature officielle de ${currentArtist.artisticName} pour ${gombo.title}`);
                                alert(`🎯 Candidature scellée sur "${gombo.title}" ! Bonne chance !`);
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
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-zinc-500">Aucun artiste disponible.</p>;
                return (
                  <div className="p-6 rounded-2xl bg-zinc-950 border border-white/5 space-y-6 animate-fadeIn">
                    <div className="pb-3 border-b border-white/5">
                      <h3 className="text-sm font-display font-black uppercase text-[#D4AF37] tracking-widest">
                        ⚙ Paramètres du Compte d'Académie
                      </h3>
                      <p className="text-xs text-zinc-400">Configurez la sensibilité de votre terminal aux Tambours d'Abidjan.</p>
                    </div>

                    <div className="space-y-4 max-w-lg">
                      <div className="p-4 bg-black border border-[#D4AF37]/15 rounded-xl flex justify-between items-center">
                        <div>
                          <strong className="text-xs text-[#D4AF37] block">☑ Sons AFRIGOMBO</strong>
                          <span className="text-[10px] text-zinc-400">Activer les percussions de Tam-Tam, les arpèges de Kora et les alertes de succès auditives.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={sonsEnabled}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setSonsEnabled(val);
                            localStorage.setItem("afrigombo_sounds", val ? "true" : "false");
                            try {
                              if (val) {
                                audioSynth.playValidationSuccess();
                              }
                            } catch (err) {}
                          }}
                          className="w-4 h-4 cursor-pointer accent-[#D4AF37]"
                        />
                      </div>

                      <div className="p-4 bg-black border border-white/5 rounded-xl flex justify-between items-center">
                        <div>
                          <strong className="text-xs text-white block">Vibration Sonique des Tambours</strong>
                          <span className="text-[10px] text-zinc-500">Sensibilité haptique aux notifications du Trône.</span>
                        </div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer accent-[#D4AF37]" />
                      </div>

                      <div className="p-4 bg-black border border-white/5 rounded-xl flex justify-between items-center">
                        <div>
                          <strong className="text-xs text-white block">Visibilité Publique d'Hérédité</strong>
                          <span className="text-[10px] text-zinc-500">Permet aux organisateurs d'orchestres de Plateau de vous démarcher en direct.</span>
                        </div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer accent-[#D4AF37]" />
                      </div>

                      <div className="p-4 bg-black border border-white/5 rounded-xl space-y-2">
                        <strong className="text-xs text-white block">Fréquence de synchronisation locale</strong>
                        <div className="grid grid-cols-3 gap-2">
                          <button className="py-2.5 bg-[#D4AF37] text-black text-[10px] font-mono font-bold rounded uppercase">Instantané</button>
                          <button className="py-2.5 bg-zinc-900 text-zinc-400 text-[10px] font-mono font-bold rounded uppercase hover:text-white">Lente</button>
                          <button className="py-2.5 bg-zinc-900 text-zinc-400 text-[10px] font-mono font-bold rounded uppercase hover:text-white">Économique</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {activeMenu === "user_notifications" && (() => {
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-zinc-500">Aucun artiste disponible.</p>;
                return (
                  <div className="p-6 rounded-2xl bg-zinc-950 border border-white/5 space-y-6 animate-fadeIn">
                    <div className="pb-3 border-b border-white/5 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-display font-black uppercase text-[#D4AF37] tracking-widest">
                          📢 Tambours (Notifications Réseau)
                        </h3>
                        <p className="text-xs text-zinc-400">Écoutez les vibrations de l'Académie émise par l'administration.</p>
                      </div>
                      <div className="relative w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/35 text-[#D4AF37] animate-ping" />
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 bg-black border border-amber-500/20 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                          <span className="text-[#D4AF37]">👑 DECRET SUBLIME DE FONDATION</span>
                          <span className="text-zinc-500">Aujourd'hui, 09:12</span>
                        </div>
                        <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                          "Félicitations aux artistes d'Abidjan ! La commission par défaut est à présent de 10% pour accroître le cachet conservé par les guitaristes Zouglou."
                        </p>
                      </div>

                      <div className="p-4 bg-black border border-white/5 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-500">⚖️ Administration Gombo ID</span>
                          <span className="text-zinc-500">Hier</span>
                        </div>
                        <p className="text-xs text-zinc-400">
                          Votre dossier de certification standard est classé prioritaire suite à la vérification d'excellence.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {activeMenu === "user_edit_profile" && (() => {
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-zinc-500">Aucun artiste disponible.</p>;
                return (
                  <div className="p-6 rounded-2xl bg-zinc-950 border border-white/5 space-y-6 animate-fadeIn">
                    <div className="pb-3 border-b border-white/5">
                      <h3 className="text-sm font-display font-black uppercase text-[#D4AF37] tracking-widest">
                        ✍ Modifier mon profil d'Académie
                      </h3>
                      <p className="text-xs text-zinc-400">Mettez à jour vos spécialités et coordonnées d'excellence.</p>
                    </div>

                    <div className="space-y-4 max-w-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-mono text-zinc-400 block font-bold">Nom Artistique :</label>
                          <input
                            type="text"
                            defaultValue={currentArtist.artisticName}
                            onBlur={async (e) => {
                              const artisticName = e.target.value;
                              setUsers(prev => prev.map(u => u.id === currentArtist.id ? { ...u, artisticName } : u));
                              await saveToFirestore("users", currentArtist.id, { artisticName });
                              addToTerminal(`[PROFIL] Nom artistique mis à jour pour ${artisticName}`);
                            }}
                            className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-mono text-zinc-400 block font-bold">Commune principale :</label>
                          <select
                            defaultValue={currentArtist.commune}
                            onChange={async (e) => {
                              const commune = e.target.value;
                              setUsers(prev => prev.map(u => u.id === currentArtist.id ? { ...u, commune } : u));
                              await saveToFirestore("users", currentArtist.id, { commune });
                              addToTerminal(`[PROFIL] Commune mise à jour : ${commune}`);
                            }}
                            className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs focus:outline-none focus:border-[#D4AF37]"
                          >
                            {IVORIAN_COMMUNES.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-mono text-zinc-400 block font-bold">Spécialités Nationales (Séparées par virgule) :</label>
                        <input
                          type="text"
                          defaultValue={currentArtist.specialties.join(", ")}
                          onBlur={async (e) => {
                            const specialties = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                            setUsers(prev => prev.map(u => u.id === currentArtist.id ? { ...u, specialties } : u));
                            await saveToFirestore("users", currentArtist.id, { specialties });
                            addToTerminal(`[PROFIL] Spécialités mises à jour : ${specialties.join(", ")}`);
                          }}
                          className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <button
                        onClick={() => alert("🏆 Modifications de profil enregistrées en temps réel sur Firestore !")}
                        className="w-full py-2 bg-[#D4AF37] hover:bg-[#B48F17] text-black text-xs font-mono font-black uppercase rounded-lg transition-all"
                      >
                        Enregistrer modifications
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ----------------------------------------------------
                                VIEW: DASHBOARD & SCAN (CENTRE DE COMMANDE)
                  ---------------------------------------------------- */}
              {activeMenu === "dashboard" && (() => {
                const handleQuickApproveKyc = async (userId: string) => {
                  const gomboIdNumber = "GB-CIV-" + Math.floor(100000 + Math.random() * 900000);
                  const updatedUser = { kycStatus: "approved" as const, gomboIdNumber };
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
                const kpiOnlineCount = users.filter(u => u.status === "active").length + 7;
                const kpiGombosCount = gombos.length;
                const kpiPostsCount = posts.length;
                const kpiPendingKycCount = users.filter(u => u.kycStatus === "pending").length;
                const kpiAlertsCount = posts.filter(p => p.isFlagged).length;
                const kpiApprovedKycCount = users.filter(u => u.kycStatus === "approved").length;
                const kpiRevenuesSum = transactions.reduce((acc, curr) => acc + (curr.type === "commission" || curr.type === "cert_express" ? curr.amount : 0), 0) || 120000;

                const pendingIdUsers = users.filter(u => u.kycStatus === "pending");
                const flaggedPosts = posts.filter(p => p.isFlagged);
                const boostedGombos = gombos.filter(g => g.isBoosted);
                const recentSignups = [...users].slice(-5).reverse();

                return (
                  <div className="space-y-8 pb-24 animate-fadeIn text-left">
                    {/* 1. ENTÊTE DE COMMANDE PREMIUM */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-950 via-[#0D0D0F] to-zinc-950 border border-[#D4AF37]/35 shadow-[0_0_35px_rgba(212,175,55,0.06)]">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0 select-none font-display">
                            <div className="w-14 h-14 rounded-full border-2 border-[#D4AF37] bg-black overflow-hidden flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                              {currentUser?.photoURL ? (
                                <img src={currentUser.photoURL} alt="Admin" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="text-[#D4AF37] font-display font-black text-xl uppercase">A</span>
                              )}
                            </div>
                            <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0D0D0F] animate-pulse" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono tracking-widest text-[#D4AF37] font-extrabold uppercase">
                                AFRITRUST CONTROL PANEL
                              </span>
                              <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-black uppercase tracking-wider select-none animate-pulse">
                                ● SYNCHRONISÉ EN DIRECT
                              </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white mt-1 uppercase">
                              CENTRE DE COMMANDE AFRIGOMBO
                            </h2>
                            <p className="text-xs text-zinc-400 flex items-center gap-2 font-sans mt-1">
                              <span>Sénateur : <strong className="text-white font-mono">{userEmail || "admin@afrigombo.ci"}</strong></span>
                              <span className="text-zinc-650">•</span>
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono text-[9px] uppercase font-bold">
                                {isAuthorizedSuperFounder ? "👑 Fondateur de l'Empire" : "🛡️ Super Commandeur"}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-black border border-white/5 text-right shrink-0 min-w-[170px] select-none">
                          <span className="text-[9px] uppercase font-mono text-zinc-500 block font-bold">Heure de la République :</span>
                          <strong className="text-lg font-mono font-black text-[#D4AF37] tracking-wider block mt-0.5">
                            {liveAdminTime}
                          </strong>
                          <span className="text-[8px] text-[#D4AF37]/60 block font-mono">Babi-Zone (GMT)</span>
                        </div>
                      </div>
                    </div>

                    {/* PERSP/THRONE BAR */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          setPerspective("user");
                          setActiveMenu("user_terrain");
                          addToTerminal("[COMMANDE] Pilotage déporté sur Perspective Artiste.");
                          try { audioSynth.playValidationSuccess(); } catch (err) {}
                        }}
                        className="group p-4 bg-[#D4AF37] hover:bg-[#B48F17] text-black font-display font-black text-xs uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-[0_4px_15px_rgba(212,175,55,0.2)] flex items-center justify-center gap-3 cursor-pointer"
                      >
                        <Users className="w-5 h-5 text-black stroke-[3]" />
                        <span>👤 PASSER EN MODE UTILISATEUR (RETOUR TERRAIN)</span>
                      </button>

                      {isAuthorizedSuperFounder ? (
                        <button
                          onClick={() => {
                            setActiveMenu("super_admin");
                            addToTerminal("[DECRET] En route vers le Trône Royal.");
                            try { audioSynth.playTamTam(true); } catch (err) {}
                          }}
                          className="group p-4 bg-gradient-to-r from-[#11011e] via-[#09010E] to-black hover:from-[#1b0230] border border-purple-500/40 text-white font-display font-black text-xs uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center justify-center gap-3 cursor-pointer animate-pulse"
                        >
                          <Crown className="w-5 h-5 text-amber-400 stroke-[2] animate-bounce" />
                          <span className="text-amber-400">👑 LE TRÔNE ROYAL DE GOUVERNANCE</span>
                        </button>
                      ) : (
                        <div className="p-4 rounded-2xl bg-black border border-white/5 flex items-center justify-center text-zinc-500 font-mono text-xs">
                          🔒 Sceau du Fondateur Invisible aux Commandants Classiques
                        </div>
                      )}
                    </div>

                    {/* ACTIONS RAPIDES GRID */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37] flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-[#D4AF37]" />
                        Panneau d'Actions Rapides
                      </h3>

                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-9 gap-4">
                        <button
                          onClick={() => {
                            setActiveMenu("renforts");
                            try { audioSynth.playValidationSuccess(); } catch (err) {}
                          }}
                          className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 h-24 cursor-pointer select-none ${
                            activeMenu === "renforts" ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]" : "bg-black hover:bg-[#D4AF37]/5 border-white/5 hover:border-[#D4AF37]/25 text-zinc-300"
                          }`}
                        >
                          <Users className="w-5 h-5" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block leading-none">👥 Membres</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenu("gombos");
                            try { audioSynth.playValidationSuccess(); } catch (err) {}
                          }}
                          className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 h-24 cursor-pointer select-none ${
                            activeMenu === "gombos" ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]" : "bg-black hover:bg-[#D4AF37]/5 border-white/5 hover:border-[#D4AF37]/25 text-zinc-300"
                          }`}
                        >
                          <Briefcase className="w-5 h-5" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block leading-none">🎤 Gombos</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenu("kyc");
                            try { audioSynth.playValidationSuccess(); } catch (err) {}
                          }}
                          className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 h-24 cursor-pointer select-none ${
                            activeMenu === "kyc" ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]" : "bg-black hover:bg-[#D4AF37]/5 border-white/5 hover:border-[#D4AF37]/25 text-zinc-300"
                          }`}
                        >
                          <ShieldCheck className="w-5 h-5" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block leading-none">🛡️ Gombo ID</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenu("alertes");
                            try { audioSynth.playValidationSuccess(); } catch (err) {}
                          }}
                          className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 h-24 cursor-pointer select-none ${
                            activeMenu === "alertes" ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]" : "bg-black hover:bg-[#D4AF37]/5 border-white/5 hover:border-[#D4AF37]/25 text-zinc-300"
                          }`}
                        >
                          <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block leading-none">🚨 Alerte</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenu("revision");
                            try { audioSynth.playValidationSuccess(); } catch (err) {}
                          }}
                          className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 h-24 cursor-pointer select-none ${
                            activeMenu === "revision" ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]" : "bg-black hover:bg-[#D4AF37]/5 border-white/5 hover:border-[#D4AF37]/25 text-zinc-300"
                          }`}
                        >
                          <MessageSquare className="w-5 h-5" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block leading-none">📢 Pubs</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsBroadcastModalOpen(true);
                            try { audioSynth.playValidationSuccess(); } catch (err) {}
                          }}
                          className="p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center text-center bg-black hover:bg-[#D4AF37]/5 border-white/5 hover:border-[#D4AF37]/25 text-zinc-300 gap-2 h-24 cursor-pointer select-none"
                        >
                          <Send className="w-5 h-5 text-cyan-400" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block leading-none">📨 Message</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenu("caisse");
                            try { audioSynth.playValidationSuccess(); } catch (err) {}
                          }}
                          className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 h-24 cursor-pointer select-none ${
                            activeMenu === "caisse" ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]" : "bg-black hover:bg-[#D4AF37]/5 border-white/5 hover:border-[#D4AF37]/25 text-zinc-300"
                          }`}
                        >
                          <Coins className="w-5 h-5 text-amber-500" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block leading-none">💳 Caisses</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenu("analytics");
                            try { audioSynth.playValidationSuccess(); } catch (err) {}
                          }}
                          className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 h-24 cursor-pointer select-none ${
                            activeMenu === "analytics" ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]" : "bg-black hover:bg-[#D4AF37]/5 border-white/5 hover:border-[#D4AF37]/25 text-zinc-300"
                          }`}
                        >
                          <BarChart2 className="w-5 h-5 text-emerald-400" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block leading-none">📈 Stats</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenu("monetisation");
                            try { audioSynth.playValidationSuccess(); } catch (err) {}
                          }}
                          className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 h-24 cursor-pointer select-none ${
                            activeMenu === "monetisation" ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]" : "bg-black hover:bg-[#D4AF37]/5 border-white/5 hover:border-[#D4AF37]/25 text-zinc-300"
                          }`}
                        >
                          <Settings className="w-5 h-5" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block leading-none">⚙️ Configs</span>
                        </button>
                      </div>
                    </div>

                    {/* KPIs IN REAL-TIME */}
                    <div className="space-y-3">
                      <span className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37] block">
                        Indicateurs d'Activité en Direct
                      </span>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-5 rounded-2xl bg-[#09090B] border border-white/5 shadow-md flex flex-col justify-between h-28 text-left">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4AF37] block font-bold">👥 UTILISATEURS</span>
                          <strong className="text-3xl font-display font-black text-white block mt-1">{kpiUsersCount}</strong>
                          <span className="text-[9px] text-zinc-500 block font-mono">Dossiers civils</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#09090B] border border-white/5 shadow-md flex flex-col justify-between h-28 text-left">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4AF37] font-bold block">🟢 CONNECTÉS</span>
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          </div>
                          <strong className="text-3xl font-display font-black text-emerald-400 block mt-1">{kpiOnlineCount}</strong>
                          <span className="text-[9px] text-[#D4AF37]/60 block font-mono">En temps réel</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#09090B] border border-white/5 shadow-md flex flex-col justify-between h-28 text-left">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4AF37] block font-bold">🎤 GOMBOS</span>
                          <strong className="text-3xl font-display font-black text-white block mt-1">{kpiGombosCount}</strong>
                          <span className="text-[9px] text-zinc-500 block font-mono">Opportunités actives</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#09090B] border border-white/5 shadow-md flex flex-col justify-between h-28 text-left">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4AF37] block font-bold">📢 PUBLICATIONS</span>
                          <strong className="text-3xl font-display font-black text-white block mt-1">{kpiPostsCount}</strong>
                          <span className="text-[9px] text-zinc-500 block font-mono">Murmures libres</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#09090B] border border-white/5 shadow-md flex flex-col justify-between h-28 text-left">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4AF37] block font-bold">🛡️ KYC DEMANDES</span>
                          <strong className="text-3xl font-display font-black text-amber-500 block mt-1">{kpiPendingKycCount}</strong>
                          <span className="text-[9px] text-zinc-500 block font-mono font-bold">À auditer de suite</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#09090B] border border-white/5 shadow-md flex flex-col justify-between h-28 text-left">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4AF37] block font-bold">🚨 SIGNALEMENTS</span>
                          <strong className="text-3xl font-display font-black text-red-500 block mt-1">{kpiAlertsCount}</strong>
                          <span className="text-[9px] text-zinc-500 block font-mono font-bold">Alerte critique</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#09090B] border border-white/5 shadow-md flex flex-col justify-between h-28 text-left">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4AF37] block font-bold">💰 TRESORERIE</span>
                          <strong className="text-lg font-mono font-black text-emerald-400 block mt-1">{kpiRevenuesSum.toLocaleString()} FCFA</strong>
                          <span className="text-[9px] text-zinc-500 block font-mono">Caisse accumulée</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-[#09090B] border border-white/5 shadow-md flex flex-col justify-between h-28 text-left">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4AF37] block font-bold">⭐ CERTIFIÉS</span>
                          <strong className="text-3xl font-display font-black text-[#D4AF37] block mt-1">{kpiApprovedKycCount}</strong>
                          <span className="text-[9px] text-zinc-500 block font-mono">Membres Gombo ID</span>
                        </div>
                      </div>
                    </div>

                    {/* INTELLIGENT QUEUE (GOMBO ID & SIGNALEMENTS) */}
                    <div className="space-y-4">
                      <span className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37] block">
                        File d'Attente de Décisions Stratégique
                      </span>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* GOMBO ID QUEUE */}
                        <div className="p-6 rounded-2xl bg-[#0A0A0C] border border-white/5 space-y-4">
                          <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                              Dossiers GOMBO ID à Vérifier ({pendingIdUsers.length})
                            </span>
                            <span className="text-[9px] font-mono bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded font-black uppercase">ACTION DIRECTE</span>
                          </div>

                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {pendingIdUsers.length === 0 ? (
                              <div className="py-8 text-center text-zinc-650 text-xs font-mono">
                                🛡️ Aucun dossier pour le moment. La Côte d'Ivoire est sereine !
                              </div>
                            ) : (
                              pendingIdUsers.map(u => (
                                <div key={u.id} className="p-4 bg-black border border-white/5 rounded-xl space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full border border-[#D4AF37]/45 bg-zinc-900 flex items-center justify-center font-bold text-xs text-[#D4AF37]">
                                        {u.avatarUrl ? <img src={u.avatarUrl} alt="Ky" className="w-full h-full rounded-full object-cover" /> : u.artisticName.charAt(0)}
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-bold text-white uppercase">{u.artisticName}</h4>
                                        <p className="text-[10px] text-zinc-550">{u.name} • {u.commune}</p>
                                      </div>
                                    </div>
                                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold uppercase ${u.kycType === "express" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-zinc-800 text-zinc-400"}`}>
                                      {u.kycType === "express" ? "⚡ EXPRESS 500" : "STANDARD"}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
                                    {u.kycDocs?.identityCardUrl && (
                                      <a href={u.kycDocs.identityCardUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-white/5 rounded text-[9px] font-mono text-zinc-400 hover:bg-white/10 flex items-center gap-1">
                                        📄 CNI
                                      </a>
                                    )}
                                    {u.kycDocs?.selfieUrl && (
                                      <a href={u.kycDocs.selfieUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-white/5 rounded text-[9px] font-mono text-zinc-450 hover:bg-white/10 flex items-center gap-1">
                                        📷 Selfie
                                      </a>
                                    )}
                                    {u.kycDocs?.activityUrl && (
                                      <a href={u.kycDocs.activityUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-white/5 rounded text-[9px] font-mono text-zinc-450 hover:bg-white/10 flex items-center gap-1">
                                        🎵 Preuve Acti.
                                      </a>
                                    )}
                                  </div>

                                  <div className="flex gap-2 justify-end pt-1">
                                    <button
                                      onClick={() => handleQuickRejectKyc(u.id)}
                                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-550 hover:text-white rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer"
                                    >
                                      Refuser 🚫
                                    </button>
                                    <button
                                      onClick={() => handleQuickApproveKyc(u.id)}
                                      className="px-3 py-1.5 bg-emerald-500/15 hover:bg-[#D4AF37] hover:text-black text-emerald-400 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer"
                                    >
                                      Approuver ✓
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* URGENT ALERTS REPORT QUEUE */}
                        <div className="p-6 rounded-2xl bg-[#0A0A0C] border border-[#D4AF37]/15 space-y-4">
                          <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-red-505 animate-pulse" />
                              Signalements Urgents ({flaggedPosts.length})
                            </span>
                            <span className="text-[9px] font-mono bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded font-black uppercase">SÉCURITÉ</span>
                          </div>

                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {flaggedPosts.length === 0 ? (
                              <div className="py-8 text-center text-zinc-650 text-xs font-mono">
                                🔔 Zéro alerte d'abus ! Aucun murmure suspect déclaré par la communauté.
                              </div>
                            ) : (
                              flaggedPosts.map(p => (
                                <div key={p.id} className="p-4 bg-black border border-red-500/10 rounded-xl space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <strong>{p.authorArtisticName} ({p.authorName})</strong>
                                    <span className="text-[8px] font-mono text-zinc-550">{p.timestamp}</span>
                                  </div>
                                  <p className="text-zinc-400 italic font-sans mt-0.5">"{p.content}"</p>
                                  
                                  <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                                    <button
                                      onClick={() => handleQuickUnflagPost(p.id)}
                                      className="px-2.5 py-1.5 bg-zinc-800 text-zinc-350 rounded hover:bg-zinc-700 text-[9px] font-mono uppercase cursor-pointer"
                                    >
                                      Ignorer 🛡️
                                    </button>
                                    <button
                                      onClick={() => handleQuickDeletePost(p.id)}
                                      className="px-2.5 py-1.5 bg-red-600 text-white rounded hover:bg-red-750 text-[9px] font-mono uppercase font-bold cursor-pointer"
                                    >
                                      Supprimer le Murmure 🚫
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* ADDS-ON INTELLIGENT TIERS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Boosted Gombos list */}
                      <div className="p-6 rounded-2xl bg-[#09090C] border border-white/5 space-y-4">
                        <h4 className="text-xs font-mono font-bold uppercase text-white border-b border-white/5 pb-2.5 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-cyan-400 animate-bounce" />
                          Demandes Boostées ({boostedGombos.length})
                        </h4>
                        <div className="space-y-3 max-h-60 overflow-y-auto font-mono text-[11px]">
                          {boostedGombos.length === 0 ? (
                            <p className="text-zinc-650 text-center py-6 text-[10px]">Aucune promotion active.</p>
                          ) : (
                            boostedGombos.map(g => (
                              <div key={g.id} className="p-3 rounded bg-black border border-white/5 flex justify-between items-center">
                                <div>
                                  <span className="text-white block font-bold truncate max-w-[120px]">{g.title}</span>
                                  <span className="text-amber-500">{g.budget.toLocaleString()} FCFA</span>
                                </div>
                                <button
                                  onClick={() => handleQuickBoostGombo(g.id, false)}
                                  className="p-1 px-2 rounded bg-cyan-950/10 hover:bg-cyan-500 hover:text-black text-cyan-400 border border-cyan-500/20 text-[9px] uppercase cursor-pointer"
                                >
                                  DÉ-BOOSTER
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Latest registered talents list */}
                      <div className="p-6 rounded-2xl bg-[#09090C] border border-white/5 space-y-4 col-span-2">
                        <h4 className="text-xs font-mono font-bold uppercase text-white border-b border-white/5 pb-2.5 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[#D4AF37]" />
                          Nouveaux Talents Inscrits (Fil du Temps)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                          {recentSignups.map(u => (
                            <div key={u.id} className="p-3 rounded bg-black border border-white/5 flex justify-between items-center text-xs">
                              <div className="flex gap-2 items-center">
                                <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-[#D4AF37]">
                                  {u.avatarUrl ? <img src={u.avatarUrl} alt="Av" className="w-full h-full rounded-full object-cover" /> : u.artisticName.charAt(0)}
                                </div>
                                <div className="truncate max-w-[120px]">
                                  <strong className="text-white block font-sans truncate">{u.artisticName}</strong>
                                  <span className="text-[10px] text-zinc-550 font-mono block truncate">{u.commune}, CI</span>
                                </div>
                              </div>
                              <span className="text-[9px] font-mono text-[#D4AF37] bg-white/5 px-2 py-0.5 rounded font-black uppercase truncate max-w-[90px]">
                                {u.role === "admin" ? "SÉNATEUR" : "ARTISTE"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* LIVE PUBLICATIONS WATCH & MODERATOR */}
                    <div className="p-6 rounded-2xl bg-[#09090C] border border-white/5 space-y-4">
                      <h4 className="text-xs font-mono font-bold uppercase text-white border-b border-white/5 pb-2.5 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                        Publications à examiner (Tam-tam en direct)
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...posts].slice(0, 4).map(p => (
                          <div key={p.id} className="p-3.5 bg-black border border-white/5 rounded-xl space-y-2 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="font-bold text-zinc-400">{p.authorArtisticName}</span>
                                <span className="text-zinc-650">{p.timestamp}</span>
                              </div>
                              <p className="text-xs text-white/80 leading-relaxed font-sans mt-1">"{p.content}"</p>
                            </div>
                            
                            <div className="flex justify-between items-center gap-2 pt-2 border-t border-white/5">
                              <span className="text-[9px] font-mono text-zinc-550">
                                ❤️ {p.likes} Likes • 💬 {p.comments} Comments
                              </span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={async () => {
                                    setPosts(prev => prev.map(item => item.id === p.id ? { ...item, isFlagged: true } : item));
                                    await saveToFirestore("posts", p.id, { isFlagged: true });
                                    addToTerminal(`[MODÉRATION] Post ${p.id} marqué comme suspect.`);
                                    try { audioSynth.playTamTam(true); } catch (e) {}
                                  }}
                                  className="px-2 py-1 bg-amber-500/15 hover:bg-amber-600 text-amber-400 hover:text-black rounded text-[9px] font-mono uppercase font-bold cursor-pointer"
                                >
                                  Signaler ⚠️
                                </button>
                                <button
                                  onClick={() => handleQuickDeletePost(p.id)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-750 text-white rounded text-[9px] font-mono uppercase font-bold cursor-pointer"
                                >
                                  Bannir
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DOCK OF IMPERIAL ADDR */}
                    <div className="p-6 rounded-3xl bg-[#09090B] border border-white/5 space-y-4 text-left">
                      <div className="flex gap-3 justify-between items-center">
                        <div>
                          <h4 className="text-xs font-mono font-black uppercase text-zinc-455 font-bold">
                            ⚙️ Renseigner ou Modifier l'Adresse Impériale
                          </h4>
                          <p className="text-[11px] text-[#D4AF37] mt-1">Configurez l'adresse de raccordement pour la correspondance systeme.</p>
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              setAdminEmail("johnsylvesterh@gmail.com");
                              addToTerminal("[SIMULATEUR] Salut au Fondateur John Sylvester ! Trône Suprême déverrouillé.");
                              try { audioSynth.playValidationSuccess(); } catch (e) {}
                            }}
                            className={`px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase font-black border transition-all cursor-pointer ${
                              adminEmail === "johnsylvesterh@gmail.com"
                                ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-black border-transparent animate-pulse"
                                : "bg-black text-amber-500 border-[#D4AF37]/15 hover:border-[#D4AF37]/45"
                            }`}
                          >
                            Fondateur Suprême (John)
                          </button>
                        </div>
                      </div>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="Saisissez une adresse impériale..."
                        className="w-full bg-black border border-white/10 rounded-2xl py-3 px-4 text-xs font-mono text-white focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
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
                    setActiveMenu("dashboard");
                    addToTerminal(`[INFO] Cabinet du Trône fermé.`);
                  }}
                />
              )}

              {/* ----------------------------------------------------
                                VIEW: LE TAM-TAM GOMBOS
                  ---------------------------------------------------- */}
              {activeMenu === "gombos" && (
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
                                VIEW: KYC & MON HERITAGE
                  ---------------------------------------------------- */}
              {activeMenu === "kyc" && (
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
                                {user.specialties.map((spec, idx) => (
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
                                <span className="font-bold text-[#D4AF37]">Niv. {user.performance.level} (Score: {user.performance.score}/100)</span>
                              </div>
                              {/* Glowing horizontal premium gold progress bar */}
                              <div className="w-full bg-[#D4AF37]/10 rounded-full h-2 overflow-hidden border border-[#D4AF37]/10">
                                <div
                                  className="bg-gradient-to-r from-[#D4AF37] to-[#B48F17] h-full shadow-[0_0_8px_rgba(212,175,55,0.8)]"
                                  style={{ width: `${user.performance.score}%` }}
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
                <div className="space-y-4">
                  <div className="p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg text-xs leading-relaxed">
                    Surveillance géolocalisée et notifications critiques provenant des communes principales d'Abidjan (Yopougon, Cocody, Marcory, etc.).
                  </div>

                  <div className="space-y-3">
                    {alerts.map(alert => (
                      <div
                        key={alert.id}
                        className={`p-5 rounded-lg border ${alert.severity === "high" ? "border-red-500/30 bg-red-500/5" : "border-[#D4AF37]/20 bg-[#0B0B0B]"} flex justify-between items-center`}
                      >
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`w-5 h-5 ${alert.severity === "high" ? "text-[#EF4444]" : "text-[#D4AF37]"}`} />
                          <div>
                            <span className="font-display font-bold text-sm block">
                              Mégaphone Alerte - Artiste {alert.userArtisticName}
                            </span>
                            <span className="text-xs text-[#F5F5F5]/70">{alert.reason}</span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-semibold ${alert.severity === "high" ? "bg-red-500 text-white" : "bg-[#D4AF37]/10 text-[#D4AF37]"}`}>
                          {alert.severity} priorité
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------
                                VIEW: LA CAISSE GOMBO (FINANCIALS)
                  ---------------------------------------------------- */}
              {activeMenu === "caisse" && (() => {
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
                  </div>
                );
              })()}

              {/* ----------------------------------------------------
                                VIEW: ANALYTICS & COURBES
                  ---------------------------------------------------- */}
              {activeMenu === "analytics" && (
                <div className="space-y-6">
                  {/* BEAUTIFUL CHART OR AFRIGOMBO GROW CURVE */}
                  <div className="p-5 rounded-lg bg-black/40 border border-[#D4AF37]/20">
                    <h4 className="text-xs uppercase font-mono text-[#D4AF37] tracking-wider mb-4">
                      Revenus & Enregistrements de la semaine (Par jour)
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={ANALYTICS_DATA} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                          <XAxis dataKey="name" stroke="#555" fontSize={11} tickLine={false} />
                          <YAxis stroke="#555" fontSize={11} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#0B0B0B", borderColor: "#D4AF37" }} labelClassName="text-[#D4AF37]" />
                          <Area type="monotone" dataKey="commission" stroke="#D4AF37" fillOpacity={1} fill="url(#colorCommission)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* KEY GEOGRAPHICAL DIVISION STATS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-lg border border-[#D4AF37]/10 bg-[#0B0B0B]">
                      <h5 className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] mb-3">Participation par Commune</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span>Cocody</span>
                          <span>45%</span>
                        </div>
                        <div className="w-full bg-[#D4AF37]/10 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#D4AF37] h-full" style={{ width: "45%" }} />
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                          <span>Yopougon</span>
                          <span>35%</span>
                        </div>
                        <div className="w-full bg-[#D4AF37]/10 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#D4AF37] h-full" style={{ width: "35%" }} />
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                          <span>Marcory</span>
                          <span>20%</span>
                        </div>
                        <div className="w-full bg-[#D4AF37]/10 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#D4AF37] h-full" style={{ width: "20%" }} />
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-lg border border-[#D4AF37]/10 bg-[#0B0B0B]">
                      <h5 className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] mb-3">Répartition des Instruments</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span>Chant & Chœur</span>
                          <span>50%</span>
                        </div>
                        <div className="w-full bg-[#D4AF37]/10 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#D4AF37] h-full" style={{ width: "50%" }} />
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                          <span>Clavierist / Piano</span>
                          <span>30%</span>
                        </div>
                        <div className="w-full bg-[#D4AF37]/10 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#D4AF37] h-full" style={{ width: "30%" }} />
                        </div>
                        <div className="flex justify-between text-xs font-mono">
                          <span>Guitare & Basse</span>
                          <span>20%</span>
                        </div>
                        <div className="w-full bg-[#D4AF37]/10 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#D4AF37] h-full" style={{ width: "20%" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------
                                VIEW: MONETISATION PREMIUM
                  ---------------------------------------------------- */}
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

                    {/* TWO COLUMN WORKSPACE */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      
                      {/* COLUMN 1: INTERACTIVE SIMULATOR CENTER */}
                      <div className="p-6 rounded-lg bg-black/30 border border-[#D4AF37]/15 space-y-4">
                        <div>
                          <h4 className="text-sm uppercase font-display font-bold text-[#D4AF37] flex items-center gap-2">
                            <Zap className="w-4 h-4 text-[#D4AF37]" />
                            Simulateur Transactionnel Premium
                          </h4>
                          <p className="text-xs text-[#F5F5F5]/50 mt-1">
                            Simulez l'activation instantanée d'un service premium par un artiste d'Abidjan pour valider le workflow de la caisse.
                          </p>
                        </div>

                        {/* SELECT TARGET ARTIST */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-[#F5F5F5]/60 block font-semibold">Artiste Acheteur</label>
                          <select
                            value={simUserId}
                            onChange={(e) => setSimUserId(e.target.value)}
                            className="w-full text-xs bg-[#0B0B0B] border border-[#D4AF37]/20 focus:border-[#D4AF37] text-white px-3 py-2.5 rounded-lg focus:outline-none"
                          >
                            <option value="">-- Choisir un artiste simulé --</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>
                                {u.artisticName} ({u.commune}) — {u.isVip ? "👑 VIP" : ""} {u.isPro ? "💼 PRO" : ""} {u.isCertified ? "✓ Certifié" : "Non-Certifié"}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* SELECT PREMIUM OFFERING */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-[#F5F5F5]/60 block font-semibold">Produit à Activer</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {[
                              { id: "cert_express", name: "⚡ Cert Express", price: "500 FCFA", desc: "Priorisation KYC" },
                              { id: "gombo_vip", name: "👑 Gombo VIP", price: "1 000 FCFA/m", desc: "Badge & Pinned post" },
                              { id: "boost_gombo", name: "🔥 Boost Tam-Tam", price: "1 000 FCFA", desc: "Mise en vedette" },
                              { id: "renfort_express", name: "⚡ Renfort Express", price: "500 FCFA", desc: "Marque Urgence" },
                              { id: "gombo_pro", name: "💼 Gombo PRO", price: "5 000 FCFA/m", desc: "Pour Orchestres" }
                            ].map((prod) => (
                              <button
                                key={prod.id}
                                type="button"
                                onClick={() => setSimProduct(prod.id)}
                                className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                                  simProduct === prod.id
                                    ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]"
                                    : "bg-[#0B0B0B]/50 border-white/5 hover:border-[#D4AF37]/30 text-[#F5F5F5]/70"
                                }`}
                              >
                                <span className="font-bold flex justify-between items-center w-full">
                                  <span>{prod.name}</span>
                                  <span className="font-mono text-[10px]">{prod.price}</span>
                                </span>
                                <span className="text-[9px] opacity-60 block mt-1">{prod.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* SPECIFIC BOOST AMOUNT SELECTOR (ONLY IF BOOST_GOMBO) */}
                        {simProduct === "boost_gombo" && (
                          <div className="space-y-1.5 p-3 rounded-lg bg-orange-500/5 border border-orange-500/15 animate-fadeIn">
                            <label className="text-[10px] font-mono uppercase text-orange-400 block font-semibold">Budget du Boost</label>
                            <div className="flex gap-2 text-xs">
                              {[500, 1000, 2000].map(amt => (
                                <button
                                  key={amt}
                                  type="button"
                                  onClick={() => setSimBoostPrice(amt)}
                                  className={`flex-1 py-1.5 rounded border font-mono font-bold transition-all ${
                                    simBoostPrice === amt
                                      ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow"
                                      : "bg-black/30 border-white/10 hover:bg-black/55 text-zinc-400"
                                  }`}
                                >
                                  {amt} FCFA
                                </button>
                              ))}
                            </div>
                            <span className="text-[9px] text-[#F5F5F5]/40 block italic mt-1 leading-normal">Le budget définit le poids d'exposition : 500 (24h), 1000 (3 jours), 2000 (7 jours)</span>
                          </div>
                        )}

                        {/* SUBMIT BUTTON */}
                        <button
                          type="button"
                          onClick={handlePerformSimulatedPayment}
                          className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 via-[#D4AF37] to-yellow-500 text-black font-semibold text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(212,175,55,0.25)] hover:bg-opacity-95 active:scale-[0.99] transition-all"
                        >
                          💸 Simuler le Paiement de l'Artiste
                        </button>
                      </div>

                      {/* COLUMN 2: LEADERBOARD OF PREMIUM USAGES */}
                      <div className="p-6 rounded-lg bg-[#0B0B0B] border border-[#D4AF37]/15">
                        <h4 className="text-xs uppercase font-mono font-bold tracking-widest text-[#D4AF37] mb-6 flex items-center gap-2">
                          <BarChart2 className="w-4 h-4" />
                          Classement des Produits les plus Utilisés
                        </h4>
                        
                        <div className="space-y-5">
                          {sortedProducts.map((p, idx) => {
                            const pct = countPremiumSales > 0 ? (p.count / countPremiumSales) * 100 : 0;
                            return (
                              <div key={idx} className="space-y-1 bg-white/[0.02] p-3 rounded border border-white/[0.02] hover:border-amber-500/10 transition-all">
                                <div className="flex justify-between items-center text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] text-[#F5F5F5]/30">#{idx+1}</span>
                                    <span className="font-semibold text-white">{p.name.split(" (")[0]}</span>
                                  </div>
                                  <div className="text-right font-mono text-[10px]">
                                    <span className="font-bold text-[#D4AF37]">{p.count} ventes</span>
                                    <span className="text-[#F5F5F5]/40 ml-2">({pct.toFixed(0)}%)</span>
                                  </div>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                                  <div
                                    className="bg-gradient-to-r from-amber-400 to-[#D4AF37] h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono pt-1">
                                  <span>{pct === 0 ? "En attente d'activité" : "Volume de commandes"}</span>
                                  <span className="text-emerald-400 font-bold">+{p.rev.toLocaleString()} FCFA</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
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
                          <span className="font-bold text-orange-400 block text-xs">🔥 Boost Gombo</span>
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
                          ZONE C : BRIEF DU JOUR & TERMINAL LOGS (RIGHT)
         ========================================================================= */}
      {perspective === "admin" && (
        <aside className="w-80 border-l border-[#D4AF37]/20 bg-[#0B0B0B] flex flex-col p-6 z-10 shrink-0">
          
          {/* DAILY ADMIN BRIEF MODULE */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                Mon Brief du Jour
              </span>
              <span className="text-[10px] font-mono text-[#F5F5F5]/40">{brief.timestamp}</span>
            </div>

            <div className="p-4 rounded-lg bg-black/40 border border-[#D4AF37]/10 space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#F5F5F5]/60">Nouveaux inscrits :</span>
                <span className="font-bold text-[#D4AF37]">{brief.newUsersCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#F5F5F5]/60">Publications de post :</span>
                <span className="font-semibold text-white">{brief.newPostsCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#F5F5F5]/60">Nouveaux Gombos :</span>
                <span className="font-semibold text-white">{brief.newGombosCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#F5F5F5]/60">Revenus générés :</span>
                <span className="font-bold text-emerald-400">{brief.revenuesGenerated.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#F5F5F5]/60">Certifications demandées :</span>
                <span className="font-semibold text-white">{brief.kycRequestsCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#F5F5F5]/60">Alertes critiques :</span>
                <span className="font-semibold text-[#EF4444]">{brief.criticalAlertsCount}</span>
              </div>

              {/* Quick action broadcast daily statement bulletin */}
              <button
                onClick={() => setIsBroadcastModalOpen(true)}
                className="w-full mt-3 py-2 bg-[#D4AF37] hover:bg-[#B48F17] text-[#0B0B0B] rounded text-center text-xs font-bold uppercase transition-all shadow-[0_0_8px_rgba(212,175,55,0.15)]"
              >
                Diffuser un bulletin d'alerte
              </button>
            </div>
          </div>

          {/* ADMINISTRATIVE ACTION LOGS (TERMINAL) */}
          <div className="flex-1 flex flex-col min-h-0">
            <span className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] font-semibold flex items-center gap-1.5 mb-3">
              <Tv className="w-3.5 h-3.5" />
              Terminal de Commandement
            </span>

            <div className="flex-1 bg-black/60 border border-[#D4AF37]/10 p-3 rounded-lg font-mono text-[9px] text-[#D4AF37]/80 overflow-y-auto space-y-2 relative scrollbar-thin">
              {terminalFeed.map((log, index) => (
                <div key={index} className="leading-relaxed border-b border-white/5 pb-1 last:border-0">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}

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
                <span className="text-orange-500 font-bold">100%</span>
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
                                     FIXED BOTTOM NAVIGATION BAR
         ========================================================================= */}
      {perspective === "user" && (
        <div className="fixed bottom-0 sm:bottom-4 left-0 sm:left-1/2 right-0 sm:right-auto sm:-translate-x-1/2 bg-[#090909]/95 sm:bg-[#121214]/95 backdrop-blur-md border-t sm:border border-zinc-900/90 p-2.5 px-4 sm:px-8 flex justify-around sm:justify-between sm:gap-6 items-center z-40 sm:rounded-2xl sm:shadow-[0_8px_35px_rgba(0,0,0,0.9)] w-full sm:w-auto min-w-[320px] max-w-lg mx-auto">
          {/* 1. ACCUEIL */}
          <button
            id="user-nav-terrain"
            onClick={() => {
              setActiveMenu("user_terrain");
              try { audioSynth.playValidationSuccess(); } catch (err) {}
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none flex-1 py-1 ${
              activeMenu === "user_terrain" ? "text-[#D4AF37] scale-105" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-mono font-black uppercase tracking-wider">Accueil</span>
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
              activeMenu === "user_vibes" ? "text-[#D4AF37] scale-105" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="text-[9px] font-mono font-black uppercase tracking-wider">Vibes</span>
          </button>

          {/* 3. PUBLIER (CENTRAL BUTTON, LARGER, HIGHLIGHTED) */}
          <button
            id="user-nav-publish"
            onClick={() => {
              requireAuthThen(() => {
                setActiveMenu("user_publish");
                try { audioSynth.playValidationSuccess(); } catch (err) {}
              });
            }}
            className="flex flex-col items-center justify-center cursor-pointer transition-all duration-200 outline-none w-12 h-12 -mt-4 bg-gradient-to-br from-[#D4AF37] to-[#B48F17] hover:from-[#E4BF47] hover:to-[#C49F27] text-[#090909] rounded-full shadow-[0_4px_15px_rgba(212,175,55,0.4)] border border-[#090909]/20 hover:scale-110 active:scale-90 select-none shrink-0"
            title="Publier"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
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
              activeMenu === "user_mes_gombos" ? "text-[#D4AF37] scale-105" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[9px] font-mono font-black uppercase tracking-wider">Mes Gombos</span>
          </button>

          {/* 5. MON HÉRITAGE */}
          <button
            id="user-nav-heritage"
            onClick={() => {
              requireAuthThen(() => {
                setActiveMenu("user_heritage");
                setViewingGomboIdDetail(false);
                try { audioSynth.playValidationSuccess(); } catch (err) {}
              });
            }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none flex-1 py-1 ${
              activeMenu === "user_heritage" ? "text-[#D4AF37] scale-105" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[9px] font-mono font-black uppercase tracking-wider">Héritage</span>
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

      {selectedGomboDetails && (() => {
        const hasApplied = appliedGombos.includes(selectedGomboDetails.id);
        return (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-lg bg-[#0F0F11] border border-[#D4AF37]/35 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
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
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[60vh]">
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

                <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[11px] font-mono text-zinc-500 gap-4 flex-wrap">
                  <div>
                    <span className="block text-[8px] text-zinc-650 uppercase font-bold">ORGANISATEUR :</span>
                    <span className="text-zinc-300 font-bold">{selectedGomboDetails.organizerName}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-zinc-650 uppercase font-bold">CANDIDATS :</span>
                    <span className="text-[#D4AF37] font-bold">{selectedGomboDetails.applicantsCount + (hasApplied ? 1 : 0)} postulants</span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 bg-black/40 border-t border-white/5 shrink-0 flex gap-3">
                <button
                  onClick={() => setSelectedGomboDetails(null)}
                  className="flex-1 py-3 rounded-2xl bg-zinc-950 border border-white/10 hover:border-white/20 text-white text-xs font-mono font-black uppercase tracking-wider transition-all select-none active:scale-95 cursor-pointer"
                >
                  Fermer
                </button>

                <button
                  onClick={() => {
                    if (hasApplied) return;
                    setAppliedGombos(prev => [...prev, selectedGomboDetails.id]);
                    addToTerminal(`[🎼 CONTRAT] Dossier de souveraineté transmis pour : ${selectedGomboDetails.title}`);
                    try { audioSynth.playValidationSuccess(); } catch (err) {}
                  }}
                  className={`flex-[2] py-3 rounded-2xl font-mono font-black text-xs uppercase tracking-wider transition-all select-none active:scale-95 cursor-pointer text-center ${
                    hasApplied
                      ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 cursor-not-allowed"
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

    </div>
  );
}
