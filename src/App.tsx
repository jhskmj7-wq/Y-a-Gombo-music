import GlobalNotificationBanner from "./components/GlobalNotificationBanner";
import React, { useState, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { audioSynth } from "./lib/audio";
import { Music, Award, ShieldCheck, Sparkles } from "lucide-react";
import SuperFounderDebug from "./components/SuperFounderDebug";
import { BackgroundMusic } from "./components/BackgroundMusic";
import { LivingInteractions } from "./components/LivingInteractions";
import { useAuth } from "./AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { ProfileGuard } from "./components/ProfileGuard";
import CompleteProfile from "./components/CompleteProfile";
import AuthPage from "./components/AuthPage";
import ErrorBoundary from "./components/ErrorBoundary";
import AfrigomboCinematicIntro from "./components/AfrigomboCinematicIntro";
import PremiumLoader from "./components/PremiumLoader";

// Lazy load the main Application Layer
const AdminCentre = lazy(() => import("./components/AdminCentre"));

const MainAppLayout = React.memo(function MainAppLayout({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: (d: boolean) => void }) {
  return (
    <Suspense fallback={
       <div className="flex h-screen items-center justify-center bg-[#050505]">
          <div className="w-16 h-16 rounded-full border-t-2 border-[#D4AF37] animate-spin"></div>
       </div>
    }>
      <div className="fixed top-0 left-0 w-full z-[9999]"><GlobalNotificationBanner /></div>
      <LivingInteractions />
      <AdminCentre darkMode={darkMode} setDarkMode={setDarkMode} />
    </Suspense>
  );
});

import { gomboDB } from "./firebase";
import { app } from "./lib/firebase";

// A wrapper to handle the CompleteProfile rendering cleanly
function CompleteProfileView() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  if (!profile) {
    return <PremiumLoader message="Chargement du Profil..." />;
  }
  
  return (
    <div className="w-full min-h-screen bg-[#0B0B0B] flex items-center justify-center py-6 overflow-y-auto px-4 font-sans select-none">
      <CompleteProfile 
        currentUserProfile={profile} 
        onComplete={async () => {
          await refreshProfile();
          navigate("/home", { replace: true });
        }} 
      />
    </div>
  );
}

function App() {
  console.log("APP START");
  const { loading: authLoading, currentUser } = useAuth();
  const location = useLocation();
  console.log("ROUTE:", location.pathname);
  console.log("USER:", currentUser);
  console.log("APP LOADED");
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      return !search.includes("transferId") && !search.includes("auth_transfer");
    }
    return true;
  });
  const [showCinematicIntro, setShowCinematicIntro] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gombo_cinematic_intro_done") !== "true";
    }
    return false;
  });
  const [splashStep, setSplashStep] = useState(0);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("gombo_theme");
    return saved === "dark"; // Default is light mode
  });

  // Load theme and run splash sequence
  useEffect(() => {
    console.log("App Component mounted");

    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("gombo_theme", newDarkMode ? "dark" : "light");
    const root = window.document.documentElement;
    if (newDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  useEffect(() => {
    // Splash steps timing
    const t0 = setTimeout(() => setSplashStep(1), 100);    // Step 1: Draw silhouette & gold notes
    const t1 = setTimeout(() => setSplashStep(2), 1200);   // Step 2: Draw AFRIGOMBO and Taglines
    const t2 = setTimeout(() => {
      // Small success sound before entering
      try {
        audioSynth.playKoraNote(523.25, 0, 0.12, 0.6); // High pitch d'or
      } catch (err) {
        console.warn("Audio Context startup play blocked or unsupported:", err);
      }
      setShowSplash(false);
    }, 3200);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const setDarkModeWrapped = (val: boolean) => {
    localStorage.setItem("gombo_theme", val ? "dark" : "light");
    const root = window.document.documentElement;
    if (val) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    setDarkMode(val);
  };

  if (showCinematicIntro) {
    return (
      <ErrorBoundary>
        <AfrigomboCinematicIntro
          onComplete={() => {
            localStorage.setItem("gombo_cinematic_intro_done", "true");
            setShowCinematicIntro(false);
          }}
        />
      </ErrorBoundary>
    );
  }

  if (authLoading) {
    return <PremiumLoader message="Connexion sécurisée..." />;
  }

  return (
    <ErrorBoundary>
      <div className={`h-screen overflow-hidden font-sans antialiased transition-colors duration-300 ${darkMode ? "bg-[#0B0B0B] text-[#F5F5F5]" : "bg-[#F9FBFA] text-[#1F2937]"}`}>
        
        {/* 1. PREMIUM SPLASH SCREEN */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeInOut" }}
            className="fixed inset-0 bg-[#030303] z-[9999] flex flex-col items-center justify-center text-center p-6 select-none overflow-hidden"
          >
            {/* Ambient Gold Dust / Particles */}
            <div className="absolute inset-0 pointer-events-none z-0">
              {Array.from({ length: 20 }).map((_, idx) => (
                <div
                  key={idx}
                  className="absolute rounded-full bg-gradient-to-tr from-[#D4AF37] to-amber-100/30 opacity-30 animate-pulse"
                  style={{
                    width: `${Math.random() * 4 + 1.5}px`,
                    height: `${Math.random() * 4 + 1.5}px`,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 4 + 2}s`,
                    animationDelay: `${Math.random() * 4}s`
                  }}
                />
              ))}
            </div>

            {/* Floatings note-shapes */}
            <div className="absolute inset-x-0 bottom-1/4 top-1/4 pointer-events-none z-0 flex justify-around">
              <span className="text-[#D4AF37]/25 text-3xl select-none animate-bounce delay-100">♩</span>
              <span className="text-[#D4AF37]/20 text-4xl select-none animate-pulse delay-500">🪘</span>
              <span className="text-[#D4AF37]/30 text-2xl select-none animate-bounce delay-300">♪</span>
              <span className="text-[#D4AF37]/15 text-5xl select-none animate-pulse delay-1000">🎸</span>
              <span className="text-[#D4AF37]/25 text-3xl select-none animate-bounce delay-700">♫</span>
            </div>

            {/* SILHOUETTE ANIMÉE D'OR D'AFRIQUE DE L'OUEST */}
            <div className="relative w-44 h-44 flex items-center justify-center mb-8 border border-[#D4AF37]/15 rounded-full bg-black/60 shadow-[0_0_50px_rgba(212,175,55,0.06)] z-10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-28 h-28">
                {/* Stylized African Guitar/Kora silhouette in glowing gold lines */}
                <path
                  d="M 50 15 L 50 85 M 40 45 C 30 50, 20 60, 30 75 C 38 82, 62 82, 70 75 C 80 60, 70 50, 60 45"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="animate-pulse"
                />
                {/* African Tam-tam silhouette */}
                <path
                  d="M 32 75 L 38 88 L 62 88 L 68 75 Z"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  className="opacity-90"
                />
                {/* Sound waves emitting */}
                <circle
                  cx="50"
                  cy="65"
                  r="12"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="1"
                  strokeDasharray="4, 4"
                  className="animate-spin"
                  style={{ animationDuration: "12s" }}
                />
                {/* Musicians hands abstract notes plucking */}
                <circle cx="48" cy="40" r="2.5" fill="#FFEAA7" className="animate-ping" />
                <circle cx="53" cy="52" r="2" fill="#FFEAA7" className="animate-pulse" />
              </svg>
            </div>

            {/* MAJESTIC TYPOGRAPHY APPEARANCE */}
            <div className="space-y-4 max-w-lg z-10">
              <AnimatePresence>
                {splashStep >= 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-1.5"
                  >
                    <span className="text-[#D4AF37] text-[10px] tracking-[0.25em] font-mono font-black uppercase block">
                      Y'A GOMBO MUSIC
                    </span>
                    <h1 className="text-4xl md:text-5xl font-sans font-black tracking-tight text-white uppercase bg-clip-text bg-gradient-to-b from-white via-white to-neutral-400">
                      AFRIGOMBO
                    </h1>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {splashStep >= 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.9, delay: 0.1 }}
                    className="space-y-3 px-4 pt-2"
                  >
                    <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto" />
                    <p className="text-xs font-mono text-zinc-400 tracking-wide font-medium">
                      "Le Temple du Gombo"
                    </p>
                    <p className="text-[11px] font-sans text-zinc-550 leading-relaxed max-w-xs mx-auto">
                      Vos opportunités musicales certifiées,<br />
                      vos cachets sécurisés en Côte d'Ivoire.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Credit of Prestige */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-mono uppercase tracking-[0.3em] text-[#D4AF37]/50 max-w-xs">
              Académie Impériale d'Abidjan
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAIN APPLICATION LAYER */}
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route 
          path="/home" 
          element={
            <ProfileGuard>
              <MainAppLayout darkMode={darkMode} setDarkMode={setDarkModeWrapped} />
            </ProfileGuard>
          } 
        />
        <Route 
          path="/complete-profile" 
          element={
            <AuthGuard>
              <CompleteProfileView />
            </AuthGuard>
          } 
        />
        <Route 
          path="/auth" 
          element={<AuthPage />} 
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      
      {/* 3. PERSISTENT BACKGROUND MUSIC */}
      <BackgroundMusic />
      {((typeof window !== "undefined" && window.location.search.includes("debug=true")) || import.meta.env.DEV) && (
        <SuperFounderDebug />
      )}
    </div>
  </ErrorBoundary>
);
}

export default App;
