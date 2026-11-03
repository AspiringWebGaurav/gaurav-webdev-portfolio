"use client";

import React from "react";
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
  Menu,
  Copy,
  ChevronDown,
  ChevronLeft,
  Folder,
  X,
  ArrowRight,
  Puzzle,
  Zap,
  RefreshCw,
  ShieldCheck,
  Pause,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Spotlight } from "@/components/ui/Spotlight";

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
}: MarketingLayerProps) {
  return (
    <div className="relative w-full h-full max-h-dvh flex flex-col justify-between overflow-hidden select-none">
      {/* Aceternity Spotlight for subtle ambient glow in dark mode */}
      <div className="pointer-events-none select-none hidden dark:block">
        <Spotlight
          className="-top-24 left-1/3 h-[90vh] w-[70vw]"
          fill="#8b5cf6"
        />
      </div>

      {/* =======================================================================
          MOBILE MARKETING VIEW (Strict 100dvh, Single View, Zero Scroll)
          ======================================================================= */}
      <div className="flex md:hidden h-full max-h-dvh w-full flex-col justify-between overflow-hidden p-3.5 relative z-10">
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
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all"
            >
              <Download className="w-3 h-3" />
              <span>Get</span>
            </button>
          </div>
        </header>

        {/* Mobile Hero Header */}
        <div className="shrink-0 text-center pt-1">
          <h1 className="text-xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
            <span>One simple downloader.</span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 dark:from-violet-400 dark:via-purple-300 dark:to-indigo-300">
              Auto grab links.
            </span>
          </h1>

          <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-1 px-2 leading-relaxed">
            Just install extension and ready to replace all downloader in market.
          </p>
        </div>

        {/* Mobile PC App Mockup Preview (Exact Downex Mobile Card) */}
        <div className="flex-1 min-h-0 flex flex-col justify-center my-2">
          <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 shadow-md flex flex-col justify-between">
            {/* Title Bar */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-violet-600 dark:text-violet-400 stroke-[2.2]" />
                <span className="font-brand text-[18px] text-zinc-900 dark:text-zinc-100 leading-none">
                  downex
                </span>
              </div>

              <div className="flex items-center text-zinc-400">
                <X className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Active Download Task Card (Exact Downex Structure - DOWNLOADING) */}
            <div className="rounded-xl border border-emerald-500/30 dark:border-emerald-500/25 bg-white dark:bg-zinc-900/60 p-2.5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/70 flex items-center justify-center shrink-0">
                    <File className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-200 stroke-[1.8]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      ubuntu-24.04-desktop-amd64.iso
                    </div>
                    <div className="text-[9px] font-mono text-zinc-400 truncate">
                      C:\Users\gaura\Downloads\Downex\...
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold animate-pulse border border-blue-500/20">
                    DOWNLOADING
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[9px] font-semibold">
                    <Pause className="w-2.5 h-2.5 fill-current" />
                  </span>
                </div>
              </div>

              {/* Minimal Structured Metrics Grid */}
              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800/80 p-2 text-[9px] font-mono grid grid-cols-2 gap-1">
                <div>
                  <span className="text-zinc-400">File size: </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{FILE_SIZE}</span>
                </div>
                <div>
                  <span className="text-zinc-400">Downloaded: </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{DOWNLOADED_PROGRESS}</span>
                </div>
                <div>
                  <span className="text-zinc-400">Transfer: </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{TRANSFER_RATE_COMPACT}</span>
                </div>
                <div>
                  <span className="text-zinc-400">Time left: </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{TIME_LEFT_COMPACT}</span>
                </div>
              </div>

              {/* Real Downex Emerald Animated Progress Bar */}
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

            {/* Quick Benefits */}
            <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px] text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-violet-600 dark:text-violet-400 shrink-0" />
                <span>Multi-Stream 16x</span>
              </div>
              <div className="flex items-center gap-1">
                <Puzzle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Auto Link Catch</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Main CTA Button */}
        <div className="shrink-0 mb-1">
          <button
            onClick={onOpenDownload}
            className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-violet-400 dark:text-violet-600" />
            <span>Download Downex</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Footer */}
        <footer className="w-full h-auto py-1 flex items-center justify-between text-[9px] text-zinc-400 dark:text-zinc-500 shrink-0 bg-transparent">
          <div>&copy; {new Date().getFullYear()} Downex</div>
          <div className="flex items-center gap-2">
            <a href="https://gauravpatil.site/terms" className="hover:text-zinc-700 dark:hover:text-zinc-300">
              Terms
            </a>
            <span>&bull;</span>
            <a href="https://gauravpatil.site/privacy" className="hover:text-zinc-700 dark:hover:text-zinc-300">
              Privacy
            </a>
            <span>&bull;</span>
            <a href="https://gphost.eu.cc" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-700 dark:hover:text-zinc-300">
              GPHost
            </a>
          </div>
        </footer>
      </div>

      {/* =======================================================================
          DESKTOP MARKETING VIEW (Strict 100dvh, Single View, Zero Scroll)
          ======================================================================= */}
      <div className="hidden md:flex h-full max-h-dvh w-full flex-col justify-between overflow-hidden relative z-10">
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
              href="https://gauravpatil.site"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Portfolio
            </a>

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
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs active:scale-95 transition-all"
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
            <h1 className="text-2xl md:text-[28px] lg:text-[36px] xl:text-[42px] font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight md:whitespace-nowrap">
              <span>One simple downloader.</span>{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-300 dark:to-indigo-300">
                Auto grab links.
              </span>
            </h1>

            <p className="text-xs lg:text-sm text-zinc-600 dark:text-zinc-400 mt-1 font-normal max-w-2xl mx-auto leading-relaxed">
              Just install extension and ready to replace all downloader in market.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex items-center justify-center gap-3 mt-2.5">
              <button
                onClick={onOpenDownload}
                className="group inline-flex items-center justify-center gap-2.5 h-10 lg:h-11 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs lg:text-sm font-bold shadow-lg shadow-violet-500/15 hover:shadow-violet-500/25 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4 text-violet-400 dark:text-violet-600 group-hover:translate-y-0.5 transition-transform" />
                <span>Download Downex</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={onOpenDownload}
                className="inline-flex items-center justify-center gap-2 h-10 lg:h-11 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800/80 active:scale-95 transition-all"
              >
                <Puzzle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Browser Extension</span>
              </button>
            </div>
          </div>

          {/* PC App UI Mockup (100% Pixel-Matched to Actual Downex App from Image 2) */}
          <div className="w-full max-w-4xl mx-auto shrink-0 my-1">
            <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-950 shadow-2xl shadow-zinc-900/10 dark:shadow-black/60 overflow-hidden text-left transition-all">
              {/* Window Header (Actual Downex Titlebar: Purple Download Icon + Cursive downex + X Close) */}
              <div className="h-11 px-4 bg-white dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <div className="text-violet-600 dark:text-violet-400">
                    <Download className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="font-brand text-[23px] text-zinc-900 dark:text-zinc-100 tracking-wide leading-none select-none">
                    downex
                  </span>
                </div>

                <div className="flex items-center">
                  <button className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 rounded-md transition-colors cursor-pointer">
                    <X className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>
              </div>

              {/* App Body: Real Sidebar + Main Area */}
              <div className="flex">
                {/* Real Downex Left Sidebar (Matching Image 2) */}
                <div className="relative hidden sm:flex flex-col justify-between w-44 lg:w-48 bg-white dark:bg-zinc-950 p-2.5 shrink-0 select-none text-xs border-r border-zinc-200/70 dark:border-zinc-800/60">
                  {/* Subtle Collapse Pill Arrow between sidebar and content */}
                  <div className="absolute -right-3 top-3.5 z-10 w-5 h-5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xs flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
                    <ChevronLeft className="w-3 h-3 stroke-[2.5]" />
                  </div>

                  <div className="space-y-1">
                    {/* All Downloads (Active: Solid Black Capsule) */}
                    <div className="px-3 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Download className="w-4 h-4 stroke-[2.2]" />
                        <span className="text-xs">All Downloads</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800 font-bold">
                        1
                      </span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl text-zinc-600 dark:text-zinc-400 flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
                      <ListOrdered className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                      <span className="text-xs">Queues</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl text-zinc-600 dark:text-zinc-400 flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
                      <Activity className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                      <span className="text-xs">Speed &amp; Stats</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl text-zinc-600 dark:text-zinc-400 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <Plus className="w-4 h-4 text-zinc-500 dark:text-zinc-400 stroke-[2.2]" />
                        <span className="text-xs">Add URL</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                        Ctrl+N
                      </span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl text-zinc-600 dark:text-zinc-400 flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
                      <Settings className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                      <span className="text-xs">Settings</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl text-zinc-600 dark:text-zinc-400 flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
                      <Gauge className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                      <span className="text-xs">Speed Test</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl text-zinc-600 dark:text-zinc-400 flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                      <span className="text-xs">Trash</span>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0 p-3 lg:p-4 flex flex-col justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-950/40">
                  {/* Top Action Bar (Search with Ctrl+K + Solid Black New Download Button) */}
                  <div className="flex items-center justify-between gap-3 pb-1 border-b border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex-1 max-w-sm flex items-center justify-between px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 text-xs text-zinc-400 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">Search in app... (Ctrl+K)</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 shrink-0">
                        Ctrl+K
                      </span>
                    </div>

                    <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold shadow-xs transition-all">
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>New Download</span>
                    </button>
                  </div>

                  {/* Active Download Card (1:1 Exact Match to Downex - DOWNLOADING State) */}
                  <div className="rounded-2xl border border-emerald-500/25 dark:border-emerald-500/20 bg-white dark:bg-zinc-900/70 p-3.5 space-y-2.5 shadow-xs">
                    {/* Row 1: File icon, Title, Path, Status Badge, Pause & Delete Buttons */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-center shrink-0 shadow-2xs">
                          <File className="w-4.5 h-4.5 text-zinc-700 dark:text-zinc-200 stroke-[1.8]" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                            ubuntu-24.04-desktop-amd64.iso
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/60 text-[11px] font-mono text-zinc-600 dark:text-zinc-300 truncate max-w-sm">
                              <Menu className="w-3 h-3 text-zinc-400 shrink-0 stroke-[2.2]" />
                              <span className="truncate">C:\Users\gaura\Downloads\Downex\ubuntu-24.04-desktop-amd64.iso</span>
                            </div>
                            <Copy className="w-3 h-3 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer shrink-0 stroke-[2]" />
                          </div>
                        </div>
                      </div>

                      {/* Top Right: Status Badge & Pause + Delete Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wider animate-pulse">
                          DOWNLOADING
                        </span>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                          title="Pause active download"
                        >
                          <Pause className="w-3 h-3 fill-current" />
                          <span>Pause</span>
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                          title="Stop and delete active download"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Row 2: The Minimal Structured Metrics Grid (2 Columns, matching Downex Downloading state) */}
                    <div className="rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800/80 p-2.5 text-xs font-mono grid grid-cols-2 gap-x-6 gap-y-1.5 select-text shadow-2xs">
                      <div>
                        <span className="text-zinc-400">File size: </span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{FILE_SIZE}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Downloaded: </span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {DOWNLOADED_PROGRESS}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Transfer rate: </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {TRANSFER_RATE_FULL}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Time left: </span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {TIME_LEFT_FULL}
                        </span>
                      </div>
                    </div>

                    {/* Row 3: Signature Downex Progress Bar with Multi-layer Animations */}
                    <div className="w-full h-[15px] bg-zinc-200/90 dark:bg-zinc-800/90 rounded-sm p-[1px] shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.22)] border border-zinc-300/80 dark:border-zinc-700/80 relative overflow-hidden flex items-center">
                      <div
                        className="h-full rounded-xs transition-all duration-300 relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                        style={{ width: PROGRESS_WIDTH }}
                      >
                        {/* 1. Flowing animated barber-pole diagonal stripes */}
                        <div className="absolute inset-0 animate-stripes opacity-45 mix-blend-overlay pointer-events-none" />

                        {/* 2. Sweeping specular light shimmer beam */}
                        <div className="animate-shimmer pointer-events-none" />

                        {/* 3. Top gloss glass highlight */}
                        <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />

                        {/* 4. Bottom 3D bevel shadow */}
                        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                        {/* 5. Pulsing energetic leading-edge head at download boundary */}
                        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_#ffffff,0_0_14px_#34d399] animate-pulse pointer-events-none" />
                      </div>
                    </div>

                    {/* Row 4: Footer Actions inside Card (Matching Downex Downloading state) */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <button className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                        <ChevronDown className="w-3.5 h-3.5 stroke-[2.2]" />
                        <span>Show details (Connections &amp; Segments)</span>
                      </button>

                      <div className="flex items-center gap-3">
                        <button className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                          <Folder className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 stroke-[2]" />
                          <span>Destination folder</span>
                        </button>

                        <span className="text-zinc-300 dark:text-zinc-700">•</span>

                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Resume: Yes</span>
                        </span>
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
                <span className="truncate"><strong>16x Streams:</strong> Turbo Speed</span>
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

        {/* Desktop Single-Line Footer */}
        <footer className="w-full h-11 lg:h-12 shrink-0 bg-transparent transition-colors">
          <div className="w-full px-6 lg:px-8 h-full flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <div>
              &copy; {new Date().getFullYear()} Downex &bull;{" "}
              <a
                href="https://gauravpatil.site"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:underline underline-offset-4 decoration-violet-500/50 dark:decoration-violet-400/50 transition-colors"
              >
                Gaurav Patil
              </a>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <a
                href="https://gauravpatil.site/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline"
              >
                Terms
              </a>
              <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
              <a
                href="https://gauravpatil.site/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline"
              >
                Privacy
              </a>
              <span className="h-3.5 w-[1.5px] bg-zinc-300 dark:bg-zinc-700 rounded-full shrink-0" aria-hidden="true" />
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
    </div>
  );
}
