import { NextRequest, NextResponse } from "next/server";
import { TALK_COOKIE_NAME } from "@/lib/talk/constants";
import { verifyTalkSession } from "@/lib/talk/session";
import {
  getTalkNotepad,
  saveTalkNotepad,
  clearTalkNotepad,
} from "@/lib/talk/services/talk-data.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(TALK_COOKIE_NAME)?.value;
  const session = await verifyTalkSession(token);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notepad = await getTalkNotepad();
    return NextResponse.json({ success: true, notepad });
  } catch (err) {
    console.error("[TalkNotepadAPI] GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to load notepad" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(TALK_COOKIE_NAME)?.value;
  const session = await verifyTalkSession(token);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.content !== "string") {
      return NextResponse.json({ success: false, error: "Invalid content payload" }, { status: 400 });
    }

    const notepad = await saveTalkNotepad(body.content);
    return NextResponse.json({ success: true, notepad });
  } catch (err) {
    console.error("[TalkNotepadAPI] POST error:", err);
    return NextResponse.json({ success: false, error: "Failed to save notepad" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(TALK_COOKIE_NAME)?.value;
  const session = await verifyTalkSession(token);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notepad = await clearTalkNotepad();
    return NextResponse.json({ success: true, notepad, message: "Notepad wiped from backend" });
  } catch (err) {
    console.error("[TalkNotepadAPI] DELETE error:", err);
    return NextResponse.json({ success: false, error: "Failed to wipe notepad" }, { status: 500 });
  }
}
