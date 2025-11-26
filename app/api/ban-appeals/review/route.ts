/**
 * Ban Appeals Review API Route - SIMPLIFIED
 * Handles accepting/rejecting ban appeals
 * No automatic recycle bin moves - appeals stay in collection after review
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb, verifyAuth } from "@/lib/firebaseAdmin";
import { ReviewBanAppealDTO, validateReviewNotes } from "@/types/banAppeal";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { translateMaskToUUID } from "@/lib/uuid-sync/server";

const APPEALS_COLLECTION = "banAppeals";
const VISITORS_COLLECTION = "og_uuid";

/**
 * POST - Review a ban appeal (accept or reject)
 */
export async function POST(request: NextRequest) {
  console.log("[Ban Appeals Review API] ====== REQUEST RECEIVED ======");
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    console.log("[Ban Appeals Review API] Auth header present:", !!authHeader);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      await verifyAuth(idToken);
    } catch (authError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid authentication token",
        },
        { status: 401 }
      );
    }

    const body: ReviewBanAppealDTO = await request.json();
    
    console.log("[Ban Appeals Review API] Review data:", {
      appealId: body.id,
      action: body.action,
      reviewedBy: body.reviewedBy,
    });

    // Validate input
    if (!body.id || !body.action || !body.reviewedBy) {
      return NextResponse.json(
        {
          success: false,
          error: "Appeal ID, action, and reviewer are required",
        },
        { status: 400 }
      );
    }

    if (!["accept", "reject"].includes(body.action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be 'accept' or 'reject'",
        },
        { status: 400 }
      );
    }

    // Validate review notes if provided
    if (body.reviewNotes) {
      const validationErrors = validateReviewNotes(body.reviewNotes);
      if (validationErrors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            validationErrors,
          },
          { status: 400 }
        );
      }
    }

    const appealRef = adminDb.collection(APPEALS_COLLECTION).doc(body.id);
    const appealDoc = await appealRef.get();

    if (!appealDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Ban appeal not found",
        },
        { status: 404 }
      );
    }

    const appealData = appealDoc.data();

    // Check if already reviewed
    if (appealData?.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: `This appeal has already been ${appealData?.status}`,
        },
        { status: 400 }
      );
    }

    const now = Timestamp.now();
    const newStatus = body.action === "accept" ? "accepted" : "rejected";

    // Update appeal status (stays in collection, not moved to recycle bin)
    await appealRef.update({
      status: newStatus,
      reviewedBy: body.reviewedBy,
      reviewedAt: now,
      reviewNotes: body.reviewNotes || null,
      updatedAt: now,
    });

    // If accepted, unban the visitor
    if (body.action === "accept" && appealData?.mask) {
      try {
        console.log(`[Ban Appeals] Attempting to unban visitor with mask: ${appealData.mask}`);
        
        // Translate mask to UUID for database operations
        const uuid = await translateMaskToUUID(appealData.mask);
        const visitorRef = adminDb.collection(VISITORS_COLLECTION).doc(uuid);
        const visitorDoc = await visitorRef.get();
        
        if (visitorDoc.exists) {
          const visitorData = visitorDoc.data();
          console.log(`[Ban Appeals] Visitor document found, current banned status: ${visitorData?.banned}`);
          
          // Update visitor - remove ban
          await visitorRef.update({
            banned: false,
            banReason: FieldValue.delete(),
            banCategory: FieldValue.delete(),
            banTimestamp: FieldValue.delete(),
            bannedBy: FieldValue.delete(),
            unbannedAt: now,
            unbannedBy: "Appeal Accepted",
            updatedAt: now,
          });

          console.log(`[Ban Appeals] ✅ Visitor unbanned: ${appealData.mask}`);
        } else {
          console.warn(`[Ban Appeals] ⚠️ Visitor document not found for mask: ${appealData.mask}`);
        }
      } catch (unbanError) {
        console.error("[Ban Appeals] Error unbanning visitor:", unbanError);
        // Don't fail the appeal acceptance if unban fails
      }
    }

    // Fetch updated appeal data for return
    const updatedAppealDoc = await appealRef.get();
    const updatedData = updatedAppealDoc.data();

    const updatedAppeal = {
      id: updatedAppealDoc.id,
      mask: updatedData?.mask,
      appealReason: updatedData?.appealReason,
      banReason: updatedData?.banReason,
      banCategory: updatedData?.banCategory,
      status: updatedData?.status,
      reviewedBy: updatedData?.reviewedBy,
      reviewedAt: updatedData?.reviewedAt?.toDate ? updatedData.reviewedAt.toDate().toISOString() : updatedData?.reviewedAt,
      reviewNotes: updatedData?.reviewNotes,
      createdAt: updatedData?.createdAt?.toDate ? updatedData.createdAt.toDate().toISOString() : updatedData?.createdAt,
      updatedAt: updatedData?.updatedAt?.toDate ? updatedData.updatedAt.toDate().toISOString() : updatedData?.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: updatedAppeal,
      message: `Ban appeal ${newStatus} successfully`,
    });
  } catch (error: any) {
    console.error("[Ban Appeals Review API] Error reviewing appeal:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to review ban appeal",
      },
      { status: 500 }
    );
  }
}
