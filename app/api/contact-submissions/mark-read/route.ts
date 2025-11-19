/**
 * API route for marking contact submission as read
 */

import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLLECTION_NAME = "contactSubmissions";

/**
 * POST - Mark a submission as read
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: id",
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

    // Check if already replied - if yes, cannot mark as read
    if (currentData.isReplied === true) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot modify submission that is marked as replied",
        },
        { status: 400 }
      );
    }

    // Mark as read
    await updateDoc(submissionRef, {
      status: "read",
      updatedAt: Timestamp.now(),
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
        message: "Submission marked as read",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking submission as read:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to mark submission as read",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
