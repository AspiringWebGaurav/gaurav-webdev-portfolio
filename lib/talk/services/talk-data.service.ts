import { getAdminFirestore } from "@/lib/admin/firebase-admin";
import { storageDataSource } from "@/lib/dal/datasource/storage";
import { TALK_COLLECTIONS } from "../constants";
import type {
  TalkNotepad,
  TalkVaultFile,
  TalkMessage,
  TalkMessageTag,
} from "@/types/talk";

// In-memory fallbacks if Firestore is in offline mode or during cold setup
let inMemoryNotepad: TalkNotepad = {
  id: "main",
  content: "",
  lastModifiedAt: Date.now(),
  charCount: 0,
  wordCount: 0,
};

let inMemoryFiles: TalkVaultFile[] = [];
let inMemoryMessages: TalkMessage[] = [];

// ==========================================
// 1. NOTEPAD SERVICES
// ==========================================

export async function getTalkNotepad(): Promise<TalkNotepad> {
  const db = getAdminFirestore();
  if (!db) return inMemoryNotepad;

  try {
    const docRef = db.collection(TALK_COLLECTIONS.NOTEPAD).doc("main");
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data() as TalkNotepad;
      inMemoryNotepad = data;
      return data;
    }
    // Create initial notepad document
    await docRef.set(inMemoryNotepad);
    return inMemoryNotepad;
  } catch (err) {
    console.error("[TalkData] getTalkNotepad error:", err);
    return inMemoryNotepad;
  }
}

export async function saveTalkNotepad(content: string): Promise<TalkNotepad> {
  const trimmed = typeof content === "string" ? content : "";
  const charCount = trimmed.length;
  const wordCount = trimmed.trim() ? trimmed.trim().split(/\s+/).length : 0;
  const now = Date.now();

  const record: TalkNotepad = {
    id: "main",
    content: trimmed,
    lastModifiedAt: now,
    charCount,
    wordCount,
  };

  inMemoryNotepad = record;

  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection(TALK_COLLECTIONS.NOTEPAD).doc("main").set(record, { merge: true });
    } catch (err) {
      console.error("[TalkData] saveTalkNotepad error:", err);
    }
  }

  return record;
}

export async function clearTalkNotepad(): Promise<TalkNotepad> {
  const emptyRecord: TalkNotepad = {
    id: "main",
    content: "",
    lastModifiedAt: Date.now(),
    charCount: 0,
    wordCount: 0,
  };

  inMemoryNotepad = emptyRecord;

  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection(TALK_COLLECTIONS.NOTEPAD).doc("main").set(emptyRecord);
    } catch (err) {
      console.error("[TalkData] clearTalkNotepad error:", err);
    }
  }

  return emptyRecord;
}

// ==========================================
// 2. FILE VAULT SERVICES (Firebase Storage)
// ==========================================

export async function uploadVaultFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<TalkVaultFile> {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const fileId = `file_${timestamp}_${Math.random().toString(36).substring(2, 8)}`;
  const storagePath = `talk_vault/${timestamp}_${safeName}`;

  // 1. Upload file buffer to Firebase Storage bucket
  const uploadResult = await storageDataSource.uploadBuffer(storagePath, buffer, {
    contentType: mimeType || "application/octet-stream",
    isPublic: true,
    metadata: {
      originalName,
      uploadedBy: "Gaurav Patil",
      uploadedAt: new Date(timestamp).toISOString(),
    },
  });

  const fileRecord: TalkVaultFile = {
    id: fileId,
    fileName: safeName,
    originalName,
    storagePath: uploadResult.storagePath,
    downloadUrl: uploadResult.publicUrl,
    sizeBytes: uploadResult.sizeBytes,
    mimeType: uploadResult.mimeType,
    uploadedAt: timestamp,
  };

  // 2. Persist record in Firestore
  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection(TALK_COLLECTIONS.FILES).doc(fileId).set(fileRecord);
    } catch (err) {
      console.error("[TalkData] uploadVaultFile DB error:", err);
    }
  }

  inMemoryFiles.unshift(fileRecord);
  return fileRecord;
}

export async function listVaultFiles(): Promise<TalkVaultFile[]> {
  const db = getAdminFirestore();
  if (!db) {
    return inMemoryFiles;
  }

  try {
    const snap = await db
      .collection(TALK_COLLECTIONS.FILES)
      .orderBy("uploadedAt", "desc")
      .limit(100)
      .get();

    if (!snap.empty) {
      const files = snap.docs.map((doc) => doc.data() as TalkVaultFile);
      inMemoryFiles = files;
      return files;
    }
    inMemoryFiles = [];
    return [];
  } catch (err) {
    console.error("[TalkData] listVaultFiles error:", err);
    return inMemoryFiles;
  }
}

export async function deleteVaultFile(fileId: string): Promise<boolean> {
  const db = getAdminFirestore();
  let fileRecord: TalkVaultFile | undefined = inMemoryFiles.find((f) => f.id === fileId);

  if (db) {
    try {
      const docRef = db.collection(TALK_COLLECTIONS.FILES).doc(fileId);
      const snap = await docRef.get();
      if (snap.exists) {
        fileRecord = snap.data() as TalkVaultFile;
      }
      await docRef.delete();
    } catch (err) {
      console.error("[TalkData] deleteVaultFile DB error:", err);
    }
  }

  // Remove from in-memory cache immediately
  inMemoryFiles = inMemoryFiles.filter((f) => f.id !== fileId);

  // Delete physical file from Firebase Storage bucket across all candidate paths
  const pathsToTry = new Set<string>();
  if (fileRecord?.storagePath) {
    pathsToTry.add(fileRecord.storagePath.replace(/^\/+/, ""));
  }
  if (fileRecord?.downloadUrl) {
    try {
      const parsed = new URL(fileRecord.downloadUrl);
      const match = parsed.pathname.match(/\/o\/(.+)$/);
      if (match && match[1]) {
        pathsToTry.add(decodeURIComponent(match[1]).replace(/^\/+/, ""));
      }
    } catch {}
  }
  if (fileRecord?.fileName) {
    pathsToTry.add(`talk_vault/${fileRecord.fileName}`);
  }

  for (const path of pathsToTry) {
    try {
      await storageDataSource.deleteFile(path);
    } catch (err) {
      console.warn(`[TalkData] deleteVaultFile Storage attempt for "${path}":`, err);
    }
  }

  return true;
}

// ==========================================
// 3. "TALK TO ME" MESSAGES FEED
// ==========================================

export async function listTalkMessages(): Promise<TalkMessage[]> {
  const db = getAdminFirestore();
  if (!db) {
    return inMemoryMessages;
  }

  try {
    const snap = await db
      .collection(TALK_COLLECTIONS.MESSAGES)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    if (!snap.empty) {
      const msgs = snap.docs.map((doc) => doc.data() as TalkMessage);
      inMemoryMessages = msgs;
      return msgs;
    }
    inMemoryMessages = [];
    return [];
  } catch (err) {
    console.error("[TalkData] listTalkMessages error:", err);
    return inMemoryMessages;
  }
}

export async function createTalkMessage(
  text: string,
  tag: TalkMessageTag = "general"
): Promise<TalkMessage> {
  const cleanText = text.trim();
  const timestamp = Date.now();
  const id = `msg_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

  const messageRecord: TalkMessage = {
    id,
    text: cleanText,
    tag,
    createdAt: timestamp,
  };

  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection(TALK_COLLECTIONS.MESSAGES).doc(id).set(messageRecord);
    } catch (err) {
      console.error("[TalkData] createTalkMessage error:", err);
    }
  }

  inMemoryMessages.unshift(messageRecord);
  return messageRecord;
}

export async function deleteTalkMessage(messageId: string): Promise<boolean> {
  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection(TALK_COLLECTIONS.MESSAGES).doc(messageId).delete();
    } catch (err) {
      console.error("[TalkData] deleteTalkMessage error:", err);
    }
  }
  inMemoryMessages = inMemoryMessages.filter((m) => m.id !== messageId);
  return true;
}

export async function clearAllTalkMessages(): Promise<boolean> {
  const db = getAdminFirestore();
  if (db) {
    try {
      let snap = await db.collection(TALK_COLLECTIONS.MESSAGES).limit(500).get();
      while (!snap.empty) {
        const batch = db.batch();
        snap.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        if (snap.size < 500) break;
        snap = await db.collection(TALK_COLLECTIONS.MESSAGES).limit(500).get();
      }
    } catch (err) {
      console.error("[TalkData] clearAllTalkMessages error:", err);
    }
  }
  inMemoryMessages = [];
  return true;
}
