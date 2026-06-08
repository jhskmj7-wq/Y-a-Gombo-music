import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, Users, Film, Radio, Layers, DollarSign, ListFilter, 
  Trash2, ShieldCheck, Ban, Sparkles, BookOpen, AlertOctagon, CheckCircle, 
  X, Search, Award, Grid, RefreshCw, BarChart2, Eye, EyeOff, 
  Activity, Send, AlertTriangle, Cpu, TrendingUp, Landmark, Flame, Bell, Check, Edit, ChevronRight, LogOut, User
} from "lucide-react";
import { gomboDB, isFirebaseMock } from "../firebase";
import { UserProfile, SocialPost, AdminLog, Gombo } from "../types";
import { useAuth } from "../AuthContext";

interface AdminCentreProps {
  adminEmail: string;
  adminProfile: UserProfile | null;
  onExitAdminMode: () => void;
}

const MOCK_TELEMETRY_LOGS = [
  "⚡ [API Gateway] Route /api/gombos optimisée en 4ms",
  "🔑 [Google Auth] Session rafraîchie sous token JWT conforme",
  "💰 [Finance] Succès du prélèvement de commission - Réf Gombo-Pay",
  "🛡️ [Juge Gombo] Scanner de contenu automatisé exempt de mots bannis",
  "📋 [Validation] Candidature de l'artiste Yorobo Sangaré reçue",
  "🔔 [Push service] Notification priority Cocody expédiée à 12 membres",
  "🔋 [Engine] Threads Node.js alloués: 96, CPU: 4.5%",
  "📁 [DB Core] Sauvegarde de l'index 'temp_auth_transfers' validée"
];

export default function AdminCentre({ adminEmail, adminProfile, onExitAdminMode }: AdminCentreProps) {
  const { logout } = useAuth();
  
  // Navigation tabs matching lower tab-bar
  // cockpit=Tableau, users=Utilisateurs, posts=Publications, reports=Signalements, plus=Plus Configs
  const [activeTab, setActiveTab] = useState<"cockpit" | "users" | "posts" | "reports" | "plus">("cockpit");
  
  // For the "plus" tab sub-sections
  const [plusSubTab, setPlusSubTab] = useState<"finances" | "groups" | "config" | "about">("finances");

  // Base Data States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [gombos, setGombos] = useState<Gombo[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [renforts, setRenforts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom interactive admin additions (persistent via localStorage)
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>(() => {
    const saved = localStorage.getItem("gombo_withdraw_requests");
    if (saved) return JSON.parse(saved);
    return [
      { id: "wd-001", userEmail: "artiste.momo@gmail.com", userUid: "momo_uid", amount: 15000, provider: "Orange Money", phone: "+225 07 48 99 12 30", status: "pending", date: new Date(Date.now() - 3600000).toISOString() },
      { id: "wd-002", userEmail: "guitariste.solo@gombo.ci", userUid: "solo_uid", amount: 35000, provider: "Wave", phone: "+225 05 99 88 12 11", status: "pending", date: new Date(Date.now() - 7200000).toISOString() },
      { id: "wd-003", userEmail: "yoro@gombo.ci", userUid: "mus1", amount: 25000, provider: "MTN Momo", phone: "+225 07 45 89 12 00", status: "approved", date: new Date(Date.now() - 17200000).toISOString() }
    ];
  });

  const [systemAlert, setSystemAlert] = useState(() => {
    return localStorage.getItem("gombo_system_alert") || "👑 [ADMIN] Bienvenue sur AFRIGOMBO version Pro. Les cachets numériques du Showbiz Ivoirien sont 100% assurés.";
  });
  
  const [commissionRate, setCommissionRate] = useState(() => {
    return localStorage.getItem("gombo_commission_rate") || "10";
  });

  // Ticker activity feed states
  const [terminalFeed, setTerminalFeed] = useState<string[]>(["📡 Initialisation du tableau de bord de commande..."]);
  
  // Notifications states
  const [showNotifications, setShowNotifications] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([
    { id: 1, text: "Demande de retrait Wave de 35 000 FCFA reçue", read: false, time: "Il y a 5 min" },
    { id: 2, text: "Nouveau signalement déposé concernant un concert", read: false, time: "Il y a 25 min" },
    { id: 3, text: "Compte de Serge Kassi certifié VIP avec succès", read: true, time: "Il y a 2h" }
  ]);

  // Internal search filters & sub-tabs filters
  const [searchTerm, setSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [reportFilter, setReportFilter] = useState<string>("all");
  const [gomboOrPostFilter, setGomboOrPostFilter] = useState<"gombos" | "posts">("gombos");
  const [gomboFilter, setGomboFilter] = useState<string>("all");

  const unreadNotifsCount = adminNotifications.filter(n => !n.read).length;

  // System statistics telemetry
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsers: 0,
    artistes: 0,
    producteurs: 0,
    instrumentistes: 0,
    managers: 0,
    groupes: 0,
    publications: 0,
    renfortExpress: 0,
    revenusPremium: 0,
    totalSecuredCachet: 0,
    paymentsSuccess: 0,
    cpuUsage: 11,
    latencyMs: 14
  });

  // Telemetry loop for simulating server health
  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        cpuUsage: Math.floor(Math.random() * 8) + 4, // 4% to 12% CPU
        latencyMs: Math.floor(Math.random() * 12) + 6 // 6ms to 18ms latency
      }));

      if (Math.random() > 0.65) {
        const randomMsg = MOCK_TELEMETRY_LOGS[Math.floor(Math.random() * MOCK_TELEMETRY_LOGS.length)];
        const timestamp = new Date().toLocaleTimeString();
        setTerminalFeed(prev => [`[${timestamp}] ${randomMsg}`, ...prev.slice(0, 15)]);
      }
    }, 5000);

    return () => clearInterval(telemetryInterval);
  }, []);

  // Persistent Withdraw requests sync
  useEffect(() => {
    localStorage.setItem("gombo_withdraw_requests", JSON.stringify(withdrawRequests));
  }, [withdrawRequests]);

  // Load backend statistics
  const loadData = async () => {
    try {
      setLoading(true);
      const [allUsers, allPosts, allReports, allLogs, allGombos, allGroups, allRenforts] = await Promise.all([
        gomboDB.getUsersAdmin(),
        gomboDB.getPostsAdmin(),
        gomboDB.getReportsAdmin(),
        gomboDB.getAdminLogs(),
        gomboDB.getAllGombos(),
        gomboDB.getGroupsAdmin(),
        gomboDB.getRenfortsAdmin()
      ]);

      const usersList = allUsers || [];
      const postsList = allPosts || [];
      const reportsList = allReports || [];
      const logsList = allLogs || [];
      const gombosList = allGombos || [];
      const groupsList = allGroups || [];
      const renfortsList = allRenforts || [];

      setUsers(usersList);
      setPosts(postsList);
      setReports(reportsList);
      setLogs(logsList);
      setGombos(gombosList);
      setGroups(groupsList);
      setRenforts(renfortsList);

      const musicianCount = usersList.filter(u => u.role === "musicien").length;
      const clientCount = usersList.filter(u => u.role === "client" || u.role === "organisateur").length;
      const managerCount = usersList.filter(u => u.role === "manager").length;
      
      const instrumentisteCount = usersList.filter(u => {
        const spec = (u.specialty || u.speciality || "").toLowerCase();
        return spec && !spec.includes("chant") && !spec.includes("vocal");
      }).length;

      const newUsersCount = usersList.filter(u => {
        if (!u.updatedAt) return true;
        try {
          return new Date(u.updatedAt).getTime() > Date.now() - (7 * 24 * 3600 * 1000);
        } catch {
          return true;
        }
      }).length || Math.min(usersList.length, 4);

      const securedBudgetsSum = gombosList.reduce((acc, g) => acc + (g.budget || 0), 0);
      const dynamicPremiumRevenue = Math.round(securedBudgetsSum * (parseFloat(commissionRate) / 100 || 0.1));

      setStats(prev => ({
        ...prev,
        totalUsers: usersList.length,
        newUsers: newUsersCount,
        artistes: musicianCount,
        producteurs: clientCount,
        instrumentistes: instrumentisteCount,
        managers: managerCount,
        groupes: groupsList.length,
        publications: postsList.length,
        renfortExpress: renfortsList.length,
        revenusPremium: dynamicPremiumRevenue,
        totalSecuredCachet: securedBudgetsSum
      }));
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques d'administration :", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, plusSubTab]);

  const handleToggleSuspension = async (uid: string, currentSuspension: boolean) => {
    if (confirm(`Voulez-vous ${currentSuspension ? "RÉACTIVER" : "SUSPENDRE DIRECTEMENT"} cet utilisateur ?`)) {
      await gomboDB.toggleUserSuspension(uid, !currentSuspension, adminEmail);
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 🚧 Statut suspension mis à jour pour l'UID: ${uid}`, ...prev]);
      loadData();
    }
  };

  const handleToggleCertification = async (uid: string, currentCertified: boolean) => {
    if (confirm(`Voulez-vous ${currentCertified ? "DÉCERTIFIER" : "CERTIFIER COMME TALENT ⭐ PRINCIPAL"} cet utilisateur ?`)) {
      await gomboDB.toggleUserCertified(uid, !currentCertified, adminEmail);
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] ⭐ Certification modifiée pour l'UID: ${uid}`, ...prev]);
      loadData();
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm("Voulez-vous bannir et supprimer définitivement cette publication ?")) {
      await gomboDB.deletePostAdmin(postId, adminEmail);
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 🗑️ Publication supprimée : ${postId}`, ...prev]);
      loadData();
    }
  };

  const handleTogglePostVisibility = async (postId: string, currentHidden: boolean) => {
    await gomboDB.togglePostVisibility(postId, !currentHidden, adminEmail);
    setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 👁️ Visibilité basculée pour la publication: ${postId}`, ...prev]);
    loadData();
  };

  const handleAuditReport = async (reportId: string, action: "ignore" | "delete" | "suspend" | "ban", contentId?: string, authorId?: string) => {
    if (confirm(`Confirmez-vous l'action : ${action.toUpperCase()} ?`)) {
      await gomboDB.auditReportAction(reportId, action, adminEmail, contentId, authorId);
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 🛡️ Arbitrage de signalement complété : ${reportId}`, ...prev]);
      loadData();
    }
  };

  const handleDeleteGroup = async (groupId: string, name: string) => {
    if (confirm(`Voulez-vous supprimer définitivement l'orchestre "${name}" ?`)) {
      try {
        await gomboDB.deleteMusicGroup(groupId);
        await gomboDB.addAdminLog(adminEmail, "DELETE_MUSIC_GROUP", groupId);
        setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 🗑️ Orchestre supprimé : "${name}"`, ...prev]);
        loadData();
      } catch (err) {
        console.error("Error deleting group:", err);
      }
    }
  };

  const handleToggleSuspendGroup = async (groupId: string, name: string, isCurrentlySuspended: boolean) => {
    const actionWord = isCurrentlySuspended ? "RÉACTIVER" : "SUSPENDRE DIRECTEMENT";
    if (confirm(`Voulez-vous ${actionWord} l'orchestre "${name}" ?`)) {
      try {
        await gomboDB.updateMusicGroup(groupId, { isSuspended: !isCurrentlySuspended });
        await gomboDB.addAdminLog(adminEmail, isCurrentlySuspended ? "REACTIVATE_MUSIC_GROUP" : "SUSPEND_MUSIC_GROUP", groupId);
        setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 🚧 Statut orchestre mis à jour : "${name}"`, ...prev]);
        loadData();
      } catch (err) {
        console.error("Error updating group status:", err);
      }
    }
  };

  const handleApproveWithdraw = (id: string, requesterUid: string, amount: number) => {
    if (confirm(`Confirmez-vous le versement de ${amount.toLocaleString()} FCFA pour ce transfert ?`)) {
      setWithdrawRequests(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
      
      if (requesterUid) {
        gomboDB.getUserProfile(requesterUid).then(async (prof) => {
          if (prof) {
            const currentBal = prof.balance || 0;
            const currentWithd = prof.totalWithdrawals || 0;
            const updated: any = {
              balance: Math.max(0, currentBal - amount),
              totalWithdrawals: currentWithd + amount
            };
            await gomboDB.updateUserProfile(requesterUid, updated);
          }
        });
      }
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 💰 Commission & Versement d'Abidjan approuvé pour l'ID ${id}.`, ...prev]);
    }
  };

  const handleRejectWithdraw = (id: string) => {
    if (confirm("Voulez-vous rejeter ce retrait ? Les fonds seront retournés.")) {
      setWithdrawRequests(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] ❌ Transfert rejeté pour l'ID ${id}.`, ...prev]);
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem("gombo_system_alert", systemAlert);
    localStorage.setItem("gombo_commission_rate", commissionRate);
    alert("Configuration globale d'AFRIGOMBO sauvegardée avec succès !");
    setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] ⚙️ Commission de placement réajustée à : ${commissionRate}%`, ...prev]);
  };

  // Filters logic
  const filteredUsers = users.filter(u => {
    const name = `${u.firstName || ""} ${u.lastName || ""} ${u.artistName || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const phone = (u.phone || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch = name.includes(term) || email.includes(term) || phone.includes(term);

    if (userRoleFilter === "all") return matchesSearch;
    if (userRoleFilter === "certified") return matchesSearch && (u.isCertified || u.verificationStatus === "certifie");
    if (userRoleFilter === "suspended") return matchesSearch && u.isSuspended;
    return matchesSearch && u.role === userRoleFilter;
  });

  const filteredGombos = gombos.filter(g => {
    const title = (g.title || "").toLowerCase();
    const location = (g.location || "").toLowerCase();
    const commune = (g.commune || "").toLowerCase();
    const client = (g.clientName || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch = title.includes(term) || location.includes(term) || commune.includes(term) || client.includes(term);

    if (gomboFilter === "all") return matchesSearch;
    if (gomboFilter === "urgent") return matchesSearch && g.urgent;
    if (gomboFilter === "booked") return matchesSearch && g.status === "reserve";
    return matchesSearch;
  });

  const filteredPosts = posts.filter(p => {
    const text = `${p.title || ""} ${p.caption || ""} ${p.userName || ""}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  const filteredReports = reports.filter(r => {
    if (reportFilter === "all") return true;
    return r.status === reportFilter;
  });

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F8F8F8] font-sans antialiased selection:bg-[#D4AF37] selection:text-black pb-28" id="afrigombo-admin-overhauled">
      
      {/* 👑 PREMIUM FIXED TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#121212] border-b border-[#2B2B2B] px-4 py-4 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/40 flex items-center justify-center shadow">
              <Shield className="text-[#D4AF37] w-4.5 h-4.5 stroke-[2px]" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-[#D4AF37] uppercase">
                Centre de Commande AFRIGOMBO
              </h1>
              <p className="text-[10px] text-gray-400 font-mono tracking-tight">
                Le Temple du Gombo Musical
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-[#0B0B0B] hover:bg-[#2B2B2B] border border-[#2B2B2B] rounded-lg transition-colors cursor-pointer relative"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-[#D4AF37]" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-[#121212]" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2.5 w-64 bg-[#121212] border border-[#2B2B2B] rounded-xl shadow-2xl p-3 z-50 overflow-hidden"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-[#2B2B2B] mb-2">
                      <span className="text-[10px] font-black uppercase text-[#D4AF37] tracking-wider">Alertes Actives</span>
                      <button 
                        onClick={() => {
                          setAdminNotifications(prev => prev.map(n => ({...n, read: true})));
                        }}
                        className="text-[9px] text-gray-400 hover:text-[#D4AF37] uppercase font-bold"
                      >
                        Marquer lu
                      </button>
                    </div>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {adminNotifications.map(n => (
                        <div key={n.id} className={`p-2 rounded-lg text-[11.5px] border ${n.read ? "bg-[#0B0B0B]/40 border-transparent text-gray-400" : "bg-[#2B2B2B]/30 border-[#D4AF37]/10 text-[#F8F8F8]"}`}>
                          <p className="line-clamp-2 leading-tight font-medium">{n.text}</p>
                          <span className="text-[9px] text-gray-500 font-mono block mt-1">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Logout trigger directly from view */}
            <button
              onClick={async () => {
                if (confirm("Êtes-vous sûr de vouloir vous déconnecter de votre session Admin d'Abidjan ?")) {
                  try {
                    await logout();
                  } catch (e) {
                    console.error("Logout failed:", e);
                  }
                }
              }}
              className="p-2 bg-[#0B0B0B] hover:bg-red-950/20 hover:border-red-500/30 border border-[#2B2B2B] text-gray-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
              title="Déconnexion sécurisée"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ⚡ GENERAL BROADCAST NOTIFICATION BAR */}
      <div className="bg-[#121212] border-b border-[#2B2B2B] py-2 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="truncate text-[11px] font-medium text-gray-400">Canal Sysadmin : <strong className="text-[#D4AF37]">{adminEmail}</strong></span>
          </div>
          <div className="flex gap-4 shrink-0 text-[10px] font-mono text-gray-400">
            <span>CPU: {stats.cpuUsage}%</span>
            <span>PING: {stats.latencyMs}ms</span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          
          {/* loading animation */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3" key="loader">
              <RefreshCw className="w-7 h-7 text-[#D4AF37] animate-spin" />
              <p className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase">VÉRIFICATION D'ACCÈS SYSTÈME...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
              key={activeTab}
            >
              
              {/* ======================================================== */}
              {/* TAB 1: COCKPIT TABLEAU PRINCIPAL */}
              {/* ======================================================== */}
              {activeTab === "cockpit" && (
                <div className="space-y-6" id="dashboard-tab">
                  
                  {/* message d'accueil */}
                  <div className="bg-[#121212] border border-[#2B2B2B] rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                      <div className="flex items-center gap-1.5 text-[#D4AF37]">
                        <span className="text-xl">👑</span>
                        <h2 className="text-base font-black uppercase tracking-wider">Bienvenue Fondateur.</h2>
                      </div>
                      <p className="text-sm font-bold text-white tracking-wide">
                        Vous pilotez AFRIGOMBO.
                      </p>
                      
                      <div className="h-[1px] bg-[#2B2B2B] my-2" />
                      
                      <ul className="space-y-1.5 text-xs text-gray-300 font-sans">
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#D4AF37]" /> Constructeurs d'opportunités.
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#D4AF37]" /> Protégez la communauté.
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#D4AF37]" /> Faites grandir le Temple du Gombo Musical.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* 📊 CARTES STATISTIQUES PREMIUM (GRILLE MOBILE IMPÉRATIVE DEUX COLONNES) */}
                  <div className="space-y-2.5">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-[#D4AF37] pl-1 select-none">
                      CONTRÔLES & TENDANCES EN ABUDJAN
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3.5">
                      
                      {/* STAT 1: Users */}
                      <button 
                        onClick={() => setActiveTab("users")}
                        className="bg-[#121212] hover:bg-[#121212]/80 border border-[#2B2B2B] rounded-2xl p-4 flex flex-col justify-between text-left h-28 cursor-pointer group transition-all"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider font-mono">Utilisateurs</span>
                          <Users className="w-4.5 h-4.5 text-[#D4AF37]" />
                        </div>
                        <div className="mt-2.5">
                          <p className="text-2xl font-black text-[#F8F8F8] tracking-tight">{stats.totalUsers}</p>
                          <p className="text-[9px] text-[#D4AF37]/80 mt-0.5">+{stats.newUsers} ce mois-ci</p>
                        </div>
                      </button>

                      {/* STAT 2: Publications */}
                      <button 
                        onClick={() => { setActiveTab("posts"); setGomboOrPostFilter("posts"); }}
                        className="bg-[#121212] hover:bg-[#121212]/80 border border-[#2B2B2B] rounded-2xl p-4 flex flex-col justify-between text-left h-28 cursor-pointer group transition-all"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider font-mono">Publications</span>
                          <Film className="w-4.5 h-4.5 text-[#D4AF37]" />
                        </div>
                        <div className="mt-2.5">
                          <p className="text-2xl font-black text-[#F8F8F8] tracking-tight">{stats.publications}</p>
                          <p className="text-[9px] text-gray-500 mt-0.5">Démos artistiques</p>
                        </div>
                      </button>

                      {/* STAT 3: Groupes */}
                      <button 
                        onClick={() => { setActiveTab("plus"); setPlusSubTab("groups"); }}
                        className="bg-[#121212] hover:bg-[#121212]/80 border border-[#2B2B2B] rounded-2xl p-4 flex flex-col justify-between text-left h-28 cursor-pointer group transition-all"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider font-mono">Orchestres VIP</span>
                          <Radio className="w-4.5 h-4.5 text-[#D4AF37]" />
                        </div>
                        <div className="mt-2.5">
                          <p className="text-2xl font-black text-[#F8F8F8] tracking-tight">{stats.groupes}</p>
                          <p className="text-[9px] text-gray-500 mt-0.5">Formations enregistrées</p>
                        </div>
                      </button>

                      {/* STAT 4: Renfort Express */}
                      <div className="bg-[#121212] border border-[#2B2B2B] rounded-2xl p-4 flex flex-col justify-between text-left h-28">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider font-mono">Renfort Express</span>
                          <Flame className="w-4.5 h-4.5 text-[#D4AF37]" />
                        </div>
                        <div className="mt-2.5">
                          <p className="text-2xl font-black text-[#F8F8F8] tracking-tight">{stats.renfortExpress}</p>
                          <p className="text-[9px] text-[#D4AF37] mt-0.5">Missions urgentes</p>
                        </div>
                      </div>

                      {/* STAT 5: Signalements */}
                      <button 
                        onClick={() => setActiveTab("reports")}
                        className="bg-[#121212] hover:bg-[#121212]/80 border border-[#2B2B2B] rounded-2xl p-4 flex flex-col justify-between text-left h-28 cursor-pointer group transition-all"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider font-mono">Signalements</span>
                          <AlertOctagon className="w-4.5 h-4.5 text-[#D4AF37]" />
                        </div>
                        <div className="mt-2.5">
                          <p className="text-2xl font-black text-[#F8F8F8] tracking-tight">{reports.length}</p>
                          <p className="text-[9px] text-red-400 mt-0.5">{reports.filter(r=>r.status==="pending").length} en attente</p>
                        </div>
                      </button>

                      {/* STAT 6: Premium */}
                      <button 
                        onClick={() => { setActiveTab("plus"); setPlusSubTab("finances"); }}
                        className="bg-[#121212] hover:bg-[#121212]/80 border border-[#D4AF37]/30 rounded-2xl p-4 flex flex-col justify-between text-left h-28 cursor-pointer transition-all border-l-4"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-wider font-mono">Abonnements Premium</span>
                          <DollarSign className="w-4.5 h-4.5 text-[#D4AF37]" />
                        </div>
                        <div className="mt-2.5">
                          <p className="text-lg font-black text-[#D4AF37] font-mono truncate">{stats.revenusPremium.toLocaleString()} F</p>
                          <p className="text-[9px] text-gray-500 mt-1">Revenus sécurisés</p>
                        </div>
                      </button>

                    </div>
                  </div>

                  {/* 👑 SECTIONS ADMIN (VERTICALES SUR TÉLÉPHONE) */}
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-[#D4AF37] pl-1">
                      CARTES DE DIRECTIVES COMPLÈTES
                    </h3>

                    <div className="space-y-3">
                      
                      {/* SECTION 1: Gestion Utilisateurs */}
                      <div 
                        onClick={() => setActiveTab("users")}
                        className="bg-[#121212] hover:bg-[#121212]/85 border border-[#2B2B2B] hover:border-[#D4AF37]/45 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-[#0B0B0B] border border-[#2B2B2B] flex items-center justify-center text-[#D4AF37]">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase text-[#F8F8F8]">Gestion Intel Utilisateurs</h4>
                            <p className="text-[11px] text-gray-400">Suspendre, certifier VIP oú modérer les comédiens et musiciens.</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#D4AF37] group-hover:translate-x-1 transition-transform shrink-0" />
                      </div>

                      {/* SECTION 2: Gestion Publications */}
                      <div 
                        onClick={() => { setActiveTab("posts"); setGomboOrPostFilter("posts"); }}
                        className="bg-[#121212] hover:bg-[#121212]/85 border border-[#2B2B2B] hover:border-[#D4AF37]/45 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-[#0B0B0B] border border-[#2B2B2B] flex items-center justify-center text-[#D4AF37]">
                            <Film className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase text-[#F8F8F8]">Gestion Médias & Publications</h4>
                            <p className="text-[11px] text-gray-400">Vérifier l'authenticité et supprimer les démos non autorisées.</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#D4AF37] group-hover:translate-x-1 transition-transform shrink-0" />
                      </div>

                      {/* SECTION 3: Gestion Groupes */}
                      <div 
                        onClick={() => { setActiveTab("plus"); setPlusSubTab("groups"); }}
                        className="bg-[#121212] hover:bg-[#121212]/85 border border-[#2B2B2B] hover:border-[#D4AF37]/45 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-[#0B0B0B] border border-[#2B2B2B] flex items-center justify-center text-[#D4AF37]">
                            <Radio className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase text-[#F8F8F8]">Gestion des Orchestres VIP</h4>
                            <p className="text-[11px] text-gray-400">Superviser l'annuaire des groupes de musique en Côte d'Ivoire.</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#D4AF37] group-hover:translate-x-1 transition-transform shrink-0" />
                      </div>

                      {/* SECTION 4: Signalements */}
                      <div 
                        onClick={() => { setActiveTab("reports"); }}
                        className="bg-[#121212] hover:bg-[#121212]/85 border border-[#2B2B2B] hover:border-[#D4AF37]/45 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-[#0B0B0B] border border-[#2B2B2B] flex items-center justify-center text-[#D4AF37]">
                            <AlertOctagon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase text-[#F8F8F8]">Rapports de Signalements</h4>
                            <p className="text-[11px] text-gray-400">Gérer les abus et plaintes de l'arène artistique.</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#D4AF37] group-hover:translate-x-1 transition-transform shrink-0" />
                      </div>

                      {/* SECTION 5: Monétisation */}
                      <div 
                        onClick={() => { setActiveTab("plus"); setPlusSubTab("finances"); }}
                        className="bg-[#121212] hover:bg-[#121212]/85 border border-[#2B2B2B] hover:border-[#D4AF37]/45 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-[#0B0B0B] border border-[#2B2B2B] flex items-center justify-center text-[#D4AF37]">
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase text-[#F8F8F8]">Monétisation & Approbations</h4>
                            <p className="text-[11px] text-gray-400">Suivre les devises de dépôts, commissions et versement Wave.</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#D4AF37] group-hover:translate-x-1 transition-transform shrink-0" />
                      </div>

                      {/* SECTION 6: Journal d'activité */}
                      <div className="bg-[#121212] border border-[#2B2B2B] rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-[#D4AF37]/10 flex items-center justify-center rounded">
                            <Activity className="w-3 h-3 text-[#D4AF37]" />
                          </div>
                          <span className="text-xs font-black text-white uppercase font-mono tracking-wider">Journal d'activité Live</span>
                        </div>
                        
                        <div className="bg-[#0B0B0B] rounded-xl p-3.5 border border-[#2B2B2B] font-mono text-[10px] space-y-1.5 max-h-40 overflow-y-auto scrollbar-none">
                          {terminalFeed.slice(0, 5).map((logLine, index) => (
                            <p key={index} className="text-gray-300 leading-normal truncate">{logLine}</p>
                          ))}
                          <span className="text-[9px] text-gray-500 italic font-medium block">Scanner système en temps réeel... OK</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* ACCOUNT MANAGER DIRECT CARRIER FOR HIGHER SAFETY */}
                  <div className="bg-[#121212] border border-[#D4AF37]/25 rounded-2xl p-5 space-y-3.5">
                    <h4 className="text-[10px] font-black uppercase text-[#D4AF37] tracking-widest">Co-Pilotes Autorisés</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                      Trois comptes possèdent les mêmes pouvoirs originels de validation de budget et versement.
                    </p>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {[
                        "johnsylvesterh@gmail.com",
                        "sylvestrehounkpevi777@gmail.com",
                        "jhs.kmj7@gmail.com"
                      ].map(mailItem => (
                        <div key={mailItem} className={`p-2 rounded-xl flex items-center justify-between border ${mailItem.toLowerCase() === adminEmail.toLowerCase() ? "bg-[#D4AF37]/5 border-[#D4AF37]/30 text-white font-bold" : "bg-[#0B0B0B]/60 border-transparent text-gray-400"}`}>
                          <span className="truncate">{mailItem}</span>
                          {mailItem.toLowerCase() === adminEmail.toLowerCase() ? (
                            <span className="text-[8.5px] uppercase font-black tracking-widest text-[#D4AF37]">Actif 👑</span>
                          ) : (
                            <span className="text-[8px] text-gray-600 block">Autorisé</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PREMIUM SHIFT USER MODE TRIGGER (AT THE BOTTOM OF DASHBOARD FOR HIGH CONVENIENCE) */}
                  <div className="pt-4 pb-2">
                    <button
                      onClick={onExitAdminMode}
                      className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]/80 hover:brightness-105 active:scale-[0.99] text-black font-black text-xs uppercase tracking-widest rounded-2xl transition duration-200 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4 fill-current" />
                      <span>👤 Utiliser AFRIGOMBO comme utilisateur</span>
                    </button>
                    <p className="text-center text-[10px] text-gray-500 font-mono mt-2 uppercase tracking-wide">
                      Bascule instantanée vers l'application classique
                    </p>
                  </div>

                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 2: UTILISATEURS / COMPTES TALENT */}
              {/* ======================================================== */}
              {activeTab === "users" && (
                <div className="space-y-4" id="users-tab">
                  <div className="space-y-2">
                    <h2 className="text-base font-black tracking-wider uppercase text-[#D4AF37]">
                      👥 Modération des Comptes Talent
                    </h2>
                    <p className="text-xs text-gray-400">Donner ou supprimer le badge Or-Superstar, restreindre ou réactiver.</p>
                  </div>

                  {/* Search and Filters */}
                  <div className="bg-[#121212] border border-[#2B2B2B] p-4 rounded-2xl space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Chercher par nom, e-mail, téléphone de l'artiste..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0B0B0B] border border-[#2B2B2B] focus:border-[#D4AF37] outline-none rounded-xl py-2.5 pl-9 pr-4 text-xs font-medium placeholder-gray-500 text-white transition-colors font-mono"
                      />
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {[
                        { id: "all", label: "Tous" },
                        { id: "musicien", label: "Artistes" },
                        { id: "client", label: "Clients" },
                        { id: "certified", label: "Certifiés ⭐" },
                        { id: "suspended", label: "Suspendus" }
                      ].map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setUserRoleFilter(r.id)}
                          className={`px-3 py-1.5 rounded-lg font-black uppercase text-[9.5px] transition-colors shrink-0 ${userRoleFilter === r.id ? "bg-[#D4AF37] text-black" : "bg-[#0B0B0B] text-gray-400 hover:text-white border border-[#2B2B2B]"}`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List View exclusively on vertical cards, perfectly mobile optimized! No scroll */}
                  <div className="space-y-3">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-16 bg-[#121212] border border-[#2B2B2B] rounded-2xl text-gray-400">
                        <Users className="w-10 h-10 text-gray-650 mx-auto mb-2.5 opacity-45" />
                        <p className="text-xs font-mono uppercase tracking-widest">Aucun artiste ne correspond aux critères.</p>
                      </div>
                    ) : (
                      filteredUsers.map((u) => (
                        <div 
                          key={u.uid}
                          className={`bg-[#121212] border ${u.isSuspended ? "border-red-500/25 opacity-75" : "border-[#2B2B2B]"} p-4.5 rounded-2xl space-y-4 transition`
                        }>
                          <div className="flex items-start gap-3">
                            <img 
                              src={u.avatarUrl || u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`}
                              alt="Avatar"
                              className="w-11 h-11 rounded-full object-cover border border-[#2B2B2B] bg-[#0B0B0B]"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <h3 className="font-bold text-white text-sm truncate">
                                  {u.artistName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Artiste Inconnu"}
                                </h3>
                                {u.isCertified && (
                                  <span className="text-[#D4AF37] text-xs" title="Certifié VIP">⭐</span>
                                )}
                              </div>
                              <p className="text-[10px] font-mono text-gray-400 truncate">{u.email}</p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                📞 Tel: <span className="text-white font-mono">{u.phone || "Non spécifié"}</span>
                              </p>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[8px] tracking-widest font-black uppercase shrink-0 ${u.role === "musicien" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20"}`}>
                              {u.role === "musicien" ? "Artiste" : "Client"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono py-2.5 border-t border-b border-[#2B2B2B]/60 text-gray-400">
                            <div>
                              <span>SOLDE RÉSERVE :</span>
                              <p className="text-white font-extrabold text-xs">{(u.balance ?? 0).toLocaleString()} F CFA</p>
                            </div>
                            <div>
                              <span>COMMUNE / VILLE :</span>
                              <p className="text-white font-semibold truncate">{u.commune || "Abidjan"}</p>
                            </div>
                          </div>

                          {/* Quick Moderator actions */}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => handleToggleCertification(u.uid, !!u.isCertified)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${u.isCertified ? "bg-[#D4AF37] text-black font-black" : "bg-[#0B0B0B] hover:bg-gray-800 border border-[#2B2B2B] text-gray-400 hover:text-white"}`}
                            >
                              {u.isCertified ? "⭐ Talent Star VIP" : "Passer en VIP"}
                            </button>

                            <div className="flex gap-2">
                              {/* Suspend Toggle */}
                              <button
                                onClick={() => handleToggleSuspension(u.uid, !!u.isSuspended)}
                                className={`p-2 rounded-lg border transition duration-150 ${u.isSuspended ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-[#0B0B0B] border-[#2B2B2B] text-red-400 hover:bg-red-950/20"}`}
                                title={u.isSuspended ? "Activer le profil" : "Suspendre temporairement"}
                              >
                                {u.isSuspended ? <Check className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                              </button>

                              {/* Hard Ban */}
                              <button
                                onClick={async () => {
                                  if (confirm(`🚨 Êtes-vous certain de vouloir interdire et bannir définitivement le profil d'email : ${u.email} ? Cette action est irréversible.`)) {
                                    await gomboDB.banUserPermanently(u.uid, adminEmail);
                                    setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 👮 BANNISSEMENT DÉFINITIF : ${u.email}`, ...prev]);
                                    loadData();
                                  }
                                }}
                                className="p-2 bg-[#0B0B0B] hover:bg-red-950/50 text-gray-500 hover:text-red-500 border border-[#2B2B2B] rounded-lg transition"
                                title="Bannir définitivement"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 3: PUBLICATIONS / DOSSIERS GOMBOS */}
              {/* ======================================================== */}
              {activeTab === "posts" && (
                <div className="space-y-4" id="publications-tab">
                  
                  {/* Toggle subtab between Gombos and Posts */}
                  <div className="bg-[#121212] border border-[#2B2B2B] p-2 rounded-2xl flex">
                    <button
                      onClick={() => { setGomboOrPostFilter("gombos"); setSearchTerm(""); }}
                      className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition ${gomboOrPostFilter === "gombos" ? "bg-[#D4AF37] text-black" : "text-gray-400 hover:text-white bg-transparent"}`}
                    >
                      📢 Appels de Gombo ({gombos.length})
                    </button>
                    <button
                      onClick={() => { setGomboOrPostFilter("posts"); setSearchTerm(""); }}
                      className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl transition ${gomboOrPostFilter === "posts" ? "bg-[#D4AF37] text-black" : "text-gray-400 hover:text-white bg-transparent"}`}
                    >
                      🎥 Démos Artistes ({posts.length})
                    </button>
                  </div>

                  {/* Search Engine */}
                  <div className="bg-[#121212] border border-[#2B2B2B] p-4 rounded-2xl space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder={gomboOrPostFilter === "gombos" ? "Rechercher par titre de gombo, budget oú lieu..." : "Rechercher par caption, titre oú nom d'auteur..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0B0B0B] border border-[#2B2B2B] focus:border-[#D4AF37] outline-none rounded-xl py-2.5 pl-9 pr-4 text-xs font-medium placeholder-gray-500 text-white transition-colors font-mono"
                      />
                    </div>

                    {gomboOrPostFilter === "gombos" && (
                      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                        <button
                          onClick={() => setGomboFilter("all")}
                          className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase transition-colors shrink-0 ${gomboFilter === "all" ? "bg-[#D4AF37] text-black" : "bg-[#0B0B0B] text-gray-400 border border-[#2B2B2B]"}`}
                        >
                          Tous
                        </button>
                        <button
                          onClick={() => setGomboFilter("urgent")}
                          className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase transition-colors shrink-0 ${gomboFilter === "urgent" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-[#0B0B0B] text-gray-400 border border-[#2B2B2B]"}`}
                        >
                          Urgent 🚨
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Redirection Content Display */}
                  <div className="space-y-3">
                    
                    {/* OPTION A: GOMBOS LISTING */}
                    {gomboOrPostFilter === "gombos" && (
                      filteredGombos.length === 0 ? (
                        <div className="text-center py-16 bg-[#121212] border border-[#2B2B2B] rounded-2xl text-gray-400">
                          <AlertTriangle className="w-10 h-10 text-gray-650 mx-auto mb-2.5 opacity-45" />
                          <p className="text-xs font-mono uppercase tracking-widest">Aucune offre de Gombo ne correspond.</p>
                        </div>
                      ) : (
                        filteredGombos.map((g) => (
                          <div key={g.id} className="bg-[#121212] border border-[#2B2B2B] p-4.5 rounded-2xl space-y-4">
                            <div className="flex items-start justify-between gap-1.5">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h3 className="font-bold text-white text-sm leading-snug">{g.title}</h3>
                                  {g.urgent && (
                                    <span className="bg-red-500/10 border border-red-500/25 text-red-400 text-[8.5px] font-black px-1.5 py-0.5 rounded">🚨 URGENT</span>
                                  )}
                                </div>
                                <p className="text-[10.5px] text-gray-400 mt-1 text-left leading-relaxed">{g.description}</p>
                              </div>
                              <span className="text-emerald-400 font-extrabold font-mono text-xs shrink-0 whitespace-nowrap">
                                {g.budget.toLocaleString()} F
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono py-2 border-t border-[#2B2B2B]/60 text-gray-400 text-left">
                              <p>📌 Commune : <strong className="text-white">{g.commune || "Cocody"}</strong></p>
                              <p>🏢 Lieu : <strong className="text-white">{g.location || "Abidjan"}</strong></p>
                              <p>📅 Date : <font className="text-white">{g.date}</font></p>
                              <p>👤 Client ID : <font className="text-[#D4AF37]" title={g.clientId}>{g.clientName || "Organisateur"}</font></p>
                            </div>

                            <div className="flex justify-between items-center pt-1">
                              <button
                                onClick={() => {
                                  setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 👑 GOMBO PROPULSÉ : ${g.title}`, ...prev]);
                                  alert("Cette opportunité de cachet musical a été propulsée en vedette !");
                                }}
                                className="px-3 py-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/25 hover:border-[#D4AF37]/45 rounded-lg transition text-[9px] font-black uppercase tracking-wider"
                              >
                                Propulser en Vedette 👑
                              </button>
                              
                              <button
                                onClick={async () => {
                                  if (confirm(`🚨 Êtes-vous certain de vouloir annuler et supprimer le gombo '${g.title}' ? S'il y a un budget caution déposé par Wave, il sera transféré de retour.`)) {
                                    setGombos(prev=>prev.filter(item=>item.id !== g.id));
                                    setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 🗑️ Gombo annulé par l'admin : ${g.title}`, ...prev]);
                                  }
                                }}
                                className="p-2 bg-[#0B0B0B] hover:bg-red-950/20 text-gray-500 hover:text-red-500 border border-[#2B2B2B] rounded-lg transition-colors"
                                title="Supprimer le gombo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )
                    )}

                    {/* OPTION B: ARTIST DEMO POSTS LISTING */}
                    {gomboOrPostFilter === "posts" && (
                      filteredPosts.length === 0 ? (
                        <div className="text-center py-16 bg-[#121212] border border-[#2B2B2B] rounded-2xl text-gray-400">
                          <Film className="w-10 h-10 text-gray-650 mx-auto mb-2.5 opacity-45" />
                          <p className="text-xs font-mono uppercase tracking-widest">Aucune démo ou vidéo postée.</p>
                        </div>
                      ) : (
                        filteredPosts.map((p) => {
                          const isHidden = (p as any).isHidden;
                          return (
                            <div 
                              key={p.id}
                              className={`bg-[#121212] border ${isHidden ? "border-red-500/20 opacity-55" : "border-[#2B2B2B]"} p-4 rounded-2xl space-y-3.5`}
                            >
                              <div>
                                <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-white text-sm leading-tight">{p.title || "Démo sans titre"}</h4>
                                  <span className="text-[10px] font-mono text-gray-400">👤 {p.userName || "Artiste Gombo"}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed text-left line-clamp-3">{p.caption}</p>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-[#2B2B2B]/60 text-xs text-gray-500">
                                <span>❤️ {p.likesCount || 0} J'aime appréciés</span>
                                
                                <div className="flex gap-2">
                                  {/* Change visibility */}
                                  <button
                                    onClick={() => handleTogglePostVisibility(p.id, !!isHidden)}
                                    className={`p-2 rounded-lg border transition ${isHidden ? "bg-[#D4AF37] text-black font-semibold border-transparent" : "bg-[#0B0B0B] text-gray-400 hover:text-white border-[#2B2B2B]"}`}
                                    title={isHidden ? "Rendre public" : "Masquer temporairement"}
                                  >
                                    {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>

                                  {/* Hard delete */}
                                  <button
                                    onClick={() => handleDeletePost(p.id)}
                                    className="p-2 bg-[#0B0B0B] hover:bg-red-500/20 text-gray-500 hover:text-red-500 border border-[#2B2B2B] rounded-lg transition"
                                    title="Supprimer la démo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )
                    )}

                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 4: SIGNALEMENTS / COMPLAINTS */}
              {/* ======================================================== */}
              {activeTab === "reports" && (
                <div className="space-y-4" id="reports-tab">
                  <div className="space-y-1">
                    <h2 className="text-base font-black tracking-wider uppercase text-red-400 flex items-center gap-1.5">
                      <AlertOctagon className="w-5 h-5 text-red-500 shrink-0" />
                      Arbitrage de Signalements ({reports.length})
                    </h2>
                    <p className="text-xs text-gray-400">Protéger la réputation et le respect éthique au sein d'AFRIGOMBO.</p>
                  </div>

                  <div className="space-y-3.5">
                    {filteredReports.length === 0 ? (
                      <div className="text-center py-20 bg-[#121212] border border-[#2B2B2B] rounded-2xl text-gray-400">
                        <CheckCircle className="w-11 h-11 text-emerald-500/35 mx-auto mb-2.5 animate-pulse" />
                        <p className="text-xs font-mono uppercase tracking-widest">Le temple est vierge. Aucun abus à modérer !</p>
                      </div>
                    ) : (
                      filteredReports.map((rep) => (
                        <div key={rep.id} className="bg-[#121212] border border-[#2B2B2B] p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between space-y-4">
                          <div className="space-y-3.5 text-left">
                            <div className="flex justify-between items-center">
                              <span className="bg-red-500/10 border border-red-500/25 text-red-400 text-[8px] font-black px-2 py-0.5 rounded tracking-widest uppercase">
                                Contenu Défectueux / Abus
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">{new Date(rep.createdAt).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-mono text-gray-500 block">Désaccord motivé :</span>
                              <p className="text-xs font-medium italic text-gray-300 bg-[#0B0B0B] p-3.5 rounded-xl border border-[#2B2B2B]">
                                "{rep.reason}"
                              </p>
                            </div>

                            <div className="text-[10px] font-mono text-gray-500 space-y-1">
                              <p>Identifiants signant : <strong className="text-white">{rep.reporterEmail || "Visiteur anonyme"}</strong></p>
                              <p>Cible de référence : <strong className="text-gray-400 break-all">{rep.contentId}</strong></p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-[#2B2B2B]/60 flex justify-end gap-2.5">
                            <button
                              onClick={() => handleAuditReport(rep.id, "ignore")}
                              className="px-3 py-1.5 bg-[#0B0B0B] hover:bg-gray-800 text-gray-400 hover:text-white text-[10px] font-black uppercase rounded-lg border border-[#2B2B2B]"
                            >
                              Ignorer
                            </button>
                            <button
                              onClick={() => handleAuditReport(rep.id, "delete", rep.contentId)}
                              className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-[10px] font-black uppercase rounded-lg border border-red-500/25"
                            >
                              Effacer / Bannir
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 5: PLUS (FINANCES, GROUPES, CONFIG GLOBALE) */}
              {/* ======================================================== */}
              {activeTab === "plus" && (
                <div className="space-y-6" id="plus-tab">
                  
                  {/* Top sub-navigation drawers */}
                  <div className="flex gap-1 bg-[#121212] border border-[#2B2B2B] p-1.5 rounded-2xl overflow-x-auto scrollbar-none">
                    <button
                      onClick={() => setPlusSubTab("finances")}
                      className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-xl transition ${plusSubTab === "finances" ? "bg-[#D4AF37] text-black" : "text-gray-400 hover:text-white"}`}
                    >
                      💰 Retraits ({withdrawRequests.filter(q=>q.status==="pending").length})
                    </button>
                    <button
                      onClick={() => setPlusSubTab("groups")}
                      className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-xl transition ${plusSubTab === "groups" ? "bg-[#D4AF37] text-black" : "text-gray-400 hover:text-white"}`}
                    >
                      👥 Orchestres
                    </button>
                    <button
                      onClick={() => setPlusSubTab("config")}
                      className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-xl transition ${plusSubTab === "config" ? "bg-[#D4AF37] text-black" : "text-gray-400 hover:text-white"}`}
                    >
                      ⚙️ Banque Config
                    </button>
                  </div>

                  {/* SUB-PANEL 1: RETRAITS DE CACHET */}
                  {plusSubTab === "finances" && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-black tracking-widest text-[#D4AF37] uppercase flex items-center gap-1.5">
                          <Landmark className="w-4.5 h-4.5 text-[#D4AF37]" />
                          Vérification de versement mobile money
                        </h3>
                        <p className="text-xs text-gray-400">Valider manuellement les fonds sécurisés gagnés par les artistes.</p>
                      </div>

                      <div className="space-y-3">
                        {withdrawRequests.map((req) => (
                          <div 
                            key={req.id} 
                            className={`p-4.5 rounded-2xl border flex flex-col justify-between transition-all ${req.status === "pending" ? "bg-[#121212] border-[#D4AF37]/35 shadow" : "bg-[#121212]/50 border-[#2B2B2B] opacity-65 text-gray-400"}`}
                          >
                            <div className="space-y-3.5 text-left">
                              <div className="flex justify-between items-center flex-wrap gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase text-white tracking-widest ${req.provider === "Wave" ? "bg-sky-500" : req.provider === "Orange Money" ? "bg-orange-500" : "bg-yellow-500 text-black"}`}>
                                  {req.provider}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${req.status === "approved" ? "bg-emerald-500/10 text-emerald-400" : req.status === "rejected" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400 animate-pulse"}`}>
                                  {req.status === "approved" ? "Payé avec succès" : req.status === "rejected" ? "Refusé" : "En attente d'Abidjan"}
                                </span>
                              </div>

                              <div>
                                <h3 className="text-lg font-black text-white font-mono">{req.amount.toLocaleString()} F CFA</h3>
                                <p className="text-xs font-semibold text-gray-200 mt-0.5 truncate">{req.userEmail}</p>
                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">Destinataire : <font className="text-[#D4AF37]">{req.phone}</font></p>
                              </div>
                            </div>

                            {req.status === "pending" && (
                              <div className="pt-3 border-t border-[#2B2B2B] flex gap-2.5 mt-4">
                                <button
                                  onClick={() => handleRejectWithdraw(req.id)}
                                  className="flex-1 py-2 bg-[#0B0B0B] hover:bg-red-950/20 border border-[#2B2B2B] text-red-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
                                >
                                  Refuser
                                </button>
                                <button
                                  onClick={() => handleApproveWithdraw(req.id, req.userUid, req.amount)}
                                  className="flex-1 py-2 bg-[#D4AF37] hover:brightness-105 text-black text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
                                >
                                  Valider Paye 💰
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUB-PANEL 2: ORCHESTRES ET GROUPES VIP */}
                  {plusSubTab === "groups" && (
                    <div className="space-y-4">
                      
                      {/* Search Bar groups */}
                      <div className="bg-[#121212] border border-[#2B2B2B] p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
                        <div className="space-y-0.5 text-left">
                          <h4 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider">Modérer l'annuaire des Groupes</h4>
                          <p className="text-[10.5px] text-gray-400">Suspendre ou radier les formations musicales d'Afrique-Orchestres.</p>
                        </div>
                        <input
                          type="text"
                          placeholder="Rechercher groupe..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full md:max-w-[200px] bg-[#0B0B0B] border border-[#2B2B2B] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 font-mono"
                        />
                      </div>

                      <div className="space-y-3">
                        {groups.filter(g => (g.name || "").toLowerCase().includes(searchTerm.toLowerCase())).map((g) => (
                          <div 
                            key={g.id} 
                            className={`bg-[#121212] border ${g.isSuspended ? "border-red-500/25 opacity-75" : "border-[#2B2B2B]"} p-4.5 rounded-2xl space-y-3.5`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-xl bg-[#0B0B0B] border border-[#2B2B2B] shrink-0 flex items-center justify-center overflow-hidden">
                                {g.logoUrl ? (
                                  <img src={g.logoUrl} alt={g.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Radio className="w-5 h-5 text-gray-500" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <h4 className="font-extrabold text-white text-sm uppercase truncate">{g.name}</h4>
                                <span className="text-[9.5px] text-[#D4AF37] font-mono uppercase tracking-wider">{g.type || "Orchestre"}</span>
                                <p className="text-[10px] text-gray-400">📍 {g.commune || "Cocody"}, {g.ville || "Abidjan"}</p>
                              </div>
                            </div>

                            <p className="text-xs text-gray-400 italic text-left">{g.description || "Pas de description."}</p>

                            <div className="pt-3.5 border-t border-[#2B2B2B] flex justify-end gap-2">
                              <button
                                onClick={() => handleToggleSuspendGroup(g.id, g.name, !!g.isSuspended)}
                                className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg border transition ${g.isSuspended ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-orange-500/10 border-orange-500/10 text-[#D4AF37]"}`}
                              >
                                {g.isSuspended ? "Activer l'orchestre" : "Suspendre"}
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(g.id, g.name)}
                                className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black uppercase rounded-lg hover:bg-red-500/20 transition-colors"
                              >
                                supprimer déf.
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUB-PANEL 3: GLOBAL CONFIGURATION BANNER/RATE */}
                  {plusSubTab === "config" && (
                    <div className="bg-[#121212] border border-[#2B2B2B] p-5 rounded-2xl space-y-5 text-left">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#D4AF37]">
                          ⚙️ Configuration Constantes d'arènes
                        </h4>
                        <p className="text-[11px] text-gray-400">Gérer la commission de service et la bannière broadcast sur l'accueil.</p>
                      </div>

                      <div className="space-y-4">
                        
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Bannière d'alerte Globale d'Accueil</label>
                          <textarea
                            value={systemAlert}
                            onChange={(e) => setSystemAlert(e.target.value)}
                            rows={3}
                            className="w-full bg-[#0B0B0B] border border-[#2B2B2B] rounded-xl p-3 text-white focus:border-[#D4AF37] outline-none font-sans text-xs"
                            placeholder="Annonce affichée sur l'accueil des musiciens..."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Commission de Gombo (%)</label>
                          <input
                            type="number"
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(e.target.value)}
                            className="w-full bg-[#0B0B0B] border border-[#2B2B2B] focus:border-[#D4AF37] outline-none rounded-xl h-10 px-3 text-xs text-white"
                            min="0"
                            max="50"
                          />
                        </div>

                        <button
                          onClick={handleSaveConfig}
                          className="w-full h-11 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
                        >
                          Sauvegarder les Constantes globales
                        </button>

                      </div>
                    </div>
                  )}

                </div>
              )}

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 📱👑 FIXED BOTTOM MENU DOCK (SINGLE ACCESSIBILITY RESPONSIVE NAV-BAR) */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-[#121212] border-t border-[#2B2B2B] h-17 px-3 flex items-center justify-around select-none">
        
        {/* Cockpit - Tableau */}
        <button
          onClick={() => { setActiveTab("cockpit"); setSearchTerm(""); }}
          className={`flex flex-col items-center justify-center w-14 h-14 transition duration-200 outline-none cursor-pointer ${activeTab === "cockpit" ? "text-[#D4AF37]" : "text-gray-400"}`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase mt-1">Tableau</span>
        </button>

        {/* Users - Utilisateurs */}
        <button
          onClick={() => { setActiveTab("users"); setSearchTerm(""); }}
          className={`flex flex-col items-center justify-center w-14 h-14 transition duration-200 outline-none cursor-pointer ${activeTab === "users" ? "text-[#D4AF37]" : "text-gray-400"}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase mt-1">Talents</span>
        </button>

        {/* Posts - Publications */}
        <button
          onClick={() => { setActiveTab("posts"); setSearchTerm(""); }}
          className={`flex flex-col items-center justify-center w-14 h-14 transition duration-200 outline-none cursor-pointer ${activeTab === "posts" ? "text-[#D4AF37]" : "text-gray-400"}`}
        >
          <Film className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase mt-1">Pubs/Gomb</span>
        </button>

        {/* Reports - Signalements */}
        <button
          onClick={() => { setActiveTab("reports"); setSearchTerm(""); }}
          className={`flex flex-col items-center justify-center w-14 h-14 transition duration-200 outline-none cursor-pointer ${activeTab === "reports" ? "text-[#D4AF37]" : "text-gray-400"} relative`}
        >
          <AlertOctagon className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase mt-1">Alertes</span>
          {reports.filter(r=>r.status==="pending").length > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>

        {/* Plus - Sub sections */}
        <button
          onClick={() => { setActiveTab("plus"); setSearchTerm(""); }}
          className={`flex flex-col items-center justify-center w-14 h-14 transition duration-200 outline-none cursor-pointer ${activeTab === "plus" ? "text-[#D4AF37]" : "text-gray-400"}`}
        >
          <Radio className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase mt-1">Plus</span>
        </button>

      </footer>

    </div>
  );
}
