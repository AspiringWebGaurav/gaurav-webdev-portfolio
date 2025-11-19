/**
 * Delete Image API Route
 * Handles deletion of images from Firebase Storage
 */

import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebaseAdmin";

export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Only delete if it's a Firebase Storage URL
    if (
      !url.includes("storage.googleapis.com") &&
      !url.includes("firebasestorage")
    ) {
      return NextResponse.json({
        success: true,
        message: "Not a Storage URL, skipped deletion",
      });
    }

    try {
      // Extract file path from URL
      // Format: https://storage.googleapis.com/bucket-name/projects/folder/filename
      const urlParts = url.split("/");
      const bucketIndex = urlParts.findIndex((part) =>
        part.includes("googleapis.com")
      );

      if (bucketIndex === -1) {
        throw new Error("Invalid Storage URL format");
      }

      // Get the path after bucket name
      const filePath = urlParts.slice(bucketIndex + 2).join("/");

      if (!filePath) {
        throw new Error("Could not extract file path from URL");
      }

      // Delete from Storage
      const bucket = adminStorage.bucket();
      const file = bucket.file(filePath);

      // Check if file exists
      const [exists] = await file.exists();

      if (!exists) {
        console.warn(`File not found in Storage: ${filePath}`);
        return NextResponse.json({
          success: true,
          message: "File not found (may have been already deleted)",
        });
      }

      // Delete the file
      await file.delete();

      console.log(`✅ Deleted from Storage: ${filePath}`);

      return NextResponse.json({
        success: true,
        message: "Image deleted successfully",
        deletedPath: filePath,
      });
    } catch (storageError: any) {
      console.error("Storage deletion error:", storageError);

      // Don't fail the whole request if file is not found
      if (storageError.code === 404) {
        return NextResponse.json({
          success: true,
          message: "File not found in Storage",
        });
      }

      throw storageError;
    }
  } catch (error: any) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete image",
      },
      { status: 500 }
    );
  }
}
