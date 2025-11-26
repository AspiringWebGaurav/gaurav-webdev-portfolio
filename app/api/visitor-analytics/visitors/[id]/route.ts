/**
 * Visitor Analytics Detail API
 * Admin-only endpoint for retrieving detailed visitor data
 * NEW: Accepts mask, translates to UUID, returns mask in responses
 */

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { verifyAuth } from "@/lib/firebaseAdmin";
import {
  VisitorDetailData,
  firestoreToVisitorProfile,
  firestoreToVisitorSession,
  firestoreToVisitorEvent,
  InteractionTimelineItem,
  DeviceSnapshot,
} from "@/types/visitorAnalytics";
import { translateMaskToUUID, translateUUIDToMask } from "@/lib/uuid-sync/services/maskTranslator";
import { isValidMask } from "@/lib/uuid-sync/core/generator";

/**
 * Resolve visitor identifier to UUID
 * If it's a mask, translate it. If it's already a UUID, return as-is.
 */
async function resolveToUUID(identifier: string): Promise<string> {
  if (isValidMask(identifier)) {
    return await translateMaskToUUID(identifier);
  }
  return identifier; // Assume it's already a UUID
}

/**
 * Resolve UUID to mask for response
 */
async function resolveToMask(uuid: string): Promise<string> {
  return await translateUUIDToMask(uuid);
}

const VISITORS_COLLECTION = "og_uuid";
const SESSIONS_COLLECTION = "visitorSessions";
const EVENTS_COLLECTION = "visitorEvents";

/**
 * GET - Fetch detailed visitor data (admin-only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id: visitorIdentifier } = await params;
    
    // Validate params
    if (!visitorIdentifier) {
      return NextResponse.json(
        { success: false, error: "Visitor ID is required" },
        { status: 400 }
      );
    }

    // Translate to UUID if it's a mask
    let uuid: string;
    try {
      uuid = await resolveToUUID(visitorIdentifier);
      console.log('[Visitor Detail] Resolved identifier to UUID:', uuid.substring(0, 13));
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: `Invalid visitor identifier: ${error.message}` },
        { status: 400 }
      );
    }

    // Verify admin authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyAuth(idToken);
    
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // Fetch visitor profile
    const visitorRef = doc(db, VISITORS_COLLECTION, uuid);
    const visitorDoc = await getDoc(visitorRef);

    if (!visitorDoc.exists()) {
      return NextResponse.json(
        { success: false, error: "Visitor not found" },
        { status: 404 }
      );
    }

    const profile = firestoreToVisitorProfile(visitorDoc);

    // Fetch all sessions for this visitor (without orderBy to avoid index requirement)
    const sessionsQuery = query(
      collection(db, SESSIONS_COLLECTION),
      where("visitorId", "==", uuid)
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions = sessionsSnapshot.docs
      .map((doc) => firestoreToVisitorSession(doc))
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()); // Sort in memory

    // Fetch recent events (without orderBy to avoid index requirement)
    const eventsQuery = query(
      collection(db, EVENTS_COLLECTION),
      where("visitorId", "==", uuid),
      limit(100)
    );
    const eventsSnapshot = await getDocs(eventsQuery);
    const recentEvents = eventsSnapshot.docs
      .map((doc) => firestoreToVisitorEvent(doc))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Sort in memory
      .slice(0, 100); // Ensure we only take 100

    // Build interaction timeline
    const interactionTimeline: InteractionTimelineItem[] = recentEvents.map((event) => ({
      timestamp: event.timestamp,
      eventType: event.eventType,
      description: formatEventDescription(event),
      metadata: event.metadata,
    }));

    // Calculate page visit counts
    const pageVisitCounts: Record<string, number> = {};
    recentEvents.forEach((event) => {
      if (event.eventType === "page_view" && event.metadata?.page) {
        const page = event.metadata.page;
        pageVisitCounts[page] = (pageVisitCounts[page] || 0) + 1;
      }
    });

    // Collect device history (unique device snapshots)
    const deviceHistory: DeviceSnapshot[] = [];
    const seenDevices = new Set<string>();
    
    sessions.forEach((session) => {
      const deviceKey = `${session.deviceSnapshot.deviceClass}_${session.deviceSnapshot.browser}_${session.deviceSnapshot.os}`;
      if (!seenDevices.has(deviceKey)) {
        seenDevices.add(deviceKey);
        deviceHistory.push(session.deviceSnapshot);
      }
    });

    // Assemble detail data
    const detailData: VisitorDetailData = {
      profile,
      sessions,
      recentEvents,
      interactionTimeline,
      pageVisitCounts,
      deviceHistory,
    };

    // Log audit action
    console.log("[AUDIT] Admin viewed visitor detail:", {
      adminId: decodedToken.uid,
      adminEmail: decodedToken.email,
      visitorId: uuid,
      timestamp: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        data: detailData,
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error fetching visitor detail:", error);
    
    // Provide detailed error message for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Try to get visitorId from params, but handle if params not available
    let visitorIdForLog = "unknown";
    try {
      const resolvedParams = await params;
      visitorIdForLog = resolvedParams?.id || "unknown";
    } catch {
      // Params already resolved earlier or error occurred
    }
    
    console.error("Detailed error:", {
      message: errorMessage,
      stack: errorStack,
      visitorId: visitorIdForLog,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch visitor detail",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Helper: Format event description for timeline
 */
function formatEventDescription(event: any): string {
  // Only handle new optimized event types (4 total)
  switch (event.eventType) {
    case "resume_view":
      return "Viewed resume";
    case "resume_download":
      return "Downloaded resume";
    case "contact_open":
      return "Opened contact form";
    case "form_submit":
      return "Submitted contact form";
    // Legacy events (for historical data only - no longer tracked)
    case "page_view":
      return `Viewed ${event.metadata?.page || "a page"} [LEGACY]`;
    case "bubble_open":
      return "Opened chat bubble [LEGACY]";
    case "bubble_close":
      return "Closed chat bubble [LEGACY]";
    case "bubble_interaction":
      return `Interacted with bubble [LEGACY]`;
    case "session_start":
      return "Started session [LEGACY]";
    case "session_end":
      return "Ended session [LEGACY]";
    default:
      return `${event.eventType} [UNKNOWN]`;
  }
}

/**
 * DELETE - Delete a visitor and all associated data (admin-only)
 * Performs CASCADE DELETE across all collections:
 * - og_uuid (visitor profile)
 * - og_uuid_sessions (bubble sessions)
 * - og_uuid_fingerprints (fingerprint lookup)
 * - og_uuid_masks (mask lookup)
 * - og_uuid_ban_logs (ban records)
 * - og_uuid_ban_history (ban history)
 * - visitorSessions (analytics sessions)
 * - visitorEvents (analytics events)
 * - visitorHeartbeats (heartbeats)
 * - visitorInteractions (interactions)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id: visitorIdentifier } = await params;
    
    // Validate params
    if (!visitorIdentifier) {
      return NextResponse.json(
        { success: false, error: "Visitor ID is required" },
        { status: 400 }
      );
    }

    // Translate to UUID if it's a mask
    let uuid: string;
    let mask: string | null = null;
    try {
      uuid = await resolveToUUID(visitorIdentifier);
      mask = await resolveToMask(uuid);
      console.log('[Visitor Delete] Resolved identifier - UUID:', uuid.substring(0, 13), 'Mask:', mask);
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: `Invalid visitor identifier: ${error.message}` },
        { status: 400 }
      );
    }

    // Verify admin authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyAuth(idToken);
    
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // Import adminDb for deletion
    const { adminDb } = await import("@/lib/firebaseAdmin");

    console.log(`[DELETE] Starting CASCADE delete for visitor UUID: ${uuid}`);

    // Fetch visitor profile first to get fingerprint and mask
    const visitorDoc = await adminDb.collection(VISITORS_COLLECTION).doc(uuid).get();
    const visitorData = visitorDoc.exists ? visitorDoc.data() : null;
    const fingerprint = visitorData?.fingerprint;
    const visitorMask = mask || visitorData?.mask;

    // Step 1: Delete all bubble sessions (og_uuid_sessions)
    const bubbleSessionsQuery = adminDb.collection('og_uuid_sessions').where('visitorId', '==', uuid);
    const bubbleSessionsSnapshot = await bubbleSessionsQuery.get();
    console.log(`[DELETE] Found ${bubbleSessionsSnapshot.size} bubble sessions to delete`);
    
    let bubbleSessionBatch = adminDb.batch();
    let bubbleSessionCount = 0;
    for (const doc of bubbleSessionsSnapshot.docs) {
      bubbleSessionBatch.delete(doc.ref);
      bubbleSessionCount++;
      if (bubbleSessionCount % 500 === 0) {
        await bubbleSessionBatch.commit();
        bubbleSessionBatch = adminDb.batch();
      }
    }
    if (bubbleSessionCount % 500 !== 0) {
      await bubbleSessionBatch.commit();
    }

    // Step 2: Delete all analytics sessions (visitorSessions)
    const sessionsQuery = adminDb.collection('visitorSessions').where('visitorId', '==', uuid);
    const sessionsSnapshot = await sessionsQuery.get();
    const sessionIds = sessionsSnapshot.docs.map(doc => doc.id);
    console.log(`[DELETE] Found ${sessionIds.length} analytics sessions to delete`);
    
    // Delete sessions in batches (Firestore limit: 500 per batch)
    let sessionBatch = adminDb.batch();
    let sessionCount = 0;
    for (const doc of sessionsSnapshot.docs) {
      sessionBatch.delete(doc.ref);
      sessionCount++;
      if (sessionCount % 500 === 0) {
        await sessionBatch.commit();
        sessionBatch = adminDb.batch();
      }
    }
    if (sessionCount % 500 !== 0) {
      await sessionBatch.commit();
    }

    // Step 3: Delete all related events
    const eventsQuery = adminDb.collection('visitorEvents').where('visitorId', '==', uuid);
    const eventsSnapshot = await eventsQuery.get();
    console.log(`[DELETE] Found ${eventsSnapshot.size} events to delete`);
    
    let eventBatch = adminDb.batch();
    let eventCount = 0;
    for (const doc of eventsSnapshot.docs) {
      eventBatch.delete(doc.ref);
      eventCount++;
      if (eventCount % 500 === 0) {
        await eventBatch.commit();
        eventBatch = adminDb.batch();
      }
    }
    if (eventCount % 500 !== 0) {
      await eventBatch.commit();
    }

    // Step 4: Delete all related heartbeats
    const heartbeatsQuery = adminDb.collection('visitorHeartbeats').where('visitorId', '==', uuid);
    const heartbeatsSnapshot = await heartbeatsQuery.get();
    console.log(`[DELETE] Found ${heartbeatsSnapshot.size} heartbeats to delete`);
    
    let heartbeatBatch = adminDb.batch();
    let heartbeatCount = 0;
    for (const doc of heartbeatsSnapshot.docs) {
      heartbeatBatch.delete(doc.ref);
      heartbeatCount++;
      if (heartbeatCount % 500 === 0) {
        await heartbeatBatch.commit();
        heartbeatBatch = adminDb.batch();
      }
    }
    if (heartbeatCount % 500 !== 0) {
      await heartbeatBatch.commit();
    }

    // Step 5: Delete all related interactions
    const interactionsQuery = adminDb.collection('visitorInteractions').where('visitorId', '==', uuid);
    const interactionsSnapshot = await interactionsQuery.get();
    console.log(`[DELETE] Found ${interactionsSnapshot.size} interactions to delete`);
    
    let interactionBatch = adminDb.batch();
    let interactionCount = 0;
    for (const doc of interactionsSnapshot.docs) {
      interactionBatch.delete(doc.ref);
      interactionCount++;
      if (interactionCount % 500 === 0) {
        await interactionBatch.commit();
        interactionBatch = adminDb.batch();
      }
    }
    if (interactionCount % 500 !== 0) {
      await interactionBatch.commit();
    }

    // Step 6: Delete UUID-sync lookup entries
    // Delete fingerprint mapping (og_uuid_fingerprints)
    if (fingerprint) {
      try {
        // Hash fingerprint same way as in firestoreSync
        const hashFingerprint = (fp: string) => {
          let hash = 0;
          for (let i = 0; i < fp.length; i++) {
            const char = fp.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
          }
          return 'fp_' + Math.abs(hash).toString(36);
        };
        const fingerprintHash = hashFingerprint(fingerprint);
        await adminDb.collection('og_uuid_fingerprints').doc(fingerprintHash).delete();
        console.log(`[DELETE] Deleted fingerprint mapping: ${fingerprintHash}`);
      } catch (error) {
        console.error('[DELETE] Error deleting fingerprint mapping:', error);
      }
    }

    // Delete mask mapping (og_uuid_masks)
    if (visitorMask) {
      try {
        await adminDb.collection('og_uuid_masks').doc(visitorMask).delete();
        console.log(`[DELETE] Deleted mask mapping: ${visitorMask}`);
      } catch (error) {
        console.error('[DELETE] Error deleting mask mapping:', error);
      }
    }

    // Step 7: Delete ban logs and history
    const banLogsQuery = adminDb.collection('og_uuid_ban_logs').where('visitorId', '==', uuid);
    const banLogsSnapshot = await banLogsQuery.get();
    console.log(`[DELETE] Found ${banLogsSnapshot.size} ban logs to delete`);
    
    let banLogBatch = adminDb.batch();
    let banLogCount = 0;
    for (const doc of banLogsSnapshot.docs) {
      banLogBatch.delete(doc.ref);
      banLogCount++;
      if (banLogCount % 500 === 0) {
        await banLogBatch.commit();
        banLogBatch = adminDb.batch();
      }
    }
    if (banLogCount % 500 !== 0) {
      await banLogBatch.commit();
    }

    const banHistoryQuery = adminDb.collection('og_uuid_ban_history').where('visitorId', '==', uuid);
    const banHistorySnapshot = await banHistoryQuery.get();
    console.log(`[DELETE] Found ${banHistorySnapshot.size} ban history records to delete`);
    
    let banHistoryBatch = adminDb.batch();
    let banHistoryCount = 0;
    for (const doc of banHistorySnapshot.docs) {
      banHistoryBatch.delete(doc.ref);
      banHistoryCount++;
      if (banHistoryCount % 500 === 0) {
        await banHistoryBatch.commit();
        banHistoryBatch = adminDb.batch();
      }
    }
    if (banHistoryCount % 500 !== 0) {
      await banHistoryBatch.commit();
    }

    // Step 8: Finally delete the visitor profile (og_uuid)
    await adminDb.collection(VISITORS_COLLECTION).doc(uuid).delete();
    
    console.log(`[DELETE] ✅ CASCADE DELETE COMPLETE for visitor ${uuid}:`, {
      bubbleSessions: bubbleSessionsSnapshot.size,
      analyticsSessions: sessionIds.length,
      events: eventsSnapshot.size,
      heartbeats: heartbeatsSnapshot.size,
      interactions: interactionsSnapshot.size,
      banLogs: banLogsSnapshot.size,
      banHistory: banHistorySnapshot.size,
      fingerprintMapping: fingerprint ? 1 : 0,
      maskMapping: visitorMask ? 1 : 0,
    });

    // Log admin action
    console.log('[AUDIT] Admin deleted visitor:', {
      adminId: decodedToken.uid,
      adminEmail: decodedToken.email,
      visitorUUID: uuid,
      visitorMask: visitorMask,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Visitor and all related data deleted successfully (CASCADE)",
      deleted: {
        profile: 1,
        bubbleSessions: bubbleSessionsSnapshot.size,
        analyticsSessions: sessionIds.length,
        events: eventsSnapshot.size,
        heartbeats: heartbeatsSnapshot.size,
        interactions: interactionsSnapshot.size,
        banLogs: banLogsSnapshot.size,
        banHistory: banHistorySnapshot.size,
        fingerprintMapping: fingerprint ? 1 : 0,
        maskMapping: visitorMask ? 1 : 0,
      },
    });
  } catch (error) {
    console.error("Error deleting visitor:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete visitor",
      },
      { status: 500 }
    );
  }
}
