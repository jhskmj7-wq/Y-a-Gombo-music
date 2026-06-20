import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, Check, Trash2, Settings, ShieldAlert, Wifi, Sparkles, 
  Clock, Briefcase, Music, UserCheck, MessageSquare, ToggleLeft, ToggleRight,
  Info, Activity, Heart, RefreshCw
} from "lucide-react";
import { gomboDB } from "../firebase";
import { GomboNotification, UserProfile } from "../types";

interface NotificationCenterProps {
  currentUserProfile: UserProfile;
  notifications: GomboNotification[];
  onRefreshProfile: () => void;
  onNavigateHome: () => void;
}

export default function NotificationCenter({ 
  currentUserProfile, 
  notifications, 
  onRefreshProfile,
  onNavigateHome 
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "settings">("all");
  const [savingSettings, setSavingSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    gombos: true,
    renforts: true,
    messages: true,
    certifications: true,
    groupes: true
  });

  const [simulatedLatency, setSimulatedLatency] = useState(18);
  const [isMeasuring, setIsMeasuring] = useState(false);

  // Initialize notification settings
  useEffect(() => {
    if (currentUserProfile.notificationSettings) {
      setLocalSettings({
        gombos: currentUserProfile.notificationSettings.gombos ?? true,
        renforts: currentUserProfile.notificationSettings.renforts ?? true,
        messages: currentUserProfile.notificationSettings.messages ?? true,
        certifications: currentUserProfile.notificationSettings.certifications ?? true,
        groupes: currentUserProfile.notificationSettings.groupes ?? true
      });
    }
  }, [currentUserProfile]);

  // Run a quick telemetry latency benchmark
  const runLatencyTest = () => {
    setIsMeasuring(true);
    const start = performance.now();
    setTimeout(() => {
      const end = performance.now();
      setSimulatedLatency(Math.round((end - start) / 5) + 8);
      setIsMeasuring(false);
    }, 400);
  };

  // Filter out notifications based on current checkboxes/switches configuration (Phase 9 Rule 8)
  const filteredNotifications = notifications.filter(notif => {
    if (notif.type === "new_gombo" && !localSettings.gombos) return false;
    if (notif.type === "new_renfort" && !localSettings.renforts) return false;
    if (notif.type === "message" && !localSettings.messages) return false;
    if (notif.type === "certification_approved" && !localSettings.certifications) return false;
    if (notif.type === "new_follower" && !localSettings.groupes) return false;
    
    // Tab filters
    if (activeTab === "unread") return !notif.read;
    return true;
  });

  const handleToggleSetting = async (key: keyof typeof localSettings) => {
    const updated = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(updated);
    setSavingSettings(true);
    try {
      await gomboDB.updateUserProfile(currentUserProfile.uid, {
        notificationSettings: updated
      });
      onRefreshProfile();
    } catch (err) {
      console.error("Failed saving notification settings:", err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const notif of unread) {
      await gomboDB.markNotificationAsRead(notif.id);
    }
  };

  const handleDeleteNotif = async (id: string) => {
    try {
      await gomboDB.deleteNotification(id);
    } catch (err) {
      console.error("Failed deleting notification:", err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "new_gombo":
        return <Briefcase className="w-4 h-4 text-orange-500" />;
      case "new_renfort":
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case "new_application":
      case "application_accepted":
        return <UserCheck className="w-4 h-4 text-purple-500" />;
      case "certification_approved":
        return <Music className="w-4 h-4 text-green-500" />;
      case "new_follower":
        return <Heart className="w-4 h-4 text-rose-500" />;
      case "message":
        return <MessageSquare className="w-4 h-4 text-teal-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 1.5. L'ÉCOSYSTÈME 2.0 - UNIVERSE OF RICH SERVICES (Simplified view) */}
      <div className="space-y-6">
        {/* Header of section */}
        <div className="border-b border-gray-150 dark:border-gray-800 pb-4 mb-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase text-gray-900 dark:text-white">🔔 Notifications</h1>
              <p className="text-xs text-gray-500 mt-1">Vos actualités en temps réel.</p>
            </div>
            {notifications.filter(n => !n.read).length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline uppercase tracking-wide flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> Tout marquer comme lu
              </button>
            )}
        </div>

        {/* Content */}
        <div className="space-y-4">
            {notifications.length === 0 ? (
                <div className="bg-white dark:bg-[#1e1e24] border border-gray-150 dark:border-gray-800/80 rounded-2xl p-10 text-center text-gray-450 dark:text-gray-500">
                    <Bell className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Aucune notification</h4>
                    <p className="text-xs mt-1">Attendez qu'un événement survienne en temps réel !</p>
                </div>
            ) : (
                <div className="space-y-3">
                {notifications.map((notif) => (
                    <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`p-4 bg-white dark:bg-[#1e1e24] border border-gray-150 dark:border-gray-800/80 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-start gap-4 ${
                        !notif.read ? "ring-2 ring-purple-600/10 dark:ring-purple-400/10 border-purple-200" : ""
                    }`}
                    >
                    {/* Type Icon Banner */}
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 shrink-0">
                        {getNotifIcon(notif.type)}
                    </div>

                    {/* Text details */}
                    <div className="flex-1 min-w-0" onClick={async () => {
                        if (!notif.read) {
                        await gomboDB.markNotificationAsRead(notif.id);
                        }
                    }}>
                        <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-gray-900 dark:text-white block cursor-pointer">
                            {notif.title}
                        </span>
                        {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-red-500 inline-block shrink-0" />
                        )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                        {notif.message}
                        </p>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.createdAt).toLocaleString("fr-FR")}
                        </span>
                    </div>

                    {/* Actions */}
                    <button
                        onClick={() => handleDeleteNotif(notif.id)}
                        className="p-1.5 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 text-gray-400 dark:text-gray-600 rounded-lg transition-colors shrink-0"
                        title="Supprimer"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    </motion.div>
                ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
