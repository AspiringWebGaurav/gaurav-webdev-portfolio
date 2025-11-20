/**
 * API routes for contact form submission management
 * Supports CRUD operations with Firestore integration and abuse protection
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
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CreateContactSubmissionDTO,
  UpdateContactSubmissionDTO,
  validateContactSubmission,
  sanitizeContactSubmission,
  MAX_SUBMISSIONS_PER_EMAIL_PER_DAY,
  MAX_SUBMISSIONS_PER_IP_PER_HOUR,
} from "@/types/contactSubmission";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import {
  validateContactFormSubmission,
  calculateSpamScore,
} from "@/lib/spamDetection";

const COLLECTION_NAME = "contactSubmissions";

/**
 * Helper: Convert Firestore document to ContactSubmission
 */
function firestoreToContactSubmission(doc: any) {
  const data = doc.data();

  // Helper to convert date field (handles both Timestamp and string)
  const toDate = (dateField: any): Date => {
    if (!dateField) return new Date();
    if (dateField.toDate && typeof dateField.toDate === "function") {
      return dateField.toDate();
    }
    if (typeof dateField === "string") {
      return new Date(dateField);
    }
    return new Date();
  };

  return {
    id: doc.id,
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    repliedAt: data.repliedAt ? toDate(data.repliedAt) : undefined,
  };
}

/**
 * Helper: Check rate limits (simplified to avoid Firebase index requirements)
 */
async function checkRateLimits(
  email: string,
  ipAddress?: string
): Promise<{ allowed: boolean; error?: string }> {
  try {
    const submissionsRef = collection(db, COLLECTION_NAME);

    // Fetch all submissions and filter in memory to avoid compound queries
    const allSubmissionsSnapshot = await getDocs(submissionsRef);

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    let emailCount = 0;
    let ipCount = 0;

    allSubmissionsSnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.()?.getTime() || 0;

      // Check email rate limit (3 per day)
      if (
        data.email?.toLowerCase() === email.toLowerCase() &&
        createdAt >= oneDayAgo
      ) {
        emailCount++;
      }

      // Check IP rate limit (5 per hour)
      if (
        ipAddress &&
        data.ipAddress === ipAddress &&
        createdAt >= oneHourAgo
      ) {
        ipCount++;
      }
    });

    if (emailCount >= MAX_SUBMISSIONS_PER_EMAIL_PER_DAY) {
      return {
        allowed: false,
        error:
          "Maximum submissions per day reached. Please try again tomorrow.",
      };
    }

    if (ipAddress && ipCount >= MAX_SUBMISSIONS_PER_IP_PER_HOUR) {
      return {
        allowed: false,
        error:
          "Too many submissions from this location. Please try again later.",
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking rate limits:", error);
    // Fail open - allow submission if rate limit check fails
    return { allowed: true };
  }
}

/**
 * GET - Fetch all contact submissions
 */
export async function GET(request: NextRequest) {
  try {
    const submissionsRef = collection(db, COLLECTION_NAME);
    const q = query(submissionsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const submissions = snapshot.docs.map((doc) => {
      const submission = firestoreToContactSubmission(doc);
      return {
        ...submission,
        createdAt: submission.createdAt.toISOString(),
        updatedAt: submission.updatedAt.toISOString(),
        repliedAt: submission.repliedAt
          ? submission.repliedAt.toISOString()
          : undefined,
      };
    });

    return NextResponse.json(
      {
        success: true,
        submissions,
        count: submissions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch contact submissions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new contact submission
 */
export async function POST(request: NextRequest) {
  try {
    // Parse body with error handling
    let body: CreateContactSubmissionDTO & { fingerprint?: string; turnstileToken?: string };
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          validationErrors: ["Invalid or missing request body"],
        },
        { status: 400 }
      );
    }

    // Get client IP address
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // === LAYER 1: Advanced Spam Detection ===
    const spamValidation = await validateContactFormSubmission({
      name: body.name,
      email: body.email,
      message: body.message,
      honeypot: body.honeypot,
      timeSpent: body.timeSpent,
      turnstileToken: body.turnstileToken,
      turnstileSecretKey: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
      remoteIp: clientIp,
    });

    if (!spamValidation.valid) {
      console.warn('[Security] Spam detected:', {
        errors: spamValidation.errors,
        spamScore: spamValidation.spamScore,
        email: body.email,
        ip: clientIp,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Your submission could not be processed. Please ensure all fields contain valid information.",
          validationErrors: spamValidation.errors,
        },
        { status: 400 }
      );
    }

    // === LAYER 2: Rate Limiting ===
    const { response: rateLimitResponse, headers: rateLimitHeaders } = await rateLimitMiddleware(request, 'contactForm', {
      fingerprint: body.fingerprint,
      turnstileToken: body.turnstileToken,
    });
    if (rateLimitResponse) return rateLimitResponse;

    // === LAYER 3: Basic Field Validation ===
    const validationErrors = validateContactSubmission(body);
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

    // Sanitize data
    const sanitized = sanitizeContactSubmission(body);

    // === LAYER 4: Email/IP Rate Limits ===
    const rateLimitCheck = await checkRateLimits(
      sanitized.email,
      clientIp
    );
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitCheck.error,
        },
        { status: 429 }
      );
    }

    // Calculate spam score for admin review
    const spamCheck = calculateSpamScore({
      name: sanitized.name,
      email: sanitized.email,
      message: sanitized.message,
    });

    // Create submission with all security metadata
    const now = Timestamp.now();
    const data = {
      name: sanitized.name,
      email: sanitized.email,
      message: sanitized.message,
      status: "new",
      isReplied: false,
      userAgent: sanitized.userAgent || "",
      ipAddress: clientIp,
      fingerprint: body.fingerprint || "",
      spamScore: spamCheck.score,
      createdAt: now,
      updatedAt: now,
    };

    console.log('[Contact] New submission:', {
      email: sanitized.email,
      spamScore: spamCheck.score,
      ip: clientIp,
      hasFingerprint: !!body.fingerprint,
      hasTurnstile: !!body.turnstileToken,
    });

    const submissionsRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(submissionsRef, data);
    const createdDoc = await getDoc(docRef);
    const submission = firestoreToContactSubmission(createdDoc);

    const response = NextResponse.json(
      {
        success: true,
        submission: {
          ...submission,
          createdAt: submission.createdAt.toISOString(),
          updatedAt: submission.updatedAt.toISOString(),
        },
        message: "Contact form submitted successfully",
      },
      { status: 201 }
    );
    
    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    console.error("Error creating contact submission:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit contact form",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update an existing contact submission
 */
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateContactSubmissionDTO = await request.json();

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Submission ID is required",
        },
        { status: 400 }
      );
    }

    // Check if submission exists
    const submissionRef = doc(db, COLLECTION_NAME, body.id);
    const submissionSnapshot = await getDoc(submissionRef);

    if (!submissionSnapshot.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: "Submission not found",
        },
        { status: 404 }
      );
    }

    const currentData = submissionSnapshot.data();

    // IMMUTABILITY CHECK: If submission is marked as replied, REJECT any changes
    if (currentData.isReplied === true) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot modify submission that is marked as replied. Replied status is immutable.",
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (body.status !== undefined) updateData.status = body.status;
    if (body.isReplied !== undefined) updateData.isReplied = body.isReplied;
    if (body.repliedAt !== undefined)
      updateData.repliedAt = Timestamp.fromDate(body.repliedAt);
    if (body.repliedBy !== undefined) updateData.repliedBy = body.repliedBy;
    if (body.replyMessage !== undefined)
      updateData.replyMessage = body.replyMessage;

    // Update submission
    await updateDoc(submissionRef, updateData);

    // Fetch updated document
    const updatedDoc = await getDoc(submissionRef);
    const submission = firestoreToContactSubmission(updatedDoc);

    return NextResponse.json(
      {
        success: true,
        submission: {
          ...submission,
          createdAt: submission.createdAt.toISOString(),
          updatedAt: submission.updatedAt.toISOString(),
          repliedAt: submission.repliedAt
            ? submission.repliedAt.toISOString()
            : undefined,
        },
        message: "Submission updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating contact submission:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update submission",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a contact submission
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Submission ID is required",
        },
        { status: 400 }
      );
    }

    // Check if submission exists
    const submissionRef = doc(db, COLLECTION_NAME, id);
    const submissionSnapshot = await getDoc(submissionRef);

    if (!submissionSnapshot.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: "Submission not found",
        },
        { status: 404 }
      );
    }

    // Delete submission
    await deleteDoc(submissionRef);

    return NextResponse.json(
      {
        success: true,
        message: "Submission deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting contact submission:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete submission",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
