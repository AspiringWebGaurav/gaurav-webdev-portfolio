import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // Get the crash report by ID
    const crashDoc = await adminDb
      .collection("crashReports")
      .doc(id)
      .get();

    if (!crashDoc.exists) {
      return NextResponse.json(
        { error: "Crash report not found" },
        { status: 404 }
      );
    }

    const crashData = crashDoc.data();
    const crash = {
      id: crashDoc.id,
      ...crashData,
      timestamp: crashData?.timestamp?.toDate().toISOString(),
      lastOccurrence: crashData?.lastOccurrence?.toDate().toISOString(),
    };

    return NextResponse.json(crash);
  } catch (error) {
    console.error("Error fetching crash report:", error);
    return NextResponse.json(
      { error: "Failed to fetch crash report" },
      { status: 500 }
    );
  }
}
