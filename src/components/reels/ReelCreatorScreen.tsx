import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Image as ImageIcon, X, ChevronRight } from "lucide-react";
import { compressVideoFile } from "../../lib/media/videoCompressor";

interface ReelCreatorScreenProps {
  onVideoReady: (file: File) => void;
  onClose: () => void;
}

export default function ReelCreatorScreen({ onVideoReady, onClose }: ReelCreatorScreenProps) {
  const previewRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

  const handleGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      return;
    }
    setRecordedBlob(file);
    setRecordedUrl(URL.createObjectURL(file));
  };

  const handleRetake = () => {
    if (isCompressing) return;
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
  };

  const handleNext = async () => {
    if (!recordedBlob || isCompressing) return;
    const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
    const file = new File([recordedBlob], `reel_${Date.now()}.${ext}`, { type: recordedBlob.type });

    setIsCompressing(true);
    setCompressionProgress(0);
    try {
      const result = await compressVideoFile(file, {
        onProgress: setCompressionProgress
      });
      console.log(
        `[REEL COMPRESSION] Taille avant: ${(result.originalSizeBytes / 1024 / 1024).toFixed(2)} Mo, Taille après: ${(result.compressedSizeBytes / 1024 / 1024).toFixed(2)} Mo`
      );
      onVideoReady(result.file);
    } catch (err) {
      console.warn("[REEL COMPRESSION] Erreur de compression, fallback fichier original:", err);
      onVideoReady(file);
    } finally {
      setIsCompressing(false);
    }
  };

  // PREVIEW MODE (after selecting a video)
  if (recordedUrl) {
    return createPortal(
      <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
        <div className="flex items-center justify-between p-4">
          <button onClick={handleRetake} disabled={isCompressing} className="text-white p-2 rounded-full bg-black/40 disabled:opacity-40">
            <X className="w-6 h-6" />
          </button>
          <span className="text-white text-sm font-mono">Aperçu</span>
          <button
            onClick={handleNext}
            disabled={isCompressing}
            className="flex items-center gap-1 bg-[#D4AF37] text-black font-bold px-4 py-2 rounded-full text-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isCompressing ? "Compression..." : <>Suivant <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center overflow-hidden relative">
          <video ref={previewRef} src={recordedUrl} controls={!isCompressing} autoPlay loop playsInline className="max-h-full max-w-full" />
          {isCompressing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white gap-3 z-20">
              <div className="w-8 h-8 border-3 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
              <div className="text-sm font-mono font-medium">
                Compression en cours... {compressionProgress}%
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  }

  // IMPORT MODE
  return createPortal(
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center gap-6 px-6">
      <button onClick={onClose} className="absolute top-4 left-4 text-white p-2 rounded-full bg-black/40">
        <X className="w-6 h-6" />
      </button>
      <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <ImageIcon className="w-9 h-9 text-zinc-500" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-white font-bold text-lg">Nouveau Réel</h2>
        <p className="text-zinc-500 text-sm">Choisis une vidéo depuis ta galerie</p>
      </div>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="bg-[#D4AF37] text-black font-bold px-6 py-3 rounded-full text-sm"
      >
        Importer une vidéo
      </button>
      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleGalleryFile} />
    </div>,
    document.body
  );
}
