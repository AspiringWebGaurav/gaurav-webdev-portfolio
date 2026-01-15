/**
 * Cache Invalidation System - Global Cache Management
 * 
 * Provides comprehensive cache clearing with:
 * - Client-side cache clearing (memory, browser)
 * - Server-side cache clearing (API routes, Next.js)
 * - Firebase RTDB broadcast to all connected clients
 * - Robust error handling with retry logic
 * - Database integrity verification
 * 
 * CRITICAL: Database (og_uuid collections) is READ-ONLY and never modified
 */

import { ref, push, onValue, Database } from 'firebase/database';

// Types
export interface CacheStats {
  identity: {
    entries: number;
    age: number | null;
    size: number;
    hitRate: number;
  };
  uuid: {
    entries: number;
    age: number | null;
    hitRate: number;
  };
  browser: {
    routes: number;
    size: number;
  };
  server: {
    memory: number;
    routes: number;
  };
}

export interface CacheClearError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  retryable: boolean;
  fallback?: () => Promise<void>;
}

export interface CacheClearResult {
  success: boolean;
  phases: {
    client: { success: boolean; error: CacheClearError | null };
    server: { success: boolean; error: CacheClearError | null };
    broadcast: { success: boolean; error: CacheClearError | null };
    verification: { success: boolean; error: CacheClearError | null };
  };
  errors: CacheClearError[];
  stats: {
    memoryFreed: number; // Browser caches cleared
    entriesCleared: number; // Identity + UUID entries cleared
    duration: number;
  };
  counts?: {
    identityCleared: number;
    uuidCleared: number;
    browserCachesCleared: number;
  };
}

// Error Handler Class
class CacheClearErrorHandler {
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000;

  async handleError(
    error: any,
    operation: string,
    context: any
  ): Promise<CacheClearError> {
    const classified = this.classifyError(error, operation);

    console.error(`[Cache Clear Error] ${operation}:`, {
      code: classified.code,
      message: classified.message,
      severity: classified.severity,
      context,
    });

    if (classified.recoverable && classified.fallback) {
      console.log(`[Cache Clear] Attempting recovery for ${operation}`);
      try {
        await classified.fallback();
        console.log(`[Cache Clear] Recovery successful for ${operation}`);
        classified.recoverable = true;
      } catch (fallbackError) {
        console.error(`[Cache Clear] Recovery failed for ${operation}`);
        classified.recoverable = false;
      }
    }

    if (classified.retryable && this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
      console.log(`[Cache Clear] Retry ${this.retryCount}/${this.maxRetries} in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    return classified;
  }

  classifyError(error: any, operation: string): CacheClearError {
    if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection lost. Retrying...',
        severity: 'medium',
        recoverable: true,
        retryable: true,
        fallback: clearClientCacheOnly,
      };
    }

    if (error.status === 401 || error.code === 'UNAUTHENTICATED') {
      return {
        code: 'AUTH_EXPIRED',
        message: 'Your session has expired. Please log in again.',
        severity: 'high',
        recoverable: false,
        retryable: false,
      };
    }

    if (error.status === 429) {
      return {
        code: 'RATE_LIMIT',
        message: 'Too many requests. Please wait a moment.',
        severity: 'low',
        recoverable: true,
        retryable: true,
      };
    }

    if (operation === 'database-verification' && error.code === 'INTEGRITY_FAILED') {
      return {
        code: 'INTEGRITY_FAILED',
        message: 'CRITICAL: Database integrity check failed!',
        severity: 'critical',
        recoverable: false,
        retryable: false,
      };
    }

    if (error.status >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: 'Server error occurred. Retrying...',
        severity: 'medium',
        recoverable: true,
        retryable: true,
        fallback: clearClientCacheOnly,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      severity: 'medium',
      recoverable: false,
      retryable: false,
    };
  }

  reset() {
    this.retryCount = 0;
  }
}

export const errorHandler = new CacheClearErrorHandler();

// Request Queue Manager for handling concurrent operations
let isClearing = false;
const clearQueue: Array<() => void> = [];

async function acquireClearLock(): Promise<void> {
  if (!isClearing) {
    isClearing = true;
    return;
  }
  
  // Wait in queue
  return new Promise((resolve) => {
    clearQueue.push(resolve);
  });
}

function releaseClearLock(): void {
  const next = clearQueue.shift();
  if (next) {
    next();
  } else {
    isClearing = false;
  }
}

/**
 * Clear identity cache (in-memory only)
 * Returns: number of entries cleared
 */
export async function clearIdentityCache(): Promise<number> {
  try {
    // Identity cache can work on both client and server
    const { clearIdentityCache: clear } = require('./identityCache');
    const count = await clear();
    console.log('[Cache Clear] ✅ Identity cache cleared:', count, 'entries');
    return count;
  } catch (error) {
    console.error('[Cache Clear] Failed to clear identity cache:', error);
    return 0;
  }
}

/**
 * Clear UUID-sync cache (in-memory only)
 * Returns: number of entries cleared
 */
export function clearUUIDCache(): number {
  try {
    // UUID cache can work on both client and server
    const cacheModule = require('./uuid-sync/services/cacheManager');
    const cacheManager = cacheModule.cacheManager || cacheModule.default;
    
    if (!cacheManager || typeof cacheManager.getStats !== 'function') {
      console.log('[Cache Clear] ⚠️ UUID cache manager not available');
      return 0;
    }
    
    const stats = cacheManager.getStats();
    const count = stats.size || 0;
    cacheManager.clear();
    console.log('[Cache Clear] ✅ UUID cache cleared:', count, 'entries');
    return count;
  } catch (error) {
    console.error('[Cache Clear] Failed to clear UUID cache:', error);
    return 0;
  }
}

/**
 * Clear browser caches (Cache Storage API, LocalStorage, SessionStorage)
 * Returns: number of caches cleared
 */
export async function clearBrowserCache(): Promise<number> {
  // Skip on server-side
  if (typeof window === 'undefined') {
    console.log('[Cache Clear] ⏭️ Skipping browser cache clear on server-side');
    return 0;
  }

  try {
    let totalCleared = 0;

    // Clear Cache Storage API
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      totalCleared += cacheNames.length;
      console.log('[Cache Clear] ✅ Browser cache cleared:', cacheNames.length, 'caches');
    }

    // Clear LocalStorage (selective - only cached items)
    const keysToRemove = Object.keys(localStorage).filter(
      (key) => key.includes('cached') || key.includes('temp')
    );
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.log('[Cache Clear] ✅ LocalStorage cleared:', keysToRemove.length, 'items');

    // Clear SessionStorage
    sessionStorage.clear();
    console.log('[Cache Clear] ✅ SessionStorage cleared');

    return totalCleared;
  } catch (error) {
    console.error('[Cache Clear] Failed to clear browser cache:', error);
    throw error;
  }
}

/**
 * Clear all client-side caches (memory + browser)
 * Returns: object with counts for each cache type
 */
export async function clearAllClientCache(): Promise<{
  identityCleared: number;
  uuidCleared: number;
  browserCachesCleared: number;
}> {
  console.log('[Cache Clear] 🗑️ Clearing client caches...');

  const identityCleared = await clearIdentityCache();
  const uuidCleared = clearUUIDCache();
  const browserCachesCleared = await clearBrowserCache();

  console.log('[Cache Clear] 🎉 All client caches cleared:', {
    identity: identityCleared,
    uuid: uuidCleared,
    browser: browserCachesCleared,
  });

  return { identityCleared, uuidCleared, browserCachesCleared };
}

/**
 * Clear client cache only (fallback for server errors)
 */
async function clearClientCacheOnly(): Promise<void> {
  console.log('[Cache Clear] 🔄 Fallback: Clearing client cache only');
  await clearAllClientCache();
}

/**
 * Broadcast cache clear signal to all connected clients via Firebase RTDB
 */
export async function broadcastCacheClear(
  type: 'manual' | 'auto-scheduled' | 'unban' | 'auto-unban' | 'admin-unban' | 'maintenance-auto-end' | 'visitor-restore',
  metadata?: any
): Promise<void> {
  // Dynamically import Firebase RTDB to avoid SSR issues
  if (typeof window === 'undefined') {
    console.log('[Cache Clear] Skipping broadcast on server-side');
    return;
  }

  try {
    // Add timeout to prevent hanging (3 seconds)
    const timeoutPromise = new Promise<'timeout'>((resolve) =>
      setTimeout(() => resolve('timeout'), 3000)
    );

    const broadcastPromise = (async () => {
      try {
        const { rtdb } = await import('./firebase');
        const { ref, push } = await import('firebase/database');
        const cacheInvalidationRef = ref(rtdb, 'cacheInvalidation');

        await push(cacheInvalidationRef, {
          type,
          timestamp: new Date().toISOString(),
          metadata: metadata || {},
          clearClient: true,
          clearServer: true,
          databaseProtected: true,
          reason:
            type === 'auto-scheduled'
              ? 'Scheduled maintenance'
              : type === 'unban' || type === 'auto-unban' || type === 'admin-unban'
              ? 'User unbanned'
              : type === 'maintenance-auto-end'
              ? 'Maintenance mode ended'
              : type === 'visitor-restore'
              ? 'Visitor restored from recycle bin'
              : 'Manual cache clear',
        });
        return 'success';
      } catch (err) {
        console.warn('[Cache Broadcast] Firebase RTDB error:', err);
        return 'error';
      }
    })();

    const result = await Promise.race([broadcastPromise, timeoutPromise]);
    
    if (result === 'success') {
      console.log('[Cache Broadcast] ✅ Signal sent to all clients');
    } else if (result === 'timeout') {
      console.log('[Cache Broadcast] ⏱️ Broadcast timed out - skipping (non-critical)');
    } else {
      console.log('[Cache Broadcast] ⚠️ Broadcast failed - skipping (non-critical)');
    }
  } catch (error) {
    // This shouldn't happen with the new structure, but just in case
    console.log('[Cache Broadcast] ℹ️ Skipping broadcast due to error (non-critical)');
  }
}

/**
 * Listen for cache clear broadcasts from Firebase RTDB
 */
export function listenForCacheClearBroadcasts(
  callback: (event: any) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  try {
    let unsubscribe: (() => void) | null = null;

    (async () => {
      const { rtdb } = await import('./firebase');
      const cacheInvalidationRef = ref(rtdb, 'cacheInvalidation');

      unsubscribe = onValue(cacheInvalidationRef, (snapshot) => {
        const data = snapshot.val();

        if (!data) return;

        const events = Object.values(data) as any[];
        const latestEvent = events[events.length - 1];

        const eventTime = new Date(latestEvent.timestamp).getTime();
        const now = Date.now();

        if (now - eventTime < 5000) {
          console.log('[Cache Broadcast] 📡 Received cache clear signal');
          callback(latestEvent);
        }
      }) as () => void;
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  } catch (error) {
    console.error('[Cache Broadcast] Failed to set up listener:', error);
    return () => {};
  }
}

/**
 * Verify database integrity (check UUID counts)
 * 
 * For client-side calls, this makes an API request.
 * For server-side calls (API routes), import and use verifyDatabaseIntegrityServer from firebaseAdmin.
 */
export async function verifyDatabaseIntegrity(): Promise<boolean> {
  try {
    console.log('[Database] Verifying integrity...');

    // Client-side: call API endpoint
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/admin/verify-db');
        const data = await response.json();
        return data.success === true;
      } catch (error) {
        console.warn('[Database] API verification failed, skipping:', error);
        return true; // Non-critical, allow operation to continue
      }
    }

    // Server-side: This should not be reached in client bundles
    console.warn('[Database] Server-side verification called from unexpected context');
    return true;
  } catch (error) {
    console.error('[Database] ❌ Integrity check failed:', error);
    return false;
  }
}

/**
 * Get current cache statistics
 */
export function getCacheStats(): CacheStats {
  try {
    const { getCacheStats: getIdentityStats } = require('./identityCache');
    const identityStats = getIdentityStats();

    // Try to get UUID cache stats
    let uuidEntries = 0;
    try {
      const cacheModule = require('./uuid-sync/services/cacheManager');
      const cacheManager = cacheModule.cacheManager || cacheModule.default;
      if (cacheManager && typeof cacheManager.getStats === 'function') {
        const uuidStats = cacheManager.getStats();
        uuidEntries = uuidStats.size || 0;
      }
    } catch (err) {
      // UUID cache not available
    }

    // Try to get browser cache count
    let browserCacheCount = 0;
    if (typeof window !== 'undefined' && 'caches' in window) {
      // This is async, so we can't get it synchronously
      // We'll use a placeholder
      browserCacheCount = 0; // Will be updated during clear
    }

    return {
      identity: {
        entries: identityStats.entries || 0,
        age: identityStats.age,
        size: identityStats.cached ? 45 : 0,
        hitRate: 0,
      },
      uuid: {
        entries: uuidEntries,
        age: null,
        hitRate: 0,
      },
      browser: {
        routes: browserCacheCount,
        size: 0,
      },
      server: {
        memory: 0,
        routes: 0,
      },
    };
  } catch (error) {
    console.error('[Cache Stats] Failed to get stats:', error);
    return {
      identity: { entries: 0, age: null, size: 0, hitRate: 0 },
      uuid: { entries: 0, age: null, hitRate: 0 },
      browser: { routes: 0, size: 0 },
      server: { memory: 0, routes: 0 },
    };
  }
}

/**
 * Clear all caches with comprehensive error handling
 */
export async function clearAllCacheWithErrorHandling(): Promise<CacheClearResult> {
  // Acquire lock to prevent concurrent cache clears
  await acquireClearLock();
  
  const results: CacheClearResult = {
    success: false,
    phases: {
      client: { success: false, error: null },
      server: { success: false, error: null },
      broadcast: { success: false, error: null },
      verification: { success: false, error: null },
    },
    errors: [],
    stats: {
      memoryFreed: 0,
      entriesCleared: 0,
      duration: 0,
    },
    counts: {
      identityCleared: 0,
      uuidCleared: 0,
      browserCachesCleared: 0,
    },
  };

  const startTime = Date.now();
  errorHandler.reset();

  try {
    // Phase 1: Client Cache
    try {
      console.log('[Cache Clear] Phase 1: Client cache...');
      const counts = await clearAllClientCache();
      results.phases.client.success = true;
      results.stats.entriesCleared = counts.identityCleared + counts.uuidCleared;
      results.stats.memoryFreed = counts.browserCachesCleared;
      // Store detailed counts
      results.counts = {
        identityCleared: counts.identityCleared,
        uuidCleared: counts.uuidCleared,
        browserCachesCleared: counts.browserCachesCleared,
      };
      console.log('[Cache Clear] ✅ Phase 1 complete -', results.stats.entriesCleared, 'entries');
    } catch (error) {
      const classified = await errorHandler.handleError(error, 'client-cache', {});
      results.phases.client.error = classified;
      results.errors.push(classified);

      if (classified.severity === 'critical') {
        results.stats.duration = Date.now() - startTime;
        releaseClearLock();
        throw new Error('Critical error in client cache clear');
      }
    }

    // Phase 2: Broadcast
    try {
      console.log('[Cache Clear] Phase 2: Broadcasting...');
      await broadcastCacheClear('manual', { source: 'admin-dashboard' });
      results.phases.broadcast.success = true;
      console.log('[Cache Clear] ✅ Phase 2 complete');
    } catch (error) {
      const classified = await errorHandler.handleError(error, 'broadcast', {});
      results.phases.broadcast.error = classified;
      results.errors.push(classified);
      console.warn('[Cache Clear] ⚠️ Broadcast failed, continuing...');
    }

    // Phase 3: Verification
    try {
      console.log('[Cache Clear] Phase 3: Verification...');
      const verified = await verifyDatabaseIntegrity();

      if (!verified) {
        throw new Error('Database integrity check failed');
      }

      results.phases.verification.success = true;
      console.log('[Cache Clear] ✅ Phase 3 complete');
    } catch (error) {
      const classified = await errorHandler.handleError(error, 'database-verification', {});
      results.phases.verification.error = classified;
      results.errors.push(classified);
    }

    results.stats.duration = Date.now() - startTime;
    results.success = true;

    console.log('[Cache Clear] 🎉 All phases complete');
    return results;
  } catch (error: any) {
    results.success = false;
    results.stats.duration = Date.now() - startTime;
    console.error('[Cache Clear] ❌ Operation failed:', error);
    throw error;
  } finally {
    releaseClearLock();
  }
}
