import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, Heart, MessageCircle, Share2, Bookmark, MoreVertical, 
  Plus, Music, MapPin, Volume2, VolumeX, Sparkles, Flag, X, Check, Pause, Play,
  Send, UserCheck, UserPlus, ChevronDown, ChevronUp, AlertTriangle, Film, RefreshCw,
  EyeOff, UserX, Copy, Link, Clock, ArrowUpDown, Loader2
} from "lucide-react";
import { Post } from "../types";
import { db } from "../lib/firebase";
import { 
  doc, updateDoc, arrayUnion, arrayRemove, increment, 
  collection, addDoc, setDoc, deleteDoc, onSnapshot, query, limit, orderBy, getDoc
} from "firebase/firestore";
import { gomboDB } from "../firebase";
import { useAppSettings } from "../context/AppSettingsContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../AuthContext";
import { openPublicProfile } from "../lib/publicProfile";
import { getFilterCss } from "./reels/videoFilters";
import { rankReels } from "../lib/reelsEngine";

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
  appliedFilter?: string;
  likesCount: number;
  commentsCount: number;
  comments?: any[];
  isLiked?: boolean;
  isBookmarked?: boolean;
  userId?: string;
  source?: "portfolio" | "post" | "social";
}

interface CommentItem {
  id: string;
  postId?: string;
  userId?: string;
  author: string;
  avatar: string;
  text: string;
  createdAt?: string;
  time: string;
}

interface ReelsPlayerProps {
  posts?: Post[];
  users?: any[];
  onClose: () => void;
  onOpenCreate?: () => void;
  currentUser?: any;
  initialReelId?: string;
}

export const R2_PUBLIC_BASE_URL = "https://pub-9b8a37b996274704aee625c82e6430f3.r2.dev";

// Convert any R2 key, proxy path or relative path to absolute Cloudflare R2 Public CDN URL
export function toDirectR2PublicUrl(rawPathOrUrl: string): string {
  if (!rawPathOrUrl || typeof rawPathOrUrl !== "string") return "";
  const trimmed = rawPathOrUrl.trim();

  // If already full CDN or HTTP URL, return as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    // If it points to /api/r2/media/, convert to direct R2 public CDN
    if (trimmed.includes("/api/r2/media/")) {
      const parts = trimmed.split("/api/r2/media/");
      const rawKey = parts[1] || "";
      const decodedKey = decodeURIComponent(rawKey).replace(/^\/+/, "");
      return `${R2_PUBLIC_BASE_URL}/${decodedKey}`;
    }
    return trimmed;
  }

  // Handle /api/r2/media/{key} relative paths
  if (trimmed.startsWith("/api/r2/media/")) {
    const rawKey = trimmed.replace(/^\/api\/r2\/media\/?/, "");
    const decodedKey = decodeURIComponent(rawKey).replace(/^\/+/, "");
    return `${R2_PUBLIC_BASE_URL}/${decodedKey}`;
  }

  // Handle reels/... or covers/... or any R2 key paths
  const cleanKey = trimmed.replace(/^\/+/, "");
  return `${R2_PUBLIC_BASE_URL}/${cleanKey}`;
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

// Portfolio & Reels unified video URL resolution (accepts videoUrl, mediaUrl, url, src, storagePath)
function resolveVideoUrl(item: any): string | null {
  if (!item) return null;
  const candidate =
    item.videoUrl ||
    item.mediaUrl ||
    item.url ||
    item.media_url ||
    item.src ||
    (item.storagePath ? toDirectR2PublicUrl(item.storagePath) : null);

  if (typeof candidate === "string" && candidate.trim().length > 0) {
    const trimmed = candidate.trim();
    return toDirectR2PublicUrl(trimmed);
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

function formatRelativeTime(dateInput: any): string {
  if (!dateInput) return "Récemment";
  try {
    const d = typeof dateInput === "string" || typeof dateInput === "number" 
      ? new Date(dateInput) 
      : (dateInput && typeof dateInput.toDate === "function" ? dateInput.toDate() : new Date(dateInput));
    if (isNaN(d.getTime())) return "Récemment";
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 30) return "À l'instant";
    if (diffSec < 3600) return `Il y a ${Math.max(1, Math.floor(diffSec / 60))} min`;
    if (diffSec < 86400) return `Il y a ${Math.floor(diffSec / 3600)} h`;
    if (diffSec < 604800) return `Il y a ${Math.floor(diffSec / 86400)} j`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch (_) {
    return "Récemment";
  }
}

export function ReelsPlayer({ posts = [], users = [], onClose, onOpenCreate, currentUser, initialReelId }: ReelsPlayerProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { network } = useAppSettings();
  const { requireAuth, profile, currentUser: authUser } = useAuth();
  const effectiveUser = currentUser || authUser;

  const [currentIndex, setCurrentIndex] = useState(0);
  // Default sound state: unmuted by default (muted = false), will fallback to muted if browser blocks autoplay
  const [isMuted, setIsMuted] = useState(false);
  const sessionTimestamp = useRef(Date.now()).current;
  const [seenReels, setSeenReels] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem("afrigombo_seen_reels");
      if (stored) return new Set(JSON.parse(stored));
    } catch (_) {}
    return new Set<string>();
  });
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [showCommentsFor, setShowCommentsFor] = useState<ReelItem | null>(null);
  const [showMoreFor, setShowMoreFor] = useState<ReelItem | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);
  const [commentsSortOrder, setCommentsSortOrder] = useState<"asc" | "desc">("asc");
  const authorProfilesCache = useRef<Record<string, { author: string; avatar: string }>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ reelId: string; x: number; y: number } | null>(null);
  const [playPauseNotice, setPlayPauseNotice] = useState<{ type: "play" | "pause"; reelId: string } | null>(null);
  const lastTapRef = useRef<{ time: number; reelId: string }>({ time: 0, reelId: "" });
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Speed hold ×2.0 state and refs
  const [isSpeedHoldActive, setIsSpeedHoldActive] = useState<boolean>(false);
  const speedHoldTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressedRef = useRef<boolean>(false);
  
  // Deterministic gesture lock & touch coords
  const isTransitioningRef = useRef<boolean>(false);
  const touchStartYRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);
  const isSwipingRef = useRef<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const iframeElementsRef = useRef<Map<string, HTMLIFrameElement>>(new Map());
  const allCreatedVideos = useRef<Set<HTMLVideoElement>>(new Set());
  const allCreatedIframes = useRef<Set<HTMLIFrameElement>>(new Set());
  const userClickedMute = useRef<boolean | null>(null);
  const lastPlayedReelIdRef = useRef<string | null>(null);

  const syncVideoAudio = (videoEl: HTMLVideoElement, muted: boolean) => {
    try {
      videoEl.muted = muted;
      if (!muted) {
        if (videoEl.volume === 0 || videoEl.volume === null || videoEl.volume === undefined) {
          videoEl.volume = 1.0;
        }
      }
    } catch (err) {
      console.warn("[ReelsPlayer] Error syncing video audio:", err);
    }
  };

  // Bulletproof cleanup of all media (videos, audios, youtube iframes)
  const stopAllMedia = () => {
    // 1. Halt and mute all tracked video elements (including unmounted ones still in memory)
    allCreatedVideos.current.forEach((videoEl) => {
      try {
        videoEl.pause();
        videoEl.currentTime = 0;
        videoEl.muted = true;
        videoEl.removeAttribute("src");
        videoEl.load();
      } catch (_) {}
    });
    allCreatedVideos.current.clear();

    // 2. Halt all active elements in videoElementsRef map
    videoElementsRef.current.forEach((videoEl) => {
      try {
        videoEl.pause();
        videoEl.currentTime = 0;
        videoEl.muted = true;
        videoEl.removeAttribute("src");
        videoEl.load();
      } catch (_) {}
    });
    videoElementsRef.current.clear();

    // 3. Halt all tracked YouTube iframes
    iframeElementsRef.current.forEach((f) => {
      try {
        f.src = "about:blank";
      } catch (_) {}
    });
    iframeElementsRef.current.clear();

    allCreatedIframes.current.forEach((f) => {
      try {
        f.src = "about:blank";
      } catch (_) {}
    });
    allCreatedIframes.current.clear();

    // 4. Fallback search inside containerRef if still present
    if (containerRef.current) {
      const vids = containerRef.current.querySelectorAll("video");
      vids.forEach((v) => {
        try {
          v.pause();
          v.currentTime = 0;
          v.muted = true;
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

    if (activeVideoRef.current) {
      activeVideoRef.current = null;
    }
    lastPlayedReelIdRef.current = null;
  };

  const handleClose = () => {
    stopAllMedia();
    onClose();
  };

  // Initialize followed users from currentUser following array
  useEffect(() => {
    if (effectiveUser?.following && Array.isArray(effectiveUser.following)) {
      setFollowedUsers(effectiveUser.following);
    }
  }, [effectiveUser]);

  // Clean up speed hold timers on unmount
  useEffect(() => {
    return () => {
      if (speedHoldTimeoutRef.current) {
        clearTimeout(speedHoldTimeoutRef.current);
      }
    };
  }, []);

  // Build unified list of reels using identical sources and URL resolution as Portfolio
  const reelsList = React.useMemo(() => {
    const list: ReelItem[] = [];
    const seenUrls = new Set<string>();

    // 1. Gather all users (props.users, useAuth().profile, effectiveUser, local storage session)
    const allUsersMap = new Map<string, any>();

    (users || []).forEach(u => {
      if (u && (u.id || u.uid)) allUsersMap.set(u.id || u.uid, u);
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
        if (m.status === "draft" || m.status === "hidden" || m.status === "archived" || m.visible === false) return;
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
          appliedFilter: m.appliedFilter || "naturel",
          likesCount: typeof m.likes === "number" ? m.likes : (typeof m.likesCount === "number" ? m.likesCount : (Array.isArray(m.likes) ? m.likes.length : 0)),
          commentsCount: typeof m.commentsCount === "number" ? m.commentsCount : (Array.isArray(m.comments) ? m.comments.length : (typeof m.comments === "number" ? m.comments : 0)),
          comments: Array.isArray(m.comments) ? m.comments : [],
          isLiked: false,
          userId: u.id || u.uid,
          source: "portfolio"
        });
      });
    });

    // 3. Extract videos from all posts (props.posts source of truth)
    const allPostsMap = new Map<string, any>();
    (posts || []).forEach(p => {
      if (p && p.id) allPostsMap.set(p.id, p);
    });

    const consolidatedPosts = Array.from(allPostsMap.values());
    consolidatedPosts.forEach((p: any, idx: number) => {
      if (p.status === "draft" || p.status === "hidden" || p.status === "archived" || p.visible === false) return;
      const url = resolveVideoUrl(p);
      if (!url || seenUrls.has(url)) return;
      if (!isVideoItem(p, url)) return;

      seenUrls.add(url);
      const likedBy = Array.isArray(p.likedBy) ? p.likedBy : [];
      const isLiked = effectiveUser?.uid ? (likedBy.includes(effectiveUser.uid) || Boolean(p.isLiked)) : Boolean(p.isLiked);

      const realLikes = (function() {
        if (Array.isArray(p.likedBy)) return p.likedBy.length;
        if (Array.isArray(p.likes)) return p.likes.length;
        if (typeof p.likesCount === "number") return p.likesCount;
        if (typeof p.likes === "number") return p.likes;
        return 0;
      })();

      const realComments = (function() {
        if (Array.isArray(p.comments)) return p.comments.length;
        if (typeof p.commentsCount === "number") return p.commentsCount;
        if (typeof p.comments === "number") return p.comments;
        return 0;
      })();

      list.push({
        id: p.id || `post_${idx}`,
        title: p.title || p.caption || "Vibration Artistique",
        authorName: p.authorName || p.userName || p.artistName || "Artiste Gombo",
        authorArtisticName: p.authorArtisticName || p.authorName || p.artistName || "Artiste Gombo",
        authorAvatar: p.authorAvatar || p.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        commune: p.commune || p.location || "Abidjan",
        content: p.content || p.caption || p.text || "Publication vidéo sur le Fil Réel d'AFRIGOMBO.",
        mediaUrl: url,
        musicTrack: p.title || p.musicTrack || "Son original AFRIGOMBO",
        hashtags: Array.isArray(p.hashtags) ? p.hashtags : ["#Afrigombo", "#FilReel", "#ArtisteIvoirien"],
        appliedFilter: p.appliedFilter || "naturel",
        likesCount: realLikes,
        commentsCount: realComments,
        comments: Array.isArray(p.comments) ? p.comments : [],
        isLiked: Boolean(isLiked),
        userId: p.userId || p.authorId,
        source: "post"
      });
    });

    // 4. Apply dynamic ranking algorithm (Engagement + Recency + Affinity + Discovery)
    const ranked = rankReels(list, { 
      currentUserId: effectiveUser?.uid, 
      followedUsers, 
      seenReelIds: seenReels, 
      sessionTimestamp 
    });

    // If initialReelId is specified, bring the exact selected reel to index 0 so it opens and plays immediately
    if (initialReelId) {
      const idx = ranked.findIndex(r => r.id === initialReelId || (r as any).mediaUrl === initialReelId);
      if (idx > 0) {
        const target = ranked[idx];
        const rest = ranked.filter((_, i) => i !== idx);
        return [target, ...rest];
      }
    }
    return ranked;
  }, [posts, users, profile, effectiveUser, followedUsers, initialReelId]);

  const [localReels, setLocalReels] = useState<ReelItem[]>(reelsList);

  useEffect(() => {
    setLocalReels(reelsList);
    setCurrentIndex(0);
  }, [reelsList]);

  // Deterministic Navigation Functions: STRICTLY 1 GESTE = 1 REEL
  const goToNextReel = () => {
    if (isTransitioningRef.current) return;
    if (currentIndex < localReels.length - 1) {
      isTransitioningRef.current = true;
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const viewedReel = localReels[nextIdx];
      if (viewedReel && viewedReel.id) {
        setSeenReels(prev => {
          if (prev.has(viewedReel.id)) return prev;
          const next = new Set(prev);
          next.add(viewedReel.id);
          try {
            sessionStorage.setItem("afrigombo_seen_reels", JSON.stringify(Array.from(next)));
          } catch (_) {}
          return next;
        });
      }
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 380); // Transition lock matches CSS animation
    }
  };

  const goToPrevReel = () => {
    if (isTransitioningRef.current) return;
    if (currentIndex > 0) {
      isTransitioningRef.current = true;
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 380);
    }
  };

  // Touch gesture listener: Exactly 1 gesture = 1 change of Reel (Android first)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isTransitioningRef.current || isSpeedHoldActive) return;
    if (e.touches.length > 0) {
      touchStartYRef.current = e.touches[0].clientY;
      touchStartXRef.current = e.touches[0].clientX;
      isSwipingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isSpeedHoldActive) return;
    // No continuous index change during touchmove
    if (!isSwipingRef.current || isTransitioningRef.current) return;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isSpeedHoldActive) return;
    if (!isSwipingRef.current || isTransitioningRef.current) {
      isSwipingRef.current = false;
      return;
    }
    isSwipingRef.current = false;

    if (e.changedTouches.length > 0) {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      const deltaY = touchStartYRef.current - touchEndY;
      const deltaX = Math.abs(touchStartXRef.current - touchEndX);

      // Minimum swipe distance threshold (45px) and vertical angle check
      if (Math.abs(deltaY) > 45 && Math.abs(deltaY) > deltaX) {
        if (deltaY > 0) {
          // Swipe up -> Next Reel (+1 strictly)
          goToNextReel();
        } else {
          // Swipe down -> Prev Reel (-1 strictly)
          goToPrevReel();
        }
      }
    }
  };

  // Desktop wheel navigation (strictly 1 tick = 1 Reel)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isTransitioningRef.current) return;
    if (Math.abs(e.deltaY) > 30) {
      if (e.deltaY > 0) {
        goToNextReel();
      } else {
        goToPrevReel();
      }
    }
  };

  // Play active video & pause all non-active videos when index changes
  useEffect(() => {
    const currentReel = localReels[currentIndex];

    // Reset speed hold states on scroll / index change
    if (speedHoldTimeoutRef.current) {
      clearTimeout(speedHoldTimeoutRef.current);
      speedHoldTimeoutRef.current = null;
    }
    setIsSpeedHoldActive(false);
    longPressedRef.current = false;

    // Pause and clean up all non-active videos immediately
    videoElementsRef.current.forEach((videoEl, reelId) => {
      if (!currentReel || reelId !== currentReel.id) {
        try {
          videoEl.pause();
          videoEl.currentTime = 0;
          videoEl.playbackRate = 1.0;
        } catch (_) {}
      }
    });

    if (activeVideoRef.current && currentReel) {
      const activeEl = activeVideoRef.current;
      const isSameReel = lastPlayedReelIdRef.current === currentReel.id;

      if (!isSameReel) {
        activeEl.currentTime = 0;
        activeEl.playbackRate = 1.0;
        lastPlayedReelIdRef.current = currentReel.id;

        // Determine initial mute state: use explicit user choice if any, otherwise default to unmuted (false)
        const targetMuted = userClickedMute.current !== null ? userClickedMute.current : false;
        
        setIsMuted(targetMuted);
        syncVideoAudio(activeEl, targetMuted);

        // Trigger video.load() if not yet started
        try {
          if (activeEl.src !== currentReel.mediaUrl) {
            activeEl.src = currentReel.mediaUrl;
            activeEl.load();
          }
        } catch (_) {}

        const playPromise = activeEl.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("[ReelsPlayer] Autoplay with sound prevented by browser policy, falling back to muted autoplay:", err);
            if (activeEl && !activeEl.muted && userClickedMute.current === null) {
              // Browser blocked unmuted autoplay: fall back to muted autoplay only until user interacts
              activeEl.muted = true;
              setIsMuted(true);
              activeEl.play().catch(() => {});
            }
          });
        }
      }
    }
  }, [currentIndex, localReels]);

  // Handle mute state change smoothly without resetting currentTime
  useEffect(() => {
    if (activeVideoRef.current) {
      syncVideoAudio(activeVideoRef.current, isMuted);
    }
  }, [isMuted]);

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
      setIsLoadingComments(false);
      return;
    }
    const reelId = showCommentsFor.id;
    setIsLoadingComments(true);

    // Initial comments from the reel object if present
    const existingPostComments: CommentItem[] = Array.isArray(showCommentsFor.comments) ? showCommentsFor.comments.map((c: any, idx: number) => ({
      id: c.id || `c_init_${idx}`,
      postId: reelId,
      userId: c.userId || c.authorId,
      author: c.author || c.authorName || c.userName || "Mélomane",
      avatar: c.avatar || c.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
      text: c.text || c.content || "",
      createdAt: c.createdAt || new Date().toISOString(),
      time: formatRelativeTime(c.createdAt)
    })) : [];

    setCommentsList(existingPostComments);

    if (!db) {
      setIsLoadingComments(false);
      return;
    }

    // Function to enrich comments with the latest profile name and avatar from Firestore users
    const enrichCommentsWithProfiles = async (rawComments: CommentItem[]) => {
      const enriched = await Promise.all(
        rawComments.map(async (comment) => {
          if (!comment.userId) return comment;
          if (authorProfilesCache.current[comment.userId]) {
            const cached = authorProfilesCache.current[comment.userId];
            return {
              ...comment,
              author: cached.author || comment.author,
              avatar: cached.avatar || comment.avatar
            };
          }
          try {
            const userSnap = await getDoc(doc(db, "users", comment.userId));
            if (userSnap.exists()) {
              const uData = userSnap.data();
              const authorName = uData.artisticName || uData.displayName || uData.name || (uData.firstName ? `${uData.firstName} ${uData.lastName || ''}`.trim() : comment.author);
              const avatarUrl = uData.photoURL || uData.photoUrl || uData.avatar || comment.avatar;
              authorProfilesCache.current[comment.userId] = {
                author: authorName,
                avatar: avatarUrl
              };
              return {
                ...comment,
                author: authorName,
                avatar: avatarUrl
              };
            }
          } catch (_) {}
          return comment;
        })
      );
      return enriched;
    };

    // Listen to subcollection /posts/{reelId}/comments
    try {
      const commentsColRef = collection(db, "posts", reelId, "comments");
      const unsub = onSnapshot(commentsColRef, async (snapshot) => {
        setIsLoadingComments(false);
        if (!snapshot.empty) {
          const list: CommentItem[] = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              postId: reelId,
              userId: data.userId || data.authorId,
              author: data.author || data.authorName || data.userName || "Mélomane",
              avatar: data.avatar || data.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
              text: data.text || data.content || "",
              createdAt: data.createdAt || new Date().toISOString(),
              time: formatRelativeTime(data.createdAt)
            };
          });

          const enrichedList = await enrichCommentsWithProfiles(list);
          setCommentsList(enrichedList);

          // Sync localReels comment counter
          setLocalReels(prev => prev.map(r => r.id === reelId ? { ...r, commentsCount: snapshot.docs.length } : r));
        } else if (existingPostComments.length === 0) {
          setCommentsList([]);
        }
      }, (err) => {
        console.warn("Could not listen to real-time comments subcollection:", err);
        setIsLoadingComments(false);
      });

      return () => unsub();
    } catch (err) {
      console.warn("Exception setting up comments listener:", err);
      setIsLoadingComments(false);
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

  // Long-press speed 2x pointer handlers
  const handleVideoPointerDown = (e: React.PointerEvent<HTMLDivElement>, reelId: string) => {
    // Only primary pointer (left mouse click or touch contact)
    if (e.button !== 0) return;

    // Only speed up if video is currently mounted and not errored
    if (!activeVideoRef.current || videoErrors[reelId]) {
      return;
    }

    if (speedHoldTimeoutRef.current) {
      clearTimeout(speedHoldTimeoutRef.current);
    }

    longPressedRef.current = false;

    // Start long-press timer (300ms for snappy response)
    speedHoldTimeoutRef.current = setTimeout(() => {
      if (activeVideoRef.current) {
        activeVideoRef.current.playbackRate = 2.0;
        setIsSpeedHoldActive(true);
        longPressedRef.current = true;
        try {
          if (navigator.vibrate) navigator.vibrate(20);
        } catch (_) {}
      }
    }, 300);
  };

  const handleVideoPointerUp = () => {
    if (speedHoldTimeoutRef.current) {
      clearTimeout(speedHoldTimeoutRef.current);
      speedHoldTimeoutRef.current = null;
    }

    if (isSpeedHoldActive) {
      if (activeVideoRef.current) {
        activeVideoRef.current.playbackRate = 1.0;
      }
      setIsSpeedHoldActive(false);
    }
  };

  const handleVideoPointerCancel = () => {
    handleVideoPointerUp();
  };

  const handleVideoPointerLeave = () => {
    handleVideoPointerUp();
  };

  // Tap / Double-tap handler on video area:
  // Single TAP: Toggle play/pause
  // Double TAP: Like reel + floating heart
  const handleVideoTouchOrClick = (e: React.MouseEvent | React.TouchEvent, reelId: string) => {
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    const now = Date.now();
    const lastTap = lastTapRef.current;
    
    if (lastTap.reelId === reelId && now - lastTap.time < 300) {
      // Double tap detected!
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
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
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
      singleTapTimeoutRef.current = setTimeout(() => {
        singleTapTimeoutRef.current = null;
        // Single tap action: toggle play / pause on active video
        if (activeVideoRef.current) {
          if (activeVideoRef.current.paused) {
            activeVideoRef.current.play().catch(() => {});
            setPlayPauseNotice({ type: "play", reelId });
          } else {
            activeVideoRef.current.pause();
            setPlayPauseNotice({ type: "pause", reelId });
          }
          setTimeout(() => setPlayPauseNotice(null), 700);
        }
      }, 280);
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
          title: reel.title || "Fil Réel AFRIGOMBO",
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

  // Masquer cette publication
  const handleHideReel = (reelId: string) => {
    setLocalReels(prev => {
      const filtered = prev.filter(r => r.id !== reelId);
      if (filtered.length > 0 && currentIndex >= filtered.length) {
        setCurrentIndex(filtered.length - 1);
      }
      return filtered;
    });
    setShowMoreFor(null);
    showToast("Publication masquée de votre fil.");
  };

  // Bloquer cet artiste / utilisateur
  const handleBlockArtist = (targetUserId?: string, targetName?: string) => {
    if (!targetUserId) {
      showToast("Impossible d'identifier cet utilisateur.");
      setShowMoreFor(null);
      return;
    }
    requireAuth(async () => {
      // Remove all reels from this user immediately
      setLocalReels(prev => {
        const filtered = prev.filter(r => r.userId !== targetUserId);
        if (filtered.length > 0 && currentIndex >= filtered.length) {
          setCurrentIndex(filtered.length - 1);
        }
        return filtered;
      });

      // Persist block in Firestore
      if (db && currentUser?.uid) {
        try {
          await addDoc(collection(db, "blocks"), {
            blockerId: currentUser.uid,
            blockedUserId: targetUserId,
            blockedUserName: targetName || "Artiste",
            createdAt: new Date().toISOString()
          });
          await updateDoc(doc(db, "users", currentUser.uid), {
            blockedUsers: arrayUnion(targetUserId)
          }).catch(() => {});
        } catch (err) {
          console.warn("Could not save block in Firestore:", err);
        }
      }
      setShowMoreFor(null);
      showToast(`Artiste bloqué. Ses publications n'apparaîtront plus.`);
    });
  };

  // Copier le lien du Réel
  const handleCopyReelLink = (reel: ReelItem) => {
    const url = window.location.origin + window.location.pathname + `?reelId=${reel.id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => showToast("🔗 Lien du Réel copié dans le presse-papier !"))
        .catch(() => showToast("🔗 Lien copié !"));
    } else {
      showToast("🔗 Lien copié !");
    }
    setShowMoreFor(null);
  };

  return (
    <div className="immersive-dark fixed inset-0 z-[100] bg-black text-white font-sans overflow-hidden flex flex-col h-[100dvh] w-screen">
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
          className="p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 active:scale-95 transition cursor-pointer"
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
            onClick={(e) => {
              e.stopPropagation();
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              userClickedMute.current = nextMuted; // persist explicit user choice
              if (activeVideoRef.current) {
                syncVideoAudio(activeVideoRef.current, nextMuted);
                if (!nextMuted) {
                  activeVideoRef.current.play().catch((err) => {
                    console.warn("[ReelsPlayer] Error playing unmuted audio:", err);
                  });
                }
              }
            }}
            className="p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 active:scale-95 transition cursor-pointer"
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

      {/* DETERMINISTIC VERTICAL STREAM WITH TRANSLATE-Y */}
      <div 
        ref={containerRef}
        className="w-full h-full overflow-hidden bg-black select-none touch-none"
        style={{ touchAction: "none" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {localReels.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-black text-white">
            <div className="w-20 h-20 rounded-3xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mb-4 shadow-2xl">
              <Film className="w-10 h-10 text-[#D4AF37]" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] font-black uppercase bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20 mb-3">
              FIL RÉEL AFRIGOMBO
            </span>
            <h3 className="text-lg font-black text-white uppercase tracking-wide">
              Aucun Réel vidéo disponible
            </h3>
            <p className="text-xs text-zinc-400 mt-2 max-w-sm leading-relaxed">
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
                className="px-5 py-2.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition cursor-pointer"
              >
                Retour au Terrain
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="w-full h-full transition-transform duration-[380ms] ease-out flex flex-col"
            style={{
              transform: `translateY(-${currentIndex * 100}%)`,
              willChange: "transform"
            }}
          >
            {localReels.map((reel, index) => {
              const isActive = index === currentIndex;
              // Mount at minimum [currentIndex - 1, currentIndex, currentIndex + 1] to avoid black screens and preload next
              const shouldMountMedia = Math.abs(index - currentIndex) <= 1;
              const isFollowing = reel.userId ? followedUsers.includes(reel.userId) : false;
              const isExpanded = Boolean(expandedDescriptions[reel.id]);

              return (
                <div 
                  key={reel.id} 
                  className="relative w-full h-[100dvh] bg-black flex justify-center items-center overflow-hidden shrink-0"
                >
                  {/* VIDEO PLAYER LAYER */}
                  {shouldMountMedia ? (
                    <div 
                      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden"
                      onClick={(e) => handleVideoTouchOrClick(e, reel.id)}
                      onPointerDown={(e) => handleVideoPointerDown(e, reel.id)}
                      onPointerUp={handleVideoPointerUp}
                      onPointerCancel={handleVideoPointerCancel}
                      onPointerLeave={handleVideoPointerLeave}
                    >
                      {getYoutubeId(reel.mediaUrl) ? (
                        <iframe
                          ref={(el) => {
                            if (el) {
                              allCreatedIframes.current.add(el);
                              iframeElementsRef.current.set(reel.id, el);
                            } else {
                              const existingIframe = iframeElementsRef.current.get(reel.id);
                              if (existingIframe && !document.contains(existingIframe)) {
                                try {
                                  existingIframe.src = "about:blank";
                                } catch (_) {}
                                allCreatedIframes.current.delete(existingIframe);
                              }
                              iframeElementsRef.current.delete(reel.id);
                            }
                          }}
                          src={`https://www.youtube.com/embed/${getYoutubeId(reel.mediaUrl)}?autoplay=${isActive ? 1 : 0}&mute=${isMuted ? 1 : 0}&loop=1&playlist=${getYoutubeId(reel.mediaUrl)}&playsinline=1&controls=0&rel=0&modestbranding=1`}
                          title={reel.title || "Vidéo Réel"}
                          className="w-full h-full object-cover pointer-events-auto bg-black"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          ref={(el) => {
                            if (el) {
                              videoElementsRef.current.set(reel.id, el);
                              allCreatedVideos.current.add(el);
                              if (isActive) {
                                activeVideoRef.current = el;
                              }
                            } else {
                              const existingVideo = videoElementsRef.current.get(reel.id);
                              if (existingVideo && !document.contains(existingVideo)) {
                                try {
                                  existingVideo.pause();
                                  existingVideo.muted = true;
                                  existingVideo.removeAttribute("src");
                                  existingVideo.load();
                                } catch (_) {}
                                allCreatedVideos.current.delete(existingVideo);
                              }
                              videoElementsRef.current.delete(reel.id);
                              if (activeVideoRef.current === existingVideo) {
                                activeVideoRef.current = null;
                              }
                            }
                          }}
                          src={reel.mediaUrl}
                          autoPlay={isActive}
                          preload={isActive ? "auto" : "metadata"}
                          style={{ filter: getFilterCss(reel.appliedFilter) }}
                          className="w-full h-full object-cover cursor-pointer bg-black"
                          loop
                          muted={isMuted}
                          playsInline
                          // @ts-ignore
                          webkit-playsinline="true"
                          x-webkit-airplay="allow"
                          onLoadedMetadata={() => {
                            setVideoErrors(prev => {
                              if (!prev[reel.id]) return prev;
                              const next = { ...prev };
                              delete next[reel.id];
                              return next;
                            });
                          }}
                          onCanPlay={() => {
                            setVideoErrors(prev => {
                              if (!prev[reel.id]) return prev;
                              const next = { ...prev };
                              delete next[reel.id];
                              return next;
                            });
                          }}
                          onPlaying={() => {
                            setVideoErrors(prev => {
                              if (!prev[reel.id]) return prev;
                              const next = { ...prev };
                              delete next[reel.id];
                              return next;
                            });
                          }}
                          onTimeUpdate={() => {
                            setVideoErrors(prev => {
                              if (!prev[reel.id]) return prev;
                              const next = { ...prev };
                              delete next[reel.id];
                              return next;
                            });
                          }}
                          onLoadedData={() => {
                            setVideoErrors(prev => {
                              if (!prev[reel.id]) return prev;
                              const next = { ...prev };
                              delete next[reel.id];
                              return next;
                            });
                          }}
                          onError={(e) => {
                            const videoEl = e.currentTarget;
                            // Ignore abort errors (error code 1 = MEDIA_ERR_ABORTED) caused by scroll/unmount
                            if (videoEl.error && videoEl.error.code === 1) {
                              return;
                            }
                            // If video is actually already playing or has loaded frames, do not trigger error
                            if (videoEl.readyState >= 2 || (!videoEl.paused && videoEl.currentTime > 0)) {
                              return;
                            }
                            console.warn(`[ReelsPlayer] Erreur média vidéo (id: ${reel.id}):`, e);
                            setVideoErrors(prev => ({ ...prev, [reel.id]: true }));
                          }}
                        />
                      )}

                      {/* Vitesse x2 hold indicator overlay */}
                      {isSpeedHoldActive && isActive && (
                        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-black/70 border border-[#D4AF37]/50 backdrop-blur-md text-[10px] sm:text-xs font-mono font-black text-[#D4AF37] px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-2xl select-none animate-pulse">
                          <Play className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37] animate-bounce" />
                          <span className="tracking-widest">VITESSE ×2.0</span>
                        </div>
                      )}

                      {/* Double-tap animated heart overlay */}
                      {doubleTapHeart && doubleTapHeart.reelId === reel.id && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50 animate-ping">
                          <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]" />
                        </div>
                      )}

                      {/* Single-tap animated Play/Pause overlay */}
                      {playPauseNotice && playPauseNotice.reelId === reel.id && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50 animate-fade-in">
                          <div className="p-4 rounded-full bg-black/75 border border-white/20 backdrop-blur-md text-white shadow-2xl scale-110">
                            {playPauseNotice.type === "pause" ? (
                              <Pause className="w-10 h-10 fill-white text-white" />
                            ) : (
                              <Play className="w-10 h-10 fill-white text-white ml-1" />
                            )}
                          </div>
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
                                  goToNextReel();
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

              {/* GRADIENT OVERLAYS FOR CONTRAST (Sanctuarisé avec style inline contre tout écrasement CSS de thème) */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.15) 50%, rgba(0, 0, 0, 0.4) 100%)",
                  backgroundColor: "transparent",
                  backdropFilter: "none",
                  WebkitBackdropFilter: "none"
                }}
              />

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
                  <span className="truncate max-w-[200px]">{reel.musicTrack || "Son original AFRIGOMBO"}</span>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}
      </div>

      {/* ========================================================================= */}
      {/* 💬 PALABRES / COMMENTS ULTRA-PREMIUM BOTTOM SHEET */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showCommentsFor && (
          <div 
            className="fixed inset-0 z-[120] flex flex-col justify-end select-none overflow-hidden"
            style={{ width: "100vw", height: "100dvh" }}
          >
            {/* Backdrop Overlay with fade animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowCommentsFor(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer z-0"
            />

            {/* Bottom Sheet Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.15}
               onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 300) {
                  setShowCommentsFor(null);
                }
              }}
              className={`reels-popup-panel relative w-full max-w-xl mx-auto ${
                isLight 
                  ? "bg-[#FAF9F5] text-zinc-900 border-t-2 border-[#D4AF37] border-x border-zinc-200/80 shadow-2xl" 
                  : "bg-[#0D0D0D] text-white border-t-2 border-[#D4AF37] border-x border-[#D4AF37]/30 shadow-[0_-16px_48px_rgba(0,0,0,0.95)]"
              } rounded-t-[30px] sm:rounded-t-[36px] flex flex-col z-10 max-h-[85vh] text-left`}
              style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle Indicator */}
              <div className="pt-3 pb-1 flex justify-center items-center shrink-0 cursor-grab active:cursor-grabbing w-full touch-none select-none">
                <div className={`w-12 h-1.5 ${isLight ? "bg-zinc-300 hover:bg-zinc-400" : "bg-zinc-600/80 hover:bg-zinc-500"} rounded-full transition-colors`} />
              </div>

              {/* Bottom Sheet Header */}
              <div className={`px-5 py-3 border-b ${isLight ? "border-zinc-200/60 bg-[#FCFAF7]/40" : "border-zinc-800"} flex items-center justify-between shrink-0`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0 shadow-sm">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-xs sm:text-sm font-black uppercase ${isLight ? "text-zinc-900" : "text-white"} tracking-wider truncate`}>
                        Arbre à Palabres
                      </h3>
                      <span className="text-[10px] font-mono font-black bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 px-2 py-0.5 rounded-full shrink-0">
                        {commentsList.length}
                      </span>
                    </div>
                    <p className={`text-[10px] ${isLight ? "text-zinc-600 font-medium" : "text-zinc-400"} truncate`}>
                      {showCommentsFor.authorArtisticName || showCommentsFor.authorName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {commentsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCommentsSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${
                        isLight 
                          ? "bg-white border-zinc-200 text-zinc-700 hover:text-amber-700 hover:border-[#D4AF37]/50 shadow-sm" 
                          : "bg-zinc-800/80 border-zinc-700/80 text-zinc-300 hover:text-[#D4AF37] hover:border-[#D4AF37]/40"
                      } text-[10px] font-mono font-bold transition cursor-pointer border`}
                      title="Changer l'ordre de tri"
                    >
                      <ArrowUpDown className="w-3 h-3 text-[#D4AF37]" />
                      <span>{commentsSortOrder === "asc" ? "Anciens" : "Récents"}</span>
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => setShowCommentsFor(null)}
                    className={`p-1.5 rounded-full ${
                      isLight 
                        ? "bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-zinc-200" 
                        : "bg-zinc-800/90 text-zinc-400 hover:text-white hover:bg-zinc-700 border-zinc-700/50"
                    } transition cursor-pointer border shadow-sm`}
                    title="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Comments List */}
              <div 
                className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-[180px] max-h-[52vh] overscroll-contain [-webkit-overflow-scrolling:touch]" 
                style={{ touchAction: "pan-y" }}
              >
                {isLoadingComments && commentsList.length === 0 ? (
                  <div className={`py-12 flex flex-col items-center justify-center gap-2.5 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                    <Loader2 className="w-7 h-7 animate-spin text-[#D4AF37]" />
                    <p className={`text-xs font-mono font-medium ${isLight ? "text-zinc-800" : "text-zinc-400"}`}>Chargement des palabres...</p>
                  </div>
                ) : commentsList.length === 0 ? (
                  <div className={`py-12 text-center ${isLight ? "text-zinc-600" : "text-zinc-400"} space-y-2`}>
                    <div className={`w-12 h-12 rounded-full ${isLight ? "bg-white border-zinc-200/80" : "bg-zinc-800/60 border-zinc-700/50"} flex items-center justify-center mx-auto text-zinc-500 shadow-sm border`}>
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <p className={`text-xs font-bold ${isLight ? "text-zinc-800" : "text-zinc-200"}`}>Aucun palabre pour l'instant</p>
                    <p className={`text-[11px] ${isLight ? "text-zinc-650" : "text-zinc-400"}`}>Soyez le premier à commenter ce Réel !</p>
                  </div>
                ) : (
                  [...commentsList]
                    .sort((a, b) => {
                      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                      return commentsSortOrder === "desc" ? timeB - timeA : timeA - timeB;
                    })
                    .map(c => (
                      <div 
                        key={c.id} 
                        className={`flex gap-3 items-start ${isLight ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-900/80 border-zinc-800"} p-3 rounded-2xl border hover:border-[#D4AF37]/30 transition group`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (c.userId) {
                              openPublicProfile(c.userId);
                            }
                          }}
                          className="shrink-0 group/av cursor-pointer relative"
                          title={c.userId ? "Voir le profil" : undefined}
                        >
                          <img 
                            src={c.avatar} 
                            alt="" 
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
                            }}
                            className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]/30 group-hover/av:border-[#D4AF37] transition shadow" 
                          />
                        </button>
                        <div className="flex-1 text-left space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (c.userId) {
                                  openPublicProfile(c.userId);
                                }
                              }}
                              className="text-[11px] font-black text-[#D4AF37] uppercase tracking-wide truncate hover:underline text-left cursor-pointer"
                            >
                              {c.author}
                            </button>
                            <span className="text-[9px] font-mono text-zinc-500 shrink-0">{c.time}</span>
                          </div>
                           <p className={`text-xs ${isLight ? "text-zinc-800" : "text-zinc-200"} leading-relaxed break-words font-normal`}>{c.text}</p>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Bottom Comment Composer */}
              <div className={`p-3.5 border-t ${isLight ? "border-zinc-200 bg-[#FAF9F5]" : "border-zinc-800 bg-[#0A0A0A]"} shrink-0`}>
                <form onSubmit={handleAddComment} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Partager votre palabre..."
                    className={`flex-1 ${
                      isLight 
                        ? "bg-white border-zinc-300 text-zinc-900 placeholder-zinc-500 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 shadow-sm" 
                        : "bg-zinc-900/90 border-zinc-700/80 text-white placeholder-zinc-500 focus:border-[#D4AF37] focus:ring-[#D4AF37]/40"
                    } border rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 transition`}
                  />
                  <button 
                    type="submit"
                    disabled={!commentInput.trim()}
                    className="bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-black px-4 py-2.5 rounded-2xl text-xs hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md"
                  >
                    <span>Envoyer</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* ⋮ PLUS / MORE OPTIONS ULTRA-PREMIUM BOTTOM SHEET */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showMoreFor && (
          <div 
            className="fixed inset-0 z-[120] flex flex-col justify-end select-none overflow-hidden"
            style={{ width: "100vw", height: "100dvh" }}
          >
            {/* Backdrop Overlay with fade animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowMoreFor(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer z-0"
            />

            {/* Bottom Sheet Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 300) {
                  setShowMoreFor(null);
                }
              }}
              className={`reels-popup-panel relative w-full max-w-xl mx-auto ${
                isLight 
                  ? "bg-[#FAF9F5] text-zinc-900 border-t-2 border-[#D4AF37] border-x border-zinc-200/80 shadow-2xl" 
                  : "bg-[#0D0D0D] text-white border-t-2 border-[#D4AF37] border-x border-[#D4AF37]/30 shadow-[0_-16px_48px_rgba(0,0,0,0.95)]"
              } rounded-t-[30px] sm:rounded-t-[36px] flex flex-col z-10 max-h-[85vh] text-left`}
              style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle Indicator */}
              <div className="pt-3 pb-1 flex justify-center items-center shrink-0 cursor-grab active:cursor-grabbing w-full touch-none select-none">
                <div className={`w-12 h-1.5 ${isLight ? "bg-zinc-300 hover:bg-zinc-400" : "bg-zinc-600/80 hover:bg-zinc-500"} rounded-full transition-colors`} />
              </div>

              {/* Header */}
              <div className={`px-5 py-3 border-b ${isLight ? "border-zinc-200/60 bg-[#FCFAF7]/40" : "border-zinc-800"} flex items-center justify-between shrink-0`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0 shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-xs sm:text-sm font-black uppercase ${isLight ? "text-zinc-900" : "text-white"} tracking-wider truncate`}>
                      Options du Réel
                    </h3>
                    <p className={`text-[10px] ${isLight ? "text-zinc-650 font-medium" : "text-zinc-400"} truncate`}>
                      Par <span className="text-[#D4AF37] font-semibold">{showMoreFor.authorArtisticName || showMoreFor.authorName}</span>
                    </p>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setShowMoreFor(null)} 
                  className={`p-1.5 rounded-full ${
                    isLight 
                      ? "bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-zinc-200" 
                      : "bg-zinc-800/90 text-zinc-400 hover:text-white hover:bg-zinc-700 border-zinc-700/50"
                  } transition cursor-pointer border shadow-sm`}
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons List */}
              <div className="p-4 space-y-2.5 overflow-y-auto max-h-[60vh]">
                {/* 1. Copier le lien */}
                <button 
                  type="button"
                  onClick={() => handleCopyReelLink(showMoreFor)}
                  className={`w-full flex items-center gap-3.5 p-3.5 ${isLight ? "bg-white hover:bg-zinc-50/80 border-zinc-200 shadow-sm" : "bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800"} border hover:border-[#D4AF37]/40 rounded-2xl text-left transition active:scale-[0.99] cursor-pointer group`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0 group-hover:scale-105 transition-transform">
                    <Copy className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold ${isLight ? "text-zinc-800 group-hover:text-zinc-950" : "text-white group-hover:text-[#D4AF37]"} transition-colors`}>
                      Copier le lien direct
                    </div>
                    <div className={`text-[10px] ${isLight ? "text-zinc-600 font-medium" : "text-zinc-400"}`}>
                      Partager le lien de cette création sur vos réseaux
                    </div>
                  </div>
                </button>

                {/* 2. Partager / Diffuser */}
                <button 
                  type="button"
                  onClick={() => {
                    setShowMoreFor(null);
                    handleShare(showMoreFor);
                  }}
                  className={`w-full flex items-center gap-3.5 p-3.5 ${isLight ? "bg-white hover:bg-zinc-50/80 border-zinc-200 shadow-sm" : "bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800"} border hover:border-sky-500/40 rounded-2xl text-left transition active:scale-[0.99] cursor-pointer group`}
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-450 shrink-0 group-hover:scale-105 transition-transform">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold ${isLight ? "text-zinc-800 group-hover:text-sky-600" : "text-white group-hover:text-sky-400"} transition-colors`}>
                      Partager & Diffuser
                    </div>
                    <div className={`text-[10px] ${isLight ? "text-zinc-600 font-medium" : "text-zinc-400"}`}>
                      Envoyer sur WhatsApp, messages ou réseaux
                    </div>
                  </div>
                </button>

                {/* 3. Masquer cette publication */}
                <button 
                  type="button"
                  onClick={() => handleHideReel(showMoreFor.id)}
                  className={`w-full flex items-center gap-3.5 p-3.5 ${isLight ? "bg-white hover:bg-zinc-50/80 border-zinc-200 shadow-sm" : "bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800"} border hover:border-zinc-500 rounded-2xl text-left transition active:scale-[0.99] cursor-pointer group`}
                >
                  <div className={`w-10 h-10 rounded-xl ${isLight ? "bg-zinc-100 border-zinc-200 text-zinc-500" : "bg-zinc-800 border-zinc-700/80 text-zinc-400"} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border`}>
                    <EyeOff className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold ${isLight ? "text-zinc-800 group-hover:text-zinc-950" : "text-zinc-200 group-hover:text-white"} transition-colors`}>
                      Masquer cette publication
                    </div>
                    <div className={`text-[10px] ${isLight ? "text-zinc-600 font-medium" : "text-zinc-400"}`}>
                      Ne plus afficher ce Réel dans votre fil
                    </div>
                  </div>
                </button>

                 {/* 4. Bloquer cet artiste */}
                {showMoreFor.userId && showMoreFor.userId !== currentUser?.uid && (
                  <button 
                    type="button"
                    onClick={() => handleBlockArtist(showMoreFor.userId, showMoreFor.authorArtisticName || showMoreFor.authorName)}
                    className={`w-full flex items-center gap-3.5 p-3.5 ${isLight ? "bg-white hover:bg-zinc-50/80 border-zinc-200 shadow-sm" : "bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800"} border hover:border-amber-500/40 rounded-2xl text-left transition active:scale-[0.99] cursor-pointer group`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-105 transition-transform">
                      <UserX className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold ${isLight ? "text-amber-700 group-hover:text-amber-800" : "text-amber-500"} transition-colors`}>
                        Bloquer cet artiste
                      </div>
                      <div className={`text-[10px] ${isLight ? "text-zinc-600 font-medium" : "text-zinc-400"}`}>
                        Masquer toutes les créations de {showMoreFor.authorArtisticName || showMoreFor.authorName || "cet artiste"}
                      </div>
                    </div>
                  </button>
                )}

                {/* 5. Signaler cette publication */}
                <button 
                  type="button"
                  onClick={() => handleReportReel(showMoreFor)}
                  className={`w-full flex items-center gap-3.5 p-3.5 ${isLight ? "bg-[#FFF5F5] hover:bg-[#FFEAEA] border-red-200" : "bg-red-500/10 hover:bg-red-500/15 border-red-500/25"} border hover:border-red-500/40 rounded-2xl text-left transition active:scale-[0.99] cursor-pointer group`}
                >
                  <div className={`w-10 h-10 rounded-xl ${isLight ? "bg-red-100 border-red-200 text-red-600" : "bg-red-500/20 border-red-500/30 text-red-400"} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <Flag className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold ${isLight ? "text-red-700 group-hover:text-red-800" : "text-red-500"} transition-colors`}>
                      Signaler cette publication
                    </div>
                    <div className={`text-[10px] ${isLight ? "text-red-650" : "text-red-400/80"}`}>
                      Alerter l'équipe de modération pour contenu inapproprié
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
