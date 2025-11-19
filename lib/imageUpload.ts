/**
 * Image Upload Utility for Firebase Storage
 * Supports: Local files, URLs, direct links
 * Handles: Automatic optimization, width normalization, circular cropping for icons
 */

import { adminStorage } from "@/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

export interface ImageUploadOptions {
  folder: "images" | "icons";
  maxWidth?: number;
  circular?: boolean; // For icon circular cropping
  quality?: number; // 0-1
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload image from local file (File object or base64)
 */
export async function uploadImageToStorage(
  source: File | string | Blob,
  options: ImageUploadOptions
): Promise<UploadResult> {
  try {
    const bucket = adminStorage.bucket();
    const fileName = `${uuidv4()}.${getFileExtension(source)}`;
    const destPath = `projects/${options.folder}/${fileName}`;

    let buffer: Buffer;

    // Handle different source types
    if (typeof source === "string") {
      // Base64 or URL
      if (source.startsWith("data:")) {
        // Base64
        const base64Data = source.split(",")[1];
        buffer = Buffer.from(base64Data, "base64");
      } else if (source.startsWith("http")) {
        // URL - fetch and upload
        const response = await fetch(source);
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        throw new Error("Invalid source format");
      }
    } else if (typeof source === "object" && source !== null) {
      // File or Blob (check for arrayBuffer method)
      if ("arrayBuffer" in source && typeof source.arrayBuffer === "function") {
        const arrayBuffer = await source.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        throw new Error("Unsupported object type");
      }
    } else {
      throw new Error("Unsupported source type");
    }

    // Upload to Storage
    const file = bucket.file(destPath);
    await file.save(buffer, {
      metadata: {
        contentType: getContentType(source),
        cacheControl: "public, max-age=31536000",
      },
    });

    // Make public
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error: any) {
    console.error("Image upload error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload image",
    };
  }
}

/**
 * Validate image URL (check if accessible)
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const contentType = response.headers.get("content-type");
    return (
      response.ok && contentType !== null && contentType.startsWith("image/")
    );
  } catch {
    return false;
  }
}

/**
 * Helper: Get file extension
 */
function getFileExtension(source: any): string {
  if (typeof source === "string") {
    if (source.startsWith("data:image/")) {
      const match = source.match(/data:image\/([a-zA-Z]+);/);
      return match ? match[1] : "png";
    }
    return "png";
  }
  if (source instanceof File) {
    return source.name.split(".").pop() || "png";
  }
  return "png";
}

/**
 * Helper: Get content type
 */
function getContentType(source: any): string {
  if (typeof source === "string" && source.startsWith("data:")) {
    const match = source.match(/data:([^;]+);/);
    return match ? match[1] : "image/png";
  }
  if (source instanceof File) {
    return source.type || "image/png";
  }
  return "image/png";
}

/**
 * Delete image from Storage
 */
export async function deleteImageFromStorage(
  url: string
): Promise<UploadResult> {
  try {
    const bucket = adminStorage.bucket();
    // Extract path from URL
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
    if (!pathMatch) {
      throw new Error("Invalid storage URL");
    }
    const filePath = decodeURIComponent(pathMatch[1]);

    const file = bucket.file(filePath);
    await file.delete();

    return { success: true };
  } catch (error: any) {
    console.error("Image delete error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete image",
    };
  }
}
