import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, ShieldCheck, Award, Heart, MessageSquare, Share2, Bookmark, AlertTriangle, 
  MapPin, Calendar, Music, Film, Image as ImageIcon, Volume2, Star, CheckCircle2, 
  ExternalLink, Sparkles, UserCheck, UserPlus, Clock, Flame, Briefcase, ChevronRight,
  Play, Pause, FileText, Lock, Users, User, Info, Check, Globe, Send, ThumbsUp
} from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { gomboDB } from "../firebase";
import { UserProfile, Post, Gombo, GomboSafeContract } from "../types";
import { getEffectiveGomboId } from "../lib/gomboIdHelper";
import { useAudio } from "../context/AudioContext";
import { useAuth } from "../AuthContext";
import { AndroidBottomSheet, AfriModal } from "./common/AfriModal";
import { PendingAuthIntent } from "../lib/authIntent";
import { PremiumEngine } from "../lib/premiumEngine";
import { SecurityService } from "../lib/SecurityService";
import { AdminSubscriptionTestBar } from "./admin/AdminSubscriptionTestBar";

interface PublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string | null;
  currentUser: any;
  onOpenDirectMessage?: (targetUserId: string, targetName: string) => void;
  onNavigateToGombo?: (gomboId: string) => void;
  onShowAuth?: (intent?: PendingAuthIntent) => void;
}

export function PublicProfileModal({
  isOpen,
  onClose,
  targetUserId,
  currentUser,
  onOpenDirectMessage,
  onNavigateToGombo,
  onShowAuth
}: PublicProfileModalProps) {
  const auth = useAuth();
  const activeUser = currentUser || auth?.currentUser;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"gombos" | "realisations" | "about" | "reviews" | "collaborations" | "gallery" | "reels">("gombos");
  const [, setSimTick] = useState(0);

  // Re-evaluate on simulated tier changes
  useEffect(() => {
    const handleSimChange = () => setSimTick((t) => t + 1);
    window.addEventListener("afrigombo_simulated_tier_changed", handleSimChange);
    return () => window.removeEventListener("afrigombo_simulated_tier_changed", handleSimChange);
  }, []);
  
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
  const { currentTrack, isPlaying, playTrack, pause } = useAudio();
  const [selectedMediaViewer, setSelectedMediaViewer] = useState<{ type: 'video' | 'photo' | 'audio'; url: string; title: string } | null>(null);

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
        // Check follow and saved status relative to activeUser
        if (activeUser?.uid) {
          setIsFollowing((p.followers || []).includes(activeUser.uid));
          setIsSaved((activeUser.savedTalents || []).includes(targetUserId));
        }
      }
      setLoading(false);
    });

    // 2. Listen to User Reviews in real-time
    const unsubReviews = gomboDB.listenUserReviews(targetUserId, (revs) => {
      if (revs) {
        setReviews(revs);
      }
    });

    // 3. Fetch User's Real Posts from Firestore
    if (db) {
      const postsQuery = query(
        collection(db, "posts"),
        where("userId", "==", targetUserId),
        orderBy("createdAt", "desc")
      );
      getDocs(postsQuery)
        .then((snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
          const publicList = list.filter(p => !p.isDraft && (p as any).status !== "draft" && !(p as any).isPrivate && !(p as any).deleted);
          setUserPosts(publicList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
        })
        .catch(() => {
          // Fallback if index missing or query fails
          const fallbackQuery = query(collection(db, "posts"), where("userId", "==", targetUserId));
          getDocs(fallbackQuery).then(snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
            const publicList = list.filter(p => !p.isDraft && (p as any).status !== "draft" && !(p as any).isPrivate && !(p as any).deleted);
            setUserPosts(publicList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
          }).catch(console.error);
        });

      // 4. Fetch User's Contracts / Collaborations
      const contractsQuery = query(
        collection(db, "contracts"),
        where("artistId", "==", targetUserId)
      );
      getDocs(contractsQuery)
        .then((snap) => {
          setUserContracts(snap.docs.map(d => ({ id: d.id, ...d.data() } as GomboSafeContract)));
        })
        .catch(console.error);

      // 5. Fetch Published Gombos (if recruiter/promoter)
      const gombosQuery = query(
        collection(db, "gombos"),
        where("organizerId", "==", targetUserId)
      );
      getDocs(gombosQuery)
        .then((snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Gombo));
          const publicGombos = list.filter(g => !g.isDraft && (g as any).status !== "draft" && !(g as any).deleted);
          setPublishedGombos(publicGombos);
        })
        .catch(console.error);
    }

    return () => {
      unsubProfile();
      if (typeof unsubReviews === "function") unsubReviews();
    };
  }, [isOpen, targetUserId, activeUser?.uid]);

  // Resumption of pending intent after authentication
  useEffect(() => {
    if (!activeUser?.uid || !targetUserId || !auth?.pendingIntent || !isOpen) return;
    const intent = auth.pendingIntent;
    if (intent.targetUserId !== targetUserId) return;

    if (intent.action === "direct_message") {
      auth.clearPendingIntent();
      onClose();
      if (onOpenDirectMessage) {
        const targetName = (intent.metadata?.displayName as string) || profile?.artistName || profile?.firstName || "Artiste";
        onOpenDirectMessage(targetUserId, targetName);
      }
    } else if (intent.action === "toggle_follow") {
      auth.clearPendingIntent();
      setIsFollowing(true);
      gomboDB.toggleFollowUser(targetUserId, activeUser.uid);
    } else if (intent.action === "toggle_save") {
      auth.clearPendingIntent();
      setIsSaved(true);
      gomboDB.toggleBookmarkUser(targetUserId, activeUser.uid);
    }
  }, [activeUser?.uid, targetUserId, auth?.pendingIntent, isOpen]);

  // Toggle follow action
  const handleToggleFollow = async () => {
    if (!activeUser?.uid || !targetUserId) {
      const intent: PendingAuthIntent = {
        action: "toggle_follow",
        targetUserId,
        timestamp: Date.now()
      };
      if (onShowAuth) {
        onShowAuth(intent);
      } else if (auth?.requireAuth) {
        auth.requireAuth(() => {}, intent);
      } else if (auth?.setShowAuthPopup) {
        auth.setShowAuthPopup(true);
      }
      return;
    }
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    await gomboDB.toggleFollowUser(targetUserId, activeUser.uid);
  };

  // Toggle bookmark action
  const handleToggleSave = async () => {
    if (!activeUser?.uid || !targetUserId) {
      const intent: PendingAuthIntent = {
        action: "toggle_save",
        targetUserId,
        timestamp: Date.now()
      };
      if (onShowAuth) {
        onShowAuth(intent);
      } else if (auth?.requireAuth) {
        auth.requireAuth(() => {}, intent);
      } else if (auth?.setShowAuthPopup) {
        auth.setShowAuthPopup(true);
      }
      return;
    }
    const nextState = !isSaved;
    setIsSaved(nextState);
    await gomboDB.toggleBookmarkUser(targetUserId, activeUser.uid);
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
    if (!activeUser?.uid || !targetUserId) {
      if (onShowAuth) {
        onShowAuth();
      } else if (auth?.setShowAuthPopup) {
        auth.setShowAuthPopup(true);
      } else if (auth?.requireAuth) {
        auth.requireAuth(() => {});
      }
      return;
    }
    await gomboDB.reportUser({
      targetUserId,
      reporterUserId: activeUser.uid,
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
  const toggleAudio = (audioUrl: string, id: string, title?: string) => {
    if (currentTrack?.id === id && isPlaying) {
      pause();
    } else {
      const displayArtistName = profile?.artisticName || profile?.artistName || profile?.displayName || `${profile?.firstName || "Artiste"} ${profile?.lastName || ""}`.trim();
      playTrack({
        id: id,
        url: audioUrl,
        title: title || "Extrait Audio",
        artist: displayArtistName || "Afrigombo Artiste",
        artwork: profile?.avatarUrl || profile?.photoURL || undefined
      });
    }
  };

  if (!isOpen) return null;

  // Derive profile attributes safely
  const isKycApproved = profile?.kycStatus === "approved";
  const isPremium = PremiumEngine.isPremium(profile);
  const profilePlan = PremiumEngine.getSubscriptionPlan(profile); // "free" | "pro" | "elite"
  const isElite = profilePlan === "elite";
  const isPro = profilePlan === "pro";
  const isFree = !isPro && !isElite;

  const displayName = profile?.artisticName || profile?.artistName || profile?.displayName || `${profile?.firstName || "Artiste"} ${profile?.lastName || ""}`.trim();
  const gomboId = getEffectiveGomboId(profile);
  const trustScore = profile?.trustScore ?? profile?.reputationScore ?? 96;
  const roleTitle = profile?.specialty || (profile?.specialties && profile?.specialties[0]) || profile?.role || "Artiste Musicien";
  const communeCity = `${profile?.commune || profile?.city || profile?.ville || "Abidjan"}, ${profile?.country || "Côte d'Ivoire"}`;

  // Media items extraction from profile mediaGallery + posts attachments
  const mediaGallery = profile?.mediaGallery || [];
  const reelsMedia = mediaGallery.filter(m => m.type === "reel" || m.type === "video" || m.url?.includes(".mp4") || m.url?.includes("video"));
  const photoMedia = mediaGallery.filter(m => m.type === "photo" || m.type === "image" || m.url?.includes(".jpg") || m.url?.includes(".png") || m.url?.includes("jpeg") || m.url?.includes("webp"));

  // Add post video/image attachments if available
  userPosts.forEach(post => {
    const isVideo = post.type === "video" || post.type === "reel" || post.mediaType === "video" || post.mediaUrl?.includes(".mp4") || post.mediaUrl?.includes(".webm") || post.mediaUrl?.includes(".mov");
    if (isVideo && post.mediaUrl) {
      if (!reelsMedia.some(r => r.url === post.mediaUrl)) {
        reelsMedia.push({ id: post.id, title: post.caption || (post as any).content || "Vidéo de prestation", url: post.mediaUrl, type: "video" });
      }
    } else if (post.mediaUrl && !isVideo) {
      if (!photoMedia.some(p => p.url === post.mediaUrl)) {
        photoMedia.push({ id: post.id, title: post.caption || (post as any).content || "Photo Scène", url: post.mediaUrl, type: "photo" });
      }
    }
  });

  // Synthesize Unified Gombos List for Portfolio Showcase
  const allGombos = [
    ...userContracts.map(c => ({
      id: c.id,
      title: c.gomboTitle || "Prestation Musicale Sécurisée",
      category: c.instrument || c.role || "Cachet Garanti",
      description: (c as any).description || `Prestation artistique réalisée et sécurisée via Contrat Gombo.`,
      location: (c as any).location || (c as any).commune || profile?.commune || "Abidjan",
      date: c.createdAt || (c as any).date,
      status: (c.status as string) === "completed" || (c.status as string) === "termine" || (c.status as string) === "paid" ? "Réalisé & Rémunéré" : c.status || "Validé",
      budget: c.amount || c.cachetAmount || (c as any).budget,
      imageUrl: (c as any).imageUrl || (c as any).mediaUrl || (photoMedia[0]?.url),
      videoUrl: (c as any).videoUrl,
      type: "contract"
    })),
    ...publishedGombos.map(g => ({
      id: g.id,
      title: g.title,
      category: g.category || g.musicGenre || "Gombo Scène",
      description: g.description,
      location: g.location || g.commune || "Abidjan",
      date: g.createdAt || g.eventDate,
      status: g.status === "closed" ? "Terminé" : g.status === "active" ? "En cours" : g.status || "Actif",
      budget: g.budget,
      imageUrl: (g as any).imageUrl || (g as any).mediaUrl,
      videoUrl: (g as any).videoUrl,
      type: "published"
    }))
  ];

  // Portfolio Showcase Items calculation (FREE = 3 auto, PRO = 7 manual, ELITE = 15 manual)
  const portfolioMaxLimit = isElite ? 15 : isPro ? 7 : 3;
  const manuallyFeaturedPosts = userPosts.filter(p => (p as any).featuredInPortfolio === true);

  let portfolioShowcaseItems: any[] = [];
  if (isFree) {
    // FREE: 3 most recent posts/media
    portfolioShowcaseItems = userPosts.slice(0, 3).map(p => ({
      id: p.id,
      title: p.caption || (p as any).content || "Publication Réel",
      url: p.mediaUrl || (p as any).videoUrl,
      type: (p as any).type || ((p as any).mediaUrl?.includes(".mp4") ? "video" : "photo"),
      createdAt: p.createdAt,
      likesCount: p.likesCount || (Array.isArray((p as any).likedBy) ? (p as any).likedBy.length : 0),
      commentsCount: p.commentsCount || (Array.isArray((p as any).comments) ? (p as any).comments.length : 0)
    }));
    if (portfolioShowcaseItems.length < 3) {
      const remaining = 3 - portfolioShowcaseItems.length;
      const extraMedia = mediaGallery.slice(0, remaining).map(m => ({
        id: m.id,
        title: m.title || "Média Scène",
        url: m.url,
        type: m.type || "video",
        createdAt: null,
        likesCount: 0,
        commentsCount: 0
      }));
      portfolioShowcaseItems = [...portfolioShowcaseItems, ...extraMedia];
    }
  } else {
    // PRO / ELITE: manual selection
    const manualItems = manuallyFeaturedPosts.map(p => ({
      id: p.id,
      title: p.caption || (p as any).content || "Publication Réel",
      url: p.mediaUrl || (p as any).videoUrl,
      type: (p as any).type || ((p as any).mediaUrl?.includes(".mp4") ? "video" : "photo"),
      createdAt: p.createdAt,
      likesCount: p.likesCount || (Array.isArray((p as any).likedBy) ? (p as any).likedBy.length : 0),
      commentsCount: p.commentsCount || (Array.isArray((p as any).comments) ? (p as any).comments.length : 0)
    }));

    portfolioShowcaseItems = [...manualItems];
    if (portfolioShowcaseItems.length < portfolioMaxLimit) {
      const needed = portfolioMaxLimit - portfolioShowcaseItems.length;
      const nonFeatured = userPosts
        .filter(p => !(p as any).featuredInPortfolio)
        .slice(0, needed)
        .map(p => ({
          id: p.id,
          title: p.caption || (p as any).content || "Publication Réel",
          url: p.mediaUrl || (p as any).videoUrl,
          type: (p as any).type || ((p as any).mediaUrl?.includes(".mp4") ? "video" : "photo"),
          createdAt: p.createdAt,
          likesCount: p.likesCount || (Array.isArray((p as any).likedBy) ? (p as any).likedBy.length : 0),
          commentsCount: p.commentsCount || (Array.isArray((p as any).comments) ? (p as any).comments.length : 0)
        }));
      portfolioShowcaseItems = [...portfolioShowcaseItems, ...nonFeatured];
    }
    portfolioShowcaseItems = portfolioShowcaseItems.slice(0, portfolioMaxLimit);
  }

  // Dynamic header styles depending on tier
  const headerCardStyle = isElite
    ? "relative overflow-hidden rounded-2xl border-2 border-afri-gold/80 bg-gradient-to-br from-amber-950/40 via-afri-bg-sec to-yellow-950/20 p-4 xs:p-5 sm:p-6 shadow-2xl space-y-4 ring-1 ring-afri-gold/30"
    : isPro
    ? "relative overflow-hidden rounded-2xl border-2 border-blue-500/50 bg-gradient-to-br from-blue-950/20 via-afri-bg-sec to-afri-bg p-4 xs:p-5 sm:p-6 shadow-lg space-y-4"
    : "relative overflow-hidden rounded-2xl border border-afri-border bg-afri-bg-sec p-4 xs:p-5 sm:p-6 shadow-md space-y-4";

  return (
    <AndroidBottomSheet
      isOpen={Boolean(isOpen && targetUserId)}
      onClose={onClose}
      title={showReportDialog ? "SIGNALER CE MEMBRE" : "PORTFOLIO PUBLIC • CV MUSICAL"}
    >
      {showReportDialog ? (
        <div className="space-y-4 font-sans text-afri-text py-1">
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
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-afri-text rounded-xl font-black uppercase tracking-wider cursor-pointer shadow-md"
                >
                  Envoyer
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5 font-sans text-afri-text py-1">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-2 border-afri-gold border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-mono text-afri-text-sec uppercase tracking-widest">
                Chargement du portfolio public...
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
              {/* MODE TEST ABONNEMENT (ADMIN SEULEMENT) */}
              {(SecurityService.isAdmin(activeUser) || activeUser?.email === "jhs.kmj7@gmail.com") && (
                <div className="mb-2">
                  <AdminSubscriptionTestBar currentUser={activeUser} />
                </div>
              )}

              {/* 1. EN-TÊTE / IDENTITÉ PROFESSIONNELLE ADAPTÉE PAR TIER */}
              <div className={headerCardStyle}>
                {/* Glowing Background FX per Tier */}
                {isElite && (
                  <>
                    <div className="absolute top-0 right-0 w-44 h-44 bg-afri-gold/20 blur-[70px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/15 blur-[50px] rounded-full pointer-events-none" />
                  </>
                )}
                {isPro && (
                  <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/15 blur-[60px] rounded-full pointer-events-none" />
                )}

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left relative z-10">
                  {/* Avatar Frame according to Tier */}
                  <div className="relative shrink-0">
                    <div className={`w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-afri-bg shadow-lg ${
                      isElite ? "border-2 border-afri-gold ring-2 ring-afri-gold/50" : isPro ? "border-2 border-blue-400" : "border border-afri-border"
                    }`} style={{ borderRadius: "50%", overflow: "hidden" }}>
                      <div className="w-full h-full aspect-square flex items-center justify-center" style={{ borderRadius: "50%", overflow: "hidden" }}>
                        <img
                          src={(profile.useAvatarAsProfile && profile.avatarDataUri) ? profile.avatarDataUri : (profile.avatarUrl || profile.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200")}
                          alt={displayName}
                          className="w-full h-full object-cover rounded-full aspect-square block"
                          style={{ borderRadius: "50%", overflow: "hidden", objectFit: "cover" }}
                        />
                      </div>
                    </div>
                    {isElite && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 via-afri-gold to-yellow-600 text-black rounded-full w-7 h-7 flex items-center justify-center shadow-lg font-bold text-xs border border-amber-200 animate-pulse">
                        👑
                      </div>
                    )}
                    {isPro && !isElite && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-br from-blue-400 to-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md font-bold text-[10px] border border-blue-200">
                        ⚡
                      </div>
                    )}
                  </div>

                  {/* Main Details & Tier Crown Badge */}
                  <div className="flex-1 min-w-0 space-y-1.5 w-full">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h2 className={`text-lg xs:text-xl sm:text-2xl font-serif font-black uppercase tracking-wide truncate ${
                        isElite ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-afri-gold to-yellow-100" : "text-afri-text"
                      }`}>
                        {displayName}
                      </h2>
                      {isElite && (
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 to-afri-gold/30 border border-afri-gold text-afri-gold text-[9px] font-mono font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-3 h-3 text-afri-gold" /> GOMBO ELITE
                        </span>
                      )}
                      {isPro && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400 text-blue-300 text-[9px] font-mono font-black uppercase tracking-wider flex items-center gap-1">
                          <ZapIcon className="w-3 h-3 text-blue-400" /> MEMBRE PRO
                        </span>
                      )}
                      {isFree && (
                        <span className="px-2 py-0.5 rounded-full bg-afri-bg-ter border border-afri-border text-afri-text-sec text-[9px] font-mono font-bold uppercase">
                          MEMBRE GRATUIT
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
                        <span>Gombo ID : {gomboId}</span>
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

                {/* Instruments, Genres & Experience Tags */}
                {((profile.instruments && profile.instruments.length > 0) || (profile.genres && profile.genres.length > 0) || profile.experienceYears || (profile as any).experience) && (
                  <div className="pt-2 border-t border-afri-border/50 flex flex-wrap items-center gap-1.5">
                    {profile.experienceYears && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[9px] font-mono font-black text-amber-400 uppercase">
                        ⚡ {profile.experienceYears} Ans d&apos;expérience
                      </span>
                    )}
                    {(profile as any).experience && !profile.experienceYears && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[9px] font-mono font-black text-amber-400 uppercase">
                        ⚡ Expérience : {(profile as any).experience}
                      </span>
                    )}
                    {profile.instruments?.map((inst, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-afri-bg-ter border border-afri-border text-[9px] font-mono font-bold text-afri-text uppercase">
                        🎸 {inst}
                      </span>
                    ))}
                    {profile.genres?.map((genre, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-[9px] font-mono font-bold text-purple-300 uppercase">
                        🎶 {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* ACTION BUTTONS ROW (EFFECTIVE INTERACTION HANDLERS) */}
                <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 pt-2 border-t border-afri-border/50">
                  <button
                    onClick={handleToggleFollow}
                    className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isFollowing
                        ? "bg-afri-bg-sec border border-afri-border text-afri-text hover:bg-red-500/20 hover:text-red-400"
                        : isElite
                        ? "bg-gradient-to-r from-amber-400 via-afri-gold to-yellow-500 text-black font-black shadow-lg hover:brightness-110"
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
                        if (!activeUser?.uid) {
                          const intent: PendingAuthIntent = {
                            action: "direct_message",
                            targetUserId: targetUserId || "",
                            metadata: { displayName },
                            timestamp: Date.now()
                          };
                          if (onShowAuth) {
                            onShowAuth(intent);
                          } else if (auth?.requireAuth) {
                            auth.requireAuth(() => {}, intent);
                          } else if (auth?.setShowAuthPopup) {
                            auth.setShowAuthPopup(true);
                          }
                          return;
                        }
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
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current text-amber-400" : ""}`} />
                    <span>{isSaved ? "Enregistré" : "Sauver"}</span>
                  </button>
                </div>
              </div>

              {/* 2. REAL STATISTICAL OVERVIEW CARDS */}
              <div className="grid grid-cols-2 xs:grid-cols-4 gap-2.5">
                <div className="bg-afri-bg border border-afri-border p-3 rounded-2xl text-center space-y-0.5">
                  <span className="text-xl font-serif font-black text-afri-gold block">
                    {allGombos.length || profile.gombosCompleted || userContracts.length}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider block">
                    Gombos Réalisés
                  </span>
                </div>

                <div className="bg-afri-bg border border-afri-border p-3 rounded-2xl text-center space-y-0.5">
                  <span className="text-xl font-serif font-black text-afri-gold block">
                    {reelsMedia.length}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider block">
                    Vidéos Scène
                  </span>
                </div>

                <div className="bg-afri-bg border border-afri-border p-3 rounded-2xl text-center space-y-0.5">
                  <span className="text-xl font-serif font-black text-afri-gold block">
                    {reviews.length || (profile.ratingCount ?? 0)}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-afri-text-sec uppercase tracking-wider block flex items-center justify-center gap-0.5">
                    <Star className="w-2.5 h-2.5 text-amber-400 fill-current" /> Avis Clients
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
              </div>

              {/* 3. SECTIONS RESTRUCTURED: TABS WITH INDEPENDENT SCROLL */}
              <div className="space-y-4">
                {/* Scrollable Horizontal Tab Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar border-b border-afri-border/60">
                  <button
                    onClick={() => setActiveTab("gombos")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "gombos"
                        ? "bg-afri-gold text-black shadow-md ring-2 ring-afri-gold/40"
                        : "bg-afri-bg-sec text-afri-text-sec hover:text-afri-text border border-afri-border/50"
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Gombos ({allGombos.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("realisations")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "realisations"
                        ? isElite
                          ? "bg-gradient-to-r from-amber-400 via-afri-gold to-yellow-500 text-black shadow-lg ring-2 ring-amber-400"
                          : isPro
                          ? "bg-blue-500 text-white shadow-md ring-2 ring-blue-400"
                          : "bg-afri-gold text-black shadow-md"
                        : "bg-afri-bg-sec text-afri-text-sec hover:text-afri-text border border-afri-border/50"
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Réalisations ({portfolioShowcaseItems.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("about")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "about"
                        ? "bg-afri-gold text-black shadow-md ring-2 ring-afri-gold/40"
                        : "bg-afri-bg-sec text-afri-text-sec hover:text-afri-text border border-afri-border/50"
                    }`}
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>À propos</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "reviews"
                        ? "bg-afri-gold text-black shadow-md ring-2 ring-afri-gold/40"
                        : "bg-afri-bg-sec text-afri-text-sec hover:text-afri-text border border-afri-border/50"
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Avis ({reviews.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("collaborations")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "collaborations"
                        ? "bg-afri-gold text-black shadow-md ring-2 ring-afri-gold/40"
                        : "bg-afri-bg-sec text-afri-text-sec hover:text-afri-text border border-afri-border/50"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Collaborations ({userContracts.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("gallery")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "gallery"
                        ? "bg-afri-gold text-black shadow-md ring-2 ring-afri-gold/40"
                        : "bg-afri-bg-sec text-afri-text-sec hover:text-afri-text border border-afri-border/50"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Galerie ({photoMedia.length})</span>
                  </button>

                  {activeTab === "reels" && (
                    <button
                      onClick={() => setActiveTab("reels")}
                      className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1.5 bg-afri-gold text-black shadow-md ring-2 ring-afri-gold/40"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Tous les Réels ({reelsMedia.length})</span>
                    </button>
                  )}
                </div>

                {/* TAB 1: GOMBOS RÉALISÉS */}
                {activeTab === "gombos" && (
                  <div className="space-y-3">
                    {allGombos.length === 0 ? (
                      <div className="py-12 text-center text-xs text-afri-text-sec bg-afri-bg/50 border border-afri-border rounded-2xl p-6 space-y-2">
                        <Briefcase className="w-10 h-10 text-afri-gold/50 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-afri-text">Aucun Gombo enregistré dans ce portfolio</h4>
                        <p className="text-[11px] text-afri-text-sec max-w-sm mx-auto">
                          Les prestations scéniques, contrats et gombos réalisés par l&apos;artiste apparaîtront ici.
                        </p>
                      </div>
                    ) : (
                      allGombos.map((g, idx) => (
                        <div
                          key={g.id || idx}
                          className="p-4 bg-afri-bg border border-afri-border rounded-2xl space-y-3 hover:border-afri-gold/50 transition-all shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-afri-gold/15 border border-afri-gold/40 text-[9px] font-mono font-black text-afri-gold uppercase">
                                  {g.category || "GOMBO ARTISTIQUE"}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono font-bold text-emerald-400 uppercase flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  {g.status}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-afri-text">{g.title}</h4>
                            </div>

                            {g.budget !== undefined && g.budget > 0 && (
                              <div className="shrink-0 text-right">
                                <span className="text-sm font-black text-afri-gold font-mono block">
                                  {Number(g.budget).toLocaleString("fr-FR")} F
                                </span>
                                <span className="text-[9px] font-mono text-afri-text-sec uppercase block">
                                  Cachet Réalisé
                                </span>
                              </div>
                            )}
                          </div>

                          {g.description && (
                            <p className="text-xs text-afri-text-sec font-sans leading-relaxed">
                              {g.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] font-mono text-afri-text-sec pt-1 border-t border-afri-border/40 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-afri-gold" />
                              {g.location}
                            </span>
                            {g.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-afri-text-sec" />
                                {new Date(g.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            )}
                          </div>

                          {g.imageUrl && (
                            <div className="pt-2">
                              <div
                                onClick={() => setSelectedMediaViewer({ type: "photo", url: g.imageUrl!, title: g.title })}
                                className="relative rounded-xl overflow-hidden border border-afri-border/80 bg-black/40 group cursor-pointer max-h-56 hover:border-afri-gold transition-all"
                              >
                                <img
                                  src={g.imageUrl}
                                  alt={g.title}
                                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-sm text-[10px] font-bold text-afri-gold uppercase flex items-center gap-1 border border-afri-gold/40">
                                    <ExternalLink className="w-3 h-3" /> Agrandir
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 2: RÉALISATIONS (SHOWCASE) */}
                {activeTab === "realisations" && (
                  <div className="space-y-4">
                    {/* Header Showcase Banner by Tier */}
                    {isElite ? (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border-2 border-amber-400 text-amber-200 shadow-xl space-y-2 relative overflow-hidden">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="px-3 py-1 rounded-full bg-amber-400 text-black font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                            👑 Membre ELITE Prestige
                          </span>
                          <span className="font-mono font-black text-xs text-amber-300 bg-black/40 px-2.5 py-1 rounded-xl border border-amber-400/40">
                            {portfolioShowcaseItems.length} / 15 contenus à la une
                          </span>
                        </div>
                        <h3 className="font-serif font-black text-base text-white">Réalisations Haute Prestance</h3>
                        <p className="text-xs text-amber-200/90 leading-relaxed">
                          Sélection sur mesure des 15 meilleures réalisations et prestations de l&apos;artiste.
                        </p>
                      </div>
                    ) : isPro ? (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-afri-bg-sec to-indigo-900/40 border border-blue-400/60 text-blue-200 shadow-lg space-y-2 relative overflow-hidden">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="px-3 py-1 rounded-full bg-blue-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                            ⭐ Membre PRO Certifié
                          </span>
                          <span className="font-mono font-black text-xs text-blue-300 bg-black/40 px-2.5 py-1 rounded-xl border border-blue-400/40">
                            {portfolioShowcaseItems.length} / 7 contenus mis en avant
                          </span>
                        </div>
                        <h3 className="font-black text-base text-white">Sélection Réalisations Pro</h3>
                        <p className="text-xs text-blue-200/90 leading-relaxed">
                          Sélection manuelle des 7 prestations phares choisies par l&apos;artiste.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-afri-bg-sec border border-afri-border text-afri-text-sec space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-afri-bg-ter text-afri-text font-bold text-[10px] uppercase tracking-wider">
                            Abonnement Gratuit
                          </span>
                          <span className="font-mono font-bold text-xs text-afri-gold bg-black/30 px-2 py-0.5 rounded-lg border border-afri-border">
                            {portfolioShowcaseItems.length} / 3 contenus automatiques
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-afri-text">Réalisations Aperçu Automatique</h3>
                        <p className="text-xs text-afri-text-sec leading-relaxed">
                          Affiche automatiquement les 3 publications les plus récentes. Passez en PRO (7) ou ELITE (15) pour choisir vous-même vos coups de cœur.
                        </p>
                      </div>
                    )}

                    {/* Showcase Grid */}
                    {portfolioShowcaseItems.length === 0 ? (
                      <div className="py-12 text-center text-xs text-afri-text-sec bg-afri-bg/50 border border-afri-border rounded-2xl p-6 space-y-2">
                        <Award className="w-10 h-10 text-afri-gold/50 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-afri-text">Aucun contenu mis en avant</h4>
                        <p className="text-[11px] text-afri-text-sec max-w-sm mx-auto">
                          L&apos;artiste n&apos;a pas encore sélectionné de publications pour ses Réalisations.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
                        {portfolioShowcaseItems.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            onClick={() => {
                              if (item.url) {
                                setSelectedMediaViewer({
                                  type: item.type === "photo" ? "photo" : "video",
                                  url: item.url,
                                  title: item.title || "Prestation Artistique"
                                });
                              }
                            }}
                            className={`relative rounded-2xl overflow-hidden bg-black flex flex-col justify-between group cursor-pointer transition-all shadow-md ${
                              isElite
                                ? "border-2 border-amber-400/80 shadow-amber-500/10 hover:border-amber-300 hover:shadow-xl"
                                : isPro
                                ? "border border-blue-400/60 hover:border-blue-300"
                                : "border border-afri-border/60 hover:border-afri-gold/50"
                            }`}
                          >
                            <div className="relative aspect-[9/16] max-h-56 w-full bg-zinc-900 overflow-hidden flex items-center justify-center">
                              {item.url ? (
                                item.type === "photo" ? (
                                  <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                  <video src={item.url} className="w-full h-full object-cover pointer-events-none" muted />
                                )
                              ) : (
                                <Film className="w-8 h-8 text-zinc-600" />
                              )}

                              {/* Play Overlay if video */}
                              {item.type !== "photo" && item.url && (
                                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <div className="w-9 h-9 rounded-full bg-black/70 backdrop-blur-sm text-afri-gold flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-afri-gold/40">
                                    <Play className="w-4 h-4 fill-current ml-0.5" />
                                  </div>
                                </div>
                              )}

                              {/* Badge */}
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 backdrop-blur-sm bg-black/70 text-amber-300 border border-amber-400/40">
                                <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
                                <span>À la une</span>
                              </div>

                              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none space-y-0.5">
                                <p className="text-xs font-bold text-white line-clamp-1">{item.title}</p>
                                <div className="flex items-center gap-2 text-[10px] font-mono text-white/80">
                                  <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5 text-red-400" /> {item.likesCount || 0}</span>
                                  <span className="flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5 text-amber-400" /> {item.commentsCount || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Button to view all Reels without restriction */}
                    <div className="pt-4 border-t border-afri-border/50 text-center space-y-2">
                      <button
                        onClick={() => setActiveTab("reels")}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 via-afri-gold to-yellow-500 text-black font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 mx-auto"
                      >
                        <Film className="w-4 h-4 fill-current" />
                        <span>Voir l&apos;intégralité des Réels ({reelsMedia.length})</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <p className="text-[10px] text-afri-text-sec font-mono">
                        Accédez à la collection complète des vidéos et performances publiées par l&apos;artiste.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 3: À PROPOS (FICHE ARTISTIQUE PREMIUM) */}
                {activeTab === "about" && (
                  <div className={`p-5 rounded-2xl space-y-5 transition-all ${
                    isElite
                      ? "bg-gradient-to-br from-amber-950/20 via-afri-bg-sec to-yellow-950/10 border-2 border-amber-400/80 shadow-xl ring-1 ring-amber-400/30"
                      : isPro
                      ? "bg-gradient-to-br from-blue-950/15 via-afri-bg-sec to-afri-bg border-2 border-blue-400/60 shadow-lg"
                      : "bg-afri-bg-sec border border-afri-border/80 shadow-md"
                  }`}>
                    {/* Header Badge in Fiche Artistique */}
                    <div className="flex items-center justify-between pb-3 border-b border-afri-border/50">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-afri-gold/20 text-afri-gold border border-afri-gold/40">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-serif font-black text-sm text-afri-text uppercase tracking-wider">
                            Fiche Artistique Officielle
                          </h3>
                          <span className="text-[10px] font-mono text-afri-text-sec block">
                            Profil vérifié • {roleTitle}
                          </span>
                        </div>
                      </div>
                      {isElite && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-400 text-black font-black text-[9px] uppercase tracking-wider shadow-sm">
                          👑 Artistique Elite
                        </span>
                      )}
                      {isPro && !isElite && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-500 text-white font-black text-[9px] uppercase tracking-wider shadow-sm">
                          ⭐ Certifié Pro
                        </span>
                      )}
                    </div>

                    {/* Bio / Présentation */}
                    {profile.bio ? (
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-mono font-black uppercase text-afri-gold tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-afri-gold" />
                          <span>Présentation & Démarche Artistique</span>
                        </h4>
                        <div className="p-4 bg-afri-bg/90 border border-afri-border/70 rounded-xl relative">
                          <span className="text-3xl font-serif text-afri-gold/30 absolute top-1 left-2 pointer-events-none">&ldquo;</span>
                          <p className="text-xs text-afri-text leading-relaxed font-serif italic pl-4 whitespace-pre-line relative z-10">
                            {profile.bio}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-afri-bg/40 border border-afri-border/50 rounded-xl text-xs text-afri-text-sec text-center italic">
                        Aucune biographie rédigée pour le moment.
                      </div>
                    )}

                    {/* Profil Artistique & Compétences */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-[11px] font-mono font-black uppercase text-afri-gold tracking-wider flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-afri-gold" />
                        <span>Compétences & Spécialisations</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-afri-bg/80 border border-afri-border/60 rounded-xl space-y-1">
                          <span className="text-[10px] font-mono text-afri-text-sec uppercase block">Rôle Principal</span>
                          <span className="font-bold text-afri-text flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-afri-gold fill-current" />
                            {roleTitle}
                          </span>
                        </div>

                        <div className="p-3 bg-afri-bg/80 border border-afri-border/60 rounded-xl space-y-1">
                          <span className="text-[10px] font-mono text-afri-text-sec uppercase block">Localisation Pro</span>
                          <span className="font-bold text-afri-text flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-afri-gold" />
                            {communeCity}
                          </span>
                        </div>

                        {profile.instruments && profile.instruments.length > 0 && (
                          <div className="col-span-full p-3 bg-afri-bg/80 border border-afri-border/60 rounded-xl space-y-2">
                            <span className="text-[10px] font-mono text-afri-text-sec uppercase block">Instruments Maîtrisés</span>
                            <div className="flex flex-wrap gap-1.5">
                              {profile.instruments.map((inst, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg bg-afri-bg-ter border border-afri-border text-[11px] font-bold text-afri-text shadow-sm flex items-center gap-1">
                                  🎸 {inst}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {profile.genres && profile.genres.length > 0 && (
                          <div className="col-span-full p-3 bg-afri-bg/80 border border-afri-border/60 rounded-xl space-y-2">
                            <span className="text-[10px] font-mono text-afri-text-sec uppercase block">Genres & Styles Médias</span>
                            <div className="flex flex-wrap gap-1.5">
                              {profile.genres.map((genre, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-[11px] font-bold text-purple-300 dark:text-purple-300 light:text-purple-700 shadow-sm flex items-center gap-1">
                                  🎶 {genre}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mobilité & Disponibilité */}
                    <div className="space-y-2 pt-2 border-t border-afri-border/40">
                      <h4 className="text-[11px] font-mono font-black uppercase text-afri-gold tracking-wider flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-afri-gold" />
                        <span>Disponibilité & Mobilité</span>
                      </h4>

                      <div className="p-3 bg-afri-bg/80 border border-afri-border/60 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-afri-text-sec font-mono text-[11px]">Statut Actuel :</span>
                          <span className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase flex items-center gap-1.5 ${
                            profile.availability?.status === "available" || profile.isAvailableNow
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${profile.availability?.status === "available" || profile.isAvailableNow ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                            {profile.availability?.status === "available" || profile.isAvailableNow ? "Disponible pour prestations" : "Sur engagement"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-afri-border/30">
                          <span className="text-afri-text-sec font-mono text-[11px]">Zone de Mobilité :</span>
                          <span className="font-bold text-afri-text">{profile.commune || profile.city || "Abidjan"} & Intérieur</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: VIDÉOS & SCÈNES */}
                {activeTab === "reels" && (
                  <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                    {reelsMedia.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-xs text-afri-text-sec bg-afri-bg/50 border border-afri-border rounded-2xl p-6 space-y-2">
                        <Film className="w-10 h-10 text-afri-gold/50 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-afri-text">Aucune vidéo disponible</h4>
                        <p className="text-[11px] text-afri-text-sec max-w-sm mx-auto">
                          Les vidéos de scène, solos et réels ajoutés au portfolio apparaîtront ici.
                        </p>
                      </div>
                    ) : (
                      reelsMedia.map((m, idx) => (
                        <div
                          key={m.id || idx}
                          onClick={() => setSelectedMediaViewer({ type: "video", url: m.url, title: m.title || "Réel Scène" })}
                          className="relative aspect-[9/16] rounded-xl bg-afri-bg overflow-hidden border border-afri-border group shadow-sm cursor-pointer hover:border-afri-gold/50 transition-all"
                        >
                          {m.url ? (
                            <video
                              src={m.url}
                              className="w-full h-full object-cover pointer-events-none"
                              preload="metadata"
                              muted
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-afri-bg-sec">
                              <Film className="w-5 h-5 text-afri-gold mb-1" />
                              <span className="text-[9px] font-bold text-afri-text line-clamp-2">{m.title}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/25 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm text-afri-gold flex items-center justify-center shadow-md group-hover:scale-110 transition-transform border border-afri-gold/30">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none">
                            <p className="text-[9px] font-bold text-afri-text truncate">{m.title || "Réel Scène"}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 4: AVIS & NOTES */}
                {activeTab === "reviews" && (
                  <div className="space-y-3">
                    {reviews.length === 0 ? (
                      <div className="py-12 text-center text-xs text-afri-text-sec bg-afri-bg/50 border border-afri-border rounded-2xl p-6 space-y-2">
                        <Star className="w-10 h-10 text-amber-400/50 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-afri-text">Aucun avis encore enregistré</h4>
                        <p className="text-[11px] text-afri-text-sec max-w-sm mx-auto">
                          Les avis certifiés laissés par les organisateurs et recuteurs après chaque Gombo sécurisé s&apos;afficheront ici.
                        </p>
                      </div>
                    ) : (
                      reviews.map((rev, idx) => (
                        <div key={rev.id || idx} className="p-4 bg-afri-bg border border-afri-border rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-afri-text">{rev.reviewerName || "Organisateur Certifié"}</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < (rev.rating || 5) ? "text-amber-400 fill-current" : "text-zinc-600"}`}
                                />
                              ))}
                            </div>
                          </div>
                          {rev.comment && (
                            <p className="text-xs text-afri-text-sec italic">&quot;{rev.comment}&quot;</p>
                          )}
                          <div className="text-[9px] font-mono text-afri-text-sec border-t border-afri-border/40 pt-1">
                            {rev.timestamp ? new Date(rev.timestamp).toLocaleDateString("fr-FR") : "Gombo Sécurisé"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 5: COLLABORATIONS */}
                {activeTab === "collaborations" && (
                  <div className="space-y-3">
                    {userContracts.length === 0 ? (
                      <div className="py-12 text-center text-xs text-afri-text-sec bg-afri-bg/50 border border-afri-border rounded-2xl p-6 space-y-2">
                        <Users className="w-10 h-10 text-afri-gold/50 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-afri-text">Aucune collaboration contractuelle répertoriée</h4>
                        <p className="text-[11px] text-afri-text-sec max-w-sm mx-auto">
                          Les collaborations avec d&apos;autres artistes ou organisateurs via Contrat Gombo apparaîtront ici.
                        </p>
                      </div>
                    ) : (
                      userContracts.map((c, idx) => (
                        <div key={c.id || idx} className="p-4 bg-afri-bg border border-afri-border rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-afri-gold uppercase">{c.gomboTitle || "Collaboration Scène"}</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono text-emerald-400 uppercase">
                              Contrat Validé
                            </span>
                          </div>
                          <p className="text-xs text-afri-text-sec">
                            Organisateur / Recruteur : <strong className="text-afri-text">{c.organizerName || "Partenaire Gombo"}</strong>
                          </p>
                          <div className="flex items-center justify-between text-[10px] font-mono text-afri-text-sec border-t border-afri-border/40 pt-1">
                            <span>Lieu: {c.location || "Abidjan"}</span>
                            {c.amount && <span>Cachet: {Number(c.amount).toLocaleString("fr-FR")} F</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 6: GALERIE PHOTO */}
                {activeTab === "gallery" && (
                  <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                    {photoMedia.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-xs text-afri-text-sec bg-afri-bg/50 border border-afri-border rounded-2xl p-6 space-y-2">
                        <ImageIcon className="w-10 h-10 text-afri-gold/50 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-afri-text">Aucune photo dans la galerie</h4>
                        <p className="text-[11px] text-afri-text-sec max-w-sm mx-auto">
                          Les photos d&apos;illustration de scène et de shooting d&apos;artiste apparaîtront ici.
                        </p>
                      </div>
                    ) : (
                      photoMedia.map((m, idx) => (
                        <div
                          key={m.id || idx}
                          onClick={() => setSelectedMediaViewer({ type: "photo", url: m.url, title: m.title || "Photo Scène" })}
                          className="relative aspect-square rounded-xl bg-afri-bg overflow-hidden border border-afri-border group shadow-sm cursor-pointer hover:border-afri-gold/50 transition-all"
                        >
                          <img
                            src={m.url}
                            alt={m.title || "Photo"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-2.5 py-1 rounded-lg bg-black/75 text-[10px] font-bold text-afri-gold uppercase border border-afri-gold/40">
                              Voir
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* FOOTER CONFIDENTIALITY & REPORT BUTTON */}
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
      )}

      {/* DEDICATED AFRIGOMBO MEDIA VIEWER MODAL */}
      {selectedMediaViewer && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-afri-bg border border-afri-border rounded-2xl p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-afri-gold truncate">{selectedMediaViewer.title}</h3>
              <button
                onClick={() => setSelectedMediaViewer(null)}
                className="w-8 h-8 rounded-full bg-afri-bg-sec text-afri-text flex items-center justify-center cursor-pointer hover:bg-afri-bg-ter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[60vh]">
              {selectedMediaViewer.type === "video" ? (
                <video
                  src={selectedMediaViewer.url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full max-h-[60vh] object-contain"
                />
              ) : (
                <img
                  src={selectedMediaViewer.url}
                  alt={selectedMediaViewer.title}
                  className="w-full max-h-[60vh] object-contain"
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = selectedMediaViewer.url;
                  a.download = `${selectedMediaViewer.title || 'media'}_afrigombo`;
                  a.target = '_blank';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="flex-1 py-2.5 bg-afri-bg-sec hover:bg-afri-bg-ter border border-afri-border rounded-xl text-xs font-bold uppercase tracking-wider text-afri-text flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Télécharger</span>
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: selectedMediaViewer.title,
                      url: selectedMediaViewer.url
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(selectedMediaViewer.url);
                    alert("Lien du média copié dans le presse-papier !");
                  }
                }}
                className="flex-1 py-2.5 bg-afri-gold text-black hover:opacity-90 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Partager</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AndroidBottomSheet>
  );
}

function ZapIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
