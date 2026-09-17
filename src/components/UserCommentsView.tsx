import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, Send, Heart, Trash2, Clock, 
  Search, Filter, CheckCircle2, ShieldCheck, CornerDownRight, 
  MessageCircle, RefreshCw, AlertCircle, ExternalLink
} from "lucide-react";
import { db } from "../lib/firebase";
import { 
  collection, query, onSnapshot, doc, getDocs, addDoc, 
  updateDoc, deleteDoc, orderBy, serverTimestamp, setDoc 
} from "firebase/firestore";
import { UserProfile } from "../types";

export interface RealCommentItem {
  id: string;
  docId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorBadge?: string;
  isVerified?: boolean;
  targetId?: string;
  targetTitle: string;
  targetType: "gombo" | "vibe" | "profile" | "academie" | "post" | "social";
  text: string;
  createdAt: string;
  timestamp?: number;
  likes: number;
  likedBy?: string[];
  isLiked?: boolean;
  replies: {
    id: string;
    authorId?: string;
    authorName: string;
    authorAvatar?: string;
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
  const currentUid = currentUserProfile?.uid || "";
  const currentName = currentUserProfile?.artisticName || currentUserProfile?.displayName || "Artiste";
  const currentAvatar = currentUserProfile?.photoURL || currentUserProfile?.avatarUrl || "";

  const [comments, setComments] = useState<RealCommentItem[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, { name: string; avatar: string; isVerified?: boolean; badge?: string }>>({});
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"received" | "sent" | "all">("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [replyInput, setReplyInput] = useState<{ [commentId: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);

  // New Palabre creation state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newPalabreText, setNewPalabreText] = useState("");
  const [newPalabreTopic, setNewPalabreTopic] = useState("Discussion Générale");
  const [newPalabreType, setNewPalabreType] = useState<"gombo" | "vibe" | "post" | "social">("post");
  const [isSubmittingNewPalabre, setIsSubmittingNewPalabre] = useState(false);
  const [palabreSuccessNotice, setPalabreSuccessNotice] = useState<string | null>(null);

  // 1. Fetch real registered users from Firestore for dynamic profile & avatar lookup
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const map: Record<string, { name: string; avatar: string; isVerified?: boolean; badge?: string }> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const uid = docSnap.id;
        const name = data.artisticName || data.displayName || data.name || "Membre";
        const avatar = data.photoURL || data.avatarUrl || data.avatar || "";
        const isVerified = data.isVerified || data.isCertified || false;
        const badge = data.role === "founder" ? "FONDATEUR" : data.isVerified ? "VÉRIFIÉ" : data.accountType === "vip" ? "VIP" : "";
        map[uid] = { name, avatar, isVerified, badge };
        if (data.email) {
          map[data.email.toLowerCase()] = { name, avatar, isVerified, badge };
        }
      });
      setUsersMap(map);
    }, (err) => {
      console.warn("Error fetching users map in UserCommentsView:", err);
    });

    return () => unsubUsers();
  }, []);

  // 2. Fetch real comments from Firestore collections in real-time
  useEffect(() => {
    setLoading(true);

    const aggregatedComments = new Map<string, RealCommentItem>();

    const updateState = () => {
      const list = Array.from(aggregatedComments.values());
      // Sort newest first
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setComments(list);
      setLoading(false);
    };

    // A. Listen to post_comments collection
    const unsubPostComments = onSnapshot(collection(db, "post_comments"), (snapshot) => {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const cid = docSnap.id;
        const authorId = data.authorId || data.userId || data.userUid || "";
        const authorInfo = usersMap[authorId] as { name?: string; avatar?: string; isVerified?: boolean; badge?: string } | undefined;

        const createdAtRaw = data.createdAt;
        let ts = 0;
        let formattedTime = "Récemment";
        if (createdAtRaw) {
          const dateObj = typeof createdAtRaw === "string" ? new Date(createdAtRaw) : createdAtRaw?.toDate ? createdAtRaw.toDate() : new Date(createdAtRaw);
          if (!isNaN(dateObj.getTime())) {
            ts = dateObj.getTime();
            formattedTime = dateObj.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
          }
        }

        const likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
        const isLiked = currentUid ? likedBy.includes(currentUid) : false;
        const isSent = Boolean(currentUid && authorId === currentUid);
        const direction: "received" | "sent" = isSent ? "sent" : "received";

        aggregatedComments.set(`post_comment_${cid}`, {
          id: `post_comment_${cid}`,
          docId: cid,
          authorId,
          authorName: data.authorName || data.userName || authorInfo?.name || "Artiste",
          authorAvatar: data.authorAvatar || data.userAvatar || authorInfo?.avatar || "",
          authorBadge: authorInfo?.badge || data.badge || "",
          isVerified: authorInfo?.isVerified || data.isVerified,
          targetId: data.postId || data.targetId || "",
          targetTitle: data.targetTitle || data.postTitle || "Publication / Vibe",
          targetType: (data.targetType as any) || "vibe",
          text: data.text || data.content || data.comment || "",
          createdAt: formattedTime,
          timestamp: ts || Date.now(),
          likes: typeof data.likes === "number" ? data.likes : likedBy.length,
          likedBy,
          isLiked,
          replies: Array.isArray(data.replies) ? data.replies : [],
          direction
        });
      });
      updateState();
    }, (err) => {
      console.warn("Notice reading post_comments in UserCommentsView:", err);
      setLoading(false);
    });

    // B. Listen to general comments collection
    const unsubComments = onSnapshot(collection(db, "comments"), (snapshot) => {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const cid = docSnap.id;
        const authorId = data.authorId || data.userId || data.userUid || "";
        const authorInfo = usersMap[authorId] as { name?: string; avatar?: string; isVerified?: boolean; badge?: string } | undefined;

        const createdAtRaw = data.createdAt;
        let ts = 0;
        let formattedTime = "Récemment";
        if (createdAtRaw) {
          const dateObj = typeof createdAtRaw === "string" ? new Date(createdAtRaw) : createdAtRaw?.toDate ? createdAtRaw.toDate() : new Date(createdAtRaw);
          if (!isNaN(dateObj.getTime())) {
            ts = dateObj.getTime();
            formattedTime = dateObj.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
          }
        }

        const likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
        const isLiked = currentUid ? likedBy.includes(currentUid) : false;
        const isSent = Boolean(currentUid && authorId === currentUid);
        const direction: "received" | "sent" = isSent ? "sent" : "received";

        aggregatedComments.set(`comment_${cid}`, {
          id: `comment_${cid}`,
          docId: cid,
          authorId,
          authorName: data.authorName || data.userName || authorInfo?.name || "Artiste",
          authorAvatar: data.authorAvatar || data.userAvatar || authorInfo?.avatar || "",
          authorBadge: authorInfo?.badge || data.badge || "",
          isVerified: authorInfo?.isVerified || data.isVerified,
          targetId: data.postId || data.targetId || "",
          targetTitle: data.targetTitle || data.postTitle || "Opportunité / Gombo",
          targetType: (data.targetType as any) || "gombo",
          text: data.text || data.content || data.comment || "",
          createdAt: formattedTime,
          timestamp: ts || Date.now(),
          likes: typeof data.likes === "number" ? data.likes : likedBy.length,
          likedBy,
          isLiked,
          replies: Array.isArray(data.replies) ? data.replies : [],
          direction
        });
      });
      updateState();
    }, (err) => {
      console.warn("Notice reading comments in UserCommentsView:", err);
      setLoading(false);
    });

    // C. Listen to posts collection to extract embedded comments
    const unsubPosts = onSnapshot(collection(db, "posts"), (snapshot) => {
      snapshot.forEach((docSnap) => {
        const postData = docSnap.data();
        const postId = docSnap.id;
        const postTitle = postData.title || postData.name || "Annonce Gombo";
        const postOwnerId = postData.userId || postData.authorId || "";

        if (Array.isArray(postData.comments)) {
          postData.comments.forEach((c: any, index: number) => {
            const commentId = c.id || `post_${postId}_c_${index}`;
            const authorId = c.authorId || c.userId || "";
            const authorInfo = usersMap[authorId] as { name?: string; avatar?: string; isVerified?: boolean; badge?: string } | undefined;

            let ts = Date.now();
            let formattedTime = "Récemment";
            if (c.createdAt) {
              const dateObj = typeof c.createdAt === "string" ? new Date(c.createdAt) : c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
              if (!isNaN(dateObj.getTime())) {
                ts = dateObj.getTime();
                formattedTime = dateObj.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
              }
            }

            const likedBy = Array.isArray(c.likedBy) ? c.likedBy : [];
            const isLiked = currentUid ? likedBy.includes(currentUid) : false;
            const isSent = Boolean(currentUid && authorId === currentUid);
            const isMyPost = Boolean(currentUid && postOwnerId === currentUid);
            const direction: "received" | "sent" = isSent ? "sent" : (isMyPost ? "received" : "received");

            aggregatedComments.set(commentId, {
              id: commentId,
              docId: postId,
              authorId,
              authorName: c.authorName || c.userName || authorInfo?.name || "Membre AFRIGOMBO",
              authorAvatar: c.authorAvatar || c.userAvatar || authorInfo?.avatar || "",
              authorBadge: authorInfo?.badge || c.badge || "",
              isVerified: authorInfo?.isVerified || c.isVerified,
              targetId: postId,
              targetTitle: postTitle,
              targetType: "gombo",
              text: c.text || c.content || c.comment || "",
              createdAt: formattedTime,
              timestamp: ts,
              likes: typeof c.likes === "number" ? c.likes : likedBy.length,
              likedBy,
              isLiked,
              replies: Array.isArray(c.replies) ? c.replies : [],
              direction
            });
          });
        }
      });
      updateState();
    }, (err) => {
      console.warn("Notice reading posts comments in UserCommentsView:", err);
    });

    return () => {
      unsubPostComments();
      unsubComments();
      unsubPosts();
    };
  }, [currentUid, usersMap]);

  // Handle Like in Firestore
  const handleToggleLike = async (comment: RealCommentItem) => {
    if (!currentUid) {
      if (onNavigateTo) onNavigateTo("login");
      return;
    }

    const currentLikedBy = comment.likedBy || [];
    const isCurrentlyLiked = currentLikedBy.includes(currentUid);
    const newLikedBy = isCurrentlyLiked
      ? currentLikedBy.filter((uid) => uid !== currentUid)
      : [...currentLikedBy, currentUid];

    // Optimistic UI update
    setComments((prev) =>
      prev.map((c) =>
        c.id === comment.id
          ? {
              ...c,
              isLiked: !isCurrentlyLiked,
              likes: newLikedBy.length,
              likedBy: newLikedBy
            }
          : c
      )
    );

    try {
      if (comment.id.startsWith("post_comment_")) {
        await updateDoc(doc(db, "post_comments", comment.docId), {
          likes: newLikedBy.length,
          likedBy: newLikedBy
        });
      } else if (comment.id.startsWith("comment_")) {
        await updateDoc(doc(db, "comments", comment.docId), {
          likes: newLikedBy.length,
          likedBy: newLikedBy
        });
      }
    } catch (err) {
      console.warn("Error updating comment like in Firestore:", err);
    }
  };

  // Handle Reply submission in Firestore
  const handleSendReply = async (comment: RealCommentItem) => {
    const text = (replyInput[comment.id] || "").trim();
    if (!text || submittingReplyId) return;

    setSubmittingReplyId(comment.id);

    const newReply = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authorId: currentUid,
      authorName: currentName,
      authorAvatar: currentAvatar,
      text,
      createdAt: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    };

    // Optimistic UI update
    setComments((prev) =>
      prev.map((c) =>
        c.id === comment.id
          ? {
              ...c,
              replies: [...c.replies, newReply]
            }
          : c
      )
    );

    setReplyInput((prev) => ({ ...prev, [comment.id]: "" }));
    setActiveReplyId(null);

    try {
      const updatedReplies = [...comment.replies, newReply];
      if (comment.id.startsWith("post_comment_")) {
        await updateDoc(doc(db, "post_comments", comment.docId), {
          replies: updatedReplies
        });
      } else if (comment.id.startsWith("comment_")) {
        await updateDoc(doc(db, "comments", comment.docId), {
          replies: updatedReplies
        });
      } else {
        // Create an entry in post_comments linked to this target
        await addDoc(collection(db, "post_comments"), {
          postId: comment.targetId || comment.docId,
          targetTitle: comment.targetTitle,
          authorId: currentUid,
          authorName: currentName,
          authorAvatar: currentAvatar,
          text: `En réponse à ${comment.authorName} : ${text}`,
          createdAt: new Date().toISOString(),
          likes: 0,
          likedBy: [],
          replies: []
        });
      }
    } catch (err) {
      console.warn("Error saving reply to Firestore:", err);
    } finally {
      setSubmittingReplyId(null);
    }
  };

  // Handle Delete (Only author or admin)
  const handleDeleteComment = async (comment: RealCommentItem) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce palabre ?")) return;

    // Optimistic remove
    setComments((prev) => prev.filter((c) => c.id !== comment.id));

    try {
      if (comment.id.startsWith("post_comment_")) {
        await deleteDoc(doc(db, "post_comments", comment.docId));
      } else if (comment.id.startsWith("comment_")) {
        await deleteDoc(doc(db, "comments", comment.docId));
      }
    } catch (err) {
      console.warn("Error deleting comment from Firestore:", err);
    }
  };

  // Handle Publishing a New Authentic Palabre
  const handlePublishNewPalabre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPalabreText.trim()) return;

    setIsSubmittingNewPalabre(true);
    try {
      const realAuthorId = currentUid || "founder";
      const realAuthorName = currentName || "Membre Authentique";
      const realAuthorAvatar = currentAvatar || "";

      await addDoc(collection(db, "post_comments"), {
        authorId: realAuthorId,
        authorName: realAuthorName,
        authorAvatar: realAuthorAvatar,
        text: newPalabreText.trim(),
        targetTitle: newPalabreTopic || "Discussion Générale",
        targetType: newPalabreType,
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        likes: 0,
        likedBy: [],
        replies: []
      });

      setNewPalabreText("");
      setIsComposerOpen(false);
      setPalabreSuccessNotice("Votre palabre a été publié avec succès avec votre profil réel !");
      setTimeout(() => setPalabreSuccessNotice(null), 4000);
    } catch (err) {
      console.error("Error publishing new palabre:", err);
      alert("Erreur lors de la publication du palabre. Veuillez réessayer.");
    } finally {
      setIsSubmittingNewPalabre(false);
    }
  };

  const filteredComments = comments.filter((c) => {
    if (activeTab === "received" && c.direction !== "received") return false;
    if (activeTab === "sent" && c.direction !== "sent") return false;

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

  const receivedCount = comments.filter((c) => c.direction === "received").length;
  const sentCount = comments.filter((c) => c.direction === "sent").length;

  return (
    <div className="max-w-5xl mx-auto w-full px-1.5 xs:px-2.5 sm:px-6 overflow-x-hidden space-y-4 text-afri-text pb-20">
      {/* HEADER / NAVIGATION BAR */}
      <div className="flex items-center justify-between gap-3 bg-afri-bg/90 border border-afri-border/80 p-2.5 sm:p-3.5 rounded-2xl backdrop-blur-md shadow-lg sticky top-2 z-20">
        <div className="flex items-center gap-2 truncate">
          <MessageSquare className="w-5 h-5 text-[#D4AF37] shrink-0" />
          <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-afri-text truncate">
            Palabres & Échanges Réels
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {loading && (
            <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37] animate-spin" />
          )}
          <div className="px-2.5 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] font-mono font-black text-[10px] rounded-full shrink-0">
            {comments.length} Réels
          </div>
        </div>
      </div>

      {/* BANNER & TABS */}
      <div className="p-4 sm:p-6 bg-afri-bg border border-[#D4AF37]/30 rounded-3xl relative overflow-hidden shadow-xl space-y-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[#D4AF37] font-bold text-[9.5px] uppercase font-mono tracking-widest mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Discussion Communautaire Authentique</span>
            </p>
            <p className="text-xs text-afri-text-sec">
              Consultez les palabres et négociations réelles rédigées par les membres de la plateforme.
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
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${activeTab === "received" ? "bg-afri-bg text-[#D4AF37]" : "bg-afri-bg text-afri-text-sec"}`}>
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
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${activeTab === "sent" ? "bg-afri-bg text-[#D4AF37]" : "bg-afri-bg text-afri-text-sec"}`}>
                {sentCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "all" ? "bg-[#D4AF37] text-black shadow-md" : "text-afri-text-sec hover:text-afri-text"
              }`}
            >
              <span>Tous</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${activeTab === "all" ? "bg-afri-bg text-[#D4AF37]" : "bg-afri-bg text-afri-text-sec"}`}>
                {comments.length}
              </span>
            </button>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTERS */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-afri-border/60">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-afri-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un palabre ou un auteur réel..."
              className="w-full pl-9 pr-3 py-1.5 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-xs">
            <Filter className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 ml-1" />
            {[
              { id: "all", label: "Tous" },
              { id: "gombo", label: "Gombos" },
              { id: "vibe", label: "Vibes" },
              { id: "post", label: "Posts" }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer border transition-all ${
                  filterType === f.id 
                    ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]" 
                    : "bg-afri-bg-sec/50 border-afri-border text-afri-text-sec hover:text-afri-text"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SUCCESS NOTICE */}
      {palabreSuccessNotice && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-400 text-xs font-mono text-center flex items-center justify-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{palabreSuccessNotice}</span>
        </div>
      )}

      {/* COMPOSER / NOUVEAU PALABRE */}
      <div className="p-4 sm:p-5 bg-afri-bg border border-[#D4AF37]/35 rounded-3xl shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-afri-bg-sec border border-[#D4AF37]/50 overflow-hidden flex items-center justify-center text-[#D4AF37] font-black text-xs">
              {currentAvatar ? (
                <img 
                  src={currentAvatar} 
                  alt={currentName} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                currentName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase text-afri-text">{currentName}</span>
                {currentUserProfile?.isVerified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                )}
                <span className="px-1.5 py-0.2 bg-[#D4AF37]/15 text-[#D4AF37] text-[8px] font-mono font-bold uppercase rounded">
                  {currentUserProfile?.role === "founder" ? "FONDATEUR" : "COMPTE RÉEL"}
                </span>
              </div>
              <p className="text-[9.5px] text-afri-text-muted font-mono">Publiez une discussion publique authentique</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsComposerOpen(!isComposerOpen)}
            className="px-3 py-1.5 bg-[#D4AF37] hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isComposerOpen ? "Fermer" : "Écrire un Palabre"}</span>
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        </div>

        {isComposerOpen && (
          <form onSubmit={handlePublishNewPalabre} className="space-y-3 pt-3 border-t border-afri-border/60 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-mono uppercase text-afri-text-sec block mb-1">Thème / Sujet</label>
                <input
                  type="text"
                  value={newPalabreTopic}
                  onChange={(e) => setNewPalabreTopic(e.target.value)}
                  placeholder="Ex: Opportunité de Tournage, Collaboration Beatmaker..."
                  className="w-full px-3 py-2 bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-afri-text-sec block mb-1">Catégorie</label>
                <select
                  value={newPalabreType}
                  onChange={(e) => setNewPalabreType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] rounded-xl text-xs text-afri-text focus:outline-none"
                >
                  <option value="post">Discussion Générale (Post)</option>
                  <option value="gombo">Opportunité & Gombo</option>
                  <option value="vibe">Musique & Vibe</option>
                  <option value="social">Entraide & Communauté</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-afri-text-sec block mb-1">Votre Message Authentique</label>
              <textarea
                value={newPalabreText}
                onChange={(e) => setNewPalabreText(e.target.value)}
                placeholder="Exprimez-vous publiquement auprès de la communauté..."
                rows={3}
                className="w-full px-3 py-2 bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none resize-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="px-3 py-1.5 bg-afri-bg-sec hover:bg-afri-border text-afri-text-sec text-xs font-bold uppercase rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={isSubmittingNewPalabre || !newPalabreText.trim()}
                className="px-4 py-1.5 bg-[#D4AF37] hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingNewPalabre ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Publier le Palabre</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* REAL COMMENTS LIST */}
      <div className="space-y-4">
        {loading && comments.length === 0 ? (
          <div className="p-12 text-center bg-afri-bg border border-afri-border rounded-3xl space-y-3 font-mono">
            <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto" />
            <p className="text-xs text-afri-text-sec">Chargement des palabres réels en cours...</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="p-10 text-center bg-afri-bg border border-afri-border rounded-3xl space-y-3">
            <MessageCircle className="w-12 h-12 text-[#D4AF37]/40 mx-auto" />
            <h3 className="text-afri-text font-mono text-xs font-bold uppercase tracking-widest">
              Aucun palabre trouvé
            </h3>
            <p className="text-afri-text-sec text-xs max-w-sm mx-auto">
              {activeTab === "received"
                ? "Vous n'avez pas encore de palabre reçu sur vos annonces."
                : activeTab === "sent"
                ? "Vous n'avez pas encore publié de palabre sur la plateforme."
                : "Aucun échange public ne correspond à vos filtres."}
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-full overflow-hidden p-4 sm:p-5 rounded-2xl bg-afri-bg border border-afri-border hover:border-[#D4AF37]/40 transition-all shadow-md space-y-3"
            >
              {/* TOP HEADER */}
              <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-afri-bg-sec border border-[#D4AF37]/50 overflow-hidden shrink-0 flex items-center justify-center text-[#D4AF37] font-bold text-sm shadow-inner">
                    {comment.authorAvatar ? (
                      <img 
                        src={comment.authorAvatar} 
                        alt={comment.authorName} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Hide broken image and fallback to initials
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      comment.authorName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-afri-text truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none block">
                        {comment.authorName}
                      </h4>
                      {comment.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      )}
                      {comment.authorBadge && (
                        <span className="px-1.5 py-0.2 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 text-[8px] font-mono font-bold uppercase rounded">
                          {comment.authorBadge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[9.5px] text-afri-text-muted font-mono mt-0.5">
                      <Clock className="w-3 h-3 text-[#D4AF37]/70" />
                      <span>{comment.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-afri-bg-sec border border-afri-border text-[9px] font-mono font-bold text-afri-text-sec uppercase rounded-lg truncate max-w-[160px]">
                    {comment.targetTitle}
                  </span>
                  {(comment.authorId === currentUid || currentUserProfile?.role === "founder" || currentUserProfile?.email === "jhs.kmj7@gmail.com") && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment)}
                      className="p-1.5 text-zinc-600 hover:text-red-400 transition cursor-pointer rounded-lg hover:bg-red-500/10"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* COMMENT TEXT */}
              <div className="p-3.5 bg-afri-bg-sec/70 rounded-xl border border-afri-border/60 text-xs sm:text-sm text-afri-text leading-relaxed font-sans break-words w-full">
                {comment.text}
              </div>

              {/* ACTIONS: LIKE / REPLY BUTTON */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(comment)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                      comment.isLiked
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        : "bg-afri-bg-sec border border-afri-border text-afri-text-sec hover:text-afri-text"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${comment.isLiked ? "fill-current text-rose-500" : ""}`} />
                    <span>{comment.likes}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveReplyId((prev) => (prev === comment.id ? null : comment.id))}
                    className="px-3 py-1 rounded-lg bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] text-afri-text text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Répondre ({comment.replies.length})</span>
                  </button>
                </div>

                {comment.authorId && comment.authorId !== currentUid && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateTo) onNavigateTo("user_messages", comment.authorId);
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
                  {comment.replies.map((rep) => {
                    const replierInfo = rep.authorId && usersMap[rep.authorId] ? usersMap[rep.authorId] : null;
                    const repAvatar = replierInfo?.avatar || rep.authorAvatar || "";
                    const repName = replierInfo?.name || rep.authorName || "Membre";
                    const isRepVerified = replierInfo?.isVerified || false;

                    return (
                      <div key={rep.id} className="p-3 bg-afri-bg-sec/90 rounded-xl border border-afri-border/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-afri-bg border border-[#D4AF37]/40 overflow-hidden flex items-center justify-center text-[#D4AF37] font-bold text-[9px] shrink-0">
                              {repAvatar ? (
                                <img 
                                  src={repAvatar} 
                                  alt={repName} 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                repName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="font-bold text-[#D4AF37] uppercase text-[10px] flex items-center gap-1">
                              <span>{repName}</span>
                              {isRepVerified && <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" />}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-afri-text-muted">{rep.createdAt}</span>
                        </div>
                        <p className="text-afri-text leading-snug pl-7">{rep.text}</p>
                      </div>
                    );
                  })}
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
                        onChange={(e) => setReplyInput((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendReply(comment);
                        }}
                        placeholder="Écrivez votre réponse publique authentique..."
                        className="flex-1 bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] rounded-xl px-3 py-2 text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={submittingReplyId === comment.id}
                        onClick={() => handleSendReply(comment)}
                        className="px-4 py-2 bg-[#D4AF37] hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                      >
                        {submittingReplyId === comment.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
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
