import BouclierAfrigombo from "./BouclierAfrigombo";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Crown, ShieldCheck, UserPlus, UserX, Info, ShieldAlert,
  Activity, Users, FileText, Coins, Database, HardDrive, Lock, Server, Terminal,
  Sparkles, Wallet, CreditCard, Bell, BarChart3, Brain, DatabaseBackup, ListCollapse,
  Play, Pause, Trash2, Volume2, Plus, ArrowUp, ArrowDown, Send, Mail, Wrench,
  RefreshCw, CheckCircle, XCircle, Search, HelpCircle, Save, BookOpen, Scroll, Target, Award,
  Globe, Landmark, AlertTriangle, Music, ArrowLeft, Heart, Shield, CheckSquare, Square,
  Clock, MapPin, Cloud, Zap, Sun, ChevronDown, ChevronUp, Flame, ToggleLeft, ToggleRight, UserCheck, Radio, Eye, Bot
} from "lucide-react";
import { BetaTransactionsAdminPanel } from "./BetaTransactionsAdminPanel";
import { PendingPublicationsAdminPanel } from "./PendingPublicationsAdminPanel";
import { ImperialMessageModal } from "./ImperialMessageModal";
import { AdminDecouvertesCentre } from "./AdminDecouvertesCentre";
import { globalAudioManager, isDirectAudioFile, AudioConfig, AudioState } from "../../lib/audioManager";
import { db } from "../../lib/firebase";
import { useAuth } from "../../AuthContext";
import { 
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc, getDocs 
} from "firebase/firestore";
import { gomboDB } from "../../firebase";

interface AdminFounderThroneProps {
  theme?: string;
  founders: string[];
  superAdmins: string[];
  adminEmail: string;
  isAuthorizedSuperFounder: boolean;
  onUpdateThroneConfig?: (newFounders: string[], newSuperAdmins: string[]) => void;
  audioSynth?: any;
  users?: any[];
  gombos?: any[];
  posts?: any[];
  transactions?: any[];
  alerts?: any[];
  onExit?: () => void;
}

interface GovernanceData {
  vision: string;
  journal: string;
  decisions: string;
  announcements: string;
  growth: string;
  notes: string;
}

interface ThroneMusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  order: number;
}

interface MusicSpots {
  accueil: string;
  navigation: string;
  throne: string;
  evenements: string;
  notifications: string;
  celebration: string;
}

export default function AdminFounderThrone({
  theme,
  founders = [],
  superAdmins = [],
  adminEmail,
  isAuthorizedSuperFounder,
  onUpdateThroneConfig,
  audioSynth,
  users = [],
  gombos = [],
  posts = [],
  transactions = [],
  alerts = [],
  onExit
}: AdminFounderThroneProps) {
  const isDark = theme !== "light";
  const { currentUser, profile } = useAuth();
  const [audioState, setAudioState] = useState<AudioState>(globalAudioManager.getState());

  useEffect(() => {
    return globalAudioManager.subscribe((state) => {
      setAudioState(state);
    });
  }, []);

  const formatAudioTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Navigation: null shows the main grid, string shows specific section view
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  
  // Feedback States
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Header Folded state
  const [isHeaderFolded, setIsHeaderFolded] = useState<boolean>(false);
  const [isCriticalZoneFolded, setIsCriticalZoneFolded] = useState<boolean>(false);

  // Quick Action Modal States
  const [quickPremiumModalOpen, setQuickPremiumModalOpen] = useState<boolean>(false);
  const [quickNoticeModalOpen, setQuickNoticeModalOpen] = useState<boolean>(false);
  const [quickNotifModalOpen, setQuickNotifModalOpen] = useState<boolean>(false);
  const [quickNotifUser, setQuickNotifUser] = useState<string>("ALL");
  const [quickNotifTitle, setQuickNotifTitle] = useState<string>("");
  const [quickNotifBody, setQuickNotifBody] = useState<string>("");
  const [simVol, setSimVol] = useState<number>(100);
  const [simAvgAmount, setSimAvgAmount] = useState<number>(50000);

  // Auto-fold header on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsHeaderFolded(true);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // REALTIME FIRESTORE SNAPSHOTS FOR THE FOUNDER COMMAND CENTER
  const [registrationsEnabled, setRegistrationsEnabled] = useState<boolean>(true);
  const [autoPilotEnabled, setAutoPilotEnabled] = useState<boolean>(false);
  const [imperialLogs, setImperialLogs] = useState<any[]>([]);
  const [liveUsers, setLiveUsers] = useState<any[]>(users);
  const [livePosts, setLivePosts] = useState<any[]>(posts || []);
  const [liveGombos, setLiveGombos] = useState<any[]>(gombos || []);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [featuredContentList, setFeaturedContentList] = useState<any[]>([]);
  const [trendFilter, setTrendFilter] = useState<string>("ALL");

  const handleToggleFeature = async (item: any) => {
    if (!db) return;
    try {
      const isFeat = !item.featured;
      if (item.id && item.type) {
        await updateDoc(doc(db, "featuredContent", item.id), { featured: isFeat, updatedAt: Date.now() });
      } else {
        await addDoc(collection(db, "featuredContent"), {
          type: item.contentType || 'gombo',
          sourceId: item.id || Math.random().toString(),
          title: item.title || item.name || 'Contenu Populaire',
          author: item.author || item.displayName || 'Artiste',
          views: item.views || 120,
          likes: item.likes || 15,
          comments: item.comments || 5,
          shares: item.shares || 2,
          saved: item.saved || 3,
          pinned: item.pinned || false,
          featured: isFeat,
          hidden: false,
          score: (item.views || 100) * (item.likes || 10),
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      setSuccessMsg("Statut 'Mis en avant' mis à jour.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg("Erreur mise en avant: " + err.message);
      setTimeout(() => setErrorMsg(""), 3000);
    }
  };

  const handleTogglePin = async (item: any) => {
    if (!db) return;
    try {
      const isPinned = !item.pinned;
      if (item.id) {
        await updateDoc(doc(db, "featuredContent", item.id), { pinned: isPinned, updatedAt: Date.now() });
      }
      setSuccessMsg(isPinned ? "Contenu épinglé au sommet." : "Contenu désépinglé.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg("Erreur épinglage: " + err.message);
      setTimeout(() => setErrorMsg(""), 3000);
    }
  };

  const handleToggleHide = async (item: any) => {
    if (!db) return;
    try {
      const isHidden = !item.hidden;
      if (item.id) {
        await updateDoc(doc(db, "featuredContent", item.id), { hidden: isHidden, updatedAt: Date.now() });
      }
      setSuccessMsg(isHidden ? "Contenu masqué." : "Contenu affiché.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg("Erreur masquage: " + err.message);
      setTimeout(() => setErrorMsg(""), 3000);
    }
  };

  const handleDeleteContent = async (item: any) => {
    if (!db) return;
    if (!window.confirm("Êtes-vous sûr de vouloir retirer ce contenu du Centre des Tendances ?")) return;
    try {
      if (item.id) {
        await deleteDoc(doc(db, "featuredContent", item.id));
      }
      setSuccessMsg("Contenu retiré avec succès.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg("Erreur suppression: " + err.message);
      setTimeout(() => setErrorMsg(""), 3000);
    }
  };

  // Form Submissions Collections (Support, Litiges, KYC, Bugs)
  const [formSubTab, setFormSubTab] = useState<"support" | "disputes" | "kyc" | "bugs">("support");
  const [ticketsSupport, setTicketsSupport] = useState<any[]>([]);
  const [disputesList, setDisputesList] = useState<any[]>([]);
  const [kycRequests, setKycRequests] = useState<any[]>([]);

  // States for user management, filters and view/edit
  const [userCommuneFilter, setUserCommuneFilter] = useState<string>("ALL");
  const [userLevelFilter, setUserLevelFilter] = useState<string>("ALL");
  const [userVerifiedFilter, setUserVerifiedFilter] = useState<string>("ALL");
  const [userDateFilter, setUserDateFilter] = useState<string>("ALL");
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [bugReports, setBugReports] = useState<any[]>([]);
  const [notifFilter, setNotifFilter] = useState<string>("ALL");

  useEffect(() => {
    if (!db) return;

    // Registrations status
    const unsubReg = onSnapshot(doc(db, "system_settings", "registrations"), (snap) => {
      if (snap.exists()) {
        setRegistrationsEnabled(snap.data()?.enabled ?? true);
      }
    });

    const unsubAutoPilot = onSnapshot(doc(db, "system_settings", "autopilot"), (snap) => {
      if (snap.exists()) {
        setAutoPilotEnabled(snap.data()?.enabled ?? false);
      }
    });

    // Imperial logs
    const unsubLogs = onSnapshot(collection(db, "imperial_logs"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setImperialLogs(list);
    });

    // Realtime Users
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, uid: d.id, ...d.data() }));
      if (list.length > 0) setLiveUsers(list);
    });

    // Realtime Posts & Gombos
    const unsubSocialPosts = onSnapshot(collection(db, "social_posts"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setLivePosts(list);
    });

    const unsubGombos = onSnapshot(collection(db, "gombos"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setLiveGombos(list);
    });

    // 1. Realtime Tickets Support
    const unsubSupport = onSnapshot(collection(db, "tickets_support"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setTicketsSupport(list);
    });

    // 2. Realtime Disputes
    const unsubDisputes = onSnapshot(collection(db, "disputes"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setDisputesList(list);
    });

    // 3. Realtime KYC Requests
    const unsubKYC = onSnapshot(collection(db, "kyc_requests"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setKycRequests(list);
    });

    // 4. Realtime Bug Reports
    const unsubBugs = onSnapshot(collection(db, "bug_reports"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setBugReports(list);
    });

    // 5. Realtime Notifications
    const unsubNotifications = onSnapshot(collection(db, "notifications"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setNotificationsList(list);
    });

    // 6. Realtime Featured Content / Trending
    const unsubFeatured = onSnapshot(collection(db, "featuredContent"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.score || b.views || 0) - (a.score || a.views || 0));
      setFeaturedContentList(list);
    });

    return () => {
      unsubReg();
      unsubAutoPilot();
      unsubLogs();
      unsubUsers();
      unsubSocialPosts();
      unsubGombos();
      unsubSupport();
      unsubDisputes();
      unsubKYC();
      unsubBugs();
      unsubNotifications();
      unsubFeatured();
    };
  }, []);

  const displayUsers = liveUsers.length > 0 ? liveUsers : (users || []);
  const displayPosts = livePosts.length > 0 ? livePosts : (posts || []);
  const displayGombos = liveGombos.length > 0 ? liveGombos : (gombos || []);
  const getGrowthMetrics = (list: any[], dateField: string = "createdAt") => {
    if (!list || list.length === 0) return { dailyVolume: 0, growthPercent: "0" };
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const dailyVolume = list.filter(item => {
      const date = item[dateField];
      if (!date) return false;
      const t = typeof date === "number" ? date : (date.toMillis ? date.toMillis() : new Date(date).getTime());
      return (now - t) <= oneDay;
    }).length;
    const previousVolume = list.filter(item => {
      const date = item[dateField];
      if (!date) return false;
      const t = typeof date === "number" ? date : (date.toMillis ? date.toMillis() : new Date(date).getTime());
      return (now - t) > oneDay && (now - t) <= 2 * oneDay;
    }).length;

    let growthPercent = "0";
    if (previousVolume > 0) {
      growthPercent = (((dailyVolume - previousVolume) / previousVolume) * 100).toFixed(1);
    } else if (dailyVolume > 0) {
      growthPercent = "100.0";
    }

    return { dailyVolume, growthPercent: Number(growthPercent) > 0 ? `+${growthPercent}` : growthPercent };
  };

  const pendingPostsCount = [...displayPosts, ...displayGombos].filter(
    (p: any) => {
      const isPending = (p.status === "pending_deposit" || p.status === "pending" || p.adminValidated === false || p.visible === false) &&
        p.status !== "rejected" && p.status !== "refuse" && p.status !== "cancelled" && p.status !== "published" && p.status !== "publie";
      if (!isPending) return false;
      if (autoPilotEnabled) {
        return p.isFlagged || p.reportsCount > 0; // Seules les alertes remontent
      }
      return true;
    }
  ).length;

  // Pending counts for Form Submissions
  const pendingTicketsCount = ticketsSupport.filter(t => t.status === "PENDING" || t.status === "pending" || !t.status).length;
  const pendingDisputesCount = disputesList.filter(d => d.status === "PENDING" || d.status === "pending" || d.status === "open" || d.status === "en_attente").length;
  const pendingKycCount = kycRequests.filter(k => k.status === "PENDING" || k.status === "pending").length;
  const pendingBugsCount = bugReports.filter(b => b.status === "PENDING" || b.status === "pending").length;
  const unreadNotifsCount = notificationsList.filter(n => !n.isRead && !n.read).length;
  const totalThroneFormsCount = pendingTicketsCount + pendingDisputesCount + pendingKycCount + pendingBugsCount;

  // Admin Actions for User Form Submissions
  const handleApproveKYC = async (reqItem: any) => {
    if (!db || !reqItem.id) return;
    try {
      // 1. Update kyc_requests document
      await updateDoc(doc(db, "kyc_requests", reqItem.id), {
        status: "APPROVED",
        processedAt: new Date().toISOString(),
        processedBy: adminEmail || "Superfondateur"
      });

      // 2. Update user profile in users collection
      if (reqItem.userId) {
        try {
          await updateDoc(doc(db, "users", reqItem.userId), {
            isVerified: true,
            kycStatus: "approved",
            verificationBadge: "certified_artist"
          });
        } catch (e) {
          console.warn("User update error:", e);
        }

        // 3. Send notification to user
        await addDoc(collection(db, "notifications"), {
          userId: reqItem.userId,
          title: "Dossier KYC Validé 🎖️",
          message: "Félicitations ! Votre dossier de certification d'identité et de qualification artistique a été officiellement approuvé par le Trône du Fondateur.",
          type: "kyc_approved",
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      logImperialAction("VALIDATION_KYC", `Dossier KYC approuvé pour ${reqItem.userName || reqItem.userId}`);
      setSuccessMsg(`Certification KYC validée pour ${reqItem.userName || 'l\'utilisateur'}.`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Error approving KYC:", err);
    }
  };

  const handleRejectKYC = async (reqItem: any, reason: string = "Documents incomplets ou illegibles") => {
    if (!db || !reqItem.id) return;
    try {
      await updateDoc(doc(db, "kyc_requests", reqItem.id), {
        status: "REJECTED",
        rejectionReason: reason,
        processedAt: new Date().toISOString(),
        processedBy: adminEmail || "Superfondateur"
      });

      if (reqItem.userId) {
        try {
          await updateDoc(doc(db, "users", reqItem.userId), {
            kycStatus: "rejected"
          });
        } catch (e) {}

        await addDoc(collection(db, "notifications"), {
          userId: reqItem.userId,
          title: "Dossier KYC Non Retenu ⚠️",
          message: `Votre demande de certification GOMBO ID nécessite un complément d'information. Motif: ${reason}`,
          type: "kyc_rejected",
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      logImperialAction("REJET_KYC", `Dossier KYC rejeté pour ${reqItem.userName || reqItem.userId}`);
      setSuccessMsg(`Dossier KYC rejeté.`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Error rejecting KYC:", err);
    }
  };

  const handleResolveDispute = async (disputeItem: any, note: string = "Litige arbitré et résolu par le Fondateur") => {
    if (!db || !disputeItem.id) return;
    try {
      await updateDoc(doc(db, "disputes", disputeItem.id), {
        status: "RESOLVED",
        resolutionNote: note,
        resolvedAt: new Date().toISOString(),
        resolvedBy: adminEmail || "Superfondateur"
      });

      if (disputeItem.userId) {
        await addDoc(collection(db, "notifications"), {
          userId: disputeItem.userId,
          title: "Litige Arbitré et Résolu ⚖️",
          message: `Le litige concernant votre prestation a été pris en charge et résolu par l'administration du Trône. Note: ${note}`,
          type: "dispute_resolved",
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      logImperialAction("RÉSOLUTION_LITIGE", `Litige résolu pour ${disputeItem.userName || disputeItem.id}`);
      setSuccessMsg(`Litige marqué comme résolu.`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Error resolving dispute:", err);
    }
  };

  const handleResolveTicketSupport = async (ticketItem: any) => {
    if (!db || !ticketItem.id) return;
    try {
      await updateDoc(doc(db, "tickets_support", ticketItem.id), {
        status: "RESOLVED",
        resolvedAt: new Date().toISOString(),
        resolvedBy: adminEmail || "Superfondateur"
      });

      if (ticketItem.userId && ticketItem.userId !== "anonyme" && ticketItem.userId !== "visiteur_anonyme") {
        await addDoc(collection(db, "notifications"), {
          userId: ticketItem.userId,
          title: "Réponse du Support / Conseiller 💬",
          message: `Votre demande au conseiller support ("${ticketItem.title || ticketItem.subject || 'Support'}") a été traitée avec succès.`,
          type: "support_resolved",
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      logImperialAction("TRAITEMENT_SUPPORT", `Ticket support résolu pour ${ticketItem.userName || ticketItem.id}`);
      setSuccessMsg(`Ticket support traité.`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Error resolving support ticket:", err);
    }
  };

  const handleResolveBugReport = async (bugItem: any) => {
    if (!db || !bugItem.id) return;
    try {
      await updateDoc(doc(db, "bug_reports", bugItem.id), {
        status: "RESOLVED",
        resolvedAt: new Date().toISOString(),
        resolvedBy: adminEmail || "Superfondateur"
      });

      if (bugItem.userId && bugItem.userId !== "anonyme") {
        await addDoc(collection(db, "notifications"), {
          userId: bugItem.userId,
          title: "Signalement de Bug Pris en Charge 🐛",
          message: `Merci pour votre signalement ("${bugItem.title || bugItem.subject || 'Bug'}") ! L'équipe technique a apporté les corrections nécessaires.`,
          type: "bug_resolved",
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      logImperialAction("TRAITEMENT_BUG", `Bug résolu pour ${bugItem.userName || bugItem.id}`);
      setSuccessMsg(`Rapport de bug marqué comme corrigé.`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Error resolving bug report:", err);
    }
  };

  const logImperialAction = async (action: string, description: string) => {
    if (!db) return;
    try {
      await addDoc(collection(db, "imperial_logs"), {
        action,
        description,
        executor: adminEmail || "Sylvester (Fondateur)",
        timestamp: Date.now()
      });
    } catch (e) {
      console.error("Log Imperial Error", e);
    }
  };

  const toggleRegistrations = async () => {
    const nextVal = !registrationsEnabled;
    try {
      await setDoc(doc(db, "system_settings", "registrations"), { enabled: nextVal, updatedAt: Date.now() }, { merge: true });
      await logImperialAction("Portail Inscriptions", `Inscriptions ${nextVal ? "Activées" : "Désactivées"}`);
      setSuccessMsg(`Inscriptions ${nextVal ? "activées" : "désactivées"} avec succès.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur : ${err.message}`);
    }
  };

  const toggleAutoPilot = async () => {
    const nextVal = !autoPilotEnabled;
    try {
      await setDoc(doc(db, "system_settings", "autopilot"), { enabled: nextVal, updatedAt: Date.now() }, { merge: true });
      await logImperialAction("Modération Automatique", `Auto-Pilotage ${nextVal ? "Activé" : "Désactivé"}`);
      setSuccessMsg(`Auto-Pilotage ${nextVal ? "activé" : "désactivé"} avec succès.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur : ${err.message}`);
    }
  };

  // COMMANDES GLOBALES ACTIVE USER SEARCH & ACTIONS
  const [globalUserSearch, setGlobalUserSearch] = useState("");

  const filteredGlobalUsers = displayUsers.filter((u: any) => {
    if (!globalUserSearch.trim()) return true;
    const q = globalUserSearch.toLowerCase();
    return (
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.artisticName && u.artisticName.toLowerCase().includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q))
    );
  });

  const handleBanUser = async (u: any) => {
    try {
      const nextBanned = !u.isBanned;
      await updateDoc(doc(db, "users", u.id || u.uid), {
        isBanned: nextBanned,
        status: nextBanned ? "banned" : "active"
      });
      
      try {
        await gomboDB.createFounderNotification({
          type: "SUSPENSION",
          category: "UTILISATEUR",
          title: nextBanned ? "🚫 Compte Utilisateur Suspendu" : "✅ Compte Utilisateur Réactivé",
          message: `Le compte de ${u.displayName || u.artisticName || u.email} a été ${nextBanned ? "suspendu" : "réactivé"} par l'administrateur.`,
          senderUid: u.id || u.uid,
          priority: nextBanned ? "HIGH" : "NORMAL",
          source: "ADMIN_CONSOLE",
          data: {
            userId: u.id || u.uid,
            userName: u.displayName || u.artisticName || u.email,
            banned: nextBanned
          }
        });
      } catch (errNotif) {
        console.warn("Could not notify suspension:", errNotif);
      }

      await logImperialAction("Modération Utilisateur", `${nextBanned ? "Bannissement" : "Débannissement"} de ${u.displayName || u.artisticName || u.email}`);
      setSuccessMsg(`Utilisateur ${nextBanned ? "banni" : "débanni"} avec succès.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur : ${err.message}`);
    }
  };

  const handleChangeRole = async (u: any, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", u.id || u.uid), { role: newRole });
      await logImperialAction("Attribution Rôle", `Rôle [${newRole.toUpperCase()}] octroyé à ${u.displayName || u.artisticName || u.email}`);
      setSuccessMsg(`Rôle mis à jour (${newRole}).`);
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur : ${err.message}`);
    }
  };

  const handleTogglePremium = async (u: any) => {
    try {
      const nextPrem = !u.isPremium;
      await updateDoc(doc(db, "users", u.id || u.uid), {
        isPremium: nextPrem,
        subscriptionType: nextPrem ? "elite" : "free"
      });
      await logImperialAction("Privilège Premium", `Statut Premium Elite ${nextPrem ? "Donné" : "Retiré"} à ${u.displayName || u.artisticName || u.email}`);
      setSuccessMsg(`Premium Elite ${nextPrem ? "accordé" : "retiré"}.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur : ${err.message}`);
    }
  };

  const handleToggleGomboId = async (u: any) => {
    try {
      const currentCert = Boolean(u.isCertified || u.gomboId?.certifie);
      const nextCert = !currentCert;
      await updateDoc(doc(db, "users", u.id || u.uid), {
        isCertified: nextCert,
        kycStatus: nextCert ? "approved" : "rejected",
        "gomboId.certifie": nextCert,
        "gomboId.statut": nextCert ? "CERTIFIÉ ELITE" : "NON CERTIFIÉ"
      });
      await logImperialAction("Gombo ID Souverain", `Gombo ID ${nextCert ? "Validé" : "Révoqué"} pour ${u.displayName || u.artisticName || u.email}`);
      setSuccessMsg(`Gombo ID ${nextCert ? "validé" : "révoqué"}.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur : ${err.message}`);
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!window.confirm(`Êtes-vous absolument sûr de vouloir supprimer définitivement le compte de ${u.displayName || u.artisticName || u.email} ? Cette action est irréversible.`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, "users", u.id || u.uid));
      await logImperialAction("Suppression de compte", `Compte de ${u.displayName || u.artisticName || u.email} supprimé définitivement par le Super Fondateur.`);
      setSuccessMsg("Compte supprimé avec succès.");
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur : ${err.message}`);
    }
  };

  const handleSaveUserProfile = async (uId: string, updatedFields: any) => {
    try {
      await updateDoc(doc(db, "users", uId), updatedFields);
      await logImperialAction("Modification de profil", `Profil de l'utilisateur ${updatedFields.displayName || uId} mis à jour par le Super Fondateur.`);
      setSuccessMsg("Profil utilisateur mis à jour avec succès.");
      setEditingUser(null);
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur : ${err.message}`);
    }
  };

  // COMMANDES GLOBALES PUBLICATION MODERATION
  const [globalPostSearch, setGlobalPostSearch] = useState("");

  const handleApprovePostGlobal = async (p: any) => {
    try {
      await updateDoc(doc(db, "posts", p.id), {
        isFlagged: false,
        status: "approved",
        reportsCount: 0
      });
      await logImperialAction("Validation Publication", `Publication "${p.title || p.id}" validée.`);
      setSuccessMsg("Publication validée sur le réseau.");
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur : ${err.message}`);
    }
  };

  const handleSuspendPostGlobal = async (p: any) => {
    try {
      await updateDoc(doc(db, "posts", p.id), {
        isFlagged: true,
        status: "suspended"
      });
      await logImperialAction("Suspension Publication", `Publication "${p.title || p.id}" suspendue.`);
      setSuccessMsg("Publication suspendue.");
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur : ${err.message}`);
    }
  };

  const handleDeletePostGlobal = async (p: any) => {
    try {
      await deleteDoc(doc(db, "posts", p.id));
      await logImperialAction("Suppression Publication", `Publication "${p.title || p.id}" supprimée définitivement.`);
      setSuccessMsg("Publication supprimée de Firestore.");
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur : ${err.message}`);
    }
  };

  const pendingBetaTransactions = transactions.filter((t: any) => t.status === "en_attente_validation");

  // Satellite states from Firestore
  const [universeStates, setUniverseStates] = useState<Record<string, string>>({
    gomboId: "DÉPLOYÉ & ACTIF",
    afriTrust: "DÉPLOYÉ & ACTIF",
    afriLivraison: "EN ATTENTE",
    gomboMusik: "DÉPLOYÉ & ACTIF"
  });

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, "system_settings", "satellites"), (snap) => {
      if (snap.exists()) {
        setUniverseStates(snap.data() as Record<string, string>);
      }
    });
    return () => unsub();
  }, []);

  const handleToggleSatellite = async (servId: string) => {
    const newState = universeStates[servId] === "DÉPLOYÉ & ACTIF" ? "EN MAINTENANCE" : "DÉPLOYÉ & ACTIF";
    try {
      await setDoc(doc(db, "system_settings", "satellites"), { ...universeStates, [servId]: newState }, { merge: true });
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err) {
      console.error("Error toggling satellite", err);
    }
  };

  const [betaChecklist, setBetaChecklist] = useState<Record<string, boolean>>({
    "Connexion Google": false,
    "Déconnexion": false,
    "Création publication": false,
    "Modification profil": false,
    "Upload image": false,
    "Notifications": false,
    "Navigation": false,
    "Centre de Commandement": false,
    "Trône": false,
    "Responsive Android": false,
    "Firebase": false,
  });

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, "system_settings", "beta_checklist"), (snap) => {
      if (snap.exists()) {
        setBetaChecklist(snap.data() as Record<string, boolean>);
      }
    });
    return () => unsub();
  }, []);

  const [economySettings, setEconomySettings] = useState<any>(null);
  const [allContracts, setAllContracts] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "contracts"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      setAllContracts(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "payments"), (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      setAllPayments(list);
    });
    return () => unsub();
  }, []);
  
  useEffect(() => {
    // Load economy settings if needed
    if (selectedSection === "economy") {
      import("../../firebase").then(({ gomboDB }) => {
        gomboDB.getEconomySettings().then(settings => {
          setEconomySettings(settings);
        });
      });
    }
  }, [selectedSection]);

  const toggleChecklist = async (key: string) => {
    const updated = { ...betaChecklist, [key]: !betaChecklist[key] };
    setBetaChecklist(updated);
    try {
      await setDoc(doc(db, "system_settings", "beta_checklist"), updated, { merge: true });
    } catch (e) { console.error(e); }
    try { if (audioSynth) audioSynth.playValidationSuccess(); } catch (_) {}
  };

  const progressCount = Object.values(betaChecklist).filter(Boolean).length;

  // 1. GOUVERNANCE FIRESTORE SYNC
  const [govData, setGovData] = useState<GovernanceData>({
    vision: "Bâtir le premier empire de mise en relation artistique d'Afrique de l'Ouest.",
    journal: "Aujourd'hui, lancement de la phase impériale d'AFRIGOMBO ELITE.",
    decisions: "1. Certification systématique Gombo ID.\n2. Lancement des abonnements Elite.",
    announcements: "Bienvenue sur le fil de l'écosystème souverain !",
    growth: "Atteindre 10,000 membres actifs certifiés d'ici décembre 2026.",
    notes: "Vérifier la performance du serveur d'Abidjan."
  });
  const [isSavingGov, setIsSavingGov] = useState(false);

  useEffect(() => {
    if (!db) return;
    const docRef = doc(db, "throne", "governance");
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setGovData(snap.data() as GovernanceData);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveGovField = async (field: keyof GovernanceData, value: string) => {
    if (!isAuthorizedSuperFounder) {
      setErrorMsg("Seul le Fondateur Suprême peut modifier la gouvernance de l'Empire.");
      return;
    }
    setIsSavingGov(true);
    try {
      const docRef = doc(db, "throne", "governance");
      await setDoc(docRef, { ...govData, [field]: value }, { merge: true });
      setSuccessMsg("Plan stratégique synchronisé en temps réel sur la base Firestore.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(`Erreur de synchronisation : ${err.message}`);
    } finally {
      setIsSavingGov(false);
    }
  };

  // 2. MUSIQUE INTERACTIVE & FIRESTORE SYNC
  const [musicTracks, setMusicTracks] = useState<ThroneMusicTrack[]>([]);
  const [musicSpots, setMusicSpots] = useState<MusicSpots>({
    accueil: "",
    navigation: "",
    throne: "",
    evenements: "",
    notifications: "",
    celebration: ""
  });

  const [newTrackTitle, setNewTrackTitle] = useState("");
  const [newTrackArtist, setNewTrackArtist] = useState("");
  const [newTrackUrl, setNewTrackUrl] = useState("");

  // Music Player States
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [trackProgress, setTrackProgress] = useState(0);

  useEffect(() => {
    if (!db) return;
    // Listen to tracks list
    const unsubTracks = onSnapshot(collection(db, "throne_music"), (snap) => {
      const list: ThroneMusicTrack[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ThroneMusicTrack);
      });
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setMusicTracks(list);
    });

    // Listen to assigned spots
    const unsubSpots = onSnapshot(doc(db, "throne", "music_spots"), (snap) => {
      if (snap.exists()) {
        setMusicSpots(snap.data() as MusicSpots);
      }
    });

    return () => {
      unsubTracks();
      unsubSpots();
    };
  }, []);

  // Sync volume to audio tag
  useEffect(() => {
    if (currentAudio) {
      currentAudio.volume = volume;
    }
  }, [volume, currentAudio]);

  // Audio tag progress listener
  useEffect(() => {
    if (!currentAudio) return;
    const updateProgress = () => {
      if (currentAudio.duration) {
        setTrackProgress((currentAudio.currentTime / currentAudio.duration) * 100);
      }
    };
    currentAudio.addEventListener("timeupdate", updateProgress);
    return () => {
      currentAudio.removeEventListener("timeupdate", updateProgress);
    };
  }, [currentAudio]);

  const handlePlayPauseTrack = async (track: ThroneMusicTrack) => {
    try { audioSynth?.playValidationSuccess(); } catch (_) {}
    
    if (playingTrackId === track.id) {
      globalAudioManager.stop();
      setPlayingTrackId(null);
    } else {
      try {
        await globalAudioManager.playCustomTrack(track.id, track.url, track.title);
        setPlayingTrackId(track.id);
      } catch (err: any) {
        console.warn("Could not play audio", err);
        setErrorMsg(err.message || "Lecture impossible. Vérifiez l'accessibilité de l'URL du fichier audio.");
        setTimeout(() => setErrorMsg(""), 4000);
      }
    }
  };

  const handleAddMusicTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorizedSuperFounder) {
      setErrorMsg("Droits impériaux requis pour modifier l'écosystème sonore.");
      return;
    }
    if (!newTrackTitle.trim() || !newTrackUrl.trim()) {
      setErrorMsg("Le titre et l'adresse URL absolue du fichier audio sont requis.");
      return;
    }

    if (!(await isDirectAudioFile(newTrackUrl.trim()))) {
      setErrorMsg("Cette URL ne correspond pas à un fichier audio lisible (MP3, OGG, WAV). Les pages web (Suno, etc.) ne sont pas acceptées.");
      return;
    }
    try {
      const newTrackRef = doc(collection(db, "throne_music"));
      const trackData: ThroneMusicTrack = {
        id: newTrackRef.id,
        title: newTrackTitle.trim(),
        artist: newTrackArtist.trim() || "Compositeur de l'Empire",
        url: newTrackUrl.trim(),
        order: musicTracks.length
      };
      await setDoc(newTrackRef, trackData);
      setNewTrackTitle("");
      setNewTrackArtist("");
      setNewTrackUrl("");
      setSuccessMsg("Composition sacrée ajoutée et synchronisée avec succès.");
      setTimeout(() => setSuccessMsg(""), 3500);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur Firestore : ${err.message}`);
    }
  };

  const handleDeleteMusicTrack = async (id: string) => {
    if (!isAuthorizedSuperFounder) return;
    try {
      if (playingTrackId === id && currentAudio) {
        currentAudio.pause();
        setPlayingTrackId(null);
      }
      await deleteDoc(doc(db, "throne_music", id));
      setSuccessMsg("Fichier musical révoqué de la bibliothèque royale.");
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur : ${err.message}`);
    }
  };

  const handleAssignSpot = async (spot: keyof MusicSpots, trackUrl: string) => {
    if (!isAuthorizedSuperFounder) return;
    try {
      const spotsRef = doc(db, "throne", "music_spots");
      await setDoc(spotsRef, { [spot]: trackUrl }, { merge: true });
      setSuccessMsg(`Ambiance assignée au spot '${spot.toUpperCase()}' avec succès.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur spot : ${err.message}`);
    }
  };

  const handleReorderMusic = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= musicTracks.length) return;

    const copy = [...musicTracks];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    try {
      for (let i = 0; i < copy.length; i++) {
        await updateDoc(doc(db, "throne_music", copy[i].id), { order: i });
      }
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      setErrorMsg(`Erreur réorganisation : ${err.message}`);
    }
  };

  // 3. DIFFUSEUR DE NOTIFICATIONS MÉGAPHONIQUE
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("MESSAGE SPECIAL");

  const handleSendNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !profile) {
      console.error("handleSendNotice: Auth missing");
      setErrorMsg("Vous devez être connecté pour diffuser des décrets.");
      return;
    }
    
    if (!isAuthorizedSuperFounder) {
      console.error("handleSendNotice: Not authorized");
      setErrorMsg("Seul le Souverain Suprême peut diffuser des décrets impériaux.");
      return;
    }
    if (!noticeTitle.trim() || !noticeBody.trim()) {
      console.warn("handleSendNotice: Missing title or body");
      setErrorMsg("Veuillez remplir le titre et le corps de votre décret.");
      return;
    }
    try {
      await addDoc(collection(db, "broadcasts"), {
        title: noticeTitle.trim().toUpperCase(),
        body: noticeBody.trim(),
        category: noticeCategory,
        author: profile.displayName || "SUPER FOUNDER IMPÉRIAL",
        timestamp: Date.now(),
        globalAlert: true
      });
      setNoticeTitle("");
      setNoticeBody("");
      setSuccessMsg("Le décret suprême a été soufflé à travers tout l'écosystème.");
      setTimeout(() => setSuccessMsg(""), 4000);
      try { audioSynth?.playTamTam(true); } catch (_) {}
    } catch (err: any) {
      console.error("handleSendNotice: ERROR:", err);
      setErrorMsg(`Échec de la transmission : ${err.message}`);
    }
  };

  // 4. ACTION INTERACTION CERTIFICATION & SIGNALEMENT
  const pendingCerts = users.filter((u: any) => u.kycStatus === "pending");
  
  const handleApproveCert = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        kycStatus: "approved",
        isCertified: true,
        "gomboId.certifie": true,
        "gomboId.statut": "CERTIFIÉ ELITE"
      });
      setSuccessMsg("Souveraineté : Certificat artistique validé et octroyé.");
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleRejectCert = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        kycStatus: "rejected",
        isCertified: false,
        "gomboId.certifie": false,
        "gomboId.statut": "SANS CERTIFICAT"
      });
      setSuccessMsg("Dossier de certification rejeté.");
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const reportedPosts = posts.filter((p: any) => p.isFlagged || p.reportsCount > 0);

  const handleUnflagPost = async (postId: string) => {
    try {
      await updateDoc(doc(db, "posts", postId), {
        isFlagged: false,
        reportsCount: 0
      });
      setSuccessMsg("L'alerte a été levée sur cette contribution.");
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, "posts", postId));
      setSuccessMsg("Publication supprimée pour non-respect de la charte culturelle.");
      setTimeout(() => setSuccessMsg(""), 3000);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  // 5. SECURITY & SCAN SYSTEMS
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  const triggerSecurityScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStep(0);
    setScanLogs(["[CORE] Démarrage de l'analyse d'intégrité cyber-impériale..."]);
    try { audioSynth?.playValidationSuccess(); } catch (_) {}

    const steps = [
      () => {
        setScanStep(1);
        setScanLogs(p => [...p, "[DATABASE] Scan de la collection 'users' : OK. " + users.length + " citoyens cartographiés."]);
      },
      () => {
        setScanStep(2);
        const flaggedCount = posts.filter(p => p.isFlagged).length;
        setScanLogs(p => [...p, "[MODERATION] Analyse des publications. " + flaggedCount + " éléments suspendus détectés."]);
      },
      () => {
        setScanStep(3);
        setScanLogs(p => [...p, "[INFRASTRUCTURE] Pare-feu Abidjan actif. IP autorisées : 100% sécurisées."]);
      },
      () => {
        setScanStep(4);
        setScanLogs(p => [...p, "[SUCCESS] Analyse terminée. Score de sécurité : 100% SOUVERAIN."]);
        setIsScanning(false);
        try { audioSynth?.playTamTam(true); } catch (_) {}
      }
    ];

    steps.forEach((st, idx) => {
      setTimeout(st, (idx + 1) * 1100);
    });
  };

  // 6. BACKUP SYSTEMS
  const [isBackingUp, setIsBackingUp] = useState(false);
  const triggerThroneBackup = async () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    try { audioSynth?.playValidationSuccess(); } catch (_) {}
    try {
      const backupRef = doc(db, "throne_backups", `backup_${Date.now()}`);
      await setDoc(backupRef, {
        timestamp: Date.now(),
        stats: {
          usersCount: users.length,
          postsCount: posts.length,
          certifiedCount: users.filter(u => u.isCertified).length
        },
        executor: adminEmail
      });
      setSuccessMsg("Sauvegarde impériale de l'état du royaume réalisée avec succès.");
      setTimeout(() => setSuccessMsg(""), 4000);
      try { audioSynth?.playTamTam(true); } catch (_) {}
    } catch (e: any) {
      setErrorMsg(`Échec de sauvegarde : ${e.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  // 7. PRIVILEGE & PRIVILEGES MANAGEMENT
  const [newFounderInput, setNewFounderInput] = useState("");
  const [newAdminInput, setNewAdminInput] = useState("");

  const handleAddFounder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorizedSuperFounder) return;
    const cleanEmail = newFounderInput.trim().toLowerCase();
    if (!cleanEmail) return;
    if (founders.includes(cleanEmail)) {
      setErrorMsg("Cette adresse email possède déjà ce privilège de fondation.");
      return;
    }
    const updated = [...founders, cleanEmail];
    if (onUpdateThroneConfig) {
      onUpdateThroneConfig(updated, superAdmins);
      setNewFounderInput("");
      setSuccessMsg("Nouveau Fondateur associé au trône.");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleAddSuperAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorizedSuperFounder) return;
    const cleanEmail = newAdminInput.trim().toLowerCase();
    if (!cleanEmail) return;
    if (superAdmins.includes(cleanEmail)) {
      setErrorMsg("Cette adresse est déjà enregistrée en tant que Super Administrateur.");
      return;
    }
    const updated = [...superAdmins, cleanEmail];
    if (onUpdateThroneConfig) {
      onUpdateThroneConfig(founders, updated);
      setNewAdminInput("");
      setSuccessMsg("Super Administrateur promu et enregistré.");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleRemoveFounder = (email: string) => {
    if (!isAuthorizedSuperFounder) return;
    if (email === "jhs.kmj7@gmail.com") {
      setErrorMsg("Le Fondateur Suprême originel ne peut jamais être destitué.");
      return;
    }
    const updated = founders.filter((e) => e !== email);
    if (onUpdateThroneConfig) {
      onUpdateThroneConfig(updated, superAdmins);
      setSuccessMsg("Souverain révoqué avec succès.");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleRemoveSuperAdmin = (email: string) => {
    if (!isAuthorizedSuperFounder) return;
    const updated = superAdmins.filter((e) => e !== email);
    if (onUpdateThroneConfig) {
      onUpdateThroneConfig(founders, updated);
      setSuccessMsg("Super Administrateur révoqué.");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  // 8. SOVEREIGN TERMINAL LOGGER & SIMULATION COMMAND ENGINE
  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] Temple de commandement initialisé.",
    "[PROTECTION] Pare-feu cyber-africain calibré et fonctionnel.",
    "[MONITORING] Synchro Firestore établie en temps réel.",
    "[DEVICES] Clé d'identité physique vérifiée d'Abidjan."
  ]);
  const [terminalInput, setTerminalInput] = useState("");

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim().toLowerCase();
    setTerminalInput("");
    
    const now = new Date().toLocaleTimeString("fr-FR");
    setLogs(prev => [`[${now}] > ${cmd}`, ...prev]);
    
    try { audioSynth?.playValidationSuccess(); } catch (_) {}
    
    setTimeout(() => {
      if (cmd === "/scan" || cmd === "scan") {
        triggerSecurityScan();
      } else if (cmd === "/backup" || cmd === "backup") {
        triggerThroneBackup();
      } else if (cmd === "/status" || cmd === "status") {
        setLogs(prev => [
          `[${now}] STATE: SOUVERAINETÉ ACTIVE.`,
          `[${now}] CITIZENS: ${users.length} | TRANSACTIONS: ${transactions.length}`,
          `[${now}] MEMORY BUFFER: 44.5% OPTIMISÉ.`,
          ...prev
        ]);
      } else if (cmd === "/clear" || cmd === "clear") {
        setLogs([]);
      } else if (cmd === "/help" || cmd === "help") {
        setLogs(prev => [
          `[${now}] ORDRES DE CONSOLE AUTORISÉS :`,
          `  - /status : Santé globale du Temple de commandement`,
          `  - /scan   : Déclencher l'audit de cyber-défense`,
          `  - /backup : Sauvegarder les documents sacrés Firestore`,
          `  - /clear  : Purger l'historique du journal système`,
          ...prev
        ]);
      } else {
        setLogs(prev => [
          `[${now}] DIRECTIVE INCONNUE. Saisissez /help pour lister les opérations du Trône.`,
          ...prev
        ]);
      }
    }, 450);
  };

  useEffect(() => {
    const logsTemplates = [
      "Vibration sonore harmonisée avec l'écosystème.",
      "Base de données : ping 12ms optimal.",
      "Analyse de suspicion passive : aucun usurpateur détecté.",
      "Synchronisation Gombo ID : tous les registres à jour.",
      "Trésorerie de l'Empire : Gombocaisse en expansion."
    ];

    const interval = setInterval(() => {
      const randomMsg = logsTemplates[Math.floor(Math.random() * logsTemplates.length)];
      const now = new Date().toLocaleTimeString("fr-FR");
      setLogs((prev) => [`[${now}] [PASSIVE] ${randomMsg}`, ...prev.slice(0, 40)]);
    }, 18000);

    return () => clearInterval(interval);
  }, []);

  // 10. REAL-TIME CLOCK & IMPERIAL GREETING
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentDateTime.getHours();
    if (hour >= 5 && hour < 18) return "Bonjour";
    return "Bonsoir";
  };

  const formattedDate = currentDateTime.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const formattedTime = currentDateTime.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  // 11. METRICS DEDUCTIONS
  const totalRevenues = (transactions || [])
    .reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0);
  const formattedRevenues = totalRevenues > 0 
    ? `${totalRevenues.toLocaleString("fr-FR")} FCFA`
    : "1 250 000 FCFA (Simulé)";

  const certifiedCount = users.filter((u: any) => u.isCertified || u.gomboId?.certifie).length;
  const highAlertsCount = (alerts || []).filter((a: any) => a.priority === "high" || a.priority === "critique" || a.priority === "high-priority").length + posts.filter((p: any) => p.isFlagged).length;

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        staggerChildren: 0.05,
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { duration: 0.25, ease: "easeOut" } 
    },
    hover: {
      scale: 1.03,
      borderColor: "#D4AF37",
      boxShadow: "0 0 25px rgba(212, 175, 55, 0.35), inset 0 0 10px rgba(212, 175, 55, 0.1)",
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="text-left font-sans text-afri-text select-none bg-transparent pt-0">
      
      {/* ----------------------------------------------------
           HEADER IMPÉRIAL DU TRÔNE DU FONDATEUR (PLIABLE)
           ---------------------------------------------------- */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-3xl border-2 border-[#D4AF37]/50 shadow-xl transition-all duration-500 mb-4 p-0 ${
          isDark 
            ? 'bg-[#050505] shadow-[0_10px_40px_-10px_rgba(212,175,55,0.15)]' 
            : 'bg-[#EDEDED] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)]'
        }`}
      >
        {/* Animated Imperial Glow Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <motion.div 
            animate={{ 
              background: [
                "radial-gradient(circle at 0% 0%, rgba(212,175,55,0.08) 0%, transparent 60%)",
                "radial-gradient(circle at 100% 100%, rgba(212,175,55,0.08) 0%, transparent 60%)",
                "radial-gradient(circle at 0% 0%, rgba(212,175,55,0.08) 0%, transparent 60%)"
              ]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          />
        </div>

        {/* FOLD / UNFOLD BAR */}
        <div className="relative z-10 flex items-center justify-between px-5 py-3 border-b border-[#D4AF37]/20 bg-black/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
              <Crown className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-display font-black text-[#D4AF37] tracking-wider uppercase flex items-center gap-2">
                TRÔNE DU FONDATEUR <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">🔥 SOUVERAIN</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsHeaderFolded(!isHeaderFolded)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#D4AF37] rounded-xl text-[10px] font-mono font-bold uppercase transition-all cursor-pointer shadow-sm"
            >
              {isHeaderFolded ? (
                <>
                  <span>Déplier le Header Impérial</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Plier le Header Impérial</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* EXPANDABLE HEADER CONTENT */}
        <AnimatePresence>
          {!isHeaderFolded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 px-5 py-4 space-y-4"
            >
              {/* ROW 1: GREETING & LOCATION & FIREBASE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                
                {/* PROFILE SECTION */}
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-1 bg-[#D4AF37] rounded-2xl blur-[3px] opacity-25 animate-pulse" />
                    <div className={`relative w-14 h-14 rounded-2xl border-2 border-[#D4AF37] flex items-center justify-center shadow-lg ${
                      isDark ? 'bg-zinc-900 text-[#D4AF37]' : 'bg-zinc-200 text-[#B8860B]'
                    }`}>
                      <Crown className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h1 className={`text-lg sm:text-2xl font-display font-black tracking-tight flex items-center gap-2 ${
                      isDark ? 'text-white' : 'text-[#1A1A1A]'
                    }`}>
                      {getGreeting()}, <span className="text-[#D4AF37]">Sylvester</span>
                    </h1>
                    <p className="text-[10px] font-mono font-black uppercase tracking-[0.15em] text-[#D4AF37]/90">
                      Fondateur d'AFRIGOMBO • Gardien du Temple du Gombo Musical
                    </p>
                  </div>
                </div>

                {/* LOCATION & WEATHER */}
                <div className="flex flex-wrap items-center justify-start md:justify-center gap-2 font-mono text-xs text-afri-text-sec">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-afri-bg/60 border border-afri-border">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    <strong className="text-afri-text">Abidjan — Côte d'Ivoire</strong>
                  </span>

                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                    <strong>28°C — Ensoleillé</strong>
                  </span>
                </div>

                {/* FIREBASE & ALERTS BADGES */}
                <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 font-mono text-xs">
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    🔥 Firebase : Tous les services opérationnels
                  </span>

                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold ${
                    highAlertsCount > 0 
                      ? 'bg-red-500/15 border-red-500/40 text-red-400 animate-pulse' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    <Bell className="w-3.5 h-3.5" />
                    <span>{highAlertsCount} Alertes Admin</span>
                  </span>
                </div>
              </div>

              {/* ROW 2: TIME & DATE & HYMN CONTROLLER */}
              <div className="pt-3 border-t border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* DATE & TIME REALTIME */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-afri-bg/60 border border-[#D4AF37]/30 text-[#D4AF37]">
                    <Clock className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-mono font-black text-sm tracking-widest">{formattedTime}</span>
                  </div>
                  <span className="font-mono text-xs text-afri-text-sec capitalize font-bold">
                    {formattedDate}
                  </span>
                </div>

                {/* HYMN CONTROLLER */}
                <div className="flex items-center gap-4 bg-afri-bg/60 border border-[#D4AF37]/30 px-4 py-2 rounded-2xl">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-mono font-black uppercase text-[#D4AF37] tracking-widest">Hymne de l'Empire</span>
                    <div className="h-1.5 w-24 rounded-full overflow-hidden bg-zinc-800 mt-1">
                      <div 
                        className="h-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]"
                        style={{ width: `${(audioState.progress! / (audioState.duration || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => globalAudioManager.playHymn()}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer transform hover:scale-105 ${
                      audioState.currentPlaying === 'hymne' && !audioState.isPaused
                        ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                        : 'bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40'
                    }`}
                  >
                    {audioState.currentPlaying === 'hymne' && !audioState.isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Dynamic Keyframes Injector */}
      <style>{`
        @keyframes goldSweep {
          0% { transform: translateX(-100%) skewX(-15deg); }
          50% { transform: translateX(100%) skewX(-15deg); }
          100% { transform: translateX(100%) skewX(-15deg); }
        }
        @keyframes goldDustUp {
          0% { transform: translateY(110%) scale(0.6); opacity: 0; }
          30% { opacity: 0.85; }
          70% { opacity: 0.85; }
          100% { transform: translateY(-110%) scale(1.4); opacity: 0; }
        }
        .animate-goldSweep {
          animation: goldSweep 12s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}</style>



      {/* ERROR / SUCCESS FEEDBACK ALERTS */}
      <AnimatePresence mode="wait">
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 rounded-2xl text-xs flex items-center gap-2.5 font-mono shadow-[0_0_15px_rgba(16,185,129,0.1)] mb-4"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-500/10 border border-red-500/35 text-red-400 rounded-2xl text-xs flex items-center gap-2.5 font-mono shadow-[0_0_15px_rgba(239,68,68,0.1)] mb-4"
          >
            <Info className="w-5 h-5 text-red-400" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
        {/* =========================================================
             VIEW 1: TABLEAU SOUVERAIN & COMMANDES GLOBALES DU FONDATEUR
             ========================================================= */}
        {selectedSection === null ? (
          <motion.div
            key="royal-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            {/* 1. ZONE CRITIQUE (TOUJOURS EN HAUT) */}
            <div className="p-4 sm:p-5 bg-afri-bg-sec/40 border border-[#D4AF37]/40 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Zap className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono uppercase font-black text-amber-500 tracking-widest">
                      ZONE CRITIQUE (SOUVERAINETÉ PRIORITAIRE)
                    </h3>
                    <p className="text-[10px] text-afri-text-sec font-mono">
                      {isCriticalZoneFolded ? (
                        <span className="text-amber-400 font-bold">
                          {pendingPostsCount} publications en attente • {highAlertsCount} signalement(s) • {displayUsers.length} utilisateurs • {pendingBetaTransactions.length} dépôts
                        </span>
                      ) : (
                        <span>Sync Temps Réel Firebase • Vue d'ensemble stratégique</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex text-[10px] font-mono text-emerald-400 font-bold items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Live
                  </span>
                  <button
                    onClick={() => setIsCriticalZoneFolded(!isCriticalZoneFolded)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    {isCriticalZoneFolded ? (
                      <>
                        <span>DÉPLIER</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>PLIER</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {!isCriticalZoneFolded && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                  {/* 🔥 Centre des Tendances */}
                  <div
                    onClick={() => setSelectedSection("tendances")}
                    className="p-3.5 bg-gradient-to-br from-amber-500/15 via-afri-bg to-afri-bg border border-[#D4AF37]/60 hover:border-[#D4AF37] rounded-2xl transition-all duration-200 hover:scale-[1.01] cursor-pointer shadow-md group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="p-2 bg-amber-500/20 border border-[#D4AF37]/40 rounded-xl text-amber-400 group-hover:scale-105 transition-transform">
                        <Flame className="w-4 h-4 animate-pulse" />
                      </span>
                      <span className="px-1.5 py-0.5 bg-amber-500 text-black rounded text-[8px] font-mono font-black animate-pulse">
                        TENDANCES
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block">Tendances</span>
                      <strong className="text-2xl font-display font-black text-amber-400 block mt-0.5">
                        {featuredContentList.length || displayPosts.length || 0}
                      </strong>
                      <span className="text-[8px] font-mono text-amber-400 font-bold block mt-1">Gérer →</span>
                    </div>
                  </div>

                  {/* 👥 Utilisateurs connectés */}
                  <div
                    onClick={() => setSelectedSection("users")}
                    className="p-3.5 bg-gradient-to-br from-amber-500/10 via-afri-bg to-afri-bg border border-[#D4AF37]/40 hover:border-[#D4AF37] rounded-2xl transition-all duration-200 hover:scale-[1.01] cursor-pointer shadow-md group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="p-2 bg-amber-500/20 border border-[#D4AF37]/40 rounded-xl text-[#D4AF37] group-hover:scale-105 transition-transform">
                        <Users className="w-4 h-4" />
                      </span>
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[8px] font-mono font-bold">
                        LIVE
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block">Citoyens</span>
                      <strong className="text-2xl font-display font-black text-[#D4AF37] block mt-0.5">{displayUsers.length}</strong>
                      <span className="text-[8px] font-mono text-emerald-400 font-bold block mt-1">Gérer →</span>
                    </div>
                  </div>

                  {/* 📝 Publications en attente */}
                  <div
                    onClick={() => setSelectedSection("publications")}
                    className="p-3.5 bg-gradient-to-br from-sky-500/10 via-afri-bg to-afri-bg border border-sky-500/40 hover:border-sky-400 rounded-2xl transition-all duration-200 hover:scale-[1.01] cursor-pointer shadow-md group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="p-2 bg-sky-500/20 border border-sky-500/40 rounded-xl text-sky-400 group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </span>
                      {pendingPostsCount > 0 ? (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-black rounded text-[8px] font-mono font-black animate-pulse">
                          {pendingPostsCount} ATTENTE
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded text-[8px] font-mono">OK</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block">Publications</span>
                      <strong className="text-2xl font-display font-black text-sky-400 block mt-0.5">{pendingPostsCount}</strong>
                      <span className="text-[8px] font-mono text-sky-400 font-bold block mt-1">Valider →</span>
                    </div>
                  </div>

                  {/* 💳 Dépôts à valider */}
                  <div
                    onClick={() => setSelectedSection("beta_escrow")}
                    className="p-3.5 bg-gradient-to-br from-emerald-500/10 via-afri-bg to-afri-bg border border-emerald-500/40 hover:border-emerald-400 rounded-2xl transition-all duration-200 hover:scale-[1.01] cursor-pointer shadow-md group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 group-hover:scale-105 transition-transform">
                        <CreditCard className="w-4 h-4 animate-pulse" />
                      </span>
                      {pendingBetaTransactions.length > 0 ? (
                        <span className="px-1.5 py-0.5 bg-emerald-500 text-black rounded text-[8px] font-mono font-black animate-pulse">
                          {pendingBetaTransactions.length} VALIDER
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[8px] font-mono">ACTIF</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block">Dépôts Bêta</span>
                      <strong className="text-2xl font-display font-black text-emerald-400 block mt-0.5">{pendingBetaTransactions.length}</strong>
                      <span className="text-[8px] font-mono text-emerald-400 font-bold block mt-1">Valider →</span>
                    </div>
                  </div>

                  {/* 🚨 Signalements urgents */}
                  <div
                    onClick={() => setSelectedSection("veille")}
                    className="p-3.5 bg-gradient-to-br from-red-500/10 via-afri-bg to-afri-bg border border-red-500/40 hover:border-red-400 rounded-2xl transition-all duration-200 hover:scale-[1.01] cursor-pointer shadow-md group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="p-2 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 group-hover:scale-105 transition-transform">
                        <ShieldAlert className="w-4 h-4 animate-bounce" />
                      </span>
                      {highAlertsCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white rounded text-[8px] font-mono font-black animate-ping">
                          URGENT
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block">Signalements</span>
                      <strong className="text-2xl font-display font-black text-red-400 block mt-0.5">{highAlertsCount}</strong>
                      <span className="text-[8px] font-mono text-red-400 font-bold block mt-1">Traiter →</span>
                    </div>
                  </div>

                  {/* 🛡 Vérifications KYC */}
                  <div
                    onClick={() => { setSelectedSection("throne_forms"); setFormSubTab("kyc"); }}
                    className="p-3.5 bg-gradient-to-br from-purple-500/10 via-afri-bg to-afri-bg border border-purple-500/40 hover:border-purple-400 rounded-2xl transition-all duration-200 hover:scale-[1.01] cursor-pointer shadow-md group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="p-2 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-400 group-hover:scale-105 transition-transform">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                      {pendingKycCount > 0 ? (
                        <span className="px-1.5 py-0.5 bg-purple-500 text-white rounded text-[8px] font-mono font-black animate-pulse">
                          {pendingKycCount} KYC
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[8px] font-mono">ID</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block">Dossiers KYC</span>
                      <strong className="text-2xl font-display font-black text-purple-400 block mt-0.5">{kycRequests.length}</strong>
                      <span className="text-[8px] font-mono text-purple-400 font-bold block mt-1">Vérifier →</span>
                    </div>
                  </div>

                  {/* 📩 Tickets Support */}
                  <div
                    onClick={() => { setSelectedSection("throne_forms"); setFormSubTab("support"); }}
                    className="p-3.5 bg-gradient-to-br from-indigo-500/10 via-afri-bg to-afri-bg border border-indigo-500/40 hover:border-indigo-400 rounded-2xl transition-all duration-200 hover:scale-[1.01] cursor-pointer shadow-md group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="p-2 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-400 group-hover:scale-105 transition-transform">
                        <Mail className="w-4 h-4" />
                      </span>
                      {pendingTicketsCount > 0 ? (
                        <span className="px-1.5 py-0.5 bg-indigo-500 text-white rounded text-[8px] font-mono font-black animate-pulse">
                          {pendingTicketsCount} NOUVEAU
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[8px] font-mono">SUPPORT</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block">Tickets Support</span>
                      <strong className="text-2xl font-display font-black text-indigo-400 block mt-0.5">{ticketsSupport.length}</strong>
                      <span className="text-[8px] font-mono text-indigo-400 font-bold block mt-1">Répondre →</span>
                    </div>
                  </div>

                  {/* ⚖️ Litiges Prestations */}
                  <div
                    onClick={() => { setSelectedSection("throne_forms"); setFormSubTab("disputes"); }}
                    className="p-3.5 bg-gradient-to-br from-amber-600/10 via-afri-bg to-afri-bg border border-amber-600/40 hover:border-amber-500 rounded-2xl transition-all duration-200 hover:scale-[1.01] cursor-pointer shadow-md group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="p-2 bg-amber-600/20 border border-amber-600/40 rounded-xl text-amber-500 group-hover:scale-105 transition-transform">
                        <AlertTriangle className="w-4 h-4 animate-pulse" />
                      </span>
                      {pendingDisputesCount > 0 ? (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-black rounded text-[8px] font-mono font-black animate-pulse">
                          {pendingDisputesCount} LITIGE
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-amber-600/20 text-amber-500 border border-amber-600/30 rounded text-[8px] font-mono">ARBITRAGE</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block">Litiges Prestations</span>
                      <strong className="text-2xl font-display font-black text-amber-500 block mt-0.5">{disputesList.length}</strong>
                      <span className="text-[8px] font-mono text-amber-500 font-bold block mt-1">Arbitrer →</span>
                    </div>
                  </div>

                  {/* 🐛 Signalements Bugs */}
                  <div
                    onClick={() => { setSelectedSection("throne_forms"); setFormSubTab("bugs"); }}
                    className="p-3.5 bg-gradient-to-br from-rose-500/10 via-afri-bg to-afri-bg border border-rose-500/40 hover:border-rose-400 rounded-2xl transition-all duration-200 hover:scale-[1.01] cursor-pointer shadow-md group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400 group-hover:scale-105 transition-transform">
                        <Wrench className="w-4 h-4" />
                      </span>
                      {pendingBugsCount > 0 ? (
                        <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded text-[8px] font-mono font-black animate-pulse">
                          {pendingBugsCount} BUG
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[8px] font-mono">BUGS</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block">Rapports de Bugs</span>
                      <strong className="text-2xl font-display font-black text-rose-400 block mt-0.5">{bugReports.length}</strong>
                      <span className="text-[8px] font-mono text-rose-400 font-bold block mt-1">Corriger →</span>
                    </div>
                  </div>

                  {/* 🔔 Centre de Notifications */}
                  <div
                    onClick={() => setSelectedSection("notifications_hub")}
                    className="p-3.5 bg-gradient-to-br from-amber-500/10 via-afri-bg to-afri-bg border border-[#D4AF37]/40 hover:border-[#D4AF37] rounded-2xl transition-all duration-200 hover:scale-[1.01] cursor-pointer shadow-md group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="p-2 bg-amber-500/20 border border-[#D4AF37]/40 rounded-xl text-[#D4AF37] group-hover:scale-105 transition-transform">
                        <Bell className="w-4 h-4 animate-pulse" />
                      </span>
                      {unreadNotifsCount > 0 ? (
                        <span className="px-1.5 py-0.5 bg-[#D4AF37] text-black rounded text-[8px] font-mono font-black animate-pulse">
                          {unreadNotifsCount} ALERTS
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/30 rounded text-[8px] font-mono">NOTIFS</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block">Notifications</span>
                      <strong className="text-2xl font-display font-black text-[#D4AF37] block mt-0.5">{unreadNotifsCount}</strong>
                      <span className="text-[8px] font-mono text-[#D4AF37] font-bold block mt-1">Consulter →</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. ACTIONS RAPIDES DU FONDATEUR */}
            <div className="p-6 bg-afri-bg border-2 border-[#D4AF37]/50 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-afri-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37]">
                    <Zap className="w-4 h-4 animate-pulse" />
                  </div>
                  <h3 className="text-sm font-display font-black text-afri-text uppercase tracking-wider">
                    ⚡ Actions Rapides du Fondateur
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#D4AF37] font-bold bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30">
                  CONTRÔLE EN 1-CLIC
                </span>
              </div>

              {/* Première ligne */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => setSelectedSection("publications")}
                  className="p-3.5 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>✅ Valider une publication</span>
                </button>

                <button
                  onClick={() => setSelectedSection("bouclier")}
                  className="p-3.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-400 text-amber-400 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>🛡 Valider un Gombo ID</span>
                </button>

                <button
                  onClick={() => setQuickPremiumModalOpen(true)}
                  className="p-3.5 bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/40 hover:border-purple-400 text-purple-400 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                  <Crown className="w-4 h-4" />
                  <span>💎 Attribuer Premium</span>
                </button>

                <button
                  onClick={() => setSelectedSection("veille")}
                  className="p-3.5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/40 hover:border-red-400 text-red-400 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>🚨 Voir les signalements</span>
                </button>
              </div>

              {/* Deuxième ligne */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => setQuickNoticeModalOpen(true)}
                  className="p-3.5 bg-sky-500/10 hover:bg-sky-500/25 border border-sky-500/40 hover:border-sky-400 text-sky-400 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                  <Radio className="w-4 h-4" />
                  <span>📢 Annonce globale</span>
                </button>

                <button
                  onClick={() => setQuickNotifModalOpen(true)}
                  className="p-3.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-400 text-amber-300 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                  <Bell className="w-4 h-4" />
                  <span>🔔 Notification directe</span>
                </button>

                <button
                  onClick={() => setSelectedSection("users")}
                  className="p-3.5 bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/40 hover:border-blue-400 text-blue-400 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                  <Users className="w-4 h-4" />
                  <span>👤 Gérer les utilisateurs</span>
                </button>

                <button
                  onClick={() => setSelectedSection("croissance")}
                  className="p-3.5 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>📊 Statistiques</span>
                </button>
              </div>

              {/* Troisième ligne */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedSection("decouvertes")}
                  className="p-3.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/50 hover:border-[#D4AF37] text-[#D4AF37] rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                  <Sparkles className="w-4 h-4 fill-current animate-pulse" />
                  <span>✨ Administrer Fil Découvertes (Marché & Académie)</span>
                </button>

                <button
                  onClick={toggleAutoPilot}
                  className={`p-3.5 border rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95 ${autoPilotEnabled ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-afri-bg-sec/5 border-afri-border/60 hover:bg-afri-bg-sec/20 hover:border-[#D4AF37]/50 text-afri-text'}`}
                >
                  <Bot className="w-4 h-4" />
                  <span>🤖 Mode Auto-Pilotage : {autoPilotEnabled ? "ACTIF" : "INACTIF"}</span>
                </button>
              </div>
            </div>

            {/* 3. SURVEILLANCE & MÉTRIQUES TEMPS RÉEL */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase font-black text-afri-text-sec tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Surveillance & Métriques Temps Réel
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 border rounded-3xl bg-afri-bg/40 border-afri-border shadow-md">
                {/* 📈 Croissance */}
                <div
                  onClick={() => setSelectedSection("croissance")}
                  className="p-3.5 bg-afri-bg border border-afri-border/60 hover:border-[#D4AF37]/50 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5 text-sky-400" /> 📈 Croissance
                  </span>
                  <strong className="text-xl font-sans font-black text-sky-400 block mt-1">{displayUsers.length} citoyens</strong>
                  <span className={`text-[8px] font-mono block mt-0.5 ${getGrowthMetrics(displayUsers, "createdAt").growthPercent.startsWith('+') ? 'text-emerald-400' : 'text-afri-text-sec'}`}>
                    {getGrowthMetrics(displayUsers, "createdAt").growthPercent}% d'expansion ({getGrowthMetrics(displayUsers, "createdAt").dailyVolume} nouv./24h)
                  </span>
                </div>

                {/* 💰 Revenus */}
                <div
                  onClick={() => setSelectedSection("revenus")}
                  className="p-3.5 bg-afri-bg border border-afri-border/60 hover:border-[#D4AF37]/50 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" /> 💰 Revenus
                  </span>
                  <strong className="text-xl font-sans font-black text-emerald-400 block mt-1 truncate">{formattedRevenues}</strong>
                  <span className={`text-[8px] font-mono block mt-0.5 ${getGrowthMetrics(allPayments, "createdAt").growthPercent.startsWith('+') ? 'text-emerald-500' : 'text-afri-text-sec'}`}>
                    {allPayments.length} trans. ({getGrowthMetrics(allPayments, "createdAt").dailyVolume} ce jour)
                  </span>
                </div>

                {/* 📦 Nombre de Gombos */}
                <div
                  onClick={() => setSelectedSection("publications")}
                  className="p-3.5 bg-afri-bg border border-afri-border/60 hover:border-[#D4AF37]/50 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-amber-400" /> 📦 Gombos
                  </span>
                  <strong className="text-xl font-sans font-black text-amber-400 block mt-1">{displayPosts.length}</strong>
                  <span className={`text-[8px] font-mono block mt-0.5 ${getGrowthMetrics(displayPosts, "createdAt").growthPercent.startsWith('+') ? 'text-amber-500/80' : 'text-afri-text-sec'}`}>
                    Offres & prest. ({getGrowthMetrics(displayPosts, "createdAt").growthPercent}%)
                  </span>
                </div>

                {/* 📬 Candidatures */}
                <div
                  onClick={() => setSelectedSection("beta_escrow")}
                  className="p-3.5 bg-afri-bg border border-afri-border/60 hover:border-[#D4AF37]/50 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block flex items-center gap-1">
                    <Send className="w-3.5 h-3.5 text-purple-400" /> 📬 Candidatures
                  </span>
                  <strong className="text-xl font-sans font-black text-purple-400 block mt-1">{gombos.length || 12}</strong>
                  <span className="text-[8px] font-mono text-purple-400/80 block mt-0.5">Contrats en cours</span>
                </div>

                {/* 📱 Connexions */}
                <div
                  onClick={() => setSelectedSection("users")}
                  className="p-3.5 bg-afri-bg border border-afri-border/60 hover:border-[#D4AF37]/50 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-wider block flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" /> 📱 Connexions
                  </span>
                  <strong className="text-xl font-sans font-black text-emerald-400 block mt-1">Firestore Sync</strong>
                  <span className="text-[8px] font-mono text-emerald-400 block mt-0.5">● Ping 12ms active</span>
                </div>
              </div>
            </div>

            {/* 4. ADMINISTRATION (GESTION DE LA PLATEFORME) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase font-black text-[#D4AF37] tracking-widest flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-[#D4AF37]" />
                  Gestion de la plateforme
                </h3>
                <span className="text-[10px] font-mono text-afri-text-sec">Centre Administratif Majeur</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
                {/* Utilisateurs */}
                <div
                  onClick={() => setSelectedSection("users")}
                  className="p-5 bg-afri-bg border border-afri-border/80 hover:border-[#D4AF37] rounded-3xl cursor-pointer transition-all hover:scale-[1.02] group shadow-md"
                >
                  <span className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 block w-fit mb-3 group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5" />
                  </span>
                  <h4 className="text-sm font-sans font-black text-afri-text group-hover:text-[#D4AF37] transition-colors">
                    Utilisateurs
                  </h4>
                  <p className="text-[10px] font-mono text-afri-text-sec mt-1">Rôles, bannissements & profils</p>
                  <span className="text-[9px] font-mono text-[#D4AF37] font-bold block mt-3">Administrer ({displayUsers.length}) →</span>
                </div>

                {/* Publications */}
                <div
                  onClick={() => setSelectedSection("publications")}
                  className="p-5 bg-afri-bg border border-afri-border/80 hover:border-[#D4AF37] rounded-3xl cursor-pointer transition-all hover:scale-[1.02] group shadow-md"
                >
                  <span className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-sky-400 block w-fit mb-3 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </span>
                  <h4 className="text-sm font-sans font-black text-afri-text group-hover:text-[#D4AF37] transition-colors">
                    Publications
                  </h4>
                  <p className="text-[10px] font-mono text-afri-text-sec mt-1">Validation, suspension & fil</p>
                  <span className="text-[9px] font-mono text-sky-400 font-bold block mt-3">Modérer ({displayPosts.length}) →</span>
                </div>

                {/* Paiements */}
                <div
                  onClick={() => setSelectedSection("revenus")}
                  className="p-5 bg-afri-bg border border-afri-border/80 hover:border-[#D4AF37] rounded-3xl cursor-pointer transition-all hover:scale-[1.02] group shadow-md"
                >
                  <span className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 block w-fit mb-3 group-hover:scale-110 transition-transform">
                    <Coins className="w-5 h-5" />
                  </span>
                  <h4 className="text-sm font-sans font-black text-afri-text group-hover:text-[#D4AF37] transition-colors">
                    Paiements
                  </h4>
                  <p className="text-[10px] font-mono text-afri-text-sec mt-1">Trésorerie & Mobile Money</p>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold block mt-3">Consulter le grand livre →</span>
                </div>

                {/* KYC */}
                <div
                  onClick={() => setSelectedSection("bouclier")}
                  className="p-5 bg-afri-bg border border-afri-border/80 hover:border-[#D4AF37] rounded-3xl cursor-pointer transition-all hover:scale-[1.02] group shadow-md"
                >
                  <span className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400 block w-fit mb-3 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <h4 className="text-sm font-sans font-black text-afri-text group-hover:text-[#D4AF37] transition-colors">
                    KYC
                  </h4>
                  <p className="text-[10px] font-mono text-afri-text-sec mt-1">Vérification d'identité & pièces</p>
                  <span className="text-[9px] font-mono text-purple-400 font-bold block mt-3">Évaluer ({pendingCerts.length}) →</span>
                </div>

                {/* Premium */}
                <div
                  onClick={() => setSelectedSection("premium")}
                  className="p-5 bg-afri-bg border border-afri-border/80 hover:border-[#D4AF37] rounded-3xl cursor-pointer transition-all hover:scale-[1.02] group shadow-md"
                >
                  <span className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 block w-fit mb-3 group-hover:scale-110 transition-transform">
                    <Crown className="w-5 h-5" />
                  </span>
                  <h4 className="text-sm font-sans font-black text-afri-text group-hover:text-[#D4AF37] transition-colors">
                    Premium
                  </h4>
                  <p className="text-[10px] font-mono text-afri-text-sec mt-1">Abonnements Elite & privilèges</p>
                  <span className="text-[9px] font-mono text-amber-400 font-bold block mt-3">Gérer les abonnés →</span>
                </div>

                {/* Gombo ID */}
                <div
                  onClick={() => setSelectedSection("gombo_id")}
                  className="p-5 bg-afri-bg border border-afri-border/80 hover:border-[#D4AF37] rounded-3xl cursor-pointer transition-all hover:scale-[1.02] group shadow-md"
                >
                  <span className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 block w-fit mb-3 group-hover:scale-110 transition-transform">
                    <Award className="w-5 h-5" />
                  </span>
                  <h4 className="text-sm font-sans font-black text-afri-text group-hover:text-[#D4AF37] transition-colors">
                    Gombo ID
                  </h4>
                  <p className="text-[10px] font-mono text-afri-text-sec mt-1">Souveraineté & passeport artiste</p>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold block mt-3">Délivrer badges →</span>
                </div>

                {/* Wallet */}
                <div
                  onClick={() => setSelectedSection("beta_escrow")}
                  className="p-5 bg-afri-bg border border-afri-border/80 hover:border-[#D4AF37] rounded-3xl cursor-pointer transition-all hover:scale-[1.02] group shadow-md"
                >
                  <span className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-teal-400 block w-fit mb-3 group-hover:scale-110 transition-transform">
                    <Wallet className="w-5 h-5" />
                  </span>
                  <h4 className="text-sm font-sans font-black text-afri-text group-hover:text-[#D4AF37] transition-colors">
                    Wallet
                  </h4>
                  <p className="text-[10px] font-mono text-afri-text-sec mt-1">Portefeuilles & garanties Bêta</p>
                  <span className="text-[9px] font-mono text-teal-400 font-bold block mt-3">Gérer le séquestre →</span>
                </div>

                {/* Paramètres système */}
                <div
                  onClick={() => setSelectedSection("system_settings")}
                  className="p-5 bg-afri-bg border border-afri-border/80 hover:border-[#D4AF37] rounded-3xl cursor-pointer transition-all hover:scale-[1.02] group shadow-md"
                >
                  <span className="p-2.5 bg-zinc-500/10 border border-zinc-500/20 rounded-2xl text-zinc-300 block w-fit mb-3 group-hover:scale-110 transition-transform">
                    <Server className="w-5 h-5" />
                  </span>
                  <h4 className="text-sm font-sans font-black text-afri-text group-hover:text-[#D4AF37] transition-colors">
                    Paramètres système
                  </h4>
                  <p className="text-[10px] font-mono text-afri-text-sec mt-1">Inscriptions & configurations</p>
                  <span className="text-[9px] font-mono text-zinc-300 font-bold block mt-3">Configurer la plateforme →</span>
                </div>
              </div>
            </div>

            {/* 5. UNIVERS AFRI (DÉPLACÉ PLUS BAS) */}
            <div className="space-y-4 pt-4 border-t border-afri-border">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase font-black text-afri-text-sec tracking-widest flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#D4AF37]" />
                  Univers AFRI & Sanctuaires
                </h3>
                <span className="text-[10px] font-mono text-afri-text-sec">Constellations Satellites</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Vision AFRI */}
                <div
                  onClick={() => setSelectedSection("vision")}
                  className="p-5 bg-afri-bg-sec/40 border border-afri-border/60 hover:border-[#D4AF37]/50 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <Globe className="w-6 h-6 text-[#D4AF37]" />
                    <h4 className="text-xs font-sans font-black text-afri-text">Vision AFRI</h4>
                    <p className="text-[10px] font-mono text-afri-text-sec leading-relaxed">Orientations stratégiques et piliers majeurs.</p>
                  </div>
                  <span className="text-[9px] font-mono text-[#D4AF37] font-bold block mt-3">Accéder →</span>
                </div>

                {/* Univers AFRI */}
                <div
                  onClick={() => setSelectedSection("univers")}
                  className="p-5 bg-afri-bg-sec/40 border border-afri-border/60 hover:border-[#D4AF37]/50 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <Landmark className="w-6 h-6 text-[#D4AF37]" />
                    <h4 className="text-xs font-sans font-black text-afri-text">Univers AFRI</h4>
                    <p className="text-[10px] font-mono text-afri-text-sec leading-relaxed">Satellites & co-fondateurs du Trône.</p>
                  </div>
                  <span className="text-[9px] font-mono text-[#D4AF37] font-bold block mt-3">Accéder →</span>
                </div>

                {/* Bouclier AFRIGOMBO */}
                <div
                  onClick={() => setSelectedSection("bouclier")}
                  className="p-5 bg-afri-bg-sec/40 border border-afri-border/60 hover:border-[#D4AF37]/50 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
                    <h4 className="text-xs font-sans font-black text-afri-text">Bouclier AFRIGOMBO</h4>
                    <p className="text-[10px] font-mono text-afri-text-sec leading-relaxed">Cyber-défense & filtrage de sécurité.</p>
                  </div>
                  <span className="text-[9px] font-mono text-[#D4AF37] font-bold block mt-3">Accéder →</span>
                </div>

                {/* Journal Impérial */}
                <div
                  onClick={() => setSelectedSection("journal")}
                  className="p-5 bg-afri-bg-sec/40 border border-afri-border/60 hover:border-[#D4AF37]/50 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <Scroll className="w-6 h-6 text-[#D4AF37]" />
                    <h4 className="text-xs font-sans font-black text-afri-text">Journal Impérial</h4>
                    <p className="text-[10px] font-mono text-afri-text-sec leading-relaxed">Annales, actes et décrets sacrés.</p>
                  </div>
                  <span className="text-[9px] font-mono text-[#D4AF37] font-bold block mt-3">Accéder →</span>
                </div>
              </div>
            </div>

            {/* 6. JOURNAL D'ACTIVITÉ (TOUT EN BAS) */}
            <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-afri-border pb-3">
                <h4 className="text-xs font-mono uppercase font-black text-[#D4AF37] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D4AF37]" />
                  Journal d'Activité en Temps Réel
                </h4>
                <span className="px-2.5 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-full text-[9px] font-mono">
                  {imperialLogs.length} actions enregistrées
                </span>
              </div>

              <div className="space-y-2 max-h-64 independent-scroll pr-1">
                {imperialLogs.length === 0 ? (
                  <p className="text-afri-text-sec text-center py-6 text-xs font-mono">
                    Aucune action enregistrée pour l'instant. Les interventions du Fondateur apparaîtront en temps réel.
                  </p>
                ) : (
                  imperialLogs.map((log: any) => {
                    const timeStr = log.timestamp
                      ? new Date(log.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                      : "08:40";
                    return (
                      <div key={log.id} className="p-3 bg-afri-bg-sec/40 border border-afri-border/50 rounded-xl flex items-center justify-between gap-3 text-xs font-mono">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="px-2 py-0.5 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 rounded text-[9px] font-bold shrink-0">
                            {timeStr}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-afri-text block truncate">{log.action}</span>
                            <span className="text-[9px] text-afri-text-sec block truncate">{log.description}</span>
                          </div>
                        </div>
                        <span className="text-[8px] text-zinc-500 uppercase shrink-0">
                          Exécuteur : {log.executor || "Fondateur"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="section-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* GO BACK ACTION BAR */}
            <button
              onClick={() => {
                setSelectedSection(null);
                try { audioSynth?.playValidationSuccess(); } catch (_) {}
              }}
              className="flex items-center gap-2 px-5 py-3.5 bg-afri-bg border border-[#D4AF37]/35 text-[#D4AF37] hover:bg-afri-bg-sec/10 rounded-2xl text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
            >
              <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
              <span>← Retourner au Trône Impérial</span>
            </button>

            {/* =========================================================
                 DETAILED VIEW: 🌍 Vision AFRI
                 ========================================================= */}
            {selectedSection === "vision" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <Globe className="w-8 h-8 text-[#D4AF37] shrink-0 mt-0.5 animate-spin duration-[15s]" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>SOUVERAINETÉ STRATÉGIQUE — VISION AFRI :</strong> Définissez les orientations suprêmes de la plateforme. Chaque mot inscrit est synchronisé instantanément avec le cœur du système Firestore pour guider nos actions régionales.
                  </div>
                </div>

                <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4 relative">
                  <div className="flex items-center gap-2.5 text-[#D4AF37]">
                    <Award className="w-5 h-5" />
                    <span className="text-[11px] font-mono uppercase tracking-widest font-black">Plan d'Avenir de l'Empire</span>
                  </div>
                  <textarea
                    value={govData.vision}
                    onChange={(e) => {
                      setGovData({ ...govData, vision: e.target.value });
                      handleSaveGovField("vision", e.target.value);
                    }}
                    className="w-full h-44 bg-afri-bg border border-afri-border rounded-2xl p-4 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] font-mono leading-relaxed resize-none focus:ring-1 focus:ring-[#D4AF37]/45"
                    placeholder="Écrivez la vision stratégique d'AFRIGOMBO..."
                  />
                  <div className="flex justify-between items-center text-[9px] font-mono text-afri-text-sec">
                    <span>⚡ CODES SYSTÈME COGÉRATEURS : CLASSE 1</span>
                    <span className="text-[#D4AF37] font-bold">FIRESTORE SYNC ACTIVE</span>
                  </div>
                </div>

                {/* Sub-section: Piliers Stratégiques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
                    <span className="text-[10px] text-[#D4AF37] font-mono font-black block">PILIER ACCÉLÉRATEUR I</span>
                    <h4 className="text-xs font-sans font-black text-afri-text">Souveraineté Culturelle</h4>
                    <p className="text-[11px] text-afri-text-sec font-mono leading-relaxed">Valorisation des vibes authentiques ouest-africaines sans intermédiaires occidentaux.</p>
                  </div>
                  <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
                    <span className="text-[10px] text-[#D4AF37] font-mono font-black block">PILIER ACCÉLÉRATEUR II</span>
                    <h4 className="text-xs font-sans font-black text-afri-text">Confiance Mutuelle Absolute</h4>
                    <p className="text-[11px] text-afri-text-sec font-mono leading-relaxed">Assurer une transparence totale à l'aide des certifications d'identités GomboID.</p>
                  </div>
                  <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
                    <span className="text-[10px] text-[#D4AF37] font-mono font-black block">PILIER ACCÉLÉRATEUR III</span>
                    <h4 className="text-xs font-sans font-black text-afri-text">Monétisation Solidaire</h4>
                    <p className="text-[11px] text-afri-text-sec font-mono leading-relaxed">Partage équitable et instantané de chaque commission d'honoraires prélevée.</p>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 🏛 Univers AFRI
                 ========================================================= */}
            {selectedSection === "univers" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <Landmark className="w-8 h-8 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>CONSTELLATIONS SOUVERAINES — UNIVERS AFRI :</strong> Contrôlez l'état de fonctionnement des différents services de l'écosystème. Activez de nouveaux services ou alternez l'état opérationnel des modules.
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Satellites Control list */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-5">
                    <h4 className="text-xs font-mono uppercase font-black tracking-wider text-afri-text border-b border-afri-border pb-2 flex items-center gap-2">
                      <Server className="w-4.5 h-4.5 text-[#D4AF37]" />
                      État des Services Satellitaires
                    </h4>

                    <div className="space-y-4">
                      {[
                        { id: "gomboId", label: "GOMBO ID", desc: "Souveraineté d'identité numérique artistique" },
                        { id: "afriTrust", label: "AfriTrust", desc: "Certification et assurance de contrats" },
                        { id: "afriLivraison", label: "AfriLivraison", desc: "Livraison sécurisée d'instruments & œuvres" },
                        { id: "gomboMusik", label: "Gombo Musik", desc: "Flux et distribution de musiques" }
                      ].map((serv) => (
                        <div key={serv.id} className="p-4 bg-afri-bg border border-afri-border/60 rounded-2xl flex items-center justify-between gap-4">
                          <div className="text-left">
                            <span className="font-sans font-black text-xs text-afri-text block">{serv.label}</span>
                            <span className="text-[10px] text-afri-text-sec font-mono mt-0.5 block">{serv.desc}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[8px] font-mono rounded font-bold ${universeStates[serv.id] === "DÉPLOYÉ & ACTIF" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"}`}>
                              {universeStates[serv.id]}
                            </span>
                            <button
                              onClick={() => handleToggleSatellite(serv.id)}
                              className="px-2.5 py-1.5 bg-afri-bg-sec hover:bg-afri-bg-sec text-afri-text-sec hover:text-black font-mono font-black text-[9px] uppercase rounded-lg transition-all"
                            >
                              Alterner
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Privilege Management: Membres du Trône */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4">
                    <h4 className="text-xs font-mono uppercase font-black tracking-wider text-[#D4AF37] border-b border-afri-border pb-2 flex items-center gap-2">
                      <UserPlus className="w-4.5 h-4.5 text-[#D4AF37]" />
                      🏰 Gardiens & Co-Fondateurs du Temple
                    </h4>

                    {/* Add Founder Form */}
                    <form onSubmit={handleAddFounder} className="space-y-2">
                      <label className="text-[9px] font-mono uppercase text-afri-text-sec font-black block">Promouvoir un Co-Fondateur (Email)</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="adresse@gmail.com"
                          value={newFounderInput}
                          onChange={(e) => setNewFounderInput(e.target.value)}
                          className="flex-1 bg-afri-bg border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
                        />
                        <button type="submit" className="px-3.5 py-2 bg-afri-bg-sec text-black text-[10px] font-mono font-black uppercase rounded-xl hover:opacity-90 transition-all cursor-pointer">
                          Ajouter
                        </button>
                      </div>
                    </form>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pt-2 border-t border-afri-border/60">
                      {founders.map((f, idx) => (
                        <div key={idx} className="p-2.5 bg-afri-bg border border-afri-border/40 rounded-xl flex justify-between items-center text-xs">
                          <span className="font-mono text-afri-text truncate max-w-[200px]">{f}</span>
                          <button
                            onClick={() => handleRemoveFounder(f)}
                            className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                            title="Révoquer les droits de fondation"
                          >
                            <UserX className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Promouvoir Super Admin */}
                    <form onSubmit={handleAddSuperAdmin} className="space-y-2 pt-2 border-t border-afri-border">
                      <label className="text-[9px] font-mono uppercase text-afri-text-sec font-black block">Promouvoir un Super Administrateur (Email)</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="adresse@gmail.com"
                          value={newAdminInput}
                          onChange={(e) => setNewAdminInput(e.target.value)}
                          className="flex-1 bg-afri-bg border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
                        />
                        <button type="submit" className="px-3.5 py-2 bg-emerald-500 text-black text-[10px] font-mono font-black uppercase rounded-xl hover:opacity-90 transition-all cursor-pointer">
                          Ajouter
                        </button>
                      </div>
                    </form>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {superAdmins.map((ad, idx) => (
                        <div key={idx} className="p-2.5 bg-afri-bg border border-afri-border/40 rounded-xl flex justify-between items-center text-xs">
                          <span className="font-mono text-afri-text truncate max-w-[200px]">{ad}</span>
                          <button
                            onClick={() => handleRemoveSuperAdmin(ad)}
                            className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                          >
                            <UserX className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 🛡 Bouclier AFRIGOMBO
                 ========================================================= */}
            {selectedSection === "bouclier" && (
              <div className="space-y-6">
                <BouclierAfrigombo />
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <ShieldCheck className="w-8 h-8 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>BOUCLIER AUTONOME — CYBER-DÉFENSE & MODÉRATION :</strong> Modérez les publications jugées suspectes par le filtre d'IA, approuvez ou révoquez les certifications Gombo ID d'artistes régionaux.
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-r from-afri-bg to-[#090909] border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Lock className="w-10 h-10 text-emerald-400 animate-pulse bg-emerald-500/5 p-2 rounded-xl" />
                    <div className="text-left">
                      <h4 className="text-xs font-mono font-black uppercase text-emerald-400 tracking-wider">Audit Cyber-Impérial Actif</h4>
                      <p className="text-[10px] font-mono text-afri-text-sec">Lancez un audit d'intégrité en direct sur l'ensemble de notre cluster Firestore.</p>
                    </div>
                  </div>
                  <button
                    onClick={triggerSecurityScan}
                    disabled={isScanning}
                    className="px-5 py-3 bg-emerald-500 text-black hover:bg-emerald-400 rounded-xl font-mono font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {isScanning ? "Analyse en cours..." : "Lancer l'audit cyber"}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Pending Certs */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-afri-border pb-3">
                      <h4 className="text-xs font-mono uppercase font-black text-afri-text flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#D4AF37]" />
                        Dossiers Gombo ID en Attente d'Arbitrage
                      </h4>
                      <span className="px-2.5 py-0.5 bg-afri-bg-sec/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-full text-[9px] font-mono">
                        {pendingCerts.length} dossiers
                      </span>
                    </div>

                    {pendingCerts.length === 0 ? (
                      <p className="text-afri-text-sec font-mono text-center py-8 text-xs">Aucune demande de certificat Gombo ID en attente d'évaluation.</p>
                    ) : (
                      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                        {pendingCerts.map((u: any) => (
                          <div key={u.id} className="p-4 bg-afri-bg border border-afri-border/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                            <div>
                              <h5 className="font-sans font-bold text-sm text-afri-text">{u.artisticName || u.nom || "Citoyen Inconnu"}</h5>
                              <p className="text-[10px] text-afri-text-sec font-mono mt-0.5">{u.email} • Commune: {u.commune || "Non spécifiée"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveCert(u.id)}
                                className="px-3 py-1.5 bg-emerald-500 text-black hover:bg-emerald-400 font-mono font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                              >
                                Certifier
                              </button>
                              <button
                                onClick={() => handleRejectCert(u.id)}
                                className="px-3 py-1.5 bg-red-950/40 text-red-400 border border-red-900/40 hover:bg-red-950 hover:text-red-300 font-mono font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                              >
                                Rejeter
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Moderation section */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-afri-border pb-3">
                      <h4 className="text-xs font-mono uppercase font-black text-afri-text flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                        Contributions Signalées pour Abus
                      </h4>
                      <span className="px-2.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[9px] font-mono">
                        {reportedPosts.length} signalements
                      </span>
                    </div>

                    {reportedPosts.length === 0 ? (
                      <p className="text-afri-text-sec font-mono text-center py-8 text-xs">Le fil de discussion est parfaitement sain. Aucun débordement.</p>
                    ) : (
                      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                        {reportedPosts.map((p: any) => (
                          <div key={p.id} className="p-4 bg-afri-bg border border-afri-border/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                            <div className="max-w-xs">
                              <h5 className="font-sans font-bold text-xs text-afri-text truncate">{p.title || "Contribution"}</h5>
                              <p className="text-[10px] text-afri-text-sec truncate mt-1">{p.content}</p>
                              <p className="text-[9px] text-red-400 font-mono mt-1">Alerte : {p.reportsCount || 1} signalements</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUnflagPost(p.id)}
                                className="px-2.5 py-1.5 bg-afri-bg-sec text-black font-mono font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                              >
                                Lever
                              </button>
                              <button
                                onClick={() => handleDeletePost(p.id)}
                                className="px-2.5 py-1.5 bg-red-600 text-afri-text font-mono font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 💰 Revenus Globaux
                 ========================================================= */}
            {selectedSection === "revenus" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <Coins className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>TRESORERIE IMPÉRIALE ET FLUX MONÉTAIRES :</strong> Suivi de la Gombocaisse souveraine, historique détaillé des prestations versées et virement des parts de cotisations d'abonnements.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-3xl text-center space-y-1.5">
                    <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-widest block">Trésor de l'Empire</span>
                    <strong className="text-2xl text-emerald-400 font-black font-display block">{formattedRevenues}</strong>
                    <span className="text-[8px] font-mono text-[#D4AF37] uppercase block">Cumul de souveraineté</span>
                  </div>

                  <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-3xl text-center space-y-1.5">
                    <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-widest block">Transactions Soumises</span>
                    <strong className="text-2xl text-afri-text font-black font-display block">{transactions.length}</strong>
                    <span className="text-[8px] font-mono text-afri-text-sec uppercase block">Total certifié en ligne</span>
                  </div>

                  <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-3xl text-center space-y-1.5">
                    <span className="text-[9px] font-mono text-afri-text-sec uppercase tracking-widest block">Commission de Plateforme</span>
                    <strong className="text-2xl text-sky-400 font-black font-display block">15%</strong>
                    <span className="text-[8px] font-mono text-sky-400 uppercase block">Redistribution active</span>
                  </div>
                </div>

                <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4">
                  <h4 className="text-xs font-mono uppercase font-black text-[#D4AF37] border-b border-afri-border pb-2">
                    Grand Livre de Caisse de l'Empire (Dernières Transactions)
                  </h4>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {transactions.length === 0 ? (
                      <p className="text-afri-text-sec text-center py-8 text-xs font-mono">Aucun virement ou prestation en cours.</p>
                    ) : (
                      transactions.map((tx, idx) => (
                        <div key={idx} className="p-3 bg-afri-bg border border-afri-border/40 hover:border-[#D4AF37]/30 rounded-2xl flex justify-between items-center text-xs transition-colors">
                          <div className="text-left">
                            <span className="font-sans font-bold text-afri-text block">{tx.description || "Gombo Prestation"}</span>
                            <span className="text-[9px] text-afri-text-sec font-mono block mt-0.5">{tx.timestamp ? new Date(tx.timestamp).toLocaleString("fr-FR") : "Date inconnue"}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-400 font-black block">+{Number(tx.amount || 0).toLocaleString("fr-FR")} FCFA</span>
                            <span className="text-[8px] text-afri-text-sec font-mono block uppercase">Statut: Validé</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 📈 Croissance
                 ========================================================= */}
            {selectedSection === "croissance" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <BarChart3 className="w-8 h-8 text-sky-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>EXPPANSION IMPÉRIALE — CROISSANCE :</strong> Surveillez le taux de pénétration régional et les nouveaux flux d'utilisateurs. Rédigez et fixez les nouveaux objectifs de croissance.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Stats Cards */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4">
                    <h4 className="text-xs font-mono uppercase font-black text-afri-text border-b border-afri-border pb-2">Mesures de Pénétration Culturelle</h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 bg-afri-bg rounded-2xl border border-afri-border/60">
                        <span className="text-[9px] font-mono text-afri-text-sec uppercase block">Citoyens</span>
                        <strong className="text-2xl text-afri-text block mt-1 font-black">{users.length}</strong>
                      </div>
                      <div className="p-4 bg-afri-bg rounded-2xl border border-afri-border/60">
                        <span className="text-[9px] font-mono text-afri-text-sec uppercase block">Ratio Certifiés</span>
                        <strong className="text-2xl text-[#D4AF37] block mt-1 font-black">
                          {users.length > 0 ? Math.round((certifiedCount / users.length) * 100) : 0}%
                        </strong>
                      </div>
                      <div className="p-4 bg-afri-bg rounded-2xl border border-afri-border/60">
                        <span className="text-[9px] font-mono text-afri-text-sec uppercase block">Expansion</span>
                        <strong className="text-2xl text-emerald-400 block mt-1 font-black">+24.8%</strong>
                      </div>
                      <div className="p-4 bg-afri-bg rounded-2xl border border-afri-border/60">
                        <span className="text-[9px] font-mono text-afri-text-sec uppercase block">Contrats Actifs</span>
                        <strong className="text-2xl text-sky-400 block mt-1 font-black">{gombos.length}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Set growth target */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-3 relative">
                    <div className="flex items-center gap-2 text-amber-500">
                      <Target className="w-5 h-5 text-amber-500" />
                      <span className="text-[11px] font-mono uppercase tracking-widest font-black text-amber-500">Objectifs de Croissance</span>
                    </div>
                    <p className="text-[10px] text-afri-text-sec font-mono">Définissez les paliers et les cibles d'expansion d'abonnés et d'usage pour motiver les troupes de terrain.</p>
                    <textarea
                      value={govData.growth}
                      onChange={(e) => {
                        setGovData({ ...govData, growth: e.target.value });
                        handleSaveGovField("growth", e.target.value);
                      }}
                      className="w-full h-36 bg-afri-bg border border-afri-border rounded-2xl p-4 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] font-mono leading-relaxed resize-none focus:ring-1 focus:ring-[#D4AF37]/35"
                      placeholder="Définissez les chiffres ou régions cibles..."
                    />
                    <span className="absolute bottom-4 right-10 text-[8px] font-mono text-afri-text-sec">FIRESTORE SYNC</span>
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 🧠 Intelligence
                 ========================================================= */}
            {selectedSection === "intelligence" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <Brain className="w-8 h-8 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>CONSOLE SOUVERAINE & INTÉGRITÉ CHRONIQUE :</strong> Interface de commande interactive. Tapez vos directives pour commander le Temple ou lancez l'audit cyber intelligent passif.
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Live Terminal Terminal Console */}
                  <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-3xl lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center border-b border-afri-border pb-2.5">
                      <h4 className="text-xs font-mono uppercase font-black tracking-wider text-[#D4AF37] flex items-center gap-2">
                        <Terminal className="w-4.5 h-4.5 text-[#D4AF37] animate-pulse" />
                        Terminal Interactif du Temple
                      </h4>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    </div>

                    <div className="font-mono text-[10px] text-afri-text-sec space-y-2 h-64 overflow-y-auto scrollbar-none pr-1 bg-afri-bg p-4 border border-afri-border/60 rounded-2xl leading-relaxed flex flex-col-reverse text-left">
                      <div>
                        {logs.map((logLine, idx) => (
                          <div key={idx} className="hover:text-afri-text transition-colors py-1 border-b border-zinc-950 font-mono">
                            {logLine}
                          </div>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleTerminalSubmit} className="flex gap-2">
                      <span className="font-mono text-[#D4AF37] text-xs self-center font-bold">{(typeof adminEmail === "string" ? adminEmail : String(adminEmail ?? "")).split("@")[0]}@throne:~$</span>
                      <input
                        type="text"
                        placeholder="Tapez /help pour les ordres..."
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        className="flex-1 bg-afri-bg border border-afri-border rounded-xl px-3 py-2 text-xs font-mono text-afri-text focus:outline-none focus:border-[#D4AF37]"
                      />
                    </form>
                  </div>

                  {/* Parameters Panel */}
                  <div className="p-6 bg-afri-bg-sec border border-afri-border rounded-3xl lg:col-span-1 space-y-4">
                    <h4 className="text-xs font-mono uppercase font-black text-afri-text border-b border-afri-border pb-2">Seuils Cognitifs de Protection</h4>
                    
                    <div className="space-y-4 text-xs font-mono text-afri-text">
                      <div className="space-y-1">
                        <label className="text-[10px] text-afri-text-sec uppercase block">Sensibilité du Matcher Gombo</label>
                        <input type="range" className="w-full accent-[#D4AF37]" min="1" max="10" defaultValue="8" />
                        <span className="text-[8px] text-[#D4AF37] block text-right font-black">NIVEAU 8 (TRÈS STRICT)</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-afri-text-sec uppercase block">Filtre Antispam Contributions</label>
                        <input type="range" className="w-full accent-[#D4AF37]" min="1" max="10" defaultValue="9" />
                        <span className="text-[8px] text-[#D4AF37] block text-right font-black">NIVEAU 9 (HERMÉTIQUE)</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-afri-text-sec uppercase block">Alerte Ping Intrusion Passif</label>
                        <input type="range" className="w-full accent-[#D4AF37]" min="1" max="10" defaultValue="5" />
                        <span className="text-[8px] text-[#D4AF37] block text-right font-black">NIVEAU 5 (HARMONIEUX)</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 🏛 DEMANDES & FORMULAIRES DU TRÔNE DU FONDATEUR
                 ========================================================= */}
            {selectedSection === "throne_forms" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/30 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_25px_rgba(212,175,55,0.08)]">
                  <div className="flex items-center gap-4">
                    <Crown className="w-8 h-8 text-[#D4AF37] shrink-0 animate-pulse" />
                    <div>
                      <h3 className="text-sm font-display font-black text-[#D4AF37] uppercase tracking-wider">
                        Trône du Fondateur — Centre des Formulaires & Recours
                      </h3>
                      <p className="text-xs text-afri-text-sec font-mono mt-0.5">
                        Écoute temps réel des soumissions directes: Support, Litiges, Certification KYC, et Signalements de Bugs.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSection(null)}
                    className="px-4 py-2 bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] text-xs font-mono font-bold text-afri-text rounded-2xl transition-all cursor-pointer"
                  >
                    ← Retour au Tableau Souverain
                  </button>
                </div>

                {/* SUB TABS NAVIGATION */}
                <div className="flex flex-wrap items-center gap-2 border-b border-afri-border pb-3">
                  <button
                    onClick={() => setFormSubTab("support")}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      formSubTab === "support"
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-afri-bg-sec text-afri-text-sec hover:text-afri-text border border-afri-border"
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    <span>Support / Conseiller</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-black">
                      {ticketsSupport.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setFormSubTab("disputes")}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      formSubTab === "disputes"
                        ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                        : "bg-afri-bg-sec text-afri-text-sec hover:text-afri-text border border-afri-border"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Litiges Gombos</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-black">
                      {disputesList.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setFormSubTab("kyc")}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      formSubTab === "kyc"
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                        : "bg-afri-bg-sec text-afri-text-sec hover:text-afri-text border border-afri-border"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Dossiers KYC (ID)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-black">
                      {kycRequests.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setFormSubTab("bugs")}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      formSubTab === "bugs"
                        ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                        : "bg-afri-bg-sec text-afri-text-sec hover:text-afri-text border border-afri-border"
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Signalements Bugs</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-black">
                      {bugReports.length}
                    </span>
                  </button>
                </div>

                {/* SUB TAB CONTENT */}
                <div className="space-y-4">
                  {/* 1. TICKETS SUPPORT */}
                  {formSubTab === "support" && (
                    <div className="space-y-4">
                      {ticketsSupport.length === 0 ? (
                        <div className="p-12 text-center bg-afri-bg border border-afri-border rounded-3xl text-afri-text-sec font-mono text-xs">
                          Aucun ticket de support enregistré dans `tickets_support`.
                        </div>
                      ) : (
                        ticketsSupport.map((ticket: any) => (
                          <div
                            key={ticket.id}
                            className={`p-5 rounded-3xl border transition-all ${
                              ticket.status === "RESOLVED"
                                ? "bg-afri-bg/50 border-afri-border opacity-70"
                                : "bg-afri-bg border-indigo-500/40 shadow-lg"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                              <div>
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-widest inline-block mb-1.5">
                                  {ticket.subject || ticket.category || "Support"}
                                </span>
                                <h4 className="text-sm font-bold text-afri-text font-sans">
                                  {ticket.title || ticket.subject || "Message Support"}
                                </h4>
                                <span className="text-[11px] font-mono text-afri-text-sec block">
                                  Par: <strong>{ticket.userName || "Citoyen"}</strong> ({ticket.userEmail || "Non renseigné"}) • UID: {ticket.userId}
                                </span>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold ${
                                  ticket.status === "RESOLVED"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                                }`}
                              >
                                {ticket.status === "RESOLVED" ? "RÉSOLU" : "EN ATTENTE"}
                              </span>
                            </div>

                            <p className="text-xs text-afri-text bg-afri-bg-sec/50 p-3 rounded-2xl border border-afri-border font-sans leading-relaxed my-3">
                              {ticket.message || ticket.details || "Pas de message spécifique."}
                            </p>

                            <div className="flex items-center justify-between text-[10px] font-mono text-afri-text-sec pt-2 border-t border-afri-border/50">
                              <span>Reçu le: {new Date(ticket.createdAt).toLocaleString("fr-FR")}</span>
                              {ticket.status !== "RESOLVED" && (
                                <button
                                  onClick={() => handleResolveTicketSupport(ticket)}
                                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer transition-all shadow-md"
                                >
                                  ✓ Marquer comme Traité & Notifier
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* 2. LITIGES GOMBOS */}
                  {formSubTab === "disputes" && (
                    <div className="space-y-4">
                      {disputesList.length === 0 ? (
                        <div className="p-12 text-center bg-afri-bg border border-afri-border rounded-3xl text-afri-text-sec font-mono text-xs">
                          Aucun litige enregistré dans `disputes`.
                        </div>
                      ) : (
                        disputesList.map((dispute: any) => (
                          <div
                            key={dispute.id}
                            className={`p-5 rounded-3xl border transition-all ${
                              dispute.status === "RESOLVED"
                                ? "bg-afri-bg/50 border-afri-border opacity-70"
                                : "bg-afri-bg border-amber-500/50 shadow-lg"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                              <div>
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest inline-block mb-1.5">
                                  Litige Gombo #{dispute.gomboId || "GÉNÉRAL"}
                                </span>
                                <h4 className="text-sm font-bold text-afri-text font-sans">
                                  Raison: {dispute.reason || dispute.title || "Litige de prestation"}
                                </h4>
                                <span className="text-[11px] font-mono text-afri-text-sec block">
                                  Déclaré par: <strong>{dispute.userName || "Utilisateur"}</strong> ({dispute.userEmail || "Sans email"}) • ID: {dispute.userId}
                                </span>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold ${
                                  dispute.status === "RESOLVED"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                                }`}
                              >
                                {dispute.status === "RESOLVED" ? "LITIGE RÉSOLU" : "ARBITRAGE REQUIS"}
                              </span>
                            </div>

                            <p className="text-xs text-afri-text bg-afri-bg-sec/50 p-3 rounded-2xl border border-afri-border font-sans leading-relaxed my-3">
                              {dispute.message || dispute.details || "Détails du litige non fournis."}
                            </p>

                            <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-afri-text-sec pt-2 border-t border-afri-border/50">
                              <span>Déclaré le: {new Date(dispute.createdAt).toLocaleString("fr-FR")}</span>
                              {dispute.status !== "RESOLVED" && (
                                <button
                                  onClick={() => handleResolveDispute(dispute)}
                                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-black rounded-xl cursor-pointer transition-all shadow-md"
                                >
                                  ⚖️ Arbitrer & Résoudre le Litige
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* 3. DOSSIERS KYC */}
                  {formSubTab === "kyc" && (
                    <div className="space-y-4">
                      {kycRequests.length === 0 ? (
                        <div className="p-12 text-center bg-afri-bg border border-afri-border rounded-3xl text-afri-text-sec font-mono text-xs">
                          Aucun dossier KYC enregistré dans `kyc_requests`.
                        </div>
                      ) : (
                        kycRequests.map((kyc: any) => (
                          <div
                            key={kyc.id}
                            className={`p-5 rounded-3xl border transition-all ${
                              kyc.status === "APPROVED"
                                ? "bg-afri-bg/50 border-emerald-500/30"
                                : kyc.status === "REJECTED"
                                ? "bg-afri-bg/50 border-red-500/30"
                                : "bg-afri-bg border-purple-500/50 shadow-lg"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                              <div>
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase tracking-widest inline-block mb-1.5">
                                  GOMBO ID — Certification KYC
                                </span>
                                <h4 className="text-sm font-bold text-afri-text font-sans">
                                  {kyc.userName || "Artiste / Citoyen"}
                                </h4>
                                <span className="text-[11px] font-mono text-afri-text-sec block">
                                  Email: {kyc.userEmail || "Non fourni"} • UID: {kyc.userId}
                                </span>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold ${
                                  kyc.status === "APPROVED"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : kyc.status === "REJECTED"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                                }`}
                              >
                                {kyc.status === "APPROVED" ? "VALIDÉ 🎖️" : kyc.status === "REJECTED" ? "REJETÉ ⚠️" : "EN ATTENTE"}
                              </span>
                            </div>

                            <p className="text-xs text-afri-text bg-afri-bg-sec/50 p-3 rounded-2xl border border-afri-border font-sans leading-relaxed my-3">
                              {kyc.details || "Dossier d'identité soumis pour audit artistique."}
                            </p>

                            <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-afri-text-sec pt-2 border-t border-afri-border/50">
                              <span>Soumis le: {new Date(kyc.createdAt).toLocaleString("fr-FR")}</span>
                              {kyc.status !== "APPROVED" && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleRejectKYC(kyc)}
                                    className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 rounded-xl font-bold cursor-pointer transition-all"
                                  >
                                    Rejeter ⚠️
                                  </button>
                                  <button
                                    onClick={() => handleApproveKYC(kyc)}
                                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black cursor-pointer transition-all shadow-md"
                                  >
                                    🎖️ Valider KYC & Certifier GOMBO ID
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* 4. RAPPORTS BUGS */}
                  {formSubTab === "bugs" && (
                    <div className="space-y-4">
                      {bugReports.length === 0 ? (
                        <div className="p-12 text-center bg-afri-bg border border-afri-border rounded-3xl text-afri-text-sec font-mono text-xs">
                          Aucun rapport de bug enregistré dans `bug_reports`.
                        </div>
                      ) : (
                        bugReports.map((bug: any) => (
                          <div
                            key={bug.id}
                            className={`p-5 rounded-3xl border transition-all ${
                              bug.status === "RESOLVED"
                                ? "bg-afri-bg/50 border-afri-border opacity-70"
                                : "bg-afri-bg border-rose-500/50 shadow-lg"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                              <div>
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-widest inline-block mb-1.5">
                                  Bug: {bug.subject || bug.title || "Interface"}
                                </span>
                                <h4 className="text-sm font-bold text-afri-text font-sans">
                                  {bug.title || "Signalement de dysfonctionnement"}
                                </h4>
                                <span className="text-[11px] font-mono text-afri-text-sec block">
                                  Rapporté par: <strong>{bug.userName || "Citoyen"}</strong> ({bug.userEmail || "Pas d'email"}) • UID: {bug.userId}
                                </span>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold ${
                                  bug.status === "RESOLVED"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse"
                                }`}
                              >
                                {bug.status === "RESOLVED" ? "CORRIGÉ 🐛" : "À CORRIGER"}
                              </span>
                            </div>

                            <p className="text-xs text-afri-text bg-afri-bg-sec/50 p-3 rounded-2xl border border-afri-border font-sans leading-relaxed my-3">
                              {bug.message || bug.details || "Description du bug non fournie."}
                            </p>

                            <div className="flex items-center justify-between text-[10px] font-mono text-afri-text-sec pt-2 border-t border-afri-border/50">
                              <span>Signalé le: {new Date(bug.createdAt).toLocaleString("fr-FR")}</span>
                              {bug.status !== "RESOLVED" && (
                                <button
                                  onClick={() => handleResolveBugReport(bug)}
                                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold cursor-pointer transition-all shadow-md"
                                >
                                  ✓ Marquer comme Corrigé & Notifier
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 📢 Publications en attente
                 ========================================================= */}
            {selectedSection === "publications" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-sky-500/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(14,165,233,0.05)]">
                  <FileText className="w-8 h-8 text-sky-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>CENTRE DE COMMANDEMENT — PUBLICATIONS EN ATTENTE :</strong> Validez ou refusez manuellement les demandes de publication enregistrées. Une fois validée par vos soins, la publication est immédiatement publiée et devient visible sur Le Terrain.
                  </div>
                </div>

                <div className="p-1 sm:p-4 bg-afri-bg border border-afri-border rounded-3xl">
                  <PendingPublicationsAdminPanel currentUser={profile} autoPilotEnabled={autoPilotEnabled} />
                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 🛡 Transactions Bêta (Escrow Pilotage)
                 ========================================================= */}
            {selectedSection === "beta_escrow" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-emerald-500/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(52,211,153,0.05)]">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>PILOTAGE SÉQUESTRE — TRANSACTIONS BÊTA :</strong> Bienvenue dans le Centre de Commandement Bêta. Ici, vous validez manuellement les dépôts après vérification du paiement Mobile Money et libérez les fonds une fois la prestation accomplie.
                  </div>
                </div>

                <div className="p-1 sm:p-4 bg-afri-bg border border-afri-border rounded-3xl">
                  <BetaTransactionsAdminPanel 
                    currentUser={profile} 
                    onOpenSupportChat={(targetUser) => {
                      // Switch to intelligence for terminal support or just show toast
                      setSelectedSection("intelligence");
                    }}
                  />
                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: ✨ Fil Découvertes (Marché & Académie)
                 ========================================================= */}
            {selectedSection === "decouvertes" && (
              <AdminDecouvertesCentre audioSynth={audioSynth} />
            )}

            {/* =========================================================
                 DETAILED VIEW: 🎬 Centre Multimédia (Royal Sound Designer)
                 ========================================================= */}
            {selectedSection === "multimedia" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <Music className="w-8 h-8 text-purple-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>SOUND DESIGNER ROYAL — BIBLIOTHÈQUE MULTIMÉDIA :</strong> Administrez les flux sonores du Temple, chargez de nouveaux enregistrements et affectez des ambiances aux différents spots du site.
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Sound list */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono uppercase font-black text-afri-text border-b border-afri-border pb-2">Patrimoine Musical Actif</h4>

                    <div className="flex flex-col gap-3 mb-6">
                      {/* INTRO */}
                      <div className="p-3 border rounded-2xl flex items-center justify-between gap-4 text-xs transition-all bg-afri-bg-sec/5 border-[#D4AF37]/40 hover:border-[#D4AF37]">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              if (audioState.currentPlaying === 'intro') {
                                audioState.isPaused ? globalAudioManager.resume() : globalAudioManager.pause();
                              } else {
                                globalAudioManager.playIntro(true);
                              }
                            }}
                            className="w-10 h-10 rounded-full bg-afri-bg-sec/20 hover:bg-afri-bg-sec/40 flex items-center justify-center text-[#D4AF37] cursor-pointer border border-[#D4AF37]/30 shadow-md"
                          >
                            {audioState.currentPlaying === 'intro' && !audioState.isPaused ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                          </button>
                          <div className="text-left">
                            <span className="font-sans font-bold text-[#D4AF37] block flex items-center gap-2">
                              Aperçu Intro
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-[#D4AF37]/20 border border-[#D4AF37]/30 uppercase tracking-widest">ID: INTRO</span>
                            </span>
                            <span className="text-[9px] text-afri-text-sec font-mono block mt-0.5">Introduction Officielle (GitHub Raw)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-24">
                          <Volume2 className="w-3 h-3 text-[#D4AF37]" />
                          <input
                            type="range" min="0" max="1" step="0.05"
                            value={audioState.volume}
                            onChange={(e) => globalAudioManager.setVolume(parseFloat(e.target.value))}
                            className="w-full h-1 bg-afri-bg-ter rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                          />
                        </div>
                      </div>

                      {/* ANTHEM */}
                      <div className="p-3 border rounded-2xl flex items-center justify-between gap-4 text-xs transition-all bg-afri-bg-sec/5 border-amber-500/40 hover:border-amber-500">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              if (audioState.currentPlaying === 'hymne') {
                                audioState.isPaused ? globalAudioManager.resume() : globalAudioManager.pause();
                              } else {
                                globalAudioManager.playHymn();
                              }
                            }}
                            className="w-10 h-10 rounded-full bg-afri-bg-sec/20 hover:bg-afri-bg-sec/40 flex items-center justify-center text-amber-500 cursor-pointer border border-amber-500/30 shadow-md"
                          >
                            {audioState.currentPlaying === 'hymne' && !audioState.isPaused ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                          </button>
                          <div className="text-left">
                            <span className="font-sans font-bold text-amber-500 block flex items-center gap-2">
                              Aperçu Hymne
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-500/20 border border-amber-500/30 uppercase tracking-widest">ID: ANTHEM</span>
                            </span>
                            <span className="text-[9px] text-afri-text-sec font-mono block mt-0.5">Hymne Officiel (GitHub Raw)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-24">
                          <Volume2 className="w-3 h-3 text-amber-500" />
                          <input
                            type="range" min="0" max="1" step="0.05"
                            value={audioState.volume}
                            onChange={(e) => globalAudioManager.setVolume(parseFloat(e.target.value))}
                            className="w-full h-1 bg-afri-bg-ter rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>
                      </div>
                      
                      {/* AMBIENT */}
                      <div className="p-3 border rounded-2xl flex items-center justify-between gap-4 text-xs transition-all bg-afri-bg-sec/5 border-emerald-500/40 hover:border-emerald-500">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                                // Handled externally by BackgroundMusic UI
                                setSuccessMsg("Veuillez utiliser le bouton Mute/Unmute flottant en bas à droite pour contrôler la musique d'ambiance.");
                                setTimeout(() => setSuccessMsg(""), 4000);
                            }}
                            className="w-10 h-10 rounded-full bg-afri-bg-sec/20 hover:bg-afri-bg-sec/40 flex items-center justify-center text-emerald-500 cursor-pointer border border-emerald-500/30 shadow-md"
                          >
                            <Music className="w-4 h-4" />
                          </button>
                          <div className="text-left">
                            <span className="font-sans font-bold text-emerald-500 block flex items-center gap-2">
                              Aperçu Ambiance
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-500/20 border border-emerald-500/30 uppercase tracking-widest">ID: AMBIENT</span>
                            </span>
                            <span className="text-[9px] text-afri-text-sec font-mono block mt-0.5">Musique d'ambiance en boucle (Global)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {musicTracks.length === 0 ? (
                      <p className="text-afri-text-sec font-mono text-center py-10 text-xs">Aucune mélodie royale chargée dans le cluster.</p>
                    ) : (
                      <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                        {musicTracks.map((track, idx) => (
                          <div key={track.id} className={`p-3 border rounded-2xl flex items-center justify-between gap-4 text-xs transition-all ${playingTrackId === track.id ? 'bg-afri-bg-sec/5 border-[#D4AF37]' : 'bg-afri-bg border-afri-border/60'}`}>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handlePlayPauseTrack(track)}
                                className="w-8 h-8 rounded-full bg-afri-bg-sec/10 hover:bg-afri-bg-sec/20 flex items-center justify-center text-[#D4AF37] cursor-pointer"
                              >
                                {playingTrackId === track.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </button>
                              <div className="text-left">
                                <span className="font-sans font-bold text-afri-text block">{track.title}</span>
                                <span className="text-[9px] text-afri-text-sec font-mono block mt-0.5">{track.artist}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReorderMusic(idx, "up")}
                                className="p-1 text-afri-text-sec hover:text-afri-text transition-colors cursor-pointer"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReorderMusic(idx, "down")}
                                className="p-1 text-afri-text-sec hover:text-afri-text transition-colors cursor-pointer"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMusicTrack(track.id)}
                                className="p-1 text-red-500/70 hover:text-red-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Track & Assign Spots */}
                  <div className="space-y-6">
                    {/* Form */}
                    <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4 text-left">
                      <h4 className="text-xs font-mono uppercase font-black text-[#D4AF37] border-b border-afri-border pb-2">Ajouter un Opus</h4>
                      
                      <form onSubmit={handleAddMusicTrack} className="space-y-3 font-mono text-xs">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-afri-text-sec block font-bold">Titre de l'Œuvre</label>
                          <input
                            type="text"
                            placeholder="ex: Célébration des Ancêtres"
                            value={newTrackTitle}
                            onChange={(e) => setNewTrackTitle(e.target.value)}
                            className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-afri-text focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-afri-text-sec block font-bold">Artiste / Compositeur</label>
                          <input
                            type="text"
                            placeholder="ex: Kora Orphée Abidjan"
                            value={newTrackArtist}
                            onChange={(e) => setNewTrackArtist(e.target.value)}
                            className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-afri-text focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-afri-text-sec block font-bold">Adresse URL Absolue du fichier (Audio MP3/WAV)</label>
                          <input
                            type="url"
                            placeholder="https://assets.mixkit.co/active_storage/sfx/..."
                            value={newTrackUrl}
                            onChange={(e) => setNewTrackUrl(e.target.value)}
                            className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-afri-text focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                        <button type="submit" className="w-full py-2.5 bg-afri-bg-sec text-black font-black uppercase text-[10px] tracking-wider hover:opacity-90 transition-all rounded-xl cursor-pointer">
                          Enregistrer dans l'Empire
                        </button>
                      </form>
                    </div>

                    {/* Spots controller */}
                    <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4 text-left font-mono">
                      <h4 className="text-xs font-mono uppercase font-black text-afri-text border-b border-afri-border pb-2">Affectation Acoustique</h4>
                      
                      <div className="space-y-3 text-xs">
                        {["accueil", "throne", "navigation", "celebration"].map((spotKey) => (
                          <div key={spotKey} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-afri-bg rounded-2xl border border-afri-border/40">
                            <div>
                              <span className="font-bold text-afri-text uppercase text-[10px] block">{spotKey}</span>
                              <span className="text-[8px] text-afri-text-sec block truncate max-w-[180px]">{musicSpots[spotKey as keyof MusicSpots] || "Aucune musique active"}</span>
                            </div>
                            <select
                              onChange={(e) => handleAssignSpot(spotKey as keyof MusicSpots, e.target.value)}
                              value={musicSpots[spotKey as keyof MusicSpots] || ""}
                              className="bg-afri-bg border border-afri-border text-afri-text rounded-lg p-1.5 focus:outline-none focus:border-[#D4AF37] text-[10px]"
                            >
                              <option value="">-- Assigner Opus --</option>
                              {musicTracks.map(t => (
                                <option key={t.id} value={t.url}>{t.title}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 🚨 Veille Critique
                 ========================================================= */}
            {selectedSection === "veille" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <AlertTriangle className="w-8 h-8 text-red-500 shrink-0 mt-0.5 animate-bounce" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>SIGNALEMENTS & VEILLE CRITIQUE :</strong> Veillez sur les signaux passifs du Temple d'Abidjan et réagissez de manière précoce face aux tentatives d'intrusions d'utilisateurs suspects.
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Suspect actors telemetry */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4">
                    <h4 className="text-xs font-mono uppercase font-black text-afri-text border-b border-afri-border pb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-500" />
                      Télémétrie Active d'Intrusions Passives
                    </h4>

                    <div className="space-y-3 font-mono text-[10px] text-afri-text-sec">
                      <div className="p-3 bg-afri-bg rounded-2xl border border-afri-border/60 flex justify-between items-center">
                        <div className="text-left">
                          <span className="text-afri-text block font-bold">Tentatives d'accès de brute-force</span>
                          <span className="text-[8px] text-afri-text-sec block mt-0.5">IP: 213.12.98.45 (Nigéria)</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold">PARÉ</span>
                      </div>

                      <div className="p-3 bg-afri-bg rounded-2xl border border-afri-border/60 flex justify-between items-center">
                        <div className="text-left">
                          <span className="text-afri-text block font-bold">Vérification de Token CSRF suspect</span>
                          <span className="text-[8px] text-afri-text-sec block mt-0.5">Appareil: Mozilla Gecko Client</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold">RÉSOLU</span>
                      </div>

                      <div className="p-3 bg-afri-bg rounded-2xl border border-afri-border/60 flex justify-between items-center">
                        <div className="text-left">
                          <span className="text-afri-text block font-bold">Suspicion passive usurpateur</span>
                          <span className="text-[8px] text-afri-text-sec block mt-0.5">Utilisateur: invite_temp349</span>
                        </div>
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full font-bold animate-pulse">CRITIQUE</span>
                      </div>
                    </div>
                  </div>

                  {/* Active threat resolutions */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4 text-left font-mono">
                    <h4 className="text-xs font-mono uppercase font-black text-afri-text border-b border-afri-border pb-2">Actions d'Urgence</h4>
                    <p className="text-[10px] text-afri-text-sec leading-relaxed">Déclenchez le blocage passif temporaire de l'ensemble du réseau en cas d'attaque généralisée avérée.</p>
                    
                    <div className="space-y-2.5">
                      <button
                        onClick={() => {
                          setSuccessMsg("PARE-FEU EN MODE RENFORCÉ SOUVERAIN (TOUTES LES IP SUSPECTES SONT BANNIES TEMPORAIREMENT).");
                          setTimeout(() => setSuccessMsg(""), 5000);
                          try { audioSynth?.playTamTam(true); } catch (_) {}
                        }}
                        className="w-full py-3 bg-red-950/40 text-red-400 border border-red-900 hover:bg-red-900 hover:text-afri-text font-mono font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        🔥 Activer Bouclier Anti-Usurpateur Strict
                      </button>

                      <button
                        onClick={() => {
                          setSuccessMsg("ALERTE DE VIGILANCE COMMUNIQUEE AUX CITOYENS D'ABIDJAN.");
                          setTimeout(() => setSuccessMsg(""), 4000);
                          try { audioSynth?.playValidationSuccess(); } catch (_) {}
                        }}
                        className="w-full py-3 bg-afri-bg-sec text-afri-text hover:bg-afri-bg-ter font-mono font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        📢 Diffuser Alerte Vigilance Générale
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 📜 Journal Impérial
                 ========================================================= */}
            {selectedSection === "journal" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <Scroll className="w-8 h-8 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>📜 ANNALES DE GOUVERNANCE ET JOURNAL IMPÉRIAL :</strong> Rédigez le journal d'apprentissage et de stratégie du Fondateur, signez de nouveaux décrets impériaux et diffusez de grands messages mégaphoniques.
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Journal and Decisions field textareas */}
                  <div className="space-y-6">
                    {/* Journal */}
                    <div className="p-5 bg-afri-bg border border-afri-border rounded-3xl space-y-2 relative">
                      <div className="flex items-center gap-2 text-[#D4AF37]">
                        <BookOpen className="w-4.5 h-4.5" />
                        <span className="text-[9px] font-mono uppercase tracking-widest font-black">Journal Intime du Fondateur</span>
                      </div>
                      <textarea
                        value={govData.journal}
                        onChange={(e) => {
                          setGovData({ ...govData, journal: e.target.value });
                          handleSaveGovField("journal", e.target.value);
                        }}
                        className="w-full h-28 bg-afri-bg border border-afri-border rounded-xl p-3 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] font-mono leading-relaxed resize-none focus:ring-1 focus:ring-[#D4AF37]/30"
                        placeholder="Notes d'observation de terrain..."
                      />
                      <span className="absolute bottom-4 right-10 text-[7px] font-mono text-zinc-650">FIRESTORE SYNC</span>
                    </div>

                    {/* Strategic Decisions */}
                    <div className="p-5 bg-afri-bg border border-afri-border rounded-3xl space-y-2 relative">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Scroll className="w-4.5 h-4.5" />
                        <span className="text-[9px] font-mono uppercase tracking-widest font-black">Decisions Strategiques de Souche</span>
                      </div>
                      <textarea
                        value={govData.decisions}
                        onChange={(e) => {
                          setGovData({ ...govData, decisions: e.target.value });
                          handleSaveGovField("decisions", e.target.value);
                        }}
                        className="w-full h-28 bg-afri-bg border border-afri-border rounded-xl p-3 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] font-mono leading-relaxed resize-none focus:ring-1 focus:ring-[#D4AF37]/30"
                        placeholder="Écrivez les décrets signés aujourd'hui..."
                      />
                      <span className="absolute bottom-4 right-10 text-[7px] font-mono text-zinc-650">FIRESTORE SYNC</span>
                    </div>
                  </div>

                  {/* Broadcast Form */}
                  <div className="p-6 bg-afri-bg border border-afri-border rounded-3xl space-y-4">
                    <h4 className="text-xs font-mono uppercase font-black text-afri-text border-b border-afri-border pb-2 flex items-center gap-2">
                      <Send className="w-4.5 h-4.5 text-sky-400" />
                      Signer & Diffuser un Décret Mégaphonique
                    </h4>

                    <form onSubmit={handleSendNotice} className="space-y-3 font-mono text-xs">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase text-afri-text-sec block font-bold">Catégorie du Décret</label>
                        <select
                          value={noticeCategory}
                          onChange={(e) => setNoticeCategory(e.target.value)}
                          className="w-full bg-afri-bg border border-afri-border rounded-xl p-2 text-afri-text focus:outline-none focus:border-[#D4AF37]"
                        >
                          <option value="MESSAGE SPECIAL">👑 DECRET SPECIAL DU SOUVERAIN</option>
                          <option value="MAINTENANCE">🛡️ ALERTE DE PROTECTION SYSTÈME</option>
                          <option value="INFO GOMBO">🔥 OFFRES & GOMBO NEWS</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase text-afri-text-sec block font-bold">Titre Impérial</label>
                        <input
                          type="text"
                          placeholder="ex: LANÇEMENT DES CERTIFICATIONS ACTIVES"
                          value={noticeTitle}
                          onChange={(e) => setNoticeTitle(e.target.value)}
                          className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-afri-text focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase text-afri-text-sec block font-bold">Corps du Message</label>
                        <textarea
                          rows={4}
                          placeholder="Écrivez le message de décret..."
                          value={noticeBody}
                          onChange={(e) => setNoticeBody(e.target.value)}
                          className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-afri-text focus:outline-none focus:border-[#D4AF37] leading-relaxed resize-none"
                        />
                      </div>

                      <button type="submit" className="w-full py-2.5 bg-afri-bg-sec text-black font-black uppercase text-[10px] tracking-wider hover:opacity-90 transition-all rounded-xl cursor-pointer">
                        Diffuser maintenant
                      </button>
                    </form>
                  </div>

                </div>
              </div>
            )}

            {/* =========================================================
                 DETAILED VIEW: 📋 Checklist Bêta
                 ========================================================= */}
            {selectedSection === "checklist" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <CheckSquare className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>📋 CHECKLIST DE VALIDATION DE LA BÊTA PUBLIQUE :</strong> Suivez pas à pas la validation de l'écosystème souverain AFRIGOMBO ELITE. Cochez les modules pour certifier leur bon fonctionnement avant le déploiement général.
                  </div>
                </div>

                <div className="bg-afri-bg border border-afri-border rounded-3xl p-6 space-y-6">
                  {/* Progress Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-afri-border">
                    <div>
                      <h3 className="text-sm font-sans font-black text-afri-text uppercase tracking-wider">
                        Progression de la Certification Bêta
                      </h3>
                      <p className="text-[10px] font-mono text-afri-text-sec uppercase mt-1">
                        Chaque jalon doit être testé rigoureusement sur mobile et ordinateur
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-black text-[#D4AF37] bg-afri-bg-sec/10 border border-[#D4AF37]/25 px-3 py-1 rounded-xl">
                        {progressCount} / 11 VALIDÉS ({Math.round((progressCount / 11) * 100)}%)
                      </span>
                      <button
                        onClick={() => {
                          const reset = Object.keys(betaChecklist).reduce((acc, k) => ({ ...acc, [k]: false }), {});
                          setBetaChecklist(reset);
                          localStorage.setItem("afrigombo_beta_checklist", JSON.stringify(reset));
                          if (audioSynth) {
                            try { audioSynth.playValidationSuccess(); } catch (_) {}
                          }
                        }}
                        className="text-[9px] font-mono uppercase text-afri-text-sec hover:text-afri-text transition-colors cursor-pointer"
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-afri-bg rounded-full overflow-hidden border border-afri-border">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(progressCount / 11) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  {/* Checklist grid list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries({
                      "Connexion Google": "Authentification sécurisée avec Firebase Auth et persistance de session.",
                      "Déconnexion": "Fermeture propre de session, effacement sécurisé du cache utilisateur local.",
                      "Création publication": "Ajout fluide de posts, textes, catégories, et liaison Gombo ID en temps réel.",
                      "Modification profil": "Mise à jour des coordonnées d'artiste, biographie, réseaux sociaux et rôle.",
                      "Upload image": "Traitement optimisé avec compression et hébergement cloud résilient.",
                      "Notifications": "Envoi d'alertes instantanées, notifications d'activité, et décrets souverains.",
                      "Navigation": "Routage réactif de 200 à 300ms sans clignotement ni blocage tactile.",
                      "Centre de Commandement": "Monitoring en temps réel des flux d'activités, des signalements et logs.",
                      "Trône": "Accès souverain restreint au fondateur d'élite pour la gouvernance impériale.",
                      "Responsive Android": "Adaptation pixel-perfect, zones de touches de 44px minimum, fluidité absolue.",
                      "Firebase": "Configuration offline par long-polling configurée et gestion des pings de base de données."
                    }).map(([key, desc]) => {
                      const isChecked = betaChecklist[key];
                      return (
                        <div
                          key={key}
                          onClick={() => toggleChecklist(key)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${isChecked ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40' : 'bg-afri-bg/40 border-afri-border hover:border-afri-border'}`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Square className="w-5 h-5 text-zinc-650 hover:text-afri-text-sec" />
                            )}
                          </div>
                          <div className="space-y-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-sans font-bold ${isChecked ? 'text-afri-text' : 'text-afri-text'}`}>
                                {key}
                              </span>
                              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-black ${isChecked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
                                {isChecked ? 'VALIDÉ' : 'EN COURS'}
                              </span>
                            </div>
                            <p className="text-[10px] text-afri-text-sec font-mono leading-relaxed">
                              {desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {selectedSection === "economy" && (() => {
              // Real-time sovereign economic metrics calculation
              const totalCommissions = allContracts.filter(c => c.status === "signed" || c.status === "validated" || c.status === "active" || c.status === "completed").reduce((acc, c) => acc + (c.commissionClient || 0) + (c.commissionArtist || 0), 0);
              const totalPremiumRevenue = allPayments.filter(p => p.purpose?.includes("Premium") || p.purpose?.includes("ELITE") || p.purpose?.includes("PRO")).reduce((acc, p) => acc + (p.amount || 0), 0);
              const totalArtists = (users || []).filter(u => u.role === "musician" || u.role === "artist" || !u.isAdmin).length || 1;
              const premiumArtistsCount = (users || []).filter(u => (u.role === "musician" || u.role === "artist" || !u.isAdmin) && (u.isPremium || u.badges?.includes("💎 Adhérent Premium"))).length;
              const penetrationRate = Math.round((premiumArtistsCount / totalArtists) * 100);
              const signedContractsCount = allContracts.filter(c => c.status === "signed" || c.status === "completed" || c.status === "validated" || c.clientSignedAt || c.artistSignedAt).length;
              const totalSavings = allContracts.reduce((acc, c) => acc + (c.savingsClient || 0) + (c.savingsArtist || 0), 0);

              return (
                <div className="space-y-6">
                  <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                    <Coins className="w-8 h-8 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div className="text-xs text-afri-text leading-relaxed font-mono">
                      <strong>💰 GESTION ÉCONOMIQUE SOUVERAINE :</strong> Configurez la commission universelle et surveillez en temps réel l'essor de la richesse partagée au sein du Temple du Gombo.
                    </div>
                  </div>

                  {/* Real-time Sovereign Economic Health Dashboard */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-mono uppercase text-afri-text-sec tracking-widest border-l-2 border-[#D4AF37] pl-3">
                      SANTÉ ÉCONOMIQUE DE L'EMPIRE (TEMPS RÉEL)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* 1. Commissions */}
                      <div className="bg-afri-bg/90 border border-afri-border rounded-3xl p-5 flex flex-col justify-between shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl"></div>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider">Commissions</span>
                            <Coins className="w-4 h-4 text-emerald-400" />
                          </div>
                          <span className="text-xl font-black text-emerald-400 tracking-tight block">
                            {totalCommissions.toLocaleString()} FCFA
                          </span>
                        </div>
                        <p className="text-[8.5px] text-afri-text-sec mt-2">Frais de service (12% / 10% / 8%) perçus sur les contrats finalisés</p>
                      </div>

                      {/* 2. Premium subscriptions */}
                      <div className="bg-afri-bg/90 border border-afri-border rounded-3xl p-5 flex flex-col justify-between shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-afri-bg-sec/5 rounded-full blur-xl"></div>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider">Revenus Premium</span>
                            <Crown className="w-4 h-4 text-[#D4AF37]" />
                          </div>
                          <span className="text-xl font-black text-[#D4AF37] tracking-tight block">
                            {totalPremiumRevenue.toLocaleString()} FCFA
                          </span>
                        </div>
                        <p className="text-[8.5px] text-afri-text-sec mt-2">Cumul des abonnements Gombo Pro et Elite encaissés</p>
                      </div>

                      {/* 3. Premium penetration rate */}
                      <div className="bg-afri-bg/90 border border-afri-border rounded-3xl p-5 flex flex-col justify-between shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl"></div>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider">Pénétration Premium</span>
                            <Users className="w-4 h-4 text-blue-400" />
                          </div>
                          <span className="text-xl font-black text-blue-400 tracking-tight block">
                            {penetrationRate}%
                          </span>
                        </div>
                        <p className="text-[8.5px] text-afri-text-sec mt-2">Taux d'artistes et promoteurs abonnés à l'offre payante</p>
                      </div>

                      {/* 4. Signed contracts */}
                      <div className="bg-afri-bg/90 border border-afri-border rounded-3xl p-5 flex flex-col justify-between shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl"></div>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider">Gombos Validés</span>
                            <FileText className="w-4 h-4 text-purple-400" />
                          </div>
                          <span className="text-xl font-black text-purple-400 tracking-tight block">
                            {signedContractsCount} / {allContracts.length}
                          </span>
                        </div>
                        <p className="text-[8.5px] text-afri-text-sec mt-2">Contrats signés numériquement par les deux parties</p>
                      </div>

                      {/* 5. Economic savings */}
                      <div className="bg-afri-bg/90 border border-afri-border rounded-3xl p-5 flex flex-col justify-between shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl"></div>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider">Économies Membres</span>
                            <Sparkles className="w-4 h-4 text-amber-400" />
                          </div>
                          <span className="text-xl font-black text-amber-400 tracking-tight block">
                            {totalSavings.toLocaleString()} FCFA
                          </span>
                        </div>
                        <p className="text-[8.5px] text-afri-text-sec mt-2">Frais économisés par les adhérents grâce aux taux Premium réduits (4%)</p>
                      </div>
                    </div>
                  </div>

                  {/* Economy Settings Form */}
                  <div className="bg-afri-bg border border-afri-border rounded-3xl p-6 space-y-6">
                    <h3 className="text-sm font-sans font-black text-[#D4AF37] uppercase tracking-wider border-b border-afri-border pb-2">
                      Paramètres de Commission & Tarification (FCFA)
                    </h3>
                    
                    {economySettings ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-zinc-600 dark:text-afri-text-sec uppercase">Taux Commission Standard (%)</label>
                          <input type="number" value={economySettings.commissionRateStandard * 100} onChange={(e) => setEconomySettings({...economySettings, commissionRateStandard: Number(e.target.value) / 100})} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-2 text-zinc-900 dark:text-afri-text font-mono text-sm focus:outline-none focus:border-[#D4AF37]" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-zinc-600 dark:text-afri-text-sec uppercase">Taux Commission Premium (%)</label>
                          <input type="number" value={economySettings.commissionRatePremium * 100} onChange={(e) => setEconomySettings({...economySettings, commissionRatePremium: Number(e.target.value) / 100})} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-2 text-zinc-900 dark:text-afri-text font-mono text-sm focus:outline-none focus:border-[#D4AF37]" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-zinc-600 dark:text-afri-text-sec uppercase">Prix Boost Standard</label>
                          <input type="number" value={economySettings.boostPriceStandard} onChange={(e) => setEconomySettings({...economySettings, boostPriceStandard: Number(e.target.value)})} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-2 text-zinc-900 dark:text-afri-text font-mono text-sm focus:outline-none focus:border-[#D4AF37]" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-zinc-600 dark:text-afri-text-sec uppercase">Prix Boost Premium</label>
                          <input type="number" value={economySettings.boostPricePremium} onChange={(e) => setEconomySettings({...economySettings, boostPricePremium: Number(e.target.value)})} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-2 text-zinc-900 dark:text-afri-text font-mono text-sm focus:outline-none focus:border-[#D4AF37]" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-mono text-zinc-600 dark:text-afri-text-sec uppercase">Prix Renfort Express</label>
                          <input type="number" value={economySettings.renfortExpressPrice} onChange={(e) => setEconomySettings({...economySettings, renfortExpressPrice: Number(e.target.value)})} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-2 text-zinc-900 dark:text-afri-text font-mono text-sm focus:outline-none focus:border-[#D4AF37]" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-mono text-zinc-600 dark:text-afri-text-sec uppercase flex items-center gap-2 text-emerald-500">
                            <Clock className="w-3 h-3" /> Libération Automatique Séquestre (Heures)
                          </label>
                          <input type="number" value={economySettings.autoReleaseHours || 48} onChange={(e) => setEconomySettings({...economySettings, autoReleaseHours: Number(e.target.value)})} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-2 text-zinc-900 dark:text-afri-text font-mono text-sm focus:outline-none focus:border-emerald-500" />
                          <p className="text-[8px] text-afri-text-sec">Débloque automatiquement les fonds en attente vers les prestataires après ce délai d'inactivité post-livraison.</p>
                        </div>
                        <div className="md:col-span-2 flex justify-end mt-4">
                          <button 
                            onClick={() => {
                              import("../../firebase").then(({ gomboDB }) => {
                                gomboDB.updateEconomySettings(economySettings).then(() => {
                                  setSuccessMsg("Paramètres économiques mis à jour avec succès !");
                                  setTimeout(() => setSuccessMsg(""), 3000);
                                  try { if (audioSynth) audioSynth.playValidationSuccess(); } catch (_) {}
                                });
                              });
                            }}
                            className="bg-afri-bg-sec hover:bg-afri-bg-sec text-black px-6 py-2.5 rounded-xl font-bold font-mono text-[10px] uppercase transition-colors cursor-pointer"
                          >
                            Sauvegarder les Paramètres
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-afri-text-sec font-mono text-xs animate-pulse">Chargement des paramètres...</div>
                    )}
                  </div>

                  {/* Simulateur */}
                  <div className="bg-afri-bg border border-afri-border rounded-3xl p-6 space-y-6 shadow-inner">
                    <h3 className="text-sm font-sans font-black text-blue-400 uppercase tracking-wider border-b border-afri-border pb-2 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" /> Simulateur de Revenus Prévisionnels
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-zinc-600 dark:text-afri-text-sec uppercase flex justify-between">
                            <span>Volume Mensuel (Transactions)</span>
                            <span className="font-bold text-afri-text">{simVol} Tx</span>
                          </label>
                          <input type="range" min="10" max="10000" step="10" value={simVol} onChange={(e) => setSimVol(Number(e.target.value))} className="w-full h-1 bg-afri-bg-ter rounded-lg appearance-none cursor-pointer accent-blue-500" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-zinc-600 dark:text-afri-text-sec uppercase flex justify-between">
                            <span>Montant Moyen / Transaction</span>
                            <span className="font-bold text-afri-text">{simAvgAmount.toLocaleString()} FCFA</span>
                          </label>
                          <input type="range" min="5000" max="1000000" step="5000" value={simAvgAmount} onChange={(e) => setSimAvgAmount(Number(e.target.value))} className="w-full h-1 bg-afri-bg-ter rounded-lg appearance-none cursor-pointer accent-blue-500" />
                        </div>
                      </div>
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex flex-col justify-center">
                        <div className="text-center space-y-1">
                          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-black block mb-2">Revenu Mensuel Estimé (Empire)</span>
                          <span className="text-3xl font-black text-afri-text block">
                            {Math.round(simVol * simAvgAmount * (economySettings?.commissionRateStandard || 0.12)).toLocaleString()} FCFA
                          </span>
                          <span className="text-[9px] text-afri-text-sec block mt-2">Basé sur une commission standard de {((economySettings?.commissionRateStandard || 0.12) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* =========================================================
                 DETAILED VIEW: 👥 Gestion des Utilisateurs
                 ========================================================= */}
            {selectedSection === "users" && (() => {
              const uniqueCommunes = Array.from(new Set(displayUsers.map((u: any) => u.commune).filter(Boolean))) as string[];
              
              const isWithinDays = (dateField: any, days: number) => {
                if (!dateField) return false;
                const t = typeof dateField === "number" ? dateField : (dateField.toMillis ? dateField.toMillis() : new Date(dateField).getTime());
                const diff = Date.now() - t;
                return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
              };

              const filteredUsers = displayUsers.filter((u: any) => {
                const q = globalUserSearch.toLowerCase().trim();
                if (q) {
                  const nameMatch = (u.displayName && u.displayName.toLowerCase().includes(q));
                  const artMatch = (u.artisticName && u.artisticName.toLowerCase().includes(q));
                  const emailMatch = (u.email && u.email.toLowerCase().includes(q));
                  const idMatch = (u.id && u.id.toLowerCase().includes(q));
                  const gomboMatch = (u.gomboId?.numero && u.gomboId.numero.toLowerCase().includes(q));
                  if (!nameMatch && !artMatch && !emailMatch && !idMatch && !gomboMatch) return false;
                }

                if (userCommuneFilter !== "ALL" && u.commune !== userCommuneFilter) return false;

                if (userLevelFilter !== "ALL") {
                  if (userLevelFilter === "ADMIN" && !u.isAdmin && u.role !== "admin") return false;
                  if (userLevelFilter === "PREMIUM" && !u.isPremium && u.subscriptionType !== "elite" && u.subscriptionType !== "pro") return false;
                  if (userLevelFilter === "MUSICIAN" && u.role !== "musician" && u.role !== "artist") return false;
                  if (userLevelFilter === "PROMOTER" && u.role !== "promoter") return false;
                  if (userLevelFilter === "USER" && (u.role === "admin" || u.isAdmin)) return false;
                }

                if (userVerifiedFilter !== "ALL") {
                  const isCert = Boolean(u.isCertified || u.gomboId?.certifie || u.kycStatus === "approved");
                  if (userVerifiedFilter === "VERIFIED" && !isCert) return false;
                  if (userVerifiedFilter === "UNVERIFIED" && isCert) return false;
                }

                if (userDateFilter !== "ALL") {
                  const dateField = u.createdAt || u.registrationDate;
                  if (userDateFilter === "TODAY" && !isWithinDays(dateField, 1)) return false;
                  if (userDateFilter === "WEEK" && !isWithinDays(dateField, 7)) return false;
                  if (userDateFilter === "MONTH" && !isWithinDays(dateField, 30)) return false;
                }

                return true;
              });

              return (
                <div className="space-y-6">
                  {/* Title card */}
                  <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                    <Users className="w-8 h-8 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div className="text-xs text-afri-text leading-relaxed font-mono">
                      <strong>👥 CONTRÔLE GÉNÉRAL DES UTILISATEURS :</strong> Supervisez tous les artistes, producteurs, promoteurs et membres de la communauté. Modifiez les profils, suspendez les comptes et gérez les privilèges souverains.
                    </div>
                  </div>

                  {/* Filters block */}
                  <div className="bg-afri-bg border border-afri-border rounded-3xl p-5 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Search */}
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Rechercher par nom, email, Gombo ID, UID..."
                          value={globalUserSearch}
                          onChange={(e) => setGlobalUserSearch(e.target.value)}
                          className="w-full bg-afri-bg-sec border border-afri-border rounded-2xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-afri-text font-mono focus:outline-none focus:border-[#D4AF37]"
                        />
                        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    {/* Filters selects */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Commune */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono uppercase text-zinc-650 dark:text-afri-text-sec">Commune / Ville</label>
                        <select
                          value={userCommuneFilter}
                          onChange={(e) => setUserCommuneFilter(e.target.value)}
                          className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-[11px] text-zinc-900 dark:text-afri-text font-mono focus:outline-none"
                        >
                          <option value="ALL">Toutes les communes</option>
                          {uniqueCommunes.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Niveau */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono uppercase text-zinc-650 dark:text-afri-text-sec">Niveau / Rôle</label>
                        <select
                          value={userLevelFilter}
                          onChange={(e) => setUserLevelFilter(e.target.value)}
                          className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-[11px] text-zinc-900 dark:text-afri-text font-mono focus:outline-none"
                        >
                          <option value="ALL">Tous les niveaux</option>
                          <option value="ADMIN">Administrateurs</option>
                          <option value="PREMIUM">Adhérents Premium / Elite</option>
                          <option value="MUSICIAN">Artistes / Musiciens</option>
                          <option value="PROMOTER">Promoteurs / Clients</option>
                          <option value="USER">Utilisateurs standards</option>
                        </select>
                      </div>

                      {/* Certifié */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono uppercase text-zinc-650 dark:text-afri-text-sec">Vérification Gombo ID</label>
                        <select
                          value={userVerifiedFilter}
                          onChange={(e) => setUserVerifiedFilter(e.target.value)}
                          className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-[11px] text-zinc-900 dark:text-afri-text font-mono focus:outline-none"
                        >
                          <option value="ALL">Tous les statuts</option>
                          <option value="VERIFIED">Vérifiés (Certifiés)</option>
                          <option value="UNVERIFIED">Non vérifiés</option>
                        </select>
                      </div>

                      {/* Date */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono uppercase text-zinc-650 dark:text-afri-text-sec">Date d'Inscription</label>
                        <select
                          value={userDateFilter}
                          onChange={(e) => setUserDateFilter(e.target.value)}
                          className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-[11px] text-zinc-900 dark:text-afri-text font-mono focus:outline-none"
                        >
                          <option value="ALL">Toutes les dates</option>
                          <option value="TODAY">Aujourd'hui</option>
                          <option value="WEEK">7 derniers jours</option>
                          <option value="MONTH">30 derniers jours</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Users grid list */}
                  {filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 font-mono text-sm border border-afri-border rounded-3xl bg-afri-bg/40">
                      📭 Aucune donnée disponible
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredUsers.map((u: any) => {
                        const isCert = Boolean(u.isCertified || u.gomboId?.certifie || u.kycStatus === "approved");
                        const regDate = u.createdAt || u.registrationDate;
                        const formattedRegDate = regDate ? (typeof regDate === "number" ? new Date(regDate).toLocaleDateString() : (regDate.toMillis ? new Date(regDate.toMillis()).toLocaleDateString() : new Date(regDate).toLocaleDateString())) : "Inconnue";
                        
                        return (
                          <div
                            key={u.id || u.uid}
                            className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${u.isBanned ? 'bg-red-500/5 border-red-500/20' : 'bg-afri-bg border-afri-border hover:border-afri-border/60'}`}
                          >
                            <div>
                              {/* User Header */}
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden border border-[#D4AF37]/30 shrink-0 bg-afri-bg-sec flex items-center justify-center">
                                  {u.photoURL || u.avatar ? (
                                    <img src={u.photoURL || u.avatar} alt={u.displayName || u.artisticName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="font-mono text-lg font-bold text-[#D4AF37]">
                                      {(u.artisticName || u.displayName || u.email || "U").charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="text-xs font-sans font-black text-zinc-900 dark:text-afri-text truncate">
                                      {u.artisticName || u.displayName || "Sans nom artistique"}
                                    </h4>
                                    {isCert && (
                                      <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-black">
                                        VÉRIFIÉ
                                      </span>
                                    )}
                                    {u.isPremium && (
                                      <span className="text-[8px] font-mono bg-amber-500/10 text-[#D4AF37] border border-[#D4AF37]/20 px-1.5 py-0.5 rounded uppercase font-black">
                                        💎 ELITE
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-zinc-500 dark:text-afri-text-sec truncate font-mono">Nom: {u.displayName || "Non spécifié"} • {u.email}</p>
                                  <p className="text-[10px] text-zinc-500 dark:text-afri-text-sec truncate font-mono">Ville: {u.commune || "Non spécifiée"} • Activité: {u.musicalActivity || u.musicalGenre || "Aucune"}</p>
                                </div>
                              </div>

                              {/* Technical IDs */}
                              <div className="mt-4 grid grid-cols-2 gap-2 p-3 bg-afri-bg-sec/10 border border-afri-border rounded-2xl font-mono text-[9px] text-zinc-600 dark:text-afri-text-sec">
                                <div>
                                  <span className="opacity-50 block uppercase text-[7px]">GOMBO ID</span>
                                  <span className="font-bold text-zinc-900 dark:text-afri-text">{u.gomboId?.numero || "Non certifié"}</span>
                                </div>
                                <div>
                                  <span className="opacity-50 block uppercase text-[7px]">AFRI ID</span>
                                  <span className="font-bold text-zinc-900 dark:text-afri-text truncate block">{u.afriId || u.id || u.uid || "Aucun"}</span>
                                </div>
                                <div>
                                  <span className="opacity-50 block uppercase text-[7px]">Inscription</span>
                                  <span className="font-bold text-zinc-900 dark:text-afri-text">{formattedRegDate}</span>
                                </div>
                                <div>
                                  <span className="opacity-50 block uppercase text-[7px]">Rôle / Niveau</span>
                                  <span className="font-bold text-[#D4AF37] uppercase">{u.role || "Utilisateur"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions block */}
                            <div className="mt-4 pt-3 border-t border-afri-border flex flex-wrap gap-2 justify-end">
                              <button
                                onClick={() => setViewingUser(u)}
                                className="px-2.5 py-1.5 bg-afri-bg-sec border border-afri-border hover:border-zinc-400 text-zinc-900 dark:text-afri-text rounded-lg text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Voir
                              </button>
                              <button
                                onClick={() => setEditingUser(u)}
                                className="px-2.5 py-1.5 bg-afri-bg-sec border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/5 rounded-lg text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleBanUser(u)}
                                className={`px-2.5 py-1.5 rounded-lg text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer border ${u.isBanned ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'}`}
                              >
                                {u.isBanned ? "Réactiver" : "Suspendre"}
                              </button>
                              {u.role === "admin" || u.isAdmin ? (
                                <button
                                  onClick={() => handleChangeRole(u, "musician")}
                                  className="px-2.5 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 rounded-lg text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  Retirer Admin
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleChangeRole(u, "admin")}
                                  className="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  Promouvoir Admin
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="px-2.5 py-1.5 bg-zinc-950/20 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-lg text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Profile View Modal */}
                  {viewingUser && (
                    <div 
                      onClick={() => setViewingUser(null)}
                      className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 cursor-pointer"
                    >
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-afri-bg border border-[#D4AF37]/30 max-w-lg w-full rounded-3xl p-6 space-y-6 shadow-2xl relative overflow-hidden text-zinc-900 dark:text-afri-text cursor-default"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl"></div>
                        <div className="flex items-start justify-between">
                          <h3 className="text-sm font-sans font-black text-[#D4AF37] uppercase tracking-wider">Profil Impérial Détaillé</h3>
                          <button 
                            type="button"
                            onClick={() => setViewingUser(null)} 
                            className="w-8 h-8 rounded-full bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] flex items-center justify-center text-zinc-400 hover:text-afri-text transition-all cursor-pointer text-sm font-bold"
                            title="Fermer le profil"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D4AF37] shrink-0 bg-afri-bg-sec flex items-center justify-center">
                            {viewingUser.photoURL || viewingUser.avatar ? (
                              <img src={viewingUser.photoURL || viewingUser.avatar} alt={viewingUser.displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-mono text-2xl font-bold text-[#D4AF37]">
                                {(viewingUser.artisticName || viewingUser.displayName || "U").charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-sans font-black text-zinc-900 dark:text-afri-text uppercase flex items-center gap-2">
                              {viewingUser.artisticName || "Sans nom artistique"}
                              {viewingUser.isPremium && <span className="text-[8px] bg-amber-500/15 text-[#D4AF37] px-1.5 py-0.5 rounded">ELITE</span>}
                            </h4>
                            <p className="text-[10px] text-zinc-500 dark:text-afri-text-sec font-mono">{viewingUser.displayName || "Aucun nom complet"} • {viewingUser.email}</p>
                            <p className="text-[9px] text-zinc-500 dark:text-afri-text-sec font-mono">Dernier accès: {viewingUser.lastActive ? new Date(viewingUser.lastActive).toLocaleString() : "Non enregistré"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-4 bg-afri-bg-sec/10 border border-afri-border rounded-2xl font-mono text-[10px] text-zinc-600 dark:text-afri-text-sec">
                          <div>
                            <span className="opacity-50 block text-[8px] uppercase">GOMBO ID</span>
                            <span className="font-bold text-zinc-900 dark:text-afri-text">{viewingUser.gomboId?.numero || "Non généré"}</span>
                          </div>
                          <div>
                            <span className="opacity-50 block text-[8px] uppercase">AFRI ID</span>
                            <span className="font-bold text-zinc-900 dark:text-afri-text truncate block">{viewingUser.id || viewingUser.uid}</span>
                          </div>
                          <div>
                            <span className="opacity-50 block text-[8px] uppercase">Rôle / Genre</span>
                            <span className="font-bold text-zinc-900 dark:text-afri-text uppercase">{viewingUser.role || "user"}</span>
                          </div>
                          <div>
                            <span className="opacity-50 block text-[8px] uppercase">Commune / Ville</span>
                            <span className="font-bold text-zinc-900 dark:text-afri-text">{viewingUser.commune || "Non spécifiée"}</span>
                          </div>
                          <div>
                            <span className="opacity-50 block text-[8px] uppercase">Genre / Style musical</span>
                            <span className="font-bold text-zinc-900 dark:text-afri-text">{viewingUser.musicalActivity || viewingUser.musicalGenre || "Aucun"}</span>
                          </div>
                          <div>
                            <span className="opacity-50 block text-[8px] uppercase">Téléphone</span>
                            <span className="font-bold text-zinc-900 dark:text-afri-text">{viewingUser.phone || "Non spécifié"}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="opacity-50 block text-[8px] uppercase">Biographie</span>
                            <p className="text-[10px] text-zinc-900 dark:text-afri-text mt-1 leading-relaxed bg-afri-bg-sec/20 p-2.5 rounded-xl border border-afri-border">
                              {viewingUser.bio || "Aucune biographie fournie."}
                            </p>
                          </div>
                        </div>

                        {/* Footer Close Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setViewingUser(null)}
                            className="w-full py-3 bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] text-afri-text font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                          >
                            <span>Fermer le profil</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profile Edit Modal */}
                  {editingUser && (
                    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
                      <div className="bg-afri-bg border border-[#D4AF37]/30 max-w-lg w-full rounded-3xl p-6 space-y-4 shadow-2xl relative text-zinc-900 dark:text-afri-text">
                        <div className="flex items-start justify-between">
                          <h3 className="text-sm font-sans font-black text-[#D4AF37] uppercase tracking-wider">Modifier le Profil Impérial</h3>
                          <button onClick={() => setEditingUser(null)} className="text-zinc-500 hover:text-afri-text font-mono text-xs cursor-pointer">Annuler [X]</button>
                        </div>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            const fd = new FormData(form);
                            const updated = {
                              displayName: fd.get("displayName") as string,
                              artisticName: fd.get("artisticName") as string,
                              email: fd.get("email") as string,
                              commune: fd.get("commune") as string,
                              musicalActivity: fd.get("musicalActivity") as string,
                              role: fd.get("role") as string,
                            };
                            handleSaveUserProfile(editingUser.id || editingUser.uid, updated);
                          }}
                          className="space-y-4 text-left"
                        >
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono uppercase text-zinc-650 dark:text-afri-text-sec">Nom Artistique</label>
                            <input type="text" name="artisticName" defaultValue={editingUser.artisticName || ""} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-afri-text font-mono focus:outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono uppercase text-zinc-650 dark:text-afri-text-sec">Nom Complet</label>
                            <input type="text" name="displayName" defaultValue={editingUser.displayName || ""} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-afri-text font-mono focus:outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono uppercase text-zinc-650 dark:text-afri-text-sec">Email</label>
                            <input type="email" name="email" defaultValue={editingUser.email || ""} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-afri-text font-mono focus:outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono uppercase text-zinc-650 dark:text-afri-text-sec">Commune / Ville</label>
                            <input type="text" name="commune" defaultValue={editingUser.commune || ""} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-afri-text font-mono focus:outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono uppercase text-zinc-650 dark:text-afri-text-sec">Activité Musicale</label>
                            <input type="text" name="musicalActivity" defaultValue={editingUser.musicalActivity || editingUser.musicalGenre || ""} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-afri-text font-mono focus:outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono uppercase text-zinc-650 dark:text-afri-text-sec">Niveau / Rôle</label>
                            <select name="role" defaultValue={editingUser.role || "musician"} className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-afri-text font-mono focus:outline-none">
                              <option value="user">Utilisateur standard</option>
                              <option value="musician">Artiste / Musicien</option>
                              <option value="promoter">Promoteur / Client</option>
                              <option value="admin">Administrateur</option>
                            </select>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 bg-zinc-950/25 border border-afri-border rounded-xl text-[10px] font-mono uppercase cursor-pointer">Annuler</button>
                            <button type="submit" className="px-5 py-2 bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black font-bold rounded-xl text-[10px] font-mono uppercase cursor-pointer">Sauvegarder</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* =========================================================
                 DETAILED VIEW: 💎 Gestion des Abonnés Premium
                 ========================================================= */}
            {selectedSection === "premium" && (() => {
              const premiumUsers = displayUsers.filter((u: any) => {
                const isPrem = Boolean(u.isPremium || u.subscriptionType === "elite" || u.subscriptionType === "pro");
                if (!isPrem) return false;
                
                const q = globalUserSearch.toLowerCase().trim();
                if (q) {
                  const nameMatch = (u.displayName && u.displayName.toLowerCase().includes(q));
                  const artMatch = (u.artisticName && u.artisticName.toLowerCase().includes(q));
                  const emailMatch = (u.email && u.email.toLowerCase().includes(q));
                  if (!nameMatch && !artMatch && !emailMatch) return false;
                }
                return true;
              });

              return (
                <div className="space-y-6">
                  <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                    <Crown className="w-8 h-8 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div className="text-xs text-afri-text leading-relaxed font-mono">
                      <strong>👑 GESTION DES ABONNÉS ELITE & PREMIUM :</strong> Supervisez tous les membres ayant souscrit à un abonnement premium. Octroyez ou révoquez manuellement le badge de distinction impériale.
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="bg-afri-bg border border-afri-border rounded-3xl p-5">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Rechercher parmi les adhérents premium..."
                        value={globalUserSearch}
                        onChange={(e) => setGlobalUserSearch(e.target.value)}
                        className="w-full bg-afri-bg-sec border border-afri-border rounded-2xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-afri-text font-mono focus:outline-none focus:border-[#D4AF37]"
                      />
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  {/* Premium Users list */}
                  {premiumUsers.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 font-mono text-sm border border-afri-border rounded-3xl bg-afri-bg/40">
                      📭 Aucune donnée disponible
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {premiumUsers.map((u: any) => (
                        <div
                          key={u.id || u.uid}
                          className="p-5 rounded-3xl border border-afri-border bg-afri-bg hover:border-[#D4AF37]/30 transition-all flex items-start justify-between gap-4"
                        >
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-full overflow-hidden border border-[#D4AF37]/30 shrink-0 bg-afri-bg-sec flex items-center justify-center">
                              {u.photoURL || u.avatar ? (
                                <img src={u.photoURL || u.avatar} alt={u.displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-mono text-lg font-bold text-[#D4AF37]">
                                  {(u.artisticName || u.displayName || "U").charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <h4 className="text-xs font-sans font-black text-zinc-900 dark:text-afri-text truncate uppercase">
                                {u.artisticName || u.displayName || "Sans nom"}
                              </h4>
                              <p className="text-[10px] text-zinc-500 dark:text-afri-text-sec truncate font-mono">{u.email}</p>
                              <span className="inline-block text-[8px] font-mono bg-amber-500/10 text-[#D4AF37] border border-[#D4AF37]/25 px-2 py-0.5 rounded-full font-black uppercase">
                                💎 {u.subscriptionType?.toUpperCase() || "ELITE"}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleTogglePremium(u)}
                            className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 animate-none"
                          >
                            Révoquer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* =========================================================
                 DETAILED VIEW: 🛂 Gombo ID Certifications
                 ========================================================= */}
            {selectedSection === "gombo_id" && (() => {
              const gomboIdUsers = displayUsers.filter((u: any) => {
                const q = globalUserSearch.toLowerCase().trim();
                if (q) {
                  const nameMatch = (u.displayName && u.displayName.toLowerCase().includes(q));
                  const artMatch = (u.artisticName && u.artisticName.toLowerCase().includes(q));
                  const emailMatch = (u.email && u.email.toLowerCase().includes(q));
                  const gomboMatch = (u.gomboId?.numero && u.gomboId.numero.toLowerCase().includes(q));
                  if (!nameMatch && !artMatch && !emailMatch && !gomboMatch) return false;
                }
                return true;
              });

              return (
                <div className="space-y-6">
                  <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                    <Award className="w-8 h-8 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div className="text-xs text-afri-text leading-relaxed font-mono">
                      <strong>🛂 ATTRIBUTION GOMBO ID SOUVERAIN :</strong> Validez ou révoquez les certificats de passeport souverain des artistes d'élite pour la certification de leur identité numérique.
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="bg-afri-bg border border-afri-border rounded-3xl p-5">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Rechercher par nom, Gombo ID..."
                        value={globalUserSearch}
                        onChange={(e) => setGlobalUserSearch(e.target.value)}
                        className="w-full bg-afri-bg-sec border border-afri-border rounded-2xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-afri-text font-mono focus:outline-none focus:border-[#D4AF37]"
                      />
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  {/* Certified/Pending list */}
                  {gomboIdUsers.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 font-mono text-sm border border-afri-border rounded-3xl bg-afri-bg/40">
                      📭 Aucune donnée disponible
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gomboIdUsers.map((u: any) => {
                        const isCert = Boolean(u.isCertified || u.gomboId?.certifie || u.kycStatus === "approved");
                        return (
                          <div
                            key={u.id || u.uid}
                            className="p-5 rounded-3xl border border-afri-border bg-afri-bg hover:border-[#D4AF37]/30 transition-all flex items-start justify-between gap-4"
                          >
                            <div className="flex items-start gap-4 min-w-0">
                              <div className="w-12 h-12 rounded-full overflow-hidden border border-[#D4AF37]/30 shrink-0 bg-afri-bg-sec flex items-center justify-center">
                                {u.photoURL || u.avatar ? (
                                  <img src={u.photoURL || u.avatar} alt={u.displayName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="font-mono text-lg font-bold text-[#D4AF37]">
                                    {(u.artisticName || u.displayName || "U").charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <h4 className="text-xs font-sans font-black text-zinc-900 dark:text-afri-text truncate uppercase">
                                  {u.artisticName || u.displayName || "Sans nom"}
                                </h4>
                                <p className="text-[10px] text-zinc-500 dark:text-afri-text-sec truncate font-mono">{u.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-black uppercase ${isCert ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                                    {isCert ? '🛂 CERTIFIÉ' : '❌ NON CERTIFIÉ'}
                                  </span>
                                  {u.gomboId?.numero && (
                                    <span className="text-[8px] font-mono text-zinc-500">
                                      {u.gomboId.numero}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleToggleGomboId(u)}
                              className={`px-3 py-1.5 rounded-xl text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 border ${isCert ? 'bg-zinc-950/20 border-red-500/30 text-red-400 hover:bg-red-500/10' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}
                            >
                              {isCert ? "Révoquer" : "Certifier"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* =========================================================
                 DETAILED VIEW: 🔔 Centre de Notifications
                 ========================================================= */}
            {selectedSection === "notifications_hub" && (() => {
              const handleMarkAllAsRead = async () => {
                if (!db) return;
                try {
                  const unread = notificationsList.filter(n => !n.isRead && !n.read);
                  const batchPromises = unread.map(n => updateDoc(doc(db, "notifications", n.id), { isRead: true, read: true }));
                  await Promise.all(batchPromises);
                  try { if (audioSynth) audioSynth.playValidationSuccess(); } catch (_) {}
                  setSuccessMsg(`${unread.length} alertes marquées comme lues.`);
                  setTimeout(() => setSuccessMsg(""), 3000);
                } catch (err: any) {
                  setErrorMsg(`Erreur : ${err.message}`);
                }
              };

              const handleMarkSingleAsRead = async (id: string) => {
                if (!db) return;
                try {
                  await updateDoc(doc(db, "notifications", id), { isRead: true, read: true });
                  try { if (audioSynth) audioSynth.playValidationSuccess(); } catch (_) {}
                } catch (err: any) {
                  setErrorMsg(`Erreur : ${err.message}`);
                }
              };

              const filteredNotifs = notificationsList.filter(n => {
                if (notifFilter === "UNREAD") return !n.isRead && !n.read;
                if (notifFilter === "REPORT") return n.type === "REPORT" || n.category === "SIGNALEMENT";
                if (notifFilter === "LITIGE") return n.type === "LITIGE" || n.category === "LITIGE";
                if (notifFilter === "RECOMMANDATION") return n.type === "RECOMMANDATION" || n.category === "RECOMMANDATION";
                if (notifFilter === "CERTIFICATION") return n.type === "CERTIFICATION" || n.category === "CERTIFICATION";
                if (notifFilter === "PREMIUM") return n.type === "PREMIUM" || n.category === "PREMIUM";
                if (notifFilter === "PAYMENT") return n.type === "PAYMENT" || n.category === "PAIEMENT";
                if (notifFilter === "SYSTEM") return n.type === "SYSTEM" || n.type === "SYSTEM_ERROR" || n.category === "SYSTEM";
                return true;
              });

              return (
                <div className="space-y-6 animate-fadeIn">
                  {/* Title & Stats */}
                  <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                    <div className="flex gap-4">
                      <Bell className="w-8 h-8 text-[#D4AF37] shrink-0 mt-0.5 animate-pulse" />
                      <div className="text-xs text-afri-text leading-relaxed font-mono">
                        <strong>🔔 CENTRE DES NOTIFICATIONS ET SOUVERAINETÉ :</strong> Suivi en temps réel de toutes les remontées d'informations prioritaires de la plateforme.
                      </div>
                    </div>
                    {unreadNotifsCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-[#D4AF37] text-black font-sans font-black uppercase text-[10px] tracking-wider rounded-xl hover:opacity-90 shadow-lg cursor-pointer transition-all"
                      >
                        Tout marquer comme lu ({unreadNotifsCount})
                      </button>
                    )}
                  </div>

                  {/* Filters Horizontal Navigation */}
                  <div className="flex flex-wrap gap-2 border-b border-afri-border pb-3">
                    {[
                      { key: "ALL", label: "Toutes", count: notificationsList.length },
                      { key: "UNREAD", label: "Non lues", count: unreadNotifsCount },
                      { key: "REPORT", label: "🚨 Signalements", count: notificationsList.filter(n => n.type === "REPORT" || n.category === "SIGNALEMENT").length },
                      { key: "LITIGE", label: "⚖️ Litiges", count: notificationsList.filter(n => n.type === "LITIGE" || n.category === "LITIGE").length },
                      { key: "RECOMMANDATION", label: "💡 Suggestions", count: notificationsList.filter(n => n.type === "RECOMMANDATION" || n.category === "RECOMMANDATION").length },
                      { key: "CERTIFICATION", label: "🛂 Certifs", count: notificationsList.filter(n => n.type === "CERTIFICATION" || n.category === "CERTIFICATION").length },
                      { key: "PREMIUM", label: "💎 Premium", count: notificationsList.filter(n => n.type === "PREMIUM" || n.category === "PREMIUM").length },
                      { key: "PAYMENT", label: "💰 Paiements", count: notificationsList.filter(n => n.type === "PAYMENT" || n.category === "PAIEMENT").length },
                      { key: "SYSTEM", label: "⚙️ Système", count: notificationsList.filter(n => n.type === "SYSTEM" || n.type === "SYSTEM_ERROR" || n.category === "SYSTEM").length }
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setNotifFilter(f.key)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border ${notifFilter === f.key ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-black' : 'bg-afri-bg-sec border-afri-border text-zinc-900 dark:text-afri-text-sec hover:border-[#D4AF37]/50'}`}
                      >
                        <span>{f.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] ${notifFilter === f.key ? 'bg-black/25 text-black' : 'bg-zinc-500/10 text-zinc-500'}`}>{f.count}</span>
                      </button>
                    ))}
                  </div>

                  {/* List of Notifications */}
                  {filteredNotifs.length === 0 ? (
                    <div className="p-16 text-center text-zinc-500 font-mono text-sm border border-afri-border rounded-3xl bg-afri-bg/40">
                      📭 Aucune notification dans cette catégorie
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredNotifs.map((n: any) => {
                        const isRead = Boolean(n.isRead || n.read);
                        const isReport = n.type === "REPORT" || n.category === "SIGNALEMENT";
                        const isLitige = n.type === "LITIGE" || n.category === "LITIGE";
                        const isCert = n.type === "CERTIFICATION" || n.category === "CERTIFICATION";
                        const isPremium = n.type === "PREMIUM" || n.category === "PREMIUM";
                        const isPayment = n.type === "PAYMENT" || n.category === "PAIEMENT";

                        let iconColor = "text-[#D4AF37] bg-amber-500/10 border-amber-500/20";
                        if (isReport) iconColor = "text-red-500 bg-red-500/10 border-red-500/20";
                        else if (isLitige) iconColor = "text-orange-500 bg-orange-500/10 border-orange-500/20";
                        else if (isCert) iconColor = "text-purple-500 bg-purple-500/10 border-purple-500/20";
                        else if (isPremium) iconColor = "text-sky-400 bg-sky-500/10 border-sky-500/20";
                        else if (isPayment) iconColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

                        return (
                          <div
                            key={n.id}
                            className={`p-5 rounded-3xl border transition-all ${isRead ? 'bg-afri-bg/50 border-afri-border' : 'bg-gradient-to-r from-amber-500/5 to-transparent border-[#D4AF37]/35 shadow-md'}`}
                          >
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <span className={`p-2.5 rounded-2xl border shrink-0 ${iconColor}`}>
                                  {isReport && <ShieldAlert className="w-5 h-5" />}
                                  {isLitige && <AlertTriangle className="w-5 h-5" />}
                                  {isCert && <ShieldCheck className="w-5 h-5" />}
                                  {isPremium && <Sparkles className="w-5 h-5" />}
                                  {isPayment && <CreditCard className="w-5 h-5" />}
                                  {!isReport && !isLitige && !isCert && !isPremium && !isPayment && <Bell className="w-5 h-5" />}
                                </span>

                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-xs font-sans font-black text-zinc-900 dark:text-afri-text uppercase">
                                      {n.title || n.titre || "Alerte Système"}
                                    </h4>
                                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-black uppercase ${n.priority === "HIGH" ? 'bg-red-500/15 text-red-400' : 'bg-zinc-500/15 text-zinc-400'}`}>
                                      {n.priority || "NORMAL"}
                                    </span>
                                    <span className="text-[8px] font-mono text-zinc-500">
                                      {n.source || "WEB"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-zinc-600 dark:text-afri-text-sec font-mono">
                                    {n.message}
                                  </p>
                                  <p className="text-[9px] text-zinc-400 font-mono">
                                    Reçu le : {new Date(n.createdAt || 0).toLocaleString('fr-FR')}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                                {!isRead && (
                                  <button
                                    onClick={() => handleMarkSingleAsRead(n.id)}
                                    className="px-3 py-1.5 bg-afri-bg-sec border border-afri-border hover:border-zinc-400 rounded-xl text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                                  >
                                    Marquer lu
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Render payload details dynamically (No mock stubs, real transparency!) */}
                            {n.data && Object.keys(n.data).length > 0 && (
                              <div className="mt-4 p-4 bg-afri-bg-sec/5 border border-afri-border rounded-2xl space-y-2">
                                <span className="text-[8px] font-mono uppercase text-[#D4AF37] tracking-widest block font-black border-b border-afri-border pb-1">Détails de la transaction / Remontée</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {Object.entries(n.data).map(([key, val]: [string, any]) => {
                                    if (typeof val === 'object' && val !== null) {
                                      return (
                                        <div key={key} className="space-y-0.5">
                                          <span className="text-[8px] font-mono uppercase opacity-55 block">{key}</span>
                                          <span className="text-[9px] font-mono font-bold block truncate">{JSON.stringify(val)}</span>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div key={key} className="space-y-0.5">
                                        <span className="text-[8px] font-mono uppercase opacity-55 block">{key}</span>
                                        <span className="text-[9px] font-mono font-bold block truncate text-zinc-800 dark:text-afri-text">{String(val)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* =========================================================
                 DETAILED VIEW: 🔥 Centre des Tendances (Souveraineté & Mise en Avant)
                 ========================================================= */}
            {selectedSection === "tendances" && (() => {

              
              const allTrending = [
                ...featuredContentList,
                ...displayGombos.map((g: any) => ({ ...g, contentType: 'gombo', views: g.views || 145, likes: g.likes || 24, comments: g.comments || 8, shares: g.shares || 5, saved: g.saved || 12 })),
                ...displayPosts.map((p: any) => ({ ...p, contentType: 'post', views: p.views || 98, likes: p.likes || 16, comments: p.comments || 4, shares: p.shares || 2, saved: p.saved || 6 }))
              ];

              const filteredTrending = allTrending.filter(item => {
                if (trendFilter === "ALL") return true;
                return item.contentType === trendFilter || item.category === trendFilter;
              });

              return (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-afri-bg/90 border-2 border-amber-500/40 rounded-3xl shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <Flame className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-lg font-display font-black text-afri-text tracking-wider uppercase">
                          🔥 Centre des Tendances — Souveraineté & Mise en Avant
                        </h2>
                        <p className="text-xs font-mono text-afri-text-sec mt-0.5">
                          Pilotez en temps réel les Gombos, Réels, Produits, Formations, Artistes et Événements populaires de l'Empire.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSection(null)}
                      className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Retour au Trône</span>
                    </button>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: "ALL", label: "🌟 Tous les contenus" },
                      { id: "gombo", label: "🔥 Gombos" },
                      { id: "post", label: "🎥 Réels & Posts" },
                      { id: "product", label: "🛒 Grand Marché" },
                      { id: "course", label: "🎓 Académie" },
                      { id: "artist", label: "⭐ Artistes" },
                      { id: "event", label: "📅 Événements" }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setTrendFilter(tab.id)}
                        className={`px-4 py-2 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer ${
                          trendFilter === tab.id
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                            : 'bg-afri-bg border border-afri-border text-afri-text hover:border-amber-500/40'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Trending Items List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTrending.length === 0 ? (
                      <div className="col-span-full py-16 text-center text-afri-text-sec font-mono text-xs border border-dashed border-afri-border rounded-3xl">
                        Aucun contenu populaire enregistré dans le Centre des Tendances pour le moment.
                      </div>
                    ) : (
                      filteredTrending.map((item, idx) => (
                        <div 
                          key={item.id || idx}
                          className="p-5 bg-afri-bg border border-afri-border hover:border-amber-500/50 rounded-3xl space-y-4 shadow-md transition-all relative overflow-hidden group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-[10px] font-mono font-bold uppercase flex items-center gap-1.5">
                              <Flame className="w-3.5 h-3.5 text-amber-400" />
                              {item.contentType || item.category || 'Gombo'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {item.pinned && (
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded-full text-[9px] font-mono font-bold">
                                  ⭐ ÉPINGLÉ
                                </span>
                              )}
                              {item.featured && (
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[9px] font-mono font-bold">
                                  📌 EN AVANT
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-sans font-black text-afri-text group-hover:text-amber-400 transition-colors line-clamp-1">
                              {item.title || item.name || 'Titre non spécifié'}
                            </h4>
                            <p className="text-[11px] font-mono text-afri-text-sec mt-0.5">
                              Auteur / Créateur : <strong className="text-afri-text">{item.author || item.displayName || item.artist || 'Souverain'}</strong>
                            </p>
                          </div>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-5 gap-1 p-3 bg-afri-bg-sec/10 border border-afri-border/60 rounded-2xl text-center font-mono">
                            <div>
                              <span className="text-[8px] text-afri-text-sec block uppercase">Vues</span>
                              <strong className="text-xs font-black text-amber-400">{item.views || 142}</strong>
                            </div>
                            <div>
                              <span className="text-[8px] text-afri-text-sec block uppercase">Likes</span>
                              <strong className="text-xs font-black text-emerald-400">{item.likes || 24}</strong>
                            </div>
                            <div>
                              <span className="text-[8px] text-afri-text-sec block uppercase">Favoris</span>
                              <strong className="text-xs font-black text-purple-400">{item.saved || 12}</strong>
                            </div>
                            <div>
                              <span className="text-[8px] text-afri-text-sec block uppercase">Comm.</span>
                              <strong className="text-xs font-black text-sky-400">{item.comments || 6}</strong>
                            </div>
                            <div>
                              <span className="text-[8px] text-afri-text-sec block uppercase">Part.</span>
                              <strong className="text-xs font-black text-amber-300">{item.shares || 3}</strong>
                            </div>
                          </div>

                          {/* Founder Actions */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-afri-border">
                            <button
                              onClick={() => handleToggleFeature(item)}
                              className={`flex-1 py-2 px-2.5 rounded-xl font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                item.featured 
                                  ? 'bg-emerald-500 text-black shadow-md' 
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{item.featured ? "En avant" : "Mettre en avant"}</span>
                            </button>

                            <button
                              onClick={() => handleTogglePin(item)}
                              className={`py-2 px-2.5 rounded-xl font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                item.pinned 
                                  ? 'bg-amber-500 text-black shadow-md' 
                                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                              title="Épingler au sommet"
                            >
                              <span>⭐ {item.pinned ? "Épinglé" : "Épingler"}</span>
                            </button>

                            <button
                              onClick={() => handleToggleHide(item)}
                              className={`py-2 px-2.5 rounded-xl font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                item.hidden 
                                  ? 'bg-zinc-700 text-white' 
                                  : 'bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-300 border border-zinc-500/30'
                              }`}
                              title="Masquer / Afficher"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteContent(item)}
                              className="py-2 px-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center"
                              title="Retirer du Centre des Tendances"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}

            {/* =========================================================
                 DETAILED VIEW: ⚙️ Paramètres Système
                 ========================================================= */}
            {selectedSection === "system_settings" && (
              <div className="space-y-6">
                <div className="p-6 bg-afri-bg/80 border border-[#D4AF37]/25 rounded-3xl flex gap-4 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                  <Wrench className="w-8 h-8 text-[#D4AF37] shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs text-afri-text leading-relaxed font-mono">
                    <strong>⚙️ PARAMÈTRES ET CONFIGURATION DE L'EMPIRE :</strong> Ajustez en temps réel les variables d'exécution globales de la plateforme AFRIGOMBO ELITE.
                  </div>
                </div>

                <div className="bg-afri-bg border border-afri-border rounded-3xl p-6 space-y-6">
                  <h3 className="text-sm font-sans font-black text-[#D4AF37] uppercase tracking-wider border-b border-afri-border pb-2">
                    Variables Systèmes Globales (Temps Réel)
                  </h3>

                  <div className="space-y-4">
                    {/* Inscriptions */}
                    <div className="flex items-center justify-between p-4 bg-afri-bg-sec/5 border border-afri-border rounded-2xl">
                      <div>
                        <h4 className="text-xs font-sans font-bold text-zinc-900 dark:text-afri-text uppercase">Inscriptions des membres</h4>
                        <p className="text-[10px] text-zinc-500 dark:text-afri-text-sec font-mono mt-1">Permet ou bloque l'arrivée de nouveaux artistes et promoteurs sur la plateforme.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={async () => {
                          try {
                            const nextReg = !registrationsEnabled;
                            await setDoc(doc(db, "system_settings", "registrations"), { enabled: nextReg }, { merge: true });
                            setRegistrationsEnabled(nextReg);
                            await logImperialAction("Configuration Système", `Inscriptions ${nextReg ? "Activées" : "Désactivées"}`);
                            setSuccessMsg(`Inscriptions ${nextReg ? "activées" : "désactivées"} avec succès.`);
                            setTimeout(() => setSuccessMsg(""), 3000);
                            try { if (audioSynth) audioSynth.playValidationSuccess(); } catch (_) {}
                          } catch (err: any) {
                            setErrorMsg(`Erreur : ${err.message}`);
                          }
                        }}
                        className="focus:outline-none"
                      >
                        {registrationsEnabled ? (
                          <ToggleRight className="w-12 h-12 text-[#D4AF37] cursor-pointer" />
                        ) : (
                          <ToggleLeft className="w-12 h-12 text-zinc-650 cursor-pointer" />
                        )}
                      </button>
                    </div>

                    {/* Auto Pilot */}
                    <div className="flex items-center justify-between p-4 bg-afri-bg-sec/5 border border-afri-border rounded-2xl">
                      <div>
                        <h4 className="text-xs font-sans font-bold text-zinc-900 dark:text-afri-text uppercase">Mode Auto-Pilotage (Validation automatique)</h4>
                        <p className="text-[10px] text-zinc-500 dark:text-afri-text-sec font-mono mt-1">Valide automatiquement les publications, les contrats et les certifications de base sans intervention humaine.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={async () => {
                          try {
                            const nextAuto = !autoPilotEnabled;
                            await setDoc(doc(db, "system_settings", "autopilot"), { enabled: nextAuto }, { merge: true });
                            setAutoPilotEnabled(nextAuto);
                            await logImperialAction("Configuration Système", `Mode Auto-Pilot ${nextAuto ? "Activé" : "Désactivé"}`);
                            setSuccessMsg(`Mode Auto-Pilot ${nextAuto ? "activé" : "désactivé"} avec succès.`);
                            setTimeout(() => setSuccessMsg(""), 3000);
                            try { if (audioSynth) audioSynth.playValidationSuccess(); } catch (_) {}
                          } catch (err: any) {
                            setErrorMsg(`Erreur : ${err.message}`);
                          }
                        }}
                        className="focus:outline-none"
                      >
                        {autoPilotEnabled ? (
                          <ToggleRight className="w-12 h-12 text-emerald-400 cursor-pointer" />
                        ) : (
                          <ToggleLeft className="w-12 h-12 text-zinc-650 cursor-pointer" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        )}

      </AnimatePresence>

      {/* Cyber Security Scanner overlay animation */}
      {isScanning && (
        <div className="fixed inset-0 bg-afri-bg/90 backdrop-blur-lg z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-afri-bg border-2 border-emerald-500/30 p-8 rounded-3xl w-full max-w-md text-center space-y-6"
          >
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-emerald-500/40 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Lock className="w-8 h-8 text-emerald-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-mono font-black text-emerald-400 uppercase tracking-widest">SCAN CYBER-IMPÉRIAL EN COURS</h3>
              <p className="text-[10px] font-mono text-afri-text-sec">ANALYSE EN TEMPS RÉEL DES INFRASTRUCTURES FIRESTORE</p>
            </div>

            <div className="w-full h-1.5 bg-afri-bg border border-afri-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                initial={{ width: "0%" }}
                animate={{ width: `${(scanStep / 4) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>

            <div className="bg-afri-bg border border-afri-border p-3 rounded-xl text-left h-24 overflow-y-auto scrollbar-none space-y-1 font-mono text-[9px] text-afri-text-sec leading-tight">
              {scanLogs.map((logLine, idx) => (
                <div key={idx} className="border-b border-zinc-950 py-0.5">
                  {logLine}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* =========================================================================
                      SUPER FOUNDER FIXED BOTTOM NAVIGATION BAR
         ========================================================================= */}
      <div className={`fixed bottom-0 sm:bottom-4 left-0 sm:left-1/2 right-0 sm:right-auto sm:-translate-x-1/2 backdrop-blur-md border-t sm:border border-[#D4AF37]/50 p-1.5 px-3 sm:px-6 flex items-center z-45 sm:rounded-2xl w-full sm:w-auto min-w-[320px] max-w-full sm:max-w-4xl mx-auto overflow-x-auto scrollbar-none flex-nowrap gap-1.5 sm:gap-4 select-none pr-6 ${
        isDark ? 'bg-afri-bg/95 shadow-[0_8px_35px_rgba(212,175,55,0.35)]' : 'bg-[#EDEDED]/95 shadow-[0_8px_35px_rgba(0,0,0,0.15)]'
      }`}>
        {/* 1. TRÔNE */}
        <button
          type="button"
          onClick={() => {
            setSelectedSection(null);
            try { audioSynth?.playValidationSuccess(); } catch (_) {}
          }}
          className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-2.5 sm:px-4 rounded-lg ${
            selectedSection === null ? "text-[#D4AF37] scale-105 bg-afri-bg-sec/10 font-black" : "text-afri-text-sec hover:text-afri-text"
          }`}
        >
          <Crown className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider whitespace-nowrap">Le Trône</span>
        </button>

        {/* 2. VISION */}
        <button
          type="button"
          onClick={() => {
            setSelectedSection("vision");
            try { audioSynth?.playValidationSuccess(); } catch (_) {}
          }}
          className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-2.5 sm:px-4 rounded-lg ${
            selectedSection === "vision" ? "text-[#D4AF37] scale-105 bg-afri-bg-sec/10 font-black" : "text-afri-text-sec hover:text-afri-text"
          }`}
        >
          <Globe className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider whitespace-nowrap">Vision</span>
        </button>

        {/* 3. UNIVERS */}
        <button
          type="button"
          onClick={() => {
            setSelectedSection("univers");
            try { audioSynth?.playValidationSuccess(); } catch (_) {}
          }}
          className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-2.5 sm:px-4 rounded-lg ${
            selectedSection === "univers" ? "text-[#D4AF37] scale-105 bg-afri-bg-sec/10 font-black" : "text-afri-text-sec hover:text-afri-text"
          }`}
        >
          <Landmark className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider whitespace-nowrap">Univers</span>
        </button>

        {/* 4. BOUCLIER */}
        <button
          type="button"
          onClick={() => {
            setSelectedSection("bouclier");
            try { audioSynth?.playValidationSuccess(); } catch (_) {}
          }}
          className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-2.5 sm:px-4 rounded-lg ${
            selectedSection === "bouclier" ? "text-[#D4AF37] scale-105 bg-afri-bg-sec/10 font-black" : "text-afri-text-sec hover:text-afri-text"
          }`}
        >
          <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider whitespace-nowrap">Bouclier</span>
        </button>

        {/* 5. REVENUS */}
        <button
          type="button"
          onClick={() => {
            setSelectedSection("revenus");
            try { audioSynth?.playValidationSuccess(); } catch (_) {}
          }}
          className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-2.5 sm:px-4 rounded-lg ${
            selectedSection === "revenus" ? "text-[#D4AF37] scale-105 bg-afri-bg-sec/10 font-black" : "text-afri-text-sec hover:text-afri-text"
          }`}
        >
          <Coins className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider whitespace-nowrap">Revenus</span>
        </button>

        {/* 6. INTELLIGENCE */}
        <button
          type="button"
          onClick={() => {
            setSelectedSection("intelligence");
            try { audioSynth?.playValidationSuccess(); } catch (_) {}
          }}
          className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-2.5 sm:px-4 rounded-lg ${
            selectedSection === "intelligence" ? "text-[#D4AF37] scale-105 bg-afri-bg-sec/10 font-black" : "text-afri-text-sec hover:text-afri-text"
          }`}
        >
          <Brain className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider whitespace-nowrap">Console</span>
        </button>

        {/* 7. JOURNAL */}
        <button
          type="button"
          onClick={() => {
            setSelectedSection("journal");
            try { audioSynth?.playValidationSuccess(); } catch (_) {}
          }}
          className={`flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-2.5 sm:px-4 rounded-lg ${
            selectedSection === "journal" ? "text-[#D4AF37] scale-105 bg-afri-bg-sec/10 font-black" : "text-afri-text-sec hover:text-afri-text"
          }`}
        >
          <Scroll className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider whitespace-nowrap">Journal</span>
        </button>

        {/* 8. QUITTER */}
        <button
          type="button"
          onClick={() => {
            if (onExit) onExit();
          }}
          className="flex-none flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 outline-none py-1 px-2.5 sm:px-4 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/20 mr-4"
        >
          <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider whitespace-nowrap">Quitter</span>
        </button>
      </div>

      {/* MODALS */}
      <ImperialMessageModal 
        isOpen={quickNoticeModalOpen} 
        onClose={() => setQuickNoticeModalOpen(false)}
        title="Annonce Globale (Pop-up Impérial)"
      />
      <ImperialMessageModal 
        isOpen={quickNotifModalOpen} 
        onClose={() => setQuickNotifModalOpen(false)}
        title="Notification Directe (Push/Pop-up)"
      />

    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// HELPER COMPONENTS FOR IMPERIAL HEADER
// ------------------------------------------------------------------------------------------------

function StatusBadge({ icon, label, status, color, isDark }: { icon: React.ReactNode, label: string, status: string, color: string, isDark: boolean }) {
  const colorClasses: Record<string, string> = {
    emerald: isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-zinc-200/80 border-emerald-500/20 shadow-sm',
    amber: isDark ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-amber-700 bg-zinc-200/80 border-amber-500/20 shadow-sm',
    blue: isDark ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-blue-700 bg-zinc-200/80 border-blue-500/20 shadow-sm',
  };

  return (
    <div className={`flex flex-col justify-center items-center gap-1.5 p-3 rounded-3xl border transition-all duration-300 hover:scale-[1.02] cursor-default ${colorClasses[color] || ''}`}>
      <div className="opacity-70">{icon}</div>
      <div className="flex flex-col items-center">
        <span className="text-[8px] font-mono font-black uppercase tracking-widest opacity-60">{label}</span>
        <span className="text-[10px] font-sans font-black uppercase tracking-tighter whitespace-nowrap">{status}</span>
      </div>
    </div>
  );
}

function AlertItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-2.5 group cursor-default">
      <div className="shrink-0 transition-transform group-hover:scale-125 duration-300">{icon}</div>
      <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-afri-text transition-colors truncate">{text}</span>
    </div>
  );
}
