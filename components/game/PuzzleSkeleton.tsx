// ═══════════════════════════════════════════
// PuzzleSkeleton — layout placeholder matching the variant shape
// ═══════════════════════════════════════════

'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { GAME_GRID_SIZE } from '@/lib/constants';
import { getResponsiveCellSize, getMaxCellSize } from '@/lib/grid-utils';
import type { GameVariant } from '@/lib/types';

interface PuzzleSkeletonProps {
  game: GameVariant;
  gameName: string;
}

export function PuzzleSkeleton({ game, gameName }: PuzzleSkeletonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(720);

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

  // Determine geometry of the variant
  const { totalRows, totalCols, gridSize, activeCells } = useMemo(() => {
    const size = GAME_GRID_SIZE[game] || 9;
    let rows = size;
    let cols = size;

    const active = new Set<string>();

    if (game.startsWith('twodoku')) {
      if (game === 'twodoku_mini') {
        rows = 10;
        cols = 10;
        for (let r = 0; r < 10; r++) {
          for (let c = 0; c < 10; c++) {
            if ((r < 6 && c < 6) || (r >= 4 && c >= 4)) {
              active.add(`${r},${c}`);
            }
          }
        }
      } else if (game === 'twodoku8') {
        rows = 12;
        cols = 12;
        for (let r = 0; r < 12; r++) {
          for (let c = 0; c < 12; c++) {
            if ((r < 8 && c < 8) || (r >= 4 && c >= 4 && r < 12 && c < 12)) {
              active.add(`${r},${c}`);
            }
          }
        }
      } else if (game === 'twodoku9') {
        rows = 15;
        cols = 15;
        for (let r = 0; r < 15; r++) {
          for (let c = 0; c < 15; c++) {
            if ((r < 9 && c < 9) || (r >= 6 && c >= 6 && r < 15 && c < 15)) {
              active.add(`${r},${c}`);
            }
          }
        }
      }
    } else {
      // Standard/Jigsaw
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          active.add(`${r},${c}`);
        }
      }
    }

    return { totalRows: rows, totalCols: cols, gridSize: size, activeCells: active };
  }, [game]);

  // Compute borders and cell sizes
  const { cellSize, cells } = useMemo(() => {
    let maxCell: number;
    if (game.startsWith('twodoku')) {
      maxCell = totalCols <= 10 ? 42 : totalCols <= 12 ? 36 : 30;
    } else {
      maxCell = getMaxCellSize(gridSize);
    }

    const cellSize = getResponsiveCellSize(totalCols, maxCell, containerWidth);

    const cellArray: React.ReactNode[] = [];

    const borderStyle = (type: 'outer' | 'thick' | 'thin' | 'none') => {
      if (type === 'outer') return '3.5px solid var(--grid-border-thick)';
      if (type === 'thick') return '2.5px solid var(--grid-border-thick)';
      if (type === 'thin') return '1px solid var(--grid-border-thin)';
      return 'none';
    };

    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const isActive = activeCells.has(`${r},${c}`);

        if (!isActive) {
          cellArray.push(
            <div
              key={`${r}-${c}`}
              className="grid-cell inactive-cell"
              style={{
                width: cellSize,
                height: cellSize,
              }}
            />
          );
          continue;
        }

        // Determine thick boundaries
        let bt: 'outer' | 'thick' | 'thin' | 'none' = 'thin';
        let bb: 'outer' | 'thick' | 'thin' | 'none' = 'thin';
        let bl: 'outer' | 'thick' | 'thin' | 'none' = 'thin';
        let br: 'outer' | 'thick' | 'thin' | 'none' = 'thin';

        if (game.startsWith('twodoku')) {
          let size = 9;
          const g1R = 0;
          const g1C = 0;
          let g2R = 0;
          let g2C = 0;
          let g1SubR = 3, g1SubC = 3, g2SubR = 3, g2SubC = 3;

          if (game === 'twodoku_mini') {
            size = 6;
            g2R = 4; g2C = 4;
            g1SubR = 2; g1SubC = 3;
            g2SubR = 3; g2SubC = 2;
          } else if (game === 'twodoku8') {
            size = 8;
            g2R = 4; g2C = 4;
            g1SubR = 4; g1SubC = 4;
            g2SubR = 4; g2SubC = 4;
          } else if (game === 'twodoku9') {
            size = 9;
            g2R = 6; g2C = 6;
            g1SubR = 3; g1SubC = 3;
            g2SubR = 3; g2SubC = 3;
          }

          const isG1 = r >= g1R && r < g1R + size && c >= g1C && c < g1C + size;
          const isG2 = r >= g2R && r < g2R + size && c >= g2C && c < g2C + size;

          const parentActive = (row: number, col: number) => {
            return (row >= g1R && row < g1R + size && col >= g1C && col < g1C + size) ||
                   (row >= g2R && row < g2R + size && col >= g2C && col < g2C + size);
          };

          bt = !parentActive(r - 1, c) ? 'outer' : 'thin';
          bb = !parentActive(r + 1, c) ? 'outer' : 'thin';
          bl = !parentActive(r, c - 1) ? 'outer' : 'thin';
          br = !parentActive(r, c + 1) ? 'outer' : 'thin';

          if (isG1) {
            if (r > g1R && (r - g1R) % g1SubR === 0) bt = 'thick';
            if (r < g1R + size - 1 && (r - g1R + 1) % g1SubR === 0) bb = 'thick';
            if (c > g1C && (c - g1C) % g1SubC === 0) bl = 'thick';
            if (c < g1C + size - 1 && (c - g1C + 1) % g1SubC === 0) br = 'thick';
          }
          if (isG2) {
            if (r > g2R && (r - g2R) % g2SubR === 0) bt = 'thick';
            if (r < g2R + size - 1 && (r - g2R + 1) % g2SubR === 0) bb = 'thick';
            if (c > g2C && (c - g2C) % g2SubC === 0) bl = 'thick';
            if (c < g2C + size - 1 && (c - g2C + 1) % g2SubC === 0) br = 'thick';
          }
        } else {
          // Standard block layout
          let subRows = 3;
          let subCols = 3;
          if (game === 'sudoku_mini') {
            subRows = 2;
            subCols = 3;
          } else if (game === 'jigsaw8') {
            subRows = 4;
            subCols = 4;
          } else if (game === 'dozaku' || game === 'sudoku12') {
            subRows = 3;
            subCols = 4;
          }

          bt = r % subRows === 0 ? (r === 0 ? 'outer' : 'thick') : 'thin';
          bb = (r + 1) % subRows === 0 || r === totalRows - 1 ? (r === totalRows - 1 ? 'outer' : 'thick') : 'thin';
          bl = c % subCols === 0 ? (c === 0 ? 'outer' : 'thick') : 'thin';
          br = (c + 1) % subCols === 0 || c === totalCols - 1 ? (c === totalCols - 1 ? 'outer' : 'thick') : 'thin';
        }

        cellArray.push(
          <div
            key={`${r}-${c}`}
            className="skeleton-grid-cell skeleton-pulse"
            style={{
              width: cellSize,
              height: cellSize,
              borderTop: borderStyle(bt),
              borderBottom: borderStyle(bb),
              borderLeft: borderStyle(bl),
              borderRight: borderStyle(br),
            }}
          />
        );
      }
    }

    return { cellSize, cells: cellArray };
  }, [game, totalRows, totalCols, gridSize, activeCells, containerWidth]);

  // Render bottom number panel buttons
  const numButtons = useMemo(() => {
    const btns: React.ReactNode[] = [];
    for (let v = 1; v <= gridSize; v++) {
      btns.push(
        <div
          key={v}
          className="skeleton-num-btn skeleton-pulse"
        />
      );
    }
    return btns;
  }, [gridSize]);

  return (
    <>
      {/* Skeleton Header matching PuzzleHeader layout */}
      <div className="puzzle-header">
        <div className="puzzle-nav-row">
          <div className="nav-back skeleton-pulse" style={{ width: 100, border: 'none' }} />
          <div className="skeleton-timer skeleton-pulse" />
        </div>
        <div className="puzzle-title-row">
          <div className="puzzle-title-block">
            <h2 className="puzzle-title">{gameName}</h2>
            <div className="skeleton-id skeleton-pulse" style={{ marginTop: 8 }} />
          </div>
          <div className="skeleton-hearts skeleton-pulse" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="puzzle-output" ref={containerRef}>
        <div
          className={`sudoku-grid ${game.startsWith('twodoku') ? 'is-twodoku' : ''}`}
          style={{
            gridTemplateColumns: `repeat(${totalCols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${totalRows}, ${cellSize}px)`,
          }}
        >
          {cells}
        </div>
      </div>

      {/* Control panel skeleton */}
      <div className="num-panel">
        {numButtons}
        <div className="num-panel-divider" />
        <div className="skeleton-num-btn skeleton-pulse" style={{ backgroundColor: 'var(--wrong-bg)', borderColor: 'var(--border-mid)' }} />
      </div>
    </>
  );
}
