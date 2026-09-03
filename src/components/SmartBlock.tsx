import React from "react";
import { motion } from "motion/react";
import { 
  Zap, Music, Award, Trophy, Video, Mic2, Headphones, GraduationCap, 
  ShoppingBag, Calendar, Users, Globe, Briefcase, MapPin, Sparkles, 
  Heart, TrendingUp, ChevronRight
} from "lucide-react";
import { Gombo, User, Post } from "../types";

export type BlockType = 
  | "URGENT_OPPORTUNITIES"
  | "NEW_GOMBOS"
  | "CERTIFIED_ARTISTS"
  | "TOP_CREATORS"
  | "POPULAR_REELS"
  | "CASTINGS"
  | "MUSIC_DEMOS"
  | "RECOMMENDED_COURSES"
  | "RECOMMENDED_PRODUCTS"
  | "NEARBY_EVENTS"
  | "RENFORT_EXPRESS"
  | "AFRIGOMBO_ELITE_UNIVERSE"
  | "PREMIUM_MISSIONS"
  | "NEAR_YOU"
  | "NEW_TALENTS"
  | "SPONSORED_POSTS"
  | "INTERESTS"
  | "TRENDS";

interface SmartBlockProps {
  type: BlockType;
  title: string;
  icon?: React.ReactNode;
  data: any[];
  onAction?: (item: any) => void;
  onSeeMore?: () => void;
}

const getIconForType = (type: BlockType) => {
  switch (type) {
    case "URGENT_OPPORTUNITIES": return <Zap className="w-4 h-4 text-amber-500" />;
    case "NEW_GOMBOS": return <Music className="w-4 h-4 text-[#D4AF37]" />;
    case "CERTIFIED_ARTISTS": return <Award className="w-4 h-4 text-sky-400" />;
    case "TOP_CREATORS": return <Trophy className="w-4 h-4 text-yellow-500" />;
    case "POPULAR_REELS": return <Video className="w-4 h-4 text-red-500" />;
    case "CASTINGS": return <Mic2 className="w-4 h-4 text-purple-500" />;
    case "MUSIC_DEMOS": return <Headphones className="w-4 h-4 text-blue-500" />;
    case "RECOMMENDED_COURSES": return <GraduationCap className="w-4 h-4 text-emerald-500" />;
    case "RECOMMENDED_PRODUCTS": return <ShoppingBag className="w-4 h-4 text-pink-500" />;
    case "NEARBY_EVENTS": return <Calendar className="w-4 h-4 text-orange-500" />;
    case "RENFORT_EXPRESS": return <Users className="w-4 h-4 text-red-400" />;
    case "AFRIGOMBO_ELITE_UNIVERSE": return <Globe className="w-4 h-4 text-indigo-400" />;
    case "PREMIUM_MISSIONS": return <Briefcase className="w-4 h-4 text-afri-text" />;
    case "NEAR_YOU": return <MapPin className="w-4 h-4 text-afri-text" />;
    case "NEW_TALENTS": return <Sparkles className="w-4 h-4 text-[#D4AF37]" />;
    case "SPONSORED_POSTS": return <Zap className="w-4 h-4 text-blue-400" />;
    case "INTERESTS": return <Heart className="w-4 h-4 text-red-500" />;
    case "TRENDS": return <TrendingUp className="w-4 h-4 text-afri-text" />;
    default: return null;
  }
};

const isPlayableVideoFile = (url?: string) => {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase().split("?")[0];
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return false;
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp") || lower.endsWith(".gif") || lower.endsWith(".svg")) return false;
  return (
    lower.endsWith(".webm") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".m4v") ||
    lower.includes("video") ||
    url.startsWith("blob:")
  );
};

export const SmartBlock: React.FC<SmartBlockProps> = ({ 
  type, 
  title, 
  icon, 
  data, 
  onAction, 
  onSeeMore
}) => {
  if (!data || data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-4 py-2"
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {icon || getIconForType(type)}
          <h3 className="text-[11px] font-sans font-black tracking-widest text-afri-text uppercase">
            {title}
          </h3>
        </div>
        {onSeeMore && (
          <button 
            onClick={onSeeMore}
            className="text-[10px] text-[#D4AF37] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            Voir tout <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar scroll-smooth snap-x touch-pan-x overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        {data.map((item, idx) => {
          const mediaSrc = item.imageUrl || item.thumbnail || item.url || item.mediaUrl;
          const directVideoSrc = isPlayableVideoFile(item.url || item.mediaUrl) ? (item.url || item.mediaUrl) : null;
          const isDirectPlayableVideo = Boolean(directVideoSrc);

          return (
            <motion.div
              key={item.id || `${type}-${idx}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAction?.(item)}
              className="flex-none w-64 bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer snap-start"
            >
              {/* Card Content based on type */}
              <div className="relative aspect-video bg-zinc-900 overflow-hidden flex items-center justify-center">
                {isDirectPlayableVideo && directVideoSrc ? (
                  <video 
                    src={directVideoSrc} 
                    muted 
                    playsInline 
                    preload="metadata"
                    className="w-full h-full object-cover opacity-85 pointer-events-none"
                  />
                ) : (
                  <img 
                    src={mediaSrc || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"} 
                    className="w-full h-full object-cover opacity-80" 
                    alt={item.title || "Média"}
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-afri-bg via-transparent to-transparent pointer-events-none" />
                {item.isPremium && (
                  <div className="absolute top-2 right-2 bg-afri-bg-sec/80 border border-[#D4AF37]/50 px-2 py-0.5 rounded-full">
                    <span className="text-[8px] font-black text-[#D4AF37] uppercase">Premium</span>
                  </div>
                )}
                {type === "POPULAR_REELS" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-[#D4AF37] flex items-center justify-center shadow-lg">
                      <Video className="w-4 h-4 text-[#D4AF37] ml-0.5" />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-3 space-y-1.5">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-[11px] font-bold text-afri-text leading-tight truncate">
                    {item.title || item.name}
                  </h4>
                  {item.budget && (
                    <span className="text-[9px] font-mono text-[#D4AF37] shrink-0 font-bold">
                      {item.budget.toLocaleString()} F
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-afri-text-sec line-clamp-2 leading-relaxed">
                  {item.description || item.bio || "Découvrez cette opportunité unique sur AFRIGOMBO ELITE."}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {item.location && (
                    <div className="flex items-center gap-1 text-[9px] text-afri-text-sec font-mono">
                      <MapPin className="w-3 h-3 text-[#D4AF37]" />
                      <span>{item.location}</span>
                    </div>
                  )}
                  {item.authorName && (
                    <div className="flex items-center gap-1 text-[9px] text-afri-text-sec font-mono border-l border-afri-border pl-2">
                      <Users className="w-3 h-3 text-sky-400" />
                      <span className="truncate max-w-[80px]">{item.authorName}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
