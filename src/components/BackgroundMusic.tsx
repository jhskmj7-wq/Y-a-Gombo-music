import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Volume2, VolumeX, SkipForward, SkipBack, Disc, RefreshCw, Shuffle, ListMusic, ChevronDown, Radio } from 'lucide-react';
import { usePerformance } from '../services/performanceService';

// Tableau de la playlist d'ambiance Afrigombo (Saxophone, Piano, Kora, Afro-Jazz Instrumental)
const PLAYLIST = [
  {
    id: 1,
    title: "Vibe Harmonie (Saxophone & Piano Acoustique)",
    artist: "Afrigombo Melodies",
    url: "https://assets.mixkit.co/music/preview/mixkit-african-spirit-140.mp3",
    category: "Calme"
  },
  {
    id: 4,
    title: "Sahel Sunset (Ambient Kora Meditation)",
    artist: "Mixkit Traditional",
    url: "https://assets.mixkit.co/music/preview/mixkit-tribal-rhythm-263.mp3",
    category: "Calme"
  },
  {
    id: 2,
    title: "Prestige d'Afrique (Kora & Piano Akoustik)",
    artist: "Afrigombo Souverain",
    url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Ketsa/The_Lost_Files/Ketsa_-_04_-_Soul_Searching.mp3",
    category: "Lounge"
  },
  {
    id: 5,
    title: "Soweto Wind Harmony (Piano Duo)",
    artist: "Traditional Free Archive",
    url: "https://assets.mixkit.co/music/preview/mixkit-serene-view-1216.mp3",
    category: "Lounge"
  },
  {
    id: 3,
    title: "Mbombela (Classic African Jazz & Drums)",
    artist: "The African Jazz Pioneers",
    url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/WFMU/The_African_Jazz_Pioneers/African_Jazz_Pioneers/The_African_Jazz_Pioneers_-_01_-_Mbombela.mp3",
    category: "Rythmé"
  }
];

export const BackgroundMusic: React.FC = () => {
  const { areSoundsReduced } = usePerformance();
  const [isPlaying, setIsPlaying] = useState(false); // Default to false for better organization/control
  const [currentIndex, setCurrentIndex] = useState(() => {
    return Math.floor(Math.random() * PLAYLIST.length);
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [isShuffle, setIsShuffle] = useState(() => localStorage.getItem("gombo_pref_shuffle") === "true");
  const [isLoopList, setIsLoopList] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  const [volume, setVolume] = useState(0.35); // volume stable et agréable
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync volume with performance states
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = areSoundsReduced ? volume * 0.4 : volume;
    }
  }, [volume, areSoundsReduced]);
  const wasPlayingRef = useRef(false);
  const transitionRef = useRef<boolean>(false); // prevent double track changes

  const currentTrack = PLAYLIST[currentIndex];

  // Pause when the tab is hidden and resume if playing (user switches tabs / minimizes)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isPlaying && audioRef.current) {
          audioRef.current.pause();
          wasPlayingRef.current = true;
        }
      } else {
        if (wasPlayingRef.current && audioRef.current && isPlaying) {
          audioRef.current.play().catch(err => console.log("Ambient Music resume blocked:", err));
          wasPlayingRef.current = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  // Handle global toggle event triggers
  useEffect(() => {
    const handleGlobalToggle = (e: any) => {
      if (e.detail?.play !== undefined) {
        if (e.detail.play) {
          if (e.detail.style) {
            const style = e.detail.style;
            let targetIndex = 0;
            if (style === "Afro Chill") targetIndex = 0;
            else if (style === "Piano Lounge") targetIndex = 1;
            else if (style === "Percussion Africaine") targetIndex = 2;
            else if (style === "Studio Beat") targetIndex = 3;
            else targetIndex = 4;
            
            if (targetIndex !== currentIndex) {
              setCurrentIndex(targetIndex);
            }
          }
          
          // Use setTimeout to ensure index switches before playing
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.volume = volume;
              audioRef.current.play().then(() => {
                setIsPlaying(true);
                localStorage.setItem("gombo_pref_ambient_music", "true");
              }).catch(() => {
                // Autoplay gesture safety
              });
            }
          }, 50);
        } else {
          if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
            localStorage.setItem("gombo_pref_ambient_music", "false");
          }
        }
      }
    };

    window.addEventListener('gombo_music_toggle', handleGlobalToggle);
    return () => window.removeEventListener('gombo_music_toggle', handleGlobalToggle);
  }, [isPlaying, currentIndex, volume]);

  // Audio setup and Crossfade transition logic
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    transitionRef.current = false;
    const audio = new Audio(currentTrack.url);
    audio.loop = false;
    audio.volume = isPlaying ? (areSoundsReduced ? volume * 0.4 : volume) : 0;

    const handleEnded = () => {
       if (transitionRef.current) return;
       transitionRef.current = true;
       // Select next track
       handleNextTrack(true); // crossfade transition on automatic end
    };

    audio.addEventListener('ended', handleEnded);
    audioRef.current = audio;

    if (isPlaying) {
      // Fade in effect
      let currentFadeVol = 0;
      audio.volume = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          const fadeInInterval = setInterval(() => {
            const targetMaxVol = areSoundsReduced ? volume * 0.4 : volume;
            currentFadeVol = Math.min(targetMaxVol, currentFadeVol + 0.05);
            if (audioRef.current) {
              audioRef.current.volume = currentFadeVol;
            }
            if (currentFadeVol >= targetMaxVol) {
              clearInterval(fadeInInterval);
            }
          }, 80);
        }).catch(() => {
          setIsPlaying(false);
        });
      }
    }

    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex]);

  // Set local storage when shuffle state changes
  useEffect(() => {
    localStorage.setItem("gombo_pref_shuffle", String(isShuffle));
  }, [isShuffle]);

  // React to volume changes
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.volume = areSoundsReduced ? volume * 0.4 : volume;
    }
  }, [volume, isPlaying, areSoundsReduced]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      localStorage.setItem("gombo_pref_ambient_music", "false");
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
          audioRef.current!.volume = areSoundsReduced ? volume * 0.4 : volume;
          localStorage.setItem("gombo_pref_ambient_music", "true");
          triggerNotification();
        }).catch(err => {
          console.warn("Autoplay blocked:", err);
        });
      }
    }
  };

  const handleNextTrack = (crossfade = false) => {
    if (crossfade && audioRef.current) {
      // Smooth fade-out before switching URL
      let currentFadeVol = audioRef.current.volume;
      const fadeOutInterval = setInterval(() => {
        currentFadeVol = Math.max(0, currentFadeVol - 0.05);
        if (audioRef.current) {
          audioRef.current.volume = currentFadeVol;
        }
        if (currentFadeVol <= 0) {
          clearInterval(fadeOutInterval);
          switchTrackNext();
        }
      }, 60);
    } else {
      switchTrackNext();
    }
  };

  const switchTrackNext = () => {
    if (isShuffle) {
      // Pick random different track
      let nextIdx = currentIndex;
      if (PLAYLIST.length > 1) {
        while (nextIdx === currentIndex) {
          nextIdx = Math.floor(Math.random() * PLAYLIST.length);
        }
      }
      setCurrentIndex(nextIdx);
    } else {
      setCurrentIndex((prev) => (prev + 1) % PLAYLIST.length);
    }
    triggerNotification();
  };

  const handlePrevTrack = () => {
    setCurrentIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
    triggerNotification();
  };

  const triggerNotification = () => {
    setShowNotification(true);
    const timer = setTimeout(() => setShowNotification(false), 4000);
    return () => clearTimeout(timer);
  };

  return (
    <div 
      className="fixed bottom-4 left-4 z-[9999] flex flex-col items-start gap-1.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mini control bubble */}
      <div className="flex items-center gap-2">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 border ${
            isPlaying 
              ? 'bg-[#D4AF37]/90 border-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/25' 
              : 'bg-zinc-950/80 border-white/10 text-white/55 hover:text-white hover:border-white/35'
          }`}
          title={isPlaying ? "Couper l'ambiance musicale" : "Activer l'ambiance musicale"}
        >
          {isPlaying ? (
            <div className="relative flex items-center justify-center">
              <Volume2 size={15} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            </div>
          ) : (
            <VolumeX size={15} />
          )}
        </motion.button>

        <AnimatePresence>
          {(showNotification || isHovered || isOpenDrawer) && (
            <motion.div 
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              onClick={() => setIsOpenDrawer(!isOpenDrawer)}
              className="flex items-center gap-3.5 bg-zinc-950/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-zinc-800/80 shadow-2xl cursor-pointer hover:border-[#D4AF37]/45 transition-all select-none"
            >
              <div className="flex items-center gap-2">
                <Disc className={`w-3.5 h-3.5 text-[#D4AF37] ${isPlaying ? 'animate-spin-slow' : ''}`} />
                <div className="flex flex-col min-w-[120px] max-w-[180px]">
                  <span className="text-[7.5px] font-mono uppercase tracking-widest text-zinc-500 leading-none">Ambiance active</span>
                  <span className="text-[10.5px] font-extrabold text-white truncate leading-tight mt-0.5">{currentTrack.title}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => handleNextTrack(false)}
                  className="p-1 hover:text-[#D4AF37] text-zinc-500 hover:scale-105 active:scale-95 transition-all"
                  title="Suivant"
                >
                  <SkipForward size={13} />
                </button>
                <button 
                  onClick={() => setIsOpenDrawer(!isOpenDrawer)}
                  className={`p-1 transition-all ${isOpenDrawer ? 'text-[#D4AF37] rotate-180' : 'text-zinc-500 hover:text-white'}`}
                  title="Ouvrir la playlist"
                >
                  <ListMusic size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Playlist Drawer */}
      <AnimatePresence>
        {isOpenDrawer && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="w-72 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)] overflow-hidden text-left relative mt-1"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900 mb-3">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
                <h4 className="text-[10px] font-mono font-black text-white uppercase tracking-widest">Afrigombo Playback</h4>
              </div>
              <button 
                onClick={() => setIsOpenDrawer(false)}
                className="p-1 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-all"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center justify-between bg-zinc-900/60 p-2 rounded-xl mb-3 border border-zinc-900 gap-1.5">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1 border ${
                  isShuffle 
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]' 
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-350'
                }`}
                title="Lecture aléatoire"
              >
                <Shuffle size={11} />
                <span>Aléatoire</span>
              </button>
              
              <button
                onClick={() => setIsLoopList(!isLoopList)}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1 border ${
                  isLoopList 
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]' 
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-350'
                }`}
                title="Boucle infinie"
              >
                <RefreshCw size={11} className={isPlaying ? 'animate-spin-slow' : ''} />
                <span>Boucle</span>
              </button>
            </div>

            {/* Tracklist selection */}
            <div className="flex flex-wrap gap-1.5 mb-3 border-b border-zinc-900 pb-3">
              {["Tous", "Calme", "Lounge", "Rythmé"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded-md text-[8.5px] font-black uppercase transition-all border ${
                    selectedCategory === cat 
                      ? "bg-[#D4AF37] text-black border-[#D4AF37]" 
                      : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1 select-none">
              {PLAYLIST.filter(t => selectedCategory === "Tous" || t.category === selectedCategory).map((track, idx) => {
                const globalIdx = PLAYLIST.findIndex(p => p.id === track.id);
                const isActive = globalIdx === currentIndex;
                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      setCurrentIndex(globalIdx);
                      setIsPlaying(true);
                    }}
                    className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between text-left group ${
                      isActive 
                        ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-white' 
                        : 'bg-transparent hover:bg-zinc-900 border border-transparent text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 flex-1 pr-2">
                       <div className="flex items-center gap-1.5">
                        <span className="text-[10.5px] font-extrabold truncate leading-tight">{track.title}</span>
                        <span className="text-[7.5px] font-mono text-[#D4AF37] opacity-60">[{track.category}]</span>
                       </div>
                      <span className="text-[8px] font-mono text-zinc-500 mt-0.5">{track.artist}</span>
                    </div>
                    {isActive && isPlaying ? (
                      <div className="flex items-end gap-0.5 h-3">
                        <div className="w-0.5 bg-[#D4AF37] h-2 animate-bounce rounded-full" style={{ animationDelay: '0.1s' }} />
                        <div className="w-0.5 bg-[#D4AF37] h-3 animate-bounce rounded-full" style={{ animationDelay: '0.3s' }} />
                        <div className="w-0.5 bg-[#D4AF37] h-1.5 animate-bounce rounded-full" style={{ animationDelay: '0.2s' }} />
                      </div>
                    ) : (
                      <span className="text-[8px] font-mono text-zinc-650 opacity-0 group-hover:opacity-100 transition-opacity">PLAY</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Volume slider */}
            <div className="mt-3 pt-2 border-t border-zinc-900 flex items-center gap-2 text-zinc-500">
              <VolumeX size={11} />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                title="Volume de l'ambiance"
              />
              <Volume2 size={11} className="text-[#D4AF37]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 18s linear infinite;
        }
      `}</style>
    </div>
  );
};
