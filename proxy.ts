/**
 * Next.js Proxy - Server-Side Request Handler
 * Authentication and admin route protection
 * Server-side ban detection (instant, no client delay)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIP, checkBanByIP } from "./lib/server-ban-check";

const PROTECTED_ROUTES = [
  "/admin/dashboard",
  "/admin/testimonials",
  "/admin/recycle-bin",
];
const AUTH_ROUTES = ["/admin/login"];

// Check ban status using server-side IP lookup (NO cookies/storage)
async function checkBanStatus(request: NextRequest): Promise<{ 
  banned: boolean; 
  banReason?: string; 
  banCategory?: string;
  uuid?: string;
  mask?: string;
}> {
  try {
    // Get client IP address
    const ip = getClientIP(request);
    
    // Check if any banned visitor from this IP exists
    const result = await checkBanByIP(ip);
    
    if (result.banned && process.env.NODE_ENV === 'development') {
      console.log('[Proxy] ⛔ BANNED VISITOR DETECTED (server-side)', {
        ip,
        mask: result.mask,
        reason: result.banReason,
      });
    }
    
    return result;
    
  } catch (error: any) {
    // Log error but fail open to not block legitimate traffic
    console.error('[Proxy] Ban check error - allowing access:', error?.message);
    return { banned: false };
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip ban check for these paths
  const excludedFromBanCheck = [
    '/api',
    '/_next',
    '/favicon.ico',
    '/admin',
    '/banned',
  ];

  const shouldSkipBanCheck = excludedFromBanCheck.some(path => pathname.startsWith(path));

  // SERVER-SIDE BAN CHECK - runs before ANY content loads (pure server-side, no cookies)
  if (!shouldSkipBanCheck) {
    const banCheckResult = await checkBanStatus(request);

    if (banCheckResult.banned) {
      // Always log security events (banned visitor blocked)
      console.log('[Proxy] ⛔ BLOCKED BANNED VISITOR:', {
        path: pathname,
        reason: banCheckResult.banReason,
        timestamp: new Date().toISOString(),
      });
      
      // Build banned URL with server-side query params (NO cookies/storage)
      const bannedUrl = new URL('/banned', request.url);
      bannedUrl.searchParams.set('reason', banCheckResult.banReason || 'Security Violation');
      bannedUrl.searchParams.set('category', banCheckResult.banCategory || 'normal');
      bannedUrl.searchParams.set('timestamp', new Date().toISOString());
      
      return NextResponse.redirect(bannedUrl, { status: 307 }); // Temporary redirect
    }
  }

  // Check if the route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Get session cookie
  const sessionId = request.cookies.get("admin_session_id")?.value;

  // If accessing protected route without session, redirect to login
  if (isProtectedRoute && !sessionId) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If accessing auth route with valid session, redirect to dashboard
  if (isAuthRoute && sessionId) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // Add security headers
  const response = NextResponse.next();

  // Prevent chunk loading errors with proper caching
  if (pathname.includes("/_next/static/")) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );
  } else if (pathname.includes("/_next/")) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, must-revalidate"
    );
  }

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

// Next.js middleware must be exported as "middleware"
export { proxy as middleware };

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
