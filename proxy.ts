/**
 * Next.js Proxy - Server-Side Request Handler
 * Pure server-side ban blocking - NO client storage
 * All state managed on server via Firestore
 * USES NEW UUID-SYNC SYSTEM
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { identifyVisitor, firestoreGetVisitorDocument, translateMaskToUUID } from "./lib/uuid-sync/server";

const PROTECTED_ROUTES = [
  "/admin/dashboard",
  "/admin/testimonials",
  "/admin/recycle-bin",
];
const AUTH_ROUTES = ["/admin/login"];

// Check ban status using NEW UUID system
async function checkBanStatus(request: NextRequest): Promise<{ 
  banned: boolean; 
  banReason?: string; 
  banCategory?: string;
  uuid?: string;
  mask?: string;
}> {
  try {
    // Try to get mask from cookie (if visitor already identified)
    let mask = request.cookies.get("visitor_mask")?.value;
    
    // If no cookie, generate server-side fingerprint to identify visitor
    if (!mask) {
      const ipAddress = 
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const userAgent = request.headers.get("user-agent") || "unknown";
      
      // Create fingerprint from IP + User Agent (server-side identification)
      const fingerprint = `${ipAddress}_${userAgent}`;
      
      // Identify visitor and get mask
      mask = await identifyVisitor(fingerprint);
      console.log('[Proxy] Generated mask from fingerprint:', mask);
    }
    
    if (mask) {
      // Translate mask to UUID
      const uuid = await translateMaskToUUID(mask);
      
      // Get full visitor document to check ban status
      const visitorDoc = await firestoreGetVisitorDocument(uuid);
      
      if (visitorDoc && visitorDoc.banned === true) {
        console.log('[Proxy] 🚫 Banned visitor detected:', mask);
        return {
          banned: true,
          banReason: visitorDoc.banReason || 'Security Violation',
          banCategory: visitorDoc.banCategory || 'normal',
          uuid,
          mask,
        };
      }
    }
    
    // No mask or not banned
    return { banned: false, mask };
  } catch (error) {
    console.error('[Proxy] Ban check error:', error);
    // Fail open - allow access on error
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

  // SERVER-SIDE BAN CHECK - runs before ANY content loads
  if (!shouldSkipBanCheck) {
    const { banned, banReason, banCategory, mask } = await checkBanStatus(request);

    if (banned) {
      console.log('[Proxy] Redirecting banned visitor to /banned page');
      
      // Build banned URL with server-side query params (NO cookies/storage)
      const bannedUrl = new URL('/banned', request.url);
      bannedUrl.searchParams.set('reason', banReason || 'Security Violation');
      bannedUrl.searchParams.set('category', banCategory || 'normal');
      bannedUrl.searchParams.set('timestamp', new Date().toISOString());
      
      const response = NextResponse.redirect(bannedUrl, { status: 307 }); // Temporary redirect
      
      // Set mask cookie for persistence
      if (mask) {
        response.cookies.set('visitor_mask', mask, {
          httpOnly: false, // Needs to be accessible by client JS
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365, // 1 year
          path: '/',
        });
      }
      
      return response;
    }
    
    // Set mask cookie for non-banned visitors too (for consistency)
    if (mask && !request.cookies.get("visitor_mask")) {
      const response = NextResponse.next();
      response.cookies.set('visitor_mask', mask, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      });
      return response;
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
