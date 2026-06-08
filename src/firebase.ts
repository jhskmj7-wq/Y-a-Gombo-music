import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  signInWithPopup, 
  signInWithRedirect,
  signInWithCredential,
  GoogleAuthProvider, 
  FacebookAuthProvider,
  GithubAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  deleteDoc,
  updateDoc,
  serverTimestamp,
  getDocFromServer,
  onSnapshot
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { isCapacitor, performNativeGoogleLogin, performNativeFacebookLogin } from "./lib/capacitor-adapter";
import { UserProfile, Gombo, Application, Reservation, WaitingFeature, SocialPost, GomboNotification, ApplicationStatus, Renfort, RenfortApplication, GomboSubscription, GomboPayment, GomboBoost, GomboCertification, CertificationRequest, MusicGroup, GroupMember, GroupGalleryMedia, ActivityFeedEntry, Conversation, Message, VerificationRequest, AdminLog } from "./types";

// Setup and determine if using Real Firebase or Fallback Local Mock DB.
// Gombo Musik can fall back automatically if the credentials are the mock values or empty.
export let isFirebaseMock = false;
export let isFirebaseForceReal = true;
export let pendingSignUpProfile: UserProfile | null = null;

export function getPendingSignUpProfile(): UserProfile | null {
  return pendingSignUpProfile;
}

export function setPendingSignUpProfile(profile: UserProfile | null) {
  pendingSignUpProfile = profile;
}

export function setIsFirebaseMock(val: boolean) {
  isFirebaseMock = false;
  isFirebaseForceReal = true;
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("isFirebaseMock");
  }
}

import { app, auth, db, storage } from "./lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const GOOGLE_PROVIDER = new GoogleAuthProvider();
const FACEBOOK_PROVIDER = new FacebookAuthProvider();
const GITHUB_PROVIDER = new GithubAuthProvider();

export const isCapacitorEnv = (): boolean => {
  return typeof window !== "undefined" && !!(window as any).Capacitor;
};

export const isWebView = (): boolean => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  
  // Explicitly check Capacitor native environment
  if (isCapacitorEnv()) return true;
  
  // Standard webviews and embedded user-agents
  const isAndroidWebView = /Android/i.test(ua) && /wv/i.test(ua);
  const isCustomWebView = /AppsGeyser/i.test(ua) || (window as any).AppsGeyser || (window as any).AndroidClient || (window as any).Android;
  const isGenericWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua) || (/Android/i.test(ua) && /Version\/\d+\.\d+/i.test(ua));
  const isDisallowedUseragent = /FBAN|FBAV|Instagram|Twitter|Slack|WhatsApp|disallowed_useragent/i.test(ua);

  return isAndroidWebView || isCustomWebView || isGenericWebView || isDisallowedUseragent;
};

// Shared active listeners map to prevent duplicate readers
const activeTransferListeners = new Set<string>();

export function initiateAuthTransferListener(transferId: string) {
  if (!transferId || activeTransferListeners.has(transferId)) return;
  
  if (isFirebaseMock || !auth || !db) {
    console.warn("⚠️ [WebView Auth Listen] Real Firebase not initialized or in Mock Mode. Skipping cloud auth listener.");
    return;
  }

  console.log("🕵️ [WebView Auth Listen] Activating snapshot on temp_auth_transfers for ID:", transferId);
  activeTransferListeners.add(transferId);
  localStorage.setItem("active_google_transfer_id", transferId);

  const docRef = doc(db, "temp_auth_transfers", transferId);
  const unsubscribe = onSnapshot(docRef, async (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.status === "success" && data.idToken) {
        console.log("🎉 [WebView Auth Listen] Session successfully detected! Logging in user standard credentials...");
        
        // Remove tracking references
        activeTransferListeners.delete(transferId);
        localStorage.removeItem("active_google_transfer_id");
        unsubscribe();

        try {
          const credential = GoogleAuthProvider.credential(data.idToken, data.accessToken || null);
          await signInWithCredential(auth, credential);
          
          console.log("✅ [WebView Auth Listen] User successfully signed in via Credential!");

          // Clean up temp transfer document for user privacy
          try {
            await deleteDoc(docRef);
          } catch (e) {
            console.warn("Non-fatal doc cleanup error during recovery:", e);
          }
          
          // Dispatch a global event so the UI can refresh if needed
          window.dispatchEvent(new CustomEvent("webViewAuthSuccess", { 
            detail: { uid: auth.currentUser?.uid, email: auth.currentUser?.email } 
          }));
        } catch (err) {
          console.error("❌ [WebView Auth Listen] Failed to log in with secure token:", err);
        }
      }
    }
  }, (err) => {
    console.warn("⚠️ [WebView Auth Listen] Snapshot transfer error:", err);
    activeTransferListeners.delete(transferId);
  });
}

export function detectAndProcessTransferId(sourceUrl?: string) {
  try {
    const urlString = sourceUrl || (typeof window !== "undefined" ? window.location.href : "");
    if (!urlString) return false;

    // Try parsing search queries
    const urlObj = new URL(urlString, window.location.origin);
    let transferId = urlObj.searchParams.get("transferId");
    
    // If not found, try manual search check
    if (!transferId && urlString.includes("transferId=")) {
      const parts = urlString.split("transferId=");
      if (parts[1]) {
        const value = parts[1].split("&")[0].split("#")[0];
        if (value) transferId = value;
      }
    }

    if (transferId) {
      console.log("🎯 [WebView Auth Catcher] Successfully extracted transferId from URL:", transferId);
      initiateAuthTransferListener(transferId);
      return true;
    }
  } catch (e) {
    console.warn("⚠️ [WebView Auth Catcher] Error parsing URL:", e);
  }
  return false;
}

// Check for active transfer ID recovery on boot
if (typeof window !== "undefined") {
  // 1. Process current URL on boot
  detectAndProcessTransferId();

  // 2. Fallback to active transfer ID in localStorage
  const backupId = localStorage.getItem("active_google_transfer_id");
  if (backupId) {
    initiateAuthTransferListener(backupId);
  }

  // 3. Register native window handleOpenURL Cordova interceptor
  (window as any).handleOpenURL = function (url: string) {
    console.log("🔗 [Native Deep Link] Cordova handleOpenURL fired with URL:", url);
    detectAndProcessTransferId(url);
  };

  // 4. Register window custom scheme events
  window.addEventListener("handleOpenURL", (e: any) => {
    const url = e?.detail || e?.url;
    if (url) {
      console.log("🔗 [Native Deep Link] handleOpenURL Event caught URL:", url);
      detectAndProcessTransferId(url);
    }
  });

  // 5. General window hash changes or navigation pops
  const handleNavPop = () => {
    detectAndProcessTransferId();
  };
  window.addEventListener("hashchange", handleNavPop);
  window.addEventListener("popstate", handleNavPop);
}

// Ensure the required connection test run from the skill
if (!isFirebaseMock && db) {
  const testConnection = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("La connexion Firebase a expiré (timeout de 3s).")), 3000)
      );
      
      await Promise.race([
        getDocFromServer(doc(db, "test", "connection")),
        timeoutPromise
      ]);
      console.log("⚡ Connexion Firebase validée avec succès !");
      isFirebaseForceReal = true;
      setIsFirebaseMock(false);
    } catch (error: any) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const errCode = error && typeof error === "object" && "code" in error ? error.code : "";
      
      const isPermissionDenied = 
        errCode === "permission-denied" || 
        errMsg.includes("permission-denied") || 
        errMsg.includes("insufficient permissions") || 
        errMsg.includes("Missing or insufficient permissions");

      if (isPermissionDenied) {
        console.log("⚡ Connexion Firebase validée (Bloquée par les règles de sécurité, Firebase en ligne et actif).");
        isFirebaseForceReal = true;
        setIsFirebaseMock(false);
      } else {
        console.warn("⚠️ Impossible de joindre Firestore. Passage automatique au mode Bac à Sable local / Hors-ligne.", error);
        if (firebaseConfig && firebaseConfig.projectId === "ya-gombo-music") {
          setIsFirebaseMock(false);
        } else {
          setIsFirebaseMock(true);
        }
        if (errMsg.includes("the client is offline")) {
          console.error("Please check your Firebase configuration. Client is offline.");
        }
      }
    }
  };
  testConnection();
}

// Error codes for Firestore errors tracking
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((p: any) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Permission or Schema Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ==========================================
// --- MOCK LOCAL REPLAY ENGINE (LOCALSTORAGE) ---
// ==========================================

const LOCAL_USERS_KEY = "gombo_users";
const LOCAL_GOMBOS_KEY = "gombo_posts";
const LOCAL_APPLICATIONS_KEY = "gombo_applications";
const LOCAL_RESERVATIONS_KEY = "gombo_reservations";
const LOCAL_WAITING_KEY = "gombo_waiting";
const LOCAL_AUTH_KEY = "gombo_logged_in_user";
const LOCAL_NOTIFICATIONS_KEY = "gombo_notifications";
const LOCAL_RENFORS_KEY = "gombo_renforts";
const LOCAL_RENFORT_APPLICATIONS_KEY = "gombo_renfort_applications";
const LOCAL_ACTIVITY_FEED_KEY = "gombo_activity_feed";

// Initialize mock local data if empty
const initMockDB = () => {
  if (!localStorage.getItem(LOCAL_USERS_KEY)) {
    // Inject some standard initial records to make Gombo Musik lively at first look!
    const mockUsers: UserProfile[] = [
      {
        uid: "mus1",
        email: "yoro@gombo.ci",
        firstName: "Yorobo",
        lastName: "Sangaré",
        commune: "Cocody",
        phone: "+225 07 45 89 12 00",
        bio: "Guitariste soliste lead. 6 ans de scène avec de grands artistes ivoiriens. Disponible pour concerts, cabarets, mariages rumba et coupé-décalé.",
        role: "musicien",
        specialty: "Guitariste",
        experience: "Professionnel",
        paymentNumber: "0745891200",
        paymentProvider: "Wave",
        avatarUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200",
        createdAt: new Date().toISOString()
      },
      {
        uid: "mus2",
        email: "fanta@gombo.ci",
        firstName: "Fanta",
        lastName: "Kouyaté",
        commune: "Yopougon",
        phone: "+225 05 12 34 56 78",
        bio: "Chanteuse lead gospel et acoustique. Voix puissante d'Afrique de l'Ouest. Idéal pour cocktail de mariage chic ou diner de gala.",
        role: "musicien",
        specialty: "Chanteur",
        experience: "Professionnel",
        paymentNumber: "0512345678",
        paymentProvider: "Orange Money",
        avatarUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200",
        createdAt: new Date().toISOString()
      },
      {
        uid: "cli1",
        email: "serge@gombo.ci",
        firstName: "Serge",
        lastName: "Kassi",
        commune: "Marcory",
        phone: "+225 07 99 88 77 66",
        bio: "Promoteur événementiel et gérant du Lounge 'Le Paris-Dakar' à Marcory Biétry.",
        role: "client",
        createdAt: new Date().toISOString()
      },
      {
        uid: "adm1",
        email: "admin@gombo.ci",
        firstName: "Didi",
        lastName: "B",
        commune: "Plateau",
        phone: "+225 01 02 03 04 05",
        bio: "Admin principal de Gombo Musik Showbiz.",
        role: "admin",
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(mockUsers));
  }

  if (!localStorage.getItem(LOCAL_GOMBOS_KEY)) {
    const mockGombos: Gombo[] = [
      {
        id: "gom1",
        clientId: "cli1",
        clientName: "Serge Kassi",
        title: "Recherche Guitariste Cabaret Chic",
        description: "Nous recherchons un guitariste talentueux pour accompagner une chanteuse de jazz/rumba au lounge Le Paris-Dakar à Biétry. Prestation de 3h, repas offert. Ambiance feutrée de qualité.",
        location: "Lounge Le Paris-Dakar, Biétry Zone 4",
        commune: "Marcory",
        date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0], // 3 days from now
        time: "19:30",
        budget: 45000,
        eventType: "Bar/Resto",
        musiciansCount: 1,
        status: "publie",
        urgent: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "gom2",
        clientId: "cli1",
        clientName: "Serge Kassi",
        title: "Claviériste & Batteur pour Mariage Chrétien",
        description: "Prestation complète pour la cérémonie religieuse et la réception d'un grand mariage à l'espace Eden Cocody. Batterie acoustique fournie sur place. Playlist gospel ivoirien.",
        location: "Espace Eden, Plateau Dokui",
        commune: "Cocody",
        date: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0], // 7 days from now
        time: "13:00",
        budget: 120000,
        eventType: "Mariage",
        musiciansCount: 2,
        status: "publie",
        urgent: false,
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(LOCAL_GOMBOS_KEY, JSON.stringify(mockGombos));
  }

  if (!localStorage.getItem(LOCAL_APPLICATIONS_KEY)) {
    const mockApps: Application[] = [
      {
        id: "app1",
        gomboId: "gom1",
        gomboTitle: "Recherche Guitariste Cabaret Chic",
        musicianId: "mus1",
        musicianName: "Yorobo Sangaré",
        musicianSpecialty: "Guitariste",
        musicianPhone: "+225 07 45 89 12 00",
        musicianAvatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200",
        message: "Salut grand frère Serge! Je suis ultra motivé et disponible pour ce concert. Je joue de la rumba, du jazz d'Afrique centrale et du coupé-décalé propre. Voici mon link.",
        status: "en_attente",
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(LOCAL_APPLICATIONS_KEY, JSON.stringify(mockApps));
  }

  if (!localStorage.getItem(LOCAL_RESERVATIONS_KEY)) {
    localStorage.setItem(LOCAL_RESERVATIONS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(LOCAL_WAITING_KEY)) {
    localStorage.setItem(LOCAL_WAITING_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(LOCAL_NOTIFICATIONS_KEY)) {
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(LOCAL_RENFORS_KEY)) {
    const mockRenforts: Renfort[] = [
      {
        id: "ren_mock1",
        userId: "cli1",
        userName: "Serge Kassi",
        userAvatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200",
        title: "Pianiste / Claviériste pour culte spécial Église",
        description: "Recherche un pianiste expérimenté pour accompagner la chorale durant le culte spécial ce dimanche matin. Doit maîtriser le répertoire Gospel de Côte d’Ivoire.",
        instrument: "Piano",
        instruments: ["Piano", "Clavier"],
        date: new Date(Date.now() + 86400005 * 2).toISOString().split("T")[0],
        time: "08:30",
        musiciansCount: 1,
        budget: 25000,
        commune: "Cocody",
        whatsapp: "0700112233",
        requestType: "Église",
        genres: ["Gospel"],
        status: "publie",
        createdAt: new Date().toISOString()
      },
      {
        id: "ren_mock2",
        userId: "mus1",
        userName: "Yorobo Sangaré",
        userAvatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200",
        title: "Remplacement Batteur Urgent Zouglou Live",
        description: "Notre batteur s’est blessé, il nous faut un remplaçant ce soir pour notre prestation live au maquis VIP à Yopougon. Ambiance Zouglou assurée !",
        instrument: "Batterie",
        instruments: ["Batterie"],
        date: new Date().toISOString().split("T")[0],
        time: "21:00",
        musiciansCount: 1,
        budget: 35000,
        commune: "Yopougon",
        whatsapp: "0511223344",
        requestType: "Remplacement urgent",
        genres: ["Zouglou", "Wôyô"],
        status: "publie",
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(LOCAL_RENFORS_KEY, JSON.stringify(mockRenforts));
  }
  if (!localStorage.getItem(LOCAL_RENFORT_APPLICATIONS_KEY)) {
    localStorage.setItem(LOCAL_RENFORT_APPLICATIONS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(LOCAL_ACTIVITY_FEED_KEY)) {
    const mockActivities: ActivityFeedEntry[] = [
      {
        id: "act1",
        type: "gombo",
        title: "Nouveau Gombo publié !",
        message: "Recherche Claviériste & Batteur pour Mariage Chrétien à Espace Eden, Cocody",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        userId: "cli1",
        userName: "Serge Kassi",
        userAvatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200",
        targetId: "gom2"
      },
      {
        id: "act2",
        type: "talent",
        title: "Nouveau Talent à Cocody",
        message: "Yorobo Sangaré s'est inscrit en tant que Guitariste professionnel.",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        userId: "mus1",
        userName: "Yorobo Sangaré",
        userAvatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200",
        targetId: "mus1"
      },
      {
        id: "act3",
        type: "certification",
        title: "Audition Réussie !",
        message: "Fanta Kouyaté a obtenu son badge de Talent Certifié ⭐",
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        userId: "mus2",
        userName: "Fanta Kouyaté",
        userAvatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200",
        targetId: "mus2"
      }
    ];
    localStorage.setItem(LOCAL_ACTIVITY_FEED_KEY, JSON.stringify(mockActivities));
  }

  if (!localStorage.getItem("gombo_admins")) {
    const mockAdmins = [
      { email: "johnsylvesterh@gmail.com", role: "super_admin", permissions: ["all"], createdAt: new Date().toISOString() },
      { email: "jhs.kmj7@gmail.com", role: "super_admin", permissions: ["all"], createdAt: new Date().toISOString() },
      { email: "sylvestrehounkpevi777@gmail.com", role: "super_admin", permissions: ["all"], createdAt: new Date().toISOString() }
    ];
    localStorage.setItem("gombo_admins", JSON.stringify(mockAdmins));
  }
  if (!localStorage.getItem("gombo_admin_logs")) {
    localStorage.setItem("gombo_admin_logs", JSON.stringify([
      { id: "log_init", adminEmail: "system", action: "INITIALIZE_CENTRE_COMMANDE", targetId: "system", createdAt: new Date().toISOString() }
    ]));
  }
  if (!localStorage.getItem("gombo_reports")) {
    localStorage.setItem("gombo_reports", JSON.stringify([
      {
        id: "rep_mock1",
        reportedBy: "mus1",
        reporterEmail: "yoro@gombo.ci",
        contentId: "gom2",
        contentType: "gombo",
        contentTitle: "Claviériste & Batteur pour Mariage Chrétien",
        authorId: "cli1",
        reason: "Le budget de 120000 est incorrect selon nos accords.",
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        status: "pending"
      }
    ]));
  }
};

initMockDB();

// Dynamic hooks or state triggers for components using standard localStorage callback routing
const triggerStorageEvent = () => {
  window.dispatchEvent(new Event("storage"));
};

// ==========================================
// --- Unified GomboAuth Engine ---
// ==========================================
export const gomboAuth = {
  get currentUser(): { uid: string; email: string; emailVerified: boolean } | null {
    if (!isFirebaseMock && auth?.currentUser) {
      return {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || "",
        emailVerified: auth.currentUser.emailVerified
      };
    }
    const saved = localStorage.getItem(LOCAL_AUTH_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  onAuthStateChanged(callback: (user: any | null) => void) {
    if (!isFirebaseMock && auth) {
      return onAuthStateChanged(auth, callback);
    }
    
    // For mock, trigger on load and listen to custom triggers
    const triggerCallback = () => {
      const saved = localStorage.getItem(LOCAL_AUTH_KEY);
      callback(saved ? JSON.parse(saved) : null);
    };

    window.addEventListener("gomboAuthChange", triggerCallback);
    triggerCallback();

    return () => {
      window.removeEventListener("gomboAuthChange", triggerCallback);
    };
  },

  async signUp(email: string, password: string, role: "musicien" | "client", details: { firstName: string; lastName: string; phone: string; commune: string }) {
    if (!isFirebaseMock && auth && db) {
      // Prevents multiple accounts with the same phone
      if (details.phone && details.phone.trim() !== "") {
        try {
          const phoneQuery = query(collection(db, "users"), where("phone", "==", details.phone.trim()));
          const querySnapshot = await getDocs(phoneQuery);
          if (!querySnapshot.empty) {
            const err = new Error("Ce numéro est déjà utilisé.");
            (err as any).code = "auth/phone-already-in-use";
            throw err;
          }
        } catch (phErr: any) {
          if (phErr.code === "auth/phone-already-in-use") {
            throw phErr;
          }
          console.warn("⚠️ Phone check yielded error or rules denied read:", phErr);
        }
      }

      // Pre-assemble the full template profile with original registration details
      const userProfile: UserProfile = {
        uid: "", // Will be populated with res.user.uid post-creation
        email,
        firstName: details.firstName,
        lastName: details.lastName,
        phone: details.phone,
        commune: details.commune,
        role: role,
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        isProfileComplete: false,
        balance: 25000,
        totalRevenue: 25000,
        totalWithdrawals: 0,
        gigsCompleted: 0,
        applicationsSent: 0,
        acceptanceRate: 100,
        createdAt: new Date().toISOString()
      };

      // Expose to real-time Auth context listener before initiating the Firebase Auth step
      pendingSignUpProfile = userProfile;

      const res = await createUserWithEmailAndPassword(auth, email, password);
      userProfile.uid = res.user.uid;

      // Save record in Firestore
      try {
        await setDoc(doc(db, "users", res.user.uid), userProfile);
        console.log("🔥 Successfully stored custom user profile to Firestore:", userProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "users/" + res.user.uid);
      }

      // Clear pending state
      pendingSignUpProfile = null;
      return { uid: res.user.uid, email };
    } else {
      // Local Mock DB
      const users: UserProfile[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        const err = new Error("Ce mail possède déjà un compte.");
        (err as any).code = "auth/email-already-in-use";
        throw err;
      }
      if (details.phone && users.some(u => u.phone === details.phone.trim())) {
        const err = new Error("Ce numéro est déjà utilisé.");
        (err as any).code = "auth/phone-already-in-use";
        throw err;
      }
      const newUid = "uid_" + Math.random().toString(36).substring(2, 9);
      const userProfile: UserProfile = {
        uid: newUid,
        email,
        firstName: details.firstName,
        lastName: details.lastName,
        phone: details.phone,
        commune: details.commune,
        role: role,
        createdAt: new Date().toISOString()
      };
      users.push(userProfile);
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));

      const authData = { uid: newUid, email, emailVerified: true };
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(authData));
      window.dispatchEvent(new Event("gomboAuthChange"));
      return authData;
    }
  },

  async signIn(email: string, password: string) {
    if (!isFirebaseMock && auth) {
      const res = await signInWithEmailAndPassword(auth, email, password);
      return { uid: res.user.uid, email: res.user.email };
    } else {
      const users: UserProfile[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
      const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!matched) {
        throw new Error("Utilisateur introuvable. Veuillez vous inscrire !");
      }
      // Acceptance is free-pass on passwords for simple mock demo
      const authData = { uid: matched.uid, email: matched.email, emailVerified: true };
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(authData));
      window.dispatchEvent(new Event("gomboAuthChange"));
      return authData;
    }
  },

  async loginWithGoogle() {
    console.log("🚀 [Firebase Auth Debug] Initializing Google Login popup...");
    
    // Direct Native Capacitor SSO Integration
    if (isCapacitor()) {
      console.log("📱 [Firebase Auth] Running Native Google Login inside Capacitor wrapper...");
      try {
        const nativeUser = await performNativeGoogleLogin();
        return nativeUser;
      } catch (err) {
        console.warn("⚠️ Native Google Auth Plugin failed or is unconfigured. Checking fallback...", err);
      }
    }
    
    if (isWebView()) {
      console.log("📱 [Firebase Auth] WebView detected. Setting up secure Chrome redirect channel...");
      const transferId = "goog_trans_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem("active_google_transfer_id", transferId);
      
      // Create a pending document in Firestore so we can listen to it and write safely
      if (!isFirebaseMock && db) {
        try {
          await setDoc(doc(db, "temp_auth_transfers", transferId), {
            idToken: "",
            status: "pending",
            createdAt: new Date().toISOString()
          });
        } catch (err) {
          console.error("Non-fatal error writing pending auth transfer:", err);
        }
      }
      
      const currentUrl = window.location.origin;
      const redirectUrl = `${currentUrl}/?auth_transfer=google&transferId=${transferId}`;
      const webUrlWithoutHttps = redirectUrl.replace(/^https?:\/\//, "");
      const chromeIntentUrl = `intent://${webUrlWithoutHttps}#Intent;scheme=https;package=com.android.chrome;end`;
      
      // Open the external Chrome browser using an Android Intent
      window.location.href = chromeIntentUrl;
      
      // Fallback redirect if Intent fails to trigger/close window
      setTimeout(() => {
        window.open(redirectUrl, "_blank");
      }, 800);
      
      return {
        webViewRedirectPending: true,
        transferId
      } as any;
    }

    if (!isFirebaseMock && auth) {
      try {
        const res = await signInWithPopup(auth, GOOGLE_PROVIDER);
        console.log("✅ [Firebase Auth Debug] Google Login Success. UID:", res.user.uid, "Email:", res.user.email);
        
        // Ensure user profile details are populated in Firestore users/{uid} if missing
        try {
          const uDoc = await getDoc(doc(db, "users", res.user.uid));
          if (!uDoc.exists()) {
            console.log("💾 [Firebase Auth Debug] Creating automated user profile in Firestore for Google Sign-In...");
            const names = res.user.displayName ? res.user.displayName.split(" ") : ["Artiste", "Showbiz"];
            const userProfile: UserProfile = {
              uid: res.user.uid,
              email: res.user.email || "",
              firstName: names[0],
              lastName: names.slice(1).join(" ") || "Ivoirien",
              displayName: res.user.displayName || "",
              photoURL: res.user.photoURL || "",
              avatarUrl: res.user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
              phone: res.user.phoneNumber || "",
              commune: "Cocody",
              role: "musicien", // default
              provider: "google.com",
              isProfileComplete: false,
              balance: 25000,
              totalRevenue: 25000,
              totalWithdrawals: 0,
              gigsCompleted: 0,
              applicationsSent: 0,
              acceptanceRate: 100,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, "users", res.user.uid), userProfile);
            console.log("✅ [Firebase Auth Debug] Firestore user profile stored successfully.");
          } else {
            console.log("📦 [Firebase Auth Debug] User profile already exists in Firestore. Skipping auto-onboarding.");
          }
        } catch (err) {
          console.warn("⚠️ [Firebase Auth Debug] Non-fatal user profile sync error during Google auth:", err);
        }
        return { uid: res.user.uid, email: res.user.email };
      } catch (e: any) {
        console.error("❌ [Firebase Auth Debug] Google Popup failed:", e);
        throw e;
      }
    } else {
      // Mock Google Login - Generate a fresh unique login to trigger complete onboarding flow
      const randomEmail = `artiste_${Math.random().toString(36).substring(2, 7)}@gmail.com`;
      const randomId = "goog_" + Math.random().toString(36).substring(2, 9);
      
      const users: UserProfile[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
      let matched = {
        uid: randomId,
        email: randomEmail,
        firstName: "Artiste",
        lastName: "Google-Abidjan",
        displayName: "Artiste Google-Abidjan",
        provider: "google.com",
        commune: "Cocody",
        phone: "",
        role: "musicien" as const,
        isProfileComplete: false,
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        balance: 25000,
        totalRevenue: 25000,
        totalWithdrawals: 0,
        gigsCompleted: 0,
        applicationsSent: 0,
        acceptanceRate: 100,
        createdAt: new Date().toISOString()
      };
      users.push(matched);
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));

      const authData = { uid: matched.uid, email: matched.email, emailVerified: true };
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(authData));
      window.dispatchEvent(new Event("gomboAuthChange"));
      return authData;
    }
  },

  async loginWithFacebook() {
    console.log("🚀 [Firebase Auth Debug] Initializing Facebook Login popup...");
    
    // Direct Native Capacitor SSO Integration
    if (isCapacitor()) {
      console.log("📱 [Firebase Auth] Running Native Facebook Login inside Capacitor wrapper...");
      try {
        const nativeUser = await performNativeFacebookLogin();
        return nativeUser;
      } catch (err) {
        console.warn("⚠️ Native Facebook Auth Plugin failed or is unconfigured. Checking fallback...", err);
      }
    }

    if (!isFirebaseMock && auth) {
      try {
        const res = await signInWithPopup(auth, FACEBOOK_PROVIDER);
        console.log("✅ [Firebase Auth Debug] Facebook Login Success. UID:", res.user.uid, "Email:", res.user.email);
        
        // Ensure user profile details are populated in Firestore users/{uid} if missing
        try {
          const uDoc = await getDoc(doc(db, "users", res.user.uid));
          if (!uDoc.exists()) {
            console.log("💾 [Firebase Auth Debug] Creating automated user profile in Firestore for Facebook Sign-In...");
            const names = res.user.displayName ? res.user.displayName.split(" ") : ["Artiste", "Facebook"];
            const userProfile: UserProfile = {
              uid: res.user.uid,
              email: res.user.email || "",
              firstName: names[0],
              lastName: names.slice(1).join(" ") || "Ivoirien",
              displayName: res.user.displayName || "",
              photoURL: res.user.photoURL || "",
              avatarUrl: res.user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
              phone: res.user.phoneNumber || "",
              commune: "Cocody",
              role: "musicien", // default
              provider: "facebook.com",
              isProfileComplete: false,
              balance: 25000,
              totalRevenue: 25000,
              totalWithdrawals: 0,
              gigsCompleted: 0,
              applicationsSent: 0,
              acceptanceRate: 100,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, "users", res.user.uid), userProfile);
            console.log("✅ [Firebase Auth Debug] Firestore user profile stored successfully.");
          } else {
            console.log("📦 [Firebase Auth Debug] User profile already exists in Firestore. Skipping auto-onboarding.");
          }
        } catch (err) {
          console.error("❌ [Firebase Auth Debug] Error syncing user profile on Facebook auth:", err);
          handleFirestoreError(err, OperationType.WRITE, "users/" + res.user.uid);
        }
        return { uid: res.user.uid, email: res.user.email };
      } catch (e: any) {
        console.error("❌ [Firebase Auth Debug] Facebook popup failed:", e);
        throw e;
      }
    } else {
      // Mock Facebook Login
      const mockFbEmails = ["fb_artiste@gombo.ci", "fb_client@gombo.ci"];
      const randomEmail = mockFbEmails[Math.floor(Math.random() * mockFbEmails.length)];
      const randomId = "fb_" + Math.random().toString(36).substring(2, 9);
      
      const users: UserProfile[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
      let matched = users.find(u => u.email === randomEmail);
      if (!matched) {
        matched = {
          uid: randomId,
          email: randomEmail,
          firstName: "Artiste",
          lastName: "Facebook-Abidjan",
          displayName: "Artiste Facebook-Abidjan",
          provider: "facebook.com",
          commune: "Cocody",
          phone: "+225 05 00 99 88 77",
          role: "musicien",
          isProfileComplete: true,
          createdAt: new Date().toISOString()
        };
        users.push(matched);
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      }

      const authData = { uid: matched.uid, email: matched.email, emailVerified: true };
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(authData));
      window.dispatchEvent(new Event("gomboAuthChange"));
      return authData;
    }
  },

  async loginWithGitHub() {
    console.log("🚀 [Firebase Auth Debug] Initializing GitHub Login popup...");
    if (!isFirebaseMock && auth) {
      try {
        const res = await signInWithPopup(auth, GITHUB_PROVIDER);
        console.log("✅ [Firebase Auth Debug] GitHub Login Success. UID:", res.user.uid);
        try {
          const uDoc = await getDoc(doc(db, "users", res.user.uid));
          if (!uDoc.exists()) {
            const names = res.user.displayName ? res.user.displayName.split(" ") : ["Artiste", "GitHub"];
            const userProfile: UserProfile = {
              uid: res.user.uid,
              email: res.user.email || "",
              firstName: names[0],
              lastName: names.slice(1).join(" ") || "Ivoirien",
              displayName: res.user.displayName || "",
              photoURL: res.user.photoURL || "",
              role: "musicien", // default
              provider: "github.com",
              commune: "Cocody",
              phone: "",
              isProfileComplete: false,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, "users", res.user.uid), userProfile);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, "users/" + res.user.uid);
        }
        return { uid: res.user.uid, email: res.user.email };
      } catch (e: any) {
        console.error("❌ [Firebase Auth Debug] GitHub popup failed:", e);
        throw e;
      }
    } else {
      // Mock GitHub Login
      const mockGitEmails = ["git_dj@gombo.ci", "git_client@gombo.ci"];
      const randomEmail = mockGitEmails[Math.floor(Math.random() * mockGitEmails.length)];
      const randomId = "git_" + Math.random().toString(36).substring(2, 9);
      
      const users: UserProfile[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
      let matched = users.find(u => u.email === randomEmail);
      if (!matched) {
        matched = {
          uid: randomId,
          email: randomEmail,
          firstName: "Artiste",
          lastName: "GitHub-Abidjan",
          displayName: "Artiste GitHub-Abidjan",
          provider: "github.com",
          commune: "Cocody",
          phone: "+225 01 00 44 55 66",
          role: "musicien",
          isProfileComplete: true,
          createdAt: new Date().toISOString()
        };
        users.push(matched);
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      }

      const authData = { uid: matched.uid, email: matched.email, emailVerified: true };
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(authData));
      window.dispatchEvent(new Event("gomboAuthChange"));
      return authData;
    }
  },

  async loginWithPhoneCode(phoneNumber: string, recaptchaVerifier: any) {
    console.log("🚀 [Firebase Auth Debug] signInWithPhoneNumber with Recaptcha for:", phoneNumber);
    if (!isFirebaseMock && auth) {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      console.log("📱 [Firebase Auth Debug] SMS Code verification sent ! Link: confirmationResult ready.");
      return confirmationResult;
    } else {
      console.log("📱 [MOCK Auth Debug] Mock Delivery sent to phone", phoneNumber);
      return {
        confirm: async (otp: string) => {
          console.log("📱 [MOCK Auth Debug] Testing confirmation with OTP code:", otp);
          if (otp !== "123456" && otp !== "000000") {
            throw new Error("Code de validation SMS OTP incorrect !");
          }
          // Mock login
          const mockPhoneUid = "phone_" + Math.random().toString(36).substring(2, 9);
          const users: UserProfile[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
          let matched = users.find(u => u.phone === phoneNumber);
          if (!matched) {
            matched = {
              uid: mockPhoneUid,
              email: `${mockPhoneUid}@gombo.ci`,
              firstName: "Showman",
              lastName: "Gombo",
              displayName: "Showman Gombo",
              phone: phoneNumber,
              provider: "phone",
              commune: "Cocody",
              role: "musicien",
              isProfileComplete: false,
              createdAt: new Date().toISOString()
            };
            users.push(matched);
            localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
          }

          const authData = { uid: matched.uid, email: matched.email, emailVerified: true };
          localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(authData));
          window.dispatchEvent(new Event("gomboAuthChange"));
          return {
            user: {
              uid: matched.uid,
              phoneNumber: phoneNumber,
              email: matched.email,
              displayName: matched.displayName
            }
          };
        }
      };
    }
  },

  async sendPasswordReset(email: string) {
    console.log("🚀 [Firebase Auth Debug] Sending password reset email to:", email);
    if (!isFirebaseMock && auth) {
      await sendPasswordResetEmail(auth, email);
    } else {
      console.log(`[MOCK RESET] Reset code emailed to ${email}`);
    }
  },

  async signOut() {
    console.log("🚀 [Firebase Auth Debug] Requesting Sign-Out...");
    if (!isFirebaseMock && auth) {
      await firebaseSignOut(auth);
      localStorage.removeItem("gombo_auth");
      localStorage.removeItem("gombo_active_profile");
    } else {
      localStorage.removeItem(LOCAL_AUTH_KEY);
      localStorage.removeItem("gombo_auth");
      localStorage.removeItem("gombo_active_profile");
      window.dispatchEvent(new Event("gomboAuthChange"));
    }
    console.log("✅ [Firebase Auth Debug] Local and Cloud Session cleared.");
  }
};

// ==========================================
// --- Unified GomboDB Storage Layer ---
// ==========================================
export const gomboDB = {
  // PENDING SIGN-UP TRACKER
  getPendingSignUpProfile(): UserProfile | null {
    return pendingSignUpProfile;
  },

  // USERS
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!isFirebaseMock && db) {
      try {
        const docSnap = await getDoc(doc(db, "users", uid));
        return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
      } catch (error: any) {
        console.warn("⚠️ Mode Firestore inaccessible or rule block for getUserProfile. Error details:", error);
        if (error && error.code === "permission-denied") {
          // Keep real Firebase, return null to let caller/AuthContext auto-onboard the profile
          return null;
        }
        if (error && (error.code === "unavailable" || error.message?.includes("offline"))) {
          setIsFirebaseMock(true);
        }
      }
    }
    const users: UserProfile[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
    return users.find(u => u.uid === uid) || null;
  },

  async updateUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "users", uid), profile, { merge: true });
        return;
      } catch (error: any) {
        console.warn("⚠️ Mode Firestore inaccessible or rule block for updateUserProfile. Error details:", error);
        if (error && error.code === "permission-denied") {
          return;
        }
        if (error && (error.code === "unavailable" || error.message?.includes("offline"))) {
          setIsFirebaseMock(true);
        }
      }
    }
    const users: UserProfile[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
    const index = users.findIndex(u => u.uid === uid);
    if (index !== -1) {
      users[index] = { ...users[index], ...profile } as UserProfile;
    } else {
      users.push({ uid, ...profile } as UserProfile);
    }
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    triggerStorageEvent();
    window.dispatchEvent(new Event("gomboUserProfileChange"));
  },

  listenUserProfile(uid: string, callback: (profile: UserProfile | null) => void): () => void {
    if (!isFirebaseMock && db) {
      try {
        const unsubscribe = onSnapshot(doc(db, "users", uid), (docSnap) => {
          if (docSnap.exists()) {
            callback(docSnap.data() as UserProfile);
          } else {
            callback(null);
          }
        }, (error) => {
          console.warn("⚠️ Error in listenUserProfile snapshot:", error);
          // Safety fallback: load local cached profile or signal callback(null) to prevent page from getting stuck
          try {
            const saved = localStorage.getItem("gombo_active_profile");
            if (saved) {
              callback(JSON.parse(saved));
            } else {
              callback(null);
            }
          } catch {
            callback(null);
          }
        });
        return unsubscribe;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour listenUserProfile. Repli local.", error);
      }
    }

    const triggerLocal = () => {
      const users: UserProfile[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
      const matched = users.find(u => u.uid === uid) || null;
      callback(matched);
    };

    window.addEventListener("storage", triggerLocal);
    window.addEventListener("gomboUserProfileChange", triggerLocal as EventListener);
    
    triggerLocal();

    return () => {
      window.removeEventListener("storage", triggerLocal);
      window.removeEventListener("gomboUserProfileChange", triggerLocal as EventListener);
    };
  },

  async getAllUsers(): Promise<UserProfile[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(collection(db, "users"));
        return snap.docs.map(d => d.data() as UserProfile);
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour getAllUsers.", error);
        setIsFirebaseMock(true);
      }
    }
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
  },

  async deleteUserProfile(uid: string): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await deleteDoc(doc(db, "users", uid));
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour deleteUserProfile.", error);
        setIsFirebaseMock(true);
      }
    }
    let users: UserProfile[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
    users = users.filter(u => u.uid !== uid);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    triggerStorageEvent();
  },

  // GOMBOS
  async getAllGombos(): Promise<Gombo[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(collection(db, "gombos"));
        return snap.docs.map(d => d.data() as Gombo);
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour getAllGombos.", error);
        setIsFirebaseMock(true);
      }
    }
    return JSON.parse(localStorage.getItem(LOCAL_GOMBOS_KEY) || "[]");
  },

  listenAllGombos(callback: (gombos: Gombo[]) => void): () => void {
    if (!isFirebaseMock && db) {
      try {
        const q = query(collection(db, "gombos"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(d => d.data() as Gombo);
          callback(list);
        }, (error) => {
          console.error("⚠️ Firestore listenAllGombos Error:", error);
        });
        return unsubscribe;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour listenAllGombos. Repli.", error);
      }
    }

    const triggerLocal = () => {
      const gombos: Gombo[] = JSON.parse(localStorage.getItem(LOCAL_GOMBOS_KEY) || "[]");
      callback(gombos);
    };

    window.addEventListener("storage", triggerLocal);
    window.addEventListener("gomboGomboChange", triggerLocal as EventListener);
    triggerLocal();

    return () => {
      window.removeEventListener("storage", triggerLocal);
      window.removeEventListener("gomboGomboChange", triggerLocal as EventListener);
    };
  },

  async publishGombo(gombo: Omit<Gombo, "id" | "createdAt" | "status">): Promise<Gombo> {
    const id = "gom_" + Math.random().toString(36).substring(2, 9);
    const newGombo: Gombo = {
      ...gombo,
      id,
      status: "publie",
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "gombos", id), newGombo);
        return newGombo;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour publishGombo.", error);
        setIsFirebaseMock(true);
      }
    }

    const gombos: Gombo[] = JSON.parse(localStorage.getItem(LOCAL_GOMBOS_KEY) || "[]");
    gombos.unshift(newGombo);
    localStorage.setItem(LOCAL_GOMBOS_KEY, JSON.stringify(gombos));
    triggerStorageEvent();
    window.dispatchEvent(new Event("gomboGomboChange"));
    return newGombo;
  },

  async updateGombo(id: string, updates: Partial<Gombo>): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "gombos", id), updates, { merge: true });
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour updateGombo.", error);
        setIsFirebaseMock(true);
      }
    }
    const gombos: Gombo[] = JSON.parse(localStorage.getItem(LOCAL_GOMBOS_KEY) || "[]");
    const idx = gombos.findIndex(g => g.id === id);
    if (idx !== -1) {
      gombos[idx] = { ...gombos[idx], ...updates };
      localStorage.setItem(LOCAL_GOMBOS_KEY, JSON.stringify(gombos));
      triggerStorageEvent();
      window.dispatchEvent(new Event("gomboGomboChange"));
    }
  },

  async deleteGombo(id: string): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await deleteDoc(doc(db, "gombos", id));
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour deleteGombo.", error);
        setIsFirebaseMock(true);
      }
    }
    let gombos: Gombo[] = JSON.parse(localStorage.getItem(LOCAL_GOMBOS_KEY) || "[]");
    gombos = gombos.filter(g => g.id !== id);
    localStorage.setItem(LOCAL_GOMBOS_KEY, JSON.stringify(gombos));
    triggerStorageEvent();
    window.dispatchEvent(new Event("gomboGomboChange"));
  },

  // APPLICATIONS
  async getApplications(): Promise<Application[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(collection(db, "applications"));
        return snap.docs.map(d => d.data() as Application);
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour getApplications.", error);
        setIsFirebaseMock(true);
      }
    }
    return JSON.parse(localStorage.getItem(LOCAL_APPLICATIONS_KEY) || "[]");
  },

  listenApplications(callback: (applications: Application[]) => void): () => void {
    if (!isFirebaseMock && db) {
      try {
        const q = query(collection(db, "applications"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(d => d.data() as Application);
          callback(list);
        }, (error) => {
          console.error("⚠️ Firestore listenApplications Error:", error);
        });
        return unsubscribe;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour listenApplications. Repli.", error);
      }
    }

    const triggerLocal = () => {
      const apps: Application[] = JSON.parse(localStorage.getItem(LOCAL_APPLICATIONS_KEY) || "[]");
      callback(apps);
    };

    window.addEventListener("storage", triggerLocal);
    window.addEventListener("gomboApplicationsChange", triggerLocal as EventListener);
    triggerLocal();

    return () => {
      window.removeEventListener("storage", triggerLocal);
      window.removeEventListener("gomboApplicationsChange", triggerLocal as EventListener);
    };
  },

  async applyToGombo(appData: Omit<Application, "id" | "createdAt" | "status">): Promise<Application> {
    const id = "app_" + Math.random().toString(36).substring(2, 10);
    const newApp: Application = {
      ...appData,
      id,
      status: "en_attente",
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "applications", id), newApp);
        return newApp;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour applyToGombo.", error);
        setIsFirebaseMock(true);
      }
    }

    const apps: Application[] = JSON.parse(localStorage.getItem(LOCAL_APPLICATIONS_KEY) || "[]");
    apps.push(newApp);
    localStorage.setItem(LOCAL_APPLICATIONS_KEY, JSON.stringify(apps));
    triggerStorageEvent();
    window.dispatchEvent(new Event("gomboApplicationsChange"));
    return newApp;
  },

  async updateApplicationStatus(id: string, status: ApplicationStatus): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "applications", id), { status }, { merge: true });
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour updateApplicationStatus.", error);
        setIsFirebaseMock(true);
      }
    }
    const apps: Application[] = JSON.parse(localStorage.getItem(LOCAL_APPLICATIONS_KEY) || "[]");
    const idx = apps.findIndex(a => a.id === id);
    if (idx !== -1) {
      apps[idx].status = status;
      localStorage.setItem(LOCAL_APPLICATIONS_KEY, JSON.stringify(apps));
      triggerStorageEvent();
      window.dispatchEvent(new Event("gomboApplicationsChange"));
    }
  },

  // BOOKINGS / RESERVATIONS
  async getReservations(): Promise<Reservation[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(collection(db, "reservations"));
        return snap.docs.map(d => d.data() as Reservation);
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour getReservations.", error);
        setIsFirebaseMock(true);
      }
    }
    return JSON.parse(localStorage.getItem(LOCAL_RESERVATIONS_KEY) || "[]");
  },

  async confirmBooking(booking: Omit<Reservation, "id" | "createdAt" | "status">): Promise<Reservation> {
    const id = "res_" + Math.random().toString(36).substring(2, 9);
    const newRes: Reservation = {
      ...booking,
      id,
      status: "confirme",
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "reservations", id), newRes);
        // Also update the Gombo to Reserved
        await setDoc(doc(db, "gombos", booking.gomboId), { status: "reserve" }, { merge: true });
        return newRes;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour confirmBooking.", error);
        setIsFirebaseMock(true);
      }
    }

    const reservations: Reservation[] = JSON.parse(localStorage.getItem(LOCAL_RESERVATIONS_KEY) || "[]");
    reservations.push(newRes);
    localStorage.setItem(LOCAL_RESERVATIONS_KEY, JSON.stringify(reservations));

    // Update Gombo post status to 'reserve'
    const gombos: Gombo[] = JSON.parse(localStorage.getItem(LOCAL_GOMBOS_KEY) || "[]");
    const gIndex = gombos.findIndex(g => g.id === booking.gomboId);
    if (gIndex !== -1) {
      gombos[gIndex].status = "reserve";
      localStorage.setItem(LOCAL_GOMBOS_KEY, JSON.stringify(gombos));
    }

    triggerStorageEvent();
    return newRes;
  },

  // FUTURE TRACKING SYSTEM
  async registerWaitingFeature(uid: string, email: string, featureName: string): Promise<void> {
    const id = "wait_" + Math.random().toString(36).substring(2, 10);
    const record: WaitingFeature = {
      id,
      uid,
      userEmail: email,
      featureName,
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "waiting_features", id), record);
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour registerWaitingFeature.", error);
        setIsFirebaseMock(true);
      }
    }

    const list: WaitingFeature[] = JSON.parse(localStorage.getItem(LOCAL_WAITING_KEY) || "[]");
    // Prevent duplicated signups
    if (!list.some(item => item.uid === uid && item.featureName === featureName)) {
      list.push(record);
      localStorage.setItem(LOCAL_WAITING_KEY, JSON.stringify(list));
      triggerStorageEvent();
    }
  },

  async getWaitingFeaturesCount(): Promise<WaitingFeature[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(collection(db, "waiting_features"));
        return snap.docs.map(d => d.data() as WaitingFeature);
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour getWaitingFeaturesCount.", error);
        setIsFirebaseMock(true);
      }
    }
    return JSON.parse(localStorage.getItem(LOCAL_WAITING_KEY) || "[]");
  },

  // SOCIAL POSTS FEED (FIL D'ACTUALITÉ)
  async getSocialPosts(): Promise<SocialPost[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(collection(db, "posts"));
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as SocialPost);
        }
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli local pour getSocialPosts.", error);
      }
    }

    if (!localStorage.getItem("gombo_social_posts")) {
      const initialPosts: SocialPost[] = [
        {
          id: "post1",
          userId: "mus1",
          userName: "Yorobo Sangaré",
          userAvatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200",
          userRole: "Guitariste Soliste Lead",
          title: "Ambiance Choc Rumba",
          caption: "Un petit extrait de mon solo de guitare enregistré en live hier soir au lounge Le Paris-Dakar à Marcory Biétry 🇨🇮. Dites-moi ce que vous en pensez en commentaire, dispo pour vos gombos d'ambiance et sessions de studio !",
          beatProd: "Yorobo Solo Prod",
          tags: ["#Afro", "#Rumba", "#GuitarSolo", "#ShowbizCI", "#YaGomboMusic"],
          likesCount: 24,
          sharesCount: 12,
          savesCount: 8,
          likedBy: [],
          savedBy: [],
          comments: [
            {
              id: "com1",
              userId: "mus2",
              userName: "Fanta Kouyaté",
              userAvatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200",
              text: "Le toucher de guitare est trop doux mon frère ! Force à toi 🔥",
              createdAt: new Date().toISOString()
            }
          ],
          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          imageUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=500",
          createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
        },
        {
          id: "post2",
          userId: "mus2",
          userName: "Fanta Kouyaté",
          userAvatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200",
          userRole: "Chanteuse Lead Gospel",
          title: "Voix d'Or Acoustique",
          caption: "A cappella direct depuis l'Espace Eden pendant la répétition pour le mariage princier de samedi. Toujours prête à rajouter une ambiance royale à vos célébrations chics 👑✨. Contactez-moi pour réserver !",
          beatProd: "Acoustique Vocals",
          tags: ["#Gospel", "#Voice", "#WeddingLive", "#AbidjanChic", "#YAGOMBOMUSIC"],
          likesCount: 18,
          sharesCount: 5,
          savesCount: 14,
          likedBy: [],
          savedBy: [],
          comments: [
            {
              id: "com2",
              userId: "mus1",
              userName: "Yorobo Sangaré",
              userAvatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200",
              text: "La voix de Côte d'Ivoire ! Pur talent !",
              createdAt: new Date().toISOString()
            }
          ],
          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
          imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=500",
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
        }
      ];
      localStorage.setItem("gombo_social_posts", JSON.stringify(initialPosts));
    }
    return JSON.parse(localStorage.getItem("gombo_social_posts") || "[]");
  },

  listenSocialPosts(callback: (posts: SocialPost[]) => void): () => void {
    if (!isFirebaseMock && db) {
      try {
        const q = query(collection(db, "posts"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(d => d.data() as SocialPost);
          callback(list);
        }, (error) => {
          console.error("⚠️ Firestore listenSocialPosts Error:", error);
        });
        return unsubscribe;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour listenSocialPosts. Repli.", error);
      }
    }

    const triggerLocal = () => {
      const posts: SocialPost[] = JSON.parse(localStorage.getItem("gombo_social_posts") || "[]");
      callback(posts);
    };

    window.addEventListener("storage", triggerLocal);
    window.addEventListener("gomboSocialPostsChange", triggerLocal as EventListener);
    triggerLocal();

    return () => {
      window.removeEventListener("storage", triggerLocal);
      window.removeEventListener("gomboSocialPostsChange", triggerLocal as EventListener);
    };
  },

  async publishSocialPost(post: Omit<SocialPost, "id" | "createdAt" | "likesCount" | "sharesCount" | "savesCount" | "likedBy" | "savedBy" | "comments">): Promise<SocialPost> {
    const id = "post_" + Math.random().toString(36).substring(2, 9);
    const newPost: SocialPost = {
      ...post,
      id,
      likesCount: 0,
      sharesCount: 0,
      savesCount: 0,
      likedBy: [],
      savedBy: [],
      comments: [],
      createdAt: new Date().toISOString()
    };
    
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "posts", id), newPost);
        return newPost;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli local pour publishSocialPost.", error);
        setIsFirebaseMock(true);
      }
    }

    const posts: SocialPost[] = JSON.parse(localStorage.getItem("gombo_social_posts") || "[]");
    posts.unshift(newPost);
    localStorage.setItem("gombo_social_posts", JSON.stringify(posts));
    triggerStorageEvent();
    window.dispatchEvent(new Event("gomboSocialPostsChange"));
    return newPost;
  },

  async updateSocialPost(id: string, updates: Partial<SocialPost>): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "posts", id), updates, { merge: true });
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli local pour updateSocialPost.", error);
        setIsFirebaseMock(true);
      }
    }

    const posts: SocialPost[] = JSON.parse(localStorage.getItem("gombo_social_posts") || "[]");
    const idx = posts.findIndex(p => p.id === id);
    if (idx !== -1) {
      posts[idx] = { ...posts[idx], ...updates };
      localStorage.setItem("gombo_social_posts", JSON.stringify(posts));
      triggerStorageEvent();
      window.dispatchEvent(new Event("gomboSocialPostsChange"));
    }
  },

  async sendNotification(notification: Omit<GomboNotification, "id" | "createdAt" | "read">): Promise<GomboNotification> {
    const id = "notif_" + Math.random().toString(36).substring(2, 10);
    const newNotif: GomboNotification = {
      ...notification,
      id,
      read: false,
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "notifications", id), newNotif);
        return newNotif;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour sendNotification.", error);
        setIsFirebaseMock(true);
      }
    }

    const notifs: GomboNotification[] = JSON.parse(localStorage.getItem(LOCAL_NOTIFICATIONS_KEY) || "[]");
    notifs.unshift(newNotif);
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(notifs));
    triggerStorageEvent();
    window.dispatchEvent(new CustomEvent("gomboNotificationChange", { detail: notifs }));
    return newNotif;
  },

  async getNotifications(userId: string): Promise<GomboNotification[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(query(collection(db, "notifications"), where("userId", "==", userId)));
        return snap.docs.map(d => d.data() as GomboNotification).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour getNotifications.", error);
        setIsFirebaseMock(true);
      }
    }
    const notifs: GomboNotification[] = JSON.parse(localStorage.getItem(LOCAL_NOTIFICATIONS_KEY) || "[]");
    return notifs.filter(n => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async markNotificationAsRead(id: string): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "notifications", id), { read: true }, { merge: true });
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour markNotificationAsRead.", error);
        setIsFirebaseMock(true);
      }
    }
    const notifs: GomboNotification[] = JSON.parse(localStorage.getItem(LOCAL_NOTIFICATIONS_KEY) || "[]");
    const idx = notifs.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifs[idx].read = true;
      localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(notifs));
      triggerStorageEvent();
      window.dispatchEvent(new CustomEvent("gomboNotificationChange", { detail: notifs }));
    }
  },

  async deleteNotification(id: string): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await deleteDoc(doc(db, "notifications", id));
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour deleteNotification.", error);
        setIsFirebaseMock(true);
      }
    }
    const notifs: GomboNotification[] = JSON.parse(localStorage.getItem(LOCAL_NOTIFICATIONS_KEY) || "[]");
    const updated = notifs.filter(n => n.id !== id);
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(updated));
    triggerStorageEvent();
    window.dispatchEvent(new CustomEvent("gomboNotificationChange", { detail: updated }));
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false)));
        for (const d of snap.docs) {
          await setDoc(doc(db, "notifications", d.id), { read: true }, { merge: true });
        }
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour markAllNotificationsAsRead.", error);
      }
    }
    const notifs: GomboNotification[] = JSON.parse(localStorage.getItem(LOCAL_NOTIFICATIONS_KEY) || "[]");
    const updated = notifs.map(n => n.userId === userId ? { ...n, read: isFirebaseMock ? true : true } : n);
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(updated));
    triggerStorageEvent();
    window.dispatchEvent(new CustomEvent("gomboNotificationChange", { detail: updated }));
  },

  async checkIsSuperAdminByEmail(email: string): Promise<boolean> {
    const list = ["johnsylvesterh@gmail.com", "jhs.kmj7@gmail.com", "sylvestrehounkpevi777@gmail.com"];
    if (list.includes(email.toLowerCase())) {
      if (!isFirebaseMock && db) {
        try {
          const adminId = email.replace(/[^a-zA-Z0-9]/g, "_");
          await setDoc(doc(db, "admins", adminId), {
            email: email.toLowerCase(),
            role: "super_admin",
            permissions: ["all"],
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn("⚠️ Non-fatal: auto-registering admin failed under firestore:", e);
        }
      }
      return true;
    }
    
    if (!isFirebaseMock && db) {
      try {
        const q = query(collection(db, "admins"), where("email", "==", email.toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) return true;
      } catch (e) {
        console.warn("⚠️ Error checking admins collection in Firestore", e);
      }
    }
    const localAdmins = JSON.parse(localStorage.getItem("gombo_admins") || "[]");
    return localAdmins.some((a: any) => a.email.toLowerCase() === email.toLowerCase());
  },

  async addAdminLog(adminEmail: string, action: string, targetId: string): Promise<void> {
    const id = "log_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
    const newLog: AdminLog = {
      id,
      adminEmail,
      action,
      targetId,
      createdAt: new Date().toISOString()
    };
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "admin_logs", id), {
          id,
          action,
          targetId,
          performedBy: auth?.currentUser?.email || adminEmail,
          createdAt: new Date().toISOString()
        });
        return;
      } catch (error) {
        console.warn("⚠️ Firestore admin log insert failed:", error);
      }
    }
    const logs = JSON.parse(localStorage.getItem("gombo_admin_logs") || "[]");
    logs.unshift(newLog);
    localStorage.setItem("gombo_admin_logs", JSON.stringify(logs));
    triggerStorageEvent();
  },

  async getAdminLogs(): Promise<AdminLog[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(collection(db, "admin_logs"));
        return snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            adminEmail: data.adminEmail || data.performedBy || "admin@gombo.ci",
            action: data.action || "MODIFICATION",
            targetId: data.targetId || "",
            createdAt: data.createdAt || new Date().toISOString()
          };
        }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } catch (error) {
        console.warn("⚠️ Firestore admin log read failed:", error);
      }
    }
    const logs = JSON.parse(localStorage.getItem("gombo_admin_logs") || "[]");
    return logs.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
  },

  async getUsersAdmin(): Promise<UserProfile[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(collection(db, "users"));
        return snap.docs.map(d => d.data() as UserProfile);
      } catch (error) {
        console.warn("⚠️ Firestore fetch users failed", error);
      }
    }
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
  },

  async getPostsAdmin(): Promise<SocialPost[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(collection(db, "posts"));
        return snap.docs.map(d => d.data() as SocialPost);
      } catch (error) {
        console.warn("⚠️ Firestore fetch posts failed", error);
      }
    }
    return JSON.parse(localStorage.getItem("gombo_social_posts") || "[]");
  },

  async getGroupsAdmin(): Promise<MusicGroup[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(collection(db, "music_groups"));
        return snap.docs.map(d => d.data() as MusicGroup);
      } catch (error) {
        console.warn("⚠️ Firestore fetch groups failed", error);
      }
    }
    return JSON.parse(localStorage.getItem("gombo_music_groups") || "[]");
  },

  async getRenfortsAdmin(): Promise<Renfort[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(collection(db, "renforts"));
        return snap.docs.map(d => d.data() as Renfort);
      } catch (error) {
        console.warn("⚠️ Firestore fetch renforts failed", error);
      }
    }
    return JSON.parse(localStorage.getItem(LOCAL_RENFORS_KEY) || "[]");
  },

  async getSubscriptionsAdmin(): Promise<GomboSubscription[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(collection(db, "subscriptions"));
        return snap.docs.map(d => d.data() as GomboSubscription);
      } catch (error) {
        console.warn("⚠️ Firestore fetch subscriptions failed", error);
      }
    }
    return JSON.parse(localStorage.getItem("gombo_subscriptions") || "[]");
  },

  async getPaymentsAdmin(): Promise<GomboPayment[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(collection(db, "payments"));
        return snap.docs.map(d => d.data() as GomboPayment);
      } catch (error) {
        console.warn("⚠️ Firestore fetch payments failed", error);
      }
    }
    return JSON.parse(localStorage.getItem("gombo_payments") || "[]");
  },

  async getReportsAdmin(): Promise<any[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(collection(db, "reports"));
        return snap.docs.map(d => d.data()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } catch (error) {
        console.warn("⚠️ Firestore fetch reports failed", error);
      }
    }
    return JSON.parse(localStorage.getItem("gombo_reports") || "[]");
  },

  async submitReport(report: { reportedBy: string; reporterEmail: string; contentId: string; contentType: string; contentTitle: string; authorId: string; reason: string }): Promise<void> {
    const id = "rep_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
    const newReport = {
      ...report,
      id,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "reports", id), newReport);
        return;
      } catch (error) {
        console.warn("⚠️ Firestore submit report failed", error);
      }
    }
    const reports = JSON.parse(localStorage.getItem("gombo_reports") || "[]");
    reports.unshift(newReport);
    localStorage.setItem("gombo_reports", JSON.stringify(reports));
    triggerStorageEvent();
  },

  async toggleUserSuspension(uid: string, suspend: boolean, adminEmail: string): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "users", uid), { isSuspended: suspend }, { merge: true });
      } catch (error) {
        console.warn("⚠️ Firestore toggle suspension failed", error);
      }
    }
    const users: UserProfile[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
    const idx = users.findIndex(u => u.uid === uid);
    if (idx !== -1) {
      users[idx].isSuspended = suspend;
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      triggerStorageEvent();
    }
    await this.addAdminLog(adminEmail, suspend ? "SUSPEND_USER" : "REACTIVE_USER", uid);
  },

  async toggleUserCertified(uid: string, certify: boolean, adminEmail: string): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "users", uid), { isCertified: certify }, { merge: true });
      } catch (error) {
        console.warn("⚠️ Firestore toggle certified failed", error);
      }
    }
    const users: UserProfile[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
    const idx = users.findIndex(u => u.uid === uid);
    if (idx !== -1) {
      users[idx].isCertified = certify;
      if (certify) {
        users[idx].badges = Array.from(new Set([...(users[idx].badges || []), "⭐ Talent Certifié"]));
        users[idx].verificationStatus = "certifie";
      } else {
        users[idx].badges = (users[idx].badges || []).filter(b => b !== "⭐ Talent Certifié");
        users[idx].verificationStatus = "standard";
      }
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      triggerStorageEvent();
    }
    await this.addAdminLog(adminEmail, certify ? "CERTIFY_USER" : "REVOKE_CERTIFICATION", uid);
    
    // Trigger notification to user
    await this.sendNotification({
      userId: uid,
      title: certify ? "Badge obtenu ! 🏆" : "Badge mis à jour 🏆",
      message: certify ? "Félicitations ! Vous avez obtenu le badge Talent Certifié ⭐" : "Votre certification a été mise à jour par l'administration d'AFRIGOMBO.",
      type: "certification_approved"
    });
  },

  async banUserPermanently(uid: string, adminEmail: string): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "users", uid), { isBanned: true, isSuspended: true }, { merge: true });
      } catch (error) {
        console.warn("⚠️ Firestore ban user failed", error);
      }
    }
    const users: UserProfile[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
    const idx = users.findIndex(u => u.uid === uid);
    if (idx !== -1) {
      users[idx].isBanned = true;
      users[idx].isSuspended = true;
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      triggerStorageEvent();
    }
    await this.addAdminLog(adminEmail, "BAN_USER_PERMANENTLY", uid);
  },

  async deletePostAdmin(postId: string, adminEmail: string): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await deleteDoc(doc(db, "posts", postId));
      } catch (error) {
        console.warn("⚠️ Firestore delete post failed", error);
      }
    }
    const posts: SocialPost[] = JSON.parse(localStorage.getItem("gombo_social_posts") || "[]");
    const updated = posts.filter(p => p.id !== postId);
    localStorage.setItem("gombo_social_posts", JSON.stringify(updated));
    triggerStorageEvent();
    window.dispatchEvent(new Event("gomboSocialPostsChange"));
    await this.addAdminLog(adminEmail, "DELETE_POST", postId);
  },

  async togglePostVisibility(postId: string, hide: boolean, adminEmail: string): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "posts", postId), { isHidden: hide }, { merge: true });
      } catch (error) {
        console.warn("⚠️ Firestore toggle post visibility failed", error);
      }
    }
    const posts: any[] = JSON.parse(localStorage.getItem("gombo_social_posts") || "[]");
    const idx = posts.findIndex(p => p.id === postId);
    if (idx !== -1) {
      posts[idx].isHidden = hide;
      localStorage.setItem("gombo_social_posts", JSON.stringify(posts));
      triggerStorageEvent();
      window.dispatchEvent(new Event("gomboSocialPostsChange"));
    }
    await this.addAdminLog(adminEmail, hide ? "HIDE_POST" : "RESTORE_POST", postId);
  },

  async auditReportAction(reportId: string, action: "ignore" | "delete" | "suspend" | "ban", adminEmail: string, contentId?: string, authorId?: string): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "reports", reportId), { status: action === "ignore" ? "ignored" : "resolved" }, { merge: true });
      } catch (error) {
        console.warn("⚠️ Firestore update report failed", error);
      }
    }
    const reports = JSON.parse(localStorage.getItem("gombo_reports") || "[]");
    const idx = reports.findIndex((r: any) => r.id === reportId);
    if (idx !== -1) {
      reports[idx].status = action === "ignore" ? "ignored" : "resolved";
      localStorage.setItem("gombo_reports", JSON.stringify(reports));
      triggerStorageEvent();
    }

    if (action === "ignore") {
      await this.addAdminLog(adminEmail, "REPORT_IGNORED", reportId);
    } else if (action === "delete" && contentId) {
      await this.deletePostAdmin(contentId, adminEmail);
      await this.addAdminLog(adminEmail, "REPORT_RESOLVED_DELETED", contentId);
    } else if (action === "suspend" && authorId) {
      await this.toggleUserSuspension(authorId, true, adminEmail);
      await this.addAdminLog(adminEmail, "REPORT_RESOLVED_SUSPENDED", authorId);
    } else if (action === "ban" && authorId) {
      await this.banUserPermanently(authorId, adminEmail);
      await this.addAdminLog(adminEmail, "REPORT_RESOLVED_BANNED", authorId);
    }
  },

  listenToNotifications(userId: string, callback: (notifications: GomboNotification[]) => void): () => void {
    if (!isFirebaseMock && db) {
      try {
        const q = query(collection(db, "notifications"), where("userId", "==", userId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(d => d.data() as GomboNotification);
          list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          callback(list);
        }, (error) => {
          console.error("⚠️ Firestore Listener Error:", error);
        });
        return unsubscribe;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour listenToNotifications. Repli local.", error);
      }
    }

    const triggerLocal = () => {
      const all: GomboNotification[] = JSON.parse(localStorage.getItem(LOCAL_NOTIFICATIONS_KEY) || "[]");
      const userNotifs = all.filter(n => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callback(userNotifs);
    };

    window.addEventListener("storage", triggerLocal);
    window.addEventListener("gomboNotificationChange", triggerLocal as EventListener);
    
    triggerLocal();

    return () => {
      window.removeEventListener("storage", triggerLocal);
      window.removeEventListener("gomboNotificationChange", triggerLocal as EventListener);
    };
  },

  async publishActivity(activity: Omit<ActivityFeedEntry, "id" | "createdAt">): Promise<ActivityFeedEntry> {
    const id = "act_" + Math.random().toString(36).substring(2, 10);
    const newActivity: ActivityFeedEntry = {
      ...activity,
      id,
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "activityFeed", id), newActivity);
        return newActivity;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour publishActivity.", error);
        setIsFirebaseMock(true);
      }
    }

    const activities: ActivityFeedEntry[] = JSON.parse(localStorage.getItem(LOCAL_ACTIVITY_FEED_KEY) || "[]");
    activities.unshift(newActivity);
    localStorage.setItem(LOCAL_ACTIVITY_FEED_KEY, JSON.stringify(activities));
    triggerStorageEvent();
    window.dispatchEvent(new CustomEvent("gomboActivityChange", { detail: activities }));
    return newActivity;
  },

  listenToActivityFeed(callback: (activities: ActivityFeedEntry[]) => void): () => void {
    if (!isFirebaseMock && db) {
      try {
        const q = collection(db, "activityFeed");
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(d => d.data() as ActivityFeedEntry);
          list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          callback(list.slice(0, 100)); // Limit to last 100 entries for stability
          return;
        }, (error) => {
          console.error("⚠️ Firestore Activity Feed Listener Error:", error);
        });
        return unsubscribe;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour listenToActivityFeed. Repli local.", error);
      }
    }

    const triggerLocal = () => {
      const all: ActivityFeedEntry[] = JSON.parse(localStorage.getItem(LOCAL_ACTIVITY_FEED_KEY) || "[]");
      all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callback(all);
    };

    window.addEventListener("storage", triggerLocal);
    window.addEventListener("gomboActivityChange", triggerLocal as EventListener);
    
    triggerLocal();

    return () => {
      window.removeEventListener("storage", triggerLocal);
      window.removeEventListener("gomboActivityChange", triggerLocal as EventListener);
    };
  },

  async uploadFile(path: string, file: File, onProgress?: (pct: number) => void): Promise<string> {
    if (!isFirebaseMock && storage) {
      try {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              if (onProgress) onProgress(progress);
            }, 
            (error) => {
              console.error("Storage upload failed:", error);
              reject(error);
            }, 
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            }
          );
        });
      } catch (err) {
        console.warn("Storage unreachable, falling back to local Blob URL:", err);
      }
    }
    // High-fidelity fallback for offline / mock modes
    return new Promise((resolve) => {
      let pct = 0;
      const interval = setInterval(() => {
        pct += 25;
        if (onProgress) onProgress(pct);
        if (pct >= 100) {
          clearInterval(interval);
          const localUrl = URL.createObjectURL(file);
          resolve(localUrl);
        }
      }, 150);
    });
  },

  async deleteSocialPost(id: string): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await deleteDoc(doc(db, "posts", id));
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible or rule block for deleteSocialPost.", error);
        setIsFirebaseMock(true);
      }
    }

    const posts: SocialPost[] = JSON.parse(localStorage.getItem("gombo_social_posts") || "[]");
    const filtered = posts.filter(p => p.id !== id);
    localStorage.setItem("gombo_social_posts", JSON.stringify(filtered));
    triggerStorageEvent();
    window.dispatchEvent(new Event("gomboSocialPostsChange"));
  },

  // --- RENFORTS (RENFORT EXPRESS) ---
  async getAllRenforts(): Promise<Renfort[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(collection(db, "renforts"));
        return snap.docs.map(d => d.data() as Renfort);
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour getAllRenforts.", error);
        setIsFirebaseMock(true);
      }
    }
    return JSON.parse(localStorage.getItem("gombo_renforts") || "[]");
  },

  listenAllRenforts(callback: (renforts: Renfort[]) => void): () => void {
    if (!isFirebaseMock && db) {
      try {
        const q = query(collection(db, "renforts"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(d => d.data() as Renfort);
          callback(list);
        }, (error) => {
          console.error("⚠️ Firestore listenAllRenforts Error:", error);
        });
        return unsubscribe;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour listenAllRenforts.", error);
      }
    }

    const triggerLocal = () => {
      const list = JSON.parse(localStorage.getItem("gombo_renforts") || "[]");
      callback(list);
    };

    window.addEventListener("storage", triggerLocal);
    window.addEventListener("gomboRenfortChange", triggerLocal);
    triggerLocal();

    return () => {
      window.removeEventListener("storage", triggerLocal);
      window.removeEventListener("gomboRenfortChange", triggerLocal);
    };
  },

  async publishRenfort(renfort: Omit<Renfort, "id" | "createdAt" | "status">): Promise<Renfort> {
    const id = "ren_" + Math.random().toString(36).substring(2, 9);
    const newRenfort: Renfort = {
      ...renfort,
      id,
      status: "publie",
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "renforts", id), newRenfort);
        return newRenfort;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour publishRenfort.", error);
        setIsFirebaseMock(true);
      }
    }

    const list: Renfort[] = JSON.parse(localStorage.getItem("gombo_renforts") || "[]");
    list.unshift(newRenfort);
    localStorage.setItem("gombo_renforts", JSON.stringify(list));
    triggerStorageEvent();
    window.dispatchEvent(new Event("gomboRenfortChange"));
    return newRenfort;
  },

  async deleteRenfort(id: string): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await deleteDoc(doc(db, "renforts", id));
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour deleteRenfort.", error);
        setIsFirebaseMock(true);
      }
    }
    let list: Renfort[] = JSON.parse(localStorage.getItem("gombo_renforts") || "[]");
    list = list.filter(r => r.id !== id);
    localStorage.setItem("gombo_renforts", JSON.stringify(list));
    triggerStorageEvent();
    window.dispatchEvent(new Event("gomboRenfortChange"));
  },

  // --- RENFORT APPLICATIONS ---
  async getRenfortApplications(): Promise<RenfortApplication[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(collection(db, "renfortApplications"));
        return snap.docs.map(d => d.data() as RenfortApplication);
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour getRenfortApplications.", error);
        setIsFirebaseMock(true);
      }
    }
    return JSON.parse(localStorage.getItem("gombo_renfort_applications") || "[]");
  },

  listenRenfortApplications(callback: (applications: RenfortApplication[]) => void): () => void {
    if (!isFirebaseMock && db) {
      try {
        const q = query(collection(db, "renfortApplications"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(d => d.data() as RenfortApplication);
          callback(list);
        }, (error) => {
          console.error("⚠️ Firestore listenRenfortApplications Error:", error);
        });
        return unsubscribe;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour listenRenfortApplications.", error);
      }
    }

    const triggerLocal = () => {
      const list = JSON.parse(localStorage.getItem("gombo_renfort_applications") || "[]");
      callback(list);
    };

    window.addEventListener("storage", triggerLocal);
    window.addEventListener("gomboRenfortAppChange", triggerLocal);
    triggerLocal();

    return () => {
      window.removeEventListener("storage", triggerLocal);
      window.removeEventListener("gomboRenfortAppChange", triggerLocal);
    };
  },

  async applyToRenfort(appData: Omit<RenfortApplication, "id" | "createdAt" | "status">): Promise<RenfortApplication> {
    const id = "rapp_" + Math.random().toString(36).substring(2, 10);
    const newApp: RenfortApplication = {
      ...appData,
      id,
      status: "en_attente",
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "renfortApplications", id), newApp);
        return newApp;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour applyToRenfort.", error);
        setIsFirebaseMock(true);
      }
    }

    const list: RenfortApplication[] = JSON.parse(localStorage.getItem("gombo_renfort_applications") || "[]");
    list.push(newApp);
    localStorage.setItem("gombo_renfort_applications", JSON.stringify(list));
    triggerStorageEvent();
    window.dispatchEvent(new Event("gomboRenfortAppChange"));
    return newApp;
  },

  async updateRenfortApplicationStatus(id: string, status: "en_attente" | "accepte" | "refuse"): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "renfortApplications", id), { status }, { merge: true });
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour updateRenfortApplicationStatus.", error);
        setIsFirebaseMock(true);
      }
    }
    const list: RenfortApplication[] = JSON.parse(localStorage.getItem("gombo_renfort_applications") || "[]");
    const idx = list.findIndex(a => a.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      localStorage.setItem("gombo_renfort_applications", JSON.stringify(list));
      triggerStorageEvent();
      window.dispatchEvent(new Event("gomboRenfortAppChange"));
    }
  },

  // ==========================================
  // --- Monetization Infrastructure (Beta) ---
  // ==========================================
  async publishSubscription(sub: Omit<GomboSubscription, "id" | "createdAt">): Promise<GomboSubscription> {
    const id = "sub_" + Math.random().toString(36).substr(2, 9);
    const newSub: GomboSubscription = {
      ...sub,
      id,
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "subscriptions", id), newSub);
        return newSub;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour publishSubscription.", error);
        setIsFirebaseMock(true);
      }
    }

    const list: GomboSubscription[] = JSON.parse(localStorage.getItem("gombo_subscriptions") || "[]");
    list.push(newSub);
    localStorage.setItem("gombo_subscriptions", JSON.stringify(list));
    triggerStorageEvent();
    window.dispatchEvent(new Event("gomboMonetizationChange"));
    return newSub;
  },

  async getSubscriptions(userId: string): Promise<GomboSubscription[]> {
    if (!isFirebaseMock && db) {
      try {
        const q = query(collection(db, "subscriptions"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const results: GomboSubscription[] = [];
        querySnapshot.forEach((doc) => {
          results.push(doc.data() as GomboSubscription);
        });
        return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour getSubscriptions.", error);
        setIsFirebaseMock(true);
      }
    }

    const list: GomboSubscription[] = JSON.parse(localStorage.getItem("gombo_subscriptions") || "[]");
    return list.filter(s => s.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async publishPayment(pay: Omit<GomboPayment, "id" | "createdAt">): Promise<GomboPayment> {
    const id = "pay_" + Math.random().toString(36).substr(2, 9);
    const newPay: GomboPayment = {
      ...pay,
      id,
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "payments", id), newPay);
        return newPay;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour publishPayment.", error);
        setIsFirebaseMock(true);
      }
    }

    const list: GomboPayment[] = JSON.parse(localStorage.getItem("gombo_payments") || "[]");
    list.push(newPay);
    localStorage.setItem("gombo_payments", JSON.stringify(list));
    triggerStorageEvent();
    window.dispatchEvent(new Event("gomboMonetizationChange"));
    return newPay;
  },

  async getPayments(userId: string): Promise<GomboPayment[]> {
    if (!isFirebaseMock && db) {
      try {
        const q = query(collection(db, "payments"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const results: GomboPayment[] = [];
        querySnapshot.forEach((doc) => {
          results.push(doc.data() as GomboPayment);
        });
        return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour getPayments.", error);
        setIsFirebaseMock(true);
      }
    }

    const list: GomboPayment[] = JSON.parse(localStorage.getItem("gombo_payments") || "[]");
    return list.filter(p => p.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async publishBoost(boost: Omit<GomboBoost, "id" | "createdAt" | "status">): Promise<GomboBoost> {
    const id = "boost_" + Math.random().toString(36).substr(2, 9);
    const newBoost: GomboBoost = {
      ...boost,
      id,
      status: "actif",
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "boosts", id), newBoost);
        // Also update the target item status in firebase (e.g. gombos or posts) if they exist
        const targetColl = boost.targetType === "gombo" ? "gombos" : "posts";
        await setDoc(doc(db, targetColl, boost.targetId), { isBoosted: true, urgent: true }, { merge: true });
        return newBoost;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour publishBoost.", error);
        setIsFirebaseMock(true);
      }
    }

    const list: GomboBoost[] = JSON.parse(localStorage.getItem("gombo_boosts") || "[]");
    list.push(newBoost);
    localStorage.setItem("gombo_boosts", JSON.stringify(list));

    // Support client side simulation of boost effect
    if (boost.targetType === "gombo") {
      const gombos: Gombo[] = JSON.parse(localStorage.getItem("gombo_offers") || "[]");
      const idx = gombos.findIndex(g => g.id === boost.targetId);
      if (idx !== -1) {
        gombos[idx].urgent = true;
        localStorage.setItem("gombo_offers", JSON.stringify(gombos));
        window.dispatchEvent(new Event("gomboOffersChange"));
      }
    } else {
      const posts: SocialPost[] = JSON.parse(localStorage.getItem("gombo_social_posts") || "[]");
      const idx = posts.findIndex(p => p.id === boost.targetId);
      if (idx !== -1) {
        posts[idx].urgent = true;
        localStorage.setItem("gombo_social_posts", JSON.stringify(posts));
        window.dispatchEvent(new Event("gomboSocialChange"));
      }
    }

    triggerStorageEvent();
    window.dispatchEvent(new Event("gomboMonetizationChange"));
    return newBoost;
  },

  async getBoosts(): Promise<GomboBoost[]> {
    if (!isFirebaseMock && db) {
      try {
        const querySnapshot = await getDocs(collection(db, "boosts"));
        const results: GomboBoost[] = [];
        querySnapshot.forEach((doc) => {
          results.push(doc.data() as GomboBoost);
        });
        return results;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour getBoosts.", error);
        setIsFirebaseMock(true);
      }
    }

    return JSON.parse(localStorage.getItem("gombo_boosts") || "[]");
  },

  async publishCertification(cert: Omit<GomboCertification, "id" | "createdAt" | "status">): Promise<GomboCertification> {
    const id = "cert_" + Math.random().toString(36).substr(2, 9);
    const newCert: GomboCertification = {
      ...cert,
      id,
      status: "en_attente",
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "certifications", id), newCert);
        return newCert;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour publishCertification.", error);
        setIsFirebaseMock(true);
      }
    }

    const list: GomboCertification[] = JSON.parse(localStorage.getItem("gombo_certifications") || "[]");
    list.push(newCert);
    localStorage.setItem("gombo_certifications", JSON.stringify(list));
    triggerStorageEvent();
    window.dispatchEvent(new Event("gomboMonetizationChange"));
    return newCert;
  },

  async getCertifications(userId: string): Promise<GomboCertification[]> {
    if (!isFirebaseMock && db) {
      try {
        const q = query(collection(db, "certifications"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const results: GomboCertification[] = [];
        querySnapshot.forEach((doc) => {
          results.push(doc.data() as GomboCertification);
        });
        return results;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour getCertifications.", error);
        setIsFirebaseMock(true);
      }
    }

    const list: GomboCertification[] = JSON.parse(localStorage.getItem("gombo_certifications") || "[]");
    return list.filter(c => c.userId === userId);
  },

  async publishCertificationRequest(req: Omit<CertificationRequest, "id" | "status" | "createdAt">): Promise<CertificationRequest> {
    const id = "cert_req_" + Math.random().toString(36).substr(2, 9);
    const newReq: CertificationRequest = {
      ...req,
      id,
      status: "En attente",
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "certificationRequests", id), newReq);
        return newReq;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour publishCertificationRequest.", error);
        setIsFirebaseMock(true);
      }
    }

    const list: CertificationRequest[] = JSON.parse(localStorage.getItem("gombo_certification_requests") || "[]");
    list.push(newReq);
    localStorage.setItem("gombo_certification_requests", JSON.stringify(list));
    triggerStorageEvent();
    return newReq;
  },

  async getCertificationRequests(userId: string): Promise<CertificationRequest[]> {
    if (!isFirebaseMock && db) {
      try {
        const q = query(collection(db, "certificationRequests"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const results: CertificationRequest[] = [];
        querySnapshot.forEach((doc) => {
          results.push(doc.data() as CertificationRequest);
        });
        return results;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour getCertificationRequests.", error);
        setIsFirebaseMock(true);
      }
    }

    const list: CertificationRequest[] = JSON.parse(localStorage.getItem("gombo_certification_requests") || "[]");
    return list.filter(c => c.userId === userId);
  },

  async getAllCertificationRequests(): Promise<CertificationRequest[]> {
    if (!isFirebaseMock && db) {
      try {
        const q = query(collection(db, "certificationRequests"));
        const querySnapshot = await getDocs(q);
        const results: CertificationRequest[] = [];
        querySnapshot.forEach((doc) => {
          results.push(doc.data() as CertificationRequest);
        });
        return results;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour getAllCertificationRequests.", error);
        setIsFirebaseMock(true);
      }
    }

    return JSON.parse(localStorage.getItem("gombo_certification_requests") || "[]");
  },

  async updateCertificationRequestStatus(requestId: string, status: "En attente" | "Approuvé" | "Refusé"): Promise<void> {
    let targetUserId = "";
    let artistName = "Artiste";

    if (!isFirebaseMock && db) {
      try {
        await updateDoc(doc(db, "certificationRequests", requestId), { status });
        
        // Let's also fetch the request, and if approved, update user's profile
        const requestSnap = await getDocs(query(collection(db, "certificationRequests"), where("id", "==", requestId)));
        if (!requestSnap.empty) {
          const reqData = requestSnap.docs[0].data() as CertificationRequest;
          targetUserId = reqData.userId;
          artistName = reqData.artistName || "Artiste";

          if (status === "Approuvé") {
            const userRef = doc(db, "users", reqData.userId);
            const currentBadgesResult = await getDocs(query(collection(db, "users"), where("uid", "==", reqData.userId)));
            let currentBadges: string[] = [];
            if (!currentBadgesResult.empty) {
              const uData = currentBadgesResult.docs[0].data();
              currentBadges = uData.badges || [];
            }
            const updatedBadges = Array.from(new Set([...currentBadges, "🟢 Talent Certifié"]));
            await updateDoc(userRef, {
              verificationStatus: "certifie",
              badges: updatedBadges
            });
          } else if (status === "Refusé") {
            const userRef = doc(db, "users", reqData.userId);
            const currentBadgesResult = await getDocs(query(collection(db, "users"), where("uid", "==", reqData.userId)));
            let currentBadges: string[] = [];
            if (!currentBadgesResult.empty) {
              const uData = currentBadgesResult.docs[0].data();
              currentBadges = uData.badges || [];
            }
            const updatedBadges = currentBadges.filter(b => b !== "🟢 Talent Certifié");
            await updateDoc(userRef, {
              verificationStatus: "standard",
              badges: updatedBadges
            });
          }
        }
        triggerStorageEvent();
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour updateCertificationRequestStatus.", error);
        setIsFirebaseMock(true);
      }
    } else {
      const list: CertificationRequest[] = JSON.parse(localStorage.getItem("gombo_certification_requests") || "[]");
      const found = list.find(c => c.id === requestId);
      if (found) {
        found.status = status;
        localStorage.setItem("gombo_certification_requests", JSON.stringify(list));
        targetUserId = found.userId;
        artistName = found.artistName || "Artiste";
        
        // Update in localstorage profiles
        if (status === "Approuvé") {
          const uList: UserProfile[] = JSON.parse(localStorage.getItem("gombo_users") || "[]");
          const uIndex = uList.findIndex(u => u.uid === found.userId);
          if (uIndex !== -1) {
            const currentBadges = uList[uIndex].badges || [];
            uList[uIndex].badges = Array.from(new Set([...currentBadges, "🟢 Talent Certifié"]));
            uList[uIndex].verificationStatus = "certifie";
            localStorage.setItem("gombo_users", JSON.stringify(uList));
          }
        } else if (status === "Refusé") {
          const uList: UserProfile[] = JSON.parse(localStorage.getItem("gombo_users") || "[]");
          const uIndex = uList.findIndex(u => u.uid === found.userId);
          if (uIndex !== -1) {
            const currentBadges = uList[uIndex].badges || [];
            uList[uIndex].badges = currentBadges.filter(b => b !== "🟢 Talent Certifié");
            uList[uIndex].verificationStatus = "standard";
            localStorage.setItem("gombo_users", JSON.stringify(uList));
          }
        }
        triggerStorageEvent();
      }
    }

    // Trigger Notification & Activity entry across both branches
    try {
      if (targetUserId) {
        if (status === "Approuvé") {
          await this.sendNotification({
            userId: targetUserId,
            type: "certification_approved",
            title: "Félicitations ! Badge obtenu 💚",
            message: "Votre demande de certification a été APPROUVÉE par l'équipe ! Vous êtes désormais un Talent Certifié ⭐."
          });

          await this.publishActivity({
            type: "certification",
            title: "Dossier Approuvé ⭐",
            message: `${artistName} a officiellement obtenu son badge de Talent Certifié !`,
            userId: targetUserId,
            userName: artistName,
            targetId: targetUserId
          });
        } else if (status === "Refusé") {
          await this.sendNotification({
            userId: targetUserId,
            type: "general",
            title: "Statut Certification 🔴",
            message: "Votre demande de certification n'a pas été approuvée par nos administrateurs. Re-vérifiez vos démos de prestations."
          });
        }
      }
    } catch (notifErr) {
      console.error("Non-fatal certification auto notification fail:", notifErr);
    }
  },

  // ==========================================
  // --- Coin des Groupes Service (Phase 8) ---
  // ==========================================
  async getAllMusicGroups(): Promise<MusicGroup[]> {
    if (!isFirebaseMock && db) {
      try {
        const querySnapshot = await getDocs(collection(db, "music_groups"));
        const results: MusicGroup[] = [];
        querySnapshot.forEach((docSnap) => {
          results.push(docSnap.data() as MusicGroup);
        });
        return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour getAllMusicGroups.", error);
        setIsFirebaseMock(true);
      }
    }

    const list: MusicGroup[] = JSON.parse(localStorage.getItem("gombo_music_groups") || "[]");
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  listenAllMusicGroups(callback: (groups: MusicGroup[]) => void): () => void {
    if (!isFirebaseMock && db) {
      try {
        return onSnapshot(collection(db, "music_groups"), (snapshot) => {
          const results: MusicGroup[] = [];
          snapshot.forEach((docSnap) => {
            results.push(docSnap.data() as MusicGroup);
          });
          callback(results.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        }, (error) => {
          console.warn("⚠️ Erreur listenAllMusicGroups snapshot", error);
        });
      } catch (e) {
        console.warn("⚠️ Snapshot impossible, repli local", e);
      }
    }

    const handleLocalUpdate = () => {
      const list: MusicGroup[] = JSON.parse(localStorage.getItem("gombo_music_groups") || "[]");
      callback(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    };

    window.addEventListener("storage", handleLocalUpdate);
    window.addEventListener("gomboStorageChange", handleLocalUpdate);
    // Initial emission
    handleLocalUpdate();

    return () => {
      window.removeEventListener("storage", handleLocalUpdate);
      window.removeEventListener("gomboStorageChange", handleLocalUpdate);
    };
  },

  async publishMusicGroup(
    groupData: Omit<MusicGroup, "id" | "createdAt" | "viewsCount" | "favoritesCount" | "contactsCount" | "followers">
  ): Promise<MusicGroup> {
    const id = "group_" + Math.random().toString(36).substr(2, 9);
    const newGroup: MusicGroup = {
      ...groupData,
      id,
      viewsCount: 0,
      favoritesCount: 0,
      contactsCount: 0,
      followers: [],
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "groups", id), newGroup);
        await setDoc(doc(db, "music_groups", id), newGroup);

        // Also self-add creator as initial member in groupMembers
        const memberId = "mem_creator_" + id;
        const newMember = {
          id: memberId,
          groupId: id,
          userId: newGroup.creatorId,
          name: "Propriétaire",
          role: "Propriétaire",
          instrument: "Directeur",
          groupRole: "proprietaire",
          photoUrl: newGroup.logoUrl || newGroup.photoUrl || `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80`,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "groupMembers", memberId), newMember);

        // Append to members list of group
        const updatedMembers = [ { id: memberId, name: newMember.name, role: newMember.role, instrument: newMember.instrument, photoUrl: newMember.photoUrl } ];
        await setDoc(doc(db, "groups", id), { members: updatedMembers, membersCount: 1 }, { merge: true });
        await setDoc(doc(db, "music_groups", id), { members: updatedMembers, membersCount: 1 }, { merge: true });
        newGroup.members = updatedMembers;
        newGroup.membersCount = 1;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour publishMusicGroup.", error);
        setIsFirebaseMock(true);
      }
    }

    if (isFirebaseMock || !db) {
      const list: MusicGroup[] = JSON.parse(localStorage.getItem("gombo_music_groups") || "[]");
      
      const memberId = "mem_creator_" + id;
      const initialMember = {
        id: memberId,
        groupId: id,
        userId: newGroup.creatorId,
        name: "Propriétaire",
        role: "Propriétaire",
        instrument: "Directeur",
        groupRole: "proprietaire",
        photoUrl: newGroup.logoUrl || newGroup.photoUrl || `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80`,
        createdAt: new Date().toISOString()
      };
      
      const mList = JSON.parse(localStorage.getItem("gombo_group_members") || "[]");
      mList.push(initialMember);
      localStorage.setItem("gombo_group_members", JSON.stringify(mList));

      newGroup.members = [{
        id: memberId,
        name: initialMember.name,
        role: initialMember.role,
        instrument: initialMember.instrument,
        photoUrl: initialMember.photoUrl
      }];
      newGroup.membersCount = 1;

      list.push(newGroup);
      localStorage.setItem("gombo_music_groups", JSON.stringify(list));
      triggerStorageEvent();
    }

    // Publish to public Activity Feed when a music group is created
    try {
      await this.publishActivity({
        type: "groupe",
        title: "Nouveau Groupe Musik ! 📡",
        message: `Le groupe "${newGroup.name}" de ${newGroup.commune || "Abidjan"} vient de s'inscrire à l'annuaire VIP !`,
        userId: newGroup.creatorId,
        userName: newGroup.name,
        userAvatar: newGroup.logoUrl || newGroup.photoUrl || undefined,
        targetId: id
      });
    } catch (feedErr) {
      console.error("Non-fatal music group feed publish fail:", feedErr);
    }

    return newGroup;
  },

  async updateMusicGroup(id: string, updates: Partial<MusicGroup>): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "groups", id), updates, { merge: true });
        await setDoc(doc(db, "music_groups", id), updates, { merge: true });
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour updateMusicGroup.", error);
        setIsFirebaseMock(true);
      }
    }

    const list: MusicGroup[] = JSON.parse(localStorage.getItem("gombo_music_groups") || "[]");
    const idx = list.findIndex(g => g.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      localStorage.setItem("gombo_music_groups", JSON.stringify(list));
      triggerStorageEvent();
    }
  },

  async deleteMusicGroup(id: string): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await deleteDoc(doc(db, "groups", id));
        await deleteDoc(doc(db, "music_groups", id));
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour deleteMusicGroup.", error);
        setIsFirebaseMock(true);
      }
    }

    const list: MusicGroup[] = JSON.parse(localStorage.getItem("gombo_music_groups") || "[]");
    const filtered = list.filter(g => g.id !== id);
    localStorage.setItem("gombo_music_groups", JSON.stringify(filtered));
    triggerStorageEvent();
  },

  // NEW: Group membership and invitations
  async getGroupMembers(groupId: string): Promise<any[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(query(collection(db, "groupMembers"), where("groupId", "==", groupId)));
        return snap.docs.map(docSnap => docSnap.data());
      } catch (err) {
        console.warn("⚠️ getGroupMembers Firebase fallback:", err);
      }
    }
    const list = JSON.parse(localStorage.getItem("gombo_group_members") || "[]");
    return list.filter((m: any) => m.groupId === groupId);
  },

  async getGroupInvitations(groupId: string): Promise<any[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(query(collection(db, "groupInvitations"), where("groupId", "==", groupId)));
        return snap.docs.map(docSnap => docSnap.data());
      } catch (err) {
        console.warn("⚠️ getGroupInvitations Firebase fallback:", err);
      }
    }
    const list = JSON.parse(localStorage.getItem("gombo_group_invitations") || "[]");
    return list.filter((inv: any) => inv.groupId === groupId);
  },

  async getUserInvitations(userId: string): Promise<any[]> {
    if (!isFirebaseMock && db) {
      try {
        const snap = await getDocs(query(collection(db, "groupInvitations"), where("receiverId", "==", userId)));
        return snap.docs.map(docSnap => docSnap.data());
      } catch (err) {
        console.warn("⚠️ getUserInvitations Firebase fallback:", err);
      }
    }
    const list = JSON.parse(localStorage.getItem("gombo_group_invitations") || "[]");
    return list.filter((inv: any) => inv.receiverId === userId);
  },

  async createGroupInvitation(invitationData: { id: string; groupId: string; senderId: string; receiverId: string; status: "en_attente" | "acceptee" | "refusee"; role: string; instrument: string; createdAt: string }): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "groupInvitations", invitationData.id), invitationData);
        return;
      } catch (err) {
        console.warn("⚠️ createGroupInvitation Firebase fallback:", err);
      }
    }
    const list = JSON.parse(localStorage.getItem("gombo_group_invitations") || "[]");
    list.push(invitationData);
    localStorage.setItem("gombo_group_invitations", JSON.stringify(list));
    triggerStorageEvent();
  },

  async respondToGroupInvitation(invitationId: string, status: "acceptee" | "refusee"): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        const invRef = doc(db, "groupInvitations", invitationId);
        await setDoc(invRef, { status }, { merge: true });
        
        if (status === "acceptee") {
          const snap = await getDoc(invRef);
          if (snap.exists()) {
            const data = snap.data();
            // Fetch receiver name/info to register as member
            const userSnap = await getDoc(doc(db, "users", data.receiverId));
            const uName = userSnap.exists() ? `${userSnap.data().firstName} ${userSnap.data().lastName}` : "Artiste Invité";
            const uPhoto = userSnap.exists() ? userSnap.data().avatarUrl || userSnap.data().photoURL : undefined;
            
            const memberId = "mem_" + Math.random().toString(36).substr(2, 9);
            const newMember = {
              id: memberId,
              groupId: data.groupId,
              userId: data.receiverId,
              name: uName,
              role: data.role,
              instrument: data.instrument,
              groupRole: "membre",
              photoUrl: uPhoto || `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80`,
              createdAt: new Date().toISOString()
            };
            
            await setDoc(doc(db, "groupMembers", memberId), newMember);
            
            // Sync to the groups and music_groups collection array!
            const groupRef = doc(db, "groups", data.groupId);
            const groupSnap = await getDoc(groupRef);
            if (groupSnap.exists()) {
              const currentMembers = groupSnap.data().members || [];
              const updatedMembers = [...currentMembers, {
                id: memberId,
                name: uName,
                role: data.role,
                instrument: data.instrument,
                photoUrl: newMember.photoUrl
              }];
              await setDoc(groupRef, { members: updatedMembers, membersCount: updatedMembers.length }, { merge: true });
              await setDoc(doc(db, "music_groups", data.groupId), { members: updatedMembers, membersCount: updatedMembers.length }, { merge: true });
            }
          }
        }
        return;
      } catch (err) {
        console.warn("⚠️ respondToGroupInvitation Firebase error:", err);
      }
    }
    
    // Fallback Mock Storage
    const list = JSON.parse(localStorage.getItem("gombo_group_invitations") || "[]");
    const idx = list.findIndex((inv: any) => inv.id === invitationId);
    if (idx !== -1) {
      list[idx].status = status;
      localStorage.setItem("gombo_group_invitations", JSON.stringify(list));
      
      if (status === "acceptee") {
        const data = list[idx];
        const users = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
        const foundUser = users.find((u: any) => u.uid === data.receiverId);
        const uName = foundUser ? `${foundUser.firstName} ${foundUser.lastName}` : "Artiste Invité";
        const uPhoto = foundUser ? foundUser.avatarUrl || foundUser.photoURL : undefined;
        
        const memberId = "mem_" + Math.random().toString(36).substr(2, 9);
        const newMember = {
          id: memberId,
          groupId: data.groupId,
          userId: data.receiverId,
          name: uName,
          role: data.role,
          instrument: data.instrument,
          groupRole: "membre",
          photoUrl: uPhoto || `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80`,
          createdAt: new Date().toISOString()
        };
        
        const mList = JSON.parse(localStorage.getItem("gombo_group_members") || "[]");
        mList.push(newMember);
        localStorage.setItem("gombo_group_members", JSON.stringify(mList));
        
        // Sync to localStorage groups / music_groups
        const gList = JSON.parse(localStorage.getItem("gombo_music_groups") || "[]");
        const gIdx = gList.findIndex((g: any) => g.id === data.groupId);
        if (gIdx !== -1) {
          const currentMembers = gList[gIdx].members || [];
          gList[gIdx].members = [...currentMembers, {
            id: memberId,
            name: uName,
            role: data.role,
            instrument: data.instrument,
            photoUrl: newMember.photoUrl
          }];
          gList[gIdx].membersCount = gList[gIdx].members.length;
          localStorage.setItem("gombo_music_groups", JSON.stringify(gList));
        }
      }
      triggerStorageEvent();
    }
  },

  async addManualGroupMember(groupId: string, memberData: { id: string; name: string; role: string; instrument: string; photoUrl?: string }): Promise<void> {
    const memberId = memberData.id;
    const newMember = {
      id: memberId,
      groupId,
      name: memberData.name,
      role: memberData.role,
      instrument: memberData.instrument,
      groupRole: "membre",
      photoUrl: memberData.photoUrl || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?w=150&auto=format&fit=crop&q=80`,
      createdAt: new Date().toISOString()
    };
    
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "groupMembers", memberId), newMember);
        
        // Append to main group arrays
        const groupRef = doc(db, "groups", groupId);
        const snap = await getDoc(groupRef);
        if (snap.exists()) {
          const currentMembers = snap.data().members || [];
          const updatedMembers = [...currentMembers, {
            id: memberId,
            name: memberData.name,
            role: memberData.role,
            instrument: memberData.instrument,
            photoUrl: newMember.photoUrl
          }];
          await setDoc(groupRef, { members: updatedMembers, membersCount: updatedMembers.length }, { merge: true });
          await setDoc(doc(db, "music_groups", groupId), { members: updatedMembers, membersCount: updatedMembers.length }, { merge: true });
        }
        return;
      } catch (err) {
        console.warn("⚠️ addManualGroupMember Firebase error:", err);
      }
    }
    
    const mList = JSON.parse(localStorage.getItem("gombo_group_members") || "[]");
    mList.push(newMember);
    localStorage.setItem("gombo_group_members", JSON.stringify(mList));
    
    // Sync array inside music_groups in localstorage
    const gList = JSON.parse(localStorage.getItem("gombo_music_groups") || "[]");
    const gIdx = gList.findIndex((g: any) => g.id === groupId);
    if (gIdx !== -1) {
      const currentMembers = gList[gIdx].members || [];
      gList[gIdx].members = [...currentMembers, {
        id: memberId,
        name: memberData.name,
        role: memberData.role,
        instrument: memberData.instrument,
        photoUrl: newMember.photoUrl
      }];
      gList[gIdx].membersCount = gList[gIdx].members.length;
      localStorage.setItem("gombo_music_groups", JSON.stringify(gList));
    }
    triggerStorageEvent();
  },

  async removeGroupMember(groupId: string, memberId: string): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await deleteDoc(doc(db, "groupMembers", memberId));
        
        // Remove from main arrays
        const groupRef = doc(db, "groups", groupId);
        const snap = await getDoc(groupRef);
        if (snap.exists()) {
          const currentMembers = snap.data().members || [];
          const updated = currentMembers.filter((m: any) => m.id !== memberId);
          await setDoc(groupRef, { members: updated, membersCount: updated.length }, { merge: true });
          await setDoc(doc(db, "music_groups", groupId), { members: updated, membersCount: updated.length }, { merge: true });
        }
        return;
      } catch (err) {
        console.warn("⚠️ removeGroupMember Firebase error:", err);
      }
    }
    
    const mList = JSON.parse(localStorage.getItem("gombo_group_members") || "[]");
    const filteredM = mList.filter((m: any) => m.id !== memberId);
    localStorage.setItem("gombo_group_members", JSON.stringify(filteredM));
    
    // Remove from array inside music_groups in localStorage
    const gList = JSON.parse(localStorage.getItem("gombo_music_groups") || "[]");
    const gIdx = gList.findIndex((g: any) => g.id === groupId);
    if (gIdx !== -1) {
      const currentMembers = gList[gIdx].members || [];
      const updated = currentMembers.filter((m: any) => m.id !== memberId);
      gList[gIdx].members = updated;
      gList[gIdx].membersCount = updated.length;
      localStorage.setItem("gombo_music_groups", JSON.stringify(gList));
    }
    triggerStorageEvent();
  },

  async updateGroupMemberRole(groupId: string, memberId: string, newGroupRole: "proprietaire" | "administrateur" | "membre"): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "groupMembers", memberId), { groupRole: newGroupRole }, { merge: true });
        return;
      } catch (err) {
        console.warn("⚠️ updateGroupMemberRole Firebase error:", err);
      }
    }
    
    const mList = JSON.parse(localStorage.getItem("gombo_group_members") || "[]");
    const idx = mList.findIndex((m: any) => m.id === memberId);
    if (idx !== -1) {
      mList[idx].groupRole = newGroupRole;
      localStorage.setItem("gombo_group_members", JSON.stringify(mList));
      triggerStorageEvent();
    }
  },

  async incrementMusicGroupStat(id: string, stat: "viewsCount" | "contactsCount" | "favoritesCount", amount: number): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        const groupRef = doc(db, "music_groups", id);
        const snapshot = await getDoc(groupRef);
        if (snapshot.exists()) {
          const currentVal = snapshot.data()[stat] || 0;
          await updateDoc(groupRef, { [stat]: currentVal + amount });
          return;
        }
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour incrementMusicGroupStat.", error);
        setIsFirebaseMock(true);
      }
    }

    const list: MusicGroup[] = JSON.parse(localStorage.getItem("gombo_music_groups") || "[]");
    const idx = list.findIndex(g => g.id === id);
    if (idx !== -1) {
      const currentVal = list[idx][stat] || 0;
      list[idx] = { ...list[idx], [stat]: currentVal + amount };
      localStorage.setItem("gombo_music_groups", JSON.stringify(list));
      triggerStorageEvent();
    }
  },

  async toggleFollowMusicGroup(groupId: string, userId: string): Promise<boolean> {
    let followed = false;
    let groupMap: any = null;

    if (!isFirebaseMock && db) {
      try {
        const groupRef = doc(db, "music_groups", groupId);
        const snapshot = await getDoc(groupRef);
        if (snapshot.exists()) {
          groupMap = snapshot.data();
          const currentFollowers: string[] = groupMap.followers || [];
          let updatedFollowers: string[];
          if (currentFollowers.includes(userId)) {
            updatedFollowers = currentFollowers.filter(uid => uid !== userId);
            followed = false;
          } else {
            updatedFollowers = [...currentFollowers, userId];
            followed = true;
          }
          await updateDoc(groupRef, { 
            followers: updatedFollowers,
            favoritesCount: updatedFollowers.length 
          });
        }
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour toggleFollowMusicGroup.", error);
        setIsFirebaseMock(true);
      }
    }

    if (isFirebaseMock || !db) {
      const list: MusicGroup[] = JSON.parse(localStorage.getItem("gombo_music_groups") || "[]");
      const idx = list.findIndex(g => g.id === groupId);
      if (idx !== -1) {
        groupMap = list[idx];
        const currentFollowers = groupMap.followers || [];
        let updatedFollowers: string[];
        if (currentFollowers.includes(userId)) {
          updatedFollowers = currentFollowers.filter(uid => uid !== userId);
          followed = false;
        } else {
          updatedFollowers = [...currentFollowers, userId];
          followed = true;
        }
        list[idx] = { 
          ...list[idx], 
          followers: updatedFollowers,
          favoritesCount: updatedFollowers.length 
        };
        localStorage.setItem("gombo_music_groups", JSON.stringify(list));
        triggerStorageEvent();
      }
    }

    // Trigger Notification & Activity feed if followed is true
    if (followed && groupMap) {
      try {
        const followerProfile = await this.getUserProfile(userId);
        const followerName = followerProfile 
          ? `${followerProfile.firstName || ""} ${followerProfile.lastName || ""}`.trim() || followerProfile.artistName || "Un artiste"
          : "Un artiste";
        const groupCreatorId = groupMap.creatorId;
        const groupName = groupMap.name || "Groupe Musique";

        if (groupCreatorId && groupCreatorId !== userId) {
          await this.sendNotification({
            userId: groupCreatorId,
            type: "new_follower",
            title: "Nouvel Abonné ! 🤝",
            message: `${followerName} a commencé à suivre votre groupe Musik "${groupName}".`
          });
        }

        // Also publish to public Activity Feed
        await this.publishActivity({
          type: "groupe",
          title: "Nouveau fan de groupe ! 🚀",
          message: `${followerName} s'est abonné au groupe "${groupName}".`,
          userId: userId,
          userName: followerName,
          userAvatar: (followerProfile && followerProfile.avatarUrl) || undefined,
          targetId: groupId
        });
      } catch (notifErr) {
        console.error("Non-fatal follow notification fail:", notifErr);
      }
    }

    return followed;
  },

  async publishSupportMessage(messageData: {
    userId: string;
    email: string;
    subject: string;
    message: string;
    category: string;
  }): Promise<void> {
    const id = "sup_" + Math.random().toString(36).substr(2, 9);
    const docData = { ...messageData, id, createdAt: new Date().toISOString() };
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "support_messages", id), docData);
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour publishSupportMessage.", error);
        setIsFirebaseMock(true);
      }
    }
    const list = JSON.parse(localStorage.getItem("gombo_support_messages") || "[]");
    list.push(docData);
    localStorage.setItem("gombo_support_messages", JSON.stringify(list));
  },

  // --- NEW LEVEL 2 VERIFICATION REQUESTS ---
  async createVerificationRequest(reqData: {
    userId: string;
    userEmail: string;
    fullName: string;
    photoUrl: string;
    commune: string;
    metier: string;
    whatsapp: string;
    selfieUrl: string;
    mediaUrl: string;
  }): Promise<void> {
    const id = "req_" + Math.random().toString(36).substr(2, 9);
    const docData: VerificationRequest = {
      ...reqData,
      id,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "verificationRequests", id), docData);
        
        // Let's also update the verificationStatus and request field inside user profile
        await this.updateUserProfile(reqData.userId, {
          verificationStatus: "standard" // still level 1 google but we can store locally pending
        });
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour createVerificationRequest.", error);
        setIsFirebaseMock(true);
      }
    }
    const list = JSON.parse(localStorage.getItem("gombo_verification_requests") || "[]");
    list.push(docData);
    localStorage.setItem("gombo_verification_requests", JSON.stringify(list));
    localStorage.setItem(`gombo_verification_request_${reqData.userId}`, JSON.stringify(docData));
    
    // update local user profile
    await this.updateUserProfile(reqData.userId, {
      verificationStatus: "standard"
    });
  },

  async getVerificationRequestByUser(userId: string): Promise<VerificationRequest | null> {
    if (!isFirebaseMock && db) {
      try {
        const q = query(collection(db, "verificationRequests"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          return querySnapshot.docs[0].data() as VerificationRequest;
        }
        return null;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour getVerificationRequestByUser.", error);
      }
    }
    const req = localStorage.getItem(`gombo_verification_request_${userId}`);
    return req ? JSON.parse(req) as VerificationRequest : null;
  },

  async getAllVerificationRequests(): Promise<VerificationRequest[]> {
    if (!isFirebaseMock && db) {
      try {
        const querySnapshot = await getDocs(collection(db, "verificationRequests"));
        const results: VerificationRequest[] = [];
        querySnapshot.forEach((doc) => {
          results.push(doc.data() as VerificationRequest);
        });
        return results;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour getAllVerificationRequests.", error);
      }
    }
    return JSON.parse(localStorage.getItem("gombo_verification_requests") || "[]");
  },

  async updateVerificationRequestStatus(id: string, status: "approved" | "rejected"): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        const docRef = doc(db, "verificationRequests", id);
        await updateDoc(docRef, { status });

        // If approved, update the corresponding user's profile with Gombo ID level 2 status and badges
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const req = docSnap.data() as VerificationRequest;
          const userProfileRef = doc(db, "users", req.userId);
          const userProfileSnap = await getDoc(userProfileRef);
          if (userProfileSnap.exists()) {
            const userProfile = userProfileSnap.data() as UserProfile;
            const currentBadges = userProfile.badges || [];
            
            let updatedBadges = [...currentBadges];
            if (status === "approved") {
              if (!updatedBadges.includes("🏆 Talent Certifié")) {
                updatedBadges.push("🏆 Talent Certifié");
              }
              // Remove old Nouveau Talent if they had it
              updatedBadges = updatedBadges.filter(b => b !== "⚪ Nouveau Talent" && b !== "⚪ Nouveau");
            }

            await updateDoc(userProfileRef, {
              badges: updatedBadges,
              isCertified: status === "approved" ? true : userProfile.isCertified,
              specialty: req.metier || userProfile.specialty,
              commune: req.commune || userProfile.commune,
              whatsapp: req.whatsapp || userProfile.whatsapp
            });
          }
        }
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour updateVerificationRequestStatus.", error);
      }
    }

    // fallback simulation
    const list = JSON.parse(localStorage.getItem("gombo_verification_requests") || "[]") as VerificationRequest[];
    const index = list.findIndex(r => r.id === id);
    if (index !== -1) {
      list[index].status = status;
      localStorage.setItem("gombo_verification_requests", JSON.stringify(list));
      localStorage.setItem(`gombo_verification_request_${list[index].userId}`, JSON.stringify(list[index]));

      // update local user profile
      const userProfile = JSON.parse(localStorage.getItem(`gombo_profile_${list[index].userId}`) || "{}") as UserProfile;
      if (userProfile && userProfile.uid) {
        const currentBadges = userProfile.badges || [];
        let updatedBadges = [...currentBadges];
        if (status === "approved") {
          if (!updatedBadges.includes("🏆 Talent Certifié")) {
            updatedBadges.push("🏆 Talent Certifié");
          }
          updatedBadges = updatedBadges.filter(b => b !== "⚪ Nouveau Talent" && b !== "⚪ Nouveau");
        }
        userProfile.badges = updatedBadges;
        userProfile.isCertified = status === "approved" ? true : userProfile.isCertified;
        userProfile.specialty = list[index].metier;
        userProfile.commune = list[index].commune;
        userProfile.whatsapp = list[index].whatsapp;
        localStorage.setItem(`gombo_profile_${list[index].userId}`, JSON.stringify(userProfile));
      }
    }
  },

  // --- INTERNAL MESSAGING SYSTEM ---
  async getOrCreateConversation(user1Id: string, user2Id: string, user1Details: any, user2Details: any): Promise<string> {
    const participants = [user1Id, user2Id].sort();
    const convoId = `convo_${participants[0]}_${participants[1]}`;

    if (!isFirebaseMock && db) {
      try {
        const docRef = doc(db, "conversations", convoId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return convoId;
        }

        const convoData: Conversation = {
          id: convoId,
          participants,
          participantDetails: {
            [user1Id]: {
              name: user1Details.name || "Artiste",
              avatarUrl: user1Details.avatarUrl || user1Details.photoURL || "",
              role: user1Details.role || "musicien"
            },
            [user2Id]: {
              name: user2Details.name || "Artiste",
              avatarUrl: user2Details.avatarUrl || user2Details.photoURL || "",
              role: user2Details.role || "musicien"
            }
          },
          unreadCount: {
            [user1Id]: 0,
            [user2Id]: 0
          },
          lastMessage: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await setDoc(docRef, convoData);
        return convoId;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour getOrCreateConversation. Fallback local.", error);
      }
    }

    const convos = JSON.parse(localStorage.getItem("gombo_conversations") || "[]");
    let convo = convos.find((c: any) => c.id === convoId);
    if (!convo) {
      convo = {
        id: convoId,
        participants,
        participantDetails: {
          [user1Id]: {
            name: user1Details.name || "Artiste",
            avatarUrl: user1Details.avatarUrl || user1Details.photoURL || "",
            role: user1Details.role || "musicien"
          },
          [user2Id]: {
            name: user2Details.name || "Artiste",
            avatarUrl: user2Details.avatarUrl || user2Details.photoURL || "",
            role: user2Details.role || "musicien"
          }
        },
        unreadCount: {
          [user1Id]: 0,
          [user2Id]: 0
        },
        lastMessage: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      convos.push(convo);
      localStorage.setItem("gombo_conversations", JSON.stringify(convos));
      window.dispatchEvent(new Event("gomboConversationsChange"));
    }
    return convoId;
  },

  async sendMessage(convoId: string, senderId: string, senderName: string, text: string, type: "text" | "image" | "audio" = "text", mediaUrl?: string): Promise<void> {
    const msgId = "msg_" + Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();
    const msgData: Message = {
      id: msgId,
      conversationId: convoId,
      senderId,
      senderName,
      text,
      type,
      mediaUrl: mediaUrl || null,
      timestamp
    };

    if (!isFirebaseMock && db) {
      try {
        await setDoc(doc(db, "messages", msgId), msgData);

        // Update conversation lastMessage and unread count
        const convoRef = doc(db, "conversations", convoId);
        const convoSnap = await getDoc(convoRef);
        if (convoSnap.exists()) {
          const convo = convoSnap.data();
          const recipientId = convo.participants.find((p: string) => p !== senderId);
          const currentUnread = convo.unreadCount?.[recipientId] || 0;

          await setDoc(convoRef, {
            lastMessage: {
              text: type === "text" ? text : type === "image" ? "📷 Image" : "🎵 Message vocal",
              timestamp,
              senderId
            },
            unreadCount: {
              ...convo.unreadCount,
              [recipientId]: currentUnread + 1
            },
            updatedAt: timestamp
          }, { merge: true });

          // Trigger persistent platform notification
          if (recipientId) {
            await this.publishNotification({
              userId: recipientId,
              title: `Messagerie 💬`,
              message: `${senderName}: ${type === 'text' ? text.substring(0, 50) : type === 'image' ? 'Image' : 'Vocal'}`,
              type: "new_message",
              senderId,
              senderName,
              targetId: convoId
            });
          }
        }
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour sendMessage.", error);
      }
    }

    // Local Storage Mock Fallback
    const msgs = JSON.parse(localStorage.getItem("gombo_messages") || "[]");
    msgs.push(msgData);
    localStorage.setItem("gombo_messages", JSON.stringify(msgs));

    const convos = JSON.parse(localStorage.getItem("gombo_conversations") || "[]");
    const convoIndex = convos.findIndex((c: any) => c.id === convoId);
    if (convoIndex !== -1) {
      const convo = convos[convoIndex];
      const recipientId = convo.participants.find((p: string) => p !== senderId);
      convo.unreadCount = convo.unreadCount || {};
      convo.unreadCount[recipientId] = (convo.unreadCount[recipientId] || 0) + 1;
      convo.lastMessage = {
        text: type === "text" ? text : type === "image" ? "📷 Image" : "🎵 Message vocal",
        timestamp,
        senderId
      };
      convo.updatedAt = timestamp;
      localStorage.setItem("gombo_conversations", JSON.stringify(convos));
      window.dispatchEvent(new Event("gomboConversationsChange"));
    }
    window.dispatchEvent(new Event("gomboMessagesChange"));
  },

  listenConversations(userId: string, callback: (convos: Conversation[]) => void): () => void {
    if (!isFirebaseMock && db) {
      try {
        const q = query(collection(db, "conversations"), where("participants", "array-contains", userId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const list: Conversation[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as Conversation);
          });
          list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          callback(list);
        }, (error) => {
          console.warn("⚠️ listenConversations snapshot error:", error);
        });
        return unsubscribe;
      } catch (error) {
        console.warn("⚠️ listenConversations error:", error);
      }
    }

    const triggerLocal = () => {
      const convos = JSON.parse(localStorage.getItem("gombo_conversations") || "[]");
      const filtered = convos.filter((c: any) => c.participants.includes(userId));
      filtered.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      callback(filtered);
    };

    window.addEventListener("storage", triggerLocal);
    window.addEventListener("gomboConversationsChange", triggerLocal);
    triggerLocal();

    return () => {
      window.removeEventListener("storage", triggerLocal);
      window.removeEventListener("gomboConversationsChange", triggerLocal);
    };
  },

  listenMessages(convoId: string, callback: (msgs: Message[]) => void): () => void {
    if (!isFirebaseMock && db) {
      try {
        const q = query(collection(db, "messages"), where("conversationId", "==", convoId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const list: Message[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as Message);
          });
          list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          callback(list);
        }, (error) => {
          console.warn("⚠️ listenMessages snapshot error:", error);
        });
        return unsubscribe;
      } catch (error) {
        console.warn("⚠️ listenMessages error:", error);
      }
    }

    const triggerLocal = () => {
      const msgs = JSON.parse(localStorage.getItem("gombo_messages") || "[]");
      const filtered = msgs.filter((m: any) => m.conversationId === convoId);
      filtered.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      callback(filtered);
    };

    window.addEventListener("storage", triggerLocal);
    window.addEventListener("gomboMessagesChange", triggerLocal);
    triggerLocal();

    return () => {
      window.removeEventListener("storage", triggerLocal);
      window.removeEventListener("gomboMessagesChange", triggerLocal);
    };
  },

  async markConversationAsRead(convoId: string, userId: string): Promise<void> {
    if (!isFirebaseMock && db) {
      try {
        const docRef = doc(db, "conversations", convoId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const convo = docSnap.data();
          const unread = { ...(convo.unreadCount || {}) };
          unread[userId] = 0;
          await updateDoc(docRef, { unreadCount: unread });
        }
        return;
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible pour markConversationAsRead.", error);
      }
    }

    const convos = JSON.parse(localStorage.getItem("gombo_conversations") || "[]");
    const index = convos.findIndex((c: any) => c.id === convoId);
    if (index !== -1) {
      convos[index].unreadCount = convos[index].unreadCount || {};
      convos[index].unreadCount[userId] = 0;
      localStorage.setItem("gombo_conversations", JSON.stringify(convos));
      window.dispatchEvent(new Event("gomboConversationsChange"));
    }
  }
};
