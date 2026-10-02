"use client";

import React from "react";
import { IoCheckmarkCircleOutline, IoPauseCircleOutline, IoGlobeOutline, IoLogoGithub, IoLogoLinkedin } from "react-icons/io5";

interface ResumeSuspendedViewProps {
  status: "suspended" | "hired";
  statusMessage?: string;
}

export const ResumeSuspendedView: React.FC<ResumeSuspendedViewProps> = ({
  status,
  statusMessage,
}) => {
  const isHired = status === "hired";

  const defaultMessage = isHired
    ? "Gaurav has accepted an offer and is no longer actively interviewing. Thank you to all recruiters, engineering leads, and teams for your interest!"
    : "Resume access has been temporarily suspended by the candidate. Please check back later or reach out directly.";

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 w-full">
      <div className="relative w-full max-w-[540px] bg-white dark:bg-[#0E0E12] border border-slate-200 dark:border-zinc-800 rounded-3xl p-7 sm:p-10 shadow-2xl text-center space-y-6">
        {/* Ambient status glow */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 blur-3xl pointer-events-none rounded-full ${
            isHired ? "bg-emerald-500/20" : "bg-amber-500/20"
          }`}
        />

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border shadow-xs">
          {isHired ? (
            <>
              <IoCheckmarkCircleOutline className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-700 dark:text-emerald-400">Offer Accepted · Status: Hired</span>
            </>
          ) : (
            <>
              <IoPauseCircleOutline className="w-4 h-4 text-amber-500" />
              <span className="text-amber-700 dark:text-amber-400">Access Closed · Status: Inactive</span>
            </>
          )}
        </div>

        {/* Candidate Identity */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gaurav Patil
          </h1>
          <p className="text-sm sm:text-base font-semibold text-[#6366F1] dark:text-[#818CF8] mt-1.5">
            Full-Stack & Systems Software Engineer
          </p>
        </div>

        {/* Message */}
        <p className="text-sm sm:text-[15px] text-slate-600 dark:text-zinc-300 leading-relaxed max-w-md mx-auto">
          {statusMessage?.trim() || defaultMessage}
        </p>

        {/* Links */}
        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-medium">
          <a
            href="https://gauravpatil.site"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 transition-colors"
          >
            <IoGlobeOutline className="w-4 h-4 text-indigo-500" />
            <span>Main Portfolio</span>
          </a>
          <a
            href="https://github.com/AspiringWebGaurav"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 transition-colors"
          >
            <IoLogoGithub className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
            <span>GitHub</span>
          </a>
          <a
            href="https://linkedin.com/in/gaurav-patil-profile"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 transition-colors"
          >
            <IoLogoLinkedin className="w-4 h-4 text-blue-500" />
            <span>LinkedIn</span>
          </a>
        </div>
      </div>
    </div>
  );
};
