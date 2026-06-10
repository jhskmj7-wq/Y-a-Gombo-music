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
  ShieldAlert
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
  const [activeMenu, setActiveMenu] = useState<AdminMenu>("dashboard");
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

  const [kycActiveTab, setKycActiveTab] = useState<"pending" | "express" | "approved" | "rejected">("pending");
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

      return () => {
        unsubscribeUsers();
        unsubscribeGombos();
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

  const handleApproveKYC = async (userId: string, express: boolean = false) => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        const u = { ...user, kycStatus: "approved" as const, isCertified: true };
        saveToFirestore("users", user.id, u);
        return u;
      }
      return user;
    });
    setUsers(updatedUsers);
    addToTerminal(`[👑 CERTIFICATION] Gombo ID approuvé avec succès pour ${users.find(u => u.id === userId)?.artisticName}. ${express ? "⚡ Traitement Express." : ""}`);

    setBrief(prev => ({
      ...prev,
      kycRequestsCount: Math.max(0, prev.kycRequestsCount - 1)
    }));
  };

  const handleRejectKYC = async (userId: string) => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        const u = { ...user, kycStatus: "rejected" as const, isCertified: false };
        saveToFirestore("users", user.id, u);
        return u;
      }
      return user;
    });
    setUsers(updatedUsers);
    addToTerminal(`[🛡️ GOMBO ID] Certification déclinée pour l'artiste.`);
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

          {/* SLOGAN PRESTIGE */}
          <div className="p-4 rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/10 mb-6 text-center text-xs text-[#D4AF37] italic">
            "🎼 Ton héritage attire les gombos."
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="space-y-1">
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
              {activeMenu === "dashboard" && "Pilotage Intelligent & Modération"}
              {activeMenu === "gombos" && "Le Grand Tam-Tam & Gombos"}
              {activeMenu === "renforts" && "Renforts Artistes Appliqués"}
              {activeMenu === "kyc" && "Gombo ID - Base des Certifications"}
              {activeMenu === "revision" && "File de Révision Modérateur"}
              {activeMenu === "alertes" && "Centre d'Alerte de Communes d'Abidjan"}
              {activeMenu === "caisse" && "La Caisse & Revenus Premium"}
              {activeMenu === "analytics" && "Analytique d'Héritage Musical"}
            </h2>
            <p className="text-xs text-[#F5F5F5]/60 mt-0.5">
              Centre de commandement souverain pour un seul administrateur.
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
                        <div key={g.id} className="p-5 rounded-lg border border-[#D4AF37]/15 bg-[#0B0B0B] flex justify-between items-center hover:border-[#D4AF37]/45 transition-all">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
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
                      <div key={renfort.id} className="p-5 rounded-lg border border-[#D4AF37]/15 bg-[#0B0B0B] flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/5 border border-[#D4AF37]/30 flex items-center justify-center font-bold text-[#D4AF37]">
                            {renfort.applicantArtisticName.charAt(0)}
                          </div>
                          <div>
                            <h5 className="font-display font-semibold text-sm text-[#F5F5F5]">
                              {renfort.applicantArtisticName} ({renfort.applicantName})
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

                    <div className="flex gap-2">
                      <button
                        onClick={() => setKycActiveTab("pending")}
                        className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "pending" ? "bg-[#D4AF37] text-black" : "border border-[#D4AF37]/20 text-[#D4AF37]/80"}`}
                      >
                        En Attente ({users.filter(u => u.kycStatus === "pending").length})
                      </button>
                      <button
                        onClick={() => setKycActiveTab("approved")}
                        className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "approved" ? "bg-[#D4AF37] text-black" : "border border-[#D4AF37]/20 text-[#D4AF37]/80"}`}
                      >
                        Certifiés
                      </button>
                      <button
                        onClick={() => setKycActiveTab("rejected")}
                        className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "rejected" ? "bg-[#D4AF37] text-black" : "border border-[#D4AF37]/20 text-[#D4AF37]/80"}`}
                      >
                        Rejetés
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
                        if (kycActiveTab === "pending") return u.kycStatus === "pending";
                        if (kycActiveTab === "approved") return u.kycStatus === "approved";
                        if (kycActiveTab === "rejected") return u.kycStatus === "rejected";
                        return true;
                      })
                      .map(user => (
                        <div key={user.id} className="p-5 rounded-lg border border-[#D4AF37]/25 bg-[#0B0B0B] space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] bg-black flex items-center justify-center font-bold text-[#D4AF37]">
                                {user.artisticName.charAt(0)}
                              </div>
                              <div>
                                <h5 className="font-display font-semibold text-md text-[#F5F5F5] flex items-center gap-2">
                                  {user.artisticName}
                                  {user.isCertified && (
                                    <span className="text-[10px] bg-[#D4AF37] text-black px-1.5 py-0.5 rounded uppercase font-mono font-bold tracking-wider">
                                      Elite Certifié
                                    </span>
                                  )}
                                </h5>
                                <p className="text-xs text-[#F5F5F5]/60">{user.name} • l'héritage musical de <strong className="text-white">{user.commune}</strong></p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {user.kycStatus === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleApproveKYC(user.id, true)}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-[10px] uppercase px-3 py-1.5 rounded transition-all"
                                  >
                                    Certification Express
                                  </button>
                                  <button
                                    onClick={() => handleRejectKYC(user.id)}
                                    className="bg-[#EF4444]/20 border border-[#EF4444]/30 hover:bg-[#EF4444]/40 text-[#EF4444] font-semibold text-[10px] uppercase px-3 py-1.5 rounded transition-all"
                                  >
                                    Rejeter
                                  </button>
                                </>
                              )}
                              
                              <button
                                onClick={() => startEditingProfile(user)}
                                className="bg-transparent border border-[#D4AF37]/40 hover:border-[#D4AF37] text-[#D4AF37] text-[10px] uppercase font-mono px-3 py-1.5 rounded transition-all"
                              >
                                Modifier Héritage
                              </button>
                            </div>
                          </div>

                          {/* PROFILE PROGRESS BAR SLITS (PHASE 5 REQUIREMENTS) */}
                          <div className="p-3.5 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {activeMenu === "caisse" && (
                <div className="space-y-6">
                  {/* CAISSE SUMMARY CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-lg border border-[#D4AF37]/20 bg-black/40">
                      <span className="text-[10px] uppercase font-mono text-[#F5F5F5]/50 block">Part Gombo d'Affaire Enregistrée</span>
                      <span className="text-2xl font-display font-medium text-[#D4AF37] block mt-1 font-mono">
                        1 550 000 FCFA
                      </span>
                    </div>

                    <div className="p-5 rounded-lg border border-[#D4AF37]/20 bg-black/40">
                      <span className="text-[10px] uppercase font-mono text-[#F5F5F5]/50 block">Revenus de commissions acquis</span>
                      <span className="text-2xl font-display font-medium text-[#10B981] block mt-1 font-mono">
                        {transactions.reduce((acc, curr) => acc + (curr.type === "commission" ? curr.amount : 0), 0).toLocaleString()} FCFA
                      </span>
                    </div>

                    <div className="p-5 rounded-lg border border-[#D4AF37]/20 bg-black/40">
                      <span className="text-[10px] uppercase font-mono text-[#F5F5F5]/50 block">Revenus Souscriptions Elite Premium</span>
                      <span className="text-2xl font-display font-medium text-[#D4AF37] block mt-1 font-mono">
                        {transactions.reduce((acc, curr) => acc + (curr.type === "subscription" ? curr.amount : 0), 0).toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>

                  {/* TRANSACTION LOG */}
                  <div className="space-y-4">
                    <h4 className="text-sm uppercase font-mono font-bold tracking-widest text-[#D4AF37]">
                      Journal de Transactions de Caisse
                    </h4>
                    <div className="space-y-2.5">
                      {transactions.map(tx => (
                        <div key={tx.id} className="p-4 rounded-lg bg-[#0B0B0B] border border-[#D4AF37]/10 flex justify-between items-center text-xs">
                          <div className="flex items-center gap-3">
                            <Landmark className="w-4 h-4 text-[#D4AF37]" />
                            <div>
                              <span className="font-semibold block">{tx.description}</span>
                              <span className="text-[#F5F5F5]/45 text-[10px] font-mono">{tx.timestamp} • Artiste: {tx.userArtisticName}</span>
                            </div>
                          </div>
                          <span className={`font-mono font-bold text-md ${tx.type === "payout" ? "text-red-400" : "text-emerald-400"}`}>
                            {tx.type === "payout" ? "-" : "+"}{tx.amount.toLocaleString()} FCFA
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
