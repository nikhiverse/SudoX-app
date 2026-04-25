// ═══════════════════════════════════════════
// SudoX — Grid Utility Functions
// ═══════════════════════════════════════════

/**
 * Convert numeric value to display character.
 * 0 → "", 1-9 → "1"-"9", 10+ → "A", "B", "C" …
 */
export function displayVal(v: number): string {
  if (v === 0) return '';
  if (v <= 9) return String(v);
  return String.fromCharCode(65 + v - 10); // 10→A, 11→B, 12→C …
}

/**
 * Parse a display character back to its numeric value.
 * "" or undefined → 0, "1"-"9" → 1-9, "A"/"a" → 10
 */
export function parseVal(ch: string | undefined): number {
  if (!ch) return 0;
  const n = parseInt(ch, 10);
  if (!isNaN(n)) return n;
  return ch.toUpperCase().charCodeAt(0) - 65 + 10; // A→10
}

/**
 * Get the maximum number for a given puzzle size.
 * Used to determine NumberPanel range.
 */
export function getMaxNum(size: number): number {
  return size;
}

/**
 * Calculate responsive cell size in pixels.
 * Ensures the grid fits within the available container width.
 */
export function getResponsiveCellSize(
  cols: number,
  maxCellSize: number,
  containerWidth: number,
  gridPadding: number = 6,
): number {
  const computed = Math.floor((containerWidth - gridPadding) / cols);
  return Math.min(computed, maxCellSize);
}

/**
 * Determine the maximum cell size based on grid dimensions.
 */
export function getMaxCellSize(size: number): number {
  if (size <= 9) return 44;
  if (size <= 12) return 36;
  return 30;
}

/**
 * Clock emoji array for timer rotation.
 */
export const CLOCK_EMOJIS = [
  '🕛', '🕐', '🕑', '🕒', '🕓', '🕔',
  '🕕', '🕖', '🕗', '🕘', '🕙', '🕚',
];

/**
 * Get clock emoji based on elapsed seconds.
 */
export function getClockEmoji(seconds: number): string {
  const idx = Math.floor(seconds / 5) % 12;
  return CLOCK_EMOJIS[idx];
}

/**
 * Format seconds into "m:ss" display string.
 */
export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
