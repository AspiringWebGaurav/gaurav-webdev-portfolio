// app/api/update-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { uuid, status } = await req.json();

    if (!uuid || !["banned", "active"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid UUID or status" },
        { status: 400 }
      );
    }

    const querySnap = await db
      .collection("visitors")
      .where("uuid", "==", uuid)
      .limit(1)
      .get();

    if (querySnap.empty) {
      return NextResponse.json(
        { error: `No visitor found with uuid ${uuid}` },
        { status: 404 }
      );
    }

    const docRef = querySnap.docs[0].ref;
    await docRef.update({ status });

    return NextResponse.json({ message: "Status updated" }, { status: 200 });
  } catch (error) {
    console.error("❌ Failed to update visitor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
