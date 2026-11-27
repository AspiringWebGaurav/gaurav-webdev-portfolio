import type { Metadata, Viewport } from "next";
import React from "react";

export const revalidate = 86400;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#10B981",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://cp.apps.gauravpatil.site"),
  title: {
    default: "CP Engine | Hardware-Accelerated Windows Copy & Paste App",
    template: "%s | CP Engine",
  },
  description:
    "Fast and simple file copying for Windows by Gaurav Patil. Hardware-accelerated unbuffered NVMe transfers without background lag or telemetry.",
  alternates: {
    canonical: "https://cp.apps.gauravpatil.site",
  },
  openGraph: {
    title: "CP Engine — Fast Windows Copy & Paste App",
    description:
      "Copy. Paste. Faster. Move large files and nested folders on Windows with high speed and zero telemetry.",
    url: "https://cp.apps.gauravpatil.site",
    siteName: "CP Engine",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://gauravpatil.site/og-image.png",
        width: 1200,
        height: 630,
        alt: "CP Engine — Fast Windows Copy & Paste App by Gaurav Patil",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CP Engine — Fast Windows Copy & Paste App",
    description:
      "Copy. Paste. Faster. Move large files and folders on Windows with high speed and zero lag.",
    images: ["https://gauravpatil.site/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const cpJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://cp.apps.gauravpatil.site/#website",
      url: "https://cp.apps.gauravpatil.site",
      name: "CP Engine",
      publisher: {
        "@type": "Person",
        name: "Gaurav Patil",
        url: "https://gauravpatil.site",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://cp.apps.gauravpatil.site/#software",
      name: "CP Engine",
      alternateName: "Copy. Paste. Faster.",
      url: "https://cp.apps.gauravpatil.site",
      downloadUrl: "https://gphost.eu.cc/raw/cp-desktop",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Windows 10, Windows 11",
      softwareVersion: "0.0.1",
      isAccessibleForFree: true,
      codeRepository: "https://github.com/AspiringWebGaurav/cp",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Hardware-accelerated Windows Explorer file copy and move utility built for zero-lag multi-gigabyte SSD transfers with zero telemetry.",
      author: {
        "@type": "Person",
        name: "Gaurav Patil",
        url: "https://gauravpatil.site",
      },
    },
  ],
};

export default function CpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cpJsonLd) }}
      />
      {children}
    </>
  );
}
