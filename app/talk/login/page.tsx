import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { TalkLoginForm } from "@/components/talk/TalkLoginForm";
import { CgSpinner } from "react-icons/cg";

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
        <div className="absolute bottom-0 inset-x-0 h-px bg-[#E2E8F0] dark:bg-[#1E293B]" />
      </header>

      {/* Main Center Area */}
      <main className="flex-1 w-full flex flex-col justify-center items-center px-4 py-8 relative z-10">
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-2 p-6 rounded-xl bg-white dark:bg-[#0E0D17] border border-[#E2E8F0] dark:border-[rgba(255,255,255,0.08)]">
              <CgSpinner className="w-6 h-6 animate-spin text-[#7C3AED]" />
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
