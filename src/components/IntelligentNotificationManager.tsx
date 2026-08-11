import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Crown, X, ExternalLink, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { db, gomboDB } from "../firebase";
import { collection, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";
import { audioSynth } from "../lib/audio";

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
  
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  const isFounderUser = currentUser?.email?.toLowerCase() === "jhs.kmj7@gmail.com" || profile?.isFounder || profile?.role === "admin" || profile?.role === "super_admin";

  useEffect(() => {
    if (!currentUser) return;

    // Load previously seen notification IDs from sessionStorage to prevent duplicate popups on reload/strictMode
    try {
      const stored = sessionStorage.getItem("afrigombo_seen_notif_ids");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach(id => seenIdsRef.current.add(id));
        }
      }
    } catch (_) {}

    // Listen to user notifications
    const unsubUserNotifs = gomboDB.listenUserNotifications(currentUser.uid, (notifs) => {
      processIncomingNotifications(notifs, false);
    });

    let unsubFounderNotifs: (() => void) | undefined;
    if (isFounderUser) {
      // Listen to admin / founder notifications collection if available
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

    // After 3 seconds, mark initial load as false so future changes trigger popups & sounds
    const timer = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 3000);

    return () => {
      if (unsubUserNotifs) unsubUserNotifs();
      if (unsubFounderNotifs) unsubFounderNotifs();
      clearTimeout(timer);
    };
  }, [currentUser, isFounderUser]);

  const processIncomingNotifications = (notifs: any[], isFounderStream: boolean) => {
    if (!notifs || notifs.length === 0) return;

    const newPopups: PopupNotification[] = [];

    notifs.forEach(n => {
      const notifId = n.id || n.notificationId || `${n.timestamp || Date.now()}`;
      if (seenIdsRef.current.has(notifId)) return;

      // Mark as seen
      seenIdsRef.current.add(notifId);
      try {
        const arr = Array.from(seenIdsRef.current).slice(-100);
        sessionStorage.setItem("afrigombo_seen_notif_ids", JSON.stringify(arr));
      } catch (_) {}

      if (isInitialLoadRef.current) {
        // Skip popup & sound on initial page load sync, only populate seen list
        return;
      }

      const isFounderNotif = isFounderStream || n.isFounder || n.type === "founder_alert" || n.audience === "Super Fondateur" || (n.title || "").includes("Fondateur");
      
      const title = isFounderNotif ? "CENTRE FONDATEUR AFRIGOMBO" : "SUPPORT OFFICIEL AFRIGOMBO";
      const message = n.message || n.description || n.content || "Vous avez reçu une nouvelle notification officielle.";
      
      const targetPath = n.targetPath || n.link || (isFounderNotif ? "/Le-Trone-Du-Fondateur" : "/notifications");
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
      setActivePopups(prev => [...newPopups, ...prev].slice(0, 3)); // Max 3 visible stack
    }
  };

  const dismissPopup = (id: string) => {
    setActivePopups(prev => prev.filter(p => p.id !== id));
  };

  const handlePopupClick = (popup: PopupNotification) => {
    dismissPopup(popup.id);
    if (popup.targetPath) {
      navigate(popup.targetPath);
    }
  };

  return (
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
                  {popup.isFounder ? "👑 CENTRE FONDATEUR AFRIGOMBO" : "🔔 S-O-A / SUPPORT OFFICIEL AFRIGOMBO"}
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
  );
}
