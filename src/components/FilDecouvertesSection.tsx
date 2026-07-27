import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, ShoppingBag, GraduationCap, MapPin, Clock, 
  ChevronRight, ChevronLeft, ArrowRight, ShieldCheck, Star, 
  Crown, ExternalLink, Info, Flame, Eye, Plus, CheckCircle2, X
} from "lucide-react";
import { collection, onSnapshot, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  FeaturedContentDoc, 
  DEFAULT_FEATURED_ITEMS, 
  calculateDecouvertesScore, 
  recordUserPreferenceClick, 
  seedInitialFeaturedContentIfEmpty 
} from "../lib/decouvertesEngine";
import { AfriModal } from "./common/AfriModal";

interface FilDecouvertesSectionProps {
  userCommune?: string;
  audioSynth?: any;
  onNavigateToSection?: (section: "grand_marche" | "academie") => void;
  onSelectMarketItem?: (item: any) => void;
  onSelectCourseItem?: (course: any) => void;
}

export const FilDecouvertesSection: React.FC<FilDecouvertesSectionProps> = ({
  userCommune = "Abidjan",
  audioSynth,
  onNavigateToSection,
  onSelectMarketItem,
  onSelectCourseItem
}) => {
  const [items, setItems] = useState<FeaturedContentDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDetail, setSelectedDetail] = useState<FeaturedContentDoc | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "market" | "academy">("all");
  
  // Auto-scroll state
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Synchronize Firestore onSnapshot
  useEffect(() => {
    seedInitialFeaturedContentIfEmpty();

    const colRef = collection(db, "featuredContent");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const loaded: FeaturedContentDoc[] = [];
        snapshot.forEach(docSnap => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as FeaturedContentDoc);
        });
        setItems(loaded);
      } else {
        setItems(DEFAULT_FEATURED_ITEMS);
      }
      setLoading(false);
    }, (err) => {
      console.warn("Firestore onSnapshot error for featuredContent:", err);
      setItems(DEFAULT_FEATURED_ITEMS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter & Sort Items using Algorithm
  const rankedItems = useMemo(() => {
    const activeItems = (items.length > 0 ? items : DEFAULT_FEATURED_ITEMS).filter(i => !i.hidden);
    
    // Category filter
    const filtered = activeItems.filter(i => {
      if (activeFilter === "market") return i.type === "market";
      if (activeFilter === "academy") return i.type === "academy";
      return true;
    });

    // Sort by calculated recommendation score
    return filtered.sort((a, b) => {
      const scoreA = calculateDecouvertesScore(a, userCommune);
      const scoreB = calculateDecouvertesScore(b, userCommune);
      return scoreB - scoreA;
    });
  }, [items, activeFilter, userCommune]);

  // Smooth Auto-scroll behavior
  useEffect(() => {
    if (isPaused || rankedItems.length === 0) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        // If reached end, wrap back to start
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollRef.current.scrollBy({ left: 280, behavior: "smooth" });
        }
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused, rankedItems.length]);

  const handleScrollManual = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const handleItemClick = (item: FeaturedContentDoc) => {
    try { audioSynth?.playTamTam?.(false); } catch (_) {}
    
    // Record click for personal recommendation algorithm
    recordUserPreferenceClick(item.type, item.category);

    // Update clicks count in Firestore
    try {
      const docRef = doc(db, "featuredContent", item.id);
      updateDoc(docRef, { clicksCount: increment(1) });
    } catch (_) {}

    setSelectedDetail(item);
  };

  const formatPrice = (val: number | string, textFallback?: string) => {
    if (typeof val === "number") {
      if (val === 0) return "GRATUIT";
      return `${val.toLocaleString()} FCFA`;
    }
    return textFallback || val || "Sur devis";
  };

  return (
    <div className="space-y-3.5 text-left font-sans select-none">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-2 flex-wrap px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4AF37] to-amber-700 flex items-center justify-center text-black font-black shadow-md shadow-[#D4AF37]/20">
            <Sparkles className="w-4 h-4 fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black tracking-wider text-afri-text uppercase">
                DÉCOUVERTES
              </h3>
              <span className="bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                Mix Écosystème
              </span>
            </div>
            <p className="text-[10px] text-afri-text-sec font-medium">
              Grand Marché & Académie AFRIGOMBO recommandés en temps réel
            </p>
          </div>
        </div>

        {/* Filter Badges & Navigation Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex bg-afri-bg-sec border border-afri-border rounded-xl p-0.5 text-[10px]">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-2 py-1 rounded-lg font-extrabold uppercase transition-all ${
                activeFilter === "all" ? "bg-[#D4AF37] text-black" : "text-afri-text-sec hover:text-afri-text"
              }`}
            >
              Tout
            </button>
            <button
              onClick={() => setActiveFilter("market")}
              className={`px-2 py-1 rounded-lg font-extrabold uppercase transition-all ${
                activeFilter === "market" ? "bg-[#D4AF37] text-black" : "text-afri-text-sec hover:text-afri-text"
              }`}
            >
              🛒 Marché
            </button>
            <button
              onClick={() => setActiveFilter("academy")}
              className={`px-2 py-1 rounded-lg font-extrabold uppercase transition-all ${
                activeFilter === "academy" ? "bg-[#D4AF37] text-black" : "text-afri-text-sec hover:text-afri-text"
              }`}
            >
              🎓 Académie
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => handleScrollManual("left")}
              className="p-1.5 rounded-xl bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] text-afri-text transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScrollManual("right")}
              className="p-1.5 rounded-xl bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] text-afri-text transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Smooth Feed Slider */}
      <div 
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex gap-3.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none scroll-smooth"
      >
        {rankedItems.map((item, idx) => {
          const isMarket = item.type === "market";

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleItemClick(item)}
              className="w-[260px] sm:w-[285px] shrink-0 snap-start bg-gradient-to-b from-afri-bg-sec via-afri-bg-sec to-afri-bg border border-afri-border hover:border-[#D4AF37]/60 rounded-3xl p-3.5 flex flex-col justify-between transition-all duration-300 shadow-xl cursor-pointer relative overflow-hidden group"
            >
              {/* Subtle Gold Ambient Gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:bg-[#D4AF37]/15 transition-colors pointer-events-none" />

              <div className="space-y-3 relative z-10">
                {/* Image Container with Badge */}
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-black/40 border border-afri-border/80">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Badge Header: Produit vs Formation */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider font-mono flex items-center gap-1 shadow-md ${
                      isMarket 
                        ? "bg-black/80 text-[#D4AF37] border border-[#D4AF37]/40" 
                        : "bg-[#D4AF37] text-black border border-black/20"
                    }`}>
                      {isMarket ? (
                        <>
                          <ShoppingBag className="w-3 h-3 text-[#D4AF37]" />
                          <span>🛒 Produit</span>
                        </>
                      ) : (
                        <>
                          <GraduationCap className="w-3 h-3 text-black" />
                          <span>🎓 Formation</span>
                        </>
                      )}
                    </span>

                    {item.pinned && (
                      <span className="text-[8px] font-black bg-amber-500 text-black px-1.5 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-0.5 font-mono">
                        📌 Épinglé
                      </span>
                    )}
                  </div>

                  {/* Price overlay at bottom of image */}
                  <div className="absolute bottom-2 right-2 bg-black/85 border border-[#D4AF37]/50 text-[#D4AF37] text-[10px] font-black font-mono px-2 py-0.5 rounded-xl shadow-lg">
                    {formatPrice(item.price, item.priceText)}
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-afri-text group-hover:text-[#D4AF37] transition-colors leading-snug line-clamp-2 uppercase">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-afri-text-sec line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Bottom Meta & Action Button */}
              <div className="pt-3 mt-3 border-t border-afri-border/60 flex items-center justify-between gap-2 relative z-10">
                {/* Meta details depending on type */}
                <div className="text-[9px] text-afri-text-sec font-mono space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-[#D4AF37] shrink-0" />
                    <span className="truncate">{item.city}</span>
                  </div>
                  
                  {!isMarket && item.duration && (
                    <div className="flex items-center gap-1 truncate text-amber-300 font-bold">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{item.duration} • {item.level || "Tous niveaux"}</span>
                    </div>
                  )}
                </div>

                {/* Action Button: "Voir" or "Découvrir" */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-md ${
                    isMarket
                      ? "bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
                      : "bg-[#D4AF37] text-black hover:bg-[#b8952b]"
                  }`}
                >
                  <span>{isMarket ? "Voir" : "Découvrir"}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedDetail && (
          <AfriModal
            isOpen={!!selectedDetail}
            onClose={() => setSelectedDetail(null)}
            title={selectedDetail.type === "market" ? "🛒 Grand Marché AFRIGOMBO" : "🎓 Académie AFRIGOMBO"}
          >
            <div className="space-y-4 text-left">
              {/* Image Preview */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-afri-border">
                <img
                  src={selectedDetail.imageUrl}
                  alt={selectedDetail.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-black/80 border border-[#D4AF37] text-[#D4AF37] text-xs font-bold font-mono px-3 py-1 rounded-xl">
                  {selectedDetail.type === "market" ? "Produit / Matériel" : "Formation Académique"}
                </div>
              </div>

              {/* Title & Price */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="text-base font-black text-afri-text uppercase">
                    {selectedDetail.title}
                  </h3>
                  <p className="text-xs text-afri-text-sec flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{selectedDetail.city}</span>
                  </p>
                </div>

                <span className="text-base font-black text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-2xl border border-[#D4AF37]/30">
                  {formatPrice(selectedDetail.price, selectedDetail.priceText)}
                </span>
              </div>

              {/* Course Extras */}
              {selectedDetail.type === "academy" && (
                <div className="grid grid-cols-2 gap-2 text-xs font-mono p-3 bg-afri-bg rounded-2xl border border-afri-border">
                  <div>
                    <span className="text-afri-text-sec block text-[10px]">DURÉE :</span>
                    <span className="font-bold text-afri-text">{selectedDetail.duration || "En ligne"}</span>
                  </div>
                  <div>
                    <span className="text-afri-text-sec block text-[10px]">NIVEAU :</span>
                    <span className="font-bold text-afri-text">{selectedDetail.level || "Tous niveaux"}</span>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block">Description complète</span>
                <p className="text-xs text-afri-text leading-relaxed p-3 bg-afri-bg rounded-2xl border border-afri-border/60">
                  {selectedDetail.description}
                </p>
              </div>

              {/* Navigation Action */}
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => {
                    const type = selectedDetail.type;
                    const detail = selectedDetail;
                    setSelectedDetail(null);
                    if (type === "market") {
                      if (onSelectMarketItem) onSelectMarketItem(detail);
                      if (onNavigateToSection) onNavigateToSection("grand_marche");
                    } else {
                      if (onSelectCourseItem) onSelectCourseItem(detail);
                      if (onNavigateToSection) onNavigateToSection("academie");
                    }
                  }}
                  className="flex-1 py-3 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer hover:bg-[#b8952b] transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Accéder dans le module {selectedDetail.type === "market" ? "Grand Marché" : "Académie"}</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </AfriModal>
        )}
      </AnimatePresence>

    </div>
  );
};

export default FilDecouvertesSection;
