/**
 * Batch Delete Visitors API Route
 * DELETE /api/visitor-analytics/visitors/batch-delete
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await adminAuth.verifyIdToken(token);

    // Get visitor IDs from request body
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid visitor IDs array" },
        { status: 400 }
      );
    }

    // Batch delete visitors from Firestore with cascade
    console.log(`[BATCH DELETE] Starting cascade delete for ${ids.length} visitors`);
    
    let totalSessions = 0;
    let totalEvents = 0;
    let totalHeartbeats = 0;
    let totalInteractions = 0;

    // Process each visitor and collect all related data
    for (const visitorId of ids) {
      // Delete sessions
      const sessionsQuery = adminDb.collection('visitorSessions').where('visitorId', '==', visitorId);
      const sessionsSnapshot = await sessionsQuery.get();
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
      totalSessions += sessionsSnapshot.size;

      // Delete events
      const eventsQuery = adminDb.collection('visitorEvents').where('visitorId', '==', visitorId);
      const eventsSnapshot = await eventsQuery.get();
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
      totalEvents += eventsSnapshot.size;

      // Delete heartbeats
      const heartbeatsQuery = adminDb.collection('visitorHeartbeats').where('visitorId', '==', visitorId);
      const heartbeatsSnapshot = await heartbeatsQuery.get();
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
      totalHeartbeats += heartbeatsSnapshot.size;

      // Delete interactions
      const interactionsQuery = adminDb.collection('visitorInteractions').where('visitorId', '==', visitorId);
      const interactionsSnapshot = await interactionsQuery.get();
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
      totalInteractions += interactionsSnapshot.size;

      // Delete visitor profile
      await adminDb.collection("visitorProfiles").doc(visitorId).delete();
    }

    console.log(`[BATCH DELETE] Successfully deleted ${ids.length} visitors with all related data:`, {
      visitors: ids.length,
      sessions: totalSessions,
      events: totalEvents,
      heartbeats: totalHeartbeats,
      interactions: totalInteractions,
    });

    return NextResponse.json({
      success: true,
      deleted: ids.length,
      message: `Successfully deleted ${ids.length} visitor${ids.length > 1 ? 's' : ''} and all related data`,
      breakdown: {
        visitors: ids.length,
        sessions: totalSessions,
        events: totalEvents,
        heartbeats: totalHeartbeats,
        interactions: totalInteractions,
      },
    });
  } catch (error) {
    console.error("Error in batch delete visitors:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to batch delete visitors",
      },
      { status: 500 }
    );
  }
}
