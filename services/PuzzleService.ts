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
    console.log('PuzzleService: fetchPuzzle starting for game =', game, 'today =', today);

    // 1. Check localStorage first (instant, no network)
    const cached = StorageService.getPuzzle(game, today);
    console.log('PuzzleService: cached puzzle found in localStorage:', cached ? 'yes' : 'no');
    if (cached) {
      return cached;
    }

    const url = `/api/puzzle/${game}?date=${today}`;
    console.log('PuzzleService: fetching from URL:', url);
    // 2. Fetch from API (reads MongoDB, no C++)
    const res = await fetch(url, { cache: 'no-store' });
    console.log('PuzzleService: fetch returned status =', res.status);

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Unknown error' }));
      console.error('PuzzleService: fetch error body =', body);
      throw new Error(body.error || `HTTP ${res.status}`);
    }

    const raw = await res.json();
    console.log('PuzzleService: fetched raw payload, uniqueId =', raw.uniqueId, 'hasEncodedSolution =', !!raw.encodedSolution);

    // 3. Decode the encoded solution and merge into puzzleData
    let data: PuzzleApiResponse;
    if (raw.encodedSolution && raw.uniqueId) {
      console.log('PuzzleService: decoding solution...');
      const solution = decodeSolution(raw.encodedSolution, raw.uniqueId);
      console.log('PuzzleService: decoded solution successfully');
      data = {
        ...raw,
        puzzleData: { ...raw.puzzleData, solution },
      };
      // Remove the encoded payload — no need to persist it
      delete data.encodedSolution;
    } else {
      console.log('PuzzleService: no encodedSolution found, using raw response');
      // Backwards-compat: if the server still sends solution inline
      data = raw as PuzzleApiResponse;
    }

    // 4. Save to localStorage for future clicks
    console.log('PuzzleService: saving decoded puzzle to localStorage');
    StorageService.savePuzzle(game, today, data);

    // 5. Run cleanup on old entries (async, non-blocking)
    console.log('PuzzleService: triggering cleanupOldEntries');
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

