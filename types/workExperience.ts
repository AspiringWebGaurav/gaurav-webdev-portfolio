/**
 * Work Experience type definitions for the portfolio
 * Supports up to 10 work experience entries with comprehensive validation
 */

export interface WorkExperience {
  id: string;
  title: string;
  desc: string; // description
  thumbnail: string; // icon/image URL
  company?: string; // optional company name
  duration?: string; // optional duration like "2020 - 2021"
  location?: string; // optional location
  order: number; // display order (1-10)
  isActive: boolean; // whether to show on frontend
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkExperienceDTO {
  title: string;
  desc: string;
  thumbnail: string;
  company?: string;
  duration?: string;
  location?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateWorkExperienceDTO {
  id: string;
  title?: string;
  desc?: string;
  thumbnail?: string;
  company?: string;
  duration?: string;
  location?: string;
  order?: number;
  isActive?: boolean;
}

export interface WorkExperienceValidationError {
  field: string;
  message: string;
}

export interface WorkExperienceOperationResult {
  success: boolean;
  data?: WorkExperience | WorkExperience[];
  error?: string;
  validationErrors?: WorkExperienceValidationError[];
}

// Validation constants
export const MAX_WORK_EXPERIENCES = 10;
export const MIN_TITLE_LENGTH = 3;
export const MAX_TITLE_LENGTH = 150;
export const MIN_DESC_LENGTH = 10;
export const MAX_DESC_LENGTH = 500;

/**
 * Validate work experience data
 */
export function validateWorkExperience(
  data: CreateWorkExperienceDTO | UpdateWorkExperienceDTO
): WorkExperienceValidationError[] {
  const errors: WorkExperienceValidationError[] = [];

  // Title validation (required for create, optional for update)
  if ("title" in data && data.title !== undefined) {
    if (!data.title || data.title.trim().length === 0) {
      errors.push({
        field: "title",
        message: "Title is required",
      });
    } else if (data.title.trim().length < MIN_TITLE_LENGTH) {
      errors.push({
        field: "title",
        message: `Title must be at least ${MIN_TITLE_LENGTH} characters`,
      });
    } else if (data.title.length > MAX_TITLE_LENGTH) {
      errors.push({
        field: "title",
        message: `Title must not exceed ${MAX_TITLE_LENGTH} characters`,
      });
    }
  } else if (!("id" in data)) {
    // Creating new experience, title is required
    errors.push({
      field: "title",
      message: "Title is required",
    });
  }

  // Description validation (required for create, optional for update)
  if ("desc" in data && data.desc !== undefined) {
    if (!data.desc || data.desc.trim().length === 0) {
      errors.push({
        field: "desc",
        message: "Description is required",
      });
    } else if (data.desc.trim().length < MIN_DESC_LENGTH) {
      errors.push({
        field: "desc",
        message: `Description must be at least ${MIN_DESC_LENGTH} characters`,
      });
    } else if (data.desc.length > MAX_DESC_LENGTH) {
      errors.push({
        field: "desc",
        message: `Description must not exceed ${MAX_DESC_LENGTH} characters`,
      });
    }
  } else if (!("id" in data)) {
    errors.push({
      field: "desc",
      message: "Description is required",
    });
  }

  // Thumbnail validation (required for create, optional for update)
  if ("thumbnail" in data && data.thumbnail !== undefined) {
    if (!data.thumbnail || data.thumbnail.trim().length === 0) {
      errors.push({
        field: "thumbnail",
        message: "Thumbnail/icon is required",
      });
    } else if (!data.thumbnail.match(/^(https?:\/\/|\/|data:image\/)/)) {
      errors.push({
        field: "thumbnail",
        message: "Thumbnail must be a valid URL or data URI",
      });
    }
  } else if (!("id" in data)) {
    errors.push({
      field: "thumbnail",
      message: "Thumbnail/icon is required",
    });
  }

  // Order validation (optional)
  if (data.order !== undefined) {
    if (data.order < 1 || data.order > MAX_WORK_EXPERIENCES) {
      errors.push({
        field: "order",
        message: `Order must be between 1 and ${MAX_WORK_EXPERIENCES}`,
      });
    }
  }

  // Optional fields validation
  if (data.company && data.company.length > 100) {
    errors.push({
      field: "company",
      message: "Company name must not exceed 100 characters",
    });
  }

  if (data.duration && data.duration.length > 50) {
    errors.push({
      field: "duration",
      message: "Duration must not exceed 50 characters",
    });
  }

  if (data.location && data.location.length > 100) {
    errors.push({
      field: "location",
      message: "Location must not exceed 100 characters",
    });
  }

  return errors;
}

/**
 * Convert Firestore document to WorkExperience object
 */
export function firestoreToWorkExperience(doc: any): WorkExperience {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    desc: data.desc,
    thumbnail: data.thumbnail,
    company: data.company,
    duration: data.duration,
    location: data.location,
    order: data.order,
    isActive: data.isActive ?? true,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000) : (data.createdAt ? new Date(data.createdAt) : new Date())),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt?._seconds ? new Date(data.updatedAt._seconds * 1000) : (data.updatedAt ? new Date(data.updatedAt) : new Date())),
  };
}

/**
 * Prepare work experience data for Firestore
 */
export function prepareWorkExperienceForFirestore(
  data: CreateWorkExperienceDTO | UpdateWorkExperienceDTO
): any {
  const prepared: any = {};

  if ("title" in data && data.title !== undefined)
    prepared.title = data.title.trim();
  if ("desc" in data && data.desc !== undefined)
    prepared.desc = data.desc.trim();
  if ("thumbnail" in data && data.thumbnail !== undefined)
    prepared.thumbnail = data.thumbnail.trim();
  if ("company" in data && data.company !== undefined)
    prepared.company = data.company.trim();
  if ("duration" in data && data.duration !== undefined)
    prepared.duration = data.duration.trim();
  if ("location" in data && data.location !== undefined)
    prepared.location = data.location.trim();
  if ("order" in data && data.order !== undefined) prepared.order = data.order;
  if ("isActive" in data && data.isActive !== undefined)
    prepared.isActive = data.isActive;

  return prepared;
}
