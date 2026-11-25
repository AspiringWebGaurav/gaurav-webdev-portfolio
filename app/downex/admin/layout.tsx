import React from "react";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

const downexSans = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-downex-sans",
  display: "swap",
});

const downexMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-downex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Downex — Admin Control",
  description: "Downex Ecosystem Administration Console",
};

export default function DownexAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      data-admin="true"
      data-portal="downex"
      className={`${downexSans.variable} ${downexMono.variable} min-h-screen w-full bg-white text-zinc-900 antialiased`}
    >
      {children}
    </div>
  );
}
