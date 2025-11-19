/**
 * Unban Visitor API
 * Removes ban from a visitor by UUID
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb, verifyAuth } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

const VISITORS_COLLECTION = "visitorProfiles";
const BAN_LOGS_COLLECTION = "banLogs";

export interface UnbanRequest {
  visitorId: string;
  unbanReason?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin auth
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyAuth(idToken);
    
    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body: UnbanRequest = await request.json();
    const { visitorId, unbanReason } = body;

    if (!visitorId) {
      return NextResponse.json(
        { error: "Visitor ID required" },
        { status: 400 }
      );
    }

    const now = Timestamp.now();
    const visitorRef = adminDb.collection(VISITORS_COLLECTION).doc(visitorId);
    const visitorDoc = await visitorRef.get();

    if (!visitorDoc.exists) {
      return NextResponse.json(
        { error: "Visitor not found" },
        { status: 404 }
      );
    }

    // Update visitor - remove ban
    await visitorRef.update({
      banned: false,
      banReason: FieldValue.delete(),
      banCategory: FieldValue.delete(),
      banTimestamp: FieldValue.delete(),
      bannedBy: FieldValue.delete(),
      unbannedAt: now,
      unbannedBy: decodedToken.email || decodedToken.uid,
      updatedAt: now,
    });

    // Create unban log entry
    await adminDb.collection(BAN_LOGS_COLLECTION).add({
      visitorId,
      action: "unban",
      reason: unbanReason || "Unbanned by admin",
      unbannedBy: decodedToken.email || decodedToken.uid,
      unbannedByUid: decodedToken.uid,
      timestamp: now,
      previousBanInfo: {
        reason: visitorDoc.data()?.banReason,
        category: visitorDoc.data()?.banCategory,
        bannedBy: visitorDoc.data()?.bannedBy,
        banTimestamp: visitorDoc.data()?.banTimestamp,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Visitor unbanned successfully",
      visitorId,
    });

  } catch (error) {
    console.error("[Unban API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to unban visitor" },
      { status: 500 }
    );
  }
}
