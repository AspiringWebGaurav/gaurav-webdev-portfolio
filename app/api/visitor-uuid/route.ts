import { NextRequest, NextResponse } from "next/server";

/**
 * Get current visitor's UUID without saving to database
 * Returns the same UUID that backend uses for tracking/banning
 * This is a lightweight endpoint that just echoes back the client-generated fingerprint
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

    // Return the fingerprint as-is (client already generated enhanced fingerprint)
    return NextResponse.json({
      success: true,
      visitorId: fingerprint,
      fingerprint: fingerprint,
    });
  } catch (error) {
    console.error("Error processing visitor UUID:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process UUID" },
      { status: 500 }
    );
  }
}
