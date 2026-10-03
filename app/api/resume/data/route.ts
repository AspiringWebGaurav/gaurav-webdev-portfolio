import { NextRequest, NextResponse } from "next/server";
import { getResumeData } from "@/lib/resume/services/resume-data.service";
import { verifyResumeSessionToken } from "@/lib/resume/services/resume-auth.service";
import { RESUME_SESSION_COOKIE } from "@/lib/resume/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tabToken =
      req.headers.get("x-resume-tab-token") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const cookieToken = req.cookies.get(RESUME_SESSION_COOKIE)?.value;
    const token = tabToken || cookieToken;
    const session = verifyResumeSessionToken(token);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required to view resume data.",
        },
        { status: 401 }
      );
    }

    const resumeData = await getResumeData();

    if (resumeData.status === "suspended" || resumeData.status === "hired") {
      return NextResponse.json(
        {
          success: false,
          status: resumeData.status,
          statusMessage:
            resumeData.statusMessage ||
            (resumeData.status === "hired"
              ? "Gaurav has accepted an offer and is no longer actively interviewing. Resume access is currently closed."
              : "Resume access is temporarily suspended by the candidate."),
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resumeData,
    });
  } catch (err) {
    console.error("Failed to load resume data:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load resume data" },
      { status: 500 }
    );
  }
}
