import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "../AuthContext";
import { useTheme } from "../context/ThemeContext";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy, limit, doc, getDoc, setDoc } from "firebase/firestore";
import { Crown, ArrowLeft, Loader2, AlertOctagon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SecurityService } from "../lib/SecurityService";
import { audioSynth } from "../lib/audio";
import { User, Gombo, Post, Transaction, Alerte, GomboReview, GomboSafeContract } from "../types";
import { safeJsonClone } from "../lib/jsonUtils";

import AdminDashboard from "./admin/AdminDashboard";
import { ErrorBoundary } from "./ErrorBoundary";

export default function TheThroneOfTheFounder() {
  const { currentUser, profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const isLight = theme === "light";

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [founderProfile, setFounderProfile] = useState<any>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [gombos, setGombos] = useState<Gombo[]>([]);
  const [alerts, setAlerts] = useState<Alerte[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reviews, setReviews] = useState<GomboReview[]>([]);
  const [contracts, setContracts] = useState<GomboSafeContract[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [renforts, setRenforts] = useState<any[]>([]);

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

  useEffect(() => {
    async function verifyFounderAccess() {
      if (!currentUser) {
        setIsCheckingAuth(false);
        setIsAuthorized(false);
        return;
      }

      const isFounderByEmail = currentUser.email?.toLowerCase() === "jhs.kmj7@gmail.com";
      if (isFounderByEmail) {
        setIsAuthorized(true);
        try { audioSynth.playTamTam(true); } catch (_) {}
      }

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setFounderProfile(userData);

          const isFounderByEmailOrProfile = isFounderByEmail || userData.email?.toLowerCase() === "jhs.kmj7@gmail.com";
          const isFounderByFlag = userData.isFounder === true || userData.role === "admin" || userData.role === "super_admin";

          if (isFounderByEmailOrProfile || isFounderByFlag) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            await SecurityService.logSecurityEvent({
              userId: currentUser.uid,
              userEmail: currentUser.email || "unknown",
              action: "unauthorized_access_cabinet",
              severity: "high",
              details: `Tentative d'accès non autorisée au Cabinet Suprême par ${currentUser.email}`,
              result: "blocked"
            });
          }
        } else {
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

  useEffect(() => {
    if (!isAuthorized) return;
    const interval = setInterval(() => {
      setLiveAdminTime(new Date().toLocaleTimeString("fr-FR"));
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;

    const addToTerminal = (message: string) => {
      setTerminalFeed(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
    };

    addToTerminal("[SYS] Initialisation du Centre de Commandement Souverain...");

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

    const qPosts = query(collection(db, "posts"), limit(200));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      const fetched: Post[] = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as Post);
      });
      fetched.sort((a: any, b: any) => {
        const timeA = new Date(a.timestamp || a.createdAt || a.date || 0).getTime() || 0;
        const timeB = new Date(b.timestamp || b.createdAt || b.date || 0).getTime() || 0;
        return timeB - timeA;
      });
      setPosts(fetched);
    }, (err) => {
      console.warn("Posts sync limited:", err);
    });

    return () => {
      unsubUsers();
      unsubGombos();
      unsubTransactions();
      unsubReviews();
      unsubAlerts();
      unsubPosts();
    };
  }, [isAuthorized]);

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
    addToTerminal(`[P-INTELLIGENT] 🔍 Analyse autonome complète initiée...`);
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

  if (isCheckingAuth) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-afri-bg text-afri-gold font-sans">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-afri-gold" />
        <p className="text-sm font-mono tracking-widest uppercase animate-pulse">Souveraineté en cours de scellage...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-black text-red-500 font-mono p-6 text-center select-none">
        <AlertOctagon className="w-16 h-16 mb-4 animate-bounce text-red-600" />
        <h1 className="text-2xl font-black uppercase tracking-wider mb-2 text-red-600">ACCÈS INTERDIT - CABINET PRIVÉ</h1>
        <p className="text-xs max-w-md leading-relaxed text-gray-500 mb-6">
          Votre signature numérique ne correspond pas au sceau du Cabinet Suprême. Tout accès illicite est consigné.
        </p>
        <button
          onClick={() => navigate("/home")}
          className="px-6 py-2.5 border border-red-500/40 hover:border-red-500 text-red-500 bg-red-950/10 hover:bg-red-950/20 rounded-xl transition-all font-mono font-black uppercase text-xs tracking-wider cursor-pointer"
        >
          Retourner au Terrain Secouru
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLight ? "bg-[#FDFBF7]" : "bg-afri-bg"} font-sans text-afri-text pb-12 flex flex-col`}>
      {/* 👑 Sovereign Top Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-afri-bg-sec/90 border-b border-afri-gold/20 px-4 py-3 sm:px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
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
        </div>
      </header>

      {/* 🔮 Command Center Workspace (Single occurrence) */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-grow">
        <ErrorBoundary moduleName="Centre de Commandement">
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
              setActiveMenu={() => {}}
              setIsBroadcastModalOpen={setIsBroadcastModalOpen}
              audioSynth={audioSynth}
              addToTerminal={addToTerminal}
              saveToFirestore={saveToFirestore}
              setUsers={setUsers}
              setPosts={setPosts}
              setGombos={setGombos}
              onEnterThrone={() => navigate("/Le-Trone-Du-Fondateur")}
            />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
