import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/constants";
import { verifyAdminSession } from "@/lib/admin/auth";
import { getResumeData, updateResumeData } from "@/lib/resume/services/resume-data.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const adminSession = sessionCookie ? await verifyAdminSession(sessionCookie) : null;

    if (!adminSession) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const data = await getResumeData();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("Admin resume GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load resume data" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const adminSession = sessionCookie ? await verifyAdminSession(sessionCookie) : null;

    if (!adminSession) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const result = await updateResumeData(body);
    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error || "Failed to update resume" }, { status: 500 });
    }

    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/resume");
      revalidatePath("/");
    } catch {
      // Best-effort cache purge
    }

    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    console.error("Admin resume PUT error:", err);
    return NextResponse.json({ ok: false, error: "Failed to save resume data" }, { status: 500 });
  }
}
