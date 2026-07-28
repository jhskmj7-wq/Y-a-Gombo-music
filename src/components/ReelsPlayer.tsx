import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, Heart, MessageCircle, Share2, Plus, Coins, Video } from "lucide-react";
import { Post } from "../types";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";

interface ReelsPlayerProps {
  posts: Post[];
  onClose: () => void;
  onOpenCreate: () => void;
  currentSection: "home" | "reels";
  setCurrentSection: (section: "home" | "reels") => void;
  currentUser?: any; // Add currentUser for auth
}

export function ReelsPlayer({ posts, onClose, onOpenCreate, currentSection, setCurrentSection, currentUser }: ReelsPlayerProps) {
  const videoPosts = posts.filter((p) => p.mediaUrl && (p.mediaUrl.includes(".mp4") || p.mediaUrl.includes("video")));
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [localPosts, setLocalPosts] = useState(videoPosts);
  
  useEffect(() => {
    setLocalPosts(videoPosts);
  }, [posts]);

  // Handle Like
  const handleLike = async (post: Post) => {
    if (!currentUser || !post.id) return;
    const postRef = doc(db, "social_posts", post.id);
    const isLiked = post.likedBy?.includes(currentUser.uid);
    
    // Optimistic update
    setLocalPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: (p.likes || 0) + (isLiked ? -1 : 1), likedBy: isLiked ? p.likedBy?.filter(u => u !== currentUser.uid) : [...(p.likedBy || []), currentUser.uid], isLiked: !isLiked } : p));
    
    await updateDoc(postRef, {
      likesCount: increment(isLiked ? -1 : 1),
      likedBy: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
    });
  };

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
    <div className="relative w-full h-full bg-[#050505] text-white font-sans overflow-hidden">
      {/* TOP NAVIGATION LAYER */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-6 flex flex-col gap-2 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex justify-between items-center">
            <button onClick={onClose} className="p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-white/10">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-sm font-black uppercase text-white/80">Fil Réel</h1>
            <div className="w-10" />
        </div>

        {/* Plus Button - Top right under header */}
        <div className="flex justify-end">
            <button onClick={onOpenCreate} className="p-2 rounded-full bg-[#D4AF37] text-black shadow-lg hover:bg-amber-400">
                <Plus className="w-5 h-5 font-bold" />
            </button>
        </div>

        {/* Filters Bar */}
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none justify-center">
          {["🔥 Tendances", "🎵 Nouveautés", "⭐ Certifiés", "👑 Premium", "🌍 Près de moi"].map((filter) => (
            <button key={filter} className="px-3 py-1 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full text-[10px] font-bold text-white whitespace-nowrap hover:bg-[#D4AF37]/20">
              {filter}
            </button>
          ))}
        </div>

        {/* Tabs Bar */}
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

      {/* VIDEO LAYER - Vertical Scroll Snap */}
      <div 
        ref={containerRef}
        className="w-full h-full overflow-y-auto snap-y snap-mandatory scrollbar-none"
        onScroll={handleScroll}
      >
        {displayPosts.map((post) => (
          <div key={post.id} className="relative w-full h-screen snap-start bg-black flex justify-center items-center overflow-hidden">
            <video
              src={post.mediaUrl || ""}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
            />
            
            {/* Gradation */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

            {/* Bottom-Left Overlay - User Info */}
            <div className="absolute bottom-20 left-4 z-40 text-left pointer-events-none flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <img 
                        src={post.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.userId || '1'}`}
                        className="w-8 h-8 rounded-full border border-[#D4AF37]" 
                    />
                    <span className="text-sm font-black text-white drop-shadow-md">@{post.authorName || "artiste"}</span>
                    <button className="text-[10px] bg-[#D4AF37] text-black px-2 py-0.5 rounded-full font-bold">Suivre</button>
                </div>
                <p className="text-xs text-white/90 font-medium line-clamp-2 drop-shadow-md">{post.content}</p>
                <div className="flex items-center gap-1 text-[10px] text-[#D4AF37] font-bold drop-shadow-md">
                    <Video className="w-3 h-3" />
                    <span>{post.title || "Titre musical"}</span>
                </div>
            </div>

            {/* Right Interaction Sidebar */}
            <div className="absolute bottom-20 right-4 z-40 flex flex-col items-center gap-5 pointer-events-auto">
                {/* Profil */}
                <div className="relative cursor-pointer flex flex-col items-center" onClick={(e) => e.stopPropagation()} title="Voir le profil">
                    <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] to-white relative ring-2 ring-white/20">
                        <img 
                            src={post.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.userId || '1'}`}
                            className="w-full h-full rounded-full object-cover bg-black"
                        />
                        <button className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white text-black rounded-full p-0.5 shadow-md hover:scale-110 transition-transform">
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                <button className="flex flex-col items-center gap-1" onClick={(e) => { e.stopPropagation(); handleLike(post); }} title="J'honore">
                    <Heart className={`w-8 h-8 hover:scale-105 transition-all ${post.isLiked ? 'text-red-500 fill-current' : 'text-white'}`} />
                    <span className="text-[10px] font-bold text-white drop-shadow-md">{post.likes || 0}</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                    <MessageCircle className="w-8 h-8 text-white hover:scale-105 transition-all" />
                    <span className="text-[10px] font-bold text-white drop-shadow-md">{post.comments || 0}</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                    <Share2 className="w-8 h-8 text-white hover:scale-105 transition-all" />
                    <span className="text-[10px] font-bold text-white drop-shadow-md">Transmettre</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                    <svg className="w-8 h-8 text-white hover:scale-105 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    <span className="text-[10px] font-bold text-white drop-shadow-md">Enregistrer</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                    <svg className="w-8 h-8 text-red-400 hover:scale-105 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span className="text-[10px] font-bold text-white drop-shadow-md">Signaler</span>
                </button>
                <button className="flex flex-col items-center gap-1 mt-2" onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("open_wallet_deposit")); }} title="Soutenir">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center hover:scale-105 transition-all">
                        <Coins className="w-6 h-6 text-black" />
                    </div>
                    <span className="text-[9px] font-black text-[#D4AF37] uppercase drop-shadow-md">Soutenir</span>
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
