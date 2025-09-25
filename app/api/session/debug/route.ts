// app/api/session/debug/route.ts
// Debug endpoint to test basic functionality

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  try {
    // Test basic functionality
    const testUUID = uuidv4();
    const now = Date.now();
    
    // Check environment variables
    const hasSessionSecret = !!process.env.SESSION_SECRET;
    const nodeEnv = process.env.NODE_ENV;
    
    return NextResponse.json({
      success: true,
      debug: {
        canGenerateUUID: !!testUUID,
        hasSessionSecret,
        nodeEnv,
        timestamp: now,
        testUUID,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Simple session generation without crypto for debugging
    const uuid = body.preferredUUID || uuidv4();
    const simpleToken = `simple_${uuid}_${Date.now()}`;
    
    return NextResponse.json({
      success: true,
      sessionToken: simpleToken,
      uuid,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
      debug: true
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}