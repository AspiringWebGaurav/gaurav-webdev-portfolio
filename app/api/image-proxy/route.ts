import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      privateKey: privateKey,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    }),
    storageBucket: process.env.FIREBASE_ADMIN_STORAGE_BUCKET,
  });
}

const bucket = admin.storage().bucket();

/**
 * Image proxy with Firebase Storage authentication
 * GET /api/image-proxy?url=<firebase-storage-url>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Validate URL is from Firebase Storage
    if (!imageUrl.includes('storage.googleapis.com') && 
        !imageUrl.includes('firebasestorage.app')) {
      return NextResponse.json(
        { error: 'Only Firebase Storage URLs are allowed' },
        { status: 403 }
      );
    }

    // Extract path from Firebase Storage URL
    // Format: https://storage.googleapis.com/bucket-name/path/to/file.ext
    const urlObj = new URL(imageUrl);
    const pathParts = urlObj.pathname.split('/');
    // Remove empty string and bucket name
    const filePath = pathParts.slice(2).join('/');

    if (!filePath) {
      return NextResponse.json(
        { error: 'Invalid Firebase Storage URL' },
        { status: 400 }
      );
    }

    // Get file from Firebase Storage with admin SDK
    const file = bucket.file(filePath);
    const [exists] = await file.exists();

    if (!exists) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Get file metadata
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || 'image/png';

    // Download file buffer
    const [buffer] = await file.download();

    // Return image with proper caching headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
