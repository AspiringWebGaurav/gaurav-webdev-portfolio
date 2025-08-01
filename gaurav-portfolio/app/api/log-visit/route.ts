// app/api/log-visit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin"; // Admin SDK

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "http://localhost:5173",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: NextRequest) {
  console.log("🔥 log-visit route called");

  try {
    const body = await req.json();
    const { uuid, visitId, ip, device, os } = body;

    if (!uuid || !visitId || !ip) {
      console.warn("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing uuid, visitId, or ip" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    const visitorRef = db.collection("visitors").doc(uuid);

    // Check if the document with this UUID already exists
    const existingDoc = await visitorRef.get();
    if (existingDoc.exists) {
      console.log("⚠️ Duplicate visitor detected (by UUID):", uuid);
      return NextResponse.json(
        { message: "Duplicate visitor" },
        {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    // Save new visitor using UUID as document ID
    await visitorRef.set({
      uuid,
      visitId,
      ip,
      device: device || "unknown",
      os: os || "unknown",
      timestamp: new Date().toISOString(),
      status: "active",
    });

    console.log("✅ Visitor logged:", uuid);
    return NextResponse.json(
      { message: "Visit logged" },
      {
        status: 201,
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:5173",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (err) {
    console.error("🔥 API error:", err);
    if (err instanceof Error) {
      return NextResponse.json(
        { error: err.message },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }
    return NextResponse.json(
      { error: "Unknown error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:5173",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}
