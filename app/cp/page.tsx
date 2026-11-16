import type { Metadata } from "next";
import CpClient from "./CpClient";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Download CP | Fast Windows Copy & Paste App",
  description:
    "Fast and simple file copying for Windows. Move large files and folders quickly without slowing down your computer. Just install and copy.",
  openGraph: {
    title: "Download CP — Fast Windows Copy & Paste App",
    description:
      "Copy. Paste. Faster. Move files and folders on Windows with high speed, quiet background operation, and zero lag.",
    url: "https://cp.apps.gauravpatil.site",
    siteName: "CP Engine",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Download CP — Fast Windows Copy & Paste App",
    description:
      "Copy. Paste. Faster. Move files and folders on Windows with high speed and zero lag.",
  },
};

// Permanent Base 0.0.1 Endpoints on GPHost (Cloudflare R2 Global CDN)
// Exact raw binary direct stream: https://gphost.eu.cc/raw/cp-desktop (same as downex-desktop)
// Locked, immutable, zero Vercel serverless quota consumption
const baseDesktopDownloadUrl = (
  process.env.NEXT_PUBLIC_CP_DOWNLOAD_URL ||
  "https://gphost.eu.cc/raw/cp-desktop"
).split("?")[0];

const baseDesktopShareUrl = (
  process.env.NEXT_PUBLIC_CP_SHARE_URL ||
  "https://gphost.eu.cc/f/cp-desktop"
).split("?")[0];

export default function CpDownloadPage() {
  return (
    <CpClient
      desktopDownloadUrl={baseDesktopDownloadUrl}
      desktopShareUrl={baseDesktopShareUrl}
    />
  );
}
