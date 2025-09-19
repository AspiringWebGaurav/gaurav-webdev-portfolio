// app/api/admin/direct-questions/[id]/route.ts
// Individual question management API (admin only)

import { NextRequest, NextResponse } from 'next/server';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  addDoc,
  collection
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { verifyAdminToken } from '@/utils/adminAuth';

// Helper function to broadcast deletion to visitor
async function broadcastDeletionToVisitor(questionData: any, permanent: boolean): Promise<void> {
  try {
    const deletionEvent = {
      type: 'question_deleted',
      visitorUuid: questionData.visitorUuid,
      questionId: questionData.id,
      permanent,
      deletedAt: serverTimestamp(),
      adminAction: true,
      questionText: questionData.question // For cleanup reference
    };

    // Store deletion event for visitor cleanup
    await addDoc(collection(db, 'visitorEvents'), deletionEvent);
    
    console.log(`📢 Broadcasted deletion event to visitor: ${questionData.visitorUuid}`);
  } catch (error) {
    console.error('❌ Failed to broadcast deletion event:', error);
    // Don't throw - deletion should still succeed
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

// GET: Get individual question details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    if (!(await verifyAdminAuth(request))) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 403 }
      );
    }

    const questionId = params.id;

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

    const questionData = {
      id: questionDoc.id,
      ...questionDoc.data()
    };

    return NextResponse.json({
      success: true,
      data: {
        question: questionData
      }
    });

  } catch (error) {
    console.error('Error fetching question details:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch question details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT: Update individual question (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    if (!(await verifyAdminAuth(request))) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 403 }
      );
    }

    const questionId = params.id;
    const body = await request.json();
    const { adminReply, status, reviewNotes } = body;

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID required' },
        { status: 400 }
      );
    }

    // Get the question document to verify it exists
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

    // Handle admin reply
    if (adminReply !== undefined) {
      updateData.adminReply = adminReply.trim();
      updateData.answeredAt = serverTimestamp();
      updateData.unreadForVisitor = true; // Mark as unread for visitor
      updateData.status = 'answered'; // Automatically set to answered when reply is provided
    }

    // Handle status update
    if (status !== undefined && status !== updateData.status) {
      updateData.status = status;
    }

    // Handle review notes
    if (reviewNotes !== undefined) {
      updateData.reviewNotes = reviewNotes;
    }

    // Update the document
    await updateDoc(questionRef, updateData);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Question updated successfully',
        questionId
      }
    });

  } catch (error) {
    console.error('Error updating question:', error);
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

// DELETE: Delete individual question (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    if (!(await verifyAdminAuth(request))) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 403 }
      );
    }

    const questionId = params.id;

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID required' },
        { status: 400 }
      );
    }

    // Get the question document to verify it exists
    const questionRef = doc(db, 'directQuestions', questionId);
    const questionDoc = await getDoc(questionRef);

    if (!questionDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    const questionData = {
      id: questionId,
      ...questionDoc.data()
    };

    // Check deletion type
    const isHardDelete = request.nextUrl.searchParams.get('hard') === 'true';

    if (isHardDelete) {
      // Permanent delete from database
      await deleteDoc(questionRef);
    } else {
      // Soft delete (archive) with deletion flag
      await updateDoc(questionRef, {
        status: 'archived',
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deletedBy: 'admin',
        isDeleted: true
      });
    }

    // Broadcast deletion to visitor for cleanup
    await broadcastDeletionToVisitor(questionData, isHardDelete);

    return NextResponse.json({
      success: true,
      data: {
        message: `Question ${isHardDelete ? 'permanently deleted' : 'archived'} successfully`,
        questionId,
        deletionType: isHardDelete ? 'permanent' : 'archive',
        visitorUuid: (questionData as any).visitorUuid
      }
    });

  } catch (error) {
    console.error('Error deleting question:', error);
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