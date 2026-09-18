import React, { useState, useEffect, useRef } from "react";
import { Play, Video as VideoIcon } from "lucide-react";
import { 
  isValidImageUrl, 
  isDirectVideoUrl, 
  getYoutubeThumbnail, 
  getDeterministicFallbackCover, 
  extractVideoFrame 
} from "../../lib/videoThumbnailEngine";

interface VideoThumbnailProps {
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  coverUrl?: string | null;
  poster?: string | null;
  imageUrl?: string | null;
  title?: string | null;
  artist?: string | null;
  authorAvatar?: string | null;
  className?: string;
  showPlayButton?: boolean;
  alt?: string;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  videoUrl,
  thumbnailUrl,
  coverUrl,
  poster,
  imageUrl,
  title,
  artist,
  authorAvatar,
  className = "w-full h-full",
  showPlayButton = false,
  alt = "Vidéo Réel",
}) => {
  // 1. Détection de l'image de miniature explicite (si c'est bien une image et non un fichier vidéo)
  const explicitImage = [thumbnailUrl, coverUrl, poster, imageUrl].find(
    (u) => u && typeof u === "string" && isValidImageUrl(u) && !isDirectVideoUrl(u)
  );

  // 2. Détection YouTube
  const youtubeThumb = getYoutubeThumbnail(videoUrl || imageUrl || coverUrl);

  // URL vidéo résolue
  const resolvedVideoUrl = [videoUrl, imageUrl, coverUrl].find(
    (u) => u && typeof u === "string" && isDirectVideoUrl(u)
  );

  // Couverture de secours esthétique déterministe (Afrobeat, Concert, Studio, etc.)
  const seed = `${title || ""}_${artist || ""}_${videoUrl || ""}`;
  const fallbackCover = getDeterministicFallbackCover(seed);

  const [activeImage, setActiveImage] = useState<string | null>(
    explicitImage || youtubeThumb || null
  );
  const [extractedFrame, setExtractedFrame] = useState<string | null>(null);
  const [hasImageError, setHasImageError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Effet d'extraction automatique de la première frame (0.5s) si aucune image n'est disponible
  useEffect(() => {
    let isMounted = true;

    // Si on a déjà une image valide, inutile d'extraire
    if (explicitImage || youtubeThumb) {
      setActiveImage(explicitImage || youtubeThumb);
      setHasImageError(false);
      return;
    }

    if (resolvedVideoUrl) {
      extractVideoFrame(resolvedVideoUrl, 0.5)
        .then((frameData) => {
          if (isMounted && frameData) {
            setExtractedFrame(frameData);
            setActiveImage(frameData);
          }
        })
        .catch(() => {
          // Si l'extraction échoue, le fallbackCover prend le relais
        });
    }

    return () => {
      isMounted = false;
    };
  }, [resolvedVideoUrl, explicitImage, youtubeThumb]);

  // Image finale à afficher
  const finalImageSrc = activeImage || extractedFrame || fallbackCover;

  return (
    <div 
      className={`relative w-full h-full bg-zinc-950 overflow-hidden select-none ${className}`}
      style={{ backgroundColor: "#09090b" }}
    >
      {/* 1. Image principale (Miniature réelle, YouTube, ou Frame Canvas) */}
      {!hasImageError && finalImageSrc ? (
        <img
          src={finalImageSrc}
          alt={alt || title || "Réel"}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => {
            // Si l'image explicite échoue, on bascule vers le poster artistique de secours
            setHasImageError(true);
            if (finalImageSrc !== fallbackCover) {
              setActiveImage(fallbackCover);
            }
          }}
        />
      ) : resolvedVideoUrl ? (
        /* 2. Fallback Vidéo HTML5 avec #t=0.5 pour forcer le décodage matériel de la frame */
        <video
          src={`${resolvedVideoUrl}#t=0.5`}
          preload="auto"
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none ${
            videoLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : (
        /* 3. Poster scénique haute définition pour garantir ZERO blanc */
        <img
          src={fallbackCover}
          alt={alt || "Réel d'artiste"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}

      {/* 4. Dégradé TikTok/Facebook : sombre en bas pour les textes et contrasté (inline rgba pour immunité totale aux overrides CSS globaux) */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: "linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.25) 50%, rgba(0, 0, 0, 0.5) 100%)"
        }}
      />

      {/* 5. Bouton Play central si demandé */}
      {showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-10 h-10 rounded-full bg-black/65 backdrop-blur-md border border-[#D4AF37]/60 text-[#D4AF37] flex items-center justify-center shadow-lg group-hover:scale-115 group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-300">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoThumbnail;
