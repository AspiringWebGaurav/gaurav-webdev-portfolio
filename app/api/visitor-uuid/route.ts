import { NextRequest, NextResponse } from "next/server";
import { identifyVisitor } from "@/lib/uuid-sync/server";

/**
 * Get current visitor's mask from UUID-sync system
 * Returns the public mask (device_**********) for the visitor
 * Lightweight endpoint for client-side identification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fingerprint } = body;

    if (!fingerprint) {
      return NextResponse.json(
        { success: false, error: "Fingerprint required" },
        { status: 400 }
      );
    }

    // Use UUID-sync system to get mask
    const mask = await identifyVisitor(fingerprint);
    
    return NextResponse.json({
      success: true,
      mask,
      fingerprint,
    });
  } catch (error) {
    console.error("Error processing visitor identification:", error);
    return NextResponse.json(
      { success: false, error: "Failed to identify visitor" },
      { status: 500 }
    );
  }
}
