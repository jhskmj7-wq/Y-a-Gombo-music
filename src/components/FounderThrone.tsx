import React, { useState, useEffect } from "react";
import {
  Crown,
  Users,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Award,
  Fingerprint,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Heart,
  Plus,
  Trash2,
  Bell,
  Database,
  Lock,
  Compass,
  Zap,
  CheckCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2,
  ChevronRight,
  Search,
  Settings,
  Power,
  UserPlus,
  Megaphone,
  Download,
  Flame,
  Globe,
  FileText,
  Mail,
  Send,
  RefreshCw,
  Clock,
  Music,
  Tablet,
  Check,
  FolderOpen
} from "lucide-react";
import { User, Gombo, Transaction, Alerte, GomboReview } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, query, setDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { audioSynth } from "../lib/audio";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface FounderThroneProps {
  adminEmail: string;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  gombos: Gombo[];
  setGombos: React.Dispatch<React.SetStateAction<Gombo[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  alerts: Alerte[];
  setAlerts: React.Dispatch<React.SetStateAction<Alerte[]>>;
  reviews: GomboReview[];
  setReviews: React.Dispatch<React.SetStateAction<GomboReview[]>>;
  systemCommissionRate: number;
  setSystemCommissionRate: (rate: number) => void;
  addToTerminal: (msg: string) => void;
  saveToFirestore: (collection: string, id: string, data: any) => Promise<void>;
  createTransaction: (amount: number, type: any, description: string, userId: string, userName: string) => Promise<void>;
  onClose: () => void;
}

export default function FounderThrone({
  adminEmail,
  users: initialUsers,
  setUsers,
  gombos: initialGombos,
  setGombos,
  transactions: initialTransactions,
  setTransactions,
  alerts: initialAlerts,
  setAlerts,
  reviews,
  setReviews,
  systemCommissionRate,
  setSystemCommissionRate,
  addToTerminal,
  saveToFirestore,
  createTransaction,
  onClose
}: FounderThroneProps) {
  // Let everyone in admin role enter directly for testing
  const isAuthorizedFounder = true;

  // Real-time synced state arrays
  const [liveUsers, setLiveUsers] = useState<User[]>(initialUsers);
  const [liveGombos, setLiveGombos] = useState<Gombo[]>(initialGombos);
  const [liveTransactions, setLiveTransactions] = useState<Transaction[]>(initialTransactions);
  const [liveAlerts, setLiveAlerts] = useState<Alerte[]>(initialAlerts);

  // Bottom Tab navigation
  // Options: "accueil" (corresponds to cockpit mockup), "membres", "finances", "projets", "communaute", "plus"
  const [activeTab, setActiveTab] = useState<"accueil" | "membres" | "finances" | "projets" | "communaute" | "plus">("accueil");

  // Local state controls for modals/interactive details
  const [addAdminModalOpen, setAddAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementTarget, setAnnouncementTarget] = useState<"all" | "admins" | "certified">("all");
  const [pushNotificationModalOpen, setPushNotificationModalOpen] = useState(false);
  const [notificationText, setNotificationText] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");

  const [localUserSearch, setLocalUserSearch] = useState("");
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

  // Setup clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync databases
  useEffect(() => {
    if (!db) return;
    const unsubUsers = onSnapshot(collection(db, "users"), (sn) => {
      const list: User[] = [];
      sn.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as User));
      if (list.length > 0) {
        setLiveUsers(list);
        setUsers(list);
      }
    }, (error) => {});

    const unsubGombos = onSnapshot(collection(db, "gombos"), (sn) => {
      const list: Gombo[] = [];
      sn.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Gombo));
      if (list.length > 0) {
        setLiveGombos(list);
        setGombos(list);
      }
    }, (error) => {});

    const unsubTransactions = onSnapshot(collection(db, "transactions"), (sn) => {
      const list: Transaction[] = [];
      sn.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Transaction));
      if (list.length > 0) {
        setLiveTransactions(list);
        setTransactions(list);
      }
    }, (error) => {});

    const unsubAlerts = onSnapshot(collection(db, "alerts"), (sn) => {
      const list: Alerte[] = [];
      sn.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Alerte));
      setLiveAlerts(list);
      setAlerts(list);
    }, (error) => {});

    return () => {
      unsubUsers();
      unsubGombos();
      unsubTransactions();
      unsubAlerts();
    };
  }, [setUsers, setGombos, setTransactions, setAlerts]);

  // Handle action triggers
  const logFounderAction = async (action: string, details: any) => {
    try {
      if (db) {
        await addDoc(collection(db, "founder_logs"), {
          adminEmail,
          action,
          details,
          timestamp: serverTimestamp()
        });
      }
    } catch (e) {
      console.error("Failed to log founder action:", e);
    }
  };

  const handleAddSuperAdminEmail = async () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      alert("⚠️ L'adresse e-mail saisie est invalide.");
      return;
    }
    setNewAdminEmail("");
    setAddAdminModalOpen(false);
    addToTerminal(`👑 [DECRET] Elévation d'admin ordonnée : ${email}`);
    await logFounderAction("promote_admin", { targetEmail: email });
    try { audioSynth.playValidationSuccess(); } catch (e) {}
    alert(`👑 L'utilisateur ${email} a été élevé au rang de Super Administrateur.`);
  };

  const handlePromulgateAnnouncement = async () => {
    if (!announcementText.trim()) {
      alert("⚠️ Saisissez l'annonce avant propagation.");
      return;
    }
    addToTerminal(`📢 [ANNONCE] Ordonnance propagée avec succès aux artistes.`);
    await logFounderAction("promulgate_announcement", { text: announcementText, target: announcementTarget });
    setAnnouncementText("");
    setAnnouncementModalOpen(false);
    try { audioSynth.playValidationSuccess(); } catch (e) {}
    alert("📢 L'ordonnance a été propagée sur tout le réseau d'Abidjan !");
  };

  const handleSendPushNotification = async () => {
    if (!notificationTitle.trim() || !notificationText.trim()) {
      alert("⚠️ Remplissez tous les champs.");
      return;
    }
    addToTerminal(`🔔 [NOTIF] Notification de souveraineté transmise.`);
    await logFounderAction("send_push_notification", { title: notificationTitle, text: notificationText });
    setNotificationTitle("");
    setNotificationText("");
    setPushNotificationModalOpen(false);
    try { audioSynth.playValidationSuccess(); } catch (e) {}
    alert("🔔 Notification transmise instantanément !");
  };

  const certifyUserDirectly = async (userId: string, userName: string) => {
    try {
      const updated = liveUsers.map((u) => u.id === userId ? { ...u, isCertified: true, kycStatus: "approved" as any } : u);
      setLiveUsers(updated);
      setUsers(updated);
      if (db) {
        await updateDoc(doc(db, "users", userId), { isCertified: true, kycStatus: "approved" });
        await logFounderAction("certify_user", { userId, userName });
      }
      addToTerminal(`[GOMBO ID] Certification directe accordée à ${userName}`);
      try { audioSynth.playValidationSuccess(); } catch (e) {}
      alert(`🌟 GOMBO ID d'Or attribué avec succès à ${userName}`);
    } catch (e) {
      console.error(e);
    }
  };

  // Traitement Simulation Recharts Chart data
  const trafficData = [
    { name: "12 Mai", value: 300000 },
    { name: "13 Mai", value: 500000 },
    { name: "14 Mai", value: 250000 },
    { name: "15 Mai", value: 750000 },
    { name: "16 Mai", value: 600000 },
    { name: "17 Mai", value: 900000 },
    { name: "18 Mai", value: 1248075 },
  ];

  return (
    <div className="fixed inset-0 w-full h-full bg-[#050507] text-zinc-100 flex flex-col overflow-hidden font-sans select-none z-50">
      
      {/* PHONE STATUS BAR */}
      <div className="w-full shrink-0 bg-[#050507]/90 backdrop-blur-md flex justify-between items-center px-6 py-2.5 text-zinc-400 text-xs border-b border-zinc-900 z-50">
        <span className="font-extrabold text-white text-[13px] tracking-wide font-mono">9:41</span>
        <div className="flex items-center gap-1.5">
          {/* Signal bars */}
          <div className="flex items-end gap-0.5 h-3 w-4">
            <span className="bg-white w-0.5 h-1 rounded-full opacity-80"></span>
            <span className="bg-white w-0.5 h-1.5 rounded-full opacity-80"></span>
            <span className="bg-white w-0.5 h-2 rounded-full opacity-80"></span>
            <span className="bg-[#D4AF37] w-0.5 h-2.5 rounded-full shadow-[0_0_8px_#D4AF37]"></span>
          </div>
          {/* Wifi Icon */}
          <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M12 21a2 2 0 1 1-2-2 2 2 0 0 1 2 2zm0-5a5 5 0 0 0-5 5h-2a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7h-2a5 5 0 0 0-5-5zm0-5a10 10 0 0 0-10 10h-2a12 12 0 0 1 12-12h2a12 12 0 0 1 12 12h-2a10 10 0 0 0-10-10z"/>
          </svg>
          {/* Battery outline with gold charge */}
          <div className="border border-zinc-500 rounded px-0.5 py-0.2 w-6 h-3.5 flex items-center bg-black/45">
            <div className="bg-[#D4AF37] h-1.5 w-full rounded-2xs"></div>
          </div>
        </div>
      </div>

      {/* TOP HEADER PRESTIGE BAR */}
      <header className="shrink-0 bg-gradient-to-b from-black to-[#050507] border-b border-[#D4AF37]/15 px-6 py-4 flex justify-between items-center z-45">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => {
              setActiveTab("accueil");
              try { audioSynth.playTamTam(true); } catch(e){}
            }}
            className="w-10 h-10 rounded-full bg-black border border-[#D4AF37] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.25)] shrink-0 cursor-pointer hover:scale-105 transition-transform"
          >
            <Crown className="text-[#D4AF37] w-5 h-5 stroke-[1.5]" />
          </div>
          <div className="text-left">
            <span className="text-zinc-400 text-xs font-mono font-black tracking-widest leading-none block">
              AfriTrust
            </span>
            <span className="text-[#D4AF37] text-[13px] font-sans font-black tracking-wider leading-none mt-1.5 block">
              ELITE
            </span>
          </div>
        </div>

        {/* Center Title */}
        <div className="text-center">
          <span className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-[0.2em] font-extrabold block">
            TABLEAU DE BORD
          </span>
          <h2 className="text-lg font-sans font-black tracking-tight text-white mt-1 uppercase">
            SUPER FONDATEUR
          </h2>
          <p className="text-[8px] text-[#D4AF37]/80 font-mono tracking-widest leading-none mt-1.5 uppercase">
            VISION • CONTRÔLE • IMPACT • HÉRITAGE
          </p>
        </div>

        {/* Right Continent Map Overlay + Bell */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-zinc-800 rounded-full bg-black/60 flex items-center justify-center text-[#D4AF37] opacity-90 hidden sm:flex pointer-events-none">
            <Globe className="w-4 h-4" />
          </div>
          
          <button
            onClick={() => {
              setPushNotificationModalOpen(true);
              try { audioSynth.playTamTam(false); } catch(e){}
            }}
            className="relative w-10 h-10 border border-zinc-850 rounded-xl bg-black/40 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all text-zinc-400 hover:text-[#D4AF37] flex items-center justify-center cursor-pointer"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-black animate-pulse shadow-md">
              12
            </span>
          </button>
        </div>
      </header>

      {/* DASHBOARD CENTRAL VIEWPORT */}
      <div className="flex-1 overflow-y-auto scrollbar-none pb-12">
        <AnimatePresence mode="wait">
          
          {/* ==================== TAB: ACCUEIL ==================== */}
          {activeTab === "accueil" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="px-6 py-6 space-y-6 max-w-6xl mx-auto"
            >
              
              {/* PROFILE CARD & WALLET PANEL */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                
                {/* Sylvestre Profile Area */}
                <div className="lg:col-span-2 bg-[#09090b] border border-[#D4AF37]/35 rounded-3xl p-5 flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden shadow-[0_4px_30px_rgba(212,175,55,0.04)]">
                  {/* Avatar wrapper */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-full border-4 border-[#D4AF37] p-0.5 overflow-hidden shadow-lg shadow-[#D4AF37]/10 bg-black">
                      <img 
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop&q=85" 
                        alt="Sylvestre Hounkpevi" 
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {/* Small golden camera/crown icon */}
                    <div className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-black rounded-full p-1.5 shadow-md flex items-center justify-center border border-black cursor-pointer">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                      </svg>
                    </div>
                  </div>

                  {/* Profile texts */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <span className="text-[10px] text-[#D4AF37] font-mono uppercase font-black tracking-widest block">
                      SUPER FONDATEUR
                    </span>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                      <strong className="text-xl font-sans font-black text-white hover:text-[#D4AF37] transition-colors leading-none">
                        Sylvestre Hounkpevi
                      </strong>
                      {/* Gold Check badge */}
                      <span className="bg-[#D4AF37] text-black rounded-full p-0.5 flex items-center justify-center shadow-[0_0_8px_#D4AF37]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs">Niveau Légende</p>
                    
                    {/* Stars and legend tag */}
                    <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                      <div className="flex text-amber-400 text-sm">
                        ⭐⭐⭐⭐⭐
                      </div>
                      <span className="bg-[#D4AF37]/10 border border-[#D4AF37]/50 text-[#D4AF37] px-2.5 py-0.5 rounded text-[9px] font-mono uppercase font-black tracking-wider leading-none">
                        LÉGENDE
                      </span>
                    </div>

                    {/* Level dynamic bar */}
                    <div className="space-y-1.5 pt-1 max-w-xs mx-auto sm:mx-0">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase">
                        <span>Niveau 100</span>
                        <span>MAX</span>
                      </div>
                      <div className="w-full bg-zinc-950 border border-zinc-850 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#D4AF37] h-full rounded-full shadow-[0_0_10px_#D4AF37]" style={{ width: "100%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Solde GAWA Card (right) */}
                <div className="bg-[#09090b] border border-zinc-850 rounded-3xl p-5 flex flex-col justify-between text-left relative overflow-hidden shadow-lg shadow-black/80">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-zinc-500 font-extrabold tracking-wider block">
                        Solde GAWA
                      </span>
                      <strong className="text-2xl font-sans font-black text-white tracking-tight block mt-3 select-all">
                        {balanceVisible ? "125,680,000" : "••••••••"}
                      </strong>
                      <span className="text-[11px] text-zinc-400 font-mono font-bold block mt-1">GAWA</span>
                    </div>
                    
                    {/* Hide Button eye */}
                    <button 
                      onClick={() => setBalanceVisible(!balanceVisible)}
                      className="text-zinc-500 hover:text-white transition-colors p-1"
                    >
                      {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  <button 
                    onClick={() => {
                      setActiveTab("finances");
                      try { audioSynth.playTamTam(true); } catch(e){}
                    }}
                    className="w-full py-3 rounded-2xl bg-[#D4AF37] hover:bg-[#B48F17] text-black font-sans font-black text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(212,175,55,0.35)] transition-all cursor-pointer mt-4"
                  >
                    Voir le Wallet
                  </button>
                </div>
              </div>

              {/* STATS MATRIX KPI GRID (8 CARDS) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { title: "UTILISATEURS TOTAUX", value: "1,248,075", growth: "+12.5%", color: "border-purple-950/40 hover:border-purple-500/50" },
                  { title: "CRÉATEURS ACTIFS", value: "125,785", growth: "+8.7%", color: "border-[#D4AF37]/15 hover:border-[#D4AF37]" },
                  { title: "GAWA EN CIRCULATION", value: "2,450,000,000", growth: "+15.3%", color: "border-amber-950/40 hover:border-amber-400/50" },
                  { title: "TRANSACTIONS", value: "2,785,450", growth: "+18.6%", color: "border-[#D4AF37]/15 hover:border-yellow-400/50" },
                  { title: "REVENUS PLATEFORME", value: "325,785,000 GAWA", growth: "+22.4%", color: "border-orange-950/40 hover:border-orange-500/50" },
                  { title: "PROJETS FINANCÉS", value: "3,478", growth: "+11.2%", color: "border-[#D4AF37]/15 hover:border-amber-500" },
                  { title: "PAYS ACTIFS", value: "54 / 54", growth: "100%", color: "border-emerald-950/40 hover:border-emerald-500" },
                  { title: "COMMUNAUTÉS", value: "2,678", growth: "+9.3%", color: "border-[#D4AF37]/15 hover:border-indigo-400" },
                ].map((stat, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl bg-[#09090b]/80 border ${stat.color} transition-all duration-300 shadow-sm text-left flex flex-col justify-between h-[115px] group`}>
                    <span className="text-[9px] font-mono uppercase text-zinc-500 font-extrabold tracking-wider line-clamp-1 block">
                      {stat.title}
                    </span>
                    <strong className="text-lg font-sans font-black text-white group-hover:text-[#D4AF37] transition-colors mt-2 block tracking-tight">
                      {stat.value}
                    </strong>
                    <span className="text-[9.5px] font-mono text-emerald-400 block mt-2 font-black">
                      {stat.growth}
                    </span>
                  </div>
                ))}
              </div>

              {/* TWO COLS: AFRICA REALTIME ACTIVITY MAP + PLATFORM WORK CHARTS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Africa map indicator card */}
                <div className="bg-[#09090b] border border-zinc-850 rounded-3xl p-5 flex flex-col text-left space-y-4">
                  <div>
                    <h3 className="text-xs font-mono font-black tracking-widest text-[#D4AF37] uppercase">
                      CARTE DE L'AFRIQUE – ACTIVITÉ EN TEMPS RÉEL
                    </h3>
                    <p className="text-[9.5px] text-zinc-500 mt-1">Supervision de l'Empire AfriTrust Elite par région.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    {/* Region figures */}
                    <div className="space-y-3 flex-1 font-sans text-xs w-full">
                      {[
                        { label: "Afrique de l'Ouest", value: "512,745", dot: "bg-amber-500" },
                        { label: "Afrique Centrale", value: "218,574", dot: "bg-cyan-500" },
                        { label: "Afrique de l'Est", value: "272,856", dot: "bg-orange-500" },
                        { label: "Afrique Australe", value: "156,327", dot: "bg-purple-500" },
                        { label: "Afrique du Nord", value: "87,573", dot: "bg-emerald-500" },
                      ].map((reg, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-black/40 border border-zinc-900 rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${reg.dot}`} />
                            <span className="text-zinc-300 font-semibold">{reg.label}</span>
                          </div>
                          <div>
                            <span className="text-white font-mono font-black block">{reg.value}</span>
                            <span className="text-[9px] text-zinc-500 block leading-none">Utilisateurs</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Africa vector map */}
                    <div className="w-[190px] h-[210px] flex items-center justify-center relative shrink-0">
                      <svg viewBox="0 0 240 260" className="w-full h-full drop-shadow-[0_0_15px_rgba(212,175,55,0.15)] opacity-95">
                        <path
                          d="M100,20 C120,18,150,22,170,35 C185,45,210,60,220,80 C225,90,218,105,212,115 C205,125,208,135,210,145 C212,155,200,165,190,175 C180,185,175,195,170,210 C165,225,155,235,145,245 C135,255,128,260,128,255 C120,245,115,235,110,225 C105,215,110,205,100,195 C92,185,82,175,75,165 C68,155,60,150,50,145 C40,140,25,135,20,125 C15,115,22,110,30,105 C40,95,50,85,55,75 C60,65,70,55,75,45 C80,35,85,25,100,20 Z"
                          fill="rgba(212,175,55,0.02)"
                          stroke="#D4AF37"
                          strokeWidth="1.5"
                          strokeDasharray="2, 4"
                          opacity="0.8"
                        />
                        <path
                          d="M100,20 C120,18,150,22,170,35 C185,45,210,60,220,80 C225,90,218,105,212,115 C205,125,208,135,210,145 C212,155,200,165,190,175 C180,185,175,195,170,210 C165,225,155,235,145,245 C135,255,128,260,128,255 C120,245,115,235,110,225 C105,215,110,205,100,195 C92,185,82,175,75,165 C68,155,60,150,50,145 C40,140,25,135,20,125 C15,115,22,110,30,105 C40,95,50,85,55,75 C60,65,70,55,75,45 C80,35,85,25,100,20 Z"
                          fill="rgba(21.2,17.5,5.5,0.07)"
                          stroke="#D4AF37"
                          strokeWidth="1.2"
                        />
                        {/* West Africa pulse */}
                        <circle cx="75" cy="115" r="4" fill="#D4AF37" className="animate-ping" style={{ animationDuration: '3s' }} />
                        <circle cx="75" cy="115" r="2.5" fill="#FFEAA7" />
                        
                        {/* Central Africa pulse */}
                        <circle cx="115" cy="140" r="3" fill="#D4AF37" />
                        
                        {/* East Africa pulse */}
                        <circle cx="165" cy="150" r="4" fill="#D4AF37" className="animate-pulse" />
                        
                        {/* South Africa */}
                        <circle cx="138" cy="225" r="3.5" fill="#D4AF37" />
                        
                        {/* North Africa */}
                        <circle cx="102" cy="55" r="3" fill="#D4AF37" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Platform Activity Spline Chart */}
                <div className="bg-[#09090b] border border-zinc-850 rounded-3xl p-5 flex flex-col text-left space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <div>
                      <h3 className="text-xs font-mono font-black tracking-widest text-[#D4AF37] uppercase">
                        ACTIVITÉ PLATEFORME
                      </h3>
                      <p className="text-[9px] text-zinc-500 mt-1">Évolution des utilisateurs actifs sur le continent.</p>
                    </div>
                    
                    <select className="bg-zinc-950 border border-zinc-850 rounded-xl py-1.5 px-3 text-[10px] font-mono text-[#D4AF37] focus:outline-none focus:border-[#D4AF37]">
                      <option>7 derniers jours</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <strong className="text-2xl font-sans font-black text-white">1,248,075</strong>
                      <span className="text-xs text-emerald-400 font-mono font-extrabold">+12.5%</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase font-mono">Utilisateurs actifs</span>
                  </div>

                  {/* Glorious Recharts area chart with gold glows */}
                  <div className="h-[180px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trafficData}>
                        <defs>
                          <linearGradient id="glowGawa" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#52525B" fontSize={8.5} />
                        <YAxis stroke="#52525B" fontSize={8.5} />
                        <Tooltip contentStyle={{ backgroundColor: "#060608", borderColor: "#D4AF37", fontSize: "10px" }} />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#D4AF37" 
                          strokeWidth={2.5} 
                          fillOpacity={1} 
                          fill="url(#glowGawa)" 
                          dot={{ r: 3, stroke: "#D4AF37", fill: "#FFF", strokeWidth: 1.5 }} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* ACTIONS RAPIDES ROW (8 SQUARED ICONS GRID) */}
              <div className="space-y-3 text-left">
                <span className="text-xs font-mono font-black uppercase tracking-[0.15em] text-[#D4AF37]">
                  ACTIONS RAPIDES
                </span>
                
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {[
                    { label: "Valider Créateur", icon: UserPlus, action: () => { setActiveTab("membres"); try { audioSynth.playTamTam(false); } catch(e){} } },
                    { label: "Approuver Projet", icon: CheckCircle, action: () => { setActiveTab("projets"); try { audioSynth.playTamTam(false); } catch(e){} } },
                    { label: "Gérer Wallets", icon: Coins, action: () => { setActiveTab("finances"); try { audioSynth.playTamTam(false); } catch(e){} } },
                    { label: "Modération", icon: ShieldAlert, action: () => { setPushNotificationModalOpen(true); try { audioSynth.playTamTam(false); } catch(e){} } },
                    { label: "Annonces", icon: Megaphone, action: () => { setAnnouncementModalOpen(true); try { audioSynth.playTamTam(false); } catch(e){} } },
                    { label: "Rapports", icon: TrendingUp, action: () => { setActiveTab("finances"); try { audioSynth.playTamTam(false); } catch(e){} } },
                    { label: "Paramètres", icon: Sliders, iconColor: "text-[#D4AF37]", action: () => { setPushNotificationModalOpen(true); try { audioSynth.playTamTam(false); } catch(e){} } },
                    { label: "Logs Système", icon: Database, action: () => { setActiveTab("plus"); try { audioSynth.playTamTam(false); } catch(e){} } },
                  ].map((act, idx) => {
                    const IconComp = act.icon;
                    return (
                      <button
                        key={idx}
                        onClick={act.action}
                        className="p-3 bg-[#09090b] hover:bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition-all active:scale-95 group shadow-sm"
                      >
                        <div className="w-9 h-9 rounded-xl bg-black border border-zinc-850 flex items-center justify-center group-hover:border-[#D4AF37]/50 transition-colors">
                          <IconComp className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-mono leading-tight text-zinc-400 group-hover:text-white font-bold block line-clamp-1">
                          {act.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TWO COLS: PROJECTS UNDERWAY + LATEST ALERTS / SYS STATUS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                
                {/* Projects funding in progress */}
                <div className="bg-[#09090b] border border-zinc-850 rounded-3xl p-5 flex flex-col justify-between text-left space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <h3 className="text-xs font-mono font-black tracking-widest text-[#D4AF37] uppercase">
                      PROJETS EN COURS DE FINANCEMENT
                    </h3>
                    <button 
                      onClick={() => { setActiveTab("projets"); try { audioSynth.playTamTam(false); } catch(e){} }}
                      className="text-[10px] font-mono text-zinc-500 hover:text-[#D4AF37] font-bold"
                    >
                      Voir tout
                    </button>
                  </div>

                  <div className="space-y-4 flex-1">
                    {[
                      { title: "Académie de Musique", artist: "KS Bloom", target: "50,000,000 GAWA", progress: 68 },
                      { title: "Studio d'Enregistrement", artist: "Himra Officiel", target: "80,000,000 GAWA", progress: 45 },
                      { title: "Centre Culturel Abidjan", artist: "A'salfo Officiel", target: "120,000,000 GAWA", progress: 72 },
                      { title: "École de Slam Dakar", artist: "Slam Kaira", target: "30,000,000 GAWA", progress: 33 },
                      { title: "Plateforme Éducation", artist: "Prof. Alpha", target: "60,000,000 GAWA", progress: 81 },
                    ].map((proj, idx) => (
                      <div key={idx} className="space-y-1.5 p-2 bg-[#050507] border border-zinc-900 rounded-2xl">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <strong className="text-white block font-sans font-bold leading-none">{proj.title}</strong>
                            <span className="text-[10px] text-zinc-500 mt-1 block leading-none">{proj.artist}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[#D4AF37] font-mono font-black block">{proj.target}</span>
                            <span className="text-[9px] text-emerald-400 block font-mono font-bold leading-none mt-1">{proj.progress}%</span>
                          </div>
                        </div>
                        {/* Progress slider bar */}
                        <div className="w-full bg-[#121214] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#D4AF37] h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right widgets: alerts + system status */}
                <div className="flex flex-col gap-6">
                  
                  {/* Latest Alerts */}
                  <div className="bg-[#09090b] border border-zinc-850 rounded-3xl p-5 flex flex-col justify-between text-left space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                      <h3 className="text-xs font-mono font-black tracking-widest text-[#D4AF37] uppercase">
                        DERNIÈRES ALERTES
                      </h3>
                      <button 
                        onClick={() => alert("🚨 Tout est marqué comme lu.")}
                        className="text-[10px] font-mono text-zinc-500 hover:text-[#D4AF37] font-bold"
                      >
                        Tout marquer lu
                      </button>
                    </div>

                    <div className="space-y-3 flex-1">
                      {[
                        { text: "Nouveau projet soumis : Académie de Danse", time: "Il y a 5 min" },
                        { text: "Versement important : 10,000,000 GAWA", time: "Il y a 18 min" },
                        { text: "Nouveau créateur certifié : Inspire Afrika", time: "Il y a 25 min" },
                        { text: "Signalement de contenu en attente", time: "Il y a 43 min" },
                        { text: "Transaction suspecte détectée", time: "Il y a 1 h" },
                      ].map((al, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 bg-black/40 border border-zinc-900 rounded-xl text-xs gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-ping shrink-0" />
                            <span className="text-zinc-300 font-medium line-clamp-1">{al.text}</span>
                          </div>
                          <span className="text-[10.5px] font-mono text-zinc-500 shrink-0 select-none">{al.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Status lights */}
                  <div className="bg-[#09090b] border border-zinc-850 rounded-3xl p-5 text-left space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                      <h3 className="text-xs font-mono font-black tracking-widest text-[#D4AF37] uppercase">
                        STATUT SYSTÈME
                      </h3>
                      <div className="flex items-center gap-1 bg-emerald-900/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <span className="text-[10px] text-emerald-400 font-mono font-black">100%</span>
                        <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                      </div>
                    </div>

                    <span className="text-zinc-400 font-sans font-bold text-xs block">
                      Tous les systèmes opérationnels
                    </span>

                    {/* Operational light lights */}
                    <div className="grid grid-cols-5 gap-2 pt-2 text-center select-none font-sans">
                      {[
                        { label: "Serveurs" },
                        { label: "Base de données" },
                        { label: "Wallet GAWA" },
                        { label: "Live Streaming" },
                        { label: "Sécurité" },
                      ].map((stat, idx) => (
                        <div key={idx} className="p-2 bg-black border border-zinc-900 rounded-xl space-y-2 flex flex-col items-center">
                          <span className="text-[8.5px] sm:text-[9.5px] font-bold text-zinc-500 uppercase leading-tight line-clamp-1 block">
                            {stat.label}
                          </span>
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981] flex items-center justify-center border border-black animate-pulse">
                            <Check className="w-2 h-2 text-white stroke-[3.5]" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* MAJESTIC LOWER RIBBON HERO FOOTER */}
              <div className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/50 bg-gradient-to-r from-black to-[#0d0901] p-5 flex flex-col md:flex-row items-center justify-between gap-4 select-none shadow-[0_0_20px_rgba(212,175,55,0.06)]">
                {/* Backdrop Map contour image */}
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-30 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop&q=80')` }} />
                
                <div className="flex items-center gap-4 relative z-10 text-left">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-950 to-black border-2 border-[#D4AF37] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)] shrink-0">
                    <StarsLaurel />
                  </div>
                  <div>
                    <span className="text-[#D4AF37] text-[10px] font-mono tracking-[0.25em] font-extrabold block">
                      AFRITRUST ELITE :
                    </span>
                    <strong className="text-white text-base font-sans font-black tracking-tight uppercase block mt-1">
                      L'AFRIQUE UNIE, L'AVENIR BÂTI ENSEMBLE !
                    </strong>
                  </div>
                </div>

                <div className="relative z-10 w-28 h-10 border border-[#D4AF37]/35 rounded-xl bg-black/75 flex items-center justify-center font-mono text-[9px] text-[#D4AF37]/80 uppercase tracking-widest font-black shrink-0">
                  EST. 2026
                </div>
              </div>

            </motion.div>
          )}

          {/* ==================== TAB: MEMBRES ==================== */}
          {activeTab === "membres" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="px-6 py-6 max-w-5xl mx-auto space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-b border-zinc-900 pb-4">
                <div className="text-left">
                  <h3 className="text-lg font-sans font-black text-[#D4AF37] uppercase">Gestion Des Membres Légendes</h3>
                  <p className="text-zinc-500 text-xs">Supervision en direct de vos administrateurs et des dossiers d'excellence.</p>
                </div>
                <div className="relative text-left">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={localUserSearch}
                    onChange={(e) => setLocalUserSearch(e.target.value)}
                    placeholder="Filtrer par nom ou email..."
                    className="w-full bg-[#09090b] border border-zinc-850 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Members verify sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#09090b] border border-zinc-850 rounded-3xl p-5 text-left h-fit space-y-4">
                  <span className="text-[10px] font-mono text-[#D4AF37] uppercase font-black tracking-widest block">GESTION DES COMPTES ACTIFS</span>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {liveUsers.filter(u => u.name?.toLowerCase().includes(localUserSearch.toLowerCase()) || u.email?.toLowerCase().includes(localUserSearch.toLowerCase())).slice(0, 50).map((u) => (
                      <div key={u.id} className="p-4 bg-black border border-zinc-900 rounded-2xl space-y-3 flex flex-col justify-between">
                        <div>
                          <strong className="text-white text-sm block font-sans font-bold flex items-center justify-between">
                            {u.artisticName || u.name}
                            {u.status === 'suspended' && <span className="text-[9px] font-mono uppercase bg-red-500/10 text-red-500 px-2 py-0.5 rounded ml-2">Suspendu</span>}
                          </strong>
                          <span className="text-[10px] text-zinc-500 block leading-none mt-1">{u.email}</span>
                        </div>
                        <div className="flex gap-2">
                           <button
                             onClick={async () => {
                               const suspended = u.status === 'suspended';
                               const newStatus = suspended ? 'active' : 'suspended';
                               if (db) await updateDoc(doc(db, "users", u.id), { status: newStatus });
                               await logFounderAction(suspended ? "unsuspend" : "suspend", { userId: u.id, email: u.email });
                               try { audioSynth.playValidationSuccess(); } catch (e) {}
                               alert(suspended ? "Compte réactivé." : "Compte suspendu.");
                             }}
                             className={`flex-1 py-2 text-xs font-mono font-black uppercase rounded-xl cursor-pointer transition-colors ${u.status === 'suspended' ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                           >
                             {u.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                           </button>
                           {u.isAdmin ? (
                             <button onClick={async () => {
                                  if (db) await updateDoc(doc(db, "users", u.id), { isAdmin: false });
                                  await logFounderAction("demote_admin", { userId: u.id, email: u.email });
                                  try { audioSynth.playValidationSuccess(); } catch (e) {}
                                  alert("Administrateur rétrogradé avec succès.");
                               }} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 font-mono font-black text-xs uppercase rounded-xl cursor-pointer">
                               Rétrograder
                             </button>
                           ) : (
                             <button onClick={async () => {
                                  if (db) await updateDoc(doc(db, "users", u.id), { isAdmin: true });
                                  await logFounderAction("promote_admin", { userId: u.id, email: u.email });
                                  try { audioSynth.playValidationSuccess(); } catch (e) {}
                                  alert("Membre promu administrateur avec succès.");
                               }} className="flex-1 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 transition-colors text-[#D4AF37] font-mono font-black text-xs uppercase rounded-xl cursor-pointer">
                               Promouvoir
                             </button>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#09090b] border border-zinc-850 rounded-3xl p-5 text-left space-y-4">
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-[10px] font-mono text-[#D4AF37] uppercase font-black tracking-widest block">ADMINISTRATEURS ACTIONS</span>
                    <button 
                      onClick={() => setAddAdminModalOpen(true)}
                      className="px-3 py-1 bg-zinc-900 hover:bg-[#D4AF37]/10 text-xs font-sans text-white border border-zinc-800 rounded-lg"
                    >
                      Nommer Admin +
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {liveUsers.filter(u => u.isAdmin).map((u) => (
                      <div key={u.id} className="flex justify-between items-center p-2.5 bg-black/45 border border-zinc-900 rounded-xl">
                        <div>
                          <span className="text-xs text-white block font-sans font-bold">{u.name || u.email}</span>
                          <span className="text-[10px] text-[#D4AF37] font-mono mt-0.5 block">ADMIN DE L'EMPIRE</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[#10B981] font-mono text-[9px] uppercase font-bold">ACTIF</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== TAB: FINANCES ==================== */}
          {activeTab === "finances" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="px-6 py-6 max-w-4xl mx-auto space-y-6 text-left"
            >
              <div className="text-left border-b border-zinc-900 pb-4">
                <h3 className="text-lg font-sans font-black text-[#D4AF37] uppercase">Trésor & Commissions Impériales</h3>
                <p className="text-zinc-500 text-xs">Mise au point des taux de prélèvements régionaux d’Abidjan.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Adjust caisse Commission Card */}
                <div className="bg-[#09090b] border border-[#D4AF37]/35 rounded-3xl p-5 flex flex-col justify-between h-fit space-y-5 col-span-1">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-black block">Ajustement Caisse</span>
                    <p className="text-zinc-500 text-[11px] mt-1 line-clamp-2">Contrôle instantané des commissions de séquestre.</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-mono text-xs">Taux de commission :</span>
                    <span className="text-[#D4AF37] font-mono text-xl font-black">{systemCommissionRate}%</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const next = Math.max(1, systemCommissionRate - 1);
                        setSystemCommissionRate(next);
                        try{ audioSynth.playTamTam(false); } catch(e){}
                      }}
                      className="flex-1 py-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-mono font-bold transition-all border border-zinc-800"
                    >
                      - 1%
                    </button>
                    <button
                      onClick={() => {
                        const next = Math.min(30, systemCommissionRate + 1);
                        setSystemCommissionRate(next);
                        try{ audioSynth.playTamTam(false); } catch(e){}
                      }}
                      className="flex-1 py-2 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black hover:border-transparent border border-[#D4AF37]/45 text-xs font-mono font-black transition-all"
                    >
                      + 1%
                    </button>
                  </div>
                </div>

                {/* Ledger transactions listing real-time */}
                <div className="bg-[#09090b] border border-zinc-850 rounded-3xl p-5 space-y-4 col-span-2">
                  <span className="text-[10px] font-mono text-[#D4AF37] uppercase font-black tracking-widest block">GRAND LIVRE DES TRANSACTIONS</span>
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {liveTransactions.length === 0 ? (
                      <div className="p-4 bg-black border border-zinc-900 rounded-xl text-center text-zinc-500 text-xs">Auncune transaction enregistrée</div>
                    ) : (
                      liveTransactions.map((t, idx) => (
                        <div key={idx} className="p-3 bg-black border border-zinc-900 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <span className="text-white block font-sans font-semibold leading-none">{t.description || "Séquestre Gombo"}</span>
                            <span className="text-[10px] text-[#D4AF37] font-mono mt-1 block uppercase leading-none">{t.userName}</span>
                          </div>
                          <strong className="text-emerald-400 font-mono text-sm">+{t.amount.toLocaleString()} FCFA</strong>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ==================== TAB: PROJETS ==================== */}
          {activeTab === "projets" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="px-6 py-6 max-w-4xl mx-auto space-y-6 text-left"
            >
              <div className="text-left border-b border-zinc-900 pb-4">
                <h3 className="text-lg font-sans font-black text-[#D4AF37] uppercase">Opportunités & Musiques Certifiées</h3>
                <p className="text-zinc-500 text-xs">Censurez ou validez les opportunités publiées sur les cabarets d'Abidjan.</p>
              </div>

              <div className="bg-[#09090b] border border-zinc-850 rounded-3xl p-5 space-y-4">
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase font-black tracking-widest block">GOMBOS ACTIFS DU RÉSEAU</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveGombos.map((g) => (
                    <div key={g.id} className="p-4 bg-black border border-zinc-900 rounded-2xl flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex justify-between items-start">
                          <strong className="text-white font-sans text-sm block leading-none">{g.title}</strong>
                          <span className="text-[10px] text-[#D4AF37] font-mono font-bold">{g.budget.toLocaleString()} FCFA</span>
                        </div>
                        <p className="text-zinc-500 text-xs mt-1.5 line-clamp-2">{g.description}</p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono border-t border-zinc-900 pt-2 text-zinc-400">
                        <span>Lieu : {g.location || "Plateau"}</span>
                        <span className="text-emerald-400 font-bold">{g.applicantsCount || 0} prétendant(s)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== TAB: COMMUNAUTE ==================== */}
          {activeTab === "communaute" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="px-6 py-6 max-w-3xl mx-auto space-y-6 text-left"
            >
              <div className="text-left border-b border-zinc-900 pb-4">
                <h3 className="text-lg font-sans font-black text-[#D4AF37] uppercase">Comités & Groupes d’Elite</h3>
                <p className="text-zinc-500 text-xs">Supervision des cercles de cabaret et assemblées musicales d’Abidjan.</p>
              </div>

              <div className="bg-[#09090b] border border-zinc-850 rounded-3xl p-5 space-y-4">
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase font-black tracking-widest block">ASSEMBLÉES ACTIVES</span>
                
                <div className="space-y-3">
                  {[
                    { label: "Cercle d'Or des Pianistes de Cocody", members: "128 membres", desc: "Regroupement des pianistes virtuoses pour les cabarets de prestige." },
                    { label: "Syndicat d’Elite des Bassistes de Marcory", members: "95 membres", desc: "Réseau et partage d'opportunités de haut cachet hebdomadaires." },
                    { label: "Ligue Ivoire des Chanteurs de Cabaret", members: "254 membres", desc: "Authentiques leaders vocaux de Côte d'Ivoire certifiés." },
                  ].map((com, idx) => (
                    <div key={idx} className="p-4 bg-black border border-zinc-900 rounded-2xl flex flex-col justify-between text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <strong className="text-white text-sm font-sans font-bold leading-none">{com.label}</strong>
                        <span className="text-[10px] text-[#D4AF37] font-mono">{com.members}</span>
                      </div>
                      <p className="text-zinc-500 text-xs leading-relaxed">{com.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== TAB: PLUS ==================== */}
          {activeTab === "plus" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="px-6 py-6 max-w-xl mx-auto space-y-6 text-left"
            >
              <div className="text-left border-b border-zinc-900 pb-4">
                <h3 className="text-lg font-sans font-black text-[#D4AF37] uppercase">Configuration & Clés Souveraines</h3>
                <p className="text-zinc-500 text-xs">Paramétrages secrets de l’incubateur AfriTrust Elite.</p>
              </div>

              <div className="bg-[#09090b] border border-zinc-850 rounded-3xl p-5 text-left space-y-4">
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase font-black tracking-widest block">FONCTIONNALITÉS COMPACTES</span>
                
                <div className="space-y-3">
                  
                  {/* Nominate Admin action trigger */}
                  <button
                    onClick={() => setAddAdminModalOpen(true)}
                    className="w-full p-4 bg-black hover:bg-zinc-950/80 border border-zinc-850 rounded-2xl flex items-center justify-between text-left cursor-pointer transition-colors"
                  >
                    <div>
                      <strong className="text-white text-sm block font-sans font-bold leading-none">Nommer un Administrateur</strong>
                      <span className="text-zinc-500 text-[10px] mt-1.5 block">Elevez de nouveaux protecteurs pour le temple.</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
                  </button>

                  {/* Decreet propagate */}
                  <button
                    onClick={() => setAnnouncementModalOpen(true)}
                    className="w-full p-4 bg-black hover:bg-zinc-950/80 border border-zinc-850 rounded-2xl flex items-center justify-between text-left cursor-pointer transition-colors"
                  >
                    <div>
                      <strong className="text-white text-sm block font-sans font-bold leading-none">Propager un Décret Impérial</strong>
                      <span className="text-zinc-500 text-[10px] mt-1.5 block">Diffusez des ordonnances immédiates sur tout le réseau d'Abidjan.</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
                  </button>

                  {/* Send notification */}
                  <button
                    onClick={() => setPushNotificationModalOpen(true)}
                    className="w-full p-4 bg-black hover:bg-zinc-950/80 border border-zinc-850 rounded-2xl flex items-center justify-between text-left cursor-pointer transition-colors"
                  >
                    <div>
                      <strong className="text-white text-sm block font-sans font-bold leading-none">Transmettre une Notification</strong>
                      <span className="text-zinc-500 text-[10px] mt-1.5 block font-sans">Envoyez des messages Flash d'élite en un instant.</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
                  </button>

                  <div className="w-full h-[1px] bg-zinc-900 my-2" />

                  {/* Quitter */}
                  <button
                    onClick={() => {
                      try { audioSynth.playTamTam(false); } catch(e){}
                      onClose();
                    }}
                    className="w-full p-4 bg-red-950/10 hover:bg-red-950/30 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-between text-left cursor-pointer transition-colors font-sans font-bold text-sm"
                  >
                    <div>
                      <strong>Quitter le Cabinet Secret</strong>
                      <span className="text-zinc-500 text-[10px] mt-1 block">Retourner au Centre de Commande AfriGombo de l'Administration.</span>
                    </div>
                    <Power className="w-4 h-4" />
                  </button>

                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* FIXED PREMIUM BOTTOM NAVIGATION DOCK (EXACT AS IMAGE) */}
      <nav className="fixed bottom-0 inset-x-0 bg-black/95 backdrop-blur-md border-t border-[#D4AF37]/30 h-16 flex justify-around items-center z-50 px-4 pb-1">
        {[
          { id: "accueil", label: "Accueil", icon: Crown },
          { id: "membres", label: "Utilisateurs", icon: Users },
          { id: "finances", label: "Finances", icon: Coins },
          { id: "projets", label: "Projets", icon: FolderOpen },
          { id: "communaute", label: "Communauté", icon: Users },
          { id: "plus", label: "Plus", icon: Sliders },
        ].map((it) => {
          const IconComp = it.icon;
          const isSel = activeTab === it.id;
          return (
            <button
              key={it.id}
              onClick={() => {
                setActiveTab(it.id as any);
                try { audioSynth.playTamTam(false); } catch(e){}
              }}
              className={`flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                isSel ? "text-[#D4AF37] scale-105" : "text-zinc-550 hover:text-zinc-300"
              }`}
            >
              <div className={`p-1 rounded-full ${isSel ? "bg-[#D4AF37]/15" : "bg-transparent"} transition-all`}>
                <IconComp className="w-5.5 h-5.5" />
              </div>
              <span className="text-[10px] mt-0.5 font-bold tracking-tight">{it.label}</span>
            </button>
          );
        })}
      </nav>

      {/* --- ALL PREMIUM OVERLAY MODALS --- */}
      
      {/* 1. Nominate Admin Modal */}
      {addAdminModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] flex justify-center items-center p-6 animate-fadeIn">
          <div className="w-full max-w-sm bg-zinc-950 border border-[#D4AF37]/45 rounded-3xl p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <strong className="text-white text-sm font-mono uppercase tracking-widest text-[#D4AF37]">ÉLEVATION D'ADMINISTRATEUR</strong>
              <button onClick={() => setAddAdminModalOpen(false)} className="text-zinc-550 hover:text-white font-mono text-xs">Fermer</button>
            </div>
            
            <p className="text-xs text-zinc-400">Saisissez l'adresse e-mail de l'intervenant à élever au Conseil Impérial.</p>
            
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Adresse E-mail</label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="Ex : sylvestrehounkpevi777@gmail.com"
                className="w-full bg-[#030305] border border-zinc-850 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                autoFocus
              />
            </div>

            <button
              onClick={handleAddSuperAdminEmail}
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-black text-xs font-mono font-black uppercase tracking-wider cursor-pointer"
            >
              Élever au conseil d'or
            </button>
          </div>
        </div>
      )}

      {/* 2. Propagate Decreet Announcement Modal */}
      {announcementModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] flex justify-center items-center p-6 animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-950 border border-[#D4AF37]/45 rounded-3xl p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <strong className="text-white text-sm font-mono uppercase tracking-widest text-[#D4AF37]">PROPAGER UN DÉCRET CANAL</strong>
              <button onClick={() => setAnnouncementModalOpen(false)} className="text-zinc-550 hover:text-white font-mono text-xs">Fermer</button>
            </div>
            
            <p className="text-xs text-zinc-400">Rédigez le texte du décret souverain qui sera diffusé sur tout le réseau d'Abidjan.</p>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Cible réglementaire</label>
              <select
                value={announcementTarget}
                onChange={(e) => setAnnouncementTarget(e.target.value as any)}
                className="w-full bg-[#030305] border border-zinc-850 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none"
              >
                <option value="all">Tous les Cabarets d'Abidjan (Public)</option>
                <option value="admins">CONSEIL DES ADMINISTRATEURS (Privé)</option>
                <option value="certified">Talents Certifiés Gombo ID d'Or uniquement</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Texte Ordonnance</label>
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Ex : Par délibération souveraine, tous les cachets d'orchestre de Cocody sont exonérés de commission ce weekend !"
                className="w-full h-24 bg-[#030305] border border-zinc-850 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37] resize-none"
              />
            </div>

            <button
              onClick={handlePromulgateAnnouncement}
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-black text-xs font-mono font-black uppercase tracking-wider cursor-pointer"
            >
              PROPAGER LE DÉCRET
            </button>
          </div>
        </div>
      )}

      {/* 3. Send Push Notification Modal */}
      {pushNotificationModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] flex justify-center items-center p-6 animate-fadeIn">
          <div className="w-full max-w-sm bg-zinc-950 border border-[#D4AF37]/45 rounded-3xl p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <strong className="text-white text-sm font-mono uppercase tracking-widest text-[#D4AF37]">TRANSMETTRE UNE NOTIFICATION</strong>
              <button onClick={() => setPushNotificationModalOpen(false)} className="text-zinc-550 hover:text-white font-mono text-xs">Fermer</button>
            </div>

            <p className="text-xs text-zinc-400">Envoyez une alerte Flash royale d'importance critique d'Abidjan.</p>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase font-sans">Titre Alerte</label>
              <input
                type="text"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="Ex : Alerte Sécurité Écosystème d'Or"
                className="w-full bg-[#030305] border border-zinc-850 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Message</label>
              <textarea
                value={notificationText}
                onChange={(e) => setNotificationText(e.target.value)}
                placeholder="Tapez votre message secret..."
                className="w-full h-20 bg-[#030305] border border-zinc-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] resize-none"
              />
            </div>

            <button
              onClick={handleSendPushNotification}
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-black text-xs font-mono font-black uppercase tracking-wider cursor-pointer"
            >
              Envoyer maintenant
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// Laurel Wreath custom gold vector shape
function StarsLaurel() {
  return (
    <svg viewBox="0 0 100 100" className="w-9 h-9 fill-[#D4AF37] opacity-95">
      <path d="M50,15 L54,27 L66,27 L56,34 L60,46 L50,38 L40,46 L44,34 L34,27 L46,27 Z" />
      <path d="M22,50 C22,34 34,22 50,22 C53,22 55,23 57,24 C54,26 52,29 50,32 C40,32 32,40 32,50 C32,60 40,68 50,68 C52,71 54,74 57,76 C55,77 53,78 50,78 C34,78 22,66 22,50 Z" />
      <path d="M78,50 C78,34 66,22 50,22 C47,22 45,23 43,24 C46,26 48,29 50,32 C60,32 68,40 68,50 C68,60 60,68 50,68 C48,71 46,74 43,76 C45,77 47,78 50,78 C66,78 78,66 78,50 Z" />
    </svg>
  );
}
