import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

// Firebase credentials (primary)
const FIREBASE_ADMIN_CREDENTIALS = {
  id: process.env.ADMIN_ID || "gaurav@admin.kop",
  password: process.env.ADMIN_PASSWORD || "5737.5737"
};

// Fallback credentials (hidden)
const FALLBACK_ADMIN_CREDENTIALS = {
  id: "gaurav.gaurav.gaurav",
  password: "5737.5737.5737"
};

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, password } = body;

    // Validate input
    if (!id || !password) {
      return NextResponse.json(
        { error: "ID and password are required" },
        { status: 400 }
      );
    }

    // Check credentials - try Firebase first, then fallback
    let isAdmin = false;
    let adminId = "";
    
    // Try Firebase credentials first
    if (id === FIREBASE_ADMIN_CREDENTIALS.id && password === FIREBASE_ADMIN_CREDENTIALS.password) {
      isAdmin = true;
      adminId = FIREBASE_ADMIN_CREDENTIALS.id;
    } 
    // Try fallback credentials if Firebase fails
    else if (id === FALLBACK_ADMIN_CREDENTIALS.id && password === FALLBACK_ADMIN_CREDENTIALS.password) {
      isAdmin = true;
      adminId = FALLBACK_ADMIN_CREDENTIALS.id;
      console.log("⚠️ Using fallback admin credentials");
    }
    
    if (!isAdmin) {
      // Add a small delay to prevent brute force attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({
      id: adminId,
      role: "admin",
      loginTime: new Date().toISOString()
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h") // Token expires in 24 hours
      .sign(JWT_SECRET);

    console.log("✅ Admin login successful:", id);

    // Set HTTP-only cookie for security
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: adminId,
          role: "admin"
        }
      },
      { status: 200 }
    );

    // Set secure cookie
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/"
    });

    return response;

  } catch (error) {
    console.error("❌ Admin login error:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Logout endpoint
export async function DELETE(req: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: "Logout successful" },
      { status: 200 }
    );

    // Clear the admin token cookie
    response.cookies.set("admin_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/"
    });

    console.log("✅ Admin logout successful");

    return response;

  } catch (error) {
    console.error("❌ Admin logout error:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}