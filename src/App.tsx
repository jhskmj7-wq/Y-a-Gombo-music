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
  const { currentUser, profile } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("L'application est actuellement en maintenance. Veuillez patienter.");

  // Clean up any stale obsolete maintenance cache key in localStorage/sessionStorage
  useEffect(() => {
    try {
      localStorage.removeItem("afrigombo_maintenance_mode");
      localStorage.removeItem("maintenance_override");
      sessionStorage.removeItem("afrigombo_maintenance_mode");
    } catch (e) {}
  }, []);

  useEffect(() => {
    let securityData: any = null;

    const checkEffectiveMaintenance = (data: any) => {
      if (!data) return false;
      // 1. Direct manual toggle
      if (data.globalMode === true || data.status === "maintenance") {
        return true;
      }
      // 2. Scheduled maintenance window check
      if (data.scheduled === true && data.startAt && data.endAt) {
        const now = Date.now();
        const start = new Date(data.startAt).getTime();
        const end = new Date(data.endAt).getTime();
        if (!isNaN(start) && !isNaN(end) && now >= start && now < end) {
          return true;
        }
      }
      return false;
    };

    const updateMaintenanceState = () => {
      const isM = checkEffectiveMaintenance(securityData);
      
      setIsMaintenance(isM);

      // Pick custom message if available
      const customMsg = securityData?.globalMessage;
      if (customMsg) {
        setMaintenanceMessage(customMsg);
      } else {
        setMaintenanceMessage("L'application est actuellement en maintenance. Veuillez patienter.");
      }
    };

    const unsubSecurity = onSnapshot(doc(db, "settings", "maintenance"), (snap) => {
      securityData = snap.exists() ? snap.data() : null;
      updateMaintenanceState();
    }, (err) => {
      console.warn("Error listening to security maintenance status:", err);
    });

    // 10-second interval check to auto-activate/deactivate scheduled maintenance window dynamically
    const intervalId = setInterval(() => {
      updateMaintenanceState();
    }, 10000);

    return () => {
      unsubSecurity();
      clearInterval(intervalId);
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
      // Silencing startup sound for professional Elite feel
    } catch (err) {
      // ignore
    }
    setShowSplash(false);
  }, []);

  const isSuperUser = SecurityService.isFounder(currentUser) || 
                      SecurityService.isFounder(profile) || 
                      SecurityService.isAdmin(currentUser) || 
                      SecurityService.isAdmin(profile) ||
                      profile?.isFounder === true ||
                      currentUser?.email === "jhs.kmj7@gmail.com" ||
                      profile?.email === "jhs.kmj7@gmail.com";

  if (isMaintenance && !isSuperUser) {
    return <MaintenanceScreen message={maintenanceMessage} />;
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
