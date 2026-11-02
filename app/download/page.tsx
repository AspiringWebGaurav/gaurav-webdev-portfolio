import type { Metadata } from "next";
import DownloadClient from "./DownloadClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Download Downex | Fast & Modern Windows Download Manager",
  description:
    "Download Downex for Windows 10 and 11. Multi-connection download speeds, automatic browser integration, and seamless background updates. Just install and that's it.",
  openGraph: {
    title: "Download Downex — Fast & Modern Windows Download Manager",
    description:
      "Just install and that's it. High-speed multi-connection downloads, automatic browser integration, and zero configuration.",
    url: "https://download.gauravpatil.site",
    siteName: "Downex",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Download Downex — Fast & Modern Windows Download Manager",
    description:
      "Just install and that's it. High-speed multi-connection downloads, automatic browser integration, and zero configuration.",
  },
};

// Permanent Base 0.0.0 Endpoints on GPHost
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
  const desktopDownloadUrl = `${baseDesktopDownloadUrl}?t=${ts}`;
  const desktopShareUrl = `https://gphost.eu.cc/f/downex-desktop?t=${ts}`;

  const extensionDownloadUrl = `${baseExtensionDownloadUrl}?t=${ts}`;
  const extensionShareUrl = `https://gphost.eu.cc/f/downex-extension?t=${ts}`;

  return (
    <DownloadClient
      desktopDownloadUrl={desktopDownloadUrl}
      desktopShareUrl={desktopShareUrl}
      extensionDownloadUrl={extensionDownloadUrl}
      extensionShareUrl={extensionShareUrl}
    />
  );
}
