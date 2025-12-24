/**
 * Check Ban Status API
 * Checks if a visitor is banned by their device UUID
 * NEW: Uses UUID-sync system
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { identifyVisitor, getIdentityResult, firestoreCheckBanStatus, firestoreGetVisitorDocument, translateMaskToUUID } from "@/lib/uuid-sync/server";
import { deduplicate } from "@/lib/requestDeduplication";

const VISITORS_COLLECTION = "og_uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mask: clientMask } = body;

    let mask: string;
    let uuid: string;

    // If client provides mask, use it (preferred - avoids dual identity)
    if (clientMask) {
      mask = clientMask;
      uuid = await translateMaskToUUID(mask);
      console.log("[Check Ban API] Using client-provided mask:", mask);
    } else {
      // Fallback: Generate from headers (for server-side calls)
      const userAgent = request.headers.get("user-agent") || "";
      const ipAddress = request.headers.get("x-forwarded-for") || 
                       request.headers.get("x-real-ip") || 
                       "unknown";
      
      const fingerprint = `${ipAddress}_${userAgent}`;
      const result = await getIdentityResult(fingerprint);
      mask = result.mask;
      uuid = result.uuid;
      console.log("[Check Ban API] Generated mask from headers:", mask);
    }
    
    console.log("[Check Ban API] Checking ban for visitor:", mask);

    // Check ban status with deduplication (called on every page load)
    const banned = await deduplicate(
      `check-ban-${uuid}`,
      () => firestoreCheckBanStatus(uuid),
      5000 // 5s TTL - longer for ban checks
    );

    if (!banned) {
      console.log("[Check Ban API] ✅ Visitor not banned");
      return NextResponse.json({
        banned: false,
        mask,
      });
    }

    // Get full visitor document for ban details with deduplication
    const visitorData = await deduplicate(
      `visitor-doc-${uuid}`,
      () => firestoreGetVisitorDocument(uuid),
      5000 // 5s TTL
    );
    
    if (visitorData) {
      console.log("[Check Ban API] ⛔ Visitor IS BANNED!", {
        mask,
        banReason: visitorData.banReason || "No reason specified",
        banCategory: visitorData.banCategory || "normal",
        bannedBy: visitorData.bannedBy || "system",
      });
      
      return NextResponse.json({
        banned: true,
        mask,
        banInfo: {
          reason: visitorData.banReason || "Security Violation",
          category: visitorData.banCategory || "normal",
          timestamp: visitorData.banTimestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
          bannedBy: visitorData.bannedBy,
        },
      });
    }

    // Visitor exists but NOT banned
    console.log("[Check Ban API] ✅ Visitor exists but NOT banned:", mask);
    return NextResponse.json({
      banned: false,
      mask,
    });

  } catch (error) {
    console.error("[Ban Check API] Error:", error);
    // On error, allow access (fail open for better UX)
    return NextResponse.json({
      banned: false,
    });
  }
}

// GET method for quick check (supports mask query param)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientMask = searchParams.get('mask');

    let mask: string;
    let uuid: string;

    // If client provides mask, use it (preferred)
    if (clientMask) {
      mask = clientMask;
      uuid = await translateMaskToUUID(mask);
      console.log("[Check Ban API GET] Using client-provided mask:", mask);
    } else {
      // Fallback: Generate from headers
      const userAgent = request.headers.get("user-agent") || "";
      const ipAddress = request.headers.get("x-forwarded-for") || 
                       request.headers.get("x-real-ip") || 
                       "unknown";
      
      const fingerprint = `${ipAddress}_${userAgent}`;
      const result = await getIdentityResult(fingerprint);
      mask = result.mask;
      uuid = result.uuid;
      console.log("[Check Ban API GET] Generated mask from headers:", mask);
    }
    
    // Check ban status
    const banned = await firestoreCheckBanStatus(uuid);

    if (!banned) {
      return NextResponse.json({ banned: false, mask });
    }

    const visitorData = await firestoreGetVisitorDocument(uuid);
    return NextResponse.json({
      banned: true,
      mask,
      banInfo: {
        reason: visitorData?.banReason || "Security Violation",
        category: visitorData?.banCategory || "normal",
        timestamp: visitorData?.banTimestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        bannedBy: visitorData?.bannedBy,
      },
    });

  } catch (error) {
    console.error("[Ban Check API GET] Error:", error);
    return NextResponse.json({ banned: false });
  }
}
