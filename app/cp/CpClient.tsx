"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ArrowLeft,
  Copy,
  Check,
  Zap,
  HardDrive,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Eye,
  EyeOff,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import CpMarketingLayer from "./CpMarketingLayer";

interface CpClientProps {
  desktopDownloadUrl: string;
  desktopShareUrl: string;
}

type CpView = "marketing" | "download";

const CP_SHA256_CHECKSUM =
  "31724bd68819fb7ef161e3d484b77044db3c7bd72476d517e4ef1ab99e070fad";

export default function CpClient({
  desktopDownloadUrl,
}: CpClientProps) {
  const [view, setView] = useState<CpView>("marketing");
  const [copiedHash, setCopiedHash] = useState(false);
  const [showHash, setShowHash] = useState(false);

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
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-portal", "cp");
    }

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
        } else {
          setView("marketing");
        }
      };

      syncViewFromUrl();
      window.addEventListener("popstate", syncViewFromUrl);
      return () => window.removeEventListener("popstate", syncViewFromUrl);
    }
  }, []);

  const copyChecksum = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(CP_SHA256_CHECKSUM);
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div
      data-portal="cp"
      className="relative w-full h-dvh max-h-dvh overflow-hidden bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 select-none font-sans antialiased transition-colors duration-300"
    >
      {/* Unified Background Canvas with Emerald Dot Matrix */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden select-none"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[#fafafa] dark:bg-[#09090b] transition-colors duration-300" />
        <div className="absolute inset-x-0 top-0 bottom-12 bg-[radial-gradient(#10b981_1.25px,transparent_1.25px)] dark:bg-[radial-gradient(#059669_1.25px,transparent_1.25px)] [background-size:24px_24px] opacity-25 dark:opacity-20 [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]" />
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
            <CpMarketingLayer
              onOpenDownload={openDownloadView}
              desktopDownloadUrl={desktopDownloadUrl}
            />
          </motion.div>
        ) : (
          <motion.div
            key="download"
            initial={{ opacity: 0, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.995 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full h-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto overflow-hidden relative z-10"
          >
            {/* Top Bar with Back Button */}
            <header className="w-full flex items-center justify-between shrink-0 mb-2">
              <button
                onClick={openMarketingView}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Overview</span>
              </button>

              <div className="flex items-center gap-2">
                <ThemeToggle variant="inline" className="w-8 h-8 shrink-0" />
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold select-none"
                  title="CP Engine"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Coming Soon</span>
                </div>
              </div>
            </header>

            {/* Main Download & Verification Card */}
            <main className="flex-1 min-h-0 flex flex-col justify-center my-auto">
              <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white/80 dark:bg-zinc-950/80 p-5 sm:p-6 shadow-xl backdrop-blur-md">
                {/* Title & Metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                      CP
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50 leading-tight">
                        CP for Windows
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>Coming Soon</span>
                        </span>
                        <span>&bull;</span>
                        <span>Base v0.0.1</span>
                        <span>&bull;</span>
                        <span>Windows 10 / 11 (64-bit)</span>
                      </div>
                    </div>
                  </div>

                  {/* Download Locked - Coming Soon */}
                  <div className="flex items-center gap-2 sm:self-center">
                    <button
                      disabled
                      className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-bold shadow-none cursor-not-allowed select-none"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Coming Soon</span>
                    </button>
                  </div>
                </div>

                {/* Release & Security Highlights Banner */}
                <div className="mt-4 p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-200 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-sm text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                        <span>Official Production Base Release &bull; Anchored Foundation</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-mono uppercase tracking-wider font-semibold">
                          v0.0.1 Stable
                        </span>
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        Direct NVMe-speed hardware acceleration with async I/O completion ports (IOCP), quiet background operation, and cryptographically verified background OTA updates.
                      </p>
                    </div>
                  </div>
                </div>

                {/* SHA-256 Checksum Card */}
                <div className="my-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>SHA-256 Cryptographic Checksum</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowHash((prev) => !prev)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                        title={showHash ? "Hide Checksum" : "Show Checksum"}
                      >
                        {showHash ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Show</span>
                          </>
                        )}
                      </button>
                      <span className="text-zinc-300 dark:text-zinc-700" aria-hidden="true">&bull;</span>
                      <button
                        type="button"
                        onClick={copyChecksum}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {copiedHash ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Hash</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="relative flex items-center justify-between font-mono text-[11px] sm:text-xs bg-white dark:bg-black/50 px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800/80 transition-all">
                    <div className="min-w-0 flex-1 truncate mr-2">
                      {showHash ? (
                        <span className="text-zinc-700 dark:text-zinc-300 break-all select-all font-mono">
                          {CP_SHA256_CHECKSUM}
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-500 tracking-[0.22em] text-[12px] select-none font-mono">
                          ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHash((prev) => !prev)}
                      className="inline-flex items-center gap-1 p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                      title={showHash ? "Hide SHA-256 Checksum" : "Reveal SHA-256 Checksum"}
                      aria-label={showHash ? "Hide SHA-256 Checksum" : "Reveal SHA-256 Checksum"}
                    >
                      {showHash ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Dynamic System Capabilities */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      What Makes CP Engine Special
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Edge Active</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Super Fast Copy</span>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                          Copies big games, movies, and files at top speed with no waiting.
                        </p>
                      </div>
                      <div className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-300 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Instant Paste</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Runs Quietly</span>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                          Sits quietly near your clock without slowing down your PC or games.
                        </p>
                      </div>
                      <div className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-300 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Zero Lag</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Automatic Updates</span>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                          Updates itself quietly in the background without any annoying popups.
                        </p>
                      </div>
                      <div className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-300 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Always Fresh</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto-Update Dynamic Assurance Note */}
                <div className="mt-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      <strong>Auto Updates On:</strong> Stays up to date automatically in the background with zero popups.
                    </span>
                  </div>
                  <a
                    href="/how-to-use#dynamic-ota"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0 ml-2"
                  >
                    <span>OTA Docs</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </main>

            {/* Enterprise Single-Line Desktop Footer */}
            <footer className="w-full h-10 lg:h-11 shrink-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800/80 z-30 transition-colors">
              <div className="w-full h-full flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <span>&copy; {new Date().getFullYear()} CP Engine</span>
                  <span>&bull;</span>
                  <span>Gaurav Patil</span>
                  <span>&bull;</span>
                  <a
                    href="https://github.com/AspiringWebGaurav/cp/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-zinc-900 dark:hover:text-zinc-200 hover:underline transition-colors"
                  >
                    MIT License
                  </a>
                </div>
                <div className="flex items-center gap-2.5 sm:gap-3 text-[11px] font-medium">
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
                  >
                    Terms
                  </a>
                  <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
                  >
                    Privacy
                  </a>
                  <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
                  <a
                    href="/aou"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
                  >
                    AOU
                  </a>
                  <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
                  <a
                    href="/how-to-use#dynamic-ota"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
                  >
                    Updates
                  </a>
                  <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
                  <a
                    href="/how-to-use"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors"
                  >
                    Docs
                  </a>
                  <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
                  <a
                    href="https://gauravpatil.site"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    Portfolio
                  </a>
                  <span className="text-zinc-300 dark:text-zinc-700">&bull;</span>
                  <a
                    href="https://gphost.eu.cc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    GPHost CDN
                  </a>
                </div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
