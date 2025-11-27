/**
 * Visitor Analytics Batch Event Ingestion API
 * Handles multiple events in a single request for efficiency
 * Uses UUID-sync system exclusively
 * 
 * IMPORTANT: This API does NOT create visitors or sessions
 * Visitor/session creation ONLY happens via session_start in /api/visitor-analytics/track
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import {
  isValidEventType,
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
    
    console.log(`[Batch API] Processing ${body.events.length} events for visitor: ${visitorId}`);
    
    // Server timestamp (source of truth)
    const serverTime = new Date();
    
    // Verify visitor exists before processing events
    const visitorRef = adminDb.collection(VISITORS_COLLECTION).doc(visitorId);
    const visitorDoc = await visitorRef.get();
    
    if (!visitorDoc.exists) {
      // Visitor doesn't exist - they need to call session_start first
      console.warn(`[Batch API] Visitor ${visitorId} not found - must call session_start first`);
      return NextResponse.json(
        {
          success: false,
          error: "Visitor not found. Please initialize session with session_start first.",
          processed: 0,
          failed: body.events.length,
        },
        { status: 400 }
      );
    }
    
    // Process events with individual error handling
    const results = {
      processed: 0,
      failed: 0,
      errors: [] as Array<{ index: number; eventType: string; error: string }>,
    };
    
    // Use Firestore batch for efficiency
    const batch = adminDb.batch();
    const sessionRef = adminDb.collection(SESSIONS_COLLECTION).doc(sessionId);
    
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
        
        const eventRef = adminDb.collection(EVENTS_COLLECTION).doc();
        batch.set(eventRef, eventData);
        
        // Accumulate counter updates (ONLY 4 ESSENTIAL EVENT COUNTERS - NO GENERIC COUNTERS)
        if (event.eventType === "resume_view") {
          updates.visitor.resumeViews = FieldValue.increment(1);
        } else if (event.eventType === "resume_download") {
          updates.visitor.resumeDownloads = FieldValue.increment(1);
        } else if (event.eventType === "contact_open") {
          // contact_open doesn't have a dedicated counter
        } else if (event.eventType === "form_submit") {
          updates.visitor.formSubmissions = FieldValue.increment(1);
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
