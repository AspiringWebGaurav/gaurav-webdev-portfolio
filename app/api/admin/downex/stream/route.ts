import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/admin/firebase-admin";
import { getVerifiedAdminSessionFromRequest } from "@/lib/admin/auth";
import { normalizeNotices } from "@/lib/downex/notices";
import { normalizeMachinesMap } from "@/lib/downex/machines";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const session = await getVerifiedAdminSessionFromRequest(req);

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const db = getAdminDb();

  let cleanup: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;

      controller.enqueue(
        encoder.encode(
          `retry: 5000\nevent: connected\ndata: ${JSON.stringify({ status: "connected", timestamp: Date.now() })}\n\n`
        )
      );

      if (!db) {
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: "Database unavailable" })}\n\n`)
        );
        return;
      }

      const machinesRef = db.ref("ecosystem/apps/downex/machines");
      const noticesRef = db.ref("ecosystem/apps/downex/notices");

      let lastMachinesJson = "";
      const listener = machinesRef.on("value", (snapshot) => {
        if (isClosed) return;
        try {
          const map = (snapshot.val() || {}) as Record<string, Record<string, unknown>>;
          const machines = normalizeMachinesMap(map);
          const payload = JSON.stringify({ count: machines.length, machines });
          if (payload === lastMachinesJson) return;
          lastMachinesJson = payload;
          controller.enqueue(
            encoder.encode(`event: machines\ndata: ${payload}\n\n`)
          );
        } catch {
          cleanup();
        }
      });

      let lastNoticesJson = "";
      const noticesListener = noticesRef.on("value", (snapshot) => {
        if (isClosed) return;
        try {
          const rawMap = (snapshot.val() || {}) as Record<string, unknown>;
          const notices = normalizeNotices(rawMap);
          const payload = JSON.stringify({ count: notices.length, notices });
          if (payload === lastNoticesJson) return;
          lastNoticesJson = payload;
          controller.enqueue(
            encoder.encode(`event: notices\ndata: ${payload}\n\n`)
          );
        } catch {
          cleanup();
        }
      });

      const keepaliveInterval = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          cleanup();
        }
      }, 45000);

      cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        clearInterval(keepaliveInterval);
        machinesRef.off("value", listener);
        noticesRef.off("value", noticesListener);
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
    },
  });
}
