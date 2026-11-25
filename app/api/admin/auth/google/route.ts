import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * Initiates Direct Google OAuth 2.0 PKCE Authentication (Zero Popups)
 * Displays the dynamic list of available Google accounts for the user to choose from.
 */
export async function GET(request: NextRequest) {
  try {
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      process.env.GOOGLE_CLIENT_ID ||
      "";

    const rawHost = request.headers.get("host") || "localhost:3000";
    const host = rawHost.toLowerCase().split(":")[0];
    const isLocalHost =
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.");

    // Canonical Google OAuth Authorized Redirect URI:
    // Google Cloud Console strictly whitelists canonical domains (never arbitrary subdomains).
    // Local dev: http://localhost:3000/api/admin/auth/callback
    // Production: https://gauravpatil.site/api/admin/auth/callback
    const redirectUri = isLocalHost
      ? "http://localhost:3000/api/admin/auth/callback"
      : "https://gauravpatil.site/api/admin/auth/callback";

    // Resolve returnTo destination
    const paramReturnTo = request.nextUrl.searchParams.get("returnTo");
    const referer = request.headers.get("referer") || "";
    let returnTo = paramReturnTo || "";

    const isLegacyDownexDomain =
      host === "downex.gauravpatil.site" ||
      referer.includes("downex.gauravpatil.site") ||
      returnTo.includes("downex.gauravpatil.site");

    if (!returnTo) {
      if (referer.includes("downex") || host.includes("downex")) {
        returnTo = isLocalHost
          ? "http://downex.localhost:3000/admin"
          : isLegacyDownexDomain
          ? "https://downex.gauravpatil.site/admin"
          : "https://downex.apps.gauravpatil.site/admin";
      } else {
        returnTo = isLocalHost ? "/admin" : "https://gauravpatil.site/admin";
      }
    } else if (!returnTo.startsWith("http")) {
      if (!isLocalHost && (host.includes("downex") || returnTo.includes("downex"))) {
        const canonicalDownexHost = isLegacyDownexDomain
          ? "https://downex.gauravpatil.site"
          : "https://downex.apps.gauravpatil.site";
        returnTo = `${canonicalDownexHost}${returnTo.startsWith("/") ? returnTo : `/${returnTo}`}`;
      } else if (isLocalHost && (host.includes("downex") || returnTo.includes("downex"))) {
        returnTo = `http://downex.localhost:3000${returnTo.startsWith("/") ? returnTo : `/${returnTo}`}`;
      } else {
        const protocol = isLocalHost ? "http" : "https";
        returnTo = `${protocol}://${rawHost}${returnTo.startsWith("/") ? returnTo : `/${returnTo}`}`;
      }
    }

    const paramTarget = request.nextUrl.searchParams.get("target");
    const isDownexTarget = paramTarget === "downex" || returnTo.includes("downex") || host.includes("downex") || referer.includes("downex");
    const target = isDownexTarget ? "downex" : "portfolio";

    // Generate PKCE code verifier and code challenge (RFC 7636)
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    // Encode state with target, nonce, returnTo destination, and codeVerifier
    // (This guarantees seamless PKCE across cross-subdomain boundaries without cookie dependency)
    const statePayload = {
      target,
      nonce: crypto.randomBytes(16).toString("hex"),
      returnTo,
      codeVerifier,
    };
    const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url");

    // prompt=select_account forces Google to show all available accounts on the device
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    const response = NextResponse.redirect(googleAuthUrl);

    // Save code_verifier and returnTo in secure short-lived cookies for verification in callback
    const isSecure = process.env.NODE_ENV === "production";
    response.cookies.set({
      name: "oauth_code_verifier",
      value: codeVerifier,
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });
    response.cookies.set({
      name: "oauth_return_to",
      value: returnTo,
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });

    // Proactively clear only the relevant session cookie based on target
    if (target === "downex") {
      response.cookies.delete("downex_admin_session");
    } else {
      response.cookies.delete("admin_session");
      response.cookies.delete("admin_otp_challenge");
    }

    return response;
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initiate Google OAuth" },
      { status: 500 }
    );
  }
}
