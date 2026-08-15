import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Crown, X, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { gomboDB } from "../firebase";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import { audioSynth } from "../lib/audio";
import { isCapacitor, initializePushNotifications } from "../lib/capacitor-adapter";

interface PopupNotification {
  id: string;
  title: string;
  message: string;
  isFounder: boolean;
  targetPath?: string;
  targetId?: string;
  type?: string;
  priority?: string;
}

export function IntelligentNotificationManager() {
  const { currentUser, profile } = useAuth();
  const navigate = useNavigate();
  const [activePopups, setActivePopups] = useState<PopupNotification[]>([]);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  const isFounderUser = currentUser?.email?.toLowerCase() === "jhs.kmj7@gmail.com" || profile?.isFounder || profile?.role === "admin" || profile?.role === "super_admin";

  useEffect(() => {
    if (!currentUser) return;

    // Load seen IDs from sessionStorage
    try {
      const stored = sessionStorage.getItem("afrigombo_seen_notif_ids");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach(id => seenIdsRef.current.add(id));
        }
      }
    } catch (_) {}

    // Check if notification permission is needed (browser/phone system notifications)
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        const storedPermission = localStorage.getItem("afrigombo_system_notif_permission");
        if (Notification.permission === "default" && !storedPermission) {
          const dismissed = sessionStorage.getItem("afrigombo_notif_banner_dismissed");
          if (!dismissed) {
            const pt = setTimeout(() => setShowPermissionBanner(true), 4000);
            return () => clearTimeout(pt);
          }
        }
      }
    } catch (_) {}

    // Listen to user notifications
    const unsubUserNotifs = gomboDB.listenUserNotifications(currentUser.uid, (notifs) => {
      processIncomingNotifications(notifs, false);
    });

    let unsubFounderNotifs: (() => void) | undefined;
    if (isFounderUser) {
      try {
        const qFounder = query(collection(db, "founder_notifications"), orderBy("createdAt", "desc"), limit(20));
        unsubFounderNotifs = onSnapshot(qFounder, (snapshot) => {
          const founderNotifs: any[] = [];
          snapshot.forEach(docSnap => {
            founderNotifs.push({ id: docSnap.id, ...docSnap.data() });
          });
          processIncomingNotifications(founderNotifs, true);
        }, (err) => {
          console.warn("Founder notification sync limited:", err);
        });
      } catch (e) {
        // fallback
      }
    }

    // Listen for Service Worker navigation messages (PWA background click seamless transition)
    let hasMessageListener = false;
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "NAVIGATE" && event.data.url) {
        const url = event.data.url;
        if (url.startsWith("/")) {
          navigate(url);
        } else {
          navigate(`/${url.replace(/^menu_/, "")}`);
        }
      }
    };

    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
      hasMessageListener = true;
    }

    const timer = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 2000);

    return () => {
      if (unsubUserNotifs) unsubUserNotifs();
      if (unsubFounderNotifs) unsubFounderNotifs();
      clearTimeout(timer);
      if (hasMessageListener && typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
    };
  }, [currentUser, isFounderUser, navigate]);

  const requestSystemNotificationPermission = async () => {
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setShowPermissionBanner(false);
          localStorage.setItem("afrigombo_system_notif_permission", "granted");

          // Save push token in user's profile database if user exists
          let pushToken = "";
          try {
            if ("serviceWorker" in navigator) {
              const reg = await navigator.serviceWorker.ready;
              if (isCapacitor()) {
                await initializePushNotifications(currentUser?.uid);
              } else if ("pushManager" in reg) {
                let sub = await reg.pushManager.getSubscription();
                if (!sub) {
                  try {
                    sub = await reg.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: "BEl69bOI98J8VCwiuJZfUrC-60vS-mS-T_5_nNlM9b0-X9-C9_8_"
                    });
                  } catch (e) {
                    console.warn("Raw PushManager subscription fail:", e);
                  }
                }
                if (sub) {
                  pushToken = JSON.stringify(sub);
                }
              }
            }
          } catch (swErr) {
            console.warn("Service worker register token error:", swErr);
          }

          if (!pushToken) {
            pushToken = `web-push-${currentUser?.uid || 'guest'}-${Math.random().toString(36).substring(2, 11)}`;
          }

          if (currentUser?.uid && db) {
            try {
              const userDocRef = doc(db, "users", currentUser.uid);
              await updateDoc(userDocRef, {
                fcmDeviceToken: pushToken,
                lastDeviceActivity: new Date().toISOString(),
                isNativePushEnabled: true,
                notificationPermission: "granted"
              });
            } catch (dbErr) {
              console.warn("Non-fatal error updating push token in Firestore:", dbErr);
            }
          }

          // Trigger Success native notification with official S-O-A identity
          try {
            const sysTitle = "AFRIGOMBO";
            const sysBody = "SUPPORT OFFICIEL AFRIGOMBO\n\nNotifications en direct activées avec succès ! ✅";
            if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(sysTitle, {
                  body: sysBody,
                  icon: "/pwa-192x192.png",
                  badge: "/favicon.png",
                  tag: "permission-success",
                  data: { targetPath: "/notifications" }
                } as any);
              }).catch(() => {
                new Notification(sysTitle, { body: sysBody, icon: "/pwa-192x192.png", tag: "permission-success" });
              });
            } else {
              new Notification(sysTitle, { body: sysBody, icon: "/pwa-192x192.png", tag: "permission-success" });
            }
          } catch (_) {}
        } else {
          setShowPermissionBanner(false);
          localStorage.setItem("afrigombo_system_notif_permission", "denied");
          sessionStorage.setItem("afrigombo_notif_banner_dismissed", "true");
        }
      }
    } catch (e) {
      setShowPermissionBanner(false);
    }
  };

  const dismissPermissionBanner = () => {
    setShowPermissionBanner(false);
    try {
      sessionStorage.setItem("afrigombo_notif_banner_dismissed", "true");
    } catch (_) {}
  };

  const processIncomingNotifications = (notifs: any[], isFounderStream: boolean) => {
    if (!notifs || notifs.length === 0) return;

    const newPopups: PopupNotification[] = [];

    notifs.forEach(n => {
      const notifId = n.id || n.notificationId || `${n.timestamp || Date.now()}`;
      if (seenIdsRef.current.has(notifId)) return;

      seenIdsRef.current.add(notifId);
      try {
        const arr = Array.from(seenIdsRef.current).slice(-200);
        sessionStorage.setItem("afrigombo_seen_notif_ids", JSON.stringify(arr));
      } catch (_) {}

      // Do not popup or play sound if initial page load or if notification is already read
      if (isInitialLoadRef.current || n.isRead || n.read) {
        return;
      }

      // Do not popup notifications older than 2 minutes (prevent offline backlog replay)
      if (n.createdAt) {
        const ageMs = Date.now() - new Date(n.createdAt).getTime();
        if (ageMs > 2 * 60 * 1000) {
          return;
        }
      }

      const isFounderNotif = isFounderStream || n.isFounder || n.type === "founder_alert" || n.audience === "Super Fondateur" || (n.title || "").includes("Fondateur");
      
      const title = isFounderNotif ? "CENTRE FONDATEUR AFRIGOMBO" : (n.title || "SUPPORT OFFICIEL AFRIGOMBO");
      const message = n.message || n.description || n.content || "Vous avez reçu une nouvelle notification officielle.";
      
      let targetPath = n.targetRoute || n.targetPath || n.link || "";
      if (!targetPath) {
        targetPath = isFounderNotif ? "/Le-Trone-Du-Fondateur" : "/notifications";
      }
      const targetId = n.targetId || n.relatedId;

      newPopups.push({
        id: notifId,
        title,
        message,
        isFounder: isFounderNotif,
        targetPath,
        targetId,
        type: n.type,
        priority: n.priority
      });

      // Trigger Native Phone/Browser System Notification if permitted and window is unfocused or priority HIGH
      try {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          const sysTitle = isFounderNotif ? "CENTRE FONDATEUR AFRIGOMBO" : "AFRIGOMBO";
          const sysBody = isFounderNotif ? message : `${n.title ? n.title + '\n' : ''}${message}`;

          if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification(sysTitle, {
                body: sysBody,
                icon: "/pwa-192x192.png",
                badge: "/favicon.png",
                tag: notifId, // Anti-duplication native tag
                vibrate: [200, 100, 200],
                data: { targetPath }
              } as any);
            }).catch(() => {
              const nativeNotif = new Notification(sysTitle, { body: sysBody, icon: "/pwa-192x192.png", tag: notifId });
              nativeNotif.onclick = () => {
                window.focus();
                if (targetPath) navigate(targetPath);
                nativeNotif.close();
              };
            });
          } else {
            const nativeNotif = new Notification(sysTitle, { body: sysBody, icon: "/pwa-192x192.png", tag: notifId });
            nativeNotif.onclick = () => {
              window.focus();
              if (targetPath) navigate(targetPath);
              nativeNotif.close();
            };
          }
        }
      } catch (err) {
        // Native notification fallback
      }

      // Play audio sound safely
      try {
        if (isFounderNotif) {
          audioSynth.playFounderNotificationSound();
        } else {
          audioSynth.playUserNotificationSound();
        }
      } catch (err) {
        // audio policy fallback
      }
    });

    if (newPopups.length > 0) {
      setActivePopups(prev => [...newPopups, ...prev].slice(0, 3));
    }
  };

  const dismissPopup = (id: string) => {
    setActivePopups(prev => prev.filter(p => p.id !== id));
  };

  const handlePopupClick = async (popup: PopupNotification) => {
    dismissPopup(popup.id);
    if (popup.id) {
      try {
        await gomboDB.markNotificationAsRead(popup.id);
      } catch (_) {}
    }
    if (popup.targetPath) {
      if (popup.targetPath.startsWith("/")) {
        navigate(popup.targetPath);
      } else {
        navigate(`/${popup.targetPath.replace(/^menu_/, "")}`);
      }
    }
  };

  return (
    <>
      {/* 📱 System Notification Permission Banner */}
      <AnimatePresence>
        {showPermissionBanner && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[99998] bg-zinc-950/95 border border-afri-gold/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-afri-text flex flex-col gap-3"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-afri-gold/15 border border-afri-gold/30 rounded-xl text-afri-gold shrink-0">
                <Smartphone className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-grow">
                <h4 className="text-xs font-mono font-black text-afri-gold uppercase tracking-wider">
                  Notifications Téléphone AFRIGOMBO
                </h4>
                <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
                  Activez les notifications pour recevoir les alertes officielles et messages du Fondateur directement sur votre appareil.
                </p>
              </div>
              <button
                onClick={dismissPermissionBanner}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 justify-end pt-1">
              <button
                onClick={dismissPermissionBanner}
                className="px-3 py-1.5 text-[11px] font-mono text-gray-400 hover:text-white transition-colors"
              >
                Plus tard
              </button>
              <button
                onClick={requestSystemNotificationPermission}
                className="px-4 py-1.5 bg-afri-gold text-black font-mono font-bold text-[11px] rounded-xl hover:bg-afri-gold/90 transition-all shadow-lg cursor-pointer"
              >
                Activer les notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔔 In-App Floating Popup Notifications */}
      <div aria-live="polite" className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] w-full max-w-md px-4 pointer-events-none flex flex-col gap-2">
        <AnimatePresence>
          {activePopups.map((popup) => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={() => handlePopupClick(popup)}
              className={`pointer-events-auto cursor-pointer rounded-2xl p-4 shadow-2xl border backdrop-blur-xl flex items-start gap-3 transition-all ${
                popup.isFounder
                  ? "bg-gradient-to-r from-afri-bg-sec/95 via-zinc-900/95 to-afri-bg-sec/95 border-afri-gold text-afri-text shadow-[0_10px_30px_rgba(212,175,55,0.25)]"
                  : "bg-gradient-to-r from-zinc-950/95 via-zinc-900/95 to-zinc-950/95 border-blue-500/40 text-afri-text shadow-[0_10px_30px_rgba(59,130,246,0.25)]"
              }`}
            >
              <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${
                popup.isFounder 
                  ? "bg-afri-gold/15 border-afri-gold/40 text-afri-gold" 
                  : "bg-blue-500/15 border-blue-500/40 text-blue-400"
              }`}>
                {popup.isFounder ? <Crown className="w-5 h-5 animate-pulse" /> : <Bell className="w-5 h-5" />}
              </div>

              <div className="flex-grow min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                    popup.isFounder ? "bg-afri-gold/20 text-afri-gold" : "bg-blue-500/20 text-blue-300"
                  }`}>
                    {popup.isFounder ? "👑 CENTRE FONDATEUR AFRIGOMBO" : "🔔 S-O-A | SUPPORT OFFICIEL AFRIGOMBO"}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-200 mt-1 line-clamp-2 leading-relaxed">
                  {popup.message}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissPopup(popup.id);
                }}
                className="shrink-0 p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
