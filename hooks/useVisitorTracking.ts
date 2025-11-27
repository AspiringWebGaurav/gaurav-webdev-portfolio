"use client";

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
 * - ROBUST: Uses reliability layer for guaranteed delivery
 * NEW: Uses UUID-sync system for visitor identification
 */

import { useEffect, useRef, useCallback } from "react";
import { generateDeviceFingerprint } from "@/lib/deviceFingerprint";
import { getAnalyticsReliability } from "@/lib/analyticsReliability";
import { useBubbleSession } from "@/contexts/BubbleSessionContext";

interface TrackingEvent {
  type: "resume_view" | "resume_download" | "contact_open" | "form_submit";
  timestamp: Date;
  data?: any;
  metadata?: Record<string, any>;
}

// GLOBAL session tracking state (shared across all component instances)
let globalSessionStartSent = false;
let globalSessionInitializing = false;

export function useVisitorTracking() {
  const sessionIdRef = useRef<string | null>(null);
  const visitorIdRef = useRef<string | null>(null);
  const isTrackingRef = useRef<boolean>(false);
  
  // Get mask from BubbleSessionContext (single source of truth)
  const { visitorId: maskFromContext } = useBubbleSession();
  
  // Get analytics reliability layer
  const analyticsRef = useRef(getAnalyticsReliability());

  /**
   * Initialize visitor tracking session
   */
  const initializeTracking = useCallback(async () => {
    // CRITICAL: Use global flag to prevent multiple session_start events
    if (globalSessionStartSent || globalSessionInitializing) {
      console.log('[VisitorTracking] Session already started or initializing - skipping');
      return;
    }
    
    // Wait for mask from BubbleSessionContext
    if (!maskFromContext) {
      console.log('[VisitorTracking] Waiting for mask from BubbleSessionContext...');
      return;
    }
    
    // Set global flags immediately to prevent race conditions
    globalSessionInitializing = true;
    
    try {
      isTrackingRef.current = true;
      // Use mask from BubbleSessionContext (no duplicate identify call)
      const mask = maskFromContext;
      visitorIdRef.current = mask;

      // Register mask with analytics layer for batch requests
      analyticsRef.current.setVisitorMask(mask);

      console.log('[VisitorTracking] Using mask from BubbleSessionContext:', mask);

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
            signal: AbortSignal.timeout(5000), // 5s timeout
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
            const fallbackResponse = await fetch("https://ip-api.com/json/", {
              signal: AbortSignal.timeout(5000),
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
        mask,
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

      // Send session_start to create visitor profile and session
      sessionIdRef.current = mask; // Use mask as session ID
      console.log('[VisitorTracking] 🚀 Sending session_start to create visitor profile...');
      
      try {
        const response = await fetch('/api/visitor-analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'session_start',
            visitorData,
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('[VisitorTracking] ✅ Session started successfully:', result.sessionId);
          globalSessionStartSent = true; // Mark as successfully sent globally
        } else {
          console.error('[VisitorTracking] ❌ Failed to start session:', response.status);
          // Reset flags to allow retry
          globalSessionStartSent = false;
        }
      } catch (error) {
        console.error('[VisitorTracking] ❌ Error sending session_start:', error);
        // Reset flags to allow retry
        globalSessionStartSent = false;
      } finally {
        globalSessionInitializing = false;
      }
      
      console.log("[VisitorTracking] Session initialized:", sessionIdRef.current);
    } catch (error) {
      console.error("[VisitorTracking] Initialization error:", error);
      globalSessionInitializing = false;
    }
  }, [maskFromContext]);

  /**
   * Track an event using the reliability layer - GUARANTEED DELIVERY
   */
  const trackEvent = useCallback(async (event: TrackingEvent) => {
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

  // Automatic tracking removed - only manual high-value events tracked

  /**
   * Initialize tracking session (lightweight - no automatic events)
   * Waits for mask from BubbleSessionContext before initializing
   */
  useEffect(() => {
    if (maskFromContext) {
      initializeTracking();
    }
  }, [maskFromContext, initializeTracking]);

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
