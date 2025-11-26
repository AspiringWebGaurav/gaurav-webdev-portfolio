/**
 * API route to restore an item from the recycle bin
 */

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const RECYCLE_BIN_COLLECTION = "recycleBin";

// Source collection mapping
const SOURCE_COLLECTIONS: Record<string, string> = {
  "project": "portfolio_projects",
  "tech-stack": "portfolio_techStacks",
  "currently-working": "currentlyWorking",
  "testimonial": "portfolio_testimonials",
  "work-experience": "portfolio_workExperience",
  "contact-submission": "contactSubmissions",
  "ban-appeal": "banAppeals",
  "bug-report": "bugReports",
  "bubble-message": "bubbleMessages",
  "bubble-session": "og_uuid_sessions",
  "visitor-analytics": "og_uuid",
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const recycleBinId = params.id;

    if (!recycleBinId) {
      return NextResponse.json(
        { success: false, error: "Recycle bin item ID is required" },
        { status: 400 }
      );
    }

    // Get item from recycle bin
    const recycleBinRef = doc(db, RECYCLE_BIN_COLLECTION, recycleBinId);
    const recycleBinSnap = await getDoc(recycleBinRef);

    if (!recycleBinSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Item not found in recycle bin" },
        { status: 404 }
      );
    }

    const recycleBinData = recycleBinSnap.data();
    const source = recycleBinData.source;
    const originalData = recycleBinData.data;

    // Determine target collection
    const targetCollection = SOURCE_COLLECTIONS[source];
    if (!targetCollection) {
      return NextResponse.json(
        { success: false, error: `Unknown source type: ${source}` },
        { status: 400 }
      );
    }

    // Restore to original collection
    const restoredRef = await addDoc(
      collection(db, targetCollection),
      originalData
    );

    // Delete from recycle bin
    await deleteDoc(recycleBinRef);

    return NextResponse.json(
      {
        success: true,
        message: "Item restored successfully",
        restoredId: restoredRef.id,
        source,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error restoring item:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to restore item",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
