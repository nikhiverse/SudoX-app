// ═══════════════════════════════════════════
// SudoX — Puzzle Service
// API ↔ localStorage bridge.
//
// Flow:
// 1. Check localStorage → instant if found
// 2. Fetch from API (MongoDB) → save to localStorage
// 3. Never runs C++
// ═══════════════════════════════════════════

import { getTodayDateString } from '@/lib/date-utils';
import { StorageService } from './StorageService';
import type { PuzzleApiResponse, PuzzleData } from '@/lib/types';

export const PuzzleService = {
  /**
   * Fetch puzzle data for a given game variant.
   * Checks localStorage first, then falls back to API.
   */
  async fetchPuzzle(game: string): Promise<PuzzleApiResponse> {
    const today = getTodayDateString();

    // 1. Check localStorage first (instant, no network)
    const cached = StorageService.getPuzzle(game, today);
    if (cached) {
      return cached;
    }

    // 2. Fetch from API (reads MongoDB, no C++)
    const res = await fetch(`/api/puzzle/${game}?date=${today}`, { cache: 'no-store' });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(body.error || `HTTP ${res.status}`);
    }

    const data: PuzzleApiResponse = await res.json();

    // 3. Save to localStorage for future clicks
    StorageService.savePuzzle(game, today, data);

    // 4. Run cleanup on old entries (async, non-blocking)
    StorageService.cleanupOldEntries();

    return data;
  },

  /**
   * Check if today's puzzle is already cached in localStorage.
   */
  isCached(game: string): boolean {
    const today = getTodayDateString();
    return StorageService.getPuzzle(game, today) !== null;
  },
};
