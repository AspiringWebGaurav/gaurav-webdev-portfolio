/**
 * UUID Sync System - Constants
 */

// Firestore Collections - Separated by purpose
export const COLLECTIONS = {
  // Core Identity - UUID, mask, fingerprint mapping
  VISITOR_PROFILES: 'og_uuid',
  
  // Visitor Sessions - Each browser session
  VISITOR_SESSIONS: 'og_uuid_sessions',
  
  // Visitor Events - Page views, clicks, etc
  VISITOR_EVENTS: 'og_uuid_events',
  
  // Fingerprint Lookup - Fast fingerprint to UUID mapping
  FINGERPRINT_MAP: 'og_uuid_fingerprints',
  
  // Mask Lookup - Fast mask to UUID mapping
  MASK_MAP: 'og_uuid_masks',
  
  // Ban Management
  BAN_LOGS: 'og_uuid_ban_logs',
  BAN_HISTORY: 'og_uuid_ban_history',
} as const;

// Cache TTL (Time To Live) in milliseconds
export const CACHE_TTL = {
  FINGERPRINT_TO_UUID: 5 * 60 * 1000,      // 5 minutes
  MASK_TO_UUID: 10 * 60 * 1000,            // 10 minutes
  UUID_TO_MASK: 10 * 60 * 1000,            // 10 minutes
  BAN_STATUS: 30 * 1000,                    // 30 seconds
} as const;

// Regex Patterns
export const PATTERNS = {
  MASK: /^device_[a-z0-9]{10}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const;

// Mask Generation
export const MASK_CONFIG = {
  PREFIX: 'device_',
  LENGTH: 10,                                // Characters after prefix
  TOTAL_LENGTH: 17,                          // device_ + 10 chars
} as const;

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 100,                        // ms
  MAX_DELAY: 1000,                           // ms
  BACKOFF_MULTIPLIER: 2,
} as const;

// Logging
export const LOG_PREFIX = '[UUID-Sync]' as const;
