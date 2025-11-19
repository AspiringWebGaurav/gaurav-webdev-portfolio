/**
 * Visitor Analytics List API
 * Admin-only endpoint for retrieving visitor profiles with filters and pagination
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

const VISITORS_COLLECTION = "visitorProfiles";
const AUDIT_LOG_COLLECTION = "analyticsAuditLogs";

/**
 * GET - Fetch visitor profiles with filters and pagination (admin-only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyAuth(idToken);
    
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
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

    // NOTE: We skip orderBy in the Firestore query to avoid composite index requirements
    // We'll sort in memory after fetching the data
    
    // Apply pagination limit (fetch more since we'll sort in memory)
    const limitValue = Math.min((params.limit || 50) * 2, 200); // Fetch 2x to ensure we have enough after filtering
    q = query(q, firestoreLimit(limitValue));

    // Execute query
    const snapshot = await getDocs(q);
    
    // Convert to typed objects
    let visitors: VisitorProfile[] = snapshot.docs.map((doc) => {
      const visitor = firestoreToVisitorProfile(doc);
      
      // Update real-time status based on last visit
      const minutesSinceLastVisit = (Date.now() - visitor.lastVisit.getTime()) / 1000 / 60;
      if (minutesSinceLastVisit > ACTIVE_VISITOR_THRESHOLD_MINUTES) {
        visitor.currentStatus = "offline";
      }
      
      return visitor;
    });

    // Apply client-side search filter if provided (search in ID or location)
    if (params.searchQuery) {
      const query = params.searchQuery.toLowerCase();
      visitors = visitors.filter(v => 
        v.id.toLowerCase().includes(query) ||
        v.geoLocation?.country?.toLowerCase().includes(query) ||
        v.geoLocation?.city?.toLowerCase().includes(query)
      );
    }

    // Sort in memory based on requested sort field
    const sortField = params.sortBy || "lastVisit";
    const sortDirection = params.sortOrder === "asc" ? 1 : -1;
    
    visitors.sort((a, b) => {
      let aVal: any = a[sortField as keyof VisitorProfile];
      let bVal: any = b[sortField as keyof VisitorProfile];
      
      // Handle Date objects
      if (aVal instanceof Date) aVal = aVal.getTime();
      if (bVal instanceof Date) bVal = bVal.getTime();
      
      // Handle undefined/null
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      return (aVal > bVal ? 1 : -1) * sortDirection;
    });

    // Apply pagination limit after sorting
    const finalLimit = Math.min(params.limit || 50, 100);
    const filteredVisitors = visitors.slice(0, finalLimit);

    // Log admin access to audit log
    await logAuditAction({
      adminId: decodedToken.uid,
      adminEmail: decodedToken.email || "unknown",
      action: "view_list",
      timestamp: new Date(),
      metadata: {
        filters: params,
        resultCount: filteredVisitors.length,
      },
    });

    return NextResponse.json(
      {
        success: true,
        visitors: filteredVisitors,
        total: filteredVisitors.length,
        page: params.page || 1,
        limit: limitValue,
        hasMore: snapshot.docs.length >= limitValue,
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error fetching visitor profiles:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch visitor profiles",
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
