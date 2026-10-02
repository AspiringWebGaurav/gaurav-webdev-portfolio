import { NextRequest, NextResponse } from "next/server";
import { TALK_COOKIE_NAME } from "@/lib/talk/constants";
import { verifyTalkSession } from "@/lib/talk/session";
import {
  listTalkMessages,
  createTalkMessage,
  deleteTalkMessage,
  clearAllTalkMessages,
} from "@/lib/talk/services/talk-data.service";
import type { TalkMessageTag } from "@/types/talk";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(TALK_COOKIE_NAME)?.value;
  const session = await verifyTalkSession(token);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const messages = await listTalkMessages();
    return NextResponse.json({ success: true, messages });
  } catch (err) {
    console.error("[TalkMessagesAPI] GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to list messages" }, { status: 500 });
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
    if (!body || typeof body.text !== "string" || !body.text.trim()) {
      return NextResponse.json({ success: false, error: "Message text is required" }, { status: 400 });
    }

    const tag: TalkMessageTag = ["general", "urgent", "link", "idea", "secret"].includes(body.tag)
      ? body.tag
      : "general";

    const message = await createTalkMessage(body.text, tag);
    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error("[TalkMessagesAPI] POST error:", err);
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
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
    const clearAll = url.searchParams.get("clearAll") === "true";
    const id = url.searchParams.get("id");

    if (clearAll) {
      await clearAllTalkMessages();
      return NextResponse.json({ success: true, message: "All messages cleared" });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing message ID" }, { status: 400 });
    }

    await deleteTalkMessage(id);
    return NextResponse.json({ success: true, message: "Message deleted" });
  } catch (err) {
    console.error("[TalkMessagesAPI] DELETE error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete message" }, { status: 500 });
  }
}
