import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { PROJECT_CASE_STUDIES } from "@/lib/data/case-studies";
import { DOWNEX_ORIGIN, DOWNEX_SITEMAP_URLS } from "@/lib/data/downex-seo";
import { seoRepository } from "@/lib/dal/repositories/cms/seo.repository";
import { projectsRepository } from "@/lib/dal/repositories/cms/projects.repository";
import {
  SUBDOMAIN_ORIGINS,
  resolvePortfolioSubdomainKey,
} from "@/lib/ai/portfolio-ai-data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headerList = await headers();
  const rawHost = headerList.get("x-forwarded-host") || headerList.get("host") || "";
  const releaseDate = new Date("2026-11-27T00:00:00.000Z");
  const key = resolvePortfolioSubdomainKey(rawHost);

  if (key === "talk") {
    return [];
  }

  if (key === "downex") {
    return DOWNEX_SITEMAP_URLS.map((entry) => ({
      url: `${DOWNEX_ORIGIN}${entry.path}`,
      lastModified: releaseDate,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    }));
  }

  if (key === "cp") {
    return [
      { url: SUBDOMAIN_ORIGINS.cp, lastModified: releaseDate, changeFrequency: "weekly", priority: 1.0 },
      { url: `${SUBDOMAIN_ORIGINS.cp}/how-to-use`, lastModified: releaseDate, changeFrequency: "weekly", priority: 0.9 },
      { url: `${SUBDOMAIN_ORIGINS.cp}/terms`, lastModified: releaseDate, changeFrequency: "monthly", priority: 0.6 },
      { url: `${SUBDOMAIN_ORIGINS.cp}/privacy`, lastModified: releaseDate, changeFrequency: "monthly", priority: 0.6 },
      { url: `${SUBDOMAIN_ORIGINS.cp}/aou`, lastModified: releaseDate, changeFrequency: "monthly", priority: 0.6 },
    ];
  }

  if (key === "sm") {
    return [
      { url: SUBDOMAIN_ORIGINS.sm, lastModified: releaseDate, changeFrequency: "weekly", priority: 1.0 },
      { url: `${SUBDOMAIN_ORIGINS.sm}/docs`, lastModified: releaseDate, changeFrequency: "weekly", priority: 0.85 },
    ];
  }

  if (key !== "root") {
    return [
      {
        url: SUBDOMAIN_ORIGINS[key],
        lastModified: releaseDate,
        changeFrequency: "weekly",
        priority: 1.0,
      },
    ];
  }

  const baseUrl = SUBDOMAIN_ORIGINS.root;

  // Retrieve dynamic SEO document for genuine homepage modified date
  let homeLastModified = releaseDate;
  try {
    const seoRes = await seoRepository.getSeo();
    if (seoRes.data?.updatedAt) {
      const parsed = new Date(seoRes.data.updatedAt);
      if (!isNaN(parsed.getTime())) {
        homeLastModified = parsed;
      }
    }
  } catch {}

  // Retrieve projects to get genuine timestamps for case studies if available
  let projects: Array<{ id: string; slug?: string; updatedAt?: string }> = [];
  try {
    const projectsRes = await projectsRepository.getProjects();
    if (projectsRes.data) {
      projects = projectsRes.data;
    }
  } catch {}

  const coreRoutes: {
    path: string;
    priority: number;
    changeFrequency: "weekly" | "monthly";
    lastModified: Date;
  }[] = [
    { path: "", priority: 1.0, changeFrequency: "weekly", lastModified: homeLastModified },
    { path: "/apps", priority: 0.9, changeFrequency: "weekly", lastModified: homeLastModified },
    { path: "/services", priority: 0.9, changeFrequency: "weekly", lastModified: homeLastModified },
    { path: "/projects", priority: 0.9, changeFrequency: "weekly", lastModified: homeLastModified },
    { path: "/blog", priority: 0.9, changeFrequency: "weekly", lastModified: homeLastModified },
    { path: "/chat", priority: 0.8, changeFrequency: "weekly", lastModified: releaseDate },
    { path: "/contact-portal", priority: 0.9, changeFrequency: "weekly", lastModified: homeLastModified },
    { path: "/privacy", priority: 0.7, changeFrequency: "monthly", lastModified: releaseDate },
    { path: "/terms", priority: 0.7, changeFrequency: "monthly", lastModified: releaseDate },
    { path: "/security", priority: 0.7, changeFrequency: "monthly", lastModified: releaseDate },
    { path: "/accessibility", priority: 0.7, changeFrequency: "monthly", lastModified: releaseDate },
  ];

  const projectRoutes = Object.keys(PROJECT_CASE_STUDIES).map((slug) => {
    const study = PROJECT_CASE_STUDIES[slug];
    const projectDoc = projects.find(
      (p) => p.slug === slug || p.id === study.projectId
    );
    let projectLastModified = releaseDate;
    if (projectDoc?.updatedAt) {
      const parsed = new Date(projectDoc.updatedAt);
      if (!isNaN(parsed.getTime())) {
        projectLastModified = parsed;
      }
    } else if (study?.publishedDate) {
      const parsed = new Date(study.publishedDate);
      if (!isNaN(parsed.getTime())) {
        projectLastModified = parsed;
      }
    }

    return {
      path: `/projects/${slug}`,
      priority: 0.8,
      changeFrequency: "weekly" as const,
      lastModified: projectLastModified,
    };
  });

  const blogRoutes = Object.keys(PROJECT_CASE_STUDIES).map((slug) => {
    const study = PROJECT_CASE_STUDIES[slug];
    let blogLastModified = releaseDate;
    if (study?.publishedDate) {
      const parsed = new Date(study.publishedDate);
      if (!isNaN(parsed.getTime())) {
        blogLastModified = parsed;
      }
    }

    return {
      path: `/blog/${slug}`,
      priority: 0.8,
      changeFrequency: "weekly" as const,
      lastModified: blogLastModified,
    };
  });

  const allRoutes = [...coreRoutes, ...projectRoutes, ...blogRoutes];

  const sitemapItems: MetadataRoute.Sitemap = allRoutes.map((item) => ({
    url: `${baseUrl}${item.path}`,
    lastModified: item.lastModified,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  // Authoritative ecosystem subdomains
  const ecosystemSubdomains = [
    SUBDOMAIN_ORIGINS.apps,
    SUBDOMAIN_ORIGINS.services,
    SUBDOMAIN_ORIGINS.resume,
    SUBDOMAIN_ORIGINS.contact,
    SUBDOMAIN_ORIGINS.cp,
    SUBDOMAIN_ORIGINS.downex,
    SUBDOMAIN_ORIGINS.sm,
    SUBDOMAIN_ORIGINS.gpn,
  ];

  for (const subdomainUrl of ecosystemSubdomains) {
    sitemapItems.push({
      url: subdomainUrl,
      lastModified: homeLastModified,
      changeFrequency: "weekly",
      priority: 0.95,
    });
  }

  return sitemapItems;
}
