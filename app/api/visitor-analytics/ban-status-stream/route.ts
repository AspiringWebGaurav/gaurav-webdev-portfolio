/**
 * Ban Status Stream API - Real-Time Updates
 * Server-Sent Events (SSE) endpoint for real-time ban status monitoring
 * 
 * This provides an alternative to Firebase listeners for browsers
 * that may have connectivity issues or for additional redundancy
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { identifyVisitor, getIdentityResult, firestoreCheckBanStatus } from "@/lib/uuid-sync/server";

const VISITORS_COLLECTION = "og_uuid";
const HEARTBEAT_INTERVAL = 15000; // 15 seconds

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Get visitor ID from request
  const userAgent = request.headers.get("user-agent") || "";
  const ipAddress = request.headers.get("x-forwarded-for") || 
                   request.headers.get("x-real-ip") || 
                   "unknown";
  
  const fingerprint = `${ipAddress}_${userAgent}`;
  const mask = await identifyVisitor(fingerprint);
  
  // Translate to UUID
  const { uuid } = await getIdentityResult(fingerprint);

  console.log("[Ban Status Stream] Client connected:", mask);

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let isActive = true;

      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', mask })}\n\n`));

      // Function to send ban status
      const sendBanStatus = async () => {
        try {
          const visitorRef = adminDb.collection(VISITORS_COLLECTION).doc(uuid);
          const visitorDoc = await visitorRef.get();

          if (!visitorDoc.exists) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              banned: false,
              timestamp: new Date().toISOString()
            })}\n\n`));
            return;
          }

          const visitorData = visitorDoc.data();
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            banned: visitorData?.banned === true,
            banReason: visitorData?.banReason,
            banCategory: visitorData?.banCategory,
            banTimestamp: visitorData?.banTimestamp?.toDate?.()?.toISOString(),
            timestamp: new Date().toISOString()
          })}\n\n`));
        } catch (error) {
          console.error("[Ban Status Stream] Error sending status:", error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'Failed to check ban status',
            timestamp: new Date().toISOString()
          })}\n\n`));
        }
      };

      // Send initial status
      await sendBanStatus();

      // Setup periodic status checks
      const statusInterval = setInterval(async () => {
        if (!isActive) {
          clearInterval(statusInterval);
          return;
        }
        await sendBanStatus();
      }, HEARTBEAT_INTERVAL);

      // Setup heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        if (!isActive) {
          clearInterval(heartbeatInterval);
          return;
        }
        
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch (error) {
          console.log("[Ban Status Stream] Heartbeat failed, client disconnected");
          isActive = false;
        }
      }, 30000); // Every 30 seconds

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        console.log("[Ban Status Stream] Client disconnected:", visitorId);
        isActive = false;
        clearInterval(statusInterval);
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch (e) {
          // Controller already closed
        }
      });
    }
  });

  // Return SSE response
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for Nginx
    },
  });
}
