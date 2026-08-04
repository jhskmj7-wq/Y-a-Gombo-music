/**
 * Premium African Musical Synthesizer & Notification Sound Engine for AFRIGOMBO ELITE
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private ambientEnabled: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch (e) {
      return null;
    }
  }

  public playNotificationSound() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Gentle kora-inspired chime for notifications (short, discrete, pleasant)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      // Safe fallback if audio context blocked
    }
  }

  public playKoraNote(freq: number, delayMs: number, volMultiplier: number, duration: number) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      setTimeout(() => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.15 * volMultiplier, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (duration || 0.5));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + (duration || 0.5));
      }, delayMs || 0);
    } catch (e) {}
  }

  public playKoraSuccess(force = false) {
    if (!force) return;
    this.playKoraNote(523.25, 0, 1, 0.4);
    this.playKoraNote(659.25, 120, 1, 0.5);
    this.playKoraNote(783.99, 240, 1.2, 0.7);
  }

  public playValidationSuccess(force = false) {
    if (!force) return;
    this.playKoraSuccess(true);
  }

  public playTamTam(highPitch: boolean, force = false) {
    if (!this.soundEnabled || !force) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(highPitch ? 180 : 110, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  public playSaxophone(freq?: number, vol?: number, duration?: number) {}

  public startAmbientLoop() {}

  public stopAmbientLoop() {}

  public getVolume(): number {
    return 1;
  }

  public setVolume(vol: number) {}

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public isAmbientEnabled(): boolean {
    return this.ambientEnabled;
  }
}

export const audioSynth = new AudioSynthesizer();
