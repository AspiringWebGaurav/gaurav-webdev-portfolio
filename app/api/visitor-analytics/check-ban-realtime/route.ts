/**
 * Real-Time Ban Check API
 * POST /api/visitor-analytics/check-ban-realtime
 * 
 * Checks if a visitor is banned based on their client-generated mask
 * This replaces the proxy.ts ban check to avoid duplicate identity creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { translateMaskToUUID, firestoreGetVisitorDocument } from '@/lib/uuid-sync/server';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 30 requests per minute (ban checks happen on navigation)
    const rateLimitResult = await checkRateLimit(
      request,
      'banCheck',
      { windowMs: 60000, maxRequests: 30 }
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          banned: false, // Fail open - don't block on rate limit
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { mask } = body;

    if (!mask || typeof mask !== 'string') {
      return NextResponse.json(
        { error: 'Mask is required' },
        { status: 400 }
      );
    }

    try {
      // Translate mask to UUID
      const uuid = await translateMaskToUUID(mask);
      
      // Get visitor document to check ban status
      const visitorDoc = await firestoreGetVisitorDocument(uuid);
      
      if (visitorDoc && visitorDoc.banned === true) {
        console.log('[Real-Time Ban Check] Banned visitor detected:', mask);
        return NextResponse.json({
          banned: true,
          banReason: visitorDoc.banReason || 'Security Violation',
          banCategory: visitorDoc.banCategory || 'normal',
          uuid,
          mask,
        });
      }
      
      // Not banned
      return NextResponse.json({
        banned: false,
        mask,
        uuid,
      });
    } catch (error: any) {
      // Mask not found or error
      console.error('[Real-Time Ban Check] Error:', error.message);
      return NextResponse.json(
        { error: 'Failed to check ban status', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Real-Time Ban Check] Request error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
