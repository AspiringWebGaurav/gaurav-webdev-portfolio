/**
 * API endpoint to restore a bug report from recycle bin
 * POST /api/bug-reports/restore
 */

import { NextRequest, NextResponse } from "next/server";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLLECTION_NAME = "bugReports";

/**
 * POST - Restore a bug report to the database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bugReportData = body;

    if (!bugReportData || !bugReportData.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing bug report data or ID",
        },
        { status: 400 }
      );
    }

    // Convert date strings back to Timestamp objects for Firestore
    const firestoreData = {
      ...bugReportData,
      createdAt: bugReportData.createdAt 
        ? Timestamp.fromDate(new Date(bugReportData.createdAt))
        : Timestamp.now(),
      updatedAt: Timestamp.now(),
      resolvedAt: bugReportData.resolvedAt
        ? Timestamp.fromDate(new Date(bugReportData.resolvedAt))
        : null,
      attachments: bugReportData.attachments?.map((att: any) => ({
        ...att,
        uploadedAt: att.uploadedAt
          ? Timestamp.fromDate(new Date(att.uploadedAt))
          : Timestamp.now(),
      })) || [],
      adminNotes: bugReportData.adminNotes?.map((note: any) => ({
        ...note,
        createdAt: note.createdAt
          ? Timestamp.fromDate(new Date(note.createdAt))
          : Timestamp.now(),
      })) || [],
    };

    // Restore to Firestore with original ID
    const docRef = doc(db, COLLECTION_NAME, bugReportData.id);
    await setDoc(docRef, firestoreData);

    return NextResponse.json({
      success: true,
      bugReport: bugReportData,
    });
  } catch (error: any) {
    console.error("Error restoring bug report:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to restore bug report",
      },
      { status: 500 }
    );
  }
}
