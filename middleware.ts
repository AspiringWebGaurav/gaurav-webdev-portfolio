import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/constants";
import { verifyAdminSession } from "@/lib/admin/auth";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isLocalHost =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.startsWith("172.");
  const isVercelPreview = host.endsWith(".vercel.app");

  // 1. Authoritative Production Canonical Domain & Protocol Normalizer (301 Moved Permanently)
  // Automatically consolidates www -> non-www and http -> https at the edge layer.
  // Preserves link equity in a single hop and eliminates duplicate crawl variations.
  // Bypassed on local dev and preview deployments to guarantee zero-env development.
  if (!isLocalHost && !isVercelPreview && host) {
    const isWww = host.startsWith("www.");
    const isHttp = forwardedProto === "http" || request.nextUrl.protocol === "http:";

    if (isWww || isHttp) {
      const canonicalHost = host.replace(/^www\./i, "");
      const canonicalUrl = `https://${canonicalHost}${pathname}${search}`;
      return NextResponse.redirect(new URL(canonicalUrl), 301);
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // 2. Dynamic Admin Gatekeeper Routing (/admin/*)
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const verifiedSession = sessionCookie ? await verifyAdminSession(sessionCookie) : null;
    const isAuthenticated = verifiedSession !== null;
    const isSignedWhatsAppNotify =
      pathname === "/admin/whatsapp/notify" && Boolean(request.nextUrl.searchParams.get("sig"));

    const isPublicAdminRoute =
      pathname === "/admin/login" ||
      pathname === "/admin/terms" ||
      pathname === "/admin/privacy" ||
      isSignedWhatsAppNotify;

    const isOtpRoute = pathname === "/admin/otp";
    const otpChallengeCookie = request.cookies.get("admin_otp_challenge")?.value;

    // Case 0: Authenticated admin visiting /admin/otp -> redirect to /admin dashboard
    if (isAuthenticated && isOtpRoute) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // Case A: OTP Challenge in progress (/admin/otp): Must strictly stay on OTP page until verified
    if (isOtpRoute) {
      if (otpChallengeCookie) {
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        // No challenge active -> redirect to login
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }

    // Case B: Authenticated admin visiting /admin/login -> redirect to /admin dashboard (unless explicitly signed out)
    if (isAuthenticated && pathname === "/admin/login") {
      const isExplicitSignOut = request.nextUrl.searchParams.get("signedOut") === "true";
      if (isExplicitSignOut) {
        // User explicitly signed out: purge session cookie and allow login page to render
        const response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        response.cookies.delete(ADMIN_COOKIE_NAME);
        return response;
      }
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // Case C: Unauthenticated user trying to access protected /admin routes -> redirect to /admin/login
    // The root /admin entrypoint is permitted to render the AdminPanelLoader gateway
    if (!isAuthenticated && !isPublicAdminRoute) {
      if (pathname !== "/admin") {
        const loginUrl = new URL("/admin/login", request.url);
        const response = NextResponse.redirect(loginUrl);
        if (sessionCookie) {
          response.cookies.delete(ADMIN_COOKIE_NAME);
        }
        return response;
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes, kept fast and unredirected for webhook/M2M performance)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png, icon.svg, apple-icon.png, manifest.webmanifest, robots.txt, sitemap.xml
     * - Static asset extensions (.png, .webp, .svg, .jpg, .jpeg, .pdf, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icon\\.png|icon\\.svg|apple-icon\\.png|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|.*\\.(?:jpg|jpeg|gif|png|webp|svg|ico|pdf|mp4|webm|json)$).*)",
  ],
};


