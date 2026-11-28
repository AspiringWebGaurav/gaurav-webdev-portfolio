"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface Section {
  id: string;
  title: string;
}

interface CpLegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
  badge?: string;
  summary?: string;
  sections?: Section[];
}

const NAV_LINKS = [
  { label: "How to Use", href: "/how-to-use" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "AOU", href: "/aou" },
];

export default function CpLegalLayout({
  title,
  lastUpdated,
  children,
}: CpLegalLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleHashFocus = useCallback(() => {
    const hash = window.location.hash?.slice(1);
    if (!hash) return;
    const target = document.getElementById(hash);
    if (!target) return;

    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(handleHashFocus, 100);
    window.addEventListener("hashchange", handleHashFocus);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", handleHashFocus);
    };
  }, [handleHashFocus, pathname]);

  return (
    <div
      data-portal="cp"
      className="min-h-screen bg-white dark:bg-[#0c0d0f] text-zinc-900 dark:text-zinc-100 font-sans antialiased selection:bg-emerald-500/20"
    >
      {/* Minimal Sticky Top Nav */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#0c0d0f]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/"
              prefetch={false}
              className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white shrink-0"
            >
              CP Engine
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">|</span>
            <Link
              href="/"
              prefetch={false}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to App</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-1 text-[13px]">
              {NAV_LINKS.map((item) => {
                const active =
                  pathname === item.href || pathname === `/cp${item.href}`;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className={`px-2.5 py-1.5 rounded-md transition-colors ${
                      active
                        ? "font-medium text-zinc-950 dark:text-white"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />
            <ThemeToggle variant="inline" className="w-8 h-8" />

            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0d0f] px-6 py-3 flex flex-wrap gap-3 text-xs">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white py-1"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main Centered Article Container */}
      <main className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        <header className="mb-10 sm:mb-12">
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 font-sans mb-3">
            Published: {lastUpdated}
          </p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-zinc-950 dark:text-zinc-50 leading-[1.15]">
            {title}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 font-sans">
            Effective: {lastUpdated}
          </p>
        </header>

        {/* Article Body */}
        <div className="space-y-8 text-[15px] sm:text-[16px] leading-[1.75] text-zinc-800 dark:text-zinc-200 font-sans">
          {children}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="mt-20 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#0c0d0f]">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-sans">
          <span>CP Engine • Fast Windows File Copy Accelerator</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/how-to-use" prefetch={false} className="hover:text-zinc-900 dark:hover:text-white">
              How to Use
            </Link>
            <Link href="/terms" prefetch={false} className="hover:text-zinc-900 dark:hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" prefetch={false} className="hover:text-zinc-900 dark:hover:text-white">
              Privacy
            </Link>
            <Link href="/aou" prefetch={false} className="hover:text-zinc-900 dark:hover:text-white">
              AOU
            </Link>
            <a
              href="https://github.com/AspiringWebGaurav/cp"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              GitHub
            </a>
            <a
              href="mailto:hello@gauravpatil.site"
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              hello@gauravpatil.site
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
