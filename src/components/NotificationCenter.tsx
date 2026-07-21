import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, Check, Trash2, ShieldAlert, 
  Clock, Briefcase, Music, UserCheck, MessageSquare,
  Info, Crown, Megaphone, Zap, Sparkles, AlertTriangle, 
  BadgeCheck, Heart, ShieldCheck, Wallet, RefreshCw, Smartphone
} from "lucide-react";
import { gomboDB } from "../firebase";
import { GomboNotification, UserProfile, AppNotification } from "../types";

interface NotificationCenterProps {
  currentUserProfile: UserProfile;
  notifications: (GomboNotification | AppNotification)[];
  onRefreshProfile: () => void;
  onNavigateHome: () => void;
  onBack?: () => void;
  onNavigateTo?: (menu: string, relatedId?: string) => void;
}

export default function NotificationCenter({ 
  currentUserProfile, 
  notifications, 
  onRefreshProfile,
  onNavigateHome,
  onBack,
  onNavigateTo
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  
  // Push Notification Simulation / Preparation states
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" ? (Notification.permission || "default") : "default"
  );
  const [fcmToken, setFcmToken] = useState<string>(() => localStorage.getItem("gombo_sim_fcm_token") || "");
  const [isRequestingPush, setIsRequestingPush] = useState(false);

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === "unread") {
      return !(notif as any).isRead && !(notif as any).read;
    }
    return true;
  });

  const handleMarkAllRead = async () => {
    if (!currentUserProfile?.uid) return;
    try {
      await gomboDB.markAllUserNotificationsAsRead(currentUserProfile.uid);
      onRefreshProfile();
    } catch (err) {
      console.error("Failed marking all as read:", err);
    }
  };

  const handleDeleteAll = async () => {
    if (!currentUserProfile?.uid) return;
    const confirmDelete = window.confirm("🔥 Voulez-vous supprimer définitivement toutes vos notifications ?");
    if (!confirmDelete) return;
    try {
      await gomboDB.deleteAllUserNotifications(currentUserProfile.uid);
      onRefreshProfile();
    } catch (err) {
      console.error("Failed deleting all notifications:", err);
    }
  };

  const handleDeleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await gomboDB.deleteNotification(id);
    } catch (err) {
      console.error("Failed deleting notification:", err);
    }
  };

  // Browser Push Permission Request (FCM preparation)
  const handleRequestPushPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Ce navigateur ne prend pas en charge les notifications push.");
      return;
    }

    setIsRequestingPush(true);
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission === "granted") {
        // Generate a real-looking simulated token
        const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const generatedToken = `fcm_afrigombo_token_prod_${randomString}`;
        setFcmToken(generatedToken);
        localStorage.setItem("gombo_sim_fcm_token", generatedToken);

        // Associate device/token to user in Firestore
        if (currentUserProfile?.uid) {
          await gomboDB.updateUserProfile(currentUserProfile.uid, {
            fcmToken: generatedToken,
            fcmTokenUpdatedAt: new Date().toISOString(),
            deviceOS: navigator.userAgent.includes("Mobile") ? "iOS/Android Web" : "Desktop Client"
          });
        }
      }
    } catch (e) {
      console.error("Error setting push notifications:", e);
    } finally {
      setIsRequestingPush(false);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      // Global Admin Types
      case "INFO": return <Info className="w-5 h-5 text-blue-400" />;
      case "GOMBO": return <Zap className="w-5 h-5 text-[#D4AF37]" />;
      case "URGENT": return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "ÉVÉNEMENT": return <Crown className="w-5 h-5 text-purple-400" />;
      case "MISE À JOUR": return <RefreshCw className="w-5 h-5 text-emerald-400" />;
      case "PREMIUM": return <Sparkles className="w-5 h-5 text-amber-400" />;
      case "SÉCURITÉ": return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      
      // Smart Trigger Categories
      case "new_message": return <MessageSquare className="w-5 h-5 text-teal-400" />;
      case "payment_received": return <Wallet className="w-5 h-5 text-emerald-400" />;
      case "payment_held": return <Wallet className="w-5 h-5 text-yellow-500 animate-pulse" />;
      case "contract_signed": return <BadgeCheck className="w-5 h-5 text-blue-400" />;
      case "application_accepted": return <UserCheck className="w-5 h-5 text-purple-400" />;
      case "application_refused": return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case "kyc_validated": return <ShieldCheck className="w-5 h-5 text-green-400" />;
      case "gombo_id_validated": return <Music className="w-5 h-5 text-[#D4AF37]" />;
      case "kyc_info_required": return <Info className="w-5 h-5 text-orange-400" />;
      case "premium_activated": return <Crown className="w-5 h-5 text-amber-400" />;
      case "publication_boosted": return <Zap className="w-5 h-5 text-orange-400" />;
      case "new_favorite": return <Heart className="w-5 h-5 text-rose-400" />;
      case "support_received": return <Heart className="w-5 h-5 text-red-400 fill-current" />;
      
      // Default / Legacy
      case "new_gombo": return <Briefcase className="w-5 h-5 text-orange-500" />;
      case "new_renfort": return <Sparkles className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-afri-text-sec" />;
    }
  };

  // Group notifications into: Aujourd'hui, Hier, Cette semaine, Plus anciennes
  const getGroupedNotifications = () => {
    const today: (GomboNotification | AppNotification)[] = [];
    const yesterday: (GomboNotification | AppNotification)[] = [];
    const thisWeek: (GomboNotification | AppNotification)[] = [];
    const older: (GomboNotification | AppNotification)[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const startOfWeek = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    filteredNotifications.forEach(notif => {
      const date = new Date(notif.createdAt || Date.now());
      if (date >= todayStart) {
        today.push(notif);
      } else if (date >= yesterdayStart) {
        yesterday.push(notif);
      } else if (date >= startOfWeek) {
        thisWeek.push(notif);
      } else {
        older.push(notif);
      }
    });

    return { today, yesterday, thisWeek, older };
  };

  const grouped = getGroupedNotifications();

  // Click on notification Deep-Link Mapping
  const handleNotificationClick = async (notif: GomboNotification | AppNotification) => {
    // 1. Mark as read
    if (!(notif as any).isRead && notif.id) {
      await gomboDB.markNotificationAsRead(notif.id);
    }

    // 2. Deep-Link Navigation based on type
    if (!onNavigateTo) return;

    const type = notif.type || "";
    const relatedId = (notif as any).relatedId || "";

    if (type === "new_message") {
      onNavigateTo("menu_msgs", relatedId);
    } else if (type === "payment_received" || type === "payment_held" || type === "payment") {
      onNavigateTo("menu_wallet", relatedId);
    } else if (
      type === "contract_signed" || 
      type === "application_accepted" || 
      type === "application_refused" ||
      type === "new_application"
    ) {
      onNavigateTo("user_contracts", relatedId);
    } else if (
      type === "kyc_validated" || 
      type === "gombo_id_validated" || 
      type === "kyc_info_required"
    ) {
      onNavigateTo("menu_gombo_id", relatedId);
    } else if (type === "premium_activated") {
      onNavigateTo("menu_heritage", relatedId);
    } else if (type === "new_favorite") {
      onNavigateTo("menu_favorites", relatedId);
    } else if (type === "publication_boosted") {
      onNavigateTo("menu_pubs", relatedId);
    } else if (type === "support_received") {
      onNavigateTo("menu_builders_1", relatedId);
    }
  };

  const renderNotificationGroup = (title: string, list: (GomboNotification | AppNotification)[]) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-[10px] font-mono font-black text-[#D4AF37]/80 uppercase tracking-widest pl-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-afri-bg-sec animate-ping" />
          {title} ({list.length})
        </h3>
        <div className="grid gap-3.5">
          {list.map((notif, idx) => {
            const isUnread = !(notif as any).isRead && !(notif as any).read;
            return (
              <motion.div
                key={notif.id || idx}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => handleNotificationClick(notif)}
                className={`group relative p-4.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  isUnread 
                    ? "bg-afri-bg-sec/90 border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.06)]" 
                    : "bg-afri-bg/40 border-afri-border hover:border-afri-border"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${isUnread ? "bg-afri-bg-sec/10" : "bg-afri-bg-sec"} border border-afri-border shrink-0`}>
                    {getNotifIcon(notif.type || "")}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-xs font-bold uppercase tracking-tight ${isUnread ? "text-afri-text" : "text-afri-text-sec"}`}>
                        {(notif as any).title || "Notification"}
                      </h4>
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-afri-bg-sec animate-pulse shadow-[0_0_8px_#D4AF37]" />
                      )}
                    </div>
                    <p className="text-[11px] text-afri-text-sec leading-relaxed group-hover:text-afri-text transition-colors">
                      {notif.message}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-2.5">
                      <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-afri-text-sec uppercase tracking-tighter">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(notif.createdAt || Date.now()).toLocaleString("fr-FR")}
                      </div>
                      {(notif as any).audience && (
                        <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-[#D4AF37]/60 uppercase tracking-tighter border-l border-afri-border pl-4">
                          <UserCheck className="w-2.5 h-2.5" />
                          Audience: {(notif as any).audience}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (notif.id) handleDeleteNotif(notif.id, e);
                      }}
                      className="p-2 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const hasAnyNotif = filteredNotifications.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 min-h-screen text-afri-text">
      {onBack && (
        <button
          onClick={onBack}
          className="text-xs font-black uppercase tracking-wider text-afri-text-sec hover:text-afri-text inline-flex items-center gap-1.5 px-3 py-1.5 bg-afri-bg-sec rounded-xl border border-afri-border transition cursor-pointer"
        >
          &larr; Retour
        </button>
      )}

      {/* IMPERIAL HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative p-6 sm:p-8 rounded-3xl bg-afri-bg border border-[#D4AF37]/30 overflow-hidden shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Bell className="w-8 h-8 text-[#D4AF37]" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-afri-text uppercase italic">
                Centre de Notifications
              </h1>
            </div>
            <p className="text-[#D4AF37] font-medium tracking-widest text-[9px] uppercase ml-11">
              Synchronisation Temps Réel AFRIGOMBO
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-afri-bg-sec/50 p-1.5 rounded-2xl border border-afri-border">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "all" ? "bg-afri-bg-sec text-black shadow-lg" : "text-afri-text-sec hover:text-afri-text"
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "unread" ? "bg-afri-bg-sec text-black shadow-lg" : "text-afri-text-sec hover:text-afri-text"
                }`}
              >
                Non lues
              </button>
            </div>

            {hasAnyNotif && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllRead}
                  className="px-3 py-2 bg-afri-bg-sec hover:bg-afri-bg-ter border border-afri-border rounded-xl text-[9px] font-black uppercase tracking-wider transition inline-flex items-center gap-1 cursor-pointer text-[#D4AF37]"
                  title="Tout marquer comme lu"
                >
                  <Check className="w-3 h-3" /> Tout marquer
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="p-2 bg-afri-bg-sec hover:bg-red-950/40 hover:text-red-400 border border-afri-border rounded-xl transition cursor-pointer"
                  title="Vider les notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* DYNAMIC TIME-BASED CATEGORIZATION */}
      <div className="space-y-8">
        {!hasAnyNotif ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-12 text-center bg-afri-bg border border-afri-border rounded-3xl"
          >
            <Megaphone className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <h3 className="text-afri-text-sec font-mono text-[10px] uppercase tracking-[0.2em]">Silence Impérial</h3>
            <p className="text-zinc-700 text-xs mt-2 italic">Aucune notification disponible.</p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {renderNotificationGroup("Aujourd'hui", grouped.today)}
            {renderNotificationGroup("Hier", grouped.yesterday)}
            {renderNotificationGroup("Cette semaine", grouped.thisWeek)}
            {renderNotificationGroup("Plus anciennes", grouped.older)}
          </div>
        )}
      </div>

      {/* FCM PUSH PREPARATION CONSOLE */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-afri-bg/60 border border-afri-border/80 rounded-3xl space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-afri-border pb-4">
          <div className="space-y-1">
            <h3 className="font-black text-xs uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-500" />
              Notifications Push Mobiles & Navigateur (FCM)
            </h3>
            <p className="text-[10px] text-afri-text-sec">
              Associez votre appareil pour recevoir des alertes en temps réel même lorsque l'application est fermée.
            </p>
          </div>

          <div>
            {pushPermission === "granted" ? (
              <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider inline-block">
                Appareil Associé ✅
              </span>
            ) : (
              <button
                onClick={handleRequestPushPermission}
                disabled={isRequestingPush}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-afri-text font-extrabold text-[10px] uppercase rounded-xl transition cursor-pointer inline-flex items-center gap-1.5 shadow-md"
              >
                {isRequestingPush ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    Autoriser mon Appareil
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {pushPermission === "granted" && fcmToken && (
          <div className="p-3 bg-afri-bg/60 border border-afri-border rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-afri-text-sec">IDENTIFIANT DE L'APPAREIL :</span>
              <span className="text-afri-text-sec">Web Browser Client (Chrome/Safari)</span>
            </div>
            <div className="flex flex-col gap-1 text-[9px] font-mono">
              <span className="text-afri-text-sec">FCM REGISTRATION TOKEN :</span>
              <span className="bg-afri-bg-sec p-2 rounded border border-afri-border break-all text-purple-400">
                {fcmToken}
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* FOOTER REFLECTION */}
      <div className="pt-12 border-t border-afri-border text-center">
        <p className="text-[9px] font-mono text-zinc-800 uppercase tracking-[0.5em]">
          Espace de Communication Souveraine
        </p>
      </div>
    </div>
  );
}
