import React, { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { audioSynth } from "./lib/audio";
import { useAuth } from "./AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { WalletSecurityProvider } from "./context/WalletSecurityContext";
import { ProfileGuard } from "./components/ProfileGuard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useTheme } from "./context/ThemeContext";
import { db } from "./lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { SecurityService } from "./lib/SecurityService";
import ScrollToTop from "./components/ScrollToTop";
import { lazyWithRetry } from "./lib/lazyWithRetry";

// Static Import for Critical Navigation Layer
import AdminCentre from "./components/AdminCentre";
import BootSplashScreen from "./components/BootSplashScreen";
import PWAHandler from "./components/PWAHandler";

// Lazy Loaded Auxiliary Components
const AuthPage = lazyWithRetry(() => import("./components/AuthPage"));
const CompleteProfile = lazyWithRetry(() => import("./components/CompleteProfile"));
const MaintenanceScreen = lazyWithRetry(() => import("./components/MaintenanceScreen"));
import PremiumLoader from "./components/PremiumLoader";
const GlobalNotificationBanner = lazyWithRetry(() => import("./components/GlobalNotificationBanner"));
const BackgroundMusic = lazyWithRetry(() => import("./components/BackgroundMusic").then(m => ({ default: m.BackgroundMusic })));
const FloatingAudioPlayer = lazyWithRetry(() => import("./components/FloatingAudioPlayer").then(m => ({ default: m.FloatingAudioPlayer })));
import { LivingInteractions } from "./components/LivingInteractions";
const PWADiagnosticPage = lazyWithRetry(() => import("./components/PWADiagnosticPage"));
const TheThroneOfTheFounder = lazyWithRetry(() => import("./components/TheThroneOfTheFounder"));
const FounderThronePage = lazyWithRetry(() => import("./components/FounderThronePage"));
const IntelligentNotificationManager = lazyWithRetry(() => import("./components/IntelligentNotificationManager").then(m => ({ default: m.IntelligentNotificationManager })));

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

const MainAppLayout = React.memo(function MainAppLayout() {
  const { theme, toggleTheme } = useTheme();
  return (
     <Suspense fallback={
       <div className="flex h-[100dvh] items-center justify-center bg-afri-bg">
          <div className="w-16 h-16 rounded-full border-t-2 border-afri-gold animate-spin shadow-[0_0_20px_rgba(212,175,55,0.2)]"></div>
       </div>
    }>
      <div className="fixed top-0 left-0 w-full z-[9999]">
        <Suspense fallback={null}>
          <GlobalNotificationBanner />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <LivingInteractions />
      </Suspense>
      <AdminCentre theme={theme} toggleTheme={toggleTheme} />
    </Suspense>
  );
});

// A wrapper to handle the CompleteProfile rendering cleanly
function CompleteProfileView() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  if (!profile) {
    return (
      <Suspense fallback={<div className="h-[100dvh] w-full bg-afri-bg" />}>
        <PremiumLoader message="Chargement du Profil..." />
      </Suspense>
    );
  }
  
  return (
    <div className="w-full h-full h-[100dvh] bg-afri-bg flex items-center justify-center overflow-hidden px-4 font-sans select-none">
      <Suspense fallback={<div className="w-full h-full bg-afri-bg" />}>
        <CompleteProfile 
          currentUserProfile={profile} 
          onComplete={async () => {
            await refreshProfile();
            navigate("/home", { replace: true });
          }} 
        />
      </Suspense>
    </div>
  );
}

function App() {
  const { currentUser, profile } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);
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
      const now = Date.now();
      if (data.scheduled === true && data.startAt && data.endAt) {
        const start = new Date(data.startAt).getTime();
        const end = new Date(data.endAt).getTime();
        if (!isNaN(start) && !isNaN(end) && now >= start && now < end) {
          return true;
        }
      }
      // 3. Multi-maintenance check
      if (Array.isArray(data.schedules)) {
        const hasActiveSchedule = data.schedules.some((sched: any) => {
          const start = sched.startAt ? new Date(sched.startAt).getTime() : 0;
          const end = sched.endAt ? new Date(sched.endAt).getTime() : 0;
          return start > 0 && end > 0 && now >= start && now < end;
        });
        if (hasActiveSchedule) {
          return true;
        }
      }
      return false;
    };

    const updateMaintenanceState = () => {
      const isM = checkEffectiveMaintenance(securityData);
      
      setIsMaintenance(isM);

      // Pick custom message if available from active schedule or global
      let customMsg = "";
      if (securityData) {
        const now = Date.now();
        // Check schedules for custom message first
        if (Array.isArray(securityData.schedules)) {
          const activeSched = securityData.schedules.find((sched: any) => {
            const start = sched.startAt ? new Date(sched.startAt).getTime() : 0;
            const end = sched.endAt ? new Date(sched.endAt).getTime() : 0;
            return start > 0 && end > 0 && now >= start && now < end;
          });
          if (activeSched && activeSched.globalMessage) {
            customMsg = activeSched.globalMessage;
          }
        }
        
        if (!customMsg && securityData.globalMessage) {
          customMsg = securityData.globalMessage;
        }
      }

      if (customMsg) {
        setMaintenanceMessage(customMsg);
      } else {
        setMaintenanceMessage("L'application est actuellement en maintenance. Veuillez patienter.");
      }
    };

    const unsubSecurity = onSnapshot(doc(db, "settings", "maintenance"), (snap) => {
      securityData = snap.exists() ? snap.data() : null;
      console.log("Maintenance doc updated:", securityData);
      updateMaintenanceState();
      setLoadingMaintenance(false);
    }, (err) => {
      console.warn("Error listening to security maintenance status:", err);
      setLoadingMaintenance(false);
    });

    // 5-second interval check to auto-activate/deactivate scheduled maintenance window dynamically (faster check)
    const intervalId = setInterval(() => {
      updateMaintenanceState();
    }, 5000);

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

  if (loadingMaintenance) {
    return (
      <div className="h-[100dvh] w-full bg-[#030303] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isMaintenance && !isSuperUser) {
    return (
      <Suspense fallback={<div className="h-[100dvh] w-full bg-afri-bg" />}>
        <MaintenanceScreen message={maintenanceMessage} />
      </Suspense>
    );
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
            element={
              <Suspense fallback={<div className="h-[100dvh] w-full bg-afri-bg" />}>
                <AuthPage />
              </Suspense>
            } 
          />
          <Route 
            path="/pwa-diagnostic" 
            element={
              <Suspense fallback={<div className="h-[100dvh] w-full bg-afri-bg" />}>
                <PWADiagnosticPage />
              </Suspense>
            } 
          />
          <Route 
            path="/The-Throne-Of-The-Founder" 
            element={
              <AuthGuard>
                <Suspense fallback={<div className="h-[100dvh] w-full bg-afri-bg animate-pulse" />}>
                  <TheThroneOfTheFounder />
                </Suspense>
              </AuthGuard>
            } 
          />
          <Route 
            path="/Le-Throne-Of-The-Founder" 
            element={
              <AuthGuard>
                <Suspense fallback={<div className="h-[100dvh] w-full bg-afri-bg animate-pulse" />}>
                  <TheThroneOfTheFounder />
                </Suspense>
              </AuthGuard>
            } 
          />
          <Route 
            path="/Le-Trone-Du-Fondateur" 
            element={
              <AuthGuard>
                <Suspense fallback={<div className="h-[100dvh] w-full bg-afri-bg animate-pulse" />}>
                  <FounderThronePage />
                </Suspense>
              </AuthGuard>
            } 
          />
          <Route 
            path="/founder-throne" 
            element={
              <AuthGuard>
                <Suspense fallback={<div className="h-[100dvh] w-full bg-afri-bg animate-pulse" />}>
                  <FounderThronePage />
                </Suspense>
              </AuthGuard>
            } 
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
              <Suspense fallback={null}>
                <BootSplashScreen onComplete={handleSplashComplete} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. PERSISTENT BACKGROUND MUSIC & PWA HANDLER */}
        <Suspense fallback={null}>
          <BackgroundMusic />
          <FloatingAudioPlayer />
          <PWAHandler />
          <IntelligentNotificationManager />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default App;
