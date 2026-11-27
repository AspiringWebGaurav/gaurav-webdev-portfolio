import type { Metadata } from "next";
import DownexTopicShell from "@/components/downex/DownexTopicShell";
import {
  DOWNEX_FAQS,
  DOWNEX_OG_IMAGE_URL,
  DOWNEX_ORIGIN,
  DOWNEX_TOPIC_PAGES,
  buildDownexFaqJsonLd,
} from "@/lib/data/downex-seo";

const pageMeta = DOWNEX_TOPIC_PAGES.find((p) => p.slug === "/faq")!;

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  metadataBase: new URL(DOWNEX_ORIGIN),
  title: { absolute: pageMeta.title },
  description: pageMeta.description,
  keywords: pageMeta.keywords,
  alternates: { canonical: `${DOWNEX_ORIGIN}${pageMeta.slug}` },
  openGraph: {
    title: pageMeta.title,
    description: pageMeta.description,
    url: `${DOWNEX_ORIGIN}${pageMeta.slug}`,
    siteName: "Downex",
    images: [{ url: DOWNEX_OG_IMAGE_URL, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: pageMeta.title,
    description: pageMeta.description,
    images: [DOWNEX_OG_IMAGE_URL],
  },
};

export default function DownexFaqPage() {
  return (
    <DownexTopicShell
      slug={pageMeta.slug}
      title="Downex Download Manager — Frequently Asked Questions"
      badge={pageMeta.badge}
      summary={pageMeta.summary}
      extraJsonLd={[buildDownexFaqJsonLd(DOWNEX_FAQS)]}
    >
      <section className="space-y-4">
        {DOWNEX_FAQS.map((faq) => (
          <article
            key={faq.question}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-5 space-y-2"
          >
            <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50">
              {faq.question}
            </h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {faq.answer}
            </p>
          </article>
        ))}
      </section>
    </DownexTopicShell>
  );
}
