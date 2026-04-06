/**
 * API routes for project management
 * Supports CRUD operations with Firestore integration
 * 
 * 🔥 CACHE-ENABLED: Uses 3-layer cache (Memory → Redis → Firebase)
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
import { cacheGet, cacheInvalidate, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";
import {
  CreateProjectDTO,
  UpdateProjectDTO,
  validateProject,
  firestoreToProject,
  MAX_PROJECTS,
} from "@/types/project";

const COLLECTION_NAME = "portfolio_projects";

/**
 * Fetch projects from Firebase (source of truth)
 */
async function fetchProjectsFromFirebase() {
  const projectsRef = collection(db, COLLECTION_NAME);
  const q = query(projectsRef, orderBy("order", "asc"));
  const snapshot = await deduplicate(
    "projects-list",
    () => getDocs(q),
    2000
  );

  return snapshot.docs.map((doc) => {
    const project = firestoreToProject(doc);
    return {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  });
}

/**
 * GET - Fetch all projects
 * 🔥 CACHED: Memory (60s) → Redis (10min) → Firebase
 */
export async function GET(request: NextRequest) {
  try {
    // Check for cache bypass
    const bypass = request.nextUrl.searchParams.get('nocache') === 'true';
    
    // Use 3-layer cache
    const projects = await cacheGet(
      CACHE_KEYS.PROJECTS,
      fetchProjectsFromFirebase,
      {
        memoryTTL: CACHE_TTL.MEMORY_LONG,
        redisTTL: CACHE_TTL.STATIC_CONTENT,
        bypass,
      }
    );

    return NextResponse.json(
      {
        success: true,
        projects,
        count: projects.length,
        cached: !bypass,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch projects",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectDTO = await request.json();

    // Validate input
    const validationErrors = validateProject(body);
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

    // Check max projects limit
    const projectsRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(projectsRef);
    if (snapshot.size >= MAX_PROJECTS) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${MAX_PROJECTS} projects allowed`,
        },
        { status: 400 }
      );
    }

    // Determine order (use provided or next available)
    let order = body.order ?? snapshot.size + 1;

    // Ensure order is within valid range
    if (order < 1) order = 1;
    if (order > MAX_PROJECTS) order = MAX_PROJECTS;

    // Create project document
    const now = Timestamp.now();
    const projectData = {
      title: body.title.trim(),
      des: body.des.trim(),
      img: body.img.trim(),
      images: body.images || [], // Support multiple images for slideshow
      iconLists: body.iconLists.map((icon) => icon.trim()),
      link: body.link.trim(),
      order,
      isActive: body.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(projectsRef, projectData);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      throw new Error("Failed to retrieve created project");
    }

    const project = firestoreToProject(docSnapshot);

    // 🔥 Invalidate cache after create
    await cacheInvalidate(CACHE_KEYS.PROJECTS, 'content');

    return NextResponse.json(
      {
        success: true,
        project: {
          ...project,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        },
        message: "Project created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create project",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update an existing project
 */
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateProjectDTO = await request.json();

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Project ID is required",
        },
        { status: 400 }
      );
    }

    // Validate input
    const validationErrors = validateProject(body);
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

    // Check if project exists
    const projectRef = doc(db, COLLECTION_NAME, body.id);
    const projectSnapshot = await getDoc(projectRef);

    if (!projectSnapshot.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 }
      );
    }

    // Prepare update data (only include fields that are provided)
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.des !== undefined) updateData.des = body.des.trim();
    if (body.img !== undefined) updateData.img = body.img.trim();
    if (body.images !== undefined) updateData.images = body.images; // Support multiple images
    if (body.iconLists !== undefined)
      updateData.iconLists = body.iconLists.map((icon) => icon.trim());
    if (body.link !== undefined) updateData.link = body.link.trim();
    if (body.order !== undefined) updateData.order = body.order;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Update document
    await updateDoc(projectRef, updateData);

    // Fetch updated document
    const updatedSnapshot = await getDoc(projectRef);
    if (!updatedSnapshot.exists()) {
      throw new Error("Failed to retrieve updated project");
    }

    const project = firestoreToProject(updatedSnapshot);

    // 🔥 Invalidate cache after update
    await cacheInvalidate(CACHE_KEYS.PROJECTS, 'content');

    return NextResponse.json(
      {
        success: true,
        project: {
          ...project,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        },
        message: "Project updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update project",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a project
 */
export async function DELETE(request: NextRequest) {
  try {
    // Support both query params and body
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    const soft = searchParams.get("soft") === "true";
    
    if (!id) {
      const body = await request.json();
      id = body.id;
    }

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Project ID is required",
        },
        { status: 400 }
      );
    }

    // Check if project exists
    const projectRef = doc(db, COLLECTION_NAME, id);
    const projectSnapshot = await getDoc(projectRef);

    if (!projectSnapshot.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 }
      );
    }

    if (soft) {
      // Soft delete - move to recycle bin
      const projectData = projectSnapshot.data();
      const now = Timestamp.now();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 15);

      await addDoc(collection(db, "recycleBin"), {
        originalId: id,
        userId: "portfolio-user",
        source: "project",
        data: projectData,
        deletedAt: now,
        expiryDate: Timestamp.fromDate(expiryDate),
        expiryDays: 15,
        deletedBy: "admin",
      });

      // Delete from original collection
      await deleteDoc(projectRef);

      // 🔥 Invalidate cache after soft delete
      await cacheInvalidate(CACHE_KEYS.PROJECTS, 'content');

      return NextResponse.json(
        {
          success: true,
          message: "Project moved to recycle bin",
        },
        { status: 200 }
      );
    }

    // Hard delete
    await deleteDoc(projectRef);

    // 🔥 Invalidate cache after hard delete
    await cacheInvalidate(CACHE_KEYS.PROJECTS, 'content');

    return NextResponse.json(
      {
        success: true,
        message: "Project deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete project",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
