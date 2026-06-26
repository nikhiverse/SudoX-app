// ═══════════════════════════════════════════
// SudoX — Redis-backed Rate Limiter
// ═══════════════════════════════════════════

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { RATE_LIMIT } from './constants';

// Create a new ratelimiter lazily only if Redis is configured.
// This prevents crashing during local development if Upstash env vars are missing.
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(RATE_LIMIT.maxRequests, `${Math.floor(RATE_LIMIT.windowMs / 1000)} s`),
    analytics: true,
  });
}

/**
 * Check if a request from the given IP is within rate limits.
 * Returns true if allowed, false if rate-limited.
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  // If no Redis URL is provided, fail open (allow all) to prevent breaking the app
  // during local development if the developer hasn't set up Upstash yet.
  if (!ratelimit) {
    console.warn('UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing. Rate limiting is disabled.');
    return true;
  }

  try {
    const { success } = await ratelimit.limit(ip);
    return success;
  } catch (error) {
    console.error('Rate limiter error:', error);
    // Fail open if Redis is down
    return true;
  }
}
