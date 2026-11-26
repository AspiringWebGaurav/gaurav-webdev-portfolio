import { NextResponse } from "next/server";
import { getCachedPublicResumeData } from "@/lib/resume/services/resume-data.service";

export const dynamic = "force-static";
export const revalidate = 300;

export async function GET() {
  try {
    const data = await getCachedPublicResumeData();
    return NextResponse.json(
      {
        status: data.status || "active",
        statusMessage: data.statusMessage || "",
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
        },
      }
    );
  } catch {
    return NextResponse.json({ status: "active", statusMessage: "" });
  }
}
