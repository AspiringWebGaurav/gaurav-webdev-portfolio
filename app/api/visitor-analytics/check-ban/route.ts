/**
 * Check Ban Status API
 * Checks if a visitor is banned by their device UUID
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { generateVisitorId } from "@/types/visitorAnalytics";

const VISITORS_COLLECTION = "visitorProfiles";

export async function POST(request: NextRequest) {
  try {
    // Get request headers for fingerprinting (same as events API)
    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown";
    
    // Generate visitor ID using SERVER-SIDE method (same as events API)
    const fingerprint = `${ipAddress}_${userAgent}`;
    const visitorId = generateVisitorId(fingerprint);

    console.log("[Check Ban API] Checking ban for visitor:", visitorId);

    // Check visitor ban status
    const visitorRef = adminDb.collection(VISITORS_COLLECTION).doc(visitorId);
    const visitorDoc = await visitorRef.get();

    if (!visitorDoc.exists) {
      // Visitor doesn't exist in database - not banned (new visitor)
      console.log("[Check Ban API] ✅ New visitor (not in database) - not banned");
      return NextResponse.json({
        banned: false,
      });
    }

    const visitorData = visitorDoc.data();
    
    if (visitorData?.banned === true) {
      // Visitor is BANNED - log full ban details
      console.log("[Check Ban API] ⛔ Visitor IS BANNED!", {
        id: visitorId,
        banReason: visitorData.banReason || "No reason specified",
        banCategory: visitorData.banCategory || "normal",
        bannedBy: visitorData.bannedBy || "system",
        banTimestamp: visitorData.banTimestamp?.toDate?.()?.toISOString() || "unknown",
      });
      
      return NextResponse.json({
        banned: true,
        banInfo: {
          reason: visitorData.banReason || "Security Violation",
          category: visitorData.banCategory || "normal",
          timestamp: visitorData.banTimestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
          bannedBy: visitorData.bannedBy,
        },
      });
    }

    // Visitor exists but NOT banned - only log visitor ID
    console.log("[Check Ban API] ✅ Visitor exists but NOT banned:", visitorId);
    return NextResponse.json({
      banned: false,
    });

  } catch (error) {
    console.error("[Ban Check API] Error:", error);
    // On error, allow access (fail open for better UX)
    return NextResponse.json({
      banned: false,
    });
  }
}

// GET method for quick check (uses same server-side fingerprinting)
export async function GET(request: NextRequest) {
  try {
    // Use same server-side fingerprinting as POST
    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown";
    
    const fingerprint = `${ipAddress}_${userAgent}`;
    const visitorId = generateVisitorId(fingerprint);

    const visitorRef = adminDb.collection(VISITORS_COLLECTION).doc(visitorId);
    const visitorDoc = await visitorRef.get();

    if (!visitorDoc.exists || !visitorDoc.data()?.banned) {
      return NextResponse.json({ banned: false });
    }

    const visitorData = visitorDoc.data();
    return NextResponse.json({
      banned: true,
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
