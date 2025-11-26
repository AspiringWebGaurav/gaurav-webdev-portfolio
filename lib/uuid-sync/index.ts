/**
 * UUID Sync System - Client-Side Exports ONLY
 * For use in client components and hooks
 * 
 * ⚠️ IMPORTANT: For server-side imports (middleware, API routes, server components),
 * use '@/lib/uuid-sync/server' instead
 * 
 * This file ONLY exports client-safe code (no firebase-admin, no Node.js APIs)
 */

// Client-safe validation (no server dependencies)
export { 
  isValidUUID,
  isValidMask
} from './core/validator';

// Client adapters (React hooks)
export {
  clientIdentifyVisitor,
  useVisitorIdentity,
  formatMaskForDisplay,
  isValidMaskFormat
} from './adapters/clientAdapter';

export {
  listenToBanStatus,
  useBanStatusMonitor
} from './adapters/realtimeAdapter';

// Types (safe for client)
export type {
  VisitorIdentity,
  IdentityResolutionResult
} from './types';

export { UUIDErrorCode, UUIDError } from './types';

// Client-safe constants
export { PATTERNS, MASK_CONFIG } from './constants';
