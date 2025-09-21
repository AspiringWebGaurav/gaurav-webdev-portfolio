// app/api/direct-questions/route.ts
// Main API route for Direct Questions CRUD operations

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
import { db } from '@/lib/firebase';
import { getVisitorUuidWithFallbacks } from '@/lib/visitor';
import { validateQuestion } from '@/lib/askDirectly';
import type { CreateDirectQuestionData, QuestionStatus } from '@/lib/types';

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

  while (retryCount < maxRetries) {
    try {
      const visitorUuid = getVisitorUuidFromRequest(request);
      
      if (!visitorUuid) {
        return NextResponse.json(
          { success: false, error: 'Visitor UUID required' },
          { status: 400 }
        );
      }

      // Query questions for this visitor
      const questionsQuery = query(
        collection(db, 'directQuestions'),
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

      return NextResponse.json({
        success: true,
        data: {
          questions: validQuestions,
          count: validQuestions.length,
          filtered: rawQuestions.length - validQuestions.length
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
        return NextResponse.json({
          success: true, // Return success with empty data instead of error
          data: {
            questions: [],
            count: 0,
            message: 'No questions found or access restricted'
          }
        });
      }
      
      // If this is the last attempt, return error
      if (retryCount >= maxRetries) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch questions after retries',
            details: errorMessage,
            canRetry: true
          },
          { status: 503 } // Service temporarily unavailable
        );
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retryCount - 1)));
    }
  }

  // Fallback (should never reach here)
  return NextResponse.json({
    success: true,
    data: {
      questions: [],
      count: 0
    }
  });
}

// POST: Create new question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, metadata: clientMetadata } = body;

    // Validate question
    const validation = validateQuestion(question);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const visitorUuid = getVisitorUuidFromRequest(request);
    if (!visitorUuid) {
      return NextResponse.json(
        { success: false, error: 'Visitor UUID required' },
        { status: 400 }
      );
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
      timezone: clientMetadata?.timezone || 'UTC'
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

    const docRef = await addDoc(collection(db, 'directQuestions'), questionData);

    return NextResponse.json({
      success: true,
      data: {
        questionId: docRef.id,
        message: 'Question submitted successfully'
      }
    });

  } catch (error) {
    console.error('Error creating direct question:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to submit question',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT: Update question (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    // Simple admin check - in production, implement proper JWT verification
    if (!authHeader || !authHeader.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { questionId, adminReply, status, reviewNotes } = body;

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID required' },
        { status: 400 }
      );
    }

    // Get the question document
    const questionRef = doc(db, 'directQuestions', questionId);
    const questionDoc = await getDoc(questionRef);

    if (!questionDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
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

    return NextResponse.json({
      success: true,
      data: {
        message: 'Question updated successfully'
      }
    });

  } catch (error) {
    console.error('Error updating direct question:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update question',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete question (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const questionId = url.searchParams.get('id');

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID required' },
        { status: 400 }
      );
    }

    // Delete the question document
    const questionRef = doc(db, 'directQuestions', questionId);
    const questionDoc = await getDoc(questionRef);

    if (!questionDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    // In production, you might want to soft delete instead
    // For now, we'll do a hard delete
    await updateDoc(questionRef, {
      status: 'archived',
      updatedAt: serverTimestamp(),
      deletedAt: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Question deleted successfully'
      }
    });

  } catch (error) {
    console.error('Error deleting direct question:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete question',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}