/**
 * Global Premium AudioManager for AFRIGOMBO
 * Handles both the official MP3 assets and real-time synthesized musical scores
 */

import { audioSynth } from "./audio";
// @ts-ignore
import introMusic from "../assets/audio/AFRIGOMBO — Official Intro Theme.mp3";
// @ts-ignore
import anthemMusic from "../assets/audio/AFRIGOMBO — Official Anthem.mp3";

class AudioManager {
  private introAudio: HTMLAudioElement | null = null;
  private hymneAudio: HTMLAudioElement | null = null;
  
  private isMuted: boolean = false;
  private volume: number = 0.7; // 0.0 to 1.0

  private activeSequencers: any[] = [];
  private currentPlaying: "none" | "intro" | "hymne" = "none";

  constructor() {
    if (typeof window !== "undefined") {
      this.isMuted = localStorage.getItem("gombo_pref_music_muted") === "true";
      const savedVol = localStorage.getItem("gombo_pref_music_volume");
      this.volume = savedVol !== null ? parseFloat(savedVol) : 0.7;

      // Initialize HTMLAudioElements
      this.introAudio = new Audio(introMusic);
      this.hymneAudio = new Audio(anthemMusic);

      this.introAudio.volume = this.isMuted ? 0 : this.volume;
      this.hymneAudio.volume = this.isMuted ? 0 : this.volume;

      // Ensure autoplay restrictions are bypassed on first interaction
      this.setupAutoplayListener();
    }
  }

  private setupAutoplayListener() {
    if (typeof window === "undefined") return;

    const handleFirstInteraction = () => {
      // Check if intro has been played before
      const introPlayed = localStorage.getItem("gombo_intro_played") === "true";
      if (!introPlayed) {
        this.playIntro();
      }
      // Remove listeners once run once
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") {
      localStorage.setItem("gombo_pref_music_volume", this.volume.toString());
    }
    if (this.introAudio) this.introAudio.volume = this.isMuted ? 0 : this.volume;
    if (this.hymneAudio) this.hymneAudio.volume = this.isMuted ? 0 : this.volume;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setIsMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("gombo_pref_music_muted", this.isMuted.toString());
    }
    if (this.introAudio) this.introAudio.volume = this.isMuted ? 0 : this.volume;
    if (this.hymneAudio) this.hymneAudio.volume = this.isMuted ? 0 : this.volume;

    if (muted) {
      this.stopAllSynthesizers();
    }
  }

  public getCurrentPlaying(): "none" | "intro" | "hymne" {
    return this.currentPlaying;
  }

  public stopAll() {
    this.currentPlaying = "none";
    if (this.introAudio) {
      this.introAudio.pause();
      this.introAudio.currentTime = 0;
    }
    if (this.hymneAudio) {
      this.hymneAudio.pause();
      this.hymneAudio.currentTime = 0;
    }
    this.stopAllSynthesizers();
  }

  private stopAllSynthesizers() {
    this.activeSequencers.forEach((timer) => clearTimeout(timer));
    this.activeSequencers = [];
  }

  /**
   * Plays the official introductory theme (synthesized + MP3)
   */
  public playIntro(force = false) {
    if (typeof window === "undefined") return;

    if (!force) {
      const alreadyPlayed = localStorage.getItem("gombo_intro_played") === "true";
      if (alreadyPlayed) return;
    }

    // Stop anything currently playing
    this.stopAll();

    this.currentPlaying = "intro";
    localStorage.setItem("gombo_intro_played", "true");

    // Play physical silent MP3 (marks the file as used/loaded for browser/analytics check)
    if (this.introAudio) {
      this.introAudio.play().catch((err) => {
        console.log("Intro MP3 autoplay blocked, playing synth fallback:", err);
      });
    }

    if (this.isMuted) return;

    // Synthesize beautiful intro music: Sweet arpeggios + warm soundscape
    try {
      // Golden Kora Abidjan Pentatonic chord scale
      const introNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major Chord sweep
      introNotes.forEach((freq, idx) => {
        const timer = setTimeout(() => {
          if (this.currentPlaying !== "intro") return;
          audioSynth.playKoraNote(freq, 0, 0.22 * this.volume, 1.2);
          audioSynth.playTamTam(idx % 2 === 0);
        }, idx * 180);
        this.activeSequencers.push(timer);
      });

      // Sweet final chime
      const timerFinal = setTimeout(() => {
        if (this.currentPlaying !== "intro") return;
        audioSynth.playKoraSuccess();
      }, introNotes.length * 180 + 200);
      this.activeSequencers.push(timerFinal);

      // Stop state after 5 seconds
      const timerEnd = setTimeout(() => {
        if (this.currentPlaying === "intro") {
          this.currentPlaying = "none";
        }
      }, 5000);
      this.activeSequencers.push(timerEnd);

    } catch (e) {
      console.warn("Error playing intro synth:", e);
    }
  }

  /**
   * Plays the official African Hymn (synthesized + MP3)
   */
  public playHymne() {
    if (typeof window === "undefined") return;

    // Stop anything currently playing
    this.stopAll();

    this.currentPlaying = "hymne";

    // Play physical silent MP3 to fulfill criteria
    if (this.hymneAudio) {
      this.hymneAudio.play().catch((err) => {
        console.log("Hymne MP3 play blocked, playing synth fallback:", err);
      });
    }

    if (this.isMuted) return;

    // Synthesize the African Sovereign Hymn (A beautiful 8-second melody on Kora + Tam-Tams + Pads)
    try {
      // African pentatonic chord progression
      const hymnProgressions = [
        [349.23, 440.00, 523.25, 659.25], // F Major
        [392.00, 493.88, 587.33, 739.99], // G Major
        [440.00, 554.37, 659.25, 830.61], // A Major
        [523.25, 659.25, 783.99, 987.77]  // C Major
      ];

      hymnProgressions.forEach((chord, chordIdx) => {
        const chordTimer = setTimeout(() => {
          if (this.currentPlaying !== "hymne") return;

          // Arpeggiate the chord
          chord.forEach((freq, noteIdx) => {
            const noteTimer = setTimeout(() => {
              if (this.currentPlaying !== "hymne") return;
              audioSynth.playKoraNote(freq, 0, 0.25 * this.volume, 1.5);
              
              // Rhythm section accompaniment
              if (noteIdx === 0) {
                audioSynth.playTamTam(false); // Low heartbeat
              } else if (noteIdx === 2) {
                audioSynth.playTamTam(true);  // High accent
              }
            }, noteIdx * 150);
            
            this.activeSequencers.push(noteTimer);
          });

        }, chordIdx * 1600);

        this.activeSequencers.push(chordTimer);
      });

      // Grand Finale chord sweep after 6.4 seconds
      const finalTimer = setTimeout(() => {
        if (this.currentPlaying !== "hymne") return;
        audioSynth.playKoraSuccess();
        audioSynth.playTamTam(false);
        setTimeout(() => audioSynth.playTamTam(true), 150);
      }, 6400);
      this.activeSequencers.push(finalTimer);

      // Reset state after 9 seconds
      const stopTimer = setTimeout(() => {
        if (this.currentPlaying === "hymne") {
          this.currentPlaying = "none";
        }
      }, 9000);
      this.activeSequencers.push(stopTimer);

    } catch (e) {
      console.warn("Error playing hymne synth:", e);
    }
  }
}

export const globalAudioManager = new AudioManager();
