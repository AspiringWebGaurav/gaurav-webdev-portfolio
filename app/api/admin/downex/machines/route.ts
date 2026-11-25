import { NextRequest, NextResponse } from "next/server";
import { rtdbDataSource } from "@/lib/admin/datasource/rtdb";
import { getVerifiedAdminSessionFromRequest } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getVerifiedAdminSessionFromRequest(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const machinesMap =
      (await rtdbDataSource.getValue<Record<string, Record<string, unknown>>>("ecosystem/apps/downex/machines")) || {};

    const machines = Object.values(machinesMap).sort(
      (a, b) => Number(b.last_seen || 0) - Number(a.last_seen || 0)
    );

    const response = NextResponse.json({
      success: true,
      count: machines.length,
      machines,
    });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch machines";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
