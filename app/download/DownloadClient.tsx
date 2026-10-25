"use client";

import React, { useState, useEffect } from "react";
import {
  Monitor,
  Puzzle,
  Download,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Lock,
  Layers,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Cpu,
  Flame,
} from "lucide-react";

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
}

type TabType = "windows" | "extension";

const SHA256_CHECKSUM = "a935401314ff914d79da9338f0d8ca8b0051e7f4c08479e0066e5e8e3d09a06d";

const REG_BAT_SNIPPET = `@echo off
set "MANIFEST_PATH=%LOCALAPPDATA%\\Programs\\Downex\\com.downex.host.json"
reg add "HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.downex.host" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f
reg add "HKCU\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\com.downex.host" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f
echo [OK] Downex Native Host Registered`;

export default function DownloadClient({
  desktopDownloadUrl,
  desktopShareUrl,
}: DownloadClientProps) {
  const [platform, setPlatform] = useState<DetectedPlatform>("windows");
  const [activeTab, setActiveTab] = useState<TabType>("windows");
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedBat, setCopiedBat] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(SHA256_CHECKSUM);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch {
      // fallback
    }
  };

  const copyBatScript = async () => {
    try {
      await navigator.clipboard.writeText(REG_BAT_SNIPPET);
      setCopiedBat(true);
      setTimeout(() => setCopiedBat(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="relative min-h-dvh h-dvh max-h-dvh overflow-hidden bg-[#090b10] text-[#e8edf5] flex flex-col justify-between selection:bg-cyan-500/30 selection:text-white">
      {/* Dynamic Ambient Background Elements */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-cyan-600/15 via-blue-600/10 to-transparent blur-[120px]" />
        <div className="absolute -bottom-32 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-violet-600/15 via-indigo-600/10 to-transparent blur-[120px]" />
        {/* Subtle Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      {/* =========================================================================
          DESKTOP & TABLET VIEWPORT (md:flex) - STRICT 100dvh SINGLE VIEWPORT
         ========================================================================= */}
      <div className="relative z-10 hidden md:flex flex-col justify-between h-full max-w-7xl mx-auto w-full px-6 py-4 lg:py-6">
        {/* Top Header */}
        <header className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 shadow-[0_0_24px_rgba(6,182,212,0.4)] border border-cyan-400/30">
              <Flame className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">Downex</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Base v0.0.0
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Verified SHA-256
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Independent Next-Gen High-Performance Desktop Download Manager & Extension
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800/80 rounded-full px-3.5 py-1.5 backdrop-blur-md">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>GPHost OTA Pipeline: Active</span>
            </div>
            <a
              href="https://gauravpatil.site"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors bg-zinc-900/40"
            >
              <span>Portfolio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* Central Cards Section (Twin-Column Desktop Grid) */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-8 my-auto max-h-[78vh] items-stretch">
          {/* ================= CARD 1: Downex Windows Desktop App ================= */}
          <div className="relative flex flex-col justify-between rounded-2xl bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 border border-zinc-800/80 hover:border-cyan-500/40 transition-all duration-300 p-5 lg:p-6 backdrop-blur-xl shadow-2xl group">
            {/* Ambient Corner Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-bl-[80px] pointer-events-none filter blur-xl transition-opacity group-hover:opacity-100" />

            <div>
              {/* Badge & Title */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base lg:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <span>Downex for Windows</span>
                      {platform === "windows" && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Your OS
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-zinc-400">x64 Setup Installer ? Windows 10 & 11</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                    ~4.1 MB
                  </span>
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 gap-2 my-3.5">
                <div className="flex items-start gap-2 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                  <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold text-white">64 Sockets Engine</div>
                    <div className="text-[10px] text-zinc-400 leading-tight">Dynamic byte-range turbo chunks</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold text-white">Silent In-Process OTA</div>
                    <div className="text-[10px] text-zinc-400 leading-tight">Hot runtime swaps without UAC</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold text-white">Crash Watchdog</div>
                    <div className="text-[10px] text-zinc-400 leading-tight">Automatic rollback protection</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                  <Lock className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold text-white">Minisign Ed25519</div>
                    <div className="text-[10px] text-zinc-400 leading-tight">Cryptographic binary verification</div>
                  </div>
                </div>
              </div>

              {/* SHA-256 Checksum Verification Box */}
              <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 text-[11px] font-mono text-zinc-300">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                  <span className="flex items-center gap-1.5 font-sans font-semibold uppercase tracking-wider text-zinc-400">
                    <Terminal className="w-3 h-3 text-cyan-400" />
                    <span>SHA-256 Checksum</span>
                  </span>
                  <button
                    type="button"
                    onClick={copyHash}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors font-sans cursor-pointer text-[10px]"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? "Copied" : "Copy Hash"}</span>
                  </button>
                </div>
                <div className="font-mono text-[10px] text-zinc-300 truncate tracking-tight selection:bg-cyan-500/40">
                  {SHA256_CHECKSUM}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <a
                href={desktopDownloadUrl}
                className="flex-1 inline-flex items-center justify-center gap-2.5 h-11 px-5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs lg:text-sm font-bold shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Base Setup (.exe)</span>
              </a>
              <a
                href={desktopShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Direct Cloudflare R2 Storage Mirror"
                className="inline-flex items-center justify-center gap-1.5 h-11 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-semibold active:scale-[0.98] transition-all shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mirror</span>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>
            </div>
          </div>

          {/* ================= CARD 2: Downex Companion Browser Extension ================= */}
          <div className="relative flex flex-col justify-between rounded-2xl bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 border border-zinc-800/80 hover:border-violet-500/40 transition-all duration-300 p-5 lg:p-6 backdrop-blur-xl shadow-2xl group">
            {/* Ambient Corner Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-bl-[80px] pointer-events-none filter blur-xl transition-opacity group-hover:opacity-100" />

            <div>
              {/* Badge & Title */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                    <Puzzle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base lg:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <span>Downex Companion Extension</span>
                    </h2>
                    <p className="text-xs text-zinc-400">Manifest V3 ? Chrome, Edge, Brave, Opera, Chromium</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/20">
                    v0.0.1
                  </span>
                </div>
              </div>

              {/* 3 Step Installation Guide */}
              <div className="space-y-2 my-3">
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-[11px] leading-tight">
                    <span className="font-semibold text-white">Load Unpacked Extension:</span>{" "}
                    <span className="text-zinc-400">
                      Open <code className="text-violet-300 font-mono">chrome://extensions</code>, enable Developer Mode, and click <em>Load unpacked</em>.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-[11px] leading-tight">
                    <span className="font-semibold text-white">Floating Media Grabber:</span>{" "}
                    <span className="text-zinc-400">
                      Hover videos/audio on any page to reveal the 1-click Downex download pill.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-[11px] leading-tight">
                    <span className="font-semibold text-white">Native Host Loopback:</span>{" "}
                    <span className="text-zinc-400">
                      Seamless local loopback bridge on port 45123 with SHA-256 token handshake.
                    </span>
                  </div>
                </div>
              </div>

              {/* Registry Installer Script Box */}
              <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-[10px] font-mono text-zinc-300">
                <div className="flex items-center justify-between mb-1 text-[9px] text-zinc-500 uppercase tracking-wide">
                  <span>Host Registration Script (install-host.bat)</span>
                  <button
                    type="button"
                    onClick={copyBatScript}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    {copiedBat ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBat ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="text-zinc-400 font-mono text-[9px] truncate">
                  {'reg add "HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.downex.host" ...'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-3">
              <a
                href="https://github.com/AspiringWebGaurav/downex/archive/refs/heads/main.zip"
                className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-cyan-500/40 hover:border-cyan-400 text-white text-xs font-bold shadow-md active:scale-[0.98] transition-all"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Download Extension Package (.zip)</span>
              </a>
              <a
                href="https://github.com/AspiringWebGaurav/downex/tree/main/downex-browser-extension#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 h-11 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-semibold active:scale-[0.98] transition-all shrink-0"
              >
                <span>Docs</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              </a>
            </div>
          </div>
        </main>

        {/* Bottom Status & Footer */}
        <footer className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-900 pt-3 shrink-0">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-zinc-400">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Downex Engine: Tauri 2 + Rust + React 19</span>
            </span>
            <span className="hidden sm:inline text-zinc-700">|</span>
            <span className="hidden sm:inline text-zinc-400">GPHost R2 Bucket: downex-dynamic-binaries</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="https://github.com/AspiringWebGaurav/downex"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              GitHub Repository
            </a>
            <span className="text-zinc-700">|</span>
            <span>&copy; {new Date().getFullYear()} Gaurav Patil</span>
          </div>
        </footer>
      </div>

      {/* =========================================================================
          MOBILE VIEWPORT (md:hidden) - STRICT 100dvh SINGLE VIEWPORT (NO SCROLL)
         ========================================================================= */}
      <div className="relative z-10 flex md:hidden flex-col justify-between h-full w-full px-4 py-3">
        {/* Mobile Header */}
        <header className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">Downex</span>
          </div>
          <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            v0.0.0
          </span>
        </header>

        {/* Mobile Tabs Switcher */}
        <div className="flex rounded-xl bg-zinc-900/90 p-1 border border-zinc-800 my-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("windows")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "windows"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Windows App</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("extension")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "extension"
                ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Puzzle className="w-3.5 h-3.5" />
            <span>Extension</span>
          </button>
        </div>

        {/* Mobile Tab Content Card */}
        <div className="flex-1 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 p-4 flex flex-col justify-between my-1">
          {activeTab === "windows" ? (
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Downex for Windows</h3>
                      <p className="text-[10px] text-zinc-400">x64 Installer ? Win 10 & 11</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                    ~4.1 MB
                  </span>
                </div>

                <div className="space-y-1.5 my-3 text-[11px] text-zinc-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>64 TCP sockets per download</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>In-process silent OTA updates (zero UAC)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Self-healing watchdog crash rollback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>SQLite WAL state persistence</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={desktopDownloadUrl}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .exe (~4.1 MB)</span>
                </a>
                <a
                  href={desktopShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cloudflare R2 Mirror</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center">
                      <Puzzle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Browser Extension</h3>
                      <p className="text-[10px] text-zinc-400">Chrome, Edge, Brave, Chromium</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                    v0.0.1
                  </span>
                </div>

                <div className="space-y-1.5 my-3 text-[11px] text-zinc-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span>HTML5 floating media grabber pill</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span>DASH (.mpd) & HLS (.m3u8) audio/video sniffer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span>Token handshake loopback bridge</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href="https://github.com/AspiringWebGaurav/downex/archive/refs/heads/main.zip"
                  className="w-full inline-flex items-center justify-center gap-2 h-10 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Extension (.zip)</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Footer */}
        <footer className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 shrink-0">
          <span>Downex Base v0.0.0</span>
          <a href="https://gauravpatil.site" className="text-cyan-400 hover:underline">
            gauravpatil.site
          </a>
        </footer>
      </div>
    </div>
  );
}
