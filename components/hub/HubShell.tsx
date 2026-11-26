"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Spotlight } from "@/components/ui/Spotlight";
import { LaunchpadHaptics } from "@/components/self/LaunchpadHaptics";
import { useTheme } from "@/lib/theme";
import { getSubdomainUrl } from "@/lib/theme/navigation";

export type HubAccentTone = "violet" | "emerald" | "amber" | "cyan" | "indigo" | "blue";

export interface HubCardItem {
  id: string;
  title: string;
  hostLabel: string;
  fullHost: string;
  href: string;
  external?: boolean;
  subtitle: string;
  description: string;
  ctaLabel: string;
  tone: HubAccentTone;
  status?: {
    label: string;
    state: "live" | "maintenance" | "verified";
  };
  features: string[];
  icon: React.ReactNode;
}

export interface HubFooterLink {
  label: string;
  url: string;
}

interface HubShellProps {
  portalId: string;
  sectionLabel: string;
  subtitle: string;
  heroEyebrow: string;
  heroTitle: React.ReactNode;
  heroDescription: string;
  secondaryNav: {
    label: string;
    url: string;
  };
  spotlightFill: string;
  items: HubCardItem[];
  columns: 3 | 4;
  footerLabel: string;
  footerLinks: HubFooterLink[];
}

const TONE_CLASSES: Record<
  HubAccentTone,
  {
    iconBox: string;
    subtitleText: string;
    hoverBorder: string;
  }
> = {
  emerald: {
    iconBox:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/25",
    subtitleText: "text-emerald-700 dark:text-emerald-400",
    hoverBorder: "hover:border-emerald-500/35 dark:hover:border-emerald-500/40",
  },
  violet: {
    iconBox:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 dark:border-violet-500/25",
    subtitleText: "text-violet-700 dark:text-violet-400",
    hoverBorder: "hover:border-violet-500/35 dark:hover:border-violet-500/40",
  },
  amber: {
    iconBox:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/25",
    subtitleText: "text-amber-700 dark:text-amber-400",
    hoverBorder: "hover:border-amber-500/35 dark:hover:border-amber-500/40",
  },
  cyan: {
    iconBox:
      "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 dark:border-cyan-500/25",
    subtitleText: "text-cyan-700 dark:text-cyan-400",
    hoverBorder: "hover:border-cyan-500/35 dark:hover:border-cyan-500/40",
  },
  indigo: {
    iconBox:
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-500/25",
    subtitleText: "text-indigo-700 dark:text-indigo-400",
    hoverBorder: "hover:border-indigo-500/35 dark:hover:border-indigo-500/40",
  },
  blue: {
    iconBox:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/25",
    subtitleText: "text-blue-700 dark:text-blue-400",
    hoverBorder: "hover:border-blue-500/35 dark:hover:border-blue-500/40",
  },
};

function StatusBadge({ status }: { status: NonNullable<HubCardItem["status"]> }) {
  const styles =
    status.state === "live"
      ? {
          wrap: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
          dot: "bg-emerald-500",
        }
      : status.state === "verified"
      ? {
          wrap: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25",
          dot: "bg-violet-500",
        }
      : {
          wrap: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
          dot: "bg-amber-500",
        };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${styles.wrap}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      <span>{status.label}</span>
    </span>
  );
}

export function HubShell({
  portalId,
  sectionLabel,
  subtitle,
  heroEyebrow,
  heroTitle,
  heroDescription,
  secondaryNav,
  spotlightFill,
  items,
  columns,
  footerLabel,
  footerLinks,
}: HubShellProps) {
  const { resolvedTheme } = useTheme();

  const gridClass =
    columns === 4
      ? "grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4"
      : "grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-5";

  const containerMaxWidth = columns === 4 ? "max-w-[1160px]" : "max-w-[1040px]";

  return (
    <main
      data-portal={portalId}
      className="relative w-full h-[100dvh] max-h-dvh flex flex-col justify-between overflow-hidden select-none bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 antialiased transition-colors duration-200"
    >
      <LaunchpadHaptics />

      {/* Unified Subtle Portfolio Dot Grid Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 dark:bg-grid-white/[0.025] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-70 dark:opacity-100"
      >
        <div className="absolute inset-0 bg-[#fafafa] dark:bg-[#09090b] [mask-image:radial-gradient(ellipse_at_center,transparent_25%,black)]" />
      </div>

      {/* Dark Mode Ambient Spotlight */}
      <div className="pointer-events-none select-none hidden dark:block">
        <Spotlight
          className="-top-28 left-1/3 h-[85vh] w-[65vw]"
          fill={spotlightFill}
        />
      </div>

      {/* =====================================================================
          MINIMAL TRANSPARENT HEADER (Portfolio-Native Edge Chrome)
          ===================================================================== */}
      <header className="relative z-20 shrink-0 w-full h-12 sm:h-14 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xs shrink-0 bg-zinc-100 dark:bg-zinc-900">
            <img
              src="/profile.webp"
              alt="Gaurav Patil"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
              <span className="text-[13px] sm:text-sm font-bold tracking-tight text-zinc-950 dark:text-white leading-none">
                Gaurav Patil
              </span>
              <span className="text-zinc-300 dark:text-zinc-700 text-xs sm:text-sm leading-none">/</span>
              <span className="text-xs sm:text-sm font-semibold text-violet-600 dark:text-violet-400 leading-none">
                {sectionLabel}
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5 truncate">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle variant="inline" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0" />
          <a
            href={getSubdomainUrl(secondaryNav.url, resolvedTheme)}
            suppressHydrationWarning
            className="h-7 sm:h-8 px-2 sm:px-3 rounded-lg border border-zinc-200/90 dark:border-zinc-800 bg-white/80 hover:bg-zinc-100 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[11px] sm:text-xs font-semibold inline-flex items-center gap-1 transition-all shadow-2xs active:scale-[0.98]"
          >
            <span>{secondaryNav.label}</span>
            <ArrowUpRight className="hidden sm:inline w-3.5 h-3.5 opacity-60" />
          </a>
          <a
            href={getSubdomainUrl("https://gauravpatil.site", resolvedTheme)}
            suppressHydrationWarning
            className="h-7 sm:h-8 px-2 sm:px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-[11px] sm:text-xs font-semibold inline-flex items-center gap-1 transition-all shadow-xs active:scale-[0.98]"
          >
            <span>Portfolio</span>
            <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </a>
        </div>
      </header>

      {/* =====================================================================
          CENTERED ONE-VIEW LAUNCHPAD STAGE (Zero Scroll, Compact Proportions)
          ===================================================================== */}
      <div className="relative z-10 flex-1 min-h-0 w-full px-3.5 sm:px-6 lg:px-8 flex flex-col justify-center items-center overflow-hidden">
        <div className={`w-full ${containerMaxWidth} flex flex-col items-center`}>
          {/* Hero Title Block */}
          <div className="text-center mb-3 sm:mb-6 lg:mb-7 shrink-0 max-w-2xl px-1">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-[10.5px] font-mono uppercase tracking-[0.16em] text-zinc-600 dark:text-zinc-400 shadow-2xs mb-2.5">
              <span>{heroEyebrow}</span>
            </div>
            <h1 className="text-xl sm:text-3xl lg:text-[34px] font-black tracking-tight text-zinc-950 dark:text-white leading-[1.15]">
              {heroTitle}
            </h1>
            <p className="mt-1 sm:mt-2 text-[11px] sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2 sm:line-clamp-none">
              {heroDescription}
            </p>
          </div>

          {/* Balanced Hub Card Grid */}
          <section
            aria-label={sectionLabel}
            className={`w-full grid items-stretch ${gridClass}`}
          >
            {items.map((item) => {
              const tone = TONE_CLASSES[item.tone];
              const resolvedHref = getSubdomainUrl(item.href, resolvedTheme);
              const isCompactMobileServices = columns === 3;

              return (
                <article
                  key={item.id}
                  className={`group relative rounded-2xl border border-zinc-200/85 dark:border-zinc-800/90 ${tone.hoverBorder} bg-white/95 dark:bg-zinc-900/75 backdrop-blur-md ${
                    isCompactMobileServices
                      ? "p-3.5 sm:p-5 lg:p-6"
                      : "p-3 sm:p-4 lg:p-5"
                  } flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-xl hover:shadow-zinc-950/[0.04] dark:hover:shadow-black/50 hover:-translate-y-0.5`}
                >
                  <div>
                    {/* Top Row: Icon Chip + Clean Status / Domain Pill */}
                    <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3.5">
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${tone.iconBox}`}
                      >
                        {item.icon}
                      </div>
                      {item.status ? (
                        <StatusBadge status={item.status} />
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/80 shrink-0">
                          {item.hostLabel}
                        </span>
                      )}
                    </div>

                    {/* Card Identity */}
                    <div className="flex items-baseline justify-between gap-1.5">
                      <h2 className="text-[13.5px] sm:text-base lg:text-[17px] font-bold tracking-tight text-zinc-950 dark:text-white leading-snug truncate">
                        {item.title}
                      </h2>
                      {item.status && (
                        <span className="hidden sm:inline text-[10.5px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0">
                          {item.hostLabel}
                        </span>
                      )}
                    </div>

                    <p className={`text-[10.5px] sm:text-xs font-medium mt-0.5 truncate ${tone.subtitleText}`}>
                      {item.subtitle}
                    </p>

                    {/* Concise Parallel Description */}
                    <p
                      className={`mt-1.5 sm:mt-2.5 text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed ${
                        isCompactMobileServices
                          ? "line-clamp-2 sm:line-clamp-3 md:min-h-[3.3rem]"
                          : "line-clamp-2 sm:line-clamp-3 sm:min-h-[3.3rem]"
                      }`}
                    >
                      {item.description}
                    </p>

                    {/* Single-Row Aligned Feature Tags */}
                    <div
                      className={`${
                        isCompactMobileServices ? "hidden sm:flex" : "hidden sm:flex"
                      } flex-nowrap items-center gap-1.5 mt-3 overflow-hidden`}
                    >
                      {item.features.map((feat) => (
                        <span
                          key={feat}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-700/70 whitespace-nowrap truncate"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Authoritative Monochrome Primary Action */}
                  <div className="mt-2.5 sm:mt-4 pt-2.5 sm:pt-3.5 border-t border-zinc-200/70 dark:border-zinc-800/80">
                    <a
                      href={resolvedHref}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      suppressHydrationWarning
                      className="w-full h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-[11px] sm:text-xs font-semibold flex items-center justify-between transition-all duration-150 shadow-xs active:scale-[0.98]"
                    >
                      <span className="truncate">{item.ctaLabel}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                    <div className="hidden sm:flex items-center justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-2 px-0.5">
                      <span className="truncate">{item.fullHost}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </div>

      {/* =====================================================================
          MINIMAL SINGLE-LINE FOOTER
          ===================================================================== */}
      <footer className="relative z-20 shrink-0 w-full h-10 sm:h-11 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">Gaurav Patil</span>
          <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">&bull;</span>
          <span className="hidden sm:inline truncate">{footerLabel}</span>
        </div>

        <nav aria-label="Ecosystem Navigation" className="flex items-center gap-2.5 sm:gap-3.5 font-mono text-[10.5px] sm:text-[11px] shrink-0">
          {footerLinks.map((link, idx) => (
            <React.Fragment key={link.label}>
              {idx > 0 && <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>}
              <a
                href={getSubdomainUrl(link.url, resolvedTheme)}
                suppressHydrationWarning
                className="hover:text-zinc-950 dark:hover:text-white transition-colors"
              >
                {link.label}
              </a>
            </React.Fragment>
          ))}
        </nav>
      </footer>
    </main>
  );
}
