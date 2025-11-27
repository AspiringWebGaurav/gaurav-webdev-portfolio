'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BubbleSession } from '@/types/bubble';
import { generateDeviceFingerprint } from '@/lib/deviceFingerprint';
import { logSessionEventSync } from '@/lib/sessionLogger';
import smartPolling from '@/lib/smartPolling';
import { clientIdentifyVisitor } from '@/lib/uuid-sync';

interface BubbleSessionContextType {
  session: BubbleSession | null;
  visitorId: string | null;  // Public mask (device_**********) from UUID-sync
  loading: boolean;
  initializeSession: () => Promise<void>;
  updateSession: (data: Partial<BubbleSession>) => Promise<void>;
  setVisitorEmail: (email: string) => Promise<void>;
  markTooltipRead: () => Promise<void>;
  destroySession: () => Promise<void>;
}

const BubbleSessionContext = createContext<BubbleSessionContextType | undefined>(undefined);

/**
 * UUID-Sync Session Management
 * 
 * Simple, stateless approach:
 * - No cookies, no tokens, no authentication
 * - Device mask generated via UUID-sync system (device_**********)
 * - Mask stored in memory only
 * - All API calls include mask in body/query
 * - Server translates mask to UUID and fetches session
 */

export function BubbleSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<BubbleSession | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  /**
   * Initialize session - generate mask and create/fetch session
   * 
   * Flow:
   * 1. Generate fingerprint from browser
   * 2. Identify visitor via UUID-sync (returns mask)
   * 3. Try to fetch existing session (GET /api/session?mask=device_**)
   * 4. If not found, create new session (POST /api/session with mask)
   * 5. Store mask in memory (component state)
   */
  const initializeSession = useCallback(async () => {
    if (isInitializing) {
      return;
    }

    // CRITICAL: Don't initialize session on /banned or /admin pages
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      
      // Skip visitor tracking for admin panel and banned page
      if (pathname === '/banned' || pathname.startsWith('/admin')) {
        console.log('[BubbleSession] ⏭️ Skipping session init on', pathname, '(not a visitor)');
        setLoading(false);
        return;
      }
    }

    try {
      setIsInitializing(true);
      setLoading(true);
      
      // Get fingerprint and identify visitor using UUID-sync
      const fingerprint = generateDeviceFingerprint();
      const mask = await clientIdentifyVisitor(fingerprint);
      
      setVisitorId(mask);

      // CRITICAL: Check ban status BEFORE fetching/creating session
      // This ensures banned visitors redirect immediately without seeing content
      console.log('[BubbleSession] 🔍 Checking ban status before session init...');
      
      const banCheckResponse = await fetch('/api/visitor-analytics/check-ban-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mask }),
        cache: 'no-store',
      });

      if (banCheckResponse.ok) {
        const banData = await banCheckResponse.json();
        
        if (banData.banned === true) {
          console.log('[BubbleSession] ⛔ BANNED VISITOR - Redirecting immediately');
          
          // IMMEDIATE redirect before session init
          const params = new URLSearchParams({
            reason: banData.banReason || 'Security Violation',
            category: banData.banCategory || 'normal',
            timestamp: new Date().toISOString(),
          });
          
          window.location.replace(`/banned?${params.toString()}`);
          return; // Stop session initialization
        }
      }

      console.log('[BubbleSession] ✅ Not banned - proceeding with session init');

      // Try to fetch existing session
      const getResponse = await fetch(`/api/session?mask=${mask}`, {
        method: 'GET',
      });

      if (getResponse.status === 404) {
        // No session exists - create new one
        const createResponse = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mask }),
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create session');
        }

        logSessionEventSync('session_created', mask, { mask });

        // Fetch the newly created session
        const fetchResponse = await fetch(`/api/session?mask=${mask}`, {
          method: 'GET',
        });

        if (fetchResponse.ok) {
          const fetchData = await fetchResponse.json();
          setSession(fetchData.session);
        }
      } else if (getResponse.ok) {
        // Existing session found
        const getData = await getResponse.json();
        setSession(getData.session);
        logSessionEventSync('session_retrieved', mask, { mask });
      } else {
        throw new Error(`Unexpected response: ${getResponse.status}`);
      }
    } catch (error) {
      setSession(null);
      setVisitorId(null);
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  }, [isInitializing]);

  /**
   * Update session data
   * Pure UUID-based - no cookies
   */
  const updateSession = useCallback(async (data: Partial<BubbleSession>) => {
    if (!visitorId) {
      return;
    }

    try {
      const response = await fetch('/api/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mask: visitorId,
          updates: data 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      const responseData = await response.json();
      setSession(responseData.session);
      logSessionEventSync('session_updated', visitorId, { mask: visitorId, updates: data });
    } catch (error) {
      // Silent fail
    }
  }, [visitorId]);

  /**
   * Set visitor email
   */
  const setVisitorEmail = useCallback(async (email: string) => {
    await updateSession({ visitorEmail: email });
  }, [updateSession]);

  /**
   * Mark tooltip as read
   */
  const markTooltipRead = useCallback(async () => {
    await updateSession({ hasUnreadTooltip: false, unreadAdminReplies: 0 });
  }, [updateSession]);

  /**
   * Destroy session - soft delete
   */
  const destroySession = useCallback(async () => {
    if (!visitorId) return;

    try {
      const response = await fetch('/api/session', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mask: visitorId }),
      });

      if (response.ok) {
        setSession(null);
        setVisitorId(null);
      }
    } catch (error) {
      // Silent fail
    }
  }, [visitorId]);

  // Initialize session on mount (only once)
  useEffect(() => {
    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Poll for tooltip updates - Check if admin has sent new messages
   * UUID-based polling - no cookies
   */
  const checkForTooltipUpdates = useCallback(async () => {
    if (!visitorId) {
      return;
    }

    try {
      const response = await fetch(`/api/session?mask=${visitorId}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.session) {
          // Update session state
          setSession(prev => {
            const updated = {
              ...prev,
              ...data.session,
              startedAt: data.session.startedAt ? new Date(data.session.startedAt) : prev?.startedAt,
              lastActive: data.session.lastActive ? new Date(data.session.lastActive) : prev?.lastActive,
            };
            
            return updated;
          });
        }
      }
    } catch (error) {
      // Silent fail
    }
  }, [visitorId]);

  // Setup smart polling for tooltip updates
  useEffect(() => {
    if (!visitorId) {
      return;
    }

    smartPolling.register(
      'bubble-tooltip-check',
      checkForTooltipUpdates,
      {
        intervals: {
          realtime: 2000,   // 2s when page is active - fast tooltip detection
          active: 3000,     // 3s normal - still very responsive
          idle: 8000,       // 8s when idle
          background: 15000, // 15s when tab hidden
        },
        priority: 'critical' as const, // Upgraded to critical for instant focus detection
        maxIdleTime: 120000, // 2 minutes
        stopOnHidden: false, // Keep checking even when tab hidden
        tag: 'BubbleTooltip (UUID-based) - Enhanced',
      }
    );

    // Trigger initial check immediately
    setTimeout(() => {
      checkForTooltipUpdates();
    }, 500); // Reduced from 2000ms to 500ms for faster startup

    return () => {
      smartPolling.unregister('bubble-tooltip-check');
    };
  }, [visitorId, checkForTooltipUpdates]);

  return (
    <BubbleSessionContext.Provider
      value={{
        session,
        visitorId,
        loading,
        initializeSession,
        updateSession,
        setVisitorEmail,
        markTooltipRead,
        destroySession,
      }}
    >
      {children}
    </BubbleSessionContext.Provider>
  );
}

export function useBubbleSession() {
  const context = useContext(BubbleSessionContext);
  if (context === undefined) {
    throw new Error('useBubbleSession must be used within a BubbleSessionProvider');
  }
  return context;
}
