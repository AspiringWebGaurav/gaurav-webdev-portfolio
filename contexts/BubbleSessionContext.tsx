'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BubbleSession } from '@/types/bubble';
import { generateVisitorId } from '@/lib/deviceFingerprint';
import { logSessionEventSync } from '@/lib/sessionLogger';
import smartPolling from '@/lib/smartPolling';

interface BubbleSessionContextType {
  session: BubbleSession | null;
  visitorId: string | null;
  loading: boolean;
  initializeSession: () => Promise<void>;
  updateSession: (data: Partial<BubbleSession>) => Promise<void>;
  setVisitorEmail: (email: string) => Promise<void>;
  markTooltipRead: () => Promise<void>;
  destroySession: () => Promise<void>;
}

const BubbleSessionContext = createContext<BubbleSessionContextType | undefined>(undefined);

/**
 * UUID-Only Session Management
 * 
 * Simple, stateless approach:
 * - No cookies, no tokens, no authentication
 * - Device UUID generated on first visit (device_<fingerprint>)
 * - UUID stored in memory only
 * - All API calls include UUID in body/query
 * - Server validates and fetches session by UUID
 */

export function BubbleSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<BubbleSession | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  /**
   * Initialize session - generate UUID and create/fetch session
   * 
   * Flow:
   * 1. Generate device_ UUID from browser fingerprint
   * 2. Try to fetch existing session (GET /api/session?visitorId=xxx)
   * 3. If not found, create new session (POST /api/session)
   * 4. Store UUID in memory (component state)
   */
  const initializeSession = useCallback(async () => {
    if (isInitializing) {
      console.log('[BubbleSession] Already initializing, skipping...');
      return;
    }

    try {
      setIsInitializing(true);
      setLoading(true);
      
      // Generate device UUID
      const deviceId = generateVisitorId(); // device_<fingerprint>
      setVisitorId(deviceId);

      console.log('[BubbleSession] Generated UUID:', deviceId);

      // Try to fetch existing session
      const getResponse = await fetch(`/api/session?visitorId=${deviceId}`, {
        method: 'GET',
      });

      if (getResponse.status === 404) {
        // No session exists - create new one
        console.log('[BubbleSession] No existing session, creating new one');
        
        const createResponse = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId: deviceId }),
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create session');
        }

        const createData = await createResponse.json();
        console.log('[BubbleSession] ✓ New session created:', deviceId);
        logSessionEventSync('session_created', deviceId, { visitorId: deviceId });

        // Fetch the newly created session
        const fetchResponse = await fetch(`/api/session?visitorId=${deviceId}`, {
          method: 'GET',
        });

        if (fetchResponse.ok) {
          const fetchData = await fetchResponse.json();
          setSession(fetchData.session);
          console.log('[BubbleSession] ✓ Session data loaded');
        }
      } else if (getResponse.ok) {
        // Existing session found
        const getData = await getResponse.json();
        setSession(getData.session);
        console.log('[BubbleSession] ✓ Existing session found:', deviceId);
        logSessionEventSync('session_retrieved', deviceId, { visitorId: deviceId });
      } else {
        throw new Error(`Unexpected response: ${getResponse.status}`);
      }
    } catch (error) {
      console.error('[BubbleSession] ✗ Failed to initialize session:', error);
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
      console.error('[BubbleSession] Cannot update - no visitorId');
      return;
    }

    try {
      console.log('[BubbleSession] Updating session:', data);
      
      const response = await fetch('/api/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          visitorId,
          updates: data 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      const responseData = await response.json();
      setSession(responseData.session);
      console.log('[BubbleSession] ✓ Session updated');
      logSessionEventSync('session_updated', visitorId, { updates: data });
    } catch (error) {
      console.error('[BubbleSession] ✗ Failed to update session:', error);
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
      console.log('[BubbleSession] Destroying session...');
      
      const response = await fetch('/api/session', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      });

      if (response.ok) {
        setSession(null);
        setVisitorId(null);
        console.log('[BubbleSession] ✓ Session destroyed');
      }
    } catch (error) {
      console.error('[BubbleSession] ✗ Failed to destroy session:', error);
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
      console.log('[BubbleSession] Skipping poll - no visitorId');
      return;
    }

    try {
      const response = await fetch(`/api/session?visitorId=${visitorId}`, {
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
            
            // Log only when tooltip status changes
            if (!prev || prev.hasUnreadTooltip !== data.session.hasUnreadTooltip) {
              console.log('[BubbleSession] 🔔 Tooltip status updated:', {
                hasUnread: data.session.hasUnreadTooltip,
                unreadCount: data.session.unreadAdminReplies,
                messageCount: data.session.messageCount
              });
            }
            
            return updated;
          });
        }
      } else {
        console.warn('[BubbleSession] Poll failed:', response.status);
      }
    } catch (error) {
      console.error('[BubbleSession] Poll error:', error);
    }
  }, [visitorId]);

  // Setup smart polling for tooltip updates
  useEffect(() => {
    if (!visitorId) {
      console.log('[BubbleSession] Polling not started - waiting for visitorId');
      return;
    }

    console.log('[BubbleSession] 🚀 Starting tooltip polling for UUID:', visitorId.substring(0, 16) + '...');

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
      console.log('[BubbleSession] Running initial tooltip check...');
      checkForTooltipUpdates();
    }, 500); // Reduced from 2000ms to 500ms for faster startup

    return () => {
      console.log('[BubbleSession] ⏹️ Stopping tooltip polling');
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
