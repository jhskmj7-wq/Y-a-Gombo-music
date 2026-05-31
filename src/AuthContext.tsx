import React, { createContext, useContext, useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { gomboAuth, gomboDB } from "./firebase";
import { UserProfile } from "./types";

interface AuthContextType {
  currentUser: any | null;       // Original Firebase user or mock auth credentials
  profile: UserProfile | null;   // Fully populated Firestore user profile
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, role: "musicien" | "client", details: { firstName: string; lastName: string; phone: string; commune: string }) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem("gombo_auth");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("gombo_active_profile");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (currentUser) {
      console.log("🔍 [AuthContext] Refreshing profile for uid:", currentUser.uid);
      try {
        const uProfile = await gomboDB.getUserProfile(currentUser.uid);
        console.log("🔍 [AuthContext] Firestore response for user profile:", uProfile);
        setProfile(uProfile);
        if (uProfile) {
          localStorage.setItem("gombo_active_profile", JSON.stringify(uProfile));
        }
      } catch (err) {
        console.error("❌ [AuthContext] Error retrieving user profile:", err);
      }
    }
  };

  useEffect(() => {
    console.log("🎬 [AuthContext] Initializing Firebase Auth observer...");
    let profileUnsubscribe: (() => void) | null = null;
    let fallbackTimeout: NodeJS.Timeout | null = null;

    const authUnsubscribe = gomboAuth.onAuthStateChanged(async (firebaseUser) => {
      console.log("👤 [AuthContext] Auth state changed. firebaseUser:", firebaseUser);
      setCurrentUser(firebaseUser);
      
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
        fallbackTimeout = null;
      }

      // Cleanup previous profile listener
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (firebaseUser) {
        console.log("🔥 [AuthContext] User detected! UID:", firebaseUser.uid, "Email:", firebaseUser.email);
        localStorage.setItem("gombo_auth", JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified
        }));

        // --- STEP 1: INSTANT PROFILE LOAD (NO WAITING FOR FIRESTORE) ---
        let initialProfile: UserProfile | null = null;
        try {
          const cached = localStorage.getItem("gombo_active_profile");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.uid === firebaseUser.uid) {
              initialProfile = parsed;
              console.log("🎒 [AuthContext] Loaded profile instantly from LocalCache:", initialProfile);
            }
          }
        } catch (err) {
          console.warn("⚠️ Error parsing cached profile:", err);
        }

        // If no cache, generate mock/default immediately so the UI is active right away
        if (!initialProfile) {
          const nameParts = firebaseUser.displayName ? firebaseUser.displayName.split(" ") : ["Artiste", "Gombo"];
          const primaryProvider = firebaseUser.providerData && firebaseUser.providerData[0] 
            ? firebaseUser.providerData[0].providerId 
            : "google.com";

          initialProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            firstName: nameParts[0] || "Artiste",
            lastName: nameParts.slice(1).join(" ") || "Ivoirien",
            phone: firebaseUser.phoneNumber || "",
            commune: "Cocody",
            role: "musicien", // default role
            avatarUrl: firebaseUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
            photoURL: firebaseUser.photoURL || "",
            displayName: firebaseUser.displayName || `${nameParts[0]} ${nameParts.slice(1).join(" ")}`.trim() || "Artiste Gombo",
            provider: primaryProvider,
            isProfileComplete: false,
            balance: 0,
            totalRevenue: 0,
            totalWithdrawals: 0,
            gigsCompleted: 0,
            applicationsSent: 0,
            acceptanceRate: 100,
            createdAt: new Date().toISOString()
          };
          console.log("💾 [AuthContext] Built default initial profile:", initialProfile);
          localStorage.setItem("gombo_active_profile", JSON.stringify(initialProfile));
        }

        // Make the profile active and stop the loading spinner instantly
        setProfile(initialProfile);
        setLoading(false);

        // --- STEP 2: BACKGROUND FIRESTORE SYNC & LISTENER ---
        const syncAndListenFirestore = async () => {
          try {
            console.log("🔍 [AuthContext DB Sync] Verifying/creating Firestore document in background for:", firebaseUser.uid);
            let uProfile = await gomboDB.getUserProfile(firebaseUser.uid);
            
            if (!uProfile && initialProfile) {
              const pendingProfile = gomboDB.getPendingSignUpProfile();
              if (pendingProfile) {
                console.log("🎯 [AuthContext Sync] Found pending registration data. Saving to Firestore...");
                uProfile = { ...pendingProfile, uid: firebaseUser.uid };
              } else {
                console.log("⚠️ [AuthContext Sync] Creating new Firestore matching profile...");
                uProfile = { ...initialProfile };
              }
              await gomboDB.updateUserProfile(firebaseUser.uid, uProfile);
            }

            // Sync backend updates to local state
            if (uProfile) {
              setProfile(uProfile);
              localStorage.setItem("gombo_active_profile", JSON.stringify(uProfile));
            }
          } catch (syncErr) {
            console.warn("⚠️ Background profile sync got non-fatal error:", syncErr);
          }

          // Attach subscription
          console.log("🔗 [AuthContext Live] Hooking real-time subscription for users/" + firebaseUser.uid);
          profileUnsubscribe = gomboDB.listenUserProfile(firebaseUser.uid, (updatedProfile) => {
            if (updatedProfile) {
              console.log("⚡ [AuthContext Live Sync] Profile updated live from Firestore:", updatedProfile);
              setProfile(updatedProfile);
              localStorage.setItem("gombo_active_profile", JSON.stringify(updatedProfile));
            }
          });
        };

        // Run sync-and-listen inside background microtask
        syncAndListenFirestore();

      } else {
        console.log("👤 [AuthContext] No authenticated user detected.");
        setProfile(null);
        localStorage.removeItem("gombo_auth");
        localStorage.removeItem("gombo_active_profile");
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log("📂 [AuthContext] Performing signIn with email:", email);
      const res = await gomboAuth.signIn(email, password);
      console.log("✅ [AuthContext] signIn success:", res);
      return res;
    } catch (err) {
      console.error("❌ [AuthContext] signIn error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    role: "musicien" | "client",
    details: { firstName: string; lastName: string; phone: string; commune: string }
  ) => {
    setLoading(true);
    try {
      console.log("📂 [AuthContext] Performing signUp with email:", email, "role:", role);
      const res = await gomboAuth.signUp(email, password, role, details);
      console.log("✅ [AuthContext] signUp success:", res);
      return res;
    } catch (err) {
      console.error("❌ [AuthContext] signUp error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      console.log("📂 [AuthContext] Performing loginWithGoogle...");
      const res = await gomboAuth.loginWithGoogle();
      console.log("✅ [AuthContext] Google Login success:", res);
      return res;
    } catch (err) {
      console.error("❌ [AuthContext] Google Login error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      console.log("🚪 [AuthContext] Signing out...");
      await gomboAuth.signOut();
      console.log("✅ [AuthContext] Signed out.");
      setCurrentUser(null);
      setProfile(null);
    } catch (err) {
      console.error("❌ [AuthContext] signOut error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, profile, loading, signIn, signUp, loginWithGoogle, logout, refreshProfile }}>
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
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px] animate-pulse">
        <div className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-bold text-gray-500">Chargement de votre session sécurisée...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      fallback || (
        <div className="max-w-md mx-auto text-center p-8 bg-white dark:bg-[#121214] border border-gray-150 dark:border-gray-800 rounded-3xl shadow-xl mt-12 space-y-4">
          <Lock className="w-12 h-12 text-orange-500 mx-auto" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Accès Réservé</h3>
          <p className="text-sm text-gray-500">Veuillez vous connecter pour accéder à cet espace showbiz.</p>
        </div>
      )
    );
  }

  return <>{children}</>;
}
