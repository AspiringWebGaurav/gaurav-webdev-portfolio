"use client";

import Link from "next/link";
import { FaLocationArrow, FaArrowRight, FaGithub, FaBookOpen } from "react-icons/fa6";
import { PinContainer } from "@/components/ui/3d-pin";
import { ProjectImageSlider } from "@/components/portfolio/ProjectImageSlider";
import type { ProjectDocument } from "@/types/portfolio";
import { SEED_PROJECTS } from "@/lib/dal/repositories/seed-data";

interface ProjectsSectionProps {
  projects?: ProjectDocument[];
  limit?: number;
}

const getTechName = (iconUrl: string) => {
  const file = iconUrl.split("/").pop()?.replace(/\.(svg|png|webp)$/, "") || "";
  const map: Record<string, string> = {
    re: "React",
    next: "Next.js 15",
    webrtc: "WebRTC (P2P Data Channels)",
    rust: "Rust (Native Systems Engine)",
    tauri: "Tauri (Cross-Platform Desktop)",
    tail: "Tailwind CSS",
    firebase: "Firebase (Real-time Signaling)",
    firestore: "Firestore (Token Lifecycle)",
    cloud: "Cloud & Edge Infrastructure",
    ts: "TypeScript",
    three: "Three.js",
    fm: "Framer Motion",
    stream: "Stream API",
    c: "Cloudinary",
    gsap: "GSAP",
  };
  return map[file] || `${file || "Technology"} Icon`;
};

export const ProjectsSection = ({ projects = SEED_PROJECTS, limit = 4 }: ProjectsSectionProps) => {
  const sortedProjects = [...projects].sort((a, b) => (a.order || 0) - (b.order || 0));
  const displayedProjects = limit ? sortedProjects.slice(0, limit) : sortedProjects;

  return (
    <section className="py-20" id="projects">
      <h2 id="featured-projects-heading" className="heading">
        A small selection of <span className="text-purple">recent projects</span>
      </h2>
      <div className="flex flex-wrap items-center justify-center px-4 pt-4 pb-0 gap-x-24 gap-y-6 mt-8">
        {displayedProjects.map(
          ({
            id,
            title,
            slug,
            description,
            coverImage,
            images,
            iconLists,
            liveUrl,
            githubUrl,
            desktopGithubUrl,
            docsUrl,
            licenseStatus,
          }) => {
            const caseStudyUrl = slug ? `/projects/${slug}` : undefined;

            return (
              <div
                className="h-[26rem] sm:h-[29rem] flex items-center justify-center sm:w-[570px] w-[90vw] max-w-[570px]"
                key={id}
              >
                <PinContainer
                  title={liveUrl}
                  href={liveUrl}
                  className="w-[88vw] sm:w-[536px] max-w-[536px] h-[375px] sm:h-[430px] flex flex-col justify-between select-none"
                >
                  {/* Upper Content Block */}
                  <div>
                    {/* Auto-Sliding Multi-Screenshot Showcase (CLS = 0) */}
                    <ProjectImageSlider
                      images={images && images.length > 0 ? images : [coverImage]}
                      title={title}
                      aspectClass="h-44 sm:h-56"
                    />

                    {/* License & Contract Governance Badge */}
                    <div className="mb-1.5 flex items-center h-6">
                      {licenseStatus && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-purple/10 text-purple border border-purple/30 tracking-tight">
                          {licenseStatus}
                        </span>
                      )}
                    </div>

                    {/* Project Title with Flexible 2-Line Bounds & Zero Collision */}
                    <h3 className="font-bold lg:text-2xl md:text-xl text-base leading-snug min-h-[3rem] sm:min-h-[3.5rem] flex items-center">
                      {caseStudyUrl ? (
                        <Link
                          href={caseStudyUrl}
                          className="hover:text-purple transition-colors line-clamp-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {title}
                        </Link>
                      ) : (
                        <span className="line-clamp-2">{title}</span>
                      )}
                    </h3>

                    {/* Punchy, Easy-to-Read Subtitle with Stable Baseline */}
                    <p className="text-white-200 text-xs sm:text-sm font-normal line-clamp-2 my-1 leading-relaxed min-h-[2.5rem] sm:min-h-[2.75rem]">
                      {description}
                    </p>
                  </div>

                {/* Bottom Action & Tech Row (Zero Height Shake, No Wrap) */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.08] gap-1 sm:gap-2">
                  {/* Tech Stack Icons with Recruiter Tooltips */}
                  <div className="flex items-center shrink-0">
                    {(iconLists || []).map((icon, index) => (
                      <div
                        key={index}
                        className="border border-white/[.15] rounded-full bg-[#04071D] w-6 h-6 sm:w-8 sm:h-8 flex justify-center items-center shadow-sm cursor-help hover:scale-110 hover:border-purple transition-all duration-200"
                        style={{
                          transform: `translateX(-${index * 5}px)`,
                        }}
                        title={getTechName(icon)}
                      >
                        <img
                          src={icon}
                          alt={getTechName(icon)}
                          loading="lazy"
                          decoding="async"
                          className="p-0.5 sm:p-1 w-full h-full object-contain"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Smart Dual-Repository, Docs & Live Site Links */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {githubUrl && (
                      <a
                        href={githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] sm:text-xs text-neutral-400 hover:text-white transition-colors duration-200 font-medium py-1 px-1.5 sm:py-1.5 sm:px-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08]"
                        title="Repository Source Code"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaGithub className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>{desktopGithubUrl ? "Web" : "Code"}</span>
                      </a>
                    )}

                    {desktopGithubUrl && (
                      <a
                        href={desktopGithubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] sm:text-xs text-neutral-300 hover:text-purple transition-colors duration-200 font-medium py-1 px-1.5 sm:py-1.5 sm:px-2 rounded-lg bg-white/[0.04] hover:bg-purple/10 border border-white/[0.08] hover:border-purple/40"
                        title="Rust & Tauri Native Desktop App Source Code"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaGithub className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple" />
                        <span>Rust</span>
                      </a>
                    )}

                    {docsUrl && (
                      <a
                        href={docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] sm:text-xs text-indigo-300 hover:text-white transition-colors duration-200 font-medium py-1 px-1.5 sm:py-1.5 sm:px-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30"
                        title="Developer Documentation"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaBookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-400" />
                        <span>Docs</span>
                      </a>
                    )}

                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] sm:text-xs text-purple hover:text-white transition-colors duration-200 font-medium group/link py-1 px-2 sm:py-1.5 sm:px-2.5 rounded-lg bg-purple/10 hover:bg-purple/20 border border-purple/30 touch-manipulation"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Live Site</span>
                      <FaLocationArrow className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-purple group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200" />
                    </a>
                  </div>
                </div>
              </PinContainer>
            </div>
          );
        }
      )}
      </div>

      <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-2.5 px-4">
        <Link
          href="/projects"
          className="relative inline-flex items-center justify-center overflow-hidden rounded-xl p-[1.5px] border border-white/[0.18] hover:border-purple/60 transition-all duration-300 group shadow-[0_0_20px_rgba(203,172,249,0.15)] hover:shadow-[0_0_25px_rgba(203,172,249,0.3)] max-w-full"
        >
          {/* 360-Degree Continuous Luminous Conic Beam */}
          <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#7C3AED_25%,#393BB2_50%,#7C3AED_75%,#E2CBFF_100%)] opacity-80 group-hover:opacity-100 transition-opacity" />

          {/* Solid Inner Body with Exact Matching Radius */}
          <span className="relative z-10 inline-flex items-center justify-center rounded-[10px] bg-[#04071D] group-hover:bg-[#070B28] px-5 sm:px-8 py-3 text-xs sm:text-sm font-medium text-white backdrop-blur-3xl gap-2 sm:gap-3 transition-colors duration-200 text-center">
            <span className="hidden sm:inline">Explore All {sortedProjects.length} Projects & Architectural Case Studies</span>
            <span className="sm:hidden">Explore All {sortedProjects.length} Projects & Case Studies</span>
            <FaArrowRight className="w-3.5 h-3.5 text-purple group-hover:translate-x-1 transition-transform duration-200 shrink-0" />
          </span>
        </Link>
        <p className="text-[11px] sm:text-xs text-[#C1C2D3] font-mono tracking-wide text-center px-2">
          Full catalog with interactive galleries, deep architectural teardowns & GitHub repositories
        </p>
      </div>
    </section>
  );
};
