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
import GomboIdUserDashboard from "./GomboIdUserDashboard";
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
  GomboReview
} from "../types";
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
  Settings
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
  const [activeMenu, setActiveMenu] = useState<any>("user_heritage");
  const [perspective, setPerspective] = useState<"admin" | "user">("user");
  const [activeArtistId, setActiveArtistId] = useState<string>("user_3");
  const [localSaved, setLocalSaved] = useState<boolean>(true);
  const [autoSaveActive, setAutoSaveActive] = useState<boolean>(false);

  // Simulated admin email & Super Admin unlocks state
  const [adminEmail, setAdminEmail] = useState<string>("admin@gombo.ci");
  const [isSuperUnlocked, setIsSuperUnlocked] = useState<boolean>(false);
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

  const [kycActiveTab, setKycActiveTab] = useState<"standard" | "express" | "approved" | "rejected" | "info_required">("standard");
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

      return () => {
        unsubscribeUsers();
        unsubscribeGombos();
        unsubscribeTransactions();
        unsubscribeReviews();
        unsubscribeAlerts();
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
    addToTerminal(`[LOG ADMIN] Action: ${actionType} | Cible: ${targetUserName} | ${detail}`);
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
      
      {/* =========================================================================
                               ZONE A : SIDEBAR COLONNE FIXE (LEFT)
         ========================================================================= */}
      <aside className="w-72 border-r border-[#D4AF37]/20 bg-[#0B0B0B] flex flex-col justify-between p-6 z-10 shrink-0">
        
        {/* LOGO & HEADING */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              <Radio className="text-[#0B0B0B] w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold uppercase tracking-wider text-[#D4AF37]">
                Afrigombo
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#F5F5F5]/60 block -mt-1">
                Elite - Command Center
              </span>
            </div>
          </div>

          {/* PERSPECTIVE SWITCHER */}
          <div className="mb-6 bg-black border border-[#D4AF37]/30 rounded-xl p-3 space-y-2">
            <span className="text-[9px] uppercase font-mono text-[#D4AF37] block font-bold tracking-wider">🎭 Perspective Actuelle</span>
            <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-lg">
              <button
                onClick={() => {
                  setPerspective("user");
                  setActiveMenu("user_dashboard");
                }}
                className={`py-1.5 rounded text-center text-xs font-mono font-bold transition-all ${
                  perspective === "user" ? "bg-gradient-to-r from-[#D4AF37] to-[#B48F17] text-black shadow" : "text-white/60 hover:text-white"
                }`}
              >
                Artiste
              </button>
              <button
                onClick={() => {
                  setPerspective("admin");
                  setActiveMenu("dashboard");
                }}
                className={`py-1.5 rounded text-center text-xs font-mono font-bold transition-all ${
                  perspective === "admin" ? "bg-gradient-to-r from-[#D4AF37] to-[#B48F17] text-black shadow" : "text-white/60 hover:text-white"
                }`}
              >
                Admin
              </button>
            </div>

            {/* Simulated Active Artist Selector (only in user mode) */}
            {perspective === "user" && (
              <div className="space-y-1 pt-1.5 border-t border-white/5">
                <span className="text-[8px] uppercase font-mono text-zinc-400 block font-semibold">🔮 Artiste Actif Simulé :</span>
                <select
                  value={activeArtistId}
                  onChange={(e) => {
                    setActiveArtistId(e.target.value);
                  }}
                  className="w-full bg-black border border-white/10 rounded px-1.5 py-1 text-[11px] text-white font-mono focus:outline-none"
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

          {/* SLOGAN PRESTIGE */}
          <div className="p-4 rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/10 mb-6 text-center text-xs text-[#D4AF37] italic">
            "🎼 Ton héritage attire les gombos."
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="space-y-1">
            {perspective === "user" ? (
              <>
                <button
                  onClick={() => setActiveMenu("user_heritage")}
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
                  onClick={() => setActiveMenu("user_gombo_id")}
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
                  onClick={() => setActiveMenu("user_mes_gombos")}
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
                  onClick={() => setActiveMenu("user_mes_groupes")}
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
                  onClick={() => setActiveMenu("user_renforts")}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-xs font-mono font-bold uppercase transition-all duration-205 ${
                    activeMenu === "user_renforts"
                      ? "bg-[#D4AF37] text-black font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-white/70 hover:text-white hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  Renforts
                </button>

                <button
                  onClick={() => setActiveMenu("user_opportunities")}
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
                  onClick={() => setActiveMenu("user_settings")}
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
                  onClick={() => setActiveMenu("user_notifications")}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-xs font-mono font-bold uppercase transition-all duration-205 ${
                    activeMenu === "user_notifications"
                      ? "bg-[#D4AF37] text-black font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-white/70 hover:text-white hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  Notifications (Tambours)
                </button>

                <button
                  onClick={() => setActiveMenu("user_edit_profile")}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-xs font-mono font-bold uppercase transition-all duration-205 ${
                    activeMenu === "user_edit_profile"
                      ? "bg-[#D4AF37] text-black font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-white/70 hover:text-white hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Modifier mon profil
                </button>

                <button
                  onClick={() => {
                    const confirmLogout = window.confirm("Souhaitez-vous réinitialiser votre session d'artiste et vous déconnecter ?");
                    if (confirmLogout) {
                      setActiveArtistId("user_1");
                      setActiveMenu("user_heritage");
                      addToTerminal("[INFO] Session d'artiste déconnectée. Retour à Ariel Loua.");
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-xs font-mono font-bold uppercase text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-205"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveMenu("dashboard")}
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
                  onClick={() => setActiveMenu("gombos")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    activeMenu === "gombos"
                      ? "bg-[#D4AF37] text-[#0B0B0B] font-semibold font-display shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Film className="w-4 h-4" />
                  Le Tam-Tam Gombo
                </button>

                <button
                  onClick={() => setActiveMenu("renforts")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    activeMenu === "renforts"
                      ? "bg-[#D4AF37] text-[#0B0B0B] font-semibold font-display shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  Renforts Postulés
                </button>

                <button
                  onClick={() => setActiveMenu("kyc")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    activeMenu === "kyc"
                      ? "bg-[#D4AF37] text-[#0B0B0B] font-semibold font-display shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Gombo ID (KYC)
                </button>

                <button
                  onClick={() => setActiveMenu("revision")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    activeMenu === "revision"
                      ? "bg-[#D4AF37] text-[#0B0B0B] font-semibold font-display shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <AlertOctagon className="w-4 h-4" />
                  File de Révision
                </button>

                <button
                  onClick={() => setActiveMenu("alertes")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    activeMenu === "alertes"
                      ? "bg-[#D4AF37] text-[#0B0B0B] font-semibold font-display shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Alertes de Communes
                </button>

                <button
                  onClick={() => setActiveMenu("caisse")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    activeMenu === "caisse"
                      ? "bg-[#D4AF37] text-[#0B0B0B] font-semibold font-display shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  La Caisse Gombo
                </button>

                <button
                  onClick={() => setActiveMenu("monetisation")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    activeMenu === "monetisation"
                      ? "bg-[#D4AF37] text-[#0B0B0B] font-semibold font-display shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  Monétisation Premium
                </button>

                <button
                  onClick={() => setActiveMenu("analytics")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    activeMenu === "analytics"
                      ? "bg-[#D4AF37] text-[#0B0B0B] font-semibold font-display shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  Analytics & Courbes
                </button>

                {adminEmail === "johnsylvesterh@gmail.com" && (
                  <button
                    onClick={() => {
                      setActiveMenu("super_admin");
                      addToTerminal(`[Trône] Le Fondateur Unique accède à son trône royal.`);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-lg text-xs font-black font-mono uppercase tracking-widest transition-all duration-300 border ${
                      activeMenu === "super_admin"
                        ? "bg-gradient-to-r from-black via-zinc-950 to-zinc-900 border-[#D4AF37] text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                        : "text-[#D4AF37] bg-black hover:bg-[#D4AF37]/5 border-[#D4AF37]/30 hover:border-[#D4AF37] animate-pulse"
                    }`}
                  >
                    <Crown className="w-4 h-4 text-[#D4AF37]" />
                    👑 Entrer dans le Trône
                  </button>
                )}
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
        
        {/* UPPER STATUS BAR */}
        <header className="flex justify-between items-center pb-6 border-b border-[#D4AF37]/10 mb-6 shrink-0">
          <div>
            <h2 className="text-2xl font-display font-extrabold text-[#F5F5F5] tracking-wide">
              {activeMenu === "user_heritage" && "Mon Héritage Impérial 🎼"}
              {activeMenu === "user_gombo_id" && "Mon Gombo ID d'Excellence"}
              {activeMenu === "user_mes_gombos" && "Mes Gombos & Prestations"}
              {activeMenu === "user_mes_groupes" && "Mes Alliances d'Orchestre"}
              {activeMenu === "user_renforts" && "Module de Renforts Scéniques"}
              {activeMenu === "user_opportunities" && "Opportunités d'Or d'Abidjan"}
              {activeMenu === "user_settings" && "Paramètres du Transmetteur"}
              {activeMenu === "user_notifications" && "Les Vibrations du Tam-Tam"}
              {activeMenu === "user_edit_profile" && "Modifier mon Profil"}
              {activeMenu === "super_admin" && "Le Trône Souverain du Fondateur"}
              {activeMenu === "dashboard" && "Le Grand Salon & Pilotat"}
              {activeMenu === "gombos" && "L'Écrin des Opportunités"}
              {activeMenu === "renforts" && "Les Solidarités Scéniques"}
              {activeMenu === "kyc" && "La Base des Talents Majeurs"}
              {activeMenu === "revision" && "La File de Révision Modérale"}
              {activeMenu === "alertes" && "Les Murmures des Communes"}
              {activeMenu === "caisse" && "Le Coffre-Fort d'AFRIGOMBO"}
              {activeMenu === "monetisation" && "Le Club des Mécènes & Boosts"}
              {activeMenu === "analytics" && "Les Courbes de la Musique"}
            </h2>
            <p className="text-xs text-[#F5F5F5]/60 mt-1.5">
              {perspective === "user" ? "Façonnez votre légende et gérez vos certifications d'excellence." : "Prenez le pouls des vibrations et de la renommée de nos talents."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Real Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#F5F5F5]/40" />
              <input
                type="text"
                placeholder="Chercher artiste, commune..."
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 text-xs rounded-lg bg-[#0B0B0B] border border-[#D4AF37]/20 focus:border-[#D4AF37] focus:outline-none transition-all placeholder:text-[#F5F5F5]/30 text-[#F5F5F5] font-mono"
              />
            </div>

            {/* Offline/Online Fire Sync state Indicator */}
            <div className="flex items-center gap-2 bg-[#D4AF37]/5 px-3 py-1.5 rounded-lg border border-[#D4AF37]/10">
              <span className={`w-2 h-2 rounded-full ${autoSaveActive ? "bg-[#D4AF37] animate-ping" : "bg-[#10B981]"}`} />
              <span className="text-[10px] font-mono uppercase text-[#F5F5F5]/60">
                {autoSaveActive ? "Sync..." : "Firestore Connecté"}
              </span>
            </div>
          </div>
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
              {activeMenu === "user_heritage" && (() => {
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-zinc-500">Aucun artiste sélectionné.</p>;
                return (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-[#0B0B0B] to-zinc-900 border border-[#D4AF37]/20 shadow-xl space-y-4">
                      <div className="flex justify-between items-start flex-wrap gap-4 pb-4 border-b border-white/5">
                        <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37] flex items-center justify-center">
                            <Music className="w-8 h-8 text-[#D4AF37]" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-mono text-[#D4AF37] tracking-widest block font-bold">Temple de l'Héritage Artistique</span>
                            <h2 className="text-2xl font-display font-black text-white mt-1">{currentArtist.artisticName}</h2>
                            <p className="text-xs text-zinc-400 font-mono mt-0.5">{currentArtist.name} • {currentArtist.commune}, Abidjan</p>
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
                                VIEW: DASHBOARD & SCAN
                  ---------------------------------------------------- */}
              {activeMenu === "dashboard" && (
                <>
                  {/* CINEMATIC INTERACTIVE DASHBOARD INTRO */}
                  <AnimatePresence>
                    {showDashboardIntro && (
                      <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 bg-[#060606] z-50 flex flex-col items-center justify-center text-center p-6"
                      >
                        {/* Golden connecting neon lines vector visualizer */}
                        <div className="absolute inset-0 pointer-events-none opacity-20">
                          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <motion.path
                              d="M 100 200 Q 400 500 800 200 T 1200 400"
                              fill="none"
                              stroke="#D4AF37"
                              strokeWidth="1.5"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1.8, ease: "easeInOut" }}
                            />
                            <motion.path
                              d="M 200 600 Q 600 200 1000 600"
                              fill="none"
                              stroke="#D4AF37"
                              strokeWidth="1"
                              strokeDasharray="5, 5"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                          </svg>
                        </div>

                        <div className="space-y-6 max-w-lg z-10">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6 }}
                            className="w-16 h-16 rounded-full border border-[#D4AF37]/40 bg-black flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                          >
                            <Crown className="w-8 h-8 text-[#D4AF37] animate-pulse" />
                          </motion.div>

                          <div className="space-y-3 h-28 flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                              {dashboardStep === 1 && (
                                <motion.div
                                  key="step1"
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -15 }}
                                  transition={{ duration: 0.35 }}
                                  className="space-y-1"
                                >
                                  <h2 className="text-[#D4AF37] text-xl font-sans font-black uppercase tracking-widest">
                                    Bienvenue au Centre de Commandement.
                                  </h2>
                                  <p className="text-xs text-zinc-400 font-mono">Impérial d'AFRIGOMBO ELITE</p>
                                </motion.div>
                              )}

                              {dashboardStep === 2 && (
                                <motion.div
                                  key="step2"
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -15 }}
                                  transition={{ duration: 0.35 }}
                                  className="space-y-1"
                                >
                                  <h3 className="text-white text-lg font-mono font-bold uppercase tracking-wide">
                                    "La communauté compte sur votre vigilance."
                                  </h3>
                                  <p className="text-xs text-zinc-500 font-mono">Abidjan connecté en temps réel</p>
                                </motion.div>
                              )}

                              {dashboardStep === 3 && (
                                <motion.div
                                  key="step3"
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -15 }}
                                  transition={{ duration: 0.35 }}
                                  className="space-y-2"
                                >
                                  <h3 className="text-white text-md font-sans font-semibold text-neutral-200">
                                    "Chaque décision protège le Temple du Gombo."
                                  </h3>
                                  <div className="w-10 h-0.5 bg-[#D4AF37] mx-auto animate-pulse" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-8 pb-12 animate-fadeIn">
                    
                    {/* ELEVATED WELCOME & BRIEF BANNER */}
                    <div className="p-8 rounded-3xl bg-gradient-to-r from-black via-zinc-950 to-zinc-900 border border-[#D4AF37]/35 shadow-[0_4px_30px_rgba(212,175,55,0.06)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="space-y-2">
                        <span className="text-[10px] tracking-[0.2em] font-mono text-[#D4AF37] font-black uppercase block">
                          GOUVERNANCE D'OR ET D'EXCELLENCE
                        </span>
                        <h2 className="text-2xl font-sans font-extrabold tracking-tight text-white uppercase">
                          Le Temple du Gombo
                        </h2>
                        <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-xl">
                          "La communauté compte sur votre vigilance. Chaque décision protège le Temple du Gombo." Vos outils de régulation impériale sont entièrement synchronisés en temps réel avec Firebase.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        {/* PRESTIGIOUS LOG FEEDBACK */}
                        <div className="py-2 px-4 rounded-xl bg-black border border-white/5 font-mono text-[10px] text-zinc-400">
                          🔌 Serveur d'Abidjan : <span className="text-emerald-400 font-bold">OPÉRATIONNEL 100%</span>
                        </div>
                      </div>
                    </div>

                    {/* ----------------- SECTION ACTIONS EXPRESS ----------------- */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                        <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37]">
                          Actions Express d'Aujourd'hui
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        
                        <button
                          onClick={() => {
                            setActiveMenu("kyc");
                            try { audioSynth.playValidationSuccess(); } catch (err) {}
                            addToTerminal("[Express] Navigation vers le centre de certification Kyc.");
                          }}
                          className="group p-5 rounded-2xl bg-black hover:bg-zinc-950 border border-[#D4AF37]/15 hover:border-[#D4AF37]/60 text-left transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden"
                        >
                          <div className="p-2.5 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/15 text-[#D4AF37] w-fit group-hover:bg-[#D4AF37]/10 transition-colors">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs text-white font-sans font-bold block group-hover:text-[#D4AF37] transition-colors">
                              Certifications
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                              Valider les dossiers GOMBO ID
                            </span>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenu("alertes");
                            try { audioSynth.playTamTam(true); } catch (err) {}
                            addToTerminal("[Express] Ouverture de la file des alertes de sécurité.");
                          }}
                          className="group p-5 rounded-2xl bg-black hover:bg-zinc-950 border border-[#D4AF37]/15 hover:border-[#D4AF37]/60 text-left transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden"
                        >
                          <div className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/15 text-red-400 w-fit group-hover:bg-red-500/10 transition-colors">
                            <AlertTriangle className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <span className="text-xs text-white font-sans font-bold block group-hover:text-red-400 transition-colors">
                              Voir les Alertes
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                              Surveiller les conflits
                            </span>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setIsBroadcastModalOpen(true);
                            try { audioSynth.playKoraNote(523.25, 0, 0.15, 0.4); } catch (err) {}
                          }}
                          className="group p-5 rounded-2xl bg-black hover:bg-zinc-950 border border-[#D4AF37]/15 hover:border-[#D4AF37]/60 text-left transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden"
                        >
                          <div className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15 text-blue-400 w-fit group-hover:bg-blue-500/10 transition-colors">
                            <Send className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs text-white font-sans font-bold block group-hover:text-blue-400 transition-colors">
                              Envoyer une Annonce
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                              Diffuser sur le Tambour global
                            </span>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            triggerGlobalSystemScan();
                            try { audioSynth.playTamTam(false); } catch (err) {}
                          }}
                          className="group p-5 rounded-2xl bg-black hover:bg-zinc-950 border border-[#D4AF37]/15 hover:border-[#D4AF37]/60 text-left transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden"
                        >
                          <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 w-fit group-hover:bg-emerald-500/10 transition-colors">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs text-white font-sans font-bold block group-hover:text-emerald-400 transition-colors">
                              Vérifier la Sécurité
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                              Lancer le diagnostic système
                            </span>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenu("caisse");
                            try { audioSynth.playKoraSuccess(); } catch (err) {}
                            addToTerminal("[Express] Accès au grand coffre d'or.");
                          }}
                          className="group p-5 rounded-2xl bg-black hover:bg-zinc-950 border border-[#D4AF37]/15 hover:border-[#D4AF37]/60 text-left transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden"
                        >
                          <div className="p-2.5 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/15 text-[#D4AF37] w-fit group-hover:bg-[#D4AF37]/10 transition-colors">
                            <Coins className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs text-white font-sans font-bold block group-hover:text-[#D4AF37] transition-colors">
                              Accéder à la Caisse
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                              Piloter la trésorerie souveraine
                            </span>
                          </div>
                        </button>

                      </div>
                    </div>

                    {/* ----------------- SECTION COCKPIT EN TEMPS RÉEL ----------------- */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#D4AF37]" />
                        <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37]">
                          Le Cockpit Impérial en Temps Réel
                        </h3>
                      </div>

                      {/* Luxurious massive rounded Bento grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* CARD 1: MEMBRES INSCRITS & ACTIFS */}
                        <div className="p-8 rounded-3xl bg-black border border-white/5 shadow-md flex flex-col justify-between space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                              Membres de la Fratrie
                            </span>
                            <Users className="w-4 h-4 text-[#D4AF37]" />
                          </div>
                          <div>
                            <div className="flex items-baseline gap-2">
                              <h4 className="text-4xl font-display font-black text-[#D4AF37]">
                                {users.length}
                              </h4>
                              <span className="text-xs font-mono text-zinc-500">Membres inscrits</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[11px] text-zinc-400">
                                {users.filter(u => u.status === "active" || !u.status).length} artistes actifs en ce moment
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* CARD 2: OPPORTUNITÉS DE SCÈNE (GOMBOS) */}
                        <div className="p-8 rounded-3xl bg-black border border-white/5 shadow-md flex flex-col justify-between space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                              Opportunities & Gombos
                            </span>
                            <Music className="w-4 h-4 text-[#D4AF37]" />
                          </div>
                          <div>
                            <div className="flex items-baseline gap-2">
                              <h4 className="text-4xl font-display font-black text-white">
                                {gombos.length}
                              </h4>
                              <span className="text-xs font-mono text-zinc-500">Gombos publiés</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-[#D4AF37]">
                              <span className="text-[11px] font-mono">
                                Côte d'Or : {(gombos.reduce((sum, g) => sum + g.budget, 0)).toLocaleString()} FCFA sécurisés
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* CARD 3: REVENUS SYSTEME & CERTIFICATIONS */}
                        <div className="p-8 rounded-3xl bg-black border border-white/5 shadow-md flex flex-col justify-between space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                              Trésor National & Certifs
                            </span>
                            <Coins className="w-4 h-4 text-[#D4AF37]" />
                          </div>
                          <div>
                            <div className="flex items-baseline gap-2">
                              <h4 className="text-3xl font-display font-black text-emerald-400">
                                {(transactions.reduce((acc, curr) => acc + (curr.type === "commission" ? curr.amount : 0), 0) || 120000).toLocaleString()} <span className="text-xs">FCFA</span>
                              </h4>
                              <span className="text-xs font-mono text-emerald-500 font-bold">Caisse d'Or</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 text-zinc-400">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                              <span className="text-[11px]">
                                {users.filter(u => u.isCertified).length} GOMBO ID certifiés souverains
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* CRITICAL SYSTEM ALERTS PANEL */}
                    <div className="p-6 rounded-3xl bg-black border border-red-500/10 hover:border-red-500/30 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-500/10 rounded-2xl text-red-400">
                          <AlertTriangle className="w-5 h-5 animate-bounce" />
                        </div>
                        <div>
                          <h4 className="text-xs font-mono uppercase font-black text-red-500">
                            Rapport d'Alertes Critiques
                          </h4>
                          <span className="text-sm font-semibold text-white">
                            {alerts.length} murmures de communes nécessitent votre attention
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setActiveMenu("alertes");
                          try { audioSynth.playTamTam(true); } catch (err) {}
                        }}
                        className="py-2.5 px-6 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-display font-bold text-xs uppercase tracking-wider transition-colors max-w-fit"
                      >
                        Ouvrir le Centre de Détection
                      </button>
                    </div>

                    {/* INTERACTIVE AUTONOMOUS MODERATION MONITOR */}
                    <div className="p-8 rounded-3xl bg-black border border-white/5 space-y-6">
                      <div className="flex justify-between items-center flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/15 text-[#D4AF37]">
                            <Radio className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-sm font-sans font-extrabold text-[#D4AF37] uppercase tracking-wide">
                              Diagnostic sémantique autonome
                            </h4>
                            <span className="text-xs text-zinc-500 block">
                              Surveillance en continu du réseau et filtration automatisée
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={triggerGlobalSystemScan}
                          className="py-2 px-4 rounded-xl border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 text-[#D4AF37] text-xs font-mono font-black uppercase tracking-widest transition-all"
                        >
                          Lancer Analyse Complète
                        </button>
                      </div>

                      {scannerStatus !== "idle" && (
                        <div className="space-y-2 p-4 rounded-2xl bg-[#060606] border border-[#D4AF37]/10">
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="text-zinc-400">Analyse de la cohérence et décontamination...</span>
                            <span className="text-[#D4AF37] font-bold">
                              {scannerStatus === "scanning" ? "Traitement à Abidjan..." : "Scan achevé !"}
                            </span>
                          </div>
                          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 2 }}
                              className="bg-[#D4AF37] h-full shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                            />
                          </div>
                        </div>
                      )}

                      {isScanFeedbackVisible && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-2 md:grid-cols-4 gap-4"
                        >
                          <div className="p-4 rounded-2xl bg-[#060606] border border-white/5 text-center">
                            <span className="text-[9px] uppercase font-mono text-zinc-500 block">Vitesse sémantique</span>
                            <span className="text-base font-display font-semibold text-[#D4AF37]">{autoStats.growthRate}</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-[#060606] border border-white/5 text-center">
                            <span className="text-[9px] uppercase font-mono text-zinc-500 block">Profils suspectés</span>
                            <span className="text-base font-display font-semibold text-red-400">{autoStats.suspiciousCount}</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-[#060606] border border-white/5 text-center">
                            <span className="text-[9px] uppercase font-mono text-zinc-500 block">Posts infectés</span>
                            <span className="text-base font-display font-semibold text-red-400">{autoStats.anomalyCount}</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-[#060606] border border-white/5 text-center">
                            <span className="text-[9px] uppercase font-mono text-zinc-500 block">Niveau d'urgence</span>
                            <span className="text-base font-display font-semibold text-[#10B981]">Protégé</span>
                          </div>
                        </motion.div>
                      )}

                      {autoFlaggedPosts.length > 0 && (
                        <div className="space-y-3">
                          <span className="text-xs font-mono text-red-400 uppercase tracking-widest block font-bold">
                            🚨 Alertes sémantiques isolées :
                          </span>
                          {autoFlaggedPosts.map(post => (
                            <div key={post.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-2xl bg-red-950/20 border border-red-500/10 text-xs gap-3">
                              <div className="flex items-center gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                <div>
                                  <span className="font-bold text-red-400 block">{post.authorArtisticName}</span>
                                  <span className="text-zinc-400">"{post.content}"</span>
                                </div>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto self-end">
                                <button
                                  onClick={() => handlePerformActionOnPost(post.id, "approve")}
                                  className="px-3 py-1.5 bg-zinc-900 border border-white/5 text-white rounded-lg hover:bg-zinc-800 transition-all font-semibold text-[10px]"
                                >
                                  Ignorer l'alerte
                                </button>
                                <button
                                  onClick={() => handlePerformActionOnPost(post.id, "delete")}
                                  className="px-3 py-1.5 bg-red-500 text-black font-semibold rounded-lg hover:bg-red-600 transition-all text-[10px]"
                                >
                                  Purger le contenu
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* INTERACTIVE PREGREGULATED SIMULATOR UNIT */}
                    <div className="p-8 rounded-3xl bg-zinc-950/60 border border-[#D4AF37]/10 space-y-4">
                      <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                          <h4 className="text-xs font-mono uppercase font-black text-amber-500 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Simulateur d'Identités Administratives
                          </h4>
                          <span className="text-[11px] text-zinc-500 block">
                            Basculez de rôle instantanément pour vérifier les permissions strictes
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setAdminEmail("info@gombo.ci");
                              setIsSuperUnlocked(false);
                              try { audioSynth.playTamTam(true); } catch (err) {}
                              addToTerminal("[SIMULATEUR] Session commutée en Admin Standard.");
                            }}
                            className={`px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase font-black border transition-all ${
                              adminEmail !== "johnsylvesterh@gmail.com" && adminEmail !== "jhs.kmj7@gmail.com"
                                ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                                : "bg-black text-zinc-400 border-white/5 hover:border-white/10"
                            }`}
                          >
                            Admin Standard
                          </button>
                          <button
                            onClick={() => {
                              setAdminEmail("jhs.kmj7@gmail.com");
                              setIsSuperUnlocked(false);
                              try { audioSynth.playTamTam(false); } catch (err) {}
                              addToTerminal("[SIMULATEUR] Session commutée en Super Administrateur (jhs.kmj7).");
                            }}
                            className={`px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase font-black border transition-all ${
                              adminEmail === "jhs.kmj7@gmail.com"
                                ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                                : "bg-black text-zinc-400 border-white/5 hover:border-white/10"
                            }`}
                          >
                            Super Admin
                          </button>
                          <button
                            onClick={() => {
                              setAdminEmail("johnsylvesterh@gmail.com");
                              try { audioSynth.playKoraSuccess(); } catch (err) {}
                              addToTerminal("[SIMULATEUR] Salut au Fondateur John Sylvester ! Trône Suprême déverrouillé.");
                            }}
                            className={`px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase font-black border transition-all ${
                              adminEmail === "johnsylvesterh@gmail.com"
                                ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-black border-transparent animate-pulse"
                                : "bg-black text-amber-500 border-[#D4AF37]/15 hover:border-[#D4AF37]/40"
                            }`}
                          >
                            Fondateur Suprême
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
                </>
              )}

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
                        onClick={() => setKycActiveTab("standard")}
                        className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "standard" ? "bg-[#D4AF37] text-black font-bold" : "border border-[#D4AF37]/20 text-[#D4AF37]/80 hover:bg-[#D4AF37]/5"}`}
                      >
                        Standard ({users.filter(u => u.kycStatus === "pending" && u.kycType !== "express").length})
                      </button>
                      <button
                        onClick={() => setKycActiveTab("express")}
                        className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "express" ? "bg-cyan-500 text-black font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]" : "border border-cyan-500/20 text-cyan-400/80 hover:bg-cyan-500/5"}`}
                      >
                        ⚡ Express ({users.filter(u => u.kycStatus === "pending" && u.kycType === "express").length})
                      </button>
                      <button
                        onClick={() => setKycActiveTab("approved")}
                        className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "approved" ? "bg-emerald-500 text-black font-bold" : "border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5"}`}
                      >
                        Validées ({users.filter(u => u.kycStatus === "approved").length})
                      </button>
                      <button
                        onClick={() => setKycActiveTab("rejected")}
                        className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "rejected" ? "bg-red-500 text-white font-bold" : "border border-red-500/20 text-red-400 hover:bg-red-500/5"}`}
                      >
                        Refusées ({users.filter(u => u.kycStatus === "rejected").length})
                      </button>
                      <button
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

    </div>
  );
}
