// Decorative static mini Sudoku grid used as a visual thumbnail.
// aria-hidden — carries no semantic information.

interface GridThumbProps {
  /** 'featured' = 4×4 with numbers, larger; 'card' = 4×4 empty, smaller */
  variant?: 'featured' | 'card';
  /** Which number pattern to use (only relevant for featured variant) */
  pattern?: 'challenge' | 'special';
}

/** Row-major cell values (0 = empty) for each featured card */
const PATTERNS: Record<string, number[]> = {
  challenge: [0, 0, 7, 0,  0, 0, 0, 9,  9, 0, 0, 0,  0, 1, 0, 0],
  special:   [0, 0, 0, 5,  0, 8, 0, 3,  0, 0, 0, 0,  0, 0, 0, 6],
};

const EMPTY_16 = Array<number>(16).fill(0);

export function GridThumb({ variant = 'card', pattern = 'challenge' }: GridThumbProps) {
  const cells = variant === 'featured' ? (PATTERNS[pattern] ?? EMPTY_16) : EMPTY_16;

  return (
    <div
      aria-hidden="true"
      className={`grid-thumb grid-thumb--${variant}`}
    >
      {cells.map((num, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className="grid-thumb-cell">
          {num > 0 && <span className="grid-thumb-num">{num}</span>}
        </div>
      ))}
    </div>
  );
}
