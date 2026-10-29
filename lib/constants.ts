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
  'twodoku84',
  'twodoku86',
  'twodoku89',
  'twodoku98',
  'sudoku12',
  'jigsaw_mini',
  'sudox_king',
  'sudox_queen',
  'windoku6',
  'windoku8',
  'windoku_mixed',
  'queendoku',
  'flagdoku',
  'crossdoku',
  'sudoku_centroid',
  'twodoku6_jigsaw',
  'twodoku8_jigsaw',
  'twodoku9_jigsaw',
  'killer_sudoku',
  'sudox_royal',
];

// ── Display names for each variant ──
export const GAME_NAMES: Record<GameVariant, string> = {
  sudoku_mini: 'Sudoku Mini',
  sudoku_easy: 'Sudoku Eazy',
  sudoku9: 'Sudoku 9',
  sudoku_a: 'Sudoku A',
  sudokuX: 'Sudoku X',
  dozaku: 'Dozaku',
  windoku: 'Windoku 9',
  windokuX: 'Windoku X',
  windoku_jigsaw: 'Windoku Jigsaw',
  jigsaw8: 'Jigsaw 8',
  jigsaw9: 'Jigsaw 9',
  jigsawX: 'Jigsaw X',
  twodoku_mini: 'Twodoku Mini',
  twodoku8: 'Twodoku 8',
  twodoku9: 'Twodoku 9',
  twodoku84: 'Twodoku 84',
  twodoku86: 'Twodoku 86',
  twodoku89: 'Twodoku 89',
  twodoku98: 'Twodoku 98',
  sudoku12: 'Sudoku 12',
  jigsaw_mini: 'Jigsaw Mini',
  sudox_king: 'SudoX King',
  sudox_queen: 'SudoX Queen',
  windoku6: 'Windoku 6',
  windoku8: 'Windoku 8',
  windoku_mixed: 'Windoku Mixed',
  queendoku: 'Queendoku',
  flagdoku: 'Flagdoku',
  crossdoku: 'Crossdoku',
  sudoku_centroid: 'Sudoku Centroid',
  twodoku6_jigsaw: 'Twodoku 6 Jigsaw',
  twodoku8_jigsaw: 'Twodoku 8 Jigsaw',
  twodoku9_jigsaw: 'Twodoku 9 Jigsaw',
  killer_sudoku: 'Killer Sudoku',
  sudox_royal: 'SudoX Royal',
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
  twodoku84: '84',
  twodoku86: '86',
  twodoku89: '89',
  twodoku98: '81',
  sudoku12: '12',
  jigsaw_mini: '05',
  sudox_king: '01',
  sudox_queen: '02',
  windoku6: '60',
  windoku8: '80',
  windoku_mixed: '87',
  queendoku: '03',
  flagdoku: '50',
  crossdoku: '16',
  sudoku_centroid: '17',
  twodoku6_jigsaw: '62',
  twodoku8_jigsaw: '82',
  twodoku9_jigsaw: '97',
  killer_sudoku: '18',
  sudox_royal: '04',
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
  twodoku84: 8,
  twodoku86: 8,
  twodoku89: 8,
  twodoku98: 9,
  sudoku12: 12,
  jigsaw_mini: 6,
  sudox_king: 9,
  sudox_queen: 9,
  windoku6: 9,
  windoku8: 9,
  windoku_mixed: 9,
  queendoku: 10,
  flagdoku: 10,
  crossdoku: 9,
  sudoku_centroid: 9,
  twodoku6_jigsaw: 6,
  twodoku8_jigsaw: 8,
  twodoku9_jigsaw: 9,
  killer_sudoku: 9,
  sudox_royal: 9,
};

// ── Variants featured on the homepage ──
export const HOMEPAGE_VARIANTS: GameVariant[] = [
  'sudoku_mini',
  'jigsaw_mini',
  'twodoku_mini',
  'sudoku_easy',
  'sudoku9',
  'sudoku_a',
  'windoku8',
  'windoku',
  'windokuX',
  'jigsaw8',
  'jigsaw9',
  'jigsawX',
  'sudokuX',
  'twodoku86',
  'twodoku98',
  'twodoku9',
  'sudox_king',
  'sudox_queen',
  'flagdoku',
];

// ── Explore page variant grid — only variations not on the home page ──
export const EXPLORE_VARIANTS: GameVariant[] = VALID_GAMES.filter(
  (variant) => !HOMEPAGE_VARIANTS.includes(variant)
);

// ── Home page variant grid — display order (legacy alias) ──
export const HOME_VARIANTS: GameVariant[] = VALID_GAMES;

// ── Rate limiting ──
export const RATE_LIMIT = {
  windowMs: 60_000,   // 1 minute
  maxRequests: 60,     // 60 requests per window per IP
};

// ── localStorage key prefix ──
export const STORAGE_PREFIX = 'sudox';
export const STORAGE_KEEP_DAYS = 2;

// ── MongoDB collection name ──
export const PUZZLES_COLLECTION = 'daily_puzzles';

// ── Puzzle domain boundary ──
// The first date a puzzle was ever generated. Any ?date= value before this
// is guaranteed to not exist in MongoDB. Rejecting pre-launch dates at the
// routing layer means zero index lookups for the attacker's historical sweep.
// This must be the date the database was FIRST SEEDED, not the public launch
// date. The lower-bound check rejects any ?date= before this, so if you set
// it to a future date you will 404 all legitimate requests until that day.
// To find the real value: db.daily_puzzles.find().sort({date:1}).limit(1)
export const PUZZLE_LAUNCH_DATE = '2026-08-08';

// ── URL mapping overrides ──
export function getVariantUrl(variant: string): string {
  if (variant === 'sudoku_easy') return 'sudoku_eazy';
  if (variant === 'sudoku_a') return 'sudokuA';
  if (variant === 'windoku') return 'windoku9';
  return variant;
}

export function getVariantFromUrl(url: string): string {
  if (url === 'sudoku_eazy') return 'sudoku_easy';
  if (url === 'sudokuA') return 'sudoku_a';
  if (url === 'windoku9') return 'windoku';
  return url;
}
