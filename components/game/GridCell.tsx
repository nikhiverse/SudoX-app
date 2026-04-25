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
  borderTop: 'thick' | 'thin' | 'none';
  borderBottom: 'thick' | 'thin' | 'none';
  borderLeft: 'thick' | 'thin' | 'none';
  borderRight: 'thick' | 'thin' | 'none';
  onClick: (r: number, c: number) => void;
}

function borderStyle(type: 'thick' | 'thin' | 'none'): string {
  if (type === 'thick') return '2.5px solid var(--grid-bg)';
  if (type === 'thin') return '1px solid var(--border-soft)';
  return '1px solid var(--border-soft)';
}

function GridCellInner({
  row, col, value, isClue, isCorrect, isWrong, wasWrong,
  isCursor, isCrosshair, isActive, isAltBlock,
  isDiagonal, isWindow, isBothCell, cellSize,
  borderTop: bt, borderBottom: bb, borderLeft: bl, borderRight: br,
  onClick,
}: GridCellProps) {
  if (!isActive) {
    return (
      <div
        className="grid-cell inactive-cell"
        style={{
          width: cellSize,
          height: cellSize,
        }}
      />
    );
  }

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

  return (
    <div
      className={classes.join(' ')}
      style={{
        width: cellSize,
        height: cellSize,
        fontSize: cellSize * 0.48,
        borderTop: borderStyle(bt),
        borderBottom: borderStyle(bb),
        borderLeft: borderStyle(bl),
        borderRight: borderStyle(br),
      }}
      onClick={() => onClick(row, col)}
    >
      {displayVal(value)}
    </div>
  );
}

export const GridCell = memo(GridCellInner);
