/**
 * IP Tracking Utility
 * Extract and track visitor IP addresses for server-side ban detection
 */

import { NextRequest } from 'next/server';

/**
 * Extract client IP address from Next.js request
 * Handles various hosting environments (Vercel, Cloudflare, etc.)
 */
export function getClientIPFromRequest(request: NextRequest): string {
  // Try multiple headers for different platforms
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list, take first IP
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  
  const cfIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfIP) return cfIP;
  
  const clientIP = request.headers.get('x-client-ip');
  if (clientIP) return clientIP;
  
  // Fallback
  return 'unknown';
}

/**
 * Update visitor's lastIP field in Firestore
 * This enables fast server-side ban checks by IP
 */
export async function updateVisitorIP(
  db: FirebaseFirestore.Firestore,
  uuid: string,
  ip: string
): Promise<void> {
  try {
    if (ip === 'unknown') return;
    
    await db.collection('og_uuid').doc(uuid).update({
      lastIP: ip,
      lastIPUpdatedAt: new Date(),
    });
    
    console.log('[IP Tracking] Updated lastIP for visitor:', uuid.substring(0, 13), '→', ip);
  } catch (error) {
    // Don't fail the request if IP update fails
    console.error('[IP Tracking] Failed to update IP:', error);
  }
}
