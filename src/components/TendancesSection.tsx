import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, Music, Zap, Calendar, 
  ChevronRight, Info
} from "lucide-react";
import { Gombo, Post, User } from "../types";
import { 
  TendancesItem, 
  TendancesCategoryTab, 
  filterAndRankTendances, 
  calculateAfrigomboScore,
  isInteractionAllowed,
  recordUniqueViewInSession,
  recordTrendingInteraction,
  isTendancesEligible
} from "../lib/tendancesEngine";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

import { getGomboRef } from "../lib/gomboIdHelper";
import { isGomboExpired } from "../lib/gomboDateUtils";

interface TendancesSectionProps {
  gombos: Gombo[];
  posts?: Post[];
  users?: User[];
  currentUserProfile?: User | null;
  onSelectGomboDetails?: (gombo: Gombo) => void;
  audioSynth?: any;
  requireAuthThen?: (fn: () => void) => void;
}

const extractCommuneString = (val: any): string => {
  if (!val) return "Abidjan";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    return val.commune || val.city || val.address || "Abidjan";
  }
  return "Abidjan";
};

export const TendancesSection: React.FC<TendancesSectionProps> = ({
  gombos = [],
  posts = [],
  users = [],
  currentUserProfile,
  onSelectGomboDetails,
  audioSynth,
  requireAuthThen = (fn) => fn()
}) => {
  const [activeTab, setActiveTab] = useState<TendancesCategoryTab>("tendances");
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedScoreExplainer, setSelectedScoreExplainer] = useState<TendancesItem | null>(null);

  // Firestore Trending Realtime Listener (for pinned/sponsored admin curation)
  const [firestoreTrendingMap, setFirestoreTrendingMap] = useState<Record<string, any>>({});

  const userCommune = useMemo(() => {
    return extractCommuneString(currentUserProfile?.commune || currentUserProfile?.location);
  }, [currentUserProfile]);

  // Track local optimistic interactions
  const [localInteractions, setLocalInteractions] = useState<Record<string, {
    likesCount: number;
    hasLiked: boolean;
    candidaturesCount: number;
    viewsCount: number;
    discussionsCount: number;
    sharesCount: number;
    hasShared: boolean;
    favoritesCount: number;
    hasFavorited: boolean;
  }>>({});

  // Listen to Firestore `trending` collection
  useEffect(() => {
    try {
      const q = query(collection(db, "trending"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const map: Record<string, any> = {};
        snapshot.forEach((docSnap) => {
          map[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
        });
        setFirestoreTrendingMap(map);
      }, (err) => {
        console.warn("Tendances: Firestore listener error (using fallback):", err);
      });

      return () => unsubscribe();
    } catch (_) {
      return () => {};
    }
  }, [currentUserProfile]);

  // Helper to trigger toast messages
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Map raw Gombos and Posts into standardized TendancesItems
  // STRICT RULES:
  // 1. NO artificial user profile injection (users are NOT trending posts)
  // 2. Gombos remain type="gombo" and preserve their official Réf du Gombo
  // 3. Inactive, expired, deleted, or future-scheduled contents are filtered out
  const allTendancesItems: TendancesItem[] = useMemo(() => {
    const items: TendancesItem[] = [];
    const processedIds = new Set<string>();
    const now = Date.now();

    // 1. Map Eligible Gombos
    gombos.forEach(g => {
      if (!g) return;

      // Filter out deleted, hidden, or non-active Gombos
      if (g.visible === false || g.isDeleted === true || (g as any).isArchived === true) return;
      const status = String(g.status || g.statut || "").toLowerCase();
      if (
        status === "completed" || 
        status === "cancelled" || 
        status === "expired" || 
        status === "termine" || 
        status === "annule" || 
        status === "deleted"
      ) {
        return;
      }

      // Expiration checks
      if (isGomboExpired(g)) return;
      if (g.expiresAt && new Date(g.expiresAt).getTime() < now) return;
      if (g.expiresAtTimestamp && Number(g.expiresAtTimestamp) < now) return;
      if (g.deadline && new Date(g.deadline).getTime() < now) return;

      // Scheduled publication check
      if (g.scheduledAt && new Date(g.scheduledAt).getTime() > now) return;

      // Sanity check: must have title
      if (!g.title || g.title.trim().length === 0) return;

      const gomboId = g.id || `gombo_${Math.random()}`;
      const gomboRef = getGomboRef(g);
      if (processedIds.has(gomboId) || (gomboRef && processedIds.has(gomboRef))) return;
      processedIds.add(gomboId);
      if (gomboRef) processedIds.add(gomboRef);

      const local = localInteractions[gomboId];
      const firestoreDoc = firestoreTrendingMap[gomboId];

      const author = users.find(u => u.id === g.userId || u.uid === g.userId || u.id === g.clientId);
      const isVerified = author?.isCertified || author?.isVerified || false;
      const isPremium = author?.isPremium || g.isBoosted || false;

      // Category detection
      let category: TendancesItem["category"] = "general";
      const titleLower = (g.title || "").toLowerCase();
      const descLower = (g.description || "").toLowerCase();

      if (g.urgent || gomboId.includes("urgent") || titleLower.includes("urgent") || titleLower.includes("renfort")) {
        category = "renfort";
      } else if (titleLower.includes("casting") || titleLower.includes("audition") || descLower.includes("casting")) {
        category = "castings";
      } else if (g.eventType || titleLower.includes("événement") || titleLower.includes("festival") || titleLower.includes("concert") || titleLower.includes("show")) {
        category = "evenements";
      } else if (titleLower.includes("marché") || titleLower.includes("matériel") || titleLower.includes("instrument") || titleLower.includes("sono") || titleLower.includes("vente")) {
        category = "marche" as any;
      } else if (titleLower.includes("académie") || titleLower.includes("formation") || titleLower.includes("masterclass") || titleLower.includes("cours")) {
        category = "academie" as any;
      } else if (titleLower.includes("musique") || titleLower.includes("studio") || titleLower.includes("orchestre") || titleLower.includes("beatmaker")) {
        category = "musique";
      }

      let createdAt = now - 3600000 * 4;
      if (g.createdAt) {
        createdAt = new Date(g.createdAt).getTime();
      } else if (g.timestamp) {
        createdAt = new Date(g.timestamp).getTime();
      }

      const likesCount = local?.likesCount ?? (firestoreDoc?.likesCount || g.likesCount || (g as any).likes || 0);
      const candidaturesCount = local?.candidaturesCount ?? (firestoreDoc?.candidaturesCount || g.applicantsCount || 0);
      const viewsCount = local?.viewsCount ?? (firestoreDoc?.viewsCount || (g as any).viewsCount || 0);
      const discussionsCount = local?.discussionsCount ?? (firestoreDoc?.discussionsCount || (g as any).commentsCount || 0);
      const sharesCount = local?.sharesCount ?? (firestoreDoc?.sharesCount || (g as any).sharesCount || 0);
      const favoritesCount = local?.favoritesCount ?? (firestoreDoc?.favoritesCount || (g as any).favoritesCount || 0);

      items.push({
        id: gomboId,
        type: "gombo",
        gomboRef: gomboRef || undefined,
        title: firestoreDoc?.title || g.title || "Gombo Musique Live",
        description: firestoreDoc?.description || g.description || "Opportunité artistique certifiée sur le Terrain.",
        category: (firestoreDoc?.category as any) || category,
        commune: extractCommuneString(firestoreDoc?.commune || g.commune || g.location),
        authorUid: g.userId || g.clientId,
        authorName: firestoreDoc?.authorName || g.clientName || g.organizerName || author?.artisticName || author?.displayName || "Organisateur AFRIGOMBO",
        authorAvatar: (author?.useAvatarAsProfile && author?.avatarDataUri) ? author.avatarDataUri : (firestoreDoc?.authorAvatar || g.organizerAvatar || author?.photoURL || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150"),
        isGomboIdVerified: isVerified,
        isPremium,
        budget: g.budget || 0,
        imageUrl: firestoreDoc?.imageUrl || g.mediaUrl || g.mediaURL || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        audioUrl: g.audioUrl,
        date: g.date || "Immédiat",
        createdAt,
        likesCount,
        candidaturesCount,
        viewsCount,
        discussionsCount,
        sharesCount,
        favoritesCount,
        reportsCount: (g as any).reportsCount || 0,
        mode: firestoreDoc?.mode || "auto",
        pinned: !!firestoreDoc?.pinned,
        sponsored: !!firestoreDoc?.sponsored,
        rawItem: g
      });
    });

    // 2. Map Eligible Posts (Publications & Réels)
    posts.forEach(p => {
      if (!p) return;

      // Filter out deleted, hidden, or flagged posts
      if (p.visible === false || p.isDeleted === true || p.isArchived === true) return;
      const status = String(p.status || "").toLowerCase();
      if (status === "deleted" || status === "archived" || status === "suspended" || status === "draft") return;
      if (p.isFlagged === true) return;

      // Expiration check
      if (p.expiresAt && new Date(p.expiresAt).getTime() < now) return;

      // Scheduled publication check
      if (p.scheduledAt && new Date(p.scheduledAt).getTime() > now) return;

      // Media validity check
      const hasMedia = !!(
        (p.mediaUrl && p.mediaUrl.trim().length > 5) ||
        (p.videoUrl && String(p.videoUrl).trim().length > 5) ||
        (p.imageUrl && String(p.imageUrl).trim().length > 5) ||
        (p.content && p.content.trim().length > 10)
      );
      if (!hasMedia) return;

      const postId = p.id || `post_${Math.random()}`;
      if (processedIds.has(postId)) return;
      processedIds.add(postId);

      const local = localInteractions[postId];
      const firestoreDoc = firestoreTrendingMap[postId];
      const author = users.find(u => u.id === p.userId || u.uid === p.userId);
      const isVerified = author?.isCertified || author?.isVerified || false;
      const isPremium = author?.isPremium || p.isBoosted || false;

      let createdAt = now - 3600000 * 8;
      if (p.timestamp) {
        createdAt = new Date(p.timestamp).getTime();
      }

      const likesCount = local?.likesCount ?? (firestoreDoc?.likesCount || p.likes || 0);
      const candidaturesCount = 0;
      const viewsCount = local?.viewsCount ?? (firestoreDoc?.viewsCount || 0);
      const discussionsCount = local?.discussionsCount ?? (firestoreDoc?.discussionsCount || p.comments || 0);
      const sharesCount = local?.sharesCount ?? (firestoreDoc?.sharesCount || 0);
      const favoritesCount = local?.favoritesCount ?? (firestoreDoc?.favoritesCount || 0);

      items.push({
        id: postId,
        type: "post",
        videoUrl: p.videoUrl,
        title: firestoreDoc?.title || (p.authorArtisticName || p.authorName ? `Publication de ${p.authorArtisticName || p.authorName}` : "Vibe Musicale en Tendance"),
        description: firestoreDoc?.description || p.content || "Vibe d'artiste sur le Terrain.",
        category: (firestoreDoc?.category as any) || "musique",
        commune: extractCommuneString(author?.commune || author?.location),
        authorUid: p.userId,
        authorName: firestoreDoc?.authorName || p.authorArtisticName || p.authorName || "Artiste Virtuose",
        authorAvatar: (author?.useAvatarAsProfile && author?.avatarDataUri) ? author.avatarDataUri : (firestoreDoc?.authorAvatar || p.authorAvatar || author?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"),
        isGomboIdVerified: isVerified,
        isPremium,
        imageUrl: firestoreDoc?.imageUrl || p.mediaUrl || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&auto=format&fit=crop&q=80",
        createdAt,
        likesCount,
        candidaturesCount,
        viewsCount,
        discussionsCount,
        sharesCount,
        favoritesCount,
        reportsCount: p.isFlagged ? 1 : 0,
        mode: firestoreDoc?.mode || "auto",
        pinned: !!firestoreDoc?.pinned,
        sponsored: !!firestoreDoc?.sponsored,
        rawItem: p
      });
    });

    // 3. Standalone Firestore Trending Docs (Admin curated)
    Object.keys(firestoreTrendingMap).forEach(docId => {
      if (!processedIds.has(docId)) {
        const doc = firestoreTrendingMap[docId];
        if (!doc || doc.visible === false || (doc as any).isDeleted === true || (doc as any).isArchived === true) return;
        if ((doc as any).expiresAt && new Date((doc as any).expiresAt).getTime() < now) return;
        processedIds.add(docId);

        items.push({
          id: docId,
          type: doc.type || "gombo",
          gomboRef: doc.type === "gombo" ? doc.gomboRef : undefined,
          title: doc.title || "Tendance Officielle Super Fondateur",
          description: doc.description || "Publication mise en avant au Centre des Tendances.",
          category: doc.category || "general",
          commune: extractCommuneString(doc.commune),
          authorUid: doc.authorUid || "super_admin",
          authorName: doc.authorName || "Super Fondateur",
          authorAvatar: doc.authorAvatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150",
          isGomboIdVerified: doc.isGomboIdVerified ?? true,
          isPremium: doc.isPremium ?? true,
          budget: doc.budget || 0,
          imageUrl: doc.imageUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600",
          createdAt: doc.createdAt ? new Date(doc.createdAt).getTime() : now,
          likesCount: doc.likesCount || 0,
          candidaturesCount: doc.candidaturesCount || 0,
          viewsCount: doc.viewsCount || 0,
          discussionsCount: doc.discussionsCount || 0,
          sharesCount: doc.sharesCount || 0,
          favoritesCount: doc.favoritesCount || 0,
          reportsCount: 0,
          mode: doc.mode || "manuel",
          pinned: !!doc.pinned,
          sponsored: !!doc.sponsored,
          rawItem: doc
        });
      }
    });

    return items;
  }, [gombos, posts, users, localInteractions, firestoreTrendingMap]);

  // Filtered and Ranked items for feed (uses official afrigomboScore with velocity and decay, max 5)
  const rankedItems = useMemo(() => {
    return filterAndRankTendances(allTendancesItems, activeTab, userCommune, searchTerm);
  }, [allTendancesItems, activeTab, userCommune, searchTerm]);

  // =========================================================================
  // 🎠 AUTOPLAY CAROUSEL MOTEUR (2s, Pause au Toucher/Glisser, Loop & Clean)
  // =========================================================================
  const carouselContainerRef = useRef<HTMLDivElement | null>(null);
  const isUserInteractingRef = useRef<boolean>(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to pause autoplay during user touch/drag and resume after inactivity
  const handleUserInteractionStart = () => {
    isUserInteractingRef.current = true;
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  };

  const handleUserInteractionEnd = () => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    // Resume autoplay after 3 seconds of touch release / inactivity
    resumeTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
      resumeTimeoutRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    // 1. Accessibility: check prefers-reduced-motion
    const prefersReducedMotion = typeof window !== "undefined" && 
      window.matchMedia && 
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      return;
    }

    // 2. Condition: Autoplay only if between 2 and 5 trends exist
    const itemsCount = rankedItems.length;
    if (itemsCount <= 1) {
      return;
    }

    // 3. Clear any existing timer
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }

    // 4. Setup 2s interval loop
    autoPlayIntervalRef.current = setInterval(() => {
      // Don't auto-scroll if user is touching/dragging or viewing modal
      if (isUserInteractingRef.current || selectedScoreExplainer) {
        return;
      }

      const container = carouselContainerRef.current;
      if (!container) return;

      const children = container.children;
      if (!children || children.length <= 1) return;

      const currentScrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

      // Find the next card offset
      let nextScrollLeft = 0;
      let foundNext = false;

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const childLeft = child.offsetLeft - container.offsetLeft;

        // Threshold of 15px to avoid floating-point / subpixel rounding traps
        if (childLeft > currentScrollLeft + 15) {
          nextScrollLeft = childLeft;
          foundNext = true;
          break;
        }
      }

      // Loop back smoothly to the first card if at the end
      if (!foundNext || currentScrollLeft >= maxScrollLeft - 20) {
        container.scrollTo({
          left: 0,
          behavior: "smooth"
        });
      } else {
        container.scrollTo({
          left: nextScrollLeft,
          behavior: "smooth"
        });
      }
    }, 2000);

    // 5. Total cleanup on unmount or when rankedItems changes
    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
        autoPlayIntervalRef.current = null;
      }
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
    };
  }, [rankedItems.length, selectedScoreExplainer]);

  // Record unique views on mount for top trending items
  useEffect(() => {
    rankedItems.forEach(item => {
      const isFirst = recordUniqueViewInSession(item.id);
      if (isFirst) {
        recordTrendingInteraction(item.id, "view");
        setLocalInteractions(prev => {
          const current = prev[item.id] || {
            likesCount: item.likesCount,
            hasLiked: false,
            candidaturesCount: item.candidaturesCount,
            viewsCount: item.viewsCount,
            discussionsCount: item.discussionsCount,
            sharesCount: item.sharesCount,
            hasShared: false,
            favoritesCount: item.favoritesCount,
            hasFavorited: false
          };
          return {
            ...prev,
            [item.id]: {
              ...current,
              viewsCount: current.viewsCount + 1
            }
          };
        });
      }
    });
  }, [rankedItems]);

  // Handle J'honore (Like) action
  const handleToggleLike = (item: TendancesItem) => {
    requireAuthThen(() => {
      const { allowed, reason } = isInteractionAllowed(
        currentUserProfile?.uid || currentUserProfile?.id,
        item.authorUid,
        "like"
      );

      if (!allowed) {
        showToast(`🛡️ ${reason}`);
        return;
      }

      recordTrendingInteraction(item.id, "jhonore");

      setLocalInteractions(prev => {
        const current = prev[item.id] || {
          likesCount: item.likesCount,
          hasLiked: false,
          candidaturesCount: item.candidaturesCount,
          viewsCount: item.viewsCount,
          discussionsCount: item.discussionsCount,
          sharesCount: item.sharesCount,
          hasShared: false,
          favoritesCount: item.favoritesCount,
          hasFavorited: false
        };

        const newHasLiked = !current.hasLiked;
        const newLikesCount = newHasLiked ? current.likesCount + 1 : Math.max(0, current.likesCount - 1);

        return {
          ...prev,
          [item.id]: {
            ...current,
            hasLiked: newHasLiked,
            likesCount: newLikesCount
          }
        };
      });

      showToast("👍 'J'honore' enregistré ! +12 pts au Score AFRIGOMBO");
    });
  };

  // Category Tabs Configuration
  const tabs: { id: TendancesCategoryTab; label: string; emoji: string }[] = [
    { id: "tendances", label: "Tendances", emoji: "🔥" },
    { id: "gombos", label: "Gombos", emoji: "💼" },
    { id: "publications", label: "Publications", emoji: "🎬" },
    { id: "renfort", label: "Renfort Express", emoji: "⚡" },
    { id: "evenements", label: "Événements", emoji: "📅" },
    { id: "marche", label: "Grand Marché", emoji: "🛒" },
    { id: "academie", label: "Académie", emoji: "🎓" },
    { id: "pres_de_moi", label: "Près de moi", emoji: "📍" }
  ];

  return (
    <div className="space-y-4 text-left font-sans">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#12100C] border-2 border-[#D4AF37] text-afri-text px-5 py-2.5 rounded-2xl shadow-[0_10px_30px_rgba(212,175,55,0.3)] flex items-center gap-2 text-xs font-bold"
          >
            <Flame className="w-4 h-4 text-[#D4AF37] fill-current animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          🔥 VITRINE DES TENDANCES AFRIGOMBO (DYNAMIC & NATURAL)
         ======================================================== */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#14120C] via-[#0B0A08] to-[#17140E] border border-[#D4AF37]/50 shadow-[0_6px_25px_rgba(212,175,55,0.15)] relative overflow-hidden space-y-3.5">
        
        {/* Section Header Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-[#D4AF37]/20 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-[#D4AF37] to-amber-600 rounded-xl text-black shadow shrink-0">
              <Flame className="w-4 h-4 fill-current animate-bounce" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-afri-text uppercase tracking-wider flex items-center gap-1.5">
                <span>TENDANCES</span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 uppercase font-bold">
                  {rankedItems.length} {rankedItems.length <= 1 ? "Active" : "Actives"}
                </span>
              </h2>
            </div>
          </div>
          <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE
          </span>
        </div>

        {/* Category Tabs - Horizontal Scrollable with Android Touch Isolation */}
        <div 
          className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
          style={{ touchAction: "pan-x pan-y" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 snap-start transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#D4AF37] text-black shadow font-bold"
                  : "bg-zinc-900/60 border border-zinc-800 text-afri-text-sec hover:text-afri-text hover:border-[#D4AF37]/30"
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Showcase Carousel (Natural count: 0, 1, 2, 3, 4, max 5) */}
        {rankedItems.length === 0 ? (
          <div className="py-7 px-4 text-center rounded-2xl bg-zinc-950/40 border border-zinc-850 space-y-1.5">
            <div className="w-8 h-8 mx-auto rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
              <Flame className="w-4 h-4 opacity-70" />
            </div>
            <p className="text-xs font-bold text-afri-text">Aucune publication en tendance actuellement.</p>
            <p className="text-[10px] text-afri-text-sec font-mono max-w-xs mx-auto">
              Les tendances s'activent naturellement dès qu'une publication récente génère des interactions sur le Terrain.
            </p>
          </div>
        ) : (
          <div 
            ref={carouselContainerRef}
            onTouchStart={handleUserInteractionStart}
            onTouchEnd={handleUserInteractionEnd}
            onTouchCancel={handleUserInteractionEnd}
            onMouseEnter={handleUserInteractionStart}
            onMouseLeave={handleUserInteractionEnd}
            onMouseDown={handleUserInteractionStart}
            onMouseUp={handleUserInteractionEnd}
            className="flex gap-3.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none [-webkit-overflow-scrolling:touch]"
            style={{ touchAction: "pan-x pan-y" }}
          >
            {rankedItems.map((item, index) => {
              const rank = index + 1;
              const isGombo = item.type === "gombo";
              const officialGomboRef = item.gomboRef || (isGombo && item.rawItem ? getGomboRef(item.rawItem) : "");

              return (
                <motion.div
                  key={`tendances_item_${item.id}_${index}`}
                  whileHover={{ scale: 1.01 }}
                  onTouchStart={() => {
                    handleUserInteractionStart();
                  }}
                  onTouchEnd={() => {
                    handleUserInteractionEnd();
                  }}
                  onTouchCancel={() => {
                    handleUserInteractionEnd();
                  }}
                  onClick={() => {
                    if (isGombo && item.rawItem && onSelectGomboDetails) {
                      onSelectGomboDetails(item.rawItem as Gombo);
                    } else {
                      showToast(`🔥 ${item.title}`);
                    }
                  }}
                  className="w-[85vw] sm:w-[330px] shrink-0 snap-start bg-[#12100C] border border-[#D4AF37]/35 hover:border-[#D4AF37] rounded-xl p-2.5 flex gap-3 shadow-md transition-all cursor-pointer group relative overflow-hidden"
                  style={{ touchAction: "pan-x pan-y" }}
                >
                  {/* Left Side: Thumbnail with Rank Badge */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-zinc-900 border border-afri-border/40 shrink-0 pointer-events-none" style={{ touchAction: "pan-x pan-y" }}>
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                    
                    {/* Badge Rank */}
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#D4AF37] text-black text-[8px] font-bold font-mono shadow">
                      #{rank}
                    </span>

                    {/* Type indicator overlay badge */}
                    <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/70 text-[7px] font-mono text-[#D4AF37] border border-[#D4AF37]/30">
                      {isGombo ? "GOMBO" : "POST"}
                    </span>
                  </div>

                  {/* Right Side: Details & Actions */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      {/* Identity row: Gombo Ref or Author */}
                      <div className="flex items-center justify-between gap-1 text-[9px] font-mono font-bold">
                        {isGombo ? (
                          <span className="text-[#D4AF37] truncate font-black" title={officialGomboRef ? `Réf du Gombo : ${officialGomboRef}` : undefined}>
                            {officialGomboRef ? `Réf : ${officialGomboRef}` : "Opportunité Gombo"}
                          </span>
                        ) : (
                          <span className="text-afri-text truncate">
                            {item.authorName || "Publication"}
                          </span>
                        )}

                        {item.budget ? (
                          <span className="text-emerald-400 shrink-0 font-black">
                            {item.budget.toLocaleString("fr-FR")} F
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[8px] truncate">
                            📍 {item.commune}
                          </span>
                        )}
                      </div>
                      
                      {/* Title */}
                      <h4 className="text-xs font-black text-afri-text truncate group-hover:text-[#D4AF37] transition-colors mt-0.5">
                        {item.title}
                      </h4>

                      {/* Description / snippet */}
                      <p className="text-[10px] text-afri-text-sec line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom Stats & Dynamic Score row */}
                    <div className="flex items-center justify-between text-[9px] font-mono text-afri-text-sec border-t border-[#D4AF37]/10 pt-1 mt-1">
                      <div className="flex items-center gap-2">
                        <span title="Vues">👀 {item.viewsCount}</span>
                        <span title="Honneurs" className="flex items-center gap-0.5">
                          👍 {item.likesCount}
                        </span>
                        {item.candidaturesCount > 0 && (
                          <span title="Candidatures" className="text-[#D4AF37] font-bold">
                            🤝 {item.candidaturesCount}
                          </span>
                        )}
                      </div>
                      
                      {/* Score Explainer mini button with dynamic afrigomboScore */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedScoreExplainer(item);
                        }}
                        className="text-[#D4AF37] font-bold text-[8px] uppercase tracking-wider flex items-center gap-0.5 hover:underline bg-transparent border-none cursor-pointer"
                        title="Voir le Score AFRIGOMBO"
                      >
                        Score {item.afrigomboScore ?? 0} pts <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* Score Explainer Modal */}
      <AnimatePresence>
        {selectedScoreExplainer && (() => {
          const item = selectedScoreExplainer;
          const scoreBreakdown = calculateAfrigomboScore(item, userCommune);
          const isGombo = item.type === "gombo";
          const officialGomboRef = item.gomboRef || (isGombo && item.rawItem ? getGomboRef(item.rawItem) : "");

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-afri-bg/80 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#12100C] border-2 border-[#D4AF37] rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-left"
              >
                <div className="flex justify-between items-start border-b border-afri-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-[#D4AF37]/20 text-[#D4AF37] rounded-xl">
                      <Flame className="w-5 h-5 fill-current" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-afri-text uppercase">SCORE AFRIGOMBO</h3>
                      <p className="text-[10px] text-afri-text-sec font-mono">
                        {isGombo && officialGomboRef ? `Réf du Gombo : ${officialGomboRef}` : item.title}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedScoreExplainer(null)}
                    className="p-1 rounded-lg text-afri-text-sec hover:text-afri-text font-mono text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between p-2 bg-afri-bg-sec rounded-xl text-afri-text-sec">
                    <span>👀 Vues ({item.viewsCount})</span>
                    <span className="font-bold text-afri-text">+{item.viewsCount * 1} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-afri-bg-sec rounded-xl text-afri-text-sec">
                    <span>⭐ Favoris ({item.favoritesCount})</span>
                    <span className="font-bold text-afri-text">+{item.favoritesCount * 5} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-afri-bg-sec rounded-xl text-afri-text-sec">
                    <span>💬 Commentaires ({item.discussionsCount})</span>
                    <span className="font-bold text-afri-text">+{item.discussionsCount * 8} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl text-afri-text-sec">
                    <span>📤 Partages ({item.sharesCount})</span>
                    <span className="font-bold text-afri-text">+{item.sharesCount * 10} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-afri-bg-sec rounded-xl text-afri-text-sec">
                    <span>👍 J'honore ({item.likesCount})</span>
                    <span className="font-bold text-afri-text">+{item.likesCount * 12} pts</span>
                  </div>
                  {item.candidaturesCount > 0 && (
                    <div className="flex justify-between p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl text-afri-text-sec">
                      <span>🤝 Candidatures ({item.candidaturesCount})</span>
                      <span className="font-bold text-afri-text">+{item.candidaturesCount * 20} pts</span>
                    </div>
                  )}

                  {/* Velocity & Freshness decay breakdown */}
                  <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-1 text-[10px]">
                    <div className="flex justify-between text-zinc-400">
                      <span>⚡ Vélocité horaire</span>
                      <span className="font-bold text-emerald-400">{scoreBreakdown.velocity} pts / h</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>⏳ Récence & Fraîcheur</span>
                      <span className="font-bold text-amber-400">{Math.round(scoreBreakdown.decayMultiplier * 100)}%</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-afri-border flex justify-between items-center text-sm font-sans">
                    <span className="font-bold text-afri-text">Score Dynamique Final</span>
                    <span className="font-black text-[#D4AF37] text-lg">{item.afrigomboScore ?? scoreBreakdown.finalScore} pts</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedScoreExplainer(null)}
                  className="w-full py-2.5 bg-[#D4AF37] text-black rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer hover:bg-[#b8952b]"
                >
                  Fermer
                </button>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default TendancesSection;
