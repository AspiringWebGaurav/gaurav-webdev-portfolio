/**
 * UUID Sync System - Server-Only Exports
 * For use in middleware, API routes, and server components
 * NO React hooks or client-side code
 */

// Core functionality
export { generateUUID, generateMaskFromUUID, createVisitorIdentity, isValidUUID, isValidMask } from './core/generator';
export { resolveIdentity, validateIdentityResult } from './core/resolver';
export { 
  validateUUID, 
  validateMask, 
  validateFingerprint,
  isValidUUID as checkValidUUID,
  isValidMask as checkValidMask,
  isValidFingerprint,
  sanitizeMask,
  sanitizeUUID,
  sanitizeFingerprint
} from './core/validator';

// Services
export { 
  cacheGet, 
  cacheSet, 
  cacheDelete, 
  cacheClear, 
  cacheStats, 
  cacheCleanExpired 
} from './services/cacheManager';

export {
  firestoreGetIdentity,
  firestoreSaveIdentity,
  firestoreGetUUIDByMask,
  firestoreGetMaskByUUID,
  firestoreUpdateLastVisit,
  firestoreCheckBanStatus,
  firestoreGetVisitorDocument
} from './services/firestoreSync';

export {
  translateMaskToUUID,
  translateUUIDToMask,
  batchTranslateMasksToUUIDs,
  batchTranslateUUIDsToMasks
} from './services/maskTranslator';

export {
  identifyVisitor,
  getIdentityResult,
  isNewVisitor
} from './services/identityService';

// Server-side adapters only
export {
  getVisitorMaskFromRequest,
  proxyIdentifyVisitor
} from './adapters/proxyAdapter';

export {
  apiIdentifyVisitor,
  apiTranslateMaskToUUID,
  apiTranslateUUIDToMask,
  extractMaskFromRequest,
  withUUIDFromMask
} from './adapters/apiAdapter';

// Types
export type {
  VisitorIdentity,
  IdentityResolutionResult,
  CacheEntry,
  CacheStats,
  VisitorDocument,
  IdentifyRequest,
  IdentifyResponse,
  TranslateRequest,
  TranslateResponse
} from './types';

export { UUIDErrorCode, UUIDError } from './types';

export {
  UUIDValidationError,
  UUIDNotFoundError,
  MaskNotFoundError,
  FirestoreTransactionError,
  CacheError,
  isUUIDError
} from './errors';

// Constants
export { COLLECTIONS, CACHE_TTL, PATTERNS, MASK_CONFIG, RETRY_CONFIG, LOG_PREFIX } from './constants';

// Utils
export { log, logError, retry, sleep, generateExpiryTimestamp, isExpired, safeStringify, truncate } from './utils';
