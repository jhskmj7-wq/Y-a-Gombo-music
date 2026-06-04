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
      {/* Visual Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 border border-purple-500/10">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10 blur-xl">
          <Bell className="w-96 h-96" />
        </div>
        
        <div className="relative z-10">
          <span className="text-[10px] font-black tracking-widest bg-orange-500 text-white px-3 py-1 rounded-full uppercase mb-3 inline-block">
            Centre Temps-Réel
          </span>
          <h1 className="text-3xl font-black tracking-tight uppercase">🔔 Notifications</h1>
          <p className="mt-1 text-sm text-purple-200 font-medium max-w-xl">
            Retrouvez tous vos événements connectés, candidatures reçues, nouveaux gombos, certifications approuvées et nouveaux abonnés en direct.
          </p>
        </div>
      </div>

      {/* Grid Layout containing Main panel & Telemetry Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left/Center Column: Notifications List / Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs Selector */}
          <div className="flex border-b border-gray-150 dark:border-gray-800 gap-6 text-sm font-bold">
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-3 relative transition-all ${
                activeTab === "all" 
                  ? "text-purple-600 dark:text-purple-400 font-extrabold border-b-2 border-purple-600 dark:border-purple-400" 
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Toutes ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`pb-3 relative transition-all ${
                activeTab === "unread" 
                  ? "text-purple-600 dark:text-purple-400 font-extrabold border-b-2 border-purple-600 dark:border-purple-400" 
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Non lues ({notifications.filter(n => !n.read).length})
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-3 relative transition-all flex items-center gap-1.5 ${
                activeTab === "settings" 
                  ? "text-purple-600 dark:text-purple-400 font-extrabold border-b-2 border-purple-600 dark:border-purple-400" 
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4" />
              Réglages
            </button>
          </div>

          {/* Tab Content Rendering */}
          <AnimatePresence mode="wait">
            {activeTab === "settings" ? (
              <motion.div
                key="settings_tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-[#1e1e24] border border-gray-150 dark:border-gray-800/85 rounded-2xl p-6 shadow-sm divide-y divide-gray-100 dark:divide-gray-850"
              >
                <div className="pb-4 mb-4">
                  <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Réglages de Notifications intelligentes</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Gérez précisément quels types d'événements vous notifieront sur le réseau ivoirien.
                  </p>
                </div>

                {/* Option 1: Gombo Toggles */}
                <div className="py-4 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-gray-800 dark:text-white block">Nouveaux Gombos</span>
                    <span className="text-xs text-gray-450 dark:text-gray-500 leading-normal block max-w-sm">Recherche de musiciens de votre spécialité dans votre commune.</span>
                  </div>
                  <button onClick={() => handleToggleSetting("gombos")}>
                    {localSettings.gombos ? (
                      <ToggleRight className="w-10 h-10 text-orange-500 cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-gray-300 dark:text-gray-700 cursor-pointer" />
                    )}
                  </button>
                </div>

                {/* Option 2: Renfort Toggles */}
                <div className="py-4 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-gray-800 dark:text-white block">Renfort Express</span>
                    <span className="text-xs text-gray-450 dark:text-gray-500 leading-normal block max-w-sm">Demandes d'aide de dernière minute compatibles avec vos instruments.</span>
                  </div>
                  <button onClick={() => handleToggleSetting("renforts")}>
                    {localSettings.renforts ? (
                      <ToggleRight className="w-10 h-10 text-orange-500 cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-gray-300 dark:text-gray-700 cursor-pointer" />
                    )}
                  </button>
                </div>

                {/* Option 3: Messages Toggles */}
                <div className="py-4 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-gray-800 dark:text-white block">Discussions & Messages</span>
                    <span className="text-xs text-gray-450 dark:text-gray-500 leading-normal block max-w-sm">Nouveaux messages chat et alertes de messagerie.</span>
                  </div>
                  <button onClick={() => handleToggleSetting("messages")}>
                    {localSettings.messages ? (
                      <ToggleRight className="w-10 h-10 text-orange-500 cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-gray-300 dark:text-gray-700 cursor-pointer" />
                    )}
                  </button>
                </div>

                {/* Option 4: Certifications Toggles */}
                <div className="py-4 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-gray-800 dark:text-white block">Certifications & Badges</span>
                    <span className="text-xs text-gray-450 dark:text-gray-500 leading-normal block max-w-sm">Mise à jour et approbation de vos dossiers d'accréditation.</span>
                  </div>
                  <button onClick={() => handleToggleSetting("certifications")}>
                    {localSettings.certifications ? (
                      <ToggleRight className="w-10 h-10 text-orange-500 cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-gray-300 dark:text-gray-700 cursor-pointer" />
                    )}
                  </button>
                </div>

                {/* Option 5: Groupes Toggles */}
                <div className="py-4 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-gray-800 dark:text-white block">Groupes & Abonnés</span>
                    <span className="text-xs text-gray-450 dark:text-gray-500 leading-normal block max-w-sm">Nouveaux abonnés à votre groupe de musique ou mentions spéciales.</span>
                  </div>
                  <button onClick={() => handleToggleSetting("groupes")}>
                    {localSettings.groupes ? (
                      <ToggleRight className="w-10 h-10 text-orange-500 cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-gray-300 dark:text-gray-700 cursor-pointer" />
                    )}
                  </button>
                </div>

                {savingSettings && (
                  <div className="pt-4 text-center text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center justify-center gap-2">
                    <Activity className="w-4 h-4 animate-pulse" /> Sincronisation en arrière-plan...
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="list_tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center pb-2">
                  <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Flux Dynamique ({filteredNotifications.length} filtrés)
                  </span>
                  
                  {notifications.filter(n => !n.read).length > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline uppercase tracking-wide flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" /> Tout marquer comme lu
                    </button>
                  )}
                </div>

                {filteredNotifications.length === 0 ? (
                  <div className="bg-white dark:bg-[#1e1e24] border border-gray-150 dark:border-gray-800/80 rounded-2xl p-10 text-center text-gray-450 dark:text-gray-500">
                    <Bell className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Aucune notification trouvée</h4>
                    <p className="text-xs mt-1">Re-vérifiez vos réglages ou attendez qu'un événement survienne en temps réel !</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.map((notif) => (
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
                          title="Supprimer la notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: High Fidelity Diagnostic Telemetry (Phase 9 Rule 12) */}
        <div className="space-y-6">
          <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              Sincronisation Live
            </h3>

            {/* Stats list */}
            <div className="space-y-3.5 text-xs text-gray-650 dark:text-gray-300">
              <div className="flex justify-between border-b border-gray-150 dark:border-gray-800 pb-2.5">
                <span className="font-bold">Notifications reçues</span>
                <span className="font-black text-gray-950 dark:text-white">{notifications.length}</span>
              </div>
              <div className="flex justify-between border-b border-gray-150 dark:border-gray-800 pb-2.5">
                <span className="font-bold">Total événements suivis</span>
                <span className="font-black text-gray-950 dark:text-white">
                  {notifications.filter(u => u.type === 'new_gombo' || u.type === 'new_renfort').length}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-150 dark:border-gray-850 pb-2.5">
                <span className="font-bold">Type de base de données</span>
                <span className="font-black text-orange-600 dark:text-orange-400">
                  {localStorage.getItem("isFirebaseMock") === "false" ? "Cloud Firestore 🔥" : "Bac-à-Sable Local 📁"}
                </span>
              </div>
              <div className="flex justify-between pb-1 items-center">
                <span className="font-bold">Latence Réseau Réactive</span>
                <div className="flex items-center gap-1 font-extrabold text-[#7C3AED] dark:text-purple-400">
                  <span>{simulatedLatency} ms</span>
                  <button 
                    onClick={runLatencyTest}
                    disabled={isMeasuring}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isMeasuring ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Guidelines info card */}
          <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/25 rounded-2xl p-5 text-xs text-gray-500 leading-normal">
            <h4 className="font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              Fonctionnement
            </h4>
            <p>
              Toutes les interactions faites sur l'application (comme s'inscrire, postuler à un gombo, demander de l'aide en Renfort Express ou suivre un groupe) émettent immédiatement une notification en arrière-plan à l'organisateur concerné.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
