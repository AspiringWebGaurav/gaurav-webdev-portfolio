/**
 * Cache Statistics Tracker
 * 
 * Monitors cache performance to verify:
 * - Cache hit ratio ≥ 85%
 * - Firebase reads ≤ 10-15% of total
 */

interface CacheMetrics {
  memoryHits: number;
  redisHits: number;
  firebaseMisses: number;
  bypassCount: number;
  staleHits: number;
  redisErrors: number;
  totalRequests: number;
  startTime: number;
}

class CacheStats {
  private metrics: CacheMetrics = {
    memoryHits: 0,
    redisHits: 0,
    firebaseMisses: 0,
    bypassCount: 0,
    staleHits: 0,
    redisErrors: 0,
    totalRequests: 0,
    startTime: Date.now(),
  };

  /**
   * Record a cache hit
   */
  recordHit(layer: 'memory' | 'redis'): void {
    this.metrics.totalRequests++;
    if (layer === 'memory') {
      this.metrics.memoryHits++;
    } else {
      this.metrics.redisHits++;
    }
  }

  /**
   * Record a cache miss (Firebase fetch)
   */
  recordMiss(reason: 'firebase' | 'bypass'): void {
    this.metrics.totalRequests++;
    if (reason === 'bypass') {
      this.metrics.bypassCount++;
    } else {
      this.metrics.firebaseMisses++;
    }
  }

  /**
   * Record stale data usage
   */
  recordStaleHit(): void {
    this.metrics.staleHits++;
  }

  /**
   * Record Redis error
   */
  recordError(source: 'redis'): void {
    this.metrics.redisErrors++;
  }

  /**
   * Get cache hit ratio (percentage)
   */
  getHitRatio(): number {
    if (this.metrics.totalRequests === 0) return 0;
    
    const hits = this.metrics.memoryHits + this.metrics.redisHits;
    return (hits / this.metrics.totalRequests) * 100;
  }

  /**
   * Get Firebase usage ratio (percentage)
   */
  getFirebaseRatio(): number {
    if (this.metrics.totalRequests === 0) return 0;
    return (this.metrics.firebaseMisses / this.metrics.totalRequests) * 100;
  }

  /**
   * Get full statistics report
   */
  getReport(): {
    hitRatio: number;
    firebaseRatio: number;
    metrics: CacheMetrics;
    uptime: number;
    status: 'optimal' | 'good' | 'needs_improvement';
  } {
    const hitRatio = this.getHitRatio();
    const firebaseRatio = this.getFirebaseRatio();
    const uptime = Math.round((Date.now() - this.metrics.startTime) / 1000);

    let status: 'optimal' | 'good' | 'needs_improvement';
    if (hitRatio >= 90) {
      status = 'optimal';
    } else if (hitRatio >= 75) {
      status = 'good';
    } else {
      status = 'needs_improvement';
    }

    return {
      hitRatio: Math.round(hitRatio * 100) / 100,
      firebaseRatio: Math.round(firebaseRatio * 100) / 100,
      metrics: { ...this.metrics },
      uptime,
      status,
    };
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.metrics = {
      memoryHits: 0,
      redisHits: 0,
      firebaseMisses: 0,
      bypassCount: 0,
      staleHits: 0,
      redisErrors: 0,
      totalRequests: 0,
      startTime: Date.now(),
    };
  }

  /**
   * Log current stats (for debugging)
   */
  logStats(): void {
    const report = this.getReport();
    console.log('═══════════════════════════════════════════');
    console.log('📊 CACHE STATISTICS');
    console.log('═══════════════════════════════════════════');
    console.log(`Hit Ratio: ${report.hitRatio}%`);
    console.log(`Firebase Usage: ${report.firebaseRatio}%`);
    console.log(`Status: ${report.status.toUpperCase()}`);
    console.log(`Uptime: ${report.uptime}s`);
    console.log('───────────────────────────────────────────');
    console.log(`Memory Hits: ${report.metrics.memoryHits}`);
    console.log(`Redis Hits: ${report.metrics.redisHits}`);
    console.log(`Firebase Misses: ${report.metrics.firebaseMisses}`);
    console.log(`Stale Hits: ${report.metrics.staleHits}`);
    console.log(`Redis Errors: ${report.metrics.redisErrors}`);
    console.log('═══════════════════════════════════════════');
  }
}

// Singleton instance
export const cacheStats = new CacheStats();

export default cacheStats;
