"use client";

import React, { useState } from "react";
import { FaCode, FaServer, FaCogs, FaLock } from "react-icons/fa";

interface SkillCategory {
  id: string;
  name: string;
  shortName: string;
  icon: React.ReactNode;
  description: string;
  skills: { name: string; level: string; detail: string }[];
}

const skillCategories: SkillCategory[] = [
  {
    id: "frontend",
    name: "Frontend & Architecture",
    shortName: "Frontend",
    icon: <FaCode className="text-[#7C3AED]" />,
    description: "Production web applications, component architecture, and modern rendering engines.",
    skills: [
      { name: "Next.js 15 App Router", level: "Expert", detail: "Server Components, Route Handlers, Edge Middleware" },
      { name: "React 19 & TypeScript", level: "Expert", detail: "Strict type safety, custom hooks, atomic components" },
      { name: "TailwindCSS & CSS3", level: "Expert", detail: "Responsive design, 100dvh zero-scroll UX, accessibility" },
      { name: "Performance Optimization", level: "Advanced", detail: "Sub-100ms LCP, zero layout shifts, dynamic code splitting" },
    ],
  },
  {
    id: "systems",
    name: "Systems, Rust & Native",
    shortName: "Systems",
    icon: <FaCogs className="text-indigo-600" />,
    description: "Low-level system architecture, native desktop frameworks, and peer-to-peer data channels.",
    skills: [
      { name: "Rust & Tauri", level: "Advanced", detail: "Native cross-platform desktop shells (Windows, macOS, Linux)" },
      { name: "WebRTC Data Channels", level: "Advanced", detail: "P2P direct browser-to-browser socketless file transfers" },
      { name: "Binary & Chunk Streaming", level: "Advanced", detail: "Large payload chunking, SHA-256 integrity verification" },
      { name: "Node.js & Express", level: "Expert", detail: "Asynchronous I/O pipelines, custom microservices" },
    ],
  },
  {
    id: "backend",
    name: "Data & Distributed Cache",
    shortName: "Data/Cache",
    icon: <FaServer className="text-emerald-600" />,
    description: "Resilient data access layers, NoSQL stores, and distributed transient caching.",
    skills: [
      { name: "Google Cloud Firestore", level: "Expert", detail: "Document modeling, transactional reads/writes, DAL patterns" },
      { name: "Upstash Redis (REST)", level: "Advanced", detail: "Sliding-window rate limiting, pipeline execution, caching" },
      { name: "Firebase RTDB", level: "Advanced", detail: "Atomic monotonic counters, realtime invalidation signals" },
      { name: "PostgreSQL & SQL", level: "Intermediate", detail: "Relational schema design, indexed queries" },
    ],
  },
  {
    id: "security",
    name: "Security, Ops & Mail Relay",
    shortName: "Security",
    icon: <FaLock className="text-blue-600" />,
    description: "Defense-in-depth security architectures, bot defense, and transactional mail routing.",
    skills: [
      { name: "Bot Defense & Turnstile", level: "Expert", detail: "Cloudflare Turnstile siteverify server validation" },
      { name: "Secure Authentication", level: "Expert", detail: "Web Crypto API, HMAC token hashing, session-cookie models" },
      { name: "Email Relay Failover", level: "Expert", detail: "Brevo v3 REST API with automatic Resend SDK failover" },
      { name: "Edge Routing & Vercel", level: "Advanced", detail: "Single-hop 301 normalizers, hostname rewrites" },
    ],
  },
];

export function SkillsScreen() {
  const [activeTab, setActiveTab] = useState<string>("frontend");
  const activeCategory = skillCategories.find((c) => c.id === activeTab) || skillCategories[0];

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
              Technical Matrix
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-[10px] font-admin-mono font-semibold text-[#7C3AED] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-pulse" />
              16 Competencies
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-1">
            <h2 className="text-lg font-extrabold font-admin-sans tracking-tight text-black leading-tight">
              Skills & Systems<span className="text-[#7C3AED]">.</span>
            </h2>
            <span className="text-[10.5px] text-gray-500 font-admin-mono">
              Production Stack
            </span>
          </div>
        </div>

        {/* 4-Item Horizontal Category Picker */}
        <div className="grid grid-cols-4 gap-1.5 shrink-0 my-1.5">
          {skillCategories.map((cat) => {
            const isSelected = cat.id === activeTab;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`px-1.5 py-1.5 rounded-lg text-center transition border flex flex-col items-center justify-center min-h-[44px] cursor-pointer shadow-2xs ${
                  isSelected
                    ? "bg-[#7C3AED] border-[#7C3AED] text-white font-bold ring-1 ring-[#7C3AED]"
                    : "bg-white border-[#E2E8F0] text-gray-700 hover:bg-[#F8FAFC]"
                }`}
              >
                <div className={`text-xs mb-0.5 ${isSelected ? "text-white" : ""}`}>{cat.icon}</div>
                <span className="text-[10.5px] font-admin-sans font-bold leading-tight truncate w-full">
                  {cat.shortName}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Category Skills Card (Single View, No Scroll) */}
        <div className="flex-1 min-h-0 flex flex-col justify-between bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-2xs overflow-hidden my-1">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 mb-2">
              <div className="min-w-0">
                <h3 className="text-sm font-bold font-admin-sans text-black truncate">
                  {activeCategory.name}
                </h3>
                <p className="text-[10.5px] text-gray-500 font-admin-sans truncate mt-0.5">
                  {activeCategory.description}
                </p>
              </div>
            </div>

            {/* 4 Skills in a 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2">
              {activeCategory.skills.map((skill, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-bold font-admin-sans text-black truncate">
                      {skill.name}
                    </span>
                    <span className="text-[8.5px] font-admin-mono px-1 py-0.2 rounded bg-white border border-[#E2E8F0] text-[#7C3AED] font-semibold shrink-0">
                      {skill.level}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-snug line-clamp-2">
                    {skill.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Footer Status Pill */}
        <div className="p-2 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-between text-[10px] font-admin-mono text-gray-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-gray-700">Production-Verified Core Stack</span>
          </span>
          <span className="text-gray-500">Full-Stack & Systems</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. DESKTOP WORKSPACE EXPERIENCE (Full Spec, Side-by-Side)    */}
      {/* ============================================================ */}
      <div className="hidden md:flex flex-col justify-between p-6 sm:p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto text-black">
        {/* Header */}
        <div>
          <div className="text-xs font-admin-mono text-[#7C3AED] uppercase tracking-wider mb-1 font-semibold">
            Technical Inventory & Engineering Capabilities
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold font-admin-sans tracking-tight text-black mb-2">
            Skills & Systems Matrix<span className="text-[#7C3AED]">.</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-2xl leading-relaxed">
            Production-proven technical stacks categorized by architectural domain.
          </p>
        </div>

        {/* Domain Category Selector Tabs */}
        <div className="grid grid-cols-4 gap-2 my-2 shrink-0">
          {skillCategories.map((cat) => {
            const isActive = cat.id === activeTab;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`p-3 rounded-lg text-left transition border shadow-2xs flex items-center gap-2.5 cursor-pointer ${
                  isActive
                    ? "bg-[#F5F3FF] border-[#DDD6FE] text-[#7C3AED]"
                    : "bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] text-gray-700"
                }`}
              >
                <div className="text-sm shrink-0">{cat.icon}</div>
                <div className="min-w-0">
                  <div className={`text-xs font-bold font-admin-sans truncate ${isActive ? "text-[#7C3AED]" : "text-black"}`}>
                    {cat.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Category Skills List */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-2xs my-auto">
          <div className="border-b border-[#E2E8F0] pb-3 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-admin-sans text-black">
                {activeCategory.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {activeCategory.description}
              </p>
            </div>
            <span className="text-xs font-admin-mono px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-gray-600">
              {activeCategory.skills.length} Core Competencies
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {activeCategory.skills.map((skill, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-md bg-[#FAFAFA] border border-[#E2E8F0] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold font-admin-sans text-black">{skill.name}</span>
                  <span className="text-[10px] font-admin-mono px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#7C3AED] font-semibold">
                    {skill.level}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {skill.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Reliability Callout */}
        <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-between text-xs font-admin-mono text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-gray-700">Production-Verified Core Capabilities</span>
          </span>
          <span className="text-gray-500">Full-Stack &bull; High Concurrency &bull; Clean Architecture</span>
        </div>
      </div>
    </div>
  );
}
