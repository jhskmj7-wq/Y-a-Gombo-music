import React, { createContext, useContext, useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { gomboDB, gomboAuth } from "./firebase";
import { UserProfile } from "./types";
import { useNavigate } from "react-router-dom";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = gomboAuth.onAuthStateChanged(async (firebaseUser) => {
      console.log("AUTH STATE:", firebaseUser);
      setCurrentUser(firebaseUser || null);

      if (firebaseUser) {
        console.log("USER:", firebaseUser);
        try {
          const uProfile = await gomboDB.getUserProfile(firebaseUser.uid);
          setProfile(uProfile);
        } catch (error) {
          console.error("Error fetching user profile in auth state change:", error);
        }
      } else {
        setProfile(null);
      }

      setAuthLoading(false);
    });

    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    return await gomboAuth.signIn(email, password);
  };

  const signUp = async (email: string, password: string, role: "musicien" | "client", details: any) => {
    return await gomboAuth.signUp(email, password, role, details);
  };

  const loginWithGoogle = async () => {
    try {
      console.log("🚀 Début Google Login");
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

  return (
    <AuthContext.Provider value={{ currentUser, profile, loading: authLoading, signIn, signUp, loginWithGoogle, logout, refreshProfile, setProfile }}>
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
      <div className="flex flex-col items-center justify-center p-12 min-h-screen bg-[#050505] animate-pulse select-none">
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mb-4" />
        <p className="text-xs font-mono tracking-widest text-[#D4AF37] uppercase">Synchronisation AFRIGOMBO...</p>
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
