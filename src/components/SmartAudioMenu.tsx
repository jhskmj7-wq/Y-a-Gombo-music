import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Headphones, Music, Play, Pause, RefreshCw, Disc, Sparkles, Radio
} from "lucide-react";
import { globalAudioManager, AudioState, AudioConfig } from "../lib/audioManager";
import { gomboDB } from "../firebase";
import { db } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { SystemMedia } from "../types";

// Standard base definitions for audio spot metadata
const DEFAULT_AUDIO_SPOTS: Record<string, { title: string; subtitle: string; iconType: "hymn" | "intro" | "ambient" | "general"; defaultPublic: boolean }> = {
  anthem: {
    title: "Hymne officiel",
    subtitle: "AFRIGOMBO ELITE SHOWBIZ",
    iconType: "hymn",
    defaultPublic: true,
  },
  intro: {
    title: "Réécouter l'intro",
    subtitle: "Vibration originelle",
    iconType: "intro",
    defaultPublic: true,
  },
  ambient: {
    title: "AFRIGOMBO — L'ÂME DU GOMBO",
    subtitle: "Musique d'ambiance principale",
    iconType: "ambient",
    defaultPublic: false,
  },
  throne: {
    title: "Musique du Trône",
    subtitle: "Cabinet Privé Impérial",
    iconType: "general",
    defaultPublic: false,
  },
  command: {
    title: "Centre de Commandement",
    subtitle: "Quartier Général Tech",
    iconType: "general",
    defaultPublic: false,
  },
  notif_sound: {
    title: "Musique des notifications",
    subtitle: "Annonces Royales",
    iconType: "general",
    defaultPublic: false,
  },
  event_sound: {
    title: "Musique des événements",
    subtitle: "Défis & Célébrations",
    iconType: "general",
    defaultPublic: false,
  },
};

interface PublicAudioItem {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  iconType: "hymn" | "intro" | "ambient" | "general";
  isPlaying: boolean;
}

export const SmartAudioMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>(globalAudioManager.getState());
  const [systemMediaMap, setSystemMediaMap] = useState<Record<string, SystemMedia>>({});
  const [legacyMediaMap, setLegacyMediaMap] = useState<Record<string, any>>({});
  const menuRef = useRef<HTMLDivElement>(null);

  // 1. Subscribe to Global AudioManager playback state
  useEffect(() => {
    const unsub = globalAudioManager.subscribe((state) => {
      setAudioState(state);
    });
    return () => unsub();
  }, []);

  // 2. Real-time Firestore sync with system_media & media collections
  useEffect(() => {
    // Listen to system_media collection
    const unsubSystem = gomboDB.listenSystemMedia((mediaList) => {
      const map: Record<string, SystemMedia> = {};
      mediaList.forEach((m) => {
        if (m.id) map[m.id] = m;
      });
      setSystemMediaMap(map);
    });

    // Listen to legacy media collection for backward compatibility
    let unsubLegacy = () => {};
    if (db) {
      try {
        unsubLegacy = onSnapshot(collection(db, "media"), (snapshot) => {
          const map: Record<string, any> = {};
          snapshot.forEach((doc) => {
            map[doc.id] = doc.data();
          });
          setLegacyMediaMap(map);
        });
      } catch (err) {
        console.warn("[SmartAudioMenu] Firestore media listener error:", err);
      }
    }

    return () => {
      unsubSystem();
      unsubLegacy();
    };
  }, []);

  // 3. Close when clicking outside
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

  // 4. Compute all tracks dynamically that have publicVisible === true
  const computePublicAudios = (): PublicAudioItem[] => {
    const items: PublicAudioItem[] = [];
    const processedIds = new Set<string>();

    // Ordered spot keys to preserve clean aesthetic ordering
    const spotOrder = ["anthem", "intro", "ambient", "throne", "command", "notif_sound", "event_sound"];

    // Collect all candidate IDs from predefined spots and Firestore
    const candidateIds = [
      ...spotOrder,
      ...Object.keys(systemMediaMap).filter((id) => !spotOrder.includes(id)),
      ...Object.keys(legacyMediaMap).filter((id) => !spotOrder.includes(id) && !Object.keys(systemMediaMap).includes(id)),
    ];

    for (const id of candidateIds) {
      if (processedIds.has(id)) continue;
      processedIds.add(id);

      const sysItem = systemMediaMap[id];
      const legItem = legacyMediaMap[id];
      const defaultSpot = DEFAULT_AUDIO_SPOTS[id];

      // Check category: must be audio if specified
      const category = sysItem?.category || legItem?.category || (defaultSpot ? "audio" : "");
      if (category && category !== "audio" && category !== "sounds") continue;

      // Determine public visibility:
      // - Explicit true on sysItem or legItem -> true
      // - Explicit false on sysItem or legItem -> false
      // - If undefined: fallback to defaultSpot?.defaultPublic (intro & anthem = true, others = false)
      let isPublic = false;
      if (sysItem?.publicVisible !== undefined) {
        isPublic = Boolean(sysItem.publicVisible);
      } else if (legItem?.publicVisible !== undefined) {
        isPublic = Boolean(legItem.publicVisible);
      } else if (defaultSpot) {
        isPublic = defaultSpot.defaultPublic;
      }

      // Check if disabled/archived
      const isEnabled = sysItem ? sysItem.enabled : (legItem ? legItem.enabled !== false && legItem.actif !== false : true);
      if (!isPublic || !isEnabled) continue;

      // Resolve Title & Subtitle
      let title = sysItem?.title || legItem?.title || legItem?.nom || defaultSpot?.title || `Musique ${id}`;
      let subtitle = defaultSpot?.subtitle || sysItem?.description || legItem?.description || "Prestation Officielle";
      
      // If ambient spot without custom title, default to royal title
      if (id === "ambient" && (!sysItem?.title || sysItem.title === "Musique d'ambiance")) {
        title = "AFRIGOMBO — L'ÂME DU GOMBO";
      }

      // Resolve audio playable URL
      let url = "";
      if (sysItem) {
        url = gomboDB.resolveMediaSource(sysItem);
      }
      if (!url && legItem) {
        url = legItem.downloadURL || legItem.mediaUrl || legItem.url || legItem.firebaseUrl || legItem.externalUrl || "";
      }
      if (!url) {
        if (id === "anthem") url = AudioConfig.ANTHEM_URL || AudioConfig.HYMN_URL;
        else if (id === "intro") url = AudioConfig.INTRO_URL;
      }

      // Icon determination
      let iconType: "hymn" | "intro" | "ambient" | "general" = defaultSpot?.iconType || "general";
      if (id === "anthem") iconType = "hymn";
      else if (id === "intro") iconType = "intro";
      else if (id === "ambient") iconType = "ambient";

      // Active playing check
      let isPlaying = false;
      if (id === "anthem" && audioState.currentPlaying === "hymne") isPlaying = true;
      else if (id === "intro" && audioState.currentPlaying === "intro") isPlaying = true;
      else if (audioState.currentPlaying === "custom" && audioState.currentTrackId === id) isPlaying = true;

      items.push({
        id,
        title,
        subtitle,
        url,
        iconType,
        isPlaying,
      });
    }

    return items;
  };

  const publicAudios = computePublicAudios();
  const isAnyPlaying = audioState.currentPlaying !== "none";

  const handleToggleTrack = (track: PublicAudioItem) => {
    if (track.isPlaying) {
      if (audioState.isPaused) {
        globalAudioManager.resume();
      } else {
        globalAudioManager.pause();
      }
      return;
    }

    if (track.id === "anthem") {
      globalAudioManager.playAnthem(true);
    } else if (track.id === "intro") {
      globalAudioManager.playIntro(true);
    } else {
      const candidateUrl = track.url || AudioConfig.ANTHEM_URL;
      globalAudioManager.playCustomTrack(track.id, candidateUrl, track.title).catch((err) => {
        console.warn(`[SmartAudioMenu] Lecture impossible pour ${track.title}:`, err);
      });
    }
  };

  const renderIcon = (iconType: string, isPlaying: boolean) => {
    switch (iconType) {
      case "hymn":
        return <Music className="w-4 h-4" />;
      case "intro":
        return <RefreshCw className="w-4 h-4" />;
      case "ambient":
        return <Disc className={`w-4 h-4 ${isPlaying && !audioState.isPaused ? "animate-spin-slow" : ""}`} />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Main Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-all z-40 cursor-pointer shadow-md
          ${isOpen ? "bg-afri-bg-sec border-[#D4AF37] text-[#D4AF37]" : "bg-afri-bg-sec border-afri-border text-afri-text-sec hover:text-[#D4AF37] hover:border-[#D4AF37]/40"}
        `}
        title="Centre Audio Impérial"
      >
        {isAnyPlaying ? (
          <div className="relative">
            <Disc className={`w-5 h-5 ${!audioState.isPaused ? "animate-spin-slow text-[#D4AF37]" : "text-afri-text-sec"}`} />
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
            className="absolute top-12 right-0 w-72 sm:w-80 bg-afri-bg-sec border border-afri-border rounded-2xl shadow-2xl overflow-hidden z-50 p-2 space-y-1.5 text-afri-text"
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-afri-border flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                  Centre Audio Impérial
                </span>
              </div>
              <span className="text-[8px] font-mono bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-full border border-[#D4AF37]/20 font-bold uppercase">
                {publicAudios.length} {publicAudios.length > 1 ? "Pistes" : "Piste"}
              </span>
            </div>

            {/* Dynamic Public Tracks List */}
            <div className="max-h-72 overflow-y-auto space-y-1 scrollbar-thin pr-0.5">
              {publicAudios.length === 0 ? (
                <div className="py-6 text-center space-y-1">
                  <Headphones className="w-6 h-6 mx-auto text-afri-text-muted" />
                  <p className="text-[10px] font-mono uppercase text-afri-text-sec">Aucune musique publique disponible</p>
                </div>
              ) : (
                publicAudios.map((track) => {
                  const isTrackActive = track.isPlaying;
                  const isTrackPlayingNow = isTrackActive && !audioState.isPaused;

                  return (
                    <button
                      key={track.id}
                      onClick={() => handleToggleTrack(track)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer group text-left border ${
                        isTrackActive
                          ? "bg-[#D4AF37]/15 border-[#D4AF37]/50 shadow-sm"
                          : "hover:bg-afri-bg-ter border-transparent hover:border-afri-border/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isTrackActive
                              ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40"
                              : "bg-afri-bg-ter text-afri-text-sec group-hover:text-afri-text border border-afri-border/60"
                          }`}
                        >
                          {renderIcon(track.iconType, isTrackActive)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-bold truncate leading-tight ${
                              isTrackActive ? "text-[#D4AF37]" : "text-afri-text group-hover:text-[#D4AF37]"
                            }`}
                            title={track.title}
                          >
                            {track.title}
                          </p>
                          <p className="text-[9px] text-afri-text-sec font-mono truncate mt-0.5">
                            {track.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Play / Pause indicator */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isTrackActive
                            ? "bg-[#D4AF37] text-black shadow-md"
                            : "bg-afri-bg-ter text-afri-text-sec group-hover:text-afri-text group-hover:bg-[#D4AF37]/20 border border-afri-border/50"
                        }`}
                      >
                        {isTrackPlayingNow ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current translate-x-[0.5px]" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Hint */}
            <div className="pt-1.5 px-2 border-t border-afri-border text-center">
              <span className="text-[8px] font-mono text-afri-text-muted uppercase tracking-wider">
                Volume géré par les boutons physiques
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

