/**
 * Ban Appeal Type Definitions - SIMPLIFIED
 * Handles visitor ban appeals with admin review functionality
 * No complex history tracking or automatic recycle bin moves
 */

export interface BanAppeal {
  id: string;
  visitorId: string;
  appealReason: string; // User's explanation
  banReason: string; // Original ban reason
  banCategory: "normal" | "medium" | "danger" | "severe";
  status: "pending" | "accepted" | "rejected";
  reviewedBy?: string; // Admin email who reviewed
  reviewedAt?: Date;
  reviewNotes?: string; // Admin's internal notes
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBanAppealDTO {
  appealReason: string;
  banReason: string;
  banCategory: "normal" | "medium" | "danger" | "severe";
}

export interface UpdateBanAppealDTO {
  id: string;
  status?: "pending" | "accepted" | "rejected";
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

export interface ReviewBanAppealDTO {
  id: string;
  action: "accept" | "reject";
  reviewedBy: string;
  reviewNotes?: string;
}

export interface RestoreBanAppealDTO {
  visitorId: string;
  appealReason: string;
  banReason: string;
  banCategory: "normal" | "medium" | "danger" | "severe";
  status: "pending" | "accepted" | "rejected";
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BanAppealValidationError {
  field: string;
  message: string;
}

export interface BanAppealOperationResult {
  success: boolean;
  data?: BanAppeal | BanAppeal[];
  error?: string;
  validationErrors?: BanAppealValidationError[];
}

// Validation constants
export const MAX_BAN_APPEALS = 1000;
export const MIN_APPEAL_REASON_LENGTH = 20;
export const MAX_APPEAL_REASON_LENGTH = 1000;
export const MIN_REVIEW_NOTES_LENGTH = 10;
export const MAX_REVIEW_NOTES_LENGTH = 500;

/**
 * Validates ban appeal data
 */
export function validateBanAppeal(
  data: Partial<CreateBanAppealDTO>
): BanAppealValidationError[] {
  const errors: BanAppealValidationError[] = [];

  // Appeal reason validation
  if (!data.appealReason || data.appealReason.trim().length === 0) {
    errors.push({ field: "appealReason", message: "Appeal reason is required" });
  } else if (data.appealReason.trim().length < MIN_APPEAL_REASON_LENGTH) {
    errors.push({
      field: "appealReason",
      message: `Appeal reason must be at least ${MIN_APPEAL_REASON_LENGTH} characters`,
    });
  } else if (data.appealReason.trim().length > MAX_APPEAL_REASON_LENGTH) {
    errors.push({
      field: "appealReason",
      message: `Appeal reason must not exceed ${MAX_APPEAL_REASON_LENGTH} characters`,
    });
  }

  // Ban reason validation
  if (!data.banReason || data.banReason.trim().length === 0) {
    errors.push({ field: "banReason", message: "Ban reason is required" });
  }

  // Ban category validation
  if (!data.banCategory) {
    errors.push({ field: "banCategory", message: "Ban category is required" });
  } else if (!["normal", "medium", "danger", "severe"].includes(data.banCategory)) {
    errors.push({
      field: "banCategory",
      message: "Invalid ban category",
    });
  }

  return errors;
}

/**
 * Validates review notes
 */
export function validateReviewNotes(notes: string): BanAppealValidationError[] {
  const errors: BanAppealValidationError[] = [];

  if (notes && notes.trim().length > 0) {
    if (notes.trim().length < MIN_REVIEW_NOTES_LENGTH) {
      errors.push({
        field: "reviewNotes",
        message: `Review notes must be at least ${MIN_REVIEW_NOTES_LENGTH} characters`,
      });
    } else if (notes.trim().length > MAX_REVIEW_NOTES_LENGTH) {
      errors.push({
        field: "reviewNotes",
        message: `Review notes must not exceed ${MAX_REVIEW_NOTES_LENGTH} characters`,
      });
    }
  }

  return errors;
}

/**
 * Sanitize appeal reason to prevent XSS
 */
export function sanitizeAppealReason(reason: string): string {
  return reason
    .trim()
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>]/g, ""); // Remove angle brackets
}

/**
 * Get ban category color for UI
 */
export function getBanCategoryColor(category: string): string {
  switch (category) {
    case "normal":
      return "blue";
    case "medium":
      return "yellow";
    case "danger":
      return "orange";
    case "severe":
      return "red";
    default:
      return "gray";
  }
}

/**
 * Get ban category label
 */
export function getBanCategoryLabel(category: string): string {
  switch (category) {
    case "normal":
      return "Normal";
    case "medium":
      return "Medium";
    case "danger":
      return "Danger";
    case "severe":
      return "Severe";
    default:
      return "Unknown";
  }
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "yellow";
    case "accepted":
      return "green";
    case "rejected":
      return "red";
    default:
      return "gray";
  }
}

/**
 * Get status label
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pending Review";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    default:
      return "Unknown";
  }
}
