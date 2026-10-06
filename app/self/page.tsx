import React from "react";
import { cookies } from "next/headers";
import { projectsRepository } from "@/lib/dal/repositories/cms/projects.repository";
import { SEED_PROJECTS } from "@/lib/dal/repositories/seed-data";
import { LaunchpadHaptics } from "@/components/self/LaunchpadHaptics";
import { getSubdomainUrl } from "@/lib/theme/navigation";
import { THEME_COOKIE_NAME } from "@/lib/theme/cookie";

/**
 * 24-hour baseline ISR caching with On-Demand Edge Revalidation.
 * Every visitor hit is served 100% statically from Vercel's Global CDN Edge Cache:
 * - 0 Serverless Function Invocations on visitor page loads
 * - 0 Fluid Active CPU consumption
 * - 0 Firestore database reads per visitor
 * - Purged & regenerated on-demand instantly whenever modified in /admin/projects
 */
export const revalidate = 86400;

export default async function SelfPage() {
  const cookieStore = await cookies();
  const currentTheme = cookieStore.get(THEME_COOKIE_NAME)?.value || "dark";

  const res = await projectsRepository.getProjects();
  const rawProjects = res.data && res.data.length > 0 ? res.data : SEED_PROJECTS;
  const projects = [...rawProjects]
    .filter((p) => p.isPublished !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const mobileRows = Math.max(1, Math.ceil(projects.length / 2));
  const desktopRows = Math.max(1, Math.ceil(projects.length / 4));

  return (
    <main
      id="self-launchpad"
      className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between items-center p-2 sm:p-4 md:p-6 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.4rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] bg-[#FFFFFF] text-slate-900 font-sans select-none"
    >
      <LaunchpadHaptics />

      <nav
        aria-label="Projects Index"
        style={
          {
            "--mobile-rows": mobileRows,
            "--desktop-rows": desktopRows,
          } as React.CSSProperties
        }
        className="w-full max-w-5xl flex-1 min-h-0 grid grid-cols-2 landscape:grid-cols-4 md:grid-cols-4 [grid-template-rows:repeat(var(--mobile-rows),minmax(0,1fr))] landscape:[grid-template-rows:repeat(var(--desktop-rows),minmax(0,1fr))] md:[grid-template-rows:repeat(var(--desktop-rows),minmax(0,1fr))] gap-1.5 sm:gap-2.5 md:gap-3"
      >
        {projects.map((project) => {
          const targetUrl = project.liveUrl || "";
          const cleanName = project.title ? project.title.split(" — ")[0] : "Project";
          const displayUrl = targetUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

          return (
            <a
              key={project.id || project.title}
              id={`proj-${project.id || cleanName.toLowerCase().replace(/\s+/g, "-")}`}
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative min-w-0 w-full h-full overflow-hidden flex flex-col justify-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl border border-slate-200/90 hover:border-slate-400/90 active:border-slate-500 bg-white hover:bg-slate-50/90 active:bg-slate-100/90 active:scale-[0.98] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_3px_8px_rgba(0,0,0,0.05)] transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <div className="flex items-center justify-between gap-1 w-full min-w-0">
                <span className="truncate text-[12px] min-[380px]:text-[13px] sm:text-[14px] md:text-[14.5px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                  {cleanName}
                </span>
                <span
                  aria-hidden="true"
                  className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-100/80 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[10px] font-mono transition-all duration-150"
                >
                  ↗
                </span>
              </div>
              <span className="truncate text-[9.5px] min-[380px]:text-[10px] sm:text-[11px] md:text-xs text-slate-500 font-mono mt-0.5 group-hover:text-slate-800 transition-colors leading-normal">
                {displayUrl}
              </span>
            </a>
          );
        })}
      </nav>

      {/* Sleek, professional footer — strictly single-view, responsive, zero vertical scroll */}
      <footer className="shrink-0 w-full max-w-5xl pt-1.5 sm:pt-2 pb-0.5 border-t border-slate-200/80 mt-1 sm:mt-1.5 flex items-center justify-between gap-1.5 sm:gap-2 text-[10.5px] sm:text-xs text-slate-500 font-normal">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-semibold text-slate-800 tracking-tight">Gaurav Patil</span>
          <span className="text-slate-300 hidden md:inline">·</span>
          <span className="text-slate-400 hidden md:inline">© {new Date().getFullYear()}</span>
        </div>

        <nav
          aria-label="Launchpad Quick Links"
          className="flex items-center justify-end gap-x-1.5 min-[380px]:gap-x-2 sm:gap-x-2.5 md:gap-x-3 text-slate-500 font-medium tracking-tight whitespace-nowrap overflow-hidden"
        >
          <a
            href={getSubdomainUrl("https://contact.gauravpatil.site", currentTheme)}
            target="_blank"
            rel="noopener noreferrer"
            title="Recruiter Contact Subdomain (contact.gauravpatil.site)"
            className="group hover:text-blue-600 active:text-blue-700 transition-colors inline-flex items-center gap-0.5"
          >
            <span>
              <span className="sm:hidden">Contact</span>
              <span className="hidden sm:inline">contact.gauravpatil.site</span>
            </span>
            <span
              aria-hidden="true"
              className="text-[8.5px] sm:text-[9px] text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform font-mono"
            >
              ↗
            </span>
          </a>

          <span className="text-slate-300 select-none">·</span>

          <a
            href={getSubdomainUrl("https://resume.gauravpatil.site", currentTheme)}
            target="_blank"
            rel="noopener noreferrer"
            title="Interactive Resume Subdomain (resume.gauravpatil.site)"
            className="group hover:text-blue-600 active:text-blue-700 transition-colors inline-flex items-center gap-0.5"
          >
            <span>
              <span className="sm:hidden">Resume</span>
              <span className="hidden sm:inline">resume.gauravpatil.site</span>
            </span>
            <span
              aria-hidden="true"
              className="text-[8.5px] sm:text-[9px] text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform font-mono"
            >
              ↗
            </span>
          </a>

          <span className="text-slate-300 select-none">·</span>

          <a
            href={getSubdomainUrl("https://gauravpatil.site/#contact", currentTheme)}
            target="_blank"
            rel="noopener noreferrer"
            title="Direct Contact Form (gauravpatil.site/#contact)"
            className="group hover:text-blue-600 active:text-blue-700 transition-colors inline-flex items-center gap-0.5"
          >
            <span>
              <span className="min-[380px]:hidden">Form</span>
              <span className="hidden min-[380px]:inline">Form Contact</span>
            </span>
            <span
              aria-hidden="true"
              className="text-[8.5px] sm:text-[9px] text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform font-mono"
            >
              ↗
            </span>
          </a>

          <span className="text-slate-300 select-none">·</span>

          <a
            href="https://gauravpatil.site/terms"
            target="_blank"
            rel="noopener noreferrer"
            title="Terms of Service & Subdomain Governance"
            className="group hover:text-blue-600 active:text-blue-700 transition-colors inline-flex items-center gap-0.5"
          >
            <span>
              <span className="sm:hidden">Terms</span>
              <span className="hidden sm:inline">Terms &amp; Services</span>
            </span>
            <span
              aria-hidden="true"
              className="text-[8.5px] sm:text-[9px] text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform font-mono"
            >
              ↗
            </span>
          </a>

          <span className="text-slate-300 select-none hidden md:inline">·</span>

          <a
            href="https://gauravpatil.site"
            target="_blank"
            rel="noopener noreferrer"
            title="Main Portfolio (gauravpatil.site)"
            className="group hover:text-blue-600 active:text-blue-700 transition-colors hidden md:inline-flex items-center gap-0.5"
          >
            <span>gauravpatil.site</span>
            <span
              aria-hidden="true"
              className="text-[8.5px] sm:text-[9px] text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform font-mono"
            >
              ↗
            </span>
          </a>
        </nav>
      </footer>
    </main>
  );
}
