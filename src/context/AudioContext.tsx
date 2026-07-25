import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { getCachedAudioUrl } from "../lib/audioManager";

export interface Track {
  id: string;
  url: string;
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
}

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playTrack: (track: Track) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(() => {
    try {
      const stored = localStorage.getItem("gombo_pref_player_volume");
      return stored ? parseFloat(stored) : 0.8;
    } catch (_) {
      return 0.8;
    }
  });
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem("gombo_pref_player_muted") === "true";
    } catch (_) {
      return false;
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize unique central HTML5 Audio Element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setIsPaused(false);
    };
    const handleCanPlay = () => setIsLoading(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handlePause = () => {
      setIsPlaying(false);
      setIsPaused(true);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentTime(0);
    };
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  // Update volume and mute on the audio element when state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    try {
      localStorage.setItem("gombo_pref_player_volume", volume.toString());
      localStorage.setItem("gombo_pref_player_muted", isMuted.toString());
    } catch (_) {}
  }, [volume, isMuted]);

  // Autoplay bypass unblocking on first gesture
  useEffect(() => {
    const unlockAudio = () => {
      // Resume web audio context class if any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        try {
          const dummyCtx = new AudioContextClass();
          if (dummyCtx.state === "suspended") {
            dummyCtx.resume().catch(() => {});
          }
        } catch (_) {}
      }

      // Briefly trigger playback of silent/unloaded audio to mark interacted
      if (audioRef.current) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            audioRef.current?.pause();
          }).catch(() => {});
        }
      }

      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };

    document.addEventListener("click", unlockAudio);
    document.addEventListener("touchstart", unlockAudio);

    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  // Sync Media Session API Actions with our play state
  useEffect(() => {
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("play", () => {
          resume();
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          pause();
        });
        navigator.mediaSession.setActionHandler("stop", () => {
          stop();
        });
        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (details.seekTime !== undefined) {
            seek(details.seekTime);
          }
        });
      } catch (_) {}
    }
  }, [currentTrack]);

  const playTrack = async (track: Track) => {
    if (!audioRef.current) return;

    // Check if same track is already loaded
    if (currentTrack?.id === track.id) {
      if (isPaused) {
        resume();
      }
      return;
    }

    try {
      setIsLoading(true);
      setCurrentTrack(track);
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentTime(0);

      // Stop ambient background music first by dispatching global toggle
      window.dispatchEvent(new CustomEvent("gombo_music_toggle", { detail: { play: false } }));

      // Load cached audio URL offline-first
      const resolvedUrl = await getCachedAudioUrl(track.url);
      audioRef.current.src = resolvedUrl;
      audioRef.current.load();

      // Setup Media Session API metadata
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist || "Afrigombo Artiste",
          album: track.album || "Afrigombo",
          artwork: track.artwork ? [
            { src: track.artwork, sizes: "512x512", type: "image/png" }
          ] : [
            { src: "/public/logo_afrigombo.png", sizes: "512x512", type: "image/png" }
          ]
        });
      }

      await audioRef.current.play();
    } catch (err) {
      console.warn("Failed to play custom track", err);
      setIsLoading(false);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const resume = () => {
    if (audioRef.current && currentTrack) {
      // Pause ambient background music just in case
      window.dispatchEvent(new CustomEvent("gombo_music_toggle", { detail: { play: false } }));
      
      audioRef.current.play().catch(err => {
        console.warn("Audio resume failed", err);
      });
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);
  };

  const seek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const setVolume = (vol: number) => {
    const v = Math.max(0, Math.min(1, vol));
    setVolumeState(v);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isPaused,
        isLoading,
        currentTime,
        duration,
        volume,
        isMuted,
        playTrack,
        pause,
        resume,
        stop,
        seek,
        setVolume,
        toggleMute,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
