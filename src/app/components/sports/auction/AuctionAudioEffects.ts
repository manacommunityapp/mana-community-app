/**
 * Auction Audio Effects using Web Audio API
 * Generates crisp, real-time procedural sound effects with zero external audio assets or network lag.
 */

class AuctionAudioManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    if (this.soundEnabled) {
      this.playBidDing();
    }
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  /**
   * Upbeat high-clarity ding when a team places a bid
   */
  public playBidDing(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (_) {}
  }

  /**
   * Resonant wooden gavel strike & brass triumph chord when a player is marked SOLD
   */
  public playHammerSold(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      // 1. Wooden Thud (Gavel hit)
      const oscThud = ctx.createOscillator();
      const gainThud = ctx.createGain();
      oscThud.type = 'triangle';
      oscThud.frequency.setValueAtTime(160, ctx.currentTime);
      oscThud.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.12);

      gainThud.gain.setValueAtTime(0.6, ctx.currentTime);
      gainThud.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      oscThud.connect(gainThud);
      gainThud.connect(ctx.destination);
      oscThud.start(ctx.currentTime);
      oscThud.stop(ctx.currentTime + 0.15);

      // 2. Brass Victory Chime (Major Triad Chord: C5, E5, G5)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.08 + idx * 0.03);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.08 + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + 0.08 + idx * 0.03);
        osc.stop(ctx.currentTime + 0.9);
      });
    } catch (_) {}
  }

  /**
   * Urgent pulse tone for countdown timer final 5 seconds
   */
  public playWarningBeep(secondsLeft: number): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Higher pitch as time runs out
      const freq = secondsLeft <= 2 ? 880 : 700;
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch (_) {}
  }

  /**
   * Deep theatrical gong for marquee/icon player spotlight
   */
  public playGong(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.4);
    } catch (_) {}
  }
}

export const auctionAudio = new AuctionAudioManager();
