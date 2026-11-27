import type { Metadata } from "next";
import DownexTopicShell from "@/components/downex/DownexTopicShell";
import {
  DOWNEX_COMPARISON_ROWS,
  DOWNEX_OG_IMAGE_URL,
  DOWNEX_ORIGIN,
  DOWNEX_TOPIC_PAGES,
  buildDownexFaqJsonLd,
} from "@/lib/data/downex-seo";

const pageMeta = DOWNEX_TOPIC_PAGES.find((p) => p.slug === "/idm-alternative")!;

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

const idmFaqs = [
  {
    question: "Is Downex genuinely a free IDM alternative without trial limits?",
    answer:
      "Yes. Unlike Internet Download Manager (which expires after a 30-day trial unless purchased), Downex is permanently free and open source for Windows 10 and Windows 11 with no serial nag dialogs.",
  },
  {
    question: "Can Downex reach the same multi-connection speeds as IDM?",
    answer:
      "Yes. Downex opens up to 32 parallel HTTP/1.1 TCP streams with dynamic segment work stealing, saturating 100 Mbps to 1 Gbps connections when servers support byte-range requests.",
  },
  {
    question: "What does Downex do better than legacy Windows download managers?",
    answer:
      "Downex pairs a Rust + SQLite WAL download engine with a clean Light/Dark modern UI, dedicated 1-by-1 sequential Queue tab, automatic 4 GB Low-RAM Eco mode, and cryptographic Ed25519 silent background updates.",
  },
];

export default function IdmAlternativePage() {
  return (
    <DownexTopicShell
      slug={pageMeta.slug}
      title="Free & Open Source IDM Alternative for Windows 10 & 11"
      badge={pageMeta.badge}
      summary={pageMeta.summary}
      extraJsonLd={[buildDownexFaqJsonLd(idmFaqs)]}
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Why Users Look for a Free IDM Alternative on Windows
        </h2>
        <p>
          Internet Download Manager (IDM) popularized segmented HTTP acceleration on Windows, but its 30-day evaluation nag screens, serial key licensing checks, and dated toolbar interface leave many users searching for a clean, permanent{" "}
          <strong>free IDM alternative</strong>. Downex gives Windows 10 and Windows 11 users multi-threaded speed and browser capture in a completely free, ad-free desktop application built on Rust and Tauri.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Feature Comparison: Downex vs IDM vs Browser Default
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <th className="py-3 px-4 font-bold">Feature</th>
                <th className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">Downex (Free)</th>
                <th className="py-3 px-4 font-bold text-zinc-600 dark:text-zinc-400">IDM</th>
                <th className="py-3 px-4 font-bold text-zinc-500">Chrome / Edge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {DOWNEX_COMPARISON_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{row.feature}</td>
                  <td className="py-2.5 px-4 text-emerald-700 dark:text-emerald-300 font-medium">{row.downex}</td>
                  <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-400">{row.idm}</td>
                  <td className="py-2.5 px-4 text-zinc-500">{row.browser}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Switching from IDM in Under Two Minutes
        </h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Download and run <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">DownexSetup.exe</code> on Windows 10 or Windows 11.</li>
          <li>Install the Manifest V3 Chromium companion extension once in Chrome, Edge, or Brave to replace browser capture hooks cleanly.</li>
          <li>Click any download link: Downex opens a compact confirmation dialog with folder memory, resume check (<code className="font-mono text-xs">RESUME OK</code>), Start Download, or Later (1-by-1 Queue).</li>
        </ol>
      </section>
    </DownexTopicShell>
  );
}
