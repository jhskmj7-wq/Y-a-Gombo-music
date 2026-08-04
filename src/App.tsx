import React, { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { audioSynth } from "./lib/audio";
import { BackgroundMusic } from "./components/BackgroundMusic";
import { FloatingAudioPlayer } from "./components/FloatingAudioPlayer";
import { LivingInteractions } from "./components/LivingInteractions";
import { useAuth } from "./AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { ProfileGuard } from "./components/ProfileGuard";
import CompleteProfile from "./components/CompleteProfile";
import AuthPage from "./components/AuthPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import PremiumLoader from "./components/PremiumLoader";
import PWAHandler from "./components/PWAHandler";
import { useTheme } from "./context/ThemeContext";
import { db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";
import MaintenanceScreen from "./components/MaintenanceScreen";
import { SecurityService } from "./lib/SecurityService";
import ScrollToTop from "./components/ScrollToTop";
import { lazyWithRetry } from "./lib/lazyWithRetry";
import GlobalNotificationBanner from "./components/GlobalNotificationBanner";
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
    <div className="w-full h-full h-[100dvh] bg-afri-bg flex items-center justify-center overflow-hidden px-4 font-sans select-none">
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
  const { currentUser } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    let platMaint = false;
    let globalMaint = false;
    let securityMaint = false;

    const updateMaintenanceState = () => {
      setIsMaintenance(platMaint || globalMaint || securityMaint);
    };

    const unsubPlatform = onSnapshot(doc(db, "settings", "platform"), (snap) => {
      platMaint = snap.exists() && snap.data()?.status === "maintenance";
      updateMaintenanceState();
    }, (err) => {
      console.warn("Error listening to platform status:", err);
    });

    const unsubGlobal = onSnapshot(doc(db, "system_settings", "global"), (snap) => {
      globalMaint = snap.exists() && snap.data()?.maintenanceMode === true;
      updateMaintenanceState();
    }, (err) => {
      console.warn("Error listening to global system status:", err);
    });

    const unsubSecurity = onSnapshot(doc(db, "settings", "maintenance"), (snap) => {
      securityMaint = snap.exists() && snap.data()?.globalMode === true;
      updateMaintenanceState();
    }, (err) => {
      console.warn("Error listening to security maintenance status:", err);
    });

    return () => {
      unsubPlatform();
      unsubGlobal();
      unsubSecurity();
    };
  }, []);

  const location = useLocation();

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
      if (search.includes("transferId") || search.includes("auth_transfer")) {
        return false;
      }
      if (sessionStorage.getItem("afrigombo_splash_dismissed") === "true") {
        return false;
      }
    }
    return true;
  });

  const handleSplashComplete = useCallback(() => {
    try {
      sessionStorage.setItem("afrigombo_splash_dismissed", "true");
      audioSynth.playKoraNote(523.25, 0, 0.12, 0.6);
    } catch (err) {
      // ignore
    }
    setShowSplash(false);
  }, []);

  const isSuperUser = SecurityService.isFounder(currentUser) || SecurityService.isAdmin(currentUser);
  if (isMaintenance && !isSuperUser) {
    return <MaintenanceScreen message="L'application est actuellement en maintenance. Veuillez patienter." />;
  }

  return (
    <ErrorBoundary>
      <div className="h-full h-[100dvh] w-full overflow-x-hidden font-sans antialiased transition-colors duration-300 bg-afri-bg text-afri-text flex flex-col">
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
              key="splash-screen"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <BootSplashScreen onComplete={handleSplashComplete} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. PERSISTENT BACKGROUND MUSIC & PWA */}
        <BackgroundMusic />
        <FloatingAudioPlayer />
        <PWAHandler />
      </div>
    </ErrorBoundary>
  );
}

export default App;
