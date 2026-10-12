// Premium pale-gold featured puzzle card.
// Used for "Today's Challenge" and "SudoX Special" on the Today homepage.
// These are UI-first placeholders — no real daily-selection logic is implemented.

import Link from 'next/link';
import { GridThumb } from './GridThumb';

export interface FeaturedCardProps {
  /** Small uppercase section label e.g. "TODAY'S CHALLENGE" */
  category: string;
  /** Puzzle display name e.g. "Sudoku X" */
  title: string;
  /** One or two sentence description */
  description: string;
  /** Play route */
  href: string;
  /** Which decorative grid number pattern to show */
  thumbPattern: 'challenge' | 'special';
}

export function FeaturedCard({
  category,
  title,
  description,
  href,
  thumbPattern,
}: FeaturedCardProps) {
  return (
    <article className="featured-card">
      <div className="featured-card-content">
        <p className="featured-card-category">{category}</p>
        <h3 className="featured-card-title">{title}</h3>
        <p className="featured-card-description">{description}</p>
        <Link
          href={href}
          className="featured-play"
          aria-label={`Play ${title}`}
        >
          <span aria-hidden="true">▶</span>
          Play
        </Link>
      </div>

      <div className="featured-card-preview">
        <GridThumb variant="featured" pattern={thumbPattern} />
      </div>
    </article>
  );
}
