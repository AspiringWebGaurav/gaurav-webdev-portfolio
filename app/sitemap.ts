import type { MetadataRoute } from "next";
import { PROJECT_CASE_STUDIES } from "@/lib/data/case-studies";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://gauravpatil.site";
  const releaseDate = new Date("2026-03-01T00:00:00.000Z");

  const coreRoutes: {
    path: string;
    priority: number;
    changeFrequency: "weekly" | "monthly";
  }[] = [
    { path: "", priority: 1.0, changeFrequency: "weekly" },
    { path: "/projects", priority: 0.9, changeFrequency: "weekly" },
    { path: "/privacy", priority: 0.7, changeFrequency: "monthly" },
    { path: "/terms", priority: 0.7, changeFrequency: "monthly" },
    { path: "/security", priority: 0.7, changeFrequency: "monthly" },
    { path: "/accessibility", priority: 0.7, changeFrequency: "monthly" },
  ];

  const projectRoutes = Object.keys(PROJECT_CASE_STUDIES).map((slug) => ({
    path: `/projects/${slug}`,
    priority: 0.8,
    changeFrequency: "weekly" as const,
  }));

  const allRoutes = [...coreRoutes, ...projectRoutes];

  return allRoutes.map((item) => ({
    url: `${baseUrl}${item.path}`,
    lastModified: releaseDate,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));
}
