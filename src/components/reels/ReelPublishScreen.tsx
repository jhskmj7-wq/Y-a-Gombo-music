import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Hash,
  MessageSquare,
  Loader2,
  Sparkles,
  Play,
  Pause,
  Film,
  HardDrive,
  Clock,
  Globe,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { r2StorageService } from "../../lib/storage/r2Storage";
import { collection, addDoc, doc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { useAuth } from "../../AuthContext";
import { getFilterCss, REEL_VIDEO_FILTERS } from "./videoFilters";

interface ReelPublishScreenProps {
  videoFile: File;
  filterId: string;
  onClose: () => void;
  onPublished: () => void;
}

const POPULAR_HASHTAGS = [
  "afrigombo",
  "afrobeats",
  "humour",
  "danse",
  "culture",
  "abidjan",
  "art",
  "talent",
];

export default function ReelPublishScreen({
  videoFile,
  filterId,
  onClose,
  onPublished,
}: ReelPublishScreenProps) {
  const { currentUser, profile, requireAuth } = useAuth();
  const currentUserProfile = profile;
  const [caption, setCaption] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>(["#afrigombo"]);
  const [allowComments, setAllowComments] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("Préparation...");
  const [errorMsg, setErrorMsg] = useState("");

  // Video Preview & Metadata State
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  const publishVideoNodeRef = useRef<HTMLVideoElement | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");

  const activeFilterCss = getFilterCss(filterId);
  const activeFilterObj = REEL_VIDEO_FILTERS.find((f) => f.id === filterId);

  // File size calculation
  const fileSizeMb = (videoFile.size / (1024 * 1024)).toFixed(1);

  useEffect(() => {
    if (!videoFile) return;
    const url = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoFile]);

  const toggleVideoPlayback = () => {
    if (publishVideoNodeRef.current) {
      if (publishVideoNodeRef.current.paused) {
        publishVideoNodeRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        publishVideoNodeRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const stopPublishPreviewVideo = () => {
    if (publishVideoNodeRef.current) {
      try {
        publishVideoNodeRef.current.pause();
      } catch (_) {}
    }
  };

  const handleClosePublish = () => {
    stopPublishPreviewVideo();
    onClose();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const addHashtag = (tagToAdd?: string) => {
    const raw = tagToAdd || hashtagInput;
    const clean = raw.trim().replace(/^#/, "").replace(/\s+/g, "");
    if (!clean) return;
    const tag = `#${clean.toLowerCase()}`;
    if (!hashtags.includes(tag) && hashtags.length < 15) {
      setHashtags([...hashtags, tag]);
    }
    if (!tagToAdd) {
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  const handlePublish = async () => {
    if (loading) return;
    setErrorMsg("");

    // 1. Authentification robuste
    let activeFirebaseUser = auth.currentUser;
    if (!activeFirebaseUser && typeof (auth as any)?.authStateReady === "function") {
      try {
        await (auth as any).authStateReady();
        activeFirebaseUser = auth.currentUser;
      } catch (_) {}
    }

    if (!activeFirebaseUser) {
      activeFirebaseUser = await new Promise<any>((resolve) => {
        const timeout = setTimeout(() => resolve(null), 1500);
        const unsub = auth.onAuthStateChanged((u) => {
          clearTimeout(timeout);
          unsub();
          resolve(u);
        });
      });
    }

    const resolvedUid = activeFirebaseUser?.uid || currentUserProfile?.uid || currentUser?.uid;

    if (!resolvedUid) {
      setErrorMsg("Vous devez être connecté pour publier un Réel.");
      if (typeof requireAuth === "function") {
        requireAuth(() => {});
      }
      return;
    }

    // 2. Contrôle de taille (75 Mo max)
    const MAX_SIZE_BYTES = 75 * 1024 * 1024;
    if (videoFile.size > MAX_SIZE_BYTES) {
      setErrorMsg(
        `La vidéo dépasse la taille maximale autorisée de 75 Mo (taille actuelle : ${fileSizeMb} Mo).`
      );
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setUploadStatusText("Initialisation du téléversement...");

    try {
      const uid = resolvedUid;
      const publicationId = `reel_${Date.now()}`;

      // 3. Récupération sécurisée du jeton Firebase
      let idToken: string | undefined;
      if (activeFirebaseUser) {
        try {
          idToken = await activeFirebaseUser.getIdToken(false);
        } catch (tokErr) {
          try {
            idToken = await activeFirebaseUser.getIdToken(true);
          } catch (tokErr2) {
            console.warn("[REEL] Échec de récupération du token Firebase:", tokErr2);
          }
        }
      } else if (currentUser && typeof currentUser.getIdToken === "function") {
        try {
          idToken = await currentUser.getIdToken(false);
        } catch (tokErr) {
          console.warn("[REEL] Échec du token sur currentUser:", tokErr);
        }
      }

      setUploadStatusText("Connexion au stockage Cloudflare R2...");

      let uploadResult: any;
      try {
        uploadResult = await r2StorageService.uploadReelVideo(
          videoFile,
          uid,
          publicationId,
          (progress) => {
            setUploadProgress(progress.percentage);
            if (progress.log) {
              setUploadStatusText(progress.log);
            }
          },
          idToken
        );

        const videoMediaRef = uploadResult?.url || uploadResult?.storagePath || "";
        if (!uploadResult?.success || !videoMediaRef) {
          throw new Error("Échec du téléversement de la vidéo vers Cloudflare R2.");
        }
      } catch (uploadErr: any) {
        console.error("[REEL R2 UPLOAD ERROR]", uploadErr);
        throw new Error(
          uploadErr?.message || "Échec du téléversement de la vidéo vers Cloudflare R2."
        );
      }

      setUploadProgress(95);
      setUploadStatusText("Enregistrement de la publication...");

      const videoMediaRef = uploadResult.url || uploadResult.storagePath || "";
      const authorName =
        currentUserProfile?.nomArtistique ||
        currentUserProfile?.displayName ||
        currentUserProfile?.name ||
        currentUser?.displayName ||
        "Artiste";
      const authorAvatar =
        currentUserProfile?.avatarUrl ||
        currentUserProfile?.photoURL ||
        currentUser?.photoURL ||
        "";
      const artisticName =
        currentUserProfile?.nomArtistique || currentUserProfile?.artistName || authorName;

      const payload = {
        userId: uid,
        authorName,
        authorArtisticName: artisticName,
        authorAvatar,
        commune: currentUserProfile?.commune || currentUserProfile?.location || "Abidjan",
        content: caption.trim(),
        mediaUrl: videoMediaRef,
        videoUrl: videoMediaRef,
        storagePath: uploadResult.storagePath,
        type: "video",
        status: "published",
        visible: true,
        adminValidated: true,
        hashtags,
        appliedFilter: filterId,
        allowComments,
        likes: 0,
        likesCount: 0,
        comments: 0,
        commentsCount: 0,
        likedBy: [],
        bookmarkedBy: [],
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const socialPostPayload = {
        authorId: uid,
        userId: uid,
        userName: authorName,
        authorName,
        authorArtisticName: artisticName,
        userAvatar: authorAvatar,
        authorAvatar,
        title: artisticName || "Réel",
        caption: caption.trim(),
        content: caption.trim(),
        videoUrl: videoMediaRef,
        mediaUrl: videoMediaRef,
        imageUrl: videoMediaRef,
        storagePath: uploadResult.storagePath,
        type: "video",
        status: "published",
        visible: true,
        adminValidated: true,
        commune: currentUserProfile?.commune || currentUserProfile?.location || "Abidjan",
        hashtags,
        tags: hashtags,
        appliedFilter: filterId,
        allowComments,
        likesCount: 0,
        likes: 0,
        sharesCount: 0,
        savesCount: 0,
        commentsCount: 0,
        comments: [],
        likedBy: [],
        savedBy: [],
        bookmarkedBy: [],
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mediaGalleryItem = {
        id: `reel_${Date.now()}`,
        type: "video",
        url: uploadResult.url,
        title: caption.trim() || "Réel - Extrait vidéo",
        description: caption.trim(),
        appliedFilter: filterId,
        createdAt: new Date().toISOString(),
      };

      try {
        if (db) {
          // 1. Collection 'posts'
          await addDoc(collection(db, "posts"), payload);

          // 2. Collection 'social_posts'
          await addDoc(collection(db, "social_posts"), socialPostPayload);

          // 3. Profil utilisateur
          if (uid && uid !== "anonymous") {
            try {
              const userRef = doc(db, "users", uid);
              await updateDoc(userRef, {
                mediaGallery: arrayUnion(mediaGalleryItem),
              });
            } catch (_uErr) {
              try {
                const userRef = doc(db, "users", uid);
                await setDoc(userRef, { mediaGallery: [mediaGalleryItem] }, { merge: true });
              } catch (setErr) {
                console.warn("[REEL USER GALLERY UPDATE FAILED]", setErr);
              }
            }
          }
        } else {
          throw new Error("Base de données non initialisée.");
        }
      } catch (firestoreErr: any) {
        console.error("[REEL FIRESTORE SAVE ERROR]", firestoreErr);
        throw new Error(
          firestoreErr?.code === "permission-denied"
            ? "Permission refusée lors de l'enregistrement de la publication."
            : `Échec de l'enregistrement : ${firestoreErr?.message || "Erreur Firestore."}`
        );
      }

      setUploadProgress(100);
      stopPublishPreviewVideo();
      onPublished();
    } catch (err: any) {
      console.error("[REEL PUBLISH ERROR]", err);
      setErrorMsg(err?.message || "Une erreur est survenue lors de la publication.");
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-zinc-950 z-[9999] flex flex-col font-sans select-none text-zinc-100">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md shrink-0">
        <button
          onClick={handleClosePublish}
          disabled={loading}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-semibold tracking-wide text-zinc-100">Nouveau Réel</h1>
          <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider">
            Étape finale
          </span>
        </div>
        <div className="w-9" />
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 overscroll-contain">
        {/* Section 1: Video Preview Card & Caption */}
        <section className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3.5 shadow-md flex flex-col sm:flex-row gap-3.5">
          {/* 9:16 Video Thumbnail Container */}
          <div
            onClick={toggleVideoPlayback}
            className="relative w-28 sm:w-32 h-44 sm:h-48 shrink-0 bg-black rounded-xl overflow-hidden border border-zinc-700/60 shadow-inner group cursor-pointer mx-auto sm:mx-0 flex items-center justify-center"
          >
            {videoPreviewUrl ? (
              <>
                <video
                  ref={(el) => {
                    if (el) publishVideoNodeRef.current = el;
                  }}
                  src={videoPreviewUrl}
                  muted
                  loop
                  autoPlay
                  playsInline
                  onLoadedMetadata={(e) => {
                    const vid = e.currentTarget;
                    if (vid.duration) setVideoDuration(vid.duration);
                    if (vid.videoWidth && vid.videoHeight) {
                      setVideoDimensions({ width: vid.videoWidth, height: vid.videoHeight });
                    }
                  }}
                  onLoadedData={() => {
                    if (publishVideoNodeRef.current) {
                      publishVideoNodeRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                    }
                  }}
                  style={{ filter: activeFilterCss }}
                  className="w-full h-full object-cover"
                />

                {/* Play/Pause Overlay Indicator */}
                <div
                  className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity ${
                    isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-black/70 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shadow-lg">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </div>
                </div>

                {/* Video Info Badges */}
                <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 pointer-events-none">
                  {videoDuration !== null && (
                    <span className="inline-flex items-center gap-1 bg-black/80 backdrop-blur-xs text-[10px] font-mono text-zinc-300 px-1.5 py-0.5 rounded-md border border-white/10">
                      <Clock className="w-2.5 h-2.5 text-[#D4AF37]" />
                      {formatDuration(videoDuration)}
                    </span>
                  )}
                </div>

                {/* Filter Badge */}
                {filterId && filterId !== "naturel" && (
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/85 backdrop-blur-xs rounded-md px-1.5 py-0.5 text-[9px] font-mono text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center gap-1 truncate pointer-events-none">
                    <Sparkles className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{activeFilterObj?.name || filterId}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-zinc-500">
                <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
                <span className="text-[10px] font-mono mt-1 text-zinc-400">Chargement...</span>
              </div>
            )}
          </div>

          {/* Caption Input Area */}
          <div className="flex-1 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  Légende du Réel
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    caption.length > 450 ? "text-amber-400" : "text-zinc-500"
                  }`}
                >
                  {caption.length} / 500
                </span>
              </div>
              <textarea
                value={caption}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setCaption(e.target.value);
                  }
                }}
                placeholder="Décrivez votre Réel, partagez votre émotion ou taguez des amis..."
                rows={4}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-white text-sm placeholder-zinc-500 resize-none focus:outline-none focus:border-[#D4AF37]/60 transition-colors leading-relaxed"
              />
            </div>

            {/* Quick Details Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400 font-mono pt-1">
              <span className="inline-flex items-center gap-1 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/50">
                <HardDrive className="w-3 h-3 text-zinc-400" />
                {fileSizeMb} Mo
              </span>
              <span className="inline-flex items-center gap-1 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/50">
                <Film className="w-3 h-3 text-zinc-400" />
                {videoDimensions ? `${videoDimensions.width}x${videoDimensions.height}` : "HD 9:16"}
              </span>
              <span className="inline-flex items-center gap-1 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/50 text-[#D4AF37]">
                <Sparkles className="w-3 h-3" />
                {activeFilterObj?.name || "Naturel"}
              </span>
            </div>
          </div>
        </section>

        {/* Section 2: Hashtags */}
        <section className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3.5 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-[#D4AF37]" />
              Hashtags ({hashtags.length}/15)
            </label>
            <span className="text-[10px] text-zinc-500 font-mono">Appuyez sur Entrée pour ajouter</span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-mono">
                #
              </span>
              <input
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "," || e.key === " ") {
                    e.preventDefault();
                    addHashtag();
                  }
                }}
                placeholder="ajouter_un_tag"
                maxLength={30}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-7 pr-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]/60 font-mono text-xs transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => addHashtag()}
              disabled={!hashtagInput.trim() || hashtags.length >= 15}
              className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter
            </button>
          </div>

          {/* Active Hashtags Chips */}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35 rounded-lg px-2.5 py-1 text-xs font-mono transition-all hover:bg-[#D4AF37]/20"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeHashtag(tag)}
                    className="text-[#D4AF37]/70 hover:text-white transition-colors p-0.5 rounded-full hover:bg-black/40"
                    aria-label={`Retirer ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Popular Suggestions */}
          <div className="pt-1 border-t border-zinc-800/60">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block mb-1.5">
              Suggestions populaires :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_HASHTAGS.map((tag) => {
                const fullTag = `#${tag}`;
                const isSelected = hashtags.includes(fullTag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!isSelected) addHashtag(tag);
                      else removeHashtag(fullTag);
                    }}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-md border transition-colors ${
                      isSelected
                        ? "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40"
                        : "bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 3: Interactions & Settings */}
        <section className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3.5 space-y-3 shadow-md">
          <h2 className="text-xs font-semibold text-zinc-300 uppercase font-mono tracking-wider">
            Paramètres du Réel
          </h2>

          <div className="flex items-center justify-between p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 mt-0.5">
                <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div>
                <span className="text-xs font-medium text-white block">
                  Autoriser les commentaires
                </span>
                <span className="text-[11px] text-zinc-400">
                  {allowComments
                    ? "Tous les utilisateurs peuvent commenter ce Réel."
                    : "Les commentaires seront désactivés."}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAllowComments(!allowComments)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                allowComments ? "bg-[#D4AF37] justify-end" : "bg-zinc-700 justify-start"
              }`}
              aria-label="Activer/Désactiver les commentaires"
            >
              <div className="w-4 h-4 rounded-full bg-black shadow-sm transition-transform" />
            </button>
          </div>
        </section>

        {/* Section 4: Summary Card */}
        <section className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2.5 shadow-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
            <span>Votre Réel est prêt à être partagé</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400 pt-1">
            <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
              <div>
                <span className="text-[9px] text-zinc-500 block uppercase">Visibilité</span>
                <span className="text-zinc-200">Public (Tous)</span>
              </div>
            </div>
            <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60 flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-[#D4AF37]" />
              <div>
                <span className="text-[9px] text-zinc-500 block uppercase">Stockage</span>
                <span className="text-zinc-200">R2 Haute Vitesse</span>
              </div>
            </div>
          </div>
        </section>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <span className="font-semibold block text-rose-300">Échec de publication</span>
              <p className="leading-relaxed text-rose-300/90">{errorMsg}</p>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Action Bar */}
      <footer className="p-4 border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md shrink-0 space-y-3">
        {loading && (
          <div className="space-y-1.5 bg-zinc-900/80 border border-zinc-800/80 p-3 rounded-xl">
            <div className="flex justify-between text-xs text-zinc-300 font-mono">
              <span className="truncate max-w-[220px] flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                {uploadStatusText}
              </span>
              <span className="font-bold text-[#D4AF37]">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-300 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handlePublish}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#D4AF37] hover:brightness-110 active:scale-[0.99] text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>Publication en cours...</span>
            </>
          ) : (
            <>
              <span>Publier le Réel</span>
              <span className="text-base">🚀</span>
            </>
          )}
        </button>
      </footer>
    </div>,
    document.body
  );
}

