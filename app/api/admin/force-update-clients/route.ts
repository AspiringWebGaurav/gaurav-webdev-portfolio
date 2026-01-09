/**
 * Force Update All Clients API - Enterprise Batch System with 3-Layer Fallback
 * 
 * Broadcasts a reload command to ALL connected clients with intelligent batching
 * Prevents server overload by staggering reloads across multiple waves
 * 
 * LAYER 1: Firestore admin_broadcasts (Primary)
 * LAYER 2: Firestore force_reload_fallback (Secondary)
 * LAYER 3: Firestore system_commands (Tertiary - Last Resort)
 * 
 * Admin triggers → Query active users → Calculate batches → Broadcast in waves → Clients reload
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { calculateBatchConfig, createBatches, calculateBatchDelay, validateBatchConfig } from '@/lib/batchProcessor';
import { LayerBatchResult, BatchUpdateResult } from '@/types/batchUpdate';

/**
 * POST /api/admin/force-update-clients
 * Broadcast reload command with batch distribution and 3-layer fallback
 */
export async function POST(req: NextRequest) {
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
      console.error('[Force Update] ❌ Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const adminEmail = 'gauravpatil9262@gmail.com';
    if (decodedToken.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    console.log('[Force Update] 🚀 Admin triggered enterprise batch update with 3-layer discovery system');

    // ==================== STEP 1: DISCOVERY PHASE - Multi-Layer Live User Discovery ====================
    console.log('[Force Update] 📡 PHASE 1: Starting 3-layer live connection discovery...');
    
    let liveUserIds: string[] = [];
    let discoveryMethod = 'unknown';
    let discoveryPingRef: any = null;
    let pingId: string = '';
    const startTime = Date.now();
    
    // ============ LAYER 1: Primary Ping-Pong Discovery (force_update_pings) ============
    try {
      discoveryMethod = 'ping_pong_primary';
      console.log('[Force Update] 🎯 LAYER 1: Initiating force_update_pings discovery...');
      
      discoveryPingRef = await adminDb.collection('force_update_pings').add({
        type: 'PRE_UPDATE_DISCOVERY',
        timestamp: FieldValue.serverTimestamp(),
        triggeredBy: decodedToken.uid,
        triggeredByEmail: decodedToken.email,
        status: 'waiting_for_responses',
        maxWaitSeconds: 6,
        createdAt: Date.now(),
        testMode: process.env.NODE_ENV !== 'production', // Enable test mode for dummy connections
      });

      pingId = discoveryPingRef.id;
      console.log(`[Force Update] 🔔 Primary ping created: ${pingId}`);
      console.log('[Force Update] ⏱️  Waiting for live tab responses...');
      
      // OPTIMIZED: Real-time listener with smart self-healing retry
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          await new Promise<void>((resolve, reject) => {
            const maxWait = 6000; // 6 seconds max (increased for 50+ connections)
            const startTime = Date.now();
            let unsubscribe: (() => void) | null = null;
            let timeoutId: NodeJS.Timeout | null = null;
            const userIdSet = new Set<string>();
            
            const cleanup = () => {
              if (unsubscribe) {
                try {
                  unsubscribe();
                } catch (err) {
                  console.warn('[Force Update] ⚠️ Listener cleanup warning:', err);
                }
                unsubscribe = null;
              }
              if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
              }
            };
            
            try {
              // Real-time listener - fires only when data changes (zero polling)
              unsubscribe = adminDb
                .collection(`force_update_pings/${pingId}/responses`)
                .onSnapshot((snapshot) => {
                  try {
                    // Process each response and deduplicate
                    snapshot.docs.forEach(doc => {
                      try {
                        const data = doc.data();
                        const visitorId = data?.visitorId;
                        if (visitorId && typeof visitorId === 'string') {
                          userIdSet.add(visitorId);
                        }
                      } catch (err) {
                        console.warn('[Force Update] ⚠️ Failed to parse response:', err);
                      }
                    });
                    
                    liveUserIds = Array.from(userIdSet);
                    const elapsed = Date.now() - startTime;
                    console.log(`[Force Update] 📊 Layer 1 Progress: ${liveUserIds.length} unique users from ${snapshot.size} total responses (${elapsed}ms elapsed)`);
                  } catch (err) {
                    console.error('[Force Update] ⚠️ Error processing snapshot:', err);
                  }
                }, (error) => {
                  console.error('[Force Update] ⚠️ Listener error:', error);
                  cleanup();
                  if (retryCount < maxRetries) {
                    reject(new Error('Listener failed, will retry'));
                  } else {
                    resolve(); // Give up after retries
                  }
                });
              
              // Auto-cleanup after max wait (smart sleep)
              timeoutId = setTimeout(() => {
                cleanup();
                resolve();
              }, maxWait);
            } catch (err) {
              console.error('[Force Update] ⚠️ Failed to setup listener:', err);
              cleanup();
              if (retryCount < maxRetries) {
                reject(err);
              } else {
                resolve();
              }
            }
          });
          
          // Success - break retry loop
          break;
          
        } catch (retryError) {
          retryCount++;
          console.warn(`[Force Update] 🔄 Layer 1 retry ${retryCount}/${maxRetries}`);
          
          if (retryCount <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          }
        }
      }
      
      console.log(`[Force Update] ✅ Layer 1 Complete: Found ${liveUserIds.length} live connections via force_update_pings`);
      
      // CASCADE DELETE: Cleanup ping + responses after 30 seconds to prevent memory leaks
      setTimeout(async () => {
        try {
          // Delete all responses first (subcollection)
          const responsesSnapshot = await discoveryPingRef.collection('responses').get();
          if (responsesSnapshot.size > 0) {
            console.log(`[Force Update] 🗑️ Cascade deleting ${responsesSnapshot.size} responses...`);
            const deleteBatch = adminDb.batch();
            responsesSnapshot.docs.forEach(doc => {
              deleteBatch.delete(doc.ref);
            });
            await deleteBatch.commit();
          }
          
          // Then delete the ping document
          await discoveryPingRef.delete();
          console.log(`[Force Update] ✅ Cascade cleanup complete for ping ${pingId}`);
        } catch (err) {
          console.warn('[Force Update] ⚠️ Cascade cleanup failed:', err);
        }
      }, 30000);
      
    } catch (primaryError) {
      console.error('[Force Update] ❌ Layer 1 (force_update_pings) failed:', primaryError);
      
      // ============ LAYER 2: Fallback to admin_pings ============
      try {
        discoveryMethod = 'admin_pings_fallback';
        console.log('[Force Update] 🔄 LAYER 2: Falling back to admin_pings...');
        
        const adminPingRef = await adminDb.collection('admin_pings').add({
          type: 'LIVE_CHECK',
          timestamp: FieldValue.serverTimestamp(),
          triggeredBy: decodedToken.uid,
          triggeredByEmail: decodedToken.email,
          purpose: 'force_update_discovery_fallback',
          createdAt: Date.now(),
        });
        
        const adminPingId = adminPingRef.id;
        console.log(`[Force Update] 🔔 Layer 2 ping created: ${adminPingId}`);
        
        // Wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const adminResponsesSnapshot = await adminDb
          .collection(`admin_pings/${adminPingId}/responses`)
          .get();
        
        liveUserIds = [...new Set(adminResponsesSnapshot.docs
          .map(doc => doc.data()?.visitorId)
          .filter(Boolean))];
        
        console.log(`[Force Update] ✅ Layer 2 Complete: Found ${liveUserIds.length} via admin_pings`);
        
        // CASCADE DELETE: Cleanup with responses
        setTimeout(async () => {
          try {
            const responsesSnapshot = await adminPingRef.collection('responses').get();
            if (responsesSnapshot.size > 0) {
              const deleteBatch = adminDb.batch();
              responsesSnapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
              await deleteBatch.commit();
            }
            await adminPingRef.delete();
            console.log(`[Force Update] ✅ Layer 2 cascade cleanup complete`);
          } catch (err) {
            console.warn('[Force Update] ⚠️ Layer 2 cleanup failed:', err);
          }
        }, 30000);
        
      } catch (fallbackError) {
        console.error('[Force Update] ❌ Layer 2 (admin_pings) failed:', fallbackError);
        
        // ============ LAYER 3: Last Resort - Smart Analytics Query with Multiple Strategies ============
        try {
          discoveryMethod = 'analytics_last_resort';
          console.log('[Force Update] 🔄 LAYER 3 (Last Resort): Querying visitor analytics with fallback strategies...');
          
          // Strategy 1: Try active visitors from last 15 minutes
          try {
            const ACTIVE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes
            const activeThreshold = Date.now() - ACTIVE_THRESHOLD_MS;
            
            const activeVisitorsSnapshot = await adminDb
              .collection('og_uuid')
              .where('lastSeen', '>=', activeThreshold)
              .get();
            
            if (activeVisitorsSnapshot.size > 0) {
              liveUserIds = [...new Set(activeVisitorsSnapshot.docs
                .map(doc => doc.id)
                .filter(id => id && id !== 'undefined' && id !== 'null'))];
              
              console.log(`[Force Update] ✅ Layer 3 Strategy 1: Found ${liveUserIds.length} from recent visitors`);
            }
          } catch (strategy1Error) {
            console.warn('[Force Update] ⚠️ Strategy 1 failed, trying fallback...', strategy1Error);
          }
          
          // Strategy 2: If Strategy 1 fails, get all visitors (no filter)
          if (liveUserIds.length === 0) {
            console.log('[Force Update] 🔄 Strategy 2: Fetching all visitors as last resort...');
            
            const allVisitorsSnapshot = await adminDb
              .collection('og_uuid')
              .limit(1000) // Safety limit
              .get();
            
            liveUserIds = [...new Set(allVisitorsSnapshot.docs
              .map(doc => doc.id)
              .filter(id => id && id !== 'undefined' && id !== 'null'))];
            
            console.log(`[Force Update] ✅ Layer 3 Strategy 2: Found ${liveUserIds.length} total visitors`);
          }
          
          if (liveUserIds.length === 0) {
            throw new Error('No visitors found in og_uuid collection');
          }
          
        } catch (lastResortError) {
          console.error('[Force Update] ❌ ALL 3 LAYERS FAILED:', lastResortError);
          
          // SELF-HEALING: Return graceful degradation instead of error
          return NextResponse.json({
            success: true,
            message: 'No active connections discovered - system is in degraded mode',
            totalUsers: 0,
            totalBatches: 0,
            layers: [],
            degradedMode: true,
            discoveryPhase: {
              status: 'failed_all_layers',
              method: 'none',
              error: lastResortError instanceof Error ? lastResortError.message : 'Unknown error',
              layers: ['force_update_pings', 'admin_pings', 'analytics_query'],
              suggestion: 'Check if any clients are connected and Firestore rules allow reads',
            },
          });
        }
      }
    }

    const totalUsers = liveUserIds.length;
    const discoveryDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`[Force Update] 🎉 Discovery complete via ${discoveryMethod}:`);
    console.log(`[Force Update]    - Total users: ${totalUsers}`);
    console.log(`[Force Update]    - Duration: ${discoveryDuration}s`);
    console.log(`[Force Update]    - Sample IDs:`, liveUserIds.slice(0, 3).map(id => id.substring(0, 12) + '...'));
    
    if (totalUsers === 0) {
      console.log('[Force Update] ℹ️ No active connections found across all discovery methods');
      return NextResponse.json({
        success: true,
        message: 'No active connections to update',
        totalUsers: 0,
        totalBatches: 0,
        layers: [],
        discoveryPhase: {
          status: 'completed',
          method: discoveryMethod,
          pingId: pingId || 'none',
          responseCount: 0,
          durationSeconds: parseFloat(discoveryDuration),
          liveUserIds: [],
        },
      });
    }

    // ==================== STEP 2: Calculate Batch Configuration ====================
    let batchConfig;
    let validation;
    
    try {
      batchConfig = calculateBatchConfig(totalUsers);
      validation = validateBatchConfig(batchConfig);

      if (!validation.valid) {
        console.error('[Force Update] ❌ Invalid batch configuration:', validation.error);
        return NextResponse.json({
          success: false,
          error: validation.error,
          totalUsers,
        }, { status: 400 });
      }

      console.log(`[Force Update] 📦 Batch Config: ${batchConfig.totalBatches} batches of ${batchConfig.batchSize} users, ${batchConfig.interval}s interval`);
      console.log(`[Force Update] ⏱️  Estimated completion: ${batchConfig.estimatedTimeSeconds} seconds`);
    } catch (configError) {
      console.error('[Force Update] ❌ Failed to calculate batch configuration:', configError);
      return NextResponse.json({
        success: false,
        error: 'Failed to calculate batch configuration',
        details: configError instanceof Error ? configError.message : 'Unknown error',
      }, { status: 500 });
    }

    // ==================== STEP 3: Create User Batches ====================
    let userBatches;
    
    try {
      userBatches = createBatches(liveUserIds, batchConfig.batchSize);
      
      if (!userBatches || userBatches.length === 0) {
        throw new Error('Failed to create user batches');
      }
      
      console.log(`[Force Update] ✂️ Split ${totalUsers} live users into ${userBatches.length} batches`);
    } catch (batchError) {
      console.error('[Force Update] ❌ Failed to create batches:', batchError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create user batches',
        details: batchError instanceof Error ? batchError.message : 'Unknown error',
      }, { status: 500 });
    }

    // ==================== STEP 4: Broadcast to All Layers ====================
    const layers: LayerBatchResult[] = [];
    const baseTimestamp = Date.now();
    const updateId = `update_${baseTimestamp}_${Math.random().toString(36).substring(7)}`; // Unique ID for this update session
    
    console.log(`[Force Update] 🆔 Generated updateId: ${updateId}`);

    const layerConfigs = [
      { name: 'Layer 1 - Primary (admin_broadcasts)', collection: 'admin_broadcasts', layer: 1, layerName: 'Primary' },
      { name: 'Layer 2 - Fallback (force_reload_fallback)', collection: 'force_reload_fallback', layer: 2, layerName: 'Fallback' },
      { name: 'Layer 3 - Last Resort (system_commands)', collection: 'system_commands', layer: 3, layerName: 'Last Resort' },
    ];

    for (const layerConfig of layerConfigs) {
      const broadcastIds: string[] = [];
      let layerSuccess = true;
      let layerError: string | undefined;

      try {
        console.log(`[Force Update] 📡 ${layerConfig.layerName}: Broadcasting ${userBatches.length} batches to LIVE users...`);

        // Broadcast each batch for this layer with error handling
        for (let i = 0; i < userBatches.length; i++) {
          const batchNumber = i + 1;
          const delaySeconds = calculateBatchDelay(batchNumber, batchConfig.interval);
          const batchId = `${layerConfig.collection}_batch_${batchNumber}_${baseTimestamp}`;

          let batchRetries = 2; // Retry each batch up to 2 times
          let batchSuccess = false;

          while (batchRetries >= 0 && !batchSuccess) {
            try {
              // Validate batch before sending
              if (!userBatches[i] || userBatches[i].length === 0) {
                console.warn(`[Force Update] ⚠️ Skipping empty batch ${batchNumber}`);
                batchSuccess = true; // Skip empty batches
                break;
              }

              const batchRef = await adminDb.collection(layerConfig.collection).add({
                type: 'FORCE_RELOAD',
                batchId: batchId,
                batchNumber: batchNumber,
                totalBatches: userBatches.length,
                delaySeconds: delaySeconds,
                targetUserIds: userBatches[i],
                timestamp: FieldValue.serverTimestamp(),
                createdAt: Date.now(), // For client-side freshness checks
                updateId: updateId, // Unique ID for this update session (prevents duplicates)
                layer: layerConfig.layer,
                layerName: layerConfig.layerName,
                message: "We're loading the latest improvements for you!",
                triggeredBy: decodedToken.uid,
                triggeredByEmail: decodedToken.email,
              });

              broadcastIds.push(batchRef.id);
              console.log(`[Force Update] ✅ ${layerConfig.layerName} - Batch ${batchNumber}/${userBatches.length} broadcasted (${userBatches[i].length} users, +${delaySeconds}s delay)`);
              batchSuccess = true;

              // Auto-delete after broadcast completes with retry logic (8s for faster cleanup)
              const deleteDelay = (delaySeconds + 8) * 1000; // Delete 8s after reload time
              setTimeout(async () => {
                let deleteRetries = 2;
                while (deleteRetries >= 0) {
                  try {
                    await batchRef.delete();
                    console.log(`[Force Update] 🗑️ ${layerConfig.layerName} - Batch ${batchNumber} auto-deleted`);
                    break;
                  } catch (err) {
                    deleteRetries--;
                    console.error(`[Force Update] ⚠️ ${layerConfig.layerName} - Batch ${batchNumber} delete failed (${deleteRetries} retries left):`, err);
                    if (deleteRetries >= 0) {
                      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s before retry
                    }
                  }
                }
              }, deleteDelay);

            } catch (batchBroadcastError: any) {
              batchRetries--;
              console.error(`[Force Update] ⚠️ ${layerConfig.layerName} - Batch ${batchNumber} attempt failed (${batchRetries} retries left):`, batchBroadcastError.message);
              
              if (batchRetries < 0) {
                console.error(`[Force Update] ❌ ${layerConfig.layerName} - Batch ${batchNumber} permanently failed after all retries`);
                layerSuccess = false;
                layerError = `Batch ${batchNumber} failed after retries: ${batchBroadcastError.message}`;
                break; // Exit retry loop
              } else {
                // Exponential backoff before retry
                await new Promise(resolve => setTimeout(resolve, (2 - batchRetries) * 1000));
              }
            }
          }

          // If batch still failed after retries, stop this layer
          if (!batchSuccess) {
            break;
          }
        }

        layers.push({
          name: layerConfig.name,
          collection: layerConfig.collection,
          success: layerSuccess,
          broadcastIds: broadcastIds,
          batchCount: broadcastIds.length,
          error: layerError,
        });

        if (layerSuccess) {
          console.log(`[Force Update] ✅ ${layerConfig.layerName} SUCCESS: All ${broadcastIds.length} batches sent`);
        } else {
          console.error(`[Force Update] ❌ ${layerConfig.layerName} FAILED: ${layerError}`);
        }

      } catch (layerError: any) {
        console.error(`[Force Update] ❌ ${layerConfig.layerName} CRITICAL ERROR:`, layerError.message);
        layers.push({
          name: layerConfig.name,
          collection: layerConfig.collection,
          success: false,
          broadcastIds: [],
          batchCount: 0,
          error: layerError.message,
        });
      }
    }

    // ==================== STEP 5: Evaluate Results ====================
    const successfulLayers = layers.filter(l => l.success);
    const failedLayers = layers.filter(l => !l.success);

    console.log(`[Force Update] 📊 FINAL SUMMARY: ${successfulLayers.length}/3 layers succeeded`);
    
    if (successfulLayers.length === 0) {
      // CRITICAL FAILURE: All 3 layers failed
      console.error('[Force Update] 🚨 CRITICAL FAILURE: All layers failed!');
      return NextResponse.json({
        success: false,
        error: 'All broadcast layers failed',
        layers,
        totalUsers,
        totalBatches: userBatches.length,
        criticalFailure: true,
      } as Partial<BatchUpdateResult>, { status: 500 });
    }

    // SUCCESS: At least one layer succeeded
    const result: BatchUpdateResult = {
      success: true,
      message: `Batch update broadcasted successfully to ${totalUsers} live connections through ${successfulLayers.length} layer${successfulLayers.length > 1 ? 's' : ''}`,
      totalUsers,
      totalBatches: userBatches.length,
      batchSize: batchConfig.batchSize,
      interval: batchConfig.interval,
      estimatedCompletionSeconds: batchConfig.estimatedTimeSeconds,
      layers,
      layerResults: layers, // Alias for backward compatibility with tests
      successfulLayers: successfulLayers.length,
      failedLayers: failedLayers.length,
      timestamp: new Date().toISOString(),
      redundancy: successfulLayers.length > 1 
        ? `${successfulLayers.length} layers active for maximum reliability` 
        : 'Single layer active',
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Force Update] 🚨 UNEXPECTED ERROR:', error);
    console.error('[Force Update] Error stack:', error.stack);
    
    // Detailed error response
    return NextResponse.json({
      success: false,
      error: error.message || 'Unexpected error in batch update system',
      errorType: error.name || 'UnknownError',
      errorDetails: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        code: error.code,
      },
      timestamp: new Date().toISOString(),
      phase: 'Unknown - Check server logs',
    }, { status: 500 });
  }
}
