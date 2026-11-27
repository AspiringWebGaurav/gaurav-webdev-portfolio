import type { Metadata } from "next";
import DownexLegalLayout from "@/components/downex/DownexLegalLayout";
import {
  ListOrdered,
  Zap,
  Clock,
  CheckCircle2,
  Cpu,
  Power,
  FolderOpen,
  Sparkles,
  Layers,
  Pause,
  HelpCircle
} from "lucide-react";
import Image from "next/image";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  metadataBase: new URL("https://downex.apps.gauravpatil.site"),
  title: {
    absolute: "How 1-by-1 Queue Works | Downex Download Manager",
  },
  description:
    "Official guide on Downex sequential 1-by-1 Queue: how sequential downloading dedicates full 32-stream bandwidth to one file at a time, eliminating bandwidth competition and connection crawl.",
  alternates: {
    canonical: "https://downex.apps.gauravpatil.site/how-queues-work",
  },
  openGraph: {
    title: "How 1-by-1 Queue Works | Downex Download Manager",
    description:
      "Understand Downex 1-by-1 Queue: full 32-stream bandwidth dedication, automatic task handoff, FIFO waiting line, and zero-stall browsing.",
    url: "https://downex.apps.gauravpatil.site/how-queues-work",
    siteName: "Downex",
  },
};

const queueSections = [
  { id: "concept", title: "1. Why 1-by-1 Queue Beats Simultaneous Downloading" },
  { id: "visual-flow", title: "2. The 3-Step Queue Architecture" },
  { id: "step-1", title: "3. Step 1: Enqueue via 'Download Later' (Ctrl+N)" },
  { id: "step-2", title: "4. Step 2: FIFO Priority & Idle Waiting Line" },
  { id: "step-3", title: "5. Step 3: Full 32-Stream Dedicated Turbo Download" },
  { id: "step-4", title: "6. Step 4: Instant Automatic Handoff to Next File" },
  { id: "app-ui", title: "7. Downex Queues UI Reference (Light & Dark)" },
  { id: "controls", title: "8. Queue Controls: Pause, Resume & Auto-Shutdown" },
  { id: "faq", title: "9. Frequently Asked Questions & Pro Tips" },
];

export default function DownexQueueGuidePage() {
  return (
    <DownexLegalLayout
      title="How 1-by-1 Queue Works"
      badge="Sequential Turbo Architecture &bull; Zero Bandwidth Thrashing"
      lastUpdated="November 2026"
      summary="Downex 1-by-1 Queue is engineered to download your files sequentially at maximum speed instead of fighting over split bandwidth. By focusing all 32 parallel network sockets on one task at a time, your files finish dramatically faster with zero lag on your browsing."
      sections={queueSections}
    >
      {/* 1. Why 1-by-1 Queue Beats Simultaneous Downloading */}
      <section id="concept" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            1. Why 1-by-1 Queue Beats Simultaneous Downloading
          </h2>
        </div>
        
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          When you download multiple files at the same time in conventional web browsers or older downloaders, each download competes for your internet bandwidth, router buffers, and disk write slots. If you have 4 downloads running simultaneously on a 100 Mbps connection, each file crawls at approximately 25 Mbps, and <strong>none of them finish until the very end</strong>.
        </p>

        {/* Visual Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Simultaneous Bad */}
          <div className="p-4 rounded-xl border border-red-200 dark:border-red-950/60 bg-red-50/40 dark:bg-red-950/20 space-y-2.5">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-xs font-mono uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Simultaneous Downloading (Split)</span>
            </div>
            <ul className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li><strong>Bandwidth Fragmentation:</strong> 4 files split your connection into 4 slow streams.</li>
              <li><strong>Slow Time-to-First-File:</strong> You cannot open or use any file until all 4 finish simultaneously.</li>
              <li><strong>Disk &amp; Router Thrashing:</strong> Multiple concurrent disk writes create drive head contention and router bufferbloat.</li>
              <li><strong>Laggy Browsing:</strong> Background multi-downloads choke web browsing, videos, and gaming ping.</li>
            </ul>
          </div>

          {/* 1-by-1 Queue Good */}
          <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs font-mono uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Downex 1-by-1 Queue (Dedicated)</span>
            </div>
            <ul className="text-xs text-zinc-800 dark:text-zinc-200 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li><strong>100% Dedicated Speed:</strong> File #1 receives your entire connection speed (up to 32 parallel sockets).</li>
              <li><strong>Instant First File Delivery:</strong> File #1 finishes in 1/4 the time, ready for you to watch, install, or read immediately.</li>
              <li><strong>Clean Sequential I/O:</strong> Zero disk head thrashing; writes are stream-piped cleanly onto NVMe/SSD/HDD.</li>
              <li><strong>Automatic Handoff:</strong> When File #1 completes, Downex immediately hands over full bandwidth to File #2.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 2. The 3-Step Queue Architecture */}
      <section id="visual-flow" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            2. The 3-Step Queue Architecture
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Downex divides the entire queue lifecycle into three crystal-clear, automated phases:
        </p>

        {/* 3 Step Industrial Cards Matching Downex UI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {/* Card 1 */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono font-bold text-xs flex items-center justify-center">
                1
              </span>
              <Clock className="w-4 h-4 text-zinc-400" />
            </div>
            <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">
              Add &amp; Choose Later
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Press <strong>Ctrl+N</strong> or click <strong>+ New Download</strong>. Paste your URL and select <strong>Download Later</strong> (<Clock className="w-3 h-3 inline text-zinc-500" />) to safely enqueue.
            </p>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10.5px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Step 01</span>
              <span>Enqueue</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono font-bold text-xs flex items-center justify-center">
                2
              </span>
              <ListOrdered className="w-4 h-4 text-zinc-400" />
            </div>
            <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">
              Lines Up in Order
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Queued files wait in sequence inside the <strong>Queues</strong> workspace without consuming bandwidth or slowing down your PC.
            </p>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10.5px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Step 02</span>
              <span>FIFO Order</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-xl border border-emerald-500/30 dark:border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-900 font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                3
              </span>
              <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-current" />
            </div>
            <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
              Sequential 1-by-1
            </h3>
            <p className="text-xs text-emerald-900/90 dark:text-emerald-300/90 leading-relaxed">
              Files download at full <strong>32-stream multi-socket speed</strong> one after another until the entire queue completes.
            </p>
            <div className="pt-2 border-t border-emerald-500/20 text-[10.5px] font-mono text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span>Step 03</span>
              <span>Turbo Speed</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Step 1: Enqueue via 'Download Later' (Ctrl+N) */}
      <section id="step-1" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            3. Step 1: Enqueue via &quot;Download Later&quot; (Ctrl+N)
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Adding downloads to your queue is effortless. You can enqueue tasks through either of two convenient entry points:
        </p>

        <div className="space-y-3">
          <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex items-start gap-3">
            <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-mono font-bold text-xs shrink-0">
              A
            </div>
            <div className="space-y-1">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Via New Download Modal (<code className="font-mono text-xs px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">Ctrl+N</code>)
              </span>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Click <strong>+ New Download</strong> in the top toolbar or sidebar, paste your destination link, and click the <strong>Later</strong> button instead of Start Download. Your task is registered with status <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">QUEUED</span>.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex items-start gap-3">
            <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-mono font-bold text-xs shrink-0">
              B
            </div>
            <div className="space-y-1">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                From Existing Paused Downloads in &quot;All Downloads&quot;
              </span>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                If you have downloads already in your main list, simply pause them and click the queue icon (<ListOrdered className="w-3.5 h-3.5 inline text-emerald-600" />) on that row. The download is immediately transferred to the active queue sequence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Step 2: FIFO Priority & Idle Waiting Line */}
      <section id="step-2" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <ListOrdered className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            4. Step 2: FIFO Priority &amp; Idle Waiting Line
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Downex uses strict <strong>FIFO (First-In, First-Out)</strong> priority scheduling. Files queue up in the exact order you registered them:
        </p>

        <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <li>
            <strong>Zero Resource Consumption While Waiting:</strong> Queued tasks are stored in a lightweight state table in SQLite. They consume <strong>0 KB/s of bandwidth</strong>, zero CPU cycles, and zero file locks until their turn arrives.
          </li>
          <li>
            <strong>Pre-Allocated Storage &amp; Resumability:</strong> Downex queries the remote server for HTTP Range headers and Content-Length in advance so each task is pre-verified as fully resumable.
          </li>
          <li>
            <strong>Dedicated Queues Workspace:</strong> Clicking <strong>Queues</strong> in the left sidebar filters the entire interface to reveal your exact waiting line, showing file sizes, target destinations, and status indicators.
          </li>
        </ul>
      </section>

      {/* 5. Step 3: Full 32-Stream Dedicated Turbo Download */}
      <section id="step-3" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            5. Step 3: Full 32-Stream Dedicated Turbo Download
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          When the queue runs, Downex focuses its entire native Rust engine onto the active item:
        </p>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 space-y-3">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-xs uppercase font-mono tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>32-Socket Connection Multi-Threading</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Downex splits the active file into up to 32 byte chunks. Thirty-two parallel TCP sockets connect to the remote host simultaneously. You can expand the download row at any time to monitor each connection segment in real-time with visual ping pulses and downloaded byte counters.
          </p>
        </div>
      </section>

      {/* 6. Step 4: Instant Automatic Handoff to Next File */}
      <section id="step-4" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            6. Step 4: Instant Automatic Handoff to Next File
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          The moment File #1 completes:
        </p>

        <ol className="list-decimal pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <li>
            <strong>Atomic Assembly &amp; Verification:</strong> The temporary partial segments (<code className="font-mono text-xs px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">.downex.part</code>) are merged in-place and finalized into the destination file.
          </li>
          <li>
            <strong>Zero-Click Handoff:</strong> Within less than <strong>50 milliseconds</strong>, Downex activates File #2 in the queue. All 32 parallel sockets are spawned for the next task automatically without any user prompt or mouse click.
          </li>
          <li>
            <strong>Completion Notification:</strong> A clean, non-intrusive notification confirms completion, and the completed file appears in your &quot;All Downloads&quot; history with full &quot;Open File&quot; and &quot;Open Folder&quot; shortcuts.
          </li>
        </ol>
      </section>

      {/* 7. Downex Queues UI Reference (Light & Dark) */}
      <section id="app-ui" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <FolderOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            7. Downex Queues UI Reference (Light &amp; Dark)
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Here is the exact real-time interface of Downex&apos;s Queues workspace, rendered natively in crisp Light and Dark themes:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Light Theme Screenshot Card */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                Light Mode &bull; Queues Workspace
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                172px Sidebar
              </span>
            </div>
            <div className="relative aspect-4/3 w-full bg-zinc-100 dark:bg-zinc-950">
              <Image
                src="/docs/downex/queue-light.png"
                alt="Downex Queues Workspace Light Mode Screenshot"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
                priority
              />
            </div>
            <div className="p-3 text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal border-t border-zinc-100 dark:border-zinc-800">
              Clean, high-contrast industrial UI with dedicated Start Queue button, status badges, and 3-step queue visualizer.
            </div>
          </div>

          {/* Dark Theme Screenshot Card */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                Dark Mode &bull; Queues Workspace
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                OLED Optimized
              </span>
            </div>
            <div className="relative aspect-4/3 w-full bg-zinc-100 dark:bg-zinc-950">
              <Image
                src="/docs/downex/queue-dark.png"
                alt="Downex Queues Workspace Dark Mode Screenshot"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
                priority
              />
            </div>
            <div className="p-3 text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal border-t border-zinc-100 dark:border-zinc-800">
              True-black background with emerald accent highlights, low eye strain for overnight downloading sessions.
            </div>
          </div>
        </div>
      </section>

      {/* 8. Queue Controls: Pause, Resume & Auto-Shutdown */}
      <section id="controls" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Power className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            8. Queue Controls: Pause, Resume &amp; Auto-Shutdown
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          You are always in complete control of your queue:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-zinc-900 dark:text-zinc-100">
              <Pause className="w-4 h-4 text-amber-500" />
              <span>Pause &amp; Resume Queue</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Click <strong>Pause Queue</strong> at any time. The active task pauses cleanly, and all completed segments remain saved on disk so you never lose progress.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-zinc-900 dark:text-zinc-100">
              <Power className="w-4 h-4 text-purple-500" />
              <span>Arm Auto-Shutdown</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Enable the power icon (<Power className="w-3 h-3 inline text-purple-500" />) on your queue items. Once the last queued file finishes, Downex provides a polite 30-second countdown and cleanly shuts down your workstation.
            </p>
          </div>
        </div>
      </section>

      {/* 9. Frequently Asked Questions & Pro Tips */}
      <section id="faq" className="space-y-4 scroll-mt-28">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <HelpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
            9. Frequently Asked Questions &amp; Pro Tips
          </h2>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1.5">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              What happens if my Wi-Fi drops while the queue is running?
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Downex automatically detects network interruptions. It holds the active task safely in a paused state and retries as soon as Windows signals that the network connection is restored. You will never have to restart a large download from 0%.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1.5">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Can I run an urgent download while the queue is active?
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Yes. You can switch to the <strong>All Downloads</strong> tab and click Start on any individual task at any time. Downex allows ad-hoc manual tasks to run concurrently if you need a file right away.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1.5">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Does Downex queue support file speed limits?
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Yes. You can set individual speed limits (e.g. 5 MB/s, 10 MB/s, 25 MB/s) or leave it unlimited. The queue scheduler respects your speed limit settings per file.
            </p>
          </div>
        </div>
      </section>
    </DownexLegalLayout>
  );
}
