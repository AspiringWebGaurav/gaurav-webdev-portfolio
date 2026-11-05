"use client";

import React from "react";
import {
  Download,
  Zap,
  HardDrive,
  ArrowRight,
  Sparkles,
  Pause,
  X,
  Clock,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Spotlight } from "@/components/ui/Spotlight";

// Static telemetry constants (Ubuntu 24.04 LTS open-source ISO) - 100% Zero-JS-Overhead, Vercel Edge Optimized
const FILE_NAME = "Ubuntu-24.04-LTS-Desktop-x86_64.iso";
const SOURCE_PATH = "C:\\Users\\gaura\\Downloads\\Ubuntu-24.04-LTS-Desktop-x86_64.iso";
const DEST_PATH = "D:\\";
const FILE_SIZE = "9.64 GB";
const TRANSFERRED_PROGRESS = "4.89 GB / 9.64 GB";
const TRANSFERRED_BYTES = "4.89 GB";
const PROGRESS_PERCENT = "50.7%";
const PROGRESS_WIDTH = "50.7%";
const TRANSFER_SPEED = "351.4 MB/s";
const ETA_TIME = "13s";

interface CpMarketingLayerProps {
  onOpenDownload: () => void;
  onOpenSteps?: () => void;
  desktopDownloadUrl: string;
}

export default function CpMarketingLayer({
  onOpenDownload,
  desktopDownloadUrl,
}: CpMarketingLayerProps) {

  return (
    <div
      data-portal="cp"
      className="relative w-full h-full max-h-dvh flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Ambient Spotlight for emerald glow in dark mode */}
      <div className="pointer-events-none select-none hidden dark:block">
        <Spotlight
          className="-top-24 left-1/3 h-[90vh] w-[70vw]"
          fill="#10b981"
        />
      </div>

      {/* =======================================================================
          MOBILE VIEW (Strict 100dvh, Single View, Zero Scroll)
          ======================================================================= */}
      <div className="flex md:hidden h-full max-h-dvh w-full flex-col justify-between overflow-hidden p-3.5 relative z-10">
        {/* Mobile Header */}
        <header className="w-full h-8 flex items-center justify-between shrink-0 bg-transparent">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white font-black text-xs shadow-xs">
              CP
            </div>
            <span className="font-sans text-[20px] font-black text-zinc-950 dark:text-zinc-50 tracking-[-0.03em] leading-none">
              CP Engine
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle variant="inline" className="w-7 h-7 shrink-0" />
            <button
              onClick={onOpenDownload}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all"
            >
              <Download className="w-3 h-3" />
              <span>Get</span>
            </button>
          </div>
        </header>

        {/* Mobile Hero Header */}
        <div className="shrink-0 text-center pt-1">
          <h1 className="text-xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
            <span>Copy. Paste.</span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-300">
              Faster.
            </span>
          </h1>

          <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-1 px-2 leading-relaxed">
            Makes copying and pasting files super fast on Windows.
          </p>
        </div>

        {/* Mobile App Mockup Card (Actual Transfer UI) */}
        <div className="flex-1 min-h-0 flex flex-col justify-center my-2">
          <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 shadow-md flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  CP
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                    CP
                  </span>
                  <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase mt-0.5">
                    COPY. PASTE. FASTER.
                  </span>
                </div>
              </div>
            </div>

            {/* FROM / TO Box Compact */}
            <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-2 my-2 text-[10px] space-y-1 font-mono">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[9px] font-bold text-zinc-400 uppercase w-8 shrink-0">FROM</span>
                <span className="text-zinc-800 dark:text-zinc-200 truncate">Ubuntu-24.04-LTS-Desktop-x86_64.iso</span>
              </div>
              <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-200/50 dark:border-zinc-800/50">
                <span className="text-[9px] font-bold text-emerald-600 uppercase w-8 shrink-0">TO</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-bold">D:\</span>
              </div>
            </div>

            {/* Static Native App Preview (Exact Match to Native CP UI) */}
            <div className="space-y-1 mb-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Streaming Direct</span>
                </span>
                <span className="font-mono text-zinc-500 font-semibold">{TRANSFERRED_PROGRESS}</span>
              </div>

              <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg h-4 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full rounded bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400"
                  style={{ width: PROGRESS_WIDTH }}
                />
                <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-[9px] text-zinc-900 dark:text-zinc-100 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                  {PROGRESS_PERCENT}
                </span>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono text-zinc-600 dark:text-zinc-400 pt-0.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> {TRANSFER_SPEED}
                </span>
                <span>ETA: {ETA_TIME}</span>
              </div>
            </div>

            {/* CTA Inside Card */}
            <button
              onClick={onOpenDownload}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Mobile Dynamic Badges */}
        <div className="shrink-0 grid grid-cols-3 gap-1.5 text-center text-[10px] my-1">
          <div className="bg-zinc-100 dark:bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="font-bold text-emerald-600 flex items-center justify-center gap-1">
              <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
              <span>Super Fast</span>
            </div>
            <div className="text-[9px] text-zinc-500">Top Speed Copy</div>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="font-bold text-emerald-600 flex items-center justify-center gap-1">
              <HardDrive className="w-2.5 h-2.5 text-emerald-500" />
              <span>Runs Quiet</span>
            </div>
            <div className="text-[9px] text-zinc-500">No PC Lag</div>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="font-bold text-emerald-600 flex items-center justify-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
              <span>Auto Update</span>
            </div>
            <div className="text-[9px] text-zinc-500">Zero Popups</div>
          </div>
        </div>

        {/* Mobile Enterprise Footer */}
        <footer className="w-full h-auto py-1 flex flex-wrap items-center justify-between text-[9px] text-zinc-400 dark:text-zinc-500 shrink-0 bg-transparent gap-y-1">
          <div>&copy; {new Date().getFullYear()} Gaurav Patil &bull; CP Engine</div>
          <div className="flex items-center gap-2">
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Terms
            </a>
            <span>&bull;</span>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Privacy
            </a>
            <span>&bull;</span>
            <a
              href="/how-to-use"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Docs
            </a>
            <span>&bull;</span>
            <a
              href="https://gauravpatil.site"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Portfolio
            </a>
          </div>
        </footer>
      </div>

      {/* =======================================================================
          DESKTOP VIEW (Strict 100dvh, Single View, Zero Scroll)
          ======================================================================= */}
      <div className="hidden md:flex h-full max-h-dvh w-full flex-col justify-between overflow-hidden relative z-10">
        {/* Desktop Navbar */}
        <header className="w-full px-6 lg:px-8 h-12 lg:h-14 flex items-center justify-between shrink-0 bg-transparent transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              CP
            </div>
            <div className="flex flex-col text-left">
              <span className="font-sans text-[22px] font-black text-zinc-950 dark:text-zinc-50 tracking-[-0.03em] leading-none select-none">
                CP Engine
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase leading-none mt-1">
                Copy. Paste. Faster.
              </span>
            </div>
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
              href="https://github.com/AspiringWebGaurav/cp"
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
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </nav>
        </header>

        {/* Desktop Main Content Area (Strictly Fits Viewport, Zero Scroll) */}
        <main className="w-full flex-1 min-h-0 flex flex-col justify-evenly py-1 lg:py-2 px-4 lg:px-8 max-w-5xl xl:max-w-6xl mx-auto">
          {/* Hero Pitch Headline */}
          <div className="text-center shrink-0 w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
            <h1 className="text-2xl md:text-[32px] lg:text-[40px] xl:text-[46px] font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
              <span>Copy. Paste.</span>{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-300">
                Faster.
              </span>
            </h1>

            <p className="text-xs lg:text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 font-normal max-w-2xl mx-auto leading-relaxed">
              Makes Windows copy and paste super fast. Move large files, games, and videos in seconds—just copy and paste like you normally do.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex items-center justify-center gap-3 mt-3">
              <button
                onClick={onOpenDownload}
                className="group inline-flex items-center justify-center gap-2.5 h-10 lg:h-11 px-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs lg:text-sm font-bold shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400 dark:text-emerald-600 group-hover:translate-y-0.5 transition-transform" />
                <span>Download for Windows</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={onOpenDownload}
                className="inline-flex items-center justify-center gap-2 h-10 lg:h-11 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800/80 active:scale-95 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>SHA-256 Verified</span>
              </button>
            </div>
          </div>

          {/* Desktop App UI Mockup (Pixel-Matched to Native CP Transfer Window) */}
          <div className="w-full max-w-3xl xl:max-w-4xl mx-auto shrink-0 my-1">
            <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-950 shadow-2xl shadow-zinc-900/10 dark:shadow-black/60 overflow-hidden text-left transition-all">
              {/* Native Window Titlebar */}
              <div className="h-9 px-3.5 bg-zinc-50/90 dark:bg-zinc-900/90 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shadow-2xs">
                    CP
                  </div>
                  <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                    CP
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 select-none">
                    <X className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Native Window Body (Pixel-Matched to TransferView) */}
              <div className="p-3.5 sm:p-4 space-y-2.5">
                {/* Header Row */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-900">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                      CP
                    </div>
                    <div>
                      <div className="font-black text-lg text-zinc-900 dark:text-zinc-100 leading-none">
                        CP
                      </div>
                      <div className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 tracking-[0.18em] uppercase mt-1">
                        Copy. Paste. Faster.
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1. FROM & TO Path Card (Full paths, clean copyright-free filename) */}
                <div className="bg-zinc-50/90 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-2 sm:p-2.5 text-[11px] space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 shrink-0 w-11">
                      FROM
                    </span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-mono text-[11px] font-medium truncate select-text">
                      C:\Users\gaura\Downloads\Ubuntu-24.04-LTS-Desktop-x86_64.iso
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 shrink-0 w-11 flex items-center gap-1">
                      TO <ArrowRight className="w-2.5 h-2.5 text-emerald-500" />
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono text-[11px] font-bold select-text">
                      D:\
                    </span>
                  </div>
                </div>

                {/* 2. Active File Info & State Badge */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Streaming Direct</span>
                    </span>

                    <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 font-semibold">
                      {TRANSFERRED_PROGRESS}
                    </span>
                  </div>

                  <p className="text-[11.5px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug truncate select-text">
                    {FILE_NAME}
                  </p>
                </div>

                {/* 3. Ultra-Polished High-Precision Animated Progress Bar (Static Zero-JS Overhead) */}
                <div className="space-y-1.5">
                  <div className="w-full bg-zinc-100/90 dark:bg-zinc-900 rounded-lg h-5 border border-zinc-200/90 dark:border-zinc-800 shadow-inner relative overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-md transition-all duration-150 ease-out relative overflow-hidden shadow-xs bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400"
                      style={{ width: PROGRESS_WIDTH }}
                    >
                      <div className="absolute inset-0 bg-white/20 dark:bg-white/10 animate-pulse pointer-events-none" />
                    </div>
                    <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-[10.5px] text-zinc-900 dark:text-zinc-100 pointer-events-none select-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                      {PROGRESS_PERCENT}
                    </span>
                  </div>

                  {/* 4. Telemetry Metrics Row */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-700 dark:text-zinc-300 px-0.5">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-amber-500" />
                      <strong>Speed:</strong>{" "}
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {TRANSFER_SPEED}
                      </span>
                    </span>

                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>{TRANSFERRED_BYTES}</span>
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <strong>ETA:</strong>{" "}
                      <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                        {ETA_TIME}
                      </span>
                    </span>
                  </div>
                </div>

                {/* 5. Bottom Native UI Mockup Controls (Static UI, Matching Native App) */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-900">
                  <div
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-amber-700 dark:text-amber-400 border border-zinc-200/80 dark:border-zinc-800 text-xs font-bold transition-all shadow-2xs select-none cursor-default"
                    title="Pause transfer"
                  >
                    <Pause className="w-3 h-3 text-amber-600 fill-amber-500" />
                    <span>Pause</span>
                  </div>

                  <div
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-rose-700 dark:text-rose-400 border border-zinc-200/80 dark:border-zinc-800 text-xs font-bold transition-all shadow-2xs select-none cursor-default"
                    title="Cancel transfer"
                  >
                    <X className="w-3 h-3 text-rose-500" />
                    <span>Cancel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Architectural Capabilities */}
          <div className="w-full max-w-4xl mx-auto shrink-0 grid grid-cols-3 gap-3 my-1 text-left">
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Super Fast Copy
                </div>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                Copies big games, movies, and files at top speed with no waiting.
              </div>
            </div>

            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <HardDrive className="w-3 h-3 text-emerald-500" />
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Runs Quietly
                </div>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                Sits quietly near your clock without slowing down your PC or games.
              </div>
            </div>

            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Automatic Updates
                </div>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                Updates itself quietly in the background without any annoying popups.
              </div>
            </div>
          </div>
        </main>

        {/* Desktop Enterprise Footer */}
        <footer className="w-full h-11 lg:h-12 shrink-0 bg-transparent transition-colors">
          <div className="w-full px-6 lg:px-8 h-full flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span>&copy; {new Date().getFullYear()} CP Engine</span>
              <span>&bull;</span>
              <a
                href="https://gauravpatil.site"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline underline-offset-4 transition-colors"
              >
                Gaurav Patil
              </a>
              <span>&bull;</span>
              <a
                href="https://github.com/Gaurav-Patil-07/cp/blob/master/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline transition-colors"
              >
                MIT License
              </a>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-[11px] font-medium">
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline underline-offset-4 transition-colors"
              >
                Terms of Service
              </a>
              <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline underline-offset-4 transition-colors"
              >
                Privacy Policy
              </a>
              <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
              <a
                href="/how-to-use"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline underline-offset-4 transition-colors"
              >
                How to Use
              </a>
              <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
              <a
                href="https://gauravpatil.site"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline"
              >
                Author Portfolio
              </a>
              <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
              <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">
                Powered by{" "}
                <a
                  href="https://gphost.eu.cc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline underline-offset-4 transition-colors"
                >
                  GPHost Global CDN
                </a>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
