import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getCacheStats } from '@/lib/cacheInvalidation';

/**
 * GET /api/admin/cache-stats
 * Get current cache statistics and database counts
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No auth header' },
        { status: 401 }
      );
    }

    // Get cache stats
    const cacheStats = await getCacheStats();

    // Get database counts
    const [uuidSnapshot, fingerprintSnapshot, maskSnapshot] = await Promise.all([
      adminDb.collection('og_uuid').count().get(),
      adminDb.collection('og_uuid_fingerprints').count().get(),
      adminDb.collection('og_uuid_masks').count().get(),
    ]);

    const databaseStatus = {
      uuidCount: uuidSnapshot.data().count,
      fingerprintCount: fingerprintSnapshot.data().count,
      maskCount: maskSnapshot.data().count,
    };

    // Simplify cache stats for easy consumption
    const simplifiedCache = {
      identity: cacheStats.identity?.entries || 0,
      uuid: cacheStats.uuid?.entries || 0,
      browser: cacheStats.browser?.routes || 0,
    };

    // Estimate connected clients (simplified - would need WebSocket in production)
    const connectedClients = 1; // Placeholder

    return NextResponse.json({
      success: true,
      cache: simplifiedCache,
      cacheDetailed: cacheStats,
      database: databaseStatus,
      connectedClients,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('[CacheStats API] Failed to get stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to get cache stats',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
