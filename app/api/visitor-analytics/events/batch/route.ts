/**
 * Visitor Analytics Batch Event Ingestion API
 * Handles multiple events in a single request for efficiency
 * Uses UUID-sync system exclusively
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  Timestamp,
  increment,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  isValidEventType,
  detectDeviceClass,
  extractBrowserInfo,
  SESSION_TIMEOUT_MINUTES,
  MAX_SESSION_DURATION_HOURS,
} from "@/types/visitorAnalytics";
import { getIdentityResult, translateMaskToUUID } from "@/lib/uuid-sync/server";

const VISITORS_COLLECTION = "og_uuid";
const SESSIONS_COLLECTION = "visitorSessions";
const EVENTS_COLLECTION = "og_uuid_events";

interface BatchEvent {
  eventType: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

interface BatchRequest {
  events: BatchEvent[];
  sessionId?: string;
}

/**
 * POST - Log multiple visitor events in a single request
 * This endpoint is optimized for batch processing and never fails
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body with validation
    let body: BatchRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid JSON in request body",
          processed: 0,
          failed: 0,
        },
        { status: 400 }
      );
    }

    // Validate events array
    if (!Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "events must be a non-empty array",
          processed: 0,
          failed: 0,
        },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    const MAX_BATCH_SIZE = 50;
    if (body.events.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE}`,
          processed: 0,
          failed: 0,
        },
        { status: 400 }
      );
    }

    // Get headers first (needed for both paths)
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const ipAddress = headersList.get("x-forwarded-for") || 
                     headersList.get("x-real-ip") || 
                     "unknown";
    
    // Get mask from client (preferred) or generate from headers (fallback)
    const clientMask = body.mask || body.sessionId;
    let uuid: string;
    let mask: string;
    
    if (clientMask && clientMask.startsWith('device_')) {
      // Use client-provided mask
      mask = clientMask;
      uuid = await translateMaskToUUID(mask);
      console.log(`[Batch API] Using client mask: ${mask}`);
    } else {
      // Fallback: Generate from headers (for server-side calls)
      const fingerprint = `${ipAddress}_${userAgent}`;
      const result = await getIdentityResult(fingerprint);
      uuid = result.uuid;
      mask = result.mask;
      console.log(`[Batch API] Generated mask from headers: ${mask}`);
    }
    const visitorId = uuid;
    
    // Use mask as session ID (provided in body or from mask)
    const sessionId = body.sessionId || mask;
    
    console.log(`[Batch API] Request - Visitor: ${mask}, Session: ${sessionId}`);
    
    // Extract device and browser info
    const deviceClass = detectDeviceClass(userAgent);
    const browserInfo = extractBrowserInfo(userAgent);
    
    // Get geo location
    const geoLocation = await getGeoLocation(ipAddress);
    
    // Server timestamp (source of truth)
    const serverTime = new Date();
    
    // Create device snapshot
    const deviceSnapshot = {
      deviceClass,
      os: browserInfo.os || "Unknown",
      browser: browserInfo.browser || "Unknown",
      browserVersion: browserInfo.browserVersion || "Unknown",
      userAgent: userAgent || "Unknown",
      networkQuality: "unknown" as const,
    };
    
    // Ensure visitor profile exists (non-blocking - always continues)
    await ensureVisitorProfile(
      visitorId,
      serverTime,
      deviceClass,
      browserInfo,
      geoLocation
    );
    
    // Ensure session exists (non-blocking - always continues)
    console.log(`[Batch API] Attempting to ensure session: ${sessionId} for visitor: ${visitorId}`);
    await ensureSession(
      sessionId,
      visitorId,
      serverTime,
      deviceSnapshot,
      geoLocation,
      cookieHeader
    );
    
    console.log(`[Batch API] Session and visitor checks complete, processing ${body.events.length} events`);
    
    // Process events with individual error handling
    const results = {
      processed: 0,
      failed: 0,
      errors: [] as Array<{ index: number; eventType: string; error: string }>,
    };
    
    // Use Firestore batch for efficiency
    const batch = writeBatch(db);
    const visitorRef = doc(db, VISITORS_COLLECTION, visitorId);
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    
    const updates = {
      visitor: {} as Record<string, any>,
      session: {} as Record<string, any>,
    };
    
    for (let i = 0; i < body.events.length; i++) {
      const event = body.events[i];
      
      try {
        // Validate event type
        if (!event.eventType || !isValidEventType(event.eventType)) {
          results.failed++;
          results.errors.push({
            index: i,
            eventType: event.eventType || 'unknown',
            error: 'Invalid event type',
          });
          continue;
        }
        
        // Create event document
        const eventData = {
          visitorId,
          sessionId,
          eventType: event.eventType,
          timestamp: Timestamp.fromDate(serverTime),
          metadata: {
            ...event.metadata,
            serverTimestamp: serverTime.toISOString(),
            ipHash: hashString(ipAddress),
            userAgent,
          },
        };
        
        const eventRef = doc(collection(db, EVENTS_COLLECTION));
        batch.set(eventRef, eventData);
        
        // Accumulate counter updates (ONLY 4 ESSENTIAL EVENT COUNTERS - NO GENERIC COUNTERS)
        if (event.eventType === "resume_view") {
          updates.visitor.resumeViews = increment(1);
        } else if (event.eventType === "resume_download") {
          updates.visitor.resumeDownloads = increment(1);
        } else if (event.eventType === "contact_open") {
          // contact_open doesn't have a dedicated counter
        } else if (event.eventType === "form_submit") {
          updates.visitor.formSubmissions = increment(1);
        }
        
        results.processed++;
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          index: i,
          eventType: event.eventType,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`[Batch API] Error processing event ${i}:`, error);
      }
    }
    
    // Apply accumulated updates
    if (Object.keys(updates.visitor).length > 0) {
      updates.visitor.lastVisit = Timestamp.fromDate(serverTime);
      updates.visitor.currentStatus = "active";
      updates.visitor.updatedAt = Timestamp.fromDate(serverTime);
      batch.update(visitorRef, updates.visitor);
    }
    
    if (Object.keys(updates.session).length > 0) {
      updates.session.isActive = true;
      batch.update(sessionRef, updates.session);
    }
    
    // Commit batch
    try {
      await batch.commit();
    } catch (error) {
      console.error('[Batch API] Batch commit failed:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to commit batch to database",
          details: error instanceof Error ? error.message : 'Unknown error',
          processed: 0,
          failed: body.events.length,
        },
        { status: 500 }
      );
    }
    
    const processingTime = Date.now() - startTime;
    
    // Always return success even if some events failed
    const response = NextResponse.json(
      {
        success: true,
        visitorId,
        sessionId,
        processed: results.processed,
        failed: results.failed,
        total: body.events.length,
        processingTimeMs: processingTime,
        errors: results.errors.length > 0 ? results.errors : undefined,
      },
      { status: 200 }
    );
    
    // No cookies - UUID-sync is stateless
    
    console.log(
      `[Batch API] Processed ${results.processed}/${body.events.length} events in ${processingTime}ms`
    );
    
    return response;
    
  } catch (error) {
    console.error("[Batch API] Unexpected error:", error);
    
    // NEVER fail - return partial success
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        processed: 0,
        failed: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * Ensure visitor profile exists
 */
async function ensureVisitorProfile(
  visitorId: string,
  serverTime: Date,
  deviceClass: string,
  browserInfo: any,
  geoLocation: any
): Promise<boolean> {
  try {
    console.log(`[Batch API] Checking visitor profile: ${visitorId}`);
    
    const visitorRef = doc(db, VISITORS_COLLECTION, visitorId);
    const visitorDoc = await getDoc(visitorRef);
    
    if (!visitorDoc.exists()) {
      console.log(`[Batch API] Creating new visitor profile: ${visitorId}`);
      
      try {
        const visitorData = {
          firstVisit: Timestamp.fromDate(serverTime),
          lastVisit: Timestamp.fromDate(serverTime),
          totalVisits: 1,
          totalSessions: 1,
          // ONLY new event counters (4 total)
          resumeViews: 0,
          resumeDownloads: 0,
          formSubmissions: 0,
          // Profile metadata
          currentStatus: "active",
          deviceClass: deviceClass || "unknown",
          deviceString: `${browserInfo?.os || "Unknown"} · ${browserInfo?.browser || "Unknown"}`,
          geoLocation: geoLocation || {},
          geoHistory: geoLocation ? [geoLocation] : [],
          banned: false,
          createdAt: Timestamp.fromDate(serverTime),
          updatedAt: Timestamp.fromDate(serverTime),
        };
        
        await setDoc(visitorRef, visitorData);
        console.log(`[Batch API] ✓ Visitor profile created: ${visitorId}`);
        return true;
      } catch (createError) {
        console.error(`[Batch API] ✗ Failed to create visitor ${visitorId}:`, createError);
        console.error(`[Batch API] Error details:`, {
          name: createError instanceof Error ? createError.name : 'Unknown',
          message: createError instanceof Error ? createError.message : String(createError),
        });
        // CRITICAL: Don't block analytics on visitor creation failure
        return true; // Allow event processing anyway
      }
    } else {
      console.log(`[Batch API] ✓ Visitor profile exists: ${visitorId}`);
    }
    
    return true;
  } catch (error) {
    console.error('[Batch API] Error in ensureVisitorProfile:', error);
    // NEVER block - analytics must work even if visitor management fails
    return true;
  }
}

/**
 * Ensure session exists and is valid
 */
async function ensureSession(
  sessionId: string,
  visitorId: string,
  serverTime: Date,
  deviceSnapshot: any,
  geoLocation: any,
  cookieHeader: string
): Promise<boolean> {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      // Create new session - ALWAYS SUCCEEDS
      console.log(`[Batch API] Creating new session: ${sessionId} for visitor: ${visitorId}`);
      
      try {
        const newSessionData = {
          visitorId,
          startTime: Timestamp.fromDate(serverTime),
          endTime: null,
          duration: null,
          deviceSnapshot: deviceSnapshot || {},
          geoLocation: geoLocation || {},
          referrerSource: "direct",
          isActive: true,
          createdAt: Timestamp.fromDate(serverTime),
        };
        
        console.log(`[Batch API] Session data prepared:`, JSON.stringify(newSessionData, null, 2));
        
        await setDoc(sessionRef, newSessionData);
        
        console.log(`[Batch API] ✓ Session created successfully: ${sessionId}`);
        return true;
      } catch (createError) {
        console.error(`[Batch API] ✗ Failed to create session ${sessionId}:`, createError);
        console.error(`[Batch API] Error details:`, {
          name: createError instanceof Error ? createError.name : 'Unknown',
          message: createError instanceof Error ? createError.message : String(createError),
          stack: createError instanceof Error ? createError.stack : undefined,
        });
        // CRITICAL: Don't fail on session creation - allow event processing
        return true; // Let events through even if session creation fails
      }
    }
    
    // Check session timeout
    const sessionData = sessionDoc.data();
    if (!sessionData || !sessionData.startTime) {
      console.warn(`[Batch API] Session ${sessionId} missing required data, accepting anyway`);
      return true; // Accept malformed sessions
    }
    
    const sessionStart = sessionData.startTime?.toDate() || serverTime;
    const timeSinceStart = (serverTime.getTime() - sessionStart.getTime()) / 1000 / 60; // minutes
    
    if (timeSinceStart > SESSION_TIMEOUT_MINUTES || timeSinceStart > MAX_SESSION_DURATION_HOURS * 60) {
      // Session expired
      console.log(`[Batch API] Session ${sessionId} expired (age: ${timeSinceStart.toFixed(1)} minutes), allowing anyway`);
      return true; // Don't block on expired sessions - let events through
    }
    
    console.log(`[Batch API] ✓ Session ${sessionId} is valid (age: ${timeSinceStart.toFixed(1)} minutes)`);
    return true;
  } catch (error) {
    console.error('[Batch API] Error in ensureSession:', error);
    // NEVER fail - always return true to allow event processing
    return true;
  }
}

/**
 * Get geo location from IP (with caching and fallback)
 */
async function getGeoLocation(ipAddress: string): Promise<any> {
  // Don't geolocate local/unknown IPs
  if (ipAddress === "unknown" || 
      ipAddress.startsWith("127.") || 
      ipAddress.startsWith("192.168.") || 
      ipAddress.startsWith("10.") ||
      ipAddress.startsWith("172.")) {
    return {
      country: "Local Network",
      countryCode: "XX",
      city: "Unknown",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    };
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
    
    const response = await fetch(
      `https://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,city,regionName,timezone`,
      { 
        signal: controller.signal,
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error("Geolocation API failed");
    
    const data = await response.json();
    
    if (data.status === "success") {
      return {
        country: data.country,
        countryCode: data.countryCode,
        city: data.city,
        region: data.regionName,
        timezone: data.timezone,
      };
    }
  } catch (error) {
    console.error("[Batch API] Geolocation error:", error);
  }
  
  // Fallback
  return {
    country: "Unknown",
    countryCode: "XX",
    city: "Unknown",
    timezone: "UTC",
  };
}

/**
 * Hash string for privacy
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
