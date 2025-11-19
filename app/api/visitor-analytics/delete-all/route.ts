/**
 * Delete All Visitor Analytics Data API (Admin Only)
 * DELETE endpoint to clear all visitor analytics collections
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, adminDb } from "@/lib/firebaseAdmin";

const VISITORS_COLLECTION = "visitorProfiles";
const SESSIONS_COLLECTION = "visitorSessions";
const EVENTS_COLLECTION = "visitorEvents";
const AUDIT_LOG_COLLECTION = "analyticsAuditLogs";

/**
 * DELETE - Delete all visitor analytics data (admin-only)
 */
export async function DELETE(request: NextRequest) {
  try {
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

    console.log("[DELETE ALL] Starting deletion of all visitor analytics data...");

    let totalDeleted = 0;

    // Delete all visitor profiles
    const visitorsSnapshot = await adminDb.collection(VISITORS_COLLECTION).get();
    const visitorBatch = adminDb.batch();
    visitorsSnapshot.docs.forEach(doc => {
      visitorBatch.delete(doc.ref);
    });
    await visitorBatch.commit();
    const visitorsDeleted = visitorsSnapshot.size;
    totalDeleted += visitorsDeleted;
    console.log(`[DELETE ALL] Deleted ${visitorsDeleted} visitor profiles`);

    // Delete all sessions
    const sessionsSnapshot = await adminDb.collection(SESSIONS_COLLECTION).get();
    const sessionBatch = adminDb.batch();
    sessionsSnapshot.docs.forEach(doc => {
      sessionBatch.delete(doc.ref);
    });
    await sessionBatch.commit();
    const sessionsDeleted = sessionsSnapshot.size;
    totalDeleted += sessionsDeleted;
    console.log(`[DELETE ALL] Deleted ${sessionsDeleted} sessions`);

    // Delete all events
    const eventsSnapshot = await adminDb.collection(EVENTS_COLLECTION).get();
    const eventBatch = adminDb.batch();
    eventsSnapshot.docs.forEach(doc => {
      eventBatch.delete(doc.ref);
    });
    await eventBatch.commit();
    const eventsDeleted = eventsSnapshot.size;
    totalDeleted += eventsDeleted;
    console.log(`[DELETE ALL] Deleted ${eventsDeleted} events`);

    // Delete all audit logs
    const auditSnapshot = await adminDb.collection(AUDIT_LOG_COLLECTION).get();
    const auditBatch = adminDb.batch();
    auditSnapshot.docs.forEach(doc => {
      auditBatch.delete(doc.ref);
    });
    await auditBatch.commit();
    const auditDeleted = auditSnapshot.size;
    totalDeleted += auditDeleted;
    console.log(`[DELETE ALL] Deleted ${auditDeleted} audit logs`);

    // Log the deletion action
    console.log("[AUDIT] Admin deleted all visitor analytics data:", {
      adminId: decodedToken.uid,
      adminEmail: decodedToken.email,
      totalDeleted,
      breakdown: {
        visitors: visitorsDeleted,
        sessions: sessionsDeleted,
        events: eventsDeleted,
        auditLogs: auditDeleted,
      },
      timestamp: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "All visitor analytics data deleted successfully",
        deleted: {
          visitors: visitorsDeleted,
          sessions: sessionsDeleted,
          events: eventsDeleted,
          auditLogs: auditDeleted,
          total: totalDeleted,
        },
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error deleting visitor analytics data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete visitor analytics data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
