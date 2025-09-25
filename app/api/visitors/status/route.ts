import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseAdmin, isFirebaseAdminReady, getFirebaseAdminError } from "@/lib/firebase-admin";
import { logger, prodLogger } from "@/utils/secureLogger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uuid = searchParams.get('uuid');

    if (!uuid) {
      return NextResponse.json(
        { error: "UUID parameter is required" },
        { status: 400 }
      );
    }

    // Check if Firebase Admin is properly configured
    if (!isFirebaseAdminReady()) {
      const adminError = getFirebaseAdminError();
      logger.warn("Firebase Admin not configured, treating as new visitor", {
        uuid,
        error: adminError?.message
      });
      
      // Return default status for new visitors when Firebase Admin is not configured
      return NextResponse.json(
        {
          status: "active",
          uuid,
          banReason: null,
          banTimestamp: null,
          banCategory: null,
          policyReference: null,
          note: "Firebase Admin not configured - defaulting to active status"
        },
        { status: 200 }
      );
    }

    const db = requireFirebaseAdmin();
    const visitorDoc = await db.collection("visitors").doc(uuid).get();

    if (!visitorDoc.exists) {
      logger.info("Visitor document not found, treating as new visitor", { uuid });
      return NextResponse.json(
        {
          status: "active",
          uuid,
          banReason: null,
          banTimestamp: null,
          banCategory: null,
          policyReference: null,
          note: "New visitor - document not found"
        },
        { status: 200 }
      );
    }

    const visitorData = visitorDoc.data();
    const status = visitorData?.status || 'active';

    logger.info("Visitor status retrieved successfully", {
      uuid,
      status,
      hasBanReason: !!visitorData?.banReason
    });

    return NextResponse.json(
      {
        status,
        uuid,
        banReason: visitorData?.banReason,
        banTimestamp: visitorData?.banTimestamp,
        banCategory: visitorData?.banCategory || 'normal',
        policyReference: visitorData?.policyReference || null
      },
      { status: 200 }
    );

  } catch (error) {
    logger.error("Error checking visitor status", {
      error: error instanceof Error ? error.message : 'Unknown error',
      uuid: new URL(req.url).searchParams.get('uuid')
    });
    
    // Return active status as fallback to prevent blocking users
    return NextResponse.json(
      {
        status: "active",
        uuid: new URL(req.url).searchParams.get('uuid'),
        banReason: null,
        banTimestamp: null,
        banCategory: null,
        policyReference: null,
        error: "Service temporarily unavailable - defaulting to active status"
      },
      { status: 200 }
    );
  }
}

// Update visitor status (for admin use) - Enhanced with enterprise reliability
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let transactionAttempts = 0;
  const maxRetries = 3;
  
  try {
    const body = await req.json();
    const { uuid, status, banReason, banCategory, policyReference, adminId } = body;

    // Enhanced validation
    if (!uuid || !status) {
      prodLogger.warn("Invalid request: missing required fields", { uuid: !!uuid, status: !!status });
      return NextResponse.json(
        { error: "UUID and status are required" },
        { status: 400 }
      );
    }

    // UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      prodLogger.warn("Invalid UUID format", { uuid });
      return NextResponse.json(
        { error: "Invalid UUID format" },
        { status: 400 }
      );
    }

    if (!['active', 'banned'].includes(status)) {
      prodLogger.warn("Invalid status value", { status });
      return NextResponse.json(
        { error: "Status must be 'active' or 'banned'" },
        { status: 400 }
      );
    }

    // Check if Firebase Admin is properly configured
    if (!isFirebaseAdminReady()) {
      const adminError = getFirebaseAdminError();
      prodLogger.error("Cannot update visitor status - Firebase Admin not configured", {
        uuid,
        status,
        error: adminError?.message
      });
      
      return NextResponse.json(
        { error: "Firebase Admin not configured - cannot update visitor status" },
        { status: 503 }
      );
    }

    const db = requireFirebaseAdmin();
    
    // Retry mechanism for database operations
    while (transactionAttempts < maxRetries) {
      transactionAttempts++;
      
      try {
        // Use transaction for atomic updates
        const result = await db.runTransaction(async (transaction) => {
          const visitorRef = db.collection("visitors").doc(uuid);
          const banRef = db.collection("bans").doc(uuid);
          
          const visitorDoc = await transaction.get(visitorRef);
          
          if (!visitorDoc.exists) {
            throw new Error("Visitor not found");
          }

          const currentData = visitorDoc.data();
          const timestamp = new Date().toISOString();

          const updateData: any = {
            status,
            updatedAt: timestamp,
            lastStatusChange: timestamp,
            adminId: adminId || 'system',
            syncVersion: (currentData?.syncVersion || 0) + 1 // Version for sync tracking
          };

          if (status === 'banned') {
            updateData.banTimestamp = timestamp;
            updateData.banReason = banReason || 'Violation of terms';
            updateData.banCategory = banCategory || 'normal';
            updateData.policyReference = policyReference || `POL-${Date.now()}`;
            updateData.unbanTimestamp = null;
            
            // Enhanced category history with previous state tracking
            const previousCategory = currentData?.banCategory || null;
            updateData.banCategoryHistory = [
              ...(currentData?.banCategoryHistory || []),
              {
                category: banCategory || 'normal',
                timestamp,
                adminId: adminId || 'system',
                reason: banReason || 'Violation of terms',
                previousCategory,
                action: 'ban'
              }
            ].slice(-10); // Keep last 10 history entries

            // Create/update ban record for audit trail
            const banData = {
              uuid,
              reason: banReason || 'Violation of terms',
              banCategory: banCategory || 'normal',
              policyReference: updateData.policyReference,
              adminId: adminId || 'system',
              timestamp,
              isActive: true,
              createdAt: currentData?.banTimestamp || timestamp,
              updatedAt: timestamp
            };
            
            transaction.set(banRef, banData, { merge: true });
            
          } else if (status === 'active') {
            updateData.unbanTimestamp = timestamp;
            updateData.banReason = null;
            updateData.banCategory = null;
            updateData.banTimestamp = null;
            updateData.policyReference = null;
            
            // Update category history for unban
            updateData.banCategoryHistory = [
              ...(currentData?.banCategoryHistory || []),
              {
                category: null,
                timestamp,
                adminId: adminId || 'system',
                reason: 'Unbanned',
                previousCategory: currentData?.banCategory || null,
                action: 'unban'
              }
            ].slice(-10);

            // Deactivate ban record
            const banDoc = await transaction.get(banRef);
            if (banDoc.exists) {
              transaction.update(banRef, {
                isActive: false,
                unbanTimestamp: timestamp,
                unbanAdminId: adminId || 'system',
                updatedAt: timestamp
              });
            }
          }

          // Update visitor document
          transaction.update(visitorRef, updateData);
          
          return { updateData, timestamp };
        });

        const duration = Date.now() - startTime;
        
        prodLogger.info("Visitor status updated successfully with transaction", {
          uuid,
          status,
          adminId: adminId || 'system',
          attempts: transactionAttempts,
          duration: `${duration}ms`,
          syncVersion: result.updateData.syncVersion
        });

        return NextResponse.json(
          {
            message: `Visitor status updated to ${status}`,
            uuid,
            status,
            timestamp: result.timestamp,
            syncVersion: result.updateData.syncVersion,
            processedIn: `${duration}ms`
          },
          { status: 200 }
        );

      } catch (transactionError) {
        prodLogger.warn(`Transaction attempt ${transactionAttempts} failed`, {
          uuid,
          status,
          error: transactionError instanceof Error ? transactionError.message : 'Unknown error',
          attempt: transactionAttempts
        });

        if (transactionAttempts >= maxRetries) {
          throw transactionError;
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, transactionAttempts) * 100));
      }
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    
    prodLogger.error("Error updating visitor status after all retries", {
      error: error instanceof Error ? error.message : 'Unknown error',
      uuid: new URL(req.url).searchParams.get('uuid'),
      attempts: transactionAttempts,
      duration: `${duration}ms`
    });
    
    // Return specific error for visitor not found
    if (error instanceof Error && error.message === "Visitor not found") {
      return NextResponse.json(
        { error: "Visitor not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Failed to update visitor status",
        retryAfter: 5, // Suggest retry after 5 seconds
        transient: true // Indicate this might be a temporary error
      },
      { status: 500 }
    );
  }
}