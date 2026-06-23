import React, { createContext, useContext, useState, useEffect } from "react";
import { Lock } from "lucide-react";
import { signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db, googleProvider } from "./lib/firebase";
import { gomboDB } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { UserProfile } from "./types";
import { useNavigate, useLocation } from "react-router-dom";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🎬 [AuthContext] Initializing Firebase Auth observer...");

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("👤 [AuthContext] Auth state changed. firebaseUser:", firebaseUser);
      setCurrentUser(firebaseUser);
      
      if (firebaseUser) {
        console.log("🔥 [AuthContext] User connected! UID:", firebaseUser.uid);
        
        // Fetch profile from Firestore
        const uProfile = await gomboDB.getUserProfile(firebaseUser.uid);
        setProfile(uProfile);
        
        setLoading(false);
      } else {
        console.log("👤 [AuthContext] No authenticated user detected.");
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, role: string, details: any) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      role: role,
      ...details,
      createdAt: serverTimestamp()
    });
    return userCredential;
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if new user
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: "google",
        isProfileComplete: false,
        createdAt: serverTimestamp()
      });
    }
    return result;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      const uProfile = await gomboDB.getUserProfile(currentUser.uid);
      setProfile(uProfile);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, profile, loading, signIn, signUp, loginWithGoogle, logout, refreshProfile, setProfile }}>
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
