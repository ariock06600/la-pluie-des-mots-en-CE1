/**
 * Effets sonores doux synthétisés via l'API Web Audio (aucun fichier externe).
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType,
    volume: number,
    delaySec = 0,
    endFreq?: number
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + durationSec);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  /** Petit son cristallin quand une lettre est tapée correctement */
  public playKeyHit(stepIndex = 0): void {
    // Monte doucement sur une gamme pentatonique joyeuse
    const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const freq = notes[stepIndex % notes.length];
    this.playTone(freq, 0.11, 'sine', 0.12, 0, freq * 1.04);
  }

  /** Arpège joyeux quand un mot entier est détruit */
  public playWordComplete(): void {
    this.playTone(523.25, 0.11, 'triangle', 0.14, 0);
    this.playTone(659.25, 0.11, 'triangle', 0.14, 0.055);
    this.playTone(783.99, 0.18, 'triangle', 0.16, 0.11);
  }

  /** Petit son doux en cas d'erreur de frappe (jamais agressif) */
  public playMistake(): void {
    this.playTone(240, 0.14, 'triangle', 0.12, 0, 175);
  }

  /** Descente douce quand un mot touche le bas et retire une vie */
  public playLifeLost(): void {
    this.playTone(330, 0.15, 'sine', 0.14, 0, 220);
    this.playTone(220, 0.22, 'sine', 0.12, 0.11, 150);
  }

  /** Petite mélodie douce de fin de partie */
  public playGameOver(): void {
    this.playTone(440, 0.16, 'triangle', 0.13, 0);
    this.playTone(392, 0.16, 'triangle', 0.13, 0.15);
    this.playTone(349.23, 0.28, 'triangle', 0.14, 0.3);
  }

  /** Petit clic doux sur les boutons du menu */
  public playUiClick(): void {
    this.playTone(600, 0.06, 'sine', 0.08, 0, 720);
  }
}

export const soundEngine = new SoundEngine();
