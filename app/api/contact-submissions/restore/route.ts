/**
 * API route for restoring contact submissions from recycle bin
 * Preserves all original data including status (read/unread)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RestoreContactSubmissionDTO } from "@/types/contactSubmission";

const COLLECTION_NAME = "contactSubmissions";

/**
 * POST - Restore a contact submission with all original data
 * This endpoint preserves the original status, timestamps, and all metadata
 */
export async function POST(request: NextRequest) {
  try {
    const body: RestoreContactSubmissionDTO = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, email, message",
        },
        { status: 400 }
      );
    }

    // Prepare restoration data - preserve ALL original fields
    const restorationData: any = {
      name: body.name,
      email: body.email,
      message: body.message,
      status: body.status || "new", // Preserve original status
      isReplied: body.isReplied || false,
      userAgent: body.userAgent || "",
      ipAddress: body.ipAddress || "",
      // Preserve original timestamps
      createdAt: body.createdAt ? Timestamp.fromDate(new Date(body.createdAt)) : Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Add optional fields if they exist
    if (body.repliedAt) {
      restorationData.repliedAt = Timestamp.fromDate(new Date(body.repliedAt));
    }
    if (body.repliedBy) {
      restorationData.repliedBy = body.repliedBy;
    }
    if (body.replyMessage) {
      restorationData.replyMessage = body.replyMessage;
    }

    // Create the restored submission with original data
    const submissionsRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(submissionsRef, restorationData);

    // Convert timestamps for response
    const submission = {
      id: docRef.id,
      ...body,
      createdAt: (body.createdAt instanceof Date ? body.createdAt : new Date(body.createdAt)).toISOString(),
      updatedAt: new Date().toISOString(),
      repliedAt: body.repliedAt ? (body.repliedAt instanceof Date ? body.repliedAt : new Date(body.repliedAt)).toISOString() : undefined,
    };

    return NextResponse.json(
      {
        success: true,
        submission,
        message: "Contact submission restored successfully with original data",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error restoring contact submission:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to restore contact submission",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
