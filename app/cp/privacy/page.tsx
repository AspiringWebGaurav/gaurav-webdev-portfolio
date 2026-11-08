import type { Metadata } from "next";
import CpLegalLayout from "@/components/cp/CpLegalLayout";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Server,
  HardDrive,
  FileText,
  UserX,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Privacy Policy & Zero-Telemetry Architecture | CP Engine",
  description:
    "Official Enterprise Privacy Policy for CP Engine v0.0.1 (Base Foundation) and Dynamic Edge Updates. Zero user data collection, zero telemetry on clipboard contents, and local-only kernel streaming.",
  openGraph: {
    title: "Privacy Policy | CP Engine",
    description:
      "Airtight Zero-Telemetry guarantee for CP Engine v0.0.1. Local file streaming with zero telemetry.",
    url: "https://cp.apps.gauravpatil.site/privacy",
    siteName: "CP Engine",
  },
};

const privacySections = [
  { id: "philosophy", title: "1. Core Philosophy: Zero-Telemetry Guarantee" },
  { id: "clipboard-isolation", title: "2. Clipboard Inspection Boundaries" },
  { id: "file-content", title: "3. Local Unbuffered File Streaming" },
  { id: "network-traffic", title: "4. Exhaustive Network Request Audit" },
  { id: "local-storage", title: "5. Local Storage & File System Footprint" },
  { id: "dynamic-updates", title: "6. Dynamic Updates & Edge CDN Logs" },
  { id: "third-party", title: "7. Third-Party Edge Infrastructure" },
  { id: "regulatory", title: "8. Global Privacy & Regulatory Compliance" },
  { id: "data-retention", title: "9. Data Retention & Complete Software Removal" },
  { id: "security-contact", title: "10. Security Disclosure & Inquiries" },
];

export default function CpPrivacyPage() {
  return (
    <CpLegalLayout
      title="Privacy Policy & Zero-Telemetry Guarantee"
      badge="Release v0.0.1 Foundation &bull; Zero Telemetry"
      lastUpdated="November 2026"
      summary="CP Engine is engineered from the kernel up to respect user privacy. We enforce an uncompromising zero-telemetry architecture: your clipboard contents, filenames, file paths, and streamed data never leave your local physical machine."
      sections={privacySections}
    >
      {/* 1. Philosophy */}
      <section id="philosophy" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            1. Core Philosophy: Zero-Telemetry Guarantee
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          In an era where modern desktop applications and operating systems routinely collect diagnostic telemetry, user behavior analytics, and metadata, CP Engine is deliberately designed as a <strong>local-first, privacy-preserving utility</strong>.
        </p>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          We maintain that file management and copy/paste interactions represent the most sensitive layer of your workstation. CP Engine does not track your identity, does not record which files you copy, does not measure how often you paste, does not profile your hardware configuration, and does not operate any analytics or tracking SDKs (including Google Analytics, Mixpanel, Sentry, or Firebase Analytics).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs">
            <div className="font-bold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>0% Analytics</span>
            </div>
            <p className="text-emerald-900/80 dark:text-emerald-200/80 text-[11px] leading-snug">
              No tracking code, telemetry daemons, or user identification tokens exist in the binary.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs">
            <div className="font-bold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>100% Local</span>
            </div>
            <p className="text-emerald-900/80 dark:text-emerald-200/80 text-[11px] leading-snug">
              All memory buffers and streaming operations operate strictly in temporary local system RAM.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs">
            <div className="font-bold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Zero Profiling</span>
            </div>
            <p className="text-emerald-900/80 dark:text-emerald-200/80 text-[11px] leading-snug">
              No machine fingerprinting or remote advertising IDs are ever created or queried.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Clipboard Isolation */}
      <section id="clipboard-isolation" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <EyeOff className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            2. Clipboard Inspection Boundaries
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Because CP Engine hooks into the Windows clipboard subsystem to intercept paste operations, we maintain mathematically strict boundaries regarding what data our hooks touch:
        </p>
        <ul className="space-y-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li>
            <strong>Strict Format Filtering:</strong> CP Engine exclusively queries the clipboard for the <code className="font-mono">CF_HDROP</code> format identifier (Standard Windows File Drop Structure).
          </li>
          <li>
            <strong>Text &amp; Password Immunity:</strong> Plaintext strings (<code className="font-mono">CF_TEXT</code>, <code className="font-mono">CF_UNICODETEXT</code>), password manager credentials, cryptographic tokens, bitmap images (<code className="font-mono">CF_BITMAP</code>), and rich HTML markup copied to the clipboard are <strong>completely ignored and bypassed</strong>. CP Engine never opens, inspects, or logs non-file clipboard formats.
          </li>
          <li>
            <strong>Immediate Handle Release:</strong> As soon as file paths are parsed into an active transfer job, the Win32 clipboard handle is immediately closed (<code className="font-mono">CloseClipboard()</code>), allowing other desktop software unhindered access.
          </li>
        </ul>
      </section>

      {/* 3. File Content */}
      <section id="file-content" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            3. Local High-Speed File Streaming
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          When transferring files between folders, drives, or external media, CP Engine streams data locally and directly. Here is how your privacy is protected:
        </p>
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            <strong>Direct Local Streaming:</strong> Data is read directly from your source drive and written to your destination drive without passing through third-party services or persistent staging caches.
          </p>
          <p>
            <strong>Zero Cloud Mirroring:</strong> At no point are your files, documents, photos, or archives transmitted to any external server, cloud proxy, or remote analytics platform. CP Engine has zero remote upload capabilities for user data.
          </p>
          <p>
            <strong>Zero In-Memory Retention:</strong> Temporary memory buffers are cleared and returned to the operating system immediately once each block is written to disk.
          </p>
        </div>
      </section>

      {/* 4. Network Traffic */}
      <section id="network-traffic" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Server className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            4. Exhaustive Network Request Audit
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          For total technical transparency, here is the complete, exhaustive list of every outbound network interaction that the CP Engine desktop client can perform:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <thead className="bg-zinc-100 dark:bg-zinc-900 font-mono text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              <tr>
                <th className="p-3">Purpose</th>
                <th className="p-3">Destination Endpoint</th>
                <th className="p-3">Protocol</th>
                <th className="p-3">Payload Transmitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="p-3 font-semibold">Dynamic OTA Update Check</td>
                <td className="p-3 font-mono text-[11px]">gphost.eu.cc / cdn.gauravpatil.site</td>
                <td className="p-3 font-mono text-[11px]">HTTPS (TLS 1.3)</td>
                <td className="p-3">Client User-Agent header (e.g. <code className="font-mono">CP/0.0.1 (Windows NT 10.0; x64)</code>). Zero identifying parameters.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Dynamic Binary Payload Download</td>
                <td className="p-3 font-mono text-[11px]">gphost.eu.cc/raw/cp-*</td>
                <td className="p-3 font-mono text-[11px]">HTTPS (TLS 1.3)</td>
                <td className="p-3">Standard HTTP GET request for the signed dynamic update archive. Zero telemetry.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">User File Transfer Operations</td>
                <td className="p-3 font-mono text-[11px]">NONE (Local Only)</td>
                <td className="p-3 font-mono text-[11px]">N/A</td>
                <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">0 Bytes transmitted over network.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Local Storage */}
      <section id="local-storage" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            5. Local Storage &amp; File System Footprint
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          CP Engine stores a minimal set of state configuration files in your Windows user profile under <code className="font-mono">%LOCALAPPDATA%\CP</code>:
        </p>
        <ul className="space-y-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li>
            <code className="font-mono">config.json</code>: Local UI display preferences (e.g., light/dark theme preference, autostart toggle).
          </li>
          <li>
            <code className="font-mono">pending_paste.flag</code>: A transient marker written only during dynamic update hot-swapping to preserve your clipboard copy operation across the restart cycle. This file is deleted immediately after the paste operation commences.
          </li>
          <li>
            <code className="font-mono">updates/</code>: Staging folder holding downloaded dynamic update archives before cryptographic verification and execution.
          </li>
        </ul>
      </section>

      {/* 6. Dynamic Updates */}
      <section id="dynamic-updates" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            6. Dynamic Updates &amp; Edge CDN Logs
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          When CP Engine checks for updates or downloads dynamic patches from our edge CDN (Cloudflare R2 and GPHost infrastructure), the hosting provider records transient HTTP edge request logs (such as connecting IP address, timestamp, and HTTP status code) in accordance with standard web infrastructure logging practices.
        </p>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          These logs are utilized strictly for DDoS mitigation, edge cache optimization, and bandwidth monitoring. Neither Gaurav Patil nor CP Engine ever matches edge IP addresses to specific desktop users or software installations.
        </p>
      </section>

      {/* 7. Third Party */}
      <section id="third-party" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Server className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            7. Third-Party Edge Infrastructure
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Our global distribution layer relies on the following enterprise edge hosting providers:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
            <div className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Cloudflare, Inc. (Cloudflare R2 Object Storage)
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-snug">
              Provides immutable global asset hosting with zero egress fees and automated edge caching across 300+ worldwide point-of-presence datacenters.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
            <div className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              GPHost Global CDN
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-snug">
              Operates the authoritative update manifest verification endpoints with TLS 1.3 encryption and DNSSEC validation.
            </p>
          </div>
        </div>
      </section>

      {/* 8. Regulatory */}
      <section id="regulatory" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <UserX className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            8. Global Privacy &amp; Regulatory Compliance
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Because CP Engine does not collect, process, store, or transmit personal data:
        </p>
        <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li>
            <strong>European Union GDPR (General Data Protection Regulation):</strong> CP Engine does not act as a Data Controller or Data Processor under Article 4 of the GDPR, as no personally identifiable information (PII) is gathered.
          </li>
          <li>
            <strong>California CCPA / CPRA:</strong> CP Engine does not collect or sell consumer personal information.
          </li>
          <li>
            <strong>Children&rsquo;s Online Privacy Protection Act (COPPA):</strong> CP Engine contains zero behavioral tracking or advertising modules and is safe for educational, personal, and enterprise environments without age gating.
          </li>
        </ul>
      </section>

      {/* 9. Data Retention */}
      <section id="data-retention" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            9. Data Retention &amp; Complete Software Removal
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          You retain 100% control over CP Engine on your system. To remove all traces of CP Engine:
        </p>
        <ol className="space-y-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 list-decimal pl-5">
          <li>Right-click the CP icon in your Windows System Tray and choose <strong>Exit</strong>.</li>
          <li>Open Windows <strong>Settings &gt; Apps &gt; Installed apps</strong>, locate <strong>CP</strong>, and select <strong>Uninstall</strong>.</li>
          <li>Optionally delete the local configuration folder at <code className="font-mono">%LOCALAPPDATA%\CP</code>.</li>
        </ol>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Since no cloud accounts or remote servers maintain records of your machine, uninstallation permanently and completely eliminates CP Engine from your workstation.
        </p>
      </section>

      {/* 10. Security Contact */}
      <section id="security-contact" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            10. Security Disclosure &amp; Inquiries
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          If you believe you have discovered a security vulnerability, unexpected network transmission, or potential flaw in CP Engine&rsquo;s clipboard isolation, please submit a responsible disclosure report directly to:
        </p>
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-mono">
          Email:{" "}
          <a
            href="mailto:gaurav@gauravpatil.site"
            className="text-emerald-600 dark:text-emerald-400 underline font-bold"
          >
            gaurav@gauravpatil.site
          </a>
          <br />
          Subject Prefix: <span className="text-zinc-500">[SECURITY-DISCLOSURE] CP Engine</span>
        </div>
      </section>
    </CpLegalLayout>
  );
}

