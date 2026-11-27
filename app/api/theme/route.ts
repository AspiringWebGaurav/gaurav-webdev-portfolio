import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSharedCookieDomain, THEME_COOKIE_NAME, THEME_COOKIE_MAX_AGE } from "@/lib/theme/cookie";
import { getServerTheme, hasExplicitServerTheme, setServerTheme } from "@/lib/theme/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const themeSchema = z.object({
  theme: z.enum(["light", "dark"]),
});

export async function GET(req: NextRequest) {
  try {
    const host = req.headers.get("host") || undefined;
    const sharedDomain = getSharedCookieDomain(host);
    const cookieTheme = req.cookies.get(THEME_COOKIE_NAME)?.value;
    const validCookie = cookieTheme === "light" || cookieTheme === "dark" ? cookieTheme : null;

    // On localhost (where *.localhost subdomains cannot share cookies), an explicit server theme
    // on the shared Node process is the cross-subdomain source of truth; on production shared
    // domains (.gauravpatil.site), the wildcard domain cookie is authoritative across lambdas.
    const authoritativeTheme = !sharedDomain
      ? (hasExplicitServerTheme() ? getServerTheme() : validCookie || getServerTheme())
      : (validCookie || getServerTheme());

    return NextResponse.json(
      {
        success: true,
        theme: authoritativeTheme,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
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
    const forwardedProto = req.headers.get("x-forwarded-proto");
    const isHttps = forwardedProto === "https" || req.nextUrl.protocol === "https:";

    const res = NextResponse.json({ success: true, theme });

    res.cookies.set(THEME_COOKIE_NAME, theme, {
      path: "/",
      domain: domain || undefined,
      maxAge: THEME_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: isHttps && domain !== undefined,
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
