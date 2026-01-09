/**
 * Beacon API endpoint for crash report deletion
 * Used when page is closing and normal fetch won't work
 */

import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  console.log("[API] ========== BEACON DELETE REQUEST ==========");
  
  try {
    const data = await request.json();
    const { id, token } = data;

    if (!id || !token) {
      console.error("[API] Missing id or token in beacon request");
      return NextResponse.json(
        { success: false, error: "Missing id or token" },
        { status: 400 }
      );
    }

    console.log(`[API] Beacon deletion request for crash report: ${id}`);

    // Verify token
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log(`[API] Token verified for user: ${decodedToken.email}`);
    } catch (authError) {
      console.error("[API] Token verification failed:", authError);
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Get crash report
    const crashDoc = await adminDb.collection("crashReports").doc(id).get();
    
    if (!crashDoc.exists) {
      console.log(`[API] Crash report not found: ${id}`);
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }

    const crashData = crashDoc.data();
    let screenshotDeleted = false;

    // Delete screenshot from Storage if exists
    if (crashData?.screenshot?.url) {
      const screenshotUrl = crashData.screenshot.url;
      
      if (screenshotUrl.includes('firebasestorage.googleapis.com') || 
          screenshotUrl.includes('storage.googleapis.com')) {
        
        try {
          const urlParts = screenshotUrl.split('/o/');
          if (urlParts.length > 1) {
            const filePath = decodeURIComponent(urlParts[1].split('?')[0]);
            const bucket = admin.storage().bucket();
            await bucket.file(filePath).delete();
            screenshotDeleted = true;
            console.log(`[API] ✅ Screenshot deleted via beacon: ${filePath}`);
          }
        } catch (storageError: any) {
          console.error('[API] Beacon storage deletion failed:', storageError.message);
          // Continue anyway
        }
      }
    }

    // Delete Firestore document
    await adminDb.collection("crashReports").doc(id).delete();
    console.log(`[API] ✅ Crash report deleted via beacon: ${id}`);

    return NextResponse.json({
      success: true,
      deletedFromFirestore: true,
      deletedFromStorage: screenshotDeleted,
    });

  } catch (error: any) {
    console.error("[API] Beacon deletion error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Beacon deletion failed" },
      { status: 500 }
    );
  }
}
