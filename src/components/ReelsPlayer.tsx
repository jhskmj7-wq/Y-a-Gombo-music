import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, Heart, MessageCircle, Share2, Bookmark, MoreVertical, 
  Plus, Music, MapPin, Volume2, VolumeX, Sparkles, Flag, X, Check,
  Send, UserCheck, UserPlus, ChevronDown, ChevronUp
} from "lucide-react";
import { Post } from "../types";
import { db } from "../lib/firebase";
import { 
  doc, updateDoc, arrayUnion, arrayRemove, increment, 
  collection, addDoc, setDoc, deleteDoc, onSnapshot, query, orderBy 
} from "firebase/firestore";
import { gomboDB } from "../firebase";
import { useAppSettings } from "../context/AppSettingsContext";
import { useAuth } from "../AuthContext";
import { openPublicProfile } from "../lib/publicProfile";

export interface ReelItem {
  id: string;
  title?: string;
  authorName: string;
  authorArtisticName?: string;
  authorAvatar?: string;
  commune?: string;
  content: string;
  mediaUrl: string;
  musicTrack?: string;
  hashtags?: string[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  userId?: string;
}

interface ReelsPlayerProps {
  posts?: Post[];
  users?: any[];
  onClose: () => void;
  onOpenCreate?: () => void;
  currentUser?: any;
  initialReelId?: string;
}

// Curated high-performance African video clips for demonstration and instant fallback
const FALLBACK_REELS: ReelItem[] = [
  {
    id: "reel-demo-1",
    title: "Solo Saxophone Prestigieux Live",
    authorName: "Thierry Sax",
    authorArtisticName: "Thierry Sax d'Abidjan",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    commune: "Cocody, Abidjan",
    content: "Test de sonorité en coulisse avant le grand live du Trône à Cocody. Vibration souveraine ! 🎷✨",
    mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-guitarist-playing-acoustic-guitar-34232-large.mp4",
    musicTrack: "Improvisation Saxophone Live — Thierry Sax",
    hashtags: ["#Afrigombo", "#Saxophone", "#LiveAbidjan", "#TroneMusique"],
    likesCount: 342,
    commentsCount: 58,
    userId: "u_thierry_sax"
  },
  {
    id: "reel-demo-2",
    title: "Fusion Zaouli & Batterie Modern Jazz",
    authorName: "Sékou Drummer",
    authorArtisticName: "Sékou Drummer & Trio",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    commune: "Marcory, Abidjan",
    content: "Enregistrement direct de notre session de répétition à Marcory pour le Gombo de l'ambassade. 🔥🥁",
    mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-playing-drums-closeup-34301-large.mp4",
    musicTrack: "Rythmes Zaouli Fusion — Sékou Drummer",
    hashtags: ["#Afrigombo", "#Batterie", "#MarcoryVibes", "#ArtisteIvoirien"],
    likesCount: 512,
    commentsCount: 94,
    userId: "u_sekou_drums"
  },
  {
    id: "reel-demo-3",
    title: "Bassline Groovy Abidjan",
    authorName: "Paco Bass",
    authorArtisticName: "Paco Bass Virtuose",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    commune: "Yopougon, Abidjan",
    content: "Groove imparable pour le concert de ce week-end à Yopougon Niangon. Qui est chaud ? 🎸💥",
    mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-dancing-woman-in-a-field-of-yellow-flowers-42767-large.mp4",
    musicTrack: "Groove Yopougon Night — Paco Bass",
    hashtags: ["#Afrigombo", "#BasseSolo", "#Yopougon", "#GomboIvoirien"],
    likesCount: 289,
    commentsCount: 41,
    userId: "u_paco_bass"
  }
];

export function ReelsPlayer({ posts = [], users = [], onClose, onOpenCreate, currentUser, initialReelId }: ReelsPlayerProps) {
  const { network } = useAppSettings();
  const { requireAuth } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [showCommentsFor, setShowCommentsFor] = useState<ReelItem | null>(null);
  const [showMoreFor, setShowMoreFor] = useState<ReelItem | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [commentsList, setCommentsList] = useState<{ id: string; author: string; avatar: string; text: string; time: string }[]>([
    { id: "c1", author: "Kassi Kouadio", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100", text: "Respect l'artiste ! Quel groove magnifique 🔥", time: "2 min" },
    { id: "c2", author: "Awa Voix d'Or", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100", text: "On a besoin de ce niveau de sonorité dans les gombos de Cocody !", time: "10 min" }
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize followed users from currentUser following array
  useEffect(() => {
    if (currentUser?.following && Array.isArray(currentUser.following)) {
      setFollowedUsers(currentUser.following);
    }
  }, [currentUser]);

  // Build unified list of reels from props + fallback
  const reelsList = React.useMemo(() => {
    const fromPosts: ReelItem[] = posts
      .filter(p => p.mediaUrl && (p.mediaUrl.includes(".mp4") || p.mediaUrl.includes(".webm") || p.mediaUrl.includes(".mov") || p.mediaUrl.includes("video") || (p as any).type === "video"))
      .map(p => {
        const likedBy = (p as any).likedBy || [];
        const isLiked = currentUser?.uid ? (likedBy.includes(currentUser.uid) || p.isLiked) : (p.isLiked || false);
        return {
          id: p.id || `post_${Math.random()}`,
          title: p.title || "Vibration Artistique",
          authorName: p.authorName || "Artiste Gombo",
          authorArtisticName: p.authorArtisticName || p.authorName || "Artiste Gombo",
          authorAvatar: p.authorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          commune: (p as any).commune || (p as any).location || "Abidjan",
          content: p.content || "Publication vidéo sur le Fil Réel d'AFRIGOMBO ELITE.",
          mediaUrl: p.mediaUrl!,
          musicTrack: p.title || "Son original AFRIGOMBO ELITE",
          hashtags: (p as any).hashtags || ["#Afrigombo", "#MusiqueIvoirienne", "#TalentsDuTrone"],
          likesCount: p.likes || 0,
          commentsCount: p.comments || 0,
          isLiked: Boolean(isLiked),
          userId: p.userId
        };
      });

    const fromUsers: ReelItem[] = users.flatMap(u => 
      (u.mediaGallery || [])
        .filter((m: any) => m.type === "video" && m.url)
        .map((m: any) => ({
          id: m.id || `user_media_${Math.random()}`,
          title: m.title || "Démo Artiste",
          authorName: u.name || "Artiste Accrédité",
          authorArtisticName: u.artisticName || u.name || "Artiste Accrédité",
          authorAvatar: u.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          commune: u.commune || u.city || "Abidjan",
          content: m.description || `Extrait musical et démonstration officielle de ${u.artisticName || u.name}.`,
          mediaUrl: m.url,
          musicTrack: m.title || `Démo Live — ${u.artisticName || u.name}`,
          hashtags: ["#Afrigombo", "#Accredite", "#DirectDuStudio"],
          likesCount: 88,
          commentsCount: 14,
          userId: u.id || u.uid
        }))
    );

    const merged = [...fromPosts, ...fromUsers];
    if (merged.length > 0) return merged;
    return FALLBACK_REELS;
  }, [posts, users, currentUser?.uid]);

  const [localReels, setLocalReels] = useState<ReelItem[]>(reelsList);

  useEffect(() => {
    setLocalReels(reelsList);
  }, [reelsList]);

  // Jump to initial reel if provided
  useEffect(() => {
    if (initialReelId) {
      const idx = localReels.findIndex(r => r.id === initialReelId);
      if (idx !== -1) {
        setCurrentIndex(idx);
        if (containerRef.current) {
          containerRef.current.scrollTop = idx * containerRef.current.clientHeight;
        }
      }
    }
  }, [initialReelId, localReels]);

  // Handle Scroll to update current index
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const height = container.clientHeight;
    if (height > 0) {
      const index = Math.round(container.scrollTop / height);
      if (index !== currentIndex && index >= 0 && index < localReels.length) {
        setCurrentIndex(index);
      }
    }
  };

  // Play active video & pause others when index changes
  useEffect(() => {
    if (activeVideoRef.current) {
      activeVideoRef.current.currentTime = 0;
      activeVideoRef.current.play().catch(() => {});
    }
  }, [currentIndex, isMuted]);

  // COMPLETE UNMOUNT CLEANUP
  useEffect(() => {
    return () => {
      if (activeVideoRef.current) {
        activeVideoRef.current.pause();
        activeVideoRef.current.src = "";
        activeVideoRef.current.load();
      }
    };
  }, []);

  // Listen to Firestore comments in real time when drawer opens
  useEffect(() => {
    if (!showCommentsFor || !db) return;
    const reelId = showCommentsFor.id;

    // Listen to subcollection /posts/{reelId}/comments
    try {
      const commentsColRef = collection(db, "posts", reelId, "comments");
      const unsub = onSnapshot(commentsColRef, (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              author: data.author || data.authorName || data.userName || "Mélomane",
              avatar: data.avatar || data.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
              text: data.text || data.content || "",
              time: data.createdAt ? new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Récemment"
            };
          });
          setCommentsList(list);
        }
      }, (err) => {
        console.warn("Could not listen to real-time comments subcollection:", err);
      });

      return () => unsub();
    } catch (err) {
      console.warn("Exception setting up comments listener:", err);
    }
  }, [showCommentsFor]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Toggle Description Expand/Collapse
  const toggleExpand = (reelId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [reelId]: !prev[reelId]
    }));
  };

  // Like / Honor action with Firestore Persistence
  const handleLike = (reelId: string) => {
    requireAuth(async () => {
      let nextIsLiked = false;
      setLocalReels(prev => prev.map(r => {
        if (r.id === reelId) {
          nextIsLiked = !r.isLiked;
          return {
            ...r,
            isLiked: nextIsLiked,
            likesCount: Math.max(0, r.likesCount + (nextIsLiked ? 1 : -1))
          };
        }
        return r;
      }));

      try {
        if (navigator.vibrate) navigator.vibrate(40);
      } catch (_) {}

      // Persist in Firestore
      if (db && currentUser?.uid) {
        const updatePayload = {
          likesCount: increment(nextIsLiked ? 1 : -1),
          likes: increment(nextIsLiked ? 1 : -1),
          likedBy: nextIsLiked ? arrayUnion(currentUser.uid) : arrayRemove(currentUser.uid)
        };

        try {
          await updateDoc(doc(db, "posts", reelId), updatePayload);
        } catch (err1) {
          try {
            await updateDoc(doc(db, "social_posts", reelId), updatePayload);
          } catch (err2) {
            console.warn("Could not update like on post / social_posts:", err2);
          }
        }
      }
    });
  };

  // Bookmark action
  const handleBookmark = (reelId: string) => {
    requireAuth(async () => {
      let nextState = false;
      setLocalReels(prev => prev.map(r => {
        if (r.id === reelId) {
          nextState = !r.isBookmarked;
          showToast(nextState ? "⭐ Réel ajouté à vos favoris" : "Retiré de vos favoris");
          return { ...r, isBookmarked: nextState };
        }
        return r;
      }));

      // Persist in Firestore
      if (db && currentUser?.uid) {
        const bookmarkPayload = {
          bookmarkedBy: nextState ? arrayUnion(currentUser.uid) : arrayRemove(currentUser.uid)
        };
        try {
          await updateDoc(doc(db, "posts", reelId), bookmarkPayload);
        } catch (_) {
          try {
            await updateDoc(doc(db, "social_posts", reelId), bookmarkPayload);
          } catch (_) {}
        }
      }
    });
  };

  // Follow action with Firestore Persistence (abonnements + user profile)
  const handleToggleFollow = (targetUserId?: string) => {
    if (!targetUserId) return;
    requireAuth(async () => {
      const isCurrentlyFollowing = followedUsers.includes(targetUserId);
      const nextFollowingState = !isCurrentlyFollowing;

      // Update local state immediately
      setFollowedUsers(prev => {
        if (isCurrentlyFollowing) {
          showToast("Abonnement retiré");
          return prev.filter(u => u !== targetUserId);
        } else {
          showToast("👑 Vous suivez désormais cet artiste !");
          return [...prev, targetUserId];
        }
      });

      // Persist in Firestore
      if (db && currentUser?.uid) {
        const subDocId = `${currentUser.uid}_${targetUserId}`;
        try {
          if (nextFollowingState) {
            await setDoc(doc(db, "abonnements", subDocId), {
              subscriberId: currentUser.uid,
              subscriberName: currentUser.name || currentUser.artisticName || "Abonné",
              targetUserId: targetUserId,
              createdAt: new Date().toISOString()
            });
          } else {
            await deleteDoc(doc(db, "abonnements", subDocId));
          }
        } catch (err) {
          console.warn("Could not sync abonnements collection:", err);
        }

        // Also update users collection via gomboDB
        try {
          await gomboDB.toggleFollowUser(targetUserId, currentUser.uid);
        } catch (err) {
          console.warn("Could not sync follow on user document:", err);
        }
      }
    });
  };

  // Share action
  const handleShare = async (reel: ReelItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: reel.title || "Fil Réel AFRIGOMBO ELITE",
          text: `${reel.authorArtisticName}: ${reel.content}`,
          url: window.location.href
        });
      } catch (_) {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast("🔗 Lien du Réel copié dans le presse-papier !");
      } catch (_) {
        showToast("Lien partagé avec succès !");
      }
    }
  };

  // Submit comment with Firestore Persistence
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !showCommentsFor) return;
    requireAuth(async () => {
      const text = commentInput.trim();
      const reelId = showCommentsFor.id;

      const newComment = {
        id: `c_${Date.now()}`,
        postId: reelId,
        userId: currentUser?.uid || "anon",
        author: currentUser?.artisticName || currentUser?.name || "Moi (Souverain)",
        avatar: currentUser?.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
        text: text,
        createdAt: new Date().toISOString(),
        time: "À l'instant"
      };

      // Update local state instantly
      setCommentsList(prev => [newComment, ...prev]);
      setLocalReels(prev => prev.map(r => r.id === reelId ? { ...r, commentsCount: r.commentsCount + 1 } : r));
      setCommentInput("");
      showToast("💬 Palabre publié !");

      // Persist in Firestore subcollection posts/{reelId}/comments
      if (db) {
        try {
          await addDoc(collection(db, "posts", reelId, "comments"), newComment);
          await updateDoc(doc(db, "posts", reelId), {
            commentsCount: increment(1),
            comments: arrayUnion(newComment)
          });
        } catch (err1) {
          try {
            await addDoc(collection(db, "social_posts", reelId, "comments"), newComment);
            await updateDoc(doc(db, "social_posts", reelId), {
              commentsCount: increment(1),
              comments: arrayUnion(newComment)
            });
          } catch (err2) {
            console.warn("Could not save comment in subcollection:", err2);
          }
        }
      }
    });
  };

  // Functional Report Handler (Writes to Firestore "reports" collection)
  const handleReportReel = async (reel: ReelItem) => {
    requireAuth(async () => {
      try {
        if (db) {
          const reportPayload = {
            postId: reel.id,
            postTitle: reel.title || reel.content?.substring(0, 50) || "Réel",
            targetUserId: reel.userId || null,
            targetAuthorName: reel.authorArtisticName || reel.authorName || "Artiste",
            reporterId: currentUser?.uid || "anonyme",
            reporterName: currentUser?.name || currentUser?.artisticName || "Utilisateur",
            reason: "Signalé pour contenu inapproprié ou violation des règles communautaires",
            category: "Signalement Réel",
            status: "pending",
            createdAt: new Date().toISOString()
          };

          await addDoc(collection(db, "reports"), reportPayload);

          // Update post doc with flag
          try {
            await updateDoc(doc(db, "posts", reel.id), {
              isFlagged: true,
              reportsCount: increment(1),
              flagReason: "Signalé par la communauté"
            });
          } catch (_) {
            try {
              await updateDoc(doc(db, "social_posts", reel.id), {
                isFlagged: true,
                reportsCount: increment(1),
                flagReason: "Signalé par la communauté"
              });
            } catch (_) {}
          }
        }
        showToast("🚩 Publication signalée aux modérateurs avec succès.");
      } catch (err) {
        console.error("Error creating report:", err);
        showToast("🚩 Signalement enregistré.");
      } finally {
        setShowMoreFor(null);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-afri-bg text-afri-text font-sans overflow-hidden flex flex-col h-[100dvh] w-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[120] bg-[#D4AF37] text-black font-mono font-black text-xs px-4 py-2 rounded-full shadow-2xl animate-bounce border border-black/20">
          {toastMessage}
        </div>
      )}

      {/* TOP FLOATING NAVIGATION BAR */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-4 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent">
        <button 
          onClick={onClose}
          className="p-2.5 rounded-full bg-afri-bg/50 backdrop-blur-md border border-afri-border text-afri-text hover:bg-white/20 active:scale-95 transition cursor-pointer"
          title="Fermer le Fil Réel"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-black tracking-widest text-[#D4AF37] uppercase flex items-center gap-1.5 drop-shadow-md">
            🔥 Fil Réel
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-full bg-afri-bg/50 backdrop-blur-md border border-afri-border text-afri-text hover:bg-white/20 active:scale-95 transition cursor-pointer"
            title={isMuted ? "Activer le son" : "Couper le son"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          {/* Create Reel button */}
          {onOpenCreate && (
            <button 
              onClick={() => {
                requireAuth(() => {
                  onOpenCreate();
                });
              }}
              className="p-2.5 rounded-full bg-[#D4AF37] text-black font-bold shadow-lg hover:bg-amber-400 active:scale-95 transition cursor-pointer"
              title="Publier un Réel"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
            </button>
          )}
        </div>
      </div>

      {/* SNAP-Y VERTICAL FULLSCREEN STREAM */}
      <div 
        ref={containerRef}
        className="w-full h-full overflow-y-auto snap-y snap-mandatory scrollbar-none overscroll-contain [-webkit-overflow-scrolling:touch]"
        style={{ touchAction: "pan-y" }}
        onScroll={handleScroll}
      >
        {localReels.map((reel, index) => {
          const isActive = index === currentIndex;
          const isNext = index === currentIndex + 1;
          const isFollowing = reel.userId ? followedUsers.includes(reel.userId) : false;
          const isExpanded = Boolean(expandedDescriptions[reel.id]);

          return (
            <div 
              key={reel.id} 
              className="relative w-full h-[100dvh] snap-start bg-afri-bg flex justify-center items-center overflow-hidden shrink-0"
            >
              {/* VIDEO PLAYER LAYER */}
              {isActive || isNext ? (
                <div className="relative w-full h-full">
                  <video
                    ref={isActive ? activeVideoRef : null}
                    src={reel.mediaUrl}
                    preload={isActive ? "auto" : "metadata"}
                    className="w-full h-full object-cover"
                    loop
                    muted={isMuted}
                    playsInline
                    onClick={() => setIsMuted(!isMuted)}
                  />
                  {/* Dynamic bandwidth and video quality indicator badge */}
                  {isActive && (
                    <div className="absolute top-4 left-4 z-40 bg-black/60 border border-zinc-700/40 backdrop-blur-md text-[8.5px] font-mono font-bold text-white px-2 py-1 rounded-md flex items-center gap-1.5 shadow-md select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>{network?.videoQuality || "720p HD"}</span>
                      {network?.autoCompression && (
                        <>
                          <span className="text-zinc-500">|</span>
                          <span className="text-amber-400 font-extrabold text-[8px] uppercase">⚡ COMPRESSÉ AUTO</span>
                        </>
                      )}
                      {network?.slowConnectionMode && (
                        <>
                          <span className="text-zinc-500">|</span>
                          <span className="text-red-400 font-extrabold text-[8px] uppercase">📶 MODE LENT 2G/3G</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full bg-afri-bg-sec flex items-center justify-center relative">
                  <img src={reel.authorAvatar} alt="" className="w-full h-full object-cover opacity-30 blur-lg" />
                  <div className="absolute inset-0 bg-afri-bg/60 flex items-center justify-center">
                    <Music className="w-12 h-12 text-[#D4AF37]/40 animate-pulse" />
                  </div>
                </div>
              )}

              {/* GRADIENT OVERLAYS FOR CONTRAST */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none" />

              {/* RIGHT INTERACTION SIDEBAR */}
              <div className="absolute bottom-16 right-3 sm:right-5 z-40 flex flex-col items-center gap-4 text-afri-text">
                {/* Author Avatar (Clickable -> Public Profile) + Follow Button */}
                <div className="relative mb-2">
                  <div 
                    onClick={() => openPublicProfile(reel.userId)}
                    className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] to-amber-200 shadow-xl overflow-hidden cursor-pointer hover:scale-105 active:scale-95 transition"
                    title={`Voir le profil de ${reel.authorArtisticName || reel.authorName}`}
                  >
                    <img 
                      src={reel.authorAvatar} 
                      alt={reel.authorName}
                      className="w-full h-full rounded-full object-cover bg-afri-bg"
                    />
                  </div>
                  <button 
                    onClick={() => handleToggleFollow(reel.userId)}
                    className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full p-1 shadow-lg transition-transform active:scale-90 cursor-pointer ${
                      isFollowing ? "bg-emerald-500 text-afri-text" : "bg-[#D4AF37] text-black"
                    }`}
                    title={isFollowing ? "Abonné (cliquer pour retirer)" : "Suivre l'artiste"}
                  >
                    {isFollowing ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                </div>

                {/* ❤️ Honorer (Like) */}
                <button 
                  onClick={() => handleLike(reel.id)}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                  title="Honorer ce réel"
                >
                  <div className={`p-3 rounded-full bg-afri-bg/40 backdrop-blur-md border transition-transform group-active:scale-75 ${
                    reel.isLiked ? "border-red-500/80 bg-red-500/20" : "border-afri-border hover:bg-white/20"
                  }`}>
                    <Heart className={`w-6 h-6 transition-colors ${reel.isLiked ? "text-red-500 fill-current" : "text-afri-text"}`} />
                  </div>
                  <span className="text-[10px] font-mono font-black text-afri-text drop-shadow-md">
                    {reel.likesCount}
                  </span>
                </button>

                {/* 💬 Palabres (Comment) */}
                <button 
                  onClick={() => setShowCommentsFor(reel)}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                  title="Ouvrir les Palabres"
                >
                  <div className="p-3 rounded-full bg-afri-bg/40 backdrop-blur-md border border-afri-border hover:bg-white/20 transition-transform group-active:scale-75">
                    <MessageCircle className="w-6 h-6 text-afri-text" />
                  </div>
                  <span className="text-[10px] font-mono font-black text-afri-text drop-shadow-md">
                    {reel.commentsCount}
                  </span>
                </button>

                {/* 🔁 Partager / Transmettre */}
                <button 
                  onClick={() => handleShare(reel)}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                  title="Partager ce réel"
                >
                  <div className="p-3 rounded-full bg-afri-bg/40 backdrop-blur-md border border-afri-border hover:bg-white/20 transition-transform group-active:scale-75">
                    <Share2 className="w-6 h-6 text-afri-text" />
                  </div>
                  <span className="text-[9px] font-mono font-bold text-white/90 drop-shadow-md">
                    Partager
                  </span>
                </button>

                {/* ⭐ Enregistrer (Bookmark) */}
                <button 
                  onClick={() => handleBookmark(reel.id)}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                  title="Enregistrer"
                >
                  <div className={`p-3 rounded-full bg-afri-bg/40 backdrop-blur-md border transition-transform group-active:scale-75 ${
                    reel.isBookmarked ? "border-[#D4AF37] bg-[#D4AF37]/20" : "border-afri-border hover:bg-white/20"
                  }`}>
                    <Bookmark className={`w-6 h-6 transition-colors ${reel.isBookmarked ? "text-[#D4AF37] fill-current" : "text-afri-text"}`} />
                  </div>
                  <span className="text-[9px] font-mono font-bold text-white/90 drop-shadow-md">
                    Favoris
                  </span>
                </button>

                {/* ⋮ Plus */}
                <button 
                  onClick={() => setShowMoreFor(reel)}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                  title="Plus d'options"
                >
                  <div className="p-3 rounded-full bg-afri-bg/40 backdrop-blur-md border border-afri-border hover:bg-white/20 transition-transform group-active:scale-75">
                    <MoreVertical className="w-6 h-6 text-afri-text" />
                  </div>
                  <span className="text-[9px] font-mono font-bold text-white/90 drop-shadow-md">
                    Plus
                  </span>
                </button>
              </div>

              {/* BOTTOM OVERLAY - AUTHOR & DETAILS */}
              <div className="absolute bottom-6 left-4 right-20 z-40 text-left space-y-2 pointer-events-auto">
                {/* Author Info (Clickable) & Location */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => openPublicProfile(reel.userId)}
                      className="text-sm font-black text-afri-text uppercase tracking-wider drop-shadow-lg truncate max-w-[140px] xs:max-w-[180px] block hover:underline hover:text-[#D4AF37] transition text-left cursor-pointer"
                      title={`Consulter le profil de ${reel.authorArtisticName || reel.authorName}`}
                    >
                      {reel.authorArtisticName || reel.authorName}
                    </button>
                    <span className="text-[10px] font-mono bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 px-2 py-0.5 rounded-full font-bold uppercase">
                      Artiste Souverain
                    </span>
                  </div>
                  {reel.commune && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-afri-text-sec drop-shadow">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>{reel.commune}</span>
                    </div>
                  )}
                </div>

                {/* Description with Expand/Collapse "... plus" */}
                <div className="space-y-1">
                  <p className={`text-xs text-white/90 font-sans leading-relaxed drop-shadow-md max-w-md ${isExpanded ? "" : "line-clamp-2"}`}>
                    {reel.content}
                  </p>
                  {reel.content && reel.content.length > 70 && (
                    <button
                      onClick={() => toggleExpand(reel.id)}
                      className="text-[10px] font-bold text-[#D4AF37] hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      {isExpanded ? "Réduire" : "... plus"}
                    </button>
                  )}
                </div>

                {/* Hashtags */}
                {reel.hashtags && reel.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {reel.hashtags.map((ht, idx) => (
                      <span key={idx} className="text-[10px] font-mono font-black text-[#D4AF37] drop-shadow">
                        {ht}
                      </span>
                    ))}
                  </div>
                )}

                {/* Music Track Banner */}
                <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-[#D4AF37] font-bold drop-shadow">
                  <Music className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "4s" }} />
                  <span className="truncate max-w-[200px]">{reel.musicTrack || "Son original AFRIGOMBO ELITE"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PALABRES / COMMENTS DRAWER MODAL */}
      {showCommentsFor && (
        <div className="fixed inset-0 z-[120] bg-afri-bg/80 backdrop-blur-md flex flex-col justify-end animate-fadeIn">
          <div className="bg-afri-bg border-t border-[#D4AF37]/40 rounded-t-3xl max-h-[75vh] flex flex-col w-full max-w-lg mx-auto p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-afri-border pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-sm font-black text-afri-text uppercase tracking-wider">
                  Arbre à Palabres ({commentsList.length})
                </h3>
              </div>
              <button 
                onClick={() => setShowCommentsFor(null)}
                className="p-1 rounded-full bg-afri-bg-ter text-afri-text-sec hover:text-afri-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[45vh] overscroll-contain [-webkit-overflow-scrolling:touch]" style={{ touchAction: "pan-y" }}>
              {commentsList.map(c => (
                <div key={c.id} className="flex gap-3 items-start bg-zinc-900/60 p-2.5 rounded-2xl border border-afri-border">
                  <img src={c.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]/30 shrink-0" />
                  <div className="flex-1 text-left space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#D4AF37] uppercase">{c.author}</span>
                      <span className="text-[9px] font-mono text-afri-text-muted">{c.time}</span>
                    </div>
                    <p className="text-xs text-afri-text">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-afri-border">
              <input 
                type="text" 
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Partager votre palabre..."
                className="flex-1 bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]"
              />
              <button 
                type="submit"
                className="bg-[#D4AF37] text-black font-bold px-4 py-2 rounded-xl text-xs hover:bg-amber-400 active:scale-95 transition flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MORE OPTIONS MODAL (Report only, 'Soutenir' removed) */}
      {showMoreFor && (
        <div className="fixed inset-0 z-[120] bg-afri-bg/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-afri-bg border border-[#D4AF37]/40 rounded-3xl w-full max-w-sm p-5 space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-afri-border pb-2">
              <h3 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider">Option du Réel</h3>
              <button onClick={() => setShowMoreFor(null)} className="p-1 text-afri-text-sec hover:text-afri-text cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => handleReportReel(showMoreFor)}
                className="w-full flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 font-bold text-xs hover:bg-red-500/20 active:scale-98 transition cursor-pointer"
              >
                <Flag className="w-4 h-4" />
                <span>Signaler cette publication</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
