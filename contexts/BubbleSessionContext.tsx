'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BubbleSession } from '@/types/bubble';
import { generateDeviceFingerprint } from '@/lib/deviceFingerprint';
import { logSessionEventSync } from '@/lib/sessionLogger';
import smartPolling from '@/lib/smartPolling';
import { clientIdentifyVisitor, clientIdentifyVisitorEnhanced, EnhancedIdentityResult } from '@/lib/uuid-sync';
import { getCachedIdentity, setCachedIdentity } from '@/lib/identityCache';
import logger from '@/lib/logger';

interface BubbleSessionContextType {
  session: BubbleSession | null;
  visitorId: string | null;  // Public mask (device_**********) from UUID-sync
  identity: EnhancedIdentityResult | null; // Full identity with ban status
  loading: boolean;
  initializeSession: () => Promise<void>;
  updateSession: (data: Partial<BubbleSession>) => Promise<void>;
  setVisitorEmail: (email: string) => Promise<void>;
  markTooltipRead: () => Promise<void>;
  destroySession: () => Promise<void>;
}

const BubbleSessionContext = createContext<BubbleSessionContextType | undefined>(undefined);

/**
 * UUID-Sync Session Management (Enhanced)
 * 
 * Enhanced multi-signal identity approach:
 * - No cookies, no localStorage - pure API sync
 * - Device mask generated via UUID-sync system (device_**********)
 * - Multiple fingerprint signals (canvas, webgl, audio, fonts)
 * - Device token stored in memory for session continuity
 * - All signals checked against identity graph for ban enforcement
 */

export function BubbleSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<BubbleSession | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [identity, setIdentity] = useState<EnhancedIdentityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  /**
   * Initialize session - generate mask and create/fetch session
   * 
   * Enhanced Flow:
   * 1. Generate primary fingerprint from browser
   * 2. Identify visitor via enhanced UUID-sync (multiple signals)
   * 3. Check if banned during identification
   * 4. Try to fetch existing session (GET /api/session?mask=device_**)
   * 5. If not found, create new session (POST /api/session with mask)
   * 6. Store mask in memory (component state)
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
        logger.debug('[BubbleSession] ⏭️ Skipping session init on', pathname, '(not a visitor)');
        setLoading(false);
        return;
      }
    }

    try {
      setIsInitializing(true);
      setLoading(true);
      
      // Get fingerprint and identify visitor using enhanced UUID-sync
      const fingerprint = generateDeviceFingerprint();
      
      // Check cache first (0 Firebase reads if hit)
      let identity = getCachedIdentity(fingerprint);
      
      if (identity) {
        logger.debug('[BubbleSession] 🚀 Using cached identity - 0 Firebase reads!');
      } else {
        // Cache miss - call API (2-3 Firebase reads)
        logger.debug('[BubbleSession] 📡 Cache miss - fetching from API');
        identity = await clientIdentifyVisitorEnhanced(fingerprint);
        
        // Store in cache for future use
        setCachedIdentity(fingerprint, identity);
      }
      
      const mask = identity.mask;
      
      // Store identity in state (for BanGate and other consumers)
      setIdentity(identity);
      
      setVisitorId(mask);

      // Check if banned during identification (enhanced check already done)
      if (identity.banned) {
        console.log('[BubbleSession] ⛔ BANNED VISITOR (from identity-enhanced) - Redirecting');
        
        const params = new URLSearchParams({
          reason: identity.banReason || 'Security Violation',
          category: identity.banCategory || 'normal',
          banType: identity.banType || 'permanent',
          timestamp: new Date().toISOString(),
        });
        
        window.location.replace(`/banned?${params.toString()}`);
        return;
      }

      console.log('[BubbleSession] ✅ Not banned - proceeding with session init');
      console.log('[BubbleSession] 📍 Identity:', { 
        mask: mask?.substring(0, 15), 
        matchedSignal: identity.matchedSignal,
        isNew: identity.isNewIdentity,
        banned: identity.banned,
        cached: !!getCachedIdentity(fingerprint)
      });

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
   * Smart polling for tooltip - Check if admin has sent new messages
   * This runs ONLY when chat is closed to show tooltip notifications
   * When chat opens, BubbleMessageContext takes over with realtime polling
   */
  const checkForTooltipUpdates = useCallback(async () => {
    if (!visitorId) return;

    try {
      const response = await fetch(`/api/session?mask=${visitorId}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.session) {
          // Update session state to trigger tooltip
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
      logger.debug('[BubbleSession] ⚠️ Tooltip poll failed:', error);
    }
  }, [visitorId]);

  // Setup smart polling for tooltip - live reactive notifications
  useEffect(() => {
    if (!visitorId) return;

    // Register smart polling for tooltip updates
    smartPolling.register(
      'bubble-tooltip-check',
      checkForTooltipUpdates,
      {
        intervals: {
          realtime: 5000,   // 5s when page active (fast notifications)
          active: 10000,    // 10s normal activity
          idle: 30000,      // 30s when idle
          background: 60000, // 1min when tab hidden
        },
        priority: 'normal', // Normal priority for user notifications
        maxIdleTime: 120000, // 2 minutes
        stopOnHidden: false, // Keep polling even when hidden (user wants notifications)
        tag: 'BubbleTooltip',
      }
    );

    // Start polling immediately
    smartPolling.setMode('bubble-tooltip-check', 'realtime');
    
    // Initial check
    setTimeout(() => {
      checkForTooltipUpdates();
    }, 1000);

    return () => {
      smartPolling.unregister('bubble-tooltip-check');
    };
  }, [visitorId, checkForTooltipUpdates]);

  return (
    <BubbleSessionContext.Provider
      value={{
        session,
        visitorId,
        identity,
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
