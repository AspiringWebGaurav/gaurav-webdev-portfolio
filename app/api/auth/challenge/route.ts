/**
 * Enterprise-Grade Challenge-Response Authentication
 * Similar to Facebook/Reddit security model
 * 
 * Flow:
 * 1. Client requests challenge → Server generates nonce + timestamp
 * 2. Client signs challenge with credentials → Creates HMAC signature
 * 3. Server verifies signature → No password transmitted over network
 * 
 * Security Features:
 * - No credentials in network requests
 * - Time-limited challenges (60s expiry)
 * - Rate limiting per IP
 * - CSRF protection
 * - Challenge reuse prevention
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { storeChallenge, rateLimitStore, getClientIP, checkRateLimit } from "@/lib/challengeVerification";
import { trackSecurityEvent, isBlocked, isSuspicious } from "@/lib/securityMonitor";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request.headers);

    // Security Layer 0: Check if IP is blocked by intelligent monitoring
    if (isBlocked(ip)) {
      console.error(`🚫 BLOCKED IP attempted access: ${ip}`);
      return NextResponse.json(
        { 
          error: "Access denied. Your IP has been blocked due to suspicious activity.",
          code: "IP_BLOCKED"
        },
        { status: 403 }
      );
    }

    // Security Layer 1: CSRF Protection
    const csrfToken = request.headers.get("X-CSRF-Token");
    const fingerprint = request.headers.get("X-Fingerprint");
    
    if (!csrfToken || !fingerprint) {
      console.warn(`⚠️ Missing CSRF token or fingerprint from ${ip}`);
      
      // Track CSRF violation
      trackSecurityEvent({
        type: 'csrf_violation',
        ip,
        timestamp: Date.now(),
        severity: 'medium'
      });
      
      return NextResponse.json(
        { 
          error: "Security validation failed",
          code: "CSRF_REQUIRED"
        },
        { status: 403 }
      );
    }

    // Rate limiting check
    if (!checkRateLimit(ip)) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${ip}`);
      
      // Track rate limit violation
      trackSecurityEvent({
        type: 'rate_limit',
        ip,
        timestamp: Date.now(),
        severity: isSuspicious(ip) ? 'high' : 'medium'
      });
      
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED"
        },
        { status: 429 }
      );
    }

    // Generate cryptographically secure nonce
    const nonce = crypto.randomBytes(32).toString("base64");
    const timestamp = Date.now();
    const challengeId = crypto.randomBytes(16).toString("hex");

    // Store challenge in Redis (serverless-safe)
    const stored = await storeChallenge(challengeId, {
      nonce,
      timestamp,
      ip,
      used: false
    });

    if (!stored) {
      console.error("❌ Failed to store challenge in Redis");
      return NextResponse.json(
        { error: "Service temporarily unavailable", code: "STORAGE_ERROR" },
        { status: 503 }
      );
    }

    console.log(`✅ Challenge generated for IP: ${ip}`);

    return NextResponse.json({
      challengeId,
      nonce,
      timestamp,
      expiresIn: 60 // seconds
    });

  } catch (error) {
    console.error("❌ Challenge generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate challenge",
        code: "CHALLENGE_ERROR"
      },
      { status: 500 }
    );
  }
}
