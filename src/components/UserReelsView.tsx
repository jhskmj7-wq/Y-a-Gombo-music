import React, { useState } from "react";
import { Video, Film, Bookmark, Plus, Sparkles } from "lucide-react";
import MyPublicationsSection from "./MyPublicationsSection";
import ReelCreatorScreen from "./reels/ReelCreatorScreen";

interface UserReelsViewProps {
  users: any[];
  setReelsVideoId: (id: string | null) => void;
  setReelsVideoUrl: (url: string | null) => void;
}

export function UserReelsView({ users, setReelsVideoId, setReelsVideoUrl }: UserReelsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"public" | "my_pubs">("public");
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // Aggregate real videos uploaded by artists in their Portfolio (mediaGallery)
  const allReels = users.flatMap((u) =>
    (u.mediaGallery || [])
      .filter((m: any) => {
        if (m.status === "draft" || m.status === "hidden" || m.status === "archived" || m.visible === false) return false;
        const candidate = m.videoUrl || m.mediaUrl || m.url || m.media_url || m.src;
        if (!candidate || typeof candidate !== "string") return false;
        const type = String(m.type || m.mediaType || "").toLowerCase();
        if (type === "video" || type === "reel" || type === "youtube") return true;
        if (m.videoUrl) return true;
        if (type === "audio" || type === "photo" || type === "image") return false;
        const cleanUrl = candidate.toLowerCase().split("?")[0];
        if (cleanUrl.endsWith(".mp3") || cleanUrl.endsWith(".wav") || cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".png")) return false;
        return true;
      })
      .map((media: any) => ({
        id: media.id,
        title: media.title || "Démo Artiste",
        type: media.type || "video",
        url: (() => {
          const c = media.videoUrl || media.mediaUrl || media.url || media.media_url || media.src || (media.storagePath?.startsWith("reels/") ? media.storagePath : "");
          if (typeof c === "string" && c.startsWith("reels/")) return `/api/r2/media/${encodeURIComponent(c)}`;
          return c;
        })(),
        artisticName: u.artisticName || u.name || "Artiste Gombo",
        category: media.type === "video" ? "raw" : "youtube",
        avatar: u.photoURL || u.photoUrl || u.avatarUrl || u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
        description: media.description || "Démonstration authentique et accréditée téléchargée directement par l'artiste."
      }))
  );

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-r from-afri-bg-sec via-afri-bg to-afri-bg p-5 sm:p-6 rounded-3xl border border-afri-gold/30 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono tracking-widest text-[#D4AF37] font-black uppercase bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>SOUVERAINETÉ VIDÉO</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-afri-text uppercase tracking-tight">
            Vidéos Réelles & Écran de Création
          </h2>
          <p className="text-xs text-afri-text-sec leading-relaxed">
            Exprimez votre talent en haute définition, éditez vos séquences avec filtres & effets, enregistrez vos brouillons et gérez la visibilité de vos publications.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsCreatorOpen(true)}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-amber-400 text-black font-black px-4 py-2.5 rounded-full text-xs uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Créer un Réel</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-afri-border/50 pb-3">
        <button
          onClick={() => setActiveSubTab("public")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
            activeSubTab === "public"
              ? "bg-[#D4AF37] text-black shadow-md font-black"
              : "bg-afri-bg-sec border border-afri-border/40 text-afri-text-sec hover:bg-afri-bg-ter hover:text-afri-text"
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Fil Réels Publics</span>
        </button>

        <button
          onClick={() => setActiveSubTab("my_pubs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
            activeSubTab === "my_pubs"
              ? "bg-[#D4AF37] text-black shadow-md font-black"
              : "bg-afri-bg-sec border border-afri-border/40 text-afri-text-sec hover:bg-afri-bg-ter hover:text-afri-text"
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Mes Publications & Brouillons</span>
        </button>
      </div>

      {/* Sub-tab views */}
      {activeSubTab === "my_pubs" ? (
        <MyPublicationsSection onOpenCreate={() => setIsCreatorOpen(true)} />
      ) : (
        <div className="space-y-4">
          {allReels.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-afri-bg-sec/40 border border-afri-border/50 rounded-3xl text-center min-h-[250px] space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30 text-[#D4AF37]">
                <Film className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-afri-text uppercase tracking-wide">Aucun Réel public disponible</h3>
              <p className="text-xs text-afri-text-sec max-w-xs">
                Soyez le premier à publier un Réel souverain sur la communauté AFRIGOMBO.
              </p>
              <button
                onClick={() => setIsCreatorOpen(true)}
                className="mt-2 bg-[#D4AF37] text-black font-black px-4 py-2 rounded-full text-xs uppercase tracking-wider cursor-pointer hover:bg-amber-400"
              >
                Publier une vidéo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allReels.map((reel) => (
                <div
                  key={reel.id}
                  onClick={() => {
                    setReelsVideoId(reel.id);
                    setReelsVideoUrl(reel.url);
                  }}
                  className="group relative aspect-[9/16] bg-black rounded-2xl overflow-hidden cursor-pointer border border-afri-border/50 hover:border-[#D4AF37] transition shadow-lg"
                >
                  <video src={reel.url} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" muted />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                    <p className="font-bold text-xs text-white line-clamp-1">{reel.title}</p>
                    <p className="text-[10px] text-amber-300 font-mono">{reel.artisticName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Creator Screen Overlay Modal */}
      {isCreatorOpen && (
        <ReelCreatorScreen
          onClose={() => setIsCreatorOpen(false)}
          onVideoReady={() => {
            setIsCreatorOpen(false);
          }}
        />
      )}
    </div>
  );
}

