/**
 * Global Premium AudioManager for AFRIGOMBO
 * Strictly uses Firebase Firestore for dynamic configuration and public audio URLs.
 * Zero local/synthetic music generation. Perfect real-time remote configuration synchronization.
 */

import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

const safeGetItem = (key: string, fallback: string = ""): string => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (e) {
    return fallback;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // ignore
  }
};

/**
 * Intelligent client-side caching using the standard Cache Storage API.
 * Intercepts network queries for media files, downloads and persists them locally,
 * and streams them using direct Blob memory URLs to eliminate repetitive loading times.
 */
export async function getCachedAudioUrl(url: string): Promise<string> {
  if (!url) return "";
  try {
    if (typeof window === "undefined" || !("caches" in window)) {
      return url;
    }
    const cacheName = "afrigombo-audio-cache";
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(url);

    if (cachedResponse) {
      console.log(`[AUDIO CACHE] Cache HIT for URL: ${url}`);
      const blob = await cachedResponse.blob();
      return URL.createObjectURL(blob);
    }

    console.log(`[AUDIO CACHE] Cache MISS for URL: ${url}. Downloading and persisting...`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download audio file: ${response.statusText}`);
    }

    // Put a clone of the response in the cache
    await cache.put(url, response.clone());

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.warn(`[AUDIO CACHE] Cache operation failed for ${url}:`, error);
    return url; // Safe fallback
  }
}

class AudioManager {
  private isMuted: boolean = false;
  private volume: number = 0.7; // 0.0 to 1.0
  private currentPlaying: "none" | "intro" | "hymne" = "none";

  private mediaElements: Record<string, HTMLAudioElement> = {};
  private mediaData: Record<string, any> = {};

  constructor() {
    if (typeof window !== "undefined") {
      this.isMuted = safeGetItem("gombo_pref_music_muted") === "true";
      const savedVol = safeGetItem("gombo_pref_music_volume");
      this.volume = savedVol !== "" ? parseFloat(savedVol) : 0.7;

      // Subscribe to real-time system media configuration in Firestore
      this.initializeMediaSync();
    }
  }

  private initializeMediaSync() {
    try {
      const mediaCollection = collection(db, "media");
      onSnapshot(
        mediaCollection,
        (snapshot) => {
          snapshot.forEach(async (doc) => {
            const data = doc.data();
            const id = doc.id; // "intro" or "anthem"
            this.mediaData[id] = data;

            if (data.downloadURL) {
              const currentAudio = this.mediaElements[id];
              // If the URL has changed or the Audio object hasn't been instantiated yet
              if (!currentAudio || currentAudio.src !== data.downloadURL) {
                if (currentAudio) {
                  try {
                    currentAudio.pause();
                  } catch (_) {}
                }

                try {
                  const cachedUrl = await getCachedAudioUrl(data.downloadURL);
                  const audioObj = new Audio(cachedUrl);
                  audioObj.loop = !!data.loop;
                  audioObj.volume = (this.isMuted ? 0 : this.volume) * (data.volume !== undefined ? data.volume : 1);
                  
                  // Track ending to reset current playing status
                  audioObj.onended = () => {
                    if (this.currentPlaying === id || (id === "anthem" && this.currentPlaying === "hymne")) {
                      this.currentPlaying = "none";
                    }
                  };

                  this.mediaElements[id] = audioObj;
                } catch (err) {
                  console.warn(`[AUDIO CACHE] Fallback to direct stream for ${id}:`, err);
                  const audioObj = new Audio(data.downloadURL);
                  audioObj.loop = !!data.loop;
                  audioObj.volume = (this.isMuted ? 0 : this.volume) * (data.volume !== undefined ? data.volume : 1);
                  audioObj.onended = () => {
                    if (this.currentPlaying === id || (id === "anthem" && this.currentPlaying === "hymne")) {
                      this.currentPlaying = "none";
                    }
                  };
                  this.mediaElements[id] = audioObj;
                }
              } else {
                // Update volume and loop properties dynamically
                currentAudio.loop = !!data.loop;
                currentAudio.volume = (this.isMuted ? 0 : this.volume) * (data.volume !== undefined ? data.volume : 1);
              }
            } else {
              // If the URL was removed, clean up
              if (this.mediaElements[id]) {
                try {
                  this.mediaElements[id].pause();
                } catch (_) {}
                delete this.mediaElements[id];
              }
            }
          });
        },
        (error) => {
          console.warn("Unable to subscribe to real-time system_media:", error);
        }
      );
    } catch (err) {
      console.error("Firestore system_media collection subscription failed:", err);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") {
      safeSetItem("gombo_pref_music_volume", this.volume.toString());
    }
    // Propagate volume change to all active media assets
    Object.entries(this.mediaElements).forEach(([id, audio]) => {
      const data = this.mediaData[id];
      const itemVol = data?.volume !== undefined ? data.volume : 1;
      audio.volume = (this.isMuted ? 0 : this.volume) * itemVol;
    });
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setIsMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      safeSetItem("gombo_pref_music_muted", this.isMuted.toString());
    }
    // Propagate mute state
    Object.entries(this.mediaElements).forEach(([id, audio]) => {
      const data = this.mediaData[id];
      const itemVol = data?.volume !== undefined ? data.volume : 1;
      audio.volume = (this.isMuted ? 0 : this.volume) * itemVol;
    });
  }

  public getCurrentPlaying(): "none" | "intro" | "hymne" {
    return this.currentPlaying;
  }

  public stopAll() {
    this.currentPlaying = "none";
    Object.values(this.mediaElements).forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (_) {}
    });
  }

  public playSound(id: string, force = false) {
    if (typeof window === "undefined") return;

    const audio = this.mediaElements[id];
    const data = this.mediaData[id];

    if (audio && (!data || data.enabled !== false)) {
      audio.currentTime = 0;
      const itemVol = data?.volume !== undefined ? data.volume : 1;
      audio.volume = (this.isMuted ? 0 : this.volume) * itemVol;
      audio.play().catch((err) => {
        console.warn(`Playback blocked or failed for ${id}:`, err);
      });
    } else {
      console.info(`Media for ${id} is not loaded or has been disabled in the Multimedia Center`);
    }
  }

  public stopSound(id: string) {
    if (typeof window === "undefined") return;
    const audio = this.mediaElements[id];
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (_) {}
    }
  }

  public playIntro(force = false) {
    if (typeof window === "undefined") return;

    if (!force) {
      const alreadyPlayed = safeGetItem("gombo_intro_played") === "true";
      if (alreadyPlayed) return;
    }

    this.stopAll();
    this.currentPlaying = "intro";
    safeSetItem("gombo_intro_played", "true");
    this.playSound("intro", force);
  }

  public playHymne() {
    if (typeof window === "undefined") return;

    this.stopAll();
    this.currentPlaying = "hymne";
    this.playSound("anthem", true);
  }
}

export const globalAudioManager = new AudioManager();
