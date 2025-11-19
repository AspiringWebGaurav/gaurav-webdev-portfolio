/**
 * Image Upload API Route
 * Handles uploading images from local files, URLs, or direct links
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadImageToStorage, validateImageUrl } from "@/lib/imageUpload";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let file: File | null = null;
    let url: string | null = null;
    let base64: string | null = null;
    let folder = "images";

    // Support both JSON and FormData
    if (contentType.includes("application/json")) {
      const body = await request.json();
      url = body.url || null;
      base64 = body.base64 || body.image || null;
      folder = body.folder || "images";
    } else {
      const formData = await request.formData();
      file = formData.get("file") as File | null;
      url = formData.get("url") as string | null;
      base64 = formData.get("base64") as string | null;
      folder = (formData.get("folder") as string) || "images";
    }

    // Validate folder - allow testimonials subfolder paths
    const validFolders = ["images", "icons", "testimonials/avatars", "currently-working"];
    if (!validFolders.includes(folder)) {
      return NextResponse.json(
        { success: false, error: "Invalid folder specified" },
        { status: 400 }
      );
    }

    let source: File | string;

    // Determine source type
    if (file) {
      // Local file upload
      source = file;
    } else if (url) {
      // URL upload
      const isValid = await validateImageUrl(url);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Invalid or inaccessible image URL" },
          { status: 400 }
        );
      }
      source = url;
    } else if (base64) {
      // Base64 upload
      source = base64;
    } else {
      return NextResponse.json(
        { success: false, error: "No image source provided" },
        { status: 400 }
      );
    }

    // Upload to Storage
    const result = await uploadImageToStorage(source, {
      folder: folder as "images" | "icons",
      circular: folder === "icons",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      message: "Image uploaded successfully",
    });
  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload image",
      },
      { status: 500 }
    );
  }
}
