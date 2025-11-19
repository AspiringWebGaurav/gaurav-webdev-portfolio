/**
 * Helper: Get country from timezone (fallback detection)
 */
function getCountryFromTimezone(timezone: string): { country: string; code: string } {
  const tzMap: Record<string, { country: string; code: string }> = {
    'America/New_York': { country: 'United States', code: 'US' },
    'America/Chicago': { country: 'United States', code: 'US' },
    'America/Denver': { country: 'United States', code: 'US' },
    'America/Los_Angeles': { country: 'United States', code: 'US' },
    'America/Phoenix': { country: 'United States', code: 'US' },
    'America/Toronto': { country: 'Canada', code: 'CA' },
    'America/Vancouver': { country: 'Canada', code: 'CA' },
    'Europe/London': { country: 'United Kingdom', code: 'GB' },
    'Europe/Paris': { country: 'France', code: 'FR' },
    'Europe/Berlin': { country: 'Germany', code: 'DE' },
    'Europe/Madrid': { country: 'Spain', code: 'ES' },
    'Europe/Rome': { country: 'Italy', code: 'IT' },
    'Europe/Amsterdam': { country: 'Netherlands', code: 'NL' },
    'Asia/Kolkata': { country: 'India', code: 'IN' },
    'Asia/Shanghai': { country: 'China', code: 'CN' },
    'Asia/Tokyo': { country: 'Japan', code: 'JP' },
    'Asia/Seoul': { country: 'South Korea', code: 'KR' },
    'Asia/Dubai': { country: 'United Arab Emirates', code: 'AE' },
    'Asia/Singapore': { country: 'Singapore', code: 'SG' },
    'Australia/Sydney': { country: 'Australia', code: 'AU' },
    'Australia/Melbourne': { country: 'Australia', code: 'AU' },
    'Pacific/Auckland': { country: 'New Zealand', code: 'NZ' },
  };
  
  return tzMap[timezone] || { country: 'Global Visitor', code: 'INTL' };
}

/**
 * Advanced Visitor Tracking Hook
 * Tracks visitors with maximum accuracy without consent
 * - Device fingerprinting
 * - Geolocation
 * - Session persistence
 * - Heartbeat mechanism
 * - Behavioral tracking (mouse, scroll, clicks)
 * - Time tracking
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { generateDeviceFingerprint } from "@/lib/deviceFingerprint";

interface TrackingEvent {
  type: "page_view" | "interaction" | "scroll" | "mouse_move" | "click" | "resume_view" | "resume_download" | "contact_open" | "form_submit" | "heartbeat";
  timestamp: Date;
  data?: any;
  url?: string;
  metadata?: {
    scrollDepth?: number;
    timeOnPage?: number;
    mousePosition?: { x: number; y: number };
    clickTarget?: string;
    interactionCount?: number;
  };
}

export function useVisitorTracking() {
  const sessionIdRef = useRef<string | null>(null);
  const visitorIdRef = useRef<string | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const lastHeartbeatRef = useRef<number>(Date.now());
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const maxScrollDepthRef = useRef<number>(0);
  const interactionCountRef = useRef<number>(0);
  const isTrackingRef = useRef<boolean>(false);
  
  // 🔥 CRITICAL: Batch events to prevent API spam
  const eventQueueRef = useRef<TrackingEvent[]>([]);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFlushRef = useRef<number>(Date.now());

  /**
   * Initialize visitor tracking session
   */
  const initializeTracking = useCallback(async () => {
    if (isTrackingRef.current) return;
    isTrackingRef.current = true;

    try {
      // Get deterministic device fingerprint (NO localStorage - pure calculation)
      const { generateEnhancedFingerprint } = await import("@/lib/deviceFingerprint");
      const fingerprint = await generateEnhancedFingerprint();
      visitorIdRef.current = fingerprint;

      console.log('[VisitorTracking] Device fingerprint generated:', fingerprint);

      // Get geolocation (non-blocking) - try multiple sources for reliability
      let geoData = null;
      let isLocalhost = false;
      
      // Check if running on localhost/local network
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || 
          hostname === '127.0.0.1' || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.16.') ||
          hostname === '[::1]') {
        isLocalhost = true;
        // Create special localhost geo data
        geoData = {
          ip: 'localhost',
          city: 'Local Development',
          region: 'Local',
          country_name: 'Localhost',
          country_code: 'LOCAL',
          latitude: 0,
          longitude: 0,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          org: 'Local Network',
        };
        console.log('[VisitorTracking] Detected localhost environment');
      } else {
        // Not localhost, try to get real geolocation
        try {
          // Try ipapi.co first (more detailed)
          const geoResponse = await fetch("https://ipapi.co/json/", {
            signal: AbortSignal.timeout(3000), // 3s timeout
          });
          if (geoResponse.ok) {
            const data = await geoResponse.json();
            // Validate we got real data
            if (data && data.country_name && data.country_name !== 'Unknown') {
              geoData = data;
              console.log('[VisitorTracking] Geolocation from ipapi.co:', data.country_name);
            }
          }
        } catch (err) {
          console.log("Primary geolocation failed, trying fallback");
        }
        
        // Fallback to ip-api.com if primary fails
        if (!geoData) {
          try {
            const fallbackResponse = await fetch("http://ip-api.com/json/", {
              signal: AbortSignal.timeout(3000),
            });
            if (fallbackResponse.ok) {
              const data = await fallbackResponse.json();
              if (data && data.status === 'success' && data.country && data.country !== 'Unknown') {
                // Transform to ipapi.co format
                geoData = {
                  ip: data.query,
                  city: data.city || 'Unknown City',
                  region: data.regionName || 'Unknown Region',
                  country_name: data.country,
                  country_code: data.countryCode,
                  latitude: data.lat,
                  longitude: data.lon,
                  timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                  org: data.isp || 'Unknown ISP',
                };
                console.log('[VisitorTracking] Geolocation from ip-api.com:', data.country);
              }
            }
          } catch (err) {
            console.log("Fallback geolocation also failed, using timezone-based detection");
          }
        }
        
        // Last resort: Timezone-based country detection
        if (!geoData) {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const countryFromTz = getCountryFromTimezone(timezone);
          geoData = {
            ip: 'unknown',
            city: 'Unknown',
            region: 'Unknown',
            country_name: countryFromTz.country,
            country_code: countryFromTz.code,
            latitude: 0,
            longitude: 0,
            timezone: timezone,
            org: 'Unknown ISP',
          };
          console.log('[VisitorTracking] Using timezone-based location:', countryFromTz.country);
        }
      }

      // Collect comprehensive visitor data
      const visitorData = {
        visitorId: fingerprint,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer || "direct",
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages,
        platform: navigator.platform,
        vendor: navigator.vendor,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight,
          colorDepth: window.screen.colorDepth,
          pixelDepth: window.screen.pixelDepth,
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        online: navigator.onLine,
        connection: (navigator as any).connection ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt,
          saveData: (navigator as any).connection.saveData,
        } : null,
        deviceMemory: (navigator as any).deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
        maxTouchPoints: navigator.maxTouchPoints,
        geolocation: geoData ? {
          ip: geoData.ip,
          city: geoData.city,
          region: geoData.region,
          country: geoData.country_name,
          countryCode: geoData.country_code,
          latitude: geoData.latitude,
          longitude: geoData.longitude,
          timezone: geoData.timezone,
          isp: geoData.org,
        } : null,
        browser: {
          name: getBrowserName(),
          version: getBrowserVersion(),
        },
        os: {
          name: getOSName(),
          version: getOSVersion(),
        },
        device: {
          type: getDeviceType(),
          isMobile: /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
          isTablet: /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent),
          isDesktop: !/Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
        },
        battery: await getBatteryInfo(),
      };

      // Send tracking data to API
      const response = await fetch("/api/visitor-analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "session_start",
          visitorData,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        sessionIdRef.current = result.sessionId;
        console.log("[VisitorTracking] Session initialized:", result.sessionId);
      }
    } catch (error) {
      console.error("[VisitorTracking] Initialization error:", error);
    }
  }, []);

  /**
   * Flush batched events to API (reduces API calls by 90%!)
   */
  const flushEvents = useCallback(async () => {
    if (eventQueueRef.current.length === 0) return;
    if (!visitorIdRef.current || !sessionIdRef.current) return;

    const eventsToSend = [...eventQueueRef.current];
    eventQueueRef.current = []; // Clear queue immediately
    lastFlushRef.current = Date.now();

    try {
      // Send all events in ONE API call
      await fetch("/api/visitor-analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId: visitorIdRef.current,
          sessionId: sessionIdRef.current,
          events: eventsToSend.map(e => ({
            eventType: e.type,
            data: e.data,
            metadata: {
              ...e.metadata,
              url: e.url || window.location.href,
              timestamp: e.timestamp.toISOString(),
            },
          })),
        }),
      });
    } catch (error) {
      console.error("[VisitorTracking] Flush error:", error);
      // Don't retry - just drop the events to prevent spam
    }
  }, []);

  /**
   * Track an event (BATCHED - queues events and flushes every 10 seconds)
   */
  const trackEvent = useCallback(async (event: TrackingEvent) => {
    if (!visitorIdRef.current || !sessionIdRef.current) return;

    // Add to queue
    eventQueueRef.current.push(event);

    // Cancel existing flush timeout
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
    }

    // Flush after 10 seconds of inactivity OR when queue reaches 10 events
    const shouldFlushNow = eventQueueRef.current.length >= 10 || 
                          (Date.now() - lastFlushRef.current) > 30000;

    if (shouldFlushNow) {
      await flushEvents();
    } else {
      // Schedule flush in 10 seconds
      flushTimeoutRef.current = setTimeout(flushEvents, 10000);
    }
  }, [flushEvents]);

  /**
   * Send heartbeat to track active session time accurately
   */
  const sendHeartbeat = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastHeartbeat = now - lastHeartbeatRef.current;
    const totalTimeOnPage = now - sessionStartRef.current;

    await trackEvent({
      type: "heartbeat",
      timestamp: new Date(),
      metadata: {
        timeOnPage: Math.floor(totalTimeOnPage / 1000),
        scrollDepth: maxScrollDepthRef.current,
        interactionCount: interactionCountRef.current,
      },
    });

    lastHeartbeatRef.current = now;
  }, [trackEvent]);

  /**
   * Track mouse movement (throttled)
   */
  const trackMouseMove = useCallback((e: MouseEvent) => {
    mousePositionRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  /**
   * Track scroll depth
   */
  const trackScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    
    if (scrollPercent > maxScrollDepthRef.current) {
      maxScrollDepthRef.current = scrollPercent;
      
      // Track milestone scrolls (25%, 50%, 75%, 100%)
      if (scrollPercent === 25 || scrollPercent === 50 || scrollPercent === 75 || scrollPercent === 100) {
        trackEvent({
          type: "scroll",
          timestamp: new Date(),
          metadata: {
            scrollDepth: scrollPercent,
          },
        });
      }
    }
  }, [trackEvent]);

  /**
   * Track clicks
   */
  const trackClick = useCallback((e: MouseEvent) => {
    interactionCountRef.current++;
    
    const target = e.target as HTMLElement;
    const clickData = {
      tag: target.tagName,
      id: target.id,
      class: target.className,
      text: target.textContent?.substring(0, 50),
      href: target instanceof HTMLAnchorElement ? target.href : undefined,
    };

    trackEvent({
      type: "click",
      timestamp: new Date(),
      metadata: {
        clickTarget: JSON.stringify(clickData),
        mousePosition: mousePositionRef.current,
      },
      data: clickData,
    });
  }, [trackEvent]);

  /**
   * Track page view
   */
  const trackPageView = useCallback(() => {
    trackEvent({
      type: "page_view",
      timestamp: new Date(),
      url: window.location.href,
    });
  }, [trackEvent]);

  /**
   * Setup event listeners
   */
  useEffect(() => {
    // Initialize tracking
    initializeTracking();

    // Track page view
    trackPageView();

    // Mouse movement tracking (throttled to every 2 seconds)
    let mouseThrottle: NodeJS.Timeout;
    const throttledMouseMove = (e: MouseEvent) => {
      if (!mouseThrottle) {
        trackMouseMove(e);
        mouseThrottle = setTimeout(() => {
          mouseThrottle = null as any;
        }, 2000);
      }
    };

    // Scroll tracking (throttled to every 500ms)
    let scrollThrottle: NodeJS.Timeout;
    const throttledScroll = () => {
      if (!scrollThrottle) {
        trackScroll();
        scrollThrottle = setTimeout(() => {
          scrollThrottle = null as any;
        }, 500);
      }
    };

    // Event listeners
    window.addEventListener("mousemove", throttledMouseMove);
    window.addEventListener("scroll", throttledScroll);
    window.addEventListener("click", trackClick);

    // Heartbeat every 30 seconds (optimized to reduce Firebase writes)
    // This still provides accurate session tracking while reducing costs
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendHeartbeat(); // Send final heartbeat before tab becomes hidden
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Track session end
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        // Use sendBeacon for guaranteed delivery
        navigator.sendBeacon(
          "/api/visitor-analytics/track",
          JSON.stringify({
            event: "session_end",
            visitorId: visitorIdRef.current,
            sessionId: sessionIdRef.current,
            metadata: {
              timeOnPage: Math.floor((Date.now() - sessionStartRef.current) / 1000),
              scrollDepth: maxScrollDepthRef.current,
              interactionCount: interactionCountRef.current,
            },
          })
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", throttledMouseMove);
      window.removeEventListener("scroll", throttledScroll);
      window.removeEventListener("click", trackClick);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(heartbeatInterval);
      if (mouseThrottle) clearTimeout(mouseThrottle);
      if (scrollThrottle) clearTimeout(scrollThrottle);
    };
  }, [initializeTracking, trackPageView, trackMouseMove, trackScroll, trackClick, sendHeartbeat]);

  // Public API for manual tracking
  return {
    trackEvent,
    trackResumeView: () => trackEvent({ type: "resume_view", timestamp: new Date() }),
    trackResumeDownload: () => trackEvent({ type: "resume_download", timestamp: new Date() }),
    trackContactOpen: () => trackEvent({ type: "contact_open", timestamp: new Date() }),
    trackFormSubmit: (data: any) => trackEvent({ type: "form_submit", timestamp: new Date(), data }),
  };
}

// Helper functions
function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.indexOf("Firefox") > -1) return "Firefox";
  if (ua.indexOf("SamsungBrowser") > -1) return "Samsung Internet";
  if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) return "Opera";
  if (ua.indexOf("Trident") > -1) return "Internet Explorer";
  if (ua.indexOf("Edge") > -1) return "Edge";
  if (ua.indexOf("Chrome") > -1) return "Chrome";
  if (ua.indexOf("Safari") > -1) return "Safari";
  return "Unknown";
}

function getBrowserVersion(): string {
  const ua = navigator.userAgent;
  let match = ua.match(/(firefox|opera|chrome|safari|trident|edge)\/?\s*(\d+)/i);
  if (match) return match[2];
  return "Unknown";
}

function getOSName(): string {
  const ua = navigator.userAgent;
  if (ua.indexOf("Win") > -1) return "Windows";
  if (ua.indexOf("Mac") > -1) return "macOS";
  if (ua.indexOf("Linux") > -1) return "Linux";
  if (ua.indexOf("Android") > -1) return "Android";
  if (ua.indexOf("iOS") > -1) return "iOS";
  return "Unknown";
}

function getOSVersion(): string {
  const ua = navigator.userAgent;
  let match = ua.match(/Windows NT (\d+\.\d+)/);
  if (match) return match[1];
  match = ua.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
  if (match) return match[1].replace(/_/g, ".");
  match = ua.match(/Android (\d+\.\d+)/);
  if (match) return match[1];
  return "Unknown";
}

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent;
  if (/iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "tablet";
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
}

async function getBatteryInfo(): Promise<any> {
  try {
    if ("getBattery" in navigator) {
      const battery: any = await (navigator as any).getBattery();
      return {
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
      };
    }
  } catch (err) {
    // Battery API not available
  }
  return null;
}
