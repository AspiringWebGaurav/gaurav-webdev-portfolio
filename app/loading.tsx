import React from "react";

/**
 * RootLoading
 * Next.js App Router root loading fallback with GPU-accelerated concentric dual-ring spinner.
 */
export default function RootLoading() {
  return (
    <div
      aria-label="Loading page content"
      role="status"
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none bg-[#FAFAFA] dark:bg-[#000319]"
    >
      <div className="flex flex-col items-center justify-center p-6 max-w-xs text-center">
        {/* Dynamic Concentric Dual-Ring Center Spinner */}
        <div className="relative w-14 h-14 flex items-center justify-center">
          {/* Outer Track Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-slate-200/90 dark:border-white/10" />

          {/* Outer High-Speed Primary Arc */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin text-[#7C3AED] dark:text-[#CBACF9]"
            viewBox="0 0 56 56"
            fill="none"
            style={{
              animationDuration: "0.95s",
              filter: "drop-shadow(0 0 10px rgba(124, 58, 237, 0.45))",
            }}
          >
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="36 115"
            />
          </svg>

          {/* Inner Counter-Rotating Precision Arc */}
          <svg
            className="w-8 h-8 text-slate-800 dark:text-purple"
            viewBox="0 0 32 32"
            fill="none"
            style={{
              animation: "spin 1.5s linear infinite reverse",
            }}
          >
            <circle
              cx="16"
              cy="16"
              r="12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="18 57"
            />
          </svg>

          {/* Center Pulsing Micro-Core */}
          <div className="absolute w-2 h-2 rounded-full bg-[#7C3AED] dark:bg-[#CBACF9] shadow-[0_0_8px_rgba(124,58,237,0.8)] animate-pulse" />
        </div>

        {/* Dynamic Status Typography */}
        <div className="mt-5 flex flex-col items-center space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold tracking-[0.25em] text-slate-800 dark:text-slate-200 uppercase">
              Gaurav Patil
            </span>
          </div>
          <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tracking-wide">
            Loading...
          </p>
        </div>
      </div>
    </div>
  );
}
