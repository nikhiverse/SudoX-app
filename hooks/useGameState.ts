// ═══════════════════════════════════════════
// useGameState — React wrapper for GameStateManager
// ═══════════════════════════════════════════

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GameStateManager } from '@/services/GameStateManager';
import { StorageService } from '@/services/StorageService';
import { getTodayDateString } from '@/lib/date-utils';
import type { PuzzleData, GameProgress } from '@/lib/types';

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
  const managerRef = useRef<GameStateManager | null>(null);
  const timerRef = useRef<number>(0);
  const initialTimerSecondsRef = useRef<number>(0);
  const [stateVersion, setStateVersion] = useState(0);

  // Initialize manager once per puzzle
  if (!managerRef.current) {
    managerRef.current = new GameStateManager(puzzleData);

    // Restore progress from localStorage
    const today = getTodayDateString();
    const saved = StorageService.getProgress(game, today);
    if (saved) {
      managerRef.current.restore({
        cellValues: saved.cellValues,
        cellCorrect: saved.cellCorrect,
        cellWasWrong: (saved as any).cellWasWrong, // Handle backwards compatibility
      });
      if (saved.timerSeconds) {
        initialTimerSecondsRef.current = saved.timerSeconds;
        timerRef.current = saved.timerSeconds;
      }
    }
  }

  const manager = managerRef.current;

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
    initialTimerSeconds: initialTimerSecondsRef.current
  };
}
