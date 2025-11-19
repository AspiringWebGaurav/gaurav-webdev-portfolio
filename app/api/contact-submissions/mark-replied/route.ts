/**
 * API route for marking contact submission as replied
 * Once marked, the status is IMMUTABLE and cannot be changed back
 */

import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLLECTION_NAME = "contactSubmissions";

/**
 * POST - Mark a submission as replied (IMMUTABLE)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, repliedBy } = body;

    if (!id || !repliedBy) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: id, repliedBy",
        },
        { status: 400 }
      );
    }

    // Get the submission
    const submissionRef = doc(db, COLLECTION_NAME, id);
    const submissionSnapshot = await getDoc(submissionRef);

    if (!submissionSnapshot.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: "Submission not found",
        },
        { status: 404 }
      );
    }

    const currentData = submissionSnapshot.data();

    // Check if already replied - if yes, REJECT the change (IMMUTABLE)
    if (currentData.isReplied === true) {
      return NextResponse.json(
        {
          success: false,
          error: "Submission is already marked as replied and cannot be changed",
        },
        { status: 400 }
      );
    }

    // Mark as replied - THIS IS PERMANENT
    const now = Timestamp.now();
    await updateDoc(submissionRef, {
      status: "replied",
      isReplied: true,
      repliedAt: now,
      repliedBy: repliedBy,
      updatedAt: now,
    });

    // Fetch updated document
    const updatedDoc = await getDoc(submissionRef);
    const data = updatedDoc.data();

    const submission = {
      id: updatedDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      repliedAt: data.repliedAt?.toDate?.()?.toISOString() || data.repliedAt,
    };

    return NextResponse.json(
      {
        success: true,
        submission,
        message: "Submission permanently marked as replied",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking submission as replied:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to mark submission as replied",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
