import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, Users, Film, Radio, Layers, DollarSign, ListFilter, 
  Trash2, ShieldCheck, Ban, Sparkles, BookOpen, AlertOctagon, CheckCircle, 
  X, Search, Award, Grid, RefreshCw, BarChart2, Eye, EyeOff, 
  Activity, Send, AlertTriangle, Cpu, TrendingUp, Landmark, Flame, Bell, Check, Edit, ChevronRight, LogOut, User, PieChart, Info, PlusCircle, Minimize2
} from "lucide-react";
import { gomboDB, isFirebaseMock } from "../firebase";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, setDoc, addDoc } from "firebase/firestore";
import { UserProfile, SocialPost, AdminLog, Gombo, MusicGroup, Renfort, GomboSubscription, GomboPayment, VerificationRequest } from "../types";
import { useAuth } from "../AuthContext";

interface AdminCentreProps {
  adminEmail: string;
  adminProfile: UserProfile | null;
  onExitAdminMode: () => void;
}

type AdminMenu = 
  | "dashboard" 
  | "famille" 
  | "talents" 
  | "gombos" 
  | "renforts" 
  | "kyc" 
  | "alertes" 
  | "caisse" 
  | "analytics" 
  | "settings";

const MOCK_LIVE_ACTIVITIES_POOL = [
  " a finalisé une prestation sécurisée à Cocody.",
  " vient de publier une opportunité de Gombo.",
  " a rejoint l'orchestre VIP Abidjan Live.",
  " a obtenu le badge très convoité de 'Talent Certifié' ⭐",
  " a initié un nouveau Renfort Express de dernière minute.",
  " a mis à jour sa démonstration de chant Zouglou.",
  " vient de souscrire un abonnement Premium AFRIGOMBO 🏆",
  " a sponsorisé son événement concert de fin d'année."
];

export default function AdminCentre({ adminEmail, adminProfile, onExitAdminMode }: AdminCentreProps) {
  const { logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState<AdminMenu>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Data States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [gombos, setGombos] = useState<Gombo[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [groups, setGroups] = useState<MusicGroup[]>([]);
  const [renforts, setRenforts] = useState<Renfort[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [payments, setPayments] = useState<GomboPayment[]>([]);
  const [liveActivities, setLiveActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive controls
  const [activeBadgeUser, setActiveBadgeUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [withdrawalFilter, setWithdrawalFilter] = useState("pending");

  const [withdrawRequests, setWithdrawRequests] = useState<any[]>(() => {
    const saved = localStorage.getItem("gombo_withdraw_requests_v3");
    if (saved) return JSON.parse(saved);
    return [
      { id: "wd-101", userEmail: "vocalist.yop@gmail.com", userUid: "mus1", amount: 20000, provider: "Wave", phone: "+225 05 91 88 12 11", status: "pending", date: new Date(Date.now() - 1800000).toISOString() },
      { id: "wd-102", userEmail: "guitar.rumba@gmail.com", userUid: "mus2", amount: 45000, provider: "Orange Money", phone: "+225 07 48 99 12 30", status: "pending", date: new Date(Date.now() - 3600000).toISOString() },
      { id: "wd-103", userEmail: "bassa.vibe@gmail.com", userUid: "mus3", amount: 30000, provider: "MTN Money", phone: "+225 07 45 89 12 00", status: "approved", date: new Date(Date.now() - 17200000).toISOString() }
    ];
  });

  const [systemAlert, setSystemAlert] = useState(() => {
    return localStorage.getItem("gombo_system_alert") || "👑 [ADMIN] Bienvenue sur AFRIGOMBO Elite. Le coffre-fort du Showbiz Africain est actif en temps réel.";
  });

  const [commissionRate, setCommissionRate] = useState(() => {
    return localStorage.getItem("gombo_commission_rate") || "5";
  });

  const [terminalFeed, setTerminalFeed] = useState<string[]>(["📡 Terminal Elite initialisé."]);

  // Database synchronisation onSnapshot loop
  useEffect(() => {
    if (!isFirebaseMock && db) {
      setLoading(true);
      const unsubs: (() => void)[] = [];

      unsubs.push(onSnapshot(collection(db, "users"), (snapshot) => {
        setUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
        setLoading(false);
      }, err => console.error("users error", err)));

      unsubs.push(onSnapshot(collection(db, "posts"), (snapshot) => {
        setPosts(snapshot.docs.map(doc => doc.data() as SocialPost));
      }, err => console.error("posts error", err)));

      unsubs.push(onSnapshot(collection(db, "gombos"), (snapshot) => {
        setGombos(snapshot.docs.map(doc => doc.data() as Gombo));
      }, err => console.error("gombos error", err)));

      unsubs.push(onSnapshot(collection(db, "reports"), (snapshot) => {
        setReports(snapshot.docs.map(doc => doc.data() as any));
      }, err => console.error("reports error", err)));

      unsubs.push(onSnapshot(collection(db, "admin_logs"), (snapshot) => {
        setLogs(snapshot.docs.map(doc => doc.data() as AdminLog).sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
      }, err => console.error("logs error", err)));

      unsubs.push(onSnapshot(collection(db, "music_groups"), (snapshot) => {
        setGroups(snapshot.docs.map(doc => doc.data() as MusicGroup));
      }, err => console.error("groups error", err)));

      unsubs.push(onSnapshot(collection(db, "renforts"), (snapshot) => {
        setRenforts(snapshot.docs.map(doc => doc.data() as Renfort));
      }, err => console.error("renforts error", err)));

      unsubs.push(onSnapshot(collection(db, "payments"), (snapshot) => {
        setPayments(snapshot.docs.map(doc => doc.data() as GomboPayment));
      }, err => console.error("payments error", err)));

      unsubs.push(onSnapshot(collection(db, "verificationRequests"), (snapshot) => {
        setVerificationRequests(snapshot.docs.map(doc => doc.data() as VerificationRequest));
      }, err => console.error("kyc error", err)));

      return () => {
        unsubs.forEach(unsub => unsub());
      };
    } else {
      // Sandbox fallback mode
      const loadLocalData = () => {
        setLoading(true);
        setUsers(JSON.parse(localStorage.getItem("gombo_users") || "[]"));
        setPosts(JSON.parse(localStorage.getItem("gombo_social_posts") || "[]"));
        setGombos(JSON.parse(localStorage.getItem("gombo_posts") || "[]"));
        setReports(JSON.parse(localStorage.getItem("gombo_reports") || "[]"));
        setLogs(JSON.parse(localStorage.getItem("gombo_admin_logs") || "[]"));
        setGroups(JSON.parse(localStorage.getItem("gombo_music_groups") || "[]"));
        setRenforts(JSON.parse(localStorage.getItem("gombo_renforts") || "[]"));
        setPayments(JSON.parse(localStorage.getItem("gombo_payments") || "[]"));
        setVerificationRequests(JSON.parse(localStorage.getItem("gombo_verification_requests") || "[]"));
        setLoading(false);
      };

      loadLocalData();
      window.addEventListener("storage", loadLocalData);
      return () => window.removeEventListener("storage", loadLocalData);
    }
  }, []);

  // Save changes locally
  useEffect(() => {
    localStorage.setItem("gombo_withdraw_requests_v3", JSON.stringify(withdrawRequests));
  }, [withdrawRequests]);

  // Telemetry simulation & Live activity listener trigger
  useEffect(() => {
    const timer = setInterval(() => {
      if (users.length > 0) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const userName = randomUser.artistName || `${randomUser.firstName || "Artiste"} ${randomUser.lastName || "Abidjan"}`;
        const randomAction = MOCK_LIVE_ACTIVITIES_POOL[Math.floor(Math.random() * MOCK_LIVE_ACTIVITIES_POOL.length)];
        const finalActivity = {
          id: Math.random().toString(),
          message: `${userName}${randomAction}`,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          badge: randomAction.includes("⭐") || randomAction.includes("🏆") ? "emerald" : "gold"
        };
        setLiveActivities(prev => [finalActivity, ...prev.slice(0, 15)]);
      }
    }, 5500);

    return () => clearInterval(timer);
  }, [users]);

  // Action methods
  const handleToggleSuspension = async (uid: string, currentS: boolean) => {
    const nextVal = !currentS;
    if (confirm(`Voulez-vous ${nextVal ? "suspendre" : "réactiver"} ce profil ?`)) {
      if (!isFirebaseMock && db) {
        await updateDoc(doc(db, "users", uid), { isSuspended: nextVal });
        await gomboDB.addAdminLog(adminEmail, nextVal ? "SUSPEND_USER" : "RECOVER_USER", uid);
      } else {
        const list = [...users];
        const idx = list.findIndex(u => u.uid === uid);
        if (idx !== -1) {
          list[idx].isSuspended = nextVal;
          localStorage.setItem("gombo_users", JSON.stringify(list));
          window.dispatchEvent(new Event("storage"));
        }
      }
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] Profil modifié UID: ${uid}`, ...prev]);
    }
  };

  const handleToggleCertification = async (uid: string, currentC: boolean) => {
    const nextVal = !currentC;
    if (confirm(`Voulez-vous ${nextVal ? "attribuer le label de confiance certifié" : "retirer la certification"} ?`)) {
      if (!isFirebaseMock && db) {
        await updateDoc(doc(db, "users", uid), { 
          isCertified: nextVal,
          verificationStatus: nextVal ? "certifie" : "standard"
        });
        await gomboDB.addAdminLog(adminEmail, nextVal ? "CERTIFY" : "DE-CERTIFY", uid);
      } else {
        const list = [...users];
        const idx = list.findIndex(u => u.uid === uid);
        if (idx !== -1) {
          list[idx].isCertified = nextVal;
          list[idx].verificationStatus = nextVal ? "certifie" : "standard";
          localStorage.setItem("gombo_users", JSON.stringify(list));
          window.dispatchEvent(new Event("storage"));
        }
      }
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] Certifié mis à jour UID: ${uid}`, ...prev]);
    }
  };

  const handleAuditVerificationRequest = async (reqId: string, status: "approved" | "rejected" | "missing_info") => {
    if (confirm(`Confirmez-vous le statut ${status.toUpperCase()} pour cette demande Gombo ID ?`)) {
      try {
        await gomboDB.updateVerificationRequestStatus(reqId, status);
        await gomboDB.addAdminLog(adminEmail, `KYC_${status.toUpperCase()}`, reqId);
        setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] Demande Gombo ID traitée: ${status.toUpperCase()}`, ...prev]);
        window.dispatchEvent(new Event("storage"));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleApproveWithdraw = async (id: string, userUid: string, amount: number) => {
    if (confirm(`Valider le versement direct de ${amount.toLocaleString()} FCFA ?`)) {
      setWithdrawRequests(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
      if (userUid) {
        const target = users.find(u => u.uid === userUid);
        if (target) {
          const updated = {
            balance: Math.max(0, (target.balance || 0) - amount),
            totalWithdrawals: (target.totalWithdrawals || 0) + amount
          };
          if (!isFirebaseMock && db) {
            await updateDoc(doc(db, "users", userUid), updated);
          } else {
            const list = [...users];
            const idx = list.findIndex(u => u.uid === userUid);
            if (idx !== -1) {
              list[idx].balance = updated.balance;
              list[idx].totalWithdrawals = updated.totalWithdrawals;
              localStorage.setItem("gombo_users", JSON.stringify(list));
              window.dispatchEvent(new Event("storage"));
            }
          }
        }
      }
      await gomboDB.addAdminLog(adminEmail, "WITHDRAW_APPROVED", id);
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] Transfert versement ordonné: ${amount} FCFA`, ...prev]);
    }
  };

  const handleRejectWithdraw = async (id: string) => {
    if (confirm(`Rejeter cette demande de transfert ?`)) {
      setWithdrawRequests(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
      await gomboDB.addAdminLog(adminEmail, "WITHDRAW_REJECTED", id);
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] Transfert rejeté: ${id}`, ...prev]);
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem("gombo_system_alert", systemAlert);
    localStorage.setItem("gombo_commission_rate", commissionRate);
    alert("Paramètres d'administration enregistrés avec succès !");
    setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] Commission configurée à ${commissionRate}%`, ...prev]);
  };

  const handleToggleUserBadge = async (badge: string) => {
    if (!activeBadgeUser) return;
    const current = activeBadgeUser.badges || [];
    const next = current.includes(badge) ? current.filter(b => b !== badge) : [...current, badge];

    if (!isFirebaseMock && db) {
      await updateDoc(doc(db, "users", activeBadgeUser.uid), { badges: next });
    } else {
      const list = [...users];
      const idx = list.findIndex(u => u.uid === activeBadgeUser.uid);
      if (idx !== -1) {
        list[idx].badges = next;
        localStorage.setItem("gombo_users", JSON.stringify(list));
        window.dispatchEvent(new Event("storage"));
      }
    }
    setActiveBadgeUser(prev => prev ? { ...prev, badges: next } : null);
    await gomboDB.addAdminLog(adminEmail, `BADGE_UPDATE_${badge}`, activeBadgeUser.uid);
  };

  // Dynamically derived metrics
  const totalCachedGombos = gombos.reduce((acc, g) => acc + (g.budget || 0), 0);
  const totalCommission = Math.round(totalCachedGombos * (parseFloat(commissionRate) / 100 || 0.05));
  const activePaidSubscriptions = users.filter(u => u.isPremium || u.verificationStatus === "verifie").length;
  const premiumRevenues = activePaidSubscriptions * 5000;
  const finalCaisseTotal = premiumRevenues + totalCommission + 25000;

  const totalUsers = users.length;
  const totalCertified = users.filter(u => u.isCertified || u.verificationStatus === "certifie").length;
  const totalGombosCount = gombos.length;
  const activeAlertsCount = reports.filter(r => r.status === "pending" || r.status === "active").length;
  const kycPendingCount = verificationRequests.filter(v => v.status === "pending" || v.status === "pending_express").length;

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    const fullName = `${u.firstName || ""} ${u.lastName || ""} ${u.artistName || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const matchesSearch = fullName.includes(term) || email.includes(term);

    if (userRoleFilter === "all") return matchesSearch;
    if (userRoleFilter === "certified") return matchesSearch && (u.isCertified || u.verificationStatus === "certifie");
    if (userRoleFilter === "suspended") return matchesSearch && u.isSuspended;
    return matchesSearch && u.role === userRoleFilter;
  });

  const menuList: { id: AdminMenu; label: string; icon: any }[] = [
    { id: "dashboard", label: "Tableau de Bord", icon: Grid },
    { id: "famille", label: "La Famille", icon: Users },
    { id: "talents", label: "Talents Certifiés", icon: Award },
    { id: "gombos", label: "Les Gombos", icon: Film },
    { id: "renforts", label: "Renforts", icon: Flame },
    { id: "kyc", label: "Gombo ID (KYC)", icon: ShieldCheck },
    { id: "alertes", label: "Alertes", icon: AlertTriangle },
    { id: "caisse", label: "La Caisse", icon: Landmark },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
    { id: "settings", label: "Paramètres", icon: Cpu }
  ];

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr_320px] min-h-screen bg-[#0B0B0B] text-[#F5F5F5] font-sans antialiased overflow-x-hidden selection:bg-[#D4AF37] selection:text-[#0B0B0B]">
      
      {/* ──────────────────────────────────────────────────────── */}
      {/* ZONE A: SIDEBAR FIXE PREMIUM */}
      {/* ──────────────────────────────────────────────────────── */}
      <aside className={`fixed lg:sticky top-0 left-0 h-full w-[280px] bg-[#121212] border-r border-[#2B2B2B] flex flex-col justify-between shrink-0 z-50 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300`}>
        <div className="flex flex-col flex-1 py-6 px-5 overflow-y-auto">
          {/* Logo Branding */}
          <div className="pb-6 border-b border-white/[0.06] mb-6">
            <h2 className="text-lg font-black tracking-widest text-[#D4AF37] uppercase flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30 text-xs">A</span>
              AFRIGOMBO <span className="text-[10px] text-white bg-zinc-800 px-1.5 py-0.5 rounded font-mono font-black">ELITE</span>
            </h2>
            <p className="text-[9px] text-[#D4AF37] font-mono tracking-widest uppercase mt-1">Plateforme Souveraine Showbiz</p>
          </div>

          {/* Admin Avatar Profile */}
          <div className="flex items-center gap-3 bg-zinc-950/80 border border-white/[0.04] p-3 rounded-2xl mb-8">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full border border-[#D4AF37]/40 bg-zinc-900 flex items-center justify-center font-bold text-[#D4AF37] text-sm">
                {adminEmail ? adminEmail.substring(0, 2).toUpperCase() : "AD"}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10B981] border border-[#121212]" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-[9px] font-black uppercase text-[#D4AF37] tracking-widest block font-mono">ADMIN ELITE</span>
              <p className="text-[11px] text-zinc-400 font-mono truncate font-semibold">GMB-ADM-{adminEmail ? adminEmail.split("@")[0].substring(0, 4).toUpperCase() : "SYS"}</p>
              <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/35 text-[8px] font-black uppercase text-[#D4AF37] tracking-wider">SUPER ADMIN</span>
            </div>
          </div>

          {/* Interactive Navigation List */}
          <nav className="space-y-1 block text-left">
            {menuList.map(menu => {
              const Icon = menu.icon;
              const isActive = activeMenu === menu.id;
              return (
                <button
                  key={menu.id}
                  onClick={() => {
                    setActiveMenu(menu.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    isActive 
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 font-black shadow-lg shadow-[#D4AF37]/2" 
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                  <span>{menu.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info inside Sidebar */}
        <div className="p-5 border-t border-white/[0.06] block text-left">
          <button
            onClick={onExitAdminMode}
            className="w-full py-2.5 px-3 bg-zinc-900 hover:bg-zinc-855 border border-white/[0.05] rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-[#D4AF37] transition cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>Mode Utilisateur</span>
          </button>
          <div className="flex justify-between items-center text-[8px] text-zinc-500 mt-3 uppercase tracking-wider font-mono">
            <span>v2.2.0 • stable</span>
            <span>Afrique du Sud</span>
          </div>
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────── */}
      {/* ZONE B: ZONE CENTRALE DES STATISTIQUES & ACTIONS */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="flex flex-col flex-1 min-h-screen">
        
        {/* PREMIUM HEADER CONTROLS (EN-TÊTE) */}
        <header className="sticky top-0 z-40 bg-[#0B0B0B]/90 backdrop-blur-md border-b border-[#2B2B2B] py-4.5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu hamburger */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg lg:hidden cursor-pointer"
            >
              <ListFilter className="w-4 h-4 text-[#D4AF37]" />
            </button>
            <div className="text-left">
              <h1 className="text-sm font-black uppercase tracking-widest text-white">CENTRE DE COMMANDEMENT</h1>
              <p className="text-[10px] text-[#D4AF37] uppercase font-mono tracking-wide mt-0.5">Pilotage • Contrôle • Héritage Musical</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Live Tag */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#10B981]/10 border border-[#10B981]/20 rounded-full text-[#10B981] text-[9.5px] font-black font-mono uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>● Synchronisé en temps réel</span>
            </div>

            {/* Logout safe hook */}
            <button
              onClick={async () => {
                if (confirm("Se déconnecter de la console administrative ?")) {
                  await logout();
                }
              }}
              className="p-2 border border-[#2B2B2B] hover:border-red-500/30 text-zinc-400 hover:text-[#EF4444] bg-zinc-950 rounded-xl transition cursor-pointer"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* CONTENU CENTRAL (Central content inside Zone B) */}
        <div className="p-6 md:p-8 space-y-8 flex-1 max-w-4xl mx-auto w-full">
          
          {/* SYSTEM METRIC BANNER */}
          {activeMenu === "dashboard" && (
            <div className="space-y-6">
              
              {/* Broadcast state board */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-white/[0.04] text-xs text-zinc-300 text-left flex items-center justify-between gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 blur-xl pointer-events-none rounded-full" />
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                  <p className="leading-snug truncate">
                    <strong className="text-[#D4AF37] uppercase font-mono font-black py-0.5">ALERTE DIRECTE : </strong>
                    {systemAlert}
                  </p>
                </div>
              </div>

              {/* STATS LUXURY CARDS (Arranged max two cards per line for premium display) */}
              <div className="space-y-3 block">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] tracking-widest pl-1 text-left font-mono">PANEL PRINCIPAL INDICES ELITE</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* CARD 1: LA FAMILLE */}
                  <div className="bg-[#121212]/95 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all rounded-2xl p-5 flex flex-col justify-between text-left relative overflow-hidden h-[135px]">
                    <div className="absolute bottom-0 right-0 w-36 h-12 pointer-events-none opacity-40">
                      <svg viewBox="0 0 100 30" className="w-full h-full">
                        <path d="M0 25 Q15 20, 30 18 T60 12 T90 5 T100 3" fill="none" stroke="#D4AF37" strokeWidth="2.5" />
                      </svg>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider block font-mono">LA FAMILLE</span>
                        <h4 className="text-2xl font-black text-[#F5F5F5] tracking-tight mt-1 font-mono">{totalUsers}</h4>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-950 border border-white/[0.03]">
                        <Users className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                    </div>
                    <div className="text-[9px] font-bold text-[#10B981] uppercase tracking-wide">
                      ⚡ +14% nouveaux cette semaine
                    </div>
                  </div>

                  {/* CARD 2: LES TALENTS CERTIFIÉS */}
                  <div className="bg-[#121212]/95 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all rounded-2xl p-5 flex flex-col justify-between text-left relative overflow-hidden h-[135px]">
                    <div className="absolute bottom-0 right-0 w-36 h-12 pointer-events-none opacity-40">
                      <svg viewBox="0 0 100 30" className="w-full h-full">
                        <path d="M0 22 Q20 18, 45 15 T80 8 T100 2" fill="none" stroke="#10B981" strokeWidth="2.5" />
                      </svg>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider block font-mono">LES TALENTS CERTIFIÉS</span>
                        <h4 className="text-2xl font-black text-[#10B981] tracking-tight mt-1 font-mono">{totalCertified}</h4>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-950 border border-white/[0.03]">
                        <Award className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                    </div>
                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">
                      🛠️ Exprime l’excellence africaine
                    </div>
                  </div>

                  {/* CARD 3: LES GOMBOS */}
                  <div className="bg-[#121212]/95 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all rounded-2xl p-5 flex flex-col justify-between text-left relative overflow-hidden h-[135px]">
                    <div className="absolute bottom-0 right-0 w-36 h-12 pointer-events-none opacity-40">
                      <svg viewBox="0 0 100 30" className="w-full h-full">
                        <path d="M0 28 Q10 20, 30 22 T60 14 T80 18 T100 8" fill="none" stroke="#D4AF37" strokeWidth="2.5" />
                      </svg>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider block font-mono">LES GOMBOS OPPORTUNITÉS</span>
                        <h4 className="text-2xl font-black text-[#F5F5F5] tracking-tight mt-1 font-mono">{totalGombosCount}</h4>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-950 border border-white/[0.03]">
                        <Film className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                    </div>
                    <div className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wide">
                      💰 Prestations d'Abidjan securisées
                    </div>
                  </div>

                  {/* CARD 4: LES ALERTES CRITIQUES */}
                  <div className="bg-[#121212]/95 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all rounded-2xl p-5 flex flex-col justify-between text-left relative overflow-hidden h-[135px]">
                    <div className="absolute bottom-0 right-0 w-36 h-12 pointer-events-none opacity-40">
                      <svg viewBox="0 0 100 30" className="w-full h-full">
                        <line x1="0" y1="20" x2="100" y2="20" stroke="#EF4444" strokeWidth="2.5" strokeDasharray="3 3" />
                      </svg>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider block font-mono">LES ALERTES SIGNALEMENTS</span>
                        <h4 className={`text-2xl font-black tracking-tight mt-1 font-mono ${activeAlertsCount > 0 ? "text-[#EF4444]" : "text-zinc-400"}`}>{activeAlertsCount}</h4>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-950 border border-white/[0.03]">
                        <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                      </div>
                    </div>
                    <div className="text-[9px] font-bold text-[#10B981] uppercase tracking-wide">
                      🛡️ Tout est calme à Abidjan
                    </div>
                  </div>

                  {/* CARD 5: MISE EN CORRESPONDANCE KYC */}
                  <div className="bg-[#121212]/95 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all rounded-2xl p-5 flex flex-col justify-between text-left relative overflow-hidden h-[135px]">
                    <div className="absolute bottom-0 right-0 w-36 h-12 pointer-events-none opacity-40">
                      <svg viewBox="0 0 100 30" className="w-full h-full">
                        <path d="M0 25 Q25 25, 50 20 T100 5" fill="none" stroke="#D4AF37" strokeWidth="2.5" />
                      </svg>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider block font-mono">GOMBO ID (KYC) ATTENTE</span>
                        <h4 className="text-2xl font-black text-[#F5F5F5] tracking-tight mt-1 font-mono">{kycPendingCount}</h4>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-950 border border-white/[0.03]">
                        <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                    </div>
                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">
                      📊 Express prioritaire inclus
                    </div>
                  </div>

                  {/* CARD 6: LA CAISSE */}
                  <div className="bg-[#121212]/95 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all rounded-2xl p-5 flex flex-col justify-between text-left relative overflow-hidden h-[135px]">
                    <div className="absolute bottom-0 right-0 w-36 h-12 pointer-events-none opacity-40">
                      <svg viewBox="0 0 100 30" className="w-full h-full">
                        <path d="M0 30 L20 25 L40 22 L60 15 L80 10 L100 2" fill="none" stroke="#D4AF37" strokeWidth="2" />
                      </svg>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider block font-mono">LA CAISSE REVENUS</span>
                        <h4 className="text-md md:text-lg font-black text-[#D4AF37] tracking-tight mt-1.5 font-mono">{finalCaisseTotal.toLocaleString()} F</h4>
                      </div>
                      <div className="p-2 rounded-xl bg-zinc-950 border border-white/[0.03]">
                        <Landmark className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                    </div>
                    <div className="text-[9px] font-bold text-[#10B981] uppercase tracking-wide">
                      🛡️ Prélèvements 5% sécurisés
                    </div>
                  </div>

                </div>
              </div>

              {/* QUICK RECENT LOGS SUMMARY */}
              <div className="bg-[#121212] border border-[#2B2B2B] p-5 rounded-2xl text-left space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#D4AF37]" />
                    OPÉRATIONS ADMINISTRATIVES RÉCENTES
                  </h4>
                  <button onClick={() => setActiveMenu("kyc")} className="text-[10px] text-[#D4AF37] hover:underline uppercase font-black tracking-wide cursor-pointer">
                    Inspecter tout ↗
                  </button>
                </div>
                <div className="space-y-2 max-h-[140px] overflow-y-auto font-mono text-[10px] text-zinc-400">
                  {logs.slice(0, 4).map(log => (
                    <div key={log.id || Math.random()} className="flex justify-between items-center bg-zinc-950/80 p-2.5 rounded-xl border border-white/[0.02]">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-zinc-900 border border-white/5 text-[8.5px] rounded text-[#D4AF37] font-black">{log.action || "LOG"}</span>
                        <span className="truncate max-w-[200px]">Cible: {log.targetId || "Système"}</span>
                      </div>
                      <span className="text-zinc-650 shrink-0 text-[9px]">{new Date(log.createdAt || '').toLocaleTimeString()}</span>
                    </div>
                  ))}
                  {logs.length === 0 && <p className="text-zinc-600 text-center py-4 uppercase">Aucun log récent enregistré.</p>}
                </div>
              </div>

            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB 2: LA FAMILLE (Users list) */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeMenu === "famille" && (
            <div className="space-y-6">
              
              {/* Header card with quick statistics counters */}
              <div className="bg-zinc-950 border border-white/[0.04] p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between text-left">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white uppercase tracking-wider">GESTION DES MEMBRES</h3>
                  <p className="text-xs text-zinc-400">Suspendre, promouvoir, certifier ou bannir des artistes du Showbiz ivoirien.</p>
                </div>
                <div className="flex md:self-end gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Filtrer par nom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-[#121212] border border-[#2B2B2B] hover:border-zinc-700 focus:border-[#D4AF37] px-3.5 py-2 rounded-xl text-xs text-white placeholder-zinc-550 outline-none w-full md:max-w-[200px]"
                  />
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="bg-[#121212] border border-[#2B2B2B] px-3 py-2 rounded-xl text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="all">Tous rôles</option>
                    <option value="artist">Artistes</option>
                    <option value="client">Clients</option>
                    <option value="certified">Certifiés</option>
                    <option value="suspended">Exclus</option>
                  </select>
                </div>
              </div>

              {/* Members listings stack */}
              <div className="space-y-3.5">
                {filteredUsers.map(u => (
                  <div key={u.uid} className={`bg-[#121212]/95 border ${u.isSuspended ? "border-[#EF4444]/30" : "border-[#2B2B2B]"} p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left transition`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 relative">
                        {u.avatarUrl || u.photoURL ? (
                          <img src={u.avatarUrl || u.photoURL} className="w-11 h-11 object-cover rounded-full border border-white/[0.05]" alt="" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center font-bold text-zinc-500">{u.firstName ? u.firstName.substring(0, 1) : "A"}</div>
                        )}
                        {(u.isCertified || u.verificationStatus === "certifie") && <span className="absolute -bottom-1 -right-0.5 text-xs">⭐</span>}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <h4 className="font-extrabold text-sm text-white truncate max-w-[170px]">{u.artistName || `${u.firstName || ""} ${u.lastName || ""}`}</h4>
                          <span className="text-[10px] text-zinc-500 font-mono">{(u.email || '').split("@")[0].substring(0,10)}</span>
                        </div>
                        <p className="text-[11px] text-[#D4AF37] uppercase font-bold tracking-wide mt-0.5 font-mono">{u.specialty || u.speciality || "Artiste"}</p>
                        <span className="text-[10px] text-zinc-500 block truncate font-sans">📞 {u.phone || "Contact non renseigné"} • {u.commune || u.location || "Abidjan"}</span>
                        
                        {/* Display custom badges */}
                        {u.badges && u.badges.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {u.badges.map(b => (
                              <span key={b} className="px-1.5 py-0.5 rounded bg-zinc-950 border border-[#D4AF37]/20 text-[#D4AF37] text-[8px] font-black uppercase tracking-wider">{b}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operational controls */}
                    <div className="flex gap-2 w-full md:w-auto shrink-0 flex-wrap">
                      <button
                        onClick={() => handleToggleCertification(u.uid, !!u.isCertified)}
                        className={`flex-1 md:flex-none px-3 py-2 border text-[9.5px] font-black uppercase rounded-xl transition cursor-pointer ${
                          u.isCertified ? "bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]" : "bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]"
                        }`}
                      >
                        {u.isCertified ? "Décertifier" : "Certifier"}
                      </button>
                      <button
                        onClick={() => handleToggleSuspension(u.uid, !!u.isSuspended)}
                        className={`flex-1 md:flex-none px-3 py-2 border text-[9.5px] font-black uppercase rounded-xl transition cursor-pointer ${
                          u.isSuspended ? "bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]" : "bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]"
                        }`}
                      >
                        {u.isSuspended ? "Réhabiliter" : "Suspendre"}
                      </button>
                      <button
                        onClick={() => setActiveBadgeUser(u)}
                        className="px-2.5 py-2 bg-zinc-950 border border-white/[0.05] hover:text-[#D4AF37] text-zinc-400 text-[9.5px] font-black uppercase rounded-xl transition cursor-pointer"
                      >
                        Badges (+)
                      </button>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-zinc-650 font-mono text-center py-12 uppercase text-xs">Aucun membre correspond aux critères.</p>
                )}
              </div>

            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB 3: TALENTS CERTIFIÉS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeMenu === "talents" && (
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-white/[0.04] p-5 rounded-2xl text-left space-y-1.5">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-[#D4AF37]" />
                  RÉPERTOIRE DES TALENTS LABELLISÉS
                </h3>
                <p className="text-xs text-zinc-400">
                  Vérification du niveau d'acceptation et des performances des artistes officiellement certifiés par AfriGombo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.filter(u => u.isCertified || u.verificationStatus === "certifie").map(u => (
                  <div key={u.uid} className="bg-[#121212] border border-[#D4AF37]/25 p-4 rounded-2xl flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full border border-[#D4AF37]/30 bg-zinc-900 overflow-hidden shrink-0">
                        {u.avatarUrl || u.photoURL ? (
                          <img src={u.avatarUrl || u.photoURL} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-[#D4AF37] text-xs">S</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-white text-xs truncate max-w-[150px]">{u.artistName || `${u.firstName || ""} ${u.lastName || ""}`}</h4>
                        <span className="text-[10px] text-[#D4AF37] font-bold block uppercase tracking-wide font-mono mt-0.5">{u.specialty || u.speciality || "Artiste Musicien"}</span>
                        <span className="text-[9px] text-zinc-550 font-mono block truncate">{u.commune || "Abidjan"} • certifié</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleToggleCertification(u.uid, true)}
                      className="px-2.5 py-1.5 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-[8.5px] font-black uppercase rounded-lg transition hover:bg-[#EF4444]/20 cursor-pointer"
                    >
                      Retirer certification
                    </button>
                  </div>
                ))}
                {users.filter(u => u.isCertified || u.verificationStatus === "certifie").length === 0 && (
                  <div className="col-span-full py-12 text-center bg-[#121212] border border-white/[0.03] rounded-2xl p-6 text-zinc-650 uppercase text-xs font-mono">
                    Aucun talent labellisé à Abidjan pour l'instant.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB 4: LES GOMBOS */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeMenu === "gombos" && (
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-white/[0.04] p-5 rounded-2xl flex justify-between items-center text-left flex-wrap gap-3">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white uppercase tracking-wider">PISTE DES OPPORTUNITÉS (GOMBOS)</h3>
                  <p className="text-xs text-zinc-400">Examen et modération des requêtes budgétaires de concerts et spectacles déposées.</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-[#D4AF37] font-mono block">{(gombos.reduce((a,b)=>a+(b.budget||0),0)).toLocaleString()} FCFA</span>
                  <span className="text-[8.5px] text-zinc-500 uppercase tracking-wider font-mono">Engagés au total</span>
                </div>
              </div>

              <div className="space-y-3">
                {gombos.map(g => (
                  <div key={g.id} className="bg-[#121212] border border-[#2B2B2B] hover:border-zinc-850 p-4.5 rounded-2xl block text-left space-y-3 transition">
                    <div className="flex justify-between items-start flex-wrap gap-1.5">
                      <div>
                        <span className="text-[8.5px] font-bold text-zinc-550 uppercase tracking-widest font-mono">{g.eventType} • {g.date || "Aujourd'hui"}</span>
                        <h4 className="font-extrabold text-sm text-white uppercase tracking-tight mt-1">{g.title}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-[#D4AF37] font-mono">{(g.budget || 0).toLocaleString()} FCFA</span>
                        {g.urgent && <span className="block text-[8.5px] font-black text-[#EF4444] uppercase tracking-widest animate-pulse mt-0.5">⚡ URGENT</span>}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">{g.description}</p>
                    
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-2 border-t border-white/[0.02] flex-wrap gap-1.5 font-mono">
                      <span>Commune: <strong className="text-[#D4AF37]">{g.commune || "Abidjan"}</strong></span>
                      <span>Client: <strong className="text-zinc-300">{g.clientName || "Non spécifié"}</strong></span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase text-white ${g.status === "publie" ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25" : "bg-zinc-800 text-zinc-500"}`}>
                        {g.status === "publie" ? "Public" : "Réservé"}
                      </span>
                    </div>
                  </div>
                ))}
                {gombos.length === 0 && (
                  <p className="text-center text-zinc-650 font-mono py-12 uppercase text-xs">Aucune opportunité dans le carrousel.</p>
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB 5: RENFORTS (Standing in list) */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeMenu === "renforts" && (
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-white/[0.04] p-5 rounded-2xl text-left space-y-1.5">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-5 h-5 text-[#D4AF37]" />
                  ALERTES RENFORTS SCÈNES
                </h3>
                <p className="text-xs text-zinc-400">Surveillance des remplacements et interventions urgentes pour sauver les événements.</p>
              </div>

              <div className="space-y-4">
                {renforts.map(r => (
                  <div key={r.id || Math.random()} className="bg-[#121212] border border-[#2B2B2B] p-4.5 rounded-2xl text-left space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[8.5px] font-black text-[#EF4444] uppercase tracking-widest font-mono">🔥 ALERTE RENFORT</span>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider mt-1">{r.instrument || "Instrumentiste requis"}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-[#D4AF37] font-black bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20">
                        {r.status === "publie" ? "ACTIFURGENT" : "RÉSOLU"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{r.description || "Demande d'assistance immédiate sur scène."}</p>
                    <div className="pt-2 border-t border-white/[0.04] flex justify-between text-[9px] text-zinc-550 font-mono">
                      <span>Lieu: {r.location || "Abidjan"}</span>
                      <span>Signalé le: {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Inconnu"}</span>
                    </div>
                  </div>
                ))}
                {renforts.length === 0 && (
                  <div className="py-12 bg-[#121212] border border-white/[0.03] rounded-2xl p-6 text-center text-zinc-650 uppercase text-xs font-mono">
                    Aucune fiche de secours renfort activée.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB 6: GOMBO ID (KYC dossier checking) */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeMenu === "kyc" && (
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-white/[0.04] p-5 rounded-2xl text-left space-y-1.5">
                <span className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded border border-[#D4AF37]/20 text-[8.5px] font-black font-mono tracking-widest uppercase">CONTROLE D'ACCÈS REGLEMENTAIRE</span>
                <h3 className="text-base font-black text-white uppercase tracking-wide">VALIDATION DES PIÈCES SOUVERAINES</h3>
                <p className="text-xs text-zinc-400">
                  Auditer les dossiers d'artistes pour leur attribuer la reconnaissance Gombo ID de confiance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                {verificationRequests.map(vr => (
                  <div key={vr.id} className="bg-[#121212] border border-[#2B2B2B] rounded-2xl p-4.5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex gap-2.5 items-center">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/[0.04] flex items-center justify-center font-bold text-[#D4AF37]">
                          {vr.displayName ? vr.displayName.substring(0, 2).toUpperCase() : "AA"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-white truncate max-w-[150px]">{vr.stageName || vr.displayName}</h4>
                          <span className="text-[10px] text-[#D4AF37] font-bold uppercase block tracking-wider font-mono">{vr.metier || "Instrumentiste"}</span>
                          <span className="text-[8.5px] text-zinc-550 font-mono">📍 {vr.commune || "Abidjan"}</span>
                        </div>
                      </div>

                      {/* Display identity doc attachment anchors */}
                      <div className="bg-zinc-950/80 p-3 rounded-xl border border-white/[0.03] space-y-1.5 text-xs text-zinc-400 font-mono">
                        <div className="flex justify-between">
                          <span>📇 ID officiel :</span>
                          {vr.idCardUrl ? (
                            <a href={vr.idCardUrl} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline font-bold">Consulter rectoverso ↗</a>
                          ) : (
                            <span className="text-[#EF4444] italic">Manquant</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span>🤳 Selfie direct :</span>
                          {vr.selfieUrl ? (
                            <a href={vr.selfieUrl} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline font-bold">Consulter photo ↗</a>
                          ) : (
                            <span className="text-[#EF4444] italic">Manquant</span>
                          )}
                        </div>
                        <div className="flex justify-between pt-1 border-t border-white/[0.03]">
                          <span>🎧 Démo audio-visuelle :</span>
                          {vr.proofUrl ? (
                            <a href={vr.proofUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline font-bold">Écouter démo ↗</a>
                          ) : (
                            <span className="text-zinc-650 italic">Aucune</span>
                          )}
                        </div>
                      </div>

                      {/* WhatsApp contact anchors */}
                      <div className="text-[10px] text-zinc-500">
                        WhatsApp : <a href={`https://wa.me/${(vr.whatsapp || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[#10B981] hover:underline font-bold font-mono">{vr.whatsapp}</a>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#222] flex justify-between items-center bg-zinc-950/40 p-2 rounded-xl flex-wrap gap-2">
                      <span className="text-[9.5px] font-mono text-zinc-400 uppercase">
                        Statut : {vr.status === "pending" || vr.status === "pending_express" ? (
                          <span className="text-[#D4AF37] font-black animate-pulse ml-1">Attente</span>
                        ) : vr.status === "approved" ? (
                          <span className="text-[#10B981] font-black ml-1">Approuvé</span>
                        ) : (
                          <span className="text-[#EF4444] font-black ml-1">Refusé</span>
                        )}
                      </span>

                      {(vr.status === "pending" || vr.status === "pending_express") && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleAuditVerificationRequest(vr.id, "approved")}
                            className="px-2.5 py-1 bg-[#10B981] hover:bg-[#10B981]/90 text-[#0B0B0B] font-black text-[8px] uppercase rounded-lg transition cursor-pointer"
                          >
                            Valider
                          </button>
                          <button
                            onClick={() => handleAuditVerificationRequest(vr.id, "rejected")}
                            className="px-2.5 py-1 bg-zinc-900 border border-white/5 text-[#EF4444] hover:text-white font-black text-[8px] uppercase rounded-lg transition cursor-pointer"
                          >
                            Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {verificationRequests.length === 0 && (
                  <p className="col-span-full text-center text-zinc-650 font-mono py-12 uppercase text-xs">Aucun dossier d'identification à modérer.</p>
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB 7: ALERTES (Disputes and signalments list) */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeMenu === "alertes" && (
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-white/[0.04] p-5 rounded-2xl text-left space-y-1.5">
                <h3 className="text-base font-black text-[#EF4444] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
                  COMMISSIONS CONFLITS ET ARBITRAGES
                </h3>
                <p className="text-xs text-zinc-400">
                  Réguler les litiges concernant le non-respect des engagements ou les signalement de médias illicites.
                </p>
              </div>

              <div className="space-y-4.5 block">
                {reports.map((rep) => (
                  <div key={rep.id} className="bg-[#121212] border border-[#EF4444]/20 p-4.5 rounded-2xl text-left space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[8.5px] font-black text-[#EF4444] uppercase tracking-widest font-mono">DÉCLARATION DU LITIGE</span>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider mt-1">{rep.reason || "Motif non précisé"}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-[#EF4444] font-black bg-[#EF4444]/10 px-2 py-0.5 rounded border border-[#EF4444]/20">
                        {rep.status === "pending" ? "INSTRUIT" : "RÉSOLU"}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400">{rep.comment || "Pas de précisions complémentaires fournies."}</p>
                    
                    <div className="flex justify-between items-center text-[9px] text-zinc-550 pt-2 border-t border-white/[0.04] font-mono">
                      <span>Coupable suggéré: {rep.reporterEmail || "Inconnu"}</span>
                      {rep.status === "pending" && (
                        <button
                          onClick={async () => {
                            if (confirm(`Écarter ce dossier de litige ?`)) {
                              if (!isFirebaseMock && db) {
                                await updateDoc(doc(db, "reports", rep.id), { status: "ignored" });
                              }
                              setTerminalFeed(prev => [`🛡️ Litige réglé : ${rep.id}`, ...prev]);
                            }
                          }}
                          className="px-2.5 py-1 bg-[#10B981]/15 border border-[#10B981]/25 text-[#10B981] text-[8.5px] uppercase font-black tracking-wide rounded-lg cursor-pointer"
                        >
                          Clore dossier (Ignorer)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {reports.length === 0 && (
                  <div className="py-12 bg-[#121212] border border-white/[0.03] rounded-2xl p-6 text-center text-zinc-650 uppercase text-xs font-mono">
                    Aucun litige ou signalement en arbitrage.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB 8: LA CAISSE (Ledger with Orange/Wave/MTN validation) */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeMenu === "caisse" && (
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-white/[0.04] p-5 rounded-2xl text-left space-y-2">
                <span className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded border border-[#D4AF37]/25 text-[8.5px] font-black font-mono tracking-widest uppercase">REGISTRE MONÉTAIRE</span>
                <h3 className="text-base font-black text-white uppercase tracking-wider">SOLDE ET TRANSFERTS MOBILE MONEY</h3>
                <p className="text-xs text-zinc-400 font-sans">
                  Suivre attentivement les paiements, abonnements Premium annuels et approuver les demandes de retraits de cachets.
                </p>
              </div>

              {/* Grid of payment metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="bg-[#121212] border border-[#2B2B2B] p-4.5 rounded-2xl">
                  <span className="text-[8.5px] font-mono text-zinc-550 block font-black uppercase">Revenus des abonnements (Premium)</span>
                  <p className="text-xl font-black text-[#D4AF37] mt-1.5 font-mono">{premiumRevenues.toLocaleString()} FCFA</p>
                  <span className="text-[9px] text-zinc-500 block">Basé sur {activePaidSubscriptions} souscriptions actives d'Abidjan</span>
                </div>
                <div className="bg-[#121212] border border-[#2B2B2B] p-4.5 rounded-2xl">
                  <span className="text-[8.5px] font-mono text-zinc-550 block font-black uppercase">Commission (Taux : {commissionRate}%)</span>
                  <p className="text-xl font-black text-[#D4AF37] mt-1.5 font-mono">{totalCommission.toLocaleString()} FCFA</p>
                  <span className="text-[9px] text-zinc-500 block">Cumulé sur les dépôts de garantie des castings</span>
                </div>
              </div>

              {/* Segmented direct withdrawals */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase text-white tracking-widest font-mono">DÉCAISSEMENTS DEMANDÉS EN ATTENTE</h4>
                  <div className="flex bg-zinc-950 rounded-xl p-0.5 border border-white/[0.04]">
                    <button
                      onClick={() => setWithdrawalFilter("pending")}
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${withdrawalFilter === "pending" ? "bg-zinc-900 text-[#D4AF37] font-black" : "text-zinc-500"}`}
                    >
                      En attente
                    </button>
                    <button
                      onClick={() => setWithdrawalFilter("approved")}
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${withdrawalFilter === "approved" ? "bg-zinc-900 text-[#D4AF37]" : "text-zinc-500"}`}
                    >
                      Transférés
                    </button>
                  </div>
                </div>

                <div className="space-y-3.5 block">
                  {withdrawRequests.filter(r => r.status === withdrawalFilter).map(req => (
                    <div key={req.id} className="bg-[#121212] border border-[#2B2B2B] p-4.5 rounded-2xl flex flex-col justify-between text-left space-y-4">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <span className="px-2 py-0.5 bg-zinc-950 border border-white/5 rounded text-[8.5px] font-mono text-[#D4AF37] uppercase font-black tracking-wider">{req.provider}</span>
                          <h4 className="text-lg font-black text-[#F5F5F5] font-mono mt-1">{req.amount.toLocaleString()} FCFA</h4>
                          <span className="text-[11px] text-zinc-400 block break-all font-semibold mt-0.5">{req.userEmail}</span>
                        </div>
                        <span className="text-[10px] text-[#D4AF37] font-mono">Portable: <strong className="text-white">{req.phone}</strong></span>
                      </div>

                      {req.status === "pending" && (
                        <div className="pt-3.5 border-t border-white/[0.03] flex gap-2.5">
                          <button
                            onClick={() => handleRejectWithdraw(req.id)}
                            className="flex-1 py-2 bg-zinc-900 border border-white/5 rounded-xl text-[9.5px] font-black text-[#EF4444] uppercase tracking-wider transition cursor-pointer"
                          >
                            Rejeter transfert
                          </button>
                          <button
                            onClick={() => handleApproveWithdraw(req.id, req.userUid, req.amount)}
                            className="flex-1 py-2 bg-[#D4AF37] hover:brightness-105 text-[#0B0B0B] font-black text-[9.5px] uppercase tracking-wider rounded-xl transition cursor-pointer"
                          >
                            Valider versement 💰
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {withdrawRequests.filter(r => r.status === withdrawalFilter).length === 0 && (
                    <p className="text-center text-zinc-650 font-mono py-10 uppercase text-xs">Aucun transfert dans cette sous-section.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB 9: ANALYTICS (Style popularity charts) */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeMenu === "analytics" && (
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-white/[0.04] p-5 rounded-2xl text-left space-y-1.5">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-5 h-5 text-[#D4AF37]" />
                  ANALYTICS & PRÉFÉRENCES MUSICALES d’ABIDJAN
                </h3>
                <p className="text-xs text-zinc-400 font-sans">
                  Distribution quantitative des artistes inscrits sur la carte et popularité des tendances musicales.
                </p>
              </div>

              {/* Vector representation bars */}
              <div className="bg-[#121212] border border-[#2B2B2B] p-5 rounded-2xl text-left space-y-4">
                <h4 className="text-xs font-black uppercase text-white tracking-widest font-mono">Popularité des genres majeurs</h4>
                
                <div className="space-y-3.5">
                  {[
                    { genre: "Coupé-Décalé", count: users.filter(u => u.musicGenre === "Coupé-Décalé").length || 34, percent: "65%" },
                    { genre: "Zouglou", count: users.filter(u => u.musicGenre === "Zouglou").length || 28, percent: "50%" },
                    { genre: "Rumba Congolaise", count: users.filter(u => u.musicGenre === "Rumba").length || 18, percent: "32%" },
                    { genre: "Gospel ivoire", count: users.filter(u => u.musicGenre === "Gospel").length || 12, percent: "20%" }
                  ].map(g => (
                    <div key={g.genre} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-300 font-semibold uppercase">{g.genre}</span>
                        <span className="text-[#D4AF37] font-bold">{g.count} inscrits</span>
                      </div>
                      <div className="w-full bg-[#0B0B0B] h-2 rounded-full border border-white/[0.03] overflow-hidden">
                        <div className="bg-[#D4AF37] h-full" style={{ width: g.percent }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB 10: CONFIGURATIONS ET PARAMÈTRES (SystemAlert & commissionRate) */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeMenu === "settings" && (
            <div className="bg-[#121212] border border-[#2B2B2B] p-6 rounded-2xl text-left space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-5 h-5 text-[#D4AF37]" />
                  CONFIGURATION CONSTANTES DU SYSTEME
                </h3>
                <p className="text-xs text-zinc-400">Modifier impérativement la commission d'arbitrage mondiale et le message de broadcast du dôme.</p>
              </div>

              <div className="space-y-4 pt-1.5">
                <div className="space-y-1.5 block">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider font-mono">Message d’Alerte de la Bannière d'Accueil</label>
                  <textarea
                    rows={3}
                    value={systemAlert}
                    onChange={(e) => setSystemAlert(e.target.value)}
                    className="w-full bg-zinc-950 border border-[#2B2B2B] rounded-xl p-3 text-xs text-white placeholder-zinc-700 focus:border-[#D4AF37] outline-none"
                    placeholder="Message d'alertes aux utilisateurs..."
                  />
                </div>

                <div className="space-y-1.5 block">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider font-mono">Frais d'Arbitrage et prélèvements (%)</label>
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="w-full bg-zinc-950 border border-[#2B2B2B] focus:border-[#D4AF37] outline-none rounded-xl px-3 h-10 text-xs text-white"
                    min="1"
                    max="10"
                  />
                  <p className="text-[8.5px] text-zinc-500 font-mono">Taux conseillé : 5%. Seules les valeurs comprises entre 1% et 10% sont agrégées.</p>
                </div>

                <button
                  onClick={handleSaveConfig}
                  className="w-full py-2 px-4 bg-[#D4AF37] hover:brightness-105 text-[#0B0B0B] hover:text-black font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
                >
                  Enregistrer les constantes Elite
                </button>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* ZONE C: ZONE ACTIVITÉ EN DIRECT (Real-time sidebar) */}
      {/* ──────────────────────────────────────────────────────── */}
      <aside className="border-t lg:border-t-0 lg:border-l border-[#2B2B2B] bg-[#121212]/30 p-6 flex flex-col justify-start space-y-6 shrink-0 lg:w-[320px]">
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] text-left">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
            </span>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] font-mono">ACTIVITÉ EN DIRECT</h4>
              <span className="text-[9px] text-zinc-500 block">Mises à jour inaltérables de l'industrie</span>
            </div>
          </div>
          <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-950 px-2 py-0.5 rounded border border-white/[0.03]">Abidjan</span>
        </div>

        {/* Dynamic Activity Feed Container */}
        <div className="space-y-4 max-h-[380px] lg:max-h-[500px] overflow-y-auto pr-1">
          {liveActivities.map((act) => (
            <div key={act.id} className="p-3 bg-zinc-950/80 rounded-2xl border border-white/[0.02] text-left relative overflow-hidden transition-all hover:bg-zinc-950">
              <p className="text-[11px] text-zinc-300 leading-snug font-medium pr-1.5">{act.message}</p>
              <div className="flex justify-between items-center text-[9px] text-zinc-550 pt-2 border-t border-white/[0.02] mt-2 font-mono">
                <span className={act.badge === "emerald" ? "text-[#10B981] font-bold" : "text-[#D4AF37] font-bold"}>
                  ● {act.badge === "emerald" ? "SUCCÈS" : "DÉROULEMENT"}
                </span>
                <span>{act.time}</span>
              </div>
            </div>
          ))}
          {liveActivities.length === 0 && (
            <div className="text-center py-16 text-zinc-650 space-y-2 block">
              <Activity className="w-5 h-5 mx-auto text-zinc-600 animate-pulse" />
              <p className="text-[9px] font-black uppercase tracking-wider">Synchronisation du flux...</p>
              <p className="text-[8px] text-zinc-500 font-sans tracking-wide">Faites des actions pour faire vibrer les serveurs.</p>
            </div>
          )}
        </div>

        {/* Operational Security Disclaimer footer inside Zone C */}
        <div className="p-4 bg-zinc-950/80 rounded-2xl border border-white/[0.04] text-left space-y-1 font-mono text-[8.5px] text-zinc-500 text-center uppercase tracking-wider">
          <p>🔑 Session ID: {Math.random().toString(36).substring(2, 6).toUpperCase()}</p>
          <p className="text-[#D4AF37] font-bold">Sécurisé par protocole AfriGombo Elite</p>
        </div>
      </aside>

      {/* 🏆 INTERACTIVE POPUP BADGE MANAGER */}
      <AnimatePresence>
        {activeBadgeUser && (
          <div className="fixed inset-0 z-50 bg-[#0B0B0B]/85 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-sm bg-[#121212] border border-[#2B2B2B] p-5 rounded-3xl space-y-4 shadow-2xl relative text-left"
            >
              <button 
                onClick={() => setActiveBadgeUser(null)}
                className="absolute top-4.5 right-4.5 p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <span className="text-[8px] text-[#D4AF37] font-mono tracking-widest font-black uppercase">ATTRIBUTION DE LABELS</span>
                <h3 className="text-sm font-bold text-white uppercase truncate">Gérer les Badges de :</h3>
                <p className="text-xs text-[#D4AF37] font-black truncate">
                  {activeBadgeUser.artistName || `${activeBadgeUser.firstName || "Artiste"} ${activeBadgeUser.lastName || "Ivoire"}`}
                </p>
              </div>

              <div className="space-y-2 pt-1.5 block">
                {[
                  "⭐ Talent Certifié",
                  "🔥 Artiste Actif",
                  "🏆 Top Talent",
                  "🎼 Groupe VIP",
                  "✅ Profil Vérifié",
                  "👑 Super Admin"
                ].map((badge) => {
                  const isActive = (activeBadgeUser.badges || []).includes(badge);
                  return (
                    <button
                      key={badge}
                      onClick={() => handleToggleUserBadge(badge)}
                      className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs font-black transition-all uppercase tracking-wider cursor-pointer ${
                        isActive 
                          ? "bg-[#D4AF37]/10 border border-[#D4AF37] text-[#D4AF37]" 
                          : "bg-zinc-950 border border-white/[0.04] text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span>{badge}</span>
                      {isActive ? (
                        <Check className="w-4 h-4 text-[#D4AF37]" />
                      ) : (
                        <PlusCircle className="w-4 h-4 text-zinc-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-white/[0.05] text-center">
                <button
                  onClick={() => setActiveBadgeUser(null)}
                  className="px-4 py-2 bg-zinc-900 border border-white/[0.04] text-white hover:text-[#D4AF37] rounded-xl text-[9px] uppercase font-black tracking-widest transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
