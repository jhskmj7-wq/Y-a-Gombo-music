import React, { useState } from "react";
import { MessageSquare, ShieldAlert, CheckCircle, Trash2, Search, Sliders } from "lucide-react";
import { Post } from "../../types";

interface AdminModerationProps {
  posts: Post[];
  onDeletePost?: (postId: string) => void;
  onUnflagPost?: (postId: string) => void;
  audioSynth?: any;
}

export default function AdminModeration({
  posts = [],
  onDeletePost,
  onUnflagPost,
  audioSynth
}: AdminModerationProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "flagged" | "standard">("all");

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.authorArtisticName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.authorName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "flagged" && p.isFlagged) ||
      (filter === "standard" && !p.isFlagged);

    return matchesSearch && matchesFilter;
  });

  const handleUnflag = (id: string) => {
    if (onUnflagPost) {
      onUnflagPost(id);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    }
  };

  const handleDelete = (id: string) => {
    if (onDeletePost) {
      onDeletePost(id);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    }
  };

  return (
    <div className="space-y-6 text-left pb-24 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-afri-border pb-4">
        <div>
          <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37] flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
            Modération des Publications
          </h3>
          <p className="text-xs text-afri-text-sec mt-1">
            Supervisez les annonces, castings et publications sur Le Terrain pour éliminer les abus.
          </p>
        </div>

        <div className="flex gap-2">
          {(["all", "flagged", "standard"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase font-bold tracking-wider border transition-all ${
                filter === tab
                  ? "bg-afri-bg-sec/10 border-[#D4AF37] text-[#D4AF37]"
                  : "bg-afri-bg border-afri-border hover:border-afri-border text-afri-text-sec"
              }`}
            >
              {tab === "all" ? "Toutes" : tab === "flagged" ? "Signalées" : "Standard"}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-afri-text-sec" />
        <input
          type="text"
          placeholder="Rechercher par contenu ou nom d'artiste..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-afri-bg-sec border border-[#D4AF37]/20 rounded-xl py-3 pl-10 pr-4 text-xs font-sans text-afri-text placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37] transition-all"
        />
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center p-12 bg-afri-bg/40 border border-afri-border rounded-2xl text-afri-text-sec text-xs font-mono">
            Aucune publication ne correspond à votre recherche.
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className={`p-5 rounded-2xl border ${
                post.isFlagged ? "border-red-500/20 bg-red-500/5" : "border-afri-border bg-afri-bg"
              } space-y-3`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <strong className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider">Auteur</strong>
                  <h4 className="text-sm font-sans font-black text-afri-text">{post.authorArtisticName || post.authorName}</h4>
                </div>

                {post.isFlagged && (
                  <span className="text-[9px] font-mono bg-red-500/10 border border-red-500/25 text-red-400 px-2 py-0.5 rounded font-black uppercase">
                    Signalé : {post.flagReason || "Contenu suspect"}
                  </span>
                )}
              </div>

              <p className="text-xs text-afri-text leading-relaxed bg-afri-bg-sec p-4 border border-afri-border/50 rounded-xl">
                {post.content}
              </p>

              <div className="flex gap-2 justify-end pt-1">
                {post.isFlagged && onUnflagPost && (
                  <button
                    onClick={() => handleUnflag(post.id)}
                    className="px-4 py-2 rounded-xl bg-afri-bg-sec hover:bg-afri-bg-ter border border-afri-border text-afri-text font-mono font-bold text-[10px] uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Valider (Retirer signalement)
                  </button>
                )}
                {onDeletePost && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="px-4 py-2 rounded-xl bg-red-950/20 hover:bg-red-900/30 border border-red-900/30 text-red-400 font-mono font-bold text-[10px] uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer définitivement
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
