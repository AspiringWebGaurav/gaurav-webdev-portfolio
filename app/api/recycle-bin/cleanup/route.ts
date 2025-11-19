import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COLLECTION_NAME = 'recycleBin';

/**
 * POST /api/recycle-bin/cleanup
 * Permanently deletes all expired items from the recycle bin
 * Items are expired when expiryDate is in the past
 */
export async function POST(request: NextRequest) {
  try {
    const now = new Date();
    
    // Fetch all recycle bin items
    const recycleBinRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(recycleBinRef);

    const expiredItems = [];
    const promises = [];

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const expiryDate = data.expiryDate?.toDate?.() || new Date(data.expiryDate);

      // Check if expired
      if (expiryDate < now) {
        expiredItems.push({
          id: docSnapshot.id,
          originalId: data.originalId,
          source: data.source,
          expiryDate: expiryDate.toISOString(),
        });

        // Delete expired item
        promises.push(deleteDoc(doc(db, COLLECTION_NAME, docSnapshot.id)));
      }
    }

    // Execute all deletions
    await Promise.all(promises);

    return NextResponse.json({
      success: true,
      deletedCount: expiredItems.length,
      deletedItems: expiredItems,
      message: `Permanently deleted ${expiredItems.length} expired item(s) from recycle bin`,
    });
  } catch (error: any) {
    console.error('Error cleaning up recycle bin:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to cleanup recycle bin',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recycle-bin/cleanup
 * Preview which items would be deleted (dry run)
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    
    // Fetch all recycle bin items
    const recycleBinRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(recycleBinRef);

    const expiredItems = [];

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const expiryDate = data.expiryDate?.toDate?.() || new Date(data.expiryDate);

      // Check if expired
      if (expiryDate < now) {
        expiredItems.push({
          id: docSnapshot.id,
          originalId: data.originalId,
          source: data.source,
          expiryDate: expiryDate.toISOString(),
          deletedAt: data.deletedAt?.toDate?.()?.toISOString() || data.deletedAt,
          daysExpired: Math.floor((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24)),
        });
      }
    }

    return NextResponse.json({
      success: true,
      expiredCount: expiredItems.length,
      expiredItems,
      message: `Found ${expiredItems.length} expired item(s) ready for deletion`,
    });
  } catch (error: any) {
    console.error('Error previewing cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to preview cleanup',
      },
      { status: 500 }
    );
  }
}
