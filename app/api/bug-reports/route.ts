/**
 * API routes for bug report management
 * Supports CRUD operations with Firestore integration and attachment handling
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
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { deduplicate } from "@/lib/requestDeduplication";
import {
  CreateBugReportDTO,
  UpdateBugReportDTO,
  BugReport,
  BugAttachment,
  validateBugReport,
  sanitizeBugReport,
  generateReferenceId,
  calculateBugReportSpamScore,
  MAX_BUG_REPORTS_PER_IP_PER_HOUR,
  MAX_BUG_REPORTS_PER_EMAIL_PER_DAY,
} from "@/types/bugReport";

const COLLECTION_NAME = "bugReports";
const STORAGE_PATH = "bug-attachments";

/**
 * Helper: Convert Firestore document to BugReport
 */
function firestoreToBugReport(doc: any): BugReport {
  const data = doc.data();

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
    reporterName: data.reporterName,
    reporterEmail: data.reporterEmail,
    title: data.title,
    severity: data.severity,
    stepsToReproduce: data.stepsToReproduce,
    actualBehavior: data.actualBehavior,
    category: data.category,
    expectedBehavior: data.expectedBehavior,
    url: data.url,
    browserInfo: data.browserInfo,
    attachments: (data.attachments || []).map((att: any) => ({
      ...att,
      uploadedAt: toDate(att.uploadedAt),
    })),
    status: data.status || "new",
    adminNotes: (data.adminNotes || []).map((note: any) => ({
      ...note,
      createdAt: toDate(note.createdAt),
    })),
    assignedTo: data.assignedTo,
    resolvedAt: data.resolvedAt ? toDate(data.resolvedAt) : undefined,
    resolvedBy: data.resolvedBy,
    duplicateOf: data.duplicateOf,
    userAgent: data.userAgent,
    ipAddress: data.ipAddress,
    fingerprint: data.fingerprint,
    spamScore: data.spamScore,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

/**
 * Helper: Check rate limits
 */
async function checkRateLimits(
  email?: string,
  ipAddress?: string
): Promise<{ allowed: boolean; error?: string }> {
  try {
    const reportsRef = collection(db, COLLECTION_NAME);
    const allReportsSnapshot = await getDocs(reportsRef);

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    let emailCount = 0;
    let ipCount = 0;

    allReportsSnapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.()?.getTime() || 0;

      // Check email rate limit
      if (
        email &&
        data.reporterEmail?.toLowerCase() === email.toLowerCase() &&
        createdAt >= oneDayAgo
      ) {
        emailCount++;
      }

      // Check IP rate limit
      if (ipAddress && data.ipAddress === ipAddress && createdAt >= oneHourAgo) {
        ipCount++;
      }
    });

    if (email && emailCount >= MAX_BUG_REPORTS_PER_EMAIL_PER_DAY) {
      return {
        allowed: false,
        error: `Rate limit exceeded. Maximum ${MAX_BUG_REPORTS_PER_EMAIL_PER_DAY} bug reports per email per day.`,
      };
    }

    if (ipAddress && ipCount >= MAX_BUG_REPORTS_PER_IP_PER_HOUR) {
      return {
        allowed: false,
        error: `Rate limit exceeded. Maximum ${MAX_BUG_REPORTS_PER_IP_PER_HOUR} bug reports per hour.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return { allowed: true }; // Allow on error to not block legitimate users
  }
}

/**
 * Helper: Upload attachment to Firebase Storage
 */
async function uploadAttachment(
  bugReportId: string,
  file: File,
  index: number
): Promise<BugAttachment> {
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `${STORAGE_PATH}/${bugReportId}/${timestamp}_${index}_${sanitizedFileName}`;
  const storageRef = ref(storage, storagePath);

  // Upload file
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return {
    id: `${timestamp}_${index}`,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    url: downloadURL,
    uploadedAt: new Date(),
  };
}

/**
 * GET /api/bug-reports
 * Fetch all bug reports (admin only) or single report by ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id");

    // Fetch single report
    if (reportId) {
      const docRef = doc(db, COLLECTION_NAME, reportId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return NextResponse.json(
          { success: false, error: "Bug report not found" },
          { status: 404 }
        );
      }

      const bugReport = firestoreToBugReport(docSnap);
      return NextResponse.json({ success: true, bugReport });
    }

    // Fetch all reports (admin only - add auth check here if needed)
    const reportsRef = collection(db, COLLECTION_NAME);
    const q = query(reportsRef, orderBy("createdAt", "desc"));
    
    // Use deduplication to prevent rapid-fire duplicate calls
    const snapshot = await deduplicate(
      "bug-reports-list",
      () => getDocs(q),
      2000 // 2s TTL window
    );

    const bugReports = snapshot.docs.map((doc) => firestoreToBugReport(doc));

    return NextResponse.json({
      success: true,
      bugReports,
      count: bugReports.length,
    });
  } catch (error: any) {
    console.error("Error fetching bug reports:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch bug reports" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bug-reports
 * Create a new bug report with attachments
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract text fields
    const data: CreateBugReportDTO = {
      reporterName: formData.get("reporterName") as string,
      reporterEmail: formData.get("reporterEmail") as string,
      title: formData.get("title") as string,
      severity: formData.get("severity") as any,
      stepsToReproduce: formData.get("stepsToReproduce") as string,
      actualBehavior: formData.get("actualBehavior") as string,
      category: formData.get("category") as any,
      expectedBehavior: formData.get("expectedBehavior") as string,
      url: formData.get("url") as string,
      browserInfo: formData.get("browserInfo") as string,
      userAgent: formData.get("userAgent") as string,
      ipAddress: formData.get("ipAddress") as string,
      fingerprint: formData.get("fingerprint") as string,
      honeypot: formData.get("honeypot") as string,
      timeSpent: parseInt(formData.get("timeSpent") as string) || 0,
      turnstileToken: formData.get("turnstileToken") as string,
    };

    // Extract file attachments
    const files: File[] = [];
    for (let i = 0; i < 5; i++) {
      const file = formData.get(`attachment_${i}`) as File | null;
      if (file) files.push(file);
    }

    // Security: Check honeypot
    if (data.honeypot && data.honeypot.trim().length > 0) {
      console.warn("[Security] Honeypot triggered - possible bot");
      return NextResponse.json(
        { success: false, error: "Invalid submission" },
        { status: 400 }
      );
    }

    // Security: Check form timing
    if (data.timeSpent && data.timeSpent < 5000) {
      console.warn("[Security] Form submitted too quickly");
      return NextResponse.json(
        { success: false, error: "Please take more time to fill out the form" },
        { status: 400 }
      );
    }

    // Validate bug report
    const validation = validateBugReport(data);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    // Check rate limits
    const rateLimitCheck = await checkRateLimits(
      data.reporterEmail,
      data.ipAddress
    );
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, error: rateLimitCheck.error },
        { status: 429 }
      );
    }

    // Calculate spam score
    const spamScore = calculateBugReportSpamScore(data);

    // Sanitize data
    const sanitized = sanitizeBugReport(data);

    // Create bug report document (without attachments first)
    const now = new Date();
    const bugReportData = {
      reporterName: sanitized.reporterName || null,
      reporterEmail: sanitized.reporterEmail || null,
      title: sanitized.title,
      severity: sanitized.severity,
      stepsToReproduce: sanitized.stepsToReproduce,
      actualBehavior: sanitized.actualBehavior,
      category: sanitized.category || null,
      expectedBehavior: sanitized.expectedBehavior || null,
      url: sanitized.url || null,
      browserInfo: sanitized.browserInfo || null,
      attachments: [],
      status: "new",
      adminNotes: [],
      userAgent: data.userAgent || null,
      ipAddress: data.ipAddress || null,
      fingerprint: data.fingerprint || null,
      spamScore,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), bugReportData);

    // Upload attachments if any
    const attachments: BugAttachment[] = [];
    if (files.length > 0) {
      try {
        for (let i = 0; i < files.length; i++) {
          const attachment = await uploadAttachment(docRef.id, files[i], i);
          attachments.push(attachment);
        }

        // Update document with attachments
        await updateDoc(doc(db, COLLECTION_NAME, docRef.id), {
          attachments: attachments.map((att) => ({
            ...att,
            uploadedAt: Timestamp.fromDate(att.uploadedAt),
          })),
        });
      } catch (uploadError) {
        console.error("Error uploading attachments:", uploadError);
        // Continue anyway - report is created, just without attachments
      }
    }

    // Generate reference ID
    const referenceId = generateReferenceId(docRef.id);

    // Send notification for high/critical severity (fire and forget)
    if (sanitized.severity === "high" || sanitized.severity === "critical") {
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/bug-reports/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bugReportId: docRef.id,
          referenceId,
          title: sanitized.title,
          severity: sanitized.severity,
          reporterEmail: sanitized.reporterEmail,
        }),
      }).catch((error) => {
        console.error("Error sending bug report notification:", error);
        // Don't fail the request if notification fails
      });
    }

    return NextResponse.json({
      success: true,
      bugReportId: docRef.id,
      referenceId,
    });
  } catch (error: any) {
    console.error("Error creating bug report:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create bug report" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bug-reports
 * Update bug report status, severity, or admin fields
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates }: UpdateBugReportDTO = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Bug report ID is required" },
        { status: 400 }
      );
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Bug report not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    };

    // Convert Date to Timestamp if present
    if (updates.resolvedAt) {
      updateData.resolvedAt = Timestamp.fromDate(updates.resolvedAt);
    }

    await updateDoc(docRef, updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating bug report:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update bug report" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bug-reports
 * Delete a bug report and its attachments
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id");
    const soft = searchParams.get("soft") === "true";

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: "Bug report ID is required" },
        { status: 400 }
      );
    }

    const docRef = doc(db, COLLECTION_NAME, reportId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Bug report not found" },
        { status: 404 }
      );
    }

    const bugReport = firestoreToBugReport(docSnap);

    if (soft) {
      // Soft delete - move to recycle bin (keep attachments)
      const reportData = docSnap.data();
      const now = Timestamp.now();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 15);

      await addDoc(collection(db, "recycleBin"), {
        originalId: reportId,
        userId: "portfolio-user",
        source: "bug-report",
        data: reportData,
        deletedAt: now,
        expiryDate: Timestamp.fromDate(expiryDate),
        expiryDays: 15,
        deletedBy: "admin",
      });

      // Delete from original collection
      await deleteDoc(docRef);

      return NextResponse.json(
        {
          success: true,
          message: "Bug report moved to recycle bin",
        },
        { status: 200 }
      );
    }

    // Hard delete - remove attachments from storage
    if (bugReport.attachments && bugReport.attachments.length > 0) {
      for (const attachment of bugReport.attachments) {
        try {
          const storageRef = ref(storage, attachment.url);
          await deleteObject(storageRef);
        } catch (error) {
          console.error("Error deleting attachment:", error);
          // Continue anyway
        }
      }
    }

    // Delete document
    await deleteDoc(docRef);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting bug report:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete bug report" },
      { status: 500 }
    );
  }
}
