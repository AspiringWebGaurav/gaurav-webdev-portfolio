/**
 * Client Adapter - React hooks and client-side utilities
 * 
 * Simplified fingerprint-only identity resolution
 */

import { useState, useEffect } from 'react';
import { log, logError } from '../utils';

export interface EnhancedIdentityResult {
  mask: string;
  uuid?: string;
  isNewIdentity: boolean;
  matchedSignal?: string;
  banned: boolean;
  banReason?: string;
  banCategory?: string;
}

/**
 * Client-side visitor identification (basic fingerprint only)
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
 * Enhanced client-side visitor identification
 * Uses primary fingerprint for identity resolution
 */
export async function clientIdentifyVisitorEnhanced(
  primaryFingerprint: string
): Promise<EnhancedIdentityResult> {
  try {
    const response = await fetch('/api/visitor-analytics/identify-enhanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fingerprint: primaryFingerprint,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        language: typeof navigator !== 'undefined' ? navigator.language : undefined,
        screenResolution: typeof window !== 'undefined' 
          ? `${window.screen.width}x${window.screen.height}` 
          : undefined,
        timezone: typeof Intl !== 'undefined' 
          ? Intl.DateTimeFormat().resolvedOptions().timeZone 
          : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to identify visitor (enhanced)');
    }

    const data = await response.json();
    
    log('Enhanced identification complete', { 
      mask: data.mask, 
      matchedSignal: data.matchedSignal,
      isNew: data.isNewIdentity 
    });
    
    return {
      mask: data.mask || 'device_unknown',
      uuid: data.uuid,
      isNewIdentity: data.isNewIdentity || false,
      matchedSignal: data.matchedSignal,
      banned: data.banned || false,
      banReason: data.banReason,
      banCategory: data.banCategory,
    };
  } catch (error) {
    logError('Enhanced client identify visitor failed', error);
    
    // Fallback to basic identification
    try {
      const mask = await clientIdentifyVisitor(primaryFingerprint);
      return {
        mask,
        isNewIdentity: false,
        banned: false,
      };
    } catch {
      return {
        mask: 'device_unknown',
        isNewIdentity: false,
        banned: false,
      };
    }
  }
}

/**
 * Ban check using fingerprint
 */
export async function clientCheckBanEnhanced(
  primaryFingerprint: string,
  mask?: string,
  uuid?: string
): Promise<{ banned: boolean; reason?: string; category?: string; matchedSignal?: string }> {
  try {
    const response = await fetch('/api/visitor-analytics/check-ban-enhanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fingerprint: primaryFingerprint,
        mask,
        uuid,
      }),
    });

    if (!response.ok) {
      console.warn('[BanCheck] Ban check failed, returning not banned (fail-open)');
      return { banned: false };
    }

    const data = await response.json();
    return {
      banned: data.banned || false,
      reason: data.reason,
      category: data.category,
      matchedSignal: data.matchedSignal,
    };
  } catch (error) {
    logError('Ban check failed', error);
    return { banned: false };
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
 * React hook for enhanced visitor identification
 */
export function useVisitorIdentityEnhanced(fingerprint: string | null) {
  const [identity, setIdentity] = useState<EnhancedIdentityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!fingerprint) {
      setLoading(false);
      return;
    }

    let mounted = true;

    clientIdentifyVisitorEnhanced(fingerprint)
      .then((result) => {
        if (mounted) {
          setIdentity(result);
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

  return { 
    mask: identity?.mask || 'device_unknown',
    identity,
    loading, 
    error 
  };
}

/**
 * Format mask for display
 */
export function formatMaskForDisplay(mask: string): string {
  return mask;
}

/**
 * Check if mask is valid format
 */
export function isValidMaskFormat(mask: string): boolean {
  return /^device_[a-z0-9]{10}$/.test(mask);
}
