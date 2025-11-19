/**
 * Project type definitions for the portfolio
 * Supports up to 10 projects with comprehensive validation
 */

export interface Project {
  id: string;
  title: string;
  des: string; // description
  img: string; // image URL (deprecated - use images array)
  images?: string[]; // array of image URLs for slideshow
  iconLists: string[]; // array of technology icon URLs
  link: string; // project link
  order: number; // display order (1-10)
  isActive: boolean; // whether to show on frontend
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDTO {
  title: string;
  des: string;
  img: string;
  images?: string[]; // multiple images for slideshow
  iconLists: string[];
  link: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateProjectDTO {
  id: string;
  title?: string;
  des?: string;
  img?: string;
  images?: string[]; // multiple images for slideshow
  iconLists?: string[];
  link?: string;
  order?: number;
  isActive?: boolean;
}

export interface ProjectValidationError {
  field: string;
  message: string;
}

export interface ProjectOperationResult {
  success: boolean;
  data?: Project | Project[];
  error?: string;
  validationErrors?: ProjectValidationError[];
}

// Constants
export const MAX_PROJECTS = 10;
export const MIN_TITLE_LENGTH = 3;
export const MAX_TITLE_LENGTH = 100;
export const MIN_DESCRIPTION_LENGTH = 10;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_ICON_LISTS = 10;
export const ODD_PROJECT_WARNING_COUNT = 7; // Warn when reaching odd number that breaks 2x2 grid

/**
 * Validates project data before save
 */
export function validateProject(
  project: CreateProjectDTO | UpdateProjectDTO
): ProjectValidationError[] {
  const errors: ProjectValidationError[] = [];

  // Title validation
  if ("title" in project && project.title !== undefined) {
    const title = project.title.trim();
    if (!title) {
      errors.push({ field: "title", message: "Title is required" });
    } else if (title.length < MIN_TITLE_LENGTH) {
      errors.push({
        field: "title",
        message: `Title must be at least ${MIN_TITLE_LENGTH} characters`,
      });
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.push({
        field: "title",
        message: `Title must not exceed ${MAX_TITLE_LENGTH} characters`,
      });
    }
  }

  // Description validation
  if ("des" in project && project.des !== undefined) {
    const des = project.des.trim();
    if (!des) {
      errors.push({ field: "des", message: "Description is required" });
    } else if (des.length < MIN_DESCRIPTION_LENGTH) {
      errors.push({
        field: "des",
        message: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`,
      });
    } else if (des.length > MAX_DESCRIPTION_LENGTH) {
      errors.push({
        field: "des",
        message: `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
      });
    }
  }

  // Image URL validation
  if ("img" in project && project.img !== undefined) {
    const img = project.img.trim();
    if (!img) {
      errors.push({ field: "img", message: "Image URL is required" });
    } else if (!isValidUrl(img)) {
      errors.push({ field: "img", message: "Invalid image URL format" });
    }
  }

  // Link validation
  if ("link" in project && project.link !== undefined) {
    const link = project.link.trim();
    if (!link) {
      errors.push({ field: "link", message: "Project link is required" });
    } else if (!isValidUrl(link)) {
      errors.push({ field: "link", message: "Invalid link URL format" });
    }
  }

  // Icon lists validation
  if ("iconLists" in project && project.iconLists !== undefined) {
    if (!Array.isArray(project.iconLists)) {
      errors.push({
        field: "iconLists",
        message: "Icon lists must be an array",
      });
    } else if (project.iconLists.length === 0) {
      errors.push({
        field: "iconLists",
        message: "At least one technology icon is required",
      });
    } else if (project.iconLists.length > MAX_ICON_LISTS) {
      errors.push({
        field: "iconLists",
        message: `Maximum ${MAX_ICON_LISTS} technology icons allowed`,
      });
    } else {
      // Validate each icon URL
      project.iconLists.forEach((icon, index) => {
        if (!icon.trim()) {
          errors.push({
            field: `iconLists[${index}]`,
            message: `Icon ${index + 1} URL is empty`,
          });
        } else if (!isValidUrl(icon)) {
          errors.push({
            field: `iconLists[${index}]`,
            message: `Icon ${index + 1} has invalid URL format`,
          });
        }
      });
    }
  }

  // Order validation
  if ("order" in project && project.order !== undefined) {
    const order = project.order;
    if (!Number.isInteger(order) || order < 1 || order > MAX_PROJECTS) {
      errors.push({
        field: "order",
        message: `Order must be an integer between 1 and ${MAX_PROJECTS}`,
      });
    }
  }

  return errors;
}

/**
 * Simple URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    // Allow relative URLs starting with /
    if (url.startsWith("/")) {
      return true;
    }
    // For absolute URLs, use URL constructor
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if adding another project would result in asymmetric display
 */
export function shouldWarnAsymmetric(currentCount: number): {
  shouldWarn: boolean;
  message?: string;
} {
  const newCount = currentCount + 1;

  // Warn when reaching odd numbers (except 1, 3, 5, 9 which can still look good)
  // But specifically warn at 7 as requested
  if (newCount === ODD_PROJECT_WARNING_COUNT) {
    return {
      shouldWarn: true,
      message: `Adding project #${newCount} will create an asymmetric layout (not in 2x2 pairs). Consider adding one more to reach ${
        newCount + 1
      } projects for symmetry.`,
    };
  }

  // Also warn for other odd numbers that break the 2-column grid
  if (newCount > 2 && newCount % 2 !== 0 && newCount !== 3 && newCount !== 5) {
    return {
      shouldWarn: true,
      message: `Adding project #${newCount} will create an asymmetric layout. Consider adding one more for better visual symmetry.`,
    };
  }

  return { shouldWarn: false };
}

/**
 * Converts Firestore document to Project object
 */
export function firestoreToProject(doc: any): Project {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title || "",
    des: data.des || "",
    img: data.img || "",
    images: data.images || [], // Support multiple images for slideshow
    iconLists: data.iconLists || [],
    link: data.link || "",
    order: data.order || 0,
    isActive: data.isActive ?? true,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000) : (data.createdAt ? new Date(data.createdAt) : new Date())),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt?._seconds ? new Date(data.updatedAt._seconds * 1000) : (data.updatedAt ? new Date(data.updatedAt) : new Date())),
  };
}
