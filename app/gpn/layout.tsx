import type { Metadata, Viewport } from "next";
import React from "react";

export const revalidate = 86400;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#06B6D4",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://gpn.apps.gauravpatil.site"),
  title: {
    default: "GPN Notes | Private Encrypted Local-First Workspace",
    template: "%s | GPN Notes",
  },
  description:
    "Private, encrypted, local-first personal notes and knowledge workspace engineered by Gaurav Patil with Next.js and Yjs CRDT synchronization.",
  keywords: [
    "GPN Notes",
    "encrypted notes app",
    "local first markdown notes",
    "Yjs CRDT notes",
    "Gaurav Patil",
  ],
  alternates: {
    canonical: "https://gpn.apps.gauravpatil.site",
  },
  openGraph: {
    title: "GPN Notes — Private Encrypted Notes Workspace",
    description:
      "Fast, local-first encrypted notes platform built by Gaurav Patil with Next.js and Yjs.",
    url: "https://gpn.apps.gauravpatil.site",
    siteName: "GPN Notes",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://gauravpatil.site/og-image.png",
        width: 1200,
        height: 630,
        alt: "GPN Notes — Private Encrypted Workspace by Gaurav Patil",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GPN Notes — Private Encrypted Notes Workspace",
    description:
      "Private, encrypted, local-first personal notes workspace built by Gaurav Patil.",
    images: ["https://gauravpatil.site/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const gpnJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://gpn.apps.gauravpatil.site/#website",
      url: "https://gpn.apps.gauravpatil.site",
      name: "GPN Notes",
      publisher: {
        "@type": "Person",
        name: "Gaurav Patil",
        url: "https://gauravpatil.site",
      },
    },
    {
      "@type": "WebApplication",
      "@id": "https://gpn.apps.gauravpatil.site/#webapp",
      name: "GPN Notes",
      url: "https://gpn.apps.gauravpatil.site",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "Windows, Web",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Private, client-encrypted, local-first notes workspace built with Next.js and Yjs CRDT synchronization.",
      author: {
        "@type": "Person",
        name: "Gaurav Patil",
        url: "https://gauravpatil.site",
      },
    },
  ],
};

export default function GpnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gpnJsonLd) }}
      />
      {children}
    </>
  );
}
