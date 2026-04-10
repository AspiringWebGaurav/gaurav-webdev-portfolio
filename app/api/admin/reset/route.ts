/**
 * Reset API - Delete all Firebase collections and flush Redis
 * WARNING: This is destructive - ensure backup exists first!
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getRedis } from "@/lib/redis";
import { memoryCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

// Collections to delete
const PORTFOLIO_COLLECTIONS = [
  "portfolio_projects",
  "portfolio_testimonials",
  "portfolio_workExperience",
  "portfolio_techStacks",
  "portfolio_currentlyWorking",
  "recycleBin",
];

const SYSTEM_COLLECTIONS = [
  "og_uuid",
  "og_uuid_fingerprints",
  "og_uuid_masks",
  "visitorSessions",
  "visitorEvents",
  "visitorInteractions",
  "visitorHeartbeats",
  "banLogs",
  "banHistory",
  "analyticsAuditLogs",
  "contactSubmissions",
  "bugReports",
  "crashReports",
  "banAppeals",
];

/**
 * Delete all documents in a collection (batch delete)
 */
async function deleteCollection(collectionName: string): Promise<number> {
  const collectionRef = adminDb.collection(collectionName);
  const batchSize = 500;
  let totalDeleted = 0;

  while (true) {
    const snapshot = await collectionRef.limit(batchSize).get();
    
    if (snapshot.empty) {
      break;
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    totalDeleted += snapshot.size;
    
    console.log(`Deleted ${snapshot.size} documents from ${collectionName}`);
  }

  return totalDeleted;
}

/**
 * POST - Execute full reset
 * Requires confirmation token for safety
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Safety check - require confirmation
    if (body.confirm !== "RESET_ALL_DATA") {
      return NextResponse.json(
        {
          success: false,
          error: "Safety check failed",
          message: "Send { confirm: 'RESET_ALL_DATA' } to proceed",
        },
        { status: 400 }
      );
    }

    const results: Record<string, number> = {};
    const errors: string[] = [];

    // Determine what to reset
    const resetPortfolio = body.resetPortfolio !== false;
    const resetSystem = body.resetSystem === true; // Default: don't reset system data
    const flushRedis = body.flushRedis !== false;

    // Reset portfolio collections
    if (resetPortfolio) {
      console.log("🔄 Resetting portfolio collections...");
      for (const collectionName of PORTFOLIO_COLLECTIONS) {
        try {
          const count = await deleteCollection(collectionName);
          results[collectionName] = count;
          console.log(`✅ Deleted ${count} documents from ${collectionName}`);
        } catch (err) {
          const msg = `${collectionName}: ${err instanceof Error ? err.message : "Unknown error"}`;
          errors.push(msg);
          console.error(`❌ ${msg}`);
        }
      }
    }

    // Reset system collections (optional)
    if (resetSystem) {
      console.log("🔄 Resetting system collections...");
      for (const collectionName of SYSTEM_COLLECTIONS) {
        try {
          const count = await deleteCollection(collectionName);
          results[collectionName] = count;
          console.log(`✅ Deleted ${count} documents from ${collectionName}`);
        } catch (err) {
          const msg = `${collectionName}: ${err instanceof Error ? err.message : "Unknown error"}`;
          errors.push(msg);
          console.error(`❌ ${msg}`);
        }
      }
    }

    // Flush Redis cache
    if (flushRedis) {
      console.log("🔄 Flushing Redis cache...");
      try {
        const redis = getRedis();
        if (redis) {
          await redis.flushall();
          console.log("✅ Redis flushed");
          results["redis"] = 1;
        } else {
          console.log("⚪ Redis not configured");
          results["redis"] = 0;
        }
      } catch (err) {
        errors.push(`Redis: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    // Clear memory cache
    console.log("🔄 Clearing memory cache...");
    try {
      memoryCache.clear();
      console.log("✅ Memory cache cleared");
      results["memoryCache"] = 1;
    } catch (err) {
      errors.push(`Memory cache: ${err instanceof Error ? err.message : "Unknown error"}`);
    }

    const totalDeleted = Object.values(results)
      .filter((v): v is number => typeof v === "number")
      .reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: true,
      message: "Reset completed",
      results,
      totalDeleted,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Reset failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Reset failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Show reset options (documentation)
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/admin/reset",
    method: "POST",
    description: "Reset Firebase collections and Redis cache",
    requiredBody: {
      confirm: "RESET_ALL_DATA",
    },
    optionalBody: {
      resetPortfolio: "boolean (default: true) - Reset portfolio content collections",
      resetSystem: "boolean (default: false) - Reset visitor analytics collections",
      flushRedis: "boolean (default: true) - Flush Redis cache",
    },
    warning: "This action is DESTRUCTIVE and cannot be undone. Create a backup first!",
    portfolioCollections: PORTFOLIO_COLLECTIONS,
    systemCollections: SYSTEM_COLLECTIONS,
  });
}
