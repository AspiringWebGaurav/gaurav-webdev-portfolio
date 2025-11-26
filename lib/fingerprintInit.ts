/**
 * Fingerprint Initializer
 * MUST be called ONCE at app startup to generate and cache fingerprint
 * Prevents race conditions from multiple components
 */

import { generateDeviceFingerprint } from './deviceFingerprint';

let initialized = false;

export function initializeFingerprint(): void {
  if (typeof window === 'undefined') return;
  if (initialized) return;
  
  initialized = true;
  
  // Generate fingerprint immediately and cache it
  const fp = generateDeviceFingerprint();
  console.log('[FingerprintInit] Initialized at app startup:', fp);
}

// Auto-initialize on module load (runs once per page load)
if (typeof window !== 'undefined') {
  initializeFingerprint();
}
