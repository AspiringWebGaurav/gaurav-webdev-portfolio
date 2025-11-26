/**
 * Ban Appeal Status API
 * Check if visitor has pending/accepted/rejected appeal
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

const APPEALS_COLLECTION = "banAppeals";

/**
 * GET - Check appeal status for current visitor
 */
export async function GET(request: NextRequest) {
  try {
    // Get mask from query parameter (client should pass their mask)
    const { searchParams } = new URL(request.url);
    const mask = searchParams.get('mask');

    if (!mask) {
      return NextResponse.json({
        success: false,
        error: 'Mask parameter is required',
      }, { status: 400 });
    }

    console.log("[Ban Appeal Status] Checking for visitor:", mask);

    // Translate mask to UUID for database queries
    const { translateMaskToUUID } = await import('@/lib/uuid-sync/services/maskTranslator');
    const uuid = await translateMaskToUUID(mask);

    // First, get the CURRENT ban timestamp from visitor profile
    const visitorRef = adminDb.collection("og_uuid").doc(uuid);
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
      .where("mask", "==", mask)
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
        .where("data.mask", "==", mask)
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
