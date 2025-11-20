/**
 * Ban Visitor API
 * Bans a visitor by UUID with reason and category
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb, verifyAuth } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const VISITORS_COLLECTION = "visitorProfiles";
const BAN_LOGS_COLLECTION = "banLogs";

export interface BanRequest {
  visitorId: string;
  reason: string;
  category: "normal" | "medium" | "danger" | "severe";
  customReason?: string;
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

    const body: BanRequest = await request.json();
    const { visitorId, reason, category, customReason } = body;

    if (!visitorId || !reason || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Update visitor and create log entry in parallel for faster response
    await Promise.all([
      visitorRef.update({
        banned: true,
        banReason: customReason || reason,
        banCategory: category,
        banTimestamp: now,
        bannedBy: decodedToken.email || decodedToken.uid,
        updatedAt: now,
      }),
      adminDb.collection(BAN_LOGS_COLLECTION).add({
        visitorId,
        action: "ban",
        reason: customReason || reason,
        category,
        bannedBy: decodedToken.email || decodedToken.uid,
        bannedByUid: decodedToken.uid,
        timestamp: now,
        visitorData: {
          firstVisit: visitorDoc.data()?.firstVisit,
          lastVisit: visitorDoc.data()?.lastVisit,
          totalVisits: visitorDoc.data()?.totalVisits,
          deviceString: visitorDoc.data()?.deviceString,
        },
      })
    ]);

    return NextResponse.json({
      success: true,
      message: "Visitor banned successfully",
      visitorId,
    });

  } catch (error) {
    console.error("[Ban API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to ban visitor" },
      { status: 500 }
    );
  }
}
