import React, { useState, useEffect, Suspense, lazy, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { audioSynth } from "./lib/audio";
import { Music, Award, ShieldCheck, Sparkles } from "lucide-react";
import { BackgroundMusic } from "./components/BackgroundMusic";
import { FloatingAudioPlayer } from "./components/FloatingAudioPlayer";
import { LivingInteractions } from "./components/LivingInteractions";
import { useAuth } from "./AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { ProfileGuard } from "./components/ProfileGuard";
import CompleteProfile from "./components/CompleteProfile";
import AuthPage from "./components/AuthPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import AfrigomboCinematicIntro from "./components/AfrigomboCinematicIntro";
import PremiumLoader from "./components/PremiumLoader";
import PWAHandler from "./components/PWAHandler";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { gomboDB, db } from "./firebase";
import { app } from "./lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import MaintenanceScreen from "./components/MaintenanceScreen";
import { SecurityService } from "./lib/SecurityService";
import { AfriGomboLogo } from "./components/AfriGomboLogo";
import ScrollToTop from "./components/ScrollToTop";
import { lazyWithRetry } from "./lib/lazyWithRetry";
import { syncManager } from "./lib/SyncManager";
import GlobalNotificationBanner from "./components/GlobalNotificationBanner";
import { bootManager } from "./lib/BootManager";
import BootSplashScreen from "./components/BootSplashScreen";

const safeGetItem = (key: string, fallback: string = ""): string => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (e) {
    return fallback;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // ignore
  }
};

// Lazy load the main Application Layer
const AdminCentre = lazyWithRetry(() => import("./components/AdminCentre"));

const MainAppLayout = React.memo(function MainAppLayout() {
  const { theme, toggleTheme } = useTheme();
  return (
     <Suspense fallback={
       <div className="flex h-[100dvh] items-center justify-center bg-afri-bg">
          <div className="w-16 h-16 rounded-full border-t-2 border-afri-gold animate-spin shadow-[0_0_20px_rgba(212,175,55,0.2)]"></div>
       </div>
    }>
      <div className="fixed top-0 left-0 w-full z-[9999]"><GlobalNotificationBanner /></div>
      <LivingInteractions />
      <AdminCentre theme={theme} toggleTheme={toggleTheme} />
    </Suspense>
  );
});

// A wrapper to handle the CompleteProfile rendering cleanly
function CompleteProfileView() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  if (!profile) {
    return <PremiumLoader message="Chargement du Profil..." />;
  }
  
  return (
    <div className="w-full h-full h-[100dvh] bg-afri-bg flex items-center justify-center py-6 overflow-y-auto overscroll-contain touch-pan-y px-4 font-sans select-none">
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
  const { loading: authLoading, currentUser } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "platform"), (snap) => {
      setIsMaintenance(snap.data()?.status === "maintenance");
    });
    return () => unsub();
  }, []);
  const { theme } = useTheme();
  const location = useLocation();
  
  // ... (inside the component)

  useEffect(() => {
    bootManager.runDiagnostics().then(res => console.log("Boot diagnostics finished", res));
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const scrollableElements = document.querySelectorAll('.overflow-y-auto');
    scrollableElements.forEach(el => {
      (el as HTMLElement).scrollTop = 0;
    });
  }, [location.pathname]);

  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      return !search.includes("transferId") && !search.includes("auth_transfer");
    }
    return true;
  });
  const [showCinematicIntro, setShowCinematicIntro] = useState(() => {
    if (typeof window !== "undefined") {
      return safeGetItem("gombo_cinematic_intro_done") !== "true";
    }
    return false;
  });
  const isInitialized = useRef(false);
  const [progress, setProgress] = useState(0);
  const [logoUrl, setLogoUrl] = useState<string>(() => safeGetItem("custom_app_logo") || "/logo_afrigombo.png");
  const [isLogoLoaded, setIsLogoLoaded] = useState(false);
  const [isLogoFailed, setIsLogoFailed] = useState(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    setIsLogoLoaded(false);
    setIsLogoFailed(false);
    const img = new Image();
    img.src = logoUrl;
    img.onload = () => setIsLogoLoaded(true);
    img.onerror = () => setIsLogoFailed(true);
  }, [logoUrl]);

  useEffect(() => {
    const handleLogoUpdate = () => {
      setLogoUrl(safeGetItem("custom_app_logo") || "/logo_afrigombo.png");
    };
    window.addEventListener("custom-logo-updated", handleLogoUpdate);
    return () => window.removeEventListener("custom-logo-updated", handleLogoUpdate);
  }, []);

  useEffect(() => {
    if (!showSplash) return;
    
    // Safety timeout: Hide splash after 12 seconds regardless of state
    const safetyTimeout = setTimeout(() => {
      console.warn("⚠️ [AFRIGOMBO] Splash safety timeout triggered. Forcing entry.");
      setShowSplash(false);
    }, 12000);
    
    let startTimestamp = Date.now();
    const duration = 1500; // 1.5 seconds fast boot

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimestamp;
      const calculatedProgress = Math.min((elapsed / duration) * 100, 100);

      setProgress(calculatedProgress);

      if (calculatedProgress >= 100) {
        clearInterval(interval);
        clearTimeout(safetyTimeout);
        // Play success kora sound
        try {
          audioSynth.playKoraNote(523.25, 0, 0.12, 0.6);
        } catch (err) {
          console.warn("Audio Context startup play blocked or unsupported:", err);
        }
        setShowSplash(false);
      }
    }, 30);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimeout);
    };
  }, [authLoading, showSplash]);

  const isSuperUser = SecurityService.isFounder(currentUser) || SecurityService.isAdmin(currentUser);
  if (isMaintenance && !isSuperUser) {
    return <MaintenanceScreen message="L'application est actuellement en maintenance. Veuillez patienter." />;
  }

  if (showCinematicIntro) {
    return (
      <ErrorBoundary>
        <AfrigomboCinematicIntro
          onComplete={() => {
            safeSetItem("gombo_cinematic_intro_done", "true");
            setShowCinematicIntro(false);
          }}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-full h-[100dvh] w-full overflow-hidden font-sans antialiased transition-colors duration-300 bg-afri-bg text-afri-text flex flex-col">
        <ScrollToTop />
        
        {/* Main application layer, rendered cleanly */}
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

        {/* 1. PREMIUM UNIFIED BOOT SPLASH SCREEN */}
        <AnimatePresence>
          {showSplash && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <BootSplashScreen onComplete={() => setShowSplash(false)} />
            </motion.div>
          )}
        </AnimatePresence>

      {/* 3. PERSISTENT BACKGROUND MUSIC */}
      <BackgroundMusic />
      <FloatingAudioPlayer />
      <PWAHandler />
      </div>
    </ErrorBoundary>
);
}

export default App;
