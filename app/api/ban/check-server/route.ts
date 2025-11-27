/**
 * Server-Side Ban Check API
 * 
 * Purpose: Check if a visitor is banned using IP address
 * Method: GET
 * Query Params: ip (client IP address)
 * 
 * Response:
 * {
 *   banned: boolean,
 *   banReason?: string,
 *   banCategory?: string,
 *   mask?: string,
 *   uuid?: string
 * }
 * 
 * Note: READ-ONLY - does NOT create visitors, only checks existing banned ones
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkBanByIP } from '@/lib/server-ban-check';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ip = searchParams.get('ip');
    
    if (!ip) {
      return NextResponse.json(
        { error: 'Missing IP parameter' },
        { status: 400 }
      );
    }
    
    console.log('[Server Ban Check API] Checking ban status for IP:', ip);
    
    const result = await checkBanByIP(ip);
    
    if (result.banned) {
      console.log('[Server Ban Check API] ⛔ Visitor IS BANNED', {
        ip,
        mask: result.mask,
        reason: result.banReason,
        category: result.banCategory,
      });
    } else {
      console.log('[Server Ban Check API] ✅ No banned visitors from IP');
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[Server Ban Check API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', banned: false },
      { status: 500 }
    );
  }
}
