import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status"); // 'active', 'banned', or null for all
    const sortBy = searchParams.get("sortBy") || "lastVisit"; // 'lastVisit', 'firstVisit', 'visitCount'
    const sortOrder = searchParams.get("sortOrder") || "desc"; // 'asc' or 'desc'

    let query: any = db.collection("visitors");

    // Filter by status if provided
    if (status && ["active", "banned"].includes(status)) {
      query = query.where("status", "==", status);
    }

    // Sort the results
    query = query.orderBy(sortBy, sortOrder as "asc" | "desc");

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

    const visitors = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        uuid: data.uuid,
        status: data.status,
        firstVisit: data.firstVisit,
        lastVisit: data.lastVisit,
        visitCount: data.visitCount || 1,
        os: data.os,
        browser: data.browser,
        device: data.device,
        ipAddress: data.ipAddress,
        timezone: data.timezone,
        language: data.language,
        screenResolution: data.screenResolution,
        banReason: data.banReason,
        banTimestamp: data.banTimestamp,
        unbanTimestamp: data.unbanTimestamp,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    // Get total count for pagination
    const totalSnapshot = await db.collection("visitors").get();
    const totalCount = totalSnapshot.size;

    // Get status counts
    const activeSnapshot = await db
      .collection("visitors")
      .where("status", "==", "active")
      .get();
    const bannedSnapshot = await db
      .collection("visitors")
      .where("status", "==", "banned")
      .get();

    const stats = {
      total: totalCount,
      active: activeSnapshot.size,
      banned: bannedSnapshot.size,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: offset + limit < totalCount,
    };

    return NextResponse.json(
      {
        visitors,
        stats,
        pagination: {
          limit,
          offset,
          hasMore: stats.hasMore,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("🔥 Error fetching visitors list:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch visitors list",
        visitors: [],
        stats: { total: 0, active: 0, banned: 0 },
      },
      { status: 500 }
    );
  }
}

// Bulk operations for admin
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, uuids, banReason, adminId } = body;

    if (!action || !uuids || !Array.isArray(uuids)) {
      return NextResponse.json(
        { error: "Action and uuids array are required" },
        { status: 400 }
      );
    }

    if (!["ban", "unban", "delete"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'ban', 'unban', or 'delete'" },
        { status: 400 }
      );
    }

    const results = [];
    const batch = db.batch();

    for (const uuid of uuids) {
      const visitorRef = db.collection("visitors").doc(uuid);

      if (action === "delete") {
        batch.delete(visitorRef);
        results.push({ uuid, action: "deleted", success: true });
      } else {
        const updateData: any = {
          status: action === "ban" ? "banned" : "active",
          updatedAt: new Date().toISOString(),
          lastStatusChange: new Date().toISOString(),
          adminId: adminId || "system",
        };

        if (action === "ban") {
          updateData.banTimestamp = new Date().toISOString();
          updateData.banReason = banReason || "Bulk operation";
          updateData.unbanTimestamp = null;
        } else {
          updateData.unbanTimestamp = new Date().toISOString();
          updateData.banReason = null;
          updateData.banTimestamp = null;
        }

        batch.update(visitorRef, updateData);
        results.push({
          uuid,
          action: action === "ban" ? "banned" : "unbanned",
          success: true,
        });
      }
    }

    await batch.commit();

    console.log(
      `✅ Bulk ${action} operation completed for ${uuids.length} visitors`
    );

    return NextResponse.json(
      {
        message: `Bulk ${action} operation completed`,
        results,
        processedCount: uuids.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("🔥 Error in bulk operation:", error);

    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}

// Delete individual visitor (for admin) - NEW METHOD ADDED
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { uuid, adminId } = body;

    if (!uuid) {
      return NextResponse.json(
        { error: "Visitor UUID is required" },
        { status: 400 }
      );
    }

    // Check if visitor exists
    const visitorRef = db.collection("visitors").doc(uuid);
    const visitorDoc = await visitorRef.get();

    if (!visitorDoc.exists) {
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }

    // Delete the visitor
    await visitorRef.delete();

    console.log(
      `✅ Visitor ${uuid} successfully deleted by admin: ${
        adminId || "unknown"
      }`
    );

    return NextResponse.json(
      {
        message: "Visitor deleted successfully",
        uuid,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting visitor:", error);

    return NextResponse.json(
      { error: "Failed to delete visitor" },
      { status: 500 }
    );
  }
}
