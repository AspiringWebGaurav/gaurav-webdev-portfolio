"use client";

import React, { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";

interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  type: string;
  shortLabel: string;
  summary: string;
  achievements: string[];
  tech: string[];
}

const experiences: ExperienceItem[] = [
  {
    id: "neosoft",
    role: "Software Engineer",
    company: "NeoSOFT",
    period: "2022 — Present",
    type: "Full-Time",
    shortLabel: "NeoSOFT",
    summary:
      "Engineering enterprise web applications, high-performance UI systems, and backend integrations with Next.js, React, and TypeScript.",
    achievements: [
      "Engineered mission-critical frontend architectures with React and Next.js, reducing bundle overhead and improving Core Web Vitals.",
      "Collaborated across multidisciplinary teams delivering scalable B2B enterprise software with robust TypeScript type systems.",
      "Implemented resilient state management, error handling, and structured telemetry.",
    ],
    tech: ["Next.js", "React", "TypeScript", "TailwindCSS", "Node.js", "REST APIs"],
  },
  {
    id: "product_eng",
    role: "Product & Systems Engineer",
    company: "Independent & Open Source",
    period: "2024 — Present",
    type: "SaaS Products",
    shortLabel: "SaaS Apps",
    summary:
      "Architected and deployed 4 production SaaS applications (Send2Me, Switchyy, DareToSend, XURL) reaching global users with 99.9% uptime.",
    achievements: [
      "Built Send2Me: Peer-to-peer WebRTC file transfer engine supporting 10GB transfers with zero cloud relay storage and native Rust/Tauri desktop apps.",
      "Engineered Switchyy: Zero-downtime maintenance and live mode toggling without redeployments or server restarts.",
      "Designed XURL: High-throughput URL shortening service featuring sub-millisecond edge redirects and real-time abuse mitigation.",
    ],
    tech: ["WebRTC", "Rust", "Tauri", "Next.js 15", "Upstash Redis", "Firestore"],
  },
  {
    id: "contractor",
    role: "Software Consultant",
    company: "Weekend Projects",
    period: "2023 — Present",
    type: "Contract",
    shortLabel: "Consulting",
    summary:
      "Delivered bespoke digital platforms, automated transactional email pipelines, and operational portals under strict NDAs and SLAs.",
    achievements: [
      "Constructed client workflow automation platforms with dual-relay transactional email failover (Brevo & Resend).",
      "Delivered production deployments for regional enterprises including Vatvruksha Engineering and Gurudatta Services.",
      "Authored custom SLA, Terms of Service, and Privacy Policy governance systems.",
    ],
    tech: ["Brevo API", "Firebase Admin", "Vercel Edge", "TailwindCSS", "PostgreSQL"],
  },
  {
    id: "masai",
    role: "Full Stack Trainee",
    company: "Masai School",
    period: "2021 — 2022",
    type: "Training",
    shortLabel: "Masai",
    summary:
      "Completed 1200+ hours of software engineering training in full-stack architecture, algorithms, and collaborative team git workflows.",
    achievements: [
      "Mastered data structures, algorithms, object-oriented design, and asynchronous event loops.",
      "Constructed end-to-end full-stack clones and collaborative sprint projects under strict agile timelines.",
    ],
    tech: ["JavaScript", "React", "Node.js", "Express", "MongoDB", "Data Structures"],
  },
];

export function ExperienceScreen() {
  const [selectedId, setSelectedId] = useState<string>("neosoft");
  const activeExp = experiences.find((e) => e.id === selectedId) || experiences[0];

  return (
    <div className="flex-1 flex flex-col h-full max-h-full w-full overflow-hidden">
      {/* ============================================================ */}
      {/* 1. DYNAMIC MOBILE SCREEN EXPERIENCE (Single-View, 0 Scroll)   */}
      {/* ============================================================ */}
      <div className="flex md:hidden flex-col justify-between h-full max-h-full overflow-hidden p-3 sm:p-4 text-black select-none bg-[#FAFAFA]">
        {/* Mobile Header */}
        <div className="shrink-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-admin-mono text-[#7C3AED] uppercase font-bold tracking-wider">
              Work History
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-admin-mono font-semibold text-emerald-800 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Immediate Joiner
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-1">
            <h2 className="text-lg font-extrabold font-admin-sans tracking-tight text-black leading-tight">
              Work Experience<span className="text-[#7C3AED]">.</span>
            </h2>
            <span className="text-[10.5px] text-gray-500 font-admin-mono">
              3+ Yrs Exp
            </span>
          </div>
        </div>

        {/* 4-Item Horizontal Role Picker */}
        <div className="grid grid-cols-4 gap-1.5 shrink-0 my-1.5">
          {experiences.map((exp) => {
            const isSelected = exp.id === selectedId;
            return (
              <button
                key={exp.id}
                type="button"
                onClick={() => setSelectedId(exp.id)}
                className={`px-1.5 py-1.5 rounded-lg text-center transition border flex flex-col items-center justify-center min-h-[44px] cursor-pointer shadow-2xs ${
                  isSelected
                    ? "bg-[#7C3AED] border-[#7C3AED] text-white font-bold ring-1 ring-[#7C3AED]"
                    : "bg-white border-[#E2E8F0] text-gray-700 hover:bg-[#F8FAFC]"
                }`}
              >
                <span className="text-[11px] font-admin-sans font-bold leading-tight truncate w-full">
                  {exp.shortLabel}
                </span>
                <span
                  className={`text-[8.5px] font-admin-mono mt-0.5 uppercase tracking-tight truncate w-full ${
                    isSelected ? "text-purple-100" : "text-gray-400"
                  }`}
                >
                  {exp.type.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Role Card (Single-View, 0 Scroll) */}
        <div className="flex-1 min-h-0 flex flex-col justify-between bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-2xs overflow-hidden my-1">
          <div>
            {/* Role Header */}
            <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold font-admin-sans text-black truncate leading-tight">
                    {activeExp.role}
                  </h3>
                  <span className="text-[9px] font-admin-mono px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200 text-[#7C3AED] font-semibold shrink-0">
                    {activeExp.type}
                  </span>
                </div>
                <p className="text-[10.5px] text-gray-500 font-admin-sans truncate mt-0.5">
                  {activeExp.company} · {activeExp.period}
                </p>
              </div>
            </div>

            {/* Summary */}
            <p className="text-[11px] text-gray-600 leading-snug line-clamp-2 mb-2">
              {activeExp.summary}
            </p>

            {/* Key Contributions */}
            <div className="space-y-1.5">
              <div className="text-[9.5px] font-admin-mono uppercase text-gray-400 font-bold tracking-wider">
                Key Contributions
              </div>
              {activeExp.achievements.slice(0, 2).map((ach, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[10.5px] text-gray-700 leading-tight">
                  <FaCheckCircle className="text-emerald-600 text-[11px] shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{ach}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack Chips */}
          <div className="pt-2 border-t border-[#E2E8F0] flex flex-wrap items-center gap-1 shrink-0">
            <span className="text-[9px] font-admin-mono text-gray-400 mr-1 uppercase font-semibold">
              Stack:
            </span>
            {activeExp.tech.slice(0, 5).map((t) => (
              <span
                key={t}
                className="text-[9.5px] font-admin-mono px-1.5 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-gray-700 font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Mobile Footer Status Pill */}
        <div className="p-2 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-between text-[10px] font-admin-mono text-gray-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-gray-700">Verified Professional Experience</span>
          </span>
          <span className="text-gray-500">Full-Stack & Systems</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. DESKTOP WORKSPACE EXPERIENCE (Full Spec, Side-by-Side)    */}
      {/* ============================================================ */}
      <div className="hidden md:flex flex-col justify-between p-6 sm:p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto text-black">
        {/* Desktop Header */}
        <div>
          <div className="text-xs font-admin-mono text-[#7C3AED] uppercase tracking-wider mb-1 font-semibold">
            Career Timeline & Engineering Leadership
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold font-admin-sans tracking-tight text-black mb-2">
            Work History & Production Impact<span className="text-[#7C3AED]">.</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Interactive role switcher highlighting key architectural contributions and production outcomes.
          </p>
        </div>

        {/* Desktop Split Container: Left list + Right spec */}
        <div className="grid grid-cols-12 gap-4 my-auto h-[60%] sm:h-[65%] min-h-0">
          {/* Left: Role Navigation Buttons */}
          <div className="col-span-5 flex flex-col gap-2 overflow-y-auto pr-1">
            {experiences.map((exp) => {
              const isSelected = exp.id === selectedId;
              return (
                <button
                  key={exp.id}
                  onClick={() => setSelectedId(exp.id)}
                  className={`p-3.5 rounded-lg text-left transition border flex flex-col justify-between shadow-2xs cursor-pointer ${
                    isSelected
                      ? "bg-[#F5F3FF] border-[#DDD6FE] text-[#7C3AED]"
                      : "bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] text-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-sm font-bold font-admin-sans ${isSelected ? "text-[#7C3AED]" : "text-black"}`}>
                      {exp.role}
                    </span>
                    <span className="text-[11px] font-admin-mono text-gray-400 shrink-0">
                      {exp.period}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{exp.company}</span>
                    <span className="text-[10px] font-admin-mono uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {exp.type}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Detailed Role Blueprint */}
          <div className="col-span-7 bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-2xs flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-3">
                <div>
                  <h3 className="text-base font-bold font-admin-sans text-black">
                    {activeExp.role}
                  </h3>
                  <div className="text-xs font-admin-mono text-[#7C3AED] font-semibold">
                    {activeExp.company} · {activeExp.period}
                  </div>
                </div>
                <span className="text-xs font-admin-mono px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-gray-600">
                  {activeExp.type}
                </span>
              </div>

              <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                {activeExp.summary}
              </p>

              <div className="space-y-2 mb-4">
                <div className="text-[11px] font-admin-mono uppercase text-gray-400 font-semibold tracking-wider">
                  Key Contributions & Outcomes
                </div>
                {activeExp.achievements.map((ach, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                    <FaCheckCircle className="text-emerald-600 text-xs shrink-0 mt-0.5" />
                    <span>{ach}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-admin-mono text-gray-400 mr-1 uppercase">Stack:</span>
              {activeExp.tech.map((t) => (
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

        {/* Footer Summary Notice */}
        <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg shadow-2xs flex items-center justify-between text-xs font-admin-mono text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-gray-700">Verified Professional Experience</span>
          </span>
          <span className="text-gray-500">NeoSOFT Full-Time &bull; Shipped SaaS Products &bull; Immediate Joiner</span>
        </div>
      </div>
    </div>
  );
}
