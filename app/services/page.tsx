"use client";

import React from "react";
import {
  FileText,
  MessageSquare,
  Users,
  ExternalLink,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Spotlight } from "@/components/ui/Spotlight";
import { LaunchpadHaptics } from "@/components/self/LaunchpadHaptics";
import { useTheme } from "@/lib/theme";
import { getSubdomainUrl } from "@/lib/theme/navigation";

interface ServiceItem {
  id: string;
  name: string;
  subdomain: string;
  subdomainUrl: string;
  category: string;
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
  features: string[];
  icon: React.ReactNode;
}

const SERVICES_LIST: ServiceItem[] = [
  {
    id: "resume",
    name: "Interactive Resume",
    subdomain: "resume.services.gauravpatil.site",
    subdomainUrl: "https://resume.services.gauravpatil.site",
    category: "Verified Candidate Profile",
    tagline: "Live Systems Track Record & ATS Credentials",
    description:
      "Interactive candidate profile. Deep-dive into technical competencies, enterprise impact at NeoSOFT, and 1-click verified ATS resume download.",
    accent: {
      strip: "from-blue-500 to-cyan-400",
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      iconBorder: "border-blue-500/20 dark:border-blue-500/30",
      badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-slate-200/90 dark:border-white/10 hover:border-blue-500/50",
      btn: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20",
    },
    features: ["Interactive Timeline", "ATS-Friendly Export", "Skill Matrix"],
    icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    id: "talk",
    name: "Talk Command Hub",
    subdomain: "talk.services.gauravpatil.site",
    subdomainUrl: "https://talk.services.gauravpatil.site",
    category: "Secure Communication & Vault",
    tagline: "2FA Encrypted Messaging & Vault Files",
    description:
      "Private real-time communication platform. Protected by cryptographic HMAC-SHA256 OTP authentication, persistent notepad, and encrypted file vault.",
    accent: {
      strip: "from-indigo-500 to-purple-500",
      iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      iconBorder: "border-indigo-500/20 dark:border-indigo-500/30",
      badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
      text: "text-indigo-600 dark:text-indigo-400",
      border: "border-slate-200/90 dark:border-white/10 hover:border-indigo-500/50",
      btn: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20",
    },
    features: ["2FA OTP Gateway", "Private Notepad", "Encrypted Vault"],
    icon: <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    id: "contact",
    name: "Recruiter Portal",
    subdomain: "contact.services.gauravpatil.site",
    subdomainUrl: "https://contact.services.gauravpatil.site",
    category: "Direct Talent Acquisition",
    tagline: "Priority Hiring Line & Scheduling Gateway",
    description:
      "Direct verified gateway for hiring managers and technical recruiters. Instant interview scheduling, candidate inquiries, and guaranteed response SLA.",
    accent: {
      strip: "from-cyan-500 to-teal-400",
      iconBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
      iconBorder: "border-cyan-500/20 dark:border-cyan-500/30",
      badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30",
      text: "text-cyan-600 dark:text-cyan-400",
      border: "border-slate-200/90 dark:border-white/10 hover:border-cyan-500/50",
      btn: "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20",
    },
    features: ["Verified SLA", "Direct Line", "Calendar Scheduling"],
    icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
];

export default function ServicesHubPage() {
  const { resolvedTheme } = useTheme();

  const resolveServiceUrl = (_id: string, defaultUrl: string) => {
    return getSubdomainUrl(defaultUrl, resolvedTheme);
  };

  const resolveHubUrl = (_path: string, prodUrl: string) => {
    return getSubdomainUrl(prodUrl, resolvedTheme);
  };

  return (
    <main
      data-portal="services-hub"
      className="relative w-full h-[100dvh] max-h-dvh flex flex-col justify-between overflow-hidden select-none bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-zinc-100 transition-colors duration-200"
    >
      <LaunchpadHaptics />

      {/* Spotlight ambient glow in dark mode */}
      <div className="pointer-events-none select-none hidden dark:block">
        <Spotlight
          className="-top-28 right-1/3 h-[90vh] w-[70vw]"
          fill="#a855f7"
        />
      </div>

      {/* =======================================================================
          EDGE-TO-EDGE NAVBAR
          ======================================================================= */}
      <header className="shrink-0 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 z-20">
        <div className="w-full flex items-center justify-between">
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
                  Gaurav Patil <span className="text-indigo-600 dark:text-indigo-400 font-normal">/ Services</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Edge Verified
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight hidden sm:block mt-0.5">
                Authoritative Candidate, Communication & Recruiter Portals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <ThemeToggle variant="inline" className="w-8 h-8 rounded-lg shrink-0" />
            <a
              href={resolveHubUrl("/apps", "https://apps.gauravpatil.site")}
              suppressHydrationWarning
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-white/10 transition-all inline-flex items-center gap-1.5 shadow-2xs"
            >
              <span>Apps Hub</span>
              <span className="text-[10px] text-slate-400">↗</span>
            </a>
            <a
              href={resolveHubUrl("/", "https://gauravpatil.site")}
              suppressHydrationWarning
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-1 active:scale-95"
            >
              <span>Portfolio</span>
              <span className="text-[10px]">↗</span>
            </a>
          </div>
        </div>
      </header>

      {/* =======================================================================
          MIDDLE SERVICES GRID (3 Bento Cards)
          ======================================================================= */}
      <div className="flex-1 min-h-0 w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-3 sm:py-5 flex flex-col justify-center items-center z-10">
        <div className="w-full max-w-6xl h-full flex flex-col justify-center">
          <section
            aria-label="Services Portals"
            className="w-full grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 h-full max-h-[calc(100dvh-130px)]"
          >
            {SERVICES_LIST.map((srv) => (
              <div
                key={srv.id}
                className={`group relative rounded-2xl border ${srv.accent.border} bg-white/90 dark:bg-slate-900/60 backdrop-blur-md p-4 sm:p-5 lg:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/5 shadow-2xs overflow-hidden`}
              >
                <div
                  className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${srv.accent.strip} opacity-80 group-hover:opacity-100 transition-opacity`}
                />

                <div className="flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${srv.accent.iconBg} border ${srv.accent.iconBorder} shadow-2xs group-hover:scale-105 transition-transform duration-300`}>
                      {srv.icon}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${srv.accent.badge}`}>
                      {srv.id}.services
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    {srv.name}
                  </h2>
                  <div className={`text-xs font-semibold ${srv.accent.text} mt-0.5`}>
                    {srv.category}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2.5 line-clamp-3">
                    {srv.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    {srv.features.map((feat) => (
                      <span
                        key={feat}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/10">
                  <a
                    href={resolveServiceUrl(srv.id, srv.subdomainUrl)}
                    suppressHydrationWarning
                    className={`w-full py-2.5 px-3.5 rounded-xl ${srv.accent.btn} font-semibold text-xs flex items-center justify-between transition-all duration-200 active:scale-[0.98] shadow-xs`}
                  >
                    <span>Launch {srv.name}</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
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
        <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Gaurav Patil</span>
            <span>·</span>
            <span>Services & Portals Hub</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
            <span className="hidden sm:inline text-slate-400 dark:text-slate-500">100dvh Zero-Scroll Workspace</span>
          </div>

          <nav aria-label="Ecosystem Navigation" className="flex items-center gap-4">
            <a href={resolveHubUrl("/apps", "https://apps.gauravpatil.site")} suppressHydrationWarning className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              apps.gauravpatil.site
            </a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <a href={resolveHubUrl("/", "https://gauravpatil.site")} suppressHydrationWarning className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              gauravpatil.site
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
