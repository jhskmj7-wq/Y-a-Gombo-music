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
import { db } from "../lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

import { getGomboRef } from "../lib/gomboIdHelper";

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

      let createdAt = Date.now() - 3600000 * 4;
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
        title: firestoreDoc?.title || g.title || "Gombo Musique Live",
        description: firestoreDoc?.description || g.description || "Opportunité artistique certifiée sur le Terrain.",
        category: (firestoreDoc?.category as any) || category,
        commune: extractCommuneString(firestoreDoc?.commune || g.commune || g.location),
        authorUid: g.userId || g.clientId,
        authorName: firestoreDoc?.authorName || g.clientName || g.organizerName || author?.artisticName || author?.displayName || "Organisateur AFRIGOMBO ELITE",
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

    // 2. Map Posts
    posts.forEach(p => {
      const postId = p.id || `post_${Math.random()}`;
      const postRef = getGomboRef(p);
      if (processedIds.has(postId) || (postRef && processedIds.has(postRef))) return;
      processedIds.add(postId);
      if (postRef) processedIds.add(postRef);

      const local = localInteractions[postId];
      const firestoreDoc = firestoreTrendingMap[postId];
      const author = users.find(u => u.id === p.userId || u.uid === p.userId);
      const isVerified = author?.isCertified || author?.isVerified || false;
      const isPremium = author?.isPremium || p.isBoosted || false;

      let createdAt = Date.now() - 3600000 * 8;
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
          title: firestoreDoc?.title || u.artisticName || u.displayName || "Artiste d'Élite AFRIGOMBO ELITE",
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
          likesCount: local?.likesCount ?? (firestoreDoc?.likesCount || 0),
          candidaturesCount: 0,
          viewsCount: local?.viewsCount ?? (firestoreDoc?.viewsCount || 0),
          discussionsCount: local?.discussionsCount ?? (firestoreDoc?.discussionsCount || 0),
          sharesCount: local?.sharesCount ?? (firestoreDoc?.sharesCount || 0),
          favoritesCount: local?.favoritesCount ?? (firestoreDoc?.favoritesCount || 0),
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
          budget: doc.budget || 0,
          imageUrl: doc.imageUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600",
          createdAt: doc.createdAt ? new Date(doc.createdAt).getTime() : Date.now(),
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

  // Pinned/Sponsored trends highlighted by Super Founder
  const pinnedTrends = useMemo(() => {
    return allTendancesItems.filter(item => item.pinned || item.sponsored);
  }, [allTendancesItems]);

  // Top Featured Main Card item (Super Founder Pinned doc or top scored item)
  const featuredItem = useMemo(() => {
    return pinnedTrends[0] || allTendancesItems[0] || null;
  }, [pinnedTrends, allTendancesItems]);

  // Top Automatic Trends for the horizontal carousel (excluding featuredItem)
  const carouselItems = useMemo(() => {
    const baseList = [...allTendancesItems].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const scoreA = calculateTrendingScore(a);
      const scoreB = calculateTrendingScore(b);
      return scoreB - scoreA;
    });

    if (!featuredItem) return baseList.slice(0, 10);
    const featRef = getGomboRef(featuredItem.rawItem || featuredItem);
    return baseList.filter(item => {
      if (item.id === featuredItem.id) return false;
      const itemRef = getGomboRef(item.rawItem || item);
      return itemRef !== featRef;
    }).slice(0, 10);
  }, [allTendancesItems, featuredItem]);

  // Filtered and Ranked items for feed (excluding featuredItem in "tendances" tab)
  const rankedItems = useMemo(() => {
    let list = filterAndRankTendances(allTendancesItems, activeTab, userCommune, searchTerm);
    if (activeTab === "tendances" && featuredItem) {
      const featRef = getGomboRef(featuredItem.rawItem || featuredItem);
      list = list.filter(item => {
        if (item.id === featuredItem.id) return false;
        const itemRef = getGomboRef(item.rawItem || item);
        return itemRef !== featRef;
      });
    }
    return list;
  }, [allTendancesItems, activeTab, userCommune, searchTerm, featuredItem]);

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

      try { 
        // Silenced for ELITE
      } catch (_) {}
      showToast("👍 'J'honore' enregistré ! +12 pts au Score AFRIGOMBO ELITE");
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
        text: `${item.title} sur AFRIGOMBO ELITE (${item.commune})`,
        url: window.location.href
      }).catch(() => {});
    }

    try { 
      // Silenced for ELITE
    } catch (_) {}
    showToast("📤 Publication partagée ! +10 pts au Score AFRIGOMBO ELITE");
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

      try { 
        // Silenced for ELITE
      } catch (_) {}
      showToast("⭐ Favori mis à jour ! +5 pts au Score AFRIGOMBO ELITE");
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
          🔥 CARTES DES TENDANCES AFRIGOMBO ELITE (COMPACT & HORIZONTAL)
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
                <span>TENDANCES ELITE</span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 uppercase font-bold">
                  Vitrine Live
                </span>
              </h2>
            </div>
          </div>
          <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
            ● FIRESTORE LIVE
          </span>
        </div>

        {/* Category Tabs inside Trends - Horizontal Scrollable */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
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

        {/* Horizontal Scrollable Carousel */}
        {rankedItems.length === 0 ? (
          <div className="py-6 px-4 text-center rounded-2xl bg-zinc-950/40 border border-zinc-850 space-y-1">
            <Info className="w-5 h-5 text-[#D4AF37] mx-auto opacity-60" />
            <p className="text-xs font-bold text-afri-text">Aucune tendance dans cette catégorie.</p>
          </div>
        ) : (
          <div className="flex gap-3.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none touch-pan-x [-webkit-overflow-scrolling:touch]">
            {rankedItems.map((item, index) => {
              const rank = index + 1;
              const userInteraction = localInteractions[item.id];
              const hasLiked = userInteraction?.hasLiked;
              const hasFavorited = userInteraction?.hasFavorited;

              return (
                <motion.div
                  key={`carousel_item_${item.id}_${index}`}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => {
                    if (item.type === "gombo" && item.rawItem && onSelectGomboDetails) {
                      onSelectGomboDetails(item.rawItem as Gombo);
                    } else {
                      showToast(`🔥 ${item.title} ouvert !`);
                    }
                  }}
                  className="w-[88vw] sm:w-[340px] shrink-0 snap-start bg-[#12100C] border border-[#D4AF37]/35 hover:border-[#D4AF37] rounded-xl p-2.5 flex gap-3 shadow-md transition-all cursor-pointer group relative overflow-hidden"
                >
                  {/* Left Side: Image / Visual Thumbnail */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-zinc-900 border border-afri-border/40 shrink-0">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                    
                    {/* Badge Rank on image */}
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#D4AF37] text-black text-[8px] font-bold font-mono shadow">
                      #{rank}
                    </span>
                  </div>

                  {/* Right Side: Details & Actions */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[9px] font-mono font-bold">
                        <span className="text-[#D4AF37] uppercase truncate">
                          📍 {item.commune}
                        </span>
                        {item.budget ? (
                          <span className="text-emerald-400 shrink-0 font-black">
                            {item.budget.toLocaleString("fr-FR")} F
                          </span>
                        ) : null}
                      </div>
                      
                      <h4 className="text-xs font-black text-afri-text truncate group-hover:text-[#D4AF37] transition-colors mt-0.5">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-afri-text-sec line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom Stats & Engagement row */}
                    <div className="flex items-center justify-between text-[9px] font-mono text-afri-text-sec border-t border-[#D4AF37]/10 pt-1 mt-1">
                      <div className="flex items-center gap-2">
                        <span title="Vues">👀 {item.viewsCount}</span>
                        <span title="Honneurs" className="flex items-center gap-0.5">
                          👍 {item.likesCount}
                        </span>
                        {item.candidaturesCount > 0 && (
                          <span title="Candidatures" className="text-[#D4AF37] font-bold">🤝 {item.candidaturesCount}</span>
                        )}
                      </div>
                      
                      {/* Score Explainer mini button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedScoreExplainer(item);
                        }}
                        className="text-[#D4AF37] font-bold text-[8px] uppercase tracking-wider flex items-center gap-0.5 hover:underline bg-transparent border-none cursor-pointer"
                        title="Voir le Score AFRIGOMBO ELITE"
                      >
                        Score {calculateTrendingScore(item)} pts <ChevronRight className="w-2.5 h-2.5" />
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
                      <h3 className="text-base font-black text-afri-text uppercase">SCORE AFRIGOMBO ELITE</h3>
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
                  <div className="flex justify-between p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl text-afri-text-sec">
                    <span>📤 Partages ({item.sharesCount})</span>
                    <span className="font-bold text-afri-text">+{item.sharesCount * 10} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-afri-bg-sec rounded-xl text-afri-text-sec">
                    <span>👍 J'honore ({item.likesCount})</span>
                    <span className="font-bold text-afri-text">+{item.likesCount * 12} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl text-afri-text-sec">
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
