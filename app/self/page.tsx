import React from "react";
import { projectsRepository } from "@/lib/dal/repositories/cms/projects.repository";
import { SEED_PROJECTS } from "@/lib/dal/repositories/seed-data";

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
  const res = await projectsRepository.getProjects();
  const rawProjects = res.data && res.data.length > 0 ? res.data : SEED_PROJECTS;
  const projects = [...rawProjects]
    .filter(
      (p) =>
        p.isPublished !== false &&
        p.id !== "proj_11" &&
        p.slug !== "gauravwork-developer-workspace" &&
        !p.title?.startsWith("Gaurav Workspace") &&
        p.id !== "proj_10" &&
        p.slug !== "bgmiid-gaming-identity" &&
        !p.liveUrl?.includes("bgmiid.eu.cc")
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const mobileRows = Math.max(1, Math.ceil(projects.length / 2));

  return (
    <main
      id="self-launchpad"
      className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between items-center p-2 sm:p-4 md:p-6 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.4rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] bg-[#FFFFFF] text-slate-900 font-sans select-none"
    >
      <nav
        aria-label="Projects Index"
        style={{
          gridTemplateRows: `repeat(${mobileRows}, minmax(0, 1fr))`,
        }}
        className="w-full max-w-5xl flex-1 min-h-0 grid grid-cols-2 landscape:grid-cols-4 md:grid-cols-4 landscape:!grid-rows-4 md:!grid-rows-4 gap-1.5 sm:gap-2.5 md:gap-3"
      >
        {projects.map((project) => {
          let targetUrl = project.liveUrl || "";
          if (targetUrl.includes("send2me.site")) {
            targetUrl = "https://send2me.eu.cc/";
          }
          if (targetUrl.includes("gauravbuilds.eu.cc")) {
            targetUrl = "https://gauravbuilds.vercel.app/";
          }
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
                <span className="truncate text-[12px] xs:text-[13px] sm:text-[14px] md:text-[14.5px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                  {cleanName}
                </span>
                <span
                  aria-hidden="true"
                  className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-100/80 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[10px] font-mono transition-all duration-150"
                >
                  ↗
                </span>
              </div>
              <span className="truncate text-[9.5px] xs:text-[10px] sm:text-[11px] md:text-xs text-slate-500 font-mono mt-0.5 group-hover:text-slate-800 transition-colors leading-normal">
                {displayUrl}
              </span>
            </a>
          );
        })}
      </nav>

      {/* Slim, professional footer maintaining strict single-view zero scroll */}
      <footer className="shrink-0 w-full max-w-5xl pt-1.5 sm:pt-2 pb-0.5 border-t border-slate-200/80 mt-1 sm:mt-1.5 flex items-center justify-between gap-2 text-[10px] xs:text-[11px] sm:text-xs text-slate-500 font-normal">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-semibold text-slate-700">Gaurav Patil</span>
          <span className="text-slate-300 hidden xs:inline">·</span>
          <span className="text-slate-400 hidden xs:inline">© {new Date().getFullYear()}</span>
        </div>

        <div className="flex items-center flex-wrap justify-end gap-x-2 sm:gap-x-3 gap-y-0.5">
          <a
            href="https://contact.gauravpatil.site"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors inline-flex items-center gap-0.5"
          >
            <span>contact.gauravpatil.site</span>
            <span aria-hidden="true" className="text-[9px] text-slate-400 font-mono">↗</span>
          </a>
          <span className="text-slate-300">·</span>
          <a
            href="https://resume.gauravpatil.site"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors inline-flex items-center gap-0.5"
          >
            <span>resume.gauravpatil.site</span>
            <span aria-hidden="true" className="text-[9px] text-slate-400 font-mono">↗</span>
          </a>
          <span className="text-slate-300">·</span>
          <a
            href="https://gauravpatil.site/#contact"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors inline-flex items-center gap-0.5"
          >
            <span>Form Contact</span>
            <span aria-hidden="true" className="text-[9px] text-slate-400 font-mono">↗</span>
          </a>
          <span className="text-slate-300">·</span>
          <a
            href="https://gauravpatil.site/terms"
            target="_blank"
            rel="noopener noreferrer"
            title="Terms of Service & Subdomain Governance"
            className="hover:text-blue-600 transition-colors inline-flex items-center gap-0.5 font-medium"
          >
            <span><span className="sm:hidden">Terms</span><span className="hidden sm:inline">Terms &amp; Services</span></span>
            <span aria-hidden="true" className="text-[9px] text-slate-400 font-mono">↗</span>
          </a>
          <span className="text-slate-300 hidden md:inline">·</span>
          <a
            href="https://gauravpatil.site"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors hidden md:inline-flex items-center gap-0.5"
          >
            <span>gauravpatil.site</span>
            <span aria-hidden="true" className="text-[9px] text-slate-400 font-mono">↗</span>
          </a>
        </div>
      </footer>
    </main>
  );
}
