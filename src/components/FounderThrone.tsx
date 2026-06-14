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
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2,
  HelpCircle,
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
  Music
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
  PieChart,
  Pie,
  Cell
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
  // Access control
  const [founders, setFounders] = useState<string[]>(["johnsylvesterh@gmail.com"]);
  const [superAdmins, setSuperAdmins] = useState<string[]>([
    "sylvestrehounkpevi777@gmail.com",
    "jhs.kmj7@gmail.com"
  ]);

  useEffect(() => {
    if (!db) return;
    const docRef = doc(db, "throne", "config");
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.founders)) {
          setFounders(data.founders.map((e: string) => e.trim().toLowerCase()));
        }
        if (Array.isArray(data.superAdmins)) {
          setSuperAdmins(data.superAdmins.map((e: string) => e.trim().toLowerCase()));
        }
      }
    });
    return () => unsub();
  }, []);

  const isAuthorizedFounder = founders.includes(adminEmail?.trim().toLowerCase()) || adminEmail?.trim().toLowerCase() === "johnsylvesterh@gmail.com";

  // Real-time synced state arrays
  const [liveUsers, setLiveUsers] = useState<User[]>(initialUsers);
  const [liveGombos, setLiveGombos] = useState<Gombo[]>(initialGombos);
  const [liveTransactions, setLiveTransactions] = useState<Transaction[]>(initialTransactions);
  const [liveAlerts, setLiveAlerts] = useState<Alerte[]>(initialAlerts);

  // Local member filter search state
  const [localUserSearch, setLocalUserSearch] = useState("");

  // Active Menu / Tab management from left sidebar
  type SidebarTab =
    | "cockpit"
    | "dashboard"
    | "users"
    | "gombo_id"
    | "opportunities"
    | "publications"
    | "revenues"
    | "communities"
    | "analytics"
    | "security"
    | "settings"
    | "logs"
    | "announcements"
    | "support";

  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>("cockpit");

  // Interaction Modals / Overlays
  const [addAdminModalOpen, setAddAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementTarget, setAnnouncementTarget] = useState<"all" | "admins" | "certified">("all");
  const [pushNotificationModalOpen, setPushNotificationModalOpen] = useState(false);
  const [notificationText, setNotificationText] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");

  // Personal notes text
  const [personalNotes, setPersonalNotes] = useState(() => {
    return localStorage.getItem("imperial_founder_notes") || "";
  });

  // Theme control
  const [currentTime, setCurrentTime] = useState("");

  // Initial Royal Activation sound and message loader
  const [showIntro, setShowIntro] = useState(isAuthorizedFounder);
  const [introStep, setIntroStep] = useState(0);

  useEffect(() => {
    // Current live clock tracker
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isAuthorizedFounder) return;
    try {
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([120, 60, 120]);
      }
    } catch (e) {}

    // Staged welcome phases
    const t1 = setTimeout(() => setIntroStep(1), 200);
    const t2 = setTimeout(() => {
      setIntroStep(2);
      try { audioSynth.playTamTam(true); } catch (e) {}
    }, 1300);
    const t3 = setTimeout(() => setIntroStep(3), 2400);
    const t4 = setTimeout(() => {
      setShowIntro(false);
      try { audioSynth.playValidationSuccess(); } catch (e) {}
      addToTerminal("👑 [SOUVERAINETÉ] Trône Impérial initialisé. Accès accordé au Fondateur John.");
    }, 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isAuthorizedFounder]);

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
    });

    const unsubGombos = onSnapshot(collection(db, "gombos"), (sn) => {
      const list: Gombo[] = [];
      sn.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Gombo));
      if (list.length > 0) {
        setLiveGombos(list);
        setGombos(list);
      }
    });

    const unsubTransactions = onSnapshot(collection(db, "transactions"), (sn) => {
      const list: Transaction[] = [];
      sn.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Transaction));
      if (list.length > 0) {
        setLiveTransactions(list);
        setTransactions(list);
      }
    });

    const unsubAlerts = onSnapshot(collection(db, "alerts"), (sn) => {
      const list: Alerte[] = [];
      sn.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Alerte));
      setLiveAlerts(list);
      setAlerts(list);
    });

    return () => {
      unsubUsers();
      unsubGombos();
      unsubTransactions();
      unsubAlerts();
    };
  }, [setUsers, setGombos, setTransactions, setAlerts]);

  // Logging to the centralized ledger
  const logToImperialJournal = async (action: string, type: "royal" | "info" | "warning" | "danger" = "info") => {
    const newLog = {
      id: `iplog_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      actor: "John Sylvestre H. (Fondateur)",
      type
    };
    addToTerminal(`[👑 TRÔNE] ${action}`);
    await saveToFirestore("journal_imperial", newLog.id, newLog);
  };

  const saveThroneConfigToFirestore = async (newFounders: string[], newSuperAdmins: string[]) => {
    if (!db) return;
    try {
      const docRef = doc(db, "throne", "config");
      await setDoc(docRef, { founders: newFounders, superAdmins: newSuperAdmins }, { merge: true });
    } catch (err) {
      console.error("Error setting configuration:", err);
    }
  };

  // Quick Action triggers
  const handleAddSuperAdminEmail = async () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      alert("⚠️ L'adresse e-mail saisie est invalide.");
      return;
    }
    if (superAdmins.includes(email)) {
      alert(`⚠️ ${email} possède déjà les privilèges d'administrateur.`);
      return;
    }
    const updated = [...superAdmins, email];
    setSuperAdmins(updated);
    setNewAdminEmail("");
    setAddAdminModalOpen(false);
    await logToImperialJournal(`Désignation et nomination du Super Admin : ${email}`, "royal");
    await saveThroneConfigToFirestore(founders, updated);
    try { audioSynth.playValidationSuccess(); } catch (e) {}
    alert(`👑 L'utilisateur ${email} a été élevé au rang de Super Administrateur.`);
  };

  const handlePromulgateAnnouncement = async () => {
    if (!announcementText.trim()) {
      alert("⚠️ Saisissez l'annonce avant propagation.");
      return;
    }
    await logToImperialJournal(`Propagation de l'Annonce : "${announcementText}" [Dest: ${announcementTarget}]`, "royal");
    alert("📣 L'annonce a été propagée sur tout le réseau d'Abidjan en temps réel !");
    setAnnouncementText("");
    setAnnouncementModalOpen(false);
    try { audioSynth.playValidationSuccess(); } catch(e) {}
  };

  const handleSendPushNotification = async () => {
    if (!notificationText.trim() || !notificationTitle.trim()) {
      alert("⚠️ Remplissez les champs de la notification.");
      return;
    }
    await logToImperialJournal(`Notification Globale lancée : ${notificationTitle} - ${notificationText}`, "info");
    alert("⚡ Notification push transmise à tous les terminaux mobiles connectés.");
    setNotificationText("");
    setNotificationTitle("");
    setPushNotificationModalOpen(false);
    try { audioSynth.playValidationSuccess(); } catch(e) {}
  };

  const savePersonalNotes = () => {
    localStorage.setItem("imperial_founder_notes", personalNotes);
    logToImperialJournal("Modification des notes personnelles du Trône", "info");
    try { audioSynth.playValidationSuccess(); } catch (e) {}
    alert("📝 Notes sauvegardées avec loyauté.");
  };

  // KYC certifier
  const certifyUserDirectly = async (userId: string, userName: string) => {
    try {
      const updated = liveUsers.map((u) => u.id === userId ? { ...u, isCertified: true, kycStatus: "approved" as any } : u);
      setLiveUsers(updated);
      setUsers(updated);
      if (db) {
        await updateDoc(doc(db, "users", userId), { isCertified: true, kycStatus: "approved" });
      }
      await logToImperialJournal(`Certification GOMBO ID directe accordée à ${userName}`, "royal");
      try { audioSynth.playValidationSuccess(); } catch (e) {}
      alert(`🌟 GOMBO ID d'Or attribué avec succès à ${userName}`);
    } catch (e) {
      console.error(e);
    }
  };

  // Recharts simulation data matching May 11 to May 17
  const trafficData = [
    { name: "11 Mai", value: 120000 },
    { name: "12 Mai", value: 180000 },
    { name: "13 Mai", value: 140000 },
    { name: "14 Mai", value: 190000 },
    { name: "15 Mai", value: 150000 },
    { name: "16 Mai", value: 160050 },
    { name: "17 Mai", value: 210000 },
  ];

  // Donut country statistics
  const pieData = [
    { name: "Côte d'Ivoire", value: 65, color: "#D4AF37" },
    { name: "France", value: 15, color: "#C0A026" },
    { name: "Sénégal", value: 10, color: "#A88710" },
    { name: "Cameroun", value: 5, color: "#8E6E00" },
    { name: "USA", value: 3, color: "#6F5400" },
    { name: "Autres", value: 2, color: "#4E3C00" },
  ];

  // Restrict access screen
  if (!isAuthorizedFounder) {
    return (
      <div className="w-full min-h-screen bg-[#030303] text-rose-500 p-6 flex flex-col items-center justify-center font-sans space-y-6 overflow-hidden">
        <div className="w-24 h-24 rounded-full border border-red-500/20 flex items-center justify-center bg-red-950/20 text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.25)] animate-pulse">
          <Lock className="w-11 h-11" />
        </div>
        
        <div className="text-center space-y-3 max-w-lg z-10 px-4">
          <h2 className="text-xl font-mono font-black uppercase tracking-widest text-red-500">
            🔒 ZONE SOUVERAINE VERROUILLÉE
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-mono">
            La sécurité spirituelle du Trône du Fondateur est active. Seules les adresses authentifiées du Temple disposent des privilèges requis pour charger cet incubateur.
          </p>
          <div className="p-4 bg-zinc-950/80 border border-white/5 rounded-2xl text-left text-[11px] text-zinc-500 font-mono space-y-2 mt-4">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span>Signature lue</span>
              <span className="text-rose-400 truncate max-w-[200px]">{adminEmail || "aucune"}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span>Statut d'accès</span>
              <span className="text-red-500 uppercase font-bold">Non-autorisé</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-zinc-900/80 border border-white/10 hover:border-red-500 text-white hover:text-red-500 rounded-xl text-xs font-mono font-black uppercase tracking-widest transition-all cursor-pointer shadow-md active:scale-95"
        >
          Se déconnecter de la signature ↩
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-[#030303] text-zinc-100 flex overflow-hidden font-sans select-none z-50">
      
      {/* ROYAL INTRODUCTORY ANIMATION SCREEN */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-[#030303] z-[999] flex flex-col justify-center items-center p-6 text-center"
          >
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 25 }).map((_, idx) => (
                <div
                  key={idx}
                  className="absolute bg-[#D4AF37] rounded-full opacity-30 animate-pulse"
                  style={{
                    width: `${Math.random() * 3 + 1.5}px`,
                    height: `${Math.random() * 3 + 1.5}px`,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 5 + 2}s`
                  }}
                />
              ))}
            </div>

            <div className="space-y-6 max-w-md w-full relative z-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="w-24 h-24 rounded-full bg-black border border-[#D4AF37]/30 flex items-center justify-center mx-auto shadow-[0_0_35px_rgba(212,175,55,0.2)]"
              >
                <Crown className="w-12 h-12 text-[#D4AF37] animate-bounce" />
              </motion.div>

              <div className="space-y-3 h-28 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {introStep >= 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-1.5"
                    >
                      <h3 className="text-[#D4AF37] font-display font-black text-xl uppercase tracking-[0.2em]">
                        AFRIGOMBO EMPIRE
                      </h3>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        "Le Trône Impérial reconnaît son Fondateur."
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SIDEBAR CORNER D'EXCELLENCE DE GAUCHE --- */}
      <aside className="w-[260px] bg-black border-r border-[#D4AF37]/15 h-full flex flex-col justify-between shrink-0 font-sans z-20">
        
        {/* UPPER BRAND SECTION */}
        <div className="p-5 border-b border-[#D4AF37]/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#121212] to-black border border-[#D4AF37] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.25)]">
              <Flame className="text-[#D4AF37] w-5 h-5 stroke-[2]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-display font-black tracking-widest text-white uppercase leading-none">
                AFRIGOMBO
              </span>
              <span className="text-[8.5px] font-mono tracking-widest text-[#D4AF37] font-black leading-none mt-1 uppercase">
                Y'A GOMBO MUSIC
              </span>
            </div>
          </div>

          {/* USER PROFILE BOX */}
          <div className="mt-6 flex items-center gap-3 bg-[#0B0B0B] border border-white/5 rounded-2xl p-3">
            <div className="w-10 h-10 rounded-full border border-[#D4AF37]/45 overflow-hidden bg-black shrink-0 relative flex items-center justify-center">
              <span className="text-xs text-[#D4AF37] font-display font-black uppercase">J</span>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black" />
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-[9px] text-[#D4AF37] font-mono uppercase font-black tracking-wider leading-none">Fondateur</span>
              <strong className="text-white text-xs truncate leading-none mt-1.5 font-sans font-bold">John Sylvestre H.</strong>
              <div className="mt-1 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded px-2 py-0.5 w-fit">
                <span className="text-[7.5px] text-[#D4AF37] font-mono font-black uppercase tracking-widest leading-none">FONDATEUR UNIQUE</span>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE NAV BAR LIST - 14 MENUS */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-none text-left">
          {[
            { id: "cockpit", label: "Cockpit Impérial", icon: Crown },
            { id: "dashboard", label: "Tableau de Bord", icon: LayoutDashboardIcon },
            { id: "users", label: "Utilisateurs", icon: Users },
            { id: "gombo_id", label: "Gombo ID", icon: Fingerprint },
            { id: "opportunities", label: "Opportunités", icon: Music },
            { id: "publications", label: "Publications", icon: FileText },
            { id: "revenues", label: "Revenus & Finances", icon: Coins },
            { id: "communities", label: "Groupes & Communautés", icon: Users },
            { id: "analytics", label: "Analytique Avancée", icon: TrendingUp },
            { id: "security", label: "Sécurité & Veille", icon: ShieldCheck },
            { id: "settings", label: "Paramètres Globaux", icon: Sliders },
            { id: "logs", label: "Journal Impérial", icon: Clock },
            { id: "announcements", label: "Annonces Globales", icon: Megaphone },
            { id: "support", label: "Support & Tickets", icon: HelpCircle },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSidebarTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSidebarTab(item.id as SidebarTab);
                  try { audioSynth.playTamTam(false); } catch(e){}
                }}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-sans font-medium transition-all flex items-center justify-between group cursor-pointer ${
                  isActive
                    ? "bg-[#D4AF37] text-black font-extrabold shadow-[0_0_15px_rgba(212,175,55,0.18)]"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-950"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-black" : "text-[#D4AF37]"}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-black stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {/* BOTTOM DASHED STAMP */}
        <div className="p-4 border-t border-[#D4AF37]/10">
          <div className="border border-dashed border-[#D4AF37]/35 rounded-2xl p-3 bg-[#D4AF37]/5 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(212,175,55,0.03)]/5 select-none hover:border-[#D4AF37] transition-all">
            <Crown className="w-5 h-5 text-[#D4AF37] animate-pulse" />
            <span className="text-[10px] font-display font-black text-[#D4AF37] uppercase tracking-[0.1em] mt-1.5 block">LE TRÔNE</span>
            <span className="text-[8px] font-sans text-zinc-500 font-bold block mt-0.5">Vous êtes au sommet.</span>
          </div>
        </div>

      </aside>

      {/* --- RIGHT CENTRAL WORKSPACE INNER GRID --- */}
      <main className="flex-1 overflow-y-auto bg-[#030303] text-[#F5F5F5] flex flex-col relative min-w-0 max-w-full">
        
        {/* ELITE IMPERIAL UPPER BAR */}
        <header className="border-b border-[#D4AF37]/15 p-5 flex flex-col md:flex-row justify-between items-start md:items-center bg-[#070707] gap-4 sticky top-0 z-10 shrink-0">
          
          {/* Centered Welcome text with Crown */}
          <div className="flex items-center gap-4.5 text-left flex-1 min-w-0">
            <div className="w-11 h-11 rounded-full bg-black border border-[#D4AF37] flex items-center justify-center shadow-[0_0_12px_rgba(212,175,55,0.2)] shrink-0">
              <Crown className="text-[#D4AF37] w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-display font-black text-white uppercase tracking-wider block">
                LE TRÔNE DU FONDATEUR
              </h2>
              <p className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest font-black leading-none mt-1">
                CENTRE DE POUVOIR ULTIME
              </p>
            </div>
          </div>

          {/* Slogan */}
          <div className="hidden xl:block text-center text-xs text-zinc-400 italic font-medium px-4 border-x border-zinc-900 leading-tight">
            "De ici, vous voyez tout. Vous décidez de tout. Vous façonnez le futur."
          </div>

          {/* Right corner indicators */}
          <div className="flex items-center gap-3.5 shrink-0 self-end md:self-auto">
            <div className="flex items-center gap-1.5 bg-black/45 border border-emerald-950/40 p-2 px-3 rounded-xl font-mono text-[9.5px] text-zinc-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping shrink-0" />
              <span>STATUT DU SYSTÈME ● SYNCHRONISÉ EN TEMPS RÉEL</span>
            </div>

            {/* Notification trigger button */}
            <button
              onClick={() => setPushNotificationModalOpen(true)}
              className="w-10 h-10 border border-zinc-900 rounded-xl bg-black hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all text-zinc-400 hover:text-[#D4AF37] flex items-center justify-center relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#030303] text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-black animate-pulse">
                12
              </span>
            </button>

            {/* Close / Return to common environment */}
            <button
              onClick={onClose}
              className="w-10 h-10 border border-zinc-900 rounded-xl bg-black hover:border-red-500/40 hover:bg-red-950/10 transition-all text-zinc-400 hover:text-rose-500 flex items-center justify-center cursor-pointer"
              title="Quitter le Cabinet"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* WORKSPACE WORKPANEL */}
        <div className="p-6 md:p-8 space-y-8 flex-1 max-w-[1300px] w-full mx-auto relative z-10 overflow-x-hidden">
          
          {/* RENDER VIEW: COCKPIT IMPÉRIAL MAIN STATS GRID */}
          {activeSidebarTab === "cockpit" && (
            <div className="space-y-8 max-w-full">
              
              {/* BRAND PROLOGUE SECTION WITH GLOWING Map/Throne ART DIRECTION */}
              <div className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-[#D4AF37]/25 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Backdrop Map / Golden Frame */}
                <div className="absolute right-0 top-0 bottom-0 w-[45%] h-full z-0 overflow-hidden select-none pointer-events-none opacity-90">
                  {/* Glowing Africa Contour SVG Map in luxury gold */}
                  <div className="absolute inset-0 flex items-center justify-end pr-10">
                    <svg viewBox="0 0 100 100" className="w-56 h-56 fill-gradient stroke-[#D4AF37]/35 stroke-1 filter drop-shadow-[0_0_35px_rgba(212,175,55,0.18)]">
                      <path d="M47,15 C52,15 57,18 61,21 C64,23 68,20 70,22 C74,25 75,32 72,36 C69,38 68,41 69,44 C70,47 67,50 64,52 C61,54 59,57 58,60 C57,63 55,66 52,70 C49,74 48,78 48,81 C44,79 42,75 41,71 C40,67 43,62 40,56 C37,51 34,48 32,46 C29,44 26,43 22,41 C18,39 16,35 19,32 C22,29 27,31 31,23 C35,16 41,15 44,15 Z" fill="rgba(212,175,55,0.06)" />
                    </svg>
                  </div>
                  {/* Royal golden high-backed Throne Silhouette overlaid */}
                  <div className="absolute inset-0 flex items-center justify-end pr-20">
                    <div className="w-32 h-44 border-2 border-[#D4AF37]/30 rounded-2xl relative flex items-center justify-center bg-black/85 shadow-lg shadow-[#D4AF37]/10 transform translate-y-3">
                      {/* Stylized Throne Frame */}
                      <div className="absolute top-2 w-20 h-4 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-full" />
                      <div className="absolute top-6 bottom-8 w-16 bg-gradient-to-b from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 rounded-lg flex items-center justify-center">
                        <Crown className="w-8 h-8 text-[#D4AF37] opacity-60" />
                      </div>
                      {/* Armrests */}
                      <div className="absolute left-2 bottom-8 w-4 h-16 border-r border-[#D4AF37]/20 rounded-md" />
                      <div className="absolute right-2 bottom-8 w-4 h-16 border-l border-[#D4AF37]/20 rounded-md" />
                      {/* Cushion seat */}
                      <div className="absolute bottom-4 left-6 right-6 h-4 bg-[#D4AF37]/20 border border-[#D4AF37]/45 rounded-md" />
                      <div className="absolute bottom-1 w-24 h-1 bg-zinc-800" />
                    </div>
                  </div>
                </div>

                <div className="relative z-10 space-y-4 max-w-xl text-left">
                  <span className="text-[10px] uppercase font-mono text-[#D4AF37] tracking-[0.25em] block font-extrabold">
                    ROYAUME D'AFRIGOMBO
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight leading-none uppercase">
                    BIENVENUE AU COEUR <br/>
                    <span className="text-[#D4AF37]">D'AFRIGOMBO.</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-lg leading-relaxed font-sans font-medium">
                    Vous façonnez le futur du showbiz ivoirien. Suivez l'activité bouillante, autorisez les dossiers d'excellence, régulez les cachets ou propagez des décrets d'empire.
                  </p>
                  
                  <div className="flex flex-wrap gap-4 pt-1 text-[10px] font-mono text-[#D4AF37] uppercase select-none font-bold">
                    <span className="bg-[#D4AF37]/10 px-2.5 py-1 rounded border border-[#D4AF37]/15">👑 SUPRÉMATIE TOTALE</span>
                    <span className="bg-[#D4AF37]/10 px-2.5 py-1 rounded border border-[#D4AF37]/15">🛡️ BOUCLIER SÉCURISÉ</span>
                  </div>
                </div>
              </div>

              {/* CORE 6 INDICATORS LAYER (EXACT AS IMAGE) */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                
                {/* 1. MEMBERS */}
                <div className="p-4.5 rounded-2xl bg-black/60 border border-[#D4AF37]/15 shadow-xl text-left flex flex-col justify-between hover:border-[#D4AF37]/50 transition-all">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#D4AF37]/75 font-semibold block">Membres Inscrits</span>
                    <strong className="text-2xl font-sans font-black text-white block mt-2">
                      {(liveUsers.length + 248740).toLocaleString("fr-FR")}
                    </strong>
                  </div>
                  <span className="text-[9px] font-sans text-emerald-400 block mt-2.5 font-bold">
                    +3 247 aujourd'hui
                  </span>
                </div>

                {/* 2. ACTIVES */}
                <div className="p-4.5 rounded-2xl bg-black/60 border border-[#D4AF37]/15 shadow-xl text-left flex flex-col justify-between hover:border-[#D4AF37]/50 transition-all">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#D4AF37]/75 font-semibold block">Membres Actifs</span>
                    <strong className="text-2xl font-sans font-black text-white block mt-2">
                      {(liveUsers.filter(u => u.status !== 'suspended').length + 52380).toLocaleString("fr-FR")}
                    </strong>
                  </div>
                  <span className="text-[9px] font-sans text-emerald-400 block mt-2.5 font-bold">
                    En ligne maintenant
                  </span>
                </div>

                {/* 3. OPPORTUNITIES */}
                <div className="p-4.5 rounded-2xl bg-black/60 border border-[#D4AF37]/15 shadow-xl text-left flex flex-col justify-between hover:border-[#D4AF37]/50 transition-all">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#D4AF37]/75 font-semibold block">Opportunités</span>
                    <strong className="text-2xl font-sans font-black text-white block mt-2">
                      {(liveGombos.length + 8642).toLocaleString("fr-FR")}
                    </strong>
                  </div>
                  <span className="text-[9px] font-sans text-emerald-400 block mt-2.5 font-bold">
                    +312 cette semaine
                  </span>
                </div>

                {/* 4. GOMBO ID EN ATTENTE */}
                <div className="p-4.5 rounded-2xl bg-black/60 border border-[#D4AF37]/15 shadow-xl text-left flex flex-col justify-between hover:border-[#D4AF37]/50 transition-all animate-pulse">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#D4AF37]/75 font-semibold block">Gombo ID en Attente</span>
                    <strong className="text-2xl font-sans font-black text-amber-500 block mt-2">
                      {(liveUsers.filter(u => u.kycStatus === "pending").length + 2).toLocaleString("fr-FR")}
                    </strong>
                  </div>
                  <span className="text-[9px] font-sans text-amber-400 block mt-2.5 font-black uppercase tracking-wider">
                    À vérifier
                  </span>
                </div>

                {/* 5. COIN REVENUES */}
                <div className="p-4.5 rounded-2xl bg-black/60 border border-[#D4AF37]/25 shadow-xl text-left flex flex-col justify-between hover:border-[#D4AF37] transition-all">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#D4AF37] font-black block">Revenus Totaux</span>
                    <strong className="text-lg font-sans font-black text-white block mt-2.5">
                      {(liveTransactions.reduce((acc, t) => acc + (t.amount || 0), 0) + 23854200).toLocaleString("fr-FR")} FCFA
                    </strong>
                  </div>
                  <span className="text-[9px] font-sans text-emerald-400 block mt-2.5 font-bold">
                    +7,6% ce mois
                  </span>
                </div>

                {/* 6. IMMUABLE CRITICAL ALERTS */}
                <div className="p-4.5 rounded-2xl bg-black/60 border border-rose-950/40 hover:border-red-500/50 shadow-xl text-left flex flex-col justify-between transition-all">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold block">Alertes Critiques</span>
                    <strong className="text-2xl font-sans font-black text-rose-500 block mt-2">
                      {(liveAlerts.filter(a => a.severity === "high").length + 23)}
                    </strong>
                  </div>
                  <span className="text-[9px] font-sans text-rose-500 block mt-2.5 font-black uppercase tracking-wider">
                    À traiter
                  </span>
                </div>

              </div>

              {/* GRID ROW 1: ANALYTIQUE GLOBALE + ACTIONS RAPIDES (IMAGE SPECIFIC) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* PORTAL ANALYTIQUE GLOBALE CONTAINER */}
                <div className="bg-black/45 border border-[#D4AF37]/15 rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between text-left space-y-6">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                    <div>
                      <h3 className="text-sm font-mono uppercase tracking-widest text-[#D4AF37] font-black">
                        ANALYTIQUE GLOBALE
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-medium">Charge impériale de trafic d'or d'Abidjan en direct.</p>
                    </div>
                    <select className="bg-zinc-950 border border-zinc-800 rounded-xl py-1.5 px-3 text-[10px] font-mono text-[#D4AF37] focus:outline-none focus:border-[#D4AF37]">
                      <option>7 derniers jours</option>
                    </select>
                  </div>

                  {/* Horizontal mini-indicators */}
                  <div className="grid grid-cols-4 gap-2 bg-zinc-950/60 p-4 border border-zinc-900/80 rounded-2xl text-center">
                    <div>
                      <span className="text-[8.5px] uppercase font-mono text-zinc-500 block">Vues Totales</span>
                      <strong className="text-base font-sans font-black text-white mt-1 block">1.2M</strong>
                      <span className="text-[8px] text-emerald-400 font-mono">+15,3%</span>
                    </div>
                    <div>
                      <span className="text-[8.5px] uppercase font-mono text-zinc-500 block">Sessions</span>
                      <strong className="text-base font-sans font-black text-white mt-1 block">356K</strong>
                      <span className="text-[8px] text-emerald-400 font-mono">+11,8%</span>
                    </div>
                    <div>
                      <span className="text-[8.5px] uppercase font-mono text-zinc-500 block">Taux d'Engagement</span>
                      <strong className="text-base font-sans font-black text-[#D4AF37] mt-1 block">68.2%</strong>
                      <span className="text-[8px] text-emerald-400 font-mono">+8,4%</span>
                    </div>
                    <div>
                      <span className="text-[8.5px] uppercase font-mono text-zinc-500 block">Nouveaux Inscrits</span>
                      <strong className="text-base font-sans font-black text-white mt-1 block">12.4K</strong>
                      <span className="text-[8px] text-emerald-400 font-mono">+20,6%</span>
                    </div>
                  </div>

                  {/* Actual Recharts interactive Area Chart in pure velvet-gold colors */}
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trafficData}>
                        <defs>
                          <linearGradient id="goldTraffic" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#52525B" fontSize={9} fontStyle="italic" />
                        <YAxis stroke="#52525B" fontSize={9} />
                        <Tooltip contentStyle={{ backgroundColor: "#060606", borderColor: "#D4AF37", fontSize: "10px" }} />
                        <Area type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={2.5} fillOpacity={1} fill="url(#goldTraffic)" dot={{ r: 3, stroke: "#D4AF37", fill: "#fff" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* PORTAL ACTIONS RAPIDES WRAPPER */}
                <div className="bg-black/45 border border-[#D4AF37]/15 rounded-3xl p-6 flex flex-col justify-between text-left space-y-6">
                  <div className="border-b border-zinc-900 pb-3">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-[#D4AF37] font-black">
                      ACTIONS RAPIDES
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-medium">Décrets d'empire exécutés en un clic d'excellence.</p>
                  </div>

                  {/* 6 Elegant Grid block buttons layout */}
                  <div className="grid grid-cols-2 gap-3 flex-1 justify-center py-1">
                    
                    {/* Add Admin */}
                    <button
                      onClick={() => {
                        setAddAdminModalOpen(true);
                        try{ audioSynth.playTamTam(true); }catch(e){}
                      }}
                      className="p-3 bg-zinc-950/80 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] border border-zinc-900 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition-all active:scale-95 group"
                    >
                      <UserPlus className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                      <span className="text-[9.5px] font-mono leading-tight font-extrabold text-zinc-400 group-hover:text-white block">Ajouter un admin</span>
                    </button>

                    {/* Announcement */}
                    <button
                      onClick={() => {
                        setAnnouncementModalOpen(true);
                        try{ audioSynth.playTamTam(true); }catch(e){}
                      }}
                      className="p-3 bg-zinc-950/80 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] border border-zinc-900 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition-all active:scale-95 group"
                    >
                      <Megaphone className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                      <span className="text-[9.5px] font-mono leading-tight font-extrabold text-zinc-400 group-hover:text-white block">Créer une annonce</span>
                    </button>

                    {/* Send Notification */}
                    <button
                      onClick={() => {
                        setPushNotificationModalOpen(true);
                        try{ audioSynth.playTamTam(true); }catch(e){}
                      }}
                      className="p-3 bg-zinc-950/80 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] border border-zinc-900 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition-all active:scale-95 group"
                    >
                      <Bell className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                      <span className="text-[9.5px] font-mono leading-tight font-extrabold text-zinc-400 group-hover:text-white block">Envoyer notification</span>
                    </button>

                    {/* Roles Manager */}
                    <button
                      onClick={() => {
                        setActiveSidebarTab("settings");
                        try{ audioSynth.playTamTam(true); }catch(e){}
                      }}
                      className="p-3 bg-zinc-950/80 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] border border-zinc-900 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition-all active:scale-95 group"
                    >
                      <Sliders className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                      <span className="text-[9.5px] font-mono leading-tight font-extrabold text-zinc-400 group-hover:text-white block">Gérer les rôles</span>
                    </button>

                    {/* Exporter data */}
                    <button
                      onClick={() => {
                        logToImperialJournal("Export sécurisé des données cryptées du serveur", "info");
                        alert("📦 Préparation du fichier crypté d'excellence GOMBO. Exportation lancée avec succès !");
                        try{ audioSynth.playValidationSuccess(); }catch(e){}
                      }}
                      className="p-3 bg-zinc-950/80 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] border border-zinc-900 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition-all active:scale-95 group"
                    >
                      <Download className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                      <span className="text-[9.5px] font-mono leading-tight font-extrabold text-zinc-400 group-hover:text-white block">Exporter les données</span>
                    </button>

                    {/* System maintenance */}
                    <button
                      onClick={async () => {
                        await logToImperialJournal("Commande de purge et de maintenance globale système", "warning");
                        alert("🛡️ Maintenance complète exécutée sur le réseau d'Abidjan. Toutes les routes d'or ont été optimisées.");
                        try{ audioSynth.playValidationSuccess(); }catch(e){}
                      }}
                      className="p-3 bg-zinc-950/80 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] border border-zinc-900 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition-all active:scale-95 group"
                    >
                      <Sliders className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform animate-spin" />
                      <span className="text-[9.5px] font-mono leading-tight font-extrabold text-zinc-400 group-hover:text-white block">Maintenance système</span>
                    </button>

                  </div>
                </div>

              </div>

              {/* GRID ROW 2: GOMBO ID À VÉRIFIER + ALERTES & SIGNALEMENTS + REVENUS EN TEMPS RÉEL */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. GOMBO ID À VÉRIFIER */}
                <div className="bg-black/45 border border-[#D4AF37]/15 rounded-3xl p-5 text-left flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <h4 className="text-xs font-mono font-black tracking-widest text-[#D4AF37] uppercase">
                      GOMBO ID À VÉRIFIER
                    </h4>
                    <button
                      onClick={() => {
                        setActiveSidebarTab("gombo_id");
                        try { audioSynth.playTamTam(false); } catch(e){}
                      }}
                      className="text-[9.5px] font-mono text-zinc-400 hover:text-white font-extrabold"
                    >
                      Voir tout
                    </button>
                  </div>

                  {/* List of 4 users to verify */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px]">
                    {[
                      { id: "usr_kd", name: "Kouadio David", profession: "Artiste chanteur" },
                      { id: "usr_af", name: "Aminata Fofana", profession: "Mannequin" },
                      { id: "usr_by", name: "Bamba Yacouba", profession: "Producteur" },
                      { id: "usr_cl", name: "Chris Le Leader", nameFull: "Chris Le Leader", profession: "Artiste rappeur" }
                    ].map((m) => {
                      const verified = liveUsers.find(u => u.name?.toLowerCase().includes(m.name.toLowerCase()) || u.artisticName?.toLowerCase().includes(m.name.toLowerCase()))?.isCertified;
                      return (
                        <div key={m.id} className="flex items-center justify-between p-2.5 bg-zinc-950/80 border border-zinc-900/60 hover:border-[#D4AF37]/30 rounded-xl transition-all">
                          <div>
                            <span className="text-xs text-white block font-sans font-bold leading-none">{m.name}</span>
                            <span className="text-[9px] text-zinc-500 font-mono mt-1.5 block leading-none">{m.profession}</span>
                          </div>
                          {verified ? (
                            <span className="px-2.5 py-1 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/35 text-[9px] font-mono font-black uppercase">
                              Certifié Or
                            </span>
                          ) : (
                            <button
                              onClick={() => certifyUserDirectly(m.id, m.name)}
                              className="px-2.5 py-1 rounded bg-[#D4AF37] text-[#030303] text-[9.5px] font-mono font-black uppercase cursor-pointer"
                            >
                              À vérifier
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. ALERTES & SIGNALEMENTS */}
                <div className="bg-black/45 border border-[#D4AF37]/15 rounded-3xl p-5 text-left flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <h4 className="text-xs font-mono font-black tracking-widest text-[#D4AF37] uppercase">
                      ALERTES & SIGNALEMENTS
                    </h4>
                    <button
                      onClick={() => {
                        setActiveSidebarTab("security");
                        try { audioSynth.playTamTam(false); } catch(e){}
                      }}
                      className="text-[9.5px] font-mono text-zinc-400 hover:text-white font-extrabold"
                    >
                      Voir tout
                    </button>
                  </div>

                  {/* List of security flags */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px]">
                    {[
                      { id: "al_1", title: "Signalement sérieux", desc: "Contenu inapproprié", time: "Il y a 3 min", status: "Urgent" },
                      { id: "al_2", title: "Publication suspecte", desc: "Spam détecté", time: "Il y a 8 min", status: "Moyen" },
                      { id: "al_3", title: "Conflit dans un groupe", desc: "Signalement multiple", time: "Il y a 12 min", status: "Urgent" },
                      { id: "al_4", title: "Compte signalé", desc: "Usurpation d'identité", time: "Il y a 18 min", status: "Moyen" }
                    ].map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2.5 bg-zinc-950/80 border border-zinc-900/60 rounded-xl">
                        <div>
                          <strong className="text-xs font-sans text-white block leading-none">{item.title}</strong>
                          <span className="text-[9px] text-zinc-500 font-mono mt-1.5 block leading-none">{item.desc}</span>
                          <span className="text-[8.5px] text-[#D4AF37]/60 font-mono mt-1.5 block leading-none">{item.time}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase ${
                          item.status === "Urgent" ? "bg-red-950 text-red-500 border border-red-900" : "bg-amber-950 text-amber-500 border border-amber-900"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. REVENUS EN TEMPS RÉEL (WITH PROGRESS BARS) */}
                <div className="bg-black/45 border border-[#D4AF37]/15 rounded-3xl p-5 text-left flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <h4 className="text-xs font-mono font-black tracking-widest text-[#D4AF37] uppercase">
                      REVENUS EN TEMPS RÉEL
                    </h4>
                    <button
                      onClick={() => {
                        setActiveSidebarTab("revenues");
                        try { audioSynth.playTamTam(false); } catch(e){}
                      }}
                      className="text-[9.5px] font-mono text-zinc-400 hover:text-white font-extrabold"
                    >
                      Voir tout
                    </button>
                  </div>

                  <div className="text-center pt-1.5">
                    <strong className="text-2xl font-sans font-black text-white block leading-none">
                      2 450 000 FCFA
                    </strong>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase mt-1 block">
                      +12,4% vs hier
                    </span>
                  </div>

                  {/* Horizontal progress bars with golden fillings */}
                  <div className="space-y-2">
                    {[
                      { label: "Aujourd'hui", value: "2.45M", percent: 35 },
                      { label: "Hier", value: "2.18M", percent: 31 },
                      { label: "Cette semaine", value: "14.2M", percent: 68 },
                      { label: "Ce mois", value: "23.85M", percent: 92 },
                    ].map((bar, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono uppercase text-zinc-400 font-black">
                          <span>{bar.label}</span>
                          <span className="text-[#D4AF37]">{bar.value}</span>
                        </div>
                        <div className="w-full bg-zinc-950 border border-zinc-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#D4AF37] h-full rounded-full shadow-[0_0_8px_rgba(212,175,55,0.7)]"
                            style={{ width: `${bar.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveSidebarTab("revenues")}
                    className="w-full border border-[#D4AF37]/35 hover:bg-[#D4AF37]/10 py-2.5 rounded-xl text-[10px] font-mono font-black uppercase text-[#D4AF37] tracking-widest cursor-pointer mt-1"
                  >
                    VOIR TOUS LES REVENUS &gt;
                  </button>
                </div>

              </div>

              {/* GRID ROW 3: RÉPARTITION PAR PAYS + ACTIVITÉS RÉCENTES + SANTÉ DU SYSTÈME */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. RÉPARTITION PAR PAYS (PIECHART WITH MAP CENTRAL OVERLAY) */}
                <div className="bg-black/45 border border-[#D4AF37]/15 rounded-3xl p-5 text-left flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <h4 className="text-xs font-mono font-black tracking-widest text-[#D4AF37] uppercase">
                      RÉPARTITION PAR PAYS
                    </h4>
                    <button
                      onClick={() => alert("📊 Répartition détaillée d'excellence chargée.")}
                      className="text-[9.5px] font-mono text-zinc-400 hover:text-white font-bold"
                    >
                      Voir détails
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {/* Left flag list */}
                    <div className="space-y-1 text-[10px] font-sans font-bold flex-1">
                      <div className="flex items-center gap-1.5 justify-start">
                        <span>🇨🇮</span>
                        <span className="text-zinc-300">Côte d'Ivoire (65%)</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-start">
                        <span>🇫🇷</span>
                        <span className="text-zinc-500">France (15%)</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-start">
                        <span>🇸🇳</span>
                        <span className="text-zinc-500">Sénégal (10%)</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-start">
                        <span>🇨🇲</span>
                        <span className="text-zinc-500">Cameroun (5%)</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-start">
                        <span>🇺🇸</span>
                        <span className="text-zinc-500">USA (3%)</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-start">
                        <span>🏴</span>
                        <span className="text-zinc-500">Autres (2%)</span>
                      </div>
                    </div>

                    {/* Donut with Africa map center overlay */}
                    <div className="relative w-32 h-32 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={36}
                            outerRadius={48}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Map overlay inside donut center hole */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg viewBox="0 0 100 100" className="w-10 h-10 fill-[#D4AF37] opacity-80 filter drop-shadow-[0_0_6px_rgba(212,175,55,0.45)]">
                          <path d="M47,20 C49,20 54,23 57,25 C60,26 63,24 65,22 C67,20 74,21 76,23 C78,25 74,33 71,35 C68,36 67,40 68,42 C69,44 70,47 67,49 C64,51 61,51 59,53 C57,55 58,58 58,60 C58,62 55,65 52,69 C49,73 48,77 48,79 C48,81 44,79 43,76 C42,73 44,70 41,64 C38,58 35,55 33,53 C31,51 28,50 24,48 C20,46 17,44 20,41 C23,38 27,40 31,31 C35,22 41,21 44,21 Z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. ACTIVITÉS RÉCENTES (REAL-TIME NOTIFICATIONS TRIGGER) */}
                <div className="bg-black/45 border border-[#D4AF37]/15 rounded-3xl p-5 text-left flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <h4 className="text-xs font-mono font-black tracking-widest text-[#D4AF37] uppercase">
                      ACTIVITÉS RÉCENTES
                    </h4>
                    <button
                      onClick={() => {
                        setActiveSidebarTab("logs");
                        try { audioSynth.playTamTam(false); } catch(e){}
                      }}
                      className="text-[9.5px] font-mono text-zinc-400 hover:text-white font-bold"
                    >
                      Voir tout
                    </button>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[220px]">
                    {[
                      { id: "ac_1", title: "Validation Gombo ID", desc: "Kouadio David", time: "Il y a 2 min" },
                      { id: "ac_2", title: "Nouvelle opportunité", desc: "Soirée privée - Hôtel Ivoire", time: "Il y a 7 min" },
                      { id: "ac_3", title: "Nouveau membre", desc: "Aminata Fofana", time: "Il y a 12 min" },
                      { id: "ac_4", title: "Revenue reçu", desc: "Boost - Chris Le Leader", time: "Il y a 18 min" }
                    ].map((a) => (
                      <div key={a.id} className="p-2 bg-zinc-950/70 border border-zinc-900/60 rounded-xl flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] flex-shrink-0 animate-ping" />
                        <div className="flex-1">
                          <strong className="text-xs font-sans text-white block leading-none">{a.title}</strong>
                          <span className="text-[9px] text-[#D4AF37] font-mono font-black mt-1 uppercase block leading-none">{a.desc}</span>
                        </div>
                        <span className="text-[8.5px] font-mono text-zinc-500 flex-shrink-0">{a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. SANTÉ DU SYSTÈME */}
                <div className="bg-black/45 border border-[#D4AF37]/15 rounded-3xl p-5 text-left flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <h4 className="text-xs font-mono font-black tracking-widest text-[#D4AF37] uppercase">
                      SANTÉ DU SYSTÈME
                    </h4>
                    <div className="flex items-center gap-1 text-[8px] font-mono bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded uppercase font-bold border border-[#D4AF37]/20">
                      Inviolable
                    </div>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between border-b border-zinc-900/60 pb-1 flex-wrap">
                      <span className="text-zinc-500 font-bold">📂 Base de données</span>
                      <span className="text-emerald-400 font-black uppercase">En ligne</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900/60 pb-1 flex-wrap">
                      <span className="text-zinc-500 font-bold">💻 Serveurs</span>
                      <span className="text-emerald-400 font-black uppercase">En ligne</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900/60 pb-1 flex-wrap">
                      <span className="text-zinc-500 font-bold">☁️ Stockage</span>
                      <span className="text-emerald-400 font-black">87% utilisé</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900/60 pb-1 flex-wrap">
                      <span className="text-zinc-500 font-bold font-bold">🛡️ Sécurité</span>
                      <span className="text-emerald-400 font-black uppercase">Protégée</span>
                    </div>
                    <div className="flex justify-between flex-wrap">
                      <span className="text-zinc-500 font-bold">🔌 API</span>
                      <span className="text-emerald-400 font-black uppercase">Opérationnelle</span>
                    </div>
                  </div>

                  {/* Two status blocks */}
                  <div className="grid grid-cols-2 gap-2 text-center select-none pt-1">
                    <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-900">
                      <span className="text-[8px] uppercase font-mono text-zinc-500 block">Uptime</span>
                      <strong className="text-xs font-mono text-emerald-400 font-black block mt-1">99.98%</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-900">
                      <span className="text-[8px] uppercase font-mono text-zinc-500 block">Temps de réponse</span>
                      <strong className="text-xs font-mono text-emerald-400 font-black block mt-1">186ms</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* GRID ROW 4: JOURNAL IMPÉRIAL + EMPIRE BANNER + PERSONAL NOTES */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. JOURNAL IMPÉRIAL (AUDIT LOGS MODULE) */}
                <div className="bg-black/45 border border-[#D4AF37]/15 rounded-3xl p-5 text-left flex flex-col justify-between space-y-4 md:col-span-1">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <h4 className="text-xs font-mono font-black tracking-widest text-[#D4AF37] uppercase">
                      JOURNAL IMPÉRIAL
                    </h4>
                    <button
                      onClick={() => {
                        setActiveSidebarTab("logs");
                        try { audioSynth.playTamTam(false); } catch(e){}
                      }}
                      className="text-[9.5px] font-mono text-zinc-400 hover:text-white font-bold"
                    >
                      Voir tout
                    </button>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[170px] font-mono text-[9.5px]">
                    {[
                      { action: "Connexion Fondateur", actor: "John Sylvestre H.", time: "11:04", type: "royal" },
                      { action: "Validation Gombo ID", actor: "Chris Le Leader", time: "10:58", type: "info" },
                      { action: "Annonce globale envoyée", actor: "Nouvelle fonctionnalité", time: "10:45", type: "info" },
                      { action: "Rôle modifié", actor: "Admin -> Super Admin", time: "10:30", type: "warning" }
                    ].map((log, idx) => (
                      <div key={idx} className="flex justify-between items-center p-1.5 border-b border-zinc-900/40">
                        <div className="flex flex-col text-left">
                          <span className={`font-black ${log.type === "royal" ? "text-[#D4AF37]" : "text-white"}`}>{log.action}</span>
                          <span className="text-zinc-500 text-[8.5px]">{log.actor}</span>
                        </div>
                        <span className="text-zinc-400">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. AFRIGOMBO EMPIRE SLOGAN BANNER */}
                <div className="bg-black/85 border border-[#D4AF37]/30 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden h-[240px] md:h-auto select-none md:col-span-1">
                  {/* Glowing background rays */}
                  <div className="absolute inset-0 bg-radial-gradient from-[#D4AF37]/10 via-transparent to-transparent opacity-80 pointer-events-none" />
                  
                  <div className="relative z-10 space-y-4 max-w-[240px]">
                    <div className="w-12 h-12 rounded-full border border-[#D4AF37]/50 bg-black flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                      <Crown className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-display font-black tracking-wider text-sm leading-tight uppercase">
                        AFRIGOMBO N'EST PAS UNE PLATEFORME.
                      </p>
                      <p className="text-[#D4AF37] font-display font-black tracking-widest text-base uppercase">
                        C'EST UN EMPIRE.
                      </p>
                    </div>
                    <span className="text-[11px] block text-zinc-500 font-mono italic font-bold">
                      Le Fondateur
                    </span>
                  </div>
                </div>

                {/* 3. NOTES PERSONNELLES CONTAINER */}
                <div className="bg-black/45 border border-[#D4AF37]/15 rounded-3xl p-5 text-left flex flex-col justify-between space-y-4 md:col-span-1">
                  <div className="border-b border-zinc-900 pb-2">
                    <h4 className="text-xs font-mono font-black tracking-widest text-[#D4AF37] uppercase">
                      NOTES PERSONNELLES
                    </h4>
                  </div>

                  <div className="flex-1 w-full pt-1.5">
                    <textarea
                      value={personalNotes}
                      onChange={(e) => setPersonalNotes(e.target.value)}
                      placeholder="Ajouter une note de l'empire..."
                      className="w-full h-[100px] bg-zinc-950 border border-zinc-900/60 rounded-xl p-3 text-xs font-mono text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:border-[#D4AF37]/40 resize-none"
                    />
                  </div>

                  <button
                    onClick={savePersonalNotes}
                    className="w-full bg-transparent hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black hover:border-transparent border border-[#D4AF37]/35 py-2.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    ENREGISTRER
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* --- THE SUB-TAB VIEWPORT INJECTION LAYER --- */}
          
          {/* USER MANAGEMENT TAB VIEW */}
          {activeSidebarTab === "users" && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="border-b border-[#D4AF37]/20 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-display font-black text-[#D4AF37] uppercase">GESTION DES MEMBRES</h3>
                  <p className="text-zinc-500 text-xs mt-1">Supervisez tous les artistes inscrits et appliquez des décrets souverains.</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={localUserSearch}
                    onChange={(e) => setLocalUserSearch(e.target.value)}
                    placeholder="Filtrer par nom, email..."
                    className="w-full bg-zinc-950/80 border border-zinc-900 rounded-xl py-1.5 pl-9 pr-4 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37]/40"
                  />
                </div>
              </div>

              {/* Members listing table */}
              <div className="bg-black/60 border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-zinc-800 text-[10px] font-mono uppercase text-zinc-500 font-black">
                        <th className="p-4">Artiste</th>
                        <th className="p-4">Commune</th>
                        <th className="p-4">Statut Gombo ID</th>
                        <th className="p-4">Actions Souveraines</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 text-xs">
                      {liveUsers
                        .filter((u) => {
                          const sq = localUserSearch.toLowerCase().trim();
                          if (!sq) return true;
                          return (
                            (u.name && u.name.toLowerCase().includes(sq)) ||
                            (u.artisticName && u.artisticName.toLowerCase().includes(sq)) ||
                            (u.email && u.email.toLowerCase().includes(sq)) ||
                            (u.commune && u.commune.toLowerCase().includes(sq))
                          );
                        })
                        .map((u) => (
                        <tr key={u.id} className="hover:bg-zinc-950/40">
                          <td className="p-4 font-bold text-white">
                            <div>
                              <span>{u.artisticName || u.name}</span>
                              <span className="block text-[10px] text-zinc-500 font-mono italic font-normal mt-0.5">{u.email}</span>
                            </div>
                          </td>
                          <td className="p-4 text-zinc-300 font-mono text-[11px]">{u.commune || "Cocody"}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[9px] font-mono font-black uppercase ${
                              u.isCertified ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30" : "bg-zinc-900 text-zinc-500"
                            }`}>
                              {u.isCertified ? "Certifié GOMBO ID Or" : "Standard"}
                            </span>
                          </td>
                          <td className="p-4 flex gap-2">
                            {!u.isCertified && (
                              <button
                                onClick={() => certifyUserDirectly(u.id, u.name)}
                                className="px-2.5 py-1 bg-[#D4AF37] text-black text-[9.5px] font-mono font-black uppercase rounded-lg cursor-pointer"
                              >
                                Certifier GOMBO ID
                              </button>
                            )}
                            
                            {u.status === "suspended" ? (
                              <button
                                onClick={async () => {
                                  const updated = liveUsers.map((usr) => usr.id === u.id ? { ...usr, status: "active" as any } : usr);
                                  setLiveUsers(updated);
                                  setUsers(updated);
                                  if (db) {
                                    await updateDoc(doc(db, "users", u.id), { status: "active" });
                                  }
                                  await logToImperialJournal(`Réhabilitation de l'artiste : ${u.name}`, "info");
                                  alert(`🕊️ L'artiste ${u.name} a été réhabilité(e) avec succès !`);
                                  try { audioSynth.playValidationSuccess(); } catch (e) {}
                                }}
                                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black text-emerald-400 text-[9.5px] font-mono font-black uppercase rounded-lg cursor-pointer"
                              >
                                Réhabiliter
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  const updated = liveUsers.map((usr) => usr.id === u.id ? { ...usr, status: "suspended" as any } : usr);
                                  setLiveUsers(updated);
                                  setUsers(updated);
                                  if (db) {
                                    await updateDoc(doc(db, "users", u.id), { status: "suspended" });
                                  }
                                  await logToImperialJournal(`Bannissement souverain : ${u.name}`, "danger");
                                  alert(`🛡️ L'artiste ${u.name} a été suspendu pour préserver la paix.`);
                                  try { audioSynth.playValidationSuccess(); } catch (e) {}
                                }}
                                className="px-2.5 py-1 bg-red-500/10 hover:bg-rose-600 hover:text-black text-rose-400 text-[9.5px] font-mono font-black uppercase rounded-lg cursor-pointer"
                              >
                                Suspendre
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* GOMBO ID TAB VIEW */}
          {activeSidebarTab === "gombo_id" && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="border-b border-[#D4AF37]/20 pb-4">
                <h3 className="text-lg font-display font-black text-[#D4AF37] uppercase">DOSSIERS GOMBO ID</h3>
                <p className="text-zinc-500 text-xs mt-1">Garantissez l'excellence en validant les passeports numériques d'identité certifiée d’Abidjan.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveUsers.filter(u => u.kycStatus === "pending").length === 0 ? (
                  <div className="bg-zinc-950/60 p-8 border border-zinc-900 rounded-3xl text-center space-y-2 col-span-2">
                    <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
                    <strong className="text-white text-sm block font-mono">Dossiers d'excellence à jour</strong>
                    <p className="text-zinc-500 text-xs">Tous les postulants d'Abidjan ont été validés.</p>
                  </div>
                ) : (
                  liveUsers.filter(u => u.kycStatus === "pending").map((u) => (
                    <div key={u.id} className="p-5 bg-zinc-950/80 border border-zinc-900 rounded-2xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-white text-sm block font-sans font-bold">{u.artisticName || u.name}</strong>
                          <span className="text-[10px] text-[#D4AF37] font-mono uppercase">{u.commune || "Cocody"} - Artiste</span>
                        </div>
                        <span className="bg-amber-950 text-amber-500 text-[8px] font-mono font-bold px-2 py-0.5 rounded tracking-widest uppercase">
                          En Attente
                        </span>
                      </div>

                      <div className="bg-black/60 p-3 rounded-lg border border-zinc-900 text-[11px] font-mono text-zinc-400 space-y-1">
                        <div>Email : {u.email}</div>
                        <div>Role d'orchestre : Talent Certifié</div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => certifyUserDirectly(u.id, u.name)}
                          className="flex-1 py-2 bg-[#D4AF37] text-black text-xs font-mono font-black uppercase rounded-xl cursor-pointer"
                        >
                          Approuver et Couronner d'Or
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* REVENUES TAB VIEW (COMMISSION SETTINGS & COFFER LEDGER) */}
          {activeSidebarTab === "revenues" && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="border-b border-[#D4AF37]/20 pb-4">
                <h3 className="text-lg font-display font-black text-[#D4AF37] uppercase">FINANCES ET COMMISSIONS</h3>
                <p className="text-zinc-500 text-xs mt-1">Régulez le prélèvement de caisse souverain dévolu au pilotage d'écosystème d'or.</p>
              </div>

              {/* Commission slide bar card */}
              <div className="bg-zinc-950/80 border border-[#D4AF37]/20 p-6 rounded-3xl space-y-6 max-w-xl">
                <div>
                  <h4 className="text-sm font-mono uppercase tracking-widest text-[#D4AF37] font-black">
                    Ajustement de Caisse
                  </h4>
                  <p className="text-zinc-500 text-xs mt-1">Régulation instantanée du taux applicable aux contrats et séquestres d'Abidjan.</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 font-mono text-xs">Taux de commission :</span>
                  <span className="text-[#D4AF37] font-mono text-xl font-black">{systemCommissionRate}%</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const next = Math.max(1, systemCommissionRate - 5);
                      setSystemCommissionRate(next);
                      logToImperialJournal(`Taux de commission abaissé à : ${next}%`, "info");
                    }}
                    className="flex-1 py-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-mono font-bold transition-all"
                  >
                    - 5%
                  </button>
                  <button
                    onClick={() => {
                      const next = Math.min(50, systemCommissionRate + 5);
                      setSystemCommissionRate(next);
                      logToImperialJournal(`Taux de commission haussé à : ${next}%`, "warning");
                    }}
                    className="flex-1 py-2 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black hover:border-transparent border border-[#D4AF37]/35 text-xs font-mono font-black transition-all"
                  >
                    + 5%
                  </button>
                </div>
              </div>

              {/* Transactions list */}
              <div className="bg-black/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                <strong className="text-white text-xs block font-mono uppercase tracking-widest text-[#D4AF37]">Régis de transactions réelles</strong>
                <div className="space-y-2 max-h-[300px] overflow-y-auto font-mono text-xs text-left">
                  {liveTransactions.map((t, idx) => (
                    <div key={idx} className="p-2.5 bg-zinc-950/60 border border-zinc-900 rounded-xl flex justify-between items-center">
                      <div>
                        <span>{t.description || "N/A"}</span>
                        <span className="block text-[#D4AF37] text-[10px] mt-0.5 uppercase">{t.userName}</span>
                      </div>
                      <strong className="text-emerald-400 text-sm">+{t.amount.toLocaleString()} FCFA</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB VIEW */}
          {activeSidebarTab === "security" && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="border-b border-[#D4AF37]/20 pb-4">
                <h3 className="text-lg font-display font-black text-[#D4AF37] uppercase">SÉCURITÉ & VEILLE (BOUCLIER SOUVERAIN)</h3>
                <p className="text-zinc-500 text-xs mt-1">Supervisez l'intégrité constitutionnelle, le pare-feu et les signalements d'abus d'Abidjan.</p>
              </div>

              {/* Action grid button triggers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                <button
                  onClick={async () => {
                    setLiveAlerts([]);
                    setAlerts([]);
                    await logToImperialJournal("Amnistie d'abus souveraine accordée", "royal");
                    alert("Sweep complet ! Le registre des alertes critiques d'Abidjan a été lavé.");
                    try { audioSynth.playValidationSuccess(); } catch(e){}
                  }}
                  className="p-5 rounded-2xl bg-gradient-to-r from-red-950/20 to-black border border-red-900/30 hover:border-red-500 hover:bg-black/90 text-left space-y-2 transition-all cursor-pointer group"
                >
                  <ShieldCheck className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />
                  <strong className="text-white text-sm block font-mono">Purger les Alertes de Sécurité</strong>
                  <p className="text-zinc-500 text-xs">Exécutez une amnistie générale et lavez l'historique d'inconduites.</p>
                </button>
              </div>
            </div>
          )}

          {/* IMPERIAL LOGS TAB */}
          {activeSidebarTab === "logs" && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="border-b border-[#D4AF37]/20 pb-4">
                <h3 className="text-lg font-display font-black text-[#D4AF37] uppercase">JOURNAL IMPÉRIAL Ledger</h3>
                <p className="text-zinc-500 text-xs mt-1">Consultez en temps réel le grand registre d'audit des ordonnances et délibérations du Trône.</p>
              </div>

              <div className="bg-black/60 border border-zinc-900 rounded-3xl p-5 space-y-4 max-w-3xl">
                <strong className="text-[#D4AF37] text-xs font-mono uppercase tracking-widest block">GRAND REGISTRE D'AUDIT SOUVERAIN</strong>
                <div className="space-y-3 font-mono text-xs max-h-[400px] overflow-y-auto">
                  {[
                    { timestamp: new Date().toISOString(), action: "Déploiement du Cabinet du Trône Royal d'Or", type: "royal"},
                    { timestamp: new Date(Date.now() - 360000).toISOString(), action: "Liaison BDD & monitoring actée", type: "info"},
                  ].map((log, idx) => (
                    <div key={idx} className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl flex justify-between items-start gap-3 flex-wrap">
                      <div className="flex-1">
                        <span className="text-zinc-500 block text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <strong className={`block ${log.type === "royal" ? "text-[#D4AF37]" : "text-white"} mt-1`}>{log.action}</strong>
                      </div>
                      <span className="text-[9px] text-[#D4AF37]/65 block mt-1">John. F</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* --- FLOATING MODAL: ADD SUPER ADMIN --- */}
      {addAdminModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] flex justify-center items-center p-6">
          <div className="w-full max-w-sm bg-zinc-950 border border-[#D4AF37]/35 rounded-3xl p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <strong className="text-white text-sm font-mono uppercase tracking-widest text-[#D4AF37]">ÉLEVATION D'ADMIN</strong>
              <button onClick={() => setAddAdminModalOpen(false)} className="text-zinc-550 hover:text-white font-black text-xs font-mono">Fermer</button>
            </div>
            
            <p className="text-xs text-zinc-400">Saisissez l'adresse e-mail de l'utilisateur à nommer au Conseil des Administrateurs.</p>
            
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Adresse E-mail impériale</label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="Ex : sylvestrehounkpevi777@gmail.com"
                className="w-full bg-[#030303] border border-zinc-850 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37]"
                autoFocus
              />
            </div>

            <button
              onClick={handleAddSuperAdminEmail}
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-[#030303] text-xs font-mono font-black uppercase tracking-wider cursor-pointer"
            >
              ÉLEVER LE MEMBRE
            </button>
          </div>
        </div>
      )}

      {/* --- FLOATING MODAL: PROPAGATE ANNOUNCEMENT --- */}
      {announcementModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] flex justify-center items-center p-6">
          <div className="w-full max-w-md bg-zinc-950 border border-[#D4AF37]/35 rounded-3xl p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <strong className="text-white text-sm font-mono uppercase tracking-widest text-[#D4AF37]">PROMULGUER UN DÉCRET</strong>
              <button onClick={() => setAnnouncementModalOpen(false)} className="text-zinc-550 hover:text-white font-black text-xs font-mono">Fermer</button>
            </div>

            <p className="text-xs text-zinc-400">Rédigez le texte de l’ordonnance impérative destiné à être diffusé sur tout le réseau d'Abidjan.</p>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Cible du Décret</label>
              <select
                value={announcementTarget}
                onChange={(e) => setAnnouncementTarget(e.target.value as any)}
                className="w-full bg-[#030303] border border-zinc-850 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none"
              >
                <option value="all">Tous les Talents d'Abidjan</option>
                <option value="admins">Membres du Conseil des Admins</option>
                <option value="certified">Uniquement les Artistes Certifiés GOMBO ID</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Texte Ordonnance</label>
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Saisissez le texte sacré..."
                className="w-full h-24 bg-[#030303] border border-zinc-850 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37] resize-none"
              />
            </div>

            <button
              onClick={handlePromulgateAnnouncement}
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-black text-xs font-mono font-black uppercase tracking-wider cursor-pointer"
            >
              PROPAGER EN TEMPS RÉEL
            </button>
          </div>
        </div>
      )}

      {/* --- FLOATING MODAL: SEND GLOBAL PUSH NOTIFICATION --- */}
      {pushNotificationModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] flex justify-center items-center p-6">
          <div className="w-full max-w-sm bg-zinc-950 border border-[#D4AF37]/35 rounded-3xl p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <strong className="text-white text-sm font-mono uppercase tracking-widest text-[#D4AF37]">TRANSMETTRE UNE NOTIFICATION</strong>
              <button onClick={() => setPushNotificationModalOpen(false)} className="text-zinc-550 hover:text-white font-black text-xs font-mono">Fermer</button>
            </div>

            <p className="text-xs text-zinc-400 font-sans">Lancer une notification instantanée d'importance sur toutes les applications d'artiste.</p>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase">Titre Notif</label>
              <input
                type="text"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="Ex : Urgence d'Orchestre !"
                className="w-full bg-[#030303] border border-zinc-850 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase font-sans">Message</label>
              <textarea
                value={notificationText}
                onChange={(e) => setNotificationText(e.target.value)}
                placeholder="Détails du message d'or..."
                className="w-full h-20 bg-[#030303] border border-zinc-850 rounded-xl p-3 text-xs font-mono text-white focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={handleSendPushNotification}
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-black text-xs font-mono font-black uppercase tracking-wider cursor-pointer font-sans"
            >
              TRANSMETTRE LA SOUVERAINETÉ
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// Minimal stub components to satisfy fast compiles
function LayoutDashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
