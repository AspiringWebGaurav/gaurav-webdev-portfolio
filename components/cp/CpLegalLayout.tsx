"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  FileText,
  BookOpen,
  ArrowLeft,
  Download,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  Scale,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface Section {
  id: string;
  title: string;
}

interface CpLegalLayoutProps {
  title: string;
  badge: string;
  lastUpdated: string;
  summary: string;
  sections: Section[];
  children: React.ReactNode;
}

export default function CpLegalLayout({
  title,
  badge,
  lastUpdated,
  summary,
  sections,
  children,
}: CpLegalLayoutProps) {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string>(
    sections[0]?.id || ""
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-portal", "cp");
    }

    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const navItems = [
    {
      label: "Terms of Service",
      href: "/terms",
      icon: Scale,
      active: pathname.includes("/terms"),
    },
    {
      label: "Privacy Policy",
      href: "/privacy",
      icon: ShieldCheck,
      active: pathname.includes("/privacy"),
    },
    {
      label: "How to Use & Manual",
      href: "/how-to-use",
      icon: BookOpen,
      active: pathname.includes("/how-to-use"),
    },
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(id);
      setMobileMenuOpen(false);
    }
  };

  return (
    <div
      data-portal="cp"
      className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-300 selection:bg-emerald-500/20 selection:text-emerald-800 dark:selection:text-emerald-300"
    >
      {/* Background Dot Matrix */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden select-none -z-10"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[#fafafa] dark:bg-[#09090b] transition-colors duration-300" />
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1.25px,transparent_1.25px)] dark:bg-[radial-gradient(#059669_1.25px,transparent_1.25px)] [background-size:24px_24px] opacity-20 dark:opacity-15 [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]" />
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left Brand */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="group flex items-center gap-2.5 focus:outline-none"
              title="Return to CP Engine Homepage"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md group-hover:scale-105 transition-transform">
                CP
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  CP Engine
                </span>
                <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
                  Docs &amp; Governance
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/50 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>v0.0.1 Foundation &bull; Dynamic Updates</span>
            </div>
          </div>

          {/* Navigation Links for Desktop */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-zinc-100/80 dark:bg-zinc-900/80 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 text-xs font-semibold">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    item.active
                      ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle variant="inline" className="w-8 h-8 shrink-0" />

            <Link
              href="/#download"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-xs transition-transform active:scale-95"
              title="Launch & Maintenance in Progress"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="hidden sm:inline">Launch &amp; Maintenance</span>
              <span className="sm:hidden">Maintenance</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md p-4 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
              Legal &amp; Operational Documentation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    item.active
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Document Header Hero */}
        <div className="mb-10 pb-8 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Link
              href="/"
              className="inline-flex items-center gap-1 hover:underline text-zinc-500 dark:text-zinc-400"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to CP Home</span>
            </Link>
            <span>/</span>
            <span>Enterprise Documentation</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-bold">
              {badge}
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              Last Verified: {lastUpdated}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight mb-4">
            {title}
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
            {summary}
          </p>
        </div>

        {/* Content Layout with Sticky Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Table of Contents */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-4 sm:p-5 shadow-xs">
              <div className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400 mb-3 flex items-center justify-between">
                <span>Table of Contents</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                  {sections.length} Clauses
                </span>
              </div>

              <nav className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 text-xs">
                {sections.map((s, idx) => {
                  const isActive = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => scrollTo(s.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all flex items-start gap-2 cursor-pointer ${
                        isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold border-l-2 border-emerald-500"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 font-medium"
                      }`}
                    >
                      <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="leading-snug">{s.title}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-5 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dynamic OTA Synchronized</span>
                </div>
                <p className="leading-snug">
                  Terms and operational boundaries adapt to live edge-delivered patches under cryptographic verification.
                </p>
              </div>
            </div>
          </aside>

          {/* Right Document Body */}
          <main className="lg:col-span-8 xl:col-span-9 prose-zinc max-w-none">
            <div className="space-y-12 text-zinc-800 dark:text-zinc-200 leading-relaxed">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Enterprise Full-Width Footer */}
      <footer className="mt-20 border-t border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                  CP
                </div>
                <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                  CP Engine
                </span>
              </div>
              <p className="text-zinc-500 leading-snug">
                Native Win32 Explorer file transfer accelerator. Intercepts standard clipboard paste operations with unbuffered 4MB IOCP kernel streaming.
              </p>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                Release v0.0.1 (Base Foundation)
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-2">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono text-[11px]">
                Governance &amp; Legal
              </div>
              <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Terms of Service (v0.0.1)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Privacy Policy &amp; Zero-Telemetry
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/Gaurav-Patil-07/cp/blob/master/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <span>MIT Open Source License</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-2">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono text-[11px]">
                Systems &amp; Architecture
              </div>
              <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>
                  <Link
                    href="/how-to-use"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Operational Manual &amp; Quickstart
                  </Link>
                </li>
                <li>
                  <Link
                    href="/how-to-use#dynamic-ota"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    Dynamic OTA Architecture
                  </Link>
                </li>
                <li>
                  <Link
                    href="/how-to-use#iocp-streaming"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    4MB IOCP Kernel Workers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/how-to-use#checksum"
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    SHA-256 Verification Guide
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="space-y-2">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono text-[11px]">
                Infrastructure &amp; Distribution
              </div>
              <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>
                  <a
                    href="https://gauravpatil.site"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <span>Author Portfolio (Gaurav Patil)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://gphost.eu.cc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <span>GPHost Global CDN (R2 Edge)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Gaurav-Patil-07/cp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <span>GitHub Codebase</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div>
              &copy; {new Date().getFullYear()} CP Engine &bull; Developed by{" "}
              <a
                href="https://gauravpatil.site"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                Gaurav Patil
              </a>
              . Released under MIT License.
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span>Base Binary SHA-256 Verified</span>
              <span>&bull;</span>
              <span>Cloudflare R2 Edge Hosted</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

