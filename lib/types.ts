// ═══════════════════════════════════════════
// SudoX — Core TypeScript Types
// ═══════════════════════════════════════════

// ── Grid metadata (used inside TwodokuPuzzle) ──
export interface GridMeta {
  r: number;
  c: number;
  size: number;
  subR: number;
  subC: number;
}

// ── Puzzle types — derived from C++ JSON output ──

export interface CageInfo {
  id: number;
  sum: number;
  firstCell: [number, number];
  cells: [number, number][];
}

export interface StandardPuzzle {
  type: 'standard';
  size: number;
  subRows: number;
  subCols: number;
  grid: number[][];
  solution?: number[][];
  diagonals?: boolean;
  windows?: ([number, number] | [number, number, number, number])[];
  altSubRows?: number;
  altSubCols?: number;
  variant?: string;
  cages?: CageInfo[];
  cageMap?: number[][];
}

export interface JigsawPuzzle {
  type: 'jigsaw';
  size: number;
  grid: number[][];
  solution?: number[][];
  groups: number[][];
  diagonals?: boolean;
  windows?: ([number, number] | [number, number, number, number])[];
}

export interface TwodokuPuzzle {
  type: 'twodoku';
  totalRows: number;
  totalCols: number;
  grid: number[][];
  solution?: number[][];
  active: boolean[][];
  grids: GridMeta[];
  blocks?: number[][];
  overlap?: boolean[][];
  g1Groups?: number[][];
  g2Groups?: number[][];
}

export type PuzzleData = StandardPuzzle | JigsawPuzzle | TwodokuPuzzle;

// ── MongoDB document shapes ──

/** Puzzle-only document (grid data without solution) */
export interface PuzzleDoc {
  _id?: string;
  game: string;           // e.g. "sudoku9"
  date: string;           // "YYYY-MM-DD"
  type: 'puzzle';
  puzzleData: PuzzleData;
  uniqueId: string;       // "yymmddcc"
  generationId: string;   // "ddccrr"
  generatedAt: Date;
}

/** Solution-only document */
export interface SolutionDoc {
  _id?: string;
  game: string;
  date: string;
  type: 'solution';
  solution: number[][];
  uniqueId: string;
  generationId: string;
  generatedAt: Date;
}

/** Union type for any puzzle doc stored in daily_puzzles collection */
export type DailyPuzzleDoc = PuzzleDoc | SolutionDoc;

// ── API response ──

export interface PuzzleApiResponse {
  puzzleData: PuzzleData;
  encodedSolution?: string;  // XOR-encoded solution (opaque to DevTools)
  uniqueId: string;
  generationId: string;
  game: string;
  date: string;
}

export interface PuzzleApiError {
  error: string;
}

// ── Game state (for localStorage persistence) ──

export interface GameProgress {
  game: string;
  date: string;
  cellValues: number[][];
  cellCorrect: boolean[][];
  cellWasWrong?: boolean[][];
  timerSeconds: number;
  completed: boolean;
  finishedAt?: string;   // ISO timestamp when puzzle was solved
  lockedAt?: string;     // ISO timestamp when puzzle was locked (0 lives)
}

// ── Cell state for rendering ──

export type CellState =
  | 'empty'
  | 'clue'
  | 'correct'
  | 'wrong'
  | 'cursor'
  | 'crosshair';

export interface CellRenderInfo {
  row: number;
  col: number;
  value: number;
  displayValue: string;
  isClue: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  isCursor: boolean;
  isCrosshair: boolean;
  isActive: boolean;
  isAltBlock: boolean;
  isDiagonal: boolean;
  isWindow: boolean;
  isBothCell: boolean;
  borderTop: 'thick' | 'thin' | 'none';
  borderBottom: 'thick' | 'thin' | 'none';
  borderLeft: 'thick' | 'thin' | 'none';
  borderRight: 'thick' | 'thin' | 'none';
}

// ── Game variant key ──

export type GameVariant =
  | 'sudoku_mini'
  | 'sudoku_easy'
  | 'sudoku9'
  | 'sudoku_a'
  | 'sudokuX'
  | 'dozaku'
  | 'windoku'
  | 'windokuX'
  | 'windoku_jigsaw'
  | 'jigsaw8'
  | 'jigsaw9'
  | 'jigsawX'
  | 'twodoku_mini'
  | 'twodoku8'
  | 'twodoku9'
  | 'twodoku84'
  | 'twodoku86'
  | 'twodoku89'
  | 'twodoku98'
  | 'sudoku12'
  | 'jigsaw_mini'
  | 'sudox_king'
  | 'sudox_queen'
  | 'windoku6'
  | 'windoku8'
  | 'windoku_mixed'
  | 'queendoku'
  | 'flagdoku'
  | 'crossdoku'
  | 'sudoku_centroid'
  | 'twodoku6_jigsaw'
  | 'twodoku8_jigsaw'
  | 'twodoku9_jigsaw'
  | 'killer_sudoku'
  | 'sudox_royal';
