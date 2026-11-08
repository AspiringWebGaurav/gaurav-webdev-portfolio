import type { Metadata } from "next";
import CpLegalLayout from "@/components/cp/CpLegalLayout";
import {
  Scale,
  ShieldCheck,
  Zap,
  HardDrive,
  Lock,
  Cpu,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "End User Acceptance Agreement (AOU) | CP Engine",
  description:
    "End User Acceptance Agreement and Acceptable Use Policy (AOU) governing CP Engine Desktop Client v0.0.1 (Base Foundation Release) and Dynamic Edge Over-the-Air Update Infrastructure.",
  openGraph: {
    title: "End User Acceptance Agreement (AOU) | CP Engine",
    description:
      "Official Terms of Use & End User Acceptance Agreement for CP Engine v0.0.1 Base Binary.",
    url: "https://cp.apps.gauravpatil.site/aou",
    siteName: "CP Engine",
  },
};

const aouSections = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "architecture", title: "2. High-Performance Architecture & Operating Parameters" },
  { id: "hardware-responsibility", title: "3. Hardware & Storage Responsibilities" },
  { id: "disclaimer", title: "4. Limitation of Liability & 'As-Is' Disclaimer" },
  { id: "privacy", title: "5. 100% Local Privacy & Data Sovereignty" },
  { id: "cryptographic-updates", title: "6. Cryptographic Verification & Updates" },
  { id: "system-integration", title: "7. System Integration & Permissions" },
  { id: "acceptable-use", title: "8. Acceptable Use & Prohibited Acts" },
];

export default function CpAouPage() {
  return (
    <CpLegalLayout
      title="End User Acceptance Agreement &amp; Acceptable Use (AOU)"
      badge="Release v0.0.1 Foundation &bull; Base Anchor"
      lastUpdated="November 2026"
      summary="This End User Acceptance Agreement ('Agreement' / 'AOU') constitutes the binding legal agreement between you ('User') and the developer and author, Gaurav Patil. It sets forth the terms governing the installation, execution, and local hardware utilization of the CP desktop application."
      sections={aouSections}
    >
      {/* 1. Acceptance */}
      <section id="acceptance" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            1. Acceptance of Terms
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Please read this Acceptance Agreement carefully before installing or using CP. By downloading, installing, launching, or using the CP desktop application (&ldquo;Software&rdquo;), you acknowledge that you have read, understood, and agreed to all terms of this Agreement. If you do not agree, do not install or use the Software.
        </p>
      </section>

      {/* 2. Architecture */}
      <section id="architecture" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            2. High-Performance Architecture &amp; Operating Parameters
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          CP Engine is a native Windows desktop utility engineered to maximize file transfer throughput. To achieve high operational efficiency, the Software employs modern desktop systems programming techniques, including:
        </p>
        <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li><strong>Direct Storage Streaming:</strong> Streams data directly between source and destination drives at hardware line rate;</li>
          <li><strong>Asynchronous Non-Blocking Workers:</strong> Background workers handle disk reads and writes without freezing the desktop UI or Windows Explorer;</li>
          <li><strong>Optimized Memory Management:</strong> Lightweight, pre-allocated temporary buffers prevent RAM bloat and memory fragmentation;</li>
          <li><strong>Native Shortcut Handling:</strong> Automatically activates on standard Explorer copy/paste commands (<code className="font-mono">Ctrl+C</code> / <code className="font-mono">Ctrl+V</code>) for zero workflow interruption;</li>
          <li><strong>Filesystem Pre-Allocation:</strong> Allocates target file space upfront to minimize disk fragmentation and maximize continuous transfer speeds.</li>
        </ul>
        <p className="text-xs text-zinc-500 leading-relaxed pt-1">
          The Software operates strictly within standard Windows security boundaries and executes according to the physical throughput and manufacturer capabilities of your system&rsquo;s connected storage media, bus controllers, and hardware resources.
        </p>
      </section>

      {/* 3. Hardware Responsibility */}
      <section id="hardware-responsibility" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            3. Hardware &amp; Storage Responsibilities
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Users acknowledge that high-throughput mass file transfers utilize available host storage controller bandwidth, memory interfaces, and processing resources as permitted by the underlying operating system. Users are responsible for:
        </p>
        <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li>Ensuring the Software is executed on systems and storage devices they own or are authorized to manage;</li>
          <li>Operating their hardware in accordance with manufacturer guidelines, including adequate thermal cooling and ventilation;</li>
          <li>Maintaining regular data backups for all valuable or mission-critical data prior to performing extensive or mass file transfer operations.</li>
        </ul>
      </section>

      {/* 4. Disclaimer */}
      <section id="disclaimer" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            4. Limitation of Liability &amp; &ldquo;As-Is&rdquo; Disclaimer
          </h2>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-900 dark:text-amber-200 font-mono space-y-2">
          <p className="font-bold">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</p>
          <p>
            THE SOFTWARE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;, WITH ALL FAULTS AND WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, ACCURACY, AND NON-INFRINGEMENT.
          </p>
          <p>
            IN NO EVENT SHALL GAURAV PATIL, CONTRIBUTORS, OR DISTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES WHATSOEVER (INCLUDING, WITHOUT LIMITATION, HARDWARE WEAR, STORAGE CONTROLLER INTERACTION, SYSTEM REBOOTS, DATA LOSS, CORRUPTION, DELAYS, OR LOSS OF BUSINESS PROFITS) ARISING OUT OF THE USE, PERFORMANCE, OR INABILITY TO USE THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>
        </div>
      </section>

      {/* 5. Privacy */}
      <section id="privacy" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            5. 100% Local Privacy &amp; Data Sovereignty
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          CP is architected on a zero-telemetry, 100% local processing paradigm:
        </p>
        <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li><strong>Zero Bytes Transmitted:</strong> 0 bytes of copied, moved, or transferred files ever leave your machine.</li>
          <li><strong>Zero Telemetry:</strong> Zero clipboard contents, file paths, directory structures, or file contents are tracked, stored on external servers, or transmitted to the cloud.</li>
          <li><strong>Zero Profiling:</strong> Zero tracking cookies, user profiling, identity tokens, or advertising identifiers are embedded in the Software.</li>
          <li><strong>Local Isolation:</strong> All file streaming and buffer management occurs exclusively within local system memory and attached local or network storage devices.</li>
        </ul>
      </section>

      {/* 6. Updates */}
      <section id="cryptographic-updates" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <RefreshCw className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            6. Cryptographic Verification &amp; Dynamic Updates
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Executable updates delivered via the official GPHost Global Edge CDN (https://gphost.eu.cc) are cryptographically validated using Minisign Ed25519 digital signatures before execution. The Software incorporates a resilient local base anchor (<code className="font-mono">cp-base.exe</code> v0.0.1) and watchdog state recovery to maintain complete application stability across all update cycles.
        </p>
      </section>

      {/* 7. Permissions */}
      <section id="system-integration" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            7. System Integration &amp; Permissions
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          To provide convenient background acceleration, the installer provides optional, user-controlled system integration settings:
        </p>
        <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li><strong>Windows Startup Integration:</strong> Allows CP to start minimized in the notification area upon user login for instant copy/paste interception.</li>
          <li><strong>Desktop &amp; Start Menu Shortcuts:</strong> Creates standard desktop and start menu access points.</li>
          <li><strong>Golden Base Anchor:</strong> Maintains a clean, permanent local recovery snapshot of v0.0.1.</li>
        </ul>
        <p className="text-xs text-zinc-500 leading-relaxed pt-1">
          All integrations may be configured during setup and uninstalled cleanly at any time via standard Windows &ldquo;Installed Apps&rdquo; / &ldquo;Programs and Features&rdquo;.
        </p>
      </section>

      {/* 8. Prohibited Acts */}
      <section id="acceptable-use" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            8. Acceptable Use &amp; Prohibited Acts
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          While CP Engine is distributed under permissive terms, users agree not to:
        </p>
        <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li>Conduct denial-of-service (DDoS) attacks against dynamic update distribution hosts;</li>
          <li>Spoof cryptographic signatures or attempt to publish tampered dynamic update manifests under the CP Engine identifier;</li>
          <li>Employ CP Engine in critical medical life-support systems, military weapons systems, or nuclear facilities where software failure could result in injury or loss of life;</li>
          <li>Distribute modified binaries containing malware or unauthorized payload extractors while retaining CP Engine trademarks.</li>
        </ul>
      </section>
    </CpLegalLayout>
  );
}

