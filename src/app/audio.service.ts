import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly platformId = inject(PLATFORM_ID);
  private ctx: AudioContext | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // pointerdown fires on both mouse and touch (Android), feels more responsive than click
      document.addEventListener('pointerdown', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, input, textarea, select')) {
          this.playClick();
        }
      }, { passive: true });
    }
  }

  private playClick(): void {
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
      }
      const ctx = this.ctx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      // Soft sine-wave tap: low frequency, gentle exponential decay
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Silently ignore if audio is unavailable
    }
  }
}
