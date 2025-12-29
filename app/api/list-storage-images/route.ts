/**
 * API endpoint to list images from Firebase Storage
 * GET /api/list-storage-images?folder=<folder-name>
 */

import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebaseAdmin";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const folder = searchParams.get("folder");

    if (!folder) {
      return NextResponse.json(
        {
          success: false,
          error: "Folder parameter is required",
        },
        { status: 400 }
      );
    }

    const bucket = adminStorage.bucket();

    // List all files in the specified folder
    const [files] = await bucket.getFiles({
      prefix: `${folder}/`,
    });

    const imageUrls: string[] = [];

    for (const file of files) {
      const fileName = file.name;

      // Skip directory markers
      if (fileName === `${folder}/` || fileName.endsWith("/")) {
        continue;
      }

      // Only include image files
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(fileName);
      if (!isImage) {
        continue;
      }

      // Generate public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      imageUrls.push(publicUrl);
    }

    return NextResponse.json(
      {
        success: true,
        images: imageUrls,
        count: imageUrls.length,
        folder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error listing storage images:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to list storage images",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
