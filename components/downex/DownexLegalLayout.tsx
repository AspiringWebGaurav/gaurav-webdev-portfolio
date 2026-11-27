"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface Section {
  id: string;
  title: string;
}

interface DownexLegalLayoutProps {
  title: string;
  badge?: string;
  lastUpdated: string;
  summary?: string;
  sections?: Section[];
  children: React.ReactNode;
}

export default function DownexLegalLayout({
  title,
  lastUpdated,
  children,
}: DownexLegalLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-portal", "download");
    }

    const handleHashFocus = () => {
      if (typeof window === "undefined" || !window.location.hash) return;
      const rawHash = window.location.hash.replace("#", "");
      if (!rawHash) return;

      const target = document.getElementById(rawHash);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          if (target instanceof HTMLElement) {
            target.focus({ preventScroll: true });
          }
        }, 120);
      }
    };

    handleHashFocus();
    window.addEventListener("hashchange", handleHashFocus);
    return () => window.removeEventListener("hashchange", handleHashFocus);
  }, []);

  const navItems = [
    {
      label: "vs IDM",
      href: "/idm-alternative",
      active: pathname.includes("/idm-alternative"),
    },
    {
      label: "1-by-1 Queue",
      href: "/how-queues-work",
      active: pathname.includes("/how-queues-work") || pathname.includes("/queues"),
    },
    {
      label: "Extension",
      href: "/browser-extension",
      active: pathname.includes("/browser-extension"),
    },
    {
      label: "FAQ",
      href: "/faq",
      active: pathname.includes("/faq"),
    },
    {
      label: "Terms",
      href: "/terms",
      active: pathname.includes("/terms"),
    },
    {
      label: "Policies",
      href: "/privacy",
      active: pathname.includes("/privacy") || pathname.includes("/policies"),
    },
  ];

  return (
    <div
      data-portal="download"
      className="min-h-screen bg-white dark:bg-[#0c0d0f] text-zinc-900 dark:text-zinc-100 font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-800 dark:selection:text-emerald-300"
    >
      {/* Minimal OpenAI-style Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#0c0d0f]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 h-14 flex items-center justify-between gap-4">
          {/* Left Brand */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-extrabold text-[15px] tracking-tight text-zinc-950 dark:text-zinc-50 hover:opacity-80 transition-opacity"
            >
              downex
            </Link>

            <span className="hidden sm:inline-block h-3.5 w-px bg-zinc-200 dark:bg-zinc-800" />

            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to App</span>
            </Link>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="hidden md:flex items-center gap-1 text-[13px]">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-xs transition-colors ${
                    item.active
                      ? "text-zinc-950 dark:text-zinc-50 font-semibold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />

            <ThemeToggle variant="inline" className="w-8 h-8" />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0d0f] px-6 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-2 py-1.5 text-sm ${
                  item.active
                    ? "font-semibold text-zinc-950 dark:text-zinc-50"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-2 py-1.5 text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-900"
            >
              &larr; Back to App
            </Link>
          </div>
        )}
      </header>

      {/* Main Centered Reading Column (Exact OpenAI proportions) */}
      <main className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        {/* Document Header */}
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

        {/* Legal Body Content */}
        <div className="space-y-8 text-[15px] sm:text-[16px] leading-[1.75] text-zinc-800 dark:text-zinc-200 font-sans">
          {children}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="mt-20 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#0c0d0f]">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-sans">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Downex</span>
            <span>&bull;</span>
            <span>Independent High-Speed Download Acceleration</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <Link href="/idm-alternative" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Free IDM Alternative
            </Link>
            <Link href="/open-source-download-manager" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Open Source
            </Link>
            <Link href="/faq" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              FAQ
            </Link>
            <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" suppressHydrationWarning>
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" suppressHydrationWarning>
              Policies
            </Link>
            <a
              href="mailto:hello@gauravpatil.site"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
