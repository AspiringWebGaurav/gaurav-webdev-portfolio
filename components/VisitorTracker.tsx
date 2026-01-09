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

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useBubbleSession } from '@/contexts/BubbleSessionContext';
import { generateDeviceFingerprint } from '@/lib/deviceFingerprint';
import { getAnalyticsReliability } from '@/lib/analyticsReliability';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import ForceUpdateNotification from '@/components/ForceUpdateNotification';

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
  const pathname = usePathname();
  const sessionIdRef = useRef<string | null>(null);
  const { visitorId: maskFromContext } = useBubbleSession();
  const analyticsRef = useRef(getAnalyticsReliability());
  
  // Force update notification state
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [updateBatchNumber, setUpdateBatchNumber] = useState(1);
  const [updateTotalBatches, setUpdateTotalBatches] = useState(1);
  const [updateDelaySeconds, setUpdateDelaySeconds] = useState(2);
  const [updateMessage, setUpdateMessage] = useState("We're loading the latest improvements for you!");
  const [updateId, setUpdateId] = useState<string>(''); // Unique ID per update
  
  // In-memory deduplication - prevents same broadcast from triggering twice THIS SESSION
  const processedBroadcastIds = useRef(new Set<string>());
  const processedUpdateIds = useRef(new Set<string>()); // Track updateIds to prevent duplicate updates
  const cleanupExecuted = useRef(false);

  // Check if we're on a 404 page (but don't return early - we still need hooks to run!)
  const is404Page = !pathname || pathname === '/_not-found';
  
  if (is404Page) {
    console.log('[VisitorTracker] On 404 page - tracking disabled but notification still active');
  }

  /**
   * AGGRESSIVE OLD BROADCAST CLEANUP
   * Runs once on mount to delete stale broadcasts (>60s old)
   */
  useEffect(() => {
    if (cleanupExecuted.current) return;
    cleanupExecuted.current = true;

    const cleanupOldBroadcasts = async () => {
      try {
        const cutoffTime = Date.now() - 60000; // 60 seconds ago
        const collections = ['admin_broadcasts', 'force_reload_fallback', 'system_commands'];
        
        console.log('[VisitorTracker] 🧹 Starting aggressive cleanup of old broadcasts...');
        
        for (const collectionName of collections) {
          try {
            const querySnapshot = await getDocs(
              query(
                collection(db, collectionName),
                where('createdAt', '<', cutoffTime)
              )
            );
            
            if (!querySnapshot.empty) {
              console.log(`[VisitorTracker] 🗑️ Found ${querySnapshot.size} old broadcasts in ${collectionName}`);
              
              // Delete in batches to avoid overwhelming Firebase
              const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
              await Promise.allSettled(deletePromises);
              
              console.log(`[VisitorTracker] ✅ Cleaned ${collectionName}`);
            }
          } catch (collError) {
            console.warn(`[VisitorTracker] ⚠️ Cleanup failed for ${collectionName}:`, collError);
          }
        }
        
        console.log('[VisitorTracker] ✨ Cleanup complete');
      } catch (error) {
        console.warn('[VisitorTracker] ⚠️ Old broadcast cleanup failed (non-critical):', error);
      }
    };

    // Run cleanup after 2 seconds to avoid blocking initial render
    const cleanupTimer = setTimeout(cleanupOldBroadcasts, 2000);
    return () => clearTimeout(cleanupTimer);
  }, []);

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
  }, [maskFromContext, pathname]);

  /**
   * Initialize tracking session when mask becomes available
   * This runs ONCE per page load because this component is mounted ONCE
   */
  useEffect(() => {
    if (is404Page) return; // Skip tracking on 404 pages
    if (maskFromContext) {
      initializeTracking();
    }
  }, [maskFromContext, initializeTracking, is404Page]);

  /**
   * Listen for admin ping requests - ENHANCED FALLBACK LAYER
   * (Real-Time Ping-Pong System)
   * This listener responds ONLY when admin triggers a live check
   * NO continuous polling - completely idle until ping received
   * Serves as LAYER 2 fallback for force update discovery
   */
  useEffect(() => {
    if (is404Page) return; // Skip ping listener on 404 pages
    if (!maskFromContext) {
      console.log('[VisitorTracker] ⏸️ Waiting for visitor ID before activating admin_pings listener...');
      return;
    }

    console.log('[VisitorTracker] 📡 Admin pings (Layer 2 fallback) listener active');

    // Generate or retrieve tab ID (unique per browser tab)
    let tabId = sessionStorage.getItem('visitorTabId');
    if (!tabId) {
      tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('visitorTabId', tabId);
    }

    // Helper function to send response with retry
    const sendPingResponseWithRetry = async (pingId: string, pingData: any, maxRetries = 3) => {
      let attempt = 0;
      
      while (attempt < maxRetries) {
        try {
          const status = document.visibilityState === 'visible' ? 'active' : 'minimized';

          await addDoc(
            collection(db, `admin_pings/${pingId}/responses`),
            {
              visitorId: maskFromContext,
              status: status,
              tabId: tabId,
              userAgent: navigator.userAgent,
              timestamp: serverTimestamp(),
              url: window.location.href,
              visibilityState: document.visibilityState,
              pathname: window.location.pathname,
              pingPurpose: pingData?.purpose || 'unknown',
              attemptNumber: attempt + 1,
              respondedAt: Date.now(),
            }
          );

          console.log(`[VisitorTracker] ✅ admin_pings response sent to ${pingId} (attempt ${attempt + 1})`);
          return true;
          
        } catch (error) {
          attempt++;
          console.error(`[VisitorTracker] ❌ admin_pings response failed (attempt ${attempt}/${maxRetries}):`, error);
          
          if (attempt < maxRetries) {
            const delay = Math.min(500 * Math.pow(2, attempt - 1), 2000);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      console.error(`[VisitorTracker] ❌ Failed to respond to admin_pings after ${maxRetries} attempts`);
      return false;
    };

    // Listen for new ping documents (admin triggers)
    const unsubscribe = onSnapshot(
      collection(db, 'admin_pings'),
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const pingDoc = change.doc;
            const pingData = pingDoc.data();
            const pingId = pingDoc.id;

            console.log(`[VisitorTracker] 🔔 admin_pings received: ${pingId}`);
            console.log('[VisitorTracker] 📦 Ping purpose:', pingData?.purpose || pingData?.type || 'general');

            await sendPingResponseWithRetry(pingId, pingData, 3);
          }
        });
      },
      (error) => {
        console.error('[VisitorTracker] ❌ admin_pings listener error:', error);
      }
    );

    return () => {
      console.log('[VisitorTracker] 📡 Admin pings listener stopped');
      unsubscribe();
    };
  }, [maskFromContext, is404Page]);

  /**
   * Listen for PRE-UPDATE discovery pings - ENHANCED WITH RETRY & FALLBACK
   * Respond with "I'm alive" so admin knows we're connected
   * Supports both force_update_pings and admin_pings as fallback
   */
  useEffect(() => {
    if (!maskFromContext) {
      console.log('[VisitorTracker] ⏸️ Waiting for visitor ID before activating ping listener...');
      return;
    }

    console.log('[VisitorTracker] 🔔 Enhanced pre-update discovery listener active');
    console.log('[VisitorTracker] 📍 Visitor ID:', maskFromContext.substring(0, 12) + '...');

    // Generate stable tab ID
    let tabId = sessionStorage.getItem('visitorTabId');
    if (!tabId) {
      tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('visitorTabId', tabId);
      console.log('[VisitorTracker] 🆔 Generated tab ID:', tabId);
    }

    // Helper function to send pong with retry
    const sendPongWithRetry = async (pingId: string, collectionPath: string, maxRetries = 3) => {
      let attempt = 0;
      
      while (attempt < maxRetries) {
        try {
          const status = document.visibilityState === 'visible' ? 'active' : 'minimized';
          
          await addDoc(
            collection(db, `${collectionPath}/${pingId}/responses`),
            {
              visitorId: maskFromContext,
              status: status,
              tabId: tabId,
              userAgent: navigator.userAgent,
              timestamp: serverTimestamp(),
              url: window.location.href,
              visibilityState: document.visibilityState,
              pathname: window.location.pathname,
              attemptNumber: attempt + 1,
              respondedAt: Date.now(),
            }
          );

          console.log(`[VisitorTracker] ✅ PONG sent to ${pingId} (attempt ${attempt + 1}/${maxRetries})`);
          return true;
          
        } catch (error) {
          attempt++;
          console.error(`[VisitorTracker] ❌ PONG failed (attempt ${attempt}/${maxRetries}):`, error);
          
          if (attempt < maxRetries) {
            // Wait before retry (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
            console.log(`[VisitorTracker] 🔄 Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      console.error(`[VisitorTracker] ❌ Failed to send PONG after ${maxRetries} attempts`);
      return false;
    };

    // Listen to force_update_pings (primary)
    const unsubscribe = onSnapshot(
      collection(db, 'force_update_pings'),
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const ping = change.doc.data();
            const pingId = change.doc.id;
            
            if (ping.type === 'PRE_UPDATE_DISCOVERY') {
              console.log(`[VisitorTracker] 🔔 PRE-UPDATE PING received: ${pingId}`);
              console.log('[VisitorTracker] 📦 Ping data:', {
                type: ping.type,
                triggeredBy: ping.triggeredByEmail,
                createdAt: ping.createdAt,
              });
              
              await sendPongWithRetry(pingId, 'force_update_pings', 3);
            }
          }
        });
      },
      (error) => {
        console.error('[VisitorTracker] ❌ force_update_pings listener error:', error);
      }
    );

    return () => {
      console.log('[VisitorTracker] 🔔 Pre-update discovery listener stopped');
      unsubscribe();
    };
  }, [maskFromContext]);

  /**
   * Listen for admin force reload broadcasts - 3-LAYER FALLBACK SYSTEM WITH BATCH SUPPORT
   * LAYER 1: admin_broadcasts (Primary)
   * LAYER 2: force_reload_fallback (Secondary)
   * LAYER 3: system_commands (Tertiary - Emergency)
   * 
   * This forces OLD connections to reload and get latest code
   * Admin control - update all clients instantly with batch distribution
   * EXCLUDES admin pages from reload to prevent admin panel refresh
   * INCLUDES DEDUPLICATION to prevent infinite reload loops
   */
  useEffect(() => {
    // Don't start listeners until we have a visitor ID
    if (!maskFromContext) {
      console.log('[VisitorTracker] ⏸️ Waiting for visitor ID before starting broadcast listeners...');
      return;
    }
    
    console.log('[VisitorTracker] 🔄 Force reload listeners active (3-layer batch system with ZERO storage)');
    console.log('[VisitorTracker] 🆔 Visitor ID:', maskFromContext.substring(0, 12) + '...');
    console.log('[VisitorTracker] 💾 Pure in-memory tracking - fresh on every reload');

    const currentPath = window.location.pathname;
    const isAdminPage = currentPath.startsWith('/admin');

    // PURE IN-MEMORY TRACKING - No localStorage/sessionStorage BS!
    // Clears automatically on page reload = fresh start every time
    const inMemoryProcessed = new Set<string>();
    const broadcastTimestamps = new Map<string, number>();
    
    // Simple in-memory check - ZERO storage dependencies!
    const isProcessed = (broadcastId: string): boolean => {
      const alreadyProcessed = inMemoryProcessed.has(broadcastId);
      if (alreadyProcessed) {
        console.log(`[VisitorTracker] ⏭️ Dedup: Already processed ${broadcastId.substring(0, 12)}...`);
      }
      return alreadyProcessed;
    };

    // Mark broadcast as processed - pure in-memory!
    const markProcessed = (broadcastId: string) => {
      inMemoryProcessed.add(broadcastId);
      broadcastTimestamps.set(broadcastId, Date.now());
      console.log(`[VisitorTracker] ✅ Marked processed: ${broadcastId.substring(0, 12)}...`);
      
      // Auto-cleanup old entries (keep last 100)
      if (inMemoryProcessed.size > 100) {
        const entries = Array.from(broadcastTimestamps.entries())
          .sort((a, b) => a[1] - b[1]); // Sort by timestamp
        const toRemove = entries.slice(0, inMemoryProcessed.size - 100);
        toRemove.forEach(([id]) => {
          inMemoryProcessed.delete(id);
          broadcastTimestamps.delete(id);
        });
        console.log(`[VisitorTracker] 🧹 Auto-cleaned ${toRemove.length} old entries`);
      }
    };

    // Helper function to handle reload with batch support + BULLETPROOF safety checks
    const handleReload = (layerName: string, broadcast: any, docId: string) => {
      const failsafeLog = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
        const prefix = `[VisitorTracker][${layerName}]`;
        const timestamp = new Date().toISOString();
        if (level === 'error') console.error(`${prefix} ❌ [${timestamp}]`, message, data || '');
        else if (level === 'warn') console.warn(`${prefix} ⚠️ [${timestamp}]`, message, data || '');
        else console.log(`${prefix} ✅ [${timestamp}]`, message, data || '');
      };

      try {
        failsafeLog('info', '🚨 FORCE RELOAD received');
        failsafeLog('info', '📦 Broadcast data', { type: broadcast?.type, batchNumber: broadcast?.batchNumber, docId: docId?.substring(0, 12) });
        
        // SAFETY CHECK 1: Validate broadcast structure with graceful degradation
        if (!broadcast || typeof broadcast !== 'object') {
          failsafeLog('error', 'Invalid broadcast structure - null or not an object', { broadcast: typeof broadcast });
          return;
        }

        // SAFETY CHECK 2: Validate document ID with strict typing
        if (!docId || typeof docId !== 'string' || docId.length === 0) {
          failsafeLog('error', 'Invalid document ID - null, empty, or not a string', { docId: typeof docId, length: docId?.length });
          return;
        }
        
        // SAFETY CHECK 3: FRESHNESS CHECK FIRST - Primary filter (checks BEFORE deduplication)
        // This prevents old broadcasts from blocking new ones!
        const broadcastTime = broadcast.createdAt || broadcast.timestamp?.toMillis?.() || 0;
        if (broadcastTime > 0) {
          const now = Date.now();
          const age = now - broadcastTime;
          
          if (age > 15000) {
            failsafeLog('info', `⏭️ STALE: Broadcast is ${(age / 1000).toFixed(1)}s old - skipping for freshness`);
            failsafeLog('info', '💡 Only real-time updates (<15s) are processed - this ensures no random old broadcasts');
            return;
          }
          
          failsafeLog('info', `✅ FRESH: Broadcast age ${(age / 1000).toFixed(1)}s - within 15s window - PROCESSING!`);
        } else {
          failsafeLog('warn', '⚠️ No timestamp found - allowing anyway (legacy broadcast support)');
        }
        
        // SAFETY CHECK 4: UpdateId check - Prevents same update from showing multiple times
        if (broadcast.updateId && processedUpdateIds.current.has(broadcast.updateId)) {
          failsafeLog('info', `⏭️ UpdateId already processed: ${broadcast.updateId}`);
          failsafeLog('info', '💡 This update was already shown - skipping to prevent duplicate');
          return;
        }
        
        // SAFETY CHECK 5: Document ID Deduplication - ONLY for this session (in-memory only!)
        if (isProcessed(docId)) {
          failsafeLog('info', `⏭️ Deduplication: Already processed in THIS session ${docId.substring(0, 12)}...`);
          return;
        }

        // SAFETY CHECK 6: Mark as processed immediately (before any async operations)
        try {
          markProcessed(docId);
          if (broadcast.updateId) {
            processedUpdateIds.current.add(broadcast.updateId);
            failsafeLog('info', `📝 Marked updateId as processed: ${broadcast.updateId}`);
          }
          failsafeLog('info', `📝 Marked docId as processed: ${docId.substring(0, 12)}...`);
        } catch (markError) {
          failsafeLog('error', 'Failed to mark as processed - continuing anyway', markError);
          // Continue processing even if marking fails
        }
        
        // SAFETY CHECK 7: Admin page protection - never reload admin dashboard
        if (isAdminPage) {
          failsafeLog('info', '⏭️ Skipping: Admin page detected - protecting admin dashboard from reload');
          return;
        }

        // SAFETY CHECK 8: Validate visitor ID with comprehensive checks
        if (!maskFromContext || typeof maskFromContext !== 'string' || maskFromContext.length < 10) {
          failsafeLog('error', 'CRITICAL: Invalid or missing visitor ID', { 
            exists: !!maskFromContext, 
            type: typeof maskFromContext, 
            length: maskFromContext?.length 
          });
          failsafeLog('error', 'Broadcast listener should not have started without valid maskFromContext!');
          return;
        }

        // SAFETY CHECK 9: Determine broadcast type with type validation
        const isBatchBroadcast = !!(
          typeof broadcast.batchNumber === 'number' && 
          typeof broadcast.totalBatches === 'number' && 
          Array.isArray(broadcast.targetUserIds)
        );
        
        failsafeLog('info', '📊 Broadcast type analysis', {
          isBatchBroadcast,
          batchNumber: broadcast.batchNumber,
          totalBatches: broadcast.totalBatches,
          targetCount: broadcast.targetUserIds?.length,
          broadcastType: isBatchBroadcast ? 'BATCH' : 'GLOBAL',
        });

        if (isBatchBroadcast) {
          // SAFETY CHECK 10: Strict array validation
          if (!Array.isArray(broadcast.targetUserIds) || broadcast.targetUserIds.length === 0) {
            failsafeLog('error', 'Invalid targetUserIds - not an array or empty', { 
              type: typeof broadcast.targetUserIds, 
              isArray: Array.isArray(broadcast.targetUserIds),
              length: broadcast.targetUserIds?.length 
            });
            return;
          }

          // Validate array contents are strings
          const invalidTargets = broadcast.targetUserIds.filter((id: any) => typeof id !== 'string');
          if (invalidTargets.length > 0) {
            failsafeLog('error', `Found ${invalidTargets.length} non-string targets in array`, { sample: invalidTargets[0] });
            return;
          }

          // Log target analysis
          failsafeLog('info', `🎯 Batch targeting ${broadcast.targetUserIds.length} users`);
          failsafeLog('info', `🆔 My ID: ${maskFromContext.substring(0, 12)}...`);

          // SAFETY CHECK 11: Precise targeting check with fuzzy matching fallback
          let isTargeted = false;
          try {
            isTargeted = broadcast.targetUserIds.includes(maskFromContext);
            
            // Fallback: case-insensitive search if exact match fails
            if (!isTargeted) {
              isTargeted = broadcast.targetUserIds.some((id: string) => 
                id.toLowerCase() === maskFromContext.toLowerCase()
              );
              if (isTargeted) {
                failsafeLog('warn', 'Matched via case-insensitive fallback');
              }
            }
          } catch (targetCheckError) {
            failsafeLog('error', 'Error checking target list', targetCheckError);
            return;
          }
          
          failsafeLog('info', `🎯 Target check: ${isTargeted ? 'YES - I am targeted!' : 'NO - Not in this batch'}`);
          
          if (!isTargeted) {
            failsafeLog('info', '⏭️ Skipping: Not in this batch target list');
            return;
          }

          failsafeLog('info', `✅ Confirmed: User in batch ${broadcast.batchNumber}/${broadcast.totalBatches}`);

          // SAFETY CHECK 12: Validate and clamp delay to safe range
          const rawDelay = broadcast.delaySeconds;
          const delaySeconds = Math.max(0, Math.min(
            typeof rawDelay === 'number' ? rawDelay : 2, 
            60
          )); // Clamp 0-60s
          
          if (delaySeconds !== rawDelay) {
            failsafeLog('warn', `Delay clamped from ${rawDelay}s to ${delaySeconds}s for safety`);
          }
          
          failsafeLog('info', `⏱️ Reload will occur after ${delaySeconds}s delay`);

          try {
            // FAILSAFE: Wrap UI update in try-catch with fallback
            failsafeLog('info', '🎨 Setting notification state for batch update');
            
            // Validate state values before setting
            const safeBatchNumber = Math.max(1, Math.min(broadcast.batchNumber || 1, 9999));
            const safeTotalBatches = Math.max(1, Math.min(broadcast.totalBatches || 1, 9999));
            const safeMessage = typeof broadcast.message === 'string' && broadcast.message.length > 0
              ? broadcast.message
              : "We're loading the latest improvements for you!";
            
            failsafeLog('info', 'UI State', {
              batchNumber: safeBatchNumber,
              totalBatches: safeTotalBatches,
              delaySeconds,
              messageLength: safeMessage.length
            });

            setUpdateBatchNumber(safeBatchNumber);
            setUpdateTotalBatches(safeTotalBatches);
            setUpdateDelaySeconds(delaySeconds);
            setUpdateMessage(safeMessage);
            setUpdateId(broadcast.updateId || docId); // Use updateId if available, fallback to docId
            setShowUpdateNotification(true);
            
            failsafeLog('info', '✅ Notification state successfully set - UI will display in <100ms');
            failsafeLog('info', '💡 ForceUpdateNotification component will handle countdown and reload');
          } catch (uiError) {
            failsafeLog('error', 'CRITICAL: Failed to set notification state!', uiError);
            failsafeLog('error', 'FALLBACK: Attempting direct reload as emergency measure...');
            
            // EMERGENCY FALLBACK: Direct reload if UI fails
            setTimeout(() => {
              try {
                failsafeLog('warn', '🚨 Emergency reload executing...');
                window.location.reload();
              } catch (reloadError) {
                failsafeLog('error', 'TOTAL FAILURE: Even emergency reload failed', reloadError);
              }
            }, delaySeconds * 1000);
          }

        } else {
          // Legacy single broadcast (no batching) with graceful fallback
          failsafeLog('info', '🔄 Legacy broadcast detected (no batching) - using defaults');
          
          try {
            // FAILSAFE: Validate and set safe defaults
            const safeMessage = typeof broadcast.message === 'string' && broadcast.message.length > 0
              ? broadcast.message
              : "We're loading the latest improvements for you!";
            
            setUpdateBatchNumber(1);
            setUpdateTotalBatches(1);
            setUpdateDelaySeconds(2);
            setUpdateMessage(safeMessage);
            setUpdateId(broadcast.updateId || docId); // Use updateId if available
            setShowUpdateNotification(true);
            
            failsafeLog('info', '✅ Legacy notification state set successfully');
          } catch (legacyUiError) {
            failsafeLog('error', 'Legacy notification failed, direct reload fallback', legacyUiError);
            
            // EMERGENCY FALLBACK: Direct reload
            setTimeout(() => {
              try {
                window.location.reload();
              } catch (reloadError) {
                failsafeLog('error', 'All reload methods failed', reloadError);
              }
            }, 2000);
          }
        }
      } catch (handlerError) {
        failsafeLog('error', `CRITICAL FAILURE in handleReload`, handlerError);
        failsafeLog('error', 'Full error details', {
          name: handlerError instanceof Error ? handlerError.name : 'Unknown',
          message: handlerError instanceof Error ? handlerError.message : String(handlerError),
          stack: handlerError instanceof Error ? handlerError.stack : undefined
        });
        // Don't reload on critical errors to prevent bad states
      }
    };

    // LAYER 1: Primary broadcast listener (admin_broadcasts) with error recovery
    let layer1Healthy = true;
    const unsubscribeLayer1 = onSnapshot(
      collection(db, 'admin_broadcasts'),
      (snapshot) => {
        try {
          if (!layer1Healthy) {
            console.log('[VisitorTracker] ✅ Layer 1 recovered');
            layer1Healthy = true;
          }
          snapshot.docChanges().forEach((change) => {
            try {
              if (change.type === 'added') {
                const broadcast = change.doc.data();
                if (broadcast && broadcast.type === 'FORCE_RELOAD') {
                  handleReload('LAYER 1 (Primary)', broadcast, change.doc.id);
                }
              }
            } catch (docError) {
              console.error('[VisitorTracker] ⚠️ Layer 1 document processing error:', docError);
            }
          });
        } catch (snapshotError) {
          console.error('[VisitorTracker] ⚠️ Layer 1 snapshot processing error:', snapshotError);
          layer1Healthy = false;
        }
      },
      (error) => {
        console.error('[VisitorTracker] ❌ Layer 1 listener error:', error);
        layer1Healthy = false;
        console.log('[VisitorTracker] 🔄 Layer 1 down, Layer 2 and 3 will handle broadcasts');
      }
    );

    // LAYER 2: Fallback broadcast listener (force_reload_fallback) with error recovery
    let layer2Healthy = true;
    const unsubscribeLayer2 = onSnapshot(
      collection(db, 'force_reload_fallback'),
      (snapshot) => {
        try {
          if (!layer2Healthy) {
            console.log('[VisitorTracker] ✅ Layer 2 recovered');
            layer2Healthy = true;
          }
          snapshot.docChanges().forEach((change) => {
            try {
              if (change.type === 'added') {
                const broadcast = change.doc.data();
                if (broadcast && broadcast.type === 'FORCE_RELOAD') {
                  handleReload('LAYER 2 (Fallback)', broadcast, change.doc.id);
                }
              }
            } catch (docError) {
              console.error('[VisitorTracker] ⚠️ Layer 2 document processing error:', docError);
            }
          });
        } catch (snapshotError) {
          console.error('[VisitorTracker] ⚠️ Layer 2 snapshot processing error:', snapshotError);
          layer2Healthy = false;
        }
      },
      (error) => {
        console.error('[VisitorTracker] ❌ Layer 2 listener error:', error);
        layer2Healthy = false;
        console.log('[VisitorTracker] 🔄 Layer 2 down, Layer 3 is last resort');
      }
    );

    // LAYER 3: Last resort listener (system_commands) with error recovery
    let layer3Healthy = true;
    const unsubscribeLayer3 = onSnapshot(
      collection(db, 'system_commands'),
      (snapshot) => {
        try {
          if (!layer3Healthy) {
            console.log('[VisitorTracker] ✅ Layer 3 recovered');
            layer3Healthy = true;
          }
          snapshot.docChanges().forEach((change) => {
            try {
              if (change.type === 'added') {
                const command = change.doc.data();
                if (command && (command.type === 'FORCE_RELOAD' || command.command === 'EMERGENCY_RELOAD')) {
                  handleReload('LAYER 3 (Last Resort)', command, change.doc.id);
                }
              }
            } catch (docError) {
              console.error('[VisitorTracker] ⚠️ Layer 3 document processing error:', docError);
            }
          });
        } catch (snapshotError) {
          console.error('[VisitorTracker] ⚠️ Layer 3 snapshot processing error:', snapshotError);
          layer3Healthy = false;
        }
      },
      (error) => {
        console.error('[VisitorTracker] ❌ Layer 3 listener error:', error);
        layer3Healthy = false;
        console.log('[VisitorTracker] ❌ CRITICAL: All 3 layers may be down!');
      }
    );

    // Health monitoring interval (every 30 seconds)
    const healthCheckInterval = setInterval(() => {
      const healthStatus = {
        layer1: layer1Healthy ? '✅' : '❌',
        layer2: layer2Healthy ? '✅' : '❌',
        layer3: layer3Healthy ? '✅' : '❌',
      };
      const healthyCount = [layer1Healthy, layer2Healthy, layer3Healthy].filter(Boolean).length;
      console.log(`[VisitorTracker] 🏥 Health Check: L1${healthStatus.layer1} L2${healthStatus.layer2} L3${healthStatus.layer3} (${healthyCount}/3 layers healthy)`);
      
      if (healthyCount === 0) {
        console.error('[VisitorTracker] 🚨 CRITICAL: All broadcast layers are down!');
      }
    }, 30000);

    return () => {
      console.log('[VisitorTracker] 🔄 All force reload listeners stopped');
      clearInterval(healthCheckInterval);
      try { unsubscribeLayer1(); } catch (e) { console.warn('Layer 1 unsubscribe error:', e); }
      try { unsubscribeLayer2(); } catch (e) { console.warn('Layer 2 unsubscribe error:', e); }
      try { unsubscribeLayer3(); } catch (e) { console.warn('Layer 3 unsubscribe error:', e); }
    };
  }, [maskFromContext]);

  // This component renders the beautiful update notification
  return (
    <>
      <ForceUpdateNotification
        isVisible={showUpdateNotification}
        batchNumber={updateBatchNumber}
        totalBatches={updateTotalBatches}
        delaySeconds={updateDelaySeconds}
        message={updateMessage}
        updateId={updateId}
      />
    </>
  );
}
