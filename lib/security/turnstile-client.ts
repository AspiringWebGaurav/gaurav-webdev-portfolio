/**
 * Cloudflare Turnstile Client Helper
 * Provides domain-aware site key resolution and local development compatibility.
 * Prevents "Unable to connect to website. Troubleshoot" (error 110200) on *.localhost.
 */

// Cloudflare official dummy testing keys (guaranteed to work on any localhost / *.localhost domain)
export const CLOUDFLARE_TEST_SITE_KEY_PASS = "1x00000000000000000000AA"; // Always passes
export const CLOUDFLARE_TEST_SITE_KEY_INTERACTIVE = "3x00000000000000000000FF"; // Forces interactive checkbox

export const DEFAULT_PRODUCTION_TURNSTILE_KEY = "0x4AAAAAAGC9IJm9wk-xm7O2";

export function isLocalhost(): boolean {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "development";
  }
  const hostname = window.location.hostname.toLowerCase();
  // Production portfolio and all registered subdomains strictly use live production keys
  if (hostname === "gauravpatil.site" || hostname.endsWith(".gauravpatil.site")) {
    return false;
  }
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  );
}

/**
 * Returns the appropriate Turnstile site key.
 * On local / *.localhost development environments, Cloudflare's official testing key
 * is used to prevent hostname authorization mismatches. In production, the configured key is used.
 */
export function getTurnstileSiteKey(configuredKey?: string | null): string {
  if (isLocalhost()) {
    return CLOUDFLARE_TEST_SITE_KEY_PASS;
  }
  return configuredKey || DEFAULT_PRODUCTION_TURNSTILE_KEY;
}
