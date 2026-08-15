import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Loader2, Volume2 } from "lucide-react";

interface VoiceMessagePlayerProps {
  id: string;
  src: string;
  isMe: boolean;
}

export function VoiceMessagePlayer({ id, src, isMe }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Generate a beautiful, stable, aesthetic pseudo-waveform based on the audio source URL hash
  const waveformBars = React.useMemo(() => {
    const barsCount = 28;
    const bars: number[] = [];
    let hash = 0;
    if (src) {
      for (let i = 0; i < src.length; i++) {
        hash = src.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    for (let i = 0; i < barsCount; i++) {
      const pseudoRandom = Math.abs(Math.sin(hash + i) * 80) + 20; // height between 20% and 100%
      bars.push(Math.round(pseudoRandom));
    }
    return bars;
  }, [src]);

  useEffect(() => {
    // Lazy initialize HTMLAudioElement
    const audio = new Audio(src);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);

    // Trigger metadata load
    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audioRef.current = null;
    };
  }, [src]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Pause any other playing voice message in the DOM to avoid overlapping sounds
      const allAudios = document.querySelectorAll("audio");
      allAudios.forEach((a) => {
        try {
          a.pause();
        } catch (_) {}
      });
      
      setIsLoading(true);
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.warn("Playback error:", err);
          setIsLoading(false);
        });
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!audioRef.current || !progressRef.current || duration === 0) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickedRatio = Math.max(0, Math.min(1, clickX / width));
    
    audioRef.current.currentTime = clickedRatio * duration;
    setCurrentTime(audioRef.current.currentTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      id={`vocal-player-${id}`}
      className={`flex items-center gap-3 p-2 rounded-2xl w-full max-w-xs transition-all ${
        isMe 
          ? "bg-black/35 text-white" 
          : "bg-afri-bg text-afri-text border border-afri-border/40"
      }`}
    >
      {/* Play/Pause Trigger */}
      <button
        onClick={togglePlayPause}
        disabled={isLoading && !isPlaying}
        className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition active:scale-90 shrink-0 ${
          isMe 
            ? "bg-[#D4AF37] hover:bg-amber-400 text-black" 
            : "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/25"
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform & Progress Container */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div 
          ref={progressRef}
          onClick={handleProgressBarClick}
          className="h-7 flex items-end gap-[2px] cursor-pointer relative py-1"
        >
          {/* Waveform Visualization Bars */}
          {waveformBars.map((barHeight, idx) => {
            const barIndexPercent = (idx / waveformBars.length) * 100;
            const isPlayed = progressPercent >= barIndexPercent;

            return (
              <div
                key={idx}
                style={{ height: `${barHeight}%` }}
                className={`flex-1 rounded-sm transition-all duration-150 ${
                  isPlayed 
                    ? isMe 
                      ? "bg-[#D4AF37]" 
                      : "bg-[#D4AF37]"
                    : isMe 
                      ? "bg-white/20" 
                      : "bg-afri-border"
                }`}
              />
            );
          })}
        </div>

        {/* Duration / Timestamp metadata info */}
        <div className="flex items-center justify-between text-[9px] font-mono mt-0.5 opacity-80">
          <span>{formatTime(currentTime)}</span>
          <span className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 opacity-60" />
            {formatTime(duration || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
