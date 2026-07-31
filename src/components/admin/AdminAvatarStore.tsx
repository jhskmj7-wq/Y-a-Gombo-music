import React, { useState, useEffect } from "react";
import { 
  Crown, Plus, Edit, Trash2, Copy, Sparkles, Image as ImageIcon, 
  Check, X, Eye, ShieldCheck, RefreshCw, Layers, Palette, Wand2, Upload,
  Coins, Zap, TrendingUp, Users, Gift, Clock, DollarSign
} from "lucide-react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase";
import { AvatarEngine } from "../../lib/avatarEngine";
import { AvatarEconomyStats } from "../../types/avatar";

export interface AvatarItemExtended {
  id: string;
  name: string;
  category: string;
  price: number;
  isPremiumOnly: boolean;
  imageUrl?: string;
  svgContent?: string;
  description?: string;
  color?: string;
  rarity?: "Commune" | "Rare" | "Épique" | "Légendaire" | "Royale";
  animation?: "Fixe" | "Flottant" | "Scintillant" | "Ondulation" | "Super-Glow";
  isActive: boolean;
  isLimited?: boolean;
  totalStock?: number;
  remainingStock?: number;
  requiredLevel?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminAvatarStore() {
  const [items, setItems] = useState<AvatarItemExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stats, setStats] = useState<AvatarEconomyStats | null>(null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCoinsModalOpen, setIsCoinsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AvatarItemExtended | null>(null);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("vêtements");
  const [formPrice, setFormPrice] = useState(500);
  const [formIsPremium, setFormIsPremium] = useState(false);
  const [formIsLimited, setFormIsLimited] = useState(false);
  const [formTotalStock, setFormTotalStock] = useState<number>(100);
  const [formRequiredLevel, setFormRequiredLevel] = useState<number>(1);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formSvgContent, setFormSvgContent] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("#D4AF37");
  const [formRarity, setFormRarity] = useState<AvatarItemExtended["rarity"]>("Commune");
  const [formAnimation, setFormAnimation] = useState<AvatarItemExtended["animation"]>("Fixe");
  const [formIsActive, setFormIsActive] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Coins Adjustment Form
  const [targetUserId, setTargetUserId] = useState("");
  const [coinsDelta, setCoinsDelta] = useState(500);
  const [xpDelta, setXpDelta] = useState(100);
  const [adjustReason, setAdjustReason] = useState("Récompense Super Fondateur");
  const [adjustingCoins, setAdjustingCoins] = useState(false);

  // AI Prompt Form
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiCategory, setAiCategory] = useState("vêtements");
  const [aiGenerating, setAiGenerating] = useState(false);

  const categories = [
    { key: "vêtements", label: "👕 Vêtements" },
    { key: "chaussures", label: "👟 Chaussures" },
    { key: "accessoires", label: "👓 Accessoires" },
    { key: "couronnes", label: "👑 Couronnes & Chapeaux" },
    { key: "instruments", label: "🪘 Instruments" },
    { key: "coiffures", label: "💇 Coiffures" },
    { key: "animations", label: "✨ Animations" },
    { key: "arriere-plans", label: "🌅 Arrière-plans" },
    { key: "visage", label: "🎭 Visage & Maquillage" }
  ];

  const rarities = ["Commune", "Rare", "Épique", "Légendaire", "Royale"];
  const animations = ["Fixe", "Flottant", "Scintillant", "Ondulation", "Super-Glow"];

  // Realtime Firestore sync
  useEffect(() => {
    const q = query(collection(db, "avatarItems"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as AvatarItemExtended[];
      setItems(list);
      setLoading(false);
    }, (err) => {
      console.warn("Avatar items sync warning:", err);
      setLoading(false);
    });

    // Fetch Economy Stats
    AvatarEngine.getEconomyStats().then(s => setStats(s)).catch(() => {});

    return () => unsubscribe();
  }, []);

  const handleAdminAdjustCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim()) return;

    setAdjustingCoins(true);
    try {
      await AvatarEngine.adminAdjustCoins(targetUserId.trim(), coinsDelta, xpDelta, adjustReason);
      alert(`Ajustement réussi ! ${coinsDelta} Coins et ${xpDelta} XP attribués.`);
      setIsCoinsModalOpen(false);
      setTargetUserId("");
    } catch (err: any) {
      console.error("Admin adjust error:", err);
      alert("Erreur lors de l'ajustement: " + (err.message || "Echec"));
    } finally {
      setAdjustingCoins(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormName("");
    setFormCategory("vêtements");
    setFormPrice(500);
    setFormIsPremium(false);
    setFormImageUrl("");
    setFormSvgContent("");
    setFormDescription("");
    setFormColor("#D4AF37");
    setFormRarity("Commune");
    setFormAnimation("Fixe");
    setFormIsActive(true);
    setIsFormOpen(true);
  };

  const openEditModal = (item: AvatarItemExtended) => {
    setEditingItem(item);
    setFormName(item.name || "");
    setFormCategory(item.category || "vêtements");
    setFormPrice(item.price || 0);
    setFormIsPremium(!!item.isPremiumOnly);
    setFormImageUrl(item.imageUrl || "");
    setFormSvgContent(item.svgContent || "");
    setFormDescription(item.description || "");
    setFormColor(item.color || "#D4AF37");
    setFormRarity(item.rarity || "Commune");
    setFormAnimation(item.animation || "Fixe");
    setFormIsActive(item.isActive !== false);
    setIsFormOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      if (storage) {
        const storageRef = ref(storage, `avatarItems/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setFormImageUrl(url);
      } else {
        // Fallback to Base64 data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn("Error uploading file, converting to data URL:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload = {
      name: formName.trim(),
      category: formCategory,
      price: Number(formPrice) || 0,
      isPremiumOnly: formIsPremium,
      imageUrl: formImageUrl,
      svgContent: formSvgContent,
      description: formDescription,
      color: formColor,
      rarity: formRarity,
      animation: formAnimation,
      isActive: formIsActive,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingItem) {
        await updateDoc(doc(db, "avatarItems", editingItem.id), payload);
      } else {
        await addDoc(collection(db, "avatarItems"), {
          ...payload,
          createdAt: new Date().toISOString()
        });
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error("Error saving avatar item:", err);
      alert("Erreur lors de l'enregistrement de l'article.");
    }
  };

  const handleDuplicateItem = async (item: AvatarItemExtended) => {
    try {
      const { id, ...itemWithoutId } = item;
      await addDoc(collection(db, "avatarItems"), {
        ...itemWithoutId,
        name: `${item.name} (Copie)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error duplicating item:", err);
    }
  };

  const handleToggleActive = async (item: AvatarItemExtended) => {
    try {
      await updateDoc(doc(db, "avatarItems", item.id), {
        isActive: !item.isActive,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error toggling active state:", err);
    }
  };

  const handleTogglePremium = async (item: AvatarItemExtended) => {
    try {
      await updateDoc(doc(db, "avatarItems", item.id), {
        isPremiumOnly: !item.isPremiumOnly,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error toggling premium state:", err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cet article de la boutique Avatar ?")) {
      try {
        await deleteDoc(doc(db, "avatarItems", id));
      } catch (err) {
        console.error("Error deleting item:", err);
      }
    }
  };

  const handleGenerateAiItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setAiGenerating(true);
    setTimeout(async () => {
      // Simulate AI asset generation architecture preparation
      const newItem = {
        name: `Création IA : ${aiPrompt.slice(0, 20)}...`,
        category: aiCategory,
        price: 1500,
        isPremiumOnly: true,
        imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80",
        description: `Généré par Griot IA: ${aiPrompt}`,
        color: "#D4AF37",
        rarity: "Légendaire" as const,
        animation: "Scintillant" as const,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await addDoc(collection(db, "avatarItems"), newItem);
        setAiPrompt("");
        setIsAiModalOpen(false);
      } catch (err) {
        console.error("Error saving AI item:", err);
      } finally {
        setAiGenerating(false);
      }
    }, 1500);
  };

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-afri-bg-sec border border-afri-border p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-afri-text uppercase tracking-wider font-sans">
              AVATAR STORE — MOTEUR D'ARTICLES
            </h2>
            <p className="text-xs text-afri-text-sec font-mono">
              Création, tarification, animations et collections officielles de la boutique Avatar
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCoinsModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2"
          >
            <Coins className="w-4 h-4 text-emerald-400" />
            🪙 Crédit Manuel Coins
          </button>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-4 py-2 bg-afri-bg-ter hover:bg-zinc-700 text-[#D4AF37] border border-[#D4AF37]/40 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            ✨ Générer avec IA
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#D4AF37] text-black hover:bg-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Créer un article
          </button>
        </div>
      </div>

      {/* KPI Economy Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-afri-text-muted uppercase font-bold">Total Articles Vendus</div>
            <div className="text-lg font-black text-afri-text font-mono">
              {stats?.totalItemsSold ?? 0} Ventes
            </div>
          </div>
        </div>

        <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-afri-text-muted uppercase font-bold">Coins Échangés</div>
            <div className="text-lg font-black text-[#D4AF37] font-mono">
              {(stats?.totalCoinsGenerated ?? 0).toLocaleString("fr-FR")} C
            </div>
          </div>
        </div>

        <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-afri-text-muted uppercase font-bold">Valeur Économique</div>
            <div className="text-lg font-black text-emerald-400 font-mono">
              {(stats?.totalRevenueFcfa ?? 0).toLocaleString("fr-FR")} FCFA
            </div>
          </div>
        </div>

        <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-afri-text-muted uppercase font-bold">Collectionneurs Actifs</div>
            <div className="text-lg font-black text-afri-text font-mono">
              {stats?.activeUsersCount ?? 0} Membres
            </div>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer whitespace-nowrap ${
            selectedCategory === "all"
              ? "bg-[#D4AF37] text-black"
              : "bg-afri-bg-sec text-afri-text-sec border border-afri-border hover:text-afri-text"
          }`}
        >
          Tous ({items.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer whitespace-nowrap ${
              selectedCategory === cat.key
                ? "bg-[#D4AF37] text-black"
                : "bg-afri-bg-sec text-afri-text-sec border border-afri-border hover:text-afri-text"
            }`}
          >
            {cat.label} ({items.filter((i) => i.category === cat.key).length})
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="p-12 text-center text-afri-text-muted font-mono text-xs">
          Chargement des articles de l'Avatar Store...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 bg-afri-bg-sec border border-afri-border rounded-3xl text-center space-y-3">
          <Crown className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-afri-text-sec text-xs font-mono">Aucun article trouvé.</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#D4AF37] text-black font-bold text-xs uppercase rounded-xl"
          >
            Créer le premier article
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-afri-bg-sec border rounded-3xl p-4 flex flex-col justify-between gap-4 transition relative ${
                item.isActive
                  ? "border-afri-border hover:border-[#D4AF37]/50"
                  : "border-zinc-800/40 opacity-60"
              }`}
            >
              {/* Item preview header */}
              <div className="space-y-3">
                <div className="relative aspect-square bg-afri-bg border border-zinc-800/80 rounded-2xl overflow-hidden flex items-center justify-center p-4">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  ) : item.svgContent ? (
                    <div
                      className="w-20 h-20"
                      dangerouslySetInnerHTML={{ __html: item.svgContent }}
                    />
                  ) : (
                    <div className="text-3xl">🎭</div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {item.isPremiumOnly && (
                      <span className="px-2 py-0.5 bg-[#D4AF37] text-black text-[9px] font-black uppercase rounded-full flex items-center gap-1 shadow">
                        👑 Premium
                      </span>
                    )}
                    {item.rarity && (
                      <span className="px-2 py-0.5 bg-afri-bg-sec text-afri-text-sec border border-afri-border text-[8px] font-mono font-bold rounded-full">
                        {item.rarity}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`px-2 py-0.5 text-[8px] font-mono font-bold uppercase rounded-full border ${
                        item.isActive
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {item.isActive ? "Disponible" : "Masqué"}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#D4AF37] uppercase font-bold">
                      {item.category}
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-400">
                      {item.price.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-afri-text uppercase">{item.name}</h3>
                  {item.description && (
                    <p className="text-[11px] text-afri-text-sec line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 bg-afri-bg-ter hover:bg-zinc-700 text-afri-text-sec rounded-xl text-xs transition cursor-pointer"
                    title="Modifier"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicateItem(item)}
                    className="p-2 bg-afri-bg-ter hover:bg-zinc-700 text-afri-text-sec rounded-xl text-xs transition cursor-pointer"
                    title="Dupliquer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleTogglePremium(item)}
                    className={`p-2 rounded-xl text-xs transition cursor-pointer ${
                      item.isPremiumOnly
                        ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                        : "bg-afri-bg-ter text-afri-text-muted hover:text-afri-text"
                    }`}
                    title="Toggle Premium"
                  >
                    <Crown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs transition cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal: Create / Edit Article */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-afri-bg/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-afri-bg-sec border border-afri-border rounded-3xl w-full max-w-xl p-6 space-y-5 animate-scaleUp text-left my-8">
            <div className="flex items-center justify-between border-b border-afri-border pb-4">
              <h3 className="text-base font-black text-afri-text uppercase flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#D4AF37]" />
                {editingItem ? "Modifier l'article Avatar" : "Créer un article Avatar"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-afri-text-sec hover:text-afri-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-afri-text-sec font-bold uppercase">Nom de l'article *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ex: Boubou Royal Doré"
                    className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2.5 text-afri-text focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-afri-text-sec font-bold uppercase">Catégorie</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2.5 text-afri-text focus:border-[#D4AF37] focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-afri-text-sec font-bold uppercase">Prix (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2.5 text-afri-text focus:border-[#D4AF37] focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-afri-text-sec font-bold uppercase">Rareté</label>
                  <select
                    value={formRarity}
                    onChange={(e) => setFormRarity(e.target.value as any)}
                    className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2.5 text-afri-text focus:border-[#D4AF37] focus:outline-none"
                  >
                    {rarities.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-afri-text-sec font-bold uppercase">Animation</label>
                  <select
                    value={formAnimation}
                    onChange={(e) => setFormAnimation(e.target.value as any)}
                    className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2.5 text-afri-text focus:border-[#D4AF37] focus:outline-none"
                  >
                    {animations.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-afri-text-sec font-bold uppercase">Couleur Thématique</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-10 h-10 bg-afri-bg border border-afri-border rounded-xl p-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="flex-1 bg-afri-bg border border-afri-border rounded-xl px-3 py-2.5 text-afri-text font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Image upload / URL */}
              <div className="space-y-2 bg-afri-bg p-4 rounded-2xl border border-afri-border">
                <label className="text-afri-text-sec font-bold uppercase block">Visuel / Fichier Image</label>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="avatar-image-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="avatar-image-upload"
                    className="px-3 py-2 bg-afri-bg-ter hover:bg-zinc-700 text-afri-text rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-[#D4AF37]" />
                    {uploadingImage ? "Téléversement..." : "Charger un fichier image"}
                  </label>
                  <span className="text-[10px] text-afri-text-muted">ou entrez une URL ci-dessous</span>
                </div>

                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-2 text-afri-text font-mono text-[11px]"
                />

                {formImageUrl && (
                  <div className="w-16 h-16 bg-afri-bg-sec rounded-xl border border-afri-border overflow-hidden flex items-center justify-center mt-2">
                    <img src={formImageUrl} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-afri-text-sec font-bold uppercase">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brève description de la pièce ou de sa signification..."
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-afri-text focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-afri-bg rounded-2xl border border-afri-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPremium}
                    onChange={(e) => setFormIsPremium(e.target.checked)}
                    className="w-4 h-4 accent-[#D4AF37]"
                  />
                  <span className="font-bold text-afri-text uppercase">Réservé aux membres Premium 👑</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span className="font-bold text-afri-text uppercase">Disponible en boutique ✓</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-afri-border">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-afri-bg-ter hover:bg-zinc-700 text-afri-text-sec font-bold uppercase rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#D4AF37] hover:bg-white text-black font-black uppercase rounded-xl transition cursor-pointer"
                >
                  {editingItem ? "Enregistrer modifications" : "Publier l'article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Preparation Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-afri-bg/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-afri-bg-sec border border-afri-border rounded-3xl w-full max-w-md p-6 space-y-4 animate-scaleUp text-left">
            <div className="flex items-center justify-between border-b border-afri-border pb-3">
              <h3 className="text-sm font-black text-afri-text uppercase flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                Moteur de Génération IA Avatar
              </h3>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-2 text-afri-text-sec hover:text-afri-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-afri-text-sec">
              Générez automatiquement des tenues, bijoux, instruments ou couronnes traditionnels africains vectorisés.
            </p>

            <form onSubmit={handleGenerateAiItem} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-afri-text-sec font-bold uppercase">Prompt de création</label>
                <textarea
                  rows={3}
                  required
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="ex: Boubou royal Akan en tissu Kente orné de pépites d'or et broderies..."
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-afri-text focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-afri-text-sec font-bold uppercase">Catégorie cible</label>
                <select
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value)}
                  className="w-full bg-afri-bg border border-afri-border rounded-xl px-3 py-2.5 text-afri-text focus:border-[#D4AF37] focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-afri-border">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 bg-afri-bg-ter hover:bg-zinc-700 text-afri-text-sec font-bold uppercase rounded-xl"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="px-5 py-2 bg-[#D4AF37] text-black font-black uppercase rounded-xl hover:bg-white transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Wand2 className={`w-4 h-4 ${aiGenerating ? "animate-spin" : ""}`} />
                  {aiGenerating ? "Génération..." : "Générer l'article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Admin Manual Coins & XP Adjustment Modal */}
      {isCoinsModalOpen && (
        <div className="fixed inset-0 z-50 bg-afri-bg/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-afri-bg-sec border border-afri-border rounded-3xl w-full max-w-md p-6 space-y-4 animate-scaleUp text-left">
            <div className="flex items-center justify-between border-b border-afri-border pb-3">
              <h3 className="text-sm font-black text-afri-text uppercase flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-400" />
                Ajustement Manuel de Gombo Coins & XP
              </h3>
              <button
                onClick={() => setIsCoinsModalOpen(false)}
                className="p-2 text-afri-text-sec hover:text-afri-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-afri-text-sec">
              Attribuez ou retirez directement des Gombo Coins et des points d'expérience (XP) à un membre.
            </p>

            <form onSubmit={handleAdminAdjustCoins} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-afri-text-sec font-bold uppercase">ID Utilisateur (UID)</label>
                <input
                  type="text"
                  required
                  placeholder="UID du membre dans Firebase..."
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-afri-text focus:border-[#D4AF37] focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-afri-text-sec font-bold uppercase">Gombo Coins (Δ)</label>
                  <input
                    type="number"
                    value={coinsDelta}
                    onChange={(e) => setCoinsDelta(Number(e.target.value))}
                    className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-[#D4AF37] font-mono font-bold focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-afri-text-sec font-bold uppercase">XP (Δ)</label>
                  <input
                    type="number"
                    value={xpDelta}
                    onChange={(e) => setXpDelta(Number(e.target.value))}
                    className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-emerald-400 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-afri-text-sec font-bold uppercase">Motif de la transaction</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="ex: Concours, Récompense Spéciale, Correction..."
                  className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-afri-text focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-afri-border">
                <button
                  type="button"
                  onClick={() => setIsCoinsModalOpen(false)}
                  className="px-4 py-2 bg-afri-bg-ter hover:bg-zinc-700 text-afri-text-sec font-bold uppercase rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={adjustingCoins || !targetUserId.trim()}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-xl transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {adjustingCoins ? "Enregistrement..." : "Appliquer l'ajustement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
