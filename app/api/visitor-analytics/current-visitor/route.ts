/**
 * Get current visitor's mask by fingerprint
 * Returns the visitor mask for the current browser
 * NEW: Uses UUID-sync system
 */
import { NextRequest, NextResponse } from "next/server";
import { identifyVisitor } from "@/lib/uuid-sync/server";

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

    // Identify visitor using UUID-sync system - returns mask
    const mask = await identifyVisitor(clientFingerprint);

    return NextResponse.json({ 
      mask,
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
