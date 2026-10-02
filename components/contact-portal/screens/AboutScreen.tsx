"use client";

import React from "react";
import { FaTerminal, FaCube, FaShieldVirus, FaRocket } from "react-icons/fa";

export function AboutScreen() {
  const principles = [
    {
      icon: <FaRocket className="text-[#7C3AED]" />,
      title: "Performance as a Foundation",
      detail:
        "Fast response times, minimal bundle weights, and sub-millisecond edge redirects are engineering prerequisites, not post-launch optimizations.",
    },
    {
      icon: <FaCube className="text-indigo-600" />,
      title: "Data Access Layer Discipline",
      detail:
        "Every Firestore query, Redis counter, and external mutation flows through structured DAL repositories with centralized timing, sanitization, and error classification.",
    },
    {
      icon: <FaShieldVirus className="text-emerald-600" />,
      title: "Robust Security & Privacy",
      detail:
        "Modern bot defense, session integrity, and privacy-first architecture that protect user privacy without friction.",
    },
    {
      icon: <FaTerminal className="text-blue-600" />,
      title: "Cross-Platform Execution",
      detail:
        "From web platforms with Next.js 15 and React 19 to native desktop systems with Rust & Tauri, I bridge the gap between frontend elegance and systems-level efficiency.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto text-black">
      {/* Header */}
      <div>
        <div className="text-xs font-admin-mono text-[#7C3AED] uppercase tracking-wider mb-1 font-semibold">
          Engineering Focus & Philosophy
        </div>
        <h2 className="text-xl sm:text-3xl font-extrabold font-admin-sans tracking-tight text-black mb-2">
          Architecture Over Complexity<span className="text-[#7C3AED]">.</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 max-w-2xl leading-relaxed">
          I am a Full-Stack and Systems Engineer specializing in robust, production-grade applications that solve real technical challenges without unnecessary dependencies.
        </p>
      </div>

      {/* 4 Architectural Principles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 my-auto">
        {principles.map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs hover:border-[#CBD5E1] transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-sm">
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold font-admin-sans text-gray-900">{item.title}</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed pl-10">
                {item.detail}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-[#E2E8F0] flex items-center justify-between text-[11px] font-admin-mono text-gray-400">
              <span>Principle 0{idx + 1}</span>
              <span className="text-emerald-700 font-semibold">Enforced in Production</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Specs */}
      <div className="p-4 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs font-admin-mono text-gray-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Core Stack: Next.js 15 · TypeScript · Rust/Tauri · Upstash Redis · Firestore</span>
        </div>
        <span>Production Ready &bull; High Reliability</span>
      </div>
    </div>
  );
}
