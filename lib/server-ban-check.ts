/**
 * SERVER-SIDE BAN DETECTION SYSTEM
 * 
 * FLOW:
 * 1. Visitor hits ANY page (/, /about, etc.)
 * 2. proxy.ts intercepts request BEFORE rendering
 * 3. Extract IP address from request headers
 * 4. Query Firebase for visitors from this IP
 * 5. If found AND banned → redirect to /banned (307)
 * 6. If not found OR not banned → continue to page
 * 
 * BENEFITS:
 * - Zero client-side delay (happens before HTML is sent)
 * - No cookies, no localStorage, pure server state
 * - IP-based lookup (fast Firestore query)
 * - Works even if JavaScript disabled
 * 
 * STRATEGY:
 * - Check by IP address (most visitors have stable IPs for session duration)
 * - Fast because we query existing banned visitors only
 * - If IP has multiple visitors, check each one
 * - Client-side will still do full fingerprint check for precision
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { deduplicate } from '@/lib/requestDeduplication';
import logger from './logger';

/**
 * Extract IP address from request headers
 */
export function getClientIP(request: Request | any): string {
  // Try multiple headers for different hosting platforms
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    request.headers.get('x-client-ip') ||
    request.ip ||
    'unknown';
  
  return ip;
}

/**
 * Check if visitor from this IP is banned
 * Fast lookup using IP address stored in visitor records
 */
export async function checkBanByIP(ip: string): Promise<{
  banned: boolean;
  banReason?: string;
  banCategory?: string;
  mask?: string;
  uuid?: string;
}> {
  try {
    if (ip === 'unknown') {
      logger.debug('[Server Ban Check] IP is unknown, skipping check');
      return { banned: false };
    }
    
    logger.debug('[Server Ban Check] 🔍 Querying Firestore for banned IP:', ip);
    
    // Use adminDb from firebaseAdmin (already initialized)
    const db = adminDb;
    
    // Query for banned visitors from this IP with DEDUPLICATION
    // This is CRITICAL because proxy.ts calls this on EVERY request
    const querySnapshot = await deduplicate(
      `ban-check-ip-${ip}`,
      async () => {
        const queryPromise = db
          .collection('og_uuid')
          .where('isBanned', '==', true)
          .where('lastIP', '==', ip)
          .limit(1)
          .get();
        
        // Add 3-second timeout to prevent blocking on slow queries
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Ban check timeout')), 3000)
        );
        
        return Promise.race([queryPromise, timeoutPromise]);
      },
      10000 // 10s TTL - ban status doesn't change frequently
    );
    
    logger.debug('[Server Ban Check] Query results:', querySnapshot.size, 'documents found');
    
    if (querySnapshot.empty) {
      // No banned visitors from this IP
      return { banned: false };
    }
    
    const visitorDoc = querySnapshot.docs[0];
    const data = visitorDoc.data();
    
    // Always log banned visitors (security event)
    logger.info('[Server Ban Check] ⛔ BANNED VISITOR BLOCKED:', {
      mask: data.mask,
      ip: ip,
      reason: data.banReason,
    });
    
    return {
      banned: true,
      banReason: data.banReason || 'Security Violation',
      banCategory: data.banCategory || 'normal',
      mask: data.mask,
      uuid: visitorDoc.id,
    };
    
  } catch (error: any) {
    // Log error details for monitoring
    console.error('[Server Ban Check] ERROR - Failing open to allow access:', {
      message: error?.message,
      ip: ip,
      timestamp: new Date().toISOString(),
    });
    
    // CRITICAL: Fail open - don't block legitimate visitors on errors
    // Better to let one banned visitor through than block all visitors
    return { banned: false };
  }
}
