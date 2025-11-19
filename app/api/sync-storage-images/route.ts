/**
 * API endpoint to sync images from Firebase Storage to Firestore
 * GET /api/sync-storage-images
 * NOTE: This is an admin utility endpoint for one-time sync operations
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION_NAME = "portfolio_currentlyWorking";
const STORAGE_FOLDER = "currently-working";

export async function GET(request: NextRequest) {
  try {
    const bucket = adminStorage.bucket();
    
    const [files] = await bucket.getFiles({
      prefix: `${STORAGE_FOLDER}/`,
    });

    const imageUrls: string[] = [];
    const imageDetails: Array<{name: string; url: string}> = [];
    
    for (const file of files) {
      const fileName = file.name;
      
      if (fileName === `${STORAGE_FOLDER}/` || fileName.endsWith('/')) {
        continue;
      }
      
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
      if (!isImage) {
        continue;
      }

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      imageUrls.push(publicUrl);
      imageDetails.push({ name: fileName, url: publicUrl });
    }
    
    if (imageUrls.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No images found in Storage folder',
        message: 'Please upload images to Firebase Storage first',
      }, { status: 404 });
    }

    const snapshot = await adminDb.collection(COLLECTION_NAME).get();
    
    if (snapshot.empty) {
      return NextResponse.json({
        success: false,
        error: 'No documents found in Firestore',
        message: 'Please create a "Currently Working" item first',
        foundImages: imageDetails,
      }, { status: 404 });
    }

    const updatePromises = [];
    const updatedDocs: Array<{id: string; title: string; imageCount: number}> = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      updatePromises.push(
        doc.ref.update({
          images: imageUrls,
          updatedAt: FieldValue.serverTimestamp(),
        })
      );
      
      updatedDocs.push({
        id: doc.id,
        title: data.title || 'Untitled',
        imageCount: imageUrls.length,
      });
    }

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${imageUrls.length} images to ${updatedDocs.length} document(s)`,
      data: {
        imagesFound: imageUrls.length,
        documentsUpdated: updatedDocs.length,
        images: imageDetails,
        updatedDocuments: updatedDocs,
      },
    }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to sync images',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
