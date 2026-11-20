import type { Metadata } from "next";
import Link from "next/link";
import { Power, RefreshCw, Moon, XCircle, ShieldCheck, Zap, Sliders, ArrowLeft } from "lucide-react";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Documentation & User Guide | ScheduleMe",
  description: "Official guide and technical overview of ScheduleMe — the lightweight Windows shutdown, restart, and sleep scheduler.",
  openGraph: {
    title: "Documentation | ScheduleMe",
    description: "Learn how to schedule automated power actions, configure tray integration, and use ScheduleMe on Windows.",
    url: "https://sm.apps.gauravpatil.site/docs",
    siteName: "ScheduleMe",
    locale: "en_US",
    type: "website",
  },
};

export default function ScheduleMeDocsPage() {
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-zinc-100 font-sans antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group"
            title="ScheduleMe"
          >
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-700/80 shadow-xs flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 64 64" fill="none" className="w-full h-full" aria-hidden="true">
                <path d="M21.64 16.63A20.16 20.16 0 1 0 42.36 16.63" stroke="#DC2626" strokeWidth="7" strokeLinecap="round" />
                <line x1="32" y1="10.24" x2="32" y2="30.72" stroke="#DC2626" strokeWidth="7" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
              ScheduleMe
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              Docs
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs font-medium">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <a
              href="https://gauravpatil.site"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              Portfolio ↗
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
        {/* Hero Section */}
        <div className="space-y-3 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            ScheduleMe User Guide &amp; Architecture
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            ScheduleMe is an ultra-lightweight Windows automation utility built with Rust and Tauri. It lets you schedule automated shutdown, restart, or sleep in seconds with zero background CPU overhead.
          </p>
        </div>

        {/* Core Actions Grid */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span>Power Actions Supported</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-sm">
                <Power className="w-4 h-4" />
                <span>Shutdown</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Initiates a graceful Windows system shutdown when the timer elapses. Running applications are notified politely to save state.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                <RefreshCw className="w-4 h-4" />
                <span>Restart</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Reboots the system cleanly after scheduled background renders, overnight downloads, or automated batch tasks finish.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                <Moon className="w-4 h-4" />
                <span>Sleep / Standby</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Puts your PC into low-power sleep mode at the designated time, preserving session state and instant wake capability.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                <XCircle className="w-4 h-4" />
                <span>Abort / Cancel</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cancel any armed timer instantly with a single click or keyboard shortcut. Disarms all pending Windows system timers.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Time Presets & Custom Configuration */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-500" />
            <span>Preset &amp; Custom Timers</span>
          </h2>
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 shadow-2xs space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              ScheduleMe provides instant single-click presets: <strong>15m</strong>, <strong>30m</strong>, <strong>45m</strong>, <strong>1h</strong>, and <strong>2h</strong>.
            </p>
            <p>
              You can also define an exact target time (e.g. <code>02:30 AM</code>) or a custom duration (e.g. <code>3 hours 15 minutes</code>). Once armed, ScheduleMe minimizes to the notification area and counts down quietly.
            </p>
          </div>
        </section>

        {/* Zero CPU Rust Win32 Architecture */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span>Architecture &amp; Performance</span>
          </h2>
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 shadow-2xs space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Zero CPU Polling:</strong> Implemented with native Win32 waitable timers (<code>CreateWaitableTimer</code>). The process goes into an alertable sleep state without constantly waking the CPU.</li>
              <li><strong>Silent Notification Tray:</strong> Closing the window minimizes directly to the system tray. The tray tooltip displays the remaining armed countdown in real-time.</li>
              <li><strong>NTFS In-Process Atomic Updates:</strong> Updates are streamed directly from GPHost via Cloudflare R2 and swapped in-place with zero dialogs or setup wizards.</li>
            </ul>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 px-4 sm:px-6 py-4 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
        <p>© 2026 Gaurav Patil · ScheduleMe · sm.apps.gauravpatil.site</p>
      </footer>
    </div>
  );
}
