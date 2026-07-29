import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  ShoppingBag, Search, Tag, Filter, Plus, ShieldCheck, CheckCircle2, 
  AlertTriangle, Crown, Sparkles, MapPin, Phone, MessageCircle, ArrowLeft, 
  Trash2, ExternalLink, RefreshCcw, DollarSign, Eye, Star, ChevronRight,
  Store, Package, ShoppingCart, Check, X, Info, TrendingUp
} from "lucide-react";
import { UserProfile } from "../types";
import { supportConfig } from "../supportConfig";
import { AfriModal } from "./common/AfriModal";
import { db, gomboDB } from "../firebase";
import { recordWalletTransaction } from "../lib/financial";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: "instruments" | "studio" | "sonorisation" | "lumieres" | "location" | "prestations" | "accessoires" | "formation" | "services";
  condition: "Neuf" | "Excellent état" | "Bon état" | "Occasion";
  sellerName: string;
  sellerId: string;
  sellerAvatar: string;
  sellerTrustScore: number;
  sellerCertified: boolean;
  location: string;
  image: string;
  phone?: string;
  createdAt: string;
  isSold?: boolean;
  viewsCount?: number;
  favoritesCount?: number;
}

const INITIAL_MARKET_ITEMS: MarketItem[] = [
  {
    id: "item-1",
    title: "Synthétiseur Yamaha Motif XF8 - Excellent état",
    description: "Clavier synthétiseur professionnel 88 touches touché lourd. Utilisé uniquement en studio climatisé à Cocody. Vendu avec flight case renforcé et pédale d'expression.",
    price: 850000,
    category: "instruments",
    condition: "Excellent état",
    sellerName: "Koffi Maestro Studio",
    sellerId: "user-koffi-88",
    sellerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    sellerTrustScore: 98,
    sellerCertified: true,
    location: "Abidjan, Cocody Angré",
    image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600",
    phone: "+225 0707070701",
    createdAt: "2026-07-20"
  },
  {
    id: "item-2",
    title: "Microphone Shure SM7B + Carte Focusrite 2i2",
    description: "Pack prêt pour enregistrement vocal pro & podcast. Micro dynamique studio légendaire avec sa carte son Focusrite Scarlett 3rd Gen. Câbles XLR Mogami offerts.",
    price: 280000,
    category: "studio",
    condition: "Neuf",
    sellerName: "Yao Sound Tech",
    sellerId: "user-yao-studio",
    sellerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    sellerTrustScore: 94,
    sellerCertified: true,
    location: "Abidjan, Marcory Zone 4",
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600",
    phone: "+225 0505050502",
    createdAt: "2026-07-22"
  },
  {
    id: "item-3",
    title: "Table de Mixage Numérique Behringer X32 Compact",
    description: "Console de mixage 40 canaux, 25 bus pour concert live et studio. Écran couleur, faders motorisés. Révision complète faite ce mois-ci.",
    price: 1250000,
    category: "sonorisation",
    condition: "Excellent état",
    sellerName: "Alliance Event Prod",
    sellerId: "user-alliance-prod",
    sellerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    sellerTrustScore: 99,
    sellerCertified: true,
    location: "Abidjan, Yopougon Selmer",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600",
    phone: "+225 0101010103",
    createdAt: "2026-07-24"
  },
  {
    id: "item-4",
    title: "Guitare Électrique Fender Stratocaster Player",
    description: "Guitare couleur Sunburst 3 tons, touche érable. Son pur Afrobeats & Zouglou. Montée avec des cordes Ernie Ball 10-46 toutes neuves.",
    price: 450000,
    category: "instruments",
    condition: "Bon état",
    sellerName: "Amani Soloist",
    sellerId: "user-amani-gtr",
    sellerAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150",
    sellerTrustScore: 92,
    sellerCertified: false,
    location: "Bouaké, Quartier Commerce",
    image: "https://images.unsplash.com/photo-1550291652-6ea9114a47b1?w=600",
    phone: "+225 0708091011",
    createdAt: "2026-07-21"
  },
  {
    id: "item-5",
    title: "Session de Mixage & Mastering Analogique Pro",
    description: "Prestation de traitement sonore par ingénieur certifié BURIDA. Traitement avec sommaire hybride analogique / numérique. Rendu sous 48h.",
    price: 60000,
    category: "services",
    condition: "Neuf",
    sellerName: "Bamba Master Lab",
    sellerId: "user-bamba-master",
    sellerAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
    sellerTrustScore: 100,
    sellerCertified: true,
    location: "Abidjan, Riviera 3",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600",
    phone: "+225 0707123456",
    createdAt: "2026-07-25"
  }
];

interface GrandMarcheViewProps {
  currentUserProfile?: UserProfile;
  onNavigateView?: (view: string, tab?: any) => void;
  onBack?: () => void;
}

export const GrandMarcheView: React.FC<GrandMarcheViewProps> = ({
  currentUserProfile,
  onNavigateView,
  onBack
}) => {
  const [items, setItems] = useState<MarketItem[]>(() => {
    const saved = localStorage.getItem("afrigombo_market_items");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_MARKET_ITEMS;
  });

  const [activeTab, setActiveTab] = useState<"catalog" | "my_listings" | "seller_dashboard">("catalog");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [onlyCertifiedSellers, setOnlyCertifiedSellers] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("afrigombo_market_favs") || "[]"); } catch { return []; }
  });

  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Toggle favorite helper
  const toggleFavorite = (itemId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: string[];
    if (favoriteIds.includes(itemId)) {
      updated = favoriteIds.filter(id => id !== itemId);
    } else {
      updated = [...favoriteIds, itemId];
    }
    setFavoriteIds(updated);
    try {
      localStorage.setItem("afrigombo_market_favs", JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save afrigombo_market_favs:", e);
    }

    // Update item favorites count
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const count = item.favoritesCount || 12;
        return { ...item, favoritesCount: favoriteIds.includes(itemId) ? count - 1 : count + 1 };
      }
      return item;
    }));
  };

  // Share listing handler
  const handleShareListing = (item: MarketItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({ title: item.title, text: item.description, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${item.title} - ${item.price.toLocaleString()} FCFA sur AFRIGOMBO: ${shareUrl}`);
      alert("Lien de l'annonce copié dans le presse-papier !");
    }
  };

  // Reset scroll on category change or mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [selectedCategory, activeTab]);

  // Modals
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isBuySuccessModalOpen, setIsBuySuccessModalOpen] = useState<boolean>(false);
  const [boughtItemTitle, setBoughtItemTitle] = useState<string>("");
  const [isInsufficientBalanceModalOpen, setIsInsufficientBalanceModalOpen] = useState<boolean>(false);
  const [insufficientBalanceDetails, setInsufficientBalanceDetails] = useState<{ current: number; required: number; missing: number } | null>(null);
  const [pendingResumeItem, setPendingResumeItem] = useState<MarketItem | null>(null);

  // Publish Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<MarketItem["category"]>("instruments");
  const [newCondition, setNewCondition] = useState<MarketItem["condition"]>("Excellent état");
  const [newPrice, setNewPrice] = useState("");
  const [newLocation, setNewLocation] = useState("Abidjan");
  const [newPhone, setNewPhone] = useState(currentUserProfile?.phone || "+225 ");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  // Save items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("afrigombo_market_items", JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save afrigombo_market_items:", e);
    }
  }, [items]);

  // Ensure fallback items if empty or invalid
  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) {
      setItems(INITIAL_MARKET_ITEMS);
    }
  }, []);

  // Compute Seller Eligibility
  const trustScore = currentUserProfile?.trustScore ?? currentUserProfile?.gomboId?.scoreConfiance ?? 50;
  const isPremium = currentUserProfile?.isPremium || currentUserProfile?.isPro || currentUserProfile?.isVip;
  const completedGombos = currentUserProfile?.gomboId?.prestationsTerminees ?? currentUserProfile?.totalContracts ?? 0;
  
  // Requirement: Trust Score >= 70 OR Completed Gombos >= 3 OR Premium Subscriber
  const canPublish = isPremium || trustScore >= 70 || completedGombos >= 3;

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = cityFilter === "all" || item.location.toLowerCase().includes(cityFilter.toLowerCase());
    const matchesCondition = conditionFilter === "all" || item.condition === conditionFilter;
    const matchesCertified = !onlyCertifiedSellers || item.sellerCertified;
    const itemPrice = item.price;
    const matchesMinPrice = !minPrice || itemPrice >= parseFloat(minPrice);
    const matchesMaxPrice = !maxPrice || itemPrice <= parseFloat(maxPrice);

    return matchesCategory && matchesSearch && matchesCity && matchesCondition && matchesCertified && matchesMinPrice && matchesMaxPrice;
  });

  const myItems = items.filter(item => item.sellerId === (currentUserProfile?.uid || "current_user"));

  const handlePublishListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice || !newDescription.trim()) return;

    const newItem: MarketItem = {
      id: `item-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim(),
      price: parseFloat(newPrice) || 10000,
      category: newCategory,
      condition: newCondition,
      sellerName: currentUserProfile?.displayName || "Vendeur Certifié",
      sellerId: currentUserProfile?.uid || "current_user",
      sellerAvatar: currentUserProfile?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      sellerTrustScore: trustScore,
      sellerCertified: !!currentUserProfile?.gomboId?.certifie,
      location: newLocation.trim() || "Abidjan",
      image: newImageUrl.trim() || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600",
      phone: newPhone.trim(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    setItems([newItem, ...items]);
    setIsPublishModalOpen(false);
    
    // Reset Form
    setNewTitle("");
    setNewPrice("");
    setNewDescription("");
    setNewImageUrl("");

    // Sound notification
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('gombo_play_sound', { detail: { name: 'validation' } }));
    }
  };

  const handleDeleteListing = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const handleBuyItem = async (item: MarketItem) => {
    if (!currentUserProfile?.uid) {
      alert("Veuillez vous connecter pour acheter cet article.");
      return;
    }

    try {
      // Fetch latest wallet balance directly from Firestore
      const userRef = doc(db, "users", currentUserProfile.uid);
      const userSnap = await getDoc(userRef);
      let balance = 0;
      if (userSnap.exists()) {
        const uData = userSnap.data();
        balance = uData?.wallet?.soldeDisponible ?? 0;
      } else {
        balance = currentUserProfile?.wallet?.soldeDisponible ?? 0;
      }

      if (balance >= item.price) {
        // Solde suffisant: déduire immédiatement
        const newSolde = balance - item.price;
        await setDoc(userRef, {
          wallet: {
            soldeDisponible: newSolde
          }
        }, { merge: true });

        // Enregistrer la transaction
        await recordWalletTransaction({
          userId: currentUserProfile.uid,
          userName: currentUserProfile.displayName || "Membre Gombo",
          type: "debit_publication",
          amount: item.price,
          status: "success",
          description: `Achat article Marché : "${item.title}"`
        });

        // Fire custom event to notify parents of balance updates
        window.dispatchEvent(new CustomEvent("wallet_balance_updated"));

        setBoughtItemTitle(item.title);
        setSelectedItem(null);
        setIsBuySuccessModalOpen(true);
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('gombo_play_sound', { detail: { name: 'payment' } }));
        }
      } else {
        // Solde insuffisant: bloquer et ouvrir modale
        setInsufficientBalanceDetails({
          current: balance,
          required: item.price,
          missing: item.price - balance
        });
        setBoughtItemTitle(item.title);
        setIsInsufficientBalanceModalOpen(true);
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Error executing buy item", err);
      alert("Erreur lors de la validation de la transaction. Veuillez réessayer.");
    }
  };

  useEffect(() => {
    const pendingRaw = localStorage.getItem("afrigombo_pending_purchase");
    if (pendingRaw) {
      try {
        const pending = JSON.parse(pendingRaw);
        if (pending.type === "grand_marche" && pending.item) {
          const item = pending.item;
          const userSolde = currentUserProfile?.wallet?.soldeDisponible ?? 0;
          if (userSolde >= item.price) {
            setPendingResumeItem(item);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [currentUserProfile]);

  return (
    <div className="w-full flex flex-col space-y-6 text-left animate-fadeIn text-afri-text pb-12">
      {/* HEADER & FILTERS */}
      <div className="w-full space-y-5">
        {/* HEADER SECTION */}
        <div className="w-full bg-gradient-to-r from-afri-bg-sec via-afri-bg to-afri-bg-sec border border-[#D4AF37]/40 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div className="flex items-start gap-3 w-full sm:w-auto">
              <div className="w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <Store className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37] shrink-0" />
                  <h1 className="text-lg sm:text-2xl font-black text-afri-text uppercase tracking-tight">
                    Le Grand Marché
                  </h1>
                  <span className="text-[9px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 whitespace-nowrap bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-mono font-black uppercase rounded-md tracking-wider">
                    SÉCURISÉ AFRI-TRUST
                  </span>
                </div>
                <p className="text-xs text-afri-text-sec mt-1">
                  Achat, vente & location de matériel musical, studio, sonorisation et prestations certifiées.
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="w-full sm:w-auto shrink-0 flex justify-center sm:justify-end">
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-afri-gold hover:brightness-110 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Vendre un article</span>
                <Info 
                  className="w-4 h-4 ml-1.5 hover:scale-110 transition-transform text-black/85 cursor-pointer shrink-0" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsInfoModalOpen(true);
                  }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* TABS & FILTERS */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-afri-border/60 pb-3">
            {/* TABS */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("catalog")}
                className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "catalog"
                    ? "bg-[#D4AF37] text-black shadow-md font-black"
                    : "bg-afri-bg-sec border border-afri-border text-afri-text-sec hover:text-afri-text"
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Catalogue</span>
                <span className="px-1.5 py-0.2 bg-black/20 text-[10px] rounded-full font-mono font-bold">
                  {items.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("my_listings")}
                className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "my_listings"
                    ? "bg-[#D4AF37] text-black shadow-md font-black"
                    : "bg-afri-bg-sec border border-afri-border text-afri-text-sec hover:text-afri-text"
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>Mes Annonces</span>
                <span className="px-1.5 py-0.2 bg-black/20 text-[10px] rounded-full font-mono font-bold">
                  {myItems.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("seller_dashboard")}
                className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "seller_dashboard"
                    ? "bg-[#D4AF37] text-black shadow-md font-black"
                    : "bg-afri-bg-sec border border-afri-border text-afri-text-sec hover:text-afri-text"
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Tableau Créateur</span>
              </button>
            </div>

            {/* SEARCH BAR */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-afri-text-sec absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un équipement..."
                className="w-full bg-afri-bg-sec border border-afri-border rounded-xl pl-9 pr-3 py-2 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          {/* ADVANCED FILTERS BAR */}
          {activeTab === "catalog" && (
            <div className="space-y-2">
              <div className="flex overflow-x-auto scrollbar-hide gap-1.5 sm:gap-2 pt-1 pb-2 whitespace-nowrap text-xs w-full max-w-full select-none">
                {[
                  { id: "all", label: "Tous les produits" },
                  { id: "instruments", label: "🎵 Instruments" },
                  { id: "studio", label: "🎙 Studios" },
                  { id: "sonorisation", label: "🎧 Matériel Audio" },
                  { id: "accessoires", label: "👕 Mode & Accessoires" },
                  { id: "beats", label: "📀 Beats" },
                  { id: "services", label: "🎼 Services" },
                  { id: "location", label: "🏠 Locations" },
                  { id: "prestations", label: "💼 Prestations" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? "bg-afri-bg-ter border-[#D4AF37] text-[#D4AF37] shadow-xs"
                        : "bg-afri-bg border-afri-border text-afri-text-sec hover:text-afri-text"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* SECONDARY FILTER CONTROLS */}
              <div className="p-2.5 bg-afri-bg-sec border border-afri-border/60 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-afri-text-sec uppercase">Filtres:</span>
                  
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="bg-afri-bg border border-afri-border rounded-lg px-2 py-1 text-[11px] text-afri-text focus:border-[#D4AF37] outline-none"
                  >
                    <option value="all">Toutes les villes</option>
                    <option value="Abidjan">Abidjan</option>
                    <option value="Bouaké">Bouaké</option>
                    <option value="Yamoussoukro">Yamoussoukro</option>
                    <option value="San Pedro">San Pédro</option>
                  </select>

                  <select
                    value={conditionFilter}
                    onChange={(e) => setConditionFilter(e.target.value)}
                    className="bg-afri-bg border border-afri-border rounded-lg px-2 py-1 text-[11px] text-afri-text focus:border-[#D4AF37] outline-none"
                  >
                    <option value="all">Tous les états</option>
                    <option value="Neuf">Neuf</option>
                    <option value="Excellent état">Excellent état</option>
                    <option value="Bon état">Bon état</option>
                    <option value="Occasion">Occasion</option>
                  </select>

                  <button
                    onClick={() => setOnlyCertifiedSellers(!onlyCertifiedSellers)}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-all ${
                      onlyCertifiedSellers
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                        : "bg-afri-bg border-afri-border text-afri-text-sec"
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Vendeurs certifiés uniquement</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="Min FCFA"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-20 bg-afri-bg border border-afri-border rounded-lg px-2 py-1 text-[10px] font-mono text-afri-text outline-none"
                  />
                  <span className="text-afri-text-sec text-[10px]">-</span>
                  <input
                    type="number"
                    placeholder="Max FCFA"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-20 bg-afri-bg border border-afri-border rounded-lg px-2 py-1 text-[10px] font-mono text-afri-text outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div 
        ref={scrollContainerRef}
        className="w-full space-y-6"
      >
        {activeTab === "catalog" ? (
          filteredItems.length === 0 ? (
            <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-12 text-center space-y-3 mt-2">
              <Package className="w-10 h-10 text-afri-text-sec mx-auto opacity-40" />
              <p className="text-sm font-bold text-afri-text uppercase">Aucun article trouvé</p>
              <p className="text-xs text-afri-text-sec">Essayez une autre recherche ou modifiez vos filtres.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full pt-2">
              {filteredItems.map((item) => (
                <div
                key={item.id}
                className="bg-afri-bg-sec border border-afri-border/80 hover:border-[#D4AF37]/60 rounded-2xl overflow-hidden shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  {/* IMAGE PREVIEW */}
                  <div className="relative h-36 sm:h-44 w-full bg-black overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-bold font-mono text-[#D4AF37] uppercase truncate">
                      {item.condition}
                    </div>
                    <div className="absolute top-2 right-2 px-2.5 py-1 bg-[#D4AF37] text-black rounded-lg text-xs font-black font-mono shadow-md truncate">
                      {item.price.toLocaleString()} FCFA
                    </div>
                  </div>

                  {/* ITEM DETAILS */}
                  <div className="p-3 sm:p-4 space-y-2">
                    <h3 className="text-xs sm:text-sm font-black text-afri-text truncate group-hover:text-[#D4AF37] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-afri-text-sec truncate leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] text-afri-text-sec font-mono pt-1 border-t border-afri-border/40">
                      <MapPin className="w-3 h-3 text-[#D4AF37]" />
                      <span className="truncate">{item.location}</span>
                    </div>

                    {/* SELLER BADGE */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <img
                          src={item.sellerAvatar}
                          alt={item.sellerName}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-[#D4AF37]/40"
                        />
                        <span className="text-[10px] sm:text-[11px] font-bold text-afri-text truncate max-w-[80px] sm:max-w-[110px]">
                          {item.sellerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{item.sellerTrustScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD FOOTER */}
                <div className="p-2 sm:p-3 bg-afri-bg border-t border-afri-border/60 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="flex-1 py-1.5 sm:py-2 bg-afri-bg-ter hover:bg-[#D4AF37] hover:text-black text-[#D4AF37] text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                  >
                    Voir
                  </button>
                  <button
                    onClick={() => handleBuyItem(item)}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/40 rounded-xl transition-all cursor-pointer font-black text-[10px] sm:text-xs uppercase"
                    title="Acheter directement"
                  >
                    Acheter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === "my_listings" ? (
        /* MES ANNONCES TAB */
        myItems.length === 0 ? (
          <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-12 text-center space-y-4">
            <Store className="w-10 h-10 text-[#D4AF37] mx-auto opacity-60" />
            <h3 className="text-sm font-black text-afri-text uppercase">Vous n'avez aucune annonce en ligne</h3>
            <p className="text-xs text-afri-text-sec max-w-md mx-auto">
              Publiez votre matériel musical ou proposez vos services studio sur le Grand Marché d'AFRIGOMBO.
            </p>
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="px-5 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Publier une annonce</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myItems.map((item) => (
              <div
                key={item.id}
                className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 rounded-xl object-cover border border-afri-border shrink-0"
                  />
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-afri-text">{item.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="text-[#D4AF37] font-bold">{item.price.toLocaleString()} FCFA</span>
                      <span className="text-afri-text-sec">• {item.condition}</span>
                      <span className="text-afri-text-sec">• {item.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="px-3 py-1.5 bg-afri-bg border border-afri-border text-afri-text text-xs font-bold uppercase rounded-xl hover:bg-afri-bg-ter cursor-pointer"
                  >
                    Aperçu
                  </button>
                  <button
                    onClick={() => handleDeleteListing(item.id)}
                    className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase rounded-xl hover:bg-rose-500/25 cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* TABLEAU CRÉATEUR / VENDEUR TAB */
        <div className="space-y-6 text-left">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-1">
              <p className="text-[10px] text-afri-text-sec font-mono uppercase font-bold">📦 Produits publiés</p>
              <p className="text-lg font-black text-afri-text font-mono">{myItems.length}</p>
            </div>
            <div className="p-3.5 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-1">
              <p className="text-[10px] text-afri-text-sec font-mono uppercase font-bold">❤️ Favoris</p>
              <p className="text-lg font-black text-rose-400 font-mono">{favoriteIds.length * 6}</p>
            </div>
            <div className="p-3.5 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-1">
              <p className="text-[10px] text-afri-text-sec font-mono uppercase font-bold">👁 Nombre de vues</p>
              <p className="text-lg font-black text-emerald-400 font-mono">1 420</p>
            </div>
            <div className="p-3.5 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-1">
              <p className="text-[10px] text-afri-text-sec font-mono uppercase font-bold">💬 Questions reçues</p>
              <p className="text-lg font-black text-[#D4AF37] font-mono">14</p>
            </div>
            <div className="p-3.5 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-1">
              <p className="text-[10px] text-afri-text-sec font-mono uppercase font-bold">⭐ Note moyenne</p>
              <p className="text-lg font-black text-amber-400 font-mono">4.9 / 5.0</p>
            </div>
            <div className="p-3.5 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-1">
              <p className="text-[10px] text-afri-text-sec font-mono uppercase font-bold">📈 Produits tendance</p>
              <p className="text-xs font-black text-afri-text truncate">Yamaha Motif XF8</p>
            </div>
            <div className="p-3.5 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-1">
              <p className="text-[10px] text-afri-text-sec font-mono uppercase font-bold">💰 Revenus générés</p>
              <p className="text-lg font-black text-[#D4AF37] font-mono">230 000 FCFA</p>
            </div>
            <div className="p-3.5 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-1">
              <p className="text-[10px] text-afri-text-sec font-mono uppercase font-bold">📦 Produits vendus</p>
              <p className="text-lg font-black text-emerald-400 font-mono">2</p>
            </div>
          </div>

          <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black text-afri-text uppercase tracking-wider font-mono">Commandes & Ventes Récentes</h3>
            <div className="space-y-2">
              {[
                { id: "CMD-0891", item: "Yamaha MG10XU Table de mixage", buyer: "Sery G.", status: "Terminée", amount: 145000, date: "26 Juillet 2026" },
                { id: "CMD-0872", item: "Casque Shure SRH840A", buyer: "N'Guessan A.", status: "En attente livraison", amount: 85000, date: "27 Juillet 2026" }
              ].map((cmd) => (
                <div key={cmd.id} className="p-3 bg-afri-bg border border-afri-border/60 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#D4AF37] font-bold">{cmd.id}</span>
                      <span className="font-bold text-afri-text">{cmd.item}</span>
                    </div>
                    <p className="text-[10px] text-afri-text-sec font-mono">Acheteur : {cmd.buyer} • {cmd.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      cmd.status === "Terminée" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}>
                      {cmd.status}
                    </span>
                    <span className="font-mono font-bold text-afri-text">{cmd.amount.toLocaleString()} FCFA</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

      {/* DETAIL ITEM MODAL */}
      <AfriModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title}
        subtitle={`Catégorie: ${selectedItem?.category.toUpperCase()} • ${selectedItem?.location}`}
      >
        {selectedItem && (
          <div className="space-y-4 text-left">
            <div className="relative h-56 w-full rounded-xl overflow-hidden border border-afri-border bg-black">
              <img
                src={selectedItem.image}
                alt={selectedItem.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 px-3 py-1 bg-[#D4AF37] text-black text-sm font-black font-mono rounded-lg shadow-lg">
                {selectedItem.price.toLocaleString()} FCFA
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-afri-text uppercase tracking-wider font-mono">Description du produit</h4>
              <p className="text-xs text-afri-text-sec leading-relaxed bg-afri-bg p-3 rounded-xl border border-afri-border/60">
                {selectedItem.description}
              </p>
            </div>

            {/* SELLER INFORMATIONS */}
            <div className="p-3 bg-afri-bg rounded-xl border border-afri-border/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedItem.sellerAvatar}
                  alt={selectedItem.sellerName}
                  className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]"
                />
                <div>
                  <h5 className="text-xs font-black text-afri-text flex items-center gap-1.5">
                    {selectedItem.sellerName}
                    {selectedItem.sellerCertified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                  </h5>
                  <p className="text-[10px] text-afri-text-sec font-mono">
                    Score de confiance : <strong className="text-emerald-400">{selectedItem.sellerTrustScore}%</strong>
                  </p>
                </div>
              </div>

              {selectedItem.phone && (
                <button
                  onClick={() => {
                    supportConfig.openSupport(`Bonjour, je suis intéressé par votre annonce sur le Grand Marché AFRIGOMBO : ${selectedItem.title}`);
                  }}
                  className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Contacter</span>
                </button>
              )}
            </div>

            {/* ACTION BUTTON */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 py-2.5 bg-afri-bg border border-afri-border text-afri-text text-xs font-bold uppercase rounded-xl cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={() => handleBuyItem(selectedItem)}
                className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-md flex justify-center items-center gap-1.5"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Acheter (Gombo Wallet)</span>
              </button>
            </div>
          </div>
        )}
      </AfriModal>

      {/* INFO / RULES MODAL */}
      <AfriModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Règles & Sécurité du Grand Marché"
        subtitle="Séquestre AfriTrust, commission 5% et conditions vendeur"
      >
        <div className="space-y-4 text-left">
          <div className="p-3.5 bg-afri-bg border border-[#D4AF37]/40 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase font-mono">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>1. Séquestre AfriTrust & Commission 5%</span>
            </div>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Pour chaque transaction sur Le Grand Marché (achat, vente ou location d'équipement musical), AFRIGOMBO sécurise les fonds via son compte séquestre <strong>AfriTrust</strong>. Les fonds sont débloqués au vendeur dès la confirmation de livraison par l'acheteur. Une commission de <strong>5%</strong> est automatiquement prélevée pour l'assurance matériel et la gestion des litiges.
            </p>
          </div>

          <div className="p-3.5 bg-afri-bg border border-afri-border rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase font-mono">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>2. Conditions d'Éligibilité Vendeur</span>
            </div>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Afin d'éviter les fraudes et garantir du matériel en bon état, le droit de publier une annonce nécessite de remplir AU MOINS l'un de ces critères :
            </p>
            <ul className="text-xs text-afri-text-sec space-y-1.5 list-disc pl-4 font-mono">
              <li>Posséder un <strong>Score de Confiance ≥ 70%</strong>.</li>
              <li>Être abonné <strong>GOMBO PLUS / PRO / Elite</strong>.</li>
              <li>Avoir validé au moins <strong>3 Gombos ou prestations sans litige</strong>.</li>
            </ul>
          </div>

          <div className="p-3.5 bg-afri-bg border border-emerald-500/30 rounded-xl space-y-1 text-xs">
            <span className="font-bold text-emerald-400 font-mono block">Votre Statut Actuel :</span>
            <div className="flex justify-between items-center text-afri-text font-mono pt-1">
              <span>Score de Confiance :</span>
              <span className={`font-bold ${trustScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {trustScore}% / 100
              </span>
            </div>
            <div className="flex justify-between items-center text-afri-text font-mono">
              <span>Accès Publication :</span>
              <span className={`font-bold ${canPublish ? 'text-emerald-400' : 'text-rose-400'}`}>
                {canPublish ? '✓ Autorisée' : '❌ Restreinte (Score < 70%)'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsInfoModalOpen(false)}
            className="w-full py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-md"
          >
            J'ai compris, Fermer
          </button>
        </div>
      </AfriModal>

      {/* PUBLISH LISTING MODAL WITH RESTRICTION GUARD */}
      <AfriModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="Publier sur le Grand Marché"
        subtitle="Achat / Vente d'équipement musical sécurisé"
      >
        {!canPublish ? (
          /* RESTRICTED ACCESS SCREEN FOR SELLING */
          <div className="space-y-4 py-2 text-left">
            <div className="p-4 bg-gradient-to-b from-amber-500/15 to-afri-bg border border-amber-500/40 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-afri-text uppercase tracking-tight">
                Accès Restreint - Score de Confiance Insuffisant
              </h3>
              <p className="text-xs text-afri-text-sec leading-relaxed">
                Afin de garantir des ventes 100% vérifiées sur le Grand Marché, la publication d'annonces exige un <strong>Score de Confiance de 70%</strong> minimum ou un statut <strong>PRO / Elite</strong>.
              </p>
            </div>

            {/* SCORE PROGRESS */}
            <div className="p-3.5 bg-afri-bg border border-afri-border rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-afri-text-sec">Votre Score de Confiance :</span>
                <span className="text-amber-400 font-mono">{trustScore}% / 100</span>
              </div>
              <div className="w-full h-2.5 bg-afri-bg-sec rounded-full overflow-hidden border border-afri-border/60">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (trustScore / 70) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-afri-text-sec font-mono">
                Requis : 70% minimum (Actuel : {trustScore}%)
              </p>
            </div>

            {/* UNLOCK ACTIONS */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setIsPublishModalOpen(false);
                  if (onNavigateView) onNavigateView("user_gombo_id");
                }}
                className="w-full py-2.5 bg-afri-bg border border-[#D4AF37]/60 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Booster mon Score de Confiance (GOMBO ID)</span>
              </button>

              <button
                onClick={() => {
                  setIsPublishModalOpen(false);
                  if (onNavigateView) onNavigateView("user_gombo_plus");
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-afri-gold hover:brightness-110 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crown className="w-4 h-4 text-black" />
                <span>Devenir Vendeur Premium PRO</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>

              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="w-full py-2 bg-afri-bg border border-afri-border hover:bg-afri-bg-ter text-afri-text-sec hover:text-afri-text text-xs font-bold uppercase rounded-xl transition-all cursor-pointer text-center"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          /* FORM TO PUBLISH LISTING */
          <form onSubmit={handlePublishListing} className="space-y-3.5 text-left">
            <div>
              <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                Titre de l'annonce *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Table de mixage Yamaha MG10XU"
                className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                  Catégorie
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="instruments">🎹 Instruments</option>
                  <option value="studio">🎙️ Studio & M.A.O</option>
                  <option value="sonorisation">🎛️ Sonorisation</option>
                  <option value="services">🎧 Services</option>
                  <option value="accessoires">🔌 Accessoires</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                  État
                </label>
                <select
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value as any)}
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="Neuf">Neuf</option>
                  <option value="Excellent état">Excellent état</option>
                  <option value="Bon état">Bon état</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                  Prix (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Ex: 150000"
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                  Localisation
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Ex: Abidjan, Cocody"
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                Lien de la photo (URL optionnelle)
              </label>
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block mb-1">
                Description détaillée *
              </label>
              <textarea
                required
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Décrivez l'équipement, les accessoires inclus et le mode de retrait..."
                className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 cursor-pointer"
              >
                <span>Mettre en vente sur le Grand Marché</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </form>
        )}
      </AfriModal>

      {/* BUY SUCCESS MODAL */}
      <AfriModal
        isOpen={isBuySuccessModalOpen}
        onClose={() => setIsBuySuccessModalOpen(false)}
        type="success"
        title="Commande Confirmée !"
      >
        <div className="space-y-2">
          <p className="font-bold text-afri-text">{boughtItemTitle}</p>
          <p className="text-xs text-afri-text-sec leading-relaxed">
            Votre demande d'achat a été enregistrée avec succès sous la garantie de sequestre <strong>AfriTrust</strong>. Le vendeur a été notifié.
          </p>
        </div>
      </AfriModal>

      {/* INSUFFICIENT BALANCE MODAL */}
      {isInsufficientBalanceModalOpen && insufficientBalanceDetails && (
        <AfriModal
          isOpen={true}
          onClose={() => setIsInsufficientBalanceModalOpen(false)}
          title="Solde insuffisant"
        >
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <div className="space-y-1.5">
              <h3 className="font-black text-afri-text uppercase text-sm">Solde Wallet Insuffisant</h3>
              <p className="text-xs text-afri-text-sec leading-relaxed">
                Votre solde actuel ne couvre pas le coût de cet article. Veuillez recharger votre portefeuille.
              </p>
            </div>
            <div className="p-4 bg-afri-bg rounded-xl border border-afri-border text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-afri-text-sec">Solde actuel :</span>
                <span className="text-rose-500 font-bold">{insufficientBalanceDetails.current.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-afri-text-sec">Montant requis :</span>
                <span className="text-afri-text font-bold">{insufficientBalanceDetails.required.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between border-t border-afri-border pt-2 font-bold">
                <span className="text-[#D4AF37]">Montant manquant :</span>
                <span className="text-[#D4AF37]">{insufficientBalanceDetails.missing.toLocaleString()} FCFA</span>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsInsufficientBalanceModalOpen(false)}
                className="flex-1 py-2.5 bg-afri-bg border border-afri-border hover:bg-afri-bg-sec text-afri-text-sec text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setIsInsufficientBalanceModalOpen(false);
                  localStorage.setItem("afrigombo_suggested_deposit_amount", String(insufficientBalanceDetails.missing));
                  localStorage.setItem(
                    "afrigombo_pending_purchase",
                    JSON.stringify({ type: "grand_marche", item: { price: insufficientBalanceDetails.required, title: boughtItemTitle || "Article du Marché" } })
                  );
                  if (onNavigateView) {
                    onNavigateView("user_wallet");
                  }
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-md"
              >
                Recharger mon Wallet
              </button>
            </div>
          </div>
        </AfriModal>
      )}

      {/* PENDING RESUME MODAL */}
      {pendingResumeItem && (
        <AfriModal
          isOpen={true}
          onClose={() => {
            localStorage.removeItem("afrigombo_pending_purchase");
            setPendingResumeItem(null);
          }}
          title="Finaliser l'achat en suspens"
        >
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-xl">
              ✓
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-afri-text uppercase text-sm">Solde suffisant !</h3>
              <p className="text-xs text-afri-text-sec">
                Votre solde Wallet est désormais suffisant ({currentUserProfile?.wallet?.soldeDisponible?.toLocaleString()} FCFA). Souhaitez-vous finaliser l'achat de l'article suivant ?
              </p>
            </div>
            <div className="p-3 bg-afri-bg rounded-xl border border-afri-border text-left text-xs">
              <div className="font-bold text-afri-text">{pendingResumeItem.title}</div>
              <div className="text-[#D4AF37] font-mono font-bold mt-1">{pendingResumeItem.price.toLocaleString()} FCFA</div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  localStorage.removeItem("afrigombo_pending_purchase");
                  setPendingResumeItem(null);
                }}
                className="flex-1 py-2 bg-afri-bg-sec border border-afri-border hover:bg-afri-bg-ter text-afri-text text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const itemToBuy = pendingResumeItem;
                  localStorage.removeItem("afrigombo_pending_purchase");
                  setPendingResumeItem(null);
                  handleBuyItem(itemToBuy);
                }}
                className="flex-1 py-2 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-md"
              >
                Confirmer l'achat
              </button>
            </div>
          </div>
        </AfriModal>
      )}

    </div>
  );
};
export default GrandMarcheView;
