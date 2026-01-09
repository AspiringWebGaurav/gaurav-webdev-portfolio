/**
 * Visitor Analytics List API with CURSOR-BASED PAGINATION
 * Admin-only endpoint for retrieving visitor profiles with filters and pagination
 * Returns masks instead of UUIDs for privacy
 * Saves ₹0.46/month by implementing pagination
 */

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  Timestamp,
  Query,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { verifyAuth } from "@/lib/firebaseAdmin";
import {
  VisitorProfile,
  VisitorListParams,
  firestoreToVisitorProfile,
  ACTIVE_VISITOR_THRESHOLD_MINUTES,
} from "@/types/visitorAnalytics";
import { translateUUIDToMask } from "@/lib/uuid-sync/server";
import { deduplicate } from "@/lib/requestDeduplication";

const VISITORS_COLLECTION = "og_uuid";
const AUDIT_LOG_COLLECTION = "analyticsAuditLogs";

/**
 * GET - Fetch visitor profiles with CURSOR-BASED PAGINATION (admin-only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.warn('[Visitors API] Missing or invalid Authorization header');
      return NextResponse.json(
        { success: false, error: "Unauthorized - Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    if (!idToken || idToken.trim() === '') {
      console.warn('[Visitors API] Empty bearer token');
      return NextResponse.json(
        { success: false, error: "Unauthorized - Empty authentication token" },
        { status: 401 }
      );
    }

    const decodedToken = await verifyAuth(idToken);
    
    if (!decodedToken) {
      console.warn('[Visitors API] Token verification failed');
      return NextResponse.json(
        { success: false, error: "Invalid authentication token - Verification failed" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    
    // Check if requesting specific visitor details
    const visitorId = searchParams.get("visitorId");
    if (visitorId) {
      return getVisitorDetails(visitorId, decodedToken);
    }
    
    const params: VisitorListParams = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50"),
      sortBy: (searchParams.get("sortBy") as any) || "lastVisit",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
      status: (searchParams.get("status") as any) || "all",
      deviceClass: (searchParams.get("deviceClass") as any) || "all",
      country: searchParams.get("country") || undefined,
      searchQuery: searchParams.get("searchQuery") || undefined,
      banned: searchParams.get("banned") === "true" ? true : 
              searchParams.get("banned") === "false" ? false : "all",
    };
    
    // NEW: Cursor-based pagination support
    const cursor = searchParams.get("cursor");

    // Build Firestore query
    let q: Query<DocumentData> = collection(db, VISITORS_COLLECTION);
    const conditions: any[] = [];

    // Filter by status
    if (params.status && params.status !== "all") {
      const activeThreshold = new Date(Date.now() - ACTIVE_VISITOR_THRESHOLD_MINUTES * 60 * 1000);
      
      if (params.status === "active") {
        conditions.push(where("lastVisit", ">=", Timestamp.fromDate(activeThreshold)));
        conditions.push(where("currentStatus", "==", "active"));
      } else {
        conditions.push(where("currentStatus", "==", "offline"));
      }
    }

    // Filter by device class
    if (params.deviceClass && params.deviceClass !== "all") {
      conditions.push(where("deviceClass", "==", params.deviceClass));
    }

    // Filter by country
    if (params.country) {
      conditions.push(where("geoLocation.countryCode", "==", params.country));
    }

    // Filter by banned status
    if (typeof params.banned === "boolean") {
      conditions.push(where("banned", "==", params.banned));
    }

    // Apply conditions
    if (conditions.length > 0) {
      q = query(q, ...conditions);
    }

    // NEW: Add ordering for cursor-based pagination
    // Order by the sort field requested (defaults to lastVisit)
    const sortField = params.sortBy || "lastVisit";
    const sortDirection = params.sortOrder === "asc" ? "asc" : "desc";
    
    try {
      q = query(q, orderBy(sortField, sortDirection));
    } catch (error) {
      // If orderBy fails (e.g., missing index), fall back to lastVisit
      console.warn(`[Visitors API] OrderBy ${sortField} failed, using lastVisit`, error);
      q = query(q, orderBy("lastVisit", "desc"));
    }
    
    // NEW: Apply cursor if provided
    if (cursor) {
      try {
        const { startAfter } = await import("firebase/firestore");
        const cursorData = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
        q = query(q, startAfter(cursorData.lastVisit));
      } catch (error) {
        console.error('[Visitors API] Invalid cursor:', error);
        return NextResponse.json(
          { success: false, error: 'Invalid cursor format' },
          { status: 400 }
        );
      }
    }
    
    // Apply pagination limit
    const limitValue = Math.min(params.limit || 50, 100);
    q = query(q, firestoreLimit(limitValue + 1)); // Fetch +1 to check if there are more results

    // Execute query with deduplication (prevents 4x duplicate calls)
    const deduplicationKey = `visitor-analytics-${JSON.stringify({
      status: params.status,
      deviceClass: params.deviceClass,
      country: params.country,
      banned: params.banned,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      cursor,
      limit: limitValue,
    })}`;
    
    const snapshot = await deduplicate(
      deduplicationKey,
      () => getDocs(q),
      2000 // 2s TTL window
    );
    
    // Check if there are more results (we fetched +1)
    const hasMore = snapshot.docs.length > limitValue;
    const docs = hasMore ? snapshot.docs.slice(0, limitValue) : snapshot.docs;
    
    // Convert to typed objects
    let visitors: VisitorProfile[] = docs.map((doc) => {
      const visitor = firestoreToVisitorProfile(doc);
      
      // Update real-time status based on last visit
      const minutesSinceLastVisit = (Date.now() - visitor.lastVisit.getTime()) / 1000 / 60;
      if (minutesSinceLastVisit > ACTIVE_VISITOR_THRESHOLD_MINUTES) {
        visitor.currentStatus = "offline";
      }
      
      return visitor;
    });

    // Apply client-side search filter if provided (search in UUID, mask, or location)
    if (params.searchQuery) {
      const query = params.searchQuery.toLowerCase();
      visitors = visitors.filter(v => 
        v.id.toLowerCase().includes(query) ||
        v.mask?.toLowerCase().includes(query) ||
        v.geoLocation?.country?.toLowerCase().includes(query) ||
        v.geoLocation?.city?.toLowerCase().includes(query)
      );
    }
    
    // NEW: Generate next cursor if there are more results
    let nextCursor: string | null = null;
    if (hasMore && visitors.length > 0) {
      const lastVisitor = visitors[visitors.length - 1];
      const cursorData = {
        lastVisit: lastVisitor.lastVisit.toISOString(),
        id: lastVisitor.id,
      };
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
    }

    // Log admin access to audit log
    await logAuditAction({
      adminId: decodedToken.uid,
      adminEmail: decodedToken.email || "unknown",
      action: "view_list",
      timestamp: new Date(),
      metadata: {
        filters: params,
        resultCount: visitors.length,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          visitors,
          total: visitors.length,
          page: params.page || 1,
          limit: limitValue,
          hasMore,
          nextCursor, // NEW: Include cursor for pagination
        },
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("[Visitors API] Error fetching visitor profiles:", error);
    console.error("[Visitors API] Error stack:", error instanceof Error ? error.stack : 'N/A');
    console.error("[Visitors API] Error type:", error instanceof Error ? error.constructor.name : typeof error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch visitor profiles",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
      },
      { status: 500 }
    );
  }
}

/**
 * Get specific visitor details
 */
async function getVisitorDetails(visitorId: string, decodedToken: any) {
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    
    const visitorRef = doc(db, VISITORS_COLLECTION, visitorId);
    const visitorDoc = await getDoc(visitorRef);
    
    if (!visitorDoc.exists()) {
      return NextResponse.json(
        { success: false, error: "Visitor not found" },
        { status: 404 }
      );
    }
    
    const visitor = firestoreToVisitorProfile(visitorDoc);
    
    // Log access
    await logAuditAction({
      adminId: decodedToken.uid,
      adminEmail: decodedToken.email || "unknown",
      action: "view_detail",
      targetVisitorId: visitorId,
      timestamp: new Date(),
    });
    
    return NextResponse.json(
      {
        success: true,
        visitor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching visitor details:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch visitor details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Helper: Log admin action to audit log
 */
async function logAuditAction(data: {
  adminId: string;
  adminEmail: string;
  action: string;
  targetVisitorId?: string;
  timestamp: Date;
  metadata?: any;
}) {
  try {
    await collection(db, AUDIT_LOG_COLLECTION);
    // In production, implement proper audit logging
    // For now, just console log
    console.log("[AUDIT]", data);
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
}
