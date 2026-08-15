import { db, app } from "../firebase";
import { collection, query, where, orderBy, limit, onSnapshot, getDocs, doc, setDoc, updateDoc, writeBatch, addDoc, getDoc } from "firebase/firestore";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

export class NotificationService {
  static VAPID_KEY = process.env.VITE_FIREBASE_VAPID_KEY || "BPEg3H_yQG3t8F_tAIfjI0-R4x9R5-U0hV4K6A9xS4_aD9p5A-kC7t0I-M8eQf_eX7c3J4K9L1xR9S-pA";

  static generateEventId(type: string, targetId: string, action: string) {
    return `${type}_${targetId}_${action}`;
  }

  static async initializeFCM(userId: string) {
    try {
      const supported = await isSupported();
      if (!supported) return;

      const messaging = getMessaging(app);
      
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: this.VAPID_KEY });
        if (token) {
          await updateDoc(doc(db, "users", userId), {
            fcmToken: token,
            "notificationPrefs.fcmEnabled": true
          });
        }
      }

      onMessage(messaging, (payload) => {
        if (payload.notification) {
          this.showLocalNotification(
            payload.notification.title || "AFRIGOMBO", 
            payload.notification.body || "",
            payload.data?.route || ""
          );
        }
      });
    } catch (e) {
      console.warn("FCM Initialization failed", e);
    }
  }

  private static showLocalNotification(title: string, body: string, route: string) {
    if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
      const options: any = {
        body,
        icon: "/icons/icon-192x192.png",
        vibrate: [200, 100, 200]
      };
      const n = new Notification(title, options);
      n.onclick = () => {
        n.close();
        if (route) {
          window.location.hash = route;
        } else {
          window.focus();
        }
      };
    }
  }

  static async sendNotification(notif: any) {
    if (!db) return;
    try {
      // 1. Check user preferences
      if (notif.userId && notif.userId !== "SUPER_FOUNDER" && notif.userId !== "GLOBAL" && notif.userId !== "admin") {
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
            }
          }
        } catch (e) {
          console.warn("Could not check user notification preferences:", e);
        }
      }

      // 2. Determine Event ID (Deduplication)
      let eventId = notif.eventId;
      if (!eventId) {
        if (notif.transactionId) eventId = `tx_${notif.transactionId}`;
        else if (notif.messageId) eventId = `msg_${notif.messageId}`;
        else if (notif.campaignId) eventId = `campaign_${notif.campaignId}`;
        else if (notif.missionId) eventId = `mission_${notif.missionId}`;
        else if (notif.contractId) eventId = `contract_${notif.contractId}_${notif.type}`;
        else if (notif.lotId) eventId = `lot_${notif.lotId}`;
        else if (notif.gawaId) eventId = `gawa_${notif.gawaId}`;
        else {
          eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }
      }
      
      const notifsRef = collection(db, "notifications");

      // Check existing Event ID to prevent duplicates
      const q = query(notifsRef, where("eventId", "==", eventId), limit(1));
      const existing = await getDocs(q);
      if (!existing.empty) {
        console.log(`Notification with eventId ${eventId} already exists. Skipping.`);
        return existing.docs[0].id;
      }

      // 3. Smart Grouping (Likes, Comments)
      const groupableTypes = ["LIKE", "COMMENT", "like", "comment", "new_favorite", "view"];
      if (groupableTypes.includes(notif.type)) {
         const targetId = notif.targetId || notif.postId || notif.route || notif.relatedId;
         if (targetId && notif.userId) {
             const groupQ = query(
               notifsRef, 
               where("userId", "==", notif.userId),
               where("type", "==", notif.type),
               where("targetId", "==", targetId),
               where("isRead", "==", false),
               orderBy("createdAt", "desc"),
               limit(1)
             );
             const groupDocs = await getDocs(groupQ);
             if (!groupDocs.empty) {
               const existingDoc = groupDocs.docs[0];
               const data = existingDoc.data();
               const newCount = (data.groupCount || 1) + 1;
               
               let newMessage = notif.message;
               if (notif.type.toUpperCase() === "LIKE") newMessage = `${newCount} personnes ont aimé votre publication.`;
               else if (notif.type.toUpperCase() === "COMMENT") newMessage = `${newCount} personnes ont commenté votre publication.`;
               else if (notif.type === "new_favorite") newMessage = `${newCount} personnes ont ajouté votre profil en favoris.`;
               
               await updateDoc(existingDoc.ref, {
                 groupCount: newCount,
                 message: newMessage,
                 createdAt: new Date().toISOString()
               });
               return existingDoc.id;
             }
         }
      }

      // 4. Prioritization
      let priority = notif.priority || "NORMAL";
      const highPriorityTypes = [
        "new_message", "payment_received", "payment_held", "security", "SÉCURITÉ", 
        "URGENT", "wallet", "achat", "lot", "withdrawal", "kyc", "alert", "system"
      ];
      const lowPriorityTypes = ["like", "LIKE", "view", "secondary", "newsletter"];
      
      if (highPriorityTypes.some(t => notif.type?.toLowerCase().includes(t.toLowerCase()))) {
        priority = "HIGH";
      } else if (lowPriorityTypes.some(t => notif.type?.toLowerCase().includes(t.toLowerCase()))) {
        priority = "LOW";
      }

      // 5. Insert new notification
      const newNotif = {
        title: notif.title || "Notification AFRIGOMBO",
        message: notif.message || "",
        type: notif.type || "info",
        userId: notif.userId || "GLOBAL",
        targetId: notif.targetId || notif.postId || notif.route || notif.relatedId || "",
        targetRoute: notif.targetRoute || notif.route || "",
        eventId,
        priority,
        groupCount: 1,
        isRead: false,
        read: false, // For backwards compatibility
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(notifsRef, newNotif);

      // 6. Trigger Push (Local or FCM)
      if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
        const shouldPush = priority === "HIGH" || !document.hasFocus();
        if (shouldPush) {
           this.showLocalNotification(newNotif.title, newNotif.message, newNotif.targetRoute);
        }
      }

      return docRef.id;
    } catch (e) {
      console.error("Failed to send notification:", e);
      return null;
    }
  }

  static listenUserNotifications(userId: string, callback: (notifs: any[]) => void) {
    if (!db) return () => {};
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      // Don't replay old notifications as new. Just map them.
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(notifs);
    });
  }
}
