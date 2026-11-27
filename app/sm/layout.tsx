import type { Metadata, Viewport } from "next";
import React from "react";

export const revalidate = 86400;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#F59E0B",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sm.apps.gauravpatil.site"),
  title: {
    default: "ScheduleMe | Lightweight Windows Shutdown, Restart & Sleep Scheduler",
    template: "%s | ScheduleMe",
  },
  description:
    "ScheduleMe is an ultra-lightweight Windows automation utility built with Rust and Tauri by Gaurav Patil for automated shutdown, restart, and sleep actions.",
  keywords: [
    "ScheduleMe",
    "Windows shutdown scheduler",
    "auto shutdown Windows 11",
    "Rust Tauri scheduler",
    "Gaurav Patil",
  ],
  alternates: {
    canonical: "https://sm.apps.gauravpatil.site",
  },
  openGraph: {
    title: "ScheduleMe — Lightweight Windows Power Scheduler",
    description:
      "Schedule automated Windows shutdown, restart, or sleep in seconds with Rust & Tauri efficiency and zero background CPU overhead.",
    url: "https://sm.apps.gauravpatil.site",
    siteName: "ScheduleMe",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://gauravpatil.site/og-image.png",
        width: 1200,
        height: 630,
        alt: "ScheduleMe — Windows Power Automation Utility by Gaurav Patil",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScheduleMe — Lightweight Windows Power Scheduler",
    description:
      "Automated Windows shutdown, restart, and sleep scheduler built in Rust & Tauri by Gaurav Patil.",
    images: ["https://gauravpatil.site/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const smJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://sm.apps.gauravpatil.site/#website",
      url: "https://sm.apps.gauravpatil.site",
      name: "ScheduleMe",
      publisher: {
        "@type": "Person",
        name: "Gaurav Patil",
        url: "https://gauravpatil.site",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://sm.apps.gauravpatil.site/#software",
      name: "ScheduleMe",
      url: "https://sm.apps.gauravpatil.site",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Windows 10, Windows 11",
      softwareVersion: "0.0.1",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Ultra-lightweight Rust and Tauri Windows automation utility to schedule graceful system shutdown, restart, and sleep actions.",
      author: {
        "@type": "Person",
        name: "Gaurav Patil",
        url: "https://gauravpatil.site",
      },
    },
  ],
};

export default function SmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(smJsonLd) }}
      />
      {children}
    </>
  );
}
