import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, Users, Film, Radio, Layers, DollarSign, ListFilter, 
  Trash2, ShieldCheck, Ban, Sparkles, BookOpen, AlertOctagon, CheckCircle, 
  X, Search, Award, Grid, Shield, Minimize, RefreshCw, BarChart2, Eye, EyeOff, Activity
} from "lucide-react";
import { gomboDB } from "../firebase";
import { UserProfile, SocialPost, AdminLog } from "../types";

interface AdminCentreProps {
  adminEmail: string;
  adminProfile: UserProfile | null;
  onExitAdminMode: () => void;
}

export default function AdminCentre({ adminEmail, adminProfile, onExitAdminMode }: AdminCentreProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "posts" | "reports" | "logs">("dashboard");
  
  // Data State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [groupsCount, setGroupsCount] = useState<number>(0);
  const [renfortsCount, setRenfortsCount] = useState<number>(0);
  const [payments, setPayments] = useState<any[]>([]);
  const [subscriptionsCount, setSubscriptionsCount] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [reportFilter, setReportFilter] = useState<string>("all");
  
  // Stats Calculations
  const [stats, setStats] = useState({
    totalUsers: 0,
    musicians: 0,
    clients: 0,
    certifiedUsers: 0,
    totalPosts: 0,
    totalGombos: 0,
    totalRevenue: 0,
    paymentsSuccess: 0
  });

  // Load Admin Data on mount / tab change
  const loadData = async () => {
    try {
      setLoading(true);
      const [allUsers, allPosts, allReports, allLogs, allGroups, allRenforts, allPayments, allSubs] = await Promise.all([
        gomboDB.getUsersAdmin(),
        gomboDB.getPostsAdmin(),
        gomboDB.getReportsAdmin(),
        gomboDB.getAdminLogs(),
        gomboDB.getGroupsAdmin(),
        gomboDB.getRenfortsAdmin(),
        gomboDB.getPaymentsAdmin(),
        gomboDB.getSubscriptionsAdmin()
      ]);

      setUsers(allUsers || []);
      setPosts(allPosts || []);
      setReports(allReports || []);
      setLogs(allLogs || []);
      setGroupsCount(allGroups?.length || 0);
      setRenfortsCount(allRenforts?.length || 0);
      setPayments(allPayments || []);
      setSubscriptionsCount(allSubs?.length || 0);

      // Calcul statistics
      const musicianCount = (allUsers || []).filter(u => u.role === "musicien").length;
      const clientCount = (allUsers || []).filter(u => u.role === "client").length;
      const certifiedCount = (allUsers || []).filter(u => u.isCertified || u.verificationStatus === "certifie").length;
      const successPayments = (allPayments || []).filter(p => p.status === "success");
      const rev = successPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

      setStats({
        totalUsers: allUsers?.length || 0,
        musicians: musicianCount,
        clients: clientCount,
        certifiedUsers: certifiedCount,
        totalPosts: allPosts?.length || 0,
        totalGombos: allPosts?.filter(p => p.type === "gombo").length || 0,
        totalRevenue: rev,
        paymentsSuccess: successPayments.length
      });
      setLoading(false);
    } catch (err) {
      console.error("Error loading administration data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Actions handlers
  const handleToggleSuspension = async (uid: string, currentSuspension: boolean) => {
    if (confirm(`Voulez-vous ${currentSuspension ? "réactiver" : "suspendre"} cet utilisateur ?`)) {
      await gomboDB.toggleUserSuspension(uid, !currentSuspension, adminEmail);
      // reload
      loadData();
    }
  };

  const handleToggleCertification = async (uid: string, currentCertified: boolean) => {
    if (confirm(`Voulez-vous ${currentCertified ? "retirer" : "accorder"} le statut de Talent Certifié ⭐ à cet artiste ?`)) {
      await gomboDB.toggleUserCertified(uid, !currentCertified, adminEmail);
      loadData();
    }
  };

  const handleBanPermanently = async (uid: string) => {
    if (confirm("🚨 ATTENTION : Êtes-vous ABSOLUMENT certain de vouloir bannir cet utilisateur définitivement ? Il ne pourra plus participer au Temple du Gombo.")) {
      await gomboDB.banUserPermanently(uid, adminEmail);
      loadData();
    }
  };

  const handleTogglePostVisibility = async (postId: string, currentHidden: boolean) => {
    await gomboDB.togglePostVisibility(postId, !currentHidden, adminEmail);
    loadData();
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm("Voulez-vous supprimer définitivement cette publication d'AFRIGOMBO ?")) {
      await gomboDB.deletePostAdmin(postId, adminEmail);
      loadData();
    }
  };

  const handleAuditReport = async (reportId: string, action: "ignore" | "delete" | "suspend" | "ban", contentId?: string, authorId?: string) => {
    const confirmationMsg = {
      ignore: "Ignorer ce signalement ?",
      delete: "Supprimer définitivement le contenu signalé ?",
      suspend: "Suspendre l'auteur du contenu ?",
      ban: "Bannir définitivement l'auteur du contenu ?"
    }[action];

    if (confirm(confirmationMsg)) {
      await gomboDB.auditReportAction(reportId, action, adminEmail, contentId, authorId);
      loadData();
    }
  };

  // Filters search matching
  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.lastName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.artistName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    if (userRoleFilter === "all") return matchesSearch;
    if (userRoleFilter === "certified") return matchesSearch && (u.isCertified || u.verificationStatus === "certifie");
    if (userRoleFilter === "suspended") return matchesSearch && u.isSuspended;
    return matchesSearch && u.role === userRoleFilter;
  });

  const filteredPosts = posts.filter(p => {
    const matchesSearch = (p.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.caption || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.userName || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredReports = reports.filter(r => {
    if (reportFilter === "all") return true;
    return r.status === reportFilter;
  });

  return (
    <div className="min-h-screen bg-[#070708] text-gray-100 font-sans" id="afrigombo-admin-dashboard-container">
      {/* Premium Admin Header */}
      <div className="border-b border-[#ffd700]/25 bg-black/90 sticky top-0 z-40 backdrop-blur-md px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ffd700] to-[#b39700] flex items-center justify-center shadow-lg shadow-[#ffd700]/10">
              <Shield className="text-black w-5 h-5 font-bold" />
            </div>
            <div>
              <h1 className="text-lg font-bold uppercase tracking-widest text-[#ffd700] flex items-center gap-2">
                AFRIGOMBO <span className="bg-[#ffd700] text-black text-[10px] uppercase font-heavy px-1.5 py-0.5 rounded">ADMIN CO-PILOT</span>
              </h1>
              <p className="text-xs text-gray-400">Super Administrator: {adminEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => loadData()}
              className="p-2 border border-gray-800 hover:border-[#ffd700]/30 rounded-xl transition text-gray-400 hover:text-[#ffd700]"
              title="Rafraîchir"
            >
              <RefreshCw className="w-4 h-4 animate-spin-hover" />
            </button>
            <button
              onClick={onExitAdminMode}
              className="px-4 py-2 bg-gradient-to-r from-[#ffd700] to-[#d4af37] text-black font-semibold text-xs rounded-xl hover:shadow-lg hover:shadow-[#ffd700]/15 hover:scale-[1.02] transform transition duration-200"
            >
              Passer en mode utilisateur 👤
            </button>
          </div>
        </div>
      </div>

      {/* Admin Welcome & Command Center Motivation Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="relative overflow-hidden bg-gradient-to-r from-gray-950 via-[#101014] to-gray-950 border border-yellow-500/20 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 justify-between shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-b from-[#ffd700]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-3 z-10">
            <div className="flex items-center gap-2 text-xs text-[#ffd700]/80 font-semibold tracking-wider uppercase">
              <Sparkles className="w-4 h-4 text-[#ffd700] shrink-0" />
              SÉCURITÉ & PROSPÉRITÉ MUSICALE
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              👑 Bienvenue dans le Centre de Commande AFRIGOMBO
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed max-w-4xl">
              Vous pilotez le Temple du Gombo Musical. Vos décisions protègent la communauté, sécurisent les opportunités et façonnent l'avenir des artistes africains.
            </p>
          </div>
          <div className="shrink-0 z-10">
            <div className="p-4 bg-black/60 border border-gray-800 rounded-2xl text-center">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">Streak Moyen</p>
              <p className="text-2xl font-black text-[#ffd700]">5.0 🔥</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#101012] border border-gray-900 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Utilisateurs</p>
              <p className="text-lg font-bold text-white">{stats.totalUsers}</p>
              <p className="text-[10px] text-gray-500">{stats.musicians} Mus / {stats.clients} Cli</p>
            </div>
          </div>

          <div className="bg-[#101012] border border-gray-900 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#ffd700]/10 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-[#ffd700]" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Talents Certifiés</p>
              <p className="text-lg font-bold text-[#ffd700]">{stats.certifiedUsers}</p>
              <p className="text-[10px] text-gray-500">{groupsCount} Groupes VIPs</p>
            </div>
          </div>

          <div className="bg-[#101012] border border-gray-900 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Publications</p>
              <p className="text-lg font-bold text-white">{stats.totalPosts}</p>
              <p className="text-[10px] text-gray-500">{stats.totalGombos} Gombos / {renfortsCount} Renforts</p>
            </div>
          </div>

          <div className="bg-[#101012] border border-gray-900 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Monétisation</p>
              <p className="text-lg font-bold text-emerald-400">{stats.totalRevenue.toLocaleString()} F</p>
              <p className="text-[10px] text-gray-500">{subscriptionsCount} abonnements / {stats.paymentsSuccess} Pay</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex overflow-x-auto gap-2 bg-black/40 border border-gray-950 p-1 rounded-2xl scrollbar-none">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl shrink-0 transition flex items-center gap-2 ${activeTab === "dashboard" ? "bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/30" : "text-gray-400 hover:text-white"}`}
          >
            <Grid className="w-4 h-4" /> Centre de Commande
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl shrink-0 transition flex items-center gap-2 ${activeTab === "users" ? "bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/30" : "text-gray-400 hover:text-white"}`}
          >
            <Users className="w-4 h-4" /> Artistes & Clients ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl shrink-0 transition flex items-center gap-2 ${activeTab === "posts" ? "bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/30" : "text-gray-400 hover:text-white"}`}
          >
            <Film className="w-4 h-4" /> Publications ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl shrink-0 transition flex items-center gap-2 relative ${activeTab === "reports" ? "bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/30" : "text-gray-400 hover:text-white"}`}
          >
            <AlertOctagon className="w-4 h-4 text-rose-500" /> Signalements 
            {reports.filter(r => r.status === "pending").length > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl shrink-0 transition flex items-center gap-2 ${activeTab === "logs" ? "bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/30" : "text-gray-400 hover:text-white"}`}
          >
            <Activity className="w-4 h-4 text-yellow-500" /> Historique Audits
          </button>
        </div>
      </div>

      {/* Main Admin Contents */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="w-8 h-8 text-[#ffd700] animate-spin" />
              <p className="text-xs text-gray-500 tracking-widest uppercase font-mono">Chargement des données de contrôle...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* TAB 1: DASHBOARD STATS */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  {/* Real-time Custom premium analytics graphics */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Growth Analytics Card */}
                    <div className="lg:col-span-2 bg-[#101014] border border-gray-900 rounded-3xl p-6 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-[#ffd700]" />
                          <h3 className="text-sm font-bold tracking-wider uppercase text-gray-200">Croissance des Inscriptions</h3>
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase font-mono">Derniers 30 jours</span>
                      </div>
                      
                      {/* Interactive Geometric SVG Line/Bar chart representation */}
                      <div className="h-56 w-full flex items-end justify-between px-2 pt-6 relative border-b border-gray-900">
                        {/* Styled custom geometric SVG charting lines */}
                        <svg className="absolute inset-0 w-full h-full p-4 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <path d="M 0 90 Q 25 60 50 45 T 100 20" fill="none" stroke="rgba(255, 215, 0, 0.4)" strokeWidth="1.5" />
                          <path d="M 0 90 Q 25 70 50 50 T 100 35" fill="none" stroke="rgba(255, 215, 0, 0.15)" strokeWidth="1" />
                        </svg>

                        {/* Bar nodes representatives */}
                        {[
                          { l: "Jan", val: 50 }, { l: "Feb", val: 70 }, 
                          { l: "Mar", val: 120 }, { l: "Apr", val: 160 }, 
                          { l: "May", val: 240 }, { l: "Jun", val: 320 }
                        ].map((node, i) => (
                          <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer z-10 w-1/6">
                            <span className="opacity-0 group-hover:opacity-100 transition duration-150 text-[10px] bg-black text-[#ffd700] border border-yellow-500/20 px-1.5 py-0.5 rounded font-mono">
                              +{node.val}
                            </span>
                            <div 
                              className="w-4 sm:w-6 bg-gradient-to-t from-[#ffd700]/20 to-[#ffd700] rounded-t-sm transition-all duration-300 hover:scale-x-110"
                              style={{ height: `${(node.val / 320) * 120}px` }}
                            />
                            <span className="text-[9px] text-gray-500 uppercase font-mono">{node.l}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick overview widget of critical action logs */}
                    <div className="bg-[#101014] border border-gray-900 rounded-3xl p-6 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#ffd700]" />
                          <h3 className="text-sm font-bold tracking-wider uppercase text-gray-200">Alertes Militantes</h3>
                        </div>
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-2 scrollbar-none">
                          {reports.filter(r => r.status === "pending").map((rep, idx) => (
                            <div key={idx} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-extrabold uppercase text-rose-400">Contenu Signalé 🛡️</span>
                                <span className="text-[9px] text-gray-500 font-mono">{new Date(rep.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-xs text-gray-300 font-medium line-clamp-1">{rep.reason}</p>
                              <p className="text-[9px] text-gray-500">Par {rep.reporterEmail}</p>
                            </div>
                          ))}
                          {reports.filter(r => r.status === "pending").length === 0 && (
                            <div className="text-center py-6 text-gray-600">
                              <CheckCircle className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                              <p className="text-xs font-mono uppercase">Aucun signalement actif</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-900/60 mt-4 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Total Résolus:</span>
                        <span className="text-xs text-emerald-400 font-bold">{reports.filter(r => r.status === "resolved").length} résolus</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational indicators details tables inside Command Center summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#101012] border border-gray-900 rounded-2xl p-4">
                      <p className="text-[10px] uppercase font-mono text-gray-500 tracking-wider">REVENU TOUT LE TEMPS</p>
                      <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">{(stats.totalRevenue).toLocaleString()} F CFA</p>
                      <p className="text-xs text-gray-400 mt-2">Dépôts Moov / Orange / MTN réalisés avec succès</p>
                    </div>

                    <div className="bg-[#101012] border border-gray-900 rounded-2xl p-4">
                      <p className="text-[10px] uppercase font-mono text-gray-500 tracking-wider">PROFIL MOBILISÉ</p>
                      <p className="text-2xl font-bold text-white mt-1">{(stats.totalUsers > 0 ? (stats.certifiedUsers / stats.totalUsers) * 100 : 0).toFixed(1)}%</p>
                      <p className="text-xs text-gray-400 mt-2">Taux d'artistes en Côte d'Ivoire certifiés</p>
                    </div>

                    <div className="bg-[#101012] border border-gray-900 rounded-2xl p-4">
                      <p className="text-[10px] uppercase font-mono text-gray-500 tracking-wider">COMMUNAUTÉ GOMBO</p>
                      <p className="text-2xl font-bold text-[#ffd700] mt-1">{stats.totalGombos + renfortsCount} Opportunités</p>
                      <p className="text-xs text-gray-400 mt-2">Près de chez vous à Abidjan et communes</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: UTILISATEURS */}
              {activeTab === "users" && (
                <div className="space-y-4">
                  {/* Controls filters */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-[#0d0d0f] border border-gray-900 p-4 rounded-2xl">
                    <div className="relative w-full sm:max-w-md">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Rechercher par nom, email, artiste..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#151517] border border-gray-800 focus:border-[#ffd700]/50 outline-none rounded-xl py-2 pl-9 pr-4 text-xs font-medium placeholder-gray-500 text-white transition-all"
                      />
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto text-xs">
                      {["all", "musicien", "client", "certified", "suspended"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setUserRoleFilter(tab)}
                          className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 uppercase tracking-wider text-[10px] transition ${userRoleFilter === tab ? "bg-[#ffd700] text-black" : "bg-[#151517] border border-gray-800 text-gray-400 hover:text-white"}`}
                        >
                          {tab === "all" ? "Tous" : tab === "certified" ? "Certifiés ⭐" : tab === "suspended" ? "Suspendus" : tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Users Admin List Table */}
                  <div className="bg-[#0c0c0f] border border-gray-950 rounded-2xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-900 bg-black/60 text-gray-400 text-[10px] uppercase font-mono tracking-wider">
                          <th className="p-4">Artiste / Propriétaire</th>
                          <th className="p-4">Rôle Système</th>
                          <th className="p-4">Commune / WhatsApp</th>
                          <th className="p-4">Certification</th>
                          <th className="p-4 text-right">Actions de Modération</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-900/60">
                        {filteredUsers.map((u) => (
                          <tr key={u.uid} className={`hover:bg-gray-900/30 transition-colors ${u.isSuspended ? "bg-rose-950/10 opacity-75" : ""}`}>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={u.avatarUrl || u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`}
                                  alt="avatar" 
                                  className="w-9 h-9 rounded-full object-cover bg-gray-800 border-2 border-gray-900 shadow-md referrerPolicy='no-referrer'"
                                />
                                <div className="space-y-0.5">
                                  <p className="font-bold text-white flex items-center gap-1">
                                    {u.artistName || `${u.firstName} ${u.lastName}`}
                                    {u.isCertified && <span className="text-[#ffd700]" title="Artiste Certifié">⭐</span>}
                                  </p>
                                  <p className="text-[10px] text-gray-500 font-mono">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest ${u.role === "musicien" ? "bg-blue-500/10 text-blue-400" : u.role === "client" ? "bg-purple-500/10 text-purple-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4 font-medium text-gray-300">
                              <p className="text-gray-300">{u.commune || "Abidjan"}</p>
                              <p className="text-[10px] text-gray-500">{u.whatsapp || u.phone}</p>
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => handleToggleCertification(u.uid, !!u.isCertified)}
                                className={`px-2.5 py-1 rounded-lg font-mono text-[9px] font-bold uppercase transition flex items-center gap-1 ${u.isCertified ? "bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/30" : "bg-gray-900/60 text-gray-500 hover:text-white"}`}
                              >
                                {u.isCertified ? "⭐ CERTIFIÉ" : "standard"}
                              </button>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleToggleSuspension(u.uid, !!u.isSuspended)}
                                  className={`p-1.5 rounded-lg transition ${u.isSuspended ? "bg-amber-500/20 text-amber-400 tooltip" : "bg-gray-900 text-gray-400 hover:text-amber-400 hover:bg-amber-400/5"}`}
                                  title={u.isSuspended ? "Réactiver l'utilisateur" : "Suspendre l'utilisateur (blocage)"}
                                >
                                  {u.isSuspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => handleBanPermanently(u.uid)}
                                  className="p-1.5 bg-gray-900 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                                  title="Bannir définitivement s'il y a abus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-10 text-gray-600 uppercase font-mono">Aucun utilisateur correspondant à votre recherche.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: PUBLICATIONS */}
              {activeTab === "posts" && (
                <div className="space-y-4">
                  {/* Controls filters */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-[#0d0d0f] border border-gray-900 p-4 rounded-2xl">
                    <div className="relative w-full sm:max-w-md">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Rechercher par titre, auteur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#151517] border border-gray-800 focus:border-[#ffd700]/50 outline-none rounded-xl py-2 pl-9 pr-4 text-xs font-medium placeholder-gray-500 text-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Publications Admin List Table */}
                  <div className="bg-[#0c0c0f] border border-gray-950 rounded-2xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-900 bg-black/60 text-gray-400 text-[10px] uppercase font-mono tracking-wider">
                          <th className="p-4">Publication / Détails</th>
                          <th className="p-4">Auteur</th>
                          <th className="p-4">Catégorie</th>
                          <th className="p-4">Engagement</th>
                          <th className="p-4 text-right">Actions Admin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-900/60">
                        {filteredPosts.map((p) => {
                          const isHidden = (p as any).isHidden;
                          return (
                            <tr key={p.id} className={`hover:bg-gray-900/30 transition-colors ${isHidden ? "bg-gray-950/80 opacity-50" : ""}`}>
                              <td className="p-4">
                                <div className="space-y-1 max-w-sm sm:max-w-md">
                                  <p className="font-bold text-white leading-snug">{p.title || p.caption.slice(0, 30)}</p>
                                  <p className="text-[10px] text-gray-400 line-clamp-2">{p.caption}</p>
                                  <p className="text-[9px] text-gray-500 font-mono">{new Date(p.createdAt).toLocaleDateString()}</p>
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="font-bold text-gray-300">{p.userName}</p>
                                <p className="text-[9px] text-gray-500 font-mono">{p.userId}</p>
                              </td>
                              <td className="p-4 uppercase">
                                <span className="bg-yellow-500/10 text-[#ffd700] px-1.5 py-0.5 rounded text-[8px] tracking-wider font-extrabold">
                                  {p.type || p.postCategory || "démo"}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-gray-400">
                                <p>❤️ {p.likesCount || 0} Likes</p>
                                <p>💬 {p.comments?.length || p.commentsCount || 0} Coms</p>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleTogglePostVisibility(p.id, !!isHidden)}
                                    className={`p-1.5 rounded-lg transition ${isHidden ? "bg-yellow-500/15 text-yellow-500" : "bg-gray-900 text-gray-400 hover:text-white"}`}
                                    title={isHidden ? "Restaurer la visibilité publique" : "Masquer temporairement de la vue des membres"}
                                  >
                                    {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                  <button
                                    onClick={() => handleDeletePost(p.id)}
                                    className="p-1.5 bg-gray-900 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                                    title="Détruire définitivement la publication"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredPosts.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-10 text-gray-600 uppercase font-mono">Aucune publication correspondante.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: SIGNALEMENTS */}
              {activeTab === "reports" && (
                <div className="space-y-4">
                  {/* Filter tabs */}
                  <div className="flex overflow-x-auto gap-2 bg-[#0d0d0f] border border-gray-900 p-2 rounded-2xl justify-between items-center">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReportFilter("all")}
                        className={`px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-lg transition ${reportFilter === "all" ? "bg-rose-500 text-white" : "text-gray-400 hover:text-white"}`}
                      >
                        TOUS
                      </button>
                      <button
                        onClick={() => setReportFilter("pending")}
                        className={`px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-lg transition ${reportFilter === "pending" ? "bg-rose-500 text-white" : "text-gray-400 hover:text-white"}`}
                      >
                        A MODÉRER NOW 🛡️
                      </button>
                      <button
                        onClick={() => setReportFilter("resolved")}
                        className={`px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-lg transition ${reportFilter === "resolved" ? "bg-rose-500 text-white" : "text-gray-400 hover:text-white"}`}
                      >
                        RÉSOLUS
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono hidden sm:inline-block">DÉCISION DU JUGE DU GOMBO</span>
                  </div>

                  {/* Signalement moderations cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredReports.map((rep) => (
                      <div 
                        key={rep.id} 
                        className={`p-5 rounded-3xl border transition shadow-lg relative overflow-hidden flex flex-col justify-between ${rep.status === "pending" ? "bg-[#181012] border-rose-500/20 shadow-rose-950/5" : "bg-[#0b0c0d] border-gray-900 opacity-70"}`}
                      >
                        {rep.status === "pending" && (
                          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full pointer-events-none blur-xl" />
                        )}

                        <div className="space-y-3 z-10">
                          <div className="flex justify-between items-center">
                            <span className={`px-2.5 py-0.5 rounded text-[8px] font-heavy uppercase font-extrabold tracking-widest ${rep.status === "pending" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-gray-800 text-gray-500"}`}>
                              {rep.status === "pending" ? "A modérer" : rep.status}
                            </span>
                            <span className="text-[9px] text-gray-500 font-mono">{new Date(rep.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-xs text-gray-400 font-mono uppercase tracking-widest">Type / Cible</h4>
                            <p className="text-sm font-bold text-white flex items-center gap-1.5">
                              <ShieldAlert className="w-4 h-4 text-rose-500shrink-0" />
                              {rep.contentType === "post" ? "Publication" : rep.contentType} : {rep.contentTitle || rep.contentId}
                            </p>
                          </div>

                          <div className="space-y-1 bg-black/40 border border-gray-950/60 p-3 rounded-xl">
                            <h4 className="text-[9px] text-rose-400 font-mono uppercase tracking-widest">Motif du Signalement</h4>
                            <p className="text-xs text-gray-200 leading-relaxed font-semibold italic">"{rep.reason}"</p>
                          </div>

                          <div className="text-[9px] text-gray-500 space-y-0.5 font-mono">
                            <p>Signaleur: <span className="text-gray-400">{rep.reporterEmail || "Anonyme"}</span> (UID {rep.reportedBy})</p>
                            <p>ID Post concerné: <span className="text-gray-400">{rep.contentId}</span></p>
                            {rep.authorId && <p>Auteur ID: <span className="text-gray-400">{rep.authorId}</span></p>}
                          </div>
                        </div>

                        {rep.status === "pending" && (
                          <div className="pt-4 border-t border-gray-950 flex flex-col sm:flex-row gap-2 justify-end mt-4 z-10">
                            <button
                              onClick={() => handleAuditReport(rep.id, "ignore")}
                              className="px-3 py-1.5 bg-gray-900 border border-gray-800 text-gray-400 text-[10px] font-heavy uppercase rounded-lg hover:text-white hover:bg-gray-800 transition"
                            >
                              Ignorer 
                            </button>
                            <button
                              onClick={() => handleAuditReport(rep.id, "delete", rep.contentId)}
                              className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-heavy uppercase rounded-lg hover:bg-rose-500 hover:text-black transition"
                              title="Detruire le contenu"
                            >
                              Supprimer le gombo
                            </button>
                            {rep.authorId && (
                              <>
                                <button
                                  onClick={() => handleAuditReport(rep.id, "suspend", undefined, rep.authorId)}
                                  className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-heavy uppercase rounded-lg hover:bg-amber-500 hover:text-black transition"
                                  title="Suspendre l'auteur du post"
                                >
                                  Bloquer auteur
                                </button>
                                <button
                                  onClick={() => handleAuditReport(rep.id, "ban", undefined, rep.authorId)}
                                  className="px-3 py-1.5 bg-black text-rose-500 border border-rose-900/50 text-[10px] font-heavy uppercase rounded-lg hover:bg-rose-600 hover:text-white transition"
                                  title="Bannir définitivement l'auteur"
                                >
                                  Bannir auteur
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredReports.length === 0 && (
                      <div className="col-span-full text-center py-20 text-gray-600">
                        <CheckCircle className="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
                        <p className="text-xs uppercase font-mono tracking-widest">Le Temple est sain. Aucun signalement en attente !</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: AUDIT LOGS */}
              {activeTab === "logs" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h3 className="text-xs text-gray-400 font-mono uppercase tracking-widest">Registre d'activités administratives d'AFRIGOMBO</h3>
                    <span className="text-[10px] bg-yellow-500/10 text-[#ffd700] px-2 py-0.5 rounded font-mono uppercase">IMMUABLE</span>
                  </div>

                  {/* Logs Table */}
                  <div className="bg-[#0b0b0d] border border-gray-950 rounded-2xl overflow-hidden">
                    <div className="max-h-96 overflow-y-auto w-full">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-900 bg-black/60 text-gray-400 text-[10px] uppercase font-mono tracking-wider sticky top-0">
                            <th className="p-4">Administrateur</th>
                            <th className="p-4">Action</th>
                            <th className="p-4">Target ID concerné</th>
                            <th className="p-4 text-right">Horodatage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-900/60 font-mono text-gray-300">
                          {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-900/20 transition-colors">
                              <td className="p-4 text-gray-400">{log.adminEmail}</td>
                              <td className="p-4 font-bold">
                                <span className={`px-2 py-0.5 rounded text-[9px] inline-block ${log.action.includes("DELETE") || log.action.includes("BAN") ? "bg-rose-500/10 text-rose-400" : log.action.includes("SUSPEND") ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-4 text-gray-500 text-[11px] truncate max-w-[150px]">{log.targetId}</td>
                              <td className="p-4 text-right text-gray-500 text-[10px]">{new Date(log.createdAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
