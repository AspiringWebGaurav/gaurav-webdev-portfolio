import { NextRequest, NextResponse } from "next/server";
import { TALK_COOKIE_NAME } from "@/lib/talk/constants";
import { verifyTalkSession } from "@/lib/talk/session";
import {
  listVaultFiles,
  uploadVaultFile,
  deleteVaultFile,
} from "@/lib/talk/services/talk-data.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(TALK_COOKIE_NAME)?.value;
  const session = await verifyTalkSession(token);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const files = await listVaultFiles();
    return NextResponse.json({ success: true, files });
  } catch (err) {
    console.error("[TalkFilesAPI] GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to list files" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(TALK_COOKIE_NAME)?.value;
  const session = await verifyTalkSession(token);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    // Accept multiple files from 'files' or 'file' keys
    const rawFiles = [
      ...formData.getAll("files"),
      ...formData.getAll("file"),
    ];

    const files = rawFiles.filter(
      (item): item is File => item instanceof File && item.size > 0
    );

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: "No files provided" }, { status: 400 });
    }

    // Process all files in parallel without arbitrary size restriction
    const uploadPromises = files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = file.name || `upload_${Date.now()}`;
      const mimeType = file.type || "application/octet-stream";

      return await uploadVaultFile(buffer, fileName, mimeType);
    });

    const results = await Promise.allSettled(uploadPromises);
    const uploadedFiles = [];
    const errors: string[] = [];

    for (const res of results) {
      if (res.status === "fulfilled") {
        uploadedFiles.push(res.value);
      } else {
        errors.push(res.reason?.message || "File upload failed");
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: errors[0] || "Upload failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      file: uploadedFiles[0], // backward compatibility
      totalUploaded: uploadedFiles.length,
    });
  } catch (err) {
    console.error("[TalkFilesAPI] POST upload error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to upload files to Firebase Storage" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(TALK_COOKIE_NAME)?.value;
  const session = await verifyTalkSession(token);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing file ID" }, { status: 400 });
    }

    await deleteVaultFile(id);
    return NextResponse.json({ success: true, message: "File deleted successfully" });
  } catch (err) {
    console.error("[TalkFilesAPI] DELETE error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete file" }, { status: 500 });
  }
}
