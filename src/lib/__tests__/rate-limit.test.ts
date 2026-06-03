import { checkRateLimit, getRateLimitHeaders, RATE_LIMIT } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear the rate limit store before each test by testing a new IP
    jest.clearAllMocks();
  });

  it('should allow requests within limit', () => {
    const testIp = '192.168.1.100-test-1';
    const result = checkRateLimit(testIp);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(RATE_LIMIT.requests - 1);
  });

  it('should track multiple requests', () => {
    const testIp = '192.168.1.100-test-2';
    
    // Make requests up to the limit
    for (let i = 0; i < RATE_LIMIT.requests; i++) {
      const result = checkRateLimit(testIp);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(RATE_LIMIT.requests - i - 1);
    }

    // Next request should be blocked
    const blocked = checkRateLimit(testIp);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('should return rate limit headers', () => {
    const remaining = 5;
    const resetTime = Date.now() + 3600000;
    
    const headers = getRateLimitHeaders(remaining, resetTime);
    
    expect(headers['X-RateLimit-Limit']).toBe(String(RATE_LIMIT.requests));
    expect(headers['X-RateLimit-Remaining']).toBe(String(remaining));
    expect(headers['X-RateLimit-Reset']).toBeDefined();
  });

  it('should have correct rate limit configuration', () => {
    expect(RATE_LIMIT.requests).toBeGreaterThan(0);
    expect(RATE_LIMIT.window).toBeGreaterThan(0);
  });
});
