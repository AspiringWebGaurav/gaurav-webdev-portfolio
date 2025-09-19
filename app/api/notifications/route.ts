// app/api/notifications/route.ts
// API endpoints for notification management

import { NextRequest, NextResponse } from 'next/server';
import { 
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  Timestamp
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
    
    // Fallback: check URL params
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

// Helper function to create notification from question
function createNotificationFromQuestion(questionData: any) {
  const MAX_PREVIEW_LENGTH = 100;
  
  return {
    id: `${questionData.id}_answer_${Date.now()}`,
    questionId: questionData.id,
    type: questionData.adminReply ? 'new_answer' : 'question_update',
    timestamp: questionData.answeredAt || questionData.updatedAt,
    questionPreview: questionData.question.length > MAX_PREVIEW_LENGTH 
      ? questionData.question.substring(0, MAX_PREVIEW_LENGTH) + '...'
      : questionData.question,
    answerPreview: questionData.adminReply 
      ? (questionData.adminReply.length > MAX_PREVIEW_LENGTH
          ? questionData.adminReply.substring(0, MAX_PREVIEW_LENGTH) + '...'
          : questionData.adminReply)
      : 'No answer yet',
    isRead: false,
    isShown: false,
    isDisplayed: false,
    fullQuestion: questionData.question,
    fullAnswer: questionData.adminReply
  };
}

// GET: Get notifications for current visitor
export async function GET(request: NextRequest) {
  try {
    const visitorUuid = getVisitorUuidFromRequest(request);
    
    if (!visitorUuid) {
      return NextResponse.json(
        { success: false, error: 'Visitor UUID required' },
        { status: 400 }
      );
    }

    // Get URL parameters
    const url = new URL(request.url);
    const includeRead = url.searchParams.get('includeRead') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Query for visitor's answered questions that are unread
    let questionsQuery = query(
      collection(db, 'directQuestions'),
      where('visitorUuid', '==', visitorUuid),
      where('status', '==', 'answered'),
      orderBy('answeredAt', 'desc')
    );

    // Add unread filter if not including read notifications
    if (!includeRead) {
      questionsQuery = query(
        questionsQuery,
        where('unreadForVisitor', '==', true)
      );
    }

    const querySnapshot = await getDocs(questionsQuery);
    const notifications = querySnapshot.docs
      .slice(0, limit)
      .map(doc => {
        const questionData = { id: doc.id, ...doc.data() };
        return createNotificationFromQuestion(questionData);
      });

    // Calculate statistics
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      hasUnread: notifications.some(n => !n.isRead)
    };

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST: Mark notifications as read or update preferences
export async function POST(request: NextRequest) {
  try {
    const visitorUuid = getVisitorUuidFromRequest(request);
    
    if (!visitorUuid) {
      return NextResponse.json(
        { success: false, error: 'Visitor UUID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, questionIds, preferences } = body;

    switch (action) {
      case 'mark_read':
        if (!questionIds || !Array.isArray(questionIds)) {
          return NextResponse.json(
            { success: false, error: 'Question IDs required for mark_read action' },
            { status: 400 }
          );
        }

        // Use batch write to update multiple documents efficiently
        const batch = writeBatch(db);
        let updateCount = 0;

        for (const questionId of questionIds) {
          const questionRef = doc(db, 'directQuestions', questionId);
          batch.update(questionRef, {
            unreadForVisitor: false,
            readAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          updateCount++;
        }

        await batch.commit();

        return NextResponse.json({
          success: true,
          data: {
            message: `${updateCount} notification${updateCount > 1 ? 's' : ''} marked as read`,
            updatedCount: updateCount
          }
        });

      case 'mark_shown':
        if (!questionIds || !Array.isArray(questionIds)) {
          return NextResponse.json(
            { success: false, error: 'Question IDs required for mark_shown action' },
            { status: 400 }
          );
        }

        // This is handled client-side in localStorage, but we could track it server-side too
        return NextResponse.json({
          success: true,
          data: {
            message: 'Notifications marked as shown (tracked client-side)',
            questionIds
          }
        });

      case 'update_preferences':
        if (!preferences) {
          return NextResponse.json(
            { success: false, error: 'Preferences required for update_preferences action' },
            { status: 400 }
          );
        }

        // Store preferences in a visitor preferences document
        // This is optional - preferences can be stored client-side only
        return NextResponse.json({
          success: true,
          data: {
            message: 'Preferences updated (stored client-side)',
            preferences
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing notification action:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process notification action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT: Update notification preferences (alternative to POST)
export async function PUT(request: NextRequest) {
  try {
    const visitorUuid = getVisitorUuidFromRequest(request);
    
    if (!visitorUuid) {
      return NextResponse.json(
        { success: false, error: 'Visitor UUID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json(
        { success: false, error: 'Preferences required' },
        { status: 400 }
      );
    }

    // For now, we'll just validate the preferences structure
    const validPreferences = {
      soundEnabled: Boolean(preferences.soundEnabled),
      persistentOverlay: Boolean(preferences.persistentOverlay),
      showPreviews: Boolean(preferences.showPreviews),
      onlyWhenActive: Boolean(preferences.onlyWhenActive),
      soundVolume: Math.max(0, Math.min(1, Number(preferences.soundVolume) || 0.7)),
      autoHideTimeout: Math.max(1000, Number(preferences.autoHideTimeout) || 10000)
    };

    return NextResponse.json({
      success: true,
      data: {
        message: 'Preferences updated successfully',
        preferences: validPreferences
      }
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE: Clear all notifications for visitor
export async function DELETE(request: NextRequest) {
  try {
    const visitorUuid = getVisitorUuidFromRequest(request);
    
    if (!visitorUuid) {
      return NextResponse.json(
        { success: false, error: 'Visitor UUID required' },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const questionId = url.searchParams.get('questionId');

    if (questionId) {
      // Clear specific notification by marking question as read
      const questionRef = doc(db, 'directQuestions', questionId);
      await updateDoc(questionRef, {
        unreadForVisitor: false,
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return NextResponse.json({
        success: true,
        data: {
          message: 'Notification cleared',
          questionId
        }
      });
    } else {
      // Clear all notifications for visitor
      const questionsQuery = query(
        collection(db, 'directQuestions'),
        where('visitorUuid', '==', visitorUuid),
        where('unreadForVisitor', '==', true)
      );

      const querySnapshot = await getDocs(questionsQuery);
      const batch = writeBatch(db);
      let clearCount = 0;

      querySnapshot.forEach(doc => {
        batch.update(doc.ref, {
          unreadForVisitor: false,
          readAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        clearCount++;
      });

      if (clearCount > 0) {
        await batch.commit();
      }

      return NextResponse.json({
        success: true,
        data: {
          message: `${clearCount} notifications cleared`,
          clearedCount: clearCount
        }
      });
    }

  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}