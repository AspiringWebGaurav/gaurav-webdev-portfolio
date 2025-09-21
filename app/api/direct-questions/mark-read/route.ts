// app/api/direct-questions/mark-read/route.ts
// API route for marking direct questions as read by visitor

import { NextRequest, NextResponse } from 'next/server';
import { 
  collection,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

// POST: Mark questions as read
export async function POST(request: NextRequest) {
  let retryCount = 0;
  const maxRetries = 2;
  const retryDelay = 1000; // 1 second

  while (retryCount < maxRetries) {
    try {
      const body = await request.json();
      const { ids } = body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Question IDs array is required' },
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

      console.log(`📖 Marking ${ids.length} questions as read for visitor ${visitorUuid}`);

      // Use batch for better performance and atomicity
      const batch = writeBatch(db);
      let markedAsRead = 0;
      let notFoundCount = 0;
      let permissionErrors = 0;

      for (const questionId of ids) {
        try {
          const questionRef = doc(db, 'directQuestions', questionId);
          const questionDoc = await getDoc(questionRef);

          if (!questionDoc.exists()) {
            console.warn(`❌ Question ${questionId} not found - may have been deleted`);
            notFoundCount++;
            continue;
          }

          const questionData = questionDoc.data();
          
          // Verify the question belongs to this visitor
          if (questionData.visitorUuid !== visitorUuid) {
            console.error(`🚫 Permission denied: Question ${questionId} doesn't belong to visitor ${visitorUuid}`);
            permissionErrors++;
            continue;
          }

          // Only update if actually unread
          if (questionData.unreadForVisitor) {
            batch.update(questionRef, {
              unreadForVisitor: false,
              updatedAt: serverTimestamp()
            });
            markedAsRead++;
            console.log(`✅ Marked question ${questionId} as read`);
          }
        } catch (docError) {
          console.error(`❌ Error processing question ${questionId}:`, docError);
          // Continue with other questions instead of failing the whole batch
        }
      }

      // Commit the batch if there are any updates
      if (markedAsRead > 0) {
        await batch.commit();
      }

      // Return success even if some questions weren't found (they might have been deleted)
      return NextResponse.json({
        success: true,
        data: {
          message: `Marked ${markedAsRead} question${markedAsRead !== 1 ? 's' : ''} as read`,
          markedAsRead,
          totalRequested: ids.length,
          notFound: notFoundCount,
          permissionErrors,
          skipped: ids.length - markedAsRead - notFoundCount - permissionErrors
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
        return NextResponse.json(
          { 
            success: false, 
            error: 'Permission denied',
            details: errorMessage
          },
          { status: 403 }
        );
      }

      if (isNotFoundError) {
        // If questions not found, consider it successful (they might have been deleted)
        return NextResponse.json({
          success: true,
          data: {
            message: 'Questions may have been deleted',
            markedAsRead: 0,
            totalRequested: 0,
            notFound: 0,
            permissionErrors: 0,
            skipped: 0
          }
        });
      }

      // If this is the last attempt, return error
      if (retryCount >= maxRetries) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to mark questions as read after retries',
            details: errorMessage,
            canRetry: true
          },
          { status: 503 }
        );
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // Fallback (should never reach here)
  return NextResponse.json({
    success: true,
    data: {
      message: 'No questions processed',
      markedAsRead: 0,
      totalRequested: 0,
      notFound: 0,
      permissionErrors: 0,
      skipped: 0
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