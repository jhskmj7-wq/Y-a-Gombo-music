import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  UserActivity
} from "./types";

// Setup and determine if using Real Firebase
export const isFirebaseMock = false; 
export let pendingSignUpProfile: UserProfile | null = null;

const GOOGLE_PROVIDER = new GoogleAuthProvider();
const FACEBOOK_PROVIDER = new FacebookAuthProvider();
const GITHUB_PROVIDER = new GithubAuthProvider();

// ========================================================
// --- AFRI ID ECOSYSTEM FOUNDATION GENERATION & SYNC ---
// ========================================================

export function generateAfriId(): string {
  const timestamp = Date.now();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AFRI${timestamp}${random}`;
}

export async function ensureAfriIdAndSync(profile: UserProfile): Promise<UserProfile> {
  let changed = false;
  const updated = { ...profile };
  
  if (!updated.afriId) {
    updated.afriId = generateAfriId();
    changed = true;
  }
  
  if (!updated.ecosystemApps) {
    updated.ecosystemApps = {
      afrigombo: true,
      afritrust: false,
      africoach: false
    };
    changed = true;
  } else {
    if (updated.ecosystemApps.afrigombo !== true) {
      updated.ecosystemApps.afrigombo = true;
      changed = true;
    }
  }

  if (!updated.createdAt) {
    updated.createdAt = new Date().toISOString();
    changed = true;
  }
  if (!updated.lastLoginAt) {
    updated.lastLoginAt = new Date().toISOString();
    changed = true;
  }

  if (changed && db) {
    try {
      const userRef = doc(db, "users", profile.uid);
      await setDoc(userRef, updated, { merge: true });

      if (updated.afriId) {
        const afriUserRef = doc(db, "afri_ids", updated.afriId);
        await setDoc(afriUserRef, {
          afriId: updated.afriId,
          uid: updated.uid,
          nom: updated.displayName || updated.firstName || "",
          email: updated.email || "",
          telephone: updated.phone || "",
          avatar: updated.photoURL || updated.avatarUrl || "",
          role: updated.role || "user",
          applications: {
            afrigombo: true,
            afriTrust: updated.ecosystemApps?.afritrust || false,
          },
          createdAt: updated.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err) {
      console.warn("⚠️ [AFRI ID] Non-fatal auto-syncing of Afri ID failed:", err);
    }
  }
  
  return updated;
}

// ==========================================
// --- Unified GomboAuth Engine ---
// ==========================================
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

  async loginWithGoogle() {
    if (auth && db) {
      try {
        const res = await signInWithPopup(auth, GOOGLE_PROVIDER);
        if (res && res.user) {
          const uDoc = await getDoc(doc(db, "users", res.user.uid));
          if (!uDoc.exists()) {
            const names = res.user.displayName ? res.user.displayName.split(" ") : ["Artiste", "Gombo"];
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
              role: "musicien", 
              provider: "google.com",
              isProfileComplete: false,
              balance: 0,
              totalRevenue: 0,
              createdAt: new Date().toISOString(),
              afriId: generateAfriId(),
              ecosystemApps: {
                afrigombo: true,
                afritrust: false,
                africoach: false
              }
            };
            await setDoc(doc(db, "users", res.user.uid), userProfile);
          }
          return { uid: res.user.uid, email: res.user.email };
        }
      } catch (e: any) {
        console.error("Erreur Google :", e);
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
        if (!profile.afriId) {
          profile = await ensureAfriIdAndSync(profile);
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

  async deleteUserProfile(uid: string) {
    if (db) {
      await deleteDoc(doc(db, "users", uid));
    }
  },

  // MESSAGING
  async getOrCreateConversation(currentUserId: string, targetUserId: string, gomboId?: string, extraData?: any, somethingElse?: any): Promise<Conversation> {
    if (db) {
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
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        unreadCount: { [currentUserId]: 0, [targetUserId]: 0 },
        gomboId,
        ...extraData,
        ...somethingElse
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
        where("participants", "array-contains", userId),
        orderBy("lastMessageAt", "desc")
      );
      return onSnapshot(q, (snapshot) => {
        const convos = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
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
        where("conversationId", "==", convoId),
        orderBy("createdAt", "asc")
      );
      return onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
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
        createdAt: new Date().toISOString(),
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

  async applyToGombo(gomboId: string, application: Partial<Application>) {
    if (db) {
      const ref = await addDoc(collection(db, "applications"), {
        ...application,
        gomboId,
        status: "en_attente",
        createdAt: new Date().toISOString()
      });
      
      await updateDoc(doc(db, "gombos", gomboId), {
        applicantsCount: increment(1)
      });
      return ref.id;
    }
  },

  listenApplications(gomboId: string, callback: (apps: Application[]) => void) {
    if (db) {
      const q = query(collection(db, "applications"), where("gomboId", "==", gomboId));
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Application)));
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

  async updateApplicationStatus(gomboId: string, appId: string, status: string) {
    if (db) {
      await updateDoc(doc(db, "applications", appId), { status });
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

  async applyToRenfort(renfortId: string, application: Partial<RenfortApplication>) {
    if (db) {
      await addDoc(collection(db, "renfort_applications"), {
        ...application,
        renfortId,
        status: "en_attente",
        createdAt: new Date().toISOString()
      });
    }
  },

  listenRenfortApplications(renfortId: string, callback: (apps: RenfortApplication[]) => void) {
    if (db) {
      let q;
      if (renfortId) {
        q = query(collection(db, "renfort_applications"), where("renfortId", "==", renfortId));
      } else {
        q = query(collection(db, "renfort_applications"));
      }
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RenfortApplication)));
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

  listenNotifications(userId: string, callback: (notifs: GomboNotification[]) => void) {
    if (db) {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GomboNotification)));
      });
    }
    return () => {};
  },

  async markNotificationAsRead(notifId: string) {
    if (db) {
      await updateDoc(doc(db, "notifications", notifId), { isRead: true });
    }
  },

  async deleteNotification(notifId: string) {
    if (db) {
      await deleteDoc(doc(db, "notifications", notifId));
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

  async logUserActivity(activity: Partial<UserActivity>) {
    if (db) {
      await addDoc(collection(db, "user_activities"), {
        ...activity,
        timestamp: new Date().toISOString()
      });
    }
  },

  listenUserActivities(userId: string, callback: (acts: UserActivity[]) => void) {
    if (db) {
      const q = query(collection(db, "user_activities"), where("userId", "==", userId), orderBy("timestamp", "desc"), limit(50));
      return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserActivity)));
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
      await addDoc(collection(db, "payments"), {
        ...payment,
        createdAt: new Date().toISOString()
      });
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

  async addStudioMarketReview(review: any) {
    if (db) {
      await addDoc(collection(db, "studio_market_reviews"), {
        ...review,
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

  async applyToCastingCall(castingId: string, application: any) {
    if (db) {
      await addDoc(collection(db, "casting_applications"), {
        ...application,
        castingId,
        createdAt: new Date().toISOString()
      });
    }
  },

  async updateCastingApplicationStatus(appId: string, status: string) {
    if (db) {
      await updateDoc(doc(db, "casting_applications", appId), { status });
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

  // FILES
  async uploadFile(file: File | string, path: string, metadata?: any): Promise<string> {
    if (storage) {
      const storageRef = ref(storage, path);
      if (typeof file === "string") {
        // Handle Base64
        const response = await fetch(file);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob, metadata);
      } else {
        await uploadBytes(storageRef, file, metadata);
      }
      return await getDownloadURL(storageRef);
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

  async getGroupInvitations(userId: string): Promise<any[]> {
    return await this.getUserInvitations(userId);
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
      const ref = doc(db, "contracts", id);
      await setDoc(ref, {
        ...contract,
        id,
        status: contract.status || "generated",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return id;
    }
  },

  async getContractById(id: string): Promise<GomboSafeContract | null> {
    if (db) {
      const snap = await getDoc(doc(db, "contracts", id));
      if (snap.exists()) return { id: snap.id, ...snap.data() } as GomboSafeContract;
    }
    return null;
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

  async getAllContracts(): Promise<GomboSafeContract[]> {
    if (db) {
      const snap = await getDocs(collection(db, "contracts"));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as GomboSafeContract));
    }
    return [];
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

  async purchaseTicket(userId: string, eventId: string, ticketData: any) {
    if (db) {
      await addDoc(collection(db, "purchased_tickets"), {
        userId,
        eventId,
        ...ticketData,
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

  async openDispute(dispute: any) {
    if (db) {
      await addDoc(collection(db, "disputes"), {
        ...dispute,
        createdAt: new Date().toISOString()
      });
    }
  }
};

export { db, storage };
