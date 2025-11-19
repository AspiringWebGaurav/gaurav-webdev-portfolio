/**
 * Get current visitor's UUID from tracking system
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
  try {
    // Get all active visitors, sorted by last visit
    const snapshot = await adminDb
      .collection("visitorProfiles")
      .where("currentStatus", "==", "active")
      .orderBy("lastVisit", "desc")
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return NextResponse.json({ visitorId: doc.id }); // Use doc.id not data.id
    }

    // Fallback: get any recent visitor
    const fallback = await adminDb
      .collection("visitorProfiles")
      .orderBy("lastVisit", "desc")
      .limit(1)
      .get();

    if (!fallback.empty) {
      return NextResponse.json({ visitorId: fallback.docs[0].id }); // Use doc.id
    }

    return NextResponse.json({ visitorId: "no_visitors" });
  } catch (error) {
    console.error("UUID fetch error:", error);
    return NextResponse.json({ visitorId: "error" });
  }
}
