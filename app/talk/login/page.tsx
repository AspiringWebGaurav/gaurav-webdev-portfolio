import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { TalkLoginForm } from "@/components/talk/TalkLoginForm";
import { CgSpinner } from "react-icons/cg";
import { IoArrowBack } from "react-icons/io5";

export const metadata: Metadata = {
  title: "Sign In",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TalkLoginPage() {
  return (
    <div className="h-full w-full flex flex-col justify-between relative select-none overflow-y-auto">
      {/* Top Bar */}
      <header className="w-full h-14 px-4 sm:px-8 flex items-center justify-between z-20 relative shrink-0">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white hover:opacity-80 transition-opacity"
        >
          talk<span className="text-[#7C3AED]">.</span>
        </Link>

        <a
          href={process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "production" ? "https://gauravpatil.site" : "http://localhost:3000")}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1.5 group cursor-pointer"
        >
          <IoArrowBack className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Portfolio</span>
        </a>

        <div className="absolute bottom-0 inset-x-0 h-px bg-[#E2E8F0] dark:bg-[#1E293B]" />
      </header>

      {/* Main Center Area */}
      <main className="flex-1 w-full flex flex-col justify-center items-center px-4 py-8 relative z-10">
        {/* Soft Ambient Radial Lighting behind card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-violet-500/10 via-purple-500/8 to-indigo-500/10 dark:from-violet-600/15 dark:via-purple-600/10 dark:to-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-white/95 dark:bg-[#0E0D17]/95 border border-slate-200/90 dark:border-white/10 shadow-lg">
              <CgSpinner className="w-7 h-7 animate-spin text-[#7C3AED]" />
              <span className="text-xs text-slate-400">Loading...</span>
            </div>
          }
        >
          <TalkLoginForm />
        </Suspense>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-4 px-4 sm:px-8 flex items-center justify-center border-t border-[#E2E8F0] dark:border-[#1E293B] text-xs text-slate-400 z-20">
        <span>gauravpatil.site</span>
      </footer>
    </div>
  );
}
