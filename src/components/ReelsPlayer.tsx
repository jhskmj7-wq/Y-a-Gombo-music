import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, Heart, MessageCircle, Share2, Plus, Coins, Video } from "lucide-react";
import { Post } from "../types";

interface ReelsPlayerProps {
  posts: Post[];
  onClose: () => void;
  onOpenCreate: () => void;
  currentSection: "home" | "reels";
  setCurrentSection: (section: "home" | "reels") => void;
}

export function ReelsPlayer({ posts, onClose, onOpenCreate, currentSection, setCurrentSection }: ReelsPlayerProps) {
  const videoPosts = posts.filter((p) => p.mediaUrl && (p.mediaUrl.includes(".mp4") || p.mediaUrl.includes("video")));
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
        containerRef.current.scrollTop = 0;
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const index = Math.round(container.scrollTop / container.clientHeight);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const hasVideos = videoPosts.length > 0;
  
  const displayPosts = hasVideos 
    ? videoPosts 
    : [
        {
          id: "demo-1",
          authorName: "Afrigombo Team",
          authorArtisticName: "Bienvenue",
          content: "Bienvenue sur le Fil Réels Afrigombo ! Soyez le premier à publier votre vidéo ici.",
          mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-dancing-woman-in-a-field-of-yellow-flowers-42767-large.mp4",
          likes: 120,
          comments: 45,
          authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Afrigombo",
          timestamp: new Date().toISOString()
        } as Post
      ];

  return (
    <div className="flex-1 w-full h-full bg-black text-white font-sans flex flex-col relative overflow-hidden">
      {/* Header / Navigation Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-6 flex flex-col gap-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex justify-between items-center">
            <button onClick={onClose} className="p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={onOpenCreate} className="p-2 rounded-full bg-[#D4AF37] text-black hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                <Plus className="w-5 h-5 font-bold" />
            </button>
        </div>
        <div className="flex justify-center gap-2">
            <button
              onClick={() => setCurrentSection("home")}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                currentSection === "home"
                  ? "bg-afri-bg-sec text-black shadow-md scale-[1.02]"
                  : "text-afri-text-sec hover:text-afri-text hover:bg-afri-bg-sec/40"
              }`}
            >
              <span>🌟 Tendances & Gombos</span>
            </button>
            <button
              onClick={() => setCurrentSection("reels")}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-1.5 cursor-pointer relative ${
                currentSection === "reels"
                  ? "bg-afri-bg-sec text-black shadow-md scale-[1.02]"
                  : "text-afri-text-sec hover:text-afri-text hover:bg-afri-bg-sec/40"
              }`}
            >
              <span>🔥 Fil Réels</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            </button>
        </div>
      </div>

      {/* Videos Container - Vertical Scroll Snap */}
      <div 
        ref={containerRef}
        className="flex-1 w-full h-full overflow-y-auto snap-y snap-mandatory scrollbar-none"
        onScroll={handleScroll}
      >
        {displayPosts.map((post) => (
          <div key={post.id} className="w-full h-full snap-start relative bg-black flex justify-center items-center overflow-hidden">
            <video
              src={post.mediaUrl || ""}
              loop
              playsInline
              muted={false}
              className="absolute inset-0 w-full h-full object-cover aspect-[9/16]"
            />
            
            {/* Overlay Gradient for readability */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

            {/* Bottom Info Overlay - BAS À GAUCHE */}
            <div className="absolute bottom-16 left-3 right-16 z-10 text-left pointer-events-none flex flex-col justify-end">
              <h3 className="text-sm font-black text-white mb-1 drop-shadow-md">
                @{post.authorName?.replace(/\s+/g, '').toLowerCase() || "artiste"}
              </h3>
              <p className="text-xs text-white/90 line-clamp-2 mb-3 drop-shadow-md font-medium">
                {post.content}
              </p>
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full inline-flex max-w-max pointer-events-auto">
                <div className="w-3 h-3 rounded-full bg-[#D4AF37] animate-pulse shrink-0" />
                <span className="text-[10px] font-mono font-bold text-white truncate max-w-[120px]">
                  {post.authorArtisticName || "Audio original"}
                </span>
              </div>
            </div>

            {/* Right Interaction Sidebar - BORD DROIT */}
            <div className="absolute bottom-16 right-3 z-10 flex flex-col items-center gap-6 pointer-events-auto">
              {/* Mon Héritage */}
              <div className="relative group cursor-pointer flex flex-col items-center" onClick={(e) => e.stopPropagation()} title="Mon Héritage">
                <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] to-white relative ring-2 ring-white/20">
                  <img 
                    src={post.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.userId || '1'}`}
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover bg-black"
                  />
                  <button className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-md mt-1">Mon Héritage</span>
              </div>

              {/* J'honore */}
              <button className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => { e.stopPropagation(); }} title="J'honore">
                <Heart className="w-8 h-8 text-white hover:scale-105 transition-all" />
                <span className="text-[11px] font-bold text-white drop-shadow-md">{post.likes || 0}</span>
              </button>

              {/* Palabres */}
              <button className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => e.stopPropagation()} title="Palabres">
                <MessageCircle className="w-8 h-8 text-white hover:scale-105 transition-all" />
                <span className="text-[11px] font-bold text-white drop-shadow-md">{post.comments || 0}</span>
              </button>
              
              {/* Transmettre */}
              <button className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => {
                 e.stopPropagation();
                 if (navigator.share) {
                   navigator.share({ title: 'Afrigombo Réel', url: window.location.href });
                 }
              }} title="Transmettre">
                <Share2 className="w-8 h-8 text-white hover:scale-105 transition-all" />
                <span className="text-[11px] font-bold text-white drop-shadow-md">Transmettre</span>
              </button>

              {/* Soutenir */}
              <button className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent("open_wallet_deposit"));
              }} title="Soutenir">
                <Coins className="w-9 h-9 text-[#D4AF37] hover:scale-105 transition-all" />
                <span className="text-[11px] font-bold text-[#D4AF37] drop-shadow-md">Soutenir</span>
              </button>
            </div>
          </div>
        ))}
        {/* Placeholder Banner if Empty */}
        {!hasVideos && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-sm">
            <div className="bg-[#D4AF37]/90 backdrop-blur-md text-black px-4 py-3 rounded-2xl shadow-xl border border-white/20 text-center animate-bounce">
              <p className="text-xs font-black uppercase tracking-wider mb-1 flex items-center justify-center gap-2">
                <Video className="w-4 h-4" /> Aucun réel utilisateur
              </p>
              <p className="text-[10px] font-bold opacity-90">
                Soyez le premier à publier votre Réel !
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
