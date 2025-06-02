// app/api/log-visit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin"; // Admin SDK

export async function POST(req: NextRequest) {
  console.log("🔥 log-visit route called");

  try {
    const body = await req.json();
    const { uuid, visitId, ip, device, os } = body;

    if (!uuid || !visitId || !ip) {
      console.warn("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing uuid, visitId, or ip" },
        { status: 400 }
      );
    }

    const visitorsRef = db.collection("visitors");

    // Check for duplicates by uuid, ip, or visitId
    const [uuidSnap, ipSnap, visitIdSnap] = await Promise.all([
      visitorsRef.where("uuid", "==", uuid).get(),
      visitorsRef.where("ip", "==", ip).get(),
      visitorsRef.where("visitId", "==", visitId).get(),
    ]);

    if (!uuidSnap.empty || !ipSnap.empty || !visitIdSnap.empty) {
      console.log("⚠️ Duplicate visitor found. Skipping.");
      return NextResponse.json(
        { message: "Duplicate visitor" },
        { status: 200 }
      );
    }

    await visitorsRef.add({
      uuid,
      visitId,
      ip,
      device: device || "unknown",
      os: os || "unknown",
      timestamp: new Date().toISOString(),
      status: "active",
    });

    console.log("✅ Visitor logged:", { uuid, visitId });
    return NextResponse.json({ message: "Visit logged" }, { status: 201 });
  } catch (err) {
    console.error("🔥 API error:", err);
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
