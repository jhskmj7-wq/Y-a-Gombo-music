import React, { createContext, useContext, useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { gomboDB, gomboAuth } from "./firebase";
import { auth } from "./lib/firebase";
import { serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { UserProfile } from "./types";

interface AuthContextType {
  currentUser: any | null;       
  profile: UserProfile | null;   
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, role: "musicien" | "client", details: { firstName: string; lastName: string; phone: string; commune: string }) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  showAuthPopup: boolean;
  setShowAuthPopup: (show: boolean) => void;
  requireAuth: (action: () => void) => void;
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

  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    // Safety timeout to prevent white screens if Firebase Auth hangs on mobile
    const safetyTimer = setTimeout(() => {
      setAuthLoading(false);
    }, 3500);

    // Handle Google redirect sign-in result when returning to the application
    const checkRedirect = async () => {
      try {
        await gomboAuth.handleAuthRedirect();
      } catch (err) {
        console.error("Error retrieving redirect sign-in result:", err);
      }
    };
    checkRedirect();

    const unsubscribe = gomboAuth.onAuthStateChanged(async (firebaseUser) => {
      clearTimeout(safetyTimer);
      
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        try {
          let uProfile = await gomboDB.getUserProfile(firebaseUser.uid);
          
          if (!uProfile) {
            const names = typeof firebaseUser.displayName === "string" ? firebaseUser.displayName.split(" ") : ["Artiste", "Afrigombo"];
            const isFounder = firebaseUser.email === "jhs.kmj7@gmail.com";
            const founderPermissions = [
              "admin",
              "founder",
              "dashboard",
              "users",
              "verification",
              "payments",
              "reports",
              "settings"
            ];

            uProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              firstName: names[0] || "",
              lastName: names.slice(1).join(" ") || "",
              displayName: firebaseUser.displayName || names.join(" "),
              photoURL: firebaseUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
              avatarUrl: firebaseUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
              role: isFounder ? "admin" : "client",
              isFounder: isFounder,
              permissions: isFounder ? founderPermissions : [],
              provider: firebaseUser.providerData?.[0]?.providerId || "google.com",
              isProfileComplete: false,
              isVerified: false,
              balance: 0,
              totalRevenue: 0,
              createdAt: serverTimestamp() as any
            };
            
            await gomboDB.updateUserProfile(firebaseUser.uid, uProfile);
          } else {
            // Fill missing avatar or display name in profile if empty
            if (!uProfile.photoURL && firebaseUser.photoURL) uProfile.photoURL = firebaseUser.photoURL;
            if (!uProfile.avatarUrl && firebaseUser.photoURL) uProfile.avatarUrl = firebaseUser.photoURL;
            if (!uProfile.displayName && firebaseUser.displayName) uProfile.displayName = firebaseUser.displayName;
            if (!uProfile.email && firebaseUser.email) uProfile.email = firebaseUser.email;

            // Ensure founder role is set for existing profile if email matches
            if (firebaseUser.email === "jhs.kmj7@gmail.com" && (!uProfile.isFounder || uProfile.role !== "admin" || !uProfile.isVip || !uProfile.isPro)) {
              const founderPermissions = [
                "admin",
                "founder",
                "dashboard",
                "users",
                "verification",
                "payments",
                "reports",
                "settings"
              ];
              uProfile.role = "admin";
              uProfile.isFounder = true;
              uProfile.isVip = true;
              uProfile.isPro = true;
              uProfile.permissions = founderPermissions;
              await gomboDB.updateUserProfile(firebaseUser.uid, { 
                role: "admin", 
                isFounder: true,
                isVip: true,
                isPro: true,
                permissions: founderPermissions
              });
            }
          }
          
          if (firebaseUser.email === "jhs.kmj7@gmail.com") {
            uProfile.isFounder = true;
            uProfile.role = "admin";
            uProfile.isVip = true;
            uProfile.isPro = true;
          }

          setProfile(uProfile);
          try {
            localStorage.setItem("afrigombo_user_session", JSON.stringify(uProfile));
          } catch (e) {}

          // Now listen in real-time to keep wallet and other attributes synced
          profileUnsub = gomboDB.listenUserProfile(firebaseUser.uid, (realtimeProfile) => {
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
              setProfile(realtimeProfile);
              try {
                localStorage.setItem("afrigombo_user_session", JSON.stringify(realtimeProfile));
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
    return await gomboAuth.signIn(email, password);
  };

  const signUp = async (email: string, password: string, role: "musicien" | "client", details: any) => {
    return await gomboAuth.signUp(email, password, role, details);
  };

  const loginWithGoogle = async () => {
    try {
      await gomboAuth.loginWithGoogle();
    } catch (error) {
      console.error("❌ Google Login Error:", error);
    }
  };

  const logout = async () => {
    await gomboAuth.signOut();
  };

  const refreshProfile = async () => {
    if (currentUser) {
      const uProfile = await gomboDB.getUserProfile(currentUser.uid);
      setProfile(uProfile);
    }
  };

  const requireAuth = (action: () => void) => {
    if (!currentUser) {
      setShowAuthPopup(true);
      return;
    }
    action();
  };

  const authContextValue = React.useMemo(() => ({ 
    currentUser, 
    profile, 
    loading: authLoading, 
    signIn, 
    signUp, 
    loginWithGoogle, 
    logout, 
    refreshProfile, 
    setProfile, 
    showAuthPopup, 
    setShowAuthPopup, 
    requireAuth 
  }), [currentUser, profile, authLoading, showAuthPopup]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
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
        <p className="text-xs font-mono tracking-widest text-[#D4AF37] uppercase">Synchronisation AFRIGOMBO...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      fallback || (
        <div className="max-w-md mx-auto text-center p-8 bg-white dark:bg-afri-bg-sec border border-gray-150 dark:border-gray-800 rounded-3xl shadow-xl mt-12 space-y-4">
          <Lock className="w-12 h-12 text-orange-500 mx-auto" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-afri-text">Accès Réservé</h3>
          <p className="text-sm text-afri-text-sec">Veuillez vous connecter pour accéder à cet espace showbiz.</p>
        </div>
      )
    );
  }

  return <>{children}</>;
}
