/**
 * Cache Debugging Utilities
 * 
 * Provides tools for monitoring, validating, and debugging cache health
 */

export interface CacheHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  identity: {
    status: 'healthy' | 'stale' | 'empty';
    age: number | null;
    recommendations: string[];
  };
  uuid: {
    status: 'healthy' | 'stale' | 'empty';
    age: number | null;
    recommendations: string[];
  };
  browser: {
    status: 'healthy' | 'degraded' | 'empty';
    recommendations: string[];
  };
}

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
}

export interface ComparisonResult {
  matches: boolean;
  differences: {
    field: string;
    cached: any;
    database: any;
  }[];
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  avgLatency: number;
  totalRequests: number;
}

/**
 * Get comprehensive cache health report
 */
export function getCacheHealth(): CacheHealth {
  const health: CacheHealth = {
    overall: 'healthy',
    identity: {
      status: 'healthy',
      age: null,
      recommendations: [],
    },
    uuid: {
      status: 'healthy',
      age: null,
      recommendations: [],
    },
    browser: {
      status: 'healthy',
      recommendations: [],
    },
  };

  try {
    // Check identity cache
    const { getCacheStats } = require('./identityCache');
    const identityStats = getCacheStats();

    if (!identityStats.cached) {
      health.identity.status = 'empty';
      health.identity.recommendations.push('Cache is empty - will rebuild on next request');
    } else if (identityStats.age && identityStats.age > 4 * 60 * 1000) {
      // Older than 4 minutes
      health.identity.status = 'stale';
      health.identity.age = identityStats.age;
      health.identity.recommendations.push('Cache is stale - consider clearing');
    } else {
      health.identity.status = 'healthy';
      health.identity.age = identityStats.age;
    }

    // Set overall health
    if (health.identity.status === 'empty' || health.uuid.status === 'empty') {
      health.overall = 'degraded';
    }
  } catch (error) {
    console.error('[Cache Health] Error checking health:', error);
    health.overall = 'critical';
  }

  return health;
}

/**
 * Validate cache integrity
 */
export function validateCache(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    issues: [],
    warnings: [],
  };

  try {
    // Validate identity cache
    const { getCacheStats } = require('./identityCache');
    const stats = getCacheStats();

    if (stats.cached && stats.age && stats.age > 5 * 60 * 1000) {
      result.warnings.push('Identity cache is older than 5 minutes');
    }

    // Check for version mismatch
    if (stats.version && stats.version > 1) {
      result.warnings.push(`Cache version is ${stats.version} (may indicate resets)`);
    }
  } catch (error) {
    result.valid = false;
    result.issues.push('Failed to validate cache: ' + (error as Error).message);
  }

  return result;
}

/**
 * Compare cache with database
 */
export async function compareCacheWithDatabase(): Promise<ComparisonResult> {
  const result: ComparisonResult = {
    matches: true,
    differences: [],
  };

  try {
    // This would require database access - placeholder for now
    console.log('[Cache Compare] Comparison with database not yet implemented');
  } catch (error) {
    console.error('[Cache Compare] Error:', error);
  }

  return result;
}

/**
 * Get cache performance metrics
 */
export function getCacheMetrics(): CacheMetrics {
  // Placeholder - would require tracking
  return {
    hitRate: 0,
    missRate: 0,
    avgLatency: 0,
    totalRequests: 0,
  };
}

/**
 * Export cache stats for debugging
 */
export function exportCacheStats(): string {
  const health = getCacheHealth();
  const validation = validateCache();
  const metrics = getCacheMetrics();

  return JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      health,
      validation,
      metrics,
    },
    null,
    2
  );
}
