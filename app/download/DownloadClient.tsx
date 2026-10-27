"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Monitor,
  Puzzle,
  ExternalLink,
  Download,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Globe,
  CheckCircle2,
  Copy,
  Check,
  Flame,
  Shield,
  RefreshCw,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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

const BASE_VERSION = "v0.0.0";
const SHA256_CHECKSUM = "7319b88e586f8e1b6fd2ba373f280090835dc4ee79cabf11ca5819353a278e51";

export default function DownloadClient({
  desktopDownloadUrl,
  desktopShareUrl,
  extensionDownloadUrl = "https://gphost.eu.cc/raw/jNF1Ufun-qFz",
  extensionShareUrl = "https://gphost.eu.cc/f/jNF1Ufun-qFz",
}: DownloadClientProps) {
  const [detectedOS, setDetectedOS] = useState<DetectedPlatform>("windows");
  const [mobileTab, setMobileTab] = useState<MobileTab>("windows");
  const [copiedHash, setCopiedHash] = useState(false);
  const [activeVersion, setActiveVersion] = useState<string>(BASE_VERSION);

  useEffect(() => {
    const platform = detectPlatform();
    setDetectedOS(platform);

    // Online release discovery: query GPHost OTA registry for newer active releases
    async function checkOnlineRelease() {
      try {
        const res = await fetch(
          "https://gphost.eu.cc/api/v1/releases/downex/latest?target=windows-x86_64&arch=x86_64&current_version=0.0.0",
          {
            headers: { Accept: "application/json" },
            cache: "no-store",
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.version && data.version !== "0.0.0") {
            const cleanVer = data.version.replace(/^v/, "");
            setActiveVersion(`v${cleanVer}`);
          }
        }
      } catch {
        // Fallback cleanly to verified base version
      }
    }

    checkOnlineRelease();
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
      className="relative w-full h-dvh max-h-dvh overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 select-none font-sans antialiased transition-colors duration-300"
    >
      {/* Background Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-tr from-violet-600/15 via-indigo-500/10 to-cyan-500/15 blur-3xl rounded-full opacity-35 dark:opacity-25"
      />

      {/* =========================================================================
          1. DEDICATED MOBILE LAYOUT (Strict 100dvh, Single View, Zero Scroll)
          ========================================================================= */}
      <div className="flex md:hidden h-full max-h-dvh w-full flex-col justify-between overflow-hidden p-3.5 relative z-10">
        {/* Mobile Header */}
        <header className="w-full h-8 flex items-center justify-between shrink-0 border-b border-zinc-100 dark:border-zinc-900 pb-1.5">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center font-black text-[11px] shadow-xs">
              <Flame className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-xs tracking-tight text-zinc-900 dark:text-zinc-100">
              Downex
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle variant="inline" className="w-7 h-7 shrink-0" />
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Base {BASE_VERSION}
            </span>
            <a
              href="https://gauravpatil.site"
              className="px-2 py-0.5 rounded-lg text-[10px] font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Portfolio
            </a>
          </div>
        </header>

        {/* Mobile Hero Header */}
        <div className="shrink-0 text-center pt-0.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 text-[9px] font-semibold mb-1">
            <Sparkles className="w-2.5 h-2.5 text-violet-500" />
            <span>
              {detectedOS === "windows"
                ? "Windows PC Detected"
                : "Desktop & Browser Apps"}
            </span>
          </div>

          <h1 className="text-xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
            <span>Download </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 dark:from-violet-400 dark:via-indigo-400 dark:to-cyan-400">
              Downex
            </span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-normal max-w-xs mx-auto line-clamp-1 mt-0.5">
            Immutable Base Binary • 64-Socket Speed • Updatable Extension
          </p>

          {/* Segmented Switcher Tabs */}
          <div className="mt-2 inline-flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-[10px] font-medium shadow-xs">
            <button
              type="button"
              onClick={() => setMobileTab("windows")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                mobileTab === "windows"
                  ? "bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 font-bold shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>Immutable Base App</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("extension")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                mobileTab === "extension"
                  ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Puzzle className="w-3 h-3" />
              <span>Updatable Extension</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Content Card */}
        <div className="flex-1 min-h-0 flex flex-col justify-between my-2">
          {mobileTab === "windows" ? (
            <div className="flex-1 min-h-0 flex flex-col justify-between rounded-2xl border border-violet-500/30 dark:border-violet-500/20 bg-gradient-to-b from-violet-500/[0.08] via-zinc-50/50 dark:via-zinc-900/50 to-white dark:to-zinc-950 p-3.5 shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shadow-md shadow-zinc-900/20 shrink-0">
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
                        Immutable Base • Windows 10 &amp; 11 • ~3.7 MB
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-900">
                    Immutable v0.0.0
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 leading-relaxed">
                  Permanent immutable base binary (v0.0.0). Never replaced or overwritten on disk, with future enhancements delivered silently in-process.
                </p>

                {/* Checksum Box */}
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[9px] text-zinc-500 dark:text-zinc-400 font-mono mb-2">
                  <span className="truncate mr-2">SHA-256: {SHA256_CHECKSUM.slice(0, 16)}...</span>
                  <button
                    type="button"
                    onClick={copyHash}
                    className="text-violet-600 dark:text-violet-400 hover:underline font-sans font-bold shrink-0 cursor-pointer"
                  >
                    {copiedHash ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Actions & Switcher */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <a
                    href={desktopDownloadUrl}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-md active:scale-[0.98] transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Base (.exe)</span>
                  </a>
                  <a
                    href={desktopShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 h-10 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold active:scale-[0.98] transition-all shrink-0"
                    title="Download Mirror"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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
                    <span>Need Updatable Browser Extension?</span>
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    Switch <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col justify-between rounded-2xl border border-emerald-500/30 dark:border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.08] via-zinc-50/50 dark:via-zinc-900/50 to-white dark:to-zinc-950 p-3.5 shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                      <Puzzle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                          Updatable Extension
                        </h2>
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Dynamic Updates • Manifest V3 • Chromium
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                    Updatable MV3
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 leading-relaxed">
                  Dynamic companion extension. Receives ongoing updates as streaming formats evolve. Floating media grabber &amp; zero-config loopback bridge.
                </p>

                <div className="space-y-1 my-2 text-[10px] text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>Updatable floating video/audio grabber</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>Loopback port 45123 token handshake</span>
                  </div>
                </div>
              </div>

              {/* Actions & Switcher */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <a
                    href={extensionDownloadUrl}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md active:scale-[0.98] transition-all"
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
                    <Monitor className="w-3.5 h-3.5 text-violet-500" />
                    <span>Need Immutable Windows App?</span>
                  </span>
                  <span className="font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-0.5">
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
          className="h-8 px-2.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/70 dark:border-zinc-800/70 flex items-center justify-between text-[10px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors shrink-0 mb-1"
        >
          <span className="flex items-center gap-1.5 truncate">
            <Globe className="w-3 h-3 text-violet-500 shrink-0" />
            <span>Developer Mode: Chrome //extensions &rarr; Load Unpacked</span>
          </span>
          <ArrowRight className="w-2.5 h-2.5 text-zinc-400 shrink-0 ml-1" />
        </a>

        {/* Mobile Footer */}
        <footer className="w-full h-5 flex items-center justify-between text-[9px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-900 shrink-0">
          <div>&copy; {new Date().getFullYear()} Downex</div>
          <div className="flex items-center gap-2">
            <a href="https://gauravpatil.site" className="hover:text-zinc-600 dark:hover:text-zinc-300">
              gauravpatil.site
            </a>
            <span>•</span>
            <span>GPHost</span>
          </div>
        </footer>
      </div>

      {/* =========================================================================
          2. DESKTOP & TABLET VIEWPORT (Strict 100dvh, Pixel-Matched, Zero Overlap)
          ========================================================================= */}
      <div className="hidden md:flex h-full max-h-dvh w-full flex-col justify-between overflow-hidden relative z-10">
        {/* Desktop Navbar */}
        <header className="w-full px-6 lg:px-8 h-12 lg:h-14 flex items-center justify-between shrink-0 border-b border-zinc-100 dark:border-zinc-900">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center font-black text-sm shadow-xs">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-zinc-950 dark:text-zinc-50">
              Downex
            </span>
          </Link>

          {/* Cleanly Aligned Desktop Navigation with Inline Theme Toggle */}
          <nav className="flex items-center gap-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <a
              href="https://gauravpatil.site"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Portfolio
            </a>
            <a
              href="https://github.com/AspiringWebGaurav/downex"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              GitHub
            </a>

            {/* Seamless Inline Theme Button (Zero Layout Shift or Floating Collision) */}
            <div className="flex items-center px-1">
              <ThemeToggle variant="inline" className="w-8 h-8 shrink-0" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live • Immutable Base {BASE_VERSION}
            </span>
          </nav>
        </header>

        {/* Desktop Main Content (Guaranteed NO vertical scroll) */}
        <main className="w-full flex-1 min-h-0 flex flex-col justify-evenly py-2 lg:py-3 px-6 lg:px-8 max-w-6xl mx-auto">
          {/* Headline Section */}
          <div className="text-left shrink-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 text-[11px] font-semibold mb-1.5">
              <Sparkles className="w-3 h-3 text-violet-500" />
              <span>Cross-Platform Native Apps</span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-zinc-700 dark:text-zinc-300 capitalize font-medium">
                Detected: {detectedOS}
              </span>
            </div>

            <h1 className="text-3xl lg:text-4xl 2xl:text-5xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
              <span>Download </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 dark:from-violet-400 dark:via-indigo-400 dark:to-cyan-400">
                Downex
              </span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs lg:text-sm mt-1 font-normal max-w-2xl">
              High-performance desktop download manager with 64 dynamic socket acceleration, an immutable base foundation, and an updatable browser companion.
            </p>
          </div>

          {/* Dual Platform Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 shrink-0">
            {/* Card 1: Windows Desktop (IMMUTABLE BASE APP) */}
            <div
              className={`relative rounded-2xl border p-5 lg:p-6 flex flex-col justify-between transition-all shadow-xs hover:shadow-md ${
                detectedOS === "windows"
                  ? "border-violet-500/70 bg-violet-50/20 dark:bg-violet-950/20 ring-1 ring-violet-500/30"
                  : "border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-50/40 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center shadow-xs shrink-0">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                          Downex for Windows
                        </h2>
                        {detectedOS === "windows" && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-violet-600 text-white shadow-2xs">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Your Device</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Windows 10 &amp; 11 (64-bit) • Permanent Base
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-900/60">
                    <Shield className="w-3 h-3 text-violet-500" />
                    <span>Immutable Base {BASE_VERSION}</span>
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs lg:text-sm text-zinc-600 dark:text-zinc-400 mb-3.5 leading-relaxed">
                  Permanent immutable base foundation (v0.0.0). The base executable binary is permanent and never replaced on disk, with future enhancements delivered silently through in-process shadow updates.
                </p>
              </div>

              {/* Actions & Specs */}
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <a
                    href={desktopDownloadUrl}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-10 lg:h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs lg:text-sm font-semibold shadow-xs active:scale-[0.99] transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Immutable Base (.exe)</span>
                  </a>

                  <a
                    href={desktopShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 h-10 lg:h-11 rounded-xl bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all border border-zinc-200/90 dark:border-zinc-800 shrink-0"
                    title="Download Mirror"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Mirror</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                </div>

                <div className="pt-2.5 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-x-2.5">
                    <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Base:</span> Immutable v0.0.0</div>
                    <div className="text-zinc-300 dark:text-zinc-700">•</div>
                    <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Storage:</span> SQLite WAL</div>
                    <div className="text-zinc-300 dark:text-zinc-700">•</div>
                    <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Size:</span> ~3.7 MB</div>
                  </div>
                  <button
                    type="button"
                    onClick={copyHash}
                    className="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 hover:underline font-mono font-medium cursor-pointer"
                    title="Click to copy SHA-256 Checksum"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? "Copied" : "SHA-256"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Companion Extension (DYNAMIC & UPDATABLE) */}
            <div className="relative rounded-2xl border p-5 lg:p-6 flex flex-col justify-between transition-all shadow-xs hover:shadow-md border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-50/40 dark:bg-zinc-900/30 hover:border-zinc-300 dark:hover:border-zinc-700">
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Puzzle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                          Downex Companion Extension
                        </h2>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Chrome, Edge, Brave &amp; Chromium • Updatable
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60">
                    <RefreshCw className="w-3 h-3 text-emerald-500" />
                    <span>Updatable MV3</span>
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs lg:text-sm text-zinc-600 dark:text-zinc-400 mb-3.5 leading-relaxed">
                  Continuous dynamic companion extension. Receives ongoing updates as streaming protocols evolve. Real-time floating media grabber and local native loopback bridge.
                </p>
              </div>

              {/* Actions & Specs */}
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <a
                    href={extensionDownloadUrl}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-10 lg:h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs lg:text-sm font-semibold shadow-xs active:scale-[0.99] transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Extension (.zip)</span>
                  </a>

                  <a
                    href="https://github.com/AspiringWebGaurav/downex/tree/main/downex-browser-extension#readme"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 h-10 lg:h-11 rounded-xl bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all border border-zinc-200/90 dark:border-zinc-800 shrink-0"
                    title="Extension Documentation"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Docs</span>
                  </a>
                </div>

                <div className="pt-2.5 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center gap-x-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Lifecycle:</span> Updatable</div>
                  <div className="text-zinc-300 dark:text-zinc-700">•</div>
                  <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Manifest:</span> V3</div>
                  <div className="text-zinc-300 dark:text-zinc-700">•</div>
                  <div><span className="font-medium text-zinc-700 dark:text-zinc-300">Integration:</span> Chromium</div>
                </div>
              </div>
            </div>
          </div>

          {/* Setup / Developer Mode Option Strip */}
          <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 py-2.5 px-4 flex items-center justify-between gap-4 text-left bg-zinc-50/40 dark:bg-zinc-900/30 shrink-0">
            <div>
              <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-violet-500" />
                <span>Prefer manual unpack or extension source?</span>
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Open <code className="px-1 py-0.2 rounded bg-zinc-200/70 dark:bg-zinc-800 text-[10px] font-mono text-zinc-700 dark:text-zinc-300">chrome://extensions</code>, enable Developer Mode, and click <em>Load unpacked</em> to connect the floating media grabber.
              </p>
            </div>
            <a
              href="https://github.com/AspiringWebGaurav/downex/tree/main/downex-browser-extension#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors shrink-0"
            >
              <span>Setup Guide</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </main>

        {/* Desktop Footer */}
        <footer className="w-full px-6 lg:px-8 h-10 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0">
          <div>&copy; {new Date().getFullYear()} Downex • Gaurav Patil</div>
          <div className="flex items-center gap-5">
            <a
              href="https://gauravpatil.site/privacy"
              className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              Privacy
            </a>
            <a
              href="https://gauravpatil.site/terms"
              className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              Terms
            </a>
            <span className="text-zinc-200 dark:text-zinc-800">|</span>
            <span className="text-zinc-500">Powered by GPHost Cloud Engine</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
