"use client";

import React from "react";
import { useLoading } from "@/contexts/LoadingContext";

export default function AppLoader() {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md px-4">
      {/* Ambient glow effects - Responsive sizes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-48 w-48 sm:h-64 sm:w-64 md:h-96 md:w-96 rounded-full bg-indigo-500/20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 h-48 w-48 sm:h-64 sm:w-64 md:h-96 md:w-96 rounded-full bg-violet-500/20 blur-3xl animate-pulse [animation-delay:0.5s]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 sm:h-48 sm:w-48 md:h-64 md:w-64 rounded-full bg-sky-500/20 blur-3xl animate-pulse [animation-delay:1s]"></div>
      </div>

      {/* Main loader container */}
      <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 md:gap-8 max-w-sm mx-auto">
        {/* Modern loader animation - Responsive sizes */}
        <div className="relative h-20 w-20 sm:h-28 sm:w-28 md:h-32 md:w-32">
          {/* Outer rotating ring with gradient */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-violet-500 to-sky-500 opacity-20 blur-sm"></div>

          {/* Main rotating ring */}
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white/10"
            />

            {/* Animated gradient circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset="75"
              className="animate-spin [animation-duration:2s]"
              style={{ transformOrigin: "50% 50%" }}
            />

            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#0EA5E9" />
              </linearGradient>
            </defs>
          </svg>

          {/* Inner pulsing orb - Responsive sizes */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 blur-md animate-pulse"></div>
              <div className="absolute inset-1.5 sm:inset-2 rounded-full bg-gradient-to-br from-white to-indigo-100"></div>
            </div>
          </div>

          {/* Orbiting particles - Responsive sizes */}
          <div className="absolute inset-0 animate-spin [animation-duration:3s]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 shadow-lg shadow-indigo-500/50"></div>
          </div>
          <div className="absolute inset-0 animate-spin [animation-duration:3s] [animation-delay:0.5s]">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-gradient-to-r from-violet-400 to-sky-400 shadow-lg shadow-violet-500/50"></div>
          </div>
        </div>

        {/* Loading text with gradient - Responsive text size */}
        <div className="text-center space-y-2 sm:space-y-3 px-4">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent animate-pulse break-words">
            {loadingMessage}
          </h3>

          {/* Animated progress dots - Responsive sizes */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500 animate-bounce [animation-delay:0s] shadow-lg shadow-indigo-500/50"></div>
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-gradient-to-r from-violet-400 to-violet-500 animate-bounce [animation-delay:0.2s] shadow-lg shadow-violet-500/50"></div>
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-gradient-to-r from-sky-400 to-sky-500 animate-bounce [animation-delay:0.4s] shadow-lg shadow-sky-500/50"></div>
          </div>
        </div>

        {/* Subtle brand mark - Responsive text size */}
        <div className="mt-2 sm:mt-4 text-[10px] sm:text-xs font-medium text-white/40 tracking-wider uppercase">
          Gaurav Portfolio Admin
        </div>
      </div>
    </div>
  );
}
