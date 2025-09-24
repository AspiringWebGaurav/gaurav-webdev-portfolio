/**
 * Turnstile Background Refresh API Route
 * POST /api/turnstile/refresh
 * Silent verification refresh for existing verified users
 */

import { NextRequest, NextResponse } from 'next/server';
import { TURNSTILE_COOKIE_CONFIG } from '@/lib/types/turnstile';

export async function POST(request: NextRequest) {
  // Background refresh is disabled for session-based verification
  // Session cookies automatically expire when browser closes, no refresh needed
  console.log('[Turnstile Refresh] Background refresh disabled - using session-based verification');
  
  return NextResponse.json(
    {
      success: false,
      message: 'Background refresh not available for session-based verification',
      requiresFullVerification: true
    },
    { status: 410 } // 410 Gone - feature no longer available
  );
}

/**
 * Validate cookie format for refresh eligibility
 */
function validateCookieFormat(cookieValue: string): boolean {
  try {
    const parts = cookieValue.split('-');
    if (parts.length !== 4) return false;
    
    const [timestamp] = parts;
    const cookieTime = parseInt(timestamp);
    
    // Check if timestamp is reasonable and not too old
    const now = Date.now();
    const maxRefreshAge = TURNSTILE_COOKIE_CONFIG.maxAge * 1000; // Convert to milliseconds
    
    return !isNaN(cookieTime) && (now - cookieTime) <= maxRefreshAge;
  } catch {
    return false;
  }
}

/**
 * Generate new cookie value for background refresh
 */
function generateRefreshCookieValue(userAgent?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const environment = process.env.NODE_ENV || 'production';
  const method = 'refresh';
  
  // Create base value with refresh indicator
  const baseValue = `${timestamp}-${random}-${method}-${environment}`;
  
  // Add simple checksum (use proper HMAC signing in production)
  const checksum = Buffer.from(baseValue + (userAgent || '')).toString('base64').slice(0, 8);
  
  return `${baseValue}-${checksum}`;
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST for refresh.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}