/**
 * Spam Detection & Content Validation Utilities
 * Provides multiple layers of protection against spam and abuse
 */

/**
 * Common spam patterns and suspicious content indicators
 */
const SPAM_PATTERNS = [
  // URL spam
  /https?:\/\//gi,
  /www\./gi,
  /(\.com|\.net|\.org|\.io|\.co|\.info|\.biz)\b/gi,
  
  // Excessive repetition
  /(.)\1{4,}/gi, // Same character repeated 5+ times
  
  // Common spam phrases
  /\b(viagra|cialis|lottery|prize|winner|claim|casino|poker|forex|crypto|bitcoin|investment)\b/gi,
  /\b(click here|visit now|buy now|order now|limited time|act now)\b/gi,
  /\b(make money|earn money|work from home|get rich|financial freedom)\b/gi,
  /\b(weight loss|diet pills|lose weight|miracle cure)\b/gi,
  /\b(free money|free gift|free offer|100% free)\b/gi,
  
  // Suspicious patterns
  /\b(seo service|link building|backlink|ranking|traffic boost)\b/gi,
  /\b(loan|credit|mortgage|debt|insurance)\b/gi,
];

/**
 * Profanity and offensive content patterns
 */
const PROFANITY_PATTERNS = [
  /\b(fuck|shit|damn|bitch|asshole|bastard|cunt|dick)\b/gi,
  /\b(porn|xxx|sex|nude|naked)\b/gi,
];

/**
 * Excessive caps lock detector
 */
function hasExcessiveCaps(text: string): boolean {
  const capsCount = (text.match(/[A-Z]/g) || []).length;
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
  
  if (letterCount === 0) return false;
  
  // More than 50% caps is suspicious
  return capsCount / letterCount > 0.5 && capsCount > 10;
}

/**
 * Excessive punctuation detector
 */
function hasExcessivePunctuation(text: string): boolean {
  const punctuationCount = (text.match(/[!?]{3,}/g) || []).length;
  return punctuationCount > 2;
}

/**
 * Check for suspicious email patterns
 */
function isSuspiciousEmail(email: string): boolean {
  const suspiciousPatterns = [
    // Temporary email domains
    /\b(tempmail|guerrillamail|throwaway|disposable|10minutemail|mailinator|trashmail)\./i,
    // Random character emails
    /^[a-z0-9]{20,}@/i, // Very long random strings
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(email));
}

/**
 * Check for URL spam (multiple URLs)
 */
function hasExcessiveUrls(text: string): number {
  const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
  const matches = text.match(urlPattern);
  return matches ? matches.length : 0;
}

/**
 * Check if name looks fake or suspicious
 */
function isSuspiciousName(name: string): boolean {
  const trimmedName = name.trim();
  
  // Check for common test names
  const testNames = ['test', 'asdf', 'qwerty', 'admin', 'user', 'demo', 'sample'];
  if (testNames.includes(trimmedName.toLowerCase())) {
    return true;
  }
  
  // Check for names with numbers
  if (/\d/.test(trimmedName)) {
    return true;
  }
  
  // Check for very short or very long names
  if (trimmedName.length < 2 || trimmedName.length > 50) {
    return true;
  }
  
  // Check for all caps
  if (trimmedName === trimmedName.toUpperCase() && trimmedName.length > 3) {
    return true;
  }
  
  // Check for gibberish patterns (consecutive consonants/vowels)
  // Names like "asdasd", "xcvxcv", "qwqwqw" have unusual patterns
  const consonantPattern = /[bcdfghjklmnpqrstvwxyz]{5,}/i;
  const vowelPattern = /[aeiou]{4,}/i;
  
  if (consonantPattern.test(trimmedName) || vowelPattern.test(trimmedName)) {
    return true;
  }
  
  // Check for repeated character patterns (aa, bb, etc.)
  const repeatedPattern = /(.)\1{2,}/i;
  if (repeatedPattern.test(trimmedName)) {
    return true;
  }
  
  // Check for keyboard patterns (asdf, zxcv, etc.)
  const keyboardPatterns = [
    /qwer|wert|erty|rtyu|tyui|yuio|uiop/i,
    /asdf|sdfg|dfgh|fghj|ghjk|hjkl/i,
    /zxcv|xcvb|cvbn|vbnm/i,
  ];
  
  for (const pattern of keyboardPatterns) {
    if (pattern.test(trimmedName)) {
      return true;
    }
  }
  
  // Check if name has at least one vowel (real names have vowels)
  if (!/[aeiou]/i.test(trimmedName)) {
    return true;
  }
  
  // Check for single word without space (could be gibberish)
  // Real names often have first and last name
  const words = trimmedName.split(/\s+/);
  if (words.length === 1 && words[0].length > 15) {
    return true; // Single very long word is suspicious
  }
  
  // Check for alternating consonant-same-consonant pattern (like "adadad")
  const alternatingPattern = /^([a-z]{2,3})\1+$/i;
  if (alternatingPattern.test(trimmedName.replace(/\s/g, ''))) {
    return true;
  }
  
  return false;
}

/**
 * Advanced spam score calculator
 */
export function calculateSpamScore(data: {
  name: string;
  email: string;
  message: string;
}): {
  score: number;
  reasons: string[];
  isSpam: boolean;
} {
  let score = 0;
  const reasons: string[] = [];
  
  // Check URL spam (heavy weight)
  const urlCount = hasExcessiveUrls(data.message);
  if (urlCount > 0) {
    score += urlCount * 25; // 25 points per URL
    reasons.push(`Contains ${urlCount} URL(s)`);
  }
  
  // Check spam patterns
  let spamPatternMatches = 0;
  SPAM_PATTERNS.forEach(pattern => {
    const matches = data.message.match(pattern);
    if (matches && matches.length > 0) {
      spamPatternMatches += matches.length;
    }
  });
  
  if (spamPatternMatches > 0) {
    score += Math.min(spamPatternMatches * 15, 50); // Cap at 50 points
    reasons.push(`Contains spam keywords (${spamPatternMatches})`);
  }
  
  // Check profanity
  let profanityMatches = 0;
  PROFANITY_PATTERNS.forEach(pattern => {
    const matches = data.message.match(pattern);
    if (matches && matches.length > 0) {
      profanityMatches += matches.length;
    }
  });
  
  if (profanityMatches > 0) {
    score += profanityMatches * 20;
    reasons.push('Contains inappropriate language');
  }
  
  // Check excessive caps
  if (hasExcessiveCaps(data.message)) {
    score += 15;
    reasons.push('Excessive capital letters');
  }
  
  // Check excessive punctuation
  if (hasExcessivePunctuation(data.message)) {
    score += 10;
    reasons.push('Excessive punctuation');
  }
  
  // Check suspicious email
  if (isSuspiciousEmail(data.email)) {
    score += 30;
    reasons.push('Suspicious email address');
  }
  
  // Check suspicious name
  if (isSuspiciousName(data.name)) {
    score += 20;
    reasons.push('Suspicious name pattern');
  }
  
  // Check message length (too short might be spam)
  if (data.message.length < 20) {
    score += 10;
    reasons.push('Message too short');
  }
  
  // Check for repetitive characters
  if (/(.)\1{4,}/.test(data.message)) {
    score += 15;
    reasons.push('Repetitive characters');
  }
  
  // Spam threshold: 60+ points
  return {
    score,
    reasons,
    isSpam: score >= 60,
  };
}

/**
 * Validate honeypot field (should be empty)
 */
export function validateHoneypot(honeypotValue: string | undefined): boolean {
  // Honeypot should be empty. If filled, it's likely a bot
  return !honeypotValue || honeypotValue.trim().length === 0;
}

/**
 * Validate form submission timing (too fast = bot)
 */
export function validateFormTiming(timeSpent: number): {
  valid: boolean;
  reason?: string;
} {
  // Minimum time to fill form: 3 seconds
  // Maximum time before considering it suspicious: 30 minutes
  const MIN_TIME = 3000; // 3 seconds
  const MAX_TIME = 30 * 60 * 1000; // 30 minutes
  
  if (timeSpent < MIN_TIME) {
    return {
      valid: false,
      reason: 'Form submitted too quickly',
    };
  }
  
  if (timeSpent > MAX_TIME) {
    return {
      valid: false,
      reason: 'Form session expired',
    };
  }
  
  return { valid: true };
}

/**
 * Check if text contains only emoji or special characters
 */
export function isValidTextContent(text: string): boolean {
  // Remove spaces, punctuation, and common characters
  const cleanText = text.replace(/[\s.,!?;:()\-]/g, '');
  
  // Check if there's actual alphabetic content
  const hasAlpha = /[a-zA-Z]/.test(cleanText);
  
  return hasAlpha && cleanText.length >= 3;
}

/**
 * Verify Cloudflare Turnstile token (server-side)
 */
export async function verifyTurnstileToken(
  token: string,
  secretKey: string,
  remoteIp?: string
): Promise<{
  success: boolean;
  error?: string;
  score?: number;
}> {
  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
          remoteip: remoteIp,
        }),
      }
    );
    
    const data = await response.json();
    
    if (!data.success) {
      return {
        success: false,
        error: 'CAPTCHA verification failed',
      };
    }
    
    return {
      success: true,
      score: data.score || 1,
    };
  } catch (error) {
    console.error('[Turnstile] Verification error:', error);
    return {
      success: false,
      error: 'CAPTCHA verification service unavailable',
    };
  }
}

/**
 * Comprehensive contact form validation
 */
export async function validateContactFormSubmission(data: {
  name: string;
  email: string;
  message: string;
  honeypot?: string;
  timeSpent?: number;
  turnstileToken?: string;
  turnstileSecretKey?: string;
  remoteIp?: string;
}): Promise<{
  valid: boolean;
  errors: string[];
  spamScore?: number;
}> {
  const errors: string[] = [];
  
  // 1. Honeypot validation
  if (!validateHoneypot(data.honeypot)) {
    errors.push('Bot detection triggered');
  }
  
  // 2. Timing validation
  if (data.timeSpent !== undefined) {
    const timingResult = validateFormTiming(data.timeSpent);
    if (!timingResult.valid && timingResult.reason) {
      errors.push(timingResult.reason);
    }
  }
  
  // 3. Turnstile validation (if provided)
  if (data.turnstileToken && data.turnstileSecretKey) {
    const turnstileResult = await verifyTurnstileToken(
      data.turnstileToken,
      data.turnstileSecretKey,
      data.remoteIp
    );
    
    if (!turnstileResult.success) {
      errors.push(turnstileResult.error || 'Verification failed');
    }
  }
  
  // 4. Content validation
  if (!isValidTextContent(data.name)) {
    errors.push('Name must contain valid text');
  }
  
  if (!isValidTextContent(data.message)) {
    errors.push('Message must contain valid text');
  }
  
  // 5. Spam detection
  const spamCheck = calculateSpamScore({
    name: data.name,
    email: data.email,
    message: data.message,
  });
  
  if (spamCheck.isSpam) {
    errors.push(`Spam detected: ${spamCheck.reasons.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    spamScore: spamCheck.score,
  };
}
