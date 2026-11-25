import { NextRequest, NextResponse } from "next/server";
import { rtdbDataSource } from "@/lib/admin/datasource/rtdb";
import { getVerifiedAdminSessionFromRequest } from "@/lib/admin/auth";
import {
  MarqueeNotice,
  MarqueeNoticeDirection,
  normalizeNotices,
  resolveModeMeta,
  sanitizeColor,
  sanitizeTone,
} from "@/lib/downex/notices";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NOTICES_PATH = "ecosystem/apps/downex/notices";

export async function GET(req: NextRequest) {
  const session = await getVerifiedAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawMap = await rtdbDataSource.getValue<Record<string, unknown>>(NOTICES_PATH);
    const notices = normalizeNotices(rawMap);
    return NextResponse.json({ notices });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load notices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getVerifiedAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Notice text is required" }, { status: 400 });
    }

    const tone = sanitizeTone(body.tone);
    const meta = resolveModeMeta({
      tone,
      modeLabel: typeof body.modeLabel === "string" ? body.modeLabel : undefined,
      modeColor: body.modeColor ? sanitizeColor(body.modeColor) : undefined,
    });
    const direction: MarqueeNoticeDirection = body.direction === "rtl" ? "rtl" : "ltr";
    const showCountdown = body.showCountdown === true;

    const now = Date.now();
    let expiresAt: number | null = null;
    if (typeof body.expiresAt === "number" && Number.isFinite(body.expiresAt)) {
      expiresAt = body.expiresAt;
    } else if (typeof body.durationMs === "number" && body.durationMs > 0) {
      expiresAt = now + body.durationMs;
    }

    const id = `notice-${now}-${Math.random().toString(36).slice(2, 7)}`;
    const notice: MarqueeNotice = {
      id,
      text: text.slice(0, 240),
      tone,
      modeLabel: meta.label,
      modeColor: meta.color,
      direction,
      showCountdown,
      active: true,
      createdAt: now,
      updatedAt: now,
      expiresAt,
    };

    await rtdbDataSource.setValue(`${NOTICES_PATH}/${id}`, notice);

    return NextResponse.json({ success: true, notice });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create notice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getVerifiedAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ error: "Missing notice id" }, { status: 400 });
    }

    const existing = await rtdbDataSource.getValue<MarqueeNotice>(`${NOTICES_PATH}/${id}`);
    if (!existing) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    const nextTone = body.tone ? sanitizeTone(body.tone) : existing.tone;
    const meta = resolveModeMeta({
      tone: nextTone,
      modeLabel: typeof body.modeLabel === "string" ? body.modeLabel : existing.modeLabel,
      modeColor: body.modeColor ? sanitizeColor(body.modeColor) : existing.modeColor,
    });

    const updated: MarqueeNotice = {
      ...existing,
      text:
        typeof body.text === "string" && body.text.trim()
          ? body.text.trim().slice(0, 240)
          : existing.text,
      tone: nextTone,
      modeLabel: meta.label,
      modeColor: meta.color,
      direction:
        body.direction === "rtl" || body.direction === "ltr"
          ? body.direction
          : existing.direction,
      showCountdown:
        typeof body.showCountdown === "boolean" ? body.showCountdown : existing.showCountdown,
      active: typeof body.active === "boolean" ? body.active : existing.active,
      expiresAt:
        body.expiresAt === null || typeof body.expiresAt === "number"
          ? body.expiresAt
          : existing.expiresAt,
      updatedAt: Date.now(),
    };

    await rtdbDataSource.setValue(`${NOTICES_PATH}/${id}`, updated);
    return NextResponse.json({ success: true, notice: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update notice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getVerifiedAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const urlId = req.nextUrl.searchParams.get("id");
    let id = urlId ? urlId.trim() : "";
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = typeof body.id === "string" ? body.id.trim() : "";
    }

    if (!id) {
      return NextResponse.json({ error: "Missing notice id" }, { status: 400 });
    }

    await rtdbDataSource.setValue(`${NOTICES_PATH}/${id}`, null);
    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete notice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
