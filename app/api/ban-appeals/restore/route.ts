/**
 * Ban Appeals Restore API Route - SIMPLIFIED
 * Handles restoring ban appeals from recycle bin
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { RestoreBanAppealDTO } from "@/types/banAppeal";

const COLLECTION_NAME = "banAppeals";

/**
 * POST - Restore a ban appeal from recycle bin
 */
export async function POST(request: NextRequest) {
  try {
    const body: RestoreBanAppealDTO = await request.json();

    // Validate required fields
    if (!body.visitorId || !body.appealReason || !body.banReason) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields for restoration",
        },
        { status: 400 }
      );
    }

    const appealsRef = adminDb.collection(COLLECTION_NAME);

    // Restore the appeal
    const now = new Date();
    const restoredAppeal: any = {
      visitorId: body.visitorId,
      appealReason: body.appealReason,
      banReason: body.banReason,
      banCategory: body.banCategory,
      status: body.status || "pending",
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    // Only add optional fields if they are defined
    if (body.reviewedBy) restoredAppeal.reviewedBy = body.reviewedBy;
    if (body.reviewedAt) restoredAppeal.reviewedAt = body.reviewedAt;
    if (body.reviewNotes) restoredAppeal.reviewNotes = body.reviewNotes;

    const docRef = await appealsRef.add(restoredAppeal);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...restoredAppeal,
      },
      message: "Ban appeal restored successfully",
    });
  } catch (error: any) {
    console.error("[Ban Appeals Restore API] Error restoring appeal:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to restore ban appeal",
      },
      { status: 500 }
    );
  }
}
