import { NextRequest, NextResponse } from "next/server";
import { rtdbDataSource } from "@/lib/admin/datasource/rtdb";
import { getVerifiedAdminSessionFromRequest } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedAdminSessionFromRequest(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const hwid = (body.hwid || "").trim().toUpperCase();
    const action = (body.action || "").trim().toUpperCase(); // "BAN" or "UNBAN"
    const reason = body.reason || "Administrative suspension enforced.";

    if (!hwid) {
      return NextResponse.json({ error: "Missing hwid" }, { status: 400 });
    }

    const isBan = action === "BAN";
    const machinePath = `ecosystem/apps/downex/machines/${hwid}`;
    const existing = await rtdbDataSource.getValue<Record<string, unknown>>(machinePath);

    if (existing) {
      existing.is_banned = isBan;
      if (isBan) {
        existing.ban_reason = reason;
      } else {
        delete existing.ban_reason;
      }
      existing.updated_at = Date.now();
      await rtdbDataSource.setValue(machinePath, existing);
    } else {
      const newMachine: Record<string, unknown> = {
        hwid,
        is_banned: isBan,
        last_seen: Date.now(),
        updated_at: Date.now(),
      };
      if (isBan && reason) {
        newMachine.ban_reason = reason;
      }
      await rtdbDataSource.setValue(machinePath, newMachine);
    }

    // Set directive in RTDB for instant real-time delivery
    const directivePath = `ecosystem/apps/downex/directives/${hwid}`;
    const directivePayload: Record<string, unknown> = {
      id: `dir-${Date.now()}`,
      action: isBan ? "hardware_ban" : "hardware_unban",
      target_hwid: hwid,
      timestamp: Date.now(),
    };
    if (isBan && reason) {
      directivePayload.reason = reason;
    }

    await rtdbDataSource.setValue(directivePath, directivePayload);

    // Also forward to GPHost's events/dispatch using GPHOST_API_KEY if available
    const gphostApiKey = process.env.GPHOST_API_KEY || process.env.VITE_GPHOST_API_KEY;
    if (gphostApiKey) {
      try {
        await fetch("https://gphost.eu.cc/api/v1/releases/downex/events/dispatch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${gphostApiKey}`,
            "User-Agent": "Downex-AdminControl/1.0",
          },
          body: JSON.stringify({
            type: "remote_directive",
            app: "downex",
            target_hwid: hwid,
            task: directivePayload,
          }),
        });
      } catch (gphostErr) {
        console.warn("[Admin Directive] GPHost relay note:", gphostErr);
      }
    }

    return NextResponse.json({
      success: true,
      hwid,
      action: isBan ? "BANNED" : "UNBANNED",
      directive: directivePayload,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to dispatch directive";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
