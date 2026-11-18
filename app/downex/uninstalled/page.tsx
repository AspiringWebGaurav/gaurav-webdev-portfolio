import type { Metadata } from "next";
import Image from "next/image";
import { DownexUninstalledLifecycle } from "./DownexUninstalledLifecycle";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Uninstalled | Downex",
  description: "Downex was uninstalled. You can reinstall anytime.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Uninstalled | Downex",
    description: "Downex has been removed from your computer. Reinstall anytime.",
    url: "https://downex.apps.gauravpatil.site/uninstalled",
    siteName: "Downex",
    locale: "en_US",
    type: "website",
  },
};

const BLUR_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAMbSURBVDhPrdF9LBRgHAfwn7XaWjZrpVVU60X0h2pLqKy0XqxMrcVuxdL1tmEki4nMEUqLFcaV8hKXc6ukkLh059hx3Sl3Qnc65zjOVaKut6l9m+eq6f++fz37Pc/3s9/2EP2vhBirV+3/Ls7f97leEvChutn/fZXUb1Qk9R0RSDcPFku9+gulHjp+s4f++jMvfWFeQNuN5X/L/n0CF99vNZadaMZW1GHL5EN4fb2HjVYRPD8K4Wzhw9GUg3kD2XB4kwkH4xU4daSZfRovrmCAp6WiZB0asGmsEjHjEuRNqMAfVyHeIoaXvhBpZgkujDQh1SRGymAj4vSPsG6gALMfR91gwILR6+07ftSh89sopqfXasamrrx/Zn9i/mmFW+P5FgYsNeS36WBlF4YJC67pm8DT1uBkjxBu6iuI1lQiurMCUS8ECG+/hVpjB3tb3iOVMSDFKJZPDTTjQ1iruQonbRaW9GbBqSsTzupLsGuLA0nCQU0RoNpQuDYmMkBnNtoAuaWPAWH6KjjoLsNVl4OV3dlYqs6EoyoVM1pi4a3IAj0JBz0IhqcknQGvhvQ2oO+9iQF+uiLYd6djcVcmFr5Mx3wlDzNlZxHWUwnLlwmUDcpRYpBB+8nMgPRWoQ1oHe5lAPeNCKSKw9yOFDgokjCrNQ4rZDz8mJxkhempN3ViTgHHBsR23WWA2jqM+c+TQbJIkCQSJA7DGimPFbQfTNhWw4NvTSo87p8DVRwB8QNtgL3kbJvm9xcavo4hw9CAmNf3sV/Fx7KGeDZ/8a4fVBYEKuOASjkgERd2uYG2b6SWaMXyzgxITa+mbwnNmBHzqiPZWWbqBpVwQOVHQCUhoKJg2KX5t7L+jCenBaRNAj0Og8+zDJyS30KUvBQBTy9jdV08ukcNcBFGgkoPgYpDQHlBoNxA2J3ZXmzbIHnvemqKHiN1Aqg5AtRwAlTLBT06Csf6GCyqOg0SBoOEXFDhIVDOQVDCrre0x93dBkzluLcn3eEKSHRMQbdDlVQUoqSbh5WUH6SknANKunZQSRcDlJS4W0FRW8tp+8oNU7VfRUZVaMXTS/kAAAAASUVORK5CYII=";

export default function DownexUninstalledPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center select-none bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased">
      <DownexUninstalledLifecycle />

      {/* 1. Brand Logo + Title */}
      <a
        href="https://downex.apps.gauravpatil.site"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 mb-6 group cursor-pointer"
        title="Downex"
      >
        <Image
          src="/brand/downex-icon-sm.png"
          alt="Downex"
          width={32}
          height={32}
          priority
          loading="eager"
          decoding="async"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className="w-8 h-8 rounded-lg shadow-sm group-hover:scale-105 transition-transform"
        />
        <span className="text-2xl sm:text-[26px] font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          Downex
        </span>
      </a>

      {/* 2. Main Status Heading */}
      <h1 className="text-2xl sm:text-3xl md:text-[34px] font-normal tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mb-3 max-w-4xl whitespace-nowrap">
        Downex was uninstalled.
      </h1>

      {/* 3. Subtitle with Reinstall Real Anchor Link */}
      <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed mb-6 sm:mb-8 max-w-xl">
        The app has been removed from your computer.{" "}
        <a
          href="https://downex.apps.gauravpatil.site"
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
          href="https://github.com/AspiringWebGaurav/downex#readme"
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
          href="https://downex.apps.gauravpatil.site"
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
