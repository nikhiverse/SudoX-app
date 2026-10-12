// Today — SudoX Daily default homepage ("/").
//
// UI data below is purely presentational. Internal puzzle slugs map to
// their correct /play/[variant] routes via getVariantUrl conventions.
// No real "daily challenge selection" logic is implemented — UI-first placeholders.
//
// Preserved from previous implementation:
//   - useBackNavigationTrap (PWA back-button interception)
//   - Exit confirmation Modal

'use client';

import { useState } from 'react';
import { useBackNavigationTrap } from '@/hooks/useBackNavigationTrap';
import { Modal } from '@/components/ui/Modal';
import { FeaturedCard } from '@/components/home/FeaturedCard';
import { PuzzleSection } from '@/components/home/PuzzleSection';
import { NewGameCta } from '@/components/home/NewGameCta';

// ── Featured slots (UI placeholders) ─────────────────────────────────────────
const FEATURED = [
  {
    id: 'challenge',
    category: "TODAY'S CHALLENGE",
    title: 'Sudoku X',
    description: 'A fresh challenge selected for today.',
    href: '/play/sudokuX',
    thumbPattern: 'challenge' as const,
  },
  {
    id: 'special',
    category: 'SUDOX SPECIAL',
    title: 'Windoku',
    description: 'A special puzzle to keep things interesting.',
    href: '/play/windoku',
    thumbPattern: 'special' as const,
  },
] as const;

// ── Minis — 6×6 and 8×8 compact puzzles ─────────────────────────────────────
// Display labels are independent of internal slugs.
// Slugs: sudoku_mini, jigsaw8, twodoku_mini (from lib/constants.ts)
const MINIS = {
  title: 'Minis',
  subtitle: 'Quick and fun puzzles for a short break.',
  cards: [
    { name: 'Sudoku Mini',  size: '6 × 6', href: '/play/sudoku_mini'  },
    { name: 'Jigsaw Mini',  size: '6 × 6', href: '/play/jigsaw_mini'  },
    { name: 'Twodoku Mini', size: '6 × 6', href: '/play/twodoku_mini' },
  ],
} as const;

// ── Classic — 9×9 Sudoku experience ─────────────────────────────────────────
// Display: Eazy / Core / Expert  ←→  sudoku_easy / sudoku9 / sudoku_a
// URL aliases: getVariantUrl('sudoku_easy') → 'sudoku_eazy'
//              getVariantUrl('sudoku_a')    → 'sudokuA'
const CLASSIC = {
  title: 'Classic',
  subtitle: 'The timeless 9 × 9 Sudoku experience.',
  cards: [
    { name: 'Eazy',   size: '9 × 9', href: '/play/sudoku_eazy' },
    { name: 'Core',   size: '9 × 9', href: '/play/sudoku9'     },
    { name: 'Expert', size: '9 × 9', href: '/play/sudokuA'     },
  ],
} as const;

// ── Royale — bigger grids ─────────────────────────────────────────────────────
// Slugs: sudox_king, sudox_queen, queendoku, snakedoku
const ROYALE = {
  title: 'Royale',
  subtitle: 'Bigger grids. Deeper strategies.',
  cards: [
    { name: 'SudoX King',  size: '9 × 9',   href: '/play/sudox_king'  },
    { name: 'SudoX Queen', size: '9 × 9',   href: '/play/sudox_queen' },
    { name: 'Queendoku',   size: '10 × 10', href: '/play/queendoku'   },
    { name: 'Snakedoku',   size: '10 × 10', href: '/play/snakedoku'   },
  ],
} as const;

// ─────────────────────────────────────────────────────────────────────────────

export default function TodayPage() {
  const [showExitModal, setShowExitModal] = useState(false);

  const { exitApp } = useBackNavigationTrap({
    active: true,
    onTrapTriggered: () => setShowExitModal(true),
  });

  const displayDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="today-page">

      {/* ── HERO ── */}
      <div className="today-hero">
        <p className="today-hero-eyebrow">Today</p>
        <h1 className="today-hero-title">Daily Puzzles</h1>
        <p className="today-hero-date">{displayDate}</p>
        <div className="today-hero-rule" aria-hidden="true" />
      </div>

      {/* ── FEATURED ROW ── */}
      <div className="featured-grid">
        {FEATURED.map((card) => (
          <FeaturedCard key={card.id} {...card} />
        ))}
      </div>

      {/* ── MINIS ── */}
      <PuzzleSection {...MINIS} />

      {/* ── CLASSIC ── */}
      <PuzzleSection {...CLASSIC} />

      {/* ── ROYALE ── */}
      <PuzzleSection {...ROYALE} />

      {/* ── NEW GAME CTA ── */}
      <NewGameCta />

      {/* ── EDITORIAL CLOSING ── */}
      <div className="today-closing" aria-hidden="true">
        <span className="today-closing-rule" />
        <em className="today-closing-quote">&ldquo;Different puzzles. A smarter you.&rdquo;</em>
        <span className="today-closing-rule" />
      </div>

      {/* ── BACK-NAV EXIT MODAL ── */}
      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit SudoX Daily?"
        variant="warning"
        footer={
          <>
            <button
              className="action-btn ghost"
              onClick={() => setShowExitModal(false)}
            >
              Cancel
            </button>
            <button
              className="action-btn primary"
              onClick={() => { setShowExitModal(false); exitApp(); }}
              style={{
                backgroundColor: 'var(--wrong-text)',
                borderColor: 'var(--wrong-text)',
              }}
            >
              Yes, exit
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to leave SudoX Daily?
          <br />
          You will be returned to your previous page.
        </p>
      </Modal>
    </div>
  );
}
