import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  GithubAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser
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
  serverTimestamp,
  getDocFromServer,
  onSnapshot
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { UserProfile, Gombo, Application, Reservation, WaitingFeature, SocialPost, GomboNotification } from "./types";

// Setup and determine if using Real Firebase or Fallback Local Mock DB.
// Gombo Musik can fall back automatically if the credentials are the mock values or empty.
export let isFirebaseMock = true;
export let isFirebaseForceReal = false;
export let pendingSignUpProfile: UserProfile | null = null;

export function getPendingSignUpProfile(): UserProfile | null {
  return pendingSignUpProfile;
}

export function setPendingSignUpProfile(profile: UserProfile | null) {
  pendingSignUpProfile = profile;
}

export function setIsFirebaseMock(val: boolean) {
  if (val === true && isFirebaseForceReal) {
    console.warn("⚠️ Firestore operation failed, but Firebase was verified online. Restant en Mode production réel.");
    return;
  }
  isFirebaseMock = val;
  window.dispatchEvent(new Event("gomboFirebaseMockChange"));
}

let app;
let db: any = null;
let auth: any = null;

const GOOGLE_PROVIDER = new GoogleAuthProvider();
const FACEBOOK_PROVIDER = new FacebookAuthProvider();
const GITHUB_PROVIDER = new GithubAuthProvider();

try {
  // If we have a real non-mock projectId and active config, try to boot real Firebase
  if (
    firebaseConfig && 
    firebaseConfig.projectId && 
    firebaseConfig.projectId !== "gombo-musik-mock" &&
    !firebaseConfig.projectId.includes("YOUR_PROJECT_ID")
  ) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    // Handle either custom database ID (blueprint) or default database
    if ("firestoreDatabaseId" in firebaseConfig && (firebaseConfig as any).firestoreDatabaseId) {
      db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
      console.log("🔥 Successfully initialized real Firebase service with custom DB ID: " + (firebaseConfig as any).firestoreDatabaseId);
    } else {
      db = getFirestore(app);
      console.log("🔥 Successfully initialized real Firebase service using default DB");
    }
    auth = getAuth(app);
    isFirebaseMock = false;
  } else {
    console.log("ℹ️ Using local reactive storage engine (Firebase terms or keys not yet fully set up).");
  }
} catch (e) {
  console.error("⚠️ Firebase initialization fell back to mock mode:", e);
  isFirebaseMock = true;
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
        setIsFirebaseMock(true);
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
        isProfileComplete: true,
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
        throw new Error("Cet email est déjà enregistré !");
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
    if (!isFirebaseMock && auth) {
      const res = await signInWithPopup(auth, GOOGLE_PROVIDER);
      // Create user profile if not exists
      try {
        const uDoc = await getDoc(doc(db, "users", res.user.uid));
        if (!uDoc.exists()) {
          const names = res.user.displayName ? res.user.displayName.split(" ") : ["Artiste", "Showbiz"];
          const userProfile: UserProfile = {
            uid: res.user.uid,
            email: res.user.email || "",
            firstName: names[0],
            lastName: names.slice(1).join(" ") || "Ivoirien",
            phone: "+225 00 00 00 00",
            commune: "Cocody",
            role: "musicien", // default
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", res.user.uid), userProfile);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "users/" + res.user.uid);
      }
      return { uid: res.user.uid, email: res.user.email };
    } else {
      // Mock Google Login
      const mockGoogleEmails = ["star_mali@gombo.ci", "ivoire_dj@gombo.ci", "spectateur@gmail.com"];
      const randomEmail = mockGoogleEmails[Math.floor(Math.random() * mockGoogleEmails.length)];
      const randomId = "goog_" + Math.random().toString(36).substring(2, 9);
      
      const users: UserProfile[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
      let matched = users.find(u => u.email === randomEmail);
      if (!matched) {
        matched = {
          uid: randomId,
          email: randomEmail,
          firstName: "Artiste",
          lastName: "Google-Abidjan",
          commune: "Cocody",
          phone: "+225 07 00 11 22 33",
          role: "musicien",
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

  async loginWithFacebook() {
    if (!isFirebaseMock && auth) {
      const res = await signInWithPopup(auth, FACEBOOK_PROVIDER);
      // Create user profile if not exists
      try {
        const uDoc = await getDoc(doc(db, "users", res.user.uid));
        if (!uDoc.exists()) {
          const names = res.user.displayName ? res.user.displayName.split(" ") : ["Artiste", "Facebook"];
          const userProfile: UserProfile = {
            uid: res.user.uid,
            email: res.user.email || "",
            firstName: names[0],
            lastName: names.slice(1).join(" ") || "Ivoirien",
            phone: "+225 00 00 00 00",
            commune: "Cocody",
            role: "musicien", // default
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", res.user.uid), userProfile);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "users/" + res.user.uid);
      }
      return { uid: res.user.uid, email: res.user.email };
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
          commune: "Cocody",
          phone: "+225 05 00 99 88 77",
          role: "musicien",
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
    if (!isFirebaseMock && auth) {
      const res = await signInWithPopup(auth, GITHUB_PROVIDER);
      // Create user profile if not exists
      try {
        const uDoc = await getDoc(doc(db, "users", res.user.uid));
        if (!uDoc.exists()) {
          const names = res.user.displayName ? res.user.displayName.split(" ") : ["Artiste", "GitHub"];
          const userProfile: UserProfile = {
            uid: res.user.uid,
            email: res.user.email || "",
            firstName: names[0],
            lastName: names.slice(1).join(" ") || "Ivoirien",
            phone: "+225 00 00 00 00",
            commune: "Cocody",
            role: "musicien", // default
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", res.user.uid), userProfile);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "users/" + res.user.uid);
      }
      return { uid: res.user.uid, email: res.user.email };
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
          commune: "Cocody",
          phone: "+225 01 00 44 55 66",
          role: "musicien",
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

  async sendPasswordReset(email: string) {
    if (!isFirebaseMock && auth) {
      await sendPasswordResetEmail(auth, email);
    } else {
      console.log(`[MOCK RESET] Email envoyée à ${email}`);
    }
  },

  async signOut() {
    if (!isFirebaseMock && auth) {
      await firebaseSignOut(auth);
    } else {
      localStorage.removeItem(LOCAL_AUTH_KEY);
      window.dispatchEvent(new Event("gomboAuthChange"));
    }
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
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour getUserProfile.", error);
        setIsFirebaseMock(true);
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
      } catch (error) {
        console.warn("⚠️ Mode Firestore inaccessible. Repli sur le Bac à Sable Local pour updateUserProfile.", error);
        setIsFirebaseMock(true);
      }
    }
    const users: UserProfile[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
    const index = users.findIndex(u => u.uid === uid);
    if (index !== -1) {
      users[index] = { ...users[index], ...profile };
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      triggerStorageEvent();
      window.dispatchEvent(new Event("gomboUserProfileChange"));
    }
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

  async updateApplicationStatus(id: string, status: "en_attente" | "accepte" | "rejete"): Promise<void> {
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
    
    const posts: SocialPost[] = JSON.parse(localStorage.getItem("gombo_social_posts") || "[]");
    posts.unshift(newPost);
    localStorage.setItem("gombo_social_posts", JSON.stringify(posts));
    triggerStorageEvent();
    return newPost;
  },

  async updateSocialPost(id: string, updates: Partial<SocialPost>): Promise<void> {
    const posts: SocialPost[] = JSON.parse(localStorage.getItem("gombo_social_posts") || "[]");
    const idx = posts.findIndex(p => p.id === id);
    if (idx !== -1) {
      posts[idx] = { ...posts[idx], ...updates };
      localStorage.setItem("gombo_social_posts", JSON.stringify(posts));
      triggerStorageEvent();
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
  }
};
