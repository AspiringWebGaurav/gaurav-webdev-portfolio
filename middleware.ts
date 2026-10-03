import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/constants";
import { verifyAdminSession } from "@/lib/admin/auth";
import { TALK_COOKIE_NAME, TALK_PORTAL_HOST } from "@/lib/talk/constants";
import { verifyTalkSession } from "@/lib/talk/session";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isLocalHost =
    host.includes("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.startsWith("172.");
  const isVercelPreview = host.endsWith(".vercel.app");

  // 1. Authoritative Production Canonical Domain & Protocol Normalizer (301 Moved Permanently)
  // Automatically consolidates www -> non-www and http -> https at the edge layer.
  // Preserves link equity in a single hop and eliminates duplicate crawl variations.
  // Bypassed on local dev and preview deployments to guarantee zero-env development.
  if (process.env.NODE_ENV !== "development" && !isLocalHost && !isVercelPreview && host) {
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

  // 2. Recruiter Contact Portal Edge Router (contact.gauravpatil.site)
  const RECRUITER_PORTAL_HOST = "contact.gauravpatil.site";
  const isDedicatedSubdomain =
    host === RECRUITER_PORTAL_HOST ||
    ((isLocalHost || process.env.NODE_ENV === "development") && (
      host === "contact.localhost:3000" ||
      host === "contact.localhost" ||
      host.startsWith("contact.localhost") ||
      request.headers.get("x-dev-subdomain") === "contact"
    ));

  // In production, strictly enforce contact.gauravpatil.site
  if (!isLocalHost && !isVercelPreview && process.env.NODE_ENV !== "development") {
    if (!isDedicatedSubdomain && pathname.startsWith("/contact-portal")) {
      const cleanPath = pathname.replace(/^\/contact-portal/, "") || "/";
      return NextResponse.redirect(new URL(`https://${RECRUITER_PORTAL_HOST}${cleanPath}${search}`), 301);
    }
  }

  // Handle Dedicated Subdomain rewriting (e.g. contact.gauravpatil.site or contact.localhost:3000)
  if (isDedicatedSubdomain) {
    requestHeaders.set("x-is-contact-portal", "true");
    const targetPath = pathname.startsWith("/contact-portal")
      ? pathname
      : pathname === "/"
      ? "/contact-portal"
      : `/contact-portal${pathname}`;
    const rewriteUrl = new URL(`${targetPath}${search}`, request.url);
    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // On local development, also allow direct http://localhost:3000/contact-portal for browsers without wildcard localhost DNS
  if (pathname.startsWith("/contact-portal")) {
    requestHeaders.set("x-is-contact-portal", "true");
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 3. Resume Portal Edge Router (resume.gauravpatil.site & resume.localhost:3000)
  const RESUME_PORTAL_HOST = "resume.gauravpatil.site";
  const isDedicatedResumeSubdomain =
    host === RESUME_PORTAL_HOST ||
    ((isLocalHost || process.env.NODE_ENV === "development") && (
      host === "resume.localhost:3000" ||
      host === "resume.localhost" ||
      host.startsWith("resume.localhost") ||
      request.headers.get("x-dev-subdomain") === "resume"
    ));

  // Case A: Request is on the Dedicated Resume Subdomain (resume.gauravpatil.site or resume.localhost:3000)
  if (isDedicatedResumeSubdomain) {
    // 1. If user accesses /resume or /resume/ on the subdomain, redirect cleanly to root /
    if (pathname === "/resume" || pathname === "/resume/") {
      const cleanUrl = new URL(`/${search}`, request.url);
      return NextResponse.redirect(cleanUrl, 301);
    }

    // 2. Strict Domain Isolation: Only root / and asset routes are valid on resume.gauravpatil.site
    const isImageOrStatic =
      pathname.includes("opengraph-image") ||
      pathname.includes("twitter-image") ||
      pathname.includes("icon") ||
      pathname.includes("favicon") ||
      pathname.includes("robots.txt") ||
      pathname.includes("sitemap.xml");

    if (
      pathname !== "/" &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/_next") &&
      !isImageOrStatic
    ) {
      const rootUrl = new URL(`/${search}`, request.url);
      return NextResponse.redirect(rootUrl, 302);
    }

    // 3. Rewrite root / to internal /resume page
    requestHeaders.set("x-is-resume-portal", "true");
    const targetPath =
      pathname === "/"
        ? "/resume"
        : pathname.startsWith("/resume")
        ? pathname
        : `/resume${pathname}`;
    const rewriteUrl = new URL(`${targetPath}${search}`, request.url);
    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Case B: Request is on the Main Domain (gauravpatil.site, www, or localhost:3000 without resume subdomain)
  const isResumeAsset = pathname.includes("opengraph-image") || pathname.includes("twitter-image");

  // If someone visits /resume on production main domain, 301 redirect to https://resume.gauravpatil.site/
  if (!isLocalHost && !isVercelPreview && process.env.NODE_ENV !== "development") {
    if (pathname.startsWith("/resume") && !isResumeAsset) {
      return NextResponse.redirect(new URL(`https://${RESUME_PORTAL_HOST}/${search}`, request.url), 301);
    }
  }

  // On local development, if someone visits http://localhost:3000/resume, redirect to proper http://resume.localhost:3000/
  if ((isLocalHost || process.env.NODE_ENV === "development") && pathname.startsWith("/resume") && !isResumeAsset) {
    const port = host.includes(":") ? `:${host.split(":")[1]}` : ":3000";
    return NextResponse.redirect(new URL(`http://resume.localhost${port}/${search}`, request.url), 307);
  }

  // 4. Talk Command Hub Edge Router (talk.gauravpatil.site & talk.localhost:3000)
  const isDedicatedTalkSubdomain =
    host === TALK_PORTAL_HOST ||
    ((isLocalHost || process.env.NODE_ENV === "development") && (
      host === "talk.localhost:3000" ||
      host === "talk.localhost" ||
      host.startsWith("talk.localhost") ||
      request.headers.get("x-dev-subdomain") === "talk"
    ));

  // Case A: Request is on the Dedicated Talk Subdomain (talk.gauravpatil.site or talk.localhost:3000)
  if (isDedicatedTalkSubdomain) {
    requestHeaders.set("x-is-talk-portal", "true");

    const talkToken = request.cookies.get(TALK_COOKIE_NAME)?.value;
    const isTalkAuth = talkToken ? await verifyTalkSession(talkToken) : null;
    const isLogin = pathname === "/login" || pathname === "/talk/login";

    if (!isTalkAuth && !isLogin && !pathname.startsWith("/api")) {
      const loginUrl = new URL(`/login${search}`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (isTalkAuth && isLogin) {
      const homeUrl = new URL(`/${search}`, request.url);
      return NextResponse.redirect(homeUrl);
    }

    const targetPath =
      pathname === "/"
        ? "/talk"
        : pathname.startsWith("/talk")
        ? pathname
        : `/talk${pathname}`;

    const rewriteUrl = new URL(`${targetPath}${search}`, request.url);
    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Case B: Request is on the Main Domain
  // In production, strictly enforce talk.gauravpatil.site
  if (!isLocalHost && !isVercelPreview && process.env.NODE_ENV !== "development") {
    if (pathname.startsWith("/talk")) {
      const cleanPath = pathname.replace(/^\/talk/, "") || "/";
      return NextResponse.redirect(new URL(`https://${TALK_PORTAL_HOST}${cleanPath}${search}`), 301);
    }
  }

  // On local development, also allow direct http://localhost:3000/talk
  if (pathname.startsWith("/talk")) {
    requestHeaders.set("x-is-talk-portal", "true");
    const talkToken = request.cookies.get(TALK_COOKIE_NAME)?.value;
    const isTalkAuth = talkToken ? await verifyTalkSession(talkToken) : null;
    const isLogin = pathname === "/talk/login";

    if (!isTalkAuth && !isLogin && !pathname.startsWith("/api")) {
      const loginUrl = new URL(`/talk/login${search}`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (isTalkAuth && isLogin) {
      const homeUrl = new URL(`/talk${search}`, request.url);
      return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 5. Self Launchpad Edge Router (self.gauravpatil.site & self.localhost:3000)
  const SELF_PORTAL_HOST = "self.gauravpatil.site";
  const isDedicatedSelfSubdomain =
    host === SELF_PORTAL_HOST ||
    ((isLocalHost || process.env.NODE_ENV === "development") && (
      host === "self.localhost:3000" ||
      host === "self.localhost" ||
      host.startsWith("self.localhost") ||
      request.headers.get("x-dev-subdomain") === "self"
    ));

  // Case A: Request on the Dedicated Self Subdomain
  if (isDedicatedSelfSubdomain) {
    requestHeaders.set("x-is-self-portal", "true");
    const targetPath =
      pathname === "/"
        ? "/self"
        : pathname.startsWith("/self")
        ? pathname
        : `/self${pathname}`;
    const rewriteUrl = new URL(`${targetPath}${search}`, request.url);
    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Case B: In production, redirect gauravpatil.site/self to https://self.gauravpatil.site/
  if (!isLocalHost && !isVercelPreview && process.env.NODE_ENV !== "development") {
    if (pathname.startsWith("/self")) {
      const cleanPath = pathname.replace(/^\/self/, "") || "/";
      return NextResponse.redirect(new URL(`https://${SELF_PORTAL_HOST}${cleanPath}${search}`), 301);
    }
  }

  // On local development, direct access to /self is also supported
  if (pathname.startsWith("/self")) {
    requestHeaders.set("x-is-self-portal", "true");
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 6. Dynamic Admin Gatekeeper Routing (/admin/*)
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
     * - Well-known static metadata files (favicon.ico, icon.png, icon.svg, apple-icon.png, apple-touch-icon.png, og-image.png, manifest.webmanifest, robots.txt, sitemap.xml)
     * - Static asset extensions (.png, .webp, .avif, .svg, .jpg, .jpeg, .pdf, .woff, .woff2, .ttf, .otf, .eot, .glb, .gltf, .mp4, .webm, .mp3, .wav, .ogg, .json, .txt, .xml, .map)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|icon\\.png|icon\\.svg|apple-icon\\.png|apple-touch-icon\\.png|og-image\\.png|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|.*\\.(?:jpg|jpeg|gif|png|webp|avif|svg|ico|pdf|mp4|webm|json|woff|woff2|ttf|otf|eot|glb|gltf|mp3|wav|ogg|xml|txt|map)$).*)",
  ],
};


