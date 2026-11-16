/**
 * Cross-Subdomain Navigation & Theme State Bridge
 * 
 * Centralizes URL resolution across all participating ecosystem subdomains:
 * - gauravpatil.site (Flagship Portfolio)
 * - apps.gauravpatil.site (Apps Hub)
 *   - cp.apps.gauravpatil.site (CP Engine)
 *   - downex.apps.gauravpatil.site (Downex)
 *   - sm.apps.gauravpatil.site (ScheduleMe)
 *   - gpn.apps.gauravpatil.site (GPN Personal Notes)
 * - services.gauravpatil.site (Services Hub)
 *   - resume.services.gauravpatil.site (Verified Resume Portal)
 *   - talk.services.gauravpatil.site (Talk Command Hub)
 *   - contact.services.gauravpatil.site (Recruiter Portal)
 * 
 * Features:
 * 1. Synchronously propagates theme state (?theme=light|dark) for zero-flash tab opening.
 * 2. Adapts production URLs to localhost subdomains during local development (e.g. apps.localhost:3000).
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
    // Handle relative paths (e.g. /resume, /apps, /)
    if (rawUrl.startsWith("/")) {
      if (isLocal) {
        if (rawUrl === "/" || rawUrl === "") {
          const url = new URL(`http://localhost${port}/`);
          if (activeTheme) url.searchParams.set("theme", activeTheme);
          return url.toString();
        }
        if (rawUrl.startsWith("/resume")) {
          const path = rawUrl.replace(/^\/resume/, "") || "/";
          const url = new URL(`http://resume.services.localhost${port}${path}`);
          if (activeTheme) url.searchParams.set("theme", activeTheme);
          return url.toString();
        }
        if (rawUrl.startsWith("/contact-portal")) {
          const path = rawUrl.replace(/^\/contact-portal/, "") || "/";
          const url = new URL(`http://contact.services.localhost${port}${path}`);
          url.searchParams.delete("theme");
          return url.toString();
        }
        if (rawUrl.startsWith("/talk")) {
          const path = rawUrl.replace(/^\/talk/, "") || "/";
          const url = new URL(`http://talk.services.localhost${port}${path}`);
          if (activeTheme) url.searchParams.set("theme", activeTheme);
          return url.toString();
        }
        if (rawUrl.startsWith("/apps")) {
          const path = rawUrl.replace(/^\/apps/, "") || "/";
          const url = new URL(`http://apps.localhost${port}${path}`);
          if (activeTheme) url.searchParams.set("theme", activeTheme);
          return url.toString();
        }
        if (rawUrl.startsWith("/services")) {
          const path = rawUrl.replace(/^\/services/, "") || "/";
          const url = new URL(`http://services.localhost${port}${path}`);
          if (activeTheme) url.searchParams.set("theme", activeTheme);
          return url.toString();
        }
        if (rawUrl.startsWith("/cp")) {
          const path = rawUrl.replace(/^\/cp/, "") || "/";
          const url = new URL(`http://cp.apps.localhost${port}${path}`);
          if (activeTheme) url.searchParams.set("theme", activeTheme);
          return url.toString();
        }
        if (rawUrl.startsWith("/download") || rawUrl.startsWith("/downex")) {
          const path = rawUrl.replace(/^\/(download|downex)/, "") || "/";
          const url = new URL(`http://downex.apps.localhost${port}${path}`);
          if (activeTheme) url.searchParams.set("theme", activeTheme);
          return url.toString();
        }
        if (rawUrl.startsWith("/sm")) {
          const path = rawUrl.replace(/^\/sm/, "") || "/";
          const url = new URL(`http://sm.apps.localhost${port}${path}`);
          if (activeTheme) url.searchParams.set("theme", activeTheme);
          return url.toString();
        }
        if (rawUrl.startsWith("/gpn")) {
          const path = rawUrl.replace(/^\/gpn/, "") || "/";
          const url = new URL(`http://gpn.apps.localhost${port}${path}`);
          if (activeTheme) url.searchParams.set("theme", activeTheme);
          return url.toString();
        }
      }
      if (rawUrl === "/" || rawUrl === "") {
        const url = new URL("https://gauravpatil.site/");
        if (activeTheme) url.searchParams.set("theme", activeTheme);
        return url.toString();
      }
      const url = new URL(rawUrl, "https://gauravpatil.site");
      if (rawUrl.startsWith("/contact-portal")) {
        url.searchParams.delete("theme");
        return `${url.pathname}${url.search}${url.hash}`;
      }
      if (activeTheme) url.searchParams.set("theme", activeTheme);
      return `${url.pathname}${url.search}${url.hash}`;
    }

    // Absolute URLs
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();

    // Map production subdomains to localhost if in local development
    if (isLocal) {
      if (host === "resume.services.gauravpatil.site" || host === "resume.gauravpatil.site") {
        url.protocol = "http:";
        url.host = `resume.services.localhost${port}`;
      } else if (host === "talk.services.gauravpatil.site" || host === "talk.gauravpatil.site") {
        url.protocol = "http:";
        url.host = `talk.services.localhost${port}`;
      } else if (host === "contact.services.gauravpatil.site" || host === "contact.gauravpatil.site") {
        url.protocol = "http:";
        url.host = `contact.services.localhost${port}`;
      } else if (host === "apps.gauravpatil.site" || host === "self.gauravpatil.site") {
        url.protocol = "http:";
        url.host = `apps.localhost${port}`;
      } else if (host === "services.gauravpatil.site") {
        url.protocol = "http:";
        url.host = `services.localhost${port}`;
      } else if (host === "cp.apps.gauravpatil.site") {
        url.protocol = "http:";
        url.host = `cp.apps.localhost${port}`;
      } else if (host === "downex.apps.gauravpatil.site" || host === "downex.gauravpatil.site") {
        url.protocol = "http:";
        url.host = `downex.apps.localhost${port}`;
      } else if (host === "sm.apps.gauravpatil.site") {
        url.protocol = "http:";
        url.host = `sm.apps.localhost${port}`;
      } else if (host === "gpn.apps.gauravpatil.site") {
        url.protocol = "http:";
        url.host = `gpn.apps.localhost${port}`;
      } else if (host === "gauravpatil.site" || host === "www.gauravpatil.site") {
        url.protocol = "http:";
        url.host = `localhost${port}`;
      }
    }

    // Recruiter Portal operates strictly in pure light theme for HR - exclude from ?theme sync
    const targetHost = url.hostname.toLowerCase();
    const isContactPortalHost =
      targetHost === "contact.services.gauravpatil.site" ||
      targetHost === "contact.gauravpatil.site" ||
      targetHost.startsWith("contact.services.localhost") ||
      targetHost.startsWith("contact.localhost");

    if (isContactPortalHost) {
      url.searchParams.delete("theme");
      return url.toString();
    }

    // Append theme parameter for ecosystem domains
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
