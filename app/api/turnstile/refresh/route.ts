/**
 * Turnstile Background Refresh API Route
 * POST /api/turnstile/refresh
 * Silent verification refresh for existing verified users
 */

import { NextRequest, NextResponse } from 'next/server';
import { TURNSTILE_COOKIE_CONFIG } from '@/lib/types/turnstile';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshType, userAgent } = body;

    // Get client IP for logging
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    '127.0.0.1';

    console.log(`[Turnstile Refresh] Background refresh requested from ${clientIP}`);

    // Check if user has existing verification cookie
    const existingCookie = request.cookies.get(TURNSTILE_COOKIE_CONFIG.name);
    
    if (!existingCookie || !existingCookie.value) {
      console.warn('[Turnstile Refresh] No existing verification cookie found');
      return NextResponse.json(
        {
          success: false,
          message: 'No existing verification found',
          requiresFullVerification: true
        },
        { status: 401 }
      );
    }

    // Validate existing cookie format
    const isValidFormat = validateCookieFormat(existingCookie.value);
    if (!isValidFormat) {
      console.warn('[Turnstile Refresh] Invalid cookie format');
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid verification format',
          requiresFullVerification: true
        },
        { status: 401 }
      );
    }

    // Generate new cookie value for extended verification
    const newCookieValue = generateRefreshCookieValue(userAgent);
    
    const response = NextResponse.json(
      {
        success: true,
        message: 'Verification refreshed successfully',
        method: 'background_refresh',
        expiresIn: TURNSTILE_COOKIE_CONFIG.maxAge
      },
      { status: 200 }
    );

    // Set refreshed authentication cookie with extended duration
    const cookieOptions = {
      httpOnly: TURNSTILE_COOKIE_CONFIG.httpOnly,
      secure: TURNSTILE_COOKIE_CONFIG.secure,
      sameSite: TURNSTILE_COOKIE_CONFIG.sameSite as 'strict' | 'lax' | 'none',
      path: TURNSTILE_COOKIE_CONFIG.path,
      maxAge: TURNSTILE_COOKIE_CONFIG.maxAge // Now 7 days
    };

    response.cookies.set(TURNSTILE_COOKIE_CONFIG.name, newCookieValue, cookieOptions);

    console.log(`[Turnstile Refresh] ✅ Verification refreshed for ${clientIP}, expires in ${TURNSTILE_COOKIE_CONFIG.maxAge}s`);

    return response;

  } catch (error) {
    console.error('[Turnstile Refresh] Unexpected error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Refresh failed',
        requiresFullVerification: false // Don't force re-verification on refresh errors
      },
      { status: 500 }
    );
  }
}

/**
 * Validate cookie format for refresh eligibility
 */
function validateCookieFormat(cookieValue: string): boolean {
  try {
    const parts = cookieValue.split('-');
    if (parts.length !== 4) return false;
    
    const [timestamp] = parts;
    const cookieTime = parseInt(timestamp);
    
    // Check if timestamp is reasonable and not too old
    const now = Date.now();
    const maxRefreshAge = TURNSTILE_COOKIE_CONFIG.maxAge * 1000; // Convert to milliseconds
    
    return !isNaN(cookieTime) && (now - cookieTime) <= maxRefreshAge;
  } catch {
    return false;
  }
}

/**
 * Generate new cookie value for background refresh
 */
function generateRefreshCookieValue(userAgent?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const environment = process.env.NODE_ENV || 'production';
  const method = 'refresh';
  
  // Create base value with refresh indicator
  const baseValue = `${timestamp}-${random}-${method}-${environment}`;
  
  // Add simple checksum (use proper HMAC signing in production)
  const checksum = Buffer.from(baseValue + (userAgent || '')).toString('base64').slice(0, 8);
  
  return `${baseValue}-${checksum}`;
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST for refresh.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}