import { NextResponse } from "next/server";
import { getResumeData } from "@/lib/resume/services/resume-data.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getResumeData();
    return NextResponse.json(
      {
        status: data.status || "active",
        statusMessage: data.statusMessage || "",
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json({ status: "active", statusMessage: "" });
  }
}
