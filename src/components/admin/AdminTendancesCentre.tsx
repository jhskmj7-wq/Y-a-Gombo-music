import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, Star, Crown, Eye, Share2, Bookmark, Users, Coins, 
  Plus, Trash2, Pin, PinOff, Sparkles, TrendingUp, ShieldCheck, 
  Search, RefreshCw, CheckCircle2, AlertCircle, Sparkle, Tag
} from "lucide-react";
import { db } from "../../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { 
  TrendingDoc, 
  saveOrUpdateTrendingDoc, 
  togglePinTrendingDoc, 
  toggleSponsorTrendingDoc, 
  removeTrendingDoc, 
  calculateTrendingScore 
} from "../../lib/tendancesEngine";
import { Gombo, Post } from "../../types";

interface AdminTendancesCentreProps {
  gombos?: Gombo[];
  posts?: Post[];
  audioSynth?: any;
}

export const AdminTendancesCentre: React.FC<AdminTendancesCentreProps> = ({
  gombos = [],
  posts = [],
  audioSynth
}) => {
  const [trendingDocs, setTrendingDocs] = useState<TrendingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [publicationSearch, setPublicationSearch] = useState("");
  const [selectedPublication, setSelectedPublication] = useState<{ pub: Gombo | Post; type: "gombo" | "post" } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "pinned" | "sponsored" | "auto" | "manuel">("all");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time Firestore sync listener for `trending/` collection
  useEffect(() => {
    const q = query(collection(db, "trending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: TrendingDoc[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as TrendingDoc;
        docs.push({
          ...data,
          id: doc.id,
          publicationId: data.publicationId || doc.id,
          score: calculateTrendingScore(data)
        });
      });

      // Sort: pinned first, then by score descending
      docs.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.score || 0) - (a.score || 0);
      });

      setTrendingDocs(docs);
      setLoading(false);
    }, (err) => {
      console.error("Error listening to trending collection:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Compute key stats real-time
  const stats = {
    activeCount: trendingDocs.length,
    sponsoredCount: trendingDocs.filter(d => d.sponsored).length,
    pinnedCount: trendingDocs.filter(d => d.pinned).length,
    totalViews: trendingDocs.reduce((acc, d) => acc + (d.viewsCount || 0), 0),
    totalShares: trendingDocs.reduce((acc, d) => acc + (d.sharesCount || 0), 0),
    totalFavorites: trendingDocs.reduce((acc, d) => acc + (d.favoritesCount || 0), 0),
    totalApplications: trendingDocs.reduce((acc, d) => acc + (d.candidaturesCount || 0), 0),
    sponsoredRevenue: trendingDocs.filter(d => d.sponsored).length * 15000 // 15 000 FCFA per sponsored slot
  };

  // Top performers
  const topViewed = [...trendingDocs].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))[0];
  const topShared = [...trendingDocs].sort((a, b) => (b.sharesCount || 0) - (a.sharesCount || 0))[0];
  const topFavorited = [...trendingDocs].sort((a, b) => (b.favoritesCount || 0) - (a.favoritesCount || 0))[0];
  const topApplications = [...trendingDocs].sort((a, b) => (b.candidaturesCount || 0) - (a.candidaturesCount || 0))[0];

  // Actions
  const handleTogglePin = async (docItem: TrendingDoc) => {
    try {
      await togglePinTrendingDoc(docItem.publicationId, !docItem.pinned);
      try { audioSynth?.playValidationSuccess?.(); } catch (_) {}
      showToast(docItem.pinned ? "📌 Publication désépinglée." : "📍 Publication épinglée en tête des tendances !");
    } catch (err) {
      showToast("❌ Erreur lors de la modification.");
    }
  };

  const handleToggleSponsor = async (docItem: TrendingDoc) => {
    const res = await toggleSponsorTrendingDoc(docItem.publicationId, !docItem.sponsored);
    if (!res.success) {
      showToast(`⚠️ ${res.message}`);
      return;
    }
    try { audioSynth?.playValidationSuccess?.(); } catch (_) {}
    showToast(!docItem.sponsored ? "⭐ Publication désormais Sponsorisée !" : "Sponsor retiré.");
  };

  const handleRemove = async (docItem: TrendingDoc) => {
    if (window.confirm(`Voulez-vous vraiment retirer "${docItem.title}" des tendances ?`)) {
      await removeTrendingDoc(docItem.publicationId);
      showToast("🔥 Publication retirée des tendances.");
    }
  };

  const handleAddPublicationToTrending = async () => {
    if (!selectedPublication) return;

    const { pub, type } = selectedPublication;
    const pubId = pub.id || `pub_${Date.now()}`;
    const isGombo = type === "gombo";
    const gombo = isGombo ? (pub as Gombo) : null;
    const post = !isGombo ? (pub as Post) : null;

    const title = isGombo ? (gombo?.title || "Gombo Musique") : (post?.authorArtisticName ? `Vibe de ${post.authorArtisticName}` : "Publication Vibe");
    const description = isGombo ? (gombo?.description || "") : (post?.content || "");

    await saveOrUpdateTrendingDoc({
      publicationId: pubId,
      type,
      title,
      description,
      mode: "manuel",
      pinned: false,
      sponsored: false,
      viewsCount: 150,
      favoritesCount: 15,
      sharesCount: 10,
      discussionsCount: 8,
      candidaturesCount: 5,
      likesCount: 25,
      authorName: isGombo ? (gombo?.clientName || "Organisateur") : (post?.authorArtisticName || post?.authorName || "Artiste"),
      category: "musique",
      commune: isGombo ? (typeof gombo?.location === "string" ? gombo.location : "Cocody") : "Abidjan",
      budget: isGombo ? (gombo?.budget || 0) : 0,
      imageUrl: isGombo ? (gombo?.mediaUrl || "") : (post?.mediaUrl || "")
    });

    setIsAddModalOpen(false);
    setSelectedPublication(null);
    showToast("🔥 Publication ajoutée aux tendances avec succès !");
  };

  // Filtered list
  const filteredDocs = trendingDocs.filter(d => {
    const term = (searchTerm || "").toLowerCase();
    const matchesSearch = (d?.title ?? "").toLowerCase().includes(term) ||
                          (d?.description ?? "").toLowerCase().includes(term) ||
                          (d?.authorName ?? "").toLowerCase().includes(term);
    if (!matchesSearch) return false;

    if (filterMode === "pinned") return d.pinned;
    if (filterMode === "sponsored") return d.sponsored;
    if (filterMode === "manuel") return d.mode === "manuel";
    if (filterMode === "auto") return d.mode === "auto";

    return true;
  });

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-[999] bg-[#D4AF37] text-black px-4 py-2.5 rounded-2xl font-mono font-bold text-xs shadow-2xl border border-white/20 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-afri-bg-sec via-afri-bg to-afri-bg-sec border border-[#D4AF37]/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-[#D4AF37]">
                <Flame className="w-5 h-5 animate-pulse" />
              </span>
              <span className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-widest">
                SUPER FONDATEUR — CENTRE DES TENDANCES
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-sans font-black text-afri-text mt-2">
              Gestion de l'Algorithme & Publications Séquencées
            </h2>
            <p className="text-xs text-afri-text-sec font-mono mt-1">
              Synchronisé en temps réel sur la collection Firestore <code className="text-[#D4AF37]">trending/</code>.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-3 bg-[#D4AF37] hover:bg-[#b8952b] text-black rounded-2xl font-mono font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Ajouter aux tendances
          </button>
        </div>
      </div>

      {/* Real-Time Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {/* Active Trends */}
        <div className="bg-afri-bg border border-afri-border rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-afri-text-sec text-[10px] font-mono uppercase font-black">
            <span>Tendances Actives</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-afri-text font-mono mt-2">{stats.activeCount}</p>
          <span className="text-[9px] text-afri-text-sec font-mono block mt-1">Publications dans l'algorithme</span>
        </div>

        {/* Sponsored */}
        <div className="bg-afri-bg border border-[#D4AF37]/30 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-[#D4AF37] text-[10px] font-mono uppercase font-black">
            <span>Sponsorisées (Max 3)</span>
            <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
          </div>
          <p className="text-2xl font-black text-[#D4AF37] font-mono mt-2">{stats.sponsoredCount} / 3</p>
          <span className="text-[9px] text-afri-text-sec font-mono block mt-1">Emplacements VIP souscrits</span>
        </div>

        {/* Pinned */}
        <div className="bg-afri-bg border border-indigo-500/30 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-indigo-400 text-[10px] font-mono uppercase font-black">
            <span>Épinglées</span>
            <Pin className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-400 font-mono mt-2">{stats.pinnedCount}</p>
          <span className="text-[9px] text-afri-text-sec font-mono block mt-1">Prioritaires en tête de carrousel</span>
        </div>

        {/* Sponsored Revenue */}
        <div className="bg-afri-bg border border-emerald-500/30 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 text-[10px] font-mono uppercase font-black">
            <span>Revenus Sponsorisés</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-2">{stats.sponsoredRevenue.toLocaleString()} FCFA</p>
          <span className="text-[9px] text-afri-text-sec font-mono block mt-1">Revenus de mise en avant</span>
        </div>
      </div>

      {/* Top Performers Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-afri-bg-sec/50 border border-afri-border rounded-xl p-3 flex items-center gap-3">
          <Eye className="w-5 h-5 text-blue-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[9px] font-mono uppercase text-afri-text-sec block">Plus vue</span>
            <p className="text-xs font-bold text-afri-text truncate">{topViewed?.title || "Aucune"}</p>
            <span className="text-[9px] font-mono text-blue-400 font-bold">{topViewed?.viewsCount || 0} vues</span>
          </div>
        </div>

        <div className="bg-afri-bg-sec/50 border border-afri-border rounded-xl p-3 flex items-center gap-3">
          <Share2 className="w-5 h-5 text-purple-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[9px] font-mono uppercase text-afri-text-sec block">Plus partagée</span>
            <p className="text-xs font-bold text-afri-text truncate">{topShared?.title || "Aucune"}</p>
            <span className="text-[9px] font-mono text-purple-400 font-bold">{topShared?.sharesCount || 0} partages</span>
          </div>
        </div>

        <div className="bg-afri-bg-sec/50 border border-afri-border rounded-xl p-3 flex items-center gap-3">
          <Bookmark className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[9px] font-mono uppercase text-afri-text-sec block">Plus enregistrée</span>
            <p className="text-xs font-bold text-afri-text truncate">{topFavorited?.title || "Aucune"}</p>
            <span className="text-[9px] font-mono text-amber-400 font-bold">{topFavorited?.favoritesCount || 0} favoris</span>
          </div>
        </div>

        <div className="bg-afri-bg-sec/50 border border-afri-border rounded-xl p-3 flex items-center gap-3">
          <Users className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[9px] font-mono uppercase text-afri-text-sec block">Plus de candidatures</span>
            <p className="text-xs font-bold text-afri-text truncate">{topApplications?.title || "Aucune"}</p>
            <span className="text-[9px] font-mono text-emerald-400 font-bold">{topApplications?.candidaturesCount || 0} postulants</span>
          </div>
        </div>
      </div>

      {/* Control Toolbar: Filter & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-afri-bg border border-afri-border rounded-2xl p-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          {(["all", "pinned", "sponsored", "manuel", "auto"] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase font-bold shrink-0 transition-all ${
                filterMode === mode
                  ? "bg-[#D4AF37] text-black font-black shadow-md"
                  : "bg-afri-bg-sec border border-afri-border text-afri-text-sec hover:text-afri-text"
              }`}
            >
              {mode === "all" ? "Toutes" :
               mode === "pinned" ? "📌 Épinglées" :
               mode === "sponsored" ? "⭐ Sponsorisées" :
               mode === "manuel" ? "👤 Manuelles" : "🤖 Automatiques"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-afri-text-sec absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une tendance..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-afri-bg-sec border border-afri-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* List of Trending Items */}
      {loading ? (
        <div className="p-12 text-center font-mono text-xs text-[#D4AF37] animate-pulse">
          Chargement des tendances en temps réel depuis Firestore...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-12 text-center bg-afri-bg border border-afri-border rounded-3xl space-y-3">
          <Flame className="w-8 h-8 text-afri-text-sec mx-auto opacity-50" />
          <p className="text-sm font-bold text-afri-text">Aucune publication dans cette vue.</p>
          <p className="text-xs text-afri-text-sec font-mono">
            Cliquez sur "Ajouter aux tendances" pour promouvoir un gombo ou un post.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 bg-afri-bg border rounded-2xl transition-all shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                item.pinned
                  ? "border-indigo-500/50 bg-indigo-950/10"
                  : item.sponsored
                  ? "border-[#D4AF37]/50 bg-[#D4AF37]/5"
                  : "border-afri-border hover:border-[#D4AF37]/30"
              }`}
            >
              {/* Info Column */}
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-xl bg-afri-bg-sec overflow-hidden border border-afri-border shrink-0 relative">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#D4AF37]">
                      <Flame className="w-5 h-5" />
                    </div>
                  )}
                  {item.pinned && (
                    <span className="absolute top-0.5 right-0.5 p-0.5 bg-indigo-500 text-white rounded-full">
                      <Pin className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.pinned && (
                      <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[8px] font-mono font-black uppercase rounded">
                        📌 Épinglé
                      </span>
                    )}
                    {item.sponsored && (
                      <span className="px-2 py-0.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[8px] font-mono font-black uppercase rounded flex items-center gap-1">
                        ⭐ Sponsorisé
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[8px] font-mono font-black uppercase rounded">
                      🔥 Score: {item.score} pts
                    </span>
                    <span className="text-[9px] font-mono text-afri-text-sec uppercase">
                      Mode: {item.mode}
                    </span>
                  </div>

                  <h4 className="text-sm font-sans font-black text-afri-text truncate">{item.title}</h4>
                  <p className="text-xs text-afri-text-sec truncate max-w-xl">{item.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-afri-text-sec pt-1">
                    <span>👀 {item.viewsCount} vues</span>
                    <span>👍 {item.likesCount} j'honore</span>
                    <span>💬 {item.discussionsCount} coms</span>
                    <span>📤 {item.sharesCount} partages</span>
                    <span>⭐ {item.favoritesCount} favs</span>
                    {item.candidaturesCount > 0 && <span>🤝 {item.candidaturesCount} postulants</span>}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-afri-border">
                {/* Pin Button */}
                <button
                  onClick={() => handleTogglePin(item)}
                  title={item.pinned ? "Désépingler" : "Épingler en tête"}
                  className={`p-2 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    item.pinned
                      ? "bg-indigo-500 text-white border-indigo-400"
                      : "bg-afri-bg-sec border-afri-border text-afri-text-sec hover:text-indigo-400 hover:border-indigo-400/40"
                  }`}
                >
                  {item.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{item.pinned ? "Désépingler" : "Épingler"}</span>
                </button>

                {/* Sponsor Button */}
                <button
                  onClick={() => handleToggleSponsor(item)}
                  title={item.sponsored ? "Retirer Sponsor" : "Sponsoriser"}
                  className={`p-2 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    item.sponsored
                      ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                      : "bg-afri-bg-sec border-afri-border text-afri-text-sec hover:text-[#D4AF37] hover:border-[#D4AF37]/40"
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${item.sponsored ? "fill-black" : ""}`} />
                  <span className="hidden sm:inline">{item.sponsored ? "Sponsorisé" : "Sponsoriser"}</span>
                </button>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemove(item)}
                  title="Retirer des tendances"
                  className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal: Add Publication to Trending */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-afri-bg border border-[#D4AF37]/40 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-afri-border pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-sm font-mono font-black text-afri-text uppercase">
                    Promouvoir une publication aux Tendances
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-afri-text-sec hover:text-afri-text text-sm font-mono font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-afri-text-sec absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrer parmi tous les gombos et vibess..."
                  value={publicationSearch}
                  onChange={(e) => setPublicationSearch(e.target.value)}
                  className="w-full bg-afri-bg-sec border border-afri-border rounded-xl pl-9 pr-3 py-2 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                {gombos
                  .filter(g => (g?.title ?? "").toLowerCase().includes((publicationSearch || "").toLowerCase()))
                  .map(g => {
                    const isSelected = selectedPublication?.pub.id === g.id;
                    return (
                      <div
                        key={g.id}
                        onClick={() => setSelectedPublication({ pub: g, type: "gombo" })}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-[#D4AF37] bg-[#D4AF37]/10 text-afri-text"
                            : "border-afri-border bg-afri-bg-sec hover:border-[#D4AF37]/40"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-[8px] font-mono uppercase text-[#D4AF37] font-black block">GOMBO</span>
                          <p className="text-xs font-bold text-afri-text truncate">{g.title || "Gombo Musique"}</p>
                          <p className="text-[10px] text-afri-text-sec truncate">{g.description}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />}
                      </div>
                    );
                  })}

                {posts
                  .filter(p => (p?.content ?? "").toLowerCase().includes((publicationSearch || "").toLowerCase()))
                  .map(p => {
                    const isSelected = selectedPublication?.pub.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPublication({ pub: p, type: "post" })}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-[#D4AF37] bg-[#D4AF37]/10 text-afri-text"
                            : "border-afri-border bg-afri-bg-sec hover:border-[#D4AF37]/40"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-[8px] font-mono uppercase text-purple-400 font-black block">VIBE POST</span>
                          <p className="text-xs font-bold text-afri-text truncate">{p.content || "Publication d'artiste"}</p>
                          <p className="text-[10px] text-afri-text-sec truncate">{p.authorArtisticName || "Artiste"}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />}
                      </div>
                    );
                  })}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-afri-border">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-afri-bg-sec border border-afri-border rounded-xl text-xs font-mono font-bold text-afri-text-sec hover:text-afri-text"
                >
                  Annuler
                </button>
                <button
                  disabled={!selectedPublication}
                  onClick={handleAddPublicationToTrending}
                  className="px-5 py-2 bg-[#D4AF37] disabled:opacity-50 text-black rounded-xl text-xs font-mono font-black uppercase shadow-md cursor-pointer hover:bg-[#b8952b]"
                >
                  Confirmer la mise en tendance
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminTendancesCentre;
