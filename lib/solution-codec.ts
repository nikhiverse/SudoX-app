// ═══════════════════════════════════════════
// SudoX — Solution Encoder / Decoder
// Prevents casual DevTools inspection of puzzle answers.
//
// Uses a multi-layered obfuscation strategy:
// Base64 -> String Reversal -> Salted XOR -> Base64 -> String Halving
// Raises the reverse-engineering bar significantly to protect score integrity.
// ═══════════════════════════════════════════

const SALT = 'SudoX_V3_Salt_9a7f4#';

/**
 * Encode a solution grid into a heavily obfuscated string.
 */
export function encodeSolution(solution: number[][], key: string): string {
  // 1. Convert to JSON
  const json = JSON.stringify(solution);
  
  // 2. Base64 encode the JSON
  const b64 = typeof Buffer !== 'undefined' ? Buffer.from(json).toString('base64') : btoa(json);
  
  // 3. Reverse the base64 string
  const reversed = b64.split('').reverse().join('');
  
  // 4. XOR with a salted key
  const saltedKey = key + SALT;
  const xored = Array.from(reversed)
    .map((ch, i) => String.fromCharCode(ch.charCodeAt(0) ^ saltedKey.charCodeAt(i % saltedKey.length)))
    .join('');
    
  // 5. Base64 encode the result again
  let finalEncoded = typeof Buffer !== 'undefined' ? Buffer.from(xored, 'binary').toString('base64') : btoa(xored);
  
  // 6. Swap halves of the string
  const mid = Math.floor(finalEncoded.length / 2);
  finalEncoded = finalEncoded.slice(mid) + finalEncoded.slice(0, mid);
  
  return finalEncoded;
}

/**
 * Decode the obfuscated solution string back into a number[][].
 */
export function decodeSolution(encoded: string, key: string): number[][] {
  // 1. Un-swap halves
  const mid = Math.ceil(encoded.length / 2);
  const unswapped = encoded.slice(mid) + encoded.slice(0, mid);
  
  // 2. Base64 decode
  const xored = typeof Buffer !== 'undefined' ? Buffer.from(unswapped, 'base64').toString('binary') : atob(unswapped);
  
  // 3. XOR with salted key
  const saltedKey = key + SALT;
  const reversed = Array.from(xored)
    .map((ch, i) => String.fromCharCode(ch.charCodeAt(0) ^ saltedKey.charCodeAt(i % saltedKey.length)))
    .join('');
    
  // 4. Reverse the string back
  const b64 = reversed.split('').reverse().join('');
  
  // 5. Base64 decode back to JSON
  const json = typeof Buffer !== 'undefined' ? Buffer.from(b64, 'base64').toString('utf8') : atob(b64);
  
  return JSON.parse(json);
}
