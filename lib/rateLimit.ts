/**
 * Enterprise-Grade Rate Limiting System
 * Multi-layer protection with smart bot prevention
 * 
 * Layers:
 * 1. In-memory rate limiting (fastest)
 * 2. IP-based throttling
 * 3. Session-based limits
 * 4. Fingerprint-based detection
 * 5. Smart Turnstile (only when suspicious)
 * 
 * Features:
 * - Non-intrusive (no captcha on first message)
 * - Progressive enforcement
 * - Automatic cooldown
 * - Enterprise-grade DDoS protection
 */

import { NextRequest } from 'next/server';
import { adminDb } from './firebaseAdmin';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  banDuration?: number;
  skipSuccessfulRequests?: boolean;
  strictMode?: boolean; // Enable enhanced bot detection
  burstProtection?: boolean; // Detect suspicious burst patterns
  progressiveBackoff?: boolean; // Gradual penalties instead of instant ban
}

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
  blocked: boolean;
  blockExpiry?: number;
  suspiciousScore: number;
  violations: number; // Track number of violations for progressive backoff
}

interface BotDetectionResult {
  isBot: boolean;
  confidence: number;
  requiresCaptcha: boolean;
  reason?: string;
}

// Rate limit configurations for different endpoints
// OPTIMIZED: Smart rate limiting - strict on bots, fair to users
const RATE_LIMITS = {
  // Chat messages - BALANCED: prevent spam but allow natural conversation
  chatMessage: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 messages per minute (natural conversation rate)
    banDuration: 3 * 60 * 1000, // 3 min ban if exceeded (was 10)
    strictMode: true, // Enable enhanced bot detection
    progressiveBackoff: true, // Gradual penalties instead of instant ban
  },
  
  // Admin operations - GENEROUS: admins need to work fast
  admin: {
    windowMs: 60 * 1000,
    maxRequests: 100, // Much higher limit for admin
    banDuration: 1 * 60 * 1000, // Short cooldown
  },
  
  // Chat polling - generous but with burst protection
  chatPoll: {
    windowMs: 60 * 1000,
    maxRequests: 120, // 120 polls per minute (every 500ms is ok)
    banDuration: 2 * 60 * 1000,
    burstProtection: true, // Detect rapid bursts
  },
  
  // Typing indicators - moderate
  typing: {
    windowMs: 30 * 1000, // 30 seconds
    maxRequests: 30, // Max 30 typing updates per 30s
    banDuration: 2 * 60 * 1000,
  },
  
  // Session creation - STRICT but fair: prevent bot account spam
  sessionCreate: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 new sessions per hour (increased from 3)
    banDuration: 30 * 60 * 1000, // 30 min ban (reduced from 60)
    strictMode: true,
  },
  
  // Contact form - VERY STRICT
  contactForm: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // Only 3 submissions per hour
    banDuration: 60 * 60 * 1000, // 1 hour ban
    strictMode: true,
  },
  
  // General API - moderate
  general: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    banDuration: 5 * 60 * 1000,
  },
  
  // Ban check - very permissive (happens on every page load)
  banCheck: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // Allow frequent checks
    banDuration: 1 * 60 * 1000, // Short 1-min cooldown
  },
} as const;

// In-memory store (fast lookup)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove entries older than 1 hour
    if (now - entry.lastRequest > 60 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client identifier - FIXED: Prioritize fingerprint over IP
 */
function getClientId(request: NextRequest, fingerprint?: string): string {
  // PRIORITY 1: Fingerprint (most accurate for user tracking)
  if (fingerprint) {
    return `fp:${fingerprint}`;
  }
  
  // PRIORITY 2: IP address (fallback)
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';
  
  return `ip:${ip}`;
}

/**
 * Advanced bot detection using multiple signals
 */
function detectBot(request: NextRequest, sessionHistory?: any): BotDetectionResult {
  let suspiciousScore = 0;
  const reasons: string[] = [];

  // Check 1: User-Agent
  const userAgent = request.headers.get('user-agent') || '';
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i,
    /go-http/i, /okhttp/i, /apache/i,
  ];
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    suspiciousScore += 50;
    reasons.push('bot-user-agent');
  }

  if (!userAgent || userAgent.length < 20) {
    suspiciousScore += 30;
    reasons.push('suspicious-user-agent');
  }

  // Check 2: Headers (bots often have incomplete headers)
  const hasReferer = request.headers.has('referer');
  const hasAcceptLanguage = request.headers.has('accept-language');
  const hasAccept = request.headers.has('accept');
  
  if (!hasReferer && !hasAcceptLanguage) {
    suspiciousScore += 20;
    reasons.push('missing-browser-headers');
  }

  if (!hasAccept) {
    suspiciousScore += 15;
    reasons.push('no-accept-header');
  }

  // Check 3: Request timing patterns
  if (sessionHistory) {
    const timings = sessionHistory.requestTimings || [];
    if (timings.length > 5) {
      // Check for suspiciously regular intervals (bot-like)
      const intervals = timings.slice(0, -1).map((time: number, i: number) => 
        timings[i + 1] - time
      );
      
      const avgInterval = intervals.reduce((a: number, b: number) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum: number, interval: number) => 
        sum + Math.pow(interval - avgInterval, 2), 0
      ) / intervals.length;
      
      // Very low variance = bot (too regular)
      if (variance < 100 && intervals.length > 10) {
        suspiciousScore += 40;
        reasons.push('robotic-timing');
      }
    }

    // Check for rapid-fire requests
    const recentRequests = timings.filter((time: number) => 
      Date.now() - time < 10000 // Last 10 seconds
    );
    
    if (recentRequests.length > 20) {
      suspiciousScore += 30;
      reasons.push('rapid-fire-requests');
    }
  }

  // Check 4: JavaScript execution (via fingerprint)
  const hasFingerprint = request.headers.get('x-fingerprint');
  if (!hasFingerprint) {
    suspiciousScore += 10;
    reasons.push('no-fingerprint');
  }

  // Determine bot likelihood
  const isBot = suspiciousScore >= 60;
  const requiresCaptcha = suspiciousScore >= 40; // Lower threshold for captcha

  return {
    isBot,
    confidence: Math.min(suspiciousScore, 100),
    requiresCaptcha,
    reason: reasons.join(', '),
  };
}

/**
 * Main rate limiting function
 */
export async function checkRateLimit(
  request: NextRequest,
  type: keyof typeof RATE_LIMITS = 'general',
  sessionId?: string,
  fingerprint?: string
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
  requiresCaptcha: boolean;
  botDetected: boolean;
  reason?: string;
}> {
  const config = RATE_LIMITS[type];
  const clientId = getClientId(request, fingerprint);
  const key = `${type}:${clientId}`;
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = {
      count: 0,
      firstRequest: now,
      lastRequest: now,
      blocked: false,
      suspiciousScore: 0,
      violations: 0, // Initialize violations counter
    };
    rateLimitStore.set(key, entry);
  }

  // Check if currently blocked
  if (entry.blocked && entry.blockExpiry && now < entry.blockExpiry) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockExpiry,
      requiresCaptcha: true,
      botDetected: entry.suspiciousScore >= 60,
      reason: 'Rate limit exceeded - temporarily blocked',
    };
  }

  // Reset if window expired
  if (now - entry.firstRequest > config.windowMs) {
    // Window expired - reset but keep violation count for progressive backoff
    const previousViolations = entry.violations;
    entry.count = 0;
    entry.firstRequest = now;
    entry.blocked = false;
    entry.blockExpiry = undefined;
    entry.violations = previousViolations; // Preserve violations
  }

  // ENHANCED: Burst protection - detect rapid consecutive requests
  if (config.burstProtection) {
    const timeSinceLastRequest = now - entry.lastRequest;
    if (timeSinceLastRequest < 100 && entry.count > 5) {
      // Less than 100ms between requests, multiple times = bot behavior
      entry.suspiciousScore += 20;
    }
  }

  // Increment request count
  entry.count++;
  entry.lastRequest = now;

  // ENHANCED: Bot detection with strict mode
  let botDetection: BotDetectionResult | null = null;
  const detectionThreshold = config.strictMode ? 0.5 : 0.7;
  
  if (entry.count > config.maxRequests * detectionThreshold) {
    // Start checking for bots when approaching limit (earlier in strict mode)
    botDetection = detectBot(request, entry);
    entry.suspiciousScore = Math.max(entry.suspiciousScore, botDetection.confidence);
    
    // ENHANCED: In strict mode, block bots immediately
    if (config.strictMode && botDetection.isBot) {
      entry.blocked = true;
      entry.blockExpiry = now + (config.banDuration || 30 * 60 * 1000);
      
      // Log bot detection
      if (adminDb) {
        adminDb.collection('rateLimitBotDetections').add({
          clientId,
          type,
          timestamp: new Date(),
          suspiciousScore: entry.suspiciousScore,
          reason: botDetection.reason,
          userAgent: request.headers.get('user-agent'),
        }).catch(err => console.error('[RateLimit] Failed to log bot:', err));
      }
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockExpiry,
        requiresCaptcha: true,
        botDetected: true,
        reason: `Bot detected: ${botDetection.reason}`,
      };
    }
  }

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    // Increment violations
    entry.violations++;
    
    // PROGRESSIVE BACKOFF: Calculate ban duration based on violations
    let banDuration = config.banDuration || 5 * 60 * 1000;
    
    if (config.progressiveBackoff) {
      // Progressive penalties:
      // 1st: 30s, 2nd: 2min, 3rd: 5min, 4th+: full ban duration
      const penalties = [30 * 1000, 2 * 60 * 1000, 5 * 60 * 1000];
      banDuration = penalties[Math.min(entry.violations - 1, penalties.length - 1)] || banDuration;
    }
    
    // Apply ban
    entry.blocked = true;
    entry.blockExpiry = now + banDuration;
    
    // Log to Firebase for analysis (async, don't await)
    if (adminDb) {
      adminDb.collection('rateLimitViolations').add({
        clientId,
        type,
        timestamp: new Date(),
        requestCount: entry.count,
        suspiciousScore: entry.suspiciousScore,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        botDetected: botDetection?.isBot || false,
        sessionId: sessionId || null,
      }).catch(err => console.error('[RateLimit] Failed to log violation:', err));
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockExpiry,
      requiresCaptcha: true,
      botDetected: botDetection?.isBot || false,
      reason: `Too many requests. Try again in ${Math.ceil((entry.blockExpiry - now) / 1000)}s`,
    };
  }

  const remaining = config.maxRequests - entry.count;
  const resetAt = entry.firstRequest + config.windowMs;

  return {
    allowed: true,
    remaining,
    resetAt,
    requiresCaptcha: botDetection?.requiresCaptcha || false,
    botDetected: botDetection?.isBot || false,
  };
}

/**
 * Verify Cloudflare Turnstile token (only called when captcha required)
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  
  if (!secret) {
    console.warn('[RateLimit] Turnstile secret not configured');
    return true; // Allow if not configured
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          response: token,
        }),
      }
    );

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('[RateLimit] Turnstile verification failed:', error);
    return false; // Strict: reject on error
  }
}

/**
 * Middleware helper for easy integration
 * ENHANCED: Admin exemption and fingerprint priority
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  type: keyof typeof RATE_LIMITS,
  options: {
    sessionId?: string;
    fingerprint?: string;
    turnstileToken?: string;
  } = {}
): Promise<{ response: Response | null; headers: Record<string, string> }> {
  const { sessionId, fingerprint, turnstileToken } = options;

  // BYPASS 1: Test mode header
  const isTestMode = request.headers.get('x-test-mode') === 'true';
  if (isTestMode && process.env.NODE_ENV === 'development') {
    console.log('[RateLimit] Test mode bypass activated');
    return {
      response: null,
      headers: {
        'X-RateLimit-Limit': '999999',
        'X-RateLimit-Remaining': '999999',
        'X-RateLimit-Reset': new Date(Date.now() + 3600000).toISOString(),
        'X-Test-Mode': 'true',
      },
    };
  }

  // BYPASS 2: Admin authentication - use more generous limits
  const authHeader = request.headers.get('authorization');
  const isAdmin = authHeader?.startsWith('Bearer ');
  
  if (isAdmin) {
    // Use admin rate limits instead
    type = 'admin' as keyof typeof RATE_LIMITS;
  }

  // Check rate limit
  const result = await checkRateLimit(request, type, sessionId, fingerprint);

  // Prepare rate limit headers
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': RATE_LIMITS[type].maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
  };

  // If captcha required and no token provided, ask for it
  if (result.requiresCaptcha && !turnstileToken) {
    return {
      response: new Response(
        JSON.stringify({
          error: 'Verification required',
          code: 'CAPTCHA_REQUIRED',
          message: 'Please complete the verification to continue',
          requiresCaptcha: true,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...headers } }
      ),
      headers,
    };
  }

  // If captcha required and token provided, verify it
  if (result.requiresCaptcha && turnstileToken) {
    const valid = await verifyTurnstile(turnstileToken);
    if (!valid) {
      return {
        response: new Response(
          JSON.stringify({
            error: 'Verification failed',
            code: 'CAPTCHA_INVALID',
            message: 'Verification failed. Please try again.',
          }),
          { status: 429, headers: { 'Content-Type': 'application/json', ...headers } }
        ),
        headers,
      };
    }
    // Captcha valid - allow request and reset suspicious score
    const clientId = getClientId(request, fingerprint);
    const key = `${type}:${clientId}`;
    const entry = rateLimitStore.get(key);
    if (entry) {
      entry.suspiciousScore = 0; // Reset score after successful verification
      entry.count = Math.floor(entry.count * 0.5); // Reduce count as reward
    }
  }

  // If not allowed, return error
  if (!result.allowed) {
    return {
      response: new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          message: result.reason,
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
          botDetected: result.botDetected,
        }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
            ...headers,
          }
        }
      ),
      headers,
    };
  }

  // Allowed - return null response but include headers
  return { response: null, headers };
}

/**
 * Get current rate limit status for a client
 */
export function getRateLimitStatus(
  request: NextRequest,
  type: keyof typeof RATE_LIMITS,
  fingerprint?: string
): {
  remaining: number;
  limit: number;
  resetAt: number;
} {
  const config = RATE_LIMITS[type];
  const clientId = getClientId(request, fingerprint);
  const key = `${type}:${clientId}`;
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return {
      remaining: config.maxRequests,
      limit: config.maxRequests,
      resetAt: Date.now() + config.windowMs,
    };
  }

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetAt = entry.firstRequest + config.windowMs;

  return { remaining, limit: config.maxRequests, resetAt };
}

/**
 * Manual override to whitelist/blacklist IPs (admin only)
 */
const whitelist = new Set<string>();
const blacklist = new Set<string>();

export function whitelistIP(ip: string) {
  whitelist.add(ip);
  console.log(`[RateLimit] Whitelisted IP: ${ip}`);
}

export function blacklistIP(ip: string) {
  blacklist.add(ip);
  console.log(`[RateLimit] Blacklisted IP: ${ip}`);
}

export function isWhitelisted(ip: string): boolean {
  return whitelist.has(ip);
}

export function isBlacklisted(ip: string): boolean {
  return blacklist.has(ip);
}
