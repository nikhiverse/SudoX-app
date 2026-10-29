// SudoX Featured Puzzle Card (Sudoku X, Windoku)
// Strictly uniform height, visible frosted glass container, faint 9x9 watermark,
// and empty invisible structural footer placeholder for countdown timer stability.

import Link from 'next/link';
import { GridWatermark } from './GridWatermark';

export interface FeaturedCardProps {
  id: string;
  badge: string;
  title: string;
  description: string;
  href: string;
  pattern?: 'x' | 'windows' | 'standard' | 'dozaku';
}

export function FeaturedCard({
  badge,
  title,
  description,
  href,
  pattern = 'standard',
}: FeaturedCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col h-full p-6 md:p-8 rounded-2xl bg-white/70 hover:bg-white/90 active:bg-white backdrop-blur-md border border-black/10 hover:border-black/20 shadow-sm hover:shadow-md transition-all duration-300 ease-out hover:-translate-y-1 overflow-hidden no-underline text-left cursor-pointer"
      aria-label={`${badge}: Play ${title} — ${description}`}
    >
      {/* Top content: Badge, Title, Description */}
      <div className="relative z-10 flex flex-col gap-1.5 max-w-[85%]">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
          {badge}
        </span>
        <h3 className="font-sans text-xl md:text-2xl font-bold text-stone-900 tracking-tight leading-snug">
          {title}
        </h3>
        <p className="text-sm text-stone-600 leading-relaxed mt-1">
          {description}
        </p>
      </div>

      {/* Reserved invisible structural footer placeholder for countdown timer */}
      <div
        className="mt-auto min-h-[2rem] pointer-events-none"
        aria-hidden="true"
      />

      {/* Faint Watermark Grid */}
      <GridWatermark pattern={pattern} />
    </Link>
  );
}

