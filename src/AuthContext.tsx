import React, { createContext, useContext, useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { authService } from "./auth/authService";
import { db, auth } from "./lib/firebase";
import { doc, getDoc, serverTimestamp } from "firebase/firestore";
import { UserProfile } from "./types";
import { PremiumEngine } from "./lib/premiumEngine";
import { fetchPlatformPricing, getCanonicalWalletBalance } from "./lib/financial";
import { safeStringify } from "./lib/jsonUtils";
import { AuthModal } from "./components/auth/AuthModal";
import { isMenuPublic, isMenuProtected, getMenuAccessLevel } from "./auth/accessPolicy";
import type { AccessLevel } from "./auth/accessPolicy";
import { 
  PendingAuthIntent, 
  savePendingAuthIntent, 
  getPendingAuthIntent, 
  clearPendingAuthIntent 
} from "./lib/authIntent";

export { isMenuPublic, isMenuProtected, getMenuAccessLevel, savePendingAuthIntent, getPendingAuthIntent, clearPendingAuthIntent };
export type { AccessLevel, PendingAuthIntent };

interface AuthContextType {
  currentUser: any | null;       
  profile: UserProfile | null;   
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, role: "musicien" | "client", details: { firstName: string; lastName: string; phone: string; commune: string }) => Promise<any>;
  loginWithApple: () => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  showAuthPopup: boolean;
  setShowAuthPopup: (show: boolean) => void;
  requireAuth: (action: () => void, intent?: PendingAuthIntent) => void;
  pendingIntent: PendingAuthIntent | null;
  setPendingIntent: (intent: PendingAuthIntent | null) => void;
  clearPendingIntent: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("afrigombo_user_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.uid) {
            return {
              uid: parsed.uid,
              email: parsed.email || "",
              displayName: parsed.displayName || "",
              photoURL: parsed.photoURL || parsed.avatarUrl || "",
              emailVerified: true
            };
          }
        }
      } catch (e) {}
    }
    return null;
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("afrigombo_user_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.uid) return parsed;
        }
      } catch (e) {}
    }
    return null;
  });

  const [authLoading, setAuthLoading] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("afrigombo_user_session");
        if (stored) return false;
      } catch (e) {}
    }
    return true;
  });
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [pendingIntent, setPendingIntentState] = useState<PendingAuthIntent | null>(() => getPendingAuthIntent());
  const pendingCallbackRef = React.useRef<(() => void) | null>(null);

  const setPendingIntent = React.useCallback((intent: PendingAuthIntent | null) => {
    if (intent) {
      savePendingAuthIntent(intent);
      setPendingIntentState(intent);
    } else {
      clearPendingAuthIntent();
      setPendingIntentState(null);
    }
  }, []);

  const clearPendingIntent = React.useCallback(() => {
    clearPendingAuthIntent();
    setPendingIntentState(null);
  }, []);

  // Listen to cross-component intent changes
  useEffect(() => {
    const handleIntentEvent = (e: any) => {
      setPendingIntentState(e.detail || null);
    };
    window.addEventListener("afrigombo_auth_intent_changed", handleIntentEvent);
    return () => {
      window.removeEventListener("afrigombo_auth_intent_changed", handleIntentEvent);
    };
  }, []);

  useEffect(() => {
    fetchPlatformPricing().catch(console.error);

    let profileUnsub: (() => void) | null = null;

    const safetyTimer = setTimeout(() => {
      setAuthLoading(false);
    }, 1500);

    // Handle Google/Apple redirect sign-in result ONCE at startup
    authService.handleAuthRedirect().catch((err) => {
      console.error("Error retrieving redirect sign-in result:", err);
    });

    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      clearTimeout(safetyTimer);
      
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        setShowAuthPopup(false);

        // Auto-resume in-memory pending action callback if present
        if (pendingCallbackRef.current) {
          const cb = pendingCallbackRef.current;
          pendingCallbackRef.current = null;
          try {
            cb();
          } catch (err) {
            console.error("Error executing pending auth callback:", err);
          }
        }
        try {
          const uProfile = await authService.ensureUserDocument(firebaseUser, firebaseUser.providerData?.[0]?.providerId || "google.com");
          setProfile(uProfile);
          try {
            localStorage.setItem("afrigombo_user_session", safeStringify(uProfile));
          } catch (e) {}

          profileUnsub = authService.listenUserProfile(firebaseUser.uid, (realtimeProfile) => {
            if (realtimeProfile) {
              if (!realtimeProfile.photoURL && firebaseUser.photoURL) realtimeProfile.photoURL = firebaseUser.photoURL;
              if (!realtimeProfile.avatarUrl && firebaseUser.photoURL) realtimeProfile.avatarUrl = firebaseUser.photoURL;
              if (!realtimeProfile.displayName && firebaseUser.displayName) realtimeProfile.displayName = firebaseUser.displayName;
              
              if (firebaseUser.email === "jhs.kmj7@gmail.com") {
                realtimeProfile.isFounder = true;
                realtimeProfile.role = "admin";
                realtimeProfile.isVip = true;
                realtimeProfile.isPro = true;
              }
              
              if (PremiumEngine.isPremium(realtimeProfile)) {
                PremiumEngine.syncPremiumStatus(firebaseUser.uid, realtimeProfile).catch(err => {
                  console.error("Error in PremiumEngine syncPremiumStatus:", err);
                });
              }

              setProfile(realtimeProfile);
              try {
                localStorage.setItem("afrigombo_user_session", safeStringify(realtimeProfile));
              } catch (e) {}
            }
          });
        } catch (error) {
          console.error("Error fetching/creating user profile in auth state change:", error);
        }
      } else {
        setCurrentUser(null);
        setProfile(null);
        try {
          localStorage.removeItem("afrigombo_user_session");
        } catch (e) {}
      }

      setAuthLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Fallback or email signin if needed
    throw new Error("Connexion par email non prise en charge. Veuillez utiliser Google ou Apple.");
  };

  const signUp = async (email: string, password: string, role: "musicien" | "client", details: any) => {
    throw new Error("Inscription par email non prise en charge. Veuillez utiliser Google ou Apple.");
  };

  const loginWithApple = async () => {
    try {
      const res = await authService.signInWithApple();
      setShowAuthPopup(false);
      if (pendingCallbackRef.current) {
        const cb = pendingCallbackRef.current;
        pendingCallbackRef.current = null;
        try {
          cb();
        } catch (err) {
          console.error("Error executing pending auth callback:", err);
        }
      }
      return res;
    } catch (error) {
      console.error("❌ Apple Login Error:", error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const res = await authService.signInWithGoogle();
      setShowAuthPopup(false);
      if (pendingCallbackRef.current) {
        const cb = pendingCallbackRef.current;
        pendingCallbackRef.current = null;
        try {
          cb();
        } catch (err) {
          console.error("Error executing pending auth callback:", err);
        }
      }
      return res;
    } catch (error) {
      console.error("❌ Google Login Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem("afrigombo_user_session");
      clearPendingAuthIntent();
    } catch (e) {}
    setPendingIntentState(null);
    pendingCallbackRef.current = null;
    setCurrentUser(null);
    setProfile(null);
    await authService.signOut();
  };

  const refreshProfile = async () => {
    if (currentUser) {
      const uProfile = await authService.getUserProfile(currentUser.uid);
      setProfile(uProfile);
    }
  };

  const requireAuth = React.useCallback((action: () => void, intent?: PendingAuthIntent) => {
    if (!currentUser) {
      pendingCallbackRef.current = action;
      if (intent) {
        setPendingIntent(intent);
      }
      setShowAuthPopup(true);
      return;
    }
    action();
  }, [currentUser, setPendingIntent]);

  const authContextValue = React.useMemo(() => ({ 
    currentUser, 
    profile, 
    loading: authLoading, 
    isAuthenticated: !!currentUser,
    isGuest: !currentUser && !authLoading,
    signIn, 
    signUp, 
    loginWithApple,
    loginWithGoogle, 
    logout, 
    refreshProfile, 
    setProfile, 
    showAuthPopup, 
    setShowAuthPopup, 
    requireAuth,
    pendingIntent,
    setPendingIntent,
    clearPendingIntent
  }), [currentUser, profile, authLoading, showAuthPopup, requireAuth, pendingIntent, setPendingIntent, clearPendingIntent]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
      <AuthModal 
        open={showAuthPopup} 
        onClose={() => setShowAuthPopup(false)} 
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-screen bg-afri-bg-sec animate-pulse select-none">
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mb-4" />
        <p className="text-xs font-mono tracking-widest text-[#D4AF37] uppercase">Synchronisation AFRIGOMBO ELITE...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      fallback || (
        <div className="max-w-md mx-auto text-center p-8 bg-white dark:bg-afri-bg-sec border border-gray-150 dark:border-afri-border rounded-3xl shadow-xl mt-12 space-y-4">
          <Lock className="w-12 h-12 text-orange-500 mx-auto" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-afri-text">Accès Réservé</h3>
          <p className="text-sm text-afri-text-sec">Veuillez vous connecter pour accéder à cet espace showbiz.</p>
        </div>
      )
    );
  }

  return <>{children}</>;
}
