/**
 * POST /api/contact-portal/track
 * Ingests high-signal recruiter telemetry events without blocking client rendering.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getRequestContext } from "@/lib/api/context";
import { getRecruiterSessionFromCookies } from "@/lib/recruiter/services/recruiter-auth.service";
import { recruiterRepository } from "@/lib/dal/repositories/recruiter.repository";
import type { RecruiterActionType, RecruiterActivityEvent } from "@/types/recruiter";

const actionEnum = z.enum([
  "AUTH_SUCCESS",
  "NAVIGATE_SECTION",
  "VIEW_PROJECT_DETAIL",
  "DOWNLOAD_RESUME",
  "EMAIL_RESUME",
  "CLICK_CALL",
  "CLICK_WHATSAPP",
  "CLICK_EMAIL",
  "CLICK_LINKEDIN",
  "CLICK_GITHUB",
  "CLICK_LIVE_PROJECT",
  "LIVE_CHAT_MESSAGE",
  "REQUEST_PHONE_OTP",
  "UNMASK_PHONE",
]);

const trackSchema = z.object({
  action: actionEnum,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { clientIp } = getRequestContext(req);
    const body = await req.json().catch(() => ({}));
    const parseResult = trackSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({ ok: false, error: "Invalid action event" }, { status: 400 });
    }

    const { action, metadata } = parseResult.data;
    const session = await getRecruiterSessionFromCookies();

    const recruiterId = session.payload?.recruiterId || "anonymous";
    const email = session.payload?.email || "anonymous";
    const company = session.payload?.company || "anonymous";
    const now = Date.now();

    const event: RecruiterActivityEvent = {
      id: `act_${now}_${crypto.randomBytes(4).toString("hex")}`,
      recruiterId,
      email,
      company,
      action: action as RecruiterActionType,
      metadata,
      timestamp: now,
      clientIp,
    };

    // Log activity asynchronously
    recruiterRepository.logActivity(event).catch(() => {});

    // Touch recruiter profile activity if authenticated
    if (session.isValid && session.payload?.recruiterId) {
      recruiterRepository
        .touchProfileActivity(session.payload.recruiterId, action)
        .catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
