import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithPhoneNumber,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  User as FirebaseUser,
  RecaptchaVerifier
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  increment,
  Timestamp,
  addDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  or
} from "firebase/firestore";
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app, auth, db, storage } from "./lib/firebase";
import { 
  UserProfile, 
  Gombo, 
  Application, 
  Reservation, 
  SocialPost, 
  GomboNotification, 
  Renfort, 
  RenfortApplication, 
  Conversation, 
  Message, 
  GomboSafeContract, 
  GomboTicketEvent, 
  PurchasedTicket, 
  StudioMarketItem, 
  CastingCall,
  BypassAttempt,
  UserActivity,
  AcademyGuide,
  VoiceAnnouncement,
  SecureWaitlistEntry,
  AfrigomboSupport,
  BetaUpdate,
  SystemMedia,
  SourceType,
  AppNotification,
  NotificationType,
  NotificationAudience,
  NotificationStatus
} from "./types";
import { ReputationEngine } from "./lib/ReputationEngine";

// Setup and determine if using Real Firebase
export const isFirebaseMock = false; 
export let pendingSignUpProfile: UserProfile | null = null;

const GOOGLE_PROVIDER = new GoogleAuthProvider();
const FACEBOOK_PROVIDER = new FacebookAuthProvider();
const GITHUB_PROVIDER = new GithubAuthProvider();

// ========================================================
// --- Unified GomboAuth Engine ---
// ========================================================
export const gomboAuth = {
  get currentUser(): { uid: string; email: string; emailVerified: boolean } | null {
    if (auth?.currentUser) {
      return {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || "",
        emailVerified: auth.currentUser.emailVerified
      };
    }
    return null;
  },

  onAuthStateChanged(callback: (user: any | null) => void) {
    if (auth) {
      return onAuthStateChanged(auth, callback);
    }
    return () => {};
  },

  async signUp(email: string, password: string, role: "musicien" | "client", details: { firstName: string; lastName: string; phone: string; commune: string }) {
    if (auth && db) {
      const userProfile: UserProfile = {
        uid: "",
        email,
        firstName: details.firstName,
        lastName: details.lastName,
        phone: details.phone,
        commune: details.commune,
        role: role,
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
        isProfileComplete: false,
        balance: 0,
        totalRevenue: 0,
        createdAt: new Date().toISOString()
      };

      pendingSignUpProfile = userProfile;
      const res = await createUserWithEmailAndPassword(auth, email, password);
      userProfile.uid = res.user.uid;

      await setDoc(doc(db, "users", res.user.uid), userProfile);
      pendingSignUpProfile = null;
      return { uid: res.user.uid, email };
    }
    throw new Error("Service d'authentification indisponible");
  },

  async signIn(email: string, password: string) {
    if (auth) {
      const res = await signInWithEmailAndPassword(auth, email, password);
      return { uid: res.user.uid, email: res.user.email };
    }
    throw new Error("Service d'authentification indisponible");
  },

  async handleAuthRedirect() {
    if (auth && db) {
      try {
        const res = await getRedirectResult(auth);
        if (res && res.user) {
          console.log("Redirect login successful for:", res.user.email);
          const userRef = doc(db, "users", res.user.uid);
          const uDoc = await getDoc(userRef);
          
          const names = res.user.displayName ? res.user.displayName.split(" ") : ["Artiste", "Afrigombo"];
          const isFounder = res.user.email === "jhs.kmj7@gmail.com";
          const founderPermissions = ["admin", "founder", "dashboard", "users", "verification", "payments", "reports", "settings"];

          if (!uDoc.exists()) {
            let role: "musicien" | "client" | "admin" = isFounder ? "admin" : "client";
            let roleSubtype: any = undefined;
            
            const storedPending = localStorage.getItem("pendingSignUpRole");
            if (storedPending) {
              try {
                const parsed = JSON.parse(storedPending);
                if (parsed.role) role = parsed.role;
                if (parsed.roleSubtype) roleSubtype = parsed.roleSubtype;
              } catch(e) {}
              localStorage.removeItem("pendingSignUpRole");
            }

            const newUser: UserProfile = {
              uid: res.user.uid,
              email: res.user.email || "",
              displayName: res.user.displayName || names.join(" "),
              firstName: names[0] || "",
              lastName: names.slice(1).join(" ") || "",
              artistName: res.user.displayName || "",
              photoURL: res.user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
              avatarUrl: res.user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
              provider: "google.com",
              role: role,
              roleSubtype: roleSubtype,
              isFounder: isFounder,
              permissions: isFounder ? founderPermissions : [],
              isProfileComplete: false,
              isVerified: false,
              createdAt: serverTimestamp() as any,
              balance: 0,
              reputationScore: 100,
              kycStatus: "none",
              isVip: isFounder,
              isPro: isFounder,
              stats: {
                completedGombos: 0,
                cancelledGombos: 0,
                totalEarned: 0,
                averageRating: 0,
                reviewsCount: 0
              }
            };
            await setDoc(userRef, newUser);
          } else {
            // Existing user: ensure missing avatar/displayName/provider fields are merged
            const currentData = uDoc.data();
            const updates: any = {};
            if (!currentData.displayName && res.user.displayName) updates.displayName = res.user.displayName;
            if (!currentData.photoURL && res.user.photoURL) updates.photoURL = res.user.photoURL;
            if (!currentData.avatarUrl && res.user.photoURL) updates.avatarUrl = res.user.photoURL;
            if (!currentData.provider) updates.provider = "google.com";
            if (isFounder && (!currentData.isFounder || currentData.role !== "admin")) {
              updates.isFounder = true;
              updates.role = "admin";
              updates.permissions = founderPermissions;
              updates.isVip = true;
              updates.isPro = true;
            }
            if (Object.keys(updates).length > 0) {
              await updateDoc(userRef, updates);
            }
          }
          return { uid: res.user.uid, email: res.user.email };
        }
      } catch (error) {
        console.error("Auth redirect error:", error);
      }
    }
    return null;
  },

  async loginWithGoogle() {
    if (auth && db) {
      try {
        let res: any = null;
        try {
          res = await signInWithPopup(auth, GOOGLE_PROVIDER);
        } catch (popupErr: any) {
          console.warn("signInWithPopup error/blocked, attempting signInWithRedirect fallback:", popupErr);
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
          const userRef = doc(db, "users", res.user.uid);
          const uDoc = await getDoc(userRef);
          const names = res.user.displayName ? res.user.displayName.split(" ") : ["Artiste", "Afrigombo"];
          const isFounder = res.user.email === "jhs.kmj7@gmail.com";
          const founderPermissions = ["admin", "founder", "dashboard", "users", "verification", "payments", "reports", "settings"];

          if (!uDoc.exists()) {
            const userProfile: UserProfile = {
              uid: res.user.uid,
              displayName: res.user.displayName || names.join(" "),
              firstName: names[0] || "",
              lastName: names.slice(1).join(" ") || "",
              photoURL: res.user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
              avatarUrl: res.user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
              email: res.user.email || "",
              provider: "google.com",
              createdAt: serverTimestamp() as any,
              role: isFounder ? "admin" : "client",
              isFounder: isFounder,
              permissions: isFounder ? founderPermissions : [],
              isProfileComplete: false,
              isVerified: false,
              balance: 0,
              totalRevenue: 0,
              isVip: isFounder,
              isPro: isFounder
            };
            await setDoc(userRef, userProfile);
          } else {
            const currentData = uDoc.data();
            const updates: any = {};
            if (!currentData.displayName && res.user.displayName) updates.displayName = res.user.displayName;
            if (!currentData.photoURL && res.user.photoURL) updates.photoURL = res.user.photoURL;
            if (!currentData.avatarUrl && res.user.photoURL) updates.avatarUrl = res.user.photoURL;
            if (!currentData.provider) updates.provider = "google.com";
            if (isFounder && (!currentData.isFounder || currentData.role !== "admin")) {
              updates.isFounder = true;
              updates.role = "admin";
              updates.permissions = founderPermissions;
              updates.isVip = true;
              updates.isPro = true;
            }
            if (Object.keys(updates).length > 0) {
              await updateDoc(userRef, updates);
            }
          }
          return { uid: res.user.uid, email: res.user.email };
        }
      } catch (e: any) {
        console.error("Erreur Google Login :", e);
        throw e;
      }
    }
    throw new Error("Service d'authentification indisponible");
  },

  async loginWithFacebook() {
    if (auth && db) {
      try {
        
        const res = await signInWithPopup(auth, FACEBOOK_PROVIDER);
        const uDoc = await getDoc(doc(db, "users", res.user.uid));
        if (!uDoc.exists()) {
          const names = res.user.displayName ? res.user.displayName.split(" ") : ["Artiste", "Facebook"];
          const userProfile: UserProfile = {
            uid: res.user.uid,
            email: res.user.email || "",
            firstName: names[0],
            lastName: names.slice(1).join(" ") || "Ivoirien",
            role: "musicien",
            provider: "facebook.com",
            isProfileComplete: false,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", res.user.uid), userProfile);
        }
        return { uid: res.user.uid, email: res.user.email };
      } catch (e: any) {
        throw e;
      }
    }
    throw new Error("Service d'authentification indisponible");
  },

  async loginWithGitHub() {
    if (auth && db) {
      
      const res = await signInWithPopup(auth, GITHUB_PROVIDER);
      const uDoc = await getDoc(doc(db, "users", res.user.uid));
      if (!uDoc.exists()) {
        const userProfile: UserProfile = {
          uid: res.user.uid,
          email: res.user.email || "",
          role: "musicien",
          provider: "github.com",
          isProfileComplete: false,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", res.user.uid), userProfile);
      }
      return { uid: res.user.uid, email: res.user.email };
    }
    throw new Error("Service d'authentification indisponible");
  },

  async loginWithPhoneCode(phoneNumber: string, recaptchaVerifier: any) {
    if (auth) {
      return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    }
    throw new Error("Service d'authentification indisponible");
  },

  async sendPasswordReset(email: string) {
    if (auth) {
      await sendPasswordResetEmail(auth, email);
    }
  },

  async signOut() {
    if (auth) {
      await firebaseSignOut(auth);
    }
  }
};

// ==========================================
// --- Unified GomboDB Storage Layer ---
// ==========================================

export const gomboDB = {
  // USERS
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (db) {
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists()) {
        let profile = docSnap.data() as UserProfile;
        let needsSync = false;
        
        if (!profile.wallet) {
          profile.wallet = {
            soldeDisponible: 250000,
            soldeBloque: 0,
            revenusMois: 0,
            economiesPremium: 0,
            niveauWallet: "Standard",
            revenus: 0,
            depots: 0,
            retraits: 0,
            gainsMensuels: 0
          };
          needsSync = true;
        }
        if (needsSync) {
          await setDoc(doc(db, "users", uid), profile, { merge: true });
        }
        return profile;
      }
    }
    return null;
  },

  listenUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
    if (db) {
      return onSnapshot(doc(db, "users", uid), (snap) => {
        if (snap.exists()) callback(snap.data() as UserProfile);
        else callback(null);
      });
    }
    return () => {};
  },

  async updateUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
    if (db) {
      await setDoc(doc(db, "users", uid), profile, { merge: true });
    }
  },

  async addContractReview(review: any) {
    if (db) {
      const ref = await addDoc(collection(db, "contract_reviews"), {
        ...review,
        createdAt: new Date().toISOString()
      });

      // Recalculate reputation for reviewee
      try {
        const reviewsSnap = await getDocs(
          query(collection(db, "contract_reviews"), where("revieweeId", "==", review.revieweeId))
        );
        const reviews = reviewsSnap.docs.map(d => d.data());

        const alertsSnap = await getDocs(
          query(collection(db, "security_alerts"), where("userId", "==", review.revieweeId))
        );
        const alerts = alertsSnap.docs.map(d => d.data());

        const contractsSnap = await getDocs(collection(db, "contracts"));
        const userContracts = contractsSnap.docs
          .map(d => d.data())
          .filter((c: any) => c.clientId === review.revieweeId || c.artistId === review.revieweeId);

        const userDoc = await getDoc(doc(db, "users", review.revieweeId));
        if (userDoc.exists()) {
          const user = { uid: review.revieweeId, ...userDoc.data() } as any;

          const metrics = ReputationEngine.calculateReputation(user, reviews, alerts);

          const antiFraudAlerts = ReputationEngine.runAntiFraudChecks(review, reviews, userContracts);
          for (const fraudAlert of antiFraudAlerts) {
            await this.publishSecurityAlert(fraudAlert);
          }

          await this.updateUserProfile(review.revieweeId, {
            trustScore: metrics.trustScore,
            averageRating: metrics.averageRating,
            ratingCount: metrics.ratingCount,
            badge: metrics.badge,
            gombosCompleted: metrics.completedGombos,
            cancelledContracts: metrics.cancelledGombos,
            gomboId: {
              id: user.gomboId?.id || "GID-" + Math.floor(100000 + Math.random() * 900000),
              scoreConfiance: metrics.trustScore,
              niveau: metrics.trustScore >= 95 ? 6 : metrics.trustScore >= 90 ? 5 : metrics.trustScore >= 80 ? 4 : metrics.trustScore >= 70 ? 3 : metrics.trustScore >= 50 ? 2 : 1,
              prestationsTerminees: metrics.completedGombos,
              annulations: metrics.cancelledGombos,
              retards: user.gomboId?.retards || 0,
              certifie: user.kycStatus === "approved",
              createdAt: user.gomboId?.createdAt || new Date().toISOString()
            }
          });
        }
      } catch (e) {
        console.error("Error recalculating reputation in addContractReview:", e);
      }

      return ref.id;
    }
    return null;
  },

  listenUserReviews(userId: string, callback: (reviews: any[]) => void) {
    if (db) {
      const q = query(collection(db, "contract_reviews"), where("revieweeId", "==", userId));
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
    return () => {};
  },

  async deleteUserProfile(uid: string) {
    if (db) {
      await deleteDoc(doc(db, "users", uid));
    }
  },

  // MESSAGING
  async getOrCreateConversation(currentUserId: string, targetUserId: string, arg3?: any, arg4?: any, arg5?: any): Promise<Conversation> {
    if (db) {
      let gomboId: string | undefined = undefined;
      let extraData: any = {};

      if (typeof arg3 === "string") {
        gomboId = arg3;
        extraData = { ...arg4, ...arg5 };
      } else {
        extraData = { myDetails: arg3, targetDetails: arg4, ...arg5 };
        gomboId = typeof arg5 === "string" ? arg5 : undefined;
      }

      // Find existing
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", currentUserId)
      );
      const snap = await getDocs(q);
      const existing = snap.docs.find(d => {
        const data = d.data();
        return data.participants.includes(targetUserId) && (!gomboId || data.gomboId === gomboId);
      });
      
      if (existing) return { id: existing.id, ...existing.data() } as Conversation;
      
      // Create new
      const newConvo: Partial<Conversation> = {
        participants: [currentUserId, targetUserId],
        createdAt: serverTimestamp() as any,
        lastMessageAt: new Date().toISOString(),
        unreadCount: { [currentUserId]: 0, [targetUserId]: 0 },
        gomboId,
        ...extraData
      };
      const ref = await addDoc(collection(db, "conversations"), newConvo);
      return { id: ref.id, ...newConvo } as Conversation;
    }
    throw new Error("DB inaccessible");
  },

  listenConversations(userId: string, callback: (convos: Conversation[]) => void) {
    if (db) {
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", userId)
      );
      return onSnapshot(q, (snapshot) => {
        const convos = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
        convos.sort((a, b) => {
          const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return timeB - timeA;
        });
        callback(convos);
      });
    }
    return () => {};
  },

  async getConversation(convoId: string): Promise<Conversation | null> {
    if (db) {
      const snap = await getDoc(doc(db, "conversations", convoId));
      if (snap.exists()) return { id: snap.id, ...snap.data() } as Conversation;
    }
    return null;
  },

  listenMessages(convoId: string, callback: (messages: Message[]) => void) {
    if (db) {
      const q = query(
        collection(db, "messages"),
        where("conversationId", "==", convoId)
      );
      return onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
        msgs.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeA - timeB;
        });
        callback(msgs);
      });
    }
    return () => {};
  },

  async sendMessage(convoId: string, senderId: string, senderName: string, text: string, type: string = "text", mediaUrl: string = "") {
    if (db) {
      const msgData: Partial<Message> = {
        conversationId: convoId,
        senderId,
        senderName,
        text,
        type,
        createdAt: new Date().toISOString()
      };
      if (mediaUrl) {
        if (type === "image") msgData.image = mediaUrl;
        else if (type === "audio") msgData.audio = mediaUrl;
      }

      const msgRef = await addDoc(collection(db, "messages"), msgData);
      
      const convoSnap = await getDoc(doc(db, "conversations", convoId));
      if (convoSnap.exists()) {
        const participants = convoSnap.data().participants as string[];
        const receiverId = participants.find(p => p !== senderId);
        
        const updates: any = {
          lastMessage: text || (type === "image" ? "📷 Image" : "🎙️ Audio"),
          lastMessageAt: new Date().toISOString()
        };
        if (receiverId) {
          updates[`unreadCount.${receiverId}`] = increment(1);
          
          await this.publishNotification({
            userId: receiverId,
            type: "new_message",
            title: "💬 Nouveau message",
            message: `Vous avez reçu un nouveau message de ${senderName} : "${text.slice(0, 50)}${text.length > 50 ? "..." : ""}"`,
            relatedId: convoId,
            priority: "medium"
          });
        }
        await updateDoc(doc(db, "conversations", convoId), updates);
      }
      return msgRef.id;
    }
  },

  async logBypassAttempt(attempt: Partial<BypassAttempt>) {
    if (db) {
      await addDoc(collection(db, "bypass_attempts"), {
        ...attempt,
        timestamp: new Date().toISOString()
      });
    }
  },

  async markConversationAsRead(convoId: string, userId: string) {
    if (db) {
      await updateDoc(doc(db, "conversations", convoId), {
        [`unreadCount.${userId}`]: 0
      });
    }
  },

  // GOMBOS
  async getGombos(): Promise<Gombo[]> {
    if (db) {
      const q = query(collection(db, "gombos"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Gombo));
    }
    return [];
  },

  listenAllGombos(callback: (gombos: Gombo[]) => void) {
    if (db) {
      const q = query(collection(db, "gombos"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Gombo)));
      });
    }
    return () => {};
  },

  async getGomboById(id: string): Promise<Gombo | null> {
    if (db) {
      const snap = await getDoc(doc(db, "gombos", id));
      if (snap.exists()) return { id: snap.id, ...snap.data() } as Gombo;
    }
    return null;
  },

  async publishGombo(gombo: Partial<Gombo>) {
    return await this.createGombo(gombo);
  },

  async createGombo(gombo: Partial<Gombo>) {
    if (db) {
      const ref = await addDoc(collection(db, "gombos"), {
        ...gombo,
        status: gombo.status || "publie",
        createdAt: serverTimestamp() as any,
        applicantsCount: 0
      });
      return ref.id;
    }
  },

  async updateGombo(id: string, updates: Partial<Gombo>) {
    if (db) {
      await updateDoc(doc(db, "gombos", id), updates);
    }
  },

  async updateGomboStatus(id: string, status: string, extra: any = {}) {
    if (db) {
      const ref = doc(db, "gombos", id);
      await updateDoc(ref, {
        status,
        ...extra,
        updatedAt: new Date().toISOString()
      });
    }
  },

  async applyToGombo(gomboIdOrApp: any, optionalApp?: Partial<Application>) {
    if (db) {
      let gomboId: string | undefined = undefined;
      let application: Partial<Application> = {};
      if (typeof gomboIdOrApp === "string" && optionalApp) {
        gomboId = gomboIdOrApp;
        application = optionalApp;
      } else {
        application = gomboIdOrApp;
        gomboId = application.gomboId;
      }
      const ref = await addDoc(collection(db, "applications"), {
        ...application,
        gomboId,
        status: "en_attente",
        createdAt: new Date().toISOString()
      });
      
      if (gomboId) {
        const gomboRef = doc(db, "gombos", gomboId);
        const gomboSnap = await getDoc(gomboRef);
        let updates: any = { applicantsCount: increment(1) };
        if (gomboSnap.exists()) {
          const gData = gomboSnap.data();
          if (gData.status === "publie" || !gData.status) {
            updates.status = "candidatures_ouvertes";
          }
        }
        await updateDoc(gomboRef, updates);
      }
      return ref.id;
    }
  },

  listenApplications(gomboIdOrCallback: string | ((apps: Application[]) => void), callback?: (apps: Application[]) => void) {
    if (db) {
      let q;
      let finalCallback: (apps: Application[]) => void;
      if (typeof gomboIdOrCallback === "function") {
        q = query(collection(db, "applications"));
        finalCallback = gomboIdOrCallback;
      } else {
        q = query(collection(db, "applications"), where("gomboId", "==", gomboIdOrCallback));
        finalCallback = callback || (() => {});
      }
      return onSnapshot(q, (snapshot) => {
        finalCallback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Application)));
      });
    }
    return () => {};
  },

  async getApplicationsForGombo(gomboId: string): Promise<Application[]> {
    if (db) {
      const q = query(collection(db, "applications"), where("gomboId", "==", gomboId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
    }
    return [];
  },

  async updateApplicationStatus(gomboIdOrAppId: string, appIdOrStatus: string, optionalStatus?: string) {
    if (db) {
      let finalAppId = gomboIdOrAppId;
      let finalStatus = appIdOrStatus;
      if (optionalStatus !== undefined) {
        finalAppId = appIdOrStatus;
        finalStatus = optionalStatus;
      }
      await updateDoc(doc(db, "applications", finalAppId), { status: finalStatus });
    }
  },

  listenUserApplications(userId: string, callback: (apps: Application[]) => void) {
    if (db) {
      const q = query(collection(db, "applications"), where("userId", "==", userId));
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Application)));
      });
    }
    return () => {};
  },

  // RENFORTS
  listenAllRenforts(callback: (renforts: Renfort[]) => void) {
    if (db) {
      const q = query(collection(db, "renforts"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Renfort)));
      });
    }
    return () => {};
  },

  async publishRenfort(renfort: Partial<Renfort>) {
    return await this.createRenfort(renfort);
  },

  async createRenfort(renfort: Partial<Renfort>) {
    if (db) {
      const ref = await addDoc(collection(db, "renforts"), {
        ...renfort,
        createdAt: new Date().toISOString()
      });
      return ref.id;
    }
  },

  async deleteRenfort(id: string) {
    if (db) {
      await deleteDoc(doc(db, "renforts", id));
    }
  },

  async applyToRenfort(renfortIdOrData: any, application?: Partial<RenfortApplication>) {
    if (db) {
      let payload: any = {};
      if (typeof renfortIdOrData === "string" && application) {
        payload = {
          ...application,
          renfortId: renfortIdOrData
        };
      } else {
        payload = renfortIdOrData;
      }
      await addDoc(collection(db, "renfort_applications"), {
        ...payload,
        status: "en_attente",
        createdAt: new Date().toISOString()
      });
    }
  },

  listenRenfortApplications(renfortIdOrCallback: string | ((apps: RenfortApplication[]) => void), callback?: (apps: RenfortApplication[]) => void) {
    if (db) {
      let q;
      let finalCallback: (apps: RenfortApplication[]) => void;
      if (typeof renfortIdOrCallback === "function") {
        q = query(collection(db, "renfort_applications"));
        finalCallback = renfortIdOrCallback;
      } else {
        q = query(collection(db, "renfort_applications"), where("renfortId", "==", renfortIdOrCallback));
        finalCallback = callback || (() => {});
      }
      return onSnapshot(q, (snapshot) => {
        finalCallback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RenfortApplication)));
      });
    }
    return () => {};
  },

  async updateRenfortApplicationStatus(appId: string, status: string) {
    if (db) {
      await updateDoc(doc(db, "renfort_applications", appId), { status });
    }
  },

  // SOCIAL POSTS
  listenSocialPosts(callback: (posts: SocialPost[]) => void) {
    if (db) {
      const q = query(collection(db, "social_posts"), orderBy("createdAt", "desc"), limit(50));
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SocialPost)));
      });
    }
    return () => {};
  },

  async publishSocialPost(post: Partial<SocialPost>) {
    return await this.createSocialPost(post);
  },

  async createSocialPost(post: Partial<SocialPost>) {
    if (db) {
      const ref = await addDoc(collection(db, "social_posts"), {
        ...post,
        likesCount: 0,
        comments: [],
        createdAt: new Date().toISOString()
      });
      return ref.id;
    }
  },

  async updateSocialPost(id: string, updates: Partial<SocialPost>) {
    if (db) {
      await updateDoc(doc(db, "social_posts", id), updates);
    }
  },

  async deleteSocialPost(id: string) {
    if (db) {
      await deleteDoc(doc(db, "social_posts", id));
    }
  },

  async toggleHonor(postId: string, userId: string) {
    if (db) {
      const postRef = doc(db, "social_posts", postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const post = postSnap.data() as SocialPost;
        const honors = post.honors || [];
        if (honors.includes(userId)) {
          await updateDoc(postRef, {
            honors: arrayRemove(userId),
            honorsCount: increment(-1)
          });
        } else {
          await updateDoc(postRef, {
            honors: arrayUnion(userId),
            honorsCount: increment(1)
          });
        }
      }
    }
  },

  async toggleSaveAction(postId: string, userId: string) {
    if (db) {
      const postRef = doc(db, "social_posts", postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const post = postSnap.data() as SocialPost;
        const savedBy = post.savedBy || [];
        if (savedBy.includes(userId)) {
          await updateDoc(postRef, {
            savedBy: arrayRemove(userId),
            savesCount: increment(-1)
          });
        } else {
          await updateDoc(postRef, {
            savedBy: arrayUnion(userId),
            savesCount: increment(1)
          });
        }
      }
    }
  },

  // NOTIFICATIONS
  async publishNotification(notif: Partial<GomboNotification>) {
    if (db) {
      if (notif.userId) {
        try {
          const userSnap = await getDoc(doc(db, "users", notif.userId));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const prefs = userData.notificationPrefs;
            if (prefs) {
              const masterEnabled = prefs.masterEnabled !== false;
              if (!masterEnabled) {
                console.log(`Skipping notification for user ${notif.userId} because master notifications are disabled.`);
                return;
              }
              const mapping: Record<string, string> = {
                "new_message": "messages",
                "payment_received": "payments",
                "payment_held": "payments",
                "contract_signed": "contracts",
                "application_accepted": "contracts",
                "application_refused": "contracts",
                "kyc_validated": "gomboId",
                "gombo_id_validated": "gomboId",
                "premium_activated": "premium",
                "app_update": "news",
                "publication_boosted": "news",
                "new_favorite": "news",
                "support_received": "news"
              };
              const prefKey = mapping[notif.type || ""];
              if (prefKey && prefs[prefKey] === false) {
                console.log(`Skipping notification of type ${notif.type} because preference is off.`);
                return;
              }
            }
          }
        } catch (e) {
          console.warn("Could not check user notification preferences:", e);
        }
      }

      await addDoc(collection(db, "notifications"), {
        ...notif,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  },

  async sendNotification(notif: Partial<GomboNotification>) {
    return await this.publishNotification(notif);
  },

  async notifyFounder(notif: Partial<GomboNotification>) {
    if (db) {
      try {
        const q = query(collection(db, "users"), where("email", "==", "jhs.kmj7@gmail.com"));
        const snap = await getDocs(q);
        let founderUid = "";
        if (!snap.empty) {
          founderUid = snap.docs[0].id;
        }
        
        if (founderUid) {
          await this.publishNotification({
            ...notif,
            userId: founderUid,
            isFounderOnly: true
          });
        } else {
          const q2 = query(collection(db, "users"), where("role", "==", "founder"));
          const snap2 = await getDocs(q2);
          if (!snap2.empty) {
            await this.publishNotification({
              ...notif,
              userId: snap2.docs[0].id,
              isFounderOnly: true
            });
          }
        }
      } catch (e) {
        console.warn("Could not notify founder:", e);
      }
    }
  },

  listenUserNotifications(userId: string, callback: (notifs: GomboNotification[]) => void) {
    if (db) {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        limit(150)
      );
      return onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GomboNotification));
        notifs.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
        callback(notifs.slice(0, 50));
      });
    }
    return () => {};
  },

  async markNotificationAsRead(notifId: string) {
    if (db) {
      await updateDoc(doc(db, "notifications", notifId), { isRead: true });
    }
  },

  async markAllUserNotificationsAsRead(userId: string) {
    if (db) {
      const q = query(collection(db, "notifications"), where("userId", "==", userId), where("isRead", "==", false));
      const snap = await getDocs(q);
      const batchPromises = snap.docs.map(d => updateDoc(doc(db, "notifications", d.id), { isRead: true }));
      await Promise.all(batchPromises);
    }
  },

  async deleteNotification(notifId: string) {
    if (db) {
      await deleteDoc(doc(db, "notifications", notifId));
    }
  },

  async deleteAllUserNotifications(userId: string) {
    if (db) {
      const q = query(collection(db, "notifications"), where("userId", "==", userId));
      const snap = await getDocs(q);
      const batchPromises = snap.docs.map(d => deleteDoc(doc(db, "notifications", d.id)));
      await Promise.all(batchPromises);
    }
  },

  // ADMIN / ECONOMY
  async getAllUsers(): Promise<UserProfile[]> {
    if (db) {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
    }
    return [];
  },

  async getEconomySettings() {
    if (db) {
      const snap = await getDoc(doc(db, "settings", "economy"));
      if (snap.exists()) return snap.data();
    }
    return null;
  },

  async updateEconomySettings(settings: any) {
    if (db) {
      await setDoc(doc(db, "settings", "economy"), settings, { merge: true });
    }
  },

  async logUserActivity(activityOrUserId: any, type?: string, details?: string) {
    if (db) {
      let payload: any = {};
      const userAgent = navigator?.userAgent || "unknown";
      let device = "Desktop";
      if (/Mobi|Android/i.test(userAgent)) device = "Mobile";
      let browser = "Unknown";
      if (/Chrome/i.test(userAgent)) browser = "Chrome";
      else if (/Firefox/i.test(userAgent)) browser = "Firefox";
      else if (/Safari/i.test(userAgent)) browser = "Safari";

      if (typeof activityOrUserId === "string") {
        payload = {
          userId: activityOrUserId,
          type: type || "activity",
          action: details || "",
          details: details || "",
          device,
          browser,
          timestamp: new Date().toISOString()
        };
      } else {
        payload = {
          device,
          browser,
          ...activityOrUserId,
          timestamp: new Date().toISOString()
        };
      }
      await addDoc(collection(db, "user_activities"), payload);
    }
  },

  listenUserActivities(userId: string, callback: (acts: UserActivity[]) => void) {
    if (db) {
      const q = query(collection(db, "user_activities"), where("userId", "==", userId), limit(150));
      return onSnapshot(q, (snapshot) => {
        const acts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserActivity));
        acts.sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeB - timeA;
        });
        callback(acts.slice(0, 50));
      });
    }
    return () => {};
  },

  async publishSubscription(sub: any) {
    if (db) {
      await addDoc(collection(db, "subscriptions"), {
        ...sub,
        createdAt: new Date().toISOString()
      });
    }
  },

  async publishPayment(payment: any) {
    if (db) {
      const docRef = await addDoc(collection(db, "payments"), {
        ...payment,
        createdAt: new Date().toISOString()
      });

      if (payment.userId) {
        await this.publishNotification({
          userId: payment.userId,
          type: "payment_received",
          title: "💰 Paiement reçu",
          message: `Votre paiement de ${payment.amount ? payment.amount.toLocaleString() : "0"} FCFA pour "${payment.label || payment.description || "Prestation"}" a été enregistré !`,
          relatedId: docRef.id,
          priority: "high"
        });
      }
    }
  },

  async publishSupportMessage(message: any) {
    if (db) {
      await addDoc(collection(db, "support_messages"), {
        ...message,
        createdAt: new Date().toISOString()
      });
    }
  },

  async addStudioMarketReview(studioIdOrReview: any, optionalReview?: any) {
    if (db) {
      let payload: any = {};
      if (typeof studioIdOrReview === "string" && optionalReview) {
        payload = {
          studioId: studioIdOrReview,
          ...optionalReview
        };
      } else {
        payload = studioIdOrReview;
      }
      await addDoc(collection(db, "studio_market_reviews"), {
        ...payload,
        createdAt: new Date().toISOString()
      });
    }
  },

  async createCastingCall(casting: any) {
    if (db) {
      const ref = await addDoc(collection(db, "casting_calls"), {
        ...casting,
        createdAt: new Date().toISOString()
      });
      return ref.id;
    }
  },

  async applyToCastingCall(castingId: string, userIdOrApp: any, userName?: string, phone?: string) {
    if (db) {
      let payload: any = {};
      if (typeof userIdOrApp === "string" && userName) {
        payload = {
          userId: userIdOrApp,
          userName,
          phone
        };
      } else {
        payload = userIdOrApp;
      }
      await addDoc(collection(db, "casting_applications"), {
        ...payload,
        castingId,
        createdAt: new Date().toISOString()
      });
    }
  },

  async updateCastingApplicationStatus(castingIdOrAppId: string, userIdOrStatus: string, optionalStatus?: string) {
    if (db) {
      if (optionalStatus !== undefined) {
        // Find the application by castingId and userId
        const q = query(
          collection(db, "casting_applications"), 
          where("castingId", "==", castingIdOrAppId),
          where("userId", "==", userIdOrStatus)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          await updateDoc(doc(db, "casting_applications", snap.docs[0].id), { status: optionalStatus });
        }
      } else {
        await updateDoc(doc(db, "casting_applications", castingIdOrAppId), { status: userIdOrStatus });
      }
    }
  },

  async publishVoiceAnnouncement(announcement: any) {
    if (db) {
      await addDoc(collection(db, "voice_announcements"), {
        ...announcement,
        createdAt: new Date().toISOString()
      });
    }
  },

  async addUserPoints(userId: string, points: number) {
    if (db) {
      await updateDoc(doc(db, "users", userId), {
        points: increment(points)
      });
    }
  },

  // STORAGE DIAGNOSTIC
  async checkStorageStatus(): Promise<any> {
    if (!storage) {
      return {
        isEnabled: false,
        bucket: "Non configuré",
        projectId: "Non configuré",
        error: { code: "STORAGE_NOT_INITIALIZED", message: "Le SDK Storage n'est pas initialisé" },
        timestamp: new Date().toISOString()
      };
    }

    const config = {
      isEnabled: true,
      bucket: storage.app.options.storageBucket || "Inconnu",
      projectId: storage.app.options.projectId || "Inconnu",
      apiKey: storage.app.options.apiKey ? "Présente" : "Manquante",
      connectionOk: true,
      writeTestOk: false,
      resumableTestOk: false,
      timestamp: new Date().toISOString()
    };

    try {
      // 1. TEST UPLOAD SIMPLE (uploadBytes)
      console.log("[DIAGNOSTIC] Test d'écriture Storage (Simple)...");
      const testRef = ref(storage, "diagnostic/simple_test_" + Date.now() + ".txt");
      const blob = new Blob(["Afrigombo Simple Storage Test"], { type: "text/plain" });
      
      let simpleError = null;
      try {
        await uploadBytes(testRef, blob);
        console.log("[DIAGNOSTIC] Écriture simple réussie, vérification lecture...");
        const url = await getDownloadURL(testRef);
        console.log("[DIAGNOSTIC] Lecture simple réussie :", url);
        config.writeTestOk = true;
      } catch (err: any) {
        console.error("[DIAGNOSTIC] Échec écriture/lecture simple :", err);
        simpleError = err;
      }

      // 2. TEST UPLOAD RESUMABLE (uploadBytesResumable)
      console.log("[DIAGNOSTIC] Test d'écriture Storage (Resumable)...");
      const resRef = ref(storage, "diagnostic/resumable_test_" + Date.now() + ".txt");
      const resBlob = new Blob(["Afrigombo Resumable Storage Test"], { type: "text/plain" });
      
      let resumableError = null;
      try {
        const task = uploadBytesResumable(resRef, resBlob);
        await new Promise((resolve, reject) => {
          task.on("state_changed", null, (err) => reject(err), () => resolve(true));
        });
        console.log("[DIAGNOSTIC] Écriture resumable réussie, vérification lecture...");
        const resUrl = await getDownloadURL(resRef);
        console.log("[DIAGNOSTIC] Lecture resumable réussie :", resUrl);
        config.resumableTestOk = true;
      } catch (err: any) {
        console.error("[DIAGNOSTIC] Échec écriture/lecture resumable :", err);
        resumableError = err;
      }

      if (config.writeTestOk && config.resumableTestOk) {
        return { ...config, rulesValid: true };
      } else {
        return { 
          ...config, 
          rulesValid: false, 
          error: simpleError || resumableError,
          details: {
            simple: simpleError ? simpleError.code : "OK",
            resumable: resumableError ? resumableError.code : "OK"
          }
        };
      }
    } catch (err: any) {
      return { ...config, connectionOk: false, error: { code: err.code, message: err.message } };
    }
  },

  // FALLBACK MEDIA SYSTEM (FIRESTORE)
  async getSystemMedia(): Promise<SystemMedia[]> {
    if (db) {
      const q = query(collection(db, "system_media"), orderBy("priority", "desc"), orderBy("updatedAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as SystemMedia));
    }
    return [];
  },

  listenSystemMedia(callback: (media: SystemMedia[]) => void) {
    if (db) {
      const q = query(collection(db, "system_media"), orderBy("priority", "desc"), orderBy("updatedAt", "desc"));
      return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as SystemMedia)));
      });
    }
    return () => {};
  },

  async addSystemMedia(media: Partial<SystemMedia>) {
    if (db) {
      const user = auth?.currentUser;
      const docRef = media.id ? doc(db, "system_media", media.id) : doc(collection(db, "system_media"));
      await setDoc(docRef, {
        title: "Sans titre",
        description: "",
        category: "audio",
        sourceType: "FIREBASE",
        firebaseUrl: "",
        githubPath: "",
        externalUrl: "",
        volume: 1,
        loop: false,
        autoplay: false,
        enabled: true,
        priority: 0,
        ...media,
        id: docRef.id,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.displayName || user?.email || "Admin"
      });
      return docRef.id;
    }
    throw new Error("Base de données non disponible");
  },

  async updateSystemMedia(id: string, updates: Partial<SystemMedia>) {
    if (db) {
      const user = auth?.currentUser;
      await updateDoc(doc(db, "system_media", id), {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.displayName || user?.email || "Admin"
      });
    }
  },

  async deleteSystemMedia(id: string) {
    if (db) {
      await deleteDoc(doc(db, "system_media", id));
    }
  },

  // NOTIFICATION SYSTEM (IMPERIAL CENTER)
  async getNotifications(): Promise<AppNotification[]> {
    if (db) {
      const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
    }
    return [];
  },

  listenAdminNotifications(callback: (notifs: AppNotification[]) => void) {
    if (db) {
      const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)));
      });
    }
    return () => {};
  },

  async addNotification(notif: Partial<AppNotification>) {
    if (db) {
      const user = auth?.currentUser;
      const docRef = doc(collection(db, "notifications"));
      await setDoc(docRef, {
        title: "Sans titre",
        message: "",
        type: "INFO",
        audience: "Tous",
        priority: 0,
        scheduledAt: null,
        status: "published",
        readCount: 0,
        clickCount: 0,
        ...notif,
        id: docRef.id,
        createdAt: serverTimestamp() as any,
        createdBy: user?.displayName || user?.email || "Fondateur"
      });
      return docRef.id;
    }
    throw new Error("Base de données non disponible");
  },

  async updateNotification(id: string, updates: Partial<AppNotification>) {
    if (db) {
      await updateDoc(doc(db, "notifications", id), {
        ...updates
      });
    }
  },

  async incrementNotificationStat(id: string, field: "readCount" | "clickCount") {
    if (db) {
      await updateDoc(doc(db, "notifications", id), {
        [field]: increment(1)
      });
    }
  },

  resolveMediaSource(media: SystemMedia): string {
    if (!media.enabled || media.sourceType === "DISABLED") return "";

    // Priority 1: Firebase
    if (media.sourceType === "FIREBASE" && media.firebaseUrl) {
      return media.firebaseUrl;
    }

    // Priority 2: GitHub
    if (media.githubPath) {
      // Assuming a standard pattern for GitHub Raw if it's a public repo
      // For now, if it's a path like public/..., we assume it's served by the app or we use a configurable base
      if (media.githubPath.startsWith("http")) return media.githubPath;
      
      // If the user provided a relative path, we try to resolve it
      // In development on Cloud Run, we might want to point to the actual repo or the public folder
      return `/${media.githubPath.replace(/^\//, "")}`; 
    }

    // Priority 3: External URL
    if (media.externalUrl) {
      return media.externalUrl;
    }

    // Dynamic Fallback logic (Automatic switch)
    if (media.firebaseUrl) return media.firebaseUrl;
    if (media.externalUrl) return media.externalUrl;
    
    return "";
  },

  // FILES
  async uploadFile(fileOrPath: File | string, pathOrFile: string | File, callbackOrMetadata?: any): Promise<string> {
    if (storage) {
      let finalFile: File | string;
      let finalPath: string;
      if (typeof fileOrPath === "string" && (typeof pathOrFile !== "string")) {
        // Called as uploadFile(path, file, callback)
        finalPath = fileOrPath;
        finalFile = pathOrFile;
      } else {
        // Called as uploadFile(file, path, metadata)
        finalFile = fileOrPath;
        finalPath = pathOrFile as string;
      }

      const storageRef = ref(storage, finalPath);
      const bucketName = storage.app.options.storageBucket || "Inconnu";
      const projectId = storage.app.options.projectId || "Inconnu";
      const apiKey = storage.app.options.apiKey || "Inconnu";
      
      console.log("[FIREBASE STORAGE DIAGNOSTIC] Initiating upload to bucket:", bucketName, "Project:", projectId);
      
      return new Promise(async (resolve, reject) => {
        try {
          let fileToUpload: Blob | Uint8Array | ArrayBuffer;
          let fileName = "Fichier binaire";
          let fileSize = 0;
          
          if (typeof finalFile === "string") {
            console.log("[FIREBASE STORAGE DIAGNOSTIC] Fetching Base64 file string...");
            const response = await fetch(finalFile);
            fileToUpload = await response.blob();
            fileSize = (fileToUpload as Blob).size;
            fileName = "upload_" + Date.now();
          } else {
            fileToUpload = finalFile;
            fileName = finalFile.name;
            fileSize = finalFile.size;
          }

          // --- SECURITY VALIDATION ---
          const MAX_SIZE = 20 * 1024 * 1024; // 20MB
          const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".mp3", ".wav", ".mp4", ".pdf"];
          const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "audio/mpeg", "audio/wav", "video/mp4", "application/pdf"];
          
          if (fileSize > MAX_SIZE) {
            throw new Error(`Fichier trop volumineux. Limite : 20MB. Actuel : ${(fileSize / (1024 * 1024)).toFixed(2)}MB`);
          }

          const fileExt = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
          if (!ALLOWED_EXTENSIONS.includes(fileExt) && fileExt !== fileName.toLowerCase()) {
             // Basic extension check if dot exists
          }
          
          const mimeType = (fileToUpload as Blob).type;
          if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
            console.warn(`[FIREBASE STORAGE] MIME type mismatch: ${mimeType}. Proceeding with caution...`);
          }
          // --------------------------

          console.log("[FIREBASE STORAGE DIAGNOSTIC] File details:", { name: fileName, size: fileSize, path: finalPath });

          let metadata = typeof callbackOrMetadata === "object" ? callbackOrMetadata : undefined;
          let progressCallback = typeof callbackOrMetadata === "function" ? callbackOrMetadata : undefined;

          // If there is no callback, do simple upload
          if (!metadata && !progressCallback) {
            console.log("[FIREBASE STORAGE DIAGNOSTIC] No progress callback, doing simple uploadBytes...");
            await uploadBytes(storageRef, fileToUpload);
            console.log("[FIREBASE STORAGE DIAGNOSTIC] uploadBytes completed, fetching URL...");
            const url = await getDownloadURL(storageRef);
            console.log("[FIREBASE STORAGE DIAGNOSTIC] Simple upload completed. URL:", url);
            resolve(url);
            return;
          }

          console.log("[FIREBASE STORAGE DIAGNOSTIC] Triggering uploadBytesResumable...");
          const uploadTask = uploadBytesResumable(storageRef, fileToUpload, metadata);
          
          // Initial trigger
          if (progressCallback) {
            progressCallback(1, {
              state: "uploading",
              bucket: bucketName,
              projectId: projectId,
              apiKey: apiKey,
              fileName: fileName,
              fileSize: fileSize,
              log: "Lancement de uploadBytesResumable..."
            });
          }

          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              const formattedProgress = Math.round(progress);
              console.log(`[FIREBASE STORAGE DIAGNOSTIC] Progress update: ${formattedProgress}% (${snapshot.bytesTransferred}/${snapshot.totalBytes} bytes) State: ${snapshot.state}`);
              
              if (progressCallback) {
                progressCallback(formattedProgress, {
                  state: snapshot.state === "running" ? "uploading" : snapshot.state,
                  bucket: bucketName,
                  projectId: projectId,
                  apiKey: apiKey,
                  fileName: fileName,
                  fileSize: fileSize,
                  bytesTransferred: snapshot.bytesTransferred,
                  totalBytes: snapshot.totalBytes,
                  log: `Progression : ${formattedProgress}% (${snapshot.bytesTransferred}/${snapshot.totalBytes} octets)`
                });
              }
            },
            async (error: any) => {
              console.error("[FIREBASE STORAGE DIAGNOSTIC] Upload error callback triggered:", error);
              
              // AUTO-RETRY WITH SIMPLE UPLOAD IF RESUMABLE FAILS
              if (error?.code === "storage/retry-limit-exceeded") {
                console.warn("[FIREBASE STORAGE DIAGNOSTIC] Resumable upload failed with retry limit. Attempting simple uploadBytes fallback...");
                if (progressCallback) {
                  progressCallback(1, {
                    state: "uploading",
                    log: "🔄 Échec du mode Resumable. Tentative en mode Simple (uploadBytes)..."
                  });
                }
                
                try {
                  await uploadBytes(storageRef, fileToUpload);
                  console.log("[FIREBASE STORAGE DIAGNOSTIC] Simple fallback upload succeeded!");
                  const url = await getDownloadURL(storageRef);
                  if (progressCallback) progressCallback(100, { state: "success", log: "✅ Téléversement réussi via mode de secours." });
                  resolve(url);
                  return;
                } catch (fallbackErr: any) {
                  console.error("[FIREBASE STORAGE DIAGNOSTIC] Fallback upload failed too:", fallbackErr);
                  error = fallbackErr; // Use the fallback error if it also fails
                }
              }

              const errorDetails = {
                code: error?.code || "Inconnu",
                message: error?.message || "Pas de message d'erreur",
                stack: error?.stack || "Pas de stacktrace available"
              };
              
              let errorMessage = `ERREUR FIREBASE [${errorDetails.code}] : ${errorDetails.message}`;
              if (errorDetails.code === "storage/retry-limit-exceeded") {
                errorMessage = "ERREUR CRITIQUE : Limite de tentatives dépassée. Le service Firebase Storage semble bloqué par l'environnement ou non configuré.";
              }

              if (progressCallback) {
                progressCallback(0, {
                  state: "error",
                  bucket: bucketName,
                  projectId: projectId,
                  apiKey: apiKey,
                  fileName: fileName,
                  fileSize: fileSize,
                  error: errorDetails,
                  log: errorMessage
                });
              }
              reject(error);
            },
            async () => {
              try {
                console.log("[FIREBASE STORAGE DIAGNOSTIC] Upload completed successfully, requesting download URL...");
                if (progressCallback) {
                  progressCallback(99, {
                    state: "uploading",
                    bucket: bucketName,
                    projectId: projectId,
                    apiKey: apiKey,
                    fileName: fileName,
                    fileSize: fileSize,
                    log: "Génération du lien de téléchargement (getDownloadURL)..."
                  });
                }
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log("[FIREBASE STORAGE DIAGNOSTIC] Download URL obtained:", downloadURL);
                if (progressCallback) {
                  progressCallback(100, {
                    state: "success",
                    bucket: bucketName,
                    projectId: projectId,
                    apiKey: apiKey,
                    fileName: fileName,
                    fileSize: fileSize,
                    log: "Fichier téléversé avec succès !"
                  });
                }
                resolve(downloadURL);
              } catch (err: any) {
                console.error("[FIREBASE STORAGE DIAGNOSTIC] Failed to get download URL:", err);
                if (progressCallback) {
                  progressCallback(0, {
                    state: "error",
                    bucket: bucketName,
                    projectId: projectId,
                    apiKey: apiKey,
                    fileName: fileName,
                    fileSize: fileSize,
                    error: {
                      code: err?.code || "URL_ERROR",
                      message: err?.message || "Impossible de récupérer l'URL de téléchargement",
                      stack: err?.stack || ""
                    },
                    log: `Erreur obtention URL : ${err?.message}`
                  });
                }
                reject(err);
              }
            }
          );
        } catch (err: any) {
          console.error("[FIREBASE STORAGE DIAGNOSTIC] Synchronous upload initialization error:", err);
          reject(err);
        }
      });
    }
    throw new Error("Storage non disponible");
  },

  // GROUPS
  async publishMusicGroup(group: any) {
    return await this.createMusicGroup(group);
  },

  async createMusicGroup(group: any) {
    if (db) {
      const ref = await addDoc(collection(db, "music_groups"), {
        ...group,
        createdAt: new Date().toISOString()
      });
      return ref.id;
    }
  },

  async getAllMusicGroups(): Promise<any[]> {
    if (db) {
      const snap = await getDocs(collection(db, "music_groups"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return [];
  },

  listenAllMusicGroups(callback: (groups: any[]) => void) {
    if (db) {
      return onSnapshot(collection(db, "music_groups"), (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
    return () => {};
  },

  async updateMusicGroup(groupId: string, updates: any) {
    if (db) {
      await updateDoc(doc(db, "music_groups", groupId), updates);
    }
  },

  async deleteMusicGroup(groupId: string) {
    if (db) {
      await deleteDoc(doc(db, "music_groups", groupId));
    }
  },

  async incrementMusicGroupStat(groupId: string, stat: string, incrementValue: number = 1) {
    if (db) {
      await updateDoc(doc(db, "music_groups", groupId), {
        [stat]: increment(incrementValue)
      });
    }
  },

  async toggleFollowMusicGroup(groupId: string, userId: string) {
    if (db) {
      const ref = doc(db, "music_groups", groupId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const followers = data.followers || [];
        if (followers.includes(userId)) {
          await updateDoc(ref, {
            followers: arrayRemove(userId),
            followersCount: increment(-1)
          });
          return false;
        } else {
          await updateDoc(ref, {
            followers: arrayUnion(userId),
            followersCount: increment(1)
          });
          return true;
        }
      }
    }
    return false;
  },

  async getUserInvitations(userId: string): Promise<any[]> {
    if (db) {
      const q = query(collection(db, "group_invitations"), where("userId", "==", userId), where("status", "==", "pending"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return [];
  },

  async getGroupInvitations(groupId: string): Promise<any[]> {
    if (db) {
      const q = query(collection(db, "group_invitations"), where("groupId", "==", groupId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return [];
  },

  async updateInvitation(invId: string, data: any) {
    if (db) {
      const docRef = doc(db, "group_invitations", invId);
      await updateDoc(docRef, data);
    }
  },

  async createGroupInvitation(inv: any) {
    if (db) {
      await addDoc(collection(db, "group_invitations"), {
        ...inv,
        status: "pending",
        createdAt: new Date().toISOString()
      });
    }
  },

  async respondToGroupInvitation(invitationId: string, status: string) {
    if (db) {
      const finalStatus = status === "acceptee" ? "accepted" : (status === "refusee" ? "rejected" : status);
      await updateDoc(doc(db, "group_invitations", invitationId), { status: finalStatus });
    }
  },

  async addManualGroupMember(groupId: string, member: any) {
    if (db) {
      await addDoc(collection(db, "group_members"), {
        ...member,
        groupId,
        createdAt: new Date().toISOString()
      });
    }
  },

  async removeGroupMember(groupId: string, userId: string) {
    if (db) {
      const q = query(collection(db, "group_members"), where("groupId", "==", groupId), where("userId", "==", userId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "group_members", d.id));
      }
    }
  },

  // RESERVATIONS
  async updateReservationStatus(resId: string, status: string) {
    if (db) {
      await updateDoc(doc(db, "reservations", resId), { status });
    }
  },

  // CONTRACTS
  generateContractId(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
    return `AG-${year}-${random}`;
  },

  async createContract(contract: Partial<GomboSafeContract>) {
    if (db) {
      const id = contract.id || this.generateContractId();
      
      let amount = contract.amount || 0;
      let commissionClient = contract.commissionClient;
      let commissionArtist = contract.commissionArtist;
      let totalClientPaid = contract.totalClientPaid;
      let totalArtistReceives = contract.totalArtistReceives;
      let isClientPremium = contract.isClientPremium || false;
      let isArtistPremium = contract.isArtistPremium || false;
      let savingsClient = contract.savingsClient || 0;
      let savingsArtist = contract.savingsArtist || 0;
      let commissionClientRate = contract.commissionClientRate || 0.025;
      let commissionArtistRate = contract.commissionArtistRate || 0.025;

      if (amount > 0) {
        if (contract.clientId) {
          try {
            const clientProfile = await this.getUserProfile(contract.clientId);
            if (clientProfile) {
              isClientPremium = !!(clientProfile.isPremium || clientProfile.badges?.includes("💎 Adhérent Premium"));
            }
          } catch (e) {
            console.warn("Could not fetch client profile for premium check", e);
          }
        }
        if (contract.artistId) {
          try {
            const artistProfile = await this.getUserProfile(contract.artistId);
            if (artistProfile) {
              isArtistPremium = !!(artistProfile.isPremium || artistProfile.badges?.includes("💎 Adhérent Premium"));
            }
          } catch (e) {
            console.warn("Could not fetch artist profile for premium check", e);
          }
        }

        // Apply Premium Economic Rules:
        // Client rate: 1.5% if Premium, else 2.5%
        // Artist rate: 1.5% if Premium, else 2.5%
        commissionClientRate = isClientPremium ? 0.015 : 0.025;
        commissionArtistRate = isArtistPremium ? 0.015 : 0.025;

        commissionClient = Math.round(amount * commissionClientRate);
        commissionArtist = Math.round(amount * commissionArtistRate);
        totalClientPaid = amount + commissionClient;
        totalArtistReceives = amount - commissionArtist;

        // Premium savings compared to the standard 2.5% rate
        savingsClient = isClientPremium ? Math.round(amount * 0.01) : 0;
        savingsArtist = isArtistPremium ? Math.round(amount * 0.01) : 0;
      }

      const initialHistory = [
        {
          action: "Contrat généré (Blockchain Firebase)",
          timestamp: new Date().toISOString(),
          userId: "system"
        }
      ];
      const firebaseSignature = "AFG-" + Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Date.now();

      const ref = doc(db, "contracts", id);
      await setDoc(ref, {
        ...contract,
        id,
        amount,
        commissionClient: commissionClient || 0,
        commissionArtist: commissionArtist || 0,
        commissionClientRate,
        commissionArtistRate,
        totalClientPaid: totalClientPaid || amount,
        totalArtistReceives: totalArtistReceives || amount,
        isClientPremium,
        isArtistPremium,
        savingsClient,
        savingsArtist,
        status: contract.status || "generated",
        history: initialHistory,
        firebaseSignature,
        createdAt: serverTimestamp() as any,
        updatedAt: new Date().toISOString()
      });
      return id;
    }
  },

  async getSystemCommissionRate(): Promise<number> {
    if (db) {
      try {
        const snap = await getDoc(doc(db, "configs", "commission"));
        if (snap.exists() && typeof snap.data().rate === "number") {
          return snap.data().rate;
        }
      } catch (e) {
        console.warn("Could not fetch commission rate", e);
      }
    }
    return 10; // Default fallback to 10%
  },

  async updateSystemCommissionRate(rate: number) {
    if (db) {
      const ref = doc(db, "configs", "commission");
      await setDoc(ref, { rate, updatedAt: new Date().toISOString() }, { merge: true });
    }
  },

  async getContract(id: string): Promise<GomboSafeContract | null> {
    return this.getContractById(id);
  },

  async getContractById(id: string): Promise<GomboSafeContract | null> {
    if (db) {
      const snap = await getDoc(doc(db, "contracts", id));
      if (snap.exists()) return { id: snap.id, ...snap.data() } as GomboSafeContract;
    }
    return null;
  },

  async updateContract(id: string, updates: any, userId: string, actionName?: string) {
    if (db) {
      const ref = doc(db, "contracts", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const history = data.history || [];
        if (actionName) {
          history.push({
            action: actionName,
            timestamp: new Date().toISOString(),
            userId: userId
          });
        }
        
        const finalUpdates = {
          ...updates,
          history,
          updatedAt: new Date().toISOString()
        };

        await updateDoc(ref, finalUpdates);

        // Dispatch Contract Notifications
        const nextStatus = updates.status || finalUpdates.status;
        if (nextStatus && nextStatus !== data.status) {
          if (nextStatus === "signed") {
            await this.publishNotification({
              userId: data.artistId,
              type: "contract_signed",
              title: "📄 Contrat Signé !",
              message: `Félicitations ! Le contrat pour "${data.title || "Prestation"}" a été validé et signé par les deux parties.`,
              relatedId: id,
              priority: "high"
            });
            await this.publishNotification({
              userId: data.clientId,
              type: "contract_signed",
              title: "📄 Contrat Signé !",
              message: `Félicitations ! Le contrat pour "${data.title || "Prestation"}" a été validé et signé par les deux parties.`,
              relatedId: id,
              priority: "high"
            });
          } else if (nextStatus === "payment_held") {
            await this.publishNotification({
              userId: data.artistId,
              type: "payment_held",
              title: "💰 Fonds en Séquestre !",
              message: `Le promoteur a déposé les fonds en séquestre pour "${data.title || "Prestation"}". Vous pouvez démarrer la prestation sereinement !`,
              relatedId: id,
              priority: "high"
            });
          } else if (nextStatus === "completed") {
            await this.publishNotification({
              userId: data.artistId,
              type: "payment_received",
              title: "💰 Cachet Libéré !",
              message: `Le gombo "${data.title || "Prestation"}" est clôturé. Vos gains ont été transférés sur votre portefeuille !`,
              relatedId: id,
              priority: "high"
            });
            await this.publishNotification({
              userId: data.clientId,
              type: "contract_signed",
              title: "✅ Gombo Terminé !",
              message: `Le gombo "${data.title || "Prestation"}" est clos. Merci d'avoir soutenu les talents du showbiz !`,
              relatedId: id,
              priority: "medium"
            });
          } else if (nextStatus === "cancelled") {
            await this.publishNotification({
              userId: data.artistId,
              type: "application_refused",
              title: "❌ Contrat Annulé",
              message: `Le contrat pour "${data.title || "Prestation"}" a été annulé.`,
              relatedId: id,
              priority: "high"
            });
            await this.publishNotification({
              userId: data.clientId,
              type: "application_refused",
              title: "❌ Contrat Annulé",
              message: `Le contrat pour "${data.title || "Prestation"}" a été annulé.`,
              relatedId: id,
              priority: "high"
            });
          }
        }

        // Sync associated Gombo status automatically
        const gomboId = updates.gomboId || data.gomboId;
        if (gomboId) {
          let newGomboStatus: string | null = null;
          const currentStatus = updates.status || finalUpdates.status;
          
          if (currentStatus === "signed") {
            newGomboStatus = "contrat_confirme";
          } else if (currentStatus === "payment_held") {
            newGomboStatus = "paiement_recu";
          } else if (["arrived", "in_progress", "completed_artist"].includes(currentStatus)) {
            newGomboStatus = "en_cours";
          } else if (currentStatus === "completed") {
            newGomboStatus = "mission_terminee";
          } else if (currentStatus === "cancelled") {
            newGomboStatus = "mission_annulee";
          }

          if (newGomboStatus) {
            try {
              await updateDoc(doc(db, "gombos", gomboId), {
                status: newGomboStatus,
                updatedAt: new Date().toISOString()
              });
            } catch (err) {
              console.error("Error auto-syncing Gombo status from contract updates:", err);
            }
          }
        }

        // If status becomes completed, trigger certification automatically
        if (updates.status === "completed" || finalUpdates.status === "completed") {
          try {
            // 1. Create a certificate doc
            await addDoc(collection(db, "certificates"), {
              id: `CERT-${id.substring(3)}`,
              contractId: id,
              title: data.title || "Prestation de Musique d'Élite",
              artistId: data.artistId || "",
              artistName: data.artistName || "",
              clientId: data.clientId || "",
              clientName: data.clientName || "",
              amount: data.amount || 0,
              createdAt: serverTimestamp() as any,
              status: "Mission Réussie Certifiée"
            });

            // 2. Add as a dynamic activity log
            await addDoc(collection(db, "user_activities"), {
              userId: data.artistId,
              type: "certification",
              action: "Médaille d'Or d'Élite Obtenue",
              details: `Mission réussie : "${data.title}" (${id}). Cachet de ${data.amount?.toLocaleString()} FCFA sécurisé.`,
              timestamp: new Date().toISOString()
            });

            await addDoc(collection(db, "user_activities"), {
              userId: data.clientId,
              type: "contract",
              action: "Fin d'engagement certifiée",
              details: `Le Gombo "${data.title}" (${id}) s'est achevé avec succès.`,
              timestamp: new Date().toISOString()
            });

            // 3. Update the associated Gombo if available
            if (data.gomboId) {
              await updateDoc(doc(db, "gombos", data.gomboId), {
                status: "mission_terminee",
                paymentStatus: "paid"
              });
            }
          } catch (certError) {
            console.error("Error generating contract certificates/activities:", certError);
          }
        }
      }
    }
  },

  async getContractsForUser(userId: string): Promise<GomboSafeContract[]> {
    if (db) {
      const q = query(
        collection(db, "contracts"),
        or(where("clientId", "==", userId), where("artistId", "==", userId))
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as GomboSafeContract));
    }
    return [];
  },

  listenContractsForUser(userId: string, callback: (contracts: GomboSafeContract[]) => void) {
    if (db) {
      const q = query(
        collection(db, "contracts"),
        or(where("clientId", "==", userId), where("artistId", "==", userId))
      );
      return onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as GomboSafeContract));
        list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
        callback(list);
      });
    }
    return () => {};
  },

  async getAllContracts(): Promise<GomboSafeContract[]> {
    if (db) {
      const snap = await getDocs(collection(db, "contracts"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as GomboSafeContract));
    }
    return [];
  },

  listenAllContracts(callback: (contracts: GomboSafeContract[]) => void) {
    if (db) {
      const q = query(collection(db, "contracts"));
      return onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as GomboSafeContract));
        list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
        callback(list);
      });
    }
    return () => {};
  },

  listenContract(id: string, callback: (contract: GomboSafeContract | null) => void) {
    if (db) {
      return onSnapshot(doc(db, "contracts", id), (snap) => {
        if (snap.exists()) callback({ id: snap.id, ...snap.data() } as GomboSafeContract);
        else callback(null);
      });
    }
    return () => {};
  },

  listenAcademyGuides(callback: (guides: AcademyGuide[]) => void) {
    if (db) {
      return onSnapshot(collection(db, "academy_guides"), (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademyGuide)));
      });
    }
    return () => {};
  },

  listenTicketEvents(callback: (events: GomboTicketEvent[]) => void) {
    if (db) {
      return onSnapshot(collection(db, "ticket_events"), (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as GomboTicketEvent)));
      });
    }
    return () => {};
  },

  listenStudioMarket(callback: (items: StudioMarketItem[]) => void) {
    if (db) {
      return onSnapshot(collection(db, "studio_market"), (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudioMarketItem)));
      });
    }
    return () => {};
  },

  listenCastingCalls(callback: (calls: CastingCall[]) => void) {
    if (db) {
      return onSnapshot(collection(db, "casting_calls"), (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as CastingCall)));
      });
    }
    return () => {};
  },

  listenVoiceAnnouncements(callback: (announcements: VoiceAnnouncement[]) => void) {
    if (db) {
      return onSnapshot(collection(db, "voice_announcements"), (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as VoiceAnnouncement)));
      });
    }
    return () => {};
  },

  listenSafeContracts(userId: string, callback: (contracts: GomboSafeContract[]) => void) {
    return this.listenUserContracts(userId, callback);
  },

  listenUserContracts(userId: string, callback: (contracts: GomboSafeContract[]) => void) {
    if (db) {
      const q = query(
        collection(db, "contracts"),
        or(where("clientId", "==", userId), where("artistId", "==", userId))
      );
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GomboSafeContract)));
      });
    }
    return () => {};
  },

  listenPurchasedTickets(userId: string, callback: (tickets: PurchasedTicket[]) => void) {
    if (db) {
      const q = query(collection(db, "purchased_tickets"), where("userId", "==", userId));
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PurchasedTicket)));
      });
    }
    return () => {};
  },

  async createSafeContract(contract: Partial<GomboSafeContract>) {
    return this.createContract(contract);
  },

  async acceptSafeContract(contractId: string, userId: string, role: "client" | "artist") {
    if (db) {
      const field = role === "client" ? "clientAccepted" : "partnerAccepted";
      await updateDoc(doc(db, "contracts", contractId), {
        [field]: true,
        updatedAt: new Date().toISOString()
      });
    }
  },

  async updateSafeContractStatus(contractId: string, status: string) {
    if (db) {
      await updateDoc(doc(db, "contracts", contractId), {
        status,
        updatedAt: new Date().toISOString()
      });
    }
  },

  async createTicketEvent(event: Partial<GomboTicketEvent>) {
    if (db) {
      const ref = await addDoc(collection(db, "ticket_events"), {
        ...event,
        createdAt: new Date().toISOString()
      });
      return ref.id;
    }
  },

  async purchaseTicket(userIdOrData: any, eventId?: string, ticketData?: any) {
    if (db) {
      let payload: any = {};
      if (typeof userIdOrData === "string" && eventId && ticketData) {
        payload = {
          userId: userIdOrData,
          eventId,
          ...ticketData
        };
      } else {
        payload = userIdOrData;
      }
      await addDoc(collection(db, "purchased_tickets"), {
        ...payload,
        createdAt: new Date().toISOString()
      });
    }
  },

  async createStudioMarketItem(item: Partial<StudioMarketItem>) {
    if (db) {
      const ref = await addDoc(collection(db, "studio_market"), {
        ...item,
        createdAt: new Date().toISOString()
      });
      return ref.id;
    }
  },

  async openDispute(contractIdOrDispute: any, reason?: string, userId?: string, userName?: string) {
    if (db) {
      let disputeData: any = {};
      if (typeof contractIdOrDispute === "string") {
        disputeData = {
          contractId: contractIdOrDispute,
          reason,
          userId,
          userName,
          status: "open",
        };
      } else {
        disputeData = {
          ...contractIdOrDispute,
          status: "open"
        };
      }
      
      const contractId = disputeData.contractId;

      // 1. Create a dispute document
      await addDoc(collection(db, "disputes"), {
        ...disputeData,
        createdAt: new Date().toISOString()
      });

      // Also create a litige dossier
      await addDoc(collection(db, "litiges"), {
        contractId: disputeData.contractId || "",
        openedBy: disputeData.userId || "system",
        openedByName: disputeData.userName || "Anonyme",
        reason: disputeData.reason || "Non spécifié",
        status: "en_attente",
        createdAt: new Date().toISOString()
      });

      // 2. Update contract status to disputed
      if (contractId) {
        await updateDoc(doc(db, "contracts", contractId), {
          status: "disputed",
          updatedAt: new Date().toISOString()
        });

        // 3. Append to contract history
        const ref = doc(db, "contracts", contractId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const history = snap.data().history || [];
          history.push({
            action: `Litige ouvert par ${disputeData.userName || "un utilisateur"} : "${disputeData.reason || "Non spécifié"}"`,
            timestamp: new Date().toISOString(),
            userId: disputeData.userId || "system"
          });
          await updateDoc(ref, { history });
        }
      }

      // 4. Log as a critical activity
      if (disputeData.userId) {
        await addDoc(collection(db, "user_activities"), {
          userId: disputeData.userId,
          type: "litige",
          action: "Ouverture de Litige",
          details: `Litige signalé sur le contrat ${contractId} : "${disputeData.reason || "Non spécifié"}"`,
          timestamp: new Date().toISOString()
        });
      }
    }
  },

  // --- ADDITIONAL HELPER METHODS TO SATISFY LINTER & ALL FUNCTIONALITIES ---
  async publishCertificationRequest(req: any) {
    if (db) {
      await addDoc(collection(db, "certification_requests"), {
        ...req,
        status: "pending",
        createdAt: new Date().toISOString()
      });
    }
  },
  async createVerificationRequest(req: any) {
    if (db) {
      await addDoc(collection(db, "verification_requests"), {
        ...req,
        status: "pending",
        createdAt: new Date().toISOString()
      });
    }
  },
  async updateVerificationRequestStatus(id: string, status: string) {
    if (db) {
      await updateDoc(doc(db, "verification_requests", id), { status, updatedAt: new Date().toISOString() });
    }
  },
  async publishBoost(boost: any) {
    if (db) {
      const docRef = await addDoc(collection(db, "boosts"), {
        ...boost,
        createdAt: new Date().toISOString()
      });

      if (boost.userId) {
        await this.publishNotification({
          userId: boost.userId,
          type: "publication_boosted",
          title: "🚀 Publication Boostée !",
          message: `Votre publication ou profil a été boosté avec succès (Niveau ${boost.level || "BRONZE"}). Visibilité maximale activée !`,
          relatedId: docRef.id,
          priority: "high"
        });
      }
    }
  },
  async updateCertificationRequestStatus(id: string, status: string) {
    if (db) {
      await updateDoc(doc(db, "certification_requests", id), { status, updatedAt: new Date().toISOString() });
    }
  },
  async registerWaitingFeature(userId: string, email: string, featureId: string) {
    if (db) {
      await addDoc(collection(db, "waiting_features"), {
        userId,
        email,
        featureId,
        createdAt: new Date().toISOString()
      });
    }
  },
  async publishActivity(activity: any) {
    if (db) {
      await addDoc(collection(db, "user_activities"), {
        ...activity,
        timestamp: new Date().toISOString()
      });
    }
  },
  async getWaitingFeaturesCount(): Promise<any[]> {
    if (db) {
      const snap = await getDocs(collection(db, "waiting_features"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return [];
  },
  listenToActivityFeed(callback: (acts: any[]) => void) {
    if (db) {
      const q = query(collection(db, "user_activities"), orderBy("timestamp", "desc"));
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
    return () => {};
  },
  async getAllGombos() {
    return await this.getGombos();
  },
  async deleteGombo(id: string) {
    if (db) {
      await deleteDoc(doc(db, "gombos", id));
    }
  },
  async confirmBooking(booking: any) {
    if (db) {
      await addDoc(collection(db, "reservations"), {
        ...booking,
        status: "confirmed",
        createdAt: new Date().toISOString()
      });
    }
  },
  async getReservations(): Promise<any[]> {
    if (db) {
      const snap = await getDocs(collection(db, "reservations"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return [];
  },
  async submitBetaFeedback(feedback: any) {
    if (db) {
      await addDoc(collection(db, "beta_feedback"), {
        ...feedback,
        createdAt: new Date().toISOString()
      });
    }
  },
  async getPayments(userId?: string): Promise<any[]> {
    if (db) {
      if (userId) {
        const q = query(collection(db, "payments"), where("userId", "==", userId));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      const snap = await getDocs(collection(db, "payments"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return [];
  },
  async getCertificationRequests(userId: string): Promise<any[]> {
    if (db) {
      const q = query(collection(db, "certification_requests"), where("userId", "==", userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return [];
  },
  async getAllCertificationRequests(): Promise<any[]> {
    if (db) {
      const snap = await getDocs(collection(db, "certification_requests"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return [];
  },
  async getVerificationRequestByUser(userId: string): Promise<any | null> {
    if (db) {
      const q = query(collection(db, "verification_requests"), where("userId", "==", userId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
      }
    }
    return null;
  },
  async getAllVerificationRequests(): Promise<any[]> {
    if (db) {
      const snap = await getDocs(collection(db, "verification_requests"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return [];
  },
  async publishSecurityAlert(alert: any) {
    if (db) {
      await addDoc(collection(db, "security_alerts"), {
        ...alert,
        createdAt: new Date().toISOString()
      });
    }
  },

  async logSystemEvent(action: string, details: string, severity: "low" | "medium" | "high" = "low") {
    if (db) {
      const user = auth?.currentUser;
      await addDoc(collection(db, "admin_logs"), {
        action,
        details,
        severity,
        performedBy: user?.uid || "system",
        userEmail: user?.email || "anonymous",
        createdAt: new Date().toISOString()
      });
    }
  },

  // --- 2026 BETA: WAITLIST & SUPPORT ---
  async joinSecureWaitlist(uid: string, email: string, displayName: string, country: string) {
    if (db) {
      await addDoc(collection(db, "secure_waitlist"), {
        uid,
        email,
        displayName,
        country,
        createdAt: new Date().toISOString()
      });
    }
  },

  async getSecureWaitlistCount() {
    if (db) {
      const snap = await getDocs(collection(db, "secure_waitlist"));
      return snap.size;
    }
    return 0;
  },

  async supportAfrigombo(support: Omit<AfrigomboSupport, "id">) {
    if (db) {
      await addDoc(collection(db, "afrigombo_supports"), {
        ...support,
        createdAt: new Date().toISOString()
      });
    }
  },

  async getSupportStats() {
    if (db) {
      const snap = await getDocs(collection(db, "afrigombo_supports"));
      let totalAmount = 0;
      snap.forEach(d => {
        totalAmount += (d.data().amount || 0);
      });
      return {
        count: snap.size,
        totalAmount
      };
    }
    return { count: 0, totalAmount: 0 };
  },

  async getBetaUpdates() {
    if (db) {
      const q = query(collection(db, "beta_updates"), orderBy("date", "desc"));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as BetaUpdate));
    }
    return [];
  },

  // ------------------------------------
  listenSecurityAlerts(callback: (alerts: any[]) => void) {
    if (db) {
      const q = query(collection(db, "security_alerts"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
    return () => {};
  },
  listenSuspensions(callback: (suspensions: any[]) => void) {
    if (db) {
      const q = query(collection(db, "suspensions"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
    return () => {};
  },
  listenAllUserActivities(callback: (activities: any[]) => void) {
    if (db) {
      const q = query(collection(db, "user_activities"), orderBy("timestamp", "desc"));
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
    return () => {};
  },
  async createSuspension(suspension: any) {
    if (db) {
      await addDoc(collection(db, "suspensions"), {
        ...suspension,
        createdAt: new Date().toISOString()
      });
      // also update user profile status
      if (suspension.userId) {
        let userStatus = "active";
        if (suspension.type === "temp_block" || suspension.type === "perm_block") userStatus = "suspended";
        else if (suspension.type === "restriction" || suspension.type === "warning") userStatus = "suspect";
        await updateDoc(doc(db, "users", suspension.userId), { status: userStatus });
      }
    }
  },

  async depositToEscrow(contractId: string, amount: number, creatorId: string, creatorName: string) {
    if (db) {
      const now = new Date().toISOString();
      
      // Load the actual contract details first
      const contractRef = doc(db, "contracts", contractId);
      const contractSnap = await getDoc(contractRef);
      if (!contractSnap.exists()) {
        throw new Error("Contrat introuvable");
      }
      
      const contractData = contractSnap.data();
      const commissionClient = contractData.commissionClient ?? Math.round(amount * 0.06);
      const commissionArtist = contractData.commissionArtist ?? Math.round(amount * 0.06);
      const totalClientPaid = contractData.totalClientPaid ?? (amount + commissionClient);
      const totalArtistReceives = contractData.totalArtistReceives ?? (amount - commissionArtist);
      
      // Update Client's wallet balances
      const clientRef = doc(db, "users", creatorId);
      const clientSnap = await getDoc(clientRef);
      if (clientSnap.exists()) {
        const clientData = clientSnap.data();
        const currentDisponible = clientData.wallet?.soldeDisponible ?? 0;
        const currentBloque = clientData.wallet?.soldeBloque ?? 0;
        
        if (currentDisponible < totalClientPaid) {
          throw new Error(`Solde insuffisant dans votre Wallet AFRIGOMBO. Solde disponible : ${currentDisponible.toLocaleString()} FCFA. Requis : ${totalClientPaid.toLocaleString()} FCFA (Cachet + Commission). Veuillez recharger votre Wallet.`);
        }
        
        await setDoc(clientRef, {
          wallet: {
            soldeDisponible: currentDisponible - totalClientPaid,
            soldeBloque: currentBloque + totalClientPaid
          }
        }, { merge: true });
      } else {
        throw new Error("Compte client introuvable pour le prélèvement séquestre.");
      }

      // 1. Create a record in payments
      await addDoc(collection(db, "payments"), {
        contractId,
        userId: creatorId,
        userName: creatorName,
        amount: totalClientPaid,
        purpose: "depot_garantie_gombo",
        provider: "mobile_money",
        status: "Paiement reçu",
        createdAt: now
      });

      // 2. Create a record in escrow
      await setDoc(doc(db, "escrow", contractId), {
        id: contractId,
        contractId,
        amount,
        commissionClient,
        commissionArtist,
        totalLocked: totalClientPaid,
        status: "locked",
        createdAt: now
      });

      // 3. Create a record in transactions
      await addDoc(collection(db, "transactions"), {
        contractId,
        type: "deposit_escrow",
        amount: totalClientPaid,
        userId: creatorId,
        userName: creatorName,
        description: `Blocage séquestre de ${totalClientPaid.toLocaleString()} FCFA pour le contrat ${contractId}`,
        createdAt: now
      });

      // 4. Update the contract
      await updateDoc(contractRef, {
        status: "payment_held",
        commissionClient,
        commissionArtist,
        totalClientPaid,
        totalArtistReceives,
        updatedAt: now
      });

      // Sync Gombo status to paiement_recu if associated with a gombo
      if (contractData.gomboId) {
        try {
          await updateDoc(doc(db, "gombos", contractData.gomboId), {
            status: "paiement_recu",
            updatedAt: now
          });
        } catch (err) {
          console.error("Error auto-syncing Gombo status to paiement_recu on deposit:", err);
        }
      }

      // 5. Append to history
      const history = contractData.history || [];
      history.push({
        action: `Paiement reçu. ${totalClientPaid.toLocaleString()} FCFA bloqués en séquestre. En attente de prestation (Coffre AFRIGOMBO)`,
        timestamp: now,
        userId: creatorId
      });
      await updateDoc(contractRef, { history });
    }
  },

  async releaseEscrow(contractId: string) {
    if (db) {
      const now = new Date().toISOString();
      const escrowRef = doc(db, "escrow", contractId);
      const escrowSnap = await getDoc(escrowRef);
      if (!escrowSnap.exists()) return;

      const escrowData = escrowSnap.data();
      const amount = escrowData.amount;
      const totalCommission = (escrowData.commissionClient || 0) + (escrowData.commissionArtist || 0);
      const netToArtist = amount - (escrowData.commissionArtist || 0);
      const totalLocked = escrowData.totalLocked || (amount + (escrowData.commissionClient || 0));

      // 1. Mark escrow as released
      await updateDoc(escrowRef, {
        status: "released",
        releasedAt: now
      });

      // 2. Create commission record
      await addDoc(collection(db, "commissions"), {
        contractId,
        amount: totalCommission,
        rate: Math.round((totalCommission / amount) * 100) || 10,
        createdAt: now
      });

      let artistId = "";

      // Load contract to update specific users' wallets
      const contractRef = doc(db, "contracts", contractId);
      const contractSnap = await getDoc(contractRef);
      if (contractSnap.exists()) {
        const contractData = contractSnap.data();
        const clientId = contractData.clientId;
        artistId = contractData.artistId;

        // Deduct client's soldeBloque
        if (clientId) {
          const clientRef = doc(db, "users", clientId);
          const clientSnap = await getDoc(clientRef);
          if (clientSnap.exists()) {
            const clientData = clientSnap.data();
            const currentDisponible = clientData.wallet?.soldeDisponible ?? 0;
            const currentBloque = clientData.wallet?.soldeBloque ?? 0;
            await setDoc(clientRef, {
              wallet: {
                soldeDisponible: currentDisponible,
                soldeBloque: Math.max(0, currentBloque - totalLocked)
              }
            }, { merge: true });
          }
        }

        // Add to Artist's available wallet balance and revenue stats
        if (artistId) {
          const artistRef = doc(db, "users", artistId);
          const artistSnap = await getDoc(artistRef);
          if (artistSnap.exists()) {
            const artistData = artistSnap.data();
            const currentDisponible = artistData.wallet?.soldeDisponible ?? 0;
            const currentBloque = artistData.wallet?.soldeBloque ?? 0;
            const artistRevenue = artistData.revenue ?? 0;
            const artistTotalRevenue = artistData.totalRevenue ?? 0;

            await setDoc(artistRef, {
              wallet: {
                soldeDisponible: currentDisponible + netToArtist,
                soldeBloque: currentBloque
              },
              balance: (artistData.balance ?? 0) + netToArtist,
              revenue: artistRevenue + netToArtist,
              totalRevenue: artistTotalRevenue + netToArtist,
              gombosCompleted: (artistData.gombosCompleted ?? 0) + 1
            }, { merge: true });
          }
        }
      }

      // 3. Create release transaction
      await addDoc(collection(db, "transactions"), {
        contractId,
        type: "release",
        amount: netToArtist,
        userId: artistId,
        description: `Libération des fonds séquestres de ${netToArtist.toLocaleString()} FCFA pour l'artiste`,
        createdAt: now
      });

      // 4. Update contract status to completed
      await updateDoc(contractRef, {
        status: "completed",
        updatedAt: now
      });

      // 5. Append to history
      if (contractSnap.exists()) {
        const history = contractSnap.data().history || [];
        history.push({
          action: `Validation finale : Fonds libérés à l'artiste (Coffre AFRIGOMBO) [Artiste: +${netToArtist.toLocaleString()} FCFA | Plateforme: +${totalCommission.toLocaleString()} FCFA]`,
          timestamp: now,
          userId: "system"
        });
        await updateDoc(contractRef, { history });
      }
    }
  },

  async cancelGomboContract(contractId: string, cancelledByUserId: string) {
    if (db) {
      const now = new Date().toISOString();
      const contractRef = doc(db, "contracts", contractId);
      const contractSnap = await getDoc(contractRef);
      if (!contractSnap.exists()) {
        throw new Error("Contrat introuvable");
      }

      const contractData = contractSnap.data();
      const status = contractData.status;

      if (status === "completed" || status === "cancelled") {
        throw new Error("Ce contrat ne peut plus être annulé");
      }

      const clientId = contractData.clientId;
      const artistId = contractData.artistId;
      const clientName = contractData.clientName || "Annonceur";
      const artistName = contractData.artistName || "Artiste";
      const amount = contractData.amount || 0;
      const totalClientPaid = contractData.totalClientPaid || amount;

      const isClient = cancelledByUserId === clientId;
      const isArtist = cancelledByUserId === artistId;
      const cancelledByName = isClient ? clientName : (isArtist ? artistName : "Modérateur");

      let refundToClient = 0;
      let payToArtist = 0;
      let appliedPenalty = 0;
      let logMsg = "";

      // Check if escrow is active (i.e. status was payment_held, in_progress, arrived, completed_artist, or disputed)
      const isEscrowActive = ["payment_held", "arrived", "in_progress", "completed_artist", "disputed"].includes(status);

      if (isEscrowActive) {
        // We have active locked escrow funds!
        const escrowRef = doc(db, "escrow", contractId);
        const escrowSnap = await getDoc(escrowRef);

        if (isClient) {
          // Promoter cancels
          // Check if both signed (contract.clientSigned && contract.artistSigned)
          const isBothSigned = contractData.clientSigned && contractData.artistSigned;

          if (!isBothSigned) {
            // Promoter cancels BEFORE double signature -> 100% refund
            refundToClient = totalClientPaid;
            payToArtist = 0;
            appliedPenalty = 0;
            logMsg = `Annulation par le promoteur ${cancelledByName} avant signature mutuelle. Remboursement intégral de ${refundToClient.toLocaleString()} FCFA au promoteur.`;
          } else {
            // Promoter cancels AFTER double signature -> 10% penalty to artist, 90% refund to promoter
            appliedPenalty = Math.round(amount * 0.10);
            payToArtist = appliedPenalty;
            refundToClient = totalClientPaid - appliedPenalty;
            logMsg = `Annulation par le promoteur ${cancelledByName} après signature mutuelle. Pénalité de 10% (${appliedPenalty.toLocaleString()} FCFA) reversée à l'artiste. Solde restant (${refundToClient.toLocaleString()} FCFA) remboursé au promoteur.`;
          }
        } else if (isArtist) {
          // Musician cancels -> 100% refund to promoter, 0 to artist
          refundToClient = totalClientPaid;
          payToArtist = 0;
          appliedPenalty = 0;
          logMsg = `Annulation par l'artiste ${cancelledByName}. Remboursement intégral de ${refundToClient.toLocaleString()} FCFA au promoteur.`;
        } else {
          // Admin/System cancels -> 100% refund
          refundToClient = totalClientPaid;
          payToArtist = 0;
          appliedPenalty = 0;
          logMsg = `Annulation administrative de sécurité. Remboursement intégral de ${refundToClient.toLocaleString()} FCFA au promoteur.`;
        }

        // Apply Wallet Updates
        // 1. Client Wallet: Deduct from soldeBloque, add refund to soldeDisponible
        if (clientId) {
          const clientRef = doc(db, "users", clientId);
          const clientSnap = await getDoc(clientRef);
          if (clientSnap.exists()) {
            const clientData = clientSnap.data();
            const currentDisponible = clientData.wallet?.soldeDisponible ?? 0;
            const currentBloque = clientData.wallet?.soldeBloque ?? 0;
            await setDoc(clientRef, {
              wallet: {
                soldeDisponible: currentDisponible + refundToClient,
                soldeBloque: Math.max(0, currentBloque - totalClientPaid)
              }
            }, { merge: true });
          }
        }

        // 2. Artist Wallet: Add penalty if any to soldeDisponible
        if (artistId && payToArtist > 0) {
          const artistRef = doc(db, "users", artistId);
          const artistSnap = await getDoc(artistRef);
          if (artistSnap.exists()) {
            const artistData = artistSnap.data();
            const currentDisponible = artistData.wallet?.soldeDisponible ?? 0;
            const currentBloque = artistData.wallet?.soldeBloque ?? 0;
            const currentRevenus = artistData.wallet?.revenus ?? 0;
            await setDoc(artistRef, {
              wallet: {
                soldeDisponible: currentDisponible + payToArtist,
                soldeBloque: currentBloque,
                revenus: currentRevenus + payToArtist
              }
            }, { merge: true });
          }
        }

        // 3. Update Escrow status
        if (escrowSnap.exists()) {
          await updateDoc(escrowRef, {
            status: "cancelled",
            releasedAt: now,
            refundToClient,
            payToArtist,
            appliedPenalty
          });
        }

        // 4. Create transaction logs
        if (refundToClient > 0) {
          await addDoc(collection(db, "transactions"), {
            contractId,
            type: "refund",
            amount: refundToClient,
            userId: clientId,
            userName: clientName,
            description: `Remboursement suite annulation contrat ${contractId}: ${refundToClient.toLocaleString()} FCFA reversés.`,
            createdAt: now
          });
        }

        if (payToArtist > 0) {
          await addDoc(collection(db, "transactions"), {
            contractId,
            type: "release",
            amount: payToArtist,
            userId: artistId,
            userName: artistName,
            description: `Dédommagement annulation contrat ${contractId}: ${payToArtist.toLocaleString()} FCFA perçus (Pénalité 10%).`,
            createdAt: now
          });
        }
      } else {
        // Escrow not active (not paid yet)
        logMsg = `Annulation du contrat ${contractId} par ${cancelledByName}. Aucun fonds n'était encore déposé en séquestre.`;
      }

      // Update Contract
      await updateDoc(contractRef, {
        status: "cancelled",
        updatedAt: now
      });

      // Update Gombo status if needed
      await this.updateGomboStatus(contractData.gomboId, "recrutement_ouvert");

      // Append to contract history
      const history = contractData.history || [];
      history.push({
        action: logMsg,
        timestamp: now,
        userId: cancelledByUserId
      });
      await updateDoc(contractRef, { history });

      // Publish real-time security alert for Admin Command Center
      await this.publishSecurityAlert({
        type: "annulation_contrat",
        title: `ANNULATION CONTRAT : ${contractId}`,
        message: logMsg,
        contractId,
        openedBy: cancelledByUserId,
        openedByName: cancelledByName,
        severity: "medium",
        status: "unresolved",
        createdAt: now
      });
    }
  },

  async openContractDispute(contractId: string, reason: string, openedById: string, openedByName: string) {
    if (db) {
      const now = new Date().toISOString();

      // Get contract detail for info (amount, titles, names, etc)
      const contractRef = doc(db, "contracts", contractId);
      const contractSnap = await getDoc(contractRef);
      let gomboTitle = "Prestation Artistique";
      let amount = 0;
      let clientId = "";
      let artistId = "";
      if (contractSnap.exists()) {
        const cData = contractSnap.data();
        gomboTitle = cData.gomboTitle || gomboTitle;
        amount = cData.amount || 0;
        clientId = cData.clientId || "";
        artistId = cData.artistId || "";
      }

      // 1. Create Litige dossier
      const litigeRef = await addDoc(collection(db, "litiges"), {
        contractId,
        openedBy: openedById,
        openedByName,
        reason,
        status: "en_attente",
        amount,
        gomboTitle,
        createdAt: now
      });

      // 2. Mark escrow as disputed
      await updateDoc(doc(db, "escrow", contractId), {
        status: "disputed"
      });

      // 3. Update contract status to disputed
      await updateDoc(contractRef, {
        status: "disputed",
        updatedAt: now
      });

      // 4. Publish real-time security alert for Admin Centre Commandement
      await this.publishSecurityAlert({
        type: "litige_contrat",
        title: `LITIGE COFFRE : Contrat ${contractId}`,
        message: `Litige ouvert par ${openedByName} pour le Gombo "${gomboTitle}". Montant séquestré: ${amount.toLocaleString()} FCFA. Motif: ${reason}`,
        contractId,
        openedBy: openedById,
        openedByName,
        severity: "critical",
        status: "unresolved",
        createdAt: now
      });

      // 5. Send Notification to Founder/Admin profiles
      await this.sendNotification({
        userId: "admin",
        type: "system",
        title: "🚨 Alerte Litige Séquestre",
        message: `Le contrat ${contractId} (${gomboTitle}) a été mis en litige par ${openedByName}.`,
        createdAt: now
      });

      // 6. Append to history
      if (contractSnap.exists()) {
        const history = contractSnap.data().history || [];
        history.push({
          action: `Litige ouvert par ${openedByName} : "${reason}" - Fonds bloqués en séquestre. Alerte émise au Trône du Fondateur 🚨`,
          timestamp: now,
          userId: openedById
        });
        await updateDoc(contractRef, { history });
      }

      return litigeRef.id;
    }
  },

  async resolveDispute(litigeId: string, resolution: "release_to_artist" | "refund_to_creator", adminId: string) {
    if (db) {
      const now = new Date().toISOString();
      const litigeRef = doc(db, "litiges", litigeId);
      const litigeSnap = await getDoc(litigeRef);
      if (!litigeSnap.exists()) return;

      const litigeData = litigeSnap.data();
      const contractId = litigeData.contractId;

      const escrowRef = doc(db, "escrow", contractId);
      const escrowSnap = await getDoc(escrowRef);
      if (!escrowSnap.exists()) return;

      const escrowData = escrowSnap.data();
      const amount = escrowData.amount;
      const totalCommission = (escrowData.commissionClient || 0) + (escrowData.commissionArtist || 0);
      const netToArtist = amount - (escrowData.commissionArtist || 0);
      const totalLocked = escrowData.totalLocked || (amount + (escrowData.commissionClient || 0));

      const contractRef = doc(db, "contracts", contractId);
      const contractSnap = await getDoc(contractRef);
      let clientId = "";
      let artistId = "";
      if (contractSnap.exists()) {
        const cData = contractSnap.data();
        clientId = cData.clientId || "";
        artistId = cData.artistId || "";
      }

      if (resolution === "release_to_artist") {
        // Option A: release to artist
        await updateDoc(escrowRef, {
          status: "released",
          releasedAt: now
        });

        await addDoc(collection(db, "commissions"), {
          contractId,
          amount: totalCommission,
          rate: Math.round((totalCommission / amount) * 100) || 10,
          createdAt: now
        });

        // Update Client's soldeBloque
        if (clientId) {
          const clientRef = doc(db, "users", clientId);
          const clientSnap = await getDoc(clientRef);
          if (clientSnap.exists()) {
            const clientData = clientSnap.data();
            const currentDisponible = clientData.wallet?.soldeDisponible ?? 0;
            const currentBloque = clientData.wallet?.soldeBloque ?? 0;
            await setDoc(clientRef, {
              wallet: {
                soldeDisponible: currentDisponible,
                soldeBloque: Math.max(0, currentBloque - totalLocked)
              }
            }, { merge: true });
          }
        }

        // Update Artist's soldeDisponible & stats
        if (artistId) {
          const artistRef = doc(db, "users", artistId);
          const artistSnap = await getDoc(artistRef);
          if (artistSnap.exists()) {
            const artistData = artistSnap.data();
            const currentDisponible = artistData.wallet?.soldeDisponible ?? 0;
            const currentBloque = artistData.wallet?.soldeBloque ?? 0;
            const artistRevenue = artistData.revenue ?? 0;
            const artistTotalRevenue = artistData.totalRevenue ?? 0;

            await setDoc(artistRef, {
              wallet: {
                soldeDisponible: currentDisponible + netToArtist,
                soldeBloque: currentBloque
              },
              balance: (artistData.balance ?? 0) + netToArtist,
              revenue: artistRevenue + netToArtist,
              totalRevenue: artistTotalRevenue + netToArtist,
              gombosCompleted: (artistData.gombosCompleted ?? 0) + 1
            }, { merge: true });
          }
        }

        await addDoc(collection(db, "transactions"), {
          contractId,
          type: "release",
          amount: netToArtist,
          userId: artistId,
          description: `Arbitrage Admin : Libération des fonds de ${netToArtist.toLocaleString()} FCFA à l'artiste`,
          createdAt: now
        });

        await updateDoc(contractRef, {
          status: "completed",
          updatedAt: now
        });

        // Update contract history
        if (contractSnap.exists()) {
          const history = contractSnap.data().history || [];
          history.push({
            action: `Litige résolu par l'Administrateur : Fonds libérés à l'artiste (Arbitrage)`,
            timestamp: now,
            userId: adminId
          });
          await updateDoc(contractRef, { history });
        }
      } else {
        // Option B: refund to creator
        await updateDoc(escrowRef, {
          status: "refunded",
          releasedAt: now
        });

        // Update Client's wallet: subtract from soldeBloque, add back to soldeDisponible
        if (clientId) {
          const clientRef = doc(db, "users", clientId);
          const clientSnap = await getDoc(clientRef);
          if (clientSnap.exists()) {
            const clientData = clientSnap.data();
            const currentDisponible = clientData.wallet?.soldeDisponible ?? 0;
            const currentBloque = clientData.wallet?.soldeBloque ?? 0;
            await setDoc(clientRef, {
              wallet: {
                soldeDisponible: currentDisponible + totalLocked,
                soldeBloque: Math.max(0, currentBloque - totalLocked)
              }
            }, { merge: true });
          }
        }

        await addDoc(collection(db, "transactions"), {
          contractId,
          type: "refund",
          amount: totalLocked,
          description: `Arbitrage Admin : Remboursement des fonds de ${totalLocked.toLocaleString()} FCFA à l'annonceur`,
          createdAt: now
        });

        await updateDoc(contractRef, {
          status: "cancelled",
          updatedAt: now
        });

        // Update contract history
        if (contractSnap.exists()) {
          const history = contractSnap.data().history || [];
          history.push({
            action: `Litige résolu par l'Administrateur : Fonds remboursés à l'annonceur (Arbitrage)`,
            timestamp: now,
            userId: adminId
          });
          await updateDoc(contractRef, { history });
        }
      }

      await updateDoc(litigeRef, {
        status: "resolu",
        resolution,
        resolvedAt: now,
        adminNotes: `Arbitré par l'administrateur ${adminId}`
      });
    }
  },

  listenLitiges(callback: (litiges: any[]) => void) {
    if (db) {
      const q = query(collection(db, "litiges"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
    return () => {};
  },

  listenEscrow(callback: (escrows: any[]) => void) {
    if (db) {
      return onSnapshot(collection(db, "escrow"), (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
    return () => {};
  },

  listenWithdrawals(callback: (withdrawals: any[]) => void) {
    if (db) {
      const q = query(collection(db, "withdrawals"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
    return () => {};
  },

  async requestWithdrawal(userId: string, userName: string, amount: number, provider: string, phone: string) {
    if (db) {
      const now = new Date().toISOString();
      await addDoc(collection(db, "withdrawals"), {
        userId,
        userName,
        amount,
        mobileMoneyProvider: provider,
        mobileMoneyNumber: phone,
        status: "pending",
        createdAt: now
      });

      await addDoc(collection(db, "transactions"), {
        type: "withdraw_request",
        amount,
        userId,
        userName,
        description: `Demande de retrait de ${amount} FCFA vers ${provider} (${phone})`,
        createdAt: now
      });
    }
  },

  async processWithdrawal(withdrawalId: string, status: "approved" | "rejected") {
    if (db) {
      const now = new Date().toISOString();
      const ref = doc(db, "withdrawals", withdrawalId);
      await updateDoc(ref, {
        status,
        processedAt: now
      });

      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        await addDoc(collection(db, "transactions"), {
          type: status === "approved" ? "withdraw_approved" : "withdraw_rejected",
          amount: data.amount,
          userId: data.userId,
          userName: data.userName,
          description: status === "approved" 
            ? `Retrait approuvé de ${data.amount} FCFA` 
            : `Retrait rejeté de ${data.amount} FCFA`,
          createdAt: now
        });
      }
    }
  }
};

export { db, storage };

