import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Pin, Eye, EyeOff, Trash2, ArrowUp, ArrowDown, 
  Plus, Search, ShoppingBag, GraduationCap, ShieldCheck, 
  CheckCircle, AlertTriangle, Edit3, Save, RefreshCw, Star
} from "lucide-react";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { 
  FeaturedContentDoc, 
  DEFAULT_FEATURED_ITEMS,
  saveOrUpdateFeaturedDoc, 
  togglePinFeaturedDoc, 
  toggleHideFeaturedDoc, 
  removeFeaturedDoc, 
  updatePriorityFeaturedDoc, 
  seedInitialFeaturedContentIfEmpty 
} from "../../lib/decouvertesEngine";
import { AfriModal } from "../common/AfriModal";

interface AdminDecouvertesCentreProps {
  audioSynth?: any;
}

export const AdminDecouvertesCentre: React.FC<AdminDecouvertesCentreProps> = ({ audioSynth }) => {
  const [items, setItems] = useState<FeaturedContentDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"all" | "market" | "academy">("all");
  
  // Modal for adding / editing items
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Partial<FeaturedContentDoc> | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Firestore live sync
  useEffect(() => {
    seedInitialFeaturedContentIfEmpty();

    const colRef = collection(db, "featuredContent");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const loaded: FeaturedContentDoc[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push({ id: docSnap.id, ...docSnap.data() } as FeaturedContentDoc);
      });
      setItems(loaded.length > 0 ? loaded : DEFAULT_FEATURED_ITEMS);
      setLoading(false);
    }, (err) => {
      console.warn("Error in AdminDecouvertesCentre snapshot:", err);
      setItems(DEFAULT_FEATURED_ITEMS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Filter & Order
  const filteredItems = items
    .filter(item => {
      if (typeFilter === "market") return item.type === "market";
      if (typeFilter === "academy") return item.type === "academy";
      return true;
    })
    .filter(item => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        (item?.title ?? "").toLowerCase().includes(term) ||
        (item?.description ?? "").toLowerCase().includes(term) ||
        (item?.city ?? "").toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      // Pinned top, then by priority desc
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (b.priority || 0) - (a.priority || 0);
    });

  // Handlers
  const handleTogglePin = async (item: FeaturedContentDoc) => {
    try { audioSynth?.playTamTam?.(false); } catch (_) {}
    const res = await togglePinFeaturedDoc(item.id, item.pinned);
    if (res.success) {
      showStatus(item.pinned ? "📌 Contenu désépinglé !" : "📌 Contenu épinglé en tête du fil !");
    }
  };

  const handleToggleHide = async (item: FeaturedContentDoc) => {
    try { audioSynth?.playTamTam?.(false); } catch (_) {}
    const res = await toggleHideFeaturedDoc(item.id, item.hidden);
    if (res.success) {
      showStatus(item.hidden ? "👁️ Contenu réaffiché !" : "🙈 Contenu masqué du fil public.");
    }
  };

  const handlePriorityChange = async (item: FeaturedContentDoc, delta: number) => {
    try { audioSynth?.playTamTam?.(false); } catch (_) {}
    const newPriority = Math.max(1, (item.priority || 5) + delta);
    const res = await updatePriorityFeaturedDoc(item.id, newPriority);
    if (res.success) {
      showStatus(`⚡ Priorité ajustée à ${newPriority}`);
    }
  };

  const handleDelete = async (item: FeaturedContentDoc) => {
    if (window.confirm(`Voulez-vous vraiment retirer "${item.title}" du Fil Découvertes ?`)) {
      try { audioSynth?.playTamTam?.(false); } catch (_) {}
      const res = await removeFeaturedDoc(item.id);
      if (res.success) {
        showStatus("🗑️ Contenu supprimé du Fil Découvertes.");
      }
    }
  };

  const handleOpenAddModal = (type: "market" | "academy") => {
    setEditingItem({
      id: `feat_${type}_${Date.now()}`,
      type,
      sourceId: `source_${Date.now()}`,
      title: "",
      description: "",
      price: 0,
      priceText: "",
      city: "Abidjan, Cocody",
      duration: type === "academy" ? "2h 00m" : undefined,
      level: type === "academy" ? "Tous niveaux" : undefined,
      category: type === "market" ? "instruments" : "mao",
      imageUrl: type === "market" 
        ? "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600" 
        : "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
      priority: 5,
      pinned: false,
      hidden: false,
      createdAt: Date.now()
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title || !editingItem.id) return;

    try { audioSynth?.playValidationSuccess?.(); } catch (_) {}

    const payload: FeaturedContentDoc = {
      id: editingItem.id,
      type: editingItem.type || "market",
      sourceId: editingItem.sourceId || `src_${Date.now()}`,
      title: editingItem.title,
      description: editingItem.description || "",
      price: Number(editingItem.price) || 0,
      priceText: editingItem.priceText || "",
      city: editingItem.city || "Abidjan",
      duration: editingItem.duration,
      level: editingItem.level,
      category: editingItem.category,
      imageUrl: editingItem.imageUrl || "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600",
      priority: Number(editingItem.priority) || 5,
      pinned: !!editingItem.pinned,
      hidden: !!editingItem.hidden,
      viewsCount: editingItem.viewsCount || 0,
      clicksCount: editingItem.clicksCount || 0,
      createdAt: editingItem.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    const res = await saveOrUpdateFeaturedDoc(payload);
    if (res.success) {
      showStatus("✅ Contenu enregistré avec succès dans Firestore !");
      setIsModalOpen(false);
      setEditingItem(null);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans text-afri-text p-4 sm:p-6 bg-afri-bg-sec/30 rounded-3xl border border-afri-border">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-black border border-[#D4AF37] text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold"
          >
            <Sparkles className="w-4 h-4 text-[#D4AF37] fill-current animate-pulse" />
            <span>{statusMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-3xl bg-gradient-to-r from-afri-bg-sec via-afri-bg-sec to-afri-bg border border-[#D4AF37]/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-2xl text-[#D4AF37]">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black uppercase text-afri-text tracking-wider">
                ADMINISTRATION — FIL DÉCOUVERTES
              </h2>
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                SUPER FONDATEUR
              </span>
            </div>
            <p className="text-xs text-afri-text-sec">
              Gestion centralisée en temps réel du fil mixte (Grand Marché & Académie).
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenAddModal("market")}
            className="px-3 py-2 bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>🛒 Épingler Produit</span>
          </button>
          <button
            onClick={() => handleOpenAddModal("academy")}
            className="px-3 py-2 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#b8952b] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>🎓 Épingler Formation</span>
          </button>
        </div>
      </div>

      {/* Controls: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-afri-text-sec" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, ville, description..."
            className="w-full pl-9 pr-3 py-2 bg-afri-bg border border-afri-border focus:border-[#D4AF37] rounded-xl text-xs text-afri-text outline-none"
          />
        </div>

        <div className="flex items-center gap-1 bg-afri-bg border border-afri-border rounded-xl p-1 text-xs">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
              typeFilter === "all" ? "bg-[#D4AF37] text-black" : "text-afri-text-sec hover:text-afri-text"
            }`}
          >
            Tous ({items.length})
          </button>
          <button
            onClick={() => setTypeFilter("market")}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
              typeFilter === "market" ? "bg-[#D4AF37] text-black" : "text-afri-text-sec hover:text-afri-text"
            }`}
          >
            🛒 Produit ({items.filter(i => i.type === "market").length})
          </button>
          <button
            onClick={() => setTypeFilter("academy")}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
              typeFilter === "academy" ? "bg-[#D4AF37] text-black" : "text-afri-text-sec hover:text-afri-text"
            }`}
          >
            🎓 Formation ({items.filter(i => i.type === "academy").length})
          </button>
        </div>
      </div>

      {/* Items List Table / Cards */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-afri-bg border border-afri-border text-afri-text-sec text-xs font-mono">
            Aucun contenu trouvé pour le filtre sélectionné.
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isMarket = item.type === "market";

            return (
              <motion.div
                key={item.id}
                layout
                className={`p-4 rounded-2xl bg-afri-bg border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  item.pinned
                    ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-lg"
                    : item.hidden
                    ? "border-red-900/40 opacity-60"
                    : "border-afri-border hover:border-afri-border/80"
                }`}
              >
                {/* Item Left Info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black border border-afri-border">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <span className={`absolute top-1 left-1 text-[8px] font-black px-1.5 py-0.5 rounded font-mono uppercase ${
                      isMarket ? "bg-[#D4AF37] text-black" : "bg-blue-600 text-white"
                    }`}>
                      {isMarket ? "🛒 Market" : "🎓 Academy"}
                    </span>
                  </div>

                  {/* Text Details */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-afri-text uppercase truncate">
                        {item.title}
                      </h4>

                      {item.pinned && (
                        <span className="text-[9px] font-black bg-amber-500 text-black px-2 py-0.5 rounded-full uppercase tracking-wider font-mono flex items-center gap-1">
                          <Pin className="w-3 h-3 fill-current" />
                          <span>Épinglé</span>
                        </span>
                      )}

                      {item.hidden && (
                        <span className="text-[9px] font-black bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                          Masqué
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-afri-text-sec line-clamp-1">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-afri-text-sec font-mono flex-wrap">
                      <span>📍 {item.city}</span>
                      <span>•</span>
                      <span className="text-[#D4AF37] font-bold">
                        {item.price === 0 ? "GRATUIT" : `${item.price.toLocaleString()} FCFA`}
                      </span>
                      <span>•</span>
                      <span>Priorité: {item.priority || 5}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Bar */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
                  
                  {/* Priority Adjust */}
                  <div className="flex items-center bg-afri-bg-sec border border-afri-border rounded-xl px-2 py-1 gap-1 text-xs font-mono">
                    <button
                      onClick={() => handlePriorityChange(item, -1)}
                      className="text-afri-text-sec hover:text-afri-text p-0.5"
                      title="Diminuer la priorité"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-[#D4AF37] px-1">{item.priority || 5}</span>
                    <button
                      onClick={() => handlePriorityChange(item, 1)}
                      className="text-afri-text-sec hover:text-afri-text p-0.5"
                      title="Augmenter la priorité"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Pin Toggle */}
                  <button
                    onClick={() => handleTogglePin(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      item.pinned
                        ? "bg-[#D4AF37] text-black shadow-md"
                        : "bg-afri-bg-sec border border-afri-border text-afri-text-sec hover:text-[#D4AF37]"
                    }`}
                    title={item.pinned ? "Désépingler" : "Épingler en tête"}
                  >
                    <Pin className={`w-3.5 h-3.5 ${item.pinned ? "fill-current" : ""}`} />
                    <span className="text-[10px] uppercase">{item.pinned ? "Épinglé" : "Épingler"}</span>
                  </button>

                  {/* Hide Toggle */}
                  <button
                    onClick={() => handleToggleHide(item)}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      item.hidden
                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                        : "bg-afri-bg-sec border-afri-border text-afri-text-sec hover:text-afri-text"
                    }`}
                    title={item.hidden ? "Réafficher le contenu" : "Masquer le contenu"}
                  >
                    {item.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setIsModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-afri-bg-sec border border-afri-border text-afri-text-sec hover:text-[#D4AF37] text-xs transition-all cursor-pointer"
                    title="Modifier"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-xs transition-all cursor-pointer"
                    title="Supprimer du Fil Découvertes"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && editingItem && (
          <AfriModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingItem(null);
            }}
            title={editingItem.id?.includes("feat_") ? "✨ Éditer un contenu Découvertes" : "✨ Ajouter au Fil Découvertes"}
          >
            <form onSubmit={handleSaveItem} className="space-y-4 text-left font-sans">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-afri-text-sec uppercase block mb-1">Type de contenu</label>
                  <select
                    value={editingItem.type}
                    onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as any })}
                    className="w-full p-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text outline-none"
                  >
                    <option value="market">🛒 Grand Marché (Produit)</option>
                    <option value="academy">🎓 Académie (Formation)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-afri-text-sec uppercase block mb-1">Priorité (1 - 50)</label>
                  <input
                    type="number"
                    value={editingItem.priority || 5}
                    onChange={(e) => setEditingItem({ ...editingItem, priority: parseInt(e.target.value) || 5 })}
                    className="w-full p-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-afri-text-sec uppercase block mb-1">Titre principal</label>
                <input
                  type="text"
                  required
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="ex: Synthétiseur Yamaha Motif XF8"
                  className="w-full p-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-afri-text-sec uppercase block mb-1">Description concise</label>
                <textarea
                  rows={3}
                  required
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Détails du produit ou de la formation..."
                  className="w-full p-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-afri-text-sec uppercase block mb-1">Prix (FCFA, 0 = gratuit)</label>
                  <input
                    type="number"
                    value={editingItem.price ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, price: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-afri-text-sec uppercase block mb-1">Ville / Commune</label>
                  <input
                    type="text"
                    value={editingItem.city || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, city: e.target.value })}
                    placeholder="ex: Cocody, Abidjan"
                    className="w-full p-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text outline-none"
                  />
                </div>
              </div>

              {editingItem.type === "academy" && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-afri-bg rounded-xl border border-afri-border">
                  <div>
                    <label className="text-[10px] font-mono text-afri-text-sec uppercase block mb-1">Durée (Formation)</label>
                    <input
                      type="text"
                      value={editingItem.duration || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, duration: e.target.value })}
                      placeholder="ex: 4h 30m"
                      className="w-full p-2 bg-afri-bg-sec border border-afri-border rounded-lg text-xs text-afri-text outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-afri-text-sec uppercase block mb-1">Niveau</label>
                    <input
                      type="text"
                      value={editingItem.level || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, level: e.target.value })}
                      placeholder="ex: Intermédiaire"
                      className="w-full p-2 bg-afri-bg-sec border border-afri-border rounded-lg text-xs text-afri-text outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-mono text-afri-text-sec uppercase block mb-1">URL de l'image</label>
                <input
                  type="text"
                  required
                  value={editingItem.imageUrl || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                  className="w-full p-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text outline-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={!!editingItem.pinned}
                    onChange={(e) => setEditingItem({ ...editingItem, pinned: e.target.checked })}
                    className="rounded text-[#D4AF37]"
                  />
                  <span>📌 Épingler au sommet du fil</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-red-400">
                  <input
                    type="checkbox"
                    checked={!!editingItem.hidden}
                    onChange={(e) => setEditingItem({ ...editingItem, hidden: e.target.checked })}
                    className="rounded text-red-500"
                  />
                  <span>🙈 Masquer du fil public</span>
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:bg-[#b8952b] transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer dans Firestore</span>
                </button>
              </div>

            </form>
          </AfriModal>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDecouvertesCentre;
