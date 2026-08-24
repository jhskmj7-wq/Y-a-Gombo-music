import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Hash, MessageSquare, Loader2 } from "lucide-react";
import { supabaseStorage } from "../../lib/storage/supabaseStorage";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../AuthContext";

interface ReelPublishScreenProps {
  videoFile: File;
  filterId: string;
  onClose: () => void;
  onPublished: () => void;
}

export default function ReelPublishScreen({ videoFile, filterId, onClose, onPublished }: ReelPublishScreenProps) {
  const { currentUser, profile } = useAuth();
  const currentUserProfile = profile;
  const [caption, setCaption] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [allowComments, setAllowComments] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const videoPreviewUrl = React.useMemo(() => URL.createObjectURL(videoFile), [videoFile]);

  const addHashtag = () => {
    const clean = hashtagInput.trim().replace(/^#/, "").replace(/\s+/g, "");
    if (!clean) return;
    const tag = `#${clean}`;
    if (!hashtags.includes(tag) && hashtags.length < 15) {
      setHashtags([...hashtags, tag]);
    }
    setHashtagInput("");
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  const handlePublish = async () => {
    if (loading) return;
    setErrorMsg("");
    setLoading(true);
    setUploadProgress(10);

    try {
      const uid = currentUserProfile?.uid || currentUser?.uid || "anonymous";
      const publicationId = `reel_${Date.now()}`;
      const idToken = currentUser ? await currentUser.getIdToken(true) : undefined;

      let uploadResult: any;
      try {
        uploadResult = await supabaseStorage.uploadVideo(
          videoFile,
          uid,
          publicationId,
          (progress) => setUploadProgress(10 + Math.round(progress.percentage * 0.8)),
          idToken,
          true
        );

        if (!uploadResult?.success || !uploadResult?.url) {
          throw new Error(uploadResult?.error || "Échec de l'upload de la vidéo.");
        }
      } catch (uploadErr: any) {
        console.error("[REEL UPLOAD ERROR]", uploadErr);
        throw new Error(uploadErr?.message || "Échec de l'upload de la vidéo.");
      }

      setUploadProgress(90);

      const payload = {
        userId: uid,
        authorName: currentUserProfile?.nomArtistique || currentUserProfile?.displayName || currentUserProfile?.name || currentUser?.displayName || "Artiste",
        authorArtisticName: currentUserProfile?.nomArtistique || "",
        authorAvatar: currentUserProfile?.avatarUrl || currentUserProfile?.photoURL || currentUser?.photoURL || "",
        commune: currentUserProfile?.commune || currentUserProfile?.location || "",
        content: caption.trim(),
        mediaUrl: uploadResult.url,
        type: "video",
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
        createdAt: new Date().toISOString()
      };

      try {
        if (db) {
          await addDoc(collection(db, "posts"), payload);
        } else {
          throw new Error("Base de données non initialisée.");
        }
      } catch (firestoreErr: any) {
        console.error("[REEL FIRESTORE SAVE ERROR]", firestoreErr);
        throw new Error(
          firestoreErr?.code === "permission-denied"
            ? "Permission refusée lors de l'enregistrement de la publication dans la base de données."
            : `Échec de l'enregistrement de la publication : ${firestoreErr?.message || "Erreur base de données."}`
        );
      }

      setUploadProgress(100);
      onPublished();
    } catch (err: any) {
      console.error("[REEL PUBLISH ERROR]", err);
      setErrorMsg(err?.message || "Une erreur est survenue lors de la publication.");
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button onClick={onClose} disabled={loading} className="text-white p-2 rounded-full bg-black/40 disabled:opacity-40">
          <X className="w-6 h-6" />
        </button>
        <span className="text-white text-sm font-mono">Nouveau Réel</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="flex gap-3">
          <video src={videoPreviewUrl} muted loop autoPlay playsInline className="w-24 h-40 object-cover rounded-xl border border-white/10" />
          <div className="flex-1 space-y-3">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Écris une légende..."
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm placeholder-zinc-500 resize-none focus:outline-none focus:border-[#D4AF37]/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5" /> Hashtags
          </label>
          <div className="flex gap-2">
            <input
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHashtag(); } }}
              placeholder="afrigombo"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]/50"
            />
            <button onClick={addHashtag} className="px-4 bg-zinc-800 text-white rounded-xl text-sm">Ajouter</button>
          </div>
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {hashtags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 rounded-full px-3 py-1 text-xs font-mono">
                  {tag}
                  <button onClick={() => removeHashtag(tag)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-zinc-400" />
            <span className="text-sm text-white font-medium">Autoriser les commentaires</span>
          </div>
          <button
            type="button"
            onClick={() => setAllowComments(!allowComments)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              allowComments ? "bg-[#D4AF37] justify-end" : "bg-zinc-700 justify-start"
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-black transition-transform" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
            {errorMsg}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 bg-black/90 space-y-3">
        {loading && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-400 font-mono">
              <span>Publication en cours...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D4AF37] transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handlePublish}
          disabled={loading}
          className="w-full py-3.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-bold rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-[#D4AF37]/10"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Publication...</span>
            </>
          ) : (
            <span>Publier le Réel 🚀</span>
          )}
        </button>
      </div>
    </div>,
    document.body
  );
}
