// ═══════════════════════════════════════════
// NumberPanel — input buttons + eraser
// ═══════════════════════════════════════════

'use client';

import { useMemo } from 'react';
import { displayVal } from '@/lib/grid-utils';
import { GameStateManager } from '@/services/GameStateManager';

interface NumberPanelProps {
  manager: GameStateManager;
  stateVersion: number;
  onNumberClick: (val: number) => void;
  onErase: () => void;
}

export function NumberPanel({ manager, stateVersion, onNumberClick, onErase }: NumberPanelProps) {
  const max = manager.getMaxNum();

  const buttons = useMemo(() => {
    const btns: React.ReactNode[] = [];

    for (let v = 1; v <= max; v++) {
      const exhausted = manager.isExhausted(v);
      btns.push(
        <button
          key={v}
          className={`num-btn ${exhausted ? 'num-btn--exhausted' : ''}`}
          data-val={v}
          onClick={() => {
            if (!exhausted) onNumberClick(v);
          }}
          disabled={exhausted}
        >
          {displayVal(v)}
        </button>
      );
    }

    return btns;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max, manager, stateVersion, onNumberClick]);

  return (
    <div className="num-panel">
      {buttons}

      {/* Faint line separating numbers from eraser */}
      <div className="num-panel-divider" />

      {/* Eraser */}
      <button
        className="num-btn num-btn--erase"
        title="Erase cell"
        onClick={onErase}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 20H7L3 16l10-10 7 7-3.5 3.5" />
          <path d="M6.5 17.5l4-4" />
        </svg>
      </button>
    </div>
  );
}
