import type { Metadata, Viewport } from "next";
import React from "react";
import { Geist, Geist_Mono } from "next/font/google";

const adminSans = Geist({
  variable: "--font-admin-sans",
  subsets: ["latin"],
  display: "swap",
});

const adminMono = Geist_Mono({
  variable: "--font-admin-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FAFAFA",
};

export const metadata: Metadata = {
  title: "Temporary Preview | Contact Screen & Cloudflare Gate",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TempContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-portal="true"
      className={`${adminSans.variable} ${adminMono.variable} font-admin-sans relative h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#FAFAFA] text-black flex flex-col`}
    >
      <main className="relative z-10 flex-1 flex flex-col h-full max-h-[100dvh] overflow-hidden">
        {children}
      </main>
    </div>
  );
}
