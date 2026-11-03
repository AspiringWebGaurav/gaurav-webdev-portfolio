"use client";

import React, { useState, useEffect } from "react";
import {
  Monitor,
  Puzzle,
  ExternalLink,
  Download,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Globe,
  Copy,
  Check,
  Zap,
  RefreshCw,
  FolderOpen,
  Shield,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import MarketingLayer from "./MarketingLayer";

export type DetectedPlatform = "windows" | "android" | "ios" | "mac" | "linux" | "other";

function detectPlatform(): DetectedPlatform {
  if (typeof window === "undefined") return "other";
  const ua = window.navigator.userAgent.toLowerCase();
  if (/win(dows|32|64|95|98|nt)/i.test(ua)) return "windows";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/mac(intosh|os)/i.test(ua)) return "mac";
  if (/linux/i.test(ua)) return "linux";
  return "other";
}

interface DownloadClientProps {
  desktopDownloadUrl: string;
  desktopShareUrl: string;
  extensionDownloadUrl?: string;
  extensionShareUrl?: string;
}

type MobileTab = "windows" | "extension";
type DownexView = "marketing" | "download";

const SHA256_CHECKSUM = "f483ff0b6fa86d238e6958676383c62b35ea58c6acffa8fdd525a76e9ab252cb";

export default function DownloadClient({
  desktopDownloadUrl,
  desktopShareUrl,
  extensionDownloadUrl = "https://gphost.eu.cc/raw/downex-extension",
  extensionShareUrl = "https://gphost.eu.cc/f/downex-extension",
}: DownloadClientProps) {
  const [view, setView] = useState<DownexView>("marketing");
  const [detectedOS, setDetectedOS] = useState<DetectedPlatform>("windows");
  const [copiedHash, setCopiedHash] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("windows");
  const [clientBuster, setClientBuster] = useState<string>("");

  const openDownloadView = () => {
    setView("download");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "#download");
    }
  };

  const openMarketingView = () => {
    setView("marketing");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", window.location.pathname);
    }
  };

  useEffect(() => {
    setDetectedOS(detectPlatform());
    setClientBuster(`?t=${Date.now()}`);

    if (typeof window !== "undefined") {
      const syncViewFromUrl = () => {
        const hash = window.location.hash;
        const search = window.location.search;
        if (
          hash === "#download" ||
          search.includes("view=download") ||
          search.includes("tab=download")
        ) {
          setView("download");
        } else if (hash === "#terms") {
          setView("download");
          setTimeout(() => {
            const termsElem = document.getElementById("terms");
            if (termsElem) {
              termsElem.scrollIntoView({ behavior: "smooth", block: "center" });
              termsElem.focus?.();
              termsElem.classList.add("ring-2", "ring-violet-500", "ring-offset-2", "transition-all");
              setTimeout(() => {
                termsElem.classList.remove("ring-2", "ring-violet-500", "ring-offset-2");
              }, 3000);
            }
          }, 300);
        } else {
          setView("marketing");
        }
      };

      syncViewFromUrl();
      window.addEventListener("hashchange", syncViewFromUrl);
      window.addEventListener("popstate", syncViewFromUrl);
      return () => {
        window.removeEventListener("hashchange", syncViewFromUrl);
        window.removeEventListener("popstate", syncViewFromUrl);
      };
    }
  }, []);

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(SHA256_CHECKSUM);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  return (
    <div
      data-portal="download"
      className="relative w-full h-dvh max-h-dvh overflow-hidden bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 select-none font-sans antialiased transition-colors duration-300"
    >
      {/* =========================================================================
          UNIFIED CENTRALIZED DOT MATRIX CANVAS (Single Continuous Entity)
          ========================================================================= */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true">
        {/* Base Neutral Canvas */}
        <div className="absolute inset-0 bg-[#fafafa] dark:bg-[#09090b] transition-colors duration-300" />

        {/* Clean Neutral Dot Grid Matrix (24px x 24px) - Continuous Top-to-Bottom */}
        <div className="absolute inset-x-0 top-0 bottom-14 bg-[radial-gradient(#94a3b8_1.25px,transparent_1.25px)] dark:bg-[radial-gradient(#3f3f46_1.25px,transparent_1.25px)] [background-size:24px_24px] opacity-60 dark:opacity-40 [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]" />
      </div>

      <AnimatePresence mode="wait">
        {view === "marketing" ? (
          <motion.div
            key="marketing"
            initial={{ opacity: 0, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.995 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full h-full overflow-hidden"
          >
            <MarketingLayer
              onOpenDownload={openDownloadView}
              desktopDownloadUrl={desktopDownloadUrl}
              extensionDownloadUrl={extensionDownloadUrl}
              detectedOS={detectedOS}
            />
          </motion.div>
        ) : (
          <motion.div
            key="download"
            initial={{ opacity: 0, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.995 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full h-full overflow-hidden flex flex-col justify-between"
          >
            {/* =========================================================================
                1. DEDICATED MOBILE LAYOUT (Strict 100dvh, Single View, Zero Scroll)
                ========================================================================= */}
            <div className="flex md:hidden h-full max-h-dvh w-full flex-col justify-between overflow-hidden p-3.5 relative z-10">
              {/* Mobile Header (Seamless Transparent, No Border Line) */}
              <header className="w-full h-8 flex items-center justify-between shrink-0 pb-1.5 bg-transparent">
                <button
                  type="button"
                  onClick={openMarketingView}
                  className="flex items-center gap-2 group cursor-pointer text-left select-none"
                  title="Return to Downex Overview"
                >
                  <Download className="w-5 h-5 text-violet-600 dark:text-violet-400 stroke-[2.2]" />
                  <span className="font-brand text-[21px] text-zinc-950 dark:text-zinc-50 tracking-wide leading-none select-none">
                    downex
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openMarketingView}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Overview</span>
                  </button>
                  <ThemeToggle variant="inline" className="w-7 h-7 shrink-0" />
                </div>
              </header>

        {/* Mobile Hero Header */}
        <div className="shrink-0 text-center pt-0.5">
          <h1 className="text-xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
            <span>Download </span>
            <span className="text-violet-600 dark:text-violet-400">
              Downex
            </span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-0.5">
            Fast downloads with pause, resume &amp; browser catch.
          </p>

          {/* Mobile OS Switcher Pills */}
          <div className="mt-2 inline-flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-medium shadow-xs">
            <button
              onClick={() => setMobileTab("windows")}
              className={`px-3 py-1 rounded-lg transition-all ${
                mobileTab === "windows"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Windows App
            </button>
            <button
              onClick={() => setMobileTab("extension")}
              className={`px-3 py-1 rounded-lg transition-all ${
                mobileTab === "extension"
                  ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Extension
            </button>
          </div>
        </div>

        {/* Mobile Tab Content Card */}
        <div className="flex-1 min-h-0 flex flex-col justify-between my-2">
          {mobileTab === "windows" ? (
            <div className="flex-1 min-h-0 flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shadow-md shadow-zinc-900/10 shrink-0">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                          Downex for Windows
                        </h2>
                        {detectedOS === "windows" && (
                          <span className="px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-violet-600 text-white">
                            Your Device
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Windows 10 &amp; 11 • 64-bit
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    Official Release
                  </span>
                </div>

                {/* Features List */}
                <div className="space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 my-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-zinc-700 dark:text-zinc-300 shrink-0" />
                    <span>Multi-threaded acceleration for maximum speed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-zinc-700 dark:text-zinc-300 shrink-0" />
                    <span>Pause and resume anytime without data loss</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-zinc-700 dark:text-zinc-300 shrink-0" />
                    <span>Instant clipboard and browser catch</span>
                  </div>
                </div>
              </div>

              {/* Actions & Specs */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <a
                    href={`${desktopDownloadUrl}${clientBuster}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold shadow-xs active:scale-[0.98] transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Windows (.exe)</span>
                  </a>
                  <a
                    href={`${desktopShareUrl}${clientBuster}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 h-10 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold active:scale-[0.98] transition-all shrink-0"
                    title="Mirror"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Mirror</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileTab("extension")}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/60 text-[10px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Puzzle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Need the Browser Extension?</span>
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    Switch <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                      <Puzzle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Browser Extension
                      </h2>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Chrome, Edge &amp; Chromium
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
                    Install Once • Zero Bloat
                  </span>
                </div>

                {/* Features List */}
                <div className="space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 my-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>Just install once into your browser</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>Automatically catches browser downloads</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>Zero popups, zero background CPU drain</span>
                  </div>
                </div>
              </div>

              {/* Actions & Switcher */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <a
                    href={`${extensionDownloadUrl}${clientBuster}`}
                    download="downex-browser-extension.zip"
                    className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Extension (.zip)</span>
                  </a>
                  <a
                    href="https://github.com/AspiringWebGaurav/downex/tree/main/downex-browser-extension#readme"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 h-10 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold active:scale-[0.98] transition-all shrink-0"
                    title="Extension Docs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Docs</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileTab("windows")}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/60 text-[10px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                    <span>Looking for the Windows app?</span>
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-0.5">
                    Switch <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Setup Option Strip */}
        <a
          href="https://github.com/AspiringWebGaurav/downex/tree/main/downex-browser-extension#readme"
          target="_blank"
          rel="noopener noreferrer"
          className="h-8 px-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors shrink-0 mb-1"
        >
          <span className="flex items-center gap-1.5 truncate">
            <Globe className="w-3 h-3 text-zinc-500 shrink-0" />
            <span>Quick setup: chrome://extensions &rarr; Developer mode &rarr; Load unpacked</span>
          </span>
          <ArrowRight className="w-2.5 h-2.5 text-zinc-400 shrink-0 ml-1" />
        </a>

        {/* Mobile Footer (Seamless Transparent, No Border Line) */}
        <footer id="mobile-footer" className="w-full h-auto py-1 flex items-center justify-between text-[9px] text-zinc-400 dark:text-zinc-500 shrink-0 bg-transparent">
          <div>&copy; {new Date().getFullYear()} Downex</div>
          <div className="flex items-center gap-2">
            <a href="https://gauravpatil.site/terms" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
              Terms
            </a>
            <span>•</span>
            <a href="https://gauravpatil.site/privacy" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
              Privacy
            </a>
            <span>•</span>
            <a
              href="https://gphost.eu.cc"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              GPHost
            </a>
          </div>
        </footer>
      </div>

      {/* =========================================================================
          2. DESKTOP & TABLET VIEWPORT (Strict 100dvh, Pixel-Matched, Zero Overlap)
          ========================================================================= */}
      <div className="hidden md:flex h-full max-h-dvh w-full flex-col justify-between overflow-hidden relative z-10">
        {/* Desktop Navbar (Seamless Transparent, No Border Line, Dot Matrix Shows Through) */}
        <header className="w-full px-6 lg:px-8 h-12 lg:h-14 flex items-center justify-between shrink-0 bg-transparent transition-colors">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openMarketingView}
              className="flex items-center gap-2.5 group cursor-pointer text-left select-none"
              title="Return to Downex Overview"
            >
              <Download className="w-6 h-6 text-violet-600 dark:text-violet-400 stroke-[2.2] group-hover:scale-105 transition-transform" />
              <span className="font-brand text-[25px] text-zinc-950 dark:text-zinc-50 tracking-wide leading-none select-none group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                downex
              </span>
            </button>

            <span className="h-3.5 w-[1.5px] bg-zinc-300 dark:bg-zinc-700 rounded-full shrink-0" aria-hidden="true" />

            <button
              type="button"
              onClick={openMarketingView}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
          </div>

          {/* Cleanly Aligned Desktop Navigation with Vertical Dividers & Inline Theme Toggle */}
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

            {/* Seamless Inline Theme Button (Zero Layout Shift or Floating Collision) */}
            <div className="flex items-center">
              <ThemeToggle variant="inline" className="w-8 h-8 shrink-0" />
            </div>
          </nav>
        </header>

        {/* Desktop Main Content (Guaranteed NO vertical scroll) */}
        <main className="w-full flex-1 min-h-0 flex flex-col justify-evenly py-2 lg:py-3 px-6 lg:px-8 max-w-6xl mx-auto">
          {/* Headline Section */}
          <div className="text-left shrink-0">
            <h1 className="text-3xl lg:text-4xl 2xl:text-5xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
              <span>Download </span>
              <span className="text-violet-600 dark:text-violet-400">
                Downex
              </span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs lg:text-sm mt-1 font-normal max-w-none">
              Fast downloads with pause, resume, speed limits, and automatic browser catch — built to replace most downloaders.
            </p>
          </div>

          {/* Dual Platform Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 shrink-0">
            {/* Card 1: Windows Desktop */}
            <div
              className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 lg:p-6 flex flex-col justify-between transition-all shadow-xs hover:shadow-md"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shadow-md shadow-zinc-900/10 shrink-0">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                          Downex for Windows
                        </h2>
                        {detectedOS === "windows" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600 text-white shadow-xs">
                            Your Device
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Windows 10 &amp; 11 (64-bit) • Native Desktop App
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Official Release</span>
                  </span>
                </div>

                {/* Feature Bullets (Clean App-Style Neutral Capsules) */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300">
                    <Zap className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 shrink-0" />
                    <span><strong>Fast Download Speeds:</strong> Downloads files in multiple pieces at once for top internet speed.</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300">
                    <RefreshCw className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 shrink-0" />
                    <span><strong>Pause and Resume:</strong> Pause anytime and pick up right where you left off without restarting.</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300">
                    <Layers className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 shrink-0" />
                    <span><strong>Instant Link Catch:</strong> Copies download links automatically or paste any URL with one click.</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300">
                    <FolderOpen className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 shrink-0" />
                    <span><strong>Clean File Sorting:</strong> Organizes your downloads neatly into Videos, Music, and Documents.</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300">
                    <Shield className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 shrink-0" />
                    <span><strong>100% Private &amp; Safe:</strong> No ads, no accounts, and zero tracking. Stays strictly on your PC.</span>
                  </div>
                </div>
              </div>

              {/* Actions & Specs */}
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <a
                    href={`${desktopDownloadUrl}${clientBuster}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-10 lg:h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs lg:text-sm font-semibold shadow-xs active:scale-[0.99] transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download for Windows</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 dark:bg-zinc-200 text-zinc-300 dark:text-zinc-700">.exe</span>
                  </a>

                  <a
                    href={`${desktopShareUrl}${clientBuster}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 h-10 lg:h-11 rounded-xl bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all border border-zinc-200 dark:border-zinc-700 shrink-0"
                    title="Download Mirror"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Mirror</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                </div>

                <div className="pt-2.5 border-t border-zinc-200/70 dark:border-zinc-800/70 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-x-2.5">
                    <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Platform:</span> Windows 10 &amp; 11</div>
                    <div className="text-zinc-300 dark:text-zinc-700">•</div>
                    <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Arch:</span> 64-bit</div>
                  </div>
                  <button
                    type="button"
                    onClick={copyHash}
                    className="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-400 hover:underline font-mono font-medium cursor-pointer"
                    title="Click to copy SHA-256 Checksum"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? "Copied" : "SHA-256"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Companion Extension */}
            <div
              className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 lg:p-6 flex flex-col justify-between transition-all shadow-xs hover:shadow-md"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/10 shrink-0">
                      <Puzzle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                          Downex Browser Extension
                        </h2>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Chrome, Edge, Brave &amp; Chromium • Companion
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span>Install Once • Zero Bloat</span>
                  </span>
                </div>

                {/* Feature Bullets (Clean App-Style Neutral Capsules) */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300">
                    <span className="text-xs">🎯</span>
                    <span><strong>1-Click Browser Catch:</strong> Automatically sends download links (.zip, .exe, .iso) to Downex.</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300">
                    <span className="text-xs">🌐</span>
                    <span><strong>Works Everywhere:</strong> Supports Google Chrome, Microsoft Edge, Brave, and Chromium.</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300">
                    <span className="w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                    <span><strong>Step 1 (Dev Mode):</strong> Open <code className="px-1 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-[10px]">chrome://extensions</code> and turn on Developer Mode.</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300">
                    <span className="w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                    <span><strong>Step 2 (Load Folder):</strong> Click &apos;Load unpacked&apos; and select the extracted extension folder.</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 text-xs text-zinc-700 dark:text-zinc-300">
                    <span className="text-xs">🪄</span>
                    <span><strong>Zero Popups &amp; Quiet:</strong> Runs silently in the background with zero ads and zero update hassle.</span>
                  </div>
                </div>
              </div>

              {/* Actions & Specs */}
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <a
                    href={`${extensionDownloadUrl}${clientBuster}`}
                    download="downex-browser-extension.zip"
                    className="flex-1 inline-flex items-center justify-center gap-2 h-10 lg:h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs lg:text-sm font-semibold shadow-xs active:scale-[0.99] transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Extension</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-700 text-white">.zip</span>
                  </a>

                  <a
                    href={extensionShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 h-10 lg:h-11 rounded-xl bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all border border-zinc-200 dark:border-zinc-700 shrink-0"
                    title="Download Mirror"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Mirror</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                </div>

                <div className="pt-2.5 border-t border-zinc-200/70 dark:border-zinc-800/70 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-x-2">
                    <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Type:</span> Manifest V3</div>
                    <div className="text-zinc-300 dark:text-zinc-700">•</div>
                    <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Browsers:</span> Chromium</div>
                    <div className="text-zinc-300 dark:text-zinc-700">•</div>
                    <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Setup:</span> Install Once</div>
                  </div>

                  <a
                    href="https://github.com/AspiringWebGaurav/downex/tree/main/downex-browser-extension#readme"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <span>Setup Guide</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Single Unified Edge-to-Edge Footer (Seamless Transparent, No Border Line, Dot Matrix Shows Through) */}
        <footer
          id="terms"
          tabIndex={-1}
          className="w-full h-12 shrink-0 bg-transparent outline-none focus:outline-none transition-colors"
        >
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
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
}
