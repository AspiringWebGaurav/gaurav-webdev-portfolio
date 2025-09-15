import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const uuid = req.nextUrl.searchParams.get("uuid");

  if (!uuid) {
    return NextResponse.json({ error: "Missing uuid" }, { status: 400 });
  }

  try {
    const docSnap = await db.collection("visitors").doc(uuid).get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }

    const data = docSnap.data();

    if (!data || !("status" in data)) {
      return NextResponse.json(
        { error: "Invalid document structure" },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: data.status });
  } catch (error) {
    console.error("🔥 Error checking visitor status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
