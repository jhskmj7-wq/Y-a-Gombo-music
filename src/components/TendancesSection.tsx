import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, Music, Mic, Zap, Calendar, MapPin, ShieldCheck, Crown, 
  ThumbsUp, MessageSquare, Share2, Star, Eye, Info, AlertTriangle, 
  Search, CheckCircle2, RefreshCw, ChevronRight, UserCheck, Sparkles, TrendingUp
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

  // Map raw Gombos and Posts into standardized TendancesItems merged with Firestore real-time data
  const allTendancesItems: TendancesItem[] = useMemo(() => {
    const items: TendancesItem[] = [];

    // Map Gombos
    gombos.forEach(g => {
      const gomboId = g.id || `gombo_${Math.random()}`;
      const local = localInteractions[gomboId];
      const firestoreDoc = firestoreTrendingMap[gomboId];

      const author = users.find(u => u.id === g.userId || u.uid === g.userId || u.id === g.clientId);
      const isVerified = author?.isCertified || author?.isVerified || false;
      const isPremium = author?.isPremium || g.isBoosted || false;

      // Determine category mapping
      let category: TendancesItem["category"] = "general";
      const titleLower = (g.title || "").toLowerCase();
      const descLower = (g.description || "").toLowerCase();

      if (g.urgent || gomboId.includes("urgent") || titleLower.includes("urgent") || titleLower.includes("renfort")) {
        category = "renfort";
      } else if (titleLower.includes("casting") || titleLower.includes("audition") || descLower.includes("casting")) {
        category = "castings";
      } else if (g.eventType || titleLower.includes("événement") || titleLower.includes("festival") || titleLower.includes("concert")) {
        category = "evenements";
      } else if (titleLower.includes("musique") || titleLower.includes("studio") || titleLower.includes("orchestre") || titleLower.includes("beatmaker")) {
        category = "musique";
      }

      let createdAt = Date.now() - 3600000 * 4;
      if (g.createdAt) {
        createdAt = new Date(g.createdAt).getTime();
      } else if (g.timestamp) {
        createdAt = new Date(g.timestamp).getTime();
      }

      const likesCount = local?.likesCount ?? (firestoreDoc?.likesCount || g.likesCount || (g as any).likes || 12);
      const candidaturesCount = local?.candidaturesCount ?? (firestoreDoc?.candidaturesCount || g.applicantsCount || 4);
      const viewsCount = local?.viewsCount ?? (firestoreDoc?.viewsCount || (g as any).viewsCount || 85);
      const discussionsCount = local?.discussionsCount ?? (firestoreDoc?.discussionsCount || (g as any).commentsCount || 6);
      const sharesCount = local?.sharesCount ?? (firestoreDoc?.sharesCount || (g as any).sharesCount || 3);
      const favoritesCount = local?.favoritesCount ?? (firestoreDoc?.favoritesCount || (g as any).favoritesCount || 5);

      items.push({
        id: gomboId,
        type: "gombo",
        title: firestoreDoc?.title || g.title || "Gombo Musique Live",
        description: firestoreDoc?.description || g.description || "Prestation artistique de haut niveau.",
        category: (firestoreDoc?.category as any) || category,
        commune: extractCommuneString(firestoreDoc?.commune || g.commune || g.location),
        authorUid: g.userId || g.clientId,
        authorName: firestoreDoc?.authorName || g.clientName || g.organizerName || author?.artisticName || author?.displayName || "Organisateur AFRIGOMBO",
        authorAvatar: firestoreDoc?.authorAvatar || g.organizerAvatar || author?.photoURL || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150",
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

    // Map Posts
    posts.forEach(p => {
      const postId = p.id || `post_${Math.random()}`;
      const local = localInteractions[postId];
      const firestoreDoc = firestoreTrendingMap[postId];
      const author = users.find(u => u.id === p.userId || u.uid === p.userId);
      const isVerified = author?.isCertified || author?.isVerified || false;
      const isPremium = author?.isPremium || p.isBoosted || false;

      let createdAt = Date.now() - 3600000 * 8;
      if (p.timestamp) {
        createdAt = new Date(p.timestamp).getTime();
      }

      const likesCount = local?.likesCount ?? (firestoreDoc?.likesCount || p.likes || 18);
      const candidaturesCount = 0;
      const viewsCount = local?.viewsCount ?? (firestoreDoc?.viewsCount || 110);
      const discussionsCount = local?.discussionsCount ?? (firestoreDoc?.discussionsCount || p.comments || 8);
      const sharesCount = local?.sharesCount ?? (firestoreDoc?.sharesCount || 5);
      const favoritesCount = local?.favoritesCount ?? (firestoreDoc?.favoritesCount || 7);

      items.push({
        id: postId,
        type: "post",
        title: firestoreDoc?.title || (p.authorArtisticName || p.authorName ? `Publication de ${p.authorArtisticName || p.authorName}` : "Publication Vibe"),
        description: firestoreDoc?.description || p.content || "Vibe d'artiste sur le Terrain.",
        category: "musique",
        commune: extractCommuneString(author?.commune || author?.location),
        authorUid: p.userId,
        authorName: firestoreDoc?.authorName || p.authorArtisticName || p.authorName || "Artiste Virtuose",
        authorAvatar: firestoreDoc?.authorAvatar || p.authorAvatar || author?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
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

  // Top 6 Automatic Trends for the horizontal carousel
  const top6Trends = useMemo(() => {
    // Sort pinned items first, then by score descending
    return [...allTendancesItems]
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const scoreA = calculateTrendingScore(a);
        const scoreB = calculateTrendingScore(b);
        return scoreB - scoreA;
      })
      .slice(0, 6);
  }, [allTendancesItems]);

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
    { id: "musique", label: "Musique", emoji: "🎵" },
    { id: "castings", label: "Castings", emoji: "🎤" },
    { id: "renfort", label: "Renfort Express", emoji: "🤝" },
    { id: "evenements", label: "Événements", emoji: "📅" },
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
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-afri-bg-sec border border-[#D4AF37] text-afri-text px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold"
          >
            <Flame className="w-4 h-4 text-[#D4AF37] fill-current animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-afri-bg-sec via-afri-bg-sec/90 to-afri-bg-ter/40 border border-[#D4AF37]/20 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#D4AF37]/15 rounded-xl text-[#D4AF37]">
                <Flame className="w-6 h-6 fill-current" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-afri-text uppercase tracking-wider">
                  CENTRE DES TENDANCES
                </h2>
                <p className="text-xs text-afri-text-sec">
                  Calculateur de score dynamique en temps réel & Carrousel interactif.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-afri-bg/60 border border-afri-border px-3 py-1.5 rounded-2xl text-[11px] text-afri-text-sec">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Algorithme temps réel • Firestore sync</span>
          </div>
        </div>
      </div>

      {/* REQUIREMENT 3 & 7: HORIZONTAL TOP 6 TRENDS CAROUSEL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#D4AF37] fill-current animate-pulse" />
            <h3 className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-wider">
              TOP 6 TENDANCES AUTOMATIQUES — DEFILEMENT HORIZONTAL
            </h3>
          </div>
          <span className="text-[10px] font-mono text-afri-text-sec">← Glisser sur Android →</span>
        </div>

        {/* Scrollable Horizontal Container */}
        <div 
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-3 touch-pan-x [-webkit-overflow-scrolling:touch]"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {top6Trends.map((item, index) => {
            const score = calculateTrendingScore(item);
            const isSponsored = item.sponsored;
            const isPinned = item.pinned;
            const isRising = score > 100;
            const isPopular = item.viewsCount > 100;

            return (
              <motion.div
                key={`top6_${item.id}`}
                whileHover={{ scale: 1.02 }}
                className="min-w-[280px] sm:min-w-[320px] max-w-[340px] shrink-0 snap-start bg-afri-bg-sec border border-[#D4AF37]/30 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden group"
              >
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:bg-[#D4AF37]/10 transition-all pointer-events-none"></div>

                <div className="space-y-3 relative z-10">
                  {/* Badges Bar */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-mono font-black uppercase flex items-center gap-1">
                      🔥 #{index + 1} Tendance
                    </span>

                    {isSponsored && (
                      <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-black text-[9px] font-mono font-black uppercase flex items-center gap-1 shadow-sm">
                        ⭐ Sponsorisé
                      </span>
                    )}

                    {isPinned && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] font-mono font-black uppercase">
                        👑 Choix AFRIGOMBO
                      </span>
                    )}

                    {isRising && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono font-black uppercase">
                        🚀 Monte
                      </span>
                    )}

                    {isPopular && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-mono font-black uppercase">
                        📈 Populaire
                      </span>
                    )}
                  </div>

                  {/* Image & Title */}
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-14 h-14 rounded-xl object-cover border border-afri-border shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                      <h4 
                        onClick={() => {
                          if (item.type === "gombo" && item.rawItem && onSelectGomboDetails) {
                            onSelectGomboDetails(item.rawItem as Gombo);
                          }
                        }}
                        className="text-sm font-black text-afri-text truncate cursor-pointer hover:text-[#D4AF37] transition-colors"
                      >
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-afri-text-sec truncate mt-0.5">{item.authorName} • {item.commune}</p>
                      <span className="text-xs font-mono font-black text-[#D4AF37] block mt-1">
                        Score : {score} pts
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Engagement Bar */}
                <div className="mt-4 pt-3 border-t border-afri-border/60 flex items-center justify-between text-[10px] font-mono text-afri-text-sec">
                  <span className="flex items-center gap-1">👀 {item.viewsCount}</span>
                  <span className="flex items-center gap-1">👍 {item.likesCount}</span>
                  <span className="flex items-center gap-1">💬 {item.discussionsCount}</span>
                  <span className="flex items-center gap-1">📤 {item.sharesCount}</span>
                  <button
                    onClick={() => handleToggleLike(item)}
                    className="px-2 py-1 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black font-bold transition-all cursor-pointer"
                  >
                    J'honore
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-2 select-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onClick={() => {
              setActiveTab(tab.id);
              try { audioSynth?.playTamTam?.(false); } catch (_) {}
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-all duration-200 cursor-pointer ${
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

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-afri-text-muted" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par mot-clé, titre, quartier, ou artiste..."
          className="w-full pl-10 pr-4 py-2.5 bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] rounded-2xl text-xs text-afri-text placeholder-afri-text-muted outline-none transition-all"
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
          <div className="p-12 text-center rounded-3xl bg-afri-bg-sec border border-afri-border space-y-3">
            <Info className="w-8 h-8 text-[#D4AF37] mx-auto opacity-60" />
            <p className="text-sm font-bold text-afri-text">Aucune donnée trouvée dans cette catégorie.</p>
            <p className="text-xs text-afri-text-sec">Essayez de changer d'onglet ou de réinitialiser la recherche.</p>
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
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className={`p-4 sm:p-5 rounded-3xl bg-afri-bg-sec border transition-all duration-300 relative group ${
                  isTop3 
                    ? "border-[#D4AF37]/40 shadow-[0_4px_25px_rgba(212,175,55,0.06)]" 
                    : "border-afri-border hover:border-afri-border/80"
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  
                  {/* Left rank badge & main info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    
                    {/* Rank Badge */}
                    <div className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center shrink-0 font-black text-xs shadow-inner ${
                      rank === 1 
                        ? "bg-[#D4AF37] text-black" 
                        : rank === 2 
                        ? "bg-zinc-300 text-black dark:bg-zinc-700 dark:text-white" 
                        : rank === 3 
                        ? "bg-amber-700 text-white" 
                        : "bg-afri-bg border border-afri-border text-afri-text-sec"
                    }`}>
                      <span className="text-[9px] uppercase leading-none font-mono">#{rank}</span>
                      <Flame className={`w-3.5 h-3.5 mt-0.5 fill-current ${rank === 1 ? "text-black" : "text-[#D4AF37]"}`} />
                    </div>

                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-afri-bg border border-afri-border">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {item.type === "gombo" && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                          Gombo
                        </span>
                      )}
                    </div>

                    {/* Content Details */}
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
                          <span className="bg-[#D4AF37] text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono shadow-xs">
                            ⭐ Sponsorisé
                          </span>
                        )}

                        {item.pinned && (
                          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono">
                            👑 Choix AFRIGOMBO
                          </span>
                        )}

                        {/* Badges */}
                        {item.isGomboIdVerified && (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono" title="Gombo ID Vérifié">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Vérifié</span>
                          </span>
                        )}

                        {item.isPremium && (
                          <span className="inline-flex items-center gap-1 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono" title="Compte Premium">
                            <Crown className="w-3 h-3 text-[#D4AF37]" />
                            <span>Premium</span>
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

                  {/* Right Score & Interaction Panel */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-afri-border/60 gap-3">
                    
                    {/* Score AFRIGOMBO Clickable Button */}
                    <button
                      onClick={() => setSelectedScoreExplainer(item)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-afri-bg border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all cursor-pointer shadow-xs group/score"
                      title="Cliquez pour voir le détail du Score AFRIGOMBO"
                    >
                      <div className="text-right">
                        <span className="text-[8px] font-mono uppercase text-afri-text-sec block leading-none">Score AFRIGOMBO</span>
                        <span className="text-sm font-black text-[#D4AF37] leading-none group-hover/score:scale-105 transition-transform inline-block">
                          {scoreDetails.finalScore} pts
                        </span>
                      </div>
                      <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
                    </button>

                    {/* Action buttons bar */}
                    <div className="flex items-center gap-1.5">
                      
                      {/* Like / J'honore button */}
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

                      {/* Share button */}
                      <button
                        onClick={() => handleShare(item)}
                        className="p-2 rounded-xl bg-afri-bg border border-afri-border text-afri-text-sec hover:text-[#D4AF37] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Partager (+10 pts)"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono">{item.sharesCount}</span>
                      </button>

                      {/* Favorite button */}
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

                      {/* Action details button */}
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
          const freshnessPct = Math.round(scoreBreakdown.decayMultiplier * 100);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-afri-bg-sec border border-[#D4AF37] rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-left"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-start border-b border-afri-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-[#D4AF37]/15 text-[#D4AF37] rounded-xl">
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

                {/* Score Breakdown List */}
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between p-2 bg-afri-bg rounded-xl">
                    <span className="text-afri-text-sec">👀 Vues ({item.viewsCount})</span>
                    <span className="text-afri-text font-bold">+{item.viewsCount * 1} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-afri-bg rounded-xl">
                    <span className="text-afri-text-sec">⭐ Favoris ({item.favoritesCount})</span>
                    <span className="text-afri-text font-bold">+{item.favoritesCount * 5} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-afri-bg rounded-xl">
                    <span className="text-afri-text-sec">💬 Commentaires ({item.discussionsCount})</span>
                    <span className="text-afri-text font-bold">+{item.discussionsCount * 8} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-afri-bg rounded-xl">
                    <span className="text-afri-text-sec">📤 Partages ({item.sharesCount})</span>
                    <span className="text-afri-text font-bold">+{item.sharesCount * 10} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-afri-bg rounded-xl">
                    <span className="text-afri-text-sec">👍 J'honore ({item.likesCount})</span>
                    <span className="text-afri-text font-bold">+{item.likesCount * 12} pts</span>
                  </div>
                  <div className="flex justify-between p-2 bg-afri-bg rounded-xl">
                    <span className="text-afri-text-sec">🤝 Candidatures ({item.candidaturesCount})</span>
                    <span className="text-afri-text font-bold">+{item.candidaturesCount * 20} pts</span>
                  </div>

                  <div className="pt-2 border-t border-afri-border flex justify-between items-center text-sm font-sans">
                    <span className="font-bold text-afri-text">Score Total Calculé</span>
                    <span className="font-black text-[#D4AF37] text-lg">{calculateTrendingScore(item)} pts</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedScoreExplainer(null)}
                  className="w-full py-2.5 bg-[#D4AF37] text-black rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-[#b8952b]"
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
