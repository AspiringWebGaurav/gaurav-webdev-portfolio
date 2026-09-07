import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FaLocationArrow, FaGithub, FaArrowRight } from "react-icons/fa6";
import { projectsRepository } from "@/lib/dal/repositories/cms/projects.repository";
import { SEED_PROJECTS } from "@/lib/dal/repositories/seed-data";
import { PROJECT_CASE_STUDIES } from "@/lib/data/case-studies";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Full Stack & Software Engineering Projects",
  description:
    "Explore the software engineering, full-stack web applications, and architectural work by Gaurav Patil, featuring Next.js, React, TypeScript, Three.js, and cloud services.",
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Full Stack & Software Engineering Projects | Gaurav Patil",
    description:
      "Explore software engineering and full-stack web applications by Gaurav Patil.",
  },
};

const getTechName = (iconUrl: string) => {
  const file = iconUrl.split("/").pop()?.replace(/\.(svg|png|webp)$/, "") || "";
  const map: Record<string, string> = {
    re: "React",
    tail: "Tailwind CSS",
    ts: "TypeScript",
    three: "Three.js",
    fm: "Framer Motion",
    next: "Next.js",
    stream: "Stream API",
    c: "Cloudinary",
    gsap: "GSAP",
  };
  return map[file] || `${file || "Technology"} Icon`;
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
  };

  return (
    <main className="relative bg-black-100 min-h-screen text-white flex justify-center items-center flex-col mx-auto px-5 sm:px-10 overflow-clip">
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
        className="h-screen w-full dark:bg-black-100 bg-white dark:bg-grid-white/[0.03] bg-grid-black-100/[0.2]
       absolute top-0 left-0 flex items-center justify-center pointer-events-none"
      >
        <div
          className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black-100
         bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
        />
      </div>

      <div className="max-w-7xl w-full pt-16 sm:pt-24 pb-20 relative z-10">
        {/* Navigation / Breadcrumb Header */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-[#C1C2D3]">
          <Link
            href="/"
            className="hover:text-purple transition-colors duration-200"
          >
            Home
          </Link>
          <span className="text-white/40">/</span>
          <span className="text-purple font-medium" aria-current="page">
            Projects
          </span>
        </nav>

        {/* Hero Header */}
        <header className="mb-14 max-w-3xl">
          <p className="uppercase tracking-widest text-xs text-blue-100 font-mono mb-2">
            Engineering Portfolio & Case Studies
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Full Stack & Software Engineering Projects
          </h1>
          <p className="text-base sm:text-lg text-white-200 leading-relaxed">
            A comprehensive catalog of scalable web applications, 3D WebGL simulations, and SaaS platforms engineered by{" "}
            <span className="text-purple font-semibold">Gaurav Patil</span>. Each project reflects robust architecture, type safety, and polished user experience.
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
                className="bg-[#04071D]/90 border border-white/[0.1] rounded-3xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between hover:border-purple/50 transition-all duration-300 group"
              >
                <div>
                  {/* Project Image Banner */}
                  <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden bg-[#13162D] mb-6 flex items-center justify-center">
                    <img
                      src="/bg.png"
                      alt=""
                      role="presentation"
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                      loading="lazy"
                      decoding="async"
                    />
                    <img
                      src={project.coverImage}
                      alt={`${project.title} preview`}
                      className="z-10 object-contain max-h-full transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  {/* Project Title & Description */}
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-purple transition-colors">
                    {caseStudyUrl ? (
                      <Link href={caseStudyUrl}>{project.title}</Link>
                    ) : (
                      project.title
                    )}
                  </h2>
                  <p className="text-white-200 text-sm sm:text-base leading-relaxed mb-6 line-clamp-3">
                    {project.description}
                  </p>
                </div>

                <div>
                  {/* Tech stack icons */}
                  <div className="flex items-center gap-2 mb-6 flex-wrap">
                    {(project.iconLists || []).map((icon, idx) => (
                      <div
                        key={idx}
                        className="border border-white/[0.15] rounded-full bg-[#04071D] w-8 h-8 flex justify-center items-center p-1.5 shadow-sm"
                        title={getTechName(icon)}
                      >
                        <img
                          src={icon}
                          alt={getTechName(icon)}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Action Links */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] flex-wrap gap-3">
                    {caseStudyUrl && (
                      <Link
                        href={caseStudyUrl}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-purple hover:text-white transition-colors"
                      >
                        Deep Technical Case Study
                        <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    )}

                    <div className="flex items-center gap-4 ml-auto">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
                          aria-label={`View ${project.title} source code on GitHub`}
                        >
                          <FaGithub className="w-4 h-4" />
                          Code
                        </a>
                      )}
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-purple hover:text-white flex items-center gap-1.5 font-medium transition-colors"
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm text-white hover:bg-white/[0.1] transition-colors"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
