import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseAdmin } from "@/lib/firebase-admin";

interface BanAppealData {
  name: string;
  email: string;
  subject: string;
  message: string;
  uuid: string;
  banReason: string;
  policyReference?: string | null;
  timestamp: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: BanAppealData = await req.json();
    const { name, email, subject, message, uuid, banReason, policyReference, timestamp } = body;

    // Validate required fields
    if (!name || !email || !subject || !message || !uuid) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Store the appeal in Firestore
    const appealData = {
      name,
      email,
      subject,
      message,
      uuid,
      banReason,
      policyReference: policyReference || null,
      timestamp,
      status: "pending", // pending, reviewed, approved, rejected
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
      ipAddress:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    };

    // Save to appeals collection
    const db = requireFirebaseAdmin();
    const appealRef = await db.collection("ban_appeals").add(appealData);

    console.log("✅ Ban appeal submitted:", appealRef.id);

    // Optional: Send email notification to admin
    // You can integrate with your preferred email service here
    try {
      await sendAdminNotification(appealData, appealRef.id);
    } catch (emailError) {
      console.warn("⚠️ Failed to send admin notification:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        message: "Appeal submitted successfully",
        appealId: appealRef.id,
        status: "pending",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error processing ban appeal:", error);

    return NextResponse.json(
      { error: "Failed to submit appeal. Please try again later." },
      { status: 500 }
    );
  }
}

// Get appeals for admin dashboard
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // pending, reviewed, approved, rejected
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const db = requireFirebaseAdmin();
    let query = db.collection("ban_appeals");

    // Filter by status if provided
    if (
      status &&
      ["pending", "reviewed", "approved", "rejected"].includes(status)
    ) {
      query = query.where("status", "==", status);
    }

    // Order by submission date (newest first)
    query = query.orderBy("submittedAt", "desc");

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

    const appeals = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get total counts
    const totalSnapshot = await db.collection("ban_appeals").get();
    const pendingSnapshot = await db
      .collection("ban_appeals")
      .where("status", "==", "pending")
      .get();

    return NextResponse.json(
      {
        appeals,
        stats: {
          total: totalSnapshot.size,
          pending: pendingSnapshot.size,
          currentPage: Math.floor(offset / limit) + 1,
          hasMore: offset + limit < totalSnapshot.size,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching ban appeals:", error);

    return NextResponse.json(
      { error: "Failed to fetch appeals" },
      { status: 500 }
    );
  }
}

// Update appeal status (for admin)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { appealId, status, reviewNotes, reviewedBy } = body;

    if (!appealId || !status) {
      return NextResponse.json(
        { error: "Appeal ID and status are required" },
        { status: 400 }
      );
    }

    if (!["pending", "reviewed", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = requireFirebaseAdmin();
    const appealRef = db.collection("ban_appeals").doc(appealId);
    const appealDoc = await appealRef.get();

    if (!appealDoc.exists) {
      return NextResponse.json({ error: "Appeal not found" }, { status: 404 });
    }

    const updateData: any = {
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewedBy || "admin",
      reviewNotes: reviewNotes || null,
    };

    await appealRef.update(updateData);

    // If appeal is approved, unban the user
    if (status === "approved") {
      const appealData = appealDoc.data();
      if (appealData?.uuid) {
        try {
          const visitorRef = db.collection("visitors").doc(appealData.uuid);
          await visitorRef.update({
            status: "active",
            unbanTimestamp: new Date().toISOString(),
            banReason: null,
            banTimestamp: null,
            lastStatusChange: new Date().toISOString(),
            adminId: reviewedBy || "admin",
          });
          console.log(
            `✅ User ${appealData.uuid} unbanned due to approved appeal`
          );
        } catch (unbanError) {
          console.error("❌ Failed to unban user:", unbanError);
        }
      }
    }

    console.log(`✅ Appeal ${appealId} status updated to: ${status}`);

    return NextResponse.json(
      {
        message: "Appeal status updated successfully",
        appealId,
        status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating appeal status:", error);

    return NextResponse.json(
      { error: "Failed to update appeal status" },
      { status: 500 }
    );
  }
}

// Delete appeal (for admin) - NEW METHOD ADDED
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { appealId } = body;

    if (!appealId) {
      return NextResponse.json(
        { error: "Appeal ID is required" },
        { status: 400 }
      );
    }

    // Check if appeal exists
    const db = requireFirebaseAdmin();
    const appealRef = db.collection("ban_appeals").doc(appealId);
    const appealDoc = await appealRef.get();

    if (!appealDoc.exists) {
      return NextResponse.json({ error: "Appeal not found" }, { status: 404 });
    }

    // Delete the appeal
    await appealRef.delete();

    console.log(`✅ Appeal ${appealId} successfully deleted`);

    return NextResponse.json(
      {
        message: "Appeal deleted successfully",
        appealId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting appeal:", error);

    return NextResponse.json(
      { error: "Failed to delete appeal" },
      { status: 500 }
    );
  }
}

// Helper function to send admin notification
async function sendAdminNotification(
  appealData: BanAppealData,
  appealId: string
) {
  // This is a placeholder for email notification
  // You can integrate with EmailJS, SendGrid, or any other email service

  const notificationData = {
    to: process.env.ADMIN_EMAIL || "admin@example.com",
    subject: `New Ban Appeal: ${appealData.subject}`,
    html: `
      <h2>New Ban Appeal Submitted</h2>
      <p><strong>Appeal ID:</strong> ${appealId}</p>
      <p><strong>Name:</strong> ${appealData.name}</p>
      <p><strong>Email:</strong> ${appealData.email}</p>
      <p><strong>UUID:</strong> ${appealData.uuid}</p>
      <p><strong>Original Ban Reason:</strong> ${appealData.banReason}</p>
      <p><strong>Subject:</strong> ${appealData.subject}</p>
      <p><strong>Message:</strong></p>
      <blockquote>${appealData.message}</blockquote>
      <p><strong>Submitted:</strong> ${appealData.timestamp}</p>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin">Review in Admin Dashboard</a></p>
    `,
  };

  // Implement your email sending logic here
  console.log("📧 Admin notification prepared:", notificationData);
}
