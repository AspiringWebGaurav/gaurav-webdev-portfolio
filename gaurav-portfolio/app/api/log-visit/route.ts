// app/api/log-visit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // ✅ correct path to firebase.js
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  or,
} from "firebase/firestore";

export async function POST(req: NextRequest) {
  // 🔥 DEBUG LOGS HERE
  console.log("🔥 log-visit route called");
  console.log("✅ Firebase DB instance:", db);
  try {
    console.log("🔥 /api/log-visit hit");

    const body = await req.json();
    const { uuid, visitId, ip, device, os } = body;

    if (!uuid || !visitId || !ip) {
      console.warn("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing uuid, visitId, or ip" },
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
      console.log("⚠️ Duplicate visitor found. Skipping.");
      return NextResponse.json(
        { message: "Duplicate visitor" },
        { status: 200 }
      );
    }

    await addDoc(visitorsRef, {
      uuid,
      visitId,
      ip,
      device,
      os,
      timestamp: new Date().toISOString(), // ✅ required for Firestore rule
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
