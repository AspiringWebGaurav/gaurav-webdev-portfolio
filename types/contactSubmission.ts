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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactSubmissionDTO {
  name: string;
  email: string;
  message: string;
  userAgent?: string;
  ipAddress?: string;
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
