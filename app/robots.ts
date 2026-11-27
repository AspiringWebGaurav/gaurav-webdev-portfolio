import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import {
  SUBDOMAIN_ORIGINS,
  resolvePortfolioSubdomainKey,
} from "@/lib/ai/portfolio-ai-data";

export const dynamic = "force-dynamic";

const AI_AND_SEARCH_AGENTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "Googlebot",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
];

function buildRulesForPaths(allow: string[], disallow: string[]): MetadataRoute.Robots["rules"] {
  return [
    ...AI_AND_SEARCH_AGENTS.map((userAgent) => ({
      userAgent,
      allow,
      disallow,
    })),
    {
      userAgent: "*",
      allow,
      disallow,
    },
  ];
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers();
  const rawHost = headerList.get("x-forwarded-host") || headerList.get("host") || "";
  const key = resolvePortfolioSubdomainKey(rawHost);

  if (key === "talk") {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: ["/"],
        },
      ],
      host: SUBDOMAIN_ORIGINS.talk,
    };
  }

  if (key === "downex") {
    return {
      rules: buildRulesForPaths(
        [
          "/",
          "/idm-alternative",
          "/simple-download-manager",
          "/open-source-download-manager",
          "/browser-extension",
          "/how-queues-work",
          "/faq",
          "/terms",
          "/privacy",
          "/llms.txt",
          "/llms-full.txt",
          "/.well-known/llms.txt",
        ],
        ["/admin", "/api", "/uninstalled"]
      ),
      sitemap: `${SUBDOMAIN_ORIGINS.downex}/sitemap.xml`,
      host: SUBDOMAIN_ORIGINS.downex,
    };
  }

  if (key === "cp") {
    return {
      rules: buildRulesForPaths(
        ["/", "/how-to-use", "/terms", "/privacy", "/aou", "/llms.txt", "/llms-full.txt", "/.well-known/llms.txt"],
        ["/admin", "/api", "/uninstalled"]
      ),
      sitemap: `${SUBDOMAIN_ORIGINS.cp}/sitemap.xml`,
      host: SUBDOMAIN_ORIGINS.cp,
    };
  }

  if (key === "sm") {
    return {
      rules: buildRulesForPaths(
        ["/", "/docs", "/llms.txt", "/llms-full.txt", "/.well-known/llms.txt"],
        ["/admin", "/api", "/uninstalled"]
      ),
      sitemap: `${SUBDOMAIN_ORIGINS.sm}/sitemap.xml`,
      host: SUBDOMAIN_ORIGINS.sm,
    };
  }

  if (key !== "root") {
    const origin = SUBDOMAIN_ORIGINS[key];
    return {
      rules: buildRulesForPaths(
        ["/", "/llms.txt", "/llms-full.txt", "/.well-known/llms.txt"],
        ["/admin", "/api", "/wa", "/chat/room"]
      ),
      sitemap: `${origin}/sitemap.xml`,
      host: origin,
    };
  }

  return {
    rules: buildRulesForPaths(
      [
        "/",
        "/apps",
        "/services",
        "/projects",
        "/blog",
        "/privacy",
        "/terms",
        "/security",
        "/accessibility",
        "/chat",
        "/contact-portal",
        "/llms.txt",
        "/llms-full.txt",
        "/.well-known/llms.txt",
      ],
      ["/admin", "/api", "/wa", "/chat/room", "/talk"]
    ),
    sitemap: `${SUBDOMAIN_ORIGINS.root}/sitemap.xml`,
    host: SUBDOMAIN_ORIGINS.root,
  };
}
