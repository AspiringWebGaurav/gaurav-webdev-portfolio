import type { Metadata } from "next";
import Link from "next/link";
import CpLegalLayout from "@/components/cp/CpLegalLayout";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "How to Use & Manual | CP Engine",
  description:
    "Clean operational guide for CP Engine v0.0.1: installation, SHA-256 checksum verification, fast copy workflow, system tray options, and silent OTA updates.",
  alternates: {
    canonical: "https://cp.apps.gauravpatil.site/how-to-use",
  },
  openGraph: {
    title: "How to Use & Manual | CP Engine",
    description:
      "Get started with CP Engine for Windows. Copy. Paste. Faster.",
    url: "https://cp.apps.gauravpatil.site/how-to-use",
    siteName: "CP Engine",
  },
};

const CP_SHA256 =
  "EE19D1B329E5291E4FFE15461DBC812284349595E724ECB538AE2D76655D582C";

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
      name: "How to Use",
      item: "https://cp.apps.gauravpatil.site/how-to-use",
    },
  ],
};

export default function CpHowToUsePage() {
  return (
    <CpLegalLayout title="How to Use CP Engine" lastUpdated="November 28, 2026">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <p className="text-zinc-900 dark:text-zinc-100 font-medium">
        Fast Windows file copying without changing how you work.
      </p>

      <p>
        CP Engine replaces slow single-threaded Windows Explorer copy stalls with parallel,
        hardware-friendly streaming while preserving your standard{" "}
        <code className="font-mono text-sm">Ctrl+C</code> and{" "}
        <code className="font-mono text-sm">Ctrl+V</code> shortcuts.
      </p>

      {/* 1. Requirements & Install */}
      <section
        id="installation"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          1. System Requirements &amp; Setup
        </h2>
        <p>
          <strong>Requirements.</strong> Windows 10 (1809+) or Windows 11 (64-bit / x64), ~15 MB
          RAM idle footprint, and ~15 MB disk space. No admin rights required for standard
          transfers.
        </p>
        <p>
          <strong>Installing v0.0.1.</strong> Download{" "}
          <code className="font-mono text-sm">cpsetup.exe</code> (~12.01 MB) from the{" "}
          <Link
            href="/"
            prefetch={false}
            className="text-zinc-950 dark:text-zinc-50 underline underline-offset-4 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            CP Engine home page
          </Link>{" "}
          and run the installer. If Windows SmartScreen appears on a new base release, click{" "}
          <strong>More info</strong> &rarr; <strong>Run anyway</strong>.
        </p>
        <p>
          <strong>SHA-256 verification.</strong> Confirm installer integrity in PowerShell with{" "}
          <code className="font-mono text-sm">Get-FileHash cpsetup.exe -Algorithm SHA256</code>:
        </p>
        <p className="font-mono text-xs sm:text-[13px] break-all text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-900 px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
          {CP_SHA256}
        </p>
      </section>

      {/* 2. Everyday Workflow */}
      <section
        id="workflow"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          2. Everyday Workflow
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
          <li>
            <strong>Copy normally:</strong> Select any files or folders in Windows Explorer and
            press <code className="font-mono text-sm">Ctrl+C</code>.
          </li>
          <li>
            <strong>Paste normally:</strong> Open your destination folder or drive and press{" "}
            <code className="font-mono text-sm">Ctrl+V</code>. CP Engine inspects only{" "}
            <code className="font-mono text-sm">CF_HDROP</code> file lists and launches its live
            transfer HUD.
          </li>
          <li>
            <strong>Pause or cancel anytime:</strong> Use <strong>Pause / Resume</strong> to pause
            active threads cleanly without corrupting files, or <strong>Cancel</strong> to stop
            and remove partial fragments.
          </li>
        </ul>
        <p>
          Plain text, passwords, URLs, and screenshots copied to your clipboard are never touched
          or intercepted by CP Engine.
        </p>
      </section>

      {/* 3. Dynamic OTA Updates */}
      <section
        id="dynamic-ota"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          3. Silent Dynamic OTA Updates
        </h2>
        <p>
          Once <code className="font-mono text-sm">v0.0.1</code> is installed, you never need to
          re-run setup installers manually. Background updates verify signed payloads in memory,
          wait in <code className="font-mono text-sm">QUEUED</code> mode if a paste or download is
          active, swap the executable atomically via NTFS, and automatically roll back to the
          prior known-good binary if a probationary boot fails.
        </p>
      </section>

      {/* 4. Tray Controls & Tips */}
      <section
        id="tray-tips"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          4. Tray Controls &amp; Speed Tips
        </h2>
        <p>
          <strong>System tray menu.</strong> Right-click the CP icon near your Windows clock to
          show the HUD, manually check for updates, toggle <strong>Start with Windows</strong>, or{" "}
          <strong>Exit</strong> cleanly.
        </p>
        <p>
          <strong>Best throughput.</strong> Cross-drive copies (for example, internal NVMe to a
          second SSD) reach maximum hardware bandwidth because reads and writes operate on
          separate controllers.
        </p>
        <p>
          For full licensing and security terms, read the{" "}
          <a
            href="/terms"
            className="text-zinc-950 dark:text-zinc-50 underline underline-offset-4 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            Terms of Use
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="text-zinc-950 dark:text-zinc-50 underline underline-offset-4 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            Privacy Policy
          </a>
          .
        </p>
      </section>
    </CpLegalLayout>
  );
}
