/**
 * UUID Sync System - Type Definitions
 * Complete type safety for the new UUID system
 */

// Core Identity Types
export interface VisitorIdentity {
  uuid: string;           // Full crypto UUID (secret, server-only)
  mask: string;           // Public display ID (device_*****)
  fingerprint: string;    // Device fingerprint (for server-side lookups)
}

export interface IdentityResolutionResult {
  uuid: string;
  mask: string;
  isNew: boolean;         // True if just created
}

// Cache Types
export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
}

// Firestore Document Structure
export interface VisitorDocument {
  uuid: string;
  mask: string;
  fingerprint: string;    // Device fingerprint for server-side lookup
  ipAddress?: string;
  userAgent?: string;
  banned: boolean;
  banReason?: string;
  banCategory?: string;
  banTimestamp?: Date;
  bannedBy?: string;
  firstVisit: Date;
  lastVisit: Date;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;     // Allow other fields
}

// API Request/Response Types
export interface IdentifyRequest {
  fingerprint?: string;
}

export interface IdentifyResponse {
  mask: string;
  success: boolean;
}

export interface TranslateRequest {
  mask: string;
}

export interface TranslateResponse {
  uuid: string;
  mask: string;
  success: boolean;
}

// Error Types
export enum UUIDErrorCode {
  INVALID_MASK = 'INVALID_MASK',
  MASK_NOT_FOUND = 'MASK_NOT_FOUND',
  UUID_NOT_FOUND = 'UUID_NOT_FOUND',
  FINGERPRINT_INVALID = 'FINGERPRINT_INVALID',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  CACHE_ERROR = 'CACHE_ERROR',
  FIRESTORE_ERROR = 'FIRESTORE_ERROR',
}

export class UUIDError extends Error {
  constructor(
    public code: UUIDErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'UUIDError';
  }
}
