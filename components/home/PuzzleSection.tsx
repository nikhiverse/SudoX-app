// Puzzle section wrapper — shared by Minis, Classic, and Royale.
// Renders a semantic <section> with an h2 heading, optional subtitle,
// and a responsive grid of PuzzleCards.

import { PuzzleCard, type PuzzleCardProps } from './PuzzleCard';

export interface PuzzleSectionProps {
  /** Section heading e.g. "Classic" */
  title: string;
  /** Optional one-line subtitle */
  subtitle?: string;
  /** Puzzle cards to display (exactly 3 on desktop) */
  cards: readonly PuzzleCardProps[];
}

export function PuzzleSection({ title, subtitle, cards }: PuzzleSectionProps) {
  const sectionId = `section-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <section className="puzzle-section" aria-labelledby={sectionId}>
      <div className="puzzle-section-header">
        <h2 id={sectionId} className="puzzle-section-title">{title}</h2>
        {subtitle && (
          <p className="puzzle-section-subtitle">{subtitle}</p>
        )}
      </div>

      <div className="puzzle-card-grid">
        {cards.map((card) => (
          <PuzzleCard key={card.href} {...card} />
        ))}
      </div>
    </section>
  );
}
