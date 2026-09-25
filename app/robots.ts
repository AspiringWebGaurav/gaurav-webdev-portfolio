import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/projects", "/privacy", "/terms", "/security", "/accessibility", "/chat"],
        disallow: ["/admin", "/api", "/wa", "/chat/room"],
      },
    ],
    sitemap: "https://gauravjpatil.com/sitemap.xml",
    host: "https://gauravjpatil.com",
  };
}
