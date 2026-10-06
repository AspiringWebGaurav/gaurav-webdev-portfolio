/**
 * Cross-Subdomain Navigation & Theme State Bridge
 * 
 * Centralizes URL resolution across all participating ecosystem subdomains:
 * - gauravpatil.site (Flagship Portfolio)
 * - resume.gauravpatil.site (Verified Resume Portal)
 * - contact.gauravpatil.site (Recruiter Portal)
 * - self.gauravpatil.site (Launchpad)
 * - talk.gauravpatil.site (Talk Command Hub)
 * - admin.gauravpatil.site (Admin CMS)
 * 
 * Features:
 * 1. Synchronously propagates theme state (?theme=light|dark) for zero-flash tab opening.
 * 2. Adapts production URLs to localhost subdomains during local development (e.g. resume.localhost:3000).
 * 3. Preserves query parameters and hash anchors.
 */

export function getSubdomainUrl(
  rawUrl: string,
  currentTheme?: "light" | "dark" | string,
  currentHostname?: string
): string {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;

  const activeTheme = currentTheme === "light" ? "light" : currentTheme === "dark" ? "dark" : undefined;
  const hostname =
    currentHostname ||
    (typeof window !== "undefined" ? window.location.hostname : undefined) ||
    "";
  const port =
    (typeof window !== "undefined" && window.location.port)
      ? `:${window.location.port}`
      : ":3000";

  const isLocal =
    hostname.includes("localhost") ||
    hostname.startsWith("127.0.0.1") ||
    process.env.NODE_ENV === "development";

  try {
    // Handle relative paths (e.g. /resume)
    if (rawUrl.startsWith("/")) {
      if (isLocal) {
        if (rawUrl.startsWith("/resume")) {
          const path = rawUrl.replace(/^\/resume/, "") || "/";
          const url = new URL(`http://resume.localhost${port}${path}`);
          if (activeTheme) url.searchParams.set("theme", activeTheme);
          return url.toString();
        }
        if (rawUrl.startsWith("/contact-portal")) {
          const path = rawUrl.replace(/^\/contact-portal/, "") || "/";
          const url = new URL(`http://contact.localhost${port}${path}`);
          if (activeTheme) url.searchParams.set("theme", activeTheme);
          return url.toString();
        }
      }
      const url = new URL(rawUrl, "https://gauravpatil.site");
      if (activeTheme) url.searchParams.set("theme", activeTheme);
      return `${url.pathname}${url.search}${url.hash}`;
    }

    // Absolute URLs
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();

    // Map production subdomains to localhost if in local development
    if (isLocal) {
      if (host === "resume.gauravpatil.site") {
        url.protocol = "http:";
        url.host = `resume.localhost${port}`;
      } else if (host === "contact.gauravpatil.site") {
        url.protocol = "http:";
        url.host = `contact.localhost${port}`;
      } else if (host === "self.gauravpatil.site") {
        url.protocol = "http:";
        url.host = `self.localhost${port}`;
      } else if (host === "talk.gauravpatil.site") {
        url.protocol = "http:";
        url.host = `talk.localhost${port}`;
      } else if (host === "gauravpatil.site" || host === "www.gauravpatil.site") {
        url.protocol = "http:";
        url.host = `localhost${port}`;
      }
    }

    // Append theme parameter for ecosystem domains
    const targetHost = url.hostname.toLowerCase();
    const isEcosystemHost =
      targetHost === "gauravpatil.site" ||
      targetHost.endsWith(".gauravpatil.site") ||
      targetHost === "devlabs.eu.cc" ||
      targetHost.endsWith(".devlabs.eu.cc") ||
      targetHost.includes("localhost") ||
      targetHost === "127.0.0.1";

    if (isEcosystemHost && activeTheme) {
      url.searchParams.set("theme", activeTheme);
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}
