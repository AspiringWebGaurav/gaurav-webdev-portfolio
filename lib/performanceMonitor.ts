/**
 * Performance Monitor - Track Firebase read costs
 * Logs cache hits/misses and Firebase usage in console
 * Helps track optimization impact
 */

interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  firebaseReads: number;
  apiCalls: number;
  sessionStart: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    firebaseReads: 0,
    apiCalls: 0,
    sessionStart: Date.now(),
  };

  private enabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'development';

  recordCacheHit() {
    this.metrics.cacheHits++;
    if (this.enabled) {
      console.log('📊 [Performance] Cache HIT - Saved Firebase reads!');
    }
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
    if (this.enabled) {
      console.log('📊 [Performance] Cache MISS - Fetching from Firebase');
    }
  }

  recordFirebaseRead(count: number = 1) {
    this.metrics.firebaseReads += count;
  }

  recordAPICall(endpoint: string) {
    this.metrics.apiCalls++;
    if (this.enabled) {
      console.log(`📊 [Performance] API Call: ${endpoint}`);
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      sessionDuration: Date.now() - this.metrics.sessionStart,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100,
    };
  }

  logSummary() {
    if (!this.enabled) return;

    const metrics = this.getMetrics();
    const duration = Math.round(metrics.sessionDuration / 1000);

    console.group('📊 Performance Summary');
    console.log(`Session Duration: ${duration}s`);
    console.log(`Cache Hits: ${metrics.cacheHits} (${Math.round(metrics.cacheHitRate)}% hit rate)`);
    console.log(`Cache Misses: ${metrics.cacheMisses}`);
    console.log(`Firebase Reads: ${metrics.firebaseReads}`);
    console.log(`API Calls: ${metrics.apiCalls}`);
    console.log(`\n💰 Estimated Cost Savings:`);
    console.log(`  - Saved ~${metrics.cacheHits * 3} Firebase reads via caching`);
    console.log(`  - Cost reduction: ~${Math.round(metrics.cacheHits * 3 / (metrics.firebaseReads + metrics.cacheHits * 3) * 100)}%`);
    console.groupEnd();
  }

  reset() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      firebaseReads: 0,
      apiCalls: 0,
      sessionStart: Date.now(),
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Log summary every 5 minutes in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setInterval(() => {
    performanceMonitor.logSummary();
  }, 5 * 60 * 1000);
}
