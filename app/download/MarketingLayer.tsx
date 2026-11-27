"use client";

import React, { useState } from "react";
import {
  Download,
  ListOrdered,
  Activity,
  Plus,
  Settings,
  Gauge,
  Trash2,
  Search,
  File,
  Copy,
  ChevronDown,
  ChevronLeft,
  FolderOpen,
  X,
  Minus,
  Power,
  Moon,
  Sun,
  ArrowRight,
  Puzzle,
  Zap,
  RefreshCw,
  ShieldCheck,
  Pause,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { EcosystemLink } from "@/components/ui/EcosystemLink";
import { Spotlight } from "@/components/ui/Spotlight";
import DownexSeoSections from "@/components/downex/DownexSeoSections";

// Static telemetry constants (Ubuntu 24.04 LTS open-source ISO) - 100% Zero-JS-Overhead, Vercel Edge Optimized
const FILE_SIZE = "5.80 GB";
const DOWNLOADED_PROGRESS = "4.35 GB (75%)";
const TRANSFER_RATE_FULL = "84.6 MB/s (677 Mbps)";
const TRANSFER_RATE_COMPACT = "84.6 MB/s";
const TIME_LEFT_FULL = "17 sec left";
const TIME_LEFT_COMPACT = "17 sec";
const PROGRESS_WIDTH = "75%";

interface MarketingLayerProps {
  onOpenDownload: () => void;
  desktopDownloadUrl?: string;
  extensionDownloadUrl?: string;
  detectedOS?: string;
}

export default function MarketingLayer({
  onOpenDownload,
  desktopDownloadUrl = "https://gphost.eu.cc/raw/downex-desktop?stream=true",
}: MarketingLayerProps) {
  const [startingDesktop, setStartingDesktop] = useState(false);

  const handleDesktopDownloadClick = () => {
    setStartingDesktop(true);
    setTimeout(() => setStartingDesktop(false), 2200);
  };
  return (
    <div data-portal="download" className="relative w-full min-h-dvh flex flex-col">
      {/* Aceternity Spotlight for subtle ambient glow in dark mode */}
      <div className="pointer-events-none select-none hidden dark:block">
        <Spotlight
          className="-top-24 left-1/3 h-[90vh] w-[70vw]"
          fill="#8b5cf6"
        />
      </div>

      {/* =======================================================================
          MOBILE MARKETING HERO (Strict 100dvh First Fold, Scrollable SEO Below)
          ======================================================================= */}
      <div className="flex md:hidden h-dvh min-h-dvh max-h-dvh w-full flex-col justify-between overflow-hidden p-3.5 relative z-10 select-none">
        {/* Mobile Header */}
        <header className="w-full h-8 flex items-center justify-between shrink-0 bg-transparent">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-violet-600 dark:text-violet-400 stroke-[2.2]" />
            <span className="font-brand text-[21px] text-zinc-950 dark:text-zinc-50 tracking-wide leading-none">
              downex
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle variant="inline" className="w-7 h-7 shrink-0" />
            <button
              onClick={onOpenDownload}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>
          </div>
        </header>

        {/* Mobile Hero Header */}
        <div className="shrink-0 text-center pt-1">
          <h1 className="text-xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
            <span>Downex: Simple Free</span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 dark:from-violet-400 dark:via-purple-300 dark:to-indigo-300">
              Download Manager.
            </span>
          </h1>

          <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-1 px-2 leading-relaxed">
            Auto grab links with 32-stream speed. Free Windows IDM alternative — install once and go.
          </p>
        </div>

        {/* Mobile PC App Mockup Preview (Matched to Latest Downex Desktop UI) */}
        <div className="flex-1 min-h-0 flex flex-col justify-center my-2">
          <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 shadow-md flex flex-col justify-between">
            {/* Window Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex items-center gap-1.5">
                <img
                  src="/brand/downex-logo.png"
                  alt="Downex"
                  className="w-4 h-4 shrink-0 object-contain pointer-events-none"
                />
                <span className="font-extrabold text-[13px] tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
                  downex
                </span>
                <span className="text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.12em] uppercase font-mono leading-none">
                  download manager
                </span>
              </div>

              <div className="flex items-center gap-1 text-zinc-400">
                <Minus className="w-3 h-3" />
                <X className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Active Download Task Card (Latest Industrial Card Layout) */}
            <div className="rounded-xl border border-emerald-500/50 dark:border-emerald-500/40 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs ring-1 ring-emerald-500/15">
              {/* Card Title Bar Strip */}
              <div className="h-7 px-2.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35">
                    #1
                  </span>
                  <span className="font-mono text-[9.5px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                    DOWNLOADING
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-5 px-1.5 border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono text-[9px] uppercase font-semibold inline-flex items-center gap-0.5">
                    <Pause className="w-2.5 h-2.5 fill-current" />
                    <span>Pause</span>
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-2.5 space-y-2">
                <div className="flex items-center border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 px-2 py-1 gap-1.5">
                  <File className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="flex-1 font-mono text-[10.5px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    ubuntu-24.04-desktop-amd64.iso
                  </span>
                  <span className="px-1 py-0.2 text-[8.5px] font-mono font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase shrink-0">
                    .ISO
                  </span>
                </div>

                {/* 2x2 Industrial Telemetry Grid */}
                <div className="grid grid-cols-2 gap-1.5 text-[9.5px] font-mono">
                  <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/40 px-2 py-1 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] uppercase text-zinc-400 block leading-tight">File Size</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{FILE_SIZE}</span>
                    </div>
                    <span className="text-[8px] px-1 py-0.2 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                      RESUME OK
                    </span>
                  </div>
                  <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/40 px-2 py-1 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] uppercase text-zinc-400 block leading-tight">Downloaded</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{DOWNLOADED_PROGRESS}</span>
                    </div>
                    <span className="text-[8px] px-1 py-0.2 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 font-semibold">
                      75%
                    </span>
                  </div>
                  <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/40 px-2 py-1">
                    <span className="text-[8px] uppercase text-zinc-400 block leading-tight">Transfer rate</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{TRANSFER_RATE_COMPACT}</span>
                  </div>
                  <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/40 px-2 py-1 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] uppercase text-zinc-400 block leading-tight">Time left</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{TIME_LEFT_COMPACT}</span>
                    </div>
                    <span className="text-[8px] text-zinc-400 uppercase">LIVE</span>
                  </div>
                </div>

                {/* Emerald Progress Bar */}
                <div className="w-full h-3 bg-zinc-200/90 dark:bg-zinc-800/90 rounded-sm p-[1px] shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.22)] border border-zinc-300/80 dark:border-zinc-700/80 relative overflow-hidden flex items-center">
                  <div
                    className="h-full rounded-xs transition-all duration-300 relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                    style={{ width: PROGRESS_WIDTH }}
                  >
                    <div className="absolute inset-0 animate-stripes opacity-45 mix-blend-overlay pointer-events-none" />
                    <div className="animate-shimmer pointer-events-none" />
                    <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_#ffffff,0_0_14px_#34d399] animate-pulse pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Benefits */}
            <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px] text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-violet-600 dark:text-violet-400 shrink-0" />
                <span>32x Multi-Thread</span>
              </div>
              <div className="flex items-center gap-1">
                <Puzzle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Auto Link Catch</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Main CTA Buttons (Live v0.0.1 Installer + Mirrors) */}
        <div className="shrink-0 mb-1 flex items-center gap-2">
          <a
            href={desktopDownloadUrl}
            download="DownexSetup.exe"
            data-downex-bypass="true"
            onClick={handleDesktopDownloadClick}
            className="flex-1 h-10 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className={`w-3.5 h-3.5 ${startingDesktop ? "animate-bounce" : ""}`} />
            <span>{startingDesktop ? "Starting download..." : "Download v0.0.1"}</span>
            <ArrowRight className="w-3 h-3 opacity-70" />
          </a>
          <button
            onClick={onOpenDownload}
            className="h-10 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Puzzle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Extension</span>
          </button>
        </div>

        {/* Mobile Scroll Cue to SEO Overview & Comparison */}
        <div className="w-full py-1 flex items-center justify-center shrink-0">
          <a
            href="#overview"
            className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            <span>Compare vs IDM &amp; Features</span>
            <ChevronDown className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* =======================================================================
          DESKTOP MARKETING HERO (Strict 100dvh First Fold, Scrollable SEO Below)
          ======================================================================= */}
      <div className="hidden md:flex h-dvh min-h-dvh max-h-dvh w-full flex-col justify-between overflow-hidden relative z-10 select-none">
        {/* Desktop Navbar */}
        <header className="w-full px-6 lg:px-8 h-12 lg:h-14 flex items-center justify-between shrink-0 bg-transparent transition-colors">
          <div className="flex items-center gap-2.5">
            <Download className="w-6 h-6 text-violet-600 dark:text-violet-400 stroke-[2.2]" />
            <span className="font-brand text-[25px] text-zinc-950 dark:text-zinc-50 tracking-wide leading-none select-none">
              downex
            </span>
          </div>

          {/* Navigation & Actions */}
          <nav className="flex items-center gap-3.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <a
              href="#vs-idm"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Features &amp; vs IDM
            </a>

            <span className="h-3.5 w-[1.5px] bg-zinc-300 dark:bg-zinc-700 rounded-full shrink-0" aria-hidden="true" />

            <a
              href="/faq"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              FAQ
            </a>

            <span className="h-3.5 w-[1.5px] bg-zinc-300 dark:bg-zinc-700 rounded-full shrink-0" aria-hidden="true" />

            <EcosystemLink
              href="https://gauravpatil.site"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Portfolio
            </EcosystemLink>

            <span className="h-3.5 w-[1.5px] bg-zinc-300 dark:bg-zinc-700 rounded-full shrink-0" aria-hidden="true" />

            <a
              href="https://github.com/AspiringWebGaurav/downex"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              GitHub
            </a>

            <span className="h-3.5 w-[1.5px] bg-zinc-300 dark:bg-zinc-700 rounded-full shrink-0" aria-hidden="true" />

            <ThemeToggle variant="inline" className="w-8 h-8 shrink-0" />

            <span className="h-3.5 w-[1.5px] bg-zinc-300 dark:bg-zinc-700 rounded-full shrink-0" aria-hidden="true" />

            <button
              onClick={onOpenDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </nav>
        </header>

        {/* Desktop Main Content Area (Strictly Fits Viewport, Zero Scroll) */}
        <main className="w-full flex-1 min-h-0 flex flex-col justify-evenly py-1 lg:py-2 px-4 lg:px-8 max-w-5xl xl:max-w-6xl mx-auto">
          {/* Hero Pitch Headline (Locked in Single Line) */}
          <div className="text-center shrink-0 w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
            <h1 className="text-2xl md:text-[26px] lg:text-[34px] xl:text-[40px] font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight md:whitespace-nowrap">
              <span>Downex: Simple Free</span>{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-300 dark:to-indigo-300">
                Download Manager.
              </span>
            </h1>

            <p className="text-xs lg:text-sm text-zinc-600 dark:text-zinc-400 mt-1 font-normal max-w-2xl mx-auto leading-relaxed">
              Free &amp; open-source Windows IDM alternative with 32x streams and auto browser link catch.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex items-center justify-center gap-3 mt-2.5">
              <a
                href={desktopDownloadUrl}
                download="DownexSetup.exe"
                data-downex-bypass="true"
                onClick={handleDesktopDownloadClick}
                className="group inline-flex items-center justify-center gap-2.5 h-10 lg:h-11 px-6 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs lg:text-sm font-bold shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Download className={`w-4 h-4 ${startingDesktop ? "animate-bounce" : ""}`} />
                <span>{startingDesktop ? "Starting download..." : "Download for Windows"}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </a>

              <button
                onClick={onOpenDownload}
                className="inline-flex items-center justify-center gap-2 h-10 lg:h-11 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800/80 active:scale-95 transition-all cursor-pointer"
              >
                <Puzzle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Extension &amp; Mirrors</span>
              </button>
            </div>
          </div>

          {/* PC App UI Mockup (1:1 Matched to Latest Downex Desktop UI v0.0.1) */}
          <div className="w-full max-w-4xl mx-auto shrink-0 my-1">
            <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-950 shadow-2xl shadow-zinc-900/10 dark:shadow-black/60 overflow-hidden text-left transition-all">
              {/* Window Header (Latest DownexWindowHeader: Logo + downex DOWNLOAD MANAGER + Frosted Notice Marquee + Window Controls) */}
              <div className="h-9 px-3 bg-white/95 dark:bg-zinc-950/95 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between select-none">
                <div className="flex items-center gap-2 shrink-0">
                  <img
                    src="/brand/downex-logo.png"
                    alt="Downex"
                    className="w-[18px] h-[18px] shrink-0 object-contain pointer-events-none"
                  />
                  <span className="font-extrabold text-[13.5px] tracking-tight text-zinc-900 dark:text-zinc-100 leading-none select-none">
                    downex
                  </span>
                  <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.14em] uppercase font-mono leading-none select-none">
                    download manager
                  </span>
                </div>

                {/* Empty Draggable Titlebar Center (Dynamic Marquee Reserved Strictly for App Owner Broadcasts) */}
                <div className="flex-1 min-w-0" />

                {/* Window Controls */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="w-7 h-6 flex items-center justify-center rounded-[2px] text-zinc-400 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    <Minus className="w-3.5 h-3.5 stroke-[2.2]" />
                  </span>
                  <span className="w-7 h-6 flex items-center justify-center rounded-[2px] text-zinc-400 hover:bg-[#e81123] hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5 stroke-[2.2]" />
                  </span>
                </div>
              </div>

              {/* App Body: Real Sidebar + Main Workspace */}
              <div className="flex">
                {/* Latest DownexSidebar (#FAFAFA light / zinc-900 dark, crisp rounded-sm items + Bottom APP VERSION + Check updates + Theme toggle) */}
                <div className="relative hidden sm:flex flex-col justify-between w-[164px] lg:w-[172px] bg-[#FAFAFA] dark:bg-zinc-900 shrink-0 select-none text-xs border-r border-zinc-200 dark:border-zinc-800">
                  {/* Collapse Toggle Circle on Border */}
                  <div className="absolute -right-2.5 top-[23px] -translate-y-1/2 z-10 w-5 h-5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/90 shadow-sm flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                    <ChevronLeft className="w-3 h-3 stroke-[2.2]" />
                  </div>

                  {/* Top Navigation */}
                  <div className="px-2.5 pt-2 space-y-0.5 font-mono">
                    <div className="h-[27px] px-2.5 rounded-sm bg-black text-white dark:bg-white dark:text-zinc-950 font-semibold flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <Download className="w-3.5 h-3.5 stroke-[2]" />
                        <span className="truncate">All Downloads</span>
                      </div>
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded-sm bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 font-bold">
                        1
                      </span>
                    </div>

                    <div className="h-[26px] px-2.5 rounded-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2 text-[11px] font-medium">
                      <ListOrdered className="w-3.5 h-3.5 shrink-0" />
                      <span>Queues</span>
                    </div>

                    <div className="h-[26px] px-2.5 rounded-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2 text-[11px] font-medium">
                      <Activity className="w-3.5 h-3.5 shrink-0" />
                      <span>Speed &amp; Stats</span>
                    </div>

                    <div className="h-[26px] px-2.5 rounded-sm text-zinc-600 dark:text-zinc-400 flex items-center justify-between text-[11px] font-medium">
                      <div className="flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5 shrink-0 stroke-[2]" />
                        <span>Add URL</span>
                      </div>
                      <span className="text-[9.5px] text-zinc-400 dark:text-zinc-500">
                        Ctrl+N
                      </span>
                    </div>

                    <div className="h-[26px] px-2.5 rounded-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2 text-[11px] font-medium">
                      <Settings className="w-3.5 h-3.5 shrink-0" />
                      <span>Settings</span>
                    </div>

                    <div className="h-[26px] px-2.5 rounded-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2 text-[11px] font-medium">
                      <Gauge className="w-3.5 h-3.5 shrink-0" />
                      <span>Speed Test</span>
                    </div>

                    <div className="h-[26px] px-2.5 rounded-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2 text-[11px] font-medium">
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Trash</span>
                    </div>
                  </div>

                  {/* Bottom Sidebar Version & Utility Footer */}
                  <div className="pt-1.5">
                    <div className="h-[24px] px-2.5 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <span>APP VERSION</span>
                      <span className="font-semibold text-zinc-600 dark:text-zinc-300">v0.0.1</span>
                    </div>
                    <div className="border-t border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 space-y-0.5 font-mono text-[10.5px]">
                      <div className="h-[24px] px-2 rounded-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2 font-medium">
                        <RefreshCw className="w-3.5 h-3.5 shrink-0 stroke-[1.8]" />
                        <span>Check updates</span>
                      </div>
                      <div className="h-[24px] px-2 rounded-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2 font-medium">
                        <Moon className="w-3.5 h-3.5 shrink-0 stroke-[1.8] dark:hidden" />
                        <Sun className="w-3.5 h-3.5 shrink-0 stroke-[1.8] text-amber-400 hidden dark:block" />
                        <span className="dark:hidden">Dark mode</span>
                        <span className="hidden dark:inline">Light mode</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0 flex flex-col justify-between bg-white dark:bg-zinc-950">
                  {/* Top Control Bar (h-10 border-b with Search in app + New Download) */}
                  <div className="h-10 px-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 gap-2.5">
                    <div className="flex-1 max-w-xs h-7 px-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-between text-[11.5px] font-mono text-zinc-400 dark:text-zinc-500">
                      <div className="flex items-center gap-2 min-w-0">
                        <Search className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Search in app... (Ctrl+K)</span>
                      </div>
                      <kbd className="text-[9.5px] px-1.5 py-0.2 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-500 border border-zinc-300/60 dark:border-zinc-700/60 shrink-0">
                        Ctrl+K
                      </kbd>
                    </div>

                    <div className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-semibold shadow-xs shrink-0">
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>New Download</span>
                    </div>
                  </div>

                  {/* Active Download Card Workspace */}
                  <div className="p-2.5 lg:p-3">
                    <div className="rounded-xl border border-emerald-500/50 dark:border-emerald-500/40 bg-white dark:bg-zinc-950 shadow-sm ring-1 ring-emerald-500/20 overflow-hidden">
                      {/* Card Header Strip (#1 DOWNLOADING + Auto-Shutdown + Pause + Delete) */}
                      <div className="h-7.5 px-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35">
                            #1
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                            DOWNLOADING
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 text-[9.5px] font-mono font-medium border bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                            <Power className="w-2.5 h-2.5 text-zinc-400" />
                            <span className="hidden sm:inline">Auto-Shutdown</span>
                          </span>
                          <span className="h-5.5 px-2 border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono text-[9.5px] uppercase tracking-wider font-semibold flex items-center gap-1">
                            <Pause className="w-2.5 h-2.5 fill-current" />
                            <span>Pause</span>
                          </span>
                          <span className="h-5.5 px-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-600 font-mono text-[9.5px] uppercase tracking-wider flex items-center gap-1 opacity-55">
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>Delete</span>
                          </span>
                        </div>
                      </div>

                      {/* Card Body: Structured Industrial Layout */}
                      <div className="p-2.5 lg:p-3 space-y-2">
                        {/* Row 1: File Name Box */}
                        <div className="flex items-center border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 px-2.5 py-1 gap-2">
                          <File className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                          <span className="flex-1 font-mono text-[11.5px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            ubuntu-24.04-desktop-amd64.iso
                          </span>
                          <span className="px-1.5 py-0.2 text-[9.5px] font-mono font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase shrink-0">
                            .ISO
                          </span>
                        </div>

                        {/* Row 2: 2x2 Boxed Telemetry Grid */}
                        <div className="grid grid-cols-2 gap-1.5 font-mono">
                          <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/40 px-2.5 py-1 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] uppercase text-zinc-400 block leading-tight">File Size</span>
                              <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 block leading-snug">
                                {FILE_SIZE}
                              </span>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.2 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 shrink-0">
                              RESUME OK
                            </span>
                          </div>

                          <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/40 px-2.5 py-1 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] uppercase text-zinc-400 block leading-tight">Downloaded</span>
                              <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 block leading-snug">
                                {DOWNLOADED_PROGRESS}
                              </span>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 font-semibold shrink-0">
                              75%
                            </span>
                          </div>

                          <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/40 px-2.5 py-1 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[9px] uppercase text-zinc-400 block leading-tight">Transfer rate</span>
                              <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 block leading-snug truncate">
                                {TRANSFER_RATE_FULL}
                              </span>
                            </div>
                            <span className="hidden lg:inline text-[9px] text-zinc-400 uppercase shrink-0">
                              32 Connections
                            </span>
                          </div>

                          <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/40 px-2.5 py-1 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] uppercase text-zinc-400 block leading-tight">Time left</span>
                              <span className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 block leading-snug">
                                {TIME_LEFT_FULL}
                              </span>
                            </div>
                            <span className="text-[9px] text-zinc-400 uppercase shrink-0">
                              LIVE
                            </span>
                          </div>
                        </div>

                        {/* Row 3: Progress Bar + Inline Speed Limiter (Tight 2px Gap) */}
                        <div className="flex flex-col gap-[2px]">
                          <div className="w-full h-[13px] bg-zinc-200/90 dark:bg-zinc-800/90 rounded-sm p-[1px] shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.22)] border border-zinc-300/80 dark:border-zinc-700/80 relative overflow-hidden flex items-center">
                            <div
                              className="h-full rounded-xs transition-all duration-300 relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                              style={{ width: PROGRESS_WIDTH }}
                            >
                              <div className="absolute inset-0 animate-stripes opacity-45 mix-blend-overlay pointer-events-none" />
                              <div className="animate-shimmer pointer-events-none" />
                              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                              <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                              <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_#ffffff,0_0_14px_#34d399] animate-pulse pointer-events-none" />
                            </div>
                          </div>

                          {/* Inline Speed Limiter Strip */}
                          <div className="flex items-center justify-between gap-1 px-1.5 h-[24px] bg-zinc-50/80 dark:bg-zinc-900/60 rounded-md border border-zinc-200/80 dark:border-zinc-800/80 text-[9.5px] font-mono">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 font-sans font-medium shrink-0">
                                <Gauge className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span className="hidden sm:inline">Limit:</span>
                              </span>
                              <div className="flex items-center gap-0.5">
                                {["50M", "100M", "150M", "180M", "200M"].map((preset) => (
                                  <span
                                    key={preset}
                                    className="h-[18px] px-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center"
                                  >
                                    {preset}
                                  </span>
                                ))}
                                <span className="hidden sm:inline-flex h-[18px] px-1.5 rounded border border-zinc-200/90 dark:border-zinc-700/80 bg-white/80 dark:bg-zinc-800/60 text-zinc-400 items-center">
                                  Custom
                                </span>
                              </div>
                            </div>
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 shrink-0">
                              Unlimited
                            </span>
                          </div>
                        </div>

                        {/* Row 4: Save To Path + Browse */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 min-w-0 border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 px-2 py-0.5 flex items-center gap-1.5">
                            <FolderOpen className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span className="flex-1 font-mono text-[10.5px] text-zinc-800 dark:text-zinc-200 truncate">
                              C:\Users\gaura\Downloads\Downex\ubuntu-24.04-desktop-amd64.iso
                            </span>
                            <Copy className="w-3 h-3 text-zinc-400 shrink-0" />
                          </div>
                          <span className="h-[24px] px-2.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-[9.5px] uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center shrink-0">
                            Browse
                          </span>
                        </div>

                        {/* Row 5: Details Toggle */}
                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-[10px] font-mono font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                            <ChevronDown className="w-3 h-3" />
                            <span>Show details (Connections &amp; Segments)</span>
                          </span>
                          <span className="text-[9.5px] font-mono text-zinc-400 uppercase">
                            ACTIVE TASK
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro Feature Capsules Strip Under Mockup */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-700 dark:text-zinc-300">
                <Zap className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                <span className="truncate"><strong>32x Threads:</strong> Turbo Speed</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-700 dark:text-zinc-300">
                <Puzzle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate"><strong>Auto Catch:</strong> 1-Click Browser</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-700 dark:text-zinc-300">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate"><strong>Pause &amp; Resume:</strong> Zero restarts</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-700 dark:text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 shrink-0" />
                <span className="truncate"><strong>100% Private:</strong> Zero ads</span>
              </div>
            </div>
          </div>
        </main>

        {/* Scroll Cue at Bottom of First Screen */}
        <div className="w-full h-10 shrink-0 flex items-center justify-center">
          <a
            href="#overview"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            <span>Explore Features, vs IDM Comparison &amp; FAQ</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* =======================================================================
          BELOW-THE-FOLD CRAWLABLE SEO SHOWCASE (Comparison, Engine, FAQ & Guides)
          ======================================================================= */}
      <DownexSeoSections
        desktopDownloadUrl={desktopDownloadUrl}
        onOpenDownload={onOpenDownload}
      />

      {/* Unified Footer */}
      <footer className="relative z-10 w-full border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 transition-colors">
        <div className="max-w-5xl xl:max-w-6xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
          <div>
            &copy; {new Date().getFullYear()} Downex &bull;{" "}
            <EcosystemLink
              href="https://gauravpatil.site"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:underline underline-offset-4 decoration-violet-500/50 dark:decoration-violet-400/50 transition-colors"
            >
              Gaurav Patil
            </EcosystemLink>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-medium">
            <a href="/idm-alternative" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline">
              vs IDM
            </a>
            <a href="/how-queues-work" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline">
              1-by-1 Queue
            </a>
            <a href="/faq" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline">
              FAQ
            </a>
            <a
              href="/terms#terms"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline"
            >
              Terms
            </a>
            <a
              href="/privacy#privacy"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline"
            >
              Privacy
            </a>
            <span className="hidden sm:inline-block h-3.5 w-[1.5px] bg-zinc-300 dark:bg-zinc-700 rounded-full shrink-0" aria-hidden="true" />
            <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">
              Fast CDN mirrors powered by{" "}
              <a
                href="https://gphost.eu.cc"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:underline underline-offset-4 decoration-violet-500/50 dark:decoration-violet-400/50 transition-colors"
              >
                GPHost
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
