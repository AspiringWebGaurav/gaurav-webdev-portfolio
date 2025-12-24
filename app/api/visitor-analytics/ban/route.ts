/**
 * Ban Visitor API - Enterprise Level (Enhanced)
 * Bans a visitor by MASK with reason and category
 * Features:
 * - Transaction-based atomic operations
 * - Comprehensive validation
 * - Duplicate ban detection
 * - Audit logging
 * - Real-time update triggers
 * - NEW: Mask → UUID translation
 * - NEW: Identity graph integration for ban persistence
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb, verifyAuth } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { translateMaskToUUID } from "@/lib/uuid-sync/server";

const VISITORS_COLLECTION = "og_uuid";
const BAN_LOGS_COLLECTION = "banLogs";
const BAN_HISTORY_COLLECTION = "banHistory";

// Valid ban categories
const VALID_CATEGORIES = ["normal", "medium", "danger", "severe"] as const;
type BanCategory = typeof VALID_CATEGORIES[number];

export interface BanRequest {
  mask?: string;            // Public mask (device_*****) - for client operations
  uuid?: string;            // Internal UUID - for admin operations
  reason: string;
  category: BanCategory;
  customReason?: string;
  notifyUser?: boolean;
  banType?: "temporary" | "permanent";  // NEW: Ban type
  banDuration?: number | null;          // NEW: Duration in minutes (for temporary)
  autoUnbanEnabled?: boolean;           // NEW: Auto-unban feature
}

export interface BanResponse {
  success: boolean;
  message?: string;
  mask: string;            // Public mask
  uuid?: string;           // Internal UUID (hidden)
  error?: string;
  banInfo?: {
    reason: string;
    category: string;
    timestamp: string;
    bannedBy: string;
  };
}

/**
 * Validate ban request data
 */
function validateBanRequest(body: any): { valid: boolean; error?: string } {
  // Require either mask or uuid
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

  if (!body.reason || typeof body.reason !== 'string' || body.reason.trim().length === 0) {
    return { valid: false, error: "Ban reason is required" };
  }

  if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
    return { valid: false, error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` };
  }

  if (body.customReason && typeof body.customReason !== 'string') {
    return { valid: false, error: "Custom reason must be a string" };
  }

  return { valid: true };
}

export async function POST(request: NextRequest): Promise<NextResponse<BanResponse>> {
  const startTime = Date.now();
  console.log("[Ban API] Request received");

  try {
    // Verify admin authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[Ban API] Missing authorization header");
      return NextResponse.json(
        { success: false, error: "Unauthorized - Missing token" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyAuth(idToken);
    
    if (!decodedToken) {
      console.error("[Ban API] Invalid token");
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    console.log(`[Ban API] Authenticated as: ${decodedToken.email || decodedToken.uid}`);

    // Parse and validate request body
    let body: BanRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validation = validateBanRequest(body);
    if (!validation.valid) {
      console.error(`[Ban API] Validation failed: ${validation.error}`);
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Extract mask or uuid
    const { mask, uuid: providedUuid, reason, category, customReason, notifyUser = false, banType = "permanent", banDuration, autoUnbanEnabled = false } = body;

    // Determine UUID (either provided directly by admin, or translate from mask)
    let uuid: string;
    let resolvedMask: string | undefined;
    
    if (providedUuid) {
      // Admin provided UUID directly
      uuid = providedUuid;
      console.log(`[Ban API] Using admin-provided UUID: ${uuid.substring(0, 13)}`);
      
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
        console.log(`[Ban API] Translated mask ${mask} to UUID ${uuid.substring(0, 13)}`);
      } catch (error: any) {
        console.error(`[Ban API] Failed to translate mask: ${error.message}`);
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

    console.log(`[Ban API] Banning visitor: ${resolvedMask || uuid.substring(0, 13)} (UUID: ${uuid.substring(0, 13)}, Category: ${category})`);

    // Use transaction for atomic operations
    const result = await adminDb.runTransaction(async (transaction) => {
      const visitorRef = adminDb.collection(VISITORS_COLLECTION).doc(uuid);
      const visitorDoc = await transaction.get(visitorRef);

      // Check if visitor exists
      if (!visitorDoc.exists) {
        throw new Error(`Visitor not found: ${resolvedMask || uuid.substring(0, 13)}`);
      }

      const visitorData = visitorDoc.data();

      // Check if already banned
      if (visitorData?.banned === true) {
        console.warn(`[Ban API] Visitor ${resolvedMask || uuid.substring(0, 13)} is already banned`);
        return {
          alreadyBanned: true,
          existingBan: {
            reason: visitorData.banReason,
            category: visitorData.banCategory,
            timestamp: visitorData.banTimestamp,
            bannedBy: visitorData.bannedBy,
          },
        };
      }

      const now = Timestamp.now();
      const banReason = customReason || reason;
      const bannedBy = decodedToken.email || decodedToken.uid;

      // Calculate ban expiration for temporary bans
      let banExpiresAt: Timestamp | null = null;
      if (banType === "temporary" && banDuration && banDuration > 0 && autoUnbanEnabled) {
        const expirationDate = new Date(now.toDate().getTime() + (banDuration * 60 * 1000));
        banExpiresAt = Timestamp.fromDate(expirationDate);
      }

      // Update visitor with ban info
      const updateData: any = {
        banned: true,
        banReason,
        banCategory: category,
        banTimestamp: now,
        bannedBy,
        bannedByUid: decodedToken.uid,
        banCount: FieldValue.increment(1),
        updatedAt: now,
        lastBanUpdate: now,
        banType,  // NEW: Store ban type
      };

      // Add temporary ban fields if applicable
      if (banType === "temporary" && banDuration) {
        updateData.banDuration = banDuration;  // Store in minutes
        updateData.autoUnbanEnabled = autoUnbanEnabled;
        if (banExpiresAt) {
          updateData.banExpiresAt = banExpiresAt;
        }
      }

      transaction.update(visitorRef, updateData);

      // Create ban log entry
      const logRef = adminDb.collection(BAN_LOGS_COLLECTION).doc();
      const banLogData: any = {
        visitorId: uuid,      // Store UUID internally
        mask: resolvedMask,   // Store mask for display (may be undefined for admin ops)
        action: "ban",
        reason: banReason,
        category,
        bannedBy,
        bannedByUid: decodedToken.uid,
        timestamp: now,
        banType,  // NEW: Log ban type
        banDuration: banType === "temporary" ? banDuration : null,  // NEW: Log duration
        autoUnbanEnabled: banType === "temporary" ? autoUnbanEnabled : false,  // NEW: Log auto-unban
        banExpiresAt: banExpiresAt,  // NEW: Log expiration
        requestMetadata: {
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      };

      // Only include visitorSnapshot if data exists
      const visitorSnapshot: any = {};
      if (visitorData.firstVisit) visitorSnapshot.firstVisit = visitorData.firstVisit;
      if (visitorData.lastVisit) visitorSnapshot.lastVisit = visitorData.lastVisit;
      if (visitorData.totalVisits !== undefined) visitorSnapshot.totalVisits = visitorData.totalVisits;
      if (visitorData.deviceString) visitorSnapshot.deviceString = visitorData.deviceString;
      if (visitorData.location) visitorSnapshot.location = visitorData.location;

      if (Object.keys(visitorSnapshot).length > 0) {
        banLogData.visitorSnapshot = visitorSnapshot;
      }

      transaction.set(logRef, banLogData);

      // Add to ban history
      const historyRef = adminDb.collection(BAN_HISTORY_COLLECTION).doc();
      transaction.set(historyRef, {
        visitorId: uuid,      // Store UUID internally
        mask: resolvedMask,   // Store mask for display (may be undefined for admin ops)
        action: "banned",
        reason: banReason,
        category,
        performedBy: bannedBy,
        performedByUid: decodedToken.uid,
        timestamp: now,
        previousState: {
          banned: false,
        },
        newState: {
          banned: true,
          banReason,
          banCategory: category,
        },
      });

      return {
        alreadyBanned: false,
        banInfo: {
          reason: banReason,
          category,
          timestamp: now.toDate().toISOString(),
          bannedBy,
        },
      };
    });

    const duration = Date.now() - startTime;

    // Handle already banned case
    if (result.alreadyBanned) {
      console.log(`[Ban API] Visitor ${resolvedMask || uuid.substring(0, 13)} already banned (${duration}ms)`);
      return NextResponse.json({
        success: false,
        error: "Visitor is already banned",
        mask: resolvedMask,
        banInfo: {
          reason: result.existingBan.reason,
          category: result.existingBan.category,
          timestamp: result.existingBan.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
          bannedBy: result.existingBan.bannedBy,
        },
      }, { status: 409 });
    }

    console.log(`[Ban API] ✅ Visitor ${resolvedMask || uuid.substring(0, 13)} banned successfully (${duration}ms)`);

    return NextResponse.json({
      success: true,
      message: "Visitor banned successfully",
      mask: resolvedMask,
      uuid: uuid.substring(0, 13) + '...',  // Partially hidden
      banInfo: result.banInfo,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Ban API] Error (${duration}ms):`, error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Failed to ban visitor"
      },
      { status: 500 }
    );
  }
}
