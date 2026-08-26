// ═══════════════════════════════════════════
// useGameState — React wrapper for GameStateManager
// ═══════════════════════════════════════════

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
  getTimerSeconds: () => number;
  persistTimerSnapshot: () => void;
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
    // Only update the ref — do NOT call persist() here.
    // persist() writes localStorage which fires the cross-tab storage event,
    // which calls bump() → re-render → timer.seconds changes → this fires again
    // → infinite loop (React error #185). The timer value is already in timerRef
    // and will be included in the next persist() triggered by a user action.
    timerRef.current = seconds;
  }, []);

  // Stable getter — reads the current timer value without being a reactive dep.
  // Use this in effects where you need the timer value but DON'T want the effect
  // to re-run every second (which would cause infinite loops).
  const getTimerSeconds = useCallback(() => timerRef.current, []);

  // One-shot flush called from visibilitychange/pagehide to persist the timer
  // even when the user navigates away without making any input.
  // Does NOT call bump() — safe to call from event handlers without triggering
  // a reactive re-render loop.
  const persistTimerSnapshot = useCallback(() => {
    const today = getTodayDateString();
    const existing = StorageService.getProgress(game, today);
    if (!existing) return; // no progress entry yet — timer was 0, nothing to save
    StorageService.saveProgress(game, today, {
      ...existing,
      timerSeconds: timerRef.current,
    });
  }, [game]);

  // Sync state automatically across different browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const today = getTodayDateString();
      const expectedKey = `sudox:progress:${game}:${today}`;
      
      if (e.key === expectedKey && e.newValue) {
        try {
          const saved = JSON.parse(e.newValue);
          manager.restore({
            cellValues: saved.cellValues,
            cellCorrect: saved.cellCorrect,
            cellWasWrong: saved.cellWasWrong,
          });
          if (saved.timerSeconds && saved.timerSeconds > timerRef.current) {
            timerRef.current = saved.timerSeconds;
          }
          bump();
        } catch (err) {
          console.error('Failed to sync progress across tabs', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [game, manager, bump]);

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
    getTimerSeconds,
    persistTimerSnapshot,
    initialTimerSeconds
  };
}
