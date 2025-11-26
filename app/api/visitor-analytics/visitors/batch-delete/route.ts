/**
 * Batch Delete Visitors API Route
 * DELETE /api/visitor-analytics/visitors/batch-delete
 * NEW: Supports mask translation
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { translateMaskToUUID } from "@/lib/uuid-sync/services/maskTranslator";
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

    // Translate masks to UUIDs
    const uuids = await Promise.all(
      ids.map(async (id: string) => {
        try {
          return await resolveToUUID(id);
        } catch (error) {
          console.error(`Failed to resolve ID: ${id}`);
          return null;
        }
      })
    );
    const validUUIDs = uuids.filter(uuid => uuid !== null) as string[];

    console.log(`[BATCH DELETE] Resolved ${validUUIDs.length}/${ids.length} identifiers to UUIDs`);

    // Batch delete visitors from Firestore with CASCADE DELETE
    console.log(`[BATCH DELETE] Starting CASCADE delete for ${validUUIDs.length} visitors`);
    
    let totalBubbleSessions = 0;
    let totalSessions = 0;
    let totalEvents = 0;
    let totalHeartbeats = 0;
    let totalInteractions = 0;
    let totalBanLogs = 0;
    let totalBanHistory = 0;
    let totalFingerprintMappings = 0;
    let totalMaskMappings = 0;

    // Process each visitor and collect all related data
    for (const uuid of validUUIDs) {
      // Get visitor data for fingerprint and mask
      const visitorDoc = await adminDb.collection('og_uuid').doc(uuid).get();
      const visitorData = visitorDoc.exists ? visitorDoc.data() : null;
      const fingerprint = visitorData?.fingerprint;
      const mask = visitorData?.mask;

      // Delete bubble sessions (og_uuid_sessions)
      const bubbleSessionsQuery = adminDb.collection('og_uuid_sessions').where('visitorId', '==', uuid);
      const bubbleSessionsSnapshot = await bubbleSessionsQuery.get();
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
      totalBubbleSessions += bubbleSessionsSnapshot.size;

      // Delete analytics sessions
      const sessionsQuery = adminDb.collection('visitorSessions').where('visitorId', '==', uuid);
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
      const eventsQuery = adminDb.collection('visitorEvents').where('visitorId', '==', uuid);
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
      const heartbeatsQuery = adminDb.collection('visitorHeartbeats').where('visitorId', '==', uuid);
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
      const interactionsQuery = adminDb.collection('visitorInteractions').where('visitorId', '==', uuid);
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

      // Delete ban logs
      const banLogsQuery = adminDb.collection('og_uuid_ban_logs').where('visitorId', '==', uuid);
      const banLogsSnapshot = await banLogsQuery.get();
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
      totalBanLogs += banLogsSnapshot.size;

      // Delete ban history
      const banHistoryQuery = adminDb.collection('og_uuid_ban_history').where('visitorId', '==', uuid);
      const banHistorySnapshot = await banHistoryQuery.get();
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
      totalBanHistory += banHistorySnapshot.size;

      // Delete fingerprint mapping
      if (fingerprint) {
        try {
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
          totalFingerprintMappings++;
        } catch (error) {
          console.error('[BATCH DELETE] Error deleting fingerprint mapping:', error);
        }
      }

      // Delete mask mapping
      if (mask) {
        try {
          await adminDb.collection('og_uuid_masks').doc(mask).delete();
          totalMaskMappings++;
        } catch (error) {
          console.error('[BATCH DELETE] Error deleting mask mapping:', error);
        }
      }

      // Delete visitor profile
      await adminDb.collection("og_uuid").doc(uuid).delete();
    }

    console.log(`[BATCH DELETE] ✅ CASCADE DELETE COMPLETE for ${validUUIDs.length} visitors:`, {
      visitors: validUUIDs.length,
      bubbleSessions: totalBubbleSessions,
      analyticsSessions: totalSessions,
      events: totalEvents,
      heartbeats: totalHeartbeats,
      interactions: totalInteractions,
      banLogs: totalBanLogs,
      banHistory: totalBanHistory,
      fingerprintMappings: totalFingerprintMappings,
      maskMappings: totalMaskMappings,
    });

    return NextResponse.json({
      success: true,
      deleted: validUUIDs.length,
      message: `Successfully deleted ${validUUIDs.length} visitor${validUUIDs.length > 1 ? 's' : ''} and all related data (CASCADE)`,
      breakdown: {
        visitors: validUUIDs.length,
        bubbleSessions: totalBubbleSessions,
        analyticsSessions: totalSessions,
        events: totalEvents,
        heartbeats: totalHeartbeats,
        interactions: totalInteractions,
        banLogs: totalBanLogs,
        banHistory: totalBanHistory,
        fingerprintMappings: totalFingerprintMappings,
        maskMappings: totalMaskMappings,
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
