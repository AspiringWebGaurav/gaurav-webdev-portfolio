'use client';

/**
 * Global Visitor Tracker - SINGLE SOURCE OF TRUTH
 * 
 * This component is mounted ONCE at the app level (in layout.tsx)
 * It handles the SINGLE session_start call to prevent duplicate visitor entries
 * 
 * All other components that need tracking should use useVisitorTracking()
 * for event tracking only (resume_view, resume_download, etc.)
 */

import { useEffect, useRef, useCallback } from 'react';
import { useBubbleSession } from '@/contexts/BubbleSessionContext';
import { generateDeviceFingerprint } from '@/lib/deviceFingerprint';
import { getAnalyticsReliability } from '@/lib/analyticsReliability';

// GLOBAL session tracking state (shared across all component instances)
let globalSessionStartSent = false;
let globalSessionInitializing = false;

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

export default function VisitorTracker() {
  const sessionIdRef = useRef<string | null>(null);
  const { visitorId: maskFromContext } = useBubbleSession();
  const analyticsRef = useRef(getAnalyticsReliability());

  /**
   * Initialize visitor tracking session - RUNS ONLY ONCE PER PAGE LOAD
   */
  const initializeTracking = useCallback(async () => {
    // CRITICAL: Use global flag to prevent multiple session_start events
    if (globalSessionStartSent || globalSessionInitializing) {
      console.log('[VisitorTracker] Session already started or initializing - skipping');
      return;
    }
    
    // Wait for mask from BubbleSessionContext
    if (!maskFromContext) {
      console.log('[VisitorTracker] Waiting for mask from BubbleSessionContext...');
      return;
    }
    
    // Set global flags immediately to prevent race conditions
    globalSessionInitializing = true;
    
    try {
      // Use mask from BubbleSessionContext (no duplicate identify call)
      const mask = maskFromContext;

      // Register mask with analytics layer for batch requests
      analyticsRef.current.setVisitorMask(mask);

      console.log('[VisitorTracker] Using mask from BubbleSessionContext:', mask);

      // Get geolocation from server-side API (more accurate)
      let geoData = null;
      
      try {
        // Use our server-side geolocation API
        const geoResponse = await fetch("/api/geolocation", {
          signal: AbortSignal.timeout(8000), // 8s timeout
        });
        
        if (geoResponse.ok) {
          const data = await geoResponse.json();
          // Validate we got real data
          if (data && data.country && data.country !== 'Unknown') {
            geoData = {
              ip: data.ip,
              city: data.city || 'Unknown',
              region: data.region || 'Unknown',
              country_name: data.country,
              country_code: data.countryCode || 'XX',
              latitude: data.latitude || 0,
              longitude: data.longitude || 0,
              timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              org: data.isp || 'Unknown ISP',
              isBot: data.isBot || false,
              botName: data.botName,
              source: data.source || 'server',
            };
            console.log('[VisitorTracker] Geolocation from server API:', data.country, data.source ? `(${data.source})` : '');
          }
        }
      } catch (err) {
        console.log("[VisitorTracker] Server geolocation failed, using fallback");
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
        console.log('[VisitorTracker] Using timezone-based location:', countryFromTz.country);
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
          isBot: geoData.isBot || false,
          botName: geoData.botName,
          source: geoData.source,
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
      console.log('[VisitorTracker] 🚀 Sending SINGLE session_start to create visitor profile...');
      
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
          console.log('[VisitorTracker] ✅ Session started successfully:', result.sessionId);
          globalSessionStartSent = true; // Mark as successfully sent globally
        } else {
          console.error('[VisitorTracker] ❌ Failed to start session:', response.status);
          // Reset flags to allow retry
          globalSessionStartSent = false;
        }
      } catch (error) {
        console.error('[VisitorTracker] ❌ Error sending session_start:', error);
        // Reset flags to allow retry
        globalSessionStartSent = false;
      } finally {
        globalSessionInitializing = false;
      }
      
      console.log("[VisitorTracker] Session initialized:", sessionIdRef.current);
    } catch (error) {
      console.error("[VisitorTracker] Initialization error:", error);
      globalSessionInitializing = false;
    }
  }, [maskFromContext]);

  /**
   * Initialize tracking session when mask becomes available
   * This runs ONCE per page load because this component is mounted ONCE
   */
  useEffect(() => {
    if (maskFromContext) {
      initializeTracking();
    }
  }, [maskFromContext, initializeTracking]);

  // This component renders nothing - it's purely for side effects
  return null;
}
