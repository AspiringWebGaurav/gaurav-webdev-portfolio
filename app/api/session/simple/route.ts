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
    // Validate request method
    if (req.method !== 'POST') {
      return NextResponse.json({
        success: false,
        error: 'Method not allowed',
      }, { status: 405 });
    }

    // Parse request body with proper validation
    let body: SimpleSessionRequest = {};
    
    try {
      const contentType = req.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const rawBody = await req.text();
        if (rawBody.trim()) {
          body = JSON.parse(rawBody);
        }
      }
    } catch (parseError) {
      // Handle malformed JSON gracefully
      if (process.env.NODE_ENV === 'development') {
        console.warn('[SimpleSession] JSON parse warning:', parseError);
      }
      // Continue with empty body - this is acceptable for session generation
      body = {};
    }
    
    // Use preferred UUID or generate new one
    const uuid = body.preferredUUID && isValidUUID(body.preferredUUID)
      ? body.preferredUUID
      : uuidv4();
    
    // Create simple session token
    const sessionToken = createSimpleToken(uuid);
    
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[SimpleSession] Generated session:', {
        uuid: uuid.substring(0, 8) + '...', // Truncated for security
        hasToken: !!sessionToken
      });
    }
    
    return NextResponse.json({
      success: true,
      sessionToken,
      uuid,
      expiresIn: 24 * 60 * 60, // 24 hours
    });
    
  } catch (error) {
    // Improved error logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (process.env.NODE_ENV === 'development') {
      console.error('[SimpleSession] Error:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined
      });
    } else {
      // Production: minimal logging
      console.error('[SimpleSession] Session generation failed');
    }
    
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
  // In development, provide a helpful status endpoint
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.json(
      {
        status: 'ok',
        service: 'session-simple',
        method: 'POST',
        description: 'Simple session generation endpoint for development debugging',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  }
  
  // Production: method not allowed
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}