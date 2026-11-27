"use client";

import React from "react";
import Link from "next/link";
import {
  Zap,
  Puzzle,
  ListOrdered,
  Cpu,
  ShieldCheck,
  HardDriveDownload,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import {
  DOWNEX_COMPARISON_ROWS,
  DOWNEX_FAQS,
  DOWNEX_TOPIC_PAGES,
  DOWNEX_GITHUB_URL,
  DOWNEX_DESKTOP_DOWNLOAD_URL,
  DOWNEX_SHA256,
} from "@/lib/data/downex-seo";

interface DownexSeoSectionsProps {
  desktopDownloadUrl?: string;
  onOpenDownload?: () => void;
}

export default function DownexSeoSections({
  desktopDownloadUrl = DOWNEX_DESKTOP_DOWNLOAD_URL,
  onOpenDownload,
}: DownexSeoSectionsProps) {
  return (
    <div className="relative z-10 w-full select-text border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/85">
      <div className="max-w-5xl xl:max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 space-y-20">
        {/* 1. Core Value & Feature Grid */}
        <section id="overview" className="space-y-8 scroll-mt-16">
          <div className="max-w-3xl space-y-3">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
              Free Open Source Windows Download Manager
            </p>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
              Built to replace paid, bloated download managers with clean speed.
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Downex is a lightweight, simple download manager for{" "}
              <strong className="text-zinc-900 dark:text-zinc-200">Windows 10 and Windows 11</strong>{" "}
              engineered in Rust and Tauri. Whether you are looking for a{" "}
              <Link href="/idm-alternative" className="text-violet-600 dark:text-violet-400 underline underline-offset-4 hover:opacity-80">
                free IDM alternative
              </Link>
              , an{" "}
              <Link href="/open-source-download-manager" className="text-violet-600 dark:text-violet-400 underline underline-offset-4 hover:opacity-80">
                open-source download accelerator
              </Link>
              , or a clean tool that grabs Chrome and Edge links automatically, Downex saturates your full fiber or broadband connection without nag popups, ads, or high RAM usage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-5 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                32-Stream HTTP/1.1 Acceleration
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Splits large downloads across up to 32 dedicated TCP sockets with dynamic tail-end work stealing so slow threads never stall the final 5%.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-5 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Puzzle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                Auto Browser Link Catch
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                UI-less Manifest V3 extension catches Chrome, Edge, and Brave downloads over authenticated localhost handshakes with zero injected page ads.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-5 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ListOrdered className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                Sequential 1-by-1 Queue
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Queues multi-file batches cleanly inside the Queues workspace and finishes one file at full line speed before starting the next.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-5 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                4 GB Low-RAM Auto Eco Mode
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Automatically trims background WebView memory, caps connections smoothly, and lowers priority when 4 GB RAM or system load spikes are detected.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Downex vs IDM vs Browser Default Table */}
        <section id="vs-idm" className="space-y-6 scroll-mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Direct Comparison
              </p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                Downex vs IDM vs Browser Downloader
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                See why users switch from 30-day shareware trials and single-stream browser downloaders to a clean, open-source Windows download manager.
              </p>
            </div>
            <Link
              href="/idm-alternative"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline shrink-0"
            >
              <span>Read Full IDM Comparison</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-xs">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                  <th className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">Capability</th>
                  <th className="py-3.5 px-4 font-bold text-emerald-700 dark:text-emerald-400">Downex (Free)</th>
                  <th className="py-3.5 px-4 font-bold text-zinc-600 dark:text-zinc-400">IDM (Paid Trial)</th>
                  <th className="py-3.5 px-4 font-bold text-zinc-500 dark:text-zinc-500">Browser Built-In</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                {DOWNEX_COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{row.feature}</td>
                    <td className="py-3 px-4 text-emerald-700 dark:text-emerald-300 font-medium">{row.downex}</td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{row.idm}</td>
                    <td className="py-3 px-4 text-zinc-500 dark:text-zinc-500">{row.browser}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Architecture & Integrity Deep Dive */}
        <section id="architecture" className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start scroll-mt-16">
          <div className="space-y-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
              Engineering Highlights
            </p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
              Engineered in Rust for Reliability, Resume Safety &amp; Zero Corruption
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Ordinary download tools often corrupt half-finished `.part` files when a laptop sleeps or Wi-Fi drops. Downex treats every download as a recoverable transaction: byte ranges are checkpointed atomically into SQLite WAL storage and staged in an isolated <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-xs">unconfirmed.&lt;name&gt;.downex</code> workspace before final promotion and disk-size verification.
            </p>

            <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 pt-1">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Custom Speed Limits &amp; Auto-Shutdown:</strong> Pin bandwidth (`50Mb`–`200Mb` or custom) so calls stay crisp, or let Windows shut down safely only after disk byte verification passes.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Silent Cryptographic Updates:</strong> Background updates verify AES-256-GCM containers + Ed25519 Minisign keys and never interrupt active downloads or typing.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Zero Telemetry &amp; Verifiable Installer:</strong> Local SQLite history only; inspectable SHA-256 (<code className="font-mono text-[11px] text-zinc-500">{DOWNEX_SHA256.slice(0, 16)}...</code>).
                </span>
              </li>
            </ul>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={desktopDownloadUrl}
                download="DownexSetup.exe"
                data-downex-bypass="true"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold shadow-sm transition-all"
              >
                <HardDriveDownload className="w-4 h-4" />
                <span>Download DownexSetup.exe</span>
              </a>
              <a
                href={DOWNEX_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
              >
                <FaGithub className="w-4 h-4" />
                <span>Inspect Source on GitHub</span>
              </a>
              {onOpenDownload && (
                <button
                  type="button"
                  onClick={onOpenDownload}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-500/15 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Checksums &amp; Extension</span>
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              <span>DOWNEX DESKTOP WORKSPACE PREVIEW</span>
              <Link href="/how-queues-work" className="text-violet-600 dark:text-violet-400 hover:underline">
                Queue Guide &rarr;
              </Link>
            </div>
            <img
              src="/docs/downex/queue-light.png"
              alt="Downex Download Manager sequential 1-by-1 queue interface screenshot"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 block dark:hidden"
              loading="lazy"
            />
            <img
              src="/docs/downex/queue-dark.png"
              alt="Downex Download Manager dark mode interface screenshot"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 hidden dark:block"
              loading="lazy"
            />
          </div>
        </section>

        {/* 4. Crawlable Native FAQ Section */}
        <section id="faq" className="space-y-6 scroll-mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
                Frequently Asked Questions
              </p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                Everything to Know Before Installing Downex
              </h2>
            </div>
            <Link
              href="/faq"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline shrink-0"
            >
              <span>View Full FAQ Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {DOWNEX_FAQS.map((item, idx) => (
              <details
                key={item.question}
                open={idx < 2}
                className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 open:border-violet-500/40 dark:open:border-violet-500/40 transition-colors"
              >
                <summary className="flex items-start justify-between gap-3 cursor-pointer list-none font-bold text-xs sm:text-sm text-zinc-950 dark:text-zinc-50">
                  <span>{item.question}</span>
                  <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2.5 text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* 5. Topic Cluster Resource Guides & Portfolio Case Study Links */}
        <section id="guides" className="space-y-5 scroll-mt-16 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Downex Guides, Comparisons &amp; Documentation</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Explore deep-dive pages covering IDM comparisons, simple setup, open-source Rust architecture, and browser link integration.
              </p>
            </div>
            <a
              href="https://gauravpatil.site/projects/downex-download-manager"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
            >
              <span>Engineering Case Study</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DOWNEX_TOPIC_PAGES.map((guide) => (
              <Link
                key={guide.slug}
                href={guide.slug}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 hover:border-violet-500/40 dark:hover:border-violet-500/40 p-3.5 flex items-center justify-between gap-3 transition-all group"
              >
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {guide.shortTitle}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {guide.navLabel}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
