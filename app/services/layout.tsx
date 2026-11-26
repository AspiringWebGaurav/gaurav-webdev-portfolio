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
  metadataBase: new URL("https://services.gauravpatil.site"),
  title: "Gaurav Patil — Services & Command Hubs",
  description:
    "Unified Services Portal for Gaurav Patil. Verified interactive resume, secure Talk command hub, and dedicated recruiter contact gateway: resume.services, talk.services, and contact.services.",
  alternates: {
    canonical: "https://services.gauravpatil.site",
  },
  openGraph: {
    title: "Services Hub | Gaurav Patil — Enterprise & Recruiter Services",
    description:
      "Interactive Resume, Talk Command Hub, and Recruiter Gateway. High-availability, verified edge routing.",
    url: "https://services.gauravpatil.site",
    siteName: "Gaurav Patil Services",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ServicesLayout({
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
