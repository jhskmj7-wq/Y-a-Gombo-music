/**
 * Global Premium AudioManager for AFRIGOMBO
 * Strictly uses real audio files (MP3, OGG, WAV).
 * Validates URLs to ensure they are playable audio files.
 */

import { db } from "../firebase";
import { collection, onSnapshot, query, limit } from "firebase/firestore";

// Official local paths (from public folder)
const introAsset = "/audio/intro.mp3";
const anthemAsset = "/audio/hymne-afrigombo.mp3";

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
 * Validates if a URL is likely to be a direct audio file.
 */
export async function isDirectAudioFile(url: string): Promise<boolean> {
  if (!url) return false;
  
  // Basic extension check
  const audioExtensions = ['.mp3', '.ogg', '.wav', '.m4a', '.aac', '.mp4'];
  const hasAudioExtension = audioExtensions.some(ext => url.toLowerCase().includes(ext));
  
  if (hasAudioExtension) return true;

  try {
    // Try to check Content-Type via fetch
    // We use a AbortController to timeout quickly
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal
    }).catch(() => {
        // Fallback to GET if HEAD is not allowed
        return fetch(url, { 
          method: 'GET', 
          headers: { 'Range': 'bytes=0-0' },
          signal: controller.signal
        });
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const contentType = response.headers.get('Content-Type');
      if (contentType && (contentType.startsWith('audio/') || contentType.startsWith('video/'))) {
        return true;
      }
      // If it's text/html, it's definitely not a direct audio file
      if (contentType && contentType.includes('text/html')) {
        return false;
      }
    }
  } catch (e) {
    console.warn("Direct audio check failed (likely CORS):", e);
    // If fetch fails (CORS), we have to rely on extension
    return hasAudioExtension;
  }

  return false;
}

/**
 * Intelligent client-side caching using the standard Cache Storage API.
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
      const blob = await cachedResponse.blob();
      return URL.createObjectURL(blob);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download audio file: ${response.statusText}`);
    }

    await cache.put(url, response.clone());
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    return url; 
  }
}

export type AudioState = {
  currentPlaying: "none" | "intro" | "hymne" | "custom";
  isPaused: boolean;
  currentTrackId: string | null;
  volume: number;
  isMuted: boolean;
};

class AudioManager {
  private isMuted: boolean = false;
  private volume: number = 0.7;
  private currentPlaying: "none" | "intro" | "hymne" | "custom" = "none";
  private isPaused: boolean = false;
  private currentTrackId: string | null = null;

  private mediaElements: Record<string, HTMLAudioElement> = {};
  private mediaData: Record<string, any> = {};
  private listeners: ((state: AudioState) => void)[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      this.isMuted = safeGetItem("gombo_pref_music_muted") === "true";
      const savedVol = safeGetItem("gombo_pref_music_volume");
      this.volume = savedVol !== "" ? parseFloat(savedVol) : 0.7;

      this.initializeMediaSync();
    }
  }

  private notify() {
    const state: AudioState = {
      currentPlaying: this.currentPlaying,
      isPaused: this.isPaused,
      currentTrackId: this.currentTrackId,
      volume: this.volume,
      isMuted: this.isMuted
    };
    this.listeners.forEach(l => l(state));
  }

  public subscribe(listener: (state: AudioState) => void) {
    this.listeners.push(listener);
    // Initial call
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private initializeMediaSync() {
    // Load local defaults first
    this.loadAudio("intro", introAsset, false, 0.8);
    this.loadAudio("anthem", anthemAsset, true, 0.7);

    try {
      // Sync official media (intro, anthem) from Firestore (overwrites local if exists)
      const mediaCollection = collection(db, "media");
      onSnapshot(mediaCollection, (snapshot) => {
        snapshot.forEach(async (doc) => {
          const data = doc.data();
          const id = doc.id; 
          this.mediaData[id] = data;

          if (data.downloadURL && await isDirectAudioFile(data.downloadURL)) {
            this.loadAudio(id, data.downloadURL, !!data.loop, data.volume ?? 1);
          }
        });
      });
    } catch (err) {
      console.error("AudioManager sync failed:", err);
    }
  }

  private async loadAudio(id: string, url: string, loop: boolean, relativeVolume: number) {
    const currentAudio = this.mediaElements[id];
    if (currentAudio && currentAudio.src === url) {
      currentAudio.loop = loop;
      currentAudio.volume = (this.isMuted ? 0 : this.volume) * relativeVolume;
      return;
    }

    if (currentAudio) {
      try { currentAudio.pause(); } catch (_) {}
    }

    try {
      const cachedUrl = await getCachedAudioUrl(url);
      const audioObj = new Audio(cachedUrl);
      audioObj.loop = loop;
      audioObj.volume = (this.isMuted ? 0 : this.volume) * relativeVolume;
      audioObj.onended = () => {
        if (this.currentPlaying === id) {
          this.currentPlaying = "none";
          this.isPaused = false;
          this.notify();
        }
      };
      this.mediaElements[id] = audioObj;
    } catch (err) {
      const audioObj = new Audio(url);
      audioObj.loop = loop;
      audioObj.volume = (this.isMuted ? 0 : this.volume) * relativeVolume;
      this.mediaElements[id] = audioObj;
    }
  }

  public getVolume(): number { return this.volume; }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    safeSetItem("gombo_pref_music_volume", this.volume.toString());
    Object.entries(this.mediaElements).forEach(([id, audio]) => {
      const itemVol = this.mediaData[id]?.volume ?? 1;
      audio.volume = (this.isMuted ? 0 : this.volume) * itemVol;
    });
    this.notify();
  }

  public getIsMuted(): boolean { return this.isMuted; }

  public setIsMuted(muted: boolean) {
    this.isMuted = muted;
    safeSetItem("gombo_pref_music_muted", this.isMuted.toString());
    Object.entries(this.mediaElements).forEach(([id, audio]) => {
      const itemVol = this.mediaData[id]?.volume ?? 1;
      audio.volume = (this.isMuted ? 0 : this.volume) * itemVol;
    });
    this.notify();
  }

  public stop() {
    this.currentPlaying = "none";
    this.currentTrackId = null;
    this.isPaused = false;
    Object.values(this.mediaElements).forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (_) {}
    });
    this.notify();
  }

  public pause() {
    Object.values(this.mediaElements).forEach(audio => {
      if (!audio.paused) audio.pause();
    });
    this.isPaused = true;
    this.notify();
  }

  public resume() {
    if (this.currentPlaying !== "none") {
      const id = this.currentPlaying === "hymne" ? "anthem" : 
                 this.currentPlaying === "intro" ? "intro" : 
                 this.currentTrackId;
      if (id && this.mediaElements[id]) {
        this.mediaElements[id].play().catch(() => {});
        this.isPaused = false;
        this.notify();
      }
    }
  }

  public playIntro(force = false) {
    if (typeof window === "undefined") return;
    if (!force && safeGetItem("gombo_intro_played") === "true") return;

    this.stop();
    this.currentPlaying = "intro";
    this.isPaused = false;
    safeSetItem("gombo_intro_played", "true");
    
    const audio = this.mediaElements["intro"];
    if (audio) {
      audio.play().catch(e => console.warn("Intro play failed:", e));
    }
    this.notify();
  }

  public playHymn() {
    if (typeof window === "undefined") return;
    this.stop();
    this.currentPlaying = "hymne";
    this.isPaused = false;
    const audio = this.mediaElements["anthem"];
    if (audio) {
      audio.play().catch(e => console.warn("Hymn play failed:", e));
    }
    this.notify();
  }

  public async playCustomTrack(id: string, url: string, title: string) {
    if (typeof window === "undefined") return;
    
    if (!(await isDirectAudioFile(url))) {
      throw new Error("L'URL fournie n'est pas un fichier audio direct (MP3, OGG, WAV).");
    }

    this.stop();
    this.currentPlaying = "custom";
    this.currentTrackId = id;
    this.isPaused = false;

    await this.loadAudio(id, url, false, 1);
    const audio = this.mediaElements[id];
    if (audio) {
      audio.play().catch(e => console.error("Custom track play failed:", e));
    }
    this.notify();
  }

  public getState(): AudioState {
    return {
      currentPlaying: this.currentPlaying,
      isPaused: this.isPaused,
      currentTrackId: this.currentTrackId,
      volume: this.volume,
      isMuted: this.isMuted
    };
  }
}

export const globalAudioManager = new AudioManager();
