/**
 * Delete Bubble Session API Route
 * DELETE /api/bubble/sessions/delete
 * Handles single session deletion with cascade to messages and recycle bin integration
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

    // Get session ID from request body
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    console.log(`[DELETE SESSION] Starting cascade delete for session: ${sessionId}`);
    
    // Delete all messages for this session
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

    // Delete the session itself
    const sessionsQuery = adminDb.collection('bubbleSessions').where('id', '==', sessionId);
    const sessionsSnapshot = await sessionsQuery.get();
    
    if (sessionsSnapshot.empty) {
      console.log(`[DELETE SESSION] Session not found: ${sessionId}`);
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Delete the session document
    await sessionsSnapshot.docs[0].ref.delete();

    console.log(`[DELETE SESSION] Successfully deleted session ${sessionId} with ${messageCount} messages`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted session and ${messageCount} messages`,
      deleted: {
        session: sessionId,
        messages: messageCount,
      },
    });
  } catch (error) {
    console.error("Error in delete session:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete session",
      },
      { status: 500 }
    );
  }
}
