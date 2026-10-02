/**
 * Resume Data Management Service
 * Manages fetching, caching, and updating resume data via Firebase RTDB and Upstash Redis.
 */


import { getAdminDb } from "@/lib/admin/firebase-admin";
import { redisClient } from "../../redis";
import { DEFAULT_RESUME_DATA } from "../constants";
import type { ResumeData } from "@/types/resume";

const RESUME_CACHE_KEY = "resume:cached_data";
const RESUME_RTDB_PATH = "resume_data";
const CACHE_TTL_SECONDS = 3600; // 1 hour

/**
 * Retrieves the authoritative Resume data.
 * Checks Redis cache -> Firebase RTDB -> Default seed fallback.
 */
export async function getResumeData(): Promise<ResumeData> {
  // 1. Check Redis Cache
  try {
    const cached = await redisClient.get<string | ResumeData>(RESUME_CACHE_KEY);
    if (cached) {
      return typeof cached === "string" ? JSON.parse(cached) : cached;
    }
  } catch {
    // Cache miss or Redis unavailable, proceed to database
  }

  // 2. Fetch from Firebase Realtime Database
  try {
    const db = getAdminDb();
    if (db) {
      const snapshot = await db.ref(RESUME_RTDB_PATH).get();
      if (snapshot.exists()) {
        const val = snapshot.val() as ResumeData;
        if (val && val.basics) {
          // Cache in Redis
          try {
            await redisClient.set(RESUME_CACHE_KEY, JSON.stringify(val), { ex: CACHE_TTL_SECONDS });
          } catch {
            // Ignore Redis cache write error
          }
          return val;
        }
      }
    }
  } catch (err) {
    console.warn("Firebase RTDB resume fetch note:", err);
  }

  // 3. Fallback to default verified resume data
  // Also asynchronously initialize Firebase RTDB with default data if empty
  initializeDefaultResumeData().catch(() => {});

  return DEFAULT_RESUME_DATA;
}

/**
 * Updates resume data in Firebase RTDB and invalidates Redis cache
 */
export async function updateResumeData(data: Partial<ResumeData>): Promise<{ success: boolean; data: ResumeData; error?: string }> {
  try {
    const current = await getResumeData();
    const merged: ResumeData = {
      ...current,
      ...data,
      basics: {
        ...current.basics,
        ...(data.basics || {}),
      },
      updatedAt: Date.now(),
      version: (current.version || 1) + 1,
    };

    const db = getAdminDb();
    if (db) {
      await db.ref(RESUME_RTDB_PATH).set(merged);
    }

    // Refresh Redis Cache
    try {
      await redisClient.set(RESUME_CACHE_KEY, JSON.stringify(merged), { ex: CACHE_TTL_SECONDS });
    } catch {
      // Ignore
    }

    return { success: true, data: merged };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update resume data";
    return { success: false, data: DEFAULT_RESUME_DATA, error: message };
  }
}

/**
 * Initializes default resume data in Firebase RTDB if it doesn't already exist
 */
async function initializeDefaultResumeData(): Promise<void> {
  try {
    const db = getAdminDb();
    if (!db) return;
    const snapshot = await db.ref(RESUME_RTDB_PATH).get();
    if (!snapshot.exists()) {
      await db.ref(RESUME_RTDB_PATH).set(DEFAULT_RESUME_DATA);
    }
  } catch {
    // Ignore initialization background warning
  }
}
