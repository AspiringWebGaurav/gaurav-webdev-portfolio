import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseAdmin } from "@/lib/firebase-admin";
import { headers } from "next/headers";
import { smartLogger } from "@/utils/smartLogger";

interface VisitorTrackingData {
  uuid: string;
  deviceFingerprint: any;
  fingerprintHash: string;
  ipAddress?: string;
  os: string;
  browser: string;
  device: string;
  userAgent: string;
  language: string;
  timezone: string;
  screenResolution: string;
  referrer: string;
  url: string;
  timestamp: string;
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: NextRequest) {
  smartLogger.browserOnly.debug("🔥 Enhanced visitor tracking route called");

  try {
    // Ensure Firebase Admin is available
    const db = requireFirebaseAdmin();
    
    const body: VisitorTrackingData = await req.json();
    const { 
      uuid, 
      deviceFingerprint, 
      fingerprintHash,
      ipAddress,
      os,
      browser,
      device,
      userAgent,
      language,
      timezone,
      screenResolution,
      referrer,
      url,
      timestamp
    } = body;

    // Validate required fields
    if (!uuid || !fingerprintHash) {
      smartLogger.api.warn("❌ Missing required fields: uuid or fingerprintHash");
      return NextResponse.json(
        { error: "Missing required fields: uuid or fingerprintHash" },
        { status: 400 }
      );
    }

    // Get additional request info
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIP = headersList.get('x-real-ip');
    const serverIP = forwardedFor?.split(',')[0] || realIP || ipAddress || 'Unknown';

    const visitorRef = db.collection("visitors").doc(uuid);

    // Check if visitor already exists
    const existingDoc = await visitorRef.get();
    
    if (existingDoc.exists) {
      // Update existing visitor
      const existingData = existingDoc.data();
      const visitCount = (existingData?.visitCount || 0) + 1;
      
      await visitorRef.update({
        lastVisit: timestamp,
        visitCount,
        ipAddress: serverIP,
        userAgent,
        url,
        referrer,
        updatedAt: new Date().toISOString()
      });

      smartLogger.browserOnly.info("✅ Existing visitor updated", { uuid, visitCount });
      
      return NextResponse.json(
        { 
          message: "Visitor updated", 
          uuid,
          visitCount,
          status: existingData?.status || 'active'
        },
        { status: 200 }
      );
    }

    // Check for potential duplicate based on fingerprint hash
    const duplicateQuery = await db
      .collection("visitors")
      .where("fingerprintHash", "==", fingerprintHash)
      .limit(1)
      .get();

    if (!duplicateQuery.empty) {
      const duplicateDoc = duplicateQuery.docs[0];
      const duplicateData = duplicateDoc.data();
      
      smartLogger.browserOnly.warn("⚠️ Potential duplicate visitor detected by fingerprint", { fingerprintHash });
      
      // Update the existing document with new UUID if different
      if (duplicateDoc.id !== uuid) {
        await duplicateDoc.ref.update({
          alternativeUUIDs: [...(duplicateData.alternativeUUIDs || []), uuid],
          lastVisit: timestamp,
          visitCount: (duplicateData.visitCount || 0) + 1,
          updatedAt: new Date().toISOString()
        });
      }
      
      return NextResponse.json(
        { 
          message: "Duplicate visitor detected", 
          uuid: duplicateDoc.id,
          visitCount: (duplicateData.visitCount || 0) + 1,
          status: duplicateData.status || 'active'
        },
        { status: 200 }
      );
    }

    // Create new visitor record
    const newVisitorData = {
      uuid,
      deviceFingerprint,
      fingerprintHash,
      ipAddress: serverIP,
      os,
      browser,
      device,
      userAgent,
      language,
      timezone,
      screenResolution,
      referrer,
      url,
      firstVisit: timestamp,
      lastVisit: timestamp,
      visitCount: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      alternativeUUIDs: []
    };

    await visitorRef.set(newVisitorData);

    smartLogger.browserOnly.info("✅ New visitor created", { uuid });
    
    return NextResponse.json(
      { 
        message: "New visitor tracked", 
        uuid,
        visitCount: 1,
        status: 'active'
      },
      { status: 201 }
    );

  } catch (error) {
    smartLogger.api.error("🔥 Enhanced visitor tracking error", error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        details: "Failed to track visitor"
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve visitor data
export async function GET(req: NextRequest) {
  try {
    // Ensure Firebase Admin is available
    const db = requireFirebaseAdmin();
    
    const { searchParams } = new URL(req.url);
    const uuid = searchParams.get('uuid');

    if (!uuid) {
      return NextResponse.json(
        { error: "UUID parameter is required" },
        { status: 400 }
      );
    }

    const visitorDoc = await db.collection("visitors").doc(uuid).get();

    if (!visitorDoc.exists) {
      return NextResponse.json(
        { error: "Visitor not found" },
        { status: 404 }
      );
    }

    const visitorData = visitorDoc.data();
    
    // Remove sensitive information
    const sanitizedData = {
      uuid: visitorData?.uuid,
      status: visitorData?.status,
      visitCount: visitorData?.visitCount,
      firstVisit: visitorData?.firstVisit,
      lastVisit: visitorData?.lastVisit,
      os: visitorData?.os,
      browser: visitorData?.browser,
      device: visitorData?.device
    };

    return NextResponse.json(sanitizedData, { status: 200 });

  } catch (error) {
    smartLogger.api.error("🔥 Error retrieving visitor data", error);
    
    return NextResponse.json(
      { error: "Failed to retrieve visitor data" },
      { status: 500 }
    );
  }
}