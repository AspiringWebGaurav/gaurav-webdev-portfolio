/**
 * GET /api/contact-portal/protected-contact
 * Strict Data Boundary: Returns personal phone number and direct contact endpoints
 * ONLY to validated, active authenticated recruiter sessions.
 * Never accessible unauthenticated.
 */

import { NextResponse } from "next/server";
import { getRecruiterSessionFromCookies } from "@/lib/recruiter/services/recruiter-auth.service";
import type { ProtectedContactPayload } from "@/types/recruiter";

export async function GET() {
  try {
    const session = await getRecruiterSessionFromCookies();

    if (!session.isValid || !session.payload) {
      if (process.env.NODE_ENV !== "production") {
        const emails = [
          { email: "gaurav.patil@gauravpatil.site", label: "Direct Recruiter & Personal", badge: "Primary" },
          { email: "work@gauravpatil.site", label: "Consulting & Contract Proposals", badge: "Work" },
          { email: "hello@gauravpatil.site", label: "General & Auto-Reply Gateway", badge: "Hello" },
          { email: "gaurav@gauravpatil.site", label: "Core Engineering Inbox", badge: "Direct" },
        ];
        return NextResponse.json({
          ok: true,
          data: {
            phone: null,
            phoneDisplay: "•• ••••• •••••",
            whatsappUrl: null,
            secondaryPhone: null,
            secondaryPhoneDisplay: "•• ••••• •••••",
            email: "gaurav.patil@gauravpatil.site",
            emails,
            linkedin: "https://linkedin.com/in/gaurav-patil-site",
            github: "https://github.com/AspiringWebGaurav",
            isMasked: true,
          },
        });
      }

      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized. Please authenticate to view direct contact details.",
        },
        { status: 401 }
      );
    }

    const isPhoneUnmasked = Boolean(session.sessionRecord?.phoneUnmasked);

    // Read phone from server-only environment variables
    const rawPhone = process.env.RECRUITER_PHONE_NUMBER || "+918788883087";
    const rawWaNumber = process.env.RECRUITER_WHATSAPP_NUMBER || "918788883087";
    const rawSecondaryPhone = process.env.RECRUITER_SECONDARY_PHONE || "+919767783087";

    const companyName = session.payload.company || "your team";
    const recruiterName = session.payload.name || "there";
    const defaultWaMessage = encodeURIComponent(
      `Hi Gaurav, I'm ${recruiterName} from ${companyName}. I reviewed your Recruiter Portal and would like to discuss engineering opportunities.`
    );
    const whatsappUrl = `https://wa.me/${rawWaNumber.replace(/[^0-9]/g, "")}?text=${defaultWaMessage}`;

    const emails = [
      { email: "gaurav.patil@gauravpatil.site", label: "Direct Recruiter & Personal", badge: "Primary" },
      { email: "work@gauravpatil.site", label: "Consulting & Contract Proposals", badge: "Work" },
      { email: "hello@gauravpatil.site", label: "General & Auto-Reply Gateway", badge: "Hello" },
      { email: "gaurav@gauravpatil.site", label: "Core Engineering Inbox", badge: "Direct" },
    ];

    const data: ProtectedContactPayload = {
      phone: isPhoneUnmasked ? rawPhone : null,
      phoneDisplay: isPhoneUnmasked ? "+91 87888 83087" : "•• ••••• •••••",
      whatsappUrl: isPhoneUnmasked ? whatsappUrl : null,
      secondaryPhone: isPhoneUnmasked ? rawSecondaryPhone : null,
      secondaryPhoneDisplay: isPhoneUnmasked ? "+91 97677 83087" : "•• ••••• •••••",
      email: "gaurav.patil@gauravpatil.site",
      emails,
      linkedin: "https://linkedin.com/in/gaurav-patil-site",
      github: "https://github.com/AspiringWebGaurav",
      isMasked: !isPhoneUnmasked,
    };

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (err) {
    console.error("[GET /api/contact-portal/protected-contact] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to retrieve contact information." },
      { status: 500 }
    );
  }
}
