import type { Metadata } from "next";
import DownloadClient from "./DownloadClient";
import {
  DOWNEX_ORIGIN,
  DOWNEX_KEYWORDS,
  DOWNEX_DESKTOP_DOWNLOAD_URL,
  DOWNEX_EXTENSION_DOWNLOAD_URL,
  DOWNEX_OG_IMAGE_URL,
  buildDownexWebSiteJsonLd,
  buildDownexSoftwareJsonLd,
  buildDownexFaqJsonLd,
  buildDownexBreadcrumbJsonLd,
} from "@/lib/data/downex-seo";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  metadataBase: new URL(DOWNEX_ORIGIN),
  title: {
    absolute:
      "Downex — Simple Free Download Manager for Windows (Open Source IDM Alternative)",
  },
  description:
    "Download Downex — a simple, free & open-source Windows 10/11 download manager and IDM alternative by Gaurav Patil. 32 parallel HTTP/1.1 streams, auto Chrome/Edge catch, 1-by-1 queues, and 4 GB low-RAM speed.",
  keywords: DOWNEX_KEYWORDS,
  alternates: {
    canonical: DOWNEX_ORIGIN,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title:
      "Downex — Simple Free Download Manager for Windows (Open Source IDM Alternative)",
    description:
      "Free & open-source multi-connection download manager for Windows 10/11. 32 parallel connections, Chrome/Edge link grabber, 1-by-1 sequential queue, zero ads.",
    url: DOWNEX_ORIGIN,
    siteName: "Downex — Simple Free Download Manager",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: DOWNEX_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Downex — Simple Free Download Manager for Windows",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Downex — Simple Free Download Manager for Windows & IDM Alternative",
    description:
      "Free & open-source Rust/Tauri download manager with 32 parallel HTTP/1.1 connections, browser link catch, and zero telemetry.",
    images: [DOWNEX_OG_IMAGE_URL],
  },
};

export default function DownloadPage() {
  const desktopDownloadUrl = DOWNEX_DESKTOP_DOWNLOAD_URL;
  const desktopShareUrl = "https://gphost.eu.cc/f/downex-desktop";

  const extensionDownloadUrl = DOWNEX_EXTENSION_DOWNLOAD_URL;
  const extensionShareUrl = "https://gphost.eu.cc/f/downex-extension";

  const websiteJsonLd = buildDownexWebSiteJsonLd();
  const softwareJsonLd = buildDownexSoftwareJsonLd();
  const faqJsonLd = buildDownexFaqJsonLd();
  const breadcrumbJsonLd = buildDownexBreadcrumbJsonLd([
    { name: "Downex — Simple Free Download Manager", url: DOWNEX_ORIGIN },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <DownloadClient
        desktopDownloadUrl={desktopDownloadUrl}
        desktopShareUrl={desktopShareUrl}
        extensionDownloadUrl={extensionDownloadUrl}
        extensionShareUrl={extensionShareUrl}
      />
    </>
  );
}
