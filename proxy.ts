/**
 * Next.js Proxy - Server-Side Request Handler
 * Pure server-side ban blocking - NO client storage
 * All state managed on server via Firestore
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/admin/dashboard",
  "/admin/testimonials",
  "/admin/recycle-bin",
];
const AUTH_ROUTES = ["/admin/login"];

// Generate visitor ID (same logic as backend)
function generateVisitorId(fingerprint: string): string {
  let hash = 5381;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) + hash) + char;
  }
  const hashValue = Math.abs(hash);
  return 'device_' + hashValue.toString(36);
}

// Check ban status using Firestore REST API (pure server-side)
async function checkBanStatus(request: NextRequest): Promise<{ banned: boolean; banReason?: string; banCategory?: string }> {
  try {
    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress = request.headers.get("x-forwarded-for")?.split(',')[0]?.trim() || 
                     request.headers.get("x-real-ip") || 
                     "unknown";
    
    const fingerprint = `${ipAddress}_${userAgent}`;
    const visitorId = generateVisitorId(fingerprint);

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      console.log('[Proxy] No Firebase project ID');
      return { banned: false };
    }

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/visitorProfiles/${visitorId}`;
    
    const response = await fetch(firestoreUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      // Document doesn't exist - not banned
      return { banned: false };
    }

    const data = await response.json();
    const fields = data.fields;

    if (fields?.banned?.booleanValue === true) {
      const banReason = fields?.banReason?.stringValue || 'Security Violation';
      const banCategory = fields?.banCategory?.stringValue || 'normal';
      
      console.log('[Proxy] ⛔ BANNED USER BLOCKED:', {
        visitorId,
        reason: banReason,
        category: banCategory
      });
      
      return {
        banned: true,
        banReason,
        banCategory,
      };
    }

    return { banned: false };
  } catch (error) {
    console.error('[Proxy] Ban check error:', error);
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
    const { banned, banReason, banCategory } = await checkBanStatus(request);

    if (banned) {
      // Build banned URL with server-side query params (NO cookies/storage)
      const bannedUrl = new URL('/banned', request.url);
      bannedUrl.searchParams.set('reason', banReason || 'Security Violation');
      bannedUrl.searchParams.set('category', banCategory || 'normal');
      bannedUrl.searchParams.set('t', Date.now().toString()); // Prevent caching
      
      console.log('[Proxy] Redirecting banned user to:', bannedUrl.pathname);
      
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
