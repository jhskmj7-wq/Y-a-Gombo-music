import React, { useState } from "react";
import { Video } from "lucide-react";

interface UserReelsViewProps {
  users: any[];
  setReelsVideoId: (id: string | null) => void;
  setReelsVideoUrl: (url: string | null) => void;
}

export function UserReelsView({ users, setReelsVideoId, setReelsVideoUrl }: UserReelsViewProps) {
  const [selectedReelFilter, setSelectedReelFilter] = useState("all");
  
  // Aggregate real videos uploaded by artists in their Portfolio (mediaGallery)
  const allReels = users.flatMap(u => (u.mediaGallery || []).filter((m: any) => {
    const candidate = m.videoUrl || m.mediaUrl || m.url || m.media_url || m.src;
    if (!candidate || typeof candidate !== "string") return false;
    const type = String(m.type || m.mediaType || "").toLowerCase();
    if (type === "video" || type === "reel" || type === "youtube") return true;
    if (m.videoUrl) return true;
    if (type === "audio" || type === "photo" || type === "image") return false;
    const cleanUrl = candidate.toLowerCase().split("?")[0];
    if (cleanUrl.endsWith(".mp3") || cleanUrl.endsWith(".wav") || cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".png")) return false;
    return true;
  }).map((media: any) => ({
    id: media.id,
    title: media.title || "Démo Artiste",
    type: media.type || "video",
    url: media.videoUrl || media.mediaUrl || media.url || media.media_url || media.src,
    artisticName: u.artisticName || u.name || "Artiste Gombo",
    category: media.type === "video" ? "raw" : "youtube",
    avatar: u.photoURL || u.photoUrl || u.avatarUrl || u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
    description: media.description || "Démonstration authentique et accréditée téléchargée directement par l'artiste."
  })));

  const filteredReels = selectedReelFilter === "all" 
    ? allReels 
    : allReels.filter(r => r.category === selectedReelFilter || r.type === selectedReelFilter);


  return (
    <div className="space-y-6 text-left animate-fadeIn">
      <div className="bg-gradient-to-r from-afri-bg-sec via-afri-bg to-afri-bg p-6 rounded-3xl border border-afri-gold/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-[30%] opacity-25 flex items-center justify-center">
          <Video className="w-40 h-40 text-afri-gold animate-pulse" />
        </div>
        <div className="relative z-10 max-w-xl">
          <span className="text-[9px] font-mono tracking-widest text-afri-gold font-black uppercase bg-afri-gold/10 px-2.5 py-1 rounded-full border border-afri-gold/20">
            PROUVER VOTRE TALENT
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-afri-text uppercase tracking-tight mt-3">
            Vidéos Réelles & Sessions Live
          </h2>
          <p className="text-xs text-afri-text-sec mt-2 leading-relaxed">
            La crédibilité d'un artiste n'est pas négociable. Découvrez les coulisses, les preuves de répétition au studio, et les captations scéniques authentiques des musiciens d'élite d'AfriGombo.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-12 bg-afri-bg/40 border border-afri-border rounded-3xl text-center min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-afri-gold/10 flex items-center justify-center mb-4 border border-afri-gold/30">
          <span className="text-afri-gold text-2xl">🎥</span>
        </div>
        <h3 className="text-sm font-bold text-afri-text tracking-wide uppercase font-sans">Vidéos Réelles</h3>
        <p className="text-xs text-afri-text-sec mt-2 max-w-xs">Bientôt disponible dans votre espace d'élite.</p>
      </div>
    </div>
  );
}
