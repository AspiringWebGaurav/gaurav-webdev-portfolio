// app/api/log-visit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  or,
} from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uuid, visitId, ip, device, os } = body;

    if (!uuid || !visitId || !ip) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const visitorsRef = collection(db, "visitors");

    const q = query(
      visitorsRef,
      or(
        where("uuid", "==", uuid),
        where("ip", "==", ip),
        where("visitId", "==", visitId)
      )
    );

    const existing = await getDocs(q);
    if (!existing.empty) {
      return NextResponse.json(
        { message: "Duplicate visitor" },
        { status: 200 }
      );
    }

    await addDoc(visitorsRef, {
      uuid,
      visitId,
      ip,
      device: device || "unknown",
      os: os || "unknown",
      timestamp: new Date().toISOString(), // ✅ required by rules
      status: "active",
    });

    return NextResponse.json({ message: "Visit logged" }, { status: 201 });
  } catch (err) {
    console.error("Logging error:", err);
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
