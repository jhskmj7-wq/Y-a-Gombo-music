import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Search, 
  RefreshCw,
  Eye,
  Trash2,
  AlertTriangle,
  Archive,
  CheckCircle,
  Clock,
  EyeOff,
  User,
  Calendar,
  DollarSign,
  Tag,
  Share2,
  Heart,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  X,
  ExternalLink,
  ShieldCheck,
  Check
} from "lucide-react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { audioSynth } from "../../lib/audio";
import { FounderBottomSheet } from "./FounderBottomSheet";

export type PublicationStatus = "ACTIVE" | "EN_COURS" | "EXPIREE" | "ARCHIVEE" | "SUSPENDUE";

export interface AdminPublicationItem {
  id: string;
  collectionName: "social_posts" | "gombos" | "posts";
  title: string;
  caption?: string;
  authorName: string;
  authorId: string;
  authorAvatar?: string;
  budget?: number;
  createdAt: string | number;
  startDate?: string | number;
  expiresAt?: string | number;
  status: PublicationStatus;
  rawStatus?: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  applicationsCount: number;
  sharesCount: number;
  visible: boolean;
  commune?: string;
  category?: string;
  type?: string;
  isFlagged?: boolean;
  reportsCount?: number;
  reportReason?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio" | "none";
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
}

interface AdminPublicationsManagerProps {
  currentUser?: any;
  onOpenItem?: (item: AdminPublicationItem) => void;
}

export const AdminPublicationsManager: React.FC<AdminPublicationsManagerProps> = ({
  currentUser
}) => {
  const [items, setItems] = useState<AdminPublicationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"TOUTES" | "ACTIVES" | "EN_COURS" | "EXPIREES" | "ARCHIVEES">("TOUTES");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<AdminPublicationItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<AdminPublicationItem | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Helper to compute publication status accurately
  const computeStatus = (data: any): PublicationStatus => {
    const rawSt = String(data.status || "").toLowerCase();
    const rawVisible = data.visible !== false;

    if (rawSt === "archived" || rawSt === "archivee" || rawSt === "archivée" || data.isArchived) {
      return "ARCHIVEE";
    }
    if (rawSt === "suspended" || rawSt === "suspendue" || !rawVisible) {
      return "SUSPENDUE";
    }

    const now = Date.now();
    let expTimestamp: number | null = null;
    if (data.expiresAt) {
      expTimestamp = typeof data.expiresAt === "number" ? data.expiresAt : new Date(data.expiresAt).getTime();
    } else if (data.dateFin) {
      expTimestamp = typeof data.dateFin === "number" ? data.dateFin : new Date(data.dateFin).getTime();
    } else if (data.deadline) {
      expTimestamp = typeof data.deadline === "number" ? data.deadline : new Date(data.deadline).getTime();
    } else if (data.date) {
      const d = new Date(`${data.date}T23:59:59.999Z`);
      if (!isNaN(d.getTime())) expTimestamp = d.getTime();
    }

    if (expTimestamp && !isNaN(expTimestamp) && expTimestamp < now) {
      return "EXPIREE";
    }
    if (rawSt === "expired" || rawSt === "expiree" || rawSt === "expirée") {
      return "EXPIREE";
    }
    if (rawSt === "in_progress" || rawSt === "en_cours" || rawSt === "assigned" || rawSt === "ongoing") {
      return "EN_COURS";
    }

    return "ACTIVE";
  };

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Sync social_posts
    const unsubSocial = onSnapshot(collection(db, "social_posts"), (snapSocial) => {
      const socialList: AdminPublicationItem[] = [];
      snapSocial.forEach((d) => {
        const data = d.data();
        const computed = computeStatus(data);
        socialList.push({
          id: d.id,
          collectionName: "social_posts",
          title: data.title || data.caption || "Publication sociale",
          caption: data.caption || data.description || "",
          authorName: data.authorName || data.userName || "Citoyen",
          authorId: data.authorId || data.userId || "",
          authorAvatar: data.authorAvatar || data.userAvatar || "",
          budget: Number(data.budget || data.feeAmount || 0),
          createdAt: data.createdAt || new Date().toISOString(),
          startDate: data.startDate || data.dateDebut || "",
          expiresAt: data.expiresAt || data.dateFin || data.deadline || "",
          status: computed,
          rawStatus: data.status || "active",
          viewsCount: Number(data.viewsCount || data.views || 0),
          likesCount: Number(data.likesCount || (Array.isArray(data.likes) ? data.likes.length : 0)),
          commentsCount: Number(data.commentsCount || (Array.isArray(data.comments) ? data.comments.length : 0)),
          applicationsCount: Number(data.applicationsCount || (Array.isArray(data.candidatures) ? data.candidatures.length : 0)),
          sharesCount: Number(data.sharesCount || data.shares || 0),
          visible: data.visible !== false,
          commune: data.commune || "",
          category: data.category || data.postCategory || "Social",
          type: data.type || "Publication",
          isFlagged: !!data.isFlagged,
          reportsCount: Number(data.reportsCount || 0),
          reportReason: data.reportReason || data.motifs || "",
          mediaUrl: data.imageUrl || data.mediaUrl || data.photoUrl || "",
          mediaType: data.mediaType || (data.audioUrl ? "audio" : data.imageUrl ? "image" : "none"),
          contactPhone: data.contactPhone || data.phone || "",
          contactEmail: data.contactEmail || data.email || "",
          description: data.description || data.content || data.caption || ""
        });
      });

      // 2. Sync gombos
      const unsubGombos = onSnapshot(collection(db, "gombos"), (snapGombos) => {
        const gomboList: AdminPublicationItem[] = [];
        snapGombos.forEach((d) => {
          const data = d.data();
          const computed = computeStatus(data);
          gomboList.push({
            id: d.id,
            collectionName: "gombos",
            title: data.title || "Prestation Gombo",
            caption: data.description || "",
            authorName: data.clientName || data.organizerName || data.authorName || "Organisateur",
            authorId: data.clientId || data.organizerId || data.authorId || "",
            authorAvatar: data.clientAvatar || data.authorAvatar || "",
            budget: Number(data.budget || data.remuneration || 0),
            createdAt: data.createdAt || new Date().toISOString(),
            startDate: data.startDate || data.eventDate || "",
            expiresAt: data.expiresAt || data.deadline || data.dateFin || "",
            status: computed,
            rawStatus: data.status || "open",
            viewsCount: Number(data.viewsCount || data.views || 0),
            likesCount: Number(data.likesCount || (Array.isArray(data.likes) ? data.likes.length : 0)),
            commentsCount: Number(data.commentsCount || (Array.isArray(data.comments) ? data.comments.length : 0)),
            applicationsCount: Number(data.applicationsCount || (Array.isArray(data.candidatures) ? data.candidatures.length : 0) || (Array.isArray(data.proposals) ? data.proposals.length : 0)),
            sharesCount: Number(data.sharesCount || data.shares || 0),
            visible: data.visible !== false,
            commune: data.commune || data.location || "",
            category: data.category || data.eventType || "Gombo",
            type: "Gombo",
            isFlagged: !!data.isFlagged,
            reportsCount: Number(data.reportsCount || 0),
            reportReason: data.reportReason || data.motifs || "",
            mediaUrl: data.imageUrl || data.bannerUrl || "",
            mediaType: data.imageUrl ? "image" : "none",
            contactPhone: data.contactPhone || data.phone || "",
            contactEmail: data.contactEmail || "",
            description: data.description || ""
          });
        });

        // Merge without duplicates
        const combined = [...socialList];
        gomboList.forEach(g => {
          if (!combined.some(c => c.id === g.id)) {
            combined.push(g);
          }
        });

        setItems(combined);
        setLoading(false);
      }, (err) => {
        console.warn("AdminPublications: Gombos sync error:", err);
        setItems(socialList);
        setLoading(false);
      });

      return () => unsubGombos();
    }, (err) => {
      console.warn("AdminPublications: Social posts sync error:", err);
      setLoading(false);
    });

    return () => unsubSocial();
  }, []);

  // Format date helper
  const formatDate = (val?: string | number) => {
    if (!val) return "Non spécifiée";
    try {
      const d = typeof val === "number" ? new Date(val) : new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return String(val);
    }
  };

  // Actions
  const handleArchive = async (item: AdminPublicationItem) => {
    setActionLoadingId(item.id);
    try {
      const newSt = item.status === "ARCHIVEE" ? "active" : "archived";
      const updateData = {
        status: newSt,
        statut: newSt,
        isArchived: newSt === "archived",
        archivedAt: newSt === "archived" ? new Date().toISOString() : null
      };
      await Promise.allSettled([
        updateDoc(doc(db, "social_posts", item.id), updateData),
        updateDoc(doc(db, "gombos", item.id), updateData),
        updateDoc(doc(db, "posts", item.id), updateData)
      ]);
      showToast(newSt === "archived" ? `📦 Publication archivée avec succès.` : `✅ Publication désarchivée.`);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleSuspend = async (item: AdminPublicationItem) => {
    setActionLoadingId(item.id);
    try {
      const nextSuspended = item.status !== "SUSPENDUE";
      const updateData = {
        status: nextSuspended ? "suspended" : "active",
        statut: nextSuspended ? "suspended" : "active",
        visible: !nextSuspended
      };
      await Promise.allSettled([
        updateDoc(doc(db, "social_posts", item.id), updateData),
        updateDoc(doc(db, "gombos", item.id), updateData),
        updateDoc(doc(db, "posts", item.id), updateData)
      ]);
      showToast(nextSuspended ? `🛑 Publication suspendue.` : `✅ Publication réactivée.`);
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setActionLoadingId(itemToDelete.id);
    try {
      await Promise.allSettled([
        deleteDoc(doc(db, "social_posts", itemToDelete.id)),
        deleteDoc(doc(db, "gombos", itemToDelete.id)),
        deleteDoc(doc(db, "posts", itemToDelete.id))
      ]);
      showToast(`🗑️ Publication "${itemToDelete.title}" supprimée définitivement.`);
      setItemToDelete(null);
      if (selectedItem?.id === itemToDelete.id) {
        setSelectedItem(null);
      }
      try { audioSynth?.playValidationSuccess(); } catch (_) {}
    } catch (err: any) {
      showToast(`❌ Erreur suppression: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter counts
  const countAll = items.length;
  const countActives = items.filter(i => i.status === "ACTIVE").length;
  const countEnCours = items.filter(i => i.status === "EN_COURS").length;
  const countExpirees = items.filter(i => i.status === "EXPIREE").length;
  const countArchivees = items.filter(i => i.status === "ARCHIVEE" || i.status === "SUSPENDUE").length;

  const filteredItems = items.filter((item) => {
    // Tab filter
    if (activeTab === "ACTIVES" && item.status !== "ACTIVE") return false;
    if (activeTab === "EN_COURS" && item.status !== "EN_COURS") return false;
    if (activeTab === "EXPIREES" && item.status !== "EXPIREE") return false;
    if (activeTab === "ARCHIVEES" && item.status !== "ARCHIVEE" && item.status !== "SUSPENDUE") return false;

    // Search filter
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (item.title || "").toLowerCase().includes(q) ||
      (item.authorName || "").toLowerCase().includes(q) ||
      (item.commune || "").toLowerCase().includes(q) ||
      (item.id || "").toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: PublicationStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> ACTIVE
          </span>
        );
      case "EN_COURS":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" /> EN COURS
          </span>
        );
      case "EXPIREE":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> EXPIRÉE
          </span>
        );
      case "ARCHIVEE":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 inline-flex items-center gap-1">
            <Archive className="w-3 h-3" /> ARCHIVÉE
          </span>
        );
      case "SUSPENDUE":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30 inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> SUSPENDUE
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left font-sans select-none">
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[100000] bg-zinc-950 border border-[#D4AF37] text-zinc-100 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold"
          >
            <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Delete */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[100001] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border-2 border-red-500/60 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white uppercase tracking-wider font-mono">
                  SUPPRESSION DÉFINITIVE
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Êtes-vous absolument sûr de vouloir supprimer définitivement cette publication ? Cette action effacera le document de Firestore.
                </p>
                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-left mt-2">
                  <p className="text-xs font-bold text-white truncate">{itemToDelete.title}</p>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Par {itemToDelete.authorName} • ID: {itemToDelete.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-mono text-xs font-bold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={actionLoadingId === itemToDelete.id}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  {actionLoadingId === itemToDelete.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Supprimer</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-[#D4AF37]/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-display font-black text-white uppercase tracking-wider">
                  GESTION INTÉGRALE DES PUBLICATIONS
                </h2>
                <span className="text-[10px] font-mono font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full">
                  REGISTRE SOUVERAIN
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Suivi complet des annonces, gombos, durées d'exposition et historique administratif.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 px-3.5 py-2 rounded-2xl text-xs font-mono text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sync Firestore ({items.length} totales)</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {[
            { id: "TOUTES", label: "TOUTES", count: countAll },
            { id: "ACTIVES", label: "ACTIVES", count: countActives },
            { id: "EN_COURS", label: "EN COURS", count: countEnCours },
            { id: "EXPIREES", label: "EXPIRÉES", count: countExpirees },
            { id: "ARCHIVEES", label: "ARCHIVÉES", count: countArchivees },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-[#D4AF37] text-black shadow-md font-black"
                  : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <span>{t.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === t.id ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-300"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher titre, auteur, commune, ID..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 focus:border-[#D4AF37] rounded-xl text-xs text-white placeholder:text-zinc-500 outline-none transition"
          />
        </div>
      </div>

      {/* Publications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-2">
            <RefreshCw className="w-6 h-6 text-[#D4AF37] animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-mono">Synchronisation des registres en cours...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-3xl space-y-2">
            <FileText className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm font-bold text-white font-mono">Aucune publication dans cette catégorie.</p>
            <p className="text-xs text-zinc-400">Toutes les publications créées apparaîtront ici avec leur état d'expiration en temps réel.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isLoading = actionLoadingId === item.id;

            return (
              <motion.div
                key={item.id}
                layout
                className="bg-zinc-950/80 border border-zinc-800/80 hover:border-[#D4AF37]/50 rounded-2xl p-4 sm:p-5 transition-all shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                {/* Left details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-[#D4AF37] uppercase">
                      {item.type || item.collectionName}
                    </span>
                    {getStatusBadge(item.status)}
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                      ID: {item.id.slice(0, 12)}
                    </span>
                    {item.commune && (
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        📍 {item.commune}
                      </span>
                    )}
                  </div>

                  {/* Title & Author */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs font-mono text-zinc-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>Auteur : <strong className="text-zinc-200">{item.authorName}</strong></span>
                      {item.budget && item.budget > 0 ? (
                        <span className="text-emerald-400 font-bold">• {item.budget.toLocaleString("fr-FR")} FCFA</span>
                      ) : null}
                    </p>
                  </div>

                  {/* Dates & Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono text-zinc-400 border-t border-zinc-900">
                    <div>
                      <span className="text-zinc-500 text-[9.5px] block">Création</span>
                      <span className="text-zinc-300">{formatDate(item.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[9.5px] block">Expiration</span>
                      <span className={item.status === "EXPIREE" ? "text-amber-400 font-bold" : "text-zinc-300"}>
                        {formatDate(item.expiresAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[9.5px] block">Vues / Engagements</span>
                      <span className="text-zinc-300">
                        👁️ {item.viewsCount} • ❤️ {item.likesCount} • 💬 {item.commentsCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[9.5px] block">Candidatures</span>
                      <span className="text-zinc-300">
                        📝 {item.applicationsCount}
                      </span>
                    </div>
                  </div>

                  {/* Flag warning if reported */}
                  {(item.isFlagged || (item.reportsCount && item.reportsCount > 0) || item.reportReason) && (
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{item.reportsCount || 1} signalement(s) — {item.reportReason || "Signalé par la communauté"}</span>
                    </div>
                  )}
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-900 shrink-0">
                  {/* VOIR */}
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-[#D4AF37] text-zinc-100 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>VOIR</span>
                  </button>

                  {/* ARCHIVER / DESARCHIVER */}
                  <button
                    onClick={() => handleArchive(item)}
                    disabled={isLoading}
                    className={`px-3 py-2 border rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                      item.status === "ARCHIVEE"
                        ? "bg-zinc-800 border-zinc-600 text-zinc-200 hover:bg-zinc-700"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{item.status === "ARCHIVEE" ? "DÉSARCHIVER" : "ARCHIVER"}</span>
                  </button>

                  {/* SUPPRIMER */}
                  <button
                    onClick={() => setItemToDelete(item)}
                    disabled={isLoading}
                    className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 hover:border-red-600 text-red-300 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>SUPPRIMER</span>
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Publication Detail Bottom Sheet */}
      <FounderBottomSheet
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={
          selectedItem ? (
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#D4AF37]" />
              <span className="font-mono uppercase font-black">{selectedItem.title}</span>
            </div>
          ) : "Détails"
        }
        subtitle={selectedItem ? `ID Document: ${selectedItem.id} • Collection: ${selectedItem.collectionName}` : ""}
        maxHeight="85dvh"
      >
        {selectedItem && (
          <div className="space-y-6 text-left font-sans">
            {/* Header info */}
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedItem.status)}
                  <span className="text-xs font-mono text-zinc-400">
                    Catégorie: <strong>{selectedItem.category || selectedItem.type}</strong>
                  </span>
                </div>
                {selectedItem.budget && selectedItem.budget > 0 ? (
                  <span className="text-sm font-black font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                    {selectedItem.budget.toLocaleString("fr-FR")} FCFA
                  </span>
                ) : null}
              </div>

              {/* Author box */}
              <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold">
                  {selectedItem.authorAvatar ? (
                    <img src={selectedItem.authorAvatar} alt="" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{selectedItem.authorName}</h4>
                  <p className="text-[10px] font-mono text-zinc-400">UID: {selectedItem.authorId || "Non spécifié"}</p>
                </div>
              </div>
            </div>

            {/* Description & Media */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-black text-zinc-300">Contenu & Description</h4>
              <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {selectedItem.description || selectedItem.caption || "Aucune description détaillée."}
              </div>

              {selectedItem.mediaUrl && (
                <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black/40">
                  <img
                    src={selectedItem.mediaUrl}
                    alt={selectedItem.title}
                    className="w-full max-h-72 object-contain bg-black"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>

            {/* Dates & Telemetry */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <span className="text-[10px] font-mono text-zinc-500 block">Créé le</span>
                <span className="text-xs font-bold text-zinc-200">{formatDate(selectedItem.createdAt)}</span>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <span className="text-[10px] font-mono text-zinc-500 block">Date d'expiration</span>
                <span className={`text-xs font-bold ${selectedItem.status === "EXPIREE" ? "text-amber-400" : "text-zinc-200"}`}>
                  {formatDate(selectedItem.expiresAt)}
                </span>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono text-zinc-500 block">Commune / Lieu</span>
                <span className="text-xs font-bold text-zinc-200">{selectedItem.commune || "Abidjan (Global)"}</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="p-3.5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-around text-center text-xs font-mono">
              <div>
                <span className="text-zinc-500 text-[10px] block">Vues</span>
                <span className="text-white font-bold">{selectedItem.viewsCount}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block">J'aime</span>
                <span className="text-white font-bold">{selectedItem.likesCount}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block">Commentaires</span>
                <span className="text-white font-bold">{selectedItem.commentsCount}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block">Candidatures</span>
                <span className="text-emerald-400 font-bold">{selectedItem.applicationsCount}</span>
              </div>
            </div>

            {/* Actions footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                onClick={() => handleToggleSuspend(selectedItem)}
                className="px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
              >
                {selectedItem.status === "SUSPENDUE" ? "RÉACTIVER" : "SUSPENDRE"}
              </button>
              <button
                onClick={() => handleArchive(selectedItem)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
              >
                {selectedItem.status === "ARCHIVEE" ? "DÉSARCHIVER" : "ARCHIVER"}
              </button>
              <button
                onClick={() => setItemToDelete(selectedItem)}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer shadow-md"
              >
                SUPPRIMER DÉFINITIVEMENT
              </button>
            </div>
          </div>
        )}
      </FounderBottomSheet>
    </div>
  );
};

export default AdminPublicationsManager;
