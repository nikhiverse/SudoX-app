'use client';

import { GridWatermark } from './GridWatermark';

export interface SeriesVariantOption {
  name: string;
  size: string;
  href: string;
  tagline?: string;
  badge?: string;
}

export interface SeriesCardProps {
  id: string;
  title: string;
  description: string;
  variationsText: string;
  pattern?: 'standard' | 'x' | 'windows';
  onClick: () => void;
}

export function SeriesCard({
  title,
  description,
  variationsText,
  pattern = 'standard',
  onClick,
}: SeriesCardProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex flex-col h-full p-6 md:p-8 rounded-2xl bg-white/70 hover:bg-white/90 active:bg-white backdrop-blur-md border border-black/10 hover:border-black/20 shadow-sm hover:shadow-md transition-all duration-300 ease-out hover:-translate-y-1 cursor-pointer overflow-hidden text-left"
      aria-label={`Open ${title} options — ${variationsText}`}
    >
      {/* Top content: Title, Description, and Variant list */}
      <div className="relative z-10 flex flex-col gap-1.5 max-w-[85%]">
        <h3 className="font-sans text-xl md:text-2xl font-bold text-stone-900 tracking-tight leading-snug">
          {title}
        </h3>
        <p className="text-sm text-stone-600 leading-relaxed mt-1">
          {description}
        </p>
        <p className="text-xs md:text-sm font-semibold text-stone-700 mt-2.5">
          {variationsText}
        </p>
      </div>

      {/* Reserved invisible structural footer placeholder for countdown timer */}
      <div
        className="mt-auto min-h-[2rem] pointer-events-none"
        aria-hidden="true"
      />

      {/* Faint Watermark Grid */}
      <GridWatermark pattern={pattern} />
    </article>
  );
}

