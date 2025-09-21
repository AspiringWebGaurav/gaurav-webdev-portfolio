/**
 * Turnstile Refresh API Route
 * POST /api/turnstile/refresh
 * Background refresh of verification cookies to maintain user sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from '@/lib/turnstile';
import { TURNSTILE_COOKIE_CONFIG } from '@/lib/types/turnstile';
import { aiLogger } from '@/utils/secureLogger';

interface RefreshRequest {
  refreshType: 'background' | 'explicit';
  userAgent?: string;
}

interface RefreshResponse {
  success: boolean;
  message: string;
  refreshedAt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RefreshRequest = await request.json();
    const { refreshType, userAgent } = body;
    
    const clientIP = getClientIP(request.headers);
    
    aiLogger.warn('[Turnstile Refresh] Background verification refresh requested', {
      refreshType,
      clientIP: clientIP ? 'present' : 'missing',
      userAgent: userAgent ? userAgent.substring(0, 50) + '...' : 'not provided',
      timestamp: new Date().toISOString()
    });

    // Check if there's an existing valid cookie
    const existingCookie = request.cookies.get(TURNSTILE_COOKIE_CONFIG.name);
    
    if (!existingCookie) {
      return NextResponse.json(
        {
          success: false,
          message: 'No existing verification found - full verification required'
        } as RefreshResponse,
        { status: 401 }
      );
    }

    // For background refresh, we'll extend the existing cookie if it's valid
    if (refreshType === 'background') {
      try {
        // Simple validation of existing cookie format
        const cookieValue = existingCookie.value;
        const parts = cookieValue.split('-');
        
        if (parts.length !== 4) {
          throw new Error('Invalid cookie format');
        }
        
        const [timestamp] = parts;
        const cookieTime = parseInt(timestamp);
        const now = Date.now();
        const maxAge = TURNSTILE_COOKIE_CONFIG.maxAge * 1000;
        
        // If cookie is still valid (within max age), refresh it
        if (!isNaN(cookieTime) && (now - cookieTime) <= maxAge) {
          const response = NextResponse.json(
            {
              success: true,
              message: 'Verification refreshed successfully',
              refreshedAt: new Date().toISOString()
            } as RefreshResponse,
            { status: 200 }
          );

          // Generate new cookie with extended time
          const newCookieValue = generateRefreshedCookieValue(cookieValue);
          
          response.cookies.set(TURNSTILE_COOKIE_CONFIG.name, newCookieValue, {
            httpOnly: TURNSTILE_COOKIE_CONFIG.httpOnly,
            secure: TURNSTILE_COOKIE_CONFIG.secure,
            sameSite: TURNSTILE_COOKIE_CONFIG.sameSite as 'strict' | 'lax' | 'none',
            path: TURNSTILE_COOKIE_CONFIG.path,
            maxAge: TURNSTILE_COOKIE_CONFIG.maxAge
          });

          aiLogger.warn('[Turnstile Refresh] Cookie refreshed successfully', {
            clientIP: clientIP ? 'present' : 'missing',
            refreshType,
            timestamp: new Date().toISOString()
          });

          return response;
        } else {
          // Cookie expired, require full verification
          return NextResponse.json(
            {
              success: false,
              message: 'Verification expired - full verification required'
            } as RefreshResponse,
            { status: 401 }
          );
        }
      } catch (error) {
        aiLogger.error('[Turnstile Refresh] Error validating existing cookie', {
          error: error instanceof Error ? error.message : 'Unknown error',
          clientIP: clientIP ? 'present' : 'missing'
        });
        
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid verification - full verification required'
          } as RefreshResponse,
          { status: 401 }
        );
      }
    }

    // For explicit refresh, require full verification
    return NextResponse.json(
      {
        success: false,
        message: 'Explicit refresh requires full verification'
      } as RefreshResponse,
      { status: 401 }
    );

  } catch (error) {
    aiLogger.error('[Turnstile Refresh] Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      {
        success: false,
        message: 'Refresh service temporarily unavailable'
      } as RefreshResponse,
      { status: 500 }
    );
  }
}

// Generate refreshed cookie value
function generateRefreshedCookieValue(originalCookie: string): string {
  try {
    const parts = originalCookie.split('-');
    if (parts.length !== 4) {
      throw new Error('Invalid original cookie format');
    }
    
    const [, random, environment, ] = parts;
    
    // Generate new timestamp and checksum
    const newTimestamp = Date.now();
    const baseValue = `${newTimestamp}-${random}-${environment}`;
    const checksum = Buffer.from(baseValue).toString('base64').slice(0, 8);
    
    return `${baseValue}-${checksum}`;
  } catch (error) {
    // Fallback: generate completely new cookie value
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const environment = process.env.NODE_ENV || 'development';
    const baseValue = `${timestamp}-${random}-${environment}`;
    const checksum = Buffer.from(baseValue).toString('base64').slice(0, 8);
    
    return `${baseValue}-${checksum}`;
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
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