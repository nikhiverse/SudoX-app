// ═══════════════════════════════════════════
// SudoX — Solution Encoder / Decoder
// Prevents casual DevTools inspection of puzzle answers.
//
// Uses XOR cipher with the puzzle's uniqueId as key.
// NOT cryptographically secure — but raises the bar
// from "glance at JSON" to "reverse-engineer the codec".
// ═══════════════════════════════════════════

/**
 * Encode a solution grid into an opaque base64 string.
 * Used server-side in the API route before sending to clients.
 */
export function encodeSolution(solution: number[][], key: string): string {
  const json = JSON.stringify(solution);
  const encoded = Array.from(json)
    .map((ch, i) =>
      String.fromCharCode(ch.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    )
    .join('');
  // Use btoa-compatible encoding (works in Node via Buffer, in browser via btoa)
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(encoded, 'binary').toString('base64');
  }
  return btoa(encoded);
}

/**
 * Decode an encoded solution string back into a number[][].
 * Used client-side after receiving API data.
 */
export function decodeSolution(encoded: string, key: string): number[][] {
  let decoded: string;
  if (typeof Buffer !== 'undefined') {
    decoded = Buffer.from(encoded, 'base64').toString('binary');
  } else {
    decoded = atob(encoded);
  }
  const original = Array.from(decoded)
    .map((ch, i) =>
      String.fromCharCode(ch.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    )
    .join('');
  return JSON.parse(original);
}
