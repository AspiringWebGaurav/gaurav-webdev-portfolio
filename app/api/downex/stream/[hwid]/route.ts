import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/admin/firebase-admin";
import { filterActiveNotices, normalizeNotices } from "@/lib/downex/notices";
import { isValidDownexHwid, normalizeDownexHwid } from "@/lib/downex/machines";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connected event with SSE auto-reconnect retry directive
      controller.enqueue(
        encoder.encode(
          `retry: 1500\nevent: connected\ndata: ${JSON.stringify({ status: "connected", hwid, timestamp: Date.now() })}\n\n`
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

      // Self-healing atomic upsert: always guarantees complete machine fields including hwid
      machineRef.transaction((current) => {
        const now = Date.now();
        const existing = (current && typeof current === "object" ? current : {}) as Record<string, unknown>;
        return {
          ...existing,
          hwid,
          version: typeof existing.version === "string" && existing.version ? existing.version : "0.0.1",
          os: typeof existing.os === "string" && existing.os ? existing.os : "Windows 11 x64",
          first_seen: typeof existing.first_seen === "number" && existing.first_seen > 0 ? existing.first_seen : now,
          last_seen: now,
          last_ip: existing.last_ip || clientIp,
          is_banned: existing.is_banned === true,
          is_connected: true,
        };
      }).catch(() => {});

      // 2. Listen for instantaneous push events from Firebase (directives + global marquee notices)
      const listener = directiveRef.on("value", (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const jsonVal = JSON.stringify(val);
          controller.enqueue(encoder.encode(`event: directive\ndata: ${jsonVal}\n\n`));
        }
      });

      let isInitialNoticesPush = true;
      const noticesListener = noticesRef.on("value", (snapshot) => {
        try {
          const rawMap = snapshot.exists() ? (snapshot.val() as Record<string, unknown>) : {};
          const notices = filterActiveNotices(normalizeNotices(rawMap));
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
          // Stream might be closed
        }
      });

      // 3. Keepalive heartbeat comment every 25 seconds & presence refresh every 75s
      let tickCount = 0;
      const keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
          tickCount++;
          if (tickCount % 3 === 0) {
            machineRef.child("last_seen").set(Date.now()).catch(() => {});
          }
        } catch {
          clearInterval(keepaliveInterval);
          directiveRef.off("value", listener);
          noticesRef.off("value", noticesListener);
          machineRef.update({
            hwid,
            is_connected: false,
            last_seen: Date.now(),
          }).catch(() => {});
        }
      }, 25000);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepaliveInterval);
        directiveRef.off("value", listener);
        noticesRef.off("value", noticesListener);
        machineRef.update({
          hwid,
          is_connected: false,
          last_seen: Date.now(),
        }).catch(() => {});
      });
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
