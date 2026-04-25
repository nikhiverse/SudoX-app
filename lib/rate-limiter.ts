// ═══════════════════════════════════════════
// SudoX — In-Memory Sliding Window Rate Limiter
// ═══════════════════════════════════════════

import { RATE_LIMIT } from './constants';

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - RATE_LIMIT.windowMs;
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

/**
 * Check if a request from the given IP is within rate limits.
 * Returns true if allowed, false if rate-limited.
 */
export function checkRateLimit(ip: string): boolean {
  cleanupStaleEntries();

  const now = Date.now();
  const cutoff = now - RATE_LIMIT.windowMs;

  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  // Check if over limit
  if (entry.timestamps.length >= RATE_LIMIT.maxRequests) {
    return false;
  }

  // Record this request
  entry.timestamps.push(now);
  return true;
}

/**
 * Get remaining requests for an IP.
 */
export function getRemainingRequests(ip: string): number {
  const entry = store.get(ip);
  if (!entry) return RATE_LIMIT.maxRequests;

  const cutoff = Date.now() - RATE_LIMIT.windowMs;
  const recent = entry.timestamps.filter((t) => t > cutoff);
  return Math.max(0, RATE_LIMIT.maxRequests - recent.length);
}
