import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  DOWNEX_DESKTOP_DOWNLOAD_URL,
  DOWNEX_EXTENSION_DOWNLOAD_URL,
  DOWNEX_GITHUB_URL,
  DOWNEX_ORIGIN,
  DOWNEX_PORTFOLIO_URL,
} from "@/lib/data/downex-seo";

export const dynamic = "force-dynamic";

function isDownexHost(rawHost: string): boolean {
  const host = rawHost.toLowerCase().split(":")[0];
  return (
    host === "downex.apps.gauravpatil.site" ||
    host === "downex.gauravpatil.site" ||
    host.startsWith("downex.apps.localhost") ||
    host.startsWith("downex.localhost")
  );
}

export async function GET() {
  const headerList = await headers();
  const rawHost = headerList.get("x-forwarded-host") || headerList.get("host") || "";

  const downexText = `# Downex — Simple Free Download Manager for Windows
> Official portal: ${DOWNEX_ORIGIN}
> Author: Gaurav Patil (${DOWNEX_PORTFOLIO_URL})
> Source Code: ${DOWNEX_GITHUB_URL}

## Identity & Disambiguation
Downex (hosted at ${DOWNEX_ORIGIN}) is a free, open-source Windows 10 and Windows 11 download manager and multi-connection IDM alternative developed by Gaurav Patil using Rust, Tokio, Tauri v2, React 19, and SQLite WAL. It is distinct from unrelated third-party download utilities at downex.app.

## Key Features
- 32-stream parallel HTTP/1.1 range splitting with dynamic tail-end work stealing
- 100% free & open source Windows utility (zero trial expiry, zero nag popups, zero ads, zero telemetry)
- Dedicated 1-by-1 sequential download queue with FIFO priority & auto-handoff
- Automatic Low-RAM (4 GB class) and Heavy-Load Eco mode optimization
- Manifest V3 companion extension for Chrome, Edge, and Brave (${DOWNEX_ORIGIN}/browser-extension)
- Crash-safe unconfirmed staging and Ed25519 Minisign signed silent OTA updates

## Official URLs
- Home & Installer (${DOWNEX_DESKTOP_DOWNLOAD_URL}): ${DOWNEX_ORIGIN}
- Browser Extension (${DOWNEX_EXTENSION_DOWNLOAD_URL}): ${DOWNEX_ORIGIN}/browser-extension
- Free IDM Alternative Comparison: ${DOWNEX_ORIGIN}/idm-alternative
- Simple Download Manager Guide: ${DOWNEX_ORIGIN}/simple-download-manager
- Open Source Rust Engine: ${DOWNEX_ORIGIN}/open-source-download-manager
- How 1-by-1 Queue Works: ${DOWNEX_ORIGIN}/how-queues-work
- FAQ: ${DOWNEX_ORIGIN}/faq
`;

  const portfolioText = `# Gaurav Patil — Portfolio & Software Ecosystem
> Canonical URL: ${DOWNEX_PORTFOLIO_URL}
> GitHub: https://github.com/AspiringWebGaurav

## Flagship Software Products
- Downex — Simple Free Download Manager (Windows 10/11 Open Source IDM Alternative): ${DOWNEX_ORIGIN}
- Case Study: ${DOWNEX_PORTFOLIO_URL}/projects/downex-download-manager
- Apps Suite Hub: https://apps.gauravpatil.site
- CP Engine (Win32 Explorer Accelerator): https://cp.apps.gauravpatil.site
- ScheduleMe (Windows Power Scheduler): https://sm.apps.gauravpatil.site
- GPN Notes (Encrypted Notes): https://gpn.apps.gauravpatil.site
`;

  const body = isDownexHost(rawHost) ? downexText : portfolioText;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
