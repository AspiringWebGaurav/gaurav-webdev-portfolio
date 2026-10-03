import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FaLocationArrow, FaArrowRight, FaBookOpen, FaCalendarDays, FaClock, FaGithub } from "react-icons/fa6";
import { PROJECT_CASE_STUDIES } from "@/lib/data/case-studies";
import { FloatingNav } from "@/components/ui/FloatingNav";
import { SEED_NAVIGATION } from "@/lib/dal/repositories/seed-data";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Engineering Blog & Technical Articles | Gaurav Patil",
  description:
    "Explore in-depth software engineering articles, systems architecture teardowns, and development guides by Gaurav Patil. Written in clear, easy-to-understand language.",
  alternates: {
    canonical: "https://gauravpatil.site/blog",
  },
  openGraph: {
    title: "Engineering Blog & Technical Articles | Gaurav Patil",
    description:
      "Explore software engineering articles and system design breakdowns by Gaurav Patil, featuring Next.js, Cloudflare R2, Rust, WebRTC, and scalable cloud architectures.",
    url: "https://gauravpatil.site/blog",
    siteName: "Gaurav Patil Portfolio",
    type: "website",
    images: [
      {
        url: "https://gauravpatil.site/projects/gphost/cover.webp",
        width: 1200,
        height: 630,
        alt: "GPHost — Direct Cloud File Transit & Sharing | Gaurav Patil Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Engineering Blog & Technical Articles | Gaurav Patil",
    description:
      "Explore software engineering articles and system design breakdowns by Gaurav Patil.",
    creator: "@gauravpatil",
    images: ["https://gauravpatil.site/projects/gphost/cover.webp"],
  },
};

export default function BlogHubPage() {
  const articles = Object.values(PROJECT_CASE_STUDIES);

  // GPHost is our featured spotlight article
  const featuredArticle = PROJECT_CASE_STUDIES["gphost-cloud-transit"] || articles[0];
  const regularArticles = articles.filter((a) => a.slug !== "gphost-cloud-transit");

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
    ],
  };

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": "https://gauravpatil.site/blog#blog",
    url: "https://gauravpatil.site/blog",
    name: "Engineering Blog & Technical Deep-Dives | Gaurav Patil",
    description:
      "Deep technical articles and architectural teardowns written in simple, plain language by Gaurav Patil.",
    publisher: {
      "@type": "Person",
      name: "Gaurav Patil",
      url: "https://gauravpatil.site",
    },
    blogPost: articles.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.subtitle,
      url: `https://gauravpatil.site/blog/${post.slug}`,
      datePublished: post.publishedDate ? new Date(post.publishedDate).toISOString() : "2026-09-14T00:00:00.000Z",
      author: {
        "@type": "Person",
        name: "Gaurav Patil",
      },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />

      {/* Navigation */}
      <FloatingNav navItems={SEED_NAVIGATION.items} />

      {/* Ambient Grid Pattern */}
      <div
        className="h-full w-full bg-[#FAFAFA] dark:bg-black-100 bg-grid-black/[0.025] dark:bg-grid-white/[0.03]
       absolute top-0 left-0 flex items-center justify-center pointer-events-none -z-10"
      >
        <div
          className="absolute pointer-events-none inset-0 flex items-center justify-center bg-[#FAFAFA] dark:bg-black-100
         [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
        />
      </div>

      <div className="max-w-7xl w-full pt-24 sm:pt-28 pb-20 relative z-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-slate-500 dark:text-[#C1C2D3]">
          <Link href="/" className="hover:text-[#7C3AED] dark:hover:text-purple transition-colors duration-200">
            Home
          </Link>
          <span className="text-slate-300 dark:text-white/40">/</span>
          <span className="text-[#7C3AED] dark:text-purple font-medium" aria-current="page">
            Engineering Blog
          </span>
        </nav>

        {/* Blog Header */}
        <header className="mb-14 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 dark:bg-purple/10 border border-purple-200 dark:border-purple/30 text-[#7C3AED] dark:text-purple text-xs font-mono tracking-wider uppercase mb-5">
            <FaBookOpen className="w-3.5 h-3.5" />
            <span>Engineering Blog &amp; Case Studies</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
            Clear Tech Explanations &amp; <span className="text-[#7C3AED] dark:text-purple">System Teardowns</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-white-200 leading-relaxed">
            I break down how complex applications, cloud storage engines, and high-speed web platforms are built behind the scenes — explained in simple, human language that anyone can easily read.
          </p>
        </header>

        {/* Featured Article Spotlight: GPHost */}
        {featuredArticle && (
          <section aria-labelledby="featured-article-title" className="mb-20">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold">
                Spotlight Deep Dive · GPHost
              </span>
            </div>

            <div className="rounded-3xl border border-slate-200/90 dark:border-white/[0.12] bg-white dark:bg-[#04071D]/90 backdrop-blur-xl overflow-hidden hover:border-[#7C3AED]/40 dark:hover:border-purple/50 transition-all duration-300 shadow-md dark:shadow-2xl group">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center p-6 sm:p-10">
                {/* Visual Preview */}
                <div className="lg:col-span-7 relative h-64 sm:h-[380px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-black/40">
                  <Image
                    src={featuredArticle.coverImage}
                    alt={featuredArticle.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                    className="object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-[#04071D] via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-black/70 backdrop-blur-md text-[#CBACF9] border border-white/20">
                      {featuredArticle.category}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/20 backdrop-blur-md text-emerald-300 border border-emerald-500/40">
                      Live on gphost.eu.cc
                    </span>
                  </div>
                </div>

                {/* Article Info */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div>
                    {/* Metadata Badges: Date when project was created */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-neutral-400 mb-3 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-[#7C3AED] dark:text-purple font-medium bg-purple-50 dark:bg-purple/10 px-2.5 py-1 rounded-md border border-purple-200 dark:border-purple/20">
                        <FaCalendarDays className="w-3 h-3 text-[#7C3AED] dark:text-purple" />
                        <span>Published: {featuredArticle.publishedDate || "September 14, 2026"}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-neutral-400 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/[0.08]">
                        <FaClock className="w-3 h-3 text-slate-500 dark:text-neutral-400" />
                        <span>{featuredArticle.readingTime || "4 min read"}</span>
                      </span>
                    </div>

                    <h2 id="featured-article-title" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[#7C3AED] dark:group-hover:text-purple transition-colors duration-200">
                      <Link href={`/blog/${featuredArticle.slug}`}>
                        {featuredArticle.title}
                      </Link>
                    </h2>

                    <p className="text-sm text-slate-600 dark:text-neutral-300 mb-6 leading-relaxed">
                      {featuredArticle.subtitle}
                    </p>

                    <div className="mb-6 flex flex-wrap gap-1.5">
                      {featuredArticle.technologies.slice(0, 5).map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/[0.06]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap pt-4 border-t border-slate-200/80 dark:border-white/[0.08]">
                    <Link
                      href={`/blog/${featuredArticle.slug}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white dark:bg-purple dark:text-black dark:hover:bg-purple/90 font-semibold text-xs sm:text-sm transition-all shadow-md shadow-slate-900/10 dark:shadow-purple/20"
                    >
                      <span>Read Deep Dive</span>
                      <FaArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {featuredArticle.liveUrl && (
                      <a
                        href={featuredArticle.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-800 dark:text-white text-xs sm:text-sm font-medium border border-slate-200 dark:border-white/[0.1] transition-all"
                      >
                        <span>Visit Site</span>
                        <FaLocationArrow className="w-3 h-3 text-[#7C3AED] dark:text-purple" />
                      </a>
                    )}

                    {featuredArticle.githubUrl && (
                      <a
                        href={featuredArticle.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-800 dark:text-white border border-slate-200 dark:border-white/[0.1] transition-all"
                        title="GitHub Repository"
                      >
                        <FaGithub className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Regular Articles Catalog */}
        <section aria-labelledby="all-articles-title">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h2 id="all-articles-title" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                All Engineering Case Studies &amp; Teardowns
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                Explore architectural decisions, challenges, and validated results
              </p>
            </div>
            <span className="text-xs font-mono text-[#7C3AED] dark:text-purple px-3 py-1 rounded-full bg-purple-50 dark:bg-purple/10 border border-purple-200 dark:border-purple/30">
              {articles.length} Technical Articles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularArticles.map((article) => (
              <article
                key={article.slug}
                className="flex flex-col justify-between rounded-2xl p-5 bg-white dark:bg-[#04071D] border border-slate-200/90 dark:border-white/[0.08] hover:border-[#7C3AED]/40 dark:hover:border-purple/40 transition-all duration-300 group hover:-translate-y-1 shadow-sm dark:shadow-lg"
              >
                <div>
                  <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.06] mb-4 bg-slate-100 dark:bg-black/40">
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-neutral-400 mb-2.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple/10 text-[#7C3AED] dark:text-purple font-mono font-medium border border-purple-200 dark:border-purple/20">
                      {article.category.split("&")[0].trim()}
                    </span>
                    {article.publishedDate && (
                      <span className="flex items-center gap-1 font-mono text-slate-500 dark:text-neutral-400">
                        <FaCalendarDays className="w-2.5 h-2.5 text-slate-400 dark:text-neutral-500" />
                        <span>{article.publishedDate}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#7C3AED] dark:group-hover:text-purple transition-colors duration-200 mb-2 line-clamp-2">
                    <Link href={`/blog/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 mb-4 line-clamp-3 leading-relaxed">
                    {article.subtitle}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.technologies.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-white/[0.06]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 dark:border-white/[0.06]">
                    <Link
                      href={`/blog/${article.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] dark:text-purple group-hover:translate-x-1 transition-transform duration-200"
                    >
                      <span>Read Deep Dive</span>
                      <FaArrowRight className="w-3 h-3" />
                    </Link>

                    {article.liveUrl && (
                      <a
                        href={article.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                        title="Live Site"
                      >
                        Live Demo ↗
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
