import type { Metadata, Viewport } from "next";
import React from "react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#FFFFFF",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Gaurav Patil — Projects",
  description: "Direct project launchpad for Gaurav Patil.",
  alternates: {
    canonical: "https://self.gauravpatil.site/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SelfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#FFFFFF] text-slate-900 touch-manipulation [-webkit-tap-highlight-color:transparent]">
      {children}
    </div>
  );
}
