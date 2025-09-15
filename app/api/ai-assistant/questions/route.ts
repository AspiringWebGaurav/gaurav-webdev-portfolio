import { NextRequest, NextResponse } from 'next/server';
import { db, app, storage } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { prodLogger, devLogger } from '@/utils/secureLogger';

// Enhanced error handling and retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced Firebase operation with retry logic
const withRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = MAX_RETRIES
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      devLogger.debug(`${operationName} attempt ${attempt}/${maxRetries}`);
      const result = await operation();
      
      if (attempt > 1) {
        devLogger.debug(`${operationName} succeeded on attempt ${attempt}`);
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      devLogger.warn(`${operationName} attempt ${attempt} failed`, {
        error: lastError.message,
        attempt,
        maxRetries
      });

      // If it's the last attempt, don't wait
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying with exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
  
  throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
};

// GET - Fetch all questions with enhanced error handling
export async function GET() {
  const startTime = Date.now();
  
  try {
    devLogger.debug('Fetching AI questions from Firebase');

    // Check if Firebase is properly initialized
    if (!db) {
      prodLogger.error('Firebase database not initialized');
      return NextResponse.json(
        {
          success: false,
          error: 'Database service unavailable. Please try again later.',
          fallback: true
        },
        { status: 503 }
      );
    }

    const questions = await withRetry(async () => {
      const questionsRef = collection(db, 'ai_questions');
      const q = query(questionsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString()
        };
      });
    }, 'Firebase questions fetch');

    devLogger.debug('Successfully fetched questions', {
      count: questions.length,
      duration: Date.now() - startTime
    });

    return NextResponse.json({
      success: true,
      data: {
        questions,
        total: questions.length,
        source: 'firebase',
        duration: Date.now() - startTime
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    prodLogger.error('Failed to fetch questions after retries', {
      error: errorMessage,
      duration: Date.now() - startTime
    });

    // Check if it's a Firebase-specific error
    const isFirebaseError = errorMessage.includes('Firebase') ||
                           errorMessage.includes('firestore') ||
                           errorMessage.includes('permission-denied') ||
                           errorMessage.includes('unavailable');

    return NextResponse.json(
      {
        success: false,
        error: isFirebaseError
          ? 'Database service is temporarily unavailable. Please try again later.'
          : 'Failed to load questions. Please try again later.',
        fallback: true,
        errorType: isFirebaseError ? 'firebase' : 'unknown'
      },
      { status: 503 }
    );
  }
}

// POST - Create new question
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const question = formData.get('question') as string;
    const answer = formData.get('answer') as string;
    const anchorLink = formData.get('anchorLink') as string;
    const file = formData.get('file') as File | null;

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    let fileUrl = '';
    let fileName = '';

    // Handle file upload if present
    if (file && file.size > 0) {
      try {
        console.log('📁 File upload initiated:', {
          name: file.name,
          size: file.size,
          type: file.type
        });

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          console.error('❌ File size validation failed:', file.size);
          return NextResponse.json(
            { success: false, error: 'File size exceeds 10MB limit' },
            { status: 400 }
          );
        }

        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'image/jpeg',
          'image/jpg',
          'image/png'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          console.error('❌ File type validation failed:', file.type);
          return NextResponse.json(
            { success: false, error: 'File type not supported. Please upload PDF, DOC, DOCX, TXT, JPG, JPEG, or PNG files.' },
            { status: 400 }
          );
        }

        console.log('✅ File validation passed');

        // Use the centralized storage instance
        console.log('📤 Using Firebase Storage instance:', {
          bucket: storage.app.options.storageBucket
        });
        
        // Create a safe filename
        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `ai-assistant-files/${timestamp}-${safeFileName}`;
        const fileRef = ref(storage, filePath);
        
        console.log('📤 Uploading to Firebase Storage:', {
          path: filePath,
          bucket: storage.app.options.storageBucket
        });
        
        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        console.log('🔄 File converted to buffer, uploading...');
        
        const snapshot = await uploadBytes(fileRef, uint8Array, {
          contentType: file.type,
          customMetadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
            uploadedBy: 'admin'
          }
        });
        
        console.log('📤 Upload completed, getting download URL...');
        
        fileUrl = await getDownloadURL(snapshot.ref);
        fileName = file.name;
        
        console.log('✅ File uploaded successfully:', {
          downloadUrl: fileUrl,
          fileName: fileName,
          size: snapshot.metadata.size
        });
      } catch (fileError) {
        console.error('❌ File upload error:', fileError);
        
        // Enhanced error logging
        if (fileError instanceof Error) {
          console.error('Error details:', {
            name: fileError.name,
            message: fileError.message,
            stack: fileError.stack
          });
        }
        
        const errorMessage = fileError instanceof Error ? fileError.message : 'Unknown error occurred';
        return NextResponse.json(
          {
            success: false,
            error: `Failed to upload file: ${errorMessage}`,
            details: process.env.NODE_ENV === 'development' ? fileError : undefined
          },
          { status: 500 }
        );
      }
    }

    // Create question document
    const questionData = {
      question: question.trim(),
      answer: answer.trim(),
      anchorLink: anchorLink?.trim() || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'ai_questions'), questionData);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...questionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create question' },
      { status: 500 }
    );
  }
}

// PUT - Update existing question
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const id = formData.get('id') as string;
    const question = formData.get('question') as string;
    const answer = formData.get('answer') as string;
    const anchorLink = formData.get('anchorLink') as string;
    const file = formData.get('file') as File | null;
    const removeFile = formData.get('removeFile') === 'true';

    if (!id || !question || !answer) {
      return NextResponse.json(
        { success: false, error: 'ID, question and answer are required' },
        { status: 400 }
      );
    }

    const docRef = doc(db, 'ai_questions', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    const existingData = docSnap.data();
    let fileUrl = existingData.fileUrl || '';
    let fileName = existingData.fileName || '';

    // Handle file operations
    if (removeFile && existingData.fileUrl) {
      // Remove existing file
      try {
        const storage = getStorage(app);
        const fileRef = ref(storage, existingData.fileUrl);
        await deleteObject(fileRef);
        fileUrl = '';
        fileName = '';
      } catch (fileError) {
        console.warn('Failed to delete existing file:', fileError);
      }
    }

    if (file && file.size > 0) {
      // Upload new file
      try {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, error: 'File size exceeds 10MB limit' },
            { status: 400 }
          );
        }

        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'image/jpeg',
          'image/jpg',
          'image/png'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { success: false, error: 'File type not supported. Please upload PDF, DOC, DOCX, TXT, JPG, JPEG, or PNG files.' },
            { status: 400 }
          );
        }

        // Use the centralized storage instance
        
        // Delete old file if exists
        if (existingData.fileUrl) {
          try {
            // Extract file path from URL for deletion
            const oldFileUrl = existingData.fileUrl;
            const urlParts = oldFileUrl.split('/');
            const encodedPath = urlParts[urlParts.length - 1].split('?')[0];
            const filePath = decodeURIComponent(encodedPath);
            const oldFileRef = ref(storage, filePath);
            await deleteObject(oldFileRef);
            console.log('Old file deleted successfully');
          } catch (deleteError) {
            console.warn('Failed to delete old file:', deleteError);
          }
        }

        // Create a safe filename
        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileRef = ref(storage, `ai-assistant-files/${timestamp}-${safeFileName}`);
        
        console.log('Uploading new file to Firebase Storage:', fileRef.fullPath);
        
        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        const snapshot = await uploadBytes(fileRef, uint8Array, {
          contentType: file.type,
          customMetadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString()
          }
        });
        
        fileUrl = await getDownloadURL(snapshot.ref);
        fileName = file.name;
        
        console.log('New file uploaded successfully:', fileUrl);
      } catch (fileError) {
        console.error('File upload error:', fileError);
        const errorMessage = fileError instanceof Error ? fileError.message : 'Unknown error occurred';
        return NextResponse.json(
          { success: false, error: `Failed to upload file: ${errorMessage}` },
          { status: 500 }
        );
      }
    }

    // Update question document
    const updateData = {
      question: question.trim(),
      answer: answer.trim(),
      anchorLink: anchorLink?.trim() || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updateData);

    return NextResponse.json({
      success: true,
      data: {
        id,
        ...updateData,
        createdAt: existingData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

// DELETE - Delete question
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Question ID is required' },
        { status: 400 }
      );
    }

    const docRef = doc(db, 'ai_questions', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    const questionData = docSnap.data();

    // Delete associated file if exists
    if (questionData.fileUrl) {
      try {
        // Use the centralized storage instance
        // Extract file path from URL for deletion
        const fileUrl = questionData.fileUrl;
        const urlParts = fileUrl.split('/');
        const encodedPath = urlParts[urlParts.length - 1].split('?')[0];
        const filePath = decodeURIComponent(encodedPath);
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
        console.log('Associated file deleted successfully');
      } catch (fileError) {
        console.warn('Failed to delete associated file:', fileError);
      }
    }

    // Delete question document
    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      data: { id }
    });

  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}