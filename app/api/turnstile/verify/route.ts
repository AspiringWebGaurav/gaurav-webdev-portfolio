/**
 * Cloudflare Turnstile Verification API Route
 * POST /api/turnstile/verify
 * Handles entry gate verification and sets authentication cookies
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyTurnstileToken, getClientIP, checkRateLimit } from '@/lib/turnstile';
import { 
  TurnstileVerificationRequest, 
  TurnstileVerificationResponse,
  TURNSTILE_COOKIE_CONFIG 
} from '@/lib/types/turnstile';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: TurnstileVerificationRequest = await request.json();
    const { token } = body;

    // Get client IP for rate limiting and logging
    const clientIP = getClientIP(request.headers);
    const rateLimitKey = clientIP || 'anonymous';

    // Rate limiting - 5 attempts per 5 minutes per IP
    if (!checkRateLimit(rateLimitKey, 5, 300000)) {
      console.warn(`[Turnstile API] Rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Too many verification attempts. Please try again later.',
          errors: ['RATE_LIMIT_EXCEEDED']
        } as TurnstileVerificationResponse,
        { status: 429 }
      );
    }

    // Validate token presence
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Verification token is required',
          errors: ['MISSING_TOKEN']
        } as TurnstileVerificationResponse,
        { status: 400 }
      );
    }

    console.log(`[Turnstile API] Verifying token for IP: ${clientIP}`);

    // Verify token with Cloudflare
    const verificationResult = await verifyTurnstileToken(token, clientIP);

    // Handle verification failure
    if (!verificationResult.success) {
      console.warn(`[Turnstile API] Verification failed for IP: ${clientIP}`, {
        errors: verificationResult.errors
      });
      
      return NextResponse.json(verificationResult, { status: 400 });
    }

    // Verification successful - create response with cookie
    console.log(`[Turnstile API] Verification successful for IP: ${clientIP}`);
    
    const response = NextResponse.json(
      {
        success: true,
        message: 'Verification successful',
        challenge_ts: verificationResult.challenge_ts,
        hostname: verificationResult.hostname
      } as TurnstileVerificationResponse,
      { status: 200 }
    );

    // Set session-only authentication cookie
    const cookieValue = generateSecureCookieValue();
    const cookieOptions = {
      httpOnly: TURNSTILE_COOKIE_CONFIG.httpOnly,
      secure: TURNSTILE_COOKIE_CONFIG.secure,
      sameSite: TURNSTILE_COOKIE_CONFIG.sameSite as 'strict' | 'lax' | 'none',
      path: TURNSTILE_COOKIE_CONFIG.path,
      // No maxAge for session-only cookie - expires when browser closes
    };

    response.cookies.set(TURNSTILE_COOKIE_CONFIG.name, cookieValue, cookieOptions);

    // Log successful verification (without sensitive data)
    console.log(`[Turnstile API] Session cookie set for IP: ${clientIP} - expires when browser session ends`);

    return response;

  } catch (error) {
    console.error('[Turnstile API] Unexpected error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        errors: ['INTERNAL_ERROR']
      } as TurnstileVerificationResponse,
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
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

/**
 * Generate a secure cookie value for authentication
 * This is a simple implementation - consider using JWT or similar for production
 * @returns Secure cookie value
 */
function generateSecureCookieValue(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const environment = process.env.NODE_ENV || 'development';
  
  // Simple signed value (consider using proper signing in production)
  const baseValue = `${timestamp}-${random}-${environment}`;
  
  // Add a simple checksum (use proper HMAC signing in production)
  const checksum = Buffer.from(baseValue).toString('base64').slice(0, 8);
  
  return `${baseValue}-${checksum}`;
}

/**
 * Verify cookie value integrity
 * Used by middleware to validate cookies
 * @param cookieValue - Cookie value to verify
 * @returns boolean indicating if cookie is valid
 */
export function verifyCookieValue(cookieValue: string): boolean {
  try {
    const parts = cookieValue.split('-');
    if (parts.length !== 4) return false;
    
    const [timestamp, random, environment, checksum] = parts;
    
    // For session cookies, we only verify format and checksum
    // No age validation needed since session cookies expire automatically
    const cookieTime = parseInt(timestamp);
    
    if (isNaN(cookieTime)) {
      return false;
    }
    
    // Verify checksum
    const baseValue = `${timestamp}-${random}-${environment}`;
    const expectedChecksum = Buffer.from(baseValue).toString('base64').slice(0, 8);
    
    return checksum === expectedChecksum;
    
  } catch (error) {
    console.warn('[Cookie Verification] Invalid cookie format:', error);
    return false;
  }
}

// Cookie verification utility is exported above