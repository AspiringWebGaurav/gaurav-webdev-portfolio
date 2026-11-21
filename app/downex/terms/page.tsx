import type { Metadata } from "next";
import DownexLegalLayout from "@/components/downex/DownexLegalLayout";
import {
  Scale,
  Zap,
  RefreshCw,
  Cpu,
  FileCheck,
  AlertTriangle,
  Lock,
  Puzzle,
} from "lucide-react";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Terms of Service | Downex Download Manager",
  description:
    "Official Terms of Service governing the use of Downex Download Manager for Windows, the browser companion extension, and dynamic edge OTA updates.",
  openGraph: {
    title: "Terms of Service | Downex Download Manager",
    description:
      "Terms of Service governing Downex Desktop v0.0.1 and Dynamic OTA Updates.",
    url: "https://downex.apps.gauravpatil.site/terms",
    siteName: "Downex",
  },
};

const termsSections = [
  { id: "terms", title: "1. Acceptance of Terms" },
  { id: "scope", title: "2. Architecture & Service Scope" },
  { id: "acceleration", title: "3. Multi-Connection Download Acceleration" },
  { id: "extension", title: "4. Browser Companion Extension" },
  { id: "updates", title: "5. Silent Dynamic OTA Updates" },
  { id: "license", title: "6. License Grant & Open Standards" },
  { id: "acceptable-use", title: "7. Acceptable Use & User Responsibility" },
  { id: "disclaimer", title: "8. Disclaimers & Warranties" },
  { id: "liability", title: "9. Limitation of Liability" },
  { id: "governing-law", title: "10. Governing Law & Amendments" },
];

export default function DownexTermsPage() {
  return (
    <DownexLegalLayout
      title="Terms of Service & Licensing Agreement"
      badge="Release v0.0.1 Foundation &bull; Dynamic Updates"
      lastUpdated="November 2026"
      summary="These Terms of Service govern your installation and operation of Downex Desktop Application, its browser companion extension, and the dynamic over-the-air update daemon on Microsoft Windows. By installing or launching Downex, you agree to these operating standards."
      sections={termsSections}
    >
      {/* 1. Acceptance */}
      <section id="terms" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            1. Acceptance of Terms
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          By downloading, installing, or executing <strong>Downex Desktop Manager</strong> (including all binary executables, background supervisor services, and companion browser extensions), you enter into a legally binding agreement governed by these Terms of Service. If you do not accept these terms in full, do not install or execute Downex.
        </p>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Downex is designed as an independent, lightweight, client-side utility engineered for high-performance parallel stream downloading, local task management, and silent system tray operation.
        </p>
      </section>

      {/* 2. Scope & Architecture */}
      <section id="scope" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            2. Architecture &amp; Service Scope
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Downex operates entirely on your physical workstation:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <strong>Core Desktop Engine:</strong> A native Win32/Tauri 2 binary that manages parallel TCP socket connections, file segment assembly, and storage allocation.
          </li>
          <li>
            <strong>Background Tray Supervisor:</strong> An auxiliary system tray process (<code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">DownexService.exe</code>) providing seamless link capture and process supervision.
          </li>
          <li>
            <strong>Local IPC Loopback:</strong> An encrypted local loopback server (<code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">127.0.0.1:18888</code>) communicating exclusively with authorized local client processes.
          </li>
        </ul>
      </section>

      {/* 3. Multi-Connection Download Acceleration */}
      <section id="acceleration" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            3. Multi-Connection Download Acceleration
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Downex optimizes file transfers by partitioning compliant HTTP/HTTPS downloads into segmented parallel range requests (<code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">Range: bytes=X-Y</code>):
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs">
            <div className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Server Range Compliance</div>
            <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
              Segmented acceleration operates strictly with servers that support byte-range requests. For non-compliant hosts, Downex automatically falls back to single-stream downloading.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs">
            <div className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Bandwidth &amp; Resource Usage</div>
            <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
              Users can configure concurrent thread limits (4, 8, 16, or 32 threads) within Settings to prevent overloading low-bandwidth networks or remote servers.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Browser Companion Extension */}
      <section id="extension" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Puzzle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            4. Browser Companion Extension
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Downex includes an optional unpackaged browser extension for Chromium browsers (Google Chrome, Microsoft Edge, Brave, Opera). When enabled, the extension intercepts native browser file download events and transfers the target URL, headers, and destination to the local Downex engine via localhost IPC. The extension does not inspect, read, or transmit your browsing history, cookies, or web content.
        </p>
      </section>

      {/* 5. Dynamic OTA Updates */}
      <section id="updates" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <RefreshCw className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            5. Silent Dynamic OTA Updates &amp; Autonomous Rescue
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Downex implements an autonomous in-process update pipeline:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <strong>Silent Multi-Vector Checks:</strong> The background supervisor periodically queries cryptographic release manifests hosted on Cloudflare R2 edge storage.
          </li>
          <li>
            <strong>User Activity Guard:</strong> Updates defer automatically while active user interaction or file downloads are running, applying updates only after 5 seconds of continuous system idle.
          </li>
          <li>
            <strong>Automated Rescue Dispatch:</strong> In the event that a new binary experiences consecutive startup failures, DownexRecovery automatically quarantines the build, blacklists that version, and restores the previous verified executable.
          </li>
        </ul>
      </section>

      {/* 6. License Grant */}
      <section id="license" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            6. License Grant &amp; Permitted Use
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          You are granted a personal, non-exclusive, non-transferable license to install, execute, and utilize Downex on compatible Microsoft Windows devices. You may not reverse-engineer, decompile, or weaponize the software for malicious packet flooding or unauthorized extraction of remote network assets.
        </p>
      </section>

      {/* 7. Acceptable Use */}
      <section id="acceptable-use" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            7. Acceptable Use &amp; User Responsibility
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          You are exclusively responsible for all files, media, and data downloaded through Downex. You agree that you will not utilize Downex to violate the intellectual property, copyright, or terms of service of third-party content providers. Downex does not host, curate, index, or endorse any downloaded content.
        </p>
      </section>

      {/* 8. Disclaimers */}
      <section id="disclaimer" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <AlertTriangle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            8. Disclaimers &amp; Warranties
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Downex is provided on an <strong>&ldquo;AS IS&rdquo;</strong> and <strong>&ldquo;AS AVAILABLE&rdquo;</strong> basis without warranties of any kind, whether express, statutory, or implied, including warranties of merchantability, fitness for a particular purpose, or uninterrupted download operation.
        </p>
      </section>

      {/* 9. Liability */}
      <section id="liability" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            9. Limitation of Liability
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          To the maximum extent permitted by applicable law, in no event shall the author or contributors be liable for any direct, indirect, incidental, consequential, or punitive damages arising from the use or inability to use Downex, including data loss, hardware interruption, or third-party server rate-limiting.
        </p>
      </section>

      {/* 10. Governing Law */}
      <section id="governing-law" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            10. Governing Law &amp; Amendments
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          These Terms are governed by applicable local and international software licensing laws. We reserve the right to amend these terms alongside major version milestones. Continued execution of Downex following published revisions constitutes acceptance of updated terms.
        </p>
      </section>
    </DownexLegalLayout>
  );
}
