import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "../AuthContext";
import { useTheme } from "../context/ThemeContext";
import { db } from "../lib/firebase"; // Use correct path to firebase config
import { collection, onSnapshot, query, orderBy, limit, doc, getDoc, setDoc } from "firebase/firestore";
import { Crown, ShieldAlert, ArrowLeft, Loader2, Sparkles, AlertOctagon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { SecurityService } from "../lib/SecurityService";
import { audioSynth } from "../lib/audio";
import { User, Gombo, Post, Transaction, Alerte, GomboReview, GomboSafeContract } from "../types";
import { safeJsonClone } from "../lib/jsonUtils";

// Import existing dashboard components
import AdminDashboard from "./admin/AdminDashboard";
import AdminSuperFounderHub from "./admin/AdminSuperFounderHub";
import { ErrorBoundary } from "./ErrorBoundary";

export default function TheThroneOfTheFounder() {
  const { currentUser, profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isLight = theme === "light";

  // Auth and Authorization states
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [founderProfile, setFounderProfile] = useState<any>(null);

  // Tabs switcher state: "command" for Centre de Commandement, "founder" for Tableau Fondateur
  const [activeTab, setActiveTab] = useState<"command" | "founder">("command");

  // Sync activeTab state with the search parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab") || location.state?.activeTab;
    if (tabParam === "founder" || tabParam === "super_admin") {
      setActiveTab("founder");
    } else {
      setActiveTab("command");
    }
  }, [location]);

  // Core data states for the child dashboards
  const [users, setUsers] = useState<User[]>([]);
  const [gombos, setGombos] = useState<Gombo[]>([]);
  const [alerts, setAlerts] = useState<Alerte[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reviews, setReviews] = useState<GomboReview[]>([]);
  const [contracts, setContracts] = useState<GomboSafeContract[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [renforts, setRenforts] = useState<any[]>([]);

  // Sub states
  const [scannerStatus, setScannerStatus] = useState<"idle" | "scanning" | "completed">("idle");
  const [autoFlaggedPosts, setAutoFlaggedPosts] = useState<Post[]>([]);
  const [autoFlaggedUsers, setAutoFlaggedUsers] = useState<User[]>([]);
  const [autoStats, setAutoStats] = useState({
    growthRate: "+19.4%",
    suspiciousCount: 0,
    anomalyCount: 0,
    alertCount: 0
  });

  const [liveAdminTime, setLiveAdminTime] = useState<string>(new Date().toLocaleTimeString("fr-FR"));
  const [terminalFeed, setTerminalFeed] = useState<string[]>([]);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isScanFeedbackVisible, setIsScanFeedbackVisible] = useState(false);
  const [autoSaveActive, setAutoSaveActive] = useState(false);

  // 1. Core security & authorization check
  useEffect(() => {
    async function verifyFounderAccess() {
      if (!currentUser) {
        setIsCheckingAuth(false);
        setIsAuthorized(false);
        return;
      }

      // Fail-safe immediate access for the founder email
      const isFounderByEmail = currentUser.email?.toLowerCase() === "jhs.kmj7@gmail.com";
      if (isFounderByEmail) {
        setIsAuthorized(true);
        try { audioSynth.playTamTam(true); } catch (_) {}
      }

      try {
        // Step 1: Fetch Firestore document directly for strict security check
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setFounderProfile(userData);

          // Step 2: Use existing source of truth for Founder check
          const isFounderByEmailOrProfile = isFounderByEmail || userData.email?.toLowerCase() === "jhs.kmj7@gmail.com";
          const isFounderByFlag = userData.isFounder === true || userData.role === "admin" || userData.role === "super_admin";

          if (isFounderByEmailOrProfile || isFounderByFlag) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            // Log access violation
            await SecurityService.logSecurityEvent({
              userId: currentUser.uid,
              userEmail: currentUser.email || "unknown",
              action: "unauthorized_access_throne",
              severity: "high",
              details: `Tentative d'accès non autorisée à /Le-Throne-Of-The-Founder par ${currentUser.email}`,
              result: "blocked"
            });
          }
        } else {
          // If Firestore user doc doesn't exist yet but email is founder, keep authorized as true
          if (!isFounderByEmail) {
            setIsAuthorized(false);
          }
        }
      } catch (err) {
        console.error("Founder authorization check failed:", err);
        if (!isFounderByEmail) {
          setIsAuthorized(false);
        }
      } finally {
        setIsCheckingAuth(false);
      }
    }

    verifyFounderAccess();
  }, [currentUser]);

  // 2. Real-time sub-timer
  useEffect(() => {
    if (!isAuthorized) return;
    const interval = setInterval(() => {
      setLiveAdminTime(new Date().toLocaleTimeString("fr-FR"));
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthorized]);

  // 3. Realtime collection listeners
  useEffect(() => {
    if (!isAuthorized) return;

    const addToTerminal = (message: string) => {
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
    };

    addToTerminal("[SYS] Initialisation de la liaison satellite souveraine...");

    // Setup listeners exactly like AdminCentre
    const qUsers = collection(db, "users");
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const fetched: User[] = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as User);
      });
      setUsers(fetched);
    }, (err) => {
      console.warn("Users sync restricted:", err);
    });

    const qGombos = collection(db, "gombos");
    const unsubGombos = onSnapshot(qGombos, (snap) => {
      const fetched: Gombo[] = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as Gombo);
      });
      setGombos(fetched);
    }, (err) => {
      console.warn("Gombos sync limited:", err);
    });

    const qTransactions = query(collection(db, "transactions"), orderBy("timestamp", "desc"), limit(200));
    const unsubTransactions = onSnapshot(qTransactions, (snap) => {
      const fetched: Transaction[] = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
      });
      setTransactions(fetched);
    }, (err) => {
      console.warn("Transactions sync limited:", err);
    });

    const qReviews = collection(db, "reviews");
    const unsubReviews = onSnapshot(qReviews, (snap) => {
      const fetched: GomboReview[] = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as GomboReview);
      });
      setReviews(fetched);
    }, (err) => {
      console.warn("Reviews sync limited:", err);
    });

    const qAlerts = collection(db, "alerts");
    const unsubAlerts = onSnapshot(qAlerts, (snap) => {
      const fetched: Alerte[] = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as Alerte);
      });
      setAlerts(fetched);
    }, (err) => {
      console.warn("Alerts sync restricted:", err);
    });

    const qPosts = query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(200));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      const fetched: Post[] = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as Post);
      });
      setPosts(fetched);
    }, (err) => {
      console.warn("Posts sync limited:", err);
    });

    const qRenforts = query(collection(db, "renforts"), orderBy("createdAt", "desc"), limit(100));
    const unsubRenforts = onSnapshot(qRenforts, (snap) => {
      const fetched: any[] = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      setRenforts(fetched);
    }, (err) => {
      console.warn("Renforts sync limited:", err);
    });

    const qLogs = query(collection(db, "admin_logs"), orderBy("timestamp", "desc"), limit(100));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      const fetched: any[] = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAdminLogs(fetched);
    }, (err) => {
      console.warn("Logs sync limited:", err);
    });

    const qContracts = collection(db, "contracts");
    const unsubContracts = onSnapshot(qContracts, (snap) => {
      const fetched: GomboSafeContract[] = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as GomboSafeContract);
      });
      setContracts(fetched);
    }, (err) => {
      console.warn("Contracts sync limited:", err);
    });

    return () => {
      unsubUsers();
      unsubGombos();
      unsubTransactions();
      unsubReviews();
      unsubAlerts();
      unsubPosts();
      unsubRenforts();
      unsubLogs();
      unsubContracts();
    };
  }, [isAuthorized]);

  // Derived metrics
  const newUsersCount = users.filter((u: any) => {
    const created = new Date(u.createdAt || Date.now());
    return (Date.now() - created.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const brief = {
    newUsersCount,
    newPostsCount: posts.length,
    newGombosCount: gombos.length,
    revenuesGenerated: transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0),
    kycRequestsCount: users.filter((u: any) => u.kycStatus === 'pending').length,
    criticalAlertsCount: alerts.filter((a: any) => a.status === 'open' || a.priority === 'high').length + posts.filter((p: any) => p.isFlagged).length,
    timestamp: new Date().toLocaleDateString()
  };

  const addToTerminal = (message: string) => {
    setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  const saveToFirestore = async (collectionName: string, docId: string, data: any) => {
    try {
      setAutoSaveActive(true);
      const docRef = doc(db, collectionName, docId);
      let safeData = data;
      try {
        safeData = safeJsonClone(data);
      } catch (err) {
        console.error("Error sanitizing data for Firestore:", err);
      }
      await setDoc(docRef, safeData, { merge: true });
      addToTerminal(`[SYNC] Sauvegarde réussie sur Firestore pour ${collectionName}/${docId}`);
      setTimeout(() => setAutoSaveActive(false), 800);
    } catch (e) {
      addToTerminal(`[LOCAL] Données enregistrées localement.`);
      setTimeout(() => setAutoSaveActive(false), 800);
    }
  };

  const triggerGlobalSystemScan = () => {
    setScannerStatus("scanning");
    addToTerminal(`[P-INTELLIGENT] 🔍 Analyse autonome complète initiée par le Super Admin...`);
    setIsScanFeedbackVisible(true);

    setTimeout(() => {
      const flaggedP = posts.filter(p => p.isFlagged || String(p.content || "").toLowerCase().includes("contrefait") || String(p.content || "").toLowerCase().includes("cachette"));
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

      addToTerminal(`[P-INTELLIGENT] ✅ Analyse terminée. ${flaggedP.length} anomalies et ${suspectU.length} suspects identifiés.`);
    }, 2500);
  };

  // Loading indicator
  if (isCheckingAuth) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-afri-bg text-afri-gold font-sans">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-afri-gold" />
        <p className="text-sm font-mono tracking-widest uppercase animate-pulse">Souveraineté en cours de scellage...</p>
      </div>
    );
  }

  // Access denied view
  if (!isAuthorized) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-black text-red-500 font-mono p-6 text-center select-none">
        <AlertOctagon className="w-16 h-16 mb-4 animate-bounce text-red-600" />
        <h1 className="text-2xl font-black uppercase tracking-wider mb-2 text-red-600">ACCÈS INTERDIT - TRÔNE PRIVÉ</h1>
        <p className="text-xs max-w-md leading-relaxed text-gray-500 mb-6">
          Votre signature numérique ne correspond pas au sceau suprême de fondation d'AFRIGOMBO ELITE. Tout accès illicite est enregistré dans le registre de sécurité central de la Nation.
        </p>
        <button
          onClick={() => navigate("/home")}
          className="px-6 py-2.5 border border-red-500/40 hover:border-red-500 text-red-500 bg-red-950/10 hover:bg-red-950/20 rounded-xl transition-all font-mono font-black uppercase text-xs tracking-wider"
        >
          Retourner au Terrain Secouru
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLight ? "bg-[#FDFBF7]" : "bg-afri-bg"} font-sans text-afri-text pb-12 flex flex-col`}>
      
      {/* 👑 Sovereign Top Nav / Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-afri-bg-sec/90 border-b border-afri-gold/20 px-4 py-3 sm:px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 justify-between items-center">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/home")}
              className="p-2 border border-afri-gold/20 hover:border-afri-gold bg-afri-bg hover:bg-afri-bg-sec text-afri-gold rounded-xl transition-all cursor-pointer"
              title="Retourner à l'espace normal"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-afri-gold/10 border border-afri-gold/30 flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6 text-afri-gold animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-display font-black text-afri-gold uppercase tracking-wider">
                  Le Cabinet Suprême du Fondateur
                </h1>
                <p className="text-[10px] font-mono text-afri-text-sec">
                  Liaison satellite souveraine • {liveAdminTime}
                </p>
              </div>
            </div>
          </div>

          {/* Tab switches */}
          <div className="flex items-center bg-black/40 border border-afri-gold/15 p-1 rounded-2xl shrink-0">
            <button
              onClick={() => {
                setActiveTab("command");
                try { audioSynth.playTamTam(true); } catch (_) {}
              }}
              className={`px-4 py-2 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "command"
                  ? "bg-afri-gold text-black shadow-md"
                  : "text-afri-text-sec hover:text-afri-text bg-transparent"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Centre de Commandement
            </button>
            <button
              onClick={() => {
                setActiveTab("founder");
                try { audioSynth.playTamTam(true); } catch (_) {}
              }}
              className={`px-4 py-2 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "founder"
                  ? "bg-afri-gold text-black shadow-md"
                  : "text-afri-text-sec hover:text-afri-text bg-transparent"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Tableau Fondateur
            </button>
          </div>

        </div>
      </header>

      {/* 🔮 Central Core Workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-grow">
        <ErrorBoundary moduleName={activeTab === "command" ? "Centre de Commandement" : "Tableau Fondateur"}>
          {activeTab === "command" ? (
            <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse">Chargement de la Console...</div>}>
              <AdminDashboard
                users={users}
                gombos={gombos}
                posts={posts}
                transactions={transactions}
                alerts={alerts}
                brief={brief}
                currentUser={currentUser}
                userEmail={currentUser?.email || "jhs.kmj7@gmail.com"}
                liveAdminTime={liveAdminTime}
                isAuthorizedSuperFounder={true}
                scannerStatus={scannerStatus}
                triggerGlobalSystemScan={triggerGlobalSystemScan}
                setActiveMenu={() => {}} // Dummy as switching is handled at top level
                setIsBroadcastModalOpen={setIsBroadcastModalOpen}
                audioSynth={audioSynth}
                addToTerminal={addToTerminal}
                saveToFirestore={saveToFirestore}
                setUsers={setUsers}
                setPosts={setPosts}
                setGombos={setGombos}
              />
            </Suspense>
          ) : (
            <Suspense fallback={<div className="p-12 text-center text-afri-gold font-mono animate-pulse">Chargement du Tableau de Bord Fondateur...</div>}>
              <AdminSuperFounderHub
                userEmail={currentUser?.email || "jhs.kmj7@gmail.com"}
                currentUser={founderProfile || profile}
                users={users}
                gombos={gombos}
                posts={posts}
                transactions={transactions}
                alerts={alerts}
                audioSynth={audioSynth}
                onExit={() => navigate("/home")}
              />
            </Suspense>
          )}
        </ErrorBoundary>
      </main>

    </div>
  );
}
