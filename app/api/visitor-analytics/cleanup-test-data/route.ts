/**
 * Delete Test Data API
 * Removes all TEST_VA_* visitor data
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

const TEST_PREFIX = "TEST_VA_";

export async function POST() {
  try {
    console.log("🔍 Searching for test data...");
    
    let totalDeleted = 0;
    
    // Delete test visitor profiles
    const profilesSnapshot = await adminDb.collection("visitorProfiles").get();
    const testProfiles = profilesSnapshot.docs.filter(doc => doc.id.startsWith(TEST_PREFIX));
    
    if (testProfiles.length > 0) {
      const batch = adminDb.batch();
      testProfiles.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      totalDeleted += testProfiles.length;
      console.log(`✓ Deleted ${testProfiles.length} test profiles`);
    }
    
    // Delete test sessions
    const sessionsSnapshot = await adminDb.collection("visitorSessions").get();
    const testSessions = sessionsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.visitorId?.startsWith(TEST_PREFIX);
    });
    
    if (testSessions.length > 0) {
      const batch = adminDb.batch();
      testSessions.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      totalDeleted += testSessions.length;
      console.log(`✓ Deleted ${testSessions.length} test sessions`);
    }
    
    // Delete test events
    const eventsSnapshot = await adminDb.collection("visitorEvents").get();
    const testEvents = eventsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.visitorId?.startsWith(TEST_PREFIX);
    });
    
    if (testEvents.length > 0) {
      // Delete in batches of 500
      for (let i = 0; i < testEvents.length; i += 500) {
        const batch = adminDb.batch();
        const batchDocs = testEvents.slice(i, i + 500);
        batchDocs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
      totalDeleted += testEvents.length;
      console.log(`✓ Deleted ${testEvents.length} test events`);
    }
    
    // Delete test interactions
    const interactionsSnapshot = await adminDb.collection("visitorInteractions").get();
    const testInteractions = interactionsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.visitorId?.startsWith(TEST_PREFIX);
    });
    
    if (testInteractions.length > 0) {
      const batch = adminDb.batch();
      testInteractions.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      totalDeleted += testInteractions.length;
      console.log(`✓ Deleted ${testInteractions.length} test interactions`);
    }
    
    // Delete test heartbeats
    const heartbeatsSnapshot = await adminDb.collection("visitorHeartbeats").get();
    const testHeartbeats = heartbeatsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.visitorId?.startsWith(TEST_PREFIX);
    });
    
    if (testHeartbeats.length > 0) {
      // Delete in batches of 500
      for (let i = 0; i < testHeartbeats.length; i += 500) {
        const batch = adminDb.batch();
        const batchDocs = testHeartbeats.slice(i, i + 500);
        batchDocs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
      totalDeleted += testHeartbeats.length;
      console.log(`✓ Deleted ${testHeartbeats.length} test heartbeats`);
    }
    
    console.log(`✅ Cleanup complete! Total deleted: ${totalDeleted}`);
    
    return NextResponse.json({
      success: true,
      message: "Test data deleted successfully",
      totalDeleted
    });
    
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cleanup failed"
      },
      { status: 500 }
    );
  }
}
