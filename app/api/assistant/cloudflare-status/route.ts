import { NextResponse } from "next/server";
import { cloudflareRepository } from "@/lib/dal/repositories/cms/cloudflare.repository";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  try {
    const res = await cloudflareRepository.getCloudflareSettings();
    const settings = res.data;

    return NextResponse.json(
      {
        ok: true,
        isSimulatedDowntime: settings?.isSimulatedDowntime === true,
        siteKey: settings?.siteKey || "0x4AAAAAAEilFWDvwBZ3NPSK",
        maxRetryAttempts: settings?.maxRetryAttempts || 2,
        circuitBreakerEnabled: settings?.circuitBreakerEnabled !== false,
        fallbackEmailGateway: settings?.fallbackEmailGateway || "no-reply@gauravpatil.site",
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        isSimulatedDowntime: false,
        siteKey: "0x4AAAAAAEilFWDvwBZ3NPSK",
        maxRetryAttempts: 2,
        circuitBreakerEnabled: true,
        fallbackEmailGateway: "no-reply@gauravpatil.site",
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=600",
        },
      }
    );
  }
}
