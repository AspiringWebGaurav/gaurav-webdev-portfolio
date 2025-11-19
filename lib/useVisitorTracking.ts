/**
 * Client-side Analytics Tracker Hook
 * Minimal, non-intrusive event tracking that sends data to server
 */

"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { VisitorEventType } from "@/types/visitorAnalytics";

// Session management
let sessionId: string | null = null;
let sessionStartTime: number | null = null;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Hook to track visitor analytics events
 */
export function useVisitorTracking() {
  const pathname = usePathname();
  const lastPageView = useRef<string | null>(null);
  const pageStartTime = useRef<number | null>(null);

  /**
   * Send event to server
   */
  const trackEvent = useCallback(async (
    eventType: VisitorEventType,
    metadata?: Record<string, any>
  ) => {
    try {
      // Don't track admin panel events
      if (pathname?.startsWith("/admin")) {
        return;
      }

      // Get viewport dimensions
      const viewportWidth = typeof window !== "undefined" ? window.innerWidth : undefined;
      const viewportHeight = typeof window !== "undefined" ? window.innerHeight : undefined;

      const response = await fetch("/api/visitor-analytics/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventType,
          metadata: {
            ...metadata,
            page: pathname,
            referrer: typeof document !== "undefined" ? document.referrer : undefined,
            viewportWidth,
            viewportHeight,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store session ID for subsequent requests
        if (data.sessionId) {
          sessionId = data.sessionId;
          if (!sessionStartTime) {
            sessionStartTime = Date.now();
          }
        }
      }
    } catch (error) {
      // Silently fail - analytics should not break user experience
      console.debug("Analytics tracking error:", error);
    }
  }, [pathname]);

  /**
   * Track page view on mount and pathname change
   */
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    // Don't track same page twice in a row
    if (lastPageView.current === pathname) return;

    // Track page view
    trackEvent("page_view");
    lastPageView.current = pathname;
    pageStartTime.current = Date.now();

    // Cleanup: track page duration on unmount
    return () => {
      if (pageStartTime.current) {
        const duration = Date.now() - pageStartTime.current;
        // Only track if spent more than 1 second on page
        if (duration > 1000) {
          trackEvent("page_view", { duration });
        }
      }
    };
  }, [pathname, trackEvent]);

  /**
   * Track session start on first load
   */
  useEffect(() => {
    if (!sessionStartTime && !pathname?.startsWith("/admin")) {
      trackEvent("session_start");
    }
  }, [trackEvent, pathname]);

  /**
   * Track session end on page unload
   */
  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    const handleBeforeUnload = () => {
      if (sessionStartTime) {
        const duration = Date.now() - sessionStartTime;
        navigator.sendBeacon(
          "/api/visitor-analytics/events",
          JSON.stringify({
            eventType: "session_end",
            metadata: { duration },
          })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [pathname]);

  return { trackEvent };
}

/**
 * Hook to track specific interactions
 */
export function useInteractionTracking() {
  const { trackEvent } = useVisitorTracking();

  const trackBubbleOpen = useCallback(() => {
    trackEvent("bubble_open");
  }, [trackEvent]);

  const trackBubbleClose = useCallback(() => {
    trackEvent("bubble_close");
  }, [trackEvent]);

  const trackBubbleInteraction = useCallback((interactionType: string) => {
    trackEvent("bubble_interaction", { interactionType });
  }, [trackEvent]);

  const trackResumeView = useCallback(() => {
    trackEvent("resume_view");
  }, [trackEvent]);

  const trackResumeDownload = useCallback(() => {
    trackEvent("resume_download");
  }, [trackEvent]);

  const trackFormSubmit = useCallback(() => {
    trackEvent("form_submit");
  }, [trackEvent]);

  const trackContactOpen = useCallback(() => {
    trackEvent("contact_open");
  }, [trackEvent]);

  return {
    trackBubbleOpen,
    trackBubbleClose,
    trackBubbleInteraction,
    trackResumeView,
    trackResumeDownload,
    trackFormSubmit,
    trackContactOpen,
  };
}
