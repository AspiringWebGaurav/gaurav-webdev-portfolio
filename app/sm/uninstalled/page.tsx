import type { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Uninstalled | ScheduleMe",
  description: "ScheduleMe was uninstalled. You can reinstall anytime.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Uninstalled | ScheduleMe",
    description: "ScheduleMe has been removed from your computer. Reinstall anytime.",
    url: "https://sm.apps.gauravpatil.site/uninstalled",
    siteName: "ScheduleMe",
    locale: "en_US",
    type: "website",
  },
};

export default function ScheduleMeUninstalledPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center select-none bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased">
      {/* 1. Brand Logo + Title with 100% Vector SVG (Zero Vercel Image Quota Burn & Persistent Border) */}
      <a
        href="https://sm.apps.gauravpatil.site"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 mb-6 group cursor-pointer"
        title="ScheduleMe"
      >
        <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-700/80 shadow-xs flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 transition-transform">
          <svg
            viewBox="0 0 64 64"
            fill="none"
            className="w-full h-full"
            aria-hidden="true"
          >
            <path
              d="M21.64 16.63A20.16 20.16 0 1 0 42.36 16.63"
              stroke="#DC2626"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <line
              x1="32"
              y1="10.24"
              x2="32"
              y2="30.72"
              stroke="#DC2626"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="text-2xl sm:text-[26px] font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          ScheduleMe
        </span>
      </a>

      {/* 2. Main Status Heading */}
      <h1 className="text-2xl sm:text-3xl md:text-[34px] font-normal tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mb-3 max-w-4xl whitespace-nowrap">
        ScheduleMe was uninstalled.
      </h1>

      {/* 3. Subtitle with Reinstall Link */}
      <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed mb-6 sm:mb-8 max-w-xl">
        The app has been removed from your computer.{" "}
        <a
          href="https://sm.apps.gauravpatil.site"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline font-normal whitespace-nowrap"
        >
          Click here
        </a>{" "}
        to reinstall anytime.
      </p>

      {/* 4. Minimalist Centered Navigation Links */}
      <nav
        aria-label="Footer Navigation"
        className="flex items-center justify-center gap-5 sm:gap-6 text-sm font-normal text-blue-600 dark:text-blue-400"
      >
        <a
          href="https://sm.apps.gauravpatil.site/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Docs
        </a>
        <span className="text-zinc-300 dark:text-zinc-700 select-none px-1" aria-hidden="true">
          |
        </span>
        <a
          href="https://sm.apps.gauravpatil.site"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          App
        </a>
        <span className="text-zinc-300 dark:text-zinc-700 select-none px-1" aria-hidden="true">
          |
        </span>
        <a
          href="https://gauravpatil.site"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Portfolio
        </a>
      </nav>
    </div>
  );
}
