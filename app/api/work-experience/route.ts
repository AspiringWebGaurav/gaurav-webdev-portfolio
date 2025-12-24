/**
 * API routes for work experience management
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deduplicate } from "@/lib/requestDeduplication";
import {
  CreateWorkExperienceDTO,
  UpdateWorkExperienceDTO,
  validateWorkExperience,
  firestoreToWorkExperience,
  prepareWorkExperienceForFirestore,
  MAX_WORK_EXPERIENCES,
} from "@/types/workExperience";

const COLLECTION_NAME = "portfolio_workExperience";

/**
 * GET - Fetch all work experiences
 */
export async function GET(request: NextRequest) {
  try {
    const workExperienceRef = collection(db, COLLECTION_NAME);
    const q = query(workExperienceRef, orderBy("order", "asc"));
    const snapshot = await deduplicate(
      "work-experience-list",
      () => getDocs(q),
      2000
    );

    const workExperiences = snapshot.docs.map((doc) => {
      const experience = firestoreToWorkExperience(doc);
      return {
        ...experience,
        createdAt: experience.createdAt.toISOString(),
        updatedAt: experience.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(
      {
        success: true,
        workExperiences,
        count: workExperiences.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching work experiences:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch work experiences",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new work experience
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateWorkExperienceDTO = await request.json();

    // Validate input
    const validationErrors = validateWorkExperience(body);
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

    // Check max work experiences limit
    const workExperienceRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(workExperienceRef);
    if (snapshot.size >= MAX_WORK_EXPERIENCES) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${MAX_WORK_EXPERIENCES} work experiences allowed`,
        },
        { status: 400 }
      );
    }

    // Determine order (use provided or next available)
    let order = body.order ?? snapshot.size + 1;

    // Ensure order is within valid range
    if (order < 1) order = 1;
    if (order > MAX_WORK_EXPERIENCES) order = MAX_WORK_EXPERIENCES;

    // Create work experience document
    const now = Timestamp.now();
    const workExperienceData = {
      title: body.title.trim(),
      desc: body.desc.trim(),
      thumbnail: body.thumbnail.trim(),
      company: body.company?.trim() || "",
      duration: body.duration?.trim() || "",
      location: body.location?.trim() || "",
      order,
      isActive: body.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(workExperienceRef, workExperienceData);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      throw new Error("Failed to retrieve created work experience");
    }

    const experience = firestoreToWorkExperience(docSnapshot);

    return NextResponse.json(
      {
        success: true,
        workExperience: {
          ...experience,
          createdAt: experience.createdAt.toISOString(),
          updatedAt: experience.updatedAt.toISOString(),
        },
        message: "Work experience created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating work experience:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create work experience",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update an existing work experience
 */
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateWorkExperienceDTO = await request.json();

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Work experience ID is required",
        },
        { status: 400 }
      );
    }

    // Validate input
    const validationErrors = validateWorkExperience(body);
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

    // Check if work experience exists
    const experienceRef = doc(db, COLLECTION_NAME, body.id);
    const experienceSnapshot = await getDoc(experienceRef);

    if (!experienceSnapshot.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: "Work experience not found",
        },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = prepareWorkExperienceForFirestore(body);
    updateData.updatedAt = Timestamp.now();

    // Update document
    await updateDoc(experienceRef, updateData);

    // Fetch updated document
    const updatedSnapshot = await getDoc(experienceRef);
    if (!updatedSnapshot.exists()) {
      throw new Error("Failed to retrieve updated work experience");
    }

    const experience = firestoreToWorkExperience(updatedSnapshot);

    return NextResponse.json(
      {
        success: true,
        workExperience: {
          ...experience,
          createdAt: experience.createdAt.toISOString(),
          updatedAt: experience.updatedAt.toISOString(),
        },
        message: "Work experience updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating work experience:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update work experience",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a work experience
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const soft = searchParams.get("soft") === "true";
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Work experience ID is required",
        },
        { status: 400 }
      );
    }

    // Check if work experience exists
    const experienceRef = doc(db, COLLECTION_NAME, body.id);
    const experienceSnapshot = await getDoc(experienceRef);

    if (!experienceSnapshot.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: "Work experience not found",
        },
        { status: 404 }
      );
    }

    if (soft) {
      // Soft delete - move to recycle bin
      const experienceData = experienceSnapshot.data();
      const now = Timestamp.now();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 15);

      await addDoc(collection(db, "recycleBin"), {
        originalId: body.id,
        userId: "portfolio-user",
        source: "work-experience",
        data: experienceData,
        deletedAt: now,
        expiryDate: Timestamp.fromDate(expiryDate),
        expiryDays: 15,
        deletedBy: "admin",
      });

      // Delete from original collection
      await deleteDoc(experienceRef);

      return NextResponse.json(
        {
          success: true,
          message: "Work experience moved to recycle bin",
        },
        { status: 200 }
      );
    }

    // Hard delete
    await deleteDoc(experienceRef);

    return NextResponse.json(
      {
        success: true,
        message: "Work experience deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting work experience:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete work experience",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
