/**
 * Contact Form Submission type definitions
 * Handles user contact form submissions with email integration
 */

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "read" | "replied"; // submission status
  isReplied: boolean; // whether admin has replied
  repliedAt?: Date; // when admin replied
  repliedBy?: string; // admin email who replied
  replyMessage?: string; // admin's reply content
  userAgent?: string; // browser info for abuse tracking
  ipAddress?: string; // IP for abuse protection
  fingerprint?: string; // Device fingerprint
  spamScore?: number; // Calculated spam score for admin review
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactSubmissionDTO {
  name: string;
  email: string;
  message: string;
  userAgent?: string;
  ipAddress?: string;
  honeypot?: string; // Bot trap field
  timeSpent?: number; // Time spent filling form (ms)
  turnstileToken?: string; // Cloudflare Turnstile token
  fingerprint?: string; // Device fingerprint
  spamScore?: number; // Calculated spam score
}

export interface UpdateContactSubmissionDTO {
  id: string;
  status?: "new" | "read" | "replied";
  isReplied?: boolean;
  repliedAt?: Date;
  repliedBy?: string;
  replyMessage?: string;
}

export interface ReplyToSubmissionDTO {
  id: string;
  repliedBy: string;
}

export interface RestoreContactSubmissionDTO {
  name: string;
  email: string;
  message: string;
  status: "new" | "read" | "replied";
  isReplied: boolean;
  repliedAt?: Date;
  repliedBy?: string;
  replyMessage?: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactSubmissionValidationError {
  field: string;
  message: string;
}

export interface ContactSubmissionOperationResult {
  success: boolean;
  data?: ContactSubmission | ContactSubmission[];
  error?: string;
  validationErrors?: ContactSubmissionValidationError[];
}

// Validation constants
export const MAX_CONTACT_SUBMISSIONS = 1000; // High limit for contact forms
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 100;
export const MIN_MESSAGE_LENGTH = 10;
export const MAX_MESSAGE_LENGTH = 2000;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate limiting constants
export const MAX_SUBMISSIONS_PER_EMAIL_PER_DAY = 3;
export const MAX_SUBMISSIONS_PER_IP_PER_HOUR = 5;

/**
 * Validates contact submission data
 */
export function validateContactSubmission(
  data: Partial<CreateContactSubmissionDTO>
): ContactSubmissionValidationError[] {
  const errors: ContactSubmissionValidationError[] = [];

  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: "name", message: "Name is required" });
  } else if (data.name.trim().length < MIN_NAME_LENGTH) {
    errors.push({
      field: "name",
      message: `Name must be at least ${MIN_NAME_LENGTH} characters`,
    });
  } else if (data.name.trim().length > MAX_NAME_LENGTH) {
    errors.push({
      field: "name",
      message: `Name must not exceed ${MAX_NAME_LENGTH} characters`,
    });
  } else {
    // Additional name validation
    const name = data.name.trim();
    const nameLower = name.toLowerCase().replace(/\s+/g, '');
    
    // Check for numbers in name
    if (/\d/.test(name)) {
      errors.push({
        field: "name",
        message: "Name should not contain numbers",
      });
    }
    
    // Check for special characters (allow only letters, spaces, hyphens, apostrophes)
    if (!/^[a-zA-Z\s\-']+$/.test(name)) {
      errors.push({
        field: "name",
        message: "Name should only contain letters, spaces, hyphens, and apostrophes",
      });
    }
    
    // Check if name has at least one vowel
    if (!/[aeiouAEIOU]/.test(name)) {
      errors.push({
        field: "name",
        message: "Please enter a valid name",
      });
    }
    
    // Check for excessive repeated characters (like "aaa", "sss")
    if (/(.)\1{2,}/.test(name)) {
      errors.push({
        field: "name",
        message: "Name contains invalid repeated characters",
      });
    }
    
    // Check for keyboard patterns
    const keyboardPatterns = /qwert|asdf|zxcv|qaz|wsx|edc|rfv|tgb|yhn|ujm/i;
    if (keyboardPatterns.test(nameLower)) {
      errors.push({
        field: "name",
        message: "Please enter your real name",
      });
    }
    
    // Check for repeated short sequences (like "asdasd", "adssad")
    // This catches patterns where 2-4 characters repeat
    for (let len = 2; len <= 4; len++) {
      const regex = new RegExp(`([a-z]{${len}})\\1{2,}`, 'i');
      if (regex.test(nameLower)) {
        errors.push({
          field: "name",
          message: "Please enter a valid name without repeated patterns",
        });
        break;
      }
    }
    
    // Check for common gibberish patterns (alternating 2 chars like "adadad")
    if (/^([a-z]{1,2})\1{3,}$/i.test(nameLower)) {
      errors.push({
        field: "name",
        message: "Please enter your real name",
      });
    }
    
    // Check for excessive consonants in a row (5+)
    if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(name)) {
      errors.push({
        field: "name",
        message: "Name contains invalid character combinations",
      });
    }
    
    // Check each word separately for gibberish
    const words = name.split(/\s+/);
    for (const word of words) {
      const wordLower = word.toLowerCase();
      
      // Check if word is too random (low vowel to consonant ratio)
      const vowels = (wordLower.match(/[aeiou]/g) || []).length;
      const consonants = (wordLower.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length;
      
      if (word.length >= 5 && consonants > 0 && vowels / consonants < 0.3) {
        errors.push({
          field: "name",
          message: "Please enter a valid name",
        });
        break;
      }
    }
  }

  // Email validation
  if (!data.email || data.email.trim().length === 0) {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.push({
      field: "email",
      message: "Please enter a valid email address",
    });
  }

  // Message validation
  if (!data.message || data.message.trim().length === 0) {
    errors.push({ field: "message", message: "Message is required" });
  } else if (data.message.trim().length < MIN_MESSAGE_LENGTH) {
    errors.push({
      field: "message",
      message: `Message must be at least ${MIN_MESSAGE_LENGTH} characters`,
    });
  } else if (data.message.trim().length > MAX_MESSAGE_LENGTH) {
    errors.push({
      field: "message",
      message: `Message must not exceed ${MAX_MESSAGE_LENGTH} characters`,
    });
  }

  return errors;
}

/**
 * Sanitizes contact submission data
 */
export function sanitizeContactSubmission(
  data: CreateContactSubmissionDTO
): CreateContactSubmissionDTO {
  return {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    message: data.message.trim(),
    userAgent: data.userAgent,
    ipAddress: data.ipAddress,
  };
}
