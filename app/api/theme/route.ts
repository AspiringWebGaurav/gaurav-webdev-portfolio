import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSharedCookieDomain, THEME_COOKIE_NAME, THEME_COOKIE_MAX_AGE } from "@/lib/theme/cookie";
import { getServerTheme, setServerTheme } from "@/lib/theme/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const themeSchema = z.object({
  theme: z.enum(["light", "dark"]),
});

export async function GET(req: NextRequest) {
  try {
    const cookieTheme = req.cookies.get(THEME_COOKIE_NAME)?.value;
    const authoritativeTheme =
      cookieTheme === "light" || cookieTheme === "dark"
        ? cookieTheme
        : getServerTheme();

    return NextResponse.json({
      success: true,
      theme: authoritativeTheme,
    });
  } catch {
    return NextResponse.json(
      { success: false, theme: getServerTheme() },
      { status: 500 }
    );
  }
}

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

    // 1. Authoritative single backend in-memory update
    setServerTheme(theme);

    // 2. Cookie resolution across ecosystems
    const host = req.headers.get("host") || undefined;
    const domain = getSharedCookieDomain(host);

    const res = NextResponse.json({ success: true, theme });

    res.cookies.set(THEME_COOKIE_NAME, theme, {
      path: "/",
      domain: domain || undefined,
      maxAge: THEME_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" && domain !== undefined,
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
