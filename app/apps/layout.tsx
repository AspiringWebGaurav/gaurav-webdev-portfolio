import type { Metadata, Viewport } from "next";
import React from "react";

export const revalidate = 86400;

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
  title: {
    absolute: "Gaurav Patil — PC Apps & Windows Software Suite (Downex, CP Engine, ScheduleMe)",
  },
  description:
    "Unified PC Apps and Desktop Engineering suite by Gaurav Patil. Featuring Downex (Simple Free Download Manager & IDM Alternative), CP Engine, ScheduleMe, and GPN Notes.",
  keywords: [
    "Downex",
    "Downex — Simple Free Download Manager",
    "free IDM alternative",
    "Windows apps suite",
    "Gaurav Patil apps",
    "CP Engine",
    "ScheduleMe",
    "GPN Notes",
  ],
  alternates: {
    canonical: "https://apps.gauravpatil.site",
  },
  openGraph: {
    title: "Apps Suite | Gaurav Patil — PC & Native Software Hub",
    description:
      "Unified PC Apps and Desktop Engineering suite featuring Downex, CP Engine, ScheduleMe, and GPN Notes.",
    url: "https://apps.gauravpatil.site",
    siteName: "Gaurav Patil Apps",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://gauravpatil.site/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gaurav Patil PC Apps Suite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Apps Suite | Gaurav Patil — Downex, CP Engine & ScheduleMe",
    description:
      "Windows native software hub by Gaurav Patil featuring Downex — Simple Free Download Manager.",
    images: ["https://gauravpatil.site/og-image.png"],
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
    <div className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-violet-500 selection:text-white touch-manipulation [-webkit-tap-highlight-color:transparent]">
      {children}
    </div>
  );
}
