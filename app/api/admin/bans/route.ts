import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseAdmin } from "@/lib/firebase-admin";

// Create a new ban record
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uuid, reason, customReason, banCategory, policyReference, adminId, timestamp, isActive } = body;

    if (!uuid || !reason || !adminId) {
      return NextResponse.json(
        { error: "UUID, reason, and adminId are required" },
        { status: 400 }
      );
    }

    const banData = {
      uuid,
      reason,
      customReason: customReason || null,
      banCategory: banCategory || 'normal',
      policyReference: policyReference || null,
      adminId,
      timestamp: timestamp || new Date().toISOString(),
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in /bans/{uuid} collection
    const db = requireFirebaseAdmin();
    await db.collection("bans").doc(uuid).set(banData);
    
    console.log(`✅ Ban record created for UUID: ${uuid}`);

    return NextResponse.json(
      {
        message: "Ban record created successfully",
        uuid,
        banData
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ Error creating ban record:", error);
    
    return NextResponse.json(
      { error: "Failed to create ban record" },
      { status: 500 }
    );
  }
}

// Get ban records
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uuid = searchParams.get('uuid');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const db = requireFirebaseAdmin();
    let query = db.collection("bans");

    // Filter by UUID if provided
    if (uuid) {
      const banDoc = await db.collection("bans").doc(uuid).get();
      
      if (!banDoc.exists) {
        return NextResponse.json(
          { error: "Ban record not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          ban: {
            id: banDoc.id,
            ...banDoc.data()
          }
        },
        { status: 200 }
      );
    }

    // Filter by active status if requested
    if (activeOnly) {
      query = query.where('isActive', '==', true);
    }

    // Order by timestamp (newest first)
    query = query.orderBy('timestamp', 'desc');

    // Apply pagination
    if (offset > 0) {
      const offsetSnapshot = await query.limit(offset).get();
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }

    query = query.limit(limit);
    const snapshot = await query.get();

    const bans = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get total counts
    const totalSnapshot = await db.collection("bans").get();
    const activeSnapshot = await db.collection("bans").where('isActive', '==', true).get();

    return NextResponse.json(
      {
        bans,
        stats: {
          total: totalSnapshot.size,
          active: activeSnapshot.size,
          currentPage: Math.floor(offset / limit) + 1,
          hasMore: (offset + limit) < totalSnapshot.size
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Error fetching ban records:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch ban records" },
      { status: 500 }
    );
  }
}

// Update ban record
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { uuid, isActive, adminId } = body;

    if (!uuid) {
      return NextResponse.json(
        { error: "UUID is required" },
        { status: 400 }
      );
    }

    const db = requireFirebaseAdmin();
    const banRef = db.collection("bans").doc(uuid);
    const banDoc = await banRef.get();

    if (!banDoc.exists) {
      return NextResponse.json(
        { error: "Ban record not found" },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (adminId) {
      updateData.lastModifiedBy = adminId;
    }

    // Handle ban category updates
    if (body.banCategory) {
      updateData.banCategory = body.banCategory;
    }

    // Handle policy reference updates
    if (body.policyReference) {
      updateData.policyReference = body.policyReference;
    }

    await banRef.update(updateData);

    console.log(`✅ Ban record updated for UUID: ${uuid}`);

    return NextResponse.json(
      {
        message: "Ban record updated successfully",
        uuid
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Error updating ban record:", error);
    
    return NextResponse.json(
      { error: "Failed to update ban record" },
      { status: 500 }
    );
  }
}

// Delete ban record
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uuid = searchParams.get('uuid');

    if (!uuid) {
      return NextResponse.json(
        { error: "UUID is required" },
        { status: 400 }
      );
    }

    const db = requireFirebaseAdmin();
    const banRef = db.collection("bans").doc(uuid);
    const banDoc = await banRef.get();

    if (!banDoc.exists) {
      return NextResponse.json(
        { error: "Ban record not found" },
        { status: 404 }
      );
    }

    await banRef.delete();

    console.log(`✅ Ban record deleted for UUID: ${uuid}`);

    return NextResponse.json(
      {
        message: "Ban record deleted successfully",
        uuid
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Error deleting ban record:", error);
    
    return NextResponse.json(
      { error: "Failed to delete ban record" },
      { status: 500 }
    );
  }
}