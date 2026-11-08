import type { Metadata } from "next";
import CpLegalLayout from "@/components/cp/CpLegalLayout";
import {
  Download,
  Zap,
  HardDrive,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Terminal,
  Sparkles,
  HelpCircle,
  Copy,
  Sliders,
  Pause,
  X,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "User Guide & Overview | CP Engine",
  description:
    "An overview of CP Engine: the problem statement with traditional Windows file transfers, our engineering approach, system requirements, step-by-step setup, and everyday usage.",
  openGraph: {
    title: "User Guide & Overview | CP Engine",
    description:
      "Operational handbook and overview for CP Engine v0.0.1. Copy. Paste. Faster. Lightweight hardware acceleration for Windows.",
    url: "https://cp.apps.gauravpatil.site/how-to-use",
    siteName: "CP Engine",
  },
};

const guideSections = [
  { id: "problem-statement", title: "1. Problem Statement: Why File Copy Needs Re-Engineering" },
  { id: "approach", title: "2. The CP Approach: Direct Hardware Efficiency" },
  { id: "requirements", title: "3. System Requirements & Compatibility" },
  { id: "installation", title: "4. Installation of Base Binary v0.0.1" },
  { id: "checksum-verification", title: "5. Cryptographic SHA-256 Verification" },
  { id: "workflow", title: "6. Everyday Workflow: Zero Habit Changes" },
  { id: "updates", title: "7. Seamless Background Updates" },
  { id: "tray-controls", title: "8. System Tray Controls & Options" },
  { id: "performance-tips", title: "9. Performance Tips & Maximizing Speed" },
  { id: "faq", title: "10. Troubleshooting & Frequently Asked Questions" },
];

export default function CpHowToUsePage() {
  return (
    <CpLegalLayout
      title="User Guide &amp; Overview"
      badge="Release v0.0.1 Foundation &bull; Dynamic Updates"
      lastUpdated="November 2026"
      summary="This guide provides a high-level overview of CP Engine: the problem statement with legacy file transfers on modern SSDs, our engineering approach, hardware requirements, installation, and zero-habit-change daily usage."
      sections={guideSections}
    >
      {/* 1. Problem Statement */}
      <section id="problem-statement" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            1. Problem Statement: Why File Copy Needs Re-Engineering
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          For decades, the built-in Microsoft Windows Explorer file transfer mechanism was designed around the constraints of legacy mechanical hard drives. It relies on synchronous, single-threaded processing and small transfer buffers that pass through standard filesystem caches.
        </p>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Today, modern PCIe NVMe solid-state drives can read and write at <strong>3,500 to 14,000 MB/s</strong>. Yet, when copying large game directories, 4K video footage, or virtual disk images, users regularly encounter:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="font-bold text-rose-600 dark:text-rose-400 mb-1">
              Throughput Bottlenecks
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-snug">
              Transfers often throttle down to a small fraction of what your NVMe storage is physically capable of delivering.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="font-bold text-rose-600 dark:text-rose-400 mb-1">
              Explorer Freezes &amp; Lag
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-snug">
              Heavy transfers can cause Windows Explorer windows to temporarily hang, lock up, or produce micro-stutters during everyday work or gaming.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="font-bold text-rose-600 dark:text-rose-400 mb-1">
              Unpredictable ETA Spikes
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-snug">
              Estimated completion times fluctuate wildly, making it hard to know when large multi-gigabyte transfers will actually finish.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Engineering Approach */}
      <section id="approach" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            2. The CP Approach: Direct Hardware Efficiency
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <strong>CP Engine</strong> is purpose-built to solve these bottlenecks with an engineering philosophy centered on simplicity, direct hardware throughput, and respect for user habits:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs">
            <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Direct Asynchronous Streaming</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Bypasses standard bottlenecking layers to stream data directly to disk using multi-threaded asynchronous workers. This allows modern NVMe drives to operate much closer to their true hardware speed.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs">
            <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-emerald-500" />
              <span>Zero Habit Change</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              You do not need to open a third-party app or learn new hotkeys. Continue using standard <kbd className="font-mono px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border">Ctrl+C</kbd> and <kbd className="font-mono px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border">Ctrl+V</kbd> in Windows Explorer—CP seamlessly steps in.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs">
            <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span>Ultra-Lightweight Footprint</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Native Rust and Win32 architecture means zero bloat, no heavy electron runtimes, and under 20MB of idle memory consumption. It sits quietly near your clock without slowing down games or apps.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs">
            <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Safe &amp; Non-Destructive</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              CP Engine exclusively operates on file transfers. Text clipboard data, passwords, and other clipboard content are never inspected or modified. Full rollback safety ensures partial writes are safely cleaned on cancellation.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Requirements */}
      <section id="requirements" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            3. System Requirements &amp; Compatibility
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          CP Engine is compiled as a native, lightweight 64-bit Windows binary with zero third-party framework runtime dependencies (.NET or Java runtime not required).
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
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">Modern Quad-Core or higher (Intel / AMD Ryzen)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">System Memory (RAM)</td>
                <td className="p-3">64 MB free RAM (CP idles at &lt;20MB)</td>
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">256 MB+ free RAM during maximum load</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Storage Architecture</td>
                <td className="p-3">SATA SSD or USB 3.0 Storage</td>
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">PCIe NVMe Gen 3, Gen 4, or Gen 5 M.2 SSD</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Filesystem Compatibility</td>
                <td className="p-3">NTFS, ReFS, exFAT</td>
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">NTFS</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Installation */}
      <section id="installation" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            4. Installation of Base Binary v0.0.1
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
                Click <strong>Download for Windows</strong> on the CP portal to download <code className="font-mono">cp-setup.exe</code> directly from our Cloudflare R2 Global Edge CDN (file size: ~3.18 MB).
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
                Launch <code className="font-mono">cp-setup.exe</code>. CP Engine installs safely into your user profile directory (<code className="font-mono">%LOCALAPPDATA%\Programs\CP</code>) without requiring Windows Administrator elevation.
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
                Upon installation completion, CP Engine launches quietly into your Windows System Tray (near the clock). An emerald CP icon confirms that accelerated file transfer handling is active.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Checksum */}
      <section id="checksum-verification" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            5. Cryptographic SHA-256 Verification
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          To verify supply chain integrity and ensure that the downloaded installer has not been modified or corrupted, you can compute its SHA-256 cryptographic checksum:
        </p>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-zinc-100 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between text-zinc-400 text-[11px] pb-2 border-b border-zinc-800">
            <span>PowerShell Command Line Verification</span>
            <span className="text-emerald-400">Windows 10 / 11 Native</span>
          </div>
          <div className="bg-black/60 p-3 rounded-lg text-emerald-300 select-all font-mono break-all">
            Get-FileHash -Algorithm SHA256 &quot;$HOME\Downloads\cp-setup.exe&quot; | Format-List
          </div>
          <div className="text-zinc-400 text-[11px] pt-1">
            Official Base Binary Hash:
          </div>
          <div className="bg-black/60 p-3 rounded-lg text-zinc-300 text-[11px] break-all select-all font-mono">
            Algorithm : SHA256<br />
            Hash      : <span className="text-emerald-400 font-bold">3F473FBEE0AA89F9764C46756C6B887940019A694B4DC56165AB6E43D8CC8CEC</span><br />
            Path      : C:\Users\...\Downloads\cp-setup.exe
          </div>
        </div>
      </section>

      {/* 6. Everyday Workflow */}
      <section id="workflow" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            6. Everyday Workflow: Zero Habit Changes
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          CP Engine requires <strong>no change to your daily habits</strong>. You use your computer exactly as you have always done:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between">
            <div>
              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5" />
                <span>Step 1: Standard Copy</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-snug">
                Select any file, folder, game installation, or video in Windows Explorer and press <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono text-[10px]">Ctrl+C</kbd> (or Right-Click &gt; Copy).
              </p>
            </div>
            <div className="mt-3 text-[10px] text-zinc-400 font-mono">
              Clipboard registered normally
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
              CP seamlessly initiates transfer
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between">
            <div>
              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Step 3: Direct Acceleration</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-snug">
                The CP Native HUD appears smoothly, displaying real-time transfer throughput, transferred gigabytes, and an accurate time-to-completion indicator.
              </p>
            </div>
            <div className="mt-3 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
              Fast hardware-accelerated copy
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
            During any active transfer, the CP Transfer HUD offers clean controls:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800">
              <Pause className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div>
                <strong className="text-zinc-800 dark:text-zinc-200">Pause / Resume:</strong> Temporarily pauses active transfer threads safely without corrupting data.
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800">
              <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <div>
                <strong className="text-zinc-800 dark:text-zinc-200">Cancel:</strong> Stops the transfer cleanly and removes partially written incomplete files.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Updates */}
      <section id="updates" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <RefreshCw className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            7. Seamless Background Updates
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          CP Engine is built with a quiet, modern update mechanism that keeps your installation optimized without interruptions:
        </p>

        <div className="space-y-3 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-900 dark:text-zinc-100">Edge-Delivered Updates:</strong> Performance optimizations and compatibility patches stream directly from low-latency Cloudflare R2 edge servers.
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-start gap-3">
            <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-900 dark:text-zinc-100">Zero Disruptive Popups:</strong> Updates happen quietly in the background without noisy modal dialogs, installer prompts, or command-line console flashes.
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-900 dark:text-zinc-100">Cryptographically Verified:</strong> Every incoming update payload is cryptographically verified before activation to protect your workstation against tampering.
            </div>
          </div>
        </div>
      </section>

      {/* 8. Tray Controls */}
      <section id="tray-controls" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            8. System Tray Controls &amp; Options
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          CP Engine runs quietly in your Windows system tray. Right-clicking the CP tray icon reveals options:
        </p>
        <ul className="space-y-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li><strong>Show HUD:</strong> Opens the CP dashboard window to inspect status.</li>
          <li><strong>Check for Updates:</strong> Manually checks for edge updates.</li>
          <li><strong>Start with Windows:</strong> Automatically starts CP on system login so high-speed copying is always available.</li>
          <li><strong>Exit:</strong> Safely closes CP Engine, restoring standard Explorer transfer handling.</li>
        </ul>
      </section>

      {/* 9. Performance Tips */}
      <section id="performance-tips" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            9. Performance Tips &amp; Maximizing Speed
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          To get the highest possible throughput during file copies:
        </p>
        <div className="space-y-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            <strong>Same-Drive vs Cross-Drive Copies:</strong> Copying between two separate NVMe SSD drives (e.g., from Drive C: to Drive D:) will achieve maximum speeds, as each drive utilizes dedicated read and write channels. Same-drive copies share bandwidth on the same controller.
          </p>
          <p>
            <strong>Antivirus Real-Time Scanning:</strong> Third-party security suites often inspect incoming files in real-time. For multi-gigabyte ISOs and game directories, adding your destination media folder to your scanner exclusion list ensures maximum transfer speed.
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
              Q: Windows SmartScreen displays &ldquo;Windows protected your PC&rdquo; on launch. Is this expected?
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <strong>Yes.</strong> As a newly launched base release (v0.0.1), Microsoft SmartScreen displays a standard informational prompt until global download reputation builds up. Click <strong>More info</strong> and select <strong>Run anyway</strong>. You can verify the official SHA-256 hash before running to be 100% confident.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h3 className="font-bold text-zinc-950 dark:text-zinc-50 mb-1">
              Q: Does CP Engine touch my regular text copy/paste (like code or passwords)?
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <strong>No, never.</strong> CP Engine strictly acts on file copy events. When copying plain text, code snippets, URLs, or passwords, CP Engine never touches or interacts with the clipboard in any way.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <h3 className="font-bold text-zinc-950 dark:text-zinc-50 mb-1">
              Q: Where are CP Engine log files stored?
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              If diagnostic logging is enabled, files are stored strictly on your local PC in <code className="font-mono">%LOCALAPPDATA%\CP\logs</code>. Telemetry or personal data is never transmitted to the cloud.
            </p>
          </div>
        </div>
      </section>
    </CpLegalLayout>
  );
}
