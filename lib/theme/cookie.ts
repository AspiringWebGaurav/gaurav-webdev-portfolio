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
 * Synchronously writes the theme cookie to the document.
 * Must be invoked immediately upon user interaction before any navigation.
 */
export function writeThemeCookieSync(theme: "light" | "dark", hostname?: string): void {
  if (typeof document === "undefined") return;

  const domain = getSharedCookieDomain(hostname);
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  
  let cookieString = `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
  if (domain) {
    cookieString += `; Domain=${domain}`;
  }
  if (isSecure) {
    cookieString += `; Secure`;
  }

  document.cookie = cookieString;

  // Local development fallback: On localhost, if domain was omitted, also write
  // explicitly for the current host to ensure immediate availability.
  if (!domain && typeof window !== "undefined") {
    document.cookie = `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
  }
}

/**
 * Reads and validates the theme cookie from document.cookie.
 */
export function readThemeCookieSync(): "light" | "dark" | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${THEME_COOKIE_NAME}=(light|dark)(?:;|$)`));
  return match ? (match[1] as "light" | "dark") : null;
}
