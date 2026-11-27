import { NextRequest, NextResponse } from "next/server";
import { buildPageMarkdown, getAiPortfolioSnapshot } from "@/lib/ai/portfolio-ai-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rawHost =
    req.headers.get("x-ai-host") ||
    req.nextUrl.searchParams.get("host") ||
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "gauravpatil.site";
  const rawPath =
    req.headers.get("x-ai-path") ||
    req.nextUrl.searchParams.get("path") ||
    (req.nextUrl.pathname !== "/api/ai/markdown" ? req.nextUrl.pathname : "/");

  const snapshot = await getAiPortfolioSnapshot();
  const { markdown, canonicalUrl } = buildPageMarkdown(rawPath, rawHost, snapshot);

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      Link: `<${canonicalUrl}>; rel="canonical", </llms.txt>; rel="alternate"; type="text/plain", </llms-full.txt>; rel="alternate"; type="text/plain"`,
      "X-Robots-Tag": "noindex, follow",
    },
  });
}
