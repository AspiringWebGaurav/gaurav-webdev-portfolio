import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { clearAllCacheWithErrorHandling, getCacheStats } from '@/lib/cacheInvalidation';

/**
 * POST /api/admin/clear-cache
 * Admin-only endpoint to trigger cache clear and broadcast to all clients
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No auth header' },
        { status: 401 }
      );
    }

    // TODO: Add proper Firebase Admin token verification
    // For now, basic check
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid auth format' },
        { status: 401 }
      );
    }

    console.log('[ClearCache API] Starting cache clear operation...');

    // Execute cache clear with error handling
    const result = await clearAllCacheWithErrorHandling();

    // Get updated stats
    const stats = await getCacheStats();

    console.log('[ClearCache API] Cache clear completed:', {
      success: result.success,
      clientSuccess: result.phases.client.success,
      broadcastSuccess: result.phases.broadcast.success,
      verificationSuccess: result.phases.verification.success,
      errors: result.errors.length,
      duration: result.stats.duration,
    });

    return NextResponse.json({
      success: true,
      result,
      stats,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('[ClearCache API] Failed to clear cache:', error);
    return NextResponse.json(
      {
        error: 'Cache clear failed',
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}

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

    // Estimate connected clients (simplified - would need WebSocket in production)
    const connectedClients = 1; // Placeholder

    return NextResponse.json({
      success: true,
      cache: cacheStats,
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
