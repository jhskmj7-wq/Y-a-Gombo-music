import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, Heart, MessageCircle, Share2, Bookmark, MoreVertical, 
  Plus, Music, MapPin, Volume2, VolumeX, Sparkles, Flag, X, Check,
  Send, UserCheck, UserPlus, ChevronDown, ChevronUp, AlertTriangle, Film, RefreshCw
} from "lucide-react";
import { Post } from "../types";
import { db } from "../lib/firebase";
import { 
  doc, updateDoc, arrayUnion, arrayRemove, increment, 
  collection, addDoc, setDoc, deleteDoc, onSnapshot, query, limit, orderBy 
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
  comments?: any[];
  isLiked?: boolean;
  isBookmarked?: boolean;
  userId?: string;
  source?: "portfolio" | "post" | "social";
}

interface ReelsPlayerProps {
  posts?: Post[];
  users?: any[];
  onClose: () => void;
  onOpenCreate?: () => void;
  currentUser?: any;
  initialReelId?: string;
}

// Unified YouTube ID extractor
function getYoutubeId(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const url = rawUrl.trim();
  if (url.includes("youtube.com/watch")) {
    const parts = url.split("v=");
    if (parts[1]) return parts[1].split("&")[0];
  } else if (url.includes("youtu.be/")) {
    const parts = url.split("youtu.be/");
    if (parts[1]) return parts[1].split("?")[0];
  } else if (url.includes("youtube.com/embed/")) {
    const parts = url.split("youtube.com/embed/");
    if (parts[1]) return parts[1].split("?")[0];
  }
  return null;
}

// Portfolio & Reels unified video URL resolution (accepts videoUrl, mediaUrl, url, src)
function resolveVideoUrl(item: any): string | null {
  if (!item) return null;
  const candidate = item.videoUrl || item.mediaUrl || item.url || item.media_url || item.src;
  if (typeof candidate === "string" && candidate.trim().length > 0) {
    return candidate.trim();
  }
  return null;
}

// Validate if item is video/reel without rejecting URLs that do not contain ".mp4"
function isVideoItem(item: any, resolvedUrl: string): boolean {
  if (!resolvedUrl) return false;

  const type = String(item.type || item.mediaType || "").toLowerCase();

  // Explicit video/reel/youtube types
  if (type === "video" || type === "reel" || type === "youtube") {
    return true;
  }
  if (item.videoUrl && typeof item.videoUrl === "string") {
    return true;
  }

  // Reject explicit non-video media
  if (type === "audio" || type === "photo" || type === "image") {
    return false;
  }

  const cleanUrl = resolvedUrl.toLowerCase().split("?")[0];
  // Filter out audio file extensions
  if (cleanUrl.endsWith(".mp3") || cleanUrl.endsWith(".wav") || cleanUrl.endsWith(".ogg") || cleanUrl.endsWith(".m4a") || cleanUrl.endsWith(".aac")) {
    return false;
  }
  // Filter out image file extensions
  if (cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".jpeg") || cleanUrl.endsWith(".png") || cleanUrl.endsWith(".webp") || cleanUrl.endsWith(".gif") || cleanUrl.endsWith(".svg")) {
    return false;
  }

  // Any other URL (Firebase Storage, Supabase, CDN, blob, webm, mov, etc.) is accepted
  return true;
}

export function ReelsPlayer({ posts = [], users = [], onClose, onOpenCreate, currentUser, initialReelId }: ReelsPlayerProps) {
  const { network } = useAppSettings();
  const { requireAuth, profile, currentUser: authUser } = useAuth();
  const effectiveUser = currentUser || authUser;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [showCommentsFor, setShowCommentsFor] = useState<ReelItem | null>(null);
  const [showMoreFor, setShowMoreFor] = useState<ReelItem | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [commentsList, setCommentsList] = useState<{ id: string; author: string; avatar: string; text: string; time: string }[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ reelId: string; x: number; y: number } | null>(null);
  const lastTapRef = useRef<{ time: number; reelId: string }>({ time: 0, reelId: "" });

  // Real-time Firestore sync identical to Portfolio & Feed
  const [firestorePosts, setFirestorePosts] = useState<any[]>([]);
  const [firestoreUsers, setFirestoreUsers] = useState<any[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Bulletproof cleanup of all media (videos, audios, youtube iframes)
  const stopAllMedia = () => {
    videoElementsRef.current.forEach((videoEl) => {
      try {
        videoEl.pause();
        videoEl.currentTime = 0;
        videoEl.removeAttribute("src");
        videoEl.load();
      } catch (_) {}
    });
    videoElementsRef.current.clear();

    if (containerRef.current) {
      const vids = containerRef.current.querySelectorAll("video");
      vids.forEach((v) => {
        try {
          v.pause();
          v.currentTime = 0;
          v.removeAttribute("src");
          v.load();
        } catch (_) {}
      });

      const auds = containerRef.current.querySelectorAll("audio");
      auds.forEach((a) => {
        try {
          a.pause();
          a.currentTime = 0;
          a.removeAttribute("src");
          a.load();
        } catch (_) {}
      });

      const iframes = containerRef.current.querySelectorAll("iframe");
      iframes.forEach((f) => {
        try {
          if (f.src && (f.src.includes("youtube") || f.src.includes("vimeo"))) {
            f.src = "about:blank";
          }
        } catch (_) {}
      });
    }
  };

  const handleClose = () => {
    stopAllMedia();
    onClose();
  };

  // Synchronize Firestore collections (posts, social_posts, users) in real-time
  useEffect(() => {
    if (!db) return;
    let unsubPosts = () => {};
    let unsubSocial = () => {};
    let unsubUsers = () => {};

    try {
      const postsRef = query(collection(db, "posts"), limit(100));
      unsubPosts = onSnapshot(postsRef, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setFirestorePosts(prev => {
          const map = new Map<string, any>();
          prev.forEach(p => { if (p?.id) map.set(p.id, p); });
          list.forEach(p => { if (p?.id) map.set(p.id, { ...map.get(p.id), ...p }); });
          return Array.from(map.values());
        });
      }, (err) => {
        console.warn("[ReelsPlayer] Posts listener warning:", err);
      });
    } catch (e) {
      console.warn("[ReelsPlayer] Error attaching posts listener:", e);
    }

    try {
      const socialRef = query(collection(db, "social_posts"), limit(100));
      unsubSocial = onSnapshot(socialRef, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setFirestorePosts(prev => {
          const map = new Map<string, any>();
          prev.forEach(p => { if (p?.id) map.set(p.id, p); });
          list.forEach(p => { if (p?.id) map.set(p.id, { ...map.get(p.id), ...p }); });
          return Array.from(map.values());
        });
      }, (err) => {
        console.warn("[ReelsPlayer] Social posts listener warning:", err);
      });
    } catch (e) {
      console.warn("[ReelsPlayer] Error attaching social listener:", e);
    }

    try {
      const usersRef = query(collection(db, "users"), limit(100));
      unsubUsers = onSnapshot(usersRef, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setFirestoreUsers(list);
      }, (err) => {
        console.warn("[ReelsPlayer] Users listener warning:", err);
      });
    } catch (e) {
      console.warn("[ReelsPlayer] Error attaching users listener:", e);
    }

    return () => {
      unsubPosts();
      unsubSocial();
      unsubUsers();
    };
  }, []);

  // Initialize followed users from currentUser following array
  useEffect(() => {
    if (effectiveUser?.following && Array.isArray(effectiveUser.following)) {
      setFollowedUsers(effectiveUser.following);
    }
  }, [effectiveUser]);

  // Build unified list of reels using identical sources and URL resolution as Portfolio
  const reelsList = React.useMemo(() => {
    const list: ReelItem[] = [];
    const seenUrls = new Set<string>();

    // 1. Gather all users (props.users, Firestore users, useAuth().profile, effectiveUser, local storage session)
    const allUsersMap = new Map<string, any>();

    (users || []).forEach(u => {
      if (u && (u.id || u.uid)) allUsersMap.set(u.id || u.uid, u);
    });

    firestoreUsers.forEach(u => {
      if (u && (u.id || u.uid)) {
        const uid = u.id || u.uid;
        allUsersMap.set(uid, { ...allUsersMap.get(uid), ...u });
      }
    });

    if (profile && (profile.id || profile.uid || effectiveUser?.uid)) {
      const uid = profile.id || profile.uid || effectiveUser?.uid;
      allUsersMap.set(uid, { ...allUsersMap.get(uid), ...profile });
    }

    if (effectiveUser && (effectiveUser.id || effectiveUser.uid)) {
      const uid = effectiveUser.id || effectiveUser.uid;
      allUsersMap.set(uid, { ...allUsersMap.get(uid), ...effectiveUser });
    }

    try {
      const savedSession = localStorage.getItem("afrigombo_user_session");
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && (parsed.id || parsed.uid)) {
          const uid = parsed.id || parsed.uid;
          allUsersMap.set(uid, { ...allUsersMap.get(uid), ...parsed });
        }
      }
    } catch (_) {}

    const consolidatedUsers = Array.from(allUsersMap.values());

    // 2. Extract videos from consolidated users' mediaGallery (Portfolio source)
    consolidatedUsers.forEach(u => {
      const gallery = Array.isArray(u.mediaGallery) ? u.mediaGallery : [];
      gallery.forEach((m: any, idx: number) => {
        const url = resolveVideoUrl(m);
        if (!url || seenUrls.has(url)) return;
        if (!isVideoItem(m, url)) return;

        seenUrls.add(url);
        list.push({
          id: m.id || `portfolio_${u.id || u.uid}_${idx}`,
          title: m.title || m.caption || "Démo Portfolio",
          authorName: u.name || u.displayName || "Artiste Accrédité",
          authorArtisticName: u.artisticName || u.name || u.displayName || "Artiste Accrédité",
          authorAvatar: u.photoURL || u.photoUrl || u.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          commune: u.commune || u.city || "Abidjan",
          content: m.description || m.caption || `Démonstration officielle et prestation de ${u.artisticName || u.name || "l'artiste"}.`,
          mediaUrl: url,
          musicTrack: m.musicTrack || m.title || `Prestation Live — ${u.artisticName || u.name || "Artiste"}`,
          hashtags: Array.isArray(m.hashtags) ? m.hashtags : ["#Afrigombo", "#Portfolio", "#Live"],
          likesCount: typeof m.likes === "number" ? m.likes : (m.likesCount || 12),
          commentsCount: typeof m.commentsCount === "number" ? m.commentsCount : (Array.isArray(m.comments) ? m.comments.length : 0),
          comments: Array.isArray(m.comments) ? m.comments : [],
          isLiked: false,
          userId: u.id || u.uid,
          source: "portfolio"
        });
      });
    });

    // 3. Extract videos from all posts (props.posts + Firestore posts + social_posts)
    const allPostsMap = new Map<string, any>();
    (posts || []).forEach(p => {
      if (p && p.id) allPostsMap.set(p.id, p);
    });
    firestorePosts.forEach(p => {
      if (p && p.id) {
        allPostsMap.set(p.id, { ...allPostsMap.get(p.id), ...p });
      }
    });

    const consolidatedPosts = Array.from(allPostsMap.values());
    consolidatedPosts.forEach((p: any, idx: number) => {
      const url = resolveVideoUrl(p);
      if (!url || seenUrls.has(url)) return;
      if (!isVideoItem(p, url)) return;

      seenUrls.add(url);
      const likedBy = Array.isArray(p.likedBy) ? p.likedBy : [];
      const isLiked = effectiveUser?.uid ? (likedBy.includes(effectiveUser.uid) || Boolean(p.isLiked)) : Boolean(p.isLiked);

      list.push({
        id: p.id || `post_${idx}`,
        title: p.title || p.caption || "Vibration Artistique",
        authorName: p.authorName || p.userName || p.artistName || "Artiste Gombo",
        authorArtisticName: p.authorArtisticName || p.authorName || p.artistName || "Artiste Gombo",
        authorAvatar: p.authorAvatar || p.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        commune: p.commune || p.location || "Abidjan",
        content: p.content || p.caption || p.text || "Publication vidéo sur le Fil Réel d'AFRIGOMBO ELITE.",
        mediaUrl: url,
        musicTrack: p.title || p.musicTrack || "Son original AFRIGOMBO ELITE",
        hashtags: Array.isArray(p.hashtags) ? p.hashtags : ["#Afrigombo", "#FilReel", "#ArtisteIvoirien"],
        likesCount: p.likes || p.likesCount || 0,
        commentsCount: typeof p.comments === "number" ? p.comments : (Array.isArray(p.comments) ? p.comments.length : (p.commentsCount || 0)),
        comments: Array.isArray(p.comments) ? p.comments : [],
        isLiked: Boolean(isLiked),
        userId: p.userId || p.authorId,
        source: "post"
      });
    });

    // If real videos exist, ONLY return real project videos! Mixkit 403 fallbacks removed.
    return list;
  }, [posts, users, firestorePosts, firestoreUsers, profile, effectiveUser]);

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

  // Play active video & pause all non-active videos when index changes
  useEffect(() => {
    const currentReel = localReels[currentIndex];

    // Pause all non-active videos immediately
    videoElementsRef.current.forEach((videoEl, reelId) => {
      if (!currentReel || reelId !== currentReel.id) {
        try {
          videoEl.pause();
          videoEl.currentTime = 0;
        } catch (_) {}
      }
    });

    if (activeVideoRef.current) {
      activeVideoRef.current.currentTime = 0;
      const playPromise = activeVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("[ReelsPlayer] Autoplay prevented by browser, falling back to muted autoplay:", err);
          if (activeVideoRef.current && !activeVideoRef.current.muted) {
            activeVideoRef.current.muted = true;
            setIsMuted(true);
            activeVideoRef.current.play().catch(() => {});
          }
        });
      }
    }
  }, [currentIndex, isMuted, localReels]);

  // COMPLETE UNMOUNT CLEANUP
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, []);

  // PAUSE WHEN TAB / WINDOW BECOMES INACTIVE OR HIDDEN
  useEffect(() => {
    const handleInvisibility = () => {
      if (document.hidden) {
        videoElementsRef.current.forEach((videoEl) => {
          try { videoEl.pause(); } catch (_) {}
        });
      }
    };

    document.addEventListener("visibilitychange", handleInvisibility);
    window.addEventListener("pagehide", handleInvisibility);
    window.addEventListener("blur", handleInvisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleInvisibility);
      window.removeEventListener("pagehide", handleInvisibility);
      window.removeEventListener("blur", handleInvisibility);
    };
  }, []);

  // Listen to Firestore comments in real time when drawer opens
  useEffect(() => {
    if (!showCommentsFor) {
      setCommentsList([]);
      return;
    }
    const reelId = showCommentsFor.id;

    // Load initial comments from the post object itself if present
    const existingPostComments = Array.isArray(showCommentsFor.comments) ? showCommentsFor.comments.map((c: any, idx: number) => ({
      id: c.id || `c_init_${idx}`,
      author: c.author || c.authorName || c.userName || "Mélomane",
      avatar: c.avatar || c.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
      text: c.text || c.content || "",
      time: c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Récemment"
    })) : [];
    setCommentsList(existingPostComments);

    if (!db) return;

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
        } else if (existingPostComments.length === 0) {
          setCommentsList([]);
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
  const handleLike = (reelId: string, forceLike?: boolean) => {
    requireAuth(async () => {
      let nextIsLiked = false;
      setLocalReels(prev => prev.map(r => {
        if (r.id === reelId) {
          if (forceLike === true) {
            if (r.isLiked) return r; // already liked
            nextIsLiked = true;
            return {
              ...r,
              isLiked: true,
              likesCount: r.likesCount + 1
            };
          }
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

  // Double-tap handler on video area to like and trigger floating heart animation
  const handleVideoTouchOrClick = (e: React.MouseEvent | React.TouchEvent, reelId: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current;
    if (lastTap.reelId === reelId && now - lastTap.time < 350) {
      // Double tap detected!
      lastTapRef.current = { time: 0, reelId: "" };
      let clientX = 0;
      let clientY = 0;
      if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if ("changedTouches" in e && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      }
      setDoubleTapHeart({ reelId, x: clientX, y: clientY });
      setTimeout(() => setDoubleTapHeart(null), 900);
      handleLike(reelId, true);
    } else {
      lastTapRef.current = { time: now, reelId };
    }
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
          onClick={handleClose}
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
        {localReels.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-afri-bg">
            <div className="w-20 h-20 rounded-3xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mb-4 shadow-2xl">
              <Film className="w-10 h-10 text-[#D4AF37]" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] font-black uppercase bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20 mb-3">
              FIL RÉEL AFRIGOMBO
            </span>
            <h3 className="text-lg font-black text-afri-text uppercase tracking-wide">
              Aucun Réel vidéo disponible
            </h3>
            <p className="text-xs text-afri-text-sec mt-2 max-w-sm leading-relaxed">
              Les vidéos enregistrées dans votre Portfolio ou publiées sur le terrain apparaîtront automatiquement ici.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {onOpenCreate && (
                <button
                  type="button"
                  onClick={() => {
                    requireAuth(() => {
                      onOpenCreate();
                    });
                  }}
                  className="px-5 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Publier une vidéo</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 bg-afri-bg-sec border border-afri-border hover:bg-white/10 text-afri-text font-bold text-xs uppercase tracking-wider rounded-2xl transition cursor-pointer"
              >
                Retour au Terrain
              </button>
            </div>
          </div>
        ) : (
          localReels.map((reel, index) => {
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
                  <div 
                    className="relative w-full h-full"
                    onClick={(e) => handleVideoTouchOrClick(e, reel.id)}
                    onTouchEnd={(e) => handleVideoTouchOrClick(e, reel.id)}
                  >
                    {getYoutubeId(reel.mediaUrl) ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYoutubeId(reel.mediaUrl)}?autoplay=${isActive ? 1 : 0}&mute=${isMuted ? 1 : 0}&loop=1&playlist=${getYoutubeId(reel.mediaUrl)}&playsinline=1&controls=0&rel=0&modestbranding=1`}
                        title={reel.title || "Vidéo Réel"}
                        className="w-full h-full object-cover pointer-events-auto"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        ref={(el) => {
                          if (el) {
                            videoElementsRef.current.set(reel.id, el);
                            if (isActive) {
                              activeVideoRef.current = el;
                            }
                          } else {
                            videoElementsRef.current.delete(reel.id);
                            if (isActive && activeVideoRef.current === el) {
                              activeVideoRef.current = null;
                            }
                          }
                        }}
                        src={reel.mediaUrl}
                        autoPlay={isActive}
                        preload={isActive ? "auto" : "metadata"}
                        className="w-full h-full object-cover cursor-pointer"
                        loop
                        muted={isMuted}
                        playsInline
                        // @ts-ignore
                        webkit-playsinline="true"
                        x-webkit-airplay="allow"
                        onCanPlay={() => {
                          setVideoErrors(prev => {
                            if (!prev[reel.id]) return prev;
                            const next = { ...prev };
                            delete next[reel.id];
                            return next;
                          });
                        }}
                        onError={(e) => {
                          console.warn(`[ReelsPlayer] Erreur chargement vidéo (id: ${reel.id}):`, e);
                          setVideoErrors(prev => ({ ...prev, [reel.id]: true }));
                        }}
                        onLoadedData={() => {
                          setVideoErrors(prev => {
                            if (!prev[reel.id]) return prev;
                            const next = { ...prev };
                            delete next[reel.id];
                            return next;
                          });
                        }}
                      />
                    )}

                    {/* Double-tap animated heart overlay */}
                    {doubleTapHeart && doubleTapHeart.reelId === reel.id && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50 animate-ping">
                        <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]" />
                      </div>
                    )}

                    {/* Video Error Overlay with Retry & Next */}
                    {videoErrors[reel.id] && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md text-white p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3">
                          <AlertTriangle className="w-7 h-7 text-amber-400" />
                        </div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                          Lecture indisponible
                        </h4>
                        <p className="text-xs text-zinc-400 max-w-xs mb-4 leading-relaxed">
                          Cette vidéo ne peut pas être lue actuellement ou le format nécessite un traitement.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVideoErrors(prev => {
                                const next = { ...prev };
                                delete next[reel.id];
                                return next;
                              });
                              if (activeVideoRef.current) {
                                activeVideoRef.current.load();
                                activeVideoRef.current.play().catch((playErr) => console.warn("[ReelsPlayer] Retry error:", playErr));
                              }
                            }}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-full border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Réessayer</span>
                          </button>
                          {localReels.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextIdx = (currentIndex + 1) % localReels.length;
                                setCurrentIndex(nextIdx);
                                if (containerRef.current) {
                                  containerRef.current.scrollTop = nextIdx * containerRef.current.clientHeight;
                                }
                              }}
                              className="px-4 py-2 bg-[#D4AF37] hover:bg-amber-400 text-black text-xs font-bold rounded-full transition cursor-pointer"
                            >
                              Suivant
                            </button>
                          )}
                        </div>
                      </div>
                    )}

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
        })
      )}
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
              {commentsList.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 space-y-1">
                  <MessageCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-zinc-300">Aucun palabre pour l'instant</p>
                  <p className="text-[10px] text-zinc-500">Soyez le premier à commenter ce Réel !</p>
                </div>
              ) : (
                commentsList.map(c => (
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
                ))
              )}
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
