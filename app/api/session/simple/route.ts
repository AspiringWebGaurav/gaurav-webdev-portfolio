// app/api/session/simple/route.ts
// Simplified session generation for debugging (temporary)

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

interface SimpleSessionRequest {
  fingerprint?: any;
  preferredUUID?: string;
}

interface SimpleSessionResponse {
  success: boolean;
  sessionToken?: string;
  uuid?: string;
  expiresIn?: number;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<SimpleSessionResponse>> {
  try {
    // Parse request
    const body: SimpleSessionRequest = await req.json();
    
    // Use preferred UUID or generate new one
    const uuid = body.preferredUUID && isValidUUID(body.preferredUUID) 
      ? body.preferredUUID 
      : uuidv4();
    
    // Create simple session token
    const sessionToken = createSimpleToken(uuid);
    
    console.log('[SimpleSession] Generated session:', { uuid, hasToken: !!sessionToken });
    
    return NextResponse.json({
      success: true,
      sessionToken,
      uuid,
      expiresIn: 24 * 60 * 60, // 24 hours
    });
    
  } catch (error) {
    console.error('[SimpleSession] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate session',
    }, { status: 500 });
  }
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function createSimpleToken(uuid: string): string {
  const now = Math.floor(Date.now() / 1000);
  const expires = now + (24 * 60 * 60); // 24 hours
  
  // Simple token format - not crypto secure but functional
  return `simple_${uuid}_${now}_${expires}`;
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}