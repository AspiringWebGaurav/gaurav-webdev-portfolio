/**
 * Fingerprint Initializer - CLIENT COMPONENT ONLY
 * 
 * This file has been refactored to be safe for Turbopack builds.
 * It exports a function that should be called from a client component,
 * NOT executed at module-level during import.
 * 
 * TURBOPACK-SAFE: No side effects at module-level
 */

import { generateDeviceFingerprint } from './deviceFingerprint';

let initialized = false;

/**
 * Initialize device fingerprint - MUST be called from a client component
 * Safe for React hooks and useEffect
 */
export function initializeFingerprint(): void {
  if (typeof window === 'undefined') return;
  if (initialized) return;
  
  initialized = true;
  
  // Generate fingerprint immediately and cache it
  const fp = generateDeviceFingerprint();
  console.log('[FingerprintInit] Initialized at app startup:', fp);
}
