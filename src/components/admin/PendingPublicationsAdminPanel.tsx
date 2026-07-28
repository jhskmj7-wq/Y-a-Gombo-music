import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ShieldAlert, 
  RefreshCw,
  EyeOff,
  Eye,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { db } from "../../lib/firebase";
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { audioSynth } from "../../lib/audio";

export interface ModeratedPublication {
  id: string;
  collectionName: "social_posts" | "gombos";
  title: string;
  authorName: string;
  authorId: string;
  budget?: number;
  createdAt: string;
  status: string;
  visible?: boolean;
  commune?: string;
  type?: string;
  isFlagged?: boolean;
  reportsCount?: number;
  reportReason?: string;
}

interface PendingPublicationsAdminPanelProps {
  currentUser?: any;
}

export const PendingPublicationsAdminPanel: React.FC<PendingPublicationsAdminPanelProps> = ({
  currentUser
}) => {
  const [items, setItems] = useState<ModeratedPublication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Realtime listener for social_posts
    const unsubPosts = onSnapshot(collection(db, "social_posts"), (snap) => {
      const list: ModeratedPublication[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          collectionName: "social_posts",
          title: data.title || data.caption || "Publication sans titre",
          authorName: data.authorName || data.userName || "Utilisateur",
          authorId: data.authorId || data.userId || "",
          budget: Number(data.budget || data.feeAmount || 0),
          createdAt: data.createdAt || new Date().toISOString(),
          status: data.status || "published",
          visible: data.visible !== false,
          commune: data.commune || "",
          type: data.type || data.postCategory || "Annonce",
          isFlagged: !!data.isFlagged,
          reportsCount: Number(data.reportsCount || 0),
          reportReason: data.reportReason || data.motifs || ""
        });
      });

      // Realtime listener for gombos
      const unsubGombos = onSnapshot(collection(db, "gombos"), (snapGombos) => {
        snapGombos.forEach((d) => {
          const data = d.data();
          const exists = list.some(p => p.id === d.id);
          if (!exists) {
            list.push({
              id: d.id,
              collectionName: "gombos",
              title: data.title || "Gombo sans titre",
              authorName: data.clientName || data.organizerName || "Client",
              authorId: data.clientId || data.organizerId || "",
              budget: Number(data.budget || 0),
              createdAt: data.createdAt || new Date().toISOString(),
              status: data.status || "published",
              visible: data.visible !== false,
              commune: data.commune || "",
              type: data.eventType || "Gombo",
              isFlagged: !!data.isFlagged,
              reportsCount: Number(data.reportsCount || 0),
              reportReason: data.reportReason || data.motifs || ""
            });
          }
        });

        setItems(list);
        setLoading(false);
      }, (err) => {
        console.warn("Gombos moderation sync error:", err);
        setLoading(false);
      });

      return () => unsubGombos();
    }, (err) => {
      console.warn("Social posts moderation sync error:", err);
      setLoading(false);
    });

    return () => unsubPosts();
  }, []);

  const handleHide = async (item: ModeratedPublication) => {
    setActionLoadingId(item.id);
    try {
      await updateDoc(doc(db, item.collectionName, item.id), { visible: false });
      showToast(`👁️ Publication "${item.title}" masquée.`);
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSuspend = async (item: ModeratedPublication) => {
    setActionLoadingId(item.id);
    try {
      await updateDoc(doc(db, item.collectionName, item.id), { status: "suspended", visible: false });
      showToast(`🛑 Publication "${item.title}" suspendue.`);
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestore = async (item: ModeratedPublication) => {
    setActionLoadingId(item.id);
    try {
      await updateDoc(doc(db, item.collectionName, item.id), { status: "PUBLISHED", visible: true });
      showToast(`✅ Publication "${item.title}" restaurée.`);
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (item: ModeratedPublication) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement "${item.title}" ?`)) return;
    setActionLoadingId(item.id);
    try {
      await deleteDoc(doc(db, item.collectionName, item.id));
      showToast(`🗑️ Publication "${item.title}" supprimée.`);
    } catch (err: any) {
      showToast(`❌ Erreur: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (item?.title ?? "").toLowerCase().includes(q) ||
      (item?.authorName ?? "").toLowerCase().includes(q) ||
      (item?.commune ?? "").toLowerCase().includes(q) ||
      (item?.id ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-left font-sans select-none">
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-afri-bg-sec border border-[#D4AF37] text-afri-text px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold"
          >
            <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-afri-bg-sec via-afri-bg-sec/90 to-afri-bg-ter/40 border border-sky-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-sky-500/15 border border-sky-500/30 text-sky-400 rounded-2xl">
                <ShieldAlert className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-afri-text uppercase tracking-wider">
                  MODÉRATION DES PUBLICATIONS
                </h2>
                <p className="text-xs text-afri-text-sec">
                  Masquez, suspendez, restaurez ou supprimez les publications signalées ou non conformes
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-afri-bg/70 border border-afri-border px-3.5 py-2 rounded-2xl text-xs font-mono text-afri-text-sec">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
            <span>Modération Active</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-72">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-afri-text-sec" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher titre, auteur, commune..."
          className="w-full pl-10 pr-4 py-2 bg-afri-bg-sec border border-afri-border focus:border-sky-400 rounded-2xl text-xs text-afri-text outline-none"
        />
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-afri-bg-sec border border-afri-border rounded-3xl space-y-2">
            <RefreshCw className="w-6 h-6 text-sky-400 animate-spin mx-auto" />
            <p className="text-xs text-afri-text-sec font-mono">Chargement des publications...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-10 text-center bg-afri-bg-sec border border-afri-border rounded-3xl space-y-2">
            <FileText className="w-8 h-8 text-afri-text-sec/40 mx-auto" />
            <p className="text-sm font-bold text-afri-text">Aucune publication trouvée.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isLoading = actionLoadingId === item.id;

            return (
              <motion.div
                key={item.id}
                layout
                className="bg-afri-bg-sec border border-afri-border rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-sky-400/40 transition-all shadow-md"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 uppercase">
                      {item.type || item.collectionName}
                    </span>
                    <h4 className="text-sm font-black text-afri-text">{item.title}</h4>
                    {!item.visible && (
                      <span className="text-[9px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded">
                        Masqué
                      </span>
                    )}
                    {item.status === "suspended" && (
                      <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                        Suspendu
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-mono text-afri-text-sec">
                    Par <strong className="text-afri-text">{item.authorName}</strong> {item.commune ? `• Commune : ${item.commune}` : ""} {item.budget ? `• Budget : ${item.budget.toLocaleString('fr-FR')} FCFA` : ""}
                  </p>

                  {(item.isFlagged || (item.reportsCount && item.reportsCount > 0) || item.reportReason) && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Signalements : {item.reportsCount || 1} {item.reportReason ? `— Motif : ${item.reportReason}` : ""}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {item.visible !== false && item.status !== "suspended" ? (
                    <button
                      onClick={() => handleHide(item)}
                      disabled={isLoading}
                      className="px-3 py-2 bg-afri-bg hover:bg-afri-bg-ter border border-afri-border text-afri-text text-xs font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Masquer</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestore(item)}
                      disabled={isLoading}
                      className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Restaurer</span>
                    </button>
                  )}

                  {item.status !== "suspended" && (
                    <button
                      onClick={() => handleSuspend(item)}
                      disabled={isLoading}
                      className="px-3 py-2 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Suspendre</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item)}
                    disabled={isLoading}
                    className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PendingPublicationsAdminPanel;
