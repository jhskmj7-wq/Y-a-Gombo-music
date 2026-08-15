import { db, app } from "../firebase";
import { 
  collection, query, where, orderBy, limit, onSnapshot, 
  getDocs, doc, setDoc, updateDoc, writeBatch, addDoc, getDoc, deleteDoc 
} from "firebase/firestore";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

export type NotificationPriority = "HIGH" | "NORMAL" | "LOW";

export interface NotificationPayload {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  priority?: NotificationPriority;
  eventId?: string;
  targetId?: string;
  targetRoute?: string;
  route?: string;
  link?: string;
  postId?: string;
  relatedId?: string;
  transactionId?: string;
  messageId?: string;
  campaignId?: string;
  missionId?: string;
  contractId?: string;
  lotId?: string;
  gawaId?: string;
  audience?: string;
  groupCount?: number;
  isRead?: boolean;
  read?: boolean;
  createdAt?: string;
  readAt?: string | null;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export class NotificationService {
  static VAPID_KEY = process.env.VITE_FIREBASE_VAPID_KEY || "BPEg3H_yQG3t8F_tAIfjI0-R4x9R5-U0hV4K6A9xS4_aD9p5A-kC7t0I-M8eQf_eX7c3J4K9L1xR9S-pA";

  // In-memory anti-flood & deduplication map: key -> timestamp
  private static recentDispatches = new Map<string, number>();

  /**
   * Deterministic Event ID generator
   */
  static generateEventId(type: string, targetId: string, action: string = "event"): string {
    const cleanType = (type || "gen").toLowerCase().replace(/[^a-z0-9_]/g, "");
    const cleanTarget = (targetId || "target").replace(/[^a-z0-9_]/g, "");
    const cleanAction = (action || "act").toLowerCase().replace(/[^a-z0-9_]/g, "");
    return `${cleanType}_${cleanTarget}_${cleanAction}`;
  }

  /**
   * Initialize FCM with Service Worker & Token Persistence
   */
  static async initializeFCM(userId: string): Promise<string | null> {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        return null;
      }

      const supported = await isSupported();
      if (!supported) return null;

      const messaging = getMessaging(app);
      
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        let token = "";
        try {
          token = await getToken(messaging, { vapidKey: this.VAPID_KEY });
        } catch (tokenErr) {
          console.warn("FCM getToken direct error, continuing:", tokenErr);
        }

        if (token && userId && db) {
          await updateDoc(doc(db, "users", userId), {
            fcmToken: token,
            fcmTokenUpdatedAt: new Date().toISOString(),
            "notificationPrefs.fcmEnabled": true,
            isNativePushEnabled: true
          });
        }

        // Setup foreground handler
        onMessage(messaging, (payload) => {
          if (payload.notification) {
            const title = payload.notification.title || "AFRIGOMBO";
            const body = payload.notification.body || "";
            const route = payload.data?.targetRoute || payload.data?.route || "";
            this.showLocalNotification(title, body, route, payload.data?.eventId);
          }
        });

        return token || null;
      }
      return null;
    } catch (e) {
      console.warn("FCM Initialization failed gracefully:", e);
      return null;
    }
  }

  /**
   * Show local / system notification for the current browser
   */
  static showLocalNotification(title: string, body: string, route: string = "", eventId?: string) {
    if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
      const tag = eventId || `afrigombo-notif-${Date.now()}`;
      
      const options: any = {
        body,
        icon: "/pwa-192x192.png",
        badge: "/favicon.png",
        vibrate: [200, 100, 200],
        tag,
        data: { targetRoute: route, route }
      };

      try {
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, options);
          }).catch(() => {
            const n = new Notification(title, options);
            n.onclick = () => {
              n.close();
              this.handleNotificationNavigation(route);
            };
          });
        } else {
          const n = new Notification(title, options);
          n.onclick = () => {
            n.close();
            this.handleNotificationNavigation(route);
          };
        }
      } catch (err) {
        console.warn("Local notification display error:", err);
      }
    }
  }

  /**
   * Internal navigation helper for notification clicks
   */
  private static handleNotificationNavigation(route: string) {
    if (!route) {
      window.focus();
      return;
    }

    if (route.startsWith("/")) {
      window.location.hash = route;
    } else {
      window.location.hash = `/${route.replace(/^menu_/, "")}`;
    }
    window.focus();
  }

  /**
   * Central source of truth: send and persist notification
   */
  static async sendNotification(notif: Partial<NotificationPayload>): Promise<string | null> {
    if (!db) return null;
    try {
      const userId = notif.userId || "GLOBAL";

      // 1. Check user notification preferences if it's a specific user
      if (userId !== "SUPER_FOUNDER" && userId !== "GLOBAL" && userId !== "admin") {
        try {
          const userSnap = await getDoc(doc(db, "users", userId));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const prefs = userData.notificationPrefs;
            if (prefs) {
              if (prefs.masterEnabled === false) {
                console.log(`Skipping notification for user ${userId}: master notifications disabled.`);
                return null;
              }
              const typeKey = (notif.type || "").toLowerCase();
              if (typeKey.includes("message") && prefs.chatMessages === false) return null;
              if (typeKey.includes("wallet") && prefs.walletUpdates === false) return null;
              if (typeKey.includes("gombo") && prefs.gomboAlerts === false) return null;
            }
          }
        } catch (e) {
          console.warn("Could not check user notification preferences:", e);
        }
      }

      // 2. Resolve or generate unique eventId (Strict Deduplication)
      let eventId = notif.eventId;
      if (!eventId) {
        if (notif.transactionId) eventId = `tx_${notif.transactionId}`;
        else if (notif.messageId) eventId = `msg_${notif.messageId}`;
        else if (notif.campaignId) eventId = `campaign_${notif.campaignId}`;
        else if (notif.missionId) eventId = `mission_${notif.missionId}`;
        else if (notif.contractId) eventId = `contract_${notif.contractId}_${notif.type || 'status'}`;
        else if (notif.lotId) eventId = `lot_${notif.lotId}`;
        else if (notif.gawaId) eventId = `gawa_${notif.gawaId}_${notif.type || 'alert'}`;
        else if (notif.postId && (notif.type === "like" || notif.type === "comment")) {
          eventId = `${notif.type}_${notif.postId}_${notif.senderUid || notif.userId || Date.now()}`;
        } else {
          eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }
      }

      // 3. In-memory Anti-Flood Check (Drop identical events within 5 seconds)
      const floodKey = `${userId}_${notif.type}_${notif.targetId || notif.relatedId || ''}`;
      const now = Date.now();
      const lastSentTime = this.recentDispatches.get(floodKey);
      if (lastSentTime && now - lastSentTime < 5000 && !notif.priority?.includes("HIGH")) {
        console.log(`[NotificationService] Flood protection: skipped duplicate for key ${floodKey}`);
        return null;
      }
      this.recentDispatches.set(floodKey, now);

      // Clean old entries in memory
      if (this.recentDispatches.size > 200) {
        const oldestKeys = Array.from(this.recentDispatches.keys()).slice(0, 50);
        oldestKeys.forEach(k => this.recentDispatches.delete(k));
      }

      const notifsRef = collection(db, "notifications");

      // 4. Firestore Query Deduplication (Check existing eventId)
      if (eventId) {
        const existingQuery = query(notifsRef, where("eventId", "==", eventId), limit(1));
        const existingSnap = await getDocs(existingQuery);
        if (!existingSnap.empty) {
          console.log(`[NotificationService] Notification with eventId ${eventId} already exists. Skipping duplicate.`);
          return existingSnap.docs[0].id;
        }
      }

      // 5. Intelligent Prioritization
      let priority: NotificationPriority = notif.priority || "NORMAL";
      const highPriorityKeywords = [
        "message", "new_message", "wallet", "paiement", "payment", "retrait", "withdrawal",
        "securite", "security", "sécurité", "urgent", "achat", "lot", "lot_gagne",
        "gawa_win", "kyc", "validation", "code", "contrat_valide"
      ];
      const lowPriorityKeywords = ["like", "vue", "view", "secondary", "newsletter", "reminder_low"];

      const typeLower = (notif.type || "").toLowerCase();
      if (highPriorityKeywords.some(kw => typeLower.includes(kw))) {
        priority = "HIGH";
      } else if (lowPriorityKeywords.some(kw => typeLower.includes(kw))) {
        priority = "LOW";
      }

      // 6. Smart Grouping for non-critical frequent events (e.g. Likes, Comments, Views)
      const groupableTypes = ["LIKE", "like", "COMMENT", "comment", "new_favorite", "view"];
      const isCriticalEvent = priority === "HIGH" || ["wallet", "security", "lot", "gawa", "payment", "contract"].some(k => typeLower.includes(k));

      if (groupableTypes.includes(notif.type || "") && !isCriticalEvent) {
        const targetId = notif.targetId || notif.postId || notif.relatedId;
        if (targetId && userId) {
          const groupQuery = query(
            notifsRef,
            where("userId", "==", userId),
            where("type", "==", notif.type),
            where("targetId", "==", targetId),
            where("isRead", "==", false),
            orderBy("createdAt", "desc"),
            limit(1)
          );
          const groupDocs = await getDocs(groupQuery);
          if (!groupDocs.empty) {
            const existingDoc = groupDocs.docs[0];
            const data = existingDoc.data();
            const newCount = (data.groupCount || 1) + 1;

            let newMessage = notif.message || "";
            if (typeLower.includes("like")) {
              newMessage = `${newCount} personnes ont aimé votre publication.`;
            } else if (typeLower.includes("comment")) {
              newMessage = `${newCount} personnes ont commenté votre publication.`;
            } else if (typeLower.includes("favorite")) {
              newMessage = `${newCount} personnes ont ajouté votre profil à leurs favoris.`;
            }

            await updateDoc(existingDoc.ref, {
              groupCount: newCount,
              message: newMessage,
              updatedAt: new Date().toISOString()
            });

            return existingDoc.id;
          }
        }
      }

      // 7. Standardized Destination & Route Mapping
      let targetRoute = notif.targetRoute || notif.route || "";
      if (!targetRoute) {
        if (typeLower.includes("message")) targetRoute = "/messages";
        else if (typeLower.includes("wallet") || typeLower.includes("payment") || typeLower.includes("paiement") || typeLower.includes("retrait")) targetRoute = "/wallet";
        else if (typeLower.includes("contract") || typeLower.includes("contrat") || typeLower.includes("application")) targetRoute = "/contracts";
        else if (typeLower.includes("gawa")) targetRoute = "/gawa";
        else if (typeLower.includes("lot")) targetRoute = "/lots";
        else if (typeLower.includes("security") || typeLower.includes("sécurité")) targetRoute = "/security";
        else if (typeLower.includes("gombo") || typeLower.includes("terrain")) targetRoute = "/terrain";
        else targetRoute = "/notifications";
      }

      // 8. Build standardized Notification Document
      const newNotifDoc: NotificationPayload = {
        title: notif.title || "Notification AFRIGOMBO",
        message: notif.message || "",
        type: notif.type || "info",
        userId: userId,
        targetId: notif.targetId || notif.postId || notif.relatedId || "",
        targetRoute: targetRoute,
        eventId: eventId,
        priority: priority,
        groupCount: 1,
        isRead: false,
        read: false,
        createdAt: new Date().toISOString(),
        readAt: null,
        metadata: notif.metadata || {}
      };

      const docRef = await addDoc(notifsRef, newNotifDoc);

      // 9. Dispatch Native Push / Local Notification when required
      if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
        const isAppFocused = typeof document !== 'undefined' ? document.hasFocus() : false;
        const shouldTriggerPush = priority === "HIGH" || !isAppFocused;
        
        if (shouldTriggerPush) {
          this.showLocalNotification(newNotifDoc.title, newNotifDoc.message, targetRoute, eventId);
        }
      }

      return docRef.id;
    } catch (e) {
      console.error("[NotificationService] Failed to send notification:", e);
      return null;
    }
  }

  /**
   * Realtime Listener for a specific user's notifications
   */
  static listenUserNotifications(userId: string, callback: (notifs: NotificationPayload[]) => void): () => void {
    if (!db || !userId) return () => {};

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(80)
    );

    return onSnapshot(q, (snapshot) => {
      const notifs: NotificationPayload[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as NotificationPayload)
      }));
      callback(notifs);
    }, (err) => {
      console.warn("[NotificationService] Listener error:", err);
    });
  }

  /**
   * Mark a single notification as read across devices
   */
  static async markAsRead(notifId: string): Promise<void> {
    if (!db || !notifId) return;
    try {
      await updateDoc(doc(db, "notifications", notifId), {
        isRead: true,
        read: true,
        readAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn("[NotificationService] markAsRead error:", err);
    }
  }

  /**
   * Mark all notifications of a user as read
   */
  static async markAllAsRead(userId: string): Promise<void> {
    if (!db || !userId) return;
    try {
      const q1 = query(collection(db, "notifications"), where("userId", "==", userId), where("isRead", "==", false));
      const q2 = query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false));
      
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const docsMap = new Map<string, any>();
      snap1.docs.forEach(d => docsMap.set(d.id, d));
      snap2.docs.forEach(d => docsMap.set(d.id, d));

      const batch = writeBatch(db);
      docsMap.forEach((d) => {
        batch.update(doc(db, "notifications", d.id), {
          isRead: true,
          read: true,
          readAt: new Date().toISOString()
        });
      });

      await batch.commit();
    } catch (err) {
      console.warn("[NotificationService] markAllAsRead error:", err);
    }
  }

  /**
   * Delete a single notification
   */
  static async deleteNotification(notifId: string): Promise<void> {
    if (!db || !notifId) return;
    try {
      await deleteDoc(doc(db, "notifications", notifId));
    } catch (err) {
      console.warn("[NotificationService] deleteNotification error:", err);
    }
  }

  /**
   * Delete all notifications of a user
   */
  static async deleteAllNotifications(userId: string): Promise<void> {
    if (!db || !userId) return;
    try {
      const q = query(collection(db, "notifications"), where("userId", "==", userId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(doc(db, "notifications", d.id)));
      await batch.commit();
    } catch (err) {
      console.warn("[NotificationService] deleteAllNotifications error:", err);
    }
  }
}
