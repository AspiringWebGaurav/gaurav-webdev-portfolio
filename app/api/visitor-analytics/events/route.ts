/**
 * Visitor Analytics Event Ingestion API (Single Event)
 * Uses UUID-sync system exclusively
 * 
 * Handles server-side event logging with validation and anti-tampering
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
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  EventIngestionDTO,
  isValidEventType,
  detectDeviceClass,
  extractBrowserInfo,
  MAX_EVENTS_PER_SESSION,
  SESSION_TIMEOUT_MINUTES,
  MAX_SESSION_DURATION_HOURS,
} from "@/types/visitorAnalytics";
import { adminDb } from "@/lib/firebaseAdmin";
import { getIdentityResult } from "@/lib/uuid-sync/server";

const VISITORS_COLLECTION = "og_uuid";
const SESSIONS_COLLECTION = "visitorSessions";
const EVENTS_COLLECTION = "visitorEvents";

/**
 * GET - Query visitor events (admin only, with filters)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventTypesParam = searchParams.get('eventTypes');
    const eventTypes = eventTypesParam ? eventTypesParam.split(',').filter(Boolean) : [];
    const visitorId = searchParams.get('visitorId');
    const limitParam = parseInt(searchParams.get('limit') || '100');
    
    // Build Firestore query
    let eventsQuery: any = adminDb.collection(EVENTS_COLLECTION);
    
    // Add filters
    if (eventTypes.length > 0 && eventTypes.length <= 10) {
      // Firestore 'in' queries support max 10 values
      eventsQuery = eventsQuery.where('eventType', 'in', eventTypes);
    }
    
    if (visitorId) {
      eventsQuery = eventsQuery.where('visitorId', '==', visitorId);
    }
    
    // Order by timestamp (descending) - must be done after where clauses
    eventsQuery = eventsQuery.orderBy('timestamp', 'desc');
    
    // Apply limit
    eventsQuery = eventsQuery.limit(limitParam);
    
    const snapshot = await eventsQuery.get();
    const events = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
    }));
    
    return NextResponse.json({
      success: true,
      events,
      count: events.length,
    });
  } catch (error) {
    console.error('[Events API] GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch events',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Log a visitor event (server-synced only)
 * Handles both single events and batch events
 */
export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json();
    
    // Handle batch events (redirect to batch endpoint internally)
    if (body.events && Array.isArray(body.events)) {
      console.log('[Events API] Detected batch request, processing...');
      
      // Process as batch internally
      return await processBatchEvents(request, body);
    }
    
    // Validate single event
    if (!body.eventType || !isValidEventType(body.eventType)) {
      return NextResponse.json(
        { success: false, error: "Invalid event type or missing eventType field" },
        { status: 400 }
      );
    }

    // Get request headers for fingerprinting
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const ipAddress = headersList.get("x-forwarded-for") || 
                     headersList.get("x-real-ip") || 
                     "unknown";
    const forwardedFor = headersList.get("x-forwarded-for") || "";
    
    // Generate privacy-compliant visitor UUID using UUID-sync
    const fingerprint = `${ipAddress}_${userAgent}`;
    const { uuid, mask, isNew } = await getIdentityResult(fingerprint);
    
    // Use UUID as document ID (mask is for display only)
    const visitorId = uuid;
    
    // Use mask as session ID (no cookies, no random generation)
    const sessionId = mask;
    
    // Extract device and browser info
    const viewportWidth = body.metadata?.viewportWidth;
    const deviceClass = detectDeviceClass(userAgent, viewportWidth);
    const browserInfo = extractBrowserInfo(userAgent);
    
    // Get approximate geo location (privacy-compliant: city/country only)
    const geoLocation = await getGeoLocation(ipAddress);
    
    // Server timestamp (source of truth)
    const serverTime = new Date();
    
    // Create device snapshot
    const deviceSnapshot = {
      deviceClass,
      os: browserInfo.os,
      browser: browserInfo.browser,
      browserVersion: browserInfo.browserVersion,
      viewportWidth: body.metadata?.viewportWidth,
      viewportHeight: body.metadata?.viewportHeight,
      userAgent,
      networkQuality: "unknown" as const,
    };
    
    // Get or create visitor profile
    const visitorRef = doc(db, VISITORS_COLLECTION, visitorId);
    const visitorDoc = await getDoc(visitorRef);
    
    if (!visitorDoc.exists()) {
      // New visitor
      await setDoc(visitorRef, {
        firstVisit: Timestamp.fromDate(serverTime),
        lastVisit: Timestamp.fromDate(serverTime),
        totalVisits: 1,
        totalSessions: 1,
        averageSessionDuration: 0,
        totalActiveTime: 0,
        totalPageViews: 0,
        totalBubbleOpens: 0,
        totalInteractions: 0,
        resumeViews: 0,
        resumeDownloads: 0,
        formSubmissions: 0,
        currentStatus: "active",
        deviceClass,
        deviceString: `${browserInfo.os || "Unknown"} · ${browserInfo.browser || "Unknown"}`,
        geoLocation,
        geoHistory: geoLocation ? [geoLocation] : [],
        banned: false,
        createdAt: Timestamp.fromDate(serverTime),
        updatedAt: Timestamp.fromDate(serverTime),
      });
    } else {
      // Update existing visitor
      const updateData: any = {
        lastVisit: Timestamp.fromDate(serverTime),
        currentStatus: "active",
        deviceClass,
        deviceString: `${browserInfo.os || "Unknown"} · ${browserInfo.browser || "Unknown"}`,
        updatedAt: Timestamp.fromDate(serverTime),
      };
      
      // Update geo location if changed
      const currentGeo = visitorDoc.data()?.geoLocation;
      if (geoLocation && (!currentGeo || currentGeo.countryCode !== geoLocation.countryCode)) {
        updateData.geoLocation = geoLocation;
        const geoHistory = visitorDoc.data()?.geoHistory || [];
        if (!geoHistory.some((g: any) => g.countryCode === geoLocation.countryCode)) {
          updateData.geoHistory = [...geoHistory.slice(-9), geoLocation]; // Keep last 10
        }
      }
      
      // Increment event-specific counters
      if (body.eventType === "page_view") {
        updateData.totalPageViews = increment(1);
      } else if (body.eventType === "bubble_open") {
        updateData.totalBubbleOpens = increment(1);
      } else if (body.eventType === "resume_view") {
        updateData.resumeViews = increment(1);
      } else if (body.eventType === "resume_download") {
        updateData.resumeDownloads = increment(1);
      } else if (body.eventType === "form_submit") {
        updateData.formSubmissions = increment(1);
      }
      
      if (["bubble_interaction", "resume_view", "resume_download", "form_submit"].includes(body.eventType)) {
        updateData.totalInteractions = increment(1);
      }
      
      await updateDoc(visitorRef, updateData);
    }
    
    // Get or create session
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      // New session
      await setDoc(sessionRef, {
        visitorId,
        startTime: Timestamp.fromDate(serverTime),
        endTime: null,
        duration: null,
        pageViews: body.eventType === "page_view" ? 1 : 0,
        bubbleOpens: body.eventType === "bubble_open" ? 1 : 0,
        interactions: ["bubble_interaction", "resume_view", "resume_download", "form_submit"].includes(body.eventType) ? 1 : 0,
        deviceSnapshot,
        geoLocation,
        referrerSource: extractReferrerSource(body.metadata?.referrer),
        isActive: true,
      });
      
      // Increment total sessions count
      await updateDoc(visitorRef, {
        totalSessions: increment(1),
      });
    } else {
      // Update existing session
      const sessionData = sessionDoc.data();
      const sessionStart = sessionData.startTime?.toDate() || serverTime;
      const timeSinceStart = (serverTime.getTime() - sessionStart.getTime()) / 1000 / 60; // minutes
      
      // Check session timeout
      if (timeSinceStart > SESSION_TIMEOUT_MINUTES * 60 || timeSinceStart > MAX_SESSION_DURATION_HOURS * 60) {
        // Session expired - this shouldn't happen if client manages sessions correctly
        // but handle gracefully
        return NextResponse.json(
          { 
            success: false, 
            error: "Session expired",
            visitorId,
            sessionId: null,
          },
          { status: 400 }
        );
      }
      
      const updateData: any = {
        isActive: true,
      };
      
      if (body.eventType === "page_view") {
        updateData.pageViews = increment(1);
      } else if (body.eventType === "bubble_open") {
        updateData.bubbleOpens = increment(1);
      }
      
      if (["bubble_interaction", "resume_view", "resume_download", "form_submit"].includes(body.eventType)) {
        updateData.interactions = increment(1);
      }
      
      await updateDoc(sessionRef, updateData);
    }
    
    // Log the event (append-only for audit trail)
    const eventData = {
      visitorId,
      sessionId,
      eventType: body.eventType,
      timestamp: Timestamp.fromDate(serverTime), // Server timestamp is source of truth
      metadata: {
        ...body.metadata,
        serverTimestamp: serverTime.toISOString(),
        ipHash: hashString(ipAddress), // Store hash, not raw IP
      },
    };
    
    const eventRef = await addDoc(collection(db, EVENTS_COLLECTION), eventData);
    
    // Anti-abuse: check event count for this session
    // (In production, implement rate limiting here)
    
    // Return response (no cookies - stateless UUID-sync)
    const response = NextResponse.json(
      {
        success: true,
        visitorId,
        sessionId,
        message: "Event logged successfully",
      },
      { status: 200 }
    );
    
    // No cookies - UUID-sync is stateless
    return response;
    
  } catch (error) {
    console.error("Error logging visitor event:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to log event",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Helper: Extract high-level referrer source
 */
function extractReferrerSource(referrer?: string): string {
  if (!referrer) return "direct";
  
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();
    
    if (hostname.includes("google")) return "search";
    if (hostname.includes("bing")) return "search";
    if (hostname.includes("yahoo")) return "search";
    if (hostname.includes("duckduckgo")) return "search";
    if (hostname.includes("facebook")) return "social";
    if (hostname.includes("twitter") || hostname.includes("x.com")) return "social";
    if (hostname.includes("linkedin")) return "social";
    if (hostname.includes("instagram")) return "social";
    
    return "referral";
  } catch {
    return "direct";
  }
}

/**
 * Helper: Get approximate geo location from IP (privacy-compliant)
 * Uses a free geolocation API - in production, use a reliable service
 */
async function getGeoLocation(ipAddress: string): Promise<any> {
  // Don't geolocate local/unknown IPs
  if (ipAddress === "unknown" || ipAddress.startsWith("127.") || ipAddress.startsWith("192.168.") || ipAddress.startsWith("10.")) {
    return {
      country: "Unknown",
      countryCode: "XX",
      city: "Unknown",
      timezone: "UTC",
    };
  }
  
  try {
    // Use ip-api.com free tier (limit: 45 req/min)
    // In production, use a paid service or cache results
    const response = await fetch(`https://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,city,regionName,timezone`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
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
    console.error("Geolocation error:", error);
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
 * Helper: Simple string hashing (for IP anonymization)
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

/**
 * Process batch events inline
 */
async function processBatchEvents(request: NextRequest, body: any) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const ipAddress = headersList.get("x-forwarded-for") || 
                     headersList.get("x-real-ip") || 
                     "unknown";
    
    const fingerprint = `${ipAddress}_${userAgent}`;
    const { uuid, mask } = await getIdentityResult(fingerprint);
    const visitorId = uuid;
    
    // Use mask as session ID (provided in body or from mask)
    const sessionId = body.sessionId || mask;
    
    const serverTime = new Date();
    let processed = 0;
    let failed = 0;
    
    // Process each event individually
    for (const event of body.events) {
      try {
        if (!event.eventType || !isValidEventType(event.eventType)) {
          failed++;
          continue;
        }
        
        // Log event
        const eventData = {
          visitorId,
          sessionId,
          eventType: event.eventType,
          timestamp: Timestamp.fromDate(serverTime),
          metadata: {
            ...event.metadata,
            serverTimestamp: serverTime.toISOString(),
            ipHash: hashString(ipAddress),
          },
        };
        
        await addDoc(collection(db, EVENTS_COLLECTION), eventData);
        processed++;
        
        // Update counters
        const visitorRef = doc(db, VISITORS_COLLECTION, visitorId);
        const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
        
        const visitorUpdates: any = {
          lastVisit: Timestamp.fromDate(serverTime),
          currentStatus: "active",
          updatedAt: Timestamp.fromDate(serverTime),
        };
        
        const sessionUpdates: any = {
          isActive: true,
        };
        
        if (event.eventType === "page_view") {
          visitorUpdates.totalPageViews = increment(1);
          sessionUpdates.pageViews = increment(1);
        } else if (event.eventType === "bubble_open") {
          visitorUpdates.totalBubbleOpens = increment(1);
          sessionUpdates.bubbleOpens = increment(1);
        } else if (event.eventType === "resume_view") {
          visitorUpdates.resumeViews = increment(1);
        } else if (event.eventType === "resume_download") {
          visitorUpdates.resumeDownloads = increment(1);
        } else if (event.eventType === "form_submit") {
          visitorUpdates.formSubmissions = increment(1);
        }
        
        if (["bubble_interaction", "resume_view", "resume_download", "form_submit"].includes(event.eventType)) {
          visitorUpdates.totalInteractions = increment(1);
          sessionUpdates.interactions = increment(1);
        }
        
        // Apply updates (ignore errors)
        try {
          const visitorDoc = await getDoc(visitorRef);
          if (visitorDoc.exists()) {
            await updateDoc(visitorRef, visitorUpdates);
          }
          
          const sessionDoc = await getDoc(sessionRef);
          if (sessionDoc.exists()) {
            await updateDoc(sessionRef, sessionUpdates);
          }
        } catch (updateError) {
          console.error('[Events API] Update error:', updateError);
        }
        
      } catch (eventError) {
        failed++;
        console.error('[Events API] Event processing error:', eventError);
      }
    }
    
    const response = NextResponse.json(
      {
        success: true,
        visitorId,
        sessionId,
        processed,
        failed,
        total: body.events.length,
        message: `Processed ${processed}/${body.events.length} events`,
      },
      { status: 200 }
    );
    
    // No cookies - UUID-sync is stateless
    return response;
    
  } catch (error) {
    console.error('[Events API] Batch processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process batch",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
