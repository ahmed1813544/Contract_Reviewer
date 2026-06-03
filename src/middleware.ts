import { NextRequest, NextResponse } from 'next/server';
import { getIp } from '@/lib/ip';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import logger from '@/lib/logger';

export function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = getIp(request);
    const { allowed, remaining, resetTime } = checkRateLimit(ip);

    const headers = getRateLimitHeaders(remaining, resetTime);

    if (!allowed) {
      logger.warn('Rate limit exceeded', { ip, endpoint: request.nextUrl.pathname });
      return new NextResponse('Too many requests. Please try again later.', {
        status: 429,
        headers,
      });
    }

    // Add rate limit headers to response
    const response = NextResponse.next();
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
}

export const config = {
  matcher: '/api/:path*',
};
