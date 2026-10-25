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

const baseDesktopDownloadUrl = (
  process.env.NEXT_PUBLIC_DOWNEX_DOWNLOAD_URL ||
  "https://gphost.eu.cc/raw/6bdmYJAHYIBc"
).split("?")[0];

const DESKTOP_DOWNLOAD_URL = `${baseDesktopDownloadUrl}?v=0.0.0-base-${Date.now()}`;
const DESKTOP_SHARE_URL = `https://gphost.eu.cc/f/6bdmYJAHYIBc?v=0.0.0-base-${Date.now()}`;

export default function DownloadPage() {
  return (
    <DownloadClient
      desktopDownloadUrl={DESKTOP_DOWNLOAD_URL}
      desktopShareUrl={DESKTOP_SHARE_URL}
    />
  );
}
