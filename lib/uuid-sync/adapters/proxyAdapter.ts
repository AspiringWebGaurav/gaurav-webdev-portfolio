/**
 * Proxy Adapter - Integration with proxy.ts
 */

import { identifyVisitor, getIdentityResult } from '../services/identityService';
import { log, logError } from '../utils';

/**
 * Get visitor mask from request headers/IP
 * Called by proxy.ts on every request
 */
export async function getVisitorMaskFromRequest(
  request: Request
): Promise<string> {
  try {
    // Extract fingerprint components
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Create fingerprint from IP and User Agent
    const fingerprint = createFingerprint(ip, userAgent);
    
    // Resolve to mask
    const mask = await identifyVisitor(fingerprint);
    
    log('Visitor identified in proxy', { mask, ip: ip.substring(0, 15) });
    
    return mask;
  } catch (error) {
    logError('Failed to identify visitor in proxy', error);
    // Return fallback mask for graceful degradation
    return 'device_unknown';
  }
}

/**
 * Create consistent fingerprint from request data
 */
function createFingerprint(ip: string, userAgent: string): string {
  // Simple concatenation - can be enhanced with hashing if needed
  return `${ip}::${userAgent}`;
}

/**
 * Middleware-style function for proxy.ts
 */
export async function proxyIdentifyVisitor(
  request: Request
): Promise<{ mask: string; isNew: boolean }> {
  try {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const fingerprint = createFingerprint(ip, userAgent);
    const result = await getIdentityResult(fingerprint);
    
    return {
      mask: result.mask,
      isNew: result.isNew,
    };
  } catch (error) {
    logError('Proxy identification failed', error);
    return {
      mask: 'device_unknown',
      isNew: false,
    };
  }
}
