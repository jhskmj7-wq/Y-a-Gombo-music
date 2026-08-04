import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Headphones, Music, Play, Pause, Volume2, VolumeX, RefreshCw, X, ChevronDown,
  Volume1, Disc
} from "lucide-react";
import { globalAudioManager, AudioState } from "../lib/audioManager";

export const SmartAudioMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>(globalAudioManager.getState());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = globalAudioManager.subscribe((state) => {
      setAudioState(state);
    });
    return () => unsub();
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const isPlayingHymn = audioState.currentPlaying === "hymne";
  const isPlayingIntro = audioState.currentPlaying === "intro";

  const handleToggleHymn = () => {
    if (isPlayingHymn) {
      if (audioState.isPaused) globalAudioManager.resume();
      else globalAudioManager.pause();
    } else {
      globalAudioManager.playHymn();
    }
  };

  const handleReplayIntro = () => {
    globalAudioManager.playIntro(true);
    setIsOpen(false);
  };

  const toggleMute = () => {
    globalAudioManager.setIsMuted(!audioState.isMuted);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Main Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-all z-40 cursor-pointer shadow-lg
          ${isOpen ? "bg-afri-bg-sec border-[#D4AF37] text-[#D4AF37]" : "bg-afri-bg-sec/80 border-[#D4AF37]/30 text-afri-text-sec hover:text-[#D4AF37]"}
        `}
      >
        {isPlayingHymn || isPlayingIntro ? (
          <div className="relative">
            <Disc className={`w-5 h-5 ${!audioState.isPaused ? "animate-spin-slow" : ""}`} />
            {!audioState.isPaused && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
            )}
          </div>
        ) : (
          <Headphones className="w-5 h-5" />
        )}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-12 right-0 w-64 bg-afri-bg-sec border border-afri-border rounded-2xl shadow-2xl overflow-hidden z-50 p-2 space-y-1"
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-afri-border/50 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-afri-text-sec">Centre Audio Impérial</span>
            </div>

            {/* Hymne Officiel */}
            <button
              onClick={handleToggleHymn}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-afri-bg-ter transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isPlayingHymn ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-afri-bg/50 text-afri-text-sec"}`}>
                  <Music className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className={`text-xs font-bold ${isPlayingHymn ? "text-[#D4AF37]" : "text-afri-text"}`}>Hymne officiel</p>
                  <p className="text-[9px] text-afri-text-sec font-mono">AFRIGOMBO ELITE SHOWBIZ</p>
                </div>
              </div>
              <div className="text-afri-text-sec group-hover:text-[#D4AF37] transition-colors">
                {isPlayingHymn && !audioState.isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </div>
            </button>

            {/* Réécouter l'introduction */}
            <button
              onClick={handleReplayIntro}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-afri-bg-ter transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-afri-bg/50 text-afri-text-sec flex items-center justify-center">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-afri-text">Réécouter l'intro</p>
                <p className="text-[9px] text-afri-text-sec font-mono">Vibration originelle</p>
              </div>
            </button>

            {/* Volume Control */}
            <div className="p-3 space-y-3 bg-afri-bg/20 rounded-xl mt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleMute}
                    className="text-[#D4AF37] hover:scale-110 transition-transform cursor-pointer"
                  >
                    {audioState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="text-[10px] font-black text-afri-text-sec uppercase tracking-wider">Volume</span>
                </div>
                <span className="text-[10px] font-mono text-[#D4AF37]">{Math.round(audioState.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={audioState.volume}
                onChange={(e) => globalAudioManager.setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-afri-border rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
              />
            </div>

            {/* Close hint */}
            <div className="pt-2 text-center">
              <span className="text-[8px] font-mono text-afri-text-sec uppercase">Appuyez ailleurs pour fermer</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
