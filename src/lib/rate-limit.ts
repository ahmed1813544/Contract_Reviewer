import { getIp } from '@/lib/ip';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limit store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

export const RATE_LIMIT = {
  requests: 10,
  window: 60 * 60 * 1000, // 1 hour in milliseconds
};

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetTime) {
    // New window or expired entry
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + RATE_LIMIT.window,
    };
    rateLimitStore.set(ip, newEntry);
    return {
      allowed: true,
      remaining: RATE_LIMIT.requests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Within existing window
  if (entry.count < RATE_LIMIT.requests) {
    entry.count++;
    return {
      allowed: true,
      remaining: RATE_LIMIT.requests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.resetTime,
  };
}

export function getRateLimitHeaders(
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(RATE_LIMIT.requests),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
  };
}
