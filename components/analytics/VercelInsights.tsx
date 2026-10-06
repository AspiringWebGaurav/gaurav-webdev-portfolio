"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Client-side analytics and speed insights wrapper.
 * Configured to optimize Vercel Hobby quota usage:
 * - Uses Next.js App Router-native Analytics wrapper (@vercel/analytics/next)
 * - Filters out internal /admin paths to prevent admin operations from consuming quotas
 * - Samples public speed insights at 15% to preserve the 10K events monthly limit
 */
export function VercelInsights() {
  return (
    <>
      <Analytics
        beforeSend={(event) => {
          if (typeof window !== "undefined") {
            const h = window.location.hostname;
            if (h === "localhost" || h === "127.0.0.1" || h.includes(".local")) return null;
            if (window.location.pathname.startsWith("/admin")) return null;
          }
          if (event.url && (event.url.includes("/admin") || event.url.includes("localhost"))) {
            return null;
          }
          return event;
        }}
      />
      <SpeedInsights
        sampleRate={0.15}
        beforeSend={(event) => {
          if (typeof window !== "undefined") {
            const h = window.location.hostname;
            if (h === "localhost" || h === "127.0.0.1" || h.includes(".local")) return null;
            if (window.location.pathname.startsWith("/admin")) return null;
          }
          if (event.url && (event.url.includes("/admin") || event.url.includes("localhost"))) {
            return null;
          }
          return event;
        }}
      />
    </>
  );
}
