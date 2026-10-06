export const THEME_COOKIE_NAME = "theme";
export const THEME_COOKIE_MAX_AGE = 31536000; // 365 Days

/**
 * Resolves the shared cookie domain for cross-subdomain interoperability.
 * 
 * Rules:
 * - Production: ".gauravpatil.site" (covers gauravpatil.site and *.gauravpatil.site)
 * - Staging: ".devlabs.eu.cc" (covers devlabs.eu.cc and *.devlabs.eu.cc)
 * - Localhost: Returns undefined (Host-only)
 */
export function getSharedCookieDomain(hostname?: string): string | undefined {
  if (typeof window !== "undefined" && !hostname) {
    hostname = window.location.hostname;
  }
  if (!hostname) return undefined;

  const cleanHost = hostname.toLowerCase().split(":")[0];

  // 1. Production domain and subdomains
  if (cleanHost === "gauravpatil.site" || cleanHost.endsWith(".gauravpatil.site")) {
    return ".gauravpatil.site";
  }

  // 2. Staging domain and subdomains
  if (cleanHost === "devlabs.eu.cc" || cleanHost.endsWith(".devlabs.eu.cc")) {
    return ".devlabs.eu.cc";
  }

  // 3. Localhost / internal IPs
  if (cleanHost === "localhost" || cleanHost.endsWith(".localhost") || cleanHost === "127.0.0.1") {
    return undefined;
  }

  return undefined;
}

/**
 * Clears any host-only theme cookie on the current origin to prevent RFC 6265
 * cookie shadowing of wildcard domain cookies.
 */
export function cleanHostOnlyThemeCookie(): void {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${THEME_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}

/**
 * Synchronously writes the theme cookie to the document.
 * Must be invoked immediately upon user interaction before any navigation.
 */
export function writeThemeCookieSync(theme: "light" | "dark", hostname?: string): void {
  if (typeof document === "undefined") return;

  const domain = getSharedCookieDomain(hostname);
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";

  if (domain) {
    // 1. Kill any existing host-only cookie on the current host to prevent shadowing
    cleanHostOnlyThemeCookie();

    // 2. Set authoritative wildcard domain cookie
    document.cookie = `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; Domain=${domain}; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  } else {
    // Localhost or isolated environment: write host-only cookie
    document.cookie = `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
  }
}

/**
 * Reads and validates the theme cookie from document.cookie.
 * Robust against multiple cookie entries, stale shadowing, and whitespace.
 */
export function readThemeCookieSync(): "light" | "dark" | null {
  if (typeof document === "undefined") return null;

  // On shared domains, clean up host-only cookie if present
  const domain = getSharedCookieDomain();
  if (domain) {
    cleanHostOnlyThemeCookie();
  }

  // Parse all cookies to find the latest valid theme
  const cookies = document.cookie.split(";");
  let resolved: "light" | "dark" | null = null;

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(`${THEME_COOKIE_NAME}=`)) {
      const val = cookie.substring(THEME_COOKIE_NAME.length + 1).trim();
      if (val === "light" || val === "dark") {
        resolved = val;
      }
    }
  }

  return resolved;
}
