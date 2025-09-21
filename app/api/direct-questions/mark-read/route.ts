// app/api/direct-questions/mark-read/route.ts
// API route for marking direct questions as read by visitor with production-safe error handling

import { NextRequest, NextResponse } from 'next/server';
import {
  collection,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db, firebaseModule } from '@/lib/firebase';
import { getVisitorUuidWithFallbacks } from '@/lib/visitor';

// Production-safe response helper
function createResponse(data: any, status: number = 200) {
  const response = {
    success: status >= 200 && status < 300,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  return NextResponse.json(response, { status });
}

// Error response helper
function createErrorResponse(
  error: string,
  status: number = 500,
  details?: any,
  context?: string
) {
  const errorId = Math.random().toString(36).substring(2, 15);
  
  console.error(`❌ [API:mark-read:${context || 'unknown'}:${errorId}] ${error}`, details);
  
  const response = {
    success: false,
    error,
    errorId,
    timestamp: new Date().toISOString(),
    canRetry: status >= 500 && status < 600,
    ...(process.env.NODE_ENV === 'development' && { details })
  };
  
  return NextResponse.json(response, { status });
}

// Check Firebase availability
function isFirebaseReady(): { ready: boolean; reason?: string } {
  if (!db) {
    return { ready: false, reason: 'Database instance not available' };
  }
  
  if (firebaseModule?.initializationError) {
    return { ready: false, reason: firebaseModule.initializationError.message };
  }
  
  return { ready: true };
}

// This function is now replaced by getVisitorUuidWithFallbacks from lib/visitor

// POST: Mark questions as read
export async function POST(request: NextRequest) {
  // Check Firebase availability first
  const firebaseStatus = isFirebaseReady();
  if (!firebaseStatus.ready) {
    return createErrorResponse(
      'Database temporarily unavailable',
      503,
      { reason: firebaseStatus.reason },
      'POST-firebase-check'
    );
  }

  let retryCount = 0;
  const maxRetries = 2;
  const retryDelay = 1000; // 1 second

  while (retryCount < maxRetries) {
    try {
      const body = await request.json();
      const { ids } = body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return createErrorResponse('Question IDs array is required', 400, null, 'POST-validation');
      }

      const visitorUuid = getVisitorUuidWithFallbacks();
      if (!visitorUuid) {
        return createErrorResponse('Visitor identification required', 400, null, 'POST-visitor-uuid');
      }

      console.log(`📖 Marking ${ids.length} questions as read for visitor ${visitorUuid.substring(0, 8)}...`);

      // Use batch for better performance and atomicity (db is guaranteed to be non-null here)
      const batch = writeBatch(db!);
      let markedAsRead = 0;
      let notFoundCount = 0;
      let permissionErrors = 0;
      let alreadyRead = 0;

      for (const questionId of ids) {
        try {
          const questionRef = doc(db!, 'directQuestions', questionId);
          const questionDoc = await getDoc(questionRef);

          if (!questionDoc.exists()) {
            console.warn(`❌ Question ${questionId} not found - may have been deleted`);
            notFoundCount++;
            continue;
          }

          const questionData = questionDoc.data();
          
          // Verify the question belongs to this visitor
          if (questionData.visitorUuid !== visitorUuid) {
            console.error(`🚫 Permission denied: Question ${questionId} doesn't belong to visitor ${visitorUuid.substring(0, 8)}...`);
            permissionErrors++;
            continue;
          }

          // Only update if actually unread
          if (questionData.unreadForVisitor) {
            batch.update(questionRef, {
              unreadForVisitor: false,
              readAt: serverTimestamp(), // Add read timestamp
              updatedAt: serverTimestamp()
            });
            markedAsRead++;
            console.log(`✅ Marked question ${questionId} as read`);
          } else {
            alreadyRead++;
            console.log(`📖 Question ${questionId} was already read`);
          }
        } catch (docError) {
          console.error(`❌ Error processing question ${questionId}:`, docError);
          // Continue with other questions instead of failing the whole batch
        }
      }

      // Commit the batch if there are any updates
      if (markedAsRead > 0) {
        await batch.commit();
        console.log(`✅ Batch committed: ${markedAsRead} questions marked as read`);
      }

      // Return comprehensive status
      return createResponse({
        data: {
          message: `Processed ${ids.length} question${ids.length !== 1 ? 's' : ''}: ${markedAsRead} marked as read`,
          markedAsRead,
          totalRequested: ids.length,
          alreadyRead,
          notFound: notFoundCount,
          permissionErrors,
          success: true,
          visitorUuid: visitorUuid.substring(0, 8) + '...' // Partial UUID for debugging
        }
      });

    } catch (error) {
      retryCount++;
      console.error(`❌ Error marking questions as read (attempt ${retryCount}/${maxRetries}):`, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check for specific error types that shouldn't be retried
      const isPermissionError = errorMessage.includes('permission-denied') ||
                               errorMessage.includes('unauthorized');
      const isNotFoundError = errorMessage.includes('not-found');
      
      if (isPermissionError) {
        return createErrorResponse('Permission denied', 403, { originalError: errorMessage }, 'POST-permission');
      }

      if (isNotFoundError) {
        // If questions not found, consider it successful (they might have been deleted)
        return createResponse({
          data: {
            message: 'Questions may have been deleted',
            markedAsRead: 0,
            totalRequested: 0,
            notFound: 0,
            permissionErrors: 0,
            alreadyRead: 0
          }
        });
      }

      // If this is the last attempt, return error
      if (retryCount >= maxRetries) {
        return createErrorResponse(
          'Failed to mark questions as read after retries',
          503,
          { attempts: retryCount, lastError: errorMessage },
          'POST-max-retries'
        );
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // Fallback (should never reach here)
  return createResponse({
    data: {
      message: 'No questions processed - unexpected fallback',
      markedAsRead: 0,
      totalRequested: 0,
      notFound: 0,
      permissionErrors: 0,
      alreadyRead: 0
    }
  });
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}