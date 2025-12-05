"use client";

/**
 * Visitor Event Tracking Hook
 * 
 * IMPORTANT: This hook is for EVENT TRACKING ONLY (resume_view, contact_open, etc.)
 * Session initialization is handled by <VisitorTracker /> component in layout.tsx
 * 
 * - ROBUST: Uses reliability layer for guaranteed delivery
 * - Uses UUID-sync system for visitor identification
 * - No automatic session_start (prevents duplicates)
 */

import { useRef, useCallback } from "react";
import { getAnalyticsReliability } from "@/lib/analyticsReliability";
import { useBubbleSession } from "@/contexts/BubbleSessionContext";

interface TrackingEvent {
  type: "resume_view" | "resume_download" | "contact_open" | "form_submit";
  timestamp: Date;
  data?: any;
  url?: string;
  metadata?: Record<string, any>;
}

export function useVisitorTracking() {
  const sessionIdRef = useRef<string | null>(null);
  const visitorIdRef = useRef<string | null>(null);
  
  // Get mask from BubbleSessionContext (single source of truth)
  const { visitorId: maskFromContext } = useBubbleSession();
  
  // Get analytics reliability layer
  const analyticsRef = useRef(getAnalyticsReliability());
  
  // Set visitor ID from context
  if (maskFromContext && !visitorIdRef.current) {
    visitorIdRef.current = maskFromContext;
    sessionIdRef.current = maskFromContext;
    analyticsRef.current.setVisitorMask(maskFromContext);
  }

  /**
   * Track an event using the reliability layer - GUARANTEED DELIVERY
   * Supports both full event object and simple string type
   */
  const trackEvent = useCallback(async (eventOrType: TrackingEvent | string, data?: any) => {
    // Normalize input to TrackingEvent object
    const event: TrackingEvent = typeof eventOrType === 'string' 
      ? { type: eventOrType as TrackingEvent['type'], timestamp: new Date(), data }
      : eventOrType;

    // Ensure timestamp exists
    if (!event.timestamp) {
      event.timestamp = new Date();
    }
    if (!visitorIdRef.current || !sessionIdRef.current) {
      console.warn('[VisitorTracking] Cannot track - visitor/session not initialized');
      // Store event for retry when initialized
      setTimeout(() => {
        if (visitorIdRef.current && sessionIdRef.current) {
          console.log('[VisitorTracking] Retrying event after initialization');
          trackEvent(event);
        }
      }, 1000);
      return;
    }

    try {
      // Prepare metadata with all context
      const metadata = {
        ...event.metadata,
        visitorId: visitorIdRef.current,
        sessionId: sessionIdRef.current,
        url: event.url || (typeof window !== 'undefined' ? window.location.href : undefined),
        timestamp: event.timestamp.toISOString(),
        data: event.data,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      };

      // Track with reliability layer (handles all retries automatically)
      await analyticsRef.current.trackEvent(event.type, metadata);
      
      console.log(`[VisitorTracking] ✅ Event tracked successfully: ${event.type}`);
    } catch (error) {
      // Reliability layer handles all errors - this should never throw
      // But if it does, log it for debugging
      console.error('[VisitorTracking] Unexpected error:', error);
      
      // Last resort: Try again after 2 seconds
      setTimeout(() => {
        console.log('[VisitorTracking] Emergency retry for:', event.type);
        analyticsRef.current.trackEvent(event.type, {
          ...event.metadata,
          emergencyRetry: true,
          originalError: error instanceof Error ? error.message : 'Unknown',
        }).catch(err => {
          console.error('[VisitorTracking] Emergency retry also failed:', err);
        });
      }, 2000);
    }
  }, []);

  // Public API for manual tracking - GUARANTEED DELIVERY FOR ALL 4 EVENTS
  return {
    trackEvent,
    trackResumeView: () => {
      console.log('[VisitorTracking] 📄 Tracking resume view');
      return trackEvent({ type: "resume_view", timestamp: new Date() });
    },
    trackResumeDownload: () => {
      console.log('[VisitorTracking] ⬇️ Tracking resume download [HIGH PRIORITY]');
      return trackEvent({ type: "resume_download", timestamp: new Date() });
    },
    trackContactOpen: () => {
      console.log('[VisitorTracking] 📧 Tracking contact form open');
      return trackEvent({ type: "contact_open", timestamp: new Date() });
    },
    trackFormSubmit: (data: any) => {
      console.log('[VisitorTracking] ✉️ Tracking form submission [HIGH PRIORITY]');
      return trackEvent({ type: "form_submit", timestamp: new Date(), data });
    },
  };
}
