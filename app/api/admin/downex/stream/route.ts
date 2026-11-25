import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/admin/firebase-admin";
import { getVerifiedAdminSessionFromRequest } from "@/lib/admin/auth";
import { normalizeNotices } from "@/lib/downex/notices";
import { normalizeMachinesMap } from "@/lib/downex/machines";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ status: "connected", timestamp: Date.now() })}\n\n`
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

      // Push real-time snapshot whenever any machine connects, changes status, or heartbeats
      const listener = machinesRef.on("value", (snapshot) => {
        try {
          const map = (snapshot.val() || {}) as Record<string, Record<string, unknown>>;
          const machines = normalizeMachinesMap(map);
          controller.enqueue(
            encoder.encode(`event: machines\ndata: ${JSON.stringify({ count: machines.length, machines })}\n\n`)
          );
        } catch {
          // Stream might be closed
        }
      });

      const noticesListener = noticesRef.on("value", (snapshot) => {
        try {
          const rawMap = (snapshot.val() || {}) as Record<string, unknown>;
          const notices = normalizeNotices(rawMap);
          controller.enqueue(
            encoder.encode(`event: notices\ndata: ${JSON.stringify({ count: notices.length, notices })}\n\n`)
          );
        } catch {
          // Stream might be closed
        }
      });

      // Heartbeat comment every 25 seconds
      const keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepaliveInterval);
          machinesRef.off("value", listener);
          noticesRef.off("value", noticesListener);
        }
      }, 25000);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepaliveInterval);
        machinesRef.off("value", listener);
        noticesRef.off("value", noticesListener);
      });
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
