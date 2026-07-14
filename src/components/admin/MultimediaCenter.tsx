import React, { useState, useEffect, useRef } from "react";
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
  content?: string;
  status?: "draft" | "published" | "archived";

  // Spanish/French properties for direct sync
  nom?: string;
  catégorie?: string;
  url?: string;
  ordre?: number;
  actif?: boolean;
  createdAt?: string;
  uploadedBy?: string;
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

type ActiveSection = "dashboard" | "audio" | "images" | "videos" | "sounds" | "notifications" | "animations" | "system" | "logs";

// Predefined official spots
const AUDIO_SPOTS = [
  { id: "intro", title: "Musique d'introduction", desc: "Symphonie d'accueil jouée au premier démarrage de la plateforme." },
  { id: "anthem", title: "Hymne officiel", desc: "Hymne solennel de prestige d'AFRIGOMBO." },
  { id: "ambient", title: "Musique d'ambiance", desc: "Son continu de fond d'écran pour l'accueil principal." },
  { id: "throne", title: "Musique du Trône", desc: "Thème impérial majestueux réservé au Cabinet Privé." },
  { id: "command", title: "Musique du Centre de Commandement", desc: "Ambiance high-tech immersive du quartier général." },
  { id: "notif_sound", title: "Musique des notifications", desc: "Musique d'ambiance lancée lors des annonces impériales majeures." },
  { id: "event_sound", title: "Musique des événements", desc: "Musique festive pour les défis et événements officiels de la république." }
];

const IMAGE_SPOTS = [
  { id: "splash", title: "Splash Screen", desc: "Écran d'accueil de démarrage affiché lors du chargement initial." },
  { id: "logo", title: "Logo officiel", desc: "Emblème central royal d'AFRIGOMBO ELITE." },
  { id: "icon", title: "Icône de la plateforme", desc: "Icône d'affichage officiel de l'application mobile et web." },
  { id: "bg_home", title: "Fond d'accueil", desc: "Arrière-plan thématique de l'interface principale." },
  { id: "bg_throne", title: "Fond du Trône", desc: "Texture visuelle noble du Cabinet Impérial." },
  { id: "bg_command", title: "Fond du Centre de Commandement", desc: "Arrière-plan dynamique de l'espace de commandement." },
  { id: "img_event", title: "Images d'événements", desc: "Visuel d'en-tête pour les concours et événements officiels." },
  { id: "img_notif", title: "Images des notifications", desc: "Visuel par défaut illustrant les communiqués globaux." }
];

const VIDEO_SPOTS = [
  { id: "video_intro", title: "Vidéo d'accueil", desc: "Cinématique d'accueil de la plateforme (Optionnelle)." },
  { id: "video_event", title: "Vidéo événementielle", desc: "Teaser vidéo immersif pour les événements nationaux." },
  { id: "video_tutorial", title: "Vidéo tutorielle", desc: "Guide audiovisuel officiel pour maîtriser l'écosystème du Gombo." },
  { id: "video_promo", title: "Vidéo promotionnelle", desc: "Clip de présentation marketing d'AFRIGOMBO." }
];

const SOUND_SPOTS = [
  { id: "sound_click", title: "Effet clic", desc: "Bruit de rétroaction tactile lors des pressions sur l'interface." },
  { id: "sound_notif", title: "Effet notification", desc: "Son court de réception de message ou de Gombo." },
  { id: "sound_validate", title: "Effet validation", desc: "Indicateur sonore de réussite pour une soumission." },
  { id: "sound_error", title: "Effet erreur", desc: "Signal sonore d'échec ou d'alerte critique." },
  { id: "sound_payment", title: "Effet paiement", desc: "Bruit de pièces confirmant une transaction financière." },
  { id: "sound_success", title: "Effet succès", desc: "Fanfare de gain de niveau ou de déblocage de certification." }
];

const NOTIFICATION_SPOTS = [
  { id: "notif_banner", title: "Bannière de notification standard", desc: "Illustration graphique horizontale accompagnant les annonces." },
  { id: "notif_popup_img", title: "Image popup d'alerte", desc: "Visuel d'alerte prioritaire apparaissant en plein écran." },
  { id: "notif_newsletter", title: "Visuel d'annonce hebdo", desc: "Bannière hebdomadaire de la gazette du Temple du Gombo." }
];

const ANIMATION_SPOTS = [
  { id: "anim_throne", title: "Animation Trône", desc: "Particules scintillantes et lueurs célestes sur le Cabinet Privé." },
  { id: "anim_login", title: "Animation de connexion", desc: "Transition cinématique haut de gamme à l'identification." },
  { id: "anim_logout", title: "Animation de déconnexion", desc: "Effet de fondu enchaîné élégant lors de la déconnexion." },
  { id: "anim_publish", title: "Animation de publication", desc: "Effet de vibration et onde de prestige lors du Tam-Tam." },
  { id: "anim_payment", title: "Animation de paiement", desc: "Cascade dorée de pièces d'or animées." },
  { id: "anim_cert", title: "Animation de certification", desc: "Sceau rotatif brillant certifiant le statut impérial." }
];

const SYSTEM_SPOTS = [
  { id: "sys_loader", title: "Animation de chargement", desc: "Logo ou indicateur rotatif impérial affiché lors du chargement." },
  { id: "sys_banner_elite", title: "Bannière d'élite", desc: "Visuel d'en-tête exclusif de l'espace VIP." },
  { id: "sys_avatar_fallback", title: "Avatar par défaut", desc: "Image de substitution élégante pour les profils sans photo." },
  { id: "sys_watermark", title: "Filigrane de certification", desc: "Fonds en transparence certifiant l'authenticité d'AFRIGOMBO." },
  { id: "doc_cgu", title: "Conditions Générales d'Utilisation (CGU)", desc: "Contrat d'adhésion juridique d'AFRIGOMBO." },
  { id: "doc_privacy", title: "Politique de Confidentialité", desc: "Règles relatives au traitement des données de la plateforme." }
];

export default function MultimediaCenter({ adminEmail, isAuthorizedSuperFounder }: MultimediaCenterProps) {
  const [activeTab, setActiveTab] = useState<ActiveSection>("dashboard");
  const [mediaAssets, setMediaAssets] = useState<Record<string, MediaAsset>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, filter, and sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Upload/Progress States
  type UploadState = "waiting" | "uploading" | "success" | "error";
  interface UploadStatus {
    progress: number;
    state: UploadState;
    error?: string;
  }
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, UploadStatus>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  interface DiagnosticData {
    bucket?: string;
    projectId?: string;
    apiKey?: string;
    fileName?: string;
    fileSize?: number;
    errorDetails?: {
      code: string;
      message: string;
      stack: string;
    };
    logs: string[];
  }
  const [diagnostics, setDiagnostics] = useState<Record<string, DiagnosticData>>({});

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

  // Image comparison state
  const [compareAsset, setCompareAsset] = useState<MediaAsset | null>(null);
  const [newCompareFile, setNewCompareFile] = useState<File | null>(null);
  const [newComparePreview, setNewComparePreview] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Interactive Animation Testing Engine Overlay
  const [testAnimationType, setTestAnimationType] = useState<string | null>(null);
  const [isTestingAnimation, setIsTestingAnimation] = useState(false);

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Octet";
    const k = 1024;
    const dm = 2;
    const sizes = ["Octets", "Ko", "Mo", "Go"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Real-time synchronization
  useEffect(() => {
    // 1. Listen to media collection
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

  // Play preview handler with volume settings
  const togglePlayAudio = (id: string, url: string, customVolume?: number) => {
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
      audioObj.volume = customVolume !== undefined ? customVolume : 0.8;
      audioObj.preload = "metadata"; // Progressive streaming preload
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

  // Retrieve default spot order
  const getSpotOrder = (id: string, category: string): number => {
    let list: { id: string }[] = [];
    if (category === "audio") list = AUDIO_SPOTS;
    else if (category === "images") list = IMAGE_SPOTS;
    else if (category === "videos") list = VIDEO_SPOTS;
    else if (category === "sounds") list = SOUND_SPOTS;
    else if (category === "notifications") list = NOTIFICATION_SPOTS;
    else if (category === "animations") list = ANIMATION_SPOTS;
    else if (category === "system") list = SYSTEM_SPOTS;

    const idx = list.findIndex((spot) => spot.id === id);
    return idx !== -1 ? idx + 1 : 1;
  };

  // Handle uploading files safely with history saving
  const handleFileUpload = async (id: string, file: File, sectionName: string) => {
    if (!isAuthorizedSuperFounder) return;

    setUploadingId(id);
    setUploadStatuses((prev) => ({
      ...prev,
      [id]: { progress: 1, state: "waiting" }
    }));

    setDiagnostics((prev) => ({
      ...prev,
      [id]: {
        logs: ["Début du transfert impérial..."]
      }
    }));

    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
    
    // Imperial folder organization for Firebase Storage path
    let folder = "media";
    if (sectionName === "audio") folder = "music";
    else if (sectionName === "images") folder = "images";
    else if (sectionName === "videos") folder = "videos";
    else if (sectionName === "sounds") folder = "sounds";
    else if (sectionName === "animations") folder = "animations";
    else if (sectionName === "notifications") folder = "notifications";
    else if (sectionName === "system") folder = "system";

    const storagePath = `${folder}/${id}/${Date.now()}_${cleanName}`;
    const formattedSize = formatBytes(file.size);

    try {
      setUploadStatuses((prev) => ({
        ...prev,
        [id]: { progress: 1, state: "uploading" }
      }));

      const downloadURL = await gomboDB.uploadFile(storagePath, file, (progress: number, details?: any) => {
        setUploadStatuses((prev) => ({
          ...prev,
          [id]: {
            progress: Math.max(1, Math.round(progress)),
            state: details?.state || "uploading",
            error: details?.error ? `${details.error.code}: ${details.error.message}` : undefined
          }
        }));

        if (details) {
          setDiagnostics((prev) => {
            const current = prev[id] || { logs: [] };
            const newLogs = [...current.logs];
            if (details.log && !newLogs.includes(details.log)) {
              newLogs.push(details.log);
            }
            return {
              ...prev,
              [id]: {
                bucket: details.bucket,
                projectId: details.projectId,
                apiKey: details.apiKey,
                fileName: details.fileName,
                fileSize: details.fileSize,
                errorDetails: details.error,
                logs: newLogs
              }
            };
          });
        }
      });

      if (downloadURL) {
        const existingAsset = mediaAssets[id];
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

        const titleText = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
        const currentOrder = getSpotOrder(id, sectionName);

        const newAsset: MediaAsset = {
          id,
          title: titleText,
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
          history: historyList.slice(0, 10),

          // Exact synchronized keys required by Firebase requirements
          nom: titleText,
          catégorie: sectionName,
          url: downloadURL,
          ordre: currentOrder,
          actif: existingAsset?.enabled !== undefined ? existingAsset.enabled : true,
          createdAt: existingAsset?.createdAt || new Date().toISOString(),
          uploadedBy: adminEmail
        };

        await setDoc(doc(db, "media", id), newAsset);
        await logAudit(
          id,
          newAsset.title,
          "Téléversement",
          `Nouveau média téléversé pour ${sectionName} (${formattedSize})`
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
        }, 4000);
      }
    } catch (error: any) {
      console.error("Upload process failed:", error);
      setUploadStatuses((prev) => ({
        ...prev,
        [id]: { progress: 0, state: "error", error: error.message || "Erreur de téléversement" }
      }));
      setDiagnostics((prev) => {
        const current = prev[id] || { logs: [] };
        return {
          ...prev,
          [id]: {
            ...current,
            errorDetails: {
              code: error?.code || "UPLOAD_FAILED",
              message: error?.message || String(error),
              stack: error?.stack || ""
            },
            logs: [...current.logs, `CRASH DU TRANSFERT : ${error?.message || error}`]
          }
        };
      });
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
    const newHistory = [...asset.history];
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
      history: newHistory,

      // Keep French keys in sync
      nom: chosenVersion.title,
      url: chosenVersion.downloadURL
    };

    try {
      await setDoc(doc(db, "media", id), rolledBackAsset);
      await logAudit(
        id,
        rolledBackAsset.title,
        "Restauration",
        `Restauration de la version antérieure du ${new Date(chosenVersion.updatedAt).toLocaleString()}`
      );
    } catch (err) {
      console.error("Rollback failed:", err);
      alert("Erreur de restauration.");
    }
  };

  // Save edits
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
      updatedBy: adminEmail,

      // Synced Spanish/French properties
      nom: editTitle,
      actif: editEnabled
    };

    try {
      await setDoc(doc(db, "media", editingAsset.id), updated);
      await logAudit(
        editingAsset.id,
        editTitle,
        "Modification",
        `Paramètres mis à jour par le Super Fondateur`
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

    const updated: MediaAsset = {
      ...asset,
      enabled: !current,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail,

      // Sync French keys
      actif: !current
    };

    try {
      await setDoc(doc(db, "media", id), updated);
      await logAudit(
        id,
        asset.title,
        !current ? "Activation" : "Désactivation",
        `Média passé au statut ${!current ? "Actif" : "Inactif"}`
      );
    } catch (err) {
      console.error("Failed toggle enabled:", err);
    }
  };

  // Delete media item (resetting it back to empty placeholder)
  const handleDeleteMedia = async (id: string) => {
    if (!isAuthorizedSuperFounder) return;
    const asset = mediaAssets[id];
    if (!asset) return;

    if (!window.confirm(`Voulez-vous supprimer définitivement le média "${asset.title}" ?`)) return;

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
        `Média système définitivement supprimé du catalogue`
      );
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Interactive Testing Overlay triggering
  const triggerAnimationTest = (type: string) => {
    setTestAnimationType(type);
    setIsTestingAnimation(true);
    logAudit(type, type, "Test d'animation", "Déclenchement d'un test visuel impérial interactif");
    setTimeout(() => {
      setIsTestingAnimation(false);
      setTestAnimationType(null);
    }, 4500);
  };

  // Image comparison
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
    await handleFileUpload(compareAsset.id, newCompareFile, compareAsset.category);
    setIsComparing(false);
  };

  // Diagnostic Logs renderer
  const renderDiagnostics = (id: string) => {
    const diag = diagnostics[id];
    const status = uploadStatuses[id];
    if (!diag && !status) return null;

    return (
      <div className="mt-4 p-3 bg-zinc-950 border border-zinc-900 rounded-xl text-left space-y-3 font-mono text-[10px] w-full">
        <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
          <span className="text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 animate-pulse" /> Diagnostics Firebase Storage
          </span>
          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
            status?.state === "success" ? "bg-emerald-500/10 text-emerald-400" :
            status?.state === "error" ? "bg-red-500/10 text-red-400" :
            "bg-blue-500/10 text-blue-400 animate-pulse"
          }`}>
            {status?.state || "En cours"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[9px] text-zinc-400">
          <div><span className="text-zinc-600 font-bold">Bucket :</span> <span className="text-zinc-200">{diag?.bucket || "GomboBucket"}</span></div>
          <div><span className="text-zinc-600 font-bold">Projet ID :</span> <span className="text-zinc-200">{diag?.projectId || "afrigombo-elite"}</span></div>
          <div><span className="text-zinc-605 font-bold">Fichier :</span> <span className="text-zinc-300 truncate block max-w-full" title={diag?.fileName}>{diag?.fileName || "En attente"}</span></div>
          <div><span className="text-zinc-605 font-bold">Taille :</span> <span className="text-zinc-300">{diag?.fileSize ? formatBytes(diag.fileSize) : "Inconnue"}</span></div>
        </div>

        <div className="space-y-1">
          <span className="text-zinc-550 text-[9px] block">Trace de transfert :</span>
          <div className="bg-black/60 p-2 rounded border border-zinc-900 max-h-32 overflow-y-auto space-y-1 scrollbar-thin">
            {diag?.logs.map((log, index) => (
              <div key={index} className="text-zinc-400 leading-normal flex items-start gap-1">
                <span className="text-zinc-600 shrink-0">[{index + 1}]</span>
                <span className="break-all">{log}</span>
              </div>
            ))}
            {(!diag || diag.logs.length === 0) && <span className="text-zinc-600 italic">Connexion au point de montage...</span>}
          </div>
        </div>

        {diag?.errorDetails && (
          <div className="p-2.5 bg-red-950/10 border border-red-950/20 rounded text-red-400 space-y-1">
            <span className="font-bold block uppercase text-[9px]">Alerte de Sécurité / Erreur Firebase :</span>
            <div className="grid grid-cols-1 gap-1 text-[9px] break-all">
              <div><strong className="text-red-350">Code :</strong> {diag.errorDetails.code}</div>
              <div><strong className="text-red-350">Message :</strong> {diag.errorDetails.message}</div>
            </div>
            <div className="mt-2 text-[8px] text-zinc-550 font-sans leading-relaxed">
              💡 <span className="font-bold">Astuce :</span>
              {diag.errorDetails.code === "storage/unauthorized" ? (
                <span> Les règles de sécurité de votre Firebase Storage restreignent l'accès. Le Fondateur doit autoriser les écritures publiques ou connectées dans l'onglet "Rules".</span>
              ) : (
                <span> Vérifiez l'activation de Firebase Storage dans la console Firebase (console.firebase.google.com).</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Statistics Computations
  const totalAssets = Object.keys(mediaAssets).length;
  
  // Real active media counter
  const activeMediaCount = Object.values(mediaAssets).filter((m) => m.enabled).length;

  // Real size accumulator
  const realStorageBytes = Object.values(mediaAssets).reduce((acc, asset) => {
    if (asset.fileSize) {
      const val = parseFloat(asset.fileSize);
      if (asset.fileSize.includes("Go")) return acc + val * 1024 * 1024 * 1024;
      if (asset.fileSize.includes("Mo")) return acc + val * 1024 * 1024;
      if (asset.fileSize.includes("Ko")) return acc + val * 1024;
      return acc + val;
    }
    return acc;
  }, 0);

  const lastUploadItem = Object.values(mediaAssets).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0];

  const currentActiveSong = Object.values(mediaAssets).find(
    (m) => (m.category === "audio" || m.category === "music") && m.enabled
  );

  // Reusable rendering grid for media cards
  const renderMediaGrid = (spots: { id: string; title: string; desc: string }[], sectionName: string, acceptType: string) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spots.map((spot) => {
          const asset = mediaAssets[spot.id];
          const status = uploadStatuses[spot.id];
          const isUploading = status?.state === 'uploading' || status?.state === 'waiting';
          const progress = status?.progress || 0;
          const hasError = status?.state === 'error';
          const errorMessage = status?.error;
          const isEditing = editingAsset?.id === spot.id;
          const isPlaying = activePreviewId === spot.id;

          return (
            <div
              key={spot.id}
              className="p-5 bg-gradient-to-b from-[#050505] to-[#020202] border border-zinc-900 rounded-xl space-y-4 flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="space-y-1.5">
                <div className="flex justify-between items-start">
                  <span className="text-[8px] font-mono bg-zinc-900/80 text-[#D4AF37] px-2 py-0.5 rounded border border-zinc-800 uppercase font-bold tracking-widest">
                    ID: {spot.id}
                  </span>
                  {asset && (
                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${
                      asset.enabled
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {asset.enabled ? "Actif" : "Inactif"}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-black text-white group-hover:text-[#D4AF37] transition-all">{spot.title}</h4>
                <p className="text-[10px] text-zinc-550 leading-relaxed">{spot.desc}</p>
              </div>

              {asset ? (
                <div className="space-y-3 pt-3 border-t border-zinc-950">
                  {/* Preview Display Based on Asset Type */}
                  {sectionName === "audio" || sectionName === "sounds" ? (
                    <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-lg border border-zinc-950">
                      <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[70%]" title={asset.title}>
                        🎵 {asset.title}
                      </span>
                      <button
                        onClick={() => togglePlayAudio(spot.id, asset.downloadURL, asset.volume)}
                        className={`p-2 rounded-lg cursor-pointer border transition-all ${
                          isPlaying
                            ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                            : "bg-black border-zinc-850 text-[#D4AF37] hover:border-[#D4AF37]"
                        }`}
                        title="Écouter l'extrait audio"
                      >
                        {isPlaying ? <Square className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-[#D4AF37]" />}
                      </button>
                    </div>
                  ) : sectionName === "images" || sectionName === "notifications" || sectionName === "system" ? (
                    <div className="h-28 w-full bg-zinc-950 border border-zinc-900 rounded-lg overflow-hidden flex items-center justify-center relative bg-grid-pattern">
                      {asset.downloadURL ? (
                        <img
                          src={asset.downloadURL}
                          alt={asset.title}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-all duration-500"
                          loading="lazy" // Cache intelligent et léger
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-zinc-700" />
                      )}
                      <button
                        onClick={() => window.open(asset.downloadURL, "_blank")}
                        className="absolute bottom-2 right-2 p-1 bg-black/80 hover:bg-[#D4AF37] hover:text-black rounded text-white transition-all cursor-pointer"
                        title="Agrandir l'image"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : sectionName === "videos" ? (
                    <div className="h-28 bg-zinc-950 border border-zinc-900 rounded-lg flex items-center justify-center relative overflow-hidden group/video">
                      <div className="absolute inset-0 bg-black/60 group-hover/video:bg-black/40 transition-all z-10" />
                      <VideoIcon className="w-8 h-8 text-zinc-650 z-20 group-hover/video:scale-110 transition-all" />
                      <button
                        onClick={() => setVideoModalUrl(asset.downloadURL)}
                        className="absolute z-25 p-2 bg-[#D4AF37] text-black rounded-full shadow-lg scale-90 group-hover/video:scale-100 opacity-0 group-hover/video:opacity-100 transition-all cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-black" />
                      </button>
                    </div>
                  ) : null}

                  {/* Paramètres & Metadata Form Editor */}
                  {isEditing ? (
                    <div className="space-y-3 p-3 bg-black/40 rounded-xl border border-zinc-900">
                      <div>
                        <label className="text-[8.5px] font-mono text-zinc-550 block mb-1 uppercase font-bold">Nom personnalisé du média</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-black border border-zinc-850 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      {/* Volume Slider for audios/sounds */}
                      {(sectionName === "audio" || sectionName === "sounds") && (
                        <div>
                          <label className="text-[8.5px] font-mono text-zinc-550 block mb-1 uppercase font-bold">
                            Volume de diffusion ({Math.round(editVolume * 100)}%)
                          </label>
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
                      )}

                      {/* Video Specifications */}
                      {sectionName === "videos" && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8.5px] font-mono text-zinc-550 block mb-0.5">Durée (ex: 1m 20s)</label>
                            <input
                              type="text"
                              value={editDuration}
                              onChange={(e) => setEditDuration(e.target.value)}
                              className="w-full bg-black border border-zinc-850 rounded p-1 text-[10px] text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[8.5px] font-mono text-zinc-550 block mb-0.5">Résolution (ex: 1080p)</label>
                            <input
                              type="text"
                              value={editResolution}
                              onChange={(e) => setEditResolution(e.target.value)}
                              className="w-full bg-black border border-zinc-850 rounded p-1 text-[10px] text-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* Enabled check */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-mono text-zinc-400">Activer le média en direct</span>
                        <input
                          type="checkbox"
                          checked={editEnabled}
                          onChange={(e) => setEditEnabled(e.target.checked)}
                          className="sr-only peer"
                          id={`enabled-chk-${spot.id}`}
                        />
                        <label
                          htmlFor={`enabled-chk-${spot.id}`}
                          className="w-8 h-4.5 bg-zinc-900 peer-checked:bg-[#D4AF37] rounded-full relative cursor-pointer after:content-[''] after:absolute after:top-[2px] after:left-[2.5px] after:bg-zinc-400 peer-checked:after:bg-black after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5"
                        />
                      </div>

                      <div className="flex gap-2 pt-1.5">
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 py-1.5 bg-[#D4AF37] text-black font-black text-[9px] uppercase rounded-lg hover:opacity-95 transition-all"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => setEditingAsset(null)}
                          className="px-3 py-1.5 bg-zinc-900 text-zinc-400 hover:text-white text-[9px] uppercase rounded-lg transition-all"
                        >
                          Fermer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-[10px] font-mono text-zinc-550">
                      <div className="flex justify-between">
                        <span>Poids :</span>
                        <span className="text-zinc-350">{asset.fileSize || "Inconnu"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Éditeur :</span>
                        <span className="text-zinc-400 truncate max-w-[60%]">{asset.updatedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Synchro :</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Temps réel
                        </span>
                      </div>

                      {/* Safety Replacement History Accordion */}
                      {isAuthorizedSuperFounder && asset.history && asset.history.length > 0 && (
                        <div className="mt-2.5 bg-black/20 p-2 rounded-lg border border-dashed border-zinc-900 space-y-1">
                          <span className="text-[8px] text-amber-500/80 font-bold uppercase tracking-wider block flex items-center gap-1">
                            <History className="w-2.5 h-2.5" /> Versions d'Historique :
                          </span>
                          <div className="max-h-16 overflow-y-auto space-y-1 scrollbar-thin">
                            {asset.history.slice(0, 3).map((hist, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[8.5px] bg-black/40 p-1 rounded border border-zinc-950">
                                <span className="truncate max-w-[50%] text-zinc-400" title={hist.title}>{hist.title}</span>
                                <button
                                  onClick={() => handleRollback(spot.id, idx)}
                                  className="text-[8px] font-mono text-[#D4AF37] hover:underline uppercase"
                                >
                                  Restaurer
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Management actions (Super Founder exclusive) */}
                      <div className="flex gap-1.5 pt-2 border-t border-zinc-950">
                        {isAuthorizedSuperFounder ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingAsset(asset);
                                setEditTitle(asset.title);
                                setEditVolume(asset.volume !== undefined ? asset.volume : 0.8);
                                setEditEnabled(asset.enabled !== undefined ? asset.enabled : true);
                                setEditAutoplay(asset.autoplay || false);
                                setEditLoop(asset.loop || false);
                                setEditDuration(asset.duration || "");
                                setEditResolution(asset.resolution || "");
                              }}
                              className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-[9px] font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" /> Configurer
                            </button>
                            <label className="px-2.5 py-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 text-[9px] font-bold uppercase rounded-lg cursor-pointer flex items-center justify-center gap-1">
                              <UploadCloud className="w-3 h-3" /> Remplacer
                              <input
                                type="file"
                                accept={acceptType}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(spot.id, file, sectionName);
                                }}
                                className="hidden"
                              />
                            </label>
                            <button
                              onClick={() => handleDeleteMedia(spot.id)}
                              className="p-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-950/30 text-red-400 rounded-lg cursor-pointer transition-all"
                              title="Effacer le média"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <div className="w-full flex items-center justify-center gap-1 py-1 text-[8.5px] text-zinc-600 uppercase">
                            <Lock className="w-3 h-3" /> Consultation Uniquement
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 bg-black/20 border border-dashed border-zinc-900 rounded-lg text-center mt-2 flex flex-col items-center justify-center space-y-2">
                  {isUploading ? (
                    <div className="space-y-1.5">
                      <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin mx-auto" />
                      <span className="text-[9px] font-mono text-zinc-550">Progression : {progress}%</span>
                    </div>
                  ) : hasError ? (
                    <div className="space-y-2 px-3">
                      <span className="text-[8.5px] text-red-500 block truncate" title={errorMessage}>{errorMessage || "Une erreur est survenue"}</span>
                      {isAuthorizedSuperFounder && (
                        <label className="inline-flex px-2.5 py-1 bg-red-950/20 text-red-400 font-bold uppercase text-[8.5px] rounded cursor-pointer transition-all border border-red-950/30 hover:bg-red-950/35">
                          Réessayer
                          <input
                            type="file"
                            accept={acceptType}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(spot.id, file, sectionName);
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[9px] text-zinc-600 block italic">Aucun média associé</span>
                      {isAuthorizedSuperFounder ? (
                        <label className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-[#D4AF37] hover:border-[#D4AF37] font-bold uppercase text-[9px] rounded-lg cursor-pointer transition-all">
                          <UploadCloud className="w-3.5 h-3.5" /> Importer
                          <input
                            type="file"
                            accept={acceptType}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(spot.id, file, sectionName);
                            }}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <span className="text-[8px] font-mono text-zinc-700 uppercase flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> En attente d'import
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {renderDiagnostics(spot.id)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-zinc-300">
      {/* Fullscreen interactive visual animation test engine */}
      {isTestingAnimation && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md pointer-events-none animate-fade-in">
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
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
            {testAnimationType === "anim_login" && (
              <div className="w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl animate-pulse scale-150 transition-all duration-1000" />
            )}
            {testAnimationType === "anim_payment" && (
              <div className="relative flex items-center justify-center">
                <div className="absolute w-64 h-64 border-4 border-[#D4AF37] rounded-full animate-ping opacity-60" />
                <Crown className="w-16 h-16 text-[#D4AF37] animate-bounce" />
              </div>
            )}
            {testAnimationType === "anim_cert" && (
              <div className="w-full h-full bg-gradient-to-r from-amber-950/20 via-[#D4AF37]/10 to-zinc-950 transition-all duration-500 flex items-center justify-center">
                <div className="text-lg font-mono tracking-widest text-[#D4AF37] uppercase animate-pulse">CERTIFICATION IMPÉRIALE...</div>
              </div>
            )}
          </div>
          <div className="z-10 text-center space-y-2">
            <Sparkles className="w-10 h-10 text-[#D4AF37] mx-auto animate-spin" />
            <h4 className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-widest">
              Test d'Animation : {testAnimationType ? testAnimationType.toUpperCase() : ""}
            </h4>
            <p className="text-[9px] text-zinc-550 font-mono">Déclenchement instantané sur les clients AFRIGOMBO</p>
          </div>
        </div>
      )}

      {/* READ ONLY NOTIFICATION BOX */}
      {!isAuthorizedSuperFounder && (
        <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center gap-3 animate-fade-in">
          <Lock className="w-5 h-5 text-[#D4AF37] shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Mode Consultation Uniquement (Lecture seule)</h4>
            <p className="text-[10px] text-zinc-500 leading-normal">
              En tant qu'administrateur, vous disposez d'un accès en lecture seule. Seul le Super Fondateur de la plateforme (<span className="text-zinc-300 font-mono">jhs.kmj7@gmail.com</span>) peut téléverser, remplacer, configurer ou effacer des fichiers médias.
            </p>
          </div>
        </div>
      )}

      {/* HEADER DE LA CONSOLE */}
      <div className="p-6 bg-gradient-to-b from-[#0a0a0a] to-[#040404] border border-zinc-900 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">
              CENTRE MÉDIA AFRIGOMBO
            </h3>
          </div>
          <p className="text-[11px] text-zinc-500">
            Le cœur audiovisuel du Temple du Gombo.
          </p>
        </div>

        {/* NAVIGATION DU STUDIO */}
        <div className="flex flex-wrap gap-1.5 bg-black/40 p-1 rounded-xl border border-zinc-900 w-full lg:w-auto">
          {(["dashboard", "audio", "images", "videos", "sounds", "notifications", "animations", "system", "logs"] as ActiveSection[]).map((tab) => {
            const getIcon = () => {
              switch (tab) {
                case "dashboard": return <Layers className="w-3.5 h-3.5" />;
                case "audio": return <Music className="w-3.5 h-3.5" />;
                case "images": return <ImageIcon className="w-3.5 h-3.5" />;
                case "videos": return <VideoIcon className="w-3.5 h-3.5" />;
                case "sounds": return <Volume2 className="w-3.5 h-3.5" />;
                case "notifications": return <Megaphone className="w-3.5 h-3.5" />;
                case "animations": return <Sparkles className="w-3.5 h-3.5" />;
                case "system": return <FileText className="w-3.5 h-3.5" />;
                case "logs": return <History className="w-3.5 h-3.5" />;
              }
            };

            const getLabel = () => {
              switch (tab) {
                case "dashboard": return "Tableau de Bord";
                case "audio": return "🎵 Musiques";
                case "images": return "🖼 Images";
                case "videos": return "🎥 Vidéos";
                case "sounds": return "🔔 Sons";
                case "notifications": return "📢 Notifications";
                case "animations": return "🎬 Animations";
                case "system": return "🧩 Système";
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-[#050505] border border-zinc-900 rounded-xl space-y-2">
              <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-wider block">Nombre de médias</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-black text-white">{totalAssets}</span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">Synchro</span>
              </div>
            </div>

            <div className="p-4 bg-[#050505] border border-zinc-900 rounded-xl space-y-2">
              <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-wider block">Médias Actifs</span>
              <div className="flex justify-between items-end">
                <span className="text-2xl font-black text-amber-500">{activeMediaCount}</span>
                <span className="text-[8px] font-mono text-zinc-500">en ligne</span>
              </div>
            </div>

            <div className="p-4 bg-[#050505] border border-zinc-900 rounded-xl space-y-2">
              <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-wider block">Taille totale</span>
              <div className="flex justify-between items-end">
                <span className="text-lg font-black text-white truncate max-w-full">
                  {formatBytes(realStorageBytes)}
                </span>
                <span className="text-[8px] font-mono text-zinc-600 shrink-0">de cache</span>
              </div>
            </div>

            <div className="p-4 bg-[#050505] border border-zinc-900 rounded-xl space-y-2">
              <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-wider block">Dernier upload</span>
              <div className="space-y-1">
                {lastUploadItem ? (
                  <>
                    <span className="text-[10.5px] font-bold text-zinc-300 truncate block max-w-full" title={lastUploadItem.title}>
                      {lastUploadItem.title}
                    </span>
                    <span className="text-[8px] font-mono text-zinc-550 block">
                      {new Date(lastUploadItem.updatedAt).toLocaleDateString()} par {lastUploadItem.updatedBy.split("@")[0]}
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-zinc-600 italic">Aucun média</span>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#050505] border border-zinc-900 rounded-xl space-y-2">
              <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-wider block">Musique active</span>
              <div className="space-y-0.5">
                {currentActiveSong ? (
                  <>
                    <span className="text-[10.5px] font-bold text-amber-400 truncate block max-w-full" title={currentActiveSong.title}>
                      🔊 {currentActiveSong.title}
                    </span>
                    <span className="text-[8px] font-mono text-zinc-500 block uppercase">Volume : {Math.round(currentActiveSong.volume * 100)}%</span>
                  </>
                ) : (
                  <span className="text-[10px] text-zinc-600 italic">Aucune active</span>
                )}
              </div>
            </div>
          </div>

          {/* DUAL CODES & RECENT ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DERNIERS CHANGEMENTS MULTIMÉDIAS */}
            <div className="p-5 bg-[#050505] border border-zinc-900 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-mono font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> Média Actif & Performance
                </h4>
                <Database className="w-4 h-4 text-zinc-700" />
              </div>

              {lastUploadItem ? (
                <div className="p-4 bg-black/60 rounded-xl border border-zinc-900 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-mono bg-[#D4AF37]/5 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/10">
                        {lastUploadItem.category.toUpperCase()}
                      </span>
                      <h5 className="text-xs font-bold text-white mt-1">{lastUploadItem.title}</h5>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-550">{lastUploadItem.fileSize || "Taille inconnue"}</span>
                  </div>

                  <div className="text-[9.5px] text-zinc-500 border-t border-zinc-950 pt-2 space-y-1.5 font-sans leading-relaxed">
                    <div className="flex items-center gap-1 text-emerald-400 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Optimisations de streaming et de cache impériaux actives :
                    </div>
                    <div>• <strong>Cache intelligent</strong> : préchargement asynchrone des métadonnées légères uniquement.</div>
                    <div>• <strong>Streaming progressif</strong> : téléchargement dynamique à la demande sans surcharge de bande passante.</div>
                  </div>

                  <div className="flex justify-between items-center text-[9.5px] font-mono text-zinc-650 pt-2 border-t border-zinc-950">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(lastUploadItem.updatedAt).toLocaleString()}</span>
                    <span>Par {lastUploadItem.updatedBy}</span>
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
                <button onClick={() => setActiveTab("logs")} className="text-[9px] font-mono text-zinc-500 hover:text-[#D4AF37] uppercase tracking-wider transition-all cursor-pointer">
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

      {/* VIEW 2 : MUSIQUES */}
      {activeTab === "audio" && (
        <div className="space-y-6">
          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
            <h4 className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
              🎵 Gestion des musiques impériales
            </h4>
            <p className="text-[10px] text-zinc-500">
              Gérez indépendamment l'identité sonore de l'écosystème : l'introduction, l'hymne officiel, la musique d'ambiance, le Thon, le Centre de Commandement, etc.
            </p>
          </div>
          {renderMediaGrid(AUDIO_SPOTS, "audio", "audio/*")}
        </div>
      )}

      {/* VIEW 3 : IMAGES */}
      {activeTab === "images" && (
        <div className="space-y-6">
          {isComparing && compareAsset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in">
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 w-full max-w-2xl space-y-4 relative">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <h4 className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 animate-spin-hover" /> Remplacement d'Image Impériale
                  </h4>
                  <button onClick={() => setIsComparing(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Old Image */}
                  <div className="p-4 bg-black/40 border border-zinc-950 rounded-xl space-y-2 text-center">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">Version Active Actuelle</span>
                    <div className="h-44 w-full bg-zinc-950 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-900 relative">
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
                      <div className="h-44 w-full bg-zinc-950 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-900">
                        <img
                          src={newComparePreview}
                          alt="New candidate"
                          className="max-h-full max-w-full object-contain animate-pulse"
                        />
                      </div>
                    ) : (
                      <div className="h-44 w-full border-dashed border border-zinc-850 bg-zinc-950/20 rounded-lg flex flex-col items-center justify-center p-4">
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

          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
            <h4 className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
              🖼 Gestion des images d'identité
            </h4>
            <p className="text-[10px] text-zinc-500">
              Gérez les logos, splash screens, fonds d'arrière-plan du Trône et du Centre de Commandement, etc. Modifiables sans republier l'application.
            </p>
          </div>
          {renderMediaGrid(IMAGE_SPOTS, "images", "image/*")}
        </div>
      )}

      {/* VIEW 4 : VIDEOS */}
      {activeTab === "videos" && (
        <div className="space-y-6">
          {videoModalUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setVideoModalUrl(null)}>
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 w-full max-w-4xl space-y-3 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setVideoModalUrl(null)} className="absolute -top-10 right-0 text-white hover:text-[#D4AF37] cursor-pointer">
                  Fermer <X className="inline w-5 h-5 ml-1" />
                </button>
                <video src={videoModalUrl} controls autoPlay className="w-full h-auto max-h-[70vh] rounded-xl border border-zinc-900 bg-black" />
              </div>
            </div>
          )}

          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
            <h4 className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
              🎥 Cinématiques et vidéos
            </h4>
            <p className="text-[10px] text-zinc-500">
              Diffusez des cinématiques d'accueil, guides d'apprentissage ou promotions de prestige. Les vidéos sont entièrement optionnelles.
            </p>
          </div>
          {renderMediaGrid(VIDEO_SPOTS, "videos", "video/*")}
        </div>
      )}

      {/* VIEW 5 : SONS */}
      {activeTab === "sounds" && (
        <div className="space-y-6">
          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
            <h4 className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
              🔔 Effets sonores d'interface (Sons courts)
            </h4>
            <p className="text-[10px] text-zinc-500">
              Téléversez et paramétrez les effets sonores courts joués pour les clics, les notifications, les validations, les paiements, etc.
            </p>
          </div>
          {renderMediaGrid(SOUND_SPOTS, "sounds", "audio/*")}
        </div>
      )}

      {/* VIEW 6 : NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
            <h4 className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
              📢 Visuels et médias de notification
            </h4>
            <p className="text-[10px] text-zinc-500">
              Gérez les affiches, bannières et popups visuels intégrés dans les notifications push et annonces de la république.
            </p>
          </div>
          {renderMediaGrid(NOTIFICATION_SPOTS, "notifications", "image/*")}
        </div>
      )}

      {/* VIEW 7 : ANIMATIONS */}
      {activeTab === "animations" && (
        <div className="space-y-6">
          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
            <h4 className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
              🎬 Animations de prestige interactives
            </h4>
            <p className="text-[10px] text-zinc-500">
              Configurez et testez en direct les animations spéciales déclenchées lors des événements majeurs : paiement, certification impériale, etc.
            </p>
          </div>
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
                      {isAuthorizedSuperFounder ? (
                        <button
                          onClick={() => toggleEnabled(spot.id, isEnabled)}
                          className={`text-[9.5px] font-mono uppercase px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isEnabled
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {isEnabled ? "Actif" : "Désactivé"}
                        </button>
                      ) : (
                        <span className="text-[9px] font-mono uppercase text-zinc-650 bg-zinc-950 p-1 border border-zinc-900 rounded">
                          {isEnabled ? "Actif" : "Désactivé"}
                        </span>
                      )}
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

      {/* VIEW 8 : SYSTÈME */}
      {activeTab === "system" && (
        <div className="space-y-6">
          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
            <h4 className="text-xs font-mono font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
              🧩 Médias et documents système réglementaires
            </h4>
            <p className="text-[10px] text-zinc-500">
              Gérez les bannières système, avatars de substitution, filigranes et éditez en direct le contenu des mentions légales d'AFRIGOMBO (CGU, Charte de Confidentialité).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left sidebar with spot selection */}
            <div className="space-y-3 lg:col-span-1">
              {SYSTEM_SPOTS.map((spot) => {
                const asset = mediaAssets[spot.id];
                const isSelected = editingAsset?.id === spot.id;

                return (
                  <button
                    key={spot.id}
                    onClick={() => {
                      if (asset) {
                        setEditingAsset(asset);
                        setEditTitle(asset.title);
                        setEditContent(asset.content || "");
                        setEditStatus(asset.status || "published");
                        setEditVolume(asset.volume !== undefined ? asset.volume : 0.8);
                        setEditEnabled(asset.enabled !== undefined ? asset.enabled : true);
                      } else {
                        setEditingAsset({
                          id: spot.id,
                          title: spot.title,
                          category: "system",
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
                        setEditVolume(1);
                        setEditEnabled(true);
                      }
                    }}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex justify-between items-center cursor-pointer ${
                      isSelected
                        ? "bg-[#D4AF37]/10 border-[#D4AF37] text-white"
                        : "bg-[#050505] border-zinc-900 hover:border-zinc-850 text-zinc-400"
                    }`}
                  >
                    <div>
                      <h4 className="text-[11px] font-bold text-white">{spot.title}</h4>
                      <p className="text-[9px] text-zinc-500 mt-0.5">{spot.desc}</p>
                    </div>
                    {asset ? (
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                        asset.status === "published" || asset.enabled
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {asset.status || (asset.enabled ? "Actif" : "Inactif")}
                      </span>
                    ) : (
                      <span className="text-[8px] font-mono bg-zinc-905 text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded uppercase">Vide</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content / Upload Editor */}
            <div className="lg:col-span-2 bg-[#050505] border border-zinc-900 rounded-xl p-5 flex flex-col justify-between min-h-[450px] space-y-4">
              {editingAsset ? (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3 flex-1 flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-wider block">Éditeur Système</span>
                      {editingAsset.id.startsWith("doc_") && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-zinc-550">Statut :</span>
                          <select
                            value={editStatus}
                            onChange={(e: any) => setEditStatus(e.target.value)}
                            disabled={!isAuthorizedSuperFounder}
                            className="bg-black border border-zinc-800 rounded p-1 text-[10px] text-zinc-300"
                          >
                            <option value="draft">Brouillon</option>
                            <option value="published">Publé</option>
                            <option value="archived">Archivé</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      disabled={!isAuthorizedSuperFounder}
                      className="w-full bg-black border border-zinc-850 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                      placeholder="Titre officiel du document / asset"
                    />

                    {editingAsset.id.startsWith("doc_") ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 mt-2">
                        {/* Editor Box */}
                        <div className="space-y-1 flex flex-col">
                          <label className="text-[8.5px] font-mono text-zinc-500 uppercase block">Contenu Réglementaire</label>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            disabled={!isAuthorizedSuperFounder}
                            placeholder="Écrivez le texte juridique d'AFRIGOMBO..."
                            className="w-full h-80 bg-black border border-zinc-850 rounded-xl p-3 text-xs font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-[#D4AF37] resize-none flex-1"
                          />
                        </div>

                        {/* Live Preview Box */}
                        <div className="space-y-1 flex flex-col">
                          <label className="text-[8.5px] font-mono text-[#D4AF37] uppercase block">Aperçu direct</label>
                          <div className="w-full h-80 bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 overflow-y-auto text-xs text-zinc-400 space-y-3 leading-relaxed flex-1">
                            {editContent ? (
                              <div className="prose prose-invert prose-xs">
                                <h4 className="text-white font-bold text-sm border-b border-zinc-900 pb-1">{editTitle}</h4>
                                <p className="whitespace-pre-line text-zinc-300 mt-2">{editContent}</p>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-zinc-600 italic">Saisissez du contenu pour l'aperçu</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 bg-black/40 border border-zinc-900 rounded-xl text-center space-y-4">
                        <ImageIcon className="w-12 h-12 text-zinc-700 mx-auto" />
                        <div className="space-y-1">
                          <p className="text-xs text-zinc-400 font-bold">Téléversez un fichier image pour cet emplacement</p>
                          <p className="text-[9px] text-zinc-600">Recommandé : PNG transparent ou SVG léger</p>
                        </div>
                        {editingAsset.downloadURL && (
                          <div className="h-24 max-w-xs mx-auto border border-zinc-900 rounded overflow-hidden flex items-center justify-center bg-black">
                            <img src={editingAsset.downloadURL} alt="System Asset" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        {isAuthorizedSuperFounder && (
                          <label className="inline-flex px-3 py-1.5 bg-[#D4AF37] text-black font-black uppercase text-[9px] rounded-lg cursor-pointer hover:opacity-90 transition-all">
                            Uploader un asset
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(editingAsset.id, file, "system");
                              }}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>

                  {isAuthorizedSuperFounder ? (
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
                        Fermer
                      </button>
                    </div>
                  ) : (
                    <div className="w-full text-center py-2 text-[9px] font-mono text-zinc-650 uppercase border-t border-zinc-950">
                      🔒 Édition réservée au Super Fondateur
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <FileText className="w-12 h-12 text-zinc-750" />
                  <p className="text-xs text-zinc-500 max-w-sm">
                    Sélectionnez une ressource ou un document officiel à gauche pour modifier son contenu, le prévisualiser en direct ou téléverser l'asset.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 9 : AUDIT LOGS */}
      {activeTab === "logs" && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl flex justify-between items-center">
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
                          log.action.includes("Mise") || log.action.includes("Act") || log.action.includes("Télé")
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
                      <td colSpan={5} className="p-8 text-center text-zinc-650">Aucune opération consignée dans le journal d'audit.</td>
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
