// Centered "New Game" pale-blue CTA.
// Visually distinct from all other sections — palette contrast signals user intent.

import Link from 'next/link';

export interface NewGameCtaProps {
  href?: string;
  onClick?: () => void;
}

export function NewGameCta({ href = '/play/sudoku_eazy', onClick }: NewGameCtaProps) {
  return (
    <div className="new-game-wrap">
      <Link href={href} onClick={onClick} className="new-game-cta">
        <span className="new-game-icon" aria-hidden="true">
          {/* Pencil / edit icon */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M16 3a2.828 2.828 0 014 4L7.5 19H4v-3.5L16 3z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.5 5.5l3 3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>

        <div className="new-game-text">
          <span className="new-game-title">New Game</span>
          <span className="new-game-sub">Create your own puzzle</span>
        </div>
      </Link>
    </div>
  );
}
