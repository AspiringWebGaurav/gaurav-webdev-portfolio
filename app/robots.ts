import type { MetadataRoute } from "next";

export const revalidate = 86400;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/projects", "/blog", "/privacy", "/terms", "/security", "/accessibility", "/chat"],
        disallow: ["/admin", "/api", "/wa", "/chat/room"],
      },
    ],
    sitemap: "https://gauravpatil.site/sitemap.xml",
    host: "https://gauravpatil.site",
  };
}
