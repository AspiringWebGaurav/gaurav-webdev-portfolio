import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// Update visitor admin notes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uuid, notes, adminId } = body;

    if (!uuid || !adminId) {
      return NextResponse.json(
        { error: "UUID and adminId are required" },
        { status: 400 }
      );
    }

    const visitorRef = db.collection("visitors").doc(uuid);
    const visitorDoc = await visitorRef.get();

    if (!visitorDoc.exists) {
      return NextResponse.json(
        { error: "Visitor not found" },
        { status: 404 }
      );
    }

    const updateData: any = {
      adminNotes: notes || null,
      notesUpdatedAt: new Date().toISOString(),
      notesUpdatedBy: adminId,
      updatedAt: new Date().toISOString()
    };

    await visitorRef.update(updateData);

    console.log(`✅ Admin notes updated for visitor: ${uuid}`);

    return NextResponse.json(
      {
        message: "Admin notes updated successfully",
        uuid,
        notes
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Error updating admin notes:", error);
    
    return NextResponse.json(
      { error: "Failed to update admin notes" },
      { status: 500 }
    );
  }
}

// Get visitor admin notes
export async function GET(req: NextRequest) {
  try {
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

    return NextResponse.json(
      {
        uuid,
        adminNotes: visitorData?.adminNotes || null,
        notesUpdatedAt: visitorData?.notesUpdatedAt || null,
        notesUpdatedBy: visitorData?.notesUpdatedBy || null
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Error fetching admin notes:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch admin notes" },
      { status: 500 }
    );
  }
}

// Delete visitor admin notes
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uuid = searchParams.get('uuid');

    if (!uuid) {
      return NextResponse.json(
        { error: "UUID parameter is required" },
        { status: 400 }
      );
    }

    const visitorRef = db.collection("visitors").doc(uuid);
    const visitorDoc = await visitorRef.get();

    if (!visitorDoc.exists) {
      return NextResponse.json(
        { error: "Visitor not found" },
        { status: 404 }
      );
    }

    await visitorRef.update({
      adminNotes: null,
      notesUpdatedAt: new Date().toISOString(),
      notesUpdatedBy: null,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Admin notes deleted for visitor: ${uuid}`);

    return NextResponse.json(
      {
        message: "Admin notes deleted successfully",
        uuid
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Error deleting admin notes:", error);
    
    return NextResponse.json(
      { error: "Failed to delete admin notes" },
      { status: 500 }
    );
  }
}