/**
 * Client Adapter - React hooks and client-side utilities
 */

import { useState, useEffect } from 'react';
import { log, logError } from '../utils';

/**
 * Client-side visitor identification
 * Returns public mask only
 */
export async function clientIdentifyVisitor(fingerprint: string): Promise<string> {
  try {
    const response = await fetch('/api/visitor-analytics/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprint }),
    });

    if (!response.ok) {
      throw new Error('Failed to identify visitor');
    }

    const data = await response.json();
    return data.mask || 'device_unknown';
  } catch (error) {
    logError('Client identify visitor failed', error);
    return 'device_unknown';
  }
}

/**
 * React hook for visitor identification
 */
export function useVisitorIdentity(fingerprint: string | null) {
  const [mask, setMask] = useState<string>('device_unknown');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!fingerprint) {
      setLoading(false);
      return;
    }

    let mounted = true;

    clientIdentifyVisitor(fingerprint)
      .then((identifiedMask) => {
        if (mounted) {
          setMask(identifiedMask);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [fingerprint]);

  return { mask, loading, error };
}

/**
 * Format mask for display
 */
export function formatMaskForDisplay(mask: string): string {
  // Already in device_***** format
  return mask;
}

/**
 * Check if mask is valid format
 */
export function isValidMaskFormat(mask: string): boolean {
  return /^device_[a-z0-9]{10}$/.test(mask);
}
