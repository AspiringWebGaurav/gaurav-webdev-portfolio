/**
 * Visitor Analytics Detail API
 * Admin-only endpoint for retrieving detailed visitor data
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

const VISITORS_COLLECTION = "visitorProfiles";
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
    const { id: visitorId } = await params;
    
    // Validate params
    if (!visitorId) {
      return NextResponse.json(
        { success: false, error: "Visitor ID is required" },
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
    const visitorRef = doc(db, VISITORS_COLLECTION, visitorId);
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
      where("visitorId", "==", visitorId)
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions = sessionsSnapshot.docs
      .map((doc) => firestoreToVisitorSession(doc))
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()); // Sort in memory

    // Fetch recent events (without orderBy to avoid index requirement)
    const eventsQuery = query(
      collection(db, EVENTS_COLLECTION),
      where("visitorId", "==", visitorId),
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
      visitorId,
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
  switch (event.eventType) {
    case "page_view":
      return `Viewed ${event.metadata?.page || "a page"}`;
    case "bubble_open":
      return "Opened chat bubble";
    case "bubble_close":
      return "Closed chat bubble";
    case "bubble_interaction":
      return `Interacted with bubble: ${event.metadata?.interactionType || "unknown"}`;
    case "resume_view":
      return "Viewed resume";
    case "resume_download":
      return "Downloaded resume";
    case "form_submit":
      return "Submitted contact form";
    case "contact_open":
      return "Opened contact modal";
    case "session_start":
      return "Started new session";
    case "session_end":
      return "Ended session";
    default:
      return event.eventType;
  }
}

/**
 * DELETE - Delete a visitor and all associated data (admin-only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id: visitorId } = await params;
    
    // Validate params
    if (!visitorId) {
      return NextResponse.json(
        { success: false, error: "Visitor ID is required" },
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

    console.log(`[DELETE] Starting cascade delete for visitor: ${visitorId}`);

    // Step 1: Delete all related sessions
    const sessionsQuery = adminDb.collection('visitorSessions').where('visitorId', '==', visitorId);
    const sessionsSnapshot = await sessionsQuery.get();
    const sessionIds = sessionsSnapshot.docs.map(doc => doc.id);
    console.log(`[DELETE] Found ${sessionIds.length} sessions to delete`);
    
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

    // Step 2: Delete all related events
    const eventsQuery = adminDb.collection('visitorEvents').where('visitorId', '==', visitorId);
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

    // Step 3: Delete all related heartbeats
    const heartbeatsQuery = adminDb.collection('visitorHeartbeats').where('visitorId', '==', visitorId);
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

    // Step 4: Delete all related interactions
    const interactionsQuery = adminDb.collection('visitorInteractions').where('visitorId', '==', visitorId);
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

    // Step 5: Finally delete the visitor profile
    await adminDb.collection(VISITORS_COLLECTION).doc(visitorId).delete();
    
    console.log(`[DELETE] Successfully deleted visitor ${visitorId} with all related data:`, {
      sessions: sessionIds.length,
      events: eventsSnapshot.size,
      heartbeats: heartbeatsSnapshot.size,
      interactions: interactionsSnapshot.size,
    });

    return NextResponse.json({
      success: true,
      message: "Visitor and all related data deleted successfully",
      deleted: {
        sessions: sessionIds.length,
        events: eventsSnapshot.size,
        heartbeats: heartbeatsSnapshot.size,
        interactions: interactionsSnapshot.size,
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
