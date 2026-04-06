/**
 * API routes for tech stack management
 * Supports CRUD operations with Firestore integration
 * 
 * 🔥 CACHE-ENABLED: Uses 3-layer cache (Memory → Redis → Firebase)
 */

import { NextRequest, NextResponse } from "next/server";
import logger from '@/lib/logger';
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
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deduplicate } from "@/lib/requestDeduplication";
import { cacheGet, cacheInvalidate, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";
import {
  CreateTechStackDTO,
  UpdateTechStackDTO,
  validateTechStack,
  firestoreToTechStack,
  MAX_TECH_STACKS,
} from "@/types/techStack";

const COLLECTION_NAME = "portfolio_techStacks";

/**
 * Fetch tech stacks from Firebase (source of truth)
 */
async function fetchTechStacksFromFirebase() {
  const techStacksRef = collection(db, COLLECTION_NAME);
  const q = query(techStacksRef, orderBy("order", "asc"));
  const snapshot = await deduplicate(
    "tech-stacks-list",
    () => getDocs(q),
    2000
  );

  return snapshot.docs.map((doc) => {
    const item = firestoreToTechStack(doc);
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  });
}

/**
 * GET - Fetch all tech stacks
 * 🔥 CACHED: Memory (60s) → Redis (10min) → Firebase
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adminView = searchParams.get("admin") === "true";
    const bypass = searchParams.get('nocache') === 'true';

    const items = await cacheGet(
      CACHE_KEYS.TECH_STACKS,
      fetchTechStacksFromFirebase,
      {
        memoryTTL: CACHE_TTL.MEMORY_LONG,
        redisTTL: CACHE_TTL.STATIC_CONTENT,
        bypass,
      }
    );

    if (adminView) {
      return NextResponse.json(
        {
          success: true,
          items,
          count: items.length,
          cached: !bypass,
        },
        { status: 200 }
      );
    } else {
      const activeItems = items.filter((item: any) => item.isActive);
      return NextResponse.json(
        {
          success: true,
          items: activeItems,
          count: activeItems.length,
          cached: !bypass,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("[Tech Stacks API] Error fetching tech stacks:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tech stacks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new tech stack
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateTechStackDTO = await request.json();

    // Validate input
    const validationErrors = validateTechStack(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          validationErrors,
        },
        { status: 400 }
      );
    }

    // Check max limit
    const techStacksRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(techStacksRef);
    if (snapshot.size >= MAX_TECH_STACKS) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${MAX_TECH_STACKS} tech stacks allowed`,
        },
        { status: 400 }
      );
    }

    // Create the item
    const now = Timestamp.now();
    const newItem = {
      name: body.name,
      order: body.order ?? snapshot.size + 1,
      isActive: body.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(techStacksRef, newItem);
    const createdDoc = await getDoc(docRef);
    const createdItem = firestoreToTechStack(createdDoc);

    return NextResponse.json(
      {
        success: true,
        item: {
          ...createdItem,
          createdAt: createdItem.createdAt.toISOString(),
          updatedAt: createdItem.updatedAt.toISOString(),
        },
        message: "Tech stack created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating tech stack:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create tech stack",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update an existing tech stack
 */
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateTechStackDTO = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Validate input
    const validationErrors = validateTechStack(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          validationErrors,
        },
        { status: 400 }
      );
    }

    // Check if item exists
    const itemRef = doc(db, COLLECTION_NAME, body.id);
    const itemDoc = await getDoc(itemRef);

    if (!itemDoc.exists()) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    // Update the item
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    await updateDoc(itemRef, updateData);

    // Fetch updated item
    const updatedDoc = await getDoc(itemRef);
    const updatedItem = firestoreToTechStack(updatedDoc);

    return NextResponse.json(
      {
        success: true,
        item: {
          ...updatedItem,
          createdAt: updatedItem.createdAt.toISOString(),
          updatedAt: updatedItem.updatedAt.toISOString(),
        },
        message: "Tech stack updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating tech stack:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update tech stack",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a tech stack
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const soft = searchParams.get("soft") === "true";

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Check if item exists
    const itemRef = doc(db, COLLECTION_NAME, id);
    const itemDoc = await getDoc(itemRef);

    if (!itemDoc.exists()) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    if (soft) {
      // Soft delete - move to recycle bin
      const itemData = itemDoc.data();
      const now = Timestamp.now();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 15);

      await addDoc(collection(db, "recycleBin"), {
        originalId: id,
        userId: "portfolio-user",
        source: "tech-stack",
        data: itemData,
        deletedAt: now,
        expiryDate: Timestamp.fromDate(expiryDate),
        expiryDays: 15,
        deletedBy: "admin",
      });

      // Delete from original collection
      await deleteDoc(itemRef);

      return NextResponse.json(
        {
          success: true,
          message: "Tech stack moved to recycle bin",
        },
        { status: 200 }
      );
    }

    // Hard delete
    await deleteDoc(itemRef);

    return NextResponse.json(
      {
        success: true,
        message: "Tech stack deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting tech stack:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete tech stack",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
