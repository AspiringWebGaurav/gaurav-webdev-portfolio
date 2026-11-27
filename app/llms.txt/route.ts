import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { buildLlmsTxt, getAiPortfolioSnapshot } from "@/lib/ai/portfolio-ai-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const headerList = await headers();
  const rawHost = headerList.get("x-forwarded-host") || headerList.get("host") || "";
  const snapshot = await getAiPortfolioSnapshot();
  const body = buildLlmsTxt(rawHost, snapshot);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
