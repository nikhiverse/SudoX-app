// ═══════════════════════════════════════════
// SudoX — Timer Service
// Pure state machine, no React deps.
// ═══════════════════════════════════════════

import { formatTimer, getClockEmoji } from '@/lib/grid-utils';

export class TimerService {
  private seconds: number = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onTick: ((seconds: number) => void) | null = null;

  constructor(onTick?: (seconds: number) => void) {
    this.onTick = onTick ?? null;
  }

  start(fromSeconds: number = 0): void {
    this.stop();
    this.seconds = fromSeconds;
    this.emitTick();

    this.intervalId = setInterval(() => {
      this.seconds++;
      this.emitTick();
    }, 1000);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset(): void {
    this.stop();
    this.seconds = 0;
    this.emitTick();
  }

  getSeconds(): number {
    return this.seconds;
  }

  getDisplay(): string {
    return formatTimer(this.seconds);
  }

  getEmoji(): string {
    return getClockEmoji(this.seconds);
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }

  setOnTick(callback: (seconds: number) => void): void {
    this.onTick = callback;
  }

  private emitTick(): void {
    this.onTick?.(this.seconds);
  }

  destroy(): void {
    this.stop();
    this.onTick = null;
  }
}
