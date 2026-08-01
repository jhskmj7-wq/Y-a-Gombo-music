import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, Check, Trash2, ShieldAlert, 
  Clock, Briefcase, Music, UserCheck, MessageSquare,
  Info, Crown, Megaphone, Zap, Sparkles, AlertTriangle, 
  BadgeCheck, Heart, ShieldCheck, Wallet, RefreshCw, Smartphone,
  CheckCheck, ArrowLeft, ChevronDown, ChevronUp, ExternalLink
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
  onMarkNotificationAsRead?: (notifId: string) => void;
  onMarkAllAsRead?: () => void;
}

export default function NotificationCenter({ 
  currentUserProfile, 
  notifications, 
  onRefreshProfile,
  onNavigateHome,
  onBack,
  onNavigateTo,
  onMarkNotificationAsRead,
  onMarkAllAsRead
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Push Notification Simulation / Preparation states
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window ? (window.Notification.permission || "default") : "default"
  );
  const [fcmToken, setFcmToken] = useState<string>(() => {
    try {
      if (typeof window === "undefined") return "";
      return localStorage.getItem("gombo_sim_fcm_token") || "";
    } catch (_) {
      return "";
    }
  });
  const [isRequestingPush, setIsRequestingPush] = useState(false);

  const unreadCount = notifications.filter(n => !(n as any).isRead && !(n as any).read).length;

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === "unread") {
      return !(notif as any).isRead && !(notif as any).read;
    }
    return true;
  });

  const handleMarkAllRead = async () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
    if (currentUserProfile?.uid) {
      try {
        await gomboDB.markAllUserNotificationsAsRead(currentUserProfile.uid);
        onRefreshProfile();
      } catch (err) {
        console.error("Failed marking all as read:", err);
      }
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
      if (expandedId === id) setExpandedId(null);
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
      const permission = await window.Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission === "granted") {
        const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const generatedToken = `fcm_afrigombo_token_prod_${randomString}`;
        setFcmToken(generatedToken);
        localStorage.setItem("gombo_sim_fcm_token", generatedToken);

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
      case "INFO": return <Info className="w-5 h-5 text-blue-400" />;
      case "GOMBO": return <Zap className="w-5 h-5 text-[#D4AF37]" />;
      case "URGENT": return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "ÉVÉNEMENT": return <Crown className="w-5 h-5 text-purple-400" />;
      case "MISE À JOUR": return <RefreshCw className="w-5 h-5 text-emerald-400" />;
      case "PREMIUM": return <Sparkles className="w-5 h-5 text-amber-400" />;
      case "SÉCURITÉ": return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      
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
      
      case "new_gombo": return <Briefcase className="w-5 h-5 text-orange-500" />;
      case "new_renfort": return <Sparkles className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-afri-text-sec" />;
    }
  };

  const getDeepLinkLabel = (type: string) => {
    switch (type) {
      case "new_message": return "Accéder à la messagerie";
      case "payment_received":
      case "payment_held":
      case "payment": return "Ouvrir mon Portefeuille";
      case "contract_signed":
      case "application_accepted":
      case "application_refused":
      case "new_application": return "Consulter mes contrats";
      case "kyc_validated":
      case "gombo_id_validated":
      case "kyc_info_required": return "Voir mon Gombo ID";
      case "premium_activated": return "Mon Statut VIP";
      case "new_favorite": return "Mes Favoris";
      case "publication_boosted": return "Mes Publications";
      case "support_received": return "Coin Bâtisseurs";
      default: return "Explorer";
    }
  };

  const triggerDeepLink = (notif: GomboNotification | AppNotification) => {
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
    } else {
      onNavigateHome();
    }
  };

  const handleNotificationClick = async (notif: GomboNotification | AppNotification) => {
    const isUnread = !(notif as any).isRead && !(notif as any).read;
    
    // 1. Mark as read immediately
    if (isUnread && notif.id) {
      if (onMarkNotificationAsRead) {
        onMarkNotificationAsRead(notif.id);
      }
      try {
        await gomboDB.markNotificationAsRead(notif.id);
      } catch (err) {
        console.warn("Failed marking notification read:", err);
      }
    }

    // 2. Toggle expand / collapse card
    setExpandedId(prev => prev === notif.id ? null : (notif.id || null));
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

  const renderNotificationGroup = (title: string, list: (GomboNotification | AppNotification)[]) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-[10px] font-mono font-black text-[#D4AF37]/90 uppercase tracking-widest pl-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
          {title} ({list.length})
        </h3>
        <div className="grid gap-3">
          {list.map((notif, idx) => {
            const isUnread = !(notif as any).isRead && !(notif as any).read;
            const isExpanded = expandedId === notif.id;

            return (
              <motion.div
                key={notif.id || idx}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => handleNotificationClick(notif)}
                className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${
                  isUnread 
                    ? "bg-afri-bg-sec/90 border-[#D4AF37]/60 shadow-[0_4px_20px_rgba(212,175,55,0.12)]" 
                    : "bg-afri-bg/60 border-afri-border hover:border-[#D4AF37]/30"
                }`}
              >
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <div className={`p-2.5 rounded-xl ${isUnread ? "bg-[#D4AF37]/15 border border-[#D4AF37]/40" : "bg-afri-bg-sec border border-afri-border"} shrink-0 mt-0.5`}>
                    {getNotifIcon(notif.type || "")}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <h4 className={`text-xs sm:text-sm font-bold uppercase tracking-tight break-words ${isUnread ? "text-afri-text font-black" : "text-afri-text-sec font-semibold"}`}>
                          {(notif as any).title || "Notification"}
                        </h4>
                        {isUnread ? (
                          <span className="px-1.5 py-0.5 bg-[#D4AF37] text-black font-extrabold text-[8.5px] uppercase tracking-wider rounded-md animate-pulse shrink-0">
                            Nouveau
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8.5px] font-bold rounded-md uppercase tracking-wider flex items-center gap-1 shrink-0">
                            <Check className="w-2.5 h-2.5" />
                            Lue
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notif.id) handleDeleteNotif(notif.id, e);
                          }}
                          className="p-1.5 text-afri-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#D4AF37]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-afri-text-muted group-hover:text-afri-text transition-colors" />
                        )}
                      </div>
                    </div>

                    <p className={`text-xs leading-relaxed transition-colors ${isExpanded ? "text-afri-text font-medium" : "text-afri-text-sec line-clamp-2"}`}>
                      {notif.message}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-afri-text-sec uppercase tracking-tighter">
                        <Clock className="w-3 h-3 text-[#D4AF37]/80" />
                        {new Date(notif.createdAt || Date.now()).toLocaleString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                      {(notif as any).audience && (
                        <div className="flex items-center gap-1 text-[9px] font-mono text-[#D4AF37]/70 uppercase tracking-tighter border-l border-afri-border pl-3">
                          <UserCheck className="w-3 h-3" />
                          Audience: {(notif as any).audience}
                        </div>
                      )}
                    </div>

                    {/* EXPANDED DETAILED VIEW */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 pt-3 border-t border-afri-border/60 space-y-3"
                        >
                          <div className="text-xs sm:text-sm text-afri-text leading-relaxed whitespace-pre-line font-sans bg-afri-bg-sec/50 p-3.5 rounded-xl border border-afri-border/50 shadow-inner">
                            {notif.message}
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                            <span className="text-[9.5px] font-mono text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                              <CheckCheck className="w-3.5 h-3.5" /> Statut : Marqué comme lu
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerDeepLink(notif);
                              }}
                              className="w-full sm:w-auto px-3.5 py-2 bg-gradient-to-r from-[#D4AF37] to-amber-600 hover:from-amber-400 hover:to-amber-600 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <span>{getDeepLinkLabel(notif.type || "")}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 text-afri-text pb-12">
      {/* MOBILE ANDROID BACK BUTTON & NAVIGATION BAR */}
      <div className="flex items-center justify-between gap-3 bg-afri-bg/90 border border-afri-border/80 p-2.5 sm:p-3 rounded-2xl backdrop-blur-md shadow-lg sticky top-2 z-20">
        <button
          onClick={() => {
            if (onBack) onBack();
            else onNavigateHome();
          }}
          className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] text-afri-text hover:text-[#D4AF37] transition-all cursor-pointer flex items-center gap-2 active:scale-95"
          title="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-xs font-bold uppercase font-mono hidden xs:inline">Retour</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-[#D4AF37]">
            Notifications
          </span>
          {unreadCount > 0 ? (
            <span className="px-2 py-0.5 bg-red-600 text-white font-mono font-black text-[10px] rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse">
              {unreadCount}
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-[9px] rounded-full">
              À jour
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 bg-[#D4AF37] text-black font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition shadow-md active:scale-95 flex items-center gap-1 cursor-pointer"
            title="Tout marquer comme lu"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tout marquer</span>
          </button>
        )}
      </div>

      {/* IMPERIAL HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-5 sm:p-7 rounded-3xl bg-afri-bg border border-[#D4AF37]/35 overflow-hidden shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/8 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <Bell className="w-7 h-7 sm:w-8 sm:h-8 text-[#D4AF37]" />
              </motion.div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-afri-text uppercase italic">
                Centre de Notifications
              </h1>
            </div>
            <p className="text-[#D4AF37] font-bold tracking-widest text-[9px] uppercase ml-10">
              Mises à jour et alertes en temps réel AFRIGOMBO
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-afri-border">
            <div className="flex items-center gap-1.5 bg-afri-bg-sec/80 p-1.5 rounded-2xl border border-afri-border">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "all" ? "bg-[#D4AF37] text-black shadow-md" : "text-afri-text-sec hover:text-afri-text"
                }`}
              >
                Toutes ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "unread" ? "bg-[#D4AF37] text-black shadow-md" : "text-afri-text-sec hover:text-afri-text"
                }`}
              >
                Non lues ({unreadCount})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                className="px-3.5 py-2 bg-afri-bg-sec hover:bg-afri-bg-ter border border-[#D4AF37]/40 text-[#D4AF37] rounded-xl text-[10px] font-black uppercase tracking-wider transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                title="Tout marquer comme lu"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Tout marquer comme lu</span>
              </button>

              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="p-2 bg-afri-bg-sec hover:bg-red-950/40 text-afri-text-sec hover:text-red-400 border border-afri-border hover:border-red-500/30 rounded-xl transition cursor-pointer"
                  title="Vider toutes les notifications"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* DYNAMIC TIME-BASED CATEGORIZATION */}
      <div className="space-y-6">
        {!hasAnyNotif ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-10 text-center bg-afri-bg/80 border border-afri-border rounded-3xl space-y-3"
          >
            <Megaphone className="w-12 h-12 text-[#D4AF37]/40 mx-auto" />
            <h3 className="text-afri-text font-mono text-xs font-bold uppercase tracking-[0.2em]">
              {activeTab === "unread" ? "Aucune notification non lue" : "Aucune notification"}
            </h3>
            <p className="text-afri-text-sec text-xs max-w-sm mx-auto">
              {activeTab === "unread" 
                ? "Vous avez consulté toutes vos alertes. Merci de rester synchronisé !" 
                : "Vos nouvelles notifications d'activité, contrats et messages apparaîtront ici."}
            </p>
            {activeTab === "unread" && notifications.length > 0 && (
              <button
                onClick={() => setActiveTab("all")}
                className="mt-2 px-4 py-2 bg-afri-bg-sec border border-afri-border text-afri-text hover:text-[#D4AF37] font-mono text-xs font-bold uppercase rounded-xl transition cursor-pointer"
              >
                Voir l'historique complet
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6">
            {renderNotificationGroup("Aujourd'hui", grouped.today)}
            {renderNotificationGroup("Hier", grouped.yesterday)}
            {renderNotificationGroup("Cette semaine", grouped.thisWeek)}
            {renderNotificationGroup("Plus anciennes", grouped.older)}
          </div>
        )}
      </div>

      {/* FCM PUSH PREPARATION CONSOLE */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 bg-afri-bg/60 border border-afri-border/80 rounded-3xl space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-afri-border pb-4">
          <div className="space-y-1">
            <h3 className="font-black text-xs uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-500" />
              Notifications Push Mobiles Android & Web
            </h3>
            <p className="text-[10px] text-afri-text-sec">
              Activez les alertes pour recevoir vos offres, contrats et paiements en direct sur smartphone.
            </p>
          </div>

          <div>
            {pushPermission === "granted" ? (
              <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider inline-block">
                Appareil Connecté ✅
              </span>
            ) : (
              <button
                onClick={handleRequestPushPermission}
                disabled={isRequestingPush}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-[10px] uppercase rounded-xl transition cursor-pointer inline-flex items-center gap-1.5 shadow-md active:scale-95"
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
              <span className="text-afri-text-sec">APPAREIL ENREGISTRÉ :</span>
              <span className="text-afri-text-sec">Android Web / Native Client</span>
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
      <div className="pt-8 border-t border-afri-border text-center">
        <p className="text-[9px] font-mono text-afri-text-sec uppercase tracking-[0.4em]">
          AFRIGOMBO • Centre de Communication Souveraine
        </p>
      </div>
    </div>
  );
}

