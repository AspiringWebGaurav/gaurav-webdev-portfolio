import { NextRequest, NextResponse } from 'next/server';
import { cacheDelete, cacheClear } from '@/lib/uuid-sync/server';

/**
 * Test endpoint to clear server-side caches
 * Used by test suite to ensure fresh data after Firestore updates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uuid } = body;

    if (uuid) {
      // Clear specific UUID-related cache entries
      cacheDelete(`mask_to_uuid_${uuid}`);
      cacheDelete(`uuid_to_mask_${uuid}`);
      cacheDelete(`ban_status_${uuid}`);
      
      // Also try to clear any mask-based entries (we don't know the mask, so clear all)
      cacheClear();
      
      return NextResponse.json(
        { success: true, cleared: 'specific' },
        { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
      );
    }

    // Clear all caches
    cacheClear();

    return NextResponse.json(
      { success: true, cleared: 'all' },
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    );
  } catch (error) {
    console.error('Clear cache error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500, headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    );
  }
}
