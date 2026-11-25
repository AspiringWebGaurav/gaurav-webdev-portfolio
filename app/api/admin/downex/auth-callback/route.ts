import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin/auth";
import {
  DOWNEX_ADMIN_COOKIE_NAME,
  DOWNEX_SESSION_MAX_AGE_SECONDS,
} from "@/lib/admin/constants";
import { getSharedCookieDomain } from "@/lib/theme/cookie";

export const dynamic = "force-dynamic";

/**
 * Origin-specific session handoff endpoint for Downex Admin.
 * Sets the downex_admin_session cookie directly on the destination origin
 * (e.g. downex.localhost:3000 or downex.apps.gauravpatil.site) so cross-origin
 * local development and partitioned cookies work seamlessly without domain mismatches.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const returnTo = searchParams.get("returnTo") || "/admin";

  const rawHost = request.headers.get("host") || "localhost:3000";
  const host = rawHost.toLowerCase().split(":")[0];
  const isLocalHost =
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.");

  const destinationUrl = new URL(returnTo, request.url);

  if (!token) {
    return NextResponse.redirect(destinationUrl);
  }

  // Cryptographically verify session token integrity
  const verified = await verifyAdminSession(token);
  if (!verified) {
    destinationUrl.searchParams.set("error", "invalid_session_token");
    return NextResponse.redirect(destinationUrl);
  }

  // Attach auth_token to destination URL so client-side localStorage can immediately persist it
  destinationUrl.searchParams.set("auth_token", token);

  const isSecure = process.env.NODE_ENV === "production" && !isLocalHost;
  const cookieDomain = getSharedCookieDomain(host);

  const response = NextResponse.redirect(destinationUrl);
  const cookieOpts: {
    name: string;
    value: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    domain?: string;
    maxAge: number;
    path: string;
  } = {
    name: DOWNEX_ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    maxAge: DOWNEX_SESSION_MAX_AGE_SECONDS,
    path: "/",
  };
  if (cookieDomain) {
    cookieOpts.domain = cookieDomain;
  }
  response.cookies.set(cookieOpts);

  return response;
}
