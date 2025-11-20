/**
 * API route for managing admin notes on bug reports
 */

import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AddAdminNoteDTO, AdminNote } from "@/types/bugReport";

const COLLECTION_NAME = "bugReports";

/**
 * POST /api/bug-reports/admin-notes
 * Add an admin note to a bug report
 */
export async function POST(request: NextRequest) {
  try {
    const body: AddAdminNoteDTO = await request.json();

    if (!body.bugReportId || !body.content || !body.createdBy) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const docRef = doc(db, COLLECTION_NAME, body.bugReportId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Bug report not found" },
        { status: 404 }
      );
    }

    const note: AdminNote = {
      id: `note_${Date.now()}`,
      content: body.content.trim(),
      createdBy: body.createdBy,
      createdAt: new Date(),
    };

    await updateDoc(docRef, {
      adminNotes: arrayUnion({
        ...note,
        createdAt: Timestamp.fromDate(note.createdAt),
      }),
      updatedAt: Timestamp.fromDate(new Date()),
    });

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error("Error adding admin note:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add admin note" },
      { status: 500 }
    );
  }
}
