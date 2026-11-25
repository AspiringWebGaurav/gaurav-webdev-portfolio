import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/constants";
import { verifyAdminSession } from "@/lib/admin/auth";
import { TALK_COOKIE_NAME, TALK_PORTAL_HOST } from "@/lib/talk/constants";
import { verifyTalkSession } from "@/lib/talk/session";
import { THEME_COOKIE_NAME, THEME_COOKIE_MAX_AGE, getSharedCookieDomain } from "@/lib/theme/cookie";
import { getServerTheme, setServerTheme } from "@/lib/theme/server";

// Canonical Subdomain Host Definitions
const APPS_HUB_HOST = "apps.gauravpatil.site";
const SERVICES_HUB_HOST = "services.gauravpatil.site";

const CP_APP_HOST = "cp.apps.gauravpatil.site";
const DOWNEX_APP_HOST = "downex.apps.gauravpatil.site";
const SM_APP_HOST = "sm.apps.gauravpatil.site";
const GPN_APP_HOST = "gpn.apps.gauravpatil.site";

const RESUME_SERVICE_HOST = "resume.services.gauravpatil.site";
const TALK_SERVICE_HOST = TALK_PORTAL_HOST; // "talk.services.gauravpatil.site"
const CONTACT_SERVICE_HOST = "contact.services.gauravpatil.site";

// Legacy Subdomain Hosts
const LEGACY_DOWNEX_HOST = "downex.gauravpatil.site";
const LEGACY_SELF_HOST = "self.gauravpatil.site";
const LEGACY_RESUME_HOST = "resume.gauravpatil.site";
const LEGACY_TALK_HOST = "talk.gauravpatil.site";
const LEGACY_CONTACT_HOST = "contact.gauravpatil.site";

async function handleRouting(request: NextRequest, requestHeaders: Headers): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const rawHost = request.headers.get("host") || "";
  const host = rawHost.toLowerCase().split(":")[0];
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const devSubdomain = request.headers.get("x-dev-subdomain") || "";

  const isLocalHost =
    host.includes("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.startsWith("172.");
  const isVercelPreview = host.endsWith(".vercel.app");
  const isProd = process.env.NODE_ENV !== "development" && !isLocalHost && !isVercelPreview;

  // 1. Production Canonical Normalizer: Consolidated www -> non-www and http -> https
  if (isProd && host) {
    const isWww = rawHost.startsWith("www.");
    const isHttp = forwardedProto === "http" || request.nextUrl.protocol === "http:";

    if (isWww || isHttp) {
      const canonicalHost = rawHost.replace(/^www\./i, "");
      const canonicalUrl = `https://${canonicalHost}${pathname}${search}`;
      return NextResponse.redirect(new URL(canonicalUrl), 301);
    }
  }

  // 2. Legacy Outdated Subdomain 301 Migrations -> Clubbed Subdomains
  if (isProd) {
    if (host === LEGACY_SELF_HOST) {
      return NextResponse.redirect(new URL(`https://${APPS_HUB_HOST}${pathname}${search}`), 301);
    }
    if (host === LEGACY_RESUME_HOST) {
      return NextResponse.redirect(new URL(`https://${RESUME_SERVICE_HOST}${pathname}${search}`), 301);
    }
    if (host === LEGACY_TALK_HOST) {
      return NextResponse.redirect(new URL(`https://${TALK_SERVICE_HOST}${pathname}${search}`), 301);
    }
    if (host === LEGACY_CONTACT_HOST) {
      return NextResponse.redirect(new URL(`https://${CONTACT_SERVICE_HOST}${pathname}${search}`), 301);
    }
  }

  // Subdomain redirect resolver (enforces pure subdomains in both dev and prod)
  const getSubdomainRedirect = (
    prodHost: string,
    localSubdomain: string,
    cleanPath: string,
    isPermanent = true
  ): NextResponse => {
    if (isProd) {
      return NextResponse.redirect(new URL(`https://${prodHost}${cleanPath}${search}`), isPermanent ? 301 : 302);
    }
    const localPort = rawHost.includes(":") ? `:${rawHost.split(":")[1]}` : ":3000";
    return NextResponse.redirect(new URL(`http://${localSubdomain}${localPort}${cleanPath}${search}`), 307);
  };

  // -------------------------------------------------------------
  // A. APPS HUB (apps.gauravpatil.site & apps.localhost:3000)
  // -------------------------------------------------------------
  const isAppsHubSubdomain =
    host === APPS_HUB_HOST ||
    ((isLocalHost || !isProd) && (
      host === "apps.localhost" ||
      host.startsWith("apps.localhost") ||
      devSubdomain === "apps"
    ));

  if (isAppsHubSubdomain) {
    if (pathname === "/apps" || pathname === "/apps/") {
      return NextResponse.redirect(new URL(`/${search}`, request.url), 301);
    }
    requestHeaders.set("x-is-apps-hub", "true");
    const targetPath = pathname === "/" ? "/apps" : pathname.startsWith("/apps") ? pathname : `/apps${pathname}`;
    return NextResponse.rewrite(new URL(`${targetPath}${search}`, request.url), {
      request: { headers: requestHeaders },
    });
  }

  // Redirect root domain /apps to pure subdomain (apps.localhost:3000 in dev, apps.gauravpatil.site in prod)
  if (pathname.startsWith("/apps")) {
    const cleanPath = pathname.replace(/^\/apps/, "") || "/";
    return getSubdomainRedirect(APPS_HUB_HOST, "apps.localhost", cleanPath);
  }

  // -------------------------------------------------------------
  // B. SERVICES HUB (services.gauravpatil.site & services.localhost:3000)
  // -------------------------------------------------------------
  const isServicesHubSubdomain =
    host === SERVICES_HUB_HOST ||
    ((isLocalHost || !isProd) && (
      host === "services.localhost" ||
      host.startsWith("services.localhost") ||
      devSubdomain === "services"
    ));

  if (isServicesHubSubdomain) {
    if (pathname === "/services" || pathname === "/services/") {
      return NextResponse.redirect(new URL(`/${search}`, request.url), 301);
    }
    requestHeaders.set("x-is-services-hub", "true");
    const targetPath = pathname === "/" ? "/services" : pathname.startsWith("/services") ? pathname : `/services${pathname}`;
    return NextResponse.rewrite(new URL(`${targetPath}${search}`, request.url), {
      request: { headers: requestHeaders },
    });
  }

  // Redirect root domain /services to pure subdomain (services.localhost:3000 in dev, services.gauravpatil.site in prod)
  if (pathname.startsWith("/services")) {
    const cleanPath = pathname.replace(/^\/services/, "") || "/";
    return getSubdomainRedirect(SERVICES_HUB_HOST, "services.localhost", cleanPath);
  }

  // -------------------------------------------------------------
  // 1. CP APP PORTAL (cp.apps.gauravpatil.site)
  // -------------------------------------------------------------
  const isCpAppSubdomain =
    host === CP_APP_HOST ||
    ((isLocalHost || !isProd) && (
      host === "cp.apps.localhost" ||
      host === "cp.localhost" ||
      host.startsWith("cp.apps.localhost") ||
      host.startsWith("cp.localhost") ||
      devSubdomain === "cp"
    ));

  if (isCpAppSubdomain) {
    if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (pathname === "/cp" || pathname === "/cp/") {
      return NextResponse.redirect(new URL(`/${search}`, request.url), 301);
    }

    const isImageOrStatic =
      pathname.includes("opengraph-image") ||
      pathname.includes("twitter-image") ||
      pathname.includes("icon") ||
      pathname.includes("favicon") ||
      pathname.includes("robots.txt") ||
      pathname.includes("sitemap.xml") ||
      pathname.startsWith("/brand");

    const isCpLegalOrDocRoute =
      pathname === "/terms" ||
      pathname === "/privacy" ||
      pathname === "/how-to-use" ||
      pathname === "/aou" ||
      pathname === "/acceptable-use" ||
      pathname === "/uninstalled" ||
      pathname.startsWith("/terms/") ||
      pathname.startsWith("/privacy/") ||
      pathname.startsWith("/how-to-use/") ||
      pathname.startsWith("/aou/") ||
      pathname.startsWith("/acceptable-use/") ||
      pathname.startsWith("/uninstalled/");

    if (
      pathname !== "/" &&
      !isCpLegalOrDocRoute &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/_next") &&
      !isImageOrStatic
    ) {
      return NextResponse.redirect(new URL(`/${search}`, request.url), 302);
    }

    requestHeaders.set("x-is-cp-portal", "true");
    const targetPath =
      pathname === "/"
        ? "/cp"
        : pathname.startsWith("/cp")
        ? pathname
        : `/cp${pathname}`;
    return NextResponse.rewrite(new URL(`${targetPath}${search}`, request.url), {
      request: { headers: requestHeaders },
    });
  }

  // In dev on bare localhost (e.g. localhost:3000), allow direct access to /cp routes
  if (pathname.startsWith("/cp") && isLocalHost && !host.includes(".")) {
    requestHeaders.set("x-is-cp-portal", "true");
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Redirect root domain /cp to pure subdomain (cp.apps.localhost in dev, cp.apps.gauravpatil.site in prod)
  if (pathname.startsWith("/cp")) {
    const cleanPath = pathname.replace(/^\/cp/, "") || "/";
    return getSubdomainRedirect(CP_APP_HOST, "cp.apps.localhost", cleanPath);
  }

  // -------------------------------------------------------------
  // 2. DOWNEX APP PORTAL (downex.apps.gauravpatil.site & downex.gauravpatil.site)
  // -------------------------------------------------------------
  const isDownexAppSubdomain =
    host === DOWNEX_APP_HOST ||
    host === LEGACY_DOWNEX_HOST ||
    host === "downex.gauravpatil.site" ||
    host.endsWith("downex.apps.gauravpatil.site") ||
    host.endsWith("downex.gauravpatil.site") ||
    ((isLocalHost || !isProd) && (
      host === "downex.apps.localhost" ||
      host === "downex.localhost" ||
      host.startsWith("downex.apps.localhost") ||
      host.startsWith("downex.localhost") ||
      host.includes("downex.localhost") ||
      devSubdomain === "downex"
    ));

  if (isDownexAppSubdomain) {
    if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (
      pathname === "/download" ||
      pathname === "/download/" ||
      pathname === "/downex" ||
      pathname === "/downex/"
    ) {
      return NextResponse.redirect(new URL(`/${search}`, request.url), 301);
    }

    const isImageOrStatic =
      pathname.includes("opengraph-image") ||
      pathname.includes("twitter-image") ||
      pathname.includes("icon") ||
      pathname.includes("favicon") ||
      pathname.includes("robots.txt") ||
      pathname.includes("sitemap.xml") ||
      pathname.startsWith("/brand") ||
      pathname.startsWith("/docs");

    const isDownexLegalOrDocRoute =
      pathname === "/terms" ||
      pathname === "/privacy" ||
      pathname === "/policies" ||
      pathname === "/uninstalled" ||
      pathname === "/how-queues-work" ||
      pathname === "/queues" ||
      pathname.startsWith("/terms/") ||
      pathname.startsWith("/privacy/") ||
      pathname.startsWith("/policies/") ||
      pathname.startsWith("/uninstalled/") ||
      pathname.startsWith("/how-queues-work/") ||
      pathname.startsWith("/queues/") ||
      pathname.startsWith("/downex/terms") ||
      pathname.startsWith("/downex/privacy") ||
      pathname.startsWith("/downex/policies") ||
      pathname.startsWith("/downex/uninstalled") ||
      pathname.startsWith("/downex/how-queues-work");

    const isDownexAdminRoute =
      pathname === "/admin" ||
      pathname.startsWith("/admin/") ||
      pathname === "/downex/admin" ||
      pathname.startsWith("/downex/admin/");

    if (
      pathname !== "/" &&
      !isDownexLegalOrDocRoute &&
      !isDownexAdminRoute &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/_next") &&
      !isImageOrStatic
    ) {
      return NextResponse.redirect(new URL(`/${search}`, request.url), 302);
    }

    requestHeaders.set("x-is-download-portal", "true");
    const targetPath =
      pathname === "/"
        ? "/download"
        : isDownexAdminRoute
        ? pathname.startsWith("/downex/admin")
          ? pathname
          : pathname.replace(/^\/admin/, "/downex/admin")
        : pathname.startsWith("/downex/terms") || pathname.startsWith("/downex/privacy") || pathname.startsWith("/downex/policies") || pathname.startsWith("/downex/uninstalled") || pathname.startsWith("/downex/how-queues-work")
        ? pathname
        : pathname === "/terms" || pathname.startsWith("/terms/")
        ? pathname.replace(/^\/terms/, "/downex/terms")
        : pathname === "/privacy" || pathname.startsWith("/privacy/") || pathname === "/policies" || pathname.startsWith("/policies/")
        ? pathname.replace(/^\/(privacy|policies)/, "/downex/privacy")
        : pathname === "/uninstalled"
        ? "/downex/uninstalled"
        : pathname.startsWith("/uninstalled/")
        ? pathname.replace(/^\/uninstalled/, "/downex/uninstalled")
        : pathname === "/how-queues-work" || pathname.startsWith("/how-queues-work/") || pathname === "/queues" || pathname.startsWith("/queues/")
        ? "/downex/how-queues-work"
        : isImageOrStatic
        ? pathname
        : pathname.startsWith("/download")
        ? pathname
        : pathname.startsWith("/downex")
        ? pathname.replace(/^\/downex/, "/download")
        : `/download${pathname}`;
    return NextResponse.rewrite(new URL(`${targetPath}${search}`, request.url), {
      request: { headers: requestHeaders },
    });
  }

  // In dev on bare localhost (e.g. localhost:3000), allow direct access to /downex and /download routes
  if ((pathname.startsWith("/downex") || pathname.startsWith("/download")) && isLocalHost && !host.includes(".")) {
    requestHeaders.set("x-is-download-portal", "true");
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Redirect root domain /download or /downex to pure subdomain (downex.apps.localhost in dev, downex.apps.gauravpatil.site in prod)
  if (pathname.startsWith("/download") || pathname.startsWith("/downex")) {
    const cleanPath = pathname.replace(/^\/(download|downex)/, "") || "/";
    return getSubdomainRedirect(DOWNEX_APP_HOST, "downex.apps.localhost", cleanPath);
  }

  // -------------------------------------------------------------
  // 3. SCHEDULEME APP PORTAL (sm.apps.gauravpatil.site)
  // -------------------------------------------------------------
  const isSmAppSubdomain =
    host === SM_APP_HOST ||
    ((isLocalHost || !isProd) && (
      host === "sm.apps.localhost" ||
      host === "sm.localhost" ||
      host.startsWith("sm.apps.localhost") ||
      host.startsWith("sm.localhost") ||
      devSubdomain === "sm"
    ));

  if (isSmAppSubdomain) {
    if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (pathname === "/sm" || pathname === "/sm/") {
      return NextResponse.redirect(new URL(`/${search}`, request.url), 301);
    }

    const isImageOrStatic =
      pathname.includes("opengraph-image") ||
      pathname.includes("twitter-image") ||
      pathname.includes("icon") ||
      pathname.includes("favicon") ||
      pathname.includes("robots.txt") ||
      pathname.includes("sitemap.xml");

    const isSmLegalOrDocRoute =
      pathname === "/docs" ||
      pathname === "/uninstalled" ||
      pathname === "/how-to-use" ||
      pathname.startsWith("/docs/") ||
      pathname.startsWith("/uninstalled/") ||
      pathname.startsWith("/how-to-use/");

    if (
      pathname !== "/" &&
      !isSmLegalOrDocRoute &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/_next") &&
      !isImageOrStatic
    ) {
      return NextResponse.redirect(new URL(`/${search}`, request.url), 302);
    }

    requestHeaders.set("x-is-sm-portal", "true");
    const targetPath =
      pathname === "/"
        ? "/sm"
        : pathname.startsWith("/sm")
        ? pathname
        : `/sm${pathname}`;
    return NextResponse.rewrite(new URL(`${targetPath}${search}`, request.url), {
      request: { headers: requestHeaders },
    });
  }

  // In dev on bare localhost (e.g. localhost:3000), allow direct access to /sm routes
  if (pathname.startsWith("/sm") && isLocalHost && !host.includes(".")) {
    requestHeaders.set("x-is-sm-portal", "true");
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Redirect root domain /sm to pure subdomain (sm.apps.localhost in dev, sm.apps.gauravpatil.site in prod)
  if (pathname.startsWith("/sm")) {
    const cleanPath = pathname.replace(/^\/sm/, "") || "/";
    return getSubdomainRedirect(SM_APP_HOST, "sm.apps.localhost", cleanPath);
  }

  // -------------------------------------------------------------
  // 4. GPN NOTES APP PORTAL (gpn.apps.gauravpatil.site)
  // -------------------------------------------------------------
  const isGpnAppSubdomain =
    host === GPN_APP_HOST ||
    ((isLocalHost || !isProd) && (
      host === "gpn.apps.localhost" ||
      host === "gpn.localhost" ||
      host.startsWith("gpn.apps.localhost") ||
      host.startsWith("gpn.localhost") ||
      devSubdomain === "gpn"
    ));

  if (isGpnAppSubdomain) {
    if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (pathname === "/gpn" || pathname === "/gpn/") {
      return NextResponse.redirect(new URL(`/${search}`, request.url), 301);
    }

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
      return NextResponse.redirect(new URL(`/${search}`, request.url), 302);
    }

    requestHeaders.set("x-is-gpn-portal", "true");
    const targetPath =
      pathname === "/"
        ? "/gpn"
        : pathname.startsWith("/gpn")
        ? pathname
        : `/gpn${pathname}`;
    return NextResponse.rewrite(new URL(`${targetPath}${search}`, request.url), {
      request: { headers: requestHeaders },
    });
  }

  // Redirect root domain /gpn to pure subdomain (gpn.apps.localhost in dev, gpn.apps.gauravpatil.site in prod)
  if (pathname.startsWith("/gpn")) {
    const cleanPath = pathname.replace(/^\/gpn/, "") || "/";
    return getSubdomainRedirect(GPN_APP_HOST, "gpn.apps.localhost", cleanPath);
  }

  // -------------------------------------------------------------
  // 5. RESUME SERVICE PORTAL (resume.services.gauravpatil.site)
  // -------------------------------------------------------------
  const isResumeServiceSubdomain =
    host === RESUME_SERVICE_HOST ||
    host === LEGACY_RESUME_HOST ||
    ((isLocalHost || !isProd) && (
      host === "resume.services.localhost" ||
      host === "resume.localhost" ||
      host.startsWith("resume.services.localhost") ||
      host.startsWith("resume.localhost") ||
      devSubdomain === "resume"
    ));

  if (isResumeServiceSubdomain) {
    if (pathname === "/resume" || pathname === "/resume/") {
      return NextResponse.redirect(new URL(`/${search}`, request.url), 301);
    }

    const isImageOrStatic =
      pathname.includes("opengraph-image") ||
      pathname.includes("twitter-image") ||
      pathname.includes("icon") ||
      pathname.includes("favicon") ||
      pathname.includes("robots.txt") ||
      pathname.includes("sitemap.xml") ||
      pathname.includes("resume-og.png") ||
      pathname.includes(".pdf");

    if (
      pathname !== "/" &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/_next") &&
      !isImageOrStatic
    ) {
      return NextResponse.redirect(new URL(`/${search}`, request.url), 302);
    }

    requestHeaders.set("x-is-resume-portal", "true");
    const targetPath =
      pathname === "/"
        ? "/resume"
        : pathname.startsWith("/resume")
        ? pathname
        : `/resume${pathname}`;
    return NextResponse.rewrite(new URL(`${targetPath}${search}`, request.url), {
      request: { headers: requestHeaders },
    });
  }

  // Redirect root domain /resume to pure subdomain (resume.services.localhost in dev, resume.services.gauravpatil.site in prod)
  const isResumeAsset = pathname.includes("opengraph-image") || pathname.includes("twitter-image");
  if (pathname.startsWith("/resume") && !isResumeAsset) {
    const cleanPath = pathname.replace(/^\/resume/, "") || "/";
    return getSubdomainRedirect(RESUME_SERVICE_HOST, "resume.services.localhost", cleanPath);
  }

  // -------------------------------------------------------------
  // 6. TALK SERVICE PORTAL (talk.services.gauravpatil.site)
  // -------------------------------------------------------------
  const isTalkServiceSubdomain =
    host === TALK_SERVICE_HOST ||
    host === LEGACY_TALK_HOST ||
    ((isLocalHost || !isProd) && (
      host === "talk.services.localhost" ||
      host === "talk.localhost" ||
      host.startsWith("talk.services.localhost") ||
      host.startsWith("talk.localhost") ||
      devSubdomain === "talk"
    ));

  if (isTalkServiceSubdomain) {
    if (pathname === "/talk" || pathname === "/talk/") {
      return NextResponse.redirect(new URL(`/${search}`, request.url), 301);
    }

    if (pathname === "/talk/login" || pathname === "/talk/login/") {
      return NextResponse.redirect(new URL(`/login${search}`, request.url), 301);
    }

    requestHeaders.set("x-is-talk-portal", "true");

    const talkToken = request.cookies.get(TALK_COOKIE_NAME)?.value;
    const isTalkAuth = talkToken ? await verifyTalkSession(talkToken) : null;
    const isLogin = pathname === "/login";

    if (!isTalkAuth && !isLogin && !pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
      return NextResponse.redirect(new URL(`/login${search}`, request.url));
    }

    if (isTalkAuth && isLogin) {
      return NextResponse.redirect(new URL(`/${search}`, request.url));
    }

    const targetPath =
      pathname === "/"
        ? "/talk"
        : pathname === "/login"
        ? "/talk/login"
        : pathname.startsWith("/talk")
        ? pathname
        : `/talk${pathname}`;

    return NextResponse.rewrite(new URL(`${targetPath}${search}`, request.url), {
      request: { headers: requestHeaders },
    });
  }

  // Redirect root domain /talk to pure subdomain (talk.services.localhost in dev, talk.services.gauravpatil.site in prod)
  if (pathname === "/talk/login" || pathname === "/talk/login/") {
    return getSubdomainRedirect(TALK_SERVICE_HOST, "talk.services.localhost", "/login");
  }
  if (pathname.startsWith("/talk")) {
    const cleanPath = pathname.replace(/^\/talk/, "") || "/";
    return getSubdomainRedirect(TALK_SERVICE_HOST, "talk.services.localhost", cleanPath);
  }

  // -------------------------------------------------------------
  // 7. RECRUITER CONTACT SERVICE PORTAL (contact.services.gauravpatil.site)
  // -------------------------------------------------------------
  const isContactServiceSubdomain =
    host === CONTACT_SERVICE_HOST ||
    host === LEGACY_CONTACT_HOST ||
    ((isLocalHost || !isProd) && (
      host === "contact.services.localhost" ||
      host === "contact.localhost" ||
      host.startsWith("contact.services.localhost") ||
      host.startsWith("contact.localhost") ||
      devSubdomain === "contact"
    ));

  if (isContactServiceSubdomain) {
    if (
      pathname === "/contact-portal" ||
      pathname === "/contact-portal/" ||
      pathname === "/contact" ||
      pathname === "/contact/"
    ) {
      return NextResponse.redirect(new URL(`/${search}`, request.url), 301);
    }

    requestHeaders.set("x-is-contact-portal", "true");
    const targetPath = pathname.startsWith("/contact-portal")
      ? pathname
      : pathname === "/"
      ? "/contact-portal"
      : `/contact-portal${pathname}`;
    return NextResponse.rewrite(new URL(`${targetPath}${search}`, request.url), {
      request: { headers: requestHeaders },
    });
  }

  // Redirect root domain /contact-portal to pure subdomain (contact.services.localhost in dev, contact.services.gauravpatil.site in prod)
  if (pathname.startsWith("/contact-portal")) {
    const cleanPath = pathname.replace(/^\/contact-portal/, "") || "/";
    return getSubdomainRedirect(CONTACT_SERVICE_HOST, "contact.services.localhost", cleanPath);
  }

  // -------------------------------------------------------------
  // 8. Dynamic Admin Gatekeeper Routing (/admin/*)
  // -------------------------------------------------------------
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

    if (isAuthenticated && isOtpRoute) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (isOtpRoute) {
      if (otpChallengeCookie) {
        return NextResponse.next({
          request: { headers: requestHeaders },
        });
      } else {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }

    if (isAuthenticated && pathname === "/admin/login") {
      const isExplicitSignOut = request.nextUrl.searchParams.get("signedOut") === "true";
      if (isExplicitSignOut) {
        const response = NextResponse.next({
          request: { headers: requestHeaders },
        });
        response.cookies.delete(ADMIN_COOKIE_NAME);
        return response;
      }
      return NextResponse.redirect(new URL("/admin", request.url));
    }

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
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass Vercel Edge internals, Web Analytics and Speed Insights beacon endpoints
  if (pathname.startsWith("/_vercel")) {
    return NextResponse.next();
  }

  const host = (request.headers.get("host") || "").toLowerCase().split(":")[0];
  const devSubdomain = request.headers.get("x-dev-subdomain") || "";

  const isContactPortal =
    host === CONTACT_SERVICE_HOST ||
    host === LEGACY_CONTACT_HOST ||
    host.includes("contact.services.localhost") ||
    host.includes("contact.localhost") ||
    devSubdomain === "contact" ||
    pathname.startsWith("/contact-portal");

  const isDownloadPortal =
    host === DOWNEX_APP_HOST ||
    host === LEGACY_DOWNEX_HOST ||
    host.includes("downex.apps.localhost") ||
    host.includes("downex.localhost") ||
    devSubdomain === "downex" ||
    pathname.startsWith("/download") ||
    pathname.startsWith("/downex");

  const isCpPortal =
    host === CP_APP_HOST ||
    host.includes("cp.apps.localhost") ||
    host.includes("cp.localhost") ||
    devSubdomain === "cp" ||
    pathname.startsWith("/cp");

  const isSmPortal =
    host === SM_APP_HOST ||
    host.includes("sm.apps.localhost") ||
    host.includes("sm.localhost") ||
    devSubdomain === "sm" ||
    pathname.startsWith("/sm");

  const isGpnPortal =
    host === GPN_APP_HOST ||
    host.includes("gpn.apps.localhost") ||
    host.includes("gpn.localhost") ||
    devSubdomain === "gpn" ||
    pathname.startsWith("/gpn");

  // -------------------------------------------------------------
  // THEME SYNCHRONIZATION (Single Backend Authority)
  // -------------------------------------------------------------
  const themeQuery = request.nextUrl.searchParams.get("theme");
  const isThemeQueryValid = themeQuery === "light" || themeQuery === "dark";
  const cookieTheme = request.cookies.get(THEME_COOKIE_NAME)?.value;
  const isCookieThemeValid = cookieTheme === "light" || cookieTheme === "dark";

  // Resolve authoritative theme across the whole portfolio:
  // 1. Explicit query parameter (?theme=light|dark)
  // 2. Client cookie
  // 3. Server-side authoritative state (single backend sync)
  let resolvedTheme: "light" | "dark" = "dark";
  if (isThemeQueryValid && themeQuery) {
    resolvedTheme = themeQuery;
    setServerTheme(themeQuery);
  } else if (isCookieThemeValid && cookieTheme) {
    resolvedTheme = cookieTheme;
    setServerTheme(cookieTheme);
  } else {
    resolvedTheme = getServerTheme();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (isContactPortal) {
    requestHeaders.set("x-theme", "light");
    requestHeaders.set("x-is-contact-portal", "true");
  } else {
    requestHeaders.set("x-theme", resolvedTheme);
    if (isDownloadPortal) requestHeaders.set("x-is-download-portal", "true");
    if (isCpPortal) requestHeaders.set("x-is-cp-portal", "true");
    if (isSmPortal) requestHeaders.set("x-is-sm-portal", "true");
    if (isGpnPortal) requestHeaders.set("x-is-gpn-portal", "true");
  }

  const response = await handleRouting(request, requestHeaders);

  // Cross-subdomain theme synchronization across whole portfolio
  if (!isContactPortal) {
    const isLocalHost =
      host.includes("localhost") ||
      host.startsWith("127.0.0.1") ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.startsWith("172.");
    const domain = getSharedCookieDomain(host);
    const isSecure = process.env.NODE_ENV === "production" && !isLocalHost;

    response.cookies.set(THEME_COOKIE_NAME, resolvedTheme, {
      path: "/",
      domain: domain || undefined,
      maxAge: THEME_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: isSecure,
      httpOnly: false,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_vercel|favicon\\.ico|icon\\.png|icon\\.svg|apple-icon\\.png|apple-touch-icon\\.png|og-image\\.png|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|.*\\.(?:jpg|jpeg|gif|png|webp|avif|svg|ico|pdf|mp4|webm|json|woff|woff2|ttf|otf|eot|glb|gltf|mp3|wav|ogg|xml|txt|map)$).*)",
  ],
};
