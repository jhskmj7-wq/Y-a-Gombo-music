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
import {
  AdminMenu,
  User,
  Post,
  Gombo,
  Renfort,
  Alerte,
  Transaction,
  AdminBrief
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
  Crown
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
    title: "Concert de Gala - Réveillon Privé Abidjan",
    description: "Recherche un bassiste de Zouglou expérimenté avec son propre matériel pour accompagner un orchestre de variété le samedi soir.",
    budget: 350000,
    commissionRate: 0.10,
    location: "Plateau",
    organizerId: "org_1",
    organizerName: "Le Caveau Elite Venue",
    timestamp: "2026-06-10T09:00:00Z",
    applicantsCount: 6,
    status: "open"
  },
  {
    id: "gombo_2",
    title: "Animation de Mariage VIP",
    description: "Orchestre complet demandé pour un mariage civil de prestige. Prestation de 4 heures avec répertoire traditionnel et coupé-décalé.",
    budget: 1200000,
    commissionRate: 0.12,
    location: "Marcory",
    organizerId: "org_2",
    organizerName: "Hôtel Ivoire Prestige",
    timestamp: "2026-06-10T08:30:00Z",
    applicantsCount: 14,
    status: "open"
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

export default function AdminCentre() {
  const [activeMenu, setActiveMenu] = useState<any>("user_dashboard");
  const [perspective, setPerspective] = useState<"admin" | "user">("user");
  const [activeArtistId, setActiveArtistId] = useState<string>("user_3");
  const [localSaved, setLocalSaved] = useState<boolean>(true);
  const [autoSaveActive, setAutoSaveActive] = useState<boolean>(false);

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

      return () => {
        unsubscribeUsers();
        unsubscribeGombos();
        unsubscribeTransactions();
      };
    } catch (e) {
      addToTerminal(`[Alerte locale] Lancement offline synchronisé.`);
    }
  }, []);

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
                  onClick={() => setActiveMenu("user_dashboard")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                    activeMenu === "user_dashboard"
                      ? "bg-[#D4AF37] text-[#0B0B0B] font-semibold font-display shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                      : "text-[#F5F5F5]/70 hover:text-[#F5F5F5] hover:bg-[#D4AF37]/5 hover:translate-x-1"
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Gombo ID Dashboard
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
            <h2 className="text-2xl font-display font-medium text-[#F5F5F5] tracking-tight">
              {activeMenu === "user_dashboard" && "Mon Gombo ID — Certification d'Excellence Artistique"}
              {activeMenu === "dashboard" && "Pilotage Intelligent & Modération"}
              {activeMenu === "gombos" && "Le Grand Tam-Tam & Gombos"}
              {activeMenu === "renforts" && "Renforts Artistes Appliqués"}
              {activeMenu === "kyc" && "Gombo ID - Base des Certifications"}
              {activeMenu === "revision" && "File de Révision Modérateur"}
              {activeMenu === "alertes" && "Centre d'Alerte de Communes d'Abidjan"}
              {activeMenu === "caisse" && "La Caisse d'AFRIGOMBO"}
              {activeMenu === "monetisation" && "Monétisation Premium d'AFRIGOMBO"}
              {activeMenu === "analytics" && "Analytique d'Héritage Musical"}
            </h2>
            <p className="text-xs text-[#F5F5F5]/60 mt-0.5">
              {perspective === "user" ? "Espace de certification premium et de gestion d'artiste." : "Centre de commandement souverain pour un seul administrateur."}
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
                                VIEW: GOMBO ID USER DASHBOARD
                  ---------------------------------------------------- */}
              {activeMenu === "user_dashboard" && (() => {
                const currentArtist = users.find(u => u.id === activeArtistId) || users[0];
                if (!currentArtist) return <p className="text-white">Aucun artiste disponible. Veuillez en créer un dans l'onglet Admin.</p>;
                
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
                    currentUser={currentArtist}
                    onUpdateUser={handleUpdateUser}
                    onCreateTransaction={handleCreateTransaction}
                    addToTerminal={(msg: string) => addToTerminal(msg)}
                  />
                );
              })()}

              {/* ----------------------------------------------------
                                VIEW: DASHBOARD & SCAN
                  ---------------------------------------------------- */}
              {activeMenu === "dashboard" && (
                <>
                  {/* BENTO STATS OVERVIEW */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-5 rounded-lg bg-[#0B0B0B] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 shadow-sm transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-[#F5F5F5]/50">
                          Utilisateurs Certifiés
                        </span>
                        <Users className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                      <h3 className="text-3xl font-display font-medium text-[#F5F5F5] tracking-tight">
                        {users.filter(u => u.isCertified).length} / {users.length}
                      </h3>
                      <span className="text-[10px] font-mono text-[#10B981] block mt-1">
                        +5 certifiés aujourd'hui
                      </span>
                    </div>

                    <div className="p-5 rounded-lg bg-[#0B0B0B] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 shadow-sm transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-[#F5F5F5]/50">
                          Gombos Ouverts
                        </span>
                        <Briefcase className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                      <h3 className="text-3xl font-display font-medium text-[#F5F5F5] tracking-tight">
                        {gombos.filter(g => g.status === "open").length}
                      </h3>
                      <span className="text-[10px] font-mono text-[#D4AF37] block mt-1">
                        Valeur : 1 550 000 FCFA
                      </span>
                    </div>

                    <div className="p-5 rounded-lg bg-[#0B0B0B] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 shadow-sm transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-[#F5F5F5]/50">
                          Caisse (Commissions 10%)
                        </span>
                        <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                      <h3 className="text-3xl font-display font-medium text-[#D4AF37] tracking-tight">
                        {transactions.reduce((acc, curr) => acc + (curr.type === "commission" ? curr.amount : 0), 0).toLocaleString()} <span className="text-sm">FCFA</span>
                      </h3>
                      <span className="text-[10px] font-mono text-[#10B981] block mt-1">
                        +18% cette semaine
                      </span>
                    </div>

                    <div className="p-5 rounded-lg bg-[#0B0B0B] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 shadow-sm transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-[#F5F5F5]/50">
                          Publications Anormales
                        </span>
                        <AlertOctagon className="w-4 h-4 text-[#EF4444]" />
                      </div>
                      <h3 className="text-3xl font-display font-medium text-[#EF4444] tracking-tight">
                        {posts.filter(p => p.isFlagged).length}
                      </h3>
                      <span className="text-[10px] font-mono text-[#EF4444] block mt-1">
                        Mise en suspens provisoire
                      </span>
                    </div>
                  </div>

                  {/* MODULE PILOTAGE INTELLIGENT */}
                  <div className="p-6 rounded-lg bg-[#0B0B0B] border border-[#D4AF37]/30 shadow-md">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]">
                          <Radio className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-md font-display font-semibold text-[#F5F5F5] uppercase tracking-wider">
                            Pilotage Intelligent & Modération Autonome (Étape 7)
                          </h4>
                          <span className="text-xs text-[#F5F5F5]/50">
                            Algorithme de surveillance nationale en temps réel
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={triggerGlobalSystemScan}
                        className="py-2.5 px-6 rounded-lg bg-[#D4AF37] text-[#0B0B0B] hover:bg-[#B48F17] transition-all font-display font-bold text-xs uppercase shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                      >
                        Lancer le diagnostic intelligent
                      </button>
                    </div>

                    {/* Scanner progress display */}
                    {scannerStatus !== "idle" && (
                      <div className="mb-6 p-4 rounded-lg bg-[#0B0B0B] border border-[#D4AF37]/10">
                        <div className="flex justify-between text-xs font-mono mb-2">
                          <span className="text-[#F5F5F5]/60">Analyse de la base utilisateur et des spams...</span>
                          <span className="text-[#D4AF37]">
                            {scannerStatus === "scanning" ? "Analyse en cours..." : "Scan completed !"}
                          </span>
                        </div>
                        <div className="w-full bg-[#D4AF37]/10 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: "0%" }}
                            animate={scannerStatus === "scanning" ? { width: "100%" } : { width: "100%" }}
                            transition={{ duration: 2.3, ease: "easeInOut" }}
                            className="bg-[#D4AF37] h-full shadow-[0_0_10px_rgba(212,175,55,0.7)]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Scan Diagnostic Feedback Results */}
                    {isScanFeedbackVisible && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded bg-[#D4AF37]/5 border border-[#D4AF37]/20 mb-4"
                      >
                        <div className="text-center md:border-r border-[#D4AF37]/10 p-2">
                          <span className="text-[10px] uppercase font-mono text-[#F5F5F5]/50 block">Croissance analysée</span>
                          <span className="text-xl font-display font-semibold text-[#10B981]">{autoStats.growthRate}</span>
                        </div>
                        <div className="text-center md:border-r border-[#D4AF37]/10 p-2">
                          <span className="text-[10px] uppercase font-mono text-[#F5F5F5]/50 block">Utilisateurs suspects</span>
                          <span className="text-xl font-display font-semibold text-[#EF4444]">{autoStats.suspiciousCount}</span>
                        </div>
                        <div className="text-center md:border-r border-[#D4AF37]/10 p-2">
                          <span className="text-[10px] uppercase font-mono text-[#F5F5F5]/50 block">Publications suspectes</span>
                          <span className="text-xl font-display font-semibold text-[#EF4444]">{autoStats.anomalyCount}</span>
                        </div>
                        <div className="text-center p-2">
                          <span className="text-[10px] uppercase font-mono text-[#F5F5F5]/50 block">Alertes de communes</span>
                          <span className="text-xl font-display font-semibold text-[#D4AF37]">{autoStats.alertCount}</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Anomalies listed directly */}
                    {autoFlaggedPosts.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-xs font-mono text-[#EF4444] uppercase tracking-wider font-semibold block">
                          ⚠️ Anomalies système trouvées en attente de validation :
                        </span>
                        {autoFlaggedPosts.map(post => (
                          <div key={post.id} className="flex justify-between items-center p-3 rounded bg-red-500/10 border border-red-500/20 text-xs">
                            <div className="flex items-center gap-3">
                              <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
                              <div>
                                <span className="font-semibold text-red-400 block">{post.authorArtisticName}</span>
                                <span className="text-[#F5F5F5]/70">"{post.content}"</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handlePerformActionOnPost(post.id, "approve")}
                                className="px-3 py-1 bg-[#10B981] text-[#0B0B0B] rounded font-semibold text-[10px] hover:bg-[#059669] transition-all"
                              >
                                Ignorer
                              </button>
                              <button
                                onClick={() => handlePerformActionOnPost(post.id, "delete")}
                                className="px-3 py-1 bg-[#EF4444] text-[#F5F5F5] rounded font-semibold text-[10px] hover:bg-red-700 transition-all"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ACTIVE RECENT GOMBOS DANS LE SYSTEME */}
                  <div className="space-y-4">
                    <h4 className="text-sm uppercase font-mono font-bold tracking-widest text-[#D4AF37]">
                      🎼 Suivi Actuel des Contrats de Gombos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gombos.map(gombo => (
                        <div key={gombo.id} className="p-5 rounded-lg border border-[#D4AF37]/15 bg-[#0B0B0B]/40 hover:border-[#D4AF37]/40 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-display font-semibold text-[#F5F5F5] text-md">
                              {gombo.title}
                            </h5>
                            <span className="bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded text-[10px] font-mono uppercase">
                              {gombo.location}
                            </span>
                          </div>
                          <p className="text-xs text-[#F5F5F5]/70 line-clamp-2 my-2 leading-relaxed">
                            {gombo.description}
                          </p>
                          <div className="flex justify-between items-center pt-3 border-t border-[#D4AF37]/10 text-xs mt-3">
                            <div>
                              <span className="text-[#F5F5F5]/50 block text-[10px] uppercase font-mono">Budget</span>
                              <span className="text-md font-semibold text-[#D4AF37] font-mono">
                                {gombo.budget.toLocaleString()} FCFA
                              </span>
                            </div>
                            <div>
                              <span className="text-[#F5F5F5]/50 block text-[10px] uppercase font-mono font-right align-right text-right">Commission</span>
                              <span className="text-xs font-semibold text-[#10B981] block text-right font-mono">
                                {(gombo.budget * gombo.commissionRate).toLocaleString()} FCFA ({(gombo.commissionRate * 100)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ----------------------------------------------------
                                VIEW: LE TAM-TAM GOMBOS
                  ---------------------------------------------------- */}
              {activeMenu === "gombos" && (
                <div className="space-y-6">
                  {/* TAM-TAM Daily highlights section */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {/* Fire Gombo du Jour */}
                    <div className="p-5 rounded-lg bg-gradient-to-br from-[#0B0B0B] to-[#D4AF37]/10 border border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)] relative overflow-hidden">
                      <div className="absolute right-[-10px] bottom-[-10px] text-[#D4AF37]/10 scale-150 transform rotate-12">
                        <Flame className="w-24 h-24" />
                      </div>
                      <span className="text-[10px] uppercase font-mono bg-[#D4AF37] text-[#0B0B0B] px-2 py-0.5 rounded-full font-bold block w-fit mb-3">
                        🔥 Gombo du Jour
                      </span>
                      <h4 className="text-sm font-semibold font-display text-[#F5F5F5]">Mariage Traditionnel Bingerville</h4>
                      <p className="text-[11px] text-[#F5F5F5]/75 mt-1">Budget : 1 800 000 FCFA</p>
                    </div>

                    {/* Talent du Jour */}
                    <div className="p-5 rounded-lg bg-[#0B0B0B] border border-[#D4AF37]/30">
                      <span className="text-[10px] uppercase font-mono bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full font-bold block w-fit mb-3">
                        👑 Talent du Jour
                      </span>
                      <h4 className="text-sm font-semibold font-display text-[#F5F5F5]">Ariel Sheney G</h4>
                      <p className="text-[11px] text-[#F5F5F5]/75 mt-1">Commune : Cocody</p>
                    </div>

                    {/* Defi du Jour */}
                    <div className="p-5 rounded-lg bg-[#0B0B0B] border border-[#D4AF37]/30">
                      <span className="text-[10px] uppercase font-mono bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 px-2 py-0.5 rounded-full font-bold block w-fit mb-3">
                        🎯 Défi du Gombo
                      </span>
                      <h4 className="text-sm font-semibold font-display text-[#F5F5F5]">Trouve 1 clavier Zouglou</h4>
                      <p className="text-[11px] text-[#F5F5F5]/75 mt-1">Récompense : +100 XP / +10% Prestige</p>
                    </div>

                    {/* Gombos pres de moi (Location highlights) */}
                    <div className="p-5 rounded-lg bg-[#0B0B0B] border border-[#D4AF37]/30">
                      <span className="text-[10px] uppercase font-mono bg-emerald-500/10 text-[#10B981] border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold block w-fit mb-3">
                        🌍 Gombos près de moi
                      </span>
                      <h4 className="text-sm font-semibold font-display text-[#F5F5F5]">Cocody & Yopougon</h4>
                      <p className="text-[11px] text-[#F5F5F5]/75 mt-1">3 Gombos disponibles dans un rayon de 5km</p>
                    </div>
                  </div>

                  {/* FORM TO PUBLISH NEW GOMBO */}
                  <div className="p-6 rounded-lg bg-[#0B0B0B] border border-[#D4AF37]/20">
                    <h4 className="text-sm uppercase font-mono font-bold tracking-wider text-[#D4AF37] mb-4">
                      🎼 Publier un Nouveau Gombo sur le Réseau
                    </h4>
                    <form onSubmit={handleCreateGombo} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Titre de l'Opportunité</label>
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
                          <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Budget (FCFA)</label>
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
                          <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Commission (%)</label>
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
                          <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Commune Abidjan</label>
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
                        <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Description des Prérequis</label>
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
                        className="py-2.5 bg-[#D4AF37] text-[#0B0B0B] hover:bg-[#B48F17] transition-all rounded font-display font-bold uppercase text-xs tracking-wider shadow-[0_0_10px_rgba(212,175,55,0.2)] md:col-span-2 mt-2"
                      >
                        Enregistrer et publier sur le Tam-Tam
                      </button>
                    </form>
                  </div>

                  {/* GOMBOS DIRECTORY */}
                  <div className="space-y-4">
                    <h4 className="text-sm uppercase font-mono font-bold tracking-widest text-[#D4AF37]">
                      Explorez l'ensemble des Gombos Actifs
                    </h4>
                    <div className="space-y-3">
                      {gombos.map(g => (
                        <div key={g.id} className={`p-5 rounded-lg border transition-all ${g.isBoosted ? "border-orange-500/40 bg-gradient-to-r from-[#0C0601] to-[#0B0B0B] shadow-[0_0_12px_rgba(249,115,22,0.08)]" : "border-[#D4AF37]/15 bg-[#0B0B0B] hover:border-[#D4AF37]/45"}`}>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                              {g.isBoosted && (
                                <span className="text-[9px] font-mono bg-gradient-to-r from-orange-500 to-amber-500 text-black px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1 shadow-[0_0_10px_rgba(249,115,22,0.4)] animate-pulse">
                                  🔥 En vedette
                                </span>
                              )}
                              <h5 className="font-display font-semibold text-md text-[#F5F5F5]">{g.title}</h5>
                              <span className="text-[9px] font-mono border border-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded">
                                {g.location}
                              </span>
                            </div>
                            <p className="text-xs text-[#F5F5F5]/60 mt-1">{g.description}</p>
                            <span className="text-[9px] font-mono text-[#F5F5F5]/40 block mt-2">
                              Publié par {g.organizerName} • applicants : {g.applicantsCount}
                            </span>
                          </div>

                          <div className="text-right shrink-0 ml-4">
                            <span className="text-[#D4AF37] font-mono font-bold text-lg block">
                              {g.budget.toLocaleString()} FCFA
                            </span>
                            <button
                              onClick={() => handleAppointGomboDuJour(g.id)}
                              className="text-[9px] uppercase font-mono font-semibold bg-[#D4AF37]/5 border border-[#D4AF37]/10 text-[#D4AF37] px-2.5 py-1 rounded hover:bg-[#D4AF37]/15 mt-2 transition-all"
                            >
                              Faire Gombo du Jour
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
