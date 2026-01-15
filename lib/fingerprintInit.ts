/**
 * Fingerprint Initializer - DEPRECATED
 * 
 * This file is kept for backwards compatibility but should not be used directly.
 * Use lib/fingerprintInit.client.ts instead for Turbopack-safe initialization.
 * 
 * TURBOPACK WARNING: This file has module-level side effects and may cause
 * build issues with Turbopack. Prefer using FingerprintInitializer component.
 * 
 * @deprecated Use lib/fingerprintInit.client.ts instead
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

// TURBOPACK WARNING: Module-level side effect
// This is executed at import time, which can cause issues with Turbopack
// Prefer using the FingerprintInitializer component instead
