import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { isAuthorizedAdminEmail } from "@/lib/admin/auth";
import { fetchWithTimeout } from "@/lib/api/fetcher";
import { extractClientIp } from "@/lib/admin/services/ip-security.service";
import { otpService } from "@/lib/admin/services/otp.service";
import { rtdbDataSource } from "@/lib/admin/datasource/rtdb";
import { dispatchDownexAdminOtpEmail } from "@/lib/email/downex-otp";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_OTP_COOKIE_NAME,
  OTP_TTL_SECONDS,
} from "@/lib/admin/constants";
import { getSharedCookieDomain } from "@/lib/theme/cookie";

export const dynamic = "force-dynamic";

/**
 * Handles Google OAuth 2.0 PKCE Callback, verifies email authorization,
 * and sets session or redirects with unauthorized notice.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  const rawHost = request.headers.get("host") || "localhost:3000";
  const host = rawHost.toLowerCase().split(":")[0];
  const isLocalHost =
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.");

  const protocol =
    request.headers.get("x-forwarded-proto") ||
    (isLocalHost ? "http" : "https");
  const baseUrl = `${protocol}://${rawHost}`;

  // Canonical Google OAuth Authorized Redirect URI:
  // Must strictly match the URI registered in Google Cloud Console.
  const redirectUri = isLocalHost
    ? "http://localhost:3000/api/admin/auth/callback"
    : "https://gauravpatil.site/api/admin/auth/callback";

  // Pre-parse state parameter early to identify target context and preserved PKCE verifier
  const stateParam = searchParams.get("state");
  let statePayload: { target?: string; returnTo?: string; codeVerifier?: string; nonce?: string } | null = null;
  if (stateParam) {
    try {
      statePayload = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf8"));
    } catch {
      // Fallback to cookie
    }
  }

  const isDownexTarget =
    statePayload?.target === "downex" ||
    statePayload?.returnTo?.includes("downex") ||
    request.cookies.get("oauth_return_to")?.value?.includes("downex") ||
    false;

  const returnTo =
    statePayload?.returnTo ||
    request.cookies.get("oauth_return_to")?.value ||
    (isDownexTarget
      ? (isLocalHost ? "http://downex.localhost:3000/admin" : "https://downex.apps.gauravpatil.site/admin")
      : (isLocalHost ? "/admin" : "https://gauravpatil.site/admin"));

  // If user cancelled on Google screen or denied access
  if (errorParam || !code) {
    if (isDownexTarget) {
      const destUrl = new URL(returnTo.startsWith("http") ? returnTo : `http://localhost:3000${returnTo}`);
      destUrl.searchParams.set("cancelled", "true");
      const resp = NextResponse.redirect(destUrl);
      resp.cookies.delete("oauth_code_verifier");
      resp.cookies.delete("oauth_return_to");
      return resp;
    }
    const response = NextResponse.redirect(
      new URL("/admin/login?cancelled=true", baseUrl)
    );
    response.cookies.delete("oauth_code_verifier");
    response.cookies.delete("oauth_return_to");
    return response;
  }

  // Retrieve code verifier from state (subdomain-safe) or cookie
  const codeVerifier =
    statePayload?.codeVerifier ||
    request.cookies.get("oauth_code_verifier")?.value ||
    "";
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    "";

  try {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

    // Exchange PKCE authorization code for Google access token & ID token (4.0s timeout)
    const tokenRequestBody: Record<string, string> = {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: codeVerifier || "",
    };

    const tokenResponse = await fetchWithTimeout(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(tokenRequestBody),
      },
      4000
    );

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || "Failed to exchange OAuth token with Google.");
    }

    let email: string | undefined = undefined;
    let avatar: string | undefined = undefined;
    let name: string | undefined = undefined;

    // Fast-path: Extract verified identity directly from Google's signed ID token JWT payload (< 0.1ms)
    if (tokenData.id_token && typeof tokenData.id_token === "string") {
      try {
        const parts = tokenData.id_token.split(".");
        if (parts.length >= 2) {
          const payloadJson = Buffer.from(parts[1], "base64url").toString("utf8");
          const payload = JSON.parse(payloadJson);
          if (payload?.email && typeof payload.email === "string") {
            email = payload.email;
            avatar = typeof payload.picture === "string" ? payload.picture : undefined;
            name = typeof payload.name === "string" ? payload.name : undefined;
          }
        }
      } catch {
        // Fallback to userinfo endpoint below
      }
    }

    // Fallback: Query Google userinfo endpoint if id_token was absent or could not be parsed
    if (!email) {
      const userinfoResponse = await fetchWithTimeout(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        },
        3000
      );

      const profile = await userinfoResponse.json();
      email = profile?.email;
      avatar = profile?.picture;
      name = profile?.name;
    }

    if (!email) {
      throw new Error("No verified email received from Google profile.");
    }

    const isSecure = process.env.NODE_ENV === "production" && !isLocalHost;
    const cookieDomain = getSharedCookieDomain(host);

    // Strict Authorization Check: Only authorized admin identity is permitted
    if (!isAuthorizedAdminEmail(email)) {
      if (isDownexTarget) {
        const destUrl = new URL(returnTo.startsWith("http") ? returnTo : `http://localhost:3000${returnTo}`);
        destUrl.searchParams.set("unauthorized", "true");
        const resp = NextResponse.redirect(destUrl);
        resp.cookies.delete("oauth_code_verifier");
        resp.cookies.delete("oauth_return_to");
        return resp;
      }

      const unauthorizedDest = isLocalHost
        ? "http://localhost:3000/admin/login?unauthorized=true"
        : "https://gauravpatil.site/admin/login?unauthorized=true";

      const response = NextResponse.redirect(new URL(unauthorizedDest));
      response.cookies.delete("oauth_code_verifier");
      response.cookies.delete("oauth_return_to");
      return response;
    }

    // Downex Admin: Authenticate Google identity, then dispatch dedicated 6-digit OTP challenge
    if (isDownexTarget) {
      const clientIp = extractClientIp(request.headers);
      const userAgent = request.headers.get("user-agent") || undefined;

      const rawOtp = crypto.randomInt(100000, 1000000).toString();
      const salt = crypto.randomBytes(16).toString("hex");
      const otpHash = crypto
        .createHmac(
          "sha256",
          process.env.ADMIN_OTP_SECRET ||
          process.env.ADMIN_SESSION_SECRET ||
          process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
          "downex_admin_otp_secret_key_2026"
        )
        .update(`${rawOtp.trim()}_${salt.trim()}`)
        .digest("hex");
      const now = Date.now();
      const expiresAt = now + 5 * 60 * 1000; // 5 minutes
      const challengeId = `dwnx_ch_${crypto.randomUUID()}`;

      const challengePayload = {
        challengeId,
        email,
        name: name || "Gaurav Patil",
        avatar,
        otpHash,
        salt,
        attempts: 0,
        createdAt: now,
        expiresAt,
        isConsumed: false,
        clientIp,
      };

      // Store challenge in Firebase RTDB
      await rtdbDataSource.setValue(
        `ecosystem/apps/downex/auth_challenges/${challengeId}`,
        challengePayload
      );

      // Dispatch custom Downex verification email
      await dispatchDownexAdminOtpEmail({
        email,
        otp: rawOtp,
        clientIp,
        userAgent,
        expiresMinutes: 5,
      });

      // Mask email for UI display (e.g., ga••••@gmail.com)
      const [local, domainPart] = email.split("@");
      const visible = local.length > 2 ? local.substring(0, 2) : local.substring(0, 1);
      const maskedEmail = `${visible}••••@${domainPart}`;

      // Redirect user to Downex Admin OTP view with challenge context
      const returnUrlObj = new URL(returnTo.startsWith("http") ? returnTo : `http://${rawHost}${returnTo}`);
      returnUrlObj.searchParams.set("step", "otp");
      returnUrlObj.searchParams.set("challenge_id", challengeId);
      returnUrlObj.searchParams.set("masked_email", maskedEmail);
      returnUrlObj.searchParams.set("email", email);

      const response = NextResponse.redirect(returnUrlObj);
      response.cookies.delete("oauth_code_verifier");
      response.cookies.delete("oauth_return_to");
      return response;
    }

    // Authorized Identity for Portfolio Superadmin: Extract deployment-authoritative client IP
    const clientIp = extractClientIp(request.headers);
    const userAgent = request.headers.get("user-agent") || undefined;

    // Create and dispatch 6-digit OTP challenge for portfolio superadmin
    const { challengeId } = await otpService.createOtpChallenge({
      email,
      name: name || "Gaurav Patil",
      avatar,
      clientIp,
      userAgent,
      requestHeaders: request.headers,
    });

    // Set secure httpOnly OTP challenge cookie and redirect to /admin/otp
    const response = NextResponse.redirect(new URL("/admin/otp", baseUrl));

    response.cookies.set({
      name: ADMIN_OTP_COOKIE_NAME,
      value: challengeId,
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      domain: cookieDomain,
      maxAge: OTP_TTL_SECONDS,
      path: "/",
    });

    // CRITICAL: Delete any prior session cookie so user MUST complete OTP verification
    response.cookies.delete(ADMIN_COOKIE_NAME);
    response.cookies.delete("oauth_code_verifier");
    response.cookies.delete("oauth_return_to");
    return response;
  } catch (err: unknown) {
    const error = err as Error;
    if (isDownexTarget) {
      const destUrl = new URL(returnTo.startsWith("http") ? returnTo : `http://localhost:3000${returnTo}`);
      destUrl.searchParams.set("error", error.message || "Failed to complete Google authentication.");
      const response = NextResponse.redirect(destUrl);
      response.cookies.delete("oauth_code_verifier");
      response.cookies.delete("oauth_return_to");
      return response;
    }
    const redirectUrl = new URL(
      `/admin/login?error=${encodeURIComponent(
        error.message || "Failed to complete Google authentication."
      )}`,
      baseUrl
    );
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete("oauth_code_verifier");
    response.cookies.delete("oauth_return_to");
    return response;
  }
}

