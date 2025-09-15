// utils/visitorTracking.ts
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { silentLogger, prodLogger } from './secureLogger';

export interface DeviceFingerprint {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  colorDepth: number;
  deviceMemory?: number;
  hardwareConcurrency: number;
  cookieEnabled: boolean;
  doNotTrack: string | null;
}

export interface VisitorData {
  uuid: string;
  deviceFingerprint: DeviceFingerprint;
  ipAddress?: string;
  firstVisit: string;
  lastVisit: string;
  visitCount: number;
  status: "active" | "banned";
  banReason?: string;
  banTimestamp?: string;
  unbanTimestamp?: string;
  // Enhanced tracking fields
  isOnline?: boolean;
  lastSeen?: string;
  sessionStart?: string;
  sessionDuration?: number;
  location?: {
    city?: string;
    country?: string;
    countryCode?: string;
    flag?: string;
  };
  deviceInfo?: {
    type: "mobile" | "tablet" | "desktop";
    browser: string;
    os: string;
    icon?: string;
  };
  referralInfo?: {
    source: string;
    firstPage: string;
    referrer?: string | null;
  };
  adminNotes?: string;
}

/**
 * Generate a comprehensive device fingerprint
 */
export function generateDeviceFingerprint(): DeviceFingerprint {
  const nav = navigator as any;

  return {
    userAgent: nav.userAgent || "",
    language: nav.language || nav.userLanguage || "",
    platform: nav.platform || "",
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    colorDepth: screen.colorDepth || 0,
    deviceMemory: nav.deviceMemory || undefined,
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    cookieEnabled: nav.cookieEnabled || false,
    doNotTrack: nav.doNotTrack || null,
  };
}

/**
 * Create a hash from device fingerprint for duplicate detection
 */
export function createFingerprintHash(fingerprint: DeviceFingerprint): string {
  const fingerprintString = JSON.stringify(fingerprint);
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get or create visitor UUID with persistent storage
 * Now prioritizes URL-based UUIDs for incognito compatibility
 */
export function getOrCreateVisitorUUID(urlUUID?: string): string {
  try {
    // If URL UUID is provided and valid, use it and ensure it's stored
    if (urlUUID && isValidUUID(urlUUID)) {
      silentLogger.silent("Using URL-based UUID");
      // Store in storage for persistence
      try {
        localStorage.setItem("visitor_uuid", urlUUID);
        sessionStorage.setItem("visitor_uuid", urlUUID);
        storeInIndexedDB("visitor_uuid", urlUUID);
      } catch (error) {
        silentLogger.silent("Storage not available");
      }
      return urlUUID;
    }

    // Check if we have a URL UUID from current page
    const currentUrlUUID = getUUIDFromURL();
    if (currentUrlUUID && isValidUUID(currentUrlUUID)) {
      silentLogger.silent("Found UUID in current URL");
      // Store in storage for persistence
      try {
        localStorage.setItem("visitor_uuid", currentUrlUUID);
        sessionStorage.setItem("visitor_uuid", currentUrlUUID);
        storeInIndexedDB("visitor_uuid", currentUrlUUID);
      } catch (error) {
        silentLogger.silent("Storage not available");
      }
      return currentUrlUUID;
    }

    // Try localStorage first
    let uuid = localStorage.getItem("visitor_uuid");

    if (!uuid) {
      // Try sessionStorage as fallback
      uuid = sessionStorage.getItem("visitor_uuid");

      if (!uuid) {
        // Generate new UUID
        uuid = uuidv4();
        silentLogger.silent("Generated new UUID");
      }

      // Store in both storages
      localStorage.setItem("visitor_uuid", uuid);
      sessionStorage.setItem("visitor_uuid", uuid);
    }

    // Also store in IndexedDB for persistence
    storeInIndexedDB("visitor_uuid", uuid);

    return uuid;
  } catch (error) {
    silentLogger.silent("Storage not available, using session-only UUID");
    // Fallback to session-only UUID
    if (!window.sessionUUID) {
      window.sessionUUID = uuidv4();
    }
    return window.sessionUUID;
  }
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Extract UUID from current URL path
 */
export function getUUIDFromURL(): string | null {
  if (typeof window === "undefined") return null;

  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  const potentialUUID = pathSegments[0];

  if (potentialUUID && isValidUUID(potentialUUID)) {
    return potentialUUID;
  }

  return null;
}

/**
 * Get visitor UUID from URL or storage, prioritizing URL
 */
export function getCurrentVisitorUUID(): string {
  // First try to get from URL
  const urlUUID = getUUIDFromURL();
  if (urlUUID) {
    return urlUUID;
  }

  // Fallback to storage-based UUID
  return getOrCreateVisitorUUID();
}

/**
 * Store data in IndexedDB for maximum persistence
 */
export async function storeInIndexedDB(key: string, value: any): Promise<void> {
  try {
    const request = indexedDB.open("VisitorTrackingDB", 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("visitor_data")) {
        db.createObjectStore("visitor_data");
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(["visitor_data"], "readwrite");
      const store = transaction.objectStore("visitor_data");
      store.put(value, key);
    };
  } catch (error) {
    silentLogger.silent("IndexedDB not available");
  }
}

/**
 * Retrieve data from IndexedDB
 */
export async function getFromIndexedDB(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open("VisitorTrackingDB", 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(["visitor_data"], "readonly");
        const store = transaction.objectStore("visitor_data");
        const getRequest = store.get(key);

        getRequest.onsuccess = () => {
          resolve(getRequest.result);
        };

        getRequest.onerror = () => {
          reject(getRequest.error);
        };
      };

      request.onerror = () => {
        reject(request.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Parse user agent to extract device and browser info
 */
export function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();

  // Detect OS
  let os = "Unknown";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad"))
    os = "iOS";

  // Detect Browser
  let browser = "Unknown";
  if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("opera")) browser = "Opera";

  // Detect Device Type
  let device = "Desktop";
  if (ua.includes("mobile")) device = "Mobile";
  else if (ua.includes("tablet") || ua.includes("ipad")) device = "Tablet";

  return { os, browser, device };
}

/**
 * Get visitor's IP address (client-side approximation)
 */
export async function getVisitorIP(): Promise<string> {
  try {
    // Use a public IP service
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || "Unknown";
  } catch (error) {
    console.warn("Could not fetch IP address:", error);
    return "Unknown";
  }
}

/**
 * Check if visitor tracking is enabled (respects privacy settings)
 */
export function isTrackingEnabled(): boolean {
  silentLogger.silent("Checking if tracking is enabled");
  
  // Check Do Not Track header
  const doNotTrack = navigator.doNotTrack;
  silentLogger.silent("Do Not Track setting checked");
  if (doNotTrack === "1") {
    silentLogger.silent("Tracking disabled: Do Not Track is enabled");
    return false;
  }

  // Check if user has opted out
  const optOut = localStorage.getItem("visitor_tracking_opt_out");
  silentLogger.silent("Opt-out setting checked");
  if (optOut === "true") {
    silentLogger.silent("Tracking disabled: User has opted out");
    return false;
  }

  silentLogger.silent("Tracking is enabled");
  return true;
}

/**
 * Opt out of visitor tracking
 */
export function optOutOfTracking(): void {
  localStorage.setItem("visitor_tracking_opt_out", "true");
  // Clear existing tracking data
  localStorage.removeItem("visitor_uuid");
  sessionStorage.removeItem("visitor_uuid");
}

/**
 * Opt back into visitor tracking
 */
export function optIntoTracking(): void {
  localStorage.removeItem("visitor_tracking_opt_out");
}

// Extend Window interface for TypeScript
/**
 * Initialize real-time presence tracking for a visitor
 */
export async function initializePresenceTracking(uuid: string): Promise<void> {
  if (typeof window === "undefined" || !uuid) return;

  try {
    const visitorRef = doc(db as any, "visitors", uuid);

    // Set user as online
    await updateDoc(visitorRef, {
      isOnline: true,
      lastSeen: serverTimestamp(),
      sessionStart: serverTimestamp(),
    });

    silentLogger.silent("Presence tracking initialized");

    // Update presence every 30 seconds while active
    const presenceInterval = setInterval(async () => {
      try {
        await updateDoc(visitorRef, {
          lastSeen: serverTimestamp(),
          isOnline: true,
        });
      } catch (error) {
        silentLogger.silent("Failed to update presence");
        clearInterval(presenceInterval);
      }
    }, 30000);

    // Store interval reference for cleanup
    (window as any).presenceInterval = presenceInterval;

    // Set up event listeners for page visibility and unload
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // User switched tabs or minimized window
        await updateDoc(visitorRef, {
          isOnline: false,
          lastSeen: serverTimestamp(),
          sessionDuration: calculateSessionDuration(),
        });
      } else {
        // User came back
        await updateDoc(visitorRef, {
          isOnline: true,
          lastSeen: serverTimestamp(),
        });
      }
    };

    const handleBeforeUnload = async () => {
      // User is leaving the page
      clearInterval(presenceInterval);
      try {
        await updateDoc(visitorRef, {
          isOnline: false,
          lastSeen: serverTimestamp(),
          sessionDuration: calculateSessionDuration(),
        });
      } catch (error) {
        console.warn("Failed to update offline status:", error);
      }
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    // Store cleanup function
    (window as any).cleanupPresence = () => {
      clearInterval(presenceInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
    };
  } catch (error) {
    console.error("❌ Failed to initialize presence tracking:", error);
  }
}

/**
 * Calculate session duration in seconds
 */
function calculateSessionDuration(): number {
  const sessionStart = sessionStorage.getItem("session_start");
  if (!sessionStart) return 0;

  const startTime = new Date(sessionStart).getTime();
  const currentTime = new Date().getTime();
  return Math.floor((currentTime - startTime) / 1000);
}

/**
 * Get visitor location from IP address
 */
export async function getVisitorLocation(): Promise<VisitorData["location"]> {
  try {
    // Using ipapi.co for location detection
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();

    return {
      city: data.city,
      country: data.country_name,
      countryCode: data.country_code,
      flag: `https://flagcdn.com/16x12/${data.country_code?.toLowerCase()}.png`,
    };
  } catch (error) {
    silentLogger.silent("Could not fetch location");
    return {
      city: "Unknown",
      country: "Unknown",
      countryCode: "XX",
      flag: undefined,
    };
  }
}

/**
 * Enhanced device info parsing with icons
 */
export function getEnhancedDeviceInfo(
  userAgent: string
): VisitorData["deviceInfo"] {
  const { os, browser, device } = parseUserAgent(userAgent);

  // Device type icons
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
        return "📱";
      case "tablet":
        return "📱";
      case "desktop":
        return "💻";
      default:
        return "🖥️";
    }
  };

  return {
    type: device.toLowerCase() as "mobile" | "tablet" | "desktop",
    browser,
    os,
    icon: getDeviceIcon(device),
  };
}

/**
 * Get referral information
 */
export function getReferralInfo(): VisitorData["referralInfo"] {
  if (typeof window === "undefined") {
    return {
      source: "Unknown",
      firstPage: "/",
      referrer: null, // Changed from undefined to null
    };
  }

  const referrer = document.referrer;
  const currentPath = window.location.pathname;

  let source = "Direct";
  if (referrer) {
    try {
      const referrerUrl = new URL(referrer);
      const hostname = referrerUrl.hostname;

      if (hostname.includes("google")) source = "Google";
      else if (hostname.includes("linkedin")) source = "LinkedIn";
      else if (hostname.includes("twitter")) source = "Twitter";
      else if (hostname.includes("facebook")) source = "Facebook";
      else if (hostname.includes("github")) source = "GitHub";
      else source = hostname;
    } catch (error) {
      source = "External";
    }
  }

  return {
    source,
    firstPage: currentPath,
    referrer: referrer || null, // Use null instead of undefined
  };
}

/**
 * Update visitor with enhanced tracking data
 */
export async function updateVisitorWithEnhancedData(
  uuid: string
): Promise<void> {
  if (typeof window === "undefined" || !uuid) return;

  try {
    // Store session start time
    if (!sessionStorage.getItem("session_start")) {
      sessionStorage.setItem("session_start", new Date().toISOString());
    }

    const [location, deviceInfo] = await Promise.all([
      getVisitorLocation(),
      Promise.resolve(getEnhancedDeviceInfo(navigator.userAgent)),
    ]);

    const referralInfo = getReferralInfo();

    const visitorRef = doc(db as any, "visitors", uuid);
    await updateDoc(visitorRef, {
      location,
      deviceInfo,
      referralInfo,
      lastUpdated: serverTimestamp(),
    });

    console.log("✅ Enhanced visitor data updated for:", uuid);
  } catch (error) {
    console.error("❌ Failed to update enhanced visitor data:", error);
  }
}

declare global {
  interface Window {
    sessionUUID?: string;
    presenceInterval?: NodeJS.Timeout;
  }
}
