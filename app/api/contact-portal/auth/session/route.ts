/**
 * /api/contact-portal/auth/session
 * GET: Validates recruiter session cookie against Firestore and returns active status.
 * DELETE: Revokes recruiter session in Firestore and clears session cookie.
 */

import { NextResponse } from "next/server";
import {
  getRecruiterSessionFromCookies,
  createClearRecruiterSessionCookieHeader,
} from "@/lib/recruiter/services/recruiter-auth.service";
import { recruiterRepository } from "@/lib/dal/repositories/recruiter.repository";

export async function GET() {
  try {
    const session = await getRecruiterSessionFromCookies();

    if (!session.isValid || !session.payload) {
      return NextResponse.json({
        ok: true,
        data: {
          authenticated: false,
          recruiter: null,
          reason: session.error || null,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        authenticated: true,
        recruiter: {
          id: session.payload.recruiterId,
          email: session.payload.email,
          name: session.payload.name,
          company: session.payload.company,
        },
      },
    });
  } catch (err) {
    console.error("[GET /api/contact-portal/auth/session] Error:", err);
    return NextResponse.json({
      ok: true,
      data: {
        authenticated: false,
        recruiter: null,
      },
    });
  }
}

export async function DELETE() {
  try {
    const session = await getRecruiterSessionFromCookies();

    if (session.payload?.sessionId) {
      // Mark session revoked in Firestore
      await recruiterRepository.revokeSession(session.payload.sessionId);
    }

    const response = NextResponse.json({
      ok: true,
      data: { signedOut: true },
    });

    // Clear recruiter_session cookie
    response.headers.set("Set-Cookie", createClearRecruiterSessionCookieHeader());
    return response;
  } catch (err) {
    console.error("[DELETE /api/contact-portal/auth/session] Error:", err);
    const response = NextResponse.json({ ok: true, data: { signedOut: true } });
    response.headers.set("Set-Cookie", createClearRecruiterSessionCookieHeader());
    return response;
  }
}
