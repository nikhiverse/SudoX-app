// ═══════════════════════════════════════════
// useKeyboard — keyboard navigation + input
// ═══════════════════════════════════════════

'use client';

import { useEffect } from 'react';
import type { GameStateManager } from '@/services/GameStateManager';

interface UseKeyboardProps {
  manager: GameStateManager;
  moveCursor: (r: number, c: number) => void;
  writeValue: (r: number, c: number, val: number) => void;
  eraseValue: (r: number, c: number) => void;
  enabled: boolean;
}

export function useKeyboard({
  manager,
  moveCursor,
  writeValue,
  eraseValue,
  enabled,
}: UseKeyboardProps): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = manager.getState();
      const { cursorR, cursorC, totalRows, totalCols } = state;

      // Arrow navigation
      const moves: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      };

      if (moves[e.key]) {
        e.preventDefault();
        const [dr, dc] = moves[e.key];
        let r = cursorR + dr;
        let c = cursorC + dc;

        // Skip inactive cells
        for (let i = 0; i < 20; i++) {
          if (r < 0 || r >= totalRows || c < 0 || c >= totalCols) break;
          if (manager.isActive(r, c)) {
            moveCursor(r, c);
            break;
          }
          r += dr;
          c += dc;
        }
        return;
      }

      // Number keys
      const max = manager.getMaxNum();
      if (/^[1-9]$/.test(e.key)) {
        const v = parseInt(e.key, 10);
        if (v <= max && cursorR >= 0 && cursorC >= 0) {
          writeValue(cursorR, cursorC, v);
        }
        return;
      }

      // A-C for 12-cell puzzles
      if (/^[a-cA-C]$/.test(e.key)) {
        const v = e.key.toUpperCase().charCodeAt(0) - 65 + 10;
        if (v <= max && cursorR >= 0 && cursorC >= 0) {
          writeValue(cursorR, cursorC, v);
        }
        return;
      }

      // Backspace / Delete / 0 → erase
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        if (cursorR >= 0 && cursorC >= 0) {
          eraseValue(cursorR, cursorC);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [manager, moveCursor, writeValue, eraseValue, enabled]);
}
