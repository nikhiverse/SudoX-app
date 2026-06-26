// ═══════════════════════════════════════════
// usePuzzle — fetch + cache puzzle data
// ═══════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';
import { PuzzleService } from '@/services/PuzzleService';
import type { PuzzleApiResponse } from '@/lib/types';

interface UsePuzzleResult {
  data: PuzzleApiResponse | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function usePuzzle(game: string): UsePuzzleResult {
  const [data, setData] = useState<PuzzleApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    console.log('usePuzzle: fetchData start, game =', game);
    setLoading(true);
    setError(null);
    try {
      console.log('usePuzzle: calling fetchPuzzle');
      const result = await PuzzleService.fetchPuzzle(game);
      console.log('usePuzzle: fetchPuzzle returned success:', result ? 'yes' : 'no');
      setData(result);
    } catch (err) {
      console.error('usePuzzle: fetchPuzzle threw error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load puzzle';
      setError(msg);
    } finally {
      console.log('usePuzzle: fetchData finally setting loading false');
      setLoading(false);
    }
  }, [game]);

  useEffect(() => {
    console.log('usePuzzle: useEffect running for game =', game);
    fetchData();
  }, [fetchData]);

  return { data, loading, error, retry: fetchData };
}

