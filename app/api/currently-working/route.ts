/**
 * API routes for currently working management
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
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CreateCurrentlyWorkingDTO,
  UpdateCurrentlyWorkingDTO,
  validateCurrentlyWorking,
  firestoreToCurrentlyWorking,
} from "@/types/currentlyWorking";

const COLLECTION_NAME = "portfolio_currentlyWorking";

/**
 * GET - Fetch currently working item
 * Only returns the active item for frontend display
 */
export async function GET(request: NextRequest) {
  try {
    const currentlyWorkingRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(currentlyWorkingRef);

    const items = snapshot.docs.map((doc) => {
      const item = firestoreToCurrentlyWorking(doc);
      return {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    });

    // For admin, return all items; for frontend, return only active item
    const searchParams = request.nextUrl.searchParams;
    const adminView = searchParams.get("admin") === "true";

    if (adminView) {
      return NextResponse.json(
        {
          success: true,
          items,
          count: items.length,
        },
        { status: 200 }
      );
    } else {
      // Return only the first active item for frontend
      const activeItem = items.find((item) => item.isActive);
      return NextResponse.json(
        {
          success: true,
          item: activeItem || null,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error fetching currently working:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch currently working",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new currently working item
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateCurrentlyWorkingDTO = await request.json();

    // Validate input
    const validationErrors = validateCurrentlyWorking(body);
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

    // Create the item
    const currentlyWorkingRef = collection(db, COLLECTION_NAME);
    const now = Timestamp.now();

    const newItem = {
      headingTitle: body.headingTitle,
      title: body.title,
      description: body.description,
      blogContent: body.blogContent || "",
      images: body.images || [],
      iconLists: body.iconLists,
      githubLink: body.githubLink || "",
      liveLink: body.liveLink || "",
      isActive: body.isActive ?? false,
      showBlogNotification: body.showBlogNotification ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(currentlyWorkingRef, newItem);
    const createdDoc = await getDoc(docRef);
    const createdItem = firestoreToCurrentlyWorking(createdDoc);

    return NextResponse.json(
      {
        success: true,
        item: {
          ...createdItem,
          createdAt: createdItem.createdAt.toISOString(),
          updatedAt: createdItem.updatedAt.toISOString(),
        },
        message: "Currently working item created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating currently working:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create currently working item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update an existing currently working item
 */
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateCurrentlyWorkingDTO = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Validate input
    const validationErrors = validateCurrentlyWorking(body);
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

    if (body.headingTitle !== undefined) updateData.headingTitle = body.headingTitle;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.blogContent !== undefined)
      updateData.blogContent = body.blogContent;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.iconLists !== undefined) updateData.iconLists = body.iconLists;
    if (body.githubLink !== undefined) updateData.githubLink = body.githubLink;
    if (body.liveLink !== undefined) updateData.liveLink = body.liveLink;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.showBlogNotification !== undefined)
      updateData.showBlogNotification = body.showBlogNotification;

    await updateDoc(itemRef, updateData);

    // Fetch updated item
    const updatedDoc = await getDoc(itemRef);
    const updatedItem = firestoreToCurrentlyWorking(updatedDoc);

    return NextResponse.json(
      {
        success: true,
        item: {
          ...updatedItem,
          createdAt: updatedItem.createdAt.toISOString(),
          updatedAt: updatedItem.updatedAt.toISOString(),
        },
        message: "Currently working item updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating currently working:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update currently working item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a currently working item
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

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

    // Delete the item
    await deleteDoc(itemRef);

    return NextResponse.json(
      {
        success: true,
        message: "Currently working item deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting currently working:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete currently working item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
