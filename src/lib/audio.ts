/**
 * Mock Premium African Musical Synthesizer for AFRIGOMBO ELITE
 * This mock completely disables synthesized, temporary, and fake sound generation
 * while preserving API compatibility to prevent application regressions.
 */

class AudioSynthesizer {
  public playKoraNote(freq: number, delayMs: number, volMultiplier: number, duration: number) {
    // Quiet
  }

  public playKoraSuccess() {
    // Quiet
  }

  public playValidationSuccess() {
    // Quiet
  }

  public playTamTam(highPitch: boolean) {
    // Quiet
  }

  public playSaxophone(freq?: number, vol?: number, duration?: number) {
    // Quiet
  }

  public startAmbientLoop() {
    // Quiet
  }

  public stopAmbientLoop() {
    // Quiet
  }

  public getVolume(): number {
    return 0;
  }

  public setVolume(vol: number) {
    // Quiet
  }

  public isSoundEnabled(): boolean {
    return false;
  }

  public isAmbientEnabled(): boolean {
    return false;
  }
}

export const audioSynth = new AudioSynthesizer();
