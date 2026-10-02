/**
 * GET /api/admin/recruiters/export
 * Protected superadmin endpoint to export the verified recruiter roster as CSV or JSON.
 */

import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/constants";
import { verifyAdminSession } from "@/lib/admin/auth";
import { recruiterRepository } from "@/lib/dal/repositories/recruiter.repository";
import { formatSubmissionTimestamp } from "@/lib/email/brevo";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate Admin Session
    const sessionCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const adminSession = sessionCookie ? await verifyAdminSession(sessionCookie) : null;

    if (!adminSession) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch all verified recruiter profiles
    const profilesResult = await recruiterRepository.getAllProfiles(1000);
    const profiles = profilesResult.data || [];

    const format = req.nextUrl.searchParams.get("format")?.toLowerCase() || "csv";
    const dateStamp = new Date().toISOString().split("T")[0];

    if (format === "json") {
      const jsonContent = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          totalRecords: profiles.length,
          recruiters: profiles,
        },
        null,
        2
      );

      return new NextResponse(jsonContent, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="recruiters_${dateStamp}.json"`,
        },
      });
    }

    // Default: CSV Export
    const csvHeader = [
      "ID",
      "Full Name",
      "Company",
      "Work Email",
      "Phone",
      "Country Code",
      "Total Visits",
      "First Verified (IST)",
      "Last Active (IST)",
      "Last Action",
    ].join(",");

    const csvRows = profiles.map((p) => {
      const firstSeen = p.firstVerifiedAt ? `"${formatSubmissionTimestamp(new Date(p.firstVerifiedAt))}"` : '""';
      const lastSeen = p.lastActiveAt ? `"${formatSubmissionTimestamp(new Date(p.lastActiveAt))}"` : '""';
      const cleanName = `"${(p.name || "").replace(/"/g, '""')}"`;
      const cleanCompany = `"${(p.company || "").replace(/"/g, '""')}"`;
      const cleanEmail = `"${(p.email || "").replace(/"/g, '""')}"`;
      const cleanPhone = `"${(p.phone || "").replace(/"/g, '""')}"`;
      const cleanCountry = `"${p.countryCode || ""}"`;
      const cleanAction = `"${p.lastAction || ""}"`;

      return [
        `"${p.id}"`,
        cleanName,
        cleanCompany,
        cleanEmail,
        cleanPhone,
        cleanCountry,
        p.totalVisits || 1,
        firstSeen,
        lastSeen,
        cleanAction,
      ].join(",");
    });

    const csvContent = [csvHeader, ...csvRows].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="recruiters_${dateStamp}.csv"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/recruiters/export] Error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate export file" }, { status: 500 });
  }
}
