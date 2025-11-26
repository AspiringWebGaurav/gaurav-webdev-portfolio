/**
 * Ban Appeals API Routes - SIMPLIFIED
 * No complex history tracking, rate limiting, or automatic recycle bin moves
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb, verifyAuth } from "@/lib/firebaseAdmin";
import { 
  BanAppeal, 
  CreateBanAppealDTO, 
  validateBanAppeal,
  sanitizeAppealReason,
  MAX_BAN_APPEALS
} from "@/types/banAppeal";
import { identifyVisitor, getIdentityResult, translateMaskToUUID } from "@/lib/uuid-sync/server";

const COLLECTION_NAME = "banAppeals";

/**
 * GET - Fetch all ban appeals
 */
export async function GET(request: NextRequest) {
  try {
    const appealsRef = adminDb.collection(COLLECTION_NAME);
    const snapshot = await appealsRef.orderBy("createdAt", "desc").get();

    const appeals: BanAppeal[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        mask: data.mask,
        appealReason: data.appealReason,
        banReason: data.banReason,
        banCategory: data.banCategory,
        status: data.status || "pending",
        reviewedBy: data.reviewedBy,
        reviewedAt: data.reviewedAt?.toDate ? data.reviewedAt.toDate().toISOString() : data.reviewedAt,
        reviewNotes: data.reviewNotes,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: appeals,
    });
  } catch (error: any) {
    console.error("[Ban Appeals API] Error fetching appeals:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch ban appeals",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new ban appeal (visitor submits from banned page)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Use mask from request body (sent by banned page) OR fallback to header-based identification
    let mask: string;
    let uuid: string;
    
    if (body.mask) {
      // Visitor provided their mask (preferred - avoids dual identity)
      mask = body.mask;
      console.log("[Ban Appeals API] Using client-provided mask:", mask);
      
      // Translate mask to UUID
      uuid = await translateMaskToUUID(mask);
    } else {
      // Fallback: Generate from headers (legacy support)
      const userAgent = request.headers.get("user-agent") || "";
      const ipAddress = request.headers.get("x-forwarded-for") || 
                       request.headers.get("x-real-ip") || 
                       "unknown";
      
      const fingerprint = `${ipAddress}_${userAgent}`;
      mask = await identifyVisitor(fingerprint);
      const { uuid: translatedUuid } = await getIdentityResult(fingerprint);
      uuid = translatedUuid;
      
      console.log("[Ban Appeals API] Generated mask from headers:", mask);
    }

    console.log("[Ban Appeals API] Creating appeal for visitor:", mask, "UUID:", uuid);

    // Create DTO with visitor mask
    const appealData: CreateBanAppealDTO = {
      appealReason: body.appealReason,
      banReason: body.banReason,
      banCategory: body.banCategory,
    };

    // Validate input
    const validationErrors = validateBanAppeal(appealData);
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

    const appealsRef = adminDb.collection(COLLECTION_NAME);

    // Check total appeals count
    const countSnapshot = await appealsRef.count().get();
    if (countSnapshot.data().count >= MAX_BAN_APPEALS) {
      return NextResponse.json(
        {
          success: false,
          error: "Maximum ban appeals limit reached",
        },
        { status: 400 }
      );
    }

    // Check if visitor already has a pending appeal
    const existingAppealSnapshot = await appealsRef
      .where("mask", "==", mask)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!existingAppealSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a pending appeal. Please wait for admin review.",
        },
        { status: 400 }
      );
    }

    // Sanitize appeal reason
    const sanitizedReason = sanitizeAppealReason(appealData.appealReason);

    // Create new appeal with UUID + mask
    const now = new Date();
    const newAppeal: any = {
      uuid, // Admin operates on UUID
      mask, // Stored for visitor reference
      appealReason: sanitizedReason,
      banReason: appealData.banReason,
      banCategory: appealData.banCategory,
      status: "pending" as const,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await appealsRef.add(newAppeal);

    const createdAppeal: BanAppeal = {
      id: docRef.id,
      ...newAppeal,
    };

    return NextResponse.json({
      success: true,
      data: createdAppeal,
    });
  } catch (error: any) {
    console.error("[Ban Appeals API] Error creating appeal:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create ban appeal",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a ban appeal (admin only - moves to recycle bin)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const soft = searchParams.get("soft") === "true";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Appeal ID is required",
        },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection(COLLECTION_NAME).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Ban appeal not found",
        },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Ban appeal deleted successfully",
    });
  } catch (error: any) {
    console.error("[Ban Appeals API] Error deleting appeal:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete ban appeal",
      },
      { status: 500 }
    );
  }
}
