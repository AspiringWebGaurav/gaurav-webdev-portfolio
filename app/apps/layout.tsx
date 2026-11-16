import type { Metadata, Viewport } from "next";
import React from "react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#050816",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://apps.gauravpatil.site"),
  title: "Gaurav Patil — PC Apps & Tools Suite",
  description:
    "Unified PC Apps and Desktop Engineering suite by Gaurav Patil. High-performance Win32 native tools, Tauri applications, and distributed local-first software: CP Engine, Downex, ScheduleMe, and GPN Notes.",
  alternates: {
    canonical: "https://apps.gauravpatil.site",
  },
  openGraph: {
    title: "Apps Suite | Gaurav Patil — PC & Native Software Hub",
    description:
      "Unified PC Apps and Desktop Engineering suite. CP Engine, Downex, ScheduleMe, and GPN Notes — single-view zero-vertical-scroll command center.",
    url: "https://apps.gauravpatil.site",
    siteName: "Gaurav Patil Apps",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-white selection:bg-cyan-500 selection:text-black touch-manipulation [-webkit-tap-highlight-color:transparent]">
      {children}
    </div>
  );
}
