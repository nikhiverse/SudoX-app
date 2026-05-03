// ═══════════════════════════════════════════
// SudoX — Puzzle Service
// API ↔ localStorage bridge.
//
// Flow:
// 1. Check localStorage → instant if found
// 2. Fetch from API (MongoDB) → decode solution → save to localStorage
// 3. Never runs C++
// ═══════════════════════════════════════════

import { getTodayDateString } from '@/lib/date-utils';
import { decodeSolution } from '@/lib/solution-codec';
import { StorageService } from './StorageService';
import type { PuzzleApiResponse } from '@/lib/types';

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

    const raw = await res.json();

    // 3. Decode the encoded solution and merge into puzzleData
    let data: PuzzleApiResponse;
    if (raw.encodedSolution && raw.uniqueId) {
      const solution = decodeSolution(raw.encodedSolution, raw.uniqueId);
      data = {
        ...raw,
        puzzleData: { ...raw.puzzleData, solution },
      };
      // Remove the encoded payload — no need to persist it
      delete data.encodedSolution;
    } else {
      // Backwards-compat: if the server still sends solution inline
      data = raw as PuzzleApiResponse;
    }

    // 4. Save to localStorage for future clicks
    StorageService.savePuzzle(game, today, data);

    // 5. Run cleanup on old entries (async, non-blocking)
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

