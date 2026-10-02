"use client";

import React, { useState } from "react";
import { SiCloudflare } from "react-icons/si";

interface CloudflareVerificationLoaderProps {
  title?: string;
  subtitle?: string;
}

export function CloudflareVerificationLoader({
  title = "Verifying your request...",
  subtitle = "Connecting to recruiter portal and checking session security.",
}: CloudflareVerificationLoaderProps) {
  // Stable deterministic Ray ID prevents hydration re-renders
  const [rayId] = useState("8f49c2a07e1b59");

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between bg-[#FFFFFF] text-black relative overflow-hidden select-none font-admin-sans">
      {/* 1. Edge-to-Edge Top Navigation Bar */}
      <header className="w-full h-12 sm:h-[57px] bg-[#FFFFFF] px-4 sm:px-10 lg:px-16 flex items-center justify-between z-20 relative shrink-0 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-admin-sans text-[18px] sm:text-[24px] font-extrabold tracking-tight text-black">
            recruiter portal<span className="text-[#7C3AED]">.</span>
          </span>
          <span className="hidden sm:inline text-[#CBD5E1] text-sm">/</span>
          <span className="hidden sm:inline text-xs uppercase tracking-wider text-[#64748B] font-semibold">
            Security Verification
          </span>
        </div>
      </header>

      {/* 2. Middle Loader Workspace (Full page, NO card wrapper) */}
      <main className="flex-1 min-h-0 w-full bg-[#FFFFFF] flex flex-col items-center justify-center relative z-10 px-4 sm:px-6">
        <div className="w-full max-w-md flex flex-col items-center text-center">
          {/* Cloudflare Verification Spinner */}
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 mb-5 flex items-center justify-center">
            <div className="w-full h-full rounded-full border-[3px] border-[#F1F5F9] border-t-[#F38020] animate-spin" />
            <SiCloudflare className="w-5 h-5 sm:w-6 sm:h-6 text-[#F38020] absolute" />
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-black">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
            {subtitle}
          </p>

          {/* Authentic Cloudflare Verification Badge */}
          <div className="mt-6 w-full max-w-[340px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-[#CBD5E1] border-t-[#F38020] animate-spin shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-gray-900">
                  Verifying session security...
                </span>
                <span className="text-[10px] text-gray-500">
                  Automated Cloudflare challenge
                </span>
              </div>
            </div>

            {/* Cloudflare Attribution */}
            <div className="flex flex-col items-end gap-0.5 pl-3 border-l border-[#E2E8F0]">
              <div className="flex items-center gap-1">
                <SiCloudflare className="w-3.5 h-3.5 text-[#F38020]" />
                <span className="text-[10px] font-bold text-gray-900 tracking-tight">
                  Cloudflare
                </span>
              </div>
              <span className="text-[9px] text-gray-400">Privacy · Terms</span>
            </div>
          </div>

          {/* Sub-note */}
          <p className="mt-4 text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-pulse" />
            <span>This process is automatic. Loading recruiter portal...</span>
          </p>
        </div>
      </main>

      {/* 3. Edge-to-Edge Footer */}
      <footer className="w-full h-10 sm:h-[45px] bg-[#FFFFFF] px-4 sm:px-10 lg:px-16 flex items-center justify-between text-[11px] sm:text-xs text-[#64748B] z-20 relative shrink-0 border-t border-[#E2E8F0] font-admin-mono">
        <span>Ray ID: {rayId}</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Protected by Cloudflare
        </span>
      </footer>
    </div>
  );
}
