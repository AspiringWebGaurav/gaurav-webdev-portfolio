import type { Metadata } from "next";
import DownexTopicShell from "@/components/downex/DownexTopicShell";
import {
  DOWNEX_OG_IMAGE_URL,
  DOWNEX_ORIGIN,
  DOWNEX_TOPIC_PAGES,
} from "@/lib/data/downex-seo";

const pageMeta = DOWNEX_TOPIC_PAGES.find(
  (p) => p.slug === "/open-source-download-manager"
)!;

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

export default function OpenSourceDownloadManagerPage() {
  return (
    <DownexTopicShell
      slug={pageMeta.slug}
      title="Free Open Source Download Manager Built in Rust & Tauri"
      badge={pageMeta.badge}
      summary={pageMeta.summary}
    >
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Transparent Native Engineering (Rust Tokio + React UI)
        </h2>
        <p>
          A download manager sees every installer, archive, and link you pull from the web — so closed-source binaries bundled with adware are an unnecessary risk. Downex is an{" "}
          <strong>open-source Windows download manager</strong> combining a multi-threaded Rust async engine with a crisp Tauri v2 + React TypeScript desktop interface and SQLite WAL persistence.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Under the Hood: Key Subsystems
        </h2>
        <ul className="list-disc pl-5 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <strong>Multi-Socket Pool &amp; Work Stealing:</strong> Opens independent HTTP/1.1 sockets via <code className="font-mono text-xs">reqwest</code> with <code className="font-mono text-xs">tcp_nodelay</code>, dynamically reassigning tail-end byte ranges when faster workers finish early.
          </li>
          <li>
            <strong>Crash-Safe Staging Engine:</strong> Writes segments directly at exact file offsets into <code className="font-mono text-xs">unconfirmed.&lt;file&gt;.downex</code> before verifying byte length and promoting atomically to the final filename.
          </li>
          <li>
            <strong>Cryptographic OTA Updates:</strong> Releases are encrypted in <code className="font-mono text-xs">DWNX_OTA</code> AES-256-GCM containers signed with Ed25519 Minisign keys and verified offline before patching, with automatic boot probation rollback if anything fails.
          </li>
          <li>
            <strong>Adaptive Low-RAM Protection:</strong> Live Win32 telemetry (<code className="font-mono text-xs">GlobalMemoryStatusEx</code> and <code className="font-mono text-xs">GetSystemTimes</code>) keeps normal PCs at full 32-stream speed while automatically throttling memory and UI load on 4 GB laptops or heavy workloads.
          </li>
        </ul>
      </section>
    </DownexTopicShell>
  );
}
