import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function isDownexSubdomainHost(rawHost: string): boolean {
  const host = rawHost.toLowerCase().split(":")[0];
  return (
    host === "downex.apps.gauravpatil.site" ||
    host === "downex.gauravpatil.site" ||
    host.startsWith("downex.apps.localhost") ||
    host.startsWith("downex.localhost")
  );
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers();
  const rawHost = headerList.get("x-forwarded-host") || headerList.get("host") || "";

  if (isDownexSubdomainHost(rawHost)) {
    return {
      rules: [
        {
          userAgent: "*",
          allow: ["/"],
          disallow: ["/admin", "/api", "/uninstalled"],
        },
      ],
      sitemap: "https://downex.apps.gauravpatil.site/sitemap.xml",
      host: "https://downex.apps.gauravpatil.site",
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/apps", "/services", "/projects", "/blog", "/privacy", "/terms", "/security", "/accessibility", "/chat", "/contact-portal"],
        disallow: ["/admin", "/api", "/wa", "/chat/room", "/talk"],
      },
    ],
    sitemap: "https://gauravpatil.site/sitemap.xml",
    host: "https://gauravpatil.site",
  };
}
