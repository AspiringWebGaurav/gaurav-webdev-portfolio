/**
 * Device Fingerprinting Utility
 * Generates a stable, deterministic unique identifier for the device/browser combination
 * Uses global window object for true singleton across all imports
 * 
 * NOTE: This only generates fingerprints. Use UUID-sync system for visitor identification.
 */

// Use window object for TRUE singleton across all module imports
declare global {
  interface Window {
    __deviceFingerprint?: string;
  }
}

export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  // Check global singleton cache first
  if (window.__deviceFingerprint) {
    console.log('[Fingerprint] Using cached:', window.__deviceFingerprint);
    return window.__deviceFingerprint;
  }

  // Generate fingerprint from stable browser characteristics
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform,
    navigator.vendor || 'unknown',
    screen.pixelDepth,
    navigator.maxTouchPoints || 0,
    (navigator as any).deviceMemory || 'unknown',
    window.screen.availWidth,
    window.screen.availHeight,
  ];

  // Create a deterministic hash
  const fingerprint = deterministicHash(components.join('|'));
  
  console.log('[Fingerprint] Generated NEW fingerprint:', fingerprint);
  console.log('[Fingerprint] Components:', components.slice(0, 3)); // First 3 for debugging
  
  // Store in global window object (survives module re-imports)
  window.__deviceFingerprint = fingerprint;
  
  return fingerprint;
}

/**
 * Deterministic hash function - same input always produces same output
 * This ensures the same device always gets the same UUID
 * Returns RAW hash value for UUID-sync system
 */
function deterministicHash(str: string): string {
  let hash = 5381; // DJB2 hash algorithm - more stable than simple hash
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) + hash) + char; // hash * 33 + char
  }
  // Convert to positive number and base36 encoding for compact representation
  const hashValue = Math.abs(hash);
  // Return raw fingerprint for UUID-sync identification
  return hashValue.toString(36) + '_' + str.length.toString(36);
}

/**
 * No stored fingerprint - always calculate fresh from device characteristics
 * This ensures deterministic behavior without localStorage
 */
export function getStoredFingerprint(): string | null {
  // Always return null - we don't store fingerprints
  // Each call to generateDeviceFingerprint() will produce the same value anyway
  return null;
}
