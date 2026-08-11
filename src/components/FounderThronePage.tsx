import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { useTheme } from "../context/ThemeContext";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { Crown, AlertOctagon, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SecurityService } from "../lib/SecurityService";
import { audioSynth } from "../lib/audio";
import { User, Gombo, Post, Transaction, Alerte } from "../types";
import AdminSuperFounderHub from "./admin/AdminSuperFounderHub";
import { ErrorBoundary } from "./ErrorBoundary";

export default function FounderThronePage() {
  const { currentUser, profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const isLight = theme === "light";

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [founderProfile, setFounderProfile] = useState<any>(null);

  // Core data states for Tableau Fondateur
  const [users, setUsers] = useState<User[]>([]);
  const [gombos, setGombos] = useState<Gombo[]>([]);
  const [alerts, setAlerts] = useState<Alerte[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 1. Core security & authorization check
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
              action: "unauthorized_access_throne",
              severity: "high",
              details: `Tentative d'accès non autorisée au Trône du Fondateur par ${currentUser.email}`,
              result: "blocked"
            });
          }
        } else {
          if (!isFounderByEmail) {
            setIsAuthorized(false);
          } else {
            setIsAuthorized(true);
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

  // 2. Realtime collection listeners for Tableau Fondateur
  useEffect(() => {
    if (!isAuthorized) return;

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

    return () => {
      unsubUsers();
      unsubGombos();
      unsubTransactions();
      unsubAlerts();
      unsubPosts();
    };
  }, [isAuthorized]);

  if (isCheckingAuth) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-afri-bg text-afri-gold font-sans">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-afri-gold" />
        <p className="text-sm font-mono tracking-widest uppercase animate-pulse">Vérification des Sceaux du Trône...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-black text-red-500 font-mono p-6 text-center select-none">
        <AlertOctagon className="w-16 h-16 mb-4 animate-bounce text-red-600" />
        <h1 className="text-2xl font-black uppercase tracking-wider mb-2 text-red-600">ACCÈS SOUVERAIN REFUSÉ</h1>
        <p className="text-xs max-w-md leading-relaxed text-gray-500 mb-6">
          Votre signature numérique ne correspond pas au sceau du Trône du Fondateur d'AFRIGOMBO ELITE. Cet incident a été consigné dans les registres de sécurité.
        </p>
        <button
          onClick={() => navigate("/Le-Throne-Of-The-Founder")}
          className="px-6 py-2.5 border border-red-500/40 hover:border-red-500 text-red-500 bg-red-950/10 hover:bg-red-950/20 rounded-xl transition-all font-mono font-black uppercase text-xs tracking-wider cursor-pointer"
        >
          Retourner au Cabinet Suprême
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLight ? "bg-[#FDFBF7]" : "bg-afri-bg"} font-sans text-afri-text pb-12 flex flex-col`}>
      {/* Top Bar with Return to Cabinet */}
      <div className="sticky top-0 z-50 bg-afri-bg-sec/95 backdrop-blur-md border-b border-afri-gold/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/Le-Throne-Of-The-Founder")}
            className="p-2 border border-afri-gold/30 hover:border-afri-gold bg-afri-bg hover:bg-afri-bg-sec text-afri-gold rounded-xl transition-all cursor-pointer flex items-center gap-2"
            title="Retour au Cabinet Suprême"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider hidden sm:inline">Cabinet Suprême</span>
          </button>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-afri-gold" />
            <h1 className="text-sm sm:text-base font-display font-black text-afri-gold uppercase tracking-wider">
              Trône du Fondateur — Tableau Souverain
            </h1>
          </div>
        </div>
      </div>

      <main className="flex-grow">
        <ErrorBoundary moduleName="Tableau Fondateur">
          <AdminSuperFounderHub
            initialModule="throne"
            userEmail={currentUser?.email || "jhs.kmj7@gmail.com"}
            currentUser={founderProfile || profile || currentUser}
            users={users}
            gombos={gombos}
            posts={posts}
            transactions={transactions}
            alerts={alerts}
            audioSynth={audioSynth}
            onExit={() => navigate("/Le-Throne-Of-The-Founder")}
          />
        </ErrorBoundary>
      </main>
    </div>
  );
}
