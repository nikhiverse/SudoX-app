'use client';

import React from 'react';
import Link from 'next/link';

export type VariantColorTheme = 'green' | 'purple' | 'peach';
export type VariantGridType =
  | '6x6'
  | '9x9'
  | '8x8'
  | 'twodoku'
  | 'twodoku-mini'
  | 'windoku'
  | 'x'
  | 'jigsaw'
  | 'royale';

export interface VariantCardProps {
  title: string;
  categoryLabel?: 'VARIANT' | 'LEVEL';
  sizeText: React.ReactNode;
  href: string;
  colorTheme: VariantColorTheme;
  gridType?: VariantGridType;
}

// ── Light pastel card themes (Strictly light pastels + dark bold text) ──
const THEME_STYLES: Record<
  VariantColorTheme,
  {
    cardBg: string;
    cardBorder: string;
    categoryText: string;
    sizeText: string;
    titleText: string;
  }
> = {
  green: {
    cardBg: 'bg-[#dbe7dc] hover:bg-[#d3e3d4]',
    cardBorder: 'border-[#c2d6c5]',
    categoryText: 'text-stone-600',
    sizeText: 'text-stone-900',
    titleText: 'text-stone-950',
  },
  purple: {
    cardBg: 'bg-[#e2daf0] hover:bg-[#dbd1ec]',
    cardBorder: 'border-[#cdc1e6]',
    categoryText: 'text-stone-600',
    sizeText: 'text-stone-900',
    titleText: 'text-stone-950',
  },
  peach: {
    cardBg: 'bg-[#f7dcc9] hover:bg-[#f3d4bf]',
    cardBorder: 'border-[#e8c6b1]',
    categoryText: 'text-stone-600',
    sizeText: 'text-stone-900',
    titleText: 'text-stone-950',
  },
};

// ── Subtle, semi-transparent watermark SVG grids (opacity-30 by default) ──
function GridIllustration({ type = '9x9' }: { type: VariantGridType }) {
  // Semi-transparent dark watermark strokes
  const lineThin = 'rgba(0, 0, 0, 0.18)';
  const lineThick = 'rgba(0, 0, 0, 0.38)';
  const gridBg = 'rgba(255, 255, 255, 0.22)';
  const gridBorder = 'rgba(0, 0, 0, 0.16)';
  const accentFill = 'rgba(0, 0, 0, 0.08)';

  // 1. 6x6 Grid (Sudoku Mini, Jigsaw Mini)
  if (type === '6x6') {
    const step = 112 / 6;
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full select-none" aria-hidden="true">
        <rect x="4" y="4" width="112" height="112" rx="10" fill={gridBg} stroke={gridBorder} strokeWidth="1.6" />
        {[1, 2, 3, 4, 5].map((i) => {
          const pos = 4 + i * step;
          const isMajorV = i === 3;
          const isMajorH = i === 2 || i === 4;
          return (
            <React.Fragment key={i}>
              <line
                x1={pos}
                y1="4"
                x2={pos}
                y2="116"
                stroke={isMajorV ? lineThick : lineThin}
                strokeWidth={isMajorV ? '1.8' : '0.9'}
              />
              <line
                x1="4"
                y1={pos}
                x2="116"
                y2={pos}
                stroke={isMajorH ? lineThick : lineThin}
                strokeWidth={isMajorH ? '1.8' : '0.9'}
              />
            </React.Fragment>
          );
        })}
      </svg>
    );
  }

  // 2. Twodoku Mini & Twodoku (Overlapping Grids)
  if (type === 'twodoku' || type === 'twodoku-mini') {
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full select-none" aria-hidden="true">
        {/* Top-Left Grid */}
        <rect x="6" y="6" width="72" height="72" rx="8" fill={gridBg} stroke={gridBorder} strokeWidth="1.5" />
        {/* Bottom-Right Grid */}
        <rect x="42" y="42" width="72" height="72" rx="8" fill={gridBg} stroke={gridBorder} strokeWidth="1.5" />
        {/* Overlapping intersection */}
        <rect x="42" y="42" width="36" height="36" fill={accentFill} stroke={lineThick} strokeWidth="1.2" strokeDasharray="3 2" />
        {/* Internal grid lines */}
        {[1, 2, 3, 4, 5].map((i) => (
          <React.Fragment key={i}>
            <line x1={6 + i * 12} y1="6" x2={6 + i * 12} y2="78" stroke={lineThin} strokeWidth="0.8" />
            <line x1="6" y1={6 + i * 12} x2="78" y2={6 + i * 12} stroke={lineThin} strokeWidth="0.8" />
            <line x1={42 + i * 12} y1="42" x2={42 + i * 12} y2="114" stroke={lineThin} strokeWidth="0.8" />
            <line x1="42" y1={42 + i * 12} x2="114" y2={42 + i * 12} stroke={lineThin} strokeWidth="0.8" />
          </React.Fragment>
        ))}
      </svg>
    );
  }

  // 3. Windoku (Windows constraints)
  if (type === 'windoku') {
    const step = 112 / 9;
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full select-none" aria-hidden="true">
        <rect x="4" y="4" width="112" height="112" rx="10" fill={gridBg} stroke={gridBorder} strokeWidth="1.6" />
        {/* 4 Shaded Windoku Windows */}
        <rect x={4 + 1 * step} y={4 + 1 * step} width={3 * step} height={3 * step} fill={accentFill} />
        <rect x={4 + 5 * step} y={4 + 1 * step} width={3 * step} height={3 * step} fill={accentFill} />
        <rect x={4 + 1 * step} y={4 + 5 * step} width={3 * step} height={3 * step} fill={accentFill} />
        <rect x={4 + 5 * step} y={4 + 5 * step} width={3 * step} height={3 * step} fill={accentFill} />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const pos = 4 + i * step;
          const isMajor = i === 3 || i === 6;
          return (
            <React.Fragment key={i}>
              <line x1={pos} y1="4" x2={pos} y2="116" stroke={isMajor ? lineThick : lineThin} strokeWidth={isMajor ? '1.8' : '0.8'} />
              <line x1="4" y1={pos} x2="116" y2={pos} stroke={isMajor ? lineThick : lineThin} strokeWidth={isMajor ? '1.8' : '0.8'} />
            </React.Fragment>
          );
        })}
      </svg>
    );
  }

  // 4. Sudoku X (Diagonals)
  if (type === 'x') {
    const step = 112 / 9;
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full select-none" aria-hidden="true">
        <rect x="4" y="4" width="112" height="112" rx="10" fill={gridBg} stroke={gridBorder} strokeWidth="1.6" />
        <line x1="8" y1="8" x2="112" y2="112" stroke={accentFill} strokeWidth="8" strokeLinecap="round" />
        <line x1="112" y1="8" x2="8" y2="112" stroke={accentFill} strokeWidth="8" strokeLinecap="round" />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const pos = 4 + i * step;
          const isMajor = i === 3 || i === 6;
          return (
            <React.Fragment key={i}>
              <line x1={pos} y1="4" x2={pos} y2="116" stroke={isMajor ? lineThick : lineThin} strokeWidth={isMajor ? '1.8' : '0.8'} />
              <line x1="4" y1={pos} x2="116" y2={pos} stroke={isMajor ? lineThick : lineThin} strokeWidth={isMajor ? '1.8' : '0.8'} />
            </React.Fragment>
          );
        })}
      </svg>
    );
  }

  // 5. 8x8 Grid
  if (type === '8x8') {
    const step = 112 / 8;
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full select-none" aria-hidden="true">
        <rect x="4" y="4" width="112" height="112" rx="10" fill={gridBg} stroke={gridBorder} strokeWidth="1.6" />
        {[1, 2, 3, 4, 5, 6, 7].map((i) => {
          const pos = 4 + i * step;
          const isMajor = i === 4;
          return (
            <React.Fragment key={i}>
              <line x1={pos} y1="4" x2={pos} y2="116" stroke={isMajor ? lineThick : lineThin} strokeWidth={isMajor ? '1.8' : '0.8'} />
              <line x1="4" y1={pos} x2="116" y2={pos} stroke={isMajor ? lineThick : lineThin} strokeWidth={isMajor ? '1.8' : '0.8'} />
            </React.Fragment>
          );
        })}
      </svg>
    );
  }

  // 6. Jigsaw Grid (Irregular shapes)
  if (type === 'jigsaw') {
    const step = 112 / 9;
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full select-none" aria-hidden="true">
        <rect x="4" y="4" width="112" height="112" rx="10" fill={gridBg} stroke={gridBorder} strokeWidth="1.6" />
        <path
          d={`M ${4 + 3 * step} 4 V ${4 + 4 * step} H ${4 + 5 * step} V ${4 + 7 * step} H ${4 + 8 * step} V 116`}
          stroke={lineThick}
          strokeWidth="2"
          fill="none"
        />
        <path
          d={`M 4 ${4 + 3 * step} H ${4 + 4 * step} V ${4 + 5 * step} H ${4 + 7 * step} V 116`}
          stroke={lineThick}
          strokeWidth="2"
          fill="none"
        />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const pos = 4 + i * step;
          return (
            <React.Fragment key={i}>
              <line x1={pos} y1="4" x2={pos} y2="116" stroke={lineThin} strokeWidth="0.8" />
              <line x1="4" y1={pos} x2="116" y2={pos} stroke={lineThin} strokeWidth="0.8" />
            </React.Fragment>
          );
        })}
      </svg>
    );
  }

  // 7. Royale (Crown accent)
  if (type === 'royale') {
    const step = 112 / 9;
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full select-none" aria-hidden="true">
        <rect x="4" y="4" width="112" height="112" rx="10" fill={gridBg} stroke={gridBorder} strokeWidth="1.6" />
        <path
          d="M 44 48 L 52 64 L 60 48 L 68 64 L 76 48 L 74 72 H 46 Z"
          fill={accentFill}
          stroke={lineThick}
          strokeWidth="1.4"
        />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const pos = 4 + i * step;
          const isMajor = i === 3 || i === 6;
          return (
            <React.Fragment key={i}>
              <line x1={pos} y1="4" x2={pos} y2="116" stroke={isMajor ? lineThick : lineThin} strokeWidth={isMajor ? '1.8' : '0.8'} />
              <line x1="4" y1={pos} x2="116" y2={pos} stroke={isMajor ? lineThick : lineThin} strokeWidth={isMajor ? '1.8' : '0.8'} />
            </React.Fragment>
          );
        })}
      </svg>
    );
  }

  // 8. Standard 9x9 Grid (Sudoku Classic, Eazy, Medium, Hard)
  const step = 112 / 9;
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full select-none" aria-hidden="true">
      <rect x="4" y="4" width="112" height="112" rx="10" fill={gridBg} stroke={gridBorder} strokeWidth="1.6" />
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
        const pos = 4 + i * step;
        const isMajor = i === 3 || i === 6;
        return (
          <React.Fragment key={i}>
            <line
              x1={pos}
              y1="4"
              x2={pos}
              y2="116"
              stroke={isMajor ? lineThick : lineThin}
              strokeWidth={isMajor ? '1.8' : '0.8'}
            />
            <line
              x1="4"
              y1={pos}
              x2="116"
              y2={pos}
              stroke={isMajor ? lineThick : lineThin}
              strokeWidth={isMajor ? '1.8' : '0.8'}
            />
          </React.Fragment>
        );
      })}
    </svg>
  );
}

export function VariantCard({
  title,
  categoryLabel = 'VARIANT',
  sizeText,
  href,
  colorTheme,
  gridType = '9x9',
}: VariantCardProps) {
  const theme = THEME_STYLES[colorTheme];

  return (
    <Link
      href={href}
      className={`group relative flex flex-col justify-between w-full h-[330px] sm:h-[350px] md:h-[370px] p-6 rounded-[28px] border transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] no-underline text-left cursor-pointer overflow-hidden ${theme.cardBg} ${theme.cardBorder}`}
      aria-label={`Play ${title} — ${categoryLabel} ${typeof sizeText === 'string' ? sizeText : ''}`}
    >
      {/* Absolute grid watermark at top center (fills ~82% width of the card) */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-[82%] aspect-square pointer-events-none opacity-30 group-hover:opacity-45 transition-opacity duration-200 select-none">
        <GridIllustration type={gridType} />
      </div>

      {/* Empty flex-grow spacer to push bottom text container cleanly to the bottom */}
      <div className="flex-grow pointer-events-none" aria-hidden="true" />

      {/* Bottom metadata container: protected by parent p-6 so text never touches the edge */}
      <div className="relative z-10 w-full flex flex-col gap-1.5">
        {/* Horizontal flex row with justify-between and items-baseline for perfect cross alignment */}
        <div className="flex items-baseline justify-between w-full">
          <span className={`${theme.categoryText} font-semibold tracking-widest text-[11px] sm:text-xs uppercase leading-none`}>
            {categoryLabel}
          </span>
          <span className={`${theme.sizeText} font-normal font-mono text-xs sm:text-sm leading-none`}>
            {sizeText}
          </span>
        </div>

        {/* Large bold game title directly underneath */}
        <h3 className={`text-2xl sm:text-[28px] font-black tracking-tight leading-tight ${theme.titleText}`}>
          {title}
        </h3>
      </div>
    </Link>
  );
}

