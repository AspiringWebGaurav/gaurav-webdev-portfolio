// app/api/direct-questions/mark-read/route.ts
// API route for marking questions as read by visitor

import { NextRequest, NextResponse } from 'next/server';
import { 
  collection,
  query,
  where,
  writeBatch,
  doc,
  serverTimestamp,
  getDocs
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
    
    return null;
  } catch (error) {
    console.error('Error extracting visitor UUID:', error);
    return null;
  }
}

// POST: Mark questions as read for current visitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    // Validate request
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Question IDs required' },
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

    // Security: Verify that all questions belong to this visitor
    const questionsQuery = query(
      collection(db, 'directQuestions'),
      where('visitorUuid', '==', visitorUuid)
    );

    const querySnapshot = await getDocs(questionsQuery);
    const visitorQuestionIds = new Set(querySnapshot.docs.map(doc => doc.id));

    // Filter out any IDs that don't belong to this visitor
    const validIds = ids.filter(id => visitorQuestionIds.has(id));

    if (validIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid question IDs found for this visitor' },
        { status: 403 }
      );
    }

    // Use batch write to update multiple documents
    const batch = writeBatch(db);

    validIds.forEach(questionId => {
      const questionRef = doc(db, 'directQuestions', questionId);
      batch.update(questionRef, {
        unreadForVisitor: false,
        updatedAt: serverTimestamp(),
        readAt: serverTimestamp()
      });
    });

    // Commit the batch
    await batch.commit();

    return NextResponse.json({
      success: true,
      data: {
        markedAsRead: validIds.length,
        skipped: ids.length - validIds.length,
        message: `${validIds.length} question${validIds.length > 1 ? 's' : ''} marked as read`
      }
    });

  } catch (error) {
    console.error('Error marking questions as read:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to mark questions as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET: Get read status for visitor's questions (optional endpoint)
export async function GET(request: NextRequest) {
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
      where('visitorUuid', '==', visitorUuid)
    );

    const querySnapshot = await getDocs(questionsQuery);
    
    const readStatus = {
      total: querySnapshot.docs.length,
      unread: 0,
      read: 0
    };

    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.unreadForVisitor) {
        readStatus.unread++;
      } else {
        readStatus.read++;
      }
    });

    return NextResponse.json({
      success: true,
      data: readStatus
    });

  } catch (error) {
    console.error('Error getting read status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get read status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}