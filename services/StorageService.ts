// ═══════════════════════════════════════════
// SudoX — localStorage Service
// Handles puzzle data + progress caching.
// ═══════════════════════════════════════════

import { STORAGE_PREFIX, STORAGE_KEEP_DAYS } from '@/lib/constants';
import type { GameProgress, PuzzleApiResponse } from '@/lib/types';

// Key formats:
//   sudox:puzzle:sudoku9:2026-04-15     → PuzzleApiResponse
//   sudox:progress:sudoku9:2026-04-15   → GameProgress
//   sudox:lives:sudoku9:2026-04-15      → number (per-puzzle lives, starts at 3)
//   sudox:locked:sudoku9:2026-04-15     → boolean (1 = locked for that puzzle)

function puzzleKey(game: string, date: string): string {
  return `${STORAGE_PREFIX}:puzzle:${game}:${date}`;
}

function progressKey(game: string, date: string): string {
  return `${STORAGE_PREFIX}:progress:${game}:${date}`;
}

function isLocalStorageAvailable(): boolean {
  try {
    const test = '__sudox_test__';
    localStorage.setItem(test, '1');
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

export const StorageService = {
  // ── Puzzle Data ──

  savePuzzle(game: string, date: string, data: PuzzleApiResponse): void {
    if (!isLocalStorageAvailable()) return;
    try {
      localStorage.setItem(puzzleKey(game, date), JSON.stringify(data));
    } catch {
      // Storage full — clean up old entries and retry
      this.cleanupOldEntries(1);
      try {
        localStorage.setItem(puzzleKey(game, date), JSON.stringify(data));
      } catch {
        // Still failed — silently ignore
      }
    }
  },

  getPuzzle(game: string, date: string): PuzzleApiResponse | null {
    if (!isLocalStorageAvailable()) return null;
    try {
      const raw = localStorage.getItem(puzzleKey(game, date));
      if (!raw) return null;
      return JSON.parse(raw) as PuzzleApiResponse;
    } catch {
      return null;
    }
  },

  // ── Game Progress ──

  saveProgress(game: string, date: string, progress: GameProgress): void {
    if (!isLocalStorageAvailable()) return;
    try {
      localStorage.setItem(progressKey(game, date), JSON.stringify(progress));
    } catch {
      // Silently ignore
    }
  },

  getProgress(game: string, date: string): GameProgress | null {
    if (!isLocalStorageAvailable()) return null;
    try {
      const raw = localStorage.getItem(progressKey(game, date));
      if (!raw) return null;
      return JSON.parse(raw) as GameProgress;
    } catch {
      return null;
    }
  },

  // ── Lives & Locking (per-puzzle) ──
  // Each game gets its own independent 3-life budget.
  // Key: sudox:lives:{game}:{date}

  getLives(game: string, date: string): number {
    if (!isLocalStorageAvailable()) return 3;
    try {
      const val = localStorage.getItem(`${STORAGE_PREFIX}:lives:${game}:${date}`);
      return val === null ? 3 : parseInt(val, 10);
    } catch {
      return 3;
    }
  },

  setLives(game: string, date: string, count: number): void {
    if (!isLocalStorageAvailable()) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}:lives:${game}:${date}`, count.toString());
    } catch {
      // Silently ignore
    }
  },

  isGameLocked(game: string, date: string): boolean {
    if (!isLocalStorageAvailable()) return false;
    try {
      const val = localStorage.getItem(`${STORAGE_PREFIX}:locked:${game}:${date}`);
      return val === '1';
    } catch {
      return false;
    }
  },

  setGameLocked(game: string, date: string): void {
    if (!isLocalStorageAvailable()) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}:locked:${game}:${date}`, '1');
    } catch {
      // Silently ignore
    }
  },



  // ── Cleanup ──

  /**
   * Remove localStorage entries older than `keepDays` days.
   * Defaults to STORAGE_KEEP_DAYS (2).
   */
  cleanupOldEntries(keepDays: number = STORAGE_KEEP_DAYS): void {
    if (!isLocalStorageAvailable()) return;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - keepDays);
    const cutoffStr = cutoff.toISOString().slice(0, 10); // "YYYY-MM-DD"

    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX + ':')) continue;

      // Extract date from key: sudox:puzzle:game:YYYY-MM-DD
      const parts = key.split(':');
      const dateInKey = parts[parts.length - 1];

      // Check if it looks like a date and is older than cutoff
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInKey) && dateInKey < cutoffStr) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  },
};
