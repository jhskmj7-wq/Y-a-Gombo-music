import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Volume2, VolumeX, SkipForward, SkipBack, Disc, RefreshCw, Shuffle, ListMusic, ChevronDown, Radio } from 'lucide-react';
import { usePerformance } from '../services/performanceService';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { getCachedAudioUrl } from '../lib/audioManager';

// Curated static fallback tracks for the ambient experience
const DEFAULT_PLAYLIST = [
  {
    id: "default-1",
    title: "Lagos Night Chill",
    artist: "Eko Groove",
    url: "https://assets.mixkit.co/music/preview/mixkit-slow-trail-1217.mp3",
    category: "Lounge"
  },
  {
    id: "default-2",
    title: "Mbombela (Classic African Jazz & Drums)",
    artist: "The African Jazz Pioneers",
    url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/WFMU/The_African_Jazz_Pioneers/African_Jazz_Pioneers/The_African_Jazz_Pioneers_-_01_-_Mbombela.mp3",
    category: "Rythmé"
  },
  {
    id: "default-3",
    title: "Prestige d'Afrique (Kora & Piano Akoustik)",
    artist: "Afrigombo Souverain",
    url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Ketsa/The_Lost_Files/Ketsa_-_04_-_Soul_Searching.mp3",
    category: "Lounge"
  },
  {
    id: "default-4",
    title: "Rêve d'Ivoire (Harpe & Vent)",
    artist: "Symphonie d'Abidjan",
    url: "https://assets.mixkit.co/music/preview/mixkit-ethereal-dream-1250.mp3",
    category: "Calme"
  },
  {
    id: "default-5",
    title: "Rythmes de la Terre (Percussions)",
    artist: "Tam-Tam Legend",
    url: "https://assets.mixkit.co/music/preview/mixkit-african-safari-loop-267.mp3",
    category: "Rythmé"
  },
  {
    id: "default-6",
    title: "Sahel Sunset (Ambient Kora Meditation)",
    artist: "Mixkit Traditional",
    url: "https://assets.mixkit.co/music/preview/mixkit-tribal-rhythm-263.mp3",
    category: "Calme"
  },
  {
    id: "default-7",
    title: "Soweto Wind Harmony (Piano Duo)",
    artist: "Traditional Free Archive",
    url: "https://assets.mixkit.co/music/preview/mixkit-serene-view-1216.mp3",
    category: "Lounge"
  },
  {
    id: "default-8",
    title: "Vibe Harmonie (Saxophone & Piano Acoustique)",
    artist: "Afrigombo Melodies",
    url: "https://assets.mixkit.co/music/preview/mixkit-african-spirit-140.mp3",
    category: "Calme"
  }
];

export const BackgroundMusic: React.FC = () => {
  const { areSoundsReduced } = usePerformance();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<any[]>(DEFAULT_PLAYLIST);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");

  // Real-time Firestore sync of dynamic background tracks
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, "media"),
        (snapshot) => {
          const customList: any[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.category === "audio" && data.enabled && data.downloadURL) {
              customList.push({
                id: docSnap.id,
                title: data.title || "Musique d'ambiance",
                artist: data.updatedBy ? data.updatedBy.split("@")[0] : "Afrigombo",
                url: data.downloadURL,
                category: "Lounge", // Categorize dynamically-uploaded files as general Lounge
                volume: data.volume !== undefined ? data.volume : 0.8
              });
            }
          });

          if (customList.length > 0) {
            setPlaylist(customList);
          } else {
            setPlaylist(DEFAULT_PLAYLIST);
          }
        },
        (err) => {
          console.warn("[BACKGROUND MUSIC] Failed to sync with Firestore 'media' collection:", err);
          setPlaylist(DEFAULT_PLAYLIST);
        }
      );
      return unsub;
    } catch (e) {
      console.warn("[BACKGROUND MUSIC] Sync error:", e);
      setPlaylist(DEFAULT_PLAYLIST);
    }
  }, []);

  // Ensure index remains bounded when playlist changes dynamically
  useEffect(() => {
    if (currentIndex >= playlist.length) {
      setCurrentIndex(0);
    }
  }, [playlist, currentIndex]);

  // Auto-switch track if current one is not in the new category
  useEffect(() => {
    if (selectedCategory === "Tous") return;
    const currentTrack = playlist[currentIndex];
    if (currentTrack && currentTrack.category !== selectedCategory) {
      handleNextTrack(true);
    }
  }, [selectedCategory]);

  const [isShuffle, setIsShuffle] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("gombo_pref_shuffle") === "true";
    }
    return false;
  });
  const [isLoopList, setIsLoopList] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  const [volume, setVolume] = useState(0.35);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync volume with performance states
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = areSoundsReduced ? volume * 0.4 : volume;
    }
  }, [volume, areSoundsReduced]);

  const wasPlayingRef = useRef(false);
  const transitionRef = useRef<boolean>(false);

  const currentTrack = playlist[currentIndex] || DEFAULT_PLAYLIST[0];

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
          audioRef.current.play().catch(err => { /* no-op */ });
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
            else if (style === "Piano Lounge") targetIndex = Math.min(1, playlist.length - 1);
            else if (style === "Percussion Africaine") targetIndex = Math.min(2, playlist.length - 1);
            else if (style === "Studio Beat") targetIndex = Math.min(3, playlist.length - 1);
            else targetIndex = Math.min(4, playlist.length - 1);

            if (targetIndex !== currentIndex && targetIndex >= 0) {
              setCurrentIndex(targetIndex);
            }
          }

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
  }, [isPlaying, currentIndex, volume, playlist]);

  // Audio setup and Cache-backed load with Crossfade transition logic
  useEffect(() => {
    let active = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    transitionRef.current = false;

    // Create persistent HTML5 Audio tag
    const audio = new Audio();
    audio.loop = false;
    audio.volume = 0; // Starts at zero for smooth transition
    audioRef.current = audio;

    const handleEnded = () => {
      if (transitionRef.current) return;
      transitionRef.current = true;
      handleNextTrack(true);
    };

    audio.addEventListener('ended', handleEnded);

    // Resolve URL from cache first to avoid repeating downloads
    getCachedAudioUrl(currentTrack.url).then((cachedUrl) => {
      if (!active) return;
      audio.src = cachedUrl;
      audio.volume = isPlaying ? (areSoundsReduced ? volume * 0.4 : volume) : 0;

      if (isPlaying) {
        let currentFadeVol = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            const fadeInInterval = setInterval(() => {
              if (!active || !audioRef.current) {
                clearInterval(fadeInInterval);
                return;
              }
              const targetMaxVol = areSoundsReduced ? volume * 0.4 : volume;
              currentFadeVol = Math.min(targetMaxVol, currentFadeVol + 0.05);
              audio.volume = currentFadeVol;
              if (currentFadeVol >= targetMaxVol) {
                clearInterval(fadeInInterval);
              }
            }, 80);
          }).catch(() => {
            setIsPlaying(false);
          });
        }
      }
    }).catch((err) => {
      console.warn("[BACKGROUND MUSIC] Cache load failed, playing direct stream:", err);
      if (!active) return;
      audio.src = currentTrack.url;
      if (isPlaying) {
        audio.play().catch(() => setIsPlaying(false));
      }
    });

    return () => {
      active = false;
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, currentTrack]);

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

  function togglePlay() {
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
  }

  function handleNextTrack(crossfade = false) {
    if (crossfade && audioRef.current) {
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
  }

  function switchTrackNext() {
    const availableTracks = playlist.filter(t => selectedCategory === "Tous" || t.category === selectedCategory);

    if (availableTracks.length === 0) {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
      transitionRef.current = false;
      triggerNotification();
      return;
    }

    let nextGlobalIdx = 0;
    if (isShuffle) {
      if (availableTracks.length > 1) {
        const currentInAvailableIdx = availableTracks.findIndex(t => t.id === currentTrack.id);
        let nextIdxInAvailable = Math.floor(Math.random() * availableTracks.length);
        while (nextIdxInAvailable === currentInAvailableIdx) {
          nextIdxInAvailable = Math.floor(Math.random() * availableTracks.length);
        }
        nextGlobalIdx = playlist.findIndex(t => t.id === availableTracks[nextIdxInAvailable].id);
      } else {
        nextGlobalIdx = playlist.findIndex(t => t.id === availableTracks[0].id);
      }
    } else {
      const currentInAvailableIdx = availableTracks.findIndex(t => t.id === currentTrack.id);
      const nextIdxInAvailable = (currentInAvailableIdx + 1) % availableTracks.length;
      nextGlobalIdx = playlist.findIndex(t => t.id === availableTracks[nextIdxInAvailable].id);
    }

    setCurrentIndex(nextGlobalIdx >= 0 ? nextGlobalIdx : 0);
    transitionRef.current = false;
    triggerNotification();
  }

  function handlePrevTrack() {
    const availableTracks = playlist.filter(t => selectedCategory === "Tous" || t.category === selectedCategory);
    if (availableTracks.length === 0) {
      setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
      triggerNotification();
      return;
    }

    const currentInAvailableIdx = availableTracks.findIndex(t => t.id === currentTrack.id);
    const prevIdxInAvailable = (currentInAvailableIdx - 1 + availableTracks.length) % availableTracks.length;
    const prevGlobalIdx = playlist.findIndex(t => t.id === availableTracks[prevIdxInAvailable].id);

    setCurrentIndex(prevGlobalIdx >= 0 ? prevGlobalIdx : 0);
    triggerNotification();
  }

  function triggerNotification() {
    setShowNotification(true);
    const timer = setTimeout(() => setShowNotification(false), 4000);
    return () => clearTimeout(timer);
  }

  return (
    <div 
      className="fixed bottom-4 left-4 z-[9999] flex flex-col items-start gap-1.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 border ${
            isPlaying 
              ? 'bg-afri-bg-sec/90 border-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/25' 
              : 'bg-afri-bg/80 border-afri-border text-afri-text/55 hover:text-afri-text hover:border-white/35'
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
              className="flex items-center gap-3.5 bg-afri-bg/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-afri-border/80 shadow-2xl cursor-pointer hover:border-[#D4AF37]/45 transition-all select-none"
            >
              <div className="flex items-center gap-2">
                <Disc className={`w-3.5 h-3.5 text-[#D4AF37] ${isPlaying ? 'animate-spin-slow' : ''}`} />
                <div className="flex flex-col min-w-[120px] max-w-[180px]">
                  <span className="text-[7.5px] font-mono uppercase tracking-widest text-afri-text-sec leading-none">Ambiance active</span>
                  <span className="text-[10.5px] font-extrabold text-afri-text truncate leading-tight mt-0.5">{currentTrack.title}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => handleNextTrack(false)}
                  className="p-1 hover:text-[#D4AF37] text-afri-text-sec hover:scale-105 active:scale-95 transition-all"
                  title="Suivant"
                >
                  <SkipForward size={13} />
                </button>
                <button 
                  onClick={() => setIsOpenDrawer(!isOpenDrawer)}
                  className={`p-1 transition-all ${isOpenDrawer ? 'text-[#D4AF37] rotate-180' : 'text-afri-text-sec hover:text-afri-text'}`}
                  title="Ouvrir la playlist"
                >
                  <ListMusic size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpenDrawer && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="w-72 bg-afri-bg/95 backdrop-blur-xl border border-afri-border rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)] overflow-hidden text-left relative mt-1"
          >
            <div className="flex justify-between items-center pb-2 border-b border-afri-border mb-3">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
                <h4 className="text-[10px] font-mono font-black text-afri-text uppercase tracking-widest">Afrigombo Playback</h4>
              </div>
              <button 
                onClick={() => setIsOpenDrawer(false)}
                className="p-1 hover:bg-afri-bg-sec rounded-full text-afri-text-sec hover:text-afri-text transition-all"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-afri-bg-sec/60 p-2 rounded-xl mb-3 border border-afri-border gap-1.5">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1 border ${
                  isShuffle 
                    ? 'bg-afri-bg-sec/10 border-[#D4AF37]/30 text-[#D4AF37]' 
                    : 'bg-transparent border-transparent text-afri-text-sec hover:text-zinc-350'
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
                    ? 'bg-afri-bg-sec/10 border-[#D4AF37]/30 text-[#D4AF37]' 
                    : 'bg-transparent border-transparent text-afri-text-sec hover:text-zinc-350'
                }`}
                title="Boucle infinie"
              >
                <RefreshCw size={11} className={isPlaying ? 'animate-spin-slow' : ''} />
                <span>Boucle</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3 border-b border-afri-border pb-3">
              {["Tous", "Calme", "Lounge", "Rythmé"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded-md text-[8.5px] font-black uppercase transition-all border ${
                    selectedCategory === cat 
                      ? "bg-afri-bg-sec text-black border-[#D4AF37]" 
                      : "bg-afri-bg-sec text-afri-text-sec border-afri-border hover:text-afri-text"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1 select-none">
              {playlist.filter(t => selectedCategory === "Tous" || t.category === selectedCategory).map((track, idx) => {
                const globalIdx = playlist.findIndex(p => p.id === track.id);
                const isActive = globalIdx === currentIndex;
                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      setCurrentIndex(globalIdx >= 0 ? globalIdx : 0);
                      setIsPlaying(true);
                    }}
                    className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between text-left group ${
                      isActive 
                        ? 'bg-afri-bg-sec/10 border border-[#D4AF37]/25 text-afri-text' 
                        : 'bg-transparent hover:bg-afri-bg-sec border border-transparent text-afri-text-sec hover:text-afri-text'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10.5px] font-extrabold truncate leading-tight">{track.title}</span>
                        <span className="text-[7.5px] font-mono text-[#D4AF37] opacity-60">[{track.category}]</span>
                      </div>
                      <span className="text-[8px] font-mono text-afri-text-sec mt-0.5">{track.artist}</span>
                    </div>
                    {isActive && isPlaying ? (
                      <div className="flex items-end gap-0.5 h-3">
                        <div className="w-0.5 bg-afri-bg-sec h-2 animate-bounce rounded-full" style={{ animationDelay: '0.1s' }} />
                        <div className="w-0.5 bg-afri-bg-sec h-3 animate-bounce rounded-full" style={{ animationDelay: '0.3s' }} />
                        <div className="w-0.5 bg-afri-bg-sec h-1.5 animate-bounce rounded-full" style={{ animationDelay: '0.2s' }} />
                      </div>
                    ) : (
                      <span className="text-[8px] font-mono text-zinc-650 opacity-0 group-hover:opacity-100 transition-opacity">PLAY</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-2 border-t border-afri-border flex items-center gap-2 text-afri-text-sec">
              <VolumeX size={11} />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-afri-bg-ter rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
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
