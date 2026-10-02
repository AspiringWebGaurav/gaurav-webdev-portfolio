import { Suspense } from "react";
import type { Metadata } from "next";
import { TalkCommandHub } from "@/components/talk/TalkCommandHub";
import { CgSpinner } from "react-icons/cg";

export const metadata: Metadata = {
  title: "talk",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TalkPage() {
  return (
    <div className="h-full w-full flex flex-col min-h-0 overflow-hidden">
      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center p-6">
            <div className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-white dark:bg-[#0E0D17] border border-[#E2E8F0] dark:border-[rgba(255,255,255,0.08)]">
              <CgSpinner className="w-6 h-6 animate-spin text-[#7C3AED]" />
              <p className="text-xs text-slate-400 font-mono">
                Loading...
              </p>
            </div>
          </div>
        }
      >
        <TalkCommandHub />
      </Suspense>
    </div>
  );
}
