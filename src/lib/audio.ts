/**
 * Premium African Musical Synthesizer for AFRIGOMBO ELITE using Web Audio API
 * Fully client-side, offlineable, zero assets required
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      // Create audio context lazily on user interaction or preference trigger
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    // Resume context if suspended (browser security autoplay policies)
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  private isSoundEnabled(): boolean {
    return localStorage.getItem("afrigombo_sounds") !== "false";
  }

  /**
   * Synthesize a discrete, deep wooden African Tam-Tam golpe
   * Uses low-mid frequencies with exponential fast pitch sweep for authentic feel
   */
  public playTamTam(isHigh = false) {
    if (!this.isSoundEnabled()) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      // Pitch sweep settings
      const startFreq = isHigh ? 350 : 180;
      const endFreq = isHigh ? 120 : 65;
      const duration = isHigh ? 0.15 : 0.25;

      osc.type = "sine";
      osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

      // Exponential gain decay (the golpe hit feeling)
      gainNode.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);

      // Brief high-mid punchy noise accent if deep drum
      if (!isHigh) {
        this.playDrumAcc();
      }
    } catch (e) {
      console.warn("Tam-Tam play exception", e);
    }
  }

  private playDrumAcc() {
    if (!this.ctx) return;
    try {
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.03, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 800;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start();
    } catch (e) {}
  }

  /**
   * Synthesize a single clear glass-like string pluck represent of historical Kora harp.
   * Utilizes triangle waveform with fast envelope, high pass filter, and slight delay
   */
  public playKoraNote(freq: number, delayMs = 0, volume = 0.25, duration = 0.6) {
    if (!this.isSoundEnabled()) return;
    setTimeout(() => {
      try {
        this.init();
        if (!this.ctx) return;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        // Standard string pluck spectrum combining Triangle & Sine
        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(freq, this.ctx.currentTime);

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(freq * 2, this.ctx.currentTime); // Second harmonic feedback

        filter.type = "highpass";
        filter.frequency.value = 150;

        // Pluck envelope: zero attack, rapid decay
        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc1.start();
        osc2.start();
        osc1.stop(this.ctx.currentTime + duration);
        osc2.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.warn("Kora play exception", e);
      }
    }, delayMs);
  }

  /**
   * Synthesize a gorgeous pentatonic arpeggio chord representing an ultimate kora victory sweep
   */
  public playKoraSuccess() {
    if (!this.isSoundEnabled()) return;
    // Golden Abidjan Pentatonic chord scale (F4, Bb4, C5, F5, Bb5)
    const notes = [349.23, 466.16, 523.25, 698.46, 932.33];
    notes.forEach((freq, index) => {
      this.playKoraNote(freq, index * 85, 0.18, 0.8);
    });
  }

  /**
   * Synthesize discrete validations with 2 quick consecutive tam-tam notes + 1 kora pitch
   */
  public playValidationSuccess() {
    if (!this.isSoundEnabled()) return;
    this.playTamTam(true);
    setTimeout(() => {
      this.playTamTam(false);
    }, 90);
    setTimeout(() => {
      this.playKoraNote(523.25, 0, 0.15, 0.4); // High C pitch
    }, 180);
  }
}

export const audioSynth = new AudioSynthesizer();
