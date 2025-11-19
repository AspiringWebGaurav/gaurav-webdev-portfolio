/**
 * Ban Appeal Status API
 * Check if visitor has pending/accepted/rejected appeal
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { generateVisitorId } from "@/types/visitorAnalytics";

const APPEALS_COLLECTION = "banAppeals";

/**
 * GET - Check appeal status for current visitor
 */
export async function GET(request: NextRequest) {
  try {
    // Get visitor identification from headers (server-side)
    const ipAddress = 
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    
    const fingerprint = `${ipAddress}_${userAgent}`;
    const visitorId = generateVisitorId(fingerprint);

    console.log("[Ban Appeal Status] Checking for visitor:", visitorId);

    // First, get the CURRENT ban timestamp from visitor profile
    const visitorRef = adminDb.collection("visitorProfiles").doc(visitorId);
    const visitorDoc = await visitorRef.get();

    if (!visitorDoc.exists || !visitorDoc.data()?.banned) {
      // Visitor not banned, no need to check appeals
      return NextResponse.json({
        success: true,
        hasAppeal: false,
        appeal: null,
      });
    }

    const currentBanTimestamp = visitorDoc.data()?.banTimestamp;
    if (!currentBanTimestamp) {
      // No ban timestamp, return no appeal
      return NextResponse.json({
        success: true,
        hasAppeal: false,
        appeal: null,
      });
    }

    // Find appeal matching CURRENT ban timestamp (including in recycle bin)
    const appealsRef = adminDb.collection(APPEALS_COLLECTION);
    const snapshot = await appealsRef
      .where("visitorId", "==", visitorId)
      .where("banTimestamp", "==", currentBanTimestamp)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    // If no active appeal found, check recycle bin for recently reviewed appeal
    if (snapshot.empty) {
      // Check recycle bin for any reviewed appeal (accepted or rejected)
      const recycleBinRef = adminDb.collection("recycleBin");
      const recycleBinSnapshot = await recycleBinRef
        .where("type", "==", "banAppeal")
        .where("data.visitorId", "==", visitorId)
        .where("data.banTimestamp", "==", currentBanTimestamp)
        .orderBy("deletedAt", "desc")
        .limit(1)
        .get();

      if (!recycleBinSnapshot.empty) {
        // Appeal was accepted but visitor still shows as banned (transition period)
        // OR appeal was rejected (show from recycle bin)
        const recycledAppealDoc = recycleBinSnapshot.docs[0];
        const recycledData = recycledAppealDoc.data().data;

        const appeal = {
          id: recycledAppealDoc.data().originalId,
          status: recycledData.status, // Will be 'accepted' or 'rejected'
          appealReason: recycledData.appealReason,
          banReason: recycledData.banReason,
          reviewNotes: recycledData.reviewNotes,
          createdAt: recycledData.createdAt?.toDate ? recycledData.createdAt.toDate().toISOString() : recycledData.createdAt,
          reviewedAt: recycledData.reviewedAt?.toDate ? recycledData.reviewedAt.toDate().toISOString() : recycledData.reviewedAt,
        };

        return NextResponse.json({
          success: true,
          hasAppeal: true,
          appeal,
        });
      }

      // No appeal found anywhere
      return NextResponse.json({
        success: true,
        hasAppeal: false,
        appeal: null,
      });
    }

    const appealDoc = snapshot.docs[0];
    const appealData = appealDoc.data();

    const appeal = {
      id: appealDoc.id,
      status: appealData.status || "pending",
      appealReason: appealData.appealReason,
      banReason: appealData.banReason,
      reviewNotes: appealData.reviewNotes,
      createdAt: appealData.createdAt?.toDate ? appealData.createdAt.toDate().toISOString() : appealData.createdAt,
      reviewedAt: appealData.reviewedAt?.toDate ? appealData.reviewedAt.toDate().toISOString() : appealData.reviewedAt,
    };

    return NextResponse.json({
      success: true,
      hasAppeal: true,
      appeal,
    });
  } catch (error: any) {
    console.error("[Ban Appeal Status API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check appeal status",
      },
      { status: 500 }
    );
  }
}
