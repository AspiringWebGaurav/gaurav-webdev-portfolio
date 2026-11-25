import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DESKTOP_DOWNLOAD_PAUSED = true;

const TARGETS = {
  desktop: {
    slug: "downex-desktop",
    filename: "DownexSetup.exe",
    mimeType: "application/vnd.microsoft.portable-executable",
  },
  extension: {
    slug: "downex-browser-extension",
    filename: "downex-browser-extension.zip",
    mimeType: "application/zip",
    slugPrimary: "downex-extension",
  },
} as const;

type TargetKey = keyof typeof TARGETS;

function getUpstreamUrls(target: TargetKey): string[] {
  const slug = target === "extension" ? TARGETS.extension.slugPrimary : TARGETS.desktop.slug;
  return [
    `https://gphost.eu.cc/raw/${slug}?stream=true`,
    `https://gphost.eu.cc/raw/${slug}`,
  ];
}

async function handleDownload(
  req: NextRequest,
  context: { params: Promise<{ target: string }> },
  isHead: boolean
) {
  const { target: rawTarget } = await context.params;
  const target = rawTarget?.trim().toLowerCase() as TargetKey;

  if (target !== "desktop" && target !== "extension") {
    return NextResponse.json({ error: "Unknown download target" }, { status: 404 });
  }

  if (target === "desktop" && DESKTOP_DOWNLOAD_PAUSED) {
    return NextResponse.json(
      {
        error: "Downex for Windows downloads are temporarily paused while finalizing the release. Please check back shortly.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }

  const meta = TARGETS[target];
  const urls = getUpstreamUrls(target);
  const range = req.headers.get("range");

  let upstreamRes: Response | null = null;
  let lastError = "Upstream unavailable";

  for (const url of urls) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
      const headers: Record<string, string> = {
        "User-Agent": "Downex-Portal/1.0",
      };
      if (range) {
        headers["Range"] = range;
      }

      const res = await fetch(url, {
        method: isHead ? "HEAD" : "GET",
        headers,
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        upstreamRes = res;
        break;
      }
      lastError = `HTTP ${res.status}`;
      await res.body?.cancel().catch(() => {});
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err.message : "Fetch failed";
    }
  }

  if (!upstreamRes) {
    return NextResponse.json(
      { error: `Failed to retrieve ${meta.filename}: ${lastError}` },
      { status: 502 }
    );
  }

  const outHeaders = new Headers();
  outHeaders.set("Content-Type", meta.mimeType);
  outHeaders.set(
    "Content-Disposition",
    `attachment; filename="${meta.filename}"; filename*=UTF-8''${encodeURIComponent(meta.filename)}`
  );
  outHeaders.set("Accept-Ranges", "bytes");
  outHeaders.set("X-Content-Type-Options", "nosniff");
  outHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");

  const contentLength = upstreamRes.headers.get("content-length");
  if (contentLength) {
    outHeaders.set("Content-Length", contentLength);
  }
  const contentRange = upstreamRes.headers.get("content-range");
  if (contentRange) {
    outHeaders.set("Content-Range", contentRange);
  }
  const etag = upstreamRes.headers.get("etag");
  if (etag) {
    outHeaders.set("ETag", etag);
  }

  if (isHead) {
    await upstreamRes.body?.cancel().catch(() => {});
    return new NextResponse(null, {
      status: upstreamRes.status,
      headers: outHeaders,
    });
  }

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status === 206 ? 206 : 200,
    headers: outHeaders,
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ target: string }> }
) {
  return handleDownload(req, context, false);
}

export async function HEAD(
  req: NextRequest,
  context: { params: Promise<{ target: string }> }
) {
  return handleDownload(req, context, true);
}
