import type { Metadata } from "next";
import DownexTopicShell from "@/components/downex/DownexTopicShell";
import {
  DOWNEX_EXTENSION_DOWNLOAD_URL,
  DOWNEX_OG_IMAGE_URL,
  DOWNEX_ORIGIN,
  DOWNEX_TOPIC_PAGES,
} from "@/lib/data/downex-seo";

const pageMeta = DOWNEX_TOPIC_PAGES.find((p) => p.slug === "/browser-extension")!;

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

export default function BrowserExtensionPage() {
  return (
    <DownexTopicShell
      slug={pageMeta.slug}
      title="Auto-Catch Download Extension for Chrome, Edge & Brave"
      badge={pageMeta.badge}
      summary={pageMeta.summary}
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Zero-Bloat Manifest V3 Browser Integration
        </h2>
        <p>
          Many browser download extensions inject heavy video overlays or advertising trackers onto every web page you visit. Downex takes a strictly{" "}
          <strong>UI-less Manifest V3</strong> approach: minimal background link catching, context-menu integration (&ldquo;Download with Downex&rdquo;), and authenticated local loopback handshakes (`127.0.0.1:18888`).
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          How to Install in 3 Quick Steps
        </h2>
        <ol className="list-decimal pl-5 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            Download and extract{" "}
            <a
              href={DOWNEX_EXTENSION_DOWNLOAD_URL}
              download="downex-browser-extension.zip"
              data-downex-bypass="true"
              className="text-emerald-700 dark:text-emerald-400 font-semibold underline underline-offset-4"
            >
              downex-browser-extension.zip
            </a>{" "}
            to a permanent folder on your PC.
          </li>
          <li>
            Open <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">chrome://extensions</code> (or <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">edge://extensions</code> / <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">brave://extensions</code>) and enable <strong>Developer mode</strong>.
          </li>
          <li>
            Click <strong>Load unpacked</strong> and select the extracted folder. Every large file download you start in your browser now hands off straight to Downex automatically.
          </li>
        </ol>
      </section>
    </DownexTopicShell>
  );
}
