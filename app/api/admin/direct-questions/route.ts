// app/api/admin/direct-questions/route.ts
// Admin-only API route for Direct Questions management

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { verifyAdminToken } from '@/utils/adminAuth';

// Helper function to broadcast deletion to affected visitors
async function broadcastDeletionToVisitors(deletedQuestions: any[], permanent: boolean): Promise<void> {
  try {
    // Group questions by visitor UUID
    const visitorGroups = deletedQuestions.reduce((groups, question) => {
      const visitorUuid = question.visitorUuid;
      if (!groups[visitorUuid]) {
        groups[visitorUuid] = [];
      }
      groups[visitorUuid].push(question.id);
      return groups;
    }, {} as Record<string, string[]>);

    // Create deletion events for each visitor
    for (const [visitorUuid, questionIds] of Object.entries(visitorGroups)) {
      const deletionEvent = {
        type: 'questions_deleted',
        visitorUuid,
        questionIds,
        permanent,
        deletedAt: serverTimestamp(),
        adminAction: true
      };

      // Store deletion event in a special collection for visitor cleanup
      await addDoc(collection(db, 'visitorEvents'), deletionEvent);
    }

    console.log(`📢 Broadcasted deletion events to ${Object.keys(visitorGroups).length} visitors`);
  } catch (error) {
    console.error('❌ Failed to broadcast deletion events:', error);
    // Don't throw - deletion should still succeed even if broadcast fails
  }
}

// Helper function to verify admin authentication using JWT
async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  try {
    const admin = await verifyAdminToken(request);
    return admin !== null;
  } catch (error) {
    console.error('Admin auth verification error:', error);
    return false;
  }
}

// GET: Retrieve all questions for admin (with pagination and filtering)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!(await verifyAdminAuth(request))) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status') || 'all';
    const pageSize = parseInt(url.searchParams.get('limit') || '20');
    const lastDocId = url.searchParams.get('lastDoc');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    let questionsQuery = query(collection(db, 'directQuestions'));

    // Apply status filter
    if (statusFilter !== 'all') {
      questionsQuery = query(questionsQuery, where('status', '==', statusFilter));
    }

    // Apply sorting
    questionsQuery = query(
      questionsQuery, 
      orderBy(sortBy, sortOrder as 'asc' | 'desc'),
      limit(pageSize)
    );

    // Apply pagination if lastDoc provided
    if (lastDocId) {
      const lastDocRef = doc(db, 'directQuestions', lastDocId);
      const lastDocSnap = await getDoc(lastDocRef);
      if (lastDocSnap.exists()) {
        questionsQuery = query(questionsQuery, startAfter(lastDocSnap));
      }
    }

    const querySnapshot = await getDocs(questionsQuery);
    const questions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get statistics
    const statsQuery = query(collection(db, 'directQuestions'));
    const statsSnapshot = await getDocs(statsQuery);
    
    const stats = {
      total: statsSnapshot.docs.length,
      unanswered: statsSnapshot.docs.filter(doc => doc.data().status === 'unanswered').length,
      answered: statsSnapshot.docs.filter(doc => doc.data().status === 'answered').length,
      archived: statsSnapshot.docs.filter(doc => doc.data().status === 'archived').length
    };

    return NextResponse.json({
      success: true,
      data: {
        questions,
        stats,
        pagination: {
          hasMore: questions.length === pageSize,
          lastDoc: questions.length > 0 ? questions[questions.length - 1].id : null
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin questions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch questions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST: Admin bulk operations (ban visitor, bulk update status, etc.)
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!(await verifyAdminAuth(request))) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, questionIds, data } = body;

    if (!action || !questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    let updatedCount = 0;

    switch (action) {
      case 'bulk_update_status':
        if (!data?.status) {
          return NextResponse.json(
            { success: false, error: 'Status required for bulk update' },
            { status: 400 }
          );
        }

        for (const questionId of questionIds) {
          const questionRef = doc(db, 'directQuestions', questionId);
          await updateDoc(questionRef, {
            status: data.status,
            updatedAt: serverTimestamp(),
            ...(data.adminNote && { adminNote: data.adminNote })
          });
          updatedCount++;
        }
        break;

      case 'bulk_reply':
        if (!data?.reply) {
          return NextResponse.json(
            { success: false, error: 'Reply required for bulk reply' },
            { status: 400 }
          );
        }

        for (const questionId of questionIds) {
          const questionRef = doc(db, 'directQuestions', questionId);
          await updateDoc(questionRef, {
            adminReply: data.reply,
            status: 'answered',
            answeredAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            unreadForVisitor: true
          });
          updatedCount++;
        }
        break;

      case 'bulk_archive':
        for (const questionId of questionIds) {
          const questionRef = doc(db, 'directQuestions', questionId);
          await updateDoc(questionRef, {
            status: 'archived',
            archivedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          updatedCount++;
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Bulk ${action} completed`,
        updatedCount,
        totalRequested: questionIds.length
      }
    });

  } catch (error) {
    console.error('Error in admin bulk operation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform bulk operation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE: Admin delete questions (permanent)
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!(await verifyAdminAuth(request))) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { questionIds, permanent = false } = body;

    if (!questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json(
        { success: false, error: 'Question IDs required' },
        { status: 400 }
      );
    }

    let deletedCount = 0;
    const deletedQuestions: any[] = [];

    for (const questionId of questionIds) {
      const questionRef = doc(db, 'directQuestions', questionId);
      const questionDoc = await getDoc(questionRef);
      
      if (questionDoc.exists()) {
        const questionData = questionDoc.data();
        deletedQuestions.push({
          id: questionId,
          visitorUuid: questionData.visitorUuid,
          ...questionData
        });

        if (permanent) {
          // Permanent delete from database
          await deleteDoc(questionRef);
        } else {
          // Soft delete by marking as archived with deletion flag
          await updateDoc(questionRef, {
            status: 'archived',
            deletedAt: serverTimestamp(),
            deletedBy: 'admin',
            isDeleted: true,
            updatedAt: serverTimestamp()
          });
        }
        deletedCount++;
      }
    }

    // Send cleanup signal to affected visitors
    if (deletedQuestions.length > 0) {
      await broadcastDeletionToVisitors(deletedQuestions, permanent);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `${deletedCount} question${deletedCount > 1 ? 's' : ''} ${permanent ? 'permanently deleted' : 'archived'}`,
        deletedCount,
        totalRequested: questionIds.length,
        deletionType: permanent ? 'permanent' : 'archive',
        affectedVisitors: [...new Set(deletedQuestions.map(q => q.visitorUuid))]
      }
    });

  } catch (error) {
    console.error('Error deleting questions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete questions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}