/**
 * Currently Working type definitions for the portfolio
 * Used for "The Inside Scoop" section showing current project/work
 */

export interface CurrentlyWorking {
  id: string;
  headingTitle: string; // Dynamic heading title (e.g., "Currently Working")
  title: string; // What you're currently working on (e.g., "Currently building a JS Animation library")
  description: string; // Short description for the card
  blogContent?: string; // Optional blog content for detailed explanation
  images?: string[]; // Array of image URLs for slideshow
  iconLists: string[]; // Array of technology icon URLs
  githubLink?: string; // GitHub repository link (optional)
  liveLink?: string; // Live demo/site link (optional)
  isActive: boolean; // Whether to show on frontend
  showBlogNotification: boolean; // Whether to show "Read Blog" badge on card
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCurrentlyWorkingDTO {
  headingTitle: string;
  title: string;
  description: string;
  blogContent?: string;
  images?: string[];
  iconLists: string[];
  githubLink?: string;
  liveLink?: string;
  isActive?: boolean;
  showBlogNotification?: boolean;
}

export interface UpdateCurrentlyWorkingDTO {
  id: string;
  headingTitle?: string;
  title?: string;
  description?: string;
  blogContent?: string;
  images?: string[];
  iconLists?: string[];
  githubLink?: string;
  liveLink?: string;
  isActive?: boolean;
  showBlogNotification?: boolean;
}

export interface CurrentlyWorkingValidationError {
  field: string;
  message: string;
}

export interface CurrentlyWorkingOperationResult {
  success: boolean;
  data?: CurrentlyWorking | CurrentlyWorking[];
  error?: string;
  validationErrors?: CurrentlyWorkingValidationError[];
}

// Validation constants
export const MIN_TITLE_LENGTH = 5;
export const MAX_TITLE_LENGTH = 100;
export const MIN_HEADING_LENGTH = 3;
export const MAX_HEADING_LENGTH = 50;
export const MIN_DESCRIPTION_LENGTH = 10;
export const MAX_DESCRIPTION_LENGTH = 300;
export const MAX_BLOG_CONTENT_LENGTH = 10000;
export const MAX_ICON_LISTS = 10;
export const MAX_IMAGES = 5;

/**
 * Validate currently working data
 */
export function validateCurrentlyWorking(
  data: CreateCurrentlyWorkingDTO | UpdateCurrentlyWorkingDTO
): CurrentlyWorkingValidationError[] {
  const errors: CurrentlyWorkingValidationError[] = [];

  // Validate heading title
  if ("headingTitle" in data && data.headingTitle !== undefined) {
    if (!data.headingTitle || data.headingTitle.trim().length === 0) {
      errors.push({ field: "headingTitle", message: "Heading title is required" });
    } else if (data.headingTitle.length < MIN_HEADING_LENGTH) {
      errors.push({
        field: "headingTitle",
        message: `Heading title must be at least ${MIN_HEADING_LENGTH} characters`,
      });
    } else if (data.headingTitle.length > MAX_HEADING_LENGTH) {
      errors.push({
        field: "headingTitle",
        message: `Heading title must not exceed ${MAX_HEADING_LENGTH} characters`,
      });
    }
  }

  // Validate title
  if ("title" in data && data.title !== undefined) {
    if (!data.title || data.title.trim().length === 0) {
      errors.push({ field: "title", message: "Title is required" });
    } else if (data.title.length < MIN_TITLE_LENGTH) {
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
  }

  // Validate description
  if ("description" in data && data.description !== undefined) {
    if (!data.description || data.description.trim().length === 0) {
      errors.push({ field: "description", message: "Description is required" });
    } else if (data.description.length < MIN_DESCRIPTION_LENGTH) {
      errors.push({
        field: "description",
        message: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`,
      });
    } else if (data.description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push({
        field: "description",
        message: `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
      });
    }
  }

  // Validate blog content (optional)
  if (data.blogContent && data.blogContent.length > MAX_BLOG_CONTENT_LENGTH) {
    errors.push({
      field: "blogContent",
      message: `Blog content must not exceed ${MAX_BLOG_CONTENT_LENGTH} characters`,
    });
  }

  // Validate icon lists
  if (data.iconLists) {
    if (!Array.isArray(data.iconLists)) {
      errors.push({
        field: "iconLists",
        message: "Icon lists must be an array",
      });
    } else if (data.iconLists.length === 0) {
      errors.push({
        field: "iconLists",
        message: "At least one technology icon is required",
      });
    } else if (data.iconLists.length > MAX_ICON_LISTS) {
      errors.push({
        field: "iconLists",
        message: `Maximum ${MAX_ICON_LISTS} icons allowed`,
      });
    } else {
      // Validate each icon URL
      data.iconLists.forEach((icon, index) => {
        if (!icon || icon.trim().length === 0) {
          errors.push({
            field: `iconLists[${index}]`,
            message: `Icon ${index + 1} URL cannot be empty`,
          });
        }
      });
    }
  }

  // Validate images (optional)
  if (data.images && data.images.length > MAX_IMAGES) {
    errors.push({
      field: "images",
      message: `Maximum ${MAX_IMAGES} images allowed`,
    });
  }

  // Validate URLs if provided
  if (data.githubLink && data.githubLink.trim().length > 0) {
    try {
      new URL(data.githubLink);
    } catch {
      errors.push({
        field: "githubLink",
        message: "GitHub link must be a valid URL",
      });
    }
  }

  if (data.liveLink && data.liveLink.trim().length > 0) {
    try {
      new URL(data.liveLink);
    } catch {
      errors.push({
        field: "liveLink",
        message: "Live link must be a valid URL",
      });
    }
  }

  return errors;
}

/**
 * Convert Firestore document to CurrentlyWorking object
 */
export function firestoreToCurrentlyWorking(doc: any): CurrentlyWorking {
  const data = doc.data();
  return {
    id: doc.id,
    headingTitle: data.headingTitle || "Currently Working",
    title: data.title || "",
    description: data.description || "",
    blogContent: data.blogContent || "",
    images: data.images || [],
    iconLists: data.iconLists || [],
    githubLink: data.githubLink || "",
    liveLink: data.liveLink || "",
    isActive: data.isActive ?? true,
    showBlogNotification: data.showBlogNotification ?? false,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000) : (data.createdAt ? new Date(data.createdAt) : new Date())),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt?._seconds ? new Date(data.updatedAt._seconds * 1000) : (data.updatedAt ? new Date(data.updatedAt) : new Date())),
  };
}
