"use server";

import { cookies } from "next/headers";
import { adminDb } from "./firebaseAdmin";

const db = adminDb;

const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
const SESSION_COOKIE_NAME = "admin_session_id";

export interface Session {
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  userAgent?: string;
  ipAddress?: string;
  fingerprint?: string;
}

/**
 * Create a new session in Firebase and set session cookie
 */
export async function createSession(
  userId: string,
  email: string,
  metadata?: { userAgent?: string; ipAddress?: string; fingerprint?: string }
): Promise<string> {
  const sessionId = generateSessionId();
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION;

  const session: Session = {
    userId,
    email,
    createdAt: now,
    expiresAt,
    lastActivity: now,
    userAgent: metadata?.userAgent,
    ipAddress: metadata?.ipAddress,
    fingerprint: metadata?.fingerprint,
  };

  // Store session in Firebase
  await db.collection("sessions").doc(sessionId).set(session);

  // Set HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: "/",
  });

  return sessionId;
}

/**
 * Validate and retrieve session from Firebase
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
      return null;
    }

    const sessionDoc = await db.collection("sessions").doc(sessionId).get();

    if (!sessionDoc.exists) {
      await destroySession();
      return null;
    }

    const session = sessionDoc.data() as Session;
    const now = Date.now();

    // Check if session is expired
    if (session.expiresAt < now) {
      await destroySession();
      return null;
    }

    // Update last activity (but not on every request to reduce writes)
    // Only update if last activity was more than 5 minutes ago
    if (now - session.lastActivity > 5 * 60 * 1000) {
      await db
        .collection("sessions")
        .doc(sessionId)
        .update({ lastActivity: now });
    }

    return session;
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}

/**
 * Extend session expiry (called on user activity)
 */
export async function extendSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
      return false;
    }

    const now = Date.now();
    const newExpiresAt = now + SESSION_DURATION;

    await db.collection("sessions").doc(sessionId).update({
      expiresAt: newExpiresAt,
      lastActivity: now,
    });

    // Update cookie expiry
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION / 1000,
      path: "/",
    });

    return true;
  } catch (error) {
    console.error("Session extension error:", error);
    return false;
  }
}

/**
 * Destroy session (logout)
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionId) {
      await db.collection("sessions").doc(sessionId).delete();
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error("Session destruction error:", error);
  }
}

/**
 * Generate a cryptographically secure session ID
 */
function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}
