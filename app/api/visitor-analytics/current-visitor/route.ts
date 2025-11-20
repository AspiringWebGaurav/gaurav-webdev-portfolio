/**
 * Get current visitor's UUID by fingerprint
 * Returns the visitor ID for the current browser
 */
import { NextRequest, NextResponse } from "next/server";
import { generateDeviceFingerprint } from "@/lib/deviceFingerprint";

export async function GET(request: NextRequest) {
  try {
    // Get fingerprint from query (client sends it)
    const { searchParams } = new URL(request.url);
    const clientFingerprint = searchParams.get('fingerprint');
    
    if (!clientFingerprint) {
      return NextResponse.json(
        { error: 'Fingerprint required' },
        { status: 400 }
      );
    }

    // The visitor ID is simply device_ + fingerprint
    const visitorId = `device_${clientFingerprint}`;

    return NextResponse.json({ 
      visitorId,
      success: true 
    });
  } catch (error) {
    console.error("Current visitor ID fetch error:", error);
    return NextResponse.json(
      { error: 'Failed to get visitor ID' },
      { status: 500 }
    );
  }
}
