import React, { useState, useEffect, useRef } from "react";
import { Play, Video as VideoIcon } from "lucide-react";
import { 
  isValidImageUrl, 
  isDirectVideoUrl, 
  getYoutubeThumbnail, 
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
  isActivePreview?: boolean;
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
  isActivePreview = false,
}) => {
  // 1. Détection d'une vraie image de miniature enregistrée (non vidéo)
  const explicitImage = [thumbnailUrl, coverUrl, poster, imageUrl].find(
    (u) => u && typeof u === "string" && isValidImageUrl(u) && !isDirectVideoUrl(u)
  );

  // 2. Détection YouTube (vrai thumbnail YouTube de cette vidéo)
  const youtubeThumb = getYoutubeThumbnail(videoUrl || imageUrl || coverUrl);

  // 3. URL vidéo directe résolue
  const resolvedVideoUrl = [videoUrl, imageUrl, coverUrl].find(
    (u) => u && typeof u === "string" && isDirectVideoUrl(u)
  );

  const [activeImage, setActiveImage] = useState<string | null>(
    explicitImage || youtubeThumb || null
  );
  const [extractedFrame, setExtractedFrame] = useState<string | null>(null);
  const [hasImageError, setHasImageError] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Effet d'extraction automatique de la vraie frame de la vidéo via canvas
  useEffect(() => {
    let isMounted = true;

    // Si on a déjà une vraie image explicite ou YouTube, on l'utilise directement
    if (explicitImage || youtubeThumb) {
      setActiveImage(explicitImage || youtubeThumb);
      setHasImageError(false);
      return;
    }

    // Sinon, extraire la vraie frame de la vidéo réelle
    if (resolvedVideoUrl) {
      extractVideoFrame(resolvedVideoUrl, 0.5)
        .then((frameData) => {
          if (isMounted && frameData) {
            setExtractedFrame(frameData);
            setActiveImage(frameData);
          }
        })
        .catch(() => {
          // Si l'extraction échoue (ex: CORS strict), l'élément <video> prend le relais pour afficher la vraie frame
        });
    }

    return () => {
      isMounted = false;
    };
  }, [resolvedVideoUrl, explicitImage, youtubeThumb]);

  // Contrôle de la lecture / pause de la preview courte (~4s en boucle muette)
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isActivePreview && resolvedVideoUrl) {
      videoEl.muted = true;
      videoEl.currentTime = 0;
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Échec de lecture silencieux (ex: scroll rapide de l'utilisateur)
        });
      }
    } else {
      try {
        videoEl.pause();
        videoEl.currentTime = 0;
      } catch (_) {}
      setIsVideoPlaying(false);
    }
  }, [isActivePreview, resolvedVideoUrl]);

  // Nettoyage propre au démontage
  useEffect(() => {
    return () => {
      const videoEl = videoRef.current;
      if (videoEl) {
        try {
          videoEl.pause();
          videoEl.removeAttribute("src");
          videoEl.load();
        } catch (_) {}
      }
    };
  }, []);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    // Reboucle exactement dès 4 secondes
    if (el.currentTime >= 4.0) {
      el.currentTime = 0;
      el.play().catch(() => {});
    }
  };

  const handlePlaying = () => {
    setIsVideoPlaying(true);
  };

  // Vraie image de couverture issue de la vidéo ou de sa miniature réelle
  const realImageSrc = activeImage || extractedFrame;

  return (
    <div 
      className={`relative w-full h-full bg-zinc-950 overflow-hidden select-none ${className}`}
      style={{ backgroundColor: "#09090b", touchAction: "pan-x pan-y" }}
    >
      {/* 1. Vraie image de couverture statique (visible immédiatement pour éviter tout flash blanc) */}
      {!hasImageError && realImageSrc && (
        <img
          src={realImageSrc}
          alt={alt || title || "Réel"}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500 pointer-events-none ${
            isVideoPlaying && isActivePreview ? "opacity-0" : "opacity-100"
          }`}
          onError={() => {
            // Si l'image explicite échoue, basculer sur l'affichage direct de la vidéo
            setHasImageError(true);
            setActiveImage(null);
          }}
        />
      )}

      {/* 2. Élément HTML5 Video pour la preview courte muette ou affichage de la frame */}
      {resolvedVideoUrl && (
        <video
          ref={videoRef}
          src={isActivePreview ? resolvedVideoUrl : `${resolvedVideoUrl}#t=0.5`}
          preload={isActivePreview ? "metadata" : "none"}
          muted
          playsInline
          // @ts-ignore
          webkit-playsinline="true"
          x-webkit-airplay="allow"
          onTimeUpdate={handleTimeUpdate}
          onPlaying={handlePlaying}
          onEnded={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              videoRef.current.play().catch(() => {});
            }
          }}
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 pointer-events-none ${
            isActivePreview && isVideoPlaying ? "opacity-100" : (!realImageSrc ? "opacity-100" : "opacity-0")
          }`}
        />
      )}

      {/* 3. Arrière-plan neutre sobre en attente si aucun média */}
      {!realImageSrc && !resolvedVideoUrl && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600">
          <VideoIcon className="w-7 h-7 text-[#D4AF37]/50" />
          <span className="text-[9px] text-zinc-500 mt-1 font-medium tracking-wider uppercase">Réel</span>
        </div>
      )}

      {/* 4. Dégradé sombre transparent en bas pour les textes et contrasté (gradient inline rgba) */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.5) 100%)"
        }}
      />

      {/* 5. Bouton Play central si demandé */}
      {showPlayButton && (
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-300 ${
          isVideoPlaying && isActivePreview ? "opacity-0" : "opacity-100"
        }`}>
          <div className="w-10 h-10 rounded-full bg-black/65 backdrop-blur-md border border-[#D4AF37]/60 text-[#D4AF37] flex items-center justify-center shadow-lg group-hover:scale-115 group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-300">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoThumbnail;
