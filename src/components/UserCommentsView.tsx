import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, Send, ArrowLeft, Heart, Sparkles, 
  Trash2, User, CornerDownRight, CheckCircle2, ShieldCheck,
  Filter, Search, Clock, ThumbsUp, MessageCircle
} from "lucide-react";
import { UserProfile } from "../types";

interface CommentItem {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorBadge?: string;
  targetTitle: string;
  targetType: "gombo" | "vibe" | "profile" | "academie";
  text: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
  replies: {
    id: string;
    authorName: string;
    text: string;
    createdAt: string;
  }[];
  direction: "received" | "sent";
}

interface UserCommentsViewProps {
  currentUserProfile?: UserProfile | null;
  onBack: () => void;
  onNavigateTo?: (menu: string, id?: string) => void;
}

export default function UserCommentsView({
  currentUserProfile,
  onBack,
  onNavigateTo
}: UserCommentsViewProps) {
  const userId = currentUserProfile?.uid || "guest";
  const storageKey = `afrigombo_user_comments_${userId}`;

  // Initial mock comments + persistent local storage
  const [comments, setComments] = useState<CommentItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return [
      {
        id: "c1",
        authorId: "u_alpha",
        authorName: "Alpha Blondy Prod",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        authorBadge: "PROD CERTIFIÉ",
        targetTitle: "Annonce : Bassiste Recherché pour Concert Marcory",
        targetType: "gombo",
        text: "Bonjour ! Est-ce que tu es disponible ce vendredi soir pour une balance à 18h avant le show ?",
        createdAt: "Il y a 15 min",
        likes: 3,
        isLiked: false,
        replies: [
          {
            id: "r1",
            authorName: currentUserProfile?.artisticName || "Vous",
            text: "Oui chef ! Je serai là dès 17h30 avec tout mon matériel.",
            createdAt: "Il y a 5 min"
          }
        ],
        direction: "received"
      },
      {
        id: "c2",
        authorId: "u_serge",
        authorName: "Serge Beynaud Off",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        authorBadge: "VIP ELITE",
        targetTitle: "Extrait Beat Coupé-Décalé 2026",
        targetType: "vibe",
        text: "Lourd le groove piano ! J'aimerais poser des voix dessus la semaine prochaine.",
        createdAt: "Il y a 2h",
        likes: 12,
        isLiked: true,
        replies: [],
        direction: "received"
      },
      {
        id: "c3",
        authorId: "u_me",
        authorName: currentUserProfile?.artisticName || "Vous",
        authorAvatar: currentUserProfile?.photoURL || "",
        authorBadge: "MEMBRE CERTIFIÉ",
        targetTitle: "Publication : Studio enregistrement Yopougon",
        targetType: "profile",
        text: "Magnifique acoustique ! Quel est votre tarif pour un mixage complet 8 pistes ?",
        createdAt: "Hier à 14:20",
        likes: 2,
        isLiked: false,
        replies: [
          {
            id: "r2",
            authorName: "Studio Yop Kings",
            text: "Merci ! C'est 25.000 FCFA par titre avec mastering offert.",
            createdAt: "Hier à 16:00"
          }
        ],
        direction: "sent"
      },
      {
        id: "c4",
        authorId: "u_fatou",
        authorName: "Fatou K. Vocaliste",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        authorBadge: "GOMBO ID",
        targetTitle: "Cours : Harmonie & Solfège Africain",
        targetType: "academie",
        text: "Merci pour cette leçon sur les rythmes polyrythmiques, très clair !",
        createdAt: "22/07/2026",
        likes: 5,
        isLiked: false,
        replies: [],
        direction: "received"
      }
    ];
  });

  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [filterType, setFilterType] = useState<string>("all");
  const [replyInput, setReplyInput] = useState<{ [commentId: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Save to localStorage whenever comments change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(comments));
    } catch (e) {}
  }, [comments, storageKey]);

  const handleToggleLike = (id: string) => {
    setComments(prev => prev.map(c => {
      if (c.id === id) {
        const nextLiked = !c.isLiked;
        return {
          ...c,
          isLiked: nextLiked,
          likes: nextLiked ? c.likes + 1 : c.likes - 1
        };
      }
      return c;
    }));
  };

  const handleSendReply = (commentId: string) => {
    const text = (replyInput[commentId] || "").trim();
    if (!text) return;

    const newReply = {
      id: `rep_${Date.now()}`,
      authorName: currentUserProfile?.artisticName || "Vous",
      text,
      createdAt: "À l'instant"
    };

    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [...c.replies, newReply]
        };
      }
      return c;
    }));

    setReplyInput(prev => ({ ...prev, [commentId]: "" }));
    setActiveReplyId(null);
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce commentaire ?")) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    }
  };

  const filteredComments = comments.filter(c => {
    if (c.direction !== activeTab) return false;
    if (filterType !== "all" && c.targetType !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.authorName.toLowerCase().includes(q) ||
        c.text.toLowerCase().includes(q) ||
        c.targetTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const receivedCount = comments.filter(c => c.direction === "received").length;
  const sentCount = comments.filter(c => c.direction === "sent").length;

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-5 py-3 sm:py-5 px-3 sm:px-4 text-afri-text pb-28">
      {/* HEADER / NAVIGATION BAR (ANDROID FRIENDLY) */}
      <div className="flex items-center justify-between gap-3 bg-afri-bg/90 border border-afri-border/80 p-2.5 sm:p-3.5 rounded-2xl backdrop-blur-md shadow-lg sticky top-2 z-20">
        <button
          type="button"
          onClick={onBack}
          className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] text-afri-text hover:text-[#D4AF37] transition-all cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
          title="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-xs font-bold uppercase font-mono hidden xs:inline">Retour</span>
        </button>

        <div className="flex items-center gap-2 truncate">
          <MessageSquare className="w-5 h-5 text-[#D4AF37] shrink-0" />
          <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-afri-text truncate">
            Commentaires & Interactions
          </h1>
        </div>

        <div className="px-2.5 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] font-mono font-black text-[10px] rounded-full shrink-0">
          {comments.length} Total
        </div>
      </div>

      {/* BANNER & TABS */}
      <div className="p-4 sm:p-6 bg-afri-bg border border-[#D4AF37]/30 rounded-3xl relative overflow-hidden shadow-xl space-y-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[#D4AF37] font-bold text-[9.5px] uppercase font-mono tracking-widest mb-1">
              💬 Centre d'Échange Public
            </p>
            <p className="text-xs text-afri-text-sec">
              Gérez les commentaires reçus sur vos annonces/vibes et répondez en direct à vos fans et collaborateurs.
            </p>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex items-center gap-1.5 bg-afri-bg-sec/80 p-1.5 rounded-2xl border border-afri-border shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("received")}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "received" ? "bg-[#D4AF37] text-black shadow-md" : "text-afri-text-sec hover:text-afri-text"
              }`}
            >
              <span>Reçus</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${activeTab === "received" ? "bg-black text-[#D4AF37]" : "bg-afri-bg text-zinc-400"}`}>
                {receivedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sent")}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "sent" ? "bg-[#D4AF37] text-black shadow-md" : "text-afri-text-sec hover:text-afri-text"
              }`}
            >
              <span>Envoyés</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${activeTab === "sent" ? "bg-black text-[#D4AF37]" : "bg-afri-bg text-zinc-400"}`}>
                {sentCount}
              </span>
            </button>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTERS */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-afri-border/60">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un commentaire ou nom..."
              className="w-full pl-9 pr-3 py-1.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-xs">
            <Filter className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 ml-1" />
            {[
              { id: "all", label: "Tous" },
              { id: "gombo", label: "Gombos" },
              { id: "vibe", label: "Vibes" },
              { id: "profile", label: "Profil" },
              { id: "academie", label: "Académie" }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer border transition-all ${
                  filterType === f.id 
                    ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]" 
                    : "bg-afri-bg-sec/50 border-afri-border text-zinc-400 hover:text-afri-text"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* COMMENTS LIST */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <div className="p-10 text-center bg-afri-bg border border-afri-border rounded-3xl space-y-3">
            <MessageCircle className="w-12 h-12 text-[#D4AF37]/40 mx-auto" />
            <h3 className="text-afri-text font-mono text-xs font-bold uppercase tracking-widest">
              Aucun commentaire trouvé
            </h3>
            <p className="text-afri-text-sec text-xs max-w-sm mx-auto">
              {activeTab === "received"
                ? "Vous n'avez pas encore de commentaire reçu pour cette catégorie."
                : "Vous n'avez pas encore laissé de commentaires récents."}
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 rounded-2xl bg-afri-bg border border-afri-border hover:border-[#D4AF37]/40 transition-all shadow-md space-y-3"
            >
              {/* TOP HEADER */}
              <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-afri-bg-sec border border-[#D4AF37]/50 overflow-hidden shrink-0 flex items-center justify-center text-[#D4AF37] font-bold text-sm">
                    {comment.authorAvatar ? (
                      <img src={comment.authorAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      comment.authorName.charAt(0)
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-afri-text">
                        {comment.authorName}
                      </h4>
                      {comment.authorBadge && (
                        <span className="px-1.5 py-0.2 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 text-[8px] font-mono font-bold uppercase rounded">
                          {comment.authorBadge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[9.5px] text-zinc-500 font-mono mt-0.5">
                      <Clock className="w-3 h-3 text-[#D4AF37]/70" />
                      <span>{comment.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-afri-bg-sec border border-afri-border text-[9px] font-mono font-bold text-zinc-400 uppercase rounded-lg truncate max-w-[160px]">
                    {comment.targetTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 transition cursor-pointer rounded-lg hover:bg-red-500/10"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* COMMENT TEXT */}
              <div className="p-3.5 bg-afri-bg-sec/70 rounded-xl border border-afri-border/60 text-xs sm:text-sm text-afri-text leading-relaxed font-sans">
                {comment.text}
              </div>

              {/* ACTIONS: LIKE / REPLY BUTTON */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(comment.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                      comment.isLiked
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        : "bg-afri-bg-sec border border-afri-border text-zinc-400 hover:text-afri-text"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${comment.isLiked ? "fill-current text-rose-500" : ""}`} />
                    <span>{comment.likes}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveReplyId(prev => prev === comment.id ? null : comment.id)}
                    className="px-3 py-1 rounded-lg bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] text-afri-text text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Répondre ({comment.replies.length})</span>
                  </button>
                </div>

                {comment.direction === "received" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateTo) onNavigateTo("user_messages");
                    }}
                    className="text-[10px] font-mono font-bold uppercase text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Contacter en privé</span>
                    <CornerDownRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* EXISTING REPLIES */}
              {comment.replies.length > 0 && (
                <div className="pl-4 sm:pl-6 border-l-2 border-[#D4AF37]/30 space-y-2 mt-2 pt-2">
                  {comment.replies.map((rep) => (
                    <div key={rep.id} className="p-3 bg-afri-bg-sec/90 rounded-xl border border-afri-border/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#D4AF37] uppercase text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {rep.authorName}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">{rep.createdAt}</span>
                      </div>
                      <p className="text-afri-text leading-snug">{rep.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* INLINE REPLY BOX */}
              <AnimatePresence>
                {activeReplyId === comment.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyInput[comment.id] || ""}
                        onChange={(e) => setReplyInput(prev => ({ ...prev, [comment.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendReply(comment.id);
                        }}
                        placeholder="Écrivez votre réponse publique..."
                        className="flex-1 bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] rounded-xl px-3 py-2 text-xs text-afri-text placeholder:text-zinc-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendReply(comment.id)}
                        className="px-4 py-2 bg-[#D4AF37] hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Envoyer</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
