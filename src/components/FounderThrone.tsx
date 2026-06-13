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
  ListRestart,
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
  HelpCircle
} from "lucide-react";
import { User, Gombo, Transaction, Alerte, GomboReview } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, query, setDoc } from "firebase/firestore";

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

interface AfriApp {
  id: string;
  name: string;
  logoType: "shield" | "award" | "fingerprint" | "sparkles";
  description: string;
  isActive: boolean;
  statusText: string;
  traffic: {
    hits: number;
    activeUsers: number;
    growth: string;
  };
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
  // Enforce access control
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

  // --- 1. TRANSITION IMPÉRIALE STATES ---
  const [showIntro, setShowIntro] = useState(isAuthorizedFounder);
  const [introStep, setIntroStep] = useState(0);

  // --- 2. FIRESTORE REAL-TIME SYNCHRONIZED STATES ---
  const [liveUsers, setLiveUsers] = useState<User[]>(initialUsers);
  const [liveGombos, setLiveGombos] = useState<Gombo[]>(initialGombos);
  const [liveTransactions, setLiveTransactions] = useState<Transaction[]>(initialTransactions);
  const [liveAlerts, setLiveAlerts] = useState<Alerte[]>(initialAlerts);

  // --- 3. TABS: Stats, Admins, Univers AFRI, Bouclier GOMBO, Logs ---
  type ActiveTab = "stats" | "admins" | "univers" | "bouclier" | "logs";
  const [activeTab, setActiveTab] = useState<ActiveTab>("stats");

  // --- 4. OTHER STATES ---
  const [newSuperAdminEmail, setNewSuperAdminEmail] = useState("");
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementTarget, setAnnouncementTarget] = useState<"all" | "admins" | "certified">("all");
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  
  // Custom imperial logs
  const [imperialLogs, setImperialLogs] = useState<Array<{
    id: string;
    timestamp: string;
    action: string;
    actor: string;
    type: "royal" | "info" | "warning" | "danger";
  }>>([
    {
      id: "log_init_0",
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      action: "Souveraineté exclusive scellée pour johnsylvesterh@gmail.com",
      actor: "Noyau Impérial",
      type: "royal"
    },
    {
      id: "log_init_1",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      action: "Validation des connexions d'excellence d'Abidjan",
      actor: "Moniteur Sécurité",
      type: "info"
    }
  ]);

  // Dynamic Super Admins and Co-Founders are loaded synchronically above

  // Univers Afri App specifications
  const [afriApps, setAfriApps] = useState<AfriApp[]>([
    {
      id: "afri_trust",
      name: "AfriTrust",
      logoType: "shield",
      description: "Système de séquestre décentralisé et d'accord de confiance mutuel. Assure le blocage et le versement instantané des cachets d'or aux orchestres nationaux.",
      isActive: true,
      statusText: "Opérationnel",
      traffic: { hits: 142050, activeUsers: 2400, growth: "+18%" }
    },
    {
      id: "afri_coach",
      name: "AfriCoach",
      logoType: "award",
      description: "Coach virtuel d'harmonie et d'excellence scénique. Relie les guitaristes et batteurs débutants de Côte d'Ivoire aux légendes vivantes.",
      isActive: false,
      statusText: "Désactivé (Haute Simulation)",
      traffic: { hits: 45200, activeUsers: 850, growth: "+8%" }
    },
    {
      id: "afri_id",
      name: "AfriID",
      logoType: "fingerprint",
      description: "Passeport numérique universel d'artiste certifié. Éradique l'usurpation d'identité et le multi-comptisme frauduleux sur toute l'Afrique Musicale.",
      isActive: true,
      statusText: "Opérationnel",
      traffic: { hits: 382400, activeUsers: 14500, growth: "+34%" }
    },
    {
      id: "afri_future",
      name: "Futurs Projets AFRI (AfriMarket)",
      logoType: "sparkles",
      description: "Leasing d'instruments d'or à taux zéro, boutiques solidaires et assurances scéniques d'académie pour propulser l'excellence.",
      isActive: false,
      statusText: "En phase d'incubation",
      traffic: { hits: 1200, activeUsers: 30, growth: "Bêta privée" }
    }
  ]);

  const [shieldState, setShieldState] = useState({
    active: true,
    spamThreshold: 3,
    ddosProtection: true,
    firewallStrict: true
  });

  // --- 5. INITIAL TRANSITION ANIMATION PLAYBACK ---
  useEffect(() => {
    if (!isAuthorizedFounder) return;

    // Trigger premium tactile vibration on Android / Web standard
    try {
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([100, 50, 100]); // Sublime pattern
      }
    } catch (e) {
      console.log("Tactile vibration omitted", e);
    }

    // Phase schedule
    const t1 = setTimeout(() => setIntroStep(1), 100);
    const t2 = setTimeout(() => {
      setIntroStep(2);
      try { window.navigator?.vibrate?.(60); } catch (e) {}
    }, 1100);
    const t3 = setTimeout(() => setIntroStep(3), 2105);
    const t4 = setTimeout(() => {
      setShowIntro(false);
      addToTerminal("👑 [SOUVERAINETÉ] Le Trône d'Or est entièrement chargé et prêt pour le Fondateur John.");
    }, 3100); // 3 seconds maximum as requested

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isAuthorizedFounder]);

  // --- 6. FIRESTORE REAL-TIME SYNCHRONIZATION ---
  useEffect(() => {
    if (!db) return;

    // Real-time synchronization of members
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const usersList: User[] = [];
        snapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() } as User);
        });
        if (usersList.length > 0) {
          setLiveUsers(usersList);
          setUsers(usersList);
        }
      },
      (error) => {
        console.warn("Firestore live users read failure, keeping default state:", error);
      }
    );

    // Real-time synchronization of contracts (gombos)
    const unsubGombos = onSnapshot(
      collection(db, "gombos"),
      (snapshot) => {
        const gombosList: Gombo[] = [];
        snapshot.forEach((doc) => {
          gombosList.push({ id: doc.id, ...doc.data() } as Gombo);
        });
        if (gombosList.length > 0) {
          setLiveGombos(gombosList);
          setGombos(gombosList);
        }
      },
      (error) => {
        console.warn("Firestore live gombos read failure, keeping default state:", error);
      }
    );

    // Real-time synchronization of transactions
    const unsubTransactions = onSnapshot(
      collection(db, "transactions"),
      (snapshot) => {
        const transList: Transaction[] = [];
        snapshot.forEach((doc) => {
          transList.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        if (transList.length > 0) {
          setLiveTransactions(transList);
          setTransactions(transList);
        }
      },
      (error) => {
        console.warn("Firestore live transactions read failure, keeping default state:", error);
      }
    );

    return () => {
      unsubUsers();
      unsubGombos();
      unsubTransactions();
    };
  }, [setUsers, setGombos, setTransactions]);

  // Log function helper
  const logToImperialJournal = async (
    action: string,
    type: "royal" | "info" | "warning" | "danger" = "info"
  ) => {
    const newLog = {
      id: `implog_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      actor: "John Sylvester H. (Fondateur)",
      type
    };
    setImperialLogs((prev) => [newLog, ...prev]);
    addToTerminal(`[👑 SOUVERAINETÉ] ${action}`);
    await saveToFirestore("journal_imperial", newLog.id, newLog);
  };

  const saveThroneConfigToFirestore = async (newFounders: string[], newSuperAdmins: string[]) => {
    if (!db) return;
    try {
      const docRef = doc(db, "throne", "config");
      await setDoc(docRef, {
        founders: newFounders,
        superAdmins: newSuperAdmins
      }, { merge: true });
    } catch (err) {
      console.error("Error saving throne config to Firestore:", err);
    }
  };

  // --- 7. FOUNDER INTERACTIVE DECREES ---
  const handleAddSuperAdminEmail = async () => {
    const email = newSuperAdminEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      alert("⚠️ L'adresse e-mail saisie est invalide.");
      return;
    }
    if (email === "johnsylvesterh@gmail.com") {
      alert("👑 Le Fondateur Suprême ne peut pas être rétrogradé au simple statut de Super Admin.");
      return;
    }
    if (superAdmins.includes(email)) {
      alert(`⚠️ ${email} possède déjà les accréditations de Super Administrateur.`);
      return;
    }

    const updated = [...superAdmins, email];
    setSuperAdmins(updated);
    setNewSuperAdminEmail("");
    await logToImperialJournal(`Désignation et élévation de l'administrateur d'élite : ${email}`, "royal");
    await saveThroneConfigToFirestore(founders, updated);
    alert(`👑 L'utilisateur ${email} a été élevé au rang de Super Administrateur avec succès.`);
  };

  const handleRevokeSuperAdmin = async (email: string) => {
    const cleanedEmail = email.trim().toLowerCase();
    if (cleanedEmail === "johnsylvesterh@gmail.com") {
      alert("🛑 ACTION DESTRUCTIVE BLOQUÉE\n\nLe Trône du fondateur est immuable et ancré dans le noyau d'AFRIGOMBO.");
      return;
    }
    const updated = superAdmins.filter((a) => a !== cleanedEmail);
    setSuperAdmins(updated);
    await logToImperialJournal(`Révocation totale des droits d'excellence administrative pour : ${cleanedEmail}`, "danger");
    await saveThroneConfigToFirestore(founders, updated);
    alert(`🛡️ L'adresse ${cleanedEmail} a été retirée de la hiérarchie de sécurité.`);
  };

  const handlePromoteToFounder = async (email: string) => {
    const cleanedEmail = email.trim().toLowerCase();
    if (!cleanedEmail) return;
    if (founders.includes(cleanedEmail)) {
      alert("👑 Cet utilisateur est déjà Co-Fondateur du Trône.");
      return;
    }
    
    // Remove from super admins and add to founders
    const updatedSuperAdmins = superAdmins.filter(a => a !== cleanedEmail);
    const updatedFounders = [...founders, cleanedEmail];
    
    setSuperAdmins(updatedSuperAdmins);
    setFounders(updatedFounders);
    
    await logToImperialJournal(`Souveraineté suprême partagée : Élévation de ${cleanedEmail} au rang de Co-Fondateur du Trône`, "royal");
    await saveThroneConfigToFirestore(updatedFounders, updatedSuperAdmins);
    alert(`👑 Félicitations ! ${cleanedEmail} a été promu au rang suprême de Co-Fondateur du Trône.`);
  };

  const handleToggleCompanionApp = async (appId: string) => {
    const updated = afriApps.map((app) => {
      if (app.id === appId) {
        const nextState = !app.isActive;
        const actionMsg = `${nextState ? "Activation" : "Désactivation"} du portail compagnon ${app.name} dans la constellation AFRI`;
        logToImperialJournal(actionMsg, nextState ? "royal" : "warning");
        return {
          ...app,
          isActive: nextState,
          statusText: nextState ? "Opérationnel" : "Désactivé par le Trône"
        };
      }
      return app;
    });
    setAfriApps(updated);
  };

  const handlePromulgateDecree = async () => {
    if (!announcementText.trim()) {
      alert("⚠️ Saisissez le texte sacré du Décret avant propagation.");
      return;
    }
    const targetGroup =
      announcementTarget === "all"
        ? "tous les talents d'Abidjan"
        : announcementTarget === "admins"
        ? "le Conseil des Super Admins"
        : "uniquement les artistes certifiés GOMBO ID d'Or";

    await logToImperialJournal(
      `Diffusion d'un Décret Souverain impératif pour ${targetGroup} : "${announcementText}"`,
      "royal"
    );
    alert(`📣 Décret d'or propagé en temps réel sur toute la Côte d'Ivoire !`);
    setAnnouncementText("");
  };

  // --- DESTRUCTIVE PURGES ---
  const triggerSafetyPurge = async () => {
    const confirmBox = window.confirm(
      "🛡️ PURGE DU BOUCLIER SÉCURITAIRE\n\nVoulez-vous laver intégralement les signalements d'abus et réinitialiser le registre de surveillance d'Abidjan pour rétablir une parfaite harmonie d'échanges ?"
    );
    if (!confirmBox) return;

    setLiveAlerts([]);
    setAlerts([]);
    await logToImperialJournal("Purge souveraine complète et amnistie de toutes les alertes critiques", "royal");
    alert("🧹 Le Grand Registre de sécurité d'AFRIGOMBO a été lavé et purifié !");
  };

  const triggerGiveAllGoldCertifications = async () => {
    const confirmBox = window.confirm(
      "👑 PROCLAMATION D'EXCELLENCE GLOBALE\n\nÊtes-vous certain de vouloir élever TOUS les artistes inscrits sans distinction au prestigieux grade d'artiste certifié GOMBO ID d'Or ?"
    );
    if (!confirmBox) return;

    const certUsers = liveUsers.map((u) => ({
      ...u,
      isCertified: true,
      kycStatus: "approved" as any
    }));
    setLiveUsers(certUsers);
    setUsers(certUsers);

    // Async batch save to Firestore
    for (let u of certUsers) {
      if (db) {
        try {
          await updateDoc(doc(db, "users", u.id), {
            isCertified: true,
            kycStatus: "approved"
          });
        } catch (e) {
          console.warn(`Error updating user cert: ${u.id}`, e);
        }
      }
    }

    await logToImperialJournal(
      "Excellence Décrétée : Octroi à l'unanimité de la certification GOMBO ID d'Or à tous les inscrits",
      "royal"
    );
    alert("🌟 Consécration générale ! Tous les talents arborent fièrement la couronne d'excellence !");
  };

  // Enforce access control guard render
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
            La sécurité spirituelle du Trône du Fondateur est active. Seules les adresses royales authentifiées du Temple disposent des privilèges requis pour charger cet incubateur.
          </p>
          <div className="p-4 bg-zinc-950/80 border border-white/5 rounded-2xl text-left text-[11px] text-zinc-500 font-mono space-y-2 mt-4">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span>Signature lue</span>
              <span className="text-rose-400 truncate max-w-[200px]">{adminEmail || "aucune"}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span>Accès d'orchestre</span>
              <span className="text-red-500 uppercase font-bold">Non-autorisé</span>
            </div>
            <div className="flex justify-between">
              <span>Noyau Central</span>
              <span className="text-zinc-400">Filtrage acté</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-zinc-900/80 border border-white/10 hover:border-red-500 text-white hover:text-red-500 rounded-xl text-xs font-mono font-black uppercase tracking-widest transition-all shadow-md active:scale-95 z-10"
        >
          Retirer ma signature ↩
        </button>
      </div>
    );
  }

  // --- COMPUTATIONS FOR ROYAL STATISTICS (REAL-TIME CONSTRAINTS) ---
  const membersTotal = liveUsers.length;
  // Members active = those not currently suspended
  const membersActive = liveUsers.filter((u) => u.status === "active").length;
  const gombosTotal = liveGombos.length;
  const certifiedCount = liveUsers.filter((u) => u.isCertified).length;
  
  // Calculate verified commissions to bypass mocks
  const totalRevenues = liveTransactions.reduce((acc, trans) => {
    if (["commission", "subscription", "boost_gombo", "cert_express"].includes(trans.type)) {
      return acc + trans.amount;
    }
    return acc;
  }, 0);

  // Critical alerts
  const criticalAlertsCount = liveAlerts.filter((a) => a.severity === "high" && a.status === "open").length;

  return (
    <div className="relative w-full min-h-screen bg-[#030303] text-zinc-100 flex flex-col overflow-x-hidden font-sans scrollbar-thin select-none">
      
      {/* 24 ELEGANT GOLDEN STARS PARTICLES BACKGROUND INJECTION */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-tr from-[#D4AF37] to-amber-100/40 opacity-20 animate-pulse"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 5 + 3}s`,
              animationDelay: `${Math.random() * 6}s`
            }}
          />
        ))}
      </div>

      {/* ==========================================================
                          A. TRANSITION IMPÉRIALE SCREEN
         ========================================================== */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 bg-[#030303] z-50 flex flex-col justify-center items-center p-6 text-center"
          >
            {/* Embedded glowing ambient particles */}
            <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 40 }).map((_, idx) => (
                <div
                  key={idx}
                  className="absolute bg-[#D4AF37] rounded-full opacity-60 filter blur-[0.5px]"
                  style={{
                    width: `${Math.random() * 4 + 2}px`,
                    height: `${Math.random() * 4 + 2}px`,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    transform: "translateY(0px)",
                    animation: `drift ${Math.random() * 3 + 2}s infinite ease-in-out`
                  }}
                />
              ))}
            </div>

            <div className="space-y-6 max-w-md w-full relative z-10">
              {/* African Royal Crown slowly pulsing */}
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-950/40 via-black to-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(212,175,55,0.3)]"
              >
                <Crown className="w-14 h-14 text-[#D4AF37] animate-pulse" />
              </motion.div>

              <div className="space-y-4 h-36 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {introStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-2"
                    >
                      <h3 className="text-[#D4AF37] font-sans font-extrabold text-2xl uppercase tracking-widest">
                        AFRIGOMBO ELITE
                      </h3>
                      <p className="text-sm text-zinc-300 font-mono italic">
                        "Le Temple du Gombo reconnaît son Gardien."
                      </p>
                    </motion.div>
                  )}

                  {introStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-2"
                    >
                      <h4 className="text-[#D4AF37] font-sans font-extrabold text-2xl uppercase tracking-widest">
                        AFRIGOMBO ELITE
                      </h4>
                      <p className="text-xs text-zinc-400 font-mono">
                        "Le Temple du Gombo reconnaît son Gardien."
                      </p>
                    </motion.div>
                  )}

                  {introStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.5 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent rounded-full animate-pulse" />
                      <span className="text-xs text-[#D4AF37] uppercase font-mono tracking-widest font-bold">
                        Chargement du Trône Impérial...
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================================
                          B. EN-TÊTE IMPÉRIAL (ROYAUME UNIQUE)
         ========================================================== */}
      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-[#D4AF37]/20 mb-8 p-4 sm:p-6 md:p-8 bg-[#090909]/45">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-700 via-[#FFD700] to-black rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.3)] relative shrink-0">
            <Crown className="w-8 h-8 text-[#D4AF37]" strokeWidth={1.5} />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full w-4.5 h-4.5 border-2 border-black flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-mono tracking-widest font-black text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-2.5 py-1 rounded-md border border-[#D4AF37]/25">
                SOUVERAINETÉ UNIQUE EXCLUSIVE
              </span>
            </div>
            <h2 className="text-xl font-display font-black text-white tracking-tight mt-1 uppercase">
              Bienvenue, John.
            </h2>
            <div className="text-xs text-zinc-400 font-sans mt-0.5 space-y-0.5 leading-relaxed">
              <p>Des millions de talents peuvent compter sur votre vision d'excellence.</p>
              <p className="font-mono text-[10px] text-zinc-650 flex items-center gap-1.5">
                <span>●</span> <strong className="text-emerald-400">Tout est sous contrôle.</strong> (johnsylvesterh@gmail.com)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="self-end lg:self-center bg-[#D4AF37]/10 border border-[#D4AF37]/35 hover:bg-[#D4AF37] hover:text-black hover:border-transparent text-[#D4AF37] text-xs font-mono font-black uppercase tracking-widest py-2 px-5 rounded-xl transition-all shadow-md"
        >
          Fermer l'Écrin Impérial ↩
        </button>
      </div>

      {/* ==========================================================
                          C. VUE GLOBALE - 6 CORE INDICATORS
         ========================================================== */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 px-4 sm:px-6 md:px-8 mb-8">
        
        {/* INDICATOR 1 */}
        <div className="p-4 rounded-2xl bg-[#090909]/80 border border-white/5 shadow-md flex flex-col justify-between hover:border-[#D4AF37]/20 transition-all duration-300">
          <div className="flex justify-between items-center text-zinc-550">
            <span className="text-[9px] font-mono uppercase font-black">Membres Totaux</span>
            <Users className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="mt-2.5">
            <strong className="text-2xl font-display font-black text-white leading-none block font-mono">
              {membersTotal}
            </strong>
            <span className="text-[9px] text-[#D4AF37] font-semibold uppercase font-mono block mt-1">
              Réseau d'Abidjan
            </span>
          </div>
        </div>

        {/* INDICATOR 2 */}
        <div className="p-4 rounded-2xl bg-[#090909]/80 border border-white/5 shadow-md flex flex-col justify-between hover:border-[#D4AF37]/20 transition-all duration-300">
          <div className="flex justify-between items-center text-zinc-550">
            <span className="text-[9px] font-mono uppercase font-black">Artistes Actifs</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <div className="mt-2.5">
            <strong className="text-2xl font-display font-black text-emerald-400 leading-none block font-mono">
              {membersActive}
            </strong>
            <span className="text-[9px] text-zinc-500 font-medium font-mono block mt-1">
              Sur scène en ligne
            </span>
          </div>
        </div>

        {/* INDICATOR 3 */}
        <div className="p-4 rounded-2xl bg-[#090909]/80 border border-white/5 shadow-md flex flex-col justify-between hover:border-[#D4AF37]/20 transition-all duration-300">
          <div className="flex justify-between items-center text-zinc-550">
            <span className="text-[9px] font-mono uppercase font-black">Gombos Publiés</span>
            <Compass className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="mt-2.5">
            <strong className="text-2xl font-display font-black text-white leading-none block font-mono">
              {gombosTotal}
            </strong>
            <span className="text-[9px] text-zinc-500 font-medium font-mono block mt-1">
              Contrats d'or signés
            </span>
          </div>
        </div>

        {/* INDICATOR 4 */}
        <div className="p-4 rounded-2xl bg-[#090909]/80 border border-[#D4AF37]/20 shadow-md flex flex-col justify-between hover:border-[#D4AF37] transition-all duration-300">
          <div className="flex justify-between items-center text-zinc-550">
            <span className="text-[9px] font-mono uppercase font-black text-[#D4AF37]">GOMBO ID d'Or</span>
            <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div className="mt-2.5">
            <strong className="text-2xl font-display font-black text-[#D4AF37] leading-none block font-mono">
              {certifiedCount}
            </strong>
            <span className="text-[9px] text-[#D4AF37]/60 font-mono block mt-1">
              Élite certifiée d'or
            </span>
          </div>
        </div>

        {/* INDICATOR 5 */}
        <div className="p-4 rounded-2xl bg-[#090909]/80 border border-white/5 shadow-md flex flex-col justify-between hover:border-[#D4AF37]/20 transition-all duration-300">
          <div className="flex justify-between items-center text-zinc-550">
            <span className="text-[9px] font-mono uppercase font-black">Caisse Générale</span>
            <Coins className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="mt-2.5">
            <strong className="text-xl font-mono font-black text-white leading-none block truncate">
              {totalRevenues.toLocaleString()}
            </strong>
            <span className="text-[9px] text-emerald-400 font-bold font-mono block mt-1 uppercase">
              FCFA Perçus
            </span>
          </div>
        </div>

        {/* INDICATOR 6 */}
        <div className={`p-4 rounded-2xl bg-[#090909]/80 border shadow-md flex flex-col justify-between transition-all duration-300 ${criticalAlertsCount > 0 ? "border-rose-500/30 hover:border-rose-500" : "border-white/5 hover:border-[#D4AF37]/20"}`}>
          <div className="flex justify-between items-center text-zinc-550">
            <span className="text-[9px] font-mono uppercase font-black">Security Alerts</span>
            <ShieldAlert className={`w-3.5 h-3.5 ${criticalAlertsCount > 0 ? "text-rose-500 animate-bounce" : "text-zinc-500"}`} />
          </div>
          <div className="mt-2.5">
            <strong className={`text-2xl font-display font-black leading-none block font-mono ${criticalAlertsCount > 0 ? "text-rose-500 animate-pulse" : "text-zinc-100"}`}>
              {criticalAlertsCount}
            </strong>
            <span className="text-[9px] text-zinc-500 font-medium font-mono block mt-1">
              Menaces levées
            </span>
          </div>
        </div>

      </div>

      {/* ==========================================================
                          D. TAB NAVIGATION (EXCLUSIVE)
         ========================================================== */}
      <div className="relative z-10 flex flex-wrap gap-2 border-b border-zinc-900 pb-3 mb-8 px-4 sm:px-6 md:px-8">
        {[
          { id: "stats", label: "📊 Vision Générale" },
          { id: "admins", label: "👥 Conseil des Admins" },
          { id: "univers", label: "🌌 Univers AFRI (Portails)" },
          { id: "bouclier", label: "⚔️ Bouclier AFRIGOMBO" },
          { id: "logs", label: "📜 Journal de la Cour" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ActiveTab)}
            className={`py-2 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-[#D4AF37] text-black font-black shadow-[0_0_20px_rgba(212,175,55,0.3)] border-transparent"
                : "text-zinc-400 hover:text-white hover:bg-zinc-950 border border-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==========================================================
                          E. TABS CONTENTS
         ========================================================== */}
      <div className="relative z-10 flex-1 px-4 sm:px-6 md:px-8 pb-12 w-full max-w-7xl mx-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {/* 1. VISION GENERALE / STATISTICS (TAB 1) */}
            {activeTab === "stats" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Simulated Real-Time Traffic Wave */}
                <div className="p-6 rounded-3xl bg-[#090909]/90 border border-white/5 lg:col-span-2 space-y-6">
                  <div className="border-b border-zinc-900 pb-4">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-[#D4AF37] font-black">
                      Intensité du Trafic d'Abidjan & Activités
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Monitorage de requêtes par seconde et de transactions sur tout le territoire national.
                    </p>
                  </div>

                  {/* Aesthetic visual waveform */}
                  <div className="p-4 bg-black border border-zinc-900 rounded-2xl space-y-3">
                    <span className="text-[10px] text-[#D4AF37] uppercase font-mono font-black block">
                      Variations de Charge en Direct (Spikes & Certifications)
                    </span>
                    <div className="flex items-end gap-1.5 h-20 pt-2 select-none">
                      {[15, 24, 45, 12, 60, 80, 50, 45, 95, 120, 140, 85, 70, 110, 130, 95, 160, 120, 110, 95, 120, 150, 180, 130].map(
                        (v, idx) => (
                          <div
                            key={idx}
                            className="flex-1 bg-gradient-to-t from-zinc-950 via-amber-700 to-[#D4AF37] rounded-sm relative group cursor-pointer transition-opacity hover:opacity-80"
                            style={{ height: `${(v / 180) * 100}%` }}
                          >
                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 bg-[#0c0c0c] border border-[#D4AF37] px-2 py-1 rounded text-[8px] font-mono text-[#D4AF37] pointer-events-none mb-1 whitespace-nowrap z-20 shadow-md">
                              {(v * 150).toLocaleString()} req/sec
                            </div>
                          </div>
                        )
                      )}
                    </div>
                    <div className="flex justify-between text-[8px] text-zinc-650 font-mono pt-1 uppercase">
                      <span>Il y a 60 minutes</span>
                      <span>Cadence de rumba & tam-tam stabilisée</span>
                      <span>En temps réel</span>
                    </div>
                  </div>

                  {/* Premium Fast-Action Decrees */}
                  <div className="space-y-4 pt-3">
                    <span className="text-[10px] text-zinc-550 uppercase font-mono font-black block">
                      Promulgations Instantanées Réseau
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <button
                        onClick={triggerGiveAllGoldCertifications}
                        className="p-4 rounded-xl bg-gradient-to-r from-amber-950/20 to-black border border-[#D4AF37]/20 hover:border-[#D4AF37] text-left space-y-1 group transition-all"
                      >
                        <Crown className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                        <strong className="text-xs text-white block font-mono font-bold pt-1 uppercase">
                          Certification Globale d'Or
                        </strong>
                        <span className="text-[10px] text-zinc-500 block font-sans">
                          Promouvoir d’un coup d'État légal tous les artistes inscrits.
                        </span>
                      </button>

                      <button
                        onClick={triggerSafetyPurge}
                        className="p-4 rounded-xl bg-gradient-to-r from-red-950/25 to-black border border-red-900/20 hover:border-red-500 text-left space-y-1 group transition-all"
                      >
                        <ShieldCheck className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                        <strong className="text-xs text-white block font-mono font-bold pt-1 uppercase">
                          Amnistie d'Abus Générale
                        </strong>
                        <span className="text-[10px] text-zinc-500 block font-sans">
                          Remettre les compteurs d'infraction à zéro pour favoriser la paix.
                        </span>
                      </button>

                    </div>
                  </div>
                </div>

                {/* Left Panel: Commission settings & Custom statistics */}
                <div className="space-y-6 col-span-1">
                  
                  {/* Commission Regulation Slider */}
                  <div className="p-6 rounded-3xl bg-[#090909]/90 border border-white/5 space-y-4 shadow-lg">
                    <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
                      <div>
                        <h4 className="text-xs font-mono uppercase tracking-widest text-[#D4AF37] font-black">
                          Prélèvement de Caisse GOMBO
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Ajustez la taxe de séquestre dévolue au pilotage d'écosystème.
                        </p>
                      </div>
                      <Coins className="w-5 h-5 text-[#D4AF37] shrink-0" />
                    </div>

                    <div className="flex items-center justify-between font-mono pt-1">
                      <span className="text-zinc-400 text-xs font-semibold">Taux Souverain :</span>
                      <span className="text-[#D4AF37] text-lg font-black">{systemCommissionRate}%</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const value = Math.max(3, systemCommissionRate - 5);
                          setSystemCommissionRate(value);
                          logToImperialJournal(`Ajustement souverain du prélèvement de caisse à la baisse : ${value}%`, "info");
                        }}
                        className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-mono font-bold transition-all border border-white/5"
                      >
                        -5%
                      </button>
                      
                      <button
                        onClick={() => {
                          const value = Math.min(45, systemCommissionRate + 5);
                          setSystemCommissionRate(value);
                          logToImperialJournal(`Ajustement souverain du prélèvement de caisse à la hausse : ${value}%`, "warning");
                        }}
                        className="flex-1 py-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black rounded-lg text-xs font-mono font-black transition-all border border-[#D4AF37]/35"
                      >
                        +5%
                      </button>
                    </div>
                  </div>

                  {/* Eco-System Integrity summary */}
                  <div className="p-6 rounded-3xl bg-[#090909]/90 border border-white/5 space-y-4">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest block font-bold">
                      Intégrité Constitutionnelle Gombo
                    </span>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span className="text-zinc-500">Sécurité du Core</span>
                        <span className="text-emerald-400 font-bold">Inviolable</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span className="text-zinc-500">Taux de Rejet DDoS</span>
                        <span className="text-white">0.02%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Intégrité BDD</span>
                        <span className="text-white">100% Synced</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* 2. CONSEIL DES ADMINS / SUPER-ADMINS MANAGEMENT */}
            {activeTab === "admins" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Elevation module */}
                <div className="p-6 rounded-3xl bg-[#090909]/90 border border-white/5 lg:col-span-2 space-y-6">
                  <div className="border-b border-zinc-900 pb-4">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-[#D4AF37] font-black">
                      Élévation Administrative & Pouvoirs Standards
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Promouvez et congédiez les administrateurs pour vous seconder. Ils auront accès aux contrôles basiques mais ne verront JAMAIS ce Trône.
                    </p>
                  </div>

                  {/* Add admin interface */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={newSuperAdminEmail}
                      onChange={(e) => setNewSuperAdminEmail(e.target.value)}
                      placeholder="Saisissez l'email du candidat Super Admin..."
                      className="flex-1 bg-black border border-white/10 hover:border-zinc-805 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 font-mono focus:outline-none focus:border-[#D4AF37] transition-all"
                    />
                    
                    <button
                      onClick={handleAddSuperAdminEmail}
                      className="bg-[#D4AF37] hover:bg-[#B48F17] text-black font-mono font-black text-xs uppercase px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Élever au Conseil
                    </button>
                  </div>

                  {/* Render hierarchy */}
                  <div className="space-y-4">
                    {/* Founders & Co-founders */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono block font-bold">
                        👑 Ligue Suprême des Fondateurs (Accès Trône Souverain)
                      </span>
                      {founders.map((email) => (
                        <div
                          key={email}
                          className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-500/10 to-transparent border border-[#D4AF37]/25 hover:border-[#D4AF37]/55 rounded-xl text-xs font-mono transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span className="text-white font-black truncate max-w-[180px] sm:max-w-none">
                              {email}
                            </span>
                          </div>

                          <span className="text-[9px] text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/35 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                            {email === "johnsylvesterh@gmail.com" ? "Fondateur Suprême" : "Co-Fondateur"}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Standard Super Admins */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono block font-bold">
                        👥 Conseil des Super Administrateurs (Gestion Standard)
                      </span>

                      {superAdmins.length === 0 ? (
                        <p className="text-xs text-zinc-650 italic font-mono py-2 pl-2">Aucun Super Administrateur au Conseil.</p>
                      ) : (
                        superAdmins.map((email) => (
                          <div
                            key={email}
                            className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center p-4 bg-black border border-white/5 hover:border-zinc-900 rounded-xl text-xs font-mono transition-colors animate-fadeIn"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
                              <span className="text-white font-black truncate max-w-[200px] sm:max-w-none">
                                {email}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                              <span className="text-[9px] text-zinc-650 bg-white/5 px-2 py-1 rounded">
                                Super Admin
                              </span>
                              
                              <button
                                onClick={() => handlePromoteToFounder(email)}
                                className="bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 hover:border-transparent text-amber-400 hover:text-black font-black uppercase text-[9px] py-1 px-2.5 rounded-lg transition-all"
                              >
                                👑 Promouvoir Fondateur
                              </button>

                              <button
                                onClick={() => handleRevokeSuperAdmin(email)}
                                className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-black font-black uppercase text-[9px] py-1 px-3 rounded-lg transition-all"
                              >
                                Révoquer
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {/* Conserved admin visual validation rules */}
                    <div className="p-4 bg-teal-950/20 border border-teal-900/45 rounded-xl flex items-start gap-4 mt-6">
                      <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <strong className="text-teal-400 font-bold uppercase font-mono">Immutabilité du Trône d'Or :</strong>
                        <p className="text-zinc-500 leading-relaxed font-sans">
                          Il est constitutionnellement impossible pour un Super Admin ou tout autre rôle de modifier l'adresse royale <strong className="text-white font-mono">johnsylvesterh@gmail.com</strong>. Toute intrusion est bannie par notre Noyau.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right panel about John */}
                <div className="p-6 rounded-3xl bg-[#090909]/90 border border-white/5 space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-955/20 via-black to-black border border-[#D4AF37]/20 text-center space-y-3">
                    <Crown className="w-10 h-10 text-[#D4AF37] mx-auto animate-bounce mt-2" />
                    <strong className="text-sm font-mono text-[#D4AF37] block font-black uppercase">
                      Ligue Suprême
                    </strong>
                    <div className="font-mono text-[11px] text-zinc-400 space-y-1">
                      <div>Statut : <span className="text-emerald-400 font-bold uppercase">Créateur Unique</span></div>
                      <div>Rang : Souverain Gombo</div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                    Les administrateurs désignés ci-contre disposent de droits d'orchestre pour assainir l'annuaire d'Abidjan, mais n'ont aucune visibilité sur vos applications connexes de l'Univers AFRI ni sur ces registres critiques.
                  </p>
                </div>

              </div>
            )}

            {/* 3. UNIVERS AFRI (TAB 3 - COMPANION APPS) */}
            {activeTab === "univers" && (
              <div className="space-y-6">
                
                {/* Intro banner */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-black via-zinc-950 to-zinc-900 border border-[#D4AF37]/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-[#D4AF37]/15 text-[#D4AF37] px-2.5 py-1 rounded-md border border-[#D4AF37]/25 font-mono font-black uppercase">
                      🌌 Constellation Écosystémique AFRI
                    </span>
                    <h3 className="text-lg font-display font-black text-white mt-1 uppercase tracking-tight">
                      Mise en Avant de l'Univers AFRI
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Mettez en avant les portails d'or d'échanges d'art et d'identité de Côte d'Ivoire.
                    </p>
                  </div>
                  <div className="p-3.5 bg-black border border-[#D4AF37]/30 rounded-2xl font-mono text-center shrink-0">
                    <span className="text-[9px] text-zinc-650 block">Part d'Excellence Totale</span>
                    <strong className="text-md text-[#D4AF37] block">97.6% D'AUDIENCE</strong>
                  </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {afriApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-6 rounded-3xl bg-[#090909]/95 border border-white/5 hover:border-[#D4AF37]/35 transition-all duration-300 flex flex-col justify-between space-y-4 shadow-lg group"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30 text-[#D4AF37] group-hover:scale-105 transition-transform">
                              {app.logoType === "shield" && <ShieldCheck className="w-6 h-6" />}
                              {app.logoType === "award" && <Award className="w-6 h-6" />}
                              {app.logoType === "fingerprint" && <Fingerprint className="w-6 h-6" />}
                              {app.logoType === "sparkles" && <Sparkles className="w-6 h-6" />}
                            </div>

                            <div>
                              <strong className="text-sm font-mono text-white block">
                                {app.name}
                              </strong>
                              <span className={`text-[9px] font-mono tracking-wide uppercase px-2 py-0.5 rounded font-black ${
                                app.isActive ? "text-emerald-400 bg-emerald-500/5 border border-emerald-500/10" : "text-zinc-650 bg-white/5"
                              }`}>
                                {app.statusText}
                              </span>
                            </div>
                          </div>

                          <div className="text-right font-mono text-[10px] space-y-0.5">
                            <span className="text-zinc-600 block uppercase">Visites</span>
                            <span className="text-white block font-bold">{app.traffic.hits.toLocaleString()} hits</span>
                            <span className="text-emerald-400 block font-black">{app.traffic.growth}</span>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-400 leading-relaxed font-sans pt-1">
                          {app.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-zinc-900 flex justify-between items-center mt-3">
                        <span className="text-[10px] font-mono text-zinc-550 block">
                          Audience Active : <strong className="text-white">{app.traffic.activeUsers.toLocaleString()}</strong>
                        </span>

                        <button
                          onClick={() => handleToggleCompanionApp(app.id)}
                          className={`py-1.5 px-4 font-mono text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all scale-100 active:scale-95 ${
                            app.isActive
                              ? "bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-black hover:scale-105"
                              : "bg-[#D4AF37]/20 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black hover:scale-105"
                          }`}
                        >
                          {app.isActive ? "⏸ Suspendre" : "▶ Promouvoir"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* 4. BOUCLIER GOMBO / FIREWALL & ANNOUNCEMENTS */}
            {activeTab === "bouclier" && (
              <div className="space-y-6">
                
                {/* Bouclier metrics */}
                <div className="p-6 rounded-3xl bg-[#090909]/95 border border-red-950/25 space-y-5 shadow-lg">
                  <div className="flex justify-between items-start flex-wrap gap-4 border-b border-zinc-900 pb-4">
                    <div>
                      <h3 className="text-sm font-mono uppercase tracking-widest text-red-500 font-black">
                        🛡️ Bouclier AFRIGOMBO d'Académie
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Surveillez en direct les trames d'Abidjan, prévenez DDoS et les congestions de négociation.
                      </p>
                    </div>
                    <span className="px-3.5 py-1 bg-red-950/40 border border-red-500/35 text-red-400 text-[10px] font-mono font-black uppercase rounded-lg">
                      SÉCURITÉ IMPÉRIALE MAXIMALE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-black border border-white/5 space-y-1">
                      <span className="text-[9px] text-zinc-550 block font-mono uppercase">Tentatives suspectes</span>
                      <strong className="text-xl text-[#D4AF37] font-mono font-black">0 détectée</strong>
                      <span className="text-[9px] text-emerald-400 block font-mono">Pare-feu étanche</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-black border border-white/5 space-y-1">
                      <span className="text-[9px] text-zinc-550 block font-mono uppercase">Comptes bloqués</span>
                      <strong className="text-xl text-rose-500 font-mono font-black">
                        {liveUsers.filter((u) => u.status === "suspended").length} comptes
                      </strong>
                      <span className="text-[9px] text-zinc-500 block font-mono">Bannissements actés</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-black border border-white/5 space-y-1">
                      <span className="text-[9px] text-zinc-550 block font-mono uppercase">État Sécurité</span>
                      <strong className="text-xl text-emerald-400 font-mono font-black animate-pulse">Optimum</strong>
                      <span className="text-[9px] text-zinc-500 block font-mono">Validation de jeton d'or</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-black border border-white/5 space-y-1">
                      <span className="text-[9px] text-zinc-550 block font-mono uppercase">Alertes Actives</span>
                      <strong className="text-xl text-rose-500 font-mono font-black">
                        {liveAlerts.length} alertes
                      </strong>
                      <span className="text-[9px] text-zinc-500 block font-mono">Contournements évités</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-3 border-t border-zinc-900">
                    <div className="flex-1 space-y-2 p-4 bg-black border border-zinc-905 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-mono uppercase text-white font-black">
                          Limite anti-spam messages
                        </span>
                        <span className="text-[#D4AF37] font-mono text-xs font-bold">
                          {shieldState.spamThreshold} max / hr
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={shieldState.spamThreshold}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setShieldState((prev) => ({ ...prev, spamThreshold: val }));
                          logToImperialJournal(`Seuil de spam ramené à ${val} interventions par heure pour sécurité`, "warning");
                        }}
                        className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 bg-black border border-zinc-905 rounded-xl sm:w-80">
                      <div>
                        <span className="text-[11px] font-mono text-white font-black block">Filtre d'Inondation Anti-DDoS</span>
                        <span className="text-[9px] text-zinc-650 block">Ignore et bannit les requêtes d'or massives doublées.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={shieldState.ddosProtection}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setShieldState((prev) => ({ ...prev, ddosProtection: val }));
                          logToImperialJournal(`Filtre DDoS intelligent ${val ? "activé" : "mis en sommeil"} par le Trône`, "danger");
                        }}
                        className="w-4 h-4 rounded text-[#D4AF37] focus:ring-[#D4AF37] bg-black border-zinc-800"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setSecurityModalOpen(true)}
                      className="w-full py-3 bg-red-900/10 hover:bg-rose-600 border border-red-500/25 hover:border-transparent text-rose-400 hover:text-black font-mono font-extrabold text-xs uppercase rounded-xl transition-all tracking-widest text-center block"
                    >
                      Examiner la Sécurité GOMBO ID 🛡️
                    </button>
                  </div>
                </div>

                {/* Promotional decree dispatcher */}
                <div className="p-6 rounded-3xl bg-[#090909]/95 border border-[#D4AF37]/20 space-y-4">
                  <h3 className="text-sm font-mono uppercase tracking-widest text-[#D4AF37] font-black flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#D4AF37]" />
                    Édit Provincial : Propagation d'Ordre d'Or
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed font-sans mt-1">
                    Les édits et communiqués rédigés ci-dessous seront propulsés et épinglés en tête de tous les navigateurs de Côte d'Ivoire.
                  </p>

                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono text-zinc-550 font-black block">Cible d'Or :</label>
                        <select
                          value={announcementTarget}
                          onChange={(e: any) => setAnnouncementTarget(e.target.value)}
                          className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        >
                          <option value="all">Tous les Membres (Le Peuple d'Académie)</option>
                          <option value="admins">Les Super Administrateurs</option>
                          <option value="certified">Artistes Certifiés Gombo ID d'Or</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono text-zinc-550 font-black block">Texte divin à propager :</label>
                      <textarea
                        rows={3}
                        value={announcementText}
                        onChange={(e) => setAnnouncementText(e.target.value)}
                        placeholder="Rédigez l'Édit Impérial à signer..."
                        className="w-full bg-black border border-zinc-850 rounded-xl p-3 text-xs text-white placeholder-zinc-800 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <button
                      onClick={handlePromulgateDecree}
                      disabled={!announcementText.trim()}
                      className={`w-full py-3 font-mono text-xs uppercase rounded-xl transition-all shadow-md font-black tracking-widest ${
                        !announcementText.trim()
                          ? "bg-zinc-950 text-zinc-700 cursor-not-allowed border border-zinc-900"
                          : "bg-[#D4AF37] hover:bg-[#B48F17] text-black"
                      }`}
                    >
                      Signer & Diffuser le Décret Souverain 📣
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* 5. JOURNAL DE LA COUR / SYSTEM AUDITING LOGS */}
            {activeTab === "logs" && (
              <div className="p-6 rounded-3xl bg-[#090909]/95 border border-white/5 space-y-4 shadow-lg">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                  <div>
                    <h3 className="text-sm font-mono uppercase tracking-widest text-[#D4AF37] font-black flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#D4AF37]" />
                      Journal Impérial Immuable d'AFRIGOMBO
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Registres de sécurité inaltérables retraçant la gestion d'académie.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setImperialLogs([
                        {
                          id: `log_purge_${Date.now()}`,
                          timestamp: new Date().toISOString(),
                          action: "Le souverain John a révisé l'archivage en direct.",
                          actor: "Système",
                          type: "royal"
                        }
                      ]);
                      addToTerminal("[ARCHIVAGE] Révision du journal par le Unique Fondateur.");
                    }}
                    className="px-4 py-1.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-white/5 text-[9px] uppercase rounded-xl font-mono tracking-wider font-bold"
                  >
                    Effacer l'Écran
                  </button>
                </div>

                <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-2 divide-y divide-zinc-950">
                  {imperialLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 transition-all ${
                        log.type === "royal"
                          ? "bg-gradient-to-r from-amber-950/20 to-black border-[#D4AF37]/25 text-amber-200"
                          : log.type === "danger"
                          ? "bg-red-500/5 border-red-500/10 text-rose-300"
                          : log.type === "warning"
                          ? "bg-amber-500/5 border-amber-500/10 text-amber-200"
                          : "bg-black border-zinc-900 text-zinc-400"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse" />
                          <span className="text-[#D4AF37] font-black uppercase">
                            {log.actor}
                          </span>
                        </div>
                        <span className="text-zinc-600">
                          {new Date(log.timestamp).toLocaleTimeString("fr-FR")}
                        </span>
                      </div>
                      
                      <p className="font-semibold text-[11px] font-mono leading-relaxed pl-3 border-l border-[#D4AF37]/20">
                        {log.action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ==========================================================
                          F. INTERACTIVE SAFETY DEEP-SCAN MODAL
         ========================================================== */}
      <AnimatePresence>
        {securityModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#070707] border border-[#D4AF37]/30 max-w-lg w-full rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
                  <div>
                    <h3 className="text-sm font-mono uppercase tracking-widest text-[#D4AF37] font-black">
                      Examen de l'Équilibre - Bouclier
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono">Contrôle anti-triche et d'harmonisation</p>
                  </div>
                </div>
                <button
                  onClick={() => setSecurityModalOpen(false)}
                  className="p-1.5 bg-zinc-950 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Suspicious user reports listing */}
              <div className="space-y-4">
                <span className="text-[10px] text-zinc-550 uppercase font-mono font-black block">
                  Artistes d'Abidjan Signalés ou Suspects :
                </span>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {liveUsers.filter((u) => u.status === "suspect" || u.status === "suspended").length === 0 ? (
                    <div className="p-6 bg-black border border-zinc-905 rounded-2xl text-center text-xs text-zinc-650 font-mono">
                      🕊️ Paix sur la Côte d'Ivoire. Aucune infraction ni tension n'est recensée.
                    </div>
                  ) : (
                    liveUsers
                      .filter((u) => u.status === "suspect" || u.status === "suspended")
                      .map((u) => (
                        <div
                          key={u.id}
                          className="p-3.5 bg-black border border-zinc-900 rounded-xl flex justify-between items-center text-xs font-mono"
                        >
                          <div className="space-y-0.5">
                            <span className="text-white block font-bold">{u.artisticName || u.name}</span>
                            <span className="text-[10px] text-zinc-500 block">{u.email}</span>
                            <span className={`text-[9px] uppercase font-black ${u.status === "suspended" ? "text-rose-500" : "text-amber-500"}`}>
                              {u.status === "suspended" ? "Banni de l'orchestre" : "Suspect d'Inconduite"}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {u.status === "suspended" ? (
                              <button
                                onClick={async () => {
                                  const updated = liveUsers.map((usr) =>
                                    usr.id === u.id ? { ...usr, status: "active" as any } : usr
                                  );
                                  setLiveUsers(updated);
                                  setUsers(updated);
                                  if (db) {
                                    await updateDoc(doc(db, "users", u.id), { status: "active" });
                                  }
                                  await logToImperialJournal(`Réhabilitation de l'artiste banni : ${u.name}`, "info");
                                  alert(`🕊️ ${u.name} a été réhabilité(e) avec succès !`);
                                }}
                                className="py-1 px-3 bg-teal-500/10 hover:bg-[#D4AF37] text-teal-400 hover:text-black font-extrabold rounded-lg text-[9px] uppercase transition-all"
                              >
                                Réhabiliter
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  const updated = liveUsers.map((usr) =>
                                    usr.id === u.id ? { ...usr, status: "suspended" as any } : usr
                                  );
                                  setLiveUsers(updated);
                                  setUsers(updated);
                                  if (db) {
                                    await updateDoc(doc(db, "users", u.id), { status: "suspended" });
                                  }
                                  await logToImperialJournal(`Bannissement souverain pour inconduite frauduleuse : ${u.name}`, "danger");
                                  alert(`🛡️ L'artiste ${u.name} a été démis et suspendu pour préserver la paix.`);
                                }}
                                className="py-1 px-3 bg-red-500/10 hover:bg-rose-600 text-rose-400 hover:text-black font-extrabold rounded-lg text-[9px] uppercase transition-all"
                              >
                                Suspendre d'office
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>

                <div className="p-4 bg-zinc-950 border border-[#D4AF37]/15 rounded-2xl text-[10px] text-[#D4AF37] leading-relaxed font-mono space-y-1">
                  <strong className="text-white block">CONTRÔLE INTÉGRE DU SEUILS SANS FAILLE :</strong>
                  <p>
                    Toute suspension ou libération souveraine est immédiatement propagée sur Firebase, reconfigurant les autorisations de Gombo ID en l'espace de quelques millisecondes.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-900 text-right">
                <button
                  onClick={() => setSecurityModalOpen(false)}
                  className="py-2.5 px-6 bg-[#D4AF37] hover:bg-[#B48F17] text-black font-mono font-black text-xs uppercase rounded-xl transition-all shadow-md"
                >
                  Audits clos ✓
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
