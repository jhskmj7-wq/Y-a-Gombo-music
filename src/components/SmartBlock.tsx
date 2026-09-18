import React from "react";
import { motion } from "motion/react";
import { 
  Zap, Music, Award, Trophy, Video, Mic2, Headphones, GraduationCap, 
  ShoppingBag, Calendar, Users, Globe, Briefcase, MapPin, Sparkles, 
  Heart, TrendingUp, ChevronRight, Play
} from "lucide-react";
import { Gombo, User, Post } from "../types";
import { VideoThumbnail } from "./reels/VideoThumbnail";

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
  totalReelsCount?: number;
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
  totalReelsCount,
  onAction, 
  onSeeMore
}) => {
  if (!data || data.length === 0) return null;

  // Pour le compartiment Réels de l'accueil : afficher seulement 4 ou 5 vidéos
  const itemsToRender = type === "POPULAR_REELS" ? data.slice(0, 5) : data;

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
        {itemsToRender.map((item, idx) => {
          const mediaSrc = item.imageUrl || item.thumbnail || item.url || item.mediaUrl;
          const directVideoSrc = isPlayableVideoFile(item.url || item.mediaUrl) ? (item.url || item.mediaUrl) : null;
          const isDirectPlayableVideo = Boolean(directVideoSrc);

          // Affichage spécifique 9:16 style TikTok / Facebook Reels pour le compartiment Réels
          if (type === "POPULAR_REELS") {
            return (
              <motion.div
                key={item.id || `reel-${idx}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAction?.(item)}
                className="group relative flex-none w-36 xs:w-40 sm:w-48 aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-950 border border-afri-border/70 hover:border-[#D4AF37] transition-all duration-300 shadow-md hover:shadow-[0_8px_25px_rgba(212,175,55,0.22)] cursor-pointer snap-start select-none flex flex-col justify-between"
              >
                {/* 1. Média de fond en 9:16 pleine surface avec VideoThumbnail pour garantir zéro blanc */}
                <div className="absolute inset-0 w-full h-full bg-zinc-950 overflow-hidden">
                  <VideoThumbnail
                    videoUrl={item.url || item.mediaUrl || item.videoUrl}
                    thumbnailUrl={item.thumbnail || item.thumbnailUrl}
                    coverUrl={item.coverUrl}
                    poster={item.poster}
                    imageUrl={item.imageUrl}
                    title={item.title || item.content || item.name}
                    artist={item.artist || item.authorArtisticName || item.authorName}
                    authorAvatar={item.authorPhoto || item.authorAvatar}
                    alt={item.title || "Réel"}
                    className="w-full h-full"
                  />
                </div>

                {/* 2. Top Header : Auteur & Badge Réel */}
                <div className="relative z-10 p-2 sm:p-2.5 flex items-center justify-between w-full pointer-events-none">
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md py-0.5 px-2 rounded-full border border-white/10 max-w-[82%]">
                    <img 
                      src={item.authorPhoto || item.authorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                      alt="" 
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover border border-[#D4AF37]" 
                    />
                    <span className="text-[8px] sm:text-[9px] font-bold text-white truncate">
                      {item.artist || item.authorArtisticName || item.authorName || "Artiste"}
                    </span>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-md">
                    <Video className="w-2.5 h-2.5 fill-current" />
                  </div>
                </div>

                {/* 3. Bouton Play central translucide avec dorure */}
                <div className="relative z-10 flex items-center justify-center my-auto pointer-events-none">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/65 backdrop-blur-md border border-[#D4AF37]/60 text-[#D4AF37] flex items-center justify-center shadow-lg group-hover:scale-115 group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-300">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>

                {/* 4. Bas de carte : Titre & Métriques d'engagement (TikTok style) */}
                <div className="relative z-10 p-2.5 sm:p-3 flex flex-col justify-end space-y-1 pointer-events-none">
                  <h4 className="text-[11px] sm:text-xs font-bold text-white line-clamp-2 leading-snug drop-shadow-md">
                    {item.title || item.content || item.name || "Vibration Réel"}
                  </h4>
                  <div className="flex items-center justify-between pt-1 border-t border-white/15 text-[8px] sm:text-[9px] font-mono text-zinc-300">
                    <span className="text-[#D4AF37] font-bold flex items-center gap-1">
                      <Heart className="w-2.5 h-2.5 fill-current" /> {item.likesCount || item.likes || 0}
                    </span>
                    {item.commune ? (
                      <span className="truncate max-w-[65px] flex items-center gap-0.5 text-white/80">
                        <MapPin className="w-2 h-2 text-[#D4AF37]" /> {item.commune}
                      </span>
                    ) : (
                      <span className="text-white/70">▶ {item.viewsCount || item.views || 120}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          }

          // Format standard pour les autres blocs (opportunités, cours, événements, etc.)
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
                  {item.description || item.bio || "Découvrez cette opportunité unique sur AFRIGOMBO."}
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

        {/* 6e emplacement : Tout voir — ouvre le fil complet des Réels */}
        {type === "POPULAR_REELS" && data.length > 0 && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSeeMore?.()}
            className="group relative flex-none w-36 xs:w-40 sm:w-48 aspect-[9/16] rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-dashed border-[#D4AF37]/50 hover:border-[#D4AF37] transition-all duration-300 shadow-md hover:shadow-[0_8px_25px_rgba(212,175,55,0.3)] cursor-pointer snap-start select-none flex flex-col justify-between p-3.5 sm:p-4 text-center items-center"
          >
            {/* Décoration douce d'arrière-plan */}
            <div className="absolute inset-0 bg-radial from-[#D4AF37]/15 via-transparent to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />

            {/* Badge haut */}
            <div className="relative z-10 w-full flex justify-center">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[8px] sm:text-[9px] font-bold tracking-wide uppercase">
                <Sparkles className="w-2.5 h-2.5" /> Fil Réel
              </span>
            </div>

            {/* Centre : Bouton d'action et compte */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#D4AF37] to-amber-300 text-black flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)] group-hover:scale-110 transition-transform duration-300">
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-amber-200/95">
                {totalReelsCount && totalReelsCount > itemsToRender.length
                  ? `+${totalReelsCount - itemsToRender.length} autres vidéos`
                  : "Fil complet"}
              </span>
            </div>

            {/* Bas : Bouton Tout voir */}
            <div className="relative z-10 w-full pt-2 border-t border-[#D4AF37]/20 flex flex-col items-center">
              <div className="flex items-center gap-1 text-white font-black text-xs sm:text-sm group-hover:text-[#D4AF37] transition-colors">
                <span>Tout voir</span>
                <ChevronRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[8px] sm:text-[9px] text-zinc-400 mt-0.5 line-clamp-1">
                Explorer tous les Réels
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
