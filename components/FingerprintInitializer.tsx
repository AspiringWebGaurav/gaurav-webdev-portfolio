/**
 * Fingerprint Initializer Component
 * 
 * Client component that safely initializes client-side utilities
 * during the React lifecycle (useEffect), not at module-level.
 * 
 * This component initializes:
 * - Device fingerprinting
 * - Ban status manager cleanup
 * - Smart polling cleanup
 * 
 * TURBOPACK-SAFE: Proper client boundary with no build-time side effects
 */

'use client';

import { useEffect } from 'react';
import { initializeFingerprint } from '@/lib/fingerprintInit.client';
import { initializeBanStatusManagerCleanup } from '@/lib/banStatusManager';
import { initializeSmartPolling } from '@/lib/smartPolling';

export default function FingerprintInitializer() {
  useEffect(() => {
    // Initialize fingerprint once on client mount
    initializeFingerprint();
    
    // Initialize ban status manager cleanup handlers
    initializeBanStatusManagerCleanup();
    
    // Initialize smart polling cleanup and debug tools
    initializeSmartPolling();
  }, []);

  // This component renders nothing
  return null;
}
