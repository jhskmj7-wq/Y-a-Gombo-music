import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Activity, Users, Sparkles, Award, Briefcase, Clock, Zap, MapPin, 
  Video, Music, ChevronRight, UserPlus, Star, Rss, ArrowRight
} from "lucide-react";
import { gomboDB } from "../firebase";
import { ActivityFeedEntry, UserProfile } from "../types";

interface ActivityFeedViewProps {
  currentUserProfile: UserProfile | null;
  onNavigateView: (view: string) => void;
}

export default function ActivityFeedView({ currentUserProfile, onNavigateView }: ActivityFeedViewProps) {
  const [activities, setActivities] = useState<ActivityFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "talent" | "groupe" | "certification" | "gombo">("all");

  // Hook real-time activity subscription (Phase 9 Rule 11)
  useEffect(() => {
    setLoading(true);
    console.log("⚡ Subscribing to real-time public Activity Feed");
    const unsubscribe = gomboDB.listenToActivityFeed((newList) => {
      setActivities(newList);
      setLoading(false);
    });

    return () => {
      console.log("⚡ Unsubscribing from real-time public Activity Feed");
      unsubscribe();
    };
  }, []);

  const filtered = activities.filter(act => {
    if (activeFilter === "all") return true;
    return act.type === activeFilter;
  });

  const getActivityTheme = (type: string) => {
    switch (type) {
      case "talent":
        return {
          icon: <UserPlus className="w-4 h-4 text-emerald-600" />,
          bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30",
          text: "text-emerald-700 dark:text-emerald-400"
        };
      case "groupe":
        return {
          icon: <Users className="w-4 h-4 text-purple-600" />,
          bg: "bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30",
          text: "text-purple-700 dark:text-purple-400"
        };
      case "certification":
        return {
          icon: <Award className="w-4 h-4 text-yellow-600" />,
          bg: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-105 dark:border-yellow-905/30",
          text: "text-yellow-700 dark:text-yellow-400"
        };
      case "gombo":
        return {
          icon: <Briefcase className="w-4 h-4 text-orange-600" />,
          bg: "bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30",
          text: "text-orange-700 dark:text-orange-400"
        };
      default:
        return {
          icon: <Activity className="w-4 h-4 text-indigo-600" />,
          bg: "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30",
          text: "text-indigo-700 dark:text-indigo-400"
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 border border-orange-400/10">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10 blur-xl">
          <Zap className="w-96 h-96" />
        </div>
        
        <div className="relative z-10">
          <span className="text-[10px] font-black tracking-widest bg-white/20 text-white px-3 py-1 rounded-full uppercase mb-3 inline-block">
            Showbiz CI Live
          </span>
          <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-2">
            <Rss className="w-8 h-8 text-white animate-pulse" />
            L’Actu Du Showbiz
          </h1>
          <p className="mt-1 text-sm text-orange-50 font-medium max-w-xl">
            Suivez les inscriptions de talents, la création de nouveaux groupes musicaux VIP, les certifications et les publications de gombos à Abidjan.
          </p>
        </div>
      </div>

      {/* Main filter headers */}
      <div className="flex flex-wrap gap-2 mb-6 text-xs font-bold uppercase tracking-tight">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-4 py-2.5 rounded-xl border transition-all ${
            activeFilter === "all"
              ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm"
              : "bg-white dark:bg-[#1e1e24] border-gray-150 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          👀 Tout
        </button>
        <button
          onClick={() => setActiveFilter("talent")}
          className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 ${
            activeFilter === "talent"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : "bg-white dark:bg-[#1e1e24] border-gray-150 dark:border-gray-800 text-gray-500 hover:text-emerald-600"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" /> Talents
        </button>
        <button
          onClick={() => setActiveFilter("groupe")}
          className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 ${
            activeFilter === "groupe"
              ? "bg-purple-600 text-white border-purple-600 shadow-sm"
              : "bg-white dark:bg-[#1e1e24] border-gray-150 dark:border-gray-800 text-gray-500 hover:text-purple-600"
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Groupes VIP
        </button>
        <button
          onClick={() => setActiveFilter("certification")}
          className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 ${
            activeFilter === "certification"
              ? "bg-yellow-600 text-white border-yellow-600 shadow-sm"
              : "bg-white dark:bg-[#1e1e24] border-gray-150 dark:border-gray-800 text-gray-500 hover:text-yellow-600"
          }`}
        >
          <Star className="w-3.5 h-3.5" /> Certifications
        </button>
        <button
          onClick={() => setActiveFilter("gombo")}
          className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 ${
            activeFilter === "gombo"
              ? "bg-orange-600 text-white border-orange-600 shadow-sm"
              : "bg-white dark:bg-[#1e1e24] border-gray-150 dark:border-gray-800 text-gray-500 hover:text-orange-600"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" /> Gombos
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400 dark:text-gray-500 font-bold text-sm">
          <Zap className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
          Chargement du flux d'actualités communautaires...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#1e1e24] rounded-2xl border border-gray-150 dark:border-gray-800/80 text-gray-400 dark:text-gray-500 p-8">
          <Activity className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Aucun événement à signaler</h4>
          <p className="text-xs mt-1">Revenez plus tard ou publiez votre propre démo pour initier de l'ambiance !</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-gray-100 dark:border-gray-800/60 ml-4 pl-6 space-y-8">
          <AnimatePresence mode="wait">
            {filtered.map((item, index) => {
              const th = getActivityTheme(item.type);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.4) }}
                  className="relative group"
                >
                  {/* Timeline Dot with matching type icons */}
                  <span className={`absolute -left-10 top-0.5 rounded-full p-1.5 border shrink-0 transition-colors ${th.bg} z-10`}>
                    {th.icon}
                  </span>

                  {/* Main feed list card */}
                  <div className="bg-white dark:bg-[#1e1e24] border border-gray-150 dark:border-gray-800/80 rounded-2xl p-5 hover:border-orange-400 dark:hover:border-orange-500/50 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar item */}
                      {item.userAvatar ? (
                        <img 
                          src={item.userAvatar} 
                          alt="" 
                          className="w-11 h-11 rounded-full object-cover shrink-0 border border-gray-100 dark:border-gray-700" 
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {item.userName ? item.userName.charAt(0).toUpperCase() : "G"}
                        </div>
                      )}

                      <div className="space-y-0.5">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-gray-450 dark:text-gray-500">
                            {item.userName || "Showbiz Musik"}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${th.bg} ${th.text}`}>
                            {item.type}
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-gray-100 dark:border-gray-800/50 pt-3 sm:pt-0 shrink-0">
                      <span className="text-[10px] text-gray-450 dark:text-gray-500 font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(item.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>

                      {/* Click redirection prompt */}
                      {item.type === "gombo" && (
                        <button
                          onClick={() => onNavigateView("gombo_list")}
                          className="mt-1.5 text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-0.5"
                        >
                          Voir l'offre <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {item.type === "groupe" && (
                        <button
                          onClick={() => onNavigateView("groupe")}
                          className="mt-1.5 text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
                        >
                          Annuaire VIP <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {item.type === "talent" && (
                        <button
                          onClick={() => onNavigateView("annuaire")}
                          className="mt-1.5 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                        >
                          La Base <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
