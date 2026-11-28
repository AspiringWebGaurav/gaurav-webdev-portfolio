import type { Metadata } from "next";
import CpLegalLayout from "@/components/cp/CpLegalLayout";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Privacy Policy | CP Engine",
  description:
    "Zero-Telemetry Privacy Policy for CP Engine for Windows. Strict CF_HDROP clipboard scoping, zero cloud uploads, and full local control.",
  alternates: {
    canonical: "https://cp.apps.gauravpatil.site/privacy",
  },
  openGraph: {
    title: "Privacy Policy | CP Engine",
    description:
      "CP Engine processes all file copies locally on Windows with zero telemetry, zero analytics, and zero clipboard text inspection.",
    url: "https://cp.apps.gauravpatil.site/privacy",
    siteName: "CP Engine",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "CP Engine",
      item: "https://cp.apps.gauravpatil.site",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Privacy Policy",
      item: "https://cp.apps.gauravpatil.site/privacy",
    },
  ],
};

export default function CpPrivacyPage() {
  return (
    <CpLegalLayout title="Privacy Policy" lastUpdated="November 28, 2026">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <p className="text-zinc-900 dark:text-zinc-100 font-medium">
        Your privacy and local data sovereignty come first.
      </p>

      <p>
        This Privacy Policy explains how CP Engine operates on Microsoft Windows and clarifies what
        data never leaves your computer. CP Engine is architected on a strict local-first,
        zero-telemetry design: no user accounts, no tracking cookies, and no remote file collection.
      </p>

      {/* 1. Zero Telemetry Architecture */}
      <section
        id="zero-telemetry"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          1. Information We Do Not Collect
        </h2>
        <p>
          CP Engine does not include analytics SDKs, crash telemetry beacons, advertising trackers,
          or user behavior profiling. Specifically, CP Engine never collects or transmits:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
          <li>Copied, moved, or inspected filenames, folder trees, or file contents.</li>
          <li>Plain text, code snippets, passwords, URLs, or images stored in your clipboard.</li>
          <li>Hardware identifiers for marketing, personal accounts, or browsing history.</li>
        </ul>
      </section>

      {/* 2. Clipboard Isolation */}
      <section
        id="clipboard-isolation"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          2. Strict Clipboard Isolation
        </h2>
        <p>
          <strong>File drops only.</strong> CP Engine checks clipboard notifications exclusively
          for Windows Explorer <code className="font-mono text-sm">CF_HDROP</code> file-drop
          descriptors. If the clipboard contains text, secrets, passwords, or bitmaps, CP Engine
          ignores the payload immediately without reading its contents.
        </p>
        <p>
          <strong>Instant handle release.</strong> File path descriptors are extracted directly into
          your local transfer queue and the Win32 clipboard handle is closed immediately so normal
          desktop applications remain unaffected.
        </p>
      </section>

      {/* 3. Network Activity */}
      <section
        id="network-requests"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          3. Minimal Network Requests (Updates Only)
        </h2>
        <p>
          Local file transfers transmit <strong>0 bytes</strong> over the network. The only
          outbound HTTPS requests CP Engine initiates are anonymous release manifest checks and
          signed binary update downloads from{" "}
          <code className="font-mono text-sm">https://gphost.eu.cc</code> (backed by Cloudflare R2
          edge infrastructure).
        </p>
        <p>
          Update requests transmit standard HTTP transport headers required by TLS/CDN routing
          without personally identifiable tokens, telemetry cookies, or local path metadata.
        </p>
      </section>

      {/* 4. Local Footprint */}
      <section
        id="local-footprint"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          4. Local State &amp; Clean Uninstallation
        </h2>
        <p>
          CP Engine stores minimal operational state locally inside{" "}
          <code className="font-mono text-sm">%LOCALAPPDATA%\CP</code> (such as{" "}
          <code className="font-mono text-sm">installed_version.txt</code>,{" "}
          <code className="font-mono text-sm">update_lifecycle.json</code>,{" "}
          <code className="font-mono text-sm">quarantine.json</code>, and{" "}
          <code className="font-mono text-sm">executed_directives.json</code>) solely to keep OTA
          updates resilient and replay-safe.
        </p>
        <p>
          When you uninstall CP Engine via Windows Settings or{" "}
          <code className="font-mono text-sm">uninstall.exe</code>, the uninstaller closes running
          background processes silently, removes shortcuts and registry keys, deletes local state,
          and never opens external survey webpages or tracking redirects.
        </p>
      </section>

      {/* 5. Compliance & Contact */}
      <section
        id="compliance"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          5. Regulatory Alignment &amp; Disclosure
        </h2>
        <p>
          Because CP Engine does not collect, sell, or store personal data under GDPR, CCPA/CPRA,
          or COPPA, your machine remains strictly under your own control.
        </p>
        <p>
          If you have security questions or wish to report a disclosure, contact{" "}
          <a
            href="mailto:hello@gauravpatil.site"
            className="text-zinc-950 dark:text-zinc-50 underline underline-offset-4 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            hello@gauravpatil.site
          </a>
          .
        </p>
      </section>
    </CpLegalLayout>
  );
}
