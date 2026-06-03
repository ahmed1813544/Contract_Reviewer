import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

/**
 * Legacy endpoint — deprecated, use /api/v1/analyze-contract instead
 * This endpoint forwards requests to the v1 endpoint for backward compatibility
 */
export async function POST(request: NextRequest) {
  logger.warn('Deprecated API endpoint used', { 
    path: '/api/analyze-contract',
    recommendation: 'Use /api/v1/analyze-contract instead',
  });

  try {
    // Forward to v1 endpoint
    const url = new URL(request.url);
    url.pathname = '/api/v1/analyze-contract';
    
    const forwardRequest = new NextRequest(url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    const response = await fetch(forwardRequest);
    return response;
  } catch (error) {
    logger.error('Legacy endpoint error', { 
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Failed to forward request' },
      { status: 500 }
    );
  }
}
