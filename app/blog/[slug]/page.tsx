import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import {
  FaLocationArrow,
  FaGithub,
  FaCheck,
  FaLightbulb,
  FaLayerGroup,
  FaBookOpen,
  FaShieldHalved,
  FaScaleBalanced,
  FaArrowLeft,
  FaCalendarDays,
  FaClock,
} from "react-icons/fa6";
import { ProjectImageSlider } from "@/components/portfolio/ProjectImageSlider";
import { PROJECT_CASE_STUDIES } from "@/lib/data/case-studies";
import { FloatingNav } from "@/components/ui/FloatingNav";
import { SEED_NAVIGATION } from "@/lib/dal/repositories/seed-data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const BLOG_SLUG_MAP: Record<string, string> = {
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

function resolveBlogArticle(slug: string) {
  if (PROJECT_CASE_STUDIES[slug]) {
    return { article: PROJECT_CASE_STUDIES[slug], canonicalSlug: slug, shouldRedirect: false };
  }
  const mapped = BLOG_SLUG_MAP[slug];
  if (mapped && PROJECT_CASE_STUDIES[mapped]) {
    return { article: PROJECT_CASE_STUDIES[mapped], canonicalSlug: mapped, shouldRedirect: true };
  }
  const prefixMatch = Object.keys(PROJECT_CASE_STUDIES).find((k) => k.startsWith(`${slug}-`));
  if (prefixMatch && PROJECT_CASE_STUDIES[prefixMatch]) {
    return { article: PROJECT_CASE_STUDIES[prefixMatch], canonicalSlug: prefixMatch, shouldRedirect: true };
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
  const resolved = resolveBlogArticle(slug);

  if (!resolved) {
    return {
      title: "Article Not Found | Gaurav Patil Blog",
      description: "The requested engineering blog article could not be located.",
    };
  }

  const { article, canonicalSlug } = resolved;
  const canonicalUrl = `https://gauravpatil.site/blog/${canonicalSlug}`;

  return {
    title: `${article.title} — Engineering Deep Dive`,
    description: article.subtitle,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${article.title} — Engineering Article | Gaurav Patil`,
      description: article.subtitle,
      url: canonicalUrl,
      siteName: "Gaurav Patil Portfolio",
      type: "article",
      publishedTime: article.publishedDate ? new Date(article.publishedDate).toISOString() : "2026-09-14T00:00:00.000Z",
      images: [
        {
          url: article.coverImage.startsWith("http")
            ? article.coverImage
            : `https://gauravpatil.site${article.coverImage}`,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} — Engineering Article`,
      description: article.subtitle,
      creator: "@gauravpatil",
      images: [
        article.coverImage.startsWith("http")
          ? article.coverImage
          : `https://gauravpatil.site${article.coverImage}`,
      ],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const resolved = resolveBlogArticle(slug);

  if (!resolved) {
    return (
      <main className="min-h-screen bg-black-100 text-white flex flex-col items-center justify-center px-5 py-24 text-center relative overflow-hidden">
        <div className="max-w-md z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-purple/10 border border-purple/30 flex items-center justify-center mb-6">
            <FaBookOpen className="w-7 h-7 text-purple" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">Article Not Found</h1>
          <p className="text-white-200 text-sm mb-8 leading-relaxed">
            The requested engineering article could not be located.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple text-black font-semibold text-sm hover:bg-purple/90 transition-all"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Engineering Blog</span>
          </Link>
        </div>
      </main>
    );
  }

  if (resolved.shouldRedirect) {
    permanentRedirect(`/blog/${resolved.canonicalSlug}`);
  }

  const { article, canonicalSlug } = resolved;
  const canonicalUrl = `https://gauravpatil.site/blog/${canonicalSlug}`;

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
        name: "Blog",
        item: "https://gauravpatil.site/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: canonicalUrl,
      },
    ],
  };

  const blogPostJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${canonicalUrl}#article`,
    headline: article.title,
    description: article.subtitle,
    url: canonicalUrl,
    image: `https://gauravpatil.site${article.coverImage}`,
    datePublished: article.publishedDate ? new Date(article.publishedDate).toISOString() : "2026-09-14T00:00:00.000Z",
    dateModified: "2026-09-14T21:01:38.000Z",
    author: {
      "@type": "Person",
      name: "Gaurav Patil",
      url: "https://gauravpatil.site/",
      sameAs: ["https://github.com/AspiringWebGaurav"],
    },
    publisher: {
      "@type": "Person",
      name: "Gaurav Patil",
      url: "https://gauravpatil.site/",
    },
    inLanguage: "en-US",
    about: article.technologies.map((t) => ({
      "@type": "Thing",
      name: t,
    })),
  };

  return (
    <main className="relative bg-black-100 min-h-screen text-white flex justify-center items-center flex-col mx-auto px-5 sm:px-10 overflow-clip">
      {/* Schema.org Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostJsonLd) }}
      />

      {/* Navigation */}
      <FloatingNav navItems={SEED_NAVIGATION.items} />

      {/* Ambient Grid Pattern */}
      <div
        className="h-screen w-full dark:bg-black-100 bg-white dark:bg-grid-white/[0.03] bg-grid-black-100/[0.2]
       absolute top-0 left-0 flex items-center justify-center pointer-events-none"
      >
        <div
          className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black-100
         bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
        />
      </div>

      <div className="max-w-4xl w-full pt-20 sm:pt-28 pb-20 relative z-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-[#C1C2D3] flex-wrap">
          <Link href="/" className="hover:text-purple transition-colors duration-200">
            Home
          </Link>
          <span className="text-white/40">/</span>
          <Link href="/blog" className="hover:text-purple transition-colors duration-200">
            Blog
          </Link>
          <span className="text-white/40">/</span>
          <span className="text-purple font-medium truncate max-w-xs sm:max-w-md" aria-current="page">
            {article.title}
          </span>
        </nav>

        {/* Article Header */}
        <header className="mb-10">
          <div className="flex items-center gap-2.5 mb-4 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-purple/10 text-purple border border-purple/30">
              {article.category}
            </span>
            {article.publishedDate && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono text-purple bg-purple/10 border border-purple/30 font-medium">
                <FaCalendarDays className="w-3 h-3" />
                <span>Published: {article.publishedDate}</span>
              </span>
            )}
            {article.readingTime && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono text-neutral-300 bg-white/[0.05] border border-white/[0.1]">
                <FaClock className="w-3 h-3 text-neutral-400" />
                <span>{article.readingTime}</span>
              </span>
            )}
            {article.licenseStatus && (
              <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {article.licenseStatus}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
            {article.title}
          </h1>

          <p className="text-base sm:text-xl text-white-200 leading-relaxed">
            {article.subtitle}
          </p>
        </header>

        {/* Multi-Screenshot Gallery Slider */}
        <div className="mb-10">
          <ProjectImageSlider
            images={article.images && article.images.length > 0 ? article.images : [article.coverImage]}
            title={article.title}
            aspectClass="h-64 sm:h-[450px]"
            className="w-full max-w-full mb-0 rounded-3xl"
          />
        </div>

        {/* Action Links Bar */}
        <div className="flex items-center gap-4 mb-12 p-4 rounded-2xl bg-[#04071D] border border-white/[0.1] flex-wrap justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {article.technologies.slice(0, 6).map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 text-xs font-mono rounded-lg bg-white/[0.06] text-white/90 border border-white/[0.08]"
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto flex-wrap">
            {article.githubUrl && (
              <a
                href={article.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-neutral-300 hover:text-white px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] transition-colors border border-white/[0.08]"
              >
                <FaGithub className="w-4 h-4" />
                <span>Source Code</span>
              </a>
            )}
            {article.docsUrl && (
              <a
                href={article.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-indigo-300 hover:text-white px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors border border-indigo-500/30"
              >
                <FaBookOpen className="w-4 h-4 text-indigo-400" />
                <span>Docs</span>
              </a>
            )}
            {article.liveUrl && (
              <a
                href={article.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-black bg-purple hover:bg-purple/90 px-4 py-2 rounded-xl transition-colors shadow-md shadow-purple/20"
              >
                <span>Live Site</span>
                <FaLocationArrow className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Section 1: Plain Language Overview */}
        <section aria-labelledby="overview-heading" className="mb-12">
          <h2 id="overview-heading" className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <FaLayerGroup className="w-5 h-5 text-purple" />
            <span>How It Works &amp; Why It Matters</span>
          </h2>
          <p className="text-base sm:text-lg text-white-200 leading-relaxed">
            {article.overview}
          </p>
        </section>

        {/* Section 2: Architecture & System Design */}
        <section aria-labelledby="architecture-heading" className="mb-12 p-6 sm:p-8 rounded-3xl bg-[#04071D] border border-white/[0.1]">
          <h2 id="architecture-heading" className="text-2xl font-bold text-white mb-3">
            {article.architecture.title}
          </h2>
          <p className="text-white-200 text-sm sm:text-base leading-relaxed mb-6">
            {article.architecture.description}
          </p>
          <ul className="space-y-3">
            {article.architecture.points.map((point, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-neutral-300">
                <FaCheck className="w-4 h-4 text-purple mt-1 flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 3: Engineering Challenges */}
        <section aria-labelledby="challenges-heading" className="mb-12">
          <h2 id="challenges-heading" className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <FaLightbulb className="w-5 h-5 text-purple" />
            <span>Technical Challenges &amp; Practical Solutions</span>
          </h2>
          <div className="space-y-6">
            {article.challenges.map((c, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08]"
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {c.title}
                </h3>
                <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                  {c.solution}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Features & Outcomes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <section aria-labelledby="features-heading" className="p-6 rounded-3xl bg-[#04071D] border border-white/[0.1]">
            <h2 id="features-heading" className="text-xl font-bold text-white mb-4">
              Core Capabilities
            </h2>
            <ul className="space-y-3">
              {article.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple mt-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="results-heading" className="p-6 rounded-3xl bg-[#04071D] border border-white/[0.1]">
            <h2 id="results-heading" className="text-xl font-bold text-white mb-4">
              Validated Outcomes
            </h2>
            <ul className="space-y-3">
              {article.results.map((result, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-neutral-300">
                  <FaCheck className="w-3.5 h-3.5 text-purple mt-1 flex-shrink-0" />
                  <span>{result}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Section 5: Governance & Licensing */}
        <section aria-labelledby="governance-heading" className="mb-14 p-6 sm:p-8 rounded-3xl bg-[#04071D] border border-white/[0.1]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple/10 border border-purple/30 flex items-center justify-center text-purple">
              <FaShieldHalved className="w-5 h-5" />
            </div>
            <div>
              <h2 id="governance-heading" className="text-xl sm:text-2xl font-bold text-white">
                Licensing &amp; Open Governance
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400">
                Transparent information about source code terms and service architecture
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <p className="text-xs font-mono uppercase text-neutral-400 mb-1">Software License</p>
              <p className="text-sm sm:text-base font-semibold text-emerald-400 flex items-center gap-2">
                <FaScaleBalanced className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{article.licenseStatus}</span>
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <p className="text-xs font-mono uppercase text-neutral-400 mb-1">Deployment Model</p>
              <p className="text-sm sm:text-base font-semibold text-purple flex items-center gap-2">
                <FaCheck className="w-4 h-4 text-purple flex-shrink-0" />
                <span>{article.contractStatus}</span>
              </p>
            </div>
          </div>

          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/[0.06]">
            {article.licenseDetails}
          </p>
        </section>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-8 border-t border-white/[0.08] flex-wrap gap-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white font-medium hover:bg-white/[0.08] transition-all text-sm"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Articles</span>
          </Link>

          <Link
            href={`/projects/${article.slug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple text-black font-semibold hover:bg-purple/90 transition-all text-sm shadow-md"
          >
            <span>View in Project Hub</span>
            <FaLocationArrow className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}
