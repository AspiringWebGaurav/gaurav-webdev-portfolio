/**
 * Suspension System Health Check API
 * GET /api/suspension/health
 * 
 * Monitors the health of the suspension restoration system.
 * Returns status of all critical components.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

const COLLECTION = 'siteSettings';
const DOC_ID = 'suspension';

export async function GET() {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    components: {
      firestore: 'unknown',
      statusAPI: 'unknown',
      animationAPI: 'unknown',
      documentExists: false,
    },
    performance: {
      responseTime: 0,
      firestoreLatency: 0,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
    },
  };

  try {
    // Test Firestore connection
    const firestoreStart = Date.now();
    const docRef = adminDb.collection(COLLECTION).doc(DOC_ID);
    const snapshot = await docRef.get();
    const firestoreLatency = Date.now() - firestoreStart;
    
    health.components.firestore = 'healthy';
    health.components.documentExists = snapshot.exists;
    health.performance.firestoreLatency = firestoreLatency;
    
    if (snapshot.exists) {
      const data = snapshot.data();
      health.components.statusAPI = data?.enabled !== undefined ? 'healthy' : 'degraded';
    } else {
      health.components.statusAPI = 'healthy'; // Document can be missing, that's OK
    }
    
  } catch (error: any) {
    health.status = 'unhealthy';
    health.components.firestore = 'error';
    console.error('[Health Check] Firestore error:', error?.message);
  }

  // Check animation API (non-critical)
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/suspension/animation-state`, {
      method: 'GET',
      cache: 'no-store',
    });
    
    health.components.animationAPI = response.ok ? 'healthy' : 'degraded';
  } catch {
    health.components.animationAPI = 'offline'; // Non-critical
  }

  health.performance.responseTime = Date.now() - startTime;

  // Determine overall status
  if (health.components.firestore === 'error') {
    health.status = 'unhealthy';
  } else if (health.components.statusAPI === 'degraded') {
    health.status = 'degraded';
  } else {
    health.status = 'healthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 207 : 503;

  return NextResponse.json(health, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
