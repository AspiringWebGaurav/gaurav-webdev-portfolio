/**
 * Backup API - Export all Firebase collections to JSON
 * Creates full backup in /backups/ directory
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

// All collections to backup
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
  "siteSettings",
  "maintenanceMode",
];

/**
 * Export a single collection to JSON
 */
async function exportCollection(collectionName: string): Promise<{ count: number; data: any[] }> {
  try {
    const snapshot = await adminDb.collection(collectionName).get();
    const data = snapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data(),
    }));
    return { count: data.length, data };
  } catch (error) {
    console.error(`Error exporting ${collectionName}:`, error);
    return { count: 0, data: [] };
  }
}

/**
 * POST - Create full backup
 */
export async function POST(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(process.cwd(), "backups", timestamp);
    const firebaseDir = path.join(backupDir, "firebase");

    // Create backup directories
    await mkdir(firebaseDir, { recursive: true });

    const manifest: Record<string, number> = {};
    const errors: string[] = [];

    // Export all collections
    const allCollections = [...PORTFOLIO_COLLECTIONS, ...SYSTEM_COLLECTIONS];
    
    for (const collectionName of allCollections) {
      try {
        const { count, data } = await exportCollection(collectionName);
        
        if (count > 0) {
          const filePath = path.join(firebaseDir, `${collectionName}.json`);
          await writeFile(filePath, JSON.stringify(data, null, 2));
          manifest[collectionName] = count;
          console.log(`✅ Backed up ${collectionName}: ${count} documents`);
        } else {
          manifest[collectionName] = 0;
          console.log(`⚪ ${collectionName}: empty or not found`);
        }
      } catch (err) {
        errors.push(`${collectionName}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    // Write manifest
    const manifestData = {
      timestamp,
      createdAt: new Date().toISOString(),
      collections: manifest,
      totalDocuments: Object.values(manifest).reduce((a, b) => a + b, 0),
      errors: errors.length > 0 ? errors : undefined,
    };
    
    await writeFile(
      path.join(backupDir, "manifest.json"),
      JSON.stringify(manifestData, null, 2)
    );

    // Write env structure (keys only, no values)
    const envStructure = {
      required: [
        "FIREBASE_ADMIN_PROJECT_ID",
        "FIREBASE_ADMIN_CLIENT_EMAIL", 
        "FIREBASE_ADMIN_PRIVATE_KEY",
        "FIREBASE_ADMIN_STORAGE_BUCKET",
        "UPSTASH_REDIS_REST_URL",
        "UPSTASH_REDIS_REST_TOKEN",
      ],
      optional: [
        "NEXT_PUBLIC_BASE_URL",
        "ENABLE_REDIS_CACHE",
      ],
    };
    
    await writeFile(
      path.join(backupDir, "env_structure.json"),
      JSON.stringify(envStructure, null, 2)
    );

    return NextResponse.json({
      success: true,
      message: "Backup created successfully",
      backupPath: `backups/${timestamp}`,
      manifest: manifestData,
    });

  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Backup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET - List available backups
 */
export async function GET() {
  try {
    const { readdir, stat } = await import("fs/promises");
    const backupsDir = path.join(process.cwd(), "backups");
    
    try {
      const entries = await readdir(backupsDir);
      const backups = [];
      
      for (const entry of entries) {
        const entryPath = path.join(backupsDir, entry);
        const stats = await stat(entryPath);
        if (stats.isDirectory()) {
          try {
            const manifestPath = path.join(entryPath, "manifest.json");
            const manifestContent = await import("fs/promises").then(fs => 
              fs.readFile(manifestPath, "utf-8")
            );
            const manifest = JSON.parse(manifestContent);
            backups.push({
              name: entry,
              ...manifest,
            });
          } catch {
            backups.push({ name: entry, error: "No manifest found" });
          }
        }
      }
      
      return NextResponse.json({ success: true, backups });
    } catch {
      return NextResponse.json({ success: true, backups: [], message: "No backups found" });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to list backups" },
      { status: 500 }
    );
  }
}
