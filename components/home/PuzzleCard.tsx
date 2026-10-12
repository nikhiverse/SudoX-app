// Neutral puzzle card — shared component for Minis, Classic, and Royale sections.
// Horizontal layout: grid icon | name + size | circular arrow.
// Entire card is an accessible Link.

import Link from 'next/link';
import { GridThumb } from './GridThumb';

export interface PuzzleCardProps {
  /** Display name shown to the user e.g. "Eazy" */
  name: string;
  /** Grid dimensions shown below the name e.g. "9 × 9" */
  size: string;
  /** Navigation route e.g. "/play/sudoku_eazy" */
  href: string;
}

export function PuzzleCard({ name, size, href }: PuzzleCardProps) {
  return (
    <Link
      href={href}
      className="puzzle-card"
      aria-label={`Play ${name} — ${size} grid`}
    >
      <div className="puzzle-card-preview">
        <GridThumb variant="card" />
      </div>

      <div className="puzzle-card-content">
        <span className="puzzle-card-name">{name}</span>
        <span className="puzzle-card-size">{size}</span>
      </div>

      {/* Decorative circular arrow — whole card is already the link */}
      <span className="puzzle-card-action" aria-hidden="true">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 7h8M8 3.5L11.5 7 8 10.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}
