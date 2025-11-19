/**
 * API routes for Recycle Bin management
 * Supports CRUD operations with Firestore integration
 */

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RecycleBinItem, RecycleBinItemSource } from "@/types/recycleBin";

const COLLECTION_NAME = "recycleBin";

/**
 * Helper: Convert Firestore document to RecycleBinItem
 */
function firestoreToRecycleBinItem(doc: any): RecycleBinItem {
  const data = doc.data();

  return {
    id: doc.id,
    originalId: data.originalId,
    userId: data.userId,
    source: data.source,
    data: data.data,
    deletedAt: data.deletedAt?.toDate?.()?.toISOString() || data.deletedAt,
    expiryDate: data.expiryDate?.toDate?.()?.toISOString() || data.expiryDate,
    expiryDays: data.expiryDays,
    deletedBy: data.deletedBy,
  };
}

/**
 * GET - Fetch all recycle bin items for a user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = "portfolio-user"; // Use your auth system

    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      orderBy("deletedAt", "desc")
    );

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(firestoreToRecycleBinItem);

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error: any) {
    console.error("Error fetching recycle bin items:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch recycle bin items",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Add item to recycle bin
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, data, originalId } = body;

    if (!source || !data || !originalId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: source, data, originalId",
        },
        { status: 400 }
      );
    }

    const userId = "portfolio-user";
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // Default 15 days

    const recycleBinItem = {
      originalId,
      userId,
      source: source as RecycleBinItemSource,
      data,
      deletedAt: Timestamp.fromDate(now),
      expiryDate: Timestamp.fromDate(expiryDate),
      expiryDays: 15 as 15 | 30,
      deletedBy: userId,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), recycleBinItem);

    return NextResponse.json({
      success: true,
      item: {
        id: docRef.id,
        ...recycleBinItem,
        deletedAt: now.toISOString(),
        expiryDate: expiryDate.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error adding to recycle bin:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add item to recycle bin",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update recycle bin item (extend expiry)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, expiryDays } = body;

    if (!id || !expiryDays) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: id, expiryDays",
        },
        { status: 400 }
      );
    }

    if (expiryDays !== 15 && expiryDays !== 30) {
      return NextResponse.json(
        {
          success: false,
          error: "expiryDays must be 15 or 30",
        },
        { status: 400 }
      );
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: "Item not found",
        },
        { status: 404 }
      );
    }

    const now = new Date();
    const newExpiryDate = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    await updateDoc(docRef, {
      expiryDate: Timestamp.fromDate(newExpiryDate),
      expiryDays,
    });

    return NextResponse.json({
      success: true,
      item: {
        id: docSnap.id,
        ...docSnap.data(),
        expiryDate: newExpiryDate.toISOString(),
        expiryDays,
      },
    });
  } catch (error: any) {
    console.error("Error updating recycle bin item:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update recycle bin item",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove item from recycle bin (permanent delete or restore)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const deleteAll = searchParams.get("deleteAll") === "true";

    if (deleteAll) {
      // Delete all items for user
      const userId = "portfolio-user";
      const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);

      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      return NextResponse.json({
        success: true,
        message: `Deleted ${snapshot.docs.length} items`,
      });
    }

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameter: id",
        },
        { status: 400 }
      );
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: "Item not found",
        },
        { status: 404 }
      );
    }

    // Get the data before deleting (for restore purposes)
    const itemData = firestoreToRecycleBinItem(docSnap);

    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      item: itemData,
    });
  } catch (error: any) {
    console.error("Error deleting from recycle bin:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete from recycle bin",
      },
      { status: 500 }
    );
  }
}
