// ═══════════════════════════════════════════
// SudoX — Date Utilities
// ═══════════════════════════════════════════

import { GAME_CODES } from './constants';
import type { GameVariant } from './types';

/**
 * Helper: Get current Date object localized to IST (Asia/Kolkata)
 */
export function getISTDate(): Date {
  // Create a date string in IST, then parse it back into a Date object
  // so we can use standard getFullYear(), getMonth(), etc.
  const istString = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(istString);
}

/**
 * Returns today's date as "YYYY-MM-DD" in IST (Asia/Kolkata).
 * Guarantees puzzles roll over exactly at IST Midnight globally.
 */
export function getTodayDateString(): string {
  const now = getISTDate();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns a localized long-format date string for display in the user's REAL local timezone.
 * e.g. "April 15, 2026"
 */
export function formatDisplayDate(): string {
  return new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Build the 8-digit unique puzzle ID: yymmddcc.
 * If dateStr (YYYY-MM-DD) is provided, uses that date; otherwise uses current IST.
 */
export function buildUniqueId(game: GameVariant, dateStr?: string): string {
  let yy: string, mm: string, dd: string;

  if (dateStr) {
    const [year, month, day] = dateStr.split('-');
    yy = year.slice(-2);
    mm = month;
    dd = day;
  } else {
    const now = getISTDate();
    yy = String(now.getFullYear()).slice(-2);
    mm = String(now.getMonth() + 1).padStart(2, '0');
    dd = String(now.getDate()).padStart(2, '0');
  }

  const cc = GAME_CODES[game] || '00';
  return `${yy}${mm}${dd}${cc}`;
}

/**
 * Build the 6-digit generation ID: ddccrr.
 * If dateStr (YYYY-MM-DD) is provided, uses that day; otherwise uses current IST.
 */
export function buildGenerationId(game: GameVariant, dateStr?: string): string {
  let dd: string;

  if (dateStr) {
    dd = dateStr.split('-')[2];
  } else {
    const now = getISTDate();
    dd = String(now.getDate()).padStart(2, '0');
  }

  const cc = GAME_CODES[game] || '00';
  const rr = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
  return `${dd}${cc}${rr}`;
}
