import type { Metadata } from "next";
import CpClient from "./CpClient";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Download CP | High-Performance Windows Copy/Paste Engine",
  description:
    "Native Win32 Explorer file transfer accelerator. Intercepts Ctrl+C / Ctrl+V and streams files through unbuffered 4MB IOCP kernel workers. Just install and copy.",
  openGraph: {
    title: "Download CP — High-Performance Windows Copy/Paste Engine",
    description:
      "Copy. Paste. Faster. Native Win32 Explorer file transfer accelerator with unbuffered 4MB IOCP kernel streaming and zero UI flashing.",
    url: "https://cp.apps.gauravpatil.site",
    siteName: "CP Engine",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Download CP — High-Performance Windows Copy/Paste Engine",
    description:
      "Copy. Paste. Faster. Native Win32 Explorer file transfer accelerator with unbuffered 4MB IOCP kernel streaming.",
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
