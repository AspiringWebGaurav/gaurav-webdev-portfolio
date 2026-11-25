import { NextRequest, NextResponse } from "next/server";
import {
  getVerifiedAdminFromRequest,
  createAdminSessionPayload,
  signAdminSession,
} from "@/lib/admin/auth";
import {
  DOWNEX_ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_NAME,
  DOWNEX_SESSION_MAX_AGE_SECONDS,
} from "@/lib/admin/constants";
import { getSharedCookieDomain } from "@/lib/theme/cookie";

export const dynamic = "force-dynamic";

/**
 * Downex Admin Session Verification & Sliding Window Refresh
 * Implements GPHost 30-day persistent session practices:
 * Keeps the admin permanently logged in until they explicitly click 'Sign Out'.
 */
export async function GET(request: NextRequest) {
  const rawHost = request.headers.get("host") || "localhost:3000";
  const host = rawHost.toLowerCase().split(":")[0];
  const isLocalHost =
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.");

  const { session, token } = await getVerifiedAdminFromRequest(request);

  if (!session || !token) {
    return NextResponse.json({ authenticated: false, session: null }, { status: 401 });
  }

  // Refresh 30-day sliding cookie window
  const isSecure = process.env.NODE_ENV === "production" && !isLocalHost;
  const cookieDomain = getSharedCookieDomain(host);

  const response = NextResponse.json({
    authenticated: true,
    session,
    token,
  });

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

export async function POST(request: NextRequest) {
  try {
    const rawHost = request.headers.get("host") || "localhost:3000";
    const host = rawHost.toLowerCase().split(":")[0];
    const isLocalHost =
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.");

    const body = await request.json().catch(() => ({}));
    const email = body.email;

    // Validate email
    if (!email || (email !== "gauravpatil9262@gmail.com" && email !== "gauravpatil5737@gmail.com")) {
      return NextResponse.json({ error: "Unauthorized email identity" }, { status: 401 });
    }

    const sessionPayload = createAdminSessionPayload(email);
    const signedToken = await signAdminSession(sessionPayload);

    const isSecure = process.env.NODE_ENV === "production" && !isLocalHost;
    const cookieDomain = getSharedCookieDomain(host);

    const response = NextResponse.json({
      authenticated: true,
      session: sessionPayload,
      token: signedToken,
    });

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
      value: signedToken,
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Session error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const rawHost = request.headers.get("host") || "";
  const host = rawHost.toLowerCase().split(":")[0];
  const cookieDomain = getSharedCookieDomain(host);

  const response = NextResponse.json({ success: true, message: "Logged out." });
  response.cookies.delete(DOWNEX_ADMIN_COOKIE_NAME);
  response.cookies.delete(ADMIN_COOKIE_NAME);

  const cookieNames = [DOWNEX_ADMIN_COOKIE_NAME, ADMIN_COOKIE_NAME];
  for (const name of cookieNames) {
    const clearOpts: { name: string; value: string; maxAge: number; path: string; domain?: string } = {
      name,
      value: "",
      maxAge: 0,
      path: "/",
    };
    if (cookieDomain) clearOpts.domain = cookieDomain;
    response.cookies.set(clearOpts);
  }

  return response;
}
