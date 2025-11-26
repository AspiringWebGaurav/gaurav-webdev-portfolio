import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { translateMaskToUUID } from '@/lib/uuid-sync/server';
import { MaskNotFoundError, UUIDValidationError } from '@/lib/uuid-sync/errors';
import { headers } from 'next/headers';

const COLLECTIONS = {
  BUBBLE_SESSIONS: 'og_uuid_sessions',
};

/**
 * UUID-Sync Session Management API
 * 
 * Simple, stateless session handling:
 * - No cookies, no tokens, no authentication
 * - Pure mask-based identification (device_**********)
 * - All state stored server-side in Firebase
 * - Client sends mask with every request
 */

/**
 * GET: Fetch session by mask using UUID-sync
 * Query param: mask (device_**********)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mask = searchParams.get('mask');

    if (!mask) {
      return NextResponse.json(
        { error: 'mask required' },
        { status: 400 }
      );
    }

    // Translate mask to UUID with robust error handling
    let uuid: string;
    try {
      uuid = await translateMaskToUUID(mask);
    } catch (error: any) {
      if (error instanceof MaskNotFoundError) {
        return NextResponse.json(
          { error: 'Mask not found', exists: false },
          { status: 404 }
        );
      }
      if (error instanceof UUIDValidationError) {
        return NextResponse.json(
          { error: `Invalid mask format: ${error.message}` },
          { status: 400 }
        );
      }
      throw error; // Re-throw unexpected errors
    }
    
    // Fetch session by UUID (document ID)
    const sessionDocRef = doc(db, COLLECTIONS.BUBBLE_SESSIONS, uuid);
    const sessionDoc = await getDoc(sessionDocRef);

    if (!sessionDoc.exists()) {
      return NextResponse.json(
        { error: 'Session not found', exists: false },
        { status: 404 }
      );
    }

    const sessionData = sessionDoc.data();

    // Don't return deleted sessions
    if (sessionData.deletedAt) {
      return NextResponse.json(
        { error: 'Session not found', exists: false },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      exists: true,
      session: {
        id: uuid,  // Return UUID as id
        mask: sessionData.mask,  // Return mask
        deviceFingerprint: sessionData.deviceFingerprint,
        visitorEmail: sessionData.visitorEmail,
        startedAt: sessionData.startedAt?.toDate() || new Date(),
        lastActive: sessionData.lastActive?.toDate() || new Date(),
        messageCount: sessionData.messageCount || 0,
        unreadAdminReplies: sessionData.unreadAdminReplies || 0,
        hasUnreadTooltip: sessionData.hasUnreadTooltip || false,
        visitorOnline: sessionData.visitorOnline || false,
      },
    });
    
    // Add headers for faster polling - allow quick revalidation
    response.headers.set('Cache-Control', 'no-cache, must-revalidate');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    return response;
  } catch (error) {
    console.error('[Session API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session', exists: false },
      { status: 500 }
    );
  }
}

/**
 * POST: Create or reactivate session using UUID-sync
 * Body: { mask: "device_**********" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mask } = body;

    if (!mask) {
      return NextResponse.json(
        { error: 'mask required' },
        { status: 400 }
      );
    }

    // Translate mask to UUID with robust error handling
    let uuid: string;
    try {
      uuid = await translateMaskToUUID(mask);
    } catch (error: any) {
      if (error instanceof MaskNotFoundError) {
        return NextResponse.json(
          { error: `Mask not found: ${mask}`, success: false },
          { status: 404 }
        );
      }
      if (error instanceof UUIDValidationError) {
        return NextResponse.json(
          { error: `Invalid mask format: ${error.message}`, success: false },
          { status: 400 }
        );
      }
      throw error; // Re-throw unexpected errors
    }

    // Get fingerprint from headers for logging/tracking
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const ipAddress = headersList.get("x-forwarded-for") || 
                     headersList.get("x-real-ip") || 
                     "unknown";
    const fingerprint = `${ipAddress}_${userAgent}`;

    // Check if session already exists (using UUID as doc ID)
    const sessionDocRef = doc(db, COLLECTIONS.BUBBLE_SESSIONS, uuid);
    const existingDoc = await getDoc(sessionDocRef);

    if (!existingDoc.exists()) {
      // Create new session with UUID as document ID
      const sessionData = {
        mask: mask,  // Use the mask provided by client
        deviceFingerprint: fingerprint,
        startedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        messageCount: 0,
        unreadAdminReplies: 0,
        hasUnreadTooltip: false,
        visitorEmail: null,
        visitorOnline: true,
        adminOnline: false,
        deletedAt: null,
      };

      await setDoc(sessionDocRef, sessionData);

      return NextResponse.json({
        success: true,
        sessionId: uuid,
        mask: mask,
        message: 'Session created',
        created: true,
      });
    } else {
      // Reactivate existing session
      await updateDoc(sessionDocRef, {
        lastActive: serverTimestamp(),
        visitorOnline: true,
      });

      return NextResponse.json({
        success: true,
        sessionId: uuid,
        mask: mask,
        message: 'Session reactivated',
        created: false,
      });
    }
  } catch (error) {
    console.error('[Session API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create session', success: false },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update session using UUID-sync
 * Body: { mask: "device_**********", updates: {...} }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { mask, updates } = body;

    if (!mask) {
      return NextResponse.json(
        { error: 'mask required' },
        { status: 400 }
      );
    }

    // Translate mask to UUID with robust error handling
    let uuid: string;
    try {
      uuid = await translateMaskToUUID(mask);
    } catch (error: any) {
      if (error instanceof MaskNotFoundError) {
        return NextResponse.json(
          { error: `Mask not found: ${mask}`, success: false },
          { status: 404 }
        );
      }
      if (error instanceof UUIDValidationError) {
        return NextResponse.json(
          { error: `Invalid mask format: ${error.message}`, success: false },
          { status: 400 }
        );
      }
      throw error; // Re-throw unexpected errors
    }
    const sessionDocRef = doc(db, COLLECTIONS.BUBBLE_SESSIONS, uuid);

    // Check if session exists
    const sessionDoc = await getDoc(sessionDocRef);
    if (!sessionDoc.exists()) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    await updateDoc(sessionDocRef, {
      ...updates,
      lastActive: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      session: {
        id: uuid,
        mask,
        ...updates,
      },
    });
  } catch (error) {
    console.error('[Session API] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update session', success: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Mark session as deleted using UUID-sync (soft delete)
 * Body: { mask: "device_**********" }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { mask } = body;

    if (!mask) {
      return NextResponse.json(
        { error: 'mask required' },
        { status: 400 }
      );
    }

    // Translate mask to UUID with robust error handling
    let uuid: string;
    try {
      uuid = await translateMaskToUUID(mask);
    } catch (error: any) {
      if (error instanceof MaskNotFoundError) {
        return NextResponse.json(
          { error: `Mask not found: ${mask}`, success: false },
          { status: 404 }
        );
      }
      if (error instanceof UUIDValidationError) {
        return NextResponse.json(
          { error: `Invalid mask format: ${error.message}`, success: false },
          { status: 400 }
        );
      }
      throw error; // Re-throw unexpected errors
    }
    const sessionDocRef = doc(db, COLLECTIONS.BUBBLE_SESSIONS, uuid);

    // Check if session exists
    const sessionDoc = await getDoc(sessionDocRef);
    if (!sessionDoc.exists()) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    await updateDoc(sessionDocRef, {
      deletedAt: serverTimestamp(),
      visitorOnline: false,
    });

    return NextResponse.json({
      success: true,
      message: 'Session deleted',
    });
  } catch (error) {
    console.error('[Session API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session', success: false },
      { status: 500 }
    );
  }
}
