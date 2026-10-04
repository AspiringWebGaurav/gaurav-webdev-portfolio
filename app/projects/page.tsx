import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FaLocationArrow, FaGithub, FaArrowRight, FaBookOpen } from "react-icons/fa6";
import { ProjectImageSlider } from "@/components/portfolio/ProjectImageSlider";
import { cn } from "@/lib/utils";
import { projectsRepository } from "@/lib/dal/repositories/cms/projects.repository";
import { SEED_PROJECTS } from "@/lib/dal/repositories/seed-data";
import { PROJECT_CASE_STUDIES } from "@/lib/data/case-studies";

export const revalidate = 86400; // 24-hour baseline ISR (revalidated on-demand via CMS actions)

export const metadata: Metadata = {
  title: "Full Stack & Software Engineering Projects",
  description:
    "Explore the software engineering, full-stack web applications, and architectural work by Gaurav Patil, featuring Next.js, React, TypeScript, WebRTC, Rust, and cloud services.",
  alternates: {
    canonical: "https://gauravpatil.site/projects",
  },
  openGraph: {
    title: "Full Stack & Software Engineering Projects | Gaurav Patil",
    description:
      "Explore the software engineering, full-stack web applications, and architectural work by Gaurav Patil.",
    url: "https://gauravpatil.site/projects",
    siteName: "Gaurav Patil Portfolio",
    type: "website",
    images: [
      {
        url: "https://gauravpatil.site/og-image.png",
        width: 1200,
        height: 630,
        alt: "Full Stack & Software Engineering Projects | Gaurav Patil",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Full Stack & Software Engineering Projects | Gaurav Patil",
    description:
      "Explore software engineering and full-stack web applications by Gaurav Patil.",
    creator: "@gauravpatil",
    images: ["https://gauravpatil.site/og-image.png"],
  },
};

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

const isMonochromeWhiteIcon = (iconUrl: string) => {
  const file = iconUrl.split("/").pop()?.toLowerCase() || "";
  return (
    file === "next.svg" ||
    file === "cloud.svg" ||
    file === "three.svg" ||
    file === "link.svg"
  );
};

export default async function ProjectsHubPage() {
  const res = await projectsRepository.getProjects();
  const rawProjects = res.data && res.data.length > 0 ? res.data : SEED_PROJECTS;
  const projects = [...rawProjects].sort((a, b) => (a.order || 0) - (b.order || 0));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://gauravpatil.site",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Projects",
        item: "https://gauravpatil.site/projects",
      },
    ],
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://gauravpatil.site/projects#collection",
    url: "https://gauravpatil.site/projects",
    name: "Full Stack & Software Engineering Projects | Gaurav Patil",
    description:
      "Comprehensive directory of software engineering, 3D interactive graphics, and full-stack web applications developed by Gaurav Patil.",
    isPartOf: {
      "@id": "https://gauravpatil.site/#website",
    },
    about: {
      "@id": "https://gauravpatil.site/#person",
    },
    author: {
      "@id": "https://gauravpatil.site/#person",
    },
  };

  return (
    <main className="relative bg-[#FAFAFA] dark:bg-black-100 min-h-screen text-slate-900 dark:text-white flex justify-center items-center flex-col mx-auto px-5 sm:px-10 overflow-clip">
      {/* Schema.org injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      {/* Background Grid Pattern */}
      <div
        className="h-screen w-full bg-[#FAFAFA] dark:bg-black-100 bg-grid-black/[0.025] dark:bg-grid-white/[0.03]
       absolute top-0 left-0 flex items-center justify-center pointer-events-none"
      >
        <div
          className="absolute pointer-events-none inset-0 flex items-center justify-center bg-[#FAFAFA] dark:bg-black-100
         [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
        />
      </div>

      <div className="max-w-7xl w-full pt-16 sm:pt-24 pb-20 relative z-10">
        {/* Navigation / Breadcrumb Header */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-slate-500 dark:text-[#C1C2D3]">
          <Link
            href="/"
            className="hover:text-[#7C3AED] dark:hover:text-purple transition-colors duration-200"
          >
            Home
          </Link>
          <span className="text-slate-300 dark:text-white/40">/</span>
          <span className="text-[#7C3AED] dark:text-purple font-medium" aria-current="page">
            Projects
          </span>
        </nav>

        {/* Hero Header */}
        <header className="mb-14 max-w-3xl">
          <p className="uppercase tracking-widest text-xs text-[#7C3AED] dark:text-blue-100 font-mono mb-2">
            Engineering Portfolio & Case Studies
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            Full Stack & Software Engineering Projects
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-white-200 leading-relaxed">
            A comprehensive catalog of scalable web applications, 3D WebGL simulations, and SaaS platforms engineered by{" "}
            <span className="text-[#7C3AED] dark:text-purple font-semibold">Gaurav Patil</span>. Each project reflects robust architecture, type safety, and polished user experience.
          </p>
        </header>

        {/* Project Grid */}
        <section aria-label="Project Catalog" className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {projects.map((project) => {
            const caseStudyUrl =
              project.slug && PROJECT_CASE_STUDIES[project.slug]
                ? `/projects/${project.slug}`
                : undefined;

            return (
              <article
                key={project.id}
                className="bg-white dark:bg-[#04071D]/90 border border-slate-200/90 dark:border-white/[0.1] rounded-3xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between hover:border-[#7C3AED]/40 dark:hover:border-purple/50 shadow-sm dark:shadow-none transition-all duration-300 group"
              >
                <div>
                  {/* Project Auto-Sliding Image Banner (CLS = 0) */}
                  <div className="mb-6">
                    <ProjectImageSlider
                      images={project.images && project.images.length > 0 ? project.images : [project.coverImage]}
                      lightImages={
                        project.imagesLight && project.imagesLight.length > 0
                          ? project.imagesLight
                          : project.coverImageLight
                          ? [project.coverImageLight]
                          : undefined
                      }
                      title={project.title}
                      aspectClass="h-56 sm:h-64"
                      className="w-full max-w-full mb-0 rounded-2xl"
                    />
                  </div>

                  {/* License & Contract Governance Badge */}
                  <div className="mb-2.5 flex items-center h-6">
                    {project.licenseStatus && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-purple-50 dark:bg-purple/10 text-[#7C3AED] dark:text-purple border border-purple-200 dark:border-purple/30">
                        {project.licenseStatus}
                      </span>
                    )}
                  </div>

                  {/* Project Title & Description with Flexible Two-Line Bounds */}
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-snug min-h-[3.25rem] sm:min-h-[3.75rem] flex items-center group-hover:text-[#7C3AED] dark:group-hover:text-purple transition-colors">
                    {caseStudyUrl ? (
                      <Link href={caseStudyUrl} className="line-clamp-2">{project.title}</Link>
                    ) : (
                      <span className="line-clamp-2">{project.title}</span>
                    )}
                  </h2>
                  <p className="text-slate-600 dark:text-white-200 text-sm sm:text-base leading-relaxed mb-6 line-clamp-2 min-h-[2.75rem] sm:min-h-[3rem]">
                    {project.description}
                  </p>
                </div>

                <div>
                  {/* Tech stack icons with Recruiter Tooltips */}
                  <div className="flex items-center gap-2 mb-6 flex-wrap">
                    {(project.iconLists || []).map((icon, idx) => {
                      const isWhite = isMonochromeWhiteIcon(icon);
                      return (
                        <div
                          key={idx}
                          className="border border-slate-200/90 dark:border-white/[0.15] rounded-full bg-white dark:bg-[#04071D] w-8 h-8 flex justify-center items-center p-1.5 shadow-xs dark:shadow-2xs hover:scale-110 hover:border-[#7C3AED] dark:hover:border-purple transition-all duration-200 cursor-help"
                          title={getTechName(icon)}
                        >
                          <img
                            src={icon}
                            alt={getTechName(icon)}
                            className={cn(
                              "w-full h-full object-contain transition-all duration-200",
                              isWhite && "invert dark:invert-0 opacity-90 hover:opacity-100"
                            )}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Links */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-white/[0.08] flex-wrap gap-3">
                    {caseStudyUrl && (
                      <Link
                        href={caseStudyUrl}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#7C3AED] dark:text-purple hover:text-slate-950 dark:hover:text-white transition-colors"
                      >
                        Deep Technical Case Study
                        <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    )}

                    <div className="flex items-center gap-2 ml-auto flex-wrap">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 hover:text-slate-950 dark:hover:text-white flex items-center gap-1.5 transition-colors py-1.5 px-2.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08]"
                          aria-label={`View ${project.title} source code on GitHub`}
                        >
                          <FaGithub className="w-3.5 h-3.5" />
                          <span>{project.desktopGithubUrl ? "Web" : "Code"}</span>
                        </a>
                      )}
                      {project.desktopGithubUrl && (
                        <a
                          href={project.desktopGithubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-slate-700 dark:text-neutral-300 hover:text-[#7C3AED] dark:hover:text-purple flex items-center gap-1.5 transition-colors py-1.5 px-2.5 rounded-md bg-slate-100 hover:bg-purple-50 dark:bg-white/[0.04] dark:hover:bg-purple/10 border border-slate-200 hover:border-purple-300 dark:border-white/[0.08] dark:hover:border-purple/40"
                          aria-label={`View ${project.title} native desktop source code on GitHub`}
                        >
                          <FaGithub className="w-3.5 h-3.5 text-[#7C3AED] dark:text-purple" />
                          <span>Rust</span>
                        </a>
                      )}
                      {project.docsUrl && (
                        <a
                          href={project.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white flex items-center gap-1.5 transition-colors py-1.5 px-2.5 rounded-md bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30"
                          aria-label={`View ${project.title} documentation`}
                        >
                          <FaBookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Docs</span>
                        </a>
                      )}
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-[#7C3AED] dark:text-purple hover:text-slate-950 dark:hover:text-white flex items-center gap-1.5 font-medium transition-colors py-1.5 px-2.5 rounded-md bg-purple-50 hover:bg-purple-100 dark:bg-purple/10 dark:hover:bg-purple/20 border border-purple-200 dark:border-purple/30"
                        >
                          Live Site
                          <FaLocationArrow className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* Footer Back Link */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-800 dark:text-white shadow-sm transition-colors"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
