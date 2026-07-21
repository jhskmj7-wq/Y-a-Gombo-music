/**
 * Global Premium AudioManager for AFRIGOMBO
 * Strictly uses real audio files (MP3, OGG, WAV).
 * Validates URLs to ensure they are playable audio files.
 */

import { db } from "../firebase";
import { collection, onSnapshot, query, limit } from "firebase/firestore";

// Official GitHub Assets Configuration
export const AudioConfig = {
  // Replace these URLs with the actual public raw GitHub links when available
  INTRO_URL: "https://raw.githubusercontent.com/AFRIGOMBO/assets/main/audio/intro-officielle.mp3",
  HYMN_URL: "https://raw.githubusercontent.com/AFRIGOMBO/assets/main/audio/hymne-afrigombo-officiel.mp3",
  BASE_UI_SOUNDS: "https://raw.githubusercontent.com/AFRIGOMBO/assets/main/audio/ui/"
};

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal
    }).catch(() => {
        return fetch(url, { 
          method: 'GET', 
          headers: { 'Range': 'bytes=0-0' },
          signal: controller.signal
        });
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const contentType = response.headers.get('Content-Type');
      return !!(contentType && (contentType.startsWith('audio/') || contentType.startsWith('video/')));
    }
  } catch (e) {
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
    const cacheName = "afrigombo-audio-cache-v2";
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(url);

    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      return URL.createObjectURL(blob);
    }

    const response = await fetch(url);
    if (!response.ok) return url;

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
  progress?: number;
  duration?: number;
};

class AudioManager {
  private isMuted: boolean = false;
  private volume: number = 0.7;
  private currentPlaying: "none" | "intro" | "hymne" | "custom" = "none";
  private isPaused: boolean = false;
  private currentTrackId: string | null = null;

  private mediaElements: Record<string, HTMLAudioElement> = {};
  private listeners: ((state: AudioState) => void)[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      this.isMuted = safeGetItem("gombo_pref_music_muted") === "true";
      const savedVol = safeGetItem("gombo_pref_music_volume");
      this.volume = savedVol !== "" ? parseFloat(savedVol) : 0.7;

      this.initializeAudioSystem();
    }
  }

  private notify() {
    const activeId = this.getActiveElementId();
    const activeEl = activeId ? this.mediaElements[activeId] : null;

    const state: AudioState = {
      currentPlaying: this.currentPlaying,
      isPaused: this.isPaused,
      currentTrackId: this.currentTrackId,
      volume: this.volume,
      isMuted: this.isMuted,
      progress: activeEl ? activeEl.currentTime : 0,
      duration: activeEl ? (isNaN(activeEl.duration) ? 0 : activeEl.duration) : 0
    };
    this.listeners.forEach(l => l(state));
  }

  private getActiveElementId(): string | null {
    if (this.currentPlaying === "intro") return "intro";
    if (this.currentPlaying === "hymne") return "hymn";
    if (this.currentPlaying === "custom") return this.currentTrackId;
    return null;
  }

  public subscribe(listener: (state: AudioState) => void) {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private async initializeAudioSystem() {
    // Pre-cache official tracks
    this.loadAudio("intro", AudioConfig.INTRO_URL, false, 0.8);
    this.loadAudio("hymn", AudioConfig.HYMN_URL, true, 0.7);
  }

  private async loadAudio(id: string, url: string, loop: boolean, relativeVolume: number) {
    if (this.mediaElements[id]) {
      const el = this.mediaElements[id];
      if (el.src.includes(url) || url.includes(el.src)) return el;
    }

    try {
      const cachedUrl = await getCachedAudioUrl(url);
      const audioObj = new Audio(cachedUrl);
      audioObj.loop = loop;
      audioObj.volume = (this.isMuted ? 0 : this.volume) * relativeVolume;
      
      audioObj.onended = () => {
        if (this.currentPlaying === id || (id === "hymn" && this.currentPlaying === "hymne")) {
          this.currentPlaying = "none";
          this.isPaused = false;
          this.notify();
        }
      };

      audioObj.ontimeupdate = () => this.notify();

      this.mediaElements[id] = audioObj;
      return audioObj;
    } catch (err) {
      console.warn(`Failed to load audio ${id}:`, err);
      return null;
    }
  }

  public getVolume(): number { return this.volume; }
  public getIsMuted(): boolean { return this.isMuted; }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    safeSetItem("gombo_pref_music_volume", this.volume.toString());
    Object.values(this.mediaElements).forEach((audio) => {
      audio.volume = (this.isMuted ? 0 : this.volume);
    });
    this.notify();
  }

  public setIsMuted(muted: boolean) {
    this.isMuted = muted;
    safeSetItem("gombo_pref_music_muted", this.isMuted.toString());
    Object.values(this.mediaElements).forEach((audio) => {
      audio.volume = (this.isMuted ? 0 : this.volume);
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
    const activeId = this.getActiveElementId();
    if (activeId && this.mediaElements[activeId]) {
      this.mediaElements[activeId].pause();
      this.isPaused = true;
      this.notify();
    }
  }

  public resume() {
    const activeId = this.getActiveElementId();
    if (activeId && this.mediaElements[activeId]) {
      this.mediaElements[activeId].play().catch(() => {});
      this.isPaused = false;
      this.notify();
    }
  }

  public async playIntro(force = false) {
    if (typeof window === "undefined") return;
    if (!force && safeGetItem("gombo_intro_played_v2") === "true") return;

    this.stop();
    this.currentPlaying = "intro";
    this.isPaused = false;
    safeSetItem("gombo_intro_played_v2", "true");
    
    const audio = await this.loadAudio("intro", AudioConfig.INTRO_URL, false, 0.8);
    if (audio) {
      audio.play().catch(() => {
        console.warn("L'audio officiel est momentanément indisponible.");
      });
    }
    this.notify();
  }

  public async playHymn() {
    if (typeof window === "undefined") return;
    
    // If already playing or paused, toggle
    if (this.currentPlaying === "hymne") {
      if (this.isPaused) this.resume();
      else this.pause();
      return;
    }

    this.stop();
    this.currentPlaying = "hymne";
    this.isPaused = false;
    const audio = await this.loadAudio("hymn", AudioConfig.HYMN_URL, true, 0.7);
    if (audio) {
      audio.play().catch(() => {
        console.warn("L'hymne officiel est momentanément indisponible.");
      });
    }
    this.notify();
  }

  public async playCustomTrack(id: string, url: string, title?: string) {
    this.stop();
    this.currentPlaying = "custom";
    this.currentTrackId = id;
    this.isPaused = false;
    
    const audio = await this.loadAudio(id, url, true, 1.0);
    if (audio) {
      await audio.play().catch((err) => {
        console.warn(`L'audio personnalisé ${title || id} est momentanément indisponible:`, err);
        throw new Error("Le fichier audio officiel est momentanément indisponible.");
      });
    }
    this.notify();
  }

  public seek(seconds: number) {
    const activeId = this.getActiveElementId();
    if (activeId && this.mediaElements[activeId]) {
      this.mediaElements[activeId].currentTime = seconds;
      this.notify();
    }
  }

  public getState(): AudioState {
    const activeId = this.getActiveElementId();
    const activeEl = activeId ? this.mediaElements[activeId] : null;
    return {
      currentPlaying: this.currentPlaying,
      isPaused: this.isPaused,
      currentTrackId: this.currentTrackId,
      volume: this.volume,
      isMuted: this.isMuted,
      progress: activeEl ? activeEl.currentTime : 0,
      duration: activeEl ? (isNaN(activeEl.duration) ? 0 : activeEl.duration) : 0
    };
  }
}

export const globalAudioManager = new AudioManager();

