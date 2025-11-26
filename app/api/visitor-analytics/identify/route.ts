/**
 * Visitor Identification API
 * POST /api/visitor-analytics/identify
 * Returns public mask for visitor
 */

import { NextRequest, NextResponse } from 'next/server';
import { identifyVisitor } from '@/lib/uuid-sync/server';
import { log, logError } from '@/lib/uuid-sync/utils';

// Request deduplication: prevent multiple calls for same fingerprint in short time
const activeRequests = new Map<string, Promise<string>>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fingerprint } = body;

    if (!fingerprint || typeof fingerprint !== 'string') {
      return NextResponse.json(
        { error: 'Invalid fingerprint' },
        { status: 400 }
      );
    }

    // Check if request already in progress for this fingerprint
    let maskPromise = activeRequests.get(fingerprint);
    
    if (!maskPromise) {
      // Create new request
      maskPromise = identifyVisitor(fingerprint).finally(() => {
        // Clean up after 5 seconds
        setTimeout(() => activeRequests.delete(fingerprint), 5000);
      });
      activeRequests.set(fingerprint, maskPromise);
    } else {
      log('Deduplicating concurrent request', { fingerprint: fingerprint.substring(0, 20) });
    }
    
    // Wait for result (either new or in-progress)
    const mask = await maskPromise;

    log('Visitor identified via API', { mask });

    return NextResponse.json({
      mask,
      success: true,
    });
  } catch (error: any) {
    logError('Identify API error', error);
    return NextResponse.json(
      { error: 'Failed to identify visitor', success: false },
      { status: 500 }
    );
  }
}
