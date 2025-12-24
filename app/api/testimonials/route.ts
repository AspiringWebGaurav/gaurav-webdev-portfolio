/**
 * API routes for testimonial management
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
  CreateTestimonialDTO,
  UpdateTestimonialDTO,
  validateTestimonial,
  firestoreToTestimonial,
  MAX_TESTIMONIALS,
} from "@/types/testimonial";

const COLLECTION_NAME = "portfolio_testimonials";

/**
 * GET - Fetch all testimonials
 */
export async function GET(request: NextRequest) {
  try {
    const testimonialsRef = collection(db, COLLECTION_NAME);
    const q = query(testimonialsRef, orderBy("order", "asc"));
    const snapshot = await deduplicate(
      "testimonials-list",
      () => getDocs(q),
      2000
    );

    const testimonials = snapshot.docs.map((doc) => {
      const testimonial = firestoreToTestimonial(doc);
      return {
        ...testimonial,
        createdAt: testimonial.createdAt.toISOString(),
        updatedAt: testimonial.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(
      {
        success: true,
        testimonials,
        count: testimonials.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch testimonials",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new testimonial (or batch create)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if it's a batch operation
    const isBatch = Array.isArray(body);
    const testimonials = isBatch ? body : [body];

    // Validate all testimonials
    for (const testimonial of testimonials) {
      const validationErrors = validateTestimonial(testimonial);
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
    }

    // Check max testimonials limit
    const testimonialsRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(testimonialsRef);

    if (snapshot.size + testimonials.length > MAX_TESTIMONIALS) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${MAX_TESTIMONIALS} testimonials allowed. Current: ${snapshot.size}, Trying to add: ${testimonials.length}`,
        },
        { status: 400 }
      );
    }

    // Get next order number
    let nextOrder = snapshot.size + 1;
    const createdTestimonials = [];

    // Create all testimonials
    for (const testimonialData of testimonials) {
      const order = testimonialData.order ?? nextOrder++;

      const now = Timestamp.now();
      const data = {
        quote: testimonialData.quote.trim(),
        name: testimonialData.name.trim(),
        title: testimonialData.title.trim(),
        img: testimonialData.img?.trim() || "",
        order,
        isActive: testimonialData.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(testimonialsRef, data);
      const createdDoc = await getDoc(docRef);
      const testimonial = firestoreToTestimonial(createdDoc);

      createdTestimonials.push({
        ...testimonial,
        createdAt: testimonial.createdAt.toISOString(),
        updatedAt: testimonial.updatedAt.toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: true,
        testimonials: isBatch ? createdTestimonials : createdTestimonials[0],
        message: isBatch
          ? `${createdTestimonials.length} testimonials created successfully`
          : "Testimonial created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating testimonial(s):", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create testimonial(s)",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update an existing testimonial
 */
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateTestimonialDTO = await request.json();

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Testimonial ID is required",
        },
        { status: 400 }
      );
    }

    // Validate input
    const validationErrors = validateTestimonial(body);
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

    // Check if testimonial exists
    const testimonialRef = doc(db, COLLECTION_NAME, body.id);
    const testimonialSnapshot = await getDoc(testimonialRef);

    if (!testimonialSnapshot.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: "Testimonial not found",
        },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (body.quote !== undefined) updateData.quote = body.quote.trim();
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.img !== undefined) updateData.img = body.img.trim();
    if (body.order !== undefined) updateData.order = body.order;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Update document
    await updateDoc(testimonialRef, updateData);

    // Fetch updated document
    const updatedSnapshot = await getDoc(testimonialRef);
    if (!updatedSnapshot.exists()) {
      throw new Error("Failed to retrieve updated testimonial");
    }

    const testimonial = firestoreToTestimonial(updatedSnapshot);

    return NextResponse.json(
      {
        success: true,
        testimonial: {
          ...testimonial,
          createdAt: testimonial.createdAt.toISOString(),
          updatedAt: testimonial.updatedAt.toISOString(),
        },
        message: "Testimonial updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating testimonial:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update testimonial",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a testimonial
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const soft = searchParams.get("soft") === "true";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Testimonial ID is required",
        },
        { status: 400 }
      );
    }

    // Check if testimonial exists
    const testimonialRef = doc(db, COLLECTION_NAME, id);
    const testimonialSnapshot = await getDoc(testimonialRef);

    if (!testimonialSnapshot.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: "Testimonial not found",
        },
        { status: 404 }
      );
    }

    if (soft) {
      // Soft delete - move to recycle bin
      const testimonialData = testimonialSnapshot.data();
      const now = Timestamp.now();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 15);

      await addDoc(collection(db, "recycleBin"), {
        originalId: id,
        userId: "portfolio-user",
        source: "testimonial",
        data: testimonialData,
        deletedAt: now,
        expiryDate: Timestamp.fromDate(expiryDate),
        expiryDays: 15,
        deletedBy: "admin",
      });

      // Delete from original collection
      await deleteDoc(testimonialRef);

      return NextResponse.json(
        {
          success: true,
          message: "Testimonial moved to recycle bin",
        },
        { status: 200 }
      );
    }

    // Hard delete
    await deleteDoc(testimonialRef);

    return NextResponse.json(
      {
        success: true,
        message: "Testimonial deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete testimonial",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
