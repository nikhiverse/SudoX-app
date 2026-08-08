// ═══════════════════════════════════════════
// SudoX — Date Utilities
// ═══════════════════════════════════════════

import { GAME_CODES } from './constants';
import type { GameVariant } from './types';

/**
 * Helper: Gets a precise YYYY-MM-DD string for a given date in IST.
 * Uses Intl.DateTimeFormat to avoid creating corrupted Date objects with mixed offsets.
 */
function getISTDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's date as "YYYY-MM-DD" in IST (Asia/Kolkata).
 * Guarantees puzzles roll over exactly at IST Midnight globally.
 */
export function getTodayDateString(): string {
  return getISTDateString();
}

/**
 * Returns tomorrow's date as "YYYY-MM-DD" in IST (Asia/Kolkata).
 */
export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setTime(tomorrow.getTime() + 24 * 60 * 60 * 1000);
  return getISTDateString(tomorrow);
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
  const targetDate = dateStr || getTodayDateString();
  const [year, month, day] = targetDate.split('-');
  
  const yy = year.slice(-2);
  const mm = month;
  const dd = day;
  const cc = GAME_CODES[game] || '00';
  
  return `${yy}${mm}${dd}${cc}`;
}

/**
 * Build the 6-digit generation ID: ddccrr.
 * If dateStr (YYYY-MM-DD) is provided, uses that day; otherwise uses current IST.
 */
export function buildGenerationId(game: GameVariant, dateStr?: string): string {
  const targetDate = dateStr || getTodayDateString();
  const dd = targetDate.split('-')[2];
  
  const cc = GAME_CODES[game] || '00';
  const rr = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
  
  return `${dd}${cc}${rr}`;
}
