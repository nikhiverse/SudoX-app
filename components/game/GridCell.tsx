// ═══════════════════════════════════════════
// GridCell — single cell in the puzzle grid
// ═══════════════════════════════════════════

'use client';

import { memo } from 'react';
import { displayVal } from '@/lib/grid-utils';

interface GridCellProps {
  row: number;
  col: number;
  value: number;
  isClue: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  wasWrong: boolean;
  isCursor: boolean;
  isCrosshair: boolean;
  isActive: boolean;
  isAltBlock: boolean;
  isDiagonal: boolean;
  isWindow: boolean;
  isBothCell: boolean;
  cellSize: number;
  borderTop: 'outer' | 'thick' | 'thin' | 'none';
  borderBottom: 'outer' | 'thick' | 'thin' | 'none';
  borderLeft: 'outer' | 'thick' | 'thin' | 'none';
  borderRight: 'outer' | 'thick' | 'thin' | 'none';
  onClick: (r: number, c: number) => void;
  game?: string;
  cageSum?: number;
}

function borderStyle(type: 'outer' | 'thick' | 'thin' | 'none'): string {
  if (type === 'outer') return '3.5px solid var(--grid-border-thick)';
  if (type === 'thick') return '2.5px solid var(--grid-border-thick)';
  if (type === 'thin') return '1px solid var(--grid-border-thin)';
  return 'none';
}

function GridCellInner({
  row, col, value, isClue, isCorrect, isWrong, wasWrong,
  isCursor, isCrosshair, isActive, isAltBlock,
  isDiagonal, isWindow, isBothCell, cellSize,
  borderTop: bt, borderBottom: bb, borderLeft: bl, borderRight: br,
  onClick, game, cageSum,
}: GridCellProps) {
  if (!isActive) {
    return (
      <div
        className="grid-cell inactive-cell"
        aria-hidden="true"
        style={{
          width: cellSize,
          height: cellSize,
        }}
      />
    );
  }

  const isChessPiece =
    (game === 'sudox_king' && value === 1) ||
    (game === 'sudox_queen' && value === 9) ||
    (game === 'sudox_royal' && (value === 1 || value === 9));

  const classes = ['grid-cell'];
  if (isClue) classes.push('clue');
  if (isAltBlock) classes.push('alt-block');
  if (isBothCell) classes.push('both-cell');
  else if (isDiagonal) classes.push('diagonal-cell');
  else if (isWindow) classes.push('window-cell');
  if (isCrosshair) classes.push('crosshair');
  if (isCursor) classes.push('cursor');
  if (isCorrect) classes.push('correct');
  if (wasWrong) classes.push('was-wrong');
  if (isWrong) classes.push('wrong');
  if (isChessPiece) classes.push('chess-piece');

  const formattedVal = displayVal(value, game);
  const ariaLabel = `Row ${row + 1}, column ${col + 1}${value ? `, value ${formattedVal}` : ', empty'}${isClue ? ', clue' : ''}`;

  return (
    <div
      role="gridcell"
      aria-label={ariaLabel}
      aria-selected={isCursor}
      className={classes.join(' ')}
      style={{
        position: 'relative',
        width: cellSize,
        height: cellSize,
        fontSize: isChessPiece ? cellSize * 0.58 : cellSize * 0.48,
        borderTop: borderStyle(bt),
        borderBottom: borderStyle(bb),
        borderLeft: borderStyle(bl),
        borderRight: borderStyle(br),
      }}
      onClick={() => onClick(row, col)}
    >
      {cageSum !== undefined && (
        <span
          className="cage-sum"
          style={{
            position: 'absolute',
            top: 2,
            left: 3,
            fontSize: Math.max(9, Math.round(cellSize * 0.24)),
            lineHeight: 1,
            fontWeight: 700,
            opacity: 0.85,
            color: 'var(--text-muted, #94a3b8)',
            pointerEvents: 'none',
          }}
        >
          {cageSum}
        </span>
      )}
      {formattedVal}
    </div>
  );
}

export const GridCell = memo(GridCellInner);
