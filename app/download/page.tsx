import type { Metadata } from "next";
import DownloadClient from "./DownloadClient";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Download Downex | Fast & Modern Windows Download Manager",
  description:
    "Download Downex for Windows 10 and 11. Multi-connection download speeds, automatic browser integration, and seamless background updates. Just install and that's it.",
  openGraph: {
    title: "Download Downex — Fast & Modern Windows Download Manager",
    description:
      "Just install and that's it. High-speed multi-connection downloads, automatic browser integration, and zero configuration.",
    url: "https://downex.apps.gauravpatil.site",
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

// Permanent Base v0.0.1 Endpoints on GPHost (direct CDN delivery, 0 Vercel Origin Transfer)
const baseDesktopDownloadUrl =
  process.env.NEXT_PUBLIC_DOWNEX_DOWNLOAD_URL ||
  "https://gphost.eu.cc/raw/downex-desktop?stream=true";

const baseExtensionDownloadUrl =
  process.env.NEXT_PUBLIC_DOWNEX_EXTENSION_DOWNLOAD_URL ||
  "https://gphost.eu.cc/raw/downex-extension?stream=true";

export default function DownloadPage() {
  const desktopDownloadUrl = baseDesktopDownloadUrl;
  const desktopShareUrl = "https://gphost.eu.cc/f/downex-desktop";

  const extensionDownloadUrl = baseExtensionDownloadUrl;
  const extensionShareUrl = "https://gphost.eu.cc/f/downex-extension";

  return (
    <DownloadClient
      desktopDownloadUrl={desktopDownloadUrl}
      desktopShareUrl={desktopShareUrl}
      extensionDownloadUrl={extensionDownloadUrl}
      extensionShareUrl={extensionShareUrl}
    />
  );
}
