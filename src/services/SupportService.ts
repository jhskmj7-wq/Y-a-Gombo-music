import { db } from "../lib/firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  increment 
} from "firebase/firestore";

export interface SupportConversation {
  id: string;
  participants: string[];
  userUid: string;
  userName: string;
  userPhoto: string;
  type: "support";
  status: "open" | "closed";
  createdAt: any;
  lastMessage: string;
  lastMessageAt: any;
  category: "Wallet" | "Premium" | "Bug" | "Contrat" | "Signalement" | "Autre";
  unreadCount: Record<string, number>;
}

export interface SupportMessage {
  id?: string;
  conversationId: string;
  senderUid: string;
  senderName: string;
  text: string;
  createdAt: any;
  isSystem?: boolean;
}

export const SUPPORT_PROFILE = {
  uid: "afrigombo_support",
  name: "Équipe AFRIGOMBO",
  photo: "/logo.png",
  badge: "✔ Vérifié",
  description: "Support officiel AFRIGOMBO",
  type: "systemAccount",
  role: "support",
  status: "🟢 En ligne"
};

export const SupportService = {
  /**
   * Get or create a support conversation for a given user.
   */
  async getOrCreateSupportConversation(userUid: string, userProfile?: any): Promise<string> {
    if (!db) throw new Error("Database not initialized");
    if (!userUid) throw new Error("User UID required");

    // Seed the support user in 'users' collection to ensure it exists
    try {
      const supportUserRef = doc(db, "users", SUPPORT_PROFILE.uid);
      const supportUserSnap = await getDoc(supportUserRef);
      if (!supportUserSnap.exists()) {
        await setDoc(supportUserRef, {
          uid: SUPPORT_PROFILE.uid,
          name: SUPPORT_PROFILE.name,
          displayName: SUPPORT_PROFILE.name,
          photoURL: SUPPORT_PROFILE.photo,
          avatarUrl: SUPPORT_PROFILE.photo,
          type: "systemAccount",
          role: "support",
          status: "🟢 En ligne",
          description: SUPPORT_PROFILE.description,
          createdAt: new Date().toISOString(),
          isSystem: true
        });
      }
    } catch (e) {
      console.warn("Could not seed support user:", e);
    }

    const convoRef = doc(db, "supportConversations", userUid);
    const convoSnap = await getDoc(convoRef);

    if (convoSnap.exists()) {
      return userUid;
    }

    // Prepare default values
    const userName = userProfile?.artisticName || userProfile?.displayName || userProfile?.name || "Membre Gombo";
    const userPhoto = userProfile?.avatarUrl || userProfile?.photoURL || "";

    const newConvo: SupportConversation = {
      id: userUid,
      participants: [userUid, SUPPORT_PROFILE.uid],
      userUid: userUid,
      userName: userName,
      userPhoto: userPhoto,
      type: "support",
      status: "open",
      createdAt: new Date().toISOString(),
      lastMessage: "Bonjour 👋 Bienvenue chez AFRIGOMBO. Notre équipe est disponible pour répondre à toutes vos questions.",
      lastMessageAt: new Date().toISOString(),
      category: "Autre",
      unreadCount: {
        [userUid]: 0,
        [SUPPORT_PROFILE.uid]: 0
      }
    };

    // Save support conversation
    await setDoc(convoRef, newConvo);

    // Save default welcome message in supportMessages
    const messageRef = await addDoc(collection(db, "supportMessages"), {
      conversationId: userUid,
      senderUid: SUPPORT_PROFILE.uid,
      senderName: SUPPORT_PROFILE.name,
      text: "Bonjour 👋\nBienvenue chez AFRIGOMBO.\nNotre équipe est disponible pour répondre à toutes vos questions.\nChoisissez votre besoin ou écrivez directement votre message.",
      createdAt: new Date().toISOString()
    });

    // Save in supportCategories collection to index categories cleanly
    try {
      await setDoc(doc(db, "supportCategories", "Autre"), {
        id: "Autre",
        label: "Autre",
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn("Could not write supportCategory", e);
    }

    // Log the creation
    try {
      await addDoc(collection(db, "supportLogs"), {
        action: "create_conversation",
        userUid: userUid,
        timestamp: new Date().toISOString(),
        details: `Création de la conversation support pour ${userName}`
      });
    } catch (e) {
      console.warn("Could not write supportLogs", e);
    }

    return userUid;
  },

  /**
   * Send a support message.
   */
  async sendSupportMessage(
    conversationId: string, 
    senderUid: string, 
    senderName: string, 
    text: string, 
    category?: string
  ) {
    if (!db) return;

    const timestamp = new Date().toISOString();

    // 1. Add message document
    await addDoc(collection(db, "supportMessages"), {
      conversationId,
      senderUid,
      senderName,
      text,
      createdAt: timestamp
    });

    // 2. Update conversation record
    const convoRef = doc(db, "supportConversations", conversationId);
    const convoSnap = await getDoc(convoRef);

    const updatePayload: any = {
      lastMessage: text,
      lastMessageAt: timestamp,
      status: "open"
    };

    if (category) {
      updatePayload.category = category;
    }

    if (convoSnap.exists()) {
      const currentUnreads = convoSnap.data().unreadCount || {};
      const recipientUid = senderUid === "afrigombo_support" ? conversationId : "afrigombo_support";
      
      updatePayload.unreadCount = {
        ...currentUnreads,
        [recipientUid]: (currentUnreads[recipientUid] || 0) + 1
      };
    }

    await updateDoc(convoRef, updatePayload);

    // 3. Write Support Logs
    try {
      await addDoc(collection(db, "supportLogs"), {
        action: "send_message",
        conversationId,
        senderUid,
        timestamp,
        textLength: text.length
      });
    } catch (e) {
      console.warn("Could not write supportLogs", e);
    }

    // 4. Trigger Real-time Notification
    try {
      const notifyRecipient = senderUid === "afrigombo_support" ? conversationId : "founder_admin";
      await addDoc(collection(db, "notifications"), {
        type: "support_message",
        recipientUid: notifyRecipient,
        title: senderUid === "afrigombo_support" ? "Support AFRIGOMBO" : "Nouveau message de support",
        body: text.length > 60 ? text.substring(0, 60) + "..." : text,
        createdAt: timestamp,
        read: false,
        link: senderUid === "afrigombo_support" ? "user_support" : "founder_throne"
      });
    } catch (e) {
      console.warn("Notification system warning:", e);
    }
  },

  /**
   * Send a system support message for financial actions.
   */
  async sendSystemSupportMessage(
    userUid: string, 
    userProfile: any, 
    text: string, 
    category: "Wallet" | "Premium" | "Bug" | "Contrat" | "Signalement" | "Autre"
  ) {
    try {
      const convoId = await this.getOrCreateSupportConversation(userUid, userProfile);
      await this.sendSupportMessage(
        convoId,
        userUid,
        userProfile?.artisticName || userProfile?.displayName || "Membre Gombo",
        text,
        category
      );
    } catch (err) {
      console.error("Failed to send system support message:", err);
    }
  }
};
