import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Film,
  Bookmark,
  Archive,
  EyeOff,
  Eye,
  Trash2,
  Edit3,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Clock,
  Heart,
  MessageSquare,
  Loader2,
  Plus
} from "lucide-react";
import { useAuth } from "../AuthContext";
import { reelsDraftsService, ReelDraft } from "../lib/reelsDraftsService";
import { publicationService, PublicationItem } from "../lib/publicationService";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import ReelCreatorScreen from "./reels/ReelCreatorScreen";

type TabType = "published" | "drafts" | "archived" | "hidden";

interface MyPublicationsSectionProps {
  onOpenCreate?: () => void;
  onClose?: () => void;
}

export default function MyPublicationsSection({ onOpenCreate, onClose }: MyPublicationsSectionProps) {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  const [activeTab, setActiveTab] = useState<TabType>("published");
  const [publications, setPublications] = useState<PublicationItem[]>([]);
  const [drafts, setDrafts] = useState<ReelDraft[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active item for deletion confirmation modal
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "pub" | "draft"; title: string; storagePath?: string } | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Active draft for resuming in ReelCreatorScreen
  const [editingDraft, setEditingDraft] = useState<ReelDraft | null>(null);

  // Toast message
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Fetch publications from Firestore real-time listener
  useEffect(() => {
    if (!userId) {
      setPublications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "posts"), where("userId", "==", userId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: PublicationItem[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            userId: data.userId || userId,
            authorName: data.authorName,
            caption: data.content || data.caption,
            mediaUrl: data.mediaUrl || data.videoUrl,
            videoUrl: data.videoUrl || data.mediaUrl,
            storagePath: data.storagePath,
            appliedFilter: data.appliedFilter,
            status: data.status || (data.visible === false ? "hidden" : "published"),
            visible: data.visible !== false,
            createdAt: data.createdAt || data.timestamp,
            updatedAt: data.updatedAt,
            likesCount: data.likesCount || (Array.isArray(data.likedBy) ? data.likedBy.length : 0),
            commentsCount: data.commentsCount || (Array.isArray(data.comments) ? data.comments.length : 0),
          });
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setPublications(list);
        setLoading(false);
      },
      (err) => {
        console.warn("[MyPublications] Erreur chargement publications :", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userId]);

  // Load drafts
  const loadDrafts = async () => {
    if (!userId) return;
    try {
      const list = await reelsDraftsService.getUserDrafts(userId);
      setDrafts(list);
    } catch (err) {
      console.warn("[MyPublications] Erreur chargement brouillons :", err);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, [userId]);

  // Action handlers
  const handleUpdateStatus = async (postId: string, newStatus: "published" | "hidden" | "archived") => {
    if (!userId) return;
    const success = await publicationService.updateStatus(postId, userId, newStatus);
    if (success) {
      const labels = {
        published: "Publication restaurée en ligne !",
        hidden: "Publication masquée du fil public.",
        archived: "Publication archivée avec succès."
      };
      showToast(labels[newStatus]);
    } else {
      showToast("Échec de la modification de statut.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !userId) return;
    setDeleting(true);
    try {
      if (itemToDelete.type === "draft") {
        await reelsDraftsService.deleteDraft(itemToDelete.id, userId);
        showToast("Brouillon supprimé définitivement.");
        loadDrafts();
      } else {
        await publicationService.deletePermanently(itemToDelete.id, userId, itemToDelete.storagePath);
        showToast("Publication supprimée définitivement.");
      }
    } catch (err) {
      console.error("Erreur suppression :", err);
      showToast("Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
      setItemToDelete(null);
    }
  };

  // Filter lists according to active tab
  const publishedList = publications.filter((p) => p.status === "published" || (!p.status && p.visible !== false));
  const archivedList = publications.filter((p) => p.status === "archived");
  const hiddenList = publications.filter((p) => p.status === "hidden");

  const tabs = [
    { id: "published", label: "PUBLIÉES", count: publishedList.length, icon: Film },
    { id: "drafts", label: "BROUILLONS", count: drafts.length, icon: Bookmark },
    { id: "archived", label: "ARCHIVÉES", count: archivedList.length, icon: Archive },
    { id: "hidden", label: "MASQUÉES", count: hiddenList.length, icon: EyeOff },
  ];

  if (editingDraft) {
    return (
      <ReelCreatorScreen
        initialDraft={editingDraft}
        onClose={() => {
          setEditingDraft(null);
          loadDrafts();
        }}
        onVideoReady={() => {
          setEditingDraft(null);
          loadDrafts();
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6 text-afri-text">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-afri-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-[#D4AF37]" />
            <h1 className="font-black text-xl md:text-2xl tracking-tight text-afri-text">
              Gestion de mes Publications & Brouillons
            </h1>
          </div>
          <p className="text-xs text-afri-text-sec">
            Contrôlez la visibilité, reprenez vos brouillons et gérez vos Réels AFRIGOMBO.
          </p>
        </div>

        {onOpenCreate && (
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-amber-400 text-black font-black px-4 py-2.5 rounded-full text-xs uppercase tracking-wider shadow-md active:scale-95 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nouveau Réel</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-mono font-bold shrink-0 transition-all cursor-pointer ${
                isActive
                  ? "bg-[#D4AF37] text-black shadow-lg font-black scale-105"
                  : "bg-afri-bg-sec border border-afri-border/40 text-afri-text-sec hover:bg-afri-bg-ter hover:text-afri-text"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-black/20 text-black" : "bg-afri-bg-ter text-afri-text-sec"}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
          <p className="text-xs text-afri-text-sec font-mono">Chargement de vos publications...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* TAB 1: PUBLISHED */}
          {activeTab === "published" && (
            publishedList.length === 0 ? (
              <EmptyState title="Aucune publication en ligne" description="Vos Réels publiés apparaîtront ici." onAction={onOpenCreate} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {publishedList.map((item) => (
                  <PublicationCard
                    key={item.id}
                    item={item}
                    actions={[
                      { label: "Masquer", icon: EyeOff, onClick: () => handleUpdateStatus(item.id, "hidden") },
                      { label: "Archiver", icon: Archive, onClick: () => handleUpdateStatus(item.id, "archived") },
                      { label: "Supprimer", icon: Trash2, danger: true, onClick: () => setItemToDelete({ id: item.id, type: "pub", title: item.caption || "Publication", storagePath: item.storagePath }) },
                    ]}
                  />
                ))}
              </div>
            )
          )}

          {/* TAB 2: DRAFTS */}
          {activeTab === "drafts" && (
            drafts.length === 0 ? (
              <EmptyState title="Aucun brouillon enregistré" description="Enregistrez votre travail en cours depuis l'éditeur pour le reprendre à tout moment." onAction={onOpenCreate} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {drafts.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    onResume={() => setEditingDraft(draft)}
                    onDelete={() => setItemToDelete({ id: draft.id, type: "draft", title: draft.title || "Brouillon sans titre" })}
                  />
                ))}
              </div>
            )
          )}

          {/* TAB 3: ARCHIVED */}
          {activeTab === "archived" && (
            archivedList.length === 0 ? (
              <EmptyState title="Aucune publication archivée" description="Les publications archivées restent conservées sans apparaître dans le fil." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {archivedList.map((item) => (
                  <PublicationCard
                    key={item.id}
                    item={item}
                    actions={[
                      { label: "Restaurer", icon: RotateCcw, onClick: () => handleUpdateStatus(item.id, "published") },
                      { label: "Supprimer définitivement", icon: Trash2, danger: true, onClick: () => setItemToDelete({ id: item.id, type: "pub", title: item.caption || "Publication", storagePath: item.storagePath }) },
                    ]}
                  />
                ))}
              </div>
            )
          )}

          {/* TAB 4: HIDDEN */}
          {activeTab === "hidden" && (
            hiddenList.length === 0 ? (
              <EmptyState title="Aucune publication masquée" description="Les publications masquées ne sont visibles que par vous-même." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {hiddenList.map((item) => (
                  <PublicationCard
                    key={item.id}
                    item={item}
                    actions={[
                      { label: "Rendre visible", icon: Eye, onClick: () => handleUpdateStatus(item.id, "published") },
                      { label: "Supprimer définitivement", icon: Trash2, danger: true, onClick: () => setItemToDelete({ id: item.id, type: "pub", title: item.caption || "Publication", storagePath: item.storagePath }) },
                    ]}
                  />
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* CONFIRMATION DELETION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-sm w-full bg-afri-bg-sec border border-red-500/40 rounded-3xl p-6 space-y-4 shadow-2xl text-afri-text text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-base text-afri-text">Supprimer définitivement ?</h3>
              <p className="text-xs text-afri-text-sec">
                Voulez-vous supprimer « {itemToDelete.title.substring(0, 40)} » ? Cette action est irréversible.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 bg-afri-bg-ter hover:bg-afri-bg-action text-afri-text font-bold rounded-2xl text-xs transition cursor-pointer"
              >
                Annuler
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[10002] bg-[#D4AF37] text-black font-black px-4 py-2.5 rounded-full text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

// Subcomponents: Publication Card & Draft Card
function PublicationCard({
  item,
  actions,
}: {
  item: PublicationItem;
  actions: { label: string; icon: React.FC<{ className?: string }>; danger?: boolean; onClick: () => void }[];
}) {
  return (
    <div className="bg-afri-bg-sec border border-afri-border/50 rounded-2xl p-3 flex flex-col justify-between space-y-3 hover:border-[#D4AF37]/50 transition-all shadow-md group">
      <div className="space-y-2">
        <div className="relative aspect-[9/16] max-h-48 w-full bg-black rounded-xl overflow-hidden flex items-center justify-center">
          {item.mediaUrl ? (
            <video src={item.mediaUrl} className="w-full h-full object-cover" muted />
          ) : (
            <Film className="w-8 h-8 text-zinc-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
            <span className="text-[10px] font-mono text-white/80 line-clamp-1">
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Récemment"}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-bold text-xs line-clamp-2 text-afri-text">
            {item.caption || "Publication Réel"}
          </p>
          <div className="flex items-center gap-3 text-[11px] font-mono text-afri-text-sec">
            <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" /> {item.likesCount || 0}</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3 text-amber-400" /> {item.commentsCount || 0}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 pt-2 border-t border-afri-border/40">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <button
              key={idx}
              onClick={act.onClick}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                act.danger
                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "bg-afri-bg-ter text-afri-text hover:bg-afri-bg-action hover:text-[#D4AF37]"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span className="truncate">{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DraftCard({
  draft,
  onResume,
  onDelete,
}: {
  draft: ReelDraft;
  onResume: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-afri-bg-sec border border-[#D4AF37]/30 rounded-2xl p-3 flex flex-col justify-between space-y-3 hover:border-[#D4AF37] transition-all shadow-md group">
      <div className="space-y-2">
        <div className="relative aspect-[9/16] max-h-48 w-full bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center border border-[#D4AF37]/20">
          <Film className="w-8 h-8 text-[#D4AF37]/60" />
          <div className="absolute top-2 left-2 bg-[#D4AF37] text-black font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
            Brouillon
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
            <span className="text-[10px] font-mono text-amber-300 line-clamp-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Modifié le {new Date(draft.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-bold text-xs line-clamp-1 text-afri-text">
            {draft.title || "Brouillon Réel"}
          </p>
          <p className="text-[10px] font-mono text-afri-text-sec line-clamp-1">
            Filtre : {draft.appliedFilter || "naturel"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-afri-border/40">
        <button
          onClick={onResume}
          className="flex-1 py-1.5 px-3 bg-[#D4AF37] hover:bg-amber-400 text-black font-black rounded-xl text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow-sm"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Reprendre</span>
        </button>

        <button
          onClick={onDelete}
          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs transition cursor-pointer"
          title="Supprimer le brouillon"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  onAction,
}: {
  title: string;
  description: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-afri-bg-sec/50 border border-afri-border/30 rounded-3xl space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center">
        <Film className="w-7 h-7" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="font-black text-base text-afri-text">{title}</h3>
        <p className="text-xs text-afri-text-sec">{description}</p>
      </div>
      {onAction && (
        <button
          onClick={onAction}
          className="bg-[#D4AF37] hover:bg-amber-400 text-black font-black px-5 py-2.5 rounded-full text-xs uppercase tracking-wider shadow-md active:scale-95 transition cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Créer un Réel</span>
        </button>
      )}
    </div>
  );
}
