'use client';

import { useState } from 'react';
import { useBackNavigationTrap } from '@/hooks/useBackNavigationTrap';
import { Modal } from '@/components/ui/Modal';
import { FeaturedCard } from '@/components/home/FeaturedCard';
import { VariantCard } from '@/components/home/VariantCard';

// ── Featured puzzle cards (Preserved exactly as requested: "dont tourch daily challenge tap and time rush tap") ──
const FEATURED = [
  {
    id: 'challenge',
    badge: "TODAY'S CHALLENGE",
    title: 'Dozaku',
    description: 'A fresh 12x12 challenge selected for today with dual 3x4 and 4x3 subgrid constraints.',
    href: '/play/dozaku',
    pattern: 'dozaku' as const,
  },
  {
    id: 'special',
    badge: 'TIME RUSH',
    title: 'Windoku',
    description: 'A special puzzle to keep things interesting with four extra shaded windows.',
    href: '/play/windoku9',
    pattern: 'windows' as const,
  },
] as const;

// ── Game Variant Collections (Start from SudoX Minis and end on Sudox Royale, Direct Cards, No Modals) ──
interface VariantSectionItem {
  id: string;
  title: string;
  cards: Array<{
    title: string;
    categoryLabel: 'VARIANT' | 'LEVEL';
    sizeText: React.ReactNode;
    href: string;
    colorTheme: 'green' | 'purple' | 'peach';
    gridType: '6x6' | '9x9' | '8x8' | 'twodoku' | 'windoku' | 'x' | 'jigsaw' | 'royale';
  }>;
}

const SECTIONS: readonly VariantSectionItem[] = [
  // 1. SudoX Minis
  {
    id: 'minis',
    title: 'SUDOX MINIS',
    cards: [
      {
        title: 'Sudoku Mini',
        categoryLabel: 'VARIANT',
        sizeText: '6x6',
        href: '/play/sudoku_mini',
        colorTheme: 'green',
        gridType: '6x6',
      },
      {
        title: 'Jigsaw Mini',
        categoryLabel: 'VARIANT',
        sizeText: '6x6',
        href: '/play/jigsaw_mini',
        colorTheme: 'purple',
        gridType: '6x6',
      },
      {
        title: 'Twodoku Mini',
        categoryLabel: 'VARIANT',
        sizeText: '2(6x6)',
        href: '/play/twodoku_mini',
        colorTheme: 'peach',
        gridType: 'twodoku',
      },
    ],
  },

  // 2. Sudoku Classic
  {
    id: 'classic',
    title: 'SUDOKU CLASSIC',
    cards: [
      {
        title: 'Eazy',
        categoryLabel: 'LEVEL',
        sizeText: '9x9',
        href: '/play/sudoku_eazy',
        colorTheme: 'green',
        gridType: '9x9',
      },
      {
        title: 'Medium',
        categoryLabel: 'LEVEL',
        sizeText: '9x9',
        href: '/play/sudoku9',
        colorTheme: 'purple',
        gridType: '9x9',
      },
      {
        title: 'Hard',
        categoryLabel: 'LEVEL',
        sizeText: '9x9',
        href: '/play/sudokuA',
        colorTheme: 'peach',
        gridType: '9x9',
      },
    ],
  },

  // 3. Windokus
  {
    id: 'windokus',
    title: 'WINDOKUS',
    cards: [
      {
        title: 'Windoku 8',
        categoryLabel: 'VARIANT',
        sizeText: '8x8',
        href: '/play/windoku8',
        colorTheme: 'green',
        gridType: 'windoku',
      },
      {
        title: 'Windoku 9',
        categoryLabel: 'VARIANT',
        sizeText: '9x9',
        href: '/play/windoku9',
        colorTheme: 'purple',
        gridType: 'windoku',
      },
      {
        title: 'Windoku X',
        categoryLabel: 'VARIANT',
        sizeText: '9x9',
        href: '/play/windokuX',
        colorTheme: 'peach',
        gridType: 'windoku',
      },
    ],
  },

  // 4. Jigsawkus
  {
    id: 'jigsawkus',
    title: 'JIGSAWKUS',
    cards: [
      {
        title: 'Jigsaw 8',
        categoryLabel: 'VARIANT',
        sizeText: '8x8',
        href: '/play/jigsaw8',
        colorTheme: 'green',
        gridType: 'jigsaw',
      },
      {
        title: 'Jigsaw 9',
        categoryLabel: 'VARIANT',
        sizeText: '9x9',
        href: '/play/jigsaw9',
        colorTheme: 'purple',
        gridType: 'jigsaw',
      },
      {
        title: 'Jigsaw X',
        categoryLabel: 'VARIANT',
        sizeText: '9x9',
        href: '/play/jigsawX',
        colorTheme: 'peach',
        gridType: 'jigsaw',
      },
    ],
  },

  // 5. Standard Variants
  {
    id: 'standard_variants',
    title: 'STANDARD VARIANTS',
    cards: [
      {
        title: 'Sudoku Centroids',
        categoryLabel: 'VARIANT',
        sizeText: '9x9',
        href: '/play/sudoku_centroid',
        colorTheme: 'green',
        gridType: 'x',
      },
      {
        title: 'Sudoku X',
        categoryLabel: 'VARIANT',
        sizeText: '9x9',
        href: '/play/sudokuX',
        colorTheme: 'purple',
        gridType: 'x',
      },
      {
        title: 'Crossdoku',
        categoryLabel: 'VARIANT',
        sizeText: '9x9',
        href: '/play/crossdoku',
        colorTheme: 'peach',
        gridType: 'x',
      },
      {
        title: 'Killer Sudoku',
        categoryLabel: 'VARIANT',
        sizeText: '9x9',
        href: '/play/killer_sudoku',
        colorTheme: 'green',
        gridType: '9x9',
      },
    ],
  },

  // 6. Twodokus (with exact requested notation: 8² + 6², 9² + 8², 2(9x9))
  {
    id: 'twodokus',
    title: 'TWODOKUS',
    cards: [
      {
        title: 'Twodoku 86',
        categoryLabel: 'VARIANT',
        sizeText: (
          <span>
            8<sup>2</sup> + 6<sup>2</sup>
          </span>
        ),
        href: '/play/twodoku86',
        colorTheme: 'green',
        gridType: 'twodoku',
      },
      {
        title: 'Twodoku 98',
        categoryLabel: 'VARIANT',
        sizeText: (
          <span>
            9<sup>2</sup> + 8<sup>2</sup>
          </span>
        ),
        href: '/play/twodoku98',
        colorTheme: 'purple',
        gridType: 'twodoku',
      },
      {
        title: 'Twodoku 9',
        categoryLabel: 'VARIANT',
        sizeText: '2(9x9)',
        href: '/play/twodoku9',
        colorTheme: 'peach',
        gridType: 'twodoku',
      },
    ],
  },

  // 7. SudoX Royale
  {
    id: 'royale',
    title: 'SUDOX ROYALE',
    cards: [
      {
        title: 'SudoX King',
        categoryLabel: 'VARIANT',
        sizeText: '9x9',
        href: '/play/sudox_king',
        colorTheme: 'green',
        gridType: 'royale',
      },
      {
        title: 'SudoX Queen',
        categoryLabel: 'VARIANT',
        sizeText: '9x9',
        href: '/play/sudox_queen',
        colorTheme: 'purple',
        gridType: 'royale',
      },
      {
        title: 'SudoX Royal',
        categoryLabel: 'VARIANT',
        sizeText: '9x9',
        href: '/play/sudox_royal',
        colorTheme: 'peach',
        gridType: 'royale',
      },
    ],
  },
];

export default function HomePage() {
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
    <div className="glass-homepage relative w-full min-h-screen bg-[#FAF9F6] text-stone-900">
      {/* ── AMBIENT SUBTLE WARM TINT ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
        <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[140px]" />
        <div className="absolute top-[35%] right-[-10%] w-[500px] h-[500px] bg-yellow-100/25 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-5%] left-[20%] w-[450px] h-[450px] bg-stone-200/20 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6">
        {/* ── HERO / HEADER ── */}
        <header className="text-center pt-6 pb-8 md:pb-10">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
            Daily Puzzles
          </h1>
          <p className="text-sm md:text-base text-stone-500 font-medium tracking-wide mt-2">
            {displayDate}
          </p>
        </header>

        {/* ── FEATURED SECTION: DAILY CHALLENGE & TIME RUSH (Preserved) ── */}
        <section aria-label="Featured Challenges" className="mb-14 sm:mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-stretch">
            {/* Card 1: TODAY'S CHALLENGE - Dozaku */}
            <FeaturedCard
              id={FEATURED[0].id}
              badge={FEATURED[0].badge}
              title={FEATURED[0].title}
              description={FEATURED[0].description}
              href={FEATURED[0].href}
              pattern={FEATURED[0].pattern}
            />

            {/* Card 2: TIME RUSH - Windoku */}
            <FeaturedCard
              id={FEATURED[1].id}
              badge={FEATURED[1].badge}
              title={FEATURED[1].title}
              description={FEATURED[1].description}
              href={FEATURED[1].href}
              pattern={FEATURED[1].pattern}
            />
          </div>
        </section>

        {/* ── 7 VARIANT SECTIONS: Starting from SudoX Minis, Ending on Sudox Royale ── */}
        <main aria-label="Sudoku Game Collections" className="w-full flex flex-col gap-14 sm:gap-20 mb-20 md:mb-28">
          {SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`title-${section.id}`}
              className="w-full block"
            >
              {/* Bold Uppercase Section Heading (Block element with generous margin matching mockup) */}
              <h2
                id={`title-${section.id}`}
                className="w-full block text-2xl sm:text-3xl font-black text-stone-900 tracking-tight uppercase mb-6 sm:mb-8"
              >
                {section.title}
              </h2>

              {/* 3-Card Pastel Row (Vertical portrait cards with generous gap) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch">
                {section.cards.map((card) => (
                  <VariantCard
                    key={card.title}
                    title={card.title}
                    categoryLabel={card.categoryLabel}
                    sizeText={card.sizeText}
                    href={card.href}
                    colorTheme={card.colorTheme}
                    gridType={card.gridType}
                  />
                ))}
              </div>
            </section>
          ))}
        </main>

        {/* ── EDITORIAL CLOSING ── */}
        <footer className="flex items-center justify-center gap-4 py-8 border-t border-black/10" aria-hidden="true">
          <span className="w-8 h-[1px] bg-stone-300" />
          <em className="font-serif italic text-xs md:text-sm text-stone-500 text-center">
            &ldquo;Different puzzles. A smarter you.&rdquo;
          </em>
          <span className="w-8 h-[1px] bg-stone-300" />
        </footer>
      </div>

      {/* ── BACK-NAV EXIT MODAL ── */}
      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit SudoX Daily?"
        variant="warning"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <button
              className="px-4 py-2 text-sm font-semibold rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              onClick={() => setShowExitModal(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-colors"
              onClick={() => {
                setShowExitModal(false);
                exitApp();
              }}
            >
              Yes, exit
            </button>
          </div>
        }
      >
        <p className="text-sm text-stone-600 leading-relaxed">
          Are you sure you want to leave SudoX Daily?
          <br />
          You will be returned to your previous page.
        </p>
      </Modal>
    </div>
  );
}
