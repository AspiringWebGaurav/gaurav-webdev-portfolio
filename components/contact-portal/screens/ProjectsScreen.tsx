"use client";

import React, { useState } from "react";
import { FaExternalLinkAlt, FaGithub, FaCheckCircle } from "react-icons/fa";

interface ProjectItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  architectureHighlights: string[];
  tech: string[];
  liveUrl: string;
  githubUrl?: string;
  status: string;
}

const projects: ProjectItem[] = [
  {
    id: "send2me",
    title: "Sendme.alt",
    tagline: "Peer-to-Peer Large File Transfer Engine",
    description:
      "Direct browser-to-browser P2P file transfers up to 10GB with zero cloud storage, end-to-end data encryption, and desktop apps built in Rust and Tauri.",
    architectureHighlights: [
      "WebRTC DataChannel mesh eliminates cloud hosting costs and guarantees privacy.",
      "Native desktop client built in Rust & Tauri with tiny memory footprint (<35MB).",
      "Chunked binary streaming with SHA-256 integrity verification prevents corruption.",
    ],
    tech: ["WebRTC", "Rust", "Tauri", "React", "Next.js", "Firebase RTDB"],
    liveUrl: "https://send2me.eu.cc/",
    githubUrl: "https://github.com/AspiringWebGaurav/sendme.alt",
    status: "Live & Open Source",
  },
  {
    id: "switchyy",
    title: "Switchyy",
    tagline: "App State & Maintenance Mode Switcher",
    description:
      "Zero-downtime maintenance mode toggling and traffic routing for web applications without redeploying or restarting servers.",
    architectureHighlights: [
      "Instant status checks via Upstash Redis REST and Vercel Edge Middleware.",
      "Admin bypass keys & IP whitelisting let engineering teams test during maintenance.",
      "Drop-in SDK script with zero external dependencies.",
    ],
    tech: ["Next.js", "Upstash Redis", "TypeScript", "TailwindCSS", "Edge Functions"],
    liveUrl: "https://switchyy.eu.cc/",
    githubUrl: "https://github.com/AspiringWebGaurav/switchy",
    status: "Commercial SaaS",
  },
  {
    id: "daretosend",
    title: "DareToSend",
    tagline: "Anonymous Feedback Platform",
    description:
      "A privacy-first anonymous feedback platform built for transparent team communication without toxicity or abuse.",
    architectureHighlights: [
      "Zero IP logging and message hashing prevent author de-anonymization.",
      "Automated client moderation filters block abusive language before submission.",
      "Optimized Firestore data model handles high read volume efficiently.",
    ],
    tech: ["Next.js", "Firestore", "React 19", "TailwindCSS", "Turnstile"],
    liveUrl: "https://daretosend.eu.cc/",
    githubUrl: "https://github.com/AspiringWebGaurav/dare2send",
    status: "Production App",
  },
  {
    id: "xurl",
    title: "XURL",
    tagline: "Fast URL Shortener & Redirect Engine",
    description:
      "A low-latency URL shortening engine featuring fast edge redirects, QR code generation, bot detection, and click analytics.",
    architectureHighlights: [
      "Edge-cached URL resolution provides sub-millisecond redirects worldwide.",
      "Automated rate limiting and destination malware checks prevent abuse.",
      "High-speed click analytics captured asynchronously without delaying redirects.",
    ],
    tech: ["Next.js 15", "Upstash Redis", "Vercel Edge", "TypeScript", "QR Codes"],
    liveUrl: "https://xurl.eu.cc/",
    githubUrl: "https://github.com/AspiringWebGaurav/xurl",
    status: "Production Platform",
  },
];

interface ProjectsScreenProps {
  onTrackAction: (action: string, metadata?: Record<string, unknown>) => void;
}

export function ProjectsScreen({ onTrackAction }: ProjectsScreenProps) {
  const [selectedId, setSelectedId] = useState<string>("send2me");
  const activeProject = projects.find((p) => p.id === selectedId) || projects[0];

  const handleOpenLive = (url: string, title: string) => {
    onTrackAction("OPEN_PROJECT_LIVE", { project: title, url });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOpenGithub = (url: string, title: string) => {
    onTrackAction("OPEN_PROJECT_GITHUB", { project: title, url });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex-1 flex flex-col h-full max-h-full w-full overflow-hidden">
      {/* ============================================================ */}
      {/* 1. DYNAMIC MOBILE SCREEN EXPERIENCE (Single-View, 0 Scroll)   */}
      {/* ============================================================ */}
      <div className="flex md:hidden flex-col justify-between h-full max-h-full overflow-hidden p-3 sm:p-4 text-black select-none bg-[#FAFAFA]">
        {/* Mobile Header: Compact, No Buzzwords */}
        <div className="shrink-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-admin-mono text-[#7C3AED] uppercase font-bold tracking-wider">
              Shipped Software
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-[10px] font-admin-mono font-semibold text-[#7C3AED] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              4 Live SaaS
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-1">
            <h2 className="text-lg font-extrabold font-admin-sans tracking-tight text-black leading-tight">
              Production Projects<span className="text-[#7C3AED]">.</span>
            </h2>
            <span className="text-[10.5px] text-gray-500 font-admin-mono">
              99.9% Uptime
            </span>
          </div>
        </div>

        {/* Project Selector Bar: 4-Item Horizontal Segmented Picker */}
        <div className="grid grid-cols-4 gap-1.5 shrink-0 my-1.5">
          {projects.map((proj) => {
            const isSelected = proj.id === selectedId;
            return (
              <button
                key={proj.id}
                type="button"
                onClick={() => {
                  onTrackAction("VIEW_PROJECT_DETAILS", { project: proj.title });
                  setSelectedId(proj.id);
                }}
                className={`px-1.5 py-1.5 rounded-lg text-center transition border flex flex-col items-center justify-center min-h-[44px] cursor-pointer shadow-2xs ${
                  isSelected
                    ? "bg-[#7C3AED] border-[#7C3AED] text-white font-bold ring-1 ring-[#7C3AED]"
                    : "bg-white border-[#E2E8F0] text-gray-700 hover:bg-[#F8FAFC]"
                }`}
              >
                <span className="text-[11px] font-admin-sans font-bold leading-tight truncate w-full">
                  {proj.title}
                </span>
                <span
                  className={`text-[8.5px] font-admin-mono mt-0.5 uppercase tracking-tight truncate w-full ${
                    isSelected ? "text-purple-100" : "text-gray-400"
                  }`}
                >
                  {proj.status.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Project Hero Card (Single View, No Scroll) */}
        <div className="flex-1 min-h-0 flex flex-col justify-between bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-2xs overflow-hidden my-1">
          <div>
            {/* Title & Action Buttons Row */}
            <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold font-admin-sans text-black truncate leading-tight">
                    {activeProject.title}
                  </h3>
                  <span className="text-[9px] font-admin-mono px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold shrink-0">
                    {activeProject.status}
                  </span>
                </div>
                <p className="text-[10.5px] text-[#7C3AED] font-semibold font-admin-sans truncate mt-0.5">
                  {activeProject.tagline}
                </p>
              </div>

              {/* Action Buttons: Live App & GitHub */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenLive(activeProject.liveUrl, activeProject.title)}
                  className="px-2.5 py-1.5 bg-black hover:bg-neutral-800 active:scale-95 text-white rounded-md text-[11px] font-semibold transition flex items-center gap-1 shadow-2xs cursor-pointer min-h-[32px]"
                >
                  <span>Live App</span>
                  <FaExternalLinkAlt className="text-[8px]" />
                </button>

                {activeProject.githubUrl && (
                  <button
                    type="button"
                    onClick={() => handleOpenGithub(activeProject.githubUrl!, activeProject.title)}
                    className="p-1.5 rounded-md bg-[#F8FAFC] hover:bg-gray-100 active:scale-95 border border-[#E2E8F0] text-gray-700 hover:text-black transition cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                    title="Source Repository"
                  >
                    <FaGithub className="text-xs" />
                  </button>
                )}
              </div>
            </div>

            {/* Concise Description */}
            <p className="text-[11px] text-gray-600 leading-snug line-clamp-2 mb-2">
              {activeProject.description}
            </p>

            {/* Architecture Highlights */}
            <div className="space-y-1.5">
              <div className="text-[9.5px] font-admin-mono uppercase text-gray-400 font-bold tracking-wider">
                Key Highlights
              </div>
              {activeProject.architectureHighlights.slice(0, 2).map((hl, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[10.5px] text-gray-700 leading-tight">
                  <FaCheckCircle className="text-[#7C3AED] text-[11px] shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{hl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack Chips */}
          <div className="pt-2 border-t border-[#E2E8F0] flex flex-wrap items-center gap-1 shrink-0">
            <span className="text-[9px] font-admin-mono text-gray-400 mr-1 uppercase font-semibold">
              Tech:
            </span>
            {activeProject.tech.slice(0, 5).map((t) => (
              <span
                key={t}
                className="text-[9.5px] font-admin-mono px-1.5 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-gray-700 font-medium"
              >
                {t}
              </span>
            ))}
            {activeProject.tech.length > 5 && (
              <span className="text-[9px] font-admin-mono px-1 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-400">
                +{activeProject.tech.length - 5}
              </span>
            )}
          </div>
        </div>

        {/* Mobile Footer Status Pill */}
        <div className="p-2 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-between text-[10px] font-admin-mono text-gray-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-gray-700">4 Shipped Live Systems</span>
          </span>
          <span className="text-gray-500">Public GitHub Codebases</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. DESKTOP WORKSPACE EXPERIENCE (Full Spec, Side-by-Side)    */}
      {/* ============================================================ */}
      <div className="hidden md:flex flex-col justify-between p-6 sm:p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto text-black">
        {/* Desktop Header */}
        <div>
          <div className="text-xs font-admin-mono text-[#7C3AED] uppercase tracking-wider mb-1 font-semibold">
            Featured Engineering Deliverables
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold font-admin-sans tracking-tight text-black mb-2">
            Production Systems & Architecture<span className="text-[#7C3AED]">.</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Production SaaS applications engineered, deployed, and maintained with proven uptime and user adoption.
          </p>
        </div>

        {/* Desktop Split Container: Switcher + Spec */}
        <div className="grid grid-cols-12 gap-4 my-auto h-[60%] sm:h-[65%] min-h-0">
          {/* Left Column: Project Selector List */}
          <div className="col-span-5 flex flex-col gap-2 overflow-y-auto pr-1">
            {projects.map((proj) => {
              const isSelected = proj.id === selectedId;
              return (
                <button
                  key={proj.id}
                  onClick={() => {
                    onTrackAction("VIEW_PROJECT_DETAILS", { project: proj.title });
                    setSelectedId(proj.id);
                  }}
                  className={`p-3.5 rounded-lg text-left transition border flex flex-col justify-between shadow-2xs cursor-pointer ${
                    isSelected
                      ? "bg-[#F5F3FF] border-[#DDD6FE] text-[#7C3AED]"
                      : "bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] text-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-sm font-bold font-admin-sans ${isSelected ? "text-[#7C3AED]" : "text-black"}`}>
                      {proj.title}
                    </span>
                    <span className="text-[10px] font-admin-mono px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-gray-600">
                      {proj.status.split(" ")[0]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {proj.tagline}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Column: Active Project Details */}
          <div className="col-span-7 bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-2xs flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-3 gap-2">
                <div>
                  <h3 className="text-base font-bold font-admin-sans text-black">
                    {activeProject.title}
                  </h3>
                  <div className="text-xs text-gray-500 font-admin-sans mt-0.5">
                    {activeProject.tagline}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenLive(activeProject.liveUrl, activeProject.title)}
                    className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-md text-xs font-medium transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span>Live App</span>
                    <FaExternalLinkAlt className="text-[10px]" />
                  </button>

                  {activeProject.githubUrl && (
                    <button
                      onClick={() => handleOpenGithub(activeProject.githubUrl!, activeProject.title)}
                      className="p-1.5 rounded-md bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2E8F0] text-gray-600 hover:text-black transition cursor-pointer"
                      title="Source Repository"
                    >
                      <FaGithub className="text-sm" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                {activeProject.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="text-[11px] font-admin-mono uppercase text-gray-400 font-semibold tracking-wider">
                  System Highlights & Design Decisions
                </div>
                {activeProject.architectureHighlights.map((hl, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                    <FaCheckCircle className="text-[#7C3AED] text-xs shrink-0 mt-0.5" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-admin-mono text-gray-400 mr-1 uppercase">Tech:</span>
              {activeProject.tech.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-admin-mono px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-gray-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Footer */}
        <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg shadow-2xs flex items-center justify-between text-xs font-admin-mono text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-gray-700">4 Shipped Live SaaS Applications</span>
          </span>
          <span className="text-gray-500">99.9% Production Uptime &bull; Public GitHub Codebases</span>
        </div>
      </div>
    </div>
  );
}
