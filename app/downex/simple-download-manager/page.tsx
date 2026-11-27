import type { Metadata } from "next";
import DownexTopicShell from "@/components/downex/DownexTopicShell";
import {
  DOWNEX_OG_IMAGE_URL,
  DOWNEX_ORIGIN,
  DOWNEX_TOPIC_PAGES,
} from "@/lib/data/downex-seo";

const pageMeta = DOWNEX_TOPIC_PAGES.find((p) => p.slug === "/simple-download-manager")!;

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

export default function SimpleDownloadManagerPage() {
  return (
    <DownexTopicShell
      slug={pageMeta.slug}
      title="Simple Download Manager for Windows — Clean, Fast & Easy"
      badge={pageMeta.badge}
      summary={pageMeta.summary}
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Why Most Windows Download Managers Feel Cluttered
        </h2>
        <p>
          Many download accelerators pack dozens of legacy toolbars, site grabbers, media converter upsells, and cryptic menus just to download a 4 GB ISO or MKV file. Downex was designed around one goal:{" "}
          <strong>a genuinely simple download manager</strong> where installing once gives you fast parallel downloads, clean folder selection, reliable pause/resume, and automatic completion prompts without learning complex settings.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          What Makes Downex Simple Yet Fast
        </h2>
        <ul className="list-disc pl-5 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <strong>Instant Grabber Dialog:</strong> Shows file name, verified size, <code className="font-mono text-xs">RESUME OK</code> status, default save path (with optional per-download folder memory + one-click <code className="font-mono text-xs">Default</code> reset), and two clear actions: <strong>Start Download</strong> or <strong>Later</strong>.
          </li>
          <li>
            <strong>Download Complete Notification:</strong> Once finished, opens a non-intrusive card with direct <strong>Open Folder</strong> (pre-selecting the exact file in Explorer) and <strong>Open With...</strong> actions.
          </li>
          <li>
            <strong>Automatic 4 GB Low-RAM Eco Optimization:</strong> On budget laptops or when heavy tasks run, Downex silently disables continuous GPU animations, destroys hidden dialog WebViews after closing, and runs at Below Normal CPU priority so Windows never lags.
          </li>
          <li>
            <strong>Dedicated Spaces Without Confusion:</strong> Active downloads live cleanly in <em>All Downloads</em>, queued batches stay separated in <em>Queues</em>, and live speeds appear cleanly in <em>Speed &amp; Stats</em>.
          </li>
        </ul>
      </section>
    </DownexTopicShell>
  );
}
