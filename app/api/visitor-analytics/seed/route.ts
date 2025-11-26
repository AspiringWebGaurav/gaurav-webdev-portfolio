/**
 * Seed Visitor Analytics Data API (Admin Only)
 * POST endpoint to populate test data
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/firebaseAdmin";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const locations = [
  { country: "United States", countryCode: "US", city: "New York", timezone: "America/New_York" },
  { country: "United Kingdom", countryCode: "GB", city: "London", timezone: "Europe/London" },
  { country: "India", countryCode: "IN", city: "Bangalore", timezone: "Asia/Kolkata" },
  { country: "Canada", countryCode: "CA", city: "Toronto", timezone: "America/Toronto" },
  { country: "Germany", countryCode: "DE", city: "Berlin", timezone: "Europe/Berlin" },
  { country: "Australia", countryCode: "AU", city: "Sydney", timezone: "Australia/Sydney" },
  { country: "Japan", countryCode: "JP", city: "Tokyo", timezone: "Asia/Tokyo" },
  { country: "France", countryCode: "FR", city: "Paris", timezone: "Europe/Paris" },
];

const devices = [
  { deviceClass: "desktop" as const, os: "Windows", browser: "Chrome", browserVersion: "120" },
  { deviceClass: "desktop" as const, os: "macOS", browser: "Safari", browserVersion: "17" },
  { deviceClass: "mobile" as const, os: "iOS", browser: "Safari", browserVersion: "17" },
  { deviceClass: "mobile" as const, os: "Android", browser: "Chrome", browserVersion: "120" },
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPastDate(daysAgo: number): Date {
  const now = Date.now();
  const pastMs = daysAgo * 24 * 60 * 60 * 1000;
  const randomMs = Math.random() * pastMs;
  return new Date(now - randomMs);
}

export async function POST(request: NextRequest) {
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

    // Create 20 test visitors
    const visitors = [];
    for (let i = 0; i < 20; i++) {
      const visitorId = `visitor_test_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
      const location = randomElement(locations);
      const device = randomElement(devices);
      const firstVisit = randomPastDate(30);
      const totalVisits = randomInt(1, 10);
      const totalSessions = randomInt(totalVisits, totalVisits * 2);
      const averageSessionDuration = randomInt(30, 300);
      const totalActiveTime = averageSessionDuration * totalSessions;
      const totalPageViews = randomInt(totalSessions, totalSessions * 5);
      const totalBubbleOpens = randomInt(0, Math.floor(totalSessions * 0.5));
      const totalInteractions = randomInt(0, totalPageViews);
      const resumeViews = randomInt(0, 3);
      const resumeDownloads = randomInt(0, resumeViews);
      const formSubmissions = randomInt(0, 1);
      
      const isActive = Math.random() < 0.15; // 15% active
      const lastVisit = isActive ? new Date() : randomPastDate(7);

      const visitorData = {
        firstVisit: Timestamp.fromDate(firstVisit),
        lastVisit: Timestamp.fromDate(lastVisit),
        totalVisits,
        totalSessions,
        averageSessionDuration,
        totalActiveTime,
        totalPageViews,
        totalBubbleOpens,
        totalInteractions,
        resumeViews,
        resumeDownloads,
        formSubmissions,
        currentStatus: isActive ? "active" : "offline",
        deviceClass: device.deviceClass,
        deviceString: `${device.os} · ${device.browser}`,
        geoLocation: location,
        geoHistory: [location],
        banned: false,
        createdAt: Timestamp.fromDate(firstVisit),
        updatedAt: Timestamp.fromDate(lastVisit),
      };

      await adminDb.collection("og_uuid").doc(visitorId).set(visitorData);
      visitors.push(visitorId);

      // Create 1-2 sessions per visitor
      const sessionCount = randomInt(1, 2);
      for (let j = 0; j < sessionCount; j++) {
        const sessionId = `session_${visitorId}_${j}`;
        const startTime = new Date(
          firstVisit.getTime() + Math.random() * (lastVisit.getTime() - firstVisit.getTime())
        );
        const duration = randomInt(30, 300);
        const endTime = new Date(startTime.getTime() + duration * 1000);
        const sessionIsActive = j === sessionCount - 1 && isActive;

        const sessionData = {
          visitorId,
          startTime: Timestamp.fromDate(startTime),
          endTime: sessionIsActive ? null : Timestamp.fromDate(endTime),
          duration: sessionIsActive ? null : duration,
          pageViews: randomInt(1, 5),
          bubbleOpens: randomInt(0, 2),
          interactions: randomInt(0, 3),
          deviceSnapshot: {
            deviceClass: device.deviceClass,
            os: device.os,
            browser: device.browser,
            browserVersion: device.browserVersion,
            viewportWidth: device.deviceClass === "desktop" ? 1920 : 375,
            viewportHeight: device.deviceClass === "desktop" ? 1080 : 667,
            userAgent: `Mozilla/5.0 (${device.os}) ${device.browser}/${device.browserVersion}`,
            networkQuality: "unknown",
          },
          geoLocation: location,
          referrerSource: randomElement(["direct", "search", "social"]),
          isActive: sessionIsActive,
        };

        await adminDb.collection("visitorSessions").doc(sessionId).set(sessionData);

        // Create 3-5 events per session
        const eventCount = randomInt(3, 5);
        for (let k = 0; k < eventCount; k++) {
          const eventTimestamp = new Date(
            startTime.getTime() + (k * duration * 1000 / eventCount)
          );
          const eventTypes = ["page_view", "bubble_open", "resume_view"];
          
          await adminDb.collection("visitorEvents").add({
            visitorId,
            sessionId,
            eventType: randomElement(eventTypes),
            timestamp: Timestamp.fromDate(eventTimestamp),
            metadata: {
              page: randomElement(["/", "/projects", "/about"]),
              serverTimestamp: eventTimestamp.toISOString(),
            },
          });
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Created ${visitors.length} test visitors with sessions and events`,
        visitorIds: visitors,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error seeding visitor analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to seed data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
