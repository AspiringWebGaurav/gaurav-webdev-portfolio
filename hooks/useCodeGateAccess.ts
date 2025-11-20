/**
 * Code Gate Access Hook
 * Client-side hook to verify and enforce code gate access
 */

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { generateVisitorId } from '@/lib/deviceFingerprint';
import type { SessionCheckResponse } from '@/types/codeGate';

interface UseCodeGateOptions {
  enabled?: boolean;
  redirectOnFail?: boolean;
}

export function useCodeGateAccess(options: UseCodeGateOptions = {}) {
  const { enabled = true, redirectOnFail = true } = options;
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setHasAccess(true);
      return;
    }

    // Check sessionStorage first - if cleared recently, grant access immediately
    if (typeof window !== 'undefined') {
      const cleared = sessionStorage.getItem('code_gate_cleared');
      const timestamp = sessionStorage.getItem('code_gate_timestamp');
      
      if (cleared === 'true' && timestamp) {
        const timeSinceCleared = Date.now() - parseInt(timestamp);
        // If cleared within last 30 minutes, grant access without API call
        if (timeSinceCleared < 30 * 60 * 1000) {
          console.log('[CodeGate] Found recent clearance in sessionStorage, granting access');
          setHasAccess(true);
          setLoading(false);
          return;
        }
      }
    }

    checkAccess();
  }, [enabled, pathname]);

  const checkAccess = async () => {
    try {
      const visitorId = generateVisitorId();

      // Add delay to ensure database write has completed
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetch('/api/code-gate/session', {
        headers: {
          'x-visitor-id': visitorId
        }
      });

      const data: SessionCheckResponse = await response.json();

      console.log('[CodeGate] Access check result:', { 
        hasAccess: data.hasAccess, 
        banned: data.banned,
        pathname,
        visitorId: visitorId.substring(0, 16) + '...'
      });

      if (data.banned) {
        setIsBanned(true);
        setHasAccess(false);
        if (redirectOnFail && pathname !== '/banned') {
          router.push('/banned');
        }
        return;
      }

      if (!data.hasAccess) {
        setHasAccess(false);
        
        // Log the direct access attempt
        await logDirectAccess(visitorId, pathname);

        if (redirectOnFail && pathname !== '/admin/code-gate' && pathname !== '/banned' && pathname !== '/admin/login') {
          console.log('[CodeGate] No access, redirecting to code gate');
          router.push('/admin/code-gate');
        }
        return;
      }

      console.log('[CodeGate] Access granted');
      setHasAccess(true);
      
      // Store clearance in sessionStorage for subsequent page loads
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('code_gate_cleared', 'true');
        sessionStorage.setItem('code_gate_timestamp', Date.now().toString());
      }
    } catch (error) {
      console.error('Code gate check error:', error);
      setHasAccess(false);
      if (redirectOnFail) {
        router.push('/admin/code-gate');
      }
    } finally {
      setLoading(false);
    }
  };

  const logDirectAccess = async (visitorId: string, path: string) => {
    try {
      await fetch('/api/code-gate/log-direct-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          visitorId,
          attemptedPath: path
        })
      });
    } catch (error) {
      console.error('Failed to log direct access:', error);
    }
  };

  return {
    hasAccess,
    isBanned,
    loading,
    checkAccess
  };
}
