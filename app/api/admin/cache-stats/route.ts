import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getCacheStats } from '@/lib/cacheInvalidation';
import { cacheStats, memoryCache } from '@/lib/cache';
import { isRedisEnabled } from '@/lib/redis';

/**
 * GET /api/admin/cache-stats
 * Get current cache statistics and database counts
 * 
 * 🔥 Enhanced with 3-layer cache monitoring
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

    // Get legacy cache stats
    const legacyCacheStats = await getCacheStats();

    // Get 3-layer cache stats (new system)
    const layeredCacheReport = cacheStats.getReport();
    const memoryCacheStats = memoryCache.getStats();

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
      identity: legacyCacheStats.identity?.entries || 0,
      uuid: legacyCacheStats.uuid?.entries || 0,
      browser: legacyCacheStats.browser?.routes || 0,
    };

    return NextResponse.json({
      success: true,
      // 3-Layer Cache System (NEW)
      layeredCache: {
        enabled: true,
        redisEnabled: isRedisEnabled(),
        hitRatio: layeredCacheReport.hitRatio,
        firebaseRatio: layeredCacheReport.firebaseRatio,
        status: layeredCacheReport.status,
        uptime: layeredCacheReport.uptime,
        metrics: layeredCacheReport.metrics,
        memoryCache: memoryCacheStats,
      },
      // Legacy cache stats
      cache: simplifiedCache,
      cacheDetailed: legacyCacheStats,
      database: databaseStatus,
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
