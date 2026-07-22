import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, ShieldCheck, Award, Heart, MessageSquare, Share2, Bookmark, AlertTriangle, 
  MapPin, Calendar, Music, Film, Image as ImageIcon, Volume2, Star, CheckCircle2, 
  ExternalLink, Sparkles, UserCheck, UserPlus, Clock, Flame, Briefcase, ChevronRight,
  Play, Pause, FileText, Lock
} from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { gomboDB } from "../firebase";
import { UserProfile, Post, Gombo, GomboSafeContract } from "../types";

interface PublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string | null;
  currentUser: any;
  onOpenDirectMessage?: (targetUserId: string, targetName: string) => void;
  onNavigateToGombo?: (gomboId: string) => void;
}

export function PublicProfileModal({
  isOpen,
  onClose,
  targetUserId,
  currentUser,
  onOpenDirectMessage,
  onNavigateToGombo
}: PublicProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"reels" | "audios" | "photos" | "collaborations" | "reviews" | "posts" | "gombos">("reels");
  
  // Real statistical state from Firebase
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userContracts, setUserContracts] = useState<GomboSafeContract[]>([]);
  const [publishedGombos, setPublishedGombos] = useState<Gombo[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  
  // Interaction states
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [showReportDialog, setShowReportDialog] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>("Inapproprié");
  const [reportDetails, setReportDetails] = useState<string>("");
  const [reportSubmitted, setReportSubmitted] = useState<boolean>(false);

  // Audio player state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Fetch target user data whenever targetUserId changes
  useEffect(() => {
    if (!isOpen || !targetUserId) {
      setProfile(null);
      return;
    }

    setLoading(true);

    // 1. Listen to real-time User Profile doc
    const unsubProfile = gomboDB.listenUserProfile(targetUserId, (p) => {
      if (p) {
        setProfile(p);
        // Check follow and saved status relative to currentUser
        if (currentUser?.uid) {
          setIsFollowing((p.followers || []).includes(currentUser.uid));
          setIsSaved((currentUser.savedTalents || []).includes(targetUserId));
        }
      }
      setLoading(false);
    });

    // 2. Fetch User's Real Posts from Firestore
    if (db) {
      const postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", targetUserId),
        orderBy("createdAt", "desc")
      );
      getDocs(postsQuery)
        .then((snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
          setUserPosts(list);
        })
        .catch((err) => {
          // Fallback if index missing or query fails
          const fallbackQuery = query(collection(db, "posts"), where("authorId", "==", targetUserId));
          getDocs(fallbackQuery).then(snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
            setUserPosts(list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
          }).catch(console.error);
        });

      // 3. Fetch User's Contracts / Collaborations
      const contractsQuery = query(
        collection(db, "contracts"),
        where("artistId", "==", targetUserId)
      );
      getDocs(contractsQuery)
        .then((snap) => {
          setUserContracts(snap.docs.map(d => ({ id: d.id, ...d.data() } as GomboSafeContract)));
        })
        .catch(console.error);

      // 4. Fetch Published Gombos (if recruiter/promoter)
      const gombosQuery = query(
        collection(db, "gombos"),
        where("organizerId", "==", targetUserId)
      );
      getDocs(gombosQuery)
        .then((snap) => {
          setPublishedGombos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Gombo)));
        })
        .catch(console.error);
    }

    return () => {
      unsubProfile();
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [isOpen, targetUserId, currentUser?.uid]);

  // Toggle follow action
  const handleToggleFollow = async () => {
    if (!currentUser?.uid || !targetUserId) return;
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    await gomboDB.toggleFollowUser(targetUserId, currentUser.uid);
  };

  // Toggle bookmark action
  const handleToggleSave = async () => {
    if (!currentUser?.uid || !targetUserId) return;
    const nextState = !isSaved;
    setIsSaved(nextState);
    await gomboDB.toggleBookmarkUser(targetUserId, currentUser.uid);
  };

  // Copy share link
  const handleShare = () => {
    const url = `${window.location.origin}/profile/${targetUserId}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    });
  };

  // Handle report submission
  const handleSendReport = async () => {
    if (!currentUser?.uid || !targetUserId) return;
    await gomboDB.reportUser({
      targetUserId,
      reporterUserId: currentUser.uid,
      reason: reportReason,
      details: reportDetails
    });
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setShowReportDialog(false);
    }, 2000);
  };

  // Audio preview playback toggle
  const toggleAudio = (audioUrl: string, id: string) => {
    if (playingAudioId === id) {
      if (audioElement) {
        audioElement.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const newAudio = new Audio(audioUrl);
      newAudio.play().catch(console.error);
      newAudio.onended = () => setPlayingAudioId(null);
      setAudioElement(newAudio);
      setPlayingAudioId(id);
    }
  };

  if (!isOpen) return null;

  // Derive profile attributes safely
  const isKycApproved = profile?.kycStatus === "approved" || profile?.isCertified === true || profile?.isVerified === true;
  const isPremium = profile?.isPro || profile?.isVip || (profile?.balance !== undefined && profile.balance > 0);
  const displayName = profile?.artisticName || profile?.artistName || profile?.displayName || `${profile?.firstName || "Artiste"} ${profile?.lastName || ""}`.trim();
  const gomboId = profile?.gomboIdNumber || (typeof profile?.gomboId === "string" ? profile?.gomboId : profile?.gomboId?.id) || `GMB-${(targetUserId || "").substring(0, 6).toUpperCase()}`;
  const trustScore = profile?.trustScore ?? profile?.reputationScore ?? 96;
  const roleTitle = profile?.specialty || (profile?.specialties && profile?.specialties[0]) || profile?.role || "Artiste Musicien";
  const communeCity = `${profile?.commune || profile?.city || profile?.ville || "Abidjan"}, ${profile?.country || "Côte d'Ivoire"}`;
  const isRecruiter = profile?.role === "promoteur" || profile?.role === "recruteur" || publishedGombos.length > 0;

  // Media items extraction from profile mediaGallery + posts attachments
  const mediaGallery = profile?.mediaGallery || [];
  const reelsMedia = mediaGallery.filter(m => m.type === "reel" || m.type === "video" || m.url?.includes(".mp4") || m.url?.includes("video"));
  const audioMedia = mediaGallery.filter(m => m.type === "audio" || m.url?.includes(".mp3") || m.url?.includes(".wav"));
  const photoMedia = mediaGallery.filter(m => m.type === "photo" || m.type === "image" || m.url?.includes(".jpg") || m.url?.includes(".png"));

  // Add post attachments to portfolio if available
  userPosts.forEach(post => {
    if (post.mediaType === "video" && post.mediaUrl) {
      if (!reelsMedia.some(r => r.url === post.mediaUrl)) {
        reelsMedia.push({ id: post.id, title: post.caption || "Vidéo de prestation", url: post.mediaUrl, type: "video" });
      }
    } else if (post.mediaType === "audio" && post.mediaUrl) {
      if (!audioMedia.some(a => a.url === post.mediaUrl)) {
        audioMedia.push({ id: post.id, title: post.caption || "Morceau Audio", url: post.mediaUrl, type: "audio" });
      }
    } else if (post.mediaUrl) {
      if (!photoMedia.some(p => p.url === post.mediaUrl)) {
        photoMedia.push({ id: post.id, title: post.caption || "Photo Scène", url: post.mediaUrl, type: "photo" });
      }
    }
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 xs:p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-2xl bg-[#0F0F12] border border-afri-gold/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans text-afri-text"
        >
          {/* Header Bar */}
          <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#0F0F12]/90 backdrop-blur-md border-b border-afri-border/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black text-afri-gold tracking-wider uppercase">
                FICHE PUBLIQUE • CV MUSICAL
              </span>
              {isKycApproved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-black text-emerald-400 uppercase">
                  <ShieldCheck className="w-3 h-3" /> VÉRIFIÉ
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-afri-bg-sec border border-afri-border flex items-center justify-center text-afri-text-sec hover:text-white hover:bg-red-500/20 hover:border-red-500/40 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-12 h-12 rounded-full border-2 border-afri-gold border-t-transparent animate-spin mx-auto" />
                <p className="text-xs font-mono text-afri-text-sec uppercase tracking-widest">
                  Chargement de la fiche publique...
                </p>
              </div>
            ) : !profile ? (
              <div className="py-16 text-center space-y-3">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
                <p className="text-sm font-bold text-afri-text">Profil introuvable ou indisponible.</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-afri-bg-sec border border-afri-border rounded-xl text-xs font-bold uppercase cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                {/* 1. TOP CARRIER CARD */}
                <div className="relative overflow-hidden rounded-2xl border-2 border-afri-gold/40 bg-gradient-to-br from-[#16161C] via-[#0F0F12] to-[#16161C] p-4 xs:p-5 sm:p-6 shadow-xl space-y-4">
                  {/* Glowing background accent */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-afri-gold/10 blur-[60px] rounded-full pointer-events-none" />

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-full border-2 border-afri-gold p-1 bg-afri-bg shadow-lg">
                        <img
                          src={profile.avatarUrl || profile.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                          alt={displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      {isPremium && (
                        <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-500 to-afri-gold text-black rounded-full w-7 h-7 flex items-center justify-center shadow-md font-bold text-xs border border-amber-300">
                          👑
                        </div>
                      )}
                    </div>

                    {/* Main Details */}
                    <div className="flex-1 min-w-0 space-y-1.5 w-full">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h2 className="text-lg xs:text-xl sm:text-2xl font-serif font-black uppercase text-afri-text tracking-wide truncate">
                          {displayName}
                        </h2>
                        {isPremium && (
                          <span className="px-2.5 py-0.5 rounded-full bg-afri-gold/20 border border-afri-gold text-[9px] font-mono font-black text-afri-gold uppercase">
                            PREMIUM ELITE
                          </span>
                        )}
                      </div>

                      {/* Structure/Enterprise if recruiter */}
                      {profile.company && (
                        <p className="text-xs font-bold text-amber-400 flex items-center justify-center sm:justify-start gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>{profile.company}</span>
                        </p>
                      )}

                      {/* Musical Specialty & Location */}
                      <p className="text-xs font-semibold text-afri-text-muted flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className="text-afri-gold font-bold">{roleTitle}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-afri-text-sec" />
                          {communeCity}
                        </span>
                      </p>

                      {/* Gombo ID & Trust Score */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <div className="px-2.5 py-1 rounded-lg bg-afri-bg-ter border border-afri-border text-[10px] font-mono font-black text-afri-gold uppercase tracking-wider flex items-center gap-1.5">
                          <Music className="w-3 h-3" />
                          <span>{gomboId}</span>
                        </div>

                        <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-3 h-3" />
                          <span>TRUST: {trustScore}%</span>
                        </div>

                        {profile.createdAt && (
                          <div className="px-2.5 py-1 rounded-lg bg-afri-bg-ter border border-afri-border text-[10px] font-mono text-afri-text-sec uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Inscrit {new Date(profile.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio / Description */}
                  {profile.bio && (
                    <div className="pt-2 border-t border-afri-border/50">
                      <p className="text-xs text-afri-text-sec leading-relaxed italic font-sans">
                        &quot;{profile.bio}&quot;
                      </p>
                    </div>
                  )}

                  {/* ACTION BUTTONS ROW */}
                  <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 pt-2 border-t border-afri-border/50">
                    <button
                      onClick={handleToggleFollow}
                      className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isFollowing
                          ? "bg-afri-bg-sec border border-afri-border text-afri-text hover:bg-red-500/20 hover:text-red-400"
                          : "bg-gradient-to-r from-amber-500 to-afri-gold text-black hover:brightness-110 shadow-md"
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" /> Suivi
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" /> Suivre
                        </>
                      )}
                    </button>

                    {onOpenDirectMessage && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenDirectMessage(targetUserId || "", displayName);
                        }}
                        className="py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Message
                      </button>
                    )}

                    <button
                      onClick={handleShare}
                      className="py-2 px-3 bg-afri-bg-sec hover:bg-afri-bg-ter border border-afri-border text-afri-text rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-afri-gold" />
                      <span>{shareSuccess ? "Copié !" : "Partager"}</span>
                    </button>

                    <button
                      onClick={handleToggleSave}
                      className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                        isSaved
                          ? "bg-amber-500/20 border-amber-500 text-amber-400"
                          : "bg-afri-bg-sec hover:bg-afri-bg-ter border-afri-border text-afri-text-sec"
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
                      <span>{isSaved ? "Sauvé" : "Enregistrer"}</span>
                    </button>
                  </div>
                </div>

                {/* 2. REAL FIREBASE STATISTICAL CARDS */}
                <div className="grid grid-cols-2 xs:grid-cols-4 gap-2.5">
                  <div className="bg-afri-bg border border-afri-border p-3 rounded-2xl text-center space-y-0.5">
                    <span className="text-xl font-serif font-black text-afri-gold block">
                      {userPosts.length}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider block">
                      Publications
                    </span>
                  </div>

                  <div className="bg-afri-bg border border-afri-border p-3 rounded-2xl text-center space-y-0.5">
                    <span className="text-xl font-serif font-black text-afri-gold block">
                      {profile.gombosCompleted || userContracts.length}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider block">
                      Gombos Réalisés
                    </span>
                  </div>

                  <div className="bg-afri-bg border border-afri-border p-3 rounded-2xl text-center space-y-0.5">
                    <span className="text-xl font-serif font-black text-afri-gold block">
                      {profile.followersCount || profile.followers?.length || 0}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider block">
                      Abonnés
                    </span>
                  </div>

                  <div className="bg-afri-bg border border-afri-border p-3 rounded-2xl text-center space-y-0.5">
                    <span className="text-xl font-serif font-black text-afri-gold block">
                      {profile.followingCount || profile.following?.length || 0}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider block">
                      Abonnements
                    </span>
                  </div>
                </div>

                {/* 3. PORTFOLIO TABS */}
                <div className="space-y-4">
                  {/* Tab Navigation */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-afri-border/60">
                    <button
                      onClick={() => setActiveTab("reels")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "reels"
                          ? "bg-afri-gold text-black shadow-md"
                          : "bg-afri-bg-sec text-afri-text-sec hover:text-white"
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Réels & Vidéos ({reelsMedia.length})</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("audios")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "audios"
                          ? "bg-afri-gold text-black shadow-md"
                          : "bg-afri-bg-sec text-afri-text-sec hover:text-white"
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Audios ({audioMedia.length})</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("photos")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "photos"
                          ? "bg-afri-gold text-black shadow-md"
                          : "bg-afri-bg-sec text-afri-text-sec hover:text-white"
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Photos ({photoMedia.length})</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("posts")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "posts"
                          ? "bg-afri-gold text-black shadow-md"
                          : "bg-afri-bg-sec text-afri-text-sec hover:text-white"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Posts ({userPosts.length})</span>
                    </button>

                    {isRecruiter && (
                      <button
                        onClick={() => setActiveTab("gombos")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "gombos"
                            ? "bg-afri-gold text-black shadow-md"
                            : "bg-afri-bg-sec text-afri-text-sec hover:text-white"
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Gombos Publiés ({publishedGombos.length})</span>
                      </button>
                    )}
                  </div>

                  {/* TAB CONTENTS */}
                  {activeTab === "reels" && (
                    <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
                      {reelsMedia.length === 0 ? (
                        <div className="col-span-full py-10 text-center text-xs text-afri-text-sec bg-afri-bg/50 border border-afri-border rounded-2xl">
                          <Film className="w-8 h-8 text-afri-text-sec mx-auto mb-2 opacity-50" />
                          Aucun Réel ou Vidéo publié pour le moment.
                        </div>
                      ) : (
                        reelsMedia.map((m, idx) => (
                          <div
                            key={m.id || idx}
                            className="relative aspect-[9/16] rounded-2xl bg-black overflow-hidden border border-afri-border group shadow-md"
                          >
                            {m.url ? (
                              <video
                                src={m.url}
                                className="w-full h-full object-cover"
                                controls
                                preload="metadata"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-zinc-900">
                                <Film className="w-6 h-6 text-afri-gold mb-1" />
                                <span className="text-[10px] font-bold text-afri-text line-clamp-2">{m.title}</span>
                              </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none">
                              <p className="text-[10px] font-bold text-white truncate">{m.title || "Réel Scène"}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "audios" && (
                    <div className="space-y-2">
                      {audioMedia.length === 0 ? (
                        <div className="py-10 text-center text-xs text-afri-text-sec bg-afri-bg/50 border border-afri-border rounded-2xl">
                          <Volume2 className="w-8 h-8 text-afri-text-sec mx-auto mb-2 opacity-50" />
                          Aucun extrait audio disponible dans la fiche.
                        </div>
                      ) : (
                        audioMedia.map((a, idx) => (
                          <div
                            key={a.id || idx}
                            className="p-3 bg-afri-bg border border-afri-border rounded-2xl flex items-center justify-between gap-3 hover:border-afri-gold/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                onClick={() => toggleAudio(a.url, a.id || String(idx))}
                                className="w-10 h-10 rounded-full bg-afri-gold text-black flex items-center justify-center shrink-0 cursor-pointer shadow-md hover:scale-105 transition-transform"
                              >
                                {playingAudioId === (a.id || String(idx)) ? (
                                  <Pause className="w-5 h-5 fill-current" />
                                ) : (
                                  <Play className="w-5 h-5 fill-current ml-0.5" />
                                )}
                              </button>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-afri-text truncate">
                                  {a.title || "Prestation Audio"}
                                </h4>
                                <span className="text-[10px] text-afri-text-sec font-mono uppercase">
                                  AFRIGOMBO AUDIO • 320 KBPS
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "photos" && (
                    <div className="grid grid-cols-2 xs:grid-cols-3 gap-2.5">
                      {photoMedia.length === 0 ? (
                        <div className="col-span-full py-10 text-center text-xs text-afri-text-sec bg-afri-bg/50 border border-afri-border rounded-2xl">
                          <ImageIcon className="w-8 h-8 text-afri-text-sec mx-auto mb-2 opacity-50" />
                          Aucune photo de scène publiée.
                        </div>
                      ) : (
                        photoMedia.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="aspect-square rounded-2xl overflow-hidden border border-afri-border bg-zinc-900 group relative shadow-sm"
                          >
                            <img
                              src={p.url}
                              alt={p.title || "Prestation"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {p.title && (
                              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black via-black/50 to-transparent">
                                <p className="text-[9px] font-bold text-white truncate">{p.title}</p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "posts" && (
                    <div className="space-y-3">
                      {userPosts.length === 0 ? (
                        <div className="py-10 text-center text-xs text-afri-text-sec bg-afri-bg/50 border border-afri-border rounded-2xl">
                          Aucune publication disponible.
                        </div>
                      ) : (
                        userPosts.map((post) => (
                          <div
                            key={post.id}
                            className="p-4 bg-afri-bg border border-afri-border rounded-2xl space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] text-afri-gold uppercase font-bold">
                                {post.category || "PUBLICATION"}
                              </span>
                              <span className="text-[10px] text-afri-text-sec">
                                {new Date(post.createdAt).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                            <p className="text-afri-text leading-relaxed font-sans">{post.caption || post.text}</p>
                            {post.mediaUrl && (
                              <div className="rounded-xl overflow-hidden border border-afri-border max-h-48 mt-2">
                                {post.mediaType === "video" ? (
                                  <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
                                ) : (
                                  <img src={post.mediaUrl} alt="Media" className="w-full h-full object-cover" />
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "gombos" && isRecruiter && (
                    <div className="space-y-2.5">
                      {publishedGombos.length === 0 ? (
                        <div className="py-10 text-center text-xs text-afri-text-sec bg-afri-bg/50 border border-afri-border rounded-2xl">
                          Aucun Gombo publié par cette structure.
                        </div>
                      ) : (
                        publishedGombos.map((g) => (
                          <div
                            key={g.id}
                            onClick={() => onNavigateToGombo && onNavigateToGombo(g.id)}
                            className="p-3.5 bg-afri-bg border border-afri-border rounded-2xl flex items-center justify-between gap-3 hover:border-afri-gold/60 cursor-pointer transition-colors"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <h4 className="text-xs font-black text-afri-text truncate">{g.title}</h4>
                              <p className="text-[10px] font-mono text-afri-text-sec">
                                {g.location || "Abidjan"} • Status: <span className="text-emerald-400 font-bold">{g.status}</span>
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="text-xs font-black text-afri-gold block font-mono">
                                {(g.budget || 0).toLocaleString("fr-FR")} F
                              </span>
                              <ChevronRight className="w-4 h-4 text-afri-text-sec ml-auto mt-0.5" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* REPORT BUTTON */}
                <div className="pt-4 border-t border-afri-border/60 flex items-center justify-between">
                  <span className="text-[10px] text-afri-text-sec font-mono uppercase">
                    CONFIDENTIALITÉ GARANTIE • AUCUNE DONNÉE PRIVÉE EXPOSÉE
                  </span>
                  <button
                    onClick={() => setShowReportDialog(true)}
                    className="text-[10px] font-bold text-red-400/80 hover:text-red-400 flex items-center gap-1 cursor-pointer"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Signaler le profil</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* REPORT DIALOG MODAL */}
      {showReportDialog && (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#121217] border border-red-500/40 rounded-2xl p-5 space-y-4 shadow-2xl font-sans">
            <div className="flex items-center justify-between border-b border-afri-border/60 pb-3">
              <h3 className="text-sm font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Signaler ce membre
              </h3>
              <button
                onClick={() => setShowReportDialog(false)}
                className="text-afri-text-sec hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="py-6 text-center text-xs font-bold text-emerald-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p>Signalement transmis aux Administrateurs AFRIGOMBO.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-mono text-afri-text-sec uppercase mb-1">
                    Motif du signalement :
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-afri-text focus:outline-none focus:border-afri-gold"
                  >
                    <option value="Inapproprié">Contenu ou propos inappropriés</option>
                    <option value="Usurpation">Faux profil / Usurpation d&apos;identité</option>
                    <option value="Spam">Spam ou sollicitation non autorisée</option>
                    <option value="Arnaque">Comportement suspect ou tentative d&apos;escroquerie</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-afri-text-sec uppercase mb-1">
                    Détails complémentaires (optionnel) :
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Expliquez brièvement le problème..."
                    className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-afri-text focus:outline-none focus:border-afri-gold"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setShowReportDialog(false)}
                    className="flex-1 py-2.5 bg-afri-bg-sec border border-afri-border rounded-xl font-bold uppercase cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSendReport}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-wider cursor-pointer shadow-md"
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
