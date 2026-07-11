/**
 * Global Premium AudioManager for AFRIGOMBO
 * Strictly uses Firebase Firestore for dynamic configuration and public audio URLs.
 * Zero local/synthetic music generation. Perfect real-time remote configuration synchronization.
 */

import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

class AudioManager {
  private isMuted: boolean = false;
  private volume: number = 0.7; // 0.0 to 1.0
  private currentPlaying: "none" | "intro" | "hymne" = "none";

  private mediaElements: Record<string, HTMLAudioElement> = {};
  private mediaData: Record<string, any> = {};

  constructor() {
    if (typeof window !== "undefined") {
      this.isMuted = localStorage.getItem("gombo_pref_music_muted") === "true";
      const savedVol = localStorage.getItem("gombo_pref_music_volume");
      this.volume = savedVol !== null ? parseFloat(savedVol) : 0.7;

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
          snapshot.forEach((doc) => {
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
                const audioObj = new Audio(data.downloadURL);
                audioObj.loop = !!data.loop;
                audioObj.volume = (this.isMuted ? 0 : this.volume) * (data.volume !== undefined ? data.volume : 1);
                
                // Track ending to reset current playing status
                audioObj.onended = () => {
                  if (this.currentPlaying === id || (id === "anthem" && this.currentPlaying === "hymne")) {
                    this.currentPlaying = "none";
                  }
                };

                this.mediaElements[id] = audioObj;
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
      localStorage.setItem("gombo_pref_music_volume", this.volume.toString());
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
      localStorage.setItem("gombo_pref_music_muted", this.isMuted.toString());
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
      const alreadyPlayed = localStorage.getItem("gombo_intro_played") === "true";
      if (alreadyPlayed) return;
    }

    this.stopAll();
    this.currentPlaying = "intro";
    localStorage.setItem("gombo_intro_played", "true");
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
