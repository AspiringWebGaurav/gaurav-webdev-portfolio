import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { isAuthorizedAdminEmail } from "@/lib/admin/auth";
import { rtdbDataSource } from "@/lib/admin/datasource/rtdb";
import { dispatchDownexAdminOtpEmail } from "@/lib/email/downex-otp";

export const dynamic = "force-dynamic";

const OTP_SECRET =
  process.env.ADMIN_OTP_SECRET ||
  process.env.ADMIN_SESSION_SECRET ||
  process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
  "downex_admin_otp_secret_key_2026";

function computeHmac(otp: string, salt: string): string {
  return crypto
    .createHmac("sha256", OTP_SECRET)
    .update(`${otp.trim()}_${salt.trim()}`)
    .digest("hex");
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.length > 2 ? local.substring(0, 2) : local.substring(0, 1);
  return `${visible}••••@${domain}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !isAuthorizedAdminEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Access denied. Only the authorized administrator account can access this portal." },
        { status: 403 }
      );
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "Direct IP";

    const userAgent = req.headers.get("user-agent") || undefined;

    // Generate random 6-digit OTP code and cryptographic salt
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString("hex");
    const otpHash = computeHmac(rawOtp, salt);
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes
    const challengeId = `dwnx_ch_${crypto.randomUUID()}`;

    const challengePayload = {
      challengeId,
      email,
      otpHash,
      salt,
      attempts: 0,
      createdAt: now,
      expiresAt,
      isConsumed: false,
      clientIp,
    };

    // Store in Firebase RTDB
    await rtdbDataSource.setValue(
      `ecosystem/apps/downex/auth_challenges/${challengeId}`,
      challengePayload
    );

    // Dispatch custom Downex framework verification email
    await dispatchDownexAdminOtpEmail({
      email,
      otp: rawOtp,
      clientIp,
      userAgent,
      expiresMinutes: 5,
    });

    return NextResponse.json({
      success: true,
      challengeId,
      maskedEmail: maskEmail(email),
      expiresAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate verification code";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
