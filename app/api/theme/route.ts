import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const themeSchema = z.object({
  theme: z.enum(["light", "dark"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = themeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid theme payload" },
        { status: 400 }
      );
    }

    const { theme } = parsed.data;
    const res = NextResponse.json({ success: true, theme });

    res.cookies.set("theme", theme, {
      path: "/",
      maxAge: 31536000, // 1 year
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false, // Must be accessible to the pre-paint head script
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "Failed to persist theme" },
      { status: 500 }
    );
  }
}
