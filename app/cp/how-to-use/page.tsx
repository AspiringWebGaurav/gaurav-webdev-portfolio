import type { Metadata } from "next";
import CpLegalLayout from "@/components/cp/CpLegalLayout";
import {
  BookOpen,
  Download,
  Zap,
  HardDrive,
  RefreshCw,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Layers,
  Sparkles,
  HelpCircle,
  Copy,
  Sliders,
  Play,
  Pause,
  X,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "How to Use & Technical Manual | CP Engine",
  description:
    "Comprehensive Operational Manual and Architecture Guide for CP Engine v0.0.1 (Base Foundation Release) and Dynamic Edge Over-the-Air (OTA) Updates. Unbuffered 4MB IOCP kernel streaming guide.",
  openGraph: {
    title: "How to Use & Technical Manual | CP Engine",
    description:
      "Operational handbook for CP Engine v0.0.1. Copy. Paste. Faster. Native Win32 unbuffered file streaming.",
    url: "https://cp.apps.gauravpatil.site/how-to-use",
    siteName: "CP Engine",
  },
};

const guideSections = [
  { id: "overview", title: "1. Architectural Overview & Philosophy" },
  { id: "requirements", title: "2. System Requirements & Hardware Prerequisites" },
  { id: "installation", title: "3. Installation of Base Binary v0.0.1" },
  { id: "checksum-verification", title: "4. Cryptographic SHA-256 Checksum Verification" },
  { id: "workflow", title: "5. Everyday Workflow: Zero-Habit-Change Copy/Paste" },
  { id: "dynamic-ota", title: "6. Dynamic Over-The-Air (OTA) Updates" },
  { id: "pending-paste", title: "7. Pending Paste Continuation & Hot-Swap Lifecycle" },
  { id: "tray-controls", title: "8. System Tray Controls & State Management" },
  { id: "benchmarking", title: "9. NVMe Benchmarking & Performance Optimization" },
  { id: "faq", title: "10. Troubleshooting & Frequently Asked Questions" },
];

export default function CpHowToUsePage() {
  return (
    <CpLegalLayout
      title="How to Use &amp; Technical Manual"
      badge="Release v0.0.1 Foundation &bull; Dynamic Updates"
      lastUpdated="November 2026"
      summary="This comprehensive technical manual provides step-by-step instructions for installing the CP Engine v0.0.1 Base Binary, operating the native Win32 clipboard interceptor, understanding unbuffered 4MB IOCP kernel streaming, and managing dynamic over-the-air updates."
      sections={guideSections}
    >
      {/* 1. Overview */}
      <section id="overview" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            1. Architectural Overview &amp; Philosophy
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          For decades, the built-in Microsoft Windows Explorer file transfer mechanism has remained fundamentally unchanged: it is single-threaded, synchronous, relies on small 64KB memory buffers, and passes every byte through the Windows filesystem cache. On modern high-speed PCIe Gen3, Gen4, and Gen5 NVMe solid-state storage (capable of 3,500 to 14,000 MB/s), this legacy architecture bottlenecks disk transfers down to a fraction of actual hardware capability.
        </p>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <strong>CP Engine</strong> solves this at the systems programming level without requiring users to change how they interact with their computers. CP Engine runs silently in the background, intercepts standard file copy (<code className="font-mono">Ctrl+C</code>) and paste (<code className="font-mono">Ctrl+V</code>) commands, and replaces Explorer&rsquo;s slow transfer dialog with unbuffered 4MB I/O Completion Port (IOCP) kernel worker threads that saturate physical drive bus limits.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-xs">
            <div className="font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-1.5">
              <span>Standard Windows Explorer (Legacy)</span>
            </div>
            <ul className="space-y-1.5 text-rose-900/80 dark:text-rose-200/80 list-disc pl-4 leading-relaxed">
              <li>Synchronous single-threaded read/write loops.</li>
              <li>Small 64KB buffer chunks cause high CPU interrupt overhead.</li>
              <li>Filesystem cache pollution causes UI micro-stutters and memory bloat.</li>
              <li>Speed drops dramatically on multi-gigabyte ISOs, VM images, and video files.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs">
            <div className="font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
              <span>CP Engine v0.0.1 (Modern Kernel Architecture)</span>
            </div>
            <ul className="space-y-1.5 text-emerald-900/80 dark:text-emerald-200/80 list-disc pl-4 leading-relaxed">
              <li>Asynchronous multi-worker Win32 I/O Completion Ports (IOCP).</li>
              <li>Unbuffered 4,194,304-byte sector-aligned memory pages.</li>
              <li>Bypasses OS cache for direct Direct Memory Access (DMA) streaming.</li>
              <li>Achieves true physical NVMe line rate transfers with zero system UI lag.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 2. Requirements */}
      <section id="requirements" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            2. System Requirements &amp; Hardware Prerequisites
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          CP Engine is compiled as a native, lightweight 64-bit Windows binary with zero third-party framework runtime dependencies (.NET or Java not required).
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <thead className="bg-zinc-100 dark:bg-zinc-900 font-mono text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              <tr>
                <th className="p-3">Specification</th>
                <th className="p-3">Minimum Requirement</th>
                <th className="p-3">Recommended Specification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr>
                <td className="p-3 font-semibold">Operating System</td>
                <td className="p-3">Windows 10 64-bit (Build 19041+)</td>
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">Windows 11 64-bit (Build 22000+)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Processor (CPU)</td>
                <td className="p-3">x86_64 Dual-Core (1.8 GHz)</td>
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">Modern Quad-Core or higher (Intel 10th Gen+ / AMD Ryzen 3000+)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">System Memory (RAM)</td>
                <td className="p-3">64 MB free RAM (CP idles at &lt;20MB)</td>
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">512 MB+ free RAM for 4MB IOCP buffer ring</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Storage Architecture</td>
                <td className="p-3">SATA SSD or USB 3.0 Storage</td>
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">PCIe NVMe Gen 3, Gen 4, or Gen 5 M.2 SSD</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Filesystem Compatibility</td>
                <td className="p-3">NTFS, ReFS, exFAT</td>
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">NTFS (4KB allocation cluster aligned)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Installation */}
      <section id="installation" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            3. Installation of Base Binary v0.0.1
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Follow these simple steps to install the official CP Engine Base Foundation:
        </p>

        <div className="space-y-4 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">
              1
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-950 dark:text-zinc-50">Download the Official Base Package</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Click <strong>Download for Windows</strong> on the CP portal to download <code className="font-mono">CP_0.0.1_x64-setup.exe</code> directly from our Cloudflare R2 Global Edge CDN (file size: exactly 2.90 MiB).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">
              2
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-950 dark:text-zinc-50">Execute the Installer</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Launch <code className="font-mono">CP_0.0.1_x64-setup.exe</code>. CP Engine installs into your user application directory (<code className="font-mono">%LOCALAPPDATA%\Programs\CP</code>) without requiring Windows Administrator elevation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">
              3
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-950 dark:text-zinc-50">Silent Tray Activation</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Upon installation completion, CP Engine launches quietly into your Windows System Tray (near the clock). An emerald CP icon confirms that clipboard interception and 4MB IOCP workers are active.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Checksum */}
      <section id="checksum-verification" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            4. Cryptographic SHA-256 Checksum Verification
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          For enterprise security audits and verifying supply chain integrity, you can compute the SHA-256 cryptographic hash of the downloaded installer before executing it:
        </p>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-zinc-100 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] pb-2 border-b border-zinc-800">
            <span>PowerShell Command Line Verification</span>
            <span className="text-emerald-400">Windows 10 / 11 Native</span>
          </div>
          <div className="bg-black/60 p-3 rounded-lg text-emerald-300 select-all font-mono break-all">
            Get-FileHash -Algorithm SHA256 &quot;$HOME\Downloads\CP_0.0.1_x64-setup.exe&quot; | Format-List
          </div>
          <div className="text-zinc-400 text-[11px] pt-1">
            Expected Official Output:
          </div>
          <div className="bg-black/60 p-3 rounded-lg text-zinc-300 text-[11px] break-all select-all font-mono">
            Algorithm : SHA256<br />
            Hash      : <span className="text-emerald-400 font-bold">96029CB894160DD270256667AE6FB9C56F64CCAC7E7CF02D3C74537141AA5592</span><br />
            Path      : C:\Users\...\Downloads\CP_0.0.1_x64-setup.exe
          </div>
        </div>
      </section>

      {/* 5. Everyday Workflow */}
      <section id="workflow" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            5. Everyday Workflow: Zero-Habit-Change Copy/Paste
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          CP Engine requires <strong>zero change to your muscle memory</strong>. You use your computer exactly as you have always done:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between">
            <div>
              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5" />
                <span>Step 1: Standard Copy</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-snug">
                Select any file, folder, virtual disk, or 4K video file in Windows Explorer and press <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-[10px]">Ctrl+C</kbd> (or Right-Click &gt; Copy).
              </p>
            </div>
            <div className="mt-3 text-[10px] text-zinc-400 font-mono">
              Clipboard records CF_HDROP structure
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between">
            <div>
              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Step 2: Standard Paste</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-snug">
                Navigate to your destination directory, drive, or external storage and press <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-[10px]">Ctrl+V</kbd> (or Right-Click &gt; Paste).
              </p>
            </div>
            <div className="mt-3 text-[10px] text-zinc-400 font-mono">
              CP Interceptor claims the paste event
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between">
            <div>
              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Step 3: Instant Acceleration</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-snug">
                The CP Native HUD appears smoothly. 4MB IOCP completion packets stream files at physical hardware speeds with real-time throughput metrics.
              </p>
            </div>
            <div className="mt-3 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
              Line rate unbuffered streaming
            </div>
          </div>
        </div>

        {/* HUD Controls Explanation */}
        <div className="mt-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-2 text-xs">
          <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Interactive Transfer Controls</span>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            During any active transfer, the CP Transfer HUD offers instant interactive controls:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800">
              <Pause className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div>
                <strong className="text-zinc-800 dark:text-zinc-200">Pause / Resume:</strong> Suspends the IOCP thread pool safely mid-block without corrupting sector writes.
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800">
              <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <div>
                <strong className="text-zinc-800 dark:text-zinc-200">Cancel:</strong> Closes file descriptors and rolls back partially written blocks atomically.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Dynamic OTA */}
      <section id="dynamic-ota" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <RefreshCw className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            6. Dynamic Over-The-Air (OTA) Updates
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          One of the major engineering milestones in CP Engine is our dynamic edge hosting synchronization. Unlike legacy desktop tools that require users to repeatedly visit download portals and run setup files:
        </p>

        <div className="space-y-3 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-900 dark:text-zinc-100">Edge Distribution via Cloudflare R2:</strong> Dynamic updates are continuously published to low-latency edge storage across 300+ global cities, ensuring instantaneous patch availability.
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-start gap-3">
            <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-900 dark:text-zinc-100">Zero Command Prompt Flashing:</strong> Spawning replacement binaries uses <code className="font-mono">CREATE_NO_WINDOW | DETACHED_PROCESS</code> Win32 flags, completely eliminating annoying command-line black terminal flashes while you work.
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-900 dark:text-zinc-100">Cryptographic Signature &amp; Hash Verification:</strong> Downloaded dynamic update payloads are verified in local memory against manifest SHA-256 signatures before being swapped into production.
            </div>
          </div>
        </div>
      </section>

      {/* 7. Pending Paste */}
      <section id="pending-paste" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            7. Pending Paste Continuation &amp; Hot-Swap Lifecycle
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          What happens if a dynamic update arrives at the precise moment you are copying a file and pressing Ctrl+V?
        </p>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          In lesser applications, an update would either crash the copy operation or fail to restart. CP Engine incorporates an atomic <strong>Pending Paste Lifecycle Supervisor</strong>:
        </p>

        <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs font-mono space-y-2 text-zinc-800 dark:text-zinc-200">
          <div className="font-bold text-emerald-700 dark:text-emerald-400 uppercase text-[11px]">
            Atomic Update Execution Flow:
          </div>
          <div className="space-y-1 text-[11px] leading-relaxed">
            1. User presses Ctrl+V &rarr; OTA update package verified and ready.<br />
            2. Parent process writes <code className="text-emerald-600 dark:text-emerald-300">pending_paste.flag</code> to <code className="text-emerald-600 dark:text-emerald-300">%LOCALAPPDATA%\CP</code>.<br />
            3. Parent releases <code className="text-emerald-600 dark:text-emerald-300">Global\CP_Engine_SingleInstance_Mutex</code> and spawns new binary.<br />
            4. New process acquires mutex, consumes <code className="text-emerald-600 dark:text-emerald-300">pending_paste.flag</code>, and deletes it.<br />
            5. UI comes up fresh and immediately executes the 4MB IOCP paste operation.
          </div>
        </div>
      </section>

      {/* 8. Tray Controls */}
      <section id="tray-controls" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            8. System Tray Controls &amp; State Management
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          CP Engine runs unobtrusively in your system tray. Right-clicking the CP tray icon reveals options:
        </p>
        <ul className="space-y-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li><strong>Show HUD:</strong> Displays the main CP Engine dashboard window.</li>
          <li><strong>Check for Dynamic Updates:</strong> Forces an instantaneous query to the edge CDN manifest to verify whether any new dynamic optimizations are available.</li>
          <li><strong>Start with Windows:</strong> Toggles registry autostart (<code className="font-mono">HKCU\Software\Microsoft\Windows\CurrentVersion\Run</code>) so CP is ready immediately upon login.</li>
          <li><strong>Exit:</strong> Authorizes an explicit exit, safely unhooking the Win32 clipboard listener and releasing all kernel handles.</li>
        </ul>
      </section>

      {/* 9. Benchmarking */}
      <section id="benchmarking" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            9. NVMe Benchmarking &amp; Performance Optimization
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          To maximize physical read and write bandwidth during CP Engine transfers:
        </p>
        <div className="space-y-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            <strong>Same-Drive vs Cross-Drive Transfers:</strong> On modern NVMe SSDs, copying files within the same drive shares PCIe bus lanes and SLC cache. Cross-drive transfers (e.g. from NVMe Drive C: to NVMe Drive D:) achieve full duplex wire-speed saturation (up to 3,500+ MB/s on Gen 3, and 7,000+ MB/s on Gen 4).
          </p>
          <p>
            <strong>Antivirus Real-Time Scanning Exclusions:</strong> Third-party antivirus solutions may attempt to scan every 4MB chunk as it hits disk. For maximum enterprise performance on multi-gigabyte ISOs and game directories, add your destination directory to your antivirus exclusion list.
          </p>
        </div>
      </section>

      {/* 10. FAQ */}
      <section id="faq" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <HelpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            10. Troubleshooting &amp; Frequently Asked Questions
          </h2>
        </div>
        <div className="space-y-3 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h3 className="font-bold text-zinc-950 dark:text-zinc-50 mb-1">
              Q: Windows SmartScreen displays &ldquo;Windows protected your PC&rdquo; on launch. Is this normal?
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <strong>Yes.</strong> As an open-source, community-distributed foundation binary (v0.0.1) without expensive commercial EV code-signing certificates, Microsoft SmartScreen initially flags new releases until enough global downloads accrue. Simply click <strong>More info</strong> and select <strong>Run anyway</strong>. You can verify the official SHA-256 hash before running to be 100% confident.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h3 className="font-bold text-zinc-950 dark:text-zinc-50 mb-1">
              Q: Does CP Engine interfere with copying regular text or code snippets?
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <strong>No.</strong> CP Engine strictly filters for file drop structures (<code className="font-mono">CF_HDROP</code>). When you copy text, URLs, markdown, or passwords, CP Engine never touches or interacts with the clipboard.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h3 className="font-bold text-zinc-950 dark:text-zinc-50 mb-1">
              Q: Where are CP Engine log files stored?
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              If enabled, local diagnostic logs are written exclusively to <code className="font-mono">%LOCALAPPDATA%\CP\logs</code> on your local workstation. They are never transmitted over the internet.
            </p>
          </div>
        </div>
      </section>
    </CpLegalLayout>
  );
}

