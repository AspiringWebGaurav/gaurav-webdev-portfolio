/**
 * POST /api/contact-portal/resume/email
 * One-click resume dispatch directly to the authenticated recruiter's verified email.
 */

import { NextResponse } from "next/server";
import { getRecruiterSessionFromCookies } from "@/lib/recruiter/services/recruiter-auth.service";
import { dispatchRecruiterResumeEmail } from "@/lib/email/brevo";
import { recruiterRepository } from "@/lib/dal/repositories/recruiter.repository";
import crypto from "crypto";

export async function POST() {
  try {
    const session = await getRecruiterSessionFromCookies();

    if (!session.isValid || !session.payload) {
      return NextResponse.json(
        { ok: false, error: "Please authenticate to request a resume delivery." },
        { status: 401 }
      );
    }

    const { email, name, company, recruiterId } = session.payload;

    const emailResult = await dispatchRecruiterResumeEmail({
      email,
      name,
      company,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { ok: false, error: "Failed to dispatch resume email. Please try again or use direct download." },
        { status: 500 }
      );
    }

    // Log engagement event
    const now = Date.now();
    recruiterRepository
      .logActivity({
        id: `act_${now}_${crypto.randomBytes(4).toString("hex")}`,
        recruiterId,
        email,
        company,
        action: "EMAIL_RESUME",
        timestamp: now,
        clientIp: "server_dispatch",
      })
      .catch(() => {});

    recruiterRepository.touchProfileActivity(recruiterId, "EMAIL_RESUME").catch(() => {});

    return NextResponse.json({
      ok: true,
      message: `Resume successfully dispatched to ${email}`,
    });
  } catch (err) {
    console.error("[POST /api/contact-portal/resume/email] Error:", err);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred while sending the resume." },
      { status: 500 }
    );
  }
}
