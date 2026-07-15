// ═══════════════════════════════════════════
// usePuzzle — fetch + cache puzzle data
// ═══════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PuzzleService } from '@/services/PuzzleService';
import { getTodayDateString } from '@/lib/date-utils';
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
  }, [fetchData, game]);

  // ── Midnight-rollover watcher ──
  // Polls every 30 seconds. When the IST date changes (midnight),
  // the current data's date will differ from today. We then force a
  // refetch so the new day's puzzle loads, and since GameActive is
  // keyed on uniqueId it fully remounts with clean state.
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    const interval = setInterval(() => {
      const today = getTodayDateString();
      if (dataRef.current && dataRef.current.date !== today) {
        fetchData();
      }
    }, 30_000); // check every 30 seconds

    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, retry: fetchData };
}
