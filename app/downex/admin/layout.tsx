import React from "react";
import type { Metadata } from "next";

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
      className="min-h-screen w-full bg-white text-zinc-900 antialiased"
      style={
        {
          "--font-downex-sans": "var(--font-geist-sans)",
          "--font-downex-mono": "var(--font-geist-mono)",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
