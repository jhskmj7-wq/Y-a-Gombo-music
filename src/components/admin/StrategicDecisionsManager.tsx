import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, Plus, Search, Filter, Pin, Trash2, Edit2, Archive, CheckCircle2, 
  AlertTriangle, Shield, Calendar, User, Clock, Check, X, ArrowUpRight,
  TrendingUp, Tag, Sparkles, AlertCircle
} from "lucide-react";
import { db } from "../../firebase";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { useAuth } from "../../AuthContext";

export interface StrategicDecision {
  id: string;
  title: string;
  description: string;
  category: "Gouvernance" | "Sécurité" | "Modération" | "Économie" | "Partenariat" | "Technique" | "Général";
  priority: "Critique" | "Haute" | "Moyenne" | "Basse";
  status: "Active" | "En Cours" | "Exécutée" | "Archivée";
  isPinned: boolean;
  isArchived: boolean;
  authorName: string;
  authorUid: string;
  date: string;
  createdAt: any;
  updatedAt: any;
  impactNotes?: string;
  referenceUrl?: string;
}

const CATEGORIES = [
  "Tous", "Gouvernance", "Sécurité", "Modération", "Économie", "Partenariat", "Technique", "Général"
];

const PRIORITIES = ["Tous", "Critique", "Haute", "Moyenne", "Basse"];
const STATUSES = ["Tous", "Active", "En Cours", "Exécutée", "Archivée"];

export default function StrategicDecisionsManager() {
  const { currentUser, profile } = useAuth();
  const [decisions, setDecisions] = useState<StrategicDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Tous");
  const [priorityFilter, setPriorityFilter] = useState("Tous");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [showArchived, setShowArchived] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<StrategicDecision | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<StrategicDecision["category"]>("Gouvernance");
  const [priority, setPriority] = useState<StrategicDecision["priority"]>("Haute");
  const [status, setStatus] = useState<StrategicDecision["status"]>("Active");
  const [impactNotes, setImpactNotes] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Subscribe to Firestore decisions
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "strategic_decisions"));

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title || "Décision sans titre",
          description: data.description || "",
          category: data.category || "Gouvernance",
          priority: data.priority || "Moyenne",
          status: data.status || "Active",
          isPinned: !!data.isPinned,
          isArchived: !!data.isArchived,
          authorName: data.authorName || "Fondateur",
          authorUid: data.authorUid || "",
          date: data.date || new Date().toISOString().split('T')[0],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          impactNotes: data.impactNotes || "",
          referenceUrl: data.referenceUrl || ""
        } as StrategicDecision;
      });

      // Sort locally: Pinned first, then newest date
      docs.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      });

      setDecisions(docs);
      setLoading(false);
    }, (err) => {
      console.warn("Error loading strategic decisions:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Open modal for Create or Edit
  const openModal = (decision?: StrategicDecision) => {
    if (decision) {
      setEditingDecision(decision);
      setTitle(decision.title);
      setDescription(decision.description);
      setCategory(decision.category);
      setPriority(decision.priority);
      setStatus(decision.status);
      setImpactNotes(decision.impactNotes || "");
      setIsPinned(decision.isPinned);
    } else {
      setEditingDecision(null);
      setTitle("");
      setDescription("");
      setCategory("Gouvernance");
      setPriority("Haute");
      setStatus("Active");
      setImpactNotes("");
      setIsPinned(false);
    }
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg("Le titre et la description sont obligatoires.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const author = profile?.artistName || profile?.displayName || currentUser?.email || "Super Fondateur";
    const authorUid = currentUser?.uid || "admin";

    try {
      if (editingDecision) {
        // Update
        const ref = doc(db, "strategic_decisions", editingDecision.id);
        await updateDoc(ref, {
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          status,
          impactNotes: impactNotes.trim(),
          isPinned,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create
        await addDoc(collection(db, "strategic_decisions"), {
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          status,
          impactNotes: impactNotes.trim(),
          isPinned,
          isArchived: false,
          authorName: author,
          authorUid,
          date: new Date().toLocaleDateString("fr-FR"),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Save decision error:", err);
      setErrorMsg("Erreur lors de l'enregistrement dans Firestore.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (decision: StrategicDecision) => {
    try {
      const ref = doc(db, "strategic_decisions", decision.id);
      await updateDoc(ref, { isPinned: !decision.isPinned, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error("Error toggling pin:", err);
    }
  };

  const handleToggleArchive = async (decision: StrategicDecision) => {
    try {
      const ref = doc(db, "strategic_decisions", decision.id);
      const nextArchived = !decision.isArchived;
      await updateDoc(ref, { 
        isArchived: nextArchived, 
        status: nextArchived ? "Archivée" : "Active",
        updatedAt: serverTimestamp() 
      });
    } catch (err) {
      console.error("Error toggling archive:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer définitivement cette décision stratégique du registre souverain ?")) return;
    try {
      await deleteDoc(doc(db, "strategic_decisions", id));
    } catch (err) {
      console.error("Error deleting decision:", err);
    }
  };

  // Filtering
  const filteredDecisions = decisions.filter(d => {
    if (!showArchived && d.isArchived) return false;
    if (showPinnedOnly && !d.isPinned) return false;

    if (categoryFilter !== "Tous" && d.category !== categoryFilter) return false;
    if (priorityFilter !== "Tous" && d.priority !== priorityFilter) return false;
    if (statusFilter !== "Tous" && d.status !== statusFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchDesc = d.description.toLowerCase().includes(q);
      const matchAuthor = d.authorName.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAuthor) return false;
    }

    return true;
  });

  const getPriorityBadge = (p: StrategicDecision["priority"]) => {
    switch (p) {
      case "Critique":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40";
      case "Haute":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "Moyenne":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
      case "Basse":
        return "bg-stone-500/20 text-stone-400 border-stone-500/40";
    }
  };

  const getStatusBadge = (s: StrategicDecision["status"]) => {
    switch (s) {
      case "Active":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      case "En Cours":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "Exécutée":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
      case "Archivée":
        return "bg-stone-500/20 text-stone-400 border-stone-500/40";
    }
  };

  return (
    <div className="w-full space-y-6 text-left font-sans animate-fadeIn">
      
      {/* HEADER BANNER */}
      <div className="p-6 bg-gradient-to-r from-zinc-900 via-zinc-900 to-[#1A1408] border border-[#D4AF37]/40 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5" /> Registre Officiel des Décisions Sûres
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-afri-text uppercase tracking-tight font-display">
            Décisions Stratégiques & Gouvernance
          </h2>
          <p className="text-xs text-afri-text-sec max-w-xl">
            Journal souverain des orientations majeures de la plateforme AFRIGOMBO ELITE. Toutes les actions sont archivées et synchronisées dans Firestore.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="z-10 px-5 py-3.5 bg-gradient-to-r from-amber-500 to-[#D4AF37] hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Nouvel Acte Stratégique
        </button>

        {/* Decorative background pulse */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* CONTROLS & FILTERS BAR */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 space-y-4">
        
        {/* Search & Main Toggles */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-afri-text-sec absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une décision par titre, auteur, mots clés..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-afri-bg border border-afri-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-afri-text placeholder-afri-text-sec focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                showPinnedOnly
                  ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                  : "bg-afri-bg text-afri-text-sec border-afri-border hover:text-afri-text"
              }`}
            >
              <Pin className="w-3.5 h-3.5" /> Épinglées ({decisions.filter(d => d.isPinned).length})
            </button>

            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                showArchived
                  ? "bg-zinc-700 text-white border-zinc-600"
                  : "bg-afri-bg text-afri-text-sec border-afri-border hover:text-afri-text"
              }`}
            >
              <Archive className="w-3.5 h-3.5" /> Archives ({decisions.filter(d => d.isArchived).length})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <span className="text-[10px] font-mono font-bold text-afri-text-sec uppercase shrink-0 mr-1">
            Catégorie:
          </span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${
                categoryFilter === cat
                  ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                  : "bg-afri-bg border-afri-border text-afri-text-sec hover:text-afri-text"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Priority & Status Filters */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-afri-border/50 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-afri-text-sec uppercase">Priorité:</span>
            {PRIORITIES.map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                  priorityFilter === p
                    ? "bg-afri-bg text-afri-gold border-afri-gold"
                    : "bg-afri-bg/50 text-afri-text-sec border-transparent hover:text-afri-text"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-afri-text-sec uppercase">Statut:</span>
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                  statusFilter === s
                    ? "bg-afri-bg text-afri-gold border-afri-gold"
                    : "bg-afri-bg/50 text-afri-text-sec border-transparent hover:text-afri-text"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* DECISIONS REGISTER GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-afri-text-sec font-mono text-xs">
          <div className="w-8 h-8 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <span>Synchronisation du registre des décisions...</span>
        </div>
      ) : filteredDecisions.length === 0 ? (
        <div className="p-12 text-center bg-afri-bg-sec border border-afri-border rounded-3xl space-y-3">
          <FileText className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-afri-text uppercase tracking-wider">Aucune décision enregistrée</h3>
          <p className="text-xs text-afri-text-sec max-w-md mx-auto">
            Aucun acte stratégique ne correspond à vos filtres actuels. Cliquez sur le bouton ci-dessus pour consigner une décision au registre.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDecisions.map(d => (
            <motion.div
              key={d.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-3xl border flex flex-col justify-between gap-4 transition-all relative overflow-hidden ${
                d.isPinned
                  ? "bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#1C1609] border-[#D4AF37]/60 shadow-lg shadow-[#D4AF37]/5"
                  : d.isArchived
                    ? "bg-afri-bg/50 border-afri-border opacity-70"
                    : "bg-afri-bg-sec border-afri-border hover:border-afri-border/80"
              }`}
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-afri-bg border border-afri-border rounded-lg text-[10px] font-mono font-bold text-afri-gold uppercase tracking-wider">
                      {d.category}
                    </span>
                    <span className={`px-2 py-0.5 border rounded-md text-[9px] font-mono font-bold uppercase ${getPriorityBadge(d.priority)}`}>
                      {d.priority}
                    </span>
                    <span className={`px-2 py-0.5 border rounded-md text-[9px] font-mono font-bold uppercase ${getStatusBadge(d.status)}`}>
                      {d.status}
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePin(d)}
                      title={d.isPinned ? "Détacher du haut" : "Épingler en haut"}
                      className={`p-2 rounded-xl transition ${
                        d.isPinned ? "text-[#D4AF37] bg-[#D4AF37]/15" : "text-afri-text-sec hover:text-afri-text hover:bg-afri-bg"
                      }`}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openModal(d)}
                      title="Modifier la décision"
                      className="p-2 text-afri-text-sec hover:text-afri-gold hover:bg-afri-bg rounded-xl transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleArchive(d)}
                      title={d.isArchived ? "Désarchiver" : "Archiver"}
                      className="p-2 text-afri-text-sec hover:text-white hover:bg-afri-bg rounded-xl transition"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      title="Supprimer"
                      className="p-2 text-afri-text-sec hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-black text-afri-text tracking-tight uppercase leading-snug">
                  {d.title}
                </h3>
              </div>

              {/* Card Description */}
              <p className="text-xs text-afri-text-sec leading-relaxed whitespace-pre-wrap">
                {d.description}
              </p>

              {/* Impact Notes if exists */}
              {d.impactNotes && (
                <div className="p-3 bg-afri-bg border border-afri-border rounded-2xl text-[11px] text-amber-300/90 space-y-1">
                  <span className="font-mono font-bold uppercase text-[9px] text-afri-text-sec block">
                    Impact Attendu / Directive :
                  </span>
                  <p>{d.impactNotes}</p>
                </div>
              )}

              {/* Card Footer */}
              <div className="pt-3 border-t border-afri-border/60 flex items-center justify-between text-[10px] font-mono text-afri-text-sec">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-afri-gold" />
                  <span>Signé par : <strong className="text-afri-text">{d.authorName}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-afri-text-sec" />
                  <span>{d.date}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl bg-afri-bg-sec border border-[#D4AF37]/40 rounded-3xl p-6 shadow-2xl space-y-5 text-left relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-afri-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl text-[#D4AF37]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-afri-text uppercase tracking-tight font-display">
                      {editingDecision ? "Modifier la Décision" : "Nouvel Acte Stratégique"}
                    </h3>
                    <p className="text-[10px] text-afri-text-sec font-mono uppercase">Registre Souverain AFRIGOMBO ELITE</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-afri-text-sec hover:text-afri-text hover:bg-afri-bg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-afri-text uppercase tracking-wider block">
                    Titre de la Décision *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Révision du barème de commissions sur les gombos"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-xs text-afri-text font-bold placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block">
                      Catégorie
                    </label>
                    <select
                      value={category}
                      onChange={(e: any) => setCategory(e.target.value)}
                      className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text font-bold focus:outline-none focus:border-[#D4AF37]"
                    >
                      {CATEGORIES.filter(c => c !== "Tous").map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block">
                      Priorité
                    </label>
                    <select
                      value={priority}
                      onChange={(e: any) => setPriority(e.target.value)}
                      className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text font-bold focus:outline-none focus:border-[#D4AF37]"
                    >
                      {PRIORITIES.filter(p => p !== "Tous").map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-afri-text-sec uppercase block">
                      Statut
                    </label>
                    <select
                      value={status}
                      onChange={(e: any) => setStatus(e.target.value)}
                      className="w-full bg-afri-bg border border-afri-border rounded-xl p-2.5 text-xs text-afri-text font-bold focus:outline-none focus:border-[#D4AF37]"
                    >
                      {STATUSES.filter(s => s !== "Tous").map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-afri-text uppercase tracking-wider block">
                    Exposé des motifs / Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Détaillez les raisons et le contenu officiel de la décision..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-xs text-afri-text placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-afri-text uppercase tracking-wider block">
                    Directives / Impact Attendu (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Application immédiate pour tous les comptes créés après le 1er août"
                    value={impactNotes}
                    onChange={(e) => setImpactNotes(e.target.value)}
                    className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-xs text-afri-text placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="pin_checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 accent-[#D4AF37] rounded cursor-pointer"
                  />
                  <label htmlFor="pin_checkbox" className="text-xs font-bold text-afri-text cursor-pointer select-none">
                    Épingler cette décision en haut du registre officiel 📌
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-afri-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-afri-bg border border-afri-border hover:bg-afri-bg-sec rounded-xl text-xs font-bold uppercase text-afri-text-sec hover:text-afri-text transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Enregistrement..." : "Consigner au Registre"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
