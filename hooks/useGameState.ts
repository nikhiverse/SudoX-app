// ═══════════════════════════════════════════
// useGameState — React wrapper for GameStateManager
// ═══════════════════════════════════════════

'use client';

import { useState, useCallback, useRef } from 'react';
import { GameStateManager } from '@/services/GameStateManager';
import { StorageService } from '@/services/StorageService';
import { getTodayDateString } from '@/lib/date-utils';
import type { PuzzleData } from '@/lib/types';

interface UseGameStateResult {
  manager: GameStateManager;
  stateVersion: number;
  moveCursor: (r: number, c: number) => void;
  writeValue: (r: number, c: number, val: number) => void;
  eraseValue: (r: number, c: number) => void;
  syncTimer: (seconds: number) => void;
  initialTimerSeconds: number;
}

export function useGameState(puzzleData: PuzzleData, game: string): UseGameStateResult {
  const [{ manager, initialTimerSeconds }] = useState(() => {
    const mgr = new GameStateManager(puzzleData);
    let initialSecs = 0;

    // Restore progress from localStorage
    const today = getTodayDateString();
    const saved = StorageService.getProgress(game, today);
    if (saved) {
      mgr.restore({
        cellValues: saved.cellValues,
        cellCorrect: saved.cellCorrect,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cellWasWrong: (saved as any).cellWasWrong, // Handle backwards compatibility
      });
      if (saved.timerSeconds) {
        initialSecs = saved.timerSeconds;
      }
    }
    
    return { manager: mgr, initialTimerSeconds: initialSecs };
  });

  const timerRef = useRef<number>(initialTimerSeconds);
  const [stateVersion, setStateVersion] = useState(0);

  const bump = useCallback(() => {
    setStateVersion(v => v + 1);
  }, []);

  // Persist progress to localStorage on every change
  const persist = useCallback((extra?: { finishedAt?: string; lockedAt?: string }) => {
    const today = getTodayDateString();
    const serialized = manager.serialize();
    const existing = StorageService.getProgress(game, today);
    StorageService.saveProgress(game, today, {
      game,
      date: today,
      cellValues: serialized.cellValues,
      cellCorrect: serialized.cellCorrect,
      cellWasWrong: serialized.cellWasWrong,
      timerSeconds: timerRef.current,
      completed: manager.isCompleted(),
      finishedAt: extra?.finishedAt || existing?.finishedAt,
      lockedAt: extra?.lockedAt || existing?.lockedAt,
    });
  }, [manager, game]);

  const syncTimer = useCallback((seconds: number) => {
    timerRef.current = seconds;
    // Persist every 5 seconds so timer survives page refresh seamlessly
    if (seconds % 5 === 0) {
      persist();
    }
  }, [persist]);

  const moveCursor = useCallback((r: number, c: number) => {
    manager.moveCursor(r, c);
    bump();
  }, [manager, bump]);

  const writeValue = useCallback((r: number, c: number, val: number) => {
    manager.writeValue(r, c, val);
    bump();
    persist();
  }, [manager, bump, persist]);

  const eraseValue = useCallback((r: number, c: number) => {
    manager.eraseValue(r, c);
    bump();
    persist();
  }, [manager, bump, persist]);

  return { 
    manager, 
    stateVersion, 
    moveCursor, 
    writeValue, 
    eraseValue,
    syncTimer,
    initialTimerSeconds
  };
}
