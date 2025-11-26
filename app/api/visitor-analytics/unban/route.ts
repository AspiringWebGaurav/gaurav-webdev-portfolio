/**
 * Unban Visitor API - Enterprise Level
 * Removes ban from a visitor by MASK
 * Features:
 * - Transaction-based atomic operations
 * - Comprehensive validation
 * - Already unbanned detection
 * - Audit logging
 * - Real-time update triggers
 * - NEW: Mask → UUID translation
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb, verifyAuth } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { translateMaskToUUID } from "@/lib/uuid-sync/server";

const VISITORS_COLLECTION = "og_uuid";
const BAN_LOGS_COLLECTION = "banLogs";
const BAN_HISTORY_COLLECTION = "banHistory";

export interface UnbanRequest {
  mask?: string;        // Public mask (client)
  uuid?: string;        // Internal UUID (admin)
  unbanReason?: string;
}

export interface UnbanResponse {
  success: boolean;
  message?: string;
  mask: string;        // Public mask
  error?: string;
  unbanInfo?: {
    timestamp: string;
    unbannedBy: string;
    previousBan: {
      reason: string;
      category: string;
      bannedAt: string;
    };
  };
}

/**
 * Validate unban request data
 */
function validateUnbanRequest(body: any): { valid: boolean; error?: string } {
  const mask = body.mask;
  const uuid = body.uuid;
  
  if (!mask && !uuid) {
    return { valid: false, error: "Either mask or uuid is required" };
  }
  
  if (mask && typeof mask !== 'string') {
    return { valid: false, error: "Invalid mask format" };
  }
  
  if (uuid && typeof uuid !== 'string') {
    return { valid: false, error: "Invalid uuid format" };
  }

  if (body.unbanReason && typeof body.unbanReason !== 'string') {
    return { valid: false, error: "Unban reason must be a string" };
  }

  return { valid: true };
}

export async function POST(request: NextRequest): Promise<NextResponse<UnbanResponse>> {
  const startTime = Date.now();
  console.log("[Unban API] Request received");

  try {
    // Verify admin authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[Unban API] Missing authorization header");
      return NextResponse.json(
        { success: false, error: "Unauthorized - Missing token" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyAuth(idToken);
    
    if (!decodedToken) {
      console.error("[Unban API] Invalid token");
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    console.log(`[Unban API] Authenticated as: ${decodedToken.email || decodedToken.uid}`);

    // Parse and validate request body
    let body: UnbanRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validation = validateUnbanRequest(body);
    if (!validation.valid) {
      console.error(`[Unban API] Validation failed: ${validation.error}`);
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Extract mask or uuid
    const { mask, uuid: providedUuid, unbanReason } = body;

    // Determine UUID (either provided directly by admin, or translate from mask)
    let uuid: string;
    let resolvedMask: string | undefined;
    
    if (providedUuid) {
      // Admin provided UUID directly
      uuid = providedUuid;
      console.log(`[Unban API] Using admin-provided UUID: ${uuid.substring(0, 13)}`);
      
      // Try to get mask for logging
      try {
        const visitorDoc = await adminDb.collection(VISITORS_COLLECTION).doc(uuid).get();
        resolvedMask = visitorDoc.data()?.mask;
      } catch (e) {
        resolvedMask = undefined;
      }
    } else if (mask) {
      // Client provided mask, translate to UUID
      try {
        uuid = await translateMaskToUUID(mask);
        resolvedMask = mask;
        console.log(`[Unban API] Translated mask ${mask} to UUID ${uuid.substring(0, 13)}`);
      } catch (error: any) {
        console.error(`[Unban API] Failed to translate mask: ${error.message}`);
        return NextResponse.json(
          { success: false, error: `Invalid mask: ${error.message}` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Either mask or uuid is required" },
        { status: 400 }
      );
    }

    console.log(`[Unban API] Unbanning visitor: ${resolvedMask || uuid.substring(0, 13)}`);

    // Use transaction for atomic operations
    const result = await adminDb.runTransaction(async (transaction) => {
      const visitorRef = adminDb.collection(VISITORS_COLLECTION).doc(uuid);
      const visitorDoc = await transaction.get(visitorRef);

      // Check if visitor exists
      if (!visitorDoc.exists) {
        throw new Error(`Visitor not found: ${resolvedMask || uuid.substring(0, 13)}`);
      }

      const visitorData = visitorDoc.data();

      // Check if visitor is actually banned
      if (visitorData?.banned !== true) {
        console.warn(`[Unban API] Visitor ${mask} is not banned`);
        return {
          notBanned: true,
        };
      }

      const now = Timestamp.now();
      const unbannedBy = decodedToken.email || decodedToken.uid;
      const reason = unbanReason || "Unbanned by admin";

      // Store previous ban info for audit
      const previousBanInfo = {
        reason: visitorData.banReason || "Unknown",
        category: visitorData.banCategory || "Unknown",
        bannedBy: visitorData.bannedBy || "Unknown",
        banTimestamp: visitorData.banTimestamp,
        banCount: visitorData.banCount || 1,
      };

      // Update visitor - remove ban fields
      transaction.update(visitorRef, {
        banned: false,
        banReason: FieldValue.delete(),
        banCategory: FieldValue.delete(),
        banTimestamp: FieldValue.delete(),
        bannedBy: FieldValue.delete(),
        bannedByUid: FieldValue.delete(),
        unbannedAt: now,
        unbannedBy,
        unbannedByUid: decodedToken.uid,
        lastUnbanReason: reason,
        updatedAt: now,
        lastBanUpdate: now,
      });

      // Create unban log entry
      const logRef = adminDb.collection(BAN_LOGS_COLLECTION).doc();
      const unbanLogData: any = {
        visitorId: uuid,  // Store UUID internally
        mask: resolvedMask,       // Store mask for display (may be undefined for admin ops)
        action: "unban",
        reason,
        unbannedBy,
        unbannedByUid: decodedToken.uid,
        timestamp: now,
        requestMetadata: {
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      };

      // Only include previousBanInfo if data exists
      const prevBanInfo: any = {};
      if (previousBanInfo.reason) prevBanInfo.reason = previousBanInfo.reason;
      if (previousBanInfo.category) prevBanInfo.category = previousBanInfo.category;
      if (previousBanInfo.bannedBy) prevBanInfo.bannedBy = previousBanInfo.bannedBy;
      if (previousBanInfo.banTimestamp) prevBanInfo.banTimestamp = previousBanInfo.banTimestamp;

      if (Object.keys(prevBanInfo).length > 0) {
        unbanLogData.previousBanInfo = prevBanInfo;
      }

      transaction.set(logRef, unbanLogData);

      // Add to ban history
      const historyRef = adminDb.collection(BAN_HISTORY_COLLECTION).doc();
      const historyData: any = {
        visitorId: uuid,  // Store UUID internally
        mask: resolvedMask,       // Store mask for display (may be undefined for admin ops)
        action: "unbanned",
        reason,
        performedBy: unbannedBy,
        performedByUid: decodedToken.uid,
        timestamp: now,
        newState: {
          banned: false,
        },
      };

      // Only include previousState fields if they exist
      const prevState: any = { banned: true };
      if (previousBanInfo.reason) prevState.banReason = previousBanInfo.reason;
      if (previousBanInfo.category) prevState.banCategory = previousBanInfo.category;
      historyData.previousState = prevState;

      transaction.set(historyRef, historyData);

      return {
        notBanned: false,
        unbanInfo: {
          timestamp: now.toDate().toISOString(),
          unbannedBy,
          previousBan: {
            reason: previousBanInfo.reason,
            category: previousBanInfo.category,
            bannedAt: previousBanInfo.banTimestamp?.toDate?.()?.toISOString() || "Unknown",
          },
        },
      };
    });

    const duration = Date.now() - startTime;

    // Handle not banned case
    if (result.notBanned) {
      console.log(`[Unban API] Visitor ${resolvedMask || uuid.substring(0, 13)} is not banned (${duration}ms)`);
      return NextResponse.json({
        success: false,
        error: "Visitor is not banned",
        mask: resolvedMask,
      }, { status: 409 });
    }

    console.log(`[Unban API] ✅ Visitor ${resolvedMask || uuid.substring(0, 13)} unbanned successfully (${duration}ms)`);

    return NextResponse.json({
      success: true,
      message: "Visitor unbanned successfully",
      mask: resolvedMask,
      unbanInfo: result.unbanInfo,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Unban API] Error (${duration}ms):`, error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Failed to unban visitor"
      },
      { status: 500 }
    );
  }
}
