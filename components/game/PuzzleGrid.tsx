// ═══════════════════════════════════════════
// PuzzleGrid — renders the full puzzle grid
// Dispatches to standard/jigsaw/twodoku layout
// ═══════════════════════════════════════════

'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { GridCell } from './GridCell';
import { GameStateManager } from '@/services/GameStateManager';
import { getResponsiveCellSize, getMaxCellSize } from '@/lib/grid-utils';
import type { PuzzleData, StandardPuzzle, JigsawPuzzle, TwodokuPuzzle } from '@/lib/types';

interface PuzzleGridProps {
  manager: GameStateManager;
  stateVersion: number;
  onCellClick: (r: number, c: number) => void;
  game: string;
}

export function PuzzleGrid({ manager, stateVersion, onCellClick, game }: PuzzleGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(720);
  const state = manager.getState();
  const puzzleData = manager.getPuzzleData();

  // Measure container width for responsive cell sizing
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const style = getComputedStyle(containerRef.current);
        const pl = parseFloat(style.paddingLeft) || 0;
        const pr = parseFloat(style.paddingRight) || 0;
        setContainerWidth(containerRef.current.clientWidth - pl - pr);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const highlighted = useMemo(() => {
    return manager.getHighlightedCells();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager, stateVersion]);

  // Compute cell borders based on puzzle type
  const { cellSize, cells } = useMemo(() => {
    const { totalRows, totalCols } = state;

    let maxCell: number;
    if (puzzleData.type === 'twodoku') {
      maxCell = totalCols <= 10 ? 42 : totalCols <= 12 ? 36 : 30;
    } else if (puzzleData.type === 'jigsaw') {
      const size = (puzzleData as JigsawPuzzle).size;
      maxCell = size <= 8 ? 46 : 44;
    } else {
      maxCell = getMaxCellSize((puzzleData as StandardPuzzle).size);
    }

    const cellSize = getResponsiveCellSize(totalCols, maxCell, containerWidth);

    const cellArray: React.ReactNode[] = [];

    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const isActive = manager.isActive(r, c);
        const value = state.cellValues[r][c];
        const isClue = state.clueMap[r][c];
        const isCorrect = state.cellCorrect[r][c];
        const isWrong = !isClue && !isCorrect && value !== 0 &&
          state.solutionGrid !== null &&
          state.solutionGrid[r]?.[c] !== value;
        const wasWrong = state.cellWasWrong[r][c];
        const isCursor = state.cursorR === r && state.cursorC === c;
        const isCrosshair = highlighted.has(`${r},${c}`);

        // Compute visual flags
        const flags = computeCellFlags(puzzleData, r, c, game);
        const borders = computeBorders(puzzleData, r, c, state.totalRows, state.totalCols);

        cellArray.push(
          <GridCell
            key={`${r}-${c}`}
            row={r}
            col={c}
            value={value}
            isClue={isClue}
            isCorrect={isCorrect}
            isWrong={isWrong}
            wasWrong={wasWrong}
            isCursor={isCursor}
            isCrosshair={isCrosshair}
            isActive={isActive}
            isAltBlock={flags.isAltBlock}
            isDiagonal={flags.isDiagonal}
            isWindow={flags.isWindow}
            isBothCell={flags.isBothCell}
            cellSize={cellSize}
            borderTop={borders.top}
            borderBottom={borders.bottom}
            borderLeft={borders.left}
            borderRight={borders.right}
            onClick={onCellClick}
          />
        );
      }
    }

    return { cellSize, cells: cellArray };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager, stateVersion, containerWidth, puzzleData, game, highlighted, onCellClick]);

  return (
    <div className="puzzle-output" ref={containerRef}>
      <div
        className={`sudoku-grid ${puzzleData.type === 'twodoku' ? 'is-twodoku' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${state.totalCols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${state.totalRows}, ${cellSize}px)`,
        }}
      >
        {cells}
      </div>
    </div>
  );
}

// ── Helper: compute visual flags ──

function computeCellFlags(
  data: PuzzleData,
  r: number,
  c: number,
  game: string,
): { isAltBlock: boolean; isDiagonal: boolean; isWindow: boolean; isBothCell: boolean } {
  let isAltBlock = false;
  let isDiagonal = false;
  let isWindow = false;
  let isBothCell = false;

  if (data.type === 'standard') {
    const d = data as StandardPuzzle;
    const { size, subRows, subCols, diagonals, windows, altSubRows, altSubCols } = d;

    // Window cells
    if (windows) {
      for (const [wr, wc] of windows) {
        if (r >= wr && r < wr + 3 && c >= wc && c < wc + 3) {
          isWindow = true;
          break;
        }
      }
    }

    // Diagonal cells
    if (diagonals) {
      isDiagonal = r === c || r + c === size - 1;
    }

    // Both
    if (isDiagonal && isWindow) {
      isBothCell = true;
      isDiagonal = false;
      isWindow = false;
    }

    // Alt-block (checker pattern)
    if (altSubRows && altSubCols) {
      isAltBlock = (Math.floor(r / altSubRows) + Math.floor(c / altSubCols)) % 2 === 0;
    } else if (!diagonals && !windows) {
      isAltBlock = (Math.floor(r / subRows) + Math.floor(c / subCols)) % 2 === 1;
    }
  } else if (data.type === 'jigsaw') {
    const d = data as JigsawPuzzle;
    if (d.diagonals) isDiagonal = r === c || r + c === d.size - 1;
    if (d.windows) {
      for (const [wr, wc] of d.windows) {
        if (r >= wr && r < wr + 3 && c >= wc && c < wc + 3) {
          isWindow = true;
          break;
        }
      }
    }
  } else if (data.type === 'twodoku') {
    const d = data as TwodokuPuzzle;
    if (d.grids) {
      for (let gi = 0; gi < d.grids.length; gi++) {
        const g = d.grids[gi];
        if (!g.subR || !g.subC) continue;
        if (r >= g.r && r < g.r + g.size && c >= g.c && c < g.c + g.size) {
          const bR = Math.floor((r - g.r) / g.subR);
          const bC = Math.floor((c - g.c) / g.subC);
          const parity = game === 'twodoku_mini' ? (gi % 2 === 0 ? 1 : 0) : 1;
          isAltBlock = (bR + bC) % 2 === parity;
          break;
        }
      }
    }
  }

  return { isAltBlock, isDiagonal, isWindow, isBothCell };
}

// ── Helper: compute borders ──

function computeBorders(
  data: PuzzleData,
  r: number,
  c: number,
  totalRows: number,
  totalCols: number,
): { top: 'thick' | 'thin' | 'none'; bottom: 'thick' | 'thin' | 'none'; left: 'thick' | 'thin' | 'none'; right: 'thick' | 'thin' | 'none' } {
  type BorderWeight = 'thick' | 'thin' | 'none';
  const result: { top: BorderWeight; bottom: BorderWeight; left: BorderWeight; right: BorderWeight } = { top: 'thin', bottom: 'thin', left: 'thin', right: 'thin' };

  if (data.type === 'standard') {
    const d = data as StandardPuzzle;
    const { size, subRows, subCols } = d;
    if (r % subRows === 0) result.top = 'thick';
    if ((r + 1) % subRows === 0 || r === size - 1) result.bottom = 'thick';
    if (c % subCols === 0) result.left = 'thick';
    if ((c + 1) % subCols === 0 || c === size - 1) result.right = 'thick';
  } else if (data.type === 'jigsaw') {
    const d = data as JigsawPuzzle;
    const { size, groups } = d;
    const gid = groups[r][c];
    result.top = (r === 0 || groups[r - 1]?.[c] !== gid) ? 'thick' : 'thin';
    result.bottom = (r === size - 1 || groups[r + 1]?.[c] !== gid) ? 'thick' : 'thin';
    result.left = (c === 0 || groups[r][c - 1] !== gid) ? 'thick' : 'thin';
    result.right = (c === size - 1 || groups[r][c + 1] !== gid) ? 'thick' : 'thin';
  } else if (data.type === 'twodoku') {
    const d = data as TwodokuPuzzle;
    // Outer edge of active area
    if (!d.active[r - 1]?.[c]) result.top = 'thick';
    if (!d.active[r + 1]?.[c]) result.bottom = 'thick';
    if (!d.active[r]?.[c - 1]) result.left = 'thick';
    if (!d.active[r]?.[c + 1]) result.right = 'thick';

    // Sub-block borders within each grid
    if (d.grids) {
      for (const g of d.grids) {
        if (!g.subR || !g.subC) continue;
        if (r >= g.r && r < g.r + g.size && c >= g.c && c < g.c + g.size) {
          const nr = r - 1, nc = c - 1;
          // Top sub-block border
          if (r > g.r && (r - g.r) % g.subR === 0) result.top = 'thick';
          // Bottom
          if (r < g.r + g.size - 1 && (r - g.r + 1) % g.subR === 0) result.bottom = 'thick';
          // Left
          if (c > g.c && (c - g.c) % g.subC === 0) result.left = 'thick';
          // Right
          if (c < g.c + g.size - 1 && (c - g.c + 1) % g.subC === 0) result.right = 'thick';
        }
      }
    }

    // Jigsaw-style block borders
    if (d.blocks) {
      const bid = d.blocks[r]?.[c];
      if (bid !== undefined && bid >= 0) {
        if (d.active[r - 1]?.[c] && d.blocks[r - 1]?.[c] !== bid && d.blocks[r - 1]?.[c] >= 0) result.top = 'thick';
        if (d.active[r + 1]?.[c] && d.blocks[r + 1]?.[c] !== bid && d.blocks[r + 1]?.[c] >= 0) result.bottom = 'thick';
        if (d.active[r]?.[c - 1] && d.blocks[r]?.[c - 1] !== bid && d.blocks[r]?.[c - 1] >= 0) result.left = 'thick';
        if (d.active[r]?.[c + 1] && d.blocks[r]?.[c + 1] !== bid && d.blocks[r]?.[c + 1] >= 0) result.right = 'thick';
      }
    }
  }

  return result;
}
