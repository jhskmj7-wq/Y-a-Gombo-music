import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, Music, Mic, Zap, Calendar, MapPin, ShieldCheck, Crown, 
  ThumbsUp, MessageSquare, Share2, Star, Eye, Info, AlertTriangle, 
  Search, CheckCircle2, RefreshCw, ChevronRight, UserCheck, Sparkles, TrendingUp,
  ShoppingBag, GraduationCap, Radio, ArrowRight
} from "lucide-react";
import { Gombo, Post, User } from "../types";
import { 
  TendancesItem, 
  TendancesCategoryTab, 
  filterAndRankTendances, 
  calculateAfrigomboScore,
  isInteractionAllowed,
  recordUniqueViewInSession,
  calculateTrendingScore,
  recordTrendingInteraction
} from "../lib/tendancesEngine";
import { db } from "../firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

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
  const [selectedScoreExplainer, setSelectedScoreExplainer] = useState<TendancesItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [firestoreTrendingMap, setFirestoreTrendingMap] = useState<Record<string, any>>({});

  // User commune for proximity matching
  const userCommune = extractCommuneString(currentUserProfile?.commune || currentUserProfile?.location);

  // Local state map for optimistic engagement counts & user interactions
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

  // Real-time listener for Firestore `trending/` collection
  useEffect(() => {
    const q = query(collection(db, "trending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, any> = {};
      snapshot.forEach(doc => {
        map[doc.id] = doc.data();
      });
      setFirestoreTrendingMap(map);
    }, (err) => {
      console.warn("Firestore trending snapshot error:", err);
    });

    return () => unsubscribe();
  }, []);

  // Helper to trigger toast messages
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Map raw Gombos, Posts, Artists, and Standalone Firestore Trending Docs into standardized TendancesItems
  const allTendancesItems: TendancesItem[] = useMemo(() => {
    const items: TendancesItem[] = [];
    const processedIds = new Set<string>();

    // 1. Map Gombos
    gombos.forEach(g => {
      const gomboId = g.id || `gombo_${Math.random()}`;
      processedIds.add(gomboId);
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

      let createdAt = Date.now() - 3600000 * 4;
      if (g.createdAt) {
        createdAt = new Date(g.createdAt).getTime();
      } else if (g.timestamp) {
        createdAt = new Date(g.timestamp).getTime();
      }

      const likesCount = local?.likesCount ?? (firestoreDoc?.likesCount || g.likesCount || (g as any).likes || 18);
      const candidaturesCount = local?.candidaturesCount ?? (firestoreDoc?.candidaturesCount || g.applicantsCount || 6);
      const viewsCount = local?.viewsCount ?? (firestoreDoc?.viewsCount || (g as any).viewsCount || 120);
      const discussionsCount = local?.discussionsCount ?? (firestoreDoc?.discussionsCount || (g as any).commentsCount || 8);
      const sharesCount = local?.sharesCount ?? (firestoreDoc?.sharesCount || (g as any).sharesCount || 5);
      const favoritesCount = local?.favoritesCount ?? (firestoreDoc?.favoritesCount || (g as any).favoritesCount || 7);

      items.push({
        id: gomboId,
        type: "gombo",
        title: firestoreDoc?.title || g.title || "Gombo Musique Live",
        description: firestoreDoc?.description || g.description || "Opportunité artistique certifiée sur le Terrain.",
        category: (firestoreDoc?.category as any) || category,
        commune: extractCommuneString(firestoreDoc?.commune || g.commune || g.location),
        authorUid: g.userId || g.clientId,
        authorName: firestoreDoc?.authorName || g.clientName || g.organizerName || author?.artisticName || author?.displayName || "Organisateur AFRIGOMBO",
        authorAvatar: (author?.useAvatarAsProfile && author?.avatarDataUri) ? author.avatarDataUri : (firestoreDoc?.authorAvatar || g.organizerAvatar || author?.photoURL || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150"),
        isGomboIdVerified: isVerified,
        isPremium,
        budget: g.budget || 50000,
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

    // 2. Map Posts
    posts.forEach(p => {
      const postId = p.id || `post_${Math.random()}`;
      processedIds.add(postId);
      const local = localInteractions[postId];
      const firestoreDoc = firestoreTrendingMap[postId];
      const author = users.find(u => u.id === p.userId || u.uid === p.userId);
      const isVerified = author?.isCertified || author?.isVerified || false;
      const isPremium = author?.isPremium || p.isBoosted || false;

      let createdAt = Date.now() - 3600000 * 8;
      if (p.timestamp) {
        createdAt = new Date(p.timestamp).getTime();
      }

      const likesCount = local?.likesCount ?? (firestoreDoc?.likesCount || p.likes || 24);
      const candidaturesCount = 0;
      const viewsCount = local?.viewsCount ?? (firestoreDoc?.viewsCount || 140);
      const discussionsCount = local?.discussionsCount ?? (firestoreDoc?.discussionsCount || p.comments || 10);
      const sharesCount = local?.sharesCount ?? (firestoreDoc?.sharesCount || 6);
      const favoritesCount = local?.favoritesCount ?? (firestoreDoc?.favoritesCount || 9);

      items.push({
        id: postId,
        type: "post",
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

    // 3. Map Featured Artists
    const featuredArtists = users.filter(u => u.isVerified || u.isCertified || u.isPremium || u.role === "musicien" || u.role === "artiste").slice(0, 8);
    featuredArtists.forEach(u => {
      const artistId = `artist_${u.id || u.uid}`;
      if (!processedIds.has(artistId)) {
        processedIds.add(artistId);
        const local = localInteractions[artistId];
        const firestoreDoc = firestoreTrendingMap[artistId];

        items.push({
          id: artistId,
          type: "post",
          title: firestoreDoc?.title || u.artisticName || u.displayName || "Artiste d'Élite AFRIGOMBO",
          description: firestoreDoc?.description || `${u.instrument || u.role || "Musicien Professionnel"} • ${u.commune || "Abidjan"}`,
          category: "artiste" as any,
          commune: extractCommuneString(u.commune || u.location),
          authorUid: u.id || u.uid,
          authorName: u.artisticName || u.displayName || "Artiste",
          authorAvatar: (u.useAvatarAsProfile && u.avatarDataUri) ? u.avatarDataUri : (u.photoURL || u.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"),
          isGomboIdVerified: !!(u.isCertified || u.isVerified),
          isPremium: !!u.isPremium,
          imageUrl: u.photoURL || u.avatarUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600",
          createdAt: Date.now() - 3600000 * 12,
          likesCount: local?.likesCount ?? (firestoreDoc?.likesCount || 35),
          candidaturesCount: 0,
          viewsCount: local?.viewsCount ?? (firestoreDoc?.viewsCount || 210),
          discussionsCount: local?.discussionsCount ?? (firestoreDoc?.discussionsCount || 14),
          sharesCount: local?.sharesCount ?? (firestoreDoc?.sharesCount || 8),
          favoritesCount: local?.favoritesCount ?? (firestoreDoc?.favoritesCount || 12),
          reportsCount: 0,
          mode: firestoreDoc?.mode || "auto",
          pinned: !!firestoreDoc?.pinned,
          sponsored: !!(firestoreDoc?.sponsored || u.isPremium),
          rawItem: u as any
        });
      }
    });

    // 4. Standalone Firestore Trending Docs added directly by Super Founder
    Object.keys(firestoreTrendingMap).forEach(docId => {
      if (!processedIds.has(docId)) {
        processedIds.add(docId);
        const doc = firestoreTrendingMap[docId];
        items.push({
          id: docId,
          type: doc.type || "gombo",
          title: doc.title || "Tendance Officielle Super Fondateur",
          description: doc.description || "Publication mise en avant au Centre des Tendances.",
          category: doc.category || "general",
          commune: extractCommuneString(doc.commune),
          authorUid: doc.authorUid || "super_admin",
          authorName: doc.authorName || "Super Fondateur",
          authorAvatar: doc.authorAvatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150",
          isGomboIdVerified: doc.isGomboIdVerified ?? true,
          isPremium: doc.isPremium ?? true,
          budget: doc.budget || 100000,
          imageUrl: doc.imageUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600",
          createdAt: doc.createdAt ? new Date(doc.createdAt).getTime() : Date.now(),
          likesCount: doc.likesCount || 50,
          candidaturesCount: doc.candidaturesCount || 10,
          viewsCount: doc.viewsCount || 300,
          discussionsCount: doc.discussionsCount || 18,
          sharesCount: doc.sharesCount || 15,
          favoritesCount: doc.favoritesCount || 20,
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

  // Record unique views on mount for top items
  useEffect(() => {
    allTendancesItems.slice(0, 10).forEach(item => {
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
  }, [allTendancesItems]);

  // Filtered and Ranked items
  const rankedItems = useMemo(() => {
    return filterAndRankTendances(allTendancesItems, activeTab, userCommune, searchTerm);
  }, [allTendancesItems, activeTab, userCommune, searchTerm]);

  // Top 8 Automatic Trends for the horizontal carousel
  const carouselItems = useMemo(() => {
    return [...allTendancesItems]
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const scoreA = calculateTrendingScore(a);
        const scoreB = calculateTrendingScore(b);
        return scoreB - scoreA;
      })
      .slice(0, 10);
  }, [allTendancesItems]);

  // Pinned/Sponsored trends highlighted by Super Founder
  const pinnedTrends = useMemo(() => {
    return allTendancesItems.filter(item => item.pinned || item.sponsored);
  }, [allTendancesItems]);

  // Top Featured Main Card item (Super Founder Pinned doc or top scored item)
  const featuredItem = useMemo(() => {
    return pinnedTrends[0] || carouselItems[0] || allTendancesItems[0];
  }, [pinnedTrends, carouselItems, allTendancesItems]);

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

      try { audioSynth?.playTamTam?.(false); } catch (_) {}
      showToast("👍 'J'honore' enregistré ! +12 pts au Score AFRIGOMBO");
    });
  };

  // Handle Share action
  const handleShare = (item: TendancesItem) => {
    const { allowed, reason } = isInteractionAllowed(
      currentUserProfile?.uid || currentUserProfile?.id,
      item.authorUid,
      "share"
    );

    if (!allowed) {
      showToast(`🛡️ ${reason}`);
      return;
    }

    recordTrendingInteraction(item.id, "share");

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
          hasShared: true,
          sharesCount: current.sharesCount + 1
        }
      };
    });

    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: `${item.title} sur AFRIGOMBO (${item.commune})`,
        url: window.location.href
      }).catch(() => {});
    }

    try { audioSynth?.playValidationSuccess?.(); } catch (_) {}
    showToast("📤 Publication partagée ! +10 pts au Score AFRIGOMBO");
  };

  // Handle Favorite action
  const handleFavorite = (item: TendancesItem) => {
    requireAuthThen(() => {
      recordTrendingInteraction(item.id, "favorite");

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

        const newHasFav = !current.hasFavorited;
        return {
          ...prev,
          [item.id]: {
            ...current,
            hasFavorited: newHasFav,
            favoritesCount: newHasFav ? current.favoritesCount + 1 : Math.max(0, current.favoritesCount - 1)
          }
        };
      });

      try { audioSynth?.playTamTam?.(false); } catch (_) {}
      showToast("⭐ Favori mis à jour ! +5 pts au Score AFRIGOMBO");
    });
  };

  const tabs: { id: TendancesCategoryTab; label: string; emoji: string }[] = [
    { id: "tendances", label: "Tendances", emoji: "🔥" },
    { id: "musique", label: "Gombos", emoji: "💼" },
    { id: "artistes" as any, label: "Artistes", emoji: "🎤" },
    { id: "evenements", label: "Événements", emoji: "📅" },
    { id: "marche" as any, label: "Grand Marché", emoji: "🛒" },
    { id: "academie" as any, label: "Académie", emoji: "🎓" },
    { id: "renfort", label: "Renfort Express", emoji: "⚡" },
    { id: "pres_de_moi", label: "Près de moi", emoji: "📍" }
  ];

  return (
    <div className="space-y-6 text-left font-sans">
      
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
          🔥 GRAND CADRE PREMIUM : CENTRE DES TENDANCES AFRIGOMBO
         ======================================================== */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-[#14120C] via-[#0B0A08] to-[#17140E] border-2 border-[#D4AF37]/50 shadow-[0_12px_45px_rgba(212,175,55,0.2)] relative overflow-hidden space-y-6">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#D4AF37]/25 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#D4AF37] to-amber-600 rounded-2xl text-black shadow-lg shrink-0">
              <Flame className="w-6 h-6 fill-current animate-bounce" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-black text-afri-text uppercase tracking-wider flex items-center gap-2">
                <span>🔥 TENDANCES AFRIGOMBO</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 uppercase font-bold">
                  Vitrine Officielle
                </span>
              </h2>
              <p className="text-[10.5px] sm:text-xs text-amber-200/80 font-sans mt-0.5">
                Mises en avant souveraines, gombos populaires et révélations du Terrain
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[9.5px] font-mono font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>● FIRESTORE REAL-TIME</span>
            </span>
          </div>
        </div>

        {/* ----------------------------------------------------
            1. EN HAUT : LA GRANDE CARTE PRINCIPALE (FEATURED)
           ---------------------------------------------------- */}
        {featuredItem && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-black via-zinc-950 to-black border-2 border-[#D4AF37] shadow-[0_10px_35px_rgba(212,175,55,0.25)] group"
          >
            <div className="relative h-64 sm:h-80 w-full overflow-hidden">
              <img 
                src={featuredItem.imageUrl} 
                alt={featuredItem.title} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              
              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black text-[10.5px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xl">
                    <Crown className="w-3.5 h-3.5 fill-current" />
                    🔥 EN TENDANCE
                  </span>
                  <span className="px-3 py-1 rounded-full bg-afri-bg/80 backdrop-blur-md border border-[#D4AF37]/50 text-[#D4AF37] text-[10px] font-mono font-black uppercase tracking-wider">
                    {(featuredItem.category as string) === "renfort" ? "⚡ Renfort Express" :
                     (featuredItem.category as string) === "evenements" ? "📅 Événement" :
                     (featuredItem.category as string) === "castings" ? "🎤 Casting" :
                     (featuredItem.category as string) === "marche" ? "🛒 Grand Marché" :
                     (featuredItem.category as string) === "academie" ? "🎓 Académie" :
                     (featuredItem.category as string) === "artiste" ? "🎤 Artiste mis en avant" : "💼 Gombo Populaire"}
                  </span>
                </div>

                {featuredItem.pinned && (
                  <span className="px-3 py-1 rounded-full bg-indigo-600 text-afri-text text-[9.5px] font-mono font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                    <ShieldCheck className="w-3.5 h-3.5" /> Choix Super Fondateur
                  </span>
                )}
              </div>

              {/* Text & Action Overlay */}
              <div className="absolute bottom-4 left-4 right-4 z-10 space-y-2.5 text-left">
                <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37] font-bold">
                  <span>📍 {featuredItem.commune}</span>
                  <span>•</span>
                  <span>👤 {featuredItem.authorName}</span>
                  {featuredItem.budget && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400 font-black">{featuredItem.budget.toLocaleString("fr-FR")} FCFA</span>
                    </>
                  )}
                </div>

                <h3 className="text-lg sm:text-2xl font-black text-afri-text leading-tight drop-shadow-lg group-hover:text-[#D4AF37] transition-colors">
                  {featuredItem.title}
                </h3>

                <p className="text-xs sm:text-sm text-afri-text-sec line-clamp-2 max-w-2xl font-sans">
                  {featuredItem.description}
                </p>

                {/* Bottom Stats & Button */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-afri-border">
                  <div className="flex items-center gap-3 text-xs font-mono text-afri-text-sec">
                    <span className="flex items-center gap-1">👀 {featuredItem.viewsCount} vues</span>
                    <span className="flex items-center gap-1">👍 {featuredItem.likesCount} honneurs</span>
                    <span className="flex items-center gap-1">💬 {featuredItem.discussionsCount} palabres</span>
                  </div>

                  <button
                    onClick={() => {
                      if (featuredItem.type === "gombo" && featuredItem.rawItem && onSelectGomboDetails) {
                        onSelectGomboDetails(featuredItem.rawItem as Gombo);
                      } else {
                        showToast("🔥 Tendance explorée !");
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#D4AF37] text-black font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_15px_rgba(212,175,55,0.4)] flex items-center gap-2 cursor-pointer"
                  >
                    <span>Découvrir l'opportunité</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ----------------------------------------------------
            2. SOUS LA CARTE : CARROUSEL HORIZONTAL
           ---------------------------------------------------- */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-wider">
                🔥 CARROUSEL DES TENDANCES AUTOMATIQUES
              </h3>
            </div>
            <span className="text-[10px] font-mono text-afri-text-sec">← Balayer sur mobile →</span>
          </div>

          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-3 touch-pan-x [-webkit-overflow-scrolling:touch]">
            {carouselItems.map((item, index) => (
              <motion.div
                key={`carousel_${item.id}_${index}`}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  if (item.type === "gombo" && item.rawItem && onSelectGomboDetails) {
                    onSelectGomboDetails(item.rawItem as Gombo);
                  } else {
                    showToast(`🔥 ${item.title} ouvert !`);
                  }
                }}
                className="min-w-[260px] sm:min-w-[300px] max-w-[320px] shrink-0 snap-start bg-[#12100C] border border-[#D4AF37]/35 hover:border-[#D4AF37] rounded-2xl p-3.5 flex flex-col justify-between shadow-xl transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="space-y-2.5">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-afri-bg-sec border border-afri-border">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />
                    
                    <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-[#D4AF37] text-black text-[8.5px] font-mono font-black uppercase shadow-sm">
                        #{index + 1} Tendance
                      </span>
                      {(item.category as string) === "artiste" && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-600 text-afri-text text-[8.5px] font-mono font-black uppercase">
                          Artiste
                        </span>
                      )}
                      {(item.category as string) === "evenements" && (
                        <span className="px-2 py-0.5 rounded-md bg-orange-600 text-afri-text text-[8.5px] font-mono font-black uppercase">
                          Événement
                        </span>
                      )}
                      {(item.category as string) === "marche" && (
                        <span className="px-2 py-0.5 rounded-md bg-pink-600 text-afri-text text-[8.5px] font-mono font-black uppercase">
                          Marché
                        </span>
                      )}
                      {(item.category as string) === "academie" && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-afri-text text-[8.5px] font-mono font-black uppercase">
                          Académie
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[9px] font-mono text-afri-text font-bold">
                      <span className="bg-afri-bg/70 px-1.5 py-0.5 rounded border border-afri-border">📍 {item.commune}</span>
                      {item.budget ? (
                        <span className="bg-emerald-500 text-black px-1.5 py-0.5 rounded font-black">{item.budget.toLocaleString("fr-FR")} F</span>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-afri-text truncate group-hover:text-[#D4AF37] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-afri-text-sec truncate mt-0.5">
                      {item.authorName} • {item.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-afri-border flex items-center justify-between text-[10px] font-mono text-afri-text-sec">
                  <span className="flex items-center gap-1">👀 {item.viewsCount}</span>
                  <span className="flex items-center gap-1">👍 {item.likesCount}</span>
                  <span className="text-[#D4AF37] font-bold group-hover:underline flex items-center gap-0.5">
                    Découvrir <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-1 select-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onClick={() => {
              setActiveTab(tab.id);
              try { audioSynth?.playTamTam?.(false); } catch (_) {}
            }}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#D4AF37] text-black shadow-lg scale-102 font-bold"
                : "bg-afri-bg-sec border border-afri-border text-afri-text-sec hover:text-afri-text hover:border-[#D4AF37]/40"
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search Bar inside Trends */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-afri-text-muted" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filtrer les tendances par mot-clé, quartier, artiste..."
          className="w-full pl-10 pr-4 py-2 bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] rounded-2xl text-xs text-afri-text placeholder-afri-text-muted outline-none transition-all"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-afri-text-sec hover:text-afri-text"
          >
            ✕
          </button>
        )}
      </div>

      {/* Ranked Feed List */}
      <div className="space-y-4">
        {rankedItems.length === 0 ? (
          <div className="p-10 text-center rounded-3xl bg-afri-bg-sec border border-afri-border space-y-2">
            <Info className="w-8 h-8 text-[#D4AF37] mx-auto opacity-60" />
            <p className="text-sm font-bold text-afri-text">Aucun résultat dans cette catégorie.</p>
            <p className="text-xs text-afri-text-sec">Changez d'onglet ou réinitialisez les filtres.</p>
          </div>
        ) : (
          rankedItems.map((item, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            const scoreDetails = calculateAfrigomboScore(item, userCommune);
            const userInteraction = localInteractions[item.id];
            const hasLiked = userInteraction?.hasLiked;
            const hasFavorited = userInteraction?.hasFavorited;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className={`p-4 sm:p-5 rounded-3xl bg-afri-bg-sec border transition-all duration-300 relative group ${
                  isTop3 
                    ? "border-[#D4AF37]/50 shadow-[0_4px_25px_rgba(212,175,55,0.08)]" 
                    : "border-afri-border hover:border-afri-border/80"
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center shrink-0 font-black text-xs shadow-inner ${
                      rank === 1 
                        ? "bg-[#D4AF37] text-black" 
                        : rank === 2 
                        ? "bg-zinc-300 text-black dark:bg-zinc-700 dark:text-afri-text" 
                        : rank === 3 
                        ? "bg-amber-700 text-afri-text" 
                        : "bg-afri-bg border border-afri-border text-afri-text-sec"
                    }`}>
                      <span className="text-[9px] uppercase leading-none font-mono">#{rank}</span>
                      <Flame className={`w-3.5 h-3.5 mt-0.5 fill-current ${rank === 1 ? "text-black" : "text-[#D4AF37]"}`} />
                    </div>

                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-afri-bg border border-afri-border">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {item.type === "gombo" && (
                        <span className="absolute bottom-1 right-1 bg-afri-bg/80 text-afri-text text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                          Gombo
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 
                          onClick={() => {
                            if (item.type === "gombo" && item.rawItem && onSelectGomboDetails) {
                              onSelectGomboDetails(item.rawItem as Gombo);
                            }
                          }}
                          className="text-sm sm:text-base font-black text-afri-text truncate cursor-pointer hover:text-[#D4AF37] transition-colors"
                        >
                          {item.title}
                        </h3>

                        {item.sponsored && (
                          <span className="bg-[#D4AF37] text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono">
                            ⭐ Sponsorisé
                          </span>
                        )}

                        {item.pinned && (
                          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono">
                            👑 Choix Fondateur
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-afri-text-sec line-clamp-1">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-afri-text-muted font-mono flex-wrap pt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#D4AF37]" />
                          <span>{item.commune}</span>
                        </span>
                        <span>•</span>
                        <span>{item.authorName}</span>
                        {item.budget && (
                          <>
                            <span>•</span>
                            <span className="text-[#D4AF37] font-bold">{item.budget.toLocaleString()} FCFA</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-afri-border/60 gap-3">
                    <button
                      onClick={() => setSelectedScoreExplainer(item)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-afri-bg border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all cursor-pointer shadow-xs"
                      title="Cliquez pour voir le détail du Score AFRIGOMBO"
                    >
                      <div className="text-right">
                        <span className="text-[8px] font-mono uppercase text-afri-text-sec block leading-none">Score AFRIGOMBO</span>
                        <span className="text-sm font-black text-[#D4AF37] leading-none inline-block">
                          {scoreDetails.finalScore} pts
                        </span>
                      </div>
                      <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleLike(item)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          hasLiked 
                            ? "bg-[#D4AF37] text-black shadow-md" 
                            : "bg-afri-bg border border-afri-border text-afri-text-sec hover:text-[#D4AF37]"
                        }`}
                        title="J'honore (+12 pts)"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 fill-current" />
                        <span className="text-[10px] font-mono">{item.likesCount}</span>
                      </button>

                      <button
                        onClick={() => handleShare(item)}
                        className="p-2 rounded-xl bg-afri-bg border border-afri-border text-afri-text-sec hover:text-[#D4AF37] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Transmettre (+10 pts)"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono">{item.sharesCount}</span>
                      </button>

                      <button
                        onClick={() => handleFavorite(item)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          hasFavorited 
                            ? "bg-amber-500 text-black shadow-md" 
                            : "bg-afri-bg border border-afri-border text-afri-text-sec hover:text-amber-400"
                        }`}
                        title="Favori (+5 pts)"
                      >
                        <Star className={`w-3.5 h-3.5 ${hasFavorited ? "fill-current" : ""}`} />
                      </button>

                      {item.type === "gombo" && item.rawItem && onSelectGomboDetails && (
                        <button
                          onClick={() => onSelectGomboDetails(item.rawItem as Gombo)}
                          className="px-3 py-2 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Détails
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Score Explainer Modal */}
      <AnimatePresence>
        {selectedScoreExplainer && (() => {
          const item = selectedScoreExplainer;
          const scoreBreakdown = calculateAfrigomboScore(item, userCommune);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-afri-bg/80 backdrop-blur-sm animate-fade-in">
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
                      <p className="text-[10px] text-afri-text-sec font-mono">Décomposition officielle du classement</p>
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
                    <span>💬 Palabres ({item.discussionsCount})</span>
                    <span className="font-bold text-afri-text">+{item.discussionsCount * 8} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-afri-bg-sec rounded-xl text-afri-text-sec">
                    <span>📤 Partages ({item.sharesCount})</span>
                    <span className="font-bold text-afri-text">+{item.sharesCount * 10} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-afri-bg-sec rounded-xl text-afri-text-sec">
                    <span>👍 J'honore ({item.likesCount})</span>
                    <span className="font-bold text-afri-text">+{item.likesCount * 12} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-afri-bg-sec rounded-xl text-afri-text-sec">
                    <span>🤝 Candidatures ({item.candidaturesCount})</span>
                    <span className="font-bold text-afri-text">+{item.candidaturesCount * 20} pts</span>
                  </div>

                  <div className="pt-2 border-t border-afri-border flex justify-between items-center text-sm font-sans">
                    <span className="font-bold text-afri-text">Score Total Calculé</span>
                    <span className="font-black text-[#D4AF37] text-lg">{calculateTrendingScore(item)} pts</span>
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
