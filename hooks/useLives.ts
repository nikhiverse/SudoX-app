// ═══════════════════════════════════════════
// useLives — Manage daily mistake allowance
// ═══════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '@/services/StorageService';
import { getTodayDateString } from '@/lib/date-utils';

export function useLives() {
  const [lives, setLives] = useState(4);
  const [lockedGames, setLockedGames] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const today = getTodayDateString();
    setLives(StorageService.getLives(today));
    setLockedGames(StorageService.getLockedGames(today));
    setIsInitialized(true);
  }, []);

  const recordMistake = useCallback((game: string) => {
    const today = getTodayDateString();
    
    // Decrease lives
    let currentLives = StorageService.getLives(today);
    if (currentLives > 0) {
      currentLives -= 1;
      StorageService.setLives(today, currentLives);
      setLives(currentLives);
    }
    
    // If lives hit 0, lock this game
    if (currentLives === 0) {
      const locked = StorageService.getLockedGames(today);
      if (!locked.includes(game)) {
         locked.push(game);
         StorageService.setLockedGames(today, locked);
         setLockedGames([...locked]); // trigger re-render
      }
    }
  }, []);

  const isLocked = useCallback((game: string) => {
    return lockedGames.includes(game);
  }, [lockedGames]);

  return { lives, recordMistake, isLocked, isInitialized };
}
