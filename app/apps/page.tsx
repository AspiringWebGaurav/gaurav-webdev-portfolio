"use client";

import React from "react";
import {
  Download,
  ExternalLink,
  Copy,
  Clock,
  BookOpen,
  Wrench,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Spotlight } from "@/components/ui/Spotlight";
import { LaunchpadHaptics } from "@/components/self/LaunchpadHaptics";
import { useTheme } from "@/lib/theme";
import { getSubdomainUrl } from "@/lib/theme/navigation";

interface AppItem {
  id: string;
  name: string;
  shortName: string;
  subdomain: string;
  subdomainUrl: string;
  category: string;
  version: string;
  statusBadge: string;
  tagline: string;
  description: string;
  accent: {
    strip: string;
    iconBg: string;
    iconBorder: string;
    badge: string;
    text: string;
    border: string;
    btn: string;
  };
  primaryActionLabel: string;
  features: string[];
  icon: React.ReactNode;
}

const PC_APPS: AppItem[] = [
  {
    id: "cp",
    name: "CP Engine",
    shortName: "CP",
    subdomain: "cp.apps.gauravpatil.site",
    subdomainUrl: "https://cp.apps.gauravpatil.site",
    category: "Win32 Explorer Accelerator",
    version: "v0.0.1",
    statusBadge: "IOCP Stream",
    tagline: "Unbuffered 4MB IOCP Kernel Copy/Paste",
    description:
      "Native Windows Explorer accelerator. Intercepts Ctrl+C / Ctrl+V and streams files through 4MB unbuffered IOCP workers.",
    accent: {
      strip: "from-emerald-500 to-teal-400",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      iconBorder: "border-emerald-500/20 dark:border-emerald-500/30",
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-slate-200/90 dark:border-white/10 hover:border-emerald-500/50",
      btn: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20",
    },
    primaryActionLabel: "Launch CP Engine",
    features: ["Win32 Native", "4MB IOCP Streaming", "Zero UI Freeze"],
    icon: <Copy className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    id: "downex",
    name: "Downex",
    shortName: "DX",
    subdomain: "downex.apps.gauravpatil.site",
    subdomainUrl: "https://downex.apps.gauravpatil.site",
    category: "High-Speed Download Manager",
    version: "v0.0.0",
    statusBadge: "Tauri Engine",
    tagline: "16x Multi-Segment Download Engine",
    description:
      "Fast Windows download manager with 16-connection acceleration, Chromium browser pairing, and silent background updates.",
    accent: {
      strip: "from-violet-500 to-purple-400",
      iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      iconBorder: "border-violet-500/20 dark:border-violet-500/30",
      badge: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30",
      text: "text-violet-600 dark:text-violet-400",
      border: "border-slate-200/90 dark:border-white/10 hover:border-violet-500/50",
      btn: "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/20",
    },
    primaryActionLabel: "Launch Downex",
    features: ["Rust / Tauri", "16x Multi-Part", "Extension Sync"],
    icon: <Download className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    id: "sm",
    name: "ScheduleMe",
    shortName: "SM",
    subdomain: "sm.apps.gauravpatil.site",
    subdomainUrl: "https://sm.apps.gauravpatil.site",
    category: "Windows Power & Shutdown Scheduler",
    version: "v0.0.1",
    statusBadge: "System Tray",
    tagline: "Silent System Tray Power Automation",
    description:
      "Ultra-lightweight Windows automation tool. Runs quietly in the system tray, launches with Windows, and executes power actions with zero CPU lag.",
    accent: {
      strip: "from-amber-500 to-orange-400",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      iconBorder: "border-amber-500/20 dark:border-amber-500/30",
      badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-slate-200/90 dark:border-white/10 hover:border-amber-500/50",
      btn: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20",
    },
    primaryActionLabel: "Launch ScheduleMe",
    features: ["Silent Auto-Start", "Zero CPU Lag", "GPHost OTA"],
    icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    id: "gpn",
    name: "GPN Notes",
    shortName: "GPN",
    subdomain: "gpn.apps.gauravpatil.site",
    subdomainUrl: "https://gpn.apps.gauravpatil.site",
    category: "Encrypted Local-First Notes",
    version: "v0.0.0",
    statusBadge: "Live Web App",
    tagline: "Real-Time CRDT Sync & Offline SQLite",
    description:
      "Private encrypted personal notes with real-time peer collaboration, local SQLite storage, TipTap editor, and cross-platform sync.",
    accent: {
      strip: "from-cyan-500 to-blue-400",
      iconBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
      iconBorder: "border-cyan-500/20 dark:border-cyan-500/30",
      badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30",
      text: "text-cyan-600 dark:text-cyan-400",
      border: "border-slate-200/90 dark:border-white/10 hover:border-cyan-500/50",
      btn: "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20",
    },
    primaryActionLabel: "Open GPN Web App",
    features: ["Web / Win / APK", "CRDT Real-Time", "E2EE Encrypted"],
    icon: <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
];

export default function AppsHubPage() {
  const { resolvedTheme } = useTheme();

  const resolveAppUrl = (_id: string, defaultUrl: string) => {
    return getSubdomainUrl(defaultUrl, resolvedTheme);
  };

  const resolveHubUrl = (_subdomain: string, prodUrl: string) => {
    return getSubdomainUrl(prodUrl, resolvedTheme);
  };

  return (
    <main
      data-portal="apps-hub"
      className="relative w-full h-[100dvh] max-h-dvh flex flex-col justify-between overflow-hidden select-none bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-zinc-100 transition-colors duration-200"
    >
      <LaunchpadHaptics />

      {/* Ambient Spotlight in Dark Mode */}
      <div className="pointer-events-none select-none hidden dark:block">
        <Spotlight
          className="-top-28 left-1/3 h-[90vh] w-[70vw]"
          fill="#06b6d4"
        />
      </div>

      {/* =======================================================================
          EDGE-TO-EDGE NAVBAR (Single Theme Button, Edge-To-Edge Header)
          ======================================================================= */}
      <header className="shrink-0 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 z-20">
        <div className="w-full flex items-center justify-between">
          {/* Left Branding */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-slate-300 dark:border-white/20 shadow-sm shrink-0 bg-slate-200 dark:bg-slate-800">
              <img
                src="/profile.webp"
                alt="Gaurav Patil"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                  Gaurav Patil <span className="text-cyan-600 dark:text-cyan-400 font-normal">/ Apps</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Maintenance Mode
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight hidden sm:block mt-0.5">
                Windows Native & Distributed Web Applications
              </p>
            </div>
          </div>

          {/* Right Navigation & Single Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <ThemeToggle variant="inline" className="w-8 h-8 rounded-lg shrink-0" />
            <a
              href={resolveHubUrl("services", "https://services.gauravpatil.site")}
              suppressHydrationWarning
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-white/10 transition-all inline-flex items-center gap-1.5 shadow-2xs"
            >
              <span>Services Hub</span>
              <span className="text-[10px] text-slate-400">↗</span>
            </a>
            <a
              href={resolveHubUrl("portfolio", "https://gauravpatil.site")}
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
          MIDDLE APPS GRID (Strict 100dvh, Zero Scroll, Premium Bento Layout)
          ======================================================================= */}
      <div className="flex-1 min-h-0 w-full overflow-hidden px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 flex flex-col justify-center items-center z-10">
        <div className="w-full max-w-7xl h-full flex flex-col justify-center">
          {/* Maintenance Notice Header */}
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-[11px] sm:text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span><strong>Maintenance Notice:</strong> App download channels are temporarily locked while undergoing scheduled polish and improvements.</span>
            </div>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-700 dark:text-amber-300 uppercase tracking-wider font-semibold">
              Polishing &amp; Updates
            </span>
          </div>

          <section
            aria-label="PC & Web Applications"
            className="w-full grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5 h-full max-h-[calc(100dvh-140px)] sm:max-h-[calc(100dvh-160px)]"
          >
            {PC_APPS.map((app) => (
              <div
                key={app.id}
                className={`group relative rounded-2xl border ${app.accent.border} bg-white/90 dark:bg-slate-900/60 backdrop-blur-md p-3 sm:p-4 lg:p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/5 shadow-2xs overflow-hidden`}
              >
                {/* Top Subtle Ambient Stripe */}
                <div
                  className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${app.accent.strip} opacity-80 group-hover:opacity-100 transition-opacity`}
                />

                {/* Card Header & Content */}
                <div className="flex flex-col min-h-0">
                  {/* Top Bar: Icon + Version Pill */}
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div
                      className={`p-2 sm:p-2.5 rounded-xl ${app.accent.iconBg} border ${app.accent.iconBorder} shadow-2xs group-hover:scale-105 transition-transform duration-300`}
                    >
                      {app.icon}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono border ${app.accent.badge}`}>
                        {app.version}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                        title="Under Maintenance • Active Polishing"
                      />
                    </div>
                  </div>

                  {/* App Identity */}
                  <div className="flex items-baseline justify-between gap-1">
                    <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                      {app.name}
                    </h2>
                    <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                      {app.id}.apps
                    </span>
                  </div>

                  <div className={`text-[10px] sm:text-xs font-semibold ${app.accent.text} mt-0.5 truncate`}>
                    {app.category}
                  </div>

                  {/* Description */}
                  <p className="text-[10.5px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1.5 sm:mt-2 line-clamp-2 sm:line-clamp-3">
                    {app.description}
                  </p>

                  {/* Feature Badges */}
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2 sm:mt-3">
                    {app.features.map((feat) => (
                      <span
                        key={feat}
                        className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Action Area */}
                <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-200/80 dark:border-white/10 flex flex-col gap-1.5">
                  <a
                    href={resolveAppUrl(app.id, app.subdomainUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    suppressHydrationWarning
                    className={`w-full py-2 sm:py-2.5 px-3 rounded-xl ${app.accent.btn} font-semibold text-[11px] sm:text-xs flex items-center justify-between transition-all duration-200 active:scale-[0.98] shadow-xs`}
                  >
                    <span className="truncate">{app.primaryActionLabel}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>

                  <div className="flex items-center justify-between text-[9.5px] sm:text-[10.5px] font-mono text-slate-400 dark:text-slate-500 px-0.5">
                    <span className="truncate">{app.subdomain}</span>
                    <span
                      className={`font-sans font-medium text-[9.5px] sm:text-[10px] shrink-0 ${
                        app.id === "gpn"
                          ? "text-cyan-600 dark:text-cyan-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      ● {app.statusBadge}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>

      {/* =======================================================================
          EDGE-TO-EDGE FOOTER
          ======================================================================= */}
      <footer className="shrink-0 w-full border-t border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-2.5 z-20">
        <div className="w-full flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Gaurav Patil</span>
            <span>·</span>
            <span>PC & Desktop Software Suite</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
            <span className="hidden sm:inline text-slate-400 dark:text-slate-500">100dvh Zero-Scroll Workspace</span>
          </div>

          <nav aria-label="Ecosystem Navigation" className="flex items-center gap-3 sm:gap-4">
            <a
              href={resolveHubUrl("services", "https://services.gauravpatil.site")}
              suppressHydrationWarning
              className="hover:text-cyan-500 transition-colors"
            >
              services.hub
            </a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <a
              href={resolveHubUrl("resume", "https://resume.services.gauravpatil.site")}
              suppressHydrationWarning
              className="hover:text-cyan-500 transition-colors"
            >
              resume
            </a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <a
              href={resolveHubUrl("contact", "https://contact.services.gauravpatil.site")}
              suppressHydrationWarning
              className="hover:text-cyan-500 transition-colors"
            >
              contact
            </a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <a
              href={resolveHubUrl("talk", "https://talk.services.gauravpatil.site")}
              suppressHydrationWarning
              className="hover:text-cyan-500 transition-colors"
            >
              talk
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
