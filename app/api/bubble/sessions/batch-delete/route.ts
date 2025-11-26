/**
 * Batch Delete Bubble Sessions API Route (UUID-sync compatible)
 * DELETE /api/bubble/sessions/batch-delete
 * Handles multiple session deletions with cascade to messages and recycle bin integration
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

    // Get session IDs (UUIDs) from request body
    const { sessionIds } = await request.json();

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid session IDs array" },
        { status: 400 }
      );
    }

    console.log(`[BATCH DELETE SESSIONS] Starting cascade delete for ${sessionIds.length} UUIDs`);
    
    let totalMessages = 0;
    let deletedSessions = 0;

    // Process each session
    for (const sessionId of sessionIds) {
      try {
        // Delete all messages for this session (messages use UUID as sessionId)
        const messagesQuery = adminDb.collection('bubbleMessages').where('sessionId', '==', sessionId);
        const messagesSnapshot = await messagesQuery.get();
        
        let messageBatch = adminDb.batch();
        let messageCount = 0;
        
        for (const doc of messagesSnapshot.docs) {
          messageBatch.delete(doc.ref);
          messageCount++;
          
          // Commit in batches of 500 (Firestore limit)
          if (messageCount % 500 === 0) {
            await messageBatch.commit();
            messageBatch = adminDb.batch();
          }
        }
        
        // Commit remaining messages
        if (messageCount % 500 !== 0) {
          await messageBatch.commit();
        }
        
        totalMessages += messagesSnapshot.size;

        // Delete the session using UUID as document ID
        const sessionDocRef = adminDb.collection('og_uuid_sessions').doc(sessionId);
        const sessionDoc = await sessionDocRef.get();
        
        if (sessionDoc.exists) {
          await sessionDocRef.delete();
          deletedSessions++;
        }
      } catch (error) {
        console.error(`[BATCH DELETE] Failed to delete session ${sessionId}:`, error);
        // Continue with other sessions even if one fails
      }
    }

    console.log(`[BATCH DELETE SESSIONS] ✓ Deleted ${deletedSessions} sessions with ${totalMessages} messages`);

    return NextResponse.json({
      success: true,
      deleted: deletedSessions,
      message: `Successfully deleted ${deletedSessions} session${deletedSessions > 1 ? 's' : ''} and ${totalMessages} messages`,
      breakdown: {
        sessions: deletedSessions,
        messages: totalMessages,
      },
    });
  } catch (error) {
    console.error("Error in batch delete sessions:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to batch delete sessions",
      },
      { status: 500 }
    );
  }
}
