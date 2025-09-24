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
        // Valid session cookie - user has been verified for this session
        response.headers.set('x-turnstile-verified', 'true');
        console.log('[Middleware] Valid session Turnstile cookie found');
      } else {
        // Invalid session cookie - clear it and require new verification
        response.headers.set('x-turnstile-verified', 'false');
        response.cookies.delete(TURNSTILE_COOKIE_CONFIG.name);
        console.log('[Middleware] Invalid session Turnstile cookie - cleared');
      }
    } else {
      // No session cookie - user needs verification
      response.headers.set('x-turnstile-verified', 'false');
      console.log('[Middleware] No session Turnstile cookie - verification required');
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
    
    // For session cookies, we only verify format and checksum
    // No age validation needed since session cookies expire automatically when browser closes
    const cookieTime = parseInt(timestamp);
    
    if (isNaN(cookieTime)) {
      return false;
    }
    
    // Verify checksum
    const baseValue = `${timestamp}-${random}-${environment}`;
    const expectedChecksum = Buffer.from(baseValue).toString('base64').slice(0, 8);
    
    return checksum === expectedChecksum;
    
  } catch (error) {
    console.warn('[Middleware] Session cookie verification error:', error);
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
