import type { Metadata } from "next";
import DownexLegalLayout from "@/components/downex/DownexLegalLayout";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Privacy & Policies | Downex Download Manager",
  description:
    "Official Privacy Policy for Downex Download Manager: 100% Zero-Telemetry, local processing only, and complete data wipe support.",
  openGraph: {
    title: "Privacy & Policies | Downex Download Manager",
    description:
      "Downex Privacy Policy: Zero tracking, local memory clipboard inspection, private localhost IPC, and full wipe support.",
    url: "https://downex.apps.gauravpatil.site/privacy",
    siteName: "Downex",
  },
};

export default function DownexPrivacyPage() {
  return (
    <DownexLegalLayout
      title="Privacy & Policies"
      lastUpdated="November 24, 2026"
    >
      <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
        Thank you for using Downex!
      </p>

      <p>
        At Downex, privacy is not an afterthought&mdash;it is the fundamental architectural principle of the software. This Privacy Policy explains our zero-telemetry architecture and how your data remains completely private and local when you use Downex Download Manager, our companion browser extension, and related local tools.
      </p>

      {/* 1. Zero-Telemetry Commitment */}
      <section id="telemetry" tabIndex={-1} className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          1. Our Zero-Telemetry Commitment
        </h2>
        <p>
          <strong>No analytics SDKs.</strong> Downex does not include or load Google Analytics, Mixpanel, Sentry, telemetry trackers, or advertising frameworks in its desktop applications, background daemons, or browser extensions.
        </p>
        <p>
          <strong>No activity tracking.</strong> We do not record, monitor, or transmit your download URLs, file names, file sizes, transfer speeds, or browsing history to any remote server.
        </p>
        <p>
          <strong>No account requirement.</strong> Downex operates completely anonymously. You do not need to register, provide an email address, or create an account to download files at maximum speed.
        </p>
      </section>

      {/* 2. Local Workstation Processing */}
      <section id="local-processing" tabIndex={-1} className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          2. Local Workstation Processing
        </h2>
        <p>
          <strong>Clipboard link detection.</strong> When clipboard link auto-detection is enabled in your Settings, Downex monitors the Windows clipboard strictly in volatile memory (RAM) to detect valid web download links (<code className="font-mono text-sm px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">http://</code>, <code className="font-mono text-sm px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">https://</code>). Any clipboard contents that are not download URLs are instantly discarded without reading, caching, or logging. Clipboard data is never saved to disk and never leaves your computer.
        </p>
        <p>
          <strong>Local database storage.</strong> Your download task history, custom queue order, and aggregate bandwidth statistics are stored exclusively in a local SQLite database (<code className="font-mono text-sm px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">downex.db</code>) located in your personal Windows AppData folder (<code className="font-mono text-sm px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">%LOCALAPPDATA%\com.downex.manager</code>). This data is completely private to your local user profile.
        </p>
      </section>

      {/* 3. Browser Companion Extension */}
      <section id="extension" tabIndex={-1} className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          3. Browser Companion Extension Scope
        </h2>
        <p>
          <strong>Local loopback IPC.</strong> The optional browser extension for Chromium browsers communicates exclusively with your local Downex desktop engine over a loopback socket (<code className="font-mono text-sm px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">http://127.0.0.1:18888</code>).
        </p>
        <p>
          <strong>Zero web page inspection.</strong> The extension intercepts only native browser file download events. It does not inspect, read, or transmit your browsing history, webpage content, form inputs, cookies, or credentials.
        </p>
      </section>

      {/* 4. Software Updates */}
      <section id="security" tabIndex={-1} className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500 relative">
        <span id="updates" className="absolute -top-20 block h-0 w-0 opacity-0 pointer-events-none" />
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          4. Software Updates &amp; Network Requests
        </h2>
        <p>
          <strong>Minimal update checks.</strong> To verify that your software is up to date, Downex performs a periodic HTTP GET request for a signed release manifest hosted on high-speed mirrors (Cloudflare R2). No hardware serial numbers, device fingerprints, or user identifiers are collected or stored during update checks.
        </p>
        <p>
          <strong>In-memory verification.</strong> All software updates are cryptographically validated in memory before any files are written to disk.
        </p>
      </section>

      {/* 5. Data Retention & Uninstallation */}
      <section id="retention" tabIndex={-1} className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          5. Data Retention &amp; Uninstallation
        </h2>
        <p>
          Because Downex does not store any of your data on remote servers, you maintain complete control over data retention:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Preserve history (Default):</strong> When uninstalling, you can choose to preserve your task database and completed downloads so they are immediately available if you reinstall in the future.</li>
          <li><strong>Complete clean wipe:</strong> You can choose the clean wipe option in the uninstaller (<code className="font-mono text-sm px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">uninstall.exe</code>) to permanently delete all application binaries, task databases, configuration files, and temporary cache from your computer.</li>
          <li><strong>Completed files:</strong> Your downloaded files in your personal Downloads folder are never removed automatically during uninstallation.</li>
        </ul>
      </section>

      {/* 6. Third-Party Download Sources */}
      <section id="third-party" tabIndex={-1} className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          6. Third-Party Download Sources
        </h2>
        <p>
          When you download a file, Downex establishes a direct TCP socket connection to the third-party server hosting that file. That server receives your IP address and standard HTTP request headers necessary to complete the file transfer. Those third-party hosts operate under their own privacy policies.
        </p>
      </section>

      {/* 7. Contact Us */}
      <section id="contact" tabIndex={-1} className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500 relative">
        <span id="privacy" className="absolute -top-20 block h-0 w-0 opacity-0 pointer-events-none" />
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          7. Contact Us
        </h2>
        <p>
          If you have any questions about this Privacy Policy or wish to report a security disclosure, please contact the developer directly at{" "}
          <a
            href="mailto:hello@gauravpatil.site"
            className="font-medium underline underline-offset-3 hover:text-black dark:hover:text-white"
          >
            hello@gauravpatil.site
          </a>.
        </p>
      </section>
    </DownexLegalLayout>
  );
}
