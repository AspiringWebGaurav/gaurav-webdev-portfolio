"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Download,
  ShieldCheck,
  Scale,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Clock,
  Layers,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface Section {
  id: string;
  title: string;
}

interface DownexLegalLayoutProps {
  title: string;
  badge: string;
  lastUpdated: string;
  summary: string;
  sections: Section[];
  children: React.ReactNode;
}

export default function DownexLegalLayout({
  title,
  badge,
  lastUpdated,
  summary,
  sections,
  children,
}: DownexLegalLayoutProps) {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string>(
    sections[0]?.id || ""
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-portal", "download");
    }

    // Hash anchor scroll on page load
    if (typeof window !== "undefined" && window.location.hash) {
      const hashId = window.location.hash.replace("#", "");
      if (hashId) {
        setTimeout(() => {
          scrollTo(hashId);
        }, 150);
      }
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
      label: "How Queues Work",
      href: "/how-queues-work",
      icon: Layers,
      active: pathname.includes("/how-queues-work") || pathname.includes("/queues"),
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
      try {
        window.history.replaceState(null, "", `#${id}`);
      } catch {}
    }
  };

  return (
    <div
      data-portal="download"
      className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-300 selection:bg-emerald-500/20 selection:text-emerald-800 dark:selection:text-emerald-300"
    >
      {/* Background Subtle Gradient & Grid */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden select-none -z-10"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[#fafafa] dark:bg-[#09090b] transition-colors duration-300" />
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1.25px,transparent_1.25px)] dark:bg-[radial-gradient(#059669_1.25px,transparent_1.25px)] [background-size:24px_24px] opacity-20 dark:opacity-15 [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]" />
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 h-16 flex items-center justify-between gap-4">
          {/* Left Brand */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="group flex items-center gap-2.5 focus:outline-none"
              title="Return to Downex Homepage"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
                <Download className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  downex
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tracking-wider uppercase font-bold">
                  Guides &amp; Legal
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-block h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </Link>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-1 text-xs">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    item.active
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />

            <ThemeToggle variant="inline" className="w-9 h-9" />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 space-y-2">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Navigation
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  item.active
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono mb-2">
                Table of Contents
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollTo(sec.id)}
                    className="w-full text-left px-2 py-1.5 rounded text-xs text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 truncate"
                  >
                    {sec.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title Hero */}
        <div className="mb-10 sm:mb-14 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold tracking-tight mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span dangerouslySetInnerHTML={{ __html: badge }} />
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
            {title}
          </h1>

          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Effective &amp; Last Updated: {lastUpdated}</span>
            <span>&bull;</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Official Verified Policy
            </span>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            <div className="font-bold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Summary for Users &amp; Developers</span>
            </div>
            {summary}
          </div>
        </div>

        {/* Two-Column Grid: TOC + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Desktop Left Sidebar: Sticky Table of Contents */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24 space-y-4">
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono mb-3">
                  Table of Contents
                </div>
                <nav className="space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
                  {sections.map((sec) => {
                    const isActive = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => scrollTo(sec.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between group cursor-pointer ${
                          isActive
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        }`}
                      >
                        <span className="truncate">{sec.title}</span>
                        {isActive && (
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Direct Jump to Sister Policy */}
              <div className="p-4 rounded-xl bg-zinc-100/60 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 text-xs space-y-2">
                <div className="font-bold text-zinc-800 dark:text-zinc-200">
                  Related Governance
                </div>
                {navItems
                  .filter((item) => !item.active)
                  .map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1"
                    >
                      <span>{item.label}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ))}
              </div>
            </div>
          </aside>

          {/* Right Main Legal Content */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-12">
            {children}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-12">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8">
            <div className="space-y-2">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono text-[11px]">
                Downex Download Manager
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Independent High-Performance Windows Download Accelerator. Multi-connection segmented downloads, clipboard auto-capture, and silent background updates.
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono text-[11px]">
                Guides &amp; Compliance
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <li>
                  <Link href="/terms" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Terms of Service &amp; EULA
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Privacy Policy &amp; Zero-Telemetry
                  </Link>
                </li>
                <li>
                  <Link href="/how-queues-work" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    How 1-by-1 Queue Works
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono text-[11px]">
                Author &amp; Infrastructure
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <li>
                  <a
                    href="https://gauravpatil.site"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <span>Gaurav Patil (Portfolio)</span>
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
                    <span>GPHost Global CDN</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div>
              &copy; {new Date().getFullYear()} Downex &bull; Developed by{" "}
              <a
                href="https://gauravpatil.site"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                Gaurav Patil
              </a>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span>Base Binary v0.0.1 Verified</span>
              <span>&bull;</span>
              <span>Cloudflare R2 Edge Hosted</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
