import type { MetadataRoute } from "next";
import { PROJECT_CASE_STUDIES } from "@/lib/data/case-studies";
import { seoRepository } from "@/lib/dal/repositories/cms/seo.repository";
import { projectsRepository } from "@/lib/dal/repositories/cms/projects.repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://gauravpatil.site";
  const releaseDate = new Date("2026-03-01T00:00:00.000Z");

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
    { path: "/projects", priority: 0.9, changeFrequency: "weekly", lastModified: homeLastModified },
    { path: "/chat", priority: 0.8, changeFrequency: "weekly", lastModified: releaseDate },
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
    }

    return {
      path: `/projects/${slug}`,
      priority: 0.8,
      changeFrequency: "weekly" as const,
      lastModified: projectLastModified,
    };
  });

  const allRoutes = [...coreRoutes, ...projectRoutes];

  return allRoutes.map((item) => ({
    url: `${baseUrl}${item.path}`,
    lastModified: item.lastModified,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));
}
