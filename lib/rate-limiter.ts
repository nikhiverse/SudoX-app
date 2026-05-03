// ═══════════════════════════════════════════
// SudoX — Redis-backed Rate Limiter
// ═══════════════════════════════════════════

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { RATE_LIMIT } from './constants';

// Create a new ratelimiter, that allows ${RATE_LIMIT.maxRequests} requests per ${RATE_LIMIT.windowMs} ms
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(RATE_LIMIT.maxRequests, `${Math.floor(RATE_LIMIT.windowMs / 1000)} s`),
  analytics: true,
});

/**
 * Check if a request from the given IP is within rate limits.
 * Returns true if allowed, false if rate-limited.
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  // If no Redis URL is provided, fail open (allow all) to prevent breaking the app
  // during local development if the developer hasn't set up Upstash yet.
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    console.warn('UPSTASH_REDIS_REST_URL is missing. Rate limiting is disabled.');
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
