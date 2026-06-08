import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, Users, Film, Radio, Layers, DollarSign, ListFilter, 
  Trash2, ShieldCheck, Ban, Sparkles, BookOpen, AlertOctagon, CheckCircle, 
  X, Search, Award, Grid, Shield, Minimize, RefreshCw, BarChart2, Eye, EyeOff, 
  Activity, Send, AlertTriangle, Cpu, TrendingUp, Landmark, Flame, Bell, Check, Edit, ChevronRight
} from "lucide-react";
import { gomboDB, isFirebaseMock } from "../firebase";
import { UserProfile, SocialPost, AdminLog, Gombo } from "../types";

interface AdminCentreProps {
  adminEmail: string;
  adminProfile: UserProfile | null;
  onExitAdminMode: () => void;
}

// Simulated real-time streaming operations logs
const MOCK_TELEMETRY_LOGS = [
  "⚡ [API Gateway] Route /api/gombos optimized in 4ms",
  "🔑 [Google Auth] Session rafraîchie sous token JWT conforme",
  "💰 [Finance] Succès du prélèvement de commission - Référence W2026-68",
  "🛡️ [Juge Gombo] Scanner de contenu automatisé exempt de mots interdits",
  "📋 [Validation] Candidature de l'artiste Yorobo Sangaré reçue",
  "🔔 [Push NS] Notification prioritaires Cocody expédiée à 12 membres",
  "🔋 [Engine] Threads Node.js alloués: 96, CPU: 8.5%",
  "📁 [DB Core] Sauvegarde immuable de l'index 'temp_auth_transfers'"
];

export default function AdminCentre({ adminEmail, adminProfile, onExitAdminMode }: AdminCentreProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"cockpit" | "finances" | "gombos" | "posts" | "users" | "reports" | "config">("cockpit");
  
  // Base Data States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [gombos, setGombos] = useState<Gombo[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom interactive admin additions (persistent via localStorage)
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>(() => {
    const saved = localStorage.getItem("gombo_withdraw_requests");
    if (saved) return JSON.parse(saved);
    // Initial rich mock withdraw actions
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
  
  // Internal search filters
  const [searchTerm, setSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [reportFilter, setReportFilter] = useState<string>("all");
  const [gomboFilter, setGomboFilter] = useState<string>("all");

  // System statistics telemetry
  const [stats, setStats] = useState({
    totalUsers: 0,
    musicians: 0,
    clients: 0,
    certifiedUsers: 0,
    totalPosts: 0,
    totalGombos: 0,
    totalSecuredCachet: 0,
    paymentsSuccess: 0,
    cpuUsage: 14,
    latencyMs: 12
  });

  // Telemetry loop for simulating server health
  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        cpuUsage: Math.floor(Math.random() * 12) + 6, // 6% to 18% CPU
        latencyMs: Math.floor(Math.random() * 15) + 8 // 8ms to 23ms latency
      }));

      // Stream a random simulation log occasionally
      if (Math.random() > 0.6) {
        const randomMsg = MOCK_TELEMETRY_LOGS[Math.floor(Math.random() * MOCK_TELEMETRY_LOGS.length)];
        const timestamp = new Date().toLocaleTimeString();
        setTerminalFeed(prev => [`[${timestamp}] ${randomMsg}`, ...prev.slice(0, 10)]);
      }
    }, 4000);

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
      const [allUsers, allPosts, allReports, allLogs, allGombos] = await Promise.all([
        gomboDB.getUsersAdmin(),
        gomboDB.getPostsAdmin(),
        gomboDB.getReportsAdmin(),
        gomboDB.getAdminLogs(),
        gomboDB.getAllGombos()
      ]);

      const usersList = allUsers || [];
      const postsList = allPosts || [];
      const reportsList = allReports || [];
      const logsList = allLogs || [];
      const gombosList = allGombos || [];

      setUsers(usersList);
      setPosts(postsList);
      setReports(reportsList);
      setLogs(logsList);
      setGombos(gombosList);

      // Calcul standard calculations
      const musicianCount = usersList.filter(u => u.role === "musicien").length;
      const clientCount = usersList.filter(u => u.role === "client" || u.role === "organisateur").length;
      const certifiedCount = usersList.filter(u => u.isCertified || u.verificationStatus === "certifie").length;
      
      // Sum up total budgets of active secured gigs
      const securedBudgetsSum = gombosList.reduce((acc, g) => acc + (g.budget || 0), 0);

      setStats(prev => ({
        ...prev,
        totalUsers: usersList.length,
        musicians: musicianCount,
        clients: clientCount,
        certifiedUsers: certifiedCount,
        totalPosts: postsList.length,
        totalGombos: gombosList.length,
        totalSecuredCachet: securedBudgetsSum
      }));
      setLoading(false);
    } catch (err) {
      console.error("Error loading secure admin context data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Core administrative events Handlers
  const handleToggleSuspension = async (uid: string, currentSuspension: boolean) => {
    if (confirm(`Voulez-vous ${currentSuspension ? "RÉACTIVER" : "SUSPENDRE DIRECTEMENT"} cet utilisateur ?`)) {
      await gomboDB.toggleUserSuspension(uid, !currentSuspension, adminEmail);
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 🚧 Statut suspension changé pour l'UID: ${uid}`, ...prev]);
      loadData();
    }
  };

  const handleToggleCertification = async (uid: string, currentCertified: boolean) => {
    if (confirm(`Voulez-vous ${currentCertified ? "DÉCERTIFIER" : "CERTIFIER COMME TALENT ⭐ PRINCIPAL"} cet utilisateur ?`)) {
      await gomboDB.toggleUserCertified(uid, !currentCertified, adminEmail);
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] ⭐ Certification émise pour l'UID: ${uid}`, ...prev]);
      loadData();
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm("Voulez-vous détruire immuablement cette publication ?")) {
      await gomboDB.deletePostAdmin(postId, adminEmail);
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 🗑️ Publication supprimée immuablement: ${postId}`, ...prev]);
      loadData();
    }
  };

  const handleTogglePostVisibility = async (postId: string, currentHidden: boolean) => {
    await gomboDB.togglePostVisibility(postId, !currentHidden, adminEmail);
    setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 👁️ Visibilité alternée pour la publication: ${postId}`, ...prev]);
    loadData();
  };

  const handleAuditReport = async (reportId: string, action: "ignore" | "delete" | "suspend" | "ban", contentId?: string, authorId?: string) => {
    if (confirm(`Prendre la décision : ${action.toUpperCase()} pour ce signalement ?`)) {
      await gomboDB.auditReportAction(reportId, action, adminEmail, contentId, authorId);
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 🛡️ Arbitrage report ${reportId} complété avec succès`, ...prev]);
      loadData();
    }
  };

  // Finance Approval handlers
  const handleApproveWithdraw = (id: string, requesterUid: string, amount: number) => {
    if (confirm(`Confirmez-vous le versement externe de ${amount.toLocaleString()} FCFA pour ce transfert Showbiz ?`)) {
      setWithdrawRequests(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
      
      // Update specific target profile balance if possible
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

      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 💰 RECONCILIATION SUCCÈS : Transfert ${id} validé par l'admin d'Abidjan.`, ...prev]);
    }
  };

  const handleRejectWithdraw = (id: string) => {
    if (confirm("Voulez-vous rejeter cette demande ? Les fonds resteront gelés pour enquête d'arbitrage.")) {
      setWithdrawRequests(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] ❌ TRANSFERT REJETÉ : Arbitrage requis sur l'opération ${id}.`, ...prev]);
    }
  };

  // Systems Configuration triggers
  const handleSaveConfig = () => {
    localStorage.setItem("gombo_system_alert", systemAlert);
    localStorage.setItem("gombo_commission_rate", commissionRate);
    alert("Configuration globale d'AFRIGOMBO sauvegardée avec succès !");
    setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] ⚙️ Métadonnées config système modifiées. Commission : ${commissionRate}%`, ...prev]);
  };

  // Filter computation rules
  const filteredUsers = users.filter(u => {
    const name = `${u.firstName || ""} ${u.lastName || ""} ${u.artistName || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch = name.includes(term) || email.includes(term);

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
    <div className="min-h-screen bg-[#070913] text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-black" id="afrigombo-admin-dashboard-container">
      
      {/* 🚀 UPPER HEAVY TELEMETRY HEADER STATUS */}
      <div className="w-full bg-slate-950/80 border-b border-amber-500/10 px-4 sm:px-6 py-3.5 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Shield className="text-[#070913] w-5 h-5 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-widest text-amber-400 uppercase">
                  COCKPIT CRÉATEUR • AFRIGOMBO
                </h1>
                <span className="bg-amber-500/10 text-amber-400 text-[8.5px] uppercase font-black px-1.5 py-0.5 rounded border border-amber-500/20">
                  SYSADMIN V4.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Moniteur de contrôle sécurisé: {adminEmail}</p>
            </div>
          </div>

          {/* TELEMETRY GAUGES */}
          <div className="flex items-center gap-5 text-slate-400 text-[10.5px] font-mono">
            <div className="hidden lg:flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Charge VM:</span>
              <span className="font-extrabold text-slate-200">{stats.cpuUsage}%</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Latence:</span>
              <span className="font-extrabold text-slate-200">{stats.latencyMs}ms</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 font-bold uppercase text-[9px] tracking-wider">Sync Firestore Online</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => loadData()}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 rounded-xl transition text-slate-300 hover:text-amber-400"
              title="Rafraîchir les données de l'arène"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onExitAdminMode}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs rounded-xl hover:shadow-lg hover:shadow-amber-500/15 hover:scale-[1.02] transform transition cursor-pointer"
            >
              Fermer Commande 👤
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* GLOBAL BROADCAST BANNER DISPLAY (Admin interactive configuration check) */}
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-950/80 to-amber-500/5 border-l-4 border-amber-400 p-4 rounded-r-2xl flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[10px] font-black tracking-widest text-amber-400 uppercase">ANNOUNCE DIRECTE AFFICHÉE SUR ACCUEIL</p>
            <p className="text-xs text-slate-200 italic font-mono">"{systemAlert}"</p>
          </div>
        </div>

        {/* COMPREHENSIVE SUB-ROUTING NAVIGATION DRAWER TABS */}
        <div className="flex overflow-x-auto gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-900 scrollbar-none">
          <button
            onClick={() => { setActiveTab("cockpit"); setSearchTerm(""); }}
            className={`px-4 py-2.5 text-[10.5px] font-extrabold uppercase tracking-widest rounded-xl shrink-0 transition flex items-center gap-2 ${activeTab === "cockpit" ? "bg-amber-400 text-[#070913] font-black" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"}`}
          >
            <Grid className="w-4 h-4" /> Cockpit Général
          </button>
          <button
            onClick={() => { setActiveTab("finances"); setSearchTerm(""); }}
            className={`px-4 py-2.5 text-[10.5px] font-extrabold uppercase tracking-widest rounded-xl shrink-0 transition flex items-center gap-2 relative ${activeTab === "finances" ? "bg-amber-400 text-[#070913] font-black" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"}`}
          >
            <DollarSign className="w-4 h-4" /> Finances & Retraits
            {withdrawRequests.filter(r => r.status === "pending").length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute top-0.5 right-0.5" />
            )}
          </button>
          <button
            onClick={() => { setActiveTab("gombos"); setSearchTerm(""); }}
            className={`px-4 py-2.5 text-[10.5px] font-extrabold uppercase tracking-widest rounded-xl shrink-0 transition flex items-center gap-2 ${activeTab === "gombos" ? "bg-amber-400 text-[#070913] font-black" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"}`}
          >
            <Layers className="w-4 h-4" /> Modération Gombos
          </button>
          <button
            onClick={() => { setActiveTab("posts"); setSearchTerm(""); }}
            className={`px-4 py-2.5 text-[10.5px] font-extrabold uppercase tracking-widest rounded-xl shrink-0 transition flex items-center gap-2 ${activeTab === "posts" ? "bg-amber-400 text-[#070913] font-black" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"}`}
          >
            <Film className="w-4 h-4" /> Publications / Médias
          </button>
          <button
            onClick={() => { setActiveTab("users"); setSearchTerm(""); }}
            className={`px-4 py-2.5 text-[10.5px] font-extrabold uppercase tracking-widest rounded-xl shrink-0 transition flex items-center gap-2 ${activeTab === "users" ? "bg-amber-400 text-[#070913] font-black" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"}`}
          >
            <Users className="w-4 h-4" /> Comptes Talent
          </button>
          <button
            onClick={() => { setActiveTab("reports"); setSearchTerm(""); }}
            className={`px-4 py-2.5 text-[10.5px] font-extrabold uppercase tracking-widest rounded-xl shrink-0 transition flex items-center gap-2 relative ${activeTab === "reports" ? "bg-amber-400 text-[#070913] font-black" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"}`}
          >
            <AlertOctagon className="w-4 h-4 text-red-500" /> Signalements ({reports.length})
          </button>
          <button
            onClick={() => { setActiveTab("config"); setSearchTerm(""); }}
            className={`px-4 py-2.5 text-[10.5px] font-extrabold uppercase tracking-widest rounded-xl shrink-0 transition flex items-center gap-2 ${activeTab === "config" ? "bg-amber-400 text-[#070913] font-black" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"}`}
          >
            <BookOpen className="w-4 h-4" /> Configuration Arène
          </button>
        </div>

        {/* 🎬 MAIN DOCK DISPLAY CHASSIS */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-xs text-slate-500 tracking-widest font-mono uppercase">LECTURE CYGNE DE DONNÉES EN COURS...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-6"
            >
              
              {/* TAB 1: GENERAL STATS & TERM COCKPIT */}
              {activeTab === "cockpit" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column stats block */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      
                      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Membres Actifs</p>
                          <p className="text-xl font-bold text-slate-100">{stats.totalUsers}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{stats.musicians} Musiciens / {stats.clients} Organisateurs</p>
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0">
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Membres Certifiés</p>
                          <p className="text-xl font-bold text-orange-400">{stats.certifiedUsers}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Taux de validation: {(stats.totalUsers > 0 ? (stats.certifiedUsers/stats.totalUsers)*100 : 0).toFixed(0)}%</p>
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                          <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Volume de Cachet Sécurisé</p>
                          <p className="text-xl font-bold text-emerald-400 font-mono">{stats.totalSecuredCachet.toLocaleString()} F CFA</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{stats.totalGombos} Appels de scène ouverts</p>
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                          <Activity className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Frais encaissés ({commissionRate}%)</p>
                          <p className="text-xl font-bold text-purple-400 font-mono">{(stats.totalSecuredCachet * (parseFloat(commissionRate)/100 || 0.1)).toLocaleString()} F</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Retraits en attente: {withdrawRequests.filter(r => r.status === "pending").length}</p>
                        </div>
                      </div>
                    </div>

                    {/* GROWTH ANALYTICS DRAWBOARD */}
                    <div className="bg-[#0b0c16] border border-slate-900 p-6 rounded-3xl relative overflow-hidden">
                      <div className="flex justify-between items-center mb-6">
                        <div className="space-y-0.5">
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">TRAFIC & RECOUVREMENT SHOWBIZ</h3>
                          <p className="text-[11px] text-slate-500">Mois en cours comparé au trimestre précédent (Abidjan)</p>
                        </div>
                        <TrendingUp className="w-5 h-5 text-amber-400" />
                      </div>
                      
                      <div className="h-56 w-full flex items-end justify-between px-2 pt-6 relative border-b border-slate-900">
                        <svg className="absolute inset-0 w-full h-full p-4 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <path d="M 0 90 Q 25 60 50 45 T 100 20" fill="none" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="2" />
                          <path d="M 0 90 Q 25 70 50 50 T 100 35" fill="none" stroke="rgba(212, 175, 55, 0.12)" strokeWidth="1" />
                        </svg>

                        {[
                          { l: "Jan", val: 120000 }, { l: "Feb", val: 180000 }, 
                          { l: "Mar", val: 240000 }, { l: "Apr", val: 310000 }, 
                          { l: "May", val: 420000 }, { l: "Jun", val: stats.totalSecuredCachet || 520000 }
                        ].map((node, i) => (
                          <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer z-10 w-1/6">
                            <span className="opacity-0 group-hover:opacity-100 transition duration-150 text-[9px] bg-slate-950 text-emerald-400 border border-slate-800 px-2 py-0.5 rounded font-mono">
                              {node.val.toLocaleString()} F
                            </span>
                            <div 
                              className="w-5 sm:w-8 bg-gradient-to-t from-amber-500/10 to-amber-400/80 rounded-t shadow-inner shadow-amber-500/25 transition-all duration-300 hover:brightness-125"
                              style={{ height: `${Math.max(12, Math.min(130, (node.val / 600000) * 120))}px` }}
                            />
                            <span className="text-[9px] text-slate-500 uppercase font-mono">{node.l}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Virtual Ticker Console Logs */}
                  <div className="bg-[#090b14] border border-slate-900 rounded-3xl p-5 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                        <span className="text-xs font-black tracking-widest text-slate-200 uppercase flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-amber-500" />
                          TERMINAL SYSTÈME LIVE
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                          COBOL_STREAM
                        </span>
                      </div>

                      {/* Live scrolling command block */}
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1 scrollbar-none font-mono text-[10.5px]">
                        {terminalFeed.map((f, i) => (
                          <div key={i} className={`p-2 rounded-lg leading-relaxed ${f.includes("❌") || f.includes("REJET") ? "bg-red-950/20 text-red-300 border-l-2 border-red-500" : f.includes("⭐") || f.includes("succès") || f.includes("VALID") ? "bg-emerald-950/20 text-emerald-300 border-l-2 border-emerald-500" : "bg-slate-950 text-slate-300 border-l-2 border-slate-700"}`}>
                            {f}
                          </div>
                        ))}
                        <div className="p-2 bg-slate-950 rounded text-slate-500 italic">
                          [Vérification] En attente de nouveaux événements de production...
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-900/60 mt-4 flex items-center justify-between text-xs text-slate-500">
                      <span>Total d'événements :</span>
                      <span className="font-mono text-slate-400">{terminalFeed.length} logs d'arène</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FINANCES & WITHDRAWAL AUDITING */}
              {activeTab === "finances" && (
                <div className="space-y-6">
                  
                  {/* Alert queue */}
                  <div className="bg-[#0b0c16] border border-slate-900 p-6 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-4">
                      <div>
                        <h3 className="text-xs font-black tracking-wider uppercase text-slate-200">DEMANDES DE RETRAIT EN ATTENTE</h3>
                        <p className="text-[11px] text-slate-500">Arbitrez et validez les virements mobile money de cachets pour les artistes.</p>
                      </div>
                      <Landmark className="w-5 h-5 text-amber-400" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {withdrawRequests.map((req) => (
                        <div key={req.id} className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${req.status === "pending" ? "bg-slate-950 border-amber-500/20 shadow-lg shadow-amber-500/5 hover:border-amber-500/40" : "bg-slate-950/50 border-slate-900 opacity-70"}`}>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase text-white tracking-widest ${req.provider === "Wave" ? "bg-sky-500" : req.provider === "Orange Money" ? "bg-orange-500" : "bg-yellow-500 text-black"}`}>
                                {req.provider}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${req.status === "approved" ? "bg-emerald-500/10 text-emerald-400" : req.status === "rejected" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400 animate-pulse"}`}>
                                {req.status === "approved" ? "Payé avec succès" : req.status === "rejected" ? "Refusé / Gelé" : "En cours de validation"}
                              </span>
                            </div>

                            <div>
                              <p className="text-xl font-black text-emerald-400 font-mono">{req.amount.toLocaleString()} FCFA</p>
                              <p className="text-xs font-medium text-slate-200 mt-1">{req.userEmail}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Mobile Money : {req.phone}</p>
                            </div>
                          </div>

                          {req.status === "pending" && (
                            <div className="pt-4 border-t border-slate-900 flex gap-2.5 mt-5">
                              <button
                                onClick={() => handleRejectWithdraw(req.id)}
                                className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-red-500/30 text-rose-400 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                              >
                                Rejeter
                              </button>
                              <button
                                onClick={() => handleApproveWithdraw(req.id, req.userUid, req.amount)}
                                className="flex-1 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-[10px] font-black uppercase tracking-wider rounded-lg hover:shadow-lg transition-all cursor-pointer"
                              >
                                Débloquer Pay 💰
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Standard Ledgers */}
                  <div className="bg-slate-950 border border-slate-900 rounded-3xl p-5 overflow-hidden">
                    <h3 className="text-xs font-black uppercase tracking-wider border-b border-slate-900 pb-3 text-slate-200 flex items-center gap-1.5">
                      <Landmark className="w-4 h-4 text-amber-500" />
                      RECETTES & ENCAISSEMENTS DES ABONNEMENTS AFRI-VIP
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-500 text-[9.5px] uppercase font-mono tracking-widest bg-black/40">
                            <th className="p-4">Réf Transaction</th>
                            <th className="p-4">Client Déposant</th>
                            <th className="p-4">Service</th>
                            <th className="p-4">Montant Payé</th>
                            <th className="p-4 text-right">Date d'Immatriculation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 text-slate-300 font-mono text-[11px]">
                          <tr className="hover:bg-slate-900/40">
                            <td className="p-4 text-slate-400">TX-2026-009</td>
                            <td className="p-4 font-bold text-slate-200">Serge Kassi (Client)</td>
                            <td className="p-4 text-amber-400 font-sans font-bold">Abonnement VIP Promotech</td>
                            <td className="p-4 text-emerald-400 font-black">25 000 FCFA</td>
                            <td className="p-4 text-right text-slate-500">{new Date(Date.now() - 3600000 * 4).toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-slate-900/40">
                            <td className="p-4 text-slate-400">TX-2026-010</td>
                            <td className="p-4 font-bold text-slate-200">Koffi Kouamé (Musique)</td>
                            <td className="p-4 text-amber-400 font-sans font-bold">Badge Artiste Certifié</td>
                            <td className="p-4 text-emerald-400 font-black">10 000 FCFA</td>
                            <td className="p-4 text-right text-slate-500">{new Date(Date.now() - 3600000 * 18).toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-slate-900/40">
                            <td className="p-4 text-slate-400">TX-2026-011</td>
                            <td className="p-4 font-bold text-slate-200">Mélodie d'Afrique (Lounge)</td>
                            <td className="p-4 text-amber-400 font-sans font-bold">Gombo Dépôt Garantie (Cocody)</td>
                            <td className="p-4 text-emerald-400 font-black">150 000 FCFA</td>
                            <td className="p-4 text-right text-slate-500">{new Date(Date.now() - 3600000 * 24).toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: APPELS DE GOMBO MODERATION */}
              {activeTab === "gombos" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-950 border border-slate-900 p-4 rounded-2xl">
                    <div className="relative w-full sm:max-w-md">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Rechercher par gombo, commune, concert..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#101424] border border-slate-850 focus:border-amber-500 outline-none rounded-xl py-2 pl-9 pr-4 text-xs font-medium placeholder-slate-500 text-white transition-all font-mono"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGomboFilter("all")}
                        className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase transition tracking-wider ${gomboFilter === "all" ? "bg-amber-400 text-[#070913]" : "bg-slate-900 text-slate-400 hover:text-white"}`}
                      >
                        Tous les gombos
                      </button>
                      <button
                        onClick={() => setGomboFilter("urgent")}
                        className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase transition tracking-wider ${gomboFilter === "urgent" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-slate-900 text-slate-400 hover:text-white"}`}
                      >
                        Urgent 🚨
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 bg-[#0c1020] text-slate-500 text-[10px] uppercase font-mono tracking-widest">
                          <th className="p-4">Offre / Pitch</th>
                          <th className="p-4">Commune / Lieu</th>
                          <th className="p-4">Date de Programmation</th>
                          <th className="p-4">Cachet Financier</th>
                          <th className="p-4 text-right">Arbitrage & Force Majeure</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {filteredGombos.map((g) => (
                          <tr key={g.id} className="hover:bg-slate-900/30 transition-colors">
                            <td className="p-4">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-slate-200 text-sm leading-tight">{g.title}</p>
                                  {g.urgent && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">🚨 URGENT</span>}
                                </div>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{g.description}</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Propriétaire clientID: {g.clientId} ({g.clientName || "Organisateur"})</p>
                              </div>
                            </td>
                            <td className="p-4 font-semibold text-slate-300">
                              <p className="text-sm">{g.commune}</p>
                              <p className="text-[10px] text-slate-500">{g.location}</p>
                            </td>
                            <td className="p-4 font-mono text-slate-300">
                              <p>{g.date}</p>
                              <p className="text-[10.5px] text-slate-500">Heure: {g.time || "21:00"}</p>
                            </td>
                            <td className="p-4 text-emerald-400 font-black font-mono text-sm">
                              {g.budget.toLocaleString()} FCFA
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={async () => {
                                    if (confirm("Mettre cette opportunité en vedette sur l'application ?")) {
                                      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] ⭐ Gombo mis en Vedette: ${g.title}`, ...prev]);
                                      alert("Gombo propulsé en Vedette 🚀");
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-black rounded-lg transition font-mono text-[9px] font-black uppercase border border-amber-500/25"
                                >
                                  Propulser 👑
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`🚨 Êtes-vous certain de vouloir annuler et détruire le gombo '${g.title}' ? S'il y a un cachet garanti déposé par Wave, il sera remboursé.`)) {
                                      // Simulated delete
                                      setGombos(prev => prev.filter(item => item.id !== g.id));
                                      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 🗑️ Force Majeure appliquée. Gombo supprimé : ${g.title}`, ...prev]);
                                    }
                                  }}
                                  className="p-1.5 bg-slate-900 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-slate-500 border border-slate-800 transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: PUBLICATIONS (EXISTING) */}
              {activeTab === "posts" && (
                <div className="space-y-4">
                  <div className="flex gap-3 justify-between items-center bg-slate-950 border border-slate-900 p-4 rounded-2xl">
                    <div className="relative w-full max-w-md">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Rechercher publications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#101424] border border-slate-850 focus:border-amber-500 outline-none rounded-xl py-2 pl-9 pr-4 text-xs font-medium placeholder-slate-500 text-white transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 bg-[#0c1020] text-slate-500 text-[10px] uppercase font-mono tracking-widest">
                          <th className="p-4">Aperçu</th>
                          <th className="p-4">Auteur</th>
                          <th className="p-4">Fidélité</th>
                          <th className="p-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {filteredPosts.map((p) => {
                          const isHidden = (p as any).isHidden;
                          return (
                            <tr key={p.id} className={`hover:bg-slate-900/30 transition-colors ${isHidden ? "bg-slate-950/80 opacity-50 font-mono" : ""}`}>
                              <td className="p-4">
                                <div className="space-y-1">
                                  <p className="font-bold text-slate-200">{p.title || "Démo sans titre"}</p>
                                  <p className="text-slate-400 line-clamp-2 max-w-lg">{p.caption}</p>
                                </div>
                              </td>
                              <td className="p-4 font-bold text-slate-300">
                                {p.userName}
                              </td>
                              <td className="p-4 font-mono text-slate-400">
                                <p>❤️ {p.likesCount || 0} J'aime</p>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => handleTogglePostVisibility(p.id, !!isHidden)}
                                    className={`p-1.5 rounded-lg transition ${isHidden ? "bg-amber-400 text-black font-semibold" : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"}`}
                                  >
                                    {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                  <button
                                    onClick={() => handleDeletePost(p.id)}
                                    className="p-1.5 bg-slate-900 text-red-500 hover:bg-red-500/10 border border-slate-800 rounded-lg transition"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: COMPTES TALENT (EXISTING USERS CONTROL) */}
              {activeTab === "users" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-950 border border-slate-900 p-4 rounded-2xl">
                    <div className="relative w-full sm:max-w-md">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Chercher artiste, e-mail, téléphone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#101424] border border-slate-850  focus:border-amber-500 outline-none rounded-xl py-2 pl-9 pr-4 text-xs font-medium placeholder-slate-500 text-white transition-all font-mono"
                      />
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto text-[10px] w-full sm:w-auto">
                      {["all", "musicien", "client", "certified", "suspended"].map((r) => (
                        <button
                          key={r}
                          onClick={() => setUserRoleFilter(r)}
                          className={`px-3 py-1.5 rounded-lg font-black uppercase transition shrink-0 ${userRoleFilter === r ? "bg-amber-400 text-[#070913] font-black" : "bg-slate-900 text-slate-400 hover:text-white"}`}
                        >
                          {r === "all" ? "Tous" : r === "certified" ? "Certifiés ⭐" : r === "suspended" ? "Suspendus" : r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 bg-[#0c1020] text-slate-500 text-[10px] uppercase font-mono tracking-widest">
                          <th className="p-4">Identité Talent</th>
                          <th className="p-4">Rôle</th>
                          <th className="p-4">Solde Digital</th>
                          <th className="p-4">Niveau de Certification</th>
                          <th className="p-4 text-right">Modération Sécurité</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {filteredUsers.map((u) => (
                          <tr key={u.uid} className={`hover:bg-slate-900/40 transition-colors ${u.isSuspended ? "bg-red-950/10 opacity-75" : ""}`}>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={u.avatarUrl || u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`}
                                  alt="avatar" 
                                  className="w-9 h-9 rounded-full object-cover bg-slate-900 border border-slate-800"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <span className="font-extrabold text-slate-100 flex items-center gap-1">
                                    {u.artistName || `${u.firstName} ${u.lastName}`}
                                    {u.isCertified && <span className="text-amber-400">⭐</span>}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono italic">{u.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[8px] tracking-widest font-black uppercase ${u.role === "musicien" ? "bg-blue-500/10 text-sky-400" : "bg-purple-500/10 text-purple-400"}`}>
                                {u.role === "musicien" ? "🎸 Musicien" : "💼 Client"}
                              </span>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-200">
                              {(u.balance ?? 0).toLocaleString()} F
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => handleToggleCertification(u.uid, !!u.isCertified)}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-colors ${u.isCertified ? "bg-amber-400 text-black font-black" : "bg-slate-900 text-slate-500 hover:text-white"}`}
                              >
                                {u.isCertified ? "⭐ Talent Certifié VIP" : "Standard"}
                              </button>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleToggleSuspension(u.uid, !!u.isSuspended)}
                                  className={`p-1.5 rounded-lg border transition ${u.isSuspended ? "bg-red-500/10 border-red-500 text-red-400" : "bg-slate-900 text-slate-500 border-slate-800 hover:border-amber-500/30 hover:text-amber-400"}`}
                                  title={u.isSuspended ? "Débloquer l'artiste" : "Suspendre temporairement l'artiste"}
                                >
                                  {u.isSuspended ? <Check className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm("🚨 VOULEZ-VOUS CONDAMNER ET BANNIR DÉFINITIVEMENT CE PROFIL ? Action irréversible.")) {
                                      await gomboDB.banUserPermanently(u.uid, adminEmail);
                                      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] 👮 BANNISSEMENT DEFINITIF : ${u.email}`, ...prev]);
                                      loadData();
                                    }
                                  }}
                                  className="p-1.5 bg-slate-900 text-slate-600 border border-slate-800 hover:border-red-500 hover:text-red-500 rounded-lg transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: REPORTS & COMPLAINTS MODERATION (EXISTING) */}
              {activeTab === "reports" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredReports.map((rep) => (
                      <div key={rep.id} className="bg-slate-950 border border-slate-900 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-black px-2 py-0.5 rounded tracking-widest uppercase">
                              Contenu Inadéquat
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{new Date(rep.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-mono text-slate-500">Motif dénoncé :</span>
                            <p className="text-xs font-semibold italic text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-850">
                              "{rep.reason}"
                            </p>
                          </div>

                          <div className="text-[10px] font-mono text-slate-500 space-y-1">
                            <p>Signaleur: <span className="text-slate-300">{rep.reporterEmail || "Anonyme"}</span> (UID {rep.reportedBy})</p>
                            <p>Target ID concerné: <span className="text-slate-300 break-all">{rep.contentId}</span></p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-900 flex justify-end gap-2 mt-5">
                          <button
                            onClick={() => handleAuditReport(rep.id, "ignore")}
                            className="px-3 py-1.5 bg-slate-900 text-slate-400 text-[10px] font-black uppercase rounded-lg border border-slate-800 hover:bg-slate-800"
                          >
                            Ignorer
                          </button>
                          <button
                            onClick={() => handleAuditReport(rep.id, "delete", rep.contentId)}
                            className="px-3 py-1.5 bg-red-400 text-black text-[10px] font-black uppercase rounded-lg hover:brightness-110"
                          >
                            Détruire publication
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredReports.length === 0 && (
                      <div className="col-span-full text-center py-24 text-slate-600">
                        <CheckCircle className="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
                        <p className="text-xs font-mono uppercase tracking-widest">Le temple est limpide. Aucun signalement à modérer.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: CONFIGURATION CONFIGS (INTERACTIVE NEW INTEGRATIONS) */}
              {activeTab === "config" && (
                <div className="bg-slate-950 border border-slate-900 p-6 rounded-3xl space-y-6 max-w-2xl">
                  <div className="border-b border-slate-900 pb-3 flex items-center gap-1.5">
                    <Radio className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h3 className="text-xs font-black tracking-widest uppercase text-slate-200">CONFIGURATION SYSTÈME GENERALE</h3>
                      <p className="text-[11px] text-slate-500">Mettez à jour les constantes d'opération à Abidjan et communes d'AFRIGOMBO.</p>
                    </div>
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    
                    {/* Input Alert banner */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alerte de Bannière Système Directe</label>
                      <textarea
                        value={systemAlert}
                        onChange={e => setSystemAlert(e.target.value)}
                        rows={3}
                        className="w-full bg-[#101424] border border-slate-850 rounded-xl p-3 text-slate-200 focus:border-amber-500 outline-none font-sans leading-relaxed"
                        placeholder="Rédigez l'annonce de maintenance ou de message prioritaire..."
                      />
                      <p className="text-[9.5px] text-slate-500">Ce message s'affichera immédiatement sur la page d'accueil de tous les musiciens.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Commission rate */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taux de Commission Gombo (%)</label>
                        <input
                          type="number"
                          value={commissionRate}
                          onChange={e => setCommissionRate(e.target.value)}
                          className="w-full h-10 px-3 bg-[#101424] border border-slate-850 rounded-xl text-slate-100 focus:border-amber-500 outline-none text-xs"
                          min="0"
                          max="50"
                        />
                        <p className="text-[9.5px] text-slate-500">Prélevé sur les cachets payés aux artistes.</p>
                      </div>

                      {/* Mock/Cloud Database mode switch info */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mode Base de Données Actif</label>
                        <div className="h-10 px-3 bg-slate-900 border border-slate-850 rounded-xl text-amber-400 flex items-center justify-between text-xs">
                          <span className="font-bold">{isFirebaseMock ? "MOCK (LOCAL)" : "CLOUD FIRESTORE"}</span>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-[9.5px] text-slate-500">Géré selon les variables de sécurité du container.</p>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveConfig}
                      className="w-full h-11 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg select-none cursor-pointer mt-4"
                    >
                      Enregistrer la Configuration Globale
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
