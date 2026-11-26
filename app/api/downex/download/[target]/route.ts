import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const TARGET_URLS = {
  desktop: "https://gphost.eu.cc/raw/downex-desktop?stream=true",
  extension: "https://gphost.eu.cc/raw/downex-extension?stream=true",
} as const;

type TargetKey = keyof typeof TARGET_URLS;

function redirectToOrigin(targetParam: string) {
  const target = targetParam?.trim().toLowerCase() as TargetKey;
  const upstreamUrl = TARGET_URLS[target];
  if (!upstreamUrl) {
    return NextResponse.json({ error: "Unknown download target" }, { status: 404 });
  }

  // Edge-cacheable 307 redirect directly to GPHost R2 stream (0 bytes proxied through Vercel Functions)
  return NextResponse.redirect(upstreamUrl, {
    status: 307,
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ target: string }> }
) {
  const { target } = await context.params;
  return redirectToOrigin(target);
}

export async function HEAD(
  _req: NextRequest,
  context: { params: Promise<{ target: string }> }
) {
  const { target } = await context.params;
  return redirectToOrigin(target);
}
