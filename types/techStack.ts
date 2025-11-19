/**
 * Tech Stack type definitions for the portfolio
 * Used for "My tech stack" section in Grid
 */

export interface TechStack {
  id: string;
  name: string; // Technology name (e.g., "VueJS", "Express", "TypeScript")
  order: number; // display order
  isActive: boolean; // whether to show on frontend
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTechStackDTO {
  name: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateTechStackDTO {
  id: string;
  name?: string;
  order?: number;
  isActive?: boolean;
}

export interface TechStackValidationError {
  field: string;
  message: string;
}

export interface TechStackOperationResult {
  success: boolean;
  data?: TechStack | TechStack[];
  error?: string;
  validationErrors?: TechStackValidationError[];
}

// Validation constants
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 30;
export const MAX_TECH_STACKS = 20;

/**
 * Validate tech stack data
 */
export function validateTechStack(
  data: CreateTechStackDTO | UpdateTechStackDTO
): TechStackValidationError[] {
  const errors: TechStackValidationError[] = [];

  // Validate name
  if ("name" in data && data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push({ field: "name", message: "Name is required" });
    } else if (data.name.length < MIN_NAME_LENGTH) {
      errors.push({
        field: "name",
        message: `Name must be at least ${MIN_NAME_LENGTH} characters`,
      });
    } else if (data.name.length > MAX_NAME_LENGTH) {
      errors.push({
        field: "name",
        message: `Name must not exceed ${MAX_NAME_LENGTH} characters`,
      });
    }
  }

  return errors;
}

/**
 * Convert Firestore document to TechStack object
 * Handles both Firestore Timestamps and ISO date strings
 */
export function firestoreToTechStack(doc: any): TechStack {
  const data = doc.data();
  
  // Helper to convert various date formats to Date object
  const toDate = (value: any): Date => {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (typeof value === 'string') return new Date(value);
    if (value.toDate && typeof value.toDate === 'function') return value.toDate();
    if (value.seconds) return new Date(value.seconds * 1000); // Firestore Timestamp
    return new Date();
  };
  
  return {
    id: doc.id,
    name: data.name || "",
    order: data.order ?? 0,
    isActive: data.isActive ?? true,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}
