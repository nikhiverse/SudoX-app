// Variants — the permanent puzzle library.
// This is a direct relocation of the 16-puzzle UI that previously lived on the homepage.
// All puzzle names, routes, completion/locked states, and localStorage behaviour
// are completely unchanged.

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HOME_VARIANTS, GAME_NAMES, getVariantUrl } from '@/lib/constants';
import { StorageService } from '@/services/StorageService';
import { getTodayDateString } from '@/lib/date-utils';
import type { GameVariant } from '@/lib/types';

export default function VariantsPage() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [locked, setLocked] = useState<string[]>([]);

  useEffect(() => {
    const today = getTodayDateString();

    const comp: Record<string, boolean> = {};
    const lock: string[] = [];

    for (const variant of HOME_VARIANTS) {
      const prog = StorageService.getProgress(variant, today);
      if (prog?.completed) {
        comp[variant] = true;
      }
      if (StorageService.isGameLocked(variant, today)) {
        lock.push(variant);
      }
    }

    // Reading localStorage on mount and setting initial state is a valid
    // one-time initialisation pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocked(lock);
    setCompleted(comp);
  }, []);

  return (
    <div id="menuState">
      <div className="menu-header">
        <p className="menu-eyebrow">Daily Puzzles</p>
        <h1 className="menu-title">Sudoku Variants</h1>
        <p className="menu-sub">Choose a variant and play</p>
      </div>
      <div className="top-controls" id="topControls">
        <div className="difficulty-grid">
          {HOME_VARIANTS.map((variant: GameVariant) => (
            <Link
              key={variant}
              href={`/play/${getVariantUrl(variant)}`}
              className={`diff-btn ${completed[variant] ? 'completed-btn' : ''} ${locked.includes(variant) ? 'locked-btn' : ''}`}
              id={`btn-${variant}`}
            >
              {GAME_NAMES[variant]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
