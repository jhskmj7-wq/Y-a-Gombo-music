import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { Megaphone, X, Info, AlertTriangle, Activity, Calendar, Settings, Plus } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function GlobalNotificationBanner() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const { currentUser, profile } = useAuth();
  const { notificationsEnabled } = useTheme();

  useEffect(() => {
    // Check local storage for dismissed notifications
    try {
      const stored = localStorage.getItem("afrigombo_dismissed_notifs");
      if (stored) {
        setDismissed(JSON.parse(stored));
      }
    } catch (e) {}

    const q = query(
      collection(db, "global_notifications"),
      where("isActive", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: any[] = [];
      const now = new Date();
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Check expiration
        if (new Date(data.expiresAt) > now) {
          notifs.push({ id: doc.id, ...data });
        }
      });
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, []);

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissed, id];
    setDismissed(newDismissed);
    try {
      localStorage.setItem("afrigombo_dismissed_notifs", JSON.stringify(newDismissed));
    } catch (e) {}
  };

  // Filter based on target
  const visibleNotifs = notifications.filter((notif) => {
    if (dismissed.includes(notif.id)) return false;

    // Default to show if no profile yet, or handle specific targeting
    const target = notif.target;
    if (target === "Tous les utilisateurs") return true;
    
    if (!profile) return false;

    if (target === "Tous les musiciens" && profile.role === "artist") return true;
    if (target === "Tous les créateurs" && profile.role === "creator") return true;
    if (target === "Tous les administrateurs" && profile.role === "admin") return true;
    // Assuming "Premium" check might be based on some profile field
    if (target === "Tous les Premium" && profile.isPremium) return true;

    return false;
  });

  if (!notificationsEnabled || visibleNotifs.length === 0) return null;

  // Show the most recent one (or highest priority)
  // Let's sort by priority: Urgente > Importante > Normale
  const priorityScore = (p: string) => p === "Urgente" ? 3 : p === "Importante" ? 2 : 1;
  const sorted = [...visibleNotifs].sort((a, b) => {
    return priorityScore(b.priority) - priorityScore(a.priority);
  });

  const activeNotif = sorted[0];

  const bgColor = 
    activeNotif.priority === "Urgente" ? "bg-red-500 text-afri-text" :
    activeNotif.priority === "Importante" ? "bg-afri-bg-sec text-black" :
    "bg-blue-600 text-afri-text";

  const borderColor = 
    activeNotif.priority === "Urgente" ? "border-red-400" :
    activeNotif.priority === "Importante" ? "border-amber-300" :
    "border-blue-400";

  return (
    <div className={`w-full ${bgColor} border-b ${borderColor} px-4 py-3 flex items-start sm:items-center justify-between gap-4 z-[100] animate-fadeIn`}>
      <div className="flex items-start sm:items-center gap-3">
        <div className="shrink-0 mt-0.5 sm:mt-0">
          {activeNotif.priority === "Urgente" ? <AlertTriangle className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="font-bold text-sm tracking-wide flex items-center gap-2">
            {activeNotif.titre}
            <span className="text-[9px] uppercase tracking-wider font-mono bg-afri-bg/20 px-1.5 py-0.5 rounded">
              {activeNotif.type}
            </span>
          </h4>
          <p className="text-xs mt-1 opacity-90 max-w-3xl line-clamp-2">{activeNotif.description}</p>
          {activeNotif.lien && (
            <a href={activeNotif.lien} target="_blank" rel="noopener noreferrer" className="text-xs font-bold underline mt-1 block hover:opacity-80">
              En savoir plus
            </a>
          )}
        </div>
      </div>
      <button 
        onClick={() => handleDismiss(activeNotif.id)}
        className="shrink-0 p-1.5 hover:bg-afri-bg/20 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
