// ═══════════════════════════════════════════
// useLives — Per-puzzle mistake allowance
// Each game variant gets its own 3 lives,
// stored independently in localStorage.
// ═══════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '@/services/StorageService';
import { getTodayDateString } from '@/lib/date-utils';

export function useLives(game: string) {
  const [lives, setLives] = useState(3);
  const [locked, setLocked] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const today = getTodayDateString();
    setLives(StorageService.getLives(game, today));
    setLocked(StorageService.isGameLocked(game, today));
    setIsInitialized(true);
  }, [game]);

  const recordMistake = useCallback(() => {
    const today = getTodayDateString();

    // Decrease lives for this specific puzzle
    let currentLives = StorageService.getLives(game, today);
    if (currentLives > 0) {
      currentLives -= 1;
      StorageService.setLives(game, today, currentLives);
      setLives(currentLives);
    }

    // If lives hit 0, lock this specific game
    if (currentLives === 0) {
      StorageService.setGameLocked(game, today);
      setLocked(true);
    }
  }, [game]);

  const isLocked = locked;

  return { lives, recordMistake, isLocked, isInitialized };
}
