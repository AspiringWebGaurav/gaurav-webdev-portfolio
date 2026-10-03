import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { FaLocationArrow, FaGithub, FaCheck, FaLightbulb, FaLayerGroup, FaBookOpen, FaShieldHalved, FaScaleBalanced } from "react-icons/fa6";
import { ProjectImageSlider } from "@/components/portfolio/ProjectImageSlider";
import { PROJECT_CASE_STUDIES } from "@/lib/data/case-studies";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SHORT_SLUG_MAP: Record<string, string> = {
  gphost: "gphost-cloud-transit",
  "gphost-eu-cc": "gphost-cloud-transit",
  send2me: "send2me-p2p-file-transfer",
  switchyy: "switchyy-mode-control",
  daretosend: "daretosend-anonymous-feedback",
  xurl: "xurl-smart-url-shortener",
  gpmas: "gpmas-mail-automation",
  gmp: "gmp-enterprise-portal",
  gpdrive: "gpdrive-cloud-storage",
  myfit: "myfit-fitness-tracker",
  gpnotes: "gpnotes-encrypted-notes",
  bgmiid: "bgmiid-gaming-identity",
  gauravwork: "gauravwork-developer-workspace",
  gauravbuilds: "gauravbuilds-artifacts-hub",
  gauravwatch: "gauravwatch-precision-chronograph",
  connectgaurav: "connectgaurav-developer-hub",
  "deggy-guard-tour-system": "deggy",
};

function resolveCaseStudy(slug: string) {
  if (PROJECT_CASE_STUDIES[slug]) {
    return { study: PROJECT_CASE_STUDIES[slug], canonicalSlug: slug, shouldRedirect: false };
  }
  const mappedSlug = SHORT_SLUG_MAP[slug];
  if (mappedSlug && PROJECT_CASE_STUDIES[mappedSlug]) {
    return { study: PROJECT_CASE_STUDIES[mappedSlug], canonicalSlug: mappedSlug, shouldRedirect: true };
  }
  const prefixMatch = Object.keys(PROJECT_CASE_STUDIES).find((k) => k.startsWith(`${slug}-`));
  if (prefixMatch && PROJECT_CASE_STUDIES[prefixMatch]) {
    return { study: PROJECT_CASE_STUDIES[prefixMatch], canonicalSlug: prefixMatch, shouldRedirect: true };
  }
  return null;
}

export const revalidate = 86400;

export async function generateStaticParams() {
  return Object.keys(PROJECT_CASE_STUDIES).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolveCaseStudy(slug);

  if (!resolved) {
    const canonicalUrl = `https://gauravpatil.site/projects/${slug}`;
    const formattedTitle = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return {
      title: `${formattedTitle} — Project Case Study`,
      description: `Explore the technical case study, software architecture, and implementation details for ${formattedTitle} by Gaurav Patil.`,
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
      openGraph: {
        title: `${formattedTitle} — Project Case Study | Gaurav Patil`,
        description: `Explore the technical case study, software architecture, and implementation details for ${formattedTitle} by Gaurav Patil.`,
        url: canonicalUrl,
        siteName: "Gaurav Patil Portfolio",
        type: "article",
        images: [
          {
            url: "https://gauravpatil.site/og-image.png",
            width: 1200,
            height: 630,
            alt: `${formattedTitle} | Gaurav Patil Portfolio`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${formattedTitle} — Project Case Study | Gaurav Patil`,
        description: `Explore the technical case study and implementation details for ${formattedTitle} by Gaurav Patil.`,
        creator: "@gauravpatil",
        images: ["https://gauravpatil.site/og-image.png"],
      },
    };
  }

  const { study, canonicalSlug } = resolved;
  const canonicalUrl = `https://gauravpatil.site/projects/${canonicalSlug}`;

  return {
    title: `${study.title} — Technical Case Study`,
    description: study.subtitle,
    keywords: [
      study.title,
      `${study.title} Case Study`,
      "Software Architecture",
      ...study.technologies,
      "Gaurav Patil Engineering",
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: `${study.title} — Technical Case Study | Gaurav Patil`,
      description: study.subtitle,
      url: canonicalUrl,
      siteName: "Gaurav Patil Portfolio",
      type: "article",
      images: study.coverImage
        ? [
            {
              url: study.coverImage.startsWith("http")
                ? study.coverImage
                : `https://gauravpatil.site${study.coverImage}`,
              width: 1200,
              height: 630,
              alt: study.title,
            },
          ]
        : [
            {
              url: "https://gauravpatil.site/og-image.png",
              width: 1200,
              height: 630,
              alt: "Gaurav Patil Portfolio",
            },
          ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${study.title} — Case Study | Gaurav Patil`,
      description: study.subtitle,
      creator: "@gauravpatil",
      images: [
        study.coverImage
          ? study.coverImage.startsWith("http")
            ? study.coverImage
            : `https://gauravpatil.site${study.coverImage}`
          : "https://gauravpatil.site/og-image.png",
      ],
    },
  };
}

export default async function ProjectCaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const resolved = resolveCaseStudy(slug);

  if (!resolved) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] dark:bg-black-100 text-slate-900 dark:text-white flex flex-col items-center justify-center px-5 py-24 text-center relative overflow-hidden">
        {/* Background Grid */}
        <div className="h-full w-full bg-[#FAFAFA] dark:bg-black-100 bg-grid-black/[0.025] dark:bg-grid-white/[0.03] absolute top-0 left-0 flex items-center justify-center pointer-events-none -z-10">
          <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-[#FAFAFA] dark:bg-black-100 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        </div>

        <div className="max-w-md z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple/10 border border-purple-200 dark:border-purple/30 flex items-center justify-center mb-6">
            <FaBookOpen className="w-7 h-7 text-purple-600 dark:text-purple" />
          </div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-purple-600 dark:text-purple bg-purple-50 dark:bg-purple/10 border border-purple-200 dark:border-purple/30 rounded-full px-4 py-1 mb-4 font-semibold">
            Case Study Catalog
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
            Case Study Not Found
          </h1>
          <p className="text-slate-600 dark:text-white-200 text-sm sm:text-base mb-8 leading-relaxed">
            The requested technical case study could not be located or may have been renamed. You can explore all 14 software engineering case studies in the project hub.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-950 hover:bg-black text-white dark:bg-purple dark:text-black dark:hover:bg-purple/90 font-semibold transition-all text-sm shadow-md active:scale-95"
            >
              <span>Explore All Projects</span>
              <FaLocationArrow className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-medium transition-all text-sm shadow-sm active:scale-95"
            >
              <span>Return to Portfolio</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (resolved.shouldRedirect) {
    permanentRedirect(`/projects/${resolved.canonicalSlug}`);
  }

  const { study, canonicalSlug } = resolved;
  const canonicalUrl = `https://gauravpatil.site/projects/${canonicalSlug}`;

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
      {
        "@type": "ListItem",
        position: 3,
        name: study.title,
        item: canonicalUrl,
      },
    ],
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${canonicalUrl}#article`,
    headline: `${study.title} — Technical Case Study`,
    description: study.subtitle,
    url: canonicalUrl,
    image: `https://gauravpatil.site${study.coverImage}`,
    author: {
      "@type": "Person",
      "@id": "https://gauravpatil.site/#person",
      name: "Gaurav Patil",
      url: "https://gauravpatil.site/",
      sameAs: ["https://github.com/AspiringWebGaurav"],
    },
    publisher: {
      "@type": "Person",
      "@id": "https://gauravpatil.site/#person",
      name: "Gaurav Patil",
      url: "https://gauravpatil.site/",
    },
    datePublished: study.publishedDate ? new Date(study.publishedDate).toISOString() : "2026-09-14T00:00:00.000Z",
    dateModified: "2026-09-14T21:01:38.000Z",
    inLanguage: "en-US",
    about: study.technologies.map((t) => ({
      "@type": "Thing",
      name: t,
    })),
  };

  return (
    <main className="relative bg-[#FAFAFA] dark:bg-black-100 min-h-screen text-slate-900 dark:text-white flex justify-center items-center flex-col mx-auto px-5 sm:px-10 overflow-clip">
      {/* Schema.org Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Ambient Grid Pattern */}
      <div
        className="h-screen w-full bg-[#FAFAFA] dark:bg-black-100 bg-grid-black/[0.025] dark:bg-grid-white/[0.03]
       absolute top-0 left-0 flex items-center justify-center pointer-events-none"
      >
        <div
          className="absolute pointer-events-none inset-0 flex items-center justify-center bg-[#FAFAFA] dark:bg-black-100
         [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
        />
      </div>

      <div className="max-w-4xl w-full pt-16 sm:pt-24 pb-20 relative z-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-slate-500 dark:text-[#C1C2D3] flex-wrap">
          <Link href="/" className="hover:text-[#7C3AED] dark:hover:text-purple transition-colors duration-200">
            Home
          </Link>
          <span className="text-slate-300 dark:text-white/40">/</span>
          <Link href="/projects" className="hover:text-[#7C3AED] dark:hover:text-purple transition-colors duration-200">
            Projects
          </Link>
          <span className="text-slate-300 dark:text-white/40">/</span>
          <span className="text-[#7C3AED] dark:text-purple font-medium truncate max-w-xs sm:max-w-md" aria-current="page">
            {study.title}
          </span>
        </nav>

        {/* Case Study Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2.5 mb-4 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-purple-50 dark:bg-purple/10 text-[#7C3AED] dark:text-purple border border-purple-200 dark:border-purple/30">
              {study.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono text-slate-700 dark:text-neutral-300 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1]">
              {study.role}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1]">
              {study.timeline}
            </span>
            {study.publishedDate && (
              <span className="px-3 py-1 rounded-full text-xs font-mono text-slate-700 dark:text-neutral-300 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1]" title="Original Launch Date">
                📅 Created: {study.publishedDate}
              </span>
            )}
            {study.readingTime && (
              <span className="px-3 py-1 rounded-full text-xs font-mono text-slate-600 dark:text-neutral-400 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1]">
                ⏱️ {study.readingTime}
              </span>
            )}
            {study.licenseStatus && (
              <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                {study.licenseStatus}
              </span>
            )}
            {study.contractStatus && (
              <span className="px-3 py-1 rounded-full text-xs font-mono text-slate-700 dark:text-neutral-300 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1]">
                {study.contractStatus}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
            {study.title}
          </h1>

          <p className="text-base sm:text-xl text-slate-600 dark:text-white-200 leading-relaxed">
            {study.subtitle}
          </p>
        </header>

        {/* Image Showcase Banner (Auto-Sliding Multi-Screenshot Engine) */}
        <div className="mb-12">
          <ProjectImageSlider
            images={study.images && study.images.length > 0 ? study.images : [study.coverImage]}
            title={study.title}
            aspectClass="h-64 sm:h-[450px]"
            className="w-full max-w-full mb-0 rounded-3xl"
          />
        </div>

        {/* Action Links Bar */}
        <div className="flex items-center gap-4 mb-14 p-4 rounded-2xl bg-white dark:bg-[#04071D] border border-slate-200/90 dark:border-white/[0.1] shadow-sm flex-wrap justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {study.technologies.map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-white/90 border border-slate-200 dark:border-white/[0.08]"
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto flex-wrap">
            {study.githubUrl && (
              <a
                href={study.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] transition-colors border border-slate-200 dark:border-white/[0.08]"
              >
                <FaGithub className="w-4 h-4" />
                <span>{study.desktopGithubUrl ? "Web App Code" : "Source Code"}</span>
              </a>
            )}
            {study.desktopGithubUrl && (
              <a
                href={study.desktopGithubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#7C3AED] hover:text-[#6D28D9] dark:text-purple dark:hover:text-white px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple/10 dark:hover:bg-purple/20 transition-colors border border-purple-200 dark:border-purple/30"
              >
                <FaGithub className="w-4 h-4 text-[#7C3AED] dark:text-purple" />
                <span>Rust PC App Code</span>
              </a>
            )}
            {study.docsUrl && (
              <a
                href={study.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-white px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200 dark:border-indigo-500/30"
              >
                <FaBookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Documentation</span>
              </a>
            )}
            {study.liveUrl && (
              <a
                href={study.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-slate-950 hover:bg-black dark:text-black dark:bg-purple dark:hover:bg-purple/90 px-4 py-2 rounded-xl transition-colors shadow-md dark:shadow-purple/20"
              >
                Live Demo
                <FaLocationArrow className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Section 1: Overview */}
        <section aria-labelledby="overview-heading" className="mb-14">
          <h2 id="overview-heading" className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <FaLayerGroup className="w-5 h-5 text-[#7C3AED] dark:text-purple" />
            Project Overview
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-white-200 leading-relaxed">
            {study.overview}
          </p>
        </section>

        {/* Section 2: Architecture */}
        <section aria-labelledby="architecture-heading" className="mb-14 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#04071D] border border-slate-200/90 dark:border-white/[0.1] shadow-sm">
          <h2 id="architecture-heading" className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            {study.architecture.title}
          </h2>
          <p className="text-slate-600 dark:text-white-200 text-sm sm:text-base leading-relaxed mb-6">
            {study.architecture.description}
          </p>
          <ul className="space-y-3">
            {study.architecture.points.map((point, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700 dark:text-neutral-300">
                <FaCheck className="w-4 h-4 text-[#7C3AED] dark:text-purple mt-1 flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 3: Key Challenges & Solutions */}
        <section aria-labelledby="challenges-heading" className="mb-14">
          <h2 id="challenges-heading" className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <FaLightbulb className="w-5 h-5 text-[#7C3AED] dark:text-purple" />
            Engineering Challenges & Solutions
          </h2>
          <div className="space-y-6">
            {study.challenges.map((c, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200/90 dark:border-white/[0.08] shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {c.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-300 leading-relaxed">
                  {c.solution}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Key Features & Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">
          {/* Features */}
          <section aria-labelledby="features-heading" className="p-6 rounded-3xl bg-white dark:bg-[#04071D] border border-slate-200/90 dark:border-white/[0.1] shadow-sm">
            <h2 id="features-heading" className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Core Capabilities
            </h2>
            <ul className="space-y-3">
              {study.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] dark:bg-purple mt-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Results */}
          <section aria-labelledby="results-heading" className="p-6 rounded-3xl bg-white dark:bg-[#04071D] border border-slate-200/90 dark:border-white/[0.1] shadow-sm">
            <h2 id="results-heading" className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Validated Outcomes
            </h2>
            <ul className="space-y-3">
              {study.results.map((result, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-neutral-300">
                  <FaCheck className="w-3.5 h-3.5 text-[#7C3AED] dark:text-purple mt-1 flex-shrink-0" />
                  <span>{result}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Section 5: Governance, Licensing & Contract Status */}
        <section aria-labelledby="governance-heading" className="mb-16 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#04071D] border border-slate-200/90 dark:border-white/[0.1] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple/10 border border-purple-200 dark:border-purple/30 flex items-center justify-center text-[#7C3AED] dark:text-purple">
              <FaShieldHalved className="w-5 h-5" />
            </div>
            <div>
              <h2 id="governance-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Licensing, IP &amp; Contract Governance
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
                Transparent disclosure on source code distribution, client contracts, and commercial terms
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08]">
              <p className="text-xs font-mono uppercase text-slate-500 dark:text-neutral-400 mb-1">Software License Status</p>
              <p className="text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <FaScaleBalanced className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>{study.licenseStatus}</span>
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08]">
              <p className="text-xs font-mono uppercase text-slate-500 dark:text-neutral-400 mb-1">Contract &amp; Engagement Model</p>
              <p className="text-sm sm:text-base font-semibold text-[#7C3AED] dark:text-purple flex items-center gap-2">
                <FaCheck className="w-4 h-4 text-[#7C3AED] dark:text-purple flex-shrink-0" />
                <span>{study.contractStatus}</span>
              </p>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-700 dark:text-neutral-300 leading-relaxed bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-200 dark:border-white/[0.06]">
            {study.licenseDetails}
          </p>
        </section>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-8 border-t border-slate-200/80 dark:border-white/[0.08] flex-wrap gap-4">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
          >
            ← Back to All Projects
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#7C3AED] hover:text-[#6D28D9] dark:text-purple dark:hover:text-white transition-colors"
          >
            Go to Homepage →
          </Link>
        </div>
      </div>
    </main>
  );
}
