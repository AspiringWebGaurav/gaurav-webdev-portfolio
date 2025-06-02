// app/api/update-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// ✅ Handle OPTIONS requests for preflight (CORS)
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // Or replace with admin panel origin
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const { uuid, status } = await req.json();

    if (!uuid || !["banned", "active"].includes(status)) {
      return NextResponse.json({ error: "Invalid UUID or status" }, { status: 400, headers });
    }

    const querySnap = await db
      .collection("visitors")
      .where("uuid", "==", uuid)
      .limit(1)
      .get();

    if (querySnap.empty) {
      return NextResponse.json({ error: `No visitor found with uuid ${uuid}` }, { status: 404, headers });
    }

    const docRef = querySnap.docs[0].ref;
    await docRef.update({ status });

    return NextResponse.json({ message: "Status updated" }, { status: 200, headers });
  } catch (error) {
    console.error("❌ Failed to update visitor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers });
  }
}
