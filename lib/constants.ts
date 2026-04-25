// ═══════════════════════════════════════════
// SudoX — Constants & Configuration
// ═══════════════════════════════════════════

import type { GameVariant } from './types';

// ── Valid game variants (must match C++ binary names) ──
export const VALID_GAMES: GameVariant[] = [
  'sudoku_mini',
  'sudoku_easy',
  'sudoku9',
  'sudoku_a',
  'sudokuX',
  'dozaku',
  'windoku',
  'windokuX',
  'windoku_jigsaw',
  'jigsaw8',
  'jigsaw9',
  'jigsawX',
  'twodoku_mini',
  'twodoku8',
  'twodoku9',
  'sudoku12',
];

// ── Display names for each variant ──
export const GAME_NAMES: Record<GameVariant, string> = {
  sudoku_mini: 'Sudoku Mini',
  sudoku_easy: 'Sudoku Eazy',
  sudoku9: 'Sudoku 9',
  sudoku_a: 'Sudoku A',
  sudokuX: 'Sudoku X',
  dozaku: 'Dozaku',
  windoku: 'Windoku',
  windokuX: 'Windoku X',
  windoku_jigsaw: 'Windoku Jigsaw',
  jigsaw8: 'Jigsaw 8',
  jigsaw9: 'Jigsaw 9',
  jigsawX: 'Jigsaw X',
  twodoku_mini: 'Twodoku Mini',
  twodoku8: 'Twodoku 8',
  twodoku9: 'Twodoku 9',
  sudoku12: 'Sudoku 12',
};

// ── Variation codes for puzzle ID generation ──
export const GAME_CODES: Record<GameVariant, string> = {
  sudoku_mini: '06',
  sudoku_easy: '90',
  sudoku9: '91',
  sudoku_a: '92',
  sudokuX: '93',
  dozaku: '13',
  windoku: '94',
  windokuX: '95',
  windoku_jigsaw: '11',
  jigsaw8: '08',
  jigsaw9: '09',
  jigsawX: '10',
  twodoku_mini: '07',
  twodoku8: '14',
  twodoku9: '15',
  sudoku12: '12',
};

// ── Aliases: games that use another game's binary ──
export const GAME_ALIASES: Partial<Record<GameVariant, GameVariant>> = {
  // Currently none — add here if a variant reuses another's binary
};

// ── Grid size for each variant (used by NumberPanel) ──
export const GAME_GRID_SIZE: Record<GameVariant, number> = {
  sudoku_mini: 6,
  sudoku_easy: 9,
  sudoku9: 9,
  sudoku_a: 9,
  sudokuX: 9,
  dozaku: 12,
  windoku: 9,
  windokuX: 9,
  windoku_jigsaw: 9,
  jigsaw8: 8,
  jigsaw9: 9,
  jigsawX: 9,
  twodoku_mini: 6,
  twodoku8: 8,
  twodoku9: 9,
  sudoku12: 12,
};

// ── Home page variant grid — display order ──
export const HOME_VARIANTS: GameVariant[] = [
  'sudoku_mini',
  'sudoku_easy',
  'sudoku9',
  'sudoku_a',
  'sudokuX',
  'windoku',
  'windokuX',
  'jigsaw8',
  'jigsaw9',
  'jigsawX',
  'windoku_jigsaw',
  'sudoku12',
  'dozaku',
  'twodoku_mini',
  'twodoku8',
  'twodoku9',
];

// ── Rate limiting ──
export const RATE_LIMIT = {
  windowMs: 60_000,   // 1 minute
  maxRequests: 60,     // 60 requests per window per IP
};

// ── localStorage key prefix ──
export const STORAGE_PREFIX = 'sudox';
export const STORAGE_KEEP_DAYS = 7;

// ── MongoDB collection name ──
export const PUZZLES_COLLECTION = 'daily_puzzles';

// ── URL mapping overrides ──
export function getVariantUrl(variant: string): string {
  if (variant === 'sudoku_easy') return 'sudoku_eazy';
  if (variant === 'sudoku_a') return 'sudokuA';
  return variant;
}

export function getVariantFromUrl(url: string): string {
  if (url === 'sudoku_eazy') return 'sudoku_easy';
  if (url === 'sudokuA') return 'sudoku_a';
  return url;
}
