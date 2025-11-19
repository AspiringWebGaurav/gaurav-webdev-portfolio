import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, orderBy, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

const COLLECTIONS = {
  QUESTIONS: 'bubblePredefinedQuestions',
};

// GET: Fetch all active predefined questions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const questionsRef = collection(db, COLLECTIONS.QUESTIONS);
    
    // Fetch all documents and sort in memory to avoid composite index requirement
    // This is acceptable since predefined questions are typically a small dataset
    const q = query(questionsRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    
    let questions = querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data() as any;
      
      // Handle different date formats (Timestamp or already Date/string)
      const getDate = (dateField: any) => {
        if (!dateField) return new Date();
        if (typeof dateField?.toDate === 'function') return dateField.toDate();
        if (dateField instanceof Date) return dateField;
        if (typeof dateField === 'string' || typeof dateField === 'number') return new Date(dateField);
        return new Date();
      };
      
      return {
        id: docSnapshot.id,
        question: data.question,
        answer: data.answer,
        order: data.order,
        active: data.active,
        createdAt: getDate(data.createdAt),
        updatedAt: getDate(data.updatedAt),
      };
    });

    // Filter inactive questions if needed (in-memory filtering)
    if (!includeInactive) {
      questions = questions.filter(q => q.active === true);
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error in questions GET:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// POST: Create a new predefined question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, answer, order } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    const questionId = uuidv4();
    const questionData = {
      id: questionId,
      question,
      answer,
      order: order || 0,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
    };

    await addDoc(collection(db, COLLECTIONS.QUESTIONS), questionData);

    return NextResponse.json({
      id: questionId,
      question,
      answer,
      order: order || 0,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error in questions POST:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}

// PUT: Update a predefined question
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, question, answer, order, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Question ID required' }, { status: 400 });
    }

    const questionsRef = collection(db, COLLECTIONS.QUESTIONS);
    const q = query(questionsRef, where('id', '==', id));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const questionDoc = querySnapshot.docs[0];
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    if (question !== undefined) updateData.question = question;
    if (answer !== undefined) updateData.answer = answer;
    if (order !== undefined) updateData.order = order;
    if (active !== undefined) updateData.active = active;

    await updateDoc(doc(db, COLLECTIONS.QUESTIONS, questionDoc.id), updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in questions PUT:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

// DELETE: Soft delete a question (move to recycle bin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const permanent = searchParams.get('permanent') === 'true';

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID required' }, { status: 400 });
    }

    const questionsRef = collection(db, COLLECTIONS.QUESTIONS);
    const q = query(questionsRef, where('id', '==', questionId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const questionDoc = querySnapshot.docs[0];

    if (permanent) {
      await deleteDoc(doc(db, COLLECTIONS.QUESTIONS, questionDoc.id));
    } else {
      await updateDoc(doc(db, COLLECTIONS.QUESTIONS, questionDoc.id), {
        deletedAt: serverTimestamp(),
        active: false,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in questions DELETE:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
