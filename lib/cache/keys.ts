/**
 * Cache Keys and TTL Configuration
 * 
 * Centralized cache key definitions and TTL values
 * for consistent caching across the application.
 */

/**
 * Cache key prefixes for different data types
 */
export const CACHE_KEYS = {
  // Static content (rarely changes)
  PROJECTS: 'content:projects',
  TESTIMONIALS: 'content:testimonials',
  WORK_EXPERIENCE: 'content:work-experience',
  TECH_STACKS: 'content:tech-stacks',
  CURRENTLY_WORKING: 'content:currently-working',
  
  // Site settings (changes occasionally)
  SITE_SETTINGS: 'settings:site',
  MAINTENANCE: 'settings:maintenance',
  SUSPENSION: 'settings:suspension',
  
  // Visitor data (per-visitor)
  IDENTITY: 'identity',          // identity:{fingerprint}
  SESSION: 'session',            // session:{mask}
  BAN_STATUS: 'ban',             // ban:{mask}
  
  // Analytics (admin only)
  AGGREGATES: 'analytics:aggregates',
  VISITORS_LIST: 'analytics:visitors',
} as const;

/**
 * Admin Dashboard Cache Keys
 * Used for admin-only data that can be cached with shorter TTLs
 */
export const ADMIN_CACHE_KEYS = {
  // Visitor Analytics
  AGGREGATES: 'admin:aggregates',           // admin:aggregates:{timeRange}
  VISITORS: 'admin:visitors',               // admin:visitors:{hash}
  VISITOR_DETAIL: 'admin:visitor',          // admin:visitor:{id}
  
  // Reports
  CRASH_REPORTS: 'admin:crash-reports',     // admin:crash-reports
  BUG_REPORTS: 'admin:bug-reports',         // admin:bug-reports
  
  // Appeals
  BAN_APPEALS: 'admin:ban-appeals',         // admin:ban-appeals
} as const;

/**
 * TTL values in seconds
 */
export const CACHE_TTL = {
  // Static content - long TTL (10 minutes)
  STATIC_CONTENT: 10 * 60,       // 600s
  
  // Site settings - short TTL for safety (30 seconds)
  SITE_SETTINGS: 30,             // 30s
  
  // Identity - very long TTL (24 hours)
  IDENTITY: 24 * 60 * 60,        // 86400s
  
  // Session - medium TTL (5 minutes)
  SESSION: 5 * 60,               // 300s
  
  // Ban status - short TTL for quick updates (60 seconds)
  BAN_STATUS: 60,                // 60s
  
  // Analytics - medium TTL (5 minutes)
  ANALYTICS: 5 * 60,             // 300s
  
  // Memory cache defaults (shorter than Redis)
  MEMORY_SHORT: 30,              // 30s
  MEMORY_MEDIUM: 60,             // 60s
  MEMORY_LONG: 120,              // 120s
} as const;

/**
 * Admin Dashboard Cache TTLs (in seconds)
 * Shorter TTLs for more real-time feel while still reducing Firebase reads
 */
export const ADMIN_CACHE_TTL = {
  // Aggregates - 2 minute TTL (changes slowly)
  AGGREGATES: 2 * 60,            // 120s
  AGGREGATES_MEMORY: 60,         // 60s in memory
  
  // Visitors list - 30 second TTL (needs fresher data)
  VISITORS: 30,                  // 30s
  VISITORS_MEMORY: 15,           // 15s in memory
  
  // Crash reports - 30 second TTL (urgent)
  CRASH_REPORTS: 30,             // 30s
  CRASH_REPORTS_MEMORY: 15,      // 15s in memory
  
  // Bug reports - 1 minute TTL
  BUG_REPORTS: 60,               // 60s
  BUG_REPORTS_MEMORY: 30,        // 30s in memory
  
  // Ban appeals - 30 second TTL (urgent)
  BAN_APPEALS: 30,               // 30s
  BAN_APPEALS_MEMORY: 15,        // 15s in memory
} as const;

/**
 * Generate a cache key with parameters
 */
export function buildCacheKey(prefix: string, ...parts: string[]): string {
  return [prefix, ...parts].filter(Boolean).join(':');
}

/**
 * Parse a cache key to extract parts
 */
export function parseCacheKey(key: string): string[] {
  return key.split(':');
}
