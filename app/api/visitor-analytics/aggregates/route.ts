/**
 * Visitor Analytics Aggregates API
 * Admin-only endpoint for summary statistics and metrics
 */

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { verifyAuth } from "@/lib/firebaseAdmin";
import {
  AnalyticsAggregates,
  RegionStat,
  DeviceStat,
  BrowserStat,
  firestoreToVisitorProfile,
  ACTIVE_VISITOR_THRESHOLD_MINUTES,
} from "@/types/visitorAnalytics";

const VISITORS_COLLECTION = "visitorProfiles";
const SESSIONS_COLLECTION = "visitorSessions";

/**
 * GET - Fetch analytics aggregates (admin-only)
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

    // Parse time range from query params
    const searchParams = request.nextUrl.searchParams;
    const timeRangeParam = searchParams.get("timeRange") || "30d";
    const timeRange = parseTimeRange(timeRangeParam);

    // Fetch all visitors (or within time range)
    let visitorsQuery = query(collection(db, VISITORS_COLLECTION));
    
    if (timeRange) {
      visitorsQuery = query(
        visitorsQuery,
        where("firstVisit", ">=", Timestamp.fromDate(timeRange.start))
      );
    }

    const visitorsSnapshot = await getDocs(visitorsQuery);
    const allVisitors = visitorsSnapshot.docs.map((doc) =>
      firestoreToVisitorProfile(doc)
    );

    // Calculate active visitors (seen within threshold)
    const activeThreshold = new Date(Date.now() - ACTIVE_VISITOR_THRESHOLD_MINUTES * 60 * 1000);
    const activeVisitors = allVisitors.filter(
      (v) => v.lastVisit >= activeThreshold && v.currentStatus === "active"
    ).length;

    // Calculate new vs returning visitors
    const newVisitors = timeRange
      ? allVisitors.filter((v) => v.firstVisit >= timeRange.start).length
      : allVisitors.filter((v) => v.totalVisits === 1).length;
    
    const returningVisitors = allVisitors.length - newVisitors;

    // Calculate totals
    const totalUniqueVisitors = allVisitors.length;
    const totalSessions = allVisitors.reduce((sum, v) => sum + v.totalSessions, 0);
    const totalPageViews = allVisitors.reduce((sum, v) => sum + v.totalPageViews, 0);
    const totalInteractions = allVisitors.reduce((sum, v) => sum + v.totalInteractions, 0);
    const totalResumeViews = allVisitors.reduce((sum, v) => sum + (v.resumeViews || 0), 0);
    const totalResumeDownloads = allVisitors.reduce((sum, v) => sum + v.resumeDownloads, 0);
    const visitorsWhoDownloaded = allVisitors.filter(v => v.resumeDownloads > 0).length;
    
    // Calculate average session duration
    const totalDuration = allVisitors.reduce((sum, v) => sum + v.totalActiveTime, 0);
    const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

    // Aggregate by region (filter out Unknown/null values, but keep LOCAL and INTL)
    const regionMap = new Map<string, RegionStat>();
    allVisitors.forEach((visitor) => {
      if (visitor.geoLocation && 
          visitor.geoLocation.country && 
          visitor.geoLocation.country !== 'Unknown' &&
          visitor.geoLocation.countryCode &&
          visitor.geoLocation.countryCode !== 'XX') {
        const key = visitor.geoLocation.countryCode;
        const existing = regionMap.get(key);
        if (existing) {
          existing.visitorCount += 1;
          existing.sessionCount += visitor.totalSessions;
        } else {
          regionMap.set(key, {
            country: visitor.geoLocation.country,
            countryCode: visitor.geoLocation.countryCode,
            visitorCount: 1,
            sessionCount: visitor.totalSessions,
          });
        }
      }
    });
    const topRegions = Array.from(regionMap.values())
      .sort((a, b) => b.visitorCount - a.visitorCount)
      .slice(0, 10);

    // Aggregate by device class
    const deviceMap = new Map<string, number>();
    allVisitors.forEach((visitor) => {
      const device = visitor.deviceClass;
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });
    const topDevices: DeviceStat[] = Array.from(deviceMap.entries())
      .map(([deviceClass, count]) => ({
        deviceClass: deviceClass as any,
        count,
        percentage: (count / totalUniqueVisitors) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    // Aggregate by browser
    const browserMap = new Map<string, number>();
    allVisitors.forEach((visitor) => {
      if (visitor.deviceString) {
        const browser = visitor.deviceString.split(" · ")[1] || "Unknown";
        browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
      }
    });
    const topBrowsers: BrowserStat[] = Array.from(browserMap.entries())
      .map(([browser, count]) => ({
        browser,
        count,
        percentage: (count / totalUniqueVisitors) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Assemble aggregates
    const aggregates: AnalyticsAggregates = {
      totalUniqueVisitors,
      newVisitors,
      returningVisitors,
      averageSessionDuration,
      totalSessions,
      totalPageViews,
      totalInteractions,
      totalResumeViews,
      totalResumeDownloads,
      visitorsWhoDownloaded,
      activeVisitors,
      topRegions,
      topDevices,
      topBrowsers,
    };

    return NextResponse.json(
      {
        success: true,
        aggregates,
        timeRange: timeRange || undefined,
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error fetching analytics aggregates:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch aggregates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Helper: Parse time range from query parameter
 */
function parseTimeRange(param: string): { start: Date; end: Date } | null {
  const now = new Date();
  const end = now;
  let start: Date;

  switch (param) {
    case "24h":
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "all":
    default:
      return null;
  }

  return { start, end };
}
