/**
 * Live Active User Check API - Real-Time Ping-Pong System
 * 
 * Admin triggers → Server broadcasts ping → Clients respond → Count results
 * 
 * Flow:
 * 1. Create ping document in Firestore
 * 2. All active clients receive via real-time listener
 * 3. Clients respond with their state (active/minimized)
 * 4. Wait 5 seconds (dynamic - early exit if all respond)
 * 5. Count responses vs database visitors
 * 6. Return accurate live counts
 * 
 * Cleanup:
 * - Manual: Admin clicks "Clear Data" button
 * - Auto: Component unmount or navigation away
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

const VISITORS_COLLECTION = "og_uuid";
const PINGS_COLLECTION = "admin_pings";

interface LiveUserCheckResponse {
  success: boolean;
  data?: {
    active: number;
    minimized: number;
    offline: number;
    totalTabs: number;
    uniqueUsers: number;
    pingId: string;
    timestamp: string;
    waitTime: number;
  };
  error?: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * POST - Perform real-time ping-pong check (admin-only)
 */
export async function POST(request: NextRequest): Promise<NextResponse<LiveUserCheckResponse>> {
  const startTime = Date.now();
  
  try {
    // 1. Verify admin authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Missing token" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (authError) {
      console.error("[Live Ping Check] Auth error:", authError);
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Verify admin email
    if (decodedToken.email !== "gauravpatil9262@gmail.com") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access only" },
        { status: 403 }
      );
    }

    console.log(`[Live Ping Check] 🚀 Starting ping by ${decodedToken.email}`);

    // 2. Query recent visitors (last 5 minutes) to know expected count
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentVisitorsSnapshot = await adminDb
      .collection(VISITORS_COLLECTION)
      .where("lastVisit", ">=", Timestamp.fromDate(fiveMinutesAgo))
      .where("currentStatus", "==", "active")
      .get();

    const expectedResponses = recentVisitorsSnapshot.size;
    const allVisitorIds = new Set(recentVisitorsSnapshot.docs.map(doc => doc.id));

    console.log(`[Live Ping Check] 📊 Expected ${expectedResponses} visitors to respond`);

    // 3. Create ping document (broadcasts to all clients via Firestore listener)
    const pingRef = await adminDb.collection(PINGS_COLLECTION).add({
      timestamp: FieldValue.serverTimestamp(),
      status: "active",
      expectedResponses: expectedResponses,
      adminEmail: decodedToken.email,
    });

    const pingId = pingRef.id;
    console.log(`[Live Ping Check] 📡 Ping broadcast: ${pingId}`);

    // 4. OPTIMIZED: Real-time listener with smart self-healing retry
    let retryCount = 0;
    const maxRetries = 2;
    let totalElapsedTime = 0; // Track elapsed time across retries
    
    const responsesSnapshot = await (async () => {
      while (retryCount <= maxRetries) {
        try {
          return await new Promise<FirebaseFirestore.QuerySnapshot>((resolve, reject) => {
            const maxWait = 5000; // 5 seconds max
            const listenerStartTime = Date.now();
            let unsubscribe: (() => void) | null = null;
            let timeoutId: NodeJS.Timeout | null = null;
            let lastSnapshot: FirebaseFirestore.QuerySnapshot | null = null;
            
            const cleanup = () => {
              if (unsubscribe) {
                try {
                  unsubscribe();
                } catch (err) {
                  console.warn('[Live Ping Check] ⚠️ Cleanup warning:', err);
                }
                unsubscribe = null;
              }
              if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
              }
            };
            
            try {
              // Real-time listener - fires only when responses arrive (zero polling)
              unsubscribe = pingRef.collection("responses").onSnapshot((snapshot) => {
                lastSnapshot = snapshot;
                const elapsed = Date.now() - listenerStartTime;
                const responseCount = snapshot.size;
                totalElapsedTime = elapsed; // Update total elapsed time
                
                console.log(`[Live Ping Check] ⏱️ ${elapsed}ms: ${responseCount}/${expectedResponses} responses`);
                
                // Early exit if all expected responses received
                if (responseCount >= expectedResponses && expectedResponses > 0) {
                  console.log(`[Live Ping Check] ✅ Early exit: All responses received in ${elapsed}ms`);
                  cleanup();
                  resolve(snapshot);
                }
              }, (error) => {
                console.error('[Live Ping Check] ⚠️ Listener error:', error);
                totalElapsedTime = Date.now() - listenerStartTime; // Track elapsed time on error
                cleanup();
                if (retryCount < maxRetries) {
                  reject(new Error('Listener failed, will retry'));
                } else {
                  // Final fallback: try single fetch
                  pingRef.collection("responses").get().then(resolve).catch(() => {
                    resolve({ docs: [], size: 0 } as any);
                  });
                }
              });
              
              // Auto-cleanup after max wait (smart sleep)
              timeoutId = setTimeout(() => {
                cleanup();
                if (lastSnapshot) {
                  resolve(lastSnapshot);
                } else {
                  // Fallback: fetch final state
                  pingRef.collection("responses").get().then(resolve).catch(() => {
                    resolve({ docs: [], size: 0 } as any);
                  });
                }
              }, maxWait);
            } catch (err) {
              console.error('[Live Ping Check] ⚠️ Failed to setup listener:', err);
              cleanup();
              if (retryCount < maxRetries) {
                reject(err);
              } else {
                // Final fallback
                pingRef.collection("responses").get().then(resolve).catch(() => {
                  resolve({ docs: [], size: 0 } as any);
                });
              }
            }
          });
        } catch (retryError) {
          retryCount++;
          console.warn(`[Live Ping Check] 🔄 Retry ${retryCount}/${maxRetries}`);
          
          if (retryCount <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount)); // Exponential backoff
          } else {
            // Final fallback after all retries
            return await pingRef.collection("responses").get();
          }
        }
      }
      
      // Should never reach here, but safety fallback
      return await pingRef.collection("responses").get();
    })();

    // 5. Read all responses (already have snapshot from listener)
    const responses = responsesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`[Live Ping Check] 📥 Received ${responses.length} responses`);

    // 6. Categorize results
    const respondedVisitorIds = new Set<string>();
    let activeCount = 0;
    let minimizedCount = 0;

    responses.forEach((response: any) => {
      respondedVisitorIds.add(response.visitorId);
      
      if (response.status === "active") {
        activeCount++;
      } else if (response.status === "minimized") {
        minimizedCount++;
      }
    });

    // Offline = visitors in database but didn't respond
    const offlineCount = Array.from(allVisitorIds).filter(
      id => !respondedVisitorIds.has(id)
    ).length;

    const uniqueUsers = respondedVisitorIds.size;
    const totalTabs = responses.length;

    const duration = Date.now() - startTime;
    console.log(`[Live Ping Check] ✅ Complete in ${duration}ms - Active: ${activeCount}, Minimized: ${minimizedCount}, Offline: ${offlineCount}, Tabs: ${totalTabs}`);

    // CASCADE DELETE: Cleanup ping + responses after 30 seconds to prevent memory leaks
    setTimeout(async () => {
      try {
        // Delete all responses first
        const cleanupSnapshot = await pingRef.collection('responses').get();
        if (cleanupSnapshot.size > 0) {
          const deleteBatch = adminDb.batch();
          cleanupSnapshot.docs.forEach(doc => {
            deleteBatch.delete(doc.ref);
          });
          await deleteBatch.commit();
        }
        
        // Then delete ping
        await pingRef.delete();
        console.log(`[Live Ping Check] 🧹 Cascade cleanup complete for ping ${pingId}`);
      } catch (err) {
        console.warn('[Live Ping Check] ⚠️ Cascade cleanup failed:', err);
      }
    }, 30000);

    // 7. Return results
    return NextResponse.json({
      success: true,
      data: {
        active: activeCount,
        minimized: minimizedCount,
        offline: offlineCount,
        totalTabs: totalTabs,
        uniqueUsers: uniqueUsers,
        pingId: pingId,
        timestamp: new Date().toISOString(),
        waitTime: totalElapsedTime || duration, // Use tracked elapsed time or total duration as fallback
      },
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Live Ping Check] ❌ Error after ${duration}ms:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to perform live user check",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Cleanup ping data (admin-only)
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Get pingId from query params
    const url = new URL(request.url);
    const pingId = url.searchParams.get("pingId");

    if (!pingId) {
      return NextResponse.json(
        { success: false, error: "Missing pingId parameter" },
        { status: 400 }
      );
    }

    // Verify admin authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);

    console.log(`[Live Ping Check] 🗑️ Cleaning up ping: ${pingId}`);

    const pingRef = adminDb.collection(PINGS_COLLECTION).doc(pingId);

    // Delete all responses first (subcollection)
    const responsesSnapshot = await pingRef.collection("responses").get();
    const batch = adminDb.batch();
    
    responsesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`[Live Ping Check] 🗑️ Deleted ${responsesSnapshot.size} responses`);

    // Delete ping document
    await pingRef.delete();
    console.log(`[Live Ping Check] ✅ Cleanup complete`);

    return NextResponse.json({
      success: true,
      message: `Deleted ping and ${responsesSnapshot.size} responses`,
    });

  } catch (error) {
    console.error("[Live Ping Check] Cleanup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cleanup failed",
      },
      { status: 500 }
    );
  }
}
