import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen, Plus, Search, Pin, Star, Archive, Trash2, Edit3, Save, Clock,
  Tag, CheckSquare, Square, Link as LinkIcon, Image as ImageIcon, Paperclip,
  Bell, History, Filter, Grid, List, X, Check, AlertCircle, RefreshCw,
  Folder, ArrowUpRight, ShieldCheck, Sparkles, FileText, ChevronDown, ChevronUp
} from "lucide-react";
import { gomboDB, db } from "../../firebase";
import {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc, query, where, orderBy, serverTimestamp
} from "firebase/firestore";

export interface NoteChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface NoteLink {
  id: string;
  title: string;
  url: string;
}

export interface NoteAttachment {
  id: string;
  name: string;
  url: string;
  type?: string;
}

export interface NoteHistoryEntry {
  id: string;
  timestamp: string;
  title: string;
  summary: string;
  userEmail: string;
}

export interface FounderNote {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  checklist: NoteChecklistItem[];
  links: NoteLink[];
  images: string[];
  files: NoteAttachment[];
  reminderDate?: string;
  createdAt: string;
  updatedAt: string;
  history?: NoteHistoryEntry[];
}

interface AdminFounderNotebookProps {
  userEmail?: string;
  currentUser?: any;
  audioSynth?: any;
}

const CATEGORIES = [
  "Toutes",
  "Stratégie & Vision",
  "Décrets Impériaux",
  "Technique & Infrastructure",
  "Sécurité & Modération",
  "Finance & Monétisation",
  "Idées & Innovation",
  "Urgent & Bloquant",
  "Personnel"
];

export default function AdminFounderNotebook({
  userEmail = "admin@afrigombo.ci",
  currentUser,
  audioSynth
}: AdminFounderNotebookProps) {
  const founderUid = currentUser?.uid || "founder_super_admin";
  const founderEmail = userEmail || currentUser?.email || "jhs.kmj7@gmail.com";

  // Notes state from Firestore
  const [notes, setNotes] = useState<FounderNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "error">("synced");

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [activeTab, setActiveTab] = useState<"active" | "favorites" | "pinned" | "archive">("active");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "title">("updated");

  // Selected note for editing/viewing modal
  const [editingNote, setEditingNote] = useState<FounderNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState<FounderNote | null>(null);

  // Form states for note editor
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("Stratégie & Vision");
  const [formTagsInput, setFormTagsInput] = useState("");
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formPinned, setFormPinned] = useState(false);
  const [formFavorite, setFormFavorite] = useState(false);
  const [formChecklist, setFormChecklist] = useState<NoteChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [formLinks, setFormLinks] = useState<NoteLink[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [formFiles, setFormFiles] = useState<NoteAttachment[]>([]);
  const [newFileName, setNewFileName] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [formReminder, setFormReminder] = useState("");

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. LISTEN TO FIRESTORE NOTES
  useEffect(() => {
    setLoading(true);
    try {
      const notesRef = collection(gomboDB || db, "founder_notebook_notes");
      // Query notes for this founder or email
      const q = query(
        notesRef,
        where("userEmail", "==", founderEmail)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const loadedNotes: FounderNote[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loadedNotes.push({
              id: docSnap.id,
              userId: data.userId || founderUid,
              userEmail: data.userEmail || founderEmail,
              title: data.title || "Note sans titre",
              content: data.content || "",
              category: data.category || "Stratégie & Vision",
              tags: Array.isArray(data.tags) ? data.tags : [],
              isPinned: !!data.isPinned,
              isFavorite: !!data.isFavorite,
              isArchived: !!data.isArchived,
              checklist: Array.isArray(data.checklist) ? data.checklist : [],
              links: Array.isArray(data.links) ? data.links : [],
              images: Array.isArray(data.images) ? data.images : [],
              files: Array.isArray(data.files) ? data.files : [],
              reminderDate: data.reminderDate || "",
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
              history: Array.isArray(data.history) ? data.history : []
            });
          });

          setNotes(loadedNotes);
          setLoading(false);
          setSyncStatus("synced");
        },
        (error) => {
          console.error("Erreur de synchronisation Firestore Carnet:", error);
          setLoading(false);
          setSyncStatus("error");
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Init Carnet Firestore err:", err);
      setLoading(false);
      setSyncStatus("error");
    }
  }, [founderEmail, founderUid]);

  // Open note for edit or new note
  const openNewNoteModal = () => {
    setIsCreating(true);
    setEditingNote(null);
    setFormTitle("");
    setFormContent("");
    setFormCategory("Stratégie & Vision");
    setFormTags([]);
    setFormTagsInput("");
    setFormPinned(false);
    setFormFavorite(false);
    setFormChecklist([]);
    setFormLinks([]);
    setFormImages([]);
    setFormFiles([]);
    setFormReminder("");
    try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
  };

  const openEditNoteModal = (note: FounderNote) => {
    setIsCreating(false);
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormCategory(note.category || "Stratégie & Vision");
    setFormTags(note.tags || []);
    setFormTagsInput((note.tags || []).join(", "));
    setFormPinned(note.isPinned);
    setFormFavorite(note.isFavorite);
    setFormChecklist(note.checklist || []);
    setFormLinks(note.links || []);
    setFormImages(note.images || []);
    setFormFiles(note.files || []);
    setFormReminder(note.reminderDate || "");
    try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
  };

  // SAVE OR UPDATE NOTE IN FIRESTORE
  const handleSaveNote = async (overrideData?: Partial<FounderNote>) => {
    setSyncStatus("saving");
    const nowIso = new Date().toISOString();

    const title = overrideData?.title !== undefined ? overrideData.title : formTitle.trim() || "Note du Fondateur";
    const content = overrideData?.content !== undefined ? overrideData.content : formContent;
    const category = overrideData?.category !== undefined ? overrideData.category : formCategory;
    const tags = overrideData?.tags !== undefined ? overrideData.tags : formTags;
    const isPinned = overrideData?.isPinned !== undefined ? overrideData.isPinned : formPinned;
    const isFavorite = overrideData?.isFavorite !== undefined ? overrideData.isFavorite : formFavorite;
    const isArchived = overrideData?.isArchived !== undefined ? overrideData.isArchived : (editingNote?.isArchived || false);
    const checklist = overrideData?.checklist !== undefined ? overrideData.checklist : formChecklist;
    const links = overrideData?.links !== undefined ? overrideData.links : formLinks;
    const images = overrideData?.images !== undefined ? overrideData.images : formImages;
    const files = overrideData?.files !== undefined ? overrideData.files : formFiles;
    const reminderDate = overrideData?.reminderDate !== undefined ? overrideData.reminderDate : formReminder;

    try {
      if (editingNote && editingNote.id) {
        // Build history entry
        const historyEntry: NoteHistoryEntry = {
          id: `hist_${Date.now()}`,
          timestamp: nowIso,
          title: editingNote.title,
          summary: `Modification apportée à ${new Date().toLocaleTimeString("fr-FR")}`,
          userEmail: founderEmail
        };

        const existingHistory = editingNote.history || [];
        const updatedHistory = [historyEntry, ...existingHistory].slice(0, 15); // keep last 15 versions

        const docRef = doc(gomboDB || db, "founder_notebook_notes", editingNote.id);
        const payload = {
          title,
          content,
          category,
          tags,
          isPinned,
          isFavorite,
          isArchived,
          checklist,
          links,
          images,
          files,
          reminderDate,
          updatedAt: nowIso,
          history: updatedHistory
        };

        await updateDoc(docRef, payload);
      } else {
        // Create new note
        const newPayload = {
          userId: founderUid,
          userEmail: founderEmail,
          title,
          content,
          category,
          tags,
          isPinned,
          isFavorite,
          isArchived: false,
          checklist,
          links,
          images,
          files,
          reminderDate,
          createdAt: nowIso,
          updatedAt: nowIso,
          history: []
        };

        const colRef = collection(gomboDB || db, "founder_notebook_notes");
        const docAdded = await addDoc(colRef, newPayload);
        setEditingNote({ id: docAdded.id, ...newPayload });
        setIsCreating(false);
      }

      setSyncStatus("synced");
      try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
    } catch (err) {
      console.error("Erreur sauvegarde note Firestore:", err);
      setSyncStatus("error");
    }
  };

  // Toggle quick flags directly on card
  const handleTogglePin = async (e: React.MouseEvent, note: FounderNote) => {
    e.stopPropagation();
    try {
      const docRef = doc(gomboDB || db, "founder_notebook_notes", note.id);
      await updateDoc(docRef, {
        isPinned: !note.isPinned,
        updatedAt: new Date().toISOString()
      });
      try { audioSynth?.playKoraNote?.(300, 0, 0.05, 0.2); } catch (_) {}
    } catch (err) {
      console.error("Erreur toggle pin:", err);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, note: FounderNote) => {
    e.stopPropagation();
    try {
      const docRef = doc(gomboDB || db, "founder_notebook_notes", note.id);
      await updateDoc(docRef, {
        isFavorite: !note.isFavorite,
        updatedAt: new Date().toISOString()
      });
      try { audioSynth?.playKoraNote?.(350, 0, 0.05, 0.2); } catch (_) {}
    } catch (err) {
      console.error("Erreur toggle favorite:", err);
    }
  };

  const handleToggleArchive = async (e: React.MouseEvent, note: FounderNote) => {
    e.stopPropagation();
    try {
      const docRef = doc(gomboDB || db, "founder_notebook_notes", note.id);
      await updateDoc(docRef, {
        isArchived: !note.isArchived,
        updatedAt: new Date().toISOString()
      });
      try { audioSynth?.playValidationSuccess?.(); } catch (_) {}
    } catch (err) {
      console.error("Erreur toggle archive:", err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette note de vos annales ?")) {
      return;
    }
    try {
      const docRef = doc(gomboDB || db, "founder_notebook_notes", noteId);
      await deleteDoc(docRef);
      if (editingNote?.id === noteId) {
        setEditingNote(null);
        setIsCreating(false);
      }
      try { audioSynth?.playValidationSuccess?.(); } catch (_) {}
    } catch (err) {
      console.error("Erreur suppression note:", err);
    }
  };

  // Auto-save on form content change with 1.2s debounce
  const triggerAutoSave = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSyncStatus("saving");
    autoSaveTimerRef.current = setTimeout(() => {
      if (editingNote) {
        handleSaveNote();
      }
    }, 1200);
  };

  // Form sub-handlers for rich items
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: NoteChecklistItem = {
      id: `chk_${Date.now()}`,
      text: newChecklistText.trim(),
      completed: false
    };
    const updated = [...formChecklist, newItem];
    setFormChecklist(updated);
    setNewChecklistText("");
    if (editingNote) triggerAutoSave();
  };

  const handleToggleChecklistInEditor = (id: string) => {
    const updated = formChecklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setFormChecklist(updated);
    if (editingNote) triggerAutoSave();
  };

  const handleRemoveChecklistInEditor = (id: string) => {
    const updated = formChecklist.filter((item) => item.id !== id);
    setFormChecklist(updated);
    if (editingNote) triggerAutoSave();
  };

  const handleToggleChecklistCard = async (e: React.MouseEvent, note: FounderNote, itemId: string) => {
    e.stopPropagation();
    const updatedChecklist = note.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    try {
      const docRef = doc(gomboDB || db, "founder_notebook_notes", note.id);
      await updateDoc(docRef, {
        checklist: updatedChecklist,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Erreur toggle item checklist:", err);
    }
  };

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    const newLink: NoteLink = {
      id: `lnk_${Date.now()}`,
      title: newLinkTitle.trim() || newLinkUrl.trim(),
      url: newLinkUrl.trim().startsWith("http") ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`
    };
    setFormLinks([...formLinks, newLink]);
    setNewLinkTitle("");
    setNewLinkUrl("");
    if (editingNote) triggerAutoSave();
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setFormImages([...formImages, newImageUrl.trim()]);
    setNewImageUrl("");
    if (editingNote) triggerAutoSave();
  };

  const handleAddFile = () => {
    if (!newFileUrl.trim()) return;
    const newFile: NoteAttachment = {
      id: `file_${Date.now()}`,
      name: newFileName.trim() || "Fichier joint",
      url: newFileUrl.trim(),
      type: "document"
    };
    setFormFiles([...formFiles, newFile]);
    setNewFileName("");
    setNewFileUrl("");
    if (editingNote) triggerAutoSave();
  };

  const handleTagsInputChange = (val: string) => {
    setFormTagsInput(val);
    const splitTags = val.split(",").map((t) => t.trim()).filter(Boolean);
    setFormTags(splitTags);
    if (editingNote) triggerAutoSave();
  };

  // FILTER & SORT COMPUTATIONS
  const filteredNotes = notes.filter((n) => {
    // Tab filtering
    if (activeTab === "archive") {
      if (!n.isArchived) return false;
    } else {
      if (n.isArchived) return false;
      if (activeTab === "favorites" && !n.isFavorite) return false;
      if (activeTab === "pinned" && !n.isPinned) return false;
    }

    // Category filtering
    if (selectedCategory !== "Toutes" && n.category !== selectedCategory) {
      return false;
    }

    // Search query filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = n.title.toLowerCase().includes(q);
      const inContent = n.content.toLowerCase().includes(q);
      const inCat = n.category.toLowerCase().includes(q);
      const inTags = n.tags.some((t) => t.toLowerCase().includes(q));
      const inChecklist = n.checklist.some((chk) => chk.text.toLowerCase().includes(q));

      if (!inTitle && !inContent && !inCat && !inTags && !inChecklist) {
        return false;
      }
    }

    return true;
  });

  // Sort notes
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortBy === "created") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    // default "updated"
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const pinnedNotesList = sortedNotes.filter((n) => n.isPinned);
  const unpinnedNotesList = sortedNotes.filter((n) => !n.isPinned);

  // Counter metrics
  const totalNotesCount = notes.filter((n) => !n.isArchived).length;
  const pinnedCount = notes.filter((n) => !n.isArchived && n.isPinned).length;
  const favoriteCount = notes.filter((n) => !n.isArchived && n.isFavorite).length;
  const archivedCount = notes.filter((n) => n.isArchived).length;
  const remindersCount = notes.filter((n) => !n.isArchived && n.reminderDate).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-24 text-left font-sans select-none max-w-7xl mx-auto">

      {/* HEADER BAR & COUNTER BANNER */}
      <div className="bg-afri-bg-sec border border-afri-border/80 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>CAHIER NUMÉRIQUE DU SUPER FONDATEUR</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-bold">
                  SOUVERAIN
                </span>
              </h2>
            </div>
            <p className="text-xs text-afri-text-sec font-mono leading-relaxed">
              Carnet de bord stratégique personnel, notes d'arbitrage et décrets impériaux enregistrés en temps réel dans Firestore.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Sync status badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-afri-bg/80 border border-afri-border text-[10px] font-mono">
              {syncStatus === "saving" ? (
                <span className="text-amber-400 flex items-center gap-1.5 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Auto-enregistrement...
                </span>
              ) : syncStatus === "error" ? (
                <span className="text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" /> Erreur Synchro
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" /> Firestore Direct
                </span>
              )}
            </div>

            <button
              onClick={openNewNoteModal}
              className="px-4 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une note</span>
            </button>
          </div>
        </div>

        {/* METRICS & CATEGORY COUNTERS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5 pt-4 border-t border-zinc-800/80">
          <button
            onClick={() => { setActiveTab("active"); setSelectedCategory("Toutes"); }}
            className={`p-3 rounded-2xl border text-left transition ${
              activeTab === "active" && selectedCategory === "Toutes"
                ? "bg-[#D4AF37]/10 border-[#D4AF37] text-white"
                : "bg-afri-bg/50 border-afri-border text-afri-text-sec hover:border-zinc-700"
            }`}
          >
            <div className="text-[10px] uppercase font-mono tracking-wider text-afri-text-muted">Total Notes</div>
            <div className="text-lg font-black text-white font-mono">{totalNotesCount}</div>
          </button>

          <button
            onClick={() => setActiveTab("pinned")}
            className={`p-3 rounded-2xl border text-left transition ${
              activeTab === "pinned"
                ? "bg-amber-500/10 border-amber-500 text-amber-400"
                : "bg-afri-bg/50 border-afri-border text-afri-text-sec hover:border-zinc-700"
            }`}
          >
            <div className="text-[10px] uppercase font-mono tracking-wider text-afri-text-muted flex items-center gap-1">
              <Pin className="w-3 h-3 text-amber-400" /> Épinglées
            </div>
            <div className="text-lg font-black text-amber-400 font-mono">{pinnedCount}</div>
          </button>

          <button
            onClick={() => setActiveTab("favorites")}
            className={`p-3 rounded-2xl border text-left transition ${
              activeTab === "favorites"
                ? "bg-amber-400/10 border-amber-400 text-amber-300"
                : "bg-afri-bg/50 border-afri-border text-afri-text-sec hover:border-zinc-700"
            }`}
          >
            <div className="text-[10px] uppercase font-mono tracking-wider text-afri-text-muted flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-300" /> Favoris
            </div>
            <div className="text-lg font-black text-amber-300 font-mono">{favoriteCount}</div>
          </button>

          <button
            onClick={() => setActiveTab("archive")}
            className={`p-3 rounded-2xl border text-left transition ${
              activeTab === "archive"
                ? "bg-sky-500/10 border-sky-500 text-sky-400"
                : "bg-afri-bg/50 border-afri-border text-afri-text-sec hover:border-zinc-700"
            }`}
          >
            <div className="text-[10px] uppercase font-mono tracking-wider text-afri-text-muted flex items-center gap-1">
              <Archive className="w-3 h-3 text-sky-400" /> Archives
            </div>
            <div className="text-lg font-black text-sky-400 font-mono">{archivedCount}</div>
          </button>

          <div className="p-3 rounded-2xl border border-afri-border bg-afri-bg/50 text-left col-span-2 sm:col-span-1">
            <div className="text-[10px] uppercase font-mono tracking-wider text-afri-text-muted flex items-center gap-1">
              <Bell className="w-3 h-3 text-purple-400" /> Rappels
            </div>
            <div className="text-lg font-black text-purple-400 font-mono">{remindersCount}</div>
          </div>
        </div>
      </div>

      {/* SEARCH, CATEGORIES & VIEW SWITCHER CONTROL BAR */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search bar input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-afri-text-muted absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Rechercher une note, mot-clé, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-muted focus:outline-none focus:border-[#D4AF37] font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-afri-text-muted hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs & Sort & View options */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto scrollbar-none">
            
            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-afri-bg border border-afri-border rounded-xl text-[11px] text-afri-text-sec focus:outline-none focus:border-[#D4AF37] font-mono cursor-pointer"
            >
              <option value="updated">Dernière modification</option>
              <option value="created">Date de création</option>
              <option value="title">Titre A-Z</option>
            </select>

            {/* View Mode Grid/List */}
            <div className="flex items-center bg-afri-bg border border-afri-border rounded-xl p-1 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition ${viewMode === "grid" ? "bg-[#D4AF37] text-black" : "text-afri-text-sec hover:text-white"}`}
                title="Affichage Grille"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition ${viewMode === "list" ? "bg-[#D4AF37] text-black" : "text-afri-text-sec hover:text-white"}`}
                title="Affichage Liste"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories horizontal scroll pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-2 border-t border-zinc-800/60">
          <span className="text-[10px] uppercase font-mono text-afri-text-muted shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Catégorie :
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold uppercase transition whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#D4AF37] text-black shadow-md font-black"
                  : "bg-afri-bg text-afri-text-sec border border-afri-border hover:border-zinc-700 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* NOTES DISPLAY LIST / GRID */}
      {loading ? (
        <div className="p-16 text-center text-afri-text-sec font-mono text-xs space-y-3 flex flex-col items-center">
          <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
          <span>Chargement de votre cahier souverain depuis Firestore...</span>
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="p-12 bg-afri-bg-sec border border-dashed border-zinc-800 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Aucune note enregistrée</h3>
            <p className="text-xs text-afri-text-sec font-mono leading-relaxed">
              {searchQuery || selectedCategory !== "Toutes"
                ? "Aucune note ne correspond à vos critères de recherche actuels."
                : activeTab === "archive"
                ? "Votre corbeille d'archives est vide."
                : "Votre cahier numérique est prêt. Créez votre première note impériale pour consigner vos décisions stratégiques."}
            </p>
          </div>
          <button
            onClick={openNewNoteModal}
            className="px-4 py-2.5 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400 transition cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Rédiger une Note</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* SECTION 1: PINNED NOTES (If active tab is not archive) */}
          {activeTab !== "archive" && pinnedNotesList.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-amber-400 tracking-widest flex items-center gap-2 font-mono border-b border-amber-500/20 pb-2">
                <Pin className="w-3.5 h-3.5 fill-amber-400" />
                NOTES ÉPINGLÉES ({pinnedNotesList.length})
              </h3>

              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
                {pinnedNotesList.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    viewMode={viewMode}
                    onOpenEdit={() => openEditNoteModal(note)}
                    onTogglePin={(e) => handleTogglePin(e, note)}
                    onToggleFav={(e) => handleToggleFavorite(e, note)}
                    onToggleArchive={(e) => handleToggleArchive(e, note)}
                    onDelete={() => handleDeleteNote(note.id)}
                    onToggleChecklist={(e, itemId) => handleToggleChecklistCard(e, note, itemId)}
                    onShowHistory={() => setShowHistoryModal(note)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: REGULAR NOTES */}
          <div className="space-y-3">
            {activeTab !== "archive" && pinnedNotesList.length > 0 && unpinnedNotesList.length > 0 && (
              <h3 className="text-xs font-black uppercase text-afri-text-sec tracking-widest flex items-center gap-2 font-mono border-b border-zinc-800 pb-2">
                AUTRES NOTES ({unpinnedNotesList.length})
              </h3>
            )}

            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
              {(pinnedNotesList.length > 0 && activeTab !== "archive" ? unpinnedNotesList : sortedNotes).map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  viewMode={viewMode}
                  onOpenEdit={() => openEditNoteModal(note)}
                  onTogglePin={(e) => handleTogglePin(e, note)}
                  onToggleFav={(e) => handleToggleFavorite(e, note)}
                  onToggleArchive={(e) => handleToggleArchive(e, note)}
                  onDelete={() => handleDeleteNote(note.id)}
                  onToggleChecklist={(e, itemId) => handleToggleChecklistCard(e, note, itemId)}
                  onShowHistory={() => setShowHistoryModal(note)}
                />
              ))}
            </div>
          </div>

        </div>
      )}

      {/* EDIT / CREATE NOTE MODAL (GOOGLE KEEP / NOTION STYLE) */}
      <AnimatePresence>
        {(isCreating || editingNote) && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-afri-bg-sec border border-[#D4AF37]/40 rounded-3xl w-full max-w-3xl my-auto p-5 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      {isCreating ? "Nouvelle Note Impériale" : "Édition de Note"}
                    </h3>
                    <p className="text-[10px] text-afri-text-sec font-mono">
                      {editingNote ? `Dernière modification : ${new Date(editingNote.updatedAt).toLocaleString("fr-FR")}` : "Enregistrement direct Firestore"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFormPinned(!formPinned)}
                    className={`p-2 rounded-xl border transition ${
                      formPinned ? "bg-amber-500/20 text-amber-400 border-amber-500/50" : "bg-afri-bg text-afri-text-sec border-afri-border"
                    }`}
                    title="Épingler"
                  >
                    <Pin className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setFormFavorite(!formFavorite)}
                    className={`p-2 rounded-xl border transition ${
                      formFavorite ? "bg-amber-400/20 text-amber-300 border-amber-400/50" : "bg-afri-bg text-afri-text-sec border-afri-border"
                    }`}
                    title="Favori"
                  >
                    <Star className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => { setIsCreating(false); setEditingNote(null); }}
                    className="p-2 rounded-xl bg-afri-bg border border-afri-border text-afri-text-sec hover:text-white transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form Content Controls */}
              <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-left font-mono text-xs">
                
                {/* Title & Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] text-afri-text-muted uppercase tracking-wider font-bold">Titre de la Note</label>
                    <input
                      type="text"
                      placeholder="Ex: Stratégie de déploiement réseau 2026..."
                      value={formTitle}
                      onChange={(e) => { setFormTitle(e.target.value); if (editingNote) triggerAutoSave(); }}
                      className="w-full px-3.5 py-2.5 bg-afri-bg border border-afri-border rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-afri-text-muted uppercase tracking-wider font-bold">Catégorie</label>
                    <select
                      value={formCategory}
                      onChange={(e) => { setFormCategory(e.target.value); if (editingNote) triggerAutoSave(); }}
                      className="w-full px-3 py-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                    >
                      {CATEGORIES.filter((c) => c !== "Toutes").map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Main Content Body Area */}
                <div className="space-y-1">
                  <label className="text-[10px] text-afri-text-muted uppercase tracking-wider font-bold">Contenu Textuel</label>
                  <textarea
                    rows={6}
                    placeholder="Saisissez ici vos observations, décrets, comptes-rendus..."
                    value={formContent}
                    onChange={(e) => { setFormContent(e.target.value); if (editingNote) triggerAutoSave(); }}
                    className="w-full p-4 bg-afri-bg border border-afri-border rounded-2xl text-xs text-afri-text leading-relaxed focus:outline-none focus:border-[#D4AF37] resize-y font-mono"
                  />
                </div>

                {/* CHECKLIST SECTION */}
                <div className="space-y-2 p-4 bg-afri-bg/60 border border-afri-border rounded-2xl">
                  <div className="flex items-center justify-between text-afri-text">
                    <span className="text-[10px] uppercase font-bold text-[#D4AF37] flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5" /> Liste de tâches (Checklist)
                    </span>
                    <span className="text-[10px] text-afri-text-muted">
                      {formChecklist.filter((c) => c.completed).length} / {formChecklist.length} effectués
                    </span>
                  </div>

                  {formChecklist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 bg-afri-bg p-2 rounded-xl border border-zinc-800/80">
                      <button
                        onClick={() => handleToggleChecklistInEditor(item.id)}
                        className="flex items-center gap-2 text-xs text-left flex-1 cursor-pointer"
                      >
                        {item.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-500 shrink-0" />
                        )}
                        <span className={item.completed ? "line-through text-zinc-500" : "text-white"}>{item.text}</span>
                      </button>

                      <button
                        onClick={() => handleRemoveChecklistInEditor(item.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Ajouter une tâche à cocher..."
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddChecklistItem(); } }}
                      className="flex-1 px-3 py-1.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      onClick={handleAddChecklistItem}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* LINKS SECTION */}
                <div className="space-y-2 p-4 bg-afri-bg/60 border border-afri-border rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-sky-400 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5" /> Liens utiles & Références
                  </span>

                  {formLinks.map((lnk) => (
                    <div key={lnk.id} className="flex items-center justify-between gap-2 bg-afri-bg p-2 rounded-xl border border-zinc-800/80">
                      <a href={lnk.url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline truncate flex items-center gap-1.5">
                        <ArrowUpRight className="w-3.5 h-3.5" /> {lnk.title}
                      </a>
                      <button
                        onClick={() => { setFormLinks(formLinks.filter((l) => l.id !== lnk.id)); if (editingNote) triggerAutoSave(); }}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Titre du lien (ex: Doc Vercel)"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      className="px-3 py-1.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
                    />
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
                      />
                      <button
                        onClick={handleAddLink}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
                      >
                        + Lien
                      </button>
                    </div>
                  </div>
                </div>

                {/* IMAGES & FILES & REMINDERS ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Images Attachment */}
                  <div className="space-y-2 p-4 bg-afri-bg/60 border border-afri-border rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" /> Galerie d'Images
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {formImages.map((img, idx) => (
                        <div key={idx} className="relative group w-14 h-14 rounded-xl overflow-hidden border border-zinc-700">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => { setFormImages(formImages.filter((_, i) => i !== idx)); if (editingNote) triggerAutoSave(); }}
                            className="absolute top-1 right-1 bg-black/70 text-rose-400 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="URL de l'image (https://...)"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
                      />
                      <button onClick={handleAddImage} className="px-3 py-1.5 bg-zinc-800 text-white rounded-xl text-xs font-bold">
                        + Image
                      </button>
                    </div>
                  </div>

                  {/* Reminder Date/Time */}
                  <div className="space-y-2 p-4 bg-afri-bg/60 border border-afri-border rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5" /> Rappel & Date Limite
                    </span>
                    <input
                      type="datetime-local"
                      value={formReminder}
                      onChange={(e) => { setFormReminder(e.target.value); if (editingNote) triggerAutoSave(); }}
                      className="w-full px-3 py-2 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] font-mono"
                    />
                  </div>
                </div>

                {/* TAGS INPUT */}
                <div className="space-y-1">
                  <label className="text-[10px] text-afri-text-muted uppercase tracking-wider font-bold">Tags / Mots-clés (séparés par virgule)</label>
                  <input
                    type="text"
                    placeholder="ex: urgent, decret, mobile, v2.6"
                    value={formTagsInput}
                    onChange={(e) => handleTagsInputChange(e.target.value)}
                    className="w-full px-3.5 py-2 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

              </div>

              {/* Modal Bottom Actions */}
              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                {editingNote ? (
                  <button
                    onClick={() => handleDeleteNote(editingNote.id)}
                    className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setIsCreating(false); setEditingNote(null); }}
                    className="px-4 py-2 bg-afri-bg border border-afri-border hover:bg-zinc-800 text-afri-text-sec hover:text-white rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                  >
                    Annuler
                  </button>

                  <button
                    onClick={() => handleSaveNote()}
                    className="px-5 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer la note</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODIFICATION HISTORY MODAL */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-afri-bg-sec border border-afri-border rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-black uppercase text-white tracking-wider">Historique des Modifications</h3>
                </div>
                <button onClick={() => setShowHistoryModal(null)} className="text-afri-text-sec hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 font-mono text-xs text-left">
                {(!showHistoryModal.history || showHistoryModal.history.length === 0) ? (
                  <p className="text-afri-text-muted text-center py-6 text-[11px]">
                    Aucune version antérieure répertoriée. Cette note est dans sa version initiale.
                  </p>
                ) : (
                  showHistoryModal.history.map((hist) => (
                    <div key={hist.id} className="p-3 bg-afri-bg border border-afri-border rounded-2xl space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-sky-400">
                        <span>{new Date(hist.timestamp).toLocaleString("fr-FR")}</span>
                        <span>{hist.userEmail}</span>
                      </div>
                      <div className="font-bold text-white text-xs">{hist.title}</div>
                      <p className="text-afri-text-sec text-[11px] leading-tight">{hist.summary}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// NOTE CARD COMPONENT
function NoteCard({
  note,
  viewMode,
  onOpenEdit,
  onTogglePin,
  onToggleFav,
  onToggleArchive,
  onDelete,
  onToggleChecklist,
  onShowHistory
}: {
  note: FounderNote;
  viewMode: "grid" | "list";
  onOpenEdit: () => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onToggleFav: (e: React.MouseEvent) => void;
  onToggleArchive: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onToggleChecklist: (e: React.MouseEvent, itemId: string) => void;
  onShowHistory: () => void;
}) {
  const completedChecklistCount = note.checklist.filter((c) => c.completed).length;

  return (
    <div
      onClick={onOpenEdit}
      className={`bg-afri-bg-sec border rounded-2xl p-4 transition-all duration-200 hover:border-[#D4AF37]/50 cursor-pointer group relative flex flex-col justify-between shadow-md ${
        note.isPinned
          ? "border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent"
          : "border-afri-border/80"
      } ${viewMode === "list" ? "flex-row items-center gap-4" : "min-h-[180px]"}`}
    >
      <div className="space-y-3 flex-1 min-w-0">
        
        {/* Top bar: Category + Actions */}
        <div className="flex items-center justify-between gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-afri-bg text-[#D4AF37] border border-[#D4AF37]/30 truncate max-w-[150px]">
            {note.category}
          </span>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
            <button
              onClick={onTogglePin}
              className={`p-1.5 rounded-lg transition ${note.isPinned ? "text-amber-400 bg-amber-500/10" : "text-zinc-500 hover:text-white"}`}
              title={note.isPinned ? "Désépingler" : "Épingler"}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onToggleFav}
              className={`p-1.5 rounded-lg transition ${note.isFavorite ? "text-amber-300 bg-amber-400/10" : "text-zinc-500 hover:text-white"}`}
              title={note.isFavorite ? "Retirer favori" : "Marquer favori"}
            >
              <Star className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onToggleArchive}
              className={`p-1.5 rounded-lg transition ${note.isArchived ? "text-sky-400 bg-sky-500/10" : "text-zinc-500 hover:text-white"}`}
              title={note.isArchived ? "Désarchiver" : "Archiver"}
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Note Title */}
        <h4 className="text-sm font-black text-white group-hover:text-[#D4AF37] transition leading-snug line-clamp-2">
          {note.title}
        </h4>

        {/* Note Content Snippet */}
        {note.content && (
          <p className="text-xs text-afri-text-sec font-mono line-clamp-3 leading-relaxed">
            {note.content}
          </p>
        )}

        {/* Checklist Snippet */}
        {note.checklist && note.checklist.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-afri-text-muted">
              <span className="flex items-center gap-1 text-[#D4AF37]">
                <CheckSquare className="w-3 h-3" /> Tâches ({completedChecklistCount}/{note.checklist.length})
              </span>
            </div>
            <div className="space-y-1 max-h-24 overflow-hidden">
              {note.checklist.slice(0, 3).map((chk) => (
                <div
                  key={chk.id}
                  onClick={(e) => onToggleChecklist(e, chk.id)}
                  className="flex items-center gap-2 text-[11px] font-mono text-afri-text-sec hover:text-white truncate cursor-pointer"
                >
                  {chk.completed ? (
                    <CheckSquare className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-3 h-3 text-zinc-500 shrink-0" />
                  )}
                  <span className={chk.completed ? "line-through text-zinc-500" : ""}>{chk.text}</span>
                </div>
              ))}
              {note.checklist.length > 3 && (
                <span className="text-[9px] font-mono text-zinc-500">+{note.checklist.length - 3} autres tâches...</span>
              )}
            </div>
          </div>
        )}

        {/* Image Preview Gallery Thumbnails */}
        {note.images && note.images.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
            {note.images.slice(0, 3).map((img, i) => (
              <img key={i} src={img} alt="" className="w-10 h-10 rounded-lg object-cover border border-zinc-700 shrink-0" />
            ))}
          </div>
        )}

        {/* Tags Pills */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-1">
            {note.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-md text-[8px] font-mono bg-zinc-800/80 text-zinc-400 border border-zinc-700">
                #{tag}
              </span>
            ))}
          </div>
        )}

      </div>

      {/* Card Footer: Timestamp & Action Badges */}
      <div className="pt-3 border-t border-zinc-800/60 mt-3 flex items-center justify-between text-[9px] font-mono text-afri-text-muted">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-500" />
            {new Date(note.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>

          {note.history && note.history.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onShowHistory(); }}
              className="text-sky-400 hover:underline flex items-center gap-0.5"
            >
              <History className="w-3 h-3" /> v{note.history.length + 1}
            </button>
          )}
        </div>

        {note.reminderDate && (
          <span className="text-purple-400 flex items-center gap-1 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30">
            <Bell className="w-3 h-3" /> {new Date(note.reminderDate).toLocaleDateString("fr-FR")}
          </span>
        )}
      </div>
    </div>
  );
}
