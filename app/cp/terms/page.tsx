import type { Metadata } from "next";
import CpLegalLayout from "@/components/cp/CpLegalLayout";
import {
  Scale,
  ShieldAlert,
  Zap,
  HardDrive,
  RefreshCw,
  Cpu,
  FileCheck,
  AlertTriangle,
  Lock,
} from "lucide-react";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Terms of Service | CP Engine",
  description:
    "Official Enterprise Terms of Service governing the use of CP Engine Desktop Client v0.0.1 (Base Foundation Release) and Dynamic Edge Over-the-Air (OTA) Update Infrastructure.",
  openGraph: {
    title: "Terms of Service | CP Engine",
    description:
      "Enterprise Terms of Service governing CP Engine v0.0.1 Base Binary and Dynamic OTA Update Engine.",
    url: "https://cp.apps.gauravpatil.site/terms",
    siteName: "CP Engine",
  },
};

const termsSections = [
  { id: "preamble", title: "1. Acceptance of Terms & Foundation Scope" },
  { id: "definitions", title: "2. Technical & Legal Definitions" },
  { id: "version-scope", title: "3. Scope of Release v0.0.1 (Base Binary)" },
  { id: "dynamic-ota", title: "4. Dynamic OTA Updates & Edge Protocols" },
  { id: "kernel-iocp", title: "5. Hardware Acceleration Architecture & Safety" },
  { id: "process-lifecycle", title: "6. Process Lifecycle & Paste Continuation" },
  { id: "license-grant", title: "7. License Grant & Open Source Terms" },
  { id: "acceptable-use", title: "8. Acceptable Use & Prohibited Acts" },
  { id: "integrity-checksum", title: "9. Cryptographic Checksum & Verification" },
  { id: "disclaimer", title: "10. Comprehensive Disclaimer of Warranties" },
  { id: "limitation-liability", title: "11. Enterprise Limitation of Liability" },
  { id: "governing-law", title: "12. Governing Law, Severability & Amendments" },
];

export default function CpTermsPage() {
  return (
    <CpLegalLayout
      title="Terms of Service & Licensing Agreement"
      badge="Release v0.0.1 Foundation &bull; Dynamic Updates"
      lastUpdated="November 2026"
      summary="These Terms of Service govern the installation, execution, and dynamic updating of CP Engine (Desktop Application v0.0.1 Base Foundation and related Dynamic Over-The-Air Update services). Please review these terms meticulously prior to downloading or activating CP Engine on Microsoft Windows."
      sections={termsSections}
    >
      {/* 1. Acceptance */}
      <section id="preamble" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            1. Acceptance of Terms &amp; Foundation Scope
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          By downloading, installing, executing, or permitting the execution of the CP Engine binary (specifically designated as Version 0.0.1 Foundation Base Release, compiled for Microsoft Windows x64 platforms), or by allowing the automatic acquisition of dynamic updates provided via authorized edge hosting services, you (&ldquo;User&rdquo;, &ldquo;Licensee&rdquo;, or &ldquo;Enterprise&rdquo;) enter into a legally binding agreement with Gaurav Patil and the CP Engine Open Source Initiative (&ldquo;Author&rdquo;, &ldquo;Maintainer&rdquo;, &ldquo;we&rdquo;, or &ldquo;our&rdquo;).
        </p>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          If you are accepting these Terms on behalf of an enterprise, company, corporation, government entity, or other legal entity, you represent and warrant that you possess full legal authority to bind said entity to these Terms. If you do not accept these Terms in their entirety, you must immediately terminate the download, delete all cached setup packages, and refrain from utilizing CP Engine in any capacity.
        </p>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Foundational Beta Notice:</strong> Version 0.0.1 represents the initial stable native Win32 core release. It engages direct Windows kernel file I/O APIs and clipboard hooks. While tested across multi-terabyte synthetic and production file workloads, it is deployed with the explicit understanding that software operating at hardware NVMe speeds requires user awareness of storage controller integrity.
          </div>
        </div>
      </section>

      {/* 2. Definitions */}
      <section id="definitions" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            2. Technical &amp; Legal Definitions
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
            <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400 mb-1">
              &ldquo;CP Engine&rdquo; / &ldquo;The Application&rdquo;
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-snug">
              The high-performance Win32 native Explorer file transfer accelerator application comprising the Tauri/Rust core runtime, the low-level Win32 clipboard hook engine, asynchronous worker pool, and UI renderer.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
            <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400 mb-1">
              &ldquo;Base Binary (v0.0.1)&rdquo;
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-snug">
              The immutable, statically anchored Windows executable distributed via the primary installer package (<code className="font-mono">cp-setup.exe</code>), verified by SHA-256 hash <code className="font-mono">f7a21e240c...</code>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
            <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400 mb-1">
              &ldquo;Dynamic OTA Updates&rdquo;
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-snug">
              Over-the-Air differential binary modules and assets distributed seamlessly from edge hosting services (Cloudflare R2 Global CDN / GPHost) without requiring manual MSI/NSIS installer re-execution.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
            <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400 mb-1">
              &ldquo;Hardware-Accelerated File Streaming&rdquo;
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-snug">
              The asynchronous Windows file transfer engine utilizing direct storage pipelines for maximum physical drive throughput while preserving complete user-mode system stability.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Version Scope */}
      <section id="version-scope" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            3. Scope of Release v0.0.1 (Base Binary)
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          CP Engine Version 0.0.1 is specifically architected as an immutable, minimal-dependency foundation binary. The fundamental operational scope of this base release encompasses:
        </p>
        <ul className="space-y-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li>
            <strong>Low-Level Win32 Subsystem Binding:</strong> Installs a listener for Windows clipboard update broadcasts (<code className="font-mono">WM_CLIPBOARDUPDATE</code>) and registers handling for the Standard Windows Drop Effect and File Drop formats (<code className="font-mono">CF_HDROP</code>).
          </li>
          <li>
            <strong>Single-Instance System Mutex:</strong> Maintains a kernel-level global mutex (<code className="font-mono">Global\CP_Engine_SingleInstance_Mutex</code>) to guarantee that only one supervisory instance runs per user session, eliminating race conditions on clipboard message dispatch.
          </li>
          <li>
            <strong>Silent Background Tray Service:</strong> Resides in the Windows Notification Area (System Tray) with an idle CPU footprint approaching 0.00% and private working memory allocation under 20 megabytes.
          </li>
          <li>
            <strong>Unbuffered I/O Pipeline:</strong> Employs asynchronous completion routines to bypass the Windows filesystem file cache, preventing RAM bloat and cache flushing during large file migrations (such as VM disks, database archives, and video footage).
          </li>
        </ul>
      </section>

      {/* 4. Dynamic OTA */}
      <section id="dynamic-ota" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <RefreshCw className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            4. Dynamic OTA Updates &amp; Edge Protocols
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          To maintain software performance, address operating system security updates, and deliver algorithm optimizations without forcing users to repeatedly download installers, CP Engine incorporates an automatic Dynamic Over-the-Air Update Engine.
        </p>
        <div className="space-y-3 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <h3 className="font-bold text-zinc-950 dark:text-zinc-50 mb-1">
              4.1 Automated Edge Manifest Synchronization
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              CP Engine periodically connects over TLS 1.3 to authorized edge CDN endpoints (hosted via Cloudflare R2 Global Edge and GPHost infrastructure) to retrieve signed update manifests. These connections transmit strictly technical handshake parameters (current client version and OS architecture). No user identifier, IP logging, or behavioral tracking is associated with these queries.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <h3 className="font-bold text-zinc-950 dark:text-zinc-50 mb-1">
              4.2 In-Process Hot-Swapping &amp; Zero Console Flashing
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              When a dynamic update is downloaded and verified, CP Engine stages the updated binary into <code className="font-mono">%LOCALAPPDATA%\CP</code> and performs a quiet, seamless in-process binary replacement. Spawning occurs using native Win32 flags (<code className="font-mono">CREATE_NO_WINDOW | DETACHED_PROCESS</code>), precluding PowerShell or command prompt popups that interrupt active work.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
            <h3 className="font-bold text-zinc-950 dark:text-zinc-50 mb-1">
              4.3 No Re-Installation Requirement
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Once the v0.0.1 Base Binary is installed, the application autonomously stays current. Users are never required to manually uninstall prior versions, execute command-line patching tools, or configure registry hooks.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Kernel IOCP */}
      <section id="kernel-iocp" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            5. Hardware Acceleration Architecture &amp; Safety
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          The core innovation of CP Engine is the replacement of Explorer&rsquo;s legacy single-threaded synchronous file copy subsystem with an asynchronous user-mode worker architecture:
        </p>
        <div className="space-y-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            <strong>Clipboard Operation Handling:</strong> When a user invokes Ctrl+V or the Explorer paste menu following a file copy command, CP Engine inspects the standard file drop structure. If paths qualify for accelerated direct streaming, CP Engine presents its hardware transfer HUD and manages the stream.
          </p>
          <p>
            <strong>Direct Hardware Streaming:</strong> Optimized memory pipelines stream data directly between storage channels without unnecessary intermediate operating system cache thrashing, enabling modern NVMe drives to operate at high speed.
          </p>
          <p>
            <strong>Filesystem Integrity &amp; Safety:</strong> CP Engine does not install kernel-level drivers or hook the NT Kernel at Ring 0. All operations execute strictly within documented Win32 user-mode APIs, ensuring maximum operating system stability and enterprise security compatibility.
          </p>
        </div>
      </section>

      {/* 6. Lifecycle */}
      <section id="process-lifecycle" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            6. Process Lifecycle &amp; Paste Continuation Guarantee
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          CP Engine implements resilient process lifecycle management specifically designed to avoid interrupting in-flight user tasks:
        </p>
        <ul className="space-y-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li>
            <strong>Pending Paste Persistence:</strong> If an OTA update finishes staging at the exact instant a user initiates a paste operation, CP Engine records the pending clipboard intent into a secured, transient flag (<code className="font-mono">pending_paste.flag</code>) inside the local user profile.
          </li>
          <li>
            <strong>Instant Relaunch &amp; Execution:</strong> The newly spawned dynamic binary acquires the released system mutex, checks for the presence of the pending flag, restores the transfer queue immediately, and presents a fresh user interface without losing the transfer task.
          </li>
          <li>
            <strong>Tray Crash Recovery:</strong> In the rare event of a process interruption, the Windows Shell notification icon auto-cleanses and restarts seamlessly via the CP supervisor thread.
          </li>
        </ul>
      </section>

      {/* 7. License Grant */}
      <section id="license-grant" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            7. License Grant &amp; Open Source Terms
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          CP Engine source code and base binaries are released under the terms of the <strong>MIT License</strong>. Under this license:
        </p>
        <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 font-mono text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <p>
            Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the &ldquo;Software&rdquo;), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
          </p>
          <p className="pt-2 font-semibold">
            The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
          </p>
        </div>
      </section>

      {/* 8. Acceptable Use */}
      <section id="acceptable-use" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            8. Acceptable Use &amp; Prohibited Acts
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          While CP Engine is open source, utilization of our official edge infrastructure (Cloudflare R2 and GPHost Global CDN) is subject to strict operational limits. You expressly agree that you shall NOT:
        </p>
        <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li>Attempt to conduct denial-of-service (DDoS) attacks against the dynamic update distribution hosts;</li>
          <li>Spoof cryptographic signatures or attempt to publish tampered dynamic update manifests under the CP Engine identifier;</li>
          <li>Employ CP Engine in military weapons systems, nuclear installations, critical medical life-support systems, or emergency responder dispatch where software failure could result in injury or loss of life;</li>
          <li>Distribute modified binaries containing malware, keystroke loggers, or unauthorized payload extractors while retaining CP Engine trademarks.</li>
        </ul>
      </section>

      {/* 9. Integrity */}
      <section id="integrity-checksum" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            9. Cryptographic Checksum &amp; Verification
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Every official build of the CP Engine Base Binary is signed and hashed. Licensees are encouraged to verify the binary prior to execution:
        </p>
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono text-xs space-y-2">
          <div className="text-zinc-500 text-[11px]">Official v0.0.1 Base Installer SHA-256 Hash:</div>
          <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-black/60 text-emerald-600 dark:text-emerald-400 font-bold break-all select-all">
            f7a21e240c6ca3ee8131e48b46ea9ab9b4a25f09ebf7faebe65cfb86c555354f
          </div>
          <div className="text-zinc-500 text-[11px] pt-1">
            Verification Command (Windows PowerShell):
          </div>
          <div className="p-2 rounded bg-zinc-100 dark:bg-black/60 text-zinc-800 dark:text-zinc-200">
            Get-FileHash -Algorithm SHA256 .\cp-setup.exe
          </div>
        </div>
      </section>

      {/* 10. Disclaimer */}
      <section id="disclaimer" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50 uppercase tracking-tight">
            10. Comprehensive Disclaimer of Warranties
          </h2>
        </div>
        <div className="p-5 rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 text-xs sm:text-sm text-zinc-800 dark:text-zinc-300 space-y-3 leading-relaxed">
          <p className="font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            THE SOFTWARE IS PROVIDED &ldquo;AS IS&rdquo;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NONINFRINGEMENT.
          </p>
          <p>
            IN NO EVENT SHALL GAURAV PATIL, THE CP ENGINE CONTRIBUTORS, EDGE HOSTING PROVIDERS, OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
          </p>
          <p>
            THE USER EXPRESSLY ACKNOWLEDGES THAT UNBUFFERED HARDWARE FILE TRANSFERS EXERT MAXIMUM READ/WRITE STRESS ON SOLID-STATE STORAGE DRIVES, CONTROLLERS, AND BUS INTERFACES. THE AUTHOR BEARS NO RESPONSIBILITY FOR PRE-EXISTING HARDWARE LATENT DEFECTS, THERMAL THROTTLING, CONTROLLER FAULTS, POWER INTERRUPTIONS DURING IOCP WRITES, OR DATA LOSS RESULTING THEREFROM.
          </p>
        </div>
      </section>

      {/* 11. Limitation */}
      <section id="limitation-liability" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            11. Enterprise Limitation of Liability
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          To the maximum extent permitted under applicable law, in no circumstances shall our aggregate liability arising out of or related to CP Engine or these Terms exceed either: (a) the total amount paid by you to the Author for the software in the preceding twelve (12) months; or (b) the nominal amount of Five United States Dollars (US $5.00), whichever is lesser.
        </p>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          This limitation applies to all claims, whether based on warranty, contract, tort (including negligence), strict liability, or any other legal theory, even if we have been informed of the possibility of such damages.
        </p>
      </section>

      {/* 12. Governing Law */}
      <section id="governing-law" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            12. Governing Law, Severability &amp; Amendments
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          These Terms shall be governed by, construed, and enforced in accordance with the substantive laws of India, without regard to its conflict of law principles. Any dispute arising out of or relating to CP Engine shall be submitted to the exclusive jurisdiction of the competent courts of Maharashtra, India.
        </p>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          If any provision of these Terms is found by a court of competent jurisdiction to be invalid, unlawful, or unenforceable, such provision shall be severed, and the remaining provisions shall continue in full force and effect.
        </p>
        <div className="pt-4 text-xs text-zinc-500 dark:text-zinc-400">
          For formal inquiries or enterprise governance questions, please contact the maintainer at{" "}
          <a
            href="mailto:gaurav@gauravpatil.site"
            className="text-emerald-600 dark:text-emerald-400 underline font-semibold"
          >
            gaurav@gauravpatil.site
          </a>{" "}
          or visit{" "}
          <a
            href="https://gauravpatil.site"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 underline font-semibold"
          >
            gauravpatil.site
          </a>
          .
        </div>
      </section>
    </CpLegalLayout>
  );
}

