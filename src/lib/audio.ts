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
    return localStorage.getItem("gombo_pref_ui_sounds") !== "false";
  }

  private isAmbientEnabled(): boolean {
    return localStorage.getItem("gombo_pref_ambient_music") !== "false";
  }

  private getVolume(): number {
    const vol = parseInt(localStorage.getItem("gombo_pref_volume") || "70");
    return vol / 100;
  }

  private ambientTimer: any = null;
  private atmosphereState: "idle" | "playing" = "idle";
  private wasPlayingBeforeHide: boolean = false;
  private beatCounter: number = 0;
  private isListenerSetup: boolean = false;

  private setupVisibilityListener() {
    if (typeof document === "undefined" || this.isListenerSetup) return;
    this.isListenerSetup = true;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (this.atmosphereState === "playing") {
          this.stopAmbientLoop();
          this.wasPlayingBeforeHide = true;
        }
      } else {
        if (this.wasPlayingBeforeHide) {
          this.startAmbientLoop();
          this.wasPlayingBeforeHide = false;
        }
      }
    });
  }

  public startAmbientLoop() {
    if (!this.isAmbientEnabled()) return;
    this.init();
    if (!this.ctx) return;
    if (this.atmosphereState === "playing") return;
    
    this.setupVisibilityListener();
    this.atmosphereState = "playing";
    this.beatCounter = 0;

    const playCycle = () => {
      if (!this.ctx || this.atmosphereState !== "playing") return;
      if (!this.isAmbientEnabled()) {
        this.stopAmbientLoop();
        return;
      }

      try {
        // Pentatonic Scale (Eb Minor Pentatonic for a Jazzy/Soulful vibe)
        const scale = [155.56, 185.00, 207.65, 233.08, 277.18, 311.13]; 
        const masterVol = this.getVolume();
        
        // 1. DYNAMIC RHYTHM (8th Note Resolution for more "Life")
        this.playDanceableBeat(this.beatCounter, masterVol);

        // 2. RHYTHMIC PIANO COMPING
        if (this.beatCounter % 8 === 0 || (this.beatCounter % 8 === 3 && Math.random() > 0.5)) {
          // Play a rhythmic chord (Comping style)
          const velocities = [0.1, 0.08, 0.07];
          [0, 2, 4].forEach((offset, i) => {
            const freq = scale[offset] * 2;
            this.playAmbientPiano(freq, velocities[i] * masterVol, 1.5);
          });
        } else if (this.beatCounter % 2 !== 0 && Math.random() > 0.8) {
          // Occasional melodic stabs
          const freq = scale[Math.floor(Math.random() * scale.length)] * 2;
          this.playAmbientPiano(freq, 0.05 * masterVol, 0.8);
        }

        // 3. EXPRESSIVE SAXOPHONE (Soulful phrasings)
        // Only solo occasionally to keep it "alive" without being cluttered
        if (this.beatCounter % 16 === 4 || (this.beatCounter % 8 === 6 && Math.random() > 0.7)) {
          const saxIdx = Math.floor(Math.random() * scale.length);
          const octave = Math.random() > 0.5 ? 2 : 1;
          const saxFreq = scale[saxIdx] * octave;
          this.playSaxophone(saxFreq, 0.08 * masterVol, 2.0);
        }

        // 4. WALKING BASSLINE
        if (this.beatCounter % 2 === 0) {
          const bassPattern = [0, 2, 3, 2];
          const bassFreq = scale[bassPattern[(this.beatCounter / 2) % bassPattern.length]] / 2;
          this.playAmbientPad(bassFreq, 0.1 * masterVol, 0.4);
        }

        this.beatCounter++;
        
        // Higher resolution: 250ms = 120 BPM (8th notes)
        const nextTime = 250; 
        this.ambientTimer = setTimeout(playCycle, nextTime);
      } catch (e) {
        console.warn("Atmosphere generation error", e);
      }
    };

    playCycle();
  }

  public stopAmbientLoop() {
    this.atmosphereState = "idle";
    if (this.ambientTimer) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
  }

  private playAmbientPiano(freq: number, volume: number, duration: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "triangle";
    osc2.type = "sine";
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(freq * 2.001, this.ctx.currentTime); 

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1500, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + duration);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc2.start();
    osc.stop(this.ctx.currentTime + duration);
    osc2.stop(this.ctx.currentTime + duration);
  }

  private playSaxophone(freq: number, volume: number, duration: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const noise = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // Warmth & Breath
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    noise.loop = true;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0.005;

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.Q.value = 8;

    lfo.type = "sine";
    lfo.frequency.value = 4.8;
    lfoGain.gain.value = 4;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 1.5);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

    osc.connect(filter);
    noise.connect(noiseGain);
    noiseGain.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start();
    osc.start();
    noise.start();
    osc.stop(this.ctx.currentTime + duration);
    lfo.stop(this.ctx.currentTime + duration);
    noise.stop(this.ctx.currentTime + duration);
  }

  private playAmbientPad(freq: number, volume: number, duration: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    filter.type = "lowpass";
    filter.frequency.value = 300;

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 3.0);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private playDanceableBeat(tick: number, masterVol: number) {
    if (!this.ctx) return;

    // 1. KICK (On the 1 and 3 - relative to 4/4 time in 8th notes)
    if (tick % 4 === 0) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.frequency.setValueAtTime(65, this.ctx.currentTime);
      kickOsc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      kickGain.gain.setValueAtTime(0.12 * masterVol, this.ctx.currentTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      kickOsc.connect(kickGain);
      kickGain.connect(this.ctx.destination);
      kickOsc.start();
      kickOsc.stop(this.ctx.currentTime + 0.15);
    }

    // 2. SNARE / RIM (On the 2 and 4)
    if (tick % 8 === 4) {
      const snareOsc = this.ctx.createOscillator();
      const snareGain = this.ctx.createGain();
      snareOsc.type = "triangle";
      snareOsc.frequency.setValueAtTime(180, this.ctx.currentTime);
      snareGain.gain.setValueAtTime(0.08 * masterVol, this.ctx.currentTime);
      snareGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      snareOsc.connect(snareGain);
      snareGain.connect(this.ctx.destination);
      snareOsc.start();
      snareOsc.stop(this.ctx.currentTime + 0.1);
    }

    // 3. RIMSHOT / WOODBLOCK (Syncopated "Jazz" hits)
    if ((tick % 8 === 3 && Math.random() > 0.4) || tick % 8 === 7) {
      const rimOsc = this.ctx.createOscillator();
      const rimGain = this.ctx.createGain();
      rimOsc.type = "sine";
      rimOsc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      rimOsc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);
      rimGain.gain.setValueAtTime(0.03 * masterVol, this.ctx.currentTime);
      rimGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      rimOsc.connect(rimGain);
      rimGain.connect(this.ctx.destination);
      rimOsc.start();
      rimOsc.stop(this.ctx.currentTime + 0.05);
    }

    // 4. HI-HAT (Steady heartbeat with slight swing feel)
    const hihatVol = tick % 2 === 0 ? 0.02 : 0.01;
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 10000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(hihatVol * masterVol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  public playTamTam(isHigh = false) {
    if (!this.isSoundEnabled()) return;
    try {
      this.init();
      if (!this.ctx) return;

      const masterVol = this.getVolume();
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      const startFreq = isHigh ? 350 : 180;
      const endFreq = isHigh ? 120 : 65;
      const duration = isHigh ? 0.15 : 0.25;

      osc.type = "sine";
      osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

      gainNode.gain.setValueAtTime(0.4 * masterVol, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);

      if (!isHigh) {
        this.playDrumAcc(masterVol);
      }
    } catch (e) {
      console.warn("Tam-Tam play exception", e);
    }
  }

  private playDrumAcc(masterVol: number) {
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
      noiseGain.gain.setValueAtTime(0.08 * masterVol, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start();
    } catch (e) {}
  }

  public playKoraNote(freq: number, delayMs = 0, volume = 0.25, duration = 0.6) {
    if (!this.isSoundEnabled()) return;
    setTimeout(() => {
      try {
        this.init();
        if (!this.ctx) return;

        const masterVol = this.getVolume();
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(freq, this.ctx.currentTime);

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(freq * 2, this.ctx.currentTime);

        filter.type = "highpass";
        filter.frequency.value = 150;

        gainNode.gain.setValueAtTime(volume * masterVol, this.ctx.currentTime);
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
