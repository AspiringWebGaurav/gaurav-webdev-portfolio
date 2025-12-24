import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { deduplicate } from "@/lib/requestDeduplication";

// GET - Fetch notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "admin"; // Default to admin for testing

    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));

    const snapshot = await deduplicate(
      `notifications-${userId}`,
      () => getDocs(q),
      2000
    );
    const notifications = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));

    return NextResponse.json({ 
      success: true,
      notifications, 
      count: notifications.length 
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, message, data } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: "userId, type, title, and message are required" },
        { status: 400 }
      );
    }

    const notificationsRef = collection(db, "notifications");
    const newNotification = {
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: Timestamp.now(),
      data: data || {},
    };

    const docRef = await addDoc(notificationsRef, newNotification);

    return NextResponse.json(
      {
        success: true,
        notificationId: docRef.id,
        notification: {
          id: docRef.id,
          ...newNotification,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update notification (mark as read, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, userId, action } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (action === "mark-all-read") {
      const notificationsRef = collection(db, "notifications");
      const q = query(notificationsRef, where("userId", "==", userId), where("read", "==", false));

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((document) => {
        batch.update(document.ref, { read: true });
      });

      await batch.commit();

      return NextResponse.json(
        { success: true, message: "All notifications marked as read" },
        { status: 200 }
      );
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "notificationId is required for this action" },
        { status: 400 }
      );
    }

    const notificationRef = doc(db, "notifications", notificationId);

    if (action === "mark-read") {
      await updateDoc(notificationRef, { read: true });
      return NextResponse.json(
        { success: true, message: "Notification marked as read" },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete notification(s)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, userId, action } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (action === "clear-all") {
      const notificationsRef = collection(db, "notifications");
      const q = query(notificationsRef, where("userId", "==", userId));

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((document) => {
        batch.delete(document.ref);
      });

      await batch.commit();

      return NextResponse.json(
        { success: true, message: "All notifications cleared" },
        { status: 200 }
      );
    }

    if (!notificationId) {
      return NextResponse.json({ error: "notificationId is required" }, { status: 400 });
    }

    const notificationRef = doc(db, "notifications", notificationId);
    await deleteDoc(notificationRef);

    return NextResponse.json({ success: true, message: "Notification deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Failed to delete notification", details: error.message },
      { status: 500 }
    );
  }
}
