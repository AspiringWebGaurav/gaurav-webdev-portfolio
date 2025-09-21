// app/api/health/firebase/route.ts
// Comprehensive Firebase and environment health check for production debugging

import { NextRequest, NextResponse } from 'next/server';
import { db, app, storage, firebaseModule } from '@/lib/firebase';
import { validateFirebaseEnvironment, getEnvironmentInfo } from '@/utils/environmentValidator';
import { 
  collection, 
  getDocs, 
  query, 
  limit,
  serverTimestamp,
  addDoc 
} from 'firebase/firestore';

interface HealthCheckResult {
  timestamp: string;
  environment: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  firebase: {
    client: {
      status: 'available' | 'unavailable' | 'error';
      details: any;
    };
    database: {
      status: 'connected' | 'disconnected' | 'error';
      details: any;
    };
    collections: {
      directQuestions: {
        status: 'accessible' | 'inaccessible' | 'error';
        count?: number;
        error?: string;
      };
    };
  };
  environment_variables: {
    status: 'valid' | 'invalid' | 'missing';
    details: any;
  };
  api_fallbacks: {
    available: boolean;
    endpoints: string[];
  };
  recommendations: string[];
}

// Test Firebase connectivity
async function testFirebaseConnectivity(): Promise<any> {
  const results: {
    client: { status: 'available' | 'unavailable' | 'error'; details: any };
    database: { status: 'connected' | 'disconnected' | 'error'; details: any };
    collections: {
      directQuestions: { status: 'accessible' | 'inaccessible' | 'error'; count?: number; error?: string };
    };
  } = {
    client: { status: 'unavailable', details: null },
    database: { status: 'disconnected', details: null },
    collections: {
      directQuestions: { status: 'inaccessible' }
    }
  };

  try {
    // Test Firebase client availability
    if (app && db) {
      results.client = {
        status: 'available',
        details: {
          appName: app.name,
          projectId: app.options.projectId,
          hasDb: !!db,
          hasStorage: !!storage,
          initializationError: firebaseModule?.initializationError?.message || null
        }
      };

      // Test database connection
      try {
        const testCollection = collection(db, 'directQuestions');
        const testQuery = query(testCollection, limit(1));
        const snapshot = await getDocs(testQuery);
        
        results.database = {
          status: 'connected',
          details: {
            canRead: true,
            collectionExists: true,
            documentCount: snapshot.size
          }
        };

        results.collections.directQuestions = {
          status: 'accessible',
          count: snapshot.size
        };

        // Test write capability with a dummy document
        try {
          const testDoc = {
            healthCheck: true,
            timestamp: serverTimestamp(),
            environment: process.env.NODE_ENV
          };
          
          // Only attempt write if we're in development or test mode
          if (process.env.NODE_ENV !== 'production') {
            await addDoc(collection(db, '_healthCheck'), testDoc);
            results.database.details.canWrite = true;
          } else {
            results.database.details.canWrite = 'skipped-in-production';
          }
        } catch (writeError) {
          results.database.details.canWrite = false;
          results.database.details.writeError = writeError instanceof Error ? writeError.message : String(writeError);
        }

      } catch (dbError) {
        results.database = {
          status: 'error',
          details: {
            error: dbError instanceof Error ? dbError.message : String(dbError),
            canRead: false
          }
        };

        results.collections.directQuestions = {
          status: 'error',
          error: dbError instanceof Error ? dbError.message : String(dbError)
        };
      }
    } else {
      results.client = {
        status: 'unavailable',
        details: {
          hasApp: !!app,
          hasDb: !!db,
          hasStorage: !!storage,
          reason: 'Firebase instances not initialized'
        }
      };
    }
  } catch (clientError) {
    results.client = {
      status: 'error',
      details: {
        error: clientError instanceof Error ? clientError.message : String(clientError)
      }
    };
  }

  return results;
}

// Generate recommendations based on health check results
function generateRecommendations(
  envValidation: any,
  firebaseTests: any,
  envInfo: any
): string[] {
  const recommendations: string[] = [];

  // Environment variable recommendations
  if (!envValidation.isValid) {
    recommendations.push(
      `❌ Add missing environment variables: ${envValidation.missing.join(', ')}`
    );
    
    if (envInfo.platform === 'vercel') {
      recommendations.push('🔧 Set variables in Vercel Dashboard: Settings > Environment Variables');
    } else if (envInfo.platform === 'netlify') {
      recommendations.push('🔧 Set variables in Netlify Dashboard: Site Settings > Environment Variables');
    }
  }

  // Firebase client recommendations
  if (firebaseTests.client.status !== 'available') {
    recommendations.push('🔥 Firebase client not properly initialized - check environment variables');
    
    if (firebaseModule?.initializationError) {
      recommendations.push(`🔥 Firebase initialization error: ${firebaseModule.initializationError.message}`);
    }
  }

  // Database connectivity recommendations
  if (firebaseTests.database.status !== 'connected') {
    recommendations.push('💾 Database connectivity issues - API fallbacks will be used');
    
    if (firebaseTests.database.status === 'error') {
      recommendations.push('💾 Check Firestore security rules and permissions');
    }
  }

  // General recommendations
  if (envInfo.isServerless) {
    recommendations.push('⚡ Running in serverless environment - ensure cold start optimizations');
  }

  if (process.env.NODE_ENV === 'production' && recommendations.length === 0) {
    recommendations.push('✅ All systems operational - no action required');
  }

  return recommendations;
}

// GET: Comprehensive health check
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get environment info
    const envInfo = getEnvironmentInfo();
    const envValidation = validateFirebaseEnvironment();
    
    // Test Firebase connectivity
    const firebaseTests = await testFirebaseConnectivity();
    
    // Determine overall health status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (!envValidation.isValid || firebaseTests.client.status === 'error') {
      overallStatus = 'unhealthy';
    } else if (firebaseTests.client.status !== 'available' || firebaseTests.database.status !== 'connected') {
      overallStatus = 'degraded';
    }
    
    // Generate recommendations
    const recommendations = generateRecommendations(envValidation, firebaseTests, envInfo);
    
    // Build health check result
    const healthResult: HealthCheckResult = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      status: overallStatus,
      firebase: firebaseTests,
      environment_variables: {
        status: envValidation.isValid ? 'valid' : 'invalid',
        details: {
          missing: envValidation.missing,
          warnings: envValidation.warnings,
          hasFirebaseClient: envInfo.hasFirebaseClient,
          hasFirebaseAdmin: envInfo.hasFirebaseAdmin
        }
      },
      api_fallbacks: {
        available: true, // API routes are always available
        endpoints: [
          '/api/direct-questions (GET, POST)',
          '/api/direct-questions/mark-read (POST)',
          '/api/health/firebase (GET)'
        ]
      },
      recommendations
    };
    
    const processingTime = Date.now() - startTime;
    
    // Log health check results
    console.log(`🏥 Health Check [${overallStatus.toUpperCase()}] completed in ${processingTime}ms`);
    if (recommendations.length > 0) {
      console.log('📋 Recommendations:', recommendations);
    }
    
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 206 : 503;
    
    return NextResponse.json({
      success: true,
      health: healthResult,
      performance: {
        processingTimeMs: processingTime,
        serverTime: new Date().toISOString()
      },
      meta: {
        version: '1.0.0',
        platform: envInfo.platform,
        region: process.env.VERCEL_REGION || process.env.AWS_REGION || 'unknown'
      }
    }, { status: statusCode });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json({
      success: false,
      health: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error),
        recommendations: [
          '❌ Health check system failure - check server logs',
          '🔧 Contact system administrator if issues persist'
        ]
      },
      performance: {
        processingTimeMs: Date.now() - startTime,
        serverTime: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}