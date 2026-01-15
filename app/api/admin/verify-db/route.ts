/**
 * API Route: Database Integrity Verification
 * 
 * Checks the UUID count in Firestore to verify database integrity.
 * This endpoint is safe to call frequently as it's a read-only operation.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Only import firebase-admin on the server
    const { adminDb } = await import('@/lib/firebaseAdmin');

    // Count UUIDs in the og_uuid collection
    const visitorCount = await adminDb.collection('og_uuid').count().get();
    const count = visitorCount.data().count;

    console.log('[Database API] ✅ Integrity verified:', count, 'UUIDs');

    return NextResponse.json({
      success: true,
      count,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('[Database API] ❌ Integrity check failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Database verification failed',
      },
      { status: 500 }
    );
  }
}
