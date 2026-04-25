// ═══════════════════════════════════════════
// SudoX — Game State Manager
// Pure TypeScript class, no React/DOM deps.
// ═══════════════════════════════════════════

import { displayVal, parseVal } from '@/lib/grid-utils';
import type { PuzzleData, StandardPuzzle, JigsawPuzzle, TwodokuPuzzle } from '@/lib/types';

export interface GameState {
  totalRows: number;
  totalCols: number;
  gridSize: number;
  cellValues: number[][];
  cellCorrect: boolean[][];
  solutionGrid: number[][] | null;
  cursorR: number;
  cursorC: number;
  activeMap: boolean[][];    // which cells are playable
  clueMap: boolean[][];      // which cells are original clues
  cellWasWrong: boolean[][]; // whether cell had an incorrect entry at any point
}

export class GameStateManager {
  private state: GameState;
  private puzzleData: PuzzleData;

  constructor(puzzleData: PuzzleData) {
    this.puzzleData = puzzleData;
    this.state = this.initState(puzzleData);
  }

  private initState(data: PuzzleData): GameState {
    let totalRows: number;
    let totalCols: number;
    let gridSize: number;
    let grid: number[][];
    let activeMap: boolean[][];
    let solutionGrid: number[][] | null = data.solution ?? null;

    if (data.type === 'twodoku') {
      totalRows = data.totalRows;
      totalCols = data.totalCols;
      gridSize = data.grids?.[0]?.size ?? 9;
      grid = data.grid;
      activeMap = data.active.map(row => row.map(v => !!v));
    } else {
      // standard or jigsaw
      const size = data.size;
      totalRows = size;
      totalCols = size;
      gridSize = size;
      grid = data.grid;
      activeMap = Array.from({ length: size }, () => new Array(size).fill(true));
    }

    // Build clue map and initial cell values
    const clueMap = Array.from({ length: totalRows }, () => new Array(totalCols).fill(false));
    const cellValues = Array.from({ length: totalRows }, () => new Array(totalCols).fill(0));
    const cellCorrect = Array.from({ length: totalRows }, () => new Array(totalCols).fill(false));
    const cellWasWrong = Array.from({ length: totalRows }, () => new Array(totalCols).fill(false));

    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        if (grid[r][c] !== 0) {
          clueMap[r][c] = true;
          cellValues[r][c] = grid[r][c];
        }
      }
    }

    return {
      totalRows,
      totalCols,
      gridSize,
      cellValues,
      cellCorrect,
      solutionGrid,
      cursorR: -1,
      cursorC: -1,
      activeMap,
      clueMap,
      cellWasWrong,
    };
  }

  // ── Getters ──

  getState(): Readonly<GameState> {
    return this.state;
  }

  getPuzzleData(): PuzzleData {
    return this.puzzleData;
  }

  getMaxNum(): number {
    return this.state.gridSize;
  }

  isActive(r: number, c: number): boolean {
    if (r < 0 || c < 0 || r >= this.state.totalRows || c >= this.state.totalCols) return false;
    return this.state.activeMap[r][c];
  }

  isClue(r: number, c: number): boolean {
    return this.state.clueMap[r][c];
  }

  isCorrect(r: number, c: number): boolean {
    return this.state.cellCorrect[r][c];
  }

  getCellValue(r: number, c: number): number {
    return this.state.cellValues[r][c];
  }

  getCursor(): { r: number; c: number } {
    return { r: this.state.cursorR, c: this.state.cursorC };
  }

  isCompleted(): boolean {
    const { totalRows, totalCols, activeMap, clueMap, cellCorrect, solutionGrid } = this.state;
    if (!solutionGrid) return false;
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        if (!activeMap[r][c] || clueMap[r][c]) continue;
        if (!cellCorrect[r][c]) return false;
      }
    }
    return true;
  }

  // ── Mutations ──

  moveCursor(r: number, c: number): GameState {
    this.state.cursorR = r;
    this.state.cursorC = c;
    return this.state;
  }

  writeValue(r: number, c: number, val: number): GameState {
    if (!this.isActive(r, c)) return this.state;
    if (this.isClue(r, c)) return this.state;
    if (this.state.cellCorrect[r][c]) return this.state;

    this.state.cellValues[r][c] = val;

    if (val === 0) {
      // Erased — no validation
    } else if (this.state.solutionGrid) {
      if (this.state.solutionGrid[r][c] === val) {
        this.state.cellCorrect[r][c] = true;
      } else {
        this.state.cellWasWrong[r][c] = true;
      }
    }

    return this.state;
  }

  eraseValue(r: number, c: number): GameState {
    return this.writeValue(r, c, 0);
  }

  // ── Highlight logic ──

  private getInvolvedGrids(r: number, c: number): import('@/lib/types').GridMeta[] {
    if (this.puzzleData.type !== 'twodoku') return [];
    return this.puzzleData.grids.filter(grid => 
      r >= grid.r && r < grid.r + grid.size &&
      c >= grid.c && c < grid.c + grid.size
    );
  }

  private isCellInGivenGrids(r: number, c: number, grids: import('@/lib/types').GridMeta[]): boolean {
    return grids.some(grid => 
      r >= grid.r && r < grid.r + grid.size &&
      c >= grid.c && c < grid.c + grid.size
    );
  }

  /**
   * Returns a set of cells that should be highlighted (crosshair/matching)
   * based on the current cursor position.
   */
  getHighlightedCells(): Set<string> {
    const highlighted = new Set<string>();
    const { cursorR, cursorC, totalRows, totalCols, cellValues, activeMap, clueMap } = this.state;

    if (cursorR < 0 || cursorC < 0) return highlighted;
    if (!this.isActive(cursorR, cursorC)) return highlighted;

    const currentVal = cellValues[cursorR][cursorC];
    
    // For twodoku, only highlight within the specific grid(s) the cursor is in
    const invGrids = this.puzzleData.type === 'twodoku' 
      ? this.getInvolvedGrids(cursorR, cursorC) 
      : [];

    const isCellRelevant = (r: number, c: number) => {
      if (this.puzzleData.type !== 'twodoku') return true;
      return this.isCellInGivenGrids(r, c, invGrids);
    };

    const isSameGroup = (r: number, c: number, cr: number, cc: number) => {
      if (this.puzzleData.type === 'jigsaw') {
        const groups = (this.puzzleData as import('@/lib/types').JigsawPuzzle).groups;
        if (groups && groups[r] && groups[cr]) {
          return groups[r][c] === groups[cr][cc];
        }
      }
      return false;
    };

    const isDiagonalEnabled = this.puzzleData.type === 'standard' 
      ? (this.puzzleData as import('@/lib/types').StandardPuzzle).diagonals
      : this.puzzleData.type === 'jigsaw' 
      ? (this.puzzleData as import('@/lib/types').JigsawPuzzle).diagonals
      : false;

    let isOnMainDiag = false;
    let isOnAntiDiag = false;
    if (isDiagonalEnabled) {
      const size = this.puzzleData.type === 'standard' 
        ? (this.puzzleData as import('@/lib/types').StandardPuzzle).size 
        : (this.puzzleData as import('@/lib/types').JigsawPuzzle).size;
      if (cursorR === cursorC) isOnMainDiag = true;
      if (cursorR + cursorC === size - 1) isOnAntiDiag = true;
    }

    const isSameDiagonal = (r: number, c: number) => {
      if (!isDiagonalEnabled) return false;
      const size = this.puzzleData.type === 'standard' 
        ? (this.puzzleData as import('@/lib/types').StandardPuzzle).size 
        : (this.puzzleData as import('@/lib/types').JigsawPuzzle).size;
      return (isOnMainDiag && r === c) || (isOnAntiDiag && r + c === size - 1);
    };

    if (currentVal === 0) {
      // Empty cell: highlight same row + col + box/group + diagonals
      for (let r = 0; r < totalRows; r++) {
        for (let c = 0; c < totalCols; c++) {
          if (r === cursorR && c === cursorC) continue;
          if (!activeMap[r][c]) continue;
          if (!isCellRelevant(r, c)) continue;
          
          if (
            r === cursorR || 
            c === cursorC || 
            isSameGroup(r, c, cursorR, cursorC) ||
            isSameDiagonal(r, c)
          ) {
            highlighted.add(`${r},${c}`);
          }
        }
      }
    } else {
      // Numbered cell: highlight all cells with same number
      for (let r = 0; r < totalRows; r++) {
        for (let c = 0; c < totalCols; c++) {
          if (r === cursorR && c === cursorC) continue;
          if (!activeMap[r][c]) continue;
          if (!isCellRelevant(r, c)) continue;
          
          if (cellValues[r][c] === currentVal) {
            highlighted.add(`${r},${c}`);
          }
        }
      }
    }

    return highlighted;
  }

  // ── Exhaustion tracking ──

  /**
   * Count how many times a value appears as a correctly placed or clue cell.
   */
  countPlaced(val: number): number {
    let n = 0;
    const { totalRows, totalCols, activeMap, clueMap, cellValues, cellCorrect } = this.state;

    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        if (!activeMap[r][c]) continue;
        if (clueMap[r][c] && cellValues[r][c] === val) {
          n++;
          continue;
        }
        if (cellCorrect[r][c] && cellValues[r][c] === val) n++;
      }
    }
    return n;
  }

  /**
   * Count expected occurrences of a value in the solution.
   */
  countExpected(val: number): number {
    if (!this.state.solutionGrid) return Infinity;
    let n = 0;
    const { totalRows, totalCols, solutionGrid } = this.state;
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        if (solutionGrid![r]?.[c] === val) n++;
      }
    }
    return n;
  }

  isExhausted(val: number): boolean {
    return this.countPlaced(val) >= this.countExpected(val);
  }

  // ── Serialization for localStorage ──

  serialize(): { cellValues: number[][]; cellCorrect: boolean[][]; cellWasWrong?: boolean[][]; timerSeconds?: number } {
    return {
      cellValues: this.state.cellValues.map(row => [...row]),
      cellCorrect: this.state.cellCorrect.map(row => [...row]),
      cellWasWrong: this.state.cellWasWrong.map(row => [...row]),
    };
  }

  restore(saved: { cellValues: number[][]; cellCorrect: boolean[][]; cellWasWrong?: boolean[][] }): void {
    const { totalRows, totalCols } = this.state;
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        if (saved.cellValues[r]?.[c] !== undefined) {
          this.state.cellValues[r][c] = saved.cellValues[r][c];
        }
        if (saved.cellCorrect[r]?.[c] !== undefined) {
          this.state.cellCorrect[r][c] = saved.cellCorrect[r][c];
        }
        if (saved.cellWasWrong?.[r]?.[c] !== undefined) {
          this.state.cellWasWrong[r][c] = saved.cellWasWrong[r][c];
        } else {
          this.state.cellWasWrong[r][c] = false;
        }
      }
    }
  }

  // ── Find first empty cell ──

  findFirstEmptyCell(): { r: number; c: number } | null {
    const { totalRows, totalCols, activeMap, clueMap } = this.state;
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        if (activeMap[r][c] && !clueMap[r][c]) {
          return { r, c };
        }
      }
    }
    return null;
  }
}
