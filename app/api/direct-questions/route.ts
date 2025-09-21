// app/api/direct-questions/route.ts
// Main API route for Direct Questions CRUD operations with production-safe error handling

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db, firebaseModule } from '@/lib/firebase';
import { getVisitorUuidWithFallbacks } from '@/lib/visitor';
import { validateQuestion } from '@/lib/askDirectly';
import { validateFirebaseEnvironment, getEnvironmentInfo } from '@/utils/environmentValidator';
import type { CreateDirectQuestionData, QuestionStatus } from '@/lib/types';

// Production-safe response helper
function createResponse(data: any, status: number = 200) {
  const response = {
    success: status >= 200 && status < 300,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    ...data
  };
  
  return NextResponse.json(response, { status });
}

// Error response helper with detailed logging
function createErrorResponse(
  error: string,
  status: number = 500,
  details?: any,
  context?: string
) {
  const errorId = Math.random().toString(36).substring(2, 15);
  
  console.error(`❌ [API:${context || 'unknown'}:${errorId}] ${error}`, details);
  
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

// Helper function to get visitor UUID from request
function getVisitorUuidFromRequest(request: NextRequest): string | null {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const uuidMatch = cookieHeader.match(/visitor_uuid=([^;]+)/);
    
    if (uuidMatch) {
      return uuidMatch[1];
    }
    
    // Fallback: check URL params or headers
    const url = new URL(request.url);
    const urlUuid = url.searchParams.get('visitorUuid');
    if (urlUuid) {
      return urlUuid;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting visitor UUID:', error);
    return null;
  }
}

// Helper function to get client IP for metadata
function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') ||
         request.headers.get('x-real-ip') ||
         '127.0.0.1';
}

// Helper function to hash IP for privacy
function hashIP(ip: string): string {
  // Simple hash for privacy - in production, use crypto.createHash
  return btoa(ip).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
}

// GET: Retrieve questions for current visitor with enhanced error handling
export async function GET(request: NextRequest) {
  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  // Check Firebase availability first
  const firebaseStatus = isFirebaseReady();
  if (!firebaseStatus.ready) {
    console.warn('Firebase not available for GET /api/direct-questions:', firebaseStatus.reason);
    return createErrorResponse(
      'Database temporarily unavailable',
      503,
      { reason: firebaseStatus.reason },
      'GET-firebase-check'
    );
  }

  while (retryCount < maxRetries) {
    try {
      const visitorUuid = getVisitorUuidWithFallbacks();
      
      if (!visitorUuid) {
        return createErrorResponse('Visitor identification required', 400, null, 'GET-visitor-uuid');
      }

      // Query questions for this visitor (db is guaranteed to be non-null here)
      const questionsQuery = query(
        collection(db!, 'directQuestions'),
        where('visitorUuid', '==', visitorUuid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(questionsQuery);
      const rawQuestions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        } as any; // Type as any to allow property access
      });

      // Filter out malformed or deleted questions
      const validQuestions = rawQuestions.filter((question: any) => {
        return question &&
               question.id &&
               question.question &&
               question.status &&
               question.visitorUuid &&
               !question.isDeleted; // Filter out soft-deleted questions
      });

      // Log if we filtered out any questions
      if (validQuestions.length !== rawQuestions.length) {
        console.warn(`Filtered ${rawQuestions.length - validQuestions.length} invalid/deleted questions for visitor ${visitorUuid}`);
      }

      return createResponse({
        data: {
          questions: validQuestions,
          count: validQuestions.length,
          filtered: rawQuestions.length - validQuestions.length,
          visitorUuid: visitorUuid.substring(0, 8) + '...' // Partial UUID for debugging
        }
      });

    } catch (error) {
      retryCount++;
      console.error(`Error fetching direct questions (attempt ${retryCount}/${maxRetries}):`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check for specific error types that shouldn't be retried
      const isPermissionError = errorMessage.includes('permission-denied') ||
                               errorMessage.includes('unauthorized');
      const isNotFoundError = errorMessage.includes('not-found') ||
                             errorMessage.includes('collection does not exist');
      
      if (isPermissionError || isNotFoundError) {
        // Don't retry permission or not found errors
        console.warn(`Non-retryable error: ${errorMessage}`);
        return createResponse({
          data: {
            questions: [],
            count: 0,
            message: 'No questions found or access restricted'
          }
        });
      }
      
      // If this is the last attempt, return error
      if (retryCount >= maxRetries) {
        return createErrorResponse(
          'Failed to fetch questions after retries',
          503,
          { attempts: retryCount, lastError: errorMessage },
          'GET-max-retries'
        );
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retryCount - 1)));
    }
  }

  // Fallback (should never reach here)
  return createResponse({
    data: {
      questions: [],
      count: 0,
      message: 'Fallback response'
    }
  });
}

// POST: Create new question
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { question, metadata: clientMetadata } = body;

    // Validate question
    const validation = validateQuestion(question);
    if (!validation.isValid) {
      return createErrorResponse(validation.error || 'Invalid question', 400, null, 'POST-validation');
    }

    const visitorUuid = getVisitorUuidWithFallbacks();
    if (!visitorUuid) {
      return createErrorResponse('Visitor identification required', 400, null, 'POST-visitor-uuid');
    }

    // Get request metadata
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    
    // Combine client and server metadata
    const fullMetadata = {
      pagePath: clientMetadata?.pagePath || '/',
      referrer: clientMetadata?.referrer || null,
      ipHash: hashIP(clientIP),
      userAgent,
      language: clientMetadata?.language || 'en',
      screenResolution: clientMetadata?.screenResolution || 'unknown',
      timezone: clientMetadata?.timezone || 'UTC',
      submittedAt: new Date().toISOString()
    };

    // Create question document
    const questionData = {
      visitorUuid,
      question: validation.cleanedQuestion!,
      status: 'unanswered' as QuestionStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      answeredAt: null,
      adminReply: null,
      unreadForVisitor: false,
      metadata: fullMetadata
    };

    // db is guaranteed to be non-null here due to Firebase check above
    const docRef = await addDoc(collection(db!, 'directQuestions'), questionData);

    console.log(`✅ Question created: ${docRef.id} for visitor ${visitorUuid.substring(0, 8)}...`);

    return createResponse({
      data: {
        questionId: docRef.id,
        message: 'Question submitted successfully',
        visitorUuid: visitorUuid.substring(0, 8) + '...' // Partial for debugging
      }
    });

  } catch (error) {
    return createErrorResponse(
      'Failed to submit question',
      500,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name
      },
      'POST-submission'
    );
  }
}

// PUT: Update question (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Check Firebase availability first
    const firebaseStatus = isFirebaseReady();
    if (!firebaseStatus.ready) {
      return createErrorResponse(
        'Database temporarily unavailable',
        503,
        { reason: firebaseStatus.reason },
        'PUT-firebase-check'
      );
    }

    // Check admin authentication
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    // Simple admin check - in production, implement proper JWT verification
    if (!authHeader || !authHeader.includes('admin')) {
      return createErrorResponse('Admin access required', 403, null, 'PUT-auth');
    }

    const body = await request.json();
    const { questionId, adminReply, status, reviewNotes } = body;

    if (!questionId) {
      return createErrorResponse('Question ID required', 400, null, 'PUT-validation');
    }

    // Get the question document (db is guaranteed to be non-null here)
    const questionRef = doc(db!, 'directQuestions', questionId);
    const questionDoc = await getDoc(questionRef);

    if (!questionDoc.exists()) {
      return createErrorResponse('Question not found', 404, null, 'PUT-not-found');
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    if (adminReply !== undefined) {
      updateData.adminReply = adminReply;
      updateData.answeredAt = serverTimestamp();
      updateData.unreadForVisitor = true; // Mark as unread for visitor
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (reviewNotes !== undefined) {
      updateData.reviewNotes = reviewNotes;
    }

    // Update the document
    await updateDoc(questionRef, updateData);

    console.log(`✅ Question updated: ${questionId} by admin`);

    return createResponse({
      data: {
        message: 'Question updated successfully',
        questionId,
        updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
      }
    });

  } catch (error) {
    return createErrorResponse(
      'Failed to update question',
      500,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name
      },
      'PUT-update'
    );
  }
}

// DELETE: Delete question (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check Firebase availability first
    const firebaseStatus = isFirebaseReady();
    if (!firebaseStatus.ready) {
      return createErrorResponse(
        'Database temporarily unavailable',
        503,
        { reason: firebaseStatus.reason },
        'DELETE-firebase-check'
      );
    }

    // Check admin authentication
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.includes('admin')) {
      return createErrorResponse('Admin access required', 403, null, 'DELETE-auth');
    }

    const url = new URL(request.url);
    const questionId = url.searchParams.get('id');

    if (!questionId) {
      return createErrorResponse('Question ID required', 400, null, 'DELETE-validation');
    }

    // Get the question document (db is guaranteed to be non-null here)
    const questionRef = doc(db!, 'directQuestions', questionId);
    const questionDoc = await getDoc(questionRef);

    if (!questionDoc.exists()) {
      return createErrorResponse('Question not found', 404, null, 'DELETE-not-found');
    }

    // Soft delete - mark as archived instead of hard delete
    await updateDoc(questionRef, {
      status: 'archived',
      updatedAt: serverTimestamp(),
      deletedAt: serverTimestamp(),
      isDeleted: true // Add soft delete flag
    });

    console.log(`✅ Question soft-deleted: ${questionId} by admin`);

    return createResponse({
      data: {
        message: 'Question deleted successfully',
        questionId,
        method: 'soft-delete' // Indicate it's a soft delete
      }
    });

  } catch (error) {
    return createErrorResponse(
      'Failed to delete question',
      500,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name
      },
      'DELETE-operation'
    );
  }
}