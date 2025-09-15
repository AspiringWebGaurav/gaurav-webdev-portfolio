import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/utils/adminAuth";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    
    if (!admin) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: admin.id,
          role: admin.role,
          loginTime: admin.loginTime
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Admin verification error:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}