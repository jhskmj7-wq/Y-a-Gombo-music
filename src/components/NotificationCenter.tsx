import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, Check, Trash2, ShieldAlert, 
  Clock, Briefcase, Music, UserCheck, MessageSquare,
  Info, Crown, Megaphone, Zap, Sparkles, AlertTriangle, BadgeCheck
} from "lucide-react";
import { gomboDB } from "../firebase";
import { GomboNotification, UserProfile, AppNotification } from "../types";

interface NotificationCenterProps {
  currentUserProfile: UserProfile;
  notifications: (GomboNotification | AppNotification)[];
  onRefreshProfile: () => void;
  onNavigateHome: () => void;
}

export default function NotificationCenter({ 
  currentUserProfile, 
  notifications, 
  onRefreshProfile,
  onNavigateHome 
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === "unread") {
      // Handle both isRead (GomboNotification) and readCount (AppNotification - though readCount isn't per-user here)
      // For AppNotification, we might need a local 'seen' state if we want to track per user without a backend update
      // But for now, let's just use the 'isRead' property if it exists
      return !(notif as any).isRead;
    }
    return true;
  });

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !(n as any).isRead);
    for (const notif of unread) {
      if (notif.id) {
        await gomboDB.markNotificationAsRead(notif.id);
      }
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
      // Global Types
      case "INFO": return <Info className="w-5 h-5 text-blue-400" />;
      case "GOMBO": return <Zap className="w-5 h-5 text-[#D4AF37]" />;
      case "URGENT": return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "ÉVÉNEMENT": return <Crown className="w-5 h-5 text-purple-400" />;
      case "MISE À JOUR": return <RefreshCw className="w-5 h-5 text-emerald-400" />;
      case "PREMIUM": return <Sparkles className="w-5 h-5 text-amber-400" />;
      case "SÉCURITÉ": return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      
      // Legacy/Personal Types
      case "new_gombo": return <Briefcase className="w-5 h-5 text-orange-500" />;
      case "new_renfort": return <Sparkles className="w-5 h-5 text-amber-500" />;
      case "new_application":
      case "application_accepted": return <UserCheck className="w-5 h-5 text-purple-500" />;
      case "certification_approved": return <Music className="w-5 h-5 text-green-500" />;
      case "new_follower": return <BadgeCheck className="w-5 h-5 text-blue-500" />;
      case "message": return <MessageSquare className="w-5 h-5 text-teal-500" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 min-h-screen">
      {/* IMPERIAL HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative p-8 rounded-3xl bg-black border border-[#D4AF37]/30 overflow-hidden shadow-2xl"
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
              <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                Le Temple du Gombo
              </h1>
            </div>
            <p className="text-[#D4AF37] font-medium tracking-widest text-[10px] uppercase ml-11">
              Informe sa communauté impériale
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-white/5">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === "all" ? "bg-[#D4AF37] text-black shadow-lg" : "text-zinc-500 hover:text-white"
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === "unread" ? "bg-[#D4AF37] text-black shadow-lg" : "text-zinc-500 hover:text-white"
              }`}
            >
              Non lues
            </button>
          </div>
        </div>
      </motion.div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-12 text-center bg-zinc-950 border border-zinc-900 rounded-3xl"
          >
            <Megaphone className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <h3 className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.2em]">Silence Impérial</h3>
            <p className="text-zinc-700 text-xs mt-2 italic">Aucune annonce pour le moment.</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notif, idx) => (
                <motion.div
                  key={notif.id || idx}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className={`group relative p-5 rounded-2xl border transition-all duration-300 ${
                    !(notif as any).isRead 
                      ? "bg-zinc-900/80 border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.1)]" 
                      : "bg-zinc-950/40 border-zinc-900 hover:border-zinc-800"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${!(notif as any).isRead ? "bg-[#D4AF37]/10" : "bg-zinc-900"} border border-white/5`}>
                      {getNotifIcon(notif.type || "")}
                    </div>

                    <div className="flex-1 min-w-0" onClick={async () => {
                      if (!(notif as any).isRead && notif.id) {
                        await gomboDB.markNotificationAsRead(notif.id);
                      }
                    }}>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`text-sm font-bold uppercase tracking-tight ${!(notif as any).isRead ? "text-white" : "text-zinc-400"}`}>
                          {(notif as any).title || "Notification"}
                        </h4>
                        {!(notif as any).isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse shadow-[0_0_8px_#D4AF37]" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed group-hover:text-zinc-300 transition-colors">
                        {notif.message}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.createdAt || "").toLocaleString("fr-FR")}
                        </div>
                        {(notif as any).audience && (
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#D4AF37]/60 uppercase tracking-tighter border-l border-zinc-800 pl-4">
                            <UserCheck className="w-3 h-3" />
                            Audience: {(notif as any).audience}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => notif.id && handleDeleteNotif(notif.id)}
                        className="p-2 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Révoquer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* FOOTER REFLECTION */}
      <div className="pt-12 border-t border-zinc-900 text-center">
        <p className="text-[9px] font-mono text-zinc-800 uppercase tracking-[0.5em]">
          Espace de Communication Souveraine
        </p>
      </div>
    </div>
  );
}

const RefreshCw = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
