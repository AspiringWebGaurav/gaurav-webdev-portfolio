/**
 * Image Sync Utility for Admin Components
 * Handles syncing images between Firebase Storage and Firestore
 * Provides CRUD operations for image management across all admin panels
 */

export interface ImageSyncOptions {
  folder: string; // Firebase Storage folder (e.g., "currently-working", "projects/images")
  existingImages?: string[]; // Currently stored images in Firestore
}

export interface ImageSyncResult {
  success: boolean;
  storageImages: string[];
  orphanedImages: string[];
  error?: string;
}

export interface ImageCleanupResult {
  success: boolean;
  deletedCount: number;
  errors: string[];
}

/**
 * Fetch all images from Firebase Storage folder
 */
export async function fetchStorageImages(
  folder: string
): Promise<{ success: boolean; images: string[]; error?: string }> {
  try {
    const response = await fetch(`/api/list-storage-images?folder=${encodeURIComponent(folder)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        images: [],
        error: errorData.error || "Failed to fetch storage images",
      };
    }

    const data = await response.json();
    return {
      success: true,
      images: data.images || [],
    };
  } catch (error) {
    console.error("Error fetching storage images:", error);
    return {
      success: false,
      images: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sync images from Firebase Storage with Firestore
 * Returns all images in storage and identifies orphaned images
 */
export async function syncImagesWithCloud(
  options: ImageSyncOptions
): Promise<ImageSyncResult> {
  try {
    const { folder, existingImages = [] } = options;

    // Fetch images from storage
    const storageResult = await fetchStorageImages(folder);

    if (!storageResult.success) {
      return {
        success: false,
        storageImages: [],
        orphanedImages: [],
        error: storageResult.error,
      };
    }

    const storageImages = storageResult.images;

    // Find orphaned images (in storage but not in Firestore)
    const orphanedImages = storageImages.filter(
      (storageUrl) => !existingImages.includes(storageUrl)
    );

    return {
      success: true,
      storageImages,
      orphanedImages,
    };
  } catch (error) {
    console.error("Error syncing images:", error);
    return {
      success: false,
      storageImages: [],
      orphanedImages: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete multiple images from Firebase Storage
 */
export async function deleteMultipleImages(
  imageUrls: string[]
): Promise<ImageCleanupResult> {
  const errors: string[] = [];
  let deletedCount = 0;

  for (const imageUrl of imageUrls) {
    try {
      const response = await fetch("/api/delete-image", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await response.json();

      if (data.success) {
        deletedCount++;
      } else {
        errors.push(`Failed to delete ${imageUrl}: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      errors.push(
        `Error deleting ${imageUrl}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  return {
    success: errors.length === 0,
    deletedCount,
    errors,
  };
}

/**
 * Validate if an image exists and is accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get image details from URL
 */
export function getImageDetails(url: string): {
  isStorage: boolean;
  folder?: string;
  filename?: string;
} {
  if (!url.includes("storage.googleapis.com")) {
    return { isStorage: false };
  }

  try {
    // Extract folder and filename from Storage URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const filename = pathParts[pathParts.length - 1];
    const folder = pathParts.slice(2, -1).join("/"); // Remove bucket name and filename

    return {
      isStorage: true,
      folder,
      filename,
    };
  } catch (error) {
    return { isStorage: false };
  }
}
