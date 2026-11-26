import { NextRequest, NextResponse } from "next/server";
import { rtdbDataSource } from "@/lib/admin/datasource/rtdb";
import { filterActiveNotices, normalizeNotices } from "@/lib/downex/notices";
import { isValidDownexHwid, normalizeDownexHwid } from "@/lib/downex/machines";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hwid = normalizeDownexHwid(body.hwid);

    if (!isValidDownexHwid(hwid)) {
      return NextResponse.json(
        { error: "Invalid or missing hwid" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const path = `ecosystem/apps/downex/machines/${hwid}`;
    const [existing, rawNotices] = await Promise.all([
      rtdbDataSource.getValue<Record<string, unknown>>(path),
      rtdbDataSource.getValue<Record<string, unknown>>("ecosystem/apps/downex/notices"),
    ]);

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const isBanned = existing?.is_banned === true;
    const banReason = (existing?.ban_reason as string) || undefined;

    const updated = {
      hwid,
      version: body.version || (existing?.version as string) || "0.0.1",
      os: body.os || (existing?.os as string) || "Windows 11 x64",
      last_seen: Date.now(),
      first_seen: (existing?.first_seen as number) || Date.now(),
      is_banned: isBanned,
      is_connected: existing?.is_connected === true,
      ban_reason: banReason || null,
      last_ip: clientIp,
    };

    await rtdbDataSource.setValue(path, updated);

    const notices = filterActiveNotices(normalizeNotices(rawNotices));

    return NextResponse.json(
      {
        status: "ok",
        hwid,
        is_banned: isBanned,
        reason: banReason,
        notices,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to attest machine";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
