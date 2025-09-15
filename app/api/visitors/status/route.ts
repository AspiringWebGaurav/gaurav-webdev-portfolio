import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseAdmin, isFirebaseAdminReady, getFirebaseAdminError } from "@/lib/firebase-admin";
import { logger } from "@/utils/secureLogger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uuid = searchParams.get('uuid');

    if (!uuid) {
      return NextResponse.json(
        { error: "UUID parameter is required" },
        { status: 400 }
      );
    }

    // Check if Firebase Admin is properly configured
    if (!isFirebaseAdminReady()) {
      const adminError = getFirebaseAdminError();
      logger.warn("Firebase Admin not configured, treating as new visitor", {
        uuid,
        error: adminError?.message
      });
      
      // Return default status for new visitors when Firebase Admin is not configured
      return NextResponse.json(
        {
          status: "active",
          uuid,
          banReason: null,
          banTimestamp: null,
          banCategory: null,
          policyReference: null,
          note: "Firebase Admin not configured - defaulting to active status"
        },
        { status: 200 }
      );
    }

    const db = requireFirebaseAdmin();
    const visitorDoc = await db.collection("visitors").doc(uuid).get();

    if (!visitorDoc.exists) {
      logger.info("Visitor document not found, treating as new visitor", { uuid });
      return NextResponse.json(
        {
          status: "active",
          uuid,
          banReason: null,
          banTimestamp: null,
          banCategory: null,
          policyReference: null,
          note: "New visitor - document not found"
        },
        { status: 200 }
      );
    }

    const visitorData = visitorDoc.data();
    const status = visitorData?.status || 'active';

    logger.info("Visitor status retrieved successfully", {
      uuid,
      status,
      hasBanReason: !!visitorData?.banReason
    });

    return NextResponse.json(
      {
        status,
        uuid,
        banReason: visitorData?.banReason,
        banTimestamp: visitorData?.banTimestamp,
        banCategory: visitorData?.banCategory || 'normal',
        policyReference: visitorData?.policyReference || null
      },
      { status: 200 }
    );

  } catch (error) {
    logger.error("Error checking visitor status", {
      error: error instanceof Error ? error.message : 'Unknown error',
      uuid: new URL(req.url).searchParams.get('uuid')
    });
    
    // Return active status as fallback to prevent blocking users
    return NextResponse.json(
      {
        status: "active",
        uuid: new URL(req.url).searchParams.get('uuid'),
        banReason: null,
        banTimestamp: null,
        banCategory: null,
        policyReference: null,
        error: "Service temporarily unavailable - defaulting to active status"
      },
      { status: 200 }
    );
  }
}

// Update visitor status (for admin use)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uuid, status, banReason, banCategory, policyReference, adminId } = body;

    if (!uuid || !status) {
      return NextResponse.json(
        { error: "UUID and status are required" },
        { status: 400 }
      );
    }

    if (!['active', 'banned'].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'active' or 'banned'" },
        { status: 400 }
      );
    }

    // Check if Firebase Admin is properly configured
    if (!isFirebaseAdminReady()) {
      const adminError = getFirebaseAdminError();
      logger.error("Cannot update visitor status - Firebase Admin not configured", {
        uuid,
        status,
        error: adminError?.message
      });
      
      return NextResponse.json(
        { error: "Firebase Admin not configured - cannot update visitor status" },
        { status: 503 }
      );
    }

    const db = requireFirebaseAdmin();
    const visitorRef = db.collection("visitors").doc(uuid);
    const visitorDoc = await visitorRef.get();

    if (!visitorDoc.exists) {
      return NextResponse.json(
        { error: "Visitor not found" },
        { status: 404 }
      );
    }

    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
      lastStatusChange: new Date().toISOString(),
      adminId: adminId || 'system'
    };

    if (status === 'banned') {
      updateData.banTimestamp = new Date().toISOString();
      updateData.banReason = banReason || 'Violation of terms';
      updateData.banCategory = banCategory || 'normal';
      updateData.policyReference = policyReference || null;
      updateData.unbanTimestamp = null;
      
      // Add category history
      updateData.banCategoryHistory = [{
        category: banCategory || 'normal',
        timestamp: new Date().toISOString(),
        adminId: adminId || 'system',
        reason: banReason || 'Violation of terms',
        previousCategory: null
      }];
    } else if (status === 'active') {
      updateData.unbanTimestamp = new Date().toISOString();
      updateData.banReason = null;
      updateData.banCategory = null;
      updateData.banTimestamp = null;
      updateData.policyReference = null;
      updateData.banCategoryHistory = null;
    }

    await visitorRef.update(updateData);

    logger.info("Visitor status updated successfully", {
      uuid,
      status,
      adminId: adminId || 'system'
    });

    return NextResponse.json(
      {
        message: `Visitor status updated to ${status}`,
        uuid,
        status,
        timestamp: updateData.lastStatusChange
      },
      { status: 200 }
    );

  } catch (error) {
    logger.error("Error updating visitor status", {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { error: "Failed to update visitor status" },
      { status: 500 }
    );
  }
}