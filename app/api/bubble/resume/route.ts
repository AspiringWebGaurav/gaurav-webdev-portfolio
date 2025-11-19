import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const COLLECTIONS = {
  RESUME: 'bubbleResumeVersions',
};

// GET: Fetch resume versions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentOnly = searchParams.get('currentOnly') === 'true';

    const resumeRef = collection(db, COLLECTIONS.RESUME);
    let q;

    if (currentOnly) {
      // Don't use orderBy with where to avoid needing composite index
      q = query(
        resumeRef,
        where('isCurrent', '==', true)
      );
    } else {
      q = query(resumeRef, orderBy('uploadedAt', 'desc'));
    }

    const querySnapshot = await getDocs(q);
    const versions = querySnapshot.docs
      .map(docSnapshot => {
        const data = docSnapshot.data() as any;
        return {
          id: data.id || docSnapshot.id, // Fallback to Firestore doc ID if custom ID missing
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          uploadedAt: data.uploadedAt?.toDate() || new Date(),
          version: data.version,
          isCurrent: data.isCurrent,
          fileSize: data.fileSize,
          deletedAt: data.deletedAt?.toDate() || null,
        };
      })
      .filter(version => !version.deletedAt); // Filter out soft-deleted items

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error in resume GET:', error);
    return NextResponse.json({ error: 'Failed to fetch resume versions' }, { status: 500 });
  }
}

// POST: Upload new resume version
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get current version count
    const resumeRef = collection(db, COLLECTIONS.RESUME);
    const q = query(resumeRef, orderBy('uploadedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    // Extract version number from latest version string (e.g., "v3.0" -> 3.0)
    let latestVersionNum = 0;
    if (!querySnapshot.empty) {
      const latestVersionStr = (querySnapshot.docs[0].data() as any).version;
      console.log('[Resume POST] Latest version string:', latestVersionStr);
      
      if (latestVersionStr && typeof latestVersionStr === 'string') {
        // Remove all 'v' prefixes and extract number
        const cleanStr = latestVersionStr.replace(/^v+/i, '');
        const match = cleanStr.match(/(\d+(?:\.\d+)?)/);
        if (match) {
          latestVersionNum = parseFloat(match[1]);
        }
        console.log('[Resume POST] Cleaned:', cleanStr, 'Parsed:', latestVersionNum);
      } else if (typeof latestVersionStr === 'number') {
        latestVersionNum = latestVersionStr;
      }
    }
    
    const newVersionNum = latestVersionNum + 1;
    const newVersion = `v${newVersionNum}`;
    console.log('[Resume POST] New version:', newVersion);

    // Upload to Firebase Storage
    const fileId = uuidv4();
    const storageRef = ref(storage, `bubble-resumes/${fileId}-${file.name}`);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    });

    const fileUrl = await getDownloadURL(storageRef);

    // Mark all other versions as not current
    for (const doc of querySnapshot.docs) {
      await updateDoc(doc.ref, { isCurrent: false });
    }

    // Create new version record
    const resumeData = {
      id: fileId,
      fileName: file.name,
      fileUrl,
      uploadedAt: serverTimestamp(),
      version: `v${newVersion}`,
      isCurrent: true,
      fileSize: file.size,
      deletedAt: null,
    };

    await addDoc(collection(db, COLLECTIONS.RESUME), resumeData);

    return NextResponse.json({
      id: fileId,
      fileName: file.name,
      fileUrl,
      uploadedAt: new Date(),
      version: `v${newVersion}`,
      isCurrent: true,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('Error in resume POST:', error);
    return NextResponse.json({ error: 'Failed to upload resume' }, { status: 500 });
  }
}

// PUT: Set a version as current
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Resume ID required' }, { status: 400 });
    }

    const resumeRef = collection(db, COLLECTIONS.RESUME);

    // Mark all versions as not current
    const allVersions = await getDocs(resumeRef);
    for (const doc of allVersions.docs) {
      await updateDoc(doc.ref, { isCurrent: false });
    }

    // Set the specified version as current
    const q = query(resumeRef, where('id', '==', id));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Resume version not found' }, { status: 404 });
    }

    const resumeDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, COLLECTIONS.RESUME, resumeDoc.id), { isCurrent: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in resume PUT:', error);
    return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 });
  }
}

// DELETE: Soft delete a resume version
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Resume ID required' }, { status: 400 });
    }

    const resumeRef = collection(db, COLLECTIONS.RESUME);
    const q = query(resumeRef, where('id', '==', id));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const resumeDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, COLLECTIONS.RESUME, resumeDoc.id), {
      deletedAt: serverTimestamp(),
      isCurrent: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in resume DELETE:', error);
    return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 });
  }
}
