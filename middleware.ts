// middleware.ts (in your project root, not inside app/ folder)
import { NextRequest, NextResponse } from 'next/server';
import { TURNSTILE_COOKIE_CONFIG } from './lib/types/turnstile';

export function middleware(request: NextRequest) {
  // Get the origin from the request
  const origin = request.headers.get('origin') || '*';
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  // Create response object
  const response = NextResponse.next();
  
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Turnstile cookie verification for page routes
  if (!request.nextUrl.pathname.startsWith('/api/') &&
      !request.nextUrl.pathname.startsWith('/_next/') &&
      !request.nextUrl.pathname.includes('.')) {
    
    // Check for Turnstile verification cookie
    const turnstileCookie = request.cookies.get(TURNSTILE_COOKIE_CONFIG.name);
    
    if (turnstileCookie) {
      // Verify cookie integrity
      const isValidCookie = verifyCookieValue(turnstileCookie.value);
      
      if (isValidCookie) {
        // Valid cookie - user has been verified
        response.headers.set('x-turnstile-verified', 'true');
        console.log('[Middleware] Valid Turnstile cookie found');
      } else {
        // Invalid or expired cookie - clear it and require new verification
        response.headers.set('x-turnstile-verified', 'false');
        response.cookies.delete(TURNSTILE_COOKIE_CONFIG.name);
        console.log('[Middleware] Invalid Turnstile cookie - cleared');
      }
    } else {
      // No cookie - user needs verification
      response.headers.set('x-turnstile-verified', 'false');
      console.log('[Middleware] No Turnstile cookie - verification required');
    }
  }

  return response;
}

/**
 * Verify cookie value integrity
 * Simple implementation matching the API route logic
 */
function verifyCookieValue(cookieValue: string): boolean {
  try {
    const parts = cookieValue.split('-');
    if (parts.length !== 4) return false;
    
    const [timestamp, random, environment, checksum] = parts;
    
    // Check if timestamp is reasonable (not too old)
    const cookieTime = parseInt(timestamp);
    const now = Date.now();
    const maxAge = TURNSTILE_COOKIE_CONFIG.maxAge * 1000; // Convert to milliseconds
    
    if (isNaN(cookieTime) || (now - cookieTime) > maxAge) {
      return false;
    }
    
    // Verify checksum
    const baseValue = `${timestamp}-${random}-${environment}`;
    const expectedChecksum = Buffer.from(baseValue).toString('base64').slice(0, 8);
    
    return checksum === expectedChecksum;
    
  } catch (error) {
    console.warn('[Middleware] Cookie verification error:', error);
    return false;
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/api/:path*',     // All API routes (CORS)
    '/((?!_next/static|_next/image|favicon.ico).*)', // All pages except Next.js internals
  ],
};
