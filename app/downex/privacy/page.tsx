import type { Metadata } from "next";
import DownexLegalLayout from "@/components/downex/DownexLegalLayout";
import {
  EyeOff,
  Copy,
  Puzzle,
  HardDrive,
  RefreshCw,
  Trash2,
  Mail,
  Globe,
} from "lucide-react";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Privacy Policy | Downex Download Manager",
  description:
    "Official Privacy Policy for Downex Download Manager: 100% Zero-Telemetry, private clipboard link interception, local loopback IPC, and complete data wipe architecture.",
  openGraph: {
    title: "Privacy Policy | Downex Download Manager",
    description:
      "Downex Download Manager Privacy Policy: Zero tracking, local memory clipboard inspection, private loopback IPC, and full wipe support.",
    url: "https://downex.apps.gauravpatil.site/privacy",
    siteName: "Downex",
  },
};

const privacySections = [
  { id: "privacy", title: "1. Privacy First & Zero Telemetry" },
  { id: "clipboard-privacy", title: "2. Local Clipboard Link Detection" },
  { id: "extension-privacy", title: "3. Companion Browser Extension Scope" },
  { id: "file-storage", title: "4. Local File Storage & Metadata" },
  { id: "dynamic-updates", title: "5. Silent Dynamic Edge Updates" },
  { id: "uninstall-wipe", title: "6. Data Retention & Complete Wipe" },
  { id: "third-party", title: "7. Third-Party Download Sources" },
  { id: "contact", title: "8. Contact & Security Inquiries" },
];

export default function DownexPrivacyPage() {
  return (
    <DownexLegalLayout
      title="Privacy Policy & Data Security"
      badge="Zero Telemetry &bull; Local-First Architecture"
      lastUpdated="November 2026"
      summary="Downex is built with an uncompromising privacy-first philosophy. We do not track you, we do not log your downloads, and we collect zero personal data. All processing, link capture, and file operations remain 100% local to your device."
      sections={privacySections}
    >
      {/* 1. Privacy First & Zero Telemetry */}
      <section id="privacy" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <EyeOff className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            1. Privacy First &amp; Zero Telemetry
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Downex adheres to a strict <strong>Zero Telemetry</strong> architecture. Unlike conventional download managers that embed behavioral analytics, tracking beacons, advertising networks, or usage statistics SDKs, Downex contains:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li><strong>Zero Analytics SDKs:</strong> No Google Analytics, Mixpanel, Sentry, or third-party telemetry libraries are bundled into the desktop binaries or background services.</li>
          <li><strong>Zero Activity Logs:</strong> Your download history, file names, URLs, transfer volumes, and timestamps are never transmitted to us or any remote server.</li>
          <li><strong>Zero Account Requirement:</strong> Downex requires no account registration, login credentials, or phone/email validation. The application operates entirely anonymously.</li>
        </ul>
      </section>

      {/* 2. Clipboard Link Detection */}
      <section id="clipboard-privacy" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Copy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            2. Local Clipboard Link Detection
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          When the <em>Clipboard link auto-detection</em> setting is enabled by the user, Downex monitors the Windows clipboard to detect when valid web download links (<code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">http://</code>, <code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">https://</code>) are copied.
        </p>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          This inspection occurs <strong>strictly in volatile local memory (RAM)</strong>. Clipboard content that does not represent a download URL is discarded immediately without inspection, caching, or logging. Clipboard data never leaves your workstation and is never written to disk or transmitted over the network.
        </p>
      </section>

      {/* 3. Companion Browser Extension Scope */}
      <section id="extension-privacy" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Puzzle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            3. Companion Browser Extension Scope
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          The companion browser extension (packaged inside <code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">%LOCALAPPDATA%\Downex\browser-extension</code>) is designed with minimal attack surface:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li><strong>Local Loopback IPC:</strong> Intercepted download links are forwarded strictly to your local Downex daemon over localhost (<code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">http://127.0.0.1:18888</code>).</li>
          <li><strong>Zero Remote Communication:</strong> The extension makes no external HTTP requests to remote analytics, ad trackers, or third-party servers.</li>
          <li><strong>Zero Page Content Inspection:</strong> The extension does not read form inputs, cookies, passwords, or webpage DOM contents. It intercepts only native browser download requests.</li>
        </ul>
      </section>

      {/* 4. Local File Storage & Metadata */}
      <section id="file-storage" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            4. Local File Storage &amp; Metadata
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          All application state, active download tasks, and temporary segment chunks are maintained entirely on your local storage:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li><strong>Target Destination:</strong> Complete files are stored in your configured downloads folder (default: <code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">%USERPROFILE%\Downloads\Downex</code>).</li>
          <li><strong>In-Flight Chunks:</strong> Incomplete downloads create atomic staging files (<code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">*.part</code>) in the destination directory until verified and combined.</li>
          <li><strong>Application Configuration:</strong> User preferences (speed limits, connection count, tray minimization) are saved in <code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">%LOCALAPPDATA%\Downex\settings.json</code>.</li>
        </ul>
      </section>

      {/* 5. Dynamic Edge Updates */}
      <section id="dynamic-updates" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <RefreshCw className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            5. Silent Dynamic Edge Updates
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          To ensure security and stability, Downex periodically checks for software updates against our edge release distribution network (hosted on Cloudflare R2 / GPHost high-speed mirrors):
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li><strong>Standard HTTP GET Request:</strong> Update checks perform a simple HTTP GET for the signed release manifest. No device identifiers, IP geolocation queries, or hardware fingerprints are stored.</li>
          <li><strong>In-Memory Cryptographic Verification:</strong> Downloaded update containers (<code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">.bin</code>) are verified in memory with AES-256 decryption, PE MZ headers (<code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">0x4D, 0x5A</code>), and AMD64 architecture checks before installation.</li>
          <li><strong>Zero Unsolicited Interruption:</strong> Update operations occur silently in the background without popups, marketing banners, or surveys.</li>
        </ul>
      </section>

      {/* 6. Data Retention & Complete Wipe */}
      <section id="uninstall-wipe" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Trash2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            6. Local Database Persistence &amp; Uninstallation Retention Policy
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Because Downex stores zero data remotely on any cloud server, you retain 100% control over all data retention on your physical computer:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            <strong>True Local SQLite Persistence:</strong> All task queue lifecycles, active/paused download states, total volume statistics, peak speeds, and lifetime throughput counters are saved strictly in your local SQLite database (<code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">downex.db</code>) located in <code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">%LOCALAPPDATA%\com.downex.manager</code>.
          </li>
          <li>
            <strong>Option 1: Keep Downloaded Files &amp; History (Recommended):</strong> When uninstalling Downex, choosing this option removes the application executable and background service while preserving your downloaded files, task queue database, and historical telemetry intact on your local drive. If you reinstall Downex later, your full download history and statistics resume instantly.
          </li>
          <li>
            <strong>Option 2: Delete App &amp; Settings:</strong> Removes the application binaries and clears local settings and temporary cache.
          </li>
          <li>
            <strong>Option 3: Complete Clean Wipe (Irreversible):</strong> Running the official uninstaller (<code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-xs">uninstall.exe</code>) with the clean wipe option permanently removes all binaries, local task databases, staged chunks, registry autostart keys, and firewall rules. Zero residual traces remain.
          </li>
          <li>
            <strong>Preservation of Completed Files:</strong> Your already-downloaded personal files in your configured Downloads folder are never deleted unless you manually choose to remove them from your file manager.
          </li>
        </ul>
      </section>

      {/* 7. Third-Party Download Sources */}
      <section id="third-party" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            7. Third-Party Download Sources
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          When Downex downloads a file on your behalf, it connects directly to the third-party server hosting that file. These third-party servers receive your IP address, user-agent string, and standard HTTP range request headers necessary to fulfill the transfer.
        </p>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          We encourage you to review the privacy policies of the external websites and servers from which you choose to download files.
        </p>
      </section>

      {/* 8. Contact & Security */}
      <section id="contact" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            8. Contact &amp; Security Inquiries
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          If you have questions regarding this Privacy Policy, data privacy practices, or wish to report a security disclosure:
        </p>
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-2">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Gaurav Patil &bull; Downex Security &amp; Privacy
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
            Website: <a href="https://gauravpatil.site" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">https://gauravpatil.site</a>
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
            Portal: <a href="https://downex.apps.gauravpatil.site" className="text-emerald-600 dark:text-emerald-400 hover:underline">https://downex.apps.gauravpatil.site</a>
          </div>
        </div>
      </section>
    </DownexLegalLayout>
  );
}
