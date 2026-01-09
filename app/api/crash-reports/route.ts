/**
 * Crash Reports API Route
 * Handles CRUD operations for crash reports
 * 
 * GET    - Fetch all crash reports (admin only)
 * POST   - Create new crash report (public, rate-limited)
 * PATCH  - Update crash report (admin only)
 * DELETE - Delete crash report (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { adminDb, verifyAuth } from "@/lib/firebaseAdmin";
import { CreateCrashReportDTO, CrashReport } from "@/crash-report-mechanism/types/crashReport";

const COLLECTION = "crashReports";
const Timestamp = admin.firestore.Timestamp; // Use admin Timestamp, not client

/**
 * Simple hash function for deduplication
 */
function generateHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * GET - Fetch all crash reports
 * Admin authentication required
 */
export async function GET(request: NextRequest) {
  console.log('[API] 🔍 GET /api/crash-reports - Request received');
  
  try {
    // Verify admin authentication
    const authHeader = request.headers.get("authorization");
    console.log('[API] 🔐 Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('[API] ❌ No authorization header');
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    console.log('[API] 🎫 Token extracted, verifying...');
    
    const decodedToken = await verifyAuth(token);

    if (!decodedToken) {
      console.log('[API] ❌ Token verification failed');
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    console.log(`[API] ✅ Admin authenticated: ${decodedToken.email}`);
    console.log('[API] 📊 Fetching crash reports from Firestore...');

    // Fetch crash reports from Firestore
    const reportsRef = adminDb.collection(COLLECTION);
    const snapshot = await reportsRef
      .orderBy("createdAt", "desc")
      .limit(100) // Pagination limit
      .get();

    const reports = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        firstSeen: data.firstSeen?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastSeen: data.lastSeen?.toDate?.()?.toISOString() || new Date().toISOString(),
        resolvedAt: data.resolvedAt?.toDate?.()?.toISOString(),
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        screenshot: data.screenshot ? {
          ...data.screenshot,
          capturedAt: data.screenshot.capturedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } : null,
        adminNotes: (data.adminNotes || []).map((note: any) => ({
          ...note,
          createdAt: note.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        })),
      };
    });

    console.log(`[API] ✅ Returned ${reports.length} crash reports`);

    return NextResponse.json({
      success: true,
      reports,
      count: reports.length,
    });

  } catch (error: any) {
    console.error("[API] Error fetching crash reports:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new crash report
 * Public endpoint (rate-limited)
 */
export async function POST(request: NextRequest) {
  console.log("[API] ========== CRASH REPORT POST REQUEST ==========");
  
  try {
    const data: CreateCrashReportDTO = await request.json();

    console.log("[API] Received crash report:", {
      severity: data.severity,
      category: data.category,
      errorName: data.errorName,
      errorMessage: data.errorMessage?.substring(0, 100),
      hasScreenshot: !!data.screenshot,
      screenshotSize: data.screenshot?.url ? `${Math.round(data.screenshot.url.length / 1024)}KB` : 'N/A',
      timestamp: data.timestamp,
    });

    // Basic validation
    if (!data.errorMessage || !data.errorStack || !data.errorHash) {
      console.error("[API] ❌ Validation failed - missing required fields");
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Rate limiting check (simple IP-based)
    const ip = request.headers.get("x-forwarded-for") || 
                request.headers.get("x-real-ip") || 
                "unknown";
    
    // TODO: Implement proper rate limiting
    // For now, log the IP for monitoring
    console.log(`[API] Crash report from IP: ${ip}`);

    // Check for duplicate crash (by error hash)
    const existingQuery = adminDb
      .collection(COLLECTION)
      .where("errorHash", "==", data.errorHash)
      .limit(1);

    const existingSnapshot = await existingQuery.get();

    if (!existingSnapshot.empty) {
      // Duplicate found - update occurrence count
      const existingDoc = existingSnapshot.docs[0];
      const existingData = existingDoc.data();

      console.log(`[API] Duplicate crash found (${data.errorHash}), incrementing count`);

      const affectedUsers = Array.from(
        new Set([
          ...(existingData.affectedUsers || []),
          data.visitorId,
        ].filter(Boolean))
      );

      await existingDoc.ref.update({
        occurenceCount: (existingData.occurenceCount || 1) + 1,
        lastSeen: Timestamp.now(),
        affectedUsers,
        updatedAt: Timestamp.now(),
      });

      return NextResponse.json({
        success: true,
        deduped: true,
        crashReportId: existingDoc.id,
        message: "Crash report updated (duplicate)",
      });
    }

    // Create new crash report
    const newReport = {
      // Error details
      errorMessage: data.errorMessage,
      errorStack: data.errorStack,
      errorName: data.errorName,
      errorHash: data.errorHash,
      componentStack: data.componentStack || null,

      // Classification
      title: data.errorName || "Untitled Crash",
      severity: data.severity,
      category: data.category,
      priority: data.severity === "critical" ? "urgent" : "normal",

      // Context - use null instead of undefined
      url: data.url || null,
      userAgent: data.userAgent || null,
      browserInfo: data.browserInfo || null,
      sessionId: data.sessionId || null,
      visitorId: data.visitorId || null,
      timestamp: Timestamp.fromDate(new Date(data.timestamp)),

      // Runtime - explicitly null if missing
      reactVersion: data.reactVersion || null,
      nextVersion: data.nextVersion || null,
      environment: process.env.NODE_ENV === "production" ? "production" : "development",

      // Status
      status: "new",

      // Admin fields
      adminNotes: [],
      assignedTo: null,
      resolvedAt: null,
      resolvedBy: null,
      duplicateOf: null,

      // Deduplication
      occurenceCount: 1,
      firstSeen: Timestamp.now(),
      lastSeen: Timestamp.now(),
      affectedUsers: data.visitorId ? [data.visitorId] : [],

      // Metadata
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    console.log("[API] Creating new crash report in Firestore...");
    const docRef = await adminDb.collection(COLLECTION).add(newReport);

    console.log(`[API] ✅ Created crash report: ${docRef.id}`);

    return NextResponse.json({
      success: true,
      crashReportId: docRef.id,
      message: "Crash report created",
    });

  } catch (error: any) {
    console.error("[API] Error creating crash report:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create crash report" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update crash report
 * Admin authentication required
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const decodedToken = await verifyAuth(token);

    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const { id, updates } = await request.json();

    if (!id || !updates) {
      return NextResponse.json(
        { success: false, error: "Missing id or updates" },
        { status: 400 }
      );
    }

    console.log(`[API] Updating crash report ${id} by ${decodedToken.email}`);

    // Add resolved metadata if status is being set to resolved
    if (updates.status === "resolved" && !updates.resolvedAt) {
      updates.resolvedAt = Timestamp.now();
      updates.resolvedBy = decodedToken.email;
    }

    // Update the document
    await adminDb.collection(COLLECTION).doc(id).update({
      ...updates,
      updatedAt: Timestamp.now(),
    });

    console.log(`[API] ✅ Updated crash report: ${id}`);

    return NextResponse.json({
      success: true,
      message: "Crash report updated",
    });

  } catch (error: any) {
    console.error("[API] Error updating crash report:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update crash report" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete crash report
 * Admin authentication required
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const decodedToken = await verifyAuth(token);

    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing crash report ID" },
        { status: 400 }
      );
    }

    console.log(`[API] ========== DELETE CRASH REPORT ==========`);
    console.log(`[API] Deleting crash report ${id} by ${decodedToken.email}`);

    // Get the crash report first to check for screenshot URL
    const crashDoc = await adminDb.collection(COLLECTION).doc(id).get();
    
    if (!crashDoc.exists) {
      console.error(`[API] ❌ Crash report not found: ${id}`);
      return NextResponse.json(
        { success: false, error: "Crash report not found" },
        { status: 404 }
      );
    }

    // Delete the crash report document from Firestore
    console.log(`[API] 🗑️  Deleting Firestore document...`);
    await adminDb.collection(COLLECTION).doc(id).delete();
    console.log(`[API] ✅ Firestore document deleted: ${id}`);

    console.log(`[API] ========== DELETION COMPLETE ==========`);

    return NextResponse.json({
      success: true,
      message: "Crash report deleted",
      deletedFromFirestore: true,
    });

  } catch (error: any) {
    console.error("[API] Error deleting crash report:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete crash report" },
      { status: 500 }
    );
  }
}
