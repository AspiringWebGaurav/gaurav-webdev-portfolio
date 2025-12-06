/**
 * Check Ban by Fingerprint API
 * 
 * CRITICAL: This endpoint only LOOKS UP existing identity - it NEVER creates new ones!
 * Used by the banned page to get mask without risking UUID creation.
 * 
 * POST /api/visitor-analytics/check-ban-by-fingerprint
 * Body: { fingerprint: string }
 * Returns: { banned: boolean, mask?: string, banReason?: string, banCategory?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

const COLLECTIONS = {
  FINGERPRINTS: 'og_uuid_fingerprints',
  VISITOR_PROFILES: 'og_uuid',
};

// Hash fingerprint (same as other files)
function hashFingerprint(fingerprint: string): string {
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fingerprint } = body;
    
    if (!fingerprint || typeof fingerprint !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid fingerprint',
      }, { status: 400 });
    }
    
    console.log('[CheckBanByFingerprint] Looking up identity for fingerprint (NO CREATE)');
    
    // Step 1: Look up fingerprint index
    const fpHash = hashFingerprint(fingerprint);
    const fpDoc = await adminDb.collection(COLLECTIONS.FINGERPRINTS).doc(fpHash).get();
    
    if (!fpDoc.exists) {
      // No identity found - return without creating
      // This is OK - user might have cleared browser data or fingerprint changed
      console.log('[CheckBanByFingerprint] No identity found for fingerprint');
      return NextResponse.json({
        success: true,
        found: false,
        banned: false, // Can't be banned if no identity
        mask: null,
      });
    }
    
    const fpData = fpDoc.data();
    const uuid = fpData?.uuid;
    const mask = fpData?.mask;
    
    if (!uuid) {
      console.log('[CheckBanByFingerprint] Fingerprint index has no UUID');
      return NextResponse.json({
        success: true,
        found: false,
        banned: false,
        mask: null,
      });
    }
    
    // Step 2: Get visitor profile to check ban status
    const visitorDoc = await adminDb.collection(COLLECTIONS.VISITOR_PROFILES).doc(uuid).get();
    
    if (!visitorDoc.exists) {
      // Fingerprint exists but visitor doesn't - inconsistent state
      console.warn('[CheckBanByFingerprint] Fingerprint index exists but visitor profile missing');
      return NextResponse.json({
        success: true,
        found: false,
        banned: false,
        mask: null,
      });
    }
    
    const visitorData = visitorDoc.data();
    
    console.log('[CheckBanByFingerprint] Found identity:', {
      mask: mask?.substring(0, 15),
      banned: visitorData?.banned,
    });
    
    return NextResponse.json({
      success: true,
      found: true,
      mask,
      uuid, // Include for debugging
      banned: visitorData?.banned === true,
      banReason: visitorData?.banReason || null,
      banCategory: visitorData?.banCategory || null,
    });
    
  } catch (error: any) {
    console.error('[CheckBanByFingerprint] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}
