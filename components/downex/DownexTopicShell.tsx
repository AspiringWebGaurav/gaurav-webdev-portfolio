import React from "react";
import Link from "next/link";
import DownexLegalLayout from "@/components/downex/DownexLegalLayout";
import { Download, ArrowRight } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import {
  DOWNEX_ORIGIN,
  DOWNEX_DESKTOP_DOWNLOAD_URL,
  DOWNEX_GITHUB_URL,
  DOWNEX_TOPIC_PAGES,
  buildDownexBreadcrumbJsonLd,
  buildDownexSoftwareJsonLd,
} from "@/lib/data/downex-seo";

interface DownexTopicShellProps {
  slug: string;
  title: string;
  badge: string;
  summary: string;
  lastUpdated?: string;
  extraJsonLd?: Record<string, unknown>[];
  children: React.ReactNode;
}

export default function DownexTopicShell({
  slug,
  title,
  badge,
  summary,
  lastUpdated = "November 27, 2026",
  extraJsonLd = [],
  children,
}: DownexTopicShellProps) {
  const breadcrumbJsonLd = buildDownexBreadcrumbJsonLd([
    { name: "Downex Download Manager", url: DOWNEX_ORIGIN },
    { name: title, url: `${DOWNEX_ORIGIN}${slug}` },
  ]);
  const softwareJsonLd = buildDownexSoftwareJsonLd();

  const relatedGuides = DOWNEX_TOPIC_PAGES.filter((p) => p.slug !== slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      {extraJsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <DownexLegalLayout
        title={title}
        badge={badge}
        lastUpdated={lastUpdated}
        summary={summary}
      >
        <div className="rounded-2xl border border-violet-200/80 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-950/20 p-5 space-y-3">
          <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
            {badge}
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {summary}
          </p>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <a
              href={DOWNEX_DESKTOP_DOWNLOAD_URL}
              download="DownexSetup.exe"
              data-downex-bypass="true"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Downex (Windows 10/11)</span>
            </a>
            <a
              href={DOWNEX_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              <FaGithub className="w-3.5 h-3.5" />
              <span>GitHub Source</span>
            </a>
            <Link
              href="/#download"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              <span>Installer &amp; Extension</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {children}

        {/* Cross-linking Related Guides for Clean Search Crawling */}
        <section className="pt-8 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
            More Downex Guides &amp; Documentation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {relatedGuides.map((guide) => (
              <Link
                key={guide.slug}
                href={guide.slug}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 hover:border-violet-500/40 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors"
              >
                <span className="truncate">{guide.shortTitle}</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      </DownexLegalLayout>
    </>
  );
}
