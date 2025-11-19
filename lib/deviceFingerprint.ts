/**
 * Device Fingerprinting Utility
 * Generates a stable, deterministic unique identifier for the device/browser combination
 * NO localStorage - purely based on device characteristics (server-reconciled)
 */

/**
 * Generate the primary visitor ID in format: device_<fingerprint>
 * This is THE main identifier used throughout the entire application
 */
export function generateVisitorId(): string {
  const fingerprint = generateDeviceFingerprint();
  return `device_${fingerprint}`;
}

export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  // Generate fingerprint from stable browser characteristics
  // This generates the SAME fingerprint for the same device every time
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
    // Add more stable characteristics for better uniqueness
    (navigator as any).deviceMemory || 'unknown',
    window.screen.availWidth,
    window.screen.availHeight,
  ];

  // Create a deterministic hash that's always the same for this device
  const fingerprint = deterministicHash(components.join('|'));
  
  return fingerprint;
}

/**
 * Deterministic hash function - same input always produces same output
 * This ensures the same device always gets the same UUID
 * Returns RAW hash value for use with generateVisitorId()
 */
function deterministicHash(str: string): string {
  let hash = 5381; // DJB2 hash algorithm - more stable than simple hash
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) + hash) + char; // hash * 33 + char
  }
  // Convert to positive number and base36 encoding for compact representation
  const hashValue = Math.abs(hash);
  // Return raw fingerprint without prefix - let generateVisitorId add the device_ prefix
  return hashValue.toString(36) + '_' + str.length.toString(36);
}

/**
 * Enhanced fingerprint with additional entropy for better uniqueness
 */
export async function generateEnhancedFingerprint(): Promise<string> {
  const baseFingerprint = generateDeviceFingerprint();
  
  // Add canvas fingerprinting for better uniqueness (optional, non-blocking)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Browser Fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Canvas Fingerprint', 4, 17);
      
      const canvasHash = deterministicHash(canvas.toDataURL());
      return baseFingerprint + '_' + canvasHash.substring(0, 8);
    }
  } catch (e) {
    // Canvas fingerprinting failed, use base fingerprint
    console.log('[Fingerprint] Canvas fingerprinting unavailable, using base fingerprint');
  }
  
  return baseFingerprint;
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
