import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, X, Disc, Loader2 } from "lucide-react";
import { useAudio } from "../context/AudioContext";

export const FloatingAudioPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isPaused,
    isLoading,
    currentTime,
    duration,
    pause,
    resume,
    stop,
    seek
  } = useAudio();

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    seek(value);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95, x: "-50%" }}
        animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
        exit={{ opacity: 0, y: 30, scale: 0.95, x: "-50%" }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed bottom-[84px] xs:bottom-[92px] sm:bottom-[100px] left-1/2 -translate-x-1/2 w-[94%] xs:w-[92%] max-w-[425px] bg-afri-bg-sec/98 border border-afri-border rounded-[24px] shadow-[0_12px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.7)] p-3.5 z-40 select-none animate-fadeIn text-left backdrop-blur-none"
      >
        <div className="flex flex-col gap-2 w-full">
          {/* Top Line: Info, Action Buttons, and Close button */}
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-afri-bg flex items-center justify-center border border-afri-border overflow-hidden">
                  {currentTrack.artwork ? (
                    <img 
                      src={currentTrack.artwork} 
                      alt="" 
                      className={`w-full h-full object-cover ${isPlaying ? "animate-spin-slow" : ""}`}
                    />
                  ) : (
                    <Disc className={`w-5 h-5 text-afri-gold ${isPlaying ? "animate-spin-slow" : ""}`} />
                  )}
                </div>
                {isLoading && (
                  <div className="absolute inset-0 bg-afri-bg/40 flex items-center justify-center rounded-xl">
                    <Loader2 className="w-4 h-4 text-afri-gold animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[11px] font-mono uppercase tracking-widest text-afri-text-muted leading-none">
                  En Lecture
                </span>
                <span className="text-xs font-black text-afri-text truncate mt-1 leading-tight">
                  {currentTrack.title}
                </span>
                <span className="text-[10px] font-mono text-afri-text-sec truncate mt-0.5">
                  {currentTrack.artist || "Afrigombo Artiste"}
                </span>
              </div>
            </div>

            {/* Controls Side */}
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isPlaying ? pause : resume}
                disabled={isLoading}
                className="w-8 h-8 rounded-full bg-afri-bg hover:bg-afri-bg-action flex items-center justify-center border border-afri-border text-afri-gold transition-colors duration-200 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-afri-gold" />
                ) : isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current translate-x-[1px]" />
                )}
              </motion.button>

              <button
                onClick={stop}
                className="w-8 h-8 rounded-full hover:bg-afri-bg-action flex items-center justify-center text-afri-text-sec hover:text-afri-text transition-colors duration-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Line: Interactive Seek/Slider & Time stamp */}
          <div className="flex items-center gap-2.5 w-full pt-1">
            <span className="text-[9px] font-mono text-afri-text-sec min-w-[30px] text-right">
              {formatTime(currentTime)}
            </span>

            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleProgressChange}
              className="flex-1 h-1 bg-afri-bg-ter rounded-lg appearance-none cursor-pointer accent-afri-gold"
              title="Progression"
            />

            <span className="text-[9px] font-mono text-afri-text-sec min-w-[30px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <style>{`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 15s linear infinite;
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};
