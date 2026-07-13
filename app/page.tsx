// Yeh SudoX website ka sabse pehla page (Homepage) hai jahan saare puzzles ki list hoti hai.
// Users yaha se apna manpasand (fav) game chun sakte hain.

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HOME_VARIANTS, GAME_NAMES, getVariantUrl } from '@/lib/constants';
import { StorageService } from '@/services/StorageService';
import { getTodayDateString } from '@/lib/date-utils';
import type { GameVariant } from '@/lib/types';
import { useBackNavigationTrap } from '@/hooks/useBackNavigationTrap';
import { Modal } from '@/components/ui/Modal';

export default function HomePage() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [locked, setLocked] = useState<string[]>([]);
  const [showExitModal, setShowExitModal] = useState(false);

  const { exitApp } = useBackNavigationTrap({
    active: true,
    onTrapTriggered: () => setShowExitModal(true),
  });

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

      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit SudoX Daily?"
        variant="warning"
        footer={
          <>
            <button className="action-btn ghost" onClick={() => setShowExitModal(false)}>Cancel</button>
            <button className="action-btn primary" onClick={exitApp} style={{ backgroundColor: 'var(--wrong-text)', borderColor: 'var(--wrong-text)' }}>Yes, exit</button>
          </>
        }
      >
        <p>Are you sure you want to leave SudoX Daily?<br />You will be returned to your previous page.</p>
      </Modal>
    </div>
  );
}
