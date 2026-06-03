import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Check critical dependencies
    const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;

    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        api_key_configured: hasOpenRouterKey,
      },
    };

    if (!hasOpenRouterKey) {
      logger.warn('Health check: Missing OPENROUTER_API_KEY');
      return NextResponse.json(
        { ...status, status: 'degraded' },
        { status: 503 }
      );
    }

    return NextResponse.json(status);
  } catch (error) {
    logger.error('Health check failed', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { status: 'unhealthy', error: 'Internal server error' },
      { status: 500 }
    );
  }
}
