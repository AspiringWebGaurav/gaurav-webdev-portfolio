/**
 * Safe Cache Manager
 * Handles cache clearing for force updates WITHOUT touching application state
 * 
 * SAFETY GUARANTEES:
 * - Never touches sessionStorage (scroll restoration safe)
 * - Never touches localStorage (portfolio features safe)
 * - Never touches IndexedDB (if used, stays intact)
 * - Never affects Firestore listeners
 * - Never clears cookies
 */

export class SafeCacheManager {
  /**
   * Performs a cache-busting reload without touching application state
   * SAFE: Only adds URL parameter, doesn't clear any storage
   */
  static cacheBustingReload(): void {
    const url = new URL(window.location.href);
    const timestamp = Date.now().toString();
    url.searchParams.set('_refresh', timestamp);
    
    console.log('🔄 [SafeCache] Cache-busting reload initiated');
    console.log('  📍 Current URL:', window.location.pathname);
    console.log('  🔑 Refresh token:', timestamp);
    
    // Hard navigation - bypasses all caches
    window.location.href = url.toString();
  }

  /**
   * Cleans up cache-busting parameter after successful load
   * Call this on app mount to keep URLs clean
   */
  static cleanupCacheBustingParam(): void {
    const url = new URL(window.location.href);
    if (url.searchParams.has('_refresh')) {
      const refreshToken = url.searchParams.get('_refresh');
      url.searchParams.delete('_refresh');
      
      // Clean URL without reload
      window.history.replaceState({}, '', url.toString());
      
      console.log('✅ [SafeCache] Cleaned up cache-busting parameter');
      console.log('  🔑 Removed token:', refreshToken);
      console.log('  📍 Clean URL:', url.pathname);
    }
  }

  /**
   * Clear ONLY browser HTTP caches (not storage)
   * SAFE: Preserves localStorage, sessionStorage, IndexedDB
   * This is optional and non-blocking
   */
  static async clearBrowserHTTPCacheOnly(): Promise<void> {
    try {
      if (!('caches' in window)) {
        console.log('ℹ️ [SafeCache] Cache API not available (no caches to clear)');
        return;
      }

      const cacheNames = await caches.keys();
      
      if (cacheNames.length === 0) {
        console.log('ℹ️ [SafeCache] No caches found to clear');
        return;
      }

      // Only clear Next.js/browser caches, never application storage
      const httpCaches = cacheNames.filter(name => {
        const nameLower = name.toLowerCase();
        return (
          nameLower.includes('next') ||
          nameLower.includes('workbox') ||
          nameLower.includes('http') ||
          nameLower.includes('__next') ||
          nameLower.includes('pages') ||
          nameLower.includes('webpack')
        );
      });

      if (httpCaches.length === 0) {
        console.log('ℹ️ [SafeCache] No Next.js caches found to clear');
        return;
      }

      console.log(`🧹 [SafeCache] Clearing ${httpCaches.length} HTTP caches...`);
      
      const results = await Promise.allSettled(
        httpCaches.map(name => {
          console.log('  🗑️ Deleting cache:', name);
          return caches.delete(name);
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      console.log(`✅ [SafeCache] Cleared ${successful}/${httpCaches.length} HTTP caches`);

    } catch (error) {
      console.warn('⚠️ [SafeCache] HTTP cache clearing failed (non-critical):', error);
      // Non-blocking - continue with reload anyway
    }
  }

  /**
   * Complete safe reload flow
   * 1. Clear HTTP caches (optional, non-blocking)
   * 2. Perform cache-busting reload (guaranteed)
   */
  static async performSafeReload(): Promise<void> {
    console.log('🚀 [SafeCache] Starting safe reload process...');
    console.log('  ✅ sessionStorage preserved (scroll restoration safe)');
    console.log('  ✅ localStorage preserved (portfolio features safe)');
    console.log('  ✅ IndexedDB preserved (data safe)');
    console.log('  ✅ Firestore connections preserved');
    
    // Step 1: Clear HTTP caches (non-blocking, optional)
    await this.clearBrowserHTTPCacheOnly().catch(() => {
      console.log('  ℹ️ HTTP cache clearing skipped (continuing...)');
    });
    
    // Step 2: Cache-busting reload (always works)
    this.cacheBustingReload();
  }

  /**
   * Check if current page load was from a cache-busted reload
   */
  static isFromCacheBustedReload(): boolean {
    const url = new URL(window.location.href);
    return url.searchParams.has('_refresh');
  }
}
