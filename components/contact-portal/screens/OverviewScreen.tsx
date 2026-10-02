"use client";

import React from "react";
import {
  FaPhone,
  FaComments,
  FaFileAlt,
  FaBriefcase,
  FaLayerGroup,
  FaCode,
  FaDownload,
  FaArrowRight,
  FaCompass,
} from "react-icons/fa";

interface OverviewScreenProps {
  recruiter: { name: string; company: string; email: string };
  onNavigate: (section: string) => void;
  onTrackAction: (action: string, metadata?: Record<string, unknown>) => void;
}

export function OverviewScreen({ recruiter, onNavigate, onTrackAction }: OverviewScreenProps) {
  const handleDownloadResume = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTrackAction("DOWNLOAD_RESUME");
    window.open("https://gauravpatil.site/resume.pdf", "_blank", "noopener,noreferrer");
  };

  const portalOptions = [
    {
      id: "contact",
      title: "Phone & WhatsApp",
      description: "2 direct phone numbers and instant WhatsApp chat.",
      badge: "2 Lines",
      badgeColor: "bg-purple-50 text-[#7C3AED] border-purple-200",
      icon: FaPhone,
      iconBg: "bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]",
    },
    {
      id: "chat",
      title: "Live Direct Chat",
      description: "Message directly here. Sends an instant email notification to Gaurav.",
      badge: "Direct Channel",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: FaComments,
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      id: "resume",
      title: "Resume / CV",
      description: "Read resume details online or download the PDF in 1 click.",
      badge: "PDF Available",
      badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
      icon: FaFileAlt,
      iconBg: "bg-blue-50 text-blue-600 border-blue-200",
      hasDownload: true,
    },
    {
      id: "experience",
      title: "Work Experience",
      description: "Previous roles, responsibilities, and engineering projects.",
      badge: "Work History",
      badgeColor: "bg-gray-100 text-gray-700 border-gray-200",
      icon: FaBriefcase,
      iconBg: "bg-gray-50 text-gray-700 border-gray-200",
    },
    {
      id: "projects",
      title: "Shipped Projects",
      description: "4 live production SaaS apps (Send2Me, Switchyy, DareToSend, XURL).",
      badge: "4 Live SaaS",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      icon: FaLayerGroup,
      iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200",
    },
    {
      id: "skills",
      title: "Technical Skills",
      description: "Next.js 15, TypeScript, Rust, WebRTC, Firebase, Redis, Tailwind.",
      badge: "Core Stack",
      badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
      icon: FaCode,
      iconBg: "bg-teal-50 text-teal-600 border-teal-200",
    },
  ];

  const mobileSecondaryOptions = [
    {
      id: "resume",
      title: "Resume / CV",
      subtitle: "PDF Available",
      icon: FaFileAlt,
      iconBg: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      id: "experience",
      title: "Experience",
      subtitle: "Work History",
      icon: FaBriefcase,
      iconBg: "bg-gray-50 text-gray-700 border-gray-200",
    },
    {
      id: "projects",
      title: "Projects",
      subtitle: "4 Live SaaS",
      icon: FaLayerGroup,
      iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200",
    },
    {
      id: "skills",
      title: "Skills",
      subtitle: "Core Stack",
      icon: FaCode,
      iconBg: "bg-teal-50 text-teal-600 border-teal-200",
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full max-h-full w-full overflow-hidden">
      {/* ============================================================ */}
      {/* 1. DYNAMIC MOBILE SCREEN EXPERIENCE (Single-View, 0 Scroll)   */}
      {/* ============================================================ */}
      <div className="flex md:hidden flex-col justify-between h-full max-h-full overflow-hidden p-3.5 text-black select-none">
        {/* Mobile Header: Compact Profile Summary */}
        <div className="shrink-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-admin-mono text-gray-500 truncate">
              Profile for <strong className="text-black font-semibold">{recruiter.company}</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-admin-mono font-semibold text-emerald-800 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Immediate Joiner
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-1">
            <h1 className="text-xl font-extrabold font-admin-sans tracking-tight text-black leading-tight">
              Gaurav Patil<span className="text-[#7C3AED]">.</span>
            </h1>
            <span className="text-xs text-gray-500 font-admin-sans font-medium">
              Full-Stack &amp; Systems
            </span>
          </div>
        </div>

        {/* Primary Priority Actions: 2 Main Touch Buttons (Phone + Chat) */}
        <div className="grid grid-cols-2 gap-2 my-auto py-1">
          <button
            type="button"
            onClick={() => {
              onTrackAction("OVERVIEW_NAVIGATE", { section: "contact" });
              onNavigate("contact");
            }}
            className="p-3 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex flex-col justify-between shadow-2xs transition active:scale-98 text-left cursor-pointer min-h-[72px]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-xs">
                <FaPhone className="text-[10px]" />
              </div>
              <span className="text-[9px] font-admin-mono px-1.5 py-0.2 rounded bg-white/20 font-semibold uppercase">
                2 Lines
              </span>
            </div>
            <div>
              <div className="text-xs font-bold font-admin-sans leading-tight">
                Phone &amp; WhatsApp
              </div>
              <div className="text-[9.5px] opacity-80 font-admin-mono">
                Direct calling &amp; chat &rarr;
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onTrackAction("OVERVIEW_NAVIGATE", { section: "chat" });
              onNavigate("chat");
            }}
            className="p-3 rounded-lg bg-[#090D16] hover:bg-neutral-800 text-white flex flex-col justify-between shadow-2xs transition active:scale-98 text-left cursor-pointer min-h-[72px]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                <FaComments className="text-[10px]" />
              </div>
              <span className="text-[9px] font-admin-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
                Live Alert
              </span>
            </div>
            <div>
              <div className="text-xs font-bold font-admin-sans leading-tight">
                Direct Live Chat
              </div>
              <div className="text-[9.5px] text-gray-300 font-admin-mono">
                Instant email notification &rarr;
              </div>
            </div>
          </button>
        </div>

        {/* Secondary Navigation: 4 Compact Tiles (2x2 Grid) */}
        <div className="grid grid-cols-2 gap-2 my-auto py-1">
          {mobileSecondaryOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <div
                key={opt.id}
                onClick={() => {
                  onTrackAction("OVERVIEW_NAVIGATE", { section: opt.id });
                  onNavigate(opt.id);
                }}
                className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] active:bg-[#F8FAFC] flex items-center justify-between gap-1.5 shadow-2xs transition cursor-pointer min-h-[52px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-md border flex items-center justify-center text-xs shrink-0 ${opt.iconBg}`}>
                    <Icon className="text-[11px]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11.5px] font-bold text-gray-900 truncate font-admin-sans leading-tight">
                      {opt.title}
                    </div>
                    <div className="text-[9.5px] text-gray-500 font-admin-mono truncate">
                      {opt.subtitle}
                    </div>
                  </div>
                </div>
                <FaArrowRight className="text-[9px] text-[#7C3AED] shrink-0" />
              </div>
            );
          })}
        </div>

        {/* Mobile Footer Status & Quick 1-Click PDF */}
        <div className="shrink-0 pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2 text-[10.5px] font-admin-mono">
          <span className="text-gray-500 truncate">
            Remote &bull; Relocation
          </span>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate("philosophy")}
              className="text-[#7C3AED] hover:underline"
            >
              Philosophy &rarr;
            </button>
            <button
              type="button"
              onClick={handleDownloadResume}
              className="px-2 py-1 bg-white hover:bg-gray-50 border border-[#CBD5E1] text-gray-800 rounded font-medium flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <FaDownload className="text-[9px] text-gray-500" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. DESKTOP / TABLET SCREEN EXPERIENCE (Single-View, 0 Scroll) */}
      {/* ============================================================ */}
      <div className="hidden md:flex flex-col justify-between p-4 sm:p-5 lg:p-6 max-w-5xl mx-auto w-full h-full max-h-full overflow-hidden text-black select-none">
        {/* Desktop Header */}
        <div className="shrink-0">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-admin-mono text-gray-500">
              <span>Candidate profile for</span>
              <span className="font-semibold text-black">{recruiter.company}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-admin-mono font-semibold text-emerald-800 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Available to Hire · Immediate</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-admin-sans tracking-tight text-black">
                Gaurav Patil<span className="text-[#7C3AED]">.</span>{" "}
                <span className="text-gray-400 font-normal text-base sm:text-xl">
                  Full-Stack &amp; Systems Engineer
                </span>
              </h1>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
                Explore contact options, direct chat, resume, work history, and projects below.
              </p>
            </div>
          </div>
        </div>

        {/* Unified 6-Card Recruiter Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 my-auto py-2">
          {portalOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <div
                key={opt.id}
                onClick={() => {
                  onTrackAction("OVERVIEW_NAVIGATE", { section: opt.id });
                  onNavigate(opt.id);
                }}
                className="group p-3.5 sm:p-4 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-xs transition-all duration-150 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-md border flex items-center justify-center text-xs ${opt.iconBg}`}>
                      <Icon />
                    </div>
                    <span className={`text-[10px] font-admin-mono font-semibold px-2 py-0.5 rounded border ${opt.badgeColor}`}>
                      {opt.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-[#7C3AED] transition-colors font-admin-sans">
                    {opt.title}
                  </h3>
                  <p className="text-[11.5px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {opt.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] font-admin-mono">
                  <span className="text-[#7C3AED] font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Open</span>
                    <FaArrowRight className="text-[9px]" />
                  </span>

                  {opt.hasDownload && (
                    <button
                      type="button"
                      onClick={handleDownloadResume}
                      className="text-gray-500 hover:text-black flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-gray-100 transition"
                      title="Direct Download PDF"
                    >
                      <FaDownload className="text-[9px]" />
                      <span>PDF</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Subtle Bottom Status Bar */}
        <div className="shrink-0 p-3 sm:p-3.5 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-admin-mono">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-gray-500">Notice Period:</span>
            <span className="font-semibold text-black">Immediate Joiner</span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500">Location:</span>
            <span className="font-semibold text-black">Remote / Relocation</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("philosophy")}
              className="text-gray-500 hover:text-[#7C3AED] transition flex items-center gap-1 cursor-pointer"
            >
              <FaCompass className="text-[10px]" />
              <span>Engineering Philosophy &rarr;</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadResume}
              className="px-2.5 py-1 bg-[#F8FAFC] hover:bg-gray-100 border border-[#CBD5E1] text-gray-800 rounded font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <FaDownload className="text-[10px] text-gray-500" />
              <span>Download Resume PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
