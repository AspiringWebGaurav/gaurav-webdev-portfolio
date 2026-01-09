/**
 * Discover Active Connections API - Discovery-Only Endpoint
 * 
 * Returns count of active connections WITHOUT triggering any broadcasts
 * Uses same admin_pings system as Live Active User Count (proven working)
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const VISITORS_COLLECTION = "og_uuid";
const PINGS_COLLECTION = "admin_pings";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('[Discovery] ❌ Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const adminEmail = 'gauravpatil9262@gmail.com';
    if (decodedToken.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    console.log('[Discovery] 🔍 Starting connection discovery (discovery-only, no broadcasts)');

    // Query recent visitors (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentVisitorsSnapshot = await adminDb
      .collection(VISITORS_COLLECTION)
      .where("lastVisit", ">=", Timestamp.fromDate(fiveMinutesAgo))
      .where("currentStatus", "==", "active")
      .get();

    const expectedResponses = recentVisitorsSnapshot.size;
    console.log(`[Discovery] 📊 Expected ${expectedResponses} visitors to respond`);

    // Create ping document using admin_pings (same as Live Active User Count)
    const pingRef = await adminDb.collection(PINGS_COLLECTION).add({
      timestamp: FieldValue.serverTimestamp(),
      status: "active",
      type: "DISCOVERY_SCAN",
      expectedResponses: expectedResponses,
      adminEmail: decodedToken.email,
      purpose: 'force_update_discovery',
    });

    const pingId = pingRef.id;
    console.log(`[Discovery] 📡 Ping broadcast: ${pingId}`);

    // Dynamic wait window - check every 500ms, max 5 seconds
    let elapsed = 0;
    const maxWait = 5000;
    const checkInterval = 500;
    let responseCount = 0;

    while (elapsed < maxWait) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      elapsed += checkInterval;
      
      const responsesSnapshot = await pingRef.collection("responses").get();
      responseCount = responsesSnapshot.size;
      
      console.log(`[Discovery] ⏱️ ${elapsed}ms: ${responseCount}/${expectedResponses} responses`);
      
      // Early exit if all expected responses received
      if (responseCount >= expectedResponses && expectedResponses > 0) {
        console.log(`[Discovery] ✅ Early exit: All responses in ${elapsed}ms`);
        break;
      }
    }

    // Read all responses
    const responsesSnapshot = await pingRef.collection("responses").get();
    const responses = responsesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`[Discovery] 📥 Received ${responses.length} responses`);

    // Count active tabs
    const respondedVisitorIds = new Set<string>();
    let activeCount = 0;

    responses.forEach((response: any) => {
      respondedVisitorIds.add(response.visitorId);
      if (response.status === "active") {
        activeCount++;
      }
    });

    const totalUsers = responses.length; // Total tabs (active + minimized)
    const uniqueUsers = respondedVisitorIds.size;
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[Discovery] ✅ Complete: ${totalUsers} tabs from ${uniqueUsers} users in ${duration}s`);

    // CASCADE DELETE: Cleanup ping + responses after 30 seconds to prevent memory leaks
    setTimeout(async () => {
      try {
        // Delete all responses first
        const responsesSnapshot = await pingRef.collection('responses').get();
        if (responsesSnapshot.size > 0) {
          console.log(`[Discovery] 🗑️ Cascade deleting ${responsesSnapshot.size} responses`);
          const deleteBatch = adminDb.batch();
          responsesSnapshot.docs.forEach(doc => {
            deleteBatch.delete(doc.ref);
          });
          await deleteBatch.commit();
        }
        
        // Then delete the ping
        await pingRef.delete();
        console.log(`[Discovery] ✅ Cascade cleanup complete`);
      } catch (err) {
        console.warn('[Discovery] ⚠️ Cascade cleanup failed:', err);
      }
    }, 30000);

    return NextResponse.json({
      success: true,
      totalUsers,
      uniqueUsers,
      activeCount,
      discoveryMethod: 'admin_pings_primary',
      discoveryDuration: parseFloat(duration),
      userIds: Array.from(respondedVisitorIds),
      timestamp: Date.now(),
    });

  } catch (error: any) {
    console.error('[Discovery] Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Discovery failed',
    }, { status: 500 });
  }
}
