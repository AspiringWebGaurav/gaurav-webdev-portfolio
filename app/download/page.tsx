import type { Metadata } from "next";
import DownloadClient from "./DownloadClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Download Downex | High-Performance Windows Download Manager",
  description:
    "Download Downex v0.0.0 Base Foundation for Windows 10/11 with zero-UAC in-process OTA updates, multi-socket acceleration, and browser integration companion.",
  openGraph: {
    title: "Download Downex — High-Performance Windows Download Manager",
    description:
      "Instant multi-connection download acceleration with zero-UAC in-process updates, SQLite WAL persistence, and browser integration companion.",
    url: "https://download.gauravpatil.site",
    siteName: "Downex",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Download Downex — High-Performance Windows Download Manager",
    description:
      "Instant multi-connection download acceleration with zero-UAC in-process updates and browser extension.",
  },
};

// Permanent Immutable Base 0.0.0 Foundation Endpoints on GPHost
// These endpoints are strictly locked, permanent, and never overwritten or deleted by OTA releases.
const baseDesktopDownloadUrl = (
  process.env.NEXT_PUBLIC_DOWNEX_DOWNLOAD_URL ||
  "https://gphost.eu.cc/raw/downex-desktop"
).split("?")[0];

const baseExtensionDownloadUrl = (
  process.env.NEXT_PUBLIC_DOWNEX_EXTENSION_DOWNLOAD_URL ||
  "https://gphost.eu.cc/raw/downex-extension"
).split("?")[0];

export default function DownloadPage() {
  const ts = Date.now();
  const desktopDownloadUrl = `${baseDesktopDownloadUrl}?v=0.0.0-base-${ts}`;
  const desktopShareUrl = `https://gphost.eu.cc/f/downex-desktop?v=0.0.0-base-${ts}`;

  const extensionDownloadUrl = `${baseExtensionDownloadUrl}?v=0.0.2-${ts}`;
  const extensionShareUrl = `https://gphost.eu.cc/f/downex-extension?v=0.0.2-${ts}`;

  return (
    <DownloadClient
      desktopDownloadUrl={desktopDownloadUrl}
      desktopShareUrl={desktopShareUrl}
      extensionDownloadUrl={extensionDownloadUrl}
      extensionShareUrl={extensionShareUrl}
    />
  );
}
