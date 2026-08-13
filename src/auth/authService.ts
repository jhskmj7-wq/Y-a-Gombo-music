import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  User as FirebaseUser
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { UserProfile } from "../types";
import { getCanonicalWalletBalance } from "../lib/financial";

const GOOGLE_PROVIDER = new GoogleAuthProvider();
GOOGLE_PROVIDER.setCustomParameters({
  prompt: "select_account"
});

const APPLE_PROVIDER = new OAuthProvider("apple.com");
APPLE_PROVIDER.addScope("email");
APPLE_PROVIDER.addScope("name");

export const authService = {
  getCurrentUser() {
    return auth.currentUser;
  },

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  async handleAuthRedirect(): Promise<{ uid: string; email: string | null } | null> {
    if (!auth || !db) return null;
    try {
      const res = await getRedirectResult(auth);
      if (res && res.user) {
        await authService.ensureUserDocument(res.user, "google.com");
        return { uid: res.user.uid, email: res.user.email };
      }
    } catch (err) {
      console.error("Auth redirect error:", err);
    }
    return null;
  },

  async signInWithGoogle(): Promise<{ uid: string; email: string | null } | null> {
    if (!auth || !db) throw new Error("Firebase Auth non initialisé");
    try {
      let res: any = null;
      try {
        res = await signInWithPopup(auth, GOOGLE_PROVIDER);
      } catch (popupErr: any) {
        if (
          popupErr.code === "auth/popup-blocked" ||
          popupErr.code === "auth/popup-closed-by-user" ||
          popupErr.code === "auth/operation-not-supported-in-this-environment" ||
          popupErr.code === "auth/cancelled-popup-request" ||
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        ) {
          await signInWithRedirect(auth, GOOGLE_PROVIDER);
          return null;
        }
        throw popupErr;
      }

      if (res && res.user) {
        await authService.ensureUserDocument(res.user, "google.com");
        return { uid: res.user.uid, email: res.user.email };
      }
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      throw err;
    }
    return null;
  },

  async signInWithApple(): Promise<{ uid: string; email: string | null } | null> {
    if (!auth || !db) throw new Error("Firebase Auth non initialisé");
    try {
      let res: any = null;
      try {
        res = await signInWithPopup(auth, APPLE_PROVIDER);
      } catch (popupErr: any) {
        if (
          popupErr.code === "auth/popup-blocked" ||
          popupErr.code === "auth/popup-closed-by-user" ||
          popupErr.code === "auth/operation-not-supported-in-this-environment" ||
          popupErr.code === "auth/cancelled-popup-request" ||
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        ) {
          await signInWithRedirect(auth, APPLE_PROVIDER);
          return null;
        }
        throw popupErr;
      }

      if (res && res.user) {
        await authService.ensureUserDocument(res.user, "apple.com");
        return { uid: res.user.uid, email: res.user.email };
      }
    } catch (err: any) {
      console.error("Apple Sign-In Error:", err);
      throw err;
    }
    return null;
  },

  async signInWithFacebook(): Promise<any> {
    throw new Error("FACEBOOK_COMING_SOON");
  },

  async signOut(): Promise<void> {
    if (auth) {
      await firebaseSignOut(auth);
    }
  },

  async ensureUserDocument(firebaseUser: FirebaseUser, providerId: string): Promise<UserProfile> {
    const userRef = doc(db, "users", firebaseUser.uid);
    const docSnap = await getDoc(userRef);

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

    if (!docSnap.exists()) {
      const uProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        firstName: names[0] || "",
        lastName: names.slice(1).join(" ") || "",
        displayName: firebaseUser.displayName || names.join(" "),
        photoURL: firebaseUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        avatarUrl: firebaseUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        role: isFounder ? "admin" : "client",
        isFounder: isFounder,
        isVip: isFounder,
        isPro: isFounder,
        permissions: isFounder ? founderPermissions : [],
        provider: providerId,
        isProfileComplete: false,
        isVerified: false,
        balance: 0,
        totalRevenue: 0,
        wallet: {
          soldeDisponible: 0,
          soldeBloque: 0,
          soldeGawa: 0,
          revenusMois: 0,
          economiesPremium: 0,
          niveauWallet: "Standard",
          devise: "FCFA"
        },
        createdAt: serverTimestamp() as any
      };

      await setDoc(userRef, uProfile);
      return uProfile;
    } else {
      const uProfile = docSnap.data() as UserProfile;
      const canonicalBal = getCanonicalWalletBalance(uProfile);

      if (canonicalBal !== null) {
        if (!uProfile.wallet) {
          uProfile.wallet = {
            soldeDisponible: canonicalBal,
            soldeBloque: 0,
            soldeGawa: 0,
            revenusMois: 0,
            economiesPremium: 0,
            niveauWallet: "Standard",
            devise: "FCFA"
          };
        } else if (canonicalBal > (uProfile.wallet.soldeDisponible || 0)) {
          uProfile.wallet.soldeDisponible = canonicalBal;
        }
        uProfile.balance = canonicalBal;
        uProfile.walletBalance = canonicalBal;
      }

      if (!uProfile.photoURL && firebaseUser.photoURL) uProfile.photoURL = firebaseUser.photoURL;
      if (!uProfile.avatarUrl && firebaseUser.photoURL) uProfile.avatarUrl = firebaseUser.photoURL;
      if (!uProfile.displayName && firebaseUser.displayName) uProfile.displayName = firebaseUser.displayName;
      if (!uProfile.email && firebaseUser.email) uProfile.email = firebaseUser.email;

      if (isFounder && (!uProfile.isFounder || uProfile.role !== "admin")) {
        uProfile.role = "admin";
        uProfile.isFounder = true;
        uProfile.isVip = true;
        uProfile.isPro = true;
        uProfile.permissions = founderPermissions;
        await updateDoc(userRef, {
          role: "admin",
          isFounder: true,
          isVip: true,
          isPro: true,
          permissions: founderPermissions
        });
      }

      return uProfile;
    }
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, "users", uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  },

  listenUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
    const docRef = doc(db, "users", uid);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as UserProfile);
      } else {
        callback(null);
      }
    });
  }
};

export const {
  signInWithGoogle,
  signInWithApple,
  signInWithFacebook,
  signOut,
  getCurrentUser
} = authService;
