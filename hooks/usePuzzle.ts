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
    setLoading(true);
    setError(null);
    try {
      const result = await PuzzleService.fetchPuzzle(game);
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load puzzle';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [game]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, retry: fetchData };
}
