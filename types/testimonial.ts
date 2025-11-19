/**
 * Testimonial type definitions
 */

export interface Testimonial {
  id: string;
  quote: string; // testimonial text
  name: string; // person name
  title: string; // person's job title
  img?: string; // person's image URL (optional)
  order: number; // display order
  isActive: boolean; // whether to show on frontend
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTestimonialDTO {
  quote: string;
  name: string;
  title: string;
  img?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateTestimonialDTO {
  id: string;
  quote?: string;
  name?: string;
  title?: string;
  img?: string;
  order?: number;
  isActive?: boolean;
}

export interface TestimonialValidationError {
  field: string;
  message: string;
}

export interface TestimonialOperationResult {
  success: boolean;
  data?: Testimonial | Testimonial[];
  error?: string;
  validationErrors?: TestimonialValidationError[];
}

// Validation constants
export const MAX_TESTIMONIALS = 20;
export const MIN_QUOTE_LENGTH = 20;
export const MAX_QUOTE_LENGTH = 500;
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 50;
export const MIN_TITLE_LENGTH = 2;
export const MAX_TITLE_LENGTH = 100;

/**
 * Validate testimonial data
 */
export function validateTestimonial(
  data: Partial<CreateTestimonialDTO | UpdateTestimonialDTO>
): TestimonialValidationError[] {
  const errors: TestimonialValidationError[] = [];

  // Quote validation
  if (data.quote !== undefined) {
    if (!data.quote || !data.quote.trim()) {
      errors.push({ field: "quote", message: "Quote is required" });
    } else if (data.quote.trim().length < MIN_QUOTE_LENGTH) {
      errors.push({
        field: "quote",
        message: `Quote must be at least ${MIN_QUOTE_LENGTH} characters`,
      });
    } else if (data.quote.trim().length > MAX_QUOTE_LENGTH) {
      errors.push({
        field: "quote",
        message: `Quote must not exceed ${MAX_QUOTE_LENGTH} characters`,
      });
    }
  }

  // Name validation
  if (data.name !== undefined) {
    if (!data.name || !data.name.trim()) {
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
  }

  // Title validation
  if (data.title !== undefined) {
    if (!data.title || !data.title.trim()) {
      errors.push({ field: "title", message: "Title is required" });
    } else if (data.title.trim().length < MIN_TITLE_LENGTH) {
      errors.push({
        field: "title",
        message: `Title must be at least ${MIN_TITLE_LENGTH} characters`,
      });
    } else if (data.title.trim().length > MAX_TITLE_LENGTH) {
      errors.push({
        field: "title",
        message: `Title must not exceed ${MAX_TITLE_LENGTH} characters`,
      });
    }
  }

  // Company logo validation - REMOVED (deprecated field)
  // Logo is no longer required

  return errors;
}

/**
 * Converts Firestore document to Testimonial object
 */
export function firestoreToTestimonial(doc: any): Testimonial {
  const data = doc.data();
  return {
    id: doc.id,
    quote: data.quote || "",
    name: data.name || "",
    title: data.title || "",
    img: data.img || "",
    order: data.order || 0,
    isActive: data.isActive ?? true,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000) : (data.createdAt ? new Date(data.createdAt) : new Date())),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt?._seconds ? new Date(data.updatedAt._seconds * 1000) : (data.updatedAt ? new Date(data.updatedAt) : new Date())),
  };
}
