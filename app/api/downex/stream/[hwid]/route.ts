import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/admin/firebase-admin";
import { filterActiveNotices, normalizeNotices } from "@/lib/downex/notices";
import { isValidDownexHwid, normalizeDownexHwid } from "@/lib/downex/machines";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ hwid: string }> }
) {
  const { hwid: rawHwid } = await context.params;
  const hwid = normalizeDownexHwid(rawHwid);

  if (!isValidDownexHwid(hwid)) {
    return NextResponse.json({ error: "Invalid hardware ID" }, { status: 400 });
  }

  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const encoder = new TextEncoder();
  const db = getAdminDb();

  let cleanup: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;

      // 1. Send initial connected event with SSE auto-reconnect retry directive
      controller.enqueue(
        encoder.encode(
          `retry: 5000\nevent: connected\ndata: ${JSON.stringify({ status: "connected", hwid, timestamp: Date.now() })}\n\n`
        )
      );

      if (!db) {
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: "Database unavailable" })}\n\n`)
        );
        return;
      }

      const directiveRef = db.ref(`ecosystem/apps/downex/directives/${hwid}`);
      const machineRef = db.ref(`ecosystem/apps/downex/machines/${hwid}`);
      const noticesRef = db.ref("ecosystem/apps/downex/notices");

      // Lightweight presence update instead of heavy atomic transaction
      machineRef
        .once("value")
        .then((snap) => {
          if (isClosed) return;
          const now = Date.now();
          const existing = (snap.val() || {}) as Record<string, unknown>;
          return machineRef.update({
            hwid,
            version: typeof existing.version === "string" && existing.version ? existing.version : "0.0.1",
            os: typeof existing.os === "string" && existing.os ? existing.os : "Windows 11 x64",
            first_seen: typeof existing.first_seen === "number" && existing.first_seen > 0 ? existing.first_seen : now,
            last_seen: now,
            last_ip: existing.last_ip || clientIp,
            is_banned: existing.is_banned === true,
            is_connected: true,
          });
        })
        .catch(() => {});

      let lastDirectiveJson = "";
      const listener = directiveRef.on("value", (snapshot) => {
        if (isClosed || !snapshot.exists()) return;
        try {
          const jsonVal = JSON.stringify(snapshot.val());
          if (jsonVal === lastDirectiveJson) return;
          lastDirectiveJson = jsonVal;
          controller.enqueue(encoder.encode(`event: directive\ndata: ${jsonVal}\n\n`));
        } catch {
          cleanup();
        }
      });

      let isInitialNoticesPush = true;
      let lastNoticesJson = "";
      const noticesListener = noticesRef.on("value", (snapshot) => {
        if (isClosed) return;
        try {
          const rawMap = snapshot.exists() ? (snapshot.val() as Record<string, unknown>) : {};
          const notices = filterActiveNotices(normalizeNotices(rawMap));
          const serializedNotices = JSON.stringify(notices);
          if (!isInitialNoticesPush && serializedNotices === lastNoticesJson) return;
          lastNoticesJson = serializedNotices;
          const payload = {
            notices,
            is_initial: isInitialNoticesPush,
            timestamp: Date.now(),
          };
          isInitialNoticesPush = false;
          controller.enqueue(
            encoder.encode(`event: notices\ndata: ${JSON.stringify(payload)}\n\n`)
          );
        } catch {
          cleanup();
        }
      });

      // Keepalive heartbeat every 45s & presence refresh every ~135s
      let tickCount = 0;
      const keepaliveInterval = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
          tickCount++;
          if (tickCount % 3 === 0) {
            machineRef.child("last_seen").set(Date.now()).catch(() => {});
          }
        } catch {
          cleanup();
        }
      }, 45000);

      cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        clearInterval(keepaliveInterval);
        directiveRef.off("value", listener);
        noticesRef.off("value", noticesListener);
        machineRef.update({
          hwid,
          is_connected: false,
          last_seen: Date.now(),
        }).catch(() => {});
      };

      req.signal.addEventListener("abort", cleanup, { once: true });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
