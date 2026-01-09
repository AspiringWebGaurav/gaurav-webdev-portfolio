/**
 * Crash Reports Beacon API
 * Emergency endpoint for last-resort crash reporting
 * Uses Beacon API which works even when page is closing
 */

import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase/firestore";
import { adminDb } from "@/lib/firebaseAdmin";

const COLLECTION = "crashReports";

/**
 * POST - Beacon endpoint for emergency crash reports
 * Minimal processing for speed
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let data: any;
    
    try {
      // Beacon sends blob, need to read as text first
      const text = await request.text();
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("[Beacon API] Failed to parse request:", parseError);
      return new Response(null, { status: 400 });
    }

    console.log("[Beacon API] Received emergency crash report");

    // Check if this is a minimal emergency report
    const isEmergency = data.emergency === true;

    if (isEmergency) {
      // Minimal emergency report
      const minimalReport = {
        errorMessage: data.errorMessage || "Unknown error",
        errorStack: "No stack trace (emergency beacon)",
        errorName: "EmergencyBeacon",
        errorHash: `emergency_${Date.now()}`,
        
        title: "Emergency Crash Report",
        severity: "high",
        category: "unknown",
        priority: "urgent",
        
        screenshot: null,
        
        url: data.url || "unknown",
        userAgent: "unknown",
        browserInfo: "unknown",
        sessionId: "emergency",
        visitorId: null,
        timestamp: Timestamp.fromDate(new Date(data.timestamp || Date.now())),
        
        reactVersion: null,
        nextVersion: null,
        environment: process.env.NODE_ENV === "production" ? "production" : "development",
        
        status: "new",
        adminNotes: [{
          id: `note_${Date.now()}`,
          content: "⚠️ This report was sent via emergency beacon (crash reporter failed)",
          createdBy: "system",
          createdAt: new Date().toISOString(),
        }],
        
        occurenceCount: 1,
        firstSeen: Timestamp.now(),
        lastSeen: Timestamp.now(),
        affectedUsers: [],
        
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await adminDb.collection(COLLECTION).add(minimalReport);
      console.log("[Beacon API] ✅ Emergency report saved");

    } else {
      // Full report via beacon
      const report = {
        errorMessage: data.errorMessage,
        errorStack: data.errorStack,
        errorName: data.errorName,
        errorHash: data.errorHash,
        componentStack: data.componentStack || null,
        
        title: data.errorName || "Beacon Crash Report",
        severity: data.severity || "high",
        category: data.category || "unknown",
        priority: "urgent",
        
        screenshot: data.screenshot || null,
        
        url: data.url,
        userAgent: data.userAgent,
        browserInfo: data.browserInfo,
        sessionId: data.sessionId,
        visitorId: data.visitorId || null,
        timestamp: Timestamp.fromDate(new Date(data.timestamp)),
        
        reactVersion: data.reactVersion || null,
        nextVersion: data.nextVersion || null,
        environment: process.env.NODE_ENV === "production" ? "production" : "development",
        
        status: "new",
        adminNotes: [{
          id: `note_${Date.now()}`,
          content: "📡 This report was sent via beacon API",
          createdBy: "system",
          createdAt: new Date().toISOString(),
        }],
        
        occurenceCount: 1,
        firstSeen: Timestamp.now(),
        lastSeen: Timestamp.now(),
        affectedUsers: data.visitorId ? [data.visitorId] : [],
        
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await adminDb.collection(COLLECTION).add(report);
      console.log("[Beacon API] ✅ Full report saved via beacon");
    }

    // Return 204 No Content (standard for beacon)
    return new Response(null, { status: 204 });

  } catch (error) {
    console.error("[Beacon API] Error:", error);
    // Still return 204 to prevent retries
    return new Response(null, { status: 204 });
  }
}
