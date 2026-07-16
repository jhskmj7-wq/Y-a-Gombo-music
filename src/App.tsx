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
import PWAHandler from "./components/PWAHandler";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

// Lazy load the main Application Layer
const AdminCentre = lazy(() => import("./components/AdminCentre"));

const MainAppLayout = React.memo(function MainAppLayout() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Suspense fallback={
       <div className="flex h-screen items-center justify-center bg-afri-bg">
          <div className="w-16 h-16 rounded-full border-t-2 border-afri-gold animate-spin"></div>
       </div>
    }>
      <div className="fixed top-0 left-0 w-full z-[9999]"><GlobalNotificationBanner /></div>
      <LivingInteractions />
      <AdminCentre theme={theme} toggleTheme={toggleTheme} />
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
    <div className="w-full min-h-screen bg-afri-bg flex items-center justify-center py-6 overflow-y-auto px-4 font-sans select-none">
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
  const { loading: authLoading } = useAuth();
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
  const [progress, setProgress] = useState(0);
  const [logoUrl, setLogoUrl] = useState<string>(() => localStorage.getItem("custom_app_logo") || "/public/logo_afrigombo.png");

  useEffect(() => {
    const handleLogoUpdate = () => {
      setLogoUrl(localStorage.getItem("custom_app_logo") || "/public/logo_afrigombo.png");
    };
    window.addEventListener("custom-logo-updated", handleLogoUpdate);
    return () => window.removeEventListener("custom-logo-updated", handleLogoUpdate);
  }, []);

  useEffect(() => {
    if (!showSplash) return;
    
    let startTimestamp = Date.now();
    const duration = 2500; // 2.5 seconds total

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimestamp;
      let calculatedProgress = Math.min((elapsed / duration) * 100, 100);

      // Cap progress at 95% if Firebase authentication is still loading
      if (authLoading && calculatedProgress >= 95) {
        calculatedProgress = 95;
      }

      setProgress(calculatedProgress);

      if (calculatedProgress >= 100 && !authLoading) {
        clearInterval(interval);
        // Play success kora sound
        try {
          audioSynth.playKoraNote(523.25, 0, 0.12, 0.6);
        } catch (err) {
          console.warn("Audio Context startup play blocked or unsupported:", err);
        }
        setShowSplash(false);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [authLoading, showSplash]);

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

  return (
    <ThemeProvider>
    <ErrorBoundary>
      <div className="h-screen overflow-hidden font-sans antialiased transition-colors duration-300 bg-afri-bg text-afri-text">
        
        {/* Main application layer, rendered in background once auth is ready */}
        {!authLoading && (
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route 
              path="/home" 
              element={
                <ProfileGuard>
                  <MainAppLayout />
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
        )}

        {/* 1. PREMIUM UNIFIED SPLASH SCREEN */}
        <AnimatePresence>
          {showSplash && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: "easeInOut" }}
              className="fixed inset-0 bg-[#000000] z-[9999] flex flex-col items-center justify-center text-center p-4 xs:p-6 select-none overflow-y-auto sm:overflow-hidden"
            >
              {/* Ambient Gold Dust / Particles */}
              <div className="absolute inset-0 pointer-events-none z-0">
                {Array.from({ length: 18 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="absolute rounded-full bg-gradient-to-tr from-[#D4AF37] to-amber-200/40 opacity-40 animate-pulse"
                    style={{
                      width: `${Math.random() * 2.5 + 1}px`,
                      height: `${Math.random() * 2.5 + 1}px`,
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDuration: `${Math.random() * 3 + 2}s`,
                      animationDelay: `${Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>

              {/* Logo Frame with Golden Halo */}
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center mb-6 rounded-full bg-black/80 border border-[#D4AF37]/20 shadow-[0_0_50px_rgba(212,175,55,0.08)] z-10 shrink-0">
                <div className="absolute inset-2 rounded-full bg-[#D4AF37]/10 blur-2xl animate-pulse pointer-events-none" />
                <div className="absolute inset-1.5 border border-dashed border-[#D4AF37]/15 rounded-full animate-spin" style={{ animationDuration: "24s" }} />

                <img
                  src={logoUrl}
                  alt="AFRIGOMBO LOGO"
                  className="w-32 h-32 sm:w-38 sm:h-38 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                  onError={(e) => {
                     (e.currentTarget as HTMLImageElement).src = "/public/logo_afrigombo.png";
                  }}
                />
              </div>

              {/* Majestic Typography */}
              <div className="space-y-1.5 z-10 shrink-0">
                <span className="text-[#D4AF37] text-[10px] sm:text-[11px] tracking-[0.25em] font-mono font-black uppercase block">
                  Y'A GOMBO MUSIC
                </span>
                <h1 className="text-3xl sm:text-4xl font-sans font-black tracking-wider text-white uppercase">
                  AFRIGOMBO
                </h1>
                <p className="text-xs sm:text-sm font-mono text-zinc-100 tracking-wide font-medium mt-1">
                  "Le Temple du Gombo Musical"
                </p>
              </div>

              {/* Elegant Gold Progress Bar */}
              <div className="w-48 sm:w-56 h-1 bg-zinc-900 rounded-full overflow-hidden mx-auto my-6 relative z-10 shrink-0">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 via-[#D4AF37] to-amber-400 transition-all duration-100 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Progress steps logs */}
              {(() => {
                const steps = [
                  "Initialisation...",
                  "Vérification Firebase...",
                  "Chargement des ressources...",
                  "Synchronisation...",
                  "Bienvenue."
                ];
                const currentStepIndex = 
                  progress < 20 ? 0 :
                  progress < 45 ? 1 :
                  progress < 70 ? 2 :
                  progress < 90 ? 3 : 4;

                return (
                  <div className="space-y-1.5 text-left inline-block font-mono text-[10px] sm:text-[11px] max-w-xs mx-auto z-10 shrink-0">
                    {steps.map((stepText, idx) => {
                      const isCompleted = currentStepIndex > idx;
                      const isActive = currentStepIndex === idx;
                      
                      let icon = "○";
                      let textColor = "text-zinc-500 opacity-40";
                      
                      if (isCompleted) {
                        icon = "✓";
                        textColor = "text-[#D4AF37] font-bold";
                      } else if (isActive) {
                        icon = "●";
                        textColor = "text-white font-bold animate-pulse";
                      }
                      
                      return (
                        <div key={idx} className={`flex items-center gap-2 transition-all duration-300 ${textColor}`}>
                          <span className="w-3 text-center">{icon}</span>
                          <span>{stepText}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

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
              <MainAppLayout />
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
      <PWAHandler />
      {((typeof window !== "undefined" && window.location.search.includes("debug=true")) || import.meta.env.DEV) && (
        <SuperFounderDebug />
      )}
      </div>
    </ErrorBoundary>
    </ThemeProvider>
);
}

export default App;
