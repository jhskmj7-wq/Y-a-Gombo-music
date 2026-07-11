import React, { useState, useEffect } from "react";
import {
  Crown,
  Music,
  UploadCloud,
  Play,
  Square,
  Trash2,
  Edit3,
  Check,
  Loader2,
  Volume2,
  Info,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Image as ImageIcon,
  Video as VideoIcon,
  Sparkles,
  FileText,
  Megaphone,
  History,
  RotateCcw,
  Eye,
  Activity,
  Plus,
  ArrowRight,
  Database,
  Calendar,
  AlertTriangle,
  Layers,
  X,
  Lock,
  Download,
  Share2,
  Maximize2
} from "lucide-react";
import { db, gomboDB } from "../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  limit
} from "firebase/firestore";

interface MultimediaCenterProps {
  adminEmail: string;
  isAuthorizedSuperFounder: boolean;
}

interface MediaHistoryItem {
  downloadURL: string;
  storagePath: string;
  title: string;
  updatedAt: string;
  updatedBy: string;
  fileSize?: string;
}

interface MediaAsset {
  id: string;
  title: string;
  category: string;
  storagePath: string;
  downloadURL: string;
  enabled: boolean;
  autoplay: boolean;
  loop: boolean;
  volume: number;
  updatedAt: string;
  updatedBy: string;
  fileSize?: string;
  fileType?: string;
  useCount?: number;
  lastPlayed?: string;
  resolution?: string;
  duration?: string;
  history?: MediaHistoryItem[];
  // Document-specific fields
  content?: string;
  status?: "draft" | "published" | "archived";
}

interface AuditLog {
  id: string;
  mediaId: string;
  mediaTitle: string;
  action: string;
  updatedBy: string;
  timestamp: string;
  details: string;
}

type ActiveSection = "dashboard" | "audio" | "images" | "videos" | "animations" | "documents" | "promotional" | "logs";

export default function MultimediaCenter({ adminEmail, isAuthorizedSuperFounder }: MultimediaCenterProps) {
  const [activeTab, setActiveTab] = useState<ActiveSection>("dashboard");
  const [mediaAssets, setMediaAssets] = useState<Record<string, MediaAsset>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, filter, and sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updatedAt_desc");

  // Upload/Progress States
  type UploadState = "waiting" | "uploading" | "success" | "error";
  interface UploadStatus {
    progress: number;
    state: UploadState;
    error?: string;
  }
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, UploadStatus>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Edit / Form states
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editVolume, setEditVolume] = useState(0.8);
  const [editEnabled, setEditEnabled] = useState(true);
  const [editAutoplay, setEditAutoplay] = useState(false);
  const [editLoop, setEditLoop] = useState(false);
  const [editDuration, setEditDuration] = useState("");
  const [editResolution, setEditResolution] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editStatus, setEditStatus] = useState<"draft" | "published" | "archived">("published");

  // Audio / Video Preview state
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);

  // Image comparison state (Old vs New image URL mockup/upload comparison)
  const [compareAsset, setCompareAsset] = useState<MediaAsset | null>(null);
  const [newCompareFile, setNewCompareFile] = useState<File | null>(null);
  const [newComparePreview, setNewComparePreview] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Interactive Animation Testing Engine Overlay
  const [testAnimationType, setTestAnimationType] = useState<string | null>(null);
  const [isTestingAnimation, setIsTestingAnimation] = useState(false);

  // Standard predefined spots
  const AUDIO_SPOTS = [
    { id: "intro", title: "Introduction officielle", desc: "Symphonie d'accueil jouée au premier démarrage." },
    { id: "anthem", title: "Hymne officiel", desc: "Hymne solennel d'AFRIGOMBO." },
    { id: "throne", title: "Le Trône", desc: "Thème impérial majestueux du Cabinet Privé." },
    { id: "academy", title: "Academy", desc: "Musique d'ambiance d'apprentissage." },
    { id: "market", title: "Marketplace", desc: "Sons d'ambiance de la boutique." },
    { id: "success", title: "Succès", desc: "Effet sonore de transaction réussie." }
  ];

  const IMAGE_SPOTS = [
    { id: "logo", title: "Logo Officiel", desc: "Emblème central d'AFRIGOMBO ELITE." },
    { id: "splash", title: "Écran de démarrage", desc: "Image affichée lors du chargement." },
    { id: "banner_elite", title: "Bannière Elite", desc: "Bannière principale du Club." },
    { id: "bg_throne", title: "Arrière-plan Trône", desc: "Fond texturé du Cabinet Impérial." },
    { id: "illustration_home", title: "Illustration d'accueil", desc: "Graphique décoratif principal." }
  ];

  const VIDEO_SPOTS = [
    { id: "video_intro", title: "Vidéo d'accueil", desc: "Cinématique d'accueil de la plateforme." },
    { id: "video_tutorial", title: "Tutoriel Officiel", desc: "Guide vidéo d'utilisation de l'écosystème." },
    { id: "video_promo", title: "Vidéo Promotionnelle", desc: "Clip de présentation marketing." }
  ];

  const ANIMATION_SPOTS = [
    { id: "anim_opening", title: "Animation d'ouverture", desc: "Effet de fondu enchaîné au lancement." },
    { id: "anim_transition", title: "Transitions de pages", desc: "Glissement fluide entre les menus." },
    { id: "anim_throne", title: "Effet spécial Trône", desc: "Étoiles scintillantes et halos dorés." },
    { id: "anim_premium", title: "Animation VIP", desc: "Ripples de prestige pour les comptes Elite." }
  ];

  const DOCUMENT_SPOTS = [
    { id: "doc_cgu", title: "Conditions Générales d'Utilisation (CGU)", desc: "Contrat d'utilisation d'AFRIGOMBO." },
    { id: "doc_privacy", title: "Politique de Confidentialité", desc: "Traitement des données personnelles." },
    { id: "doc_legal", title: "Mentions Légales", desc: "Informations légales obligatoires." },
    { id: "doc_faq", title: "Foire Aux Questions (FAQ)", desc: "Réponses aux questions fréquentes." }
  ];

  const PROMOTION_SPOTS = [
    { id: "promo_flyer", title: "Affiche Officielle", desc: "Affiche publicitaire de la saison." },
    { id: "promo_banner_social", title: "Bannière Réseaux", desc: "Image de couverture pour Facebook/LinkedIn." },
    { id: "promo_pr_1", title: "Communiqué de Presse", desc: "Dernière annonce média d'AFRIGOMBO." }
  ];

  // Helper: Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "Ko", "Mo", "Go"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  useEffect(() => {
    // 1. Listen to system media assets
    const unsubMedia = onSnapshot(
      collection(db, "media"),
      (snapshot) => {
        const assets: Record<string, MediaAsset> = {};
        snapshot.forEach((doc) => {
          assets[doc.id] = doc.data() as MediaAsset;
        });
        setMediaAssets(assets);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore loading error:", error);
        setLoading(false);
      }
    );

    // 2. Listen to audit logs
    const unsubLogs = onSnapshot(
      query(collection(db, "media_logs"), orderBy("timestamp", "desc"), limit(40)),
      (snapshot) => {
        const logs: AuditLog[] = [];
        snapshot.forEach((doc) => {
          logs.push({ id: doc.id, ...doc.data() } as AuditLog);
        });
        setAuditLogs(logs);
      },
      (error) => {
        console.warn("Audit logs error:", error);
      }
    );

    return () => {
      unsubMedia();
      unsubLogs();
      if (audioPlayer) {
        audioPlayer.pause();
      }
    };
  }, [audioPlayer]);

  // Log action to Firestore
  const logAudit = async (mediaId: string, mediaTitle: string, action: string, details: string) => {
    try {
      await addDoc(collection(db, "media_logs"), {
        mediaId,
        mediaTitle,
        action,
        updatedBy: adminEmail,
        timestamp: new Date().toISOString(),
        details
      });
    } catch (err) {
      console.warn("Could not write audit log:", err);
    }
  };

  // Play preview handler
  const togglePlayAudio = (id: string, url: string) => {
    // Track usage count
    incrementPlayCount(id);

    if (activePreviewId === id) {
      if (audioPlayer) {
        audioPlayer.pause();
      }
      setActivePreviewId(null);
    } else {
      if (audioPlayer) {
        audioPlayer.pause();
      }
      const audioObj = new Audio(url);
      audioObj.play().catch((err) => console.warn("Playback blocked:", err));
      audioObj.onended = () => setActivePreviewId(null);
      setAudioPlayer(audioObj);
      setActivePreviewId(id);
    }
  };

  // Helper to increment play counts elegantly
  const incrementPlayCount = async (id: string) => {
    const asset = mediaAssets[id];
    if (!asset) return;

    const updated = {
      ...asset,
      useCount: (asset.useCount || 0) + 1,
      lastPlayed: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, "media", id), updated);
    } catch (_) {}
  };

  // Handle uploading files safely with history saving
  const handleFileUpload = async (id: string, file: File, sectionName: string) => {
    if (!isAuthorizedSuperFounder) return;

    setUploadingId(id);
    setUploadStatuses((prev) => ({
      ...prev,
      [id]: { progress: 0, state: "waiting" }
    }));

    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    const storagePath = `media/${id}/${Date.now()}_${cleanName}`;
    const formattedSize = formatBytes(file.size);

    try {
      setUploadStatuses((prev) => ({
        ...prev,
        [id]: { progress: 1, state: "uploading" }
      }));

      const downloadURL = await gomboDB.uploadFile(storagePath, file, (progress) => {
        setUploadStatuses((prev) => ({
          ...prev,
          [id]: { progress: Math.max(1, Math.round(progress)), state: "uploading" }
        }));
      });

      if (downloadURL) {
        const existingAsset = mediaAssets[id];
        
        // Build version history element to support perfect ROLLBACKS
        const historyList: MediaHistoryItem[] = existingAsset?.history || [];
        if (existingAsset) {
          historyList.unshift({
            downloadURL: existingAsset.downloadURL,
            storagePath: existingAsset.storagePath,
            title: existingAsset.title,
            updatedAt: existingAsset.updatedAt,
            updatedBy: existingAsset.updatedBy,
            fileSize: existingAsset.fileSize || "Inconnu"
          });
        }

        const newAsset: MediaAsset = {
          id,
          title: file.name.substring(0, file.name.lastIndexOf(".")) || file.name,
          category: sectionName,
          storagePath,
          downloadURL,
          enabled: existingAsset?.enabled !== undefined ? existingAsset.enabled : true,
          autoplay: existingAsset?.autoplay || false,
          loop: existingAsset?.loop || false,
          volume: existingAsset?.volume !== undefined ? existingAsset.volume : 0.8,
          updatedAt: new Date().toISOString(),
          updatedBy: adminEmail,
          fileSize: formattedSize,
          fileType: file.type || file.name.split(".").pop(),
          useCount: existingAsset?.useCount || 0,
          lastPlayed: existingAsset?.lastPlayed || "",
          resolution: existingAsset?.resolution || "",
          duration: existingAsset?.duration || "",
          history: historyList.slice(0, 10) // store up to last 10 versions for safety
        };

        await setDoc(doc(db, "media", id), newAsset);
        await logAudit(
          id,
          newAsset.title,
          "Mise en ligne",
          `Nouveau fichier téléversé de type ${file.type} (${formattedSize})`
        );
        
        setUploadStatuses((prev) => ({
          ...prev,
          [id]: { progress: 100, state: "success" }
        }));

        setTimeout(() => {
          setUploadStatuses((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
          });
        }, 3000);
      }
    } catch (error: any) {
      console.error("Upload process failed:", error);
      setUploadStatuses((prev) => ({
        ...prev,
        [id]: { progress: 0, state: "error", error: error.message || "Erreur de téléversement" }
      }));
    } finally {
      if (uploadingId === id) setUploadingId(null);
    }
  };

  // Rollback to previous version function
  const handleRollback = async (id: string, historyIndex: number) => {
    if (!isAuthorizedSuperFounder) return;
    const asset = mediaAssets[id];
    if (!asset || !asset.history || !asset.history[historyIndex]) return;

    if (!window.confirm("Voulez-vous restaurer cette ancienne version ?")) return;

    const chosenVersion = asset.history[historyIndex];

    // Swap the active media with the selected historical version
    const newHistory = [...asset.history];
    // Remove the chosen item from history, and push the CURRENT active version into history
    newHistory.splice(historyIndex, 1);
    newHistory.unshift({
      downloadURL: asset.downloadURL,
      storagePath: asset.storagePath,
      title: asset.title,
      updatedAt: asset.updatedAt,
      updatedBy: asset.updatedBy,
      fileSize: asset.fileSize || "Inconnu"
    });

    const rolledBackAsset: MediaAsset = {
      ...asset,
      downloadURL: chosenVersion.downloadURL,
      storagePath: chosenVersion.storagePath,
      title: chosenVersion.title,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail,
      fileSize: chosenVersion.fileSize || asset.fileSize,
      history: newHistory
    };

    try {
      await setDoc(doc(db, "media", id), rolledBackAsset);
      await logAudit(
        id,
        rolledBackAsset.title,
        "Restauration",
        `Restauration d'une version antérieure datée du ${new Date(chosenVersion.updatedAt).toLocaleString()}`
      );
    } catch (err) {
      console.error("Rollback failed:", err);
      alert("Erreur de restauration.");
    }
  };

  // Save edits (including document direct markdown edits)
  const handleSaveEdit = async () => {
    if (!isAuthorizedSuperFounder || !editingAsset) return;

    const updated: MediaAsset = {
      ...editingAsset,
      title: editTitle,
      volume: editVolume,
      enabled: editEnabled,
      autoplay: editAutoplay,
      loop: editLoop,
      duration: editDuration,
      resolution: editResolution,
      content: editContent,
      status: editStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail
    };

    try {
      await setDoc(doc(db, "media", editingAsset.id), updated);
      await logAudit(
        editingAsset.id,
        editTitle,
        "Modification",
        `Mise à jour des métadonnées et configurations`
      );
      setEditingAsset(null);
    } catch (err) {
      console.error("Failed updating metadata:", err);
    }
  };

  // Toggle active/inactive state immediately for easy testing
  const toggleEnabled = async (id: string, current: boolean) => {
    if (!isAuthorizedSuperFounder) return;
    const asset = mediaAssets[id];
    if (!asset) return;

    const updated = {
      ...asset,
      enabled: !current,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail
    };

    try {
      await setDoc(doc(db, "media", id), updated);
      await logAudit(
        id,
        asset.title,
        !current ? "Activation" : "Désactivation",
        `Statut changé en ${!current ? "Actif" : "Inactif"}`
      );
    } catch (err) {
      console.error("Failed toggle enabled:", err);
    }
  };

  // Delete media item
  const handleDeleteMedia = async (id: string) => {
    if (!isAuthorizedSuperFounder) return;
    const asset = mediaAssets[id];
    if (!asset) return;

    if (!window.confirm(`Voulez-vous supprimer le média "${asset.title}" ?`)) return;

    try {
      if (activePreviewId === id) {
        if (audioPlayer) audioPlayer.pause();
        setActivePreviewId(null);
      }

      await deleteDoc(doc(db, "media", id));
      await logAudit(
        id,
        asset.title,
        "Suppression",
        `Média système définitivement effacé`
      );
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Interactive Testing Overlay triggering
  const triggerAnimationTest = (type: string) => {
    setTestAnimationType(type);
    setIsTestingAnimation(true);
    logAudit(type, type, "Test interactif", "Lancement d'une animation test impériale sur écran");
    setTimeout(() => {
      setIsTestingAnimation(false);
      setTestAnimationType(null);
    }, 4500);
  };

  // Side-by-side comparison logic for images
  const handleImageCompareSetup = (asset: MediaAsset) => {
    setCompareAsset(asset);
    setNewCompareFile(null);
    setNewComparePreview(null);
    setIsComparing(true);
  };

  const handleCompareFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewCompareFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewComparePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const executeCompareReplace = async () => {
    if (!compareAsset || !newCompareFile) return;
    await handleFileUpload(compareAsset.id, newCompareFile, "images");
    setIsComparing(false);
  };

  // Statistics calculation for Dashboard
  const totalAssets = Object.keys(mediaAssets).length;
  const audioCount = Object.values(mediaAssets).filter(m => ["intro", "anthem", "throne", "academy", "market", "success"].includes(m.id)).length;
  const imagesCount = Object.values(mediaAssets).filter(m => ["logo", "splash", "banner_elite", "bg_throne", "illustration_home"].includes(m.id)).length;
  const videosCount = Object.values(mediaAssets).filter(m => ["video_intro", "video_tutorial", "video_promo"].includes(m.id)).length;
  const docsCount = Object.values(mediaAssets).filter(m => ["doc_cgu", "doc_privacy", "doc_legal", "doc_faq"].includes(m.id)).length;

  // Simulate total storage used
  const totalSpace = 5 * 1024 * 1024 * 1024; // 5 GB
  const simulatedUsedSpace = Object.values(mediaAssets).reduce((acc, asset) => {
    // extract size from "X Mo" or similar or assign standard
    if (asset.fileSize) {
      const val = parseFloat(asset.fileSize);
      if (asset.fileSize.includes("Go")) return acc + val * 1024 * 1024 * 1024;
      if (asset.fileSize.includes("Mo")) return acc + val * 1024 * 1024;
      if (asset.fileSize.includes("Ko")) return acc + val * 1024;
      return acc + val;
    }
    return acc;
  }, 0);

  const lastAdded = Object.values(mediaAssets).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  const lastModified = lastAdded; // since we update in-place

  if (!isAuthorizedSuperFounder) {
    return (
      <div className="p-8 bg-[#030303] border border-red-950 rounded-2xl max-w-2xl mx-auto mt-12 text-center space-y-4">
        <Crown className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
        <h3 className="text-lg font-display font-black text-white uppercase tracking-widest">Accès Impérial Refusé</h3>
        <p className="text-xs text-zinc-500 max-w-md mx-auto">
          Ce module confidentiel de gestion des flux multimédias est réservé exclusivement au Super Fondateur de la plateforme.
        </p>
      </div>
    );
  }

  // Filter & Search computation
  const filteredAssets = Object.values(mediaAssets).filter(asset => {
    const matchesSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase()) || asset.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === "all") return matchesSearch;
    if (filterType === "active") return matchesSearch && asset.enabled;
    if (filterType === "inactive") return matchesSearch && !asset.enabled;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-zinc-300">
      {/* 4.5s Fullscreen Interactive Animation Test Screen Overlay */}
      {isTestingAnimation && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md pointer-events-none animate-fade-in">
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {/* Sparkles / Ripples effects */}
            {testAnimationType === "anim_opening" && (
              <div className="w-96 h-96 bg-[#D4AF37]/20 rounded-full blur-3xl animate-pulse scale-150 transition-all duration-1000" />
            )}
            {testAnimationType === "anim_throne" && (
              <div className="flex gap-4">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full animate-bounce"
                    style={{
                      animationDelay: `${i * 150}ms`,
                      opacity: Math.random(),
                      transform: `translateY(${Math.sin(i) * 50}px)`
                    }}
                  />
                ))}
              </div>
            )}
            {testAnimationType === "anim_premium" && (
              <div className="relative flex items-center justify-center">
                <div className="absolute w-64 h-64 border-4 border-[#D4AF37] rounded-full animate-ping opacity-60" />
                <div className="absolute w-40 h-40 border-2 border-amber-600 rounded-full animate-ping opacity-40" />
                <Crown className="w-16 h-16 text-[#D4AF37] animate-bounce shrink-0" />
              </div>
            )}
            {testAnimationType === "anim_transition" && (
              <div className="w-full h-full bg-gradient-to-r from-amber-950 via-[#D4AF37]/10 to-zinc-950 transition-all duration-500 flex items-center justify-center">
                <div className="text-xl font-mono tracking-widest text-[#D4AF37] uppercase animate-pulse">TRANSLATION IMPÉRIALE...</div>
              </div>
            )}
          </div>
          <div className="z-10 text-center space-y-2">
            <Sparkles className="w-12 h-12 text-[#D4AF37] mx-auto animate-spin" />
            <h4 className="text-sm font-mono font-black text-[#D4AF37] uppercase tracking-widest">
              Test d'Animation : {testAnimationType ? testAnimationType.toUpperCase() : ""}
            </h4>
            <p className="text-[10px] text-zinc-500 font-mono">Simulé sur l'environnement client d'AFRIGOMBO ELITE</p>
          </div>
        </div>
      )}

      {/* HEADER DE LA CONSOLE */}
      <div className="p-6 bg-gradient-to-b from-[#0a0a0a] to-[#040404] border border-zinc-900 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-sm font-display font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              Studio Impérial AFRIGOMBO <span className="text-[10px] font-mono text-amber-500 font-light lowercase">v2.1</span>
            </h3>
          </div>
          <p className="text-[11px] text-zinc-500">
            Console d'administration ultime des assets audio, visuels, vidéos, documents réglementaires et animations de prestige.
          </p>
        </div>

        {/* NAVIGATION DU STUDIO */}
        <div className="flex flex-wrap gap-1.5 bg-black/40 p-1 rounded-xl border border-zinc-900 w-full md:w-auto">
          {(["dashboard", "audio", "images", "videos", "animations", "documents", "promotional", "logs"] as ActiveSection[]).map((tab) => {
            const getIcon = () => {
              switch (tab) {
                case "dashboard": return <Layers className="w-3.5 h-3.5" />;
                case "audio": return <Music className="w-3.5 h-3.5" />;
                case "images": return <ImageIcon className="w-3.5 h-3.5" />;
                case "videos": return <VideoIcon className="w-3.5 h-3.5" />;
                case "animations": return <Sparkles className="w-3.5 h-3.5" />;
                case "documents": return <FileText className="w-3.5 h-3.5" />;
                case "promotional": return <Megaphone className="w-3.5 h-3.5" />;
                case "logs": return <History className="w-3.5 h-3.5" />;
              }
            };

            const getLabel = () => {
              switch (tab) {
                case "dashboard": return "Tableau de Bord";
                case "audio": return "Audio";
                case "images": return "Images";
                case "videos": return "Vidéos";
                case "animations": return "Animations";
                case "documents": return "Documents";
                case "promotional": return "Promotion";
                case "logs": return "Audit logs";
              }
            };

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/25 font-bold"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                {getIcon()}
                <span>{getLabel()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW 1 : TABLEAU DE BORD (DASHBOARD) */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* STATS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[#050505] border border-zinc-900 rounded-xl space-y-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Total Médias Actifs</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-black text-white">{totalAssets}</span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">Synchronisé</span>
              </div>
            </div>
            <div className="p-4 bg-[#050505] border border-zinc-900 rounded-xl space-y-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Répartition Sections</span>
              <div className="text-[10px] font-mono text-zinc-400 space-y-0.5">
                <div className="flex justify-between"><span>🎵 Audio :</span> <span className="text-white font-bold">{audioCount}</span></div>
                <div className="flex justify-between"><span>🖼 Images :</span> <span className="text-white font-bold">{imagesCount}</span></div>
                <div className="flex justify-between"><span>🎥 Vidéos :</span> <span className="text-white font-bold">{videosCount}</span></div>
              </div>
            </div>
            <div className="p-4 bg-[#050505] border border-zinc-900 rounded-xl space-y-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Espace Cloud Storage</span>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-zinc-400">Utilisé : {formatBytes(simulatedUsedSpace)}</span>
                  <span className="text-zinc-650">Max : 5 Go</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-600 to-[#D4AF37]" style={{ width: `${(simulatedUsedSpace / totalSpace) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="p-4 bg-[#050505] border border-zinc-900 rounded-xl space-y-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Activités Système</span>
              <div className="text-[10px] font-mono text-zinc-400 space-y-0.5">
                <div className="flex justify-between"><span>Docs réglementaires :</span> <span className="text-white font-bold">{docsCount}</span></div>
                <div className="flex justify-between"><span>Logs d'audits :</span> <span className="text-white font-bold">{auditLogs.length}</span></div>
              </div>
            </div>
          </div>

          {/* DUAL CODES & RECENT ACTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DERNIERS CHANGEMENTS MULTIMÉDIAS */}
            <div className="p-5 bg-[#050505] border border-zinc-900 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-mono font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> Changements récents d'Assets
                </h4>
                <Database className="w-4 h-4 text-zinc-700" />
              </div>

              {lastAdded ? (
                <div className="p-4 bg-black/60 rounded-xl border border-zinc-900 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-mono bg-[#D4AF37]/5 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/10">
                        {lastAdded.category.toUpperCase()}
                      </span>
                      <h5 className="text-xs font-bold text-white mt-1">{lastAdded.title}</h5>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-550">{lastAdded.fileSize || "Taille inconnue"}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-950">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(lastAdded.updatedAt).toLocaleString()}</span>
                    <span>Par {lastAdded.updatedBy}</span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-zinc-600">Aucun média enregistré pour le moment.</div>
              )}
            </div>

            {/* QUICK AUDIT STREAM */}
            <div className="p-5 bg-[#050505] border border-zinc-900 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-mono font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4" /> Flux d'Audits Impérial
                </h4>
                <button onClick={() => setActiveTab("logs")} className="text-[9px] font-mono text-zinc-500 hover:text-[#D4AF37] uppercase tracking-wider transition-all">
                  Tout voir
                </button>
              </div>

              <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                {auditLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className="p-2.5 bg-black/40 border border-zinc-950 rounded-lg text-[10.5px] font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-300 font-bold">{log.action}</span>
                      <span className="text-zinc-600 text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-zinc-500 text-[10px] leading-tight">
                      Média: {log.mediaTitle} • <span className="text-zinc-600 font-light">{log.details}</span>
                    </p>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <div className="py-12 text-center text-xs text-zinc-650">Aucun log enregistré.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2 : SECTIONS (AUDIO) */}
      {activeTab === "audio" && (
        <div className="space-y-6">
          {/* BARRE DE RECHERCHE, TRIS & FILTRES */}
          <div className="p-4 bg-[#050505] border border-zinc-900 rounded-xl flex flex-col md:flex-row gap-3 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Rechercher une musique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-[#D4AF37] transition-all"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-black border border-zinc-800 rounded-xl px-3 py-2 text-[10.5px] font-mono text-zinc-400 focus:outline-none cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
          </div>

          {/* SOTS AUDIO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {AUDIO_SPOTS.map((spot) => {
              const asset = mediaAssets[spot.id];
              const status = uploadStatuses[spot.id];
              const isUploading = status?.state === 'uploading' || status?.state === 'waiting';
              const progress = status?.progress || 0;
              const hasError = status?.state === 'error';
              const errorMessage = status?.error;
              const isEditing = editingAsset?.id === spot.id;
              const isPlaying = activePreviewId === spot.id;

              return (
                <div key={spot.id} className="p-5 bg-[#050505] border border-zinc-900 rounded-xl space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[9px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded uppercase">
                        Spot : {spot.id}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1.5">{spot.title}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{spot.desc}</p>
                    </div>

                    {asset && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => togglePlayAudio(spot.id, asset.downloadURL)}
                          className={`p-2 rounded-lg cursor-pointer border transition-all ${
                            isPlaying
                              ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                              : "bg-black border-zinc-800 text-[#D4AF37] hover:border-[#D4AF37]"
                          }`}
                          title="Écouter le son actuel"
                        >
                          {isPlaying ? <Square className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-[#D4AF37]" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {asset ? (
                    <div className="space-y-3 pt-3 border-t border-zinc-950">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[9px] font-mono text-zinc-550 block mb-1">Titre Personnalisé</label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full bg-black border border-zinc-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-mono text-zinc-550 block mb-1">Volume ({Math.round(editVolume * 100)}%)</label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={editVolume}
                                onChange={(e) => setEditVolume(parseFloat(e.target.value))}
                                className="w-full appearance-none h-1 bg-zinc-800 rounded accent-[#D4AF37] cursor-pointer"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-zinc-400">Statut Actif</span>
                              <input
                                type="checkbox"
                                checked={editEnabled}
                                onChange={(e) => setEditEnabled(e.target.checked)}
                                className="sr-only peer"
                                id={`enabled-${spot.id}`}
                              />
                              <label htmlFor={`enabled-${spot.id}`} className="w-8 h-4.5 bg-zinc-900 peer-checked:bg-[#D4AF37] rounded-full relative cursor-pointer after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-black after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5"></label>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button onClick={handleSaveEdit} className="flex-1 py-2 bg-[#D4AF37] text-black font-bold text-[10px] uppercase rounded-xl hover:opacity-95 transition-all">
                              Enregistrer
                            </button>
                            <button onClick={() => setEditingAsset(null)} className="px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-white text-[10px] uppercase rounded-xl transition-all">
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-[10.5px] font-mono">
                          <div className="flex justify-between items-center text-[10px] text-zinc-400 bg-black/40 p-2 rounded-lg border border-zinc-950">
                            <span className="text-white truncate font-sans font-bold max-w-[60%]">{asset.title}</span>
                            <span>{asset.fileSize || "Taille inconnue"}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[9.5px] text-zinc-500">
                            <span>Lectures : <strong className="text-zinc-300">{asset.useCount || 0}</strong></span>
                            <span className="truncate">Dernière éco : <strong className="text-zinc-300">{asset.lastPlayed ? new Date(asset.lastPlayed).toLocaleTimeString() : "Jamais"}</strong></span>
                            <span>Modifié par : <strong className="text-zinc-400">{asset.updatedBy}</strong></span>
                            <span>Date : <strong className="text-zinc-400">{new Date(asset.updatedAt).toLocaleDateString()}</strong></span>
                          </div>

                          {/* REPLACEMENT HISTORY ACCORDION */}
                          {asset.history && asset.history.length > 0 && (
                            <div className="mt-3 bg-black/20 p-2.5 rounded-lg border border-dashed border-zinc-900/60 space-y-1.5">
                              <span className="text-[8.5px] text-[#D4AF37] uppercase tracking-wider font-bold block flex items-center gap-1">
                                <History className="w-3 h-3" /> Historique des remplacements :
                              </span>
                              <div className="space-y-1 max-h-[85px] overflow-y-auto pr-1">
                                {asset.history.map((hist, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-[9px] text-zinc-500 bg-black/40 p-1 rounded">
                                    <span className="truncate max-w-[50%]" title={hist.title}>{hist.title}</span>
                                    <div className="flex items-center gap-2">
                                      <span>{new Date(hist.updatedAt).toLocaleDateString()}</span>
                                      <button
                                        onClick={() => handleRollback(spot.id, idx)}
                                        className="text-amber-500 hover:text-amber-400 cursor-pointer flex items-center gap-0.5"
                                        title="Restaurer cette version"
                                      >
                                        <RotateCcw className="w-2.5 h-2.5" /> Rétablir
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => {
                                setEditingAsset(asset);
                                setEditTitle(asset.title);
                                setEditVolume(asset.volume);
                                setEditEnabled(asset.enabled);
                                setEditAutoplay(asset.autoplay);
                                setEditLoop(asset.loop);
                              }}
                              className="flex-1 py-1.5 bg-black border border-zinc-800 text-zinc-300 text-[10px] font-bold uppercase rounded-xl hover:border-zinc-700 hover:text-white transition-all cursor-pointer"
                            >
                              Paramètres
                            </button>

                            <label className="px-3 py-1.5 bg-black border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[10px] font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1">
                              <UploadCloud className="w-3.5 h-3.5" /> Remplacer
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(spot.id, file, "audio");
                                }}
                                className="hidden"
                              />
                            </label>

                            <button
                              onClick={() => handleDeleteMedia(spot.id)}
                              className="p-1.5 bg-red-950/10 hover:bg-red-950/30 border border-red-950/20 text-red-400 rounded-xl cursor-pointer transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-zinc-900/40 text-center py-6 bg-black/20 border border-dashed border-zinc-900 rounded-xl">
                      {isUploading ? (
                        <div className="space-y-1.5">
                          <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin mx-auto" />
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">Envoi... {progress}%</span>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1 px-4 py-2 bg-[#D4AF37] text-black font-black uppercase text-[9.5px] rounded-xl cursor-pointer hover:opacity-90 active:scale-95 transition-all">
                          <UploadCloud className="w-3.5 h-3.5" /> Téléverser l'audio officiel
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(spot.id, file, "audio");
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3 : IMAGES (IMAGES ET GRAPHISMES) */}
      {activeTab === "images" && (
        <div className="space-y-6">
          {/* VISUAL IMAGE COMPARISON MODAL */}
          {isComparing && compareAsset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-[#050505] border border-zinc-900 rounded-2xl p-6 w-full max-w-4xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                  <h4 className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Comparer et Remplacer l'image
                  </h4>
                  <button onClick={() => setIsComparing(false)} className="text-zinc-550 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Old Image */}
                  <div className="p-4 bg-black/40 border border-zinc-950 rounded-xl space-y-2 text-center">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">Version Active Actuelle</span>
                    <div className="h-48 w-full bg-zinc-950 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-900 relative">
                      <img
                        src={compareAsset.downloadURL}
                        alt="Active version"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 mt-1 block truncate">{compareAsset.title}</span>
                  </div>

                  {/* Right: New uploaded candidate or dragzone */}
                  <div className="p-4 bg-black/40 border border-zinc-950 rounded-xl space-y-2 text-center flex flex-col justify-between">
                    <span className="text-[9px] font-mono text-amber-500 uppercase block">Nouvelle Image Candidate</span>
                    {newComparePreview ? (
                      <div className="h-48 w-full bg-zinc-950 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-900">
                        <img
                          src={newComparePreview}
                          alt="New candidate"
                          className="max-h-full max-w-full object-contain animate-pulse"
                        />
                      </div>
                    ) : (
                      <div className="h-48 w-full border-dashed border border-zinc-850 bg-zinc-950/20 rounded-lg flex flex-col items-center justify-center p-4">
                        <UploadCloud className="w-8 h-8 text-zinc-650 mb-2" />
                        <label className="px-3 py-1.5 bg-[#D4AF37] text-black font-bold text-[9.5px] rounded-lg cursor-pointer uppercase">
                          Sélectionner
                          <input type="file" accept="image/*" onChange={handleCompareFileSelect} className="hidden" />
                        </label>
                      </div>
                    )}
                    <span className="text-[10px] font-mono text-zinc-500 block truncate">
                      {newCompareFile ? newCompareFile.name : "Aucun fichier choisi"}
                    </span>
                  </div>
                </div>

                {/* SLIDER COMPARE OVERLAY / CONFIRM */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={executeCompareReplace}
                    disabled={!newCompareFile}
                    className="flex-1 py-2 bg-[#D4AF37] disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-[10px] uppercase rounded-xl tracking-wider transition-all"
                  >
                    Valider le Remplacement Impérial
                  </button>
                  <button onClick={() => setIsComparing(false)} className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] uppercase rounded-xl transition-all">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SPOTS IMAGES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {IMAGE_SPOTS.map((spot) => {
              const asset = mediaAssets[spot.id];
              const status = uploadStatuses[spot.id];
              const isUploading = status?.state === 'uploading' || status?.state === 'waiting';
              const progress = status?.progress || 0;
              const hasError = status?.state === 'error';
              const errorMessage = status?.error;

              return (
                <div key={spot.id} className="p-4 bg-[#050505] border border-zinc-900 rounded-xl space-y-4 flex flex-col justify-between relative overflow-hidden group">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">ID: {spot.id}</span>
                    <h4 className="text-xs font-black text-white">{spot.title}</h4>
                    <p className="text-[10px] text-zinc-550 leading-tight">{spot.desc}</p>
                  </div>

                  {asset ? (
                    <div className="space-y-3 pt-3 border-t border-zinc-950 mt-2">
                      <div className="h-32 w-full bg-zinc-950 border border-zinc-900 rounded-lg overflow-hidden flex items-center justify-center relative">
                        <img
                          src={asset.downloadURL}
                          alt={asset.title}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-all duration-300"
                        />
                        <button
                          onClick={() => window.open(asset.downloadURL, "_blank")}
                          className="absolute bottom-2 right-2 p-1 bg-black/60 hover:bg-[#D4AF37] hover:text-black rounded text-white transition-all cursor-pointer"
                          title="Agrandir"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[9.5px] font-mono text-zinc-550 space-y-0.5">
                        <div className="flex justify-between"><span>Poids :</span> <span className="text-zinc-300">{asset.fileSize || "Inconnu"}</span></div>
                        <div className="flex justify-between"><span>Type :</span> <span className="text-zinc-300 truncate max-w-[60%]">{asset.fileType || "image"}</span></div>
                        <div className="flex justify-between"><span>Dernier edit :</span> <span className="text-zinc-300">{new Date(asset.updatedAt).toLocaleDateString()}</span></div>
                      </div>

                      <div className="flex gap-1.5 pt-1">
                        <button
                          onClick={() => handleImageCompareSetup(asset)}
                          className="flex-1 py-1.5 bg-black border border-zinc-850 hover:border-zinc-700 text-[#D4AF37] text-[9.5px] font-bold uppercase rounded-lg transition-all cursor-pointer"
                        >
                          Comparer & Remplacer
                        </button>
                        <button
                          onClick={() => handleDeleteMedia(spot.id)}
                          className="p-1.5 bg-red-950/10 hover:bg-red-950/30 border border-red-950/20 text-red-400 rounded-lg cursor-pointer transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 bg-black/20 border border-dashed border-zinc-900 rounded-lg text-center mt-3">
                      {isUploading ? (
                        <div className="space-y-1">
                          <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin mx-auto" />
                          <span className="text-[9px] font-mono text-zinc-550">Upload: {progress}%</span>
                        </div>
                      ) : hasError ? (
                        <div className="space-y-2">
                          <span className="text-[10px] text-red-500 block">{errorMessage}</span>
                          <label className="inline-flex px-3 py-1.5 bg-red-950/20 text-red-400 font-bold uppercase text-[9px] rounded-lg cursor-pointer transition-all border border-red-950/30 hover:bg-red-950/40">
                            Réessayer
                            <input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(spot.id, file, "media");
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="inline-flex px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-[#D4AF37]/40 font-bold uppercase text-[9px] rounded-lg cursor-pointer transition-all">
                          <UploadCloud className="w-3.5 h-3.5 mr-1" /> Uploader
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(spot.id, file, "images");
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 4 : VIDEOS (VIDÉOS OFFICIELLES) */}
      {activeTab === "videos" && (
        <div className="space-y-6">
          {videoModalUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setVideoModalUrl(null)}>
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 w-full max-w-4xl space-y-3 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setVideoModalUrl(null)} className="absolute -top-10 right-0 text-white hover:text-[#D4AF37] cursor-pointer">
                  Fermer <X className="inline w-5 h-5 ml-1" />
                </button>
                <video src={videoModalUrl} controls autoPlay className="w-full h-auto max-h-[70vh] rounded-xl border border-zinc-900 bg-black" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VIDEO_SPOTS.map((spot) => {
              const asset = mediaAssets[spot.id];
              const status = uploadStatuses[spot.id];
              const isUploading = status?.state === 'uploading' || status?.state === 'waiting';
              const progress = status?.progress || 0;
              const hasError = status?.state === 'error';
              const errorMessage = status?.error;
              const isEditing = editingAsset?.id === spot.id;

              return (
                <div key={spot.id} className="p-5 bg-[#050505] border border-zinc-900 rounded-xl flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Vidéo Spot : {spot.id}</span>
                    <h4 className="text-xs font-black text-white">{spot.title}</h4>
                    <p className="text-[10px] text-zinc-550 leading-tight">{spot.desc}</p>
                  </div>

                  {asset ? (
                    <div className="space-y-3 pt-3 border-t border-zinc-950">
                      {isEditing ? (
                        <div className="space-y-2">
                          <label className="text-[9px] font-mono text-zinc-550 block">Durée de la vidéo (ex: 2m 45s)</label>
                          <input
                            type="text"
                            value={editDuration}
                            onChange={(e) => setEditDuration(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                          />
                          <label className="text-[9px] font-mono text-zinc-550 block">Résolution (ex: 1080p / 60 FPS)</label>
                          <input
                            type="text"
                            value={editResolution}
                            onChange={(e) => setEditResolution(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white"
                          />
                          <div className="flex gap-2 pt-2">
                            <button onClick={handleSaveEdit} className="flex-1 py-1.5 bg-[#D4AF37] text-black font-bold text-[9.5px] uppercase rounded-lg">Enregistrer</button>
                            <button onClick={() => setEditingAsset(null)} className="px-3 py-1.5 bg-zinc-900 text-zinc-400 text-[9.5px] uppercase rounded-lg">Annuler</button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Simulated elegant video card placeholder */}
                          <div className="h-32 bg-zinc-950 border border-zinc-900 rounded-lg flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                            <VideoIcon className="w-10 h-10 text-zinc-650 group-hover:scale-110 transition-all z-20" />
                            <button
                              onClick={() => setVideoModalUrl(asset.downloadURL)}
                              className="absolute z-25 p-3 bg-[#D4AF37] text-black rounded-full shadow-lg group-hover:scale-105 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                            >
                              <Play className="w-5 h-5 fill-black" />
                            </button>
                          </div>

                          <div className="text-[10px] font-mono text-zinc-500 space-y-0.5">
                            <div className="flex justify-between"><span>Durée :</span> <span className="text-zinc-300">{asset.duration || "Non spécifié"}</span></div>
                            <div className="flex justify-between"><span>Résolution :</span> <span className="text-zinc-300">{asset.resolution || "Auto HD"}</span></div>
                            <div className="flex justify-between"><span>Poids :</span> <span className="text-zinc-300">{asset.fileSize || "Inconnu"}</span></div>
                          </div>

                          <div className="flex gap-1.5 pt-1">
                            <button
                              onClick={() => {
                                setEditingAsset(asset);
                                setEditTitle(asset.title);
                                setEditDuration(asset.duration || "");
                                setEditResolution(asset.resolution || "");
                              }}
                              className="flex-1 py-1.5 bg-black border border-zinc-800 hover:border-zinc-750 text-zinc-300 text-[10px] font-bold uppercase rounded-lg cursor-pointer"
                            >
                              Paramètres
                            </button>
                            <label className="px-3 py-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 text-[10px] font-bold uppercase rounded-lg cursor-pointer flex items-center justify-center gap-1">
                              <UploadCloud className="w-3.5 h-3.5" /> Remplacer
                              <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(spot.id, file, "videos");
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 bg-black/20 border border-dashed border-zinc-900 rounded-lg text-center mt-3">
                      {isUploading ? (
                        <div className="space-y-1">
                          <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin mx-auto" />
                          <span className="text-[9px] font-mono text-zinc-550">Upload: {progress}%</span>
                        </div>
                      ) : hasError ? (
                        <div className="space-y-2">
                          <span className="text-[10px] text-red-500 block">{errorMessage}</span>
                          <label className="inline-flex px-3 py-1.5 bg-red-950/20 text-red-400 font-bold uppercase text-[9px] rounded-lg cursor-pointer transition-all border border-red-950/30 hover:bg-red-950/40">
                            Réessayer
                            <input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(spot.id, file, "media");
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="inline-flex px-3 py-1.5 bg-[#D4AF37] text-black font-black uppercase text-[9.5px] rounded-lg cursor-pointer transition-all">
                          <UploadCloud className="w-3.5 h-3.5 mr-1" /> Téléverser la vidéo
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(spot.id, file, "videos");
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 5 : ANIMATIONS (EFFETS SPECIAUX & PREMIUM) */}
      {activeTab === "animations" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ANIMATION_SPOTS.map((spot) => {
              const asset = mediaAssets[spot.id];
              const isEnabled = asset ? asset.enabled : true;

              return (
                <div key={spot.id} className="p-5 bg-[#050505] border border-zinc-900 rounded-xl space-y-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-550 uppercase block">Animation ID: {spot.id}</span>
                      <h4 className="text-xs font-black text-white mt-1">{spot.title}</h4>
                      <p className="text-[10px] text-zinc-500 leading-tight">{spot.desc}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleEnabled(spot.id, isEnabled)}
                        className={`text-[9.5px] font-mono uppercase px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          isEnabled
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {isEnabled ? "Activé" : "Désactivé"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-950 flex gap-2">
                    <button
                      onClick={() => triggerAnimationTest(spot.id)}
                      className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-[#D4AF37] hover:opacity-90 text-black font-black text-[10px] uppercase rounded-xl tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-black" /> Tester l'animation en direct
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 6 : DOCUMENTS (CGU, PRIVACY, FAQ, DIRECT EDIT) */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left sidebar with doc selection */}
            <div className="space-y-3 lg:col-span-1">
              {DOCUMENT_SPOTS.map((spot) => {
                const asset = mediaAssets[spot.id];
                const isSelected = editingAsset?.id === spot.id;

                return (
                  <button
                    key={spot.id}
                    onClick={() => {
                      // Set selected doc asset
                      if (asset) {
                        setEditingAsset(asset);
                        setEditTitle(asset.title);
                        setEditContent(asset.content || "");
                        setEditStatus(asset.status || "published");
                      } else {
                        // Create temporary draft
                        setEditingAsset({
                          id: spot.id,
                          title: spot.title,
                          category: "documents",
                          content: "",
                          status: "draft",
                          enabled: true,
                          autoplay: false,
                          loop: false,
                          volume: 1,
                          storagePath: "",
                          downloadURL: "",
                          updatedAt: new Date().toISOString(),
                          updatedBy: adminEmail
                        });
                        setEditTitle(spot.title);
                        setEditContent("");
                        setEditStatus("draft");
                      }
                    }}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex justify-between items-center cursor-pointer ${
                      isSelected
                        ? "bg-[#D4AF37]/10 border-[#D4AF37] text-white"
                        : "bg-[#050505] border-zinc-900 hover:border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <div>
                      <h4 className="text-[11.5px] font-bold">{spot.title}</h4>
                      <p className="text-[9px] text-zinc-500 mt-0.5">{spot.desc}</p>
                    </div>
                    {asset ? (
                      <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                        asset.status === "published"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {asset.status || "Publié"}
                      </span>
                    ) : (
                      <span className="text-[8.5px] font-mono bg-zinc-900 text-zinc-550 border border-zinc-800 px-1.5 py-0.5 rounded uppercase">Vide</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Document Editor */}
            <div className="lg:col-span-2 bg-[#050505] border border-zinc-900 rounded-xl p-5 flex flex-col justify-between min-h-[450px] space-y-4">
              {editingAsset ? (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider block">Édition de Document Officiel</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-550">Statut:</span>
                        <select
                          value={editStatus}
                          onChange={(e: any) => setEditStatus(e.target.value)}
                          className="bg-black border border-zinc-800 rounded-lg p-1 text-[10px] text-zinc-300"
                        >
                          <option value="draft">Brouillon (Draft)</option>
                          <option value="published">Publié (Published)</option>
                          <option value="archived">Archivé (Archived)</option>
                        </select>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-black border border-zinc-850 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37] transition-all"
                      placeholder="Titre officiel du document"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                      {/* Editor Box */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase block">Contenu Markdown / HTML</label>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="Écrivez le contenu officiel d'AFRIGOMBO ici..."
                          className="w-full h-80 bg-black border border-zinc-850 rounded-xl p-3 text-xs font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-[#D4AF37] resize-none"
                        />
                      </div>

                      {/* Live Preview Box */}
                      <div className="space-y-1.5 flex flex-col">
                        <label className="text-[9px] font-mono text-[#D4AF37] uppercase block">Aperçu en temps réel</label>
                        <div className="w-full h-80 bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 overflow-y-auto text-xs text-zinc-400 space-y-3 select-none leading-relaxed">
                          {editContent ? (
                            <div className="prose prose-invert prose-xs">
                              <h4 className="text-white font-bold text-sm border-b border-zinc-900 pb-1.5">{editTitle}</h4>
                              <p className="whitespace-pre-line">{editContent}</p>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-zinc-600 italic">Saisissez du contenu pour voir l'aperçu</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-zinc-950">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 py-2 bg-[#D4AF37] text-black font-black text-[10px] uppercase rounded-xl tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Publier & Déployer en direct
                    </button>
                    <button
                      onClick={() => setEditingAsset(null)}
                      className="px-5 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <FileText className="w-12 h-12 text-zinc-750" />
                  <p className="text-xs text-zinc-500 max-w-sm">
                    Sélectionnez un document officiel à gauche pour modifier son contenu, le prévisualiser en direct ou modifier son statut de publication.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 7 : PROMOTIONAL MEDIA (AFFICHES, FLYERS, PR) */}
      {activeTab === "promotional" && (
        <div className="space-y-6">
          <div className="p-5 bg-[#050505] border border-zinc-900 rounded-xl space-y-2">
            <h4 className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
              <Megaphone className="w-4 h-4" /> Bibliothèque de Matériels Promotionnels Officiels
            </h4>
            <p className="text-[10px] text-zinc-500">
              Téléversez et gérez les ressources marketing (affiches, communiqués, flyers) partagées avec les membres Elite, les médias et les partenaires.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PROMOTION_SPOTS.map((spot) => {
              const asset = mediaAssets[spot.id];
              const status = uploadStatuses[spot.id];
              const isUploading = status?.state === 'uploading' || status?.state === 'waiting';
              const progress = status?.progress || 0;
              const hasError = status?.state === 'error';
              const errorMessage = status?.error;

              return (
                <div key={spot.id} className="p-4 bg-[#050505] border border-zinc-900 rounded-xl flex flex-col justify-between space-y-3 relative overflow-hidden group">
                  <div className="space-y-1">
                    <span className="text-[8.5px] font-mono text-zinc-550 block">SPOT ID: {spot.id}</span>
                    <h5 className="text-xs font-bold text-white">{spot.title}</h5>
                    <p className="text-[10px] text-zinc-500 leading-tight">{spot.desc}</p>
                  </div>

                  {asset ? (
                    <div className="space-y-3 pt-3 border-t border-zinc-950 mt-2">
                      <div className="h-32 w-full bg-zinc-950 border border-zinc-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                        {asset.fileType?.includes("image") ? (
                          <img src={asset.downloadURL} alt={asset.title} referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <FileText className="w-10 h-10 text-zinc-700" />
                        )}
                      </div>

                      <div className="text-[9.5px] font-mono text-zinc-550 space-y-0.5">
                        <div className="flex justify-between"><span>Nom du fichier:</span> <span className="text-zinc-300 truncate max-w-[60%]" title={asset.title}>{asset.title}</span></div>
                        <div className="flex justify-between"><span>Poids :</span> <span className="text-zinc-300">{asset.fileSize || "Inconnu"}</span></div>
                        <div className="flex justify-between"><span>Mis à jour le :</span> <span className="text-zinc-300">{new Date(asset.updatedAt).toLocaleDateString()}</span></div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => window.open(asset.downloadURL, "_blank")}
                          className="flex-1 py-1.5 bg-black border border-zinc-800 text-zinc-300 text-[10px] font-bold uppercase rounded-lg hover:text-white hover:border-zinc-750 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ouvrir
                        </button>
                        <button
                          onClick={() => handleDeleteMedia(spot.id)}
                          className="p-1.5 bg-red-950/10 hover:bg-red-950/30 border border-red-950/20 text-red-400 rounded-lg cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 bg-black/20 border border-dashed border-zinc-900 rounded-lg text-center mt-3">
                      {isUploading ? (
                        <div className="space-y-1">
                          <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin mx-auto" />
                          <span className="text-[9px] font-mono text-zinc-550">Upload: {progress}%</span>
                        </div>
                      ) : hasError ? (
                        <div className="space-y-2">
                          <span className="text-[10px] text-red-500 block">{errorMessage}</span>
                          <label className="inline-flex px-3 py-1.5 bg-red-950/20 text-red-400 font-bold uppercase text-[9px] rounded-lg cursor-pointer transition-all border border-red-950/30 hover:bg-red-950/40">
                            Réessayer
                            <input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(spot.id, file, "media");
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="inline-flex px-3 py-1.5 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/30 font-bold uppercase text-[9px] rounded-lg cursor-pointer transition-all">
                          <UploadCloud className="w-3.5 h-3.5 mr-1" /> Téléverser l'asset
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(spot.id, file, "promotion");
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 8 : AUDIT LOGS (JOURNAUX D'AUDIT COMPLET) */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="p-4 bg-[#050505] border border-zinc-900 rounded-xl flex justify-between items-center">
            <div className="space-y-0.5">
              <h4 className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> Journal de Sécurité & d'Audits du Studio
              </h4>
              <p className="text-[10px] text-zinc-550">
                Toutes les opérations d'édition, de modification, d'activation et de suppression sont horodatées et enregistrées de façon permanente.
              </p>
            </div>
            <button
              onClick={() => logAudit("system", "console", "Rafraîchissement", "Manuel de l'utilisateur")}
              className="p-2 bg-black border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all"
              title="Rafraîchir"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
            </button>
          </div>

          <div className="bg-[#030303] border border-zinc-900 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[10.5px] font-mono text-left">
                <thead className="bg-[#050505] border-b border-zinc-900 text-zinc-500 uppercase tracking-widest text-[9px]">
                  <tr>
                    <th className="p-3">Date & Heure</th>
                    <th className="p-3">Média Target</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Auteur</th>
                    <th className="p-3">Détails de l'opération</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-950/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-950/30 transition-all">
                      <td className="p-3 text-zinc-500">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-3 text-[#D4AF37] font-bold">{log.mediaId}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase border ${
                          log.action.includes("Mise") || log.action.includes("Act")
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10"
                            : log.action.includes("Sup")
                            ? "bg-red-500/10 text-red-400 border-red-500/10"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/10"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-400">{log.updatedBy}</td>
                      <td className="p-3 text-zinc-500 italic">{log.details}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-600">Aucune opération consignée dans le journal d'audit.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
