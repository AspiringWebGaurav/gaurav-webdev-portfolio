/**
 * Advanced Visitor Tracking API
 * Handles all visitor tracking events with maximum detail
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

const VISITORS_COLLECTION = "visitorProfiles";
const SESSIONS_COLLECTION = "visitorSessions";
const EVENTS_COLLECTION = "visitorEvents";
const INTERACTIONS_COLLECTION = "visitorInteractions";
const HEARTBEATS_COLLECTION = "visitorHeartbeats";

// Visit threshold: count as new visit if inactive for more than 30 minutes
const VISIT_TIMEOUT_MINUTES = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, visitorData, visitorId, sessionId, data, metadata } = body;

    // Session start - Create or update visitor profile
    if (event === "session_start") {
      const { visitorData } = body;
      
      // Support both visitorId and uuid (for compatibility with different parts of the app)
      const vid = visitorData.visitorId || visitorData.uuid;
      
      if (!vid) {
        return NextResponse.json({ 
          success: false, 
          error: "visitorId or uuid is required in visitorData" 
        }, { status: 400 });
      }

      console.log('[VisitorTracking] Session start for visitor:', vid);

      // Check if visitor exists
      const visitorRef = adminDb.collection(VISITORS_COLLECTION).doc(vid);
      const visitorDoc = await visitorRef.get();

      const now = Timestamp.now();
      
      // Use device_ ID directly as session ID for consistency
      // This ensures the same visitor gets the same session across tabs
      const sessionId = vid;

      console.log('[VisitorTracking] Using device ID as session ID:', sessionId);

      if (visitorDoc.exists) {
        // Existing visitor - check if this is a new visit or just a new session
        console.log('[VisitorTracking] Existing visitor detected');
        const existingData = visitorDoc.data();
        
        // Calculate time since last visit
        const lastVisitTime = existingData.lastVisit?.toDate?.() || new Date(0);
        const minutesSinceLastVisit = (Date.now() - lastVisitTime.getTime()) / (1000 * 60);
        
        // Only increment visit count if visitor has been inactive for more than threshold
        const isNewVisit = minutesSinceLastVisit > VISIT_TIMEOUT_MINUTES;
        
        console.log(`[VisitorTracking] Time since last visit: ${Math.round(minutesSinceLastVisit)} minutes`);
        console.log(`[VisitorTracking] Counting as new visit: ${isNewVisit}`);
        
        const updateData: any = {
          lastVisit: now,
          totalSessions: FieldValue.increment(1),
          updatedAt: now,
          currentStatus: "active",
          deviceString: `${visitorData.os.name} · ${visitorData.browser.name}`,
          deviceClass: visitorData.device.type,
          ...(visitorData.geolocation && 
              visitorData.geolocation.country && 
              visitorData.geolocation.country !== 'Unknown' &&
              visitorData.geolocation.countryCode &&
              visitorData.geolocation.countryCode !== 'XX' && {
            geoLocation: {
              city: visitorData.geolocation.city || 'Unknown',
              region: visitorData.geolocation.region || 'Unknown',
              country: visitorData.geolocation.country,
              countryCode: visitorData.geolocation.countryCode,
              latitude: visitorData.geolocation.latitude,
              longitude: visitorData.geolocation.longitude,
              timezone: visitorData.geolocation.timezone,
              isp: visitorData.geolocation.isp,
            },
          }),
        };
        
        // Only increment visit count if this is truly a new visit (after inactivity period)
        if (isNewVisit) {
          updateData.totalVisits = FieldValue.increment(1);
        }
        
        await visitorRef.update(updateData);
      } else {
        // New visitor - create fresh record
        console.log('[VisitorTracking] New visitor detected, creating profile');
        
        await visitorRef.set({
          id: vid,
          firstVisit: now,
          lastVisit: now,
          totalVisits: 1,
          totalSessions: 1,
          averageSessionDuration: 0,
          totalActiveTime: 0,
          totalPageViews: 0,
          totalBubbleOpens: 0,
          totalInteractions: 0,
          resumeViews: 0,
          resumeDownloads: 0,
          formSubmissions: 0,
          currentStatus: "active",
          deviceClass: visitorData.device.type,
          deviceString: `${visitorData.os.name} · ${visitorData.browser.name}`,
          ...(visitorData.geolocation && 
              visitorData.geolocation.country && 
              visitorData.geolocation.country !== 'Unknown' &&
              visitorData.geolocation.countryCode &&
              visitorData.geolocation.countryCode !== 'XX' && {
            geoLocation: {
              city: visitorData.geolocation.city || 'Unknown',
              region: visitorData.geolocation.region || 'Unknown',
              country: visitorData.geolocation.country,
              countryCode: visitorData.geolocation.countryCode,
              latitude: visitorData.geolocation.latitude || 0,
              longitude: visitorData.geolocation.longitude || 0,
              timezone: visitorData.geolocation.timezone || 'UTC',
              isp: visitorData.geolocation.isp || 'Unknown',
            },
          }),
          banned: false,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Create session record with comprehensive data
      // Clean up undefined values to avoid Firestore errors
      const sessionData: any = {
        id: sessionId,
        visitorId: vid,
        startTime: now,
        endTime: null,
        duration: 0,
        pageViews: 0,
        interactions: 0,
        scrollDepth: 0,
        isActive: true,
        url: visitorData.url || '/',
        referrer: visitorData.referrer || 'direct',
        userAgent: visitorData.userAgent || 'Unknown',
        language: visitorData.language || 'en',
        platform: visitorData.platform || 'Unknown',
        timezone: visitorData.timezone || 'UTC',
        deviceSnapshot: {
          deviceClass: visitorData.device?.type || 'unknown',
          os: visitorData.os?.name || 'Unknown',
          browser: visitorData.browser?.name || 'Unknown',
          browserVersion: visitorData.browser?.version || 'Unknown',
          viewportWidth: visitorData.viewport?.width || 0,
          viewportHeight: visitorData.viewport?.height || 0,
          userAgent: visitorData.userAgent || 'Unknown',
          networkQuality: visitorData.connection?.effectiveType || 'unknown',
        },
        createdAt: now,
        updatedAt: now,
      };

      // Add optional fields only if defined
      if (visitorData.languages) sessionData.languages = visitorData.languages;
      if (visitorData.screen) sessionData.screen = visitorData.screen;
      if (visitorData.viewport) sessionData.viewport = visitorData.viewport;
      if (visitorData.timezoneOffset !== undefined) sessionData.timezoneOffset = visitorData.timezoneOffset;
      if (visitorData.connection) sessionData.connection = visitorData.connection;
      if (visitorData.deviceMemory !== undefined) sessionData.deviceMemory = visitorData.deviceMemory;
      if (visitorData.hardwareConcurrency !== undefined) sessionData.hardwareConcurrency = visitorData.hardwareConcurrency;
      if (visitorData.maxTouchPoints !== undefined) sessionData.maxTouchPoints = visitorData.maxTouchPoints;
      if (visitorData.battery) sessionData.battery = visitorData.battery;
      if (visitorData.browser) sessionData.browser = visitorData.browser;
      if (visitorData.os) sessionData.os = visitorData.os;
      if (visitorData.device) sessionData.device = visitorData.device;

      await adminDb.collection(SESSIONS_COLLECTION).doc(sessionId).set(sessionData);

      // Log session_start event (only include geolocation if valid)
      const eventMetadata: any = {
        referrer: visitorData.referrer,
      };
      
      // Only add geo metadata if it's valid (not Unknown)
      if (visitorData.geolocation && 
          visitorData.geolocation.country && 
          visitorData.geolocation.country !== 'Unknown') {
        eventMetadata.geoLocation = visitorData.geolocation;
      }
      
      await adminDb.collection(EVENTS_COLLECTION).add({
        visitorId: vid,
        sessionId: sessionId,
        eventType: "session_start",
        timestamp: now,
        url: visitorData.url,
        metadata: eventMetadata,
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        sessionId: sessionId,
        visitorId: vid,
      });
    }

    // Heartbeat - Update session duration accurately
    if (event === "heartbeat" && visitorId && sessionId) {
      const sessionRef = adminDb.collection(SESSIONS_COLLECTION).doc(sessionId);
      const visitorRef = adminDb.collection(VISITORS_COLLECTION).doc(visitorId);

      const timeOnPage = metadata?.timeOnPage || 0;
      const scrollDepth = metadata?.scrollDepth || 0;

      // Get current session data to calculate actual time increment
      const sessionDoc = await sessionRef.get();
      
      if (!sessionDoc.exists) {
        return NextResponse.json({ 
          success: false, 
          error: "Session not found" 
        }, { status: 404 });
      }

      const sessionData = sessionDoc.data();
      const previousDuration = sessionData?.duration || 0;
      
      // Calculate ACTUAL time increment (only new time since last heartbeat)
      // This prevents double-counting when heartbeats arrive out of order or duplicate
      const timeIncrement = Math.max(0, timeOnPage - previousDuration);

      // Update session with absolute duration (server timestamp is source of truth)
      await sessionRef.update({
        duration: timeOnPage, // Store absolute duration
        scrollDepth: Math.max(scrollDepth, sessionData?.scrollDepth || 0), // Keep max scroll
        updatedAt: Timestamp.now(),
        lastHeartbeat: Timestamp.now(),
        isActive: true,
      });

      // Only increment visitor total active time if there's actual new time
      // This ensures we never double-count even if heartbeat is sent multiple times
      if (timeIncrement > 0) {
        await visitorRef.update({
          totalActiveTime: FieldValue.increment(timeIncrement),
          updatedAt: Timestamp.now(),
          lastVisit: Timestamp.now(),
          currentStatus: "active",
        });
      } else {
        // Just update timestamp without incrementing time (prevents stale status)
        await visitorRef.update({
          updatedAt: Timestamp.now(),
          lastVisit: Timestamp.now(),
          currentStatus: "active",
        });
      }

      // Store heartbeat data for detailed analysis (optional, can be used for debugging)
      await adminDb.collection(HEARTBEATS_COLLECTION).add({
        visitorId,
        sessionId,
        timestamp: Timestamp.now(),
        timeOnPage,
        scrollDepth,
        interactionCount: metadata?.interactionCount || 0,
        timeIncrement, // Log the actual increment for debugging
        createdAt: Timestamp.now(),
      });

      return NextResponse.json({ 
        success: true,
        timeIncrement, // Return increment for client-side verification
      });
    }

    // Page view
    if (event === "page_view" && visitorId && sessionId) {
      await adminDb.collection(SESSIONS_COLLECTION).doc(sessionId).update({
        pageViews: FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      });

      await adminDb.collection(VISITORS_COLLECTION).doc(visitorId).update({
        totalPageViews: FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      });

      await adminDb.collection(EVENTS_COLLECTION).add({
        visitorId,
        sessionId,
        eventType: "page_view",
        timestamp: Timestamp.now(),
        url: metadata?.url,
        createdAt: Timestamp.now(),
      });

      return NextResponse.json({ success: true });
    }

    // Click tracking
    if (event === "click" && visitorId && sessionId) {
      await adminDb.collection(INTERACTIONS_COLLECTION).add({
        visitorId,
        sessionId,
        type: "click",
        timestamp: Timestamp.now(),
        clickTarget: data,
        mousePosition: metadata?.mousePosition,
        url: metadata?.url,
        createdAt: Timestamp.now(),
      });

      // Update both visitor and session interaction counts
      await adminDb.collection(VISITORS_COLLECTION).doc(visitorId).update({
        totalInteractions: FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      });

      await adminDb.collection(SESSIONS_COLLECTION).doc(sessionId).update({
        interactions: FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      });

      return NextResponse.json({ success: true });
    }

    // Scroll tracking
    if (event === "scroll" && visitorId && sessionId) {
      await adminDb.collection(SESSIONS_COLLECTION).doc(sessionId).update({
        scrollDepth: Math.max(metadata?.scrollDepth || 0, 0),
        updatedAt: Timestamp.now(),
      });

      await adminDb.collection(EVENTS_COLLECTION).add({
        visitorId,
        sessionId,
        eventType: "scroll",
        timestamp: Timestamp.now(),
        metadata: { scrollDepth: metadata?.scrollDepth },
        createdAt: Timestamp.now(),
      });

      return NextResponse.json({ success: true });
    }

    // Resume view
    if (event === "resume_view" && visitorId && sessionId) {
      await adminDb.collection(VISITORS_COLLECTION).doc(visitorId).update({
        resumeViews: FieldValue.increment(1),
        totalInteractions: FieldValue.increment(1),
      });

      await adminDb.collection(EVENTS_COLLECTION).add({
        visitorId,
        sessionId,
        eventType: "resume_view",
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now(),
      });

      return NextResponse.json({ success: true });
    }

    // Resume download
    if (event === "resume_download" && visitorId && sessionId) {
      await adminDb.collection(VISITORS_COLLECTION).doc(visitorId).update({
        resumeDownloads: FieldValue.increment(1),
        totalInteractions: FieldValue.increment(1),
      });

      await adminDb.collection(EVENTS_COLLECTION).add({
        visitorId,
        sessionId,
        eventType: "resume_download",
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now(),
      });

      return NextResponse.json({ success: true });
    }

    // Contact form open
    if (event === "contact_open" && visitorId && sessionId) {
      await adminDb.collection(VISITORS_COLLECTION).doc(visitorId).update({
        totalInteractions: FieldValue.increment(1),
      });

      await adminDb.collection(EVENTS_COLLECTION).add({
        visitorId,
        sessionId,
        eventType: "contact_open",
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now(),
      });

      return NextResponse.json({ success: true });
    }

    // Form submission
    if (event === "form_submit" && visitorId && sessionId) {
      await adminDb.collection(VISITORS_COLLECTION).doc(visitorId).update({
        formSubmissions: FieldValue.increment(1),
        totalInteractions: FieldValue.increment(1),
      });

      await adminDb.collection(EVENTS_COLLECTION).add({
        visitorId,
        sessionId,
        eventType: "form_submit",
        timestamp: Timestamp.now(),
        data: data,
        createdAt: Timestamp.now(),
      });

      return NextResponse.json({ success: true });
    }

    // Session end
    if (event === "session_end" && visitorId && sessionId) {
      const sessionRef = adminDb.collection(SESSIONS_COLLECTION).doc(sessionId);
      const sessionDoc = await sessionRef.get();

      if (sessionDoc.exists) {
        const sessionData = sessionDoc.data();
        const duration = metadata?.timeOnPage || sessionData?.duration || 0;

        // Calculate final time increment for total active time
        const currentDuration = sessionData?.duration || 0;
        const finalIncrement = Math.max(0, duration - currentDuration);

        await sessionRef.update({
          endTime: Timestamp.now(),
          duration: duration,
          scrollDepth: metadata?.scrollDepth || sessionData?.scrollDepth || 0,
          isActive: false,
          updatedAt: Timestamp.now(),
        });

        // Update visitor average session duration and total active time
        const visitorRef = adminDb.collection(VISITORS_COLLECTION).doc(visitorId);
        const visitorDoc = await visitorRef.get();
        
        if (visitorDoc.exists) {
          const visitorData = visitorDoc.data();
          const totalSessions = visitorData?.totalSessions || 1;
          
          // Add any remaining time not captured by heartbeats
          const newTotalActiveTime = (visitorData?.totalActiveTime || 0) + finalIncrement;
          const averageDuration = Math.round(newTotalActiveTime / totalSessions);

          await visitorRef.update({
            totalActiveTime: newTotalActiveTime,
            averageSessionDuration: averageDuration,
            currentStatus: "offline",
            updatedAt: Timestamp.now(),
          });
        }
      } else {
        // Session doesn't exist - log warning but don't fail
        console.warn(`[VisitorTracking] session_end called for non-existent session: ${sessionId}`);
      }

      await adminDb.collection(EVENTS_COLLECTION).add({
        visitorId,
        sessionId,
        eventType: "session_end",
        timestamp: Timestamp.now(),
        metadata: metadata,
        createdAt: Timestamp.now(),
      });

      return NextResponse.json({ success: true });
    }

    // Captcha failed tracking
    if ((event === "captcha_failed" || event === "captcha_success" || event === "captcha_required") && visitorId) {
      console.log(`[VisitorTracking] Captcha event: ${event} for visitor: ${visitorId}`);
      
      // Track captcha failures in visitor profile for admin analytics
      if (event === "captcha_failed") {
        const visitorRef = adminDb.collection(VISITORS_COLLECTION).doc(visitorId);
        const visitorDoc = await visitorRef.get();
        
        if (visitorDoc.exists) {
          // Update existing visitor
          await visitorRef.update({
            captchaFailureCount: FieldValue.increment(1),
            lastCaptchaFailure: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        } else {
          // Create visitor profile if doesn't exist
          await visitorRef.set({
            id: visitorId,
            firstVisit: Timestamp.now(),
            lastVisit: Timestamp.now(),
            totalVisits: 1,
            totalSessions: 0,
            averageSessionDuration: 0,
            totalActiveTime: 0,
            totalPageViews: 0,
            totalBubbleOpens: 0,
            totalInteractions: 0,
            resumeViews: 0,
            resumeDownloads: 0,
            formSubmissions: 0,
            currentStatus: "offline",
            deviceClass: "unknown",
            captchaFailureCount: 1,
            lastCaptchaFailure: Timestamp.now(),
            banned: false,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }
      }

      // Clean metadata to remove undefined values
      const cleanMetadata: any = {};
      if (metadata?.attempts !== undefined) cleanMetadata.attempts = metadata.attempts;
      if (metadata?.reason !== undefined) cleanMetadata.reason = metadata.reason;
      if (metadata?.page !== undefined) cleanMetadata.page = metadata.page;
      
      // Add any other defined metadata fields
      Object.keys(metadata || {}).forEach(key => {
        if (metadata[key] !== undefined && !cleanMetadata.hasOwnProperty(key)) {
          cleanMetadata[key] = metadata[key];
        }
      });

      // Log event with comprehensive metadata
      await adminDb.collection(EVENTS_COLLECTION).add({
        visitorId,
        sessionId: sessionId || metadata?.sessionId || 'unknown',
        eventType: event,
        timestamp: Timestamp.now(),
        metadata: cleanMetadata,
        createdAt: Timestamp.now(),
      });

      return NextResponse.json({ success: true });
    }

    // Generic event tracking fallback (for any new event types)
    if (event && visitorId) {
      console.log(`[VisitorTracking] Generic event: ${event} for visitor: ${visitorId}`);
      
      await adminDb.collection(EVENTS_COLLECTION).add({
        visitorId,
        sessionId: sessionId || metadata?.sessionId,
        eventType: event,
        timestamp: Timestamp.now(),
        metadata: metadata || {},
        createdAt: Timestamp.now(),
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Unknown event type or missing required fields" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[VisitorTracking] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Tracking failed" },
      { status: 500 }
    );
  }
}
