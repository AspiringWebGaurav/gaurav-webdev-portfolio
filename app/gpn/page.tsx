"use client";

import React from "react";
import {
  BookOpen,
  Globe,
  ShieldCheck,
  Zap,
  Lock,
  ExternalLink,
  Wrench,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Spotlight } from "@/components/ui/Spotlight";
import { LaunchpadHaptics } from "@/components/self/LaunchpadHaptics";
import { useTheme } from "@/lib/theme";
import { getSubdomainUrl } from "@/lib/theme/navigation";

const WEB_APP_URL = "https://gpnotes.eu.cc";
const UNIFIED_HUB_URL = "https://gpnotes.eu.cc/download";

export default function GpnPortalPage() {
  const { resolvedTheme } = useTheme();

  return (
    <main
      data-portal="gpn-download"
      className="relative w-full h-[100dvh] max-h-dvh flex flex-col justify-between overflow-hidden select-none bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-zinc-100 transition-colors duration-200"
    >
      <LaunchpadHaptics />

      {/* Spotlight ambient glow in dark mode */}
      <div className="pointer-events-none select-none hidden dark:block">
        <Spotlight
          className="-top-24 left-1/3 h-[90vh] w-[70vw]"
          fill="#06b6d4"
        />
      </div>

      {/* =======================================================================
          EDGE-TO-EDGE NAVBAR
          ======================================================================= */}
      <header className="shrink-0 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 z-20">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold shadow-2xs shrink-0">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                  GPN Notes
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">
                  v0.0.0
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hidden sm:inline-flex">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Maintenance Mode
                </span>
              </div>
              <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono mt-0.5 leading-none">
                gpn.apps.gauravpatil.site
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <ThemeToggle variant="inline" className="w-8 h-8 rounded-lg shrink-0" />
            <a
              href={getSubdomainUrl("https://apps.gauravpatil.site", resolvedTheme)}
              suppressHydrationWarning
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-white/10 transition-all inline-flex items-center gap-1.5 shadow-2xs"
            >
              <span>Apps Hub</span>
              <span className="text-[10px] text-slate-400">↗</span>
            </a>
            <a
              href={getSubdomainUrl("https://gauravpatil.site", resolvedTheme)}
              suppressHydrationWarning
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-1 active:scale-95"
            >
              <span>Portfolio</span>
              <span className="text-[10px]">↗</span>
            </a>
          </div>
        </div>
      </header>

      {/* =======================================================================
          HERO BODY — 100dvh Single View
          ======================================================================= */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 flex-1 min-h-0 flex flex-col justify-center items-center text-center my-auto">
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Private, Encrypted <br />
          <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            Personal Notes Workspace
          </span>
        </h2>

        <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
          Local-first personal knowledge base with real-time peer collaboration (Yjs/WebRTC), local SQLite storage, rich TipTap formatting, and zero-knowledge encryption.
        </p>

        {/* Maintenance Banner */}
        <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-medium">
          <Wrench className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span><strong>Maintenance Mode:</strong> Native installers temporarily paused for polishing &amp; improvements.</span>
        </div>

        {/* Live Multi-Platform CTAs (Styled like Existing Download Portal) */}
        <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full max-w-2xl">
          <div
            className="px-3 sm:px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-200 font-bold text-xs sm:text-[13px] flex items-center justify-center gap-1.5 sm:gap-2 cursor-not-allowed select-none shadow-xs whitespace-nowrap"
            title="Maintenance Mode: Windows downloads paused for polishing & updates"
          >
            <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[2.2] shrink-0" />
            <span className="whitespace-nowrap">Windows • Maintenance</span>
          </div>

          <a
            href={WEB_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 sm:px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-[13px] flex items-center justify-center gap-1.5 sm:gap-2 border border-slate-200 dark:border-white/10 active:scale-95 transition-all shadow-2xs whitespace-nowrap"
          >
            <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400 stroke-[2.2] shrink-0" />
            <span className="whitespace-nowrap">Open Web App</span>
          </a>

          <div
            className="px-3 sm:px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold text-xs sm:text-[13px] flex items-center justify-center gap-1.5 sm:gap-2 cursor-not-allowed select-none shadow-xs whitespace-nowrap"
            title="Maintenance Mode: Android APK downloads paused for polishing & updates"
          >
            <Wrench className="w-4 h-4 text-amber-500 stroke-[2.2] shrink-0" />
            <span className="whitespace-nowrap">APK • Maintenance</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <a
            href={UNIFIED_HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-500 underline flex items-center gap-1 transition-colors"
          >
            <span>Unified Download Hub (gpnotes.eu.cc/download)</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* 3 Benefit Cards */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5 w-full text-left max-w-3xl">
          <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-white/10 shadow-2xs">
            <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold text-xs sm:text-sm mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero-Knowledge</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-snug">
              Encrypted end-to-end. Only your authenticated devices hold the decryption keys.
            </p>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-white/10 shadow-2xs">
            <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold text-xs sm:text-sm mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>CRDT Real-Time</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-snug">
              Conflict-free replicated data types with WebRTC peer sync across devices.
            </p>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-white/10 shadow-2xs">
            <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold text-xs sm:text-sm mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Offline First</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 leading-snug">
              Stored locally in SQLite / IndexedDB. Fully accessible with zero connection.
            </p>
          </div>
        </div>
      </div>

      {/* =======================================================================
          EDGE-TO-EDGE FOOTER
          ======================================================================= */}
      <footer className="shrink-0 w-full border-t border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-2.5 z-20">
        <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">GPN Notes</span>
            <span>·</span>
            <span>v0.0.0 Next.js &amp; Yjs</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
            <span className="hidden sm:inline text-slate-400 dark:text-slate-500">100dvh Zero-Scroll Workspace</span>
          </div>

          <nav aria-label="Ecosystem Navigation" className="flex items-center gap-4">
            <a
              href={getSubdomainUrl("https://apps.gauravpatil.site", resolvedTheme)}
              suppressHydrationWarning
              className="hover:text-cyan-500 transition-colors"
            >
              apps.gauravpatil.site
            </a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <a
              href={getSubdomainUrl("https://gauravpatil.site", resolvedTheme)}
              suppressHydrationWarning
              className="hover:text-cyan-500 transition-colors"
            >
              gauravpatil.site
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
