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
  const [activeTab, setActiveTab] = useState<"gombos" | "reels">("gombos");
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

    // 2. Fetch User's Real Posts from Firestore
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
        .catch((err) => {
          // Fallback if index missing or query fails
          const fallbackQuery = query(collection(db, "posts"), where("userId", "==", targetUserId));
          getDocs(fallbackQuery).then(snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
            const publicList = list.filter(p => !p.isDraft && (p as any).status !== "draft" && !(p as any).isPrivate && !(p as any).deleted);
            setUserPosts(publicList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
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
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Gombo));
          const publicGombos = list.filter(g => !g.isDraft && (g as any).status !== "draft" && !(g as any).deleted);
          setPublishedGombos(publicGombos);
        })
        .catch(console.error);
    }

    return () => {
      unsubProfile();
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
  }, [activeUser?.uid, targetUserId, auth?.pendingIntent, isOpen, profile, onClose, onOpenDirectMessage, auth]);

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
  const profilePlan = PremiumEngine.getSubscriptionPlan(profile);
  const displayName = profile?.artisticName || profile?.artistName || profile?.displayName || `${profile?.firstName || "Artiste"} ${profile?.lastName || ""}`.trim();
  const gomboId = getEffectiveGomboId(profile);
  const trustScore = profile?.trustScore ?? profile?.reputationScore ?? 96;
  const roleTitle = profile?.specialty || (profile?.specialties && profile?.specialties[0]) || profile?.role || "Artiste Musicien";
  const communeCity = `${profile?.commune || profile?.city || profile?.ville || "Abidjan"}, ${profile?.country || "Côte d'Ivoire"}`;
  const isRecruiter = profile?.role === "promoteur" || profile?.role === "recruteur" || publishedGombos.length > 0;

  // Media items extraction from profile mediaGallery + posts attachments
  const mediaGallery = profile?.mediaGallery || [];
  const reelsMedia = mediaGallery.filter(m => m.type === "reel" || m.type === "video" || m.url?.includes(".mp4") || m.url?.includes("video"));
  const photoMedia = mediaGallery.filter(m => m.type === "photo" || m.type === "image" || m.url?.includes(".jpg") || m.url?.includes(".png"));

  // Add post video attachments to reelsMedia if available
  userPosts.forEach(post => {
    const isVideo = post.type === "video" || post.type === "reel" || post.mediaType === "video" || post.mediaUrl?.includes(".mp4") || post.mediaUrl?.includes(".webm") || post.mediaUrl?.includes(".mov");
    if (isVideo && post.mediaUrl) {
      if (!reelsMedia.some(r => r.url === post.mediaUrl)) {
        reelsMedia.push({ id: post.id, title: post.caption || (post as any).content || "Vidéo de prestation", url: post.mediaUrl, type: "video" });
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

  return (
    <AndroidBottomSheet
      isOpen={Boolean(isOpen && targetUserId)}
      onClose={onClose}
      title={showReportDialog ? "SIGNALER CE MEMBRE" : "FICHE PUBLIQUE • CV MUSICAL"}
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
        <div className="space-y-6 font-sans text-afri-text py-1">
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
                {/* MODE TEST ABONNEMENT (ADMIN SEULEMENT) */}
                {(SecurityService.isAdmin(activeUser) || activeUser?.email === "jhs.kmj7@gmail.com") && (
                  <div className="mb-3">
                    <AdminSubscriptionTestBar currentUser={activeUser} />
                  </div>
                )}

                {/* 1. TOP CARRIER CARD */}
                <div className="relative overflow-hidden rounded-2xl border-2 border-afri-gold/40 bg-gradient-to-br from-afri-bg-sec via-afri-bg to-afri-bg-sec p-4 xs:p-5 sm:p-6 shadow-xl space-y-4">
                  {/* Glowing background accent */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-afri-gold/10 blur-[60px] rounded-full pointer-events-none" />

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-full border-2 border-afri-gold p-1 bg-afri-bg shadow-lg" style={{ borderRadius: "50%", overflow: "hidden" }}>
                        <div className="w-full h-full aspect-square flex items-center justify-center" style={{ borderRadius: "50%", overflow: "hidden" }}>
                          <img
                            src={(profile.useAvatarAsProfile && profile.avatarDataUri) ? profile.avatarDataUri : (profile.avatarUrl || profile.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200")}
                            alt={displayName}
                            className="w-full h-full object-cover rounded-full aspect-square block"
                            style={{ borderRadius: "50%", overflow: "hidden", objectFit: "cover" }}
                          />
                        </div>
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
                          <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-mono font-black uppercase ${
                            profilePlan === "elite"
                              ? "bg-afri-gold/20 border-afri-gold text-afri-gold"
                              : "bg-blue-500/20 border-blue-400 text-blue-300"
                          }`}>
                            {profilePlan === "elite" ? "PREMIUM ELITE" : "MEMBRE PRO"}
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
                      <span>{shareSuccess ? "Copié !" : "Transmettre"}</span>
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

                {/* 3. PORTFOLIO TABS (GOMBOS & RÉELS/VIDÉOS UNIQUEMENT) */}
                <div className="space-y-4">
                  {/* Tab Navigation */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-afri-border/60">
                    <button
                      onClick={() => setActiveTab("gombos")}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === "gombos"
                          ? "bg-afri-gold text-black shadow-md"
                          : "bg-afri-bg-sec text-afri-text-sec hover:text-afri-text border border-afri-border/50"
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Gombos ({allGombos.length})</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("reels")}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                        activeTab === "reels"
                          ? "bg-afri-gold text-black shadow-md"
                          : "bg-afri-bg-sec text-afri-text-sec hover:text-afri-text border border-afri-border/50"
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Réels & Vidéos ({reelsMedia.length})</span>
                    </button>
                  </div>

                  {/* TAB 1: GOMBOS RÉALISÉS & PUBLIÉS */}
                  {activeTab === "gombos" && (
                    <div className="space-y-3">
                      {allGombos.length === 0 ? (
                        <div className="py-12 text-center text-xs text-afri-text-sec bg-afri-bg/50 border border-afri-border rounded-2xl p-6 space-y-2">
                          <Briefcase className="w-10 h-10 text-afri-gold/50 mx-auto mb-2" />
                          <h4 className="text-sm font-bold text-afri-text">Aucun Gombo enregistré dans ce portfolio</h4>
                          <p className="text-[11px] text-afri-text-sec max-w-sm mx-auto">
                            Les prestations scéniques, contrats et gombos réalisés par l&apos;artiste apparaîtront ici avec leurs illustrations photo et vidéo.
                          </p>
                        </div>
                      ) : (
                        allGombos.map((g, idx) => (
                          <div
                            key={g.id || idx}
                            className="p-4 bg-afri-bg border border-afri-border rounded-2xl space-y-3 hover:border-afri-gold/50 transition-all shadow-sm"
                          >
                            {/* Header row: Type/Catégorie, Titre, Budget */}
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

                            {/* Description */}
                            {g.description && (
                              <p className="text-xs text-afri-text-sec font-sans leading-relaxed">
                                {g.description}
                              </p>
                            )}

                            {/* Informations pertinentes : Lieu, Date */}
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

                            {/* Image d'illustration réellement associée au Gombo */}
                            {g.imageUrl && (
                              <div className="pt-2">
                                <span className="text-[10px] font-mono font-bold uppercase text-afri-text-sec block mb-1.5 flex items-center gap-1">
                                  <ImageIcon className="w-3 h-3 text-afri-gold" />
                                  Illustration de la prestation
                                </span>
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

                            {/* Vidéo réellement associée lorsqu'elle existe */}
                            {g.videoUrl && (
                              <div className="pt-2">
                                <span className="text-[10px] font-mono font-bold uppercase text-afri-text-sec block mb-1.5 flex items-center gap-1">
                                  <Film className="w-3 h-3 text-afri-gold" />
                                  Vidéo de la prestation
                                </span>
                                <div
                                  onClick={() => setSelectedMediaViewer({ type: "video", url: g.videoUrl!, title: g.title })}
                                  className="relative rounded-xl overflow-hidden border border-afri-border/80 bg-black group cursor-pointer h-48 hover:border-afri-gold transition-all flex items-center justify-center"
                                >
                                  <video
                                    src={g.videoUrl}
                                    className="w-full h-full object-cover pointer-events-none opacity-80"
                                    preload="metadata"
                                    muted
                                  />
                                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-afri-gold text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                      <Play className="w-6 h-6 fill-current ml-0.5" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 2: RÉELS & VIDÉOS (Miniatures compactes, visionneuse AFRIGOMBO) */}
                  {activeTab === "reels" && (
                    <div className="grid grid-cols-3 gap-2">
                      {reelsMedia.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-xs text-afri-text-sec bg-afri-bg/50 border border-afri-border rounded-2xl p-6 space-y-2">
                          <Film className="w-10 h-10 text-afri-gold/50 mx-auto mb-2" />
                          <h4 className="text-sm font-bold text-afri-text">Aucun Réel ou Vidéo publié</h4>
                          <p className="text-[11px] text-afri-text-sec max-w-sm mx-auto">
                            Les vidéos de scène, solos et performances ajoutés au portfolio apparaîtront ici.
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
